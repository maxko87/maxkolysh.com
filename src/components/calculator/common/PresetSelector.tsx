import { useState, useRef, useEffect, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { useCalculator } from '../../../hooks/useCalculator';
import { PRESET_FUNDS, createFundDataFromPreset, generateDisplayName } from '../../../data/presetFunds';
import { formatCurrency } from '../../../utils/formatCurrency';

const PresetSelector = forwardRef<HTMLButtonElement>((_props, ref) => {
  const { dispatch } = useCalculator();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'notable' | 'alphabetical' | 'size' | 'multiple'>('notable');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const internalButtonRef = useRef<HTMLButtonElement>(null);
  const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || internalButtonRef;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number; maxHeight?: number }>({ left: 0 });

  const [formData, setFormData] = useState({
    fundName: '',
    vintage: new Date().getFullYear(),
    source: '',
    size: '',
    grossReturnMultiple: '',
    irr: ''
  });

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculatePosition = () => {
    if (!isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownMaxHeight = 600;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const showAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;

      if (showAbove) {
        setPosition({
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          maxHeight: Math.max(spaceAbove - 8, 200)
        });
      } else {
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
          maxHeight: Math.max(spaceBelow - 8, 200)
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), isMobile ? 100 : 0);
    } else {
      setSearchQuery('');
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

  // Search: checks if query words match text or start of words in text
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true;

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // First try simple substring match
    if (textLower.includes(queryLower)) {
      return true;
    }

    // Then try matching each query word against word boundaries in text
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    const textWords = textLower.split(/\s+/);

    // All query words must match at least one text word (at start)
    return queryWords.every(queryWord =>
      textWords.some(textWord => textWord.startsWith(queryWord))
    );
  };

  const filteredFunds = PRESET_FUNDS.filter((preset) => {
    const searchText = `${preset.fundName} ${preset.source} ${preset.vintage}`;
    const matchesSearch = fuzzyMatch(searchText, searchQuery);

    // If there's a search query, show all matching funds regardless of filter
    if (searchQuery) {
      return matchesSearch;
    }

    // If no search and "Notable" filter is selected, only show starred funds
    if (sortBy === 'notable') {
      return preset.isNotable;
    }

    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.fundName.localeCompare(b.fundName);
      case 'size':
        return b.size - a.size; // Descending order (largest first)
      case 'multiple':
        return b.grossReturnMultiple - a.grossReturnMultiple; // Descending order (highest first)
      case 'notable':
      default:
        return 0; // Keep original order
    }
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

  const handleOpenModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate display name
    const displayName = generateDisplayName(
      formData.fundName,
      formData.vintage,
      parseFloat(formData.grossReturnMultiple)
    );

    // Build email body
    const emailBody = `
Fund Submission:

Display Name: ${displayName}
Fund Name: ${formData.fundName}
Vintage Year: ${formData.vintage}
Source: ${formData.source}
Fund Size: $${formData.size}M
Gross Return Multiple (TVPI): ${formData.grossReturnMultiple}x
IRR: ${formData.irr ? formData.irr + '%' : 'N/A'}
    `.trim();

    // Create mailto link
    const mailtoLink = `mailto:maxkolysh@gmail.com?subject=Historic Fund Submission&body=${encodeURIComponent(emailBody)}`;

    // Open email client
    window.location.href = mailtoLink;

    // Reset form and close modal
    setFormData({
      fundName: '',
      vintage: new Date().getFullYear(),
      source: '',
      size: '',
      grossReturnMultiple: '',
      irr: ''
    });
    setIsModalOpen(false);
  };

  const dropdownContent = isOpen && (isMobile || position.top !== undefined || position.bottom !== undefined) && createPortal(
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
            top: '20%',
            borderRadius: '16px 16px 0 0',
            animation: 'slideUp 0.3s ease-out'
          } : {
            ...(position.top !== undefined ? { top: position.top } : {}),
            ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
            left: position.left,
            width: '380px',
            maxHeight: position.maxHeight ? `${position.maxHeight}px` : '600px',
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
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--color-background)',
              zIndex: 1,
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div style={{
                padding: 'var(--spacing-md) var(--spacing-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)'
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
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', marginRight: '4px' }}>Sort:</span>
                  {(['notable', 'alphabetical', 'size', 'multiple'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSortBy(option);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8em',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: sortBy === option ? '#667eea' : 'transparent',
                        color: sortBy === option ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {option === 'notable' ? 'Notable' : option === 'alphabetical' ? 'A-Z' : option === 'size' ? 'Size' : 'MOIC'}
                    </button>
                  ))}
                </div>
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
              <>
                {filteredFunds.map((preset) => {
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
                      <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                        {generateDisplayName(preset.fundName, preset.vintage, preset.grossReturnMultiple, preset.isNotable)}
                      </div>
                      <div style={{
                        fontSize: '0.85em',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        <span>{formatCurrency(preset.size)}</span>
                        <span>•</span>
                        {preset.sourceUrl ? (
                          <a
                            href={preset.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              color: '#0066cc',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                          >
                            {preset.source}
                          </a>
                        ) : (
                          <span>{preset.source}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={handleOpenModal}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: 'var(--spacing-md)',
                    border: 'none',
                    backgroundColor: 'var(--color-background-secondary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: 'var(--color-primary)',
                    position: 'sticky',
                    bottom: 0,
                    borderTop: '2px solid var(--color-border)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
                  }}
                >
                  Submit a historic fund...
                </button>
              </>
            )}
      </div>
    </>,
    document.body
  );

  const modalContent = isModalOpen && createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50000 // Modal - same as HowToUseModal
        }}
        onClick={() => setIsModalOpen(false)}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)', color: 'var(--color-text)' }}>
            Submit a Historic Fund
          </h2>
          <form onSubmit={handleSubmitForm}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500, color: 'var(--color-text)' }}>
                    Fund Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fundName}
                    onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                    placeholder="Sequoia Capital"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.95em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500, color: 'var(--color-text)' }}>
                    Vintage Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.vintage}
                    onChange={(e) => setFormData({ ...formData, vintage: parseInt(e.target.value) })}
                    placeholder="2023"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.95em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500, color: 'var(--color-text)' }}>
                  Fund Size (millions) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.size}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (value === '' || !isNaN(Number(value))) {
                      setFormData({ ...formData, size: value });
                    }
                  }}
                  placeholder="250"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500, color: 'var(--color-text)' }}>
                    Gross MOIC (TVPI) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.grossReturnMultiple}
                    onChange={(e) => setFormData({ ...formData, grossReturnMultiple: e.target.value })}
                    placeholder="1.16"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.95em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500, color: 'var(--color-text)' }}>
                    IRR (%)
                  </label>
                  <input
                    type="number"
                    value={formData.irr}
                    onChange={(e) => setFormData({ ...formData, irr: e.target.value })}
                    placeholder="15.5"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.95em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500, color: 'var(--color-text)' }}>
                  Source *
                </label>
                <input
                  type="text"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="https://example.com/fund-data"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        className="btn btn-secondary"
        onClick={() => {
          if (!isOpen) {
            calculatePosition();
          }
          setIsOpen(!isOpen);
        }}
      >
        + Historic
      </button>
      {dropdownContent}
      {modalContent}
    </>
  );
});

PresetSelector.displayName = 'PresetSelector';

export default PresetSelector;
