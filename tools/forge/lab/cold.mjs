// Sada kit_lab: chlazení a mrazení. Mrazák −80 °C podle katalogu (šířky 86,4, 100,6 a 114,8 cm, hloubka 95,5 cm,
// výška 198,1 cm; tools/forge/lab/ROZMERY.md), ostatní úvaha z praxe. Ondřej: „Komorový mrazák s pentlicí“ = chladicí
// komora s pásovou clonou za dveřmi. Dvířka mají kloub se zdůvodněním.

import { cbox } from '../lib.mjs';
import { A, shell, door, barHandle, lock, grille, screen, feet, plinth, wireShelf, hinges, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';
import { simple, moving, panel, vessel, staticFloor } from './common.mjs';

const CAT = 'lab.cold';
const gen = (f) => `lab/cold.mjs#${f}`;
const FLOOR = { mount: 'floor' };

/**
 * Skříň s dvířky na levém pantu (lednice, mrazák): dutý plášť se zaoblenými hranami (dvířka odhalí vnitřek),
 * sokl s mřížkou kompresoru, stavitelné nožky, dvířka s těsněním, dlouhé madlo, zámek a panty; uvnitř drátěné
 * rošty, u mrazáku −80 °C vnitřní izolovaná dvířka. o.glass = prosklená dvířka, o.panel = ovládací panel nad dvířky.
 */
function upright(id, title, w, d, h, o) {
  const k = id;
  const mat = o.mat || 'plastic_white';
  const pl = 0.09; // sokl
  const t = 0.06; // dvířka
  const zf = d / 2 - t - 0.004; // čelo pláště
  const wall = 0.05;
  const top = o.panel ? h - 0.14 : h;
  const body = [
    shell('body', `${k}_l`, [-w / 2, pl, -d / 2], [-w / 2 + wall, h, zf], mat, 0.01),
    shell('body', `${k}_r`, [w / 2 - wall, pl, -d / 2], [w / 2, h, zf], mat, 0.01),
    shell('body', `${k}_t`, [-w / 2 + wall - 0.002, top - wall, -d / 2], [w / 2 - wall + 0.002, h, zf], mat, 0.01),
    A('body', `${k}_bb`, merge([flatBox([-w / 2 + wall, pl, -d / 2], [w / 2 - wall, pl + wall, zf]), flatBox([-w / 2 + wall, pl, -d / 2], [w / 2 - wall, h, -d / 2 + wall])]), mat),
    // vnitřek (bílá vana) a rošty
    A('body', `${k}_liner`, merge([flatBox([-w / 2 + wall, pl + wall, -d / 2 + wall], [w / 2 - wall, pl + wall + 0.002, zf - 0.01]), flatBox([-w / 2 + wall, pl + wall, -d / 2 + wall], [w / 2 - wall, top - wall, -d / 2 + wall + 0.002])]), 'liner_white'),
    plinth('body', k, w, d, pl, 0.07),
    ...grille('body', `${k}_kick`, -w / 2 + 0.06, w / 2 - 0.06, 0.02, pl - 0.015, d / 2 - 0.069, 5),
  ]; // nožky schová sokl
  const inner = (top - wall) - (pl + wall);
  const shelves = 3;
  for (let i = 1; i <= shelves; i++) {
    const y = pl + wall + (i * inner) / (shelves + 1);
    if (o.ult) continue; // mrazák −80 °C má místo roštů vnitřní dvířka
    else body.push(wireShelf('body', k, -w / 2 + wall + 0.01, w / 2 - wall - 0.01, -d / 2 + wall + 0.02, zf - 0.03, y));
  }
  if (o.ult) {
    // vnitřní izolovaná dvířka (pět oddílů) s malými knoflíky
    const doors = [];
    const knobs = [];
    for (let i = 0; i < 5; i++) {
      const y0 = pl + wall + 0.01 + (i * (inner - 0.02)) / 5;
      const y1 = y0 + (inner - 0.02) / 5 - 0.008;
      doors.push(flatBox([-w / 2 + wall + 0.012, y0, zf - 0.03], [w / 2 - wall - 0.012, y1, zf - 0.008]));
      knobs.push(moved(cylinder(0.012, 0, 0.02, { seg: 6 }), at(mTranslate(w / 2 - wall - 0.06, (y0 + y1) / 2, zf - 0.008), mRotate('x', 90))));
    }
    body.push(A('body', `${k}_innerdoors`, merge(doors), 'liner_white'), A('body', `${k}_innerknobs`, merge(knobs), 'plastic_light'));
  }
  if (o.panel) {
    body.push(shell('body', `${k}_head`, [-w / 2, h - 0.14, zf - 0.02], [w / 2, h, d / 2], mat, 0.012));
    body.push(...screen('body', `${k}_scr`, -w / 2 + 0.06, -w / 2 + 0.26, h - 0.115, h - 0.03, d / 2, { buttons: o.ult ? 4 : 0, led: 'emit_green' }));
    if (o.ult) body.push(...grille('body', `${k}_hv`, w / 2 - 0.3, w / 2 - 0.06, h - 0.11, h - 0.035, d / 2, 4));
  }
  const dh = top - pl - 0.006; // výška dvířek
  const dw = w - 0.008;
  const leaf = door('door', `${k}_door`, 0, dw, 0, dh, 0, t, { mat, gasket: true, window: o.glass ? [0.07, 0.08] : null, glass: 'glass_tinted' });
  const parts = [
    ...leaf,
    barHandle('door', `${k}_door`, dw - 0.06, dh * 0.35, dh * 0.75, t, { rad: 0.011, off: 0.045 }),
    ...lock('door', `${k}_door`, dw - 0.06, dh * 0.3, t),
  ];
  if (o.ult) parts.push(A('door', `${k}_latch`, flatBox([dw - 0.1, dh * 0.45, t], [dw - 0.02, dh * 0.62, t + 0.03]), 'plastic_light'));
  // za sklem je vidět obsah: lahve a krabice na roštech
  if (o.glass) for (let i = 1; i <= 2; i++) body.push(A('body', `${k}_stock_${i}`, merge([0, 1, 2, 3].map((j) => (j % 2 ? T(cylinder(0.035, 0, 0.17 - (i % 2) * 0.04, { seg: 7 }), -w / 2 + 0.13 + j * ((w - 0.26) / 3), pl + wall + (i * inner) / (shelves + 1) + 0.004, -0.04) : flatBox([-w / 2 + 0.09 + j * ((w - 0.26) / 3), pl + wall + (i * inner) / (shelves + 1) + 0.004, -0.12], [-w / 2 + 0.17 + j * ((w - 0.26) / 3), pl + wall + (i * inner) / 5 + 0.1, 0.0])))), i % 2 ? 'plastic_hdpe' : 'paper_kraft'));
  body.push(hinges('body', `${k}_hng`, -w / 2 + 0.009, [pl + 0.12, top - 0.12], d / 2 - t / 2));
  return moving(id, title, CAT, body, {
    node: 'door', at: [-w / 2 + 0.004, pl + 0.003, zf + 0.004], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: o.max || 110, kind: 'door', prompt: o.prompt,
    parts,
    note: o.note,
  }, { gen: gen(o.fn), place: FLOOR, group: 'world', colliders: [cbox('body', [-w / 2, 0, -d / 2], [w / 2, h, zf])] });
}

/** Mrazáky −80 °C ve třech šířkách (500, 600 a 700 krabic), laboratorní lednice (plná a prosklená), mrazák −20 °C, podstolová lednice. */
export function uprights() {
  const ult = [[0.864, '500'], [1.006, '600'], [1.148, '700']].map(([w, n], v) =>
    upright(`freezer_ult_${String(v + 1).padStart(2, '0')}`, `Mrazák −80 °C na ${n} krabic`, w, 0.955, 1.981, { panel: true, ult: true, fn: 'uprights', prompt: 'Otevřít mrazák', max: 120, note: 'Vnější dveře mrazáku −80 °C se otvírají o 90 až 180°, uvnitř jsou ještě vnitřní dvířka; 120°. Úvaha podle katalogu výrobce, neměřeno.' }),
  );
  const note = 'Dveře laboratorní lednice nebo mrazáku na pantu se otvírají asi o 110 až 130°; 115°. Úvaha, neměřeno.';
  return [
    ...ult,
    upright('fridge_lab_tall_01', 'Laboratorní lednice', 0.6, 0.65, 1.85, { inner: true, fn: 'uprights', prompt: 'Otevřít lednici', max: 115, note }),
    upright('fridge_lab_glass_01', 'Laboratorní lednice s prosklenými dveřmi', 0.6, 0.65, 1.85, { inner: true, glass: true, fn: 'uprights', prompt: 'Otevřít lednici', max: 115, note }),
    upright('freezer_lab_20_01', 'Laboratorní mrazák −20 °C', 0.6, 0.65, 1.85, { inner: true, panel: true, mat: 'plastic_light', fn: 'uprights', prompt: 'Otevřít mrazák', max: 115, note }),
    upright('fridge_undercounter_01', 'Podstolová lednice', 0.6, 0.6, 0.82, { inner: true, fn: 'uprights', prompt: 'Otevřít lednici', max: 115, note }),
  ];
}

/** Truhlicový mrazák −80 °C s víkem a zásobník kapalného dusíku na pojízdném podstavci. */
export function chestAndLn2() {
  const [w, d, h] = [1.6, 0.8, 0.95];
  const ck = 'freezer_chest_ult_01';
  const chest = moving(ck, 'Truhlicový mrazák −80 °C', CAT, [
    shell('body', ck, [-w / 2, 0.08, -d / 2], [w / 2, h, d / 2], 'plastic_white', 0.02),
    plinth('body', ck, w, d, 0.08, 0.06, 'plastic_anthracite'),
    ...grille('body', `${ck}_kick`, -w / 2 + 0.05, -w / 2 + 0.55, 0.012, 0.07, d / 2 - 0.06, 5),
    ...panel('body', d / 2, w / 2 - 0.4, w / 2 - 0.05, h - 0.2, h - 0.08, 3),
    ...lock('body', ck, -w / 2 + 0.15, h - 0.12, d / 2),
    A('body', `${ck}_port`, moved(cylinder(0.025, 0, 0.03, { seg: 10, edge: 0.005, n: 1 }), at(mTranslate(-w / 2, 0.6, 0), mRotate('z', 90))), 'plastic_anthracite'),
  ], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 80, kind: 'door', prompt: 'Otevřít víko mrazáku',
    parts: [
      A('lid', `${ck}_lid`, roundedBox([-w / 2, 0.006, 0], [w / 2, 0.1, d], 0.02, 1), 'plastic_white'),
      A('lid', `${ck}_gasket`, flatBox([-w / 2 + 0.02, 0, 0.02], [w / 2 - 0.02, 0.006, d - 0.02]), 'rubber_black'),
      A('lid', `${ck}_handle`, tube([[-0.3, 0.05, d], [-0.3, 0.05, d + 0.035], [0.3, 0.05, d + 0.035], [0.3, 0.05, d]], 0.01, 8, { bend: 0.02, bendSeg: 2 }), 'steel_brushed'),
      A('lid', `${ck}_hinges`, merge([-0.5, 0.5].map((x) => roundedBox([x - 0.05, 0.02, -0.02], [x + 0.05, 0.08, 0.01], 0.006, 1))), 'steel_brushed'),
    ],
    note: 'Víko truhlicového mrazáku na zadních pantech s vyvážením zůstane stát v otevřené poloze asi 80°; 80°. Úvaha, neměřeno.',
  }, { gen: gen('chestAndLn2'), place: FLOOR, group: 'world' });
  const tk = 'tank_ln2_storage_01';
  const tank = simple(tk, 'Zásobník kapalného dusíku na pojízdném podstavci', CAT, [
    A('body', `${tk}_dolly`, lathe([[0, 0.06], [0.4, 0.06, 'c'], [0.4, 0.12, 'c'], [0.36, 0.12], [0, 0.12]], { seg: 20 }), 'steel_dark'),
    A('body', `${tk}_casters`, merge([0, 1, 2, 3].map((i) => moved(torus(0.03, 0.012, 0, { seg: 10, n: 3 }), at(mTranslate(Math.cos(i * 1.571 + 0.785) * 0.32, 0.042, Math.sin(i * 1.571 + 0.785) * 0.32), mRotate('z', 90))))), 'rubber_black'),
    A('body', `${tk}_forks`, merge([0, 1, 2, 3].map((i) => moved(flatBox([-0.018, 0, -0.018], [0.018, 0.06, 0.018]), mTranslate(Math.cos(i * 1.571 + 0.785) * 0.32, 0.03, Math.sin(i * 1.571 + 0.785) * 0.32)))), 'steel_brushed'),
    A('body', `${tk}_body`, lathe([[0, 0.12], [0.33, 0.12, 'c'], [0.34, 0.14], [0.34, 0.85], [0.3, 0.95], [0.2, 1.0, 'c'], [0.16, 1.03], [0.16, 1.05], [0, 1.05]], { seg: 24 }), 'steel_brushed'),
    A('body', `${tk}_cap`, lathe([[0, 1.05], [0.17, 1.05, 'c'], [0.17, 1.12, 'c'], [0.12, 1.13], [0, 1.13]], { seg: 16 }), 'plastic_anthracite'),
    A('body', `${tk}_valves`, merge([-1, 1].map((s) => moved(cylinder(0.02, 0, 0.05, { seg: 8, edge: 0.004, n: 1 }), mTranslate(s * 0.22, 0.97, 0.1)))), 'brass'),
    A('body', `${tk}_monitor`, roundedBox([-0.08, 0.55, 0.33], [0.08, 0.7, 0.36], 0.008, 1), 'plastic_anthracite'),
    A('body', `${tk}_lcd`, flatBox([-0.06, 0.6, 0.36], [0.06, 0.66, 0.3605]), 'emit_display'),
    A('body', `${tk}_label`, lathe([[0.3406, 0.3], [0.3406, 0.45]], { a0: 250, a1: 290, seg: 3 }), 'label_paper'),
  ], { gen: gen('chestAndLn2'), components: staticFloor(), group: 'world' });
  return [chest, tank];
}

/**
 * Chladicí a mrazicí komora (prefabrikovaná, 2,0 × 2,0 × 2,3 m) s dveřmi a pásovou clonou za nimi, uvnitř regály.
 * Varianty: chladicí +4 °C (bílá) a mrazicí −20 °C (šedá). Clona je z průhledných pásů PVC.
 */
export function walkIns() {
  return [['coldroom_walkin_01', 'Chladicí komora +4 °C s pásovou clonou', 'plastic_white'], ['freezer_walkin_01', 'Mrazicí komora −20 °C s pásovou clonou', 'plastic_light']].map(([id, title, mat]) => {
    const [w, d, h, t] = [2.0, 2.0, 2.3, 0.1];
    const walls = [[[-w / 2, 0, -d / 2], [-w / 2 + t, h, d / 2]], [[w / 2 - t, 0, -d / 2], [w / 2, h, d / 2]], [[-w / 2, 0, -d / 2], [w / 2, h, -d / 2 + t]], [[-w / 2, h - t, -d / 2], [w / 2, h, d / 2]], [[-w / 2 + t, 0, d / 2 - t], [-0.45, h - t, d / 2]], [[0.45, 0, d / 2 - t], [w / 2 - t, h - t, d / 2]], [[-0.45, 2.0, d / 2 - t], [0.45, h - t, d / 2]]];
    const strips = [];
    for (let i = 0; i < 6; i++) strips.push(flatBox([-0.42 + i * 0.14, 0.04, d / 2 - t - 0.031], [-0.3 + i * 0.14, 1.98, d / 2 - t - 0.027]));
    const shelves = [];
    for (const z of [-0.55, 0.15]) for (let k = 0; k < 4; k++) shelves.push(flatBox([-w / 2 + t + 0.02, 0.3 + k * 0.45, z - 0.25], [-w / 2 + t + 0.5, 0.33 + k * 0.45, z + 0.25]));
    for (let k = 0; k < 4; k++) shelves.push(flatBox([w / 2 - t - 0.5, 0.3 + k * 0.45, -0.8], [w / 2 - t - 0.02, 0.33 + k * 0.45, 0.4]));
    const posts = [];
    for (const [x, z] of [[-w / 2 + t + 0.03, -0.79], [-w / 2 + t + 0.49, -0.79], [-w / 2 + t + 0.03, 0.39], [-w / 2 + t + 0.49, 0.39], [w / 2 - t - 0.03, -0.79], [w / 2 - t - 0.49, -0.79], [w / 2 - t - 0.03, 0.39], [w / 2 - t - 0.49, 0.39]]) posts.push(flatBox([x - 0.012, 0.02, z - 0.012], [x + 0.012, 1.9, z + 0.012]));
    const boxesA = [];
    const boxesB = [];
    for (let k = 0; k < 4; k++) (k % 2 ? boxesA : boxesB).push(flatBox([w / 2 - t - 0.4, 0.33 + k * 0.45, -0.6], [w / 2 - t - 0.1, 0.51 + k * 0.45, -0.2]));
    const body = [
      A('body', `${id}_walls`, merge(walls.map(([a, b]) => flatBox(a, b))), mat),
      A('body', `${id}_trim`, merge([flatBox([-0.47, 0, d / 2], [-0.45, 2.02, d / 2 + 0.01]), flatBox([0.45, 0, d / 2], [0.47, 2.02, d / 2 + 0.01]), flatBox([-0.47, 2.0, d / 2], [0.47, 2.02, d / 2 + 0.01])]), 'steel_brushed'),
      A('body', `${id}_floor`, flatBox([-w / 2 + t, 0, -d / 2 + t], [w / 2 - t, 0.02, d / 2 - t]), 'metal_floor'),
      ...panel('body', d / 2, 0.55, 0.85, 1.4, 1.6, 2),
      A('body', `${id}_lamp`, flatBox([-0.5, 2.05, d / 2], [-0.3, 2.12, d / 2 + 0.01]), 'emit_green'),
      A('body', `${id}_curtain`, merge(strips), 'plastic_ps'),
      A('body', `${id}_rail`, flatBox([-0.47, 1.98, d / 2 - t - 0.04], [0.47, 2.0, d / 2 - t - 0.02]), 'steel_brushed'),
      A('body', `${id}_shelves`, merge([...shelves, ...posts]), 'steel_brushed'),
      A('body', `${id}_boxes_w`, merge(boxesA), 'plastic_white'),
      A('body', `${id}_boxes_k`, merge(boxesB), 'paper_kraft'),
      A('body', `${id}_unit`, roundedBox([-0.6, h - t - 0.35, -d / 2 + t], [0.6, h - t - 0.02, -d / 2 + t + 0.35], 0.015, 1), 'plastic_light'),
      ...grille('body', `${id}_fan`, -0.5, 0.5, h - t - 0.32, h - t - 0.05, -d / 2 + t + 0.35, 6),
    ];
    return moving(id, title, CAT, body, {
      node: 'door', at: [-0.45, 0.0, d / 2], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 100, kind: 'door', prompt: 'Otevřít komoru',
      parts: [
        A('door', `${id}_leaf`, roundedBox([0, 0.01, 0], [0.9, 1.99, 0.09], 0.012, 1), mat),
        A('door', `${id}_gasket`, merge([flatBox([0.02, 0.03, -0.004], [0.88, 0.045, 0]), flatBox([0.02, 1.955, -0.004], [0.88, 1.97, 0])]), 'rubber_black'),
        barHandle('door', id, 0.8, 0.85, 1.15, 0.09, { rad: 0.012, off: 0.045 }),
        ...lock('door', id, 0.8, 0.75, 0.09),
        A('door', `${id}_hinges`, merge([0.25, 1.75].map((y) => roundedBox([-0.01, y, 0.06], [0.06, y + 0.12, 0.1], 0.006, 1))), 'steel_brushed'),
      ],
      note: 'Izolované dveře chladicí komory se otvírají ven o 90 až 110°, za nimi visí pásová clona z PVC; 100°. Úvaha, neměřeno.',
    }, { gen: gen('walkIns'), place: FLOOR, group: 'world', colliders: walls.map(([a, b]) => cbox('body', a, b)) }); // stěny a strop; dovnitř se dá vejít, clona nekoliduje
  });
}

export const COLD = [uprights, chestAndLn2, walkIns];
