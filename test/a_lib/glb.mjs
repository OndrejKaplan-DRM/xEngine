// Zkušební modely .glb pro testy A2.6, vyrobené kódem (bez Blenderu): binární glTF 2.0 s uzly, sítěmi a
// transformacemi. Uzel: { name, mesh?: { positions, normals?, uvs?, indices }, translation?, rotation?, scale?,
// matrix?, children?: [index], color?: [r, g, b] }. Vrací Uint8Array.

const pad4 = (n) => (n + 3) & ~3;

export function makeGlb(nodes, { roots = null } = {}) {
  const bin = [];
  let offset = 0;
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const materials = [];
  const push = (typed, target, type, componentType, minmax = false) => {
    const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
    bin.push({ offset, bytes });
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    offset = pad4(offset + bytes.byteLength);
    const n = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type];
    const acc = { bufferView: bufferViews.length - 1, componentType, count: typed.length / n, type };
    if (minmax) {
      acc.min = [Infinity, Infinity, Infinity];
      acc.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < typed.length; i++) {
        acc.min[i % 3] = Math.min(acc.min[i % 3], typed[i]);
        acc.max[i % 3] = Math.max(acc.max[i % 3], typed[i]);
      }
    }
    accessors.push(acc);
    return accessors.length - 1;
  };
  const jsonNodes = nodes.map((n) => {
    const out = { name: n.name };
    for (const k of ['translation', 'rotation', 'scale', 'matrix', 'children']) if (n[k]) out[k] = n[k];
    if (n.mesh) {
      const attributes = { POSITION: push(new Float32Array(n.mesh.positions), 34962, 'VEC3', 5126, true) };
      if (n.mesh.normals) attributes.NORMAL = push(new Float32Array(n.mesh.normals), 34962, 'VEC3', 5126);
      if (n.mesh.uvs) attributes.TEXCOORD_0 = push(new Float32Array(n.mesh.uvs), 34962, 'VEC2', 5126);
      const indices = push(new Uint16Array(n.mesh.indices), 34963, 'SCALAR', 5123);
      const prim = { attributes, indices, mode: 4 };
      if (n.color) {
        materials.push({ pbrMetallicRoughness: { baseColorFactor: [...n.color, 1] } });
        prim.material = materials.length - 1;
      }
      meshes.push({ primitives: [prim] });
      out.mesh = meshes.length - 1;
    }
    return out;
  });
  const children = new Set(nodes.flatMap((n) => n.children || []));
  const json = {
    asset: { version: '2.0', generator: 'xEngine test/a_lib/glb.mjs' },
    scene: 0,
    scenes: [{ nodes: roots || nodes.map((_, i) => i).filter((i) => !children.has(i)) }],
    nodes: jsonNodes,
    meshes,
    accessors,
    bufferViews,
    buffers: [{ byteLength: offset }],
    ...(materials.length ? { materials } : {}),
  };
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonLen = pad4(jsonBytes.length);
  const binLen = pad4(offset);
  const total = 12 + 8 + jsonLen + 8 + binLen;
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  v.setUint32(0, 0x46546c67, true);
  v.setUint32(4, 2, true);
  v.setUint32(8, total, true);
  v.setUint32(12, jsonLen, true);
  v.setUint32(16, 0x4e4f534a, true);
  out.set(jsonBytes, 20);
  for (let i = jsonBytes.length; i < jsonLen; i++) out[20 + i] = 0x20; // výplň JSON mezerami (specifikace)
  const b0 = 20 + jsonLen;
  v.setUint32(b0, binLen, true);
  v.setUint32(b0 + 4, 0x004e4942, true);
  for (const { offset: o, bytes } of bin) out.set(bytes, b0 + 8 + o);
  return out;
}

/** Kvádr min–max jako síť glTF: 24 vrcholů, normály po stěnách, UV 0..1 na každé stěně (v = 0 nahoře, úmluva glTF). */
export function boxMesh(min, max) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const faces = [
    [[1, 0, 0], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]],
    [[-1, 0, 0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
    [[0, 1, 0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]],
    [[0, -1, 0], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
    [[0, 0, 1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[0, 0, -1], [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]],
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  for (const [n, ...corners] of faces) {
    const b = positions.length / 3;
    corners.forEach((c, i) => {
      positions.push(...c);
      normals.push(...n);
      uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 0 : 1);
    });
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  return { positions, normals, uvs, indices };
}
