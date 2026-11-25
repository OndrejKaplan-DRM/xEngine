// xGen, hrubá stavba: z plánu (layout.js) udělá buňky, kvádry, portály a dveře v portálech.
// Zvláštní stavby: galerie haly se schodištěm (dvě patra), rampa s plošinou (jedno patro),
// schody do zapuštěných místností a sloupy. Vybavení přidává furnish.js.
// Délky v plánu jsou centimetry; do dat jdou metry přes Vcm a m.

import { createBuilder, floorSlab, ceilingSlab, wallRun, portalQuad, stairs, ramp, block, pillar, RUN_X } from './kit.js';
import { m, Vcm, V, pad } from './util.js';
import { bodyWidth } from './body.js';
import { windowOpenings, buildWindows, yardPortals } from './exterior.js';

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

/**
 * Schodišťová hala domu přes všechna podlaží: na každém podlaží galerie po obvodu (chodby a místnosti do ní ústí
 * kdekoli), mezi podlažími přímá ramena střídavě ve dvou pruzích podél delší osy (sudé rameno jedním směrem, liché
 * zpět), u ramene, které nezačíná u galerie, podesta. Ramena nad sebou jsou o dvě podlaží výš (volná výška 6,8 m),
 * pod galerií je výška patra bez desky. Sloupy pod rohy galerií, zábradlí po vnitřním obvodu s mezerami u ramen
 * a na ramenech u zrcadla; s P.soffit zubaté podhledí a pod prvním ramenem věci z preset.underStairs.
 */
function stairCore(b, S, plan, P, preset, rng, catalog) {
  const h = plan.cells[plan.hall];
  const id = S.meta[h.i].id;
  const gw = P.galleryW;
  const T = plan.T;
  const F = plan.floorY.length;
  const pal = preset.palette;
  const [x0, x1, z0, z1] = [h.min[0], h.max[0], h.min[1], h.max[1]];
  const [ix0, ix1, iz0, iz1] = [x0 + gw, x1 - gw, z0 + gw, z1 - gw];
  const alongX = ix1 - ix0 >= iz1 - iz0;
  const [a0, a1, s0, s1] = alongX ? [ix0, ix1, iz0, iz1] : [iz0, iz1, ix0, ix1];
  const steps = Math.round(plan.pitch / P.riser) - 1;
  const run = steps * P.tread;
  if (a1 - a0 < run + 120 || s1 - s0 < 2 * P.stairW + 120) return false;
  const R = (p, q, u, v) => (alongX ? { x0: p, x1: q, z0: u, z1: v } : { x0: u, x1: v, z0: p, z1: q });
  const Z = (r, y0, y1, kind) => boxM(r.x0, y0, r.z0, r.x1, y1, r.z1, kind);
  const at3 = (along, y, across) => (alongX ? Vcm(along, y, across) : Vcm(across, y, along));
  for (let f = 1; f < F; f++) {
    const G = plan.floorY[f];
    for (const r of [{ x0, x1, z0, z1: iz0 }, { x0, x1, z0: iz1, z1 }, { x0, x1: ix0, z0: iz0, z1: iz1 }, { x0: ix1, x1, z0: iz0, z1: iz1 }]) block(b, id, r, G - T, G, pal.gallery, 'gallery');
  }
  const lanes = [[s0, s0 + P.stairW], [s1 - P.stairW, s1]];
  const flights = [];
  for (let f = 0; f + 1 < F; f++) {
    const even = f % 2 === 0;
    const [u, v] = lanes[even ? 0 : 1];
    const dir = even ? 1 : -1;
    const end = even ? a1 : a0;
    const at = end - dir * run;
    const base = plan.floorY[f];
    stairs(b, { cell: id, run: alongX ? 0 : 1, dir, at, s0: u, s1: v, baseY: base, steps, riser: P.riser, tread: P.tread, mat: pal.stair, soffit: P.soffit });
    flights.push({ f, u, v, dir, at, end, base, even });
    const [p, q] = even ? [at, end] : [end, at];
    if (f > 0 || !P.soffit) S.zones[h.i].push(Z(R(p, q, u, v), base, plan.floorY[f + 1]));
    else {
      // pod prvním ramenem je volno: zóna každého stupně jen od jeho podhledí nahoru
      for (let i = 1; i <= steps; i++) {
        const [c, d] = [at + dir * (i - 1) * P.tread, at + dir * i * P.tread];
        S.zones[h.i].push(Z(R(Math.min(c, d), Math.max(c, d), u, v), Math.max(base, base + i * P.riser - P.soffit), plan.floorY[f + 1]));
      }
    }
    if (f === 0) {
      const foot = even ? R(at - 120, at, u, v) : R(at, at + 120, u, v);
      S.zones[h.i].push(Z(foot, 0, 220, 'zone'));
    } else {
      // podesta od galerie k patě ramena
      const [l0, l1] = even ? [a0, at] : [at, a1];
      if (l1 > l0) block(b, id, R(l0, l1, u, v), base - T, base, pal.gallery, 'gallery');
    }
  }
  // sloupy pod rohy galerií, mezi každými dvěma podlažími zvlášť (deska galerie je mezi nimi)
  for (const [cx, cz] of [[ix0 - 20, iz0 - 20], [ix1 + 20, iz0 - 20], [ix0 - 20, iz1 + 20], [ix1 + 20, iz1 + 20]]) {
    for (let f = 0; f + 1 < F; f++) pillar(b, id, cx, cz, 30, plan.floorY[f], plan.floorY[f + 1] - T, pal.core);
    S.zones[h.i].push(boxM(cx - 15, 0, cz - 15, cx + 15, plan.floorY[1] - T, cz + 15));
  }
  // zábradlí: dlouhé hrany galerie celé, krátké hrany jen mezi pruhy ramen (ramena a podesty ústí na krátké strany)
  const rails = preset.railings;
  const inset = 4;
  const ra = alongX ? 0 : 1;
  for (let f = 1; f < F; f++) {
    const G = plan.floorY[f];
    for (const fixed of [s0 - inset, s1 + inset]) if (a1 - a0 >= 100) railRun(S, id, ra, a0, a1, fixed, G, rails);
    for (const fixed of [a0 - inset, a1 + inset]) if (lanes[1][0] - lanes[0][1] >= 100) railRun(S, id, 1 - ra, lanes[0][1], lanes[1][0], fixed, G, rails);
  }
  // zábradlí ramen na straně zrcadla schodiště (díly podle stupňů, jen když sedí na rozměr stupně předvolby)
  const piece = (pid) => catalog && catalog.has(pid) && catalog.get(pid).source && catalog.get(pid).source.params;
  const pieces = ['railing_stair_01', 'railing_stair_02'].map((pid) => [pid, piece(pid)]).filter(([, q]) => q && Math.round(q.riser * 100) === P.riser && Math.round(q.tread * 100) === P.tread);
  if (pieces.length && Math.max(...pieces.map(([, q]) => q.last)) === steps) {
    for (const fl of flights) {
      const across = fl.even ? fl.v - inset : fl.u + inset;
      const ry = alongX ? (fl.dir > 0 ? 0 : 180) : fl.dir > 0 ? -90 : 90;
      for (const [pid, q] of pieces) S.entities.push({ id: S.eid('rail'), prefab: pid, cell: id, pos: at3(fl.at + fl.dir * (q.first - 1) * P.tread, fl.base + (q.first - 1) * P.riser, across), rot: V(0, ry, 0) });
    }
  }
  // prostor pod prvním ramenem: od horního konce dolů, co se vejde pod podhledí (preset.underStairs)
  if (P.soffit && catalog && preset.underStairs) {
    const fl = flights[0];
    const clear = (x) => (Math.floor(x / P.tread) + 1) * P.riser - P.soffit; // podhledí nad vzdáleností x od paty
    let cur = run - 10;
    for (const pid of preset.underStairs) {
      if (!catalog.has(pid)) continue;
      const rb = catalog.restBox(pid);
      const w = Math.ceil((rb.max[0] - rb.min[0]) * 100);
      const ht = Math.ceil((rb.max[1] - rb.min[1]) * 100);
      const p = cur - w;
      if (p < 0 || clear(p) < ht + 5) continue;
      const pos = at3(fl.at + fl.dir * (p + w / 2), fl.base, (fl.u + fl.v) / 2);
      const ry = alongX ? 0 : 90;
      const e = { id: S.eid(pid.replace(/_\d+$/, '')), prefab: pid, cell: id, pos, rot: V(0, ry, 0) };
      S.entities.push(e);
      S.zones[h.i].push({ ...catalog.worldBox(pid, pos, ry, 'rest'), kind: 'solid', e });
      cur = p - 10;
    }
  }
  S.hall = { cell: h.i, gallery: plan.floorY[1], inner: [ix0, ix1, iz0, iz1], stairs: true };
  return true;
}

/**
 * Nakládací plošina v rohu haly s rampou a krátkým schodištěm (jednopatrová varianta).
 * Zkouší čtyři rohy v náhodném pořadí a vezme první, kde plošina nezakryje žádný otvor.
 */
function hallDock(b, S, plan, P, preset, rng) {
  const h = plan.cells[plan.hall];
  const id = S.meta[h.i].id;
  const H = 100;
  const pal = preset.palette;
  const run = 4 * P.tread;
  for (const [X, dx, Z, dz] of rng.shuffle([[h.min[0], 1, h.min[1], 1], [h.max[0], -1, h.min[1], 1], [h.min[0], 1, h.max[1], -1], [h.max[0], -1, h.max[1], -1]])) {
    const R = (x0, x1, z0, z1) => ({ x0: Math.min(X + dx * x0, X + dx * x1), x1: Math.max(X + dx * x0, X + dx * x1), z0: Math.min(Z + dz * z0, Z + dz * z1), z1: Math.max(Z + dz * z0, Z + dz * z1) });
    const zone = (r, y1, kind) => boxM(r.x0, 0, r.z0, r.x1, y1, r.z1, kind);
    const deck = R(0, 400, 0, 300);
    const slope = R(400, 720, 0, 160);
    const steps = R(140, 260, 300, 300 + run);
    const solid = [zone(deck, 300), zone(slope, 220), zone(steps, 220)];
    const free = [zone(R(720, 840, 0, 160), 220, 'zone'), zone(R(120, 280, 300 + run, 420 + run), 220, 'zone')];
    if (S.zones[h.i].some((q) => q.o && solid.some((box) => boxesHit(q, box)))) continue;
    block(b, id, deck, 0, H, pal.platform, 'platform');
    ramp(b, id, slope, 0, H, dx > 0 ? '-x' : '+x', pal.stair);
    stairs(b, { cell: id, run: 1, dir: -dz, at: Z + dz * (300 + run), s0: steps.x0, s1: steps.x1, baseY: 0, steps: 4, riser: 20, tread: P.tread, mat: pal.stair });
    S.zones[h.i].push(...solid, ...free);
    return true;
  }
  return false;
}

/** Schody z prahu dolů do zapuštěné místnosti. Vrací false, když by se dvoje schody srazily. */
function sunkSteps(b, S, P, preset, o, X, isA) {
  const drop = o.sill - X.y0;
  const steps = Math.round(drop / P.riser) - 1;
  if (steps < 1) return true;
  const s = o.s;
  const face = isA ? s.b0 : s.b1;
  const into = isA ? -1 : 1;
  // P.landing: podesta ve výšce prahu před dveřmi (u vchodu z venku); na poslední stupeň se stoupá mimo nadpraží,
  // které by kontrolér postavy při vyšlapování schodu (zdvih až 0,46 m) trefil hlavou
  const land = P.landing || 0;
  const depth = land + steps * P.tread;
  const r = s.run;
  const s0 = Math.max(X.min[r], o.c0 - 20 - (land ? 40 : 0));
  const s1 = Math.min(X.max[r], o.c1 + 20 + (land ? 40 : 0));
  const solid = runBox(r, s0, s1, face, face + into * depth, X.y0, o.sill, 'solid');
  const landing = runBox(r, s0, s1, face + into * depth, face + into * (depth + 100), X.y0, o.top, 'zone');
  // schody nesmí vlézt do jiných schodů ani před jiný otvor téže místnosti
  if (S.zones[X.i].some((z) => (z.steps && (boxesHit(z, solid) || boxesHit(z, landing))) || (z.o && z.o !== o && boxesHit(z, solid)))) return false;
  if (land) block(b, S.meta[X.i].id, r === RUN_X ? { x0: s0, x1: s1, z0: Math.min(face, face + into * land), z1: Math.max(face, face + into * land) } : { x0: Math.min(face, face + into * land), x1: Math.max(face, face + into * land), z0: s0, z1: s1 }, X.y0, o.sill, preset.palette.stair, 'landing');
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
  // upřesnění účelu místností podle toho, co sada umí (předvolba complex: obor laboratoře, serverovna, open space)
  if (preset.refine) preset.refine(cells, catalog, rng.fork('refine'));
  const floorName = (c) => (P.floors < 2 ? '' : c.tall ? (P.floors === 2 ? ' · obě patra' : ' · všechna podlaží') : c.f === 0 ? ' · přízemí' : ` · ${c.f}. patro`);
  S.meta = cells.map((c) => {
    const key = preset.cellKey(c);
    const n = (counters[key] = (counters[key] || 0) + 1);
    return { id: `c_${key}_${pad(n, 2)}`, name: `${preset.cellName(c)} ${n}${floorName(c)}`, mats: preset.materials(c), zone: preset.zone(c) };
  });

  // 1) styl a poloha otvorů
  // hrany bez úseku zdi (virtual: nádvoří, která se dotýkají bez zdi) dělá yardPortals
  const ops = plan.edges.filter((e) => !e.virtual).map((e) => {
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
  // každým otvorem musí projít postava: volný průchod aspoň na šířku kapsle s odstupem a rezervou z obou stran
  const need = bodyWidth(P.body) + 2 * P.body.reserve;
  for (const o of ops) {
    const w = Math.min(o.style.w, o.len - 2 * P.margin);
    const h = Math.min(o.style.h, o.e.head - 10);
    if ((isDoor(o) ? catalog.clearWidth(o.style.pair || o.style.prefab) : w) < need) return null;
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
    if (!c.open) ceilingSlab(b, mt.id, rectOf(c), c.y1, mt.mats.ceiling, T); // nádvoří je bez stropu
    S.cells.push({ id: mt.id, name: mt.name, bounds: { min: Vcm(c.min[0], c.y0, c.min[1]), max: Vcm(c.max[0], c.y1, c.max[1]) }, zone: mt.zone });
  });

  // 3) zdi: každý úsek jednou, vlastní ho jedna buňka; líce nesou povrch místnosti, do které se dívají
  const bySeg = new Map();
  for (const o of ops) bySeg.set(o.e.seg, [...(bySeg.get(o.e.seg) || []), o]);
  const winBySeg = windowOpenings(plan);
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
      openings: [...here.map((o) => ({ c0: o.c0, c1: o.c1, sill: o.sill, top: o.top })), ...(winBySeg.get(si) || [])],
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
      // Dveře portálu ho zavírají pro průchod, zvuk a pohled. Křídlo dvoukřídlých dveří zakryje jen půlku otvoru,
      // proto má v prefabu seeThrough (pohled nezavírá); druhé křídlo si běh i navigace najdou přes spojení opened → open.
      portal.door = o.doorIds[0];
    }
    S.portals.push(portal);
    for (const [X, face, n] of [[A, s.b0, -1], [B, s.b1, 1]]) {
      const lowSide = !o.e.gallery && X.y0 < o.sill;
      S.sides[X.i].push({ run: s.run, face, n, c0: o.c0, c1: o.c1, sill: o.sill, top: o.top, o });
      S.zones[X.i].push({ ...runBox(s.run, o.c0 - 15, o.c1 + 15, face, face + n * 120, lowSide ? X.y0 : o.sill, o.top, 'zone'), o });
    }
  });

  // 4b) okna a průchody mezi buňkami nádvoří (předvolba house)
  buildWindows(S, plan, catalog);
  yardPortals(S, plan);

  // 5) zvláštní stavby
  const core = preset.core === 'stairs' ? stairCore : P.floors > 1 ? hallGallery : hallDock;
  if (plan.hall >= 0 && !core(b, S, plan, P, preset, rng, catalog)) return null;
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
  // doplňky předvolby k hrubé stavbě (dům: trávník, stříška nad vchodem)
  if (preset.decorate) preset.decorate(b, S, plan, catalog, rng.fork('decorate'));
  return S;
}
