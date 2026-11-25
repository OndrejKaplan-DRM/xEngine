// N-013 v prohlížeči: sklo s okrajem podle úhlu pohledu a odleskem (shader průhledného osvětleného materiálu).
// Zkušební data: skleněný válec (opacity 0,3) uprostřed startu xLabu. Maska válce = rozdíl snímku s válcem a bez
// něj; v každém řádku masky se porovná okraj (krajní body) se středem. S N-013 je okraj výrazně světlejší než
// střed; bez něj (materials.glassFx = false) ne. Snímek: test/out/a32_sklo.png (bez N-013, s N-013).

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');

const VESSEL = `
  p.materials.materials.glass_test = { model: 'lit', color: [0.7, 0.85, 0.9], opacity: 0.3, rough: 0.05, surface: 'glass' };
  const crate = p.prefabs.find((x) => x.data.id === 'crate_wood_01').data;
  const v = JSON.parse(JSON.stringify(crate));
  v.id = 'glass_vessel_09';
  v.title = 'Skleněný válec (zkouška N-013)';
  v.bounds = { min: [-0.35, 0, -0.35], max: [0.35, 0.9, 0.35] };
  v.parts = [{ node: v.rig.nodes[0].id, shape: 'cyl', center: [0, 0.45, 0], radius: 0.35, height: 0.9, axis: 'y', mat: 'glass_test' }];
  v.colliders = [{ node: v.rig.nodes[0].id, shape: 'cyl', center: [0, 0.45, 0], radius: 0.35, height: 0.9, axis: 'y' }];
  delete v.components.health;
  p.prefabs.push({ file: 'prefabs/glass_vessel_09.json', data: v });
  p.levels[0].data.entities.push({ id: 'e_vessel', prefab: 'glass_vessel_09', cell: 'c_start', pos: [3, 0, 2.6], rot: [0, 0, 0] });
`;

/** Okraj a střed válce: v řádcích masky (|rozdíl| > 6) průměrný jas 3 krajních bodů z každé strany a 5 prostředních. */
const RIM = `async ([a, b]) => {
  const load = async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return g.getImageData(0, 0, img.width, img.height);
  };
  const A = await load(a);
  const B = await load(b);
  const w = A.width;
  const lum = (d, i) => (d[i] + d[i + 1] + d[i + 2]) / 3;
  let rim = 0;
  let mid = 0;
  let nr = 0;
  let nm = 0;
  let rows = 0;
  for (let y = 0; y < A.height; y++) {
    let x0 = -1;
    let x1 = -1;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.abs(lum(A.data, i) - lum(B.data, i)) > 6) {
        if (x0 < 0) x0 = x;
        x1 = x;
      }
    }
    if (x0 < 0 || x1 - x0 < 30) continue;
    rows++;
    for (let k = 0; k < 3; k++) {
      rim += lum(A.data, (y * w + x0 + k) * 4) + lum(A.data, (y * w + x1 - k) * 4);
      nr += 2;
    }
    const c = (x0 + x1) >> 1;
    for (let k = -2; k <= 2; k++) {
      mid += lum(A.data, (y * w + c + k) * 4);
      nm++;
    }
  }
  return { rim: rim / Math.max(1, nr), mid: mid / Math.max(1, nm), rows };
}`;

const shoot = (page, fx) =>
  page.evaluate((fx) => {
    const g = __xe.game;
    g.render.materials.glassFx = fx;
    g.loadLevel(g.session.levelId); // materiály vzniknou znovu s volbou glassFx
    __xe.start();
    __xe.sim(0.3);
    const pose = [3, 1.1, 4.4, 0, -12];
    const ent = g.entities.byId('e_vessel');
    const a = __xe.shotAt(...pose, 50).png;
    g.entities.setEnabled(ent, false);
    const b = __xe.shotAt(...pose, 50).png;
    g.entities.setEnabled(ent, true);
    return { a, b };
  }, fx);

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { mutate: VESSEL });
    const off = await shoot(page, false);
    const on = await shoot(page, true);
    const rim = (s) => page.evaluate(`(${RIM})(${JSON.stringify([s.a, s.b])})`);
    const r0 = await rim(off);
    const r1 = await rim(on);
    const f = (r) => `okraj ${r.rim.toFixed(1)}, střed ${r.mid.toFixed(1)} (${r.rows} řádků)`;
    ok(r0.rows > 40 && r1.rows > 40, 'válec je na snímku (maska z rozdílu s válcem a bez něj)', `bez N-013 ${r0.rows} řádků, s N-013 ${r1.rows}`);
    ok(r1.rim > r1.mid * 1.15 && r1.rim - r1.mid > (r0.rim - r0.mid) + 8, 'N-013: obrys skla je světlejší než střed (okraj podle úhlu pohledu)', `bez: ${f(r0)}; s: ${f(r1)}`);
    ok(r1.mid >= r0.mid - 2, 'střed skla (pohled kolmo) zůstává průhledný jako dřív', `střed ${r0.mid.toFixed(1)} → ${r1.mid.toFixed(1)}`);
    const m = await page.evaluate(
      async (srcs) => {
        const imgs = await Promise.all(
          srcs.map(async (s) => {
            const i = new Image();
            i.src = s;
            await i.decode();
            return i;
          }),
        );
        const c = document.createElement('canvas');
        const w = imgs[0].width / 2;
        const h = imgs[0].height / 2;
        c.width = w * 2;
        c.height = h;
        imgs.forEach((im, k) => c.getContext('2d').drawImage(im, k * w, 0, w, h));
        return c.toDataURL('image/png');
      },
      [off.a, on.a],
    );
    saveDataUrl(m, 'a32_sklo.png');
    ok(clean(errs).length === 0, 'bez chyby v konzoli (shader skla se přeložil)', clean(errs).slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }
  process.exit(finish('N-013 sklo: okraj a odlesk (prohlížeč)'));
})();
