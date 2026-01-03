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
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      {label && <span style={{ margin: 0, fontSize: '0.9em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{label}</span>}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '6px 10px',
            paddingRight: '26px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '0.9em',
            fontWeight: 500,
            backgroundColor: 'white',
            cursor: 'pointer',
            minWidth: '60px',
            textAlign: 'left',
            position: 'relative',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            appearance: 'none',
            WebkitAppearance: 'none',
            transition: 'border-color 0.15s, background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {selectedOption?.label}
          <svg
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
              pointerEvents: 'none',
              transition: 'transform 0.15s ease'
            }}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
