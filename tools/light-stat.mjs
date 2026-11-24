// Počty sítě světla levelů balíku (D-037): kvádry, plochy, schované plochy, vzorky, trojúhelníky a T-spoje.
// Použití: node tools/light-stat.mjs <adresář balíku> [--cell 0.25] [--json]
// T-spoj = vrchol jedné plochy leží uvnitř okrajové hrany jiné viditelné plochy, která tam vrchol nemá.
// Na takovém místě může rasterizace vynechat bod (šev). Méně je lépe; nula znamená síť bez švů.
import { readPackFull } from './lib/read-pack.mjs';
import { brushLightMesh, brushHiddenFaces, levelLightMeshes, LIGHT_CELL } from '../src/xspace/geom.js';

const args = process.argv.slice(2);
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--cell');
if (!dir) {
  console.error('Použití: node tools/light-stat.mjs <adresář balíku> [--cell 0.25] [--json]');
  process.exit(2);
}
const cell = args.includes('--cell') ? Number(args[args.indexOf('--cell') + 1]) : LIGHT_CELL;

/** Počet T-spojů mezi plochami sítí (každá skupina sítě je jedna plocha). */
function tJunctions(meshes, hash = 0.5) {
  const V = []; // x, y, z, plocha
  const E = []; // okrajové hrany: ax, ay, az, bx, by, bz, plocha
  let face = 0;
  for (const m of meshes) {
    if (!m) continue;
    for (const g of m.groups) {
      const count = new Map();
      const used = new Set();
      for (let i = g.start; i < g.start + g.count; i += 3) {
        for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
          const p = m.indices[i + a];
          const q = m.indices[i + b];
          used.add(p).add(q);
          const k = p < q ? `${p}_${q}` : `${q}_${p}`;
          count.set(k, (count.get(k) || 0) + 1);
        }
      }
      const at = (i) => [m.positions[i * 3], m.positions[i * 3 + 1], m.positions[i * 3 + 2]];
      for (const i of used) V.push([...at(i), face]);
      for (const [k, c] of count) {
        if (c !== 1) continue;
        const [p, q] = k.split('_').map(Number);
        E.push([...at(p), ...at(q), face]);
      }
      face++;
    }
  }
  const grid = new Map();
  const cellOf = (x) => Math.floor(x / hash);
  V.forEach((v, n) => {
    const k = `${cellOf(v[0])},${cellOf(v[1])},${cellOf(v[2])}`;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(n);
  });
  const seen = new Set();
  for (const e of E) {
    const lo = [0, 1, 2].map((k) => cellOf(Math.min(e[k], e[k + 3]) - 1e-4));
    const hi = [0, 1, 2].map((k) => cellOf(Math.max(e[k], e[k + 3]) + 1e-4));
    const d = [e[3] - e[0], e[4] - e[1], e[5] - e[2]];
    const len2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    for (let i = lo[0]; i <= hi[0]; i++) {
      for (let j = lo[1]; j <= hi[1]; j++) {
        for (let k = lo[2]; k <= hi[2]; k++) {
          for (const n of grid.get(`${i},${j},${k}`) || []) {
            const v = V[n];
            if (v[3] === e[6]) continue;
            const w = [v[0] - e[0], v[1] - e[1], v[2] - e[2]];
            const t = (w[0] * d[0] + w[1] * d[1] + w[2] * d[2]) / len2;
            if (t <= 1e-4 || t >= 1 - 1e-4) continue;
            const c = [w[0] - d[0] * t, w[1] - d[1] * t, w[2] - d[2] * t];
            if (c[0] * c[0] + c[1] * c[1] + c[2] * c[2] > 1e-10) continue;
            seen.add(`${e.slice(0, 6).map((x) => x.toFixed(4)).join()}|${v.slice(0, 3).map((x) => x.toFixed(4)).join()}`);
          }
        }
      }
    }
  }
  return seen.size;
}

const pack = await readPackFull(dir);
const materials = pack.materials?.materials || null;
const rows = [];
for (const { data: level } of pack.levels) {
  const hide = brushHiddenFaces(level.brushes, materials);
  const meshes = levelLightMeshes(level.brushes, materials, cell);
  let faces = 0;
  let samplesAll = 0;
  let trisAll = 0;
  let samples = 0;
  let tris = 0;
  level.brushes.forEach((b, i) => {
    if (b.vis === false) return;
    const all = brushLightMesh(b, cell);
    faces += all.groups.length;
    samplesAll += all.positions.length / 3;
    trisAll += all.indices.length / 3;
    samples += meshes[i].positions.length / 3;
    tris += meshes[i].indices.length / 3;
  });
  rows.push({
    level: level.id,
    cell,
    brushes: level.brushes.length,
    faces,
    hiddenFaces: hide.reduce((n, h) => n + (h ? h.length : 0), 0),
    samples,
    tris,
    samplesWithHidden: samplesAll,
    trisWithHidden: trisAll,
    tJunctions: tJunctions(meshes),
  });
}
if (args.includes('--json')) {
  console.log(JSON.stringify(rows));
} else {
  for (const r of rows) {
    console.log(
      `level ${r.level} (buňka ${String(r.cell).replace('.', ',')} m): kvádrů ${r.brushes}, ploch ${r.faces}, schovaných ${r.hiddenFaces}; ` +
        `vzorků ${r.samples} (se schovanými plochami ${r.samplesWithHidden}), trojúhelníků ${r.tris} (${r.trisWithHidden}); T-spojů ${r.tJunctions}`,
    );
  }
}
