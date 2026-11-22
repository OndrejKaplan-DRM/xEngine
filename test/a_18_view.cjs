// A1.8 v prohlížeči: světla za běhu a obraz. Kritéria ze zadání: počet aktivních světel nikdy nepřekročí nastavení;
// snímky ze čtyř míst bez černých ploch. K tomu expozice z dat levelu, měřítko vykreslení a přehled F3.
// Světla se počítají přímo ve scéně three.js (bodová světla s nenulovou svítivostí), ne z počítadla enginu.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');
const { imageStats } = require('./a_lib/image.cjs');

const ROUTE = [
  [3, 1.6, 4.5, 0], [3, 1.6, 4.5, 180], [3, 1.6, 1, 0], [3, 1.6, -3, 0], [3, 1.6, -5.5, -90], [8, 1.6, -5.2, 90],
  [8, 1.6, -5.2, -90], [3, 1.6, -7.5, 0], [3, 1.6, -15, 0], [3, 1.6, -15, 180], [-3, 1.6, -22, -90], [9, 1.6, -26, 45],
];

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { q: '?dev' });
    const r = await page.evaluate((route) => {
      const out = {};
      const g = __xe.game;
      const lit = () => g.render.scene.children.filter((o) => o.isPointLight && o.intensity > 0).length;
      __xe.start();
      __xe.sim(0.2);
      for (const id of ['e_door_start', 'e_door_lab']) g.behave.input(g.entities.byId(id), 'open');
      for (const e of g.entities.list) if (e.comp.light) g.behave.input(e, 'turnOn');
      __xe.sim(1.5);
      out.on = g.render.lights.filter((l) => l.on && l.level > 0).length;
      out.exposure = [g.render.renderer.toneMappingExposure, g.session.level.env.exposure];
      // ---- rozpočet světel: každá hodnota z nastavení, celá trasa
      const def = __xe.shell.settings.defs.find((d) => d.id === 'lights');
      out.budgets = def.options.map((o) => o.value);
      out.max = {};
      out.counter = true;
      for (const n of out.budgets) {
        __xe.shell.settings.set('lights', n);
        let max = 0;
        for (const p of route) {
          __xe.shotAt(p[0], p[1], p[2], p[3], -5, 75);
          const k = lit();
          max = Math.max(max, k);
          if (k !== g.render.counts.activeLights) out.counter = false;
        }
        out.max[n] = max;
      }
      __xe.shell.settings.set('lights', def.def);
      // ---- měřítko vykreslení
      const cv = g.render.renderer.domElement;
      const w0 = cv.width;
      __xe.shell.settings.set('scale', 50);
      const w1 = cv.width;
      __xe.shell.settings.set('scale', 100);
      out.scale = [w0, w1, cv.width];
      // ---- čtyři místa
      out.shots = {
        start: __xe.shotAt(3, 1.6, 5.2, 0, -4, 75),
        chodba: __xe.shotAt(3, 1.6, -1.2, 0, -4, 75),
        laborator: __xe.shotAt(5.0, 1.6, -3.0, -115, -10, 75),
        hala: __xe.shotAt(3, 1.6, -9.6, 10, -4, 75),
      };
      for (const s of Object.values(out.shots)) s.cells = undefined;
      return out;
    }, ROUTE);
    const over = r.budgets.filter((n) => r.max[n] > n);
    ok(over.length === 0 && r.on > Math.max(...r.budgets) && r.counter, 'počet aktivních světel nikdy nepřekročí nastavení', `svítí ${r.on} světel; nejvíc bodových světel ve scéně při rozpočtu ${r.budgets.map((n) => `${n}: ${r.max[n]}`).join(', ')} (${ROUTE.length} pohledů na každý)`);
    ok(r.budgets.some((n) => r.max[n] === n), 'rozpočet se opravdu využívá (level má víc světel, než smí svítit)');
    ok(r.exposure[0] === r.exposure[1], 'expozice je z dat levelu (env.exposure)', `${r.exposure[0]}`);
    ok(r.scale[1] === Math.round(r.scale[0] / 2) && r.scale[2] === r.scale[0], 'měřítko vykreslení 50 % zmenší plátno na polovinu a jde vrátit', `šířka plátna ${r.scale.join(' → ')} bodů`);
    for (const [name, s] of Object.entries(r.shots)) {
      const st = await imageStats(page, s.png);
      saveDataUrl(s.png, `a18_${name}.png`);
      ok(st.dark < 0.01 && st.shades > 12 && s.calls <= 150, `pohled „${name}“ bez černých ploch`, `černých bodů ${(st.dark * 100).toFixed(2)} %, jas ${st.luma.toFixed(0)}, ${s.calls} volání, ${s.tris} △`);
    }

    // ---- přehled F3 skutečnou klávesou
    await page.keyboard.press('F3');
    const text = await page.evaluate(() => {
      __xe.tp(3, 0, -12, 0);
      __xe.sim(1.0, { hold: ['fwd'] });
      __xe.render();
      return __xe.dev().text;
    });
    const shown = await page.evaluate(async () => {
      await new Promise((res) => setTimeout(res, 1500)); // přehled se obnovuje jednou za čtvrt sekundy skutečného času
      const el = document.querySelector('.hud-dev');
      return { hidden: el.hidden, text: el.textContent };
    });
    const need = ['snímků/s', 'krok', 'volání', '△', 'buňka c_hall', 'rychlost', 'krok po systémech'];
    const speed = Number((text.match(/rychlost ([\d.]+) m\/s/) || [])[1]);
    ok(need.every((k) => text.includes(k)) && speed > 5, 'F3 ukáže přehled: snímky, čas kroku po systémech, volání, trojúhelníky, buňku a rychlost', text.replace(/\n/g, ' ¦ '));
    ok(!shown.hidden && shown.text.includes('volání') && /player [\d.]+/.test(shown.text), 'přehled je vidět na obrazovce a měří krok po systémech', shown.text.split('\n').at(-1));
    await page.keyboard.press('F3');
    const hidden = await page.evaluate(() => document.querySelector('.hud-dev').hidden && !__xe.game.E.profile);
    ok(hidden, 'druhé F3 přehled schová a vypne měření');
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.8 světla za běhu a obraz (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
