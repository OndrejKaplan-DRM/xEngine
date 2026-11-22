// A1.5 v Node: „použít“ a spojení výstup → vstup. Robot se postaví před předmět, namíří pohled a stiskne „použít“;
// zbytek je v datech levelu (pole io). Kritéria ze zadání: tlačítko otevře dveře laboratoře a po 0,3 s se rozsvítí
// lampa; vypínač rozsvítí a zhasne; spouštěč zareaguje jen jednou; uložení uprostřed otevírání.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { h, makeGame, loadPack, fmt, ROOT } from './a_lib/node.mjs';

const { ok } = h;
const game = await makeGame();
const { E, entities, player, input, io, behave, session } = game;
const level = session.level;
const def = (id) => level.entities.find((e) => e.id === id);
const get = (p) => game.get(p);

/** Postaví hráče před entitu (na podlahu, d metrů ve směru její přední strany +Z) a namíří na ni. */
function face(id, d = 0.9) {
  const ent = entities.byId(id);
  const c = entities.center(id);
  const fx = ent.em[8];
  const fz = ent.em[10];
  const len = Math.hypot(fx, fz) || 1;
  player.teleport(c[0] + (fx / len) * d, ent.cell ? level.cells.find((k) => k.id === ent.cell).bounds.min[1] : 0, c[2] + (fz / len) * d);
  player.lookAt(c[0], c[1], c[2]);
  game.sim(0.1);
}
const use = () => {
  input.use();
  E.stepOnce();
};
const log = [];
E.on('io:fired', (e) => log.push({ step: E.steps, from: e.source, on: e.output, to: e.target, input: e.input, value: e.value }));
let checkpoints = 0;
E.on('level:checkpoint', () => checkpoints++);

// ---- vypínač ve startu rozsvítí a zhasne
game.start();
game.sim(0.2);
{
  face('e_switch_start');
  ok(get('interact.target') === 'e_switch_start' && get('interact.prompt').includes(def('e_switch_start') ? 'Přepnout' : ''), 'vypínač je pod zaměřovačem a HUD nabízí akci z dat', get('interact.prompt'));
  const before = get('entity.e_lamp_start.light').on;
  use();
  game.sim(0.4);
  const on = get('entity.e_lamp_start.light').on;
  use();
  game.sim(0.4);
  const off = get('entity.e_lamp_start.light').on;
  ok(!before && on && !off, 'vypínač ve startu rozsvítí a zhasne', `${before} → ${on} → ${off}; kloub vypínače ${get('entity.e_switch_start.joint')}°`);
}

// ---- tlačítko v chodbě otevře dveře laboratoře a po 0,3 s se rozsvítí lampa
{
  face('e_btn_lab');
  ok(get('interact.target') === 'e_btn_lab', 'tlačítko je pod zaměřovačem', get('interact.prompt'));
  const door = entities.byId('e_door_lab');
  const j = door.joints[0];
  log.length = 0;
  use();
  let opened = -1;
  let lit = -1;
  for (let i = 0; i < 400 && lit < 0; i++) {
    E.stepOnce();
    if (opened < 0 && j.value === j.def.max) opened = E.steps;
    if (get('entity.e_lamp_lab.light').on) lit = E.steps;
  }
  const delay = def('e_door_lab').io.find((k) => k.on === 'opened').delay;
  ok(opened > 0 && j.value === j.def.max, 'tlačítko v chodbě otevře dveře laboratoře', `kloub ${j.value} m; ${log.map((l) => `${l.from}.${l.on}→${l.to}.${l.input}`).join(', ')}`);
  ok(lit - opened === Math.ceil(delay * 120), `lampa se rozsvítí ${delay} s po otevření (zpoždění v krocích, nahoru)`, `${lit - opened} kroků = ${fmt((lit - opened) / 120, 3)} s`);
  game.sim(0.5);
  ok(get('entity.e_btn_lab.joint') === 0 && get('entity.e_btn_lab.state').phase === 0, 'tlačítko se po stisku vrátí (pružina) a jde stisknout znovu');
}

// ---- paprsek „použít“: dosah z dat a žádné používání skrz zeď
{
  face('e_btn_lab', 2.2); // dosah tlačítka je 1,6 m
  const far = get('interact.target');
  const b = entities.center('e_btn_lab');
  player.teleport(b[0] + 1.0, 0, b[2]); // z druhé strany zdi (laboratoř)
  player.lookAt(b[0], b[1], b[2]);
  game.sim(0.1);
  ok(far === null && get('interact.target') === null, 'mimo dosah ani skrz zeď se použít nedá', `z 2,2 m: ${far}; přes zeď: ${get('interact.target')}`);
}

// ---- zámek: zamčené dveře hráč neotevře, spojení ano
{
  game.start();
  game.sim(0.2);
  const door = entities.byId('e_door_start');
  behave.input(door, 'lock');
  face('e_door_start', 1.0);
  const prompt = get('interact.prompt');
  use();
  game.sim(0.5);
  const locked = door.joints[0].value;
  behave.input(door, 'unlock');
  use();
  game.sim(1.2);
  ok(prompt === 'Zamčeno' && locked === 0 && door.joints[0].value === door.joints[0].def.max, 'zamčené dveře hráč neotevře, po odemčení ano', `nápověda „${prompt}“, kloub ${locked}° → ${door.joints[0].value}°`);
}

// ---- spouštěč v hale zareaguje jen jednou
{
  game.start();
  game.sim(0.2);
  checkpoints = 0;
  const t = level.triggers.find((x) => x.once);
  const cx = (t.min[0] + t.max[0]) / 2;
  const cz = (t.min[2] + t.max[2]) / 2;
  const lamp = t.io.find((k) => k.target !== '@level').target;
  player.teleport(cx, t.min[1], cz + 3);
  game.sim(0.2);
  const before = get(`entity.${lamp}.light`).on;
  player.teleport(cx, t.min[1], cz);
  game.sim(0.1);
  const first = get(`entity.${lamp}.light`).on;
  behave.input(entities.byId(lamp), 'turnOff');
  player.teleport(cx, t.min[1], cz + 3);
  game.sim(0.1);
  player.teleport(cx, t.min[1], cz);
  game.sim(0.1);
  ok(!before && first && !get(`entity.${lamp}.light`).on && checkpoints === 1, 'spouštěč v hale zareaguje jen jednou', `lampa ${before} → ${first} → po druhém vstupu ${get(`entity.${lamp}.light`).on}; kontrolní bod ${checkpoints}×`);
}

// ---- ulož uprostřed otevírání → nahraj → stejný stav po 120 krocích
{
  game.start();
  game.sim(0.2);
  face('e_btn_lab');
  use();
  const j = entities.byId('e_door_lab').joints[0];
  while (j.value < j.def.max * 0.5) E.stepOnce();
  const snap = JSON.parse(JSON.stringify(E.snapshot())); // přes JSON: uložený stav musí být čistá data
  const mid = j.value;
  game.sim(1);
  const a = JSON.stringify(E.snapshot());
  E.restore(snap);
  const back = j.value;
  game.sim(1);
  const b = JSON.stringify(E.snapshot());
  ok(back === mid && a === b, 'ulož uprostřed otevírání → nahraj → stejný stav po 120 krocích', `dveře při uložení ${fmt(mid)} m, po nahrání ${fmt(back)} m, po 120 krocích ${fmt(j.value)} m; stavy ${a === b ? 'shodné' : 'RŮZNÉ'} (${a.length} znaků)`);
  ok(get('entity.e_lamp_lab.light').on, 'fronta spojení přežije uložení (lampa se po nahrání rozsvítí)');
}

// ---- ventil → lampa: hodnota výstupu se předá vstupu; sebratelný předmět zmizí
{
  game.start();
  game.sim(0.2);
  const valve = entities.list.find((e) => e.kind === 'valve');
  const target = valve.def.io.find((k) => k.on === 'changed').target;
  behave.input(entities.byId(target), 'turnOn');
  behave.input(valve, 'setLevel', 0.5);
  game.sim(4);
  const L = get(`entity.${target}.light`);
  ok(Math.abs(valve.joints[0].norm - 0.5) < 1e-9 && Math.abs(L.level - 0.5) < 1e-9 && L.on, 'ventil na 50 % nastaví lampu na poloviční svit (hodnota výstupu → vstup)', `ventil ${fmt(valve.joints[0].value, 0)}°, lampa ${target} úroveň ${L.level}`);

  const kit = entities.list.find((e) => e.kind === 'pickup');
  face(kit.id, 0.4); // leží na podlaze 0,8 m od zdi; dosah se měří od těla, ne od očí
  const seen = get('interact.target');
  use();
  game.sim(0.1);
  ok(seen === kit.id && !kit.state.enabled && get('interact.target') === null, 'sebratelný předmět jde sebrat a zmizí i s kolizí', `${kit.id}: ${seen} → ${get('interact.target')}`);
  game.start();
  ok(kit.state.enabled, 'nová hra předmět vrátí');
}

// ---- pravidla fronty na upraveném balíku: strop řetězu, once, param, zaokrouhlení zpoždění
{
  const pack = structuredClone(await loadPack());
  const L = pack.levels[0].data;
  const lamps = L.entities.filter((e) => e.prefab === 'lamp_ceiling_01');
  const [a, b, c, d] = lamps;
  // smyčka bez zpoždění: a.on → b.turnOn, b.on → a.turnOff, a.off → b.turnOff, b.off → a.turnOn
  a.io = [{ on: 'on', target: b.id, input: 'turnOn' }, { on: 'off', target: b.id, input: 'turnOff' }];
  b.io = [{ on: 'on', target: a.id, input: 'turnOff' }, { on: 'off', target: a.id, input: 'turnOn' }];
  // once + param + zpoždění 5 ms (= 1 krok, ne 0)
  c.io = [{ on: 'on', target: d.id, input: 'setLevel', param: 0.25, once: true }, { on: 'on', target: d.id, input: 'turnOn', delay: 0.005 }];
  const g2 = await makeGame({ pack });
  g2.start();
  g2.sim(0.1);
  g2.behave.input(g2.entities.byId(a.id), 'turnOn');
  const t0 = performance.now();
  g2.sim(0.1);
  const st = g2.get('io.stat');
  ok(st.broken >= 1 && st.delivered <= 12 * 34 && performance.now() - t0 < 500, 'smyčka spojení se přeruší na 32 článcích a hra běží dál', `doručeno ${st.delivered}, přerušeno ${st.broken}×`);
  const dEnt = g2.entities.byId(d.id);
  g2.behave.input(g2.entities.byId(c.id), 'turnOn');
  g2.E.stepOnce();
  const now = { level: dEnt.state.level, on: dEnt.state.on };
  g2.E.stepOnce();
  const next = dEnt.state.on;
  ok(now.level === 0.25 && !now.on && next, 'param přebije hodnotu výstupu; zpoždění 5 ms = jeden krok, ne nula', `úroveň ${now.level}, svítí hned ${now.on}, o krok později ${next}`);
  g2.behave.input(dEnt, 'setLevel', 1);
  g2.behave.input(g2.entities.byId(c.id), 'turnOff');
  g2.behave.input(g2.entities.byId(c.id), 'turnOn');
  g2.sim(0.1);
  ok(dEnt.state.level === 1, 'spojení s once se provede jen jednou', `úroveň po druhém zapnutí ${dEnt.state.level}`);
}

// ---- žádné alokace, které by zůstávaly: 500 použití tlačítka, halda neroste (měří se v podprocesu s --expose-gc)
{
  const r = spawnSync(process.execPath, ['--expose-gc', path.join(ROOT, 'test/a_lib/heap.mjs')], { encoding: 'utf8', cwd: ROOT });
  let m = null;
  try {
    m = JSON.parse(r.stdout.trim().split('\n').pop());
  } catch {
    /* níže se ohlásí */
  }
  ok(!!m && m.growKb < 128, '500 použití tlačítka (po zahřátí): halda neroste', m ? `před ${m.beforeKb} kB, po ${m.afterKb} kB, rozdíl ${m.growKb} kB; ${m.steps} kroků, ${m.fired} spojení` : (r.stderr || r.stdout).slice(0, 200));
}

process.exit(h.finish('A1.5 použít a spojení (Node)'));
