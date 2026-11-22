// Spustí testy jedné skupiny za sebou (nikdy souběžně: prohlížeč smí běžet jen jeden).
// Použití: node tools/run-tests.mjs <předpona>   např. a → test/a_*.mjs a test/a_*.cjs, b → test/b_*
// Soubory se pouštějí v abecedním pořadí; první neúspěch běh nezastaví, návratový kód je 1, pokud něco selhalo.

import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prefix = process.argv[2];
if (!prefix) {
  console.error('Použití: node tools/run-tests.mjs <předpona>');
  process.exit(2);
}
const files = (await readdir(path.join(root, 'test'))).filter((f) => f.startsWith(prefix + '_') && /\.(mjs|cjs)$/.test(f)).sort();
if (!files.length) {
  console.log(`Žádné testy test/${prefix}_*`);
  process.exit(0);
}
let failed = 0;
for (const f of files) {
  console.log(`\n=== ${f}`);
  const r = spawnSync(process.execPath, [path.join(root, 'test', f)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(`\nSkupina ${prefix}: ${files.length - failed} z ${files.length} sad prošlo`);
process.exit(failed ? 1 : 0);
