import { useState, useEffect, useRef } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import type { Fund } from '../../../types/calculator';
import { calculateIRR } from '../../../utils/calculations';
import { CURVE_PRESETS } from '../../../types/calculator';
import Tooltip from '../common/Tooltip';

interface FundCardProps {
  fund: Fund;
  index: number;
}

function FundCard({ fund, index }: FundCardProps) {
  const { state, dispatch } = useCalculator();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'standard' | 'aggressive' | 'linear'>('standard');
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handlePresetClick = (preset: 'standard' | 'aggressive' | 'linear') => {
    setSelectedPreset(preset);
    dispatch({ type: 'SET_REALIZATION_PRESET', payload: { fundId: fund.id, preset } });
  };

  useEffect(() => {
    if (!showAdvanced || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const curve = CURVE_PRESETS[selectedPreset];
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
  }, [showAdvanced, selectedPreset, fund.years]);

  return (
    <div className="fund-card">
      <div className="fund-card-header">
        <input
          type="text"
          value={fund.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
        />
        {index > 0 && (
          <button className="btn btn-danger" onClick={handleRemove}>
            Remove
          </button>
        )}
      </div>

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
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>%</span>
          </div>
        </div>
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
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
          </div>
        </div>
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
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
          </div>
        </div>
        <div className="form-group">
          <label>
            <span># of Equal GPs</span>
            <Tooltip text="Number of equal General Partners sharing carry"><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <input
            type="number"
            value={fund.numGPs}
            onChange={(e) => handleFieldChange('numGPs', parseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>
            <span>Carry Pool to GPs</span>
            <Tooltip text="Percentage of carry allocated to GP pool vs other stakeholders"><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={fund.carryPoolPercent}
              onChange={(e) => handleFieldChange('carryPoolPercent', parseFloat(e.target.value))}
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>%</span>
          </div>
        </div>
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
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
          </div>
        </div>
        <div className="form-group">
          <label>
            <span>Cliff Period</span>
            <Tooltip text="Years before any carry vests (all-or-nothing threshold)"><span className="tooltip-icon">?</span></Tooltip>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={fund.cliffPeriod}
              onChange={(e) => handleFieldChange('cliffPeriod', parseFloat(e.target.value))}
              step="0.5"
              style={{ paddingRight: '35px' }}
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '0.9em', pointerEvents: 'none' }}>Yrs</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="fund-section-header">
          <span>Hurdles</span>
          <Tooltip text="Performance thresholds that increase carry % at higher return multiples"><span className="tooltip-icon">?</span></Tooltip>
        </div>
        {fund.hurdles.map((hurdle, idx) => (
          <div key={idx} className="hurdle-item">
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
              style={{ maxWidth: '60px' }}
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
              style={{ maxWidth: '60px' }}
            />
            <span style={{ color: '#718096', fontSize: '0.85em' }}>%</span>
            <button
              className="btn btn-danger"
              onClick={() => dispatch({ type: 'REMOVE_HURDLE', payload: { fundId: fund.id, hurdleIndex: idx } })}
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-small add-hurdle-btn" onClick={handleAddHurdle}>
          + Add Hurdle
        </button>
      </div>

      <div className="section">
        <div className="fund-section-header">
          <span>Return Scenarios</span>
          <Tooltip text="Different return outcomes to model (e.g., base case, upside, downside)"><span className="tooltip-icon">?</span></Tooltip>
        </div>
        {fund.scenarios.map((scenario, idx) => {
          const irr = calculateIRR(scenario.grossReturnMultiple, fund.years);
          return (
            <div key={scenario.id} className="scenario-card">
              <div className="scenario-card-header">
                <h4 style={{ margin: 0, fontSize: '1em', fontWeight: 700, color: '#92400e' }}>{scenario.grossReturnMultiple}x</h4>
                {idx > 0 && (
                  <button
                    className="btn btn-danger"
                    onClick={() => dispatch({ type: 'REMOVE_SCENARIO', payload: { fundId: fund.id, scenarioId: scenario.id } })}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="scenario-field">
                <label>Expected Gross Multiple</label>
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
              </div>
              <div className="scenario-field">
                <label>Gross IRR</label>
                <div className="calculated">{irr}%</div>
              </div>
            </div>
          );
        })}
        {fund.scenarios.length < 5 && (
          <button className="btn btn-primary btn-small" onClick={handleAddScenario}>
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
          <span>Advanced {showAdvanced ? '▼' : '▶'}</span>
        </div>
        {showAdvanced && (
          <>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: '0.83em', fontWeight: 600, color: 'var(--text-secondary)' }}>Realization Curve</span>
                <Tooltip text="Pattern of when fund returns are realized over time"><span className="tooltip-icon">?</span></Tooltip>
              </div>
              <div className="curve-presets">
                {(['standard', 'aggressive', 'linear'] as const).map((preset) => (
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
          </>
        )}
      </div>
    </div>
  );
}

export default FundCard;
