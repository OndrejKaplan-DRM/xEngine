// xForge, sítě: zápis binárního glTF 2.0 (.glb) s pojmenovanými uzly. Díl prefabu odkazuje na uzel
// „soubor.glb#jméno“ (formát xSpace, díl mesh); engine A ho čte v src/world/glb.js. Zapisuje se jen to, co engine
// čte: POSITION (s min a max podle specifikace), NORMAL, TEXCOORD_0, indexy. Bez materiálů: materiál nese díl.
// Výstup je stejný bajt po bajtu pro stejný vstup (čísla zaokrouhlená na 0,01 mm a 1/10 000 normály).

const q = (v, s) => Math.round(v * s) / s;

/**
 * @param list [{ name, geom }] v pořadí, v jakém se zapíší
 * @returns Uint8Array
 */
export function writeGlb(list) {
  const json = { asset: { version: '2.0', generator: 'xForge (xEngine, sešna B)' }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], accessors: [], bufferViews: [], buffers: [] };
  const chunks = [];
  let offset = 0;
  const view = (bytes, target) => {
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      chunks.push(new Uint8Array(pad));
      offset += pad;
    }
    json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    chunks.push(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    offset += bytes.byteLength;
    return json.bufferViews.length - 1;
  };
  const names = new Set();
  for (const { name, geom } of list) {
    if (names.has(name)) throw new Error(`glb: uzel „${name}“ je v souboru dvakrát`);
    names.add(name);
    const n = geom.positions.length / 3;
    const pos = new Float32Array(geom.positions.map((v) => q(v, 1e5)));
    const nor = new Float32Array(geom.normals.map((v) => q(v, 1e4)));
    const uv = new Float32Array(geom.uvs.map((v, i) => (i % 2 ? 1 - q(v, 1e4) : q(v, 1e4)))); // glTF: v = 0 nahoře
    const idx = n > 65535 ? new Uint32Array(geom.indices) : new Uint16Array(geom.indices);
    const min = [0, 1, 2].map((k) => Math.min(...Array.from({ length: n }, (_, i) => pos[i * 3 + k])));
    const max = [0, 1, 2].map((k) => Math.max(...Array.from({ length: n }, (_, i) => pos[i * 3 + k])));
    const acc = (bufferView, componentType, count, type, extra = {}) => {
      json.accessors.push({ bufferView, componentType, count, type, ...extra });
      return json.accessors.length - 1;
    };
    const aPos = acc(view(pos, 34962), 5126, n, 'VEC3', { min: min.map((v) => Math.fround(v)), max: max.map((v) => Math.fround(v)) });
    const aNor = acc(view(nor, 34962), 5126, n, 'VEC3');
    const aUv = acc(view(uv, 34962), 5126, n, 'VEC2');
    const aIdx = acc(view(idx, 34963), n > 65535 ? 5125 : 5123, idx.length, 'SCALAR');
    json.meshes.push({ name, primitives: [{ attributes: { POSITION: aPos, NORMAL: aNor, TEXCOORD_0: aUv }, indices: aIdx, mode: 4 }] });
    json.nodes.push({ name, mesh: json.meshes.length - 1 });
    json.scenes[0].nodes.push(json.nodes.length - 1);
  }
  const binLen = offset + ((4 - (offset % 4)) % 4);
  json.buffers.push({ byteLength: binLen });
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonLen = jsonBytes.length + ((4 - (jsonBytes.length % 4)) % 4);
  const total = 12 + 8 + jsonLen + 8 + binLen;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonLen, true);
  dv.setUint32(16, 0x4e4f534a, true);
  out.set(jsonBytes, 20);
  for (let i = 20 + jsonBytes.length; i < 20 + jsonLen; i++) out[i] = 0x20; // výplň JSON mezerami
  let o = 20 + jsonLen;
  dv.setUint32(o, binLen, true);
  dv.setUint32(o + 4, 0x004e4942, true);
  o += 8;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  return out;
}
