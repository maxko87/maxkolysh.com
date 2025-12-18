import { useCalculator } from '../../../hooks/useCalculator';

function ScenarioSelectors() {
  const { state, dispatch } = useCalculator();

  if (state.funds.length === 0) return null;

  return (
    <div className="scenario-tabs" style={{ display: 'flex' }}>
      {state.funds.map(fund => (
        <div key={fund.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
          <label style={{ margin: 0 }}>{fund.name}:</label>
          <select
            value={state.selectedScenarios[fund.id]}
            onChange={(e) =>
              dispatch({
                type: 'SELECT_SCENARIO',
                payload: { fundId: fund.id, scenarioId: parseInt(e.target.value) }
              })
            }
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '0.9em' }}
          >
            {fund.scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export default ScenarioSelectors;
