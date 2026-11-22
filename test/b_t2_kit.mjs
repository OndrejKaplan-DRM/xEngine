// B-T2: sada kit_base v Node. Balík je platný a opakovatelný, každý pohyblivý prefab má kloub s mezemi
// a zdůvodněním, obal a počet trojúhelníků sedí na díly, rozměry odpovídají pravidlům obsahu ze zadání.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir, readPackDir } from '../tools/lib/read-pack.mjs';
import { FREE_LICENSES, SURFACES, rigMatrices } from '../src/xspace/index.js';
import { buildKit } from '../tools/forge/kit/index.mjs';
import { partTris, jointSamples, boundsAt } from '../tools/forge/lib.mjs';
import { kitDoc } from '../tools/forge/doc.mjs';
import { makeCatalog } from '../src/gen/index.js';
import { makeChecker } from './b_lib/check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT = path.join(root, 'packs/kit_base');
const { ok, finish } = makeChecker('B-T2 sada kit_base');

const { pack, res } = await checkPackDir(KIT);
const prefabs = pack.prefabs.map((p) => p.data);
const byId = new Map(prefabs.map((p) => [p.id, p]));
const kit = buildKit();
const catalog = makeCatalog(pack);
const joints = (p) => p.rig.joints || [];

ok(res.ok && res.errors.length === 0 && res.warnings.length === 0, 'balík projde validátorem bez chyb a bez varování', [...res.errors, ...res.warnings].map((x) => `${x.code} ${x.path}`).slice(0, 4).join(' | '));
ok(prefabs.length >= 30, 'sada má aspoň 30 prefabů', `${prefabs.length} prefabů, z toho ${prefabs.filter((p) => joints(p).length).length} s kloubem`);

// ---- opakovatelnost: generátor dá bajtově totéž, co je v repu
{
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'kit-'));
  execFileSync(process.execPath, [path.join(root, 'tools/forge/make-kit.mjs'), tmp], { stdio: 'pipe' });
  const list = (dir, rel = '') => readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? list(dir, path.join(rel, d.name)) : [path.join(rel, d.name)]));
  const a = list(KIT).sort();
  const b = list(tmp).sort();
  ok(a.join('|') === b.join('|') && a.every((f) => readFileSync(path.join(KIT, f)).equals(readFileSync(path.join(tmp, f)))), 'make-kit.mjs dává bajtově totéž, co je v packs/kit_base', `${a.length} souborů`);
  ok(readFileSync(path.join(root, 'tools/forge/KIT.md'), 'utf8') === kitDoc(kit), 'dokument tools/forge/KIT.md odpovídá sadě');
}

// ---- úplnost: co zadání B1.2 jmenuje, to v sadě je
const WANT = {
  'dveře otočné': 'door_wood_01',
  'dveře posuvné': 'door_sliding_01',
  'dveře dvoukřídlé (levé křídlo)': 'door_dleft_01',
  'dveře dvoukřídlé (pravé křídlo)': 'door_dright_01',
  okno: 'window_sash_01',
  tlačítko: 'button_round_01',
  vypínač: 'switch_rocker_01',
  páka: 'lever_knife_01',
  ventil: 'valve_gate_01',
  kohoutek: 'tap_wall_01',
  'zásuvková skříň': 'cabinet_file_01',
  'skříň s dvířky': 'cabinet_door_01',
  stůl: 'table_work_01',
  židle: 'chair_plain_01',
  regál: 'shelf_rack_01',
  lavice: 'bench_metal_01',
  'svítidlo stropní': 'lamp_pendant_01',
  'svítidlo nástěnné': 'lamp_wall_01',
  'svítidlo stolní': 'lamp_desk_01',
  'centrifuga s víkem': 'centrifuge_bench_01',
  'digestoř s výsuvným oknem': 'fumehood_01',
  'mikroskop se zaostřovacím kolečkem': 'microscope_01',
  lednice: 'fridge_lab_01',
  bedna: 'crate_plank_01',
  sud: 'barrel_steel_01',
  potrubí: 'pipe_straight_01',
  zábradlí: 'railing_steel_01',
  terminál: 'terminal_wall_01',
};
const missing = Object.entries(WANT).filter(([, id]) => !byId.has(id));
ok(missing.length === 0, 'sada obsahuje všechny druhy jmenované v zadání', missing.length ? missing.map(([n]) => n).join(', ') : `${Object.keys(WANT).length} druhů`);
const MOVING = ['door_wood_01', 'door_sliding_01', 'door_dleft_01', 'window_sash_01', 'button_round_01', 'switch_rocker_01', 'lever_knife_01', 'valve_gate_01', 'tap_wall_01', 'cabinet_file_01', 'cabinet_door_01', 'centrifuge_bench_01', 'fumehood_01', 'microscope_01', 'fridge_lab_01'];
ok(MOVING.every((id) => joints(byId.get(id)).length > 0), 'každý předmět, který se má hýbat, má kloub');

// ---- kostra před tvarem: meze, zdůvodnění, těleso
{
  const bad = [];
  let count = 0;
  for (const p of prefabs) {
    for (const j of joints(p)) {
      count++;
      const note = (kit.notes[p.id] || {})[j.id];
      if (!note || note.length < 25) bad.push(`${p.id}.${j.id}: chybí zdůvodnění mezí`);
      if (!(j.min < j.max) || j.rest < j.min || j.rest > j.max) bad.push(`${p.id}.${j.id}: meze nebo klid`);
      if (j.type === 'hinge' && j.max - j.min > 360 * 8) bad.push(`${p.id}.${j.id}: přes 8 otáček`);
      if (!j.drive) bad.push(`${p.id}.${j.id}: není řečeno, kdo kloubem hýbe`);
    }
    if (joints(p).length && p.components?.physics?.body !== 'kinematic') bad.push(`${p.id}: prefab s klouby má být kinematic`);
  }
  ok(bad.length === 0, 'každý kloub má meze, klidovou polohu uvnitř nich, pohon a zdůvodnění', bad.slice(0, 3).join(' | ') || `${count} kloubů`);
}

// ---- interakce podle tabulky v kontraktech
{
  const bad = [];
  for (const p of prefabs) {
    const it = p.components?.interact;
    if (!it) continue;
    const j = joints(p).find((x) => x.id === it.joint);
    const need = (cond, why) => {
      if (!cond) bad.push(`${p.id}: ${it.kind} ${why}`);
    };
    if (it.kind === 'button') need(j && j.type === 'slider' && j.spring > 0, 'chce posuvný kloub s pružinou');
    if (it.kind === 'switch') need(j && (j.detents || []).length === 2, 'chce kloub se dvěma zarážkami');
    if (it.kind === 'lever') need(j && (j.detents || []).length >= 2, 'chce kloub se zarážkami');
    if (it.kind === 'valve') need(j && j.type === 'hinge', 'chce otočný kloub');
    if (it.kind === 'drawer') need(j && j.type === 'slider', 'chce posuvný kloub');
    if (it.kind === 'door') need(Boolean(j), 'chce kloub');
    if (it.kind === 'grab') need(p.components.physics?.body === 'dynamic', 'chce dynamické těleso');
    for (const out of ['inputs', 'outputs']) if (!(p[out] || []).length && it.kind !== 'station' && it.kind !== 'grab') bad.push(`${p.id}: chybí ${out}`);
  }
  ok(bad.length === 0, 'interakce mají kloub, jaký jejich druh vyžaduje', bad.slice(0, 3).join(' | '));
}

// ---- čísla z dat: trojúhelníky a obal
{
  const tris = prefabs.filter((p) => p.tris !== p.parts.reduce((s, x) => s + partTris(x), 0));
  ok(tris.length === 0, 'pole tris odpovídá dílům (kvádr 12, válec 64)', tris.map((p) => p.id).join(' '));
  const heavy = prefabs.filter((p) => p.tris > (p.category.startsWith('device.') ? 2000 : 500));
  ok(heavy.length === 0, 'běžný prefab do 500 △, přístroj do 2 000 △', heavy.map((p) => `${p.id} ${p.tris}`).join(' ') || `nejvíc ${Math.max(...prefabs.map((p) => p.tris))} △ (${prefabs.find((p) => p.tris === Math.max(...prefabs.map((q) => q.tris))).id})`);
  const out = [];
  for (const p of prefabs) {
    for (const v of jointSamples(joints(p))) {
      const b = boundsAt(p, v);
      if ([0, 1, 2].some((k) => b.min[k] < p.bounds.min[k] - 1e-6 || b.max[k] > p.bounds.max[k] + 1e-6)) out.push(p.id);
    }
  }
  ok(out.length === 0, 'obal (bounds) obsahuje díly v klidu i v každé poloze kloubu', [...new Set(out)].join(' '));
  // každý kloub něčím hýbe: matice jeho uzlu se mezi krajními polohami liší a na uzlu (nebo pod ním) visí díl
  const idle = [];
  for (const p of prefabs) {
    const parent = new Map(p.rig.nodes.map((n) => [n.id, n.parent]));
    const under = (node, root) => {
      for (let cur = node; cur !== undefined; cur = parent.get(cur)) if (cur === root) return true;
      return false;
    };
    for (const j of joints(p)) {
      const a = rigMatrices(p, { [j.id]: j.min })[j.node];
      const b = rigMatrices(p, { [j.id]: j.type === 'hinge' ? Math.min(j.max, j.min + 90) : j.max })[j.node];
      if (!a.some((v, i) => Math.abs(v - b[i]) > 1e-6) || !p.parts.some((x) => under(x.node, j.node))) idle.push(`${p.id}.${j.id}`);
    }
  }
  ok(idle.length === 0, 'každý kloub hýbe aspoň jedním dílem', idle.join(' '));
}

// ---- rozměry z reality (pravidla obsahu v zadání, oddíl 4)
{
  const bad = [];
  const within = (id, what, v, lo, hi) => {
    if (v < lo - 1e-6 || v > hi + 1e-6) bad.push(`${id}: ${what} ${v.toFixed(3)} m mimo ${lo} až ${hi}`);
  };
  for (const p of prefabs.filter((x) => x.category === 'arch.door')) {
    const op = catalog.opening(p.id);
    const leaf = p.source.params.side ? op.w / 200 : op.w / 100; // dvoukřídlé: polovina otvoru
    within(p.id, 'šířka otvoru na křídlo', leaf, 0.8, 1.0);
    within(p.id, 'výška otvoru', op.h / 100, 2.0, 2.1);
    const handle = p.rig.nodes.find((n) => n.id === 'handle');
    if (handle) within(p.id, 'výška kliky', handle.pos[1], 1.0, 1.1);
  }
  for (const id of ['table_work_01', 'desk_office_01']) within(id, 'výška desky', byId.get(id).source.params.top, 0.72, 0.76);
  for (const id of ['chair_office_01', 'chair_plain_01', 'bench_metal_01']) within(id, 'výška sedáku', byId.get(id).source.params.seat, 0.44, 0.47);
  within('railing_steel_01', 'výška zábradlí', byId.get('railing_steel_01').source.params.height, 0.9, 1.1);
  within('barrel_steel_01', 'výška sudu 200 l', catalog.restBox('barrel_steel_01').max[1], 0.85, 0.9);
  ok(bad.length === 0, 'dveře, kliky, desky stolů, sedáky a zábradlí mají rozměry z reality', bad.slice(0, 3).join(' | '));
}

// ---- původ, licence, materiály, jména
{
  ok(pack.manifest.free === true && prefabs.every((p) => FREE_LICENSES.includes(p.source.license) && p.source.tool === 'xforge'), 'všechny prefaby jsou vlastní dílo (licence own, nástroj xforge)');
  const mats = pack.materials.materials;
  const used = new Set(prefabs.flatMap((p) => p.parts.map((x) => x.mat)));
  ok(Object.values(mats).every((m) => SURFACES.includes(m.surface)) && [...used].every((id) => mats[id]), 'každý použitý materiál existuje a má povrch pro zvuk kroků', `${used.size} použitých z ${Object.keys(mats).length}`);
  ok(prefabs.every((p) => /^[a-z]+(_[a-z0-9]+)*_\d\d$/.test(p.id) && /^[a-z]+(\.[a-z]+)+$/.test(p.category)), 'jména <co>_<varianta>_<nn> a kategorie s tečkami');
  const golden = await readPackDir(path.join(root, 'packs/golden'));
  const clashP = prefabs.filter((p) => golden.prefabs.some((g) => g.data.id === p.id)).map((p) => p.id);
  const clashM = Object.keys(mats).filter((id) => golden.materials.materials[id]);
  ok(clashP.length === 0 && clashM.length === 0, 'žádné id se neshoduje se zlatým vzorkem (balíky jdou spojit)', [...clashP, ...clashM].join(' '));
}

process.exit(finish());
