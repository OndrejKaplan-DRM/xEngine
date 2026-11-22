// xWorld: světlo po vrcholech a po vrstvách (D-022; docs/02_KONTRAKTY.md, oddíl Světlo). Čistá aritmetika
// nad typovanými poli, bez knihoven: běží ve hře i v Node. Vzorec světla je jen v src/xspace/light.js.
//
// Vzorek = vrchol statické dávky. Vrstva světla = řídký seznam (index vzorku, E při plné úrovni) pro každou dávku,
// do které světlo dosáhne. Barva vzorku = okolní člen + Σ úroveň × barva světla × E / π; materiál ji násobí svou
// barvou (jas povrchu = barva materiálu / π × E). Přepnutí lampy je jen přičtení rozdílu přes vzorky její vrstvy.

import { lightIrradiance } from '../xspace/index.js';

/** Příspěvek pod touto mezí (lx) se do vrstvy neukládá: okraj dosahu, kde okno světla klesá k nule. */
export const E_MIN = 1e-4;
export const INV_PI = 1 / Math.PI;
/** O kolik se vzorek odsadí po normále, než se zkoumá zastínění (paprsek nesmí začínat v ploše). */
export const SAMPLE_LIFT = 0.02;

/** Vyplní barvy okolním členem prostředí (lineární RGB). */
export function fillAmbient(colors, ambient) {
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = ambient[0];
    colors[i + 1] = ambient[1];
    colors[i + 2] = ambient[2];
  }
}

/** Koule světla (dosah 0 = bez omezení) zasahuje do obalu min, max. */
export function reaches(light, min, max) {
  if (light.type === 'sun' || !(light.range > 0)) return true;
  const p = light.pos;
  const dx = Math.max(min[0] - p[0], 0, p[0] - max[0]);
  const dy = Math.max(min[1] - p[1], 0, p[1] - max[1]);
  const dz = Math.max(min[2] - p[2], 0, p[2] - max[2]);
  return dx * dx + dy * dy + dz * dz < light.range * light.range;
}

/** Sousedé vrcholů přes hrany trojúhelníků: { start: Uint32Array(count + 1), list: Uint32Array }. */
export function adjacency(indices, count) {
  const sets = Array.from({ length: count }, () => new Set());
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    sets[a].add(b).add(c);
    sets[b].add(a).add(c);
    sets[c].add(a).add(b);
  }
  const start = new Uint32Array(count + 1);
  for (let v = 0; v < count; v++) start[v + 1] = start[v] + sets[v].size;
  const list = new Uint32Array(start[count]);
  for (let v = 0; v < count; v++) {
    let k = start[v];
    for (const n of sets[v]) list[k++] = n;
  }
  return { start, list };
}

const OUT = -3; // světlo na vzorek nedosáhne
const HIDDEN = -2; // zastíněný vzorek, který sám leží ve stavbě: rozhodnou sousedé
const BLOCKED = -1;

/**
 * Vrstva jednoho světla nad statickými cíli.
 * @param light záznam světla podle xSpace ({ type, pos, dir, intensity, range, angle })
 * @param targets [{ positions, normals, colors, count, min, max, buried?, adj? }]; cíl bez colors se přeskočí
 * @param gateOf volitelně (light, x, y, z) → brána vzorku odsazeného po normále: 0 = cesta ke světlu je volná,
 *        −1 = zastíněno pevným světem, k > 0 = cesta vede jen skrz dveře (svítí podle jejich otevření)
 * @returns {{ segs: Array<{ t: number, gate: number, idx: Uint32Array, e: Float32Array }>, samples: number }}
 *
 * Vzorek, který leží ve stavbě (síť pokračuje pod sousední kvádr; cíl ho má v poli buried), světlo sám nevidí.
 * Je ale koncem trojúhelníků, které vidět jsou, proto přebírá viditelnost od souseda přes hranu: jinak by se
 * od něj do místnosti táhl tmavý pruh.
 */
export function buildLayer(light, targets, gateOf = null) {
  const segs = [];
  let samples = 0;
  const byGate = new Map();
  let state = new Int32Array(0);
  let val = new Float32Array(0);
  for (let t = 0; t < targets.length; t++) {
    const T = targets[t];
    if (!T.colors || !reaches(light, T.min, T.max)) continue;
    const P = T.positions;
    const N = T.normals;
    if (state.length < T.count) {
      state = new Int32Array(T.count);
      val = new Float32Array(T.count);
    }
    let hidden = 0;
    let any = false;
    for (let v = 0; v < T.count; v++) {
      const k = v * 3;
      const e = lightIrradiance(light, P[k], P[k + 1], P[k + 2], N[k], N[k + 1], N[k + 2]);
      if (!(e > E_MIN)) {
        state[v] = OUT;
        continue;
      }
      any = true;
      val[v] = e;
      let gate = gateOf ? gateOf(light, P[k] + N[k] * SAMPLE_LIFT, P[k + 1] + N[k + 1] * SAMPLE_LIFT, P[k + 2] + N[k + 2] * SAMPLE_LIFT) : 0;
      if (gate < 0 && T.buried && T.buried[v]) {
        gate = HIDDEN;
        hidden++;
      }
      state[v] = gate;
    }
    if (!any) continue;
    if (hidden) {
      // druhý průchod čte jen výsledky prvního (záporné HIDDEN se přepisuje až nakonec), takže se viditelnost
      // nešíří řetězem přes víc vzorků ve stavbě
      const { start, list } = T.adj;
      for (let v = 0; v < T.count; v++) {
        if (state[v] !== HIDDEN) continue;
        let best = BLOCKED;
        for (let i = start[v]; i < start[v + 1]; i++) {
          const s = state[list[i]];
          if (s >= 0 && s < 1e6 && (best < 0 || s === 0)) best = s;
        }
        if (best >= 0) state[v] = best + 1e6; // značka: přijato od souseda
      }
      for (let v = 0; v < T.count; v++) if (state[v] >= 1e6) state[v] -= 1e6;
    }
    byGate.clear();
    for (let v = 0; v < T.count; v++) {
      const gate = state[v];
      if (gate < 0) continue;
      let g = byGate.get(gate);
      if (!g) byGate.set(gate, (g = { idx: [], e: [] }));
      g.idx.push(v);
      g.e.push(val[v]);
    }
    for (const [gate, g] of byGate) {
      segs.push({ t, gate, idx: Uint32Array.from(g.idx), e: Float32Array.from(g.e) });
      samples += g.idx.length;
    }
  }
  return { segs, samples };
}

/** Přičte ke vzorkům jednoho úseku vrstvy k × E (k = rozdíl úrovně × barva světla / π, po složkách). Bez alokací. */
export function addSeg(colors, seg, kr, kg, kb) {
  const idx = seg.idx;
  const e = seg.e;
  for (let i = 0; i < idx.length; i++) {
    const c = idx[i] * 3;
    const v = e[i];
    colors[c] += kr * v;
    colors[c + 1] += kg * v;
    colors[c + 2] += kb * v;
  }
}
