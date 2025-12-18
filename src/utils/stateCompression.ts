import type { CalculatorState, CompressedState, Fund } from '../types/calculator';

export function compressState(state: CalculatorState): string {
  try {
    const data: CompressedState = {
      f: state.funds.map(f => ({
        n: f.name,
        s: f.size,
        c: f.carryPercent,
        m: f.mgmtFeePercent,
        y: f.fundCycle,
        fy: f.years,
        h: f.hurdles,
        sc: f.scenarios.map(s => ({
          n: s.name,
          g: s.grossReturnMultiple
        })),
        gps: f.numGPs,
        cp: f.carryPoolPercent,
        vp: f.vestingPeriod,
        cl: f.cliffPeriod,
        rc: f.realizationCurve
      })),
      ss: state.selectedScenarios
    };

    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
  } catch (error) {
    console.error('Failed to compress state:', error);
    return '';
  }
}

export function decompressState(hash: string): CalculatorState | null {
  try {
    const json = decodeURIComponent(atob(hash));
    const data: CompressedState = JSON.parse(json);

    let maxScenarioId = 0;

    const funds: Fund[] = data.f.map((f, i) => {
      const scenarios = f.sc.map((s, j) => {
        const scenarioId = i * 100 + j;
        maxScenarioId = Math.max(maxScenarioId, scenarioId + 1);
        return {
          id: scenarioId,
          name: s.n,
          grossReturnMultiple: s.g
        };
      });

      return {
        id: i,
        name: f.n,
        size: f.s,
        carryPercent: f.c,
        mgmtFeePercent: f.m,
        fundCycle: f.y,
        hurdles: f.h,
        scenarios,
        numGPs: f.gps || 15,
        carryPoolPercent: f.cp || 80,
        vestingPeriod: f.vp || 4,
        cliffPeriod: f.cl || 1,
        realizationCurve: f.rc || [0, 0, 0.02, 0.05, 0.08, 0.12, 0.2, 0.35, 0.55, 0.8, 1.0],
        years: f.fy || 10
      };
    });

    // Restore selectedScenarios, or initialize with first scenario of each fund
    let selectedScenarios = data.ss || {};
    if (Object.keys(selectedScenarios).length === 0) {
      funds.forEach(fund => {
        selectedScenarios[fund.id] = fund.scenarios[0].id;
      });
    }

    return {
      funds,
      selectedScenarios
    };
  } catch (error) {
    console.error('Failed to decode hash:', error);
    return null;
  }
}

export function loadStateFromHash(): CalculatorState | null {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  return decompressState(hash);
}

export function updateHash(state: CalculatorState): void {
  const compressed = compressState(state);
  if (compressed) {
    window.history.replaceState(null, '', '#' + compressed);
  }
}
