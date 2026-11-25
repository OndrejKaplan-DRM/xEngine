// Sada kit_home: obývací pokoj. Sedačky (trojsed v pěti potazích, dvojsed, rohová), křesla, taburet, konferenční
// a odkládací stolky, televizní stolky a televize, knihovny s knihami, police, příborník, stojací lampy, pokojové
// rostliny, obrazy, hodiny, zrcadlo, radiátor, pianino a drobnosti na desku. Rozměry podle běžného nábytku
// (sedák 42 až 45 cm, hloubka sedačky 90 cm, konferenční stolek 40 až 45 cm); tvar obecný, bez značek.
// Počátek uprostřed půdorysu na podlaze, čelo +Z; nástěnné kusy mají počátek na líci zdi.

import { simple, staticFloor } from '../lab/common.mjs';
import { A, merge, T, roundedBox, flatBox, slab, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';

const pad = (i) => String(i).padStart(2, '0');
const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, `home.${cat}`, parts, { gen: `home/living.mjs#${f}`, ...o });

/** Nožky nábytku: čtyři kuželíky (dřevo nebo kov) v rozích w × d, výška h. */
export function legs(key, w, d, h, mat, r = 0.018, inset = 0.06) {
  const g = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.push(T(lathe([[r * 0.7, 0], [r, h]], { seg: 8 }), sx * (w / 2 - inset), 0, sz * (d / 2 - inset)));
  return A('body', `${key}_legs`, merge(g), mat);
}

/** Řada knih na polici od x0 do x1 ve výšce y, hloubka v z0–z1; deterministicky podle klíče. */
export function books(key, x0, x1, y, z0, z1, hmax = 0.26, seed = 0) {
  const mats = ['book_red', 'book_blue', 'book_ochre', 'book_green'];
  const by = mats.map(() => []);
  let x = x0;
  let i = seed;
  while (x < x1 - 0.02) {
    const w = 0.02 + ((i * 7) % 5) * 0.006;
    const h = hmax * (0.72 + ((i * 13) % 7) * 0.04);
    if (x + w > x1) break;
    by[i % 4].push(flatBox([x, y, z0 + ((i * 3) % 4) * 0.004], [x + w - 0.002, y + h, z1]));
    x += w;
    i++;
    if (i % 9 === 0) x += 0.05;
  }
  return mats.map((m, k) => (by[k].length ? A('body', `${key}_books_${Math.round(y * 1000)}_${m}`, merge(by[k]), m) : null)).filter(Boolean);
}

const nSeat = (w) => Math.max(1, Math.round((w - 0.32) / 0.6));
const seatW = (w) => (w - 0.3) / nSeat(w);

/** Sedačky: trojsed 210 cm v pěti potazích, dvojsed 160 cm (kůže, šedý), rohová 260 × 170 cm (vlevo, vpravo). */
export function sofas() {
  const one = mk('living', 'sofas');
  const sofa = (k, w, fabric, legMat, arms = [-1, 1]) => [
    A('body', `${k}_base`, roundedBox([-w / 2 + 0.14, 0.1, -0.42], [w / 2 - 0.14, 0.3, 0.44], 0.03, 1), fabric),
    A('body', `${k}_arms`, merge(arms.map((s) => roundedBox([s > 0 ? w / 2 - 0.16 : -w / 2, 0.1, -0.45], [s > 0 ? w / 2 : -w / 2 + 0.16, 0.62, 0.45], 0.05, 1))), fabric),
    A('body', `${k}_back`, roundedBox([-w / 2 + 0.14, 0.1, -0.45], [w / 2 - 0.14, 0.82, -0.27], 0.05, 1), fabric),
    A('body', `${k}_seats`, merge(Array.from({ length: nSeat(w) }, (_, i) => roundedBox([-w / 2 + 0.15 + i * seatW(w) + 0.005, 0.3, -0.28], [-w / 2 + 0.15 + (i + 1) * seatW(w) - 0.005, 0.43, 0.44], 0.045, 1))), fabric),
    A('body', `${k}_cushions`, merge(Array.from({ length: nSeat(w) }, (_, i) => moved(roundedBox([-seatW(w) / 2 + 0.01, 0, -0.07], [seatW(w) / 2 - 0.01, 0.4, 0.07], 0.06, 1), at(mTranslate(-w / 2 + 0.15 + (i + 0.5) * seatW(w), 0.42, -0.22), mRotate('x', -12))))), fabric),
    legs(k, w - 0.1, 0.8, 0.1, legMat, 0.02),
  ];
  const colors = [['fabric_sofa_grey', 'šedý'], ['fabric_sofa_beige', 'béžový'], ['fabric_sofa_blue', 'modrý'], ['fabric_sofa_green', 'zelený'], ['fabric_sofa_rust', 'cihlový']];
  const three = colors.map(([m, n], i) => one(`sofa_3_${pad(i + 1)}`, `Sedačka trojsed 210 cm, ${n} potah`, sofa(`sofa_3_${pad(i + 1)}`, 2.1, m, i % 2 ? 'wood_walnut' : 'plastic_black'), floor()));
  const two = [['leather_brown', 'hnědá kůže', 'steel_chrome'], ['fabric_sofa_grey', 'šedý potah', 'wood_birch']].map(([m, n, l], i) => one(`sofa_2_${pad(i + 1)}`, `Sedačka dvojsed 160 cm, ${n}`, sofa(`sofa_2_${pad(i + 1)}`, 1.6, m, l), floor()));
  const corner = [1, -1].map((side, i) => {
    const k = `sofa_corner_${pad(i + 1)}`;
    const ext = [
      A('body', `${k}_chaise`, roundedBox([side > 0 ? 0.53 : -1.3, 0.1, 0.44], [side > 0 ? 1.3 : -0.53, 0.43, 1.25], 0.045, 1), 'fabric_sofa_grey'),
      A('body', `${k}_chaisearm`, roundedBox([side > 0 ? 1.14 : -1.3, 0.1, 0.44], [side > 0 ? 1.3 : -1.14, 0.62, 1.25], 0.05, 1), 'fabric_sofa_grey'),
    ];
    // područka na straně lenošky odpadá (lenoška má vlastní)
    const base = sofa(k, 2.6, 'fabric_sofa_grey', 'plastic_black', [-side]);
    return one(k, `Rohová sedačka 260 × 170 cm, lenoška ${side > 0 ? 'vpravo' : 'vlevo'}`, [...base, ...ext], floor());
  });
  return [...three, ...two, ...corner];
}

/** Křesla (látka, kůže, ušák), taburet. */
export function armchairs() {
  const one = mk('living', 'armchairs');
  const chair = (k, fabric, legMat, wing) => [
    A('body', `${k}_seat`, roundedBox([-0.3, 0.12, -0.3], [0.3, 0.44, 0.38], 0.05, 1), fabric),
    A('body', `${k}_arms`, merge([-1, 1].map((s) => roundedBox([s * 0.39 - 0.09, 0.12, -0.36], [s * 0.39 + 0.09, 0.62, 0.38], 0.05, 1))), fabric),
    A('body', `${k}_back`, roundedBox([-0.39, 0.12, -0.38], [0.39, wing ? 1.05 : 0.82, -0.22], 0.06, 1), fabric),
    ...(wing ? [A('body', `${k}_wings`, merge([-1, 1].map((s) => roundedBox([s * 0.37 - 0.03, 0.62, -0.36], [s * 0.37 + 0.03, 1.0, -0.05], 0.03, 1))), fabric)] : []),
    legs(k, 0.72, 0.68, 0.12, legMat, 0.018, 0.05),
  ];
  return [
    one('armchair_01', 'Křeslo s látkovým potahem', chair('armchair_01', 'fabric_sofa_beige', 'wood_walnut', false), floor()),
    one('armchair_02', 'Kožené křeslo', chair('armchair_02', 'leather_brown', 'steel_chrome', false), floor()),
    one('armchair_03', 'Ušák (křeslo s vysokým opěradlem)', chair('armchair_03', 'fabric_sofa_green', 'wood_walnut', true), floor()),
    one('footstool_01', 'Taburet', [A('body', 'footstool_01_top', roundedBox([-0.28, 0.12, -0.22], [0.28, 0.42, 0.22], 0.06, 2), 'fabric_sofa_grey'), legs('footstool_01', 0.5, 0.38, 0.12, 'wood_walnut', 0.015, 0.04)], floor()),
  ];
}

/** Stolky: konferenční (ořech s policí, sklo na chromu, bříza), odkládací kulatý. */
export function tables() {
  const one = mk('living', 'tables');
  return [
    one('coffee_table_01', 'Konferenční stolek ořech s policí', [
      A('body', 'coffee_table_01_top', slab(0, 0, 1.2, 0.6, 0.4, 0.44, 0.02, 2, 0.003), 'wood_walnut'),
      A('body', 'coffee_table_01_shelf', flatBox([-0.54, 0.12, -0.24], [0.54, 0.14, 0.24]), 'wood_walnut'),
      legs('coffee_table_01', 1.18, 0.58, 0.4, 'wood_walnut', 0.022, 0.05),
      ...books('coffee_table_01', -0.45, -0.1, 0.14, -0.2, 0.0, 0.06, 3),
    ], floor()),
    one('coffee_table_02', 'Konferenční stolek se skleněnou deskou', [
      A('body', 'coffee_table_02_glass', moved(cylinder(0.45, 0, 0.012, { seg: 24, edge: 0.004, n: 1 }), mTranslate(0, 0.4, 0)), 'glass_tinted'),
      A('body', 'coffee_table_02_frame', merge([torus(0.42, 0.008, 0.395, { seg: 20, n: 3 }), ...[0, 1, 2].map((i) => tube([[Math.cos(i * 2.094) * 0.42, 0.395, Math.sin(i * 2.094) * 0.42], [Math.cos(i * 2.094) * 0.3, 0.012, Math.sin(i * 2.094) * 0.3]], 0.01, 6))]), 'steel_chrome'),
      A('body', 'coffee_table_02_bowl', moved(lathe([[0, 0], [0.05, 0, 'c'], [0.11, 0.06], [0.105, 0.06], [0.045, 0.006], [0, 0.006]], { seg: 16 }), mTranslate(0.1, 0.412, 0)), 'ceramic_white'),
    ], floor()),
    one('coffee_table_03', 'Konferenční stolek bříza', [
      A('body', 'coffee_table_03_top', roundedBox([-0.5, 0.36, -0.3], [0.5, 0.42, 0.3], 0.02, 1), 'wood_birch'),
      A('body', 'coffee_table_03_drawer', flatBox([-0.3, 0.3, 0.27], [0.3, 0.36, 0.3]), 'wood_birch'),
      legs('coffee_table_03', 0.96, 0.56, 0.36, 'wood_birch', 0.02, 0.04),
    ], floor()),
    one('side_table_01', 'Odkládací stolek kulatý', [
      A('body', 'side_table_01_top', cylinder(0.22, 0.52, 0.55, { seg: 20, edge: 0.004, n: 1 }), 'wood_walnut'),
      A('body', 'side_table_01_stem', merge([cylinder(0.025, 0.02, 0.52, { seg: 10 }), lathe([[0, 0], [0.18, 0, 'c'], [0.16, 0.02, 'c'], [0, 0.02]], { seg: 18 })]), 'plastic_black'),
    ], floor()),
  ];
}

/** Televizní stolky, televize, knihovny, police, příborník. */
export function storage() {
  const one = mk('living', 'storage');
  const tvUnit = (k, w, mat) => [
    A('body', `${k}_body`, roundedBox([-w / 2, 0.08, -0.2], [w / 2, 0.48, 0.2], 0.01, 1), mat),
    A('body', `${k}_fronts`, merge(Array.from({ length: 3 }, (_, i) => roundedBox([-w / 2 + 0.01 + (i * (w - 0.02)) / 3 + 0.003, 0.1, 0.2], [-w / 2 + 0.01 + ((i + 1) * (w - 0.02)) / 3 - 0.003, 0.46, 0.215], 0.004, 1))), mat),
    A('body', `${k}_grips`, merge(Array.from({ length: 3 }, (_, i) => flatBox([-w / 2 + ((i + 0.5) * w) / 3 - 0.06, 0.43, 0.215], [-w / 2 + ((i + 0.5) * w) / 3 + 0.06, 0.44, 0.222]))), 'steel_brushed'),
    legs(k, w - 0.04, 0.36, 0.08, 'plastic_black', 0.015, 0.04),
  ];
  const tv = (k, inch, standH) => {
    const w = inch * 0.0254 * 0.872;
    const h = inch * 0.0254 * 0.49;
    return [
      A('body', `${k}_panel`, roundedBox([-w / 2, standH, -0.03], [w / 2, standH + h, 0.0], 0.006, 1), 'lacquer_anthracite'),
      A('body', `${k}_screen`, flatBox([-w / 2 + 0.008, standH + 0.008, 0.0], [w / 2 - 0.008, standH + h - 0.008, 0.0006]), 'hob_glass'),
      A('body', `${k}_stand`, merge([roundedBox([-0.25, 0, -0.12], [0.25, 0.012, 0.08], 0.006, 1), flatBox([-0.03, 0, -0.05], [0.03, standH + 0.1, -0.03])]), 'enamel_steel'),
    ];
  };
  const bookcase = (k, mat) => {
    const sh = [0.02, 0.4, 0.78, 1.16, 1.54, 1.86];
    return [
      A('body', `${k}_sides`, merge([flatBox([-0.4, 0, -0.16], [-0.38, 1.88, 0.16]), flatBox([0.38, 0, -0.16], [0.4, 1.88, 0.16]), flatBox([-0.38, 0, -0.16], [0.38, 1.88, -0.15])]), mat),
      A('body', `${k}_shelves`, merge(sh.map((y) => flatBox([-0.38, y - 0.02, -0.15], [0.38, y, 0.16]))), mat),
      ...sh.slice(0, 4).flatMap((y, i) => books(`${k}_${i}`, -0.37, i % 2 ? 0.2 : 0.37, y, -0.14, 0.1, 0.26, i * 5)),
    ];
  };
  return [
    one('tv_unit_01', 'Televizní stolek ořech 160 cm', tvUnit('tv_unit_01', 1.6, 'wood_walnut'), floor()),
    one('tv_unit_02', 'Televizní stolek bílý 180 cm', tvUnit('tv_unit_02', 1.8, 'lacquer_white'), floor()),
    one('tv_55_01', 'Televize 55" na podstavci', tv('tv_55_01', 55, 0.08)),
    one('tv_65_wall_01', 'Televize 65" na zdi', [
      A('body', 'tv_65_wall_01_bracket', flatBox([-0.15, -0.15, 0], [0.15, 0.15, 0.03]), 'steel_dark'),
      A('body', 'tv_65_wall_01_panel', roundedBox([-0.72, -0.4, 0.03], [0.72, 0.41, 0.06], 0.006, 1), 'lacquer_anthracite'),
      A('body', 'tv_65_wall_01_screen', flatBox([-0.712, -0.392, 0.06], [0.712, 0.402, 0.0606]), 'hob_glass'),
    ], wall(1.1)),
    ...[['wood_walnut', 'ořech'], ['lacquer_white', 'bílá'], ['lacquer_anthracite', 'antracit']].map(([m, n], i) => one(`bookcase_${pad(i + 1)}`, `Knihovna s knihami, ${n}`, bookcase(`bookcase_${pad(i + 1)}`, m), floor())),
    one('shelf_wall_home_01', 'Nástěnná police s knihami a vázou', [
      A('body', 'shelf_wall_home_01_board', flatBox([-0.5, 0, 0], [0.5, 0.025, 0.22]), 'wood_walnut'),
      ...books('shelf_wall_home_01', -0.46, -0.05, 0.025, 0.02, 0.2, 0.22, 2),
      A('body', 'shelf_wall_home_01_vase', moved(lathe([[0, 0], [0.04, 0, 'c'], [0.055, 0.08, 'c'], [0.025, 0.18], [0.03, 0.2], [0, 0.19]], { seg: 14 }), mTranslate(0.25, 0.025, 0.11)), 'ceramic_white'),
    ], wall(1.5)),
    one('sideboard_01', 'Příborník ořech se čtyřmi dvířky', [
      A('body', 'sideboard_01_body', roundedBox([-0.9, 0.12, -0.22], [0.9, 0.82, 0.22], 0.012, 1), 'wood_walnut'),
      A('body', 'sideboard_01_doors', merge(Array.from({ length: 4 }, (_, i) => roundedBox([-0.89 + i * 0.445 + 0.003, 0.14, 0.22], [-0.89 + (i + 1) * 0.445 - 0.003, 0.8, 0.235], 0.004, 1))), 'wood_walnut'),
      A('body', 'sideboard_01_knobs', merge(Array.from({ length: 4 }, (_, i) => moved(cylinder(0.01, 0, 0.02, { seg: 8, edge: 0.003, n: 1 }), at(mTranslate(-0.89 + i * 0.445 + (i % 2 ? 0.04 : 0.405), 0.5, 0.235), mRotate('x', 90))))), 'brass'),
      legs('sideboard_01', 1.76, 0.4, 0.12, 'wood_walnut', 0.02, 0.06),
    ], floor()),
  ];
}
