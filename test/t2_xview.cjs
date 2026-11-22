// T2: prohlížeč levelů v Chromiu bez grafické karty. Ověřuje, že data jdou vykreslit,
// že validátor běží i v prohlížeči a že testovací základ (h.cjs) v tomto prostředí funguje.

const { launch, open, ok, saveDataUrl, finish } = require('./h.cjs');

(async () => {
  const browser = await launch();
  let code = 1;
  try {
    const { page, errs } = await open(browser, { file: 'dist/xview.html', ready: 'window.__xview && window.__xview.ready === true' });
    const f = await page.evaluate(() => ({ e: __xview.findings.errors.length, w: __xview.findings.warnings.length, s: __xview.findings.stats.levels[0] }));
    ok(f.e === 0 && f.w === 0, 'validátor v prohlížeči: zlatý vzorek bez nálezů', `${f.e} chyb, ${f.w} varování`);
    ok(f.s.cells === 5 && f.s.portals === 4, 'level má 5 buněk a 4 portály');

    const views = await page.evaluate(() => __xview.views);
    ok(views.join(' ') === 'iso top start lab hall', 'prohlížeč nabízí pět pohledů', views.join(' '));

    for (const v of views) {
      const r = await page.evaluate((name) => {
        __xview.view(name);
        const info = __xview.info();
        const c = document.createElement('canvas');
        const src = document.getElementById('c');
        c.width = 64;
        c.height = 36;
        const g = c.getContext('2d');
        g.drawImage(src, 0, 0, 64, 36);
        const px = g.getImageData(0, 0, 64, 36).data;
        let sum = 0;
        const seen = new Set();
        for (let i = 0; i < px.length; i += 4) {
          sum += px[i] + px[i + 1] + px[i + 2];
          seen.add((px[i] >> 4) * 256 + (px[i + 1] >> 4) * 16 + (px[i + 2] >> 4));
        }
        return { info, mean: sum / (px.length / 4) / 3, colors: seen.size, png: __xview.shot() };
      }, v);
      saveDataUrl(r.png, `xview_${v}.png`);
      ok(r.info.calls > 0 && r.info.calls <= 80, `pohled ${v}: volání kreslení v rozumné mezi`, `${r.info.calls} volání, ${r.info.tris} △`);
      ok(r.mean > 6 && r.colors >= 8, `pohled ${v}: obraz není prázdný ani jednobarevný`, `jas ${r.mean.toFixed(1)}, ${r.colors} odstínů`);
    }

    const noProps = await page.evaluate(() => {
      __xview.view('lab');
      const a = __xview.info().tris;
      __xview.layer('props', false);
      const b = __xview.info().tris;
      __xview.layer('props', true);
      return { a, b };
    });
    ok(noProps.b < noProps.a, 'vypnutí vrstvy prefabů ubere trojúhelníky', `${noProps.a} → ${noProps.b}`);

    const hard = errs.filter((e) => !/ERR_FAILED|may close only|GPU stall|Automatic fallback to software WebGL/i.test(e));
    ok(hard.length === 0, 'žádná chyba ani varování v konzoli', hard.slice(0, 3).join(' | '));
    code = finish('T2 xView');
  } finally {
    await browser.close();
  }
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
