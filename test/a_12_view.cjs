// A1.2 v prohlížeči: statický svět. Počet koliderů = počet kvádrů s kolizí; volání kreslení ≤ počet dvojic
// (buňka × materiál); snímek ze startu odpovídá xView (stejná data, stejné funkce geometrie, stejná světla).
// Počty se berou z dat levelu, ne z hlavy: jiný balík (zkouška A × B) test nerozbije.

const { launch, open, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');
const { compare, imageStats } = require('./a_lib/image.cjs');

(async () => {
  const browser = await launch();
  try {
    // ---- referenční snímek z xView: pohled „start“, bez prefabů a bez přehledových vrstev
    const xv = await open(browser, { file: 'dist/xview.html', ready: 'window.__xview && window.__xview.ready' });
    const ref = await xv.page.evaluate(() => {
      __xview.view('start');
      __xview.layer('props', false);
      return __xview.shot();
    });
    await xv.page.context().close();

    const { page, errs } = await openGame(browser, { q: '?dev', bare: true }); // level bez entit: jen stavba z kvádrů
    const data = await page.evaluate(() => {
      const level = __PACK__.levels[0].data;
      const sp = level.spawns.find((s) => s.kind === 'player');
      const pairs = new Set(); // dvojice buňka × materiál z dat (jen pro výpis)
      const mats = new Set();
      for (const b of level.brushes) {
        if (b.vis === false) continue;
        pairs.add(b.cell + '|' + b.mat);
        mats.add(b.mat);
        for (const m of Object.values(b.faces || {})) {
          pairs.add(b.cell + '|' + m);
          mats.add(m);
        }
      }
      return { spawn: sp, solid: level.brushes.filter((b) => b.col !== false).length, pairs: pairs.size, mats: mats.size, cells: level.cells.length, lights: (level.lights || []).length };
    });
    // xView kreslí celý level, svítí všemi světly a stíny nemá; srovnání obrazu proto běží s vypnutou viditelností
    // po buňkách a bez zastínění světla
    await page.evaluate(() => { __xe.start(); __xe.shadows(false); __xe.vis(false); });
    const st = await page.evaluate(() => ({ world: __xe.get('world.stat'), fixed: __xe.get('phys.fixedColliders'), stats: __xe.stats() }));
    ok(st.world.brushColliders === data.solid, 'počet koliderů světa = počet kvádrů s kolizí', `${st.world.brushColliders} z ${data.solid}`);
    ok(st.world.batchKeys <= data.cells * data.mats, 'statická geometrie je sloučená po buňce a materiálu', `${st.world.batchKeys} dávek pro ${data.cells} buněk a ${data.mats} materiálů (dvojic v datech ${data.pairs})`);
    ok(st.stats.cells === data.cells, 'vykreslení zná všechny buňky levelu', String(st.stats.cells));

    // ---- D-022: ve scéně není žádné světlo, stínová mapa ani materiál s výpočtem světel
    const sc = await page.evaluate(() => {
      const r = __xe.game.render;
      const out = { lights: 0, meshes: 0, kinds: {}, colored: 0, shadow: r.renderer.shadowMap.enabled };
      r.scene.traverse((o) => {
        if (o.isLight) out.lights++;
        if (!o.isMesh) return;
        out.meshes++;
        out.kinds[o.material.type] = (out.kinds[o.material.type] || 0) + 1;
        if (o.material.vertexColors && o.geometry.getAttribute('color')) out.colored++;
      });
      return out;
    });
    ok(sc.lights === 0 && !sc.shadow && Object.keys(sc.kinds).join() === 'MeshBasicMaterial' && sc.colored > 0, 'průchod scénou nenajde žádné světlo, stín ani materiál s výpočtem světel', `${sc.meshes} sítí, materiály ${JSON.stringify(sc.kinds)}, z toho ${sc.colored} s barvou vrcholů`);

    // ---- stejný pohled jako xView „start“: oko 1,6 m, cíl o 0,1 m níž ve vzdálenosti 4 m, zorné pole 60°
    const s = data.spawn;
    const pitch = (Math.atan2(-0.1, 4) * 180) / Math.PI;
    const shot = await page.evaluate(([x, y, z, yaw, p]) => {
      const a = __xe.shotAt(x, y, z, yaw, p, 60);
      const b = __xe.shotAt(x, y, z, yaw, p, 60); // druhý běh téhož: šum měření
      return { a, b };
    }, [s.pos[0], s.pos[1] + 1.6, s.pos[2], s.yaw || 0, pitch]);
    saveDataUrl(ref, 'a12_xview_start.png');
    saveDataUrl(shot.a.png, 'a12_xlab_start.png');
    ok(shot.a.calls <= st.world.batchKeys, 'volání kreslení ≤ počet dávek (celý level, bez viditelnosti po buňkách)', `${shot.a.calls} volání, ${shot.a.tris} △, dávek ${st.world.batchKeys}`);
    const noise = await compare(page, shot.a.png, shot.b.png);
    const diff = await compare(page, ref, shot.a.png);
    const img = await imageStats(page, shot.a.png);
    ok(img.shades > 12 && img.dark < 0.5, 'obraz ze startu není prázdný ani černý', `jas ${img.luma.toFixed(1)}, ${img.shades} odstínů, černých bodů ${(img.dark * 100).toFixed(1)} %`);
    ok(diff.sameSize, 'snímek má stejné rozměry jako xView', `${diff.w} × ${diff.h}`);
    ok(diff.mean < 4 && diff.over < 0.02, 'snímek ze startu odpovídá xView', `průměrný rozdíl kanálu ${diff.mean.toFixed(2)} z 255, bodů s rozdílem > 24: ${(diff.over * 100).toFixed(2)} %; šum dvou stejných běhů ${noise.mean.toFixed(3)}; jas xView ${diff.lumaA.toFixed(1)} × xLab ${diff.lumaB.toFixed(1)}`);

    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.2 statický svět (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
