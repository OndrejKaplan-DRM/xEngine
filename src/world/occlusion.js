// xWorld: zastínění světla (A1.8) a dveře jako brány vrstev světla.
//
// Zastínění: paprsek Rapieru ze vzorku ke světlu; stíní jen stavba levelu (kvádry, skupina SOLID). Počítá se při
// stavbě vrstev (lightfield.js), za běhu jen jeden paprsek na pohyblivý díl.
// Brána: vede-li volná cesta ze vzorku ke světlu otvorem portálu, který má dveře, svítí vzorek podle otevření
// těch dveří (0 zavřeno, 1 otevřeno). Zavřenými dveřmi tak světlo neprochází a při otevírání přibývá
// (Ondřejova volba 22. 11. 2026). Dveře samy paprsek nezastavují: jejich vliv nese brána.

import { LIGHT_RAY } from '../phys/phys.js';

const NUDGE = 0.03; // m; začátek paprsku se posune ke světlu, aby neležel v rovině sousedního kvádru
const END_GAP = 0.02; // m; paprsek končí těsně před světlem
const EYE_CLEAR = 0.1; // m; světlo sedící na ploše (lampa na stropě) se pro zkoušku odsune takhle daleko od stavby
const SUN_REACH = 400; // m; délka paprsku ke slunci
const INSIDE = 1e-4;
const OPEN_STEP = 1 / 256; // změna otevření dveří menší než tohle se do světla nepropisuje
const AXES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

export function createOcclusion({ phys, light }) {
  let doors = []; // dveře v portálech: { ent, joint, q: quad, n, min, max, open }
  let gateDoors = [[]]; // brána → indexy dveří, kterými cesta vede (brána 0 = žádné)
  let doorGates = []; // dveře → brány, kterých se týkají
  const combo = new Map(); // klíč kombinace dveří → brána
  const crossed = [];
  const stat = { rays: 0, blocked: 0, gated: 0, buried: 0 };

  /** Bod, ke kterému se míří: světlo odsunuté od stavby, aby paprsek nekončil v ploše, na které lampa sedí. */
  function eyeOf(L) {
    if (L.eye) return L.eye;
    const e = [L.pos[0], L.pos[1], L.pos[2]];
    for (const a of AXES) {
      const h = phys.raycast(L.pos[0], L.pos[1], L.pos[2], a[0], a[1], a[2], EYE_CLEAR, LIGHT_RAY);
      if (!h) continue;
      const push = EYE_CLEAR - h.dist;
      e[0] -= a[0] * push;
      e[1] -= a[1] * push;
      e[2] -= a[2] * push;
    }
    L.eye = e;
    return e;
  }

  /** Brána pro úsečku z bodu ke světlu: kterými otvory s dveřmi vede. 0 = žádnými. */
  function crossing(ox, oy, oz, tx, ty, tz) {
    crossed.length = 0;
    const dx = tx - ox;
    const dy = ty - oy;
    const dz = tz - oz;
    for (let i = 0; i < doors.length; i++) {
      const d = doors[i];
      const den = dx * d.n[0] + dy * d.n[1] + dz * d.n[2];
      if (den > -1e-9 && den < 1e-9) continue;
      const t = ((d.q[0] - ox) * d.n[0] + (d.q[1] - oy) * d.n[1] + (d.q[2] - oz) * d.n[2]) / den;
      if (t <= 1e-4 || t >= 1) continue; // bod ležící v rovině otvoru (křídlo dveří) otvorem neprochází
      const x = ox + dx * t;
      const y = oy + dy * t;
      const z = oz + dz * t;
      if (x < d.min[0] || x > d.max[0] || y < d.min[1] || y > d.max[1] || z < d.min[2] || z > d.max[2]) continue;
      crossed.push(i);
    }
    if (!crossed.length) return 0;
    return register(crossed);
  }
  /** Brána pro kombinaci dveří (indexy vzestupně); stejná kombinace = stejná brána. */
  function register(list) {
    const key = list.length === 1 ? list[0] : list.join(',');
    let g = combo.get(key);
    if (g === undefined) {
      g = gateDoors.length;
      gateDoors.push([...list]);
      for (const i of list) doorGates[i].push(g);
      combo.set(key, g);
      light.setGate(g, gateLevel(g));
    }
    return g;
  }
  function gateLevel(g) {
    let k = 1;
    const list = gateDoors[g];
    for (let i = 0; i < list.length; i++) k *= doors[list[i]].open;
    return k;
  }
  /** Otevření dveří 0 až 1 z hodnoty jejich kloubu (podíl dráhy od klidové polohy k dorazu). */
  function openness(d) {
    const j = d.joint;
    if (!j) return 1;
    const span = Math.max(Math.abs(j.def.max - j.rest), Math.abs(j.def.min - j.rest)) || 1;
    return Math.min(1, Math.abs(j.value - j.rest) / span);
  }

  const sys = {
    stat,
    /** Dveře v portálech levelu. Volá se po načtení entit, před stavbou vrstev. */
    load(ctx, entities) {
      doors = [];
      for (const p of ctx.level.portals || []) {
        const ent = p.door ? entities.byId(p.door) : null;
        if (!ent) continue;
        const q = p.quad;
        const u = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]];
        const v = [q[3][0] - q[0][0], q[3][1] - q[0][1], q[3][2] - q[0][2]];
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const len = Math.hypot(n[0], n[1], n[2]) || 1;
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        for (const c of q) {
          for (let k = 0; k < 3; k++) {
            if (c[k] < min[k]) min[k] = c[k];
            if (c[k] > max[k]) max[k] = c[k];
          }
        }
        for (let k = 0; k < 3; k++) {
          min[k] -= 1e-3;
          max[k] += 1e-3;
        }
        const d = { ent, joint: ent.joints[0] || null, q: q[0], n: [n[0] / len, n[1] / len, n[2] / len], min, max, open: 0 };
        d.open = openness(d);
        doors.push(d);
      }
      gateDoors = [[]];
      doorGates = doors.map(() => []);
      combo.clear();
      Object.assign(stat, { rays: 0, blocked: 0, gated: 0, buried: 0 });
    },
    unload() {
      doors = [];
    },

    /**
     * Cesta z bodu (už odsazeného od plochy) ke světlu: −1 zastíněno stavbou, 0 volno, k > 0 jen skrz bránu k.
     */
    gateOf(L, x, y, z) {
      let tx;
      let ty;
      let tz;
      if (L.type === 'sun') {
        const d = L.dir || [0, -1, 0];
        const len = Math.hypot(d[0], d[1], d[2]) || 1;
        tx = x - (d[0] / len) * SUN_REACH;
        ty = y - (d[1] / len) * SUN_REACH;
        tz = z - (d[2] / len) * SUN_REACH;
      } else {
        const e = eyeOf(L);
        tx = e[0];
        ty = e[1];
        tz = e[2];
      }
      const dx = tx - x;
      const dy = ty - y;
      const dz = tz - z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < NUDGE + END_GAP) return 0;
      const ux = dx / dist;
      const uy = dy / dist;
      const uz = dz / dist;
      stat.rays++;
      if (phys.raycast(x + ux * NUDGE, y + uy * NUDGE, z + uz * NUDGE, ux, uy, uz, dist - NUDGE - END_GAP, LIGHT_RAY)) {
        stat.blocked++;
        return -1;
      }
      const g = crossing(x, y, z, tx, ty, tz);
      if (g) stat.gated++;
      return g;
    },
    /** Úsečka mezi dvěma body neprotíná stavbu (dílčí bod okraje stínu leží ve stejném prostoru jako vzorek). */
    reach(x0, y0, z0, x1, y1, z1) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dz = z1 - z0;
      const d = Math.hypot(dx, dy, dz);
      if (d < 1e-6) return true;
      stat.rays++;
      return !phys.raycast(x0, y0, z0, dx / d, dy / d, dz / d, d, LIGHT_RAY);
    },
    /** Bod leží uvnitř stavby nebo přesně na její ploše (vzorek sítě, která pokračuje pod sousední kvádr). */
    buried(x, y, z) {
      const b = !!phys.raycast(x, y, z, 0, 1, 0, INSIDE, LIGHT_RAY);
      if (b) stat.buried++;
      return b;
    },

    /**
     * Brána pro seznam id dveří ze zapečeného souboru (D-044): 0 = prázdný seznam, −1 = některé dveře v levelu nejsou
     * dveřmi portálu (úsek se pak nepoužije).
     */
    gateFor(ids) {
      if (!ids.length) return 0;
      const list = [];
      for (const id of ids) {
        const i = doors.findIndex((d) => d.ent.id === id);
        if (i < 0) return -1;
        if (!list.includes(i)) list.push(i);
      }
      return register(list.sort((a, b) => a - b));
    },

    /** Stav dveří do bran. Volá se před každým vykreslením; bez změny otevření nedělá nic. */
    update() {
      for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        const o = openness(d);
        if (o === d.open || (Math.abs(o - d.open) < OPEN_STEP && o !== 0 && o !== 1)) continue;
        d.open = o;
        const list = doorGates[i];
        for (let k = 0; k < list.length; k++) light.setGate(list[k], gateLevel(list[k]));
      }
    },
    inspect(path) {
      if (path[0] === 'doors') return doors.map((d) => ({ id: d.ent.id, open: d.open }));
      if (path[0] === 'gates') return gateDoors.map((list, g) => ({ gate: g, doors: list.map((i) => doors[i].ent.id), level: gateLevel(g) }));
      return { ...stat };
    },
  };
  return sys;
}
