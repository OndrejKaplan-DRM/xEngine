// Jedna pravda pro výpočet osvětlení (02_KONTRAKTY, oddíl Světlo). Používá ji běh (světlo po vrcholech) i zapékání.
// Čistá matematika bez zastínění: zda je mezi bodem a světlem překážka, řeší volající (běh paprskem Rapieru, zapékání vlastním).

const DEG = Math.PI / 180;
/** Měkký okraj kužele: posledních 20 % úhlu (obdoba penumbra 0,2 v three.js). */
export const SPOT_EDGE = 0.2;

/** Okno dosahu: clamp(1 − (d / range)^4, 0, 1)^2. Bez dosahu 1. */
export function lightWindow(d, range) {
  if (!range) return 1;
  const q = d / range;
  const w = 1 - q * q * q * q;
  return w <= 0 ? 0 : w * w;
}

/**
 * Osvětlení E bodu (px, py, pz) s jednotkovou normálou (nx, ny, nz) světlem při plné úrovni, bez zastínění.
 * Vrací skalár; barvou světla násobí volající. light: { type, pos, dir?, intensity, range?, angle? } podle xSpace.
 * point, spot: intensity v kandelách, E = I · cos θ · okno(d) / max(d², 0,01). spot navíc kužel o plném úhlu `angle`.
 * sun: intensity je osvětlení plochy kolmé ke směru, E = I · cos θ, směr `dir` míří od světla.
 */
export function lightIrradiance(light, px, py, pz, nx, ny, nz) {
  if (light.type === 'sun') {
    const d = light.dir || [0, -1, 0];
    const len = Math.hypot(d[0], d[1], d[2]) || 1;
    const cos = -(nx * d[0] + ny * d[1] + nz * d[2]) / len;
    return cos > 0 ? light.intensity * cos : 0;
  }
  const lx = light.pos[0] - px;
  const ly = light.pos[1] - py;
  const lz = light.pos[2] - pz;
  const d2 = lx * lx + ly * ly + lz * lz;
  const d = Math.sqrt(d2);
  if (light.range && d >= light.range) return 0;
  const cos = d > 1e-9 ? (nx * lx + ny * ly + nz * lz) / d : 1;
  if (cos <= 0) return 0;
  let e = (light.intensity * cos * lightWindow(d, light.range)) / Math.max(d2, 0.01);
  if (light.type === 'spot') {
    const dir = light.dir || [0, -1, 0];
    const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    const cosPhi = d > 1e-9 ? -(lx * dir[0] + ly * dir[1] + lz * dir[2]) / (d * len) : 1;
    const half = ((light.angle ?? 60) / 2) * DEG;
    const outer = Math.cos(half);
    const inner = Math.cos(half * (1 - SPOT_EDGE));
    if (cosPhi <= outer) return 0;
    if (cosPhi < inner) {
      const t = (cosPhi - outer) / (inner - outer);
      e *= t * t * (3 - 2 * t);
    }
  }
  return e;
}
