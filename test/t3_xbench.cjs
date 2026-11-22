// T3: měřicí stránka v rychlém režimu. Neměří výkon (softwarové vykreslování o něm nic neříká),
// ověřuje jen, že stránka doběhne, vyplní tabulku a vydá platný výsledek.

const { launch, open, ok, finish } = require('./h.cjs');

(async () => {
  const browser = await launch();
  let code = 1;
  try {
    const { page, errs } = await open(browser, { file: 'dist/xbench.html', ready: 'window.__xbench && window.__xbench.ready === true' });
    const cases = await page.evaluate(() => __xbench.cases);
    ok(cases.length === 28 && new Set(cases).size === 28, 'plné měření má 28 různých případů', String(cases.length));
    const cov = await page.evaluate(() => ({ zaklad: __xbench.coverage('zaklad'), svetla: __xbench.coverage('svetla_4'), interier: __xbench.coverage('interier'), aa: __xbench.coverage('interier_aa') }));
    ok(cov.interier > 0.999 && cov.aa > 0.999, 'interiér pokrývá celý obraz', `${(cov.interier * 100).toFixed(2)} %`);
    ok(cov.zaklad > 0.2 && cov.zaklad < 0.95 && cov.svetla < 0.95, 'původní scéna celý obraz nepokrývá (ceny po pixelech z ní jsou spodní odhad)', `základ ${(cov.zaklad * 100).toFixed(1)} %, světla ${(cov.svetla * 100).toFixed(1)} %`);
    const r = await page.evaluate(() => __xbench.run({ quick: true }));
    ok(r && r.results.length === 4, 'rychlá zkouška doběhne se čtyřmi výsledky');
    ok(r.results.every((x) => x.ms > 0 && x.p95 >= x.ms && x.samples >= 1), 'každý výsledek má medián, 95. percentil a vzorky', r.results.map((x) => `${x.ms} ms`).join(', '));
    ok(r.results[0].calls === 21 && r.results[0].tris > 3000, 'scéna má požadovaný počet volání a trojúhelníků', `${r.results[0].calls} volání, ${r.results[0].tris} △`);
    ok(r.results[2].room && r.results[2].vc && r.results[2].tex && r.results[2].aa && r.results[2].calls === 22, 'interiér: místnost, barva vrcholů, textura a vyhlazování se měří', `${r.results[2].calls} volání, ${r.results[2].ms} ms`);
    ok(r.results[3].lights === 1 && r.results[3].mat === 'lambert' && r.results[3].room, 'interiér s jedním světlem po pixelech se měří', `${r.results[3].ms} ms`);
    ok(typeof r.env.gpu === 'string' && r.env.webgl2 === true && r.env.three, 'výsledek popisuje stroj (grafika, WebGL 2, verze three)', r.env.gpu.slice(0, 60));
    const ui = await page.evaluate(() => ({ rows: document.querySelectorAll('#rows tr').length, json: document.getElementById('out').value.length, copy: document.getElementById('copy').disabled, start: document.getElementById('start').disabled }));
    ok(ui.rows === 4 && ui.json > 100 && ui.copy === false && ui.start === false, 'tabulka a výsledek jsou vyplněné, tlačítka odemčená');
    const parsed = await page.evaluate(() => JSON.parse(document.getElementById('out').value).results.length);
    ok(parsed === 4, 'výsledek v poli je platný JSON');
    const hard = errs.filter((e) => !/ERR_FAILED|may close only|GPU stall|Automatic fallback to software WebGL/i.test(e));
    ok(hard.length === 0, 'žádná chyba ani varování v konzoli', hard.slice(0, 3).join(' | '));
    code = finish('T3 xBench');
  } finally {
    await browser.close();
  }
  process.exit(code);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
