// Zkušební robot (T5, zkouška A × B). Chodí jen tím, co má hráč: drží „vpřed“, otáčí pohled a mačká „použít“.
// Dveře na cestě si otevírá rukou; když to nejde, najde v datech ovladač (tlačítko, páku), dojde k němu a použije ho.
// Teprve když selže obojí, pošle dveřím vstup přímo a zapíše to jako vynucené otevření.

import { USE_RAY } from '../../src/phys/phys.js';
import { buildNav } from './nav.mjs';

const RAD = Math.PI / 180;
const TICK = 1 / 30; // s; robot rozhoduje třicetkrát za sekundu (4 kroky simulace)
const OPEN = 0.9; // podíl dráhy kloubu, od kterého jsou dveře „otevřené“

export function createRobot(game, { limit = 400, g = 0.05 } = {}) {
  const { player: P, entities, behave, input, phys } = game;
  const level = game.session.level;
  const byId = (id) => entities.byId(id);

  // dveře v portálech a jejich druhá křídla (spojená výstupem opened → open)
  const doorIds = new Set((level.portals || []).map((p) => p.door).filter(Boolean));
  for (const e of level.entities) {
    if (doorIds.has(e.id)) for (const k of e.io || []) if (k.input === 'open' && byId(k.target)?.kind === 'door') doorIds.add(k.target);
  }
  const doors = [...doorIds].map(byId).filter((e) => e && e.kind === 'door' && behave.mainJoint(e));
  const home = new Map(doors.map((e) => [e, entities.center(e.def.id)])); // střed zavřeného křídla
  const frac = (e) => {
    const j = behave.mainJoint(e);
    return Math.abs(j.value - j.rest) / Math.max(Math.abs(j.def.max - j.rest), 1e-6);
  };
  /** Kolize křídel (pohyblivých dílů) dveří; onlyClosed = jen těch, které jsou zavřené. */
  const wings = (onlyClosed) => {
    const s = new Set();
    for (const e of doors) {
      if (onlyClosed && frac(e) >= OPEN) continue;
      for (const c of e.colliders) if (c.parent()) s.add(c.handle);
    }
    return s;
  };

  const stat = { doors: doors.length, hand: 0, actuator: 0, forced: 0, doorFail: [], stuck: 0, simT: 0, maxCalls: 0, stepMs: [], why: '', trail: [] };
  const nav = buildNav(game, { g, skip: wings(false) });
  const AHEAD = Math.round(0.5 / g), WINDOW = Math.round(2.5 / g), HORIZON = Math.round(4.5 / g); // v místech cesty
  const tries = new Map();
  let ticks = 0;

  const tick = (hold, yawRate = 0) => {
    const t0 = performance.now();
    const n = game.sim(TICK, { hold, yawRate });
    stat.stepMs.push((performance.now() - t0) / n);
    stat.simT += TICK;
    if (++ticks % 10 === 0) {
      // v Node neběží snímky, pohled kamery se proto před měřením nastaví ručně (jinak by platil pohled ze startu)
      game.render.setView(P.pos[0], P.pos[1] + P.eyeHeight, P.pos[2], P.yaw * RAD, P.pitch * RAD);
      stat.maxCalls = Math.max(stat.maxCalls, game.render.measure().calls);
      if (ticks % 30 === 0) stat.trail.push([+P.pos[0].toFixed(2), +(P.pos[1] + P.eyeHeight).toFixed(2), +P.pos[2].toFixed(2), +P.yaw.toFixed(1)]); // stopa pro snímky
    }
  };
  const idle = (s) => {
    for (let t = 0; t < s; t += TICK) tick([]);
  };
  const fail = (why) => {
    if (!stat.why) stat.why = `${why}; robot v [${P.pos.map((v) => v.toFixed(2)).join(', ')}], buňka ${game.world.cellAt(P.pos)?.id ?? '?'}`;
    return false;
  };
  const useOn = (ent) => {
    const c = entities.center(ent.def.id);
    P.lookAt(c[0], c[1], c[2]);
    input.use();
    idle(0.15);
  };
  const waitOpen = (ent, s = 6) => {
    for (let t = 0; t < s && frac(ent) < OPEN; t += TICK) tick([]);
    return frac(ent) >= OPEN;
  };

  /** Dojde k ovladači na dosah s přímým výhledem a použije ho. */
  function visitAndUse(act, depth) {
    const c = entities.center(act.def.id);
    const s = nav.nearest(P.pos[0], P.pos[1], P.pos[2]);
    if (s < 0) return false;
    const d = nav.dijkstra(s);
    const cand = [];
    for (let m = 0; m < nav.count; m++) {
      if (!nav.free[m] || !Number.isFinite(d.dist[m])) continue;
      const h = Math.hypot(nav.X[m] - c[0], nav.Z[m] - c[2]);
      if (h > 1.2 || h < 0.45 || Math.abs(nav.Y[m] + P.eyeHeight - c[1]) > 1.2) continue;
      cand.push(m);
    }
    cand.sort((a, b) => d.dist[a] - d.dist[b]);
    for (const m of cand.slice(0, 60)) {
      const ex = nav.X[m], ey = nav.Y[m] + P.eyeHeight, ez = nav.Z[m];
      const len = Math.hypot(c[0] - ex, c[1] - ey, c[2] - ez);
      const hit = phys.raycast(ex, ey, ez, (c[0] - ex) / len, (c[1] - ey) / len, (c[2] - ez) / len, len + 0.3, USE_RAY);
      if (hit?.ref?.ent !== act) continue;
      if (!goTo(m, depth)) return false;
      idle(0.2);
      useOn(act);
      return true;
    }
    return false;
  }

  /** Otevře dveře. Vrací 'here' (robot se nehnul), 'moved' (byl jinde, cestu je třeba přepočítat), 'fail'. */
  function openDoor(ent, depth) {
    const id = ent.def.id;
    const n = (tries.get(id) || 0) + 1;
    tries.set(id, n);
    if (!ent.state.locked && n <= 2) {
      const before = frac(ent);
      useOn(ent);
      idle(0.3);
      if (frac(ent) > before + 0.02 && waitOpen(ent)) {
        stat.hand++;
        return 'here';
      }
    }
    if (depth < 2 && n <= 3) {
      const want = ent.state.locked ? ['unlock'] : ['open', 'toggle'];
      const acts = level.entities
        .filter((e) => !doorIds.has(e.id) && (e.io || []).some((k) => k.target === id && want.includes(k.input)))
        .map((e) => byId(e.id))
        .filter(Boolean);
      for (const act of acts) {
        if (!visitAndUse(act, depth + 1)) continue;
        idle(0.5);
        if (waitOpen(ent, 4)) {
          stat.actuator++;
          return 'moved';
        }
        if (!ent.state.locked) return 'moved'; // odemčeno, ale zavřeno: robot se vrátí a zkusí to rukou
      }
    }
    behave.input(ent, 'unlock');
    behave.input(ent, 'open');
    if (waitOpen(ent)) {
      stat.forced++;
      return 'moved';
    }
    stat.doorFail.push(id);
    fail(`dveře ${id} (${ent.def.prefab}) se neotevřely ani přímým vstupem`);
    return 'fail';
  }

  /** Jde po cestě (indexy míst). Vrací 'done' | 'stuck' | 'replan' | 'fail'. */
  function follow(path, depth) {
    const n = path.length;
    const px = (k) => nav.X[path[k]], py = (k) => nav.Y[path[k]], pz = (k) => nav.Z[path[k]];
    const events = [];
    for (const e of doors) {
      const c = home.get(e);
      for (let k = 0; k < n; k++) {
        if (Math.hypot(px(k) - c[0], pz(k) - c[2]) < 0.75 && Math.abs(py(k) + 1 - c[1]) < 1.5) {
          events.push({ k, e, c });
          break;
        }
      }
    }
    events.sort((a, b) => a.k - b.k);
    let i = 0, quiet = 0, ev = 0;
    for (;;) {
      let best = i, bd = Infinity;
      for (let k = i; k < Math.min(i + WINDOW, n); k++) {
        const dd = Math.hypot(px(k) - P.pos[0], pz(k) - P.pos[2]) + 2 * Math.abs(py(k) - P.pos[1]);
        if (dd < bd) { bd = dd; best = k; }
      }
      if (best > i) { i = best; quiet = 0; } else quiet++;
      if (i >= n - 2 && bd < 0.35) return 'done';
      if (quiet > 90) return 'stuck';
      if (P.pos[1] < nav.y0 - 3) return fail('robot propadl pod level') || 'fail';
      if (stat.simT > limit) return fail(`vypršel čas ${limit} s`) || 'fail';

      let slow = false;
      while (ev < events.length && (events[ev].k < i - AHEAD || frac(events[ev].e) >= OPEN)) ev++;
      if (ev < events.length && events[ev].k <= i + HORIZON) {
        const { e, c } = events[ev];
        const dist = Math.hypot(c[0] - P.pos[0], c[2] - P.pos[2]);
        if (dist < 1.6) {
          idle(0.3);
          const r = openDoor(e, depth);
          if (r === 'fail') return 'fail';
          if (r !== 'here') return 'replan';
          quiet = 0;
          continue;
        }
        slow = dist < 3.2;
      }
      const k = Math.min(i + AHEAD, n - 1);
      const want = Math.atan2(-(px(k) - P.pos[0]), -(pz(k) - P.pos[2])) / RAD;
      const d = ((((want - P.yaw) % 360) + 540) % 360) - 180;
      const speed = Math.hypot(P.vel[0], P.vel[2]);
      tick(Math.abs(d) < 20 && speed < (slow ? 1.5 : 3) ? ['fwd'] : [], Math.max(-600, Math.min(600, d / TICK)));
    }
  }

  /** Dojde na místo target. Vrací true, nebo false s důvodem ve stat.why. */
  function goTo(target, depth = 0) {
    for (let round = 0; round < 40; round++) {
      const s = nav.nearest(P.pos[0], P.pos[1], P.pos[2]);
      if (s < 0) return fail('robot stojí mimo schůdná místa');
      const path = nav.path(nav.dijkstra(s), target);
      if (!path) return fail('cesta k cíli neexistuje');
      const r = follow(path, depth);
      if (r === 'done') return true;
      if (r === 'fail') return false;
      if (r === 'stuck') {
        if (++stat.stuck > 12) return fail('robot uvázl (12× bez postupu)');
        for (let t = 0; t < 10; t++) tick(['back']);
        nav.refresh(P.pos[0], P.pos[2], 3, wings(true)); // otevřená křídla teď stojí jinde než při stavbě mřížky
      }
    }
    return fail('robot se nedostal k cíli ani po 40 přepočtech cesty');
  }

  return { nav, stat, goTo, idle, doors };
}
