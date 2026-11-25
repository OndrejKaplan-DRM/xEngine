// Zakrytí otvoru zavřenými dveřmi: zkouška paprsky proti kvádrům dílů prefabu v klidové poloze.
// Počítá se jen z dat prefabu, nezávisle na generátoru. Engine bere zavřené dveře portálu jako neprůhledné
// a místnost za nimi nekreslí (návrh N-107 sešny A); škvírou by proto bylo vidět pozadí scény.
//
// Je to vzorkování, ne důkaz: kolmé paprsky na síti ze všech hran dílů (hrana ± 1 mm a středy mezi hranami)
// a šikmé vějíře vodorovně a svisle týmiž body. Válce se nepočítají (zkouška je tím přísnější).

import { rigMatrices, mat4Point } from '../../src/xspace/index.js';

const DEG = Math.PI / 180;
const FAN_H = [2, -2, 5, -5, 9, -9, 15, -15, 30, -30, 50, -50];
const FAN_V = [2, -2, 5, -5, 9, -9, 15, -15, 30, -30];
const REACH = 0.3; // paprsek jde od 0,3 m před rovinou dveří do 0,3 m za ní (zárubeň má hloubku 0,22 m)

/** Kvádry dílů v prostoru prefabu v klidové poloze (uzly dveří jsou v klidu jen posunuté, obal je tedy přesný). */
export function restBoxes(prefab) {
  const mats = rigMatrices(prefab, {});
  const out = [];
  for (const p of prefab.parts) {
    if (p.shape !== 'box') continue;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const x of [p.min[0], p.max[0]]) {
      for (const y of [p.min[1], p.max[1]]) {
        for (const z of [p.min[2], p.max[2]]) {
          const w = mat4Point(mats[p.node], [x, y, z]);
          for (let k = 0; k < 3; k++) {
            if (w[k] < min[k]) min[k] = w[k];
            if (w[k] > max[k]) max[k] = w[k];
          }
        }
      }
    }
    out.push({ min, max });
  }
  return out;
}

/** Protne úsečka o + t·d, t ∈ ⟨−REACH, REACH⟩ (d má složku z rovnou 1) kvádr? */
function segHits(o, d, b) {
  let t0 = -REACH;
  let t1 = REACH;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-12) {
      if (o[k] < b.min[k] || o[k] > b.max[k]) return false;
      continue;
    }
    const a = (b.min[k] - o[k]) / d[k];
    const c = (b.max[k] - o[k]) / d[k];
    t0 = Math.max(t0, Math.min(a, c));
    t1 = Math.min(t1, Math.max(a, c));
    if (t0 > t1) return false;
  }
  return true;
}

/** Souřadnice vzorků na jedné ose: každá hrana dílu ± 1 mm a středy mezi sousedními hranami, jen uvnitř otvoru. */
function samples(boxes, k, lo, hi) {
  const edges = [...new Set([lo, hi, ...boxes.flatMap((b) => [b.min[k], b.max[k]])].map((v) => Math.round(v * 1e5) / 1e5))].filter((v) => v >= lo && v <= hi).sort((p, q) => p - q);
  const out = new Set();
  edges.forEach((e, i) => {
    out.add(e - 0.001);
    out.add(e + 0.001);
    if (i > 0) out.add((e + edges[i - 1]) / 2);
  });
  return [...out].filter((v) => v > lo + 1e-4 && v < hi - 1e-4).sort((p, q) => p - q);
}

/**
 * Paprsky, které projdou otvorem š × v (počátek = střed prahu, rovina dveří z = 0) a nic netrefí.
 * prefabs: jeden prefab, nebo víc prefabů se společným počátkem (křídla dvoukřídlých dveří).
 */
export function doorLeaks(prefabs, w, h) {
  const boxes = prefabs.flatMap(restBoxes);
  const xs = samples(boxes, 0, -w / 2, w / 2);
  const ys = samples(boxes, 1, 0, h);
  const leaks = [];
  let rays = 0;
  const shoot = (x, y, ah, av) => {
    rays++;
    const o = [x, y, 0];
    const d = [Math.tan(ah * DEG), Math.tan(av * DEG), 1];
    for (const b of boxes) if (segHits(o, d, b)) return;
    leaks.push({ x, y, ah, av });
  };
  for (const x of xs) {
    for (const y of ys) {
      shoot(x, y, 0, 0);
      for (const a of FAN_H) shoot(x, y, a, 0);
      for (const a of FAN_V) shoot(x, y, 0, a);
    }
  }
  return { rays, leaks, text: leaks.slice(0, 3).map((l) => `x ${l.x.toFixed(3)} y ${l.y.toFixed(3)} úhel ${l.ah}°/${l.av}°`).join('; ') };
}
