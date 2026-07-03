import { useEffect, useState } from 'react';
import { listRuns, type RunSummary } from './lib/db';
import { SYNC_ENABLED } from './lib/env';
import { pullAllRuns } from './lib/sync';
import { useAuth } from './lib/useAuth';
import { AuthBar } from './screens/AuthBar';
import { RunPicker } from './screens/RunPicker';
import { RunView } from './screens/RunView';

export default function App() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const { session } = useAuth();

  async function refreshRuns() {
    setRuns(await listRuns());
  }

  useEffect(() => {
    refreshRuns();
  }, []);

  // On sign-in, pull any runs from other devices/sessions into local storage
  // before showing the run list, so "continue a run" reflects everything the
  // account owns, not just what this browser created.
  useEffect(() => {
    if (!session) return;
    pullAllRuns(session.user.id)
      .then(refreshRuns)
      .catch(() => {});
  }, [session]);

  async function handleCreated(runId: string) {
    await refreshRuns();
    setActiveRunId(runId);
  }

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null;

  return (
    <>
      <h1>Nuzlocke Tracker</h1>
      <span className="sync-badge">Sync: {SYNC_ENABLED ? 'enabled' : 'disabled (local-only)'}</span>
      <AuthBar />

      {activeRun ? (
        <RunView run={activeRun} session={session} onBack={() => setActiveRunId(null)} />
      ) : (
        <RunPicker runs={runs} onSelect={setActiveRunId} onCreated={handleCreated} />
      )}
    </>
  );
}
