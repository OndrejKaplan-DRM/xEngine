// xBake: zapečené světlo po vrcholech a po vrstvách (B1.3, D-022).
// Jedna vrstva na světlo = osvětlení E vzorků při plné úrovni světla (skalár, barvou světla násobí běh).
// Navíc vrstva nepřímého světla (jeden odraz základních světel levelu, RGB) a vrstva přístupnosti okolního světla.
// Přímé světlo počítá výhradně lightIrradiance ze základu; tady se přidává jen zastínění.

import { lightIrradiance, LIGHT_CELL, entityMatrix, rigMatrices, mat4Mul, mat4Point } from '../../src/xspace/index.js';
import { buildScene, sampleAt } from './scene.mjs';

export const DEFAULTS = {
  cell: LIGHT_CELL,
  occlusion: true, // false = jen součet lightIrradiance (zkouška shody se základem)
  indirect: true, // vrstvy „indirect“ a „ao“
  rays: 32, // paprsků polokoulí na vzorek
  aoRadius: 1.5, // do jaké vzdálenosti překážka ubírá okolní světlo (m)
  clear: 0.3, // posledních 0,3 m před světlem se nestíní (světlo sedí ve svítidle nebo těsně u stropu)
  entityLights: true, // zapéct i bodová světla prefabů na nepohyblivých uzlech
};

/** Světla k zapečení: pole lights (bez dynamic) a bodová světla prefabů, jejichž uzel se nemůže pohnout. */
export function bakedLights(level, prefabs, o = DEFAULTS) {
  const out = (level.lights || []).filter((l) => !l.dynamic).map((l) => ({ id: `light:${l.id}`, kind: 'light', ref: l.id, light: l, color: l.color, base: l.on !== false }));
  if (!o.entityLights) return out;
  for (const e of level.entities || []) {
    const pf = prefabs.get(e.prefab);
    const c = pf && pf.components && pf.components.light;
    if (!c || c.type !== 'point') continue;
    const byId = new Map(pf.rig.nodes.map((n) => [n.id, n]));
    const jointed = new Set((pf.rig.joints || []).map((j) => j.node));
    let moving = false;
    for (let n = byId.get(c.node || pf.rig.nodes[0].id); n; n = n.parent ? byId.get(n.parent) : null) if (jointed.has(n.id)) moving = true;
    if (moving) continue; // světlo na pohyblivém uzlu počítá běh
    const pos = mat4Point(mat4Mul(entityMatrix(e), rigMatrices(pf, {})[c.node || pf.rig.nodes[0].id]), [0, 0, 0]);
    out.push({ id: `entity:${e.id}`, kind: 'entity', ref: e.id, light: { type: 'point', pos, intensity: c.intensity, range: c.range }, color: c.color, base: false, skip: e.id });
  }
  return out;
}

/** Pevná sada směrů polokoule vážená kosinem (spirála), v souřadnicích tečna, bitečna, normála. */
function hemisphere(k) {
  const out = [];
  for (let i = 0; i < k; i++) {
    const r = Math.sqrt((i + 0.5) / k);
    const a = i * 2.399963229728653; // zlatý úhel
    out.push([r * Math.cos(a), r * Math.sin(a), Math.sqrt(Math.max(0, 1 - r * r))]);
  }
  return out;
}

/**
 * Zapečení levelu. prefabs: Map id → prefab, materials: { id: { color } }.
 * Vrací { cell, samples, brushes: [{ id, count }], layers: [{ id, kind, ref, channels, data: Float32Array }], stats }.
 */
export function bakeLevel(level, prefabs, materials, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const t0 = performance.now();
  const S = buildScene(level, prefabs, o.cell);
  const N = S.n;
  const stats = { samples: N, blockers: S.blockers.length, shadowRays: 0, bounceRays: 0, invalid: 0 };
  const org = [0, 0, 0];
  const dir = [0, 0, 0];

  // vzorek, jehož počátek paprsku leží v tělese (vrchol schovaný ve zdi nebo pod skříní), se nepočítá paprskem:
  // dostane průměr platných sousedů na téže ploše, jinak by kolem každé zdi vznikl tmavý pruh široký jednu buňku
  const valid = new Uint8Array(N).fill(1);
  if (o.occlusion) {
    for (let s = 0; s < N; s++) {
      org[0] = S.org[s * 3];
      org[1] = S.org[s * 3 + 1];
      org[2] = S.org[s * 3 + 2];
      dir[0] = S.nrm[s * 3];
      dir[1] = S.nrm[s * 3 + 1];
      dir[2] = S.nrm[s * 3 + 2];
      const h = S.nearest(org, dir, 1e-4, null);
      if (h && h.t === 0) {
        valid[s] = 0;
        stats.invalid++;
      }
    }
  }
  const dilate = (data, ch) => {
    const ok = Uint8Array.from(valid);
    for (let pass = 0; pass < 4; pass++) {
      const add = [];
      for (let s = 0; s < N; s++) {
        if (ok[s]) continue;
        let cnt = 0;
        const sum = [0, 0, 0];
        for (let k = S.nbrStart[s]; k < S.nbrStart[s + 1]; k++) {
          const q = S.nbr[k];
          if (!ok[q]) continue;
          cnt++;
          for (let c = 0; c < ch; c++) sum[c] += data[q * ch + c];
        }
        if (cnt) add.push([s, sum.map((v) => v / cnt)]);
      }
      if (!add.length) break;
      for (const [s, v] of add) {
        ok[s] = 1;
        for (let c = 0; c < ch; c++) data[s * ch + c] = v[c];
      }
    }
  };

  // ---- přímé světlo: jedna vrstva na světlo
  const lights = bakedLights(level, prefabs, o);
  const layers = [];
  const baseRGB = new Float32Array(N * 3); // součet základních světel (pro odraz)
  for (const L of lights) {
    const data = new Float32Array(N);
    const lt = L.light;
    for (let s = 0; s < N; s++) {
      if (!valid[s]) continue;
      const e = lightIrradiance(lt, S.pos[s * 3], S.pos[s * 3 + 1], S.pos[s * 3 + 2], S.nrm[s * 3], S.nrm[s * 3 + 1], S.nrm[s * 3 + 2]);
      if (e <= 0) continue;
      if (o.occlusion) {
        org[0] = S.org[s * 3];
        org[1] = S.org[s * 3 + 1];
        org[2] = S.org[s * 3 + 2];
        let far;
        if (lt.type === 'sun') {
          const d = lt.dir || [0, -1, 0];
          const len = Math.hypot(d[0], d[1], d[2]) || 1;
          dir[0] = -d[0] / len;
          dir[1] = -d[1] / len;
          dir[2] = -d[2] / len;
          far = 1e4;
        } else {
          dir[0] = lt.pos[0] - org[0];
          dir[1] = lt.pos[1] - org[1];
          dir[2] = lt.pos[2] - org[2];
          const len = Math.hypot(dir[0], dir[1], dir[2]);
          dir[0] /= len;
          dir[1] /= len;
          dir[2] /= len;
          far = len - o.clear;
        }
        stats.shadowRays++;
        if (far > 0 && S.any(org, dir, far, L.skip || null)) continue;
      }
      data[s] = e;
    }
    if (o.occlusion) dilate(data, 1);
    if (L.base) for (let s = 0; s < N; s++) for (let c = 0; c < 3; c++) baseRGB[s * 3 + c] += data[s] * L.color[c];
    layers.push({ id: L.id, kind: L.kind, ref: L.ref, channels: 1, data });
  }

  // ---- nepřímé světlo (jeden odraz od kvádrů levelu) a přístupnost okolního světla
  if (o.indirect && o.occlusion) {
    const dirs = hemisphere(o.rays);
    const ind = new Float32Array(N * 3);
    const ao = new Float32Array(N).fill(1);
    const albedo = level.brushes.map((b) => (materials[b.mat] && materials[b.mat].color) || [0.5, 0.5, 0.5]);
    for (let s = 0; s < N; s++) {
      if (!valid[s]) continue;
      const n = [S.nrm[s * 3], S.nrm[s * 3 + 1], S.nrm[s * 3 + 2]];
      // tečná soustava a pootočení sady směrů podle čísla vzorku (ať sousední vzorky nesdílejí stejné paprsky)
      const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const t = [up[1] * n[2] - up[2] * n[1], up[2] * n[0] - up[0] * n[2], up[0] * n[1] - up[1] * n[0]];
      const tl = Math.hypot(...t);
      t[0] /= tl;
      t[1] /= tl;
      t[2] /= tl;
      const b = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
      const rot = ((s * 2654435761) % 4294967296) / 4294967296 * Math.PI * 2;
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      org[0] = S.org[s * 3];
      org[1] = S.org[s * 3 + 1];
      org[2] = S.org[s * 3 + 2];
      let occ = 0;
      const sum = [0, 0, 0];
      for (const d of dirs) {
        const x = d[0] * cr - d[1] * sr;
        const y = d[0] * sr + d[1] * cr;
        dir[0] = t[0] * x + b[0] * y + n[0] * d[2];
        dir[1] = t[1] * x + b[1] * y + n[1] * d[2];
        dir[2] = t[2] * x + b[2] * y + n[2] * d[2];
        stats.bounceRays++;
        const h = S.nearest(org, dir, 60, null);
        if (!h) continue;
        if (h.t < o.aoRadius) occ += 1 - h.t / o.aoRadius;
        if (h.B.brush === undefined) continue; // díly prefabů nemají vzorky: počítají se jen do přístupnosti
        const j = sampleAt(S, h.B.brush, [org[0] + dir[0] * h.t, org[1] + dir[1] * h.t, org[2] + dir[2] * h.t], dir);
        if (j < 0) continue;
        const a = albedo[h.B.brush];
        for (let c = 0; c < 3; c++) sum[c] += a[c] * baseRGB[j * 3 + c];
      }
      for (let c = 0; c < 3; c++) ind[s * 3 + c] = sum[c] / dirs.length;
      ao[s] = 1 - occ / dirs.length;
    }
    dilate(ind, 3);
    dilate(ao, 1);
    layers.push({ id: 'indirect', kind: 'indirect', ref: '', channels: 3, data: ind });
    layers.push({ id: 'ao', kind: 'ao', ref: '', channels: 1, data: ao });
  }

  stats.ms = performance.now() - t0;
  return { cell: o.cell, samples: N, brushes: level.brushes.map((b, i) => ({ id: b.id, count: S.counts[i] })), layers, lights, stats, valid, scene: S };
}
