// A1.5 v prohlížeči: použít a spojení v sestavené hře. Nápověda v HUD, vypínač a lampa v obraze, tlačítko a dveře,
// oznámení kontrolního bodu. Snímky jdou do jedné montáže test/out/a15_montaz.png.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');
const { imageStats } = require('./a_lib/image.cjs');

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { q: '?dev' });
    const r = await page.evaluate(() => {
      const face = (id, d) => {
        const ent = __xe.game.entities.byId(id);
        const c = __xe.game.entities.center(id);
        __xe.tp(c[0] + ent.em[8] * d, 0, c[2] + ent.em[10] * d);
        __xe.aim(id);
        __xe.sim(0.1);
        __xe.render();
      };
      const dom = () => {
        const p = document.querySelector('.hud-prompt');
        const n = document.querySelector('.hud-notice');
        return { prompt: p.hidden ? '' : p.textContent, notice: n.hidden ? '' : n.textContent, cross: !document.querySelector('.hud-cross').hidden };
      };
      const out = {};
      __xe.start();
      __xe.sim(0.2);

      // vypínač: nápověda v HUD, lampa v obraze
      face('e_switch_start', 1.2);
      out.hudSwitch = dom();
      const sp = __PACK__.levels[0].data.spawns.find((s) => s.kind === 'player');
      const view = () => __xe.shotAt(sp.pos[0], 1.6, sp.pos[2] + 1, 0, -4, 75).png;
      out.dark = view();
      __xe.key('KeyE', true); // klávesa, ne zkratka testu
      __xe.sim(0.05);
      __xe.key('KeyE', false);
      __xe.sim(0.4);
      out.lampOn = __xe.get('entity.e_lamp_start.light').on;
      out.lit = view();

      // dveře ze startu a tlačítko v chodbě
      face('e_door_start', 1.0);
      out.hudDoor = dom();
      __xe.use();
      __xe.sim(1.2);
      out.doorStart = __xe.get('entity.e_door_start.joint');
      face('e_btn_lab', 0.9);
      out.hudBtn = dom();
      __xe.use();
      __xe.sim(1.2);
      out.doorLab = __xe.get('entity.e_door_lab.joint');
      out.lampLab = __xe.get('entity.e_lamp_lab.light').on;

      // spouštěč v hale: oznámení
      const t = __PACK__.levels[0].data.triggers[0];
      __xe.tp((t.min[0] + t.max[0]) / 2, 0, (t.min[2] + t.max[2]) / 2, 0);
      __xe.sim(0.1);
      __xe.render();
      out.hudHall = dom();
      out.stats = __xe.stats();

      // čtyři pohledy do montáže
      out.shots = [
        __xe.shotAt(sp.pos[0], 1.6, sp.pos[2] + 1, 0, -4, 75).png,
        __xe.shotAt(3, 1.6, -1.2, -38, -6, 75).png,
        __xe.shotAt(5.2, 1.6, -3.2, -120, -12, 75).png,
        __xe.shotAt(3, 1.6, -9.6, 10, -4, 75).png,
      ];
      return out;
    });
    ok(r.hudSwitch.prompt === '[E] Přepnout' && r.hudSwitch.cross, 'HUD ukazuje nápověďu akce z dat prefabu a zaměřovač', `„${r.hudSwitch.prompt}“`);
    const a = await imageStats(page, r.dark);
    const b = await imageStats(page, r.lit);
    ok(r.lampOn && b.luma > a.luma * 1.15, 'vypínač rozsvítí lampu i v obraze', `jas ${a.luma.toFixed(1)} → ${b.luma.toFixed(1)}`);
    ok(r.hudDoor.prompt === '[E] Otevřít' && r.doorStart > 100, 'dveře jdou otevřít klávesou „použít“', `kloub ${r.doorStart}°`);
    ok(r.hudBtn.prompt === '[E] Stisknout' && r.doorLab > 0.97 && r.lampLab, 'tlačítko otevře dveře laboratoře a lampa se rozsvítí', `dveře ${r.doorLab} m, lampa ${r.lampLab}`);
    ok(r.hudHall.notice === 'Kontrolní bod', 'spouštěč v hale ohlásí kontrolní bod', `„${r.hudHall.notice}“`);
    ok(r.stats.calls <= 150, 'volání kreslení ≤ 150 na pohled', `${r.stats.calls} volání, ${r.stats.tris} △, světel ve fondu ${r.stats.activeLights} z ${r.stats.lights}`);
    const names = ['start', 'chodba', 'laborator', 'hala'];
    for (let i = 0; i < r.shots.length; i++) {
      const s = await imageStats(page, r.shots[i]);
      saveDataUrl(r.shots[i], `a15_${names[i]}.png`);
      ok(s.dark < 0.35 && s.shades > 12, `pohled „${names[i]}“ není černý ani prázdný`, `jas ${s.luma.toFixed(1)}, černých bodů ${(s.dark * 100).toFixed(1)} %`);
    }
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.5 použít a spojení (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
