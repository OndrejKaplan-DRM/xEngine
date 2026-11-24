// xBake, scéna: vzorky světla a jejich plochy.
// Vzorky jsou vrcholy sítě brushLightMesh ve stejném pořadí (kontrakt: 02_KONTRAKTY, Světlo). Počet, pořadí ani
// rozteč vrcholů se tu nikde nepředpokládá: plocha si nese skutečné souřadnice svých řad a sloupců, takže
// změna mřížky v základu (D-037) tenhle soubor nerozbije. Stínítka a paprsky jsou v rays.mjs.

import { brushLightMesh, LIGHT_CELL } from '../../src/xspace/index.js';
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

/** Vzorky: polohy, normály, počátky paprsků, plochy (kvůli nejbližšímu vzorku, plošce vzorku a doplnění zakrytých). */
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
  // plocha: { brush, base, count, n, p0, cols, rows, eu, ev, us, vs }; u trojúhelníkové plochy je cols = 0.
  // eu, ev jsou jednotkové směry sloupců a řad, us a vs souřadnice sloupců a řad podél nich (od p0, rostoucí).
  const faces = [];
  const facesOf = level.brushes.map(() => []);
  const faceOf = new Int32Array(n).fill(-1);
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
  // sousedé vrcholů (po hranách trojúhelníků téže plochy) v řídkém zápisu
  for (let k = 0; k < pairs.length; k += 2) nbrStart[pairs[k] + 1]++;
  for (let i = 0; i < n; i++) nbrStart[i + 1] += nbrStart[i];
  const nbr = new Uint32Array(pairs.length / 2);
  const fill = nbrStart.slice(0, n);
  for (let k = 0; k < pairs.length; k += 2) nbr[fill[pairs[k]]++] = pairs[k + 1];
  return { n, counts, offsets, pos, nrm, org, faces, facesOf, faceOf, nbr, nbrStart };
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
export function buildScene(level, prefabs, cell = LIGHT_CELL, wingEntities = new Set()) {
  const S = buildSamples(level, cell);
  const { list, skipped } = buildBlockers(level, prefabs, wingEntities);
  return { ...S, blockers: list, skippedColliders: skipped, ...buildRays(list) };
}
