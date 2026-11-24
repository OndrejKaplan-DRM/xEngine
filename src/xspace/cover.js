// Zakrytí otvoru portálu zavřenými dveřmi (D-036, N-007 bod 1, N-109). Engine bere zavřené dveře portálu jako
// neprůhledné a místnost za nimi nekreslí; škvírou by bylo vidět pozadí scény. Pravidlo: kolmý průmět všech
// neprůhledných dílů prefabu dveří v klidové poloze (pevných i pohyblivých) do roviny portálu musí pokrýt celý
// otvor. Neplatí pro dveře se `seeThrough`. Čisté funkce bez knihoven.
//
// Počítají se jen díly `box`, jejichž natočení ve světě je osově zarovnané (dveře v klidu jsou otočené
// o násobky 90°); válce, sítě a šikmé kvádry se nepočítají, pravidlo je tím přísnější. Díl musí ležet nejvýš
// COVER_REACH od roviny portálu.

import { entityMatrix, rigMatrices, mat4Mul, mat4Point } from './rig.js';

/** Jak daleko od roviny portálu smí díl ležet, aby se počítal do zakrytí (m); zárubně mají hloubku do 0,22 m. */
export const COVER_REACH = 0.3;
/** Škvíra užší než tohle se nepočítá (m): zaokrouhlení souřadnic, ne díra. */
export const COVER_EPS = 1e-4;

const opaque = (mat, materials) => {
  const m = materials?.[mat];
  if (!m) return true; // materiál z glTF nebo neznámý: bere se jako neprůhledný (odkaz hlídá jiné pravidlo)
  return !(typeof m.opacity === 'number' && m.opacity < 1) && m.alphaTest === undefined;
};

/** Je horní 3 × 3 matice osově zarovnaná (v každém sloupci jediný nenulový prvek)? */
function axisAligned(M) {
  for (let c = 0; c < 3; c++) {
    let n = 0;
    for (let r = 0; r < 3; r++) if (Math.abs(M[c * 4 + r]) > 1e-6) n++;
    if (n !== 1) return false;
  }
  return true;
}

/**
 * Obdélníky průmětu neprůhledných dílů dveří v klidu do roviny portálu, ořezané otvorem.
 * @returns {{ k: number, u: number, v: number, open: number[], rects: number[][] } | null}
 *          k = osa kolmá na portál, u a v = osy v rovině, open = [u0, u1, v0, v1], rects = [[u0, u1, v0, v1], …]
 */
export function doorCoverRects(portal, entity, prefab, materials = null) {
  const q = portal.quad;
  const span = [0, 1, 2].map((a) => Math.max(...q.map((p) => p[a])) - Math.min(...q.map((p) => p[a])));
  const k = span.indexOf(Math.min(...span));
  const [u, v] = [0, 1, 2].filter((a) => a !== k);
  const plane = q[0][k];
  const open = [Math.min(...q.map((p) => p[u])), Math.max(...q.map((p) => p[u])), Math.min(...q.map((p) => p[v])), Math.max(...q.map((p) => p[v]))];
  const em = entityMatrix(entity);
  const M = rigMatrices(prefab); // klidové hodnoty kloubů (rest, jinak min)
  const rects = [];
  for (const part of prefab.parts || []) {
    if (part.shape !== 'box' || !opaque(part.mat, materials)) continue;
    const W = mat4Mul(em, M[part.node]);
    if (!axisAligned(W)) continue;
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (const x of [part.min[0], part.max[0]]) {
      for (const y of [part.min[1], part.max[1]]) {
        for (const z of [part.min[2], part.max[2]]) {
          const w = mat4Point(W, [x, y, z]);
          for (let a = 0; a < 3; a++) {
            if (w[a] < lo[a]) lo[a] = w[a];
            if (w[a] > hi[a]) hi[a] = w[a];
          }
        }
      }
    }
    if (lo[k] > plane + COVER_REACH || hi[k] < plane - COVER_REACH) continue;
    const r = [Math.max(lo[u], open[0]), Math.min(hi[u], open[1]), Math.max(lo[v], open[2]), Math.min(hi[v], open[3])];
    if (r[0] < r[1] && r[2] < r[3]) rects.push(r);
  }
  return { k, u, v, open, rects };
}

/**
 * Největší nezakrytý obdélník otvoru (z mřížky hran průmětu), nebo null, když je otvor zakrytý celý.
 * @returns {{ w: number, h: number, at: number[], area: number } | null}  w, h v osách u, v; at = střed ve světě
 */
export function doorCoverGap(portal, entity, prefab, materials = null) {
  const { k, u, v, open, rects } = doorCoverRects(portal, entity, prefab, materials);
  const cuts = (i0, i1, a0, a1) => [...new Set([a0, a1, ...rects.flatMap((r) => [r[i0], r[i1]])].filter((x) => x >= a0 && x <= a1))].sort((p, q) => p - q);
  const us = cuts(0, 1, open[0], open[1]);
  const vs = cuts(2, 3, open[2], open[3]);
  let worst = null;
  let area = 0;
  for (let i = 0; i + 1 < us.length; i++) {
    const du = us[i + 1] - us[i];
    if (du < COVER_EPS) continue;
    const cu = (us[i] + us[i + 1]) / 2;
    for (let j = 0; j + 1 < vs.length; j++) {
      const dv = vs[j + 1] - vs[j];
      if (dv < COVER_EPS) continue;
      const cv = (vs[j] + vs[j + 1]) / 2;
      if (rects.some((r) => cu > r[0] && cu < r[1] && cv > r[2] && cv < r[3])) continue;
      area += du * dv;
      if (!worst || du * dv > worst.w * worst.h) {
        const at = [0, 0, 0];
        at[k] = portal.quad[0][k];
        at[u] = cu;
        at[v] = cv;
        worst = { w: du, h: dv, at };
      }
    }
  }
  return worst ? { ...worst, area } : null;
}
