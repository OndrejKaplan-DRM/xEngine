// B-T2: sada kit_base v Node. Balík je platný a opakovatelný, každý pohyblivý prefab má kloub s mezemi
// a zdůvodněním, obal a počet trojúhelníků sedí na díly, rozměry odpovídají pravidlům obsahu ze zadání.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir, readPackDir } from '../tools/lib/read-pack.mjs';
import { FREE_LICENSES, SURFACES, rigMatrices } from '../src/xspace/index.js';
import { buildKit, TEXTURES } from '../tools/forge/kit/index.mjs';
import { MATERIALS } from '../tools/forge/materials.mjs';
import { TEXTURE_PLAN, TEXTURE_SIZE, HUE_LIMIT } from '../tools/forge/kit/textures.mjs';
import { webpSize } from './b_lib/webp.mjs';
import { createHash } from 'node:crypto';
import { partTris, jointSamples, boundsAt } from '../tools/forge/lib.mjs';
import { kitDoc } from '../tools/forge/doc.mjs';
import { makeCatalog } from '../src/gen/index.js';
import { makeChecker } from './b_lib/check.mjs';
import { doorLeaks } from './b_lib/door-cover.mjs';
import { doorPass } from './b_lib/door-pass.mjs';
import { playerOf, PROFILE_IDS } from './b_lib/player.mjs';

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
const movesOrAttached = (id) => joints(byId.get(id)).length > 0 || catalog.attachments(id).some((a) => byId.has(a.prefab) && joints(byId.get(a.prefab)).length > 0);
ok(MOVING.every(movesOrAttached), 'každý předmět, který se má hýbat, má kloub (sám, nebo v připojené zásuvce)');

// ---- připojené prefaby (zásuvky jako samostatné entity, Ondřej 24. 11. 2026; návrh N-010)
{
  const bad = [];
  let n = 0;
  const inBox = (q, b) => q.every((v, k) => v > b.min[k] && v < b.max[k]);
  for (const p of prefabs) {
    const list = catalog.attachments(p.id);
    if (!list.length) continue;
    const own = boundsAt(p);
    const boxes = [];
    for (const a of list) {
      n++;
      const c = byId.get(a.prefab);
      if (!c) {
        bad.push(`${p.id}: připojený prefab ${a.prefab} v sadě není`);
        continue;
      }
      if (!(c.components || {}).interact) bad.push(`${p.id}: ${a.prefab} nemá interakci`);
      if (catalog.attachments(a.prefab).length) bad.push(`${a.prefab}: připojený prefab má další připojené (jen jedna úroveň)`);
      const b = boundsAt(c);
      const w = { min: b.min.map((v, k) => v + a.pos[k]), max: b.max.map((v, k) => v + a.pos[k]) };
      if ([0, 1].some((k) => w.min[k] < own.min[k] - 0.005 || w.max[k] > own.max[k] + 0.005)) bad.push(`${p.id}: ${a.prefab} v ${a.pos.join(', ')} trčí z korpusu do strany nebo výšky`);
      if (w.max[2] > own.max[2] + 0.03) bad.push(`${p.id}: ${a.prefab} trčí z čela víc než 3 cm`);
      for (const o of boxes) if ([0, 1, 2].every((k) => w.min[k] < o.max[k] - 0.001 && o.min[k] < w.max[k] - 0.001)) bad.push(`${p.id}: zásuvky v ${a.pos.join(', ')} a vedle se v klidu překrývají`);
      boxes.push(w);
      // dutá zásuvka: vnitřek vany (mřížka bodů v 60 % výšky) je z velké části prázdný
      const inner = (c.parts || []).filter((q) => q.shape === 'box' && q.node === 'drawer');
      let empty = 0;
      let all = 0;
      for (let i = 1; i <= 4; i++) {
        for (let j = 1; j <= 6; j++) {
          const q = [b.min[0] + ((b.max[0] - b.min[0]) * i) / 5, b.min[1] + (b.max[1] - b.min[1]) * 0.6, b.min[2] + ((-0.03 - b.min[2]) * j) / 7];
          all++;
          if (!inner.some((x) => inBox(q, x))) empty++;
        }
      }
      if (empty < all * 0.6) bad.push(`${a.prefab}: zásuvka není dutá (${empty} z ${all} bodů vnitřku volných)`);
    }
  }
  ok(n >= 7 && bad.length === 0, 'připojené zásuvky existují, mají interakci, sedí do korpusu, nepřekrývají se a jsou duté', bad.slice(0, 3).join(' | ') || `${n} zásuvek u ${prefabs.filter((p) => catalog.attachments(p.id).length).length} korpusů`);
}

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
  // Dřív 500 △ (odhad z vlny 1). Od 24. 11. bohatší tvary (Ondřej 3 a); scénu hlídá součet levelu v b_t1 (do 300 tisíc △)
  const heavy = prefabs.filter((p) => p.tris > (p.category.startsWith('device.') ? 2000 : 1000));
  ok(heavy.length === 0, 'běžný prefab do 1 000 △, přístroj do 2 000 △', heavy.map((p) => `${p.id} ${p.tris}`).join(' ') || `nejvíc ${Math.max(...prefabs.map((p) => p.tris))} △ (${prefabs.find((p) => p.tris === Math.max(...prefabs.map((q) => q.tris))).id})`);
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

// ---- zavřené dveře zakrývají otvor (engine místnost za zavřenými dveřmi portálu nekreslí, N-107)
{
  const doors = prefabs.filter((p) => p.category === 'arch.door' && p.id !== 'gate_iron_01'); // mříž je průhledná z podstaty
  const single = doors.filter((p) => !p.source.params.side);
  const wings = doors.filter((p) => p.source.params.side);
  const res1 = single.map((p) => [p.id, doorLeaks([p], p.source.params.width, p.source.params.height)]);
  const leaky = res1.filter(([, r]) => r.leaks.length);
  ok(single.length >= 4 && leaky.length === 0, 'zavřené jednokřídlé a posuvné dveře zakryjí celý otvor (zkouška paprsky)', leaky.map(([id, r]) => `${id}: ${r.leaks.length} paprsků, ${r.text}`).join(' | ') || `${single.length} druhů dveří, ${res1.reduce((n, [, r]) => n + r.rays, 0)} paprsků, žádný neprošel`);
  const pair = doorLeaks(wings, wings[0].source.params.width, wings[0].source.params.height);
  ok(wings.length === 2 && pair.leaks.length === 0, 'dvoukřídlé dveře: obě křídla spolu zakryjí celý otvor', pair.text || `${pair.rays} paprsků`);
  const alone = wings.map((p) => doorLeaks([p], p.source.params.width, p.source.params.height).leaks.length);
  const flag = (p) => p.components.interact.seeThrough === true;
  ok(alone.every((n) => n > 0) && wings.every(flag) && !single.some(flag), 'dvoukřídlé dveře: jedno křídlo samo otvor nezakryje, proto má seeThrough; plné dveře ho nemají', alone.join(' a ') + ' paprsků projde jedním křídlem');
  const sillOk = doors.every((p) => p.parts.some((q) => q.node === 'frame' && q.shape === 'box' && q.min[1] === 0 && q.max[1] <= 0.015 && q.max[1] > 0.01));
  const noCol = doors.every((p) => (p.colliders || []).every((c) => !(c.node === 'frame' && c.max[1] <= 0.015)));
  ok(sillOk && noCol, 'prahová lišta je nejvýš 15 mm vysoká a nemá kolizi (postava ji přejde)');
}

// ---- otevřenými dveřmi projde hráč (kapsle s odstupem kontroléru; kruh v půdorysu, mřížka 1 cm)
{
  const players = PROFILE_IDS.map(playerOf);
  const need = Math.max(...players.map((p) => p.width));
  const body = { step: Math.min(...players.map((p) => p.step)), height: Math.max(...players.map((p) => p.height)) };
  const doors = prefabs.filter((p) => p.category === 'arch.door');
  const single = doors.filter((p) => !p.source.params.side);
  const wings = doors.filter((p) => p.source.params.side);
  const got = single.map((p) => [p.id, doorPass([p], p.source.params.width, 0.2, body).clear]);
  got.push(['door_dleft_01 + door_dright_01', doorPass(wings, wings[0].source.params.width, 0.2, body).clear]);
  const tight = got.filter(([, c]) => c < need + 0.05);
  ok(tight.length === 0, `otevřenými dveřmi projde hráč široký ${need.toFixed(2)} m s rezervou aspoň 5 cm`, got.map(([id, c]) => `${id} ${c.toFixed(2)} m`).join(', '));
  const rough = single.map((p) => [p.id, catalog.clearWidth(p.id) / 100, got.find(([id]) => id === p.id)[1]]);
  const off = rough.filter(([, a, b]) => Math.abs(a - b) > 0.03);
  ok(off.length === 0, 'světlost dveří, kterou si počítá generátor z obalů, sedí na měření kruhem do 3 cm', off.map(([id, a, b]) => `${id}: ${a.toFixed(2)} × ${b.toFixed(2)} m`).join(' | '));
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

// ---- textury (B2.4): odvozené z příjmu xSearcheru, 512 px pro stupeň low, otisky a původ v zámku
{
  const mats = pack.materials.materials;
  const assets = new Map((pack.manifest.assets || []).map((a) => [a.path, a]));
  const lockFiles = Object.entries(TEXTURES.files);
  const textured = Object.keys(TEXTURES.materials);
  ok(textured.length >= 15 && textured.join(',') === Object.keys(TEXTURE_PLAN).sort().join(','), 'materiály s texturou odpovídají plánu', `${textured.length} materiálů`);
  const sizes = lockFiles.map(([rel]) => [rel, webpSize(readFileSync(path.join(KIT, rel)))]);
  const big = sizes.filter(([, d]) => !d || d.w > TEXTURE_SIZE || d.h > TEXTURE_SIZE);
  ok(big.length === 0 && TEXTURE_SIZE <= 512, `každá textura je WebP nejvýš ${TEXTURE_SIZE} × ${TEXTURE_SIZE} px (stupeň low)`, big.map(([r, d]) => `${r} ${d ? d.w + '×' + d.h : 'není WebP'}`).join(', ') || `${sizes.length} souborů`);
  const bad = lockFiles.filter(([rel, f]) => {
    const buf = readFileSync(path.join(KIT, rel));
    const a = assets.get(rel);
    return !a || a.bytes !== buf.length || a.sha256 !== f.sha256 || createHash('sha256').update(buf).digest('hex') !== f.sha256;
  });
  ok(bad.length === 0 && assets.size === lockFiles.length, 'pack.json.assets, zámek a soubory na disku mají stejné velikosti a otisky', bad.map(([r]) => r).join(', '));
  const lic = [...assets.values()].filter((a) => a.license !== 'CC0-1.0' || !a.source.startsWith('https://') || !a.author);
  ok(pack.manifest.free === true && lic.length === 0, 'každá textura má licenci CC0-1.0, autora a adresu originálu; balík je free', lic.map((a) => a.path).join(', '));
  const used = new Set(textured.flatMap((m) => [TEXTURES.materials[m].albedo, TEXTURES.materials[m].normal]));
  ok(lockFiles.every(([rel]) => used.has(rel)), 'v balíku není textura, kterou žádný materiál nepoužívá');
  const wrong = textured.filter((m) => {
    const t = TEXTURES.materials[m];
    const x = mats[m];
    return x.albedo !== t.albedo || x.normal !== t.normal || x.uvScale !== t.uvScale || String(x.color) !== String(MATERIALS[m].color) || x.rough !== MATERIALS[m].rough;
  });
  ok(wrong.length === 0, 'materiál s texturou má albedo, normal a uvScale ze zámku; barva a drsnost zůstaly', wrong.join(', '));
  const plain = Object.keys(MATERIALS).filter((m) => !TEXTURES.materials[m]);
  ok(plain.every((m) => JSON.stringify(mats[m]) === JSON.stringify(MATERIALS[m])), 'materiály bez textury jsou beze změny', `${plain.length} materiálů`);
  const modes = textured.filter((m) => {
    const t = TEXTURES.materials[m];
    const f = TEXTURES.files[t.albedo];
    const g = MATERIALS[m].color.map((c, i) => c / f.mean[i]);
    return (t.mode === 'gray') !== (f.kind === 'albedo-gray') || Math.abs(Math.max(...g) / Math.min(...g) - (t.mode === 'gray' ? Math.max(...g) / Math.min(...g) : t.hue)) > 1e-3 || (t.mode === 'color' && t.hue > HUE_LIMIT) || (t.mode === 'gray' && t.hue <= HUE_LIMIT) || g.some((x, i) => Math.abs(x - t.gain[i]) > 1e-3 * x);
  });
  ok(modes.length === 0, `šedá kresba právě tam, kde odstín nesedí víc než ×${HUE_LIMIT}; zesílení = barva / průměr textury`, `${textured.filter((m) => TEXTURES.materials[m].mode === 'gray').join(', ')} v šedi`);
  const gal = readFileSync(path.join(root, 'tools/forge/gallery/textures.js'), 'utf8');
  ok(lockFiles.every(([rel]) => gal.includes(`'../../../packs/kit_base/${rel}' with { type: 'bytes' }`)) && (gal.match(/^import /gm) || []).length === lockFiles.length, 'modul textur galerie odpovídá zámku');
  console.log(`      textury: ${lockFiles.length} souborů, ${(lockFiles.reduce((s, [, f]) => s + f.bytes, 0) / 1024).toFixed(1)} kB`);
}

process.exit(finish());
