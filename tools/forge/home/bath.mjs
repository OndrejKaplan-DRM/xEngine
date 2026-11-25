// Sada kit_home: koupelna a WC, předsíň, pracovna a společné prostory domu. Záchod (kombi a závěsný), umyvadlo se
// skříňkou (jedno a dvojité) a na sloupu, vana, sprchový kout, pračka a sušička, zrcadlová skříňka, žebřík na ručníky,
// vysoká koupelnová skříň, držák toaletního papíru, koš na prádlo; botník, věšák, lavice na boty, zrcadlo, stojan na
// deštníky, šatní skříň do předsíně, schránka na klíče; psací stůl (rovný, rohový), kancelářská židle, stojací globus;
// schránky na dopisy, kočárek, jízdní kolo, rohožka. Rozměry podle obvyklé sanity (mísa 36 × 55 cm, umyvadlo 60 cm,
// vana 170 × 75 cm, sprchový kout 90 × 90 cm, pračka 60 × 60 × 85 cm).

import { simple, staticFloor } from '../lab/common.mjs';
import { A, door, screen, knob, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { legs } from './living.mjs';
import { tubShell, waterIn, mirrorFace, soft } from './soft.mjs';

const pad = (i) => String(i).padStart(2, '0');
const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, `home.${cat}`, parts, { gen: `home/bath.mjs#${f}`, ...o });

/** Baterie: stojánková (výtok nad umyvadlem v bodě [x, y, z]). */
const tap = (x, y, z) => merge([moved(cylinder(0.018, 0, 0.1, { seg: 10 }), mTranslate(x, y, z)), tube([[x, y + 0.1, z], [x, y + 0.13, z], [x, y + 0.13, z + 0.1], [x, y + 0.1, z + 0.12]], 0.01, 8, { bend: 0.03, bendSeg: 2 }), moved(flatBox([-0.004, 0, -0.04], [0.004, 0.012, 0]), mTranslate(x, y + 0.12, z - 0.01))]);
/** Koupelna a WC. */
export function bath() {
  const one = mk('bath', 'bath');
  const vanity = (k, w, mat, sinks) => [
    // skříňka pod keramickou deskou 16 cm (mísa umyvadla je v desce, ne ve skříňce)
    A('body', `${k}_cab`, roundedBox([-w / 2, 0.3, -0.24], [w / 2, 0.7, 0.22], 0.01, 1), mat),
    A('body', `${k}_fronts`, roundedBox([-w / 2 + 0.005, 0.31, 0.22], [w / 2 - 0.005, 0.69, 0.235], 0.004, 1), mat),
    A('body', `${k}_grip`, flatBox([-0.1, 0.63, 0.235], [0.1, 0.64, 0.247]), 'steel_brushed'),
    // deska s vydutou mísou umyvadla (jedna skořepina na umyvadlo)
    A('body', `${k}_top`, merge(Array.from({ length: sinks }, (_, i) => {
      const cx = -w / 2 + ((i + 0.5) * w) / sinks;
      const r = Math.min(0.22, w / sinks / 2 - 0.05);
      return tubShell(cx, 0.01, [w / sinks / 2, 0.24, 0.01], [r, 0.17, 0.12], 0.7, 0.86, 0.14, 0.06, 3);
    })), 'ceramic_white'),
    A('body', `${k}_taps`, merge(Array.from({ length: sinks }, (_, i) => tap(-w / 2 + ((i + 0.5) * w) / sinks, 0.86, -0.18))), 'steel_chrome'),
  ];
  const wk = 'washer_01';
  return [
    one('toilet_01', 'Záchod kombi s nádržkou', [
      A('body', 'toilet_01_bowl', moved(lathe([[0.1, 0], [0.13, 0.02, 'c'], [0.16, 0.3], [0.18, 0.4], [0, 0.4]], { seg: 16 }), at(mTranslate(0, 0, 0.05), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.45, 0, 0, 0, 0, 1])), 'ceramic_white'),
      A('body', 'toilet_01_seat', moved(torus(0.15, 0.025, 0, { seg: 18, n: 3 }), at(mTranslate(0, 0.415, 0.06), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 1])), 'ceramic_white'),
      A('body', 'toilet_01_tank', roundedBox([-0.18, 0.4, -0.3], [0.18, 0.8, -0.14], 0.03, 1), 'ceramic_white'),
      A('body', 'toilet_01_button', moved(cylinder(0.025, 0, 0.006, { seg: 12 }), mTranslate(0, 0.8, -0.22)), 'steel_chrome'),
    ], floor()),
    one('toilet_wall_01', 'Závěsný záchod s ovládacím tlačítkem', [
      A('body', 'toilet_wall_01_frame', flatBox([-0.3, 0, -0.3], [0.3, 1.1, -0.15]), 'wall_tile_bath'),
      A('body', 'toilet_wall_01_bowl', moved(lathe([[0.07, 0], [0.15, 0.04, 'c'], [0.17, 0.12], [0.18, 0.2], [0, 0.2]], { seg: 16 }), at(mTranslate(0, 0.22, 0.12), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 1])), 'ceramic_white'),
      A('body', 'toilet_wall_01_seat', moved(torus(0.15, 0.022, 0, { seg: 18, n: 3 }), at(mTranslate(0, 0.43, 0.12), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 1])), 'ceramic_white'),
      A('body', 'toilet_wall_01_plate', roundedBox([-0.12, 0.95, -0.15], [0.12, 1.1, -0.14], 0.006, 1), 'steel_chrome'),
    ], floor()),
    one('vanity_01', 'Umyvadlo se skříňkou 60 cm', vanity('vanity_01', 0.6, 'lacquer_white', 1), floor()),
    one('vanity_02', 'Dvojumyvadlo se skříňkou 120 cm, dub', vanity('vanity_02', 1.2, 'wood_kitchen_oak', 2), floor()),
    one('sink_pedestal_01', 'Umyvadlo na sloupu', [A('body', 'sink_pedestal_01_basin', tubShell(0, 0.01, [0.28, 0.21, 0.06], [0.22, 0.15, 0.1], 0.72, 0.86, 0.13, 0.06, 3), 'ceramic_white'), A('body', 'sink_pedestal_01_column', lathe([[0.1, 0], [0.08, 0.72], [0, 0.72]], { seg: 14 }), 'ceramic_white'), A('body', 'sink_pedestal_01_tap', tap(0, 0.86, -0.15), 'steel_chrome')], floor()),
    one('bathtub_01', 'Vana 170 × 75 cm s baterií', [
      // skořepina: zástěra, okraj, vydutá mísa 42 cm hluboká se sklonem ke dnu; voda do poloviny
      A('body', 'bathtub_01_tub', tubShell(0, 0, [0.85, 0.375, 0.04], [0.76, 0.3, 0.14], 0, 0.58, 0.42, 0.1, 4), 'ceramic_white'),
      A('body', 'bathtub_01_water', waterIn(0, 0, [0.76, 0.3, 0.14], 0.58, 0.42, 0.22, 0.1, 4), 'liquid_water'),
      A('body', 'bathtub_01_drain', moved(cylinder(0.025, 0, 0.004, { seg: 10 }), mTranslate(0.6, 0.163, 0)), 'steel_chrome'),
      // složený ručník na okraji vany
      A('body', 'bathtub_01_towel', soft('bathtub_01_towel', [0.72, 0.58, -0.37], [0.84, 0.63, -0.05], { r: 0.015, nx: 2, ny: 1, nz: 4, puff: 0.006, wrinkle: 0.004, freq: 14 }), 'towel_teal'),
      A('body', 'bathtub_01_tap', merge([tube([[-0.78, 0.7, -0.375], [-0.78, 0.7, -0.3], [-0.78, 0.62, -0.28]], 0.012, 8, { bend: 0.03, bendSeg: 2 }), moved(cylinder(0.02, 0, 0.05, { seg: 8 }), at(mTranslate(-0.7, 0.7, -0.375), mRotate('x', 90)))]), 'steel_chrome'),
    ], floor()),
    one('shower_cabin_01', 'Sprchový kout 90 × 90 cm', [
      A('body', 'shower_cabin_01_tray', roundedBox([-0.45, 0, -0.45], [0.45, 0.06, 0.45], 0.015, 1), 'ceramic_white'),
      A('body', 'shower_cabin_01_glass', merge([flatBox([-0.45, 0.06, 0.44], [0.45, 1.95, 0.45]), flatBox([0.44, 0.06, -0.45], [0.45, 1.95, 0.44])]), 'glass_tinted'),
      A('body', 'shower_cabin_01_profiles', merge([flatBox([-0.45, 0.06, 0.435], [-0.43, 1.95, 0.455]), flatBox([0.435, 0.06, 0.435], [0.455, 1.95, 0.455]), flatBox([0.435, 0.06, -0.45], [0.455, 1.95, -0.43]), flatBox([-0.45, 1.93, 0.435], [0.455, 1.95, 0.455])]), 'steel_chrome'),
      A('body', 'shower_cabin_01_head', merge([tube([[-0.43, 0.9, -0.43], [-0.43, 2.0, -0.43], [-0.2, 2.0, -0.2]], 0.01, 6, { bend: 0.05, bendSeg: 2 }), moved(cylinder(0.1, 0, 0.012, { seg: 16 }), mTranslate(-0.2, 1.98, -0.2))]), 'steel_chrome'),
    ], floor()),
    one(wk, 'Pračka s předním plněním', [
      A('body', `${wk}_body`, roundedBox([-0.3, 0.02, -0.3], [0.3, 0.85, 0.3], 0.02, 1), 'ceramic_white'),
      A('body', `${wk}_door`, moved(torus(0.15, 0.025, 0, { seg: 20, n: 3 }), at(mTranslate(0, 0.42, 0.3), mRotate('x', 90))), 'steel_chrome'),
      A('body', `${wk}_glass`, moved(cylinder(0.14, 0, 0.012, { seg: 20 }), at(mTranslate(0, 0.42, 0.29), mRotate('x', 90))), 'hob_glass'),
      ...screen('body', `${wk}_scr`, -0.05, 0.12, 0.74, 0.82, 0.3, { led: 'emit_green' }),
      knob('body', wk, 0.2, 0.78, 0.3, 0.022, 'steel_chrome'),
      A('body', `${wk}_drawer`, flatBox([-0.27, 0.74, 0.3], [-0.1, 0.82, 0.305]), 'ceramic_white'),
    ], floor()),
    one('dryer_01', 'Sušička prádla', [A('body', 'dryer_01_body', roundedBox([-0.3, 0.02, -0.3], [0.3, 0.85, 0.3], 0.02, 1), 'ceramic_white'), A('body', 'dryer_01_door', moved(cylinder(0.17, 0, 0.03, { seg: 20, edge: 0.01, n: 1 }), at(mTranslate(0, 0.42, 0.3), mRotate('x', 90))), 'lacquer_anthracite'), ...screen('body', 'dryer_01_scr', -0.12, 0.12, 0.74, 0.82, 0.3, { led: 'emit_green' })], floor()),
    one('mirror_cabinet_01', 'Zrcadlová skříňka nad umyvadlo', [A('body', 'mirror_cabinet_01_box', roundedBox([-0.3, 0, 0], [0.3, 0.7, 0.14], 0.008, 1), 'lacquer_white'), ...mirrorFace('body', 'mirror_cabinet_01_l', -0.295, -0.002, 0.005, 0.695, 0.14), ...mirrorFace('body', 'mirror_cabinet_01_r', 0.002, 0.295, 0.005, 0.695, 0.14), A('body', 'mirror_cabinet_01_light', flatBox([-0.25, -0.02, 0.06], [0.25, 0, 0.12]), 'emit_display')], wall(1.2)),
    one('towel_rail_01', 'Žebříkový radiátor s ručníkem', [A('body', 'towel_rail_01_rails', merge([...[-1, 1].map((s) => tube([[s * 0.25, 0, 0.05], [s * 0.25, 1.1, 0.05]], 0.015, 8)), ...Array.from({ length: 12 }, (_, i) => tube([[-0.25, 0.08 + i * 0.085, 0.05], [0.25, 0.08 + i * 0.085, 0.05]], 0.009, 6))]), 'steel_chrome'), A('body', 'towel_rail_01_towel', roundedBox([-0.2, 0.55, 0.04], [0.2, 0.9, 0.075], 0.01, 1), 'towel_teal')], wall(0.4)),
    one('cabinet_bath_tall_01', 'Vysoká koupelnová skříň', [A('body', 'cabinet_bath_tall_01_body', roundedBox([-0.2, 0.0, -0.17], [0.2, 1.7, 0.15], 0.01, 1), 'lacquer_white'), A('body', 'cabinet_bath_tall_01_fronts', merge([roundedBox([-0.195, 0.02, 0.15], [0.195, 0.8, 0.165], 0.004, 1), roundedBox([-0.195, 0.82, 0.15], [0.195, 1.68, 0.165], 0.004, 1)]), 'lacquer_white'), A('body', 'cabinet_bath_tall_01_grips', merge([flatBox([0.15, 0.6, 0.165], [0.16, 0.75, 0.177]), flatBox([0.15, 0.85, 0.165], [0.16, 1.0, 0.177])]), 'steel_brushed')], floor()),
    one('toilet_paper_01', 'Držák toaletního papíru s rolí', [A('body', 'toilet_paper_01_holder', merge([flatBox([-0.03, -0.04, 0], [0.03, 0.04, 0.01]), tube([[0, 0, 0.01], [0, 0, 0.08], [0.13, 0, 0.08]], 0.005, 6, { bend: 0.02, bendSeg: 1 })]), 'steel_chrome'), A('body', 'toilet_paper_01_roll', moved(cylinder(0.055, 0, 0.1, { seg: 14 }), at(mTranslate(0.02, 0, 0.08), mRotate('z', -90))), 'bedding_white')], wall(0.7)),
    one('bath_mat_01', 'Koupelnová předložka', [A('body', 'bath_mat_01_mat', soft('bath_mat_01_mat', [-0.35, 0.005, -0.25], [0.35, 0.018, 0.25], { r: 0.006, nx: 5, ny: 1, nz: 4, puff: 0.002, wrinkle: 0.0015, freq: 12 }), 'towel_teal')]),
  ];
}

/** Předsíň, pracovna a společné prostory domu. */
export function hall() {
  const one = mk('hall', 'hall');
  const bk = 'bike_01';
  const wheel = (x) => moved(torus(0.32, 0.02, 0, { seg: 24, n: 3 }), at(mTranslate(x, 0.34, 0), mRotate('x', 90)));
  return [
    one('shoe_cabinet_01', 'Botník se sklopnými dvířky', [A('body', 'shoe_cabinet_01_body', roundedBox([-0.4, 0.06, -0.16], [0.4, 1.0, 0.14], 0.01, 1), 'lacquer_white'), A('body', 'shoe_cabinet_01_flaps', merge([0.08, 0.55].map((y) => roundedBox([-0.395, y, 0.14], [0.395, y + 0.43, 0.155], 0.004, 1))), 'lacquer_white'), A('body', 'shoe_cabinet_01_grips', merge([0.48, 0.95].map((y) => flatBox([-0.08, y, 0.155], [0.08, y + 0.012, 0.167]))), 'steel_brushed'), A('body', 'shoe_cabinet_01_plinth', flatBox([-0.39, 0, -0.14], [0.39, 0.06, 0.1]), 'lacquer_anthracite')], floor()),
    one('coat_rack_home_01', 'Věšák s háčky a kabáty', [A('body', 'coat_rack_home_01_board', roundedBox([-0.5, 0, 0], [0.5, 0.12, 0.025], 0.006, 1), 'wood_walnut'), A('body', 'coat_rack_home_01_hooks', merge(Array.from({ length: 5 }, (_, i) => tube([[-0.4 + i * 0.2, 0.06, 0.025], [-0.4 + i * 0.2, 0.06, 0.07], [-0.4 + i * 0.2, 0.1, 0.09]], 0.006, 6, { bend: 0.02, bendSeg: 1 }))), 'steel_chrome'), A('body', 'coat_rack_home_01_coats', merge([[-0.4, 0.95], [0.0, 0.85]].map(([x, h]) => moved(lathe([[0.04, 0], [0.2, -0.15, 'c'], [0.22, -h], [0, -h]], { seg: 10 }), at(mTranslate(x, 0.08, 0.12), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.45, 0, 0, 0, 0, 1])))), 'fabric_sofa_blue'), A('body', 'coat_rack_home_01_coat2', moved(lathe([[0.04, 0], [0.18, -0.12, 'c'], [0.2, -0.75], [0, -0.75]], { seg: 10 }), at(mTranslate(0.4, 0.08, 0.12), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.45, 0, 0, 0, 0, 1])), 'fabric_sofa_rust')], wall(1.7)),
    one('bench_shoe_01', 'Lavice na boty s polštářem', [A('body', 'bench_shoe_01_seat', roundedBox([-0.5, 0.42, -0.18], [0.5, 0.48, 0.18], 0.012, 1), 'wood_kitchen_oak'), A('body', 'bench_shoe_01_cushion', soft('bench_shoe_01_cushion', [-0.48, 0.48, -0.16], [0.48, 0.54, 0.16], { r: 0.025, nx: 5, ny: 1, nz: 2, sag: 0.008, puff: 0.006, wrinkle: 0.003 }), 'fabric_sofa_grey'), A('body', 'bench_shoe_01_shelf', flatBox([-0.48, 0.12, -0.16], [0.48, 0.14, 0.16]), 'wood_kitchen_oak'), legs('bench_shoe_01', 1.0, 0.36, 0.42, 'wood_kitchen_oak', 0.018, 0.03), A('body', 'bench_shoe_01_shoes', merge([-0.3, -0.12, 0.2].map((x) => roundedBox([x - 0.05, 0.14, -0.13], [x + 0.05, 0.22, 0.14], 0.03, 1))), 'leather_brown')], floor()),
    one('mirror_wall_01', 'Nástěnné zrcadlo v rámu', [A('body', 'mirror_wall_01_frame', roundedBox([-0.35, -0.6, 0], [0.35, 0.6, 0.03], 0.01, 1), 'lacquer_anthracite'), ...mirrorFace('body', 'mirror_wall_01', -0.32, 0.32, -0.57, 0.57, 0.03)], wall(1.45)),
    one('umbrella_stand_01', 'Stojan na deštníky s deštníkem', [A('body', 'umbrella_stand_01_body', lathe([[0, 0], [0.1, 0, 'c'], [0.11, 0.5], [0.105, 0.5], [0.095, 0.01], [0, 0.01]], { seg: 14 }), 'lacquer_anthracite'), A('body', 'umbrella_stand_01_umbrella', merge([tube([[0.02, 0.05, 0], [0.04, 0.9, 0.02]], 0.01, 6), tube([[0.04, 0.9, 0.02], [0.04, 0.95, 0.02], [0.08, 0.95, 0.02], [0.08, 0.9, 0.02]], 0.008, 6, { bend: 0.02, bendSeg: 2 }), moved(lathe([[0.01, 0], [0.05, 0.25, 'c'], [0.015, 0.6], [0, 0.6]], { seg: 8 }), mTranslate(0.02, 0.2, 0))]), 'fabric_sofa_blue')], floor()),
    one('wardrobe_hall_01', 'Šatní skříň do předsíně se zrcadlem', [A('body', 'wardrobe_hall_01_body', flatBox([-0.5, 0.06, -0.3], [0.5, 2.2, 0.28]), 'wood_kitchen_oak'), A('body', 'wardrobe_hall_01_doors', merge([roundedBox([-0.498, 0.07, 0.28], [-0.002, 2.19, 0.3], 0.004, 1), roundedBox([0.002, 0.07, 0.28], [0.498, 2.19, 0.3], 0.004, 1)]), 'wood_kitchen_oak'), ...mirrorFace('body', 'wardrobe_hall_01', 0.05, 0.45, 0.3, 2.0, 0.3), A('body', 'wardrobe_hall_01_grips', merge([flatBox([-0.05, 0.9, 0.3], [-0.038, 1.15, 0.318]), flatBox([0.012, 0.9, 0.3], [0.024, 1.15, 0.318])]), 'steel_brushed'), A('body', 'wardrobe_hall_01_plinth', flatBox([-0.49, 0, -0.28], [0.49, 0.06, 0.24]), 'lacquer_anthracite')], floor()),
    one('key_box_01', 'Skříňka na klíče', [A('body', 'key_box_01_box', roundedBox([-0.15, -0.2, 0], [0.15, 0.2, 0.06], 0.008, 1), 'wood_birch'), A('body', 'key_box_01_door', flatBox([-0.14, -0.19, 0.06], [0.14, 0.19, 0.063]), 'glass_tinted'), A('body', 'key_box_01_keys', merge([-0.08, 0, 0.08].map((x) => merge([moved(torus(0.012, 0.003, 0, { seg: 8, n: 2 }), at(mTranslate(x, 0.08, 0.03), mRotate('x', 90))), flatBox([x - 0.004, 0.0, 0.028], [x + 0.004, 0.07, 0.032])]))), 'brass')], wall(1.4)),
    one('desk_home_01', 'Psací stůl s kontejnerem', [A('body', 'desk_home_01_top', roundedBox([-0.7, 0.72, -0.35], [0.7, 0.75, 0.35], 0.01, 1), 'wood_walnut'), A('body', 'desk_home_01_box', roundedBox([0.25, 0.04, -0.33], [0.68, 0.72, 0.33], 0.01, 1), 'lacquer_white'), A('body', 'desk_home_01_drawers', merge([0.06, 0.28, 0.5].map((y) => roundedBox([0.255, y, 0.33], [0.675, y + 0.2, 0.345], 0.004, 1))), 'lacquer_white'), legs('desk_home_01', 1.38, 0.68, 0.72, 'plastic_black', 0.018, 0.03)], { ...floor(), params: { top: 0.75 } }),
    one('desk_home_02', 'Rohový psací stůl', [A('body', 'desk_home_02_top', merge([roundedBox([-0.8, 0.72, -0.35], [0.8, 0.75, 0.35], 0.01, 1), roundedBox([0.1, 0.72, 0.35], [0.8, 0.75, 1.1], 0.01, 1)]), 'wood_birch'), legs('desk_home_02', 1.56, 0.66, 0.72, 'steel_brushed', 0.018, 0.04), A('body', 'desk_home_02_leg2', merge([moved(cylinder(0.018, 0, 0.72, { seg: 8 }), mTranslate(0.75, 0, 1.05)), moved(cylinder(0.018, 0, 0.72, { seg: 8 }), mTranslate(0.15, 0, 1.05))]), 'steel_brushed')], floor()),
    one('chair_home_office_01', 'Kancelářská židle do pracovny', [A('body', 'chair_home_office_01_seat', roundedBox([-0.24, 0.46, -0.23], [0.24, 0.53, 0.23], 0.03, 1), 'fabric_sofa_grey'), A('body', 'chair_home_office_01_back', moved(roundedBox([-0.22, 0, -0.03], [0.22, 0.5, 0.03], 0.03, 1), at(mTranslate(0, 0.58, -0.24), mRotate('x', -8))), 'fabric_sofa_grey'), A('body', 'chair_home_office_01_base', merge([cylinder(0.025, 0.12, 0.46, { seg: 8 }), ...Array.from({ length: 5 }, (_, i) => tube([[0, 0.1, 0], [Math.cos(i * 1.257) * 0.3, 0.06, Math.sin(i * 1.257) * 0.3]], 0.015, 6))]), 'plastic_black'), A('body', 'chair_home_office_01_wheels', merge(Array.from({ length: 5 }, (_, i) => moved(cylinder(0.025, 0, 0.05, { seg: 8 }), at(mTranslate(Math.cos(i * 1.257) * 0.3, 0.03, Math.sin(i * 1.257) * 0.3 - 0.025), mRotate('x', 90))))), 'rubber_black')], floor()),
    one('globe_01', 'Glóbus na stojanu', [A('body', 'globe_01_ball', moved(lathe([[0, -0.15], [0.106, -0.106, 'c'], [0.15, 0], [0.106, 0.106, 'c'], [0, 0.15]], { seg: 16 }), mTranslate(0, 0.3, 0)), 'picture_sea'), A('body', 'globe_01_stand', merge([lathe([[0, 0], [0.09, 0, 'c'], [0.08, 0.02, 'c'], [0.015, 0.03], [0.012, 0.13], [0, 0.13]], { seg: 12 }), moved(torus(0.165, 0.006, 0, { seg: 20, n: 2 }), at(mTranslate(0, 0.3, 0), mRotate('x', 90), mRotate('z', 23)))]), 'brass')]),
    one('mailbox_unit_01', 'Domovní schránky (6 schránek)', [A('body', 'mailbox_unit_01_box', roundedBox([-0.45, -0.3, 0], [0.45, 0.3, 0.12], 0.008, 1), 'steel_brushed'), A('body', 'mailbox_unit_01_doors', merge(Array.from({ length: 6 }, (_, i) => flatBox([-0.43 + (i % 3) * 0.29, -0.28 + Math.floor(i / 3) * 0.29, 0.12], [-0.16 + (i % 3) * 0.29, -0.02 + Math.floor(i / 3) * 0.29, 0.123]))), 'enamel_steel'), A('body', 'mailbox_unit_01_slots', merge(Array.from({ length: 6 }, (_, i) => flatBox([-0.38 + (i % 3) * 0.29, -0.06 + Math.floor(i / 3) * 0.29, 0.123], [-0.21 + (i % 3) * 0.29, -0.045 + Math.floor(i / 3) * 0.29, 0.124]))), 'plastic_black'), A('body', 'mailbox_unit_01_names', merge(Array.from({ length: 6 }, (_, i) => flatBox([-0.38 + (i % 3) * 0.29, -0.2 + Math.floor(i / 3) * 0.29, 0.123], [-0.21 + (i % 3) * 0.29, -0.16 + Math.floor(i / 3) * 0.29, 0.124]))), 'label_paper')], wall(1.3)),
    one('stroller_01', 'Dětský kočárek', [A('body', 'stroller_01_tub', moved(lathe([[0, 0], [0.3, 0.02, 'c'], [0.32, 0.25], [0, 0.25]], { seg: 14 }), at(mTranslate(0, 0.45, 0), [1.25, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 1])), 'fabric_sofa_blue'), A('body', 'stroller_01_hood', moved(lathe([[0.3, 0], [0.22, 0.2, 'c'], [0, 0.26]], { seg: 14, a0: 90, a1: 270 }), at(mTranslate(-0.15, 0.7, 0), [0.8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 1])), 'lacquer_anthracite'), A('body', 'stroller_01_frame', tube([[-0.3, 0.1, -0.2], [0.1, 0.45, -0.2], [0.55, 1.0, -0.2], [0.55, 1.0, 0.2], [0.1, 0.45, 0.2], [-0.3, 0.1, 0.2]], 0.012, 6, { bend: 0.05, bendSeg: 2 }), 'steel_chrome'), A('body', 'stroller_01_wheels', merge([-0.3, 0.3].flatMap((x) => [-1, 1].map((s) => moved(torus(0.1, 0.02, 0, { seg: 14, n: 3 }), at(mTranslate(x, 0.12, s * 0.24), mRotate('x', 90)))))), 'rubber_black')], floor()),
    one(bk, 'Jízdní kolo', [A('body', `${bk}_wheels`, merge([wheel(-0.52), wheel(0.52)]), 'rubber_black'), A('body', `${bk}_frame`, merge([tube([[-0.52, 0.34, 0], [-0.1, 0.34, 0], [0.4, 0.75, 0], [-0.2, 0.78, 0], [-0.1, 0.34, 0]], 0.018, 6), tube([[-0.52, 0.34, 0], [-0.2, 0.78, 0]], 0.014, 6), tube([[0.52, 0.34, 0], [0.4, 0.75, 0], [0.38, 0.95, 0]], 0.016, 6), tube([[0.38, 0.95, -0.25], [0.38, 0.95, 0.25]], 0.012, 6), tube([[-0.2, 0.78, 0], [-0.22, 0.88, 0]], 0.014, 6)]), 'lacquer_sage'), A('body', `${bk}_seat`, roundedBox([-0.32, 0.88, -0.07], [-0.1, 0.93, 0.07], 0.02, 1), 'leather_brown')], floor()),
    one('doormat_01', 'Rohožka', [A('body', 'doormat_01_mat', roundedBox([-0.4, 0, -0.25], [0.4, 0.012, 0.25], 0.006, 1), 'paper_kraft')]),
  ];
}
