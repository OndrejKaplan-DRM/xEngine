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
  const ctx = { W, D, T, floorY, pitch, corridor: [cz0, cz0 + cw], core: { x: [sx0, sx1], z: [kz0, kz1], hi } };
  P.classify(cells, ctx, rng.fork('classify'));
  const segments = segment(out.slabs, cells, floorY, T);
  const cands = candidates(segments, cells, floorY, P);
  const start = P.pickStart(cells, ctx);
  const edges = connect(cells, cands, P, rng.fork('doors'), start);
  if (!edges) return null;
  return { W, D, T, pitch, floorY, cells, segments, edges, start, hall: 0 };
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
