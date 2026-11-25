// Předvolba house, nádvoří a okna (Ondřej 25. 11. 2026 v 17:00: „přidat okna do bytů … udělat malé nádvoří kolem
// domu a schodové dveře do komplexu. Ať dům vypadá realisticky“). Nádvoří jsou čtyři buňky bez stropu kolem domu,
// o 68 cm níž než přízemí: dlažba, u domu chodník 2 m, dál trávník; podél kraje živý plot, lampy, stromy, lavičky,
// stojan na kola a koše. Vchod do schodišťové haly po schodech, nad ním skleněná stříška. Okna: byty, chodby k bytům
// a schodiště průhledná, laboratorní podlaží matná, koupelny a strojovny bez okna.

import { Vcm, V } from '../util.js';

const WARM = [1, 0.86, 0.66];

export const yardKeys = () => 'yard';

/** Povrchy nádvoří: dlažba, fasáda (líc zdí domu do nádvoří), strop nemá. */
export const yardMaterials = () => ({ floor: 'stone_slab', wall: 'facade_render', ceiling: 'plaster_light' });

/** Strana nádvoří, kde stojí dům (osa a znaménko): jižní nádvoří má dům na +z atd. */
const houseSide = (c) => ({ s: [1, 1], n: [1, -1], w: [0, 1], e: [0, -1] })[c.side];

/** Lampy v řadě podél vnějšího kraje nádvoří (70 cm od kraje), světlo v hlavě lampy 3,6 m nad zemí. */
export function yardLight(c) {
  const [k, sgn] = houseSide(c);
  const edge = sgn > 0 ? c.min[k] + 70 : c.max[k] - 70;
  const o = 1 - k;
  const [a0, a1] = [c.min[o] + 150, c.max[o] - 150];
  const line = k === 1 ? [a0, edge, a1, edge] : [edge, a0, edge, a1];
  return { mount: 'post', fixture: 'lamp_post_01', color: WARM, cd: 90, range: 16, spacing: 1000, height: 360, line };
}

/** Okno ve zdi do nádvoří podle buňky domu: 'clear', 'frosted' nebo null. */
export function windowAt(c, s, isHome, isFlat) {
  if (c.kind === 'hall') return 'clear';
  if (isHome(c)) {
    if (c.kind === 'corridor') return 'frosted'; // čelo chodby: okno matné (z nádvoří by bylo vidět chodbou do všech bytů)
    if (isFlat(c)) return c.role === 'bath' ? null : 'clear';
    return 'frosted';
  }
  if (c.role === 'tech') return null;
  return 'frosted';
}

/** Vybavení nádvoří: podél kraje živý plot, u domu lavička, stojan na kola a koš, v trávníku stromy. */
export function yardPlan(c, rng, catalog) {
  if (!catalog.has('hedge_01')) return null;
  const long = Math.max(c.w, c.d);
  const hedges = Math.max(2, Math.floor(long / 400));
  return {
    walls: [
      { p: 'hedge_01', chain: 3 },
      { p: 'bench_park_01' },
      ...Array.from({ length: hedges }, () => ({ p: 'hedge_01', chain: rng.int(2, 4) })),
      { p: 'bike_rack_01' },
      { p: 'bin_outdoor_01' },
      { p: 'bench_park_01' },
    ],
    center: Array.from({ length: Math.max(1, Math.min(3, Math.floor(long / 900))) }, () => ({ p: rng.pick(['tree_01', 'tree_02']), aisle: 0.6 })),
    maxDepth: 70,
  };
}

/**
 * Doplňky stavby: trávník (deska 2 cm na dlažbě, od domu 2 m chodník) a skleněná stříška nad vchodem.
 * b = builder kvádrů, S = stavba (buildStructure), plan = rozvržení.
 */
export function yardDecorate(b, S, plan, catalog) {
  for (const i of plan.yards || []) {
    const c = plan.cells[i];
    const [k, sgn] = houseSide(c);
    const r = { x0: c.min[0], x1: c.max[0], z0: c.min[1], z1: c.max[1] };
    const key = k === 0 ? (sgn > 0 ? 'x1' : 'x0') : sgn > 0 ? 'z1' : 'z0';
    r[key] += sgn > 0 ? -200 : 200;
    b.add(S.meta[i].id, 'lawn', [r.x0, c.y0, r.z0], [r.x1, c.y0 + 2, r.z1], 'lawn_green');
  }
  if (!catalog.has('canopy_entrance_01')) return;
  for (const o of S.openings) {
    const yardA = o.A.kind === 'yard';
    if (!yardA && o.B.kind !== 'yard') continue;
    const Y = yardA ? o.A : o.B;
    const face = yardA ? o.s.b0 : o.s.b1;
    const along = (o.c0 + o.c1) / 2;
    const y = o.top + 20;
    const pos = o.s.run === 0 ? Vcm(along, y, face) : Vcm(face, y, along);
    // +Z stříšky od zdi do nádvoří
    const ry = yardA ? (o.s.run === 0 ? 180 : -90) : o.s.run === 0 ? 0 : 90;
    S.entities.push({ id: S.eid('canopy'), prefab: 'canopy_entrance_01', cell: S.meta[Y.i].id, pos, rot: V(0, ry, 0) });
  }
}
