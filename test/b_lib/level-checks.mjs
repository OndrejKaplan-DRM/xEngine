// Kontroly vygenerovaného levelu nad rámec validátoru: počítají se jen z dat levelu a sady,
// ne z vnitřností generátoru. Každá kontrola vrací seznam problémů (prázdný = v pořádku).
// Šířky průchodů se měří skutečným hráčem levelu (profil pohybu enginu a odstup kontroléru, b_lib/player.mjs).

import { inBounds } from '../../src/xspace/index.js';
import { playerOf } from './player.mjs';
import { doorPass } from './door-pass.mjs';

const EPS = 1e-6;
const hit = (p, q, eps = 0.001) => [0, 1, 2].every((k) => Math.min(p.max[k], q.max[k]) - Math.max(p.min[k], q.min[k]) > eps);
const solidAt = (level, p) => level.brushes.some((b) => (b.shape || 'box') === 'box' && b.col !== false && inBounds(p, b, EPS));
const cellAt = (level, p) => level.cells.find((c) => inBounds(p, c.bounds, EPS));
const isDoor = (catalog, e) => catalog.get(e.prefab).category === 'arch.door';
const restBox = (catalog, e) => catalog.worldBox(e.prefab, e.pos, e.rot ? e.rot[1] : 0, 'rest');

/** Rozbor portálu: osa roviny, osa šířky, práh, výška. */
export function portalInfo(level, p) {
  const ext = [0, 1, 2].map((k) => [Math.min(...p.quad.map((q) => q[k])), Math.max(...p.quad.map((q) => q[k]))]);
  const k = [0, 2].find((a) => ext[a][1] - ext[a][0] <= 0.02);
  const o = k === 0 ? 2 : 0;
  const A = level.cells.find((c) => c.id === p.a).bounds;
  const B = level.cells.find((c) => c.id === p.b).bounds;
  const lo = Math.min(A.max[k], B.max[k]);
  const hi = Math.max(A.min[k], B.min[k]);
  return { k, o, plane: ext[k][0], lo, hi, c0: ext[o][0], c1: ext[o][1], sill: ext[1][0], top: ext[1][1], A, B };
}

/** Entity dveří stojící ve středu prahu portálu (dvoukřídlé dveře jsou dvě; pole portal.door se k tomu nepoužívá). */
export function portalDoors(level, catalog, p, f = portalInfo(level, p)) {
  if (f.k === undefined) return [];
  return level.entities.filter((e) => isDoor(catalog, e) && Math.abs(e.pos[f.k] - f.plane) < 0.011 && Math.abs(e.pos[f.o] - (f.c0 + f.c1) / 2) < 0.011 && Math.abs(e.pos[1] - f.sill) < 0.011);
}

const passCache = new Map();
/** Světlost otevřených dveří pro kapsli hráče (m); podle prefabů, otvoru a tloušťky zdi se počítá jednou. */
function doorClear(catalog, prefabIds, w, wall, player) {
  const key = `${prefabIds.join('+')}|${w.toFixed(3)}|${wall.toFixed(3)}|${player.step}|${player.height}`;
  if (!passCache.has(key)) passCache.set(key, doorPass(prefabIds.map((id) => catalog.get(id)), w, wall, player).clear);
  return passCache.get(key);
}

/** Portály: uprostřed zdi, práh pod otvorem, volný průchod na šířku hráče, dveře sedí do otvoru. */
export function checkPortals(level, catalog, player = playerOf(level.profile)) {
  const out = [];
  const entById = new Map(level.entities.map((e) => [e.id, e]));
  const W = player.width;
  for (const p of level.portals) {
    const f = portalInfo(level, p);
    if (f.k === undefined) {
      out.push(`${p.id}: portál není svislý`);
      continue;
    }
    if (Math.abs(f.plane - (f.lo + f.hi) / 2) > 1e-4) out.push(`${p.id}: neleží uprostřed tloušťky zdi`);
    // práh: pod otvorem je v celé tloušťce zdi i šířce otvoru plno
    for (const a of [f.lo + 0.01, f.plane, f.hi - 0.01]) {
      for (const c of [f.c0 + 0.01, (f.c0 + f.c1) / 2, f.c1 - 0.01]) {
        const pt = [0, f.sill - 0.01, 0];
        pt[f.k] = a;
        pt[f.o] = c;
        if (!solidAt(level, pt)) out.push(`${p.id}: pod otvorem chybí práh (díra v podlaze)`);
      }
    }
    // průchod: na šířku hráče na každou stranu od zdi nesmí nic stát (kromě dveří tohoto portálu)
    const pass = { min: [0, f.sill + 0.03, 0], max: [0, f.top - 0.03, 0] };
    pass.min[f.k] = f.lo - W;
    pass.max[f.k] = f.hi + W;
    pass.min[f.o] = f.c0 + 0.02;
    pass.max[f.o] = f.c1 - 0.02;
    for (const b of level.brushes) if (b.col !== false && hit(b, pass)) out.push(`${p.id}: průchod zatarasil kvádr ${b.id}`);
    for (const e of level.entities) {
      if (isDoor(catalog, e) && Math.abs(e.pos[f.k] - f.plane) < 0.01 && e.pos[f.o] > f.c0 && e.pos[f.o] < f.c1) continue;
      if (hit(restBox(catalog, e), pass)) out.push(`${p.id}: v průchodu stojí ${e.id}`);
    }
    const here = portalDoors(level, catalog, p, f);
    if (p.door && !here.includes(entById.get(p.door))) out.push(`${p.id}: dveře ${p.door} nestojí ve středu prahu`);
    if (here.length > 2) out.push(`${p.id}: v otvoru stojí ${here.length} dveří`);
    if (here.length >= 1 && !p.door) out.push(`${p.id}: dveře ${here[0].id} nejsou zapsané jako dveře portálu (navigace je nenajde)`);
    // šířka pro hráče: volný otvor celý, dveře otevřené na doraz (kruh v půdorysu; 1 cm je nejistota mřížky)
    const clear = here.length ? doorClear(catalog, here.map((d) => d.prefab), f.c1 - f.c0, f.hi - f.lo, player) : f.c1 - f.c0;
    if (clear < W - (here.length ? 0.01 : 1e-6)) out.push(`${p.id}: průchod ${clear.toFixed(2)} m je užší než hráč (${W.toFixed(2)} m)`);
    for (const d of here) {
      const op = catalog.opening(d.prefab);
      if (Math.abs(d.pos[f.o] - (f.c0 + f.c1) / 2) > 0.001 || Math.abs(d.pos[1] - f.sill) > 0.001 || Math.abs(d.pos[f.k] - f.plane) > 0.001) out.push(`${p.id}: dveře ${d.id} nestojí ve středu prahu`);
      if (Math.abs(op.w / 100 - (f.c1 - f.c0)) > 0.011 || Math.abs(op.h / 100 - (f.top - f.sill)) > 0.011) out.push(`${p.id}: otvor ${(f.c1 - f.c0).toFixed(2)} × ${(f.top - f.sill).toFixed(2)} m nesedí na dveře ${d.prefab}`);
    }
  }
  return out;
}

/** Dosažitelnost všech buněk od hráče přes portály (nezávisle na validátoru). */
export function checkReach(level) {
  const sp = level.spawns.find((s) => s.kind === 'player');
  const start = cellAt(level, [sp.pos[0], sp.pos[1] + 0.9, sp.pos[2]]);
  if (!start) return ['výchozí místo hráče není v žádné buňce'];
  const adj = new Map(level.cells.map((c) => [c.id, []]));
  for (const p of level.portals) {
    adj.get(p.a).push(p.b);
    adj.get(p.b).push(p.a);
  }
  const seen = new Set([start.id]);
  const queue = [start.id];
  while (queue.length) for (const n of adj.get(queue.shift())) if (!seen.has(n)) (seen.add(n), queue.push(n));
  return level.cells.filter((c) => !seen.has(c.id)).map((c) => `buňka ${c.id} není dosažitelná`);
}

/** Výchozí místa: pod nohama podlaha, kolem volno. */
export function checkSpawns(level, catalog) {
  const out = [];
  for (const s of level.spawns) {
    if (!solidAt(level, [s.pos[0], s.pos[1] - 0.05, s.pos[2]])) out.push(`${s.id}: pod výchozím místem není podlaha`);
    const body = { min: [s.pos[0] - 0.3, s.pos[1] + 0.02, s.pos[2] - 0.3], max: [s.pos[0] + 0.3, s.pos[1] + 1.8, s.pos[2] + 0.3] };
    for (const b of level.brushes) if (b.col !== false && hit(b, body)) out.push(`${s.id}: výchozí místo je v kvádru ${b.id}`);
    for (const e of level.entities) if (hit(restBox(catalog, e), body)) out.push(`${s.id}: na výchozím místě stojí ${e.id}`);
  }
  return out;
}

/** Schody a rampy: výška stupně 0,15–0,20 m, hloubka 0,25–0,30 m, rampa nejvýš 30°. */
export function checkStairs(level) {
  const out = [];
  const stairs = level.brushes.filter((b) => b.tag === 'stair');
  for (let i = 0; i < stairs.length; i++) {
    const b = stairs[i];
    const tread = Math.min(b.max[0] - b.min[0], b.max[2] - b.min[2]);
    if (tread < 0.25 - EPS || tread > 0.3 + EPS) out.push(`${b.id}: hloubka stupně ${tread.toFixed(3)} m`);
    const prev = stairs[i - 1];
    const sameFlight = prev && prev.cell === b.cell && hit({ min: prev.min.map((v) => v - 0.01), max: prev.max.map((v) => v + 0.01) }, b, 0);
    const rise = sameFlight ? Math.abs(b.max[1] - prev.max[1]) : b.max[1] - b.min[1];
    if (rise < 0.15 - EPS || rise > 0.2 + EPS) out.push(`${b.id}: výška stupně ${rise.toFixed(3)} m`);
  }
  for (const b of level.brushes.filter((x) => x.shape === 'wedge')) {
    const run = b.rise.endsWith('x') ? b.max[0] - b.min[0] : b.max[2] - b.min[2];
    const deg = (Math.atan2(b.max[1] - b.min[1], run) * 180) / Math.PI;
    if (deg > 30) out.push(`${b.id}: rampa ${deg.toFixed(0)}° se nedá vyjít`);
  }
  return { problems: out, stairs: stairs.length, ramps: level.brushes.filter((x) => x.shape === 'wedge').length };
}

/** Entity stojící na podlaze se v klidové poloze nepřekrývají; zeď se dotýká buňky, která ji vlastní. */
export function checkPlacement(level, catalog) {
  const out = [];
  const cellById = new Map(level.cells.map((c) => [c.id, c]));
  const floor = level.entities.filter((e) => !isDoor(catalog, e) && Math.abs(e.pos[1] - cellById.get(e.cell).bounds.min[1]) < 0.001 && catalog.restBox(e.prefab).min[1] > -0.001).map((e) => ({ e, box: restBox(catalog, e) }));
  for (let i = 0; i < floor.length; i++) {
    for (let j = i + 1; j < floor.length; j++) {
      if (floor[i].e.cell === floor[j].e.cell && hit(floor[i].box, floor[j].box, 0.01)) out.push(`${floor[i].e.id} a ${floor[j].e.id} stojí v sobě`);
    }
  }
  for (const e of level.entities) {
    const box = restBox(catalog, e);
    const c = cellById.get(e.cell).bounds;
    if (!isDoor(catalog, e) && [0, 1, 2].some((k) => box.min[k] < c.min[k] - 0.003 || box.max[k] > c.max[k] + 0.003)) out.push(`${e.id} přesahuje svou buňku`);
  }
  for (const b of level.brushes.filter((x) => x.tag === 'wall')) {
    const c = cellById.get(b.cell).bounds;
    const gap = Math.hypot(...[0, 1, 2].map((k) => Math.max(0, b.min[k] - c.max[k], c.min[k] - b.max[k])));
    if (gap > 0.201) out.push(`${b.id}: zeď se nedotýká své buňky (${gap.toFixed(2)} m)`);
  }
  return out;
}

/**
 * Průchodnost uvnitř buněk: mezi všemi otvory jedné buňky vede po podlaze cesta široká aspoň jako hráč
 * (kapsle s odstupem kontroléru; u dnešního profilu 0,74 m).
 * Mřížka 0,1 m; překážka je cokoli, co stojí mezi 0,25 a 1,7 m nad podlahou (schody a prahy se dají vyjít).
 * Buňky přes víc pater a buňky s plošinou se přeskakují (mají víc úrovní podlahy).
 */
export function checkPassable(level, catalog, player = playerOf(level.profile)) {
  const out = [];
  let tested = 0;
  const G = 0.1;
  const R = player.r;
  for (const cell of level.cells) {
    const mine = level.portals.filter((p) => p.a === cell.id || p.b === cell.id);
    if (mine.length < 2) continue;
    const b = cell.bounds;
    const y0 = b.min[1];
    if (level.brushes.some((x) => x.cell === cell.id && (x.tag === 'platform' || x.tag === 'gallery'))) continue;
    const blocks = [];
    for (const x of level.brushes) if (x.cell === cell.id && x.tag === 'pillar') blocks.push(x);
    for (const e of level.entities) {
      if (e.cell !== cell.id || isDoor(catalog, e) || !(catalog.get(e.prefab).colliders || []).length) continue; // bez kolize nic nezatarasí
      const box = restBox(catalog, e);
      if (box.max[1] > y0 + 0.25 && box.min[1] < y0 + 1.7) blocks.push(box);
    }
    const nx = Math.round((b.max[0] - b.min[0]) / G);
    const nz = Math.round((b.max[2] - b.min[2]) / G);
    const free = new Uint8Array(nx * nz);
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const x = b.min[0] + (i + 0.5) * G;
        const z = b.min[2] + (j + 0.5) * G;
        const wall = x - b.min[0] < R || b.max[0] - x < R || z - b.min[2] < R || b.max[2] - z < R;
        const blocked = blocks.some((q) => x > q.min[0] - R && x < q.max[0] + R && z > q.min[2] - R && z < q.max[2] + R);
        free[i * nz + j] = !wall && !blocked ? 1 : 0;
      }
    }
    // vstupy: 0,45 m za lícem zdi ve středu otvoru; v pruhu otvoru se smí i těsně u zdi
    const entries = mine.map((p) => {
      const f = portalInfo(level, p);
      const pt = [0, 0, 0];
      pt[f.o] = (f.c0 + f.c1) / 2;
      const into = b.min[f.k] >= f.hi - EPS ? 1 : -1;
      const face = into > 0 ? b.min[f.k] : b.max[f.k];
      for (let d = 0.05; d < 0.5; d += G) {
        const q = [...pt];
        q[f.k] = face + into * d;
        const i = Math.floor((q[0] - b.min[0]) / G);
        const j = Math.floor((q[2] - b.min[2]) / G);
        if (i >= 0 && j >= 0 && i < nx && j < nz && !blocks.some((s) => q[0] > s.min[0] - R && q[0] < s.max[0] + R && q[2] > s.min[2] - R && q[2] < s.max[2] + R)) free[i * nz + j] = 1;
      }
      pt[f.k] = face + into * 0.45;
      return { id: p.id, i: Math.floor((pt[0] - b.min[0]) / G), j: Math.floor((pt[2] - b.min[2]) / G) };
    });
    tested++;
    const seen = new Uint8Array(nx * nz);
    const stack = [[entries[0].i, entries[0].j]];
    while (stack.length) {
      const [i, j] = stack.pop();
      if (i < 0 || j < 0 || i >= nx || j >= nz || seen[i * nz + j] || !free[i * nz + j]) continue;
      seen[i * nz + j] = 1;
      stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
    }
    for (const e of entries) if (!seen[e.i * nz + e.j]) out.push(`${cell.id}: od ${entries[0].id} k ${e.id} nevede cesta široká ${player.width.toFixed(2)} m`);
  }
  return { problems: out, tested };
}

/** Pravidla obsahu z rozměrů buněk: strop aspoň 2,6 m, chodba aspoň 1,6 m široká (počítáno jen z dat levelu). */
export function checkContentRules(level, minCeil = 2.6, minCorr = 1.6) {
  const out = [];
  let ceil = Infinity;
  let corr = Infinity;
  for (const c of level.cells) {
    const h = c.bounds.max[1] - c.bounds.min[1];
    ceil = Math.min(ceil, h);
    if (h < minCeil - EPS) out.push(`${c.id}: světlá výška ${h.toFixed(2)} m`);
    if (!c.id.startsWith('c_corr')) continue;
    const w = Math.min(c.bounds.max[0] - c.bounds.min[0], c.bounds.max[2] - c.bounds.min[2]);
    corr = Math.min(corr, w);
    if (w < minCorr - EPS) out.push(`${c.id}: chodba široká ${w.toFixed(2)} m`);
  }
  return { problems: out, minCeil: ceil, minCorr: corr };
}

/** Všechny kontroly naráz. Hráč se bere z profilu levelu, pokud ho volající nedá. */
export function inspectLevel(raw, catalog, player = playerOf(raw.profile)) {
  const level = { ...raw, entities: raw.entities || [], portals: raw.portals || [], brushes: raw.brushes || [] };
  const st = checkStairs(level);
  const pass = checkPassable(level, catalog, player);
  const rules = checkContentRules(level);
  return {
    problems: [...checkReach(level), ...checkPortals(level, catalog, player), ...checkSpawns(level, catalog), ...st.problems, ...checkPlacement(level, catalog), ...pass.problems],
    stairs: st.stairs,
    ramps: st.ramps,
    passableCells: pass.tested,
    rules,
    player,
  };
}
