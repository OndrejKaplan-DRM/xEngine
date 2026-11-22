// Převody mezi maticí 4×4 (po sloupcích, jak ji vrací src/xspace/rig.js) a polohou + čtveřicí pro Rapier.
// Není to výpočet kostry: ten zůstává v rig.js. Tady se hotová matice jen rozkládá, bez alokací.

/**
 * Rozloží matici posun · otočení · rovnoměrné měřítko. Zapisuje do out = { x, y, z, qx, qy, qz, qw, s }.
 */
export function decompose(m, out) {
  const s = Math.hypot(m[0], m[1], m[2]) || 1;
  const m00 = m[0] / s;
  const m10 = m[1] / s;
  const m20 = m[2] / s;
  const m01 = m[4] / s;
  const m11 = m[5] / s;
  const m21 = m[6] / s;
  const m02 = m[8] / s;
  const m12 = m[9] / s;
  const m22 = m[10] / s;
  const tr = m00 + m11 + m22;
  let qx;
  let qy;
  let qz;
  let qw;
  if (tr > 0) {
    const k = 0.5 / Math.sqrt(tr + 1);
    qw = 0.25 / k;
    qx = (m21 - m12) * k;
    qy = (m02 - m20) * k;
    qz = (m10 - m01) * k;
  } else if (m00 > m11 && m00 > m22) {
    const k = 2 * Math.sqrt(1 + m00 - m11 - m22);
    qw = (m21 - m12) / k;
    qx = 0.25 * k;
    qy = (m01 + m10) / k;
    qz = (m02 + m20) / k;
  } else if (m11 > m22) {
    const k = 2 * Math.sqrt(1 + m11 - m00 - m22);
    qw = (m02 - m20) / k;
    qx = (m01 + m10) / k;
    qy = 0.25 * k;
    qz = (m12 + m21) / k;
  } else {
    const k = 2 * Math.sqrt(1 + m22 - m00 - m11);
    qw = (m10 - m01) / k;
    qx = (m02 + m20) / k;
    qy = (m12 + m21) / k;
    qz = 0.25 * k;
  }
  out.x = m[12];
  out.y = m[13];
  out.z = m[14];
  out.qx = qx;
  out.qy = qy;
  out.qz = qz;
  out.qw = qw;
  out.s = s;
  return out;
}

/** Složí matici z polohy a čtveřice (měřítko s) do pole out (16 čísel po sloupcích). */
export function compose(x, y, z, qx, qy, qz, qw, s, out) {
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;
  out[0] = (1 - (yy + zz)) * s;
  out[1] = (xy + wz) * s;
  out[2] = (xz - wy) * s;
  out[3] = 0;
  out[4] = (xy - wz) * s;
  out[5] = (1 - (xx + zz)) * s;
  out[6] = (yz + wx) * s;
  out[7] = 0;
  out[8] = (xz + wy) * s;
  out[9] = (yz - wx) * s;
  out[10] = (1 - (xx + yy)) * s;
  out[11] = 0;
  out[12] = x;
  out[13] = y;
  out[14] = z;
  out[15] = 1;
  return out;
}

/** Čtveřice otočení, které převede osu Y na osu danou písmenem (válec v Rapieru stojí podél Y). */
export function axisQuat(axis) {
  const h = Math.SQRT1_2;
  if (axis === 'x') return { x: 0, y: 0, z: -h, w: h }; // Y → X: otočení o −90° kolem Z
  if (axis === 'z') return { x: h, y: 0, z: 0, w: h }; // Y → Z: otočení o +90° kolem X
  return { x: 0, y: 0, z: 0, w: 1 };
}
