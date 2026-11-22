// B-T3: galerie sady v Chromiu bez grafické karty. Každý prefab se vykreslí v klidu i v krajní poloze kloubu,
// stránka ukazuje meze a jejich zdůvodnění a vznikne montáž pro Ondřeje (test/out/b_kit_galerie.png).
// Obraz ze softwarového vykreslování říká jen „kreslí se to“, ne jak to vypadá na skutečné grafické kartě.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { launch, open, ok, saveDataUrl, finish, ROOT } = require('./h.cjs');

(async () => {
  execFileSync(process.execPath, ['build.mjs', 'kit'], { cwd: ROOT, stdio: 'pipe' });
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'packs/kit_base/pack.json'), 'utf8'));
  const browser = await launch();
  let code = 1;
  try {
    const { page, errs } = await open(browser, { file: 'dist/kit.html', ready: 'window.__kit && window.__kit.ready === true' });
    const head = await page.evaluate(() => ({ e: __kit.findings.errors.length, w: __kit.findings.warnings.length, ids: __kit.ids, jointed: __kit.jointed, listed: document.querySelectorAll('#list button').length }));
    ok(head.e === 0 && head.w === 0, 'validátor v prohlížeči: sada bez nálezů', `${head.e} chyb, ${head.w} varování`);
    ok(head.ids.length === manifest.prefabs.length && head.listed === head.ids.length, 'galerie nabízí každý prefab balíku', `${head.ids.length} prefabů, ${head.jointed.length} s kloubem`);

    const empty = [];
    const still = [];
    for (const id of head.ids) {
      const r = await page.evaluate((x) => __kit.check(x), id);
      if (r.rest.colors < 4 || r.far.colors < 4) empty.push(id);
      if (head.jointed.includes(id) && r.moved < 0.0015) still.push(id);
    }
    ok(empty.length === 0, 'každý prefab se vykreslí v klidu i v krajní poloze (obraz není jednobarevný)', empty.join(' '));
    ok(still.length <= head.jointed.length * 0.15, 'krajní poloha kloubu je v obraze vidět', `${head.jointed.length - still.length} z ${head.jointed.length}; malý zdvih: ${still.join(' ') || 'žádný'}`);

    const info = await page.evaluate(() => {
      __kit.select('fumehood_01');
      __kit.pose(1);
      return { text: document.getElementById('info').textContent, joints: document.querySelectorAll('#info .joint').length, slider: document.getElementById('pose').value };
    });
    ok(info.joints === 1 && /0 až 0,5 m/.test(info.text) && /digestoř/i.test(info.text) && info.slider === '100', 'panel ukazuje kloub, jeho meze a zdůvodnění', info.text.slice(0, 60).replace(/\s+/g, ' '));
    saveDataUrl(await page.evaluate(() => __kit.shot()), 'b_kit_digestor.png');

    const all = await page.evaluate(() => {
      __kit.all();
      return { png: __kit.shot(), on: document.getElementById('mode-all').classList.contains('on') };
    });
    saveDataUrl(all.png, 'b_kit_cela_sada.png');
    ok(all.on, 'režim „Celá sada“ se přepne a vykreslí');

    const png = await page.evaluate(() => __kit.montage(undefined, 150, 6));
    const file = saveDataUrl(png, 'b_kit_galerie.png');
    ok(fs.statSync(file).size > 50000, 'montáž galerie uložena', `${path.relative(ROOT, file)}, ${(fs.statSync(file).size / 1024).toFixed(0)} kB`);

    const hard = errs.filter((e) => !/ERR_FAILED|may close only|GPU stall|Automatic fallback to software WebGL/i.test(e));
    ok(hard.length === 0, 'žádná chyba ani varování v konzoli', hard.slice(0, 3).join(' | '));
    code = finish('B-T3 galerie');
  } finally {
    await browser.close();
  }
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
