import type { Fund, CellData, FundBreakdown, VintageBreakdown } from '../types/calculator';

// Calculate IRR for a scenario
export function calculateIRR(multiple: number, years: number): string {
  if (isNaN(multiple) || isNaN(years) || years <= 0) return '0.0';
  if (multiple <= 0) return '-100.0';
  const irr = Math.pow(multiple, 1 / years) - 1;
  return (irr * 100).toFixed(1);
}

// Calculate carry for a fund
export function calculateFundCarry(fund: Fund, returns: number): number {
  const multiple = returns / fund.size;
  const profit = returns - fund.size;

  let carryRate = fund.carryPercent / 100;
  const sortedHurdles = [...fund.hurdles].sort((a, b) => a.multiple - b.multiple);

  for (const hurdle of sortedHurdles) {
    if (multiple >= hurdle.multiple) {
      carryRate = hurdle.carryPercent / 100;
    }
  }

  return carryRate * Math.max(0, profit);
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

// Get realization percentage at a given year
export function getRealizationAtYear(year: number, realizationCurve: number[]): number {
  if (year <= 0) return 0;
  if (year >= 10) return 1;

  const index = Math.floor(year);
  const fraction = year - index;

  const r1 = realizationCurve[index] || 0;
  const r2 = realizationCurve[index + 1] || 1;

  return r1 + (r2 - r1) * fraction;
}

// Calculate weighted realization
export function calculateWeightedRealization(
  yearsWorked: number,
  yearsFromToday: number,
  fundCycle: number,
  vestingPeriod: number,
  realizationCurve: number[]
): number {
  let weightedRealization = 0;
  let fundStartYear = 0;
  let fundIndex = 0;

  while (fundStartYear < yearsWorked && fundIndex < 20) {
    const yearsIntoThisFund = yearsWorked - fundStartYear;
    const vestingProgress = Math.min(yearsIntoThisFund / vestingPeriod, 1);

    if (vestingProgress > 0) {
      const yearsSinceFundStart = yearsFromToday - fundStartYear;
      const realizationPercent = getRealizationAtYear(yearsSinceFundStart, realizationCurve);
      weightedRealization += vestingProgress * realizationPercent;
    }

    fundStartYear += fundCycle;
    fundIndex++;
  }

  return weightedRealization;
}

// Main calculation function - generates cell data for one cell in the results table
export function calculateCell(
  yearsWorked: number,
  yearsFromToday: number,
  funds: Fund[],
  selectedScenarios: Record<number, number>
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

    // Handle NaN or invalid multiples - use default of 5x
    // Allow any non-negative multiple including < 1 (e.g., 0.8x for a loss)
    const multiple = isNaN(scenario.grossReturnMultiple) || scenario.grossReturnMultiple < 0 ? 5 : scenario.grossReturnMultiple;

    // Calculate total carry pool for this fund
    const returns = fund.size * multiple;
    const carry = calculateFundCarry(fund, returns);

    // Calculate per GP share for this fund
    const gpPoolShare = carry * (fund.carryPoolPercent / 100);
    const perGPShare = gpPoolShare / fund.numGPs;

    // Calculate vintage breakdowns
    const vintageBreakdowns: VintageBreakdown[] = [];
    let fundStartYear = 0;
    let vintageIndex = 0;

    while (fundStartYear < yearsWorked && vintageIndex < 20) {
      const yearsIntoThisVintage = yearsWorked - fundStartYear;
      const vestingProgress = Math.min(yearsIntoThisVintage / fund.vestingPeriod, 1);

      if (vestingProgress > 0 && yearsIntoThisVintage >= fund.cliffPeriod) {
        const yearsSinceVintageStart = yearsFromToday - fundStartYear;
        const realizationPercent = getRealizationAtYear(yearsSinceVintageStart, fund.realizationCurve);
        const vintageCarry = vestingProgress * realizationPercent * perGPShare;

        if (vintageCarry > 0.01) {
          vintageBreakdowns.push({
            vintage: vintageIndex + 1,
            yearsIn: Math.round(yearsIntoThisVintage * 10) / 10,
            realization: Math.round(realizationPercent * 100),
            amount: vintageCarry
          });
        }
      }

      fundStartYear += fund.fundCycle;
      vintageIndex++;
    }

    const totalFundCarry = vintageBreakdowns.reduce((sum, v) => sum + v.amount, 0);

    if (totalFundCarry > 0.01) {
      fundBreakdowns.push({
        name: fund.name,
        amount: totalFundCarry,
        vintages: vintageBreakdowns
      });
    }

    totalCarryForCell += totalFundCarry;
  });

  if (totalCarryForCell > 0.01) {
    return {
      total: totalCarryForCell,
      yearsWorked,
      yearsFromToday,
      fundBreakdowns
    };
  }

  return null;
}

// Calculate all cells in the results table
export function calculateAllCells(
  funds: Fund[],
  selectedScenarios: Record<number, number>,
  maxYears: number = 20
): (CellData | null)[][] {
  const results: (CellData | null)[][] = [];

  for (let yearsWorked = 1; yearsWorked <= maxYears; yearsWorked++) {
    const row: (CellData | null)[] = [];
    for (let yearsFromToday = 1; yearsFromToday <= maxYears; yearsFromToday++) {
      row.push(calculateCell(yearsWorked, yearsFromToday, funds, selectedScenarios));
    }
    results.push(row);
  }

  return results;
}
