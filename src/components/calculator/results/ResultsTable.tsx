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

  useEffect(() => {
    if (tooltipRef.current && cellRef.current) {
      const tooltip = tooltipRef.current;
      const cell = cellRef.current;
      const cellRect = cell.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Determine vertical position
      const spaceBelow = viewportHeight - cellRect.bottom;
      const spaceAbove = cellRect.top;

      const position: any = { left: '50%', transform: 'translateX(-50%)' };

      if (spaceBelow >= tooltipRect.height || spaceBelow > spaceAbove) {
        // Position below cell
        position.top = '100%';
        position.bottom = 'auto';
        position.marginTop = '8px';
      } else {
        // Position above cell
        position.bottom = '100%';
        position.top = 'auto';
        position.marginBottom = '8px';
      }

      setTooltipPosition(position);

      // Check horizontal overflow after initial render
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
    <div className="results-table-container">
      <table className="results-table w-full">
        <thead>
          <tr>
            <th className="empty-corner"></th>
            <th className="header-label" colSpan={maxYears}>
              Years from Today
            </th>
          </tr>
          <tr>
            <th className="header-label">
              Years Worked
            </th>
            {Array.from({ length: maxYears }, (_, i) => i + 1).map(year => (
              <th key={year}>
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calculations.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td>
                {rowIdx + 1}
              </td>
              {row.map((cellData, colIdx) => {
                if (!cellData || cellData.total < 0.01) {
                  return (
                    <td
                      key={colIdx}
                      className="empty"
                    >
                      -
                    </td>
                  );
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
                    ${cellData.total.toFixed(1)}M

                    {isHovered && tooltipData && (
                      <div
                        ref={tooltipRef}
                        className="cell-tooltip"
                        style={{
                          ...tooltipPosition,
                          position: 'absolute',
                          minWidth: '300px',
                          zIndex: 1000
                        }}
                      >
                        <div className="tooltip-row" style={{ borderBottom: '2px solid rgba(255,255,255,0.4)', marginBottom: '10px', paddingBottom: '8px' }}>
                          <span className="tooltip-label">Years Worked:</span>
                          <span className="tooltip-value">{tooltipData.yearsWorked}</span>
                        </div>
                        <div className="tooltip-row" style={{ borderBottom: '2px solid rgba(255,255,255,0.4)', marginBottom: '12px', paddingBottom: '8px' }}>
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
                            <div style={{ fontWeight: '700', color: '#a5b4fc', marginBottom: '6px', fontSize: '0.95em' }}>
                              {fb.name}
                            </div>
                            {fb.vintages.map((v, vIdx) => (
                              <div
                                key={vIdx}
                                className="tooltip-row"
                                style={{ fontSize: '0.85em', marginBottom: '4px', paddingLeft: '10px' }}
                              >
                                <span className="tooltip-label">Vintage {v.vintage} ({v.yearsIn}y in, {v.realization}% realized)</span>
                                <span className="tooltip-value">${v.amount.toFixed(1)}M</span>
                              </div>
                            ))}
                            <div className="tooltip-row" style={{ marginTop: '6px', paddingLeft: '10px', fontWeight: '600' }}>
                              <span className="tooltip-label">{fb.name} Total:</span>
                              <span className="tooltip-value">${fb.amount.toFixed(1)}M</span>
                            </div>
                          </div>
                        ))}

                        <div className="tooltip-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.4)', fontSize: '1.05em' }}>
                          <span className="tooltip-label" style={{ fontWeight: '700' }}>Grand Total:</span>
                          <span className="tooltip-value" style={{ fontWeight: '700', color: '#a5b4fc' }}>${tooltipData.total.toFixed(1)}M</span>
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
  );
}

export default ResultsTable;
