// xWorld: zásah, poškození, výbuch a zničení (A3.1, zkušební formát N-201, D-053). Vzorce jen ze
// src/xspace/weapon.js (splashFalloff, pushDelta); tady je jen to, komu se co stane:
// - zásah entity s components.health ubere hp, vyšle výstup hit; při hp ≤ 0 výstup destroyed a entitu nahradí
//   trosky breakInto (postavené vypnuté při načtení), nebo zmizí;
// - výbuch poškodí a odhodí všechno v poloměru, kam vede paprsek od středu přes statický svět (kvádry) bez překážky.
// Události nesou sdílené objekty (jako io:fired): posluchač si je nesmí schovat, jen přečíst.

import { splashFalloff, pushDelta, mat4Point } from '../xspace/index.js';
import { groups, GROUP } from '../phys/phys.js';

/** Paprsek krytu: jen statický svět (kvádry levelu). Dveře a bedny výbuch nezastaví (zapsáno v A_STAV). */
const COVER_RAY = groups(GROUP.QUERY, GROUP.SOLID);
const COVER_EPS = 0.02; // m: paprsek krytu končí kousek před cílem
const BREAK_SUFFIX = '~break';

export function createCombat({ phys, entities, behave, materials = {} }) {
  let E = null;
  const stat = { hits: 0, damage: 0, explosions: 0, destroyed: 0, pushed: 0, covered: 0 };
  const hitEvt = { target: null, point: [0, 0, 0], normal: [0, 0, 0], damage: 0, surface: '', weapon: '' };
  const expEvt = { pos: [0, 0, 0], radius: 0, damage: 0, push: 0, weapon: '' };
  const desEvt = { target: '', weapon: '' };
  const noiseEvt = { pos: [0, 0, 0], radius: 0 };
  const c = [0, 0, 0];
  const warned = new Set();
  const warn = (msg) => {
    if (warned.has(msg)) return;
    warned.add(msg);
    console.info(`xWorld combat: ${msg}`);
  };

  /** Bod, ke kterému míří výbuch: těžiště dynamického tělesa, jinak střed obalu prefabu ve světě. */
  function centerOf(ent, out) {
    if (ent.body) {
      const p = ent.body.translation();
      out[0] = p.x;
      out[1] = p.y;
      out[2] = p.z;
      return out;
    }
    const b = ent.prefab.bounds;
    const w = mat4Point(ent.em, [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2]);
    out[0] = w[0];
    out[1] = w[1];
    out[2] = w[2];
    return out;
  }

  function destroy(ent, weapon) {
    stat.destroyed++;
    behave.emit(ent, 'destroyed');
    desEvt.target = ent.id;
    desEvt.weapon = weapon;
    E.emit('combat:destroyed', desEvt);
    const debris = ent.breakEnt;
    if (debris) {
      entities.setEnabled(debris, true);
      entities.placeLike(debris, ent);
    }
    entities.setEnabled(ent, false);
    if (!ent.whole && ent.prefab.parts?.length) warn(`zničená entita ${ent.id} má pevné díly ve statické dávce; zůstanou vidět (zkušební formát, A_STAV)`);
  }

  const sys = {
    name: 'combat',
    phase: 'sim',
    events: ['combat:hit', 'combat:exploded', 'combat:destroyed', 'combat:noise'],
    stat,
    init(engine) {
      E = engine;
    },
    /** Trosky breakInto se postaví vypnuté hned při načtení (entities.addHidden), ať zničení nic nealokuje. */
    load() {
      for (const ent of [...entities.list]) {
        const into = ent.comp.health?.breakInto;
        if (!into || ent.breakEnt) continue;
        const d = ent.def;
        const debris = entities.addHidden({ id: `${d.id}${BREAK_SUFFIX}`, prefab: into, cell: d.cell, pos: d.pos, rot: d.rot, scale: d.scale });
        if (debris) {
          ent.breakEnt = debris;
          debris.breakOf = ent;
        }
      }
    },
    reset() {
      Object.assign(stat, { hits: 0, damage: 0, explosions: 0, destroyed: 0, pushed: 0, covered: 0 });
    },

    /** Poškození entity (bez události zásahu). Vrací true, když entitu zničilo. */
    damage(ent, amount, weapon = '') {
      if (!ent || !ent.comp.health || !ent.state.enabled || !(amount > 0) || ent.state.hp <= 0) return false;
      ent.state.hp -= amount;
      stat.damage += amount;
      behave.emit(ent, 'hit', amount);
      if (ent.state.hp > 0) return false;
      destroy(ent, weapon);
      return true;
    },

    /** Přímý zásah střelou nebo paprskem. ent = zasažená entita, nebo null (svět, materiál mat). */
    hit(ent, point, normal, amount, weapon, mat = null) {
      stat.hits++;
      hitEvt.target = ent ? ent.id : null;
      for (let k = 0; k < 3; k++) {
        hitEvt.point[k] = point[k];
        hitEvt.normal[k] = normal[k];
      }
      hitEvt.damage = ent?.comp.health ? amount : 0;
      hitEvt.surface = ent?.comp.health?.surface || materials[mat]?.surface || '';
      hitEvt.weapon = weapon;
      E.emit('combat:hit', hitEvt);
      if (ent) sys.damage(ent, amount, weapon);
    },

    /** Hluk pro budoucí nepřátele (výstřel, výbuch). */
    noise(pos, radius) {
      if (!(radius > 0)) return;
      noiseEvt.pos[0] = pos[0];
      noiseEvt.pos[1] = pos[1];
      noiseEvt.pos[2] = pos[2];
      noiseEvt.radius = radius;
      E.emit('combat:noise', noiseEvt);
    },

    /**
     * Výbuch v bodě pos: poškození damage a odhození push (m/s) ve středu, k okraji r lineárně k nule. Odhození
     * dostane dynamické těleso jako změnu rychlosti pushDelta (impuls = hmotnost × Δv) ve směru od středu.
     * ignore = entita zasažená přímo: plošné poškození už nedostane (odhození ano).
     */
    explode(pos, r, damage, push, weapon = '', noise = 0, ignore = null) {
      stat.explosions++;
      expEvt.pos[0] = pos[0];
      expEvt.pos[1] = pos[1];
      expEvt.pos[2] = pos[2];
      expEvt.radius = r;
      expEvt.damage = damage;
      expEvt.push = push;
      expEvt.weapon = weapon;
      E.emit('combat:exploded', expEvt);
      sys.noise(pos, noise);
      if (!(r > 0)) return;
      const list = entities.list;
      for (let i = 0; i < list.length; i++) {
        const ent = list[i];
        if (!ent.state.enabled || !(ent.body || ent.comp.health)) continue;
        centerOf(ent, c);
        const dx = c[0] - pos[0];
        const dy = c[1] - pos[1];
        const dz = c[2] - pos[2];
        const d = Math.hypot(dx, dy, dz);
        if (d >= r) continue;
        if (d > COVER_EPS && phys.raycast(pos[0], pos[1], pos[2], dx / d, dy / d, dz / d, d - COVER_EPS, COVER_RAY)) {
          stat.covered++;
          continue; // za zdí: nic
        }
        if (damage > 0 && ent.comp.health && ent !== ignore) sys.damage(ent, damage * splashFalloff(d, r), weapon);
        if (push > 0 && ent.body && ent.state.enabled) {
          const m = ent.body.mass();
          const dv = pushDelta(push, d, r, m);
          if (!(dv > 0)) continue;
          // přesně ve středu výbuchu: nahoru
          const k = d > 1e-6 ? (m * dv) / d : 0;
          entities.impulse(ent, k ? dx * k : 0, k ? dy * k : m * dv, k ? dz * k : 0);
          stat.pushed++;
        }
      }
    },

    inspect(path) {
      if (path[0] === 'stat') return { ...stat };
      return undefined;
    },
  };
  return sys;
}
