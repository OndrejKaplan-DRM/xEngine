// xRender: sběr geometrie do dávek. Bez three.js, aby šel použít i v Node (headless běh, testy).
// Síť na vstupu má tvar, který vrací src/xspace/geom.js: { positions, normals, uvs, indices } jako prostá pole.

/** Prázdná dávka. */
export function newBatch() {
  return { positions: [], normals: [], uvs: [], indices: [], tris: 0 };
}

const remap = new Map();

/**
 * Přidá do dávky část sítě danou rozsahem indexů (start, count). matrix (4×4 po sloupcích) vrcholy převede;
 * normály se otáčejí horní 3×3 částí a normalizují (měřítko entity je rovnoměrné). uvScale dělí souřadnice UV.
 * Vrací mapu vrchol sítě → vrchol dávky (sdílenou: přečíst hned).
 */
export function appendMesh(batch, mesh, start = 0, count = mesh.indices.length, matrix = null, uvScale = 1) {
  remap.clear();
  const { positions: P, normals: N, uvs: T, indices: I } = mesh;
  for (let k = start; k < start + count; k++) {
    const v = I[k];
    let nv = remap.get(v);
    if (nv === undefined) {
      nv = batch.positions.length / 3;
      remap.set(v, nv);
      const x = P[v * 3];
      const y = P[v * 3 + 1];
      const z = P[v * 3 + 2];
      const nx = N[v * 3];
      const ny = N[v * 3 + 1];
      const nz = N[v * 3 + 2];
      if (matrix) {
        const m = matrix;
        batch.positions.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]);
        const ax = m[0] * nx + m[4] * ny + m[8] * nz;
        const ay = m[1] * nx + m[5] * ny + m[9] * nz;
        const az = m[2] * nx + m[6] * ny + m[10] * nz;
        const len = Math.hypot(ax, ay, az) || 1;
        batch.normals.push(ax / len, ay / len, az / len);
      } else {
        batch.positions.push(x, y, z);
        batch.normals.push(nx, ny, nz);
      }
      if (T) batch.uvs.push(T[v * 2] / uvScale, T[v * 2 + 1] / uvScale);
      else batch.uvs.push(0, 0);
    }
    batch.indices.push(nv);
  }
  batch.tris += count / 3;
  return remap; // starý vrchol sítě → vrchol dávky (platí do dalšího volání; vzorky světla, D-041)
}

/**
 * Hotová dávka v typovaných polích. Barva vrcholů (světlo po vrcholech, D-022) je lineární a smí být nad 1;
 * vzniká jen pro materiály, které na světlo reagují. Pole sdílí vykreslení s výpočtem světla (bez kopií).
 */
export function finishBatch(b, lit) {
  const n = b.positions.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < b.positions.length; i++) {
    const d = i % 3;
    if (b.positions[i] < min[d]) min[d] = b.positions[i];
    if (b.positions[i] > max[d]) max[d] = b.positions[i];
  }
  return {
    min,
    max,
    positions: new Float32Array(b.positions),
    normals: new Float32Array(b.normals),
    uvs: new Float32Array(b.uvs),
    indices: n > 65535 ? new Uint32Array(b.indices) : new Uint16Array(b.indices),
    colors: lit ? new Float32Array(n * 3) : null,
    count: n,
    tris: b.tris,
    // dvojice (index vzorku levelu, vrchol dávky) pro zapečené světlo (D-041, D-044); null = dávka vzorky nenese
    sampleMap: b.sampleMap ? Uint32Array.from(b.sampleMap) : null,
  };
}

/** Zapamatuje si, které vrcholy dávky jsou vzorky levelu: base = index vzorku prvního vrcholu sítě (remap z appendMesh). */
export function noteSamples(batch, remap, base) {
  if (!(base >= 0)) return;
  const m = batch.sampleMap || (batch.sampleMap = []);
  for (const [v, nv] of remap) m.push(base + v, nv);
}
