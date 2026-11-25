// Sada kit_home: ložnice a dětský pokoj. Manželské postele (tři provedení), jednolůžka, palanda, dětská postýlka,
// noční stolky, šatní skříně (dvoudveřová s dvířky na pantu, třídveřová, s posuvnými dveřmi), komoda, stojací
// zrcadlo, koš na prádlo; dětský psací stůl a židlička, police s hračkami, truhla na hračky, houpací koník,
// sedací vak, kostky a plyšák. Matrace 200 × 160 (180, 90) cm, sedák postele 45 až 50 cm; tvar obecný.

import { simple, moving, staticFloor } from '../lab/common.mjs';
import { A, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { legs, books } from './living.mjs';

const pad = (i) => String(i).padStart(2, '0');
const floor = () => ({ components: staticFloor(), group: 'world' });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, `home.${cat}`, parts, { gen: `home/bedroom.mjs#${f}`, ...o });

/** Postel w × l (podélně podél z, čelo u zdi v z = −l/2): rám, matrace, povlečení, polštáře, čelo. */
function bed(k, w, l, frame, cover, head, pillows = w > 1.2 ? 2 : 1) {
  return [
    A('body', `${k}_frame`, roundedBox([-w / 2 - 0.03, 0.12, -l / 2], [w / 2 + 0.03, 0.32, l / 2 + 0.03], 0.012, 1), frame),
    legs(k, w + 0.04, l, 0.12, frame, 0.025, 0.06),
    A('body', `${k}_mattress`, roundedBox([-w / 2, 0.3, -l / 2 + 0.04], [w / 2, 0.48, l / 2], 0.03, 1), 'bedding_white'),
    A('body', `${k}_cover`, roundedBox([-w / 2 - 0.01, 0.44, -l / 2 + 0.55], [w / 2 + 0.01, 0.53, l / 2 + 0.01], 0.04, 1), cover),
    A('body', `${k}_pillows`, merge(Array.from({ length: pillows }, (_, i) => roundedBox([-w / 2 + 0.06 + (i * (w - 0.12)) / pillows, 0.47, -l / 2 + 0.1], [-w / 2 + 0.06 + ((i + 1) * (w - 0.12)) / pillows - 0.04, 0.6, -l / 2 + 0.48], 0.05, 1))), 'bedding_white'),
    A('body', `${k}_head`, roundedBox([-w / 2 - 0.04, 0.12, -l / 2 - 0.06], [w / 2 + 0.04, head, -l / 2], 0.02, 1), frame),
  ];
}

/** Skříň w × h s hloubkou 60 cm: korpus, dvířka (n), madla, sokl. */
function wardrobe(k, w, h, n, mat, gripMat = 'steel_brushed') {
  const dw = (w - 0.02) / n;
  return [
    A('body', `${k}_body`, flatBox([-w / 2, 0.08, -0.3], [w / 2, h, 0.28]), mat),
    A('body', `${k}_plinth`, flatBox([-w / 2 + 0.01, 0, -0.28], [w / 2 - 0.01, 0.08, 0.24]), 'lacquer_anthracite'),
    A('body', `${k}_doors`, merge(Array.from({ length: n }, (_, i) => roundedBox([-w / 2 + 0.01 + i * dw + 0.002, 0.09, 0.28], [-w / 2 + 0.01 + (i + 1) * dw - 0.002, h - 0.01, 0.3], 0.004, 1))), mat),
    A('body', `${k}_grips`, merge(Array.from({ length: n }, (_, i) => flatBox([-w / 2 + 0.01 + (i + (i % 2 ? 0.12 : 0.88)) * dw - 0.006, h * 0.45, 0.3], [-w / 2 + 0.01 + (i + (i % 2 ? 0.12 : 0.88)) * dw + 0.006, h * 0.6, 0.318]))), gripMat),
  ];
}

/** Postele, noční stolky, skříně, komoda, zrcadlo, koš na prádlo. */
export function bedroom() {
  const one = mk('bedroom', 'bedroom');
  const night = (k, mat) => [A('body', `${k}_body`, roundedBox([-0.24, 0.1, -0.2], [0.24, 0.52, 0.2], 0.01, 1), mat), A('body', `${k}_drawers`, merge([roundedBox([-0.235, 0.12, 0.2], [0.235, 0.3, 0.212], 0.004, 1), roundedBox([-0.235, 0.32, 0.2], [0.235, 0.5, 0.212], 0.004, 1)]), mat), A('body', `${k}_knobs`, merge([0.21, 0.41].map((y) => moved(cylinder(0.009, 0, 0.018, { seg: 8, edge: 0.003, n: 1 }), at(mTranslate(0, y, 0.212), mRotate('x', 90))))), 'brass'), legs(k, 0.46, 0.38, 0.1, mat, 0.012, 0.03)];
  const [w, h] = [1.0, 2.1];
  const wk = 'wardrobe_2_01';
  return [
    one('bed_double_01', 'Manželská postel 160 × 200 cm, ořech, šedé povlečení', bed('bed_double_01', 1.6, 2.0, 'wood_walnut', 'fabric_sofa_grey', 1.0), floor()),
    one('bed_double_02', 'Manželská postel 180 × 200 cm, bílá, modré povlečení', bed('bed_double_02', 1.8, 2.0, 'lacquer_white', 'bedding_blue', 1.05), floor()),
    one('bed_double_03', 'Manželská postel 160 × 200 cm s čalouněným čelem', bed('bed_double_03', 1.6, 2.0, 'fabric_sofa_beige', 'bedding_rose', 1.15), floor()),
    one('bed_single_01', 'Jednolůžko 90 × 200 cm, bříza', bed('bed_single_01', 0.9, 2.0, 'wood_birch', 'bedding_blue', 0.8), floor()),
    one('bed_single_02', 'Jednolůžko 90 × 200 cm, bílé', bed('bed_single_02', 0.9, 2.0, 'lacquer_white', 'bedding_rose', 0.8), floor()),
    one('nightstand_01', 'Noční stolek ořech', night('nightstand_01', 'wood_walnut'), floor()),
    one('nightstand_02', 'Noční stolek bílý', night('nightstand_02', 'lacquer_white'), floor()),
    moving(wk, 'Šatní skříň dvoudveřová (dvířka na pantu)', 'home.bedroom', [
      A('body', `${wk}_body`, flatBox([-w / 2, 0.08, -0.3], [w / 2, h, 0.28]), 'wood_birch'),
      A('body', `${wk}_plinth`, flatBox([-w / 2 + 0.01, 0, -0.28], [w / 2 - 0.01, 0.08, 0.24]), 'lacquer_anthracite'),
      A('body', `${wk}_right`, roundedBox([0.002, 0.09, 0.28], [w / 2 - 0.004, h - 0.01, 0.3], 0.004, 1), 'wood_birch'),
      A('body', `${wk}_rgrip`, flatBox([0.04, h * 0.45, 0.3], [0.052, h * 0.6, 0.318]), 'steel_brushed'),
    ], {
      node: 'door', at: [-w / 2 + 0.004, 0.09, 0.28], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 110, kind: 'door', prompt: 'Otevřít skříň',
      parts: [A('door', `${wk}_door`, roundedBox([0, 0, 0], [w / 2 - 0.006, h - 0.1, 0.02], 0.004, 1), 'wood_birch'), A('door', `${wk}_grip`, flatBox([w / 2 - 0.05, h * 0.36, 0.02], [w / 2 - 0.038, h * 0.51, 0.038]), 'steel_brushed')],
      note: 'Dvířka šatní skříně na pantu (miskový závěs) se otvírají o 95 až 110°; 110°. Úvaha, neměřeno.',
    }, { gen: 'home/bedroom.mjs#bedroom', place: { mount: 'floor' }, group: 'world' }),
    one('wardrobe_3_01', 'Šatní skříň třídveřová ořech', wardrobe('wardrobe_3_01', 1.5, 2.2, 3, 'wood_walnut'), floor()),
    one('wardrobe_sliding_01', 'Šatní skříň s posuvnými dveřmi a zrcadlem', [...wardrobe('wardrobe_sliding_01', 2.0, 2.3, 2, 'lacquer_white'), A('body', 'wardrobe_sliding_01_mirror', flatBox([-0.85, 0.2, 0.3], [-0.15, 2.15, 0.302]), 'steel_chrome'), A('body', 'wardrobe_sliding_01_rail', flatBox([-1.0, 2.24, 0.28], [1.0, 2.29, 0.31]), 'steel_brushed')], floor()),
    one('dresser_01', 'Komoda se šesti zásuvkami', [A('body', 'dresser_01_body', roundedBox([-0.6, 0.1, -0.24], [0.6, 0.9, 0.24], 0.01, 1), 'wood_walnut'), A('body', 'dresser_01_drawers', merge([-1, 1].flatMap((s) => [0.12, 0.38, 0.64].map((y) => roundedBox([s > 0 ? 0.004 : -0.596, y, 0.24], [s > 0 ? 0.596 : -0.004, y + 0.24, 0.252], 0.004, 1)))), 'wood_walnut'), A('body', 'dresser_01_grips', merge([-1, 1].flatMap((s) => [0.24, 0.5, 0.76].map((y) => flatBox([s * 0.3 - 0.06, y - 0.006, 0.252], [s * 0.3 + 0.06, y + 0.006, 0.264])))), 'brass'), legs('dresser_01', 1.18, 0.46, 0.1, 'wood_walnut', 0.015, 0.04)], floor()),
    one('mirror_floor_01', 'Stojací zrcadlo', [A('body', 'mirror_floor_01_frame', moved(roundedBox([-0.3, 0, -0.02], [0.3, 1.7, 0.02], 0.015, 1), at(mTranslate(0, 0.004, 0), mRotate('x', -8))), 'wood_walnut'), A('body', 'mirror_floor_01_glass', moved(flatBox([-0.26, 0.04, 0.02], [0.26, 1.66, 0.023]), at(mTranslate(0, 0.004, 0), mRotate('x', -8))), 'steel_chrome'), A('body', 'mirror_floor_01_stand', tube([[0, 1.2, -0.17], [0, 0.013, -0.32]], 0.012, 6), 'wood_walnut')], floor()),
    one('laundry_basket_01', 'Koš na prádlo', [A('body', 'laundry_basket_01_body', lathe([[0, 0], [0.2, 0, 'c'], [0.22, 0.55], [0.2, 0.55], [0.18, 0.02], [0, 0.02]], { seg: 16 }), 'wood_birch'), A('body', 'laundry_basket_01_laundry', moved(lathe([[0, 0], [0.19, 0, 'c'], [0.12, 0.1, 'c'], [0, 0.12]], { seg: 12 }), mTranslate(0, 0.45, 0)), 'bedding_blue')], floor()),
  ];
}

/** Dětský pokoj: palanda, postýlka, psací stůl, židlička, police s hračkami, truhla, koník, sedací vak, kostky, plyšák. */
export function kids() {
  const one = mk('kids', 'kids');
  const bk = 'bunk_bed_01';
  const posts = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.5 - 0.03, 0, sz * 1.0 - 0.03], [sx * 0.5 + 0.03, 1.7, sz * 1.0 + 0.03])));
  const ladder = [flatBox([0.47, 0.2, 0.5], [0.5, 1.6, 0.53]), flatBox([0.47, 0.2, 0.85], [0.5, 1.6, 0.88]), ...[0.45, 0.75, 1.05, 1.35].map((y) => flatBox([0.47, y, 0.53], [0.5, y + 0.03, 0.85]))];
  const ck = 'crib_01';
  const bars = [];
  for (let i = 0; i <= 12; i++) for (const z of [-0.33, 0.33]) bars.push(flatBox([-0.6 + i * 0.1 - 0.01, 0.35, z - 0.01], [-0.6 + i * 0.1 + 0.01, 0.95, z + 0.01]));
  const tk = 'shelf_toys_01';
  return [
    one(bk, 'Palanda (dvě lůžka nad sebou s žebříkem)', [
      A('body', `${bk}_posts`, merge([...posts, ...ladder]), 'wood_birch'),
      A('body', `${bk}_frames`, merge([0.25, 1.2].map((y) => flatBox([-0.5, y, -1.0], [0.5, y + 0.1, 1.0]))), 'wood_birch'),
      A('body', `${bk}_rail`, merge([flatBox([-0.5, 1.35, 0.94], [0.47, 1.55, 0.97]), flatBox([-0.5, 1.35, -1.0], [0.5, 1.55, -0.97])]), 'wood_birch'),
      A('body', `${bk}_mattresses`, merge([0.35, 1.3].map((y) => roundedBox([-0.46, y, -0.96], [0.46, y + 0.14, 0.96], 0.03, 1))), 'bedding_blue'),
      A('body', `${bk}_pillows`, merge([0.47, 1.42].map((y) => roundedBox([-0.38, y, -0.92], [0.38, y + 0.1, -0.62], 0.04, 1))), 'bedding_white'),
    ], floor()),
    one(ck, 'Dětská postýlka s mřížkami', [
      A('body', `${ck}_frame`, merge([...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.62 - 0.025, 0, sz * 0.35 - 0.025], [sx * 0.62 + 0.025, 0.98, sz * 0.35 + 0.025]))), ...[0.33, 0.95].flatMap((y) => [-1, 1].map((sz) => flatBox([-0.62, y, sz * 0.33 - 0.02], [0.62, y + 0.03, sz * 0.33 + 0.02])))]), 'lacquer_white'),
      A('body', `${ck}_bars`, merge(bars), 'lacquer_white'),
      A('body', `${ck}_mattress`, roundedBox([-0.6, 0.33, -0.33], [0.6, 0.43, 0.33], 0.02, 1), 'bedding_rose'),
      A('body', `${ck}_ends`, merge([-1, 1].map((sx) => flatBox([sx * 0.62 - 0.015, 0.35, -0.33], [sx * 0.62 + 0.015, 0.95, 0.33]))), 'lacquer_white'),
    ], floor()),
    one('desk_kids_01', 'Dětský psací stůl', [A('body', 'desk_kids_01_top', roundedBox([-0.5, 0.6, -0.3], [0.5, 0.63, 0.3], 0.01, 1), 'wood_birch'), A('body', 'desk_kids_01_box', flatBox([0.12, 0.08, -0.28], [0.48, 0.6, 0.28]), 'lacquer_sage'), A('body', 'desk_kids_01_drawers', merge([0.1, 0.27, 0.44].map((y) => roundedBox([0.125, y, 0.28], [0.475, y + 0.15, 0.295], 0.004, 1))), 'toy_yellow'), legs('desk_kids_01', 1.0, 0.6, 0.6, 'wood_birch', 0.018, 0.04)], floor()),
    one('chair_kids_01', 'Dětská židlička', [A('body', 'chair_kids_01_seat', roundedBox([-0.17, 0.33, -0.16], [0.17, 0.36, 0.16], 0.01, 1), 'toy_red'), A('body', 'chair_kids_01_back', roundedBox([-0.16, 0.45, -0.18], [0.16, 0.6, -0.16], 0.01, 1), 'toy_red'), A('body', 'chair_kids_01_posts', merge([-1, 1].map((x) => flatBox([x * 0.13 - 0.012, 0.36, -0.15], [x * 0.13 + 0.012, 0.6, -0.126]))), 'wood_birch'), legs('chair_kids_01', 0.32, 0.32, 0.33, 'wood_birch', 0.012, 0.02)], floor()),
    one(tk, 'Police s hračkami a boxy', [
      A('body', `${tk}_frame`, merge([flatBox([-0.55, 0, -0.18], [-0.53, 1.05, 0.18]), flatBox([0.53, 0, -0.18], [0.55, 1.05, 0.18]), flatBox([-0.02, 0, -0.18], [0.02, 1.05, 0.18]), ...[0, 0.34, 0.68, 1.02].map((y) => flatBox([-0.55, y, -0.18], [0.55, y + 0.03, 0.18]))]), 'lacquer_white'),
      A('body', `${tk}_boxes`, merge([[-0.28, 0.03], [0.28, 0.37]].map(([x, y]) => roundedBox([x - 0.22, y, -0.16], [x + 0.22, y + 0.28, 0.16], 0.02, 1))), 'toy_blue'),
      A('body', `${tk}_boxes2`, merge([[0.28, 0.03], [-0.28, 0.71]].map(([x, y]) => roundedBox([x - 0.22, y, -0.16], [x + 0.22, y + 0.28, 0.16], 0.02, 1))), 'toy_yellow'),
      ...books(tk, -0.5, -0.06, 0.37, -0.15, 0.1, 0.22, 4),
    ], floor()),
    one('chest_toys_01', 'Truhla na hračky', [A('body', 'chest_toys_01_body', roundedBox([-0.4, 0, -0.25], [0.4, 0.42, 0.25], 0.02, 1), 'lacquer_sage'), A('body', 'chest_toys_01_lid', roundedBox([-0.41, 0.42, -0.26], [0.41, 0.46, 0.26], 0.015, 1), 'wood_birch'), A('body', 'chest_toys_01_ball', moved(lathe([[0, -0.08], [0.08, 0], [0, 0.08]], { seg: 10 }), mTranslate(0.25, 0.54, 0.05)), 'toy_red')], floor()),
    one('rocking_horse_01', 'Houpací koník', [
      A('body', 'rocking_horse_01_rockers', merge([-1, 1].map((s) => tube([[s * 0.15, 0.1, -0.45], [s * 0.15, 0.02, 0], [s * 0.15, 0.1, 0.45]], 0.018, 6, { bend: 0.35, bendSeg: 6 }))), 'wood_birch'),
      A('body', 'rocking_horse_01_body', merge([roundedBox([-0.1, 0.3, -0.3], [0.1, 0.45, 0.25], 0.06, 1), moved(roundedBox([-0.07, 0, -0.08], [0.07, 0.25, 0.08], 0.04, 1), at(mTranslate(0, 0.42, 0.25), mRotate('x', 30)))]), 'toy_yellow'),
      A('body', 'rocking_horse_01_legs', merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => tube([[sx * 0.08, 0.32, sz * 0.2], [sx * 0.15, 0.05, sz * 0.28]], 0.015, 6)))), 'wood_birch'),
    ], floor()),
    one('bean_bag_01', 'Sedací vak', [A('body', 'bean_bag_01_bag', lathe([[0, 0], [0.4, 0.02, 'c'], [0.42, 0.18], [0.3, 0.38], [0.12, 0.45], [0, 0.42]], { seg: 16 }), 'fabric_sofa_rust')], floor()),
    one('toy_blocks_01', 'Stavebnice z kostek', [A('body', 'toy_blocks_01_r', merge([[0, 0, 0], [0.06, 0, 0.02], [0.03, 0.05, 0.01]].map(([x, y, z]) => roundedBox([x - 0.025, y, z - 0.025], [x + 0.025, y + 0.05, z + 0.025], 0.004, 1))), 'toy_red'), A('body', 'toy_blocks_01_b', merge([[-0.07, 0, 0.03], [0.12, 0, -0.04]].map(([x, y, z]) => roundedBox([x - 0.025, y, z - 0.025], [x + 0.025, y + 0.05, z + 0.025], 0.004, 1))), 'toy_blue'), A('body', 'toy_blocks_01_y', roundedBox([-0.03, 0.05, -0.04], [0.09, 0.08, 0.0], 0.004, 1), 'toy_yellow')]),
    one('teddy_01', 'Plyšový medvěd', [A('body', 'teddy_01_body', merge([lathe([[0, 0], [0.08, 0.02, 'c'], [0.09, 0.09], [0.06, 0.17, 'c'], [0, 0.19]], { seg: 10 }), moved(lathe([[0, -0.06], [0.06, -0.03, 'c'], [0.065, 0.01], [0.04, 0.05, 'c'], [0, 0.065]], { seg: 10 }), mTranslate(0, 0.24, 0)), ...[-1, 1].map((s) => moved(cylinder(0.022, 0, 0.015, { seg: 8, edge: 0.006, n: 1 }), at(mTranslate(s * 0.045, 0.3, 0), mRotate('x', 90)))), ...[-1, 1].map((s) => moved(cylinder(0.03, 0, 0.1, { seg: 8, edge: 0.012, n: 1 }), at(mTranslate(s * 0.06, 0.03, 0.03), mRotate('x', 80))))]), 'plush_brown')]),
  ];
}
