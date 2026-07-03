import { useEffect, useState } from 'react';
import { listRuns, type RunSummary } from './lib/db';
import { SYNC_ENABLED } from './lib/env';
import { RunPicker } from './screens/RunPicker';
import { RunView } from './screens/RunView';

export default function App() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  async function refreshRuns() {
    setRuns(await listRuns());
  }

  useEffect(() => {
    refreshRuns();
  }, []);

  async function handleCreated(runId: string) {
    await refreshRuns();
    setActiveRunId(runId);
  }

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null;

  return (
    <>
      <h1>Nuzlocke Tracker</h1>
      <span className="sync-badge">Sync: {SYNC_ENABLED ? 'enabled' : 'disabled (local-only)'}</span>

      {activeRun ? (
        <RunView run={activeRun} onBack={() => setActiveRunId(null)} />
      ) : (
        <RunPicker runs={runs} onSelect={setActiveRunId} onCreated={handleCreated} />
      )}
    </>
  );
}
