// Předvolba „komplex“: technický komplex s halou, laboratořemi, kancelářemi, sklady a chodbami.
// Dvě patra spojuje galerie haly se schodištěm; jednopatrová varianta má v hale plošinu s rampou.
// Délky v centimetrech. Jména prefabů a materiálů jsou ze sady kit_base.

import { BODY } from '../body.js';

const WARM = [1, 0.9, 0.75];
const COOL = [0.85, 0.93, 1];
const NAMES = { hall: 'Hala', corridor: 'Chodba', lab: 'Laboratoř', office: 'Kancelář', store: 'Sklad', tech: 'Strojovna' };
const KEYS = { hall: 'hall', corridor: 'corr', lab: 'lab', office: 'office', store: 'store', tech: 'tech' };
const MATS = {
  hall: { floor: 'concrete_smooth', wall: 'concrete_raw', ceiling: 'concrete_dark' },
  corridor: { floor: 'lino_grey', wall: 'plaster_grey', ceiling: 'plaster_light' },
  lab: { floor: 'tile_grey', wall: 'tile_white', ceiling: 'plaster_light' },
  office: { floor: 'lino_grey', wall: 'plaster_light', ceiling: 'plaster_light' },
  store: { floor: 'concrete_smooth', wall: 'plaster_grey', ceiling: 'plaster_grey' },
  tech: { floor: 'metal_floor', wall: 'plaster_green', ceiling: 'plaster_grey' },
};
const LIGHT = {
  hall: { fixture: 'lamp_pendant_01', color: COOL, cd: 140, range: 18, spacing: 600 },
  corridor: { fixture: 'lamp_panel_01', color: WARM, cd: 18, range: 8, spacing: 520 },
  lab: { fixture: 'lamp_panel_01', color: COOL, cd: 22, range: 9, spacing: 420, switch: 'switch_rocker_01' },
  office: { fixture: 'lamp_pendant_01', color: WARM, cd: 11, range: 9, spacing: 450, switch: 'switch_rocker_01' },
  store: { fixture: 'lamp_panel_01', color: WARM, cd: 9, range: 8, spacing: 520, switch: 'switch_rocker_01' },
  tech: { fixture: 'lamp_panel_01', color: COOL, cd: 14, range: 8, spacing: 480, switch: 'switch_rocker_01' },
};
const pairKey = (a, b) => [a.kind, b.kind].sort().join('+');
const door = (catalog, prefab, extra = {}) => ({ kind: 'door', prefab, ...catalog.opening(prefab), ...extra });

export const complex = {
  id: 'complex',
  title: 'Technický komplex',
  profile: 'real',
  env: { ambient: [0.05, 0.055, 0.065], exposure: 0.95, fog: { color: [0.02, 0.02, 0.03], density: 0.004 } },
  palette: { core: 'concrete_raw', stair: 'metal_floor', gallery: 'metal_floor', platform: 'concrete_dark' },
  railings: ['railing_steel_01', 'railing_steel_02'],
  button: 'button_call_01',
  lever: 'lever_knife_01',

  params(o = {}) {
    const floors = o.floors ?? 2;
    const hallH = 560;
    return {
      T: 20,
      grid: 10,
      body: BODY,
      floors,
      storeyH: 300,
      plot: floors > 1 ? { w: [2400, 3000], d: [1900, 2400] } : { w: [3400, 4200], d: [2600, 3200] },
      hall: { w: [1000, 1300], d: [1000, 1200] },
      cells: [20, 60],
      roomMin: 280,
      roomMax: 760,
      maxAspect: 2.2,
      corridorW: [160, 220],
      corridorTrigger: 900,
      corridorChance: 0.8,
      crossTrigger: 1500,
      crossChance: 0.55,
      corridorSpread: [0.35, 0.65],
      splitSpread: [0.3, 0.7],
      areaKeep: 14,
      areaSplit: 38,
      minOpen: 100,
      margin: 25,
      minHead: 220,
      maxStep: 0,
      minDoors: 3,
      galleryW: 160,
      stairW: 120,
      riser: 17,
      tread: 28,
      classify(cells, ctx, rng) {
        for (const c of cells) {
          const [lo, hi] = [Math.min(c.w, c.d), Math.max(c.w, c.d)];
          if (c.kind === 'hall') {
            c.role = 'hall';
            if (!c.tall) c.y1 = c.y0 + hallH;
          } else if (c.kind === 'corridor' || (lo <= 240 && hi >= 2.2 * lo)) {
            c.kind = 'corridor';
            c.role = 'corridor';
            c.y1 = c.y0 + 270;
          } else if (c.area >= 30) c.role = rng.weighted([['lab', 5], ['store', 3], ['tech', 2]]);
          else if (c.area >= 16) c.role = rng.weighted([['lab', 7], ['office', 6], ['store', 4], ['tech', 3]]);
          else c.role = rng.weighted([['store', 9], ['office', 6], ['tech', 5]]);
        }
      },
      edgeWeight: (a, b) => ({ 'corridor+corridor': 0, 'corridor+hall': 0.5, 'corridor+room': 1, 'hall+room': 1.5, 'room+room': 3 })[pairKey(a, b)] ?? 3,
      loopChance: (a, b) => ({ 'corridor+corridor': 0.5, 'corridor+hall': 0.6, 'corridor+room': 0.08, 'hall+room': 0.2, 'room+room': 0.06 })[pairKey(a, b)] ?? 0,
      /** Start: chodba v přízemí co nejdál od haly (cesta do haly je první úkol hráče). */
      pickStart(cells) {
        const hall = cells.find((c) => c.kind === 'hall');
        const far = (c) => Math.abs((c.min[0] + c.max[0]) / 2 - (hall.min[0] + hall.max[0]) / 2) + Math.abs((c.min[1] + c.max[1]) / 2 - (hall.min[1] + hall.max[1]) / 2);
        const ground = cells.filter((c) => c.f === 0 && c.kind !== 'hall');
        const pool = ground.some((c) => c.kind === 'corridor') ? ground.filter((c) => c.kind === 'corridor') : ground;
        return pool.sort((p, q) => far(q) - far(p) || p.i - q.i)[0].i;
      },
    };
  },

  cellKey: (c) => KEYS[c.role],
  cellName: (c) => NAMES[c.role],
  zone: (c) => ({ hall: 'hall', corridor: 'corridor', lab: 'room_tiled' })[c.role] || 'room_small',
  materials: (c) => MATS[c.role],
  lighting: (c) => LIGHT[c.role],
  enemy: (c) => c.role === 'hall',

  /** Styl otvoru mezi dvěma buňkami. */
  opening(A, B, info, rng, catalog) {
    const room = [A, B].find((c) => c.kind === 'room');
    if (!room) {
      // chodba s chodbou nebo s halou: volný průchod bez dveří
      return { kind: 'arch', w: Math.floor(Math.min(info.len - 2 * info.margin, 240) / 10) * 10, h: 240, center: true };
    }
    const other = room === A ? B : A;
    const wide = info.len >= 180 + 2 * info.margin && room.area >= 24;
    if (wide && (room.role === 'store' || other.kind === 'hall') && rng.chance(0.6)) return { kind: 'door', pair: ['door_dleft_01', 'door_dright_01'], ...catalog.opening('door_dleft_01') };
    if (room.role === 'lab' || room.role === 'tech') return rng.chance(0.7) ? door(catalog, 'door_sliding_01', { slide: true }) : door(catalog, 'door_steel_01');
    if (room.role === 'store') return door(catalog, 'door_steel_01');
    return door(catalog, other.role === 'store' || other.role === 'tech' ? 'door_steel_01' : 'door_wood_01');
  },
  fallbackDoor: (catalog) => door(catalog, 'door_steel_01'),
  /** Dveře se otevírají do místnosti, ne do chodby ani do haly. */
  swingInto: (A, B, rng) => (A.kind === 'room' && B.kind !== 'room' ? 'a' : B.kind === 'room' && A.kind !== 'room' ? 'b' : rng.chance(0.5) ? 'a' : 'b'),

  /** Fronta vybavení podle účelu místnosti: první položky jsou jisté, zbytek se losuje podle obvodu. */
  furniture(c, rng) {
    const n = Math.max(3, Math.min(9, Math.round((c.w + c.d) / 190)));
    const take = (fixed, pool) => [...fixed, ...rng.shuffle(pool)].slice(0, n);
    const tops = () => rng.shuffle(['microscope_01', 'centrifuge_bench_01', 'terminal_desk_01', 'microscope_01']).slice(0, 2);
    const crates = () => rng.weighted([[{ p: 'crate_large_01', stack: 'crate_plank_01' }, 3], [{ p: 'crate_large_01' }, 2], [{ p: 'crate_plank_01', stack: 'crate_plank_01' }, 2], [{ p: 'crate_steel_01' }, 2], [{ p: 'barrel_steel_01' }, 3]]);
    switch (c.role) {
      case 'lab':
        return {
          walls: take(
            [{ p: 'table_lab_01', top: tops(), over: { p: 'tap_wall_01', h: 118 } }, { p: 'fumehood_01' }],
            [{ p: 'fridge_lab_01' }, { p: 'cabinet_door_01' }, { p: 'table_lab_01', top: tops() }, { p: 'cabinet_file_01' }, { p: 'shelf_rack_01' }, { p: 'chair_plain_01' }, { p: 'terminal_wall_01', h: 135 }],
          ),
        };
      case 'office':
        return {
          walls: take(
            [{ p: 'desk_office_01', top: ['terminal_desk_01', 'lamp_desk_01'], chair: 'chair_office_01', chairX: -0.15 }, { p: 'cabinet_file_01' }],
            [{ p: 'cabinet_door_01' }, { p: 'shelf_rack_01' }, { p: 'cabinet_file_01' }, { p: 'chair_plain_01' }, { p: 'bench_metal_01' }, { p: 'table_work_01', chair: 'chair_plain_01' }, { p: 'lamp_wall_01', h: 190 }],
          ),
        };
      case 'store':
        return {
          walls: take([{ p: 'shelf_rack_02' }, { p: 'shelf_rack_01' }], [{ p: 'shelf_rack_02' }, { p: 'shelf_rack_01' }, crates(), crates(), crates(), { p: 'crate_steel_01' }, { p: 'barrel_steel_01' }]),
          center: c.area >= 26 ? [crates(), crates()] : [],
        };
      case 'tech':
        return {
          walls: take(
            [{ p: 'valve_gate_01', h: 110 }, { p: 'pipe_double_01', h: 235, chain: 3 }, { p: 'terminal_wall_01', h: 135 }],
            [{ p: 'lever_floor_01' }, { p: 'valve_ball_01', h: 100 }, { p: 'table_work_01' }, { p: 'barrel_steel_01' }, { p: 'cabinet_door_01' }, { p: 'lever_knife_01', h: 140 }, { p: 'pipe_straight_01', h: 235, chain: 2 }, { p: 'button_round_01', h: 125 }],
          ),
        };
      case 'corridor':
        return { walls: [...(rng.chance(0.6) ? [{ p: 'pipe_straight_01', h: 235, chain: 4 }] : []), ...(Math.min(c.w, c.d) >= 200 && rng.chance(0.4) ? [{ p: 'bench_metal_01' }] : [])], maxDepth: 45 };
      case 'hall':
        return {
          walls: take([{ p: 'table_work_01' }, { p: 'terminal_wall_01', h: 135 }, { p: 'shelf_rack_02' }], [crates(), crates(), { p: 'barrel_steel_01' }, { p: 'lever_floor_01' }, { p: 'bench_metal_01' }, { p: 'shelf_rack_01' }, { p: 'valve_gate_01', h: 110 }]),
          center: [crates(), crates(), { p: 'barrel_steel_01' }, crates()],
        };
      default:
        return null;
    }
  },
};
