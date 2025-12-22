import { useState } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { compressState } from '../../../utils/stateCompression';
import CustomSelect from '../common/CustomSelect';

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

    // Determine base year (same logic as ResultsTable)
    const hasHistoricFunds = state.funds.some(fund => fund.vintageYear !== undefined);
    const baseYear = hasHistoricFunds && state.funds[0]?.vintageYear
      ? state.funds[0].vintageYear
      : currentYear;

    // Helper to escape CSV values (wrap in quotes if contains comma, quote, or newline)
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Create CSV header - year columns from baseYear + 1 to baseYear + maxYears
    const yearHeaders = Array.from({ length: maxYears }, (_, i) => (baseYear + i + 1).toString());
    const headers = ['Years Worked', ...yearHeaders];
    const csvRows = [headers.map(escapeCSV).join(',')];

    // Create CSV rows - only first maxYears rows and first maxYears columns
    const rowsToExport = Math.min(calculations.length, maxYears);

    for (let rowIdx = 0; rowIdx < rowsToExport; rowIdx++) {
      const row = calculations[rowIdx];
      const rowData: string[] = [(rowIdx + 1).toString()]; // Years Worked

      // Only export first maxYears columns to match headers
      for (let colIdx = 0; colIdx < maxYears; colIdx++) {
        const cellData = row[colIdx];

        if (!cellData || cellData.total < 0.01) {
          rowData.push('-');
        } else {
          // Convert millions to dollars and format with commas
          const dollars = Math.round(cellData.total * 1000000);
          const formatted = '$' + dollars.toLocaleString('en-US');
          rowData.push(formatted);
        }
      }

      csvRows.push(rowData.map(escapeCSV).join(','));
    }

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
    <div className="scenario-tabs" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: 'var(--spacing-md)' }}>
      {state.funds.map(fund => (
        <CustomSelect
          key={fund.id}
          label={fund.name}
          value={state.selectedScenarios[fund.id]}
          onChange={(scenarioId) =>
            dispatch({
              type: 'SELECT_SCENARIO',
              payload: { fundId: fund.id, scenarioId }
            })
          }
          options={fund.scenarios.map(scenario => ({
            id: scenario.id,
            label: `${scenario.grossReturnMultiple}x`
          }))}
        />
      ))}
      <button className="btn btn-secondary" onClick={handleExportCSV} style={{ flexShrink: 0 }}>
        Export to CSV
      </button>
      <button className="btn btn-secondary" onClick={handleShare} style={{ flexShrink: 0 }}>
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
