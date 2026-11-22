// xGen, hrubá stavba: z plánu (layout.js) udělá buňky, kvádry, portály a dveře v portálech.
// Zvláštní stavby: galerie haly se schodištěm (dvě patra), rampa s plošinou (jedno patro),
// schody do zapuštěných místností a sloupy. Vybavení přidává furnish.js.
// Délky v plánu jsou centimetry; do dat jdou metry přes Vcm a m.

import { createBuilder, floorSlab, ceilingSlab, wallRun, portalQuad, stairs, ramp, block, pillar, RUN_X } from './kit.js';
import { m, Vcm, V, pad } from './util.js';

const rectOf = (c) => ({ x0: c.min[0], x1: c.max[0], z0: c.min[1], z1: c.max[1] });
/** Kvádr v metrech ze souřadnic v centimetrech. kind: 'solid' = stojí tam něco pevného, 'zone' = má zůstat volno. */
export const boxM = (x0, y0, z0, x1, y1, z1, kind = 'solid') => ({ min: [m(Math.min(x0, x1)), m(y0), m(Math.min(z0, z1))], max: [m(Math.max(x0, x1)), m(y1), m(Math.max(z0, z1))], kind });
/** Kvádr zadaný podél zdi (a) a kolmo na ni (n). */
const runBox = (run, a0, a1, n0, n1, y0, y1, kind) => (run === RUN_X ? boxM(a0, y0, n0, a1, y1, n1, kind) : boxM(n0, y0, a0, n1, y1, a1, kind));
export const boxesHit = (p, q, eps = 0.001) => [0, 1, 2].every((k) => Math.min(p.max[k], q.max[k]) - Math.max(p.min[k], q.min[k]) > eps);

/** Zábradlí podél hrany: úsek lo…hi vyplní dílci 2 m a 1 m, zbytek rozdělí na oba konce. */
function railRun(S, cellId, run, lo, hi, fixed, y, railings) {
  const L = hi - lo;
  const n2 = Math.floor(L / 200);
  const n1 = L - n2 * 200 >= 100 ? 1 : 0;
  let cur = lo + (L - n2 * 200 - n1 * 100) / 2;
  for (let i = 0; i < n2 + n1; i++) {
    const len = i < n2 ? 200 : 100;
    const c = cur + len / 2;
    S.entities.push({ id: S.eid('rail'), prefab: railings[i < n2 ? 0 : 1], cell: cellId, pos: run === RUN_X ? Vcm(c, y, fixed) : Vcm(fixed, y, c), rot: V(0, run === RUN_X ? 0 : 90, 0) });
    cur += len;
  }
}

/** Galerie haly ve výšce horního patra, schodiště z plných stupňů, sloupy pod rohy a zábradlí. */
function hallGallery(b, S, plan, P, preset, rng) {
  const h = plan.cells[plan.hall];
  const id = S.meta[h.i].id;
  const G = plan.floorY[1];
  const gw = P.galleryW;
  const [x0, x1, z0, z1] = [h.min[0], h.max[0], h.min[1], h.max[1]];
  const [ix0, ix1, iz0, iz1] = [x0 + gw, x1 - gw, z0 + gw, z1 - gw];
  const pal = preset.palette;
  for (const r of [{ x0, x1, z0, z1: iz0 }, { x0, x1, z0: iz1, z1 }, { x0, x1: ix0, z0: iz0, z1: iz1 }, { x0: ix1, x1, z0: iz0, z1: iz1 }]) block(b, id, r, G - plan.T, G, pal.gallery, 'gallery');

  const steps = Math.round(G / P.riser) - 1; // poslední výšku stupně tvoří hrana galerie
  const run = steps * P.tread;
  const alongX = ix1 - ix0 >= iz1 - iz0;
  const [a0, a1, s0min, s1max] = alongX ? [ix0, ix1, iz0, iz1] : [iz0, iz1, ix0, ix1];
  if (a1 - a0 < run + 120 || s1max - s0min < P.stairW + 200) return false;
  const dir = rng.chance(0.5) ? 1 : -1;
  const end = dir > 0 ? a1 : a0;
  const at = end - dir * run;
  const s0 = rng.chance(0.5) ? s0min : s1max - P.stairW;
  const s1 = s0 + P.stairW;
  stairs(b, { cell: id, run: alongX ? 0 : 1, dir, at, s0, s1, baseY: 0, steps, riser: P.riser, tread: P.tread, mat: pal.stair });
  const flight = alongX ? boxM(at, 0, s0, end, G, s1) : boxM(s0, 0, at, s1, G, end);
  const foot = alongX ? boxM(at - dir * 120, 0, s0, at, 220, s1, 'zone') : boxM(s0, 0, at - dir * 120, s1, 220, at, 'zone');
  S.zones[h.i].push(flight, foot);

  for (const [cx, cz] of [[ix0 - 20, iz0 - 20], [ix1 + 20, iz0 - 20], [ix0 - 20, iz1 + 20], [ix1 + 20, iz1 + 20]]) {
    pillar(b, id, cx, cz, 30, 0, G - plan.T, pal.core);
    S.zones[h.i].push(boxM(cx - 15, 0, cz - 15, cx + 15, G, cz + 15));
  }

  // zábradlí po vnitřním obvodu galerie; v místě, kde schody ústí na galerii, je mezera
  const rails = preset.railings;
  const edge = (runAxis, lo, hi, fixed, gap) => {
    const parts = gap ? [[lo, gap[0]], [gap[1], hi]] : [[lo, hi]];
    for (const [p, q] of parts) if (q - p >= 100) railRun(S, id, runAxis, p, q, fixed, G, rails);
  };
  const inset = 4;
  if (alongX) {
    edge(0, ix0, ix1, iz0 - inset);
    edge(0, ix0, ix1, iz1 + inset);
    edge(1, iz0, iz1, ix0 - inset, dir < 0 ? [s0, s1] : null);
    edge(1, iz0, iz1, ix1 + inset, dir > 0 ? [s0, s1] : null);
  } else {
    edge(1, iz0, iz1, ix0 - inset);
    edge(1, iz0, iz1, ix1 + inset);
    edge(0, ix0, ix1, iz0 - inset, dir < 0 ? [s0, s1] : null);
    edge(0, ix0, ix1, iz1 + inset, dir > 0 ? [s0, s1] : null);
  }
  S.hall = { cell: h.i, gallery: G, inner: [ix0, ix1, iz0, iz1] };
  return true;
}

/** Nakládací plošina v rohu haly s rampou a krátkým schodištěm (jednopatrová varianta). */
function hallDock(b, S, plan, P, preset) {
  const h = plan.cells[plan.hall];
  const id = S.meta[h.i].id;
  const [x0, z0] = h.min;
  const H = 100;
  const pal = preset.palette;
  block(b, id, { x0, x1: x0 + 400, z0, z1: z0 + 300 }, 0, H, pal.platform, 'platform');
  ramp(b, id, { x0: x0 + 400, x1: x0 + 720, z0, z1: z0 + 160 }, 0, H, '-x', pal.stair);
  stairs(b, { cell: id, run: 1, dir: -1, at: z0 + 300 + 4 * P.tread, s0: x0 + 140, s1: x0 + 260, baseY: 0, steps: 4, riser: 20, tread: P.tread, mat: pal.stair });
  S.zones[h.i].push(boxM(x0, 0, z0, x0 + 400, 300, z0 + 300), boxM(x0 + 400, 0, z0, x0 + 720, 220, z0 + 160), boxM(x0 + 720, 0, z0, x0 + 840, 220, z0 + 160, 'zone'));
  S.zones[h.i].push(boxM(x0 + 140, 0, z0 + 300, x0 + 260, 220, z0 + 300 + 4 * P.tread), boxM(x0 + 120, 0, z0 + 300 + 4 * P.tread, x0 + 280, 220, z0 + 420 + 4 * P.tread, 'zone'));
  return true;
}

/** Schody z prahu dolů do zapuštěné místnosti. Vrací false, když by se dvoje schody srazily. */
function sunkSteps(b, S, P, preset, o, X, isA) {
  const drop = o.sill - X.y0;
  const steps = Math.round(drop / P.riser) - 1;
  if (steps < 1) return true;
  const s = o.s;
  const face = isA ? s.b0 : s.b1;
  const into = isA ? -1 : 1;
  const depth = steps * P.tread;
  const r = s.run;
  const s0 = Math.max(X.min[r], o.c0 - 20);
  const s1 = Math.min(X.max[r], o.c1 + 20);
  const solid = runBox(r, s0, s1, face, face + into * depth, X.y0, o.sill, 'solid');
  const landing = runBox(r, s0, s1, face + into * depth, face + into * (depth + 100), X.y0, o.top, 'zone');
  // schody nesmí vlézt do jiných schodů ani před jiný otvor téže místnosti
  if (S.zones[X.i].some((z) => (z.steps && (boxesHit(z, solid) || boxesHit(z, landing))) || (z.o && z.o !== o && boxesHit(z, solid)))) return false;
  stairs(b, { cell: S.meta[X.i].id, run: 1 - r, dir: -into, at: face + into * depth, s0, s1, baseY: X.y0, steps, riser: P.riser, tread: P.tread, mat: preset.palette.stair });
  S.zones[X.i].push({ ...solid, steps: true }, { ...landing, steps: true });
  return true;
}

/**
 * @returns stavba S { brushes, cells, portals, entities, meta, sides, zones, openings, hall?, eid() } nebo null, když pokus nevyšel
 */
export function buildStructure(preset, P, plan, catalog, rng) {
  const { cells, segments, T } = plan;
  const b = createBuilder();
  const counters = {};
  const seq = {};
  const S = {
    brushes: b.brushes,
    cells: [],
    portals: [],
    entities: [],
    openings: [],
    sides: cells.map(() => []),
    zones: cells.map(() => []),
    hall: null,
    eid: (prefix) => `e_${prefix}_${pad((seq[prefix] = (seq[prefix] || 0) + 1), 2)}`,
  };
  const floorName = (c) => (P.floors < 2 ? '' : c.tall ? ' · obě patra' : c.f === 0 ? ' · přízemí' : ` · ${c.f}. patro`);
  S.meta = cells.map((c) => {
    const key = preset.cellKey(c);
    const n = (counters[key] = (counters[key] || 0) + 1);
    return { id: `c_${key}_${pad(n, 2)}`, name: `${preset.cellName(c)} ${n}${floorName(c)}`, mats: preset.materials(c), zone: preset.zone(c) };
  });

  // 1) styl a poloha otvorů
  const ops = plan.edges.map((e) => {
    const s = segments[e.seg];
    const [A, B] = [cells[e.a], cells[e.b]];
    const len = s.v - s.u;
    let style = preset.opening(A, B, { len, head: e.head, gallery: e.gallery, tree: e.tree, margin: P.margin }, rng, catalog);
    if (style.slide && len < style.w + P.margin + 100) style = preset.fallbackDoor(catalog); // posuvné křídlo potřebuje metr zdi na kapsu
    return { e, s, A, B, len, style, plane: (s.b0 + s.b1) / 2, sill: e.sill, doorIds: [] };
  });
  const isDoor = (o) => o.style.kind === 'door';
  const fb = preset.fallbackDoor(catalog);
  for (const o of ops) {
    if (ops.filter(isDoor).length >= P.minDoors) break;
    if (!isDoor(o) && o.e.head >= fb.h + 10 && o.len >= fb.w + 2 * P.margin) o.style = fb;
  }
  if (ops.filter(isDoor).length < P.minDoors) return null;
  for (const o of ops) {
    const w = Math.min(o.style.w, o.len - 2 * P.margin);
    const h = Math.min(o.style.h, o.e.head - 10);
    let lo = o.s.u + P.margin;
    let hi = o.s.v - P.margin - w;
    if (o.style.slide) {
      const sides = [];
      if (o.s.v - 100 - w >= lo) sides.push('hi');
      if (o.s.u + 100 <= hi) sides.push('lo');
      o.pocket = rng.pick(sides);
      if (o.pocket === 'hi') hi = o.s.v - 100 - w;
      else lo = o.s.u + 100;
    }
    o.c0 = o.style.center ? Math.round(o.s.u + (o.len - w) / 2) : lo + 5 * rng.int(0, Math.floor((hi - lo) / 5));
    o.c1 = o.c0 + w;
    o.top = o.sill + h;
  }
  S.openings = ops;

  // 2) podlahy a stropy
  cells.forEach((c, i) => {
    const mt = S.meta[i];
    floorSlab(b, mt.id, rectOf(c), c.y0, mt.mats.floor, T);
    ceilingSlab(b, mt.id, rectOf(c), c.y1, mt.mats.ceiling, T);
    S.cells.push({ id: mt.id, name: mt.name, bounds: { min: Vcm(c.min[0], c.y0, c.min[1]), max: Vcm(c.max[0], c.y1, c.max[1]) }, zone: mt.zone });
  });

  // 3) zdi: každý úsek jednou, vlastní ho jedna buňka; líce nesou povrch místnosti, do které se dívají
  const bySeg = new Map();
  for (const o of ops) bySeg.set(o.e.seg, [...(bySeg.get(o.e.seg) || []), o]);
  segments.forEach((s, si) => {
    const owner = S.meta[s.owner];
    const here = bySeg.get(si) || [];
    const high = here.length ? (here[0].A.y0 >= here[0].B.y0 ? here[0].A : here[0].B) : null;
    wallRun(b, {
      cell: owner.id,
      run: s.run,
      u: s.u,
      v: s.v,
      b0: s.b0,
      b1: s.b1,
      y0: s.y0,
      y1: s.y1,
      mat: preset.palette.core,
      faceLo: s.A >= 0 ? S.meta[s.A].mats.wall : undefined,
      faceHi: s.B >= 0 ? S.meta[s.B].mats.wall : undefined,
      sillMat: high ? S.meta[high.i].mats.floor : undefined,
      openings: here.map((o) => ({ c0: o.c0, c1: o.c1, sill: o.sill, top: o.top })),
    });
  });

  // 4) portály, dveře, strany buněk a volné zóny před otvory
  ops.forEach((o, k) => {
    const { s, style, A, B } = o;
    const portal = { id: `p_${pad(k + 1, 2)}`, a: S.meta[A.i].id, b: S.meta[B.i].id, quad: portalQuad(s.run, o.c0, o.c1, o.plane, o.sill, o.top) };
    if (isDoor(o)) {
      const along = (o.c0 + o.c1) / 2;
      const pos = s.run === RUN_X ? Vcm(along, o.sill, o.plane) : Vcm(o.plane, o.sill, along);
      let ry;
      if (style.slide) ry = s.run === RUN_X ? (o.pocket === 'hi' ? 0 : 180) : o.pocket === 'hi' ? -90 : 90;
      else {
        o.into = preset.swingInto(A, B, rng);
        ry = o.into === 'a' ? (s.run === RUN_X ? 0 : 90) : s.run === RUN_X ? 180 : -90;
      }
      for (const prefab of style.pair || [style.prefab]) {
        const id = S.eid('door');
        S.entities.push({ id, prefab, cell: S.meta[A.i].id, pos, rot: V(0, ry, 0) });
        o.doorIds.push(id);
      }
      if (o.doorIds.length === 2) {
        // dvoukřídlé dveře jsou dvě entity: jedno křídlo otevře druhé (formát verze 1 má jeden kloub na interakci)
        const [l, r] = o.doorIds.map((id) => S.entities.find((x) => x.id === id));
        l.io = [{ on: 'opened', target: r.id, input: 'open' }, { on: 'closed', target: r.id, input: 'close' }];
        r.io = [{ on: 'opened', target: l.id, input: 'open' }, { on: 'closed', target: l.id, input: 'close' }];
      }
      portal.door = o.doorIds[0];
    }
    S.portals.push(portal);
    for (const [X, face, n] of [[A, s.b0, -1], [B, s.b1, 1]]) {
      const lowSide = !o.e.gallery && X.y0 < o.sill;
      S.sides[X.i].push({ run: s.run, face, n, c0: o.c0, c1: o.c1, sill: o.sill, top: o.top, o });
      S.zones[X.i].push({ ...runBox(s.run, o.c0 - 15, o.c1 + 15, face, face + n * 120, lowSide ? X.y0 : o.sill, o.top, 'zone'), o });
    }
  });

  // 5) zvláštní stavby
  if (plan.hall >= 0 && !(P.floors > 1 ? hallGallery(b, S, plan, P, preset, rng) : hallDock(b, S, plan, P, preset))) return null;
  for (const o of ops) {
    if (o.e.gallery) continue;
    if (o.A.y0 < o.sill && !sunkSteps(b, S, P, preset, o, o.A, true)) return null;
    if (o.B.y0 < o.sill && !sunkSteps(b, S, P, preset, o, o.B, false)) return null;
  }
  cells.forEach((c, i) => {
    if (!preset.pillars || !preset.pillars(c)) return;
    const [cx, cz] = [[c.min[0] + Math.round(c.w / 30) * 10, c.max[0] - Math.round(c.w / 30) * 10], [c.min[1] + Math.round(c.d / 30) * 10, c.max[1] - Math.round(c.d / 30) * 10]];
    for (const x of cx) {
      for (const z of cz) {
        const box = boxM(x - 20, c.y0, z - 20, x + 20, c.y1, z + 20);
        if (S.zones[i].some((q) => boxesHit(q, box))) continue;
        pillar(b, S.meta[i].id, x, z, 40, c.y0, c.y1, preset.palette.core);
        S.zones[i].push(box);
      }
    }
  });
  return S;
}
