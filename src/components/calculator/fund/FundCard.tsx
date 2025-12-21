import { useState } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import type { Fund } from '../../../types/calculator';
import { calculateIRR, calculateMultipleFromIRR, calculateYearsToClear1X } from '../../../utils/calculations';
import { type DeploymentPreset } from '../../../types/calculator';
import Tooltip from '../common/Tooltip';
import NumericInputWithUnit from '../common/NumericInputWithUnit';
import CurveChart from '../common/CurveChart';

interface FundCardProps {
  fund: Fund;
  index: number;
}

function FundCard({ fund }: FundCardProps) {
  const { dispatch } = useCalculator();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<'standard' | 'conservative' | 'linear'>('standard');
  const [selectedDeploymentPreset, setSelectedDeploymentPreset] = useState<DeploymentPreset>('linear');

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_FUND', payload: fund.id });
  };

  // Default values matching placeholders
  const fieldDefaults: Record<string, number> = {
    size: 200,
    carryPercent: 20,
    carryAllocationPercent: 5,
    vestingPeriod: 4,
    cliffPeriod: 1,
    years: 10,
    deploymentTimeline: 2.5,
    fundCycle: 2,
    yearsToClear1X: 5
  };

  const handleFieldChange = (field: keyof Fund, value: any) => {
    // Allow empty string to clear the field - calculations will use defaults
    // Only replace with default if value is explicitly NaN (not empty string)
    if (value !== '' && typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      value = fieldDefaults[field] ?? value;
    }
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
      const lastScenario = fund.scenarios[fund.scenarios.length - 1];
      const lastMultiple = isNaN(lastScenario.grossReturnMultiple) ? 3 : lastScenario.grossReturnMultiple;
      const newMultiple = lastMultiple * 2;

      dispatch({
        type: 'ADD_SCENARIO',
        payload: {
          fundId: fund.id,
          scenario: {
            id: Date.now(),
            name: `Scenario ${fund.scenarios.length + 1}`,
            grossReturnMultiple: newMultiple
          }
        }
      });
    }
  };

  const handlePresetClick = (preset: 'standard' | 'conservative' | 'linear') => {
    setSelectedPreset(preset);
    dispatch({ type: 'SET_REALIZATION_PRESET', payload: { fundId: fund.id, preset } });
  };

  const handleDeploymentPresetClick = (preset: DeploymentPreset) => {
    setSelectedDeploymentPreset(preset);
    dispatch({ type: 'SET_DEPLOYMENT_PRESET', payload: { fundId: fund.id, preset } });
  };

  return (
    <div className="fund-card">
      <button className="btn btn-danger card-close-btn" onClick={handleRemove}>
        ✕
      </button>
      <div className="fund-card-header" style={{ marginBottom: isExpanded ? undefined : 0 }}>
        <div style={{ flex: 1 }}>
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: isExpanded ? '4px' : '2px' }}>
              <span
                style={{
                  fontSize: '0.94em',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  minWidth: '16px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </span>
              <span style={{ fontSize: '0.9em', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isExpanded ? 'Fund Name' : fund.name}
              </span>
            </div>
            {!isExpanded && (
              <div style={{
                fontSize: '0.75em',
                color: '#94a3b8',
                paddingLeft: '22px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span>${fund.size}M</span>
                <span>•</span>
                <span>{fund.carryPercent}% carry</span>
                <span>•</span>
                <span>{fund.carryAllocationPercent}% per GP</span>
                <span>•</span>
                <span>{fund.years}y life</span>
                {fund.raiseContinuously && (
                  <>
                    <span>•</span>
                    <span>{fund.fundCycle}y cycle</span>
                  </>
                )}
                <span>•</span>
                <span>Scenarios: {fund.scenarios.map(s => `${isNaN(s.grossReturnMultiple) ? '?' : s.grossReturnMultiple}x`).join(', ')}</span>
              </div>
            )}
          </div>
          {isExpanded && (
            <input
              type="text"
              value={fund.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              style={{ width: '100%' }}
            />
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <span>Fund Size</span>
                <Tooltip text="Total fund size in millions of dollars">
                  <span className="tooltip-icon">?</span>
                </Tooltip>
              </label>
          <NumericInputWithUnit
            value={isNaN(fund.size) ? '' : fund.size}
            onChange={(value) => handleFieldChange('size', value)}
            placeholder="200"
            unit="$M"
          />
        </div>
        <div className="form-group">
          <label>
            <span>Carry</span>
            <Tooltip text="Base carried interest percentage before any hurdles"><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <NumericInputWithUnit
            value={isNaN(fund.carryPercent) ? '' : fund.carryPercent}
            onChange={(value) => {
              const finalValue = value === '' ? NaN : value;
              dispatch({ type: 'UPDATE_FUND_FIELD', payload: { fundId: fund.id, field: 'carryPercent', value: finalValue } });
            }}
            step="0.1"
            placeholder="20"
            unit="%"
          />
        </div>
        <div className="form-group">
          <label>
            <span>Per GP Carry</span>
            <Tooltip text="Percentage of total fund carry allocated to one General Partner. Typical is 5% for larger funds. Calculate by dividing total carry allocated to all GPs (excluding junior partners, staff, etc) by total number of GPs."><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <NumericInputWithUnit
            value={isNaN(fund.carryAllocationPercent) ? '' : fund.carryAllocationPercent}
            onChange={(value) => handleFieldChange('carryAllocationPercent', value)}
            step="0.5"
            placeholder="5"
            unit="%"
          />
        </div>
      </div>

      <div className="section">
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 'var(--spacing-sm)' }}>
            <input
              type="checkbox"
              checked={fund.raiseContinuously}
              onChange={(e) => handleFieldChange('raiseContinuously', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, fontSize: '0.95em' }}>Raise this fund continuously</span>
            <Tooltip text="Enable this to model raising new funds on a regular cycle"><span className="tooltip-icon">?</span></Tooltip>
          </label>
        </div>

        {fund.raiseContinuously && (
          <div className="form-grid">
            <div className="form-group">
              <label>
                <span>Fund Cycle</span>
                <Tooltip text="Time between raising consecutive funds"><span className="tooltip-icon">?</span></Tooltip>
              </label>
              <NumericInputWithUnit
                value={isNaN(fund.fundCycle) ? '' : fund.fundCycle}
                onChange={(value) => handleFieldChange('fundCycle', value)}
                step="0.5"
                placeholder="2"
                unit="Yrs"
              />
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="fund-section-header">
          <span>Return Scenarios</span>
          <Tooltip text="Different return outcomes to model (e.g., base case, upside, downside)"><span className="tooltip-icon">?</span></Tooltip>
        </div>
        {fund.scenarios.map((scenario, idx) => {
          const irrString = calculateIRR(scenario.grossReturnMultiple, fund.years);
          const irr = parseFloat(irrString);
          return (
            <div key={scenario.id} className="scenario-card">
              {idx > 0 && (
                <button
                  className="btn btn-danger card-close-btn"
                  onClick={() => dispatch({ type: 'REMOVE_SCENARIO', payload: { fundId: fund.id, scenarioId: scenario.id } })}
                >
                  ✕
                </button>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="scenario-field">
                  <label>
                    <span>Expected MOIC</span>
                    <Tooltip text="Multiple On Invested Capital - the gross return multiple expected for the fund"><span className="tooltip-icon">?</span></Tooltip>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={isNaN(scenario.grossReturnMultiple) ? '' : Math.round(scenario.grossReturnMultiple * 100) / 100}
                      onChange={(e) => {
                        const value = e.target.value === '' ? NaN : parseFloat(e.target.value);
                        // Round to 2 decimal places
                        const roundedValue = isNaN(value) ? NaN : Math.round(value * 100) / 100;
                        dispatch({
                          type: 'UPDATE_SCENARIO',
                          payload: { fundId: fund.id, scenarioId: scenario.id, field: 'grossReturnMultiple', value: roundedValue }
                        });
                      }}
                      step="0.5"
                      placeholder="5"
                      min="0"
                      style={{ paddingRight: '35px' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>x</span>
                  </div>
                </div>
                <div className="scenario-field">
                  <label>
                    <span>Expected IRR</span>
                    <Tooltip text="Internal Rate of Return - the annualized return rate for the fund"><span className="tooltip-icon">?</span></Tooltip>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={isNaN(scenario.grossReturnMultiple) ? '' : irr}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          // Allow clearing the field by setting multiple to NaN
                          dispatch({
                            type: 'UPDATE_SCENARIO',
                            payload: { fundId: fund.id, scenarioId: scenario.id, field: 'grossReturnMultiple', value: NaN }
                          });
                        } else {
                          const irrValue = parseFloat(value);
                          if (!isNaN(irrValue)) {
                            // Round IRR to 2 decimals
                            const roundedIRR = Math.round(irrValue * 100) / 100;
                            const newMultiple = calculateMultipleFromIRR(roundedIRR, fund.years);
                            // Round the resulting multiple to 2 decimals
                            const roundedMultiple = Math.round(newMultiple * 100) / 100;
                            dispatch({
                              type: 'UPDATE_SCENARIO',
                              payload: { fundId: fund.id, scenarioId: scenario.id, field: 'grossReturnMultiple', value: roundedMultiple }
                            });
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          const currentIRR = isNaN(scenario.grossReturnMultiple) ? 0 : irr;
                          const step = e.shiftKey ? 1 : 0.5;
                          const newIRR = e.key === 'ArrowUp' ? currentIRR + step : currentIRR - step;
                          const roundedIRR = Math.round(newIRR * 100) / 100;
                          const newMultiple = calculateMultipleFromIRR(roundedIRR, fund.years);
                          const roundedMultiple = Math.round(newMultiple * 100) / 100;
                          dispatch({
                            type: 'UPDATE_SCENARIO',
                            payload: { fundId: fund.id, scenarioId: scenario.id, field: 'grossReturnMultiple', value: roundedMultiple }
                          });
                        }
                      }}
                      step="0.5"
                      placeholder="0"
                      min="-99"
                      style={{ paddingRight: '35px' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {fund.scenarios.length < 5 && (
          <button className="btn add-btn" onClick={handleAddScenario}>
            + Add Scenario
          </button>
        )}
      </div>

      <div className="section" style={{ marginBottom: showAdvanced ? undefined : 0 }}>
        <div
          className="fund-section-header"
          style={{ cursor: 'pointer', userSelect: 'none', marginBottom: showAdvanced ? undefined : 0 }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>{showAdvanced ? '▼' : '▶'} Advanced</span>
        </div>
        {showAdvanced && (
          <>
            <div className="form-grid" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label>
                  <span>Vesting Period</span>
                  <Tooltip text="Years required to fully vest carry allocation"><span className="tooltip-icon">?</span></Tooltip>
                </label>
                <NumericInputWithUnit
                  value={isNaN(fund.vestingPeriod) ? '' : fund.vestingPeriod}
                  onChange={(value) => handleFieldChange('vestingPeriod', value)}
                  step="0.5"
                  placeholder="4"
                  unit="Yrs"
                />
              </div>
              <div className="form-group">
                <label>
                  <span>Cliff</span>
                  <Tooltip text="Years before any carry vests (all-or-nothing threshold)"><span className="tooltip-icon">?</span></Tooltip>
                </label>
                <NumericInputWithUnit
                  value={isNaN(fund.cliffPeriod) ? '' : fund.cliffPeriod}
                  onChange={(value) => handleFieldChange('cliffPeriod', value)}
                  step="0.5"
                  placeholder="1"
                  unit="Yrs"
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Hurdles</span>
                <Tooltip text="Performance thresholds that increase carry % at higher return multiples"><span className="tooltip-icon">?</span></Tooltip>
              </div>
              {fund.hurdles.map((hurdle, idx) => (
                <div key={idx} className="hurdle-item">
                  <button
                    className="btn btn-danger card-close-btn"
                    onClick={() => dispatch({ type: 'REMOVE_HURDLE', payload: { fundId: fund.id, hurdleIndex: idx } })}
                  >
                    ✕
                  </button>
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
                    style={{ maxWidth: '75px' }}
                  />
                  <span style={{ color: '#718096', fontWeight: 600 }}>x</span>
                  <span style={{ color: '#718096' }}>→</span>
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
                    style={{ maxWidth: '75px' }}
                  />
                  <span style={{ color: '#718096', fontSize: '0.85em' }}>%</span>
                </div>
              ))}
              <button className="btn add-btn" onClick={handleAddHurdle}>
                + Add Hurdle
              </button>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Investment Period</span>
                <Tooltip text="Years to fully invest fund capital (typically 2-3 years)"><span className="tooltip-icon">?</span></Tooltip>
              </div>
              <div className="form-group">
                <NumericInputWithUnit
                  value={isNaN(fund.deploymentTimeline) ? '' : fund.deploymentTimeline}
                  onChange={(value) => handleFieldChange('deploymentTimeline', value)}
                  step="0.5"
                  placeholder="2.5"
                  unit="Yrs"
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Investment Schedule</span>
                <Tooltip text="Pattern of when fund capital is invested over time. Fast means 25% invested by year 1. Fastest means 80% invested by year 1."><span className="tooltip-icon">?</span></Tooltip>
              </div>
              <div className="curve-presets">
                {(['linear', 'fast', 'fastest'] as const).map((preset) => (
                  <button
                    key={preset}
                    className={`btn btn-small curve-preset-btn ${selectedDeploymentPreset === preset ? 'btn-primary' : ''}`}
                    onClick={() => handleDeploymentPresetClick(preset)}
                  >
                    {preset === 'fast' ? 'Fast' : preset === 'fastest' ? 'Fastest' : 'Linear'}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'center' }}>
                <CurveChart
                  curve={fund.deploymentCurve}
                  timelineYears={isNaN(fund.deploymentTimeline) || !isFinite(fund.deploymentTimeline) || fund.deploymentTimeline <= 0 ? 2.5 : fund.deploymentTimeline}
                  color="#10b981"
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Fund Life</span>
                <Tooltip text="Expected fund lifespan until full distribution of returns (typically 10-15 years)"><span className="tooltip-icon">?</span></Tooltip>
              </div>
              <div className="form-group">
                <NumericInputWithUnit
                  value={isNaN(fund.years) ? '' : fund.years}
                  onChange={(value) => handleFieldChange('years', value)}
                  placeholder="10"
                  unit="Yrs"
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Distribution Pace</span>
                <Tooltip text="Pattern of how quickly returns are distributed to LPs"><span className="tooltip-icon">?</span></Tooltip>
              </div>
              <div className="curve-presets">
                {(['conservative', 'standard', 'linear'] as const).map((preset) => (
                  <button
                    key={preset}
                    className={`btn btn-small curve-preset-btn ${selectedPreset === preset ? 'btn-primary' : ''}`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'center' }}>
                <CurveChart
                  curve={fund.realizationCurve}
                  timelineYears={isNaN(fund.years) || !isFinite(fund.years) || fund.years <= 0 ? 10 : fund.years}
                  color="#667eea"
                  markerLine={
                    fund.scenarios[0]
                      ? (() => {
                          const fundYears = isNaN(fund.years) || !isFinite(fund.years) || fund.years <= 0 ? 10 : fund.years;
                          const carryStartYear = calculateYearsToClear1X(
                            fund.scenarios[0].grossReturnMultiple,
                            fund.realizationCurve,
                            fundYears
                          );
                          return carryStartYear && isFinite(carryStartYear) && carryStartYear <= fundYears
                            ? {
                                year: carryStartYear,
                                label: `Carry Y${Math.round(carryStartYear * 10) / 10}`,
                                color: '#ef4444',
                              }
                            : undefined;
                        })()
                      : undefined
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
        </>
      )}
    </div>
  );
}

export default FundCard;
