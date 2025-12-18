import { useCalculator } from '../../../hooks/useCalculator';
import type { Fund } from '../../../types/calculator';
import { calculateIRR } from '../../../utils/calculations';

interface FundCardProps {
  fund: Fund;
  index: number;
}

function FundCard({ fund, index }: FundCardProps) {
  const { state, dispatch } = useCalculator();

  const handleRemove = () => {
    if (state.funds.length > 1) {
      dispatch({ type: 'REMOVE_FUND', payload: fund.id });
    }
  };

  const handleFieldChange = (field: keyof Fund, value: any) => {
    dispatch({ type: 'UPDATE_FUND_FIELD', payload: { fundId: fund.id, field, value } });
  };

  const handleAddHurdle = () => {
    dispatch({
      type: 'ADD_HURDLE',
      payload: { fundId: fund.id, hurdle: { multiple: 2, carryPercent: 25 } }
    });
  };

  const handleAddScenario = () => {
    if (fund.scenarios.length < 5) {
      dispatch({
        type: 'ADD_SCENARIO',
        payload: {
          fundId: fund.id,
          scenario: {
            id: Date.now(),
            name: `Scenario ${fund.scenarios.length + 1}`,
            grossReturnMultiple: 5
          }
        }
      });
    }
  };

  return (
    <div className="fund-card rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={fund.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="calc-input text-lg font-semibold bg-white rounded px-2 py-1 flex-1 mr-2"
        />
        {index > 0 && (
          <button
            onClick={handleRemove}
            className="calc-btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      {/* Basic Fields */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="calc-label block mb-1.5">
            Fund Size ($M)
          </label>
          <input
            type="number"
            value={fund.size}
            onChange={(e) => handleFieldChange('size', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            Carry (%)
          </label>
          <input
            type="number"
            value={fund.carryPercent}
            onChange={(e) => handleFieldChange('carryPercent', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            Fund Cycle (Yrs)
          </label>
          <input
            type="number"
            value={fund.fundCycle}
            onChange={(e) => handleFieldChange('fundCycle', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
            step="0.5"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            Fund Life (Yrs)
          </label>
          <input
            type="number"
            value={fund.years}
            onChange={(e) => handleFieldChange('years', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            # of GPs
          </label>
          <input
            type="number"
            value={fund.numGPs}
            onChange={(e) => handleFieldChange('numGPs', parseInt(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            GP Pool (%)
          </label>
          <input
            type="number"
            value={fund.carryPoolPercent}
            onChange={(e) => handleFieldChange('carryPoolPercent', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            Vesting (Yrs)
          </label>
          <input
            type="number"
            value={fund.vestingPeriod}
            onChange={(e) => handleFieldChange('vestingPeriod', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
            step="0.5"
          />
        </div>
        <div>
          <label className="calc-label block mb-1.5">
            Cliff (Yrs)
          </label>
          <input
            type="number"
            value={fund.cliffPeriod}
            onChange={(e) => handleFieldChange('cliffPeriod', parseFloat(e.target.value))}
            className="calc-input w-full px-3 py-2 rounded-md"
            step="0.5"
          />
        </div>
      </div>

      {/* Hurdles */}
      <div className="mb-4">
        <h4 className="calc-label mb-2">Hurdles</h4>
        {fund.hurdles.map((hurdle, idx) => (
          <div key={idx} className="hurdle-item flex items-center gap-2 mb-2 rounded p-2">
            <input
              type="number"
              value={hurdle.multiple}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_HURDLE',
                  payload: { fundId: fund.id, hurdleIndex: idx, field: 'multiple', value: parseFloat(e.target.value) }
                })
              }
              className="calc-input w-20 px-2 py-1 rounded text-sm"
              step="0.1"
            />
            <span className="text-sm">x →</span>
            <input
              type="number"
              value={hurdle.carryPercent}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_HURDLE',
                  payload: { fundId: fund.id, hurdleIndex: idx, field: 'carryPercent', value: parseFloat(e.target.value) }
                })
              }
              className="calc-input w-20 px-2 py-1 rounded text-sm"
              step="0.1"
            />
            <span className="text-sm">%</span>
            <button
              onClick={() => dispatch({ type: 'REMOVE_HURDLE', payload: { fundId: fund.id, hurdleIndex: idx } })}
              className="calc-btn px-2 py-1 bg-red-500 text-white rounded text-xs"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={handleAddHurdle}
          className="calc-btn calc-btn-primary text-sm px-3 py-1 text-white rounded"
        >
          + Add Hurdle
        </button>
      </div>

      {/* Scenarios */}
      <div className="mb-4">
        <h4 className="calc-label mb-2">Scenarios</h4>
        {fund.scenarios.map((scenario, idx) => {
          const irr = calculateIRR(scenario.grossReturnMultiple, fund.years);
          return (
            <div key={scenario.id} className="scenario-card rounded p-3 mb-2">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SCENARIO',
                      payload: { fundId: fund.id, scenarioId: scenario.id, field: 'name', value: e.target.value }
                    })
                  }
                  className="calc-input text-sm font-medium bg-white rounded px-2 py-1 flex-1 mr-2"
                />
                {idx > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SCENARIO', payload: { fundId: fund.id, scenarioId: scenario.id } })}
                    className="calc-btn text-xs px-2 py-1 bg-red-500 text-white rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="calc-label text-xs">Gross Return:</label>
                <input
                  type="number"
                  value={scenario.grossReturnMultiple}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SCENARIO',
                      payload: { fundId: fund.id, scenarioId: scenario.id, field: 'grossReturnMultiple', value: parseFloat(e.target.value) }
                    })
                  }
                  className="calc-input w-20 px-2 py-1 rounded text-sm"
                  step="0.1"
                />
                <span className="text-xs">x</span>
              </div>
              <div className="text-xs text-gray-600 font-semibold mt-1.5">IRR: {irr}%</div>
            </div>
          );
        })}
        {fund.scenarios.length < 5 && (
          <button
            onClick={handleAddScenario}
            className="calc-btn calc-btn-primary text-sm px-3 py-1 text-white rounded"
          >
            + Add Scenario
          </button>
        )}
      </div>

      {/* Realization Curve Presets */}
      <div>
        <h4 className="calc-label mb-2">Realization Curve</h4>
        <div className="flex gap-2">
          {(['standard', 'aggressive', 'linear'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => dispatch({ type: 'SET_REALIZATION_PRESET', payload: { fundId: fund.id, preset } })}
              className="calc-btn text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded capitalize"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FundCard;
