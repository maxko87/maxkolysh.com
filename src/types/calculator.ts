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
  deploymentTimeline: number;      // Years to deploy capital (typically 2-3)
  hurdles: Hurdle[];
  scenarios: Scenario[];
  carryAllocationPercent: number;  // % of total carry allocated to one GP
  vestingPeriod: number;           // Years to vest
  cliffPeriod: number;             // Cliff in years
  deploymentCurve: number[];       // 11 points (0-10 years) - % of capital deployed
  bow: number;                     // Takahashi-Alexander bow: how back-loaded distributions are (Yale VC standard: 2.5)
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

// Detailed calculation steps for a single vintage (for math visibility)
export interface VintageCalculationSteps {
  // Input parameters (for visibility)
  fundSize: number;
  deploymentPercent: number;
  realizationPercent: number;
  grossReturnMultiple: number;
  baseCarryPercent: number;
  effectiveCarryRate: number;
  carryAllocationPercent: number;
  vestingProgress: number;
  cliffMet: boolean;
  yearsToClear1X: number;          // derived from the TA schedule: when cumulative distributions cross 1x
  vintageAgeInYears: number;
  yearsIntoThisVintage: number;

  // Step-by-step calculated values (the math flow)
  deployedCapital: number;       // = fundSize × deploymentPercent
  grossReturns: number;          // = deployedCapital × multiple
  actualMultiple: number;        // = grossReturns / fundSize
  fundProfit: number;            // = max(0, grossReturns - fundSize)
  totalFundCarry: number;        // = fundProfit × effectiveCarryRate
  yourCarryPoolShare: number;    // = totalFundCarry × carryAllocationPercent
  realizedCarry: number;         // = yourCarryPoolShare × realizationPercent
  yourVestedCarry: number;       // = realizedCarry × vestingProgress (if cliff met)

  // Incremental hurdle breakdown (optional, for detailed display)
  carryBands?: Array<{
    fromMultiple: number;
    toMultiple: number;
    profitInBand: number;
    carryRate: number;
    carryAmount: number;
  }>;
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
  dt: number;   // deploymentTimeline
  h: Hurdle[];  // hurdles
  sc: CompressedScenario[]; // scenarios
  ca: number;   // carryAllocationPercent
  vp: number;   // vestingPeriod
  cl: number;   // cliffPeriod
  dc: number[]; // deploymentCurve
  b?: number;   // bow
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
  | { type: 'UPDATE_DEPLOYMENT_CURVE'; payload: { fundId: number; curve: number[] } }
  | { type: 'SET_DEPLOYMENT_PRESET'; payload: { fundId: number; preset: DeploymentPreset } }
  | { type: 'SELECT_SCENARIO'; payload: { fundId: number; scenarioId: number } };

// How the table values carry: 'dpi' = carry cash actually distributed (lags exits),
// 'tvpi' = vested carry marked at the assumed multiple (paper value, not yet paid)
export type DisplayMode = 'dpi' | 'tvpi';

// Preset curve types
export type DeploymentPreset = 'linear' | 'fast' | 'fastest';

export const DEPLOYMENT_PRESETS: Record<DeploymentPreset, number[]> = {
  linear: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],        // Even deployment
  fast: [0, 0.25, 0.45, 0.60, 0.72, 0.81, 0.88, 0.93, 0.96, 0.98, 1.0], // Fast deployment
  fastest: [0, 0.8, 0.88, 0.92, 0.95, 0.97, 0.98, 0.99, 0.995, 0.998, 1.0], // Fastest - 80% deployed by year 1
};

// Default values
export const DEFAULT_DEPLOYMENT_CURVE = DEPLOYMENT_PRESETS.linear;
export const DEFAULT_DEPLOYMENT_TIMELINE = 2.5;
// Takahashi-Alexander bow factor. 2.5 is Yale's published base case for venture
// capital (Takahashi & Alexander 2002); practitioner range is ~1.5-4. Higher =
// distributions more back-loaded.
export const DEFAULT_BOW = 2.5;

// Fund type presets
export type FundType = 'early-stage-vc' | 'growth-vc' | 'buyout' | 'secondaries' | 'custom';

export interface FundTypePreset {
  type: FundType;
  label: string;
  description: string;
  scenarios: Array<{ name: string; grossReturnMultiple: number }>;
  defaults: {
    size: number;
    years: number;
    deploymentTimeline: number;
    deploymentPreset: DeploymentPreset;
    bow: number;
    fundCycle: number;
  };
}

export const FUND_TYPE_PRESETS: Record<FundType, FundTypePreset> = {
  'early-stage-vc': {
    type: 'early-stage-vc',
    label: 'Early-stage VC',
    description: '12yr fund life, 3yr deployment, slow distributions',
    scenarios: [
      { name: 'Down', grossReturnMultiple: 1.7 },
      { name: 'Base', grossReturnMultiple: 3.0 },
      { name: 'Up', grossReturnMultiple: 4.5 },
    ],
    defaults: {
      size: 100,
      years: 12,
      deploymentTimeline: 3,
      deploymentPreset: 'fast',
      bow: 3,
      fundCycle: 3,
    },
  },
  'growth-vc': {
    type: 'growth-vc',
    label: 'Growth VC',
    description: '10yr fund life, 2.5yr deployment, typical distributions',
    scenarios: [
      { name: 'Down', grossReturnMultiple: 1.6 },
      { name: 'Base', grossReturnMultiple: 2.3 },
      { name: 'Up', grossReturnMultiple: 3.0 },
    ],
    defaults: {
      size: 200,
      years: 10,
      deploymentTimeline: 2.5,
      deploymentPreset: 'fast',
      bow: 2.5,
      fundCycle: 2.5,
    },
  },
  'buyout': {
    type: 'buyout',
    label: 'Buyout / Late-stage',
    description: '10yr fund life, 3yr deployment, fast distributions',
    scenarios: [
      { name: 'Down', grossReturnMultiple: 1.6 },
      { name: 'Base', grossReturnMultiple: 2.5 },
      { name: 'Up', grossReturnMultiple: 3.0 },
    ],
    defaults: {
      size: 500,
      years: 10,
      deploymentTimeline: 3,
      deploymentPreset: 'linear',
      bow: 2,
      fundCycle: 2,
    },
  },
  'secondaries': {
    type: 'secondaries',
    label: 'Secondaries',
    description: '6.5yr fund life, 1.5yr deployment, fastest distributions',
    scenarios: [
      { name: 'Down', grossReturnMultiple: 1.3 },
      { name: 'Base', grossReturnMultiple: 1.6 },
      { name: 'Up', grossReturnMultiple: 1.8 },
    ],
    defaults: {
      size: 300,
      years: 6.5,
      deploymentTimeline: 1.5,
      deploymentPreset: 'fastest',
      bow: 1.5,
      fundCycle: 2,
    },
  },
  'custom': {
    type: 'custom',
    label: 'Custom',
    description: 'Create a fund with default parameters',
    scenarios: [
      { name: 'Base Case', grossReturnMultiple: 3.0 },
    ],
    defaults: {
      size: 100,
      years: 10,
      deploymentTimeline: 2.5,
      deploymentPreset: 'linear',
      bow: 2.5,
      fundCycle: 2,
    },
  },
};

export const createDefaultFund = (id: number, name: string, templateFund?: Fund): Fund => {
  const currentYear = new Date().getFullYear();

  if (templateFund) {
    return {
      ...templateFund,
      id,
      name,
      hurdles: JSON.parse(JSON.stringify(templateFund.hurdles)),
      scenarios: [{
        id: id * 100, // Use predictable ID based on fund ID
        name: 'Base Case',
        grossReturnMultiple: templateFund.scenarios[0]?.grossReturnMultiple || 3
      }],
      deploymentCurve: [...(templateFund.deploymentCurve || DEFAULT_DEPLOYMENT_CURVE)],
      deploymentTimeline: templateFund.deploymentTimeline ?? DEFAULT_DEPLOYMENT_TIMELINE,
      bow: templateFund.bow ?? DEFAULT_BOW,
      vintageYear: templateFund.vintageYear ?? currentYear,
    };
  }

  return {
    id,
    name,
    size: 100,
    carryPercent: 20,
    mgmtFeePercent: 2,
    fundCycle: 2,
    years: 15,
    hurdles: [],
    scenarios: [{ id: id * 100, name: 'Base Case', grossReturnMultiple: 3 }], // Use predictable ID
    carryAllocationPercent: 100,
    vestingPeriod: 4,
    cliffPeriod: 1,
    deploymentCurve: [...DEFAULT_DEPLOYMENT_CURVE],
    deploymentTimeline: DEFAULT_DEPLOYMENT_TIMELINE,
    bow: DEFAULT_BOW,
    raiseContinuously: false,
    vintageYear: currentYear,
  };
};

export const createFundFromType = (id: number, name: string, fundType: FundType): Fund => {
  const preset = FUND_TYPE_PRESETS[fundType];
  const currentYear = new Date().getFullYear();

  // Create scenarios with unique IDs
  const scenarios = preset.scenarios.map((scenario, index) => ({
    id: Date.now() + index,
    name: scenario.name,
    grossReturnMultiple: scenario.grossReturnMultiple,
  }));

  return {
    id,
    name,
    size: preset.defaults.size,
    carryPercent: 20,
    mgmtFeePercent: 2,
    fundCycle: preset.defaults.fundCycle,
    years: preset.defaults.years,
    deploymentTimeline: preset.defaults.deploymentTimeline,
    hurdles: [],
    scenarios,
    carryAllocationPercent: 100,
    vestingPeriod: 4,
    cliffPeriod: 1,
    deploymentCurve: [...DEPLOYMENT_PRESETS[preset.defaults.deploymentPreset]],
    bow: preset.defaults.bow,
    raiseContinuously: false,
    vintageYear: currentYear,
  };
};
