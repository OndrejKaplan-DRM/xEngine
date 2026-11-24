// B-T8: zásuvky kartotéky a stolu v enginu sešny A (cíl xlab_gen, level complex_7). Zásuvky jsou samostatné entity
// připojené ke korpusu (source.params.attach, Ondřej 24. 11. 2026: „otevírat i spodní šuplíky nezávisle“): spodní se
// otevře sama, hráč zamíří na kteroukoli a vytáhne ji skutečnou myší, ostatní zůstanou zavřené. Snímek pro Ondřeje
// test/out/b_zasuvky.png (kartotéka a stůl s otevřenými zásuvkami).

const { execFileSync } = require('node:child_process');
const { launch, open, ok, saveDataUrl, finish, ROOT } = require('./h.cjs');

const NOISE = /ERR_FAILED|may close only|GPU stall|Automatic fallback to software WebGL/i;
const LEVEL = 'complex_7';

(async () => {
  execFileSync(process.execPath, ['build.mjs', 'xlab_gen'], { cwd: ROOT, stdio: 'pipe' });
  const browser = await launch();
  let code = 1;
  try {
    const { page, errs } = await open(browser, { file: 'dist/xlab_gen.html', q: `?level=${LEVEL}&dev`, ready: 'window.__xe && window.__xe.ready === true', timeout: 120000 });
    const vp = page.viewportSize();
    const [cx, cy] = [vp.width / 2, vp.height / 2];
    // pomůcky v okně hry: korpus a jeho zásuvky z dat levelu (zásuvky stojí hned za korpusem), postavení před korpus
    await page.evaluate(`(() => {
      window.T = {};
      T.level = __PACK__.levels.find((l) => l.data.id === '${LEVEL}').data;
      T.ents = __xe.game.entities;
      T.withDrawers = (prefab, n) => {
        const all = T.level.entities;
        const i = all.findIndex((e) => e.prefab === prefab);
        return i < 0 ? null : { body: all[i], drawers: all.slice(i + 1, i + 1 + n) };
      };
      T.joints = (list) => list.map((e) => __xe.get('entity.' + e.id + '.joint'));
      T.front = (id, d) => {
        const em = T.ents.byId(id).em;
        const c = T.ents.center(id);
        __xe.tp(c[0] + em[8] * d, 0, c[2] + em[10] * d);
        return { em, c };
      };
      T.look = (P, Q) => {
        const d = Q.map((v, k) => v - P[k]);
        return __xe.shotAt(P[0], P[1], P[2], (Math.atan2(-d[0], -d[2]) * 180) / Math.PI, (Math.atan2(d[1], Math.hypot(d[0], d[2])) * 180) / Math.PI, 65).png;
      };
      __xe.start();
      __xe.sim(0.2);
    })()`);

    const found = await page.evaluate(() => {
      const f = T.withDrawers('cabinet_file_01', 4);
      const d = T.withDrawers('desk_office_01', 3);
      return { file: f && [f.body.id, ...f.drawers.map((e) => e.prefab)], desk: d && [d.body.id, ...d.drawers.map((e) => e.prefab)] };
    });
    ok(found.file && found.file.slice(1).every((p) => p === 'drawer_file_01') && found.desk && found.desk.slice(1).every((p) => p === 'drawer_desk_01'), `${LEVEL}: kartotéka má 4 zásuvky a stůl 3, každá jako vlastní entita`, JSON.stringify(found));

    // 1) spodní zásuvka se otevře sama (vstup open), ostatní stojí
    const bottom = await page.evaluate(() => {
      const { body, drawers } = T.withDrawers('cabinet_file_01', 4);
      T.front(body.id, 2.2); // hráč z dosahu zásuvek: pohon nikoho nedrtí (D-025), stál by v cestě
      __xe.sim(0.1);
      T.ents && __xe.game.behave.input(T.ents.byId(drawers[0].id), 'open');
      __xe.sim(1.5);
      return T.joints(drawers);
    });
    ok(bottom[0] > 0.44 && bottom.slice(1).every((j) => j === 0), 'spodní zásuvka kartotéky se otevře a ostatní tři zůstanou zavřené', `klouby zdola ${bottom.map((j) => j.toFixed(2)).join(', ')} m`);

    // 2) hráč zamíří na třetí zásuvku zdola a vytáhne ji skutečnou myší
    const aim = await page.evaluate(() => {
      const { body, drawers } = T.withDrawers('cabinet_file_01', 4);
      const { em } = T.front(body.id, 1.25);
      const de = T.ents.byId(drawers[2].id).em;
      __xe.aim(de[12] + em[8] * 0.01, de[13] + 0.15, de[14] + em[10] * 0.01);
      __xe.sim(0.1);
      return __xe.get('interact.target');
    });
    const third = await page.evaluate(() => T.withDrawers('cabinet_file_01', 4).drawers[2].id);
    ok(aim === third, 'zaměřená je právě třetí zásuvka zdola, ne korpus ani sousední zásuvka', `cíl ${aim}`);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.evaluate(() => __xe.sim(0.03));
    const grab = await page.evaluate(() => __xe.get('interact.manip'));
    let norm = 0;
    for (let i = 0; i < 60 && grab && norm < 0.6; i++) {
      const dir = (await page.evaluate(() => __xe.get('interact.manip'))).screenDir;
      await page.mouse.move(cx + dir[0] * 25, cy + dir[1] * 25);
      norm = await page.evaluate((id) => {
        __xe.sim(0.02);
        return T.ents.byId(id).joints[0].norm;
      }, third);
      await page.mouse.up();
      await page.evaluate(() => __xe.sim(0.02));
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.evaluate(() => __xe.sim(0.02));
    }
    await page.mouse.up();
    const pulled = await page.evaluate(() => {
      __xe.sim(0.3);
      return T.joints(T.withDrawers('cabinet_file_01', 4).drawers);
    });
    ok(grab && grab.id === third && pulled[2] > 0.2 && pulled[1] === 0 && pulled[3] === 0, 'myší vytažená třetí zásuvka jede sama; druhá a horní zůstanou zavřené', `úchop ${grab && grab.id}, klouby zdola ${pulled.map((j) => j.toFixed(2)).join(', ')} m`);

    // 3) stůl: prostřední zásuvka sama
    const desk = await page.evaluate(() => {
      const { body, drawers } = T.withDrawers('desk_office_01', 3);
      T.front(body.id, 2.2);
      __xe.sim(0.1);
      __xe.game.behave.input(T.ents.byId(drawers[1].id), 'open');
      __xe.sim(1.5);
      return T.joints(drawers);
    });
    ok(desk[1] > 0.32 && desk[0] === 0 && desk[2] === 0, 'prostřední zásuvka stolu se otevře sama', `klouby zdola ${desk.map((j) => j.toFixed(2)).join(', ')} m`);

    // 4) snímek pro Ondřeje: kartotéka (spodní a třetí otevřená) a stůl
    const png = await page.evaluate(async () => {
      const shot = (prefab, n, side) => {
        const { body } = T.withDrawers(prefab, n);
        const { em, c } = T.front(body.id, 2.4);
        __xe.sim(0.05);
        const Q = [c[0] + em[8] * 0.3, 0.55, c[2] + em[10] * 0.3];
        const P = [c[0] + em[8] * 1.5 + em[0] * side, 1.45, c[2] + em[10] * 1.5 + em[2] * side];
        return T.look(P, Q);
      };
      const shots = [shot('cabinet_file_01', 4, 0.9), shot('desk_office_01', 3, 1.1)];
      const imgs = await Promise.all(shots.map((u) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = u; })));
      const w = 760;
      const h = Math.round((imgs[0].height / imgs[0].width) * w);
      const cv = document.createElement('canvas');
      cv.width = w * 2 + 8;
      cv.height = h;
      const g = cv.getContext('2d');
      g.fillStyle = '#111';
      g.fillRect(0, 0, cv.width, cv.height);
      imgs.forEach((im, i) => g.drawImage(im, i * (w + 8), 0, w, h));
      return cv.toDataURL('image/png');
    });
    const file = saveDataUrl(png, 'b_zasuvky.png');
    ok(require('node:fs').statSync(file).size > 80000, 'snímek kartotéky a stolu s otevřenými zásuvkami uložen', require('node:path').relative(ROOT, file));

    const hard = errs.filter((e) => !NOISE.test(e));
    ok(hard.length === 0, 'žádná chyba ani varování v konzoli', hard.slice(0, 3).join(' | '));
    code = finish('B-T8 zásuvky v enginu');
  } finally {
    await browser.close();
  }
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
