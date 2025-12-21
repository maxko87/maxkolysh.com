import type { Fund, Scenario, CalculatorState } from '../types/calculator'
import { CURVE_PRESETS, DEPLOYMENT_PRESETS } from '../types/calculator'

export const mockScenario: Scenario = {
  id: 1,
  name: 'Base Case',
  grossReturnMultiple: 3.0
}

export const mockFund: Fund = {
  id: 0,
  name: 'Test Fund',
  size: 100,
  carryPercent: 20,
  mgmtFeePercent: 2,
  fundCycle: 2,
  years: 10,
  deploymentTimeline: 2.5,
  hurdles: [],
  scenarios: [mockScenario],
  carryAllocationPercent: 5,
  vestingPeriod: 4,
  cliffPeriod: 1,
  realizationCurve: [...CURVE_PRESETS.standard],
  deploymentCurve: [...DEPLOYMENT_PRESETS.linear],
  yearsToClear1X: 5,
  raiseContinuously: true
}

export const mockFundWithHurdles: Fund = {
  ...mockFund,
  hurdles: [
    { multiple: 2.0, carryPercent: 25 },
    { multiple: 3.0, carryPercent: 30 }
  ]
}

export const mockMultiScenarioFund: Fund = {
  ...mockFund,
  scenarios: [
    { id: 1, name: 'Down', grossReturnMultiple: 1.5 },
    { id: 2, name: 'Base', grossReturnMultiple: 3.0 },
    { id: 3, name: 'Up', grossReturnMultiple: 5.0 }
  ]
}

export const mockState: CalculatorState = {
  funds: [mockFund],
  selectedScenarios: { 0: 1 }
}

// Factory functions for creating test data
export function createTestFund(overrides?: Partial<Fund>): Fund {
  return { ...mockFund, ...overrides }
}

export function createTestScenario(overrides?: Partial<Scenario>): Scenario {
  return { ...mockScenario, ...overrides }
}
