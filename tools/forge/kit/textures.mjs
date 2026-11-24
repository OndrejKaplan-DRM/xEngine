// Textury sady kit_base: který materiál dostane kterou texturu z příjmu xSearcheru (packs/_inbox).
// Odvozené soubory vyrábí tools/forge/textures.mjs; výsledek s otisky a průměrnými barvami je v textures.lock.json
// a z něj berou materiály a pack.json (buildKit) i galerie. Směr vzhledu: „opotřebený provoz“ (Ondřej, 24. 11. 2026).

/** materiál → <zdroj>:<id> v příjmu */
export const TEXTURE_PLAN = {
  concrete_raw: 'polyhaven:concrete_floor_worn_001',
  concrete_smooth: 'polyhaven:concrete_floor_worn_001',
  concrete_dark: 'polyhaven:concrete_floor_worn_001',
  plaster_light: 'polyhaven:painted_plaster_wall',
  plaster_grey: 'polyhaven:painted_plaster_wall',
  plaster_green: 'polyhaven:painted_plaster_wall',
  tile_white: 'ambientcg:Tiles107',
  tile_grey: 'ambientcg:Tiles107',
  lino_grey: 'polyhaven:old_linoleum_flooring_01',
  metal_floor: 'ambientcg:DiamondPlate008C',
  steel_painted: 'polyhaven:rusty_painted_metal',
  steel_brushed: 'ambientcg:Metal009',
  steel_dark: 'ambientcg:Metal009',
  wood_old: 'polyhaven:old_planks_02',
  wood_oak: 'polyhaven:oak_veneer_01',
  wood_pine: 'polyhaven:kitchen_wood',
  brick_red: 'polyhaven:red_brick',
  stone_block: 'polyhaven:stone_brick_wall_001',
  stone_rough: 'polyhaven:castle_wall_varriation',
  stone_pale: 'polyhaven:sandstone_blocks_05',
  dirt_packed: 'ambientcg:Ground110',
};

/** Hrana odvozené textury v pixelech: nejvýš 512 pro stupeň low (zadání B2.4); originály 2K zůstávají v příjmu. */
export const TEXTURE_SIZE = 512;

/**
 * Když se odstín textury od barvy materiálu liší víc než tolikrát (poměr největšího a nejmenšího zesílení kanálů),
 * použije se z textury jen kresba v šedi a barvu dodá materiál. Jinak by se třeba z rezavě červeného plechu stal
 * modrý plech s modrou rzí.
 */
export const HUE_LIMIT = 1.35;

/** Rozměr předlohy v metrech, když ho zdroj neuvádí (ambientCG DiamondPlate008C). Odhad. */
export const UV_FALLBACK = 1;
