import { specialAppliesToVersion, type EngineContext, type RunState } from '@nuzlocke/engine';
import { SpecialCard } from '../SpecialsSection';

/** Gift/fossil/static specials tied to one area (not starters — those are
 * claimed earlier, in the game-picker flow). Renders nothing if none. */
export function SpecialsHere({
  areaId,
  runId,
  state,
  ctx,
  onChange,
}: {
  areaId: string;
  runId: string;
  state: RunState;
  ctx: EngineContext;
  onChange: () => Promise<void>;
}) {
  const here = (ctx.dataset.specials ?? []).filter(
    (s) => s.area === areaId && !s.id.startsWith('starter-') && specialAppliesToVersion(s, state.version),
  );
  if (here.length === 0) return null;
  return (
    <div className="specials-group">
      <p className="muted specials-group-label">Gifts &amp; specials here</p>
      <div className="specials-grid">
        {here.map((s) => (
          <SpecialCard key={s.id} s={s} runId={runId} state={state} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
