import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCalculator } from '../../../hooks/useCalculator';
import { PRESET_FUNDS, createFundDataFromPreset } from '../../../data/presetFunds';

function PresetSelector() {
  const { state, dispatch } = useCalculator();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Fuzzy search: checks if all characters in query appear in order in the text
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < textLower.length && queryIndex < queryLower.length) {
      if (textLower[textIndex] === queryLower[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === queryLower.length;
  };

  const filteredFunds = PRESET_FUNDS.filter((preset) => {
    const searchText = `${preset.fundName} ${preset.displayName} ${preset.strategy} ${preset.source} ${preset.vintage}`;
    return fuzzyMatch(searchText, searchQuery);
  });

  const handleSelectPreset = (presetIndex: number) => {
    const preset = PRESET_FUNDS[presetIndex];

    // Create fund with defaults + unique preset data + vintage year
    const presetFund = {
      id: 0,
      name: preset.fundName,
      ...createFundDataFromPreset(preset),
      vintageYear: preset.vintage, // Add vintage year for historic funds
    };

    // Replace entire state with just this new fund
    dispatch({
      type: 'SET_STATE',
      payload: {
        funds: [presetFund],
        selectedScenarios: { 0: presetFund.scenarios[0].id }
      }
    });

    setIsOpen(false);
  };

  const dropdownContent = isOpen && position.top > 0 && createPortal(
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
          maxHeight: '600px',
          overflowY: 'auto',
          width: '380px',
          zIndex: 10002
        }}
      >
            <div style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--color-background)',
              zIndex: 1,
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div style={{
                padding: 'var(--spacing-md) var(--spacing-sm)'
              }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search funds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            {filteredFunds.length === 0 ? (
              <div style={{
                padding: 'var(--spacing-lg)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                No funds found matching "{searchQuery}"
              </div>
            ) : (
              filteredFunds.map((preset, index) => {
                const originalIndex = PRESET_FUNDS.indexOf(preset);
                return (
                  <button
                    key={originalIndex}
                    onClick={() => handleSelectPreset(originalIndex)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      borderBottom: index < filteredFunds.length - 1 ? '1px solid var(--color-border-light)' : 'none',
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
                );
              })
            )}
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
