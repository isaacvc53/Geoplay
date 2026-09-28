import { useRef, useState } from 'react';
import { normalizeName } from './profileLogic';

// Buscador de país: input de texto que filtra una lista al escribir (en vez
// de un <select> nativo). onSelect recibe el id ('' = todos).
export default function CountryPicker({ options, onSelect, allLabel = 'All countries', ariaLabel }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);

  const q = normalizeName(text);
  const allMatches = !q || normalizeName(allLabel).includes(q);
  const filtered = !q ? options : options.filter((o) => normalizeName(o.label).includes(q));
  const rows = [];
  if (allMatches) rows.push({ id: '', label: allLabel });
  rows.push(...filtered);

  function openList(value) {
    setText(value);
    setOpen(true);
    setActive(-1);
  }

  function select(row) {
    setText(row.id ? row.label : '');
    setOpen(false);
    onSelect(row.id);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = active >= 0 ? rows[active] : rows[0];
      if (row) select(row);
    } else if (e.key === 'Escape') {
      setOpen(false);
      e.currentTarget.blur();
    }
  }

  return (
    <div className="country-picker">
      <input
        type="text"
        className="country-picker-input"
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder={allLabel}
        value={text}
        onFocus={() => openList(text)}
        onChange={(e) => openList(e.target.value)}
        // Retraso para que el click en una opción registre antes de ocultar la lista.
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <div className="country-picker-list">
          {rows.map((row, i) => (
            <div
              key={row.id || 'all'}
              className={'country-picker-option' + (i === active ? ' active' : '')}
              onMouseDown={(e) => { e.preventDefault(); clearTimeout(blurTimer.current); select(row); }}
            >
              {row.label}
            </div>
          ))}
          {!filtered.length && !allMatches && <div className="country-picker-empty">No matches</div>}
        </div>
      )}
    </div>
  );
}
