// xWorld: které buňky vidí kterou plochu kvádru. Zeď patří v datech právě jedné buňce (docs/02_KONTRAKTY.md),
// ale její dvě strany jsou vidět ze dvou různých místností. Aby šla buňka schovat a stěna sousední místnosti
// přitom nezmizela, řadí se viditelná geometrie po plochách: každá plocha jde do dávky té buňky, do které míří.

const OUT = 0.02; // m; o kolik se plocha posune ve směru své normály, než se hledá buňka před ní
const TOL = 1e-4;

/**
 * Buňky, které vidí jednu plochu kvádru (skupinu trojúhelníků z brushMesh). Zapisuje id buněk do out.
 * 1. buňky, jejichž vzduch leží těsně před plochou (plocha posunutá ven se s nimi překrývá);
 * 2. když žádná není (ostění dveří, práh, vnější a zakryté plochy): buňky, kterých se kvádr dotýká, a buňka z dat.
 */
export function faceCells(mesh, group, brush, cells, out) {
  out.length = 0;
  const P = mesh.positions;
  const I = mesh.indices;
  let x0 = Infinity;
  let y0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let z1 = -Infinity;
  for (let k = group.start; k < group.start + group.count; k++) {
    const v = I[k] * 3;
    if (P[v] < x0) x0 = P[v];
    if (P[v] > x1) x1 = P[v];
    if (P[v + 1] < y0) y0 = P[v + 1];
    if (P[v + 1] > y1) y1 = P[v + 1];
    if (P[v + 2] < z0) z0 = P[v + 2];
    if (P[v + 2] > z1) z1 = P[v + 2];
  }
  const n = I[group.start] * 3;
  const dx = mesh.normals[n] * OUT;
  const dy = mesh.normals[n + 1] * OUT;
  const dz = mesh.normals[n + 2] * OUT;
  for (const c of cells) {
    const b = c.bounds;
    if (x0 + dx < b.max[0] - TOL && x1 + dx > b.min[0] + TOL && y0 + dy < b.max[1] - TOL && y1 + dy > b.min[1] + TOL && z0 + dz < b.max[2] - TOL && z1 + dz > b.min[2] + TOL) out.push(c.id);
  }
  if (out.length) return out;
  // plocha nemíří do žádné buňky
  const m = brush.min;
  const M = brush.max;
  if (m && M) {
    for (const c of cells) {
      const b = c.bounds;
      if (m[0] - OUT < b.max[0] && M[0] + OUT > b.min[0] && m[1] - OUT < b.max[1] && M[1] + OUT > b.min[1] && m[2] - OUT < b.max[2] && M[2] + OUT > b.min[2]) out.push(c.id);
    }
  }
  if (!out.includes(brush.cell)) out.push(brush.cell);
  return out;
}

/** Koule světla (střed, dosah; dosah 0 = bez omezení) zasahuje do kvádru buňky. */
export function sphereTouches(pos, range, bounds) {
  if (!(range > 0)) return true;
  const dx = Math.max(bounds.min[0] - pos[0], 0, pos[0] - bounds.max[0]);
  const dy = Math.max(bounds.min[1] - pos[1], 0, pos[1] - bounds.max[1]);
  const dz = Math.max(bounds.min[2] - pos[2], 0, pos[2] - bounds.max[2]);
  return dx * dx + dy * dy + dz * dz < range * range;
}
