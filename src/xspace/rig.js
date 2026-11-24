// Kostra prefabu: jediná implementace toho, jak se z uzlů, kloubů a umístění entity počítají matice.
// Používá ji engine, zapékání světla i prohlížeč levelů, aby se dveře otevíraly všude stejně.
// Čisté funkce bez knihoven. Matice 4×4 jsou pole 16 čísel po sloupcích (jako WebGL a three.js).
// Natočení: stupně, pořadí YXZ (nejdřív kolem Z, pak X, pak Y; shodné s Euler 'YXZ' v three.js).

const RAD = Math.PI / 180;

export function mat4Identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** a · b (nejdřív se uplatní b, pak a). */
export function mat4Mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

export function mat4Translate(v) {
  const m = mat4Identity();
  m[12] = v[0];
  m[13] = v[1];
  m[14] = v[2];
  return m;
}

/** Otočení kolem jednotkové osy o úhel ve stupních (pravotočivě). */
export function mat4AxisAngle(axis, deg) {
  const [x, y, z] = axis;
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  const t = 1 - c;
  return [t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0, t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0, t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0, 0, 0, 0, 1];
}

/** Natočení [rx, ry, rz] ve stupních, pořadí YXZ: R = Ry · Rx · Rz. */
export function mat4Euler(rot = [0, 0, 0]) {
  return mat4Mul(mat4AxisAngle([0, 1, 0], rot[1]), mat4Mul(mat4AxisAngle([1, 0, 0], rot[0]), mat4AxisAngle([0, 0, 1], rot[2])));
}

export function mat4Scale(s) {
  const m = mat4Identity();
  m[0] = m[5] = m[10] = s;
  return m;
}

/** Bod [x, y, z] převedený maticí. */
export function mat4Point(m, p) {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}

/** Matice umístění entity: posun · natočení · měřítko. */
export function entityMatrix(e) {
  return mat4Mul(mat4Translate(e.pos), mat4Mul(mat4Euler(e.rot), mat4Scale(e.scale ?? 1)));
}

/** Klidové hodnoty kloubů: { idKloubu: hodnota }. */
export function jointRest(prefab) {
  const out = {};
  for (const j of prefab.rig.joints || []) out[j.id] = j.rest ?? j.min;
  return out;
}

/** Hodnota kloubu omezená na jeho meze. */
export function jointClamp(joint, value) {
  return Math.min(joint.max, Math.max(joint.min, value));
}

/**
 * Svázané klouby (N-002): hodnoty kloubů s `follow` dopočítané ze sledovaných kloubů, oříznuté na jejich meze.
 * Vrací nový objekt { idKloubu: hodnota }; ostatní hodnoty (chybějící = klidová poloha) převezme beze změny.
 * Řetěz sledování se řeší do hloubky; kruh validátor nepustí (rig.followCycle), tady se jen nezacyklí.
 */
export function jointFollow(prefab, values = {}) {
  const joints = prefab.rig.joints || [];
  const byId = new Map(joints.map((j) => [j.id, j]));
  const out = { ...values };
  const done = new Set();
  const solve = (j, depth) => {
    if (done.has(j.id) || depth > joints.length) return out[j.id] ?? j.rest ?? j.min;
    const f = j.follow;
    const src = f && byId.get(f.joint);
    if (src && src !== j) out[j.id] = jointClamp(j, (f.offset ?? 0) + f.ratio * solve(src, depth + 1));
    done.add(j.id);
    return out[j.id] ?? j.rest ?? j.min;
  };
  for (const j of joints) solve(j, 0);
  return out;
}

/**
 * Matice uzlů v prostoru prefabu pro dané hodnoty kloubů (chybějící = klidová poloha).
 * Místní matice uzlu = posun · natočení · kloub (hinge: otočení kolem osy, slider: posun po ose).
 * @returns {Record<string, number[]>} id uzlu → matice 4×4
 */
export function rigMatrices(prefab, values = {}) {
  const jointOf = new Map((prefab.rig.joints || []).map((j) => [j.node, j]));
  const nodes = new Map(prefab.rig.nodes.map((n) => [n.id, n]));
  const out = {};
  const solve = (id) => {
    if (out[id]) return out[id];
    const n = nodes.get(id);
    let local = mat4Mul(mat4Translate(n.pos || [0, 0, 0]), mat4Euler(n.rot));
    const j = jointOf.get(id);
    if (j) {
      const v = jointClamp(j, values[j.id] ?? j.rest ?? j.min);
      const jm = j.type === 'hinge' ? mat4AxisAngle(j.axis, v) : mat4Translate([j.axis[0] * v, j.axis[1] * v, j.axis[2] * v]);
      local = mat4Mul(local, jm);
    }
    out[id] = n.parent === undefined ? local : mat4Mul(solve(n.parent), local);
    return out[id];
  };
  for (const n of prefab.rig.nodes) solve(n.id);
  return out;
}
