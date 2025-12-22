import { formatCurrency } from '../../../utils/formatCurrency';
import type { CellData } from '../../../types/calculator';

interface HeaderColumn {
  label: string;
  isCollapsed: boolean;
  originalIndices: number[];
}

interface GridViewProps {
  calculations: (CellData | null)[][];
  headerColumns: HeaderColumn[];
  maxYears: number;
  numZeroColumns: number;
  hoveredCell: { row: number; col: number } | null;
  clickedCell: { row: number; col: number } | null;
  onCellMouseEnter: (rowIdx: number, colIdx: number, data: CellData | null) => void;
  onCellMouseLeave: () => void;
  onCellClick: (rowIdx: number, colIdx: number, data: CellData | null, e: React.MouseEvent, year: string) => void;
  hasHistoricFunds: boolean;
  baseYear: number;
}

function GridView({
  calculations,
  headerColumns,
  maxYears,
  numZeroColumns,
  hoveredCell,
  clickedCell,
  onCellMouseEnter,
  onCellMouseLeave,
  onCellClick,
  hasHistoricFunds,
  baseYear
}: GridViewProps) {
  // Helper function to generate tooltip text similar to BreakdownPanel headerText
  const getTooltipText = (cellData: CellData | null) => {
    if (!cellData) return 'Click cell to explore';

    const headerText = hasHistoricFunds ? (
      cellData.yearsFromToday ? (
        `If you worked for ${cellData.yearsWorked} year${cellData.yearsWorked !== 1 ? 's' : ''} starting in ${baseYear}, you'd have made ${formatCurrency(cellData.total)} in carry in ${cellData.yearsFromToday} year${cellData.yearsFromToday !== 1 ? 's' : ''}.`
      ) : (
        `Working ${cellData.yearsWorked} year${cellData.yearsWorked !== 1 ? 's' : ''} starting in ${baseYear}, you made ${formatCurrency(cellData.total)} in carry during the early years because carry distributions had not yet started.`
      )
    ) : (
      cellData.yearsFromToday ? (
        `If you work for ${cellData.yearsWorked} year${cellData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make ${formatCurrency(cellData.total)} in carry in ${cellData.yearsFromToday} year${cellData.yearsFromToday !== 1 ? 's' : ''}.`
      ) : (
        `Working ${cellData.yearsWorked} year${cellData.yearsWorked !== 1 ? 's' : ''} starting today, you'll make ${formatCurrency(cellData.total)} in carry during the early years because carry distributions won't have started yet.`
      )
    );

    return headerText + '\n\nClick cell to explore';
  };
  return (
    <table>
      <thead>
        <tr>
          <th>Years Worked</th>
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
                  const isNearBottom = rowIdx >= calculations.slice(0, maxYears).length - 3;

                  return (
                    <td
                      key={colIdx}
                      className="value"
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        background: isActive ? '#f0f4ff' : undefined
                      }}
                      onMouseEnter={() => onCellMouseEnter(rowIdx, colIdx, cellData)}
                      onMouseLeave={onCellMouseLeave}
                      onClick={(e) => onCellClick(rowIdx, relevantColIdx, cellData, e, col.label)}
                    >
                      {formatCurrency(cellData.total)}
                      {isHovered && !clickedCell && (
                        <div
                          style={{
                            position: 'absolute',
                            ...(isNearBottom ? {
                              bottom: '100%',
                              marginBottom: '8px'
                            } : {
                              top: '100%',
                              marginTop: '8px'
                            }),
                            right: '0',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '12px 16px',
                            fontSize: '0.88em',
                            whiteSpace: 'normal',
                            minWidth: '280px',
                            maxWidth: '400px',
                            zIndex: 1000,
                            pointerEvents: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            lineHeight: '1.5'
                          }}
                        >
                          {getTooltipText(cellData).split('\n\n').map((text, idx) => (
                            <div key={idx} style={{
                              marginBottom: idx === 0 ? '8px' : 0,
                              fontWeight: idx === 1 ? 600 : 400,
                              color: idx === 1 ? 'var(--primary-color)' : 'var(--text-primary)'
                            }}>
                              {text}
                            </div>
                          ))}
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
              const isNearBottom = rowIdx >= calculations.slice(0, maxYears).length - 3;

              return (
                <td
                  key={colIdx}
                  className="value"
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    background: isActive ? '#f0f4ff' : undefined
                  }}
                  onMouseEnter={() => onCellMouseEnter(rowIdx, colIdx, cellData)}
                  onMouseLeave={onCellMouseLeave}
                  onClick={(e) => onCellClick(rowIdx, originalColIdx, cellData, e, col.label)}
                >
                  {formatCurrency(cellData.total)}
                  {isHovered && !clickedCell && (
                    <div
                      style={{
                        position: 'absolute',
                        ...(isNearBottom ? {
                          bottom: '100%',
                          marginBottom: '8px'
                        } : {
                          top: '100%',
                          marginTop: '8px'
                        }),
                        right: '0',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '12px 16px',
                        fontSize: '0.88em',
                        whiteSpace: 'normal',
                        minWidth: '280px',
                        maxWidth: '400px',
                        zIndex: 1000,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        lineHeight: '1.5'
                      }}
                    >
                      {getTooltipText(cellData).split('\n\n').map((text, idx) => (
                        <div key={idx} style={{
                          marginBottom: idx === 0 ? '8px' : 0,
                          fontWeight: idx === 1 ? 600 : 400,
                          color: idx === 1 ? 'var(--primary-color)' : 'var(--text-primary)'
                        }}>
                          {text}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default GridView;
