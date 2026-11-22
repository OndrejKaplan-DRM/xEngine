// Zlatý vzorek xSpace: balík „golden“ s levelem xLab. Vzniká tímto skriptem, aby byl
// opakovatelný (dvě spuštění = stejné bajty) a aby čísla nikdo nepsal ručně.
// Je to společná pravda obou sešen: sešna A ho načítá enginem, sešna B podle něj staví vlastní balíky.
// Použití: node tools/golden/make.mjs [výstupní adresář]   (výchozí packs/golden)

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'packs/golden'));

const r4 = (v) => Math.round(v * 1e4) / 1e4;
const V = (x, y, z) => [r4(x), r4(y), r4(z)];
const SRC = { tool: 'golden', generator: 'tools/golden/make.mjs', license: 'own', author: 'Kristína (Claude) pro Ondřeje Kaplana', date: '2026-11-22' };

/** Zápis JSON: objekty odsazené, pole čísel a krátká pole na jednom řádku. */
function fmt(v, ind = '') {
  if (Array.isArray(v)) {
    if (v.every((x) => x === null || typeof x !== 'object')) return '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']';
    if (v.every((x) => Array.isArray(x) && x.every((y) => typeof y !== 'object'))) return '[' + v.map((x) => fmt(x)).join(', ') + ']';
    const inner = ind + '  ';
    return '[\n' + v.map((x) => inner + fmt(x, inner)).join(',\n') + '\n' + ind + ']';
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    const flat = keys.every((k) => v[k] === null || typeof v[k] !== 'object' || (Array.isArray(v[k]) && v[k].every((x) => typeof x !== 'object')));
    if (flat) {
      const one = '{ ' + keys.map((k) => JSON.stringify(k) + ': ' + fmt(v[k])).join(', ') + ' }';
      if (one.length <= 150) return one;
    }
    const inner = ind + '  ';
    return '{\n' + keys.map((k) => inner + JSON.stringify(k) + ': ' + fmt(v[k], inner)).join(',\n') + '\n' + ind + '}';
  }
  return JSON.stringify(v);
}

// ---- materiály -------------------------------------------------------------------------

const lit = (color, surface, o = {}) => ({ model: 'lit', color, rough: 0.9, metal: 0, uvScale: 1, surface, ...o });
const materials = {
  xspace: 1,
  kind: 'materials',
  materials: {
    concrete_floor: lit([0.42, 0.42, 0.4], 'concrete', { uvScale: 2 }),
    concrete_wall: lit([0.55, 0.54, 0.5], 'concrete', { uvScale: 2 }),
    plaster_white: lit([0.82, 0.82, 0.78], 'concrete'),
    plaster_ceiling: lit([0.7, 0.7, 0.68], 'concrete'),
    tile_lab: lit([0.62, 0.7, 0.72], 'tile', { rough: 0.35, uvScale: 0.6 }),
    metal_plate: lit([0.38, 0.4, 0.43], 'metal', { rough: 0.5, metal: 0.8 }),
    metal_dark: lit([0.16, 0.17, 0.19], 'metal', { rough: 0.55, metal: 0.8 }),
    steel: lit([0.62, 0.64, 0.66], 'metal', { rough: 0.3, metal: 1 }),
    wood_dark: lit([0.3, 0.2, 0.12], 'wood', { rough: 0.7 }),
    wood_crate: lit([0.55, 0.4, 0.22], 'wood', { rough: 0.85 }),
    plastic_white: lit([0.88, 0.88, 0.85], 'plastic', { rough: 0.5 }),
    plastic_black: lit([0.06, 0.06, 0.07], 'plastic', { rough: 0.5 }),
    button_red: lit([0.75, 0.08, 0.06], 'plastic', { rough: 0.4 }),
    hazard_yellow: lit([0.9, 0.72, 0.05], 'metal', { rough: 0.6 }),
    light_panel: { model: 'emissive', color: [1, 0.95, 0.85], emissive: [1, 0.92, 0.8], emissiveStrength: 4, surface: 'glass' },
    screen_glow: { model: 'emissive', color: [0.1, 0.5, 0.35], emissive: [0.15, 0.9, 0.6], emissiveStrength: 2, surface: 'glass' },
  },
};

// ---- prefaby ---------------------------------------------------------------------------

const box = (node, min, max, mat) => ({ node, shape: 'box', min: V(...min), max: V(...max), mat });
const cyl = (node, center, radius, height, axis, mat) => ({ node, shape: 'cyl', center: V(...center), radius, height, axis, mat });
const cbox = (node, min, max, group) => ({ node, shape: 'box', min: V(...min), max: V(...max), group });
const boxTris = (parts) => parts.reduce((s, p) => s + (p.shape === 'box' ? 12 : 16 * 4), 0); // válec: 16 stran × (2 plášť + 2 podstavy)

function prefab(id, title, category, bmin, bmax, rig, parts, rest) {
  return { xspace: 1, kind: 'prefab', id, title, category, bounds: { min: V(...bmin), max: V(...bmax) }, rig, parts, ...rest, tris: boxTris(parts), source: { ...SRC } };
}

const prefabs = [
  prefab('door_hinged_01', 'Dveře otočné 1,0 × 2,1 m', 'arch.door', [-0.5, 0, -1], [0.5, 2.1, 1],
    {
      nodes: [{ id: 'frame' }, { id: 'leaf', parent: 'frame', pos: V(-0.5, 0, 0) }],
      joints: [{ id: 'hinge', node: 'leaf', type: 'hinge', axis: [0, 1, 0], min: 0, max: 105, rest: 0, damping: 4, speed: 120, drive: 'both' }],
    },
    [box('leaf', [0.01, 0.01, -0.02], [0.99, 2.09, 0.02], 'wood_dark'), box('leaf', [0.86, 1.0, 0.02], [0.94, 1.04, 0.08], 'steel'), box('leaf', [0.86, 1.0, -0.08], [0.94, 1.04, -0.02], 'steel')],
    {
      colliders: [cbox('leaf', [0.01, 0.01, -0.02], [0.99, 2.09, 0.02], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'door', joint: 'hinge', prompt: 'Otevřít', range: 1.8, manipulate: true }, health: { hp: 250, surface: 'wood' } },
      inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
      outputs: ['opened', 'closed', 'locked', 'unlocked'],
    }),

  prefab('door_slide_01', 'Dveře posuvné 1,0 × 2,1 m', 'arch.door', [-0.5, 0, -0.04], [1.48, 2.1, 0.04],
    {
      nodes: [{ id: 'frame' }, { id: 'leaf', parent: 'frame' }],
      joints: [{ id: 'slide', node: 'leaf', type: 'slider', axis: [1, 0, 0], min: 0, max: 0.98, rest: 0, speed: 1.6, drive: 'motor' }],
    },
    [box('leaf', [-0.5, 0, -0.03], [0.5, 2.1, 0.03], 'metal_dark'), box('leaf', [-0.5, 1.0, -0.035], [0.5, 1.1, 0.035], 'hazard_yellow')],
    {
      colliders: [cbox('leaf', [-0.5, 0, -0.03], [0.5, 2.1, 0.03], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'door', joint: 'slide', prompt: 'Otevřít', range: 1.8 } },
      inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
      outputs: ['opened', 'closed', 'locked', 'unlocked'],
    }),

  prefab('button_wall_01', 'Tlačítko nástěnné', 'device.control', [-0.06, -0.06, 0], [0.06, 0.06, 0.04],
    {
      nodes: [{ id: 'base' }, { id: 'cap', parent: 'base', pos: V(0, 0, 0.02) }],
      joints: [{ id: 'press', node: 'cap', type: 'slider', axis: [0, 0, -1], min: 0, max: 0.015, rest: 0, spring: 400, damping: 20, drive: 'manual' }],
    },
    [box('base', [-0.06, -0.06, 0], [0.06, 0.06, 0.02], 'metal_dark'), cyl('cap', [0, 0, 0.01], 0.035, 0.02, 'z', 'button_red')],
    {
      colliders: [cbox('base', [-0.06, -0.06, 0], [0.06, 0.06, 0.04], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'button', joint: 'press', prompt: 'Stisknout', range: 1.6 } },
      inputs: ['press', 'lock', 'unlock'],
      outputs: ['pressed', 'released'],
    }),

  prefab('switch_wall_01', 'Vypínač kolébkový', 'device.control', [-0.04, -0.06, 0], [0.04, 0.06, 0.03],
    {
      nodes: [{ id: 'base' }, { id: 'rocker', parent: 'base', pos: V(0, 0, 0.012) }],
      joints: [{ id: 'rock', node: 'rocker', type: 'hinge', axis: [1, 0, 0], min: -15, max: 15, rest: -15, detents: [-15, 15], damping: 2, drive: 'both' }],
    },
    [box('base', [-0.04, -0.06, 0], [0.04, 0.06, 0.012], 'plastic_white'), box('rocker', [-0.02, -0.035, 0], [0.02, 0.035, 0.012], 'plastic_white')],
    {
      colliders: [cbox('base', [-0.04, -0.06, 0], [0.04, 0.06, 0.03], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'switch', joint: 'rock', prompt: 'Přepnout', range: 1.6 } },
      inputs: ['turnOn', 'turnOff', 'toggle'],
      outputs: ['on', 'off'],
    }),

  prefab('lever_wall_01', 'Páka nástěnná', 'device.control', [-0.08, -0.25, 0], [0.08, 0.25, 0.33],
    {
      nodes: [{ id: 'plate' }, { id: 'arm', parent: 'plate', pos: V(0, 0, 0.03) }],
      joints: [{ id: 'swing', node: 'arm', type: 'hinge', axis: [1, 0, 0], min: -40, max: 40, rest: -40, detents: [-40, 40], damping: 6, drive: 'both' }],
    },
    [box('plate', [-0.08, -0.15, 0], [0.08, 0.15, 0.03], 'metal_dark'), box('arm', [-0.015, -0.015, 0], [0.015, 0.015, 0.25], 'steel'), cyl('arm', [0, 0, 0.27], 0.03, 0.05, 'z', 'button_red')],
    {
      colliders: [cbox('plate', [-0.08, -0.15, 0], [0.08, 0.15, 0.03], 'world'), cbox('arm', [-0.03, -0.03, 0], [0.03, 0.03, 0.3], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'lever', joint: 'swing', prompt: 'Přehodit páku', range: 1.6, manipulate: true } },
      inputs: ['turnOn', 'turnOff', 'toggle'],
      outputs: ['on', 'off', 'changed'],
    }),

  prefab('valve_wheel_01', 'Ventil s kolem', 'device.control', [-0.14, -0.14, 0], [0.14, 0.14, 0.14],
    {
      nodes: [{ id: 'stem' }, { id: 'wheel', parent: 'stem', pos: V(0, 0, 0.12) }],
      joints: [{ id: 'turn', node: 'wheel', type: 'hinge', axis: [0, 0, 1], min: 0, max: 1080, rest: 0, damping: 8, drive: 'manual' }],
    },
    [cyl('stem', [0, 0, 0.06], 0.02, 0.12, 'z', 'steel'), cyl('wheel', [0, 0, 0], 0.14, 0.025, 'z', 'button_red'), box('wheel', [-0.13, -0.012, 0.0125], [0.13, 0.012, 0.02], 'steel')],
    {
      colliders: [cbox('wheel', [-0.14, -0.14, -0.0125], [0.14, 0.14, 0.02], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'valve', joint: 'turn', prompt: 'Točit ventilem', range: 1.6, manipulate: true } },
      inputs: ['setLevel'],
      outputs: ['changed', 'opened', 'closed'],
    }),

  prefab('cabinet_drawer_01', 'Skříňka se zásuvkou', 'prop.furniture', [-0.4, 0, -0.25], [0.4, 0.9, 0.66],
    {
      nodes: [{ id: 'body' }, { id: 'drawer', parent: 'body', pos: V(0, 0.5, 0) }],
      joints: [{ id: 'pull', node: 'drawer', type: 'slider', axis: [0, 0, 1], min: 0, max: 0.38, rest: 0, damping: 10, drive: 'manual' }],
    },
    [
      box('body', [-0.4, 0, -0.25], [-0.38, 0.9, 0.25], 'metal_plate'),
      box('body', [0.38, 0, -0.25], [0.4, 0.9, 0.25], 'metal_plate'),
      box('body', [-0.38, 0, -0.25], [0.38, 0.9, -0.23], 'metal_plate'),
      box('body', [-0.38, 0.88, -0.23], [0.38, 0.9, 0.25], 'metal_plate'),
      box('body', [-0.38, 0, -0.23], [0.38, 0.02, 0.25], 'metal_plate'),
      box('body', [-0.37, 0.03, 0.23], [0.37, 0.48, 0.25], 'metal_dark'),
      box('drawer', [-0.37, 0, 0.23], [0.37, 0.36, 0.25], 'metal_dark'),
      box('drawer', [-0.36, 0, -0.2], [0.36, 0.02, 0.23], 'metal_plate'),
      box('drawer', [-0.08, 0.16, 0.25], [0.08, 0.19, 0.28], 'steel'),
    ],
    {
      colliders: [cbox('body', [-0.4, 0, -0.25], [0.4, 0.9, 0.23], 'world'), cbox('drawer', [-0.37, 0, 0.23], [0.37, 0.36, 0.28], 'world')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'drawer', joint: 'pull', prompt: 'Vysunout zásuvku', range: 1.6, manipulate: true } },
      inputs: ['open', 'close', 'lock', 'unlock'],
      outputs: ['opened', 'closed'],
    }),

  prefab('desk_terminal_01', 'Stůl s terminálem', 'device.lab', [-0.7, 0, -0.35], [0.7, 1.14, 0.35],
    { nodes: [{ id: 'desk' }, { id: 'screen', parent: 'desk', pos: V(0, 0.95, -0.15) }] },
    [
      box('desk', [-0.7, 0.72, -0.35], [0.7, 0.75, 0.35], 'wood_dark'),
      box('desk', [-0.68, 0, -0.33], [-0.63, 0.72, -0.28], 'steel'),
      box('desk', [0.63, 0, -0.33], [0.68, 0.72, -0.28], 'steel'),
      box('desk', [-0.68, 0, 0.28], [-0.63, 0.72, 0.33], 'steel'),
      box('desk', [0.63, 0, 0.28], [0.68, 0.72, 0.33], 'steel'),
      box('desk', [-0.04, 0.75, -0.19], [0.04, 0.8, -0.11], 'plastic_black'),
      box('desk', [-0.2, 0.75, 0.05], [0.2, 0.765, 0.2], 'plastic_black'),
      box('screen', [-0.26, -0.17, -0.02], [0.26, 0.17, 0.02], 'plastic_black'),
      box('screen', [-0.24, -0.15, 0.02], [0.24, 0.15, 0.022], 'screen_glow'),
    ],
    {
      colliders: [cbox('desk', [-0.7, 0, -0.35], [0.7, 0.75, 0.35], 'world'), cbox('screen', [-0.26, -0.17, -0.02], [0.26, 0.17, 0.02], 'world')],
      components: {
        physics: { body: 'static' },
        interact: { kind: 'terminal', prompt: 'Použít terminál', range: 1.8, station: { eye: V(0, 1.15, 0.55), look: V(0, 0.95, -0.15), fov: 50 } },
        screen: { node: 'screen', size: [0.48, 0.3], res: [640, 400], app: 'lab_console' },
      },
      inputs: ['print', 'lock', 'unlock'],
      outputs: ['used', 'left', 'command'],
    }),

  prefab('lamp_ceiling_01', 'Svítidlo závěsné', 'prop.light', [-0.18, -0.4, -0.18], [0.18, 0, 0.18],
    { nodes: [{ id: 'mount' }] },
    [cyl('mount', [0, -0.02, 0], 0.06, 0.04, 'y', 'metal_dark'), box('mount', [-0.01, -0.3, -0.01], [0.01, -0.04, 0.01], 'metal_dark'), cyl('mount', [0, -0.34, 0], 0.18, 0.08, 'y', 'metal_dark'), cyl('mount', [0, -0.385, 0], 0.12, 0.01, 'y', 'light_panel')],
    {
      components: { light: { type: 'point', color: [1, 0.92, 0.8], intensity: 60, range: 12, node: 'mount', cast: false, style: 'steady', on: false } },
      inputs: ['turnOn', 'turnOff', 'toggle', 'setLevel'],
      outputs: ['on', 'off'],
    }),

  prefab('crate_wood_01', 'Bedna dřevěná 0,8 m', 'prop.container', [-0.4, 0, -0.4], [0.4, 0.8, 0.4],
    { nodes: [{ id: 'body' }] },
    [box('body', [-0.4, 0, -0.4], [0.4, 0.8, 0.4], 'wood_crate')],
    {
      colliders: [cbox('body', [-0.4, 0, -0.4], [0.4, 0.8, 0.4], 'prop')],
      components: { physics: { body: 'dynamic', mass: 60, friction: 0.7, restitution: 0.1 }, health: { hp: 100, surface: 'wood' } },
      inputs: ['break'],
      outputs: ['damaged', 'broken'],
    }),

  prefab('target_01', 'Terč na stojanu', 'prop.training', [-0.3, 0, -0.03], [0.3, 1.75, 0.03],
    { nodes: [{ id: 'post' }] },
    [box('post', [-0.03, 0, -0.03], [0.03, 1.2, 0.03], 'steel'), cyl('post', [0, 1.45, 0], 0.3, 0.04, 'z', 'hazard_yellow'), cyl('post', [0, 1.45, 0.021], 0.1, 0.01, 'z', 'button_red')],
    {
      colliders: [cbox('post', [-0.03, 0, -0.03], [0.03, 1.2, 0.03], 'world'), { node: 'post', shape: 'cyl', center: V(0, 1.45, 0), radius: 0.3, height: 0.04, axis: 'z', group: 'world' }],
      components: { physics: { body: 'static' }, health: { hp: 100000, surface: 'metal' } },
      inputs: ['reset'],
      outputs: ['hit'],
    }),

  prefab('pickup_medkit_01', 'Lékárnička', 'item.health', [-0.15, 0, -0.1], [0.15, 0.125, 0.1],
    { nodes: [{ id: 'body' }] },
    [box('body', [-0.15, 0, -0.1], [0.15, 0.12, 0.1], 'plastic_white'), box('body', [-0.02, 0.12, -0.06], [0.02, 0.125, 0.06], 'button_red'), box('body', [-0.06, 0.12, -0.02], [0.06, 0.125, 0.02], 'button_red')],
    {
      colliders: [cbox('body', [-0.15, 0, -0.1], [0.15, 0.125, 0.1], 'trigger')],
      components: { physics: { body: 'static' }, interact: { kind: 'pickup', prompt: 'Sebrat lékárničku', range: 1.6 }, pickup: { item: 'health', amount: 25 } },
      inputs: ['enable', 'disable'],
      outputs: ['picked'],
    }),
];

// ---- level xLab ------------------------------------------------------------------------

const T = 0.2; // tloušťka zdí a desek
const brushes = [];
let seq = 0;
const nextId = (tag) => `b_${tag}_${String(++seq).padStart(3, '0')}`;
const brush = (cell, tag, min, max, mat, extra = {}) => brushes.push({ id: nextId(tag), cell, min: V(...min), max: V(...max), mat, tag, ...extra });

/** Zeď podél osy X (deska v rozsahu z0…z1) s otvory [{ a, b, h }] měřenými v ose X. */
function wallX(cell, z0, z1, x0, x1, h, mat, openings = []) {
  let cur = x0;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    if (o.a > cur) brush(cell, 'wall', [cur, 0, z0], [o.a, h, z1], mat);
    if (o.h < h) brush(cell, 'wall', [o.a, o.h, z0], [o.b, h, z1], mat);
    brush(cell, 'floor', [o.a, -T, z0], [o.b, 0, z1], 'concrete_floor'); // práh
    cur = o.b;
  }
  if (cur < x1) brush(cell, 'wall', [cur, 0, z0], [x1, h, z1], mat);
}
/** Zeď podél osy Z (deska v rozsahu x0…x1) s otvory měřenými v ose Z. */
function wallZ(cell, x0, x1, z0, z1, h, mat, openings = []) {
  let cur = z0;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    if (o.a > cur) brush(cell, 'wall', [x0, 0, cur], [x1, h, o.a], mat);
    if (o.h < h) brush(cell, 'wall', [x0, o.h, o.a], [x1, h, o.b], mat);
    brush(cell, 'floor', [x0, -T, o.a], [x1, 0, o.b], 'concrete_floor');
    cur = o.b;
  }
  if (cur < z1) brush(cell, 'wall', [x0, 0, cur], [x1, h, z1], mat);
}
function floorCeil(cell, b, floorMat, ceilMat) {
  brush(cell, 'floor', [b.min[0], -T, b.min[2]], [b.max[0], 0, b.max[2]], floorMat);
  brush(cell, 'ceiling', [b.min[0], b.max[1], b.min[2]], [b.max[0], b.max[1] + T, b.max[2]], ceilMat);
}

const B = (min, max) => ({ min: V(...min), max: V(...max) });
const cells = [
  { id: 'c_start', name: 'Startovní místnost', bounds: B([0, 0, 0], [6, 3, 6]), zone: 'room_small' },
  { id: 'c_corr', name: 'Chodba', bounds: B([2, 0, -8.2], [4, 3, -0.2]), zone: 'corridor' },
  { id: 'c_store', name: 'Sklad', bounds: B([-3.8, 0, -6.2], [1.8, 3, -2.2]), zone: 'room_small' },
  { id: 'c_lab', name: 'Laboratoř', bounds: B([4.2, 0, -8.2], [12.2, 3, -2.2]), zone: 'room_tiled' },
  { id: 'c_hall', name: 'Hala (aréna a zkušební dráha)', bounds: B([-6, 0, -28.4], [12.2, 6, -8.4]), zone: 'hall' },
];
const cellOf = Object.fromEntries(cells.map((c) => [c.id, c.bounds]));

// podlahy a stropy
floorCeil('c_start', cellOf.c_start, 'concrete_floor', 'plaster_ceiling');
floorCeil('c_corr', cellOf.c_corr, 'concrete_floor', 'plaster_ceiling');
floorCeil('c_store', cellOf.c_store, 'concrete_floor', 'plaster_ceiling');
floorCeil('c_lab', cellOf.c_lab, 'tile_lab', 'plaster_ceiling');
floorCeil('c_hall', cellOf.c_hall, 'concrete_floor', 'plaster_ceiling');

// zdi; každou sdílenou zeď vlastní právě jedna buňka (žádné dvojité plochy)
wallX('c_start', -T, 0, -T, 6 + T, 3, 'concrete_wall', [{ a: 2.5, b: 3.5, h: 2.1 }]);
wallX('c_start', 6, 6 + T, -T, 6 + T, 3, 'concrete_wall');
wallZ('c_start', -T, 0, 0, 6, 3, 'concrete_wall');
wallZ('c_start', 6, 6 + T, 0, 6, 3, 'concrete_wall');

wallZ('c_corr', 1.8, 2, -8.2, -0.2, 3, 'concrete_wall', [{ a: -4.7, b: -3.7, h: 2.1 }]);
wallZ('c_corr', 4, 4.2, -8.2, -0.2, 3, 'concrete_wall', [{ a: -6, b: -5, h: 2.1 }]);

wallX('c_store', -6.4, -6.2, -4, 1.8, 3, 'concrete_wall');
wallX('c_store', -2.2, -2, -4, 1.8, 3, 'concrete_wall');
wallZ('c_store', -4, -3.8, -6.2, -2.2, 3, 'concrete_wall');

wallX('c_lab', -2.2, -2, 4.2, 12.4, 3, 'plaster_white');
wallZ('c_lab', 12.2, 12.4, -8.2, -2.2, 3, 'plaster_white');

wallX('c_hall', -8.4, -8.2, -6.2, 12.4, 6, 'concrete_wall', [{ a: 2.25, b: 3.75, h: 2.4 }]);
wallX('c_hall', -28.6, -28.4, -6.2, 12.4, 6, 'concrete_wall');
wallZ('c_hall', -6.2, -6, -28.4, -8.4, 6, 'concrete_wall');
wallZ('c_hall', 12.2, 12.4, -28.4, -8.4, 6, 'concrete_wall');

// hala: zkušební dráha pohybu (testy T1–T4 z case 10) a kryty
brush('c_hall', 'step', [-5, 0, -14], [-2, 0.3, -11], 'metal_plate'); // schod 0,3 m
for (let i = 0; i < 6; i++) brush('c_hall', 'stair', [8, 0, -12 - 0.3 * (i + 1)], [10, 0.25 * (i + 1), -12 - 0.3 * i], 'metal_plate');
brush('c_hall', 'gallery', [8, 1.3, -17.8], [12.2, 1.5, -13.8], 'metal_plate');
brush('c_hall', 'ramp', [-5, 0, -20], [-2.4, 1.5, -18], 'metal_plate', { shape: 'wedge', rise: '+x' }); // 30°: dá se vyjít
brush('c_hall', 'platform', [-2.4, 0, -20], [0, 1.5, -18], 'concrete_wall');
const run50 = 1.5 / Math.tan((50 * Math.PI) / 180);
brush('c_hall', 'ramp', [-5, 0, -23 - run50], [-3, 1.5, -23], 'hazard_yellow', { shape: 'wedge', rise: '-z' }); // 50°: klouže
brush('c_hall', 'platform', [-5, 0, -26], [-3, 1.5, -23 - run50], 'concrete_wall');
for (const [x, z] of [[0, -14], [6, -14], [0, -23], [6, -23]]) brush('c_hall', 'pillar', [x - 0.4, 0, z - 0.4], [x + 0.4, 6, z + 0.4], 'concrete_wall');
brush('c_hall', 'cover', [2, 0, -18.5], [4, 1.2, -18.1], 'concrete_wall');

const quadZ = (z, x0, x1, h) => [V(x0, 0, z), V(x1, 0, z), V(x1, h, z), V(x0, h, z)];
const quadX = (x, z0, z1, h) => [V(x, 0, z0), V(x, 0, z1), V(x, h, z1), V(x, h, z0)];
const portals = [
  { id: 'p_start_corr', a: 'c_start', b: 'c_corr', quad: quadZ(-0.1, 2.5, 3.5, 2.1), door: 'e_door_start' },
  { id: 'p_corr_store', a: 'c_corr', b: 'c_store', quad: quadX(1.9, -4.7, -3.7, 2.1) },
  { id: 'p_corr_lab', a: 'c_corr', b: 'c_lab', quad: quadX(4.1, -6, -5, 2.1), door: 'e_door_lab' },
  { id: 'p_corr_hall', a: 'c_corr', b: 'c_hall', quad: quadZ(-8.3, 2.25, 3.75, 2.4) },
];

const ent = (id, prefabId, cell, pos, yaw = 0, extra = {}) => ({ id, prefab: prefabId, cell, pos: V(...pos), rot: V(0, yaw, 0), ...extra });
const link = (on, target, input, extra = {}) => ({ on, target, input, ...extra });
// natočení: přední strana prefabu je +Z; yaw 0 = čelem k +Z, -90 = čelem k -X, 180 = čelem k -Z, 90 = čelem k +X
const entities = [
  ent('e_door_start', 'door_hinged_01', 'c_start', [3, 0, -0.1]),
  ent('e_switch_start', 'switch_wall_01', 'c_start', [4.2, 1.3, 0], 0, { io: [link('on', 'e_lamp_start', 'turnOn'), link('off', 'e_lamp_start', 'turnOff')] }),
  ent('e_lamp_start', 'lamp_ceiling_01', 'c_start', [3, 3, 3]),
  ent('e_btn_lab', 'button_wall_01', 'c_corr', [4, 1.3, -4.6], -90, { io: [link('pressed', 'e_door_lab', 'open')] }),
  ent('e_door_lab', 'door_slide_01', 'c_corr', [4.1, 0, -5.5], 90, { props: { locked: false }, io: [link('opened', 'e_lamp_lab', 'turnOn', { delay: 0.3 })] }),
  ent('e_lamp_lab', 'lamp_ceiling_01', 'c_lab', [8.2, 3, -5.2]),
  ent('e_desk', 'desk_terminal_01', 'c_lab', [11.4, 0, -5.2], -90, { io: [link('command', 'e_lamp_hall_a', 'toggle')] }),
  ent('e_lever', 'lever_wall_01', 'c_lab', [7, 1.3, -2.2], 180, { io: [link('on', 'e_lamp_hall_a', 'turnOn'), link('off', 'e_lamp_hall_a', 'turnOff')] }),
  ent('e_valve', 'valve_wheel_01', 'c_lab', [9, 1.2, -2.2], 180, { io: [link('changed', 'e_lamp_lab', 'setLevel')] }),
  ent('e_cabinet', 'cabinet_drawer_01', 'c_lab', [6, 0, -7.9]),
  ent('e_crate_s1', 'crate_wood_01', 'c_store', [-2, 0, -4]),
  ent('e_crate_s2', 'crate_wood_01', 'c_store', [-2, 0.8, -4], 20),
  ent('e_crate_s3', 'crate_wood_01', 'c_store', [-0.9, 0, -5.2], 35),
  ent('e_medkit', 'pickup_medkit_01', 'c_store', [-3, 0, -3]),
  ent('e_crate_h1', 'crate_wood_01', 'c_hall', [9, 0, -20]),
  ent('e_crate_h2', 'crate_wood_01', 'c_hall', [9.9, 0, -20.2], 12),
  ent('e_crate_h3', 'crate_wood_01', 'c_hall', [9.4, 0.8, -20.1], 40),
  ent('e_target', 'target_01', 'c_hall', [3, 0, -27.5], 0, { io: [link('hit', 'e_lamp_hall_b', 'toggle')] }),
  ent('e_lamp_hall_a', 'lamp_ceiling_01', 'c_hall', [-1, 6, -13]),
  ent('e_lamp_hall_b', 'lamp_ceiling_01', 'c_hall', [8, 6, -23]),
];

const light = (id, cell, pos, color, intensity, range) => ({ id, cell, type: 'point', pos: V(...pos), color, intensity, range, cast: true });
const WARM = [1, 0.9, 0.75];
const COOL = [0.85, 0.93, 1];
const lights = [
  // svítivost v kandelách; žárovka 60 W má zhruba 64 cd (viz docs/02_KONTRAKTY.md, světlo)
  light('l_start', 'c_start', [3, 2.7, 3], WARM, 12, 9),
  light('l_corr_1', 'c_corr', [3, 2.7, -2.5], WARM, 20, 8),
  light('l_corr_2', 'c_corr', [3, 2.7, -6.5], WARM, 20, 8),
  light('l_store', 'c_store', [-1, 2.7, -4.2], WARM, 10, 8),
  light('l_lab_1', 'c_lab', [6.5, 2.8, -5.2], COOL, 30, 9),
  light('l_lab_2', 'c_lab', [10, 2.8, -5.2], COOL, 30, 9),
  light('l_hall_1', 'c_hall', [-1, 5.5, -13], COOL, 140, 18),
  light('l_hall_2', 'c_hall', [8, 5.5, -13], COOL, 140, 18),
  light('l_hall_3', 'c_hall', [-1, 5.5, -23], COOL, 140, 18),
  light('l_hall_4', 'c_hall', [8, 5.5, -23], COOL, 140, 18),
];

const level = {
  xspace: 1,
  kind: 'level',
  id: 'xlab',
  title: 'xLab: zkušební komora',
  profile: 'real',
  env: { ambient: [0.06, 0.065, 0.08], exposure: 0.6, fog: { color: [0.02, 0.02, 0.03], density: 0.004 } },
  cells,
  portals,
  brushes,
  entities,
  lights,
  triggers: [
    { id: 't_hall_enter', cell: 'c_hall', min: V(2, 0, -9.6), max: V(4, 2.4, -8.6), once: true, io: [link('enter', '@level', 'checkpoint'), link('enter', 'e_lamp_hall_b', 'turnOn')] },
  ],
  spawns: [
    { id: 'sp_player', kind: 'player', pos: V(3, 0, 4.5), yaw: 0 },
    { id: 'sp_enemy_1', kind: 'enemy', pos: V(3, 0, -21), yaw: 180, what: 'dummy' },
  ],
  source: { ...SRC },
};

// ---- zápis -----------------------------------------------------------------------------

const manifest = {
  xspace: 1,
  kind: 'pack',
  id: 'golden',
  title: 'Zlatý vzorek xSpace',
  version: '0.1.0',
  free: true,
  materials: 'materials.json',
  prefabs: prefabs.map((p) => `prefabs/${p.id}.json`),
  levels: ['levels/xlab.json'],
  assets: [],
};

await mkdir(path.join(outDir, 'prefabs'), { recursive: true });
await mkdir(path.join(outDir, 'levels'), { recursive: true });
const write = (file, data) => writeFile(path.join(outDir, file), fmt(data) + '\n');
await write('pack.json', manifest);
await write('materials.json', materials);
for (const p of prefabs) await write(`prefabs/${p.id}.json`, p);
await write('levels/xlab.json', level);
console.log(`${path.relative(root, outDir) || outDir}: ${prefabs.length} prefabů, ${brushes.length} kvádrů, ${entities.length} entit, ${lights.length} světel`);
