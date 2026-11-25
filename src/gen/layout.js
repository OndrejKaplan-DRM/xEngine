// xGen, rozvržení: ze seedu graf místností a chodeb. Dělení plochy (BSP) na buňky oddělené zdmi,
// zdi jako úseky s jedním vlastníkem, kandidáti na otvory, kostra grafu (záruka dosažitelnosti) a pár smyček.
// Vše v celých centimetrech a v půdorysu [x, z]; výšky doplňuje předvolba háčkem classify.
//
// Proč to drží kontrakt:
//  - buňky jsou listy dělení téhož obdélníku, mezi každými dvěma je zeď tloušťky T → nepřekrývají se,
//  - každá zeď je deska z jednoho dělení; desky se dotýkají, ale nepřekrývají → žádné dvojité plochy,
//  - úsek desky mezi dvěma buňkami je právě jejich společná stěna → otvor nikdy nepřesáhne žádnou z nich,
//  - každá dělicí zeď má aspoň jeden úsek dlouhý jako nejmenší rozměr buňky → graf sousedství je souvislý.

import { snap } from './util.js';

export const sub = (r, ax, lo, hi) => {
  const o = { min: [...r.min], max: [...r.max] };
  o.min[ax] = lo;
  o.max[ax] = hi;
  return o;
};
export const slab = (f, run, a0, a1, b0, b1) => ({ f, run, a0, a1, b0, b1 });

/** Rekurzivní dělení oblasti r patra f na listy (místnosti, chodby) a desky zdí. */
export function bsp(r, f, P, rng, out, depth) {
  const size = [r.max[0] - r.min[0], r.max[1] - r.min[1]];
  const la = size[0] >= size[1] ? 0 : 1; // delší osa
  const sa = 1 - la;
  const T = P.T;

  // chodba: pruh podél delší osy (páteř), hlouběji i napříč (spojka, která na páteř kolmo navazuje);
  // po obou stranách pruhu zůstane místo na místnosti
  const along = size[sa] >= P.corridorTrigger;
  const cross = depth > 0 && size[la] >= P.crossTrigger;
  const pick = depth === 0 && along ? sa : cross && rng.chance(P.crossChance) ? la : along && rng.chance(P.corridorChance) ? sa : -1;
  if (pick >= 0) {
    const ca = pick; // osa, kterou pruh dělí
    const ra = 1 - ca; // osa, podél které pruh běží
    const cw = snap(rng.int(P.corridorW[0], P.corridorW[1]), P.grid);
    const lo = r.min[ca] + P.roomMin + T;
    const hi = r.max[ca] - P.roomMin - T - cw;
    if (hi >= lo) {
      const c0 = snap(lo + (hi - lo) * rng.range(P.corridorSpread[0], P.corridorSpread[1]), P.grid);
      out.slabs.push(slab(f, ra, r.min[ra], r.max[ra], c0 - T, c0), slab(f, ra, r.min[ra], r.max[ra], c0 + cw, c0 + cw + T));
      bsp(sub(r, ca, r.min[ca], c0 - T), f, P, rng, out, depth + 1);
      out.leaves.push({ f, kind: 'corridor', ...sub(r, ca, c0, c0 + cw) });
      bsp(sub(r, ca, c0 + cw + T, r.max[ca]), f, P, rng, out, depth + 1);
      return;
    }
  }

  // příčka přes delší osu
  const canSplit = size[la] >= 2 * P.roomMin + T;
  const area = (size[0] * size[1]) / 1e4;
  const must = size[la] > P.roomMax || size[la] > P.maxAspect * size[sa];
  const want = (area - P.areaKeep) / (P.areaSplit - P.areaKeep);
  if (canSplit && (must || rng.chance(want))) {
    const lo = r.min[la] + P.roomMin;
    const hi = r.max[la] - T - P.roomMin;
    const p = snap(lo + (hi - lo) * rng.range(P.splitSpread[0], P.splitSpread[1]), P.grid);
    out.slabs.push(slab(f, sa, r.min[sa], r.max[sa], p, p + T));
    bsp(sub(r, la, r.min[la], p), f, P, rng, out, depth + 1);
    bsp(sub(r, la, p + T, r.max[la]), f, P, rng, out, depth + 1);
    return;
  }
  out.leaves.push({ f, kind: 'room', ...r });
}

/** Je buňka přítomná na patře f? Vysoká buňka (hala přes víc pater) je na všech. */
const onFloor = (c, f) => c.tall || c.f === f;

/** Rozdělí desky na úseky podle buněk po obou stranách; každý úsek má nejvýš jednu buňku z každé strany. */
export function segment(slabs, cells, floorY, T) {
  const segs = [];
  const top = floorY.length - 1;
  for (const s of slabs) {
    const r = s.run;
    const t = 1 - r;
    const near = (c) => onFloor(c, s.f) && c.min[r] < s.a1 && c.max[r] > s.a0;
    const lo = cells.filter((c) => near(c) && c.max[t] === s.b0);
    const hi = cells.filter((c) => near(c) && c.min[t] === s.b1);
    const pts = new Set([s.a0, s.a1]);
    for (const c of [...lo, ...hi]) {
      pts.add(Math.max(s.a0, c.min[r]));
      pts.add(Math.min(s.a1, c.max[r]));
    }
    const cut = [...pts].sort((p, q) => p - q);
    const first = segs.length;
    for (let i = 0; i + 1 < cut.length; i++) {
      const [u, v] = [cut[i], cut[i + 1]];
      const A = lo.find((c) => c.min[r] <= u && c.max[r] >= v);
      const B = hi.find((c) => c.min[r] <= u && c.max[r] >= v);
      const seg = { f: s.f, run: r, u, v, b0: s.b0, b1: s.b1, A: A ? A.i : -1, B: B ? B.i : -1, owner: -1, y0: 0, y1: 0, post: !A && !B };
      if (!seg.post) {
        const ys = [A, B].filter(Boolean);
        seg.owner = Math.min(...ys.map((c) => c.i));
        // svisle: od nejnižší podlahy po nejvyšší strop sousedů, oříznuto pásmem patra (zdi dvou pater se nesmí překrýt)
        seg.y0 = Math.min(...ys.map((c) => c.y0)) - T;
        seg.y1 = Math.max(...ys.map((c) => c.y1)) + T;
        if (s.f > 0) seg.y0 = Math.max(seg.y0, floorY[s.f] - T);
        if (s.f < top) seg.y1 = Math.min(seg.y1, floorY[s.f + 1] - T);
      }
      segs.push(seg);
    }
    // sloupek, kde na zeď z obou stran kolmo navazuje jiná zeď (nebo roh obvodu): přebírá sousední úsek
    for (let i = first; i < segs.length; i++) {
      if (!segs[i].post) continue;
      const nb = [segs[i - 1], segs[i + 1]].filter((x, k) => x && !x.post && i + (k ? 1 : -1) >= first);
      if (!nb.length) throw new Error('layout: sloupek zdi bez souseda');
      segs[i].owner = nb[0].owner;
      segs[i].y0 = Math.min(...nb.map((x) => x.y0));
      segs[i].y1 = Math.max(...nb.map((x) => x.y1));
    }
  }
  return segs;
}

/**
 * Kostra grafu sousedství (Primův algoritmus s váhami od předvolby) + náhodné smyčky.
 * Vrací vybrané hrany, nebo null, když graf není souvislý.
 */
export function connect(cells, cands, P, rng, start) {
  const weighted = cands.map((e) => ({ e, w: P.edgeWeight(cells[e.a], cells[e.b], e) + rng.next() }));
  const inTree = new Set([start]);
  const chosen = [];
  const used = new Set();
  while (inTree.size < cells.length) {
    let best = null;
    for (const x of weighted) {
      if (used.has(x.e) || inTree.has(x.e.a) === inTree.has(x.e.b)) continue;
      if (!best || x.w < best.w) best = x;
    }
    if (!best) return null;
    used.add(best.e);
    chosen.push({ ...best.e, tree: true });
    inTree.add(best.e.a);
    inTree.add(best.e.b);
  }
  for (const x of weighted) {
    if (used.has(x.e)) continue;
    if (rng.chance(P.loopChance(cells[x.e.a], cells[x.e.b], x.e))) chosen.push({ ...x.e, tree: false });
  }
  return chosen;
}

/**
 * Rozvržení levelu.
 * @param P parametry předvolby (délky v cm): T, grid, plot { w, d }, floors, storeyH, hall?, roomMin, roomMax,
 *   corridorW, corridorTrigger, corridorChance, crossTrigger, crossChance, corridorSpread, splitSpread, areaKeep, areaSplit, maxAspect,
 *   minOpen, margin, minHead a háčky classify(cells, ctx, rng), edgeWeight(a, b, e), loopChance(a, b, e), pickStart(cells).
 * @returns plán { W, D, T, floorY, cells, segments, edges, start } nebo null, když pokus nevyšel (volající zkusí další)
 */
export function makeLayout(P, rng) {
  const T = P.T;
  const W = snap(rng.int(P.plot.w[0], P.plot.w[1]), P.grid);
  const D = snap(rng.int(P.plot.d[0], P.plot.d[1]), P.grid);
  const pitch = P.storeyH + 2 * T; // strop spodního patra a podlaha horního jsou dvě desky nad sebou
  const floorY = Array.from({ length: P.floors }, (_, f) => f * pitch);
  const out = { leaves: [], slabs: [] };
  const plot = { min: [0, 0], max: [W, D] };

  // hala: vyhrazený roh plochy, na všech patrech stejný; z listu se stane jedna vysoká buňka
  let hall = null;
  let regions = [plot];
  const forced = [];
  if (P.hall) {
    const hw = snap(rng.int(P.hall.w[0], P.hall.w[1]), P.grid);
    const hd = snap(rng.int(P.hall.d[0], P.hall.d[1]), P.grid);
    if (W - hw - T < P.roomMin * 2 || D - hd - T < P.roomMin) return null;
    const cx = rng.chance(0.5);
    const cz = rng.chance(0.5);
    const strip = cx ? sub(plot, 0, W - hw, W) : sub(plot, 0, 0, hw);
    const rest = cx ? sub(plot, 0, 0, W - hw - T) : sub(plot, 0, hw + T, W);
    hall = cz ? sub(strip, 1, D - hd, D) : sub(strip, 1, 0, hd);
    const side = cz ? sub(strip, 1, 0, D - hd - T) : sub(strip, 1, hd + T, D);
    forced.push([1, 0, D, cx ? W - hw - T : hw, cx ? W - hw : hw + T], [0, strip.min[0], strip.max[0], cz ? D - hd - T : hd, cz ? D - hd : hd + T]);
    regions = [rest, side];
  }

  for (let f = 0; f < P.floors; f++) {
    const frng = rng.fork(`floor${f}`);
    for (const [run, a0, a1, b0, b1] of forced) out.slabs.push(slab(f, run, a0, a1, b0, b1));
    for (const r of regions) bsp(r, f, P, frng, out, 0);
    // obvod: zdi podél X berou i rohy
    out.slabs.push(slab(f, 0, -T, W + T, -T, 0), slab(f, 0, -T, W + T, D, D + T), slab(f, 1, 0, D, -T, 0), slab(f, 1, 0, D, W, W + T));
  }

  const cells = [];
  if (hall) cells.push({ i: 0, f: 0, tall: P.floors > 1, kind: 'hall', min: hall.min, max: hall.max });
  for (const l of out.leaves) cells.push({ i: cells.length, f: l.f, tall: false, kind: l.kind, min: l.min, max: l.max });
  for (const c of cells) {
    c.y0 = floorY[c.f];
    c.y1 = c.tall ? floorY[P.floors - 1] + P.storeyH : floorY[c.f] + P.storeyH;
    c.w = c.max[0] - c.min[0];
    c.d = c.max[1] - c.min[1];
    c.area = (c.w * c.d) / 1e4;
  }
  const ctx = { W, D, T, floorY, pitch };
  P.classify(cells, ctx, rng.fork('classify'));

  const segments = segment(out.slabs, cells, floorY, T);
  const cands = candidates(segments, cells, floorY, P);
  const start = P.pickStart(cells, ctx);
  const edges = connect(cells, cands, P, rng.fork('doors'), start);
  if (!edges) return null;
  return { W, D, T, pitch, floorY, cells, segments, edges, start, hall: hall ? 0 : -1 };
}

/** Kandidáti na otvory: úseky zdí mezi dvěma buňkami, kudy projde člověk (u vysoké buňky galerií patra). */
export function candidates(segments, cells, floorY, P) {
  const cands = [];
  segments.forEach((s, si) => {
    if (s.A < 0 || s.B < 0) return;
    const [a, b] = [cells[s.A], cells[s.B]];
    const sill = Math.max(a.y0, b.y0);
    // vysoká hala sousedí s horním patrem jen přes galerii; její podlaha je níž, práh určuje patro
    const gallery = (a.tall || b.tall) && s.f > 0;
    const level = gallery ? floorY[s.f] : sill;
    const head = Math.min(a.y1, b.y1) - level;
    if (s.v - s.u < P.minOpen + 2 * P.margin || head < P.minHead) return;
    if (!gallery && Math.abs(a.y0 - b.y0) > P.maxStep) return;
    cands.push({ seg: si, a: s.A, b: s.B, sill: level, head, gallery });
  });
  return cands;
}
