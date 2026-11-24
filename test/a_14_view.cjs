// A1.4 v prohlížeči: prefaby v klidové poloze vypadají jako v xView (stejné díly, stejné matice koster).
// Tři pohledy z xView (start, laboratoř, hala), jedna montáž pro kontrolu okem v test/out/a14_montaz.png.

const fs = require('node:fs');
const path = require('node:path');
const { launch, open, openGame, ok, finish, clean, saveDataUrl, OUT } = require('./a_lib/browser.cjs');
const { compare, imageStats } = require('./a_lib/image.cjs');

// pohledy xView (tools/xview/main.js, VIEWS): poloha oka a bod, na který se dívá
const VIEWS = {
  start: (sp) => ({ pos: [sp.pos[0], sp.pos[1] + 1.6, sp.pos[2]], look: [sp.pos[0], sp.pos[1] + 1.5, sp.pos[2] - 4] }),
  lab: () => ({ pos: [5, 1.6, -3], look: [11, 1.0, -6.5] }),
  hall: () => ({ pos: [3, 1.6, -9.2], look: [1.5, 1.2, -22] }),
};

(async () => {
  const browser = await launch();
  try {
    const xv = await open(browser, { file: 'dist/xview.html', ready: 'window.__xview && window.__xview.ready' });
    const ref = {};
    for (const name of Object.keys(VIEWS)) ref[name] = await xv.page.evaluate((n) => (__xview.view(n), __xview.shot()), name);
    await xv.page.context().close();

    const { page, errs } = await openGame(browser, { q: '?dev' });
    const sp = await page.evaluate(() => __PACK__.levels[0].data.spawns.find((s) => s.kind === 'player'));
    await page.evaluate(() => {
      __xe.start();
      __xe.shadows(false); // xView kreslí celý level, svítí všemi světly a stíny nemá
      __xe.vis(false);
      __xe.sim(0.5);
    });
    const files = [];
    for (const [name, make] of Object.entries(VIEWS)) {
      const v = make(sp);
      const d = [v.look[0] - v.pos[0], v.look[1] - v.pos[1], v.look[2] - v.pos[2]];
      const yaw = (Math.atan2(-d[0], -d[2]) * 180) / Math.PI;
      const pitch = (Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180) / Math.PI;
      const shot = await page.evaluate(([p, y, pi]) => __xe.shotAt(p[0], p[1], p[2], y, pi, 60), [v.pos, yaw, pitch]);
      const diff = await compare(page, ref[name], shot.png);
      const img = await imageStats(page, shot.png);
      files.push(saveDataUrl(ref[name], `a14_xview_${name}.png`), saveDataUrl(shot.png, `a14_xlab_${name}.png`));
      // xView kreslí zhasnuté lampy svítivou barvou; hra je kreslí zhasnuté. Proto tolerance na podíl bodů.
      ok(diff.mean < 3 && diff.over < 0.02, `pohled „${name}“ s prefaby odpovídá xView`, `rozdíl ${diff.mean.toFixed(2)} z 255, bodů nad prahem ${(diff.over * 100).toFixed(2)} %; ${shot.calls} volání, ${shot.tris} △`);
      ok(img.dark < 0.4 && shot.calls <= 150, `pohled „${name}“: bez černých ploch, volání ≤ 150`, `černých bodů ${(img.dark * 100).toFixed(1)} %, ${shot.calls} volání`);
    }
    fs.writeFileSync(path.join(OUT, 'a14_files.json'), JSON.stringify(files));
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.4 entity (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
