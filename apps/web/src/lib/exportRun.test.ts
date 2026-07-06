import { describe, expect, it } from 'vitest';
import type { RunEvent } from '@nuzlocke/engine';
import { buildRunExport, exportFileName } from './exportRun';
import type { RunSummary } from './db';

const run: RunSummary = {
  id: 'r1',
  gameId: 'bdsp',
  version: 'brilliant-diamond',
  createdAt: '2026-07-01T10:20:30.000Z',
};

const events = [
  { seq: 2, at: '2026-07-01T11:00:00Z', type: 'encounter', payload: { areaId: 'route-201' } },
  { seq: 1, at: '2026-07-01T10:20:30Z', type: 'run_started', payload: {} },
] as unknown as RunEvent[];

describe('buildRunExport', () => {
  it('wraps run + events in a versioned envelope', () => {
    const out = buildRunExport(run, events, '2026-07-05T00:00:00.000Z');
    expect(out.format).toBe('nuzlocke-tracker-run');
    expect(out.formatVersion).toBe(1);
    expect(out.exportedAt).toBe('2026-07-05T00:00:00.000Z');
    expect(out.run).toEqual(run);
    expect(out.events).toHaveLength(2);
  });

  it('sorts events by seq without mutating the input', () => {
    const out = buildRunExport(run, events);
    expect(out.events.map((e) => e.seq)).toEqual([1, 2]);
    expect(events.map((e) => e.seq)).toEqual([2, 1]); // caller's array untouched
  });

  it('round-trips through JSON', () => {
    const out = buildRunExport(run, events, '2026-07-05T00:00:00.000Z');
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });
});

describe('exportFileName', () => {
  it('is nuzlocke-<gameId>-<run start date>.json', () => {
    expect(exportFileName(run)).toBe('nuzlocke-bdsp-2026-07-01.json');
  });

  it('works for unsupported/legacy game ids too', () => {
    expect(exportFileName({ ...run, gameId: 'gone-game' })).toBe('nuzlocke-gone-game-2026-07-01.json');
  });
});
