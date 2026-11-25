// xSpace: díly prefabu lathe (rotační plocha z profilu) a rbox (kvádr se zaoblenými hranami), N-012, D-058.
// Převzato ze sešny B (`tools/forge/mesh/lathe.mjs` a `solids.mjs`, 25. 11. 2026): polohy, normály a trojúhelníky
// jsou bit po bitu stejné jako v xForge (ověřeno při převzetí); jiné jsou jen UV, které jsou tady v metrech jako
// u kvádru a válce (textura se dlaždicuje podle uvScale). Síť má tvar partMesh: { positions, normals, uvs, indices }.
// Čisté funkce bez knihoven; volá je jen geom.js (partMesh, partTris).

const EPS = 1e-7;

const newGeom = () => ({ positions: [], normals: [], uvs: [], indices: [] });
function vert(g, p, n, uv) {
  g.positions.push(p[0], p[1], p[2]);
  g.normals.push(n[0], n[1], n[2]);
  g.uvs.push(uv[0], uv[1]);
  return g.positions.length / 3 - 1;
}
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const P = (g, i) => [g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]];
const N = (g, i) => [g.normals[i * 3], g.normals[i * 3 + 1], g.normals[i * 3 + 2]];

/**
 * Trojúhelník a, b, c s lícem tam, kam míří normály vrcholů: pořadí se otočí, když geometrická normála míří
 * proti součtu normál vrcholů. Degenerovaný trojúhelník (nulová plocha) se vynechá.
 */
function tri(g, a, b, c) {
  const pa = P(g, a);
  const pb = P(g, b);
  const pc = P(g, c);
  const u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
  const v = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (Math.hypot(n[0], n[1], n[2]) < 1e-12) return;
  const na = N(g, a);
  const nb = N(g, b);
  const nc = N(g, c);
  const d = n[0] * (na[0] + nb[0] + nc[0]) + n[1] * (na[1] + nb[1] + nc[1]) + n[2] * (na[2] + nb[2] + nc[2]);
  if (d >= 0) g.indices.push(a, b, c);
  else g.indices.push(a, c, b);
}
function quad(g, a, b, c, d) {
  tri(g, a, b, c);
  tri(g, a, c, d);
}

/**
 * Rotační plocha kolem osy Y v souřadnicích dílu: bod profilu [r, y] obíhá ve vzdálenosti r (x = r·cos a,
 * z = −r·sin a). Líc vpravo od směru chůze po profilu (nahoru po vnější stěně = ven). Bod s r = 0 je pól.
 * @param profile [[r, y], …]
 * @param o { seg, crease: Set indexů s ostrou hranou, arc: [a0, a1] ve stupních (chybí = celý obvod) }
 */
export function latheMesh(profile, o = {}) {
  const seg = o.seg ?? 24;
  const full = !o.arc;
  const a0 = ((full ? 0 : o.arc[0]) * Math.PI) / 180;
  const a1 = full ? a0 + Math.PI * 2 : (o.arc[1] * Math.PI) / 180;
  const cols = full ? seg : seg + 1;
  const angle = (j) => a0 + ((a1 - a0) * j) / seg;
  const crease = o.crease || new Set();
  const pts = profile.map((p, i) => ({ r: Math.max(0, p[0]), y: p[1], crease: crease.has(i) }));
  const rMax = Math.max(...pts.map((p) => p.r));
  const segN = []; // normály úseků (2D, vpravo od směru): (dy, −dr)
  for (let i = 0; i + 1 < pts.length; i++) {
    const dr = pts[i + 1].r - pts[i].r;
    const dy = pts[i + 1].y - pts[i].y;
    const l = Math.hypot(dr, dy) || 1;
    segN.push([dy / l, -dr / l]);
  }
  const len = [0]; // délka po profilu v metrech (souřadnice v)
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].r - pts[i - 1].r, pts[i].y - pts[i - 1].y));
  const g = newGeom();
  // prstenec bodu i s 2D normálou n; u pólu jeden vrchol; u = oblouk po největším poloměru v metrech
  const ring = (i, n) => {
    const p = pts[i];
    if (p.r < EPS) {
      const k = vert(g, [0, p.y, 0], [0, Math.sign(n[1]) || 1, 0], [0, len[i]]);
      return { pole: true, ids: Array(cols).fill(k) };
    }
    const ids = [];
    for (let j = 0; j < cols; j++) {
      const a = angle(j);
      const c = Math.cos(a);
      const s = Math.sin(a);
      ids.push(vert(g, [p.r * c, p.y, -p.r * s], norm([n[0] * c, n[1], -n[0] * s]), [((a1 - a0) * j * rMax) / seg, len[i]]));
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

/**
 * Kvádr se zaoblenými hranami a rohy (poloměr rad, s úseků oblouku). Plochy jsou rovné, hrany kulaté.
 * s = 1 dá sraženou hranu s hladkou normálou (108 △), s = 2 oblou hranu (300 △), s = 3 (588 △), s = 4 (972 △).
 * UV v metrech jako u kvádru: dvě osy roviny stěny.
 */
export function rboxMesh(min, max, rad, s = 2) {
  const h = [0, 1, 2].map((k) => (max[k] - min[k]) / 2);
  const c = [0, 1, 2].map((k) => (max[k] + min[k]) / 2);
  const r = Math.min(rad, ...h.map((x) => x * 0.999));
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
    const ids = A[u].map((a) =>
      A[v].map((b) => {
        const q = [0, 0, 0];
        q[k] = fixed;
        q[u] = a;
        q[v] = b;
        const { p, n } = proj(q);
        const face = [0, 0, 0];
        face[k] = sign;
        return vert(g, p, n || face, [p[u], p[v]]);
      }),
    );
    for (let i = 0; i + 1 < ids.length; i++) for (let j = 0; j + 1 < ids[i].length; j++) quad(g, ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
  }
  return g;
}

/** Natočí síť rotační plochy z osy Y do osy axis (x: +Y → +X, z: +Y → +Z) a posune ji do center; mění g. */
export function placeLathe(g, axis = 'y', center = [0, 0, 0]) {
  const [cx, cy, cz] = center;
  const turn = (a, i, add) => {
    const x = a[i];
    const y = a[i + 1];
    const z = a[i + 2];
    if (axis === 'x') [a[i], a[i + 1], a[i + 2]] = [y, -x, z];
    else if (axis === 'z') [a[i], a[i + 1], a[i + 2]] = [x, -z, y];
    if (add) {
      a[i] += cx;
      a[i + 1] += cy;
      a[i + 2] += cz;
    }
  };
  for (let i = 0; i < g.positions.length; i += 3) {
    turn(g.positions, i, true);
    turn(g.normals, i, false);
  }
  return g;
}
