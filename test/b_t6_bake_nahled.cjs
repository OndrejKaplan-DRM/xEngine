// B-T6: náhled zapečeného světla v Chromiu bez grafické karty. Stránka zapeče xLab, vykreslí ho bez světel za běhu
// a vznikne montáž pro Ondřeje: xView (světla po pixelech) × vrstvy bez zastínění × zapečené světlo se stíny.
// Obraz ze softwarového vykreslování říká „kreslí se to a stín je vidět“, ne jak to vypadá na skutečné grafické kartě.

const { execFileSync } = require('node:child_process');
const { launch, open, ok, saveDataUrl, finish, ROOT } = require('./h.cjs');

const VIEWPORT = { viewport: { width: 960, height: 540 } };
const quiet = (errs) => errs.filter((e) => !/GPU stall|fallback to software|ERR_FAILED/i.test(e));

(async () => {
  execFileSync(process.execPath, ['build.mjs', 'xbake'], { cwd: ROOT, stdio: 'pipe' });
  execFileSync(process.execPath, ['build.mjs', 'xview'], { cwd: ROOT, stdio: 'pipe' });
  const browser = await launch();
  let code = 1;
  try {
    // snímky z xView pro srovnání
    const ref = {};
    {
      const { page } = await open(browser, { file: 'dist/xview.html', ready: 'window.__xview && window.__xview.ready === true', context: VIEWPORT });
      for (const v of ['start', 'lab', 'hall']) {
        ref[v] = await page.evaluate((name) => {
          __xview.view(name);
          return __xview.shot();
        }, v);
      }
      await page.context().close();
    }

    const { page, errs } = await open(browser, { file: 'dist/xbake.html', ready: 'window.__xbake && window.__xbake.ready === true', context: VIEWPORT, timeout: 120000 });
    const head = await page.evaluate(() => ({ views: __xbake.views, stats: __xbake.stats }));
    ok(head.stats.samples === 20658 && head.stats.layers === 16, 'stránka zapekla xLab stejně jako nástroj v Node', `${head.stats.samples} vzorků, ${head.stats.layers} vrstev, ${(head.stats.ms / 1000).toFixed(1)} s v prohlížeči`);
    ok(['iso', 'start', 'lab', 'hall', 'pillar'].every((v) => head.views.includes(v)), 'náhled nabízí pohledy shodné s xView a pohled na stín sloupu', head.views.join(' '));

    // statistika obrazu: průměrný jas a počet odstínů; rozdíl dvou obrazů
    await page.evaluate(() => {
      const load = (url) =>
        new Promise((res) => {
          const im = new Image();
          im.onload = () => res(im);
          im.src = url;
        });
      const pixels = async (url) => {
        const im = await load(url);
        const c = document.createElement('canvas');
        c.width = im.width;
        c.height = im.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(im, 0, 0);
        return g.getImageData(0, 0, c.width, c.height).data;
      };
      window.__img = {
        async stat(url) {
          const d = await pixels(url);
          let sum = 0;
          const seen = new Set();
          for (let i = 0; i < d.length; i += 4) {
            sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (i % 64 === 0) seen.add((d[i] >> 3) | ((d[i + 1] >> 3) << 5) | ((d[i + 2] >> 3) << 10));
          }
          return { mean: sum / (d.length / 4), colors: seen.size };
        },
        async diff(a, b) {
          const [p, q] = [await pixels(a), await pixels(b)];
          let sum = 0;
          for (let i = 0; i < p.length; i += 4) sum += Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]);
          return sum / ((p.length / 4) * 3);
        },
        async montage(rows, labels, w) {
          const first = await load(rows[0][0]);
          const h = Math.round((w * first.height) / first.width);
          const c = document.createElement('canvas');
          c.width = w * rows[0].length;
          c.height = (h + 22) * rows.length;
          const g = c.getContext('2d');
          g.fillStyle = '#0b0d12';
          g.fillRect(0, 0, c.width, c.height);
          g.font = '13px system-ui, sans-serif';
          for (let r = 0; r < rows.length; r++) {
            for (let k = 0; k < rows[r].length; k++) {
              g.drawImage(await load(rows[r][k]), k * w, r * (h + 22) + 22, w, h);
              g.fillStyle = '#d8dbe2';
              g.fillText(labels[r][k], k * w + 6, r * (h + 22) + 15);
            }
          }
          return c.toDataURL('image/png');
        },
      };
    });
    const shot = (view, state) =>
      page.evaluate(
        ([v, s]) => {
          __xbake.set(s);
          __xbake.view(v);
          return __xbake.shot();
        },
        [view, state],
      );
    const FLAT = { shadows: false, indirect: false, ao: false, lamps: false };
    const DIRECT = { shadows: true, indirect: false, ao: false, lamps: false };
    const BAKED = { shadows: true, indirect: true, ao: true, lamps: false };

    const rows = [];
    const labels = [];
    const empty = [];
    const same = [];
    for (const v of ['start', 'lab', 'hall']) {
      const flat = await shot(v, FLAT);
      const baked = await shot(v, BAKED);
      for (const [name, url] of [['bez stínů', flat], ['zapečené', baked]]) {
        const s = await page.evaluate((u) => __img.stat(u), url);
        if (s.colors < 12 || s.mean < 3) empty.push(`${v} ${name}`);
      }
      if ((await page.evaluate(([a, b]) => __img.diff(a, b), [flat, baked])) < 0.5) same.push(v);
      rows.push([ref[v], flat, baked]);
      labels.push([`xView: světla po pixelech (${v})`, 'xBake: vrstvy bez zastínění', 'xBake: stíny, odraz a kouty']);
    }
    ok(empty.length === 0, 'tři pohledy z očí se vykreslí bez světel za běhu (obraz není prázdný ani jednobarevný)', empty.join(', '));
    ok(same.length === 0, 'zapečené světlo se v obraze liší od vrstev bez zastínění', same.join(' '));

    // stín sloupu: tentýž pohled jen s přímým světlem je tmavší se zastíněním než bez něj
    const pFlat = await shot('pillar', FLAT);
    const pDirect = await shot('pillar', DIRECT);
    const pBaked = await shot('pillar', BAKED);
    const [a, b] = [await page.evaluate((u) => __img.stat(u), pFlat), await page.evaluate((u) => __img.stat(u), pDirect)];
    ok(b.mean < a.mean - 1, 'pohled na stín sloupu je se zastíněním tmavší než bez něj (jen přímé světlo)', `průměrný jas ${b.mean.toFixed(1)} proti ${a.mean.toFixed(1)} z 255`);
    rows.push([pFlat, pDirect, pBaked]);
    labels.push(['xBake: vrstvy bez zastínění (sloup v hale)', 'xBake: jen přímé světlo se stíny', 'xBake: stíny, odraz a kouty']);

    saveDataUrl(await page.evaluate(([r, l]) => __img.montage(r, l, 480), [rows, labels]), 'b_bake_montaz.png');
    const lamps = await page.evaluate(([x, y]) => __img.diff(x, y), [await shot('lab', BAKED), await shot('lab', { ...BAKED, lamps: true })]);
    ok(lamps > 0.5, 'vrstvy svítidel jdou zapnout zvlášť (lampa laboratoře změní obraz)', `průměrný rozdíl ${lamps.toFixed(1)} z 255`);
    ok(quiet(errs).length === 0, 'žádná chyba ani varování v konzoli', quiet(errs).slice(0, 2).join(' | '));
    code = finish('B-T6 náhled xBake');
  } finally {
    await browser.close();
  }
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
