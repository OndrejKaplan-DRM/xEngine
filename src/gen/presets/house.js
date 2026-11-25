// Předvolba „dům“: dům o čtyřech podlažích (Ondřej 25. 11. 2026 v 14:47: „4 podlažní bytový komplex – horní patra
// byty, dolní patra laboratoře – dej tam to nové vybavení“). Přízemí a 1. patro jsou laboratoře, kanceláře, sklady
// a strojovny jako v předvolbě complex (obory ze sad kit_lab a kit_it), 2. a 3. patro byty ze sady kit_home.
// Na každém podlaží chodba, na konci schodišťová hala přes všechna podlaží. Byt = skupina sousedních místností
// s jedněmi dveřmi do chodby (vstupní místnost); ostatní místnosti bytu se otvírají do sebe.
// Délky v centimetrech.

import { BODY } from '../body.js';
import { makeHouseLayout, sharesWall } from '../layout_house.js';
import { complex } from './complex.js';
import { refineComplex, VARIANT_NAMES, VARIANT_KEYS } from './complex_kits.js';
import { homePlan, HOME_NAMES, HOME_KEYS, homeLight, homeMaterials, hasHome } from './house_home.js';
import { refineFields, fieldPlan, FIELD_NAMES, FIELD_KEYS } from './house_fields.js';
import { yardKeys, yardMaterials, yardLight, yardPlan, yardDecorate, windowAt } from './house_yard.js';

const WARM = [1, 0.9, 0.75];
const LAB_FLOORS = 2; // podlaží 0 a 1 laboratoře, výš byty
const isHome = (c) => c.f >= LAB_FLOORS && !c.tall;
/** Místnost bytu (ne chodba, ne komora domu). */
const isFlat = (c) => isHome(c) && c.kind !== 'corridor' && Boolean(HOME_KEYS[c.role]);
const door = (catalog, prefab, extra = {}) => ({ kind: 'door', prefab, ...catalog.opening(prefab), ...extra });

/** Byty na podlaží f: skupiny sousedních místností, každá s jednou vstupní místností u chodby. */
function apartments(cells, f, T, rng) {
  const need = 160;
  const rooms = cells.filter((c) => c.f === f && c.kind === 'room').sort((p, q) => p.i - q.i);
  const corr = cells.find((c) => c.f === f && c.kind === 'corridor');
  const mid = (c) => (c.min[0] + c.max[0]) / 2;
  const front = rooms.filter((r) => sharesWall(r, corr, T, need)).sort((p, q) => mid(p) - mid(q) || p.i - q.i);
  let n = 0;
  const groups = [];
  for (const r of front) {
    if (r.apt) continue;
    const id = `${f}_${++n}`;
    const g = [r];
    r.apt = id;
    r.entry = true;
    let area = r.area;
    const target = rng.int(45, 85);
    const queue = [r];
    while (queue.length && area < target && g.length < 5) {
      const x = queue.shift();
      for (const y of rooms) {
        if (y.apt || !sharesWall(x, y, T, need) || area + y.area > 110) continue;
        y.apt = id;
        g.push(y);
        area += y.area;
        queue.push(y);
        if (area >= target || g.length >= 5) break;
      }
    }
    groups.push(g);
  }
  // místnosti bez přístupu z chodby přidej k sousednímu bytu
  for (const y of rooms) {
    if (y.apt) continue;
    const g = groups.find((gg) => gg.some((r) => sharesWall(r, y, T, need)));
    if (g) {
      y.apt = g[0].apt;
      g.push(y);
    } else y.role = 'store'; // komora přístupná jen ze schodiště nebo z laboratoře: sklep domu, ne byt
  }
  return groups;
}

/** Účel místností bytu podle velikosti: vstup, koupelna, obývák, kuchyň, ložnice, dětský pokoj, pracovna. */
function rolesOf(g, rng) {
  const entry = g.find((c) => c.entry) || g[0];
  const others = g.filter((c) => c !== entry).sort((p, q) => p.area - q.area || p.i - q.i);
  if (!others.length) {
    // samostatná místnost s vlastním vchodem je garsoniéra; zbylá bez vchodu z chodby patří k sousednímu bytu
    entry.role = entry.entry ? 'studio' : rng.pick(['study', 'bedroom']);
    return;
  }
  if (others.length === 1) {
    entry.role = 'living';
    entry.kitchenette = true;
    others[0].role = others[0].area < 10 ? 'bath' : 'bedroom';
    return;
  }
  entry.role = entry.area <= 12 ? 'hallway' : 'living';
  let rest = others.slice();
  rest.shift().role = 'bath';
  let living = entry.role === 'living' ? entry : null;
  if (!living && rest.length) {
    living = rest.pop();
    living.role = 'living';
  }
  if (rest.length && living.area < 24) rest.shift().role = 'kitchen';
  else living.kitchenette = true;
  rest.forEach((c, k) => (c.role = k === 0 ? 'bedroom' : rng.pick(['kids', 'bedroom', 'study'])));
}

// místnosti domu jsou menší než v komplexu (dělí se s byty): laboratoř už od 12 m²
const LAB_ROLE = (c, area, rng) => {
  if (area >= 24) return rng.weighted([['lab', 6], ['office', 2], ['store', 1], ['tech', 1]]);
  if (area >= 12) return rng.weighted([['lab', 6], ['office', 4], ['store', 2], ['tech', 1]]);
  return rng.weighted([['office', 4], ['store', 4], ['tech', 3], ['lab', 2]]);
};

export const house = {
  id: 'house',
  title: 'Dům: laboratoře a byty',
  profile: 'real',
  // noc: barva mlhy je i barva nebe nad nádvořím a za okny
  env: { ambient: [0.05, 0.05, 0.055], exposure: 0.95, fog: { color: [0.025, 0.035, 0.065], density: 0.003 } },
  palette: { core: 'concrete_raw', stair: 'concrete_smooth', gallery: 'concrete_smooth', platform: 'concrete_dark' },
  railings: ['railing_steel_01', 'railing_steel_02'],
  button: 'button_call_01',
  lever: 'lever_knife_01',
  core: 'stairs',
  layout: makeHouseLayout,

  params(o = {}) {
    const floors = o.floors ?? 4;
    return {
      T: 20,
      grid: 10,
      body: BODY,
      floors,
      storeyH: 300,
      plot: { w: [2800, 3400], d: [1500, 1700] },
      core: { w: [1020, 1120], d: [760, 820] },
      cells: [24, 110],
      corridorW: [180, 220],
      corridorShift: 60,
      roomMin: 280,
      roomMax: 620,
      maxAspect: 2.0,
      splitSpread: [0.35, 0.65],
      areaKeep: 12,
      areaSplit: 30,
      minOpen: 100,
      margin: 25,
      minHead: 210,
      maxStep: 70, // vchod z nádvoří: o yardDrop níž, schody v nádvoří
      minDoors: 3,
      galleryW: 160,
      stairW: 150,
      soffit: 30, // stupně jako deska pod nášlapem, pod prvním ramenem je místo
      yard: [450, 600],
      yardChunk: 900,
      yardDrop: 68,
      riser: 17,
      tread: 28,
      classify(cells, ctx, rng) {
        for (const c of cells) {
          if (c.kind === 'yard') c.role = 'yard';
          else if (c.kind === 'hall') c.role = 'stair';
          else if (c.kind === 'corridor') {
            c.role = 'corridor';
            c.y1 = c.y0 + 270;
          } else if (!isHome(c)) c.role = LAB_ROLE(c, c.area, rng);
        }
        for (let f = LAB_FLOORS; f < floors; f++) for (const g of apartments(cells, f, ctx.T, rng.fork(`apt${f}`))) rolesOf(g, rng);
      },
      edgeWeight(a, b) {
        const [x, y] = [a, b];
        if (x.kind === 'yard' || y.kind === 'yard') return x.kind === y.kind ? 0 : 0.05; // nádvoří spolu, vchod do haly
        const stair = [x, y].find((c) => c.role === 'stair');
        if (stair) return (stair === x ? y : x).kind === 'corridor' ? 0.1 : 100;
        const corr = [x, y].find((c) => c.kind === 'corridor');
        if (corr) {
          const room = corr === x ? y : x;
          return room.apt ? (room.entry ? 1 : 60) : 1;
        }
        if (x.apt || y.apt) return x.apt === y.apt ? 0.5 : 200;
        return 3;
      },
      loopChance(a, b) {
        if (a.role === 'stair' || b.role === 'stair' || a.kind === 'yard' || b.kind === 'yard') return 0;
        const corr = [a, b].find((c) => c.kind === 'corridor');
        if (corr) return (corr === a ? b : a).apt ? 0 : 0.08;
        if (a.apt || b.apt) return a.apt === b.apt && a.role !== 'bath' && b.role !== 'bath' ? 0.15 : 0;
        return 0.06;
      },
      windowAt: (c, s) => windowAt(c, s, isHome, isFlat),
      /** Start: nádvoří před vchodem (u schodišťové haly); bez nádvoří přízemní chodba. */
      pickStart: (cells, ctx) => (cells.find((c) => c.kind === 'yard' && c.side === (ctx.core.hi ? 'e' : 'w') && c.min[1] < ctx.core.z[1] && c.max[1] > ctx.core.z[0]) || cells.find((c) => c.f === 0 && c.kind === 'corridor')).i,
    };
  },

  /** Obory laboratoří a kanceláří jako v předvolbě complex, jen na laboratorních podlažích. */
  refine(cells, catalog, rng) {
    const labs = cells.filter((c) => !isHome(c));
    refineComplex(labs, catalog, rng);
    refineFields(labs, catalog, rng.fork('fields'));
  },
  cellKey: (c) => (c.kind === 'yard' ? yardKeys(c) : c.role === 'stair' ? 'stair' : isFlat(c) ? HOME_KEYS[c.role] : FIELD_KEYS[c.variant] || VARIANT_KEYS[c.variant] || complex.cellKey(c)),
  cellName: (c) => (c.kind === 'yard' ? 'Nádvoří' : c.role === 'stair' ? 'Schodiště' : isFlat(c) ? HOME_NAMES[c.role] : c.kind === 'corridor' && isHome(c) ? 'Chodba k bytům' : FIELD_NAMES[c.variant] || VARIANT_NAMES[c.variant] || complex.cellName(c)),
  zone: (c) => (c.kind === 'yard' ? 'outdoor' : c.role === 'stair' ? 'hall' : c.kind === 'corridor' ? 'corridor' : isFlat(c) ? (c.role === 'bath' ? 'room_tiled' : 'room_small') : complex.zone(c)),
  materials: (c) => (c.kind === 'yard' ? yardMaterials(c) : c.role === 'stair' ? { floor: 'concrete_smooth', wall: 'plaster_grey', ceiling: 'plaster_light' } : isFlat(c) || (isHome(c) && c.kind === 'corridor') ? homeMaterials(c) : complex.materials(c)),
  lighting: (c) => (c.kind === 'yard' ? yardLight(c) : c.role === 'stair' ? { fixture: null, color: WARM, cd: 40, range: 12, spacing: 520, perFloor: 270 } : isFlat(c) || (isHome(c) && c.kind === 'corridor') ? homeLight(c) : complex.lighting(c)),
  enemy: () => false,

  /** Otvory: do schodiště průchod, do bytu dveře, uvnitř bytu dveře nebo průchod, laboratoře jako complex. */
  opening(A, B, info, rng, catalog) {
    // vchod z nádvoří do schodišťové haly: dvoukřídlé dveře uprostřed
    if (A.kind === 'yard' || B.kind === 'yard') return { kind: 'door', pair: ['door_dleft_01', 'door_dright_01'], ...catalog.opening('door_dleft_01'), center: true };
    const stair = [A, B].find((c) => c.role === 'stair');
    if (stair) return { kind: 'arch', w: Math.floor(Math.min(info.len - 2 * info.margin, 200) / 10) * 10, h: 240, center: true };
    const apt = [A, B].find((c) => c.apt);
    if (apt) {
      const other = apt === A ? B : A;
      if (other.kind === 'corridor') return door(catalog, 'door_wood_01');
      if (A.role === 'bath' || B.role === 'bath') return door(catalog, 'door_wood_01');
      if (info.len >= 140 + 2 * info.margin && rng.chance(0.35)) return { kind: 'arch', w: 120, h: 210, center: true };
      return door(catalog, 'door_wood_01');
    }
    return complex.opening(A, B, info, rng, catalog);
  },
  fallbackDoor: (catalog) => door(catalog, 'door_wood_01'),
  swingInto: (A, B, rng) => (A.kind === 'room' && B.kind !== 'room' ? 'a' : B.kind === 'room' && A.kind !== 'room' ? 'b' : A.role === 'bath' ? 'a' : B.role === 'bath' ? 'b' : rng.chance(0.5) ? 'a' : 'b'),

  /** Pod prvním ramenem schodiště (od horního konce): kola, kočárek, regál, koše na tříděný odpad. */
  underStairs: ['shelf_rack_01', 'bike_01', 'stroller_01', 'bins_recycling_01'],
  decorate: (b, S, plan, catalog, rng) => yardDecorate(b, S, plan, catalog, rng),

  furniture(c, rng, catalog) {
    if (c.kind === 'yard') return yardPlan(c, rng, catalog);
    // schodiště v přízemí: schránky na dopisy u vchodu, lavička
    if (c.role === 'stair') return { walls: [...(catalog.has('mailbox_unit_01') ? [{ p: 'mailbox_unit_01', h: 130 }] : []), { p: 'bench_metal_01' }, ...(catalog.has('plant_floor_home_02') ? [{ p: 'plant_floor_home_02' }] : [])], maxDepth: 60 };
    // chodba k bytům: rostlina, schránky v prvním bytovém podlaží, kolo nebo kočárek u zdi
    if (isHome(c) && c.kind === 'corridor') return { walls: hasHome(catalog) ? [{ p: 'plant_floor_home_01' }, { p: rng.pick(['bike_01', 'stroller_01']) }] : [], center: hasHome(catalog) ? [{ p: 'doormat_01', atDoors: (o) => Boolean(o.entry) }] : [], underWindows: { p: 'radiator_01', h: 15 }, maxDepth: 52 };
    if (isFlat(c)) return { underWindows: { p: 'radiator_01', h: 15 }, ...homePlan(c, rng, catalog) };
    const field = FIELD_NAMES[c.variant] && fieldPlan(c, rng, (fixed, pool, k) => [...fixed, ...rng.shuffle(pool)].slice(0, k), catalog);
    return field || complex.furniture(c, rng, catalog);
  },
};
