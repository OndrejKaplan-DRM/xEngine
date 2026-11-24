// A2.6 v prohlížeči: textura barvy (`albedo`) a díl `.glb` jsou ve hře vidět a světlo texturu násobí (sloupec
// „Hotovo, když“ zadání vlny 2, zatím na zkušebních datech; kus ze sešny B přijde s B2.5). Zkušební data:
// textura WebP 1 024 × 1 024 vyrobená v prohlížeči (horní čtvrtina zelená = kde je nahoře, pod ní šachovnice
// červená × modrá), stojan z .glb s tou texturou v hale a stejná textura na sloupu z kvádru (krabicová projekce
// v metrech, uvScale). Soubory jdou do pack.files tak, jak je má vložit build (N-111). Snímky: test/out/a26_*.png.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');

const STAND = [-1, 1.0, -13, 0, 0]; // 3 m před stojanem v hale, pohled do −Z; lampa haly A je nad tímto místem
const PILLAR = [6, 1.0, -11.4, 0, 0]; // 2,2 m před přední stěnou sloupu b_pillar_051
const MAKE_WEBP = `(() => {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    g.fillStyle = (x + y) % 2 ? 'rgb(220,40,40)' : 'rgb(40,40,220)';
    g.fillRect(x * 128, y * 128, 128, 128);
  }
  g.fillStyle = 'rgb(30,200,30)';
  g.fillRect(0, 0, 1024, 256);
  return c.toDataURL('image/webp', 0.9);
})()`;

/** Průměr a podíly barev v obdélníku obrazu (zlomky šířky a výšky; y = 0 nahoře). */
const REGION = `async ([src, cx, cy, w, h]) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const W = Math.max(2, Math.round(img.width * w));
  const H = Math.max(2, Math.round(img.height * h));
  const d = g.getImageData(Math.round(img.width * cx - W / 2), Math.round(img.height * cy - H / 2), W, H).data;
  const m = [0, 0, 0];
  let red = 0, blue = 0, green = 0;
  for (let i = 0; i < d.length; i += 4) {
    const [r, gg, b] = [d[i], d[i + 1], d[i + 2]];
    m[0] += r; m[1] += gg; m[2] += b;
    if (r > gg * 1.5 && r > b * 1.5) red++;
    else if (b > r * 1.5 && b > gg * 1.5) blue++;
    else if (gg > r * 1.5 && gg > b * 1.5) green++;
  }
  const n = d.length / 4;
  return { mean: m.map((v) => v / n), lum: (m[0] + m[1] + m[2]) / 3 / n, red: red / n, blue: blue / n, green: green / n };
}`;
const region = (page, src, cx, cy, w, h) => page.evaluate(`(${REGION})(${JSON.stringify([src, cx, cy, w, h])})`);

const mutate = (glb64, webp64) => `
  // N-009: color materiálu s texturou je průměr povrchu; tex_test nese průměr v datech (a1) roven barvě (zesílení 1),
  // tex_pillar ho nemá a běh ho spočítá z obrázku (a2)
  p.materials.materials.tex_test = { model: 'lit', color: [0.5, 0.5, 0.5], albedoMean: [0.5, 0.5, 0.5], albedo: 'textures/checker.webp', uvScale: 0.5, surface: 'metal' };
  p.materials.materials.tex_pillar = { model: 'lit', color: [0.3, 0.3, 0.3], albedo: 'textures/checker.webp', uvScale: 0.5, surface: 'metal' };
  p.prefabs.push({ file: 'prefabs/test_mesh_01.json', data: {
    xspace: 1, kind: 'prefab', id: 'test_mesh_01', title: 'Zkušební stojan z .glb', category: 'prop.test',
    bounds: { min: [-0.4, 0, -0.4], max: [0.4, 1.6, 0.4] }, rig: { nodes: [{ id: 'root' }] },
    parts: [{ node: 'root', shape: 'mesh', mesh: 'models/stand.glb#body', mat: 'tex_test' }],
    colliders: [{ node: 'root', shape: 'mesh', mesh: 'models/stand.glb#body', group: 'world' }],
    components: { physics: { body: 'static' } } } });
  const L = p.levels[0].data;
  L.entities.push({ id: 'e_stand', prefab: 'test_mesh_01', cell: 'c_hall', pos: [-1, 0, -16], rot: [0, 0, 0] });
  L.brushes.find((b) => b.id === 'b_pillar_051').mat = 'tex_pillar';
  for (const l of L.lights || []) l.intensity = 0; // halu svítí jen její lampy (světlo z chodby portálem by srovnání rozmazalo)
  p.files = { 'golden/models/stand.glb': ${JSON.stringify(glb64)}, 'golden/textures/checker.webp': ${JSON.stringify(webp64)} };
`;

const shoot = (page, pose, lampsOn) =>
  page.evaluate(
    ([pose, lampsOn]) => {
      __xe.start();
      for (const id of ['e_lamp_hall_a', 'e_lamp_hall_b']) __xe.game.behave.input(__xe.game.entities.byId(id), lampsOn ? 'turnOn' : 'turnOff');
      __xe.sim(0.3);
      const s = __xe.shotAt(...pose, 60);
      const color = {};
      __xe.game.render.scene.traverse((o) => {
        if (o.material && /^tex_/.test(o.material.name)) color[o.material.name] = o.material.color.toArray();
      });
      return { png: s.png, color, tex: __xe.game.render.materials.textures(), stat: { ...__xe.game.render.materials.stat }, assets: { ...__xe.game.assets.stat } };
    },
    [pose, lampsOn],
  );

(async () => {
  const { makeGlb, boxMesh } = await import('./a_lib/glb.mjs');
  const glb64 = Buffer.from(makeGlb([{ name: 'body', mesh: boxMesh([-0.4, 0, -0.4], [0.4, 1.6, 0.4]) }])).toString('base64');
  const browser = await launch();
  try {
    const plain = await openGame(browser);
    const url = await plain.page.evaluate(MAKE_WEBP);
    await plain.page.context().close();
    ok(url.startsWith('data:image/webp;base64,'), 'zkušební textura je WebP (kontrakt, oddíl 4)', `${url.slice(0, 23)}…, ${Math.round((url.length * 3) / 4 / 1024)} kB`);
    const webp64 = url.slice(url.indexOf(',') + 1);

    const g = await openGame(browser, { mutate: mutate(glb64, webp64) });
    // materiály vznikají při stavbě levelu; dekódování textury pak běží na pozadí
    await g.page.evaluate(() => __xe.start());
    await g.page.waitForFunction(() => __xe.game.render.materials.stat.textures + __xe.game.render.materials.stat.failed > 0, null, { timeout: 60000, polling: 250 });
    const on = await shoot(g.page, STAND, true);
    const off = await shoot(g.page, STAND, false);
    const pil = await shoot(g.page, PILLAR, true);
    saveDataUrl(on.png, 'a26_stojan.png');
    saveDataUrl(off.png, 'a26_stojan_zhasnuto.png');
    saveDataUrl(pil.png, 'a26_sloup.png');
    const t = on.tex[0];
    ok(on.tex.length === 1 && t.src[0] === 1024 && t.w === 512 && t.h === 512, 'textura 1 024 px se na stupni low zmenší na 512 px', JSON.stringify(on.tex));
    // průměr šachovnice lineárně: čtvrtina zelená (30, 200, 30), zbytek napůl červená (220, 40, 40) a modrá (40, 40, 220)
    const want = [0.279, 0.161, 0.279];
    const mean = t.mean || [0, 0, 0];
    ok(mean.every((m, i) => Math.abs(m - want[i]) < want[i] * 0.1), 'průměr textury lineárně spočítaný při načtení (N-009 a2)', `${mean.map((v) => v.toFixed(3))} proti ${want}`);
    const cp = on.color.tex_pillar || [];
    const ct = on.color.tex_test || [];
    ok(cp.length && cp.every((c, i) => Math.abs(c - 0.3 / mean[i]) < 1e-3) && ct.every((c) => Math.abs(c - 1) < 1e-6), 'barva materiálu = color / průměr textury (průměr z dat, nebo spočítaný)', `sloup ${cp.map((v) => v.toFixed(3))}, stojan ${ct.map((v) => v.toFixed(3))}`);
    ok(on.assets.meshParts === 1 && on.assets.trimeshes === 1 && on.assets.missing === 0 && on.stat.failed === 0, 'díl a kolize z .glb postavené, textura bez chyby', JSON.stringify({ assets: on.assets, tex: on.stat }));

    // stojan: střed obrazu je na jeho přední stěně (oči 1,0 m, stojan 0 až 1,6 m); zelený pruh nahoře textury je nahoře stojanu
    const mid = await region(g.page, on.png, 0.5, 0.6, 0.04, 0.12);
    const top = await region(g.page, on.png, 0.5, 0.37, 0.03, 0.03);
    const fmt = (r) => `červená ${(r.red * 100).toFixed(0)} %, modrá ${(r.blue * 100).toFixed(0)} %, zelená ${(r.green * 100).toFixed(0)} %, jas ${r.lum.toFixed(0)}`;
    ok(mid.red > 0.15 && mid.blue > 0.15, 'síť z .glb nese texturu (šachovnice na stěně stojanu)', fmt(mid));
    ok(top.green > 0.6, 'textura na síti z .glb není vzhůru nohama (zelená čtvrtina nahoře)', fmt(top));
    const dark = await region(g.page, off.png, 0.5, 0.6, 0.04, 0.12);
    ok(dark.lum < mid.lum * 0.5 && dark.red + dark.blue > 0.2, 'světlo texturu násobí: po zhasnutí lamp haly je stojan tmavší a textura zůstává', `rozsvíceno: ${fmt(mid)}; zhasnuto: ${fmt(dark)}`);
    const p = await region(g.page, pil.png, 0.5, 0.55, 0.1, 0.2);
    ok(p.red > 0.15 && p.blue > 0.15, 'textura na kvádru levelu (krabicová projekce, uvScale 0,5 m)', fmt(p));
    ok(clean(g.errs).length === 0, 'bez chyby v konzoli', clean(g.errs).slice(0, 3).join(' | '));
    await g.page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A2.6 textura a síť .glb (prohlížeč)'));
})();
