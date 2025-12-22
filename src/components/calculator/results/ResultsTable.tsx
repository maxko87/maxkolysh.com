import { useState, useRef, useEffect, useMemo } from 'react';
import { useCalculator } from '../../../hooks/useCalculator';
import type { CellData } from '../../../types/calculator';
import BreakdownPanel from './BreakdownPanel';
import GridView from './GridView';
import ExploreView from './ExploreView';

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

  // If no funds, show empty state
  if (state.funds.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '0.95em'
      }}>
        Add a fund!
      </div>
    );
  }

  return (
    <div className="results-layout">
      {!exploreMode && tooltipData && (
        <div ref={tooltipSidebarRef}>
          <BreakdownPanel
            tooltipData={tooltipData}
            hasHistoricFunds={hasHistoricFunds}
            baseYear={baseYear}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            exploreMode={false}
            funds={state.funds}
            selectedScenarios={state.selectedScenarios}
          />
        </div>
      )}

      <div className="results-container" style={{ overflowX: exploreMode ? 'visible' : 'auto' }}>
        <div className="results-table" style={{ width: exploreMode ? 'fit-content' : 'auto', maxWidth: exploreMode ? '100%' : 'none' }}>
          {exploreMode && clickedCell ? (
            <ExploreView
              calculations={calculations}
              headerColumns={headerColumns}
              maxYears={maxYears}
              numZeroColumns={numZeroColumns}
              clickedCell={clickedCell}
              onCellClick={handleCellClick}
              onGoBack={handleGoBack}
            />
          ) : (
            <GridView
              calculations={calculations}
              headerColumns={headerColumns}
              maxYears={maxYears}
              numZeroColumns={numZeroColumns}
              hoveredCell={hoveredCell}
              clickedCell={clickedCell}
              onCellMouseEnter={handleCellMouseEnter}
              onCellMouseLeave={handleCellMouseLeave}
              onCellClick={handleCellClick}
              hasHistoricFunds={hasHistoricFunds}
              baseYear={baseYear}
            />
          )}
        </div>
      </div>

      {exploreMode && tooltipData && (
        <div ref={tooltipSidebarRef}>
          <BreakdownPanel
            tooltipData={tooltipData}
            hasHistoricFunds={hasHistoricFunds}
            baseYear={baseYear}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            exploreMode={true}
            funds={state.funds}
            selectedScenarios={state.selectedScenarios}
          />
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
