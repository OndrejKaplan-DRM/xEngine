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
import { createBench } from './bench.js';
import { ROWS } from '../render/rows.js';

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
  // ?lightmap=5|10: zkouška textury světla s bodem 5 nebo 10 cm (N-110, D-043) na buňkách z &lmcell= (výchozí hala xLabu)
  const lmcm = Number(params.get('lightmap'));
  if ([5, 10].includes(lmcm)) game.lightmap = { texel: lmcm / 100, cells: (params.get('lmcell') || 'c_hall').split(',') };
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
      hud.setAmmo(E.mode === 'playing' && !game.interact.seated ? ammoText() : '');
      if (game.light.progress < 1) hud.notify(`Počítám světlo: ${Math.round(game.light.progress * 100)} %`, 0.4);
      hud.frame(real);
      devTools.frame(real);
    },
  });

  /** Zbraň, munice, nabití a přiblížení pro HUD (A3.1). */
  function ammoText() {
    const w = game.weapons.current;
    if (!w) return '';
    const k = game.get('weapons.charge');
    const n = w.ammo ? game.get(`weapons.ammo.${w.ammo}`) : '∞';
    const unit = w.ammo ? game.pack.ammo?.ammo?.[w.ammo]?.title || w.ammo : '';
    return `${w.title}${game.weapons.zoomed ? ' · přiblíženo' : ''}\n${k >= 0 ? `nabíjení ${Math.round(k * 100)} %   ` : ''}${unit ? `${unit}: ` : ''}${n}`;
  }
  E.on('weapon:switched', (e) => {
    if (e.weapon) hud.notify(`${game.weapons.current.title}: střelba ${keyLabel('grab')}, nabíjení ${keyLabel('alt')} (podržet), přiblížení ${keyLabel('zoom')}`, 6);
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
  const bench = createBench({ game, lock, root: document.body });

  /** Vstup do hry: nejdřív zámek kurzoru (voláno z kliknutí), pak teprve režim. */
  async function enter(fresh) {
    const r = await lock.acquire(); // i u terminálu: zámek kurzoru drží celý pobyt (D-024)
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
  // klidný režim (D-024): zámek kurzoru zůstává, myš vede vlastní kurzor po obrazovce ve světě. Esc je i tady pauza
  // (prohlížeč při Esc zámek uvolní vždy); odchází se šipkou dolů nebo pravým tlačítkem myši.
  E.on('interact:seated', () => {
    input.releaseAll();
    hud.setCross(false);
    hud.notify('Piš na klávesnici, Enter odešle · odejít: šipka dolů nebo pravé tlačítko myši · Esc: pauza', 8);
  });
  E.on('interact:left', () => {
    hud.setCross(E.mode === 'playing');
    hud.notify('', 0); // nápověda terminálu po odchodu nezůstává viset
  });
  /** Poloha kurzoru v obraze −1…1 (x vpravo, y nahoru). */
  const toView = (e) => {
    const r = view.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2];
  };

  // ---- vstup: klávesy podle event.code, myš jako Mouse0–2
  // u terminálu jde klávesnice na jeho obrazovku (zachytává se dřív než herní akce). Esc se nezachytává: je to pauza.
  addEventListener(
    'keydown',
    (e) => {
      if (E.mode !== 'playing' || !game.interact.seated || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'ArrowDown') game.interact.leave(); // krok vzad od stolu
      else if (e.key === 'Enter' || e.key === 'Backspace') game.interact.key(e.key);
      else if (e.key.length === 1) game.interact.type(e.key);
      else return; // Esc (pauza) a funkční klávesy jdou dál
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
    // F9: měření skutečné hry (totéž co adresa ?bench); funguje z menu i ze hry
    if (e.code === 'F9' && !e.repeat) {
      e.preventDefault();
      if (!bench.active) {
        lock.release();
        bench.run();
      }
      return;
    }
    if (E.mode !== 'playing') return;
    const known = e.repeat ? false : input.key(e.code, true);
    if (known || PREVENT_DEFAULT.has(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => input.key(e.code, false));
  view.addEventListener('mousedown', (e) => {
    if (E.mode !== 'playing') return;
    // ztracený zámek vrací první kliknutí a nic jiného nedělá
    if (lock.enabled && !lock.locked) {
      lock.acquire();
      return;
    }
    if (game.interact.seated) {
      if (e.button === 2) game.interact.leave();
      else if (lock.locked) {
        if (e.button === 0) game.interact.click();
      } else game.interact.pointer(...toView(e), e.button === 0); // bez zámku: kurzor systému
      return;
    }
    if (e.button === 1) e.preventDefault(); // prostřední tlačítko = druhá střelba, ne posouvání stránky
    input.key(`Mouse${e.button}`, true);
  });
  addEventListener('mouseup', (e) => input.key(`Mouse${e.button}`, false));
  document.addEventListener('mousemove', (e) => {
    if (E.mode !== 'playing') return;
    if (game.interact.seated) {
      if (lock.locked) game.interact.cursor(e.movementX, e.movementY);
      else game.interact.pointer(...toView(e));
      return;
    }
    if (lock.locked || (!lock.enabled && e.buttons)) input.look(e.movementX, e.movementY);
  });
  view.addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('blur', () => input.releaseAll());
  addEventListener('resize', () => render.resize());

  installHook({ game, lock, shell, hud, adapter, devTools, bench });
  E.run();
  // ?grid=0.25: jemnější mřížka světla pro tento běh (jinak platí nastavení); hodí se k měření ?bench&grid=0.25
  if (params.has('grid') && [0.5, 0.25].includes(Number(params.get('grid')))) game.world.lightCell = Number(params.get('grid'));
  // ?bench: měření skutečné hry hned po načtení; volitelně &rows=576|768|1080, &aa=1, &quick (jen první dvě buňky)
  if (params.has('bench')) {
    const rows = Number(params.get('rows'));
    setTimeout(() => bench.run({ rows: ROWS.includes(rows) ? rows : undefined, aa: params.has('aa') ? params.get('aa') !== '0' : undefined, quick: params.has('quick'), fire: params.get('fire') !== '0' }), 600);
  }
}

boot().catch((err) => {
  console.error(err);
  const fail = document.getElementById('fail');
  fail.hidden = false;
  fail.textContent = `xEngine se nespustil: ${err.message}`;
});
