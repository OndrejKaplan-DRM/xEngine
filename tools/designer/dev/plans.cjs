// Vývojová pomůcka: vygeneruje levely a vykreslí jejich půdorysy do jednoho PNG (přes Chromium).
// node tools/designer/dev/plans.cjs out.png complex:1 complex:2:floors=1 catacombs:3
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.resolve(__dirname, '../../..');
(async () => {
  const gen = await import(path.join(ROOT, 'src/gen/index.js'));
  const { planSvg } = await import(path.join(ROOT, 'src/gen/plan-svg.js'));
  const { kitAsPack } = await import(path.join(ROOT, 'tools/forge/kit/index.mjs'));
  const catalog = gen.makeCatalog(kitAsPack());
  const [out, ...specs] = process.argv.slice(2);
  const svgs = specs.map((s) => {
    const [preset, seed, ...rest] = s.split(':');
    const opts = Object.fromEntries(rest.map((r) => r.split('=')).map(([k, v]) => [k, v === 'true' ? true : Number(v)]));
    const { level, info } = gen.generateLevel(preset, Number(seed), catalog, opts);
    console.log(level.id, JSON.stringify(info));
    return planSvg(level, catalog, { scale: Number(process.env.SCALE || 16) });
  });
  const { launch } = require(path.join(ROOT, 'test/h.cjs'));
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await page.setContent(`<body style="margin:0;background:#151922;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start">${svgs.join('')}</body>`);
  const el = await page.$('body');
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
