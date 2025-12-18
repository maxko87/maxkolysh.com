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
    <div>
      <div>
        <input
          type="text"
          value={fund.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
        />
        {index > 0 && (
          <button onClick={handleRemove}>
            Remove
          </button>
        )}
      </div>

      <div>
        <div>
          <label>Fund Size ($M)</label>
          <input
            type="number"
            value={fund.size}
            onChange={(e) => handleFieldChange('size', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label>Carry (%)</label>
          <input
            type="number"
            value={fund.carryPercent}
            onChange={(e) => handleFieldChange('carryPercent', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label>Fund Cycle (Yrs)</label>
          <input
            type="number"
            value={fund.fundCycle}
            onChange={(e) => handleFieldChange('fundCycle', parseFloat(e.target.value))}
            step="0.5"
          />
        </div>
        <div>
          <label>Fund Life (Yrs)</label>
          <input
            type="number"
            value={fund.years}
            onChange={(e) => handleFieldChange('years', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label># of GPs</label>
          <input
            type="number"
            value={fund.numGPs}
            onChange={(e) => handleFieldChange('numGPs', parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>GP Pool (%)</label>
          <input
            type="number"
            value={fund.carryPoolPercent}
            onChange={(e) => handleFieldChange('carryPoolPercent', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label>Vesting (Yrs)</label>
          <input
            type="number"
            value={fund.vestingPeriod}
            onChange={(e) => handleFieldChange('vestingPeriod', parseFloat(e.target.value))}
            step="0.5"
          />
        </div>
        <div>
          <label>Cliff (Yrs)</label>
          <input
            type="number"
            value={fund.cliffPeriod}
            onChange={(e) => handleFieldChange('cliffPeriod', parseFloat(e.target.value))}
            step="0.5"
          />
        </div>
      </div>

      <div>
        <h4>Hurdles</h4>
        {fund.hurdles.map((hurdle, idx) => (
          <div key={idx}>
            <input
              type="number"
              value={hurdle.multiple}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_HURDLE',
                  payload: { fundId: fund.id, hurdleIndex: idx, field: 'multiple', value: parseFloat(e.target.value) }
                })
              }
              step="0.1"
            />
            <span>x →</span>
            <input
              type="number"
              value={hurdle.carryPercent}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_HURDLE',
                  payload: { fundId: fund.id, hurdleIndex: idx, field: 'carryPercent', value: parseFloat(e.target.value) }
                })
              }
              step="0.1"
            />
            <span>%</span>
            <button
              onClick={() => dispatch({ type: 'REMOVE_HURDLE', payload: { fundId: fund.id, hurdleIndex: idx } })}
            >
              ✕
            </button>
          </div>
        ))}
        <button onClick={handleAddHurdle}>
          + Add Hurdle
        </button>
      </div>

      <div>
        <h4>Scenarios</h4>
        {fund.scenarios.map((scenario, idx) => {
          const irr = calculateIRR(scenario.grossReturnMultiple, fund.years);
          return (
            <div key={scenario.id}>
              <div>
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SCENARIO',
                      payload: { fundId: fund.id, scenarioId: scenario.id, field: 'name', value: e.target.value }
                    })
                  }
                />
                {idx > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SCENARIO', payload: { fundId: fund.id, scenarioId: scenario.id } })}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div>
                <label>Gross Return:</label>
                <input
                  type="number"
                  value={scenario.grossReturnMultiple}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_SCENARIO',
                      payload: { fundId: fund.id, scenarioId: scenario.id, field: 'grossReturnMultiple', value: parseFloat(e.target.value) }
                    })
                  }
                  step="0.1"
                />
                <span>x</span>
              </div>
              <div>IRR: {irr}%</div>
            </div>
          );
        })}
        {fund.scenarios.length < 5 && (
          <button onClick={handleAddScenario}>
            + Add Scenario
          </button>
        )}
      </div>

      <div>
        <h4>Realization Curve</h4>
        <div>
          {(['standard', 'aggressive', 'linear'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => dispatch({ type: 'SET_REALIZATION_PRESET', payload: { fundId: fund.id, preset } })}
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
