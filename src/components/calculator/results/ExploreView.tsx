import { formatCurrency } from '../../../utils/formatCurrency';
import type { CellData } from '../../../types/calculator';

interface HeaderColumn {
  label: string;
  isCollapsed: boolean;
  originalIndices: number[];
}

interface ExploreViewProps {
  calculations: (CellData | null)[][];
  headerColumns: HeaderColumn[];
  maxYears: number;
  numZeroColumns: number;
  clickedCell: { row: number; col: number };
  onCellClick: (rowIdx: number, colIdx: number, data: CellData | null, e: React.MouseEvent, year: string) => void;
  onGoBack: () => void;
}

function ExploreView({
  calculations,
  headerColumns,
  maxYears,
  numZeroColumns,
  clickedCell,
  onCellClick,
  onGoBack
}: ExploreViewProps) {
  // Convert data column index to visual column index
  let visualColIdx = clickedCell.col;
  if (numZeroColumns > 0 && clickedCell.col < numZeroColumns) {
    visualColIdx = 0; // Collapsed column
  } else if (numZeroColumns > 0) {
    visualColIdx = clickedCell.col - numZeroColumns + 1;
  }

  const startCol = Math.max(0, visualColIdx - 2);
  const endCol = Math.min(headerColumns.length - 1, visualColIdx + 2);
  const startRow = Math.max(0, clickedCell.row - 2);
  const endRow = Math.min(maxYears - 1, clickedCell.row + 2);

  return (
    <>
      <table style={{ width: 'auto', tableLayout: 'auto', fontSize: '0.9em' }}>
        <thead>
          <tr>
            <th>Years Worked</th>
            {Array.from({ length: endCol - startCol + 1 }, (_, i) => startCol + i).map(i => (
              <th key={i}>{headerColumns[i].label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i).map(rowIdx => {
            const row = calculations[rowIdx];
            if (!row) return null;

            return (
              <tr key={rowIdx}>
                <td>{rowIdx + 1}</td>
                {Array.from({ length: endCol - startCol + 1 }, (_, i) => startCol + i).map(colIdx => {
                  const col = headerColumns[colIdx];

                  // Use the same logic as main table for data retrieval
                  let cellData: CellData | null = null;
                  let dataColIdx: number;

                  if (col.isCollapsed) {
                    const yearsWorked = rowIdx + 1;
                    // Only show data if years worked is within the collapsed range
                    if (yearsWorked <= numZeroColumns) {
                      const relevantColIdx = yearsWorked - 1;
                      cellData = row[relevantColIdx];
                      dataColIdx = relevantColIdx;
                    } else {
                      cellData = null; // Beyond collapsed range, show empty
                      dataColIdx = yearsWorked - 1;
                    }
                  } else {
                    const originalColIdx = col.originalIndices[0];
                    cellData = row[originalColIdx];
                    dataColIdx = originalColIdx;
                  }

                  const isClickedCell = rowIdx === clickedCell.row && dataColIdx === clickedCell.col;

                  if (!cellData) {
                    return <td key={colIdx} className="empty">-</td>;
                  }

                  return (
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
                          onGoBack();
                        } else {
                          onCellClick(rowIdx, dataColIdx, cellData, e, col.label);
                        }
                      }}
                    >
                      {formatCurrency(cellData.total)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div
        onClick={onGoBack}
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
    </>
  );
}

export default ExploreView;
