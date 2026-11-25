// xForge: zapíše sadu kit_base jako balík xSpace. Dvě spuštění dají stejné bajty.
// Použití: node tools/forge/make-kit.mjs [výstupní adresář]   (výchozí packs/kit_base)
// Vedle balíku zapíše tools/forge/KIT.md: přehled prefabů a zdůvodnění mezí kloubů.

import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKit, TEXTURES } from './kit/index.mjs';
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

// textury: odvozené soubory leží v packs/kit_base/textures (vyrábí je tools/forge/textures.mjs z příjmu xSearcheru);
// tady se jen ověří proti zámku a do jiného výstupu zkopírují
const texDir = path.join(root, 'packs/kit_base');
if (!isDefault) await rm(path.join(outDir, 'textures'), { recursive: true, force: true });
await mkdir(path.join(outDir, 'textures'), { recursive: true });
for (const [rel, f] of Object.entries(TEXTURES.files)) {
  const buf = await readFile(path.join(texDir, rel));
  if (buf.length !== f.bytes || createHash('sha256').update(buf).digest('hex') !== f.sha256) throw new Error(`${rel}: soubor nesedí na zámek textur (node tools/forge/textures.mjs)`);
  if (!isDefault) await writeFile(path.join(outDir, rel), buf);
}
if (isDefault) await writeFile(path.join(here, 'gallery', 'textures.js'), galleryTextures());

/** Modul galerie: import každé textury jako bajtů (esbuild with { type: 'bytes' }); jen pro sestavení v prohlížeči. */
function galleryTextures() {
  const files = Object.keys(TEXTURES.files);
  const lines = files.map((rel, i) => `import t${i} from '../../../packs/kit_base/${rel}' with { type: 'bytes' };`);
  const map = files.map((rel, i) => `  '${rel}': t${i},`);
  return `// Vyrábí tools/forge/make-kit.mjs ze zámku textur (tools/forge/kit/textures.lock.json); ručně neupravovat.\n${lines.join('\n')}\n\nexport const TEXTURE_BYTES = {\n${map.join('\n')}\n};\n`;
}

if (isDefault) await writeFile(path.join(here, 'KIT.md'), kitDoc(kit));

const tris = kit.prefabs.reduce((s, p) => s + p.tris, 0);
const texKb = Object.values(TEXTURES.files).reduce((s, f) => s + f.bytes, 0) / 1024;
console.log(`${path.relative(root, outDir) || outDir}: ${kit.prefabs.length} prefabů (${tris} △), ${Object.keys(kit.materials.materials).length} materiálů, ${Object.keys(TEXTURES.materials).length} s texturou (${Object.keys(TEXTURES.files).length} souborů, ${texKb.toFixed(1)} kB)`);
