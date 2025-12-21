import { useState, useRef, useEffect, useMemo } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { CellData } from '../../../types/calculator';

function ResultsTable() {
  const { calculations, state } = useCalculator();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [clickedCell, setClickedCell] = useState<{ row: number; col: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<CellData | null>(null);
  const tooltipSidebarRef = useRef<HTMLDivElement>(null);

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


  const handleCellMouseEnter = (rowIdx: number, colIdx: number, data: CellData | null) => {
    if (data && !clickedCell) {
      setHoveredCell({ row: rowIdx, col: colIdx });
      setTooltipData(data);
    }
  };

  const handleCellMouseLeave = () => {
    if (!clickedCell) {
      setHoveredCell(null);
      setTooltipData(null);
    }
  };

  const handleCellClick = (rowIdx: number, colIdx: number, data: CellData | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (data) {
      // If clicking the same cell, close it
      if (clickedCell?.row === rowIdx && clickedCell?.col === colIdx) {
        setClickedCell(null);
        setTooltipData(null);
      } else {
        setClickedCell({ row: rowIdx, col: colIdx });
        setHoveredCell(null);
        setTooltipData(data);
      }
    }
  };

  // Auto-scroll to tooltip sidebar on mobile when a cell is clicked
  useEffect(() => {
    if (tooltipData && tooltipSidebarRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        tooltipSidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [tooltipData]);

  // Click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clickedCell) {
        const target = e.target as HTMLElement;
        // Don't close if clicking inside the sidebar
        if (!target.closest('.tooltip-sidebar')) {
          setClickedCell(null);
          setTooltipData(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [clickedCell]);

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
                          onClick={(e) => handleCellClick(rowIdx, colIdx, cellData, e)}
                        >
                          {formatCurrency(cellData.total)}
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
                      onClick={(e) => handleCellClick(rowIdx, colIdx, cellData, e)}
                    >
                      {formatCurrency(cellData.total)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {tooltipData && (
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
    </div>
  );
}

export default ResultsTable;
