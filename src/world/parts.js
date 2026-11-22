// xWorld: díly a kolizní tvary prefabu → sítě a tvary pro vykreslení a fyziku. Čisté funkce bez knihoven.
// Kvádr dílu je tentýž kvádr jako kvádr levelu, proto ho počítá brushMesh z src/xspace/geom.js.
// Válec základ zatím nemá (xView si ho staví přes three.js): cylMesh je dočasné řešení do rozhodnutí
// návrhu docs/navrhy/N-101 a dělí válec stejně jako xView (16 dílků, počty △ sedí s polem tris prefabů).

import { brushMesh } from '../xspace/index.js';

export const CYL_SEGMENTS = 16;

/** Otočení bodu z válce stojícího podél Y na osu z dat (shodně s xView: x = otočení kolem Z, z = kolem X). */
function turn(axis, x, y, z, out, i) {
  if (axis === 'x') {
    out[i] = -y;
    out[i + 1] = x;
    out[i + 2] = z;
  } else if (axis === 'z') {
    out[i] = x;
    out[i + 1] = -z;
    out[i + 2] = y;
  } else {
    out[i] = x;
    out[i + 1] = y;
    out[i + 2] = z;
  }
}

/** Síť válce { positions, normals, uvs, indices } v prostoru uzlu. UV pláště: obvod v metrech × výška. */
export function cylMesh(part) {
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
    turn(axis, x, y, z, p, 0);
    positions.push(p[0] + cx, p[1] + cy, p[2] + cz);
    turn(axis, nx, ny, nz, p, 0);
    normals.push(p[0], p[1], p[2]);
    uvs.push(u, v);
  };
  // plášť: dva kruhy po n + 1 vrcholech (šev kvůli UV)
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
  // víka: střed + kruh
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

/** Síť viditelného dílu v prostoru jeho uzlu, nebo null (díl 'mesh' ze souboru .glb přijde ve vlně 2). */
export function partMesh(part) {
  if (part.shape === 'box') return brushMesh({ min: part.min, max: part.max });
  if (part.shape === 'cyl') return cylMesh(part);
  return null;
}

/**
 * Kolizní tvar pro xPhys: { shape, center }, nebo null (hull a mesh ze souboru přijdou ve vlně 2).
 * center je střed tvaru v prostoru uzlu.
 */
export function colliderShape(c) {
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
