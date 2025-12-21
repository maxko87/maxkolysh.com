import { useState, useRef, useEffect, useMemo } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getDeploymentAtYear, getRealizationAtYear, calculateYearsToClear1X } from '../../../utils/calculations';
import type { CellData, Fund, Scenario, VintageBreakdown } from '../../../types/calculator';

interface DetailedBreakdown {
  fundSize: number;
  mgmtFeePercent: number;
  fundCycle: number;
  fundYears: number;
  deploymentTimeline: number;
  raiseContinuously: boolean;
  grossReturnMultiple: number;
  scenarioName: string;
  vintageAgeInYears: number;
  yearsIntoThisVintage: number;
  baseCarryPercent: number;
  hurdles: { multiple: number; carryPercent: number }[];
  effectiveCarryRate: number;
  carryAllocationPercent: number;
  deploymentPercent: number;
  realizationPercent: number;
  vestingProgress: number;
  cliffPeriod: number;
  vestingPeriod: number;
  yearsToClear1X: number;
  cliffMet: boolean;
  // Calculated values
  deployedCapital: number;
  grossReturns: number;
  actualMultiple: number;
  fundProfit: number;
  totalFundCarry: number;
  yourCarryPoolShare: number;
  realizedCarry: number;
  yourVestedCarry: number;
}

function ResultsTable() {
  const { calculations, state } = useCalculator();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [clickedCell, setClickedCell] = useState<{ row: number; col: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<CellData | null>(null);
  const [exploreMode, setExploreMode] = useState<{ colIdx: number; year: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const tooltipSidebarRef = useRef<HTMLDivElement>(null);

  const maxYears = 20;
  const currentYear = new Date().getFullYear();

  // Determine if we're showing historic funds and what the base year should be
  const hasHistoricFunds = state.funds.some(fund => fund.vintageYear !== undefined);
  const baseYear = hasHistoricFunds && state.funds[0]?.vintageYear
    ? state.funds[0].vintageYear
    : currentYear;

  // Helper to get detailed breakdown for a vintage
  const getDetailedBreakdown = (
    fund: Fund,
    scenario: Scenario,
    vintage: VintageBreakdown,
    yearsWorked: number,
    yearsFromToday: number
  ): DetailedBreakdown => {
    const fundSize = isNaN(fund.size) || !isFinite(fund.size) ? 200 : fund.size;
    const vestingPeriod = isNaN(fund.vestingPeriod) || !isFinite(fund.vestingPeriod) ? 4 : fund.vestingPeriod;
    const cliffPeriod = isNaN(fund.cliffPeriod) || !isFinite(fund.cliffPeriod) ? 1 : fund.cliffPeriod;
    const fundYears = isNaN(fund.years) || !isFinite(fund.years) ? 10 : fund.years;
    const deploymentTimeline = isNaN(fund.deploymentTimeline) || !isFinite(fund.deploymentTimeline) ? 2.5 : fund.deploymentTimeline;
    const carryAllocationPercent = isNaN(fund.carryAllocationPercent) || !isFinite(fund.carryAllocationPercent) ? 5 : fund.carryAllocationPercent;
    const fundCycle = isNaN(fund.fundCycle) || !isFinite(fund.fundCycle) ? 2 : fund.fundCycle;
    const baseCarryPercent = isNaN(fund.carryPercent) || !isFinite(fund.carryPercent) ? 20 : fund.carryPercent;
    const mgmtFeePercent = isNaN(fund.mgmtFeePercent) || !isFinite(fund.mgmtFeePercent) ? 2 : fund.mgmtFeePercent;
    const multiple = isNaN(scenario.grossReturnMultiple) || scenario.grossReturnMultiple < 0 ? 3 : scenario.grossReturnMultiple;

    // Calculate vintage age
    const vintageIndex = vintage.vintage - 1;
    const fundStartYear = vintageIndex * fundCycle;
    const vintageAgeInYears = yearsFromToday - fundStartYear;
    const yearsIntoThisVintage = yearsWorked - fundStartYear;

    // Get deployment and realization
    const deploymentPercent = getDeploymentAtYear(vintageAgeInYears, fund.deploymentCurve, deploymentTimeline);
    const yearsToClear = calculateYearsToClear1X(multiple, fund.realizationCurve, fundYears);
    const realizationPercent = getRealizationAtYear(vintageAgeInYears, fund.realizationCurve, fundYears, yearsToClear);

    // Calculate vesting
    const vestingProgress = Math.min(yearsIntoThisVintage / vestingPeriod, 1);
    const cliffMet = yearsIntoThisVintage >= cliffPeriod;

    // Calculate carry with hurdles
    const deployedCapital = fundSize * deploymentPercent;
    const grossReturns = deployedCapital * multiple;
    const actualMultiple = grossReturns / fundSize;
    const fundProfit = Math.max(0, grossReturns - fundSize);

    let effectiveCarryRate = baseCarryPercent / 100;
    const sortedHurdles = [...fund.hurdles].sort((a, b) => a.multiple - b.multiple);
    for (const hurdle of sortedHurdles) {
      if (actualMultiple >= hurdle.multiple) {
        effectiveCarryRate = hurdle.carryPercent / 100;
      }
    }

    const totalFundCarry = effectiveCarryRate * fundProfit;
    const yourCarryPoolShare = totalFundCarry * (carryAllocationPercent / 100);
    const realizedCarry = yourCarryPoolShare * realizationPercent;
    const yourVestedCarry = realizedCarry * vestingProgress;

    return {
      fundSize,
      mgmtFeePercent,
      fundCycle,
      fundYears,
      deploymentTimeline,
      raiseContinuously: fund.raiseContinuously,
      grossReturnMultiple: multiple,
      scenarioName: scenario.name,
      vintageAgeInYears,
      yearsIntoThisVintage,
      baseCarryPercent,
      hurdles: sortedHurdles,
      effectiveCarryRate: effectiveCarryRate * 100,
      carryAllocationPercent,
      deploymentPercent,
      realizationPercent,
      vestingProgress,
      cliffPeriod,
      vestingPeriod,
      yearsToClear1X: yearsToClear,
      cliffMet,
      deployedCapital,
      grossReturns,
      actualMultiple,
      fundProfit,
      totalFundCarry,
      yourCarryPoolShare,
      realizedCarry,
      yourVestedCarry
    };
  };

  // Find how many leading columns are all zeros/empty
  const numZeroColumns = useMemo(() => {
    let count = 0;
    for (let colIdx = 0; colIdx < maxYears; colIdx++) {
      const allZero = calculations.every(row => {
        const cell = row[colIdx];
        return !cell || cell.total === 0;
      });
      if (allZero) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [calculations, maxYears]);


  const handleCellMouseEnter = (rowIdx: number, colIdx: number, data: CellData | null) => {
    if (data && !clickedCell) {
      setHoveredCell({ row: rowIdx, col: colIdx });
    }
  };

  const handleCellMouseLeave = () => {
    if (!clickedCell) {
      setHoveredCell(null);
    }
  };

  const handleCellClick = (rowIdx: number, colIdx: number, data: CellData | null, e: React.MouseEvent, year: string) => {
    e.stopPropagation();
    if (data) {
      // If clicking the same cell, close it
      if (clickedCell?.row === rowIdx && clickedCell?.col === colIdx) {
        setClickedCell(null);
        setTooltipData(null);
        setExploreMode(null);
      } else {
        setClickedCell({ row: rowIdx, col: colIdx });
        setHoveredCell(null);
        setTooltipData(data);
        setExploreMode({ colIdx, year });
      }
    }
  };

  const handleGoBack = () => {
    setClickedCell(null);
    setTooltipData(null);
    setExploreMode(null);
  };

  // Auto-scroll to tooltip sidebar on mobile when a cell is clicked
  useEffect(() => {
    if (tooltipData && tooltipSidebarRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        tooltipSidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [tooltipData]);

  // Keep explore view open - don't close on outside clicks
  // Users can interact with sidebar controls while explore view stays active

  // Update tooltip data when calculations change (e.g., when funds are added/removed)
  useEffect(() => {
    if (clickedCell && exploreMode) {
      const row = calculations[clickedCell.row];
      if (row) {
        const cellData = row[clickedCell.col];
        if (cellData) {
          setTooltipData(cellData);
        }
      }
    }
  }, [calculations, clickedCell, exploreMode]);

  // Build header columns
  const headerColumns = useMemo(() => {
    const columns = [];

    // Add collapsed zero columns as single column
    if (numZeroColumns > 0) {
      const startYear = baseYear + 1;
      const endYear = baseYear + numZeroColumns;
      columns.push({
        label: numZeroColumns === 1 ? `${startYear}` : `${startYear}-${endYear}`,
        isCollapsed: true,
        originalIndices: Array.from({ length: numZeroColumns }, (_, i) => i)
      });
    }

    // Add remaining columns
    for (let i = numZeroColumns; i < maxYears; i++) {
      columns.push({
        label: `${baseYear + i + 1}`,
        isCollapsed: false,
        originalIndices: [i]
      });
    }

    return columns;
  }, [numZeroColumns, maxYears, baseYear]);

  return (
    <div className="results-layout">
      {!exploreMode && tooltipData && (
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
            {hasHistoricFunds ? (
              tooltipData.yearsFromToday ? (
                <>If you worked for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you'd have made {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
              ) : (
                <>Working {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you made {formatCurrency(tooltipData.total)} in carry during the early years because carry distributions had not yet started.</>
              )
            ) : (
              tooltipData.yearsFromToday ? (
                <>If you work for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
              ) : (
                <>Working {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry during the early years because carry distributions won't have started yet.</>
              )
            )}
          </div>

          {tooltipData.fundBreakdowns.map((fb, idx) => (
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
              {fb.vintages.map((v, vIdx) => (
                <div
                  key={vIdx}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.85em', marginBottom: '6px', paddingLeft: '12px' }}
                >
                  <span style={{ color: 'var(--text-tertiary)' }}>Vintage {v.vintage} ({v.yearsIn}y in, {v.realization}% realized)</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(v.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{fb.name} Total:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatCurrency(fb.amount)}</span>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--border-color)', fontSize: '1.05em' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Grand Total:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{formatCurrency(tooltipData.total)}</span>
          </div>
        </div>
      )}

      <div className="results-container" style={{ overflowX: exploreMode ? 'visible' : 'auto' }}>
        <div className="results-table" style={{ width: exploreMode ? 'fit-content' : 'auto', maxWidth: exploreMode ? '100%' : 'none' }}>
        {exploreMode && clickedCell ? (
          <table style={{ width: 'auto', tableLayout: 'auto', fontSize: '0.9em' }}>
            <thead>
              <tr>
                <th>Years at Fund</th>
                {(() => {
                  const cols = [];
                  // Convert data column index to visual column index
                  let visualColIdx = clickedCell.col;
                  if (numZeroColumns > 0 && clickedCell.col < numZeroColumns) {
                    visualColIdx = 0; // Collapsed column
                  } else if (numZeroColumns > 0) {
                    visualColIdx = clickedCell.col - numZeroColumns + 1;
                  }
                  const startCol = Math.max(0, visualColIdx - 2);
                  const endCol = Math.min(headerColumns.length - 1, visualColIdx + 2);

                  for (let i = startCol; i <= endCol; i++) {
                    cols.push(<th key={i}>{headerColumns[i].label}</th>);
                  }
                  return cols;
                })()}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                const startRow = Math.max(0, clickedCell.row - 2);
                const endRow = Math.min(maxYears - 1, clickedCell.row + 2);

                // Convert data column index to visual column index
                let visualColIdx = clickedCell.col;
                if (numZeroColumns > 0 && clickedCell.col < numZeroColumns) {
                  visualColIdx = 0; // Collapsed column
                } else if (numZeroColumns > 0) {
                  visualColIdx = clickedCell.col - numZeroColumns + 1;
                }

                for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
                  const row = calculations[rowIdx];
                  if (!row) continue;

                  const startCol = Math.max(0, visualColIdx - 2);
                  const endCol = Math.min(headerColumns.length - 1, visualColIdx + 2);

                  rows.push(
                    <tr key={rowIdx}>
                      <td>{rowIdx + 1}</td>
                      {(() => {
                        const cells = [];
                        for (let colIdx = startCol; colIdx <= endCol; colIdx++) {
                          const col = headerColumns[colIdx];
                          // Use the same logic as main table for data retrieval
                          let cellData;
                          if (col.isCollapsed) {
                            const yearsWorked = rowIdx + 1;
                            // Only show data if years worked is within the collapsed range
                            if (yearsWorked <= numZeroColumns) {
                              const relevantColIdx = yearsWorked - 1;
                              cellData = row[relevantColIdx];
                            } else {
                              cellData = null; // Beyond collapsed range, show empty
                            }
                          } else {
                            const originalColIdx = col.originalIndices[0];
                            cellData = row[originalColIdx];
                          }

                          // Check if this is the clicked cell (compare data column indices)
                          let dataColIdx;
                          if (col.isCollapsed) {
                            const yearsWorked = rowIdx + 1;
                            dataColIdx = yearsWorked - 1;
                          } else {
                            dataColIdx = col.originalIndices[0];
                          }
                          const isClickedCell = rowIdx === clickedCell.row && dataColIdx === clickedCell.col;

                          if (!cellData) {
                            cells.push(<td key={colIdx} className="empty">-</td>);
                            continue;
                          }

                          cells.push(
                            <td
                              key={colIdx}
                              className="value"
                              style={{
                                cursor: 'pointer',
                                background: isClickedCell ? '#f0f4ff' : undefined
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isClickedCell) {
                                  handleGoBack();
                                } else {
                                  handleCellClick(rowIdx, dataColIdx, cellData, e, col.label);
                                }
                              }}
                            >
                              {formatCurrency(cellData.total)}
                            </td>
                          );
                        }
                        return cells;
                      })()}
                    </tr>
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Years at Fund</th>
              {headerColumns.map((col, idx) => (
                <th key={idx}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calculations.slice(0, maxYears).map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td>{rowIdx + 1}</td>
                {headerColumns.map((col, colIdx) => {
                  // For collapsed columns, check if this row should show data
                  if (col.isCollapsed) {
                    const yearsWorked = rowIdx + 1;

                    // Show $0 if years worked is within the collapsed range
                    if (yearsWorked <= numZeroColumns) {
                      // For row N, check column N-1 (the year that equals yearsWorked)
                      const relevantColIdx = yearsWorked - 1;
                      const cellData = row[relevantColIdx];

                      if (!cellData) {
                        return <td key={colIdx} className="empty">-</td>;
                      }

                      const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                      const isClicked = clickedCell?.row === rowIdx && clickedCell?.col === colIdx;
                      const isActive = isHovered || isClicked;

                      return (
                        <td
                          key={colIdx}
                          className="value"
                          style={{
                            position: 'relative',
                            cursor: 'pointer',
                            background: isActive ? '#f0f4ff' : undefined
                          }}
                          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx, cellData)}
                          onMouseLeave={handleCellMouseLeave}
                          onClick={(e) => handleCellClick(rowIdx, relevantColIdx, cellData, e, col.label)}
                        >
                          {formatCurrency(cellData.total)}
                          {isHovered && !clickedCell && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginTop: '4px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '4px 8px',
                                fontSize: '0.75em',
                                whiteSpace: 'nowrap',
                                zIndex: 1000,
                                pointerEvents: 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            >
                              Click to explore
                            </div>
                          )}
                        </td>
                      );
                    }

                    // Beyond the collapsed range, show "-"
                    return <td key={colIdx} className="empty">-</td>;
                  }

                  // For regular columns, show the data
                  const originalColIdx = col.originalIndices[0];
                  const cellData = row[originalColIdx];

                  if (!cellData) {
                    return <td key={colIdx} className="empty">-</td>;
                  }

                  const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                  const isClicked = clickedCell?.row === rowIdx && clickedCell?.col === colIdx;
                  const isActive = isHovered || isClicked;

                  return (
                    <td
                      key={colIdx}
                      className="value"
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        background: isActive ? '#f0f4ff' : undefined
                      }}
                      onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx, cellData)}
                      onMouseLeave={handleCellMouseLeave}
                      onClick={(e) => handleCellClick(rowIdx, originalColIdx, cellData, e, col.label)}
                    >
                      {formatCurrency(cellData.total)}
                      {isHovered && !clickedCell && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '4px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '4px 8px',
                            fontSize: '0.75em',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            pointerEvents: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          Click to explore
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        )}
        {exploreMode && (
          <div
            onClick={handleGoBack}
            style={{
              marginTop: 'var(--spacing-lg)',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '1.1em',
              padding: 'var(--spacing-md)',
              fontWeight: 500
            }}
          >
            ← Back to full view
          </div>
        )}
      </div>
    </div>

    {exploreMode && tooltipData && (
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
          {hasHistoricFunds ? (
            tooltipData.yearsFromToday ? (
              <>If you worked for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you'd have made {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
            ) : (
              <>Working {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you made {formatCurrency(tooltipData.total)} in carry during the early years because carry distributions had not yet started.</>
            )
          ) : (
            tooltipData.yearsFromToday ? (
              <>If you work for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
            ) : (
              <>Working {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry during the early years because carry distributions won't have started yet.</>
            )
          )}
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

        {!showAdvanced ? (
          // Simple mode - current view
          <>
            {tooltipData.fundBreakdowns.map((fb, idx) => (
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
                {fb.vintages.map((v, vIdx) => (
                  <div
                    key={vIdx}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '0.85em', marginBottom: '6px', paddingLeft: '12px' }}
                  >
                    <span style={{ color: 'var(--text-tertiary)' }}>Vintage {v.vintage} ({v.yearsIn}y in, {v.realization}% realized)</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(v.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{fb.name} Total:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatCurrency(fb.amount)}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          // Advanced mode - detailed breakdown
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tooltipData.fundBreakdowns.length}, minmax(380px, 500px))`,
            gap: '16px',
            width: 'fit-content',
            maxWidth: '100%'
          }}>
            {tooltipData.fundBreakdowns.map((fb, fbIdx) => {
              const fund = state.funds.find(f => f.name === fb.name);
              if (!fund) return null;

              const selectedScenarioId = state.selectedScenarios[fund.id];
              const scenario = fund.scenarios.find(s => s.id === selectedScenarioId) || fund.scenarios[0];
              if (!scenario) return null;

              return (
                <div key={fbIdx}>
                  <div style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '12px', fontSize: '1em' }}>
                    {fb.name}
                  </div>

                  {fb.vintages.map((v, vIdx) => {
                    const breakdown = getDetailedBreakdown(fund, scenario, v, tooltipData.yearsWorked, tooltipData.yearsFromToday);
                    const deploymentYear = baseYear + (v.vintage - 1) * breakdown.fundCycle;

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
                          Vintage {v.vintage} (deployed {deploymentYear})
                        </div>

                        {/* Scenario & Time */}
                        <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                            <span>Scenario:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{breakdown.scenarioName} ({breakdown.grossReturnMultiple}x)</span>
                            <span>Vintage Age:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{breakdown.vintageAgeInYears.toFixed(1)} years</span>
                            <span>Years Worked:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{breakdown.yearsIntoThisVintage.toFixed(1)} years</span>
                          </div>
                        </div>

                        {/* Progress Metrics */}
                        <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                            <span>Deployment Progress:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{(breakdown.deploymentPercent * 100).toFixed(0)}%</span>
                            <span>Realization Progress:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{(breakdown.realizationPercent * 100).toFixed(0)}%</span>
                            <span>Vesting Progress:</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{(breakdown.vestingProgress * 100).toFixed(0)}% {breakdown.cliffMet ? '✓' : '✗ cliff not met'}</span>
                            {breakdown.realizationPercent === 0 && breakdown.vintageAgeInYears < breakdown.yearsToClear1X && (
                              <>
                                <span style={{ gridColumn: '1 / -1', fontSize: '0.85em', fontStyle: 'italic' }}>
                                  (No distributions yet - need {(breakdown.yearsToClear1X - breakdown.vintageAgeInYears).toFixed(1)} more years)
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
                              <div style={{ color: 'var(--text-secondary)' }}>Deployed Capital = Fund Size × Deployment %</div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.fundSize.toFixed(0)}M × {(breakdown.deploymentPercent * 100).toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.deployedCapital.toFixed(1)}M</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>Gross Returns = Deployed Capital × Return Multiple</div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.deployedCapital.toFixed(1)}M × {breakdown.grossReturnMultiple}x] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.grossReturns.toFixed(1)}M</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>Actual Multiple = Gross Returns ÷ Fund Size</div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.grossReturns.toFixed(1)}M ÷ ${breakdown.fundSize.toFixed(0)}M] = <strong style={{ color: 'var(--text-primary)' }}>{breakdown.actualMultiple.toFixed(2)}x</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>Fund Profit = Gross Returns - Fund Size</div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.grossReturns.toFixed(1)}M - ${breakdown.fundSize.toFixed(0)}M] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.fundProfit.toFixed(1)}M</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>
                                Total Fund Carry = Fund Profit × Effective Carry Rate
                                {breakdown.hurdles.length > 0 && breakdown.effectiveCarryRate !== breakdown.baseCarryPercent && (
                                  <span style={{ fontSize: '0.85em', fontStyle: 'italic' }}> (using hurdle at {breakdown.actualMultiple.toFixed(1)}x)</span>
                                )}
                              </div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.fundProfit.toFixed(1)}M × {breakdown.effectiveCarryRate.toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.totalFundCarry.toFixed(2)}M</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>Your Carry Pool Share = Total Fund Carry × Your Allocation</div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.totalFundCarry.toFixed(2)}M × {breakdown.carryAllocationPercent}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.yourCarryPoolShare.toFixed(2)}M</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>Realized Carry = Your Carry Pool Share × Realization %</div>
                              <div style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '0.9em' }}>
                                [${breakdown.yourCarryPoolShare.toFixed(2)}M × {(breakdown.realizationPercent * 100).toFixed(0)}%] = <strong style={{ color: 'var(--text-primary)' }}>${breakdown.realizedCarry.toFixed(2)}M</strong>
                              </div>
                            </div>

                            <div>
                              <div style={{ color: 'var(--text-secondary)' }}>Your Vested Carry = Realized Carry × Vesting Progress</div>
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
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--border-color)', fontSize: '1.05em' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Grand Total:</span>
          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{formatCurrency(tooltipData.total)}</span>
        </div>
      </div>
    )}
    </div>
  );
}

export default ResultsTable;
