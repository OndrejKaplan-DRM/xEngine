// Sestavení hry: jádro + systémy v jednom místě. Nezná DOM ani prohlížeč, takže tentýž kód běží ve hře
// (src/app/main.js, vykreslení přes three.js) i v testech v Node (vykreslení bez obrazu, src/render/null.js).
// Level, prefaby ani materiály tu nejsou: všechno přichází v balíku xSpace (pack).

import { createEngine } from '../kernel/index.js';
import { createInput } from '../play/input.js';
import { createPlayer } from '../play/player.js';
import { createPhys } from '../phys/phys.js';
import { createWorld } from '../world/world.js';
import { createEntities } from '../world/entities.js';
import { createAssets } from '../world/assets.js';
import { readBake } from '../world/baked.js';
import { decodeBake } from '../xspace/index.js';
import { createIo } from '../world/io.js';
import { createBehaviors } from '../world/behaviors.js';
import { createVisibility } from '../world/visibility.js';
import { createLighting } from '../world/lighting.js';
import { createOcclusion } from '../world/occlusion.js';
import { createInteract } from '../play/interact.js';
import { profileById, PROFILE_IDS } from '../play/profiles.js';

export const VERSION = 'xEngine 0.1 · vlna 2, krok 5 (A02) · 2026-11-24';

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
  const light = createLighting({ render, now });
  const occlusion = createOcclusion({ phys, light });
  light.setOcclusion(occlusion);
  const assets = createAssets(pack); // textury a .glb z pack.files (A2.6)
  const world = createWorld({ phys, render, light, pack, assets });
  const entities = createEntities({ phys, render, world, light, pack, assets });
  const vis = createVisibility({ world, entities, render });
  // před každým vykreslením: které buňky jsou vidět, potom poznamenané změny světla do barev vrcholů
  render.beforeDraw = () => {
    vis.update();
    light.flush();
  };
  const io = createIo({ entities, world });
  const behave = createBehaviors({ entities, io, world });
  entities.behave = behave;
  io.behave = behave;
  const player = createPlayer({ phys, world, render, input, session });
  const interact = createInteract({ phys, player, input, behave, entities, render });
  behave.onPrint = (ent, text) => interact.print(ent, text); // obrazovky patří vrstvě xPlay, svět o nich neví

  /**
   * Načtení levelu: jediné místo, které zná pořadí. Fyzika → světlo (prázdné) → statický svět → (entity, spojení,
   * hráč) → sítě → jeden krok fyziky → vrstvy světla nad hotovými sítěmi.
   * Systémy, které level zajímá, mají load(ctx) a unload().
   */
  const loadOrder = [light, world, entities, vis, io, player, interact];
  let loaded = null;
  let builtBake = true; // s jakou volbou useBake se level postavil
  function loadLevel(id) {
    if (!levels.has(id)) throw new Error(`Level „${id}“ v balíku není. Známé: ${[...levels.keys()].join(', ')}.`);
    if (loaded) {
      for (let i = loadOrder.length - 1; i >= 0; i--) loadOrder[i].unload?.();
      render.closeLevel();
    }
    session.levelId = id;
    const level = levels.get(id);
    phys.open(session.profile.gravity);
    const ctx = { level, pack, session, io };
    for (const sys of loadOrder) sys.load?.(ctx);
    occlusion.load(ctx, entities);
    render.closeStatic();
    phys.settle();
    builtBake = game.useBake;
    if (game.useBake) light.setBake(...readBake({ assets, pack, level, world, entities, occlusion, decodeBake })); // D-044
    else light.setBake(null, 'zapečené světlo vypnuto');
    light.prepare();
    loaded = id;
  }

  // pořadí běhu určují fáze a závislosti, ne pořadí těchto řádků
  E.add({ name: 'loader', phase: 'input', build: () => loadLevel(session.levelId) });
  E.add(input);
  E.add(player);
  E.add(interact);
  E.add(entities);
  E.add(phys);
  E.add(world);
  E.add(vis);
  E.add(light);
  E.add(io);
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
    /** Číst zapečené světlo levelu (D-044), když je v balíku. false = vždy počítat při načtení (srovnání, testy). */
    useBake: true,
    E,
    pack,
    assets,
    session,
    input,
    phys,
    world,
    entities,
    vis,
    light,
    occlusion,
    io,
    behave,
    player,
    interact,
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
      else if (world.lightCell !== world.stat.lightCell || entities.doorsAway !== entities.builtAway || game.useBake !== builtBake) loadLevel(loaded); // jiná mřížka světla, dveře nebo zdroj světla: postavit znovu
      E.reset();
      if (E.mode !== 'playing') E.setMode('playing');
    },
  };
  return game;
}
