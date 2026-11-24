// A1.6 v prohlížeči: manipulace skutečnou myší a klidný režim skutečnou klávesnicí v sestavené hře.
// Tažení ventilu (bez zámku kurzoru: pohled tažením, úchop má přednost), terminál: E posadí, psaní jde na obrazovku
// ve světě, Esc vrací do hry a nepauzuje. Snímky pro kontrolu okem: test/out/a16_*.png.

const { launch, openGame, ok, finish, clean, saveDataUrl } = require('./a_lib/browser.cjs');
const { imageStats, compare } = require('./a_lib/image.cjs');

const FACE = `(id, d, aim) => {
  const ent = __xe.game.entities.byId(id);
  const c = __xe.game.entities.center(id);
  __xe.tp(c[0] + ent.em[8] * d, 0, c[2] + ent.em[10] * d);
  if (aim) __xe.aim(aim[0], aim[1], aim[2]); else __xe.aim(id);
  __xe.sim(0.1);
  __xe.render();
}`;

(async () => {
  const browser = await launch();
  try {
    const { page, errs } = await openGame(browser, { q: '?dev' });
    const vp = page.viewportSize();
    const cx = vp.width / 2;
    const cy = vp.height / 2;
    await page.evaluate(`(() => { window.face = ${FACE}; __xe.start(); __xe.sim(0.2); __xe.game.behave.input(__xe.game.entities.byId('e_door_lab'), 'open'); __xe.sim(1.5); })()`);

    // ---- ventil skutečnou myší
    const lab = () => page.evaluate(() => __xe.shotAt(10.6, 1.6, -7.2, 35, -8, 75).png);
    const full = await lab();
    await page.evaluate(() => face('e_valve', 0.9));
    const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id || document.elementFromPoint(x, y)?.className, [cx, cy]);
    ok(top === 'c', 'nad středem obrazu není při hře nic, co by bralo myš', `navrchu „${top}“`);
    const yaw0 = await page.evaluate(() => __xe.get('player.yaw'));
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.evaluate(() => __xe.sim(0.03));
    const grabbed = await page.evaluate(() => __xe.get('interact.manip'));
    ok(grabbed && grabbed.id === 'e_valve', 'stisk levého tlačítka nad ventilem ho uchopí', JSON.stringify(grabbed));
    // táhnout po směru, který hra hlásí, dokud ventil není na polovině
    let norm = 0;
    let px = 0;
    for (let i = 0; i < 40 && norm < 0.5; i++) {
      const dir = (await page.evaluate(() => __xe.get('interact.manip'))).screenDir;
      const step = Math.min(30, Math.max(2, Math.round((0.5 - norm) * 830)));
      // kurzor se vrací do středu, aby nevyjel z okna (bez zámku kurzoru se čte jen rozdíl poloh)
      await page.mouse.move(cx + dir[0] * step, cy + dir[1] * step);
      px += step;
      norm = await page.evaluate(() => {
        __xe.sim(0.02);
        return __xe.game.entities.byId('e_valve').joints[0].norm;
      });
      await page.mouse.up();
      await page.evaluate(() => __xe.sim(0.02));
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.evaluate(() => __xe.sim(0.02));
    }
    await page.mouse.up();
    const v = await page.evaluate(() => {
      __xe.sim(0.3);
      return { norm: __xe.game.entities.byId('e_valve').joints[0].norm, lamp: __xe.get('entity.e_lamp_lab.light'), yaw: __xe.get('player.yaw'), manip: __xe.get('interact.manip') };
    });
    ok(Math.abs(v.norm - 0.5) < 0.02 && Math.abs(v.lamp.level - v.norm) < 1e-9, 'ventil natočený myší na 50 % nastaví lampu laboratoře na poloviční svit', `ventil ${(v.norm * 100).toFixed(1)} %, lampa ${(v.lamp.level * 100).toFixed(1)} %, ${px} bodů myši`);
    ok(v.yaw === yaw0 && v.manip === null, 'tažení ventilu neotáčí pohled; po puštění úchop končí', `yaw ${v.yaw}°`);
    const half = await lab();
    const a = await imageStats(page, full);
    const b = await imageStats(page, half);
    // laboratoř je přesvícená (návrh N-105) a svítí v ní i dvě světla levelu, proto je pokles jasu malý
    ok(b.luma < a.luma - 5, 'poloviční svit lampy je vidět v obraze laboratoře', `jas ${a.luma.toFixed(1)} → ${b.luma.toFixed(1)}`);
    await page.evaluate(() => __xe.game.behave.input(__xe.game.entities.byId('e_valve'), 'setLevel', 1));

    // ---- páka a zásuvka (snímky do montáže; mechaniku ověřuje test v Node)
    const shots = {};
    await page.evaluate(() => { __xe.sim(3.5); face('e_valve', 1.1); });
    shots.ventil = await page.evaluate(() => __xe.shot());
    await page.evaluate(() => { face('e_lever', 1.1); __xe.key('Mouse0', true); __xe.sim(0.03); });
    for (let i = 0; i < 12; i++) await page.evaluate(() => { const d = __xe.get('interact.manip').screenDir; __xe.look(d[0] * 20, d[1] * 20); __xe.sim(0.02); });
    shots.paka = await page.evaluate(() => { __xe.key('Mouse0', false); __xe.sim(0.5); return __xe.shot(); });
    const lever = await page.evaluate(() => ({ joint: __xe.get('entity.e_lever.joint'), lamp: __xe.get('entity.e_lamp_hall_a.light').on }));
    ok(lever.joint === 40 && lever.lamp, 'páka přehozená tažením rozsvítí lampu haly', JSON.stringify(lever));
    await page.evaluate(() => { face('e_cabinet', 1.1); __xe.key('Mouse0', true); __xe.sim(0.03); });
    for (let i = 0; i < 12; i++) await page.evaluate(() => { const d = __xe.get('interact.manip').screenDir; __xe.look(d[0] * 20, d[1] * 20); __xe.sim(0.02); });
    shots.zasuvka = await page.evaluate(() => { __xe.key('Mouse0', false); __xe.sim(0.3); return __xe.shot(); });
    ok((await page.evaluate(() => __xe.get('entity.e_cabinet.joint'))) > 0.3, 'zásuvka vytažená tažením', `${await page.evaluate(() => __xe.get('entity.e_cabinet.joint'))} m`);

    // ---- terminál skutečnou klávesnicí
    await page.evaluate(() => face('e_desk', 1.0));
    const before = await page.evaluate(() => { const c = __xe.game.render.camera; return { p: c.position.toArray(), r: [c.rotation.x, c.rotation.y], fov: c.fov, cross: !document.querySelector('.hud-cross').hidden }; });
    // Zámek kurzoru se v headless prohlížeči nedá bezpečně získat (teče paměť). Podvrhne se: dokument hlásí, že
    // zámek drží obal plátna, a počítají se všechna volání a události zámku za pobyt u terminálu (D-024: žádné).
    await page.evaluate(() => {
      window.__lock = { on: true, request: 0, exit: 0, change: 0 };
      Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => (window.__lock.on ? document.getElementById('view') : null) });
      Element.prototype.requestPointerLock = function () { window.__lock.request++; return Promise.resolve(); };
      document.exitPointerLock = () => { window.__lock.exit++; };
      document.addEventListener('pointerlockchange', () => window.__lock.change++);
      __xe.lockMode(true);
    });
    await page.keyboard.press('KeyE');
    const seated = await page.evaluate(() => { __xe.sim(0.5); __xe.render(); const c = __xe.game.render.camera; return { seat: __xe.get('interact.seat'), fov: c.fov, cross: !document.querySelector('.hud-cross').hidden, notice: document.querySelector('.hud-notice').textContent, mode: __xe.get('kernel.mode') }; });
    ok(seated.seat && seated.seat.phase === 'on' && seated.fov === 50 && !seated.cross, 'klávesa E u terminálu posadí hráče: kamera podle station, zaměřovač zmizí', `zorné pole ${seated.fov}°, oznámení „${seated.notice}“`);
    const empty = await page.evaluate(() => __xe.shot());
    await page.keyboard.type('svetla haly');
    const typed = await page.evaluate(() => __xe.get('interact.term.e_desk'));
    ok(typed.input === 'svetla haly', 'psaní jde na obrazovku terminálu, ne do ovládání hry', `„${typed.input}“`);
    const pos0 = await page.evaluate(() => [...__xe.game.player.pos]);
    const lamp0 = await page.evaluate(() => __xe.get('entity.e_lamp_hall_a.light').on);
    await page.keyboard.press('Enter');
    const sent = await page.evaluate(() => { __xe.sim(0.2); return { term: __xe.get('interact.term.e_desk'), lamp: __xe.get('entity.e_lamp_hall_a.light').on, pos: [...__xe.game.player.pos] }; });
    ok(sent.term.lines.at(-1) === '> svetla haly' && sent.lamp === !lamp0 && sent.pos.every((x, i) => x === pos0[i]), 'Enter odešle příkaz (spojení z dat přepne lampu haly) a hráč se psaním nehýbe', `řádky ${JSON.stringify(sent.term.lines)}, lampa ${lamp0} → ${sent.lamp}`);
    // vlastní kurzor na obrazovce ve světě: myš se zamčeným kurzorem ho vede, kliknutí je „použít“ v jeho místě
    const cur = await page.evaluate(() => {
      const p0 = [...__xe.get('interact.term.e_desk').pointer];
      document.dispatchEvent(new MouseEvent('mousemove', { movementX: 70, movementY: -35, bubbles: true }));
      const p1 = [...__xe.get('interact.term.e_desk').pointer];
      const fired0 = __xe.get('io.stat').fired;
      const lamp0 = __xe.get('entity.e_lamp_hall_a.light').on;
      document.getElementById('view').dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
      __xe.sim(0.2);
      return { p0, p1, fired: __xe.get('io.stat').fired - fired0, lamp: [lamp0, __xe.get('entity.e_lamp_hall_a.light').on], cross: !document.querySelector('.hud-cross').hidden };
    });
    ok(cur.p0[0] === 0.5 && cur.p0[1] === 0.5 && Math.abs(cur.p1[0] - 0.6) < 1e-9 && cur.p1[1] < 0.5 && cur.p1[1] > 0.3, 'zamčená myš vede vlastní kurzor po obrazovce terminálu', `[${cur.p0.join(', ')}] → [${cur.p1.map((x) => x.toFixed(3)).join(', ')}] po posunu 70 bodů vpravo a 35 nahoru`);
    ok(cur.fired >= 1 && cur.lamp[0] !== cur.lamp[1], 'levé tlačítko je „použít“ v místě kurzoru (command click přepne lampu haly)', `spojení ${cur.fired}, lampa ${cur.lamp.join(' → ')}`);
    shots.terminal = await page.evaluate(() => __xe.shot());
    const diff = await compare(page, empty, shots.terminal, 24);
    const changed = Math.round(diff.over * diff.w * diff.h);
    ok(changed > 400, 'napsaný text je na obrazovce vidět', `změněných bodů ${changed} (řádek textu a kurzor)`);
    // za celý pobyt u terminálu se zámku kurzoru nikdo nedotkl
    const lockUse = await page.evaluate(() => ({ ...window.__lock }));
    ok(lockUse.request === 0 && lockUse.exit === 0 && lockUse.change === 0, 'za pobyt u terminálu žádná žádost o zámek kurzoru, žádné uvolnění, žádná událost pointerlockchange', JSON.stringify(lockUse));
    // Esc je i u terminálu pauza; po návratu z pauzy hráč dál sedí
    await page.keyboard.press('Escape');
    const esc = await page.evaluate(async () => {
      const mode0 = __xe.get('kernel.mode');
      const seat0 = !!__xe.get('interact.seat');
      await new Promise((res) => setTimeout(res, 450)); // ochrana proti odskoku: Esc nesmí hru hned zase spustit
      await __xe.resume();
      __xe.sim(0.2);
      return { mode0, seat0, mode: __xe.get('kernel.mode'), seat: __xe.get('interact.seat')?.phase, input: __xe.get('interact.term.e_desk').input };
    });
    ok(esc.mode0 === 'paused' && esc.seat0 && esc.mode === 'playing' && esc.seat === 'on', 'Esc u terminálu je pauza; po Pokračovat hráč dál sedí u terminálu', `režim ${esc.mode0} → ${esc.mode}, sedí ${esc.seat}`);
    // odchod: šipka dolů (krok vzad)
    await page.keyboard.press('ArrowDown');
    const left = await page.evaluate(() => { const mode0 = __xe.get('kernel.mode'); __xe.sim(0.5); __xe.render(); const c = __xe.game.render.camera; return { mode0, mode: __xe.get('kernel.mode'), seat: __xe.get('interact.seat'), p: c.position.toArray(), r: [c.rotation.x, c.rotation.y], fov: c.fov, cross: !document.querySelector('.hud-cross').hidden, screen: document.querySelector('.xs-screen:not([hidden])')?.dataset?.screen || null }; });
    ok(left.mode0 === 'playing' && left.mode === 'playing' && left.seat === null, 'šipka dolů od terminálu odchází a hru nepauzuje', `režim ${left.mode}`);
    const same = left.p.every((x, i) => x === before.p[i]) && left.r.every((x, i) => x === before.r[i]) && left.fov === before.fov;
    ok(same && left.cross, 'odchod od terminálu vrátí kameru přesně na původní místo', `před [${before.p.map((x) => x.toFixed(4)).join(', ')}], po [${left.p.map((x) => x.toFixed(4)).join(', ')}], zorné pole ${left.fov}°`);
    // odchod pravým tlačítkem myši; pravé tlačítko je jinak skok, ten se tím nesmí spustit
    const rmb = await page.evaluate(() => {
      __xe.use();
      __xe.sim(0.6);
      const sat = __xe.get('interact.seat')?.phase;
      const jumps = __xe.game.player.stat.jumps;
      const view = document.getElementById('view');
      view.dispatchEvent(new MouseEvent('mousedown', { button: 2, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));
      __xe.sim(0.6);
      return { sat, seat: __xe.get('interact.seat'), jumped: __xe.game.player.stat.jumps - jumps, mode: __xe.get('kernel.mode') };
    });
    ok(rmb.sat === 'on' && rmb.seat === null && rmb.jumped === 0 && rmb.mode === 'playing', 'pravé tlačítko myši od terminálu odchází a nevyskočí', `sedí ${rmb.sat} → ${rmb.seat}, výskoků ${rmb.jumped}`);
    // Esc mimo terminál pauzuje jako dřív
    await page.evaluate(() => { window.__lock.on = false; __xe.lockMode(false); });
    await page.keyboard.press('Escape');
    const paused = await page.evaluate(() => __xe.get('kernel.mode'));
    ok(paused === 'paused', 'Esc mimo terminál pauzuje jako dřív', `režim ${paused}`);

    for (const [name, png] of Object.entries(shots)) {
      const s = await imageStats(page, png);
      saveDataUrl(png, `a16_${name}.png`);
      ok(s.dark < 0.35 && s.shades > 12, `pohled „${name}“ není černý ani prázdný`, `jas ${s.luma.toFixed(1)}, černých bodů ${(s.dark * 100).toFixed(1)} %`);
    }
    ok(clean(errs).length === 0, 'žádná chyba ani varování v konzoli', clean(errs).slice(0, 3).join(' | '));
    await page.context().close();
  } finally {
    await browser.close();
  }
  process.exit(finish('A1.6 manipulace a klidný režim (prohlížeč)'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
