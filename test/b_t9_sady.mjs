// B-T9: tematické sady xForge vedle kit_base (kit_lab, kit_it…; Ondřej 24. 11. 2026: „600 těles“, tematické balíky,
// do 1 000 △). Každá sada projde validátorem spojená s kit_base, make-pack.mjs dá bajtově totéž, co je v repu,
// prefaby mají jména a kategorie podle pravidel, rozumné rozměry, kolize a způsob umístění, klouby se zdůvodněním.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import { SURFACES, FREE_LICENSES } from '../src/xspace/index.js';
import { THEMES } from '../tools/forge/themes.mjs';
import { buildKit } from '../tools/forge/kit/index.mjs';
import { kitDoc } from '../tools/forge/doc.mjs';
import { boundsAt } from '../tools/forge/lib.mjs';
import { meshCorners } from '../tools/forge/mesh/registry.mjs';
import { makeChecker } from './b_lib/check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ok, finish } = makeChecker('B-T9 tematické sady');
const base = buildKit();
const baseIds = new Set(base.prefabs.map((p) => p.id));
const baseMats = new Set(Object.keys(base.materials.materials));
const golden = JSON.parse(readFileSync(path.join(root, 'packs/golden/pack.json'), 'utf8'));
const goldenPrefabs = new Set((golden.prefabs || []).map((f) => path.basename(f, '.json')));
let total = 0;
const seenIds = new Set();
const seenMats = new Set();

for (const [id, t] of Object.entries(THEMES)) {
  const dir = path.join(root, 'packs', id);
  const { pack, res } = await checkPackDir(dir);
  ok(res.ok && res.errors.length === 0 && res.warnings.length === 0, `${id}: balík spojený s kit_base projde validátorem bez chyb a varování`, [...res.errors, ...res.warnings].map((x) => `${x.code} ${x.path}`).slice(0, 4).join(' | ') || `${pack.prefabs.filter((p) => !p.from).length} prefabů`);

  // opakovatelnost: zápis do dočasného adresáře dá tytéž bajty
  const tmp = mkdtempSync(path.join(os.tmpdir(), `${id}-`));
  execFileSync(process.execPath, [path.join(root, 'tools/forge/make-pack.mjs'), id, tmp], { stdio: 'pipe' });
  const list = (d, rel = '') => readdirSync(path.join(d, rel), { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? list(d, path.join(rel, x.name)) : [path.join(rel, x.name)]));
  const a = list(dir).sort();
  const b = list(tmp).sort();
  ok(a.join('|') === b.join('|') && a.every((f) => readFileSync(path.join(dir, f)).equals(readFileSync(path.join(tmp, f)))), `${id}: make-pack.mjs dává bajtově totéž, co je v packs/${id}`, `${a.length} souborů`);
  const kit = t.build();
  ok(readFileSync(path.join(root, 'tools/forge', t.dir, 'SADA.md'), 'utf8') === kitDoc(kit, { id, cmd: `node tools/forge/make-pack.mjs ${id}`, src: `tools/forge/${t.dir}/*.mjs` }), `${id}: přehled tools/forge/${t.dir}/SADA.md odpovídá sadě`);

  const prefabs = kit.prefabs;
  total += prefabs.length;
  // materiály sady a všech balíků z jejího requires (kit_it stojí na kit_base i kit_lab)
  const mats = Object.assign({}, base.materials.materials, ...kit.manifest.requires.filter((r) => THEMES[r]).map((r) => THEMES[r].build().materials.materials), kit.materials.materials);
  const bad = [];
  for (const p of prefabs) {
    if (!/^[a-z]+(_[a-z0-9]+)*_\d\d$/.test(p.id) || !/^[a-z]+(\.[a-z]+)+$/.test(p.category)) bad.push(`${p.id}: jméno nebo kategorie`);
    if (baseIds.has(p.id) || goldenPrefabs.has(p.id) || seenIds.has(p.id)) bad.push(`${p.id}: id už je v kit_base, ve zlatém vzorku nebo v jiné sadě`);
    seenIds.add(p.id);
    const bb = boundsAt(p);
    // Ondřej 24. 11. 23:57: o 50 % víc trojúhelníků → prefab do 1 500 △; sestava několika předmětů (stojan s byretou
    // a baňkou, destilace) do 2 500 △, označená source.params.assembly
    const cap = p.source.params?.assembly ? 2500 : 1500;
    if (p.tris > cap) bad.push(`${p.id}: ${p.tris} △ (mez ${cap})`);
    // díl ze sítě: soubor je v assets a kolize ho obepínají (generátor .glb nečte, místo měří z kolizí)
    for (const part of p.parts.filter((x) => x.shape === 'mesh')) {
      if (!kit.manifest.assets.some((a) => a.path === part.mesh.split('#')[0])) bad.push(`${p.id}: soubor ${part.mesh} není v assets`);
      const c = meshCorners(part);
      if (!c) bad.push(`${p.id}: síť ${part.mesh} chybí v registru`);
      else if (c.some((q) => q.some((v, k) => v < bb.min[k] - 0.003 || v > bb.max[k] + 0.003))) bad.push(`${p.id}: síť ${part.mesh.split('#')[1]} přečnívá kolize o víc než 3 mm`);
    }
    if (!p.components?.place?.mount) bad.push(`${p.id}: chybí components.place (kam se staví)`);
    if (!(p.colliders || []).length) bad.push(`${p.id}: bez kolize`);
    if (p.source.tool !== 'xforge' || !FREE_LICENSES.includes(p.source.license)) bad.push(`${p.id}: původ`);
    for (const part of p.parts) if (!mats[part.mat]) bad.push(`${p.id}: materiál ${part.mat} neexistuje`);
    for (const j of p.rig.joints || []) if (!(kit.notes[p.id] || {})[j.id]) bad.push(`${p.id}.${j.id}: kloub bez zdůvodnění mezí`);
    const size = [0, 1, 2].map((k) => bb.max[k] - bb.min[k]);
    if (Math.max(...size) > 4 || Math.min(...size) < 0.002) bad.push(`${p.id}: rozměr ${size.map((x) => x.toFixed(3)).join(' × ')} m mimo 2 mm až 4 m`);
    const mount = p.components?.place?.mount;
    if ((mount === 'floor' || mount === 'top') && bb.min[1] < -0.001) bad.push(`${p.id}: díly pod počátkem (stojí na podlaze nebo na desce)`);
    if (mount === 'ceiling' && bb.max[1] > 0.001) bad.push(`${p.id}: díly nad počátkem (visí ze stropu)`);
    if (mount === 'wall' && bb.min[2] < -0.001) bad.push(`${p.id}: díly za počátkem (ve zdi)`);
  }
  ok(bad.length === 0, `${id}: jména, kategorie, do 1 500 △ (sestava 2 500), sítě v assets a v kolizích, umístění, kolize, materiály, klouby a rozměry`, bad.slice(0, 4).join(' | ') || `${prefabs.length} prefabů, ${prefabs.reduce((s, p) => s + p.tris, 0)} △, nejvíc ${Math.max(...prefabs.map((p) => p.tris))} △`);
  // součet sady je jen přehled (rozhoduje mez prefabu a měření scény); pojistka proti nechtěnému nárůstu: nejvýš 2×
  // stavu před přestavbou na hladké sítě (B04, 24. 11. 2026: kit_lab 93 580 △, kit_it 15 128 △)
  const BEFORE = { kit_lab: 93580, kit_it: 15128 };
  const sum = prefabs.reduce((s, p) => s + p.tris, 0);
  if (BEFORE[id]) ok(sum <= BEFORE[id] * 2, `${id}: trojúhelníků celkem nejvýš dvojnásobek stavu před přestavbou`, `${sum} △, ${((sum / BEFORE[id] - 1) * 100).toFixed(0)} % proti ${BEFORE[id]}; sítě ${(Object.values(kit.files).reduce((a, b) => a + b.length, 0) / 1024).toFixed(0)} kB`);
  const clash = Object.keys(kit.materials.materials).filter((m) => baseMats.has(m) || seenMats.has(m));
  for (const m of Object.keys(kit.materials.materials)) seenMats.add(m);
  ok(clash.length === 0 && Object.values(kit.materials.materials).every((m) => SURFACES.includes(m.surface)), `${id}: vlastní materiály se nepotkají s kit_base ani s jinou sadou a mají povrch pro zvuk`, clash.join(', ') || `${Object.keys(kit.materials.materials).length} materiálů`);
  const cats = [...new Set(prefabs.map((p) => p.category))];
  ok(cats.length >= 1, `${id}: kategorie`, cats.map((c) => `${c} ${prefabs.filter((p) => p.category === c).length}`).join(', '));
}

{
  const all = JSON.parse(readFileSync(path.join(root, 'packs/kit_all/pack.json'), 'utf8'));
  ok(all.requires.join(',') === ['kit_base', ...Object.keys(THEMES)].join(',') && all.prefabs.length === 0, 'balík kit_all pro galerii žádá kit_base a všechny tematické sady', all.requires.join(', '));
  ok(total + base.prefabs.length >= 100, 'všechny sady dohromady', `${base.prefabs.length} + ${total} = ${base.prefabs.length + total} prefabů (cíl Ondřeje asi 600)`);
}

process.exit(finish());
