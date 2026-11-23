// T5 v prohlížeči: cíl xlab_gen (engine sešny A + balík sešny B). Každý level balíku se spustí bez chyby v konzoli
// a ze čtyř míst na cestě robota (test/out/t5_axb.json z t5_axb.mjs) se vykreslí obraz v rozpočtu volání kreslení.
// Snímky zůstávají v test/out pro montáž. Časy snímku ze sandboxu se neměří: softwarové vykreslení o T460 nic neříká.

const fs = require('node:fs');
const path = require('node:path');
const h = require('./h.cjs');
const { clean, READY } = require('./a_lib/browser.cjs');

const CALLS_MAX = 400; // docs/06_ROZPOCTY.md

(async () => {
  const reportFile = path.join(h.OUT, 't5_axb.json');
  if (!fs.existsSync(reportFile)) {
    h.ok(false, 'test/out/t5_axb.json existuje (nejdřív pusť node test/t5_axb.mjs)');
    process.exit(h.finish('T5 zkouška A × B, prohlížeč'));
  }
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8')).filter((r) => r.pack === 'gen_demo');
  const browser = await h.launch();
  try {
    for (const r of report) {
      const { ctx, page, errs } = await h.open(browser, { file: 'dist/xlab_gen.html', q: `?level=${r.level}&aa=0`, ready: READY });
      const first = await page.evaluate(() => globalThis.__levels[0]);
      await page.evaluate(() => { window.__xe.start(); window.__xe.sim(0.5); });
      const state = await page.evaluate(() => ({ level: window.__xe.get('session.level'), mode: window.__xe.get('kernel.mode') }));
      h.ok(first === r.level && state.level === r.level && state.mode === 'playing', `${r.level}: hra běží v levelu sešny B`, `level ${state.level}, režim ${state.mode}`);
      let maxCalls = 0;
      for (const [i, v] of r.views.entries()) {
        const s = await page.evaluate(([x, y, z, yaw]) => window.__xe.shotAt(x, y, z, yaw, -5), v);
        maxCalls = Math.max(maxCalls, s.calls);
        h.saveDataUrl(s.png, `t5_${r.level}_${i}.png`);
      }
      h.ok(r.views.length > 0 && maxCalls <= CALLS_MAX, `${r.level}: ${r.views.length} pohledy z cesty robota v rozpočtu volání kreslení`, `nejvýš ${maxCalls} volání (mez ${CALLS_MAX})`);
      const bad = clean(errs);
      h.ok(bad.length === 0, `${r.level}: žádná chyba ani varování v konzoli`, bad.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  process.exit(h.finish('T5 zkouška A × B, prohlížeč'));
})();
