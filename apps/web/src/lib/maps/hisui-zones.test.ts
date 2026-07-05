import { describe, expect, it } from 'vitest';
import dataset from '@nuzlocke/datasets/games/pla.json';
import { HISUI_ZONE_MAPS } from './hisui-zones';

// Per-zone map integrity: every node must reference a real sub-location of
// its own zone, so a dataset rename can't silently orphan map regions.
describe('HISUI_ZONE_MAPS', () => {
  const areas = (dataset as { areas: { id: string; tags: string[] }[] }).areas;

  it('covers exactly the five wild zones', () => {
    expect(Object.keys(HISUI_ZONE_MAPS).sort()).toEqual([
      'alabaster-icelands',
      'cobalt-coastlands',
      'coronet-highlands',
      'crimson-mirelands',
      'obsidian-fieldlands',
    ]);
  });

  it('every node id is a sub-location of its zone', () => {
    for (const [zoneId, map] of Object.entries(HISUI_ZONE_MAPS)) {
      const zoneAreaIds = new Set(areas.filter((a) => a.tags.includes(`zone:${zoneId}`)).map((a) => a.id));
      for (const node of map.nodes) {
        expect(zoneAreaIds.has(node.id), `${zoneId} node "${node.id}" is not an area of that zone`).toBe(true);
      }
      // near-total coverage: at most one list-only area per zone (wayward-cave
      // is a hidden cave the in-game map doesn't label)
      expect(zoneAreaIds.size - map.nodes.length, `${zoneId} unmapped area count`).toBeLessThanOrEqual(1);
    }
  });

  it('nodes stay inside their map viewBox', () => {
    for (const [zoneId, map] of Object.entries(HISUI_ZONE_MAPS)) {
      for (const n of map.nodes) {
        expect(n.x >= 0 && n.y >= 0 && n.x + n.w <= map.viewBox.w && n.y + n.h <= map.viewBox.h,
          `${zoneId}/${n.id} out of bounds`).toBe(true);
      }
    }
  });
});
