// xWorld: zkouška textury světla (N-110, D-043). Ne formát a ne výchozí cesta: na plochách vybraných buněk (výchozí
// hala xLabu) se světlo spočítá při načtení do textury s bodem 5 nebo 10 cm místo po vrcholech (mřížka 0,5 m).
// Účel: ukázat Ondřejovi stín po 5 cm a změřit na T460 paměť, čas výpočtu a cenu vykreslení (`?bench`).
//
// Postup: statické dávky buněk se rozloží na trojúhelníky; spojené trojúhelníky jedné roviny jsou mapa (chart),
// trojúhelník mimo rovinu dostane mapu sám (válce prefabů). Mapy se poskládají do jednoho atlasu po řádcích.
// Bod textury = střed texelu na ploše; světlo stejně jako po vrcholech: lightIrradiance ze základu, zastínění
// a brány dveří z occlusion.gateOf. Hodnota bodu je osvětlení E × barva (a π × okolní člen); materiál three.js
// ho dělí π (lightMap v MeshBasicMaterial), takže jas = barva materiálu / π × E jako v kontraktu.
// Vrstvy se drží po světlech a branách, takže přepnutí lampy nebo otevření dveří texturu jen složí znovu.

import { lightIrradiance } from '../xspace/index.js';
import { E_MIN, SAMPLE_LIFT } from './lightfield.js';

const PAD = 2; // texely kolem mapy: bilineární filtr nesmí sáhnout do sousední mapy
const MAX_SIZE = 4096;
const INSET = 1e-4; // tolerance testu „střed texelu leží v trojúhelníku“ (v texelech)

/** float → half float (IEEE 754 binary16) bez knihoven. */
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);
function toHalf(v) {
  f32[0] = v;
  const x = u32[0];
  const sign = (x >>> 16) & 0x8000;
  let e = ((x >>> 23) & 0xff) - 127 + 15;
  const m = x & 0x7fffff;
  if (e >= 31) return sign | 0x7bff; // strop 65 504
  if (e <= 0) return sign;
  return sign | (e << 10) | (m >>> 13);
}

/** Báze roviny: u, v jednotkové v rovině (u vodorovně, kde to jde), n normála. */
function basis(n) {
  const a = Math.abs(n[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  let u = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
  const l = Math.hypot(...u);
  u = u.map((x) => x / l);
  const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  return { u, v };
}

/**
 * Mapy jedné dávky: trojúhelníky spojené sdíleným vrcholem a se stejnou normálou. Vrací [{ tris: [index trojúhelníku],
 * n, u, v, d, smin, smax, tmin, tmax }] v metrech.
 */
function chartsOf(T) {
  const I = T.indices;
  const P = T.positions;
  const N = T.normals;
  const nt = I.length / 3;
  const parent = new Int32Array(nt).map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  const owner = new Int32Array(T.count).fill(-1);
  const planar = (a, b) => Math.abs(N[a * 3] - N[b * 3]) + Math.abs(N[a * 3 + 1] - N[b * 3 + 1]) + Math.abs(N[a * 3 + 2] - N[b * 3 + 2]) < 1e-3;
  for (let t = 0; t < nt; t++) {
    for (let k = 0; k < 3; k++) {
      const v = I[t * 3 + k];
      if (owner[v] < 0) owner[v] = t;
      else if (planar(v, I[owner[v] * 3])) parent[find(t)] = find(owner[v]);
    }
  }
  // trojúhelník, jehož vrcholy nemají stejnou normálu (plášť válce), je mapa sám
  const groups = new Map();
  for (let t = 0; t < nt; t++) {
    const a = I[t * 3];
    const flat = planar(a, I[t * 3 + 1]) && planar(a, I[t * 3 + 2]);
    const key = flat ? find(t) : -1 - t;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const out = [];
  for (const tris of groups.values()) {
    const a = I[tris[0] * 3];
    let n;
    if (tris.length === 1 && !(planar(a, I[tris[0] * 3 + 1]) && planar(a, I[tris[0] * 3 + 2]))) {
      const [p, q, r] = [0, 1, 2].map((k) => I[tris[0] * 3 + k]);
      const e1 = [P[q * 3] - P[p * 3], P[q * 3 + 1] - P[p * 3 + 1], P[q * 3 + 2] - P[p * 3 + 2]];
      const e2 = [P[r * 3] - P[p * 3], P[r * 3 + 1] - P[p * 3 + 1], P[r * 3 + 2] - P[p * 3 + 2]];
      n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      const l = Math.hypot(...n) || 1;
      n = n.map((x) => x / l);
    } else n = [N[a * 3], N[a * 3 + 1], N[a * 3 + 2]];
    const { u, v } = basis(n);
    const c = { tris, n, u, v, d: n[0] * P[a * 3] + n[1] * P[a * 3 + 1] + n[2] * P[a * 3 + 2], smin: Infinity, smax: -Infinity, tmin: Infinity, tmax: -Infinity };
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const p = I[t * 3 + k] * 3;
        const s = P[p] * u[0] + P[p + 1] * u[1] + P[p + 2] * u[2];
        const w = P[p] * v[0] + P[p + 1] * v[1] + P[p + 2] * v[2];
        c.smin = Math.min(c.smin, s);
        c.smax = Math.max(c.smax, s);
        c.tmin = Math.min(c.tmin, w);
        c.tmax = Math.max(c.tmax, w);
      }
    }
    out.push(c);
  }
  return out;
}

/** Atlas po řádcích (shelf): mapy podle výšky, šířka atlasu mocnina dvou. Doplní c.x, c.y, c.w, c.h; vrací [W, H]. */
function pack(charts, texel) {
  let area = 0;
  for (const c of charts) {
    c.w = Math.max(1, Math.ceil((c.smax - c.smin) / texel - 1e-6) + 1) + 2 * PAD;
    c.h = Math.max(1, Math.ceil((c.tmax - c.tmin) / texel - 1e-6) + 1) + 2 * PAD;
    area += c.w * c.h;
  }
  let W = 64;
  while (W * W < area * 1.15 && W < MAX_SIZE) W *= 2;
  const order = [...charts].sort((a, b) => b.h - a.h);
  let x = 0;
  let y = 0;
  let row = 0;
  for (const c of order) {
    if (c.w > W) throw new Error(`textura světla: mapa ${c.w} texelů je širší než atlas ${W}`);
    if (x + c.w > W) {
      x = 0;
      y += row;
      row = 0;
    }
    c.x = x;
    c.y = y;
    x += c.w;
    row = Math.max(row, c.h);
  }
  let H = 64;
  while (H < y + row) H *= 2;
  if (H > MAX_SIZE) throw new Error(`textura světla: atlas ${W} × ${H} je nad strop ${MAX_SIZE}`);
  return [W, H];
}

/**
 * Postaví texturu světla pro statické dávky vybraných buněk.
 * @param o.targets render.statics; o.cells množina id buněk; o.texel krok v metrech (0,05 nebo 0,1)
 * @param o.lights světla běhu (light.lights); o.gateOf occlusion.gateOf nebo null; o.gate(g) úroveň brány
 * @param o.ambient okolní člen levelu
 * @returns { W, H, texels, data (Uint16Array RGBA half), meshes: [{ target, positions, normals, uvs, uv1 }], update() }
 */
export function buildLightmap({ targets, cells, texel, lights, gateOf, gate, ambient, now = () => performance.now() }) {
  const t0 = now();
  const parts = []; // { T, charts }
  for (const T of targets) if (T.colors && cells.has(T.cell)) parts.push({ T, charts: chartsOf(T) });
  const all = parts.flatMap((p) => p.charts);
  const [W, H] = pack(all, texel);
  const inside = new Uint8Array(W * H);
  const pos = new Float32Array(W * H * 3); // bod plochy pro každý texel uvnitř mapy
  const nrm = new Float32Array(W * H * 3);
  const meshes = [];
  for (const { T, charts } of parts) {
    const I = T.indices;
    const P = T.positions;
    const ntri = I.length / 3;
    const m = { target: T, positions: new Float32Array(ntri * 9), normals: new Float32Array(ntri * 9), uvs: new Float32Array(ntri * 6), uv1: new Float32Array(ntri * 6) };
    for (const c of charts) {
      const tx = (p) => c.x + PAD + (P[p] * c.u[0] + P[p + 1] * c.u[1] + P[p + 2] * c.u[2] - c.smin) / texel + 0.5;
      const ty = (p) => c.y + PAD + (P[p] * c.v[0] + P[p + 1] * c.v[1] + P[p + 2] * c.v[2] - c.tmin) / texel + 0.5;
      for (const t of c.tris) {
        const q = [0, 1, 2].map((k) => {
          const v = I[t * 3 + k];
          m.positions.set([P[v * 3], P[v * 3 + 1], P[v * 3 + 2]], t * 9 + k * 3);
          m.normals.set([T.normals[v * 3], T.normals[v * 3 + 1], T.normals[v * 3 + 2]], t * 9 + k * 3);
          m.uvs.set([T.uvs[v * 2], T.uvs[v * 2 + 1]], t * 6 + k * 2);
          const xy = [tx(v * 3), ty(v * 3)];
          m.uv1.set([xy[0] / W, xy[1] / H], t * 6 + k * 2);
          return xy;
        });
        // středy texelů uvnitř trojúhelníku (v souřadnicích texelů je střed v i + 0,5)
        const x0 = Math.max(0, Math.floor(Math.min(q[0][0], q[1][0], q[2][0]) - 0.5));
        const x1 = Math.min(W - 1, Math.ceil(Math.max(q[0][0], q[1][0], q[2][0]) - 0.5));
        const y0 = Math.max(0, Math.floor(Math.min(q[0][1], q[1][1], q[2][1]) - 0.5));
        const y1 = Math.min(H - 1, Math.ceil(Math.max(q[0][1], q[1][1], q[2][1]) - 0.5));
        const det = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
        if (Math.abs(det) < 1e-12) continue;
        for (let j = y0; j <= y1; j++) {
          for (let i = x0; i <= x1; i++) {
            const px = i + 0.5;
            const py = j + 0.5;
            const a = ((q[1][0] - px) * (q[2][1] - py) - (q[2][0] - px) * (q[1][1] - py)) / det;
            const b = ((q[2][0] - px) * (q[0][1] - py) - (q[0][0] - px) * (q[2][1] - py)) / det;
            if (a < -INSET || b < -INSET || 1 - a - b < -INSET) continue;
            const k = j * W + i;
            if (inside[k]) continue;
            inside[k] = 1;
            const s = c.smin + (i + 0.5 - c.x - PAD - 0.5) * texel;
            const w = c.tmin + (j + 0.5 - c.y - PAD - 0.5) * texel;
            for (let r = 0; r < 3; r++) {
              pos[k * 3 + r] = s * c.u[r] + w * c.v[r] + c.d * c.n[r];
              nrm[k * 3 + r] = c.n[r];
            }
          }
        }
      }
    }
    meshes.push(m);
  }
  // vrstvy: světlo → brána → (texel, E)
  const layers = [];
  let rays = 0;
  for (const L of lights) {
    const byGate = new Map();
    for (let k = 0; k < W * H; k++) {
      if (!inside[k]) continue;
      const x = pos[k * 3];
      const y = pos[k * 3 + 1];
      const z = pos[k * 3 + 2];
      const e = lightIrradiance(L, x, y, z, nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]);
      if (!(e > E_MIN)) continue;
      let g = 0;
      if (gateOf) {
        rays++;
        g = gateOf(L, x + nrm[k * 3] * SAMPLE_LIFT, y + nrm[k * 3 + 1] * SAMPLE_LIFT, z + nrm[k * 3 + 2] * SAMPLE_LIFT);
        if (g < 0) continue;
      }
      if (!byGate.has(g)) byGate.set(g, { idx: [], e: [] });
      const s = byGate.get(g);
      s.idx.push(k);
      s.e.push(e);
    }
    if (byGate.size) layers.push({ L, segs: [...byGate].map(([g, s]) => ({ gate: g, idx: Uint32Array.from(s.idx), e: Float32Array.from(s.e) })) });
  }
  const rgb = new Float32Array(W * H * 3);
  const data = new Uint16Array(W * H * 4);
  const used = [];
  for (let k = 0; k < W * H; k++) if (inside[k]) used.push(k);
  const dil = dilation(inside, W, H); // okraje map: pořadí a sousedé se spočítají jednou
  const touched = Uint32Array.from([...used, ...dil.target]);
  for (const k of touched) data[k * 4 + 3] = 0x3c00; // alfa 1,0
  const state = new Map(); // klíč světla nebo brány → úroveň při posledním složení
  const levelOf = (L) => (L.on && L.level > 0 && L.intensity > 0 ? L.level : 0);
  /** Složí vrstvy do textury; vrací true, když se něco změnilo (volat každý snímek). */
  function update(force = false) {
    let changed = force;
    const note = (key, value) => {
      if (state.get(key) === value) return;
      state.set(key, value);
      changed = true;
    };
    for (const { L, segs } of layers) {
      note(L, levelOf(L));
      for (const s of segs) if (s.gate) note(-s.gate, gate(s.gate));
    }
    if (!changed) return false;
    const a = [ambient[0] * Math.PI, ambient[1] * Math.PI, ambient[2] * Math.PI];
    for (const k of used) {
      rgb[k * 3] = a[0];
      rgb[k * 3 + 1] = a[1];
      rgb[k * 3 + 2] = a[2];
    }
    for (const { L, segs } of layers) {
      const lv = levelOf(L);
      if (!lv) continue;
      for (const s of segs) {
        const kk = lv * (s.gate ? gate(s.gate) : 1);
        if (!kk) continue;
        const c = L.color;
        for (let i = 0; i < s.idx.length; i++) {
          const k = s.idx[i] * 3;
          const e = s.e[i] * kk;
          rgb[k] += e * c[0];
          rgb[k + 1] += e * c[1];
          rgb[k + 2] += e * c[2];
        }
      }
    }
    const { target, start, src } = dil;
    for (let i = 0; i < target.length; i++) {
      const k = target[i] * 3;
      const n = start[i + 1] - start[i];
      rgb[k] = rgb[k + 1] = rgb[k + 2] = 0;
      for (let q = start[i]; q < start[i + 1]; q++) {
        rgb[k] += rgb[src[q] * 3] / n;
        rgb[k + 1] += rgb[src[q] * 3 + 1] / n;
        rgb[k + 2] += rgb[src[q] * 3 + 2] / n;
      }
    }
    for (let i = 0; i < touched.length; i++) {
      const k = touched[i];
      data[k * 4] = toHalf(rgb[k * 3]);
      data[k * 4 + 1] = toHalf(rgb[k * 3 + 1]);
      data[k * 4 + 2] = toHalf(rgb[k * 3 + 2]);
    }
    return true;
  }
  update(true);
  return { W, H, texel, texels: used.length, charts: all.length, rays, layers: layers.length, ms: now() - t0, data, rgb, inside, meshes, update };
}

/**
 * Okraje map: texely mimo plochu převezmou průměr sousedů, kteří už hodnotu mají (jinak by filtr textury přimíchal
 * černou do okraje). Spočítá se jednou: { target: texely v pořadí plnění, start, src: sousedé (CSR) }.
 */
function dilation(inside, W, H) {
  const filled = Uint8Array.from(inside);
  const target = [];
  const start = [0];
  const src = [];
  const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  for (let pass = 0; pass < PAD + 1; pass++) {
    const add = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = y * W + x;
        if (filled[k]) continue;
        const from = [];
        for (const [dx, dy] of near) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H && filled[yy * W + xx]) from.push(yy * W + xx);
        }
        if (from.length) add.push([k, from]);
      }
    }
    for (const [k, from] of add) {
      target.push(k);
      src.push(...from);
      start.push(src.length);
      filled[k] = 1;
    }
  }
  return { target: Uint32Array.from(target), start: Uint32Array.from(start), src: Uint32Array.from(src) };
}
