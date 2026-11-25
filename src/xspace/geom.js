// Geometrie kvádrů a klínů levelu. Jediná implementace toho, „co kvádr v datech znamená“:
// používá ji vykreslení, fyzika, zapékání světla i prohlížeč levelů. Čisté funkce, bez knihoven.
// Souřadnice: metry, +Y nahoru, pravotočivá soustava. UV: krabicová projekce ve světových metrech
// (spotřebitel dělí hodnotou uvScale materiálu).

import { latheMesh, rboxMesh, placeLathe } from './solids.js';

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

/** Výchozí buňka mřížky světla v metrech (Half-Life měl jeden vzorek světla na 16 jednotek, tedy zhruba 0,4 m). */
export const LIGHT_CELL = 0.5;
// Strop počtu dílků jedné hrany. Do něj se mřížka nezhrubuje (při buňce 0,25 m stačí na hranu 64 m), takže
// plochy běžného levelu sdílejí tytéž násobky; nad ním se krok zdvojuje a zůstává na násobcích ve světě.
const LIGHT_SEG_MAX = 256;
const GRID_EPS = 1e-6;

/**
 * Dělicí hodnoty hrany a→b: násobky kroku ve SVĚTOVÝCH souřadnicích, které leží uvnitř hrany (kraje ne),
 * v pořadí od a k b. Dvě plochy, které sdílejí přímku, na ní díky tomu mají stejné vrcholy (D-037).
 * Příliš dlouhá hrana krok zdvojuje, dokud se nevejde do stropu počtu dílků.
 */
function gridStops(a, b, cell) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let step = cell;
  let k0 = Math.ceil((lo + GRID_EPS) / step);
  let k1 = Math.floor((hi - GRID_EPS) / step);
  while (k1 - k0 + 2 > LIGHT_SEG_MAX) {
    step *= 2;
    k0 = Math.ceil((lo + GRID_EPS) / step);
    k1 = Math.floor((hi - GRID_EPS) / step);
  }
  const vals = [];
  // zaokrouhlení na mikrometr: hodnota je bit po bitu stejná jako tatáž souřadnice zapsaná v datech
  for (let k = k0; k <= k1; k++) vals.push(Math.round(k * step * 1e6) / 1e6);
  if (b < a) vals.reverse();
  return vals;
}

/** Osa, se kterou je hrana p→q rovnoběžná (0, 1, 2), nebo −1. */
function edgeAxis(p, q) {
  let ax = -1;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(q[k] - p[k]) > 1e-9) {
      if (ax >= 0) return -1;
      ax = k;
    }
  }
  return ax;
}

const mix = (a, b, t) => (t === 0 ? a : t === 1 ? b : a + (b - a) * t);

/**
 * Síť kvádru nebo klínu pro světlo po vrcholech: tytéž plochy jako brushMesh, každá rozdělená na mřížku
 * s buňkou nejvýš `cell` metrů. Vrcholy této sítě jsou vzorky světla.
 *
 * Mřížka, znění 2 (D-037): hrana rovnoběžná s osou se dělí na násobcích `cell` ve světových souřadnicích
 * (plus oba kraje hrany), ne rovnoměrně podle své délky. Šikmá hrana klínu a jeho trojúhelníkové boky se dělí
 * rovnoměrně jako dřív. `skip` (pole nebo množina jmen ploch) vyjmenuje plochy, které se nevyrábějí vůbec;
 * dodá ho brushHiddenFaces.
 *
 * POŘADÍ VRCHOLŮ JE KONTRAKT: zapékání ukládá hodnoty v tomto pořadí a běh je v něm čte (02_KONTRAKTY, Světlo).
 * Čtyřúhelník: řádky podél hrany p0→p3, v řádku podél p0→p1. Trojúhelník: řádky podél p0→p2, v řádku podél p0→p1.
 */
export function brushLightMesh(b, cell = LIGHT_CELL, skip = null) {
  const src = brushMesh(b);
  const out = { positions: [], normals: [], uvs: [], indices: [], groups: [] };
  const seg = (len) => Math.min(LIGHT_SEG_MAX, Math.max(1, Math.ceil(len / cell - 1e-6)));
  const P = (i) => [src.positions[i * 3], src.positions[i * 3 + 1], src.positions[i * 3 + 2]];
  const U = (i) => [src.uvs[i * 2], src.uvs[i * 2 + 1]];
  const dist = (a, c) => Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
  const skipped = skip ? (face) => (skip.has ? skip.has(face) : skip.includes(face)) : () => false;
  // dělení hrany p→q: parametry 0…1 a u osové hrany i přesné hodnoty souřadnice
  const stops = (p, q) => {
    const ax = edgeAxis(p, q);
    if (ax < 0) {
      const n = seg(dist(p, q));
      return { ax, par: Array.from({ length: n + 1 }, (_, i) => i / n), val: null };
    }
    const val = [p[ax], ...gridStops(p[ax], q[ax], cell), q[ax]];
    const par = val.map((x, i) => (i === 0 ? 0 : i === val.length - 1 ? 1 : (x - p[ax]) / (q[ax] - p[ax])));
    return { ax, par, val };
  };
  let v = 0;
  for (const g of src.groups) {
    const quad = g.count === 6;
    if (skipped(g.face)) {
      v += quad ? 4 : 3;
      continue;
    }
    const base = out.positions.length / 3;
    const start = out.indices.length;
    const nx = src.normals[v * 3];
    const ny = src.normals[v * 3 + 1];
    const nz = src.normals[v * 3 + 2];
    if (quad) {
      const p = [P(v), P(v + 1), P(v + 2), P(v + 3)];
      const u = [U(v), U(v + 1), U(v + 2), U(v + 3)];
      const su = stops(p[0], p[1]);
      const sv = stops(p[0], p[3]);
      const nu = su.par.length - 1;
      const nv = sv.par.length - 1;
      for (let j = 0; j <= nv; j++) {
        const t = sv.par[j];
        for (let i = 0; i <= nu; i++) {
          const s = su.par[i];
          for (let k = 0; k < 3; k++) {
            // všechny čtyřúhelníky brushMesh jsou rovnoběžníky, jejichž souřadnice závisí nejvýš na jednom parametru
            const alongU = p[1][k] !== p[0][k];
            const alongV = p[3][k] !== p[0][k];
            let x;
            if (alongU && alongV) x = (1 - s) * (1 - t) * p[0][k] + s * (1 - t) * p[1][k] + s * t * p[2][k] + (1 - s) * t * p[3][k];
            else if (alongU) x = k === su.ax ? su.val[i] : mix(p[0][k], p[1][k], s);
            else if (alongV) x = k === sv.ax ? sv.val[j] : mix(p[0][k], p[3][k], t);
            else x = p[0][k];
            out.positions.push(x);
          }
          const w = [(1 - s) * (1 - t), s * (1 - t), s * t, (1 - s) * t];
          for (let k = 0; k < 2; k++) out.uvs.push(w[0] * u[0][k] + w[1] * u[1][k] + w[2] * u[2][k] + w[3] * u[3][k]);
          out.normals.push(nx, ny, nz);
        }
      }
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          const a = base + j * (nu + 1) + i;
          out.indices.push(a, a + 1, a + nu + 2, a, a + nu + 2, a + nu + 1);
        }
      }
      v += 4;
    } else {
      const p = [P(v), P(v + 1), P(v + 2)];
      const u = [U(v), U(v + 1), U(v + 2)];
      const n = seg(Math.max(dist(p[0], p[1]), dist(p[0], p[2]), dist(p[1], p[2])));
      for (let j = 0; j <= n; j++) {
        for (let i = 0; i <= n - j; i++) {
          const s = i / n;
          const t = j / n;
          for (let k = 0; k < 3; k++) out.positions.push(p[0][k] + (p[1][k] - p[0][k]) * s + (p[2][k] - p[0][k]) * t);
          for (let k = 0; k < 2; k++) out.uvs.push(u[0][k] + (u[1][k] - u[0][k]) * s + (u[2][k] - u[0][k]) * t);
          out.normals.push(nx, ny, nz);
        }
      }
      const idx = (i, j) => base + j * (n + 1) - (j * (j - 1)) / 2 + i;
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n - j; i++) {
          out.indices.push(idx(i, j), idx(i + 1, j), idx(i, j + 1));
          if (i < n - j - 1) out.indices.push(idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1));
        }
      }
      v += 3;
    }
    out.groups.push({ face: g.face, start, count: out.indices.length - start });
  }
  return out;
}

/** Je materiál neprůhledný? (průhledný je s `opacity` pod 1 nebo s `alphaTest`) */
function materialOpaque(m) {
  return !m || (!(m.opacity < 1) && m.alphaTest == null);
}

/**
 * Plochy kvádrů a klínů, které leží celé v jiném neprůhledném kvádru (včetně jeho povrchu), a proto je nikdy
 * není vidět: styčná plocha dvou zdí, spodek zdi na podlaze, vršek pod stropem (D-037). Pro tyhle plochy se
 * síť světla nevyrábí. Stínítkem je jen viditelný kvádr tvaru box, jehož všechny materiály jsou neprůhledné.
 * `materials`: mapa id → materiál (objekt, Map nebo pole položek s `id`); bez ní se bere vše jako neprůhledné.
 * Vrací pole stejně dlouhé jako `brushes`: `null`, nebo pole jmen schovaných ploch v pořadí brushMesh.
 */
export function brushHiddenFaces(brushes, materials = null) {
  let mat = () => null;
  if (materials instanceof Map) mat = (id) => materials.get(id);
  else if (Array.isArray(materials)) {
    const byId = new Map(materials.map((m) => [m.id, m]));
    mat = (id) => byId.get(id);
  } else if (materials) mat = (id) => materials[id];
  const occluder = brushes.map(
    (b) => (b.shape || 'box') === 'box' && b.vis !== false && materialOpaque(mat(b.mat)) && Object.values(b.faces || {}).every((id) => materialOpaque(mat(id))),
  );
  return brushes.map((a, ia) => {
    const near = [];
    for (let ib = 0; ib < brushes.length; ib++) if (ib !== ia && occluder[ib] && boundsGap(a, brushes[ib]) <= GRID_EPS) near.push(brushes[ib]);
    if (!near.length) return null;
    const m = brushMesh(a);
    const hidden = [];
    let v = 0;
    for (const g of m.groups) {
      const n = g.count === 6 ? 4 : 3;
      const inside = (o) => {
        for (let i = v; i < v + n; i++) if (!inBounds([m.positions[i * 3], m.positions[i * 3 + 1], m.positions[i * 3 + 2]], o, GRID_EPS)) return false;
        return true;
      };
      if (near.some(inside)) hidden.push(g.face);
      v += n;
    }
    return hidden.length ? hidden : null;
  });
}

/**
 * Sítě světla celého levelu: jedna na kvádr v pořadí `brushes`, bez schovaných ploch; kvádr s `vis: false` má `null`.
 * TOHLE JE DEFINICE VZORKŮ LEVELU: zapékání i běh berou vzorky odtud (nebo z brushLightMesh se `skip` z brushHiddenFaces,
 * což je totéž) a v tomto pořadí.
 */
export function levelLightMeshes(brushes, materials = null, cell = LIGHT_CELL) {
  const hide = brushHiddenFaces(brushes, materials);
  return brushes.map((b, i) => (b.vis === false ? null : brushLightMesh(b, cell, hide[i])));
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

// ---- díly prefabu (N-101) ---------------------------------------------------------------
// Jediná implementace toho, jak vypadá díl prefabu jako síť a jako kolizní tvar. Čte ji engine, xView,
// galerie sady i xBake; vlastní dělení válce nikdo nepíše.

/** Počet dílků válce po obvodu. Válec má 4 × CYL_SEGMENTS trojúhelníků (plášť 2 ×, každé víko 1 ×). */
export const CYL_SEGMENTS = 16;

/** Otočení bodu z válce stojícího podél Y na osu z dat: x = o +90° kolem Z, z = o +90° kolem X. */
function cylTurn(axis, x, y, z, out) {
  if (axis === 'x') {
    out[0] = -y;
    out[1] = x;
    out[2] = z;
  } else if (axis === 'z') {
    out[0] = x;
    out[1] = -z;
    out[2] = y;
  } else {
    out[0] = x;
    out[1] = y;
    out[2] = z;
  }
}

/** Síť válce v prostoru uzlu. Vrcholy pláště v úhlech i / CYL_SEGMENTS · 2π od osy +Z směrem k +X. */
function cylMesh(part) {
  const n = CYL_SEGMENTS;
  const r = part.radius;
  const hh = part.height / 2;
  const axis = part.axis || 'y';
  const [cx, cy, cz] = part.center || [0, 0, 0];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const p = [0, 0, 0];
  const push = (x, y, z, nx, ny, nz, u, v) => {
    cylTurn(axis, x, y, z, p);
    positions.push(p[0] + cx, p[1] + cy, p[2] + cz);
    cylTurn(axis, nx, ny, nz, p);
    normals.push(p[0], p[1], p[2]);
    uvs.push(u, v);
  };
  // plášť: dva kruhy po n + 1 vrcholech (šev kvůli UV); UV = obvod v metrech × výška v metrech
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.sin(a);
    const c = Math.cos(a);
    push(s * r, hh, c * r, s, 0, c, (i / n) * 2 * Math.PI * r, part.height);
    push(s * r, -hh, c * r, s, 0, c, (i / n) * 2 * Math.PI * r, 0);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  // víka: střed a kruh; UV = průmět v metrech
  for (const top of [1, -1]) {
    const base = positions.length / 3;
    push(0, top * hh, 0, 0, top, 0, 0, 0);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      push(Math.sin(a) * r, top * hh, Math.cos(a) * r, 0, top, 0, Math.sin(a) * r, Math.cos(a) * r);
    }
    for (let i = 0; i < n; i++) {
      if (top > 0) indices.push(base, base + 1 + i, base + 2 + i);
      else indices.push(base, base + 2 + i, base + 1 + i);
    }
  }
  return { positions, normals, uvs, indices };
}

/**
 * Síť viditelného dílu prefabu v prostoru jeho uzlu: { positions, normals, uvs, indices } (stejný tvar jako
 * brushMesh), nebo null pro díl ze souboru (shape 'mesh').
 */
export function partMesh(part) {
  if (part.shape === 'box') return brushMesh({ min: part.min, max: part.max });
  if (part.shape === 'cyl') return cylMesh(part);
  if (part.shape === 'lathe') {
    const g = latheMesh(part.profile, { seg: part.seg, crease: new Set(part.crease || []), arc: part.arc });
    return placeLathe(g, part.axis || 'y', part.center || [0, 0, 0]);
  }
  if (part.shape === 'rbox') {
    if (!(part.radius > 0) || !(part.steps >= 1)) return brushMesh({ min: part.min, max: part.max });
    return rboxMesh(part.min, part.max, part.radius, part.steps);
  }
  return null;
}

/** Počet trojúhelníků dílu (box 12, cyl 4 × CYL_SEGMENTS, lathe a rbox ze sítě), nebo null pro díl ze souboru. */
export function partTris(part) {
  if (part.shape === 'box') return 12;
  if (part.shape === 'cyl') return 4 * CYL_SEGMENTS;
  if (part.shape === 'lathe' || part.shape === 'rbox') return partMesh(part).indices.length / 3; // degenerované se vynechají
  return null;
}

/**
 * Kolizní tvar položky colliders prefabu v prostoru jejího uzlu: { shape, center }, kde shape je
 * { type: 'box', half } | { type: 'cyl', radius, height, axis } | { type: 'ball', radius }. Pro hull a mesh null.
 */
export function partCollider(c) {
  switch (c.shape) {
    case 'box':
      return {
        shape: { type: 'box', half: [(c.max[0] - c.min[0]) / 2, (c.max[1] - c.min[1]) / 2, (c.max[2] - c.min[2]) / 2] },
        center: [(c.min[0] + c.max[0]) / 2, (c.min[1] + c.max[1]) / 2, (c.min[2] + c.max[2]) / 2],
      };
    case 'cyl':
      return { shape: { type: 'cyl', radius: c.radius, height: c.height, axis: c.axis || 'y' }, center: c.center || [0, 0, 0] };
    case 'ball':
      return { shape: { type: 'ball', radius: c.radius }, center: c.center || [0, 0, 0] };
    default:
      return null;
  }
}
