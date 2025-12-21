import { useState, useEffect, useRef } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import type { Fund } from '../../../types/calculator';
import { calculateIRR, calculateMultipleFromIRR, calculateYearsToClear1X } from '../../../utils/calculations';
import { DEPLOYMENT_PRESETS, type DeploymentPreset } from '../../../types/calculator';
import Tooltip from '../common/Tooltip';

interface FundCardProps {
  fund: Fund;
  index: number;
}

function FundCard({ fund, index }: FundCardProps) {
  const { state, dispatch } = useCalculator();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<'standard' | 'conservative' | 'linear'>('standard');
  const [selectedDeploymentPreset, setSelectedDeploymentPreset] = useState<DeploymentPreset>('linear');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deploymentCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleRemove = () => {
    if (state.funds.length > 1) {
      dispatch({ type: 'REMOVE_FUND', payload: fund.id });
    }
  };

  // Default values matching placeholders
  const fieldDefaults: Record<string, number> = {
    size: 200,
    carryPercent: 20,
    carryAllocationPercent: 5,
    vestingPeriod: 4,
    cliffPeriod: 1,
    years: 10,
    fundCycle: 2,
    yearsToClear1X: 5
  };

  const handleFieldChange = (field: keyof Fund, value: any) => {
    // If value is NaN or invalid, use the default placeholder value
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
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
      const lastMultiple = isNaN(lastScenario.grossReturnMultiple) ? 5 : lastScenario.grossReturnMultiple;
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

  useEffect(() => {
    if (!showAdvanced || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use the fund's actual realization curve (not the preset) for consistency
    const curve = fund.realizationCurve;
    const width = 300;
    const height = 160;
    const padding = 30;
    const topPadding = 20;
    const fundYears = fund.years;

    canvas.width = width;
    canvas.height = height;

    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - topPadding;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid and labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'center';

    const numLabels = 5;
    const step = Math.ceil(fundYears / numLabels);
    for (let i = 0; i <= fundYears; i += step) {
      const x = padding + (i / fundYears) * chartWidth;
      const y = height - padding;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, topPadding);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillText(`Y${i}`, x, y + 15);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i += 5) {
      const y = height - padding - (i / 10) * chartHeight;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillText(`${i * 10}%`, padding - 5, y + 3);
    }

    // Draw curve
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= 10; i++) {
      const yearPosition = (i / 10) * fundYears;
      const x = padding + (yearPosition / fundYears) * chartWidth;
      const y = height - padding - (curve[i] || 0) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw vertical line showing when carry begins (when DPI crosses 1.0x)
    // Calculate based on first scenario's return multiple AND the realization curve
    const firstScenario = fund.scenarios[0];
    if (firstScenario) {
      const returnMultiple = firstScenario.grossReturnMultiple;

      // Use the actual fund's realization curve (not the preset) for accurate calculation
      const carryStartYear = calculateYearsToClear1X(returnMultiple, fund.realizationCurve, fundYears);

      if (isFinite(carryStartYear) && carryStartYear <= fundYears) {
        const carryStartX = padding + (carryStartYear / fundYears) * chartWidth;

        // Draw dashed vertical line
        ctx.strokeStyle = '#ef4444'; // Red color
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(carryStartX, topPadding);
        ctx.lineTo(carryStartX, height - padding);
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line

        // Add label with year
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Carry Y${Math.round(carryStartYear * 10) / 10}`, carryStartX, topPadding - 5);
      }
    }

    // Draw control points
    for (let i = 0; i <= 10; i++) {
      const yearPosition = (i / 10) * fundYears;
      const x = padding + (yearPosition / fundYears) * chartWidth;
      const y = height - padding - (curve[i] || 0) * chartHeight;

      ctx.fillStyle = '#667eea';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [showAdvanced, selectedPreset, fund.years, fund.scenarios, fund.realizationCurve]);

  useEffect(() => {
    if (!showAdvanced || !deploymentCanvasRef.current) return;

    const canvas = deploymentCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const curve = DEPLOYMENT_PRESETS[selectedDeploymentPreset];
    const width = 300;
    const height = 160;
    const padding = 30;
    const topPadding = 20;
    const fundYears = fund.years;

    canvas.width = width;
    canvas.height = height;

    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - topPadding;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, topPadding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw grid and labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.textAlign = 'center';

    const numLabels = 5;
    const step = Math.ceil(fundYears / numLabels);
    for (let i = 0; i <= fundYears; i += step) {
      const x = padding + (i / fundYears) * chartWidth;
      const y = height - padding;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, topPadding);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.fillText(`Y${i}`, x, y + 15);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i += 5) {
      const y = height - padding - (i / 10) * chartHeight;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillText(`${i * 10}%`, padding - 5, y + 3);
    }

    // Draw curve
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i <= 10; i++) {
      const yearPosition = (i / 10) * fundYears;
      const x = padding + (yearPosition / fundYears) * chartWidth;
      const y = height - padding - (curve[i] || 0) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw control points
    for (let i = 0; i <= 10; i++) {
      const yearPosition = (i / 10) * fundYears;
      const x = padding + (yearPosition / fundYears) * chartWidth;
      const y = height - padding - (curve[i] || 0) * chartHeight;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [showAdvanced, selectedDeploymentPreset, fund.years]);

  return (
    <div className="fund-card">
      {index > 0 && (
        <button className="btn btn-danger card-close-btn" onClick={handleRemove}>
          ✕
        </button>
      )}
      <div className="fund-card-header" style={{ marginBottom: isExpanded ? undefined : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
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
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={fund.size}
              onChange={(e) => handleFieldChange('size', parseFloat(e.target.value))}
              placeholder="200"
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>$M</span>
          </div>
        </div>
        <div className="form-group">
          <label>
            <span>Carry</span>
            <Tooltip text="Base carried interest percentage before any hurdles"><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={fund.carryPercent}
              onChange={(e) => handleFieldChange('carryPercent', parseFloat(e.target.value))}
              step="0.1"
              placeholder="20"
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>%</span>
          </div>
        </div>
        <div className="form-group">
          <label>
            <span>Carry Allocation per GP</span>
            <Tooltip text="Percentage of total fund carry allocated to one General Partner. Typical is 5%. Calculate by dividing total carry allocated to all GPs (excluding junior partners, staff, etc) by total number of GPs."><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={fund.carryAllocationPercent}
              onChange={(e) => handleFieldChange('carryAllocationPercent', parseFloat(e.target.value))}
              step="0.5"
              placeholder="5"
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>%</span>
          </div>
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

        <div className="form-grid">
          <div className="form-group">
            <label>
              <span>Fund Life</span>
              <Tooltip text="Expected lifespan of the fund before full realization"><span className="tooltip-icon">?</span></Tooltip>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={fund.years}
                onChange={(e) => handleFieldChange('years', parseFloat(e.target.value))}
                placeholder="10"
                style={{ paddingRight: '35px' }}
              />
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
            </div>
          </div>
          {fund.raiseContinuously && (
            <div className="form-group">
              <label>
                <span>Fund Cycle</span>
                <Tooltip text="Time between raising consecutive funds"><span className="tooltip-icon">?</span></Tooltip>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={fund.fundCycle}
                  onChange={(e) => handleFieldChange('fundCycle', parseFloat(e.target.value))}
                  step="0.5"
                  placeholder="2"
                  style={{ paddingRight: '35px' }}
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
              </div>
            </div>
          )}
        </div>
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

      <div className="section">
        <div
          className="fund-section-header"
          style={{ cursor: 'pointer', userSelect: 'none' }}
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={fund.vestingPeriod}
                    onChange={(e) => handleFieldChange('vestingPeriod', parseFloat(e.target.value))}
                    step="0.5"
                    placeholder="4"
                    style={{ paddingRight: '35px' }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
                </div>
              </div>
              <div className="form-group">
                <label>
                  <span>Cliff</span>
                  <Tooltip text="Years before any carry vests (all-or-nothing threshold)"><span className="tooltip-icon">?</span></Tooltip>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={fund.cliffPeriod}
                    onChange={(e) => handleFieldChange('cliffPeriod', parseFloat(e.target.value))}
                    step="0.5"
                    placeholder="1"
                    style={{ paddingRight: '35px' }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
                </div>
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
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Realization Curve</span>
                <Tooltip text="Pattern of when fund returns are realized over time"><span className="tooltip-icon">?</span></Tooltip>
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
                <canvas ref={canvasRef} className="curve-preview-canvas" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
              </div>
            </div>

            {/* Years to Clear 1X is now auto-calculated per scenario based on return multiple */}

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Deployment Schedule</span>
                <Tooltip text="Pattern of when fund capital is deployed over time. Fast means 25% deployed by year 1. Fastest means 80% deployed by year 1."><span className="tooltip-icon">?</span></Tooltip>
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
                <canvas ref={deploymentCanvasRef} className="curve-preview-canvas" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }} />
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
