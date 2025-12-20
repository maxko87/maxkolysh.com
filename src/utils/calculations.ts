import type { Fund, CellData, FundBreakdown, VintageBreakdown } from '../types/calculator';

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

// Calculate years to clear 1X based on gross multiple and realization curve
// Finds the year when realization% × returnMultiple = 1.0x (DPI crosses 1.0x)
export function calculateYearsToClear1X(
  grossMultiple: number,
  realizationCurve?: number[],
  fundYears?: number
): number {
  // If we have the realization curve, calculate precisely
  if (realizationCurve && fundYears) {
    // Handle edge cases
    if (grossMultiple < 1.0) return Infinity; // Zombies never clear

    // Find the year when realization% × returnMultiple = 1.0x
    // Need: realization% = 1.0 / returnMultiple
    const targetRealization = 1.0 / grossMultiple;

    if (targetRealization > 1.0) return Infinity; // Can't reach if target > 100%

    // Find what year this realization is reached on the curve
    for (let i = 0; i < 10; i++) {
      const yearStart = (i / 10) * fundYears;
      const yearEnd = ((i + 1) / 10) * fundYears;
      const realizationStart = realizationCurve[i] ?? 0;
      const realizationEnd = realizationCurve[i + 1] ?? 1;

      // Check if target realization is between these two points
      if (realizationStart <= targetRealization && targetRealization <= realizationEnd) {
        // Linear interpolation to find exact year
        if (realizationEnd === realizationStart) return yearStart;
        const fraction = (targetRealization - realizationStart) / (realizationEnd - realizationStart);
        const result = yearStart + fraction * (yearEnd - yearStart);
        return result;
      }
    }

    // If we haven't found it yet, it's beyond the curve
    return fundYears;
  }

  // Fallback: use benchmark data if curve not provided (for backwards compatibility)
  if (grossMultiple < 1.0) return Infinity;
  if (grossMultiple >= 10.0) return 3;

  const benchmarks = [
    { multiple: 1.0, years: 14 },
    { multiple: 1.3, years: 12 },
    { multiple: 2.1, years: 10 },
    { multiple: 3.5, years: 7 },
    { multiple: 5.0, years: 5 },
    { multiple: 6.5, years: 4 },
    { multiple: 8.0, years: 3.5 },
    { multiple: 10.0, years: 3 }
  ];

  for (let i = 0; i < benchmarks.length - 1; i++) {
    const lower = benchmarks[i];
    const upper = benchmarks[i + 1];

    if (grossMultiple >= lower.multiple && grossMultiple <= upper.multiple) {
      const ratio = (grossMultiple - lower.multiple) / (upper.multiple - lower.multiple);
      return lower.years + ratio * (upper.years - lower.years);
    }
  }

  return 14;
}

// Calculate carry for a fund
export function calculateFundCarry(fund: Fund, returns: number): number {
  // Use default values for NaN fields
  const fundSize = isNaN(fund.size) || !isFinite(fund.size) ? 200 : fund.size;
  const carryPercent = isNaN(fund.carryPercent) || !isFinite(fund.carryPercent) ? 20 : fund.carryPercent;

  const multiple = returns / fundSize;
  const profit = returns - fundSize;

  let carryRate = carryPercent / 100;
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
// The curve has 11 points (0-10) which are scaled to match the fund's actual life
// yearsToClear1X delays distributions until DPI = 1.0, then curve progresses normally (no compression)
export function getRealizationAtYear(
  year: number,
  realizationCurve: number[],
  fundYears: number,
  yearsToClear1X: number = 0
): number {
  if (year <= 0) return 0;

  // No distributions until we clear 1X
  if (year <= yearsToClear1X) return 0;

  // After clearing 1X, progress through the realization curve normally
  // NO COMPRESSION - just shift the curve forward
  const yearsAfterClearing = year - yearsToClear1X;
  const remainingYears = fundYears - yearsToClear1X;

  // If we've exceeded the fund life, we're fully realized
  if (remainingYears <= 0 || yearsAfterClearing >= remainingYears) return 1.0;

  // Map to curve position (0-10 scale)
  const curveProgress = yearsAfterClearing / remainingYears;
  const curvePosition = curveProgress * 10;

  // Clamp at end
  if (curvePosition >= 10) return 1.0;

  // Interpolate on curve
  const index = Math.floor(curvePosition);
  const fraction = curvePosition - index;

  const r1 = realizationCurve[Math.min(index, 10)] ?? 0;
  const r2 = realizationCurve[Math.min(index + 1, 10)] ?? 1;

  return r1 + (r2 - r1) * fraction;
}

// Get deployment percentage at a given year
// The curve has 11 points (0-10) which are scaled to match the fund's actual life
export function getDeploymentAtYear(
  year: number,
  deploymentCurve: number[],
  fundYears: number
): number {
  if (year <= 0) return 0;
  if (year >= fundYears) return 1;

  // Scale the year to curve position (curve goes from 0-10)
  const curvePosition = (year / fundYears) * 10;
  const index = Math.floor(curvePosition);
  const fraction = curvePosition - index;

  const d1 = deploymentCurve[index] ?? 0;
  const d2 = deploymentCurve[index + 1] ?? 1;

  return d1 + (d2 - d1) * fraction;
}

// Calculate weighted realization
export function calculateWeightedRealization(
  yearsWorked: number,
  yearsFromToday: number,
  fundCycle: number,
  vestingPeriod: number,
  realizationCurve: number[],
  fundYears: number,
  yearsToClear1X: number = 0
): number {
  let weightedRealization = 0;
  let fundStartYear = 0;
  let fundIndex = 0;

  while (fundStartYear < yearsWorked && fundIndex < 20) {
    const yearsIntoThisFund = yearsWorked - fundStartYear;
    const vestingProgress = Math.min(yearsIntoThisFund / vestingPeriod, 1);

    if (vestingProgress > 0) {
      const yearsSinceFundStart = yearsFromToday - fundStartYear;
      const realizationPercent = getRealizationAtYear(yearsSinceFundStart, realizationCurve, fundYears, yearsToClear1X);
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

    // Use default values for any NaN fund fields (matching placeholders)
    const fundSize = isNaN(fund.size) || !isFinite(fund.size) ? 200 : fund.size;
    const vestingPeriod = isNaN(fund.vestingPeriod) || !isFinite(fund.vestingPeriod) ? 4 : fund.vestingPeriod;
    const cliffPeriod = isNaN(fund.cliffPeriod) || !isFinite(fund.cliffPeriod) ? 1 : fund.cliffPeriod;
    const fundYears = isNaN(fund.years) || !isFinite(fund.years) ? 10 : fund.years;
    const carryAllocationPercent = isNaN(fund.carryAllocationPercent) || !isFinite(fund.carryAllocationPercent) ? 5 : fund.carryAllocationPercent;
    const fundCycle = isNaN(fund.fundCycle) || !isFinite(fund.fundCycle) ? 2 : fund.fundCycle;

    // Handle NaN or invalid multiples - use default of 5x
    // Allow any non-negative multiple including < 1 (e.g., 0.8x for a loss)
    const multiple = isNaN(scenario.grossReturnMultiple) || scenario.grossReturnMultiple < 0 ? 5 : scenario.grossReturnMultiple;

    // Calculate vintage breakdowns
    const vintageBreakdowns: VintageBreakdown[] = [];
    let fundStartYear = 0;
    let vintageIndex = 0;

    while (fundStartYear < yearsWorked && vintageIndex < 20) {
      const yearsIntoThisVintage = yearsWorked - fundStartYear;
      const vestingProgress = Math.min(yearsIntoThisVintage / vestingPeriod, 1);

      if (vestingProgress > 0 && yearsIntoThisVintage >= cliffPeriod) {
        const vintageAgeInYears = yearsFromToday - fundStartYear;

        // Get deployment percentage - only deployed capital generates returns
        const deploymentPercent = getDeploymentAtYear(vintageAgeInYears, fund.deploymentCurve, fundYears);

        // Calculate returns based on deployed capital only
        const deployedCapital = fundSize * deploymentPercent;
        const returns = deployedCapital * multiple;
        const carry = calculateFundCarry(fund, returns);

        // Calculate per GP share for this vintage
        const perGPShare = carry * (carryAllocationPercent / 100);

        // Auto-calculate yearsToClear1X from the scenario's return multiple and realization curve
        const yearsToClear = calculateYearsToClear1X(multiple, fund.realizationCurve, fundYears);

        const realizationPercent = getRealizationAtYear(vintageAgeInYears, fund.realizationCurve, fundYears, yearsToClear);

        // Total carry for this vintage before vesting
        const totalVintageCarry = realizationPercent * perGPShare;
        // Your vested fraction
        const vestedVintageCarry = vestingProgress * totalVintageCarry;

        // Always add vintage breakdown to explain why carry is zero (e.g., 0% realized)
        vintageBreakdowns.push({
          vintage: vintageIndex + 1,
          yearsIn: Math.round(vintageAgeInYears * 10) / 10,
          realization: Math.round(realizationPercent * 100),
          amount: vestedVintageCarry,
          totalCarry: totalVintageCarry,
          vestedCarry: vestedVintageCarry
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
