// T1: xSpace v Node. Zlatý vzorek je platný a opakovatelný, validátor chytá chyby (mutace),
// geometrie kvádrů a klínů má normály ven a level má to, co potřebují testy pohybu.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackDir, checkPackDir } from '../tools/lib/read-pack.mjs';
import { mergePacks } from '../src/xspace/index.js';
import { validatePack, brushMesh, brushCollider, brushCorners, brushTris, wedgeRunRise, FORMATS, COMPONENTS, XSPACE_VERSION, entityMatrix, rigMatrices, jointRest, mat4Mul, mat4Point } from '../src/xspace/index.js';
import * as X from '../src/xspace/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN = path.join(root, 'packs/golden');

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---- zlatý vzorek
const { pack, res } = await checkPackDir(GOLDEN);
ok(res.ok && res.errors.length === 0, 'zlatý vzorek nemá chyby', res.errors.map((e) => e.code).join(' '));
ok(res.warnings.length === 0, 'zlatý vzorek nemá varování', res.warnings.map((e) => e.code).join(' '));
ok(res.stats.xspace === XSPACE_VERSION && res.stats.levels.length === 1, 'statistika zná verzi formátu a level');

{
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'golden-'));
  execFileSync(process.execPath, [path.join(root, 'tools/golden/make.mjs'), tmp], { stdio: 'pipe' });
  const list = (dir, rel = '') => readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? list(dir, path.join(rel, d.name)) : [path.join(rel, d.name)]));
  const a = list(GOLDEN).sort();
  const b = list(tmp).sort();
  const same = a.join('|') === b.join('|') && a.every((f) => readFileSync(path.join(GOLDEN, f)).equals(readFileSync(path.join(tmp, f))));
  ok(same, 'generátor zlatého vzorku dává bajtově totéž, co je v repu', `${a.length} souborů`);
}

// ---- díly prefabu (N-101): síť, počet trojúhelníků a kolizní tvar z jednoho místa
{
  const box = { shape: 'box', min: [-0.2, 0, -0.1], max: [0.4, 1, 0.3] };
  const bm = X.partMesh(box);
  ok(bm.indices.length / 3 === 12 && X.partTris(box) === 12, 'díl box má 12 trojúhelníků', `${bm.indices.length / 3}`);
  let cylOk = true;
  const seen = [];
  for (const axis of ['x', 'y', 'z']) {
    const part = { shape: 'cyl', radius: 0.3, height: 1.2, axis, center: [1, 2, 3] };
    const m = X.partMesh(part);
    const k = 'xyz'.indexOf(axis);
    const ext = [0, 1, 2].map((i) => {
      const v = m.positions.filter((_, j) => j % 3 === i);
      return Math.max(...v) - Math.min(...v);
    });
    const mid = [0, 1, 2].map((i) => {
      const v = m.positions.filter((_, j) => j % 3 === i);
      return (Math.max(...v) + Math.min(...v)) / 2;
    });
    let unit = true;
    for (let j = 0; j < m.normals.length; j += 3) if (Math.abs(Math.hypot(m.normals[j], m.normals[j + 1], m.normals[j + 2]) - 1) > 1e-9) unit = false;
    const good =
      m.indices.length / 3 === 4 * X.CYL_SEGMENTS &&
      X.partTris(part) === 4 * X.CYL_SEGMENTS &&
      Math.abs(ext[k] - 1.2) < 1e-9 &&
      [0, 1, 2].every((i) => i === k || Math.abs(ext[i] - 0.6) < 1e-9) &&
      mid.every((v, i) => Math.abs(v - part.center[i]) < 1e-9) &&
      unit &&
      Math.max(...m.indices) < m.positions.length / 3 &&
      m.uvs.length / 2 === m.positions.length / 3;
    if (!good) cylOk = false;
    seen.push(`${axis}: ${m.indices.length / 3} △, rozměr ${ext.map((v) => v.toFixed(2)).join(' × ')}`);
  }
  ok(cylOk, 'díl cyl: 4 × CYL_SEGMENTS trojúhelníků, délka po ose z dat, střed v center, jednotkové normály', seen.join('; '));
  ok(X.partMesh({ shape: 'mesh', file: 'x.glb' }) === null && X.partTris({ shape: 'mesh' }) === null, 'díl ze souboru (mesh) nemá síť ani počet z dat');
  const bad = pack.prefabs.filter((pf) => pf.data.parts.every((x) => X.partTris(x) !== null) && pf.data.parts.reduce((n, x) => n + X.partTris(x), 0) !== pf.data.tris);
  ok(bad.length === 0, 'pole tris každého prefabu zlatého vzorku = součet partTris jeho dílů', bad.length ? bad.map((pf) => pf.data.id).join(' ') : `${pack.prefabs.length} prefabů`);
  const cb = X.partCollider({ shape: 'box', min: [0, 0, 0], max: [2, 4, 6] });
  const cc = X.partCollider({ shape: 'cyl', radius: 0.5, height: 2, center: [1, 1, 1] });
  const cs = X.partCollider({ shape: 'ball', radius: 0.25 });
  ok(
    cb.shape.type === 'box' && cb.shape.half.join() === '1,2,3' && cb.center.join() === '1,2,3' && cc.shape.type === 'cyl' && cc.shape.axis === 'y' && cc.center.join() === '1,1,1' && cs.shape.type === 'ball' && cs.center.join() === '0,0,0' && X.partCollider({ shape: 'hull', points: [] }) === null,
    'partCollider: kvádr (půlrozměry a střed), válec (výchozí osa y), koule; hull vrací null',
  );
}

// ---- postava (N-008, D-040): jedno místo pro rozměry
ok(
  X.BODY.radius === 0.35 && X.BODY.height === 1.8 && Math.abs(X.BODY.stepHeight - 0.4572) < 1e-9 && X.CHARACTER_SKIN === 0.02 && Math.abs(X.bodyWidth() - 0.74) < 1e-9 && Object.isFrozen(X.BODY),
  'postava v základu: poloměr 0,35 m, výška 1,8 m, schod 0,4572 m, odstup 0,02 m, průchod 0,74 m',
);

// ---- vzorky světla levelu (D-041): kvádry, potom pevné díly prefabů
{
  const lvl = pack.levels[0].data;
  const pf = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
  const mats = pack.materials?.materials || null;
  const s = X.levelSamples(lvl, pf, mats);
  const lm = X.levelLightMeshes(lvl.brushes, mats);
  const sameBrushes = lm.every((m, i) => (m === null ? s.brushes[i] === null : m.positions.join() === s.brushes[i].positions.join()));
  const sum = [...s.brushCounts, ...s.entityCounts].reduce((a, [, n]) => a + n, 0);
  ok(sameBrushes && sum === s.count && s.brushCounts.length === lvl.brushes.length && s.entityCounts.length === lvl.entities.length, 'levelSamples: nejdřív kvádry z levelLightMeshes, potom entity v pořadí levelu; počty sedí', `${s.count} vzorků`);
  const cnt = Object.fromEntries(s.entityCounts);
  ok(cnt.e_crate_s1 === 0 && cnt.e_medkit === 0, 'bedna (dynamické těleso) a sebratelný předmět vzorky nemají');
  let movingOut = true;
  for (const p of pf.values()) {
    const mv = X.movingNodes(p);
    if (X.staticPartIndices(p).some((i) => mv.has(p.parts[i].node))) movingOut = false;
  }
  ok(movingOut && cnt.e_door_start === 0 && cnt.e_door_lab === 0 && cnt.e_desk > 0, 'díly na uzlech s kloubem (a pod nimi) do vzorků nepatří; křídla dveří ne, stůl s terminálem ano');
  let inside = true;
  let unit = true;
  lvl.entities.forEach((e, i) => {
    const m = s.entities[i];
    if (!m) return;
    const b = pf.get(e.prefab).bounds;
    const em = X.entityMatrix(e);
    const corners = [];
    for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) corners.push(X.mat4Point(em, [x, y, z]));
    const lo = [0, 1, 2].map((k) => Math.min(...corners.map((c) => c[k])) - 1e-6);
    const hi = [0, 1, 2].map((k) => Math.max(...corners.map((c) => c[k])) + 1e-6);
    for (let v = 0; v < m.positions.length / 3; v++) {
      for (let k = 0; k < 3; k++) if (m.positions[v * 3 + k] < lo[k] || m.positions[v * 3 + k] > hi[k]) inside = false;
      if (Math.abs(Math.hypot(m.normals[v * 3], m.normals[v * 3 + 1], m.normals[v * 3 + 2]) - 1) > 1e-6) unit = false;
    }
  });
  ok(inside && unit, 'vrcholy pevných dílů leží ve světovém obalu prefabu entity, normály mají délku 1 (natočení YXZ)');
  const again = X.levelSamples(lvl, Object.fromEntries(pf), mats);
  ok(again.count === s.count && again.entities.every((m, i) => (m ? m.positions.join() === s.entities[i].positions.join() : !s.entities[i])), 'levelSamples je opakovatelný a bere prefaby z Map i z objektu');
}

// ---- zapečené světlo (D-044): čtení souboru, brány a otevření dveří
{
  const enc = (header, parts) => {
    let json = JSON.stringify(header);
    while ((json.length + 8) % 4) json += ' ';
    const body = Buffer.concat(parts.map((t) => Buffer.from(t.buffer, t.byteOffset, t.byteLength)));
    const out = Buffer.alloc(8 + json.length + body.length);
    out.write('XLV1', 0, 'latin1');
    out.writeUInt32LE(json.length, 4);
    out.write(json, 8, 'utf8');
    body.copy(out, 8 + json.length);
    return out;
  };
  const header = {
    format: 'xspace-light', version: 1, samples: 3,
    layers: [
      { id: 'l1', kind: 'light', channels: 1, encoding: 'sparse', count: 2, offset: 0, gates: [{ gate: ['e_door'], count: 1, offset: 16 }] },
      { id: 'indirect', kind: 'indirect', channels: 3, encoding: 'dense', count: 3, offset: 24, weight: 0.5 },
      { id: 'ao', kind: 'ao', channels: 1, encoding: 'dense', count: 3, offset: 60 },
    ],
  };
  const file = enc(header, [new Uint32Array([0, 2]), new Float32Array([1, 2]), new Uint32Array([1]), new Float32Array([4]), new Float32Array([0, 0, 0, 0.2, 0.2, 0.2, 0, 0, 0]), new Float32Array([1, 0.5, 1])]);
  const d = X.decodeBake(file);
  const d2 = X.decodeBake(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
  ok(d.header.samples === 3 && [...d.layers[0].data].join() === '1,0,2' && d.layers[0].gates[0].gate[0] === 'e_door' && d2.layers[2].data[1] === 0.5, 'decodeBake: hustá i řídká vrstva, úsek s bránou; čte Buffer i ArrayBuffer');
  const lights = new Map([['l1', { color: [1, 1, 1], base: true }]]);
  const shut = X.composeColors(d, lights, [0.1, 0.1, 0.1], {}, {});
  const open = X.composeColors(d, lights, [0.1, 0.1, 0.1], {}, { e_door: 1 });
  const half = X.composeColors(d, lights, [0.1, 0.1, 0.1], {}, { e_door: 0.5 });
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  ok(near(shut[3], 0.05 + 0.1) && near(open[3], 0.05 + 4 + 0.1) && near(half[3], 0.05 + 2 + 0.1) && near(shut[0], 0.1 + 1), 'composeColors: okolí × ao + světlo + úsek × otevření dveří + odraz × váha', `${shut[3].toFixed(3)} / ${half[3].toFixed(3)} / ${open[3].toFixed(3)}`);
  ok(X.gateLevel(['a', 'b'], { a: 1, b: 0.5 }) === 0.5 && X.gateLevel(['a'], {}) === 0, 'gateLevel: součin otevření, dveře bez údaje jsou zavřené');
  const one = { min: 0, max: 105 };
  const both = { min: -105, max: 105, rest: 0 };
  ok(X.doorOpenness(one, 105) === 1 && X.doorOpenness(one, 52.5) === 0.5 && X.doorOpenness(both, -105) === 1 && X.doorOpenness(both, 52.5) === 0.5 && X.doorOpenness(both, 0) === 0 && X.doorOpenness({ min: 0, max: 0.98 }, 0.49) === 0.5, 'doorOpenness: jednostranné i oboustranné dveře (N-109), posuvné');
  let bad = false;
  try { X.decodeBake(Buffer.from('XYZW0000')); } catch { bad = true; }
  ok(bad, 'decodeBake odmítne soubor bez značky XLV1');
}

// ---- mutace: každá musí vyvolat právě svůj kód nálezu
const L = (p) => p.levels[0].data;
const P = (p, id) => p.prefabs.find((x) => x.data.id === id).data;
const MUTATIONS = [
  ['ref.material', 'kvádr s neexistujícím materiálem', (p) => (L(p).brushes[0].mat = 'neni')],
  ['ref.material', 'díl prefabu s neexistujícím materiálem', (p) => (P(p, 'crate_wood_01').parts[0].mat = 'neni')],
  ['ref.prefab', 'entita s neexistujícím prefabem', (p) => (L(p).entities[2].prefab = 'neni_01')],
  ['ref.cell', 'kvádr v neexistující buňce', (p) => (L(p).brushes[3].cell = 'c_neni')],
  ['ref.entity', 'portál s neexistujícími dveřmi', (p) => (L(p).portals[0].door = 'e_neni')],
  ['portal.door', 'portál, jehož „dveře“ nejsou dveře', (p) => (L(p).portals[0].door = 'e_lamp_start')],
  ['io.target', 'spojení na neexistující entitu', (p) => (L(p).entities[1].io[0].target = 'e_neni')],
  ['io.input', 'spojení na vstup, který cíl nemá', (p) => (L(p).entities[1].io[0].input = 'explode')],
  ['io.output', 'spojení z výstupu, který zdroj nemá', (p) => (L(p).entities[1].io[0].on = 'kliknuto')],
  ['io.input', 'vestavěný cíl bez takového vstupu', (p) => (L(p).triggers[0].io[0].input = 'explode')],
  ['io.target', 'neznámý vestavěný cíl', (p) => (L(p).triggers[0].io[0].target = '@svet')],
  ['portal.same', 'portál z buňky do téže buňky', (p) => (L(p).portals[1].b = L(p).portals[1].a)],
  ['portal.between', 'portál mimo zeď mezi buňkami', (p) => L(p).portals[0].quad.forEach((q) => (q[2] = 3))],
  ['portal.plane', 'portál, jehož rohy neleží v rovině', (p) => (L(p).portals[0].quad[2][2] = -0.5)],
  ['portal.extent', 'portál širší než buňka', (p) => (L(p).portals[0].quad[1][0] = L(p).portals[0].quad[2][0] = 5.5)],
  ['portal.narrow', 'průchozí portál užší než postava (N-008)', (p) => (L(p).portals[0].quad[1][0] = L(p).portals[0].quad[2][0] = 3.2)],
  ['level.cellOverlap', 'překryv buněk', (p) => (L(p).cells[1].bounds.max[2] = 1)],
  ['level.unreachable', 'buňka bez portálu', (p) => L(p).portals.splice(1, 1)],
  ['level.dupe', 'dvě entity se stejným id', (p) => (L(p).entities[5].id = L(p).entities[4].id)],
  ['spawn.player', 'dvě výchozí místa hráče', (p) => (L(p).spawns[1].kind = 'player')],
  ['spawn.outside', 'výchozí místo ve zdi', (p) => (L(p).spawns[0].pos = [50, 0, 50])],
  ['geom.box', 'kvádr s min větším než max', (p) => (L(p).brushes[0].max[1] = -5)],
  ['shape.required', 'klín bez směru stoupání', (p) => delete L(p).brushes.find((b) => b.shape === 'wedge').rise],
  ['shape.required', 'entita bez polohy', (p) => delete L(p).entities[0].pos],
  ['shape.enum', 'neznámý profil levelu', (p) => (L(p).profile = 'turbo')],
  ['shape.const', 'cizí verze formátu', (p) => (L(p).xspace = 2)],
  ['shape.id', 'id s velkými písmeny', (p) => (L(p).cells[0].id = 'C_Start')],
  ['shape.type', 'poloha jako řetězec', (p) => (L(p).entities[0].pos = '3 0 0')],
  ['shape.range', 'barva mimo rozsah', (p) => (p.materials.materials.steel.color = [2, 0, 0])],
  ['shape.unknown', 'překlep v názvu pole (varování)', (p) => (L(p).entities[0].postion = [0, 0, 0])],
  ['rig.limits', 'kloub s min ≥ max', (p) => { const j = P(p, 'door_hinged_01').rig.joints[0]; j.min = j.max; }],
  ['rig.limits', 'zarážka mimo meze', (p) => (P(p, 'lever_wall_01').rig.joints[0].detents = [-40, 90])],
  ['rig.rootJoint', 'kloub na kořeni', (p) => (P(p, 'door_hinged_01').rig.joints[0].node = 'frame')],
  ['rig.cycle', 'kruh v kostře', (p) => (P(p, 'door_hinged_01').rig.nodes = [{ id: 'frame' }, { id: 'a', parent: 'b' }, { id: 'b', parent: 'a' }, { id: 'leaf', parent: 'frame' }])],
  ['rig.root', 'kostra se dvěma kořeny', (p) => P(p, 'crate_wood_01').rig.nodes.push({ id: 'druhy' })],
  ['rig.axis', 'osa kloubu není jednotková', (p) => (P(p, 'door_hinged_01').rig.joints[0].axis = [0, 2, 0])],
  ['rig.dupeJoint', 'dva klouby na jednom uzlu', (p) => P(p, 'door_hinged_01').rig.joints.push({ ...P(p, 'door_hinged_01').rig.joints[0], id: 'druhy' })],
  ['ref.node', 'díl na neexistujícím uzlu', (p) => (P(p, 'door_hinged_01').parts[0].node = 'neni')],
  ['ref.joint', 'interakce s neexistujícím kloubem', (p) => (P(p, 'door_hinged_01').components.interact.joint = 'neni')],
  ['interact.joint', 'dveře bez kloubu', (p) => delete P(p, 'door_hinged_01').components.interact.joint],
  ['interact.station', 'terminál bez ukotvení kamery', (p) => delete P(p, 'desk_terminal_01').components.interact.station],
  ['interact.screen', 'terminál bez obrazovky', (p) => delete P(p, 'desk_terminal_01').components.screen],
  ['interact.pickup', 'sebratelná věc bez obsahu', (p) => delete P(p, 'pickup_medkit_01').components.pickup],
  ['phys.mass', 'dynamické těleso bez hmotnosti', (p) => delete P(p, 'crate_wood_01').components.physics.mass],
  ['phys.noCollider', 'těleso bez kolize', (p) => delete P(p, 'crate_wood_01').colliders],
  ['phys.staticJoint', 'pohyblivý předmět jako static (varování)', (p) => (P(p, 'door_hinged_01').components.physics.body = 'static')],
  ['ref.asset', 'síť, která není v manifestu', (p) => (P(p, 'crate_wood_01').parts[0] = { node: 'body', shape: 'mesh', mesh: 'assets/crate.glb' })],
  ['license.notFree', 'cizí licence ve volném balíku', (p) => (P(p, 'crate_wood_01').source.license = 'CC-BY-4.0')],
  ['pack.version', 'verze balíku ve špatném tvaru', (p) => (p.manifest.version = 'první')],
  ['pack.dupePrefab', 'prefab v balíku dvakrát', (p) => p.prefabs.push(clone(p.prefabs[0]))],
  ['mat.emissive', 'svítící materiál bez barvy svitu', (p) => delete p.materials.materials.light_panel.emissive],
  ['brush.overlap', 'dva kvádry přes sebe (varování)', (p) => L(p).brushes.push({ ...clone(L(p).brushes[0]), id: 'b_dupl_999' })],
  ['brush.faces', 'neznámá stěna v materiálech po stěnách', (p) => (L(p).brushes[0].faces = { nahore: 'steel' })],
  ['entity.outside', 'entita daleko od své buňky (varování)', (p) => (L(p).entities[2].pos = [30, 1, 30])],
  ['level.unreachable', 'buňka spojená jen portálem pro pohled (passable: false)', (p) => (L(p).portals[L(p).portals.length - 1].passable = false)],
  ['mat.alphaBoth', 'průhlednost dvěma způsoby naráz (varování)', (p) => Object.assign(Object.values(p.materials.materials)[0], { opacity: 0.5, alphaTest: 0.5 })],
  ['place.opening', 'umístění do otvoru bez rozměru otvoru', (p) => (P(p, 'door_hinged_01').components.place = { mount: 'opening' })],
  ['place.height', 'nástěnný prefab bez výšky', (p) => (P(p, 'switch_wall_01').components.place = { mount: 'wall' })],
  ['interact.seeThrough', 'průhlednost pro pohled u něčeho, co nejsou dveře (varování)', (p) => (P(p, 'switch_wall_01').components.interact.seeThrough = true)],
];
for (const [code, name, mutate] of MUTATIONS) {
  const m = clone(pack);
  mutate(m);
  const r = validatePack(m);
  const found = [...r.errors, ...r.warnings].some((x) => x.code === code);
  ok(found, `validátor chytí: ${name}`, found ? code : `čekáno ${code}, nalezeno: ${[...r.errors, ...r.warnings].map((x) => x.code).join(' ') || 'nic'}`);
}
ok(new Set(MUTATIONS.map((m) => m[0])).size >= 40, 'mutace pokrývají aspoň 40 různých kódů nálezů', String(new Set(MUTATIONS.map((m) => m[0])).size));

// ---- soubory na disku: poškozený JSON a chybějící soubor se hlásí, nepadá
{
  const broken = await readPackDir(path.join(root, 'test'));
  ok(broken.manifest === null && broken.loadErrors.length === 1, 'adresář bez pack.json vrátí chybu načtení, ne výjimku');
}

// ---- balík, který stojí na jiném balíku (requires)
{
  const golden = await readPackDir(GOLDEN);
  const child = {
    manifest: { xspace: 1, kind: 'pack', id: 'gen_test', title: 'Zkušební level nad zlatým vzorkem', version: '0.1.0', free: true, requires: ['golden'], levels: ['levels/a.json'] },
    materials: null,
    prefabs: [],
    levels: [{ file: 'levels/a.json', data: { ...clone(L(golden)), id: 'a' } }],
    loadErrors: [],
  };
  const alone = validatePack(child);
  ok(alone.ok && alone.warnings.some((w) => w.code === 'ref.prefabExternal') && alone.warnings.some((w) => w.code === 'ref.materialExternal'), 'balík bez načtených závislostí: cizí odkazy jsou varování, ne chyby');
  const merged = mergePacks(child, [golden]);
  const full = validatePack(merged);
  ok(full.ok && full.warnings.length === 0, 'balík spojený se závislostí je bez nálezů', [...full.errors, ...full.warnings].map((x) => x.code).join(' '));
  ok(full.stats.prefabs === 12 && full.stats.requires.join() === 'golden', 'spojený balík vidí prefaby závislosti');
  const missing = validatePack(mergePacks(child, []));
  ok(missing.errors.some((e) => e.code === 'pack.missingDep') && missing.errors.some((e) => e.code === 'ref.prefab'), 'chybějící závislost je chyba a odkazy do ní také');
  const clash = clone(child);
  clash.materials = { xspace: 1, kind: 'materials', materials: { steel: clone(golden.materials.materials.steel) } };
  ok(validatePack(mergePacks(clash, [golden])).errors.some((e) => e.code === 'pack.dupeMaterial'), 'stejné id materiálu ve dvou balících je chyba');
  const clash2 = clone(child);
  clash2.prefabs = [clone(golden.prefabs[0])];
  ok(validatePack(mergePacks(clash2, [golden])).errors.some((e) => e.code === 'pack.dupePrefab'), 'stejné id prefabu ve dvou balících je chyba');
}

// ---- geometrie
const centroid = (pts) => pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
function normalsOutward(b) {
  const m = brushMesh(b);
  const c = centroid(brushCorners(b));
  for (let i = 0; i < m.indices.length; i += 3) {
    const [ia, ib, ic] = [m.indices[i], m.indices[i + 1], m.indices[i + 2]];
    const A = m.positions.slice(ia * 3, ia * 3 + 3);
    const Bp = m.positions.slice(ib * 3, ib * 3 + 3);
    const C = m.positions.slice(ic * 3, ic * 3 + 3);
    const u = [Bp[0] - A[0], Bp[1] - A[1], Bp[2] - A[2]];
    const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const tc = [(A[0] + Bp[0] + C[0]) / 3 - c[0], (A[1] + Bp[1] + C[1]) / 3 - c[1], (A[2] + Bp[2] + C[2]) / 3 - c[2]];
    if (n[0] * tc[0] + n[1] * tc[1] + n[2] * tc[2] <= 0) return false;
    const stored = m.normals.slice(ia * 3, ia * 3 + 3);
    const len = Math.hypot(...n);
    if (Math.abs(stored[0] - n[0] / len) + Math.abs(stored[1] - n[1] / len) + Math.abs(stored[2] - n[2] / len) > 1e-6) return false;
  }
  return m.indices.length / 3 === brushTris(b);
}
const box = { min: [1, 2, 3], max: [4, 6, 8] };
ok(normalsOutward(box), 'box: 12 trojúhelníků, normály ven a shodné s uloženými');
for (const rise of ['+x', '-x', '+z', '-z']) {
  ok(normalsOutward({ shape: 'wedge', rise, min: [1, 0, 3], max: [4, 2, 8] }), `klín ${rise}: 8 trojúhelníků, normály ven`);
}
{
  const w = { shape: 'wedge', rise: '-z', min: [0, 0, -4], max: [2, 1, 0] };
  const pts = brushCorners(w);
  const top = pts.filter((p) => p[1] === 1);
  ok(top.length === 2 && top.every((p) => p[2] === -4), 'klín -z má vysokou hranu na straně menšího z');
  const col = brushCollider(w);
  ok(col.type === 'hull' && col.points.length === 6, 'klín má kolizi jako konvexní obal ze 6 bodů');
  const cb = brushCollider(box);
  ok(cb.type === 'cuboid' && cb.center.join() === '2.5,4,5.5' && cb.half.join() === '1.5,2,2.5', 'box má kolizi jako kvádr se správným středem a polorozměry');
  const m = brushMesh(box);
  const g = m.groups.find((x) => x.face === '+z');
  const first = m.indices[g.start];
  ok(m.uvs[first * 2] === 1 && m.uvs[first * 2 + 1] === 2, 'UV jsou ve světových metrech (stěna +z: u = x, v = y)');
  ok(m.groups.map((x) => x.face).join(' ') === '+x -x +y -y +z -z', 'box má skupinu pro každou stěnu');
}

// ---- kostra: klouby hýbou díly tak, jak říkají data
{
  const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
  const door = P(pack, 'door_hinged_01');
  ok(jointRest(door).hinge === 0, 'klidová poloha kloubu se bere z dat');
  ok(near(mat4Point(rigMatrices(door).leaf, [1, 0, 0]), [0.5, 0, 0]), 'zavřené křídlo dveří končí na druhé straně otvoru');
  ok(near(mat4Point(rigMatrices(door, { hinge: 90 }).leaf, [1, 0, 0]), [-0.5, 0, -1]), 'křídlo otočené o 90° míří do -Z');
  ok(near(mat4Point(rigMatrices(door, { hinge: 500 }).leaf, [1, 0, 0]), mat4Point(rigMatrices(door, { hinge: 105 }).leaf, [1, 0, 0])), 'hodnota kloubu se omezí na meze');
  const slide = P(pack, 'door_slide_01');
  ok(near(mat4Point(rigMatrices(slide, { slide: 0.98 }).leaf, [0, 0, 0]), [0.98, 0, 0]), 'posuvné dveře se posunou po ose o hodnotu kloubu');
  const eLab = L(pack).entities.find((e) => e.id === 'e_door_lab');
  const world = mat4Mul(entityMatrix(eLab), rigMatrices(slide, { slide: 0.98 }).leaf);
  const c = mat4Point(world, [0, 1, 0]);
  ok(Math.abs(c[0] - 4.1) < 1e-9 && Math.abs(c[2] - -6.48) < 1e-9, 'otevřené dveře laboratoře zajedou do zdi chodby (osa -Z)', c.map((v) => v.toFixed(2)).join(' '));
  const btn = L(pack).entities.find((e) => e.id === 'e_btn_lab');
  const front = mat4Point(entityMatrix(btn), [0, 0, 1]);
  ok(Math.abs(front[0] - 3) < 1e-9 && Math.abs(front[2] - -4.6) < 1e-9, 'tlačítko na východní zdi chodby míří do chodby (-X)');
  const valve = P(pack, 'valve_wheel_01');
  ok(near(mat4Point(rigMatrices(valve, { turn: 90 }).wheel, [0.1, 0, 0]), [0, 0.1, 0.12]), 'kolo ventilu se točí kolem své osy');
}

// ---- co level slibuje testům pohybu a interakce (case 10, T1–T4)
{
  const lvl = L(pack);
  const by = (tag) => lvl.brushes.filter((b) => b.tag === tag);
  const wedges = lvl.brushes.filter((b) => b.shape === 'wedge').map((b) => wedgeRunRise(b).angleDeg);
  ok(wedges.some((a) => Math.abs(a - 30) < 0.1) && wedges.some((a) => Math.abs(a - 50) < 0.1), 'level má rampu 30° (dá se vyjít) a 50° (klouže)', wedges.map((a) => a.toFixed(2)).join(' '));
  ok(by('step').some((b) => Math.abs(b.max[1] - b.min[1] - 0.3) < 1e-9), 'level má schod 0,3 m');
  const stairs = by('stair');
  ok(stairs.length === 6 && stairs.every((b, i) => Math.abs(b.max[1] - 0.25 * (i + 1)) < 1e-9), 'schodiště má 6 stupňů po 0,25 m');
  const floors = by('floor');
  const underPortal = lvl.portals.every((p) => {
    const cx = p.quad.reduce((s, q) => s + q[0], 0) / 4;
    const cz = p.quad.reduce((s, q) => s + q[2], 0) / 4;
    return floors.some((f) => f.max[1] === 0 && cx >= f.min[0] && cx <= f.max[0] && cz >= f.min[2] && cz <= f.max[2]);
  });
  ok(underPortal, 'pod každým portálem je práh (podlaha nemá díru)');
  const kinds = new Set(pack.prefabs.map((p) => p.data.components?.interact?.kind).filter(Boolean));
  for (const k of ['door', 'button', 'switch', 'lever', 'valve', 'drawer', 'terminal', 'pickup']) ok(kinds.has(k), `vzorek obsahuje interakci ${k}`);
  const jointed = pack.prefabs.filter((p) => (p.data.rig.joints || []).length > 0).length;
  ok(jointed >= 7, 'aspoň 7 prefabů má kloub (kostra před tvarem)', String(jointed));
  ok(pack.prefabs.some((p) => p.data.components?.physics?.body === 'dynamic'), 'vzorek obsahuje dynamické těleso');
  ok(lvl.entities.some((e) => (e.io || []).some((l) => l.delay > 0)), 'vzorek obsahuje spojení se zpožděním');
  ok(lvl.entities.some((e) => (e.io || []).some((l) => l.input === 'setLevel')), 'vzorek obsahuje spojení, které předává hodnotu');
}

// ---- popis formátu je úplný
{
  const undocumented = [];
  // položka pole nebo mapy popis nepotřebuje, popsané je pole samo
  const walk = (d, p, item = false) => {
    if (!d.doc && d.t !== 'const' && !item) undocumented.push(p);
    if (d.t === 'obj') for (const [k, f] of Object.entries(d.fields)) walk(f, `${p}.${k}`);
    if (d.t === 'arr' || d.t === 'map') walk(d.of, `${p}[]`, true);
  };
  for (const [k, d] of Object.entries(FORMATS)) walk(d, k);
  ok(undocumented.length === 0, 'každé pole formátu má popis', undocumented.slice(0, 5).join(' '));
  ok(Object.keys(COMPONENTS).length === 8, 'formát zná 8 součástí prefabu', Object.keys(COMPONENTS).join(' '));
}

// ---- síť pro světlo po vrcholech a výpočet osvětlení (jedna pravda pro běh i zapékání)
{
  const area = (m) => {
    let a = 0;
    for (let i = 0; i < m.indices.length; i += 3) {
      const [p, q, r] = [m.indices[i], m.indices[i + 1], m.indices[i + 2]].map((k) => [m.positions[k * 3], m.positions[k * 3 + 1], m.positions[k * 3 + 2]]);
      const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      a += Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2;
    }
    return a;
  };
  const box = { id: 'b_t', shape: 'box', min: [0, 0, 0], max: [4, 3, 2], material: 'm' };
  const wedge = { id: 'b_w', shape: 'wedge', rise: '+x', min: [0, 0, 0], max: [3, 1.5, 2], material: 'm' };
  const g = X.brushLightMesh(box, 0.5);
  // plochy 4×3 (dvakrát), 4×2 (dvakrát), 2×3 (dvakrát) při buňce 0,5 m
  const want = 2 * (9 * 7) + 2 * (9 * 5) + 2 * (5 * 7);
  ok(g.positions.length / 3 === want, 'síť světla: počet vzorků kvádru 4×3×2 při buňce 0,5 m', `${g.positions.length / 3} = ${want}`);
  ok(Math.abs(area(g) - area(X.brushMesh(box))) < 1e-9, 'síť světla: plocha kvádru se dělením nemění');
  const gw = X.brushLightMesh(wedge, 0.5);
  ok(Math.abs(area(gw) - area(X.brushMesh(wedge))) < 1e-9, 'síť světla: plocha klínu se dělením nemění');
  ok(gw.groups.map((x) => x.face).join() === X.brushMesh(wedge).groups.map((x) => x.face).join(), 'síť světla: stejné plochy ve stejném pořadí jako brushMesh');
  {
    const a = X.brushLightMesh(box, 100);
    const b = X.brushMesh(box);
    const key = (m) => { const k = []; for (let i = 0; i < m.positions.length; i += 3) k.push(m.positions.slice(i, i + 3).join()); return k.sort().join(';'); };
    ok(a.indices.length === b.indices.length && key(a) === key(b), 'síť světla: buňka větší než kvádr dá stejné vrcholy a počet trojúhelníků jako brushMesh');
  }
  ok(JSON.stringify(X.brushLightMesh(wedge, 0.5)) === JSON.stringify(gw), 'síť světla: opakované volání dá stejné pořadí vrcholů');
  let inside = true;
  for (let i = 0; i < gw.positions.length; i += 3) if (!X.inBounds([gw.positions[i], gw.positions[i + 1], gw.positions[i + 2]], { min: wedge.min, max: wedge.max }, 1e-9)) inside = false;
  ok(inside, 'síť světla: všechny vzorky klínu leží v jeho mezích');
  let maxEdge = 0;
  for (let i = 0; i < g.indices.length; i += 3) {
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const p = g.indices[i + a] * 3;
      const q = g.indices[i + b] * 3;
      const d = Math.hypot(g.positions[p] - g.positions[q], g.positions[p + 1] - g.positions[q + 1], g.positions[p + 2] - g.positions[q + 2]);
      if (d > maxEdge) maxEdge = d;
    }
  }
  ok(maxEdge <= 0.5 * Math.SQRT2 + 1e-9, 'síť světla: žádná hrana delší než úhlopříčka buňky', maxEdge.toFixed(3));
  ok(X.brushLightMesh({ ...box, max: [400, 3, 2] }, 0.5).positions.length / 3 < 20000, 'síť světla: dlouhá plocha má strop počtu dílků');

  // mřížka světla, znění 2 (D-037): násobky buňky ve světě, schované plochy se nevyrábějí
  {
    const coords = (m, k, pick = () => true) => {
      const set = new Set();
      for (let i = 0; i < m.positions.length; i += 3) if (pick(m.positions[i], m.positions[i + 1], m.positions[i + 2])) set.add(m.positions[i + k]);
      return [...set].sort((a, b) => a - b).join(' ');
    };
    const off = { id: 'b_o', shape: 'box', min: [0.3, 0, 0.2], max: [2.1, 1.3, 0.4], mat: 'm' };
    const mo = X.brushLightMesh(off, 0.5);
    ok(coords(mo, 0) === '0.3 0.5 1 1.5 2 2.1' && coords(mo, 1) === '0 0.5 1 1.3' && coords(mo, 2) === '0.2 0.4', 'síť světla: vnitřní vrcholy leží na násobcích buňky ve světě, krajní na hranách kvádru', `x: ${coords(mo, 0)}`);
    ok(Math.abs(area(mo) - area(X.brushMesh(off))) < 1e-9, 'síť světla: plocha kvádru mimo mřížku se dělením nemění');
    // dvě desky vedle sebe, různě dlouhé: na společné přímce x = 1,3 mají horní plochy stejné vrcholy (kromě rohů kratší desky)
    const sa = X.brushLightMesh({ shape: 'box', min: [0, 0, 0], max: [1.3, 0.2, 2] }, 0.5, ['-x', '+x', '-y', '-z', '+z']);
    const sb = X.brushLightMesh({ shape: 'box', min: [1.3, 0, 0.4], max: [3.1, 0.2, 1.7] }, 0.5, ['-x', '+x', '-y', '-z', '+z']);
    const onA = coords(sa, 2, (x, y, z) => x === 1.3 && z > 0.4 && z < 1.7);
    const onB = coords(sb, 2, (x, y, z) => x === 1.3 && z > 0.4 && z < 1.7);
    ok(onA === '0.5 1 1.5' && onA === onB, 'síť světla: sousední plochy v jedné rovině mají na společné přímce stejné vrcholy', `${onA} = ${onB}`);
    ok(sa.groups.length === 1 && sa.groups[0].face === '+y' && X.brushLightMesh(off, 0.5, new Set(['+y'])).groups.every((g) => g.face !== '+y'), 'síť světla: vyjmenované plochy se nevyrábějí (pole i množina)');
    const wm = X.brushLightMesh({ shape: 'wedge', rise: '+x', min: [0.2, 0, 0.3], max: [3.2, 1.5, 2.3] }, 0.5);
    ok(coords(wm, 2) === '0.3 0.5 1 1.5 2 2.3', 'síť světla: klín dělí hrany rovnoběžné s osou také po násobcích buňky', coords(wm, 2));

    const A = { id: 'b_a', shape: 'box', min: [0, 0, 0], max: [1, 1, 1], mat: 'm' };
    const top = { id: 'b_b', shape: 'box', min: [0, 1, 0], max: [1, 2, 1], mat: 'm' };
    const lid = { id: 'b_c', shape: 'box', min: [-1, 1, -1], max: [2, 2, 2], mat: 'g' };
    const str = (h) => JSON.stringify(h);
    ok(str(X.brushHiddenFaces([A, top])) === '[["+y"],["-y"]]', 'schované plochy: styčná plocha dvou kvádrů na sobě je schovaná u obou', str(X.brushHiddenFaces([A, top])));
    ok(str(X.brushHiddenFaces([A, lid])) === '[["+y"],null]', 'schované plochy: větší kvádr schová plochu menšího, opačně ne');
    ok(str(X.brushHiddenFaces([A, lid], { g: { opacity: 0.4 } })) === '[null,null]' && str(X.brushHiddenFaces([A, lid], new Map([['g', { alphaTest: 0.5 }]]))) === '[null,null]', 'schované plochy: průhledný kvádr nic neschová');
    ok(str(X.brushHiddenFaces([A, { ...lid, vis: false }])) === '[null,null]' && str(X.brushHiddenFaces([A, { ...top, min: [0, 1.5, 0] }])) === '[null,null]', 'schované plochy: neviditelný ani vzdálený kvádr nic neschová');
    const floor = { id: 'b_f', shape: 'box', min: [-2, -0.2, -2], max: [6, 0, 6], mat: 'm' };
    const ramp = { id: 'b_r', shape: 'wedge', rise: '+x', min: [0, 0, 0], max: [3, 1.5, 2], mat: 'm' };
    ok(str(X.brushHiddenFaces([floor, ramp])) === '[null,["-y"]]', 'schované plochy: spodek klínu na podlaze je schovaný, klín sám nic neschová');

    const gp = await readPackDir(GOLDEN);
    const lvl = gp.levels[0].data;
    const mats = gp.materials.materials;
    const hide = X.brushHiddenFaces(lvl.brushes, mats);
    const meshes = X.levelLightMeshes(lvl.brushes, mats);
    let all = 0;
    let kept = 0;
    let match = meshes.length === lvl.brushes.length;
    lvl.brushes.forEach((b, i) => {
      all += X.brushLightMesh(b).positions.length / 3;
      if (b.vis === false) match = match && meshes[i] === null;
      else {
        kept += meshes[i].positions.length / 3;
        match = match && JSON.stringify(meshes[i]) === JSON.stringify(X.brushLightMesh(b, X.LIGHT_CELL, hide[i]));
      }
    });
    const nHidden = hide.reduce((n, h) => n + (h ? h.length : 0), 0);
    ok(match, 'síť světla levelu: levelLightMeshes = brushLightMesh se schovanými plochami, kvádr po kvádru');
    ok(nHidden > 0 && kept < all, 'zlatý vzorek: část ploch je schovaná a vzorků je bez nich méně', `${nHidden} ploch, ${kept} vzorků místo ${all}`);
  }

  const L = { type: 'point', pos: [0, 2, 0], intensity: 100, range: 10 };
  const e2 = X.lightIrradiance(L, 0, 0, 0, 0, 1, 0);
  ok(Math.abs(e2 - (100 * (1 - (0.2) ** 4) ** 2) / 4) < 1e-9, 'světlo: kolmý dopad ve 2 m = I · okno / d²', e2.toFixed(3));
  ok(X.lightIrradiance(L, 0, 0, 0, 0, -1, 0) === 0, 'světlo: odvrácená plocha je tmavá');
  ok(X.lightIrradiance(L, 0, -9, 0, 0, 1, 0) === 0, 'světlo: za dosahem nula');
  const e45 = X.lightIrradiance(L, 2, 0, 0, 0, 1, 0);
  ok(Math.abs(e45 - (100 * Math.SQRT1_2 * X.lightWindow(Math.sqrt(8), 10)) / 8) < 1e-9, 'světlo: šikmý dopad se násobí kosinem');
  ok(X.lightIrradiance({ ...L, pos: [0, 0.01, 0] }, 0, 0, 0, 0, 1, 0) <= 100 / 0.01 + 1e-6, 'světlo: těsně u zdroje drží strop 1 / 0,01');
  const S = { type: 'spot', pos: [0, 2, 0], dir: [0, -1, 0], intensity: 100, range: 10, angle: 60 };
  ok(Math.abs(X.lightIrradiance(S, 0, 0, 0, 0, 1, 0) - e2) < 1e-9, 'světlo: v ose kužele jako bodové');
  ok(X.lightIrradiance(S, 2, 0, 0, 0, 1, 0) === 0, 'světlo: mimo kužel (45° od osy při úhlu 60°) nula');
  ok(Math.abs(X.lightIrradiance({ type: 'sun', dir: [0, -1, 0], intensity: 50 }, 5, 0, 5, 0, 1, 0) - 50) < 1e-9, 'světlo: slunce bez zeslabení vzdáleností');
}

console.log(`\nT1 xSpace: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
