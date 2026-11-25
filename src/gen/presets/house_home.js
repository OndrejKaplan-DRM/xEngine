// Předvolba house, vybavení bytů ze sady kit_home (Ondřej 25. 11. 2026 v 14:47: „dej tam to nové vybavení“).
// Účel místnosti bytu (předsíň, obývák, kuchyň, ložnice, dětský pokoj, pracovna, koupelna, garsoniéra) určuje
// house.js podle velikosti; tady je fronta nábytku ke zdem, věci do plochy a na desky, světla a povrchy místnosti.
// Bez sady kit_home zůstanou byty prázdné (generátor jen postaví místnosti).

export const hasHome = (catalog) => catalog.has('sofa_3_01');

export const HOME_NAMES = { hallway: 'Předsíň', living: 'Obývací pokoj', kitchen: 'Kuchyň', bedroom: 'Ložnice', kids: 'Dětský pokoj', study: 'Pracovna', bath: 'Koupelna', studio: 'Garsoniéra' };
export const HOME_KEYS = { hallway: 'hallway', living: 'living', kitchen: 'kitchen', bedroom: 'bedroom', kids: 'kids', study: 'study', bath: 'bath', studio: 'studio' };

const WARM = [1, 0.88, 0.72];
const COOL = [0.9, 0.95, 1];
const PAINT = ['wall_paint_warm', 'wall_paint_sage', 'wall_paint_blue', 'wall_paint_white'];
const aptNo = (c) => [...String(c.apt || c.i)].reduce((s, ch) => s + ch.charCodeAt(0), 0);

/** Povrchy místnosti bytu (a chodby k bytům): malba podle bytu, parkety, dlažba v koupelně a kuchyni. */
export function homeMaterials(c) {
  if (c.kind === 'corridor') return { floor: 'floor_carpet_grey', wall: 'wall_paint_warm', ceiling: 'plaster_light' };
  if (c.role === 'bath') return { floor: 'floor_tile_bath', wall: 'wall_tile_bath', ceiling: 'plaster_light' };
  if (c.role === 'kitchen') return { floor: 'tile_grey', wall: 'wall_paint_white', ceiling: 'plaster_light' };
  if (c.role === 'hallway') return { floor: 'floor_parquet_light', wall: 'wall_paint_white', ceiling: 'plaster_light' };
  const wall = PAINT[(aptNo(c) + (c.role === 'kids' ? 1 : c.role === 'bedroom' ? 2 : 0)) % PAINT.length];
  return { floor: aptNo(c) % 2 ? 'floor_parquet' : 'floor_parquet_light', wall, ceiling: 'plaster_light' };
}

/** Světla bytu: závěsné svítidlo s vypínačem, v koupelně panel; chodba k bytům panely bez vypínače. */
export function homeLight(c) {
  if (c.kind === 'corridor') return { fixture: 'lamp_panel_01', color: WARM, cd: 14, range: 8, spacing: 520 };
  if (c.role === 'bath') return { fixture: 'lamp_panel_01', color: COOL, cd: 14, range: 6, spacing: 400, switch: 'switch_rocker_01' };
  return { fixture: 'lamp_pendant_01', color: WARM, cd: c.role === 'hallway' ? 8 : 12, range: 8, spacing: 420, switch: 'switch_rocker_01' };
}

const SOFAS = ['sofa_3_01', 'sofa_3_02', 'sofa_3_03', 'sofa_3_04', 'sofa_3_05', 'sofa_2_01', 'sofa_2_02'];
const PLANTS = ['plant_floor_home_01', 'plant_floor_home_02', 'plant_floor_home_03', 'plant_floor_home_04'];
const PICTURES = ['picture_frame_01', 'picture_frame_02', 'picture_frame_03'];
const DECOR = ['vase_01', 'vase_02', 'vase_03', 'books_stack_01', 'candles_01', 'photo_frame_01', 'plant_pot_small_01'];
const KITCHEN_TOPS = ['kettle_01', 'coffee_maker_01', 'microwave_01', 'toaster_01', 'knife_block_01', 'cutting_board_01', 'dish_rack_01', 'bread_box_01', 'pot_01', 'pan_01', 'plates_stack_01', 'bottle_wine_01', 'bowl_fruit_01'];
// stůl se židlemi stojí rovnoběžně se zdmi (yaw: false): obaly natočených kusů by se kontrole zdály v sobě
const four = (w, d, chair) => ({ yaw: false, seat: chair, seats: [[-w / 4, d / 2 + 0.3, 180], [w / 4, d / 2 + 0.3, 180], [-w / 4, -d / 2 - 0.3, 0], [w / 4, -d / 2 - 0.3, 0]] });
const round = (r, chair) => ({ yaw: false, seat: chair, seats: [[0, r + 0.25, 180], [0, -r - 0.25, 0], [r + 0.25, 0, -90], [-r - 0.25, 0, 90]] });

/** Fronta vybavení místnosti bytu (formát jako complex.furniture). */
export function homePlan(c, rng, catalog) {
  if (!hasHome(catalog)) return null;
  const n = Math.max(3, Math.min(9, Math.round((c.w + c.d) / 170)));
  const take = (fixed, pool, k = n) => [...fixed, ...rng.shuffle(pool)].slice(0, k);
  const pick = (list) => rng.pick(list);
  const decor = (k) => rng.shuffle(DECOR).slice(0, k);
  const color = rng.int(1, 3);
  const line = () => ({ p: `kitchen_line_${c.area >= 12 ? '240' : '180'}_0${color}`, top: rng.shuffle(KITCHEN_TOPS).slice(0, rng.int(3, 5)) });
  const art = () => ({ p: pick(PICTURES), h: 155 });
  const fruit = () => (rng.chance(0.5) ? { top: ['bowl_fruit_01'] } : {});
  const dining = (small) => (small ? { p: 'dining_table_round_01', ...round(0.55, pick(['chair_dining_01', 'chair_dining_02', 'chair_dining_03'])), ...fruit() } : { p: pick(['dining_table_4_01', 'dining_table_6_01']), ...four(1.4, 0.8, pick(['chair_dining_01', 'chair_dining_02', 'chair_dining_03'])), ...fruit() });
  // kuchyňský ostrůvek s barovými židlemi na straně do místnosti (+Z), mimo obal ostrůvku
  const island = () => ({ p: 'kitchen_island_01', yaw: false, aisle: 0.7, top: rng.shuffle(['bowl_fruit_01', 'cutting_board_01', 'bottle_wine_01']).slice(0, 2), seat: 'stool_bar_01', seats: [[-0.4, 0.62, 180], [0.4, 0.62, 180]] });
  switch (c.role) {
    case 'hallway':
      return { walls: take([{ p: 'wardrobe_hall_01' }, { p: 'shoe_cabinet_01', top: decor(1) }], [{ p: 'coat_rack_home_01', h: 170 }, { p: pick(['mirror_wall_01', 'mirror_round_01']), h: 150 }, { p: 'bench_shoe_01' }, { p: 'umbrella_stand_01' }, { p: 'key_box_01', h: 140 }, { p: pick(['stroller_01', 'bike_01']) }, art()]), center: [{ p: 'doormat_01', aisle: 0.05 }], maxDepth: 62 };
    case 'living': {
      // velký obývák: rohová sedačka; televize na stolku, nebo na zdi nad ním
      const corner = c.area >= 20 && !c.kitchenette && rng.chance(0.6);
      const tv = rng.chance(0.4) ? { p: pick(['tv_unit_01', 'tv_unit_02']), top: [pick(['speaker_01', 'console_game_01'])], over: { p: 'tv_65_wall_01', h: 115 } } : { p: pick(['tv_unit_01', 'tv_unit_02']), top: ['tv_55_01', pick(['speaker_01', 'console_game_01'])] };
      const walls = [{ p: corner ? pick(['sofa_corner_01', 'sofa_corner_02']) : pick(SOFAS) }, tv];
      if (c.kitchenette) walls.unshift(line(), { p: 'fridge_home_01' });
      return {
        walls: take(walls, [{ p: pick(['bookcase_01', 'bookcase_02', 'bookcase_03']) }, { p: 'sideboard_01', top: decor(3) }, { p: pick(['armchair_01', 'armchair_02', 'armchair_03']) }, { p: 'side_table_01', top: decor(1) }, { p: pick(['floor_lamp_01', 'floor_lamp_02']) }, { p: pick(PLANTS) }, art(), { p: 'radiator_01', h: 15 }, { p: 'clock_wall_01', h: 185 }, { p: 'shelf_wall_home_01', h: 150 }, ...(c.area >= 22 ? [{ p: 'piano_01' }] : [])], n + (c.kitchenette ? 2 : 0)),
        center: [{ p: pick(['coffee_table_01', 'coffee_table_02', 'coffee_table_03']), top: decor(2) }, ...(c.kitchenette ? [dining(c.area < 20)] : [{ p: 'footstool_01' }])],
        maxDepth: corner ? 175 : 95,
      };
    }
    case 'kitchen':
      return { walls: take([line(), { p: 'fridge_home_01' }], [{ p: 'bin_kitchen_01' }, { p: `kitchen_drawers_60_0${color}`, top: decor(1) }, { p: `kitchen_base_60_0${color}`, top: rng.shuffle(KITCHEN_TOPS).slice(0, 1), over: { p: `kitchen_wall_60_0${color}`, h: 145 } }, { p: 'fridge_tall_01' }, art(), { p: 'radiator_01', h: 15 }, { p: 'clock_wall_01', h: 185 }]), center: [c.area >= 14 && rng.chance(0.5) ? island() : dining(c.area < 11)], maxDepth: 70 };
    case 'bedroom':
      return {
        walls: take([{ p: pick(['bed_double_01', 'bed_double_02', 'bed_double_03']) }, { p: pick(['nightstand_01', 'nightstand_02']), top: ['lamp_bedside_01', 'alarm_clock_01'] }], [{ p: pick(['wardrobe_2_01', 'wardrobe_3_01', 'wardrobe_sliding_01']) }, { p: 'dresser_01', top: decor(2) }, { p: 'mirror_floor_01' }, { p: 'laundry_basket_01' }, { p: pick(PLANTS) }, art(), { p: 'radiator_01', h: 15 }, { p: pick(['nightstand_01', 'nightstand_02']), top: ['lamp_bedside_01'] }]),
        maxDepth: 215,
      };
    case 'kids':
      return {
        walls: take([{ p: c.area >= 11 && rng.chance(0.5) ? 'bunk_bed_01' : pick(['bed_single_01', 'bed_single_02']) }, { p: 'desk_kids_01', top: ['lamp_bedside_01', 'books_stack_01'], chair: 'chair_kids_01', chairX: -0.2 }], [{ p: 'shelf_toys_01', top: rng.shuffle(['teddy_01', 'toy_blocks_01']) }, { p: 'chest_toys_01' }, { p: 'wardrobe_2_01' }, { p: 'crib_01' }, art(), { p: 'radiator_01', h: 15 }]),
        center: rng.shuffle([{ p: 'bean_bag_01' }, { p: 'rocking_horse_01' }]).slice(0, c.area >= 12 ? 2 : 1),
        maxDepth: 215,
      };
    case 'study':
      return { walls: take([{ p: pick(['desk_home_01', 'desk_home_02']), top: [pick(['laptop_14_01', 'laptop_16_01', 'pc_allinone_01']), pick(['lamp_bedside_01', 'globe_01'])], chair: 'chair_home_office_01', chairX: -0.2 }, { p: pick(['bookcase_01', 'bookcase_02', 'bookcase_03']) }], [{ p: pick(['bookcase_01', 'bookcase_03']) }, { p: 'armchair_03' }, { p: 'floor_lamp_02' }, { p: pick(PLANTS) }, art(), { p: 'radiator_01', h: 15 }]), maxDepth: 115 };
    case 'bath':
      return {
        walls: take([{ p: c.area >= 6 && rng.chance(0.7) ? 'bathtub_01' : 'shower_cabin_01' }, { p: pick(['toilet_01', 'toilet_wall_01']) }, rng.chance(0.3) ? { p: 'sink_pedestal_01', over: { p: 'mirror_round_01', h: 150 } } : { p: c.area >= 8 ? 'vanity_02' : 'vanity_01', over: { p: 'mirror_cabinet_01', h: 120 } }], [{ p: 'washer_01' }, { p: 'towel_rail_01', h: 40 }, { p: 'cabinet_bath_tall_01' }, { p: 'toilet_paper_01', h: 70 }, { p: 'laundry_basket_01' }, { p: 'dryer_01' }]),
        center: [{ p: 'bath_mat_01', aisle: 0.05 }],
        maxDepth: 95,
      };
    case 'studio':
      return {
        walls: take([line(), { p: 'fridge_home_01' }, { p: pick(['bed_double_01', 'bed_double_02', 'bed_single_01']) }, { p: pick(['sofa_2_01', 'sofa_2_02']) }], [{ p: pick(['wardrobe_2_01', 'wardrobe_3_01']) }, { p: 'tv_unit_01', top: ['tv_55_01'] }, { p: pick(['nightstand_01', 'nightstand_02']), top: ['lamp_bedside_01'] }, { p: pick(PLANTS) }, art(), { p: 'radiator_01', h: 15 }], n + 2),
        center: [dining(true)],
        maxDepth: 215,
      };
    default:
      return null;
  }
}
