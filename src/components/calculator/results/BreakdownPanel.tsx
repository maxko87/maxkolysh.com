import { useRef } from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';
import { calculateVintageSteps } from '../../../utils/calculations';
import type { CellData } from '../../../types/calculator';

interface BreakdownPanelProps {
  tooltipData: CellData;
  hasHistoricFunds: boolean;
  baseYear: number;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  exploreMode: boolean;
  funds: any[]; // Fund type from state
  selectedScenarios: Record<number, number>;
}

export default function BreakdownPanel({
  tooltipData,
  hasHistoricFunds,
  baseYear,
  showAdvanced,
  setShowAdvanced,
  exploreMode,
  funds,
  selectedScenarios,
}: BreakdownPanelProps) {
  const tooltipSidebarRef = useRef<HTMLDivElement>(null);

  const singleFundName = funds.length === 1 ? funds[0].name : null;
  const atFundText = singleFundName ? ` at ${singleFundName}` : '';

  const headerText = hasHistoricFunds ? (
    tooltipData.yearsFromToday ? (
      <>If you worked{atFundText} for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you'd have made {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
    ) : (
      <>Working{atFundText} {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you made {formatCurrency(tooltipData.total)} in carry during the early years because carry distributions had not yet started.</>
    )
  ) : (
    tooltipData.yearsFromToday ? (
      <>If you work{atFundText} for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
    ) : (
      <>Working{atFundText} {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry during the early years because carry distributions won't have started yet.</>
    )
  );

  // Simple breakdown view
  const simpleBreakdown = (
    <>
      {tooltipData.fundBreakdowns.map((fb, idx) => {
        const fund = funds.find(f => f.name === fb.name);
        const fundCycle = fund && !isNaN(fund.fundCycle) && isFinite(fund.fundCycle) ? fund.fundCycle : 2;

        return (
          <div
            key={idx}
            style={{
              marginBottom: '16px',
              ...(idx > 0 ? { marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' } : {})
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', fontSize: '0.95em' }}>
              {fb.name}
            </div>
            {fb.vintages.map((v, vIdx) => {
              const vintageYear = baseYear + (v.vintage - 1) * fundCycle;
              return (
                <div
                  key={vIdx}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.85em', marginBottom: '6px', paddingLeft: '12px' }}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>{vintageYear} Vintage ({v.yearsIn}y in, {v.realization}% distributed)</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(v.amount)}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{fb.name} Total:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatCurrency(fb.amount)}</span>
            </div>
          </div>
        );
      })}
    </>
  );

  // Advanced breakdown view with detailed math steps
  const advancedBreakdown = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${tooltipData.fundBreakdowns.length}, minmax(380px, 500px))`,
      gap: '16px',
      width: 'fit-content',
      maxWidth: '100%'
    }}>
      {tooltipData.fundBreakdowns.map((fb, fbIdx) => {
        const fund = funds.find(f => f.name === fb.name);
        if (!fund) return null;

        const selectedScenarioId = selectedScenarios[fund.id];
        const scenario = fund.scenarios.find((s: any) => s.id === selectedScenarioId) || fund.scenarios[0];
        if (!scenario) return null;

        return (
          <div key={fbIdx}>
            <div style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '12px', fontSize: '1em' }}>
              {fb.name}
            </div>

            {fb.vintages.map((v, vIdx) => {
              // Use calculateVintageSteps for single source of truth!
              const breakdown = calculateVintageSteps(fund, scenario, v.vintage - 1, tooltipData.yearsWorked, tooltipData.yearsFromToday);
              const fundCycle = isNaN(fund.fundCycle) || !isFinite(fund.fundCycle) ? 2 : fund.fundCycle;
              const deploymentYear = baseYear + (v.vintage - 1) * fundCycle;

              return (
                <div
                  key={vIdx}
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8em'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.95em' }}>
                    {deploymentYear} Vintage
                  </div>

                  {/* Scenario & Time */}
                  <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                      <span>Return Multiple:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{breakdown.grossReturnMultiple}x</span>
                      <span>Vintage Age:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{breakdown.vintageAgeInYears.toFixed(1)} years</span>
                      <span>Years Worked:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{breakdown.yearsIntoThisVintage.toFixed(1)} years</span>
                    </div>
                  </div>

                  {/* Progress Metrics */}
                  <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                      <span>Deployment Progress:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{(breakdown.deploymentPercent * 100).toFixed(0)}%</span>
                      <span>Distribution Progress:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{(breakdown.realizationPercent * 100).toFixed(0)}%</span>
                      <span>Vesting Progress:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{(breakdown.vestingProgress * 100).toFixed(0)}% {breakdown.cliffMet ? '✓' : '✗ cliff not met'}</span>
                      {breakdown.realizationPercent === 0 && breakdown.vintageAgeInYears < breakdown.yearsToClear1X && (
                        <>
                          <span style={{ gridColumn: '1 / -1', fontSize: '0.85em', fontStyle: 'italic' }}>
                            (No distributions yet - need {(breakdown.yearsToClear1X - breakdown.vintageAgeInYears).toFixed(1)} more years to return 1x fund)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Calculation Steps */}
                  <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85em' }}>Calculation Breakdown</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9em' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Fund Size × Deployment % = Deployed Capital</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.fundSize.toFixed(0)}M × {(breakdown.deploymentPercent * 100).toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.deployedCapital.toFixed(1)}M</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Deployed Capital × Return Multiple = Gross Returns</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.deployedCapital.toFixed(1)}M × {breakdown.grossReturnMultiple}x] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.grossReturns.toFixed(1)}M</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Gross Returns ÷ Fund Size = Actual Multiple</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.grossReturns.toFixed(1)}M ÷ ${breakdown.fundSize.toFixed(0)}M] = <strong style={{ color: 'var(--text-primary)' }}>{breakdown.actualMultiple.toFixed(2)}x</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Gross Returns - Fund Size = Fund Profit</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.grossReturns.toFixed(1)}M - ${breakdown.fundSize.toFixed(0)}M] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.fundProfit.toFixed(1)}M</strong>
                        </div>
                      </div>

                      <div>
                        {breakdown.carryBands && breakdown.carryBands.length > 0 ? (
                          // Show incremental hurdle breakdown
                          <>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              Incremental Carry Calculation:
                            </div>
                            <div style={{ fontSize: '0.9em', marginLeft: '8px', marginBottom: '4px' }}>
                              {breakdown.carryBands.map((band, idx) => (
                                <div key={idx} style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                                  ${band.profitInBand.toFixed(1)}M ({band.fromMultiple.toFixed(1)}x → {band.toMultiple.toFixed(1)}x) × {band.carryRate.toFixed(0)}% = <span style={{ color: 'var(--text-primary)' }}>${band.carryAmount.toFixed(2)}M</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                              Total Fund Carry = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.totalFundCarry.toFixed(2)}M</strong>
                              <span style={{ fontSize: '0.85em', fontStyle: 'italic', marginLeft: '8px' }}>
                                (Effective rate: {(breakdown.effectiveCarryRate * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </>
                        ) : (
                          // Show simple calculation (no hurdles or no profit)
                          <>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              Fund Profit × Carry Rate = Total Fund Carry
                            </div>
                            <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                              [${breakdown.fundProfit.toFixed(1)}M × {(breakdown.effectiveCarryRate * 100).toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.totalFundCarry.toFixed(2)}M</strong>
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Total Fund Carry × Your Allocation = Your Carry Pool Share</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.totalFundCarry.toFixed(2)}M × {breakdown.carryAllocationPercent}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.yourCarryPoolShare.toFixed(2)}M</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Your Carry Pool Share × Distribution % = Realized Carry</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.yourCarryPoolShare.toFixed(2)}M × {(breakdown.realizationPercent * 100).toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.realizedCarry.toFixed(2)}M</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Realized Carry × Vesting Progress = Your Vested Carry</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                          [${breakdown.realizedCarry.toFixed(2)}M × {(breakdown.vestingProgress * 100).toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.yourVestedCarry.toFixed(2)}M</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1em', paddingTop: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Final Amount:</span>
                    <span style={{ color: 'var(--primary-color)' }}>{formatCurrency(v.amount)}</span>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-color)', fontWeight: 700, fontSize: '0.95em' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{fb.name} Total:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(fb.amount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (exploreMode) {
    // Explore mode - wider sidebar with advanced toggle
    return (
      <div
        ref={tooltipSidebarRef}
        className="tooltip-sidebar"
        style={{
          width: 'fit-content',
          maxWidth: showAdvanced
            ? `${Math.min(tooltipData.fundBreakdowns.length * 540, 90)}vw`
            : '400px',
          minWidth: '300px',
          flex: '0 0 auto',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-xl)',
          overflowY: 'auto',
          overflowX: 'hidden',
          height: 'fit-content',
          position: 'sticky',
          top: 'var(--spacing-2xl)',
          transition: 'all 0.3s ease',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '2px solid var(--border-color)',
          fontSize: '1.05em',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: '1.6',
          fontWeight: 600
        }}>
          {headerText}
        </div>

        {/* Toggle between simple and advanced mode */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAdvanced(false)}
            style={{
              padding: '6px 16px',
              fontSize: '0.85em',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: !showAdvanced ? 'var(--primary-color)' : 'transparent',
              color: !showAdvanced ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: !showAdvanced ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            Simple
          </button>
          <button
            onClick={() => setShowAdvanced(true)}
            style={{
              padding: '6px 16px',
              fontSize: '0.85em',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: showAdvanced ? 'var(--primary-color)' : 'transparent',
              color: showAdvanced ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: showAdvanced ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            Advanced
          </button>
        </div>

        {showAdvanced ? advancedBreakdown : simpleBreakdown}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--border-color)', fontSize: '1.05em' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Grand Total:</span>
          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{formatCurrency(tooltipData.total)}</span>
        </div>
      </div>
    );
  }

  // Normal mode - simpler sidebar
  return (
    <div
      ref={tooltipSidebarRef}
      className="tooltip-sidebar"
      style={{
        width: '350px',
        minWidth: '350px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        overflowY: 'auto',
        height: 'fit-content',
        position: 'sticky',
        top: 'var(--spacing-2xl)'
      }}
    >
      <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid var(--border-color)', fontSize: '1.05em', color: 'var(--text-primary)', lineHeight: '1.6', fontWeight: 500 }}>
        {headerText}
      </div>

      {simpleBreakdown}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '16px', paddingTop: '16px', borderBottom: '2px solid var(--border-color)', fontSize: '1.05em' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Grand Total:</span>
        <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{formatCurrency(tooltipData.total)}</span>
      </div>
    </div>
  );
}
