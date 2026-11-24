// Soubor textury světla `levels/<id>.lightmap.bin` (N-112, D-050; zkušební do zkoušky celého complex_7).
// Jediná implementace zápisu i čtení pro xBake (sešna B) a běh (sešna A). Čistý kód bez Node a knihoven.
// Na disku je soubor zabalený gzipem (Node: zlib, prohlížeč: DecompressionStream); tyto funkce pracují
// s rozbaleným obsahem. Ukládá jen přímé světlo (osvětlení E při plné úrovni světla, bez barvy); okolní člen,
// odraz a body mimo atlas zůstávají po vrcholech v `levels/<id>.light.bin` (D-044).
//
// Obsah (little-endian):
//   4 bajty  značka „XLM1“
//   uint32   délka hlavičky v bajtech (zarovnaná na 4)
//   hlavička JSON v UTF-8, doplněná mezerami:
//            { version, texel, width, height, atlas, texels, covered: { offset, bytes },
//              layers: [{ kind: 'light' | 'entity', id, count, offset, bytes, gates: [{ gate, count, offset, bytes }] }] }
//   data     covered = indexy k bodů na ploše vzestupně, varint rozdílů (první absolutně);
//            úsek vrstvy = pořadí bodů v seznamu covered vzestupně (varint rozdílů), zarovnání na 2,
//            potom Uint16 half float E[count]. Offsety jsou od začátku dat, v bajtech.
// Úsek bez brány je část vrstvy; úseky s bránou mají `gate` = seznam id dveří (svítí součinem jejich otevření).

export const LIGHTMAP_MAGIC = 'XLM1';

// ---- half float (IEEE 754 binary16), zaokrouhlení k nejbližšímu --------------------------------------

const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);

/** Číslo → half float (Uint16). Nad 65 504 strop, záporné nuly a NaN se nepoužívají. */
export function toHalf(v) {
  f32[0] = v;
  const x = u32[0];
  const sign = (x >>> 16) & 0x8000;
  const e = (x >>> 23) & 0xff;
  let m = x & 0x7fffff;
  if (e === 0xff) return sign | 0x7bff;
  let he = e - 127 + 15;
  if (he >= 31) return sign | 0x7bff;
  if (he <= 0) {
    if (he < -10) return sign;
    m |= 0x800000;
    const shift = 14 - he;
    let hm = m >>> shift;
    if ((m >>> (shift - 1)) & 1) hm++;
    return sign | hm;
  }
  let hm = m >>> 13;
  if (m & 0x1000) {
    hm++;
    if (hm === 0x400) {
      hm = 0;
      he++;
      if (he >= 31) return sign | 0x7bff;
    }
  }
  return sign | (he << 10) | hm;
}

/** Half float (Uint16) → číslo. */
export function fromHalf(h) {
  const s = h & 0x8000 ? -1 : 1;
  const e = (h >>> 10) & 0x1f;
  const m = h & 0x3ff;
  if (e === 0) return s * m * 2 ** -24;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
}

// ---- varint ---------------------------------------------------------------------------------------

function putVarint(out, v) {
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
}

function deltas(list) {
  const out = [];
  let prev = 0;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (i && v <= prev) throw new Error('textura světla: indexy mají být vzestupně bez opakování');
    putVarint(out, i ? v - prev : v);
    prev = v;
  }
  return out;
}

function readDeltas(u8, at, count) {
  const out = new Uint32Array(count);
  let p = at;
  let prev = 0;
  for (let i = 0; i < count; i++) {
    let v = 0;
    let mul = 1;
    for (;;) {
      const b = u8[p++];
      v += (b & 0x7f) * mul;
      if (b < 0x80) break;
      mul *= 128;
    }
    prev = i ? prev + v : v;
    out[i] = prev;
  }
  return out;
}

// ---- zápis a čtení --------------------------------------------------------------------------------

/**
 * Zapíše obsah souboru (bez gzipu).
 * @param d { texel, width, height, atlas (otisk lightmapLayout.hash), index: Uint32Array k vzestupně,
 *          layers: [{ kind, id, idx: pořadí v index vzestupně, e: E, gates: [{ gate: [id dveří], idx, e }] }] }
 * @returns Uint8Array
 */
export function encodeLightmap(d) {
  const bytes = [];
  const align = (n) => {
    while (bytes.length % n) bytes.push(0);
  };
  const seg = (idx, e) => {
    if (idx.length !== e.length) throw new Error('textura světla: úsek má jiný počet indexů a hodnot');
    const offset = bytes.length;
    const dl = deltas(idx);
    for (const b of dl) bytes.push(b);
    align(2);
    for (let i = 0; i < e.length; i++) {
      const h = toHalf(e[i]);
      bytes.push(h & 0xff, h >>> 8);
    }
    return { count: idx.length, offset, bytes: bytes.length - offset };
  };
  const cov = deltas(d.index);
  for (const b of cov) bytes.push(b);
  const covered = { offset: 0, bytes: cov.length };
  align(2);
  const layers = (d.layers || []).map((L) => ({
    kind: L.kind,
    id: L.id,
    ...seg(L.idx || [], L.e || []),
    gates: (L.gates || []).map((g) => ({ gate: g.gate, ...seg(g.idx, g.e) })),
  }));
  const header = { version: 1, texel: d.texel, width: d.width, height: d.height, atlas: d.atlas, texels: d.index.length, covered, layers };
  let json = JSON.stringify(header);
  while ((json.length + 8) % 4) json += ' ';
  const head = new TextEncoder().encode(json);
  const out = new Uint8Array(8 + head.length + bytes.length);
  for (let i = 0; i < 4; i++) out[i] = LIGHTMAP_MAGIC.charCodeAt(i);
  new DataView(out.buffer).setUint32(4, head.length, true);
  out.set(head, 8);
  out.set(bytes, 8 + head.length);
  return out;
}

/** Rozbalený obsah → { header, index, layers: [{ …hlavička, idx, e: Float32Array, gates: [{ gate, idx, e }] }] }. */
export function decodeLightmap(input) {
  const u8 = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  if (u8[0] === 0x1f && u8[1] === 0x8b) throw new Error('textura světla: soubor je zabalený gzipem; nejdřív ho rozbal');
  if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== LIGHTMAP_MAGIC) throw new Error('textura světla: soubor nemá značku XLM1');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const len = dv.getUint32(4, true);
  const header = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + len)));
  const base = 8 + len;
  const index = readDeltas(u8, base + header.covered.offset, header.texels);
  const seg = (s) => {
    const idx = readDeltas(u8, base + s.offset, s.count);
    let p = s.offset;
    for (let i = 0; i < s.count; i++) while (u8[base + p++] >= 0x80);
    if (p % 2) p++;
    const e = new Float32Array(s.count);
    for (let i = 0; i < s.count; i++) e[i] = fromHalf(dv.getUint16(base + p + i * 2, true));
    return { idx, e };
  };
  const layers = header.layers.map((L) => ({ ...L, ...seg(L), gates: (L.gates || []).map((g) => ({ gate: g.gate, ...seg(g) })) }));
  return { header, index, layers };
}

/**
 * Přímé osvětlení E (RGB) bodů na ploše pro daný stav světel a dveří; pořadí jako `index`.
 * Σ úroveň × barva × (E bez brány + Σ otevření brány × E úseku). Okolní člen a odraz sem nepatří (po vrcholech).
 * @param lightsById Map id vrstvy → { color, base }; levels { id: úroveň 0–1 } (bez údaje svítí jen základní světla)
 * @param doors { id dveří: otevření 0–1 } (bez údaje zavřeno); out volitelně Float32Array(3 × texels)
 */
export function composeLightmap(decoded, lightsById, levels = {}, doors = {}, out = null) {
  const n = decoded.header.texels;
  const rgb = out || new Float32Array(n * 3);
  rgb.fill(0);
  for (const L of decoded.layers) {
    const src = lightsById.get(L.id);
    const k = levels[L.id] ?? (src && src.base ? 1 : 0);
    if (!src || !k) continue;
    const add = (idx, e, kk) => {
      for (let i = 0; i < idx.length; i++) {
        const o = idx[i] * 3;
        const v = e[i] * kk;
        rgb[o] += v * src.color[0];
        rgb[o + 1] += v * src.color[1];
        rgb[o + 2] += v * src.color[2];
      }
    };
    add(L.idx, L.e, k);
    for (const g of L.gates || []) {
      const kg = k * g.gate.reduce((m, id) => m * (doors[id] ?? 0), 1);
      if (kg) add(g.idx, g.e, kg);
    }
  }
  return rgb;
}
