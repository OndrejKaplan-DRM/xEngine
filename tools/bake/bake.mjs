// xBake: zapečené světlo po vrcholech a po vrstvách (B1.3 a B2.6, D-022, D-035).
// Jedna vrstva na světlo = osvětlení E vzorků při plné úrovni světla (skalár, barvou světla násobí běh).
// Vrstva má část bez brány a úseky s bránou: světlo, které na vzorek svítí otvorem portálu s dveřmi, běh násobí
// otevřením těch dveří. Navíc vrstva nepřímého světla (jeden odraz základních světel levelu při zavřených dveřích,
// RGB) a vrstva přístupnosti okolního světla.
// Přímé světlo počítá výhradně lightIrradiance ze základu; tady se přidává jen zastínění.

import { lightIrradiance, LIGHT_CELL, entityMatrix, rigMatrices, mat4Mul, mat4Point } from '../../src/xspace/index.js';
import { buildScene, sampleAt, samplePatch, NORMAL_OFFSET } from './scene.mjs';
import { buildGates } from './gates.mjs';
import { movingNodes } from './rays.mjs';

export const DEFAULTS = {
  cell: LIGHT_CELL,
  occlusion: true, // false = jen součet lightIrradiance (zkouška shody se základem)
  gates: true, // dveře v portálech nestíní a světlo jejich otvorem jde do úseku s bránou (D-035); false = dveře stíní
  soft: 4, // okraj stínu: soft × soft paprsků z plošky vzorku, jehož soused vidí světlo jinak (0 = jeden paprsek)
  indirect: true, // vrstvy „indirect“ a „ao“
  rays: 64, // paprsků polokoulí na vzorek
  bounceCap: 8, // odraz: jas zdrojové plochy se omezí na tento násobek průměru (potlačí zrnění od ploch těsně u světla)
  smooth: 2, // kolikrát se nepřímá vrstva vyhladí přes sousedy na téže ploše
  indirectWeight: 0.5, // doporučená váha odrazu za běhu; Ondřej 22. 11. 2026: slabší odraz (plný bílé místnosti vybělí)
  aoRadius: 1.5, // do jaké vzdálenosti překážka ubírá okolní světlo (m)
  clear: 0.3, // posledních 0,3 m před světlem se nestíní (světlo sedí ve svítidle nebo těsně u stropu)
  entityLights: true, // zapéct i bodová světla prefabů na nepohyblivých uzlech
  entitySamples: true, // vzorky i na pevných dílech prefabů (D-041); false = jen kvádry (stav před D-041, ke srovnání)
};

const OUT = -3; // světlo na vzorek nedosáhne, nebo vzorek leží v tělese
const BLOCKED = -1; // zastíněno
const MIXED = -4; // okraj stínu: vzorek svítí zčásti, podíly jsou v seznamu mix

/** Světla k zapečení: pole lights (bez dynamic) a bodová světla prefabů, jejichž uzel se nemůže pohnout. */
export function bakedLights(level, prefabs, o = DEFAULTS) {
  const out = (level.lights || []).filter((l) => !l.dynamic).map((l) => ({ id: `light:${l.id}`, kind: 'light', ref: l.id, light: l, color: l.color, base: l.on !== false }));
  if (!o.entityLights) return out;
  for (const e of level.entities || []) {
    const pf = prefabs.get(e.prefab);
    const c = pf && pf.components && pf.components.light;
    if (!c || c.type !== 'point') continue;
    const node = c.node || pf.rig.nodes[0].id;
    if (movingNodes(pf).has(node)) continue; // světlo na pohyblivém uzlu počítá běh
    const pos = mat4Point(mat4Mul(entityMatrix(e), rigMatrices(pf, {})[node]), [0, 0, 0]);
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
 * Vrací { cell, samples, brushes: [{ id, count }], entities: [{ id, count }], layers, lights, stats, valid, indirectWeight, scene, doors }.
 * Vzorky v pořadí levelSamples (D-041): kvádry, potom pevné díly prefabů po entitách.
 * Vrstva: { id, kind, ref, channels, data: Float32Array[samples × channels], gates: [{ gate: [id dveří…], idx, e }] }.
 * data je část bez brány; gates jsou úseky za dveřmi (řídké: indexy vzorků vzestupně a E při plné úrovni).
 */
export function bakeLevel(level, prefabs, materials, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const t0 = performance.now();
  const G = buildGates(level, prefabs, o.gates && o.occlusion);
  const S = buildScene(level, prefabs, o.cell, G.wings, materials, o.entitySamples);
  const N = S.n;
  // vzorek na dílu prefabu: vlastní kolize entity ho nestíní (díly téže entity si nestíní, kolize je jen obal)
  const entIds = (level.entities || []).map((e) => e.id);
  const own = (s) => (S.entOf[s] >= 0 ? entIds[S.entOf[s]] : null);
  const stats = { samples: N, blockers: S.blockers.length, skippedColliders: S.skippedColliders, doors: G.doors.length, shadowRays: 0, softened: 0, gated: 0, bounceRays: 0, invalid: 0 };
  const org = [0, 0, 0];
  const dir = [0, 0, 0];

  // Vzorek, jehož počátek paprsku leží v tělese (vrchol schovaný ve zdi nebo pod skříní), se nepočítá paprskem:
  // dostane průměr platných sousedů na téže ploše, jinak by kolem každé zdi vznikl tmavý pruh široký jednu buňku.
  // Pro přímé světlo se křídla dveří za těleso nepočítají (validD), pro odraz a přístupnost ano (validF).
  const flags = (wings) => {
    const v = new Uint8Array(N).fill(1);
    if (!o.occlusion) return v;
    for (let s = 0; s < N; s++) {
      org[0] = S.org[s * 3];
      org[1] = S.org[s * 3 + 1];
      org[2] = S.org[s * 3 + 2];
      dir[0] = S.nrm[s * 3];
      dir[1] = S.nrm[s * 3 + 1];
      dir[2] = S.nrm[s * 3 + 2];
      const h = S.nearest(org, dir, 1e-4, null, wings, own(s));
      if (h && h.t === 0) v[s] = 0;
    }
    return v;
  };
  const validD = flags(false);
  const validF = G.wings.size ? flags(true) : validD;
  for (let s = 0; s < N; s++) if (!validD[s]) stats.invalid++;

  const dilate = (data, ch, valid) => {
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
  const baseRGB = new Float32Array(N * 3); // součet základních světel při zavřených dveřích (pro odraz)
  const state = new Int32Array(N);
  const E = new Float32Array(N);
  const p = [0, 0, 0];
  const patch = {};

  /** Cesta z bodu ke světlu: BLOCKED, nebo brána (0 = volno bez dveří v cestě). */
  const trace = (L, x, y, z, self = null) => {
    const lt = L.light;
    p[0] = x;
    p[1] = y;
    p[2] = z;
    let far;
    let tx;
    let ty;
    let tz;
    if (lt.type === 'sun') {
      const d = lt.dir || [0, -1, 0];
      const len = Math.hypot(d[0], d[1], d[2]) || 1;
      dir[0] = -d[0] / len;
      dir[1] = -d[1] / len;
      dir[2] = -d[2] / len;
      far = 1e4;
      tx = x + dir[0] * G.SUN_REACH;
      ty = y + dir[1] * G.SUN_REACH;
      tz = z + dir[2] * G.SUN_REACH;
    } else {
      [tx, ty, tz] = lt.pos;
      dir[0] = tx - x;
      dir[1] = ty - y;
      dir[2] = tz - z;
      const len = Math.hypot(dir[0], dir[1], dir[2]);
      dir[0] /= len;
      dir[1] /= len;
      dir[2] /= len;
      far = len - o.clear;
    }
    stats.shadowRays++;
    if (far > 0 && S.any(p, dir, far, L.skip || null, false, self)) return BLOCKED;
    return G.crossing(x, y, z, tx, ty, tz);
  };

  /**
   * Okraj stínu po podílech. Vzorek, jehož soused na téže ploše vidí světlo jinak (svítí × stín × jiná brána),
   * se neptá jedním paprskem, ale soft × soft paprsky z bodů rozložených po své plošce. Svítí pak podílem plošky,
   * který světlo vidí, takže zub stínu po buňkách mřížky přejde v plynulý okraj. Mřížka vzorků se nemění.
   * Dílčí bod, ke kterému od vzorku nevede volná úsečka (leží ve zdi nebo za ní), se nepočítá.
   */
  const soften = (L, mix) => {
    const edges = [];
    for (let s = 0; s < N; s++) {
      const st = state[s];
      if (st < BLOCKED) continue;
      for (let k = S.nbrStart[s]; k < S.nbrStart[s + 1]; k++) {
        const u = state[S.nbr[k]];
        if (u >= BLOCKED && u !== st) {
          edges.push(s);
          break;
        }
      }
    }
    const n = o.soft;
    const from = [0, 0, 0];
    const to = [0, 0, 0];
    const tally = new Map();
    for (const s of edges) {
      const P = samplePatch(S, s, patch);
      if (!P) continue;
      from[0] = S.org[s * 3];
      from[1] = S.org[s * 3 + 1];
      from[2] = S.org[s * 3 + 2];
      const self = own(s);
      tally.clear();
      let counted = 0;
      for (let i = 0; i < n; i++) {
        const a = P.u0 + ((i + 0.5) / n) * (P.u1 - P.u0);
        for (let j = 0; j < n; j++) {
          const b = P.v0 + ((j + 0.5) / n) * (P.v1 - P.v0);
          let len = 0;
          for (let c = 0; c < 3; c++) {
            to[c] = S.pos[s * 3 + c] + S.nrm[s * 3 + c] * NORMAL_OFFSET + P.eu[c] * a + P.ev[c] * b;
            len += (to[c] - from[c]) ** 2;
          }
          len = Math.sqrt(len);
          if (len > 1e-6) {
            for (let c = 0; c < 3; c++) dir[c] = (to[c] - from[c]) / len;
            if (S.any(from, dir, len, null, false, self)) continue;
          }
          const g = trace(L, to[0], to[1], to[2], self);
          counted++;
          tally.set(g, (tally.get(g) || 0) + 1);
        }
      }
      if (!counted || (tally.size === 1 && tally.has(state[s]))) continue;
      state[s] = MIXED;
      stats.softened++;
      for (const [g, c] of tally) if (g >= 0) mix.push(s, g, c / counted);
    }
  };

  for (const L of lights) {
    const lt = L.light;
    const dense = new Map(); // brána → Float32Array(N)
    const plane = (g) => {
      let d = dense.get(g);
      if (!d) dense.set(g, (d = new Float32Array(N)));
      return d;
    };
    plane(0);
    const mix = [];
    for (let s = 0; s < N; s++) {
      state[s] = OUT;
      if (!validD[s]) continue;
      const e = lightIrradiance(lt, S.pos[s * 3], S.pos[s * 3 + 1], S.pos[s * 3 + 2], S.nrm[s * 3], S.nrm[s * 3 + 1], S.nrm[s * 3 + 2]);
      if (e <= 0) continue;
      E[s] = e;
      state[s] = o.occlusion ? trace(L, S.org[s * 3], S.org[s * 3 + 1], S.org[s * 3 + 2], own(s)) : 0;
    }
    if (o.occlusion && o.soft > 1) soften(L, mix);
    for (let s = 0; s < N; s++) if (state[s] >= 0) plane(state[s])[s] = E[s];
    for (let k = 0; k < mix.length; k += 3) plane(mix[k + 1])[mix[k]] += E[mix[k]] * mix[k + 2];
    if (o.occlusion) for (const d of dense.values()) dilate(d, 1, validD);
    const data = dense.get(0);
    if (L.base) for (let s = 0; s < N; s++) for (let c = 0; c < 3; c++) baseRGB[s * 3 + c] += data[s] * L.color[c];
    const gates = [];
    for (const [g, d] of [...dense].filter(([g]) => g > 0).sort((a, b) => a[0] - b[0])) {
      const idx = [];
      for (let s = 0; s < N; s++) if (d[s] !== 0) idx.push(s);
      if (!idx.length) continue;
      stats.gated += idx.length;
      gates.push({ gate: G.ids(g), idx: Uint32Array.from(idx), e: Float32Array.from(idx, (s) => d[s]) });
    }
    layers.push({ id: L.id, kind: L.kind, ref: L.ref, channels: 1, data, gates });
  }

  // ---- nepřímé světlo (jeden odraz od kvádrů levelu) a přístupnost okolního světla; dveře zavřené
  if (o.indirect && o.occlusion) {
    const dirs = hemisphere(o.rays);
    const ind = new Float32Array(N * 3);
    const ao = new Float32Array(N).fill(1);
    const albedo = level.brushes.map((b) => (materials[b.mat] && materials[b.mat].color) || [0.5, 0.5, 0.5]);
    // Plocha půl metru od světla má osvětlení o dva řády vyšší než zbytek místnosti a paprsky ji trefí jen občas:
    // bez omezení z toho vznikají světlé skvrny. Zdroj odrazu se proto omezí na násobek průměrného osvětlení.
    // průměr jen přes vzorky kvádrů: zdrojem odrazu jsou jen kvádry (vzorky dílů prefabů ho nemění, D-041)
    const NB = S.entityOffsets.length ? S.entityOffsets[0] : N;
    let lit = 0;
    let litSum = 0;
    for (let s = 0; s < NB; s++) {
      const l = (baseRGB[s * 3] + baseRGB[s * 3 + 1] + baseRGB[s * 3 + 2]) / 3;
      if (l > 0) {
        lit++;
        litSum += l;
      }
    }
    const cap = lit ? (litSum / lit) * o.bounceCap : Infinity;
    const src = new Float32Array(N * 3);
    for (let s = 0; s < N; s++) {
      const l = (baseRGB[s * 3] + baseRGB[s * 3 + 1] + baseRGB[s * 3 + 2]) / 3;
      const k = l > cap ? cap / l : 1;
      for (let c = 0; c < 3; c++) src[s * 3 + c] = baseRGB[s * 3 + c] * k;
    }
    for (let s = 0; s < N; s++) {
      if (!validF[s]) continue;
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
      const self = own(s);
      let occ = 0;
      const sum = [0, 0, 0];
      for (const d of dirs) {
        const x = d[0] * cr - d[1] * sr;
        const y = d[0] * sr + d[1] * cr;
        dir[0] = t[0] * x + b[0] * y + n[0] * d[2];
        dir[1] = t[1] * x + b[1] * y + n[1] * d[2];
        dir[2] = t[2] * x + b[2] * y + n[2] * d[2];
        stats.bounceRays++;
        const h = S.nearest(org, dir, 60, null, true, self);
        if (!h) continue;
        if (h.t < o.aoRadius) occ += 1 - h.t / o.aoRadius;
        if (h.B.brush === undefined) continue; // kolize prefabů nemají vzorky: počítají se jen do přístupnosti
        const j = sampleAt(S, h.B.brush, [org[0] + dir[0] * h.t, org[1] + dir[1] * h.t, org[2] + dir[2] * h.t], dir);
        if (j < 0) continue;
        const a = albedo[h.B.brush];
        for (let c = 0; c < 3; c++) sum[c] += a[c] * src[j * 3 + c];
      }
      for (let c = 0; c < 3; c++) ind[s * 3 + c] = sum[c] / dirs.length;
      ao[s] = 1 - occ / dirs.length;
    }
    // nepřímé světlo se v prostoru mění pomalu: vyhlazení přes sousedy téže plochy ubere zrnění a přes hranu nepřeteče
    const smooth = (data, ch, passes) => {
      for (let pass = 0; pass < passes; pass++) {
        const next = Float32Array.from(data);
        for (let s = 0; s < N; s++) {
          if (!validF[s]) continue;
          let cnt = 0;
          const sum = [0, 0, 0];
          for (let k = S.nbrStart[s]; k < S.nbrStart[s + 1]; k++) {
            const q = S.nbr[k];
            if (!validF[q]) continue;
            cnt++;
            for (let c = 0; c < ch; c++) sum[c] += data[q * ch + c];
          }
          if (cnt) for (let c = 0; c < ch; c++) next[s * ch + c] = (data[s * ch + c] + sum[c] / cnt) / 2;
        }
        data.set(next);
      }
    };
    smooth(ind, 3, o.smooth);
    smooth(ao, 1, 1);
    dilate(ind, 3, validF);
    dilate(ao, 1, validF);
    layers.push({ id: 'indirect', kind: 'indirect', ref: '', channels: 3, data: ind, gates: [] });
    layers.push({ id: 'ao', kind: 'ao', ref: '', channels: 1, data: ao, gates: [] });
  }

  stats.gates = G.count() - 1;
  stats.ms = performance.now() - t0;
  return { cell: o.cell, samples: N, brushes: level.brushes.map((b, i) => ({ id: b.id, count: S.counts[i] })), entities: S.entityCounts.map(([id, count]) => ({ id, count })), layers, lights, stats, valid: validD, indirectWeight: o.indirectWeight, scene: S, doors: G.doors.map((d) => ({ id: d.id, portal: d.portal })), wings: [...G.wings], clear: o.clear };
}
