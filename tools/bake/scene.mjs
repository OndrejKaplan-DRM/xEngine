// xBake, scéna: vzorky světla a jejich plochy.
// Vzorky levelu definuje levelSamples ze základu (kontrakt: 02_KONTRAKTY, Světlo; mřížka znění 2, D-037; D-041):
// nejdřív jedna síť na kvádr v pořadí kvádrů (bez ploch schovaných celé v jiném kvádru, null pro kvádr s vis: false),
// potom vrcholy pevných dílů prefabů po entitách. Plocha dílu prefabu = souvislá část jeho sítě (stěna kvádru,
// plášť a podstavy válce); mřížku řad a sloupců nemá, takže okraj stínu na ní není po podílech.
// Počet, pořadí ani rozteč vrcholů se tu nikde nepředpokládá: plocha si nese skutečné souřadnice svých řad
// a sloupců (vrcholy leží na násobcích buňky ve světě, krajní dílky jsou kratší). Stínítka a paprsky jsou v rays.mjs.

import { levelSamples, LIGHT_CELL } from '../../src/xspace/index.js';
import { buildBlockers, buildRays } from './rays.mjs';

export const NORMAL_OFFSET = 0.02; // počátek paprsku leží 2 cm nad plochou (stejně jako běh)…
export const INWARD = 0.01; // …a 1 cm směrem ke středu plochy, aby vzorek na hraně neležel přesně ve stěně

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Index hodnoty v rostoucím poli, která je nejblíž x. */
function nearestIndex(arr, x) {
  let lo = 0;
  let hi = arr.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid;
    else hi = mid;
  }
  return Math.abs(arr[hi] - x) < Math.abs(arr[lo] - x) ? hi : lo;
}

/** Souvislé části sítě (po hranách trojúhelníků): pro každý vrchol číslo části, části číslované od 0. */
function components(count, indices) {
  const up = Int32Array.from({ length: count }, (_, i) => i);
  const find = (i) => {
    while (up[i] !== i) i = up[i] = up[up[i]];
    return i;
  };
  for (let k = 0; k < indices.length; k += 3) {
    const a = find(indices[k]);
    for (let q = 1; q < 3; q++) {
      const b = find(indices[k + q]);
      if (b !== a) up[b] = a;
    }
  }
  const id = new Map();
  return Int32Array.from({ length: count }, (_, i) => {
    const r = find(i);
    if (!id.has(r)) id.set(r, id.size);
    return id.get(r);
  });
}

/**
 * Vzorky: polohy, normály, počátky paprsků, plochy (kvůli nejbližšímu vzorku, plošce vzorku a doplnění zakrytých).
 * prefabs (Map id → prefab) přidá vzorky pevných dílů prefabů (D-041); bez nich jen kvádry.
 * entOf[s] = index entity v level.entities (−1 u kvádru): díly entity si nestíní.
 */
export function buildSamples(level, cell = LIGHT_CELL, materials = null, prefabs = null) {
  const L = levelSamples(prefabs ? level : { ...level, entities: [] }, prefabs || new Map(), materials, cell);
  const meshes = L.brushes;
  const counts = meshes.map((m) => (m ? m.positions.length / 3 : 0));
  const offsets = [];
  let n = 0;
  for (const c of counts) {
    offsets.push(n);
    n += c;
  }
  const entityCounts = L.entityCounts;
  const entityOffsets = [];
  for (const [, c] of entityCounts) {
    entityOffsets.push(n);
    n += c;
  }
  const entOf = new Int32Array(n).fill(-1);
  const pos = new Float64Array(n * 3);
  const nrm = new Float64Array(n * 3);
  const org = new Float64Array(n * 3);
  // plocha: { brush, base, count, n, p0, cols, rows, eu, ev, us, vs }; u trojúhelníkové plochy je cols = 0.
  // eu, ev jsou jednotkové směry sloupců a řad, us a vs souřadnice sloupců a řad podél nich (od p0, rostoucí).
  const faces = [];
  const facesOf = level.brushes.map(() => []);
  const faceOf = new Int32Array(n).fill(-1);
  const nbrStart = new Uint32Array(n + 1);
  const pairs = [];
  meshes.forEach((m, bi) => {
    if (!m) return;
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
      // pravidelná mřížka řad a sloupců: sedí počet trojúhelníků a poslední vrchol leží v protějším rohu
      // (trojúhelníková plocha se dvěma dílky má stejné počty jako mřížka 3 × 2, roh ji prozradí)
      let quad = count % row === 0 && count / row >= 2 && g.count === 6 * (row - 1) * (count / row - 1);
      if (quad) {
        const [a, b, z] = [P(lo + row - 1), P(lo + (count / row - 1) * row), P(hi)];
        quad = Math.hypot(...z.map((x, k) => x - (a[k] + b[k] - p0[k]))) < 1e-6;
      }
      const f = { brush: bi, base: off + lo, count, n: [m.normals[lo * 3], m.normals[lo * 3 + 1], m.normals[lo * 3 + 2]], p0, cols: 0, rows: 0, eu: null, ev: null, us: null, vs: null };
      if (quad) {
        f.cols = row;
        f.rows = count / row;
        const unit = (a) => {
          const w = a.map((x, k) => x - p0[k]);
          const len = Math.hypot(...w) || 1;
          return w.map((x) => x / len);
        };
        f.eu = unit(P(lo + row - 1));
        f.ev = unit(P(lo + (f.rows - 1) * row));
        f.us = Float64Array.from({ length: f.cols }, (_, i) => dot(P(lo + i).map((x, k) => x - p0[k]), f.eu));
        f.vs = Float64Array.from({ length: f.rows }, (_, j) => dot(P(lo + j * row).map((x, k) => x - p0[k]), f.ev));
      }
      for (let v = lo; v <= hi; v++) {
        const s = (off + v) * 3;
        const to = [c[0] - pos[s], c[1] - pos[s + 1], c[2] - pos[s + 2]];
        const len = Math.hypot(...to);
        const k = len > INWARD ? INWARD / len : 0;
        for (let q = 0; q < 3; q++) org[s + q] = pos[s + q] + nrm[s + q] * NORMAL_OFFSET + to[q] * k;
        faceOf[off + v] = faces.length;
      }
      facesOf[bi].push(faces.length);
      faces.push(f);
    }
  });
  // pevné díly prefabů: plocha = souvislá část sítě dílu; počátek paprsku 2 cm nad plochou a 1 cm k jejímu středu
  L.entities.forEach((m, ei) => {
    if (!m) return;
    const off = entityOffsets[ei];
    pos.set(m.positions, off * 3);
    nrm.set(m.normals, off * 3);
    entOf.fill(ei, off, off + m.positions.length / 3);
    for (const [, v0, cnt] of m.parts) {
      const idx = [];
      for (const k of m.indices) if (k >= v0 && k < v0 + cnt) idx.push(k - v0);
      const comp = components(cnt, idx);
      const nComp = comp.reduce((a, c) => Math.max(a, c + 1), 0);
      const cen = Array.from({ length: nComp }, () => [0, 0, 0, 0]);
      for (let v = 0; v < cnt; v++) {
        const c = cen[comp[v]];
        for (let q = 0; q < 3; q++) c[q] += m.positions[(v0 + v) * 3 + q];
        c[3]++;
      }
      const faceBase = faces.length;
      for (const c of cen) {
        const f = { brush: -1, entity: ei, base: -1, count: c[3], n: null, p0: [c[0] / c[3], c[1] / c[3], c[2] / c[3]], cols: 0, rows: 0, eu: null, ev: null, us: null, vs: null };
        faces.push(f);
      }
      for (let k = 0; k < idx.length; k += 3) {
        const t = [off + v0 + idx[k], off + v0 + idx[k + 1], off + v0 + idx[k + 2]];
        for (let q = 0; q < 3; q++) pairs.push(t[q], t[(q + 1) % 3], t[(q + 1) % 3], t[q]);
      }
      for (let v = 0; v < cnt; v++) {
        const sIdx = off + v0 + v;
        const f = faces[faceBase + comp[v]];
        if (f.base < 0) {
          f.base = sIdx;
          f.n = [nrm[sIdx * 3], nrm[sIdx * 3 + 1], nrm[sIdx * 3 + 2]];
        }
        const sp = sIdx * 3;
        const to = [f.p0[0] - pos[sp], f.p0[1] - pos[sp + 1], f.p0[2] - pos[sp + 2]];
        const len = Math.hypot(...to);
        const k = len > INWARD ? INWARD / len : 0;
        for (let q = 0; q < 3; q++) org[sp + q] = pos[sp + q] + nrm[sp + q] * NORMAL_OFFSET + to[q] * k;
        faceOf[sIdx] = faceBase + comp[v];
      }
    }
  });
  // sousedé vrcholů (po hranách trojúhelníků téže plochy) v řídkém zápisu
  for (let k = 0; k < pairs.length; k += 2) nbrStart[pairs[k] + 1]++;
  for (let i = 0; i < n; i++) nbrStart[i + 1] += nbrStart[i];
  const nbr = new Uint32Array(pairs.length / 2);
  const fill = nbrStart.slice(0, n);
  for (let k = 0; k < pairs.length; k += 2) nbr[fill[pairs[k]]++] = pairs[k + 1];
  return { n, counts, offsets, entityCounts, entityOffsets, entOf, pos, nrm, org, faces, facesOf, faceOf, nbr, nbrStart };
}

const ON_FACE = 0.05; // m; bod zásahu musí ležet v rovině plochy, jinak plocha se vzorky pro něj neexistuje

/** Nejbližší vzorek kvádru `bi` k bodu h na ploše přivrácené proti směru d; −1, když taková plocha vzorky nemá. */
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
  if (!best || bestGap > ON_FACE) return -1; // schovaná plocha (D-037) nebo kvádr bez vzorků
  const f = best;
  if (f.cols) {
    const rel = [h[0] - f.p0[0], h[1] - f.p0[1], h[2] - f.p0[2]];
    return f.base + nearestIndex(f.vs, dot(rel, f.ev)) * f.cols + nearestIndex(f.us, dot(rel, f.eu));
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

/**
 * Ploška vzorku: část plochy, která je mu blíž než sousedním vzorkům, oříznutá okrajem plochy.
 * Vrací { eu, ev, u0, u1, v0, v1 } (posuny od vzorku podél eu a ev v metrech), nebo null u trojúhelníkové plochy.
 */
export function samplePatch(S, s, out = {}) {
  const f = S.faces[S.faceOf[s]];
  if (!f || !f.cols) return null;
  const k = s - f.base;
  const i = k % f.cols;
  const j = (k - i) / f.cols;
  out.eu = f.eu;
  out.ev = f.ev;
  out.u0 = i > 0 ? (f.us[i - 1] - f.us[i]) / 2 : 0;
  out.u1 = i < f.cols - 1 ? (f.us[i + 1] - f.us[i]) / 2 : 0;
  out.v0 = j > 0 ? (f.vs[j - 1] - f.vs[j]) / 2 : 0;
  out.v1 = j < f.rows - 1 ? (f.vs[j + 1] - f.vs[j]) / 2 : 0;
  return out;
}

/** Scéna pro zapékání: vzorky, stínítka a dotazy any() a nearest() (viz rays.mjs). */
export function buildScene(level, prefabs, cell = LIGHT_CELL, wingEntities = new Set(), materials = null, entitySamples = true) {
  const S = buildSamples(level, cell, materials, entitySamples ? prefabs : null);
  const { list, skipped } = buildBlockers(level, prefabs, wingEntities, materials);
  return { ...S, blockers: list, skippedColliders: skipped, ...buildRays(list) };
}
