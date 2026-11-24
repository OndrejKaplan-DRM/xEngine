// xForge, knihovna: z čeho se skládá prefab. Pořadí práce je vždy stejné a funkce ho vynucují:
// 1) kostra (uzly), 2) klouby s mezemi a zdůvodněním, 3) díly a kolize na uzlech, 4) součásti.
// Obal (bounds) a počet trojúhelníků se počítají z dat, nikdo je nepíše ručně.
// Matice koster bere z src/xspace/rig.js (jedna pravda), čísla zaokrouhluje jako zlatý vzorek.

import { partTris } from '../../src/xspace/index.js';
import { CYL_SIDES, partPoints, boundsAt } from '../../src/gen/measure.js';
import { r4, V, source } from '../../src/gen/util.js';
import { meshTris, meshCorners } from './mesh/registry.mjs';

// ---- díly a kolize -----------------------------------------------------------------------

export const box = (node, min, max, mat) => ({ node, shape: 'box', min: V(...min), max: V(...max), mat });
/** Kvádr zadaný středem a rozměry. */
export const boxc = (node, c, s, mat) => box(node, [c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2], [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2], mat);
export const cyl = (node, center, radius, height, axis, mat) => ({ node, shape: 'cyl', center: V(...center), radius: r4(radius), height: r4(height), axis, mat });
export const cbox = (node, min, max, group = 'world') => ({ node, shape: 'box', min: V(...min), max: V(...max), group });
export const ccyl = (node, center, radius, height, axis, group = 'world') => ({ node, shape: 'cyl', center: V(...center), radius: r4(radius), height: r4(height), axis, group });
/** Kolize přesně podle dílu. */
export const collide = (part, group = 'world') => {
  const { mat, ...rest } = part;
  return { ...rest, group };
};

// ---- kostra ------------------------------------------------------------------------------

export const node = (id, parent, pos, rot) => ({ id, ...(parent ? { parent } : {}), ...(pos ? { pos: V(...pos) } : {}), ...(rot ? { rot: V(...rot) } : {}) });
export const hinge = (id, nodeId, axis, min, max, o = {}) => ({ id, node: nodeId, type: 'hinge', axis, min, max, rest: o.rest ?? min, ...strip(o) });
export const slider = (id, nodeId, axis, min, max, o = {}) => ({ id, node: nodeId, type: 'slider', axis, min, max, rest: o.rest ?? min, ...strip(o) });
const strip = ({ rest, ...o }) => o;

// ---- měření ------------------------------------------------------------------------------
// Body dílů a obal pro dané polohy kloubů jsou v src/gen/measure.js (používá je i generátor levelů).

// Počet trojúhelníků dílu je v základu (partTris v src/xspace/geom.js, N-101); odtud se jen předává dál.
export { CYL_SIDES, partPoints, boundsAt, partTris };

/** Vzorky poloh kloubů: klid, každý kloub zvlášť po 15° (posuv po čtvrtinách), a všechny naráz v krajních polohách. */
export function jointSamples(joints = []) {
  const rest = Object.fromEntries(joints.map((j) => [j.id, j.rest ?? j.min]));
  const out = [rest];
  for (const j of joints) {
    const span = Math.min(j.max - j.min, j.type === 'hinge' ? 360 : Infinity);
    const n = j.type === 'hinge' ? Math.max(1, Math.ceil(span / 15)) : 4;
    for (let i = 0; i <= n; i++) out.push({ ...rest, [j.id]: j.min + (span * i) / n });
  }
  if (joints.length > 1) out.push(Object.fromEntries(joints.map((j) => [j.id, j.min])), Object.fromEntries(joints.map((j) => [j.id, j.max])));
  return out;
}

/** Obal přes celý rozsah pohybu (to, co kloub při práci zabere). */
export function sweptBounds(prefab) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const v of jointSamples(prefab.rig.joints)) {
    const b = boundsAt(prefab, v, meshCorners);
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], b.min[k]);
      max[k] = Math.max(max[k], b.max[k]);
    }
  }
  // na milimetry ven, ať obal díly opravdu obsahuje i po zaokrouhlení
  return { min: min.map((x) => r4(Math.floor(x * 1000 - 1e-6) / 1000)), max: max.map((x) => r4(Math.ceil(x * 1000 + 1e-6) / 1000)) };
}

// ---- sestavení prefabu -------------------------------------------------------------------

/**
 * Sestaví prefab xSpace. Pořadí polí je stejné jako ve zlatém vzorku.
 * @param d { id, title, category, nodes, joints?, parts, colliders?, components?, inputs?, outputs?, gen, params? }
 * @param notes zdůvodnění mezí kloubů: { idKloubu: 'zdroj nebo úvaha' } (jde do dokumentu a do galerie, ne do dat)
 */
export function definePrefab(d, notes = {}) {
  const rig = { nodes: d.nodes, ...(d.joints && d.joints.length ? { joints: d.joints } : {}) };
  const draft = { rig, parts: d.parts, colliders: d.colliders };
  for (const j of rig.joints || []) if (!notes[j.id]) throw new Error(`${d.id}: kloub „${j.id}“ nemá zdůvodnění mezí`);
  const prefab = {
    xspace: 1,
    kind: 'prefab',
    id: d.id,
    title: d.title,
    category: d.category,
    bounds: sweptBounds(draft),
    rig,
    parts: d.parts,
    ...(d.colliders ? { colliders: d.colliders } : {}),
    ...(d.components ? { components: d.components } : {}),
    ...(d.inputs ? { inputs: d.inputs } : {}),
    ...(d.outputs ? { outputs: d.outputs } : {}),
    tris: d.parts.reduce((s, p) => s + (partTris(p) ?? meshTris(p)), 0),
    // gen bez lomítka patří sadě kit_base (tools/forge/kit/), s lomítkem je cesta od tools/forge (lab/glass.mjs#beaker)
    source: source('xforge', d.gen.includes('/') ? `tools/forge/${d.gen}` : `tools/forge/kit/${d.gen}`, d.params ? { params: d.params } : {}),
  };
  return { prefab, notes };
}

// ---- obvyklé vstupy a výstupy (jména podle tabulky interakcí v kontraktech) ---------------

export const IO = {
  door: { inputs: ['open', 'close', 'toggle', 'lock', 'unlock'], outputs: ['opened', 'closed', 'locked', 'unlocked'] },
  drawer: { inputs: ['open', 'close', 'lock', 'unlock'], outputs: ['opened', 'closed'] },
  button: { inputs: ['press', 'lock', 'unlock'], outputs: ['pressed', 'released'] },
  switch: { inputs: ['turnOn', 'turnOff', 'toggle'], outputs: ['on', 'off'] },
  lever: { inputs: ['turnOn', 'turnOff', 'toggle'], outputs: ['on', 'off', 'changed'] },
  valve: { inputs: ['setLevel'], outputs: ['changed', 'opened', 'closed'] },
  lamp: { inputs: ['turnOn', 'turnOff', 'toggle', 'setLevel'], outputs: ['on', 'off'] },
  terminal: { inputs: ['print', 'lock', 'unlock'], outputs: ['used', 'left', 'command'] },
  station: { outputs: ['used', 'left'] },
  crate: { inputs: ['break'], outputs: ['damaged', 'broken'] },
};
