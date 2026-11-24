// Měření prefabu: body, které obepínají díly, a osově zarovnaný obal pro dané polohy kloubů.
// Matice uzlů počítá výhradně src/xspace/rig.js. Používá xForge (obal do dat) i generátor levelů
// (kolik místa prefab zabere v klidu a kolik při pohybu).

import { rigMatrices, mat4Point, CYL_SEGMENTS } from '../xspace/index.js';

/** Počet dílků válce po obvodu: jedna pravda je v základu (geom.js, N-101); tady jen jméno pro měření obalu. */
export const CYL_SIDES = CYL_SEGMENTS;

/** Body, které díl obepínají (kvádr: 8 rohů, válec: opsaný šestnáctiúhelník obou podstav). */
export function partPoints(p) {
  const out = [];
  if (p.shape === 'box') {
    for (const x of [p.min[0], p.max[0]]) for (const y of [p.min[1], p.max[1]]) for (const z of [p.min[2], p.max[2]]) out.push([x, y, z]);
    return out;
  }
  const R = p.radius / Math.cos(Math.PI / CYL_SIDES);
  const [u, v, w] = p.axis === 'x' ? [1, 2, 0] : p.axis === 'y' ? [2, 0, 1] : [0, 1, 2];
  for (let i = 0; i < CYL_SIDES; i++) {
    const a = (i / CYL_SIDES) * Math.PI * 2;
    for (const h of [-p.height / 2, p.height / 2]) {
      const q = [...p.center];
      q[u] += Math.cos(a) * R;
      q[v] += Math.sin(a) * R;
      q[w] += h;
      out.push(q);
    }
  }
  return out;
}

/**
 * Osově zarovnaný obal dílů a jednoduchých kolizí v prostoru prefabu pro dané polohy kloubů (chybějící = klid).
 * Díl ze souboru (mesh) se započte jen s meshPoints(part) → body; generátor soubory nečte a spoléhá na kolize,
 * které síť obepínají (kontroluje B-T9).
 */
export function boundsAt(prefab, values = {}, meshPoints = null) {
  const mats = rigMatrices(prefab, values);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of [...prefab.parts, ...(prefab.colliders || [])]) {
    const pts = p.shape === 'box' || p.shape === 'cyl' ? partPoints(p) : meshPoints && p.shape === 'mesh' ? meshPoints(p) : null;
    if (!pts) continue;
    for (const q of pts) {
      const w = mat4Point(mats[p.node], q);
      for (let k = 0; k < 3; k++) {
        if (w[k] < min[k]) min[k] = w[k];
        if (w[k] > max[k]) max[k] = w[k];
      }
    }
  }
  return { min, max };
}
