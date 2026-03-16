import React, { useState, useRef, useEffect } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// "PROGRAMMING", "programming", "programing" → "Programming"
// "web development", "WEB DEV" → "Web Development"
export const normalizeCategory = (raw = '') =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case every word

// Deduplicate a list of strings case-insensitively, keeping first occurrence
export const dedupeCategories = (list = []) => {
  const seen = new Set();
  return list.filter(item => {
    const key = item.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
// Returns a relevance score >= 0; higher = better match; 0 = no match
const score = (candidate, query) => {
  if (!query) return 1;                            // empty query → show all
  const c = candidate.toLowerCase();
  const q = query.trim().toLowerCase();
  if (c === q)             return 100;             // exact
  if (c.startsWith(q))    return  80;             // prefix
  if (c.includes(q))      return  60;             // substring
  // all query characters appear in order (fuzzy)
  let ci = 0;
  for (const ch of q) { ci = c.indexOf(ch, ci); if (ci === -1) return 0; ci++; }
  return 30;
};


/**
 * Props:
 *   value          – controlled string value
 *   onChange(val)  – called with normalized string
 *   onBlur()       – forwarded blur handler
 *   existingFromDB – string[] of categories already in the database
 *   error          – validation error message
 *   touched        – boolean; show error state
 *   isValid        – boolean; show success state
 */
const CategoryComboBox = ({
  value = '',
  onChange,
  onBlur,
  existingFromDB = [],
  error,
  touched,
  isValid,
}) => {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState(value);
  const inputRef              = useRef(null);
  const listRef               = useRef(null);
  const skipBlur              = useRef(false); // prevent blur when clicking list item

  // Keep internal query in sync when parent resets the form
  useEffect(() => { setQuery(value); }, [value]);

  // ── Build the full category pool ──
  const PRESETS = [
    'Programming', 'Web Development', 'Data Science', 'Machine Learning',
    'Artificial Intelligence', 'Mobile Development', 'DevOps', 'Cybersecurity',
    'Design', 'UI/UX Design', 'Graphic Design', 'Photography', 'Video Production',
    'Business', 'Entrepreneurship', 'Marketing', 'Finance', 'Accounting',
    'Project Management', 'Leadership', 'Communication',
    'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology',
    'Language Learning', 'Music', 'Health & Fitness', 'Personal Development',
  ];

  // Merge DB categories + presets, normalize everything, dedupe
  const allCategories = dedupeCategories([
    ...existingFromDB.map(normalizeCategory),
    ...PRESETS,
  ]);

  // ── Scored + filtered list ──
  const suggestions = allCategories
    .map(cat => ({ cat, s: score(cat, query) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ cat }) => cat)
    .slice(0, 8); // max 8 items

  const isNewCategory =
    query.trim().length > 0 &&
    !allCategories.some(c => c.toLowerCase() === query.trim().toLowerCase());

  const select = (cat) => {
    const normalized = normalizeCategory(cat);
    setQuery(normalized);
    onChange(normalized);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);  
    setOpen(true);
  };

  const handleBlur = () => {
    if (skipBlur.current) { skipBlur.current = false; return; }
    // Normalize whatever is typed on blur
    const normalized = normalizeCategory(query);
    setQuery(normalized);
    onChange(normalized);
    setOpen(false);
    onBlur?.();
  };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return; }
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      select(suggestions[0]);
    }
  };

  const borderColor =
    error && touched  ? '#e74c3c' :
    isValid           ? '#27ae60' :
                        '#e0e0e0';

  const bgColor = error && touched ? '#fff8f8' : '#fafafa';

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className={`f-input${error && touched ? ' has-error' : ''}${isValid ? ' is-valid' : ''}`}
          style={{
            padding: '11px 38px 11px 14px',
            borderRadius: '8px',
            border: `1.5px solid ${borderColor}`,
            fontSize: '14px',
            backgroundColor: bgColor,
            color: '#2c3e50',
            transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
          placeholder="e.g. Programming"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          aria-invalid={!!(error && touched)}
        />
        <span
          onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }}
          style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)',
            transition: 'transform 0.2s', cursor: 'pointer',
            color: '#bbb', fontSize: '12px', userSelect: 'none',
          }}
          aria-hidden="true"
        >
          ▼
        </span>
      </div>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          style={dropdownStyle}
        >
          {suggestions.length > 0 && (
            <>
              {existingFromDB.length > 0 && (
                <li style={groupLabel}> From your courses</li>
              )}
              {suggestions
                .filter(s => existingFromDB.map(normalizeCategory).includes(s))
                .map(cat => (
                  <SuggestionItem
                    key={cat} cat={cat} query={query}
                    onSelect={select} onMouseDown={() => { skipBlur.current = true; }}
                    badge="existing"
                  />
                ))}
              {suggestions
                .filter(s => !existingFromDB.map(normalizeCategory).includes(s))
                .length > 0 && (
                <li style={groupLabel}>Suggestions</li>
              )}
              {suggestions
                .filter(s => !existingFromDB.map(normalizeCategory).includes(s))
                .map(cat => (
                  <SuggestionItem
                    key={cat} cat={cat} query={query}
                    onSelect={select} onMouseDown={() => { skipBlur.current = true; }}
                  />
                ))}
            </>
          )}
          {isNewCategory && (
            <li
              style={{ ...suggestionItemStyle, borderTop: suggestions.length ? '1px solid #f0e0c8' : 'none', color: '#e67e22' }}
              onMouseDown={() => { skipBlur.current = true; select(query); }}
            >
              <AddCircleOutlineIcon style={{ fontSize: '14px', flexShrink: 0 }} />
              <span>
                Create <strong style={{ color: '#c0392b' }}>"{normalizeCategory(query)}"</strong>
                <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '6px' }}>new category</span>
              </span>
            </li>
          )}
          {suggestions.length === 0 && !isNewCategory && (
            <li style={{ padding: '10px 14px', fontSize: '13px', color: '#bbb', textAlign: 'center' }}>
              No categories found
            </li>
          )}
        </ul>
      )}

      {error && touched && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
          <ErrorOutlineIcon style={{ fontSize: '13px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      {!(error && touched) && (
        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
          Pick an existing category or type to create a new one — capitalization is auto-corrected.
        </div>
      )}
    </div>
  );
};


const SuggestionItem = ({ cat, query, onSelect, onMouseDown, badge }) => {
  const q = (query || '').trim().toLowerCase();
  const parts = [];
  if (q) {
    let last = 0;
    const lower = cat.toLowerCase();
    let idx = lower.indexOf(q);
    while (idx !== -1) {
      if (idx > last) parts.push({ text: cat.slice(last, idx), highlight: false });
      parts.push({ text: cat.slice(idx, idx + q.length), highlight: true });
      last = idx + q.length;
      idx = lower.indexOf(q, last);
    }
    if (last < cat.length) parts.push({ text: cat.slice(last), highlight: false });
  } else {
    parts.push({ text: cat, highlight: false });
  }

  return (
    <li
      style={suggestionItemStyle}
      onMouseDown={onMouseDown}
      onClick={() => onSelect(cat)}
      role="option"
    >
      <span style={{ flex: 1 }}>
        {parts.map((p, i) =>
          p.highlight
            ? <mark key={i} style={{ backgroundColor: '#fff3cd', color: '#c0392b', padding: '0 1px', borderRadius: '2px', fontWeight: '700' }}>{p.text}</mark>
            : <span key={i}>{p.text}</span>
        )}
      </span>
      {badge === 'existing' && (
        <span style={{ fontSize: '10px', backgroundColor: '#e8fafa', color: '#00b4b4', padding: '2px 7px', borderRadius: '10px', fontWeight: '600', flexShrink: 0 }}>
          existing
        </span>
      )}
    </li>
  );
};


const dropdownStyle = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
  backgroundColor: '#fff', border: '1.5px solid #f0e0c8', borderRadius: '10px',
  zIndex: 999, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', maxHeight: '260px',
  overflowY: 'auto', padding: '4px 0', margin: 0,
  listStyle: 'none', animation: 'slideDown 0.15s ease',
};

const groupLabel = {
  padding: '7px 14px 4px', fontSize: '10px', fontWeight: '700',
  color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em',
  userSelect: 'none',
};

const suggestionItemStyle = {
  padding: '9px 14px', fontSize: '13px', color: '#2c3e50',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
  transition: 'background 0.1s',
};

export default CategoryComboBox;