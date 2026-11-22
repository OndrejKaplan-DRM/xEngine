// Společný základ testů sešny A v prohlížeči (nad test/h.cjs základu).

const h = require('../h.cjs');

const READY = 'window.__xe && window.__xe.ready';

/**
 * Známý šum softwarového vykreslování v sandboxu: skládání plátna WebGL s vrstvami HTML čte obraz zpět
 * a ovladač SwiftShader to hlásí jako varování o výkonu. Na skutečné grafice nevzniká. Nic jiného se nefiltruje.
 */
const NOISE = /GPU stall due to ReadPixels/;
const clean = (errs) => errs.filter((e) => !NOISE.test(e));

/** Kliknutí s kontrolou zásahu: prvek musí být pod svým středem opravdu navrchu (el.click() projde i přes překryv). */
const CLICK = `(sel) => {
  const el = document.querySelector(sel);
  if (!el) return 'nenalezeno: ' + sel;
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!(top === el || el.contains(top))) return 'překryto: ' + (top ? top.className || top.id || top.tagName : 'nic');
  el.click();
  return 'ok';
}`;
const click = (page, sel) => page.evaluate(`(${CLICK})(${JSON.stringify(sel)})`);

/** Úprava balíku pro volbu bare: level bez entit (jen kvádry, světla a spouštěče s cílem @level). */
const BARE = `for (const l of p.levels) {
  l.data.entities = [];
  for (const portal of l.data.portals || []) delete portal.door;
  for (const t of l.data.triggers || []) t.io = t.io.filter((k) => k.target.startsWith('@'));
}`;

/**
 * Otevře hru a počká na háček __xe. Volba bare: level bez entit; volba mutate: tělo funkce (p) => {...}, která
 * balík upraví. Balík se mění dřív, než ho hra uvidí (past na globál __PACK__), kód hry se nemění.
 * h.open základu neumí skript před načtením stránky, proto je tu vlastní otevření se stejným chováním.
 */
async function openGame(browser, { q = '', bare = false, mutate = null, context = {}, timeout = 60000 } = {}) {
  const src = mutate || (bare ? BARE : null);
  if (!src) return h.open(browser, { file: 'dist/xlab.html', ready: READY, q, context, timeout });
  const path = require('node:path');
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, ...context });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await page.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  await page.addInitScript((body) => {
    const change = new Function('p', body);
    let pack;
    Object.defineProperty(globalThis, '__PACK__', {
      configurable: true,
      get: () => pack,
      set(p) {
        change(p);
        pack = p;
      },
    });
  }, src);
  await page.goto('file://' + path.join(h.ROOT, 'dist/xlab.html') + q);
  await page.waitForFunction(READY, null, { timeout });
  return { ctx, page, errs };
}

module.exports = { ...h, READY, clean, click, openGame };
