// xForge: odvodí textury sady kit_base z originálů v příjmu xSearcheru (packs/_inbox) a zapíše zámek.
// Použití: node tools/forge/textures.mjs          (potřebuje příjem a balík sharp z devDependencies)
//
// Pro každý zdroj z TEXTURE_PLAN: barva (WebP, 512 px), případně šedá kresba (když odstín nesedí na barvu
// materiálu, HUE_LIMIT) a normálová mapa GL (WebP, 512 px) do packs/kit_base/textures/. Zámek
// tools/forge/kit/textures.lock.json nese otisky, průměrné barvy (lineárně, z hotového souboru) a původ.
// Materiály, pack.json.assets a galerie se pak skládají jen ze zámku (make-kit.mjs), příjem k tomu není potřeba.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { listInbox } from '../searcher/inbox.mjs';
import { MATERIALS } from './materials.mjs';
import { TEXTURE_PLAN, TEXTURE_SIZE, HUE_LIMIT, UV_FALLBACK } from './kit/textures.mjs';
import { fmtJson } from '../../src/gen/util.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const PACK = path.join(root, 'packs', 'kit_base');
const LOCK = path.join(here, 'kit', 'textures.lock.json');
const QUALITY = { albedo: 85, normal: 90 };

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const LIN = Float64Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const toSrgb8 = (l) => {
  const c = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
};
const r4 = (x) => Math.round(x * 1e4) / 1e4;

/** Průměrná barva lineárně, změřená na hotovém souboru (to, co dostane běh). */
async function meanLinear(buf) {
  const { data } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const s = [0, 0, 0];
  for (let i = 0; i < data.length; i += 3) for (let c = 0; c < 3; c++) s[c] += LIN[data[i + c]];
  return s.map((x) => r4(x / (data.length / 3)));
}

async function resized(file) {
  return sharp(file).resize(TEXTURE_SIZE, TEXTURE_SIZE, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha();
}

/** Šedá kresba: jas lineárně (Rec. 709), zpět do sRGB. */
async function grayOf(file) {
  const { data, info } = await (await resized(file)).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 3) {
    const y = toSrgb8(0.2126 * LIN[data[i]] + 0.7152 * LIN[data[i + 1]] + 0.0722 * LIN[data[i + 2]]);
    out[i] = out[i + 1] = out[i + 2] = y;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } });
}

const inbox = new Map(listInbox().map((x) => [`${x.record.source}:${x.record.id}`, x]));
const bySource = new Map();
for (const [mat, ref] of Object.entries(TEXTURE_PLAN)) {
  if (!MATERIALS[mat]) throw new Error(`${mat}: materiál v sadě není`);
  const got = inbox.get(ref);
  if (!got) throw new Error(`${ref}: v příjmu není (node tools/searcher/find.mjs --get ${ref})`);
  if (!got.ok) throw new Error(`${ref}: soubory v příjmu nesedí na záznam (${got.bad.join(', ')})`);
  if (got.record.license !== 'CC0-1.0') throw new Error(`${ref}: licence ${got.record.license}`);
  if (!bySource.has(ref)) bySource.set(ref, []);
  bySource.get(ref).push(mat);
}

const outDir = path.join(PACK, 'textures');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const files = {};
const materials = {};
const gainOf = (color, mean) => color.map((t, c) => t / Math.max(mean[c], 1e-4));
const hueOf = (g) => Math.max(...g) / Math.min(...g);

for (const [ref, mats] of [...bySource].sort(([a], [b]) => a.localeCompare(b))) {
  const { dir, record } = inbox.get(ref);
  const stem = record.id.toLowerCase();
  const orig = (map) => {
    const f = record.files.find((x) => x.map === map);
    if (!f) throw new Error(`${ref}: v příjmu chybí mapa ${map}`);
    return { file: path.join(dir, f.path), f };
  };
  const from = (f) => ({
    source: record.source,
    id: record.id,
    url: f.url ?? record.archive?.url ?? record.url,
    page: record.url,
    author: record.author,
    license: record.license,
    date: record.date,
    original: f.path,
    originalSha256: f.sha256,
  });
  // soubor se vyrobí v paměti a zapíše jen tehdy, když ho některý materiál použije
  const make = async (name, kind, img, quality, f) => {
    const buf = await img.webp({ quality, effort: 6 }).toBuffer();
    return { rel: `textures/${name}`, buf, entry: { kind, bytes: buf.length, sha256: sha256(buf), px: TEXTURE_SIZE, ...(kind !== 'normal' ? { mean: await meanLinear(buf) } : {}), from: from(f) } };
  };
  const keep = (t) => {
    if (!files[t.rel]) {
      fs.writeFileSync(path.join(PACK, t.rel), t.buf);
      files[t.rel] = t.entry;
    }
    return t.rel;
  };
  const a = orig('albedo');
  const n = orig('normal');
  const color = await make(`${stem}_albedo.${TEXTURE_SIZE}.webp`, 'albedo', await resized(a.file), QUALITY.albedo, a.f);
  const normal = keep(await make(`${stem}_normal.${TEXTURE_SIZE}.webp`, 'normal', await resized(n.file), QUALITY.normal, n.f));
  let gray = null;
  for (const mat of mats.sort()) {
    const target = MATERIALS[mat].color;
    const hue = hueOf(gainOf(target, color.entry.mean));
    let use = color;
    if (hue > HUE_LIMIT) use = gray ??= await make(`${stem}_albedo_gray.${TEXTURE_SIZE}.webp`, 'albedo-gray', await grayOf(a.file), QUALITY.albedo, a.f);
    materials[mat] = {
      source: ref,
      albedo: keep(use),
      normal,
      uvScale: record.size?.w ? Math.round(record.size.w * 100) / 100 : UV_FALLBACK,
      mode: use === color ? 'color' : 'gray',
      hue: r4(hue),
      gain: gainOf(target, use.entry.mean).map(r4),
    };
  }
}

const lock = {
  note: 'Vyrábí tools/forge/textures.mjs z příjmu xSearcheru; ručně neupravovat. mean = průměrná barva hotového souboru lineárně; gain = color materiálu / mean (zesílení, které galerie použije místo násobení barvou, návrh N-009).',
  size: TEXTURE_SIZE,
  hueLimit: HUE_LIMIT,
  files: Object.fromEntries(Object.entries(files).sort(([x], [y]) => x.localeCompare(y))),
  materials: Object.fromEntries(Object.entries(materials).sort(([x], [y]) => x.localeCompare(y))),
};
fs.writeFileSync(LOCK, fmtJson(lock) + '\n');

const total = Object.values(files).reduce((s, f) => s + f.bytes, 0);
for (const [m, v] of Object.entries(lock.materials)) console.log(`${m.padEnd(16)} ${v.mode.padEnd(5)} odstín ×${v.hue.toFixed(2)}  uvScale ${v.uvScale}  ← ${v.source}`);
console.log(`${Object.keys(files).length} souborů, ${(total / 1024).toFixed(1)} kB → packs/kit_base/textures; zámek ${path.relative(root, LOCK)}`);
