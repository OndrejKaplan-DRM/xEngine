// A3.1 v Node: zkouška zbraní na plazmové pušce zlatého vzorku (N-201, D-053, dodatek znění 9). Robot sebere pušku,
// trefí terč (výstup hit přepne lampu), nabitá koule odhodí bednu s Δv podle pushDelta a bedna za zdí se nehne,
// zničení s breakInto na kopii prefabu, události deklarované, ústí za zdí, přiblížení, uložení střely v letu.

import { h, makeGame, loadPack, fmt } from './a_lib/node.mjs';
import { pushDelta, rampValue } from '../src/xspace/index.js';
import { cameraVfov } from '../src/render/fov.js';
import { settingsDefs } from '../src/app/settings.js';
import { ACTIONS } from '../src/play/actions.js';

const { ok } = h;
const RAD = Math.PI / 180;
const base = await loadPack();
const W = base.weapons.find((w) => w.data.id === 'plasma_rifle_01').data;

// ---- kopie zlatého vzorku: bedna na volném místě, bedna za zdí, slabá bedna s troskami
const pack = structuredClone(base);
const L = pack.levels[0].data;
const crate = pack.prefabs.find((p) => p.data.id === 'crate_wood_01').data;
const weak = structuredClone(crate);
weak.id = 'crate_weak_09';
weak.components.health = { hp: 5, surface: 'wood', breakInto: 'crate_debris_09' };
weak.outputs = ['hit', 'destroyed'];
const debris = structuredClone(crate);
debris.id = 'crate_debris_09';
debris.title = 'Trosky bedny (zkouška)';
debris.parts = debris.parts.slice(0, 1);
delete debris.components.health;
pack.prefabs.push({ file: 'prefabs/crate_weak_09.json', data: weak }, { file: 'prefabs/crate_debris_09.json', data: debris });
pack.manifest.prefabs.push('prefabs/crate_weak_09.json', 'prefabs/crate_debris_09.json');
L.entities.push(
  { id: 'e_crate_open', prefab: 'crate_wood_01', cell: 'c_start', pos: [1, 0, 3], rot: [0, 0, 0] }, // 3 m od výbuchu: přežije (100 hp)
  { id: 'e_crate_behind', prefab: 'crate_wood_01', cell: 'c_store', pos: [1, 0, -2.7], rot: [0, 0, 0] },
  { id: 'e_crate_weak', prefab: 'crate_weak_09', cell: 'c_hall', pos: [-3, 0, -12], rot: [0, 0, 0] },
);

const game = await makeGame({ pack });
const { E, entities, player, input, weapons, behave } = game;
const get = (p) => game.get(p);
const level = game.session.level;
const events = [];
const copy = (name) => (e) => events.push({ name, ...JSON.parse(JSON.stringify(e)) });
for (const n of ['weapon:fired', 'weapon:switched', 'combat:hit', 'combat:exploded', 'combat:destroyed', 'combat:noise']) E.on(n, copy(n));
const count = (n) => events.filter((e) => e.name === n).length;

function face(id, d = 0.9) {
  const ent = entities.byId(id);
  const c = entities.center(id);
  const fx = ent.em[8];
  const fz = ent.em[10];
  const len = Math.hypot(fx, fz) || 1;
  player.teleport(c[0] + (fx / len) * d, level.cells.find((k) => k.id === ent.cell).bounds.min[1], c[2] + (fz / len) * d);
  player.lookAt(c[0], c[1], c[2]);
  game.sim(0.1);
}
const step = (n = 1) => {
  for (let i = 0; i < n; i++) E.stepOnce();
};

game.start();
game.sim(0.2);

// ---- události deklarované (nedeklarovaná by shodila běh)
{
  const decl = new Map(E.eventList().map((e) => [e.event, e.owner]));
  const want = { 'weapon:fired': 'weapons', 'weapon:switched': 'weapons', 'combat:hit': 'combat', 'combat:exploded': 'combat', 'combat:destroyed': 'combat', 'combat:noise': 'combat' };
  ok(Object.entries(want).every(([e, o]) => decl.get(e) === o), 'šest událostí boje deklarují systémy weapons a combat', Object.keys(want).map((e) => `${e}→${decl.get(e)}`).join(', '));
}

// ---- sebrání: zbraň a 40 článků
{
  ok(get('weapons.current') === null && game.render.viewModel === null, 'na začátku bez zbraně a bez modelu v ruce');
  face('e_plasma', 0.5);
  ok(get('interact.target') === 'e_plasma', 'puška na zemi je pod zaměřovačem', get('interact.prompt'));
  input.use();
  step();
  game.sim(0.1);
  ok(get('weapons.current') === 'plasma_rifle_01' && get('weapons.ammo.cells') === 40 && !entities.byId('e_plasma').state.enabled, 'robot sebere pušku u startu: má ji v ruce a 40 článků', `${get('weapons.current')}, ${JSON.stringify(get('weapons.ammo'))}`);
  ok(count('weapon:switched') === 1 && game.render.viewModel?.visible && game.render.counts.viewTris > 0, 'weapon:switched a model v ruce (druhý průchod)', `${game.render.counts.viewTris} △`);
}

// ---- hlavní střelba: 10 ran/s, terč, hit přepne lampu haly B
{
  player.teleport(3, 0, -16);
  const disc = [3, 1.45, -27.5 + 0.022];
  player.lookAt(...disc);
  game.sim(0.1);
  const lamp = () => get('entity.e_lamp_hall_b.light').on;
  const before = lamp();
  events.length = 0;
  input.hold('grab', true);
  step(1);
  input.hold('grab', false);
  game.sim(0.6);
  const hit = events.find((e) => e.name === 'combat:hit');
  ok(count('weapon:fired') === 1 && hit?.target === 'e_target', 'jedna rána z pušky trefí terč (combat:hit s cílem e_target)', `${count('weapon:fired')} výstřel, zásah ${hit?.target} v [${hit?.point.map((v) => v.toFixed(2))}]`);
  ok(lamp() !== before, 'výstup hit terče přepne lampu e_lamp_hall_b (spojení ze zlatého vzorku)', `${before} → ${lamp()}`);
  ok(get('weapons.ammo.cells') === 40 - (W.primary.cost ?? 1), 'rána stojí jeden článek', String(get('weapons.ammo.cells')));
  const ex = events.find((e) => e.name === 'combat:exploded');
  ok(ex && Math.abs(ex.radius - W.primary.splash.radius) < 1e-9 && count('combat:noise') >= 2, 'hlavní střela má malý výbuch v místě dopadu a hluk výstřelu i výbuchu', `r ${ex?.radius}, hluk ${count('combat:noise')}×`);
  const d = get('weapons.last').dir;
  const aim = get('weapons.last').aim;
  const ang = Math.acos(Math.min(1, d[0] * aim[0] + d[1] * aim[1] + d[2] * aim[2])) / RAD;
  ok(ang <= W.primary.spread + 1e-9 && ang > 0, `směr střely leží v kuželi rozptylu ${W.primary.spread}° kolem bodu pod zaměřovačem`, `${fmt(ang, 3)}°`);
  // držené tlačítko: 10 ran za sekundu
  events.length = 0;
  const shots0 = get('weapons.stat').primary;
  game.sim(1, { hold: ['grab'] });
  const shots = get('weapons.stat').primary - shots0;
  ok(shots === Math.round(1 / W.primary.cooldown), `držené tlačítko: ${Math.round(1 / W.primary.cooldown)} ran za sekundu (cooldown v krocích)`, `${shots} ran za 120 kroků`);
  game.sim(0.6);
}

// ---- rozptyl jen přes rngNext: stejný začátek = stejné směry
{
  const run = () => {
    game.start();
    game.sim(0.1);
    weapons.give('plasma_rifle_01', 40);
    player.teleport(3, 0, -16);
    player.lookAt(3, 1.45, -27.5);
    const dirs = [];
    for (let i = 0; i < 5; i++) {
      game.sim(W.primary.cooldown, { hold: ['grab'] });
      dirs.push(get('weapons.last').dir.map((v) => v.toFixed(9)).join());
    }
    return dirs;
  };
  const a = run();
  const b = run();
  ok(a.join('|') === b.join('|') && new Set(a).size === a.length, 'rozptyl je deterministický (rngNext ze stavu hry) a rány se liší', `${new Set(a).size} různých směrů, běhy ${a.join('|') === b.join('|') ? 'shodné' : 'RŮZNÉ'}`);
}

// ---- druhé tlačítko: nabíjení a samovolný výstřel
{
  game.start();
  game.sim(0.1);
  weapons.give('plasma_rifle_01', 40);
  player.teleport(3, 0, -16);
  player.lookAt(3, 1, -27.5);
  input.hold('alt', true);
  game.sim(1);
  const k1 = get('weapons.charge');
  game.sim(1.7);
  input.hold('alt', false);
  const last = get('weapons.last');
  const steps = get('weapons.stat').alt;
  ok(Math.abs(k1 - 0.5) < 0.01, 'po 1 s držení je nabití 0,5 (plně za 2 s)', fmt(k1, 3));
  ok(steps === 1 && last.k === 1 && last.cost === Math.round(rampValue(W.alt.cost, 1)) && get('weapons.ammo.cells') === 40 - last.cost, `držení přes ${W.alt.charge.release} s vystřelí samo, plně nabité, za ${Math.round(rampValue(W.alt.cost, 1))} článků`, `výstřelů ${steps}, nabití ${last.k}, cena ${last.cost}, zbývá ${get('weapons.ammo.cells')}`);
  game.sim(1);
}

// ---- výbuch nabité koule: bedna odhozená podle pushDelta, bedna za zdí v klidu
{
  game.start();
  game.sim(0.5); // bedny dosednou
  weapons.give('plasma_rifle_01', 40);
  const open = entities.byId('e_crate_open');
  const behind = entities.byId('e_crate_behind');
  const posB = get('entity.e_crate_behind.pos');
  player.teleport(1, 0, 4.2, 0, 0);
  player.lookAt(1, 1, 0);
  game.sim(0.1);
  events.length = 0;
  // Δv přímo v okamžiku impulsu (Rapier mění rychlost hned); po kroku fyziky by ho zkreslilo tření o podlahu
  let dv = null;
  const imp0 = entities.impulse;
  entities.impulse = (ent, x, y, z) => {
    const a = ent.body.linvel();
    imp0(ent, x, y, z);
    const b = ent.body.linvel();
    if (ent === open) dv = [b.x - a.x, b.y - a.y, b.z - a.z];
  };
  input.hold('alt', true);
  game.sim(2.05);
  input.hold('alt', false);
  let exp = null;
  for (let i = 0; i < 120 && !exp; i++) {
    step();
    exp = events.find((e) => e.name === 'combat:exploded');
  }
  entities.impulse = imp0;
  const k = get('weapons.last').k;
  const v = open.body.linvel();
  const hpAfter = open.state.hp;
  const m = open.body.mass();
  const c = get('entity.e_crate_open.pos');
  // poloha bedny při výbuchu: po jednom kroku fyziky se posune o v × krok, vrátit
  const at = [c[0] - v.x * E.STEP, c[1] - v.y * E.STEP, c[2] - v.z * E.STEP];
  const dist = Math.hypot(at[0] - exp.pos[0], at[1] - exp.pos[1], at[2] - exp.pos[2]);
  const want = pushDelta(rampValue(W.alt.splash.push, k), dist, rampValue(W.alt.splash.radius, k), m);
  const got = dv ? Math.hypot(...dv) : 0;
  const wantH = want;
  const away = dv ? (dv[0] * (at[0] - exp.pos[0]) + dv[1] * (at[1] - exp.pos[1]) + dv[2] * (at[2] - exp.pos[2])) / (got * dist) : 0;
  const dmg = rampValue(W.alt.splash.damage, k) * (1 - dist / rampValue(W.alt.splash.radius, k));
  ok(Math.abs(100 - hpAfter - dmg) < 0.5, 'bedna ztratí hp podle poškození výbuchu a vzdálenosti', `${fmt(100 - hpAfter, 1)} proti ${fmt(dmg, 1)}`);
  ok(exp && k > 0.99 && Math.abs(got - wantH) / wantH < 0.05 && away > 0.999, 'nabitá koule odhodí bednu: Δv = pushDelta do 5 %, směr od středu výbuchu', `nabití ${fmt(k, 2)}, d ${fmt(dist, 2)} m, r ${fmt(rampValue(W.alt.splash.radius, k), 2)} m, m ${fmt(m, 1)} kg: Δv ${fmt(got, 3)} proti ${fmt(wantH, 3)} m/s, směr ${fmt(away, 4)}; po kroku fyziky vodorovně ${fmt(Math.hypot(v.x, v.z), 2)} m/s`);
  ok(Math.hypot(v.x, v.z) > 1, 'bedna po výbuchu opravdu letí (i po kroku fyziky s třením)', `${fmt(Math.hypot(v.x, v.z), 2)} m/s`);
  const pb = get('entity.e_crate_behind.pos');
  const vb = behind.body.linvel();
  const distB = Math.hypot(pb[0] - exp.pos[0], pb[1] + 0.4 - exp.pos[1], pb[2] - exp.pos[2]);
  ok(distB < rampValue(W.alt.splash.radius, k) && Math.hypot(vb.x, vb.y, vb.z) < 1e-3 && Math.hypot(pb[0] - posB[0], pb[2] - posB[2]) < 1e-3 && get('combat.stat').covered >= 1, 'bedna za zdí v dosahu výbuchu se nehne (kryt paprskem přes kvádry)', `vzdálenost ${fmt(distB, 2)} m, rychlost ${fmt(Math.hypot(vb.x, vb.y, vb.z), 4)} m/s, krytých ${get('combat.stat').covered}`);
  game.sim(1);
}

// ---- zásah entity s health: hit, destroyed, breakInto
{
  game.start();
  game.sim(0.5);
  weapons.give('plasma_rifle_01', 40);
  const w = entities.byId('e_crate_weak');
  const dbr = entities.byId('e_crate_weak~break');
  ok(dbr && !dbr.state.enabled && w.state.hp === 5, 'trosky breakInto čekají vypnuté od načtení; slabá bedna má 5 hp', `${dbr?.id} enabled=${dbr?.state.enabled}`);
  const p = get('entity.e_crate_weak.pos');
  player.teleport(p[0], 0, p[2] - 4, 180, 0);
  player.lookAt(p[0], p[1] + 0.4, p[2]);
  game.sim(0.1);
  events.length = 0;
  const outs = [];
  E.on('io:fired', () => {});
  const fire0 = game.io.fire;
  game.io.fire = (kind, index, output, value, from) => {
    if (kind === 'entity' && entities.list[index] === w) outs.push(output);
    return fire0(kind, index, output, value, from);
  };
  input.hold('grab', true);
  step();
  input.hold('grab', false);
  game.sim(0.4);
  game.io.fire = fire0;
  const des = events.find((e) => e.name === 'combat:destroyed');
  ok(des?.target === 'e_crate_weak' && !w.state.enabled && w.state.hp <= 0 && outs.join() === 'hit,destroyed', 'zásah za 12 ubere 5 hp: výstupy hit a destroyed, combat:destroyed, bedna zmizí i s kolizí', `hp ${w.state.hp}, výstupy ${outs.join()}`);
  const dp = get('entity.e_crate_weak~break.pos');
  ok(dbr.state.enabled && Math.hypot(dp[0] - p[0], dp[2] - p[2]) < 0.3, 'na jejím místě jsou trosky (breakInto)', `[${dp.map((v) => v.toFixed(2))}]`);
  game.start();
  ok(w.state.enabled && w.state.hp === 5 && !dbr.state.enabled, 'nová hra: bedna zpět, trosky schované');
}

// ---- ústí za zdí: střela z oka; volně z ústí
{
  game.start();
  game.sim(0.1);
  weapons.give('plasma_rifle_01', 40);
  player.teleport(3, 0, 5.5, 0, 0); // 0,5 m od zadní stěny startu (z = 6), pohled do místnosti
  game.sim(0.1);
  game.sim(W.primary.cooldown, { hold: ['grab'] });
  const free = get('weapons.last');
  const mz = get('weapons.muzzle');
  ok(!free.fromEye && Math.hypot(free.origin[0] - mz[0], free.origin[1] - mz[1], free.origin[2] - mz[2]) < 1e-6, 'volný výstřel vychází z ústí zbraně v ruce', `[${free.origin.map((v) => v.toFixed(2))}]`);
  player.teleport(1, 0, 0.45, 0, 0); // čelem ke zdi startu (z = 0, mimo dveře), 0,45 m: ústí 0,86 m před okem leží ve zdi
  game.sim(0.2);
  game.sim(W.primary.cooldown, { hold: ['grab'] });
  const wall = get('weapons.last');
  ok(wall.fromEye && wall.origin[2] > 0.1, 'u zdi (ústí za zdí) vychází střela z oka', `ústí ${get('weapons.muzzle').map((v) => v.toFixed(2))}, start [${wall.origin.map((v) => v.toFixed(2))}]`);
  game.sim(0.5);
}

// ---- levé tlačítko se zbraní: ovladač pod zaměřovačem se chytá, nestřílí se
{
  game.start();
  game.sim(0.1);
  weapons.give('plasma_rifle_01', 40);
  face('e_valve');
  const shots0 = get('weapons.stat').fired;
  input.hold('grab', true);
  step(3);
  const grabbed = game.interact.manipulating;
  input.hold('grab', false);
  step(2);
  ok(grabbed && get('weapons.stat').fired === shots0, 'se zbraní v ruce levé tlačítko nad ventilem ventil uchopí a nestřílí', `uchopeno ${grabbed}, výstřelů ${get('weapons.stat').fired - shots0}`);
}

// ---- přiblížení: výchozí přepínat (Ondřej 27. 11.), nastavení „držet“; apply / probe
{
  step(); // po výběru zbraně
  const zoomV = cameraVfov(W.zoom.fov, game.render.aspect);
  const baseV = game.render.baseVfov;
  const def = settingsDefs({ game, dev: false }).find((s) => s.id === 'zoomMode');
  const press = () => {
    input.hold('zoom', true);
    step();
    input.hold('zoom', false);
    step(3);
    return game.render.fov;
  };
  const on = press();
  const off = press();
  ok(def.def === 'toggle' && weapons.zoomMode === 'toggle' && Math.abs(on - zoomV) < 1e-9 && Math.abs(off - baseV) < 1e-9, `výchozí přepínat: stisk Z přiblíží na ${W.zoom.fov}° vodorovně při 4 : 3 (jako nastavení zorného pole), další stisk vrátí`, `${fmt(on, 2)}° → ${fmt(off, 2)}° svisle`);
  def.apply('hold');
  const probed = def.probe();
  input.hold('zoom', true);
  step();
  const zIn = game.render.fov;
  input.hold('zoom', false);
  step();
  ok(probed === 'hold' && Math.abs(zIn - zoomV) < 1e-9 && Math.abs(game.render.fov - baseV) < 1e-9, 'nastavení „držet“: přiblíženo jen při držení (apply / probe)', `probe ${probed}`);
  def.apply(def.def);
}

// ---- druhá střelba na pravém tlačítku, skok jen mezerníkem (Ondřej 27. 11.)
{
  const keys = new Map(ACTIONS.map((a) => [a.id, a.keys]));
  ok(keys.get('alt')[0] === 'Mouse2' && !keys.get('jump').includes('Mouse2'), 'pravé tlačítko = druhá střelba; skok jen mezerníkem', `alt ${keys.get('alt').join(', ')}; skok ${keys.get('jump').join(', ')}`);
}

// ---- uložení se střelou v letu
{
  game.start();
  game.sim(0.1);
  weapons.give('plasma_rifle_01', 40);
  player.teleport(3, 0, -10);
  player.lookAt(3, 1.45, -27.5);
  step(2); // po výběru zbraně
  input.hold('grab', true);
  step();
  input.hold('grab', false);
  step(5);
  const inFlight = get('weapons.stat').projectiles;
  const snap = E.snapshot();
  const h0 = get('weapons.stat').hits;
  game.sim(0.6);
  const h1 = get('weapons.stat').hits;
  const a = JSON.stringify([h1 - h0, get('entity.e_lamp_hall_b.light').on, get('weapons.ammo.cells')]);
  E.restore(snap);
  const back = get('weapons.stat').projectiles;
  game.sim(0.6);
  const b = JSON.stringify([get('weapons.stat').hits - h1, get('entity.e_lamp_hall_b.light').on, get('weapons.ammo.cells')]);
  ok(inFlight === 1 && back === 1 && a === b && a.startsWith('[1,'), 'ulož se střelou v letu → nahraj → stejný zásah a stav', `${a} / ${b}`);
}

process.exit(h.finish('A3.1 zbraně (Node)'));
