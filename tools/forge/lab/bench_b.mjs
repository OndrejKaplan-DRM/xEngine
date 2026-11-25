// Sada kit_lab: stolní přístroje, 2. část (elektroforéza, pipety, vývěvy a lázně, odparka, tlakové láhve a Dewarovy
// nádoby, mikroskopy a sušárna, drobnosti). Rozměry úvahou z praxe a z katalogů (ROZMERY.md); tvar obecný, bez
// značek. Počátek ve středu půdorysu na desce stolu (u lahví na podlaze), čelo do +Z. Hladké sítě z appliance.mjs.

import { simple, moving, casing, panel, staticFloor } from './common.mjs';
import { meshPart } from '../mesh/registry.mjs';
import { A, shell, door, barHandle, screen, knob, grille, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';
import { vesselGeom, liquidGeom } from './glassware.mjs';
import { roundFlaskGeom } from './glass.mjs';
import { gasAndCryo, opticsAndOven, smallDevices } from './bench_c.mjs';

const CAT = 'lab.bench';
const gen = (f) => `lab/bench_b.mjs#${f}`;
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
/** Válec ležící podél osy z (čelo), střed v [x, y, z0] až z0 + l. */
const cylZ = (r, x, y, z0, l, o = {}) => moved(cylinder(r, 0, l, { seg: 10, ...o }), at(mTranslate(x, y, z0), mRotate('x', 90)));
/** Válec ležící podél osy x od x0 do x0 + l ve výšce y, hloubce z. */
const cylX = (r, x0, y, z, l, o = {}) => moved(cylinder(r, 0, l, { seg: 10, ...o }), at(mTranslate(x0, y, z), mRotate('z', -90)));

/** Kádinka (sklo s lemem a odleskem) s kapalinou, dno ve [x, y, z]; r a h v metrech, fill podíl výšky. */
export function beakerAt(k, x, y, z, r, h, fill = 0, liquid = null, seg = 14) {
  const v = vesselGeom([[0, 0], [r, 0, Math.max(0.002, r * 0.12)], [r, h - 0.004, 0.003], [r + 0.0012, h]], { wall: 0.0015, seg, lipN: 2 });
  const out = [A('body', `${k}_beaker`, T(v.geom, x, y, z), 'glass_lab')];
  if (fill > 0 && liquid) out.push(A('body', `${k}_beakerliq`, T(liquidGeom(v.inner, h * fill, { seg, flat: true }), x, y, z), liquid));
  return out;
}

/** Zdířka (banánek) na čele nebo na víku: krátký válec ve směru osy y. */
const socket = (x, y, z, r = 0.006, h = 0.012) => moved(cylinder(r, 0, h, { seg: 8, edge: 0.0015, n: 1 }), mTranslate(x, y, z));

/** Elektroforéza: horizontální vana s gelem, vertikální vana, zdroj napětí; elektroporátor; transiluminátor UV s krytem; dokumentace gelů; ruční UV lampa. */
export function electrophoresis() {
  const hk = 'electrophoresis_horizontal_01';
  const tank = one(hk, 'Horizontální elektroforéza s gelem', [
    A('body', `${hk}_tank`, roundedBox([-0.13, 0, -0.07], [0.13, 0.065, 0.07], 0.006, 1), 'plastic_ps'),
    A('body', `${hk}_buffer`, flatBox([-0.122, 0.006, -0.062], [0.122, 0.05, 0.062]), 'liquid_water'),
    A('body', `${hk}_gel`, flatBox([-0.06, 0.035, -0.05], [0.06, 0.044, 0.05]), 'glass_frosted'),
    A('body', `${hk}_wells`, merge([0, 1].map((r) => flatBox([-0.05, 0.0442, -0.035 + r * 0.04], [0.05, 0.0445, -0.03 + r * 0.04]))), 'plastic_anthracite'),
    A('body', `${hk}_lid`, roundedBox([-0.132, 0.065, -0.072], [0.132, 0.075, 0.072], 0.004, 1), 'plastic_ps'),
    A('body', `${hk}_red`, merge([socket(-0.12, 0.075, 0.05)]), 'cap_red'),
    A('body', `${hk}_black`, merge([socket(-0.12, 0.075, -0.05)]), 'plastic_anthracite'),
    A('body', `${hk}_lead_r`, tube([[-0.12, 0.087, 0.05], [-0.12, 0.11, 0.05], [-0.16, 0.12, 0.08], [-0.2, 0.004, 0.1]], 0.0025, 4, { bend: 0.03, bendSeg: 2 }), 'cap_red'),
    A('body', `${hk}_lead_b`, tube([[-0.12, 0.087, -0.05], [-0.12, 0.11, -0.05], [-0.17, 0.11, 0.0], [-0.2, 0.004, 0.06]], 0.0025, 4, { bend: 0.03, bendSeg: 2 }), 'plastic_anthracite'),
  ], 'electrophoresis');
  const vk = 'electrophoresis_vertical_01';
  const vert = one(vk, 'Vertikální elektroforéza (SDS-PAGE)', [
    A('body', `${vk}_tank`, roundedBox([-0.08, 0, -0.06], [0.08, 0.17, 0.06], 0.006, 1), 'plastic_ps'),
    A('body', `${vk}_buffer`, flatBox([-0.072, 0.006, -0.052], [0.072, 0.08, 0.052]), 'liquid_water'),
    A('body', `${vk}_core`, roundedBox([-0.055, 0.02, -0.018], [0.055, 0.15, 0.018], 0.004, 1), 'plastic_anthracite'),
    A('body', `${vk}_plates`, merge([-1, 1].map((s) => flatBox([-0.05, 0.03, s * 0.019 - 0.001], [0.05, 0.145, s * 0.019 + 0.001]))), 'glass_tinted'),
    A('body', `${vk}_lid`, roundedBox([-0.082, 0.17, -0.062], [0.082, 0.188, 0.062], 0.005, 1), 'plastic_ps'),
    A('body', `${vk}_red`, merge([socket(0.06, 0.188, 0.03)]), 'cap_red'),
    A('body', `${vk}_black`, merge([socket(0.06, 0.188, -0.03)]), 'plastic_anthracite'),
  ], 'electrophoresis');
  const pk = 'power_supply_ep_01';
  const psu = one(pk, 'Zdroj napětí pro elektroforézu', [
    ...casing('body', 0.22, 0.32, 0.09, 'plastic_light'),
    ...panel('body', 0.16, -0.1, 0.03, 0.012, 0.08, 3),
    knob('body', pk, 0.06, 0.05, 0.16, 0.012),
    A('body', `${pk}_red`, merge([0.05, 0.085].map((x) => cylZ(0.005, x, 0.022, 0.16, 0.01))), 'cap_red'),
    A('body', `${pk}_black`, merge([0.035, 0.07].map((x) => cylZ(0.005, x, 0.022, 0.16, 0.01))), 'plastic_anthracite'),
  ], 'electrophoresis');
  const ek = 'electroporator_01';
  const elporator = one(ek, 'Elektroporátor s komorou na kyvety', [
    ...casing('body', 0.3, 0.3, 0.14, 'plastic_white'),
    ...screen('body', `${ek}_scr`, -0.13, 0.03, 0.02, 0.12, 0.15, { buttons: 4, led: 'emit_green' }),
    A('body', `${ek}_chamber`, roundedBox([0.065, 0.02, 0.05], [0.135, 0.125, 0.16], 0.01, 2), 'plastic_navy'),
    A('body', `${ek}_slot`, flatBox([0.09, 0.125, 0.09], [0.11, 0.1255, 0.12]), 'plastic_anthracite'),
    A('body', `${ek}_pulse`, moved(cylinder(0.01, 0, 0.008, { seg: 10, edge: 0.003, n: 1 }), mTranslate(0.1, 0.125, 0.14)), 'cap_red'),
  ], 'electrophoresis');
  const tk = 'transilluminator_uv_01';
  const uvbox = moving(tk, 'Transiluminátor UV s ochranným krytem', CAT, [
    ...casing('body', 0.4, 0.3, 0.1, 'plastic_anthracite'),
    A('body', `${tk}_glass`, flatBox([-0.17, 0.1, -0.12], [0.17, 0.1015, 0.12]), 'emit_uv'),
    A('body', `${tk}_frame`, merge([flatBox([-0.175, 0.1, -0.125], [0.175, 0.102, -0.12]), flatBox([-0.175, 0.1, 0.12], [0.175, 0.102, 0.125]), flatBox([-0.175, 0.1, -0.12], [-0.17, 0.102, 0.12]), flatBox([0.17, 0.1, -0.12], [0.175, 0.102, 0.12])]), 'aluminium'),
    A('body', `${tk}_switch`, roundedBox([-0.17, 0.035, 0.148], [-0.12, 0.065, 0.156], 0.004, 1), 'plastic_light'),
    A('body', `${tk}_warn`, flatBox([0.08, 0.035, 0.15], [0.16, 0.065, 0.1506]), 'plastic_orange'),
  ], {
    node: 'shield', at: [0, 0.1, -0.13], joint: 'shield', type: 'hinge', axis: [-1, 0, 0], max: 85, kind: 'door', prompt: 'Zvednout ochranný kryt',
    parts: [A('shield', `${tk}_shield`, roundedBox([-0.19, 0, 0], [0.19, 0.006, 0.27], 0.003, 1), 'plastic_orange'), A('shield', `${tk}_grip`, roundedBox([-0.03, 0.006, 0.245], [0.03, 0.02, 0.27], 0.004, 1), 'plastic_anthracite')],
    note: 'Oranžový akrylový kryt transiluminátoru se zvedá na zadním pantu až do svislé polohy; 85°. Úvaha, neměřeno.',
  }, { gen: gen('electrophoresis') });
  const gk = 'gel_doc_01';
  const geldoc = one(gk, 'Skříň na dokumentaci gelů s kamerou', [
    shell('body', gk, [-0.2, 0.01, -0.225], [0.2, 0.5, 0.225], 'plastic_anthracite', 0.02, 2),
    ...door('body', `${gk}_door`, -0.18, 0.18, 0.05, 0.42, 0.225, 0.012, { mat: 'plastic_light', r: 0.008 }),
    A('body', `${gk}_grip`, roundedBox([-0.06, 0.37, 0.237], [0.06, 0.39, 0.252], 0.005, 1), 'steel_brushed'),
    ...screen('body', `${gk}_scr`, 0.05, 0.17, 0.44, 0.48, 0.225, { led: 'emit_green' }),
    A('body', `${gk}_cam`, merge([roundedBox([-0.05, 0.5, -0.05], [0.05, 0.56, 0.05], 0.01, 2), cylinder(0.03, 0.56, 0.6, { seg: 14, edge: 0.004, n: 1 })]), 'plastic_anthracite'),
    A('body', `${gk}_feet`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.012, 0, 0.01, { seg: 6 }), mTranslate(sx * 0.17, 0, sz * 0.19))))), 'rubber_black'),
  ], 'electrophoresis');
  const lk = 'lamp_uv_hand_01';
  const lamp = one(lk, 'Ruční UV lampa', [
    A('body', `${lk}_body`, roundedBox([-0.12, 0, -0.03], [0.12, 0.04, 0.03], 0.01, 2), 'plastic_anthracite'),
    A('body', `${lk}_window`, flatBox([-0.1, 0.006, 0.0295], [0.1, 0.03, 0.031]), 'emit_uv'),
    A('body', `${lk}_handle`, tube([[-0.06, 0.04, 0], [-0.06, 0.065, 0], [0.06, 0.065, 0], [0.06, 0.04, 0]], 0.009, 8, { bend: 0.015, bendSeg: 2 }), 'plastic_anthracite'),
    A('body', `${lk}_switch`, roundedBox([-0.015, 0.072, -0.006], [0.015, 0.078, 0.006], 0.003, 1), 'cap_red'),
  ], 'electrophoresis');
  return [tank, vert, psu, elporator, uvbox, geldoc, lamp];
}

/** Pipeta (objem 2 až 1000 µl) visící svisle: tělo s rukojetí, píst, vyhazovač a špička; spodek špičky v y0. */
function pipetteGeom(x, y0, z) {
  return moved(lathe([[0.0012, 0], [0.0035, 0.035], [0.005, 0.05, 'c'], [0.005, 0.07], [0.0095, 0.082, 'c'], [0.011, 0.15], [0.0085, 0.172, 'c'], [0, 0.176]], { seg: 6 }), mTranslate(x, y0, z));
}
const pipetteCap = (x, y0, z) => moved(cylinder(0.0075, 0.176, 0.192, { seg: 6, edge: 0.003, n: 1 }), mTranslate(x, y0, z));

/** Pipety: lineární stojan se šesti pipetami, otočný stojan, elektronická multikanálová pipeta, pipetovací nástavec. */
export function pipettes() {
  const cols = ['cap_red', 'cap_yellow', 'cap_yellow', 'cap_blue', 'cap_green', 'plastic_anthracite'];
  const caps = (k, pos) => {
    const by = new Map();
    pos.forEach(([x, y, z], i) => {
      if (!by.has(cols[i])) by.set(cols[i], []);
      by.get(cols[i]).push(pipetteCap(x, y, z));
    });
    return [...by].map(([m, g]) => A('body', `${k}_${m}`, merge(g), m));
  };
  const lk = 'pipettes_linear_01';
  const lpos = cols.map((_, i) => [-0.14 + i * 0.056, 0.03, -0.012]);
  const linear = [
    A('body', `${lk}_base`, roundedBox([-0.17, 0, -0.045], [0.17, 0.014, 0.04], 0.006, 1), 'plastic_light'),
    A('body', `${lk}_back`, roundedBox([-0.17, 0.012, -0.045], [0.17, 0.215, -0.033], 0.005, 1), 'plastic_light'),
    A('body', `${lk}_rail`, roundedBox([-0.17, 0.175, -0.034], [0.17, 0.185, 0.004], 0.004, 1), 'plastic_light'),
    A('body', `${lk}_bodies`, merge(lpos.map(([x, y, z]) => pipetteGeom(x, y, z))), 'plastic_white'),
    ...caps(lk, lpos),
  ];
  const ck = 'pipettes_carousel_01';
  const cpos = cols.map((_, i) => [Math.cos((i * Math.PI) / 3) * 0.055, 0.028, Math.sin((i * Math.PI) / 3) * 0.055]);
  const carousel = [
    A('body', `${ck}_base`, lathe([[0, 0], [0.09, 0, 'c'], [0.092, 0.006], [0.085, 0.014, 'c'], [0.012, 0.014], [0.01, 0.23], [0.06, 0.2, 'c'], [0.065, 0.21, 'c'], [0, 0.215]], { seg: 18 }), 'plastic_light'),
    A('body', `${ck}_bodies`, merge(cpos.map(([x, y, z]) => pipetteGeom(x, y, z))), 'plastic_white'),
    ...caps(ck, cpos),
  ];
  const mk = 'pipette_multichannel_01';
  const multi = [
    A('body', `${mk}_manifold`, roundedBox([-0.045, 0.02, -0.012], [0.045, 0.05, 0.012], 0.006, 2), 'plastic_light'),
    A('body', `${mk}_nozzles`, merge(Array.from({ length: 8 }, (_, i) => moved(lathe([[0, 0], [0.0012, 0, 'c'], [0.0032, 0.02]], { seg: 6 }), mTranslate(-0.0315 + i * 0.009, 0, 0)))), 'plastic_pp'),
    A('body', `${mk}_body`, roundedBox([-0.019, 0.05, -0.016], [0.019, 0.2, 0.016], 0.01, 2), 'plastic_white'),
    A('body', `${mk}_hook`, roundedBox([-0.012, 0.16, -0.028], [0.012, 0.19, -0.016], 0.004, 1), 'plastic_light'),
    A('body', `${mk}_lcd`, flatBox([-0.012, 0.14, 0.016], [0.012, 0.175, 0.0166]), 'emit_display'),
    A('body', `${mk}_btn`, cylinder(0.008, 0.2, 0.215, { seg: 10, edge: 0.003, n: 1 }), 'cap_blue'),
  ];
  const nk = 'pipette_controller_01';
  const controller = [
    A('body', `${nk}_grip`, roundedBox([-0.018, 0, -0.028], [0.018, 0.11, 0.022], 0.012, 2), 'plastic_navy'),
    A('body', `${nk}_head`, moved(lathe([[0, -0.02], [0.02, -0.02, 'c'], [0.022, 0.03], [0.014, 0.07, 'c'], [0.008, 0.08], [0, 0.08]], { seg: 12 }), mTranslate(0, 0.12, 0.01)), 'plastic_navy'),
    A('body', `${nk}_nose`, moved(lathe([[0, 0], [0.006, 0, 'c'], [0.006, 0.03], [0, 0.03]], { seg: 8 }), mTranslate(0, 0.2, 0.01)), 'plastic_pp'),
    A('body', `${nk}_btns`, merge([0.08, 0.1].map((y) => roundedBox([-0.007, y - 0.008, 0.02], [0.007, y + 0.008, 0.032], 0.004, 1))), 'cap_red'),
  ];
  return [
    one(lk, 'Lineární stojan se šesti pipetami', linear, 'pipettes'),
    one(ck, 'Otočný stojan s pipetami', carousel, 'pipettes'),
    one(mk, 'Elektronická osmikanálová pipeta', multi, 'pipettes'),
    one(nk, 'Pipetovací nástavec na sérologické pipety', controller, 'pipettes'),
  ];
}

/** Vývěvy: membránová a olejová rotační; vodní lázeň s víkem; ultrazvuková lázeň; pH metr; plynový kahan. */
export function benchUtility() {
  const mk = 'pump_vacuum_membrane_01';
  const membrane = one(mk, 'Membránová vývěva', [
    ...casing('body', 0.25, 0.3, 0.1, 'plastic_light'),
    A('body', `${mk}_head`, merge([cylZ(0.07, 0, 0.12, -0.12, 0.2, { seg: 16, edge: 0.01, n: 1 }), cylZ(0.075, 0, 0.12, 0.06, 0.03, { seg: 16, edge: 0.006, n: 1 })]), 'plastic_anthracite'),
    A('body', `${mk}_barbs`, merge([-0.03, 0.03].map((x) => moved(lathe([[0.006, 0], [0.006, 0.03], [0.0075, 0.032], [0.005, 0.045], [0, 0.045]], { seg: 8 }), mTranslate(x, 0.19, 0)))), 'steel_brushed'),
    A('body', `${mk}_switch`, roundedBox([-0.11, 0.04, 0.15], [-0.06, 0.08, 0.158], 0.004, 1), 'cap_red'),
    A('body', `${mk}_gauge`, cylZ(0.025, 0.06, 0.12, 0.09, 0.012, { seg: 14 }), 'steel_chrome'),
    A('body', `${mk}_dial`, flatBox([0.04, 0.1, 0.1025], [0.08, 0.14, 0.103]), 'label_paper'),
  ], 'benchUtility');
  const rk = 'pump_vacuum_rotary_01';
  const fins = [];
  for (let i = 0; i < 6; i++) fins.push(moved(torus(0.08, 0.004, 0, { seg: 16, n: 2 }), at(mTranslate(-0.16 + i * 0.03, 0.11, 0), mRotate('z', 90))));
  const rotary = one(rk, 'Olejová rotační vývěva', [
    A('body', `${rk}_base`, roundedBox([-0.22, 0, -0.08], [0.22, 0.02, 0.08], 0.006, 1), 'steel_dark'),
    A('body', `${rk}_motor`, cylX(0.078, -0.19, 0.11, 0, 0.21, { seg: 16, edge: 0.01, n: 1 }), 'paint_blue'),
    A('body', `${rk}_fins`, merge(fins), 'paint_blue'),
    A('body', `${rk}_pump`, cylX(0.07, 0.03, 0.11, 0, 0.17, { seg: 16, edge: 0.01, n: 1 }), 'steel_dark'),
    A('body', `${rk}_exhaust`, moved(cylinder(0.022, 0, 0.1, { seg: 12, edge: 0.004, n: 1 }), mTranslate(0.11, 0.17, 0)), 'steel_brushed'),
    A('body', `${rk}_sight`, cylZ(0.015, 0.17, 0.08, 0.068, 0.006, { seg: 12 }), 'glass_tinted'),
    A('body', `${rk}_oil`, cylZ(0.012, 0.17, 0.075, 0.072, 0.003, { seg: 12 }), 'liquid_amber'),
  ], 'benchUtility', { components: staticFloor() });
  const [w, d, h] = [0.35, 0.55, 0.26];
  const bk = 'bath_water_01';
  const bath = moving(bk, 'Vodní lázeň s víkem', CAT, [
    ...casing('body', w, d, h, 'steel_brushed'),
    A('body', `${bk}_water`, flatBox([-w / 2 + 0.02, h - 0.03, -d / 2 + 0.02], [w / 2 - 0.02, h - 0.025, d / 2 - 0.06]), 'liquid_water'),
    ...panel('body', d / 2, -0.14, 0.14, 0.03, 0.1, 3),
    A('body', `${bk}_drain`, cylZ(0.008, 0.13, 0.03, d / 2, 0.025, { seg: 8 }), 'plastic_anthracite'),
  ], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 100, kind: 'door', prompt: 'Otevřít víko lázně',
    parts: [
      A('lid', `${bk}_lid`, roofGeom(w, d - 0.04, 0.06), 'steel_brushed'),
      A('lid', `${bk}_grip`, roundedBox([-0.06, 0.0, d - 0.045], [0.06, 0.025, d - 0.025], 0.006, 1), 'plastic_anthracite'),
    ],
    note: 'Sedlové víko vodní lázně se odklápí dozadu za svislou polohu, aby kondenzát stékal do vany; 100°. Úvaha, neměřeno.',
  }, { gen: gen('benchUtility') });
  const uk = 'bath_ultrasonic_01';
  const ultrasonic = one(uk, 'Ultrazvuková lázeň', [
    ...casing('body', 0.3, 0.18, 0.15, 'steel_brushed'),
    A('body', `${uk}_rim`, roundedBox([-0.14, 0.142, -0.08], [0.14, 0.152, 0.08], 0.004, 1), 'steel_chrome'),
    A('body', `${uk}_water`, flatBox([-0.13, 0.13, -0.07], [0.13, 0.1405, 0.07]), 'liquid_water'),
    A('body', `${uk}_basket`, merge([flatBox([-0.12, 0.138, -0.065], [-0.118, 0.155, 0.065]), flatBox([0.118, 0.138, -0.065], [0.12, 0.155, 0.065])]), 'steel_chrome'),
    knob('body', `${uk}_l`, -0.1, 0.07, 0.09, 0.013),
    knob('body', `${uk}_r`, 0.1, 0.07, 0.09, 0.013),
    A('body', `${uk}_led`, flatBox([-0.01, 0.07, 0.09], [0.01, 0.076, 0.0905]), 'emit_green'),
  ], 'benchUtility');
  const hk = 'ph_meter_01';
  const ph = one(hk, 'pH metr s elektrodou na rameni', [
    A('body', `${hk}_body`, roundedBox([-0.1, 0.004, -0.11], [0.1, 0.074, 0.11], 0.012, 2), 'plastic_white'),
    A('body', `${hk}_lcd`, moved(flatBox([-0.08, 0, 0], [0.04, 0.0008, 0.06]), at(mTranslate(0, 0.074, 0.03), mRotate('x', 12))), 'emit_display'),
    A('body', `${hk}_keys`, merge([0, 1, 2].map((i) => moved(cylinder(0.006, 0.074, 0.077, { seg: 6 }), mTranslate(0.065, 0, -0.02 + i * 0.03)))), 'plastic_light'),
    A('body', `${hk}_rod`, moved(cylinder(0.006, 0.074, 0.34, { seg: 8 }), mTranslate(0.08, 0, -0.08)), 'steel_brushed'),
    A('body', `${hk}_arm`, roundedBox([-0.0, 0.29, -0.09], [0.095, 0.31, -0.07], 0.005, 1), 'plastic_light'),
    A('body', `${hk}_electrode`, moved(lathe([[0, 0], [0.004, 0, 'c'], [0.006, 0.01], [0.006, 0.16], [0.007, 0.165], [0.007, 0.19], [0, 0.19]], { seg: 10 }), mTranslate(0.01, 0.12, -0.08)), 'glass_lab'),
    A('body', `${hk}_cable`, tube([[0.01, 0.31, -0.08], [0.01, 0.35, -0.08], [-0.05, 0.3, -0.1], [-0.08, 0.06, -0.1]], 0.002, 4, { bend: 0.04, bendSeg: 2 }), 'plastic_black'),
    ...beakerAt(hk, 0.01, 0.074, -0.08, 0.03, 0.07, 0.6, 'liquid_yellow', 12),
  ], 'benchUtility');
  const ck = 'burner_bunsen_01';
  const burner = one(ck, 'Plynový kahan', [
    A('body', `${ck}_base`, lathe([[0, 0], [0.045, 0, 'c'], [0.045, 0.006, 'c'], [0.02, 0.016, 'c'], [0, 0.016]], { seg: 16 }), 'steel_dark'),
    A('body', `${ck}_tube`, lathe([[0.008, 0.05], [0.008, 0.15], [0.009, 0.152], [0.009, 0.155], [0.0065, 0.155], [0.0065, 0.06]], { seg: 10 }), 'steel_brushed'),
    A('body', `${ck}_collar`, lathe([[0.012, 0.016], [0.012, 0.055, 'c'], [0.009, 0.055], [0, 0.055]], { seg: 12 }), 'brass'),
    A('body', `${ck}_inlet`, merge([cylX(0.005, 0.01, 0.025, 0, 0.05, { seg: 8 }), moved(lathe([[0.005, 0], [0.006, 0.005], [0.0045, 0.02], [0, 0.02]], { seg: 8 }), at(mTranslate(0.06, 0.025, 0), mRotate('z', -90)))]), 'brass'),
    A('body', `${ck}_valve`, moved(torus(0.01, 0.002, 0, { seg: 10, n: 2 }), at(mTranslate(-0.015, 0.03, 0), mRotate('z', 90))), 'plastic_anthracite'),
  ], 'benchUtility');
  return [membrane, rotary, bath, ultrasonic, ph, burner];
}

/** Sedlové víko lázně: dvě šikmé desky s hřebenem uprostřed (šířka w podél x, hloubka d, výška hřebene t). */
function roofGeom(w, d, t) {
  const s = Math.hypot(w / 2, t);
  const ang = (Math.atan2(t, w / 2) * 180) / Math.PI;
  const half = (sx) => moved(roundedBox([0, 0, 0], [s, 0.012, d], 0.004, 1), at(mTranslate(sx * w / 2, 0, 0), mRotate('z', sx > 0 ? 180 - ang : ang)));
  return merge([half(-1), moved(half(1), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0.012, 0, 1])]);
}

/** Rotační vakuová odparka s lázní, chladičem a baňkami. */
export function rotavap() {
  // B04: baňky a chladič z hladkých sítí (dřív stoh válců). Odpařovací baňka skloněná 25° do lázně, nad ní parovod,
  // svislý chladič se spirálou a jímací baňka; věž s motorem a zdvihem.
  const part = (role, g, mat) => meshPart('body', 'bench', `rotavap_${role}`, g, mat);
  const bath = vesselGeom([[0, 0.12], [0.12, 0.12, 0.01, 1], [0.12, 0.215, 0.004, 1], [0.123, 0.22]], { wall: 0.003, seg: 16, lipN: 2 });
  const evap = roundFlaskGeom(105, 70, 30, 0, 12);
  const tilt = (g) => moved(g, [Math.cos(0.436), -Math.sin(0.436), 0, 0, Math.sin(0.436), Math.cos(0.436), 0, 0, 0, 0, 1, 0, 0.11, 0.14, 0.05, 1]);
  const coil = [];
  for (let i = 0; i <= 20; i++) {
    const a = i * 1.2;
    coil.push([-0.08 + Math.cos(a) * 0.022, 0.5 + i * 0.011, -0.11 + Math.sin(a) * 0.022]);
  }
  const jacket = vesselGeom([[0, 0], [0.04, 0, 0.01, 1], [0.04, 0.3, 0.012, 1], [0.012, 0.32], [0.012, 0.335], [0.013, 0.336]], { wall: 0.0018, seg: 12, lipN: 2 });
  const recv = roundFlaskGeom(85, 40, 26, 0, 12);
  const parts = [
    ...casing('body', 0.55, 0.45, 0.12, 'plastic_white'),
    ...panel('body', 0.225, -0.2, -0.04, 0.025, 0.09, 3),
    part('bath', bath.geom, 'steel_brushed'),
    part('water', liquidGeom(bath.inner, 0.205, { seg: 18, flat: true }), 'liquid_water'),
    part('tower', merge(roundedBox([-0.24, 0.12, -0.2], [-0.16, 0.62, -0.12], 0.012, 1), roundedBox([-0.2, 0.4, -0.17], [0.0, 0.5, -0.05], 0.015, 1)), 'plastic_white'),
    part('flask', tilt(evap.geom), 'glass_lab'),
    part('flaskliq', tilt(liquidGeom(evap.inner, evap.cy - evap.R * 0.3, { seg: 12, flat: true })), 'liquid_amber'),
    part('duct', tube([[0.0, 0.45, -0.1], [0.04, 0.32, 0.0], [0.07, 0.25, 0.04]], 0.009, 8, { bend: 0.05, bendSeg: 2 }), 'glass_lab'),
    part('jacket', T(jacket.geom, -0.08, 0.5, -0.11), 'glass_lab'),
    part('coil', tube(coil, 0.0035, 5, { caps: false }), 'glass_thin'),
    part('recv', T(recv.geom, -0.08, 0.25, 0.08), 'glass_lab'),
    part('recvliq', T(liquidGeom(recv.inner, recv.cy - recv.R * 0.5, { seg: 12, flat: true }), -0.08, 0.25, 0.08), 'liquid_water'),
  ];
  return [one('rotavap_01', 'Rotační vakuová odparka', parts, 'rotavap', { params: { assembly: true } })]; // přístroj se sadou skla
}

export const BENCH_B = [electrophoresis, pipettes, benchUtility, rotavap, gasAndCryo, opticsAndOven, smallDevices];
