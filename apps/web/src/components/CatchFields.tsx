import { useState } from 'react';

/** Real Pokémon levels only — callers use this instead of `Number(v) || 1`,
 * which silently turned typos into Lv 1 and let "150" through (audit P2). */
export function clampLevel(v: string): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 100);
}

const isInvalidLevel = (v: string) => {
  if (v.trim() === '') return false; // empty = "default to 1", allowed silently
  const n = Number(v);
  return !Number.isInteger(n) || n < 1 || n > 100;
};

/** The nickname / level / shiny field cluster shared by every "a Pokémon
 * joins the run" form (route encounters, special claims). Controlled — the
 * parent owns the state; pass the wrapper class the parent's CSS expects.
 * Bad level input is flagged on blur (role=alert) instead of being silently
 * coerced at submit time. */
export function CatchFields({
  species,
  nickname,
  onNickname,
  level,
  onLevel,
  shiny,
  onShiny,
  className,
}: {
  species: string;
  nickname: string;
  onNickname: (v: string) => void;
  level: string;
  onLevel: (v: string) => void;
  shiny: boolean;
  onShiny: (v: boolean) => void;
  className: string;
}) {
  const [touched, setTouched] = useState(false);
  const invalid = touched && isInvalidLevel(level);
  return (
    <div className={className}>
      <label>
        Nickname
        <input type="text" value={nickname} onChange={(e) => onNickname(e.target.value)} placeholder={species} />
      </label>
      <label>
        Level
        <input
          type="text"
          inputMode="numeric"
          value={level}
          aria-invalid={invalid || undefined}
          onChange={(e) => onLevel(e.target.value)}
          onBlur={() => setTouched(true)}
        />
        {invalid && (
          <span className="field-error" role="alert">
            Levels are 1–100 — this will be saved as Lv {clampLevel(level)}.
          </span>
        )}
      </label>
      <label className="shiny-toggle">
        <input type="checkbox" checked={shiny} onChange={(e) => onShiny(e.target.checked)} />
        Shiny ✦
      </label>
    </div>
  );
}
