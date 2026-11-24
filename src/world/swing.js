// xWorld: zkušební přepínač k návrhu N-109 (dveře se otvírají od hráče). Otočným dveřím s kloubem jen na jednu
// stranu rozšíří rozsah souměrně kolem klidové polohy, takže chování v behaviors.js (dveře na obě strany) má co
// řídit. Data balíku se nemění: entita dostane kopii prefabu. Až budou mít prefaby rozsah na obě strany v datech,
// tenhle soubor zmizí.

const widened = new Map();

export function swingBoth(prefab) {
  const j = prefab.rig?.joints?.[0];
  if (prefab.components?.interact?.kind !== 'door' || !j || j.type !== 'hinge' || j.min !== (j.rest ?? j.min)) return prefab;
  if (!widened.has(prefab)) widened.set(prefab, { ...prefab, rig: { ...prefab.rig, joints: prefab.rig.joints.map((k, i) => (i ? k : { ...k, rest: k.min, min: 2 * k.min - k.max })) } });
  return widened.get(prefab);
}
