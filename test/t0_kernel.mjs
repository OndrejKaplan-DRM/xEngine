// T0: jádro v Node, bez prohlížeče. Fáze a závislosti, události, pevný krok, režimy, uložení stavu.

import { createEngine, PHASES, TRANSITIONS, rngNext, createStore } from '../src/kernel/index.js';

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
function throws(fn, part, name) {
  try {
    fn();
    ok(false, name, 'nevyhodilo chybu');
  } catch (e) {
    ok(e.message.includes(part), name, e.message);
  }
}
const fakeNow = () => {
  let t = 0;
  return () => (t += 0.01);
};

// ---- fáze a závislosti
{
  const E = createEngine({ now: fakeNow() });
  const log = [];
  const mk = (name, phase, after) => ({ name, phase, after, step: () => log.push(name) });
  E.add(mk('hud', 'ui'));
  E.add(mk('camera', 'view'));
  E.add(mk('triggers', 'late'));
  E.add(mk('physics', 'physics'));
  E.add(mk('weapons', 'sim', ['player']));
  E.add(mk('player', 'sim'));
  E.add(mk('ai', 'sim', ['?nav', 'player']));
  E.add(mk('input', 'input'));
  ok(E.order().join(' ') === 'input player weapons ai physics triggers camera hud', 'pořadí podle fází a závislostí', E.order().join(' '));
  E.stepOnce();
  ok(log.join(' ') === E.order().join(' '), 'krok běží ve stejném pořadí');
  ok(PHASES.join(' ') === 'input sim physics late view ui', 'fáze jsou v dohodnutém pořadí');
}
{
  const E = createEngine({ now: fakeNow() });
  E.add({ name: 'a', after: ['b'] });
  E.add({ name: 'b', after: ['a'] });
  throws(() => E.order(), 'Kruhová závislost', 'kruh v závislostech se pozná');
}
{
  const E = createEngine({ now: fakeNow() });
  E.add({ name: 'a', after: ['nikdo'] });
  throws(() => E.order(), 'neznámý systém', 'závislost na neznámém systému se pozná');
}
{
  const E = createEngine({ now: fakeNow() });
  E.add({ name: 'early', phase: 'sim', after: ['late1'] });
  E.add({ name: 'late1', phase: 'late' });
  throws(() => E.order(), 'nemůže běžet po', 'závislost proti směru fází se pozná');
}
{
  const E = createEngine({ now: fakeNow() });
  E.add({ name: 'a' });
  throws(() => E.add({ name: 'a' }), 'už je registrován', 'dvojí registrace se pozná');
  throws(() => E.add({ name: 'x', phase: 'kdykoli' }), 'neznámou fázi', 'neznámá fáze se pozná');
  throws(() => E.add({}), 'musí mít jméno', 'systém bez jména se pozná');
  throws(() => E.get('nic'), 'Neznámý systém', 'get na neznámé jméno hází');
  ok(E.has('a') && !E.has('nic'), 'has rozliší existující a neexistující systém');
}

// ---- události
{
  const E = createEngine({ now: fakeNow() });
  E.add({ name: 'doors', events: ['door:opened', 'door:closed'] });
  let got = null;
  const off = E.on('door:opened', (d) => (got = d));
  E.emit('door:opened', { id: 'e_door_lab' });
  ok(got && got.id === 'e_door_lab', 'deklarovaná událost dorazí');
  off();
  got = null;
  E.emit('door:opened', { id: 'x' });
  ok(got === null, 'odhlášený posluchač nic nedostane');
  throws(() => E.emit('door:opend', {}), 'nikdo nedeklaroval', 'překlep v názvu události se pozná při emit');
  throws(() => E.on('dor:opened', () => {}), 'nikdo nedeklaroval', 'překlep v názvu události se pozná při on');
  throws(() => E.add({ name: 'x', events: ['door:opened'] }), 'už deklaroval', 'dvojí deklarace události se pozná');
  throws(() => E.add({ name: 'y', events: ['Door Opened'] }), 'nemá tvar', 'špatný tvar názvu události se pozná');
  ok(E.eventList().some((e) => e.event === 'door:closed' && e.owner === 'doors'), 'přehled událostí zná vlastníka');
  const loose = createEngine({ strictEvents: false, now: fakeNow() });
  loose.emit('cokoli', 1);
  ok(true, 'volný režim událostí nehází');
}

// ---- pevný krok a čas
{
  const E = createEngine({ step: 1 / 120, now: fakeNow() });
  let steps = 0;
  let lastDt = 0;
  let frames = 0;
  let lastAlpha = -1;
  E.add({ name: 'count', step: (dt) => (steps++, (lastDt = dt)), frame: (_r, a) => (frames++, (lastAlpha = a)) });
  await E.init();
  ok(E.mode === 'menu', 'po init je režim menu');
  ok(E.tick(1 / 60) === 0 && steps === 0 && frames === 1, 'v menu simulace stojí, snímky běží');
  E.setMode('playing');
  ok(E.tick(1 / 60) === 2, 'snímek 1/60 s = 2 kroky po 1/120 s');
  ok(Math.abs(lastDt - 1 / 120) < 1e-12, 'krok je pevný');
  E.timeScale = 5;
  const n = E.tick(1 / 60);
  ok(n === 10 && Math.abs(lastDt - 1 / 120) < 1e-12, 'zrychlení 5× = víc kroků, délka kroku stejná', `${n} kroků`);
  E.timeScale = 1;
  const before = steps;
  E.tick(5);
  ok(steps - before <= 12, 'dlouhý zásek se nedohání', `${steps - before} kroků za zásek 5 s`);
  E.tick(0.004);
  ok(lastAlpha >= 0 && lastAlpha < 1, 'alpha mezi kroky je v rozsahu 0–1', lastAlpha.toFixed(3));
  E.setMode('paused');
  const p0 = steps;
  E.tick(1);
  ok(steps === p0, 'pauza zastaví čítač kroků');
  ok(E.sim(1) === 120, 'sim(1 s) provede 120 kroků bez čekání');
  throws(() => E.setMode('boot'), 'Nepovolený přechod', 'nepovolený přechod režimu se pozná');
  throws(() => E.add({ name: 'pozde' }), 'nelze přidat po startu', 'systém přidaný po startu se odmítne');
  ok(Object.keys(TRANSITIONS).length === 5, 'tabulka režimů má 5 stavů');
}

// ---- uložení a obnova, opakovatelnost
{
  const make = () => {
    const E = createEngine({ now: fakeNow() });
    const s = { name: 'walker', x: 0, rng: 7, step() { const [v, r] = rngNext(this.rng); this.rng = r; this.x += v - 0.5; }, reset() { this.x = 0; this.rng = 7; }, snapshot() { return { x: this.x, rng: this.rng }; }, restore(d) { this.x = d.x; this.rng = d.rng; } };
    E.add(s);
    return { E, s };
  };
  const a = make();
  const b = make();
  await a.E.init();
  await b.E.init();
  a.E.sim(2);
  b.E.sim(2);
  ok(a.s.x === b.s.x, 'stejný seed a stejné kroky = stejný stav');
  const snap = JSON.parse(JSON.stringify(a.E.snapshot()));
  a.E.sim(1);
  const after = a.s.x;
  a.E.restore(snap);
  ok(a.s.x === b.s.x && a.E.steps === 240, 'obnova vrátí stav i čítač kroků');
  a.E.sim(1);
  ok(a.s.x === after, 'ulož → nahraj → 120 kroků dá totéž jako bez nahrání');
  throws(() => a.E.restore({ format: 99 }), 'Neznámý formát', 'cizí formát uložení se odmítne');
  a.E.reset();
  ok(a.s.x === 0 && a.E.steps === 0, 'reset vrátí výchozí stav');
}

// ---- měření po systémech
{
  const E = createEngine({ now: fakeNow() });
  E.add({ name: 'a', step() {} });
  E.add({ name: 'b', step() {} });
  E.profile = true;
  await E.init();
  E.sim(0.1);
  ok(E.stats.sys.a > 0 && E.stats.sys.b > 0, 'profil měří čas kroku po systémech');
  ok('a' in E.stats.boot, 'start měří čas init a build po systémech');
}

// ---- úložiště
{
  const mem = new Map();
  const backend = { setItem: (k, v) => mem.set(k, v), getItem: (k) => (mem.has(k) ? mem.get(k) : null), removeItem: (k) => mem.delete(k) };
  const S = createStore('xe.', backend);
  ok(S.persistent && S.set('a', { n: 1 }) && S.get('a').n === 1, 'úložiště uloží a vrátí hodnotu');
  mem.set('xe.zly', '{rozbito');
  ok(S.get('zly') === null, 'poškozený záznam vrátí null, ne pád');
  const none = createStore('xe.', { setItem() { throw new Error('zakázáno'); } });
  ok(!none.persistent && none.set('a', 1) === false && none.get('a') === 1, 'bez trvalého úložiště běží v paměti a řekne to');
}

console.log(`\nT0 jádro: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
