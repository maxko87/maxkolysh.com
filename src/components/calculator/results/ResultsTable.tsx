import { useState, useRef, useEffect } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import type { CellData } from '../../../types/calculator';

function ResultsTable() {
  const { calculations } = useCalculator();
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

  const formatCurrency = (value: number): string => {
    if (value < 100) {
      // Less than $100M: show 1 decimal
      return `$${value.toFixed(1)}M`;
    } else if (value < 1000) {
      // $100M-$999M: no decimal
      return `$${Math.round(value)}M`;
    } else if (value < 10000) {
      // $1B-$9.99B: 2 decimals
      return `$${(value / 1000).toFixed(2)}B`;
    } else if (value < 100000) {
      // $10B-$99.9B: 1 decimal
      return `$${(value / 1000).toFixed(1)}B`;
    } else {
      // $100B+: no decimal
      return `$${Math.round(value / 1000)}B`;
    }
  };

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

  return (
    <div className="results-container">
      <div className="results-table">
        <table>
          <thead>
            <tr>
              <th>Years at Fund</th>
              {Array.from({ length: maxYears }, (_, i) => i + 1).map(year => (
                <th key={year}>{currentYear + year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calculations.slice(0, maxYears).map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td>{rowIdx + 1}</td>
                {row.map((cellData, colIdx) => {
                  if (!cellData || cellData.total < 0.01) {
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
                        <div className="tooltip-row">
                          <span className="tooltip-label">Years Worked:</span>
                          <span className="tooltip-value">{tooltipData.yearsWorked}</span>
                        </div>
                        <div className="tooltip-row">
                          <span className="tooltip-label">Years from Today:</span>
                          <span className="tooltip-value">{tooltipData.yearsFromToday}</span>
                        </div>

                        {tooltipData.fundBreakdowns.map((fb, idx) => (
                          <div
                            key={idx}
                            style={{
                              marginBottom: '12px',
                              ...(idx > 0 ? { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' } : {})
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '6px', fontSize: '0.95em' }}>
                              {fb.name}
                            </div>
                            {fb.vintages.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', fontSize: '0.85em', marginBottom: '4px', paddingLeft: '10px' }}
                              >
                                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Vintage {v.vintage} ({v.yearsIn}y in, {v.realization}% realized)</span>
                                <span style={{ color: 'white', fontWeight: 600 }}>${v.amount.toFixed(1)}M</span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '6px', paddingLeft: '10px', fontWeight: 600 }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{fb.name} Total:</span>
                              <span style={{ color: 'white', fontWeight: 600 }}>${fb.amount.toFixed(1)}M</span>
                            </div>
                          </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.4)', fontSize: '1.05em' }}>
                          <span style={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)' }}>Grand Total:</span>
                          <span style={{ fontWeight: 700, color: '#a5b4fc' }}>${tooltipData.total.toFixed(1)}M</span>
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
