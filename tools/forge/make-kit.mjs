// xForge: zapíše sadu kit_base jako balík xSpace. Dvě spuštění dají stejné bajty.
// Použití: node tools/forge/make-kit.mjs [výstupní adresář]   (výchozí packs/kit_base)
// Vedle balíku zapíše tools/forge/KIT.md: přehled prefabů a zdůvodnění mezí kloubů.

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKit } from './kit/index.mjs';
import { fmtJson } from '../../src/gen/util.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'packs/kit_base'));
const isDefault = outDir === path.join(root, 'packs/kit_base');

const kit = buildKit();
await rm(path.join(outDir, 'prefabs'), { recursive: true, force: true }); // ať v balíku nezůstane prefab, který ze sady vypadl
await mkdir(path.join(outDir, 'prefabs'), { recursive: true });
const write = (file, data) => writeFile(path.join(outDir, file), fmtJson(data) + '\n');
await write('pack.json', kit.manifest);
await write('materials.json', kit.materials);
for (const p of kit.prefabs) await write(`prefabs/${p.id}.json`, p);

/** Dokument: tabulka prefabů a zdůvodnění mezí. Generuje se, neupravuje se ručně. */
function kitDoc(k) {
  const num = (v) => String(v).replace('.', ',');
  const dims = (p) => [0, 1, 2].map((i) => num(Math.round((p.bounds.max[i] - p.bounds.min[i]) * 100) / 100)).join(' × ');
  const lines = ['# Sada kit_base: přehled', '', 'Generováno příkazem `node tools/forge/make-kit.mjs`. Neupravovat ručně; zdroj je `tools/forge/kit/*.mjs`.', ''];
  lines.push(`Prefabů: ${k.prefabs.length} · materiálů: ${Object.keys(k.materials.materials).length} · trojúhelníků celkem: ${k.prefabs.reduce((s, p) => s + p.tris, 0)}`, '');
  lines.push('| Prefab | Název | Kategorie | Obal š × v × h (m) | △ | Klouby | Interakce |', '|---|---|---|---|---|---|---|');
  for (const p of k.prefabs) {
    const joints = (p.rig.joints || []).map((j) => `${j.id}: ${j.type === 'hinge' ? `${num(j.min)}° až ${num(j.max)}°` : `${num(j.min)} až ${num(j.max)} m`}`).join('; ');
    lines.push(`| \`${p.id}\` | ${p.title} | ${p.category} | ${dims(p)} | ${p.tris} | ${joints || '—'} | ${p.components?.interact?.kind || '—'} |`);
  }
  lines.push('', '## Meze kloubů: zdroj nebo úvaha', '', 'Žádná z mezí nebyla změřena na skutečném předmětu. Kde je uvedeno „úvaha“, jde o odhad z obecné znalosti předmětu.', '');
  lines.push('| Prefab | Kloub | Meze | Zdůvodnění |', '|---|---|---|---|');
  for (const p of k.prefabs) {
    for (const j of p.rig.joints || []) {
      const range = j.type === 'hinge' ? `${num(j.min)}° až ${num(j.max)}°` : `${num(j.min)} až ${num(j.max)} m`;
      lines.push(`| \`${p.id}\` | ${j.id} | ${range} | ${k.notes[p.id][j.id]} |`);
    }
  }
  return lines.join('\n') + '\n';
}
if (isDefault) await writeFile(path.join(here, 'KIT.md'), kitDoc(kit));

const tris = kit.prefabs.reduce((s, p) => s + p.tris, 0);
console.log(`${path.relative(root, outDir) || outDir}: ${kit.prefabs.length} prefabů (${tris} △), ${Object.keys(kit.materials.materials).length} materiálů`);
