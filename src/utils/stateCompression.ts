import type { CalculatorState, Fund } from '../types/calculator';
import { CURVE_PRESETS, DEFAULT_REALIZATION_CURVE, DEPLOYMENT_PRESETS, DEFAULT_DEPLOYMENT_CURVE, DEFAULT_DEPLOYMENT_TIMELINE, DEFAULT_YEARS_TO_CLEAR_1X } from '../types/calculator';

export function compressState(state: CalculatorState): string {
  try {
    const params = new URLSearchParams();

    state.funds.forEach((fund, idx) => {
      const prefix = `f${idx + 1}`;

      // Basic fund info
      params.set(`${prefix}_name`, fund.name);
      params.set(`${prefix}_size`, fund.size.toString());
      params.set(`${prefix}_carry`, fund.carryPercent.toString());
      params.set(`${prefix}_mgmt`, fund.mgmtFeePercent.toString());
      params.set(`${prefix}_life`, fund.years.toString());
      params.set(`${prefix}_deploy_timeline`, fund.deploymentTimeline.toString());
      params.set(`${prefix}_alloc`, fund.carryAllocationPercent.toString());
      params.set(`${prefix}_vest`, fund.vestingPeriod.toString());
      params.set(`${prefix}_cliff`, fund.cliffPeriod.toString());
      params.set(`${prefix}_continuous`, fund.raiseContinuously ? '1' : '0');

      if (fund.raiseContinuously) {
        params.set(`${prefix}_cycle`, fund.fundCycle.toString());
      }

      // Hurdles: format as "multiple_carry" (e.g., "2_25" for 2x multiple, 25% carry)
      fund.hurdles.forEach((hurdle, hIdx) => {
        params.set(`${prefix}_h${hIdx + 1}`, `${hurdle.multiple}_${hurdle.carryPercent}`);
      });

      // Scenarios: format as "name:multiple" (e.g., "Base_Case:5")
      fund.scenarios.forEach((scenario, sIdx) => {
        const scenarioName = scenario.name.replace(/\s+/g, '_');
        params.set(`${prefix}_s${sIdx + 1}`, `${scenarioName}:${scenario.grossReturnMultiple}`);
      });

      // Realization schedule: detect preset or store custom
      const curvePreset = Object.entries(CURVE_PRESETS).find(([_, curve]) =>
        JSON.stringify(curve) === JSON.stringify(fund.realizationCurve)
      );

      if (curvePreset) {
        params.set(`${prefix}_curve`, curvePreset[0]);
      } else {
        // Store custom curve as comma-separated values
        params.set(`${prefix}_curve`, fund.realizationCurve.join(','));
      }

      // Deployment curve: detect preset or store custom
      const deploymentPreset = Object.entries(DEPLOYMENT_PRESETS).find(([_, curve]) =>
        JSON.stringify(curve) === JSON.stringify(fund.deploymentCurve)
      );

      if (deploymentPreset) {
        params.set(`${prefix}_deploy`, deploymentPreset[0]);
      } else {
        // Store custom curve as comma-separated values
        params.set(`${prefix}_deploy`, fund.deploymentCurve.join(','));
      }

      // Years to clear 1X
      params.set(`${prefix}_y1x`, fund.yearsToClear1X.toString());

      // Selected scenario for this fund
      const selectedScenarioId = state.selectedScenarios[fund.id];
      const selectedScenarioIdx = fund.scenarios.findIndex(s => s.id === selectedScenarioId);
      if (selectedScenarioIdx > 0) {
        params.set(`${prefix}_selected`, (selectedScenarioIdx + 1).toString());
      }
    });

    return params.toString();
  } catch (error) {
    console.error('Failed to compress state:', error);
    return '';
  }
}

export function decompressState(queryString: string): CalculatorState | null {
  try {
    // Try new format first
    const params = new URLSearchParams(queryString);

    // Detect if it's the old base64 format (no '=' in query params indicates old format)
    if (!queryString.includes('=')) {
      // Old format - try to decode
      try {
        const json = decodeURIComponent(atob(queryString));
        const data = JSON.parse(json);

        // Convert old format to new format
        const funds: Fund[] = data.f.map((f: any, i: number) => {
          const scenarios = f.sc.map((s: any, j: number) => ({
            id: i * 100 + j,
            name: s.n,
            grossReturnMultiple: s.g
          }));

          return {
            id: i,
            name: f.n,
            size: f.s,
            carryPercent: f.c,
            mgmtFeePercent: f.m,
            fundCycle: f.y,
            hurdles: f.h,
            scenarios,
            carryAllocationPercent: f.ca || 5,
            vestingPeriod: f.vp || 4,
            cliffPeriod: f.cl || 1,
            realizationCurve: f.rc || [...DEFAULT_REALIZATION_CURVE],
            deploymentCurve: f.dc || [...DEFAULT_DEPLOYMENT_CURVE],
            deploymentTimeline: f.dt ?? DEFAULT_DEPLOYMENT_TIMELINE,
            yearsToClear1X: f.y1x || DEFAULT_YEARS_TO_CLEAR_1X,
            years: f.fy || 10,
            raiseContinuously: f.rco !== undefined ? f.rco : true
          };
        });

        let selectedScenarios = data.ss || {};
        if (Object.keys(selectedScenarios).length === 0) {
          funds.forEach(fund => {
            selectedScenarios[fund.id] = fund.scenarios[0].id;
          });
        }

        return { funds, selectedScenarios };
      } catch {
        return null;
      }
    }

    // New format parsing
    const funds: Fund[] = [];
    const selectedScenarios: Record<number, number> = {};

    // Find all fund indices
    const fundIndices = new Set<number>();
    for (const key of params.keys()) {
      const match = key.match(/^f(\d+)_/);
      if (match) {
        fundIndices.add(parseInt(match[1]));
      }
    }

    const sortedIndices = Array.from(fundIndices).sort((a, b) => a - b);

    sortedIndices.forEach((fundIdx, arrayIdx) => {
      const prefix = `f${fundIdx}`;

      // Parse hurdles
      const hurdles = [];
      let hIdx = 1;
      while (params.has(`${prefix}_h${hIdx}`)) {
        const [multiple, carryPercent] = params.get(`${prefix}_h${hIdx}`)!.split('_').map(parseFloat);
        hurdles.push({ multiple, carryPercent });
        hIdx++;
      }

      // Parse scenarios
      const scenarios = [];
      let sIdx = 1;
      while (params.has(`${prefix}_s${sIdx}`)) {
        const [name, multiple] = params.get(`${prefix}_s${sIdx}`)!.split(':');
        scenarios.push({
          id: arrayIdx * 100 + sIdx - 1,
          name: name.replace(/_/g, ' '),
          grossReturnMultiple: parseFloat(multiple)
        });
        sIdx++;
      }

      // Parse realization schedule
      const curveParam = params.get(`${prefix}_curve`) || 'standard';
      let realizationCurve: number[];
      if (curveParam in CURVE_PRESETS) {
        realizationCurve = [...CURVE_PRESETS[curveParam as keyof typeof CURVE_PRESETS]];
      } else {
        realizationCurve = curveParam.split(',').map(parseFloat);
      }

      // Parse deployment curve
      const deployParam = params.get(`${prefix}_deploy`) || 'linear';
      let deploymentCurve: number[];
      if (deployParam in DEPLOYMENT_PRESETS) {
        deploymentCurve = [...DEPLOYMENT_PRESETS[deployParam as keyof typeof DEPLOYMENT_PRESETS]];
      } else {
        deploymentCurve = deployParam.split(',').map(parseFloat);
      }

      const continuous = params.get(`${prefix}_continuous`) === '1';

      const fund: Fund = {
        id: arrayIdx,
        name: params.get(`${prefix}_name`) || `Fund ${fundIdx}`,
        size: parseFloat(params.get(`${prefix}_size`) || '200'),
        carryPercent: parseFloat(params.get(`${prefix}_carry`) || '20'),
        mgmtFeePercent: parseFloat(params.get(`${prefix}_mgmt`) || '2'),
        fundCycle: parseFloat(params.get(`${prefix}_cycle`) || '2'),
        years: parseFloat(params.get(`${prefix}_life`) || '10'),
        deploymentTimeline: parseFloat(params.get(`${prefix}_deploy_timeline`) || DEFAULT_DEPLOYMENT_TIMELINE.toString()),
        hurdles,
        scenarios: scenarios.length > 0 ? scenarios : [{ id: arrayIdx * 100, name: 'Base Case', grossReturnMultiple: 3 }],
        carryAllocationPercent: parseFloat(params.get(`${prefix}_alloc`) || '5'),
        vestingPeriod: parseFloat(params.get(`${prefix}_vest`) || '4'),
        cliffPeriod: parseFloat(params.get(`${prefix}_cliff`) || '1'),
        realizationCurve,
        deploymentCurve,
        yearsToClear1X: parseFloat(params.get(`${prefix}_y1x`) || DEFAULT_YEARS_TO_CLEAR_1X.toString()),
        raiseContinuously: continuous
      };

      funds.push(fund);

      // Set selected scenario
      const selectedIdx = parseInt(params.get(`${prefix}_selected`) || '1') - 1;
      selectedScenarios[arrayIdx] = fund.scenarios[selectedIdx]?.id || fund.scenarios[0].id;
    });

    if (funds.length === 0) {
      return null;
    }

    return { funds, selectedScenarios };
  } catch (error) {
    console.error('Failed to decode query string:', error);
    return null;
  }
}

export function loadStateFromHash(): CalculatorState | null {
  // Try loading from query params first (new format)
  const queryString = window.location.search.substring(1);
  if (queryString) {
    const result = decompressState(queryString);
    if (result) return result;
  }

  // Fall back to hash format (old format for backwards compatibility)
  const hash = window.location.hash.substring(1);
  if (hash) {
    return decompressState(hash);
  }

  return null;
}

export function updateHash(state: CalculatorState): void {
  const compressed = compressState(state);
  if (compressed) {
    const url = window.location.pathname + '?' + compressed;
    window.history.replaceState(null, '', url);
  }
}
