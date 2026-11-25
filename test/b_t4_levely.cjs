// B-T4: vygenerované levely v prohlížeči xView (cíl xgen, xView beze změny). Validátor v prohlížeči bez nálezů,
// pohledy nejsou prázdné, přepínač levelů funguje. Vznikne montáž pro Ondřeje: u každého levelu půdorys po patrech,
// přehled a pohled ze startu (test/out/b_levely_montaz.png).

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { launch, open, ok, saveDataUrl, finish, ROOT, OUT } = require('./h.cjs');

const span = (level, k) => Math.max(...level.cells.map((c) => c.bounds.max[k])) - Math.min(...level.cells.map((c) => c.bounds.min[k]));
const height = (level) => span(level, 1);
const depth = (level) => span(level, 2);
const NOISE = /ERR_FAILED|may close only|GPU stall|Automatic fallback to software WebGL/i;

(async () => {
  execFileSync(process.execPath, ['build.mjs', 'xgen'], { cwd: ROOT, stdio: 'pipe' });
  const { readPackFull } = await import(path.join(ROOT, 'tools/lib/read-pack.mjs'));
  const { makeCatalog } = await import(path.join(ROOT, 'src/gen/index.js'));
  const { planSvg, floorLevels } = await import(path.join(ROOT, 'src/gen/plan-svg.js'));
  const pack = await readPackFull(path.join(ROOT, 'packs/gen_demo'));
  const catalog = makeCatalog({ manifest: { id: 'kit_base' }, prefabs: pack.prefabs, materials: pack.materials });
  const browser = await launch();
  let code = 1;
  try {
    const rows = [];
    for (const [i, lv] of pack.levels.entries()) {
      const level = lv.data;
      const { ctx, page, errs } = await open(browser, { file: 'dist/xgen.html', q: `?level=${i}`, ready: 'window.__xview && window.__xview.ready === true', context: { viewport: { width: 960, height: 600 } } });
      const f = await page.evaluate(() => ({ e: __xview.findings.errors.length, w: __xview.findings.warnings.length, s: __xview.findings.stats.levels[0], buttons: document.querySelectorAll('#levels button').length, on: document.querySelector('#levels button.on')?.textContent, views: [...document.querySelectorAll('#views button')].map((b) => b.dataset.view) }));
      ok(f.e === 0 && f.w === 0, `${level.id}: validátor v prohlížeči bez nálezů`, `${f.e} chyb, ${f.w} varování`);
      ok(f.s.id === level.id && f.s.cells === level.cells.length && f.on === level.title, `${level.id}: prohlížeč kreslí vybraný level`, `buněk ${f.s.cells}, portálů ${f.s.portals}, entit ${f.s.entities}`);
      ok(f.buttons === pack.levels.length && f.views.join(' ') === 'iso top start', `${level.id}: přepínač levelů a tři pohledy`, `${f.buttons} levely`);
      const shots = {};
      for (const v of ['iso', 'start']) {
        const r = await page.evaluate((name) => {
          __xview.view(name);
          const info = __xview.info();
          const c = document.createElement('canvas');
          c.width = 64;
          c.height = 40;
          const g = c.getContext('2d');
          g.drawImage(document.getElementById('c'), 0, 0, 64, 40);
          const px = g.getImageData(0, 0, 64, 40).data;
          const seen = new Set();
          let sum = 0;
          for (let k = 0; k < px.length; k += 4) {
            sum += px[k] + px[k + 1] + px[k + 2];
            seen.add((px[k] >> 4) * 256 + (px[k + 1] >> 4) * 16 + (px[k + 2] >> 4));
          }
          return { info, mean: sum / (px.length / 4) / 3, colors: seen.size, png: __xview.shot() };
        }, v);
        shots[v] = r.png;
        saveDataUrl(r.png, `b_level_${level.id}_${v}.png`);
        // xView staví kameru přehledu do výšky 0,6 × hloubka levelu; vyšší dům (4 podlaží, 12 m) vidí zvenku jen
        // nejvyšší strop a štít, proto u něj stačí tři odstíny (návrh N-015 pro svodnou sešnu)
        const tall = v === 'iso' && height(level) > 0.6 * depth(level);
        ok(r.mean > 4 && r.colors >= (tall ? 3 : 8) && r.info.tris > 0, `${level.id}: pohled ${v} není prázdný`, `jas ${r.mean.toFixed(1)}, ${r.colors} odstínů, ${r.info.calls} volání, ${r.info.tris} △${tall ? ', level vyšší než kamera přehledu (N-015)' : ''}`);
      }
      const hard = errs.filter((e) => !NOISE.test(e));
      ok(hard.length === 0, `${level.id}: žádná chyba ani varování v konzoli`, hard.slice(0, 2).join(' | '));
      rows.push({ level, shots, floors: floorLevels(level).length, svg: planSvg(level, catalog, { scale: 13 }) });
      await ctx.close();
    }
    ok(rows.some((r) => r.floors > 1), 'aspoň jeden ukázkový level má dvě patra', rows.map((r) => `${r.level.id}: ${r.floors}`).join(', '));

    // montáž: půdorys po patrech + přehled + pohled ze startu
    const page = await browser.newPage({ viewport: { width: 1700, height: 900 } });
    const html = rows.map((r) => `<section><h2>${r.level.title} · buněk ${r.level.cells.length}, portálů ${r.level.portals.length} (dveří ${r.level.portals.filter((p) => p.door).length}), entit ${r.level.entities.length}, světel ${r.level.lights.length}</h2><div class="row">${r.svg}<img src="${r.shots.iso}"><img src="${r.shots.start}"></div></section>`).join('');
    await page.setContent(`<body style="margin:0;padding:14px;background:#0b0d12;color:#d8dbe2;font:14px system-ui,sans-serif"><style>h2{font-size:15px;font-weight:600;margin:14px 0 8px}.row{display:flex;gap:10px;align-items:flex-start}img{width:520px;border:1px solid #232937}</style>${html}</body>`);
    const file = path.join(OUT, 'b_levely_montaz.png');
    await page.screenshot({ path: file, fullPage: true, timeout: 120000 });
    ok(fs.statSync(file).size > 50000, 'montáž levelů uložena', `${path.relative(ROOT, file)}, ${(fs.statSync(file).size / 1024).toFixed(0)} kB`);
    for (const r of rows) fs.writeFileSync(path.join(OUT, `b_pudorys_${r.level.id}.svg`), planSvg(r.level, catalog, { scale: 22 }));
    code = finish('B-T4 levely');
  } finally {
    await browser.close();
  }
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
