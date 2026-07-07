import {
  boxed,
  deriveState,
  fallen,
  milestonesFor,
  nextBoss,
  party,
  runTiming,
  type GameDataset,
  type PokemonInstance,
  type RunEvent,
  type RunState,
} from '@nuzlocke/engine';
import { speciesToLine } from './datasets';

/** A team member reduced to what the run card shows (sprite + hover detail). */
export interface RunCardMember {
  id: string;
  species: string;
  nickname: string;
  level: number;
  shiny: boolean;
}

/** Everything the "save file" card needs, derived once from a run's event log.
 * Pure aside from reading the shared speciesToLine map — folding a run of a few
 * hundred events is sub-frame, so deriving every listed run up front is fine
 * (same approach the cross-run stats screen already takes). */
export interface RunCardSummary {
  /** Live party, capped at 6 and ordered by descending level (the "ace" first). */
  team: RunCardMember[];
  status: RunState['status'];
  statusLabel: string;
  /** Battle milestones that gate the level cap, cleared / total (e.g. 3 / 8). */
  badgesEarned: number;
  badgesTotal: number;
  /** Current enforced level cap (next boss ace + offset), or null when off/done. */
  levelCap: number | null;
  /** Name of the next uncleared gating boss, when there is one. */
  nextBossName: string | null;
  partyCount: number;
  boxedCount: number;
  deathCount: number;
  /** ISO timestamp of the most recent event, for "last played". */
  lastPlayedAt: string | null;
}

const STATUS_LABEL: Record<RunState['status'], string> = {
  active: 'Active',
  'wiped-continuing': 'Wiped — continuing',
  wiped: 'Wiped',
  victory: 'Won',
  abandoned: 'Abandoned',
};

export function statusLabel(status: RunState['status']): string {
  return STATUS_LABEL[status] ?? status;
}

function toMember(p: PokemonInstance): RunCardMember {
  return { id: p.id, species: p.species, nickname: p.nickname, level: p.level, shiny: p.shiny ?? false };
}

/** Reduce a derived run state + its events into the card view-model. Split out
 * from event loading so it's unit-testable with a hand-built state. */
export function summarizeRunState(state: RunState, events: RunEvent[], dataset: GameDataset): RunCardSummary {
  const ctx = { dataset, speciesToLine };

  const team = party(state)
    .slice()
    .sort((a, b) => b.level - a.level)
    .slice(0, 6)
    .map(toMember);

  // Level-cap progress uses the same gating-milestone set the cap rule reads,
  // so "3 / 8" always matches what the run's Boss Fights tab shows.
  const gating = milestonesFor(dataset, state.version, state.ruleset).filter(
    (m) => m.aceLevel !== null && m.countsForLevelCap !== false,
  );
  const badgesTotal = gating.length;
  const badgesEarned = gating.filter((m) => state.milestonesCleared.includes(m.id)).length;

  const capRule = state.ruleset.rules['level-cap'];
  const boss = nextBoss(state, ctx);
  const levelCap =
    capRule?.enabled && boss?.aceLevel != null ? boss.aceLevel + Number(capRule.params.offset ?? 0) : null;

  const lastPlayedAt = runTiming(events, ctx).lastEventAt;

  return {
    team,
    status: state.status,
    statusLabel: statusLabel(state.status),
    badgesEarned,
    badgesTotal,
    levelCap,
    nextBossName: boss?.name ?? null,
    partyCount: party(state).length,
    boxedCount: boxed(state).length,
    deathCount: fallen(state).length,
    lastPlayedAt,
  };
}

/** Fold a run's event log and summarize it for the picker card. */
export function summarizeRun(events: RunEvent[], dataset: GameDataset): RunCardSummary {
  const state = deriveState(events, { dataset, speciesToLine });
  return summarizeRunState(state, events, dataset);
}

/** "3 days ago" / "just now" — compact relative time for the card footer.
 * Returns null when no timestamp is available. Pure; takes `now` for testing. */
export function relativeTime(iso: string | null, now: number = Date.now()): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const diff = now - then;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
