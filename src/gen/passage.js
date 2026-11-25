// Průchodnost místnosti: vede mezi všemi jejími otvory po podlaze cesta široká aspoň 2 × R?
// Mřížka 10 cm nad půdorysem buňky; překážka je pevná věc mezi 0,25 a 1,7 m nad podlahou.
// Generátor tím hlídá, že nábytek nezatarasí průchod; nezávislou kontrolu téhož má test B-T1.
// R nemá výchozí hodnotu schválně: dává ho předvolba z rozměrů postavy (body.js, passRadius).

const G = 0.1;

/**
 * @param cell { min: [x, z], max: [x, z], y0 } v centimetrech
 * @param sides otvory buňky: [{ run, face, n, c0, c1 }] v centimetrech
 * @param solids kvádry překážek v metrech: [{ min, max }]
 * @param R poloměr postavy s odstupem kontroléru a rezervou v metrech
 */
export function openingsConnected(cell, sides, solids, R) {
  if (!(R > 0)) throw new Error('openingsConnected: chybí poloměr postavy');
  if (sides.length < 2) return true;
  const [x0, z0, x1, z1] = [cell.min[0] / 100, cell.min[1] / 100, cell.max[0] / 100, cell.max[1] / 100];
  const y0 = cell.y0 / 100;
  const blocks = solids.filter((q) => q.max[1] > y0 + 0.25 && q.min[1] < y0 + 1.7);
  const nx = Math.round((x1 - x0) / G);
  const nz = Math.round((z1 - z0) / G);
  const blockedAt = (x, z) => blocks.some((q) => x > q.min[0] - R && x < q.max[0] + R && z > q.min[2] - R && z < q.max[2] + R);
  const free = new Uint8Array(nx * nz);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const x = x0 + (i + 0.5) * G;
      const z = z0 + (j + 0.5) * G;
      free[i * nz + j] = x - x0 >= R && x1 - x >= R && z - z0 >= R && z1 - z >= R && !blockedAt(x, z) ? 1 : 0;
    }
  }
  const index = (x, z) => [Math.floor((x - x0) / G), Math.floor((z - z0) / G)];
  const entries = sides.map((s) => {
    const along = (s.c0 + s.c1) / 200;
    const at = (d) => (s.run === 0 ? [along, s.face / 100 + s.n * d] : [s.face / 100 + s.n * d, along]);
    for (let d = 0.05; d < 0.5; d += G) {
      const [x, z] = at(d);
      const [i, j] = index(x, z);
      if (i >= 0 && j >= 0 && i < nx && j < nz && !blockedAt(x, z)) free[i * nz + j] = 1; // v pruhu otvoru se smí těsně ke zdi
    }
    return index(...at(0.45));
  });
  const seen = new Uint8Array(nx * nz);
  const stack = [entries[0]];
  while (stack.length) {
    const [i, j] = stack.pop();
    if (i < 0 || j < 0 || i >= nx || j >= nz || seen[i * nz + j] || !free[i * nz + j]) continue;
    seen[i * nz + j] = 1;
    stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
  }
  return entries.every(([i, j]) => i >= 0 && j >= 0 && i < nx && j < nz && seen[i * nz + j]);
}
