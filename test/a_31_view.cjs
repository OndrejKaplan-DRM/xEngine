// A3.1 v prohlížeči: zbraň v ruce ve druhém průchodu po vymazání hloubky (nikdy neprojde zdí), záblesk ústí jako
// jediné efektové světlo (proměnná shaderu po vrcholech, žádné světlo three.js), střely jednou instancovanou sítí.
// Srovnává se dolní pravá čtvrtina obrazu se zbraní a bez ní: u zdi musí být zbraň vidět stejně celá jako volně.
// Snímek: test/out/a31_zbran.png (volně, u zdi, záblesk).

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');

/** Kolik bodů dolní pravé čtvrtiny se liší o víc než 24 (součet RGB) mezi dvěma snímky; a průměrný jas obrazu. */
const DIFF = `async ([a, b]) => {
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
  const h = A.height;
  let diff = 0;
  let n = 0;
  let la = 0;
  let lb = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const sa = A.data[i] + A.data[i + 1] + A.data[i + 2];
      const sb = B.data[i] + B.data[i + 1] + B.data[i + 2];
      la += sa;
      lb += sb;
      if (x >= w / 2 && y >= h / 2) {
        n++;
        if (Math.abs(sa - sb) > 24) diff++;
      }
    }
  }
  return { share: diff / n, lumA: la / (w * h * 3), lumB: lb / (w * h * 3) };
}`;
const MONTAGE = `async (srcs) => {
  const imgs = [];
  for (const s of srcs) {
    const img = new Image();
    img.src = s;
    await img.decode();
    imgs.push(img);
  }
  const k = 0.5;
  const w = Math.round(imgs[0].width * k);
  const h = Math.round(imgs[0].height * k);
  const c = document.createElement('canvas');
  c.width = w * imgs.length;
  c.height = h;
  const g = c.getContext('2d');
  imgs.forEach((img, i) => g.drawImage(img, i * w, 0, w, h));
  return c.toDataURL('image/png');
}`;

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser);
    const r = await page.evaluate(() => {
      const g = __xe.game;
      __xe.start();
      __xe.sim(0.2);
      g.weapons.give('plasma_rifle_01', 40);
      __xe.sim(0.05);
      const shotOf = (gun) => {
        g.weapons.hidden = !gun;
        __xe.render();
        const png = g.render.shot();
        g.weapons.hidden = false;
        return png;
      };
      const pose = (x, z) => {
        __xe.tp(x, 0, z, 0, 0);
        __xe.sim(0.1);
      };
      pose(3, 4); // volně: uprostřed startu, pohled k dveřím
      const freeGun = shotOf(true);
      const freeNo = shotOf(false);
      pose(1, 0.3); // 0,3 m od stěny startu (z = 0) mimo dveře: ústí 0,86 m před okem leží za zdí
      const wallGun = shotOf(true);
      const wallNo = shotOf(false);
      pose(1, 1.6); // výstřel 1,5 m od zdi
      const dark = shotOf(true);
      __xe.sim(1 / 120, { hold: ['grab'] }); // jeden krok: střela je ještě v letu
      __xe.render();
      const flashOn = g.render.materials.flashOn;
      const flashCount = g.render.counts.flash;
      const shots = g.render.counts.shots;
      const flashPng = g.render.shot();
      let lights = 0;
      g.render.scene.traverse((o) => {
        if (o.isLight) lights++;
      });
      return { freeGun, freeNo, wallGun, wallNo, dark, flashPng, flashOn, shots, lights, flashCount, last: g.get('weapons.last'), calls: g.render.counts.calls };
    });
    const diff = (a, b) => page.evaluate(`(${DIFF})(${JSON.stringify([a, b])})`);
    const free = await diff(r.freeGun, r.freeNo);
    const wall = await diff(r.wallGun, r.wallNo);
    const flash = await diff(r.flashPng, r.dark);
    ok(free.share > 0.02, 'zbraň v ruce je vidět (dolní pravá čtvrtina se se zbraní liší)', `${(free.share * 100).toFixed(1)} % bodů čtvrtiny`);
    ok(wall.share > free.share * 0.85, 'u zdi je zbraň vidět stejně celá (druhý průchod po vymazání hloubky: zdí neprojde)', `volně ${(free.share * 100).toFixed(1)} %, u zdi ${(wall.share * 100).toFixed(1)} %`);
    ok(r.last.fromEye === false, 'výstřel 1,5 m od zdi vychází z ústí', JSON.stringify(r.last.origin.map((v) => +v.toFixed(2))));
    ok(r.flashOn && r.flashCount === 1 && r.lights === 0, 'záblesk ústí je jediné efektové světlo a ve scéně není žádné světlo three.js', `záblesk ${r.flashOn}, světel three.js ${r.lights}`);
    ok(flash.lumA > flash.lumB + 0.5, 'záblesk rozsvítí zeď před hráčem (průměrný jas obrazu)', `bez ${flash.lumB.toFixed(1)}, se zábleskem ${flash.lumA.toFixed(1)}`);
    ok(r.shots >= 1, 'střely se kreslí (instancovaná síť)', `${r.shots} střel, ${r.calls} volání`);
    const m = await page.evaluate(`(${MONTAGE})(${JSON.stringify([r.freeGun, r.wallGun, r.flashPng])})`);
    saveDataUrl(m, 'a31_zbran.png');
    ok(clean(errs).length === 0, 'bez chyby v konzoli', clean(errs).slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }
  process.exit(finish('A3.1 zbraň v ruce a záblesk (prohlížeč)'));
})();
