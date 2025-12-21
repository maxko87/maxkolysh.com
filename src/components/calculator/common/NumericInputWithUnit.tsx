interface NumericInputWithUnitProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder: string;
  unit: string; // '$M', '%', 'Yrs', 'x'
  min?: number;
  step?: number | string;
}

export default function NumericInputWithUnit({
  value,
  onChange,
  placeholder,
  unit,
  min = 0,
  step,
}: NumericInputWithUnitProps) {
  // Convert NaN to empty string for display
  const displayValue = typeof value === 'number' && isNaN(value) ? '' : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange('');
    } else {
      const numValue = parseFloat(inputValue);
      onChange(isNaN(numValue) ? '' : numValue);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        step={step}
        style={{ paddingRight: '35px' }}
      />
      <span
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#718096',
          fontSize: '0.9em',
          pointerEvents: 'none',
        }}
      >
        {unit}
      </span>
    </div>
  );
}
