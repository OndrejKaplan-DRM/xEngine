// A1.1 v prohlížeči: start do menu bez chyby v konzoli, pauza zastaví čítač kroků, každé nastavení projde
// apply/probe, obrazovky Shellu se vykreslí z deklarací. Hra se spouští přes __xe.start() (bez zámku kurzoru):
// kliknutí na „Hrát“ by v headless prohlížeči zamklo kurzor a renderer by tekl paměť.

const { launch, openGame, ok, finish, clean, click: clickOn } = require('./a_lib/browser.cjs');

const wait = (page, ms) => page.waitForTimeout(ms);

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { q: '?dev' });
    const click = (sel) => clickOn(page, sel);

    const boot = await page.evaluate(() => ({ mode: __xe.get('kernel.mode'), screen: __xe.shell.screen(), title: document.querySelector('.sh-title')?.textContent, version: __xe.version, order: __xe.get('kernel.order') }));
    ok(boot.mode === 'menu' && boot.screen === 'menu', 'start do menu', `${boot.title} · ${boot.version}`);
    ok(await page.evaluate(() => !!document.querySelector('#shell [data-id="play"]') && !!document.querySelector('#shell [data-id="settings"]')), 'menu nabízí Hrát a Nastavení');

    // ---- pauza zastaví čítač kroků (skutečná smyčka přes requestAnimationFrame)
    await page.evaluate(() => __xe.start());
    await page.waitForFunction(() => __xe.get('kernel.steps') > 8, null, { timeout: 30000 });
    const paused = await page.evaluate(() => {
      __xe.pause();
      return { mode: __xe.get('kernel.mode'), steps: __xe.get('kernel.steps'), screen: __xe.shell.screen() };
    });
    await wait(page, 1200);
    const later = await page.evaluate(() => __xe.get('kernel.steps'));
    ok(paused.mode === 'paused' && paused.screen === 'paused' && later === paused.steps, 'pauza zastaví čítač kroků', `${paused.steps} → ${later} po 1,2 s`);
    await page.evaluate(() => __xe.resume());
    await page.waitForFunction((s) => __xe.get('kernel.steps') > s, paused.steps, { timeout: 30000 });
    ok(await page.evaluate(() => __xe.get('kernel.mode') === 'playing'), 'pokračování vrátí hru do běhu');

    // ---- každé nastavení: jiná než výchozí hodnota → probe vrací totéž → výchozí zpět
    const probe = await page.evaluate(() => {
      const s = __xe.shell.settings;
      const out = [];
      for (const d of s.defs) {
        if (d.type === 'action') continue;
        const other = d.type === 'range' ? (d.def === d.max ? d.min : d.max) : d.type === 'toggle' ? !d.def : d.options.find((o) => o.value !== d.def).value;
        s.set(d.id, other);
        const p = s.probeAll().find((x) => x.id === d.id);
        out.push({ id: d.id, set: other, probe: p.probe, ok: p.ok && s.get(d.id) === other });
      }
      const canvas = document.getElementById('c');
      const scaled = { w: canvas.width, client: canvas.clientWidth };
      s.reset();
      const back = s.probeAll().every((x) => x.ok) && s.defs.every((d) => d.type === 'action' || s.get(d.id) === d.def);
      return { out, back, scaled, after: { w: canvas.width }, persistent: s.persistent };
    });
    for (const p of probe.out) ok(p.ok, `nastavení „${p.id}“ projde apply/probe`, `${p.set} → ${p.probe}`);
    ok(probe.back, 'Obnovit výchozí vrátí všechny hodnoty');
    ok(probe.scaled.w > probe.after.w, 'měřítko vykreslení skutečně mění rozlišení plátna', `${probe.scaled.w} px při 150 % → ${probe.after.w} px při 100 % (okno ${probe.scaled.client} px)`);

    // ---- obrazovka nastavení z deklarací, Esc o úroveň zpět
    await page.evaluate(() => __xe.pause());
    ok((await click('.sh-paused [data-id="settings"]')) === 'ok', 'tlačítko Nastavení v pauze jde trefit myší');
    const view = await page.evaluate(() => ({
      screen: __xe.shell.screen(),
      tabs: [...document.querySelectorAll('.sh-settings .sh-tab')].filter((t) => !t.hidden).map((t) => t.textContent),
      rows: [...document.querySelectorAll('.sh-settings .sh-row')].map((r) => r.dataset.setting),
    }));
    ok(view.screen === 'settings' && view.rows.length > 0, 'obrazovka nastavení se vykreslí z deklarací', `stránky: ${view.tabs.join(', ')}; první stránka: ${view.rows.join(', ')}`);
    ok(view.tabs.includes('Hra'), 'profil pohybu se nabízí ve vývojářském režimu (?dev)');
    await page.keyboard.press('Escape');
    ok((await page.evaluate(() => __xe.shell.screen())) === 'paused', 'Esc v nastavení vrací o úroveň zpět, ne do hry');
    await page.evaluate(() => __xe.quit());
    ok((await page.evaluate(() => __xe.get('kernel.mode'))) === 'menu', 'Hlavní menu z pauzy');

    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();

    // ---- bez ?dev se vývojářská volba nenabízí
    const plain = await openGame(browser);
    const pages = await plain.page.evaluate(() => __xe.shell.settings.pages);
    ok(!pages.includes('hra'), 'bez ?dev se profil pohybu nenabízí', pages.join(', '));
    ok(clean(plain.errs).length === 0, 'žádná chyba v konzoli ani bez ?dev', clean(plain.errs).slice(0, 3).join(' | '));
    await plain.page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.1 kostra aplikace (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
