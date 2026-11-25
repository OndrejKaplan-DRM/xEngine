// Sada kit_lab: stolní přístroje (1. část: váhy, centrifugy, míchání, třepačky, PCR, fotometry; 2. část v bench_b.mjs).
// Rozměry podle katalogů výrobců (tools/forge/lab/ROZMERY.md: váhy, mikrocentrifugy, termocykler) a jinde úvahou
// z praxe; tvar obecný, bez značek. Víka, dvířka a šuplíky mají kloub se zdůvodněním. Počátek ve středu půdorysu
// na desce stolu, čelo s ovládáním do +Z. Ondřej 25. 11. 2026 v 1:29: kus po kuse z hladkých sítí (appliance.mjs).

import { simple, moving, casing, panel } from './common.mjs';
import { A, shell, door, screen, knob, grille, top, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';
import { vesselGeom, liquidGeom } from './glassware.mjs';
import { erlenmeyerGeom } from './glass.mjs';
import { BENCH_B, beakerAt } from './bench_b.mjs';

const CAT = 'lab.bench';
const gen = (f) => `lab/bench.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });

/** Skleněná tabule s hliníkovým rámečkem po obvodu (kryt vah): rovina daná rohy a osou tloušťky. */
function pane(n, k, min, max, mat = 'glass_tinted') {
  const t = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const thin = t.indexOf(Math.min(...t));
  const f = 0.004;
  const frame = [];
  const lo = [...min];
  const hi = [...max];
  for (let a = 0; a < 3; a++) {
    if (a === thin) continue;
    // dvě lišty podél osy b na okrajích osy a
    for (const s of [0, 1]) {
      const m0 = [...lo];
      const m1 = [...hi];
      if (s === 0) m1[a] = lo[a] + f;
      else m0[a] = hi[a] - f;
      m0[thin] -= 0.0008;
      m1[thin] += 0.0008;
      frame.push(flatBox(m0, m1));
    }
  }
  return [A(n, `${k}_glass`, flatBox(min, max), mat), A(n, `${k}_frame`, merge(frame), 'aluminium')];
}

/** Váhy: analytické s krytem a posuvnými dvířky (19,5 × 48,5 × 29,2 cm), předvážky s talířem, mikrováhy. */
export function balances() {
  const [w, d, h] = [0.195, 0.485, 0.292];
  const k = 'balance_analytical_01';
  const zb = -d / 2 + 0.03;
  const base = [
    ...casing('body', w, d, 0.09),
    ...panel('body', d / 2, -0.08, 0.08, 0.02, 0.07, 4),
    A('body', `${k}_back`, roundedBox([-w / 2 + 0.004, 0.09, -d / 2 + 0.006], [w / 2 - 0.004, h, zb], 0.01, 2), 'plastic_white'),
    A('body', `${k}_floor`, flatBox([-w / 2 + 0.01, 0.09, zb], [w / 2 - 0.01, 0.094, 0.05]), 'plastic_light'),
    A('body', `${k}_pan`, merge([cylinder(0.04, 0.1, 0.104, { seg: 16, edge: 0.0015, n: 1 }), cylinder(0.006, 0.094, 0.1, { seg: 6 })]), 'steel_chrome'),
    A('body', `${k}_ring`, lathe([[0.046, 0.094], [0.046, 0.112], [0.044, 0.112], [0.044, 0.094]], { seg: 16 }), 'steel_brushed'),
    A('body', `${k}_bubble`, moved(cylinder(0.006, 0, 0.003, { seg: 8 }), mTranslate(0.06, 0.09, 0.1)), 'glass_tinted'),
    ...pane('body', `${k}_top`, [-w / 2 + 0.006, h - 0.006, zb], [w / 2 - 0.006, h - 0.002, 0.05]),
    ...pane('body', `${k}_right`, [w / 2 - 0.008, 0.094, zb], [w / 2 - 0.004, h - 0.006, 0.05]),
    ...pane('body', `${k}_front`, [-w / 2 + 0.006, 0.094, 0.046], [w / 2 - 0.006, h - 0.006, 0.05]),
  ];
  const analytic = moving(k, 'Analytické váhy s krytem (0,1 mg)', CAT, base, {
    node: 'door', at: [-w / 2 + 0.002, 0.094, zb], joint: 'slide', type: 'slider', axis: [0, 0, 1], max: 0.12, kind: 'drawer', prompt: 'Odsunout dvířka krytu',
    parts: [...pane('door', `${k}_door`, [0, 0, 0.002], [0.004, h - 0.1, 0.07]), A('door', `${k}_grip`, roundedBox([-0.006, 0.08, 0.006], [0, 0.13, 0.016], 0.002, 1), 'plastic_light')],
    note: 'Boční dvířka krytu analytických vah jedou po liště dozadu, otvor 12 až 15 cm; 0,12 m. Úvaha podle katalogů vah, neměřeno.',
  }, { gen: gen('balances') });
  const pk = 'balance_precision_01';
  const precision = one(pk, 'Předvážky s talířem (0,01 g)', [
    ...casing('body', 0.2, 0.32, 0.08),
    ...panel('body', 0.16, -0.08, 0.08, 0.015, 0.065, 4),
    A('body', `${pk}_pan`, merge([cylinder(0.075, 0.085, 0.09, { seg: 20, edge: 0.002, n: 1 }), cylinder(0.01, 0.078, 0.085, { seg: 8 })]), 'steel_chrome'),
    A('body', `${pk}_bubble`, moved(cylinder(0.006, 0, 0.003, { seg: 8 }), mTranslate(0.07, 0.08, 0.11)), 'glass_tinted'),
  ], 'balances');
  const mk = 'balance_micro_01';
  const micro = one(mk, 'Mikrováhy s kruhovým krytem', [
    ...casing('body', 0.195, 0.478, 0.08),
    ...panel('body', 0.239, -0.08, 0.08, 0.015, 0.065, 4),
    A('body', `${mk}_shield`, T(vesselGeom([[0, 0], [0.068, 0, 0.002], [0.068, 0.12]], { wall: 0.002, seg: 20, lipN: 2 }).geom, 0, 0.08, -0.1), 'glass_tinted'),
    A('body', `${mk}_cap`, moved(cylinder(0.072, 0, 0.012, { seg: 20, edge: 0.003, n: 1 }), mTranslate(0, 0.2, -0.1)), 'plastic_white'),
    A('body', `${mk}_knob`, moved(cylinder(0.012, 0, 0.012, { seg: 10, edge: 0.003, n: 1 }), mTranslate(0, 0.212, -0.1)), 'plastic_anthracite'),
    A('body', `${mk}_pan`, moved(cylinder(0.015, 0, 0.003, { seg: 10 }), mTranslate(0, 0.09, -0.1)), 'steel_chrome'),
  ], 'balances');
  return [analytic, precision, micro];
}

/** Mikrocentrifuga 24 × 39 × 24 cm a chlazená 29 × 48 × 26 cm, víko na zadním pantu (75°). */
export function microcentrifuges() {
  return [
    ['microcentrifuge_01', 'Mikrocentrifuga', 0.24, 0.39, 0.24, 'plastic_white'],
    ['microcentrifuge_cold_01', 'Mikrocentrifuga chlazená', 0.29, 0.48, 0.26, 'plastic_light'],
  ].map(([id, title, w, d, h, mat]) => {
    const y = h * 0.62;
    const body = [
      ...casing('body', w, d, y, mat),
      ...panel('body', d / 2, -w * 0.35, w * 0.35, h * 0.12, h * 0.48, 3),
      ...grille('body', `${id}_side`, -w * 0.3, w * 0.3, 0.02, 0.06, d / 2, 4),
      A('body', `${id}_seat`, lathe([[w * 0.38, y - 0.004], [w * 0.38, y + 0.002], [w * 0.36, y + 0.002]], { seg: 20 }), 'plastic_anthracite'),
    ];
    const ld = d * 0.86;
    const lh = h * 0.38;
    return moving(id, title, CAT, body, {
      node: 'lid', at: [0, y, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 75, kind: 'door', prompt: 'Otevřít víko',
      parts: [
        A('lid', `${id}_lid`, roundedBox([-w / 2, 0, 0], [w / 2, lh, ld], Math.min(0.03, lh * 0.45), 2), mat),
        A('lid', `${id}_window`, merge([moved(cylinder(w * 0.2, 0, 0.002, { seg: 18 }), mTranslate(0, lh, ld * 0.5))]), 'glass_tinted'),
        A('lid', `${id}_rotor`, moved(lathe([[0, 0], [w * 0.17, 0], [w * 0.12, 0.03, 'c'], [0.02, 0.035], [0, 0.04]], { seg: 14 }), mTranslate(0, lh - 0.045, ld * 0.5)), 'aluminium'),
        A('lid', `${id}_latch`, roundedBox([-0.03, lh * 0.25, ld - 0.004], [0.03, lh * 0.6, ld + 0.012], 0.004, 1), 'plastic_anthracite'),
      ],
      note: 'Víko mikrocentrifugy na zadním pantu se otevírá asi o 75° (výška s otevřeným víkem 48 cm u modelu 24 cm vysokého); 75°. Úvaha podle katalogu výrobce, neměřeno.',
    }, { gen: gen('microcentrifuges') });
  });
}

/** Termomixér s blokem na zkumavky, vortex (dvě barvy), magnetická míchačka s ohřevem (s kádinkou a bez). */
export function mixers() {
  const tk = 'thermomixer_01';
  const holes = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) holes.push(moved(cylinder(0.0055, 0, 0.0006, { seg: 6 }), mTranslate(-0.05 + c * 0.02, 0.15, -0.1 + r * 0.025)));
  const tubes = [];
  for (const [c, r] of [[1, 0], [2, 1], [4, 2], [0, 3]]) tubes.push(moved(lathe([[0, -0.012], [0.004, -0.006, 'c'], [0.0052, 0.01], [0.0058, 0.012], [0.0058, 0.02], [0, 0.02]], { seg: 6 }), mTranslate(-0.05 + c * 0.02, 0.15, -0.1 + r * 0.025)));
  const thermo = one(tk, 'Termomixér s blokem na mikrozkumavky', [
    ...casing('body', 0.21, 0.3, 0.13),
    ...panel('body', 0.15, -0.09, 0.09, 0.015, 0.06, 4),
    A('body', `${tk}_well`, roundedBox([-0.085, 0.125, -0.135], [0.085, 0.132, 0.035], 0.004, 1), 'plastic_anthracite'),
    A('body', `${tk}_block`, roundedBox([-0.07, 0.128, -0.12], [0.07, 0.15, 0.02], 0.003, 1), 'aluminium'),
    A('body', `${tk}_holes`, merge(holes), 'steel_dark'),
    A('body', `${tk}_tubes`, merge(tubes), 'plastic_pp'),
  ], 'mixers');
  const vortex = ['plastic_white', 'plastic_teal'].map((m, v) => {
    const k = `vortex_${pad(v + 1)}`;
    return one(k, `Vortex (třepačka na zkumavky) ${v + 1}`, [
      A('body', `${k}_body`, lathe([[0, 0.006], [0.07, 0.006, 'c'], [0.074, 0.02], [0.062, 0.1, 'c'], [0.05, 0.11], [0, 0.11]], { seg: 20 }), m),
      A('body', `${k}_feet`, merge([0, 1, 2, 3].map((i) => moved(cylinder(0.008, 0, 0.006, { seg: 6 }), mTranslate(Math.cos(i * 1.571 + 0.785) * 0.05, 0, Math.sin(i * 1.571 + 0.785) * 0.05)))), 'rubber_black'),
      A('body', `${k}_cup`, lathe([[0, 0.108], [0.03, 0.108, 'c'], [0.034, 0.124, 'c'], [0.028, 0.13], [0.014, 0.122], [0, 0.12]], { seg: 16 }), 'rubber_black'),
      knob('body', k, 0.03, 0.06, 0.066, 0.012),
      A('body', `${k}_pad`, moved(roundedBox([-0.02, -0.012, 0], [0.02, 0.012, 0.006], 0.004, 1), at(mTranslate(-0.025, 0.06, 0.064), mRotate('y', -20))), 'plastic_anthracite'),
    ], 'mixers');
  });
  const stirrer = [0, 1].map((v) => {
    const k = `stirrer_hotplate_${pad(v + 1)}`;
    const parts = [
      ...casing('body', 0.17, 0.28, 0.1),
      top('body', k, 0, -0.04, 0.16, 0.16, 0.1, 0.108, 'enamel_white', 0.01),
      knob('body', `${k}_l`, -0.05, 0.05, 0.14, 0.014, 'plastic_anthracite'),
      knob('body', `${k}_r`, 0.05, 0.05, 0.14, 0.014, 'plastic_anthracite'),
      A('body', `${k}_marks`, merge([-0.05, 0.05].map((x) => moved(torus(0.019, 0.0008, 0, { seg: 12, n: 2 }), at(mTranslate(x, 0.05, 0.1405), mRotate('x', 90))))), 'plastic_light'),
      A('body', `${k}_led`, flatBox([-0.012, 0.08, 0.14], [0.012, 0.086, 0.1415]), 'emit_red'),
    ];
    if (v) parts.push(...beakerAt(k, 0, 0.108, -0.04, 0.052, 0.1, 0.6, 'liquid_blue', 16), A('body', `${k}_bar`, moved(roundedBox([-0.012, 0, -0.003], [0.012, 0.006, 0.003], 0.003, 1), mTranslate(0, 0.111, -0.04)), 'ptfe'));
    return one(k, `Magnetická míchačka s ohřevem${v ? ' a kádinkou' : ''}`, parts, 'mixers');
  });
  return [thermo, ...vortex, ...stirrer];
}

/** Orbitální třepačka 45 × 45 × 15 cm (prázdná a s baňkami) a inkubační třepačka s víkem. */
export function shakers() {
  const base = (k, flasks) => {
    const parts = [
      ...casing('body', 0.45, 0.45, 0.12),
      ...panel('body', 0.225, -0.12, 0.12, 0.02, 0.09, 3),
      A('body', `${k}_deck`, roundedBox([-0.21, 0.12, -0.21], [0.21, 0.132, 0.21], 0.004, 1), 'aluminium'),
      A('body', `${k}_mat`, flatBox([-0.2, 0.132, -0.2], [0.2, 0.134, 0.2]), 'rubber_black'),
    ];
    if (flasks) {
      const e = erlenmeyerGeom(85, 145, 34, { seg: 10 });
      const pos = [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.1], [0.1, -0.1]];
      parts.push(
        A('body', `${k}_flasks`, merge(pos.map(([x, z]) => T(e.geom, x, 0.134, z))), 'glass_lab'),
        A('body', `${k}_liq`, merge(pos.map(([x, z]) => T(liquidGeom(e.inner, e.H * 0.22, { seg: 10, flat: true }), x, 0.134, z))), 'liquid_yellow'),
        A('body', `${k}_clamps`, merge(pos.flatMap(([x, z]) => [moved(lathe([[0.045, 0], [0.045, 0.03], [0.043, 0.03], [0.043, 0]], { seg: 10 }), mTranslate(x, 0.134, z)), moved(flatBox([-0.003, 0, -0.05], [0.003, 0.002, -0.044]), mTranslate(x, 0.134, z))])), 'steel_chrome'),
        A('body', `${k}_plugs`, merge(pos.map(([x, z]) => moved(cylinder(0.019, 0, 0.025, { seg: 8, edge: 0.004, n: 1 }), mTranslate(x, 0.134 + e.H - 0.012, z)))), 'cork'),
      );
    }
    return parts;
  };
  // s baňkami je to přístroj se sadou skla (sestava do 3 000 △ jako odparka)
  const orbital = [0, 1].map((v) => one(`shaker_orbital_${pad(v + 1)}`, `Orbitální třepačka${v ? ' s baňkami' : ''}`, base(`shaker_orbital_${pad(v + 1)}`, v), 'shakers', v ? { params: { assembly: true } } : {}));
  const [w, d, h] = [0.7, 0.7, 0.42];
  const k = 'shaker_incubator_01';
  const incubator = moving(k, 'Inkubační třepačka s víkem', CAT, [
    shell('body', k, [-w / 2, 0.04, -d / 2], [w / 2, h, d / 2], 'plastic_white', 0.02, 2),
    A('body', `${k}_plinth`, flatBox([-w / 2 + 0.02, 0, -d / 2 + 0.03], [w / 2 - 0.02, 0.04, d / 2 - 0.04]), 'plastic_anthracite'),
    ...screen('body', `${k}_scr`, -0.26, 0.08, 0.1, 0.26, d / 2, { buttons: 4, led: 'emit_green' }),
    ...grille('body', `${k}_v`, 0.14, 0.3, 0.08, 0.26, d / 2, 6),
    A('body', `${k}_deck`, flatBox([-0.3, h - 0.01, -0.3], [0.3, h + 0.002, 0.3]), 'aluminium'),
  ], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 80, kind: 'door', prompt: 'Otevřít víko',
    parts: [
      A('lid', `${k}_lid`, roundedBox([-w / 2, 0, 0], [w / 2, 0.16, d], 0.02, 2), 'plastic_white'),
      A('lid', `${k}_window`, flatBox([-w * 0.3, 0.16, d * 0.2], [w * 0.3, 0.1615, d * 0.8]), 'glass_tinted'),
      A('lid', `${k}_wframe`, merge([flatBox([-w * 0.31, 0.16, d * 0.19], [w * 0.31, 0.1612, d * 0.2]), flatBox([-w * 0.31, 0.16, d * 0.8], [w * 0.31, 0.1612, d * 0.81])]), 'plastic_anthracite'),
      A('lid', `${k}_handle`, tube([[-0.15, 0.06, d], [-0.15, 0.06, d + 0.03], [0.15, 0.06, d + 0.03], [0.15, 0.06, d]], 0.008, 6, { bend: 0.015, bendSeg: 2 }), 'plastic_anthracite'),
    ],
    note: 'Inkubační třepačka shora: víko na zadním pantu s plynovými vzpěrami, otvírá se o 75 až 85°; 80°. Úvaha, neměřeno.',
  }, { gen: gen('shakers'), place: { mount: 'floor' }, group: 'world' });
  return [...orbital, incubator];
}

/** Termocykler PCR 33 × 46 × 20 cm s vyhřívaným víkem a přístroj pro qPCR 33 × 46 × 36 cm. */
export function thermocyclers() {
  const k = 'thermocycler_01';
  const pcr = moving(k, 'Termocykler PCR', CAT, [
    ...casing('body', 0.33, 0.46, 0.12, 'plastic_white'),
    A('body', `${k}_console`, roundedBox([-0.14, 0.11, 0.07], [0.14, 0.135, 0.225], 0.01, 2), 'plastic_white'),
    A('body', `${k}_lcd`, moved(flatBox([-0.11, 0, -0.06], [0.11, 0.0008, 0.06]), at(mTranslate(0, 0.135, 0.148), mRotate('x', 8))), 'emit_display'),
    A('body', `${k}_block`, roundedBox([-0.075, 0.115, -0.16], [0.075, 0.126, -0.03], 0.003, 1), 'aluminium'),
    ...grille('body', `${k}_v`, -0.15, 0.15, 0.02, 0.09, 0.23, 5),
  ], {
    node: 'lid', at: [0, 0.12, -0.2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 70, kind: 'door', prompt: 'Otevřít vyhřívané víko',
    parts: [
      A('lid', `${k}_lid`, roundedBox([-0.12, 0, 0], [0.12, 0.08, 0.24], 0.014, 2), 'plastic_light'),
      A('lid', `${k}_wheel`, merge([cylinder(0.035, 0.08, 0.095, { seg: 16, edge: 0.004, n: 1 }), cylinder(0.012, 0.095, 0.1, { seg: 8 })]), 'plastic_anthracite'),
    ],
    note: 'Vyhřívané víko termocykleru se odklápí dozadu asi o 70° (u modelu s kolem šroubu na víku); 70°. Úvaha podle katalogu výrobce, neměřeno.',
  }, { gen: gen('thermocyclers') });
  const qk = 'qpcr_01';
  const qpcr = one(qk, 'Přístroj pro kvantitativní PCR', [
    ...casing('body', 0.33, 0.46, 0.36, 'plastic_white'),
    ...door('body', `${qk}_door`, -0.15, 0.15, 0.06, 0.18, 0.23, 0.008, { mat: 'plastic_light', r: 0.006 }),
    A('body', `${qk}_grip`, flatBox([-0.05, 0.165, 0.238], [0.05, 0.172, 0.246]), 'plastic_anthracite'),
    ...screen('body', `${qk}_scr`, -0.13, 0.06, 0.22, 0.33, 0.23, { led: 'emit_green' }),
    A('body', `${qk}_stripe`, flatBox([0.08, 0.2, 0.23], [0.14, 0.34, 0.2315]), 'plastic_teal'),
  ], 'thermocyclers');
  return [pcr, qpcr];
}

/** Spektrofotometr UV-VIS s víkem kyvetového prostoru, mikroobjemový spektrofotometr, čtečka destiček se šuplíkem. */
export function photometers() {
  const uk = 'spectrophotometer_uv_01';
  const uv = moving(uk, 'Spektrofotometr UV-VIS', CAT, [
    ...casing('body', 0.45, 0.55, 0.22, 'plastic_white'),
    ...panel('body', 0.275, -0.2, 0.05, 0.04, 0.17, 5),
    A('body', `${uk}_bay`, roundedBox([0.065, 0.214, -0.205], [0.205, 0.224, 0.055], 0.004, 1), 'plastic_anthracite'),
    ...grille('body', `${uk}_v`, 0.08, 0.2, 0.04, 0.16, 0.275, 6),
  ], {
    node: 'lid', at: [0.135, 0.22, -0.2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 90, kind: 'door', prompt: 'Otevřít kyvetový prostor',
    parts: [A('lid', `${uk}_lid`, roundedBox([-0.07, 0, 0], [0.07, 0.04, 0.25], 0.008, 2), 'plastic_light'), A('lid', `${uk}_grip`, flatBox([-0.03, 0.01, 0.25], [0.03, 0.03, 0.258]), 'plastic_anthracite')],
    note: 'Víko kyvetového prostoru spektrofotometru se odklápí dozadu do svislé polohy; 90°. Úvaha, neměřeno.',
  }, { gen: gen('photometers') });
  const nk = 'spectrophotometer_micro_01';
  const nano = one(nk, 'Mikroobjemový spektrofotometr', [
    ...casing('body', 0.2, 0.3, 0.12, 'plastic_white'),
    A('body', `${nk}_deck`, roundedBox([-0.08, 0.12, -0.13], [0.08, 0.15, 0.05], 0.01, 2), 'plastic_white'),
    A('body', `${nk}_lcd`, flatBox([-0.07, 0.15, -0.12], [0.07, 0.1508, 0.0]), 'emit_display'),
    A('body', `${nk}_arm`, tube([[0, 0.1, 0.135], [0, 0.19, 0.135], [0, 0.205, 0.11], [0, 0.205, 0.085]], 0.014, 10, { bend: 0.02, bendSeg: 2 }), 'plastic_light'),
    A('body', `${nk}_pedestal`, moved(cylinder(0.006, 0, 0.012, { seg: 8 }), mTranslate(0, 0.12, 0.085)), 'steel_chrome'),
  ], 'photometers');
  const rk = 'plate_reader_01';
  const reader = moving(rk, 'Čtečka mikrotitračních destiček', CAT, [
    ...casing('body', 0.4, 0.5, 0.35, 'plastic_light'),
    ...screen('body', `${rk}_scr`, -0.18, -0.02, 0.24, 0.32, 0.25, { buttons: 3 }),
    A('body', `${rk}_slot`, roundedBox([0.0, 0.07, 0.246], [0.16, 0.115, 0.252], 0.004, 1), 'plastic_anthracite'),
    A('body', `${rk}_band`, flatBox([-0.2, 0.18, 0.25], [0.2, 0.19, 0.2515]), 'plastic_teal'),
  ], {
    node: 'tray', at: [0.08, 0.08, 0.25], joint: 'tray', type: 'slider', axis: [0, 0, 1], max: 0.14, kind: 'drawer', prompt: 'Vysunout podavač destiček',
    parts: [
      A('tray', `${rk}_tray`, roundedBox([-0.075, 0, -0.14], [0.075, 0.015, 0.005], 0.003, 1), 'plastic_anthracite'),
      A('tray', `${rk}_plate`, roundedBox([-0.064, 0.015, -0.12], [0.064, 0.03, -0.035], 0.003, 1), 'plastic_ps'),
    ],
    note: 'Podavač destiček čtečky vyjede z čela tak, aby se destička SBS dala vložit celá: 13 až 15 cm; 0,14 m. Úvaha, neměřeno.',
  }, { gen: gen('photometers') });
  return [uv, nano, reader];
}

export const BENCH = [balances, microcentrifuges, mixers, shakers, thermocyclers, photometers, ...BENCH_B];
