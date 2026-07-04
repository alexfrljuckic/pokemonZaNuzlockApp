import Ajv2020 from 'ajv/dist/2020.js';
const Ajv = Ajv2020.default ?? Ajv2020;
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const schema = JSON.parse(readFileSync(join(root, 'schema/game.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

// species-data.json is a committed, PokeAPI-fetched build artifact (see
// scripts/build-species-data.mjs) — types/stats/movepools for every species
// referenced anywhere in games/*.json. If a dataset PR adds a species (in an
// encounter, special, milestone roster, or a rosterByStarter variant) without
// re-running that build script, the app silently shows no type/stats for it.
// Catch that here instead of relying on someone noticing a missing badge.
const speciesData = JSON.parse(readFileSync(join(root, 'generated/species-data.json'), 'utf8'));
const knownSpecies = new Set(Object.keys(speciesData.types));

let failed = false;
for (const file of readdirSync(join(root, 'games')).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(root, 'games', file), 'utf8'));
  if (!validate(data)) {
    failed = true;
    console.error(`FAIL ${file}`);
    for (const err of validate.errors) console.error(`   ${err.instancePath} ${err.message}`);
    continue;
  }
  const problems = [];
  const milestoneIds = new Set(data.milestones.map((m) => m.id));
  const areaIds = new Set(data.areas.map((a) => a.id));
  for (const a of data.areas) {
    if (a.unlockAfter && !milestoneIds.has(a.unlockAfter))
      problems.push(`area "${a.id}" unlockAfter references unknown milestone "${a.unlockAfter}"`);
  }
  if (data.areas.length !== areaIds.size) problems.push('duplicate area ids');
  const orders = data.milestones.map((m) => m.order);
  if (new Set(orders).size !== orders.length) problems.push('duplicate milestone orders');
  for (const m of data.milestones) {
    if (m.aceLevel != null && Array.isArray(m.roster) && m.roster.length) {
      const maxRosterLevel = Math.max(...m.roster.map((p) => p.level));
      if (m.aceLevel !== maxRosterLevel)
        problems.push(
          `milestone "${m.id}" aceLevel (${m.aceLevel}) does not match max roster level (${maxRosterLevel})`
        );
    }
    // per-starter roster variants must agree with aceLevel too (no drift)
    if (m.aceLevel != null && m.rosterByStarter && typeof m.rosterByStarter === 'object') {
      for (const [key, variant] of Object.entries(m.rosterByStarter)) {
        if (Array.isArray(variant) && variant.length) {
          const maxV = Math.max(...variant.map((p) => p.level));
          if (m.aceLevel !== maxV)
            problems.push(
              `milestone "${m.id}" rosterByStarter.${key} max level (${maxV}) does not match aceLevel (${m.aceLevel})`
            );
        }
      }
    }
  }

  const referencedSpecies = new Set();
  for (const a of data.areas) for (const e of a.encounters ?? []) referencedSpecies.add(e.species);
  for (const s of data.specials ?? []) referencedSpecies.add(s.species);
  for (const m of data.milestones) {
    for (const p of m.roster ?? []) referencedSpecies.add(p.species);
    for (const variant of Object.values(m.rosterByStarter ?? {})) for (const p of variant) referencedSpecies.add(p.species);
  }
  const missingSpecies = [...referencedSpecies].filter((s) => !knownSpecies.has(s)).sort();
  if (missingSpecies.length) {
    problems.push(
      `species missing from generated/species-data.json (types/stats/moves won't show — re-run ` +
        `build-species-data.mjs): ${missingSpecies.join(', ')}`
    );
  }

  if (problems.length) {
    failed = true;
    console.error(`FAIL ${file}`);
    for (const p of problems) console.error(`   ${p}`);
  } else {
    console.log(`OK ${file} (${data.areas.length} areas, ${data.milestones.length} milestones)`);
  }
}
process.exit(failed ? 1 : 0);
