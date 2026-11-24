// xLab: měření skutečné hry na cílovém stroji (adresa ?bench; zadání A1.8). Robot projde level po trase složené
// z dat (buňky a portály), v každé buňce se rozhlédne, a hra přitom běží svou obvyklou smyčkou: kroky simulace,
// viditelnost, světlo, vykreslení. Na konci je JSON ke zkopírování.
//
// Čas snímku se měří kolem celého E.tick a po vykreslení se přečte jeden bod obrazu (readPixels), což počká, až
// grafika dokreslí: stejná metoda jako xBench, takže čísla jdou srovnat. Vedle toho se zapisují rozestupy snímků
// (to, co hráč vidí; shora je omezuje obnovovací frekvence displeje).

import { createPhysProbe } from './probe.js';

const REACH = 0.7; // m; bod trasy je dosažený
const TURN_RATE = 240; // °/s
const LOOK_SECONDS = 1.6; // rozhlédnutí o 360° v buňce
const STUCK_SECONDS = 1.5; // bez přiblížení k cíli = přenést (nábytek, schod); počítá se do výsledku
const WARMUP_SECONDS = 1; // první sekunda se neměří (překlad shaderů, nahrání sítí)
const MAX_SAMPLES = 20000;

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : 0);
function summary(arr, n) {
  const s = Array.from(arr.subarray(0, n)).sort((a, b) => a - b);
  return { median: +quantile(s, 0.5).toFixed(2), p95: +quantile(s, 0.95).toFixed(2), max: +(s[s.length - 1] || 0).toFixed(2) };
}

export function createBench({ game, lock, root }) {
  const { E, input, player, world, entities, behave, session, render, light } = game;
  const work = new Float32Array(MAX_SAMPLES);
  const gap = new Float32Array(MAX_SAMPLES);
  const stepMs = new Float32Array(MAX_SAMPLES);
  const probe = createPhysProbe({ game, max: MAX_SAMPLES });
  let calib = null;
  let prevProfile = false;
  const drawMs = new Float32Array(MAX_SAMPLES);
  let repeat = 1; // kolikrát se pohled vykreslí navíc v jedné dávce (roste, dokud je dávka krátká; jako xBench)
  const calls = new Float32Array(MAX_SAMPLES);
  const tris = new Float32Array(MAX_SAMPLES);
  const cellOf = new Int16Array(MAX_SAMPLES);
  const px = new Uint8Array(4);
  let route = [];
  let cells = [];
  let idx = 0;
  let active = false;
  let lookLeft = 0;
  let bestDist = Infinity;
  let stuck = 0;
  let teleports = 0;
  let elapsed = 0;
  let n = 0;
  let done = null;
  let panel = null;
  let steps = 0;

  /** Trasa z dat: prohlídka buněk do hloubky od výchozího místa; mezi buňkami přes střed portálu. */
  function plan(quick) {
    const level = session.level;
    cells = level.cells;
    const at = new Map(cells.map((c, i) => [c.id, i]));
    const links = cells.map(() => []);
    for (const p of level.portals || []) {
      const c = [0, 1, 2].map((k) => (p.quad[0][k] + p.quad[1][k] + p.quad[2][k] + p.quad[3][k]) / 4);
      const y = Math.min(...p.quad.map((q) => q[1]));
      links[at.get(p.a)].push({ to: at.get(p.b), x: c[0], y, z: c[2] });
      links[at.get(p.b)].push({ to: at.get(p.a), x: c[0], y, z: c[2] });
    }
    const centre = (i, look) => ({ x: (cells[i].bounds.min[0] + cells[i].bounds.max[0]) / 2, y: cells[i].bounds.min[1], z: (cells[i].bounds.min[2] + cells[i].bounds.max[2]) / 2, cell: i, look });
    const sp = world.playerSpawn();
    const start = at.get(world.cellAt(sp.pos).id);
    const seen = new Set([start]);
    const out = [{ x: sp.pos[0], y: sp.pos[1], z: sp.pos[2], cell: start, look: true }];
    const visit = (i) => {
      for (const l of links[i]) {
        if (seen.has(l.to) || (quick && seen.size >= 2)) continue;
        seen.add(l.to);
        out.push({ x: l.x, y: l.y, z: l.z, cell: l.to, look: false }, centre(l.to, true));
        visit(l.to);
        out.push({ x: l.x, y: l.y, z: l.z, cell: i, look: false }, centre(i, false)); // návrat
      }
    };
    visit(start);
    while (out.length > 1 && !out[out.length - 1].look) out.pop(); // konec trasy v poslední prohlédnuté buňce
    return out;
  }

  /** Dveře otevřít (i zamčené), lampy rozsvítit: měří se level tak, jak je vidět celý. */
  function openUp() {
    for (const ent of entities.list) {
      if (ent.kind === 'door') {
        if (ent.state.locked) behave.input(ent, 'unlock');
        behave.input(ent, 'open');
      } else if (ent.comp.light && !ent.kind) behave.input(ent, 'turnOn');
    }
  }

  function arrive() {
    const w = route[idx];
    input.hold('fwd', false);
    if (w.look) lookLeft = LOOK_SECONDS;
    else next();
  }
  function next() {
    idx++;
    bestDist = Infinity;
    stuck = 0;
    if (idx >= route.length) finish();
  }

  function status(text) {
    if (!panel) {
      panel = document.createElement('div');
      panel.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:8;max-width:min(720px,92vw);padding:8px 11px;background:rgba(10,14,20,.9);border:1px solid #5dcaa5;border-radius:6px;color:#d8f3e8;font:13px/1.45 ui-monospace,Consolas,monospace;white-space:pre-wrap';
      root.append(panel);
    }
    panel.textContent = text;
  }

  function result() {
    const gl = render.renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const perCell = cells.map((c, i) => {
      const w = [];
      let cs = 0;
      for (let k = 0; k < n; k++) {
        if (cellOf[k] !== i) continue;
        w.push(work[k]);
        cs = Math.max(cs, calls[k]);
      }
      w.sort((a, b) => a - b);
      return { cell: c.id, frames: w.length, workMsMedian: +quantile(w, 0.5).toFixed(2), workMsP95: +quantile(w, 0.95).toFixed(2), callsMax: cs };
    });
    const g = summary(gap, n);
    const st = light.stat;
    const pr = probe.result();
    return {
      env: {
        tool: `xLab ?bench · ${game.VERSION}`,
        date: new Date().toISOString(),
        userAgent: navigator.userAgent,
        cores: navigator.hardwareConcurrency || null,
        memoryGB: navigator.deviceMemory || null,
        screen: [screen.width, screen.height],
        dpr: devicePixelRatio,
        gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        image: render.size,
        antialias: render.antialias,
      },
      level: { id: session.levelId, profile: session.profileId, cells: cells.length, entities: entities.list.length, lights: st.lights, lightGrid: world.stat.lightCell, lightSamples: st.samples, lightSoftened: st.softened, staticTris: render.counts?.staticTris, lightPrepMs: +st.prepMs.toFixed(1), lightBuildMs: +st.buildMs.toFixed(1) },
      run: { seconds: +elapsed.toFixed(1), frames: n, steps, waypoints: route.length, teleports },
      frame: { workMs: summary(work, n), intervalMs: g, fps: g.median ? +(1000 / g.median).toFixed(1) : 0 },
      step: { ms: summary(stepMs, n), perFrame: n ? +(steps / n).toFixed(2) : 0, note: 'klouzavý průměr času jednoho kroku simulace (120 Hz); sys = totéž po systémech', sys: pr.sys },
      phys: pr.phys,
      calib,
      draw: { ms: summary(drawMs, n), calls: summary(calls, n), tris: summary(tris, n), note: 'ms = jedno vykreslení pohledu včetně grafiky, měřeno dávkou bez čekání na obnovu displeje; workMs ve frame je na skutečné grafice svázané s obnovou displeje a o rezervě nevypovídá' },
      cells: perCell,
    };
  }

  function finish() {
    active = false;
    input.releaseAll();
    const r = result();
    probe.stop();
    E.profile = prevProfile;
    r.verdict = `Vykreslení jednoho snímku (procesor i grafika, bez čekání na displej): medián ${r.draw.ms.median} ms, 95 % ${r.draw.ms.p95} ms. Rozestup snímků: medián ${r.frame.intervalMs.median} ms = ${r.frame.fps} snímků/s, 95 % ${r.frame.intervalMs.p95} ms. Krok simulace ${r.step.ms.median} ms (fyzika ${r.step.sys.phys?.median ?? '?'} ms, z toho uvnitř Rapieru průměrně ${r.phys.rapierMs.step.mean} ms; nespí ${r.phys.awake.median} z ${r.phys.dynamic} volných těles; pevná práce: skript ${r.calib.jsMs} ms, paprsky ${r.calib.raysMs} ms). Obraz ${r.env.image.join(' × ')}, volání nejvýš ${r.draw.calls.max}, △ nejvýš ${r.draw.tris.max}.`;
    if (E.mode === 'playing') E.setMode('paused');
    status(`Měření hotovo. ${r.verdict}\n`);
    const area = document.createElement('textarea');
    area.readOnly = true;
    area.value = JSON.stringify(r);
    area.setAttribute('aria-label', 'Výsledek měření jako JSON');
    area.style.cssText = 'display:block;width:100%;height:70px;margin-top:6px;box-sizing:border-box;background:#11141c;color:#aab2c2;border:1px solid #2a3040;border-radius:4px;font:11px/1.3 ui-monospace,Consolas,monospace';
    const btn = document.createElement('button');
    btn.textContent = 'Zkopírovat výsledek';
    btn.style.cssText = 'margin-top:6px;padding:6px 14px;background:#12352b;color:#fff;border:1px solid #5dcaa5;border-radius:6px;font:inherit;cursor:pointer';
    btn.onclick = async () => {
      area.select();
      try {
        await navigator.clipboard.writeText(area.value);
        btn.textContent = 'Zkopírováno';
      } catch {
        document.execCommand('copy');
        btn.textContent = 'Zkopírováno (označený text)';
      }
    };
    panel.append(area, btn);
    panel.style.pointerEvents = 'auto';
    done?.(r);
    done = null;
  }

  // robot: fáze 'input', aby jeho záměr četl hráč ve stejném kroku
  E.add({
    name: 'bench',
    phase: 'input',
    step(dt) {
      if (!active) return;
      steps++;
      const w = route[idx];
      if (lookLeft > 0) {
        input.turn((360 / LOOK_SECONDS) * dt, 0);
        lookLeft -= dt;
        if (lookLeft <= 0) next();
        return;
      }
      const dx = w.x - player.pos[0];
      const dz = w.z - player.pos[2];
      const dist = Math.hypot(dx, dz);
      if (dist < REACH) {
        arrive();
        return;
      }
      let d = (Math.atan2(-dx, -dz) * 180) / Math.PI - player.yaw;
      d -= Math.round(d / 360) * 360;
      input.turn(Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, d)), 0);
      input.hold('fwd', Math.abs(d) < 50);
      if (dist < bestDist - 0.05) {
        bestDist = dist;
        stuck = 0;
      } else if ((stuck += dt) > STUCK_SECONDS) {
        player.teleport(w.x, w.y, w.z, player.yaw, 0);
        teleports++;
        arrive();
      }
    },
  });

  // měření kolem celého snímku
  const tick = E.tick;
  E.tick = (real) => {
    if (!active) return tick(real);
    const t0 = performance.now();
    const k = tick(real);
    const gl = render.renderer.getContext();
    gl.readPixels(0, 0, 1, 1, 6408, 5121, px); // RGBA, UNSIGNED_BYTE: počká na grafiku
    const t1 = performance.now();
    if (!active) return k; // měření skončilo během tohoto snímku
    // Čas vykreslení bez obnovovací frekvence: stejný pohled několikrát za sebou a jedno čtení bodu (metoda xBench).
    // Jedno čtení po jednom snímku na skutečné grafice čeká na předchozí předání obrazu a ukáže vždy asi 16 ms.
    const calls0 = render.counts.calls;
    const tris0 = render.counts.tris;
    const t2 = performance.now();
    for (let i = 0; i < repeat; i++) render.redraw();
    gl.readPixels(0, 0, 1, 1, 6408, 5121, px);
    const batch = performance.now() - t2;
    const perDraw = batch / repeat;
    if (batch < 12 && repeat < 16) repeat *= 2;
    else if (batch > 40 && repeat > 1) repeat /= 2;
    render.counts.calls = calls0;
    render.counts.tris = tris0;
    elapsed += real;
    if (elapsed > WARMUP_SECONDS && n < MAX_SAMPLES) {
      work[n] = t1 - t0;
      gap[n] = real * 1000;
      stepMs[n] = E.stats.stepMs;
      drawMs[n] = perDraw;
      calls[n] = render.counts.calls;
      tris[n] = render.counts.tris;
      probe.sample();
      cellOf[n] = route[Math.min(idx, route.length - 1)].cell;
      n++;
    }
    if (panel && n % 20 === 0) status(`Měřím skutečnou hru: bod ${Math.min(idx + 1, route.length)} z ${route.length}. Nech tuhle kartu na popředí.`);
    return k;
  };

  return {
    get active() {
      return active;
    },
    /**
     * Spustí měření. opts: { rows, aa, quick }. rows a aa se nastaví jen pro tento běh (neukládají se).
     * Vrací Promise s výsledkem.
     */
    run(opts = {}) {
      if (active) return Promise.reject(new Error('Měření už běží.'));
      if (opts.rows) render.setRows(opts.rows);
      if (opts.aa !== undefined) render.setAntialias(!!opts.aa);
      lock.disable();
      light.incremental = false;
      game.start();
      light.finish();
      openUp();
      game.sim(2); // dveře dojedou, bedny si sednou
      route = plan(!!opts.quick);
      idx = 0;
      n = 0;
      steps = 0;
      repeat = 1;
      elapsed = 0;
      teleports = 0;
      lookLeft = LOOK_SECONDS; // první bod je výchozí místo: začíná rozhlédnutím
      bestDist = Infinity;
      stuck = 0;
      prevProfile = E.profile;
      E.profile = true; // čas kroku po systémech (E.stats.sys)
      calib = probe.calib();
      probe.start();
      active = true;
      status('Měřím skutečnou hru. Nech tuhle kartu na popředí.');
      return new Promise((res) => (done = res));
    },
  };
}
