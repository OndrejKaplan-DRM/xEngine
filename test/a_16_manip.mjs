// A1.6 v Node: manipulace (držené tlačítko myši hýbe kloubem) a klidný režim u terminálu.
// Kritéria ze zadání: ventil na 50 % nastaví lampu laboratoře na poloviční svit; páka do krajní polohy vyšle on;
// odchod od terminálu vrátí kameru přesně na původní místo. Robot táhne myší směrem, který hra sama hlásí
// (interact.manip.screenDir), stejně jako by hráč sledoval pohyb úchopu na obrazovce.

import { h, makeGame, near, fmt } from './a_lib/node.mjs';

const { ok } = h;
const game = await makeGame();
const { E, entities, player, input, io, behave, interact, session, render } = game;
const level = session.level;
const get = (p) => game.get(p);
const joint = (id) => entities.byId(id).joints[0];

/** Postaví hráče d metrů před entitu (ve směru její přední strany), volitelně bokem, a namíří na ni nebo na bod. */
function face(id, d = 0.9, aim = null) {
  const ent = entities.byId(id);
  const c = entities.center(id);
  const fx = ent.em[8];
  const fz = ent.em[10];
  const len = Math.hypot(fx, fz) || 1;
  const floor = level.cells.find((k) => k.id === ent.cell).bounds.min[1];
  player.teleport(c[0] + (fx / len) * d, floor, c[2] + (fz / len) * d);
  const p = aim || c;
  player.lookAt(p[0], p[1], p[2]);
  game.sim(0.1);
}
/** Táhne myší po směru (sign = +1) nebo proti směru růstu kloubu, px bodů na krok, dokud stop() neřekne dost. */
function drag(sign, px, maxSteps, stop) {
  let n = 0;
  while (n < maxSteps) {
    const m = get('interact.manip');
    if (!m) break;
    input.look(m.screenDir[0] * px * sign, m.screenDir[1] * px * sign);
    E.stepOnce();
    n++;
    if (stop && stop()) break;
  }
  return n;
}
const grab = () => {
  input.hold('grab', true);
  E.stepOnce();
};
const drop = (settle = 0.5) => {
  input.hold('grab', false);
  game.sim(settle);
};
// všechny výstupy entit (i ty, na které v levelu nic nenavazuje)
const outs = [];
const fire = io.fire;
io.fire = (kind, index, output, value) => {
  if (kind === 'entity') outs.push({ id: entities.list[index].id, output, value, step: E.steps });
  return fire(kind, index, output, value);
};
const fired = (id, output) => outs.filter((o) => o.id === id && o.output === output);
let denied = 0;
E.on('interact:denied', () => denied++);

game.start();
game.sim(0.2);
behave.input(entities.byId('e_door_lab'), 'open'); // dveře laboratoře pustí lampu (spojení z dat)
game.sim(1.5);
ok(get('entity.e_lamp_lab.light').on && get('entity.e_lamp_lab.light').level === 1, 'lampa laboratoře svítí naplno (výchozí stav pro ventil)', JSON.stringify(get('entity.e_lamp_lab.light')));

// ---- ventil: tažením myši na 50 % → lampa laboratoře na poloviční svit
{
  face('e_valve');
  ok(get('interact.target') === 'e_valve' && get('interact.prompt').includes('táhni'), 'ventil je pod zaměřovačem a HUD nabízí i tažení', `„${get('interact.prompt')}“`);
  const yaw = get('player.yaw');
  const pitch = get('player.pitch');
  grab();
  ok(interact.manipulating && get('interact.manip').id === 'e_valve', 'držené tlačítko myši ventil uchopí', JSON.stringify(get('interact.manip')));
  const j = joint('e_valve');
  const steps = drag(+1, 2, 4000, () => j.norm >= 0.4995);
  const mid = get('entity.e_lamp_lab.light').level;
  ok(get('player.yaw') === yaw && get('player.pitch') === pitch, 'při tažení se pohled neotáčí', `yaw ${fmt(get('player.yaw'), 2)}°, pitch ${fmt(get('player.pitch'), 2)}°`);
  drop();
  const lamp = get('entity.e_lamp_lab.light');
  ok(near(j.norm, 0.5, 0.005) && lamp.level === j.norm && lamp.on, 'ventil na 50 % nastaví lampu laboratoře na poloviční svit', `ventil ${fmt(j.value, 1)}° = ${fmt(j.norm * 100, 2)} %, lampa ${fmt(lamp.level * 100, 2)} % (za tažení ${fmt(mid * 100, 1)} %), ${steps} kroků po 2 bodech = ${steps * 2} bodů myši`);
  ok(!interact.manipulating && input.lookEnabled, 'po puštění se pohled zase řídí myší');
  // zpět na nulu: výstup closed a lampa na 0
  face('e_valve');
  grab();
  drag(-1, 6, 4000, () => j.value <= 0);
  drop();
  ok(j.value === 0 && get('entity.e_lamp_lab.light').level === 0 && fired('e_valve', 'closed').length === 1, 'ventil dotažený na doraz ohlásí closed a lampa zhasne na 0 %', `closed ${fired('e_valve', 'closed').length}×, lampa ${get('entity.e_lamp_lab.light').level}`);
}

// ---- ventil přes vstup ze spojení: přesná polovina
{
  behave.input(entities.byId('e_valve'), 'setLevel', 0.5);
  game.sim(3.5);
  const lamp = get('entity.e_lamp_lab.light');
  ok(Math.abs(lamp.level - 0.5) < 1e-9, 'vstup setLevel 0,5 dá lampě přesně polovinu', `lampa ${lamp.level}, ventil ${joint('e_valve').value}°`);
}

// ---- ventil uchopený za obvod: myš musí opisovat kružnici (směr tažení se otáčí s kolem)
{
  const ent = entities.byId('e_valve');
  const M = ent.nodeWorld.wheel;
  const col = ent.prefab.colliders.find((c) => c.node === 'wheel');
  const rim = (col.max ? Math.min(col.max[0] - col.min[0], col.max[1] - col.min[1]) / 2 : col.radius) * 0.8;
  const p = [M[12] + M[4] * rim, M[13] + M[5] * rim, M[14] + M[6] * rim]; // bod na kole ve směru jeho místní osy Y
  face('e_valve', 0.9, p);
  const j = joint('e_valve');
  const from = j.value;
  grab();
  const d0 = get('interact.manip')?.screenDir;
  const n = drag(+1, 3, 600, () => j.value >= from + 180);
  const d1 = get('interact.manip')?.screenDir;
  drop();
  const turn = d0 && d1 ? (Math.acos(Math.max(-1, Math.min(1, d0[0] * d1[0] + d0[1] * d1[1]))) * 180) / Math.PI : 0;
  ok(j.value >= from + 180 && turn > 120, 'úchop za obvod kola: směr tažení se otáčí s kolem (půl otáčky kola = půl kružnice myší)', `kolo +${fmt(j.value - from, 0)}°, směr tažení se otočil o ${fmt(turn, 0)}° za ${n} kroků`);
}

// ---- páka: do krajní polohy vyšle on (hned na dorazu, ještě v ruce), zpět off
{
  face('e_lever');
  const j = joint('e_lever');
  const lampBefore = get('entity.e_lamp_hall_a.light').on;
  const y0 = entities.center('e_lever')[1];
  grab();
  const m = get('interact.manip');
  // směr na obrazovce: páka jde z horní polohy dolů, myš tedy taky dolů (kladné y myši)
  const n = drag(+1, 2, 2000, () => j.value >= j.def.max);
  const y1 = entities.center('e_lever')[1];
  const onWhileHeld = fired('e_lever', 'on').length;
  const stillHeld = interact.manipulating;
  drop();
  ok(j.value === j.def.max && onWhileHeld === 1 && stillHeld && fired('e_lever', 'on').length === 1, 'páka do krajní polohy vyšle on (jednou, hned na dorazu)', `kloub ${j.value}°, on ${fired('e_lever', 'on').length}×, ${n} kroků`);
  ok(!lampBefore && get('entity.e_lamp_hall_a.light').on, 'páka rozsvítí lampu haly A (spojení z dat)');
  ok(m.screenDir[1] > 0.9 && y1 < y0 - 0.02, 'úchop sleduje myš: myš dolů, rukojeť páky dolů', `směr tažení ${fmt(m.screenDir, 2)}, rukojeť ${fmt(y0)} → ${fmt(y1)} m`);
  ok(fired('e_lever', 'changed').length > 5, 'páka průběžně hlásí changed', `${fired('e_lever', 'changed').length}×`);
  // puštěná kousek od dorazu se vrátí na nejbližší zarážku a nic nepřepne
  face('e_lever');
  grab();
  drag(-1, 2, 2000, () => j.value <= 20);
  drop(0.6);
  ok(j.value === 40 && fired('e_lever', 'off').length === 0, 'páka puštěná blíž k zapnuté zarážce se do ní vrátí a nevyšle off', `kloub ${j.value}°`);
  face('e_lever');
  grab();
  drag(-1, 2, 2000, () => j.value <= -10);
  drop(0.8);
  ok(j.value === -40 && fired('e_lever', 'off').length === 1 && !get('entity.e_lamp_hall_a.light').on, 'páka puštěná za polovinou dojede na druhou zarážku, vyšle off a lampa zhasne', `kloub ${j.value}°, off ${fired('e_lever', 'off').length}×`);
}

// ---- zásuvka: myš k sobě vysouvá, meze platí
{
  face('e_cabinet');
  const j = joint('e_cabinet');
  grab();
  const m = get('interact.manip');
  drag(+1, 2, 2000, () => j.value >= j.def.max);
  const out = j.value;
  drag(+1, 6, 60); // tah za doraz nic nezmění
  drop();
  ok(out === j.def.max && j.value === j.def.max && fired('e_cabinet', 'opened').length === 1, 'zásuvka se tažením vysune na doraz a ohlásí opened jednou', `${j.value} m, opened ${fired('e_cabinet', 'opened').length}×`);
  ok(m.screenDir[0] === 0 && m.screenDir[1] > 0, 'zásuvka mířící k hráči: myš k sobě (dolů) vysouvá', `směr tažení ${fmt(m.screenDir, 2)}`);
  face('e_cabinet');
  grab();
  drag(-1, 2, 2000, () => j.value <= 0);
  drop();
  ok(j.value === 0 && fired('e_cabinet', 'closed').length === 1, 'zásuvka se zasune a ohlásí closed', `${j.value} m`);
}

// ---- křídlo dveří: tažením, zamčené uchopit nejde
{
  face('e_door_start', 1.2);
  const j = joint('e_door_start');
  grab();
  drag(+1, 3, 3000, () => j.value >= 60);
  drop();
  ok(j.value >= 60 && j.value < 105 && !joint('e_door_start').active, 'křídlo dveří jde pootevřít rukou a zůstane stát, kde ho hráč pustil', `kloub ${fmt(j.value, 1)}°`);
  behave.input(entities.byId('e_door_start'), 'close');
  game.sim(1.2);
  behave.input(entities.byId('e_door_start'), 'lock');
  face('e_door_start', 1.2);
  const before = denied;
  grab();
  const held = interact.manipulating;
  drop(0.1);
  ok(!held && denied === before + 1 && j.value === 0, 'zamčené dveře uchopit nejde (interact:denied)', `kloub ${j.value}°`);
  behave.input(entities.byId('e_door_start'), 'unlock');
}

// ---- vstup, který nic nemění, nic neohlásí (dvě křídla spojená do kruhu opened → open se nesmí budit navzájem)
{
  const d = entities.byId('e_door_start');
  behave.input(d, 'open');
  game.sim(1.2);
  const n = fired('e_door_start', 'opened').length;
  behave.input(d, 'open');
  game.sim(0.5);
  ok(n >= 1 && fired('e_door_start', 'opened').length === n && !d.joints[0].active, 'open na otevřené dveře nevyšle druhé opened', `opened ${fired('e_door_start', 'opened').length}×`);
  behave.input(d, 'close');
  game.sim(1.2);
}

// ---- terminál: klidný režim
{
  face('e_desk', 1.0);
  ok(get('interact.target') === 'e_desk', 'terminál je pod zaměřovačem', `„${get('interact.prompt')}“`);
  E.tick(0);
  const before = { ...render.view };
  const pos = [...player.pos];
  const st = entities.byId('e_desk').interact.station;
  let seated = 0;
  let left = 0;
  E.on('interact:seated', () => seated++);
  E.on('interact:left', () => left++);
  input.use();
  E.stepOnce();
  ok(interact.seated && seated === 1 && fired('e_desk', 'used').length === 1 && !input.lookEnabled, '„použít“ u terminálu přepne do klidného režimu', JSON.stringify(get('interact.seat')));
  game.sim(0.2);
  E.tick(0);
  const half = { ...render.view };
  game.sim(0.3);
  E.tick(0);
  const seat = get('interact.seat');
  const v = render.view;
  ok(seat.phase === 'on' && near(v.x, seat.eye[0], 1e-9) && near(v.y, seat.eye[1], 1e-9) && near(v.z, seat.eye[2], 1e-9) && render.fov === st.fov, 'kamera se plynule ukotví podle station', `oko ${fmt(seat.eye, 2)}, zorné pole ${render.fov}°, v polovině cesty y ${fmt(half.y)} (mezi ${fmt(before.y)} a ${fmt(seat.eye[1])})`);
  ok(half.y < before.y && half.y > seat.eye[1], 'přejezd kamery je plynulý (mezipoloha leží mezi začátkem a koncem)');
  // vlastní kurzor (zámek kurzoru zůstává, D-024): začíná uprostřed obrazovky, myš ho vede, okraj ho zastaví
  const p0 = [...get('interact.term.e_desk').pointer];
  const p1 = [...interact.cursor(70, 0)];
  const p2 = [...interact.cursor(5000, -5000)];
  const p3 = [...interact.cursor(-10000, 10000)];
  ok(near(p0[0], 0.5, 1e-9) && near(p0[1], 0.5, 1e-9) && near(p1[0], 0.6, 1e-9) && p1[1] === 0.5 && p2[0] === 1 && p2[1] === 0 && p3[0] === 0 && p3[1] === 1, 'myš vede vlastní kurzor po obrazovce terminálu a obdélník obrazovky ho omezuje', `střed ${fmt(p0, 2)}, po 70 bodech vpravo ${fmt(p1, 2)}, rohy ${fmt(p2, 0)} a ${fmt(p3, 0)}`);
  // bez zámku kurzoru (prostředí, kde ho prohlížeč nedá): kurzor systému se promítá na obrazovku
  const uv = interact.pointer(0, 0);
  ok(uv && near(uv[0], 0.5, 0.02) && near(uv[1], 0.5, 0.05), 'bez zámku: kurzor uprostřed obrazu míří na střed obrazovky terminálu', uv ? `uv ${fmt(uv, 3)}` : 'mimo');
  ok(interact.pointer(0.98, 0.98) === null, 'bez zámku: kurzor mimo plochu obrazovky se nepočítá');
  // tělo stojí
  const yawSeat = get('player.yaw');
  game.sim(0.5, { hold: ['fwd', 'jump'], yawRate: 90 });
  E.tick(0);
  ok(player.pos.every((x, i) => x === pos[i]) && get('player.yaw') === yawSeat && render.view.x === seat.eye[0] && render.view.yaw === (seat.yaw * Math.PI) / 180, 'u terminálu tělo stojí a pohled se neotáčí', `poloha ${fmt(player.pos)}`);
  // psaní a příkaz
  const lampBefore = get('entity.e_lamp_hall_a.light').on;
  for (const ch of 'svetlo') interact.type(ch);
  interact.key('Backspace');
  interact.type('a');
  ok(get('interact.term.e_desk').input === 'svetla', 'psaní na klávesnici jde na obrazovku terminálu', `„${get('interact.term.e_desk').input}“`);
  interact.key('Enter');
  game.sim(0.1);
  const cmd = fired('e_desk', 'command');
  ok(cmd.length === 1 && cmd[0].value === 'svetla' && get('entity.e_lamp_hall_a.light').on === !lampBefore && get('interact.term.e_desk').lines.at(-1) === '> svetla', 'Enter vyšle výstup command s textem a spojení z dat přepne lampu haly', `command „${cmd[0]?.value}“, lampa ${lampBefore} → ${get('entity.e_lamp_hall_a.light').on}`);
  interact.cursor(10, 10);
  const clicked = interact.click();
  game.sim(0.1);
  ok(clicked && fired('e_desk', 'command').length === 2 && get('entity.e_lamp_hall_a.light').on === lampBefore, 'kliknutí v místě vlastního kurzoru vyšle command', `command ${fired('e_desk', 'command').length}×`);
  behave.input(entities.byId('e_desk'), 'print', 'Tlak v normě');
  ok(get('interact.term.e_desk').lines.at(-1) === 'Tlak v normě', 'vstup print vypíše řádek na obrazovku', JSON.stringify(get('interact.term.e_desk').lines));
  // odchod
  interact.leave();
  ok(left === 1 && fired('e_desk', 'left').length === 1, 'odchod (leave) vyšle výstup left a událost interact:left');
  game.sim(0.2);
  ok(interact.seated, 'návrat kamery chvíli trvá (hráč ještě nemá ovládání)');
  game.sim(0.3);
  E.tick(0);
  const after = { ...render.view };
  const same = ['x', 'y', 'z', 'yaw', 'pitch'].every((k) => after[k] === before[k]);
  ok(!interact.seated && same && render.fov === render.baseVfov && input.lookEnabled, 'odchod od terminálu vrátí kameru přesně na původní místo', `před ${fmt([before.x, before.y, before.z])} yaw ${fmt(before.yaw, 4)}, po ${fmt([after.x, after.y, after.z])} yaw ${fmt(after.yaw, 4)}, zorné pole ${render.fov}°`);
  game.sim(0.5, { hold: ['back'] });
  ok(Math.hypot(player.pos[0] - pos[0], player.pos[2] - pos[2]) > 0.3, 'po odchodu se hráč zase hýbe', `posun ${fmt(Math.hypot(player.pos[0] - pos[0], player.pos[2] - pos[2]))} m`);
}

// ---- uložení a nahrání uprostřed klidného režimu a úchopu nenechá hráče zamrzlého
{
  face('e_desk', 1.0);
  const snap = E.snapshot();
  input.use();
  E.stepOnce();
  game.sim(0.5);
  const wasSeated = interact.seated;
  E.restore(snap);
  game.sim(0.1);
  ok(wasSeated && !interact.seated && !player.frozen && !player.viewOverride && input.lookEnabled, 'nahrání pozice z klidného režimu vrátí ovládání hráči');
  const pos = [...player.pos];
  game.sim(0.4, { hold: ['back'] });
  ok(Math.hypot(player.pos[0] - pos[0], player.pos[2] - pos[2]) > 0.2, 'po nahrání se hráč hýbe');
}

// ---- krátké ťuknutí klávesy mezi dvěma kroky se neztratí
{
  face('e_switch_start');
  const on = get('entity.e_lamp_start.light').on;
  input.key('KeyE', true);
  input.key('KeyE', false); // stisk i puštění dřív, než proběhl jediný krok
  game.sim(0.4);
  ok(get('entity.e_lamp_start.light').on === !on, 'ťuknutí kratší než jeden snímek „použít“ provede', `lampa ${on} → ${get('entity.e_lamp_start.light').on}`);
}

process.exit(h.finish('A1.6 manipulace a klidný režim (Node)'));
