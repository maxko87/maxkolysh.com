// Core calculator types

export interface Hurdle {
  multiple: number;
  carryPercent: number;
}

export interface Scenario {
  id: number;
  name: string;
  grossReturnMultiple: number;
}

export interface Fund {
  id: number;
  name: string;
  size: number;                    // Fund size in $M
  carryPercent: number;            // Base carry %
  mgmtFeePercent: number;          // Management fee %
  fundCycle: number;               // Years between funds
  years: number;                   // Fund duration
  hurdles: Hurdle[];
  scenarios: Scenario[];
  numGPs: number;                  // Number of GPs
  carryPoolPercent: number;        // % of carry to GP pool
  vestingPeriod: number;           // Years to vest
  cliffPeriod: number;             // Cliff in years
  realizationCurve: number[];      // 11 points (0-10 years)
  raiseContinuously: boolean;      // Whether to raise funds continuously
  vintageYear?: number;            // Optional vintage year for historic funds
}

export interface CalculatorState {
  funds: Fund[];
  selectedScenarios: Record<number, number>; // fundId -> scenarioId
}

// Results types

export interface VintageBreakdown {
  vintage: number;
  yearsIn: number;
  realization: number;
  amount: number;
  totalCarry: number;        // Total carry for this vintage before vesting
  vestedCarry: number;       // Your vested fraction of carry
}

export interface FundBreakdown {
  name: string;
  amount: number;
  vintages: VintageBreakdown[];
}

export interface CellData {
  total: number;
  yearsWorked: number;
  yearsFromToday: number;
  fundBreakdowns: FundBreakdown[];
}

// Compressed state format for URL

export interface CompressedScenario {
  n: string;    // name
  g: number;    // grossReturnMultiple
}

export interface CompressedFund {
  n: string;    // name
  s: number;    // size
  c: number;    // carryPercent
  m: number;    // mgmtFeePercent
  y: number;    // fundCycle
  fy: number;   // years
  h: Hurdle[];  // hurdles
  sc: CompressedScenario[]; // scenarios
  gps: number;  // numGPs
  cp: number;   // carryPoolPercent
  vp: number;   // vestingPeriod
  cl: number;   // cliffPeriod
  rc: number[]; // realizationCurve
  rco: boolean; // raiseContinuously
}

export interface CompressedState {
  f: CompressedFund[];
  ss: Record<number, number>; // selectedScenarios
}

// Action types for reducer

export type CalculatorAction =
  | { type: 'SET_STATE'; payload: CalculatorState }
  | { type: 'ADD_FUND'; payload: Fund }
  | { type: 'REMOVE_FUND'; payload: number }
  | { type: 'UPDATE_FUND'; payload: { fundId: number; updates: Partial<Fund> } }
  | { type: 'UPDATE_FUND_FIELD'; payload: { fundId: number; field: keyof Fund; value: any } }
  | { type: 'ADD_HURDLE'; payload: { fundId: number; hurdle: Hurdle } }
  | { type: 'REMOVE_HURDLE'; payload: { fundId: number; hurdleIndex: number } }
  | { type: 'UPDATE_HURDLE'; payload: { fundId: number; hurdleIndex: number; field: keyof Hurdle; value: number } }
  | { type: 'ADD_SCENARIO'; payload: { fundId: number; scenario: Scenario } }
  | { type: 'REMOVE_SCENARIO'; payload: { fundId: number; scenarioId: number } }
  | { type: 'UPDATE_SCENARIO'; payload: { fundId: number; scenarioId: number; field: keyof Scenario; value: any } }
  | { type: 'UPDATE_REALIZATION_CURVE'; payload: { fundId: number; curve: number[] } }
  | { type: 'SET_REALIZATION_PRESET'; payload: { fundId: number; preset: 'linear' | 'standard' | 'conservative' } }
  | { type: 'SELECT_SCENARIO'; payload: { fundId: number; scenarioId: number } };

// Preset curve types
export type CurvePreset = 'linear' | 'standard' | 'conservative';

export const CURVE_PRESETS: Record<CurvePreset, number[]> = {
  linear: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  standard: [0, 0.01, 0.02, 0.05, 0.10, 0.15, 0.25, 0.40, 0.60, 0.85, 1.0],
  conservative: [0, 0, 0, 0.01, 0.03, 0.05, 0.10, 0.20, 0.40, 0.70, 1.0],
};

// Default values
export const DEFAULT_REALIZATION_CURVE = CURVE_PRESETS.standard;

export const createDefaultFund = (id: number, name: string, templateFund?: Fund): Fund => {
  if (templateFund) {
    return {
      ...templateFund,
      id,
      name,
      hurdles: JSON.parse(JSON.stringify(templateFund.hurdles)),
      scenarios: [{
        id: Date.now(),
        name: 'Base Case',
        grossReturnMultiple: templateFund.scenarios[0]?.grossReturnMultiple || 5
      }],
      realizationCurve: [...templateFund.realizationCurve],
    };
  }

  return {
    id,
    name,
    size: 200,
    carryPercent: 20,
    mgmtFeePercent: 2,
    fundCycle: 2,
    years: 10,
    hurdles: [],
    scenarios: [{ id: Date.now(), name: 'Base Case', grossReturnMultiple: 5 }],
    numGPs: 15,
    carryPoolPercent: 80,
    vestingPeriod: 4,
    cliffPeriod: 1,
    realizationCurve: [...DEFAULT_REALIZATION_CURVE],
    raiseContinuously: false,
  };
};
