import { useState } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { compressState } from '../../../utils/stateCompression';

function ScenarioSelectors() {
  const { state, dispatch } = useCalculator();
  const [showToast, setShowToast] = useState(false);

  const handleShare = () => {
    const url = window.location.origin + window.location.pathname + '#' + compressState(state);
    navigator.clipboard.writeText(url).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  if (state.funds.length === 0) return null;

  return (
    <div className="scenario-tabs" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {state.funds.map(fund => (
        <div key={fund.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ margin: 0 }}>{fund.name}:</label>
          <select
            value={state.selectedScenarios[fund.id]}
            onChange={(e) =>
              dispatch({
                type: 'SELECT_SCENARIO',
                payload: { fundId: fund.id, scenarioId: parseInt(e.target.value) }
              })
            }
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1.5px solid #e2e8f0', fontSize: '0.99em' }}
          >
            {fund.scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.grossReturnMultiple}x
              </option>
            ))}
          </select>
        </div>
      ))}
      <button className="btn btn-share" onClick={handleShare}>
        Share
      </button>

      {showToast && (
        <div className="toast">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}

export default ScenarioSelectors;
