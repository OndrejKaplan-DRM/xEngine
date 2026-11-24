// xForge, sítě: rotační plochy z profilu (sklo, láhve, víčka, sudy, válce, kužely, koule) a pomůcky na profil.
// Profil je lomená čára v rovině (r, y): r = vzdálenost od osy Y, y = výška. Plocha má líc vpravo od směru chůze
// po profilu (jdu nahoru po vnější stěně → líc ven; dolů po vnitřní → líc do dutiny). Bod s r = 0 je pól
// (jeden vrchol, vějíř trojúhelníků). Bod se značkou 'c' je ostrá hrana (dva prstence s různou normálou),
// ostatní body jsou hladké. Tenká stěna = jeden profil ven, přes okraj a dovnitř.

import { newGeom, vert, quad, tri, norm } from './geo.mjs';

const EPS = 1e-7;

/**
 * Rotační plocha.
 * @param profile [[r, y], [r, y, 'c'], …]
 * @param o { seg: počet stěn po obvodu (výchozí 24), a0, a1: úhel od–do ve stupních (výchozí celý obvod),
 *            phase: pootočení první stěny ve stupních }
 */
export function lathe(profile, o = {}) {
  const seg = o.seg ?? 24;
  const a0 = ((o.a0 ?? 0) + (o.phase ?? 0)) * (Math.PI / 180);
  const full = o.a0 === undefined && o.a1 === undefined;
  const a1 = full ? a0 + Math.PI * 2 : ((o.a1 ?? 360) + (o.phase ?? 0)) * (Math.PI / 180);
  const cols = full ? seg : seg + 1;
  const angle = (j) => a0 + ((a1 - a0) * j) / seg;
  const pts = profile.map((p) => ({ r: Math.max(0, p[0]), y: p[1], crease: p[2] === 'c' }));
  // normály úseků (2D, vpravo od směru): (dy, −dr)
  const segN = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const dr = pts[i + 1].r - pts[i].r;
    const dy = pts[i + 1].y - pts[i].y;
    const l = Math.hypot(dr, dy) || 1;
    segN.push([dy / l, -dr / l]);
  }
  // délka po profilu pro souřadnici v
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].r - pts[i - 1].r, pts[i].y - pts[i - 1].y));
  const total = len[len.length - 1] || 1;
  const g = newGeom();
  /** Prstenec bodu i s 2D normálou n; vrací indexy vrcholů po obvodu (u pólu jeden vrchol). */
  const ring = (i, n) => {
    const p = pts[i];
    const v = len[i] / total;
    if (p.r < EPS) {
      const k = vert(g, [0, p.y, 0], [0, Math.sign(n[1]) || 1, 0], [0.5, v]);
      return { pole: true, ids: Array(cols).fill(k) };
    }
    const ids = [];
    for (let j = 0; j < cols; j++) {
      const a = angle(j);
      const c = Math.cos(a);
      const s = Math.sin(a);
      ids.push(vert(g, [p.r * c, p.y, -p.r * s], norm([n[0] * c, n[1], -n[0] * s]), [j / seg, v]));
    }
    return { pole: false, ids };
  };
  const avg = (a, b) => {
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    const l = Math.hypot(x, y);
    return l < 1e-9 ? b : [x / l, y / l];
  };
  let prev = null;
  for (let i = 0; i < pts.length; i++) {
    const nIn = i > 0 ? segN[i - 1] : segN[0];
    const nOut = i < segN.length ? segN[i] : segN[segN.length - 1];
    let here;
    let next;
    if (pts[i].crease && i > 0 && i < pts.length - 1) {
      here = ring(i, nIn);
      next = ring(i, nOut);
    } else {
      here = ring(i, i === 0 ? nOut : i === pts.length - 1 ? nIn : avg(nIn, nOut));
      next = here;
    }
    if (prev) strip(g, prev, here, cols, full);
    prev = next;
  }
  return g;
}

/** Pás mezi dvěma prstenci (u pólu vějíř). */
function strip(g, A, B, cols, full) {
  const n = full ? cols : cols - 1;
  for (let j = 0; j < n; j++) {
    const j2 = (j + 1) % cols;
    if (A.pole && B.pole) continue;
    if (A.pole) tri(g, A.ids[0], B.ids[j], B.ids[j2]);
    else if (B.pole) tri(g, A.ids[j], A.ids[j2], B.ids[0]);
    else quad(g, A.ids[j], A.ids[j2], B.ids[j2], B.ids[j]);
  }
}

// ---- profil --------------------------------------------------------------------------------

/** Oblouk se středem (cr, cy) a poloměrem rad od úhlu u0 do u1 (stupně, 0 = +r, 90 = +y), n úseků. */
export function arc(cr, cy, rad, u0, u1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = ((u0 + ((u1 - u0) * i) / n) * Math.PI) / 180;
    out.push([cr + rad * Math.cos(u), cy + rad * Math.sin(u)]);
  }
  return out;
}

/**
 * Lomená čára se zaoblenými rohy: body [r, y, poloměr zaoblení?, úseků?] (poloměr 0, chybí nebo 'c' = ostrý roh;
 * 's' = hladký bod bez zaoblení).
 * n = výchozí počet úseků oblouku (čtvrtý prvek bodu ho přepíše). Krajní body se nezaoblují.
 */
export function rounded(points, n = 3) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const [r, y, rad, nk] = points[i];
    if (i === 0 || i === points.length - 1 || typeof rad !== 'number' || !rad) {
      out.push(i === 0 || i === points.length - 1 ? [r, y] : rad === 's' ? [r, y] : [r, y, 'c']);
      continue;
    }
    const p = points[i - 1];
    const q = points[i + 1];
    const d1 = norm([p[0] - r, p[1] - y, 0]);
    const d2 = norm([q[0] - r, q[1] - y, 0]);
    const cosT = Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1]));
    const theta = Math.acos(cosT); // úhel mezi rameny
    if (theta < 1e-3 || Math.PI - theta < 1e-3) {
      out.push([r, y]);
      continue;
    }
    const t = rad / Math.tan(theta / 2); // vzdálenost bodu dotyku od rohu
    const lim = Math.min(t, Math.hypot(p[0] - r, p[1] - y) * 0.5, Math.hypot(q[0] - r, q[1] - y) * 0.5);
    const radUsed = lim * Math.tan(theta / 2);
    const s = [r + d1[0] * lim, y + d1[1] * lim];
    const e = [r + d2[0] * lim, y + d2[1] * lim];
    const bis = norm([d1[0] + d2[0], d1[1] + d2[1], 0]);
    const h = radUsed / Math.sin(theta / 2);
    const c = [r + bis[0] * h, y + bis[1] * h];
    let u0 = Math.atan2(s[1] - c[1], s[0] - c[0]);
    let u1 = Math.atan2(e[1] - c[1], e[0] - c[0]);
    let du = u1 - u0;
    while (du > Math.PI) du -= 2 * Math.PI;
    while (du < -Math.PI) du += 2 * Math.PI;
    const m = nk ?? n;
    for (let k = 0; k <= m; k++) {
      const u = u0 + (du * k) / m;
      out.push([c[0] + radUsed * Math.cos(u), c[1] + radUsed * Math.sin(u)]);
    }
  }
  return out;
}

/**
 * Tenkostěnná nádoba z vnějšího profilu (od středu dna nahoru k okraji): vnitřek je vnější profil posunutý o
 * tloušťku stěny dovnitř, okraj je zaoblený půlkruh (zesílený lem, když lip > wall).
 * Vrací { profile: pro lathe, inner: vnitřní stěna od středu dna nahoru (pro kapalinu), outer: vnější strana }.
 * @param outer [[r, y, zaoblení?], …] od [0, 0] po okraj
 * @param o { wall: tloušťka stěny, bottom: tloušťka dna, lip: poloměr lemu (výchozí wall/2), n: úseky oblouků }
 */
export function vesselProfile(outer, o = {}) {
  const wall = o.wall ?? 0.0015;
  const bottom = o.bottom ?? wall * 1.5;
  const n = o.n ?? 3;
  const out = rounded(outer, n);
  const top = out[out.length - 1];
  const y0 = out[0][1]; // dno: bottom je tloušťka dna nad vnějším pólem
  const lip = o.lip ?? wall / 2;
  // lem: půlkruh přes okraj od vnější hrany k vnitřní
  const cr = top[0] - lip;
  const ring = arc(cr, top[1], lip, 0, 180, o.lipN ?? 3).slice(1);
  const innerTop = ring[ring.length - 1];
  // vnitřní profil: vnější posunutý po normále dovnitř o tloušťku stěny, dno nejníž v bottom; shora dolů
  const nrm = (i) => {
    const a = out[Math.max(0, i - 1)];
    const b = out[Math.min(out.length - 1, i + 1)];
    const t = norm([b[0] - a[0], b[1] - a[1], 0]);
    return [t[1], -t[0]]; // vpravo od směru = ven
  };
  const inner = [[innerTop[0], innerTop[1]]];
  for (let i = out.length - 2; i >= 1; i--) {
    const [r, y] = out[i];
    const n2 = nrm(i);
    const ri = r - n2[0] * wall;
    const yi = Math.max(y - n2[1] * wall, y0 + bottom);
    if (ri > 1e-4 && yi < innerTop[1] - 1e-5) inner.push([ri, yi]);
  }
  inner.push([0, y0 + bottom]);
  // vnitřek je vidět jen sklem: bod, který leží skoro na spojnici sousedů (do tol), se vynechá (šetří prstence)
  simplify(inner, o.innerTol ?? Math.max(0.0004, wall * 0.4));
  // odstraň kroky, kde vnitřek klesl pod dno (zúžení u dna)
  const clean = [];
  for (const p of inner) if (!clean.length || Math.hypot(p[0] - clean[clean.length - 1][0], p[1] - clean[clean.length - 1][1]) > 1e-5) clean.push(p);
  return { profile: [...out, ...ring.slice(0, -1), ...clean], inner: [...clean].reverse().map(([r, y]) => [r, y]), outer: out };
}

/** Plný rotační tvar (víčko, zátka, sud): profil od středu dna přes bok ke středu vršku, se zaoblením. */
export function solidProfile(points, n = 3) {
  return rounded(points, n);
}

/** Vynechá body lomené čáry, které leží blíž než tol (m) od spojnice svých sousedů; krajní body zůstanou. */
export function simplify(pts, tol) {
  for (let changed = true; changed; ) {
    changed = false;
    for (let i = pts.length - 2; i >= 1; i--) {
      const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
      const dx = c[0] - a[0];
      const dy = c[1] - a[1];
      const l = Math.hypot(dx, dy);
      const d = l < 1e-9 ? Math.hypot(b[0] - a[0], b[1] - a[1]) : Math.abs((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) / l;
      if (d < tol) {
        pts.splice(i, 1);
        changed = true;
      }
    }
  }
  return pts;
}
