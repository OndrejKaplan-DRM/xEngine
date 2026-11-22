// Sestavení hry: jádro + systémy v jednom místě. Nezná DOM ani prohlížeč, takže tentýž kód běží ve hře
// (src/app/main.js, vykreslení přes three.js) i v testech v Node (vykreslení bez obrazu, src/render/null.js).
// Level, prefaby ani materiály tu nejsou: všechno přichází v balíku xSpace (pack).

import { createEngine } from '../kernel/index.js';
import { createInput } from '../play/input.js';
import { createPhys } from '../phys/phys.js';
import { createWorld } from '../world/world.js';
import { profileById, PROFILE_IDS } from '../play/profiles.js';

export const VERSION = 'xEngine 0.1 · vlna 1 · 2026-11-22';

/**
 * @param {object} o
 * @param {object} o.pack balík xSpace (po mergePacks): { manifest, materials, prefabs, levels }
 * @param {object} o.render systém vykreslení (createRender nebo createNullRender)
 * @param {() => number} [o.now] hodiny pro měření (ne pro herní logiku)
 */
export function createGame({ pack, render, now }) {
  if (!pack?.levels?.length) throw new Error('Balík neobsahuje žádný level.');
  const E = createEngine(now ? { now } : {});
  const levels = new Map(pack.levels.map((l) => [l.data.id, l.data]));

  const session = {
    levelId: pack.levels[0].data.id,
    /** 'level' = profil určuje level; jinak id profilu vynucené vývojářem. */
    profileChoice: 'level',
    get level() {
      return levels.get(session.levelId);
    },
    get profileId() {
      return session.profileChoice === 'level' ? session.level.profile : session.profileChoice;
    },
    get profile() {
      return profileById(session.profileId);
    },
    setProfile(choice) {
      if (choice !== 'level' && !PROFILE_IDS.includes(choice)) throw new Error(`Neznámý profil „${choice}“.`);
      session.profileChoice = choice;
    },
  };

  const input = createInput();
  const phys = createPhys();
  const world = createWorld({ phys, render, pack });

  /**
   * Načtení levelu: jediné místo, které zná pořadí. Fyzika → statický svět → (entity, spojení, hráč) → sítě → jeden krok.
   * Systémy, které level zajímá, mají load(ctx) a unload().
   */
  const loadOrder = [world];
  let loaded = null;
  function loadLevel(id) {
    if (!levels.has(id)) throw new Error(`Level „${id}“ v balíku není. Známé: ${[...levels.keys()].join(', ')}.`);
    if (loaded) {
      for (let i = loadOrder.length - 1; i >= 0; i--) loadOrder[i].unload?.();
      render.closeLevel();
    }
    session.levelId = id;
    const level = levels.get(id);
    phys.open(session.profile.gravity);
    const ctx = { level, pack, session };
    for (const sys of loadOrder) sys.load?.(ctx);
    render.closeStatic();
    phys.settle();
    loaded = id;
    // dokud není hráč, dívá se kamera z výchozího místa (výška očí z profilu)
    const sp = world.playerSpawn();
    render.setView(sp.pos[0], sp.pos[1] + session.profile.eye, sp.pos[2], ((sp.yaw || 0) * Math.PI) / 180, 0);
  }

  // pořadí běhu určují fáze a závislosti, ne pořadí těchto řádků
  E.add({ name: 'loader', phase: 'input', build: () => loadLevel(session.levelId) });
  E.add(input);
  E.add(phys);
  E.add(world);
  E.add(render);

  /** Čtení stavu pro testy a vývojářský přehled: 'kernel.steps', 'player.pos', 'entity.e_door_lab.joint'. */
  function get(path) {
    const [head, ...rest] = path.split('.');
    if (head === 'kernel') return { mode: E.mode, steps: E.steps, timeScale: E.timeScale, order: E.order() }[rest[0]];
    if (head === 'session') return { level: session.levelId, profile: session.profileId, profileChoice: session.profileChoice }[rest[0]];
    const name = { entity: 'entities', level: 'world' }[head] || head;
    if (!E.has(name)) throw new Error(`get('${path}'): systém „${name}“ neexistuje.`);
    const sys = E.get(name);
    if (typeof sys.inspect !== 'function') throw new Error(`get('${path}'): systém „${name}“ nemá inspect().`);
    return sys.inspect(rest);
  }

  const game = {
    VERSION,
    E,
    pack,
    session,
    input,
    phys,
    world,
    render,
    levelIds: [...levels.keys()],
    get,
    loadLevel,
    /**
     * Kroky bez čekání na skutečný čas (testy, robot). inputs: { hold: ['fwd', 'jump'], yawRate, pitchRate }
     * (stupně za sekundu, kladný yaw = doleva). Držené akce se po doběhnutí uvolní. Vrací počet kroků.
     */
    sim(seconds, inputs = {}) {
      const hold = inputs.hold || [];
      for (const a of hold) input.hold(a, true);
      const n = Math.round(seconds / E.STEP);
      const dyaw = (inputs.yawRate || 0) * E.STEP;
      const dpitch = (inputs.pitchRate || 0) * E.STEP;
      for (let i = 0; i < n; i++) {
        if (dyaw || dpitch) input.turn(dyaw, dpitch);
        E.stepOnce();
      }
      for (const a of hold) input.hold(a, false);
      return n;
    },
    /** Nová hra v daném levelu (výchozí = aktuální). Zámek kurzoru řeší aplikace, ne hra. */
    start(levelId) {
      if (levelId && levelId !== loaded) loadLevel(levelId);
      E.reset();
      if (E.mode !== 'playing') E.setMode('playing');
    },
  };
  return game;
}
