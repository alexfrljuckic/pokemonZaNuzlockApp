import { useState } from 'react';
import { RULES, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

export function RulesTab({
  runId,
  state,
  ctx,
  onChange,
}: {
  /** owner run id; omit (with onChange) for the read-only spectator view */
  runId?: string;
  state: RunState;
  ctx: EngineContext;
  onChange?: () => Promise<void>;
}) {
  // read-only (spectator): the same rules + definitions, rendered without any
  // toggles or edit affordances so a shared run shows exactly the rules in effect.
  const editable = runId != null && onChange != null;
  const applicable = Object.values(RULES).filter(
    (r) => r.appliesTo === 'all' || r.appliesTo.includes(ctx.dataset.gameId),
  );
  const [editingHouseRules, setEditingHouseRules] = useState(false);
  const [houseRulesText, setHouseRulesText] = useState('');

  async function toggle(ruleId: string) {
    if (!runId || !onChange) return;
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
    if (!runId || !onChange) return;
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
    if (!runId || !onChange) return;
    const before = state.ruleset.rules[ruleId] ?? null;
    const after = { enabled: before?.enabled ?? false, params: { ...(before?.params ?? {}), [key]: value } };
    await appendEvent(runId, { type: 'rule_changed', payload: { ruleId, before, after, note: `${key} → ${value}` } });
    await onChange();
  }

  return (
    <section>
      <h2>Rules — preset: {state.ruleset.presetId}</h2>
      {/* audit: no backticks/internal event names in user-facing copy, and
          the enforced-vs-honor distinction needs a legend, not just tags */}
      <p className="muted rules-legend">
        <strong>enforced</strong> — the app applies it for you (illegal picks are blocked).{' '}
        <strong>honor</strong> — tracked and displayed, but following it is up to you.
      </p>
      <p className="muted">
        {editable
          ? "You can change rules mid-run. Every change is recorded in the run's history with what it was before and after, so a shared run always shows exactly when the rules changed."
          : 'These are the rules in effect for this run.'}
      </p>

      <div className="rules-grid">
      {applicable.map((def) => {
        const cfg = state.ruleset.rules[def.id];
        const enabled = cfg?.enabled ?? false;
        return (
          <div key={def.id} className={`rule-row${!editable && !enabled ? ' rule-off' : ''}`}>
            {editable ? (
              <label className="rule-toggle">
                <input type="checkbox" checked={enabled} onChange={() => toggle(def.id)} />
                {def.name} <span className="muted">({def.enforcement})</span>
              </label>
            ) : (
              <div className="rule-toggle rule-readonly">
                <span className={`rule-status${enabled ? ' on' : ''}`}>{enabled ? '✓ on' : '— off'}</span>
                {def.name} <span className="muted">({def.enforcement})</span>
              </div>
            )}
            <p className="muted">{def.description}</p>

            {def.id === 'level-cap' && enabled && (
              editable ? (
                <label>
                  Offset from ace level
                  <input
                    type="number"
                    value={Number(cfg?.params.offset ?? 0)}
                    onChange={(e) => setParam('level-cap', 'offset', Number(e.target.value))}
                  />
                </label>
              ) : (
                <p className="muted">Offset from ace level: {Number(cfg?.params.offset ?? 0)}</p>
              )
            )}

            {def.id === 'dupes-clause' && enabled && (
              editable ? (
                <label>
                  Scope
                  <select
                    value={String(cfg?.params.scope ?? 'evolution-line')}
                    onChange={(e) => setParam('dupes-clause', 'scope', e.target.value)}
                  >
                    <option value="evolution-line">Evolution line</option>
                    <option value="species">Species only</option>
                  </select>
                </label>
              ) : (
                <p className="muted">
                  Scope: {String(cfg?.params.scope ?? 'evolution-line') === 'species' ? 'Species only' : 'Evolution line'}
                </p>
              )
            )}
          </div>
        );
      })}
      </div>

      <h2>House rules</h2>
      <p className="muted">
        {editable
          ? 'Your own rules, in your own words — shown here and on shared views, never enforced by the app. Edits mid-run are recorded in the run\'s history like any other rule change.'
          : "The owner's own rules, in their own words — never enforced by the app."}
      </p>
      {!editable ? (
        state.ruleset.houseRules.length === 0 ? (
          <p className="muted">No house rules on this run.</p>
        ) : (
          <ul>
            {state.ruleset.houseRules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )
      ) : editingHouseRules ? (
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
