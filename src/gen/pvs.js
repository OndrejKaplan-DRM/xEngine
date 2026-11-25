// Co je z buňky vůbec vidět (potenciálně viditelná množina, PVS), prokazatelně a s rezervou. Generátor podle toho
// drží rozpočet trojúhelníků (fitPVS), test B-T1 ho ověřuje nad hotovými levely a B-T10 ověřuje výpočet sám.
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
  const ys = p.quad.map((q) => q[1]);
  const y = [Math.min(...ys) - SPAN, Math.max(...ys) + SPAN];
  if (Math.max(...xs) - Math.min(...xs) < 1e-6) return { axis: 'x', at: xs[0], lo: Math.min(...zs) - SPAN, hi: Math.max(...zs) + SPAN, y };
  if (Math.max(...zs) - Math.min(...zs) < 1e-6) return { axis: 'z', at: zs[0], lo: Math.min(...xs) - SPAN, hi: Math.max(...xs) + SPAN, y };
  return null; // vodorovný nebo šikmý otvor: nic neomezuje (rezerva ve prospěch viditelnosti)
}

/** Koncové body úseku v půdorysu [[x, z], [x, z]]. */
const ends = (s) => (s.axis === 'x' ? [[s.at, s.lo], [s.at, s.hi]] : [[s.lo, s.at], [s.hi, s.at]]);
/** Nejmenší vzdálenost bodu od úseku. */
function pointSeg(p, [a, b]) {
  const [dx, dz] = [b[0] - a[0], b[1] - a[1]];
  const L = dx * dx + dz * dz;
  const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
/** Nejmenší a největší vzdálenost dvou úseků v půdorysu (osově rovnoběžných nebo kolmých). */
function segDist(s, t) {
  const A = ends(s);
  const B = ends(t);
  let min = Math.min(pointSeg(A[0], B), pointSeg(A[1], B), pointSeg(B[0], A), pointSeg(B[1], A));
  if (s.axis !== t.axis) {
    // kolmé úseky se mohou křížit
    const [x, z] = s.axis === 'x' ? [s.at, t.at] : [t.at, s.at];
    const inS = (s.axis === 'x' ? z : x) >= s.lo && (s.axis === 'x' ? z : x) <= s.hi;
    const inT = (t.axis === 'x' ? z : x) >= t.lo && (t.axis === 'x' ? z : x) <= t.hi;
    if (inS && inT) min = 0;
  } else if (s.at === t.at && s.lo <= t.hi && t.lo <= s.hi) min = 0;
  let max = 0;
  for (const p of A) for (const q of B) max = Math.max(max, Math.hypot(p[0] - q[0], p[1] - q[1]));
  return [min, max];
}

/**
 * Svislá podmínka: přímka v prostoru má v půdorysu jeden sklon k = Δy / vodorovná vzdálenost. Mezi otvory i a j
 * (v pořadí cesty) leží průsečíky ve vzdálenosti z ⟨dmin, dmax⟩ a výšky v otvorech, takže k leží v intervalu
 * Δy / d. Když se intervaly všech dvojic neprotnou, přímka neexistuje. Otvory v téže rovině zdi jsou přímkou
 * protnuté v jednom bodě (vzdálenost 0): musejí se překrývat i výškou. Podmínka je nutná, ne postačující, takže
 * výsledek zůstává nadmnožinou viditelnosti (patra nad sebou přes schodiště se tím přestanou „vidět“ skrz zeď).
 */
function vertical(segs) {
  let lo = -Infinity;
  let hi = Infinity;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const [s, t] = [segs[i], segs[j]];
      if (!s || !t || !s.y || !t.y) continue;
      const [dmin, dmax] = segDist(s, t);
      const L = t.y[0] - s.y[1];
      const U = t.y[1] - s.y[0];
      if (dmax < EPS) {
        if (L > EPS || U < -EPS) return false;
        continue;
      }
      let a;
      let b;
      if (L >= 0) [a, b] = [L / dmax, dmin > EPS ? U / dmin : Infinity];
      else if (U <= 0) [a, b] = [dmin > EPS ? L / dmin : -Infinity, U / dmax];
      else [a, b] = [dmin > EPS ? L / dmin : -Infinity, dmin > EPS ? U / dmin : Infinity];
      lo = Math.max(lo, a);
      hi = Math.min(hi, b);
      if (lo > hi + EPS) return false;
    }
  }
  return true;
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
        if (chain.length && (!stabbable(next) || !vertical(next))) continue;
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

/**
 * Rozpočet viditelného: z žádné buňky nesmí být vidět víc než budget △ (PVS, všechny dveře otevřené, kvádry po síti
 * světla). Když je víc, odebírá volitelné entity (věci na deskách stolů) z buněk nejhorší množiny, vždy tu s nejvíc △
 * (při shodě podle id), dokud se do rozpočtu nevejde nebo volitelné nedojdou. Mění level.entities.
 * @param optional Map entita → její připojené entity (zásuvky), jen volitelné
 * @returns {{ max, removed, cell }}
 */
export function fitPVS(level, trisOf, brushTris, optional, budget) {
  const pvs = levelPVS(level);
  let vis = visibleTris(level, trisOf, pvs, brushTris);
  let removed = 0;
  const cellOf = new Map();
  for (const [e] of optional) cellOf.set(e, e.cell);
  while (vis.max > budget) {
    const set = vis.pvs.get(vis.cell);
    let best = null;
    for (const [e] of optional) {
      if (!set.has(cellOf.get(e))) continue;
      const t = trisOf(e.prefab);
      if (!best || t > best.t || (t === best.t && e.id < best.e.id)) best = { e, t };
    }
    if (!best || best.t <= 0) break;
    const gone = new Set([best.e, ...optional.get(best.e)]);
    optional.delete(best.e);
    level.entities = level.entities.filter((x) => !gone.has(x));
    removed += gone.size;
    vis = visibleTris(level, trisOf, pvs, brushTris);
  }
  return { max: vis.max, removed, cell: vis.cell };
}
