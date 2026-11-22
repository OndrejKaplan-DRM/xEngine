// Převzatý kód (vendor/) je připnutý na commit zdrojového repa a v tomto repu se NEUPRAVUJE.
// Změnu udělej ve zdrojovém repu a převezmi novou verzi: node tools/vendor-check.mjs --update <cesta ke klonu> <commit>
// Bez parametrů ověří otisky souborů proti vendor/VENDOR.json.

import { readFile, writeFile, readdir, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'vendor');
const metaFile = path.join(dir, 'VENDOR.json');
const MAP = { 'shell/': 'src/shell/', 'core/store.js': 'src/core/store.js' }; // cíl ve vendor/ → zdroj v repu

async function list(d, rel = '') {
  const out = [];
  for (const e of await readdir(path.join(d, rel), { withFileTypes: true })) {
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) out.push(...(await list(d, r)));
    else if (r !== 'VENDOR.json') out.push(r);
  }
  return out.sort();
}
const sha = async (f) => createHash('sha256').update(await readFile(f)).digest('hex');

const args = process.argv.slice(2);
if (args[0] === '--update') {
  const [, src, commit] = args;
  if (!src || !commit) throw new Error('Použití: --update <cesta ke klonu vibe-game-frameworks> <commit>');
  const meta = JSON.parse(await readFile(metaFile, 'utf8'));
  for (const f of Object.keys(meta.files)) {
    const [to, from] = Object.entries(MAP).find(([t]) => f.startsWith(t));
    await mkdir(path.dirname(path.join(dir, f)), { recursive: true });
    await copyFile(path.join(src, from + f.slice(to.length)), path.join(dir, f));
  }
  meta.commit = commit;
  meta.date = new Date().toISOString().slice(0, 10);
  for (const f of Object.keys(meta.files)) meta.files[f] = await sha(path.join(dir, f));
  await writeFile(metaFile, JSON.stringify(meta, null, 2) + '\n');
  console.log(`vendor/ převzato z commitu ${commit}`);
} else if (args[0] === '--init') {
  const files = {};
  for (const f of await list(dir)) files[f] = await sha(path.join(dir, f));
  const meta = { source: 'https://github.com/OndrejKaplan-DRM/vibe-game-frameworks', branch: args[1], commit: args[2], date: new Date().toISOString().slice(0, 10), note: 'Shell S0 + S1 a katalog nabídek. Neupravovat zde.', files };
  await writeFile(metaFile, JSON.stringify(meta, null, 2) + '\n');
  console.log(`vendor/VENDOR.json: ${Object.keys(files).length} souborů`);
} else {
  const meta = JSON.parse(await readFile(metaFile, 'utf8'));
  const have = await list(dir);
  const bad = [];
  for (const [f, h] of Object.entries(meta.files)) if (!have.includes(f) || (await sha(path.join(dir, f))) !== h) bad.push(f);
  for (const f of have) if (!(f in meta.files)) bad.push(f + ' (navíc)');
  if (bad.length) {
    console.error(`vendor/ se liší od commitu ${meta.commit}: ${bad.join(', ')}`);
    process.exit(1);
  }
  console.log(`vendor/ odpovídá ${meta.source} @ ${meta.commit} (${have.length} souborů)`);
}
