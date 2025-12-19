import { useState } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { compressState } from '../../../utils/stateCompression';

function ScenarioSelectors() {
  const { state, dispatch, calculations } = useCalculator();
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

  const handleExportCSV = () => {
    const maxYears = 20;
    const currentYear = new Date().getFullYear();

    // Create CSV header
    const headers = ['Years at Fund', ...Array.from({ length: maxYears }, (_, i) => (currentYear + i + 1).toString())];
    const csvRows = [headers.join(',')];

    // Create CSV rows
    calculations.slice(0, maxYears).forEach((row, rowIdx) => {
      const rowData: (string | number)[] = [rowIdx + 1]; // Years at fund
      row.forEach((cellData) => {
        if (!cellData || cellData.total < 0.01) {
          rowData.push('-');
        } else {
          // Convert millions to dollars and format with commas
          const dollars = Math.round(cellData.total * 1000000);
          const formatted = '$' + dollars.toLocaleString('en-US');
          rowData.push(formatted);
        }
      });
      csvRows.push(rowData.join(','));
    });

    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fund-calculator-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (state.funds.length === 0) return null;

  return (
    <div className="scenario-tabs" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
      <button className="btn btn-share" onClick={handleExportCSV} style={{ flexShrink: 0, alignSelf: 'center' }}>
        Export to CSV
      </button>
      <button className="btn btn-share" onClick={handleShare} style={{ flexShrink: 0, alignSelf: 'center' }}>
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
