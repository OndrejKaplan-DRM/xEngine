// A0: sestavení cíle xlab a jeho velikost. Běží první (abecední pořadí), aby testy v prohlížeči měly čerstvý dist/.
// Rozpočet: kód enginu ve hře bez Rapieru a dat ≤ 1,5 MB (docs/06_ROZPOCTY.md).

import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { h, ROOT } from './a_lib/node.mjs';

const r = spawnSync(process.execPath, ['build.mjs', 'xlab'], { cwd: ROOT, encoding: 'utf8' });
h.ok(r.status === 0, 'cíl xlab se sestaví', (r.stdout || r.stderr).trim().split('\n').pop());
const html = statSync(path.join(ROOT, 'dist/xlab.html')).size;

// rozpad velikosti podle původu (stejné volby jako build.mjs, jen s metafile)
const meta = await build({
  entryPoints: [path.join(ROOT, 'src/app/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  write: false,
  metafile: true,
  logLevel: 'silent',
  legalComments: 'none',
  loader: { '.glb': 'binary', '.wasm': 'binary' },
});
const sums = { rapier: 0, three: 0, vendor: 0, kernel: 0, xspace: 0, a: 0, other: 0 };
for (const out of Object.values(meta.metafile.outputs)) {
  for (const [file, info] of Object.entries(out.inputs)) {
    const key = file.includes('@dimforge') ? 'rapier' : file.includes('node_modules/three') ? 'three' : file.startsWith('src/shell') ? 'vendor' : file.startsWith('src/kernel') ? 'kernel' : file.startsWith('src/xspace') ? 'xspace' : file.startsWith('src/') ? 'a' : 'other';
    sums[key] += info.bytesInOutput;
  }
}
const kB = (n) => `${(n / 1024).toFixed(0)} kB`;
const engine = sums.three + sums.vendor + sums.kernel + sums.xspace + sums.a + sums.other;
h.ok(engine <= 1.5 * 1024 * 1024, 'kód enginu bez Rapieru a dat ≤ 1,5 MB', `engine ${kB(engine)} = three ${kB(sums.three)} + kód sešny A ${kB(sums.a)} + základ ${kB(sums.kernel + sums.xspace)} + Shell ${kB(sums.vendor)}; Rapier ${kB(sums.rapier)}; celé HTML ${kB(html)}`);
h.ok(html <= 10 * 1024 * 1024, 'celý soubor hry ≤ 10 MB (zadání, bod 5)', kB(html));

process.exit(h.finish('A0 sestavení'));
