// xWorld: geometrie z binárního glTF (.glb) pro díly prefabů a kolize (A2.6, D-030). Jen to, co engine z modelu
// potřebuje: polohy, normály, UV, indexy, transformace uzlů. Materiály, obrázky, animace a kostry se tu nečtou.
// Bez knihovny a bez DOM: totéž běží ve hře, v Node i v nástrojích.
//
// Úmluvy (kontrakt, oddíl formáty souborů): +Y nahoru, metry; uzly COL_* jsou kolize, *_LOD1 nižší detail.
// Geometrie uzlu se vrací v souřadnicích kořene modelu (se všemi transformacemi uzlů po cestě). UV se převrací na
// úmluvu WebGL (v = 0 dole): glTF má v = 0 nahoře.

const MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const READERS = {
  5120: (v, o) => v.getInt8(o),
  5121: (v, o) => v.getUint8(o),
  5122: (v, o) => v.getInt16(o, true),
  5123: (v, o) => v.getUint16(o, true),
  5125: (v, o) => v.getUint32(o, true),
  5126: (v, o) => v.getFloat32(o, true),
};
const SIZES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

/** Rozloží .glb na JSON a binární blok. Hází, když soubor není glTF 2.0. */
export function parseGlb(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.byteLength < 20 || v.getUint32(0, true) !== MAGIC) throw new Error('Soubor není binární glTF (.glb).');
  if (v.getUint32(4, true) !== 2) throw new Error(`glTF verze ${v.getUint32(4, true)}; umím jen 2.`);
  let json = null;
  let bin = null;
  for (let o = 12; o + 8 <= u8.byteLength; ) {
    const len = v.getUint32(o, true);
    const type = v.getUint32(o + 4, true);
    const body = u8.subarray(o + 8, o + 8 + len);
    if (type === CHUNK_JSON) json = JSON.parse(new TextDecoder().decode(body));
    else if (type === CHUNK_BIN) bin = body;
    o += 8 + len;
  }
  if (!json) throw new Error('V .glb chybí blok JSON.');
  return { json, bin };
}

function readAccessor(gltf, index) {
  const { json, bin } = gltf;
  const a = json.accessors[index];
  if (a.sparse) throw new Error('Řídké přístupy glTF (sparse) neumím.');
  const n = COMPONENTS[a.type];
  const out = new Array(a.count * n);
  if (a.bufferView === undefined) return out.fill(0);
  const bv = json.bufferViews[a.bufferView];
  if ((bv.buffer ?? 0) !== 0 || !bin) throw new Error('Data glTF mimo blok BIN (externí soubory) neumím.');
  const size = SIZES[a.componentType];
  const read = READERS[a.componentType];
  if (!read) throw new Error(`Typ složky glTF ${a.componentType} neumím.`);
  const stride = bv.byteStride || size * n;
  const view = new DataView(bin.buffer, bin.byteOffset + (bv.byteOffset || 0), bv.byteLength);
  const start = a.byteOffset || 0;
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = read(view, start + i * stride + k * size);
  return out;
}

/** Matice uzlu (sloupcové pořadí jako three.js) z matrix nebo TRS. */
function localMatrix(node) {
  if (node.matrix) return node.matrix.slice();
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  return [(1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0, (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0, (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0, tx, ty, tz, 1];
}
function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}

/** Světové matice všech uzlů výchozí scény (souřadnice kořene modelu) a rodič každého uzlu. */
function nodeMatrices(json) {
  const world = new Array(json.nodes?.length || 0).fill(null);
  const parent = new Array(world.length).fill(-1);
  const walk = (i, m) => {
    world[i] = mul(m, localMatrix(json.nodes[i]));
    for (const c of json.nodes[i].children || []) {
      parent[c] = i;
      walk(c, world[i]);
    }
  };
  const scene = json.scenes?.[json.scene ?? 0];
  const roots = scene ? scene.nodes : world.map((_, i) => i).filter((i) => !json.nodes.some((n) => (n.children || []).includes(i)));
  for (const r of roots) walk(r, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  return { world, parent };
}

const isCollision = (name) => /^COL_/.test(name || '');
const isLod = (name) => /_LOD\d+$/.test(name || '');

/**
 * Geometrie modelu jako jedna síť { positions, normals, uvs, indices } (prostá pole, tvar jako geom.js).
 * nodeName: jen tenhle uzel a jeho potomci; bez něj celý model. Uzly COL_* a *_LODn se do viditelné sítě
 * nepočítají, ledaže jsou výslovně vybrané. Vrací null, když uzel neexistuje nebo nemá žádnou síť.
 */
export function glbGeometry(gltf, nodeName = null) {
  const { json } = gltf;
  const nodes = json.nodes || [];
  const { world, parent } = nodeMatrices(json);
  let pick = null;
  if (nodeName) {
    pick = nodes.findIndex((n) => n.name === nodeName);
    if (pick < 0) return null;
  }
  const under = (i) => {
    for (let k = i; k >= 0; k = parent[k]) if (k === pick) return true;
    return false;
  };
  const out = { positions: [], normals: [], uvs: [], indices: [] };
  nodes.forEach((node, i) => {
    if (node.mesh === undefined || !world[i]) return;
    if (pick !== null ? !under(i) : isCollision(node.name) || isLod(node.name)) return;
    if (pick !== null && i !== pick && (isCollision(node.name) || isLod(node.name))) return;
    const M = world[i];
    for (const prim of json.meshes[node.mesh].primitives) {
      if ((prim.mode ?? 4) !== 4) continue; // jen trojúhelníky
      const P = readAccessor(gltf, prim.attributes.POSITION);
      const N = prim.attributes.NORMAL !== undefined ? readAccessor(gltf, prim.attributes.NORMAL) : null;
      const T = prim.attributes.TEXCOORD_0 !== undefined ? readAccessor(gltf, prim.attributes.TEXCOORD_0) : null;
      const count = P.length / 3;
      const I = prim.indices !== undefined ? readAccessor(gltf, prim.indices) : Array.from({ length: count }, (_, k) => k);
      const base = out.positions.length / 3;
      // normály: inverzní transpozice horní 3×3; při rovnoměrném měřítku stačí tatáž matice a normalizace
      for (let v = 0; v < count; v++) {
        const x = P[v * 3];
        const y = P[v * 3 + 1];
        const z = P[v * 3 + 2];
        out.positions.push(M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]);
        if (N) {
          const a = N[v * 3];
          const b = N[v * 3 + 1];
          const c = N[v * 3 + 2];
          const nx = M[0] * a + M[4] * b + M[8] * c;
          const ny = M[1] * a + M[5] * b + M[9] * c;
          const nz = M[2] * a + M[6] * b + M[10] * c;
          const l = Math.hypot(nx, ny, nz) || 1;
          out.normals.push(nx / l, ny / l, nz / l);
        } else out.normals.push(0, 0, 0);
        out.uvs.push(T ? T[v * 2] : 0, T ? 1 - T[v * 2 + 1] : 0);
      }
      // determinant záporný = zrcadlení: otočit pořadí vrcholů, aby líc zůstal lícem
      const det = M[0] * (M[5] * M[10] - M[9] * M[6]) - M[4] * (M[1] * M[10] - M[9] * M[2]) + M[8] * (M[1] * M[6] - M[5] * M[2]);
      for (let k = 0; k < I.length; k += 3) {
        if (det < 0) out.indices.push(base + I[k], base + I[k + 2], base + I[k + 1]);
        else out.indices.push(base + I[k], base + I[k + 1], base + I[k + 2]);
      }
      if (!N) fillFlatNormals(out, base);
    }
  });
  return out.indices.length ? out : null;
}

/** Model bez normál: normála trojúhelníku do jeho vrcholů (průměr, kde se vrchol sdílí). */
function fillFlatNormals(out, base) {
  const P = out.positions;
  const N = out.normals;
  for (let k = 0; k < out.indices.length; k += 3) {
    const [a, b, c] = [out.indices[k], out.indices[k + 1], out.indices[k + 2]];
    if (a < base) continue;
    const ux = P[b * 3] - P[a * 3];
    const uy = P[b * 3 + 1] - P[a * 3 + 1];
    const uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3];
    const vy = P[c * 3 + 1] - P[a * 3 + 1];
    const vz = P[c * 3 + 2] - P[a * 3 + 2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    for (const i of [a, b, c]) for (let q = 0; q < 3; q++) N[i * 3 + q] += n[q];
  }
  for (let i = base * 3; i < N.length; i += 3) {
    const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1;
    N[i] /= l;
    N[i + 1] /= l;
    N[i + 2] /= l;
  }
}

/** Základní barva prvního materiálu sítě uzlu (baseColorFactor, lineární RGB), nebo null. */
export function glbBaseColor(gltf, nodeName = null) {
  const { json } = gltf;
  const nodes = json.nodes || [];
  const node = nodeName ? nodes.find((n) => n.name === nodeName) : nodes.find((n) => n.mesh !== undefined && !isCollision(n.name) && !isLod(n.name));
  if (!node || node.mesh === undefined) return null;
  const mi = json.meshes[node.mesh].primitives[0]?.material;
  const f = mi !== undefined ? json.materials?.[mi]?.pbrMetallicRoughness?.baseColorFactor : null;
  return f ? [f[0], f[1], f[2]] : null;
}
