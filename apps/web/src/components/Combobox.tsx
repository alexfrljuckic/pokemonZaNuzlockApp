import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Lightweight autocomplete: a text input with a filtered suggestion list.
 * The list is portaled to <body> with fixed positioning so it can never be
 * clipped or painted behind following sections (native <datalist> and plain
 * absolute lists both broke here). Free text is always allowed — options are
 * suggestions, not a constraint. */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  max = 60,
  badge,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  max?: number;
  badge?: (option: string) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = value.trim().toLowerCase();
  const matches = (q ? options.filter((o) => o.includes(q)) : options).slice(0, max);

  const reposition = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
  };

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => reposition();
    const onDoc = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest?.('.combobox-list')
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="combobox">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true);
          else if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, matches.length - 1));
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' && open && matches[active]) {
            e.preventDefault();
            choose(matches[active]);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open &&
        matches.length > 0 &&
        rect &&
        createPortal(
          <ul
            className="combobox-list"
            role="listbox"
            style={{ position: 'fixed', top: rect.bottom + 2, left: rect.left, width: rect.width }}
          >
            {matches.map((o, i) => (
              <li
                key={o}
                role="option"
                aria-selected={i === active}
                className={`combobox-option${i === active ? ' active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span>{o}</span>
                {badge?.(o) && <span className={`combobox-badge badge-${badge(o)}`}>{badge(o)}</span>}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
