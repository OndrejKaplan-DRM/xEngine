// Interakce prefabu (N-010, D-052). `components.interact` je jeden objekt, nebo seznam objektů s `id`.
// Jediné místo, které z dat řekne: jaké interakce prefab má, kterou ovládá zasažený uzel a které jsou dveře.
// Čistý modul bez Three.js a Rapieru; volá se při stavbě entit, ne v kroku (vrací nová pole).

/** Id jediné interakce zapsané jako objekt bez `id`. */
export const INTERACT_MAIN = 'main';

/** Druhy, které jednají s celou entitou; v seznamu interakcí nesmí být s ničím dalším. */
export const INTERACT_SOLO = ['pickup', 'grab'];

/** Seznam interakcí prefabu, vždy pole (prázdné, když prefab žádnou nemá). Jediný objekt dostane id `main`. */
export function interactions(prefab) {
  const it = prefab?.components?.interact;
  if (!it) return [];
  if (Array.isArray(it)) return it.filter((x) => x && typeof x === 'object');
  return typeof it === 'object' ? [it.id === undefined ? { ...it, id: INTERACT_MAIN } : it] : [];
}

/** Interakce podle id; u jediné interakce platí i `main` a chybějící id. */
export function interactionById(prefab, id) {
  const list = interactions(prefab);
  if (id === undefined) return list.length === 1 ? list[0] : null;
  return list.find((x) => x.id === id) || null;
}

/** Kloub, který kloub `jointId` nakonec sleduje (N-002); bez sledování vrací sám sebe. */
function followRoot(joints, jointId) {
  const byId = new Map(joints.filter((j) => j && j.id).map((j) => [j.id, j]));
  let j = byId.get(jointId);
  const seen = new Set();
  while (j && j.follow && !seen.has(j.id)) {
    seen.add(j.id);
    j = byId.get(j.follow.joint);
  }
  return j ? j.id : jointId;
}

/**
 * Interakce, kterou hráč ovládá přes uzel `nodeId` (uzel zasaženého kolideru nebo dílu).
 * Jediná interakce platí pro celý prefab. U seznamu: od uzlu nahoru ke kořeni, první kloub, který je
 * kloubem interakce (i přes svázaný kloub, N-002); jinak interakce bez kloubu, je-li jediná; jinak null
 * (pevný korpus kartotéky nic neovládá).
 */
export function interactionOf(prefab, nodeId) {
  const list = interactions(prefab);
  if (list.length <= 1) return list[0] || null;
  const nodes = Array.isArray(prefab.rig?.nodes) ? prefab.rig.nodes : [];
  const joints = Array.isArray(prefab.rig?.joints) ? prefab.rig.joints : [];
  const parentOf = new Map(nodes.filter((n) => n && n.id).map((n) => [n.id, n.parent]));
  const jointOfNode = new Map(joints.filter((j) => j && j.node).map((j) => [j.node, j.id]));
  const byJoint = new Map(list.filter((x) => x.joint !== undefined).map((x) => [x.joint, x]));
  const seen = new Set();
  for (let n = nodeId; n !== undefined && !seen.has(n); n = parentOf.get(n)) {
    seen.add(n);
    const j = jointOfNode.get(n);
    if (j === undefined) continue;
    const hit = byJoint.get(j) || byJoint.get(followRoot(joints, j));
    if (hit) return hit;
  }
  const free = list.filter((x) => x.joint === undefined);
  return free.length === 1 ? free[0] : null;
}

/** Interakce dveří (`kind: door`), pokud ji prefab má právě jednu; jinak null. Portál ji potřebuje jednoznačnou. */
export function doorInteraction(prefab) {
  const doors = interactions(prefab).filter((x) => x.kind === 'door');
  return doors.length === 1 ? doors[0] : null;
}
