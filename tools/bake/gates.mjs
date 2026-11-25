// xBake, brány světla: dveře v portálech při zapékání nestíní (D-035). Vede-li volná cesta ze vzorku ke světlu
// otvorem portálu, který má dveře, patří světlo do úseku vrstvy s bránou a běh ho násobí otevřením těch dveří.
// Pravidlo je stejné jako za běhu u sešny A (src/world/occlusion.js): rozhoduje úsečka vzorek → světlo a otvor
// portálu z dat levelu; dveře samy paprsek nezastavují.
//
// Brána = množina dveří, kterými úsečka prošla (obvykle jedny; dvoje, když světlo svítí přes dvě místnosti).
// V souboru je to seznam id entit z pole portal.door; úroveň úseku = součin jejich otevření.

const PLANE_EPS = 1e-4; // bod ležící v rovině otvoru jím neprochází
const QUAD_PAD = 1e-3; // m; rozšíření obalu otvoru kvůli zaokrouhlení
const SAME_SPOT = 0.011; // m; druhé křídlo dvoukřídlých dveří má stejný počátek jako dveře portálu
const SUN_REACH = 400; // m; kam až se míří ke slunci

const isDoor = (pf) => Boolean(pf && pf.components && pf.components.interact && pf.components.interact.kind === 'door');

/**
 * @param level level xSpace
 * @param prefabs Map id → prefab
 * @param on false = brány vypnuté (dveře stíní v klidové poloze jako každý jiný díl; jen pro srovnání)
 */
export function buildGates(level, prefabs, on = true) {
  const doors = []; // { id, q, n, min, max }
  const wings = new Set(); // entity, jejichž pohyblivé kolize přímé světlo nestíní
  if (on) {
    const entById = new Map((level.entities || []).map((e) => [e.id, e]));
    for (const p of level.portals || []) {
      const ent = p.door ? entById.get(p.door) : null;
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
        min[k] -= QUAD_PAD;
        max[k] += QUAD_PAD;
      }
      doors.push({ id: ent.id, portal: p.id, q: q[0], n: [n[0] / len, n[1] / len, n[2] / len], min, max });
      // křídla: dveře portálu a každé další dveře se stejným počátkem (druhé křídlo dvoukřídlých dveří)
      wings.add(ent.id);
      for (const e of level.entities) {
        if (e !== ent && isDoor(prefabs.get(e.prefab)) && [0, 1, 2].every((k) => Math.abs(e.pos[k] - ent.pos[k]) < SAME_SPOT)) wings.add(e.id);
      }
    }
  }
  const gates = [[]]; // brána → indexy dveří; brána 0 = žádné dveře v cestě
  const combo = new Map();
  const crossed = [];

  /** Brána úsečky z bodu (ox, oy, oz) do bodu (tx, ty, tz): 0 = neprochází žádným otvorem s dveřmi. */
  function crossing(ox, oy, oz, tx, ty, tz) {
    if (!doors.length) return 0;
    crossed.length = 0;
    const dx = tx - ox;
    const dy = ty - oy;
    const dz = tz - oz;
    for (let i = 0; i < doors.length; i++) {
      const d = doors[i];
      const den = dx * d.n[0] + dy * d.n[1] + dz * d.n[2];
      if (den > -1e-9 && den < 1e-9) continue;
      const t = ((d.q[0] - ox) * d.n[0] + (d.q[1] - oy) * d.n[1] + (d.q[2] - oz) * d.n[2]) / den;
      if (t <= PLANE_EPS || t >= 1) continue;
      const x = ox + dx * t;
      const y = oy + dy * t;
      const z = oz + dz * t;
      if (x < d.min[0] || x > d.max[0] || y < d.min[1] || y > d.max[1] || z < d.min[2] || z > d.max[2]) continue;
      crossed.push(i);
    }
    if (!crossed.length) return 0;
    const key = crossed.length === 1 ? crossed[0] : crossed.join(',');
    let g = combo.get(key);
    if (g === undefined) {
      g = gates.length;
      gates.push([...crossed]);
      combo.set(key, g);
    }
    return g;
  }

  return {
    doors,
    wings,
    crossing,
    SUN_REACH,
    /** Počet bran, které se zatím objevily (včetně brány 0). */
    count: () => gates.length,
    /** Id entit dveří brány g, v pořadí portálů levelu. */
    ids: (g) => gates[g].map((i) => doors[i].id),
  };
}
