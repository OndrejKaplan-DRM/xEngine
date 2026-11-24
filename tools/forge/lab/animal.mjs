// Sada kit_lab: chovy a karanténa (Ondřej: „Terárium, akvárium, klece, karanténní laboratoře“). Akvária 60, 112 a
// 240 l na stolku, regál akvárií pro dánia, terária (pouštní a tropické), individuálně větrané klece pro myši
// a potkany a jejich regál s ventilací, klec pro králíka; karanténa: průchozí box do zdi, izolátor s rukavicemi,
// dekontaminační sprcha, nádoba na infekční odpad s pedálem. Rozměry úvahou z katalogů, neměřeno.

import { box, boxc, cyl, collide } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, panel, staticFloor } from './common.mjs';

const CAT = 'lab.animal';
const gen = (f) => `lab/animal.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const floor = (top) => ({ components: staticFloor(top), group: 'world' });

/** Skleněná nádrž: dno, štěrk, voda, rostliny, kryt se světlem; y0 = výška dna. */
function tank(w, d, h, y0, o = {}) {
  const parts = [box('body', [-w / 2, y0, -d / 2], [w / 2, y0 + h, d / 2], 'glass_lab'), box('body', [-w / 2 + 0.01, y0 + 0.005, -d / 2 + 0.01], [w / 2 - 0.01, y0 + 0.05, d / 2 - 0.01], o.ground || 'stone_pale')];
  if (o.water !== false) parts.push(box('body', [-w / 2 + 0.008, y0 + 0.05, -d / 2 + 0.008], [w / 2 - 0.008, y0 + h * 0.88, d / 2 - 0.008], 'liquid_water'));
  for (let i = 0; i < (o.plants ?? 3); i++) parts.push(boxc('body', [-w / 2 + 0.1 + i * (w - 0.2) / Math.max(1, (o.plants ?? 3) - 1), y0 + 0.05 + h * 0.2, -d / 4], [0.04, h * 0.4, 0.04], 'paint_green'));
  if (o.lid !== false) parts.push(box('body', [-w / 2 - 0.005, y0 + h, -d / 2 - 0.005], [w / 2 + 0.005, y0 + h + 0.03, d / 2 + 0.005], 'plastic_anthracite'), box('body', [-w / 2 + 0.05, y0 + h - 0.002, -d / 4], [w / 2 - 0.05, y0 + h, d / 4], 'emit_cool'));
  return parts;
}

/** Akvária 60, 112 a 240 l na stolku (skříňka pod ním) a regál pěti nádrží pro chov dánií. */
export function aquaria() {
  const sizes = [[0.6, 0.3, 0.35], [0.8, 0.35, 0.4], [1.2, 0.5, 0.45]];
  const single = sizes.map(([w, d, h], v) => simple(`aquarium_${Math.round(w * d * h * 1000)}l_01`, `Akvárium ${Math.round(w * d * h * 1000)} l na stolku`, CAT, [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, 0.7, d / 2], 'wood_oak', 0.006), box('body', [-w / 2 + 0.02, 0.05, d / 2], [w / 2 - 0.02, 0.66, d / 2 + 0.005], 'wood_oak'), ...tank(w, d, h, 0.7, { ground: v === 1 ? 'dirt_packed' : 'stone_pale', plants: v + 2 }), cyl('body', [w / 2 - 0.06, 0.7 + h * 0.6, -d / 2 + 0.04], 0.015, h * 0.6, 'y', 'plastic_anthracite')], { gen: gen('aquaria'), ...floor() }));
  const rack = [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.6 - 0.02, 0, sz * 0.2 - 0.02], [sx * 0.6 + 0.02, 1.9, sz * 0.2 + 0.02], 'steel_brushed')))];
  for (let k = 0; k < 3; k++) {
    const y = 0.2 + k * 0.58;
    rack.push(box('body', [-0.62, y, -0.22], [0.62, y + 0.02, 0.22], 'steel_brushed'));
    for (let i = 0; i < (k === 2 ? 2 : 3); i++) rack.push(box('body', [-0.58 + i * 0.39, y + 0.02, -0.16], [-0.24 + i * 0.39, y + 0.27, 0.16], 'plastic_ps'), box('body', [-0.57 + i * 0.39, y + 0.03, -0.15], [-0.25 + i * 0.39, y + 0.22, 0.15], 'liquid_water'), box('body', [-0.58 + i * 0.39, y + 0.27, -0.16], [-0.24 + i * 0.39, y + 0.29, 0.16], 'cap_blue'));
  }
  rack.push(box('body', [-0.62, 1.82, -0.22], [0.62, 1.86, 0.22], 'plastic_white'), cyl('body', [0.55, 1.0, 0.18], 0.012, 1.7, 'y', 'plastic_white'));
  return [...single, simple('aquarium_rack_zebrafish_01', 'Regál nádrží pro chov dánií', CAT, rack, { gen: gen('aquaria'), ...floor() })];
}

/** Terária: pouštní (písek, kameny, výhřevná lampa) a tropické (vyšší, rostliny, mlžení), s posuvnými čelními skly. */
export function terraria() {
  const desert = simple('terrarium_desert_01', 'Terárium pouštní', CAT, [...bevelBox('body', [-0.5, 0, -0.25], [0.5, 0.75, 0.25], 'plastic_anthracite', 0.006), box('body', [-0.5, 0.75, -0.25], [0.5, 0.76, 0.25], 'plastic_anthracite'), box('body', [-0.5, 0.76, -0.25], [-0.49, 1.21, 0.25], 'glass_lab'), box('body', [0.49, 0.76, -0.25], [0.5, 1.21, 0.25], 'glass_lab'), box('body', [-0.49, 0.76, -0.25], [0.49, 1.21, -0.24], 'stone_rough'), box('body', [-0.49, 0.76, 0.24], [0.0, 1.21, 0.25], 'glass_lab'), box('body', [0.0, 0.76, 0.235], [0.49, 1.21, 0.245], 'glass_lab'), box('body', [-0.5, 1.21, -0.25], [0.5, 1.24, 0.25], 'steel_dark'), box('body', [-0.48, 0.76, -0.23], [0.48, 0.8, 0.23], 'dirt_packed'), boxc('body', [-0.2, 0.84, -0.05], [0.18, 0.08, 0.14], 'stone_block'), boxc('body', [0.25, 0.82, 0.05], [0.12, 0.05, 0.1], 'stone_block'), cyl('body', [0.2, 1.18, -0.05], 0.05, 0.06, 'y', 'emit_fire')], { gen: gen('terraria'), ...floor() });
  const tropic = simple('terrarium_tropical_01', 'Terárium tropické s rostlinami', CAT, [...bevelBox('body', [-0.3, 0, -0.3], [0.3, 0.8, 0.3], 'plastic_anthracite', 0.006), box('body', [-0.3, 0.8, -0.3], [0.3, 1.7, 0.3], 'glass_lab'), box('body', [-0.29, 0.8, -0.29], [0.29, 1.69, -0.28], 'dirt_packed'), box('body', [-0.29, 0.8, -0.29], [0.29, 0.9, 0.29], 'dirt_packed'), ...[[-0.15, -0.1], [0.12, -0.15], [0.0, 0.1], [-0.18, 0.12]].map(([x, z], i) => boxc('body', [x, 0.9 + 0.15 + i * 0.05, z], [0.05, 0.3 + i * 0.1, 0.05], 'paint_green')), box('body', [-0.3, 1.7, -0.3], [0.3, 1.72, 0.3], 'steel_dark'), cyl('body', [0.2, 1.74, 0.2], 0.03, 0.04, 'y', 'plastic_white')], { gen: gen('terraria'), ...floor() });
  return [desert, tropic];
}

/** Individuálně větraná klec (myš, potkan), regál 5 × 6 klecí s ventilační jednotkou a klec pro králíka. */
export function cages() {
  const ivc = (w, d, h, bedding) => [box('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], 'plastic_ps'), box('body', [-w / 2 + 0.005, 0.002, -d / 2 + 0.005], [w / 2 - 0.005, 0.03, d / 2 - 0.005], bedding), box('body', [-w / 2 - 0.005, h, -d / 2 - 0.005], [w / 2 + 0.005, h + 0.03, d / 2 + 0.005], 'plastic_light'), box('body', [-w / 2 + 0.03, h - 0.04, -d / 2 + 0.03], [w / 2 - 0.03, h - 0.035, 0], 'steel_brushed'), cyl('body', [w / 4, h - 0.02, d / 4], 0.02, 0.1, 'x', 'glass_lab'), box('body', [-0.04, h * 0.5, d / 2], [0.04, h * 0.7, d / 2 + 0.002], 'label_paper')];
  const mouse = simple('cage_ivc_mouse_01', 'Individuálně větraná klec pro myši', CAT, ivc(0.2, 0.36, 0.14, 'paper_kraft'), { gen: gen('cages') });
  const rat = simple('cage_ivc_rat_01', 'Individuálně větraná klec pro potkany', CAT, ivc(0.26, 0.45, 0.2, 'paper_kraft'), { gen: gen('cages') });
  const rack = [...[-1, 1].map((sx) => box('body', [sx * 0.85 - 0.03, 0, -0.3], [sx * 0.85 + 0.03, 1.9, 0.3], 'steel_brushed')), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cyl('body', [sx * 0.8, 0.04, sz * 0.25], 0.04, 0.04, 'x', 'rubber_black'))), box('body', [-0.88, 1.9, -0.32], [0.88, 2.1, 0.32], 'plastic_white'), ...panel('body', 0.32, 0.4, 0.8, 1.93, 2.07, 2), cyl('body', [0, 2.15, 0], 0.08, 0.1, 'y', 'steel_brushed')];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) rack.push(boxc('body', [-0.6 + c * 0.4, 0.2 + r * 0.34, 0], [0.34, 0.16, 0.5], 'plastic_ps'), boxc('body', [-0.6 + c * 0.4, 0.29 + r * 0.34, 0], [0.35, 0.02, 0.51], 'plastic_light'));
  const rackP = simple('rack_ivc_01', 'Regál individuálně větraných klecí s ventilační jednotkou', CAT, rack, { gen: gen('cages'), ...floor() });
  const rabbit = [box('body', [-0.45, 0.4, -0.3], [0.45, 0.42, 0.3], 'steel_brushed'), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.44 - 0.01, 0, sz * 0.29 - 0.01], [sx * 0.44 + 0.01, 0.95, sz * 0.29 + 0.01], 'steel_brushed'))), box('body', [-0.45, 0.95, -0.3], [0.45, 0.96, 0.3], 'steel_brushed'), box('body', [-0.42, 0.42, -0.28], [0.42, 0.46, 0.28], 'paper_kraft')];
  for (let i = 0; i < 9; i++) rabbit.push(box('body', [-0.44 + i * 0.11, 0.42, 0.29], [-0.435 + i * 0.11, 0.95, 0.3], 'steel_brushed'));
  const rabbitP = simple('cage_rabbit_01', 'Klec pro králíka na stojanu', CAT, rabbit, { gen: gen('cages'), ...floor() });
  return [mouse, rat, rackP, rabbitP];
}

/** Karanténa: průchozí box do zdi (dvířka), izolátor s rukavicemi, dekontaminační sprcha, nádoba na infekční odpad. */
export function quarantine() {
  const pass = moving('passbox_wall_01', 'Průchozí box do zdi s blokováním dvířek', CAT, [box('body', [-0.35, 0, -0.25], [0.35, 0.6, 0.0], 'steel_brushed'), box('body', [-0.38, -0.03, 0.0], [0.38, 0.63, 0.02], 'steel_brushed'), box('body', [-0.3, 0.6, 0.0], [-0.1, 0.62, 0.025], 'emit_green'), box('body', [-0.32, 0.05, -0.23], [0.32, 0.07, -0.02], 'steel_dark')].map((p) => ({ ...p, min: [p.min[0], p.min[1] + 0.03, p.min[2] + 0.25], max: [p.max[0], p.max[1] + 0.03, p.max[2] + 0.25] })), {
    node: 'door', at: [-0.3, 0.06, 0.27], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 110, kind: 'door', prompt: 'Otevřít průchozí box',
    parts: [box('door', [0, 0, 0], [0.6, 0.52, 0.025], 'steel_brushed'), box('door', [0.08, 0.12, 0.025], [0.52, 0.42, 0.027], 'glass_tinted'), box('door', [0.52, 0.22, 0.025], [0.56, 0.32, 0.05], 'steel_dark')],
    note: 'Dvířka průchozího boxu na pantu se otvírají asi o 90 až 120°; druhá strana je zablokovaná, dokud jsou tato otevřená. 110°. Úvaha, neměřeno.',
  }, { gen: gen('quarantine'), place: { mount: 'wall', height: 1.0 }, group: 'world' });
  const iso = simple('isolator_glovebox_01', 'Izolátor s rukavicemi (třída III)', CAT, [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.65 - 0.025, 0, sz * 0.3 - 0.025], [sx * 0.65 + 0.025, 0.85, sz * 0.3 + 0.025], 'steel_painted'))), box('body', [-0.75, 0.85, -0.4], [0.75, 0.9, 0.4], 'steel_brushed'), box('body', [-0.75, 0.9, -0.4], [0.75, 1.6, -0.38], 'steel_brushed'), box('body', [-0.75, 0.9, -0.38], [-0.73, 1.6, 0.4], 'steel_brushed'), box('body', [0.73, 0.9, -0.38], [0.75, 1.6, 0.4], 'steel_brushed'), box('body', [-0.73, 0.9, 0.38], [0.73, 1.6, 0.4], 'glass_tinted'), box('body', [-0.75, 1.6, -0.4], [0.75, 1.9, 0.4], 'plastic_white'), ...[-0.4, 0.0, 0.4].map((x) => cyl('body', [x, 1.15, 0.43], 0.08, 0.06, 'z', 'steel_brushed')), ...[-0.4, 0.4].map((x) => cyl('body', [x, 1.15, 0.3], 0.06, 0.2, 'z', 'rubber_black')), box('body', [0.75, 1.0, -0.2], [1.0, 1.35, 0.2], 'steel_brushed'), ...panel('body', 0.4, -0.7, -0.3, 1.65, 1.85, 3)], { gen: gen('quarantine'), ...floor() });
  const showerParts = [box('body', [-0.55, 0, -0.55], [0.55, 0.08, 0.55], 'steel_brushed'), box('body', [-0.55, 0.08, -0.55], [-0.5, 2.2, 0.55], 'steel_brushed'), box('body', [0.5, 0.08, -0.55], [0.55, 2.2, 0.55], 'steel_brushed'), box('body', [-0.55, 2.2, -0.55], [0.55, 2.35, 0.55], 'steel_brushed'), ...[-0.25, 0, 0.25].map((x) => cyl('body', [x, 2.17, 0], 0.06, 0.03, 'y', 'steel_dark')), box('body', [-0.5, 0.08, -0.55], [0.5, 2.2, -0.53], 'plastic_ps'), box('body', [-0.5, 0.08, 0.53], [0.5, 2.2, 0.55], 'plastic_ps'), box('body', [0.45, 1.3, -0.2], [0.5, 1.5, 0.2], 'paint_yellow')];
  // průchozí: kolize jen boční stěny a strop, závěsy z PVC na obou koncích nekolidují
  const shower = simple('shower_decon_01', 'Dekontaminační sprcha (průchozí kabina)', CAT, showerParts, { gen: gen('quarantine'), ...floor(), colliders: showerParts.slice(1, 4).map((p) => collide(p)) });
  const [w, d, h] = [0.45, 0.4, 0.65];
  const bin = moving('bin_biohazard_01', 'Nádoba na infekční odpad s víkem', CAT, [box('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], 'cap_yellow'), box('body', [-0.08, 0.02, d / 2], [0.08, 0.05, d / 2 + 0.06], 'plastic_anthracite'), box('body', [-0.1, h * 0.5, d / 2], [0.1, h * 0.75, d / 2 + 0.002], 'label_band_red')], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 80, kind: 'door', prompt: 'Otevřít víko',
    parts: [box('lid', [-w / 2 - 0.01, 0, 0], [w / 2 + 0.01, 0.03, d + 0.01], 'cap_red')],
    note: 'Víko nádoby na infekční odpad ovládané pedálem se otvírá asi o 70 až 85°; 80°. Úvaha, neměřeno.',
  }, { gen: gen('quarantine'), place: { mount: 'floor' } });
  return [pass, iso, shower, bin];
}

export const ANIMAL = [aquaria, terraria, cages, quarantine];
