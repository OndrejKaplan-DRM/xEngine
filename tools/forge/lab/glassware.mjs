// Sada kit_lab: stavebnice skla z hladkých sítí (tools/forge/mesh). Nádoba je jedna rotační plocha s tenkou
// stěnou: vnější strana, zaoblený lem a vnitřní strana se dnem. Průhledné sklo (opacity) tak má dvě vrstvy a na
// obrysu, kde paprsek jde stěnou šikmo, vypadá hustší, jako skutečné sklo. Kapalina kopíruje vnitřní stěnu
// s odstupem a má meniskus. Rysky a popisná plocha jsou tenké bílé pásky (smalt) těsně nad povrchem.

import { lathe, vesselProfile, arc, simplify } from '../mesh/lathe.mjs';
import { deform, merge } from '../mesh/geo.mjs';
import { meshPart } from '../mesh/registry.mjs';

export const GLASS = 'glass_lab';
export const ENAMEL = 'enamel_white';

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
  const v = vesselProfile(outer, { wall, bottom: o.bottom ?? wall * 1.6, lip: o.lip ?? wall * 0.75, n: o.n ?? 2, lipN: o.lipN });
  return { geom: lathe(v.profile, { seg: o.seg ?? segFor(r) }), inner: v.inner, outer: v.outer };
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
