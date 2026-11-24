// Předvolba complex, vybavení ze sad kit_lab a kit_it (Ondřej 24. 11. 2026): laboratoře podle oboru (organická
// chemie, tkáňové kultury, molekulární biologie, analytika, vivárium), serverovna, výpočetní sál, open space a zasedačka.
// Použije se jen se sadou v katalogu (catalog.has); se samotnou kit_base zůstává vybavení z complex.js.
// Jména prefabů jsou ze sad, rozměry generátor bere z katalogu. Laboratoře míchají i stoly a přístroje z kit_base.

export const VARIANT_NAMES = {
  chem: 'Laboratoř organické chemie',
  bio: 'Laboratoř tkáňových kultur',
  mol: 'Laboratoř molekulární biologie',
  anal: 'Analytická laboratoř',
  vivarium: 'Vivárium',
  server: 'Serverovna',
  hpc: 'Výpočetní sál',
  open: 'Open space',
  meet: 'Zasedačka',
};
export const VARIANT_KEYS = { chem: 'chem', bio: 'bio', mol: 'mol', anal: 'anal', vivarium: 'viv', server: 'server', hpc: 'hpc', open: 'open', meet: 'meet' };

/** Sady, které vybavení potřebuje: podle jednoho prefabu z každé. */
export const hasLab = (catalog) => catalog.has('bench_lab_wall_01');
export const hasIt = (catalog) => catalog.has('rack_servers_02');

/** Obor laboratoře, serverovny a kanceláře podle toho, co sada umí. Mění c.variant, u open space i c.role. */
export function refineComplex(cells, catalog, rng) {
  const LAB = hasLab(catalog);
  const IT = hasIt(catalog);
  if (!LAB && !IT) return;
  for (const c of cells) {
    if (c.kind !== 'room') continue;
    if (IT && c.role === 'lab' && c.area >= 36 && rng.chance(0.3)) {
      c.role = 'office';
      c.variant = 'open';
    } else if (LAB && c.role === 'lab') c.variant = rng.weighted([['chem', 3], ['bio', 3], ['mol', 3], ['anal', 2], ...(c.area >= 16 ? [['vivarium', 1]] : [])]);
    else if (IT && c.role === 'tech' && c.area >= 18 && rng.chance(0.45)) c.variant = c.area >= 40 ? 'hpc' : 'server';
    else if (IT && c.role === 'office') c.variant = c.area >= 24 ? 'open' : c.area >= 12 && rng.chance(0.3) ? 'meet' : undefined;
  }
  // serverovna aspoň jedna, když je kam
  if (IT && !cells.some((c) => c.variant === 'server' || c.variant === 'hpc')) {
    const t = cells.filter((c) => c.kind === 'room' && c.role === 'tech' && c.area >= 16).sort((p, q) => q.area - p.area || p.i - q.i)[0];
    if (t) t.variant = t.area >= 40 ? 'hpc' : 'server';
  }
}

// ---- věci na desku: jeden až dva přístroje a drobnosti oboru ---------------------------------------------
const SMALL = {
  chem: ['beaker_250_01', 'beaker_600_01', 'beaker_1000_02', 'flask_erlen_250_01', 'flask_erlen_500_02', 'flask_round_500_01', 'flask_vol_250_01', 'cylinder_grad_100_01', 'cylinder_grad_500_02', 'bottle_chem_500_01', 'bottle_chem_1000_02', 'bottle_chem_2500_01', 'jar_powder_500_01', 'jar_powder_1000_02', 'jar_crystals_01', 'bottle_wash_500_02', 'desiccator_250_01', 'mortar_porcelain_01', 'can_solvent_5l_01', 'stand_burette_01', 'stand_funnel_01', 'watchglass_01'],
  bio: ['rack_conical_50_01', 'rack_conical_15_01', 'box_tips_1000_01', 'box_tips_200_01', 'bottle_buffer_01', 'bottle_buffer_03', 'flask_erlen_250_02', 'petri_03', 'petri_04', 'pipettes_carousel_01', 'bin_tips_01', 'bin_sharps_01', 'box_gloves_01', 'plate_clear_01', 'reservoir_pipetting_01', 'bottle_gl45_500_02', 'pipette_controller_01'],
  mol: ['rack_microtube_01', 'rack_microtube_03', 'box_tips_10_01', 'box_tips_200_01', 'pipettes_linear_01', 'bucket_ice_01', 'plate_pcr_01', 'box_kit_03', 'box_cryo_02', 'vortex_01', 'minicentrifuge_01', 'roll_parafilm_01', 'box_gloves_02', 'bottle_gl45_250_03', 'pipette_multichannel_01', 'lamp_uv_hand_01'],
  anal: ['tray_vials_hplc_01', 'rack_vials_crimp_01', 'bottle_gl45_1000_01', 'bottle_gl45_2000_02', 'bottle_chem_1000_01', 'container_sample_01', 'box_gloves_03', 'beaker_100_01', 'flask_vol_100_01', 'bottle_wash_250_01', 'timer_lab_01'],
  vivarium: ['box_gloves_01', 'bottle_wash_250_04', 'bin_sharps_02', 'container_sample_02', 'box_kit_02'],
};
const MAIN = {
  chem: ['rotavap_01', 'stirrer_hotplate_01', 'stirrer_hotplate_02', 'balance_analytical_01', 'balance_precision_01', 'ph_meter_01', 'pump_vacuum_membrane_01', 'bath_ultrasonic_01', 'stand_distill_01', 'burner_bunsen_01'],
  bio: ['microscope_inverted_01', 'microcentrifuge_01', 'cell_counter_01', 'bath_water_01', 'shaker_orbital_01', 'vortex_02', 'plate_reader_01', 'thermomixer_01', 'microscope_stereo_01', 'microscope_01', 'centrifuge_bench_01'],
  mol: ['thermocycler_01', 'qpcr_01', 'microcentrifuge_cold_01', 'thermomixer_01', 'spectrophotometer_micro_01', 'electrophoresis_horizontal_01', 'power_supply_ep_01', 'gel_doc_01', 'transilluminator_uv_01', 'electroporator_01', 'electrophoresis_vertical_01'],
  anal: ['hplc_stack_01', 'uplc_stack_01', 'gc_01', 'gc_compact_01', 'gcms_01', 'ms_detector_01', 'spectrophotometer_uv_01', 'balance_analytical_01', 'plate_reader_01', 'terminal_desk_01'],
  vivarium: ['cage_ivc_mouse_01', 'cage_ivc_mouse_01', 'cage_ivc_rat_01', 'microscope_stereo_01'],
};

/** Deska stolu: 1 až 2 přístroje a 3 až 6 drobností v náhodném pořadí. */
const deck = (rng, kind, mains = rng.int(1, 2)) => rng.shuffle([...rng.shuffle(MAIN[kind]).slice(0, mains), ...rng.shuffle(SMALL[kind]).slice(0, rng.int(3, 6))]);
const bench = (rng, kind, p) => ({ p, top: deck(rng, kind), ...(rng.chance(0.5) ? { chair: 'stool_lab_01', chairX: 0 } : {}), ...(rng.chance(0.35) ? { over: { p: 'cabinet_wall_glass_01', h: 175 } } : {}) });
const wallBench = (rng, kind) => bench(rng, kind, rng.pick(['bench_lab_wall_01', 'bench_lab_wall_02', 'bench_lab_wall_03']));

/** Fronta laboratoře podle oboru. take(fixed, pool) skládá frontu jako v complex.js. */
export function labPlan(c, rng, take0) {
  const v = c.variant;
  // laboratoř má nábytek po celém obvodu: fronta delší než u kanceláře (kolik se vejde, rozhodne místo u zdí)
  const take = (fixed, pool) => take0(fixed, pool, Math.max(4, Math.min(14, Math.round((c.w + c.d) / 95))));
  const B = (n = 1) => Array.from({ length: n }, () => wallBench(rng, v));
  const big = c.area >= 26;
  const island = big && rng.chance(0.6) ? [{ p: 'bench_lab_island_01', yaw: false, aisle: 0.9, top: deck(rng, v) }] : [];
  const plan = plan0(v);
  return plan && { maxDepth: 125, ...plan };

  function plan0(v) {
  switch (v) {
    case 'chem':
      return {
        walls: take(
          [{ p: 'fumehood_180_01' }, ...B(), { p: 'cabinet_flammable_01' }],
          [...B(3), { p: 'bench_lab_sink_01' }, { p: 'cabinet_corrosive_01' }, { p: 'fumehood_01' }, { p: 'shelf_wire_02' }, { p: 'shower_emergency_01' }, { p: 'reactor_jacketed_20_01' }, { p: 'cylinder_gas_nitrogen_01', chain: 2 }, { p: 'fridge_lab_tall_01' }, { p: 'table_lab_01', top: deck(rng, 'chem', 1), over: { p: 'tap_wall_01', h: 118 } }, { p: 'canister_25_01', chain: 2 }],
        ),
        center: [...island, ...(big && rng.chance(0.5) ? [{ p: 'cart_lab_01' }] : [])],
      };
    case 'bio':
      return {
        walls: take(
          [{ p: 'bsc_class2_120_01' }, { p: 'incubator_co2_stack_01' }, ...B()],
          [...B(3), { p: 'freezer_ult_01' }, { p: 'fridge_lab_glass_01' }, { p: 'bench_lab_sink_01' }, { p: 'autoclave_floor_01' }, { p: 'shaker_incubator_01' }, { p: 'tank_ln2_storage_01' }, { p: 'bsc_class2_180_01' }, { p: 'bin_biohazard_01' }, { p: 'incubator_co2_01' }, { p: 'fridge_lab_01' }, { p: 'bioreactor_steel_50_01' }],
        ),
        center: [...island, ...(big && rng.chance(0.5) ? [{ p: 'cart_lab_01' }] : [])],
      };
    case 'mol':
      return {
        walls: take(
          [...B(), { p: 'freezer_ult_02' }, { p: 'laminar_flow_01' }],
          [...B(3), { p: 'sequencer_floor_01' }, { p: 'fridge_undercounter_01' }, { p: 'freezer_lab_20_01' }, { p: 'shelf_wire_04' }, { p: 'ice_maker_01' }, { p: 'dewar_35l_01' }, { p: 'bench_lab_sink_01' }, { p: 'cabinet_file_01' }, { p: 'bench_lab_wall_03', top: ['liquid_handler_01', ...rng.shuffle(SMALL.mol).slice(0, 2)] }],
        ),
        center: island,
      };
    case 'anal':
      return {
        walls: take(
          [bench(rng, 'anal', 'bench_lab_wall_03'), bench(rng, 'anal', 'bench_lab_wall_02'), { p: 'cylinder_gas_helium_01', chain: 2 }],
          [...B(3), { p: 'cylinder_gas_nitrogen_01' }, { p: 'cylinder_gas_argon_01' }, { p: 'water_ultrapure_01', h: 120 }, { p: 'shelf_wire_02' }, { p: 'cabinet_corrosive_01' }, { p: 'microscope_confocal_01' }, { p: 'fridge_undercounter_01' }, { p: 'terminal_wall_01', h: 135 }],
        ),
        center: big ? [rng.pick([{ p: 'microscope_sem_01', yaw: false, aisle: 0.7 }, { p: 'nmr_magnet_01', aisle: 0.9 }, { p: 'microscope_tem_01', yaw: false, aisle: 0.8 }])] : [],
      };
    case 'vivarium':
      return {
        walls: take(
          [{ p: 'rack_ivc_01' }, bench(rng, 'vivarium', 'bench_lab_wall_02'), { p: 'aquarium_rack_zebrafish_01' }],
          [{ p: 'terrarium_tropical_01' }, { p: 'aquarium_112l_01' }, { p: 'aquarium_270l_01' }, { p: 'cage_rabbit_01' }, { p: 'isolator_glovebox_01' }, { p: 'bin_biohazard_01' }, { p: 'terrarium_desert_01' }, { p: 'passbox_wall_01', h: 90 }, { p: 'aquarium_63l_01' }, { p: 'bench_lab_sink_01' }],
        ),
        center: big && rng.chance(0.5) ? [{ p: 'cart_lab_01' }] : [],
      };
    default:
      return null;
  }
  }
}

// ---- IT ------------------------------------------------------------------------------------------------
const setup = (rng) => rng.pick([['setup_dual_01'], ['setup_single_01', 'phone_01'], ['setup_wide_laptop_01'], ['setup_triple_01'], ['setup_dock_01', 'lamp_desk_01'], ['setup_dev_01'], ['monitor_27_01', 'keyboard_set_01', 'tablet_stand_01'], ['pc_allinone_01', 'keyboard_set_02'], ['laptop_14_01', 'monitor_24_portrait_01']]);
const CHAIRS = ['chair_task_01', 'chair_task_02', 'chair_task_03'];
const seatDesk = (rng, p) => ({ p, top: setup(rng), chair: rng.pick(CHAIRS), chairX: 0 });
const BENCH4 = { seat: 'chair_task_01', seats: [[-0.8, 1.12, 180], [0.8, 1.12, 180], [-0.8, -1.12, 0], [0.8, -1.12, 0]] };
const DESK = { seat: 'chair_task_03', seats: [[0, 0.72, 180]] };
const MEET = { seat: 'chair_task_02', seats: [-0.75, 0, 0.75].flatMap((x) => [[x, 0.92, 180], [x, -0.92, 0]]) };

/** Fronta pro serverovnu, výpočetní sál, open space a zasedačku. */
export function itPlan(c, rng, take) {
  switch (c.variant) {
    case 'server':
      return {
        maxDepth: 125,
        rowsFirst: true,
        rows: [
          { items: ['rack_servers_02', 'rack_servers_02', 'rack_network_01', 'rack_servers_02', 'rack_storage_01', 'cooler_inrow_01'], pairs: true, aisle: 120, wall: 110, end: 90, over: 'tray_cable_01' },
          { items: ['rack_servers_02', 'rack_network_01', 'rack_servers_02', 'rack_storage_01'], aisle: 110, wall: 90, end: 80, over: 'tray_cable_01' },
        ],
        walls: take([{ p: 'cooler_crah_01' }, { p: 'ups_cabinet_01' }], [{ p: 'battery_cabinet_01' }, { p: 'cylinder_fire_gas_01', chain: 2 }, { p: 'rack_servers_01' }, { p: 'rack_open_frame_01' }, { p: 'rack_servers_02', chain: 2 }, { p: 'table_work_01', top: ['laptop_15_01', 'switch_desk_01'] }, { p: 'shelf_rack_01' }, { p: 'reader_card_01', h: 120 }, { p: 'cabinet_door_01' }]),
        ceiling: ['camera_dome_01'],
      };
    case 'hpc':
      return {
        maxDepth: 125,
        rowsFirst: true,
        rows: [
          { items: ['supercomputer_cabinet_01', 'supercomputer_cabinet_02', 'supercomputer_cabinet_01', 'supercomputer_cabinet_02', 'cooler_inrow_01'], pairs: true, aisle: 130, wall: 120, end: 100, over: 'tray_cable_02' },
          { items: ['supercomputer_cabinet_01', 'supercomputer_cabinet_02', 'cooler_inrow_01'], aisle: 120, wall: 100, end: 90, over: 'tray_cable_02' },
        ],
        walls: take([{ p: 'cooler_crah_01', chain: 2 }, { p: 'ups_cabinet_01' }, { p: 'battery_cabinet_01', chain: 2 }], [{ p: 'cylinder_fire_gas_01', chain: 3 }, { p: 'rack_storage_01' }, { p: 'rack_network_01' }, { p: 'reader_card_01', h: 120 }, { p: 'table_work_01', top: ['laptop_16_01'] }]),
        ceiling: ['camera_dome_01'],
      };
    case 'open': {
      const tops = Array.from({ length: 8 }, () => setup(rng));
      return {
        maxDepth: 70,
        rowsFirst: true,
        rows: [
          { items: ['desk_bench4_02', 'desk_bench4_02', 'desk_bench4_01'], aisle: 100, wall: 110, end: 90, ...BENCH4 },
          { items: ['desk_sitstand_01', 'desk_sitstand_02'], pairs: true, aisle: 100, wall: 90, end: 70, tops, ...DESK },
          { items: ['desk_sitstand_01', 'desk_sitstand_02'], aisle: 90, wall: 80, end: 60, tops, ...DESK },
        ],
        walls: take(
          [{ p: 'lockers_staff_01' }, { p: 'whiteboard_wall_01', h: 90 }, { p: 'plant_ficus_01' }],
          [{ p: 'kitchenette_01' }, { p: 'water_cooler_01' }, { p: 'copier_mfp_01' }, { p: 'tv_wall_65_01', h: 110 }, { p: 'panel_acoustic_01', h: 120 }, { p: 'coat_rack_01' }, { p: 'bins_recycling_01' }, { p: 'plant_monstera_01' }, { p: 'cabinet_file_01' }, { p: 'whiteboard_mobile_01' }, { p: 'panel_acoustic_02', h: 120 }, { p: 'plant_snake_01' }],
        ),
        center: rng.chance(0.3) ? [{ p: rng.pick(['beanbag_01', 'beanbag_02']) }] : [],
        ceiling: ['access_point_01'],
      };
    }
    case 'meet':
      return {
        walls: take([{ p: 'tv_wall_65_01', h: 110 }, { p: 'whiteboard_wall_01', h: 90 }], [{ p: 'plant_monstera_01' }, { p: 'panel_acoustic_02', h: 120 }, { p: 'cabinet_door_01' }, { p: 'water_cooler_01' }, { p: 'screen_projection_01', h: 200 }]),
        center: [{ p: c.area >= 22 ? 'table_meeting_400_01' : 'table_meeting_240_01', yaw: false, aisle: 0.35, ...MEET }],
        ceiling: ['projector_ceiling_01'],
      };
    default:
      return null;
  }
}

/** Doplňky ze sad do chodby, haly, skladu a kanceláře (kit_lab: plyn, dusík, regály; kit_it: rostliny, voda, koše). */
export const EXTRA = {
  corridor: (rng, catalog) => (hasIt(catalog) ? [...(rng.chance(0.35) ? [{ p: rng.pick(['plant_snake_01', 'water_cooler_01', 'bins_recycling_01']) }] : [])] : []),
  hall: (rng, catalog) => (hasLab(catalog) ? [{ p: 'cylinder_gas_nitrogen_01', chain: 3 }, { p: 'tank_ln2_storage_01' }, { p: 'shelf_wire_04' }, { p: 'dewar_35l_01' }] : []),
  hallCenter: (rng, catalog) => (hasLab(catalog) ? [{ p: 'cart_lab_01' }, { p: rng.pick(['box_dryice_02', 'can_safety_10l_01']) }] : []),
  store: (rng, catalog, c) => (hasLab(catalog) ? [{ p: 'shelf_wire_02' }, { p: 'shelf_wire_04' }, { p: 'canister_25_01', chain: 2 }, { p: 'sack_25kg_01' }, ...(c.area >= 20 && rng.chance(0.4) ? [{ p: rng.pick(['coldroom_walkin_01', 'freezer_walkin_01']) }] : [])] : []),
  office: (rng, catalog) => (hasIt(catalog) ? { top: setup(rng), chair: rng.pick(CHAIRS) } : null),
};
