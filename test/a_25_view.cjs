// A2.5 v prohlížeči: sklo s materials[].opacity je ve hře průhledné a zavřené dveře se interact.seeThrough
// nezavírají pohled (sloupec „Hotovo, když“ zadání vlny 2). Zkušební data: křídlo dveří startu zlatého vzorku
// je ze skla (opacity 0,35) a má seeThrough. Srovnává se střed dveří na snímku: skleněné zavřené dveře musí být
// blíž otevřeným dveřím než obyčejné zavřené. Snímky: test/out/a25_*.png.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');

const POSE = [3, 1.6, 2.0, 0, 0]; // ze startu na dveře do chodby (vzdálenost asi 2,1 m)
const REGION = `async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  // střed obrazu, 8 % šířky a 20 % výšky: celé leží na křídle dveří
  const w = Math.round(img.width * 0.08);
  const h = Math.round(img.height * 0.2);
  const d = g.getImageData(Math.round((img.width - w) / 2), Math.round((img.height - h) / 2), w, h).data;
  const m = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) m[k] += d[i + k];
  const n = d.length / 4;
  return m.map((v) => v / n);
}`;
const region = (page, src) => page.evaluate(`(${REGION})(${JSON.stringify(src)})`);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const GLASS = `
  p.materials.materials.glass_test = { model: 'lit', color: [0.6, 0.75, 0.8], opacity: 0.35 };
  const door = p.prefabs.find((x) => x.data.id === 'door_hinged_01').data;
  for (const part of door.parts) if (part.node === 'leaf' && part.mat === 'wood_dark') part.mat = 'glass_test';
  door.components.interact.seeThrough = true;
`;

const shoot = (page, open) =>
  page.evaluate(
    ([pose, open]) => {
      __xe.start();
      __xe.sim(0.2);
      const door = __xe.game.entities.byId('e_door_start');
      if (open) {
        __xe.game.behave.input(door, 'open');
        __xe.sim(1.5);
      }
      const s = __xe.shotAt(...pose, 60);
      const glass = [];
      __xe.game.render.scene.traverse((o) => {
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of ms) if (m.name === 'glass_test') glass.push({ transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite, visible: o.visible });
      });
      return { png: s.png, cells: __xe.get('vis.cells'), joint: door.joints[0].value, glass };
    },
    [POSE, open],
  );

(async () => {
  const browser = await launch();
  try {
    const plain = await openGame(browser);
    const a = await shoot(plain.page, false);
    const c = await shoot(plain.page, true);
    const ra = await region(plain.page, a.png);
    const rc = await region(plain.page, c.png);
    saveDataUrl(a.png, 'a25_zavreno.png');
    saveDataUrl(c.png, 'a25_otevreno.png');
    ok(clean(plain.errs).length === 0, 'obyčejný xLab bez chyby v konzoli', clean(plain.errs).slice(0, 2).join(' | '));
    await plain.page.context().close();

    const glass = await openGame(browser, { mutate: GLASS });
    const b = await shoot(glass.page, false);
    const rb = await region(glass.page, b.png);
    saveDataUrl(b.png, 'a25_sklo.png');
    ok(a.joint === 0 && b.joint === 0 && c.joint > 0, 'srovnávají se zavřené dveře (obyčejné, skleněné) a otevřené', `kloub ${a.joint}°, ${b.joint}°, ${c.joint}°`);
    const m = b.glass[0];
    ok(b.glass.length > 0 && m.transparent && Math.abs(m.opacity - 0.35) < 1e-6 && m.depthWrite === false, 'materiál s opacity se kreslí průhledně a nezapisuje do hloubky', JSON.stringify(m));
    ok(a.cells.length === 1 && b.cells.length >= 2 && c.cells.length >= 2, 'zavřené dveře se seeThrough nezavírají pohled do chodby', `buňky: obyčejné zavřené ${a.cells.join(', ')}; skleněné zavřené ${b.cells.join(', ')}; otevřené ${c.cells.join(', ')}`);
    const fmt = (v) => `[${v.map((x) => x.toFixed(0)).join(', ')}]`;
    ok(dist(rb, rc) < dist(ra, rc) * 0.7, 'skleněnými zavřenými dveřmi je vidět, co je za nimi', `střed dveří: obyčejné ${fmt(ra)}, sklo ${fmt(rb)}, otevřené ${fmt(rc)}; vzdálenost od otevřených ${dist(ra, rc).toFixed(1)} → ${dist(rb, rc).toFixed(1)}`);
    ok(clean(glass.errs).length === 0, 'xLab se skleněnými dveřmi bez chyby v konzoli', clean(glass.errs).slice(0, 2).join(' | '));
  } finally {
    await browser.close();
  }
  process.exit(finish('A2.5 sklo a průhledné dveře (prohlížeč)'));
})();
