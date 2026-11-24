// Vývojářské pomůcky ve hře: přehled F3 (snímky, čas kroku po systémech, volání kreslení, trojúhelníky, buňka,
// rychlost) a vrstva F4 s obrysy buněk a portálů. Obojí jen čte stav; hru nemění. Text přehledu se skládá
// jednou za čtvrt sekundy, ne v každém snímku.

const REFRESH = 0.25; // s

export function createDev({ game, hud }) {
  const { E, render, vis, player } = game;
  let overlay = false;
  let cells = false;
  let wait = 0;
  let frames = 0;
  let span = 0;
  let fps = 0;
  let linesKey = '';

  const ms = (v) => (v || 0).toFixed(2);
  /** Počty těles a koliderů (A2.3: kolik jich nespí, kolik je kinematických). */
  function bodiesLine() {
    const W = game.phys.world;
    if (!W) return '–';
    let dyn = 0;
    let awake = 0;
    let kin = 0;
    W.bodies.forEach((b) => {
      if (b.isDynamic()) {
        dyn++;
        if (!b.isSleeping()) awake++;
      } else if (b.isKinematic()) kin++;
    });
    return `kolidery ${W.colliders.len()} · volná tělesa ${dyn}, nespí ${awake} · kinematická ${kin}`;
  }
  function text() {
    const c = render.counts;
    const v = player.vel;
    const p = player.pos;
    const sys = Object.entries(E.stats.sys)
      .filter(([, t]) => t >= 0.005)
      .sort((a, b) => b[1] - a[1])
      .map(([name, t]) => `${name} ${ms(t)}`)
      .join(' · ');
    return [
      `${game.VERSION} · level ${game.session.levelId} · profil ${game.session.profileId}`,
      `${fps.toFixed(0)} snímků/s · snímek ${ms(E.stats.frameMs)} ms · krok ${ms(E.stats.stepMs)} ms`,
      `obraz ${render.size[0]} × ${render.size[1]}${render.antialias ? ' · vyhlazování hran' : ''}`,
      `volání ${c.calls} · △ ${c.tris} · buňky ${c.visibleCells}/${c.cells}`,
      `světla ${game.light.stat.lights} · mřížka ${String(game.world.stat.lightCell).replace('.', ',')} m · vzorky světla ${game.light.stat.samples} (okraj stínu ${game.light.stat.softened}) · výpočet vrstev ${ms(game.light.stat.buildMs)} ms${game.light.progress < 1 ? ` · STAVÍ SE ${(game.light.progress * 100).toFixed(0)} %` : ''}`,
      `buňka ${vis.cameraCell ?? '?'} · rychlost ${Math.hypot(v[0], v[2]).toFixed(2)} m/s · poloha ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${p[2].toFixed(1)}`,
      `krok po systémech (ms): ${sys || 'měřím…'}`,
      `fyzika: ${bodiesLine()}`,
    ].join('\n');
  }
  /** Otisk stavu viditelnosti: obrysy se přestaví, jen když se něco změnilo. */
  function stateKey() {
    let k = `${vis.cameraCell}|${render.counts.visibleCells}|`;
    for (const p of vis.portals) k += p.open ? (p.seen ? 's' : 'o') : 'x';
    return k;
  }

  const api = {
    get overlay() {
      return overlay;
    },
    get cells() {
      return cells;
    },
    /** Přehled F3. Zapíná i měření času kroku po systémech (jinak se neměří, aby nic nestálo). */
    setOverlay(on) {
      overlay = on;
      E.profile = on;
      if (on) E.stats.sys = {};
      wait = 0;
      frames = 0;
      span = 0;
      if (!on) hud.setDev('');
    },
    /** Vrstva F4: obrysy buněk a portálů. */
    setCells(on) {
      cells = on;
      linesKey = '';
      if (!on) render.setDebugLines(null);
      else render.invalidate();
    },
    /** Klávesa; vrací true, když ji vývojářská vrstva vzala. */
    key(code) {
      if (code === 'F3') api.setOverlay(!overlay);
      else if (code === 'F4') api.setCells(!cells);
      else return false;
      return true;
    },
    frame(real) {
      if (cells) {
        const k = stateKey();
        if (k !== linesKey) {
          linesKey = k;
          render.setDebugLines(vis.debugLines());
        }
      }
      if (!overlay) return;
      frames++;
      span += real;
      wait -= real;
      if (wait > 0) return;
      wait = REFRESH;
      if (span > 0) fps = frames / span;
      frames = 0;
      span = 0;
      hud.setDev(text());
    },
    text,
  };
  return api;
}
