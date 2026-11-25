import { useEffect } from 'react';
import type { AreaTrainer, EngineContext, MilestoneRosterMember, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { trainerKey } from '../../lib/openTrainer';
import { trainerSpriteKeyFor } from '../../lib/sprites';
import { MilestoneCard } from '../../components/MilestoneCard';

/** Whether a trainer exists in the active version (most are unconditional). */
const appliesTo = (t: AreaTrainer, version: string) => !t.conditions?.version || t.conditions.version.includes(version);

type TrainerEntry = { t: AreaTrainer; index: number };

/** Every level across every Pokémon of a group's trainers, for ordering and the
 * area level range. */
function groupLevels(trainers: TrainerEntry[]): number[] {
  return trainers.flatMap(({ t }) => t.team.map((p) => p.level));
}
/** Mean Pokémon level of a group — the ordering key. */
export function groupAvgLevel(trainers: TrainerEntry[]): number {
  const levels = groupLevels(trainers);
  return levels.length ? levels.reduce((sum, l) => sum + l, 0) / levels.length : 0;
}
/** "Lv 5–9" (or "Lv 7") for an area heading, or '' when no team data. */
export function groupLevelLabel(trainers: TrainerEntry[]): string {
  const levels = groupLevels(trainers);
  if (!levels.length) return '';
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  return lo === hi ? `Lv ${lo}` : `Lv ${lo}–${hi}`;
}

/** Every documented trainer battle for this game, grouped by area, ordered by
 * the area's average team level — a proxy for when you meet them in the story,
 * which tracks progression better than the dataset's area order (areas revisited
 * late, optional detours). The area is still named on each section. Same card
 * format as Boss Fights. Area trainers never gate the level cap; marking one
 * defeated writes the same trainer_battled / trainer_reset events the Routes
 * rows do. */
export function trainerGroups(ctx: EngineContext, version: string) {
  return ctx.dataset.areas
    .map((area) => ({
      area,
      trainers: (area.trainers ?? []).map((t, index) => ({ t, index })).filter(({ t }) => appliesTo(t, version)),
    }))
    .filter((g) => g.trainers.length > 0)
    .sort((a, b) => groupAvgLevel(a.trainers) - groupAvgLevel(b.trainers));
}

export function TrainersTab({
  runId,
  state,
  ctx,
  onChange,
  focusKey,
}: {
  /** owner run id; omit (with onChange) for the read-only spectator view */
  runId?: string;
  state: RunState;
  ctx: EngineContext;
  onChange?: () => Promise<void>;
  /** `${areaId}#${index}` of a trainer to scroll to and open (from Routes) */
  focusKey?: string | null;
}) {
  const editable = runId != null && onChange != null;
  const groups = trainerGroups(ctx, state.version);
  const total = groups.reduce((n, g) => n + g.trainers.length, 0);
  const battled = (key: string) => state.trainersBattled.includes(key);
  const battledCount = groups.reduce(
    (n, g) => n + g.trainers.filter(({ index }) => battled(trainerKey(g.area.id, index))).length,
    0,
  );

  useEffect(() => {
    if (!focusKey) return;
    document.getElementById(domIdFor(focusKey))?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [focusKey]);

  async function mark(areaId: string, index: number, name: string, defeated: boolean) {
    if (!runId || !onChange) return;
    await appendEvent(
      runId,
      defeated
        ? { type: 'trainer_battled', payload: { areaId, trainerIndex: index, name } }
        : { type: 'trainer_reset', payload: { areaId, trainerIndex: index } },
    );
    await onChange();
  }

  if (total === 0) {
    return (
      <section>
        <h2>Trainers</h2>
        <p className="muted">No trainer battles are documented for this game yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>
        Trainers ({battledCount}/{total} defeated)
      </h2>
      <p className="muted">
        Every documented trainer battle, ordered by team level (roughly story order). The area is shown for each; these don't set the level cap.
      </p>
      <div className="trainers-tab">
        {groups.map(({ area, trainers }) => (
          <div key={area.id} className="trainers-tab-area">
            <h3 className="chart-heading">
              {area.name} <span className="trainers-area-lv muted">{groupLevelLabel(trainers)}</span>
            </h3>
            <div className="milestone-card-grid">
              {trainers.map(({ t, index }) => {
                const key = trainerKey(area.id, index);
                const isPokemonFight = /pok[eé]mon/i.test(t.class ?? '');
                return (
                  <MilestoneCard
                    key={`${key}-${focusKey === key}`}
                    domId={domIdFor(key)}
                    milestone={{
                      id: key,
                      name: t.name,
                      type: t.class ?? 'Trainer',
                      order: index,
                      aceLevel: Math.max(...t.team.map((p) => p.level)),
                      trainerSprite: isPokemonFight ? undefined : trainerSpriteKeyFor(t),
                      species: isPokemonFight ? t.team[0].species : undefined,
                    }}
                    roster={t.team as MilestoneRosterMember[]}
                    gameId={ctx.dataset.gameId}
                    cleared={battled(key)}
                    isNext={false}
                    initiallyExpanded={focusKey === key}
                    onClear={editable ? () => mark(area.id, index, t.name, true) : undefined}
                    onUndo={editable ? () => mark(area.id, index, t.name, false) : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const domIdFor = (key: string) => `trainer-${key.replace(/[^a-z0-9-]/gi, '-')}`;
