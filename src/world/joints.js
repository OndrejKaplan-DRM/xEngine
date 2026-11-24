// xWorld: pohyb kloubu v čase. Kloub je jedno číslo (stupně nebo metry) v mezích z dat; hýbe jím pohon
// k cíli (speed), pružina do klidové polohy (spring, damping), zarážky (detents), nebo ruka hráče (held).
// O dveřích ani tlačítkách tu nic není: co pohyb znamená, říká interakce prefabu (behaviors.js).
// Matice z hodnot kloubů počítá výhradně src/xspace/rig.js.

const EPS = 1e-4;

import { JOINT_TRAVEL_SECONDS } from '../xspace/index.js';

export function makeJoint(def, kind) {
  const range = def.max - def.min;
  return {
    def,
    value: def.rest ?? def.min,
    vel: 0,
    target: NaN, // NaN = bez cíle
    from: def.rest ?? def.min, // odkud pohon vyjel (D-025: sem se vrací, když mu něco stojí v cestě)
    blocked: 0, // jak dlouho pohon stojí o překážku (s)
    pv: 0, // hodnota, cíl a výsledek posledního kroku: entities.step je vrací, když krok zruší
    pt: NaN,
    bits: 0,
    held: false, // drží ho ruka hráče (manipulace): hodnotu nastavuje interakce
    active: false,
    /** Rychlost pohonu a „ruky“ v jednotkách kloubu za sekundu. */
    // bez speed v datech: celý rozsah za dobu podle druhu interakce (kontrakt, N-103)
    speed: def.speed ?? range / (JOINT_TRAVEL_SECONDS[kind] ?? JOINT_TRAVEL_SECONDS.other),
    rest: def.rest ?? def.min,
    /** Normovaná poloha 0–1 (kontrakt: (poloha − min) / (max − min)). */
    get norm() {
      return range > 0 ? (this.value - def.min) / range : 0;
    },
  };
}

export function nearestDetent(def, value) {
  let best = value;
  let gap = Infinity;
  for (const d of def.detents || []) {
    const g = Math.abs(d - value);
    if (g < gap) {
      gap = g;
      best = d;
    }
  }
  return best;
}

/** Výsledek kroku: bity. */
export const MOVED = 1; // hodnota se změnila
export const ARRIVED = 2; // pohon došel k cíli
export const SETTLED = 4; // pružina nebo zarážka kloub ustálila

/**
 * Jeden krok kloubu. Vrací bity MOVED | ARRIVED | SETTLED; j.active říká, jestli má kloub příště zase krokovat.
 */
export function stepJoint(j, dt) {
  const d = j.def;
  const before = j.value;
  let v = before;
  let out = 0;
  if (j.held) {
    j.active = true; // hodnotu mění ruka; kloub čeká na puštění
    j.vel = 0;
    return 0;
  }
  if (!Number.isNaN(j.target)) {
    const delta = j.target - v;
    const max = j.speed * dt;
    if (Math.abs(delta) <= max) {
      v = j.target;
      j.target = NaN;
      j.vel = 0;
      out |= ARRIVED;
    } else {
      v += Math.sign(delta) * max;
      j.vel = Math.sign(delta) * j.speed;
    }
    j.active = Number.isNaN(j.target) ? needsRest(j, v) : true;
  } else if (d.spring > 0) {
    // tlumená pružina, jednotková hmotnost; polo-implicitní Euler je při 120 Hz stabilní do tuhosti asi 10 000
    j.vel += (-d.spring * (v - j.rest) - (d.damping || 0) * j.vel) * dt;
    v += j.vel * dt;
    if (v <= d.min) {
      v = d.min;
      if (j.vel < 0) j.vel = 0;
    } else if (v >= d.max) {
      v = d.max;
      if (j.vel > 0) j.vel = 0;
    }
    if (Math.abs(v - j.rest) < EPS * 10 && Math.abs(j.vel) < 0.02) {
      v = j.rest;
      j.vel = 0;
      j.active = false;
      out |= SETTLED;
    } else j.active = true;
  } else if (d.detents && d.detents.length) {
    const goal = nearestDetent(d, v);
    const max = j.speed * dt;
    if (Math.abs(goal - v) <= max) {
      v = goal;
      j.vel = 0;
      j.active = false;
      out |= SETTLED;
    } else {
      v += Math.sign(goal - v) * max;
      j.active = true;
    }
  } else if (j.vel !== 0) {
    // volný kloub: dojezd s tlumením
    j.vel *= Math.max(0, 1 - (d.damping || 0) * dt);
    v += j.vel * dt;
    if (v <= d.min || v >= d.max || Math.abs(j.vel) < 0.01) {
      v = Math.min(d.max, Math.max(d.min, v));
      j.vel = 0;
      j.active = false;
      out |= SETTLED;
    } else j.active = true;
  } else {
    j.active = false;
  }
  if (v !== before) {
    j.value = v;
    out |= MOVED;
  }
  return out;
}

/** Má kloub po dojetí k cíli ještě práci (pružina ho vrátí, zarážka přitáhne)? */
function needsRest(j, v) {
  const d = j.def;
  if (d.spring > 0) return Math.abs(v - j.rest) > EPS;
  if (d.detents && d.detents.length) return Math.abs(nearestDetent(d, v) - v) > EPS;
  return false;
}
