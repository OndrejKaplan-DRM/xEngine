// Sada kit_lab: chovy a karanténa (Ondřej: „Terárium, akvárium, klece, karanténní laboratoře“). Akvária 63, 112 a
// 270 l na stolku, regál akvárií pro dánia, terária (pouštní a tropické), individuálně větrané klece pro myši
// a potkany a jejich regál s ventilací, klec pro králíka; karanténa: průchozí box do zdi, izolátor s rukavicemi,
// dekontaminační sprcha, nádoba na infekční odpad s pedálem. Rozměry úvahou z katalogů, neměřeno.
// Ondřej 25. 11. 2026 v 1:29: kus po kuse z hladkých sítí (appliance.mjs).

import { cbox } from '../lib.mjs';
import { simple, moving, panel, staticFloor } from './common.mjs';
import { A, shell, door, barHandle, screen, grille, merge, T, roundedBox, flatBox, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';

const CAT = 'lab.animal';
const gen = (f) => `lab/animal.mjs#${f}`;
const floor = (top) => ({ components: staticFloor(top), group: 'world' });

/** Rostlina z listů: svazek zahnutých trubek (stonky) ze země v [x, y, z], výška h. */
function plant(x, y, z, h, n = 4, seed = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = seed + i * 2.4;
    const lean = 0.25 + ((i * 37) % 10) / 30;
    const hh = h * (0.6 + ((i * 53) % 10) / 25);
    out.push(tube([[x, y, z], [x + Math.cos(a) * hh * lean * 0.3, y + hh * 0.55, z + Math.sin(a) * hh * lean * 0.3], [x + Math.cos(a) * hh * lean, y + hh, z + Math.sin(a) * hh * lean]], 0.004 + h * 0.01, 3, { bend: hh * 0.3, bendSeg: 2 }));
  }
  return merge(out);
}

/** Skleněná nádrž bez víka (pět tabulí, silikonové hrany), štěrk, voda, rostliny, kryt se světlem; dno v y0. */
function tank(k, w, d, h, y0, o = {}) {
  const t = 0.006;
  const glass = merge([
    flatBox([-w / 2, y0, -d / 2], [w / 2, y0 + t, d / 2]),
    flatBox([-w / 2, y0, -d / 2], [w / 2, y0 + h, -d / 2 + t]),
    flatBox([-w / 2, y0, d / 2 - t], [w / 2, y0 + h, d / 2]),
    flatBox([-w / 2, y0, -d / 2 + t], [-w / 2 + t, y0 + h, d / 2 - t]),
    flatBox([w / 2 - t, y0, -d / 2 + t], [w / 2, y0 + h, d / 2 - t]),
  ]);
  const seams = merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * w / 2 - (sx > 0 ? 0.008 : -0.008) - 0.004, y0, sz * d / 2 - (sz > 0 ? 0.008 : -0.008) - 0.004], [sx * w / 2 - (sx > 0 ? 0.008 : -0.008) + 0.004, y0 + h, sz * d / 2 - (sz > 0 ? 0.008 : -0.008) + 0.004]))));
  const parts = [
    A('body', `${k}_glass`, glass, 'glass_lab'),
    A('body', `${k}_seams`, seams, 'plastic_black'),
    A('body', `${k}_ground`, flatBox([-w / 2 + t, y0 + t, -d / 2 + t], [w / 2 - t, y0 + 0.05, d / 2 - t]), o.ground || 'stone_pale'),
  ];
  if (o.water !== false) parts.push(A('body', `${k}_water`, flatBox([-w / 2 + t + 0.001, y0 + 0.05, -d / 2 + t + 0.001], [w / 2 - t - 0.001, y0 + h * 0.88, d / 2 - t - 0.001]), 'liquid_water'));
  const n = o.plants ?? 3;
  const pl = [];
  for (let i = 0; i < n; i++) pl.push(plant(-w / 2 + 0.1 + (i * (w - 0.2)) / Math.max(1, n - 1), y0 + 0.05, -d / 4 + (i % 2) * 0.05, h * 0.55, 4, i));
  if (n) parts.push(A('body', `${k}_plants`, merge(pl), 'paint_green'));
  if (o.lid !== false) {
    parts.push(
      A('body', `${k}_lid`, roundedBox([-w / 2 - 0.005, y0 + h, -d / 2 - 0.005], [w / 2 + 0.005, y0 + h + 0.03, d / 2 + 0.005], 0.008, 1), 'plastic_anthracite'),
      A('body', `${k}_light`, flatBox([-w / 2 + 0.05, y0 + h - 0.0015, -d / 4], [w / 2 - 0.05, y0 + h, d / 4]), 'emit_cool'),
    );
  }
  return parts;
}

/** Akvária 63, 112 a 270 l na stolku (skříňka se dvířky) a regál nádrží pro chov dánií. */
export function aquaria() {
  const sizes = [[0.6, 0.3, 0.35], [0.8, 0.35, 0.4], [1.2, 0.5, 0.45]];
  const single = sizes.map(([w, d, h], v) => {
    const k = `aquarium_${Math.round(w * d * h * 1000)}l_01`;
    const half = (w - 0.04) / 2;
    return simple(k, `Akvárium ${Math.round(w * d * h * 1000)} l na stolku`, CAT, [
      shell('body', `${k}_cab`, [-w / 2, 0.06, -d / 2], [w / 2, 0.7, d / 2], 'wood_oak', 0.008),
      A('body', `${k}_plinth`, flatBox([-w / 2 + 0.02, 0, -d / 2 + 0.02], [w / 2 - 0.02, 0.06, d / 2 - 0.04]), 'wood_old'),
      ...[0, 1].flatMap((i) => door('body', `${k}_d${i}`, -w / 2 + 0.02 + i * half, -w / 2 + 0.02 + (i + 1) * half - 0.004, 0.08, 0.68, d / 2, 0.016, { mat: 'wood_oak', r: 0.004 })),
      A('body', `${k}_knobs`, merge([-1, 1].map((s) => moved(cylinder(0.008, 0, 0.018, { seg: 8, edge: 0.003, n: 1 }), at(mTranslate(s * 0.03, 0.55, d / 2 + 0.016), mRotate('x', 90))))), 'brass'),
      ...tank(k, w, d, h, 0.7, { ground: v === 1 ? 'dirt_packed' : 'stone_pale', plants: v + 2 }),
      A('body', `${k}_filter`, moved(cylinder(0.018, 0, h * 0.6, { seg: 10, edge: 0.004, n: 1 }), mTranslate(w / 2 - 0.06, 0.7 + h * 0.3, -d / 2 + 0.04)), 'plastic_anthracite'),
    ], { gen: gen('aquaria'), ...floor() });
  });
  const rk = 'aquarium_rack_zebrafish_01';
  const posts = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.018, 0, 1.9, { seg: 8 }), mTranslate(sx * 0.6, 0, sz * 0.2))));
  const shelves = [];
  const tanks = [];
  const water = [];
  const lids = [];
  for (let k = 0; k < 3; k++) {
    const y = 0.2 + k * 0.58;
    shelves.push(flatBox([-0.62, y, -0.22], [0.62, y + 0.02, 0.22]));
    for (let i = 0; i < (k === 2 ? 2 : 3); i++) {
      const x0 = -0.58 + i * 0.39;
      tanks.push(flatBox([x0, y + 0.02, -0.16], [x0 + 0.34, y + 0.27, 0.16]));
      water.push(flatBox([x0 + 0.006, y + 0.03, -0.15], [x0 + 0.334, y + 0.22, 0.15]));
      lids.push(flatBox([x0 - 0.003, y + 0.27, -0.163], [x0 + 0.343, y + 0.285, 0.163]));
    }
  }
  const rack = [
    A('body', `${rk}_posts`, merge(posts), 'steel_brushed'),
    A('body', `${rk}_shelves`, merge(shelves), 'steel_brushed'),
    A('body', `${rk}_tanks`, merge(tanks), 'plastic_ps'),
    A('body', `${rk}_water`, merge(water), 'liquid_water'),
    A('body', `${rk}_lids`, merge(lids), 'cap_blue'),
    A('body', `${rk}_unit`, roundedBox([-0.62, 1.82, -0.22], [0.62, 1.88, 0.22], 0.01, 1), 'plastic_white'),
    A('body', `${rk}_pipe`, tube([[0.55, 1.82, 0.18], [0.55, 0.2, 0.18], [0.4, 0.2, 0.18]], 0.012, 8, { bend: 0.05, bendSeg: 2 }), 'plastic_white'),
    A('body', `${rk}_taps`, merge([0.2, 0.78, 1.36].map((y) => tube([[0.55, y + 0.3, 0.18], [0.3, y + 0.3, 0.18], [0.3, y + 0.28, 0.16]], 0.005, 6, { bend: 0.02, bendSeg: 1 }))), 'plastic_white'),
  ];
  return [...single, simple(rk, 'Regál nádrží pro chov dánií', CAT, rack, { gen: gen('aquaria'), ...floor() })];
}

/** Kámen: zaoblený kvádr natočený kolem svislé osy. */
const rock = (x, y, z, sx, sy, sz, rot = 0) => moved(roundedBox([-sx / 2, 0, -sz / 2], [sx / 2, sy, sz / 2], Math.min(sx, sy, sz) * 0.45, 1), at(mTranslate(x, y, z), mRotate('y', rot)));

/** Terária: pouštní (písek, kameny, výhřevná lampa) a tropické (vyšší, rostliny, mlžení), s posuvnými čelními skly. */
export function terraria() {
  const dk = 'terrarium_desert_01';
  const desert = simple(dk, 'Terárium pouštní', CAT, [
    shell('body', `${dk}_cab`, [-0.5, 0.0, -0.25], [0.5, 0.75, 0.25], 'plastic_anthracite', 0.01),
    A('body', `${dk}_frame`, merge([flatBox([-0.5, 0.75, -0.25], [0.5, 0.78, 0.25]), flatBox([-0.5, 1.2, -0.25], [0.5, 1.24, 0.25]), flatBox([-0.5, 0.78, 0.23], [-0.488, 1.2, 0.25]), flatBox([0.488, 0.78, 0.23], [0.5, 1.2, 0.25])]), 'steel_dark'),
    A('body', `${dk}_glass`, merge([flatBox([-0.5, 0.78, -0.25], [-0.494, 1.2, 0.23]), flatBox([0.494, 0.78, -0.25], [0.5, 1.2, 0.23]), flatBox([-0.49, 0.78, 0.236], [0.01, 1.2, 0.242]), flatBox([-0.01, 0.78, 0.226], [0.49, 1.2, 0.232])]), 'glass_lab'),
    A('body', `${dk}_back`, flatBox([-0.494, 0.78, -0.25], [0.494, 1.2, -0.24]), 'stone_rough'),
    A('body', `${dk}_mesh`, flatBox([-0.48, 1.236, -0.23], [0.48, 1.242, 0.23]), 'steel_brushed'),
    A('body', `${dk}_sand`, flatBox([-0.49, 0.78, -0.24], [0.49, 0.82, 0.22]), 'dirt_packed'),
    A('body', `${dk}_rocks`, merge([rock(-0.2, 0.81, -0.08, 0.2, 0.09, 0.14, 20), rock(0.25, 0.81, 0.04, 0.13, 0.06, 0.1, -35), rock(-0.32, 0.81, 0.1, 0.08, 0.04, 0.07, 60)]), 'stone_block'),
    A('body', `${dk}_lamp`, moved(lathe([[0.03, 1.14], [0.05, 1.14, 'c'], [0.06, 1.2, 'c'], [0, 1.2]], { seg: 14 }), mTranslate(0.2, 0, -0.05)), 'steel_dark'),
    A('body', `${dk}_bulb`, moved(lathe([[0, 1.115], [0.035, 1.125, 'c'], [0.03, 1.14]], { seg: 12 }), mTranslate(0.2, 0, -0.05)), 'emit_fire'),
  ], { gen: gen('terraria'), ...floor() });
  const tk = 'terrarium_tropical_01';
  const tropic = simple(tk, 'Terárium tropické s rostlinami', CAT, [
    shell('body', `${tk}_cab`, [-0.3, 0, -0.3], [0.3, 0.8, 0.3], 'plastic_anthracite', 0.01),
    A('body', `${tk}_glass`, merge([flatBox([-0.3, 0.8, -0.3], [-0.294, 1.7, 0.3]), flatBox([0.294, 0.8, -0.3], [0.3, 1.7, 0.3]), flatBox([-0.294, 0.8, 0.294], [0.294, 1.7, 0.3])]), 'glass_lab'),
    A('body', `${tk}_doorline`, flatBox([-0.002, 0.82, 0.3], [0.002, 1.68, 0.302]), 'steel_dark'),
    A('body', `${tk}_back`, flatBox([-0.294, 0.8, -0.3], [0.294, 1.7, -0.288]), 'dirt_packed'),
    A('body', `${tk}_soil`, flatBox([-0.294, 0.8, -0.288], [0.294, 0.9, 0.294]), 'dirt_packed'),
    A('body', `${tk}_branch`, tube([[-0.2, 0.9, -0.15], [-0.05, 1.2, -0.1], [0.2, 1.45, -0.2]], 0.02, 6, { bend: 0.1, bendSeg: 3 }), 'wood_old'),
    A('body', `${tk}_plants`, merge([plant(-0.15, 0.9, -0.1, 0.35, 6, 0), plant(0.12, 0.9, -0.15, 0.45, 6, 1), plant(0.0, 0.9, 0.1, 0.25, 5, 2), plant(-0.18, 0.9, 0.12, 0.3, 5, 3)]), 'paint_green'),
    A('body', `${tk}_top`, flatBox([-0.3, 1.7, -0.3], [0.3, 1.72, 0.3]), 'steel_dark'),
    A('body', `${tk}_mist`, moved(cylinder(0.02, 0, 0.035, { seg: 10, edge: 0.004, n: 1 }), mTranslate(0.2, 1.72, 0.2)), 'plastic_white'),
  ], { gen: gen('terraria'), ...floor() });
  return [desert, tropic];
}

/** Individuálně větraná klec: průhledná vana se zaoblenými rohy, podestýlka, víko s filtrem, napáječka a štítek. */
function ivc(k, w, d, h) {
  return [
    A('body', `${k}_tub`, roundedBox([-w / 2, 0, -d / 2], [w / 2, h, d / 2], 0.015, 1), 'plastic_ps'),
    A('body', `${k}_bedding`, flatBox([-w / 2 + 0.006, 0.003, -d / 2 + 0.006], [w / 2 - 0.006, 0.03, d / 2 - 0.006]), 'paper_kraft'),
    A('body', `${k}_lid`, roundedBox([-w / 2 - 0.006, h, -d / 2 - 0.006], [w / 2 + 0.006, h + 0.03, d / 2 + 0.006], 0.01, 1), 'plastic_light'),
    A('body', `${k}_filter`, flatBox([-w / 2 + 0.03, h + 0.03, -d / 2 + 0.04], [w / 2 - 0.03, h + 0.0315, -0.02]), 'steel_brushed'),
    A('body', `${k}_bottle`, moved(lathe([[0, 0], [0.022, 0, 'c'], [0.024, 0.01], [0.024, 0.1], [0.012, 0.12], [0.012, 0.13], [0, 0.13]], { seg: 10 }), at(mTranslate(w / 4, h + 0.02, d / 2 - 0.02), mRotate('x', -100))), 'plastic_ps'),
    A('body', `${k}_card`, flatBox([-0.04, h * 0.45, d / 2], [0.04, h * 0.8, d / 2 + 0.002]), 'label_paper'),
  ];
}

/** Individuálně větraná klec (myš, potkan), regál 5 × 4 klecí s ventilační jednotkou a klec pro králíka. */
export function cages() {
  const mouse = simple('cage_ivc_mouse_01', 'Individuálně větraná klec pro myši', CAT, ivc('cage_ivc_mouse_01', 0.2, 0.36, 0.14), { gen: gen('cages') });
  const rat = simple('cage_ivc_rat_01', 'Individuálně větraná klec pro potkany', CAT, ivc('cage_ivc_rat_01', 0.26, 0.45, 0.2), { gen: gen('cages') });
  const rk = 'rack_ivc_01';
  const tubs = [];
  const lids = [];
  const cards = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
    const x = -0.6 + c * 0.4;
    const y = 0.12 + r * 0.34;
    tubs.push(flatBox([x - 0.17, y, -0.25], [x + 0.17, y + 0.16, 0.25]));
    lids.push(flatBox([x - 0.175, y + 0.16, -0.255], [x + 0.175, y + 0.18, 0.255]));
    cards.push(flatBox([x - 0.04, y + 0.06, 0.25], [x + 0.04, y + 0.13, 0.252]));
  }
  const rack = [
    A('body', `${rk}_sides`, merge([-1, 1].map((sx) => flatBox([sx * 0.85 - 0.03, 0.08, -0.3], [sx * 0.85 + 0.03, 1.9, 0.3]))), 'steel_brushed'),
    A('body', `${rk}_ducts`, merge(Array.from({ length: 5 }, (_, r) => flatBox([-0.82, 0.31 + r * 0.34, -0.29], [0.82, 0.33 + r * 0.34, -0.26]))), 'steel_brushed'),
    A('body', `${rk}_tubs`, merge(tubs), 'plastic_ps'),
    A('body', `${rk}_lids`, merge(lids), 'plastic_light'),
    A('body', `${rk}_cards`, merge(cards), 'label_paper'),
    A('body', `${rk}_unit`, roundedBox([-0.88, 1.9, -0.32], [0.88, 2.1, 0.32], 0.015, 1), 'plastic_white'),
    ...panel('body', 0.32, 0.4, 0.8, 1.93, 2.07, 2),
    A('body', `${rk}_fan`, moved(cylinder(0.08, 0, 0.1, { seg: 14, edge: 0.01, n: 1 }), mTranslate(0, 2.1, 0)), 'steel_brushed'),
    A('body', `${rk}_casters`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(torus(0.03, 0.012, 0, { seg: 10, n: 3 }), at(mTranslate(sx * 0.8, 0.042, sz * 0.25), mRotate('z', 90)))))), 'rubber_black'),
  ];
  const rackP = simple(rk, 'Regál individuálně větraných klecí s ventilační jednotkou', CAT, rack, { gen: gen('cages'), ...floor() });
  const bk = 'cage_rabbit_01';
  const wires = [];
  for (let i = 0; i <= 12; i++) wires.push(flatBox([-0.44 + i * 0.0733 - 0.002, 0.46, 0.288], [-0.44 + i * 0.0733 + 0.002, 0.95, 0.292]));
  for (let i = 0; i <= 8; i++) wires.push(flatBox([-0.44 + i * 0.11 - 0.002, 0.46, -0.292], [-0.44 + i * 0.11 + 0.002, 0.95, -0.288]));
  for (const y of [0.6, 0.8]) wires.push(flatBox([-0.44, y, 0.286], [0.44, y + 0.004, 0.294]), flatBox([-0.44, y, -0.294], [0.44, y + 0.004, -0.286]));
  const rabbit = [
    A('body', `${bk}_frame`, merge([...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.44 - 0.012, 0, sz * 0.29 - 0.012], [sx * 0.44 + 0.012, 0.96, sz * 0.29 + 0.012]))), flatBox([-0.45, 0.95, -0.3], [0.45, 0.965, 0.3])]), 'steel_brushed'),
    A('body', `${bk}_tray`, roundedBox([-0.45, 0.38, -0.3], [0.45, 0.46, 0.3], 0.008, 1), 'steel_brushed'),
    A('body', `${bk}_wires`, merge(wires), 'steel_chrome'),
    A('body', `${bk}_hay`, flatBox([-0.42, 0.46, -0.28], [0.42, 0.48, 0.28]), 'paper_kraft'),
    A('body', `${bk}_bowl`, moved(lathe([[0, 0], [0.06, 0, 'c'], [0.07, 0.04], [0.065, 0.04], [0.05, 0.01], [0, 0.01]], { seg: 12 }), mTranslate(0.25, 0.48, 0.1)), 'steel_chrome'),
  ];
  const rabbitP = simple(bk, 'Klec pro králíka na stojanu', CAT, rabbit, { gen: gen('cages'), ...floor() });
  return [mouse, rat, rackP, rabbitP];
}

/** Karanténa: průchozí box do zdi (dvířka), izolátor s rukavicemi, dekontaminační sprcha, nádoba na infekční odpad. */
export function quarantine() {
  const pk = 'passbox_wall_01';
  // počátek na líci zdi: komora zapuštěná do zdi (z 0 až 0,25 za ní je zeď), příruba a dvířka před lícem
  const pass = moving(pk, 'Průchozí box do zdi s blokováním dvířek', CAT, [
    A('body', `${pk}_chamber`, roundedBox([-0.35, 0.03, 0.0], [0.35, 0.63, 0.25], 0.01, 1), 'steel_brushed'),
    A('body', `${pk}_flange`, roundedBox([-0.38, 0.0, 0.25], [0.38, 0.66, 0.27], 0.006, 1), 'steel_brushed'),
    A('body', `${pk}_lamp_g`, flatBox([-0.3, 0.63, 0.27], [-0.22, 0.65, 0.274]), 'emit_green'),
    A('body', `${pk}_lamp_r`, flatBox([-0.2, 0.63, 0.27], [-0.12, 0.65, 0.274]), 'emit_red'),
    A('body', `${pk}_shelf`, flatBox([-0.32, 0.08, 0.02], [0.32, 0.1, 0.23]), 'steel_dark'),
  ], {
    node: 'door', at: [-0.3, 0.06, 0.27], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 110, kind: 'door', prompt: 'Otevřít průchozí box',
    parts: [
      ...door('door', `${pk}_door`, 0, 0.6, 0, 0.54, 0, 0.025, { mat: 'steel_brushed', window: [0.08, 0.12], glass: 'glass_tinted', r: 0.005 }),
      barHandle('door', `${pk}_door`, 0.54, 0.2, 0.34, 0.025, { rad: 0.007, off: 0.025 }),
    ],
    note: 'Dvířka průchozího boxu na pantu se otvírají asi o 90 až 120°; druhá strana je zablokovaná, dokud jsou tato otevřená. 110°. Úvaha, neměřeno.',
  }, { gen: gen('quarantine'), place: { mount: 'wall', height: 1.0 }, group: 'world' });
  const ik = 'isolator_glovebox_01';
  const iso = simple(ik, 'Izolátor s rukavicemi (třída III)', CAT, [
    A('body', `${ik}_legs`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.65 - 0.025, 0.012, sz * 0.3 - 0.025], [sx * 0.65 + 0.025, 0.85, sz * 0.3 + 0.025])))), 'steel_painted'),
    A('body', `${ik}_feet`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.03, 0, 0.012, { seg: 8 }), mTranslate(sx * 0.65, 0, sz * 0.3))))), 'rubber_black'),
    shell('body', `${ik}_tub`, [-0.75, 0.85, -0.4], [0.75, 1.6, 0.38], 'steel_brushed', 0.02),
    A('body', `${ik}_window`, flatBox([-0.72, 0.9, 0.38], [0.72, 1.57, 0.392]), 'glass_tinted'),
    A('body', `${ik}_wframe`, merge([flatBox([-0.75, 0.86, 0.38], [0.75, 0.9, 0.4]), flatBox([-0.75, 1.57, 0.38], [0.75, 1.6, 0.4]), flatBox([-0.75, 0.9, 0.38], [-0.72, 1.57, 0.4]), flatBox([0.72, 0.9, 0.38], [0.75, 1.57, 0.4])]), 'steel_brushed'),
    A('body', `${ik}_ports`, merge([-0.4, 0.0, 0.4].map((x) => moved(torus(0.085, 0.014, 0, { seg: 16, n: 3 }), at(mTranslate(x, 1.15, 0.4), mRotate('x', 90))))), 'steel_chrome'),
    A('body', `${ik}_gloves`, merge([-0.4, 0.4].map((x) => moved(lathe([[0.08, 0], [0.075, 0.08], [0.05, 0.2], [0.04, 0.28, 'c'], [0, 0.3]], { seg: 10 }), at(mTranslate(x, 1.15, 0.39), mRotate('x', -100))))), 'rubber_black'),
    A('body', `${ik}_hepa`, roundedBox([-0.75, 1.6, -0.4], [0.75, 1.9, 0.38], 0.02, 1), 'plastic_white'),
    ...panel('body', 0.38, -0.7, -0.3, 1.65, 1.85, 3),
    ...grille('body', `${ik}_v`, 0.2, 0.7, 1.65, 1.85, 0.38, 6),
    A('body', `${ik}_lock`, roundedBox([0.75, 1.0, -0.2], [1.0, 1.35, 0.2], 0.015, 1), 'steel_brushed'),
    A('body', `${ik}_lockdoor`, moved(cylinder(0.14, 0, 0.012, { seg: 18, edge: 0.004, n: 1 }), at(mTranslate(1.0, 1.175, 0), mRotate('z', -90))), 'glass_tinted'),
  ], { gen: gen('quarantine'), ...floor() });
  const sk = 'shower_decon_01';
  const strips = [];
  for (let i = 0; i < 8; i++) for (const z of [-1, 1]) strips.push(flatBox([-0.5 + i * 0.125 + 0.003, 0.1, z * 0.545 - 0.002], [-0.5 + (i + 1) * 0.125 - 0.003, 2.2, z * 0.545 + 0.002]));
  const showerParts = [
    A('body', `${sk}_floor`, roundedBox([-0.55, 0, -0.55], [0.55, 0.08, 0.55], 0.01, 1), 'steel_brushed'),
    A('body', `${sk}_walls`, merge([roundedBox([-0.55, 0.08, -0.55], [-0.5, 2.2, 0.55], 0.008, 1), roundedBox([0.5, 0.08, -0.55], [0.55, 2.2, 0.55], 0.008, 1)]), 'steel_brushed'),
    A('body', `${sk}_roof`, roundedBox([-0.55, 2.2, -0.55], [0.55, 2.35, 0.55], 0.01, 1), 'steel_brushed'),
    A('body', `${sk}_nozzles`, merge([-0.25, 0, 0.25].map((x) => moved(lathe([[0.06, 0.03], [0.06, 0.01, 'c'], [0.04, 0], [0, 0]], { seg: 12 }), mTranslate(x, 2.17, 0)))), 'steel_dark'),
    A('body', `${sk}_curtains`, merge(strips), 'plastic_ps'),
    A('body', `${sk}_button`, roundedBox([0.45, 1.3, -0.2], [0.5, 1.5, 0.2], 0.01, 1), 'paint_yellow'),
    A('body', `${sk}_grate`, merge(Array.from({ length: 6 }, (_, i) => flatBox([-0.45, 0.08, -0.4 + i * 0.16], [0.45, 0.083, -0.37 + i * 0.16]))), 'steel_dark'),
  ];
  // průchozí: kolize jen boční stěny a strop, závěsy z PVC na obou koncích nekolidují
  const shower = simple(sk, 'Dekontaminační sprcha (průchozí kabina)', CAT, showerParts, { gen: gen('quarantine'), ...floor(), colliders: [cbox('body', [-0.55, 0, -0.55], [-0.5, 2.2, 0.55], 'world'), cbox('body', [0.5, 0, -0.55], [0.55, 2.2, 0.55], 'world'), cbox('body', [-0.55, 2.2, -0.55], [0.55, 2.35, 0.55], 'world'), cbox('body', [-0.55, 0, -0.55], [0.55, 0.08, 0.55], 'world')] });
  const [w, d, h] = [0.45, 0.4, 0.65];
  const bk = 'bin_biohazard_01';
  const bin = moving(bk, 'Nádoba na infekční odpad s víkem', CAT, [
    A('body', `${bk}_body`, roundedBox([-w / 2, 0.02, -d / 2], [w / 2, h, d / 2], 0.03, 1), 'cap_yellow'),
    A('body', `${bk}_base`, roundedBox([-w / 2 + 0.01, 0, -d / 2 + 0.01], [w / 2 - 0.01, 0.03, d / 2 - 0.01], 0.008, 1), 'plastic_anthracite'),
    A('body', `${bk}_pedal`, roundedBox([-0.08, 0.01, d / 2 - 0.01], [0.08, 0.04, d / 2 + 0.06], 0.008, 1), 'plastic_anthracite'),
    A('body', `${bk}_label`, flatBox([-0.1, h * 0.5, d / 2], [0.1, h * 0.75, d / 2 + 0.0015]), 'label_band_red'),
  ], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 80, kind: 'door', prompt: 'Otevřít víko',
    parts: [A('lid', `${bk}_lid`, roundedBox([-w / 2 - 0.01, 0, 0], [w / 2 + 0.01, 0.035, d + 0.01], 0.012, 1), 'cap_red')],
    note: 'Víko nádoby na infekční odpad ovládané pedálem se otvírá asi o 70 až 85°; 80°. Úvaha, neměřeno.',
  }, { gen: gen('quarantine'), place: { mount: 'floor' } });
  return [pass, iso, shower, bin];
}

export const ANIMAL = [aquaria, terraria, cages, quarantine];
