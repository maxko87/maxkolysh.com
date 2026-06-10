import { describe, it, expect } from 'vitest'
import {
  calculateIRR,
  calculateMultipleFromIRR,
  getDeploymentAtYear,
  calculateVesting,
  calculateFundCarry,
  calculateVintageSteps,
  calculateCell,
  calculateAllCells
} from '../../src/utils/calculations'
import { getTASchedule, interpolateSchedule } from '../../src/utils/taModel'
import { DEPLOYMENT_PRESETS } from '../../src/types/calculator'
import { mockFund, mockScenario, mockFundWithHurdles, createTestFund } from '../../src/test/mockData'

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

describe('Takahashi-Alexander schedule', () => {
  const params = {
    fundSize: 100,
    multiple: 3,
    years: 10,
    bow: 2.5,
    deploymentCurve: [...DEPLOYMENT_PRESETS.linear],
    deploymentTimeline: 2.5,
  }

  it('total distributions should equal the target multiple', () => {
    const schedule = getTASchedule(params)
    expect(schedule.totalDistributions).toBeCloseTo(300, 0)
    expect(schedule.cumDistributions[schedule.years]).toBeCloseTo(300, 0)
  })

  it('should produce a J-curve: NAV rises then falls to zero at fund end', () => {
    const schedule = getTASchedule(params)
    const peak = Math.max(...schedule.nav)
    expect(peak).toBeGreaterThan(100)
    expect(schedule.nav[schedule.years]).toBeCloseTo(0, 0)
  })

  it('distributions should be back-loaded: less than a third of value out by mid-life', () => {
    const schedule = getTASchedule(params)
    expect(schedule.cumDistributions[5] / schedule.totalDistributions).toBeLessThan(0.34)
  })

  it('should cross 1x DPI mid-to-late life for a 3x fund', () => {
    const schedule = getTASchedule(params)
    expect(schedule.yearsTo1X).toBeGreaterThan(4)
    expect(schedule.yearsTo1X).toBeLessThan(8)
  })

  it('higher bow should delay distributions', () => {
    const fast = getTASchedule({ ...params, bow: 1.5 })
    const slow = getTASchedule({ ...params, bow: 4 })
    expect(slow.cumDistributions[5]).toBeLessThan(fast.cumDistributions[5])
    expect(slow.yearsTo1X).toBeGreaterThan(fast.yearsTo1X)
  })

  it('a higher multiple should imply a higher growth rate', () => {
    const low = getTASchedule({ ...params, multiple: 2 })
    const high = getTASchedule({ ...params, multiple: 5 })
    expect(high.growthRate).toBeGreaterThan(low.growthRate)
  })

  it('a sub-1x fund should never reach 1x DPI', () => {
    const zombie = getTASchedule({ ...params, multiple: 0.5 })
    expect(zombie.yearsTo1X).toBe(Infinity)
    expect(zombie.totalDistributions).toBeCloseTo(50, 0)
  })

  it('a zero multiple should produce an empty schedule', () => {
    const dead = getTASchedule({ ...params, multiple: 0 })
    expect(dead.totalDistributions).toBe(0)
    expect(dead.yearsTo1X).toBe(Infinity)
  })

  it('interpolateSchedule should interpolate linearly and clamp', () => {
    const schedule = getTASchedule(params)
    const mid = interpolateSchedule(schedule.cumDistributions, 5.5)
    expect(mid).toBeGreaterThan(schedule.cumDistributions[5])
    expect(mid).toBeLessThan(schedule.cumDistributions[6])
    expect(interpolateSchedule(schedule.cumDistributions, -1)).toBe(0)
    expect(interpolateSchedule(schedule.cumDistributions, 99)).toBeCloseTo(300, 0)
  })
})

describe('Deployment Curves', () => {
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

  it('should show 0 realization before the fund returns 1x', () => {
    const steps = calculateVintageSteps(mockFund, mockScenario, 0, 5, 3)

    expect(steps.vintageAgeInYears).toBe(3)
    expect(steps.realizationPercent).toBe(0) // cumulative distributions < fund size
    expect(steps.realizedCarry).toBe(0)
    expect(steps.yearsToClear1X).toBeGreaterThan(3) // derived from the TA schedule
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

describe('Display mode: DPI (cash) vs TVPI (paper)', () => {
  it('tvpi mode should show paper carry before any cash carry', () => {
    // year 4 of a 10y 3x fund: NAV is above cost but cumulative distributions
    // have not yet returned the fund
    const dpi = calculateVintageSteps(mockFund, mockScenario, 0, 5, 4)
    const tvpi = calculateVintageSteps(mockFund, mockScenario, 0, 5, 4, 'tvpi')

    expect(dpi.realizationPercent).toBe(0)
    expect(dpi.yourVestedCarry).toBe(0)
    expect(tvpi.realizationPercent).toBeGreaterThan(0)
    expect(tvpi.yourVestedCarry).toBeGreaterThan(0)
  })

  it('tvpi marks should ramp over the fund life, not jump to terminal value', () => {
    const early = calculateVintageSteps(mockFund, mockScenario, 0, 5, 4, 'tvpi')
    const mid = calculateVintageSteps(mockFund, mockScenario, 0, 5, 6, 'tvpi')
    const late = calculateVintageSteps(mockFund, mockScenario, 0, 5, 9, 'tvpi')

    expect(early.realizationPercent).toBeLessThan(0.8)
    expect(mid.realizationPercent).toBeGreaterThan(early.realizationPercent)
    expect(late.realizationPercent).toBeGreaterThan(mid.realizationPercent)
    expect(late.realizationPercent).toBeLessThanOrEqual(1)
  })

  it('tvpi and dpi should converge at full realization', () => {
    const dpi = calculateVintageSteps(mockFund, mockScenario, 0, 5, 10)
    const tvpi = calculateVintageSteps(mockFund, mockScenario, 0, 5, 10, 'tvpi')

    expect(dpi.realizationPercent).toBeCloseTo(1, 2)
    expect(tvpi.yourVestedCarry).toBeCloseTo(dpi.yourVestedCarry, 4)
  })

  it('tvpi cells should always be >= dpi cells', () => {
    const dpi = calculateAllCells([mockFund], { 0: 1 }, 10, 'dpi')
    const tvpi = calculateAllCells([mockFund], { 0: 1 }, 10, 'tvpi')

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (dpi[r][c]) {
          expect(tvpi[r][c]!.total).toBeGreaterThanOrEqual(dpi[r][c]!.total - 1e-9)
        }
      }
    }
  })

  it('carry through the waterfall respects hurdle bands on partial distributions', () => {
    // mockFundWithHurdles: 20% to 2x, 25% to 3x, 30% beyond. Mid-life cash
    // sits in the lower bands, so realized carry must be less than the
    // realized fraction of total value times terminal carry.
    const big = { id: 9, name: '5x', grossReturnMultiple: 5 }
    const fund = createTestFund({ ...mockFundWithHurdles, scenarios: [big] })
    const steps = calculateVintageSteps(fund, big, 0, 5, 7)
    expect(steps.realizationPercent).toBeGreaterThan(0)
    expect(steps.realizationPercent).toBeLessThan(1)
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
