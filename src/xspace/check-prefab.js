// Validátor xSpace: kontrola prefabu (kostra, svázané klouby, díly, kolize, součásti, interakce).
// Odděleno z validate.js kvůli mezi 600 řádků (25. 11. 2026); kódy nálezů se nemění.

import { FORMATS, LIMITS } from './formats.js';
import { isNum, isVec, checkShape, dupes, boxOk } from './check.js';
import { interactions, INTERACT_SOLO } from './interact.js';

// ---- prefab ----------------------------------------------------------------------------

export function checkPrefab(file, p, matIds, prefabIds, assetPaths, c) {
  checkShape(FORMATS.prefab, p, file, c);
  if (!p || typeof p !== 'object') return;
  if (p.bounds) boxOk(p.bounds.min, p.bounds.max, `${file}.bounds`, c);

  const nodes = Array.isArray(p.rig?.nodes) ? p.rig.nodes : [];
  const joints = Array.isArray(p.rig?.joints) ? p.rig.joints : [];
  const nodeIds = dupes(nodes, `${file}.rig.nodes`, 'rig.dupe', c);
  const jointIds = dupes(joints, `${file}.rig.joints`, 'rig.dupe', c);

  // kostra: jeden kořen, rodiče existují, žádný kruh
  const parentOf = new Map(nodes.filter((n) => n && n.id).map((n) => [n.id, n.parent]));
  const roots = nodes.filter((n) => n && n.parent === undefined);
  if (nodes.length && roots.length !== 1) c.err('rig.root', `${file}.rig.nodes`, `kostra má mít právě jeden kořen, má ${roots.length}`);
  nodes.forEach((n, i) => {
    if (!n || n.parent === undefined) return;
    if (!nodeIds.has(n.parent)) return c.err('ref.node', `${file}.rig.nodes[${i}].parent`, `uzel „${n.parent}“ neexistuje`);
    const seen = new Set([n.id]);
    let cur = n.parent;
    while (cur !== undefined) {
      if (seen.has(cur)) {
        c.err('rig.cycle', `${file}.rig.nodes[${i}]`, `uzel „${n.id}“ je ve vlastní větvi předků`);
        break;
      }
      seen.add(cur);
      cur = parentOf.get(cur);
    }
  });

  const jointedNodes = new Set();
  joints.forEach((j, i) => {
    if (!j) return;
    const path = `${file}.rig.joints[${i}]`;
    if (j.node !== undefined && !nodeIds.has(j.node)) c.err('ref.node', `${path}.node`, `uzel „${j.node}“ neexistuje`);
    if (j.node !== undefined && parentOf.get(j.node) === undefined && nodeIds.has(j.node)) {
      c.err('rig.rootJoint', `${path}.node`, 'kloub nemůže hýbat kořenem; kořen je pevná část předmětu');
    }
    if (jointedNodes.has(j.node)) c.err('rig.dupeJoint', `${path}.node`, `uzel „${j.node}“ už kloub má; víc stupňů volnosti = mezilehlý uzel`);
    jointedNodes.add(j.node);
    if (isVec(j.axis, 3)) {
      const len = Math.hypot(...j.axis);
      if (Math.abs(len - 1) > 1e-3) c.err('rig.axis', `${path}.axis`, `osa má být jednotkový vektor, délka je ${len.toFixed(4)}`);
    }
    if (isNum(j.min) && isNum(j.max)) {
      if (j.min >= j.max) c.err('rig.limits', path, `min (${j.min}) musí být menší než max (${j.max})`);
      const span = j.max - j.min;
      if (j.type === 'slider' && span > LIMITS.sliderMax) c.err('rig.limits', path, `posuv ${span} m je nad mezí ${LIMITS.sliderMax} m`);
      if (j.type === 'hinge' && span > 360 * LIMITS.hingeMaxTurns) c.err('rig.limits', path, `otočení ${span}° je nad mezí ${LIMITS.hingeMaxTurns} otáček`);
      const inside = (v) => v >= j.min - 1e-9 && v <= j.max + 1e-9;
      if (j.rest !== undefined && isNum(j.rest) && !inside(j.rest)) c.err('rig.limits', `${path}.rest`, 'klidová poloha je mimo meze');
      (Array.isArray(j.detents) ? j.detents : []).forEach((dv, k) => {
        if (isNum(dv) && !inside(dv)) c.err('rig.limits', `${path}.detents[${k}]`, 'zarážka je mimo meze');
      });
    }
  });

  // svázané klouby (N-002): odkaz, ne sám na sebe, bez kruhu, meze, ne kloub interakce
  const jointById = new Map(joints.filter((j) => j && j.id).map((j) => [j.id, j]));
  joints.forEach((j, i) => {
    if (!j || !j.follow || typeof j.follow !== 'object') return;
    const path = `${file}.rig.joints[${i}].follow`;
    const src = jointById.get(j.follow.joint);
    if (!src) return c.err('ref.joint', `${path}.joint`, `kloub „${j.follow.joint}“ neexistuje`);
    if (src === j) return c.err('rig.follow', `${path}.joint`, 'kloub nemůže sledovat sám sebe');
    if (interactions(p).some((it) => it.joint === j.id)) c.err('rig.follow', path, 'svázaný kloub nesmí být kloubem interakce; interakce pohání kloub, který sleduje');
    const seen = new Set([j.id]);
    for (let cur = src; cur && cur.follow; cur = jointById.get(cur.follow.joint)) {
      if (seen.has(cur.id)) {
        c.err('rig.followCycle', path, `řetěz sledování kloubů se vrací ke kloubu „${cur.id}“`);
        break;
      }
      seen.add(cur.id);
    }
    if (isNum(j.follow.ratio) && isNum(src.min) && isNum(src.max) && isNum(j.min) && isNum(j.max)) {
      const off = isNum(j.follow.offset) ? j.follow.offset : 0;
      for (const v of [src.min, src.max]) {
        const w = off + j.follow.ratio * v;
        if (w < j.min - 1e-9 || w > j.max + 1e-9) c.err('rig.limits', path, `pro „${src.id}“ = ${v} vyjde ${+w.toFixed(4)}, mimo meze ${j.min} až ${j.max}`);
      }
    }
  });

  const needsBox = (x, path) => {
    if (x.min === undefined || x.max === undefined) c.err('shape.required', path, 'tvar box vyžaduje min a max');
    else boxOk(x.min, x.max, path, c, LIMITS.partMinSize);
  };
  const needsCyl = (x, path) => {
    for (const k of ['center', 'radius', 'height', 'axis']) if (x[k] === undefined) c.err('shape.required', `${path}.${k}`, 'tvar cyl vyžaduje center, radius, height a axis');
  };
  const needsMesh = (x, path) => {
    if (x.mesh === undefined) return c.err('shape.required', `${path}.mesh`, 'tvar vyžaduje pole mesh');
    const filePart = String(x.mesh).split('#')[0];
    if (!assetPaths.has(filePart)) c.err('ref.asset', `${path}.mesh`, `soubor „${filePart}“ není v seznamu assets manifestu`);
  };

  (Array.isArray(p.parts) ? p.parts : []).forEach((x, i) => {
    if (!x) return;
    const path = `${file}.parts[${i}]`;
    if (x.node !== undefined && !nodeIds.has(x.node)) c.err('ref.node', `${path}.node`, `uzel „${x.node}“ neexistuje`);
    if (x.mat !== undefined && !matIds.has(x.mat)) c.err('ref.material', `${path}.mat`, `materiál „${x.mat}“ neexistuje`);
    if (x.shape === 'box') needsBox(x, path);
    if (x.shape === 'cyl') needsCyl(x, path);
    if (x.shape === 'mesh') needsMesh(x, path);
    if (x.shape !== 'mesh' && x.mat === undefined) c.err('shape.required', `${path}.mat`, 'díl z kvádru nebo válce musí mít materiál');
  });

  (Array.isArray(p.colliders) ? p.colliders : []).forEach((x, i) => {
    if (!x) return;
    const path = `${file}.colliders[${i}]`;
    if (x.node !== undefined && !nodeIds.has(x.node)) c.err('ref.node', `${path}.node`, `uzel „${x.node}“ neexistuje`);
    if (x.shape === 'box') needsBox(x, path);
    if (x.shape === 'cyl') needsCyl(x, path);
    if (x.shape === 'ball' && (x.center === undefined || x.radius === undefined)) c.err('shape.required', path, 'tvar ball vyžaduje center a radius');
    if (x.shape === 'hull' || x.shape === 'mesh') needsMesh(x, path);
    if (x.shape === 'mesh' && p.components?.physics?.body === 'dynamic') c.err('phys.meshDynamic', path, 'dynamické těleso nesmí mít kolizi mesh; použij hull nebo kvádry');
  });

  const comp = p.components || {};
  checkInteractions(file, p, comp, jointIds, c);
  if (comp.place?.mount === 'opening' && comp.place.opening === undefined) c.err('place.opening', `${file}.components.place`, 'umístění do otvoru vyžaduje rozměr otvoru (opening)');
  if (comp.place?.mount === 'wall' && comp.place.height === undefined) c.err('place.height', `${file}.components.place`, 'nástěnný prefab vyžaduje výšku počátku nad podlahou (height)');
  if (comp.light?.node !== undefined && !nodeIds.has(comp.light.node)) c.err('ref.node', `${file}.components.light.node`, `uzel „${comp.light.node}“ neexistuje`);
  if (comp.screen?.node !== undefined && !nodeIds.has(comp.screen.node)) c.err('ref.node', `${file}.components.screen.node`, `uzel „${comp.screen.node}“ neexistuje`);
  if (comp.health?.breakInto !== undefined && !prefabIds.has(comp.health.breakInto)) c.err('ref.prefab', `${file}.components.health.breakInto`, `prefab „${comp.health.breakInto}“ neexistuje`);
  if (comp.physics?.body === 'dynamic' && comp.physics.mass === undefined) c.err('phys.mass', `${file}.components.physics`, 'dynamické těleso musí mít hmotnost');
  if (comp.physics && !(Array.isArray(p.colliders) && p.colliders.length)) c.err('phys.noCollider', `${file}.components.physics`, 'těleso bez kolizního tvaru');
  if (joints.length && comp.physics?.body === 'static') c.warn('phys.staticJoint', `${file}.components.physics`, 'předmět s klouby má být kinematic, jinak se jeho pohyblivé díly nesrazí s hráčem');
  if (isNum(p.tris) && p.tris > LIMITS.warnPrefabTris) c.warn('budget.prefabTris', `${file}.tris`, `${p.tris} trojúhelníků je nad doporučením ${LIMITS.warnPrefabTris}`);

  for (const k of ['inputs', 'outputs']) {
    const list = Array.isArray(p[k]) ? p[k] : [];
    if (new Set(list).size !== list.length) c.err('io.dupe', `${file}.${k}`, 'položky se opakují');
  }
}

/** Interakce: jedna nebo seznam (N-010). Pravidla druhů platí pro každou položku. */
function checkInteractions(file, p, comp, jointIds, c) {
  if (!comp.interact || typeof comp.interact !== 'object') return;
  const many = Array.isArray(comp.interact);
  const list = interactions(p);
  const base = `${file}.components.interact`;
  const needsJoint = ['button', 'switch', 'lever', 'valve', 'door', 'drawer'];
  const ids = new Set();
  const byJoint = new Map();
  list.forEach((it, i) => {
    const path = many ? `${base}[${i}]` : base;
    if (many) {
      if (typeof it.id !== 'string') c.err('interact.id', path, 'v seznamu interakcí má každá položka id');
      else if (ids.has(it.id)) c.err('interact.id', `${path}.id`, `id „${it.id}“ se opakuje`);
      ids.add(it.id);
      if (INTERACT_SOLO.includes(it.kind) && list.length > 1) c.err('interact.solo', path, `interakce ${it.kind} jedná s celou entitou a nesmí být v seznamu s dalšími`);
    }
    if (it.joint !== undefined) {
      if (!jointIds.has(it.joint)) c.err('ref.joint', `${path}.joint`, `kloub „${it.joint}“ neexistuje`);
      else if (byJoint.has(it.joint)) c.err('interact.jointTwice', `${path}.joint`, `kloub „${it.joint}“ už ovládá interakce „${byJoint.get(it.joint)}“`);
      byJoint.set(it.joint, it.id);
    }
    if (needsJoint.includes(it.kind) && it.joint === undefined) c.err('interact.joint', path, `interakce ${it.kind} vyžaduje kloub`);
    if ((it.kind === 'terminal' || it.kind === 'station') && !it.station) c.err('interact.station', path, `interakce ${it.kind} vyžaduje ukotvení kamery (station)`);
    if (it.kind === 'terminal' && !comp.screen) c.err('interact.screen', `${file}.components`, 'terminál vyžaduje součást screen');
    if (it.kind === 'pickup' && !comp.pickup) c.err('interact.pickup', `${file}.components`, 'interakce pickup vyžaduje součást pickup');
    if (it.kind === 'grab' && comp.physics?.body !== 'dynamic') c.err('interact.grab', `${file}.components`, 'uchopit jde jen dynamické těleso');
    if (it.seeThrough && it.kind !== 'door') c.warn('interact.seeThrough', path, 'seeThrough má smysl jen u dveří');
  });
}
