// Předvolba „katakomby“: jedno podlaží chodeb, výklenků, sklepů a krypt s nepravidelnými rozměry.
// Krypty jsou zapuštěné o dva až čtyři stupně; stropy má každá buňka jinak vysoko.
// Ondřejova volba 2 (b) z 22. 11. 2026: strop nikde pod 2,6 m, chodba nikde užší než 1,6 m (pravidla obsahu).
// Délky v centimetrech. Jména prefabů a materiálů jsou ze sady kit_base.

const FIRE = [1, 0.62, 0.32];
const NAMES = { corridor: 'Chodba', niche: 'Výklenek', crypt: 'Krypta', cellar: 'Sklep', chamber: 'Komora' };
const KEYS = { corridor: 'corr', niche: 'niche', crypt: 'crypt', cellar: 'cellar', chamber: 'chamber' };
const MATS = {
  corridor: { floor: 'stone_slab', wall: 'stone_block', ceiling: 'stone_rough' },
  niche: { floor: 'dirt_packed', wall: 'brick_red', ceiling: 'stone_rough' },
  crypt: { floor: 'stone_slab', wall: 'stone_block', ceiling: 'stone_block' },
  cellar: { floor: 'dirt_packed', wall: 'brick_red', ceiling: 'brick_red' },
  chamber: { floor: 'stone_slab', wall: 'stone_rough', ceiling: 'stone_rough' },
};
const torch = (cd, max, spacing) => ({ mount: 'wall', fixture: 'torch_wall_01', height: 160, color: FIRE, cd, range: 7, spacing, max, fallback: true });
const LIGHT = { corridor: torch(9, 3, 700), crypt: torch(12, 3, 400), cellar: torch(8, 1, 900), chamber: torch(9, 1, 900), niche: null };
const pairKey = (a, b) => [a.kind, b.kind].sort().join('+');
const floor10 = (v) => Math.floor(v / 10) * 10;

export const catacombs = {
  id: 'catacombs',
  title: 'Katakomby',
  profile: 'real',
  env: { ambient: [0.03, 0.028, 0.025], exposure: 0.7, fog: { color: [0.01, 0.01, 0.012], density: 0.02 } },
  palette: { core: 'stone_rough', stair: 'stone_slab', gallery: 'stone_slab', platform: 'stone_slab' },
  railings: [],
  button: 'button_round_01',
  lever: 'lever_knife_01',

  params() {
    const riser = 18;
    return {
      T: 20,
      grid: 10,
      floors: 1,
      storeyH: 300,
      plot: { w: [2000, 2600], d: [1800, 2400] },
      hall: null,
      cells: [20, 60],
      roomMin: 200,
      roomMax: 560,
      maxAspect: 3,
      corridorW: [160, 190],
      corridorTrigger: 620,
      corridorChance: 0.85,
      crossTrigger: 900,
      crossChance: 0.6,
      corridorSpread: [0.25, 0.75],
      splitSpread: [0.15, 0.85],
      areaKeep: 7,
      areaSplit: 30,
      minOpen: 90,
      margin: 15,
      minHead: 200,
      maxStep: 80,
      minDoors: 3,
      riser,
      tread: 28,
      classify(cells, ctx, rng) {
        for (const c of cells) {
          const [lo, hi] = [Math.min(c.w, c.d), Math.max(c.w, c.d)];
          if (c.kind === 'corridor' || (lo <= 170 && hi >= 2.5 * lo)) {
            c.kind = 'corridor';
            c.role = 'corridor';
            c.y1 = rng.int(26, 28) * 10;
          } else if (lo <= 240 && c.area <= 8) {
            c.kind = 'niche';
            c.role = 'niche';
            c.y1 = rng.int(26, 27) * 10;
          } else {
            c.role = rng.weighted([['cellar', 3], ['chamber', 2]]);
            c.y1 = rng.int(26, 30) * 10;
          }
        }
        // krypty: dvě až čtyři největší místnosti; zapuštěné o dva až čtyři stupně, první vždy (každý level má schody)
        const rooms = cells.filter((c) => c.kind === 'room').sort((p, q) => q.area - p.area || p.i - q.i);
        rooms.slice(0, rng.int(2, 4)).forEach((c, k) => {
          if (k > 0 && c.area < 10) return;
          c.role = 'crypt';
          c.y1 = rng.int(29, 32) * 10;
          if (k === 0 || (Math.min(c.w, c.d) >= 360 && rng.chance(0.6))) c.y0 = -riser * rng.int(2, 4);
        });
      },
      edgeWeight: (a, b) => ({ 'corridor+corridor': 0, 'corridor+niche': 0.2, 'corridor+room': 1, 'room+room': 1.5, 'niche+room': 2.5, 'niche+niche': 6 })[pairKey(a, b)] ?? 3,
      loopChance: (a, b) => (a.kind === 'niche' || b.kind === 'niche' ? 0 : pairKey(a, b) === 'corridor+corridor' ? 0.35 : 0.12),
      /** Start: chodba nejblíž rohu plochy (vchod do podzemí). */
      pickStart(cells) {
        const pool = cells.some((c) => c.kind === 'corridor') ? cells.filter((c) => c.kind === 'corridor') : cells;
        return [...pool].sort((p, q) => p.min[0] + p.min[1] - (q.min[0] + q.min[1]) || p.i - q.i)[0].i;
      },
    };
  },

  cellKey: (c) => KEYS[c.role],
  cellName: (c) => NAMES[c.role],
  zone: (c) => ({ corridor: 'tunnel', crypt: 'crypt' })[c.role] || 'room_small',
  materials: (c) => MATS[c.role],
  lighting: (c) => LIGHT[c.role],
  enemy: (c) => c.role === 'crypt',
  pillars: (c) => c.role === 'crypt' && c.w >= 520 && c.d >= 520,

  opening(A, B, info, rng, catalog) {
    const free = info.len - 2 * info.margin;
    if (A.kind === 'niche' || B.kind === 'niche') return { kind: 'arch', w: floor10(Math.min(free, 200)), h: 200, center: true };
    if (A.kind === 'corridor' && B.kind === 'corridor') return { kind: 'arch', w: floor10(Math.min(free, 180)), h: 220, center: true };
    if (info.head >= 210 && rng.chance(0.4)) return this.fallbackDoor(catalog);
    return { kind: 'arch', w: 90 + 10 * rng.int(0, Math.min(5, Math.floor((free - 90) / 10))), h: 210 };
  },
  fallbackDoor: (catalog) => ({ kind: 'door', prefab: 'door_plank_01', ...catalog.opening('door_plank_01') }),
  /** Dveře se otevírají do místnosti; úzkou chodbu by křídlo zatarasilo. */
  swingInto: (A, B, rng) => (A.kind !== 'corridor' && B.kind === 'corridor' ? 'a' : B.kind !== 'corridor' && A.kind === 'corridor' ? 'b' : rng.chance(0.5) ? 'a' : 'b'),

  furniture(c, rng) {
    const some = (list, lo, hi) => rng.shuffle(list).slice(0, rng.int(lo, hi));
    switch (c.role) {
      case 'niche':
        return { walls: some([{ p: 'barrel_wood_01' }, { p: 'chest_wood_01' }, { p: 'crate_plank_01' }, { p: 'bench_stone_01' }, { p: 'barrel_wood_01' }], 1, 2), maxDepth: 100 };
      case 'crypt':
        return { walls: [...some([{ p: 'sarcophagus_01' }, { p: 'sarcophagus_01' }, { p: 'sarcophagus_01' }], 1, 3), ...some([{ p: 'chest_wood_01' }, { p: 'bench_stone_01' }, { p: 'bench_stone_01' }], 1, 2)], maxDepth: 110 };
      case 'cellar':
        return { walls: some([{ p: 'barrel_wood_01' }, { p: 'barrel_wood_01' }, { p: 'barrel_wood_01' }, { p: 'crate_plank_01', stack: 'crate_plank_01' }, { p: 'crate_large_01' }, { p: 'chest_wood_01' }, { p: 'barrel_wood_01' }], 3, 6) };
      case 'chamber':
        return { walls: [{ p: 'table_work_01', chair: 'chair_plain_01' }, ...some([{ p: 'bench_stone_01' }, { p: 'chest_wood_01' }, { p: 'cabinet_door_01' }, { p: 'barrel_wood_01' }], 1, 3)] };
      default:
        return null;
    }
  },
};
