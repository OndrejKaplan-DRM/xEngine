// Materiály sady kit_base. Jména <látka>_<upřesnění>; žádné se neshoduje se zlatým vzorkem,
// aby šly oba balíky spojit (stejné id ve dvou balících je chyba). Povrch (surface) řídí zvuk kroků a zásahů.
// Barvy jsou lineární a nikdo je zatím neviděl na skutečné grafické kartě.

const lit = (color, surface, o = {}) => ({ model: 'lit', color, rough: 0.9, metal: 0, uvScale: 1, surface, ...o });
const glow = (color, emissive, strength) => ({ model: 'emissive', color, emissive, emissiveStrength: strength, surface: 'glass' });

export const MATERIALS = {
  // stavba
  concrete_raw: lit([0.5, 0.5, 0.48], 'concrete', { uvScale: 2 }),
  concrete_smooth: lit([0.4, 0.4, 0.39], 'concrete', { rough: 0.7, uvScale: 2 }),
  concrete_dark: lit([0.27, 0.27, 0.28], 'concrete', { uvScale: 2 }),
  plaster_light: lit([0.8, 0.79, 0.74], 'concrete'),
  plaster_grey: lit([0.62, 0.62, 0.6], 'concrete'),
  plaster_green: lit([0.52, 0.61, 0.54], 'concrete'),
  tile_white: lit([0.82, 0.84, 0.84], 'tile', { rough: 0.3, uvScale: 0.3 }),
  tile_grey: lit([0.5, 0.53, 0.55], 'tile', { rough: 0.4, uvScale: 0.6 }),
  lino_grey: lit([0.44, 0.46, 0.44], 'rubber', { rough: 0.6 }),
  metal_floor: lit([0.33, 0.34, 0.36], 'metal', { rough: 0.6, metal: 0.7 }),
  stone_block: lit([0.42, 0.4, 0.37], 'stone', { uvScale: 1.2 }),
  stone_rough: lit([0.33, 0.31, 0.29], 'stone', { uvScale: 1.5 }),
  stone_slab: lit([0.3, 0.29, 0.28], 'stone', { rough: 0.8 }),
  stone_pale: lit([0.6, 0.58, 0.53], 'stone', { rough: 0.75 }),
  brick_red: lit([0.45, 0.24, 0.18], 'stone', { uvScale: 0.8 }),
  dirt_packed: lit([0.27, 0.21, 0.15], 'dirt', { rough: 1 }),
  // kovy
  steel_brushed: lit([0.62, 0.64, 0.66], 'metal', { rough: 0.3, metal: 1 }),
  steel_dark: lit([0.18, 0.19, 0.21], 'metal', { rough: 0.55, metal: 0.8 }),
  steel_painted: lit([0.36, 0.42, 0.47], 'metal', { rough: 0.5, metal: 0.3 }),
  iron_black: lit([0.07, 0.07, 0.08], 'metal', { rough: 0.7, metal: 0.9 }),
  brass: lit([0.72, 0.58, 0.25], 'metal', { rough: 0.35, metal: 1 }),
  copper: lit([0.72, 0.42, 0.27], 'metal', { rough: 0.4, metal: 1 }),
  // dřevo
  wood_oak: lit([0.5, 0.36, 0.2], 'wood', { rough: 0.7 }),
  wood_pine: lit([0.72, 0.58, 0.38], 'wood', { rough: 0.8 }),
  wood_old: lit([0.25, 0.17, 0.1], 'wood', { rough: 0.9 }),
  // plasty, guma, látka, sklo
  plastic_ivory: lit([0.86, 0.85, 0.8], 'plastic', { rough: 0.5 }),
  plastic_grey: lit([0.5, 0.51, 0.52], 'plastic', { rough: 0.5 }),
  plastic_dark: lit([0.08, 0.08, 0.09], 'plastic', { rough: 0.5 }),
  rubber_black: lit([0.04, 0.04, 0.04], 'rubber', { rough: 0.95 }),
  fabric_blue: lit([0.15, 0.22, 0.38], 'carpet', { rough: 1 }),
  glass_pane: lit([0.6, 0.75, 0.8], 'glass', { rough: 0.05 }),
  // nátěry
  paint_red: lit([0.72, 0.08, 0.06], 'metal', { rough: 0.45 }),
  paint_yellow: lit([0.9, 0.72, 0.05], 'metal', { rough: 0.55 }),
  paint_green: lit([0.1, 0.45, 0.2], 'metal', { rough: 0.5 }),
  paint_blue: lit([0.1, 0.25, 0.6], 'metal', { rough: 0.5 }),
  // svítící
  emit_warm: glow([1, 0.95, 0.85], [1, 0.9, 0.75], 4),
  emit_cool: glow([0.9, 0.95, 1], [0.85, 0.93, 1], 4),
  emit_screen: glow([0.1, 0.5, 0.35], [0.15, 0.9, 0.6], 2),
  emit_red: glow([0.9, 0.1, 0.08], [1, 0.12, 0.08], 2),
  emit_green: glow([0.1, 0.8, 0.25], [0.12, 1, 0.3], 2),
  emit_fire: glow([1, 0.6, 0.2], [1, 0.55, 0.15], 5),
};
