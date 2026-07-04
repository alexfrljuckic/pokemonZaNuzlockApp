import type { Area, AreaTrainer } from '@nuzlocke/engine';
import { typesFor } from '../../lib/speciesData';
import { SpriteImg } from '../SpriteImg';
import { TypeBadges } from '../TypeBadge';

/** Whether a trainer exists in the active version (most are unconditional). */
function appliesTo(t: AreaTrainer, version: string): boolean {
  return !t.conditions?.version || t.conditions.version.includes(version);
}

/** Documented trainer battles in this area — display-only route intel under
 * the encounter picker, so a player can see what fights are coming before
 * they commit. Renders nothing when the dataset has no trainer data here. */
export function TrainersHere({ area, version }: { area: Area; version: string }) {
  const trainers = (area.trainers ?? []).filter((t) => appliesTo(t, version));
  if (trainers.length === 0) return null;
  return (
    <div className="trainers-group">
      <p className="muted specials-group-label">Trainers here ({trainers.length})</p>
      <div className="trainers-list">
        {trainers.map((t, i) => (
          <div key={`${t.name}-${i}`} className="trainer-row">
            <span className="trainer-row-name">
              {t.class ? `${t.class} ` : ''}
              <strong>{t.name}</strong>
            </span>
            <span className="trainer-row-team">
              {t.team.map((p, j) => (
                <span key={`${p.species}-${j}`} className="trainer-mon" title={`${p.species} Lv ${p.level}`}>
                  <SpriteImg species={p.species} size={40} />
                  <span className="trainer-mon-lv muted">Lv{p.level}</span>
                  <TypeBadges types={typesFor(p.species)} />
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
