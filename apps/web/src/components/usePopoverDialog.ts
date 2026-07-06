import { useEffect, type RefObject } from 'react';

/** Dialog-popover behavior shared by SharePopover and the sign-in popover:
 * close on outside click / Escape, move focus into the panel on open, keep
 * Tab cycling inside while open, and hand focus back to the trigger on close
 * (the audit-P2 focus contract). The caller owns the open state and renders
 * the panel with role="dialog" aria-modal="true". */
export function usePopoverDialog(
  open: boolean,
  onClose: () => void,
  refs: {
    root: RefObject<HTMLElement>;
    panel: RefObject<HTMLElement>;
    trigger: RefObject<HTMLElement>;
  },
) {
  useEffect(() => {
    if (!open) return;
    const focusables = () =>
      refs.panel.current
        ? [...refs.panel.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')]
        : [];
    const raf = requestAnimationFrame(() => focusables()[0]?.focus());
    function onDocClick(e: MouseEvent) {
      if (refs.root.current && !refs.root.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    const trigger = refs.trigger.current;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
