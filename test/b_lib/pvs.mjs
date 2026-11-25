// Co je z buňky vůbec vidět (potenciálně viditelná množina, PVS), prokazatelně a s rezervou.
// Ondřej 25. 11. 2026 v 1:29: „chytře škrtejme, co není vidět. Ale opravdu prokazatelně.“
//
// Buňka C je z buňky S vidět, když existuje přímka, která projde všemi otvory portálů na cestě S → … → C.
// Počítá se v půdorysu (přímka ve 3D, která otvory projde, má v půdorysu průmět, který projde jejich průměty), takže
// výsledek je nadmnožina skutečné viditelnosti: co tu vidět není, nevidí ani hráč z žádného místa buňky S. Všechny
// dveře se berou jako otevřené (nejhorší případ) a okna (passable: false) jako průhledná.
//
// Přímka v půdorysu: z = a·x + b (|a| ≤ 1), nebo x = a·z + b (|a| ≤ 1); dohromady všechny směry. Každý otvor dá dvě
// lineární nerovnice v (a, b) s koeficientem ±1 u b; u otvoru ve zdi kolmé na druhou osu se nerovnice násobí a,
// proto zvlášť a > 0 a a < 0. Proveditelnost: b leží mezi největší dolní a nejmenší horní mezí; rozdíl mezí je
// konvexní po částech lineární funkce a, její minimum se najde dělením intervalu (ternární hledání).

const EPS = 1e-7;
const SPAN = 1e-6; // rozšíření otvoru, ať přímka po hraně otvoru projde (s rezervou ve prospěch viditelnosti)

/** Průmět otvoru do půdorysu: { axis: 'x' | 'z', at, lo, hi } (zeď x = at, otvor z ∈ ⟨lo, hi⟩, nebo naopak). */
export function portalSegment(p) {
  const xs = p.quad.map((q) => q[0]);
  const zs = p.quad.map((q) => q[2]);
  if (Math.max(...xs) - Math.min(...xs) < 1e-6) return { axis: 'x', at: xs[0], lo: Math.min(...zs) - SPAN, hi: Math.max(...zs) + SPAN };
  if (Math.max(...zs) - Math.min(...zs) < 1e-6) return { axis: 'z', at: zs[0], lo: Math.min(...xs) - SPAN, hi: Math.max(...xs) + SPAN };
  return null; // vodorovný nebo šikmý otvor: nic neomezuje (rezerva ve prospěch viditelnosti)
}

/**
 * Projde přímka všemi úseky? segs v půdorysu. Parametrizace u = svislá osa vzorce: 'z' → z = a·x + b, 'x' → x = a·z + b.
 */
function stabbable(segs) {
  for (const along of ['x', 'z']) {
    // z = a·x + b pro along = 'x' (úsek s axis = along je „napříč“, druhý „podél“)
    const cross = segs.filter((s) => s && s.axis === along);
    const other = segs.filter((s) => s && s.axis !== along);
    const signs = other.length ? [1, -1] : [0];
    for (const sg of signs) {
      const C = []; // [ka, kb, c]: ka·a + kb·b ≤ c
      for (const s of cross) C.push([s.at, 1, s.hi], [-s.at, -1, -s.lo]);
      for (const s of other) {
        if (sg > 0) C.push([s.lo, 1, s.at], [-s.hi, -1, -s.at]);
        else C.push([s.hi, 1, s.at], [-s.lo, -1, -s.at]);
      }
      const lo = sg > 0 ? EPS : -1;
      const hi = sg < 0 ? -EPS : 1;
      if (feasible(C, lo, hi)) return true;
    }
  }
  return false;
}

function feasible(C, lo, hi) {
  const gap = (a) => {
    let low = -Infinity;
    let up = Infinity;
    for (const [ka, kb, c] of C) {
      if (kb > 0) up = Math.min(up, c - ka * a);
      else low = Math.max(low, ka * a - c);
    }
    return low - up;
  };
  let a = lo;
  let b = hi;
  for (let i = 0; i < 90; i++) {
    const m1 = a + (b - a) / 3;
    const m2 = b - (b - a) / 3;
    if (gap(m1) <= gap(m2)) b = m2;
    else a = m1;
  }
  return Math.min(gap(lo), gap(hi), gap((a + b) / 2)) <= 1e-9;
}

/**
 * PVS všech buněk levelu: Map id buňky → Set id buněk (včetně sebe).
 * @param o.maxChain nejdelší řetěz portálů (pojistka; výchozí 64)
 */
export function levelPVS(level, o = {}) {
  const maxChain = o.maxChain ?? 64;
  const seg = new Map(level.portals.map((p) => [p.id, portalSegment(p)]));
  const adj = new Map(level.cells.map((c) => [c.id, []]));
  for (const p of level.portals) {
    adj.get(p.a)?.push({ p, to: p.b });
    adj.get(p.b)?.push({ p, to: p.a });
  }
  const out = new Map();
  let chains = 0;
  let depth = 0; // nejdelší řetěz portálů, kterým je ještě něco vidět
  for (const c of level.cells) {
    const seen = new Set([c.id]);
    const walk = (cell, chain, path) => {
      for (const { p, to } of adj.get(cell)) {
        if (path.has(to) || chain.length >= maxChain) continue;
        const next = [...chain, seg.get(p.id)];
        chains++;
        if (chain.length && !stabbable(next)) continue;
        seen.add(to);
        if (next.length > depth) depth = next.length;
        path.add(to);
        walk(to, next, path);
        path.delete(to);
      }
    };
    walk(c.id, [], new Set([c.id]));
    out.set(c.id, seen);
  }
  out.chains = chains;
  out.depth = depth;
  return out;
}

/**
 * Trojúhelníky, které je nejvýš potřeba kreslit z každé buňky: kvádry a prefaby buněk v jejím PVS.
 * @param brushTris pole △ po kvádrech (síť světla levelLightMeshes, jak je kreslí běh), nebo null = 12 na kvádr
 * @returns {{ max, cell, perCell: Map, pvs }}
 */
export function visibleTris(level, trisOf, pvs = levelPVS(level), brushTris = null) {
  const own = new Map(level.cells.map((c) => [c.id, 0]));
  level.brushes.forEach((b, i) => own.set(b.cell, (own.get(b.cell) || 0) + (brushTris ? brushTris[i] : 12)));
  for (const e of level.entities) own.set(e.cell, (own.get(e.cell) || 0) + trisOf(e.prefab));
  const perCell = new Map();
  let max = 0;
  let cell = null;
  for (const [id, set] of pvs) {
    let t = 0;
    for (const v of set) t += own.get(v) || 0;
    perCell.set(id, t);
    if (t > max) {
      max = t;
      cell = id;
    }
  }
  return { max, cell, perCell, pvs };
}
