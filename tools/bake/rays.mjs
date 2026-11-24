// xBake, paprsky: co stíní a dotazy na první překážku.
// Stínítka jsou viditelné neprůhledné kvádry a klíny levelu a kolizní tvary prefabů v klidové poloze. Tvar kolize se bere z partCollider
// ze základu (N-101), tady je jen průsečík paprsku s kvádrem, válcem a koulí v prostoru uzlu.
// Křídla dveří v portálech mají značku wing: přímé světlo jimi prochází (zadrží ho brána za běhu, D-035),
// odraz a přístupnost okolního světla se počítají se zavřenými dveřmi a křídla v nich stíní.
// Zastínění počítá xBake (light.js: „zastínění řeší volající“).

import { entityMatrix, rigMatrices, mat4Mul, mat4Point, partCollider } from '../../src/xspace/index.js';

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
const AXIS = { x: 0, y: 1, z: 2 };

/** Uzly prefabu, které se mohou pohnout: mají kloub samy, nebo ho má některý předek. */
export function movingNodes(prefab) {
  const parent = new Map(prefab.rig.nodes.map((n) => [n.id, n.parent]));
  const jointed = new Set((prefab.rig.joints || []).map((j) => j.node));
  const out = new Set();
  for (const n of prefab.rig.nodes) for (let cur = n.id; cur !== undefined; cur = parent.get(cur)) if (jointed.has(cur)) out.add(n.id);
  return out;
}

/** Stíní materiál? Průhledný (opacity pod 1, N-005) nebo s alphaTest světlo pouští. Stejné pravidlo má základ v geom.js. */
const opaque = (m) => !m || (!(m.opacity < 1) && m.alphaTest == null);

/**
 * Stínítka levelu. wingEntities = id entit dveří v portálech (jejich pohyblivé kolize dostanou wing: true).
 * Kvádr levelu stíní, když je vidět (vis není false) a jeho materiály jsou neprůhledné: neviditelná kolize
 * stín nevrhá a sklem světlo projde. Volná tělesa (dynamic) nestíní: hráč je odnese. Kolize skupiny trigger
 * nejsou těleso. materials = { id: materiál } (bez nich se bere vše jako neprůhledné).
 * @returns {{ list: object[], skipped: number }} skipped = kolize tvaru hull a mesh, které partCollider neumí
 */
export function buildBlockers(level, prefabs, wingEntities = new Set(), materials = null) {
  const list = [];
  let skipped = 0;
  const mat = (id) => (materials ? materials[id] : null);
  level.brushes.forEach((b, bi) => {
    if (b.vis === false || !opaque(mat(b.mat)) || !Object.values(b.faces || {}).every((id) => opaque(mat(id)))) return;
    list.push({ type: b.shape === 'wedge' ? 'wedge' : 'box', min: b.min, max: b.max, brush: bi, rise: b.rise });
  });
  for (const e of level.entities || []) {
    const pf = prefabs.get(e.prefab);
    if (!pf || (pf.components && pf.components.physics && pf.components.physics.body === 'dynamic')) continue;
    const E = entityMatrix(e);
    const mats = rigMatrices(pf, {});
    const moving = wingEntities.has(e.id) ? movingNodes(pf) : null;
    for (const c of pf.colliders || []) {
      if (c.group === 'trigger') continue;
      const pc = partCollider(c);
      if (!pc) {
        skipped++;
        continue;
      }
      const sh = pc.shape;
      const half = sh.type === 'box' ? sh.half : sh.type === 'ball' ? [sh.radius, sh.radius, sh.radius] : [0, 1, 2].map((k) => (k === AXIS[sh.axis] ? sh.height / 2 : sh.radius));
      const lmin = pc.center.map((v, k) => v - half[k]);
      const lmax = pc.center.map((v, k) => v + half[k]);
      const M = mat4Mul(E, mats[c.node]);
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
      list.push({ type: sh.type === 'box' ? 'obox' : sh.type === 'cyl' ? 'ocyl' : 'ball', min, max, inv: affineInverse(M), lmin, lmax, center: pc.center, radius: sh.radius, axis: AXIS[sh.axis], entity: e.id, wing: Boolean(moving && moving.has(c.node)) });
    }
  }
  return { list, skipped };
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
  // kolize prefabu: paprsek do prostoru uzlu (afinní zobrazení parametr t zachovává)
  const lo = mat4Point(B.inv, o);
  const ld = vec(B.inv, d[0], d[1], d[2]);
  const r = slab(lo, ld, B.lmin, B.lmax, 0, tMax);
  if (!r || B.type === 'obox') return r ? r[0] : -1;
  let a;
  let b;
  let c;
  if (B.type === 'ball') {
    const [px, py, pz] = [lo[0] - B.center[0], lo[1] - B.center[1], lo[2] - B.center[2]];
    a = ld[0] * ld[0] + ld[1] * ld[1] + ld[2] * ld[2];
    b = 2 * (px * ld[0] + py * ld[1] + pz * ld[2]);
    c = px * px + py * py + pz * pz - B.radius * B.radius;
  } else {
    // válec: průnik s nekonečným válcem kolem osy, omezený na úsek uvnitř opsaného kvádru
    const u = (B.axis + 1) % 3;
    const v = (B.axis + 2) % 3;
    const ou = lo[u] - B.center[u];
    const ov = lo[v] - B.center[v];
    a = ld[u] * ld[u] + ld[v] * ld[v];
    b = 2 * (ou * ld[u] + ov * ld[v]);
    c = ou * ou + ov * ov - B.radius * B.radius;
  }
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

/**
 * Dotazy nad stínítky. skip, skip2 = id entit, které se nepočítají (svítidlo si nestíní, díly entity se vzorky
 * si nestíní, D-041); wings = stíní i křídla dveří v portálech (false pro přímé světlo, true pro odraz a přístupnost).
 *   any(o, d, tMax, skip, wings, skip2)      je na úseku překážka?
 *   nearest(o, d, tMax, skip, wings, skip2)  první zásah { t, B } nebo null
 */
export function buildRays(blockers) {
  const root = buildTree(blockers);
  const stack = [];
  const inside = (o, nd) => o[0] >= nd.min[0] && o[0] <= nd.max[0] && o[1] >= nd.min[1] && o[1] <= nd.max[1] && o[2] >= nd.min[2] && o[2] <= nd.max[2];
  const walk = (o, d, tMax, skip, wings, first, skip2) => {
    let best = null;
    let bestT = tMax;
    stack.length = 0;
    stack.push(root);
    while (stack.length) {
      const nd = stack.pop();
      if (!slab(o, d, nd.min, nd.max, -EPS, bestT + EPS) && !inside(o, nd)) continue;
      if (nd.items) {
        for (const B of nd.items) {
          if ((B.wing && !wings) || (B.entity !== undefined && (B.entity === skip || B.entity === skip2))) continue;
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
  return {
    any: (o, d, tMax, skip = null, wings = false, skip2 = null) => walk(o, d, tMax, skip, wings, true, skip2) !== null,
    nearest: (o, d, tMax, skip = null, wings = false, skip2 = null) => walk(o, d, tMax, skip, wings, false, skip2),
  };
}
