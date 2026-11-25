// Sada kit_lab: stavebnice skla z hladkých sítí (tools/forge/mesh). Nádoba je jedna rotační plocha s tenkou
// stěnou: vnější strana, zaoblený lem a vnitřní strana se dnem. Průhledné sklo (opacity) tak má dvě vrstvy a na
// obrysu, kde paprsek jde stěnou šikmo, vypadá hustší, jako skutečné sklo. Kapalina kopíruje vnitřní stěnu
// s odstupem a má meniskus. Rysky a popisná plocha jsou tenké bílé pásky (smalt) těsně nad povrchem.

import { lathe, vesselProfile, arc, simplify } from '../mesh/lathe.mjs';
import { deform, merge } from '../mesh/geo.mjs';
import { meshPart } from '../mesh/registry.mjs';

export const GLASS = 'glass_lab';
export const ENAMEL = 'enamel_white';

// Ondřej 25. 11. 2026 v 1:02: sklo je ve hře málo vidět, chce výraznější okraj a odlesk (volba 2 b). Běh kreslí
// sklo jako průhlednou barvu bez lomu a zrcadlení, proto to nesou data: lem nádoby (horní okraj s kouskem vnější
// a vnitřní stěny) je hustší a světlejší sklo a na vnější stěně vlevo vpředu jsou dva svislé pruhy odlesku.
// Obojí jsou doprovodné sítě nádoby (extras), které se ohnou s hubičkou a posunou se sestavou; díly z nich
// udělá definePrefab. Kovová lázeň ani plast je nedostane (materiál dílu není sklo).
const RIM_MAT = { glass_lab: 'glass_rim', glass_tinted: 'glass_rim', glass_amber: 'glass_amber_rim' };
const GLINT_MAT = { glass_lab: 'glass_glint', glass_tinted: 'glass_glint', glass_amber: 'glass_glint' };
const RIM_OFF = 0.00015; // m nad sklem (proti blikání dvou ploch v téže hloubce)
const GLINT_OFF = 0.0002;
/** Pruhy odlesku: [od, do] ve stupních od přední strany (úmluva lathe; záporně = vlevo vpředu). Odlesk stropního
 * světla na válci leží blízko směru k pozorovateli, proto pruhy míří skoro dopředu (hráč sklo vidí z místnosti). */
const GLINTS = [
  [-24, -15],
  [7, 9.5],
];

/** Lomená čára [[r, y], …] posunutá po své normále (vpravo od směru) o off. */
function offsetLine(pts, off) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dr = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dr, dy) || 1;
    return [Math.max(0, p[0] + (dy / l) * off), p[1] - (dr / l) * off];
  });
}

/** Část lomené čáry s y mezi lo a hi; úseky, které mez protínají, se oříznou přesně na ní. */
function clipY(P, lo, hi) {
  const out = [];
  const inside = (p) => p[1] >= lo && p[1] <= hi;
  const at = (a, b, y) => {
    const t = (y - a[1]) / (b[1] - a[1] || 1);
    return [a[0] + (b[0] - a[0]) * t, y];
  };
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    const q = P[i - 1];
    if (q) {
      for (const y of q[1] < p[1] ? [lo, hi] : [hi, lo]) if ((q[1] - y) * (p[1] - y) < 0) out.push(at(q, p, y));
    }
    if (inside(p)) out.push(p);
  }
  return out;
}

/** Úsek lomené čáry kolem indexu top, kde y ≥ yCut; konce oříznuté přesně na yCut. */
function band2d(P, top, yCut) {
  let i0 = top;
  while (i0 > 0 && P[i0 - 1][1] >= yCut) i0--;
  let i1 = top;
  while (i1 < P.length - 1 && P[i1 + 1][1] >= yCut) i1++;
  const out = P.slice(i0, i1 + 1);
  const cut = (a, b) => {
    const t = (yCut - a[1]) / (b[1] - a[1] || 1);
    return [a[0] + (b[0] - a[0]) * t, yCut];
  };
  if (i0 > 0) out.unshift(cut(P[i0 - 1], P[i0]));
  if (i1 < P.length - 1) out.push(cut(P[i1], P[i1 + 1]));
  return out;
}

/** Počet stěn po obvodu podle poloměru (m): malé věci 12, velké nejvýš 24; vždy sudý. Hladké normály schovají hrany. */
export const segFor = (r, k = 1) => 2 * Math.round(Math.min(22, Math.max(10, (10 + (r * 1000) / 7) * k)) / 2);
/** Tloušťka stěny skla podle průměru (m): 0,8 mm u malých, 2 mm u velkých. */
export const wallFor = (r) => Math.min(0.002, Math.max(0.0008, r * 0.03));

/**
 * Nádoba: outer = vnější profil [[r, y, zaoblení?], …] od středu dna k okraji. o: { wall, bottom, lip, seg, n }.
 * @returns {{ geom, inner, outer }} inner = vnitřní stěna zdola nahoru
 */
export function vesselGeom(outer, o = {}) {
  const r = Math.max(...outer.map((p) => p[0]));
  const wall = o.wall ?? wallFor(r);
  const lipN = o.lipN ?? 3;
  const seg = o.seg ?? segFor(r);
  const v = vesselProfile(outer, { wall, bottom: o.bottom ?? wall * 1.6, lip: o.lip ?? wall * 0.75, n: o.n ?? 2, lipN });
  const geom = lathe(v.profile, { seg });
  if (o.accents !== false) {
    // lem: horní okraj s kouskem vnější a vnitřní stěny (vrchol oblouku lemu je uprostřed za posledním bodem vnějšku)
    const P = v.profile.map((p) => [p[0], p[1]]);
    const top = v.outer.length - 1 + Math.floor(lipN / 2);
    const yTop = P[top][1];
    const h = Math.min(0.004, Math.max(0.0012, wall * 2.2));
    // pět bodů: řez na vnější stěně, začátek lemu, vrchol lemu, konec lemu, řez na vnitřní stěně (průhledné sklo
    // nezapisuje hloubku, takže lem s méně body se se sklem nebije; ušetří 30 až 50 % trojúhelníků lemu)
    const band = band2d(P, top, yTop - h);
    const a = P[v.outer.length - 1];
    const z = P[v.outer.length - 1 + lipN];
    const rim = offsetLine([band[0], a, P[top], z, band[band.length - 1]].filter((p, i, arr) => !i || Math.hypot(p[0] - arr[i - 1][0], p[1] - arr[i - 1][1]) > 1e-6), RIM_OFF);
    // odlesk: vnější stěna od 12 % výšky po lem
    const O = v.outer.map((p) => [p[0], p[1]]);
    const y0 = O[0][1];
    const yb = y0 + (yTop - y0) * 0.12;
    const side = offsetLine(simplify(clipY(O, yb, yTop - h).filter((p) => p[0] > 0.002), Math.max(0.0005, r * 0.01)), GLINT_OFF);
    geom.extras = [{ suffix: 'rim', mat: (m) => RIM_MAT[m] || null, geom: lathe(rim, { seg }) }];
    if (side.length >= 2) {
      const glint = merge(GLINTS.map(([a, b]) => lathe(side, { a0: FRONT + a, a1: FRONT + b, seg: 1 })));
      geom.extras.push({ suffix: 'glint', mat: (m) => GLINT_MAT[m] || null, geom: glint });
    }
  }
  return { geom, inner: v.inner, outer: v.outer };
}

/**
 * Kapalina do výšky y (m) podle vnitřní stěny inner (zdola nahoru), s odstupem gap od skla a meniskem (vodní,
 * prohnutý dolů o men). Plná rotační síť.
 */
export function liquidGeom(inner, y, o = {}) {
  const gap = o.gap ?? 0.0004;
  const men = o.men ?? 0.0015;
  const pts = [];
  for (let i = 0; i < inner.length; i++) {
    const [r, yy] = inner[i];
    if (yy >= y) {
      const [r0, y0] = inner[i - 1] || inner[i];
      const t = yy === y0 ? 0 : (y - y0) / (yy - y0);
      pts.push([Math.max(0, r0 + (r - r0) * t - gap), y]);
      break;
    }
    pts.push([Math.max(0, r - gap), yy + gap * (i === 0 ? 1 : 0)]);
  }
  if (pts[pts.length - 1][1] < y) pts.push([pts[pts.length - 1][0], y]);
  simplify(pts, o.tol ?? 0.0006);
  const rt = pts[pts.length - 1][0];
  const m = Math.min(men, rt * 0.3);
  const top = o.flat ? [[0, y]] : [[rt * 0.7, y - m * 0.75], [0, y - m]];
  const prof = [[0, pts[0][1]], ...pts.filter((p) => p[0] > 0), ...top];
  return lathe(prof, { seg: o.seg ?? segFor(rt) });
}

/** Úhel přední strany (+Z) v úmluvě lathe (x = r cos a, z = −r sin a). */
export const FRONT = 270;

/**
 * Rysky: krátké bílé pásky na válcové stěně o poloměru r ve výškách ys (m). Každá n-tá (major) je delší.
 * o: { span: úhel delší rysky (°), h: výška pásku (m), mid: úhel středu, major }
 */
export function ticks(r, ys, o = {}) {
  const span = o.span ?? 26;
  const h = o.h ?? 0.0006;
  const mid = o.mid ?? FRONT;
  const major = o.major ?? 5;
  const out = [];
  ys.forEach((y, i) => {
    const s = i % major === major - 1 ? span : span * 0.5;
    out.push(lathe([[r, y - h / 2], [r, y + h / 2]], { a0: mid - s / 2, a1: mid + s / 2, seg: 2 }));
  });
  return merge(out);
}

/** Pásek (popisná plocha, štítek) na válcové stěně: poloměr r, výška y0–y1, úhlová šířka span kolem mid. */
export const band = (r, y0, y1, span, mid = FRONT, seg = 6) => lathe([[r, y0], [r, y1]], { a0: mid - span / 2, a1: mid + span / 2, seg });

/** Plný prstenec (ryska po obvodu hrdla odměrné baňky, kroužek). */
export const ring = (r, y, h, seg) => lathe([[r, y - h / 2], [r, y + h / 2]], { seg });

/**
 * Hubička: vrcholy nad yFrom se u úhlu mid (°) vytáhnou ven až o out (m) a nahoru o up, plynule do stran (šířka
 * width °). Deformuje celou síť (vnější i vnitřní stěnu a lem stejně), normály přepočte.
 */
export function spout(geom, yFrom, yTop, mid, out, up, width = 50) {
  const m = (mid * Math.PI) / 180;
  const dir = [Math.cos(m), -Math.sin(m)];
  return deform(geom, ([x, y, z]) => {
    if (y <= yFrom) return [x, y, z];
    const a = Math.atan2(-z, x);
    let d = Math.abs(a - m);
    d = Math.min(d, 2 * Math.PI - d);
    const w = (width * Math.PI) / 180;
    if (d > w) return [x, y, z];
    const fa = 0.5 + 0.5 * Math.cos((Math.PI * d) / w);
    const t = Math.min(1, (y - yFrom) / Math.max(1e-6, yTop - yFrom));
    const f = fa * t * t;
    return [x + dir[0] * out * f, y + up * f, z + dir[1] * out * f];
  });
}

/** Díl sítě skla do registru: soubor glass.glb, uzel = jméno prefabu a role. */
export const part = (id, role, geom, mat = GLASS) => meshPart('body', 'glass', `${id}_${role}`, geom, mat);

/** Profil koule se středem cy a poloměrem R od úhlu u0 do u1 (°), n úseků. */
export const bulb = (R, cy, u0, u1, n) => arc(0, cy, R, u0, u1, n);
