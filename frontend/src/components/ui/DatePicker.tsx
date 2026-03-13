import React, { useState, useEffect } from 'react';
import Input from './Input';
import { Calendar } from 'lucide-react';

interface DatePickerProps {
  id: string;
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  min?: string; // YYYY-MM-DD
  fullWidth?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  min,
  fullWidth
}) => {
  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const toDisplay = (val: string) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    if (!y || !m || !d) return val;
    return `${d}/${m}/${y}`;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for external state
  const toData = (val: string) => {
    const parts = val.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        return `${y}-${m}-${d}`;
      }
    }
    return '';
  };

  const [displayValue, setDisplayValue] = useState(toDisplay(value));
  const nativeRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(toDisplay(value));
  }, [value]);

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      onChange(val);
    }
  };

  const triggerNativePicker = () => {
    const el = nativeRef.current as any;
    if (el) {
      if ('showPicker' in el) {
        try {
          el.showPicker();
        } catch {
          el.click();
        }
      } else {
        el.click();
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Auto-validation: Day 01-31, Month 01-12
    if (val.length >= 2) {
      const day = parseInt(val.substring(0, 2));
      if (day > 31) val = '31' + val.substring(2);
      if (day === 0 && val.length === 2) val = '01';
    }
    if (val.length >= 4) {
      const month = parseInt(val.substring(2, 4));
      if (month > 12) val = val.substring(0, 2) + '12' + val.substring(4);
      if (month === 0 && val.length === 4) val = val.substring(0, 2) + '01';
    }
    
    // Auto-masking: DD/MM/YYYY
    let masked = '';
    if (val.length > 0) {
      masked += val.substring(0, 2);
      if (val.length >= 2) {
        masked += '/';
        masked += val.substring(2, 4);
        if (val.length >= 4) {
          masked += '/';
          masked += val.substring(4, 8);
        }
      }
    }
    
    setDisplayValue(masked);

    // If fully entered, propagate change
    if (masked.length === 10) {
      const dataVal = toData(masked);
      if (dataVal) {
        onChange(dataVal);
      }
    }
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <Input
        id={id}
        label={label}
        placeholder="DD/MM/YYYY"
        value={displayValue}
        onChange={handleTextChange}
        error={error}
        disabled={disabled}
        fullWidth={fullWidth}
        icon={
          <button 
            type="button" 
            onClick={triggerNativePicker}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors text-primary-500"
            title="Open Calendar"
          >
            <Calendar size={18} />
          </button>
        }
        iconPosition="right"
        maxLength={10}
      />
      {/* Hidden native picker to leverage browser's hassle-free UI */}
      <input
        ref={nativeRef}
        type="date"
        value={value} // YYYY-MM-DD
        min={min}
        onChange={handleNativeChange}
        disabled={disabled}
        className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};

export default DatePicker;
