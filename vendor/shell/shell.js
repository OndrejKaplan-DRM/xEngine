// Shell, kroky S0 a S1: titul, start, pauza, Esc, nastavení z deklarací, výzva k otočení zařízení.
// Nezná engine ani plátno. S hrou mluví jen přes adaptér (frameworks/02_SHELL_Specifikace.md, oddíl 1).
//
// Adaptér:
//   meta:     { id, title, subtitle, version, tone: 'hard' | 'retro' | 'kid', orientation?: 'landscape' }
//   state:    { mode(): string, onMode(fn) }
//   game:     { newGame(), pause(), resume(), quit() }
//   settings: [deklarace]   volitelné; bez nich se položka „Nastavení“ nevykreslí
//
// Obrazovky se skládají z deklarací; položka s nesplněnou podmínkou `when` se nevykreslí.

import { STRINGS } from './strings.js';
import { createStore } from '../core/store.js';
import { createSettings } from './settings.js';
import { buildSettingsScreen } from './settings-view.js';

const ESC_GUARD_MS = 300;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountShell(adapter, { root, lang = 'cs', search = globalThis.location?.search || '', store } = {}) {
  if (!adapter?.meta || !adapter.state || !adapter.game) throw new Error('Shell: adaptér musí mít meta, state a game.');
  const t = STRINGS[lang];
  const dev = new URLSearchParams(search).has('dev');

  root.classList.add('shell', `tone-${adapter.meta.tone || 'hard'}`);
  if (dev) root.classList.add('dev');

  // --- nastavení (S1): jen když je hra deklaruje ---
  const settings = adapter.settings?.length ? createSettings(adapter.settings, store || createStore(`${adapter.meta.id}.`)) : null;
  if (settings) settings.applyAll();

  let sub = null; // otevřená podobrazovka nad menu nebo pauzou: null | 'settings'
  let returnFocus = null; // kam se vrátí fokus po zavření podobrazovky
  const openSub = (name, from) => {
    if (name) returnFocus = from || document.activeElement;
    sub = name;
    render();
    if (!name && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  };

  const settingsItem = { id: 'settings', label: 'settings', when: () => !!settings, run: (_a, btn) => openSub('settings', btn) };
  const SCREENS = {
    menu: {
      hero: true,
      items: [{ id: 'play', label: 'play', run: (a) => a.game.newGame() }, settingsItem],
    },
    paused: {
      heading: 'paused',
      items: [
        { id: 'resume', label: 'resume', run: (a) => a.game.resume() },
        { id: 'restart', label: 'restart', run: (a) => a.game.newGame() },
        settingsItem,
        { id: 'quit', label: 'quit', run: (a) => a.game.quit() },
      ],
    },
  };

  const screens = {};
  for (const [mode, def] of Object.entries(SCREENS)) {
    const screen = el('section', `sh-screen sh-${mode}`);
    screen.dataset.screen = mode;
    screen.hidden = true;

    if (def.hero) {
      screen.append(el('h1', 'sh-title', adapter.meta.title));
      if (adapter.meta.subtitle) screen.append(el('p', 'sh-subtitle', adapter.meta.subtitle));
    }
    if (def.heading) screen.append(el('h2', 'sh-heading', t[def.heading]));

    const nav = el('nav', 'sh-nav');
    for (const item of def.items) {
      if (item.when && !item.when(adapter)) continue; // deklarované schopnosti: co hra neumí, není vidět
      const btn = el('button', 'sh-btn', t[item.label]);
      btn.type = 'button';
      btn.dataset.id = item.id;
      btn.dataset.nav = '';
      btn.addEventListener('click', () => item.run(adapter, btn)); // fokus po přechodu řeší render()
      const row = el('div', 'sh-navrow');
      row.dataset.navrow = '';
      row.append(btn);
      nav.append(row);
    }
    screen.append(nav);

    if (def.hero) screen.append(el('footer', 'sh-version', adapter.meta.version + (dev ? ` · ${t.dev}` : '')));
    root.append(screen);
    screens[mode] = screen;
  }

  let settingsView = null;
  if (settings) {
    settingsView = buildSettingsScreen(settings, t, { onBack: () => openSub(null) });
    root.append(settingsView.screen);
    screens.settings = settingsView.screen;
  }

  // tlačítko pauzy pro dotyková zařízení (a myš); klávesnice má Esc
  const pauseBtn = el('button', 'sh-pause', '❚❚');
  pauseBtn.type = 'button';
  pauseBtn.tabIndex = -1;
  pauseBtn.setAttribute('aria-label', t.pause);
  pauseBtn.hidden = true;
  pauseBtn.addEventListener('click', () => adapter.game.pause());
  root.append(pauseBtn);

  // výzva k otočení: jen na dotykovém zařízení drženém na výšku, pokud hra chce šířku
  const rotate = el('section', 'sh-rotate');
  rotate.hidden = true;
  rotate.append(el('div', 'sh-rotate-icon'), el('p', 'sh-rotate-text', t.rotate));
  root.append(rotate);
  const portraitTouch = adapter.meta.orientation === 'landscape' ? matchMedia('(orientation: portrait) and (pointer: coarse)') : null;
  function checkOrientation() {
    const wrong = !!portraitTouch?.matches;
    rotate.hidden = !wrong;
    if (wrong && adapter.state.mode() === 'playing') adapter.game.pause();
  }
  portraitTouch?.addEventListener('change', checkOrientation);

  // --- která obrazovka je vidět ---
  function activeName() {
    const mode = adapter.state.mode();
    if (mode !== 'menu' && mode !== 'paused') sub = null;
    return sub || mode;
  }

  /** Prvky s fokusem po řádcích: nahoru a dolů mezi řádky, vlevo a vpravo v řádku. */
  function navRows() {
    const screen = screens[activeName()];
    if (!screen) return [];
    return [...screen.querySelectorAll('[data-navrow]')]
      .filter((row) => !row.hidden)
      .map((row) => [...row.querySelectorAll('[data-nav]')])
      .filter((row) => row.length);
  }

  let shown = null;
  function render() {
    const name = activeName();
    for (const [key, screen] of Object.entries(screens)) screen.hidden = key !== name;
    pauseBtn.hidden = adapter.state.mode() !== 'playing';
    root.dataset.mode = adapter.state.mode();
    root.dataset.screen = name;
    if (name === 'settings' && shown !== 'settings') settingsView.open();
    if (name !== shown) {
      const rows = navRows();
      const first = name === 'settings' ? rows.find((r) => !r[0].classList.contains('sh-tab'))?.[0] || rows[0]?.[0] : rows[0]?.[0];
      if (first) first.focus({ preventScroll: true });
      else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
    shown = name;
  }

  function moveFocus(code) {
    const rows = navRows();
    if (!rows.length) return false;
    const active = document.activeElement;
    let r = rows.findIndex((row) => row.includes(active));
    if (r < 0) {
      rows[0][0].focus({ preventScroll: true });
      return true;
    }
    const c = rows[r].indexOf(active);
    if (code === 'ArrowDown' || code === 'ArrowUp') {
      r = (r + (code === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      const pressed = rows[r].find((e) => e.getAttribute('aria-pressed') === 'true');
      (pressed || rows[r][Math.min(c, rows[r].length - 1)]).focus({ preventScroll: true });
      return true;
    }
    // vlevo a vpravo: posuvník si šipky zpracuje sám
    if (active instanceof HTMLInputElement) return false;
    if (rows[r].length < 2) return false;
    const next = (c + (code === 'ArrowRight' ? 1 : -1) + rows[r].length) % rows[r].length;
    rows[r][next].focus({ preventScroll: true });
    return true;
  }

  let lastEsc = -Infinity;
  function onKeyDown(e) {
    const mode = adapter.state.mode();
    if (e.code === 'Escape') {
      if (e.timeStamp - lastEsc < ESC_GUARD_MS) return; // ochrana proti dvojímu přepnutí
      lastEsc = e.timeStamp;
      if (sub) openSub(null); // Esc vždy o úroveň zpět
      else if (mode === 'playing') adapter.game.pause();
      else if (mode === 'paused') adapter.game.resume();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.code) && mode !== 'playing') {
      if (moveFocus(e.code)) e.preventDefault();
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden' && adapter.state.mode() === 'playing') adapter.game.pause();
  }

  window.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisibility);
  adapter.state.onMode(() => {
    render();
    checkOrientation();
  });
  render();
  checkOrientation();

  return {
    dev,
    settings,
    screen: () => activeName(),
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
      portraitTouch?.removeEventListener('change', checkOrientation);
      root.replaceChildren();
    },
  };
}
