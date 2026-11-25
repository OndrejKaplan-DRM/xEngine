// Sada kit_it: další kanceláře (Ondřej 25. 11. 2026 v 14:47: „(b) další obory laboratoří a kanceláří“). Recepce
// (pult zaoblený a rovný, čekací lavice, stolek, stojan na časopisy, nástěnné logo), archiv (pojízdné regály s kolem,
// regál s archivními krabicemi), ředitelna (pracovní stůl s přístavbou, kožené křeslo, vitrína, kožená pohovka),
// kuchyňka a společné (velký kávovar, automat na nápoje, trezor, skartovačka, flipchart). Rozměry úvahou, neměřeno.

import { simple, staticFloor } from '../lab/common.mjs';
import { A, shell, door, screen, casters, merge, T, roundedBox, flatBox, cylinder, tube, torus, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';

const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (f) => (id, title, parts, o = {}) => simple(id, title, 'it.office', parts, { gen: `it/office2.mjs#${f}`, ...o });

/** Nožky ve čtyřech rozích w × d, výška h. */
const legs4 = (key, w, d, h, mat, r = 0.015, inset = 0.05) => A('body', `${key}_legs`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(r, 0, h, { seg: 8 }), mTranslate(sx * (w / 2 - inset), 0, sz * (d / 2 - inset)))))), mat);

/** Recepce a čekárna. */
export function reception() {
  const one = mk('reception');
  const arc = [];
  for (let i = 0; i < 8; i++) {
    const a0 = -60 + i * 15;
    arc.push(moved(roundedBox([-0.17, 0, -0.04], [0.17, 1.1, 0.04], 0.01, 1), at(mRotate('y', a0), mTranslate(0, 0, 1.0))));
  }
  const rk = 'reception_desk_01';
  const sk = 'reception_desk_02';
  const wk = 'chair_waiting_01';
  return [
    one(rk, 'Recepční pult zaoblený', [
      A('body', `${rk}_front`, merge(arc.map((g) => moved(g, mTranslate(0, 0, -0.75)))), 'laminate_white'),
      A('body', `${rk}_top`, moved(lathe([[0.92, 1.1], [1.1, 1.1, 'c'], [1.1, 1.14, 'c'], [0.92, 1.14]], { seg: 10, a0: 210, a1: 330 }), mTranslate(0, 0, -0.75)), 'laminate_oak'),
      A('body', `${rk}_desk`, moved(lathe([[0.4, 0.72], [0.92, 0.72, 'c'], [0.92, 0.75, 'c'], [0.4, 0.75]], { seg: 10, a0: 210, a1: 330 }), mTranslate(0, 0, -0.75)), 'laminate_white'),
      A('body', `${rk}_strip`, moved(lathe([[1.105, 0.5], [1.105, 0.56]], { seg: 10, a0: 210, a1: 330 }), mTranslate(0, 0, -0.75)), 'led_blue'),
    ], { ...floor(), params: { top: 0.75 } }),
    one(sk, 'Recepční pult rovný s vyvýšenou deskou', [
      A('body', `${sk}_body`, roundedBox([-0.9, 0, -0.35], [0.9, 1.05, 0.0], 0.01, 1), 'laminate_white'),
      A('body', `${sk}_counter`, roundedBox([-0.95, 1.05, -0.05], [0.95, 1.09, 0.2], 0.008, 1), 'laminate_oak'),
      A('body', `${sk}_desk`, roundedBox([-0.9, 0.72, -0.75], [0.9, 0.75, -0.35], 0.008, 1), 'laminate_white'),
      A('body', `${sk}_sides`, merge([-1, 1].map((s) => flatBox([s * 0.9 - 0.02, 0, -0.75], [s * 0.9 + 0.02, 0.72, -0.35]))), 'laminate_white'),
      A('body', `${sk}_logo`, flatBox([-0.3, 0.6, 0.0], [0.3, 0.8, 0.006]), 'fabric_teal'),
    ], floor()),
    one(wk, 'Čekací lavice se třemi sedáky', [
      A('body', `${wk}_beam`, flatBox([-0.85, 0.3, -0.04], [0.85, 0.35, 0.04]), 'alu_silver'),
      A('body', `${wk}_legs`, merge([-0.7, 0.7].map((x) => merge([flatBox([x - 0.025, 0, -0.25], [x + 0.025, 0.3, 0.25]), flatBox([x - 0.03, 0, -0.27], [x + 0.03, 0.02, 0.27])]))), 'alu_silver'),
      A('body', `${wk}_seats`, merge([-0.56, 0, 0.56].map((x) => merge([roundedBox([x - 0.25, 0.38, -0.22], [x + 0.25, 0.45, 0.24], 0.02, 1), moved(roundedBox([x - 0.24, 0, -0.03], [x + 0.24, 0.4, 0.03], 0.02, 1), at(mTranslate(0, 0.45, -0.24), mRotate('x', -10)))]))), 'fabric_teal'),
    ], floor()),
    one('table_low_office_01', 'Nízký stolek do čekárny', [A('body', 'table_low_office_01_top', roundedBox([-0.45, 0.4, -0.3], [0.45, 0.43, 0.3], 0.01, 1), 'laminate_oak'), legs4('table_low_office_01', 0.9, 0.6, 0.4, 'alu_silver', 0.012, 0.04), A('body', 'table_low_office_01_mags', merge([moved(flatBox([-0.12, 0.43, -0.09], [0.12, 0.437, 0.09]), mRotate('y', 12)), moved(flatBox([-0.1, 0.437, -0.08], [0.14, 0.443, 0.1]), mRotate('y', -8))]), 'whiteboard')], floor()),
    one('magazine_rack_01', 'Stojan na časopisy', [A('body', 'magazine_rack_01_frame', merge([flatBox([-0.25, 0, -0.15], [-0.23, 1.2, 0.15]), flatBox([0.23, 0, -0.15], [0.25, 1.2, 0.15]), ...[0.2, 0.55, 0.9].map((y) => moved(flatBox([-0.23, 0, -0.01], [0.23, 0.3, 0.01]), at(mTranslate(0, y, 0.02), mRotate('x', -15))))]), 'alu_silver'), A('body', 'magazine_rack_01_mags', merge([0.2, 0.55, 0.9].map((y) => moved(flatBox([-0.15, 0.02, 0.01], [0.15, 0.24, 0.016]), at(mTranslate(0, y, 0.02), mRotate('x', -15))))), 'marker_red')], floor()),
    one('sign_reception_01', 'Nástěnné logo s podsvícením', [A('body', 'sign_reception_01_panel', roundedBox([-0.6, -0.2, 0], [0.6, 0.2, 0.03], 0.01, 1), 'mesh_black'), A('body', 'sign_reception_01_letters', merge(Array.from({ length: 6 }, (_, i) => roundedBox([-0.45 + i * 0.16, -0.08, 0.03], [-0.35 + i * 0.16, 0.08, 0.05], 0.006, 1))), 'whiteboard'), A('body', 'sign_reception_01_glow', flatBox([-0.58, -0.19, 0.0305], [0.58, -0.17, 0.031]), 'led_blue')], wall(1.8)),
  ];
}

/** Archiv a ředitelna. */
export function archive() {
  const one = mk('archive');
  const mobile = (k, n) => {
    const boxes = [];
    for (let s = 0; s < n; s++) for (let r = 0; r < 5; r++) for (let i = 0; i < 6; i++) boxes.push(flatBox([-0.55 + i * 0.18, 0.12 + r * 0.42, -0.45 + s * 0.6], [-0.4 + i * 0.18, 0.42 + r * 0.42, -0.1 + s * 0.6]));
    return [
      A('body', `${k}_units`, merge(Array.from({ length: n }, (_, s) => merge([flatBox([-0.6, 0.08, -0.48 + s * 0.6], [0.6, 2.2, -0.46 + s * 0.6]), flatBox([-0.62, 0.08, -0.48 + s * 0.6], [-0.6, 2.2, -0.05 + s * 0.6]), flatBox([0.6, 0.08, -0.48 + s * 0.6], [0.62, 2.2, -0.05 + s * 0.6]), ...[0.1, 0.52, 0.94, 1.36, 1.78, 2.18].map((y) => flatBox([-0.6, y, -0.46 + s * 0.6], [0.6, y + 0.02, -0.07 + s * 0.6]))]))), 'steel_white'),
      A('body', `${k}_boxes`, merge(boxes), 'paper_kraft'),
      A('body', `${k}_rails`, merge([-0.5, 0.5].map((x) => flatBox([x - 0.02, 0, -0.5], [x + 0.02, 0.02, -0.05 + (n - 1) * 0.6]))), 'steel_dark'),
      A('body', `${k}_wheels`, merge(Array.from({ length: n }, (_, s) => merge([moved(torus(0.09, 0.012, 0, { seg: 14, n: 2 }), at(mTranslate(0.64, 1.1, -0.27 + s * 0.6), mRotate('z', 90))), moved(cylinder(0.015, 0, 0.04, { seg: 8 }), at(mTranslate(0.62, 1.1, -0.27 + s * 0.6), mRotate('z', -90)))]))), 'alu_silver'),
    ];
  };
  const dk = 'desk_director_01';
  const ck = 'chair_executive_01';
  const vk = 'cabinet_glass_office_01';
  return [
    one('archive_shelf_mobile_01', 'Pojízdné archivní regály (2 sekce) s krabicemi', mobile('archive_shelf_mobile_01', 2), floor()),
    one('archive_shelf_mobile_02', 'Pojízdné archivní regály (3 sekce) s krabicemi', mobile('archive_shelf_mobile_02', 3), { ...floor(), params: { assembly: true } }),
    one('archive_box_row_01', 'Řada archivních krabic s pořadači', [A('body', 'archive_box_row_01_boxes', merge(Array.from({ length: 5 }, (_, i) => roundedBox([-0.4 + i * 0.16, 0, -0.15], [-0.26 + i * 0.16, 0.32, 0.15], 0.004, 1))), 'paper_kraft'), A('body', 'archive_box_row_01_labels', merge(Array.from({ length: 5 }, (_, i) => flatBox([-0.37 + i * 0.16, 0.18, 0.15], [-0.29 + i * 0.16, 0.26, 0.1505]))), 'whiteboard')]),
    one(dk, 'Pracovní stůl ředitele s přístavbou', [
      A('body', `${dk}_top`, roundedBox([-1.0, 0.72, -0.45], [1.0, 0.76, 0.45], 0.012, 1), 'laminate_oak'),
      A('body', `${dk}_panels`, merge([flatBox([-0.98, 0, -0.43], [-0.94, 0.72, 0.43]), flatBox([0.94, 0, -0.43], [0.98, 0.72, 0.43]), flatBox([-0.94, 0.3, -0.42], [0.94, 0.7, -0.39])]), 'laminate_oak'),
      A('body', `${dk}_return`, roundedBox([0.98, 0.0, -0.45], [1.6, 0.76, 0.05], 0.01, 1), 'laminate_oak'),
      A('body', `${dk}_drawers`, merge([0.06, 0.28, 0.48].map((y) => roundedBox([1.0, y, 0.05], [1.58, y + 0.18, 0.065], 0.004, 1))), 'laminate_oak'),
      A('body', `${dk}_leather`, flatBox([-0.4, 0.76, -0.05], [0.4, 0.763, 0.3]), 'fabric_charcoal'),
    ], { ...floor(), params: { top: 0.76, deck: [-0.42, 0.42] } }),
    one(ck, 'Kožené kancelářské křeslo s vysokým opěradlem', [
      A('body', `${ck}_seat`, roundedBox([-0.27, 0.46, -0.25], [0.27, 0.56, 0.27], 0.04, 1), 'fabric_charcoal'),
      A('body', `${ck}_back`, moved(roundedBox([-0.26, 0, -0.05], [0.26, 0.75, 0.05], 0.05, 1), at(mTranslate(0, 0.6, -0.26), mRotate('x', -10))), 'fabric_charcoal'),
      A('body', `${ck}_arms`, merge([-1, 1].map((s) => roundedBox([s * 0.3 - 0.04, 0.6, -0.2], [s * 0.3 + 0.04, 0.68, 0.2], 0.02, 1))), 'fabric_charcoal'),
      A('body', `${ck}_base`, merge([cylinder(0.03, 0.12, 0.46, { seg: 8 }), ...Array.from({ length: 5 }, (_, i) => tube([[0, 0.1, 0], [Math.cos(i * 1.257) * 0.32, 0.06, Math.sin(i * 1.257) * 0.32]], 0.016, 6))]), 'alu_silver'),
      A('body', `${ck}_wheels`, merge(Array.from({ length: 5 }, (_, i) => moved(cylinder(0.025, 0, 0.05, { seg: 8 }), at(mTranslate(Math.cos(i * 1.257) * 0.32, 0.03, Math.sin(i * 1.257) * 0.32 - 0.025), mRotate('x', 90))))), 'mesh_black'),
    ], floor()),
    one(vk, 'Vitrína s policemi a trofejemi', [
      A('body', `${vk}_body`, merge([flatBox([-0.45, 0, -0.2], [0.45, 0.1, 0.2]), flatBox([-0.45, 1.9, -0.2], [0.45, 2.0, 0.2]), flatBox([-0.45, 0.1, -0.2], [-0.43, 1.9, 0.2]), flatBox([0.43, 0.1, -0.2], [0.45, 1.9, 0.2]), flatBox([-0.43, 0.1, -0.2], [0.43, 1.9, -0.18])]), 'laminate_oak'),
      A('body', `${vk}_glass`, merge([flatBox([-0.43, 0.1, 0.19], [0.43, 1.9, 0.2]), ...[0.55, 1.0, 1.45].map((y) => flatBox([-0.43, y, -0.18], [0.43, y + 0.008, 0.19]))]), 'glass_tinted'),
      A('body', `${vk}_items`, merge([moved(lathe([[0, 0], [0.04, 0, 'c'], [0.02, 0.06], [0.05, 0.16, 'c'], [0, 0.17]], { seg: 10 }), mTranslate(-0.2, 1.008, 0)), roundedBox([0.05, 1.008, -0.08], [0.25, 1.2, 0.0], 0.004, 1), moved(cylinder(0.04, 0, 0.12, { seg: 10 }), mTranslate(0.2, 0.558, 0))]), 'brass'),
    ], floor()),
    one('sofa_office_01', 'Kožená pohovka do kanceláře', [
      A('body', 'sofa_office_01_base', roundedBox([-0.9, 0.12, -0.4], [0.9, 0.44, 0.42], 0.04, 1), 'fabric_charcoal'),
      A('body', 'sofa_office_01_back', roundedBox([-0.9, 0.12, -0.42], [0.9, 0.8, -0.24], 0.05, 1), 'fabric_charcoal'),
      A('body', 'sofa_office_01_arms', merge([-1, 1].map((s) => roundedBox([s * 0.9 - 0.12, 0.12, -0.42], [s * 0.9 + 0.04, 0.62, 0.42], 0.04, 1))), 'fabric_charcoal'),
      legs4('sofa_office_01', 1.9, 0.8, 0.12, 'alu_silver', 0.015, 0.06),
    ], floor()),
  ];
}

/** Kuchyňka a společné prostory. */
export function common() {
  const one = mk('common');
  const vk = 'vending_machine_01';
  return [
    one('coffee_machine_office_01', 'Velký kávovar do kuchyňky', [A('body', 'coffee_machine_office_01_body', roundedBox([-0.2, 0, -0.25], [0.2, 0.6, 0.2], 0.02, 1), 'mesh_black'), ...screen('body', 'coffee_machine_office_01_scr', -0.12, 0.12, 0.38, 0.55, 0.2, { buttons: 4 }), A('body', 'coffee_machine_office_01_spout', roundedBox([-0.06, 0.22, 0.15], [0.06, 0.3, 0.26], 0.01, 1), 'alu_silver'), A('body', 'coffee_machine_office_01_tray', flatBox([-0.15, 0.02, 0.15], [0.15, 0.05, 0.27]), 'alu_silver')]),
    one(vk, 'Automat na nápoje a svačiny', [
      shell('body', vk, [-0.45, 0.04, -0.4], [0.45, 1.85, 0.4], 'mesh_black', 0.02),
      A('body', `${vk}_window`, flatBox([-0.4, 0.5, 0.4], [0.15, 1.75, 0.405]), 'glass_tinted'),
      A('body', `${vk}_shelves`, merge([0.65, 0.9, 1.15, 1.4, 1.65].map((y) => flatBox([-0.38, y, -0.3], [0.13, y + 0.01, 0.38]))), 'alu_silver'),
      A('body', `${vk}_goods`, merge([0.66, 0.91, 1.16, 1.41].flatMap((y, r) => Array.from({ length: 5 }, (_, i) => moved(cylinder(0.03, 0, 0.12, { seg: 8 }), mTranslate(-0.33 + i * 0.1, y + 0.01, 0.3))))), 'marker_red'),
      ...screen('body', `${vk}_scr`, 0.2, 0.4, 1.4, 1.6, 0.4, { buttons: 4, led: 'emit_green' }),
      A('body', `${vk}_slot`, flatBox([-0.35, 0.15, 0.4], [0.1, 0.35, 0.41]), 'fabric_charcoal'),
    ], floor()),
    one('safe_01', 'Trezor', [A('body', 'safe_01_body', roundedBox([-0.3, 0, -0.3], [0.3, 0.7, 0.3], 0.02, 1), 'steel_painted'), A('body', 'safe_01_door', roundedBox([-0.26, 0.04, 0.3], [0.26, 0.66, 0.33], 0.01, 1), 'steel_painted'), A('body', 'safe_01_dial', merge([moved(cylinder(0.05, 0, 0.02, { seg: 14, edge: 0.005, n: 1 }), at(mTranslate(0, 0.4, 0.33), mRotate('x', 90))), moved(torus(0.06, 0.008, 0, { seg: 14, n: 2 }), at(mTranslate(0.13, 0.4, 0.34), mRotate('x', 90)))]), 'alu_silver')], floor()),
    one('shredder_01', 'Skartovačka', [A('body', 'shredder_01_bin', roundedBox([-0.2, 0, -0.15], [0.2, 0.55, 0.15], 0.02, 1), 'mesh_black'), A('body', 'shredder_01_head', roundedBox([-0.21, 0.55, -0.16], [0.21, 0.65, 0.16], 0.015, 1), 'fabric_charcoal'), A('body', 'shredder_01_slot', flatBox([-0.15, 0.65, -0.005], [0.15, 0.651, 0.005]), 'mesh_black'), A('body', 'shredder_01_led', flatBox([0.15, 0.6, 0.16], [0.18, 0.62, 0.1606]), 'led_blue')], floor()),
    one('flipchart_01', 'Flipchart na trojnožce', [A('body', 'flipchart_01_legs', merge([tube([[0, 1.0, -0.05], [-0.3, 0.013, 0.25]], 0.012, 6), tube([[0, 1.0, -0.05], [0.3, 0.013, 0.25]], 0.012, 6), tube([[0, 1.0, -0.05], [0, 0.013, -0.4]], 0.012, 6)]), 'alu_silver'), A('body', 'flipchart_01_board', moved(roundedBox([-0.35, 0, -0.01], [0.35, 1.0, 0.01], 0.006, 1), at(mTranslate(0, 0.8, 0.08), mRotate('x', -8))), 'whiteboard'), A('body', 'flipchart_01_lines', moved(merge([0.25, 0.4, 0.55].map((y) => flatBox([-0.25, y, 0.011], [0.2, y + 0.012, 0.012]))), at(mTranslate(0, 0.8, 0.08), mRotate('x', -8))), 'marker_red')], floor()),
  ];
}

export const OFFICE2 = [reception, archive, common];
