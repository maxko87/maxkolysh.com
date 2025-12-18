import React, { createContext, useReducer, useMemo } from 'react';
import type { CalculatorState, CalculatorAction, CellData } from '../types/calculator';
import { createDefaultFund, CURVE_PRESETS } from '../types/calculator';
import { calculateAllCells } from '../utils/calculations';
import { loadStateFromHash, compressState } from '../utils/stateCompression';

// Initial state
const getInitialState = (): CalculatorState => {
  // Try to load from URL hash first
  const loadedState = loadStateFromHash();
  if (loadedState && loadedState.funds.length > 0) {
    return loadedState;
  }

  // Default state
  const defaultFund = createDefaultFund(0, 'My Fund');
  return {
    funds: [defaultFund],
    selectedScenarios: { 0: defaultFund.scenarios[0].id }
  };
};

// Reducer
function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'ADD_FUND': {
      const newState = {
        ...state,
        funds: [...state.funds, action.payload],
        selectedScenarios: {
          ...state.selectedScenarios,
          [action.payload.id]: action.payload.scenarios[0].id
        }
      };
      return newState;
    }

    case 'REMOVE_FUND': {
      if (state.funds.length <= 1) return state;
      const { [action.payload]: removed, ...restScenarios } = state.selectedScenarios;
      return {
        ...state,
        funds: state.funds.filter(f => f.id !== action.payload),
        selectedScenarios: restScenarios
      };
    }

    case 'UPDATE_FUND': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, ...action.payload.updates }
            : f
        )
      };
    }

    case 'UPDATE_FUND_FIELD': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, [action.payload.field]: action.payload.value }
            : f
        )
      };
    }

    case 'ADD_HURDLE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, hurdles: [...f.hurdles, action.payload.hurdle] }
            : f
        )
      };
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
      };
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
      };
    }

    case 'ADD_SCENARIO': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId && f.scenarios.length < 5
            ? { ...f, scenarios: [...f.scenarios, action.payload.scenario] }
            : f
        )
      };
    }

    case 'REMOVE_SCENARIO': {
      return {
        ...state,
        funds: state.funds.map(f => {
          if (f.id !== action.payload.fundId || f.scenarios.length <= 1) return f;

          const newScenarios = f.scenarios.filter(s => s.id !== action.payload.scenarioId);

          // Update selected scenario if we deleted the active one
          if (state.selectedScenarios[f.id] === action.payload.scenarioId) {
            return { ...f, scenarios: newScenarios };
          }

          return { ...f, scenarios: newScenarios };
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
      };
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
      };
    }

    case 'UPDATE_REALIZATION_CURVE': {
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, realizationCurve: action.payload.curve }
            : f
        )
      };
    }

    case 'SET_REALIZATION_PRESET': {
      const curve = CURVE_PRESETS[action.payload.preset];
      return {
        ...state,
        funds: state.funds.map(f =>
          f.id === action.payload.fundId
            ? { ...f, realizationCurve: [...curve] }
            : f
        )
      };
    }

    case 'SELECT_SCENARIO': {
      return {
        ...state,
        selectedScenarios: {
          ...state.selectedScenarios,
          [action.payload.fundId]: action.payload.scenarioId
        }
      };
    }

    default:
      return state;
  }
}

// Context type
interface CalculatorContextType {
  state: CalculatorState;
  dispatch: React.Dispatch<CalculatorAction>;
  calculations: (CellData | null)[][];
}

// Create context
export const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

// Provider component
interface CalculatorProviderProps {
  children: React.ReactNode;
}

export function CalculatorProvider({ children }: CalculatorProviderProps) {
  const [state, dispatch] = useReducer(calculatorReducer, null, getInitialState);

  // Calculate all cells when state changes
  const calculations = useMemo(() => {
    return calculateAllCells(state.funds, state.selectedScenarios);
  }, [state.funds, state.selectedScenarios]);

  // Update URL whenever state changes (React way!)
  React.useEffect(() => {
    const compressed = compressState(state);
    if (compressed) {
      const url = window.location.pathname + '?' + compressed;
      window.history.replaceState(null, '', url);
    }
  }, [state]);

  return (
    <CalculatorContext.Provider value={{ state, dispatch, calculations }}>
      {children}
    </CalculatorContext.Provider>
  );
}
