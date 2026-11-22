// xLab: vstupní bod hry v prohlížeči. Spojí jádro a systémy (game.js) s plátnem, Shellem, zámkem kurzoru a HUD.
// Level, prefaby a materiály přicházejí v globálu __PACK__, který do stránky vkládá build (target.json, pole pack).

import shellCss from '../shell/shell.css' with { type: 'text' };
import { mountShell } from '../shell/shell.js';
import { createRender } from '../render/render.js';
import { PREVENT_DEFAULT, keyLabel } from '../play/actions.js';
import { createGame, VERSION } from './game.js';
import { createLock } from './lock.js';
import { createHud } from './hud.js';
import { settingsDefs } from './settings.js';
import { installHook } from './hook.js';
import { createDev } from './dev.js';

const BOUNCE_MS = 350; // Esc, kterým prohlížeč uvolnil zámek, nesmí vzápětí hru zase spustit

async function boot() {
  const params = new URLSearchParams(location.search);
  const dev = params.has('dev');
  const view = document.getElementById('view'); // stálý obal: plátno uvnitř se při přepnutí vyhlazování vymění
  const style = document.createElement('style');
  style.textContent = shellCss;
  document.head.append(style);

  const render = createRender({ canvas: document.getElementById('c') });
  const game = createGame({ pack: globalThis.__PACK__, render });
  game.light.incremental = true; // vrstvy světla se staví po částech ve snímcích, ne jedním zásekem při načtení
  const { E, input } = game;
  const hud = createHud({ root: document.getElementById('hud') });
  const devTools = createDev({ game, hud });
  if (params.has('novis')) game.vis.enabled = false; // kreslit vše (srovnání s xView, hledání chyb viditelnosti)
  E.add({
    name: 'hud',
    phase: 'ui',
    frame(real) {
      hud.setPrompt(E.mode === 'playing' ? game.interact.prompt : '');
      if (game.light.progress < 1) hud.notify(`Počítám světlo: ${Math.round(game.light.progress * 100)} %`, 0.4);
      hud.frame(real);
      devTools.frame(real);
    },
  });

  let lostAt = -Infinity;
  const lock = createLock({
    target: view,
    onLost() {
      lostAt = performance.now();
      if (E.mode === 'playing') E.setMode('paused');
    },
  });
  if (params.has('nolock')) lock.disable();

  /** Vstup do hry: nejdřív zámek kurzoru (voláno z kliknutí), pak teprve režim. */
  async function enter(fresh) {
    // u terminálu je kurzor volný záměrně: návrat z pauzy ho nezamyká
    const r = !fresh && game.interact.seated ? 'ok' : await lock.acquire();
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
  // klidný režim: kurzor se uvolní a míří na obrazovku ve světě; Esc vrací do hry (ne do pauzy)
  E.on('interact:seated', () => {
    lock.release();
    input.releaseAll();
    hud.setCross(false);
    hud.notify('Piš na klávesnici, Enter odešle · Esc: odejít', 6);
  });
  E.on('interact:left', async () => {
    hud.setCross(E.mode === 'playing');
    // zámek, který hra uvolnila sama, smí prohlížeč vrátit hned; když odmítne, vrátí ho kliknutí do obrazu
    if (lock.enabled && (await lock.acquire()) !== 'ok') hud.notify('Klikni do obrazu pro návrat k ovládání.', 4);
  });
  /** Poloha kurzoru v obraze −1…1 (x vpravo, y nahoru). */
  const toView = (e) => {
    const r = view.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2];
  };

  // ---- vstup: klávesy podle event.code, myš jako Mouse0–2
  // u terminálu jde klávesnice na jeho obrazovku; zachytává se dřív než Shell, aby Esc nepauzoval
  addEventListener(
    'keydown',
    (e) => {
      if (E.mode !== 'playing' || !game.interact.seated || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') game.interact.leave();
      else if (e.key === 'Enter' || e.key === 'Backspace') game.interact.key(e.key);
      else if (e.key.length === 1) game.interact.type(e.key);
      else return; // funkční klávesy nechává prohlížeči
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );
  addEventListener('keydown', (e) => {
    // F3 přehled, F4 obrysy buněk a portálů: fungují i v pauze
    if (!e.repeat && devTools.key(e.code)) {
      e.preventDefault();
      return;
    }
    if (E.mode !== 'playing') return;
    const known = e.repeat ? false : input.key(e.code, true);
    if (known || PREVENT_DEFAULT.has(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => input.key(e.code, false));
  view.addEventListener('mousedown', (e) => {
    if (E.mode !== 'playing') return;
    if (game.interact.seated) {
      game.interact.pointer(...toView(e), e.button === 0);
      return;
    }
    // ztracený zámek (návrat od terminálu, který prohlížeč nezamkl) vrací první kliknutí a nic jiného nedělá
    if (lock.enabled && !lock.locked) {
      lock.acquire();
      return;
    }
    input.key(`Mouse${e.button}`, true);
  });
  addEventListener('mouseup', (e) => input.key(`Mouse${e.button}`, false));
  document.addEventListener('mousemove', (e) => {
    if (E.mode !== 'playing') return;
    if (game.interact.seated) {
      game.interact.pointer(...toView(e));
      return;
    }
    if (lock.locked || (!lock.enabled && e.buttons)) input.look(e.movementX, e.movementY);
  });
  view.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('blur', () => input.releaseAll());
  addEventListener('resize', () => render.resize());

  installHook({ game, lock, shell, hud, adapter, devTools });
  E.run();
}

boot().catch((err) => {
  console.error(err);
  const fail = document.getElementById('fail');
  fail.hidden = false;
  fail.textContent = `xEngine se nespustil: ${err.message}`;
});
