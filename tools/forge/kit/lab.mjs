// xForge, sada kit_base: laboratorní přístroje a terminály. Stolní přístroje mají počátek ve středu podstavy
// (generátor je staví na desku stolu), stojící na zemi ve středu půdorysu, nástěnné v bodě dotyku se zdí.

import { box, boxc, cyl, cbox, collide, node, hinge, slider, definePrefab, IO } from '../lib.mjs';

const kin = { physics: { body: 'kinematic' } };

/** Stolní centrifuga s odklápěcím víkem. */
export function centrifuge() {
  const lid = box('lid', [-0.21, 0, 0], [0.21, 0.035, 0.5], 'plastic_grey');
  return definePrefab(
    {
      id: 'centrifuge_bench_01',
      title: 'Centrifuga stolní s víkem',
      category: 'device.lab',
      nodes: [node('body'), node('lid', 'body', [0, 0.26, -0.25])],
      joints: [hinge('lid', 'lid', [-1, 0, 0], 0, 75, { damping: 5, speed: 90, drive: 'both' })],
      parts: [
        box('body', [-0.21, 0, -0.25], [0.21, 0.08, 0.25], 'plastic_ivory'),
        box('body', [-0.21, 0.08, -0.25], [-0.19, 0.26, 0.25], 'plastic_ivory'),
        box('body', [0.19, 0.08, -0.25], [0.21, 0.26, 0.25], 'plastic_ivory'),
        box('body', [-0.19, 0.08, -0.25], [0.19, 0.26, -0.23], 'plastic_ivory'),
        box('body', [-0.19, 0.08, 0.13], [0.19, 0.26, 0.25], 'plastic_ivory'),
        box('body', [-0.19, 0.08, -0.23], [0.19, 0.1, 0.13], 'plastic_dark'),
        cyl('body', [0, 0.15, -0.05], 0.14, 0.08, 'y', 'steel_brushed'),
        cyl('body', [0, 0.17, -0.05], 0.03, 0.1, 'y', 'steel_dark'),
        box('body', [-0.13, 0.17, 0.25], [-0.03, 0.22, 0.253], 'emit_green'),
        box('body', [0.03, 0.17, 0.25], [0.07, 0.21, 0.256], 'plastic_dark'),
        box('body', [0.09, 0.17, 0.25], [0.13, 0.21, 0.256], 'paint_red'),
        lid,
        cyl('lid', [0, 0.037, 0.22], 0.1, 0.004, 'y', 'glass_pane'),
        box('lid', [-0.08, 0.005, 0.5], [0.08, 0.025, 0.52], 'plastic_dark'),
      ],
      colliders: [cbox('body', [-0.21, 0, -0.25], [0.21, 0.26, 0.25], 'prop'), collide(lid, 'prop')],
      components: { ...kin, interact: { kind: 'door', joint: 'lid', prompt: 'Otevřít víko', range: 1.4, manipulate: true } },
      inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
      outputs: ['opened', 'closed'],
      gen: 'lab.mjs#centrifuge',
    },
    { lid: 'Stolní centrifuga: víko na zadním pantu s plynovou vzpěrou se otevírá o 70–80°; 75°. Za chodu bývá zamčené (vstupy lock, unlock). Úvaha, neměřeno.' },
  );
}

/** Digestoř šířky 1,2 m se svisle výsuvným oknem. */
export function fumeHood() {
  const sash = cbox('sash', [-0.56, 0, -0.015], [0.56, 0.72, 0.015]);
  const parts = [
    box('body', [-0.6, 0, -0.4], [0.6, 0.86, 0.38], 'steel_painted'),
    box('body', [-0.58, 0.08, 0.38], [-0.01, 0.82, 0.39], 'plastic_ivory'),
    box('body', [0.01, 0.08, 0.38], [0.58, 0.82, 0.39], 'plastic_ivory'),
    box('body', [-0.07, 0.4, 0.39], [-0.04, 0.56, 0.41], 'steel_brushed'),
    box('body', [0.04, 0.4, 0.39], [0.07, 0.56, 0.41], 'steel_brushed'),
    box('body', [-0.6, 0.86, -0.4], [0.6, 0.9, 0.4], 'plastic_dark'),
    box('body', [-0.6, 0.9, -0.4], [-0.56, 2.1, 0.4], 'steel_painted'),
    box('body', [0.56, 0.9, -0.4], [0.6, 2.1, 0.4], 'steel_painted'),
    box('body', [-0.56, 0.9, -0.4], [0.56, 2.1, -0.37], 'tile_white'),
    box('body', [-0.6, 2.1, -0.4], [0.6, 2.3, 0.4], 'steel_painted'),
    box('body', [-0.56, 1.62, 0.34], [0.56, 2.1, 0.4], 'steel_painted'),
    box('body', [-0.3, 2.085, -0.25], [0.3, 2.1, -0.05], 'emit_cool'),
    cyl('body', [0, 2.4, -0.1], 0.12, 0.2, 'y', 'steel_brushed'),
    box('sash', [-0.56, 0, -0.015], [-0.52, 0.72, 0.015], 'steel_brushed'),
    box('sash', [0.52, 0, -0.015], [0.56, 0.72, 0.015], 'steel_brushed'),
    box('sash', [-0.52, 0, -0.015], [0.52, 0.05, 0.015], 'steel_brushed'),
    box('sash', [-0.52, 0.67, -0.015], [0.52, 0.72, 0.015], 'steel_brushed'),
    box('sash', [-0.52, 0.05, -0.004], [0.52, 0.67, 0.004], 'glass_pane'),
    box('sash', [-0.3, 0.012, 0.015], [0.3, 0.038, 0.04], 'plastic_dark'),
  ];
  return definePrefab(
    {
      id: 'fumehood_01',
      title: 'Digestoř s výsuvným oknem 1,2 m',
      category: 'device.lab',
      nodes: [node('body'), node('sash', 'body', [0, 0.9, 0.3])],
      joints: [slider('sash', 'sash', [0, 1, 0], 0, 0.5, { damping: 12, drive: 'manual' })],
      parts,
      colliders: [cbox('body', [-0.6, 0, -0.4], [0.6, 0.9, 0.4]), cbox('body', [-0.6, 0.9, -0.4], [-0.56, 2.1, 0.4]), cbox('body', [0.56, 0.9, -0.4], [0.6, 2.1, 0.4]), cbox('body', [-0.56, 0.9, -0.4], [0.56, 2.1, -0.37]), cbox('body', [-0.6, 1.62, -0.4], [0.6, 2.3, 0.4]), sash],
      components: { ...kin, interact: { kind: 'drawer', joint: 'sash', prompt: 'Vysunout okno', range: 1.6, manipulate: true } },
      ...IO.drawer,
      gen: 'lab.mjs#fumeHood',
    },
    { sash: 'Laboratorní digestoř: okno se zasouvá svisle za horní panel, pracovní otevření do 0,5 m (při větším klesá rychlost nasávání pod bezpečnou mez). Protizávaží drží polohu, proto tlumení bez pružiny. Úvaha, neměřeno.' },
  );
}

/** Mikroskop se zaostřovacím kolečkem. Kolečko je interakce; stolek má vlastní kloub na pohon (svázání kloubů řeší návrh N-002). */
export function microscope() {
  return definePrefab(
    {
      id: 'microscope_01',
      title: 'Mikroskop se zaostřovacím kolečkem',
      category: 'device.lab',
      nodes: [node('base'), node('stage', 'base', [0, 0.15, 0]), node('knob', 'base', [0, 0.1, -0.085]), node('tube', 'base', [0, 0.31, -0.02], [30, 0, 0])],
      joints: [hinge('focus', 'knob', [1, 0, 0], 0, 540, { damping: 2, drive: 'manual' }), slider('stage', 'stage', [0, 1, 0], 0, 0.025, { speed: 0.02, drive: 'motor' })],
      parts: [
        box('base', [-0.09, 0, -0.12], [0.09, 0.03, 0.12], 'plastic_dark'),
        box('base', [-0.025, 0.03, -0.11], [0.025, 0.3, -0.06], 'plastic_ivory'),
        box('base', [-0.03, 0.26, -0.11], [0.03, 0.31, 0.03], 'plastic_ivory'),
        cyl('base', [0, 0.25, 0], 0.03, 0.02, 'y', 'steel_brushed'),
        cyl('base', [0, 0.215, 0], 0.012, 0.05, 'y', 'steel_brushed'),
        box('base', [-0.02, 0.03, -0.02], [0.02, 0.06, 0.02], 'emit_warm'),
        box('stage', [-0.07, 0, -0.06], [0.07, 0.012, 0.07], 'plastic_dark'),
        box('stage', [-0.038, 0.012, -0.013], [0.038, 0.014, 0.013], 'glass_pane'),
        cyl('knob', [0.045, 0, 0], 0.025, 0.02, 'x', 'steel_dark'),
        cyl('knob', [-0.045, 0, 0], 0.025, 0.02, 'x', 'steel_dark'),
        cyl('tube', [0, 0.06, 0], 0.018, 0.12, 'y', 'steel_dark'),
        cyl('tube', [0, 0.13, 0], 0.022, 0.02, 'y', 'rubber_black'),
      ],
      colliders: [cbox('base', [-0.09, 0, -0.12], [0.09, 0.3, 0.12], 'prop')],
      components: { ...kin, interact: { kind: 'valve', joint: 'focus', prompt: 'Zaostřit', range: 1.2, manipulate: true } },
      inputs: ['setLevel'],
      outputs: ['changed'],
      gen: 'lab.mjs#microscope',
    },
    {
      focus: 'Makrošroub školního mikroskopu: celý zdvih stolku zhruba na jednu a půl otáčky kolečka (540°). Úvaha z typických přístrojů, neměřeno.',
      stage: 'Stolek mikroskopu: zdvih hrubého ostření kolem 25 mm. Pohání ho kolečko (poměr 25 mm na 540°); v datech verze 1 jsou to dva nesvázané klouby. Úvaha, neměřeno.',
    },
  );
}

/** Laboratorní lednice. */
export function fridge() {
  const door = box('door', [0, 0, 0], [0.6, 1.8, 0.055], 'plastic_ivory');
  const parts = [
    box('body', [-0.3, 0, -0.325], [-0.27, 1.85, 0.27], 'plastic_ivory'),
    box('body', [0.27, 0, -0.325], [0.3, 1.85, 0.27], 'plastic_ivory'),
    box('body', [-0.27, 0, -0.325], [0.27, 1.85, -0.3], 'plastic_ivory'),
    box('body', [-0.27, 1.82, -0.3], [0.27, 1.85, 0.27], 'plastic_ivory'),
    box('body', [-0.27, 0, -0.3], [0.27, 0.1, 0.27], 'plastic_grey'),
    box('body', [-0.1, 1.8, -0.2], [0.1, 1.82, -0.1], 'emit_cool'),
    door,
    box('door', [0.54, 0.7, 0.055], [0.565, 1.2, 0.09], 'steel_brushed'),
    box('door', [0.2, 1.55, 0.055], [0.4, 1.62, 0.058], 'emit_green'),
  ];
  for (const y of [0.5, 0.95, 1.4]) parts.push(box('body', [-0.27, y, -0.3], [0.27, y + 0.015, 0.25], 'glass_pane'));
  return definePrefab(
    {
      id: 'fridge_lab_01',
      title: 'Lednice laboratorní',
      category: 'device.lab',
      nodes: [node('body'), node('door', 'body', [-0.3, 0.05, 0.27])],
      joints: [hinge('swing', 'door', [0, -1, 0], 0, 120, { damping: 4, drive: 'manual' })],
      parts,
      colliders: [cbox('body', [-0.3, 0, -0.325], [0.3, 1.85, 0.27]), collide(door)],
      components: { ...kin, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít lednici', range: 1.6, manipulate: true } },
      inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
      outputs: ['opened', 'closed'],
      gen: 'lab.mjs#fridge',
    },
    { swing: 'Dveře chladničky: panty s dorazem 115–130°; 120°. Úvaha, neměřeno.' },
  );
}

/** Nástěnný terminál s obrazovkou; počátek ve středu zařízení na zdi (montážní výška 1,35 m určuje generátor). */
export function terminalWall() {
  return definePrefab({
    id: 'terminal_wall_01',
    title: 'Terminál nástěnný',
    category: 'device.terminal',
    nodes: [node('body'), node('screen', 'body', [0, 0.04, 0.1])],
    parts: [
      box('body', [-0.28, -0.2, 0], [0.28, 0.24, 0.1], 'steel_dark'),
      box('body', [-0.26, -0.3, 0], [0.26, -0.2, 0.2], 'steel_dark'),
      box('body', [-0.22, -0.2, 0.1], [0.22, -0.185, 0.19], 'plastic_grey'),
      box('screen', [-0.22, -0.14, 0], [0.22, 0.14, 0.004], 'emit_screen'),
      box('body', [0.22, -0.16, 0.1], [0.25, -0.13, 0.104], 'emit_green'),
    ],
    colliders: [cbox('body', [-0.28, -0.3, 0], [0.28, 0.24, 0.2])],
    components: {
      physics: { body: 'static' },
      interact: { kind: 'terminal', prompt: 'Použít terminál', range: 1.8, station: { eye: [0, 0.2, 0.65], look: [0, 0.04, 0.1], fov: 50 } },
      screen: { node: 'screen', size: [0.44, 0.28], res: [640, 400], app: 'wall_console' },
    },
    ...IO.terminal,
    gen: 'lab.mjs#terminalWall',
  });
}

/** Stolní počítač: monitor, klávesnice a skříň. Staví se na desku stolu. */
export function terminalDesk() {
  return definePrefab({
    id: 'terminal_desk_01',
    title: 'Terminál stolní',
    category: 'device.terminal',
    nodes: [node('base'), node('screen', 'base', [0, 0.27, -0.1])],
    parts: [
      box('base', [-0.1, 0, -0.16], [0.1, 0.015, -0.04], 'plastic_dark'),
      box('base', [-0.02, 0.015, -0.12], [0.02, 0.12, -0.09], 'plastic_dark'),
      box('screen', [-0.25, -0.16, -0.03], [0.25, 0.16, 0], 'plastic_dark'),
      box('screen', [-0.23, -0.14, 0], [0.23, 0.14, 0.003], 'emit_screen'),
      box('base', [-0.2, 0, 0.08], [0.2, 0.02, 0.22], 'plastic_grey'),
      box('base', [0.3, 0, -0.2], [0.44, 0.36, 0.18], 'plastic_ivory'),
      box('base', [0.33, 0.3, 0.18], [0.36, 0.32, 0.183], 'emit_green'),
    ],
    colliders: [cbox('base', [-0.25, 0, -0.16], [0.25, 0.43, -0.07], 'prop'), cbox('base', [0.3, 0, -0.2], [0.44, 0.36, 0.18], 'prop')],
    components: {
      physics: { body: 'static' },
      interact: { kind: 'terminal', prompt: 'Použít počítač', range: 1.8, station: { eye: [0, 0.42, 0.55], look: [0, 0.27, -0.1], fov: 50 } },
      screen: { node: 'screen', size: [0.46, 0.28], res: [640, 400], app: 'desk_console' },
    },
    ...IO.terminal,
    gen: 'lab.mjs#terminalDesk',
  });
}

export const LAB = [centrifuge, fumeHood, microscope, fridge, terminalWall, terminalDesk];
