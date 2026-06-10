import type { Fund, Scenario, CellData, DisplayMode, FundBreakdown, VintageBreakdown, VintageCalculationSteps, Hurdle } from '../types/calculator';
import { DEFAULT_BOW } from '../types/calculator';
import { getTASchedule, interpolateSchedule } from './taModel';

// Calculate IRR for a scenario
export function calculateIRR(multiple: number, years: number): string {
  if (isNaN(multiple) || isNaN(years) || years <= 0) return '0.0';
  if (multiple < 0) return '-100.0';
  if (multiple === 0) return '-100.0';
  const irr = Math.pow(multiple, 1 / years) - 1;
  return (irr * 100).toFixed(1);
}

// Calculate multiple from IRR
export function calculateMultipleFromIRR(irrPercent: number, years: number): number {
  if (isNaN(irrPercent) || isNaN(years) || years <= 0) return 1;
  const irr = irrPercent / 100;
  return Math.pow(1 + irr, years);
}

/**
 * Calculate carry using incremental hurdle logic.
 * Each profit band gets its corresponding carry rate.
 *
 * Example: $100M fund at 3x with hurdles [2x/25%, 3x/30%], base 20%
 * - Band 1x-2x: $100M × 20% = $20M
 * - Band 2x-3x: $100M × 25% = $25M
 * - Total carry: $45M
 */
function calculateIncrementalCarry(
  fundSize: number,
  totalReturns: number,
  baseCarryPercent: number,
  sortedHurdles: Hurdle[]
): { totalCarry: number; bands: Array<{ fromMultiple: number; toMultiple: number; profitInBand: number; carryRate: number; carryAmount: number }> } {
  const profit = totalReturns - fundSize;
  if (profit <= 0) return { totalCarry: 0, bands: [] };

  const multiple = totalReturns / fundSize;
  let totalCarry = 0;
  const resultBands: Array<{ fromMultiple: number; toMultiple: number; profitInBand: number; carryRate: number; carryAmount: number }> = [];

  // Create bands: [{ fromMultiple, toMultiple, ratePercent }]
  const bands: Array<{ fromMultiple: number; toMultiple: number; ratePercent: number }> = [];

  // First band: 1x to first hurdle (or infinity if no hurdles)
  let prevMultiple = 1.0;
  let prevRate = baseCarryPercent;

  for (const hurdle of sortedHurdles) {
    bands.push({
      fromMultiple: prevMultiple,
      toMultiple: hurdle.multiple,
      ratePercent: prevRate
    });
    prevMultiple = hurdle.multiple;
    prevRate = hurdle.carryPercent;
  }

  // Last band: from last hurdle to infinity
  bands.push({
    fromMultiple: prevMultiple,
    toMultiple: Infinity,
    ratePercent: prevRate
  });

  // Calculate carry for each band crossed
  for (const band of bands) {
    if (multiple <= band.fromMultiple) break;

    const effectiveToMultiple = Math.min(multiple, band.toMultiple);
    const profitInBand = fundSize * (effectiveToMultiple - band.fromMultiple);
    const carryInBand = profitInBand * (band.ratePercent / 100);

    totalCarry += carryInBand;

    // Only add bands that were actually crossed (profitInBand > 0)
    if (profitInBand > 0) {
      resultBands.push({
        fromMultiple: band.fromMultiple,
        toMultiple: effectiveToMultiple,
        profitInBand,
        carryRate: band.ratePercent,
        carryAmount: carryInBand
      });
    }

    if (multiple <= band.toMultiple) break;
  }

  return { totalCarry, bands: resultBands };
}

// Calculate carry for a fund
export function calculateFundCarry(fund: Fund, returns: number): number {
  // Use default values for NaN fields
  const fundSize = isNaN(fund.size) || !isFinite(fund.size) ? 200 : fund.size;
  const carryPercent = isNaN(fund.carryPercent) || !isFinite(fund.carryPercent) ? 20 : fund.carryPercent;

  const sortedHurdles = [...fund.hurdles].sort((a, b) => a.multiple - b.multiple);
  return calculateIncrementalCarry(fundSize, returns, carryPercent, sortedHurdles).totalCarry;
}

// Calculate vesting
export function calculateVesting(
  yearsWorked: number,
  fundCycle: number,
  vestingPeriod: number,
  cliffPeriod: number
): number {
  if (yearsWorked < cliffPeriod) return 0;

  let totalVesting = 0;
  let fundStartYear = 0;
  let fundIndex = 0;

  while (fundStartYear < yearsWorked && fundIndex < 20) {
    const yearsIntoThisFund = yearsWorked - fundStartYear;
    const vestingProgress = Math.min(yearsIntoThisFund / vestingPeriod, 1);
    totalVesting += Math.max(0, vestingProgress);

    fundStartYear += fundCycle;
    fundIndex++;
  }

  return totalVesting;
}

// Get deployment percentage at a given year
// The curve has 11 points (0-10) which are scaled to match the fund's actual life
export function getDeploymentAtYear(
  year: number,
  deploymentCurve: number[],
  deploymentTimeline: number
): number {
  if (year <= 0) return 0;
  if (year >= deploymentTimeline) return 1;

  // Scale the year to curve position (curve goes from 0-10)
  const curvePosition = (year / deploymentTimeline) * 10;
  const index = Math.floor(curvePosition);
  const fraction = curvePosition - index;

  const d1 = deploymentCurve[index] ?? 0;
  const d2 = deploymentCurve[index + 1] ?? 1;

  return d1 + (d2 - d1) * fraction;
}

// Calculate detailed steps for a single vintage (for math visibility)
// This function exposes every intermediate calculation step
export function calculateVintageSteps(
  fund: Fund,
  scenario: Scenario,
  vintageIndex: number,
  yearsWorked: number,
  yearsFromToday: number,
  displayMode: DisplayMode = 'dpi'
): VintageCalculationSteps {
  // Use default values for any NaN fund fields
  const fundSize = isNaN(fund.size) || !isFinite(fund.size) ? 200 : fund.size;
  const vestingPeriod = isNaN(fund.vestingPeriod) || !isFinite(fund.vestingPeriod) ? 4 : fund.vestingPeriod;
  const cliffPeriod = isNaN(fund.cliffPeriod) || !isFinite(fund.cliffPeriod) ? 1 : fund.cliffPeriod;
  const fundYears = isNaN(fund.years) || !isFinite(fund.years) ? 10 : fund.years;
  const deploymentTimeline = isNaN(fund.deploymentTimeline) || !isFinite(fund.deploymentTimeline) ? 2.5 : fund.deploymentTimeline;
  const carryAllocationPercent = isNaN(fund.carryAllocationPercent) || !isFinite(fund.carryAllocationPercent) ? 5 : fund.carryAllocationPercent;
  const fundCycle = isNaN(fund.fundCycle) || !isFinite(fund.fundCycle) ? 2 : fund.fundCycle;
  const baseCarryPercent = isNaN(fund.carryPercent) || !isFinite(fund.carryPercent) ? 20 : fund.carryPercent;
  const multiple = isNaN(scenario.grossReturnMultiple) || scenario.grossReturnMultiple < 0 ? 3 : scenario.grossReturnMultiple;

  // Calculate vintage timing
  const fundStartYear = vintageIndex * fundCycle;
  // vintageAgeInYears is how old this vintage is at the point we're calculating
  // yearsFromToday already represents years from the base year (vintage year for historic funds, current year for new funds)
  const vintageAgeInYears = yearsFromToday - fundStartYear;
  const yearsIntoThisVintage = yearsWorked - fundStartYear;

  const bow = isNaN(fund.bow) || !isFinite(fund.bow) || fund.bow <= 0 ? DEFAULT_BOW : fund.bow;

  // Deployment percentage (also the TA contribution schedule)
  const deploymentPercent = getDeploymentAtYear(vintageAgeInYears, fund.deploymentCurve, deploymentTimeline);

  // Takahashi-Alexander schedule: NAV marks and cumulative distributions over the
  // fund life, with growth solved to hit the scenario's terminal multiple
  const schedule = getTASchedule({
    fundSize,
    multiple,
    years: fundYears,
    bow,
    deploymentCurve: fund.deploymentCurve,
    deploymentTimeline,
  });
  const cumDistributions = interpolateSchedule(schedule.cumDistributions, vintageAgeInYears);
  const navNow = interpolateSchedule(schedule.nav, vintageAgeInYears);

  // Calculate vesting
  const vestingProgress = Math.min(yearsIntoThisVintage / vestingPeriod, 1);
  const cliffMet = yearsIntoThisVintage >= cliffPeriod;

  // MATH FLOW - Step by step calculations (this is the key for math visibility!)

  // Step 1: Calculate deployed capital
  const deployedCapital = fundSize * deploymentPercent;

  // Step 2: Calculate gross returns
  const grossReturns = deployedCapital * multiple;

  // Step 3: Calculate actual multiple on fund size
  const actualMultiple = grossReturns / fundSize;

  // Step 4: Calculate fund profit
  const fundProfit = Math.max(0, grossReturns - fundSize);

  // Step 5 & 6: Calculate total fund carry (with incremental hurdles)
  const sortedHurdles = [...fund.hurdles].sort((a, b) => a.multiple - b.multiple);
  const { totalCarry: totalFundCarry, bands: carryBands } = calculateIncrementalCarry(fundSize, grossReturns, baseCarryPercent, sortedHurdles);

  // Calculate effective carry rate for display (as decimal, e.g., 0.20 for 20%)
  const effectiveCarryRate = fundProfit > 0 ? totalFundCarry / fundProfit : baseCarryPercent / 100;

  // European waterfall on the TA schedule:
  // 'dpi' — carry on cash actually distributed to date (zero until cumulative
  // distributions return the fund); 'tvpi' — carry accrued on total value
  // (distributions + current NAV marks), i.e. paper carry
  const carryBasis = displayMode === 'tvpi' ? cumDistributions + navNow : cumDistributions;
  const { totalCarry: realizedFundCarry } = calculateIncrementalCarry(fundSize, Math.min(carryBasis, grossReturns), baseCarryPercent, sortedHurdles);

  // Fraction of the terminal carry pool realized so far (folds the waterfall's
  // non-linearity into one number so pool × realization% = realized holds exactly)
  const realizationPercent = totalFundCarry > 0 ? realizedFundCarry / totalFundCarry : 0;

  // Step 7: Calculate your share of carry pool
  const yourCarryPoolShare = totalFundCarry * (carryAllocationPercent / 100);

  // Step 8: Apply realization percentage
  const realizedCarry = yourCarryPoolShare * realizationPercent;

  // Step 9: Apply vesting (if cliff is met)
  const yourVestedCarry = cliffMet ? realizedCarry * vestingProgress : 0;

  return {
    // Inputs
    fundSize,
    deploymentPercent,
    realizationPercent,
    grossReturnMultiple: multiple,
    baseCarryPercent,
    effectiveCarryRate,
    carryAllocationPercent,
    vestingProgress,
    cliffMet,
    yearsToClear1X: schedule.yearsTo1X,
    vintageAgeInYears,
    yearsIntoThisVintage,

    // Calculated steps
    deployedCapital,
    grossReturns,
    actualMultiple,
    fundProfit,
    totalFundCarry,
    yourCarryPoolShare,
    realizedCarry,
    yourVestedCarry,

    // Incremental hurdle breakdown (only populated if hurdles exist and profit > 0)
    carryBands: carryBands.length > 0 ? carryBands : undefined,
  };
}

// Main calculation function - generates cell data for one cell in the results table
export function calculateCell(
  yearsWorked: number,
  yearsFromToday: number,
  funds: Fund[],
  selectedScenarios: Record<number, number>,
  displayMode: DisplayMode = 'dpi'
): CellData | null {
  if (yearsFromToday < yearsWorked) {
    return null;
  }

  let totalCarryForCell = 0;
  const fundBreakdowns: FundBreakdown[] = [];

  funds.forEach(fund => {
    // Use selected scenario for this fund
    const selectedScenarioId = selectedScenarios[fund.id];
    const scenario = fund.scenarios.find(s => s.id === selectedScenarioId) || fund.scenarios[0];
    if (!scenario) return;

    // Use default values for any NaN fund fields (matching placeholders)
    const vestingPeriod = isNaN(fund.vestingPeriod) || !isFinite(fund.vestingPeriod) ? 4 : fund.vestingPeriod;
    const cliffPeriod = isNaN(fund.cliffPeriod) || !isFinite(fund.cliffPeriod) ? 1 : fund.cliffPeriod;
    const fundCycle = isNaN(fund.fundCycle) || !isFinite(fund.fundCycle) ? 2 : fund.fundCycle;

    // Calculate vintage breakdowns using the centralized calculateVintageSteps function
    const vintageBreakdowns: VintageBreakdown[] = [];
    let fundStartYear = 0;
    let vintageIndex = 0;

    while (fundStartYear < yearsWorked && vintageIndex < 20) {
      const yearsIntoThisVintage = yearsWorked - fundStartYear;
      const vestingProgress = Math.min(yearsIntoThisVintage / vestingPeriod, 1);

      if (vestingProgress > 0 && yearsIntoThisVintage >= cliffPeriod) {
        // Use calculateVintageSteps for all calculations (single source of truth!)
        const steps = calculateVintageSteps(fund, scenario, vintageIndex, yearsWorked, yearsFromToday, displayMode);

        // Always add vintage breakdown to explain why carry is zero (e.g., 0% realized)
        vintageBreakdowns.push({
          vintage: vintageIndex + 1,
          yearsIn: Math.round(steps.vintageAgeInYears * 10) / 10,
          realization: Math.round(steps.realizationPercent * 100),
          amount: steps.yourVestedCarry,
          totalCarry: steps.realizedCarry,
          vestedCarry: steps.yourVestedCarry
        });
      }

      // If not raising continuously, only calculate for the first fund
      if (!fund.raiseContinuously) {
        break;
      }

      fundStartYear += fundCycle;
      vintageIndex++;
    }

    const totalFundCarry = vintageBreakdowns.reduce((sum, v) => sum + v.amount, 0);

    // Always add fund breakdown if there are vintages, even if carry is zero
    if (vintageBreakdowns.length > 0) {
      fundBreakdowns.push({
        name: fund.name,
        amount: totalFundCarry,
        vintages: vintageBreakdowns
      });
    }

    totalCarryForCell += totalFundCarry;
  });

  // Return data even for zero/small values so we can distinguish from invalid cells
  return {
    total: totalCarryForCell,
    yearsWorked,
    yearsFromToday,
    fundBreakdowns
  };
}

// Calculate all cells in the results table
export function calculateAllCells(
  funds: Fund[],
  selectedScenarios: Record<number, number>,
  maxYears: number = 20,
  displayMode: DisplayMode = 'dpi'
): (CellData | null)[][] {
  const results: (CellData | null)[][] = [];

  for (let yearsWorked = 1; yearsWorked <= maxYears; yearsWorked++) {
    const row: (CellData | null)[] = [];
    for (let yearsFromToday = 1; yearsFromToday <= maxYears; yearsFromToday++) {
      row.push(calculateCell(yearsWorked, yearsFromToday, funds, selectedScenarios, displayMode));
    }
    results.push(row);
  }

  return results;
}
