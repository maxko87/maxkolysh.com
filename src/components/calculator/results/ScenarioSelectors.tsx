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

  // Check if any fund has multiple scenarios
  const hasMultipleScenarios = state.funds.some(fund => fund.scenarios.length > 1);

  return (
    <div className="scenario-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 'var(--spacing-md)' }}>
      {/* Row 1: Explanation text and links */}
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
        The table below shows your projected annual carry based on your assumptions.
        <br />
        Click any cell to explore the math,
        {' '}<a href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }} style={{ color: 'var(--text-primary)' }}>export to CSV,</a>
        {' '}or{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); handleShare(); }} style={{ color: 'var(--text-primary)' }}>share via link</a>.
        {showToast && <span style={{ marginLeft: '8px', color: 'var(--accent-primary)' }}>Link copied to clipboard!</span>}
      </p>

      {/* Row 2: Scenarios - only show if at least one fund has multiple scenarios */}
      {hasMultipleScenarios && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Select Scenario:</span>
          {state.funds.map((fund, index) => {
            const selectedScenario = fund.scenarios.find(s => s.id === state.selectedScenarios[fund.id]);
            const hasOptions = fund.scenarios.length > 1;

            return (
              <div key={fund.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {index > 0 && <span style={{ color: 'var(--border-color)' }}>|</span>}
                {hasOptions ? (
                  <CustomSelect
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
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9em', color: 'var(--text-primary)' }}>{fund.name}</span>
                    <span style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.9em',
                      backgroundColor: '#f8f9fa',
                      color: 'var(--text-secondary)'
                    }}>
                      {selectedScenario?.grossReturnMultiple}x
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScenarioSelectors;
