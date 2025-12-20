import { useState, useRef, useEffect, useMemo } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { CellData } from '../../../types/calculator';

function ResultsTable() {
  const { calculations, state } = useCalculator();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<CellData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top?: string; bottom?: string; left: string; transform: string; marginTop?: string; marginBottom?: string }>({
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '8px'
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);

  const maxYears = 20;
  const currentYear = new Date().getFullYear();

  // Determine if we're showing historic funds and what the base year should be
  const hasHistoricFunds = state.funds.some(fund => fund.vintageYear !== undefined);
  const baseYear = hasHistoricFunds && state.funds[0]?.vintageYear
    ? state.funds[0].vintageYear
    : currentYear;

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

  useEffect(() => {
    if (tooltipRef.current && cellRef.current) {
      const tooltip = tooltipRef.current;
      const cell = cellRef.current;
      const cellRect = cell.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - cellRect.bottom;
      const spaceAbove = cellRect.top;

      const position: any = { left: '50%', transform: 'translateX(-50%)' };

      if (spaceBelow >= tooltipRect.height || spaceBelow > spaceAbove) {
        position.top = '100%';
        position.bottom = 'auto';
        position.marginTop = '8px';
      } else {
        position.bottom = '100%';
        position.top = 'auto';
        position.marginBottom = '8px';
      }

      setTooltipPosition(position);

      setTimeout(() => {
        const tooltipRectAfter = tooltip.getBoundingClientRect();
        if (tooltipRectAfter.left < 0) {
          setTooltipPosition(prev => ({ ...prev, left: '0', transform: 'translateX(0)' }));
        } else if (tooltipRectAfter.right > viewportWidth) {
          setTooltipPosition(prev => ({ ...prev, left: 'auto', right: '0', transform: 'translateX(0)' }));
        }
      }, 0);
    }
  }, [tooltipData, hoveredCell]);

  const handleCellMouseEnter = (rowIdx: number, colIdx: number, data: CellData | null) => {
    if (data) {
      setHoveredCell({ row: rowIdx, col: colIdx });
      setTooltipData(data);
    }
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
    setTooltipData(null);
  };

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
    <div className="results-container">
      <div className="results-table">
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
                  // For collapsed columns, check first year's data
                  if (col.isCollapsed) {
                    const firstColIdx = col.originalIndices[0];
                    const cellData = row[firstColIdx];

                    // If no data or beyond working years, show "-"
                    if (!cellData) {
                      return <td key={colIdx} className="empty">-</td>;
                    }

                    // If there's data (even if $0), show "$0" with tooltip
                    const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;

                    return (
                      <td
                        key={colIdx}
                        className="value"
                        style={{ position: 'relative' }}
                        ref={isHovered ? cellRef : null}
                        onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx, cellData)}
                        onMouseLeave={handleCellMouseLeave}
                      >
                        {formatCurrency(cellData.total)}

                        {isHovered && tooltipData && (
                          <div
                            ref={tooltipRef}
                            className={`cell-tooltip ${tooltipPosition.top === '100%' ? 'below' : ''}`}
                            style={{
                              ...tooltipPosition,
                              position: 'absolute',
                              minWidth: '300px',
                              zIndex: 10000,
                              pointerEvents: 'none'
                            }}
                          >
                            <div className="tooltip-label" style={{ marginBottom: '12px' }}>
                              {hasHistoricFunds ? (
                                <>If you worked for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you'd have made {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
                              ) : (
                                <>If you work for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
                              )}
                            </div>

                            {tooltipData.fundBreakdowns.map((fb, idx) => (
                              <div
                                key={idx}
                                style={{
                                  marginBottom: '12px',
                                  ...(idx > 0 ? { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' } : {})
                                }}
                              >
                                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '6px', fontSize: '0.95em', textAlign: 'left' }}>
                                  {fb.name}
                                </div>
                                {fb.vintages.map((v, vIdx) => (
                                  <div
                                    key={vIdx}
                                    style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', fontSize: '0.85em', marginBottom: '4px', paddingLeft: '12px' }}
                                  >
                                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Vintage {v.vintage} ({v.yearsIn}y in, {v.realization}% realized)</span>
                                    <span style={{ color: 'white', fontWeight: 600 }}>{formatCurrency(v.amount)}</span>
                                  </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', fontWeight: 600 }}>
                                  <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{fb.name} Total:</span>
                                  <span style={{ color: 'white', fontWeight: 700 }}>{formatCurrency(fb.amount)}</span>
                                </div>
                              </div>
                            ))}

                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.4)', fontSize: '1.05em' }}>
                              <span style={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>Grand Total:</span>
                              <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{formatCurrency(tooltipData.total)}</span>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  }

                  // For regular columns, show the data
                  const originalColIdx = col.originalIndices[0];
                  const cellData = row[originalColIdx];

                  if (!cellData) {
                    return <td key={colIdx} className="empty">-</td>;
                  }

                  const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;

                  return (
                    <td
                      key={colIdx}
                      className="value"
                      style={{ position: 'relative' }}
                      ref={isHovered ? cellRef : null}
                      onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx, cellData)}
                      onMouseLeave={handleCellMouseLeave}
                    >
                      {formatCurrency(cellData.total)}

                      {isHovered && tooltipData && (
                        <div
                          ref={tooltipRef}
                          className={`cell-tooltip ${tooltipPosition.top === '100%' ? 'below' : ''}`}
                          style={{
                            ...tooltipPosition,
                            position: 'absolute',
                            minWidth: '300px',
                            zIndex: 10000,
                            pointerEvents: 'none'
                          }}
                        >
                          <div className="tooltip-label" style={{ marginBottom: '12px' }}>
                            {hasHistoricFunds ? (
                              <>If you worked for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting in {baseYear}, you'd have made {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
                            ) : (
                              <>If you work for {tooltipData.yearsWorked} year{tooltipData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make {formatCurrency(tooltipData.total)} in carry in {tooltipData.yearsFromToday} year{tooltipData.yearsFromToday !== 1 ? 's' : ''}.</>
                            )}
                          </div>

                          {tooltipData.fundBreakdowns.map((fb, idx) => (
                            <div
                              key={idx}
                              style={{
                                marginBottom: '12px',
                                ...(idx > 0 ? { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' } : {})
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '6px', fontSize: '0.95em', textAlign: 'left' }}>
                                {fb.name}
                              </div>
                              {fb.vintages.map((v, vIdx) => (
                                <div
                                  key={vIdx}
                                  style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', fontSize: '0.85em', marginBottom: '4px', paddingLeft: '12px' }}
                                >
                                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Vintage {v.vintage} ({v.yearsIn}y in, {v.realization}% realized)</span>
                                  <span style={{ color: 'white', fontWeight: 600 }}>{formatCurrency(v.amount)}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.15)', fontWeight: 600 }}>
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{fb.name} Total:</span>
                                <span style={{ color: 'white', fontWeight: 700 }}>{formatCurrency(fb.amount)}</span>
                              </div>
                            </div>
                          ))}

                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.4)', fontSize: '1.05em' }}>
                            <span style={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>Grand Total:</span>
                            <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{formatCurrency(tooltipData.total)}</span>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;
