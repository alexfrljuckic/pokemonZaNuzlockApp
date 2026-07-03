import { RULES, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

export function RulesTab({
  runId,
  state,
  ctx,
  onChange,
}: {
  runId: string;
  state: RunState;
  ctx: EngineContext;
  onChange: () => Promise<void>;
}) {
  const applicable = Object.values(RULES).filter(
    (r) => r.appliesTo === 'all' || r.appliesTo.includes(ctx.dataset.gameId),
  );

  async function toggle(ruleId: string) {
    const before = state.ruleset.rules[ruleId] ?? null;
    const after = { enabled: !(before?.enabled ?? false), params: before?.params ?? {} };
    await appendEvent(runId, { type: 'rule_changed', payload: { ruleId, before, after } });
    await onChange();
  }

  async function setParam(ruleId: string, key: string, value: unknown) {
    const before = state.ruleset.rules[ruleId] ?? null;
    const after = { enabled: before?.enabled ?? false, params: { ...(before?.params ?? {}), [key]: value } };
    await appendEvent(runId, { type: 'rule_changed', payload: { ruleId, before, after, note: `${key} → ${value}` } });
    await onChange();
  }

  return (
    <section>
      <h2>Rules — preset: {state.ruleset.presetId}</h2>
      <p className="muted">
        Toggling a rule mid-run is allowed and always audited as a `rule_changed` event visible in the
        event log.
      </p>

      {applicable.map((def) => {
        const cfg = state.ruleset.rules[def.id];
        return (
          <div key={def.id} className="rule-row">
            <label className="rule-toggle">
              <input type="checkbox" checked={cfg?.enabled ?? false} onChange={() => toggle(def.id)} />
              {def.name} <span className="muted">({def.enforcement})</span>
            </label>
            <p className="muted">{def.description}</p>

            {def.id === 'level-cap' && cfg?.enabled && (
              <label>
                Offset from ace level
                <input
                  type="number"
                  value={Number(cfg.params.offset ?? 0)}
                  onChange={(e) => setParam('level-cap', 'offset', Number(e.target.value))}
                />
              </label>
            )}

            {def.id === 'dupes-clause' && cfg?.enabled && (
              <label>
                Scope
                <select
                  value={String(cfg.params.scope ?? 'evolution-line')}
                  onChange={(e) => setParam('dupes-clause', 'scope', e.target.value)}
                >
                  <option value="evolution-line">Evolution line</option>
                  <option value="species">Species only</option>
                </select>
              </label>
            )}
          </div>
        );
      })}

      <h2>House rules</h2>
      {state.ruleset.houseRules.length === 0 ? (
        <p className="muted">
          None set for this run. House rules are honor rules the app can't verify — they can only be added
          when starting a new run (the event schema doesn't yet support editing them mid-run).
        </p>
      ) : (
        <ul>
          {state.ruleset.houseRules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
