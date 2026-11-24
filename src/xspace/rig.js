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

// ---- kostra bez alokací v kroku (N-102) ----------------------------------------------------
// rigCompile jednou při načtení prefabu; rigSolve v kroku zapíše matice uzlů do připraveného pole a nic
// nealokuje. rigMatrices je obálka nad nimi pro nástroje a testy: pořád jedna implementace.

/**
 * Připraví kostru prefabu pro rigSolve (alokuje; volá se jednou).
 * @returns {{ count: number, nodeIds: string[], nodeIndex: Map<string, number>, order: Int32Array, parent: Int32Array,
 *            joint: Int32Array, local: Float64Array, jointIds: string[], jointIndex: Map<string, number>,
 *            jType: Uint8Array, jAxis: Float64Array, jMin: Float64Array, jMax: Float64Array, jRest: Float64Array,
 *            fOrder: Int32Array, fSrc: Int32Array, fRatio: Float64Array, fOffset: Float64Array, tmp: Float64Array }}
 *          Pole uzlů jsou v pořadí `rig.nodes`, pole kloubů v pořadí `rig.joints`; order = pořadí výpočtu (rodič před
 *          potomkem); local = klidová místní matice uzlu (posun · natočení) po 16 číslech; joint = index kloubu uzlu, −1 bez.
 */
export function rigCompile(prefab) {
  const nodes = prefab.rig.nodes;
  const joints = prefab.rig.joints || [];
  const count = nodes.length;
  const nodeIds = nodes.map((n) => n.id);
  const nodeIndex = new Map(nodeIds.map((id, i) => [id, i]));
  const jointIds = joints.map((j) => j.id);
  const jointIndex = new Map(jointIds.map((id, i) => [id, i]));
  const parent = new Int32Array(count).fill(-1);
  const joint = new Int32Array(count).fill(-1);
  const local = new Float64Array(16 * count);
  nodes.forEach((n, i) => {
    const pi = n.parent === undefined ? undefined : nodeIndex.get(n.parent);
    if (pi !== undefined) parent[i] = pi; // neexistující rodič hlásí validátor (ref.node)
    local.set(mat4Mul(mat4Translate(n.pos || [0, 0, 0]), mat4Euler(n.rot)), 16 * i);
  });
  joints.forEach((j, k) => {
    const i = nodeIndex.get(j.node);
    if (i !== undefined) joint[i] = k;
  });
  const order = [];
  const done = new Uint8Array(count);
  const visit = (i) => {
    if (done[i]) return;
    done[i] = 1;
    if (parent[i] >= 0) visit(parent[i]);
    order.push(i);
  };
  for (let i = 0; i < count; i++) visit(i);
  const nj = joints.length;
  const jType = new Uint8Array(nj);
  const jAxis = new Float64Array(3 * nj);
  const jMin = new Float64Array(nj);
  const jMax = new Float64Array(nj);
  const jRest = new Float64Array(nj);
  const fSrc = new Int32Array(nj).fill(-1);
  const fRatio = new Float64Array(nj);
  const fOffset = new Float64Array(nj);
  joints.forEach((j, k) => {
    jType[k] = j.type === 'hinge' ? 0 : 1;
    jAxis.set(j.axis, 3 * k);
    jMin[k] = j.min;
    jMax[k] = j.max;
    jRest[k] = j.rest ?? j.min;
    if (j.follow && jointIndex.has(j.follow.joint) && j.follow.joint !== j.id) {
      fSrc[k] = jointIndex.get(j.follow.joint);
      fRatio[k] = j.follow.ratio;
      fOffset[k] = j.follow.offset ?? 0;
    }
  });
  // pořadí dopočtu svázaných kloubů (N-002): sledovaný před sledujícím; kruh validátor nepustí, tady se jen přeruší
  const fOrder = [];
  const fState = new Uint8Array(nj);
  const fVisit = (k) => {
    if (fState[k]) return;
    fState[k] = 1;
    if (fSrc[k] >= 0) {
      fVisit(fSrc[k]);
      fOrder.push(k);
    }
  };
  for (let k = 0; k < nj; k++) fVisit(k);
  return { count, nodeIds, nodeIndex, order: Int32Array.from(order), parent, joint, local, jointIds, jointIndex, jType, jAxis, jMin, jMax, jRest, fOrder: Int32Array.from(fOrder), fSrc, fRatio, fOffset, tmp: new Float64Array(32) };
}

/** Pole hodnot kloubů pro rigSolve: NaN = klidová poloha. values = { idKloubu: hodnota } (alokuje; mimo krok). */
export function rigValues(compiled, values = {}) {
  const out = new Float64Array(compiled.jointIds.length).fill(NaN);
  compiled.jointIds.forEach((id, k) => {
    const v = values[id];
    if (v !== undefined && v !== null) out[k] = v;
  });
  return out;
}

/** Svázané klouby (N-002) v poli hodnot na místě, bez alokací; totéž co jointFollow. */
export function rigFollow(compiled, values) {
  const { fOrder, fSrc, fRatio, fOffset, jMin, jMax, jRest } = compiled;
  for (let n = 0; n < fOrder.length; n++) {
    const k = fOrder[n];
    const sv = values[fSrc[k]];
    const v = fOffset[k] + fRatio[k] * (sv === sv ? sv : jRest[fSrc[k]]);
    values[k] = v < jMin[k] ? jMin[k] : v > jMax[k] ? jMax[k] : v;
  }
  return values;
}

/** o[oo..] = a[ao..] · b[bo..] (matice 4 × 4 po sloupcích, stejné pořadí sčítání jako mat4Mul). */
function mul4(a, ao, b, bo, o, oo) {
  for (let c = 0; c < 4; c++) {
    const b0 = b[bo + c * 4];
    const b1 = b[bo + c * 4 + 1];
    const b2 = b[bo + c * 4 + 2];
    const b3 = b[bo + c * 4 + 3];
    for (let r = 0; r < 4; r++) o[oo + c * 4 + r] = a[ao + r] * b0 + a[ao + 4 + r] * b1 + a[ao + 8 + r] * b2 + a[ao + 12 + r] * b3;
  }
}

/**
 * Matice uzlů v prostoru prefabu do out (Float64Array, 16 × count, uzel i od 16 · i), bez alokací.
 * values: Float64Array v pořadí kloubů (NaN = klidová poloha); hodnoty se ořezávají na meze.
 * Místní matice uzlu = posun · natočení · kloub (hinge: otočení kolem osy ve stupních, slider: posun po ose v metrech).
 */
export function rigSolve(compiled, values, out) {
  const { order, parent, joint, local, jType, jAxis, jMin, jMax, jRest, tmp } = compiled;
  for (let n = 0; n < order.length; n++) {
    const i = order[n];
    const k = joint[i];
    let src = local;
    let so = 16 * i;
    if (k >= 0) {
      let v = values ? values[k] : NaN;
      if (v !== v) v = jRest[k];
      v = v < jMin[k] ? jMin[k] : v > jMax[k] ? jMax[k] : v;
      const x = jAxis[3 * k];
      const y = jAxis[3 * k + 1];
      const z = jAxis[3 * k + 2];
      // tmp[16..31] = matice kloubu (stejné vzorce jako mat4AxisAngle a mat4Translate)
      if (jType[k] === 0) {
        const c = Math.cos(v * RAD);
        const s = Math.sin(v * RAD);
        const t = 1 - c;
        tmp[16] = t * x * x + c; tmp[17] = t * x * y + s * z; tmp[18] = t * x * z - s * y; tmp[19] = 0;
        tmp[20] = t * x * y - s * z; tmp[21] = t * y * y + c; tmp[22] = t * y * z + s * x; tmp[23] = 0;
        tmp[24] = t * x * z + s * y; tmp[25] = t * y * z - s * x; tmp[26] = t * z * z + c; tmp[27] = 0;
        tmp[28] = 0; tmp[29] = 0; tmp[30] = 0; tmp[31] = 1;
      } else {
        tmp[16] = 1; tmp[17] = 0; tmp[18] = 0; tmp[19] = 0;
        tmp[20] = 0; tmp[21] = 1; tmp[22] = 0; tmp[23] = 0;
        tmp[24] = 0; tmp[25] = 0; tmp[26] = 1; tmp[27] = 0;
        tmp[28] = x * v; tmp[29] = y * v; tmp[30] = z * v; tmp[31] = 1;
      }
      mul4(local, 16 * i, tmp, 16, tmp, 0);
      src = tmp;
      so = 0;
    }
    const p = parent[i];
    if (p < 0) for (let e = 0; e < 16; e++) out[16 * i + e] = src[so + e];
    else mul4(out, 16 * p, src, so, out, 16 * i);
  }
  return out;
}

/**
 * Matice uzlů v prostoru prefabu pro dané hodnoty kloubů (chybějící = klidová poloha). Obálka nad rigCompile
 * a rigSolve pro nástroje a testy (alokuje); v kroku simulace použij rigSolve.
 * @returns {Record<string, number[]>} id uzlu → matice 4×4
 */
export function rigMatrices(prefab, values = {}) {
  const C = rigCompile(prefab);
  const out = rigSolve(C, rigValues(C, values), new Float64Array(16 * C.count));
  const res = {};
  C.nodeIds.forEach((id, i) => (res[id] = Array.from(out.subarray(16 * i, 16 * i + 16))));
  return res;
}
