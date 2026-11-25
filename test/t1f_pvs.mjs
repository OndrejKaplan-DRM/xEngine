// T1f: potenciálně viditelná množina (PVS, N-014, D-057). Umělé levely (rovná chodba, chodba za roh), souměrnost
// a hlavně nezávislá kontrola nadmnožiny: náhodné úsečky mezi body dvou buněk, které neprotnou žádný kvádr levelu,
// spojují jen buňky, které PVS uvádí. Kvádry se berou jako osové kvádry zvětšené o 1 mm (klín celým kvádrem), takže
// kontrola přeskočí úsečky, o kterých si není jistá; vyhodnocené úsečky jsou ty, které jsou prokazatelně volné.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import * as X from '../src/xspace/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
const ids = (set) => [...set].sort().join(' ');

// ---- umělé levely: buňky A, B, C, D; zdi tloušťky 0,2 m, portál uprostřed zdi
const box = (id, min, max) => ({ id, bounds: { min, max } });
const xPortal = (id, a, b, x, z0, z1) => ({ id, a, b, quad: [[x, 0, z0], [x, 0, z1], [x, 2.1, z1], [x, 2.1, z0]] });
const zPortal = (id, a, b, z, x0, x1) => ({ id, a, b, quad: [[x0, 0, z], [x1, 0, z], [x1, 2.1, z], [x0, 2.1, z]] });
{
  const L = {
    cells: [box('A', [0, 0, 0], [4, 3, 2]), box('B', [4.2, 0, 0], [8.2, 3, 2]), box('C', [8.4, 0, 0], [12.4, 3, 2])],
    portals: [xPortal('p1', 'A', 'B', 4.1, 0.5, 1.5), xPortal('p2', 'B', 'C', 8.3, 0.5, 1.5)],
  };
  const P = X.levelPVS(L);
  ok(ids(P.get('A')) === 'A B C' && ids(P.get('C')) === 'A B C', 'rovná chodba: konec vidí na konec', ids(P.get('A')));
  L.portals[1] = xPortal('p2', 'B', 'C', 8.3, 0.0, 0.3); // druhý otvor u boční zdi, první uprostřed: přímka projde
  ok(X.levelPVS(L).get('A').has('C'), 'chodba s posunutým otvorem: přímka přes oba otvory existuje');
  L.cells[1] = box('B', [4.2, 0, 0], [8.2, 3, 6]);
  L.portals[1] = zPortal('p2', 'B', 'C', 6.1, 7.0, 8.0);
  L.cells[2] = box('C', [4.2, 0, 6.2], [8.2, 3, 10]);
  ok(X.levelPVS(L).get('A').has('C'), 'za roh přes dva otvory, které leží v zákrytu: vidět');
}
{
  // chodba za dva rohy: A → B (roh) → C → D, D leží za druhým rohem mimo přímku přes p1 a p2
  const L = {
    cells: [box('A', [0, 0, 0], [4, 3, 2]), box('B', [4.2, 0, 0], [6.2, 3, 6]), box('C', [4.2, 0, 6.2], [6.2, 3, 10]), box('D', [6.4, 0, 6.2], [10, 3, 8])],
    portals: [xPortal('p1', 'A', 'B', 4.1, 0.5, 1.5), zPortal('p2', 'B', 'C', 6.1, 4.7, 5.7), xPortal('p3', 'C', 'D', 6.3, 6.3, 7.0)],
  };
  const P = X.levelPVS(L);
  ok(ids(P.get('A')) === 'A B C', 'chodba za dva rohy: z A není vidět D', ids(P.get('A')));
  ok(P.get('B').has('D') && P.get('D').has('B') && !P.get('D').has('A'), 'z B je D vidět (dva otvory), z D není vidět A', `B: ${ids(P.get('B'))}; D: ${ids(P.get('D'))}`);
  ok(P.depth === 2, 'nejdelší řetěz portálů s výhledem', `${P.depth}`);
  // svislá podmínka: dolní otvor, horní otvor o patro výš a zase dolní; přímka by musela stoupat a potom klesat
  const V = {
    cells: [box('A', [0, 0, 0], [4, 3, 2]), box('B', [4.2, 0, 0], [8.2, 6.4, 2]), box('C', [8.4, 0, 0], [12.4, 6.4, 2]), box('D', [12.6, 0, 0], [16.6, 3, 2])],
    portals: [
      xPortal('p1', 'A', 'B', 4.1, 0.5, 1.5),
      { id: 'p2', a: 'B', b: 'C', quad: [[8.3, 3.4, 0.5], [8.3, 3.4, 1.5], [8.3, 5.5, 1.5], [8.3, 5.5, 0.5]] },
      xPortal('p3', 'C', 'D', 12.5, 0.5, 1.5),
    ],
  };
  const PV = X.levelPVS(V);
  ok(PV.get('A').has('C') && !PV.get('A').has('D') && PV.get('B').has('D'), 'otvor dole, o patro výš a zase dole: z A je vidět C, D ne; z B je vidět D', `A: ${ids(PV.get('A'))}; B: ${ids(PV.get('B'))}`);
}

// ---- skutečné levely: zlatý vzorek a gen_demo
const levels = [];
for (const dir of ['packs/golden', 'packs/gen_demo']) {
  const { pack } = await checkPackDir(path.join(root, dir));
  const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
  for (const l of pack.levels) levels.push({ level: l.data, prefabs, materials: pack.materials.materials });
}

// generátor náhodných čísel s pevným semínkem (test je opakovatelný)
let seed = 0x9e3779b9;
const rnd = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};
const inside = (b, m = 0.01) => [0, 1, 2].map((i) => b.min[i] + m + rnd() * (b.max[i] - b.min[i] - 2 * m));
/** Protne úsečka p → q osový kvádr [lo, hi]? (metoda desek) */
function hits(p, q, lo, hi) {
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    const d = q[i] - p[i];
    if (Math.abs(d) < 1e-12) {
      if (p[i] < lo[i] || p[i] > hi[i]) return false;
      continue;
    }
    let a = (lo[i] - p[i]) / d;
    let b = (hi[i] - p[i]) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

for (const { level } of levels) {
  const t = performance.now();
  const P = X.levelPVS(level);
  const ms = performance.now() - t;
  const cells = level.cells;
  let asym = 0;
  for (const [s, set] of P) for (const c of set) if (!P.get(c).has(s)) asym++;
  const sizes = [...P.values()].map((s) => s.size);
  ok(P.size === cells.length && [...P].every(([s, set]) => set.has(s)) && asym === 0, `${level.id}: PVS má každou buňku, obsahuje ji samu a je souměrná`, `${cells.length} buněk, PVS ${Math.min(...sizes)} až ${Math.max(...sizes)} buněk, řetěz nejvýš ${P.depth}, ${ms.toFixed(0)} ms`);

  // nezávislá kontrola nadmnožiny: volné úsečky mezi buňkami
  const walls = level.brushes.map((b) => [b.min.map((v) => v - 0.001), b.max.map((v) => v + 0.001)]);
  let free = 0;
  let freeFar = 0; // volné úsečky mezi buňkami, které nesousedí
  let miss = 0;
  let first = '';
  const near = new Map(cells.map((c) => [c.id, new Set([c.id])]));
  for (const p of level.portals) {
    near.get(p.a).add(p.b);
    near.get(p.b).add(p.a);
  }
  // cíl v okolí do 4 portálů (jinak je volná úsečka mezi nesousedními buňkami vzácná)
  const byId = new Map(cells.map((c) => [c.id, c]));
  const ring = new Map();
  for (const c of cells) {
    let front = [c.id];
    const seen = new Set(front);
    for (let d = 0; d < 4; d++) front = front.flatMap((x) => [...near.get(x)].filter((y) => !seen.has(y) && seen.add(y)));
    seen.delete(c.id);
    ring.set(c.id, [...seen].map((x) => byId.get(x)));
  }
  const N = Math.min(60000, cells.length * 1500);
  for (let k = 0; k < N; k++) {
    const S = cells[Math.floor(rnd() * cells.length)];
    const around = ring.get(S.id);
    if (!around.length) continue;
    const C = around[Math.floor(rnd() * around.length)];
    const a = inside(S.bounds);
    const b = inside(C.bounds);
    if (walls.some(([lo, hi]) => hits(a, b, lo, hi))) continue;
    free++;
    if (!near.get(S.id).has(C.id)) freeFar++; // tyhle by množina „jen sousedé“ minula: kontrola má zuby
    if (!P.get(S.id).has(C.id)) {
      miss++;
      if (!first) first = `${S.id} → ${C.id}`;
    }
  }
  ok(miss === 0 && freeFar > 0, `${level.id}: každá volná úsečka spojuje buňky, které PVS uvádí (nadmnožina)`, `${N} úseček, volných ${free}, z toho mezi nesousedními buňkami ${freeFar}, mimo PVS ${miss}${first ? ' (první ' + first + ')' : ''}`);

  // rozpočet viditelného: kvádry po síti světla, prefaby podle pole tris (jinak partTris)
  const trisOf = new Map();
  const triOf = (id) => {
    if (!trisOf.has(id)) {
      const pf = levels.find((l) => l.prefabs.has(id))?.prefabs.get(id);
      trisOf.set(id, pf ? (pf.tris ?? pf.parts.reduce((s, p) => s + (X.partTris(p) || 0), 0)) : 0);
    }
    return trisOf.get(id);
  };
  const brushTris = X.levelLightMeshes(level.brushes, null, X.LIGHT_CELL).map((m) => (m ? m.indices.length / 3 : 0));
  const V = X.visibleTris(level, triOf, P, brushTris);
  ok(V.max > 0 && V.perCell.size === cells.length, `${level.id}: viditelné △ po buňkách`, `nejvíc ${V.max} z buňky ${V.cell}, mez stupně low ${X.VISIBLE_TRIS_LOW}`);
}

console.log(`\nT1f PVS: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
