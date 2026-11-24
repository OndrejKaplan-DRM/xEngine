// xForge, sítě: tělesa, která nejsou rotační: zaoblený kvádr (skříně přístrojů, monitory, krabice), deska se
// zaoblenými rohy v půdorysu (vytažený obdélník), trubka po lomené dráze (hadičky, madla, kabely, stojany),
// a rotační zkratky (válec, kužel, koule, prstenec) nad lathe.

import { newGeom, vert, quad, tri, norm, append, mTranslate, mRotate, at } from './geo.mjs';
import { lathe, arc } from './lathe.mjs';

/**
 * Kvádr se zaoblenými hranami a rohy (poloměr rad, s úseků oblouku). Plochy jsou rovné, hrany kulaté.
 * s = 1 dá sraženou hranu s hladkou normálou (108 △), s = 2 oblou hranu (300 △), s = 3 hodně oblou (588 △).
 */
export function roundedBox(min, max, rad, s = 2) {
  if (s <= 0 || rad <= 0) return flatBox(min, max);
  const h = [0, 1, 2].map((k) => (max[k] - min[k]) / 2);
  const c = [0, 1, 2].map((k) => (max[k] + min[k]) / 2);
  const r = Math.min(rad, ...h.map((x) => x * 0.999));
  // souřadnice po ose: hrana od −h do −(h−r) po oblouku, rovná plocha, a zrcadlově
  const axis = (k) => {
    const out = [];
    for (let i = 0; i <= s; i++) out.push(-(h[k] - r) - r * Math.cos((Math.PI / 2) * (i / s)));
    for (let i = s; i >= 0; i--) out.push(h[k] - r + r * Math.cos((Math.PI / 2) * (i / s)));
    return out;
  };
  const A = [axis(0), axis(1), axis(2)];
  const g = newGeom();
  const proj = (q) => {
    const inner = q.map((v, k) => Math.max(-(h[k] - r), Math.min(h[k] - r, v)));
    const d = q.map((v, k) => v - inner[k]);
    const l = Math.hypot(...d);
    const n = l < 1e-9 ? null : d.map((x) => x / l);
    return { p: n ? inner.map((v, k) => v + n[k] * r + c[k]) : q.map((v, k) => v + c[k]), n };
  };
  for (const [k, sign] of [[0, -1], [0, 1], [1, -1], [1, 1], [2, -1], [2, 1]]) {
    const [u, v] = k === 0 ? [1, 2] : k === 1 ? [2, 0] : [0, 1];
    const fixed = sign * h[k];
    const ids = A[u].map((a) => A[v].map((b) => {
      const q = [0, 0, 0];
      q[k] = fixed;
      q[u] = a;
      q[v] = b;
      const { p, n } = proj(q);
      const face = [0, 0, 0];
      face[k] = sign;
      return vert(g, p, n || face, [(a + h[u]) / (2 * h[u]), (b + h[v]) / (2 * h[v])]);
    }));
    for (let i = 0; i + 1 < ids.length; i++) for (let j = 0; j + 1 < ids[i].length; j++) quad(g, ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
  }
  return g;
}

/** Obyčejný kvádr s ostrými hranami (12 △) jako síť, na drobné díly (čelisti svorek, rukojeti). */
export function flatBox(min, max) {
  const g = newGeom();
  for (const [k, sign] of [[0, -1], [0, 1], [1, -1], [1, 1], [2, -1], [2, 1]]) {
    const [u, v] = k === 0 ? [1, 2] : k === 1 ? [2, 0] : [0, 1];
    const n = [0, 0, 0];
    n[k] = sign;
    const ids = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, b]) => {
      const p = [0, 0, 0];
      p[k] = sign < 0 ? min[k] : max[k];
      p[u] = a ? max[u] : min[u];
      p[v] = b ? max[v] : min[v];
      return vert(g, p, n, [a, b]);
    });
    quad(g, ...ids);
  }
  return g;
}

/** Otevřená krabice (vanička, kbelík): dno a čtyři stěny tloušťky t z ostrých kvádrů, 60 △. */
export function openBox(min, max, t) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const g = newGeom();
  for (const b of [
    [[x0, y0, z0], [x1, y0 + t, z1]],
    [[x0, y0, z0], [x0 + t, y1, z1]],
    [[x1 - t, y0, z0], [x1, y1, z1]],
    [[x0 + t, y0, z0], [x1 - t, y1, z0 + t]],
    [[x0 + t, y0, z1 - t], [x1 - t, y1, z1]],
  ]) append(g, flatBox(b[0], b[1]));
  return g;
}

/**
 * Deska: obdélník w × d (osa X a Z) se zaoblenými rohy v půdorysu (poloměr rc, n úseků na roh), vytažený od y0 do
 * y1; hrany nahoře a dole sražené o bevel (0 = ostré). Střed obdélníku v [cx, cz].
 */
export function slab(cx, cz, w, d, y0, y1, rc = 0.01, n = 3, bevel = 0) {
  const rr = Math.min(rc, w / 2 - 1e-4, d / 2 - 1e-4);
  const outline = [];
  for (const [sx, sz, a0] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]]) {
    const ccx = cx + sx * (w / 2 - rr);
    const ccz = cz + sz * (d / 2 - rr);
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + (90 * i) / n) * Math.PI) / 180;
      outline.push([ccx + rr * Math.cos(a), ccz + rr * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
  }
  return prism(outline, y0, y1, bevel, [cx, cz]);
}

/** Vytažený konvexní obrys (body [x, z, nx, nz] proti směru hodinek při pohledu shora) od y0 do y1. */
export function prism(outline, y0, y1, bevel = 0, center = null) {
  const g = newGeom();
  const m = outline.length;
  const cen = center || [outline.reduce((s, p) => s + p[0], 0) / m, outline.reduce((s, p) => s + p[1], 0) / m];
  const b = Math.min(bevel, (y1 - y0) / 2);
  const inset = (p, d) => [p[0] - p[2] * d, p[1] - p[3] * d];
  const side = (y) => outline.map((p) => vert(g, [p[0], y, p[1]], [p[2], 0, p[3]], [0, y]));
  const bev = (y, d, ny) => outline.map((p) => {
    const q = inset(p, d);
    return vert(g, [q[0], y, q[1]], norm([p[2] * 0.7, ny * 0.7, p[3] * 0.7]), [0, y]);
  });
  const loop = (A, B) => {
    for (let i = 0; i < m; i++) quad(g, A[i], A[(i + 1) % m], B[(i + 1) % m], B[i]);
  };
  const cap = (y, d, ny) => {
    const ids = outline.map((p) => {
      const q = inset(p, d);
      return vert(g, [q[0], y, q[1]], [0, ny, 0], [q[0], q[1]]);
    });
    const c = vert(g, [cen[0], y, cen[1]], [0, ny, 0], [cen[0], cen[1]]);
    for (let i = 0; i < m; i++) tri(g, c, ids[i], ids[(i + 1) % m]);
  };
  if (b > 0) {
    const lowB = bev(y0, b, -1);
    const lowS = side(y0 + b);
    const topS = side(y1 - b);
    const topB = bev(y1, b, 1);
    loop(lowB, lowS);
    loop(lowS, topS);
    loop(topS, topB);
    cap(y0, b, -1);
    cap(y1, b, 1);
  } else {
    loop(side(y0), side(y1));
    cap(y0, 0, -1);
    cap(y1, 0, 1);
  }
  return g;
}

/**
 * Trubka po lomené dráze (body [x, y, z]) s poloměrem rad a seg stěnami; zalomení se vyhladí do oblouku, když
 * bend > 0 (poloměr ohybu). caps: zaslepit konce.
 */
export function tube(path, rad, seg = 8, o = {}) {
  const pts = o.bend ? bendPath(path, o.bend, o.bendSeg ?? 4) : path;
  const g = newGeom();
  const T = pts.map((p, i) => norm(i === 0 ? sub3(pts[1], p) : i === pts.length - 1 ? sub3(p, pts[i - 1]) : add3(norm(sub3(p, pts[i - 1])), norm(sub3(pts[i + 1], p)))));
  // rámce přenášené po dráze (bez zkroucení)
  let N0 = Math.abs(T[0][1]) < 0.9 ? norm(cross3(T[0], [0, 1, 0])) : norm(cross3(T[0], [1, 0, 0]));
  const rings = [];
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) {
      const axis = cross3(T[i - 1], T[i]);
      const s = Math.hypot(...axis);
      if (s > 1e-9) {
        const ang = Math.atan2(s, dot3(T[i - 1], T[i]));
        N0 = rotateAround(N0, norm(axis), ang);
      }
    }
    const B = norm(cross3(T[i], N0));
    // v ohybu se prstenec natáhne, aby stěna měla stálou tloušťku
    const k = i > 0 && i < pts.length - 1 ? 1 / Math.max(0.5, dot3(norm(sub3(pts[i], pts[i - 1])), T[i])) : 1;
    const ids = [];
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const n = norm(add3(scale3(N0, Math.cos(a)), scale3(B, Math.sin(a))));
      ids.push(vert(g, add3(pts[i], scale3(n, rad * (Math.abs(dot3(n, T[i])) < 1 ? k : 1))), n, [j / seg, i / (pts.length - 1)]));
    }
    rings.push(ids);
  }
  for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < seg; j++) quad(g, rings[i][j], rings[i][(j + 1) % seg], rings[i + 1][(j + 1) % seg], rings[i + 1][j]);
  if (o.caps !== false) {
    for (const [i, dir] of [[0, -1], [pts.length - 1, 1]]) {
      const n = scale3(T[i], dir);
      const c = vert(g, pts[i], n, [0.5, 0.5]);
      const ids = rings[i].map((id) => vert(g, [g.positions[id * 3], g.positions[id * 3 + 1], g.positions[id * 3 + 2]], n, [0.5, 0.5]));
      for (let j = 0; j < seg; j++) tri(g, c, ids[j], ids[(j + 1) % seg]);
    }
  }
  return g;
}

/** Zalomení lomené čáry nahradí obloukem o poloměru rad (n úseků). */
function bendPath(path, rad, n) {
  const out = [path[0]];
  for (let i = 1; i + 1 < path.length; i++) {
    const p = path[i];
    const d1 = norm(sub3(path[i - 1], p));
    const d2 = norm(sub3(path[i + 1], p));
    const theta = Math.acos(Math.max(-1, Math.min(1, dot3(d1, d2))));
    if (Math.PI - theta < 1e-3) {
      out.push(p);
      continue;
    }
    const t = Math.min(rad / Math.tan(theta / 2), Math.hypot(...sub3(path[i - 1], p)) / 2, Math.hypot(...sub3(path[i + 1], p)) / 2);
    const s = add3(p, scale3(d1, t));
    const e = add3(p, scale3(d2, t));
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      // kvadratická Bézierova křivka s, p, e
      const a = scale3(s, (1 - u) * (1 - u));
      const b = scale3(p, 2 * u * (1 - u));
      const c = scale3(e, u * u);
      out.push(add3(add3(a, b), c));
    }
  }
  out.push(path[path.length - 1]);
  return out;
}

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function rotateAround(v, k, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const kv = cross3(k, v);
  const kd = dot3(k, v);
  return [0, 1, 2].map((i) => v[i] * c + kv[i] * s + k[i] * kd * (1 - c));
}

// ---- rotační zkratky (osa Y, dno v y0) -----------------------------------------------------

/** Válec se zaoblenými hranami (poloměr hrany e; 0 = ostré). */
export const cylinder = (r, y0, y1, o = {}) => lathe(roundedCyl(r, y0, y1, o.edge ?? 0, o.n ?? 2), o);
function roundedCyl(r, y0, y1, e, n) {
  if (!e) return [[0, y0], [r, y0, 'c'], [r, y1, 'c'], [0, y1]];
  return [[0, y0], ...arc(r - e, y0 + e, e, -90, 0, n), ...arc(r - e, y1 - e, e, 0, 90, n), [0, y1]];
}
/** Komolý kužel (r0 dole, r1 nahoře); r1 = 0 je špička. */
export const cone = (r0, r1, y0, y1, o = {}) => lathe([[0, y0], [r0, y0, 'c'], ...(r1 > 0 ? [[r1, y1, 'c'], [0, y1]] : [[0, y1]])], o);
/** Koule (n poledníkových úseků). */
export const sphere = (r, cy, o = {}) => lathe(arc(0, cy, r, -90, 90, o.n ?? 8), o);
/** Prstenec (torus) kolem osy Y: poloměr R ke středu trubky, trubka r, n úseků trubky. */
export const torus = (R, r, y, o = {}) => lathe(arc(R, y, r, -90, 270, o.n ?? 8), o);
/** Jehlan nebo hranol s k stěnami: lathe s k stěnami a ostrými hranami (normály po stěnách). */
export function pyramid(r0, r1, y0, y1, k = 4, phase = 45) {
  const g = newGeom();
  const ang = (j) => ((phase + (360 * j) / k) * Math.PI) / 180;
  const P = (r, y, j) => [r * Math.cos(ang(j)), y, -r * Math.sin(ang(j))];
  for (let j = 0; j < k; j++) {
    const a = P(r0, y0, j);
    const b = P(r0, y0, j + 1);
    const c = P(r1, y1, j + 1);
    const d = P(r1, y1, j);
    const n = norm(cross3(sub3(b, a), sub3(d, a)));
    const nn = dot3(n, [Math.cos(ang(j + 0.5)), 0, -Math.sin(ang(j + 0.5))]) < 0 ? scale3(n, -1) : n;
    const ids = [a, b, c, d].map((p) => vert(g, p, nn, [0, 0]));
    if (r1 > 0) quad(g, ...ids);
    else tri(g, ids[0], ids[1], ids[2]);
  }
  for (const [r, y, ny] of [[r0, y0, -1], [r1, y1, 1]]) {
    if (r <= 0) continue;
    const c = vert(g, [0, y, 0], [0, ny, 0], [0.5, 0.5]);
    const ids = Array.from({ length: k }, (_, j) => vert(g, P(r, y, j), [0, ny, 0], [0.5, 0.5]));
    for (let j = 0; j < k; j++) tri(g, c, ids[j], ids[(j + 1) % k]);
  }
  return g;
}

/** Rotační těleso položené: osa z Y do osy X nebo Z, posunuté do bodu c. */
export function laid(g, axis, c = [0, 0, 0]) {
  const R = axis === 'x' ? mRotate('z', -90) : axis === 'z' ? mRotate('x', 90) : null;
  return append(newGeom(), g, R ? at(mTranslate(...c), R) : mTranslate(...c));
}
