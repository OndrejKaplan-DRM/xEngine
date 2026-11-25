// Vzorky světla levelu (D-022, D-037, D-041): jediná definice, které body levelu nesou světlo a v jakém pořadí.
// Zapékání (xBake) ukládá hodnoty v tomto pořadí a běh je v něm čte. Čisté funkce bez knihoven.
//
// Pořadí:
//   1. vrcholy sítí `levelLightMeshes` (kvádry v pořadí `brushes`, kvádr s vis: false nic),
//   2. vrcholy pevných dílů prefabů: entity v pořadí `entities`, díly v pořadí `parts` prefabu, vrcholy v pořadí
//      `partMesh`, ve světových souřadnicích.
// Pevný díl = díl tvaru box, cyl, lathe nebo rbox (N-012, D-058) na uzlu, nad kterým ani na kterém není kloub, u entity, která není dynamické
// těleso (`physics.body: dynamic`) ani `pickup`. Pohyblivé díly a pohyblivé entity osvětluje běh po stěnách.

import { levelLightMeshes, partMesh, LIGHT_CELL } from './geom.js';
import { entityMatrix, rigMatrices, mat4Mul, mat4Point } from './rig.js';

/** Tvary dílů, které nesou vzorky světla: síť z partMesh (díl mesh ze souboru ne). */
export const STATIC_SHAPES = new Set(['box', 'cyl', 'lathe', 'rbox']);

/** Uzly prefabu, které se hýbou: uzel s kloubem a všichni jeho potomci. */
export function movingNodes(prefab) {
  const jointNodes = new Set((prefab.rig?.joints || []).map((j) => j.node));
  const parent = new Map((prefab.rig?.nodes || []).map((n) => [n.id, n.parent]));
  const out = new Set();
  for (const n of prefab.rig?.nodes || []) {
    for (let id = n.id; id !== undefined; id = parent.get(id)) {
      if (jointNodes.has(id)) {
        out.add(n.id);
        break;
      }
    }
  }
  return out;
}

/** Entita se hýbe celá (dynamické těleso, sebratelný předmět): její díly do vzorků nepatří. */
export function entityMovesWhole(prefab) {
  const comp = prefab.components || {};
  return comp.physics?.body === 'dynamic' || !!comp.pickup;
}

/** Indexy pevných dílů prefabu (do `prefab.parts`), v pořadí dílů. */
export function staticPartIndices(prefab) {
  if (entityMovesWhole(prefab)) return [];
  const moving = movingNodes(prefab);
  const out = [];
  (prefab.parts || []).forEach((p, i) => {
    if (STATIC_SHAPES.has(p.shape) && !moving.has(p.node)) out.push(i);
  });
  return out;
}

/**
 * Síť pevných dílů jedné entity ve světových souřadnicích, nebo null, když žádné nemá.
 * @returns {{ positions: number[], normals: number[], uvs: number[], indices: number[], parts: [number, number, number, string][] } | null}
 *          parts: [index dílu v prefabu, první vrchol, počet vrcholů, materiál]
 */
export function entityStaticMesh(entity, prefab) {
  const idx = staticPartIndices(prefab);
  if (!idx.length) return null;
  const em = entityMatrix(entity);
  const M = rigMatrices(prefab);
  const out = { positions: [], normals: [], uvs: [], indices: [], parts: [] };
  for (const i of idx) {
    const part = prefab.parts[i];
    const mesh = partMesh(part);
    const W = mat4Mul(em, M[part.node]);
    const v0 = out.positions.length / 3;
    const n = mesh.positions.length / 3;
    for (let v = 0; v < n; v++) {
      const p = mat4Point(W, [mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]]);
      out.positions.push(p[0], p[1], p[2]);
      const a = mesh.normals[v * 3];
      const b = mesh.normals[v * 3 + 1];
      const c = mesh.normals[v * 3 + 2];
      const nx = W[0] * a + W[4] * b + W[8] * c;
      const ny = W[1] * a + W[5] * b + W[9] * c;
      const nz = W[2] * a + W[6] * b + W[10] * c;
      const len = Math.hypot(nx, ny, nz) || 1;
      out.normals.push(nx / len, ny / len, nz / len);
    }
    out.uvs.push(...mesh.uvs);
    for (const k of mesh.indices) out.indices.push(k + v0);
    out.parts.push([i, v0, n, part.mat]);
  }
  return out;
}

/**
 * Všechny vzorky světla levelu v pořadí kontraktu.
 * @param level data levelu ({ brushes, entities })
 * @param prefabs Map id → prefab, nebo objekt { id: prefab }
 * @param materials materiály balíku (pro schované plochy, D-037), nebo null
 * @returns {{ brushes: (object|null)[], entities: (object|null)[], count: number,
 *            brushCounts: [string, number][], entityCounts: [string, number][] }}
 *          brushes[i] = síť kvádru i (`levelLightMeshes`), entities[i] = `entityStaticMesh` entity i;
 *          vzorek s indexem s leží v síti, kam ukazují kumulované počty (nejdřív kvádry, pak entity).
 */
export function levelSamples(level, prefabs, materials = null, cell = LIGHT_CELL) {
  const get = (id) => (prefabs instanceof Map ? prefabs.get(id) : prefabs[id]);
  const brushes = levelLightMeshes(level.brushes || [], materials, cell);
  const brushCounts = [];
  let count = 0;
  (level.brushes || []).forEach((b, i) => {
    const n = brushes[i] ? brushes[i].positions.length / 3 : 0;
    brushCounts.push([b.id, n]);
    count += n;
  });
  const entities = [];
  const entityCounts = [];
  for (const e of level.entities || []) {
    const prefab = get(e.prefab);
    const mesh = prefab ? entityStaticMesh(e, prefab) : null;
    entities.push(mesh);
    const n = mesh ? mesh.positions.length / 3 : 0;
    entityCounts.push([e.id, n]);
    count += n;
  }
  return { brushes, entities, count, brushCounts, entityCounts };
}
