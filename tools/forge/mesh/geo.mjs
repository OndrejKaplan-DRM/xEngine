// xForge, sítě: společný tvar sítě a operace nad ní. Síť má stejný tvar jako partMesh v src/xspace/geom.js
// ({ positions, normals, uvs, indices }), takže ji galerie i engine kreslí stejně jako kvádry a válce.
// Čisté funkce bez knihoven; čísla se zaokrouhlují až při zápisu do .glb.

export const newGeom = () => ({ positions: [], normals: [], uvs: [], indices: [] });

export const tris = (g) => g.indices.length / 3;
export const verts = (g) => g.positions.length / 3;

/** Přidá vrchol, vrátí jeho index. */
export function vert(g, p, n, uv = [0, 0]) {
  g.positions.push(p[0], p[1], p[2]);
  g.normals.push(n[0], n[1], n[2]);
  g.uvs.push(uv[0], uv[1]);
  return g.positions.length / 3 - 1;
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const P = (g, i) => [g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]];
const N = (g, i) => [g.normals[i * 3], g.normals[i * 3 + 1], g.normals[i * 3 + 2]];

/**
 * Trojúhelník a, b, c s lícem tam, kam míří normály vrcholů: pořadí se otočí, když geometrická normála míří
 * proti průměru normál vrcholů. Degenerovaný trojúhelník (nulová plocha) se vynechá.
 */
export function tri(g, a, b, c) {
  const pa = P(g, a);
  const n = cross(sub(P(g, b), pa), sub(P(g, c), pa));
  if (Math.hypot(n[0], n[1], n[2]) < 1e-12) return;
  const avg = [0, 1, 2].map((k) => N(g, a)[k] + N(g, b)[k] + N(g, c)[k]);
  if (dot(n, avg) >= 0) g.indices.push(a, b, c);
  else g.indices.push(a, c, b);
}

/** Čtyřúhelník a-b-c-d (po obvodu) jako dva trojúhelníky. */
export function quad(g, a, b, c, d) {
  tri(g, a, b, c);
  tri(g, a, c, d);
}

/** Připojí síť src (volitelně přes matici 4 × 4 po sloupcích) do dst. */
export function append(dst, src, M = null) {
  const base = verts(dst);
  for (let i = 0; i < verts(src); i++) {
    const p = P(src, i);
    const n = N(src, i);
    if (M) {
      dst.positions.push(M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14]);
      const m = norm([M[0] * n[0] + M[4] * n[1] + M[8] * n[2], M[1] * n[0] + M[5] * n[1] + M[9] * n[2], M[2] * n[0] + M[6] * n[1] + M[10] * n[2]]);
      dst.normals.push(m[0], m[1], m[2]);
    } else {
      dst.positions.push(p[0], p[1], p[2]);
      dst.normals.push(n[0], n[1], n[2]);
    }
    dst.uvs.push(src.uvs[i * 2], src.uvs[i * 2 + 1]);
  }
  for (const k of src.indices) dst.indices.push(k + base);
  return dst;
}

/** Spojí víc sítí do jedné. */
export function merge(...list) {
  const g = newGeom();
  for (const s of list.flat()) if (s) append(g, s);
  return g;
}

// ---- matice (po sloupcích jako v src/xspace/rig.js) ----------------------------------------

export const mTranslate = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
export const mScale = (x, y = x, z = x) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
export function mRotate(axis, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  if (axis === 'x') return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
  if (axis === 'y') return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
export function mMul(A, B) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += A[k * 4 + r] * B[c * 4 + k];
  return out;
}
/** Složení transformací zleva doprava jako v kódu: at(T, R, S) = T · R · S. */
export const at = (...ms) => ms.reduce((a, b) => mMul(a, b));
/** Kopie sítě přes matici. */
export const moved = (g, M) => append(newGeom(), g, M);

/** Posune vrcholy funkcí f(p) → p (deformace, např. hubička kádinky); normály přepočte. */
export function deform(g, f) {
  for (let i = 0; i < verts(g); i++) {
    const q = f(P(g, i), i);
    g.positions[i * 3] = q[0];
    g.positions[i * 3 + 1] = q[1];
    g.positions[i * 3 + 2] = q[2];
  }
  return smoothNormals(g);
}

/**
 * Normály z ploch: součet normál trojúhelníků (vážený plochou) do jejich vrcholů. Vrcholy na hraně (zdvojené
 * při stavbě) zůstávají ostré, sdílené se vyhladí. keep(i) = true ponechá normálu vrcholu.
 */
export function smoothNormals(g, keep = null) {
  const acc = new Array(g.normals.length).fill(0);
  for (let k = 0; k < g.indices.length; k += 3) {
    const [a, b, c] = [g.indices[k], g.indices[k + 1], g.indices[k + 2]];
    const pa = P(g, a);
    const n = cross(sub(P(g, b), pa), sub(P(g, c), pa));
    for (const i of [a, b, c]) for (let q = 0; q < 3; q++) acc[i * 3 + q] += n[q];
  }
  for (let i = 0; i < verts(g); i++) {
    if (keep && keep(i)) continue;
    const n = norm([acc[i * 3], acc[i * 3 + 1], acc[i * 3 + 2]]);
    g.normals[i * 3] = n[0];
    g.normals[i * 3 + 1] = n[1];
    g.normals[i * 3 + 2] = n[2];
  }
  return g;
}

/** Osově zarovnaný obal sítě. */
export function bounds(g) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < g.positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], g.positions[i + k]);
      max[k] = Math.max(max[k], g.positions[i + k]);
    }
  }
  return { min, max };
}

/** Zrcadlí síť podle osy (0 = x, 1 = y, 2 = z): souřadnice i normály, pořadí vrcholů trojúhelníků se otočí. */
export function mirror(g, axis) {
  const out = append(newGeom(), g);
  for (let i = axis; i < out.positions.length; i += 3) {
    out.positions[i] = -out.positions[i];
    out.normals[i] = -out.normals[i];
  }
  for (let k = 0; k < out.indices.length; k += 3) {
    const t = out.indices[k + 1];
    out.indices[k + 1] = out.indices[k + 2];
    out.indices[k + 2] = t;
  }
  return out;
}
