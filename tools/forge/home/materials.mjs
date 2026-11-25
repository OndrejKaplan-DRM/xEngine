// Materiály sady kit_home: potahy sedaček a křesel, kůže, dřevo nábytku (ořech, bříza, dub kuchyně), lakované
// a laminované fronty, keramika sanity, povlečení, koberec, stěny a podlahy bytů (malba ve čtyřech odstínech,
// parkety, dlažba). Jména se nepotkají s kit_base ani kit_lab (sada stojí na obou: chrom, sklo, plasty, displeje).
// Barvy lineární, jas podle albeda; bez textur (D-029: data smí mít textury později, tvar nese tvar).

const lit = (color, surface, o = {}) => ({ model: 'lit', color, rough: 0.9, metal: 0, uvScale: 1, surface, ...o });

export const HOME_MATERIALS = {
  // potahy
  fabric_sofa_grey: lit([0.18, 0.18, 0.19], 'carpet', { rough: 1 }),
  fabric_sofa_beige: lit([0.42, 0.35, 0.26], 'carpet', { rough: 1 }),
  fabric_sofa_blue: lit([0.06, 0.12, 0.25], 'carpet', { rough: 1 }),
  fabric_sofa_green: lit([0.08, 0.2, 0.12], 'carpet', { rough: 1 }),
  fabric_sofa_rust: lit([0.38, 0.11, 0.05], 'carpet', { rough: 1 }),
  leather_brown: lit([0.16, 0.07, 0.03], 'plastic', { rough: 0.55 }),
  // dřevo a fronty
  wood_walnut: lit([0.16, 0.08, 0.04], 'wood', { rough: 0.55 }),
  wood_birch: lit([0.55, 0.43, 0.28], 'wood', { rough: 0.6 }),
  wood_kitchen_oak: lit([0.4, 0.27, 0.14], 'wood', { rough: 0.6 }),
  lacquer_white: lit([0.74, 0.74, 0.72], 'wood', { rough: 0.35 }),
  lacquer_anthracite: lit([0.05, 0.055, 0.06], 'wood', { rough: 0.4 }),
  lacquer_sage: lit([0.22, 0.3, 0.22], 'wood', { rough: 0.4 }),
  lacquer_navy: lit([0.03, 0.06, 0.14], 'wood', { rough: 0.4 }),
  worktop_stone: lit([0.12, 0.12, 0.12], 'stone', { rough: 0.3 }),
  worktop_light: lit([0.62, 0.6, 0.56], 'stone', { rough: 0.35 }),
  // sanita a spotřebiče
  ceramic_white: lit([0.8, 0.8, 0.79], 'tile', { rough: 0.12 }),
  enamel_steel: lit([0.55, 0.56, 0.57], 'metal', { rough: 0.25, metal: 0.9 }),
  hob_glass: lit([0.01, 0.01, 0.012], 'glass', { rough: 0.08 }),
  // textil a dekor
  bedding_white: lit([0.75, 0.75, 0.73], 'carpet', { rough: 1 }),
  bedding_blue: lit([0.25, 0.36, 0.55], 'carpet', { rough: 1 }),
  bedding_rose: lit([0.6, 0.32, 0.33], 'carpet', { rough: 1 }),
  towel_teal: lit([0.05, 0.3, 0.3], 'carpet', { rough: 1 }),
  book_red: lit([0.4, 0.05, 0.04], 'wood', { rough: 0.8 }),
  book_blue: lit([0.05, 0.1, 0.3], 'wood', { rough: 0.8 }),
  book_ochre: lit([0.5, 0.33, 0.07], 'wood', { rough: 0.8 }),
  book_green: lit([0.05, 0.22, 0.1], 'wood', { rough: 0.8 }),
  toy_red: lit([0.7, 0.06, 0.04], 'plastic', { rough: 0.5 }),
  toy_yellow: lit([0.8, 0.6, 0.05], 'plastic', { rough: 0.5 }),
  toy_blue: lit([0.05, 0.2, 0.7], 'plastic', { rough: 0.5 }),
  plush_brown: lit([0.3, 0.17, 0.07], 'carpet', { rough: 1 }),
  plant_leaf: lit([0.05, 0.22, 0.06], 'grass', { rough: 0.8 }),
  plant_pot_white: lit([0.7, 0.68, 0.64], 'stone', { rough: 0.7 }),
  plant_pot_clay: lit([0.42, 0.17, 0.08], 'stone', { rough: 0.9 }),
  soil_home: lit([0.05, 0.035, 0.025], 'dirt', { rough: 1 }),
  picture_sea: lit([0.12, 0.3, 0.45], 'plastic', { rough: 0.6 }),
  picture_field: lit([0.5, 0.42, 0.12], 'plastic', { rough: 0.6 }),
  picture_forest: lit([0.08, 0.22, 0.1], 'plastic', { rough: 0.6 }),
  fruit_orange: lit([0.75, 0.3, 0.02], 'plastic', { rough: 0.6 }),
  fruit_green: lit([0.25, 0.5, 0.06], 'plastic', { rough: 0.6 }),
  // byty: stěny a podlahy (předvolba house)
  wall_paint_warm: lit([0.62, 0.56, 0.47], 'concrete', { rough: 0.95 }),
  wall_paint_sage: lit([0.42, 0.48, 0.4], 'concrete', { rough: 0.95 }),
  wall_paint_blue: lit([0.4, 0.47, 0.55], 'concrete', { rough: 0.95 }),
  wall_paint_white: lit([0.7, 0.7, 0.68], 'concrete', { rough: 0.95 }),
  floor_parquet: lit([0.36, 0.22, 0.11], 'wood', { rough: 0.55 }),
  floor_parquet_light: lit([0.5, 0.36, 0.2], 'wood', { rough: 0.55 }),
  floor_tile_bath: lit([0.35, 0.36, 0.37], 'tile', { rough: 0.3 }),
  wall_tile_bath: lit([0.72, 0.74, 0.74], 'tile', { rough: 0.2 }),
  floor_carpet_grey: lit([0.2, 0.2, 0.21], 'carpet', { rough: 1 }),
  // voda ve vaně (krok 28): zelenomodrá, průsvitná, aby hladina byla vidět i na bílé keramice
  water_bath: lit([0.18, 0.42, 0.5], 'water', { rough: 0.02, opacity: 0.6 }),
  // zrcadlo (krok 28): světlá skleněná plocha a ještě světlejší pruh odrazu (lesk bez mapy okolí, stupeň low)
  mirror_glass: lit([0.5, 0.56, 0.6], 'glass', { rough: 0.02 }),
  mirror_bright: lit([0.78, 0.82, 0.85], 'glass', { rough: 0.02 }),
  // dům zvenku a nádvoří (krok 27)
  facade_render: lit([0.58, 0.54, 0.47], 'concrete', { rough: 0.95 }),
  facade_plinth: lit([0.22, 0.21, 0.2], 'stone', { rough: 0.9 }),
  lawn_green: lit([0.07, 0.17, 0.05], 'grass', { rough: 1 }),
  bark_brown: lit([0.09, 0.06, 0.04], 'wood', { rough: 1 }),
  foliage_green: lit([0.06, 0.16, 0.05], 'grass', { rough: 0.9 }),
  foliage_dark: lit([0.03, 0.1, 0.04], 'grass', { rough: 0.9 }),
  glass_milky: lit([0.62, 0.66, 0.68], 'glass', { rough: 0.6 }),
};
