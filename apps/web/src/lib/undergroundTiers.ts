/** BDSP Grand Underground hideaway progression tiers.
 *
 * A hideaway's species pool grows in six fixed steps, uniform across every
 * hideaway (Bulbapedia / heystacks / altissimo1 data-mine). We can't gate on
 * these — the app doesn't track TM / National-Dex acquisition — so they're
 * shown as honor-style labels on each encounter slot, letting the player judge
 * what's actually reachable at their point in the run. See
 * docs/BDSP-GRAND-UNDERGROUND-RESEARCH.md §2. */

/** Short badge text per tier. Tier 1 (base) has no badge — it's always here. */
const TIER_BADGE: Record<number, string> = {
  2: 'Strength',
  3: 'Defog',
  4: 'Icicle Badge',
  5: 'Waterfall',
  6: "Nat'l Dex",
};

/** Longer tooltip per tier — what you need before this species appears. */
const TIER_HINT: Record<number, string> = {
  2: 'Appears after obtaining TM96 Strength',
  3: 'Appears after obtaining TM97 Defog',
  4: 'Appears after the Icicle Badge (7th Gym)',
  5: 'Appears after obtaining TM99 Waterfall',
  6: 'Appears after obtaining the National Pokédex (postgame)',
};

/** Badge label for a slot's tier, or null when it's base/tier-1 (no badge). */
export function tierBadge(tier: number | undefined): string | null {
  return tier != null && tier > 1 ? (TIER_BADGE[tier] ?? null) : null;
}

/** Tooltip/aria text for a slot's tier, or null when it's base/tier-1. */
export function tierHint(tier: number | undefined): string | null {
  return tier != null && tier > 1 ? (TIER_HINT[tier] ?? null) : null;
}
