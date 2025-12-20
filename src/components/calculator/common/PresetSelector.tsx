import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCalculator } from '../../../hooks/useCalculator';
import { PRESET_FUNDS, createFundDataFromPreset } from '../../../data/presetFunds';
import { formatCurrency } from '../../../utils/formatCurrency';

function PresetSelector() {
  const { dispatch } = useCalculator();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const [formData, setFormData] = useState({
    displayName: '',
    fundName: '',
    vintage: new Date().getFullYear(),
    strategy: '',
    source: '',
    sourceUrl: '',
    size: '',
    grossReturnMultiple: '',
    irr: ''
  });

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

  const handleOpenModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Build email body
    const emailBody = `
Fund Submission:

Display Name: ${formData.displayName}
Fund Name: ${formData.fundName}
Vintage Year: ${formData.vintage}
Strategy: ${formData.strategy}
Source: ${formData.source}
Source URL: ${formData.sourceUrl || 'N/A'}
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
      displayName: '',
      fundName: '',
      vintage: new Date().getFullYear(),
      strategy: '',
      source: '',
      sourceUrl: '',
      size: '',
      grossReturnMultiple: '',
      irr: ''
    });
    setIsModalOpen(false);
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
                        {preset.displayName}
                      </div>
                      <div style={{
                        fontSize: '0.85em',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        gap: 'var(--spacing-sm)',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        <span>{preset.strategy}</span>
                        <span>•</span>
                        <span>{formatCurrency(preset.size)} fund</span>
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
          zIndex: 10003
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
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-lg)' }}>
            Submit a Historic Fund
          </h2>
          <form onSubmit={handleSubmitForm}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Apollo Investment Fund X (2023) - 1.16x"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Fund Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fundName}
                  onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                  placeholder="e.g., Apollo Investment Fund X, L.P."
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                    Vintage Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.vintage}
                    onChange={(e) => setFormData({ ...formData, vintage: parseInt(e.target.value) })}
                    placeholder="e.g., 2023"
                    min="1990"
                    max={new Date().getFullYear()}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                    Strategy *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.strategy}
                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                    placeholder="e.g., Private Equity"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Source *
                </label>
                <input
                  type="text"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., CalPERS"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  Source URL
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
                <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                  Optional. Only include public information. For non-public/private data, leave blank.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                    Fund Size (millions) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g., 25000"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                    Gross Return Multiple (TVPI) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.grossReturnMultiple}
                    onChange={(e) => setFormData({ ...formData, grossReturnMultiple: e.target.value })}
                    placeholder="e.g., 1.16"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1em',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  IRR (%)
                </label>
                <input
                  type="number"
                  value={formData.irr}
                  onChange={(e) => setFormData({ ...formData, irr: e.target.value })}
                  placeholder="e.g., 15.5"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1em',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
                <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                  Optional reference field
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Submit via Email
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
      {modalContent}
    </div>
  );
}

export default PresetSelector;
