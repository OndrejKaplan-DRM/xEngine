// xLab: vstupní bod hry v prohlížeči. Spojí jádro a systémy (game.js) s plátnem, Shellem, zámkem kurzoru a HUD.
// Level, prefaby a materiály přicházejí v globálu __PACK__, který do stránky vkládá build (target.json, pole pack).

import shellCss from '../../vendor/shell/shell.css' with { type: 'text' };
import { mountShell } from '../../vendor/shell/shell.js';
import { createRender } from '../render/render.js';
import { PREVENT_DEFAULT, keyLabel } from '../play/actions.js';
import { createGame, VERSION } from './game.js';
import { createLock } from './lock.js';
import { createHud } from './hud.js';
import { settingsDefs } from './settings.js';
import { installHook } from './hook.js';

const BOUNCE_MS = 350; // Esc, kterým prohlížeč uvolnil zámek, nesmí vzápětí hru zase spustit

async function boot() {
  const params = new URLSearchParams(location.search);
  const dev = params.has('dev');
  const canvas = document.getElementById('c');
  const style = document.createElement('style');
  style.textContent = shellCss;
  document.head.append(style);

  const render = createRender({ canvas, antialias: params.get('aa') !== '0' });
  const game = createGame({ pack: globalThis.__PACK__, render });
  const { E, input } = game;
  const hud = createHud({ root: document.getElementById('hud') });
  E.add({
    name: 'hud',
    phase: 'ui',
    frame(real) {
      hud.setPrompt(E.mode === 'playing' ? game.interact.prompt : '');
      hud.frame(real);
    },
  });

  let lostAt = -Infinity;
  const lock = createLock({
    target: canvas,
    onLost() {
      lostAt = performance.now();
      if (E.mode === 'playing') E.setMode('paused');
    },
  });
  if (params.has('nolock')) lock.disable();

  /** Vstup do hry: nejdřív zámek kurzoru (voláno z kliknutí), pak teprve režim. */
  async function enter(fresh) {
    const r = await lock.acquire();
    if (r === 'retry') {
      hud.notify('Prohlížeč teď zámek kurzoru odmítl. Klikni znovu.', 4);
      return;
    }
    if (r === 'denied') {
      lock.disable();
      hud.notify('Zámek kurzoru tu není povolen. Rozhlížej se tažením myši se stisknutým levým tlačítkem.', 7);
    }
    if (fresh) {
      game.start();
      if (r !== 'denied') hud.notify(`Pohyb šipky nebo WASD · skok ${keyLabel('jump')} · použít ${keyLabel('use')} · pauza Esc`, 7);
    } else if (E.mode === 'paused') E.setMode('playing');
  }

  const adapter = {
    meta: { id: 'xengine', title: 'xEngine', subtitle: game.session.level.title, version: VERSION, tone: 'hard' },
    state: { mode: () => E.mode, onMode: (fn) => E.on('mode', fn) },
    settings: settingsDefs({ game, dev }),
    game: {
      newGame: () => enter(true),
      resume() {
        if (performance.now() - lostAt < BOUNCE_MS) return;
        return enter(false);
      },
      pause() {
        if (E.mode !== 'playing') return;
        E.setMode('paused');
        lock.release();
      },
      quit() {
        if (E.mode !== 'menu') E.setMode('menu');
        lock.release();
      },
    },
  };

  await E.init();
  const shell = mountShell(adapter, { root: document.getElementById('shell') });

  E.on('mode', ({ mode }) => {
    if (mode !== 'playing') input.releaseAll();
    hud.setCross(mode === 'playing');
    if (mode !== 'playing') hud.setPrompt('');
  });
  hud.setCross(false);
  // oznámení z dat levelu (cíl @level ve spojeních)
  E.on('level:checkpoint', () => hud.notify('Kontrolní bod', 2.5));
  E.on('level:complete', () => hud.notify('Level dokončen', 6));
  E.on('level:message', (e) => hud.notify(String(e.value ?? ''), 5));
  E.on('interact:denied', () => hud.notify('Zamčeno', 1.5));

  // ---- vstup: klávesy podle event.code, myš jako Mouse0–2
  addEventListener('keydown', (e) => {
    if (E.mode !== 'playing') return;
    const known = e.repeat ? false : input.key(e.code, true);
    if (known || PREVENT_DEFAULT.has(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => input.key(e.code, false));
  canvas.addEventListener('mousedown', (e) => {
    if (E.mode === 'playing') input.key(`Mouse${e.button}`, true);
  });
  addEventListener('mouseup', (e) => input.key(`Mouse${e.button}`, false));
  document.addEventListener('mousemove', (e) => {
    if (E.mode !== 'playing') return;
    if (lock.locked || (!lock.enabled && e.buttons)) input.look(e.movementX, e.movementY);
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('blur', () => input.releaseAll());
  addEventListener('resize', () => render.resize());

  installHook({ game, lock, shell, hud, adapter });
  E.run();
}

boot().catch((err) => {
  console.error(err);
  const fail = document.getElementById('fail');
  fail.hidden = false;
  fail.textContent = `xEngine se nespustil: ${err.message}`;
});
