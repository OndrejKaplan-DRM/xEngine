// T1d: zbraně a munice (N-201, zkušební formát). Plazmová puška zlatého vzorku je platná a nese hodnoty
// Arény v2.9; hodnota podle nabití a odhození počítá jedna funkce; validátor chytá chyby zbraní.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import * as X from '../src/xspace/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { pack, res } = await checkPackDir(path.join(root, 'packs/golden'));

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const W = (p) => p.weapons[0].data;
const P = (p, id) => p.prefabs.find((x) => x.data.id === id)?.data;
const codes = (r) => [...r.errors, ...r.warnings].map((x) => x.code);

// ---- zlatý vzorek
{
  const w = W(pack);
  ok(res.ok && res.warnings.length === 0 && res.stats.weapons === 1 && res.stats.ammo === 1, 'zlatý vzorek se zbraní a municí projde bez nálezu', `${res.stats.weapons} zbraň, ${res.stats.ammo} munice`);
  ok(w.id === 'plasma_rifle_01' && w.ammo === 'cells' && pack.ammo.ammo.cells.max === 200, 'plazmová puška střílí články, nejvýš 200');
  ok(P(pack, w.view.prefab)?.category === 'weapon.view', 'model v ruce je prefab zlatého vzorku');
  const pick = P(pack, 'pickup_plasma_rifle_01');
  ok(pick.components.pickup.item === w.id && pick.components.pickup.amount === 40, 'zbraň na zemi dá pušku a 40 článků (Aréna: bonus 40)');
  const lvl = pack.levels[0].data;
  const samples = X.levelSamples(lvl, new Map(pack.prefabs.map((p) => [p.data.id, p.data])), pack.materials.materials, X.LIGHT_CELL);
  ok(samples.entities[lvl.entities.findIndex((e) => e.id === 'e_plasma')] === null, 'sebratelná zbraň nemá vzorky zapečeného světla (D-041)', `vzorků levelu ${samples.count}`);
}

// ---- hodnoty Arény (weapons.js, projectiles.js, větev hra a04e8c0)
{
  const w = W(pack);
  const p = w.primary;
  const a = w.alt;
  ok(p.cooldown === 0.1 && p.damage === 12 && p.projectile.speed === 45 && p.projectile.life === 4 && p.splash.radius === 1 && p.splash.damage === 6 && p.noise === 30, 'hlavní: 10 ran/s, 12 + šplouchnutí 6 v 1 m, 45 m/s, 4 s, hluk 30 m');
  ok(near(p.spread, 0.46, 0.005) && near((0.008 * 180) / Math.PI, p.spread, 0.005), 'rozptyl 0,46° = 0,008 rad Arény');
  let worst = 0;
  for (const k of [0, 0.25, 0.5, 0.7, 1]) {
    const e = k * k;
    worst = Math.max(
      worst,
      Math.abs(X.rampValue(a.cost, k) - (5 + 15 * k)),
      Math.abs(X.rampValue(a.projectile.speed, k) - (14 + 26 * k)),
      Math.abs(X.rampValue(a.splash.radius, k) - (2.5 + 3 * k)),
      Math.abs(X.rampValue(a.splash.damage, k) - (30 + 170 * e)),
      Math.abs(X.rampValue(a.splash.push, k) - (18 * (8 + 14 * e)) / 12),
    );
  }
  ok(worst < 1e-9, 'nabitá koule: cena, rychlost, poloměr, poškození a odhození = vzorce Arény pro nabití 0 až 1', `největší rozdíl ${worst}`);
  ok(a.charge.time === 2 && a.charge.release === 2.6 && a.cooldown === 0.5 && a.noise === 40, 'nabití 2 s, samo vystřelí ve 2,6 s, potom 0,5 s pauza, hluk 40 m');
}

// ---- jedna pravda pro vzorce
{
  ok(X.rampValue(7, 0.3) === 7 && X.rampValue({ min: 0, max: 10 }, 0.3) === 3 && near(X.rampValue({ min: 0, max: 10, curve: 'square' }, 0.3), 0.9) && X.rampValue({ min: 1, max: 2 }, 5) === 2 && X.rampValue({ min: 1, max: 2 }, -1) === 1, 'rampValue: číslo, lineárně, s druhou mocninou, ořez nabití na 0 až 1');
  ok(X.splashFalloff(0, 4) === 1 && X.splashFalloff(2, 4) === 0.5 && X.splashFalloff(4, 4) === 0 && X.splashFalloff(9, 4) === 0 && X.splashFalloff(0, 0) === 0, 'splashFalloff: 1 − d/r, za okrajem 0');
  ok(X.pushDelta(20, 0, 4, 0) === 20 && X.pushDelta(20, 0, 4, X.PUSH_MASS) === 10 && X.pushDelta(20, 2, 4, 0) === 10 && near(X.pushDelta(18, 0, 4, 1100), 18 / (1 + 1100 / 800)), 'pushDelta: lehké těleso dostane push, 800 kg polovinu, auto 1 100 kg 42 %');
}

// ---- mutace
const MUT = [
  ['ref.ammo', 'zbraň s neexistující municí', (p) => (W(p).ammo = 'neni')],
  ['ref.prefab', 'model v ruce neexistuje', (p) => (W(p).view.prefab = 'neni_01')],
  ['weapon.projectile', 'střela bez projectile', (p) => delete W(p).primary.projectile],
  ['weapon.projectile', 'projectile u paprsku', (p) => Object.assign(W(p).primary, { kind: 'hitscan', range: 100 })],
  ['weapon.range', 'paprsek bez dosahu', (p) => (W(p).alt = { kind: 'hitscan', cooldown: 1, damage: 10 })],
  ['weapon.charge', 'hodnota podle nabití bez charge', (p) => delete W(p).alt.charge],
  ['weapon.charge', 'samovolné vystřelení před plným nabitím', (p) => (W(p).alt.charge.release = 1)],
  ['weapon.ammo', 'cena výstřelu u zbraně bez munice', (p) => delete W(p).ammo],
  ['weapon.slot', 'dvě zbraně se stejným slotem a pořadím (varování)', (p) => p.weapons.push({ file: 'weapons/b.json', data: { ...clone(W(p)), id: 'plasma_rifle_02' } })],
  ['pack.dupeWeapon', 'zbraň v balíku dvakrát', (p) => p.weapons.push({ file: 'weapons/b.json', data: clone(W(p)) })],
  ['shape.type', 'hodnota podle nabití není číslo ani objekt', (p) => (W(p).alt.splash.radius = 'velký')],
  ['shape.required', 'hodnota podle nabití bez max', (p) => delete W(p).alt.cost.max],
  ['shape.enum', 'neznámý průběh nabití', (p) => (W(p).alt.splash.push.curve = 'cubic')],
  ['shape.range', 'hodnota podle nabití mimo mez', (p) => (W(p).alt.splash.push.max = 999)],
  ['shape.enum', 'neznámý druh režimu', (p) => (W(p).primary.kind = 'laser')],
  ['shape.required', 'zbraň bez hlavního režimu', (p) => delete W(p).primary],
  ['pickup.item', 'sebratelný předmět, který balík nezná (varování)', (p) => (P(p, 'pickup_plasma_rifle_01').components.pickup.item = 'bfg_01')],
  ['pack.missingFile', 'manifest jmenuje soubor munice, který se nenačetl', (p) => (p.ammo = null)],
  ['shape.id', 'id munice s velkými písmeny', (p) => (p.ammo.ammo.Cells = { title: 'x', max: 1 })],
];
for (const [code, name, mutate] of MUT) {
  const m = clone(pack);
  mutate(m);
  const r = X.validatePack(m);
  const found = codes(r).includes(code);
  ok(found, `validátor chytí: ${name}`, found ? code : `čekáno ${code}, nalezeno: ${codes(r).join(' ') || 'nic'}`);
}

console.log(`\nT1d zbraně: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
