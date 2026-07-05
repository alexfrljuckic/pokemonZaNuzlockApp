import { useState } from 'react';
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
  const [editingHouseRules, setEditingHouseRules] = useState(false);
  const [houseRulesText, setHouseRulesText] = useState('');

  async function toggle(ruleId: string) {
    const before = state.ruleset.rules[ruleId] ?? null;
    const after = { enabled: !(before?.enabled ?? false), params: before?.params ?? {} };
    await appendEvent(runId, { type: 'rule_changed', payload: { ruleId, before, after } });
    await onChange();
  }

  function startEditingHouseRules() {
    setHouseRulesText(state.ruleset.houseRules.join('\n'));
    setEditingHouseRules(true);
  }

  async function saveHouseRules() {
    const before = [...state.ruleset.houseRules];
    const after = houseRulesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    // audited like rule_changed: before AND after recorded in the event log
    await appendEvent(runId, { type: 'house_rules_changed', payload: { before, after } });
    setEditingHouseRules(false);
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
      <p className="muted">
        Honor rules the app can't verify — shown verbatim, never enforced. Edits mid-run are allowed and
        always audited as a `house_rules_changed` event visible in the event log.
      </p>
      {editingHouseRules ? (
        <>
          <label htmlFor="house-rules-edit">House rules (one per line)</label>
          <textarea
            id="house-rules-edit"
            rows={4}
            value={houseRulesText}
            onChange={(e) => setHouseRulesText(e.target.value)}
            placeholder="e.g. no legendaries&#10;shiny clause"
          />
          <div className="encounter-actions">
            <button onClick={saveHouseRules}>Save</button>
            <button className="secondary" onClick={() => setEditingHouseRules(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {state.ruleset.houseRules.length === 0 ? (
            <p className="muted">None set for this run.</p>
          ) : (
            <ul>
              {state.ruleset.houseRules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          <button className="secondary" onClick={startEditingHouseRules}>
            Edit
          </button>
        </>
      )}
    </section>
  );
}
