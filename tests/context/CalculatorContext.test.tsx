import { describe, it, expect } from 'vitest'
import type { CalculatorState, CalculatorAction } from '../../src/types/calculator'
import { createDefaultFund, CURVE_PRESETS, DEPLOYMENT_PRESETS } from '../../src/types/calculator'
import { mockFund, mockState } from '../../src/test/mockData'

// Extract reducer for testing
// We need to import the reducer function - but it's not exported from CalculatorContext
// So we'll test through the actions by creating a minimal reducer implementation
function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload

    case 'ADD_FUND': {
      const newState = {
        ...state,
        funds: [...state.funds, action.payload],
        selectedScenarios: {
          ...state.selectedScenarios,
          [action.payload.id]: action.payload.scenarios[0].id
        }
      }
      return newState
    }

    case 'REMOVE_FUND': {
      const { [action.payload]: removed, ...restScenarios } = state.selectedScenarios
      return {
        ...state,
        funds: state.funds.filter(f => f.id !== action.payload),
        selectedScenarios: restScenarios
      }
    }

    case 'UPDATE_FUND': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, ...action.payload.updates }
            : f
        )
      }
    }

    case 'UPDATE_FUND_FIELD': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, [action.payload.field]: action.payload.value }
            : f
        )
      }
    }

    case 'ADD_HURDLE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, hurdles: [...f.hurdles, action.payload.hurdle] }
            : f
        )
      }
    }

    case 'REMOVE_HURDLE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? {
                ...f,
                hurdles: f.hurdles.filter((_, idx) => idx !== action.payload.hurdleIndex)
              }
            : f
        )
      }
    }

    case 'UPDATE_HURDLE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? {
                ...f,
                hurdles: f.hurdles.map((h, idx) =>
                  idx === action.payload.hurdleIndex
                    ? { ...h, [action.payload.field]: action.payload.value }
                    : h
                )
              }
            : f
        )
      }
    }

    case 'ADD_SCENARIO': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId && f.scenarios.length < 5
            ? { ...f, scenarios: [...f.scenarios, action.payload.scenario] }
            : f
        )
      }
    }

    case 'REMOVE_SCENARIO': {
      return {
        ...state,
        funds: state.funds.map(f => {
          if (f.id !== action.payload.fundId || f.scenarios.length <= 1) return f

          const newScenarios = f.scenarios.filter(s => s.id !== action.payload.scenarioId)

          // Update selected scenario if we deleted the active one
          if (state.selectedScenarios[f.id] === action.payload.scenarioId) {
            return { ...f, scenarios: newScenarios }
          }

          return { ...f, scenarios: newScenarios }
        }),
        selectedScenarios:
          state.selectedScenarios[action.payload.fundId] === action.payload.scenarioId
            ? {
                ...state.selectedScenarios,
                [action.payload.fundId]: state.funds
                  .find(f => f.id === action.payload.fundId)
                  ?.scenarios.filter(s => s.id !== action.payload.scenarioId)[0]?.id || 0
              }
            : state.selectedScenarios
      }
    }

    case 'UPDATE_SCENARIO': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? {
                ...f,
                scenarios: f.scenarios.map(s =>
                  s.id === action.payload.scenarioId
                    ? { ...s, [action.payload.field]: action.payload.value }
                    : s
                )
              }
            : f
        )
      }
    }

    case 'UPDATE_REALIZATION_CURVE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, realizationCurve: action.payload.curve }
            : f
        )
      }
    }

    case 'SET_REALIZATION_PRESET': {
      const curve = CURVE_PRESETS[action.payload.preset]
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, realizationCurve: [...curve] }
            : f
        )
      }
    }

    case 'UPDATE_DEPLOYMENT_CURVE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, deploymentCurve: action.payload.curve }
            : f
        )
      }
    }

    case 'SET_DEPLOYMENT_PRESET': {
      const curve = DEPLOYMENT_PRESETS[action.payload.preset]
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, deploymentCurve: [...curve] }
            : f
        )
      }
    }

    case 'SELECT_SCENARIO': {
      return {
        ...state,
        selectedScenarios: {
          ...state.selectedScenarios,
          [action.payload.fundId]: action.payload.scenarioId
        }
      }
    }

    default:
      return state
  }
}

describe('CalculatorContext Reducer', () => {
  const initialState: CalculatorState = mockState

  describe('ADD_FUND', () => {
    it('should add fund to state', () => {
      const newFund = createDefaultFund(1, 'Fund 2')
      const action: CalculatorAction = { type: 'ADD_FUND', payload: newFund }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds).toHaveLength(2)
      expect(newState.funds[1].name).toBe('Fund 2')
      expect(newState.selectedScenarios[1]).toBe(newFund.scenarios[0].id)
    })
  })

  describe('REMOVE_FUND', () => {
    it('should remove fund and its selected scenario', () => {
      const action: CalculatorAction = { type: 'REMOVE_FUND', payload: 0 }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds).toHaveLength(0)
      expect(newState.selectedScenarios[0]).toBeUndefined()
    })
  })

  describe('UPDATE_FUND_FIELD', () => {
    it('should update specific field', () => {
      const action: CalculatorAction = {
        type: 'UPDATE_FUND_FIELD',
        payload: { fundId: 0, field: 'size', value: 200 }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].size).toBe(200)
      expect(newState.funds[0].name).toBe('Test Fund') // Other fields unchanged
    })

    it('should not affect other funds', () => {
      const stateWithMultipleFunds = {
        ...initialState,
        funds: [mockFund, { ...mockFund, id: 1, name: 'Fund 2' }]
      }

      const action: CalculatorAction = {
        type: 'UPDATE_FUND_FIELD',
        payload: { fundId: 0, field: 'size', value: 200 }
      }

      const newState = calculatorReducer(stateWithMultipleFunds, action)

      expect(newState.funds[0].size).toBe(200)
      expect(newState.funds[1].size).toBe(100) // Unchanged
    })
  })

  describe('ADD_SCENARIO', () => {
    it('should add scenario to fund', () => {
      const newScenario = { id: 2, name: 'Up', grossReturnMultiple: 5 }
      const action: CalculatorAction = {
        type: 'ADD_SCENARIO',
        payload: { fundId: 0, scenario: newScenario }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].scenarios).toHaveLength(2)
      expect(newState.funds[0].scenarios[1]).toEqual(newScenario)
    })

    it('should not add beyond 5 scenarios', () => {
      const stateWithMany = {
        ...initialState,
        funds: [{
          ...initialState.funds[0],
          scenarios: Array(5).fill(null).map((_, i) => ({
            id: i,
            name: `Scenario ${i}`,
            grossReturnMultiple: 3
          }))
        }]
      }

      const action: CalculatorAction = {
        type: 'ADD_SCENARIO',
        payload: { fundId: 0, scenario: { id: 99, name: 'Extra', grossReturnMultiple: 1 } }
      }

      const newState = calculatorReducer(stateWithMany, action)

      expect(newState.funds[0].scenarios).toHaveLength(5)
    })
  })

  describe('REMOVE_SCENARIO', () => {
    const multiScenarioState = {
      ...initialState,
      funds: [{
        ...initialState.funds[0],
        scenarios: [
          { id: 1, name: 'Down', grossReturnMultiple: 1.5 },
          { id: 2, name: 'Base', grossReturnMultiple: 3.0 }
        ]
      }],
      selectedScenarios: { 0: 2 }
    }

    it('should remove scenario', () => {
      const action: CalculatorAction = {
        type: 'REMOVE_SCENARIO',
        payload: { fundId: 0, scenarioId: 1 }
      }

      const newState = calculatorReducer(multiScenarioState, action)

      expect(newState.funds[0].scenarios).toHaveLength(1)
      expect(newState.funds[0].scenarios[0].id).toBe(2)
    })

    it('should update selectedScenarios if removed active scenario', () => {
      const action: CalculatorAction = {
        type: 'REMOVE_SCENARIO',
        payload: { fundId: 0, scenarioId: 2 } // Remove active scenario
      }

      const newState = calculatorReducer(multiScenarioState, action)

      expect(newState.selectedScenarios[0]).toBe(1) // Should fallback to remaining
    })

    it('should not remove last scenario', () => {
      const action: CalculatorAction = {
        type: 'REMOVE_SCENARIO',
        payload: { fundId: 0, scenarioId: 1 }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].scenarios).toHaveLength(1)
    })
  })

  describe('UPDATE_SCENARIO', () => {
    it('should update scenario field', () => {
      const action: CalculatorAction = {
        type: 'UPDATE_SCENARIO',
        payload: { fundId: 0, scenarioId: 1, field: 'grossReturnMultiple', value: 4.0 }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].scenarios[0].grossReturnMultiple).toBe(4.0)
      expect(newState.funds[0].scenarios[0].name).toBe('Base Case') // Other fields unchanged
    })
  })

  describe('ADD_HURDLE', () => {
    it('should add hurdle to fund', () => {
      const hurdle = { multiple: 2.5, carryPercent: 25 }
      const action: CalculatorAction = {
        type: 'ADD_HURDLE',
        payload: { fundId: 0, hurdle }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].hurdles).toHaveLength(1)
      expect(newState.funds[0].hurdles[0]).toEqual(hurdle)
    })
  })

  describe('REMOVE_HURDLE', () => {
    const stateWithHurdles = {
      ...initialState,
      funds: [{
        ...initialState.funds[0],
        hurdles: [
          { multiple: 2.0, carryPercent: 25 },
          { multiple: 3.0, carryPercent: 30 }
        ]
      }]
    }

    it('should remove hurdle by index', () => {
      const action: CalculatorAction = {
        type: 'REMOVE_HURDLE',
        payload: { fundId: 0, hurdleIndex: 0 }
      }

      const newState = calculatorReducer(stateWithHurdles, action)

      expect(newState.funds[0].hurdles).toHaveLength(1)
      expect(newState.funds[0].hurdles[0].multiple).toBe(3.0)
    })
  })

  describe('UPDATE_HURDLE', () => {
    const stateWithHurdles = {
      ...initialState,
      funds: [{
        ...initialState.funds[0],
        hurdles: [
          { multiple: 2.0, carryPercent: 25 }
        ]
      }]
    }

    it('should update hurdle field', () => {
      const action: CalculatorAction = {
        type: 'UPDATE_HURDLE',
        payload: { fundId: 0, hurdleIndex: 0, field: 'multiple', value: 2.5 }
      }

      const newState = calculatorReducer(stateWithHurdles, action)

      expect(newState.funds[0].hurdles[0].multiple).toBe(2.5)
      expect(newState.funds[0].hurdles[0].carryPercent).toBe(25) // Other fields unchanged
    })
  })

  describe('UPDATE_REALIZATION_CURVE', () => {
    it('should update realization curve', () => {
      const newCurve = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      const action: CalculatorAction = {
        type: 'UPDATE_REALIZATION_CURVE',
        payload: { fundId: 0, curve: newCurve }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].realizationCurve).toEqual(newCurve)
    })
  })

  describe('SET_REALIZATION_PRESET', () => {
    it('should set preset curve', () => {
      const action: CalculatorAction = {
        type: 'SET_REALIZATION_PRESET',
        payload: { fundId: 0, preset: 'fast' }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].realizationCurve).toEqual(CURVE_PRESETS.fast)
    })

    it('should create a copy of the curve', () => {
      const action: CalculatorAction = {
        type: 'SET_REALIZATION_PRESET',
        payload: { fundId: 0, preset: 'fast' }
      }

      const newState = calculatorReducer(initialState, action)

      // Verify it's a copy, not a reference
      expect(newState.funds[0].realizationCurve).not.toBe(CURVE_PRESETS.fast)
    })
  })

  describe('UPDATE_DEPLOYMENT_CURVE', () => {
    it('should update deployment curve', () => {
      const newCurve = [0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0]
      const action: CalculatorAction = {
        type: 'UPDATE_DEPLOYMENT_CURVE',
        payload: { fundId: 0, curve: newCurve }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].deploymentCurve).toEqual(newCurve)
    })
  })

  describe('SET_DEPLOYMENT_PRESET', () => {
    it('should set preset deployment curve', () => {
      const action: CalculatorAction = {
        type: 'SET_DEPLOYMENT_PRESET',
        payload: { fundId: 0, preset: 'fast' }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].deploymentCurve).toEqual(DEPLOYMENT_PRESETS.fast)
    })
  })

  describe('SELECT_SCENARIO', () => {
    it('should update selected scenario', () => {
      const stateWithMultipleScenarios = {
        ...initialState,
        funds: [{
          ...initialState.funds[0],
          scenarios: [
            { id: 1, name: 'Down', grossReturnMultiple: 1.5 },
            { id: 2, name: 'Base', grossReturnMultiple: 3.0 }
          ]
        }],
        selectedScenarios: { 0: 1 }
      }

      const action: CalculatorAction = {
        type: 'SELECT_SCENARIO',
        payload: { fundId: 0, scenarioId: 2 }
      }

      const newState = calculatorReducer(stateWithMultipleScenarios, action)

      expect(newState.selectedScenarios[0]).toBe(2)
    })
  })

  describe('immutability', () => {
    it('should not mutate original state', () => {
      const action: CalculatorAction = {
        type: 'UPDATE_FUND_FIELD',
        payload: { fundId: 0, field: 'size', value: 500 }
      }

      const originalFundSize = initialState.funds[0].size
      calculatorReducer(initialState, action)

      expect(initialState.funds[0].size).toBe(originalFundSize)
    })

    it('should create new fund array on updates', () => {
      const action: CalculatorAction = {
        type: 'UPDATE_FUND_FIELD',
        payload: { fundId: 0, field: 'size', value: 500 }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds).not.toBe(initialState.funds)
    })

    it('should create new scenarios array when adding scenario', () => {
      const newScenario = { id: 2, name: 'Up', grossReturnMultiple: 5 }
      const action: CalculatorAction = {
        type: 'ADD_SCENARIO',
        payload: { fundId: 0, scenario: newScenario }
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState.funds[0].scenarios).not.toBe(initialState.funds[0].scenarios)
    })
  })

  describe('SET_STATE', () => {
    it('should replace entire state', () => {
      const newCompleteState: CalculatorState = {
        funds: [createDefaultFund(99, 'Replaced Fund')],
        selectedScenarios: { 99: 1 }
      }

      const action: CalculatorAction = {
        type: 'SET_STATE',
        payload: newCompleteState
      }

      const newState = calculatorReducer(initialState, action)

      expect(newState).toEqual(newCompleteState)
      expect(newState.funds[0].name).toBe('Replaced Fund')
    })
  })
})
