// xGen, rozvržení domu o několika podlažích (Ondřej 25. 11. 2026 v 14:47: „4 podlažní bytový komplex – horní patra
// byty, dolní patra laboratoře“). Obdélník domu, na každém podlaží chodba podél delší osy, na jednom konci schodišťová
// hala přes všechna podlaží (vysoká buňka; chodba do ní ústí celou šířkou), po obou stranách chodby místnosti
// z dělení (BSP bez dalších chodeb), vedle haly menší místnosti. Délky v celých centimetrech, půdorys [x, z].
//
// Kontrakt drží stejně jako makeLayout: buňky jsou listy dělení téhož obdélníku, mezi nimi zdi tloušťky T z desek,
// které se dotýkají, ale nepřekrývají. Vysoká hala sousedí s horními podlažími jen přes galerie (práh = podlaha patra).

import { snap } from './util.js';
import { sub, slab, bsp, segment, candidates, connect } from './layout.js';

/**
 * @param P parametry předvolby: T, grid, plot { w, d }, floors, storeyH, corridorW, corridorShift, core { w, d },
 *   roomMin, roomMax, areaKeep, areaSplit, maxAspect, splitSpread, minOpen, margin, minHead, maxStep a háčky
 *   classify, edgeWeight, loopChance, pickStart (jako makeLayout)
 * @returns plán ve tvaru makeLayout, nebo null
 */
export function makeHouseLayout(P, rng) {
  const T = P.T;
  const W = snap(rng.int(P.plot.w[0], P.plot.w[1]), P.grid);
  const D = snap(rng.int(P.plot.d[0], P.plot.d[1]), P.grid);
  const pitch = P.storeyH + 2 * T;
  const floorY = Array.from({ length: P.floors }, (_, f) => f * pitch);
  const cw = snap(rng.int(P.corridorW[0], P.corridorW[1]), P.grid);
  const cz0 = snap((D - cw) / 2 + rng.int(-P.corridorShift, P.corridorShift), P.grid);
  const coreW = snap(rng.int(P.core.w[0], P.core.w[1]), P.grid);
  const coreD = snap(rng.int(P.core.d[0], P.core.d[1]), P.grid);
  const kz0 = snap(cz0 + cw / 2 - coreD / 2, P.grid);
  const kz1 = kz0 + coreD;
  // hala musí přesahovat chodbu a vedle ní se musejí vejít místnosti
  if (kz0 > cz0 - 20 || kz1 < cz0 + cw + 20 || kz0 - T < P.roomMin || D - kz1 - T < P.roomMin) return null;
  const hi = rng.chance(0.5); // hala na konci s větším x?
  const [mx0, mx1] = hi ? [0, W - coreW - T] : [coreW + T, W];
  const [sx0, sx1] = hi ? [W - coreW, W] : [0, coreW];
  if (mx1 - mx0 < 3 * P.roomMin) return null;
  const divider = hi ? [W - coreW - T, W - coreW] : [coreW, coreW + T];
  const Pb = { ...P, corridorTrigger: Infinity, crossTrigger: Infinity };
  const out = { leaves: [], slabs: [] };
  for (let f = 0; f < P.floors; f++) {
    const frng = rng.fork(`floor${f}`);
    out.slabs.push(
      slab(f, 1, 0, D, divider[0], divider[1]),
      slab(f, 0, mx0, mx1, cz0 - T, cz0),
      slab(f, 0, mx0, mx1, cz0 + cw, cz0 + cw + T),
      slab(f, 0, sx0, sx1, kz0 - T, kz0),
      slab(f, 0, sx0, sx1, kz1, kz1 + T),
    );
    out.leaves.push({ f, kind: 'corridor', min: [mx0, cz0], max: [mx1, cz0 + cw] });
    bsp({ min: [mx0, 0], max: [mx1, cz0 - T] }, f, Pb, frng.fork('south'), out, 1);
    bsp({ min: [mx0, cz0 + cw + T], max: [mx1, D] }, f, Pb, frng.fork('north'), out, 1);
    bsp({ min: [sx0, 0], max: [sx1, kz0 - T] }, f, Pb, frng.fork('core_s'), out, 1);
    bsp({ min: [sx0, kz1 + T], max: [sx1, D] }, f, Pb, frng.fork('core_n'), out, 1);
    out.slabs.push(slab(f, 0, -T, W + T, -T, 0), slab(f, 0, -T, W + T, D, D + T), slab(f, 1, 0, D, -T, 0), slab(f, 1, 0, D, W, W + T));
  }
  const cells = [{ i: 0, f: 0, tall: P.floors > 1, kind: 'hall', min: [sx0, kz0], max: [sx1, kz1] }];
  for (const l of out.leaves) cells.push({ i: cells.length, f: l.f, tall: false, kind: l.kind, min: l.min, max: l.max });
  for (const c of cells) {
    c.y0 = floorY[c.f];
    c.y1 = c.tall ? floorY[P.floors - 1] + P.storeyH : floorY[c.f] + P.storeyH;
    c.w = c.max[0] - c.min[0];
    c.d = c.max[1] - c.min[1];
    c.area = (c.w * c.d) / 1e4;
  }
  // nádvoří kolem domu: čtyři vysoké buňky bez stropu (jižní a severní přes celou šířku i s rohy, západní a východní
  // mezi nimi), podlaha o yardDrop níž než přízemí (do vchodu se stoupá po schodech); spolu se dotýkají bez zdi
  const yards = [];
  if (P.yard) {
    const Y = snap(rng.int(P.yard[0], P.yard[1]), P.grid);
    const top = floorY[P.floors - 1] + P.storeyH;
    const rects = [
      ['s', [-T - Y, -T - Y], [W + T + Y, -T]],
      ['n', [-T - Y, D + T], [W + T + Y, D + T + Y]],
      ['w', [-T - Y, -T], [-T, D + T]],
      ['e', [W + T, -T], [W + T + Y, D + T]],
    ];
    // každá strana po úsecích kolem P.yardChunk (menší buňka vidí okny méně místností: rozpočet viditelného)
    // čelo domu se schodištěm: předěly 1 m za okraji haly (schody před vchodem nesmějí do průchodu mezi úseky)
    const end = hi ? 'e' : 'w';
    for (const [side, min, max] of rects) {
      const k = max[0] - min[0] >= max[1] - min[1] ? 0 : 1;
      let cuts;
      if (side === end) cuts = [snap(kz0 - 100, P.grid), snap(kz1 + 100, P.grid)].filter((z) => z > min[k] + 300 && z < max[k] - 300);
      else {
        const n = Math.max(1, Math.round((max[k] - min[k]) / P.yardChunk));
        cuts = Array.from({ length: n - 1 }, (_, j) => snap(min[k] + ((max[k] - min[k]) * (j + 1)) / n, P.grid));
      }
      const pts = [min[k], ...cuts, max[k]];
      for (let j = 0; j + 1 < pts.length; j++) {
        const [lo, hi2] = [pts[j], pts[j + 1]];
        const cmin = [...min];
        const cmax = [...max];
        cmin[k] = lo;
        cmax[k] = hi2;
        const c = { i: cells.length, f: 0, tall: true, open: true, kind: 'yard', side, part: j, min: cmin, max: cmax, y0: -P.yardDrop, y1: top };
        c.w = cmax[0] - cmin[0];
        c.d = cmax[1] - cmin[1];
        c.area = (c.w * c.d) / 1e4;
        cells.push(c);
        yards.push(c);
      }
    }
  }
  const ctx = { W, D, T, floorY, pitch, corridor: [cz0, cz0 + cw], core: { x: [sx0, sx1], z: [kz0, kz1], hi } };
  P.classify(cells, ctx, rng.fork('classify'));
  const segments = segment(out.slabs, cells, floorY, T);
  let cands = candidates(segments, cells, floorY, P);
  let windows = [];
  if (yards.length) {
    // z nádvoří vede jen vchod do schodišťové haly v přízemí; ostatní zdi do nádvoří nesou okna (windowAt předvolby)
    const isYard = (c) => c.kind === 'yard';
    cands = cands.filter((e) => {
      const [a, b] = [cells[e.a], cells[e.b]];
      if (!isYard(a) && !isYard(b)) return true;
      const other = isYard(a) ? b : a;
      return other.kind === 'hall' && segments[e.seg].f === 0;
    });
    // úseky nádvoří, které se dotýkají stěnou aspoň 1 m, spojí průchod bez zdi
    for (const p of yards) {
      for (const q of yards) {
        if (q.i <= p.i) continue;
        const touch = [0, 1].some((k) => (p.max[k] === q.min[k] || q.max[k] === p.min[k]) && Math.min(p.max[1 - k], q.max[1 - k]) - Math.max(p.min[1 - k], q.min[1 - k]) >= 100);
        if (touch) cands.push({ seg: -1, a: p.i, b: q.i, sill: -P.yardDrop, head: p.y1 + P.yardDrop, gallery: false, virtual: true });
      }
    }
    windows = houseWindows(segments, cells, floorY, P);
  }
  const start = P.pickStart(cells, ctx);
  const edges = connect(cells, cands, P, rng.fork('doors'), start);
  if (!edges) return null;
  return { W, D, T, pitch, floorY, cells, segments, edges, start, hall: 0, windows, yards: yards.map((c) => c.i) };
}

/**
 * Okna ve zdech mezi domem a nádvořím: P.windowAt(buňka domu, úsek) dá druh ('clear' průhledné s portálem jen pro
 * pohled, 'frosted' matné bez portálu) nebo null. Parapet 90 cm nad podlahou podlaží, výška 130 cm, šířka 150 nebo
 * 120 cm podle délky úseku, od konců úseku aspoň 90 cm; na úsek od 6,6 m dvě okna.
 */
function houseWindows(segments, cells, floorY, P) {
  const out = [];
  segments.forEach((s, si) => {
    if (s.A < 0 || s.B < 0) return;
    const [A, B] = [cells[s.A], cells[s.B]];
    const yard = A.kind === 'yard' ? A : B.kind === 'yard' ? B : null;
    const X = yard === A ? B : A;
    if (!yard || X.kind === 'yard' || (X.kind === 'hall' && s.f === 0)) return;
    const kind = P.windowAt(X, s);
    if (!kind) return;
    // od konců úseku aspoň 90 cm: u rohu domu a u předělu nádvoří nic nevyčnívá do průchodu (šířka hráče 74 cm)
    const len = s.v - s.u;
    const w = len >= 330 ? 150 : len >= 300 ? 120 : 0;
    if (!w) return;
    const n = len >= 660 ? 2 : 1;
    const sill = floorY[s.f] + 90;
    for (let k = 0; k < n; k++) {
      const mid = s.u + Math.round((len * (2 * k + 1)) / (2 * n) / 10) * 10;
      out.push({ seg: si, house: X.i, yard: yard.i, kind, w, c0: mid - w / 2, c1: mid + w / 2, sill, top: sill + 130 });
    }
  });
  return out;
}

/** Sdílí buňky a a b zeď (tloušťky T) s průnikem aspoň need? Jen buňky téhož podlaží. */
export function sharesWall(a, b, T, need) {
  if (a.f !== b.f || a.tall || b.tall) return false;
  for (const ax of [0, 1]) {
    const o = 1 - ax;
    if (a.max[ax] + T === b.min[ax] || b.max[ax] + T === a.min[ax]) {
      if (Math.min(a.max[o], b.max[o]) - Math.max(a.min[o], b.min[o]) >= need) return true;
    }
  }
  return false;
}
