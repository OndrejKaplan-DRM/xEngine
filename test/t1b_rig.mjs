// T1b: kostry prefabů. Klouby hýbou díly tak, jak říkají data; svázané klouby (N-002);
// kompilace a řešení kostry bez alokací (N-102) bit po bitu shodné s původním výpočtem.
// Oddělené z T1 kvůli mezi 600 řádků; mutace kódů `rig.*` zůstávají v T1.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import { validatePack, entityMatrix, rigMatrices, jointRest, mat4Mul, mat4Point } from '../src/xspace/index.js';
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

const { pack } = await checkPackDir(GOLDEN);
const L = (p) => p.levels[0].data;
const P = (p, id) => p.prefabs.find((x) => x.data.id === id).data;

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

// ---- svázané klouby (N-002): dvoukřídlé dveře jako jeden prefab
{
  const m = clone(pack);
  const D = P(m, 'door_hinged_01');
  D.rig.nodes.push({ id: 'leaf2', parent: 'frame', pos: [0.5, 0, 0] });
  D.rig.joints.push({ id: 'hinge2', node: 'leaf2', type: 'hinge', axis: [0, 1, 0], min: -105, max: 105, rest: 0, follow: { joint: 'hinge', ratio: -1 } });
  const r = validatePack(m);
  ok(r.ok && !r.errors.some((e) => e.code.startsWith('rig.') || e.code === 'ref.joint'), 'platný svázaný kloub projde validátorem', r.errors.map((e) => e.code).join(' '));
  const v = X.jointFollow(D, { hinge: 60 });
  const chain = clone(D);
  chain.rig.nodes.push({ id: 'knob', parent: 'leaf2' });
  chain.rig.joints.push({ id: 'k', node: 'knob', type: 'slider', axis: [1, 0, 0], min: 0, max: 0.1, follow: { joint: 'hinge2', ratio: -0.001, offset: 0 } });
  const w = X.jointFollow(chain, { hinge: 60 });
  const clampD = clone(D);
  clampD.rig.joints[1].min = -30;
  ok(v.hinge === 60 && v.hinge2 === -60 && Math.abs(w.k - 0.06) < 1e-12 && X.jointFollow(clampD, { hinge: 60 }).hinge2 === -30 && X.jointFollow(D).hinge2 === -0, 'jointFollow: offset + ratio × sledovaný kloub, řetěz, ořez na meze, bez hodnot z klidové polohy', `${v.hinge2}, ${w.k}`);
  const M = X.rigMatrices(D, X.jointFollow(D, { hinge: 90 }));
  ok(Math.abs(M.leaf[8] - 1) < 1e-9 && Math.abs(M.leaf2[8] + 1) < 1e-9, 'rigMatrices s dopočítanými hodnotami otočí obě křídla proti sobě');
}

// ---- kostra bez alokací (N-102): rigCompile, rigSolve, rigFollow
{
  // nezávislá reference: původní rekurzivní výpočet matic (před N-102)
  const ref = (prefab, values = {}) => {
    const jointOf = new Map((prefab.rig.joints || []).map((j) => [j.node, j]));
    const nodes = new Map(prefab.rig.nodes.map((n) => [n.id, n]));
    const out = {};
    const solve = (id) => {
      if (out[id]) return out[id];
      const n = nodes.get(id);
      let local = mat4Mul(X.mat4Translate(n.pos || [0, 0, 0]), X.mat4Euler(n.rot));
      const j = jointOf.get(id);
      if (j) {
        const v = X.jointClamp(j, values[j.id] ?? j.rest ?? j.min);
        const jm = j.type === 'hinge' ? X.mat4AxisAngle(j.axis, v) : X.mat4Translate([j.axis[0] * v, j.axis[1] * v, j.axis[2] * v]);
        local = mat4Mul(local, jm);
      }
      out[id] = n.parent === undefined ? local : mat4Mul(solve(n.parent), local);
      return out[id];
    };
    for (const n of prefab.rig.nodes) solve(n.id);
    return out;
  };
  let worst = 0;
  let cases = 0;
  const prefabs = pack.prefabs.map((p) => p.data);
  for (const pf of prefabs) {
    const C = X.rigCompile(pf);
    const out = new Float64Array(16 * C.count);
    const tries = [{}, ...(pf.rig.joints || []).flatMap((j) => [{ [j.id]: j.min }, { [j.id]: j.max }, { [j.id]: (j.min + j.max) / 3 }, { [j.id]: j.max + 1000 }])];
    for (const vals of tries) {
      const a = ref(pf, vals);
      const b = X.rigMatrices(pf, vals);
      const r = X.rigSolve(C, X.rigValues(C, vals), out);
      for (const id of C.nodeIds) {
        const i = C.nodeIndex.get(id);
        for (let e = 0; e < 16; e++) worst = Math.max(worst, Math.abs(a[id][e] - b[id][e]), Math.abs(a[id][e] - r[16 * i + e]));
      }
      cases++;
    }
  }
  ok(worst === 0, 'rigSolve i obálka rigMatrices dávají bit po bitu totéž co původní výpočet (všechny prefaby zlatého vzorku, meze, ořez)', `${cases} případů, největší rozdíl ${worst}`);
  // svázané klouby v poli hodnot = jointFollow
  const D = clone(pack.prefabs.find((p) => p.data.id === 'door_hinged_01').data);
  D.rig.nodes.push({ id: 'leaf2', parent: 'frame', pos: [0.5, 0, 0] }, { id: 'knob', parent: 'leaf2' });
  D.rig.joints.push({ id: 'hinge2', node: 'leaf2', type: 'hinge', axis: [0, 1, 0], min: -105, max: 105, rest: 0, follow: { joint: 'hinge', ratio: -1 } });
  D.rig.joints.push({ id: 'k', node: 'knob', type: 'slider', axis: [1, 0, 0], min: 0, max: 0.05, follow: { joint: 'hinge2', ratio: -0.001 } });
  const C = X.rigCompile(D);
  const vals = X.rigFollow(C, X.rigValues(C, { hinge: 70 }));
  const obj = X.jointFollow(D, { hinge: 70 });
  ok(vals[C.jointIndex.get('hinge2')] === obj.hinge2 && vals[C.jointIndex.get('k')] === obj.k && obj.k === 0.05, 'rigFollow v poli hodnot = jointFollow (řetěz, ořez na meze)', `${obj.hinge2}, ${obj.k}`);
  // stejné pole výsledku, žádné nové pole; čas jen pro představu (sandbox)
  const out = new Float64Array(16 * C.count);
  const v = X.rigValues(C, { hinge: 10 });
  const t0 = performance.now();
  let same = true;
  for (let n = 0; n < 100000; n++) {
    v[0] = n % 105;
    X.rigFollow(C, v);
    if (X.rigSolve(C, v, out) !== out) same = false;
  }
  const ms = performance.now() - t0;
  ok(same, 'rigSolve zapisuje do předaného pole a vrací ho', `100 000 kroků kostry se 4 uzly a 3 klouby: ${ms.toFixed(0)} ms v sandboxu`);
}

console.log(`\nT1b kostry: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
