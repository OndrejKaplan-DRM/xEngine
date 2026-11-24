// Zkušební zapečený soubor (formát XLV1, N-001, D-044) vyrobený z vrstev, které spočítal běh. Slouží zkoušce, že běh
// soubor přečte a vzorky přiřadí vrcholům správně: barvy ze souboru se musí shodovat s barvami spočítanými při načtení.
// xBake sešny B dělá totéž svými paprsky; tady jde o čtení a pořadí vzorků (levelSamples, D-041), ne o paprsky.

import { mapSamples, bakeId } from '../../src/world/baked.js';
import { MAGIC } from '../../src/xspace/bake.js';

/** Pole vzorků z vrstev běhu: { id → { data: Float32Array(N), gates: Map(klíč dveří → { gate, e: Map(s → E) }) } }. */
export function runtimeLayers(game) {
  const targets = game.render.statics;
  const N = game.entities.samples.total;
  const map = mapSamples(targets, N);
  // vrchol dávky → vzorek, jen u prvního výskytu vzorku (plocha ve dvou buňkách nesmí přispět dvakrát)
  const canon = targets.map((T) => (T.colors ? new Int32Array(T.count).fill(-1) : null));
  for (let s = 0; s < N; s++) if (map.start[s + 1] > map.start[s]) canon[map.t[map.start[s]]][map.v[map.start[s]]] = s;
  const gates = game.occlusion.inspect(['gates']);
  const out = new Map();
  for (const L of game.light.lights) {
    const rec = { data: new Float32Array(N), gates: new Map() };
    for (const seg of L.layer.segs) {
      const c = canon[seg.t];
      if (!c) continue;
      for (let i = 0; i < seg.idx.length; i++) {
        const s = c[seg.idx[i]];
        if (s < 0) continue;
        if (seg.gate === 0) rec.data[s] += seg.e[i];
        else {
          const doors = gates[seg.gate].doors;
          const key = doors.join(',');
          if (!rec.gates.has(key)) rec.gates.set(key, { gate: doors, e: new Map() });
          const g = rec.gates.get(key).e;
          g.set(s, (g.get(s) || 0) + seg.e[i]);
        }
      }
    }
    out.set(bakeId(L), { kind: L.fixed ? 'light' : 'entity', ref: L.id, ...rec });
  }
  return out;
}

/** Soubor XLV1. extra = { ao: číslo pro všechny vzorky, indirect: [r, g, b] pro všechny, weight, brushOnly }. */
export function encodeBake(game, layers, extra = {}) {
  const N = extra.brushOnly ? game.world.stat.brushSamples : game.entities.samples.total;
  const chunks = [];
  let offset = 0;
  const push = (typed) => {
    const at = offset;
    chunks.push(new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength));
    offset += typed.byteLength;
    return at;
  };
  const sparse = (pairs) => {
    const idx = Uint32Array.from(pairs.map((p) => p[0]));
    const at = push(idx);
    push(Float32Array.from(pairs.map((p) => p[1])));
    return { count: idx.length, offset: at };
  };
  const head = [];
  for (const [id, L] of layers) {
    const pairs = [];
    for (let s = 0; s < N; s++) if (L.data[s] > 0) pairs.push([s, L.data[s]]);
    const body = sparse(pairs);
    const gates = [...L.gates.values()].map((g) => ({ gate: g.gate, ...sparse([...g.e].filter(([s]) => s < N).sort((a, b) => a[0] - b[0])) }));
    head.push({ id, kind: L.kind, ref: L.ref, channels: 1, encoding: 'sparse', ...body, gates });
  }
  if (extra.ao !== undefined) head.push({ id: 'ao', kind: 'ao', ref: '', channels: 1, encoding: 'dense', count: N, offset: push(new Float32Array(N).fill(extra.ao)), gates: [] });
  if (extra.indirect) {
    const d = new Float32Array(N * 3);
    for (let s = 0; s < N; s++) d.set(extra.indirect, s * 3);
    head.push({ id: 'indirect', kind: 'indirect', ref: '', channels: 3, encoding: 'dense', count: N, offset: push(d), gates: [], weight: extra.weight ?? 1 });
  }
  const header = { xspace: 1, kind: 'lightbake', samples: N, cell: game.world.stat.lightCell, brushes: game.world.stat.brushCounts, ...(extra.brushOnly ? {} : { entities: game.entities.samples.counts }), layers: head };
  let json = JSON.stringify(header);
  while ((json.length + 8) % 4) json += ' ';
  const hb = new TextEncoder().encode(json);
  const out = new Uint8Array(8 + hb.length + offset);
  out.set(new TextEncoder().encode(MAGIC), 0);
  new DataView(out.buffer).setUint32(4, hb.length, true);
  out.set(hb, 8);
  let at = 8 + hb.length;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}
