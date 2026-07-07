import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { RULES, buildRuleset, deriveState, specialAppliesToVersion, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, listGames, speciesToLine } from '../lib/datasets';
import { VERSION_MASCOT, cardColorFor, gameName } from '../games';
import { createRun, deleteRun, importRun, loadEvents, type RunSummary } from '../lib/db';
import { deleteRemoteRun } from '../lib/sync';
import { downloadRunExport } from '../lib/exportRun';
import { MAX_IMPORT_BYTES, parseRunExport } from '../lib/importRun';
import { ConfirmAction } from '../components/ConfirmAction';
import { SpriteImg } from '../components/SpriteImg';
import { StarterPicker, starterHeading } from '../components/SpecialsSection';
import { relativeTime, summarizeRun, type RunCardSummary } from '../lib/runCard';

// Radical Red replaces the generic presets with its own in-game difficulty
// tiers (docs/RADICAL-RED-RESEARCH.md). Other games keep standard/hardcore/casual.
const GENERIC_PRESETS = ['standard', 'hardcore', 'casual'] as const;
const RR_PRESETS = ['rr-normal', 'rr-hardcore'] as const;
const presetsForGame = (gameId: string): readonly string[] =>
  gameId === 'radical-red' ? RR_PRESETS : GENERIC_PRESETS;

const PRESET_LABEL: Record<string, string> = {
  'rr-normal': 'Normal',
  'rr-hardcore': 'Hardcore',
};
const PRESET_DESC: Record<string, string> = {
  standard: 'First encounter per route · no duplicate species',
  hardcore: 'Adds level caps + set mode (no free switch after a KO)',
  casual: 'Relaxed — nothing enforced',
  'rr-normal': "Radical Red's Normal mode · soft level cap at the next boss's ace",
  'rr-hardcore': "Hardcore mode · level caps + forced Set + no bag vs bosses + minimal grinding",
};

const prettyVersion = (v: string) => v.replace(/-/g, ' ');

/** Status glyph + short label, keyed off the derived run status. The glyph
 * doubles as a visual cue in the badge; kept alongside gameName so the card
 * never invents its own vocabulary. */
const STATUS_GLYPH: Record<RunCardSummary['status'], string> = {
  active: '▶',
  'wiped-continuing': '↻',
  wiped: '✖',
  victory: '★',
  abandoned: '⏹',
};

/** A single run rendered as a "save file" card: team sprites + at-a-glance
 * metadata, still opened by a real button (keyboard-reachable, #151). */
function RunCard({
  run,
  summary,
  onSelect,
  onExport,
  onDelete,
}: {
  run: RunSummary;
  summary: RunCardSummary | null;
  onSelect: (runId: string) => void;
  onExport: (r: RunSummary) => void;
  onDelete: (r: RunSummary) => void;
}) {
  const name = gameName(run.gameId);
  const supported = !!DATASETS[run.gameId];
  const status = summary?.status;
  const lastPlayed =
    relativeTime(summary?.lastPlayedAt ?? run.createdAt) ?? new Date(run.createdAt).toLocaleDateString();

  const bench = summary ? summary.boxedCount + summary.deathCount : 0;

  return (
    <div className="run-card" style={{ '--card-color': cardColorFor(run.gameId) } as CSSProperties}>
      <button
        className="run-card-open"
        onClick={() => onSelect(run.id)}
        aria-label={`Continue ${name} (${prettyVersion(run.version)}) run`}
      >
        <div className="run-card-head">
          <span className="run-card-title">{name}</span>
          {status && (
            <span className={`run-status run-status-${status}`}>
              <span aria-hidden="true">{STATUS_GLYPH[status]}</span> {summary!.statusLabel}
            </span>
          )}
        </div>
        <div className="run-card-sub muted">{prettyVersion(run.version)}</div>

        {/* the party — the point of the redesign */}
        {summary ? (
          summary.team.length > 0 ? (
            <div className="run-card-team">
              {summary.team.map((m) => (
                <span
                  key={m.id}
                  className={`run-team-mon${m.shiny ? ' shiny' : ''}`}
                  title={`${m.nickname} · Lv ${m.level}${m.shiny ? ' · shiny' : ''}`}
                >
                  <SpriteImg species={m.species} size={44} shiny={m.shiny} />
                </span>
              ))}
              {bench > 0 && (
                <span className="run-team-bench muted" title="Boxed + fainted">
                  +{bench}
                </span>
              )}
            </div>
          ) : (
            <div className="run-card-team run-card-team-empty muted">
              <span className="sprite-missing" aria-hidden="true">
                ●
              </span>
              No team yet — catch your first Pokémon
            </div>
          )
        ) : supported ? (
          <div className="run-card-team run-card-team-empty muted">Loading team…</div>
        ) : (
          <div className="run-card-team run-card-team-empty muted">Dataset unavailable</div>
        )}

        {/* at-a-glance metadata */}
        {summary && (
          <div className="run-card-stats">
            {summary.badgesTotal > 0 && (
              <span className="run-stat" title="Boss badges / milestones cleared">
                <span className="run-stat-label">Badges</span>
                <span className="run-stat-value">
                  {summary.badgesEarned}/{summary.badgesTotal}
                </span>
              </span>
            )}
            {summary.levelCap != null && (
              <span
                className="run-stat"
                title={summary.nextBossName ? `Next: ${summary.nextBossName}` : 'Level cap'}
              >
                <span className="run-stat-label">Cap</span>
                <span className="run-stat-value">Lv {summary.levelCap}</span>
              </span>
            )}
            <span className="run-stat" title="Team size">
              <span className="run-stat-label">Team</span>
              <span className="run-stat-value">{summary.partyCount}</span>
            </span>
            <span className={`run-stat${summary.deathCount > 0 ? ' run-stat-deaths' : ''}`} title="Fainted">
              <span className="run-stat-label">Lost</span>
              <span className="run-stat-value">{summary.deathCount}</span>
            </span>
          </div>
        )}

        <div className="run-card-foot muted">Last played {lastPlayed}</div>
      </button>

      <div className="run-card-actions">
        <button
          className="secondary"
          onClick={() => onExport(run)}
          aria-label={`Export ${name} run as JSON`}
        >
          Export
        </button>
        <ConfirmAction
          label="Delete"
          prompt="Delete this run permanently? This can't be undone."
          ariaLabel={`Delete ${name} run`}
          onConfirm={() => onDelete(run)}
        />
      </div>
    </div>
  );
}

/** "Continue" flow: each saved run as a card with its team + progress. */
export function ContinueScreen({
  runs,
  onSelect,
  onDeleted,
  onNewGame,
}: {
  runs: RunSummary[];
  onSelect: (runId: string) => void;
  onDeleted: () => Promise<void>;
  /** Jump to the New Game screen from the empty state / card grid. Optional so
   * older callers still compile; when absent the empty-state CTA is hidden. */
  onNewGame?: () => void;
}) {
  // Fold every listed run's event log into its card summary (team + progress).
  // Keyed by run id; a few hundred events per run derive in well under a frame
  // (same local-first pattern as the cross-run stats screen).
  const [summaries, setSummaries] = useState<Record<string, RunCardSummary>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, RunCardSummary> = {};
      for (const r of runs) {
        const dataset = DATASETS[r.gameId];
        if (!dataset) continue; // unknown/removed game — card still renders, just no team
        try {
          next[r.id] = summarizeRun(await loadEvents(r.id), dataset);
        } catch {
          // a corrupt log shouldn't sink the whole list — leave that card bare
        }
      }
      if (!cancelled) setSummaries(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [runs]);

  async function exportRun(r: RunSummary) {
    downloadRunExport(r, await loadEvents(r.id));
  }

  async function handleDelete(r: RunSummary) {
    await deleteRun(r.id);
    // Best-effort remote cleanup — without it, a signed-in user's next
    // pullAllRuns would resurrect the run. A failure (offline) is swallowed:
    // the local delete already happened, per the local-first invariant.
    await deleteRemoteRun(r.id).catch(() => {});
    await onDeleted();
  }

  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImportFile(file: File) {
    setImportError(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError('That file is too large to be a run export.');
      return;
    }
    try {
      // parseRunExport validates everything and throws readable messages;
      // the stored run always gets a fresh id (see importRun in lib/db)
      const parsed = parseRunExport(await file.text());
      const id = await importRun(parsed.gameId, parsed.version, parsed.createdAt, parsed.events);
      await onDeleted();
      onSelect(id);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Could not import that file.');
    }
  }

  if (runs.length === 0) {
    return (
      <section>
        <h2>Continue a run</h2>
        <div className="run-empty">
          <div className="run-empty-glyph" aria-hidden="true">
            ●
          </div>
          <p className="run-empty-title">No runs yet</p>
          <p className="muted">Start a new game to begin your first nuzlocke — its team will show up here.</p>
          {onNewGame && (
            <button className="run-empty-cta" onClick={onNewGame}>
              New Game
            </button>
          )}
          <div className="run-import-row">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
                e.target.value = '';
              }}
            />
            <button className="secondary" onClick={() => fileRef.current?.click()}>
              Import run from file
            </button>
            {importError && (
              <span className="auth-error" role="alert">
                {importError}
              </span>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2>Continue a run</h2>
      <div className="run-card-grid">
        {runs.map((r) => (
          <RunCard
            key={r.id}
            run={r}
            summary={summaries[r.id] ?? null}
            onSelect={onSelect}
            onExport={exportRun}
            onDelete={handleDelete}
          />
        ))}
        {onNewGame && (
          <button className="run-card run-card-new" onClick={onNewGame}>
            <span className="run-card-new-plus" aria-hidden="true">
              +
            </span>
            <span>New Game</span>
          </button>
        )}
      </div>

      {/* restore a backup / move a run between browsers — pairs with Export */}
      <div className="run-import-row">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = ''; // allow re-picking the same file
          }}
        />
        <button className="secondary" onClick={() => fileRef.current?.click()}>
          Import run from file
        </button>
        {importError && (
          <span className="auth-error" role="alert">
            {importError}
          </span>
        )}
      </div>
    </section>
  );
}

/** "New Game" flow: pick a game by card, then its subsettings appear. */
export function NewGameScreen({ onCreated }: { onCreated: (runId: string) => void }) {
  const games = listGames();
  const [gameId, setGameId] = useState<string | null>(null);
  const game = games.find((g) => g.gameId === gameId) ?? null;
  const [version, setVersion] = useState('');
  const [preset, setPreset] = useState<string>('standard');
  const [dlcOn, setDlcOn] = useState(false);
  const [houseRulesText, setHouseRulesText] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingRun, setPendingRun] = useState<{ id: string; events: RunEvent[] } | null>(null);

  function pickGame(id: string) {
    // toggle: clicking the open card collapses it
    if (id === gameId) {
      setGameId(null);
      return;
    }
    setGameId(id);
    setVersion(games.find((g) => g.gameId === id)?.versions[0] ?? '');
    setPreset(presetsForGame(id)[0]); // RR defaults to Normal, others to standard
  }

  async function handleCreate() {
    if (!game || !version) return;
    setCreating(true);
    try {
      const ruleset = buildRuleset(preset, game.gameId);
      if (ruleset.rules['dlc-content']) {
        ruleset.rules['dlc-content'] = { enabled: dlcOn, params: {} };
      }
      ruleset.houseRules = houseRulesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const id = await createRun(game.gameId, version, ruleset);
      const starters = (game.specials ?? []).filter(
        (s) => s.id.startsWith('starter-') && specialAppliesToVersion(s, version),
      );
      if (starters.length > 0) {
        setPendingRun({ id, events: await loadEvents(id) });
      } else {
        onCreated(id);
      }
    } finally {
      setCreating(false);
    }
  }

  // Between run creation and landing on the tracker: if the game has starter
  // choices, claim one here (before any route/area is even visible) rather
  // than burying it in the Routes tab later.
  if (pendingRun && game) {
    const ctx = { dataset: game, speciesToLine };
    const state = deriveState(pendingRun.events, ctx);
    const starters = (game.specials ?? []).filter(
      (s) => s.id.startsWith('starter-') && specialAppliesToVersion(s, state.version),
    );
    return (
      <section>
        <h2>{starterHeading(starters)}</h2>
        <StarterPicker
          runId={pendingRun.id}
          state={state}
          starters={starters}
          onChange={async () => onCreated(pendingRun.id)}
        />
        <button className="secondary" onClick={() => onCreated(pendingRun.id)}>
          Skip for now
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>Choose your game</h2>
      <div className="game-card-grid">
        {games.map((g) => (
          <Fragment key={g.gameId}>
            <button
              className={`game-card${g.gameId === gameId ? ' selected' : ''}`}
              style={{ '--card-color': cardColorFor(g.gameId) } as CSSProperties}
              onClick={() => pickGame(g.gameId)}
              aria-expanded={g.gameId === gameId}
            >
              <img className="game-card-logo" src={`/logos/${g.gameId}.svg`} alt="" width={52} height={52} />
              {/* franchise prefix is implied on a picker full of Pokémon games */}
              <span className="game-card-name">{g.name.replace(/^Pokémon\s+/, '')}</span>
              <span className="muted">{g.areas.length} areas</span>
            </button>

            {/* run settings expand in place, right under the picked card */}
            {gameId === g.gameId && game && (
              <div className="game-settings-inline">
                <span className="picker-label">Version</span>
                <div className="picker-tiles">
                  {game.versions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`picker-tile${version === v ? ' selected' : ''}`}
                      onClick={() => setVersion(v)}
                      aria-pressed={version === v}
                    >
                      {VERSION_MASCOT[v] && <SpriteImg species={VERSION_MASCOT[v]} size={56} />}
                      <span className="picker-tile-label">{prettyVersion(v)}</span>
                    </button>
                  ))}
                </div>

                <span className="picker-label">
                  {game.gameId === 'radical-red' ? 'Difficulty mode' : 'Ruleset preset'}
                </span>
                <div className="picker-tiles">
                  {presetsForGame(game.gameId).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      className={`picker-tile picker-tile-preset${preset === pr ? ' selected' : ''}`}
                      onClick={() => setPreset(pr)}
                      aria-pressed={preset === pr}
                    >
                      <span className="picker-tile-label">{PRESET_LABEL[pr] ?? pr}</span>
                      <span className="picker-tile-desc muted">{PRESET_DESC[pr]}</span>
                    </button>
                  ))}
                </div>

                {RULES['dlc-content'].appliesTo !== 'all' && RULES['dlc-content'].appliesTo.includes(game.gameId) && (
                  <label className="rule-toggle dlc-toggle">
                    <input type="checkbox" checked={dlcOn} onChange={(e) => setDlcOn(e.target.checked)} />
                    Playing the DLC{' '}
                    <span className="muted">(expansion areas, bosses and legendaries; toggleable later in Rules)</span>
                  </label>
                )}

                <label htmlFor="house-rules">
                  House rules (optional, one per line — honor rules, shown but not enforced)
                </label>
                <textarea
                  id="house-rules"
                  rows={3}
                  value={houseRulesText}
                  onChange={(e) => setHouseRulesText(e.target.value)}
                  placeholder="e.g. no legendaries&#10;shiny clause"
                />

                <button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Starting…' : 'Start Run'}
                </button>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
