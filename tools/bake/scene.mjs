// xBake, scéna: vzorky světla, stínítka a paprsky.
// Vzorky jsou vrcholy sítě brushLightMesh ve stejném pořadí (kontrakt: 02_KONTRAKTY, Světlo). Stínítka jsou kvádry
// a klíny levelu a díly prefabů v klidové poloze. Zastínění počítá tento soubor (light.js: „zastínění řeší volající“).

import { brushLightMesh, LIGHT_CELL, entityMatrix, rigMatrices, mat4Mul, mat4Point } from '../../src/xspace/index.js';

export const NORMAL_OFFSET = 0.02; // počátek paprsku leží 2 cm nad plochou (stejně jako běh)…
export const INWARD = 0.01; // …a 1 cm směrem ke středu plochy, aby vzorek na hraně neležel přesně ve stěně
const EPS = 1e-7;

/** Inverze afinní matice 4 × 4 (sloupcové pořadí jako v rig.js). */
function affineInverse(m) {
  const [a, b, c, , d, e, f, , g, h, i] = m;
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e);
  const r = [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det, (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det, (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det];
  const t = [m[12], m[13], m[14]];
  return [r[0], r[1], r[2], 0, r[3], r[4], r[5], 0, r[6], r[7], r[8], 0, -(r[0] * t[0] + r[3] * t[1] + r[6] * t[2]), -(r[1] * t[0] + r[4] * t[1] + r[7] * t[2]), -(r[2] * t[0] + r[5] * t[1] + r[8] * t[2]), 1];
}
const vec = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z];

/** Vzorky: polohy, normály, počátky paprsků, plochy (kvůli nejbližšímu vzorku a doplnění zakrytých vrcholů). */
export function buildSamples(level, cell = LIGHT_CELL) {
  const meshes = level.brushes.map((b) => brushLightMesh(b, cell));
  const counts = meshes.map((m) => m.positions.length / 3);
  const offsets = [];
  let n = 0;
  for (const c of counts) {
    offsets.push(n);
    n += c;
  }
  const pos = new Float64Array(n * 3);
  const nrm = new Float64Array(n * 3);
  const org = new Float64Array(n * 3);
  const faces = []; // { brush, base, count, n: [x,y,z], p0, eu, ev, nu, nv } (nu = 0 u trojúhelníkové plochy)
  const facesOf = level.brushes.map(() => []);
  const nbrStart = new Uint32Array(n + 1);
  const pairs = [];
  meshes.forEach((m, bi) => {
    const off = offsets[bi];
    pos.set(m.positions, off * 3);
    nrm.set(m.normals, off * 3);
    for (const g of m.groups) {
      let lo = Infinity;
      let hi = -1;
      for (let k = g.start; k < g.start + g.count; k++) {
        const v = m.indices[k];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      for (let k = g.start; k < g.start + g.count; k += 3) {
        const t = [m.indices[k], m.indices[k + 1], m.indices[k + 2]];
        for (let q = 0; q < 3; q++) pairs.push(off + t[q], off + t[(q + 1) % 3], off + t[(q + 1) % 3], off + t[q]);
      }
      const P = (v) => [m.positions[v * 3], m.positions[v * 3 + 1], m.positions[v * 3 + 2]];
      const count = hi - lo + 1;
      const c = [0, 0, 0];
      for (let v = lo; v <= hi; v++) for (let k = 0; k < 3; k++) c[k] += m.positions[v * 3 + k] / count;
      const p0 = P(lo);
      const d1 = P(lo + 1).map((x, k) => x - p0[k]);
      // délka řádku mřížky: první vrchol, který neleží na přímce p0 → p1
      let row = count;
      for (let i = 2; i < count; i++) {
        const w = P(lo + i).map((x, k) => x - p0[k]);
        const cr = [d1[1] * w[2] - d1[2] * w[1], d1[2] * w[0] - d1[0] * w[2], d1[0] * w[1] - d1[1] * w[0]];
        if (Math.hypot(...cr) > 1e-9) {
          row = i;
          break;
        }
      }
      const quad = count % row === 0 && g.count === 6 * (row - 1) * (count / row - 1);
      const f = { brush: bi, base: off + lo, count, n: [m.normals[lo * 3], m.normals[lo * 3 + 1], m.normals[lo * 3 + 2]], p0, nu: 0, nv: 0, eu: null, ev: null };
      if (quad) {
        f.nu = row - 1;
        f.nv = count / row - 1;
        f.eu = P(lo + f.nu).map((x, k) => x - p0[k]);
        f.ev = P(lo + f.nv * row).map((x, k) => x - p0[k]);
      }
      for (let v = lo; v <= hi; v++) {
        const s = (off + v) * 3;
        const to = [c[0] - pos[s], c[1] - pos[s + 1], c[2] - pos[s + 2]];
        const len = Math.hypot(...to);
        const k = len > INWARD ? INWARD / len : 0;
        for (let q = 0; q < 3; q++) org[s + q] = pos[s + q] + nrm[s + q] * NORMAL_OFFSET + to[q] * k;
      }
      facesOf[bi].push(faces.length);
      faces.push(f);
    }
  });
  // sousedé vrcholů (po hranách trojúhelníků téže plochy) v řídkém zápisu
  for (let k = 0; k < pairs.length; k += 2) nbrStart[pairs[k] + 1]++;
  for (let i = 0; i < n; i++) nbrStart[i + 1] += nbrStart[i];
  const nbr = new Uint32Array(pairs.length / 2);
  const fill = nbrStart.slice(0, n);
  for (let k = 0; k < pairs.length; k += 2) nbr[fill[pairs[k]]++] = pairs[k + 1];
  return { n, counts, offsets, pos, nrm, org, faces, facesOf, nbr, nbrStart };
}

/** Nejbližší vzorek kvádru `bi` k bodu h na ploše přivrácené proti směru d. */
export function sampleAt(S, bi, h, d) {
  let best = null;
  let bestGap = Infinity;
  for (const fi of S.facesOf[bi]) {
    const f = S.faces[fi];
    if (f.n[0] * d[0] + f.n[1] * d[1] + f.n[2] * d[2] >= 0) continue;
    const gap = Math.abs((h[0] - f.p0[0]) * f.n[0] + (h[1] - f.p0[1]) * f.n[1] + (h[2] - f.p0[2]) * f.n[2]);
    if (gap < bestGap) {
      bestGap = gap;
      best = f;
    }
  }
  if (!best) return -1;
  const f = best;
  if (f.nu) {
    const rel = [h[0] - f.p0[0], h[1] - f.p0[1], h[2] - f.p0[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const i = Math.min(f.nu, Math.max(0, Math.round((dot(rel, f.eu) / dot(f.eu, f.eu)) * f.nu)));
    const j = Math.min(f.nv, Math.max(0, Math.round((dot(rel, f.ev) / dot(f.ev, f.ev)) * f.nv)));
    return f.base + j * (f.nu + 1) + i;
  }
  let at = f.base;
  let dd = Infinity;
  for (let v = f.base; v < f.base + f.count; v++) {
    const q = (S.pos[v * 3] - h[0]) ** 2 + (S.pos[v * 3 + 1] - h[1]) ** 2 + (S.pos[v * 3 + 2] - h[2]) ** 2;
    if (q < dd) {
      dd = q;
      at = v;
    }
  }
  return at;
}

const GLASS = /^glass/; // sklo světlo nestíní (průhlednost ve formátu zatím není, návrh N-005)

/** Stínítka: kvádry a klíny levelu, díly prefabů v klidu. Volná tělesa (dynamic) nestíní: hráč je odnese. */
export function buildBlockers(level, prefabs) {
  const out = [];
  level.brushes.forEach((b, bi) => out.push({ type: b.shape === 'wedge' ? 'wedge' : 'box', min: b.min, max: b.max, brush: bi, rise: b.rise }));
  for (const e of level.entities || []) {
    const pf = prefabs.get(e.prefab);
    if (!pf || (pf.components && pf.components.physics && pf.components.physics.body === 'dynamic')) continue;
    const E = entityMatrix(e);
    const mats = rigMatrices(pf, {});
    for (const p of pf.parts) {
      if (GLASS.test(p.mat || '') || (p.shape !== 'box' && p.shape !== 'cyl')) continue;
      const M = mat4Mul(E, mats[p.node]);
      const lmin = p.shape === 'box' ? p.min : cylBox(p).min;
      const lmax = p.shape === 'box' ? p.max : cylBox(p).max;
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (const x of [lmin[0], lmax[0]]) {
        for (const y of [lmin[1], lmax[1]]) {
          for (const z of [lmin[2], lmax[2]]) {
            const w = mat4Point(M, [x, y, z]);
            for (let k = 0; k < 3; k++) {
              if (w[k] < min[k]) min[k] = w[k];
              if (w[k] > max[k]) max[k] = w[k];
            }
          }
        }
      }
      out.push({ type: p.shape === 'box' ? 'obox' : 'ocyl', min, max, inv: affineInverse(M), lmin, lmax, part: p, entity: e.id });
    }
  }
  return out;
}

function cylBox(p) {
  const k = p.axis === 'x' ? 0 : p.axis === 'y' ? 1 : 2;
  const half = [p.radius, p.radius, p.radius];
  half[k] = p.height / 2;
  return { min: p.center.map((c, i) => c - half[i]), max: p.center.map((c, i) => c + half[i]) };
}

/** Úsek paprsku uvnitř osově zarovnaného kvádru; vrací [t0, t1] nebo null. */
function slab(o, d, min, max, t0, t1) {
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-12) {
      if (o[k] <= min[k] || o[k] >= max[k]) return null;
      continue;
    }
    const a = (min[k] - o[k]) / d[k];
    const c = (max[k] - o[k]) / d[k];
    if (a < c) {
      if (a > t0) t0 = a;
      if (c < t1) t1 = c;
    } else {
      if (c > t0) t0 = c;
      if (a < t1) t1 = a;
    }
    if (t1 - t0 < EPS) return null;
  }
  return [t0, t1];
}

/** Vzdálenost prvního zásahu stínítka na úseku ⟨0, tMax⟩, nebo −1. Počátek uvnitř tělesa dá 0. */
function hit(B, o, d, tMax) {
  if (B.type === 'box') {
    const r = slab(o, d, B.min, B.max, 0, tMax);
    return r ? r[0] : -1;
  }
  if (B.type === 'wedge') {
    const r = slab(o, d, B.min, B.max, 0, tMax);
    if (!r) return -1;
    // těleso klínu leží pod šikmou plochou: výška roste po směru `rise` od min.y k max.y
    const ax = B.rise.endsWith('x') ? 0 : 2;
    const up = B.rise.startsWith('+');
    const run = B.max[ax] - B.min[ax];
    const k = (B.max[1] - B.min[1]) / run;
    const f = (t) => {
      const s = up ? o[ax] + d[ax] * t - B.min[ax] : B.max[ax] - (o[ax] + d[ax] * t);
      return o[1] + d[1] * t - (B.min[1] + k * s);
    };
    const f0 = f(r[0]);
    if (f0 <= 0) return r[0];
    const f1 = f(r[1]);
    return f1 <= 0 ? r[0] + ((r[1] - r[0]) * f0) / (f0 - f1) : -1;
  }
  const lo = mat4Point(B.inv, o);
  const ld = vec(B.inv, d[0], d[1], d[2]);
  const r = slab(lo, ld, B.lmin, B.lmax, 0, tMax);
  if (!r || B.type === 'obox') return r ? r[0] : -1;
  // válec: průnik s nekonečným válcem kolem osy, omezený na úsek uvnitř opsaného kvádru
  const p = B.part;
  const [u, v] = p.axis === 'x' ? [1, 2] : p.axis === 'y' ? [2, 0] : [0, 1];
  const ou = lo[u] - p.center[u];
  const ov = lo[v] - p.center[v];
  const a = ld[u] * ld[u] + ld[v] * ld[v];
  const b = 2 * (ou * ld[u] + ov * ld[v]);
  const c = ou * ou + ov * ov - p.radius * p.radius;
  if (a < 1e-12) return c <= 0 ? r[0] : -1;
  const disc = b * b - 4 * a * c;
  if (disc <= 0) return -1;
  const q = Math.sqrt(disc);
  const t0 = Math.max(r[0], (-b - q) / (2 * a));
  const t1 = Math.min(r[1], (-b + q) / (2 * a));
  return t1 - t0 > EPS ? t0 : -1;
}

/** Strom obalů (dělení v mediánu nejdelší osy). */
function buildTree(items) {
  const node = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], items: null, a: null, b: null };
  for (const it of items) {
    for (let k = 0; k < 3; k++) {
      if (it.min[k] < node.min[k]) node.min[k] = it.min[k];
      if (it.max[k] > node.max[k]) node.max[k] = it.max[k];
    }
  }
  if (items.length <= 4) {
    node.items = items;
    return node;
  }
  const ext = [0, 1, 2].map((k) => node.max[k] - node.min[k]);
  const ax = ext.indexOf(Math.max(...ext));
  const sorted = [...items].sort((p, q) => p.min[ax] + p.max[ax] - (q.min[ax] + q.max[ax]));
  const mid = sorted.length >> 1;
  node.a = buildTree(sorted.slice(0, mid));
  node.b = buildTree(sorted.slice(mid));
  return node;
}

/** Scéna pro paprsky. any(): je na úseku překážka? nearest(): první zásah { t, B }. skip = id entity, která se nepočítá. */
export function buildScene(level, prefabs, cell = LIGHT_CELL) {
  const S = buildSamples(level, cell);
  const blockers = buildBlockers(level, prefabs);
  const root = buildTree(blockers);
  const stack = [];
  const walk = (o, d, tMax, skip, first) => {
    let best = null;
    let bestT = tMax;
    stack.length = 0;
    stack.push(root);
    while (stack.length) {
      const nd = stack.pop();
      if (!slab(o, d, nd.min, nd.max, -EPS, bestT + EPS) && !inside(o, nd)) continue;
      if (nd.items) {
        for (const B of nd.items) {
          if (skip && B.entity === skip) continue;
          const t = hit(B, o, d, bestT);
          if (t < 0) continue;
          if (first) return { t, B };
          if (t < bestT || !best) {
            bestT = t;
            best = { t, B };
          }
        }
      } else {
        stack.push(nd.a, nd.b);
      }
    }
    return best;
  };
  const inside = (o, nd) => o[0] >= nd.min[0] && o[0] <= nd.max[0] && o[1] >= nd.min[1] && o[1] <= nd.max[1] && o[2] >= nd.min[2] && o[2] <= nd.max[2];
  return {
    ...S,
    blockers,
    any: (o, d, tMax, skip) => walk(o, d, tMax, skip, true) !== null,
    nearest: (o, d, tMax, skip) => walk(o, d, tMax, skip, false),
  };
}
