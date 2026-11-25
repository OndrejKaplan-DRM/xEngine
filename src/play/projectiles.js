// xPlay: střely zbraní s letem (A3.1, kind projectile). Každá střela je bod s rychlostí; v každém kroku se její
// dráha za krok zkusí paprskem Rapieru (bez hráče, bez spouštěčů). Zásah: přímé poškození + výbuch (splash) v místě
// dopadu, kromě zasažené entity (Quake: přímý zásah nedostane ještě i plošné poškození). Konec doby letu: výbuch,
// má-li střela splash, jinak zánik. Pole bez objektů na střelu; nic se v kroku nealokuje.

import { rampValue, pushDelta } from '../xspace/index.js';
import { SIGHT_RAY } from '../phys/phys.js';

export const PROJECTILES_MAX = 128;
const F = 16; // čísel na střelu
// rozložení záznamu: 0–2 poloha, 3–5 směr, 6 rychlost, 7 věk, 8 doba letu, 9 nabití, 10 index zbraně, 11 režim
// (0 hlavní, 1 druhý), 12 zrychlení, 13 tíže (m/s²), 14 poloměr obrazu, 15 živá
const SURFACE_OFF = 0.02; // m: výbuch kousek před povrchem (paprsek krytu nesmí začít ve zdi)

export function createProjectiles({ phys, combat, player, gravity = () => 9.81 }) {
  const a = new Float64Array(PROJECTILES_MAX * F);
  let n = 0; // živé jsou na začátku pole
  let defs = []; // zbraně podle indexu
  const point = [0, 0, 0];
  const normal = [0, 0, 0];
  const stat = { fired: 0, hits: 0, expired: 0, dropped: 0 };
  const visual = new Float32Array(PROJECTILES_MAX * 4);

  function kill(i) {
    n--;
    if (i !== n) a.copyWithin(i * F, n * F, n * F + F);
    a[n * F + 15] = 0;
  }
  const modeOf = (i) => (a[i * F + 11] ? defs[a[i * F + 10]].alt : defs[a[i * F + 10]].primary);

  /** Výbuch střely i v bodě p (splash z dat zbraně podle nabití). ignore = přímo zasažená entita. */
  function burst(i, p, ignore) {
    const m = modeOf(i);
    const s = m.splash;
    if (!s) return;
    const k = a[i * F + 9];
    combat.explode(p, rampValue(s.radius, k), rampValue(s.damage, k), rampValue(s.push, k) || 0, defs[a[i * F + 10]].id, m.noise || 0, ignore);
  }

  const sys = {
    stat,
    get count() {
      return n;
    },
    /** Zbraně balíku (index = pořadí); střela si pamatuje index. */
    setWeapons(list) {
      defs = list;
    },
    clear() {
      n = 0;
    },
    /** Nová střela z bodu o ve směru d (jednotkový). wi = index zbraně, alt = druhý režim, k = nabití 0–1. */
    spawn(o, d, wi, alt, k) {
      if (n >= PROJECTILES_MAX) {
        stat.dropped++;
        return false;
      }
      const w = defs[wi];
      const m = alt ? w.alt : w.primary;
      const pr = m.projectile;
      const b = n * F;
      a[b] = o[0];
      a[b + 1] = o[1];
      a[b + 2] = o[2];
      a[b + 3] = d[0];
      a[b + 4] = d[1];
      a[b + 5] = d[2];
      a[b + 6] = rampValue(pr.speed, k);
      a[b + 7] = 0;
      a[b + 8] = pr.life;
      a[b + 9] = k;
      a[b + 10] = wi;
      a[b + 11] = alt ? 1 : 0;
      a[b + 12] = pr.accel || 0;
      a[b + 13] = (pr.gravity || 0) * gravity();
      // obraz: hlavní střela 5 cm, nabitá koule od 12 do 30 cm podle nabití (dojem z Arény, odhad)
      a[b + 14] = pr.radius || (alt ? 0.12 + 0.18 * k : 0.05);
      a[b + 15] = 1;
      n++;
      stat.fired++;
      return true;
    },

    step(dt) {
      const ex = player.collider;
      for (let i = n - 1; i >= 0; i--) {
        const b = i * F;
        // rychlost a směr po zrychlení a tíži (vektor rychlosti = směr × rychlost)
        let vx = a[b + 3] * a[b + 6];
        let vy = a[b + 4] * a[b + 6];
        let vz = a[b + 5] * a[b + 6];
        if (a[b + 12]) {
          vx += a[b + 3] * a[b + 12] * dt;
          vy += a[b + 4] * a[b + 12] * dt;
          vz += a[b + 5] * a[b + 12] * dt;
        }
        if (a[b + 13]) vy -= a[b + 13] * dt;
        const sp = Math.hypot(vx, vy, vz) || 1e-9;
        a[b + 3] = vx / sp;
        a[b + 4] = vy / sp;
        a[b + 5] = vz / sp;
        a[b + 6] = sp;
        const len = sp * dt;
        const h = phys.raycast(a[b], a[b + 1], a[b + 2], a[b + 3], a[b + 4], a[b + 5], len, SIGHT_RAY, ex);
        if (h) {
          point[0] = a[b] + a[b + 3] * h.dist;
          point[1] = a[b + 1] + a[b + 4] * h.dist;
          point[2] = a[b + 2] + a[b + 5] * h.dist;
          normal[0] = h.nx;
          normal[1] = h.ny;
          normal[2] = h.nz;
          const ent = h.ref && h.ref.kind === 'entity' ? h.ref.ent : null;
          const m = modeOf(i);
          const k = a[b + 9];
          const w = defs[a[b + 10]];
          combat.hit(ent, point, normal, rampValue(m.damage, k), w.id, h.ref?.mat ?? null);
          // přímé odhození (pole push režimu) do zasaženého dynamického tělesa
          const push = rampValue(m.push, k);
          if (push > 0 && ent?.body && ent.state.enabled) {
            const mass = ent.body.mass();
            const q = mass * pushDelta(push, 0, 1, mass);
            ent.body.applyImpulse(phys.vec(a[b + 3] * q, a[b + 4] * q, a[b + 5] * q), true);
          }
          point[0] += normal[0] * SURFACE_OFF;
          point[1] += normal[1] * SURFACE_OFF;
          point[2] += normal[2] * SURFACE_OFF;
          burst(i, point, ent);
          stat.hits++;
          kill(i);
          continue;
        }
        a[b] += a[b + 3] * len;
        a[b + 1] += a[b + 4] * len;
        a[b + 2] += a[b + 5] * len;
        a[b + 7] += dt;
        if (a[b + 7] >= a[b + 8]) {
          point[0] = a[b];
          point[1] = a[b + 1];
          point[2] = a[b + 2];
          burst(i, point, null);
          stat.expired++;
          kill(i);
        }
      }
    },

    /** Polohy pro obraz: (x, y, z, poloměr) za sebou; vrací počet. */
    visual() {
      for (let i = 0; i < n; i++) {
        visual[i * 4] = a[i * F];
        visual[i * 4 + 1] = a[i * F + 1];
        visual[i * 4 + 2] = a[i * F + 2];
        visual[i * 4 + 3] = a[i * F + 14];
      }
      return [n, visual];
    },
    /** Poloha střely i (testy). */
    pos(i) {
      return i < n ? [a[i * F], a[i * F + 1], a[i * F + 2]] : null;
    },
    snapshot() {
      return { n, a: Array.from(a.subarray(0, n * F)) };
    },
    restore(d) {
      n = Math.min(d?.n || 0, PROJECTILES_MAX);
      a.fill(0);
      if (n) a.set(d.a.slice(0, n * F));
    },
  };
  return sys;
}
