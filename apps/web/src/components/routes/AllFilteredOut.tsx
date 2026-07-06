import type { Area } from '@nuzlocke/engine';

/** Whether this area has any wild encounters documented at all for the active
 * version — independent of the ruleset (dupes/first-encounter can legally
 * filter every slot out while the area still "has" encounters on paper). */
export function hasDocumentedEncounters(area: Area, version: string): boolean {
  return area.encounters.some((slot) => !slot.conditions?.version || slot.conditions.version.includes(version));
}

/** Shown when every documented encounter here was filtered out by the active
 * ruleset (e.g. dupes clause: you already own every species that lives here).
 * Without this the area could never be resolved — the encounter form has
 * nothing to offer, but the route still needs a way to be marked done. */
export function AllFilteredOut({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="route-all-filtered">
      <p className="muted">
        Every species that lives here is already part of your run, so the dupes clause (no duplicate
        catches) leaves nothing new to catch.
      </p>
      <button className="secondary" onClick={onSkip}>
        Skip route
      </button>
    </div>
  );
}
