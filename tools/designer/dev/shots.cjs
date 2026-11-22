// Vývojová pomůcka: snímky z dist/xgen.html. node tools/designer/dev/shots.cjs <předpona> "level=0;view=iso" "level=0;view=start;eye=x,y,z" …
const path = require('node:path');
const { launch, open, saveDataUrl } = require(path.resolve(__dirname, '../../../test/h.cjs'));
(async () => {
  const [prefix, ...specs] = process.argv.slice(2);
  const browser = await launch();
  try {
    for (const [i, spec] of specs.entries()) {
      const o = Object.fromEntries(spec.split(';').map((s) => s.split('=')));
      const q = `?level=${o.level || 0}` + (o.eye ? `&eye=${o.eye}` : '');
      const { ctx, page, errs } = await open(browser, { file: 'dist/xgen.html', q, ready: 'window.__xview && window.__xview.ready === true', context: { viewport: { width: Number(o.w || 960), height: Number(o.h || 600) } } });
      const r = await page.evaluate((v) => { __xview.view(v); if (v !== 'start') { __xview.layer('lights', true); } const f = __xview.findings; return { png: __xview.shot(), info: __xview.info(), e: f.errors.length, w: f.warnings.length }; }, o.view || 'iso');
      const file = saveDataUrl(r.png, `${prefix}_${i}.png`);
      console.log(spec, JSON.stringify(r.info), `chyb ${r.e}, varování ${r.w}`, errs.filter((e) => !/ERR_FAILED|GPU stall|fallback to software/i.test(e)).slice(0, 2).join(' | '), file);
      await ctx.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
