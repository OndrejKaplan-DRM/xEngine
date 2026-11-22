// Geometrie kvádrů a klínů levelu. Jediná implementace toho, „co kvádr v datech znamená“:
// používá ji vykreslení, fyzika, zapékání světla i prohlížeč levelů. Čisté funkce, bez knihoven.
// Souřadnice: metry, +Y nahoru, pravotočivá soustava. UV: krabicová projekce ve světových metrech
// (spotřebitel dělí hodnotou uvScale materiálu).

/** Mapování klínu: s = 0…1 po směru stoupání, t = 0…1 napříč. Všechna čtyři jsou otočení, ne zrcadlení. */
function wedgeMap(b) {
  const [x0, , z0] = b.min;
  const [x1, , z1] = b.max;
  const L = (a, c, k) => a + (c - a) * k;
  switch (b.rise) {
    case '+x':
      return (s, t) => [L(x0, x1, s), L(z0, z1, t)];
    case '-x':
      return (s, t) => [L(x1, x0, s), L(z1, z0, t)];
    case '+z':
      return (s, t) => [L(x1, x0, t), L(z0, z1, s)];
    case '-z':
      return (s, t) => [L(x0, x1, t), L(z1, z0, s)];
    default:
      throw new Error(`Klín ${b.id || ''} nemá platný směr stoupání (rise).`);
  }
}

/** Délka běhu klínu (vodorovně) a jeho výška. */
export function wedgeRunRise(b) {
  const alongX = b.rise === '+x' || b.rise === '-x';
  const run = alongX ? b.max[0] - b.min[0] : b.max[2] - b.min[2];
  const rise = b.max[1] - b.min[1];
  return { run, rise, angleDeg: (Math.atan2(rise, run) * 180) / Math.PI };
}

/** Rohy tvaru: 8 pro box, 6 pro klín. Pole [x, y, z]. */
export function brushCorners(b) {
  const [x0, y0, z0] = b.min;
  const [x1, y1, z1] = b.max;
  if ((b.shape || 'box') === 'box') {
    return [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y1, z0],
      [x0, y1, z0],
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ];
  }
  const m = wedgeMap(b);
  const P = (s, y, t) => {
    const [x, z] = m(s, t);
    return [x, y, z];
  };
  // A, B, C na straně t = 0; D, E, F na straně t = 1. Nízký konec s = 0, vysoký s = 1.
  return [P(0, y0, 0), P(1, y0, 0), P(1, y1, 0), P(0, y0, 1), P(1, y0, 1), P(1, y1, 1)];
}

function pushQuad(out, face, p, uv) {
  // p: 4 rohy proti směru hodinových ručiček při pohledu zvenku
  const base = out.positions.length / 3;
  const ux = p[1][0] - p[0][0];
  const uy = p[1][1] - p[0][1];
  const uz = p[1][2] - p[0][2];
  const vx = p[3][0] - p[0][0];
  const vy = p[3][1] - p[0][1];
  const vz = p[3][2] - p[0][2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;
  for (let i = 0; i < 4; i++) {
    out.positions.push(p[i][0], p[i][1], p[i][2]);
    out.normals.push(nx, ny, nz);
    out.uvs.push(uv[i][0], uv[i][1]);
  }
  const start = out.indices.length;
  out.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  out.groups.push({ face, start, count: 6 });
}

function pushTri(out, face, p, uv) {
  const base = out.positions.length / 3;
  const ux = p[1][0] - p[0][0];
  const uy = p[1][1] - p[0][1];
  const uz = p[1][2] - p[0][2];
  const vx = p[2][0] - p[0][0];
  const vy = p[2][1] - p[0][1];
  const vz = p[2][2] - p[0][2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  nx /= len;
  ny /= len;
  nz /= len;
  for (let i = 0; i < 3; i++) {
    out.positions.push(p[i][0], p[i][1], p[i][2]);
    out.normals.push(nx, ny, nz);
    out.uvs.push(uv[i][0], uv[i][1]);
  }
  const start = out.indices.length;
  out.indices.push(base, base + 1, base + 2);
  out.groups.push({ face, start, count: 3 });
}

/**
 * Síť kvádru nebo klínu. Vrací prostá pole (ne typovaná), aby šla snadno slučovat:
 * { positions, normals, uvs, indices, groups: [{ face, start, count }] }.
 * face u boxu: '+x' | '-x' | '+y' | '-y' | '+z' | '-z'; u klínu: 'slope' | 'back' | '-y' | 'side0' | 'side1'.
 */
export function brushMesh(b) {
  const out = { positions: [], normals: [], uvs: [], indices: [], groups: [] };
  const [x0, y0, z0] = b.min;
  const [x1, y1, z1] = b.max;
  if ((b.shape || 'box') === 'box') {
    pushQuad(out, '+x', [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [[-z1, y0], [-z0, y0], [-z0, y1], [-z1, y1]]);
    pushQuad(out, '-x', [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]);
    pushQuad(out, '+y', [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [[x0, -z1], [x1, -z1], [x1, -z0], [x0, -z0]]);
    pushQuad(out, '-y', [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
    pushQuad(out, '+z', [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    pushQuad(out, '-z', [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [[-x1, y0], [-x0, y0], [-x0, y1], [-x1, y1]]);
    return out;
  }
  const [A, B, C, D, E, F] = brushCorners(b);
  const { run, rise } = wedgeRunRise(b);
  const slope = Math.hypot(run, rise);
  const alongX = b.rise === '+x' || b.rise === '-x';
  const width = alongX ? z1 - z0 : x1 - x0;
  // šikmá plocha: A (nízko, t=0) → D (nízko, t=1) → F (vysoko, t=1) → C (vysoko, t=0)
  pushQuad(out, 'slope', [A, D, F, C], [[0, 0], [width, 0], [width, slope], [0, slope]]);
  // svislá zadní stěna na vysokém konci: B → C → F → E
  pushQuad(out, 'back', [B, C, F, E], [[0, 0], [0, rise], [width, rise], [width, 0]]);
  // spodek: A → B → E → D
  pushQuad(out, '-y', [A, B, E, D], [[0, 0], [run, 0], [run, width], [0, width]]);
  // boky
  pushTri(out, 'side0', [A, C, B], [[0, 0], [run, rise], [run, 0]]);
  pushTri(out, 'side1', [D, E, F], [[0, 0], [run, 0], [run, rise]]);
  return out;
}

/**
 * Kolizní tvar: box → kvádr (střed a polorozměry), klín → konvexní obal ze 6 bodů.
 * { type: 'cuboid', center, half } | { type: 'hull', points: [[x,y,z]…] }
 */
export function brushCollider(b) {
  if ((b.shape || 'box') === 'box') {
    return {
      type: 'cuboid',
      center: [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2],
      half: [(b.max[0] - b.min[0]) / 2, (b.max[1] - b.min[1]) / 2, (b.max[2] - b.min[2]) / 2],
    };
  }
  return { type: 'hull', points: brushCorners(b) };
}

/** Počet trojúhelníků tvaru. */
export function brushTris(b) {
  return (b.shape || 'box') === 'box' ? 12 : 8;
}

/** Je bod uvnitř osově zarovnaného kvádru rozšířeného o eps? */
export function inBounds(p, bounds, eps = 0) {
  return (
    p[0] >= bounds.min[0] - eps &&
    p[0] <= bounds.max[0] + eps &&
    p[1] >= bounds.min[1] - eps &&
    p[1] <= bounds.max[1] + eps &&
    p[2] >= bounds.min[2] - eps &&
    p[2] <= bounds.max[2] + eps
  );
}

/** Vzdálenost dvou kvádrů (0, když se dotýkají nebo překrývají). */
export function boundsGap(a, b) {
  let d2 = 0;
  for (let i = 0; i < 3; i++) {
    const g = Math.max(0, a.min[i] - b.max[i], b.min[i] - a.max[i]);
    d2 += g * g;
  }
  return Math.sqrt(d2);
}
