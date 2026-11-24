// A1.4 v Node, D-025: dveře a zásuvky na pohon nikoho nedrtí. Stojí-li jim v dráze hráč nebo volné těleso,
// zastaví se a po 0,5 s se vrátí tam, odkud vyjely. Polohy pro zkoušky se počítají z dat prefabu (rigMatrices),
// ne z pevných souřadnic; dveře se hledají podle druhu interakce a typu kloubu.

import { h, makeGame, loadPack, oneSidedDoors, fmt } from './a_lib/node.mjs';
import { rigMatrices, mat4Mul, mat4Point } from '../src/xspace/index.js';
import { BLOCK_RETURN } from '../src/world/blocking.js';

const { ok } = h;
// D-025 se zkouší na dveřích, které se otvírají do hráče: jednostranná kopie, ať má zlatý vzorek dveře jakkoli (D-042)
const [onePack] = oneSidedDoors(await loadPack());
const game = await makeGame({ pack: onePack });
const { E, entities, phys, player, io, session } = game;
const level = session.level;
const behave = game.behave;
const STEP = E.STEP;

const outs = [];
const fire = io.fire;
io.fire = (kind, index, output, value) => {
  if (kind === 'entity') outs.push({ id: entities.list[index].id, output, step: E.steps });
  return fire(kind, index, output, value);
};
const fired = (id, output) => outs.filter((o) => o.id === id && o.output === output).length;

const doors = entities.list.filter((e) => e.kind === 'door');
const hinged = doors.find((e) => e.joints[0].def.type === 'hinge');
const sliding = doors.find((e) => e.joints[0].def.type === 'slider');
const crate = entities.list.find((e) => e.body && e.prefab.components?.physics?.body === 'dynamic');
ok(!!hinged && !!sliding && !!crate, 'level má otočné dveře, posuvné dveře a volné těleso', `${hinged?.id}, ${sliding?.id}, ${crate?.id}`);

/** Střed kolize dílu s kloubem ve světě při dané hodnotě kloubu. */
function leafCenter(ent, value) {
  const j = ent.joints[0];
  const c = ent.prefab.colliders.find((k) => k.node === j.def.node);
  const M = rigMatrices(ent.prefab, { [j.def.id]: value });
  return mat4Point(mat4Mul(ent.em, M[j.def.node]), [(c.min[0] + c.max[0]) / 2, (c.min[1] + c.max[1]) / 2, (c.min[2] + c.max[2]) / 2]);
}
const floorOf = (ent) => level.cells.find((k) => k.id === ent.cell).bounds.min[1];
// bedna z dat: kolize kolem počátku tělesa (půdorysná polovina a výška počátku nad dnem)
const crateBox = crate.prefab.colliders[0];
const crateHalf = (crateBox.max[2] - crateBox.min[2]) / 2;
const crateLift = -crateBox.min[1];
const leafCol = (ent) => ent.movers.find((m) => m.guards).guards[0].col;
/** Nejmenší vzdálenost křídla od kolideru (záporná = průnik); null = dál než 1 m. */
const gap = (ent, col) => leafCol(ent).contactCollider(col, 1)?.distance ?? null;
const feet = () => [...game.get('player.pos')];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** Krokuje a sleduje kloub: nejmenší mezera k překážce, největší hodnota, kroky stání. */
function watch(ent, seconds, col) {
  const j = ent.joints[0];
  const r = { minGap: Infinity, top: j.value, low: j.value, trace: [] };
  for (let i = 0; i < Math.round(seconds / STEP); i++) {
    E.stepOnce();
    const g = col ? gap(ent, col) : null;
    if (g !== null && g < r.minGap) r.minGap = g;
    if (j.value > r.top) r.top = j.value;
    if (j.value < r.low) r.low = j.value;
    r.trace.push(j.value);
  }
  return r;
}

game.start();
game.sim(0.5);

// ---- 1. otočné dveře a stojící hráč
{
  const j = hinged.joints[0];
  const spot = leafCenter(hinged, 70);
  const rest = leafCenter(hinged, 0);
  player.teleport(spot[0], floorOf(hinged), spot[2]);
  game.sim(0.2);
  const p0 = feet();
  const stalled0 = game.get('entities.stat').stalled;
  ok(Math.hypot(p0[0] - rest[0], p0[2] - rest[2]) > 0.4, 'hráč stojí v dráze křídla, zavřeného křídla se nedotýká', `hráč ${fmt(p0, 2)}, střed zavřeného křídla ${fmt(rest, 2)}, mezera ${fmt(gap(hinged, player.collider) ?? 9, 3)} m`);
  behave.input(hinged, 'open');
  const a = watch(hinged, 0.4, player.collider);
  const stopAt = j.value;
  const b = watch(hinged, 0.05, player.collider);
  ok(stopAt > 1 && stopAt < 70 && b.top === stopAt && b.low === stopAt && game.get('entities.stat').stalled > stalled0, 'dveře se o stojícího hráče zastaví', `na ${fmt(stopAt, 2)}° ze ${j.def.max}°, stojí ${fmt(j.blocked, 3)} s`);
  ok(a.minGap > -0.003 && b.minGap > -0.003, 'křídlo do kapsle hráče nevnikne', `nejmenší mezera ${fmt(Math.min(a.minGap, b.minGap) * 1000, 2)} mm (dotyk se toleruje do −2 mm)`);
  // doba do obratu: od prvního kroku stání BLOCK_RETURN
  const firstStall = a.trace.findIndex((v, i) => i > 0 && v === a.trace[i - 1] && v > 0);
  const c = watch(hinged, 2, player.collider);
  const turn = c.trace.findIndex((v) => v < stopAt);
  const stoodFor = (a.trace.length - firstStall + b.trace.length + turn) * STEP;
  ok(j.value === 0 && !j.active && Math.abs(stoodFor - BLOCK_RETURN) <= 2 * STEP, 'po 0,5 s stání se dveře vrátí tam, odkud vyjely', `stály ${fmt(stoodFor, 3)} s, kloub ${j.value}°, closed ${fired(hinged.id, 'closed')}×, opened ${fired(hinged.id, 'opened')}×`);
  ok(dist(feet(), p0) < 0.001, 'hráče dveře neposunou', `posun ${fmt(dist(feet(), p0) * 1000, 3)} mm`);
  ok(fired(hinged.id, 'opened') === 0 && fired(hinged.id, 'closed') === 1, 'vrácené dveře ohlásí closed a nikdy opened');
}

// ---- 2. hráč uhne dřív než za 0,5 s: dveře pokračují
{
  const j = hinged.joints[0];
  const p = feet();
  behave.input(hinged, 'open');
  watch(hinged, 0.3, player.collider);
  const stopAt = j.value;
  const far = leafCenter(hinged, 0);
  player.teleport(far[0], floorOf(hinged), far[2] + 2); // na druhou stranu, mimo dráhu
  const r = watch(hinged, 1.5);
  ok(stopAt < 70 && j.value === j.def.max && fired(hinged.id, 'opened') === 1, 'uhne-li hráč do 0,5 s, dveře dojedou', `stály na ${fmt(stopAt, 2)}°, potom ${j.value}°`);
  void r;
  void p;
  behave.input(hinged, 'close');
  game.sim(1.5);
}

// ---- 3. volné těleso v dráze
{
  const j = hinged.joints[0];
  const spot = leafCenter(hinged, 70);
  crate.body.setTranslation(phys.vec(spot[0], floorOf(hinged) + crateLift + 0.02, spot[2]), true);
  crate.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  crate.body.setLinvel(phys.vec(0, 0, 0), true);
  crate.body.setAngvel(phys.vec(0, 0, 0), true);
  game.sim(1);
  const c0 = game.get(`entity.${crate.id}.pos`);
  const closedBefore = fired(hinged.id, 'closed');
  behave.input(hinged, 'open');
  const a = watch(hinged, 0.45, crate.colliders[0]);
  const stopAt = j.value;
  watch(hinged, 2, crate.colliders[0]);
  const c1 = game.get(`entity.${crate.id}.pos`);
  ok(stopAt > 1 && stopAt < 70 && j.value === 0 && fired(hinged.id, 'closed') === closedBefore + 1, 'dveře se zastaví o volné těleso a vrátí se', `bedna ${crate.id}: stály na ${fmt(stopAt, 2)}°, potom ${j.value}°`);
  ok(dist(c0, c1) < 0.02 && a.minGap > -0.004, 'bednu dveře neodtlačí ani nezmáčknou', `posun bedny ${fmt(dist(c0, c1) * 1000, 2)} mm, nejmenší mezera ${fmt(a.minGap * 1000, 2)} mm`);
}

// ---- 4. těleso opřené z druhé strany dveře neblokuje (průnik se pohybem neprohlubuje)
{
  const j = hinged.joints[0];
  const at0 = leafCenter(hinged, 0);
  const at70 = leafCenter(hinged, 70);
  // jednotkový směr od dráhy křídla (strana, kam se dveře neotvírají)
  const away = [at0[0] - at70[0], at0[2] - at70[2]];
  const len = Math.hypot(away[0], away[1]);
  // bedna se dotýká zavřeného křídla z odvrácené strany a vniká do něj o 3 mm (klidový dotyk s rezervou)
  const leafBox = hinged.prefab.colliders.find((k) => k.node === j.def.node);
  const off = crateHalf + (leafBox.max[2] - leafBox.min[2]) / 2 - 0.003;
  const dirZ = Math.sign(away[1]) || 1;
  crate.body.setTranslation(phys.vec(at0[0], floorOf(hinged) + crateLift + 0.001, at0[2] + dirZ * off), true);
  crate.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  crate.body.setLinvel(phys.vec(0, 0, 0), true);
  crate.body.setAngvel(phys.vec(0, 0, 0), true);
  E.stepOnce(); // kolider tělesa se na novou polohu dostane až krokem fyziky
  const g0 = gap(hinged, crate.colliders[0]);
  const opened = fired(hinged.id, 'opened');
  behave.input(hinged, 'open');
  game.sim(1.5);
  ok(g0 !== null && g0 < 0.0005 && j.value === j.def.max && fired(hinged.id, 'opened') === opened + 1, 'bedna opřená z druhé strany otevření nebrání', `mezera před otevřením ${fmt(g0 * 1000, 2)} mm, kloub ${j.value}°, směr ${fmt(away[1] / len, 2)}`);
  // zavření k téže bedně: zavřená poloha se bedny jen dotýká, dveře dojedou a bednu neposunou
  const c0 = game.get(`entity.${crate.id}.pos`);
  behave.input(hinged, 'close');
  game.sim(1.5);
  const c1 = game.get(`entity.${crate.id}.pos`);
  ok(j.value === 0 && dist(c0, c1) < 0.005, 'k bedně, které se zavřené křídlo jen dotýká, dveře dovřou', `kloub ${j.value}°, posun bedny ${fmt(dist(c0, c1) * 1000, 2)} mm`);
  // bedna přímo ve dveřích: zavírání se o ni zastaví a dveře se vrátí do otevřené polohy
  behave.input(hinged, 'open');
  game.sim(1.5);
  crate.body.setTranslation(phys.vec(at0[0], floorOf(hinged) + crateLift + 0.05, at0[2]), true);
  crate.body.setLinvel(phys.vec(0, 0, 0), true);
  game.sim(1);
  const c2 = game.get(`entity.${crate.id}.pos`);
  behave.input(hinged, 'close');
  const r = watch(hinged, 3, crate.colliders[0]);
  const c3 = game.get(`entity.${crate.id}.pos`);
  ok(j.value === j.def.max && r.low < j.def.max && r.low > 0 && dist(c2, c3) < 0.02, 'zavírání proti bedně ve dveřích: dveře se zastaví a vrátí do otevřené polohy', `nejníž ${fmt(r.low, 2)}°, potom ${j.value}°, posun bedny ${fmt(dist(c2, c3) * 1000, 2)} mm`);
  entities.reset();
  game.sim(0.5);
}

// ---- 5. posuvné dveře se zavírají na hráče ve dveřích
{
  const j = sliding.joints[0];
  behave.input(sliding, 'open');
  game.sim(1.5);
  const openedOk = j.value === j.def.max;
  const mid = leafCenter(sliding, 0);
  player.teleport(mid[0], floorOf(sliding), mid[2]);
  game.sim(0.2);
  const p0 = feet();
  behave.input(sliding, 'close');
  const a = watch(sliding, 0.4, player.collider);
  const stopAt = j.value;
  const b = watch(sliding, 2, player.collider);
  ok(openedOk && stopAt > 0 && stopAt < j.def.max && j.value === j.def.max, 'posuvné dveře se o hráče ve dveřích zastaví a znovu otevřou', `stály na ${fmt(stopAt, 3)} m z ${j.def.max} m, potom ${fmt(j.value, 3)} m`);
  ok(Math.min(a.minGap, b.minGap) > -0.003 && dist(feet(), p0) < 0.001, 'posuvné dveře hráče nezmáčknou ani neposunou', `nejmenší mezera ${fmt(Math.min(a.minGap, b.minGap) * 1000, 2)} mm, posun ${fmt(dist(feet(), p0) * 1000, 3)} mm`);
  // hráč odejde: zavřou se normálně
  const away = leafCenter(hinged, 0);
  player.teleport(away[0], floorOf(hinged), away[2] + 2);
  behave.input(sliding, 'close');
  game.sim(1.5);
  ok(j.value === 0, 'po odchodu hráče se posuvné dveře zavřou', `${j.value} m`);
}

// ---- 6. ruka hráče díl do hráče nezatlačí; stání se ukládá
{
  const j = hinged.joints[0];
  const spot = leafCenter(hinged, 70);
  player.teleport(spot[0], floorOf(hinged), spot[2]);
  game.sim(0.2);
  let last = 0;
  let refused = 0;
  for (let a = 2; a <= 90; a += 2) {
    if (entities.setJoint(hinged, j, a, true)) last = a;
    else refused++;
    E.stepOnce();
  }
  entities.release(hinged, j);
  ok(last > 0 && last < 70 && refused > 0 && gap(hinged, player.collider) > -0.003, 'dveře vedené rukou se o hráče zastaví také', `došly na ${last}°, odmítnuto ${refused} posunů, mezera ${fmt(gap(hinged, player.collider) * 1000, 2)} mm`);
  entities.setJoint(hinged, j, 0, false);
  game.sim(0.5);

  // uložení uprostřed stání: po obnovení dveře stojí stejně dlouho a vrátí se ve stejném kroku
  behave.input(hinged, 'open');
  watch(hinged, 0.35, player.collider);
  const snap = JSON.parse(JSON.stringify(E.snapshot()));
  const first = watch(hinged, 1.5).trace;
  E.restore(snap);
  const second = watch(hinged, 1.5).trace;
  const same = first.length === second.length && first.every((v, i) => v === second[i]);
  ok(same && j.value === 0, 'stání o překážku se ukládá: po obnovení stavu proběhne návrat ve stejném kroku', `${first.length} kroků, shoda ${same}`);
}

process.exit(h.finish('A1.4 zablokovaný pohyb, D-025 (Node)'));
