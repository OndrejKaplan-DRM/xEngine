// A1.7 v prohlížeči: buňky a portály ve skutečném vykreslení. Počty buněk a volání kreslení, žádné díry ve stěnách
// při zavřených dveřích (stěna patří v datech jedné buňce, vidět je ze dvou), hala nezávislá na obsahu laboratoře,
// vývojářská vrstva F4. Snímky pro kontrolu okem: test/out/a17_*.png.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');
const { imageStats, compare, voidPixels } = require('./a_lib/image.cjs');

const HALL = [
  [3, 1.6, -15, 0, 0],
  [3, 1.6, -15, 90, -10],
  [-3, 1.6, -20, -60, 5],
  [8, 1.6, -25, 20, 0],
];
const hallCalls = (page) => page.evaluate((poses) => poses.map((p) => { const s = __xe.shotAt(...p, 75); return s.calls; }), HALL);

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { q: '?dev' });
    const r = await page.evaluate(() => {
      const out = {};
      const sp = __PACK__.levels[0].data.spawns.find((s) => s.kind === 'player');
      const at = (x, y, z, yaw, pitch = 0) => {
        const s = __xe.shotAt(x, y, z, yaw, pitch, 75);
        return { png: s.png, calls: s.calls, tris: s.tris, cells: __xe.get('vis.cells'), active: __xe.game.render.counts.activeLights };
      };
      __xe.start();
      __xe.sim(0.2);
      out.total = __xe.game.render.counts.batches + __xe.game.render.counts.movers + __xe.game.render.counts.screens;
      // ---- zavřené dveře: pohledy na stěny sdílené s jinou buňkou
      out.closed = {
        start: at(sp.pos[0], 1.6, sp.pos[2], 0, -4),
        chodba_k_laboratori: at(2.4, 1.6, -5.5, -90, -5),
        chodba_ke_startu: at(3, 1.6, -3.0, 180, -5),
        laborator_k_chodbe: at(9, 1.6, -5.5, 90, -5),
        sklad_k_chodbe: at(-2.5, 1.6, -4.2, -90, -5),
      };
      // ---- start po otevření dveří
      __xe.game.behave.input(__xe.game.entities.byId('e_door_start'), 'open');
      __xe.sim(1.3);
      out.open = at(sp.pos[0], 1.6, sp.pos[2], 0, -4);
      // ---- totéž s vypnutou viditelností (všechno se kreslí)
      __xe.vis(false);
      out.all = at(sp.pos[0], 1.6, sp.pos[2], 0, -4);
      __xe.vis(true);
      return out;
    });
    ok(r.closed.start.cells.length === 1 && r.closed.start.cells[0] === 'c_start', 'ze startu se zavřenými dveřmi se kreslí 1 buňka', `${r.closed.start.calls} volání, ${r.closed.start.tris} △ (celý level ${r.total} sítí)`);
    ok(r.open.cells.includes('c_corr') && r.open.calls > r.closed.start.calls, 'po otevření dveří přibude chodba', `buňky ${r.open.cells.join(', ')}; volání ${r.closed.start.calls} → ${r.open.calls}; bez viditelnosti ${r.all.calls}`);
    ok(r.open.calls < r.all.calls && r.closed.start.calls <= 150, 'viditelnost šetří volání kreslení (rozpočet ≤ 150 na pohled)', `zavřeno ${r.closed.start.calls}, otevřeno ${r.open.calls}, všechno ${r.all.calls}`);
    for (const [name, v] of Object.entries(r.closed)) {
      const s = await imageStats(page, v.png);
      saveDataUrl(v.png, `a17_${name}.png`);
      // sklad nemá do chodby dveře, jen otvor: tam se kreslí dvě buňky; černé body ve startu jsou zhasnutá lampa
      const want = name === 'sklad_k_chodbe' ? 2 : 1;
      ok(s.dark < 0.002 && v.cells.length === want, `zavřené dveře, pohled „${name}“: ${want === 1 ? 'jediná buňka' : 'dvě buňky'} a žádná díra ve stěně`, `buňky ${v.cells.join(', ')}; černých bodů ${(s.dark * 100).toFixed(2)} %, jas ${s.luma.toFixed(0)}, ${v.calls} volání`);
    }
    saveDataUrl(r.open.png, 'a17_start_otevreno.png');

    // ---- skutečná chůze: průchod dveřmi bez černého snímku
    const walk = await page.evaluate(() => {
      __xe.tp(3, 0, 1.0, 0);
      __xe.sim(0.1);
      const shots = [];
      const track = [];
      for (let i = 0; i < 8; i++) {
        __xe.sim(0.12, { hold: ['fwd'] });
        shots.push(__xe.shot());
        track.push(`${__xe.game.vis.cameraCell}:${__xe.game.render.counts.visibleCells}`);
      }
      return { shots, track, z: __xe.game.player.pos[2] };
    });
    let worst = 0;
    for (const png of walk.shots) worst = Math.max(worst, (await imageStats(page, png)).dark);
    ok(worst < 0.002 && walk.track.at(-1).startsWith('c_corr'), 'průchod dveřmi ze startu do chodby: žádný snímek s dírou', `buňka kamery a počet kreslených buněk po krocích: ${walk.track.join(' ')}; nejvíc černých bodů ${(worst * 100).toFixed(2)} %`);
    saveDataUrl(walk.shots[3], 'a17_ve_dverich.png');

    // ---- vývojářská vrstva F4 skutečnou klávesou
    const plain = await page.evaluate(() => { __xe.tp(3, 0, 4.5, 0); __xe.sim(0.1); return __xe.shot(); });
    await page.keyboard.press('F4');
    const lined = await page.evaluate(() => ({ png: __xe.shot(), dev: __xe.dev() }));
    const d = await compare(page, plain, lined.png, 24);
    ok(lined.dev.cells && d.over * d.w * d.h > 800, 'F4 zapne obrysy buněk a portálů', `změněných bodů ${Math.round(d.over * d.w * d.h)}`);
    saveDataUrl(lined.png, 'a17_obrysy.png');
    await page.keyboard.press('F4');
    const off = await page.evaluate(() => ({ png: __xe.shot(), dev: __xe.dev() }));
    const d2 = await compare(page, plain, off.png, 24);
    ok(!off.dev.cells && d2.over === 0, 'druhé F4 je zase schová', `rozdíl ${d2.mean.toFixed(3)}`);

    // ---- díry: pozadí scény v signální barvě, rozhlédnutí z 12 míst při zavřených i otevřených dveřích.
    // Kde by viditelnost schovala buňku, která vidět je, prosvítalo by pozadí.
    const ring = [];
    for (const [x, z] of [[3, 4.5], [3, 1], [3, -1.2], [3, -5.5], [3, -7.8], [8, -5.2], [5, -3], [-2, -4.2], [3, -9.6], [3, -15], [-3, -22], [9, -26]]) for (const yaw of [0, 90, 180, -90]) ring.push([x, 1.6, z, yaw]);
    const voidIn = async (poses) => {
      let worst = 0;
      let where = '';
      let core = 0;
      let total = 0;
      for (const p of poses) {
        const v = await voidPixels(page, await page.evaluate((q) => __xe.shotAt(q[0], q[1], q[2], q[3], -5, 75).png, p));
        core += v.core;
        total += v.n;
        if (v.n > worst) {
          worst = v.n;
          where = p.join(', ');
        }
      }
      return { worst, where, core, total };
    };
    await page.evaluate(() => {
      __xe.game.render.scene.background.setRGB(1, 0, 1);
      __xe.game.behave.input(__xe.game.entities.byId('e_door_start'), 'close');
      __xe.sim(1.3);
    });
    const control = await voidPixels(page, await page.evaluate(() => __xe.shotAt(3, 40, 3, 0, 80, 75).png)); // nad levelem, pohled do nebe
    const shut = await voidIn(ring);
    await page.evaluate(() => {
      for (const id of ['e_door_start', 'e_door_lab']) __xe.game.behave.input(__xe.game.entities.byId(id), 'open');
      __xe.sim(1.5);
    });
    const opened = await voidIn(ring);
    ok(control.n > 100000 && control.core > 90000, 'kontrola zkoušky: pohled mimo level ukáže signální pozadí', `${control.n} bodů, z toho ${control.core} v souvislé ploše`);
    ok(shut.core === 0 && opened.core === 0, 'žádná díra: z 12 míst a 4 směrů není nikde vidět souvislá plocha pozadí (dveře zavřené i otevřené)', `${ring.length} pohledů na každý stav; bodů v souvislé ploše ${shut.core} / ${opened.core}`);
    // Švy: sousední kvádry mají každý svou mřížku světla a na společné hraně jim vrcholy nelícují (zadání, oddíl 6).
    // Jednotlivé body pozadí na švech nejsou díra ve viditelnosti; počet se hlídá, aby nerostl. Viz N-108.
    const SEAM_LIMIT = Math.round(1366 * 768 * 0.0001); // 0,01 % obrazu
    ok(shut.worst <= SEAM_LIMIT && opened.worst <= SEAM_LIMIT, 'švy mezi sítěmi: jednotlivých bodů pozadí nejvýš 0,01 % obrazu', `nejhorší pohled ${shut.worst} / ${opened.worst} bodů z ${1366 * 768} (${shut.where || opened.where}); součet přes ${ring.length} pohledů ${shut.total} / ${opened.total}`);

    // ---- hala: volání nezávisí na obsahu laboratoře (druhé načtení s laboratoří bez entit)
    await page.evaluate(() => {
      __xe.game.behave.input(__xe.game.entities.byId('e_door_lab'), 'close');
      __xe.sim(1.5);
    });
    const full = await hallCalls(page);
    const hallCells = await page.evaluate(() => __xe.get('vis.cells'));
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
    const second = await openGame(browser, {
      q: '?dev',
      mutate: `const l = p.levels[0].data; const gone = new Set(l.entities.filter((e) => e.cell === 'c_lab').map((e) => e.id));
        l.entities = l.entities.filter((e) => !gone.has(e.id)); for (const e of l.entities) if (e.io) e.io = e.io.filter((k) => !gone.has(k.target)); globalThis.__gone = gone.size;`,
    });
    await second.page.evaluate(() => { __xe.start(); __xe.sim(0.2); __xe.game.behave.input(__xe.game.entities.byId('e_door_start'), 'open'); __xe.sim(1.3); });
    const empty = await hallCalls(second.page);
    const gone = await second.page.evaluate(() => globalThis.__gone);
    ok(gone >= 4 && full.every((n, i) => n === empty[i]) && !hallCells.includes('c_lab'), 'počet volání kreslení v hale nezávisí na obsahu laboratoře', `s laboratoří ${full.join(', ')}; laboratoř bez ${gone} entit ${empty.join(', ')}`);
    ok(clean(second.errs).length === 0, 'ani ve druhém načtení žádná chyba v konzoli', clean(second.errs).slice(0, 3).join(' | '));
    await second.page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.7 buňky a portály (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
