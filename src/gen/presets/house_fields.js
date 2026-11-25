// Předvolba house, nové obory laboratoří a kanceláří (Ondřej 25. 11. 2026 v 14:47: „(b) další obory laboratoří
// a kanceláří … dej tam to nové vybavení“): fyzika a optika, elektronika, histologie, materiálové zkoušky; recepce,
// ředitelna, kuchyňka, archiv. Jen v domě: předvolba complex (a s ní levely v gen_demo a měření na T460) zůstává.

export const hasFields = (catalog) => catalog.has('optical_table_01') && catalog.has('reception_desk_01');

export const FIELD_NAMES = {
  phys: 'Laboratoř fyziky a optiky',
  elec: 'Elektronická laboratoř',
  histo: 'Histologická laboratoř',
  mat: 'Laboratoř materiálových zkoušek',
  reception: 'Recepce',
  director: 'Ředitelna',
  kitchenette: 'Kuchyňka',
  archive: 'Archiv',
};
export const FIELD_KEYS = { phys: 'phys', elec: 'elec', histo: 'histo', mat: 'mat', reception: 'recep', director: 'dir', kitchenette: 'kitch', archive: 'arch' };

/** Upřesní obory na laboratorních podlažích domu (po refineComplex): část laboratoří a kanceláří dostane nový obor. */
export function refineFields(cells, catalog, rng) {
  if (!hasFields(catalog)) return;
  const rooms = cells.filter((c) => c.kind === 'room').sort((p, q) => p.i - q.i);
  for (const c of rooms) {
    if (c.role === 'lab' && rng.chance(0.5)) c.variant = rng.pick(['phys', 'elec', 'histo', 'mat']);
    else if (c.role === 'store' && c.area >= 9 && rng.chance(0.4)) c.variant = 'archive';
  }
  // každý nový obor laboratoře aspoň jednou, když je kam
  for (const v of ['phys', 'elec', 'histo', 'mat']) {
    if (rooms.some((c) => c.variant === v)) continue;
    const c = rooms.filter((r) => r.role === 'lab' && !['phys', 'elec', 'histo', 'mat'].includes(r.variant) && rooms.filter((x) => x.variant === r.variant).length > 1).sort((p, q) => q.area - p.area || p.i - q.i)[0];
    if (c) c.variant = v;
  }
  // kanceláře: recepce v přízemí, ředitelna v 1. patře, kuchyňka na každém podlaží s kancelářemi
  const offices = (f) => rooms.filter((c) => c.f === f && c.role === 'office' && (!c.variant || c.variant === 'meet'));
  const recep = offices(0).sort((p, q) => q.area - p.area || p.i - q.i)[0];
  if (recep) recep.variant = 'reception';
  const dir = offices(1).sort((p, q) => q.area - p.area || p.i - q.i)[0];
  if (dir) dir.variant = 'director';
  for (const f of [0, 1]) {
    const k = offices(f).filter((c) => c.area <= 16).sort((p, q) => p.area - q.area || p.i - q.i)[0];
    if (k) k.variant = 'kitchenette';
  }
}

// SMALL na laboratorní stůl u zdi (volná hloubka desky 42 cm), BIG na pracovní stůl nebo optický stůl
const SMALL = {
  phys: ['oscilloscope_01', 'oscilloscope_02', 'function_generator_01', 'power_supply_lab_01', 'multimeter_bench_01', 'lockin_amplifier_01', 'multimeter_hand_01'],
  elec: ['soldering_station_01', 'fume_extractor_01', 'pcb_microscope_01', 'printer_3d_01', 'component_drawers_01', 'oscilloscope_01', 'power_supply_lab_01', 'multimeter_hand_01', 'pcb_holder_01', 'function_generator_01'],
  histo: ['water_bath_sections_01', 'hot_plate_slides_01', 'paraffin_dispenser_01', 'slide_rack_01', 'cassette_box_01', 'microscope_01', 'cassette_box_01'],
  mat: ['hardness_tester_01', 'tensile_specimens_01', 'microscope_stereo_01', 'multimeter_hand_01'],
};
const BIG = {
  phys: ['laser_head_01', 'spectrum_analyzer_01', 'power_supply_lab_01', 'oscilloscope_02'],
  histo: ['microtome_01', 'embedding_station_01', 'slide_stainer_01', 'coverslipper_01'],
  mat: ['polisher_01', 'saw_precision_01', 'furnace_muffle_01', 'press_mounting_01', 'testing_machine_02'],
};
const deck = (rng, v) => rng.shuffle(SMALL[v]).slice(0, rng.int(2, 4));
const big = (rng, v) => rng.shuffle(BIG[v]).slice(0, rng.int(2, 3));
const bench = (rng, v) => ({ p: rng.pick(['bench_lab_wall_01', 'bench_lab_wall_02', 'bench_lab_wall_03']), top: deck(rng, v), ...(rng.chance(0.5) ? { chair: 'stool_lab_01', chairX: 0 } : {}) });
const table = (rng, v) => ({ p: 'table_work_01', top: big(rng, v), ...(rng.chance(0.5) ? { chair: 'stool_lab_01', chairX: 0 } : {}) });
const SETUP = [['setup_single_01', 'phone_01'], ['setup_dual_01'], ['laptop_14_01', 'monitor_24_portrait_01'], ['pc_allinone_01', 'keyboard_set_02']];

/** Fronta vybavení nového oboru (formát jako complex.furniture), nebo null. */
export function fieldPlan(c, rng, take0, catalog) {
  if (!hasFields(catalog)) return null;
  const take = (fixed, pool) => take0(fixed, pool, Math.max(4, Math.min(12, Math.round((c.w + c.d) / 100))));
  const B = (n, v) => Array.from({ length: n }, () => bench(rng, v));
  switch (c.variant) {
    case 'phys': {
      // laserová laboratoř: optické stoly v řadě uprostřed, když se vejdou (napříč ≥ 3,6 m), jinak jeden stůl u zdi
      const ot = rng.pick(['optical_table_02', 'optical_table_01']);
      const row = Math.min(c.w, c.d) >= 362;
      return {
        rowsFirst: true,
        // konce řady 130 cm od zdí: před dveřmi je volný pruh 120 cm
        rows: row ? [{ items: [ot, 'optical_table_01'], tops: ot === 'optical_table_01' ? [big(rng, 'phys')] : [[], big(rng, 'phys')], aisle: 110, wall: 120, end: 130 }, { items: ['optical_table_01'], tops: [big(rng, 'phys')], wall: 100, end: 130 }] : [],
        walls: take([...(row ? [] : [{ p: ot, ...(ot === 'optical_table_01' ? { top: big(rng, 'phys') } : {}) }]), { p: 'rack_instruments_01' }, ...B(1, 'phys'), { p: 'goggles_rack_01', h: 150 }, { p: 'sign_laser_01', h: 190 }], [...B(2, 'phys'), { p: 'vacuum_chamber_01' }, { p: 'cryostat_01' }, { p: 'magnet_electro_01' }, table(rng, 'phys'), { p: 'cabinet_door_01' }, { p: 'shelf_rack_01' }]),
        maxDepth: row ? 85 : 125,
      };
    }
    case 'elec':
      return {
        walls: take([{ p: 'workbench_esd_01', top: deck(rng, 'elec'), chair: 'stool_lab_01', chairX: 0 }, { p: 'cabinet_components_01' }, { p: 'workbench_esd_02', top: deck(rng, 'elec'), chair: 'stool_lab_01', chairX: -0.3 }], [{ p: 'reel_rack_01' }, { p: 'printer_3d_02' }, { p: 'workbench_esd_01', top: deck(rng, 'elec'), chair: 'stool_lab_01', chairX: 0 }, ...B(1, 'elec'), { p: 'shelf_rack_01' }, { p: 'cabinet_file_01' }]),
        maxDepth: 90,
      };
    case 'histo':
      return {
        walls: take([table(rng, 'histo'), { p: 'cryostat_histo_01' }, ...B(1, 'histo'), { p: 'tissue_processor_01' }], [table(rng, 'histo'), ...B(1, 'histo'), { p: 'slide_cabinet_01' }, { p: 'fumehood_01' }, { p: 'bench_lab_sink_01' }, { p: 'fridge_lab_01' }, { p: 'cabinet_flammable_01' }]),
        maxDepth: 125,
      };
    case 'mat':
      return {
        walls: take([{ p: 'testing_machine_01' }, table(rng, 'mat'), { p: 'specimen_cabinet_01' }, ...B(1, 'mat')], [{ p: 'impact_tester_01' }, table(rng, 'mat'), ...B(1, 'mat'), { p: 'shelf_wire_02' }, { p: 'cabinet_door_01' }]),
        maxDepth: 125,
      };
    case 'reception':
      return {
        walls: take([{ p: 'chair_waiting_01' }, { p: 'sign_reception_01', h: 180 }], [{ p: 'magazine_rack_01' }, { p: 'plant_ficus_01' }, { p: 'water_cooler_01' }, { p: 'chair_waiting_01' }, { p: 'plant_monstera_01' }]),
        // pult stojí volně: recepční sedí za ním (−Z), návštěva přichází zepředu (+Z); deska pultu se nezdobí
        center: [rng.chance(0.5) ? { p: 'reception_desk_01', yaw: false, aisle: 0.5, seat: 'chair_task_01', seats: [[0, -0.45, 0]] } : { p: 'reception_desk_02', yaw: false, aisle: 0.5, seat: 'chair_task_01', seats: [[0, -1.08, 0]] }, { p: 'table_low_office_01', aisle: 0.5 }],
        maxDepth: 70,
      };
    case 'director':
      return {
        walls: take([{ p: 'desk_director_01', top: rng.pick(SETUP), chair: 'chair_executive_01', chairX: 0 }, { p: 'cabinet_glass_office_01' }], [{ p: 'sofa_office_01' }, { p: 'plant_monstera_01' }, ...(catalog.has('bookcase_01') ? [{ p: 'bookcase_01' }, { p: 'picture_frame_02', h: 155 }] : []), { p: 'safe_01' }, { p: 'coat_rack_01' }, { p: 'flipchart_01' }]),
        maxDepth: 95,
      };
    case 'kitchenette':
      return {
        walls: take([{ p: 'kitchenette_01' }, { p: 'vending_machine_01' }], [{ p: 'water_cooler_01' }, { p: 'bins_recycling_01' }, { p: 'table_work_01', top: ['coffee_machine_office_01'] }, { p: 'plant_snake_01' }]),
        center: catalog.has('dining_table_round_01') ? [{ p: 'dining_table_round_01', yaw: false, seat: 'chair_dining_03', seats: [[0, 0.8, 180], [0, -0.8, 0], [0.8, 0, -90], [-0.8, 0, 90]] }] : [],
        maxDepth: 85,
      };
    case 'archive':
      return {
        walls: take([{ p: c.area >= 14 ? 'archive_shelf_mobile_02' : 'archive_shelf_mobile_01' }, { p: 'shredder_01' }], [{ p: 'safe_01' }, { p: 'cabinet_file_01' }, { p: 'shelf_rack_01' }, { p: 'table_work_01', top: ['archive_box_row_01'] }, { p: 'archive_shelf_mobile_01' }]),
        maxDepth: 200,
      };
    default:
      return null;
  }
}
