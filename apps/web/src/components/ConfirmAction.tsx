import { useState } from 'react';

/** Inline expand-to-confirm for destructive actions — the EndRunControl
 * pattern (no browser prompts). First click swaps the trigger for a short
 * prompt + a `.danger` confirm button + Cancel, all inline. */
export function ConfirmAction({
  label,
  prompt,
  confirmLabel,
  onConfirm,
  triggerClass = 'secondary',
  ariaLabel,
}: {
  label: string;
  prompt: string;
  /** Text on the danger button; defaults to `label`. */
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  triggerClass?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button className={triggerClass} aria-label={ariaLabel ?? label} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="end-run-confirm" role="group" aria-label={prompt}>
      <span className="muted">{prompt}</span>
      <button className="danger" disabled={busy} aria-label={ariaLabel ?? label} onClick={confirm}>
        {confirmLabel ?? label}
      </button>
      <button className="secondary" disabled={busy} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </div>
  );
}
