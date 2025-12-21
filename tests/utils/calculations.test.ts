import { describe, it, expect } from 'vitest'
import {
  calculateIRR,
  calculateMultipleFromIRR,
  calculateYearsToClear1X,
  getRealizationAtYear,
  getDeploymentAtYear,
  calculateVesting,
  calculateFundCarry,
  calculateVintageSteps,
  calculateCell,
  calculateAllCells
} from '../../src/utils/calculations'
import { CURVE_PRESETS, DEPLOYMENT_PRESETS } from '../../src/types/calculator'
import { mockFund, mockScenario, mockFundWithHurdles } from '../../src/test/mockData'

describe('IRR Calculations', () => {
  describe('calculateIRR', () => {
    describe('basic functionality', () => {
      it('should calculate IRR for 3x in 5 years', () => {
        expect(calculateIRR(3, 5)).toBe('24.6')
      })

      it('should calculate IRR for 2x in 3 years', () => {
        expect(calculateIRR(2, 3)).toBe('26.0')
      })

      it('should handle 1x (no return)', () => {
        expect(calculateIRR(1, 10)).toBe('0.0')
      })
    })

    describe('edge cases', () => {
      it('should handle zero multiple', () => {
        expect(calculateIRR(0, 10)).toBe('-100.0')
      })

      it('should handle negative multiple', () => {
        expect(calculateIRR(-1, 10)).toBe('-100.0')
      })

      it('should handle zero years', () => {
        expect(calculateIRR(3, 0)).toBe('0.0')
      })

      it('should handle negative years', () => {
        expect(calculateIRR(3, -5)).toBe('0.0')
      })

      it('should handle NaN multiple', () => {
        expect(calculateIRR(NaN, 5)).toBe('0.0')
      })

      it('should handle NaN years', () => {
        expect(calculateIRR(3, NaN)).toBe('0.0')
      })
    })
  })

  describe('calculateMultipleFromIRR', () => {
    describe('basic functionality', () => {
      it('should convert 20% IRR over 5 years to multiple', () => {
        const multiple = calculateMultipleFromIRR(20, 5)
        expect(multiple).toBeCloseTo(2.488, 2)
      })

      it('should convert 0% IRR to 1x', () => {
        expect(calculateMultipleFromIRR(0, 10)).toBe(1)
      })

      it('should handle negative IRR', () => {
        const multiple = calculateMultipleFromIRR(-50, 5)
        expect(multiple).toBeCloseTo(0.03125, 4)
      })
    })

    describe('edge cases', () => {
      it('should handle NaN IRR', () => {
        expect(calculateMultipleFromIRR(NaN, 5)).toBe(1)
      })

      it('should handle zero years', () => {
        expect(calculateMultipleFromIRR(20, 0)).toBe(1)
      })

      it('should handle negative years', () => {
        expect(calculateMultipleFromIRR(20, -5)).toBe(1)
      })
    })

    describe('round-trip consistency', () => {
      it('should round-trip: IRR -> Multiple -> IRR', () => {
        const originalIRR = 25
        const years = 7
        const multiple = calculateMultipleFromIRR(originalIRR, years)
        const calculatedIRR = parseFloat(calculateIRR(multiple, years))
        expect(calculatedIRR).toBeCloseTo(originalIRR, 1)
      })
    })
  })
})

describe('Years to Clear 1X', () => {
  const standardCurve = CURVE_PRESETS.standard
  const fundYears = 10

  describe('with realization curve', () => {
    it('should calculate for 2x multiple (50% realization)', () => {
      const years = calculateYearsToClear1X(2, standardCurve, fundYears)
      expect(years).toBeGreaterThan(6)
      expect(years).toBeLessThan(8)
    })

    it('should calculate for 3x multiple (33.3% realization)', () => {
      const years = calculateYearsToClear1X(3, standardCurve, fundYears)
      expect(years).toBeGreaterThan(5)
      expect(years).toBeLessThan(7)
    })

    it('should handle zombie fund (< 1x)', () => {
      expect(calculateYearsToClear1X(0.5, standardCurve, fundYears)).toBe(Infinity)
    })

    it('should handle 1x fund exactly', () => {
      expect(calculateYearsToClear1X(1.0, standardCurve, fundYears)).toBe(fundYears)
    })

    it('should handle very high multiples (10x+)', () => {
      const years = calculateYearsToClear1X(10, standardCurve, fundYears)
      expect(years).toBeLessThan(5)
    })

    it('should interpolate correctly between curve points', () => {
      // 4x needs 25% realization, which is at index 6 = 6 years
      const years = calculateYearsToClear1X(4, standardCurve, fundYears)
      expect(years).toBeCloseTo(6, 1)
    })
  })

  describe('with fast realization curve', () => {
    const fastCurve = CURVE_PRESETS.fast

    it('should clear faster with fast curve', () => {
      const standardTime = calculateYearsToClear1X(3, standardCurve, fundYears)
      const fastTime = calculateYearsToClear1X(3, fastCurve, fundYears)
      expect(fastTime).toBeLessThan(standardTime)
    })
  })

  describe('fallback to benchmark data', () => {
    it('should use fallback when no curve provided', () => {
      expect(calculateYearsToClear1X(1.0)).toBe(14)
      expect(calculateYearsToClear1X(3.5)).toBe(7)
      expect(calculateYearsToClear1X(10.0)).toBe(3)
    })
  })

  describe('edge cases', () => {
    it('should handle negative multiple', () => {
      expect(calculateYearsToClear1X(-1, standardCurve, fundYears)).toBe(Infinity)
    })

    it('should handle zero fund years', () => {
      // With zero fund years, falls back to benchmark data
      const years = calculateYearsToClear1X(3, standardCurve, 0)
      expect(years).toBeGreaterThan(0)
    })
  })
})

describe('Realization & Deployment Curves', () => {
  describe('getRealizationAtYear', () => {
    const standardCurve = CURVE_PRESETS.standard
    const fundYears = 10

    describe('without yearsToClear1X delay', () => {
      it('should return 0 at year 0', () => {
        expect(getRealizationAtYear(0, standardCurve, fundYears)).toBe(0)
      })

      it('should return 0 for negative years', () => {
        expect(getRealizationAtYear(-5, standardCurve, fundYears)).toBe(0)
      })

      it('should return exact curve value at year 5 (50% through)', () => {
        expect(getRealizationAtYear(5, standardCurve, fundYears)).toBe(0.15)
      })

      it('should return 1.0 at fund end', () => {
        expect(getRealizationAtYear(10, standardCurve, fundYears)).toBe(1.0)
      })

      it('should return 1.0 beyond fund end', () => {
        expect(getRealizationAtYear(15, standardCurve, fundYears)).toBe(1.0)
      })

      it('should interpolate between curve points', () => {
        // Year 7.5 between curve[7]=0.40 and curve[8]=0.60 = 0.50
        const realization = getRealizationAtYear(7.5, standardCurve, fundYears)
        expect(realization).toBeCloseTo(0.50, 3)
      })
    })

    describe('with yearsToClear1X delay', () => {
      const yearsToClear = 5

      it('should return 0 before clearing 1X', () => {
        expect(getRealizationAtYear(3, standardCurve, fundYears, yearsToClear)).toBe(0)
        expect(getRealizationAtYear(5, standardCurve, fundYears, yearsToClear)).toBe(0)
      })

      it('should start curve after clearing 1X', () => {
        const realization = getRealizationAtYear(6, standardCurve, fundYears, yearsToClear)
        expect(realization).toBeGreaterThan(0)
        expect(realization).toBeLessThan(0.10)
      })

      it('should reach full realization by fund end', () => {
        expect(getRealizationAtYear(fundYears, standardCurve, fundYears, yearsToClear)).toBe(1.0)
      })

      it('should handle delay equal to fund life', () => {
        // When yearsToClear=10 and fundYears=10, at year 10 we're still at the clearing point
        // Code checks year <= yearsToClear, so returns 0
        expect(getRealizationAtYear(10, standardCurve, fundYears, 10)).toBe(0)
        // Beyond that point should be fully realized
        expect(getRealizationAtYear(11, standardCurve, fundYears, 10)).toBe(1.0)
      })
    })
  })

  describe('getDeploymentAtYear', () => {
    const linearCurve = DEPLOYMENT_PRESETS.linear
    const deploymentTimeline = 2.5

    describe('basic functionality', () => {
      it('should return 0 at year 0', () => {
        expect(getDeploymentAtYear(0, linearCurve, deploymentTimeline)).toBe(0)
      })

      it('should return 0 for negative years', () => {
        expect(getDeploymentAtYear(-1, linearCurve, deploymentTimeline)).toBe(0)
      })

      it('should return 1.0 at deployment end', () => {
        expect(getDeploymentAtYear(2.5, linearCurve, deploymentTimeline)).toBe(1.0)
      })

      it('should return 1.0 beyond deployment end', () => {
        expect(getDeploymentAtYear(5, linearCurve, deploymentTimeline)).toBe(1.0)
      })

      it('should return 50% at midpoint of linear curve', () => {
        expect(getDeploymentAtYear(1.25, linearCurve, deploymentTimeline)).toBe(0.5)
      })
    })

    describe('fast deployment curve', () => {
      const fastCurve = DEPLOYMENT_PRESETS.fast

      it('should deploy faster than linear', () => {
        const year = 1.0
        const linearDeploy = getDeploymentAtYear(year, linearCurve, deploymentTimeline)
        const fastDeploy = getDeploymentAtYear(year, fastCurve, deploymentTimeline)
        expect(fastDeploy).toBeGreaterThan(linearDeploy)
      })
    })
  })
})

describe('Vesting Calculation', () => {
  describe('single fund (no continuous raising)', () => {
    const vestingPeriod = 4
    const cliffPeriod = 1
    const fundCycle = 20 // Large number to prevent second fund

    it('should return 0 before cliff', () => {
      expect(calculateVesting(0.5, fundCycle, vestingPeriod, cliffPeriod)).toBe(0)
      expect(calculateVesting(0.99, fundCycle, vestingPeriod, cliffPeriod)).toBe(0)
    })

    it('should vest proportionally after cliff', () => {
      // 2 years worked, 4 year vest = 50%
      expect(calculateVesting(2, fundCycle, vestingPeriod, cliffPeriod)).toBeCloseTo(0.5, 3)
    })

    it('should cap at 100% vesting', () => {
      expect(calculateVesting(4, fundCycle, vestingPeriod, cliffPeriod)).toBe(1)
      expect(calculateVesting(10, fundCycle, vestingPeriod, cliffPeriod)).toBe(1)
    })

    it('should handle cliff equal to vesting period', () => {
      expect(calculateVesting(3.9, fundCycle, 4, 4)).toBe(0)
      expect(calculateVesting(4, fundCycle, 4, 4)).toBeCloseTo(1, 3)
    })
  })

  describe('multiple vintages (continuous raising)', () => {
    const vestingPeriod = 4
    const cliffPeriod = 1
    const fundCycle = 2

    it('should vest in first fund only initially', () => {
      expect(calculateVesting(2, fundCycle, vestingPeriod, cliffPeriod)).toBeCloseTo(0.5, 3)
    })

    it('should start vesting second fund after fund cycle', () => {
      // 3 years: Fund1=75%, Fund2=25% = 1.0 total
      expect(calculateVesting(3, fundCycle, vestingPeriod, cliffPeriod)).toBeCloseTo(1.0, 3)
    })

    it('should calculate three overlapping vintages', () => {
      // 5 years: Fund1=100%, Fund2=75%, Fund3=25% = 2.0
      expect(calculateVesting(5, fundCycle, vestingPeriod, cliffPeriod)).toBeCloseTo(2.0, 3)
    })

    it('should handle cliff periods across multiple funds', () => {
      // 2.5 years worked: cliff is met globally (> 1 year)
      // Fund1: 2.5 years in = 2.5/4 = 0.625
      // Fund2: 0.5 years in = 0.5/4 = 0.125
      // Total = 0.75 (cliff is checked globally, not per fund)
      const vesting = calculateVesting(2.5, fundCycle, vestingPeriod, cliffPeriod)
      expect(vesting).toBeCloseTo(0.75, 3)
    })
  })

  describe('edge cases', () => {
    it('should handle zero years worked', () => {
      expect(calculateVesting(0, 2, 4, 1)).toBe(0)
    })

    it('should handle zero cliff period', () => {
      expect(calculateVesting(0.5, 20, 4, 0)).toBeCloseTo(0.125, 3)
    })

    it('should handle fractional years', () => {
      expect(calculateVesting(1.5, 20, 4, 1)).toBeCloseTo(0.375, 3)
    })
  })
})

describe('Fund Carry with Hurdles', () => {
  describe('basic carry without hurdles', () => {
    it('should calculate 20% carry on profit', () => {
      // $300M returns on $100M fund = $200M profit × 20% = $40M
      expect(calculateFundCarry(mockFund, 300)).toBe(40)
    })

    it('should return 0 for no profit', () => {
      expect(calculateFundCarry(mockFund, 100)).toBe(0)
    })

    it('should return 0 for losses', () => {
      expect(calculateFundCarry(mockFund, 50)).toBe(0)
    })

    it('should handle very small profits', () => {
      expect(calculateFundCarry(mockFund, 100.01)).toBeCloseTo(0.002, 3)
    })
  })

  describe('hurdle rates', () => {
    it('should use base carry below first hurdle', () => {
      // 1.5x, profit = $50M, use 20% = $10M
      expect(calculateFundCarry(mockFundWithHurdles, 150)).toBe(10)
    })

    it('should use first hurdle rate at 2x', () => {
      // 2.0x, profit = $100M, incremental: $100M × 20% = $20M
      expect(calculateFundCarry(mockFundWithHurdles, 200)).toBe(20)
    })

    it('should use second hurdle rate at 3x', () => {
      // 3.0x, profit = $200M, incremental: $100M × 20% + $100M × 25% = $45M
      expect(calculateFundCarry(mockFundWithHurdles, 300)).toBe(45)
    })

    it('should use highest hurdle beyond last threshold', () => {
      // 5.0x, profit = $400M, incremental: $100M × 20% + $100M × 25% + $200M × 30% = $105M
      expect(calculateFundCarry(mockFundWithHurdles, 500)).toBe(105)
    })

    it('should handle returns just below hurdle', () => {
      // 1.99x, should use 20% base rate
      expect(calculateFundCarry(mockFundWithHurdles, 199)).toBeCloseTo(19.8, 1)
    })

    it('should handle returns just above hurdle', () => {
      // 2.01x, incremental: $100M × 20% + $1M × 25% = $20.25M
      expect(calculateFundCarry(mockFundWithHurdles, 201)).toBeCloseTo(20.25, 1)
    })

    it('should handle multiple hurdles correctly', () => {
      // 2.5x, profit = $150M, incremental: $100M × 20% + $50M × 25% = $32.5M
      expect(calculateFundCarry(mockFundWithHurdles, 250)).toBeCloseTo(32.5, 1)
    })

    it('should return zero for exactly 1x', () => {
      expect(calculateFundCarry(mockFundWithHurdles, 100)).toBe(0)
    })

    it('should return zero for losses', () => {
      expect(calculateFundCarry(mockFundWithHurdles, 50)).toBe(0)
    })
  })

  describe('NaN handling', () => {
    it('should use defaults for NaN fund size', () => {
      const nanFund = { ...mockFund, size: NaN }
      const carry = calculateFundCarry(nanFund, 600)
      expect(carry).toBeGreaterThan(0)
    })

    it('should use defaults for NaN carry percent', () => {
      const nanFund = { ...mockFund, carryPercent: NaN }
      const carry = calculateFundCarry(nanFund, 300)
      expect(carry).toBe(40)
    })
  })
})

describe('Vintage Calculation Steps', () => {
  it('should calculate all 9 steps correctly for vintage 1', () => {
    const steps = calculateVintageSteps(mockFund, mockScenario, 0, 5, 7)

    // Step 1: Deployed capital
    expect(steps.deployedCapital).toBe(100) // Fully deployed

    // Step 2: Gross returns
    expect(steps.grossReturns).toBe(300) // 3x multiple

    // Step 3: Actual multiple
    expect(steps.actualMultiple).toBe(3.0)

    // Step 4: Fund profit
    expect(steps.fundProfit).toBe(200) // $300M - $100M

    // Step 5: Effective carry rate
    expect(steps.effectiveCarryRate).toBe(0.20) // No hurdles, so 20%

    // Step 6: Total fund carry
    expect(steps.totalFundCarry).toBe(40) // $200M × 20%

    // Step 7: Your carry pool share
    expect(steps.yourCarryPoolShare).toBe(2) // $40M × 5%

    // Step 8: Realized carry
    expect(steps.realizedCarry).toBeGreaterThan(0)
    expect(steps.realizedCarry).toBeLessThanOrEqual(2)

    // Step 9: Vested carry
    expect(steps.yourVestedCarry).toBeCloseTo(steps.realizedCarry, 6)
  })

  it('should return 0 carry before cliff', () => {
    const steps = calculateVintageSteps(mockFund, mockScenario, 0, 0.5, 3)

    expect(steps.cliffMet).toBe(false)
    expect(steps.yourVestedCarry).toBe(0)
  })

  it('should apply hurdle rate transitions', () => {
    const highScenario = { id: 2, name: 'High', grossReturnMultiple: 4.0 }
    const steps = calculateVintageSteps(mockFundWithHurdles, highScenario, 0, 5, 7)

    // 4x multiple with incremental hurdles: $100M×20% + $100M×25% + $100M×30% = $75M
    // Effective rate: $75M / $300M profit = 0.25 (25%)
    expect(steps.effectiveCarryRate).toBe(0.25)
    expect(steps.totalFundCarry).toBeGreaterThan(steps.fundProfit * 0.20)
  })

  it('should show 0 realization before yearsToClear1X', () => {
    const steps = calculateVintageSteps(mockFund, mockScenario, 0, 5, 3)

    expect(steps.vintageAgeInYears).toBe(3)
    expect(steps.realizationPercent).toBe(0) // Before clearing 1X
    expect(steps.realizedCarry).toBe(0)
  })

  it('should handle partial deployment', () => {
    const steps = calculateVintageSteps(mockFund, mockScenario, 0, 5, 1)

    // At year 1, deployment should be ~40%
    expect(steps.deploymentPercent).toBeCloseTo(0.4, 2)
    expect(steps.deployedCapital).toBeCloseTo(40, 1)
  })

  describe('zero return scenario', () => {
    const zeroScenario = { id: 3, name: 'Zero', grossReturnMultiple: 0 }

    it('should handle zero returns gracefully', () => {
      const steps = calculateVintageSteps(mockFund, zeroScenario, 0, 5, 7)

      expect(steps.grossReturns).toBe(0)
      expect(steps.fundProfit).toBe(0)
      expect(steps.totalFundCarry).toBe(0)
      expect(steps.yourVestedCarry).toBe(0)
    })
  })

  describe('vintage timing validation', () => {
    it('should calculate correct timing for vintage 2', () => {
      const steps = calculateVintageSteps(mockFund, mockScenario, 1, 5, 7)

      expect(steps.vintageAgeInYears).toBe(5) // 7 - 2 = 5 years old
      expect(steps.yearsIntoThisVintage).toBe(3) // Worked 5 years, fund started at 2
    })
  })
})

describe('Cell Calculations', () => {
  describe('calculateCell', () => {
    it('should return null for invalid cells', () => {
      const result = calculateCell(5, 3, [mockFund], { 0: 1 })
      expect(result).toBeNull()
    })

    it('should calculate valid cell with single fund', () => {
      const result = calculateCell(5, 10, [mockFund], { 0: 1 })

      expect(result).not.toBeNull()
      expect(result!.yearsWorked).toBe(5)
      expect(result!.yearsFromToday).toBe(10)
      expect(result!.total).toBeGreaterThan(0)
      expect(result!.fundBreakdowns).toHaveLength(1)
    })

    it('should aggregate multiple funds', () => {
      const fund2 = { ...mockFund, id: 2, name: 'Fund 2' }
      const result = calculateCell(5, 10, [mockFund, fund2], { 0: 1, 2: 1 })

      expect(result!.fundBreakdowns).toHaveLength(2)
      expect(result!.total).toBe(
        result!.fundBreakdowns[0].amount + result!.fundBreakdowns[1].amount
      )
    })

    it('should include vintage breakdowns', () => {
      const result = calculateCell(5, 10, [mockFund], { 0: 1 })

      expect(result!.fundBreakdowns[0].vintages.length).toBeGreaterThan(0)

      const vintage = result!.fundBreakdowns[0].vintages[0]
      expect(vintage).toHaveProperty('vintage')
      expect(vintage).toHaveProperty('yearsIn')
      expect(vintage).toHaveProperty('realization')
      expect(vintage).toHaveProperty('amount')
    })

    it('should handle continuous vs single fund', () => {
      const continuousFund = { ...mockFund, raiseContinuously: true }
      const resultContinuous = calculateCell(6, 10, [continuousFund], { 0: 1 })

      const singleFund = { ...mockFund, raiseContinuously: false }
      const resultSingle = calculateCell(6, 10, [singleFund], { 0: 1 })

      expect(resultContinuous!.fundBreakdowns[0].vintages.length).toBeGreaterThanOrEqual(3)
      expect(resultSingle!.fundBreakdowns[0].vintages).toHaveLength(1)
    })

    it('should handle yearsWorked = yearsFromToday (boundary)', () => {
      const result = calculateCell(5, 5, [mockFund], { 0: 1 })
      expect(result).not.toBeNull()
    })

    it('should return data even for zero carry scenarios', () => {
      const zeroFund = {
        ...mockFund,
        scenarios: [{ id: 1, name: 'Zero', grossReturnMultiple: 0 }]
      }
      const result = calculateCell(5, 10, [zeroFund], { 0: 1 })

      expect(result).not.toBeNull()
      expect(result!.total).toBe(0)
    })
  })

  describe('calculateAllCells', () => {
    it('should generate 20x20 grid by default', () => {
      const results = calculateAllCells([mockFund], { 0: 1 })

      expect(results).toHaveLength(20)
      expect(results[0]).toHaveLength(20)
    })

    it('should respect custom maxYears', () => {
      const results = calculateAllCells([mockFund], { 0: 1 }, 10)

      expect(results).toHaveLength(10)
      expect(results[0]).toHaveLength(10)
    })

    it('should have null values in lower triangle', () => {
      const results = calculateAllCells([mockFund], { 0: 1 }, 5)

      // Cell [3,1] should be null (3 years worked, 1 year from now)
      expect(results[2][0]).toBeNull()

      // Cell [1,3] should be valid (1 year worked, 3 years from now)
      expect(results[0][2]).not.toBeNull()
    })

    it('should have non-null values on and above diagonal', () => {
      const results = calculateAllCells([mockFund], { 0: 1 }, 5)

      // Diagonal cells should be valid
      for (let i = 0; i < 5; i++) {
        expect(results[i][i]).not.toBeNull()
      }
    })

    it('should show increasing carry values with more years worked', () => {
      const results = calculateAllCells([mockFund], { 0: 1 })

      // More years worked means more vesting and potentially more vintages
      const lessWorked = results[1][9]!.total   // 2 years worked, 10 years from now
      const moreWorked = results[4][9]!.total   // 5 years worked, 10 years from now

      expect(moreWorked).toBeGreaterThan(lessWorked)
    })

    it('should be deterministic', () => {
      const results1 = calculateAllCells([mockFund], { 0: 1 }, 5)
      const results2 = calculateAllCells([mockFund], { 0: 1 }, 5)

      expect(results1).toEqual(results2)
    })
  })
})
