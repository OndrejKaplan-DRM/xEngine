// A1.4 v Node: entity a kostry. Uzly podle rigMatrices, kolize na uzlech (kinematická tělesa), dynamická tělesa,
// pohon kloubu, pružina, zarážky. Entity se hledají v datech podle prefabu a součástí, ne podle pevných jmen
// (kromě dveří, tlačítka a vypínače zlatého vzorku, které zadání jmenuje).

import { h, makeGame, fmt } from './a_lib/node.mjs';
import { entityMatrix, rigMatrices, mat4Mul, partMesh } from '../src/xspace/index.js';
import { decompose } from '../src/phys/xform.js';
import { SIGHT_RAY } from '../src/phys/phys.js';

const { ok } = h;
const game = await makeGame();
const { E, entities, phys, player, render, session } = game;
const level = session.level;
const prefabOf = (def) => game.pack.prefabs.find((p) => p.data.id === def.prefab).data;
const maxDiff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

// ---- všechny entity z dat existují; dávky zůstávají po buňce a materiálu
ok(entities.list.length === level.entities.length, 'každá entita levelu má instanci', `${entities.list.length}`);
{
  const mats = new Set();
  for (const b of level.brushes) {
    if (b.vis === false) continue;
    mats.add(b.mat);
    for (const m of Object.values(b.faces || {})) mats.add(m);
  }
  for (const e of level.entities) for (const part of prefabOf(e).parts) mats.add(part.mat);
  ok(render.counts.batches <= level.cells.length * mats.size, 'pevné díly prefabů jdou do dávek buňka × materiál', `${render.counts.batches} dávek, mez ${level.cells.length} buněk × ${mats.size} materiálů; pohyblivých dílů ${render.counts.movers}`);
  const tris = level.entities.reduce((s, e) => s + (prefabOf(e).tris || 0), 0);
  // dveře v portálu jsou vidět z obou buněk: jejich pevné díly (zárubeň) jsou v dávkách obou
  const doors = new Set((level.portals || []).filter((p) => p.door).map((p) => p.door));
  let twice = 0;
  for (const e of level.entities) {
    if (!doors.has(e.id)) continue;
    const pf = prefabOf(e);
    const moving = new Set((pf.rig.joints || []).map((j) => j.node));
    for (const part of pf.parts) if (!moving.has(part.node)) twice += partMesh(part).indices.length / 3;
  }
  const drawn = render.counts.staticTris - game.world.stat.drawnTris + render.counts.moverTris;
  ok(drawn === tris + twice, 'trojúhelníky dílů odpovídají poli tris prefabů', `${drawn} △ nakresleno = ${tris} △ podle dat + ${twice} △ zárubní dveří v portálech (v obou buňkách)`);
}

game.start();
game.sim(1.5);

// ---- dynamická tělesa: stoh beden stojí, po odstrčení horní spadne
const dyn = level.entities.filter((e) => prefabOf(e).components?.physics?.body === 'dynamic');
const store = dyn.filter((e) => e.cell === 'c_store');
const upper = store.find((e) => e.pos[1] > 0.1);
const lower = store.find((e) => e.pos[1] <= 0.1 && Math.hypot(e.pos[0] - upper.pos[0], e.pos[2] - upper.pos[2]) < 0.3);
{
  const drift = Math.max(...dyn.map((e) => maxDiff(game.get(`entity.${e.id}.pos`), e.pos)));
  const asleep = dyn.filter((e) => game.get(`entity.${e.id}.body`).sleeping).length;
  ok(drift < 0.01 && asleep === dyn.length, 'stohy beden po 1,5 s stojí na místě a spí', `největší posun ${fmt(drift, 4)} m, spí ${asleep} z ${dyn.length}`);
  const mass = prefabOf(upper).components.physics.mass;
  entities.impulse(entities.byId(upper.id), mass * 5, 0, 0); // odstrčení: Δv = 5 m/s (tření 0,7 zastaví bednu na 0,9 m, polovina šířky je 0,4 m)
  game.sim(2);
  const up = game.get(`entity.${upper.id}.pos`);
  const lo = game.get(`entity.${lower.id}.pos`);
  ok(up[1] < upper.pos[1] - 0.3 && Math.abs(up[0] - upper.pos[0]) > 0.5, 'bedna ve skladu spadne ze stohu po odstrčení', `horní ${fmt(upper.pos, 2)} → ${fmt(up, 2)}`);
  ok(Math.abs(lo[1] - lower.pos[1]) < 0.02, 'spodní bedna zůstane na podlaze', `y = ${fmt(lo[1])}`);
}

// ---- hráč do beden strčí (kontrolér předává impuls dynamickým tělesům)
{
  game.start();
  game.sim(0.5);
  const d = lower;
  player.teleport(d.pos[0] + 2.2, 0, d.pos[2], 90); // čelem k −X, k bedně
  game.sim(0.2);
  game.sim(1.2, { hold: ['fwd'] });
  game.sim(1);
  const lo = game.get(`entity.${d.id}.pos`);
  ok(lo[0] < d.pos[0] - 0.15, 'hráč bednu odtlačí', `x ${fmt(d.pos[0], 2)} → ${fmt(lo[0], 2)}`);
  game.start();
  game.sim(0.2);
  ok(maxDiff(game.get(`entity.${d.id}.pos`), d.pos) < 0.02 && maxDiff(game.get(`entity.${upper.id}.pos`), upper.pos) < 0.02, 'nová hra vrátí bedny na místo');
}

// ---- kostra: křídlo dveří při 90° = výsledek rigMatrices
const doorDef = level.entities.find((e) => e.id === 'e_door_start');
const door = entities.byId(doorDef.id);
const hinge = door.joints[0];
{
  ok(game.get('entity.e_door_start.joint') === (hinge.def.rest ?? hinge.def.min), 'hodnota kloubu se dá číst přes get', `entity.e_door_start.joint = ${game.get('entity.e_door_start.joint')}`);
  entities.setJoint(door, hinge, 90, true);
  E.stepOnce();
  const want = mat4Mul(entityMatrix(doorDef), rigMatrices(door.prefab, { [hinge.def.id]: 90 })[hinge.def.node]);
  const node = game.get(`entity.e_door_start.node.${hinge.def.node}`);
  ok(maxDiff(node, want) < 1e-9, 'matice křídla při 90° = entityMatrix · rigMatrices', `největší rozdíl ${maxDiff(node, want).toExponential(1)}`);
  const T = decompose(want, {});
  const body = game.get('entity.e_door_start.body');
  const dq = Math.min(maxDiff(body.rot, [T.qx, T.qy, T.qz, T.qw]), maxDiff(body.rot, [-T.qx, -T.qy, -T.qz, -T.qw]));
  ok(maxDiff(body.pos, [T.x, T.y, T.z]) < 1e-5 && dq < 1e-5, 'kinematické těleso křídla sedí na téže matici', `poloha ${fmt(body.pos, 3)}, čtveřice ${fmt(body.rot, 3)}`);
}

// ---- kolize na uzlech: zavřené dveře paprsek zastaví, otevřené pustí
{
  const sp = level.spawns.find((s) => s.kind === 'player');
  const ray = () => phys.raycast(sp.pos[0], 1.2, sp.pos[2], 0, 0, -1, 30, SIGHT_RAY);
  game.start();
  game.sim(0.1);
  const closed = ray();
  const c = closed && { dist: closed.dist, id: closed.ref?.ent?.id };
  entities.setJoint(door, hinge, hinge.def.max, true);
  game.sim(0.1);
  const open = ray();
  ok(c?.id === 'e_door_start' && open && open.dist > c.dist + 2 && open.ref?.ent?.id !== 'e_door_start', 'zavřené dveře paprsek zastaví, otevřené pustí', `zavřené ${fmt(c.dist, 2)} m (${c.id}), otevřené ${fmt(open.dist, 2)} m`);

  // a hráče také
  game.start();
  game.sim(0.2);
  game.sim(1.5, { hold: ['fwd'] });
  const blocked = player.pos[2];
  entities.setJoint(door, hinge, hinge.def.max, true);
  game.sim(1.5, { hold: ['fwd'] });
  ok(blocked > doorDef.pos[2] && player.pos[2] < doorDef.pos[2] - 1, 'zavřenými dveřmi hráč neprojde, otevřenými ano', `z = ${fmt(blocked, 2)} → ${fmt(player.pos[2], 2)} (dveře na z = ${doorDef.pos[2]})`);
}

// ---- od zavřených dveří se dá hned odejít (kinematické těleso v klidu by postavu drželo, proto je pevné)
{
  game.start();
  game.sim(0.2);
  game.sim(1.2, { hold: ['fwd'] });
  const at = player.pos[2];
  const pushing = Math.hypot(player.vel[0], player.vel[2]);
  game.sim(0.25, { hold: ['back'] });
  ok(player.pos[2] - at > 0.25 && pushing < 2, 'od zavřených dveří se dá hned couvnout', `za 0,25 s o ${fmt(player.pos[2] - at, 2)} m; do dveří tlačil ${fmt(pushing, 1)} m/s`);
}

// ---- pohon: rychlost z dat
{
  game.start();
  entities.drive(door, hinge, hinge.def.max);
  const t = (hinge.def.max - (hinge.def.rest ?? hinge.def.min)) / hinge.def.speed; // z klidové polohy (D-042: rest smí být uvnitř rozsahu)
  game.sim(t - 0.1);
  const mid = hinge.value;
  game.sim(0.1 + 2 * E.STEP);
  ok(mid < hinge.def.max && hinge.value === hinge.def.max && !hinge.active, 'pohon kloubu jede rychlostí z dat (speed)', `${hinge.def.speed}°/s: ${fmt(t, 3)} s na ${hinge.def.max}°, 0,1 s před koncem ${fmt(mid, 1)}°`);
  ok(game.get('entity.active').length === 0, 'kloub v klidu nestojí žádný výpočet', 'aktivních entit 0');
}

// ---- pružina: tlačítko se po puštění vrátí; zarážky: vypínač doskočí do krajní polohy
{
  const btn = entities.list.find((e) => e.joints[0]?.def.spring > 0);
  const j = btn.joints[0];
  entities.setJoint(btn, j, j.def.max, true);
  game.sim(0.1);
  const heldAt = j.value;
  entities.release(btn, j);
  let steps = 0;
  while (j.active && steps < 600) {
    E.stepOnce();
    steps++;
  }
  ok(heldAt === j.def.max && j.value === j.rest && steps < 120, 'pružina vrátí kloub do klidové polohy', `${btn.id}: ${j.def.max} → ${j.value} za ${steps} kroků`);

  const sw = entities.list.find((e) => e.joints[0]?.def.detents?.length === 2);
  const k = sw.joints[0];
  const [lo, hi] = k.def.detents;
  entities.setJoint(sw, k, lo + (hi - lo) * 0.7, true);
  entities.release(sw, k);
  game.sim(0.5);
  const up = k.value;
  entities.setJoint(sw, k, lo + (hi - lo) * 0.3, true);
  entities.release(sw, k);
  game.sim(0.5);
  ok(up === hi && k.value === lo, 'zarážky přitáhnou kloub do bližší polohy', `${sw.id}: ze 70 % do ${up}, ze 30 % do ${k.value}`);
  entities.setJoint(sw, k, 999, true);
  ok(k.value === k.def.max, 'kloub nejde vytáhnout z mezí', `${k.value}`);
}

// ---- uložení a obnova: stejný stav
{
  game.start();
  game.sim(0.3);
  entities.drive(door, hinge, hinge.def.max);
  entities.impulse(entities.byId(upper.id), 120, 0, 0);
  game.sim(0.4);
  const snap = E.snapshot();
  const a = JSON.stringify(E.snapshot().systems.entities);
  game.sim(1);
  E.restore(snap);
  const b = JSON.stringify(E.snapshot().systems.entities);
  const parse = (s) => JSON.parse(s).flatMap((e) => [...(e.j || []).flat(), ...(e.b || [])]).map((v) => v ?? 0);
  const d = maxDiff(parse(a), parse(b));
  ok(d < 1e-5, 'stav entit jde uložit a obnovit', `největší rozdíl ${d.toExponential(1)}`);
}

process.exit(h.finish('A1.4 entity a kostry (Node)'));
