// Vývojová pomůcka: montáž dlaždic z dist/kit.html. node tools/forge/dev/kitshot.cjs [počet = 24] [od = 0] [id prefabu pro jeden velký snímek]
const path = require('node:path');
const { launch, open, saveDataUrl } = require(path.resolve(__dirname, '../../../test/h.cjs'));
(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await open(browser, { file: 'dist/kit.html', ready: 'window.__kit && window.__kit.ready === true', context: { viewport: { width: 1366, height: 768 } } });
    const ids = await page.evaluate(() => __kit.ids);
    const n = Number(process.argv[2] || 24), from = Number(process.argv[3] || 0);
    const png = await page.evaluate(([a, b]) => __kit.montage(__kit.ids.slice(a, a + b), 200, 4), [from, n]);
    console.log(ids.length, saveDataUrl(png, `kit_m_${from}.png`), errs.filter((e) => !/ERR_FAILED|GPU stall|fallback to software/i.test(e)).slice(0, 3).join(' | '));
    if (process.argv[4]) { await page.evaluate((id) => { __kit.select(id); __kit.pose(1); }, process.argv[4]); saveDataUrl(await page.evaluate(() => __kit.shot()), 'kit_one.png'); await page.screenshot({ path: 'test/out/kit_page.png' }); }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
