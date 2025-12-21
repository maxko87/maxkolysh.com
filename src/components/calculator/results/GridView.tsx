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
  onCellClick
}: GridViewProps) {
  return (
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
                      onMouseEnter={() => onCellMouseEnter(rowIdx, colIdx, cellData)}
                      onMouseLeave={onCellMouseLeave}
                      onClick={(e) => onCellClick(rowIdx, relevantColIdx, cellData, e, col.label)}
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
                  onMouseEnter={() => onCellMouseEnter(rowIdx, colIdx, cellData)}
                  onMouseLeave={onCellMouseLeave}
                  onClick={(e) => onCellClick(rowIdx, originalColIdx, cellData, e, col.label)}
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
  );
}

export default GridView;
