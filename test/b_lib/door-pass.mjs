// Průchod otevřenými dveřmi: jak velký kruh (půdorys kapsle hráče) projde z jedné strany zdi na druhou.
// Počítá se jen z dat prefabu, nezávisle na generátoru: kolize prefabu s kloubem dveří na dorazu nejdál od klidu,
// promítnuté do půdorysu, a zeď po obou stranách otvoru. Mřížka 1 cm, vzdálenost bodu od překážek přesně,
// největší poloměr půlením intervalu. Výsledek je tedy o centimetr nejistý; kontroly s tím počítají.
//
// Soustava prefabu dveří: počátek = střed prahu, X podél zdi, prochází se podél Z.

import { rigMatrices, mat4Point } from '../../src/xspace/index.js';
import { partPoints } from '../../src/gen/measure.js';

const G = 0.01;
const REACH_X = 1.3; // kolik zdi po stranách otvoru se modeluje
const REACH_Z = 1.6; // odkud kam se jde (otevřené křídlo sahá nejvýš metr od zdi)

/** Konvexní obal bodů v rovině (Andrewův řetěz), proti směru hodinových ručiček. */
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 1e-12) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 1e-12) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Vzdálenost bodu od konvexního mnohoúhelníku (0 uvnitř). */
function distToPoly(x, z, poly) {
  let inside = true;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    if (ex * (z - a[1]) - ez * (x - a[0]) < 0) inside = false;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez || 1)));
    const d = Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t);
    if (d < best) best = d;
  }
  return inside ? 0 : best;
}

/** Hodnota kloubu dveří na dorazu nejdál od klidu. */
export function openPose(prefab) {
  const it = (prefab.components || {}).interact;
  const j = it && (prefab.rig.joints || []).find((x) => x.id === it.joint);
  if (!j) return {};
  const rest = j.rest ?? j.min;
  return { [j.id]: Math.abs(j.max - rest) >= Math.abs(j.min - rest) ? j.max : j.min };
}

/** Půdorysy kolizí prefabu v dané poloze kloubů, které zasahují do výšky těla (nad schůdný práh, pod hlavu). */
export function footprints(prefab, values, yLo, yHi) {
  const mats = rigMatrices(prefab, values);
  const out = [];
  for (const c of prefab.colliders || []) {
    if (c.shape !== 'box' && c.shape !== 'cyl') continue;
    const pts = partPoints(c).map((q) => mat4Point(mats[c.node], q));
    if (Math.max(...pts.map((p) => p[1])) <= yLo || Math.min(...pts.map((p) => p[1])) >= yHi) continue;
    out.push(hull(pts.map((p) => [p[0], p[2]])));
  }
  return out;
}

/**
 * Největší kruh, který projde otevřenými dveřmi.
 * @param prefabs jeden prefab, nebo křídla dvoukřídlých dveří se společným počátkem
 * @param w šířka stavebního otvoru (m)
 * @param wall tloušťka zdi (m)
 * @param body { step, height } výšky, mezi kterými kolize překáží (m)
 * @returns { radius, clear } největší poloměr a světlost pro kapsli (2 × poloměr), obojí v metrech
 */
export function doorPass(prefabs, w, wall = 0.2, body = { step: 0.3, height: 1.8 }) {
  const polys = prefabs.flatMap((p) => footprints(p, openPose(p), body.step, body.height));
  polys.push([[-w / 2 - REACH_X - 1, -wall / 2], [-w / 2, -wall / 2], [-w / 2, wall / 2], [-w / 2 - REACH_X - 1, wall / 2]]);
  polys.push([[w / 2, -wall / 2], [w / 2 + REACH_X + 1, -wall / 2], [w / 2 + REACH_X + 1, wall / 2], [w / 2, wall / 2]]);
  const nx = Math.round((w + 2 * REACH_X) / G) + 1;
  const nz = Math.round((2 * REACH_Z) / G) + 1;
  const x0 = -w / 2 - REACH_X;
  const clear = new Float32Array(nx * nz);
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      let d = Infinity;
      const x = x0 + i * G;
      const z = -REACH_Z + k * G;
      for (const poly of polys) {
        const q = distToPoly(x, z, poly);
        if (q < d) d = q;
        if (d === 0) break;
      }
      clear[i * nz + k] = d;
    }
  }
  // jde se z řady bodů před zdí do řady bodů za zdí (kdekoli po šířce: za dveřmi se smí uhnout křídlu)
  const passes = (r) => {
    const seen = new Uint8Array(nx * nz);
    const stack = [];
    for (let i = 0; i < nx; i++) if (clear[i * nz + nz - 1] > r) stack.push(i * nz + nz - 1);
    while (stack.length) {
      const at = stack.pop();
      if (seen[at]) continue;
      seen[at] = 1;
      const i = Math.floor(at / nz);
      const k = at - i * nz;
      if (k === 0) return true;
      if (clear[at - 1] > r) stack.push(at - 1);
      if (k < nz - 1 && clear[at + 1] > r) stack.push(at + 1);
      if (i > 0 && clear[at - nz] > r) stack.push(at - nz);
      if (i < nx - 1 && clear[at + nz] > r) stack.push(at + nz);
    }
    return false;
  };
  let lo = 0;
  let hi = w / 2;
  if (!passes(0)) return { radius: 0, clear: 0 };
  for (let it = 0; it < 12; it++) {
    const mid = (lo + hi) / 2;
    if (passes(mid)) lo = mid;
    else hi = mid;
  }
  return { radius: lo, clear: 2 * lo };
}
