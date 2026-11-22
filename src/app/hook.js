// Háček pro testy: window.__xe podle kontraktu (docs/02_KONTRAKTY.md, oddíl 1). Minimum z kontraktu se nesmí
// ubírat; co je navíc, je označené. Testy řídí simulaci, ne snímky: sim() nečeká na skutečný čas.

export function installHook({ game, lock, shell, hud, adapter }) {
  const { E, input, render } = game;
  const xe = {
    ready: true,
    version: game.VERSION,

    // ---- kontrakt
    /** Spustí level bez zámku kurzoru. opts.profile = 'level' | 'arena' | 'real'. */
    start(levelId, opts = {}) {
      lock.disable();
      if (opts.profile) game.session.setProfile(opts.profile);
      game.start(levelId);
      return true;
    },
    /** Kroky bez čekání na skutečný čas. vstupy: { hold: ['fwd', 'jump'], yawRate, pitchRate } (stupně za sekundu). */
    sim: (seconds, inputs) => game.sim(seconds, inputs),
    key: (code, down) => input.key(code, down),
    look: (dx, dy) => input.look(dx, dy),
    use: () => input.use(),
    get: (path) => game.get(path),
    stats() {
      xe.render();
      const m = render.measure();
      const phys = E.has('phys') ? E.get('phys') : null;
      return {
        stepMs: E.stats.stepMs,
        frameMs: E.stats.frameMs,
        calls: m.calls,
        tris: m.tris,
        cells: render.counts.cells,
        bodies: phys ? phys.bodyCount() : 0,
        colliders: phys ? phys.colliderCount() : 0,
        batches: render.counts.batches,
        movers: render.counts.movers,
        lights: render.counts.lights,
        activeLights: render.counts.activeLights,
        sys: { ...E.stats.sys },
      };
    },
    snapshot: () => E.snapshot(),
    restore: (data) => E.restore(data),

    // ---- navíc
    game,
    shell,
    /** Srovná pohled se stavem simulace a překreslí (sim() nevolá frame). */
    render() {
      E.tick(0);
      render.invalidate();
    },
    /** Snímek z plátna ve stejné úloze jako vykreslení. */
    shot() {
      E.tick(0);
      return render.shot();
    },
    /** Snímek z libovolného místa nezávisle na hráči (stupně; kladný yaw = doleva). Nemění stav hry. */
    shotAt(x, y, z, yawDeg = 0, pitchDeg = 0, fov = null) {
      render.setViewFov(fov);
      render.setView(x, y, z, (yawDeg * Math.PI) / 180, (pitchDeg * Math.PI) / 180);
      const m = render.measure();
      const png = render.shot();
      render.setViewFov(null);
      return { png, calls: m.calls, tris: m.tris };
    },
    /** Přenese hráče (nohy) a volitelně natočí pohled ve stupních. */
    tp: (x, y, z, yawDeg, pitchDeg) => game.player.teleport(x, y, z, yawDeg, pitchDeg),
    /** Zapne měření času kroku po systémech (E.stats.sys v milisekundách, klouzavý průměr). */
    profile(on = true) {
      E.profile = on;
      if (on) E.stats.sys = {};
    },
    pause: () => adapter.game.pause(),
    resume: () => adapter.game.resume(),
    quit: () => adapter.game.quit(),
    hud: () => hud.state,
    settings: () => shell.settings.probeAll(),
    lock: () => ({ enabled: lock.enabled, locked: lock.locked }),
  };
  globalThis.__xe = xe;
  return xe;
}
