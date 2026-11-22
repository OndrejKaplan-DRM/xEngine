// A1.8 v prohlížeči: obraz. Světlo se počítá po vrcholech (D-022): ve scéně není při žádném pohledu světlo three.js,
// lampy přesto obraz zesvětlí; snímky ze čtyř míst bez černých ploch; expozice z dat levelu; vnitřní rozlišení; přehled F3.

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
      const sceneLights = () => {
        let n = 0;
        g.render.scene.traverse((o) => (n += o.isLight ? 1 : 0));
        return n;
      };
      __xe.start();
      __xe.sim(0.2);
      for (const id of ['e_door_start', 'e_door_lab']) g.behave.input(g.entities.byId(id), 'open');
      __xe.sim(1.5);
      const off = __xe.shotAt(3, 1.6, 5.2, 0, -4, 75).png;
      for (const e of g.entities.list) if (e.comp.light) g.behave.input(e, 'turnOn');
      __xe.sim(0.1);
      out.lamp = [off, __xe.shotAt(3, 1.6, 5.2, 0, -4, 75).png];
      out.light = __xe.get('light.stat');
      out.on = __xe.get('light.lights').filter((l) => l.on && l.level > 0).length;
      out.exposure = [g.render.renderer.toneMappingExposure, g.session.level.env.exposure];
      // ---- celá trasa: světlo three.js nesmí být ve scéně nikdy
      out.sceneLights = 0;
      for (const p of route) {
        __xe.shotAt(p[0], p[1], p[2], p[3], -5, 75);
        out.sceneLights = Math.max(out.sceneLights, sceneLights());
      }
      // ---- vnitřní rozlišení
      const h0 = g.render.size[1];
      __xe.shell.settings.set('rows', 576);
      const h1 = g.render.size[1];
      __xe.shell.settings.set('rows', 768);
      out.rows = [h0, h1, g.render.size[1]];
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
    const lampOff = await imageStats(page, r.lamp[0]);
    const lampOn = await imageStats(page, r.lamp[1]);
    ok(r.sceneLights === 0 && r.on === r.light.lights && r.on > 0, 've scéně není při žádném pohledu světlo three.js; všechna světla levelu svítí po vrcholech', `${r.on} světel, ${r.light.samples} vzorků, ${r.light.entries} záznamů ve vrstvách, výpočet ${r.light.buildMs.toFixed(1)} ms (sandbox, orientačně); ${ROUTE.length} pohledů`);
    ok(lampOn.luma > lampOff.luma + 5, 'rozsvícená lampa obraz zesvětlí (jen změnou barev vrcholů)', `jas startu ${lampOff.luma.toFixed(1)} → ${lampOn.luma.toFixed(1)} z 255`);
    ok(r.exposure[0] === r.exposure[1], 'expozice je z dat levelu (env.exposure)', `${r.exposure[0]}`);
    ok(r.rows[0] === 768 && r.rows[1] === 576 && r.rows[2] === 768, 'vnitřní rozlišení jde přepnout a vrátit', `řádků ${r.rows.join(' → ')}`);
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
    const need = ['snímků/s', 'krok', 'obraz 1366 × 768', 'volání', '△', 'vzorky světla', 'buňka c_hall', 'rychlost', 'krok po systémech'];
    const speed = Number((text.match(/rychlost ([\d.]+) m\/s/) || [])[1]);
    ok(need.every((k) => text.includes(k)) && speed > 5, 'F3 ukáže přehled: snímky, čas kroku po systémech, velikost obrazu, volání, trojúhelníky, vzorky světla, buňku a rychlost', text.replace(/\n/g, ' ¦ '));
    ok(!shown.hidden && shown.text.includes('volání') && /player [\d.]+/.test(shown.text), 'přehled je vidět na obrazovce a měří krok po systémech', shown.text.split('\n').at(-1));
    await page.keyboard.press('F3');
    const hidden = await page.evaluate(() => document.querySelector('.hud-dev').hidden && !__xe.game.E.profile);
    ok(hidden, 'druhé F3 přehled schová a vypne měření');
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.8 obraz (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
