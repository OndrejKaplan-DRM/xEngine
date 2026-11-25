// xWorld: uložený stav jedné entity (snapshot systému entities). Zvlášť, ať entities.js zůstane pod 600 řádků.
// Záznam: s = kopie state; x = stav po interakcích u seznamu (N-010); j = klouby [value, vel, target, speed, active,
// from, blocked]; b = dynamické těleso [poloha 3, natočení 4, rychlost 3, úhlová rychlost 3, spí].

const tq = { x: 0, y: 0, z: 0, w: 1 };

export function saveEntity(ent) {
  const out = { s: { ...ent.state } };
  if (ent.ixs.length > 1) out.x = ent.ixs.map((r) => ({ ...r.state }));
  if (ent.joints.length) out.j = ent.joints.map((j) => [j.value, j.vel, Number.isNaN(j.target) ? null : j.target, j.speed, j.active ? 1 : 0, j.from, j.blocked]);
  if (ent.body) {
    const p = ent.body.translation();
    const q = ent.body.rotation();
    const l = ent.body.linvel();
    const a = ent.body.angvel();
    out.b = [p.x, p.y, p.z, q.x, q.y, q.z, q.w, l.x, l.y, l.z, a.x, a.y, a.z, ent.body.isSleeping() ? 1 : 0];
  }
  return out;
}

/** Stav, interakce a klouby ze záznamu d; activate(ent) pro kloub, který se zrovna hýbal. */
export function loadEntityState(ent, d, activate) {
  Object.assign(ent.state, d.s);
  if (ent.ixs.length > 1) (d.x || []).forEach((st, k) => ent.ixs[k] && Object.assign(ent.ixs[k].state, st));
  (d.j || []).forEach((r, k) => {
    const j = ent.joints[k];
    if (!j) return;
    j.value = r[0];
    j.vel = r[1];
    j.target = r[2] === null ? NaN : r[2];
    j.speed = r[3];
    j.active = !!r[4];
    j.from = r[5] ?? j.value;
    j.blocked = r[6] ?? 0;
    j.held = false;
    if (j.active) activate(ent);
  });
}

/** Dynamické těleso ze záznamu b (pole saveEntity().b). */
export function loadBody(body, b, phys) {
  body.setTranslation(phys.vec(b[0], b[1], b[2]), true);
  tq.x = b[3];
  tq.y = b[4];
  tq.z = b[5];
  tq.w = b[6];
  body.setRotation(tq, true);
  body.setLinvel(phys.vec(b[7], b[8], b[9]), true);
  body.setAngvel(phys.vec(b[10], b[11], b[12]), true);
  if (b[13]) body.sleep();
}
