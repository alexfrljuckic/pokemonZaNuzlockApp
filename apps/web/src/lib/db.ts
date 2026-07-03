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
  const event = { ...partial, seq: existing.length + 1, at: new Date().toISOString() } as RunEvent;
  await db.add('events', { runId, event });
  return event;
}

export async function loadEvents(runId: string): Promise<RunEvent[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('events', 'byRun', runId);
  return rows.map((r) => r.event).sort((a, b) => a.seq - b.seq);
}
