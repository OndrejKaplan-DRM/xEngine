// xForge: zapíše tematické sady (kit_lab, kit_it…) jako balíky xSpace vedle kit_base. Dvě spuštění dají stejné bajty.
// Použití: node tools/forge/make-pack.mjs [id sady | all] [výstupní adresář]   (výchozí all → packs/<id>)
// Vedle každé sady zapíše tools/forge/<složka>/SADA.md (přehled prefabů a zdůvodnění mezí kloubů) a balík
// packs/kit_all (jen pack.json s requires na všechny sady; z něj staví galerie celou nabídku).

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from './themes.mjs';
import { fmtJson } from '../../src/gen/util.js';
import { kitDoc } from './doc.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const which = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : Object.keys(THEMES);
const outArg = process.argv[3];

for (const id of which) {
  const t = THEMES[id];
  if (!t) throw new Error(`sada „${id}“ neexistuje (${Object.keys(THEMES).join(', ')})`);
  const kit = t.build();
  const outDir = path.resolve(outArg || path.join(root, 'packs', id));
  await rm(path.join(outDir, 'prefabs'), { recursive: true, force: true });
  await rm(path.join(outDir, 'meshes'), { recursive: true, force: true });
  await mkdir(path.join(outDir, 'prefabs'), { recursive: true });
  for (const [file, bytes] of Object.entries(kit.files || {})) {
    await mkdir(path.dirname(path.join(outDir, file)), { recursive: true });
    await writeFile(path.join(outDir, file), bytes);
  }
  const write = (file, data) => writeFile(path.join(outDir, file), fmtJson(data) + '\n');
  await write('pack.json', kit.manifest);
  await write('materials.json', kit.materials);
  for (const p of kit.prefabs) await write(`prefabs/${p.id}.json`, p);
  if (!outArg) await writeFile(path.join(here, t.dir, 'SADA.md'), kitDoc(kit, { id, cmd: `node tools/forge/make-pack.mjs ${id}`, src: `tools/forge/${t.dir}/*.mjs` }));
  const tris = kit.prefabs.reduce((s, p) => s + p.tris, 0);
  const kb = Object.values(kit.files || {}).reduce((s, b) => s + b.length, 0) / 1024;
  console.log(`${path.relative(root, outDir) || outDir}: ${kit.prefabs.length} prefabů (${tris} △, nejvíc ${Math.max(...kit.prefabs.map((p) => p.tris))}), ${Object.keys(kit.materials.materials).length} materiálů, sítě ${Object.keys(kit.files || {}).length} souborů ${kb.toFixed(1)} kB`);
}

if (!outArg) {
  const all = { xspace: 1, kind: 'pack', id: 'kit_all', title: 'Všechny sady xForge (pro galerii)', version: '0.1.0', free: true, requires: ['kit_base', ...Object.keys(THEMES)], prefabs: [], levels: [], assets: [] };
  await mkdir(path.join(root, 'packs', 'kit_all'), { recursive: true });
  await writeFile(path.join(root, 'packs', 'kit_all', 'pack.json'), fmtJson(all) + '\n');
}
