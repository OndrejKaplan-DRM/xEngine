// A1.3 v Node: hráč a profily. Akceptační testy T1–T4 z Level 1 (10_CASE_FPS, oddíl 8) na zkušební dráze
// zlatého vzorku. Místa se hledají v datech levelu podle značek kvádrů (step, stair, gallery, ramp), ne z hlavy.
// Robot řídí hráče záměrem (držené akce, otočení ve stupních), stejně jako klávesnice a myš.

import { h, makeGame, fmt } from './a_lib/node.mjs';
import { wedgeRunRise } from '../src/xspace/index.js';
import { PROFILES } from '../src/play/profiles.js';

const { ok } = h;
const game = await makeGame();
const { E, player, input, session, world } = game;
const level = session.level;
const byTag = (tag) => level.brushes.filter((b) => b.tag === tag);
const cellOf = (id) => level.cells.find((c) => c.id === id);
const speed = () => Math.hypot(player.vel[0], player.vel[2]);
const pct = (x) => `${(x * 100).toFixed(1)} %`;

function fresh(profile) {
  session.setProfile(profile);
  game.start();
  game.sim(0.25);
}

/** Yaw (stupně), při kterém se hráč dívá z bodu a do bodu b. */
const yawTo = (a, b) => (Math.atan2(-(b[0] - a[0]), -(b[2] - a[2])) * 180) / Math.PI;

// ---- dráha po rovině: nejdelší volný pruh v hale hledat nebudu; beru pruh podél osy Z mezi sloupy a schodištěm
const hall = cellOf('c_hall').bounds;
const stairs = byTag('stair');
const laneX = Math.min(...stairs.map((b) => b.min[0])) - 0.8; // 0,8 m vlevo od schodiště
const laneStart = [laneX, 0, hall.max[2] - 1.1];

for (const id of Object.keys(PROFILES)) {
  const P = PROFILES[id];
  fresh(id);

  // stojí na podlaze a nikam neujíždí
  const p0 = [...player.pos];
  game.sim(1);
  ok(player.grounded && Math.abs(player.pos[1]) < 0.05 && Math.hypot(player.pos[0] - p0[0], player.pos[2] - p0[2]) < 1e-3, `${id}: stojí na podlaze výchozího místa`, `nohy y = ${fmt(player.pos[1])} m`);

  // T1: 2 s vpřed po rovině → rychlost = max ±5 %
  player.teleport(laneStart[0], laneStart[1], laneStart[2], 0);
  game.sim(0.2);
  game.sim(2, { hold: ['fwd'] });
  const v1 = speed();
  ok(Math.abs(v1 - P.maxSpeed) <= P.maxSpeed * 0.05, `${id} T1: rychlost po 2 s po rovině = max ±5 %`, `${fmt(v1, 2)} m/s, max ${fmt(P.maxSpeed, 2)} m/s, uběhl ${fmt(laneStart[2] - player.pos[2], 1)} m`);
  game.sim(1);
  ok(speed() < 0.01, `${id}: po puštění kláves zastaví (tření)`, `${fmt(speed(), 3)} m/s po 1 s`);

  // výskok: výška podle profilu (jumpSpeed² / 2g, minus půl kroku integrace)
  player.teleport(p0[0], 0, p0[2], 0);
  game.sim(0.2);
  let top = 0;
  input.hold('jump', true);
  for (let i = 0; i < 120; i++) {
    E.stepOnce();
    if (i === 0) input.hold('jump', false);
    top = Math.max(top, player.pos[1]);
  }
  const theory = P.jumpSpeed ** 2 / (2 * P.gravity);
  ok(Math.abs(top - theory) < theory * 0.05 && player.grounded, `${id}: výška výskoku odpovídá profilu`, `${fmt(top)} m, teorie ${fmt(theory)} m`);

  // T3: rozběh proti zdi při zrychleném čase 5× zůstane v místnosti
  const start = cellOf('c_start').bounds;
  player.teleport(p0[0], 0, p0[2], 180); // čelem k zadní zdi (+Z)
  input.hold('fwd', true);
  E.timeScale = 5;
  let steps = 0;
  for (let f = 0; f < 60; f++) steps += E.tick(1 / 60);
  E.timeScale = 1;
  input.hold('fwd', false);
  const inRoom = player.pos[0] > start.min[0] && player.pos[0] < start.max[0] && player.pos[2] > start.min[2] && player.pos[2] < start.max[2];
  ok(inRoom && steps === 600, `${id} T3: rozběh proti zdi při timeScale 5 zůstane v místnosti`, `${steps} kroků za 1 s, z = ${fmt(player.pos[2])} (zeď ${start.max[2]}, poloměr ${P.radius})`);

  // T4a: schod 0,3 m vyjde (z běhu i ze stoje těsně u čela)
  const step = byTag('step')[0];
  const sy = step.max[1];
  const sz = (step.min[2] + step.max[2]) / 2;
  player.teleport(step.max[0] + 2, 0, sz, 90); // čelem k −X
  game.sim(0.2);
  for (let i = 0; i < 240 && player.pos[0] > step.max[0] - 0.8; i++) game.sim(E.STEP, { hold: ['fwd'] }); // až 0,8 m za hranu
  ok(Math.abs(player.pos[1] - sy) < 0.05 && player.grounded, `${id} T4: schod ${sy} m vyjde z běhu`, `nohy y = ${fmt(player.pos[1])}, x = ${fmt(player.pos[0], 2)}`);
  player.teleport(step.max[0] + P.radius + 0.03, 0, sz, 90);
  game.sim(0.3);
  game.sim(0.4, { hold: ['fwd'] });
  ok(Math.abs(player.pos[1] - sy) < 0.05, `${id} T4: schod vyjde i ze stoje těsně u čela`, `nohy y = ${fmt(player.pos[1])}`);

  // T4b: rampa 30° vyjde, na rampě 50° sklouzne
  for (const ramp of byTag('ramp')) {
    const { angleDeg } = wedgeRunRise(ramp);
    const alongX = ramp.rise.endsWith('x');
    const sign = ramp.rise[0] === '+' ? 1 : -1;
    const mid = alongX ? (ramp.min[2] + ramp.max[2]) / 2 : (ramp.min[0] + ramp.max[0]) / 2;
    const low = alongX ? (sign > 0 ? ramp.min[0] : ramp.max[0]) : sign > 0 ? ramp.min[2] : ramp.max[2];
    const at = (d) => (alongX ? [low + sign * d, 0, mid] : [mid, 0, low + sign * d]); // d metrů od paty ve směru stoupání
    const from = at(-0.6); // 0,6 m před patou (rampa 30° má patu metr od zdi)
    const yaw = yawTo(from, at(1));
    const run = wedgeRunRise(ramp).run;
    player.teleport(from[0], 0, from[2], yaw);
    game.sim(0.2);
    const secs = 1.2 + run / P.maxSpeed;
    let maxY = 0;
    input.hold('fwd', true);
    for (let i = 0; i < secs / E.STEP && maxY < ramp.max[1] - 0.02; i++) {
      E.stepOnce();
      maxY = Math.max(maxY, player.pos[1]);
    }
    input.hold('fwd', false);
    if (angleDeg < 44) {
      ok(maxY > ramp.max[1] - 0.05, `${id} T4: rampa ${angleDeg.toFixed(0)}° vyjde`, `nohy y = ${fmt(maxY)}, vrchol ${ramp.max[1]}`);
    } else {
      ok(maxY < 0.3, `${id} T4: na rampu ${angleDeg.toFixed(0)}° nevyběhne`, `nejvýš y = ${fmt(maxY)} za ${fmt(secs, 1)} s tlačení`);
      const on = at(run * 0.6);
      player.teleport(on[0], ramp.max[1] * 0.6 + 0.3, on[2], yaw);
      game.sim(1.5);
      const awayFromFoot = alongX ? (player.pos[0] - low) * sign : (player.pos[2] - low) * sign;
      ok(player.pos[1] < 0.1 && player.grounded && awayFromFoot < 0.05, `${id} T4: z rampy ${angleDeg.toFixed(0)}° sklouzne na podlahu`, `nohy y = ${fmt(player.pos[1])}, ${fmt(-awayFromFoot, 2)} m před patou`);
    }
  }

  // běh po rovině neztrácí kroky (kontrolér s tlakem dolů vracel občas krok bez pohybu) a tlačení do rohu
  // postavu nestáhne pod podlahu (přichycení k zemi v Rapieru to v rohu dělá; hlídá pojistka v player.js)
  {
    player.teleport(laneStart[0], 0, laneStart[2], 0);
    game.sim(0.2);
    game.sim(1, { hold: ['fwd'] }); // rozběh na plnou rychlost
    const z0 = player.pos[2];
    game.sim(0.75, { hold: ['fwd'] });
    const ran = z0 - player.pos[2];
    ok(Math.abs(ran - P.maxSpeed * 0.75) < 0.02, `${id}: na rovině se neztratí ani krok`, `${fmt(ran)} m za 0,75 s, mělo být ${fmt(P.maxSpeed * 0.75)} m`);
    const b = cellOf('c_start').bounds;
    let minY = Infinity;
    for (const [cx, cz, yaw] of [[b.max[0] - 1, b.max[2] - 1, -135], [b.min[0] + 1, b.max[2] - 1, 135], [b.max[0] - 1, b.min[2] + 1, -45], [b.min[0] + 1, b.min[2] + 1, 45]]) {
      player.teleport(cx, 0, cz, yaw);
      game.sim(0.2);
      input.hold('fwd', true);
      for (let i = 0; i < 300; i++) {
        E.stepOnce();
        minY = Math.min(minY, player.pos[1]);
      }
      input.hold('fwd', false);
    }
    ok(minY > 0.005, `${id}: tlačení do rohů nestáhne postavu pod podlahu`, `nejnižší poloha nohou ${fmt(minY)} m ve čtyřech rozích`);
  }

  // sestup: po schodech i po rampě dolů zůstává na zemi (nelétá)
  {
    const gal = byTag('gallery')[0];
    const x = (stairs[0].min[0] + stairs[0].max[0]) / 2;
    const top = Math.min(...stairs.map((s) => s.min[2]));
    const bottom = Math.max(...stairs.map((s) => s.max[2]));
    player.teleport(x, gal.max[1], top - 1.2, 180); // na galerii, čelem ke schodům (+Z)
    game.sim(0.2);
    input.hold('fwd', true);
    let air = 0;
    let n = 0;
    for (let i = 0; i < 400 && player.pos[2] < bottom + 0.5; i++) {
      E.stepOnce();
      if (player.pos[2] > top && player.pos[2] < bottom) {
        n++;
        if (!player.grounded) air++;
      }
    }
    input.hold('fwd', false);
    ok(n > 10 && air === 0 && player.pos[1] < 0.05, `${id}: ze schodů sejde, neletí`, `${air} z ${n} kroků ve vzduchu`);
  }

  // schodiště na galerii: nohy v 1,5 m, bez ztráty rychlosti
  const gallery = byTag('gallery')[0];
  const sx = (stairs[0].min[0] + stairs[0].max[0]) / 2;
  const front = Math.max(...stairs.map((b) => b.max[2]));
  const back = Math.min(...stairs.map((b) => b.min[2]));
  player.teleport(sx, 0, front + 1.5, 0);
  game.sim(0.2);
  input.hold('fwd', true);
  let minOnStairs = Infinity;
  for (let i = 0; i < 400 && player.pos[2] > back - 1; i++) {
    E.stepOnce();
    if (player.pos[2] < front - 0.2 && player.pos[2] > back) minOnStairs = Math.min(minOnStairs, speed());
  }
  input.hold('fwd', false);
  ok(Math.abs(player.pos[1] - gallery.max[1]) < 0.05 && player.grounded, `${id}: vyjde schodiště na galerii`, `nohy y = ${fmt(player.pos[1])} m, galerie ${gallery.max[1]} m`);
  ok(minOnStairs > P.maxSpeed * 0.9, `${id}: na schodech neztrácí rychlost`, `nejméně ${fmt(minOnStairs, 2)} m/s z ${fmt(P.maxSpeed, 2)}`);
}

// ---- T2: série výskoků s úkrokem v profilu arena > 1,2 × max. Robot drží vpřed + úkrok + skok a otáčí pohled
// tak, aby směr přání svíral s rychlostí právě ten úhel, při kterém accelerate ještě přidává (klasický strafe-jump).
function strafeSeries(profile, jumps) {
  const P = PROFILES[profile];
  fresh(profile);
  player.teleport(laneStart[0], 0, laneStart[2], 0);
  game.sim(0.2);
  game.sim(0.5, { hold: ['fwd'] }); // rozběh
  let side = 1; // 1 = vpravo
  let landed = 0;
  let wasAir = false;
  let top = 0;
  const ws = P.airCap === null ? P.maxSpeed : Math.min(P.maxSpeed, P.airCap);
  const a = P.airAccel * ws * E.STEP;
  input.hold('fwd', true);
  input.hold('jump', true);
  for (let i = 0; i < 1200 && landed <= jumps; i++) {
    const v = speed();
    if (v > 0.5) {
      const yawV = (Math.atan2(-player.vel[0], -player.vel[2]) * 180) / Math.PI;
      const theta = (Math.acos(Math.max(-1, Math.min(1, (ws - a) / v))) * 180) / Math.PI;
      const wantYaw = side > 0 ? yawV - theta + 45 : yawV + theta - 45;
      let d = wantYaw - player.yaw;
      d -= Math.round(d / 360) * 360;
      input.turn(d);
    }
    input.hold('right', side > 0);
    input.hold('left', side < 0);
    if (!P.jumpHold) input.hold('jump', i % 2 === 0); // profil bez opakování: robot mačká skok ob krok
    E.stepOnce();
    if (!player.grounded) wasAir = true;
    else if (wasAir) {
      wasAir = false;
      landed++;
      side = -side; // po dopadu druhá strana, dráha zůstane zhruba rovná
    }
    top = Math.max(top, speed());
  }
  for (const k of ['fwd', 'jump', 'left', 'right']) input.hold(k, false);
  const inside = player.pos[0] > hall.min[0] && player.pos[0] < hall.max[0] && player.pos[2] > hall.min[2] && player.pos[2] < hall.max[2];
  return { top, P, inside, jumps: player.stat.jumps, dist: laneStart[2] - player.pos[2] };
}
{
  const r = strafeSeries('arena', 2);
  ok(r.top > 1.2 * r.P.maxSpeed && r.inside, 'arena T2: série výskoků s úkrokem > 1,2 × max', `nejvyšší rychlost ${fmt(r.top, 2)} m/s = ${pct(r.top / r.P.maxSpeed)} max, ${r.jumps} výskoky, ${fmt(r.dist, 1)} m`);
  const q = strafeSeries('real', 2);
  ok(q.top / q.P.maxSpeed < r.top / r.P.maxSpeed, 'real: stejný robot získá méně než v profilu arena (strop přání ve vzduchu)', `${pct(q.top / q.P.maxSpeed)} max proti ${pct(r.top / r.P.maxSpeed)}`);
}

// ---- přepnutí profilu za běhu a pohled
{
  fresh('level');
  ok(player.profile.id === level.profile, 'bez volby platí profil levelu', player.profile.id);
  const other = Object.keys(PROFILES).find((p) => p !== level.profile);
  session.setProfile(other);
  E.stepOnce();
  ok(player.profile.id === other && game.get('player.profile') === other, 'profil jde přepnout za běhu', `${level.profile} → ${other}`);
  session.setProfile('level');
  input.turn(0, 500);
  E.stepOnce();
  ok(player.pitch === 89, 'pitch je omezený na ±89°', String(player.pitch));
  input.look(100, 0); // 100 bodů myši vpravo
  E.stepOnce();
  ok(Math.abs(player.yaw - -8) < 1e-9, 'posun myši se násobí citlivostí, ne dt', `100 bodů = ${fmt(-player.yaw, 2)}° vpravo`);
  const snap = E.snapshot();
  game.sim(0.5, { hold: ['fwd', 'right'], yawRate: 90 });
  E.restore(snap);
  ok(JSON.stringify(E.snapshot().systems.player) === JSON.stringify(snap.systems.player), 'stav hráče jde uložit a obnovit');
  ok(world.actor.active && Math.abs(world.actor.max[1] - world.actor.min[1] - player.profile.height) < 1e-9, 'hráč hlásí světu svůj obal (pro spouštěče)');
}

process.exit(h.finish('A1.3 hráč a profily (Node)'));
