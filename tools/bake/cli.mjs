#!/usr/bin/env node
// xBake z příkazové řádky: zapeče světlo levelů balíku do souborů <level>.light.bin (formát N-001, přijatý D-035).
//   node tools/bake/cli.mjs packs/<balík> [--level <id>] [--out <složka>] [--rays 64] [--soft 4] [--no-indirect] [--no-gates]
// --soft N      okraj stínu: N × N paprsků z plošky vzorku na hraně stínu (0 = jeden paprsek na vzorek)
// --no-gates    dveře portálů stíní v klidové poloze a úseky s bránou nevzniknou (jen pro srovnání; neodpovídá D-035)
// Výchozí výstup je dist/bake/<balík>/ (necommituje se). Do balíků nic nezapisuje: pole baked a čtení souboru
// za běhu přijdou se sloučením do základu.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { checkPackDir } from '../lib/read-pack.mjs';
import { bakeLevel, DEFAULTS } from './bake.mjs';
import { encodeBake } from './format.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? null : args[i + 1];
};
const dir = args[0] && !args[0].startsWith('--') ? args[0] : null;
if (!dir) {
  console.error('Použití: node tools/bake/cli.mjs packs/<balík> [--level <id>] [--out <složka>] [--rays 64] [--soft 4] [--no-indirect] [--no-gates]');
  process.exit(2);
}

const { pack, res } = await checkPackDir(path.resolve(root, dir));
if (res.errors.length) {
  console.error(`CHYBA: balík ${dir} má ${res.errors.length} chyb validátoru; nejdřív node tools/xspace-check.mjs ${dir}`);
  process.exit(1);
}
const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const materials = pack.materials ? pack.materials.materials : {};
const out = path.resolve(root, flag('--out') || path.join('dist/bake', pack.manifest.id));
mkdirSync(out, { recursive: true });
const only = flag('--level');
for (const { data: level } of pack.levels) {
  if (only && level.id !== only) continue;
  const bake = bakeLevel(level, prefabs, materials, { rays: Number(flag('--rays') || DEFAULTS.rays), soft: Number(flag('--soft') ?? DEFAULTS.soft), indirect: !args.includes('--no-indirect'), gates: !args.includes('--no-gates') });
  const buf = encodeBake(bake, level, prefabs, materials);
  const file = path.join(out, `${level.id}.light.bin`);
  writeFileSync(file, buf);
  const s = bake.stats;
  const sections = bake.layers.reduce((n, L) => n + L.gates.length, 0);
  console.log(`${level.id}: vzorků ${s.samples} (z toho ${s.invalid} schovaných v tělese), vrstev ${bake.layers.length}, stínítek ${s.blockers}, dveří v portálech ${s.doors}, úseků s bránou ${sections} (${s.gated} položek), zjemněných vzorků ${s.softened}, paprsků ${s.shadowRays + s.bounceRays}, ${(s.ms / 1000).toFixed(2)} s → ${path.relative(root, file)} ${(buf.length / 1024).toFixed(0)} kB (gzip ${(gzipSync(buf).length / 1024).toFixed(0)} kB)`);
  if (s.skippedColliders) console.log(`  pozor: ${s.skippedColliders} kolizí tvaru hull nebo mesh nestíní (partCollider je neumí)`);
}
