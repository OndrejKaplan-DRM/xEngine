// A1.3 v prohlížeči: hráč v sestavené hře. Chůze přes __xe.sim (bez čekání na skutečný čas), kamera sleduje
// hráče, profil se přepíná nastavením. Čas kroku se vypisuje jen orientačně: sandbox není T460.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');
const { compare, imageStats } = require('./a_lib/image.cjs');

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { q: '?dev' });
    const r = await page.evaluate(() => {
      __xe.start();
      const hall = __PACK__.levels[0].data.cells.find((c) => c.id === 'c_hall').bounds;
      __xe.tp((hall.min[0] + hall.max[0]) / 2 + 4.1, 0, hall.max[2] - 1.2, 0); // volný pruh haly, čelem do −Z
      __xe.sim(0.3);
      const p0 = __xe.get('player.pos');
      const shot0 = __xe.shot();
      const n = __xe.sim(1, { hold: ['fwd'] });
      const p1 = __xe.get('player.pos');
      const shot1 = __xe.shot();
      const c = __xe.game.render.camera.position;
      const cam = [c.x, c.y, c.z]; // hned zkopírovat: objekt kamery žije dál
      const eye = __xe.game.player.eyeHeight;
      // klávesnice vede stejnou cestou jako robot
      __xe.key('ArrowDown', true);
      __xe.sim(0.5);
      __xe.key('ArrowDown', false);
      const p2 = __xe.get('player.pos');
      // profil z nastavení
      const before = __xe.get('player.profile');
      __xe.shell.settings.set('profile', 'arena');
      __xe.sim(0.1);
      const arena = __xe.get('player.profile');
      __xe.shell.settings.set('profile', 'level');
      __xe.sim(0.1);
      const back = __xe.get('player.profile');
      // orientační čas kroku
      __xe.profile(true);
      __xe.sim(3, { hold: ['fwd', 'left'], yawRate: 40 });
      const st = __xe.stats();
      __xe.profile(false);
      return { n, p0, p1, p2, shot0, shot1, cam, eye, before, arena, back, stepMs: st.stepMs, sys: st.sys, calls: st.calls };
    });
    ok(r.n === 120 && r.p1[2] < r.p0[2] - 2 && Math.abs(r.p1[0] - r.p0[0]) < 0.01, 'vpřed při yaw 0 vede do −Z', `z ${r.p0[2].toFixed(2)} → ${r.p1[2].toFixed(2)} za 1 s`);
    ok(Math.abs(r.cam[1] - (r.p1[1] + r.eye)) < 0.05 && Math.abs(r.cam[2] - r.p1[2]) < 0.1, 'kamera sedí v očích hráče', `kamera y = ${r.cam[1].toFixed(2)}, oči ${r.eye} m nad nohama`);
    ok(r.p2[2] > r.p1[2] + 0.5, 'šipka dolů couvá (klávesy jdou přes stejné akce)', `z ${r.p1[2].toFixed(2)} → ${r.p2[2].toFixed(2)}`);
    ok(r.before !== 'arena' && r.arena === 'arena' && r.back === r.before, 'profil pohybu jde přepnout nastavením za běhu', `${r.before} → ${r.arena} → ${r.back}`);
    const moved = await compare(page, r.shot0, r.shot1);
    const img = await imageStats(page, r.shot1);
    ok(moved.mean > 1 && img.shades > 12, 'obraz se s pohybem mění a není prázdný', `rozdíl snímků ${moved.mean.toFixed(1)}, ${img.shades} odstínů`);
    saveDataUrl(r.shot1, 'a13_walk.png');
    console.log(`       orientačně (sandbox, softwarové vykreslení): krok ${r.stepMs.toFixed(3)} ms; ${Object.entries(r.sys).map(([k, v]) => `${k} ${v.toFixed(3)}`).join(', ')}`);
    ok(r.stepMs < 2, 'krok simulace ≤ 2 ms (orientačně, sandbox)', `${r.stepMs.toFixed(3)} ms`);
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.3 hráč (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
