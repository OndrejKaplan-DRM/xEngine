// xWorld: zapečené světlo v běhu (D-041, D-044). Soubor `levels/<id>.light.bin` čte `decodeBake` ze základu;
// tady se jeho vzorky (pořadí `levelSamples`: kvádry, potom pevné díly prefabů) přiřadí vrcholům statických dávek
// a vrstvy se převedou na úseky, se kterými pracuje lighting.js (přepínání světel a bran beze změny).
//
// Barva vrcholu podle kontraktu (jas = barva materiálu / π × E):
//   okolní člen × přístupnost (vrstva ao) + Σ úroveň × barva × E / π + nepřímé E × váha / π.
// Pozn.: `composeColors` v základu sčítá E bez dělení π; tady se dělí (otázka pro svodnou v A_STAV, oddíl 9).

import { staticPartIndices, partMesh } from '../xspace/index.js';
import { INV_PI } from './lightfield.js';

/**
 * Indexy vzorků pevných dílů entit (D-041): entity v pořadí levelu, díly v pořadí `parts`, vrcholy podle `partMesh`.
 * @returns {{ bases: Map<number, Map<number, number>>, counts: [string, number][], total: number }}
 *          bases: index entity → (index dílu → index vzorku jeho prvního vrcholu); total = vzorky kvádrů + dílů
 */
export function sampleBases(level, prefabs, brushSamples) {
  const bases = new Map();
  const counts = [];
  let cursor = brushSamples;
  (level.entities || []).forEach((e, i) => {
    const prefab = prefabs.get(e.prefab);
    const idx = prefab ? staticPartIndices(prefab) : [];
    let n = 0;
    if (idx.length) {
      const m = new Map();
      for (const pi of idx) {
        m.set(pi, cursor + n);
        n += partMesh(prefab.parts[pi]).positions.length / 3;
      }
      bases.set(i, m);
    }
    counts.push([e.id, n]);
    cursor += n;
  });
  return { bases, counts, total: cursor };
}

const sameCounts = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x[0] === b[i][0] && x[1] === b[i][1]);

/**
 * Sedí soubor na level, jak ho běh postavil? Vrací { brushOnly } nebo { reason }.
 * Soubor bez pole `entities` (zapečený před D-041) nese jen vzorky kvádrů; díly prefabů pak svítí běh.
 */
export function checkBake(header, brushCounts, entityCounts, total) {
  const brushSamples = brushCounts.reduce((s, x) => s + x[1], 0);
  const hb = (header.brushes || []).map((x) => (Array.isArray(x) ? x : [x.id, x.count]));
  if (!sameCounts(hb, brushCounts)) return { reason: 'počty vzorků kvádrů nesedí (jiná mřížka světla, nebo jiný level)' };
  if (!header.entities) return header.samples === brushSamples ? { brushOnly: true } : { reason: `soubor má ${header.samples} vzorků, kvádry ${brushSamples}` };
  const he = header.entities.map((x) => (Array.isArray(x) ? x : [x.id, x.count]));
  if (!sameCounts(he, entityCounts) || header.samples !== total) return { reason: 'počty vzorků dílů prefabů nesedí (D-041)' };
  return { brushOnly: false };
}

/**
 * Přiřazení vzorků vrcholům dávek (jeden vzorek může mít víc vrcholů: plocha viditelná ze dvou buněk) a značky
 * zapečených vrcholů v dávkách (T.baked, T.bakedAll). Vrací CSR { start, t, v }.
 */
export function mapSamples(targets, samples) {
  const cnt = new Uint32Array(samples + 1);
  for (const T of targets) {
    T.baked = null;
    T.bakedAll = false;
    const m = T.sampleMap;
    if (!m || !T.colors) continue;
    for (let i = 0; i < m.length; i += 2) if (m[i] < samples) cnt[m[i] + 1]++;
  }
  for (let s = 0; s < samples; s++) cnt[s + 1] += cnt[s];
  const t = new Uint32Array(cnt[samples]);
  const v = new Uint32Array(cnt[samples]);
  const fill = cnt.slice(0, samples);
  targets.forEach((T, ti) => {
    const m = T.sampleMap;
    if (!m || !T.colors) return;
    T.baked = new Uint8Array(T.count);
    let n = 0;
    for (let i = 0; i < m.length; i += 2) {
      const s = m[i];
      if (s >= samples) continue;
      const k = fill[s]++;
      t[k] = ti;
      v[k] = m[i + 1];
      if (!T.baked[m[i + 1]]) n++;
      T.baked[m[i + 1]] = 1;
    }
    T.bakedAll = n === T.count;
  });
  return { start: cnt, t, v };
}

/** Základ barvy zapečených vrcholů: okolní člen × přístupnost + nepřímé světlo × váha / π. */
export function bakedBase(decoded, map, targets, ambient) {
  const n = decoded.header.samples;
  const ao = decoded.layers.find((L) => L.kind === 'ao');
  const ind = decoded.layers.find((L) => L.kind === 'indirect');
  const w = (decoded.header.indirectWeight ?? ind?.weight ?? 1) * INV_PI;
  for (let s = 0; s < n; s++) {
    const a = ao ? ao.data[s] : 1;
    const r = ambient[0] * a + (ind ? ind.data[s * 3] * w : 0);
    const g = ambient[1] * a + (ind ? ind.data[s * 3 + 1] * w : 0);
    const b = ambient[2] * a + (ind ? ind.data[s * 3 + 2] * w : 0);
    for (let k = map.start[s]; k < map.start[s + 1]; k++) {
      const col = targets[map.t[k]].colors;
      const c = map.v[k] * 3;
      col[c] = r;
      col[c + 1] = g;
      col[c + 2] = b;
    }
  }
}

/** Id vrstvy souboru pro světlo běhu: světla levelu „light:<id>“, světla prefabů „entity:<id entity>“ (xBake). */
export const bakeId = (L) => (L.fixed ? `light:${L.id}` : `entity:${L.id}`);

/**
 * Úseky vrstvy (stejný tvar jako buildLayer: { t, gate, idx, e }) ze zapečené vrstvy. gateFor(seznam id dveří) →
 * index brány běhu (0 = bez brány, −1 = dveře v levelu nejsou: úsek se vynechá).
 */
export function bakedSegs(layer, map, gateFor) {
  const groups = new Map(); // klíč „t|brána“ → { t, gate, idx: [], e: [] }
  let samples = 0;
  const put = (gate, s, e) => {
    for (let k = map.start[s]; k < map.start[s + 1]; k++) {
      const t = map.t[k];
      const key = t * 65536 + gate;
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { t, gate, idx: [], e: [] }));
      g.idx.push(map.v[k]);
      g.e.push(e);
      samples++;
    }
  };
  const d = layer.data;
  for (let s = 0; s < d.length; s++) if (d[s] > 0) put(0, s, d[s]);
  for (const sec of layer.gates || []) {
    const gate = gateFor(sec.gate);
    if (gate < 0) continue;
    for (let i = 0; i < sec.idx.length; i++) if (sec.e[i] > 0) put(gate, sec.idx[i], sec.e[i]);
  }
  const segs = [...groups.values()].map((g) => ({ t: g.t, gate: g.gate, idx: Uint32Array.from(g.idx), e: Float32Array.from(g.e) }));
  return { segs, samples };
}

/**
 * Zapečený soubor levelu z balíku: `levels/<id>.light.bin` (kontrakt) v pack.files hlavního balíku (N-111).
 * Vrací [bake | null, poznámka]; bake = { decoded, gateFor, brushOnly } pro lighting.setBake.
 */
export function readBake({ assets, pack, level, world, entities, occlusion, decodeBake }) {
  const path = `levels/${level.id}.light.bin`;
  const bytes = assets?.bytes(path, pack.manifest?.id);
  if (!bytes) return [null, `soubor ${path} ve hře není: světlo se počítá při načtení`];
  let decoded;
  try {
    decoded = decodeBake(bytes);
  } catch (e) {
    return [null, `${path}: ${e.message}`];
  }
  const ok = checkBake(decoded.header, world.stat.brushCounts, entities.samples.counts, entities.samples.total);
  if (ok.reason) return [null, `${path} nesedí na level: ${ok.reason}`];
  return [{ decoded, gateFor: occlusion.gateFor, brushOnly: ok.brushOnly }, ok.brushOnly ? `${path}: jen kvádry (soubor před D-041)` : `${path}`];
}
