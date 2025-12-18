import { useCalculator } from '../../../hooks/useCalculator';

function ScenarioSelectors() {
  const { state, dispatch } = useCalculator();

  if (state.funds.length === 0) return null;

  return (
    <div>
      {state.funds.map(fund => (
        <div key={fund.id}>
          <label>{fund.name}:</label>
          <select
            value={state.selectedScenarios[fund.id]}
            onChange={(e) =>
              dispatch({
                type: 'SELECT_SCENARIO',
                payload: { fundId: fund.id, scenarioId: parseInt(e.target.value) }
              })
            }
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
