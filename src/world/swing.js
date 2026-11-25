// xWorld: zkušební přepínač k návrhu N-109 (dveře se otvírají od hráče). Otočným dveřím s kloubem jen na jednu
// stranu rozšíří rozsah souměrně kolem klidové polohy, takže chování v behaviors.js (dveře na obě strany) má co
// řídit. Data balíku se nemění: entita dostane kopii prefabu. Až budou mít prefaby rozsah na obě strany v datech,
// tenhle soubor zmizí.

import { doorInteraction } from '../xspace/index.js';

const widened = new Map();
/** Jak daleko od roviny a okraje otvoru portálu smí ležet počátek dveří (m). */
const PORTAL_TOL = 0.15;

/**
 * Id entit, které jsou dveřmi v průchodu mezi buňkami: `portals[].door` a navíc každá entita, jejíž počátek leží
 * v otvoru portálu (druhé křídlo dvoukřídlých dveří v portálu zapsané není). Dvířka nábytku (skříň, lednice,
 * víko truhly) mají stejnou interakci `door`, ale v otvoru portálu nestojí; jejich „od hráče“ by znamenalo
 * dovnitř nábytku.
 */
export function portalDoorIds(level) {
  const ids = new Set();
  const boxes = [];
  for (const p of level.portals || []) {
    if (p.door) ids.add(p.door);
    if (!p.quad) continue;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const q of p.quad) for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], q[k] - PORTAL_TOL);
      max[k] = Math.max(max[k], q[k] + PORTAL_TOL);
    }
    boxes.push({ min, max });
  }
  for (const e of level.entities || []) {
    const p = e.pos || [0, 0, 0];
    if (boxes.some((b) => p.every((v, k) => v >= b.min[k] && v <= b.max[k]))) ids.add(e.id);
  }
  return ids;
}

export function swingBoth(prefab) {
  const door = doorInteraction(prefab); // interakce dveří (N-010); kloub z ní, bez pole joint první kloub
  const joints = prefab.rig?.joints || [];
  const id = door?.joint ?? joints[0]?.id;
  const j = joints.find((k) => k.id === id);
  if (!door || !j || j.type !== 'hinge' || j.min !== (j.rest ?? j.min)) return prefab;
  if (!widened.has(prefab)) widened.set(prefab, { ...prefab, rig: { ...prefab.rig, joints: joints.map((k) => (k !== j ? k : { ...k, rest: k.min, min: 2 * k.min - k.max })) } });
  return widened.get(prefab);
}
