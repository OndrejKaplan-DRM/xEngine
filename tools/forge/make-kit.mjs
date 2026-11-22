// xForge: zapíše sadu kit_base jako balík xSpace. Dvě spuštění dají stejné bajty.
// Použití: node tools/forge/make-kit.mjs [výstupní adresář]   (výchozí packs/kit_base)
// Vedle balíku zapíše tools/forge/KIT.md: přehled prefabů a zdůvodnění mezí kloubů.

import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKit } from './kit/index.mjs';
import { fmtJson } from '../../src/gen/util.js';
import { kitDoc } from './doc.mjs';

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

if (isDefault) await writeFile(path.join(here, 'KIT.md'), kitDoc(kit));

const tris = kit.prefabs.reduce((s, p) => s + p.tris, 0);
console.log(`${path.relative(root, outDir) || outDir}: ${kit.prefabs.length} prefabů (${tris} △), ${Object.keys(kit.materials.materials).length} materiálů`);
