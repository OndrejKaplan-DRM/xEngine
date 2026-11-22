// xBake: soubor se zapečeným světlem (návrh N-001). Binární, little-endian:
//   4 bajty  značka „XLV1“
//   uint32   délka hlavičky v bajtech (zarovnaná na 4)
//   hlavička JSON v UTF-8, doplněná mezerami
//   data     pole Float32 a Uint32 za sebou; kde které leží, říká hlavička (offset od začátku dat, v bajtech)
// Vrstva „dense“: Float32[samples × channels]. Vrstva „sparse“: Uint32[count] indexy vzorků (vzestupně)
// a za nimi Float32[count × channels]; ostatní vzorky mají 0.

import { createHash } from 'node:crypto';

export const MAGIC = 'XLV1';
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

/** Otisk geometrie: tvary kvádrů v pořadí levelu a buňka mřížky. Když nesedí, vzorky neodpovídají a soubor neplatí. */
export const geometryHash = (level, cell) => sha([cell, level.brushes.map((b) => [b.shape || 'box', b.min, b.max, b.rise || ''])]);
/** Otisk světla: vše, z čeho se počítá E při plné úrovni (barva ne, tou násobí běh). */
export const lightHash = (l) => sha([l.type, l.pos || null, l.dir || null, l.intensity, l.range ?? null, l.angle ?? null]);
/** Otisk stínítek: entity a jejich prefaby. Když nesedí, vzorky platí, ale stíny mohou být jinde. */
export const sceneHash = (level, prefabs) => sha((level.entities || []).map((e) => [e.id, e.prefab, e.pos, e.rot || null, e.scale ?? 1, (prefabs.get(e.prefab) || {}).tris ?? null]));

/** Výsledek bakeLevel → Buffer. */
export function encodeBake(bake, level, prefabs) {
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
    const head = { id: L.id, kind: L.kind, ref: L.ref, channels: ch, nonzero: idx.length, ...(src ? { light: lightHash(src.light) } : {}) };
    if (idx.length * (4 + 4 * ch) < bake.samples * 4 * ch) {
      const vals = new Float32Array(idx.length * ch);
      idx.forEach((s, i) => {
        for (let c = 0; c < ch; c++) vals[i * ch + c] = L.data[s * ch + c];
      });
      const at = push(Uint32Array.from(idx));
      push(vals);
      return { ...head, encoding: 'sparse', count: idx.length, offset: at };
    }
    return { ...head, encoding: 'dense', count: bake.samples, offset: push(L.data) };
  });
  const header = {
    format: 'xspace-light',
    version: 1,
    level: level.id,
    method: 'vertex',
    cell: bake.cell,
    samples: bake.samples,
    brushes: bake.brushes.map((b) => [b.id, b.count]),
    geometry: geometryHash(level, bake.cell),
    scene: sceneHash(level, prefabs),
    layers,
  };
  let json = JSON.stringify(header);
  while (Buffer.byteLength(json) % 4) json += ' ';
  const head = Buffer.alloc(8);
  head.write(MAGIC, 0, 'latin1');
  head.writeUInt32LE(Buffer.byteLength(json), 4);
  return Buffer.concat([head, Buffer.from(json), ...chunks]);
}

/** Buffer → { header, layers: [{ …hlavička vrstvy, data: Float32Array[samples × channels] }] }. */
export function decodeBake(buf) {
  if (buf.toString('latin1', 0, 4) !== MAGIC) throw new Error('xBake: soubor nemá značku XLV1');
  const len = buf.readUInt32LE(4);
  const header = JSON.parse(buf.toString('utf8', 8, 8 + len));
  const base = 8 + len;
  const f32 = (at, n) => {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = buf.readFloatLE(base + at + i * 4);
    return out;
  };
  const layers = header.layers.map((L) => {
    if (L.encoding === 'dense') return { ...L, data: f32(L.offset, header.samples * L.channels) };
    const data = new Float32Array(header.samples * L.channels);
    const vals = f32(L.offset + L.count * 4, L.count * L.channels);
    for (let i = 0; i < L.count; i++) {
      const s = buf.readUInt32LE(base + L.offset + i * 4);
      for (let c = 0; c < L.channels; c++) data[s * L.channels + c] = vals[i * L.channels + c];
    }
    return { ...L, data };
  });
  return { header, layers };
}

/** Barva vzorků pro daný stav světel: okolní člen × přístupnost + Σ úroveň × barva × E + nepřímé světlo × úroveň základu. */
export function composeColors(decoded, lightsById, ambient = [0, 0, 0], levels = {}) {
  const n = decoded.header.samples;
  const out = new Float32Array(n * 3);
  const ao = decoded.layers.find((L) => L.kind === 'ao');
  for (let s = 0; s < n; s++) for (let c = 0; c < 3; c++) out[s * 3 + c] = ambient[c] * (ao ? ao.data[s] : 1);
  for (const L of decoded.layers) {
    if (L.kind === 'ao') continue;
    if (L.kind === 'indirect') {
      const k = levels.indirect ?? 1;
      for (let i = 0; i < n * 3; i++) out[i] += L.data[i] * k;
      continue;
    }
    const src = lightsById.get(L.id);
    const k = levels[L.id] ?? (src && src.base ? 1 : 0);
    if (!src || !k) continue;
    for (let s = 0; s < n; s++) {
      const e = L.data[s] * k;
      if (e) for (let c = 0; c < 3; c++) out[s * 3 + c] += e * src.color[c];
    }
  }
  return out;
}
