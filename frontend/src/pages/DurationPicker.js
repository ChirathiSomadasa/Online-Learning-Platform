import React, { useState, useEffect } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const UNITS = [
  { value: 'days',       label: 'Days'       },
  { value: 'weeks',      label: 'Weeks'      },
  { value: 'months',     label: 'Months'     },
  { value: 'self-paced', label: 'Self-Paced' },
];

const parseValue = (val = '') => {
  const lower = val.trim().toLowerCase();
  if (!lower || lower === 'self-paced') return { num: '', unit: 'self-paced' };
  const match = lower.match(/^(\d+)\s*(days?|weeks?|months?)$/);
  if (match) {
    const rawUnit = match[2].replace(/s$/, '') + 's';
    const unit = ['days', 'weeks', 'months'].includes(rawUnit) ? rawUnit : 'weeks';
    return { num: match[1], unit };
  }
  return { num: '', unit: 'weeks' };
};

const buildValue = (num, unit) => {
  if (unit === 'self-paced') return 'Self-Paced';
  // Default to 1 if no number provided — prevents "0 Weeks" / empty string
  const n = parseInt(num, 10);
  const safeN = (!num || isNaN(n) || n < 1) ? 1 : n;
  const label = UNITS.find(u => u.value === unit)?.label || 'Weeks';
  return `${safeN} ${safeN === 1 ? label.replace(/s$/, '') : label}`;
};

const DurationPicker = ({ value = '', onChange, onBlur, error, touched }) => {
  const [num,  setNum]  = useState('1');   // ← default to 1
  const [unit, setUnit] = useState('weeks');

  useEffect(() => {
    const parsed = parseValue(value);
    // If a unit (not self-paced) was stored with no number, fall back to 1
    setNum(parsed.unit !== 'self-paced' && !parsed.num ? '1' : parsed.num);
    setUnit(parsed.unit);
  }, [value]);

  const isSelfPaced = unit === 'self-paced';
  const borderColor = error && touched ? '#e74c3c' : '#e0e0e0';
  const bgColor     = error && touched ? '#fff8f8' : '#fafafa';

  const handleNumChange = (e) => {
    const raw     = e.target.value.replace(/\D/g, '');
    // Allow empty while typing — but clamp on blur (handled in onBlur below)
    const clamped = raw === '' ? '' : String(Math.min(999, Math.max(1, parseInt(raw, 10))));
    setNum(clamped);
    onChange(buildValue(clamped, unit));
  };

  const handleNumBlur = () => {
    // If user clears the number and leaves, snap back to 1
    if (!num || num === '0') {
      setNum('1');
      onChange(buildValue('1', unit));
    }
    onBlur?.();
  };

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    if (newUnit === 'self-paced') {
      // Self-Paced doesn't need a number — clear it
      setNum('');
      onChange('Self-Paced');
    } else {
      // Switching TO a timed unit: keep existing number or default to 1
      const safeNum = num && num !== '0' ? num : '1';
      setNum(safeNum);
      onChange(buildValue(safeNum, newUnit));
    }
  };

  const inputBase = {
    padding: '11px 12px', borderRadius: '8px',
    border: `1.5px solid ${borderColor}`,
    fontSize: '14px', backgroundColor: bgColor, color: '#2c3e50',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

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
            placeholder="1"
            value={num}
            onChange={handleNumChange}
            onBlur={handleNumBlur}
            style={{ ...inputBase, width: '80px', flexShrink: 0, textAlign: 'center' }}
            aria-label="Duration number"
          />
        )}

        {/* Unit selector */}
        <select
          className="f-input"
          value={unit}
          onChange={handleUnitChange}
          onBlur={onBlur}
          style={{ ...inputBase, flex: 1, cursor: 'pointer' }}
          aria-label="Duration unit"
        >
          {UNITS.map(u => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Error — only shown when a rule is broken and field has been touched */}
      {error && touched && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
          <ErrorOutlineIcon style={{ fontSize: '13px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DurationPicker;