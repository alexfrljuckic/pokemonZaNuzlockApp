import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { RunEvent, Ruleset } from '@nuzlocke/engine';

export interface RunSummary {
  id: string;
  gameId: string;
  version: string;
  createdAt: string;
}

interface StoredEvent {
  id?: number;
  runId: string;
  event: RunEvent;
}

interface NuzlockeDB extends DBSchema {
  runs: { key: string; value: RunSummary };
  events: { key: number; value: StoredEvent; indexes: { byRun: string } };
}

let dbPromise: Promise<IDBPDatabase<NuzlockeDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<NuzlockeDB>('nuzlocke-tracker', 1, {
      upgrade(db) {
        db.createObjectStore('runs', { keyPath: 'id' });
        const events = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        events.createIndex('byRun', 'runId');
      },
    });
  }
  return dbPromise;
}

export async function listRuns(): Promise<RunSummary[]> {
  const db = await getDB();
  return db.getAll('runs');
}

/** Creates a run and records its founding `run_started` event (seq 1). Returns the new run id. */
export async function createRun(gameId: string, version: string, ruleset: Ruleset): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const at = new Date().toISOString();
  await db.add('runs', { id, gameId, version, createdAt: at });
  await db.add('events', {
    runId: id,
    event: { seq: 1, at, type: 'run_started', payload: { gameId, version, ruleset } },
  });
  return id;
}

/** Appends an event to a run's log, assigning the next seq. The log is append-only. */
export async function appendEvent(runId: string, partial: Omit<RunEvent, 'seq' | 'at'>): Promise<RunEvent> {
  const db = await getDB();
  const existing = await db.getAllFromIndex('events', 'byRun', runId);
  // max+1 rather than count+1 so seq stays monotonic even after a sync pull
  // merges in events this device hadn't seen yet (e.g. logged on another
  // device). This does NOT fully resolve two devices both appending while
  // both are offline and neither has ever synced — that can still produce a
  // duplicate seq. Full CRDT-style conflict resolution is out of scope for
  // this MVP; see docs/BACKLOG.md.
  const nextSeq = existing.reduce((max, r) => Math.max(max, r.event.seq), 0) + 1;
  const event = { ...partial, seq: nextSeq, at: new Date().toISOString() } as RunEvent;
  await db.add('events', { runId, event });
  return event;
}

export async function loadEvents(runId: string): Promise<RunEvent[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('events', 'byRun', runId);
  return rows.map((r) => r.event).sort((a, b) => a.seq - b.seq);
}

/**
 * Permanently removes a run and its entire event log from local storage.
 * The log is append-only *within* a run; deleting the whole run is the one
 * sanctioned destructive operation (always behind an explicit confirm in the
 * UI — remote cleanup lives in sync.ts `deleteRemoteRun`).
 */
export async function deleteRun(runId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['runs', 'events'], 'readwrite');
  tx.objectStore('runs').delete(runId);
  let cursor = await tx.objectStore('events').index('byRun').openCursor(runId);
  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** Adds a run summary pulled from a remote sync source, if not already known locally. */
export async function upsertRunSummary(run: RunSummary): Promise<void> {
  const db = await getDB();
  await db.put('runs', run);
}

/**
 * Inserts remote events this device doesn't have yet (matched by seq).
 * Never overwrites or removes a local event — merge only ever adds.
 * Returns whether anything was actually added.
 */
export async function mergeRemoteEvents(runId: string, remoteEvents: RunEvent[]): Promise<boolean> {
  const db = await getDB();
  const existing = await db.getAllFromIndex('events', 'byRun', runId);
  const knownSeqs = new Set(existing.map((r) => r.event.seq));
  let changed = false;
  for (const event of remoteEvents) {
    if (!knownSeqs.has(event.seq)) {
      await db.add('events', { runId, event });
      changed = true;
    }
  }
  return changed;
}
