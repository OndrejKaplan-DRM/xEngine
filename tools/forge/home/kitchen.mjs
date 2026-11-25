// Sada kit_home: kuchyň a jídelna. Spodní skříňky (dvířka, zásuvky, dřez, sporák s troubou, myčka) a horní skříňky
// ve třech barvách front, digestoř, lednice volně stojící (dvířka na pantu) a vestavná, celé kuchyňské linky 180
// a 240 cm (sestavy), ostrůvek, jídelní stoly a židle, barová stolička, spotřebiče a nádobí na desku, koš.
// Rozměry podle běžných kuchyní: pracovní deska 90 cm, hloubka 60 cm, sokl 10 cm, horní skříňky 35 cm hluboké
// od 145 do 215 cm. Počátek uprostřed půdorysu na podlaze, čelo +Z (spodní skříňky mají záda v z = −0,3).

import { simple, moving, staticFloor } from '../lab/common.mjs';
import { A, merge, T, roundedBox, flatBox, slab, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { legs } from './living.mjs';
import { tubShell } from './soft.mjs';

/** Otvor pro dřez v modulu od x0 šířky w: [x0, x1, z0, z1] (pod lemem dřezu). */
const sinkHole = (x0, w) => [x0 + w / 2 - w * 0.33, x0 + w / 2 + w * 0.33, -0.16, 0.14];
/** Pracovní deska -w/2…w/2 s otvory pro dřez: celé kusy mezi otvory, u otvoru pruh vpředu a vzadu. */
function worktopWithHoles(w, holes, H0) {
  const parts = [];
  let cur = -w / 2;
  for (const [hx0, hx1, hz0, hz1] of [...holes].sort((p, q) => p[0] - q[0])) {
    if (hx0 > cur) parts.push(roundedBox([cur, H0, -0.3], [hx0, 0.9, 0.32], 0.006, 1));
    parts.push(flatBox([hx0, H0, -0.3], [hx1, 0.9, hz0]), flatBox([hx0, H0, hz1], [hx1, 0.9, 0.32]));
    cur = hx1;
  }
  parts.push(roundedBox([cur, H0, -0.3], [w / 2, 0.9, 0.32], 0.006, 1));
  return merge(parts);
}
import { shiftMeshPart as moveMesh } from '../mesh/registry.mjs';

const pad = (i) => String(i).padStart(2, '0');
const floor = () => ({ components: staticFloor(), group: 'world' });
const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } } });
const mk = (cat, f) => (id, title, parts, o = {}) => simple(id, title, `home.${cat}`, parts, { gen: `home/kitchen.mjs#${f}`, ...o });
const FRONTS = [['lacquer_white', 'worktop_stone', 'bílá'], ['wood_kitchen_oak', 'worktop_light', 'dub'], ['lacquer_sage', 'worktop_stone', 'šalvějová']];
const H = 0.86; // horní hrana korpusu, deska do 0,9
// věci na desku linky: výška desky a volný pruh hloubky (pod horními skříňkami)
const COUNTER = { top: 0.9, deck: [-0.28, 0.3] };

/**
 * Spodní modul kuchyně od x0 šířky w: korpus, sokl a čelo podle druhu ('doors', 'drawers', 'sink', 'oven', 'dw').
 * Vrací pole sítí (bez pracovní desky, tu dává sestava jednou přes celou délku).
 */
function base(k, x0, w, kind, front) {
  const x1 = x0 + w;
  const out = [
    A('body', `${k}_carcass`, flatBox([x0 + 0.002, 0.1, -0.3], [x1 - 0.002, H, 0.28]), 'lacquer_white'),
    A('body', `${k}_plinth`, flatBox([x0, 0, -0.28], [x1, 0.1, 0.23]), 'lacquer_anthracite'),
  ];
  const panel = (y0, y1, name) => roundedBox([x0 + 0.003, y0, 0.28], [x1 - 0.003, y1, 0.3], 0.004, 1);
  const grip = (y) => flatBox([(x0 + x1) / 2 - Math.min(0.12, w * 0.3), y - 0.006, 0.3], [(x0 + x1) / 2 + Math.min(0.12, w * 0.3), y + 0.006, 0.318]);
  if (kind === 'drawers') {
    out.push(A('body', `${k}_fronts`, merge([panel(0.11, 0.32), panel(0.33, 0.6), panel(0.61, H - 0.005)]), front), A('body', `${k}_grips`, merge([grip(0.28), grip(0.56), grip(0.8)]), 'steel_brushed'));
  } else if (kind === 'oven') {
    out.push(
      A('body', `${k}_oven`, roundedBox([x0 + 0.01, 0.12, 0.28], [x1 - 0.01, 0.7, 0.305], 0.006, 1), 'enamel_steel'),
      A('body', `${k}_window`, flatBox([x0 + 0.07, 0.22, 0.305], [x1 - 0.07, 0.56, 0.307]), 'hob_glass'),
      A('body', `${k}_bar`, tube([[x0 + 0.08, 0.64, 0.305], [x0 + 0.08, 0.64, 0.33], [x1 - 0.08, 0.64, 0.33], [x1 - 0.08, 0.64, 0.305]], 0.007, 6, { bend: 0.01, bendSeg: 1 }), 'steel_chrome'),
      A('body', `${k}_panel`, flatBox([x0 + 0.01, 0.71, 0.28], [x1 - 0.01, H - 0.005, 0.3]), 'lacquer_anthracite'),
      A('body', `${k}_knobs`, merge([0.15, 0.3, 0.7, 0.85].map((t) => moved(cylinder(0.014, 0, 0.018, { seg: 8, edge: 0.004, n: 1 }), at(mTranslate(x0 + w * t, 0.785, 0.3), mRotate('x', 90))))), 'steel_chrome'),
      A('body', `${k}_clock`, flatBox([x0 + w * 0.42, 0.77, 0.3], [x0 + w * 0.58, 0.8, 0.3006]), 'emit_display'),
      A('body', `${k}_hob`, flatBox([x0 + 0.03, 0.9, -0.25], [x1 - 0.03, 0.906, 0.24]), 'hob_glass'),
      A('body', `${k}_rings`, merge([[0.27, -0.12], [0.73, -0.12], [0.27, 0.12], [0.73, 0.12]].map(([t, z]) => moved(torus(w * 0.11, 0.0025, 0, { seg: 16, n: 2 }), mTranslate(x0 + w * t, 0.907, z)))), 'steel_brushed'),
    );
  } else if (kind === 'dw') {
    out.push(A('body', `${k}_fronts`, merge([panel(0.11, H - 0.005)]), front), A('body', `${k}_grips`, merge([grip(0.8)]), 'steel_brushed'), A('body', `${k}_led`, flatBox([x1 - 0.06, 0.105, 0.3], [x1 - 0.04, 0.11, 0.302]), 'emit_red'));
  } else {
    const two = w > 0.5;
    const fronts = two ? [roundedBox([x0 + 0.003, 0.11, 0.28], [(x0 + x1) / 2 - 0.002, H - 0.005, 0.3], 0.004, 1), roundedBox([(x0 + x1) / 2 + 0.002, 0.11, 0.28], [x1 - 0.003, H - 0.005, 0.3], 0.004, 1)] : [panel(0.11, H - 0.005)];
    const gr = two ? [flatBox([(x0 + x1) / 2 - 0.03, 0.6, 0.3], [(x0 + x1) / 2 - 0.018, 0.8, 0.318]), flatBox([(x0 + x1) / 2 + 0.018, 0.6, 0.3], [(x0 + x1) / 2 + 0.03, 0.8, 0.318])] : [flatBox([x1 - 0.05, 0.6, 0.3], [x1 - 0.038, 0.8, 0.318])];
    out.push(A('body', `${k}_fronts`, merge(fronts), front), A('body', `${k}_grips`, merge(gr), 'steel_brushed'));
    if (kind === 'sink') {
      const cx = (x0 + x1) / 2;
      // nerezový dřez: lem na desce a vydutá vana 18 cm pod ní (deska má pod lemem otvor)
      out.push(
        A('body', `${k}_basin`, tubShell(cx, -0.01, [w * 0.38, 0.19, 0.03], [w * 0.33 - 0.005, 0.145, 0.05], 0.895, 0.904, 0.18, 0.04, 2), 'enamel_steel'),
        A('body', `${k}_drain`, moved(cylinder(0.03, 0, 0.004, { seg: 10 }), mTranslate(cx, 0.725, -0.01)), 'steel_chrome'),
        A('body', `${k}_tap`, merge([moved(cylinder(0.022, 0.9, 0.93, { seg: 10 }), mTranslate(cx, 0, -0.24)), tube([[cx, 0.93, -0.24], [cx, 1.2, -0.24], [cx, 1.2, -0.06], [cx, 1.13, -0.06]], 0.012, 8, { bend: 0.06, bendSeg: 3 })]), 'steel_chrome'),
      );
    }
  }
  return out;
}

/** Horní skříňka od x0 šířky w (zavěšená, 145 až 215 cm, hloubka 35 cm od zad v z = −0,3). */
function upper(k, x0, w, front) {
  const x1 = x0 + w;
  return [
    A('body', `${k}_ucarcass`, flatBox([x0 + 0.002, 1.45, -0.3], [x1 - 0.002, 2.15, 0.03]), 'lacquer_white'),
    A('body', `${k}_ufronts`, merge(w > 0.5 ? [roundedBox([x0 + 0.003, 1.452, 0.03], [(x0 + x1) / 2 - 0.002, 2.148, 0.05], 0.004, 1), roundedBox([(x0 + x1) / 2 + 0.002, 1.452, 0.03], [x1 - 0.003, 2.148, 0.05], 0.004, 1)] : [roundedBox([x0 + 0.003, 1.452, 0.03], [x1 - 0.003, 2.148, 0.05], 0.004, 1)]), front),
    A('body', `${k}_ugrips`, merge(w > 0.5 ? [flatBox([(x0 + x1) / 2 - 0.03, 1.47, 0.05], [(x0 + x1) / 2 - 0.018, 1.6, 0.066]), flatBox([(x0 + x1) / 2 + 0.018, 1.47, 0.05], [(x0 + x1) / 2 + 0.03, 1.6, 0.066])] : [flatBox([x1 - 0.05, 1.47, 0.05], [x1 - 0.038, 1.6, 0.066])]), 'steel_brushed'),
  ];
}

/** Digestoř komínová nad sporákem od x0 šířky w. */
function hood(k, x0, w) {
  const cx = x0 + w / 2;
  return [A('body', `${k}_hood`, merge([lathe([[0, 0], [w * 0.5, 0, 'c'], [w * 0.5, 0.05, 'c'], [0.13, 0.25], [0, 0.25]], { seg: 4, phase: 45 }), flatBox([-0.12, 0.25, -0.12], [0.12, 0.7, 0.12])].map((g) => moved(g, at(mTranslate(cx, 1.5, -0.1), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 1])))), 'enamel_steel')];
}

/** Kuchyňská linka ze sledu modulů [druh, šířka]; horní skříňky nad všemi kromě sporáku (tam digestoř). */
function line(k, mods, front, worktop) {
  const w = mods.reduce((s, [, mw]) => s + mw, 0);
  let x = -w / 2;
  const parts = [];
  mods.forEach(([kind, mw], i) => {
    parts.push(...base(`${k}_m${i}`, x, mw, kind, front));
    parts.push(...(kind === 'oven' ? hood(`${k}_m${i}`, x, mw) : upper(`${k}_m${i}`, x, mw, front)));
    x += mw;
  });
  const holes = [];
  let hx = -w / 2;
  for (const [kind, mw] of mods) {
    if (kind === 'sink') holes.push(sinkHole(hx, mw));
    hx += mw;
  }
  parts.push(A('body', `${k}_top`, worktopWithHoles(w, holes, H), worktop), A('body', `${k}_splash`, flatBox([-w / 2, 0.9, -0.3], [w / 2, 1.45, -0.29]), 'wall_tile_bath'));
  return parts;
}

/** Spodní a horní moduly samostatně, digestoř, celé linky, ostrůvek, lednice. */
export function units() {
  const one = mk('kitchen', 'units');
  const out = [];
  FRONTS.forEach(([front, worktop, name], v) => {
    const s = pad(v + 1);
    const withTop = (k, w, kind) => [...base(k, -w / 2, w, kind, front), A('body', `${k}_top`, worktopWithHoles(w, kind === 'sink' ? [sinkHole(-w / 2, w)] : [], H), worktop)];
    out.push(
      one(`kitchen_base_60_${s}`, `Kuchyňská spodní skříňka 60 cm s dvířky, ${name}`, withTop(`kitchen_base_60_${s}`, 0.6, 'doors'), { ...floor(), params: COUNTER }),
      one(`kitchen_drawers_60_${s}`, `Kuchyňská spodní skříňka 60 cm se zásuvkami, ${name}`, withTop(`kitchen_drawers_60_${s}`, 0.6, 'drawers'), { ...floor(), params: COUNTER }),
      one(`kitchen_sink_80_${s}`, `Kuchyňská skříňka 80 cm s dřezem a baterií, ${name}`, withTop(`kitchen_sink_80_${s}`, 0.8, 'sink'), { ...floor(), params: COUNTER }),
      one(`kitchen_wall_60_${s}`, `Kuchyňská horní skříňka 60 cm, ${name}`, shiftUp(upper(`kitchen_wall_60_${s}`, -0.3, 0.6, front)), wall(1.45)),
      one(`kitchen_line_180_${s}`, `Kuchyňská linka 180 cm (dřez, sporák, horní skříňky), ${name}`, line(`kitchen_line_180_${s}`, [['drawers', 0.4], ['sink', 0.8], ['oven', 0.6]], front, worktop), { ...floor(), params: { assembly: true, ...COUNTER } }),
      one(`kitchen_line_240_${s}`, `Kuchyňská linka 240 cm (myčka, dřez, sporák, zásuvky), ${name}`, line(`kitchen_line_240_${s}`, [['dw', 0.6], ['sink', 0.8], ['oven', 0.6], ['drawers', 0.4]], front, worktop), { ...floor(), params: { assembly: true, ...COUNTER } }),
    );
  });
  out.push(
    one('kitchen_stove_60_01', 'Sporák s troubou a sklokeramickou deskou 60 cm', [...base('kitchen_stove_60_01', -0.3, 0.6, 'oven', 'lacquer_white'), A('body', 'kitchen_stove_60_01_top', flatBox([-0.3, H, -0.3], [0.3, 0.9, 0.3]), 'enamel_steel')], floor()),
    one('kitchen_dishwasher_60_01', 'Myčka nádobí 60 cm', [...base('kitchen_dishwasher_60_01', -0.3, 0.6, 'dw', 'enamel_steel'), A('body', 'kitchen_dishwasher_60_01_top', flatBox([-0.3, H, -0.3], [0.3, 0.9, 0.3]), 'enamel_steel')], floor()),
    one('hood_60_01', 'Komínová digestoř 60 cm', shiftHood(hood('hood_60_01', -0.3, 0.6)), wall(1.5)),
    one('kitchen_island_01', 'Kuchyňský ostrůvek s barovým přesahem', [
      A('body', 'kitchen_island_01_body', flatBox([-0.6, 0.1, -0.3], [0.6, H, 0.3]), 'lacquer_white'),
      A('body', 'kitchen_island_01_plinth', flatBox([-0.58, 0, -0.26], [0.58, 0.1, 0.26]), 'lacquer_anthracite'),
      A('body', 'kitchen_island_01_fronts', merge([-0.6, 0].map((x) => roundedBox([x + 0.003, 0.11, 0.3], [x + 0.597, H - 0.005, 0.32], 0.004, 1))), 'wood_kitchen_oak'),
      A('body', 'kitchen_island_01_top', roundedBox([-0.7, H, -0.6], [0.7, 0.9, 0.34], 0.008, 1), 'worktop_light'),
    ], { ...floor(), params: { top: 0.9 } }),
  );
  // lednice volně stojící s dvířky na pantu (vlevo) a vestavná ve vysoké skříni
  const [w, d, h] = [0.6, 0.65, 1.85];
  out.push(moving('fridge_home_01', 'Lednice s mrazákem volně stojící', 'home.kitchen', [
    A('body', 'fridge_home_01_body', roundedBox([-w / 2, 0.02, -d / 2], [w / 2, h, d / 2 - 0.04], 0.02, 1), 'enamel_steel'),
    A('body', 'fridge_home_01_freezer', roundedBox([-w / 2 + 0.005, 0.03, d / 2 - 0.04], [w / 2 - 0.005, 0.6, d / 2], 0.012, 1), 'enamel_steel'),
    A('body', 'fridge_home_01_fgrip', flatBox([w / 2 - 0.05, 0.45, d / 2], [w / 2 - 0.035, 0.58, d / 2 + 0.03]), 'steel_chrome'),
  ], {
    node: 'door', at: [-w / 2 + 0.005, 0.61, d / 2 - 0.04], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 110, kind: 'door', prompt: 'Otevřít lednici',
    parts: [A('door', 'fridge_home_01_door', roundedBox([0, 0, 0], [w - 0.01, h - 0.62, 0.04], 0.012, 1), 'enamel_steel'), A('door', 'fridge_home_01_grip', flatBox([w - 0.06, 0.05, 0.04], [w - 0.045, 0.4, 0.07]), 'steel_chrome')],
    note: 'Dvířka domácí lednice na levém pantu se otvírají o 90 až 120°; 110°. Úvaha, neměřeno.',
  }, { gen: 'home/kitchen.mjs#units', place: { mount: 'floor' }, group: 'world' }));
  out.push(one('fridge_tall_01', 'Vysoká skříň s vestavnou lednicí', [
    A('body', 'fridge_tall_01_body', flatBox([-0.3, 0.1, -0.3], [0.3, 2.15, 0.28]), 'lacquer_white'),
    A('body', 'fridge_tall_01_plinth', flatBox([-0.3, 0, -0.28], [0.3, 0.1, 0.23]), 'lacquer_anthracite'),
    A('body', 'fridge_tall_01_fronts', merge([roundedBox([-0.297, 0.11, 0.28], [0.297, 0.7, 0.3], 0.004, 1), roundedBox([-0.297, 0.71, 0.28], [0.297, 2.148, 0.3], 0.004, 1)]), 'lacquer_white'),
    A('body', 'fridge_tall_01_grips', merge([flatBox([0.24, 0.55, 0.3], [0.252, 0.68, 0.318]), flatBox([0.24, 0.75, 0.3], [0.252, 1.05, 0.318])]), 'steel_brushed'),
  ], floor()));
  return out;
}

/** Horní skříňku jako nástěnný prefab posune tak, aby počátek byl na líci zdi ve výšce montáže (zády k zdi). */
const shiftUp = (parts) => parts.map((p) => moveMesh(p, 0, -1.45, 0.3));
const shiftHood = (parts) => parts.map((p) => moveMesh(p, 0, -1.5, 0.31));

/** Jídelní stoly a židle, barová stolička. */
export function dining() {
  const one = mk('kitchen', 'dining');
  const table = (k, w, d, mat, legMat) => [A('body', `${k}_top`, slab(0, 0, w, d, 0.72, 0.75, 0.02, 2, 0.003), mat), legs(k, w, d, 0.72, legMat, 0.025, 0.07), A('body', `${k}_apron`, merge([flatBox([-w / 2 + 0.07, 0.64, -d / 2 + 0.06], [w / 2 - 0.07, 0.72, -d / 2 + 0.08]), flatBox([-w / 2 + 0.07, 0.64, d / 2 - 0.08], [w / 2 - 0.07, 0.72, d / 2 - 0.06])]), mat)];
  const chair = (k, seatMat, frameMat, padded) => [
    A('body', `${k}_seat`, padded ? roundedBox([-0.22, 0.42, -0.2], [0.22, 0.48, 0.22], 0.02, 1) : flatBox([-0.22, 0.44, -0.2], [0.22, 0.47, 0.22]), seatMat),
    A('body', `${k}_back`, padded ? roundedBox([-0.21, 0.5, -0.24], [0.21, 0.88, -0.2], 0.015, 1) : merge([flatBox([-0.2, 0.62, -0.235], [0.2, 0.7, -0.215]), flatBox([-0.2, 0.78, -0.235], [0.2, 0.86, -0.215])]), padded ? seatMat : frameMat),
    A('body', `${k}_frame`, merge([...[-1, 1].flatMap((sx) => [flatBox([sx * 0.2 - 0.015, 0, 0.17], [sx * 0.2 + 0.015, 0.44, 0.2]), flatBox([sx * 0.2 - 0.015, 0, -0.235], [sx * 0.2 + 0.015, 0.88, -0.205])])]), frameMat),
  ];
  return [
    one('dining_table_4_01', 'Jídelní stůl pro čtyři 140 × 80 cm, dub', table('dining_table_4_01', 1.4, 0.8, 'wood_kitchen_oak', 'wood_kitchen_oak'), floor()),
    one('dining_table_6_01', 'Jídelní stůl pro šest 200 × 90 cm, ořech', table('dining_table_6_01', 2.0, 0.9, 'wood_walnut', 'plastic_black'), floor()),
    one('dining_table_round_01', 'Kulatý jídelní stůl Ø 110 cm', [A('body', 'dining_table_round_01_top', cylinder(0.55, 0.72, 0.75, { seg: 28, edge: 0.006, n: 1 }), 'lacquer_white'), A('body', 'dining_table_round_01_foot', lathe([[0, 0], [0.3, 0, 'c'], [0.28, 0.03, 'c'], [0.05, 0.08], [0.04, 0.72], [0, 0.72]], { seg: 20 }), 'lacquer_white')], floor()),
    one('chair_dining_01', 'Jídelní židle dřevěná', chair('chair_dining_01', 'wood_kitchen_oak', 'wood_kitchen_oak', false), floor()),
    one('chair_dining_02', 'Jídelní židle čalouněná', chair('chair_dining_02', 'fabric_sofa_beige', 'wood_walnut', true), floor()),
    one('chair_dining_03', 'Jídelní židle s kovovým rámem', chair('chair_dining_03', 'wood_birch', 'plastic_black', false), floor()),
    one('stool_bar_01', 'Barová stolička', [A('body', 'stool_bar_01_seat', cylinder(0.19, 0.72, 0.77, { seg: 18, edge: 0.015, n: 1 }), 'leather_brown'), A('body', 'stool_bar_01_frame', merge([cylinder(0.025, 0.02, 0.72, { seg: 8 }), lathe([[0, 0], [0.22, 0, 'c'], [0.21, 0.02, 'c'], [0, 0.02]], { seg: 18 }), moved(torus(0.15, 0.008, 0, { seg: 16, n: 2 }), mTranslate(0, 0.3, 0))]), 'steel_chrome')], floor()),
  ];
}

/** Spotřebiče a nádobí na desku, koš. */
export function appliances() {
  const one = mk('kitchen', 'appliances');
  return [
    one('microwave_01', 'Mikrovlnná trouba', [A('body', 'microwave_01_body', roundedBox([-0.24, 0, -0.18], [0.24, 0.28, 0.18], 0.012, 1), 'enamel_steel'), A('body', 'microwave_01_window', flatBox([-0.21, 0.04, 0.18], [0.08, 0.24, 0.182]), 'hob_glass'), A('body', 'microwave_01_panel', flatBox([0.1, 0.03, 0.18], [0.22, 0.25, 0.181]), 'lacquer_anthracite'), A('body', 'microwave_01_lcd', flatBox([0.12, 0.2, 0.181], [0.2, 0.23, 0.1815]), 'emit_display')]),
    one('kettle_01', 'Rychlovarná konvice', [A('body', 'kettle_01_base', cylinder(0.085, 0, 0.02, { seg: 14, edge: 0.005, n: 1 }), 'plastic_black'), A('body', 'kettle_01_body', lathe([[0, 0.02], [0.075, 0.02, 'c'], [0.08, 0.15], [0.06, 0.22, 'c'], [0, 0.23]], { seg: 16 }), 'enamel_steel'), A('body', 'kettle_01_handle', tube([[-0.07, 0.19, 0], [-0.12, 0.19, 0], [-0.12, 0.06, 0], [-0.075, 0.06, 0]], 0.012, 6, { bend: 0.03, bendSeg: 2 }), 'plastic_black'), A('body', 'kettle_01_spout', tube([[0.07, 0.17, 0], [0.11, 0.2, 0]], 0.012, 6), 'enamel_steel')]),
    one('coffee_maker_01', 'Kávovar', [A('body', 'coffee_maker_01_body', roundedBox([-0.12, 0, -0.18], [0.12, 0.34, 0.12], 0.02, 1), 'lacquer_anthracite'), A('body', 'coffee_maker_01_spout', roundedBox([-0.05, 0.2, 0.08], [0.05, 0.25, 0.16], 0.01, 1), 'steel_chrome'), A('body', 'coffee_maker_01_tray', flatBox([-0.1, 0.01, 0.1], [0.1, 0.03, 0.17]), 'steel_chrome'), A('body', 'coffee_maker_01_cup', moved(lathe([[0, 0], [0.025, 0, 'c'], [0.035, 0.06], [0.032, 0.06], [0.022, 0.005], [0, 0.005]], { seg: 12 }), mTranslate(0, 0.03, 0.13)), 'ceramic_white'), A('body', 'coffee_maker_01_lcd', flatBox([-0.06, 0.27, 0.12], [0.06, 0.31, 0.1205]), 'emit_display')]),
    one('toaster_01', 'Topinkovač', [A('body', 'toaster_01_body', roundedBox([-0.15, 0, -0.08], [0.15, 0.19, 0.08], 0.04, 1), 'lacquer_white'), A('body', 'toaster_01_slots', merge([-1, 1].map((s) => flatBox([-0.11, 0.19, s * 0.03 - 0.013], [0.11, 0.1905, s * 0.03 + 0.013]))), 'plastic_black'), A('body', 'toaster_01_lever', flatBox([0.15, 0.12, -0.01], [0.17, 0.14, 0.01]), 'plastic_black')]),
    one('knife_block_01', 'Blok s noži', [A('body', 'knife_block_01_block', moved(roundedBox([-0.06, 0, -0.08], [0.06, 0.22, 0.08], 0.01, 1), at(mTranslate(0, 0.022, 0), mRotate('x', -15))), 'wood_walnut'), A('body', 'knife_block_01_handles', merge([-0.03, 0, 0.03].map((x) => moved(roundedBox([x - 0.008, 0.2, -0.06], [x + 0.008, 0.3, -0.03], 0.006, 1), at(mTranslate(0, 0.022, 0), mRotate('x', -15))))), 'plastic_black')]),
    one('cutting_board_01', 'Prkénko na krájení', [A('body', 'cutting_board_01_board', roundedBox([-0.2, 0, -0.13], [0.2, 0.02, 0.13], 0.01, 1), 'wood_birch')]),
    one('pot_01', 'Hrnec s pokličkou', [A('body', 'pot_01_body', lathe([[0, 0], [0.12, 0, 'c'], [0.12, 0.14], [0.125, 0.145], [0.115, 0.145], [0.115, 0.006], [0, 0.006]], { seg: 18 }), 'steel_chrome'), A('body', 'pot_01_lid', lathe([[0.122, 0.145], [0.06, 0.165, 'c'], [0.02, 0.17], [0.02, 0.19], [0, 0.19]], { seg: 18 }), 'hob_glass'), A('body', 'pot_01_handles', merge([-1, 1].map((s) => flatBox([s * 0.12, 0.11, -0.02], [s * 0.15, 0.125, 0.02]))), 'plastic_black')]),
    one('pan_01', 'Pánev', [A('body', 'pan_01_body', lathe([[0, 0], [0.12, 0, 'c'], [0.14, 0.05], [0.135, 0.05], [0.115, 0.005], [0, 0.005]], { seg: 18 }), 'lacquer_anthracite'), A('body', 'pan_01_handle', tube([[0.14, 0.04, 0], [0.34, 0.07, 0]], 0.012, 6), 'plastic_black')]),
    one('dish_rack_01', 'Odkapávač s talíři', [A('body', 'dish_rack_01_tray', roundedBox([-0.22, 0, -0.16], [0.22, 0.03, 0.16], 0.01, 1), 'enamel_steel'), A('body', 'dish_rack_01_plates', merge(Array.from({ length: 6 }, (_, i) => moved(cylinder(0.12, 0, 0.012, { seg: 16 }), at(mTranslate(-0.15 + i * 0.05, 0.13, 0), mRotate('z', 80))))), 'ceramic_white')]),
    one('bread_box_01', 'Chlebník', [A('body', 'bread_box_01_body', roundedBox([-0.2, 0, -0.14], [0.2, 0.16, 0.14], 0.05, 1), 'wood_birch'), A('body', 'bread_box_01_knob', moved(cylinder(0.012, 0, 0.02, { seg: 8 }), at(mTranslate(0, 0.1, 0.14), mRotate('x', 90))), 'plastic_black')]),
    one('plates_stack_01', 'Stoh talířů a hrnky', [A('body', 'plates_stack_01_plates', merge(Array.from({ length: 5 }, (_, i) => lathe([[0, 0], [0.08, 0, 'c'], [0.13, 0.015], [0.125, 0.016], [0, 0.006]].map(([r, y, c]) => (c ? [r, y + i * 0.016, c] : [r, y + i * 0.016])), { seg: 18 }))), 'ceramic_white'), A('body', 'plates_stack_01_mugs', merge([[0.2, 0], [0.2, 0.1]].map(([x, z]) => moved(lathe([[0, 0], [0.04, 0, 'c'], [0.042, 0.1], [0.038, 0.1], [0.036, 0.005], [0, 0.005]], { seg: 12 }), mTranslate(x, 0, z)))), 'lacquer_sage')]),
    one('bottle_wine_01', 'Láhev vína a sklenice', [A('body', 'bottle_wine_01_bottle', lathe([[0, 0], [0.037, 0, 'c'], [0.037, 0.2, 'c'], [0.014, 0.25], [0.013, 0.31], [0, 0.31]], { seg: 12 }), 'glass_amber'), A('body', 'bottle_wine_01_glass', moved(lathe([[0, 0], [0.035, 0, 'c'], [0.004, 0.01], [0.004, 0.08], [0.03, 0.12, 'c'], [0.035, 0.18], [0.033, 0.18], [0, 0.1]], { seg: 12 }), mTranslate(0.1, 0, 0.03)), 'glass_lab')]),
    one('bin_kitchen_01', 'Odpadkový koš s pedálem', [A('body', 'bin_kitchen_01_body', lathe([[0, 0], [0.13, 0, 'c'], [0.14, 0.62], [0, 0.62]], { seg: 18 }), 'enamel_steel'), A('body', 'bin_kitchen_01_lid', cylinder(0.145, 0.62, 0.65, { seg: 18, edge: 0.01, n: 1 }), 'lacquer_anthracite'), A('body', 'bin_kitchen_01_pedal', flatBox([-0.05, 0.01, 0.12], [0.05, 0.03, 0.18]), 'plastic_black')], floor()),
  ];
}
