// xBake: zápis souboru se zapečeným světlem a otisky (N-001, přijato D-035). Stavbu souboru a čtení popisuje
// src/xspace/bake.js (D-044, převzato z tools/bake/read.mjs); tady je jen to, co potřebuje Node (otisky, Buffer).

import { createHash } from 'node:crypto';
import { levelLightMeshes, levelSamples } from '../../src/xspace/index.js';
import { MAGIC } from '../../src/xspace/bake.js';

export { MAGIC, decodeBake, composeColors, gateLevel } from '../../src/xspace/bake.js';

const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

/** Znění mřížky světla v základu (D-037). Soubor zapečený jiným zněním neplatí, i když se kvádry nezměnily. */
export const GRID = 2;
/**
 * Otisk geometrie: znění mřížky, buňka, tvary kvádrů v pořadí levelu a počet vzorků každého kvádru (ten závisí
 * i na viditelnosti kvádrů a průhlednosti materiálů, protože schované plochy vzorky nemají); s prefaby (D-041)
 * i entity v pořadí levelu s polohou, prefabem a počtem vzorků pevných dílů.
 * Když nesedí, vzorky neodpovídají a soubor neplatí.
 */
export const geometryHash = (level, cell, materials = null, prefabs = null) => {
  const brushes = [GRID, cell, level.brushes.map((b) => [b.shape || 'box', b.min, b.max, b.rise || '']), levelLightMeshes(level.brushes, materials, cell).map((m) => (m ? m.positions.length / 3 : 0))];
  if (!prefabs) return sha(brushes);
  const L = levelSamples(level, prefabs, materials, cell);
  return sha([...brushes, (level.entities || []).map((e, i) => [e.id, e.prefab, e.pos, e.rot || null, e.scale ?? 1, L.entityCounts[i][1]])]);
};
/** Otisk světla: vše, z čeho se počítá E při plné úrovni (barva ne, tou násobí běh). */
export const lightHash = (l) => sha([l.type, l.pos || null, l.dir || null, l.intensity, l.range ?? null, l.angle ?? null]);
/** Otisk stínítek a bran: entity, jejich prefaby a dveře portálů. Když nesedí, vzorky platí, ale stíny a brány mohou být jinde. */
export const sceneHash = (level, prefabs) =>
  sha([(level.entities || []).map((e) => [e.id, e.prefab, e.pos, e.rot || null, e.scale ?? 1, (prefabs.get(e.prefab) || {}).tris ?? null]), (level.portals || []).filter((p) => p.door).map((p) => [p.id, p.door, p.quad])]);

/** Výsledek bakeLevel → Buffer. */
export function encodeBake(bake, level, prefabs, materials = null) {
  const chunks = [];
  let offset = 0;
  const push = (typed) => {
    const at = offset;
    chunks.push(Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength));
    offset += typed.byteLength;
    return at;
  };
  const layers = bake.layers.map((L) => {
    const ch = L.channels;
    const idx = [];
    for (let s = 0; s < bake.samples; s++) {
      let any = false;
      for (let c = 0; c < ch; c++) if (L.data[s * ch + c] !== 0) any = true;
      if (any) idx.push(s);
    }
    const src = bake.lights.find((x) => x.id === L.id);
    const head = { id: L.id, kind: L.kind, ref: L.ref, channels: ch, nonzero: idx.length, ...(src ? { light: lightHash(src.light) } : {}), ...(L.kind === 'indirect' ? { weight: bake.indirectWeight ?? 1 } : {}) };
    let body;
    if (idx.length * (4 + 4 * ch) < bake.samples * 4 * ch) {
      const vals = new Float32Array(idx.length * ch);
      idx.forEach((s, i) => {
        for (let c = 0; c < ch; c++) vals[i * ch + c] = L.data[s * ch + c];
      });
      const at = push(Uint32Array.from(idx));
      push(vals);
      body = { encoding: 'sparse', count: idx.length, offset: at };
    } else body = { encoding: 'dense', count: bake.samples, offset: push(L.data) };
    // úseky s bránou: světlo, které na vzorek svítí otvorem portálu s dveřmi (D-035); vždy řídké
    const gates = (L.gates || []).map((g) => {
      const at = push(g.idx);
      push(g.e);
      return { gate: g.gate, count: g.idx.length, offset: at };
    });
    return { ...head, ...body, ...(gates.length ? { gates } : {}) };
  });
  const header = {
    format: 'xspace-light',
    version: 1,
    level: level.id,
    method: 'vertex',
    cell: bake.cell,
    samples: bake.samples,
    brushes: bake.brushes.map((b) => [b.id, b.count]),
    ...(bake.entities && bake.entities.some((e) => e.count) ? { entities: bake.entities.map((e) => [e.id, e.count]) } : {}),
    grid: GRID,
    geometry: geometryHash(level, bake.cell, materials, bake.entities && bake.entities.some((e) => e.count) ? prefabs : null),
    scene: sceneHash(level, prefabs),
    doors: (bake.doors || []).map((d) => d.id),
    layers,
  };
  let json = JSON.stringify(header);
  while (Buffer.byteLength(json) % 4) json += ' ';
  const head = Buffer.alloc(8);
  head.write(MAGIC, 0, 'latin1');
  head.writeUInt32LE(Buffer.byteLength(json), 4);
  return Buffer.concat([head, Buffer.from(json), ...chunks]);
}
