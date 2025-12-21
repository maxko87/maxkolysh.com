import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCalculator } from '../../../hooks/useCalculator';
import { FUND_TYPE_PRESETS, createFundFromType, type FundType } from '../../../types/calculator';

function FundTypeSelector() {
  const { state, dispatch } = useCalculator();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && !isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }

    // Handle escape key to close dropdown
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isMobile]);

  const handleSelectFundType = (fundType: FundType) => {
    // Find the highest existing fund number to avoid duplicates
    const existingNumbers = state.funds.map(f => {
      const match = f.name.match(/^Fund (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const fundNumber = maxNumber + 1;
    const fundName = `Fund ${fundNumber}: ${FUND_TYPE_PRESETS[fundType].label}`;

    const newFund = createFundFromType(
      state.funds.length,
      fundName,
      fundType
    );

    dispatch({ type: 'ADD_FUND', payload: newFund });
    setIsOpen(false);
  };

  const fundTypes: FundType[] = ['early-stage-vc', 'growth-vc', 'buyout', 'secondaries'];

  const dropdownContent = isOpen && (isMobile || position.top > 0) && createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isMobile ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
          zIndex: 10000 // Dropdown backdrop
        }}
        onClick={() => setIsOpen(false)}
      />
      <div
        style={{
          position: 'fixed',
          ...(isMobile ? {
            bottom: 0,
            left: 0,
            right: 0,
            top: '30%',
            borderRadius: '16px 16px 0 0',
            animation: 'slideUp 0.3s ease-out'
          } : {
            top: position.top,
            left: position.left,
            width: '340px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }),
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          overflowY: 'auto',
          zIndex: 11000 // Dropdown content
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '0.85em',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          Select Fund Type
        </div>
        {fundTypes.map((fundType) => {
          const preset = FUND_TYPE_PRESETS[fundType];
          return (
            <button
              key={fundType}
              onClick={() => handleSelectFundType(fundType)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 'var(--spacing-md)',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border-light)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.95em' }}>
                {preset.label}
              </div>
              <div style={{
                fontSize: '0.8em',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4
              }}>
                {preset.description}
              </div>
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        + Preset
      </button>
      {dropdownContent}
    </>
  );
}

export default FundTypeSelector;
