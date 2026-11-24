// Materiály sady kit_it: obrazovky, hliník notebooků, klávesy, děrované dveře racků, kabely, LED, filc akustických
// panelů, potahy židlí a sedaček, lamino stolů, bílá tabule. Jména se nepotkají s kit_base ani kit_lab
// (sada stojí na obou: plast přístrojů, displeje, sklo bere odtud). Barvy lineární, jas podle albeda.

const lit = (color, surface, o = {}) => ({ model: 'lit', color, rough: 0.9, metal: 0, uvScale: 1, surface, ...o });
const glow = (color, emissive, strength) => ({ model: 'emissive', color, emissive, emissiveStrength: strength, surface: 'glass' });

export const IT_MATERIALS = {
  screen_off: lit([0.012, 0.013, 0.016], 'glass', { rough: 0.15 }), // vypnutá obrazovka, lesklá černá
  screen_code: glow([0.03, 0.05, 0.08], [0.15, 0.35, 0.6], 1.2), // editor kódu, tmavý motiv
  screen_doc: glow([0.7, 0.72, 0.74], [0.85, 0.88, 0.9], 1.0), // světlý dokument
  screen_graph: glow([0.05, 0.12, 0.06], [0.2, 0.75, 0.35], 1.2), // grafy a monitoring
  bezel_black: lit([0.02, 0.02, 0.022], 'plastic', { rough: 0.4 }),
  alu_silver: lit([0.55, 0.56, 0.58], 'metal', { rough: 0.35, metal: 0.9 }),
  alu_space: lit([0.12, 0.125, 0.13], 'metal', { rough: 0.4, metal: 0.8 }),
  key_black: lit([0.025, 0.025, 0.028], 'plastic', { rough: 0.6 }),
  key_white: lit([0.72, 0.72, 0.7], 'plastic', { rough: 0.6 }),
  rack_black: lit([0.018, 0.018, 0.02], 'metal', { rough: 0.5, metal: 0.6 }),
  rack_mesh: lit([0.02, 0.02, 0.022], 'metal', { rough: 0.5, metal: 0.6, opacity: 0.7 }), // děrované dveře
  server_face: lit([0.06, 0.065, 0.07], 'metal', { rough: 0.45, metal: 0.5 }),
  led_blue: glow([0.1, 0.3, 0.9], [0.2, 0.5, 1], 3),
  led_orange: glow([0.9, 0.4, 0.05], [1, 0.45, 0.05], 2),
  cable_blue: lit([0.05, 0.25, 0.6], 'plastic', { rough: 0.6 }),
  cable_yellow: lit([0.8, 0.62, 0.05], 'plastic', { rough: 0.6 }),
  cable_grey: lit([0.25, 0.26, 0.27], 'plastic', { rough: 0.6 }),
  felt_grey: lit([0.22, 0.23, 0.24], 'carpet', { rough: 1 }),
  felt_green: lit([0.12, 0.25, 0.14], 'carpet', { rough: 1 }),
  felt_blue: lit([0.08, 0.14, 0.3], 'carpet', { rough: 1 }),
  fabric_charcoal: lit([0.06, 0.06, 0.065], 'carpet', { rough: 1 }),
  fabric_mustard: lit([0.55, 0.38, 0.06], 'carpet', { rough: 1 }),
  fabric_teal: lit([0.05, 0.25, 0.27], 'carpet', { rough: 1 }),
  mesh_black: lit([0.03, 0.03, 0.035], 'carpet', { rough: 0.8 }), // síťovina opěradla
  laminate_white: lit([0.72, 0.72, 0.7], 'wood', { rough: 0.5 }),
  laminate_oak: lit([0.45, 0.33, 0.2], 'wood', { rough: 0.6 }),
  whiteboard: lit([0.8, 0.81, 0.8], 'plastic', { rough: 0.15 }),
  marker_red: lit([0.6, 0.04, 0.04], 'plastic', { rough: 0.5 }),
  leaf_green: lit([0.04, 0.2, 0.05], 'grass', { rough: 0.8 }),
  pot_terracotta: lit([0.45, 0.18, 0.09], 'stone', { rough: 0.9 }),
  soil_dark: lit([0.05, 0.035, 0.025], 'dirt', { rough: 1 }),
  table_green: lit([0.03, 0.2, 0.12], 'wood', { rough: 0.5 }), // stůl na stolní tenis
  paint_white_line: lit([0.78, 0.78, 0.76], 'plastic', { rough: 0.5 }),
};
