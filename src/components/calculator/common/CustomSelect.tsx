import { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { id: number; label: string }[];
  label?: string;
}

export default function CustomSelect({ value, onChange, options, label }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {label && <label style={{ margin: 0, fontSize: '0.95em', whiteSpace: 'nowrap' }}>{label}:</label>}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '8px 12px',
            paddingRight: '32px',
            borderRadius: '6px',
            border: '1.5px solid var(--border-color)',
            fontSize: '0.95em',
            backgroundColor: 'var(--bg-primary)',
            cursor: 'pointer',
            minWidth: '80px',
            textAlign: 'left',
            position: 'relative',
            fontFamily: 'inherit',
            color: 'inherit',
            appearance: 'none',
            WebkitAppearance: 'none'
          }}
        >
          {selectedOption?.label}
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            fontSize: '0.7em',
            color: '#666'
          }}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              left: 0,
              minWidth: '100%',
              backgroundColor: 'var(--bg-primary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 11000, // Dropdown content - above tooltips/toast, below modals
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {options.map(option => (
              <div
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  backgroundColor: option.id === value ? '#f0f4ff' : 'transparent',
                  transition: 'background-color 0.1s'
                }}
                onMouseEnter={(e) => {
                  if (option.id !== value) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (option.id !== value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
