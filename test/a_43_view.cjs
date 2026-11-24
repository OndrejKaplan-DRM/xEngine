// N-110 a D-043 v prohlížeči: zkouška textury světla na hale xLabu (?lightmap=10) proti světlu po vrcholech.
// Ověřuje: dávky haly mají materiál s lightMap a síť s UV 1, textura je half float, obraz bez chyby v konzoli,
// a stín na podlaze je ostřejší (víc ostrých hran jasu mezi sousedními body obrazu v dolní polovině snímku).
// Snímky: test/out/a43_vrcholy.png, a43_textura.png.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');

const POSE = [2, 4, -17, 0, -89]; // shora na podlahu haly za sloupem: klín stínu sloupu od lampy A
const EDGES = `async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const y0 = 0;
  const d = g.getImageData(0, y0, img.width, img.height - y0).data;
  const lum = (i) => (d[i] + d[i + 1] + d[i + 2]) / 3;
  let n = 0;
  // ostrý přechod = rozdíl jasu přes 30 na vzdálenost 6 bodů obrazu (texel 10 cm je tu několik bodů, mřížka 0,5 m desítky)
  for (let y = 0; y < img.height - y0; y++) for (let x = 6; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    if (Math.abs(lum(i) - lum(i - 24)) > 30) n++;
  }
  return n;
}`;

const shoot = (page) =>
  page.evaluate((pose) => {
    __xe.start();
    for (const id of ['e_lamp_hall_a', 'e_lamp_hall_b']) __xe.game.behave.input(__xe.game.entities.byId(id), 'turnOn');
    __xe.sim(0.2);
    __xe.game.light.finish();
    const s = __xe.shotAt(...pose, 70);
    const mats = [];
    for (const T of __xe.game.render.statics) {
      if (T.cell !== 'c_hall' || !T.colors) continue;
      const m = T.mesh.material;
      mats.push({ lm: !!m.lightMap, half: m.lightMap ? m.lightMap.type : null, uv1: !!T.mesh.geometry.getAttribute('uv1'), vc: m.vertexColors });
    }
    return { png: s.png, stat: __xe.game.lightmapStat, mats };
  }, POSE);

(async () => {
  const browser = await launch();
  try {
    const v = await openGame(browser);
    const a = await shoot(v.page);
    const ea = await v.page.evaluate(`(${EDGES})(${JSON.stringify(a.png)})`);
    saveDataUrl(a.png, 'a43_vrcholy.png');
    await v.page.context().close();

    const t = await openGame(browser, { q: '?lightmap=10', timeout: 180000 });
    const b = await shoot(t.page);
    const eb = await t.page.evaluate(`(${EDGES})(${JSON.stringify(b.png)})`);
    saveDataUrl(b.png, 'a43_textura.png');
    ok(b.stat && b.stat.texel === 0.1 && b.stat.texels > 0, '?lightmap=10 postaví texturu světla haly', JSON.stringify(b.stat));
    ok(b.mats.length > 0 && b.mats.every((m) => m.lm && m.uv1 && !m.vc && m.half === 1016), 'dávky haly: lightMap (half float), UV 1, bez barvy vrcholů', JSON.stringify(b.mats[0]));
    ok(a.mats.every((m) => !m.lm && m.vc), 'bez přepínače zůstává světlo po vrcholech', `${a.mats.length} dávek`);
    ok(eb > ea * 1.5, 'stín na podlaze je s texturou ostřejší (přechody jasu přes 30 na 6 bodech, snímek podlahy shora)', `po vrcholech ${ea}, textura 10 cm ${eb}`);
    ok(clean(t.errs).length === 0, 'bez chyby v konzoli', clean(t.errs).slice(0, 3).join(' | '));
    await t.page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('N-110 textura světla na hale (prohlížeč)'));
})();
