// Zapečené světlo: čtení souboru `levels/<id>.light.bin` a složení barev vzorků (N-001, D-035, D-044).
// Jediná implementace čtení pro běh i nástroje. Převzato z `tools/bake/read.mjs` sešny B (`8be5b71`);
// zápis a otisky zůstávají v xBake. Čistý kód bez Node a bez knihoven: běží v prohlížeči i v Node.
//
// Soubor (little-endian):
//   4 bajty  značka „XLV1“
//   uint32   délka hlavičky v bajtech (zarovnaná na 4)
//   hlavička JSON v UTF-8, doplněná mezerami
//   data     pole Float32 a Uint32 za sebou; kde které leží, říká hlavička (offset od začátku dat, v bajtech)
// Vrstva „dense“: Float32[samples × channels]. Vrstva „sparse“: Uint32[count] indexy vzorků (vzestupně)
// a za nimi Float32[count × channels]; ostatní vzorky mají 0. To je část vrstvy bez brány.
// Úseky s bránou má vrstva v poli gates: [{ gate: [id entity dveří…], count, offset }], vždy řídké se stejnou
// stavbou. Světlo úseku se za běhu násobí součinem otevření jeho dveří (0 zavřeno, 1 otevřeno).
// Pořadí vzorků určuje `levelSamples` (samples.js): kvádry, potom pevné díly prefabů (D-041).

export const MAGIC = 'XLV1';

/** Buffer, Uint8Array nebo ArrayBuffer → { header, layers: [{ …hlavička, data: Float32Array, gates: [{ gate, idx, e }] }] }. */
export function decodeBake(input) {
  const u8 = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== MAGIC) throw new Error('xBake: soubor nemá značku XLV1');
  const len = dv.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + len)));
  const base = 8 + len;
  const f32 = (at, n) => {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = dv.getFloat32(base + at + i * 4, true);
    return out;
  };
  const u32 = (at, n) => {
    const out = new Uint32Array(n);
    for (let i = 0; i < n; i++) out[i] = dv.getUint32(base + at + i * 4, true);
    return out;
  };
  const layers = header.layers.map((L) => {
    const ch = L.channels;
    let data;
    if (L.encoding === 'dense') data = f32(L.offset, header.samples * ch);
    else {
      data = new Float32Array(header.samples * ch);
      const idx = u32(L.offset, L.count);
      const vals = f32(L.offset + L.count * 4, L.count * ch);
      for (let i = 0; i < L.count; i++) for (let c = 0; c < ch; c++) data[idx[i] * ch + c] = vals[i * ch + c];
    }
    const gates = (L.gates || []).map((g) => ({ gate: g.gate, idx: u32(g.offset, g.count), e: f32(g.offset + g.count * 4, g.count * ch) }));
    return { ...L, data, gates };
  });
  return { header, layers };
}

/** Úroveň brány: součin otevření jejích dveří. doors = { id entity: otevření 0 až 1 }; dveře bez údaje jsou zavřené. */
export const gateLevel = (gate, doors = {}) => gate.reduce((k, id) => k * (doors[id] ?? 0), 1);

/**
 * Osvětlení E vzorků (RGB) pro daný stav světel a dveří; jas = barva materiálu / π × výsledek (D-049, kontrakt Světlo).
 * Složení:
 * okolní člen × přístupnost + Σ úroveň × barva × (E bez brány + Σ otevření brány × E úseku) + nepřímé světlo × váha.
 * @param decoded výsledek decodeBake (nebo vrstvy z bakeLevel se stejnými poli)
 * @param lightsById Map id vrstvy → { color, base }
 * @param levels { id vrstvy: úroveň 0 až 1, indirect: váha } (bez údaje svítí základní světla naplno)
 * @param doors { id entity dveří: otevření 0 až 1 } (bez údaje zavřeno)
 */
export function composeColors(decoded, lightsById, ambient = [0, 0, 0], levels = {}, doors = {}) {
  const n = decoded.header.samples;
  const out = new Float32Array(n * 3);
  const ao = decoded.layers.find((L) => L.kind === 'ao');
  for (let s = 0; s < n; s++) for (let c = 0; c < 3; c++) out[s * 3 + c] = ambient[c] * (ao ? ao.data[s] : 1);
  for (const L of decoded.layers) {
    if (L.kind === 'ao') continue;
    if (L.kind === 'indirect') {
      const k = levels.indirect ?? L.weight ?? 1;
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
    for (const g of L.gates || []) {
      const kg = k * gateLevel(g.gate, doors);
      if (!kg) continue;
      for (let i = 0; i < g.idx.length; i++) for (let c = 0; c < 3; c++) out[g.idx[i] * 3 + c] += g.e[i] * kg * src.color[c];
    }
  }
  return out;
}

/**
 * Otevření dveří pro brány světla (D-042): |hodnota − rest| / největší vzdálenost dorazu od rest, 0 až 1.
 * Platí pro jednostranné dveře (rest na kraji rozsahu) i pro dveře na obě strany (rest uvnitř).
 * @param joint kloub z rig.joints ({ min, max, rest? }); rest chybí → min
 */
export function doorOpenness(joint, value) {
  const rest = joint.rest ?? joint.min;
  const span = Math.max(Math.abs(joint.max - rest), Math.abs(joint.min - rest));
  if (!(span > 0)) return 0;
  return Math.min(1, Math.abs(value - rest) / span);
}
