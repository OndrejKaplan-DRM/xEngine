// Vývojová pomůcka: montáž pohledů galerie (čistý, T460, grafická karta) pro vybrané prefaby z dist/kit.html.
// node tools/forge/dev/kitlooks.cjs [id,id,…] [px = 220] [sloupců = 2]  → test/out/kit_looks.png
const path = require('node:path');
const { launch, open, saveDataUrl } = require(path.resolve(__dirname, '../../../test/h.cjs'));
const DEFAULT = 'cabinet_file_01,crate_plank_01,crate_large_01,table_work_01,desk_office_01,bench_stone_01,sarcophagus_01,barrel_wood_01,chest_wood_01,door_plank_01,table_lab_01,shelf_rack_01';
(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await open(browser, { file: 'dist/kit.html', ready: 'window.__kit && window.__kit.ready === true && window.__kit.textures().state !== "načítám"', context: { viewport: { width: 1366, height: 768 } } });
    const tex = await page.evaluate(() => __kit.textures());
    const ids = (process.argv[2] || DEFAULT).split(',');
    const png = await page.evaluate(([a, px, cols]) => __kit.compare(a, px, cols), [ids, Number(process.argv[3] || 220), Number(process.argv[4] || 2)]);
    const sw = await page.evaluate(() => __kit.swatches(170, 3));
    console.log(JSON.stringify(tex), saveDataUrl(png, 'kit_looks.png'), saveDataUrl(sw, 'kit_swatches.png'), errs.filter((e) => !/ERR_FAILED|GPU stall|fallback to software/i.test(e)).slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
