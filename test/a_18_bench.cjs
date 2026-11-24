// A1.8 v prohlížeči: měření skutečné hry (adresa ?bench). Ověřuje se, že měření doběhne, projde trasu z dat
// a vydá JSON ke zkopírování. Časy jsou ze softwarového vykreslení v sandboxu a o T460 neříkají nic: test hlídá
// jen tvar výsledku a počty (volání, trojúhelníky, velikost obrazu).

const { launch, openGame, ok, finish, clean } = require('./a_lib/browser.cjs');

(async () => {
  const browser = await launch();
  try {
    // ---- spuštění adresou: krátká trasa, 576 řádků
    const { page, errs } = await openGame(browser, { q: '?bench&quick&rows=576' });
    await page.waitForFunction(() => !!document.querySelector('textarea[aria-label^="Výsledek měření"]'), null, { timeout: 120000 });
    const auto = await page.evaluate(() => {
      const area = document.querySelector('textarea[aria-label^="Výsledek měření"]');
      const r = JSON.parse(area.value);
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Zkopírovat'));
      const box = btn.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { r, mode: __xe.get('kernel.mode'), hit: top === btn, level: __PACK__.levels[0].data.cells.length };
    });
    const r = auto.r;
    ok(r.env.image[1] === 576 && !r.env.antialias && /xLab \?bench/.test(r.env.tool) && typeof r.env.gpu === 'string' && r.env.gpu.length > 3, 'adresa ?bench&rows=576 spustí měření sama a zapíše stroj a velikost obrazu', `${r.env.image.join(' × ')}, ${r.env.gpu.slice(0, 60)}`);
    ok(r.run.frames > 10 && r.frame.workMs.median > 0 && r.frame.workMs.p95 >= r.frame.workMs.median && r.frame.intervalMs.median > 0 && r.step.ms.median > 0, 'výsledek má medián a 95. percentil snímku, rozestup snímků a čas kroku', `${r.run.frames} snímků za ${r.run.seconds} s; snímek ${r.frame.workMs.median} / ${r.frame.workMs.p95} ms, krok ${r.step.ms.median} ms (sandbox, softwarové vykreslení: ne výkon T460)`);
    ok(r.draw.calls.max > 0 && r.draw.calls.max <= 150 && r.draw.tris.max > 1000 && r.level.lightSamples > 1000, 'výsledek nese volání, trojúhelníky a vzorky světla', `volání nejvýš ${r.draw.calls.max}, △ nejvýš ${r.draw.tris.max}, vzorků světla ${r.level.lightSamples}`);
    ok(auto.mode === 'paused' && auto.hit && typeof r.verdict === 'string' && r.verdict.includes('medián'), 'po doběhnutí hra stojí a tlačítko Zkopírovat výsledek jde trefit myší', r.verdict);
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();

    // ---- celá trasa přes __xe: všechny buňky levelu, robot dojde bez přenášení
    const full = await openGame(browser);
    const f = await full.page.evaluate(() => __xe.bench());
    const visited = f.cells.filter((c) => c.frames > 0).length;
    ok(visited === f.level.cells && f.run.waypoints >= f.level.cells, 'celá trasa projde všechny buňky levelu', `${visited} z ${f.level.cells} buněk, ${f.run.waypoints} bodů trasy, ${f.run.seconds} s, ${f.run.frames} snímků`);
    ok(f.run.teleports === 0, 'robot dojde celou trasu po svých (dveře otevřené, nikde neuvízne)', `přenesení ${f.run.teleports}`);
    ok(f.env.image[1] === 768 && f.draw.calls.max <= 150, 'výchozí měření běží v 768 řádcích a volání jsou v rozpočtu vlny', `obraz ${f.env.image.join(' × ')}, volání nejvýš ${f.draw.calls.max}`);
    ok(clean(full.errs).length === 0, 'žádná chyba v konzoli ani při celé trase', clean(full.errs).slice(0, 3).join(' | '));
    await full.page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.8 měření ?bench (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
