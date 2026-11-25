// Sada kit_lab: stolní přístroje, 3. část. Tlakové láhve 50 l s redukčním ventilem (barva hrdla podle EN 1089-3),
// Dewarovy nádoby 4, 10 a 35 l, mikroskopy (stereoskopický, invertovaný), sušárna a drobnosti na stůl. Rozměry
// úvahou z praxe a z katalogů; tvar obecný, bez značek. Hladké sítě ze stavebnice appliance.mjs (Ondřej 25. 11. 2026).

import { simple, moving, casing, panel, staticFloor } from './common.mjs';
import { A, shell, door, barHandle, screen, grille, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';
import { vesselGeom, liquidGeom } from './glassware.mjs';

const CAT = 'lab.bench';
const gen = (f) => `lab/bench_c.mjs#${f}`;
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const cylZ = (r, x, y, z0, l, o = {}) => moved(cylinder(r, 0, l, { seg: 10, ...o }), at(mTranslate(x, y, z0), mRotate('x', 90)));

/** Tlaková láhev 50 l s redukčním ventilem a barvou hrdla podle EN 1089-3; Dewarovy nádoby 4, 10 a 35 l. */
export function gasAndCryo() {
  const gases = [['helium', 'Helium', 'paint_brown'], ['nitrogen', 'Dusík', 'iron_black'], ['co2', 'Oxid uhličitý', 'plastic_light'], ['argon', 'Argon', 'paint_green'], ['oxygen', 'Kyslík', 'plastic_white']];
  // tvar láhve je u všech plynů stejný: sítě se sdílí (stejné jméno = stejný uzel v souboru), liší se materiál hrdla
  const R = 0.115;
  const body = lathe([[0, 0.0], [R * 0.85, 0.0, 'c'], [R, 0.03], [R, 1.25], [R * 0.95, 1.31], [R * 0.75, 1.37], [R * 0.4, 1.42, 'c'], [0, 1.43]], { seg: 18 });
  const o = 0.0008; // hrdlo s barvou plynu leží těsně nad tělem láhve
  const shoulder = lathe([[R + o, 1.24], [R + o, 1.25], [R * 0.95 + o, 1.31], [R * 0.75 + o, 1.37], [R * 0.4 + o, 1.42, 'c'], [0.03, 1.4308]], { seg: 18 });
  const valve = merge([
    lathe([[0.03, 1.43], [0.03, 1.47, 'c'], [0.022, 1.475], [0.022, 1.53], [0, 1.53]], { seg: 10 }),
    roundedBox([-0.022, 1.5, -0.018], [0.022, 1.545, 0.018], 0.004, 1),
    moved(cylinder(0.008, 0, 0.03, { seg: 8 }), at(mTranslate(0.022, 1.52, 0), mRotate('z', -90))),
  ]);
  const wheel = merge([moved(torus(0.025, 0.004, 0, { seg: 12, n: 2 }), mTranslate(0, 1.56, 0)), cylinder(0.006, 1.545, 1.562, { seg: 6 }), roundedBox([-0.025, 1.557, -0.003], [0.025, 1.563, 0.003], 0.002, 1)]);
  const reg = merge([
    moved(roundedBox([-0.03, -0.025, -0.025], [0.03, 0.025, 0.025], 0.01, 2), mTranslate(0.075, 1.52, 0)),
    moved(cylinder(0.018, 0, 0.04, { seg: 10, edge: 0.004, n: 1 }), mTranslate(0.075, 1.545, 0)),
    moved(cylinder(0.006, 0, 0.03, { seg: 8 }), at(mTranslate(0.105, 1.51, 0), mRotate('z', -90))),
  ]);
  const gauges = merge([-1, 1].map((s) => moved(cylinder(0.026, 0, 0.014, { seg: 14, edge: 0.003, n: 1 }), at(mTranslate(0.075 + s * 0.028, 1.52, 0.025), mRotate('x', 90)))));
  const dials = merge([-1, 1].map((s) => moved(cylinder(0.021, 0, 0.0005, { seg: 14 }), at(mTranslate(0.075 + s * 0.028, 1.52, 0.039), mRotate('x', 90)))));
  const labelG = lathe([[R + 0.0006, 0.8], [R + 0.0006, 0.98]], { a0: 245, a1: 295, seg: 4 });
  const cylinders = gases.map(([k, name, neck]) => {
    const id = `cylinder_gas_${k}_01`;
    const parts = [
      A('body', 'gascyl_body', body, 'steel_painted'),
      A('body', 'gascyl_shoulder', shoulder, neck),
      A('body', 'gascyl_valve', valve, 'brass'),
      A('body', 'gascyl_wheel', wheel, 'plastic_anthracite'),
      A('body', 'gascyl_reg', reg, 'steel_chrome'),
      A('body', 'gascyl_gauges', gauges, 'steel_chrome'),
      A('body', 'gascyl_dials', dials, 'label_paper'),
      A('body', 'gascyl_label', labelG, 'label_paper'),
    ];
    return simple(id, `Tlaková láhev 50 l: ${name}, s redukčním ventilem`, CAT, parts, { gen: gen('gasAndCryo'), components: staticFloor(), group: 'world' });
  });
  const dewar = [[4, 0.0925, 0.427, 0.0175], [10, 0.131, 0.546, 0.028], [35, 0.239, 0.668, 0.032]].map(([l, r, h, n]) => {
    const k = `dewar_${l}l_01`;
    const seg = l === 35 ? 22 : 18;
    const parts = [
      A('body', `${k}_body`, lathe([[0, 0], [r * 0.9, 0, 'c'], [r, 0.02], [r, h * 0.74], [r * 0.96, h * 0.82], [r * 0.6, h * 0.9], [n + 0.012, h - 0.04, 'c'], [n + 0.012, h - 0.03]], { seg }), 'steel_brushed'),
      A('body', `${k}_foot`, lathe([[r * 0.92, 0], [r * 1.01, 0.004], [r * 1.01, 0.03], [r * 0.99, 0.03]], { seg }), 'rubber_black'),
      A('body', `${k}_cap`, lathe([[0, h - 0.035], [n + 0.016, h - 0.035, 'c'], [n + 0.016, h - 0.005, 'c'], [n * 0.6, h], [0, h + 0.004]], { seg: 14 }), 'plastic_anthracite'),
      A('body', `${k}_handles`, merge([-1, 1].map((s) => tube([[s * r * 0.86, h * 0.84, 0], [s * (r * 0.86 + 0.03), h * 0.86, 0], [s * (r * 0.86 + 0.03), h * 0.93, 0], [s * r * 0.7, h * 0.89, 0]], 0.006, 6, { bend: 0.012, bendSeg: 2 }))), 'steel_dark'),
      A('body', `${k}_label`, lathe([[r + 0.0006, h * 0.45], [r + 0.0006, h * 0.6]], { a0: 250, a1: 290, seg: 3 }), 'label_paper'),
    ];
    return simple(k, `Dewarova nádoba na kapalný dusík ${l} l`, CAT, parts, { gen: gen('gasAndCryo'), components: staticFloor() });
  });
  return [...cylinders, ...dewar];
}

/** Okulár (tubus s očnicí) skloněný o tilt° k pozorovateli, spodek v bodě [x, y, z]. */
const eyepiece = (x, y, z, tilt = 30) => moved(lathe([[0.012, 0], [0.012, 0.05], [0.014, 0.055, 'c'], [0.014, 0.07], [0.009, 0.07], [0, 0.068]], { seg: 8 }), at(mTranslate(x, y, z), mRotate('x', tilt)));

/** Mikroskopy: stereoskopický a invertovaný pro buněčné kultury; sušárna se dvířky. */
export function opticsAndOven() {
  const sk = 'microscope_stereo_01';
  const stereo = one(sk, 'Stereoskopický mikroskop', [
    A('body', `${sk}_base`, roundedBox([-0.12, 0, -0.14], [0.12, 0.035, 0.12], 0.012, 1), 'plastic_white'),
    A('body', `${sk}_stage`, moved(cylinder(0.05, 0, 0.003, { seg: 18 }), mTranslate(0, 0.035, -0.02)), 'glass_frosted'),
    A('body', `${sk}_clips`, merge([-1, 1].map((s) => roundedBox([s * 0.06 - 0.005, 0.035, -0.04], [s * 0.06 + 0.005, 0.04, 0.0], 0.002, 1))), 'steel_chrome'),
    A('body', `${sk}_pillar`, moved(cylinder(0.016, 0, 0.385, { seg: 12 }), mTranslate(0, 0.035, -0.11)), 'steel_chrome'),
    A('body', `${sk}_carrier`, roundedBox([-0.045, 0.22, -0.13], [0.045, 0.29, -0.07], 0.01, 1), 'plastic_white'),
    A('body', `${sk}_knobs`, merge([-1, 1].map((s) => moved(cylinder(0.022, 0, 0.014, { seg: 14, edge: 0.004, n: 1 }), at(mTranslate(s * 0.045, 0.255, -0.1), mRotate('z', s * -90))))), 'plastic_anthracite'),
    A('body', `${sk}_body`, roundedBox([-0.05, 0.25, -0.08], [0.05, 0.32, 0.02], 0.02, 1), 'plastic_white'),
    A('body', `${sk}_objective`, moved(cylinder(0.032, 0, 0.04, { seg: 14, edge: 0.004, n: 1 }), mTranslate(0, 0.21, -0.03)), 'plastic_anthracite'),
    A('body', `${sk}_eyes`, merge([-1, 1].map((s) => eyepiece(s * 0.024, 0.31, -0.01, -35))), 'plastic_anthracite'),
  ], 'opticsAndOven');
  const ik = 'microscope_inverted_01';
  const dish = vesselGeom([[0, 0], [0.045, 0, 0.001], [0.045, 0.012]], { wall: 0.001, seg: 16, lipN: 1 });
  const inverted = one(ik, 'Invertovaný mikroskop pro buněčné kultury', [
    ...casing('body', 0.3, 0.55, 0.2, 'plastic_white'),
    A('body', `${ik}_stage`, roundedBox([-0.13, 0.2, -0.1], [0.13, 0.215, 0.15], 0.004, 1), 'plastic_anthracite'),
    A('body', `${ik}_hole`, moved(cylinder(0.04, 0, 0.0006, { seg: 12 }), mTranslate(0, 0.215, 0.02)), 'glass_tinted'),
    A('body', `${ik}_turret`, moved(lathe([[0, 0], [0.05, 0, 'c'], [0.045, 0.02, 'c'], [0, 0.025]], { seg: 14 }), mTranslate(0, 0.17, 0.02)), 'steel_chrome'),
    A('body', `${ik}_pillar`, roundedBox([-0.04, 0.2, -0.27], [0.04, 0.56, -0.2], 0.015, 1), 'plastic_white'),
    A('body', `${ik}_arm`, roundedBox([-0.05, 0.48, -0.25], [0.05, 0.535, 0.03], 0.015, 1), 'plastic_white'),
    A('body', `${ik}_condenser`, moved(lathe([[0, 0], [0.03, 0, 'c'], [0.03, 0.05], [0.022, 0.06, 'c'], [0, 0.06]], { seg: 12 }), mTranslate(0, 0.42, 0.0)), 'plastic_anthracite'),
    A('body', `${ik}_head`, roundedBox([-0.07, 0.2, 0.17], [0.07, 0.27, 0.3], 0.02, 1), 'plastic_white'),
    A('body', `${ik}_eyes`, merge([-1, 1].map((s) => eyepiece(s * 0.026, 0.265, 0.27, 35))), 'plastic_anthracite'),
    A('body', `${ik}_focus`, merge([-1, 1].map((s) => moved(cylinder(0.03, 0, 0.016, { seg: 10, edge: 0.004, n: 1 }), at(mTranslate(s * 0.15, 0.09, 0.08), mRotate('z', s * -90))))), 'plastic_anthracite'),
    A('body', `${ik}_dish`, T(dish.geom, 0, 0.215, 0.02), 'plastic_ps'),
    A('body', `${ik}_dishlid`, moved(lathe([[0.047, 0.008], [0.047, 0.0135], [0, 0.0135]], { seg: 16 }), mTranslate(0, 0.215, 0.02)), 'plastic_ps'),
    A('body', `${ik}_medium`, T(liquidGeom(dish.inner, 0.006, { seg: 16, flat: true }), 0, 0.215, 0.02), 'liquid_pink'),
  ], 'opticsAndOven');
  const [w, d, h] = [0.6, 0.55, 0.7];
  const ok = 'oven_drying_01';
  const oven = moving(ok, 'Laboratorní sušárna se dvířky', CAT, [
    shell('body', ok, [-w / 2, 0.03, -d / 2], [w / 2, h, d / 2], 'plastic_white', 0.015, 2),
    A('body', `${ok}_feet`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.015, 0, 0.03, { seg: 8 }), mTranslate(sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05)))))), 'rubber_black'),
    A('body', `${ok}_gasket`, merge([flatBox([-w / 2 + 0.03, 0.05, d / 2 - 0.004], [w / 2 - 0.03, 0.062, d / 2 + 0.001]), flatBox([-w / 2 + 0.03, h - 0.142, d / 2 - 0.004], [w / 2 - 0.03, h - 0.13, d / 2 + 0.001])]), 'rubber_black'),
    ...screen('body', `${ok}_scr`, -0.25, 0.05, h - 0.1, h - 0.02, d / 2, { buttons: 4, led: 'emit_green' }),
    ...grille('body', `${ok}_v`, 0.1, 0.26, h - 0.1, h - 0.02, d / 2, 4),
    A('body', `${ok}_vent`, moved(cylinder(0.025, 0, 0.03, { seg: 12, edge: 0.004, n: 1 }), mTranslate(0.15, h, -0.1)), 'steel_brushed'),
  ], {
    node: 'door', at: [-w / 2 + 0.02, 0.04, d / 2], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 120, kind: 'door', prompt: 'Otevřít sušárnu',
    parts: [
      ...door('door', `${ok}_door`, 0, w - 0.04, 0, h - 0.15, 0.002, 0.038, { mat: 'plastic_white', window: [w * 0.18, h * 0.16], glass: 'glass_tinted', r: 0.01 }),
      barHandle('door', `${ok}_door`, w - 0.09, h * 0.25, h * 0.45, 0.04, { rad: 0.009, off: 0.03 }),
      A('door', `${ok}_hinges`, merge([0.06, h - 0.22].map((y) => moved(cylinder(0.008, 0, 0.06, { seg: 8 }), mTranslate(-0.004, y, 0.02)))), 'steel_brushed'),
    ],
    note: 'Dvířka stolní sušárny na levém pantu se otevírají o 90 až 180°, v laboratoři obvykle ke zdi; 120°. Úvaha, neměřeno.',
  }, { gen: gen('opticsAndOven') });
  return [stereo, inverted, oven];
}

/** Drobnosti: počítač buněk, minutka, tiskárna štítků, minicentrifuga, odpadní nádoba se sáčkem na špičky. */
export function smallDevices() {
  const ck = 'cell_counter_01';
  const tk = 'timer_lab_01';
  const lk = 'printer_label_01';
  const mk = 'minicentrifuge_01';
  const bk = 'bin_tips_01';
  return [
    one(ck, 'Automatický počítač buněk', [
      A('body', `${ck}_body`, roundedBox([-0.09, 0.004, -0.11], [0.09, 0.174, 0.11], 0.02, 2), 'plastic_white'),
      A('body', `${ck}_face`, moved(flatBox([-0.075, 0, -0.06], [0.075, 0.0008, 0.06]), at(mTranslate(0, 0.12, 0.11), mRotate('x', 90))), 'plastic_anthracite'),
      A('body', `${ck}_lcd`, moved(flatBox([-0.065, 0, -0.04], [0.065, 0.0008, 0.04]), at(mTranslate(0, 0.13, 0.1108), mRotate('x', 90))), 'emit_display'),
      A('body', `${ck}_slot`, roundedBox([-0.035, 0.03, 0.105], [0.035, 0.045, 0.115], 0.003, 1), 'plastic_anthracite'),
    ], 'smallDevices'),
    one(tk, 'Laboratorní minutka', [
      A('body', `${tk}_body`, roundedBox([-0.035, 0, -0.012], [0.035, 0.07, 0.012], 0.008, 2), 'plastic_white'),
      A('body', `${tk}_lcd`, flatBox([-0.028, 0.035, 0.012], [0.028, 0.062, 0.0126]), 'emit_display'),
      A('body', `${tk}_keys`, merge([-0.018, 0, 0.018].map((x) => moved(cylinder(0.006, 0, 0.003, { seg: 8 }), at(mTranslate(x, 0.018, 0.012), mRotate('x', 90))))), 'plastic_light'),
    ], 'smallDevices'),
    one(lk, 'Tiskárna štítků', [
      A('body', `${lk}_body`, roundedBox([-0.06, 0.004, -0.1], [0.06, 0.15, 0.1], 0.02, 2), 'plastic_anthracite'),
      A('body', `${lk}_window`, flatBox([-0.045, 0.1, 0.0995], [0.045, 0.14, 0.1]), 'glass_tinted'),
      A('body', `${lk}_slot`, flatBox([-0.045, 0.08, 0.099], [0.045, 0.085, 0.101]), 'plastic_black'),
      A('body', `${lk}_label`, moved(flatBox([-0.04, 0, 0], [0.04, 0.0005, 0.035]), at(mTranslate(0, 0.0825, 0.1), mRotate('x', 10))), 'label_paper'),
      A('body', `${lk}_btn`, moved(cylinder(0.008, 0, 0.004, { seg: 10 }), mTranslate(0.03, 0.15, 0.06)), 'emit_green'),
    ], 'smallDevices'),
    one(mk, 'Minicentrifuga', [
      A('body', `${mk}_body`, lathe([[0, 0.004], [0.07, 0.004, 'c'], [0.072, 0.02], [0.068, 0.08, 'c'], [0.064, 0.082], [0, 0.082]], { seg: 20 }), 'plastic_white'),
      A('body', `${mk}_lid`, lathe([[0.064, 0.082], [0.064, 0.09, 'c'], [0.05, 0.11, 'c'], [0, 0.114]], { seg: 20 }), 'plastic_ps'),
      A('body', `${mk}_rotor`, lathe([[0, 0.082], [0.045, 0.082, 'c'], [0.035, 0.1], [0, 0.1]], { seg: 12 }), 'plastic_anthracite'),
      A('body', `${mk}_feet`, merge([0, 1, 2, 3].map((i) => moved(cylinder(0.008, 0, 0.004, { seg: 6 }), mTranslate(Math.cos(i * 1.571) * 0.05, 0, Math.sin(i * 1.571) * 0.05)))), 'rubber_black'),
    ], 'smallDevices'),
    one(bk, 'Odpadní nádobka na špičky', [
      A('body', `${bk}_bin`, roundedBox([-0.07, 0, -0.07], [0.07, 0.15, 0.07], 0.012, 2), 'plastic_hdpe'),
      A('body', `${bk}_lid`, roundedBox([-0.075, 0.148, -0.075], [0.075, 0.162, 0.075], 0.006, 2), 'plastic_orange'),
      A('body', `${bk}_hole`, moved(cylinder(0.03, 0, 0.0006, { seg: 14 }), mTranslate(0, 0.162, 0)), 'plastic_black'),
    ], 'smallDevices'),
  ];
}
