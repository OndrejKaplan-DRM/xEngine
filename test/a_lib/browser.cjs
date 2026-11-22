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

/** Otevře hru a počká na háček __xe. */
const openGame = (browser, opts = {}) => h.open(browser, { file: 'dist/xlab.html', ready: READY, ...opts });

module.exports = { ...h, READY, clean, click, openGame };
