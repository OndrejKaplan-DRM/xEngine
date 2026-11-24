// Atlas ploch pro texturu světla (N-112, D-050; zkušební do zkoušky celého complex_7). Jediná pravda pro xBake
// (kde leží body, které se zapékají) i pro běh (UV 1 vrcholů, okraje map). Čistý modul bez Three.js a Node.
//
// Plochy bere ze vzorků levelu `levelSamples` (D-041): kvádry v pořadí brushes, potom pevné díly entit. Mapa (chart)
// = trojúhelníky jedné sítě spojené sdíleným vrcholem a se stejnou normálou vrcholů. Trojúhelník, jehož vrcholy
// nemají stejnou normálu (plášť válce), mapu nemá a jeho vrcholy zůstávají po vrcholech (UV = NaN).
// Mapy se skládají po řádcích (podle výšky, při shodě v pořadí vzniku); okraj LIGHTMAP_PAD bodů kolem každé.
// Bod textury (i, j) = střed texelu; řádek j = 0 je první v datech (textura bez flipY), index k = j · šířka + i.
// Vrchol leží přesně ve středu bodu: UV = ((sloupec + 0,5) / šířka, (řádek + 0,5) / výška).

/** Výchozí velikost bodu textury světla, m (Ondřej 25. 11. 2026: „(a)“, D-050). */
export const LIGHTMAP_TEXEL = 0.05;
/** Body kolem každé mapy: bilineární filtr nesmí sáhnout do sousední mapy. */
export const LIGHTMAP_PAD = 2;
/** Největší strana atlasu v bodech. */
export const LIGHTMAP_MAX = 8192;
const INSET = 1e-4; // tolerance testu „střed bodu leží v trojúhelníku“, v bodech
const FLAT = 1e-3; // shoda normál vrcholů (součet absolutních rozdílů složek)

/** Báze roviny s normálou n: u vodorovně, kde to jde, v = n × u. */
function basis(n) {
  const a = Math.abs(n[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  let u = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]];
  const l = Math.hypot(u[0], u[1], u[2]);
  u = [u[0] / l, u[1] / l, u[2] / l];
  return { u, v: [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]] };
}

/** Mapy jedné sítě: [{ tris, n, u, v, d, smin, smax, tmin, tmax }] v metrech; nerovinné trojúhelníky vynechá. */
function chartsOf(mesh) {
  const I = mesh.indices;
  const N = mesh.normals;
  const P = mesh.positions;
  const nt = I.length / 3;
  const nv = P.length / 3;
  const parent = new Int32Array(nt);
  for (let i = 0; i < nt; i++) parent[i] = i;
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  const same = (a, b) => Math.abs(N[a * 3] - N[b * 3]) + Math.abs(N[a * 3 + 1] - N[b * 3 + 1]) + Math.abs(N[a * 3 + 2] - N[b * 3 + 2]) < FLAT;
  const flat = new Uint8Array(nt);
  for (let t = 0; t < nt; t++) flat[t] = same(I[t * 3], I[t * 3 + 1]) && same(I[t * 3], I[t * 3 + 2]) ? 1 : 0;
  const owner = new Int32Array(nv).fill(-1);
  for (let t = 0; t < nt; t++) {
    if (!flat[t]) continue;
    for (let k = 0; k < 3; k++) {
      const v = I[t * 3 + k];
      if (owner[v] < 0) owner[v] = t;
      else if (same(v, I[owner[v] * 3])) parent[find(t)] = find(owner[v]);
    }
  }
  const groups = new Map();
  for (let t = 0; t < nt; t++) {
    if (!flat[t]) continue;
    const r = find(t);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(t);
  }
  const out = [];
  for (const tris of groups.values()) {
    const a = I[tris[0] * 3];
    const n = [N[a * 3], N[a * 3 + 1], N[a * 3 + 2]];
    const { u, v } = basis(n);
    const c = { tris, n, u, v, d: n[0] * P[a * 3] + n[1] * P[a * 3 + 1] + n[2] * P[a * 3 + 2], smin: Infinity, smax: -Infinity, tmin: Infinity, tmax: -Infinity };
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const p = I[t * 3 + k] * 3;
        const s = P[p] * u[0] + P[p + 1] * u[1] + P[p + 2] * u[2];
        const w = P[p] * v[0] + P[p + 1] * v[1] + P[p + 2] * v[2];
        if (s < c.smin) c.smin = s;
        if (s > c.smax) c.smax = s;
        if (w < c.tmin) c.tmin = w;
        if (w > c.tmax) c.tmax = w;
      }
    }
    out.push(c);
  }
  return out;
}

const pow2 = (x) => {
  let p = 64;
  while (p < x) p *= 2;
  return p;
};

/** FNV-1a nad bajty pole; otisk atlasu, který zapečený soubor nese (xBake) a běh porovná. */
function fnv(arrays) {
  let h = 0x811c9dc5;
  for (const a of arrays) {
    const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    for (let i = 0; i < b.length; i++) h = Math.imul(h ^ b[i], 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Rozložení atlasu pro vzorky levelu.
 * @param samples výsledek levelSamples(level, prefabs, materials, LIGHT_CELL)
 * @param texel velikost bodu, m (výchozí LIGHTMAP_TEXEL)
 * @returns {{ texel, width, height, pad, charts, meshes, uv: Float32Array, inAtlas: number, hash: string }}
 *   charts: [{ mesh, x, y, w, h, n, u, v, d, smin, tmin, tris }] (mesh = index do meshes);
 *   meshes: [{ kind: 'brush' | 'entity', index, offset, mesh }] v pořadí vzorků; uv[2 · vzorek] (NaN mimo atlas)
 */
export function lightmapLayout(samples, texel = LIGHTMAP_TEXEL) {
  if (!(texel > 0)) throw new Error('atlas: velikost bodu musí být kladná');
  const meshes = [];
  let offset = 0;
  samples.brushes.forEach((m, i) => {
    if (!m) return;
    meshes.push({ kind: 'brush', index: i, offset, mesh: m });
    offset += m.positions.length / 3;
  });
  samples.entities.forEach((m, i) => {
    if (!m) return;
    meshes.push({ kind: 'entity', index: i, offset, mesh: m });
    offset += m.positions.length / 3;
  });
  const charts = [];
  meshes.forEach((M, k) => {
    for (const c of chartsOf(M.mesh)) charts.push({ mesh: k, ...c });
  });
  let area = 0;
  let widest = 1;
  for (const c of charts) {
    c.w = Math.max(1, Math.ceil((c.smax - c.smin) / texel - 1e-6) + 1) + 2 * LIGHTMAP_PAD;
    c.h = Math.max(1, Math.ceil((c.tmax - c.tmin) / texel - 1e-6) + 1) + 2 * LIGHTMAP_PAD;
    area += c.w * c.h;
    widest = Math.max(widest, c.w);
  }
  let W = 64;
  while (W * W < area * 1.15 && W < LIGHTMAP_MAX) W *= 2;
  W = Math.max(W, pow2(widest));
  if (W > LIGHTMAP_MAX) throw new Error(`atlas: mapa široká ${widest} bodů je nad strop ${LIGHTMAP_MAX}`);
  const order = charts.map((c, i) => i).sort((a, b) => charts[b].h - charts[a].h || a - b);
  let x = 0;
  let y = 0;
  let row = 0;
  for (const i of order) {
    const c = charts[i];
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
  const H = pow2(y + row);
  if (H > LIGHTMAP_MAX) throw new Error(`atlas: ${W} × ${H} bodů je nad strop ${LIGHTMAP_MAX}`);
  const uv = new Float32Array(offset * 2).fill(NaN);
  let inAtlas = 0;
  for (const c of charts) {
    const M = meshes[c.mesh];
    const P = M.mesh.positions;
    const I = M.mesh.indices;
    for (const t of c.tris) {
      for (let k = 0; k < 3; k++) {
        const v = I[t * 3 + k];
        const o = (M.offset + v) * 2;
        if (!Number.isNaN(uv[o])) continue;
        const p = v * 3;
        const s = P[p] * c.u[0] + P[p + 1] * c.u[1] + P[p + 2] * c.u[2];
        const w = P[p] * c.v[0] + P[p + 1] * c.v[1] + P[p + 2] * c.v[2];
        uv[o] = (c.x + LIGHTMAP_PAD + (s - c.smin) / texel + 0.5) / W;
        uv[o + 1] = (c.y + LIGHTMAP_PAD + (w - c.tmin) / texel + 0.5) / H;
        inAtlas++;
      }
    }
  }
  const rects = Float64Array.from(charts.flatMap((c) => [c.x, c.y, c.w, c.h]));
  const hash = fnv([Float64Array.of(texel, W, H), rects, uv]);
  return { texel, width: W, height: H, pad: LIGHTMAP_PAD, charts, meshes, uv, inAtlas, hash };
}

/**
 * Body atlasu, které leží na ploše (středy bodů uvnitř trojúhelníků map). Pro xBake: kde zapékat.
 * @returns {{ index: Uint32Array, positions: Float32Array, normals: Float32Array, chart: Uint32Array }}
 *   index = k vzestupně; positions a normals po třech složkách; chart = index mapy bodu
 */
export function lightmapTexels(layout) {
  const { width: W, height: H, texel, charts, meshes } = layout;
  const own = new Int32Array(W * H).fill(-1);
  let n = 0;
  charts.forEach((c, ci) => {
    const M = meshes[c.mesh].mesh;
    const P = M.positions;
    const I = M.indices;
    const tx = (p) => c.x + LIGHTMAP_PAD + (P[p] * c.u[0] + P[p + 1] * c.u[1] + P[p + 2] * c.u[2] - c.smin) / texel + 0.5;
    const ty = (p) => c.y + LIGHTMAP_PAD + (P[p] * c.v[0] + P[p + 1] * c.v[1] + P[p + 2] * c.v[2] - c.tmin) / texel + 0.5;
    for (const t of c.tris) {
      const q = [0, 1, 2].map((k) => [tx(I[t * 3 + k] * 3), ty(I[t * 3 + k] * 3)]);
      const det = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
      if (Math.abs(det) < 1e-12) continue;
      const x0 = Math.max(0, Math.floor(Math.min(q[0][0], q[1][0], q[2][0]) - 0.5));
      const x1 = Math.min(W - 1, Math.ceil(Math.max(q[0][0], q[1][0], q[2][0]) - 0.5));
      const y0 = Math.max(0, Math.floor(Math.min(q[0][1], q[1][1], q[2][1]) - 0.5));
      const y1 = Math.min(H - 1, Math.ceil(Math.max(q[0][1], q[1][1], q[2][1]) - 0.5));
      for (let j = y0; j <= y1; j++) {
        for (let i = x0; i <= x1; i++) {
          const px = i + 0.5;
          const py = j + 0.5;
          const a = ((q[1][0] - px) * (q[2][1] - py) - (q[2][0] - px) * (q[1][1] - py)) / det;
          const b = ((q[2][0] - px) * (q[0][1] - py) - (q[0][0] - px) * (q[2][1] - py)) / det;
          if (a < -INSET || b < -INSET || 1 - a - b < -INSET) continue;
          const k = j * W + i;
          if (own[k] >= 0) continue;
          own[k] = ci;
          n++;
        }
      }
    }
  });
  const index = new Uint32Array(n);
  const chart = new Uint32Array(n);
  const positions = new Float32Array(n * 3);
  const normals = new Float32Array(n * 3);
  let o = 0;
  for (let k = 0; k < W * H; k++) {
    const ci = own[k];
    if (ci < 0) continue;
    const c = charts[ci];
    const i = k % W;
    const j = (k - i) / W;
    const s = c.smin + (i - c.x - LIGHTMAP_PAD) * texel;
    const w = c.tmin + (j - c.y - LIGHTMAP_PAD) * texel;
    index[o] = k;
    chart[o] = ci;
    for (let r = 0; r < 3; r++) {
      positions[o * 3 + r] = s * c.u[r] + w * c.v[r] + c.d * c.n[r];
      normals[o * 3 + r] = c.n[r];
    }
    o++;
  }
  return { index, positions, normals, chart };
}

/**
 * Okraje map: body mimo plochu převezmou průměr sousedů (8 směrů), kteří už hodnotu mají; jinak filtr přimíchá
 * černou. `pad` kol od plochy ven, v každém kole body vzestupně podle k. Spočítá se jednou z rozměru atlasu
 * a bodů na ploše; vrací CSR { target, start, src } (src = indexy k sousedů).
 */
export function lightmapDilation(width, height, index, pad = LIGHTMAP_PAD) {
  const filled = new Uint8Array(width * height);
  const mark = new Int32Array(width * height).fill(-1);
  for (let i = 0; i < index.length; i++) filled[index[i]] = 1;
  const DX = [1, -1, 0, 0, 1, -1, 1, -1];
  const DY = [0, 0, 1, -1, 1, -1, -1, 1];
  let target = new Uint32Array(1024);
  let src = new Uint32Array(4096);
  let start = new Uint32Array(1025);
  let nt = 0;
  let ns = 0;
  let front = index;
  for (let pass = 0; pass < pad && front.length; pass++) {
    let cand = new Uint32Array(Math.max(16, front.length * 2));
    let nc = 0;
    for (let f = 0; f < front.length; f++) {
      const k = front[f];
      const x = k % width;
      const y = (k - x) / width;
      for (let d = 0; d < 8; d++) {
        const xx = x + DX[d];
        const yy = y + DY[d];
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const q = yy * width + xx;
        if (filled[q] || mark[q] === pass) continue;
        mark[q] = pass;
        if (nc === cand.length) {
          const g = new Uint32Array(cand.length * 2);
          g.set(cand);
          cand = g;
        }
        cand[nc++] = q;
      }
    }
    const add = cand.subarray(0, nc).sort();
    for (let a = 0; a < add.length; a++) {
      const k = add[a];
      const x = k % width;
      const y = (k - x) / width;
      if (ns + 8 > src.length) {
        const g = new Uint32Array(src.length * 2);
        g.set(src);
        src = g;
      }
      for (let d = 0; d < 8; d++) {
        const xx = x + DX[d];
        const yy = y + DY[d];
        if (xx >= 0 && yy >= 0 && xx < width && yy < height && filled[yy * width + xx]) src[ns++] = yy * width + xx;
      }
      if (nt + 1 >= target.length) {
        const g = new Uint32Array(target.length * 2);
        g.set(target);
        target = g;
        const h = new Uint32Array(start.length * 2);
        h.set(start);
        start = h;
      }
      target[nt++] = k;
      start[nt] = ns;
    }
    for (let a = 0; a < add.length; a++) filled[add[a]] = 1;
    front = add;
  }
  return { target: target.slice(0, nt), start: start.slice(0, nt + 1), src: src.slice(0, ns) };
}
