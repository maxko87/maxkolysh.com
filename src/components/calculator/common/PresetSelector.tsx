import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCalculator } from '../../../hooks/useCalculator';
import { PRESET_FUNDS, createFundDataFromPreset } from '../../../data/presetFunds';

function PresetSelector() {
  const { state, dispatch } = useCalculator();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen]);

  const handleSelectPreset = (presetIndex: number) => {
    const preset = PRESET_FUNDS[presetIndex];

    // Create fund with defaults + unique preset data
    const presetFund = {
      id: state.funds.length,
      name: preset.fundName,
      ...createFundDataFromPreset(preset),
    };

    dispatch({ type: 'ADD_FUND', payload: presetFund });
    setIsOpen(false);
  };

  const dropdownContent = isOpen && createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10001
        }}
        onClick={() => setIsOpen(false)}
      />
      <div
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          maxHeight: '400px',
          overflowY: 'auto',
          width: '380px',
          zIndex: 10002
        }}
      >
            <div style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: 600,
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--color-background)',
              zIndex: 1
            }}>
              Select a Historic Fund
            </div>
            {PRESET_FUNDS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleSelectPreset(index)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  borderBottom: index < PRESET_FUNDS.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                  {preset.displayName}
                </div>
                <div style={{
                  fontSize: '0.85em',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  flexWrap: 'wrap'
                }}>
                  <span>{preset.strategy}</span>
                  <span>•</span>
                  <span>${preset.size}M fund</span>
                  <span>•</span>
                  <span>{preset.source}</span>
                </div>
              </button>
            ))}
      </div>
    </>,
    document.body
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{ marginLeft: 'var(--spacing-sm)' }}
      >
        Select Historic Fund ▾
      </button>
      {dropdownContent}
    </div>
  );
}

export default PresetSelector;
