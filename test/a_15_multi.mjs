// N-010 v běhu (D-052, dodatek znění 8): víc interakcí v jednom prefabu. Kartotéka se čtyřmi zásuvkami (kopie
// vzoru z test/t1c_interact.mjs) stojí ve startovní místnosti kopie zlatého vzorku. Ověřuje se: interakci vybírá
// zasažený uzel (interactionOf), každá zásuvka se otevře zvlášť, stav je po interakcích (zámek, uložení), spojení
// `from` bere výstup jen z jedné interakce, `to` vstup jen do jedné, bez `to` jde vstup do všech.

import { h, makeGame, loadPack, fmt } from './a_lib/node.mjs';
import { mat4Point, interactions, validatePack } from '../src/xspace/index.js';

const { ok } = h;
const clone = (x) => JSON.parse(JSON.stringify(x));
const base = await loadPack();
const P = (p, id) => p.prefabs.find((x) => x.data.id === id)?.data;
const door = P(base, 'door_hinged_01');
const mat = Object.keys(base.materials.materials)[0];
const box = (node, min, max) => ({ node, shape: 'box', min, max, mat });
const D = [1, 2, 3, 4];
const cabinet = {
  xspace: door.xspace,
  kind: door.kind,
  source: clone(door.source),
  id: 'cabinet_file_09',
  title: 'Kartotéka se čtyřmi zásuvkami (zkouška N-010)',
  category: 'prop.furniture',
  bounds: { min: [-0.25, 0, -0.3], max: [0.25, 1.32, 0.3] },
  rig: {
    nodes: [{ id: 'body' }, ...D.map((k) => ({ id: `d${k}`, parent: 'body', pos: [0, 0.33 * (k - 1), 0] })), { id: 'h1', parent: 'd1', pos: [0, 0.2, 0.3] }],
    joints: D.map((k) => ({ id: `s${k}`, node: `d${k}`, type: 'slider', axis: [0, 0, 1], min: 0, max: 0.45, rest: 0, speed: 0.5 })),
  },
  parts: [box('body', [-0.25, 0, -0.3], [0.25, 1.32, -0.28]), ...D.map((k) => box(`d${k}`, [-0.23, 0.02, -0.28], [0.23, 0.3, 0.3])), box('h1', [-0.05, -0.01, 0], [0.05, 0.01, 0.03])],
  colliders: [{ node: 'body', shape: 'box', min: [-0.25, 0, -0.3], max: [0.25, 1.32, -0.28] }, ...D.map((k) => ({ node: `d${k}`, shape: 'box', min: [-0.23, 0.02, -0.28], max: [0.23, 0.3, 0.3] }))],
  components: { physics: { body: 'kinematic' }, interact: D.map((k) => ({ id: `d${k}`, kind: 'drawer', joint: `s${k}`, prompt: `Vytáhnout ${k}`, manipulate: true })) },
  inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
  outputs: ['opened', 'closed', 'locked', 'unlocked'],
};
const pack = clone(base);
pack.prefabs.push({ file: 'prefabs/cabinet_file_09.json', data: cabinet });
const lv = pack.levels[0].data;
lv.entities.push({ id: 'e_cab', prefab: cabinet.id, cell: 'c_start', pos: [1, 0, 4], io: [{ on: 'opened', from: 'd2', target: 'e_door_lab', input: 'open' }] });
lv.entities.find((e) => e.id === 'e_door_start').io = [
  { on: 'opened', target: 'e_cab', input: 'lock', to: 'd3' },
  { on: 'closed', target: 'e_cab', input: 'unlock' },
];
{
  const r = validatePack(pack);
  ok(r.ok, 'kopie zlatého vzorku s kartotékou (seznam interakcí, from, to) projde validátorem', [...r.errors, ...r.warnings].map((x) => x.code).join(' ') || 'bez chyb');
}

const game = await makeGame({ pack });
const { E, entities, player, input, behave } = game;
const get = (p) => game.get(p);
const log = [];
E.on('io:fired', (e) => log.push(`${e.source}.${e.output}→${e.target}.${e.input}`));
game.start();
game.sim(0.2);

let cab = entities.byId('e_cab');
const S = (k) => cab.jointById[`s${k}`].value;
const values = () => D.map((k) => fmt(S(k), 2)).join(' ');
const ix = (id) => cab.ixById.get(id);

// ---- stavba: interakce z interactions(), kloub každé zásuvky, jediná interakce beze změny
{
  ok(cab.ixs.map((r) => r.id).join() === interactions(cabinet).map((x) => x.id).join() && cab.ixs.every((r, i) => r.joint === cab.jointById[`s${i + 1}`] && r.kind === 'drawer'), 'entita má čtyři interakce v pořadí dat, každá se svým kloubem');
  ok(cab.ixs.every((r) => r.state !== cab.state) && new Set(cab.ixs.map((r) => r.state)).size === 4 && cab.door === null && cab.guard, 'stav vede každá interakce zvlášť; kartotéka nejsou dveře portálu; díly hlídají hráče (D-025)');
  const d = entities.byId('e_door_lab');
  ok(d.ixs.length === 1 && d.ixs[0].id === 'main' && d.ixs[0].state === d.state && d.door === d.ixs[0] && d.door.joint === d.joints[0], 'jediná interakce jako objekt: id main, stav entity, dveře portálu s prvním kloubem');
  ok(behave.interactionAt(cab, 'd3') === ix('d3') && behave.interactionAt(cab, 'h1') === ix('d1') && behave.interactionAt(cab, 'body') === null, 'uzel zásuvky, madlo pod ní a korpus: d3, d1, nic (interactionOf)');
  ok(behave.mainJoint(cab) === null && behave.prompt(cab) === '' && behave.use(cab) === 'none', 'u seznamu není „hlavní“ kloub: bez vybrané interakce použít nic neudělá');
}

// ---- hráč míří na zásuvku: vybere ji zasažený uzel, otevře se jen ona
function aimAt(k, d = 1.4) {
  const c = mat4Point(cab.nodeWorld[`d${k}`], [0, 0.16, 0.2]);
  player.teleport(1, 0, 4 + d);
  player.lookAt(c[0], c[1], c[2]);
  game.sim(0.1);
}
{
  aimAt(4);
  ok(get('interact.target') === 'e_cab' && get('interact.ix') === 'd4' && get('interact.prompt').includes('Vytáhnout 4'), 'pohled na čtvrtou zásuvku: cíl kartotéka, interakce d4, nápověda z její interakce', `${get('interact.ix')} „${get('interact.prompt')}“`);
  input.use();
  E.stepOnce();
  game.sim(1.2);
  ok(S(4) === 0.45 && S(1) === 0 && S(2) === 0 && S(3) === 0, 'použít otevře jen čtvrtou zásuvku', values());
  aimAt(1);
  ok(get('interact.ix') === 'd1', 'pohled na první zásuvku: interakce d1', String(get('interact.ix')));
  input.use();
  E.stepOnce();
  game.sim(1.2);
  ok(S(1) === 0.45 && S(4) === 0.45 && S(2) === 0, 'první zásuvka se otevře zvlášť, čtvrtá zůstane otevřená', values());
}

// ---- from: výstup opened jen ze zásuvky d2 otevře dveře laboratoře
{
  const lab = entities.byId('e_door_lab').joints[0];
  log.length = 0;
  behave.use(cab, ix('d3'));
  game.sim(1.2);
  const after3 = lab.value;
  const fired3 = log.filter((l) => l.startsWith('e_cab.opened')).length;
  behave.use(cab, ix('d2'));
  game.sim(1.6);
  ok(S(3) === 0.45 && fired3 === 0 && after3 === lab.rest, 'otevřená zásuvka d3 spojení s from: d2 nespustí', `dveře ${fmt(after3, 2)}; ${log.join(', ') || 'nic'}`);
  ok(log.includes('e_cab.opened→e_door_lab.open') && lab.value === lab.def.max, 'otevřená zásuvka d2 spustí spojení from: d2 a dveře laboratoře se otevřou', `${log.join(', ')}; dveře ${fmt(lab.value, 2)}`);
}

// ---- vstup bez to jde do všech interakcí
{
  behave.input(cab, 'close');
  game.sim(1.2);
  ok(D.every((k) => S(k) === 0), 'close bez to zavře všechny zásuvky', values());
}

// ---- to: zamčení jedné zásuvky spojením, odemčení bez to všech
{
  const start = entities.byId('e_door_start');
  log.length = 0;
  behave.input(start, 'open');
  game.sim(2.5);
  const st = (k) => get(`entity.e_cab.state.d${k}`).locked;
  ok(st(3) && !st(1) && !st(2) && !st(4) && !cab.state.locked, 'dveře startu opened → lock s to: d3 zamkne jen třetí zásuvku', `${D.map(st).join(' ')}; ${log.join(', ')}`);
  ok(log.includes('e_cab.locked→') === false && behave.use(cab, ix('d3')) === 'locked' && behave.use(cab, ix('d2')) === 'ok', 'zamčená d3 hlásí locked, sousední d2 jde použít');
  aimAt(3);
  ok(get('interact.ix') === 'd3' && get('interact.prompt') === 'Zamčeno', 'nápověda nad zamčenou zásuvkou: Zamčeno', get('interact.prompt'));
  aimAt(4); // ne první: vysunutá d2 nad ní by zakryla pohled
  ok(get('interact.ix') === 'd4' && get('interact.prompt').includes('Vytáhnout 4'), 'nápověda nad odemčenou zásuvkou zůstává', get('interact.prompt'));
  game.sim(1.2);
  behave.input(start, 'close');
  game.sim(3);
  ok(D.every((k) => !st(k)), 'dveře startu closed → unlock bez to odemkne všechny zásuvky', D.map(st).join(' '));
  behave.input(cab, 'lock');
  const all = D.every((k) => st(k));
  behave.input(cab, 'unlock', undefined, 'd4');
  ok(all && !st(4) && st(1) && st(2) && st(3), 'lock bez to zamkne celou kartotéku, unlock s to jen jednu zásuvku', D.map(st).join(' '));
  behave.input(cab, 'unlock');
  behave.input(cab, 'close');
  game.sim(1.2);
}

// ---- výstup nese interakci, ze které přišel: locked a unlocked po interakcích
{
  const seen = [];
  const io = game.io;
  const fire = io.fire;
  io.fire = (kind, index, output, value, from) => {
    if (kind === 'entity' && entities.list[index] === cab) seen.push(`${output}:${from}`);
    return fire(kind, index, output, value, from);
  };
  behave.input(cab, 'lock', undefined, 'd2');
  behave.use(cab, ix('d1'));
  game.sim(1.2);
  behave.input(cab, 'unlock');
  io.fire = fire;
  ok(seen.join() === 'locked:d2,opened:d1,unlocked:d2', 'výstupy nesou id interakce (locked z d2, opened z d1, unlocked jen ze zamčené d2)', seen.join());
}

// ---- uložení a nahrání: poloha kloubů a stav po interakcích
{
  behave.input(cab, 'lock', undefined, 'd4');
  const snap = entities.snapshot();
  const want = values();
  behave.input(cab, 'unlock');
  behave.input(cab, 'close');
  game.sim(1.2);
  const moved = values();
  entities.restore(snap);
  ok(values() === want && moved !== want && ix('d4').state.locked && !ix('d1').state.locked, 'nahrání vrátí polohy zásuvek i zámek jedné z nich', `uloženo ${want}, mezitím ${moved}, po nahrání ${values()}`);
}

// ---- nová hra: výchozí stav všech interakcí
{
  game.start();
  game.sim(0.2);
  cab = entities.byId('e_cab');
  ok(D.every((k) => S(k) === 0 && !ix(`d${k}`).state.locked && ix(`d${k}`).state.phase === 0), 'nová hra: zásuvky zavřené a odemčené', values());
}

process.exit(h.finish("N-010 víc interakcí v prefabu (Node)"));
