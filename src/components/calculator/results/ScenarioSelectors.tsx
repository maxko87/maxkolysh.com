import { useCalculator } from '../../../hooks/useCalculator';

function ScenarioSelectors() {
  const { state, dispatch } = useCalculator();

  if (state.funds.length === 0) return null;

  return (
    <div className="flex gap-4 flex-wrap mb-6">
      {state.funds.map(fund => (
        <div key={fund.id} className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg shadow-sm border border-gray-200">
          <label className="calc-label">{fund.name}:</label>
          <select
            value={state.selectedScenarios[fund.id]}
            onChange={(e) =>
              dispatch({
                type: 'SELECT_SCENARIO',
                payload: { fundId: fund.id, scenarioId: parseInt(e.target.value) }
              })
            }
            className="calc-input px-3 py-1 rounded-md text-sm bg-white cursor-pointer"
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
