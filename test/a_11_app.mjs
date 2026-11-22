// A1.1 v Node: jádro s hrou bez obrazu (režimy, čítač kroků v pauze) a protokol zámku kurzoru nad maketou dokumentu.

import { h, makeGame } from './a_lib/node.mjs';
import { createLock } from '../src/app/lock.js';
import { ACTIONS, keyMap } from '../src/play/actions.js';
import { PROFILES } from '../src/play/profiles.js';

const { ok } = h;

// ---- režimy a čítač kroků
{
  const game = await makeGame();
  const { E } = game;
  ok(E.mode === 'menu', 'po init je hra v menu', E.mode);
  ok(E.tick(0.05) === 0 && E.steps === 0, 'v menu simulace nekrokuje');
  game.start();
  ok(E.mode === 'playing', 'start přepne do hry');
  const n = E.tick(0.05);
  ok(n === 6 && E.steps === 6, 'za 50 ms proběhne 6 kroků po 1/120 s', `${n} kroků`);
  E.setMode('paused');
  const before = E.steps;
  for (let i = 0; i < 20; i++) E.tick(0.05);
  ok(E.steps === before, 'pauza zastaví čítač kroků', `${before} → ${E.steps}`);
  E.setMode('playing');
  E.tick(0.05);
  ok(E.steps === before + 6, 'po návratu z pauzy kroky pokračují');
  E.timeScale = 5;
  const fast = E.tick(0.05);
  E.timeScale = 1;
  ok(fast === 30, 'zrychlený čas mění počet kroků, ne jejich délku', `${fast} kroků, krok ${E.STEP.toFixed(5)} s`);
  ok(game.sim(1) === 120, 'sim(1) = 120 kroků bez čekání');
  ok(E.order().indexOf('input') < E.order().indexOf('render'), 'vstup běží před vykreslením', E.order().join(' → '));
}

// ---- akce a profily jsou data
{
  const map = keyMap();
  const dupes = ACTIONS.flatMap((a) => a.keys).filter((k, i, all) => all.indexOf(k) !== i);
  ok(dupes.length === 0, 'žádná klávesa není ve výchozím stavu na dvou akcích', dupes.join(' '));
  ok(!ACTIONS.some((a) => a.keys.some((k) => /^(Control|Alt|Meta|F5|Escape)/.test(k))), 'akce nesedí na klávesách, které prohlížeč bere (Ctrl, Alt, F5, Esc)');
  ok(map.get('KeyW') === map.get('ArrowUp'), 'pohyb jde šipkami i WASD');
  for (const p of Object.values(PROFILES)) {
    const need = ['maxSpeed', 'accel', 'friction', 'stopSpeed', 'airAccel', 'gravity', 'jumpSpeed', 'height', 'radius', 'eye', 'stepHeight', 'walkNormal'];
    const miss = need.filter((k) => typeof p[k] !== 'number');
    ok(miss.length === 0, `profil ${p.id} má všechny hodnoty`, miss.join(' ') || `max ${p.maxSpeed.toFixed(2)} m/s, gravitace ${p.gravity.toFixed(1)} m/s², jistota ${p.confidence}/5`);
  }
}

// ---- zámek kurzoru: maketa dokumentu
function fakeDoc({ refuse = () => false } = {}) {
  const listeners = {};
  const doc = {
    pointerLockElement: null,
    addEventListener: (ev, fn) => (listeners[ev] ||= new Set()).add(fn),
    removeEventListener: (ev, fn) => listeners[ev]?.delete(fn),
    fire: (ev) => [...(listeners[ev] || [])].forEach((fn) => fn()),
    exitPointerLock() {
      doc.pointerLockElement = null;
      doc.fire('pointerlockchange');
    },
  };
  const target = {
    requestPointerLock() {
      if (refuse()) return Promise.reject(new Error('odmítnuto'));
      doc.pointerLockElement = target;
      doc.fire('pointerlockchange');
      return Promise.resolve();
    },
  };
  return { doc, target };
}
{
  let lost = 0;
  let refuse = false;
  const { doc, target } = fakeDoc({ refuse: () => refuse });
  const lock = createLock({ target, doc, onLost: () => lost++ });
  ok((await lock.acquire()) === 'ok' && lock.locked, 'zámek se z kliknutí získá');
  doc.exitPointerLock(); // jako klávesa Esc
  ok(lost === 1 && !lock.locked, 'ztráta zámku se ohlásí právě jednou (→ pauza)', `ohlášeno ${lost}×`);
  refuse = true;
  ok((await lock.acquire()) === 'retry', 'odmítnutí po dřívějším zámku = „klikni znovu“, hra nespadne');
  refuse = false;
  ok((await lock.acquire()) === 'ok', 'další kliknutí zámek získá');
  lock.release();
  ok(lost === 1 && !lock.locked, 'záměrné uvolnění ztrátu nehlásí');
  lock.disable();
  ok((await lock.acquire()) === 'off', 'režim bez zámku (testy) o zámek nežádá');
}
{
  const { doc, target } = fakeDoc({ refuse: () => true });
  const lock = createLock({ target, doc, onLost() {} });
  ok((await lock.acquire()) === 'denied', 'prostředí, kde zámek nejde nikdy získat, se pozná (→ pohled tažením myši)');
}

process.exit(h.finish('A1.1 kostra aplikace (Node)'));
