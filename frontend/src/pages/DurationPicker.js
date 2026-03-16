import React, { useState, useEffect } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const UNITS = [
  { value: 'days',       label: 'Days'   },
  { value: 'weeks',      label: 'Weeks'  },
  { value: 'months',     label: 'Months' },
  { value: 'self-paced', label: 'Self-Paced' },
];

// Parse a stored string like "8 weeks" or "Self-paced" back into parts
const parseValue = (val = '') => {
  const lower = val.trim().toLowerCase();
  if (!lower || lower === 'self-paced') return { num: '', unit: 'self-paced' };
  const match = lower.match(/^(\d+)\s*(days?|weeks?|months?)$/);
  if (match) {
    const rawUnit = match[2].replace(/s$/, '') + 's'; // normalise to plural
    const unit = ['days','weeks','months'].includes(rawUnit) ? rawUnit : 'weeks';
    return { num: match[1], unit };
  }
  return { num: '', unit: 'weeks' };
};

// Build the output string from parts
const buildValue = (num, unit) => {
  if (unit === 'self-paced') return 'Self-Paced';
  if (!num || num === '0') return '';
  const n = parseInt(num, 10);
  const label = UNITS.find(u => u.value === unit)?.label || 'Weeks';
  return `${n} ${n === 1 ? label.replace(/s$/, '') : label}`;
};

/**
 * Props:
 *   value          – controlled string e.g. "8 weeks"
 *   onChange(str)  – called with the formatted string
 *   onBlur()
 *   error          – validation error string
 *   touched        – boolean
 */
const DurationPicker = ({ value = '', onChange, onBlur, error, touched }) => {
  const [num,  setNum]  = useState('');
  const [unit, setUnit] = useState('weeks');

  // Sync from parent value on mount / external reset
  useEffect(() => {
    const parsed = parseValue(value);
    setNum(parsed.num);
    setUnit(parsed.unit);
  }, [value]);

  const isSelfPaced = unit === 'self-paced';

  const handleNumChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');            // digits only
    const clamped = raw === '' ? '' : String(Math.min(999, Math.max(1, parseInt(raw, 10))));
    setNum(clamped);
    onChange(buildValue(clamped, unit));
  };

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    onChange(buildValue(newUnit === 'self-paced' ? '' : num, newUnit));
  };

  const borderColor = error && touched ? '#e74c3c' : '#e0e0e0';
  const bgColor     = error && touched ? '#fff8f8' : '#fafafa';

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>

        {/* Number input — hidden when Self-Paced */}
        {!isSelfPaced && (
          <input
            className="f-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 8"
            value={num}
            onChange={handleNumChange}
            onBlur={onBlur}
            style={{
              width: '80px',
              flexShrink: 0,
              padding: '11px 12px',
              borderRadius: '8px',
              border: `1.5px solid ${borderColor}`,
              fontSize: '14px',
              backgroundColor: bgColor,
              color: '#2c3e50',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              textAlign: 'center',
            }}
            aria-label="Duration number"
          />
        )}

        {/* Unit selector */}
        <select
          className="f-input"
          value={unit}
          onChange={handleUnitChange}
          onBlur={onBlur}
          style={{
            flex: 1,
            padding: '11px 12px',
            borderRadius: '8px',
            border: `1.5px solid ${borderColor}`,
            fontSize: '14px',
            backgroundColor: bgColor,
            color: '#2c3e50',
            cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
          aria-label="Duration unit"
        >
          {UNITS.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Preview pill */}
      {buildValue(num, unit) && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          marginTop: '6px', backgroundColor: '#fff3e0',
          border: '1px solid #f0d9b5', borderRadius: '20px',
          padding: '3px 12px', fontSize: '12px', color: '#e67e22', fontWeight: '600',
        }}>
          ⏱ {buildValue(num, unit)}
        </div>
      )}

      {/* Error */}
      {error && touched && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
          <ErrorOutlineIcon style={{ fontSize: '13px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Hint */}
      {!(error && touched) && (
        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
          Enter a number then select Days, Weeks, or Months — or choose Self-Paced.
        </div>
      )}
    </div>
  );
};

export default DurationPicker;