import Ajv2020 from 'ajv/dist/2020.js';
const Ajv = Ajv2020.default ?? Ajv2020;
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const schema = JSON.parse(readFileSync(join(root, 'schema/game.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

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
