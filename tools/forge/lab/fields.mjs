// Sada kit_lab: další obory laboratoří (Ondřej 25. 11. 2026 v 14:47: „(b) další obory laboratoří a kanceláří“).
// Fyzika a optika (optický stůl, laser, osciloskopy, zdroje, vakuová komora, kryostat, elektromagnet, rack přístrojů),
// elektronika (antistatický stůl, pájecí stanice, odsávání, mikroskop na desky, 3D tiskárny, zásobníky součástek,
// cívky součástek), histologie (mikrotom, kryostat, tkáňový procesor, zalévací stanice, barvicí automat, skříň na
// sklíčka, lázeň a plotna na řezy, dávkovač parafínu) a materiálové zkoušky (trhací stroj, tvrdoměr, leštička, pila,
// pec, kladivo na rázovou zkoušku, lis, skříň na vzorky). Rozměry úvahou z katalogů, neměřeno; tvar obecný.

import { simple, staticFloor } from './common.mjs';
import { shiftMeshPart as moveMesh } from '../mesh/registry.mjs';
import { A, shell, door, screen, knob, grille, feet, casters, top, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';

const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, cat, parts, { gen: `lab/fields.mjs#${f}`, ...o });

/**
 * Stolní měřicí přístroj w × h × d: skříň, čelní panel s displejem (podíl šířky o.scr), knoflíky (o.knobs),
 * zdířky (o.jacks), držadlo nahoře (o.handle), nožky. Čelo v z = d/2.
 */
function instr(k, w, h, d, o = {}) {
  const z = d / 2;
  const sw = w * (o.scr ?? 0.5);
  const out = [
    A('body', `${k}_case`, roundedBox([-w / 2, 0.012, -d / 2], [w / 2, h, z - 0.01], 0.008, 1), o.mat || 'plastic_light'),
    A('body', `${k}_face`, flatBox([-w / 2 + 0.004, 0.016, z - 0.01], [w / 2 - 0.004, h - 0.004, z]), o.face || 'plastic_anthracite'),
    feet('body', k, w, d, 0.012, 0.04),
  ];
  if (sw > 0) out.push(...screen('body', `${k}_scr`, -w / 2 + 0.015, -w / 2 + 0.015 + sw, h * 0.2, h - 0.015, z, { display: o.display || 'emit_display' }));
  const kn = [];
  for (let i = 0; i < (o.knobs ?? 2); i++) kn.push(moved(cylinder(Math.min(0.014, h * 0.12), 0, 0.016, { seg: 10, edge: 0.003, n: 1 }), at(mTranslate(-w / 2 + 0.03 + sw + ((w - sw - 0.05) * (i % 2 + 0.5)) / 2, h * (i < 2 ? 0.66 : 0.36), z), mRotate('x', 90))));
  if (kn.length) out.push(A('body', `${k}_knobs`, merge(kn), 'plastic_light'));
  const jk = [];
  for (let i = 0; i < (o.jacks ?? 0); i++) jk.push(moved(cylinder(0.006, 0, 0.008, { seg: 6 }), at(mTranslate(w / 2 - 0.02 - i * 0.022, h * 0.18, z), mRotate('x', 90))));
  if (jk.length) out.push(A('body', `${k}_jacks`, merge(jk), o.jackMat || 'cap_red'));
  if (o.handle) out.push(A('body', `${k}_handle`, tube([[-w * 0.3, h, 0], [-w * 0.3, h + 0.025, 0], [w * 0.3, h + 0.025, 0], [w * 0.3, h, 0]], 0.006, 6, { bend: 0.01, bendSeg: 1 }), 'plastic_black'));
  return out;
}

/** Skříň se zásuvkami (rows × cols) w × h × d, štítky na čelech. */
function drawers(k, w, h, d, rows, cols, mat, y0 = 0.04) {
  const fr = [];
  const lb = [];
  const dh = (h - y0 - 0.02) / rows;
  const dw = (w - 0.02) / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + 0.01 + c * dw;
      const y = y0 + 0.01 + r * dh;
      fr.push(flatBox([x + 0.002, y + 0.002, d / 2], [x + dw - 0.002, y + dh - 0.002, d / 2 + 0.01]));
      lb.push(flatBox([x + dw * 0.3, y + dh * 0.55, d / 2 + 0.01], [x + dw * 0.7, y + dh * 0.8, d / 2 + 0.0106]));
    }
  }
  return [A('body', `${k}_body`, roundedBox([-w / 2, 0, -d / 2], [w / 2, h, d / 2], 0.006, 1), mat), A('body', `${k}_fronts`, merge(fr), mat), A('body', `${k}_labels`, merge(lb), 'label_paper')];
}

/** Fyzika a optika. */
export function physics() {
  const one = mk('lab.physics', 'physics');
  const holes = [];
  for (let i = 0; i < 17; i++) holes.push(flatBox([-0.85 + i * 0.1, 0.8, -0.55], [-0.848 + i * 0.1, 0.8006, 0.55]));
  for (let j = 0; j < 11; j++) holes.push(flatBox([-0.85, 0.8, -0.5 + j * 0.1], [0.85, 0.8006, -0.498 + j * 0.1]));
  const table = (k) => [
    A('body', `${k}_top`, roundedBox([-0.9, 0.6, -0.6], [0.9, 0.8, 0.6], 0.008, 1), 'steel_dark'),
    A('body', `${k}_grid`, merge(holes), 'plastic_black'),
    A('body', `${k}_legs`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.11, 0, 0.6, { seg: 12, edge: 0.01, n: 1 }), mTranslate(sx * 0.7, 0, sz * 0.42))))), 'steel_painted'),
  ];
  const post = (x, z, h) => moved(cylinder(0.0065, 0.8, 0.8 + h, { seg: 6 }), mTranslate(x, 0, z));
  // držák optiky: kroužek (čočka nebo zrcadlo) kolmo na paprsek na krátkém sloupku
  const mount = (x, z, h, ry) => moved(merge([moved(cylinder(0.025, -0.006, 0.006, { seg: 12 }), mRotate('x', 90)), flatBox([-0.03, -0.03, -0.006], [0.03, -0.024, 0.006])]), at(mTranslate(x, 0.8 + h + 0.03, z), mRotate('y', ry)));
  const optics = [[-0.3, 0.2, 45], [0.3, 0.2, -45], [0.3, -0.25, 45], [-0.1, -0.25, 0], [0.55, 0.0, 90]];
  const ok = 'optical_table_02';
  const vk = 'vacuum_chamber_01';
  const ck = 'cryostat_01';
  const rk = 'rack_instruments_01';
  return [
    one('optical_table_01', 'Optický stůl 180 × 120 cm s tlumením', table('optical_table_01'), { ...floor(), params: { top: 0.8 } }),
    one(ok, 'Optický stůl se sestavou laseru, zrcadel a čoček', [
      ...table(ok),
      A('body', `${ok}_laser`, roundedBox([-0.8, 0.8, 0.15], [-0.4, 0.9, 0.25], 0.01, 1), 'plastic_white'),
      A('body', `${ok}_aperture`, moved(cylinder(0.015, 0, 0.02, { seg: 10 }), at(mTranslate(-0.4, 0.85, 0.2), mRotate('z', -90))), 'plastic_black'),
      A('body', `${ok}_posts`, merge(optics.map(([x, z]) => post(x, z, 0.1))), 'steel_chrome'),
      A('body', `${ok}_mounts`, merge(optics.map(([x, z, r]) => mount(x, z, 0.1, r))), 'aluminium'),
      A('body', `${ok}_beam`, merge([tube([[-0.38, 0.85, 0.2], [-0.3, 0.85, 0.2], [0.3, 0.85, 0.2], [0.3, 0.85, -0.25], [-0.1, 0.85, -0.25]], 0.0015, 3)]), 'emit_red'),
      A('body', `${ok}_detector`, roundedBox([-0.3, 0.8, -0.3], [-0.2, 0.9, -0.2], 0.006, 1), 'plastic_anthracite'),
      A('body', `${ok}_curtain`, merge([flatBox([-0.9, 0.8, -0.6], [0.9, 1.2, -0.595]), flatBox([-0.9, 0.8, 0.595], [0.9, 1.2, 0.6])]), 'plastic_black'),
    ], { ...floor(), params: { assembly: true } }),
    one('laser_head_01', 'Laser na desku stolu', [A('body', 'laser_head_01_body', roundedBox([-0.08, 0, -0.25], [0.08, 0.14, 0.2], 0.012, 1), 'plastic_white'), A('body', 'laser_head_01_ap', moved(cylinder(0.02, 0, 0.03, { seg: 10 }), at(mTranslate(0, 0.07, 0.2), mRotate('x', 90))), 'plastic_black'), A('body', 'laser_head_01_warn', flatBox([-0.06, 0.08, 0.2], [0.06, 0.12, 0.2006]), 'cap_yellow')]),
    one('oscilloscope_01', 'Osciloskop', instr('oscilloscope_01', 0.38, 0.2, 0.15, { scr: 0.55, knobs: 4, jacks: 4, jackMat: 'cap_blue' })),
    one('oscilloscope_02', 'Osciloskop s velkým displejem', instr('oscilloscope_02', 0.45, 0.28, 0.2, { scr: 0.62, knobs: 4, jacks: 4, jackMat: 'cap_yellow', handle: true })),
    one('function_generator_01', 'Funkční generátor', instr('function_generator_01', 0.3, 0.12, 0.28, { scr: 0.4, knobs: 2, jacks: 2 })),
    one('power_supply_lab_01', 'Laboratorní zdroj dvojitý', instr('power_supply_lab_01', 0.26, 0.16, 0.3, { scr: 0.35, knobs: 4, jacks: 4 })),
    one('spectrum_analyzer_01', 'Spektrální analyzátor', instr('spectrum_analyzer_01', 0.42, 0.24, 0.42, { scr: 0.55, knobs: 2, jacks: 1, handle: true, mat: 'aluminium' })),
    one('multimeter_bench_01', 'Stolní multimetr', instr('multimeter_bench_01', 0.22, 0.09, 0.27, { scr: 0.45, knobs: 1, jacks: 4 })),
    one('lockin_amplifier_01', 'Synchronní zesilovač', instr('lockin_amplifier_01', 0.43, 0.13, 0.4, { scr: 0.3, knobs: 4, jacks: 3, jackMat: 'cap_blue', mat: 'aluminium' })),
    one(vk, 'Vakuová komora s turbomolekulární vývěvou', [
      A('body', `${vk}_frame`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.4 - 0.02, 0, sz * 0.35 - 0.02], [sx * 0.4 + 0.02, 0.8, sz * 0.35 + 0.02]))).concat([flatBox([-0.42, 0.8, -0.37], [0.42, 0.84, 0.37])])), 'aluminium'),
      A('body', `${vk}_chamber`, moved(lathe([[0, 0], [0.28, 0, 'c'], [0.3, 0.03], [0.3, 0.45], [0.28, 0.48, 'c'], [0, 0.48]], { seg: 20 }), mTranslate(0, 0.84, 0)), 'steel_brushed'),
      A('body', `${vk}_ports`, merge([0, 90, 180, 270].map((a) => moved(merge([cylinder(0.06, 0, 0.12, { seg: 12 }), cylinder(0.085, 0.12, 0.14, { seg: 12 })]), at(mTranslate(0, 1.08, 0), mRotate('y', a), mTranslate(0, 0, 0.26), mRotate('x', 90))))), 'steel_chrome'),
      A('body', `${vk}_window`, moved(cylinder(0.05, 0, 0.004, { seg: 12 }), at(mTranslate(0, 1.08, 0.4), mRotate('x', 90))), 'glass_tinted'),
      A('body', `${vk}_turbo`, merge([cylinder(0.07, 0.6, 0.84, { seg: 14, edge: 0.01, n: 1 }), cylinder(0.09, 0.82, 0.84, { seg: 14 })]), 'steel_dark'),
      A('body', `${vk}_gauge`, moved(cylinder(0.03, 0, 0.08, { seg: 10, edge: 0.006, n: 1 }), mTranslate(0.2, 1.32, 0.1)), 'plastic_anthracite'),
    ], floor()),
    one(ck, 'Kryostat s tlakovou hlavou a kompresorem', [
      A('body', `${ck}_dewar`, lathe([[0, 0.1], [0.25, 0.1, 'c'], [0.26, 0.15], [0.26, 1.05], [0.2, 1.12, 'c'], [0.12, 1.14], [0, 1.14]], { seg: 20 }), 'steel_brushed'),
      A('body', `${ck}_head`, merge([cylinder(0.12, 1.14, 1.32, { seg: 14, edge: 0.01, n: 1 }), cylinder(0.05, 1.32, 1.45, { seg: 10 })]), 'aluminium'),
      ...casters('body', ck, 0.5, 0.5, 0.1, 0.06),
      A('body', `${ck}_hoses`, merge([tube([[0.05, 1.42, 0], [0.4, 1.45, 0.1], [0.6, 0.6, 0.2]], 0.02, 6, { bend: 0.15, bendSeg: 3 }), tube([[-0.05, 1.42, 0], [0.4, 1.4, -0.1], [0.62, 0.6, 0.05]], 0.02, 6, { bend: 0.15, bendSeg: 3 })]), 'steel_chrome'),
      A('body', `${ck}_compressor`, roundedBox([0.45, 0, -0.2], [0.85, 0.6, 0.25], 0.02, 1), 'plastic_white'),
    ], floor()),
    one('magnet_electro_01', 'Elektromagnet s pólovými nástavci', [A('body', 'magnet_electro_01_yoke', merge([roundedBox([-0.4, 0, -0.2], [0.4, 0.15, 0.2], 0.01, 1), roundedBox([-0.4, 0.15, -0.2], [-0.25, 0.75, 0.2], 0.01, 1), roundedBox([0.25, 0.15, -0.2], [0.4, 0.75, 0.2], 0.01, 1)]), 'paint_blue'), A('body', 'magnet_electro_01_coils', merge([-1, 1].map((s) => moved(cylinder(0.16, 0, 0.12, { seg: 16, edge: 0.01, n: 1 }), at(mTranslate(s * 0.25, 0.5, 0), mRotate('z', s * 90))))), 'copper'), A('body', 'magnet_electro_01_poles', merge([-1, 1].map((s) => moved(cylinder(0.08, 0, 0.1, { seg: 14 }), at(mTranslate(s * 0.13, 0.5, 0), mRotate('z', s * 90))))), 'steel_chrome')], floor()),
    one(rk, 'Rack s měřicími přístroji', [
      shell('body', rk, [-0.3, 0.05, -0.4], [0.3, 1.6, 0.4], 'plastic_black', 0.006),
      ...[[0.25, 'oscilloscope'], [0.55, 'power'], [0.8, 'gen'], [1.05, 'lockin'], [1.3, 'meter']].flatMap(([y, n], i) => [A('body', `${rk}_u${i}`, flatBox([-0.24, y, 0.36], [0.24, y + 0.2, 0.4]), i % 2 ? 'aluminium' : 'plastic_light'), A('body', `${rk}_d${i}`, flatBox([-0.22, y + 0.06, 0.4], [-0.05, y + 0.16, 0.4006]), 'emit_display')]),
      ...casters('body', rk, 0.6, 0.8, 0.06, 0.06),
    ], floor()),
    one('goggles_rack_01', 'Držák ochranných brýlí proti laseru', [A('body', 'goggles_rack_01_board', roundedBox([-0.25, -0.12, 0], [0.25, 0.12, 0.02], 0.006, 1), 'plastic_white'), A('body', 'goggles_rack_01_goggles', merge([-0.15, 0, 0.15].map((x) => roundedBox([x - 0.07, -0.03, 0.02], [x + 0.07, 0.03, 0.07], 0.02, 1))), 'cap_green')], wall(1.5)),
    one('sign_laser_01', 'Výstražná tabulka: laser', [A('body', 'sign_laser_01_plate', roundedBox([-0.15, -0.1, 0], [0.15, 0.1, 0.012], 0.004, 1), 'cap_yellow'), A('body', 'sign_laser_01_mark', merge([moved(flatBox([-0.06, -0.004, 0.012], [0.06, 0.004, 0.013]), mRotate('z', 30)), moved(flatBox([-0.06, -0.004, 0.012], [0.06, 0.004, 0.013]), mRotate('z', -30))]), 'plastic_black')], wall(1.9)),
  ];
}

/** Elektronika. */
export function electronics() {
  const one = mk('lab.electronics', 'electronics');
  const esd = (k, withDrawers) => [
    A('body', `${k}_top`, roundedBox([-0.8, 0.86, -0.375], [0.8, 0.9, 0.375], 0.006, 1), 'bench_phenolic'),
    A('body', `${k}_mat`, flatBox([-0.75, 0.9, -0.3], [0.75, 0.903, 0.33]), 'plastic_navy'),
    A('body', `${k}_frame`, merge([...[-1, 1].map((s) => flatBox([s * 0.77 - 0.025, 0, -0.35], [s * 0.77 + 0.025, 1.6, -0.3])), ...[-1, 1].map((s) => flatBox([s * 0.77 - 0.025, 0, 0.3], [s * 0.77 + 0.025, 0.86, 0.35])), flatBox([-0.8, 1.25, -0.375], [0.8, 1.28, -0.1])]), 'aluminium'),
    A('body', `${k}_strip`, roundedBox([-0.7, 1.05, -0.36], [0.7, 1.12, -0.31], 0.006, 1), 'plastic_light'),
    A('body', `${k}_sockets`, merge(Array.from({ length: 6 }, (_, i) => flatBox([-0.6 + i * 0.24, 1.07, -0.31], [-0.54 + i * 0.24, 1.1, -0.308]))), 'plastic_black'),
    A('body', `${k}_lamp`, merge([tube([[0.7, 1.28, -0.25], [0.7, 1.5, -0.25], [0.35, 1.55, -0.05]], 0.01, 6, { bend: 0.1, bendSeg: 2 }), moved(cylinder(0.09, 0, 0.04, { seg: 14, edge: 0.01, n: 1 }), mTranslate(0.35, 1.5, -0.05))]), 'plastic_white'),
    ...(withDrawers ? drawers(`${k}_dr`, 0.45, 0.6, 0.6, 4, 1, 'plastic_light').map((p) => moveMesh(p, 0.5, 0.02, 0)) : []),
  ];
  return [
    one('workbench_esd_01', 'Antistatický pracovní stůl s nástavbou a lampou', esd('workbench_esd_01', false), { ...floor(), params: { top: 0.9, deck: [-0.28, 0.34] } }),
    one('soldering_station_01', 'Pájecí stanice s držákem pájky', [A('body', 'soldering_station_01_box', roundedBox([-0.09, 0, -0.08], [0.09, 0.1, 0.08], 0.01, 1), 'plastic_anthracite'), A('body', 'soldering_station_01_lcd', flatBox([-0.06, 0.05, 0.08], [0.03, 0.08, 0.0806]), 'emit_display'), A('body', 'soldering_station_01_holder', merge([moved(lathe([[0.02, 0], [0.035, 0.12], [0.03, 0.12], [0.015, 0]], { seg: 10 }), at(mTranslate(0.16, 0.03, 0), mRotate('z', 35))), moved(cylinder(0.04, 0, 0.03, { seg: 12 }), mTranslate(0.15, 0, 0))]), 'steel_chrome'), A('body', 'soldering_station_01_iron', tube([[0.13, 0.06, 0], [0.2, 0.15, 0.0]], 0.01, 6), 'plastic_black'), A('body', 'soldering_station_01_cable', tube([[0.09, 0.03, 0.05], [0.13, 0.02, 0.1], [0.16, 0.06, 0.02]], 0.003, 4, { bend: 0.03, bendSeg: 2 }), 'plastic_black')]),
    one('fume_extractor_01', 'Odsávání kouře z pájení', [A('body', 'fume_extractor_01_base', roundedBox([-0.08, 0, -0.08], [0.08, 0.04, 0.08], 0.01, 1), 'plastic_anthracite'), A('body', 'fume_extractor_01_arm', tube([[0, 0.04, -0.05], [0, 0.3, -0.05], [0, 0.35, 0.1]], 0.015, 8, { bend: 0.06, bendSeg: 3 }), 'plastic_black'), A('body', 'fume_extractor_01_head', moved(roundedBox([-0.1, -0.04, -0.03], [0.1, 0.04, 0.05], 0.015, 1), mTranslate(0, 0.33, 0.13)), 'plastic_anthracite')]),
    one('pcb_microscope_01', 'Mikroskop na kontrolu desek s monitorem', [A('body', 'pcb_microscope_01_base', roundedBox([-0.15, 0, -0.15], [0.15, 0.03, 0.15], 0.01, 1), 'plastic_white'), A('body', 'pcb_microscope_01_pole', moved(cylinder(0.015, 0.03, 0.45, { seg: 8 }), mTranslate(0, 0, -0.1)), 'steel_chrome'), A('body', 'pcb_microscope_01_cam', merge([moved(cylinder(0.03, 0, 0.12, { seg: 12 }), mTranslate(0, 0.25, 0)), moved(torus(0.04, 0.008, 0, { seg: 14, n: 2 }), mTranslate(0, 0.25, 0))]), 'plastic_anthracite'), A('body', 'pcb_microscope_01_mon', roundedBox([0.1, 0.25, -0.15], [0.4, 0.45, -0.13], 0.006, 1), 'plastic_anthracite'), A('body', 'pcb_microscope_01_scr', flatBox([0.11, 0.26, -0.13], [0.39, 0.44, -0.1296]), 'emit_display')]),
    one('printer_3d_01', '3D tiskárna stolní', [A('body', 'printer_3d_01_frame', merge([...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.22 - 0.015, 0.05, sz * 0.22 - 0.015], [sx * 0.22 + 0.015, 0.5, sz * 0.22 + 0.015]))), flatBox([-0.23, 0.48, -0.23], [0.23, 0.5, 0.23])]), 'plastic_black'), A('body', 'printer_3d_01_base', roundedBox([-0.25, 0, -0.25], [0.25, 0.05, 0.25], 0.008, 1), 'plastic_anthracite'), A('body', 'printer_3d_01_bed', flatBox([-0.18, 0.14, -0.18], [0.18, 0.15, 0.18]), 'aluminium'), A('body', 'printer_3d_01_head', roundedBox([-0.04, 0.3, -0.04], [0.04, 0.38, 0.04], 0.008, 1), 'cap_red'), A('body', 'printer_3d_01_print', moved(lathe([[0, 0], [0.05, 0], [0.03, 0.08], [0, 0.08]], { seg: 6 }), mTranslate(0, 0.15, 0)), 'cap_red'), A('body', 'printer_3d_01_spool', moved(cylinder(0.1, 0, 0.06, { seg: 14 }), at(mTranslate(0.26, 0.4, 0), mRotate('z', -90))), 'plastic_teal')]),
    one('printer_3d_02', '3D tiskárna velká v krytu', [shell('body', 'printer_3d_02', [-0.45, 0.1, -0.4], [0.45, 1.5, 0.4], 'plastic_white', 0.02), ...door('body', 'printer_3d_02_d', -0.4, 0.4, 0.6, 1.4, 0.4, 0.015, { mat: 'plastic_white', window: [0.05, 0.05] }), ...screen('body', 'printer_3d_02_scr', 0.1, 0.38, 0.35, 0.5, 0.4, { buttons: 3, led: 'emit_green' }), ...casters('body', 'printer_3d_02', 0.9, 0.8, 0.1, 0.06)], floor()),
    one('component_drawers_01', 'Zásobník součástek se šuplíčky', drawers('component_drawers_01', 0.4, 0.5, 0.2, 8, 4, 'plastic_light', 0)),
    one('cabinet_components_01', 'Vysoká skříň se zásuvkami na součástky', drawers('cabinet_components_01', 0.6, 1.8, 0.5, 12, 2, 'steel_painted', 0.06), floor()),
    one('reel_rack_01', 'Regál na cívky součástek', [A('body', 'reel_rack_01_frame', merge([...[-1, 1].map((s) => flatBox([s * 0.4 - 0.02, 0, -0.2], [s * 0.4 + 0.02, 1.4, 0.2])), ...[0.3, 0.7, 1.1].map((y) => tube([[-0.4, y, 0], [0.4, y, 0]], 0.01, 4))]), 'steel_brushed'), A('body', 'reel_rack_01_reels', merge([0.3, 0.7, 1.1].flatMap((y) => Array.from({ length: 10 }, (_, i) => moved(cylinder(0.17, 0, 0.012, { seg: 10 }), at(mTranslate(-0.35 + i * 0.075, y, 0), mRotate('z', -90)))))), 'plastic_navy')], floor()),
    one('multimeter_hand_01', 'Ruční multimetr s hroty', [A('body', 'multimeter_hand_01_body', roundedBox([-0.045, 0, -0.09], [0.045, 0.04, 0.09], 0.012, 1), 'cap_yellow'), A('body', 'multimeter_hand_01_lcd', flatBox([-0.035, 0.04, 0.02], [0.035, 0.0406, 0.07]), 'emit_display'), A('body', 'multimeter_hand_01_dial', moved(cylinder(0.025, 0.04, 0.05, { seg: 12 }), mTranslate(0, 0, -0.03)), 'plastic_black'), A('body', 'multimeter_hand_01_leads', merge([tube([[-0.02, 0.02, -0.09], [-0.05, 0.005, -0.15], [-0.12, 0.005, -0.1]], 0.003, 4, { bend: 0.03, bendSeg: 2 }), tube([[0.02, 0.02, -0.09], [0.06, 0.005, -0.15], [0.12, 0.005, -0.12]], 0.003, 4, { bend: 0.03, bendSeg: 2 })]), 'cap_red')]),
    one('pcb_holder_01', 'Držák desky plošných spojů s deskou', [A('body', 'pcb_holder_01_base', roundedBox([-0.12, 0, -0.08], [0.12, 0.03, 0.08], 0.008, 1), 'steel_dark'), A('body', 'pcb_holder_01_arms', merge([-1, 1].map((s) => flatBox([s * 0.1 - 0.01, 0.03, -0.01], [s * 0.1 + 0.01, 0.12, 0.01]))), 'aluminium'), A('body', 'pcb_holder_01_pcb', flatBox([-0.09, 0.1, -0.06], [0.09, 0.103, 0.06]), 'cap_green'), A('body', 'pcb_holder_01_chips', merge([[-0.04, 0.02], [0.03, -0.02], [0.05, 0.03]].map(([x, z]) => flatBox([x - 0.012, 0.103, z - 0.012], [x + 0.012, 0.106, z + 0.012]))), 'plastic_black')]),
    one('workbench_esd_02', 'Antistatický stůl se zásuvkovým kontejnerem', esd('workbench_esd_02', true), { ...floor(), params: { top: 0.9, deck: [-0.28, 0.34] } }),
  ];
}

/** Histologie a patologie. */
export function histology() {
  const one = mk('lab.histology', 'histology');
  const mk1 = 'microtome_01';
  const ck = 'cryostat_histo_01';
  const tk = 'tissue_processor_01';
  const ek = 'embedding_station_01';
  const sk = 'slide_stainer_01';
  return [
    one(mk1, 'Rotační mikrotom', [
      A('body', `${mk1}_body`, roundedBox([-0.2, 0.012, -0.22], [0.2, 0.3, 0.22], 0.02, 1), 'plastic_white'),
      A('body', `${mk1}_wheel`, merge([moved(torus(0.12, 0.012, 0, { seg: 18, n: 2 }), at(mTranslate(0.21, 0.2, 0), mRotate('z', 90))), moved(cylinder(0.02, 0, 0.03, { seg: 8 }), at(mTranslate(0.2, 0.2, 0), mRotate('z', -90))), tube([[0.25, 0.2, 0.1], [0.3, 0.2, 0.1]], 0.008, 6)]), 'steel_chrome'),
      A('body', `${mk1}_head`, merge([roundedBox([-0.06, 0.3, 0.02], [0.06, 0.4, 0.14], 0.008, 1), flatBox([-0.08, 0.28, 0.16], [0.08, 0.3, 0.2])]), 'steel_brushed'),
      A('body', `${mk1}_block`, flatBox([-0.015, 0.31, 0.14], [0.015, 0.33, 0.16]), 'enamel_white'),
      feet('body', mk1, 0.4, 0.44, 0.012, 0.05),
    ]),
    one(ck, 'Kryostat pro zmrazené řezy', [
      shell('body', ck, [-0.35, 0.1, -0.35], [0.35, 1.1, 0.35], 'plastic_white', 0.02),
      A('body', `${ck}_plinth`, flatBox([-0.33, 0, -0.33], [0.33, 0.1, 0.3]), 'plastic_anthracite'),
      A('body', `${ck}_window`, moved(flatBox([-0.28, 0, -0.18], [0.28, 0.006, 0.18]), at(mTranslate(0, 1.02, 0.15), mRotate('x', 30))), 'glass_tinted'),
      A('body', `${ck}_wheel`, moved(torus(0.13, 0.012, 0, { seg: 18, n: 2 }), at(mTranslate(0.36, 0.8, 0), mRotate('z', 90))), 'steel_chrome'),
      ...screen('body', `${ck}_scr`, -0.3, -0.05, 0.6, 0.72, 0.35, { buttons: 3 }),
      ...grille('body', `${ck}_v`, -0.3, 0.3, 0.15, 0.4, 0.35, 5),
    ], floor()),
    one(tk, 'Tkáňový procesor (automat)', [
      shell('body', tk, [-0.4, 0.06, -0.35], [0.4, 1.25, 0.35], 'plastic_white', 0.02),
      A('body', `${tk}_plinth`, flatBox([-0.38, 0, -0.33], [0.38, 0.06, 0.3]), 'plastic_anthracite'),
      ...door('body', `${tk}_d`, -0.38, 0.38, 0.1, 0.8, 0.35, 0.015, { mat: 'plastic_light' }),
      A('body', `${tk}_lid`, roundedBox([-0.38, 1.25, -0.33], [0.38, 1.3, 0.33], 0.01, 1), 'plastic_light'),
      ...screen('body', `${tk}_scr`, -0.3, 0.15, 0.88, 1.18, 0.35, { led: 'emit_green' }),
    ], floor()),
    one(ek, 'Zalévací stanice s chladicí deskou', [
      A('body', `${ek}_body`, roundedBox([-0.55, 0.012, -0.3], [0.55, 0.25, 0.3], 0.015, 1), 'plastic_white'),
      A('body', `${ek}_cold`, flatBox([0.15, 0.25, -0.2], [0.5, 0.255, 0.2]), 'aluminium'),
      A('body', `${ek}_tank`, roundedBox([-0.5, 0.25, -0.25], [-0.15, 0.4, 0.1], 0.01, 1), 'steel_brushed'),
      A('body', `${ek}_tap`, merge([flatBox([-0.35, 0.3, 0.1], [-0.31, 0.34, 0.16])]), 'steel_chrome'),
      A('body', `${ek}_molds`, merge(Array.from({ length: 6 }, (_, i) => flatBox([0.2 + (i % 3) * 0.1, 0.255, -0.1 + Math.floor(i / 3) * 0.1], [0.26 + (i % 3) * 0.1, 0.27, -0.04 + Math.floor(i / 3) * 0.1]))), 'steel_chrome'),
      ...screen('body', `${ek}_scr`, -0.1, 0.1, 0.06, 0.2, 0.3, { buttons: 2 }),
    ]),
    one(sk, 'Barvicí automat na sklíčka', [
      shell('body', sk, [-0.45, 0.06, -0.3], [0.45, 0.6, 0.3], 'plastic_white', 0.015),
      A('body', `${sk}_cover`, moved(roundedBox([-0.43, 0, -0.28], [0.43, 0.012, 0.28], 0.006, 1), mTranslate(0, 0.6, 0)), 'glass_tinted'),
      A('body', `${sk}_baths`, merge(Array.from({ length: 12 }, (_, i) => flatBox([-0.4 + (i % 6) * 0.13, 0.56, -0.22 + Math.floor(i / 6) * 0.2], [-0.3 + (i % 6) * 0.13, 0.6, -0.06 + Math.floor(i / 6) * 0.2]))), 'liquid_purple'),
      ...screen('body', `${sk}_scr`, 0.1, 0.4, 0.3, 0.52, 0.3, { buttons: 3 }),
      A('body', `${sk}_plinth`, flatBox([-0.43, 0, -0.28], [0.43, 0.06, 0.25]), 'plastic_anthracite'),
    ]),
    one('slide_cabinet_01', 'Skříň na podložní sklíčka', drawers('slide_cabinet_01', 0.45, 1.2, 0.5, 15, 1, 'steel_white', 0.05), floor()),
    one('water_bath_sections_01', 'Lázeň na napínání řezů', [A('body', 'water_bath_sections_01_body', roundedBox([-0.15, 0.012, -0.15], [0.15, 0.1, 0.15], 0.02, 1), 'plastic_anthracite'), A('body', 'water_bath_sections_01_water', moved(cylinder(0.11, 0, 0.002, { seg: 18 }), mTranslate(0, 0.1, 0)), 'liquid_water'), A('body', 'water_bath_sections_01_led', flatBox([-0.03, 0.05, 0.15], [0.03, 0.07, 0.1505]), 'emit_red')]),
    one('hot_plate_slides_01', 'Plotna na sušení sklíček', [A('body', 'hot_plate_slides_01_body', roundedBox([-0.2, 0.012, -0.15], [0.2, 0.06, 0.15], 0.01, 1), 'plastic_white'), A('body', 'hot_plate_slides_01_plate', flatBox([-0.18, 0.06, -0.13], [0.18, 0.063, 0.13]), 'aluminium'), A('body', 'hot_plate_slides_01_slides', merge(Array.from({ length: 8 }, (_, i) => flatBox([-0.16 + i * 0.04, 0.063, -0.04], [-0.135 + i * 0.04, 0.065, 0.04]))), 'glass_lab')]),
    one('paraffin_dispenser_01', 'Dávkovač parafínu', [A('body', 'paraffin_dispenser_01_body', roundedBox([-0.12, 0.012, -0.15], [0.12, 0.35, 0.15], 0.015, 1), 'steel_brushed'), A('body', 'paraffin_dispenser_01_tap', tube([[0, 0.25, 0.15], [0, 0.25, 0.2], [0, 0.2, 0.2]], 0.008, 6, { bend: 0.02, bendSeg: 1 }), 'steel_chrome'), A('body', 'paraffin_dispenser_01_lid', roundedBox([-0.11, 0.35, -0.14], [0.11, 0.37, 0.14], 0.006, 1), 'plastic_anthracite')]),
    one('slide_rack_01', 'Stojánek se sklíčky', [A('body', 'slide_rack_01_rack', roundedBox([-0.06, 0, -0.04], [0.06, 0.04, 0.04], 0.004, 1), 'plastic_light'), A('body', 'slide_rack_01_slides', merge(Array.from({ length: 10 }, (_, i) => flatBox([-0.05 + i * 0.011, 0.02, -0.013], [-0.049 + i * 0.011, 0.095, 0.013]))), 'glass_lab')]),
    one('cassette_box_01', 'Krabička s kazetami na tkáň', [A('body', 'cassette_box_01_box', roundedBox([-0.1, 0, -0.07], [0.1, 0.05, 0.07], 0.004, 1), 'plastic_white'), A('body', 'cassette_box_01_cassettes', merge(Array.from({ length: 12 }, (_, i) => flatBox([-0.09 + (i % 6) * 0.03, 0.05, -0.06 + Math.floor(i / 6) * 0.06], [-0.065 + (i % 6) * 0.03, 0.054, -0.01 + Math.floor(i / 6) * 0.06]))), 'cap_blue')]),
    one('coverslipper_01', 'Automat na krycí sklíčka', instr('coverslipper_01', 0.45, 0.35, 0.5, { scr: 0.3, knobs: 0, mat: 'plastic_white', face: 'plastic_light' })),
  ];
}

/** Materiálové zkoušky. */
export function materials() {
  const one = mk('lab.materials', 'materials');
  const tk = 'testing_machine_01';
  const ik = 'impact_tester_01';
  return [
    one(tk, 'Univerzální trhací stroj (zkoušky tahem a tlakem)', [
      A('body', `${tk}_base`, roundedBox([-0.5, 0, -0.35], [0.5, 0.55, 0.35], 0.02, 1), 'paint_blue'),
      A('body', `${tk}_columns`, merge([-1, 1].map((s) => moved(cylinder(0.05, 0, 1.6, { seg: 12 }), mTranslate(s * 0.35, 0.55, 0)))), 'steel_chrome'),
      A('body', `${tk}_head`, roundedBox([-0.48, 2.1, -0.2], [0.48, 2.3, 0.2], 0.015, 1), 'paint_blue'),
      A('body', `${tk}_cross`, roundedBox([-0.45, 1.2, -0.15], [0.45, 1.35, 0.15], 0.012, 1), 'paint_blue'),
      A('body', `${tk}_grips`, merge([roundedBox([-0.05, 1.08, -0.05], [0.05, 1.2, 0.05], 0.008, 1), roundedBox([-0.05, 0.55, -0.05], [0.05, 0.75, 0.05], 0.008, 1)]), 'steel_dark'),
      A('body', `${tk}_specimen`, flatBox([-0.01, 0.75, -0.003], [0.01, 1.08, 0.003]), 'aluminium'),
      A('body', `${tk}_shield`, flatBox([-0.3, 0.6, 0.2], [0.3, 1.3, 0.206]), 'glass_tinted'),
      ...screen('body', `${tk}_scr`, 0.1, 0.4, 0.3, 0.48, 0.35, { buttons: 4, led: 'emit_green' }),
    ], floor()),
    one('testing_machine_02', 'Stolní zkušební stroj', [A('body', 'testing_machine_02_base', roundedBox([-0.25, 0.012, -0.2], [0.25, 0.15, 0.2], 0.015, 1), 'paint_blue'), A('body', 'testing_machine_02_columns', merge([-1, 1].map((s) => moved(cylinder(0.025, 0, 0.7, { seg: 10 }), mTranslate(s * 0.16, 0.15, 0)))), 'steel_chrome'), A('body', 'testing_machine_02_head', roundedBox([-0.22, 0.85, -0.1], [0.22, 0.95, 0.1], 0.01, 1), 'paint_blue'), A('body', 'testing_machine_02_cross', roundedBox([-0.2, 0.5, -0.07], [0.2, 0.58, 0.07], 0.008, 1), 'steel_dark'), feet('body', 'testing_machine_02', 0.5, 0.4, 0.012, 0.05)]),
    one('hardness_tester_01', 'Tvrdoměr', [A('body', 'hardness_tester_01_body', merge([roundedBox([-0.12, 0.012, -0.2], [0.12, 0.1, 0.2], 0.015, 1), roundedBox([-0.1, 0.1, -0.2], [0.1, 0.6, -0.05], 0.015, 1), roundedBox([-0.1, 0.45, -0.05], [0.1, 0.6, 0.12], 0.015, 1)]), 'plastic_light'), A('body', 'hardness_tester_01_anvil', merge([moved(cylinder(0.05, 0.1, 0.2, { seg: 12 }), mTranslate(0, 0, 0.05)), moved(cylinder(0.01, 0.38, 0.45, { seg: 8 }), mTranslate(0, 0, 0.05))]), 'steel_chrome'), A('body', 'hardness_tester_01_scr', flatBox([-0.07, 0.48, 0.12], [0.07, 0.56, 0.1206]), 'emit_display'), A('body', 'hardness_tester_01_wheel', moved(torus(0.06, 0.008, 0, { seg: 14, n: 2 }), mTranslate(0, 0.08, 0.1)), 'plastic_black')]),
    one('polisher_01', 'Brusno-leštička vzorků', [A('body', 'polisher_01_body', roundedBox([-0.25, 0.012, -0.3], [0.25, 0.25, 0.3], 0.02, 1), 'plastic_white'), A('body', 'polisher_01_bowl', moved(lathe([[0.2, 0], [0.21, 0.08], [0.19, 0.08], [0.18, 0.01], [0, 0.01]], { seg: 20 }), mTranslate(0, 0.25, -0.03)), 'plastic_anthracite'), A('body', 'polisher_01_disk', moved(cylinder(0.17, 0, 0.012, { seg: 20 }), mTranslate(0, 0.26, -0.03)), 'paper_kraft'), A('body', 'polisher_01_tap', tube([[0.2, 0.25, -0.25], [0.2, 0.42, -0.25], [0.05, 0.42, -0.1]], 0.008, 6, { bend: 0.05, bendSeg: 2 }), 'steel_chrome'), ...screen('body', 'polisher_01_scr', -0.15, 0.15, 0.06, 0.2, 0.3, { buttons: 3 })]),
    one('saw_precision_01', 'Přesná pila na vzorky', [shell('body', 'saw_precision_01', [-0.3, 0.012, -0.25], [0.3, 0.3, 0.25], 'plastic_light', 0.02), A('body', 'saw_precision_01_hood', moved(roundedBox([-0.28, 0, -0.23], [0.28, 0.12, 0.2], 0.04, 1), mTranslate(0, 0.3, 0)), 'glass_tinted'), A('body', 'saw_precision_01_blade', moved(cylinder(0.1, -0.002, 0.002, { seg: 20 }), at(mTranslate(0, 0.36, -0.02), mRotate('z', 90))), 'steel_chrome'), ...screen('body', 'saw_precision_01_scr', -0.2, 0.0, 0.08, 0.24, 0.25, { buttons: 2 })]),
    one('furnace_muffle_01', 'Muflová pec', [shell('body', 'furnace_muffle_01', [-0.25, 0.012, -0.3], [0.25, 0.5, 0.3], 'steel_painted', 0.015), ...door('body', 'furnace_muffle_01_d', -0.2, 0.2, 0.2, 0.46, 0.3, 0.04, { mat: 'steel_painted' }), A('body', 'furnace_muffle_01_handle', tube([[-0.12, 0.42, 0.34], [-0.12, 0.42, 0.38], [0.12, 0.42, 0.38], [0.12, 0.42, 0.34]], 0.008, 6, { bend: 0.015, bendSeg: 1 }), 'steel_chrome'), ...screen('body', 'furnace_muffle_01_scr', -0.15, 0.15, 0.04, 0.17, 0.3, { buttons: 3, led: 'emit_red' }), A('body', 'furnace_muffle_01_vent', moved(cylinder(0.02, 0, 0.06, { seg: 8 }), mTranslate(0, 0.5, -0.1)), 'steel_dark')]),
    one(ik, 'Kladivo pro rázovou zkoušku (Charpy)', [
      A('body', `${ik}_base`, roundedBox([-0.4, 0, -0.3], [0.4, 0.3, 0.3], 0.02, 1), 'paint_green'),
      A('body', `${ik}_posts`, merge([-1, 1].map((s) => flatBox([s * 0.25 - 0.04, 0.3, -0.06], [s * 0.25 + 0.04, 1.6, 0.06]))), 'paint_green'),
      A('body', `${ik}_axle`, moved(cylinder(0.03, 0, 0.6, { seg: 10 }), at(mTranslate(-0.3, 1.5, 0), mRotate('z', -90))), 'steel_chrome'),
      A('body', `${ik}_arm`, moved(merge([flatBox([-0.02, -1.0, -0.02], [0.02, 0, 0.02]), roundedBox([-0.12, -1.15, -0.05], [0.12, -0.98, 0.05], 0.02, 1)]), at(mTranslate(0, 1.5, 0), mRotate('z', 120))), 'steel_dark'),
      A('body', `${ik}_guard`, merge([flatBox([-0.4, 0.3, 0.3], [0.4, 1.0, 0.306]), flatBox([-0.4, 0.3, -0.306], [0.4, 1.0, -0.3])]), 'glass_tinted'),
    ], floor()),
    one('press_mounting_01', 'Lis na zalévání vzorků', [A('body', 'press_mounting_01_body', roundedBox([-0.17, 0.012, -0.22], [0.17, 0.45, 0.22], 0.02, 1), 'plastic_light'), A('body', 'press_mounting_01_cyl', moved(cylinder(0.06, 0, 0.12, { seg: 14, edge: 0.01, n: 1 }), mTranslate(0, 0.45, -0.02)), 'steel_chrome'), ...screen('body', 'press_mounting_01_scr', -0.12, 0.12, 0.2, 0.36, 0.22, { buttons: 2 })]),
    one('specimen_cabinet_01', 'Skříň na zkušební vzorky', drawers('specimen_cabinet_01', 0.9, 1.0, 0.6, 5, 2, 'steel_painted', 0.05), floor()),
    one('tensile_specimens_01', 'Zkušební tyče (podnos)', [A('body', 'tensile_specimens_01_tray', roundedBox([-0.15, 0, -0.1], [0.15, 0.02, 0.1], 0.005, 1), 'plastic_anthracite'), A('body', 'tensile_specimens_01_bars', merge(Array.from({ length: 6 }, (_, i) => merge([flatBox([-0.12, 0.02, -0.07 + i * 0.028], [-0.07, 0.03, -0.055 + i * 0.028]), flatBox([-0.07, 0.022, -0.066 + i * 0.028], [0.07, 0.028, -0.059 + i * 0.028]), flatBox([0.07, 0.02, -0.07 + i * 0.028], [0.12, 0.03, -0.055 + i * 0.028])]))), 'aluminium')]),
  ];
}

export const FIELDS = [physics, electronics, histology, materials];
