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
// The curve has 11 points (0-10) which are scaled to match the fund's actual life
// If yearsToClear1X is set, the curve stays at 0 until that year, then compresses into remaining years
export function getRealizationAtYear(
  year: number,
  realizationCurve: number[],
  fundYears: number,
  yearsToClear1X: number = 0
): number {
  if (year <= 0) return 0;
  if (year >= fundYears) return 1;

  // If we haven't reached yearsToClear1X yet, no distributions
  if (year < yearsToClear1X) return 0;

  // Compress the curve into the remaining years after yearsToClear1X
  // Map [yearsToClear1X, fundYears] to [0, 10] on the curve
  const remainingYears = fundYears - yearsToClear1X;
  const yearsSinceClearing = year - yearsToClear1X;

  // Scale to curve position (curve goes from 0-10)
  const curvePosition = (yearsSinceClearing / remainingYears) * 10;
  const index = Math.floor(curvePosition);
  const fraction = curvePosition - index;

  const r1 = realizationCurve[index] ?? 0;
  const r2 = realizationCurve[index + 1] ?? 1;

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

    // Handle NaN or invalid multiples - use default of 5x
    // Allow any non-negative multiple including < 1 (e.g., 0.8x for a loss)
    const multiple = isNaN(scenario.grossReturnMultiple) || scenario.grossReturnMultiple < 0 ? 5 : scenario.grossReturnMultiple;

    // Calculate vintage breakdowns
    const vintageBreakdowns: VintageBreakdown[] = [];
    let fundStartYear = 0;
    let vintageIndex = 0;

    while (fundStartYear < yearsWorked && vintageIndex < 20) {
      const yearsIntoThisVintage = yearsWorked - fundStartYear;
      const vestingProgress = Math.min(yearsIntoThisVintage / fund.vestingPeriod, 1);

      if (vestingProgress > 0 && yearsIntoThisVintage >= fund.cliffPeriod) {
        const vintageAgeInYears = yearsFromToday - fundStartYear;

        // Get deployment percentage - only deployed capital generates returns
        const deploymentPercent = getDeploymentAtYear(vintageAgeInYears, fund.deploymentCurve, fund.years);

        // Calculate returns based on deployed capital only
        const deployedCapital = fund.size * deploymentPercent;
        const returns = deployedCapital * multiple;
        const carry = calculateFundCarry(fund, returns);

        // Calculate per GP share for this vintage
        const gpPoolShare = carry * (fund.carryPoolPercent / 100);
        const perGPShare = gpPoolShare / fund.numGPs;

        const realizationPercent = getRealizationAtYear(vintageAgeInYears, fund.realizationCurve, fund.years, fund.yearsToClear1X);

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

      fundStartYear += fund.fundCycle;
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
