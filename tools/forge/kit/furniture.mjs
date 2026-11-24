// xForge, sada kit_base: nábytek. Počátek = střed půdorysu na podlaze, přední strana +Z (zadní stěna ke zdi).
// Rozměry z reality: pracovní deska 0,72–0,76 m (laboratorní 0,9 m ve stoje), sedák 0,45 m.

import { box, boxc, cyl, cbox, collide, node, hinge, slider, definePrefab, IO } from '../lib.mjs';
import { noise, bevelBox, planks, framedPanel, cornice, handle } from '../shapes.mjs';

const fixed = { physics: { body: 'static' } };
const kin = { physics: { body: 'kinematic' } };
/** Čtyři nohy čtvercového průřezu v rozích obdélníku. */
const legs = (n, hx, hz, y0, y1, t, mat) => [-1, 1].flatMap((sx) => [-1, 1].map((sz) => boxc(n, [sx * (hx - t / 2), (y0 + y1) / 2, sz * (hz - t / 2)], [t, y1 - y0, t], mat)));

/** Kartotéka se čtyřmi zásuvkami; pohyblivá je horní (formát verze 1: jedna interakce na prefab). */
export function cabinetFile() {
  const [hx, h, hz] = [0.23, 1.32, 0.31];
  const parts = [
    box('body', [-hx, 0, -hz], [-hx + 0.02, h, hz - 0.02], 'steel_painted'),
    box('body', [hx - 0.02, 0, -hz], [hx, h, hz - 0.02], 'steel_painted'),
    box('body', [-hx + 0.02, 0, -hz], [hx - 0.02, h, -hz + 0.02], 'steel_painted'),
    box('body', [-hx + 0.02, h - 0.02, -hz + 0.02], [hx - 0.02, h, hz - 0.02], 'steel_painted'),
    box('body', [-hx + 0.02, 0, -hz + 0.02], [hx - 0.02, 0.045, hz - 0.02], 'steel_dark'),
  ];
  for (const y of [0.05, 0.365, 0.68]) parts.push(box('body', [-hx + 0.025, y, hz - 0.02], [hx - 0.025, y + 0.305, hz], 'steel_painted'), box('body', [-0.06, y + 0.2, hz], [0.06, y + 0.22, hz + 0.025], 'steel_brushed'));
  parts.push(
    box('drawer', [-hx + 0.025, 0, hz - 0.02], [hx - 0.025, 0.3, hz], 'steel_painted'),
    box('drawer', [-0.2, 0.02, -0.27], [0.2, 0.035, hz - 0.02], 'steel_dark'),
    box('drawer', [-0.2, 0.035, -0.27], [-0.19, 0.22, hz - 0.02], 'steel_dark'),
    box('drawer', [0.19, 0.035, -0.27], [0.2, 0.22, hz - 0.02], 'steel_dark'),
    box('drawer', [-0.19, 0.035, -0.27], [0.19, 0.22, -0.26], 'steel_dark'),
    box('drawer', [-0.06, 0.2, hz], [0.06, 0.22, hz + 0.025], 'steel_brushed'),
  );
  return definePrefab(
    {
      id: 'cabinet_file_01',
      title: 'Kartotéka zásuvková',
      category: 'prop.furniture',
      nodes: [node('body'), node('drawer', 'body', [0, 0.995, 0])],
      joints: [slider('pull', 'drawer', [0, 0, 1], 0, 0.45, { damping: 10, drive: 'manual' })],
      parts,
      colliders: [cbox('body', [-hx, 0, -hz], [hx, h, hz - 0.02]), cbox('drawer', [-hx + 0.025, 0, -0.27], [hx - 0.025, 0.3, hz + 0.025])],
      components: { ...kin, interact: { kind: 'drawer', joint: 'pull', prompt: 'Vysunout zásuvku', range: 1.6, manipulate: true } },
      ...IO.drawer,
      gen: 'furniture.mjs#cabinetFile',
    },
    { pull: 'Kartotéka hloubky 0,62 m s plnovýsuvem: zásuvka vyjede asi o tři čtvrtiny hloubky (0,45 m), dál ji drží doraz. Úvaha, neměřeno.' },
  );
}

/** Skříň s dvířky (rám s vpadlou výplní), římsou nahoře, zapuštěným soklem a třemi policemi uvnitř. */
export function cabinetDoor() {
  const [hx, h, hz] = [0.25, 1.8, 0.2];
  const doorFrame = box('door', [0.003, 0, 0], [0.497, 1.68, 0.02], 'wood_pine'); // obrys dvířek pro kolizi
  const parts = [
    box('body', [-hx, 0.07, -hz], [-hx + 0.02, h - 0.05, hz], 'wood_pine'),
    box('body', [hx - 0.02, 0.07, -hz], [hx, h - 0.05, hz], 'wood_pine'),
    box('body', [-hx + 0.02, 0.07, -hz], [hx - 0.02, h - 0.05, -hz + 0.012], 'wood_old'),
    box('body', [-hx + 0.02, 0.07, -hz + 0.012], [hx - 0.02, 0.09, hz], 'wood_pine'),
    box('body', [-hx + 0.03, 0, -hz + 0.02], [hx - 0.03, 0.07, hz - 0.03], 'wood_old'), // sokl zapuštěný o 3 cm
    ...cornice('body', -hx, hx, -hz, hz, h - 0.05, [[0.02, 0], [0.012, 0.012], [0.018, 0.022]], 'wood_pine').parts,
    ...framedPanel('door', 0.003, 0.497, 0, 1.68, 0, 0.022, 0.065, 0.008, 'wood_pine'),
    ...handle('door', 0.44, 0.9, 0.022, 0.012, 'steel_brushed'),
  ];
  for (const y of [0.5, 0.95, 1.4]) parts.push(box('body', [-hx + 0.02, y, -hz + 0.012], [hx - 0.02, y + 0.02, hz - 0.03], 'wood_pine'), box('body', [-hx + 0.02, y + 0.02, hz - 0.045], [hx - 0.02, y + 0.035, hz - 0.03], 'wood_old'));
  return definePrefab(
    {
      id: 'cabinet_door_01',
      title: 'Skříň s dvířky',
      category: 'prop.furniture',
      nodes: [node('body'), node('door', 'body', [-hx, 0.09, hz])],
      joints: [hinge('swing', 'door', [0, -1, 0], 0, 110, { damping: 3, drive: 'manual' })],
      parts,
      colliders: [cbox('body', [-hx, 0, -hz], [hx, h, hz]), collide(doorFrame)],
      components: { ...kin, interact: { kind: 'door', joint: 'swing', prompt: 'Otevřít skříň', range: 1.6, manipulate: true } },
      inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
      outputs: ['opened', 'closed'],
      gen: 'furniture.mjs#cabinetDoor',
    },
    { swing: 'Nábytkový hrncový závěs má běžný úhel otevření 110°.' },
  );
}

/** Stůl bez pohyblivých částí. kind: 'work' (dílenský 0,75 m), 'lab' (laboratorní 0,9 m s policí a zadním lemem). */
export function table(kind = 'work') {
  const lab = kind === 'lab';
  const [hx, hz, h] = lab ? [0.9, 0.375, 0.9] : [0.8, 0.4, 0.75];
  const top = box('top', [-hx, h - 0.04, -hz], [hx, h, hz], lab ? 'plastic_dark' : 'wood_pine');
  const legMat = lab ? 'steel_brushed' : 'steel_dark';
  const lt = lab ? 0.04 : 0.06;
  // deska se sraženými hranami; u dílenského stolu ze tří slepených prken s viditelnými spárami
  const parts = lab ? bevelBox('top', [-hx, h - 0.04, -hz], [hx, h, hz], 'plastic_dark', 0.004) : planks('top', [-hx, h - 0.04, -hz], [hx, h, hz], 2, 3, 0.0015, ['wood_pine'], noise('table_work_01'), { out: 1, lenJitter: 0.001 });
  parts.push(...legs('top', hx - 0.03, hz - 0.03, 0.012, h - 0.04, lt, legMat));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(boxc('top', [sx * (hx - 0.03 - lt / 2), 0.006, sz * (hz - 0.03 - lt / 2)], [lt + 0.012, 0.012, lt + 0.012], 'rubber_black'));
  for (const s of [-1, 1]) parts.push(boxc('top', [0, h - 0.09, s * (hz - 0.05)], [2 * hx - 0.14, 0.06, 0.02], legMat), boxc('top', [s * (hx - 0.05), h - 0.09, 0], [0.02, 0.06, 2 * hz - 0.14], legMat));
  if (!lab) parts.push(boxc('top', [0, 0.16, 0], [2 * hx - 0.12, 0.03, 0.03], legMat), ...[-1, 1].map((s) => boxc('top', [s * (hx - 0.03 - lt / 2), 0.16, 0], [0.03, 0.03, 2 * hz - 0.12], legMat)));
  if (lab) parts.push(box('top', [-hx + 0.05, 0.2, -hz + 0.05], [hx - 0.05, 0.225, hz - 0.05], 'steel_brushed'), box('top', [-hx, h, -hz], [hx, h + 0.1, -hz + 0.02], 'tile_white'));
  return definePrefab({
    id: lab ? 'table_lab_01' : 'table_work_01',
    title: lab ? 'Stůl laboratorní 1,8 × 0,75 m' : 'Stůl pracovní 1,6 × 0,8 m',
    category: 'prop.furniture',
    nodes: [node('top')],
    parts,
    colliders: [collide(top), cbox('top', [-hx + 0.03, 0, -hz + 0.03], [hx - 0.03, h - 0.04, hz - 0.03])],
    components: fixed,
    gen: 'furniture.mjs#table',
    params: { kind, top: h },
  });
}

/** Kancelářský stůl se zásuvkovým kontejnerem; pohyblivá je horní zásuvka. */
export function deskOffice() {
  const [hx, hz, h] = [0.7, 0.35, 0.74];
  const top = box('desk', [-hx, h - 0.03, -hz], [hx, h, hz], 'wood_oak');
  const parts = [
    top,
    box('desk', [-hx + 0.02, 0, -hz + 0.03], [-hx + 0.045, h - 0.03, hz - 0.03], 'wood_oak'),
    box('desk', [-hx + 0.045, 0.3, -hz + 0.03], [0.3, h - 0.03, -hz + 0.05], 'wood_oak'),
    box('desk', [0.3, 0.08, -hz + 0.03], [0.32, h - 0.03, hz - 0.03], 'wood_oak'),
    box('desk', [0.66, 0.08, -hz + 0.03], [0.68, h - 0.03, hz - 0.03], 'wood_oak'),
    box('desk', [0.32, 0.08, -hz + 0.03], [0.66, 0.1, hz - 0.03], 'wood_oak'),
    box('desk', [0.32, 0.1, -hz + 0.03], [0.66, h - 0.03, -hz + 0.045], 'wood_old'),
  ];
  for (const y of [0.11, 0.31]) parts.push(box('desk', [0.325, y, hz - 0.045], [0.655, y + 0.19, hz - 0.03], 'wood_oak'), box('desk', [0.43, y + 0.09, hz - 0.03], [0.55, y + 0.105, hz - 0.01], 'steel_brushed'));
  parts.push(
    box('drawer', [-0.165, 0, hz - 0.045], [0.165, 0.19, hz - 0.03], 'wood_oak'),
    box('drawer', [-0.16, 0.015, -0.22], [0.16, 0.025, hz - 0.045], 'wood_pine'),
    box('drawer', [-0.16, 0.025, -0.22], [-0.15, 0.15, hz - 0.045], 'wood_pine'),
    box('drawer', [0.15, 0.025, -0.22], [0.16, 0.15, hz - 0.045], 'wood_pine'),
    box('drawer', [-0.06, 0.09, hz - 0.03], [0.06, 0.105, hz - 0.01], 'steel_brushed'),
  );
  return definePrefab(
    {
      id: 'desk_office_01',
      title: 'Stůl kancelářský se zásuvkami 1,4 × 0,7 m',
      category: 'prop.furniture',
      nodes: [node('desk'), node('drawer', 'desk', [0.49, 0.51, 0])],
      joints: [slider('pull', 'drawer', [0, 0, 1], 0, 0.33, { damping: 8, drive: 'manual' })],
      parts,
      colliders: [collide(top), cbox('desk', [0.3, 0.08, -hz + 0.03], [0.68, h - 0.03, hz - 0.045]), cbox('desk', [-hx + 0.02, 0, -hz + 0.03], [-hx + 0.045, h - 0.03, hz - 0.03]), cbox('drawer', [-0.165, 0, -0.22], [0.165, 0.19, hz - 0.01])],
      components: { ...kin, interact: { kind: 'drawer', joint: 'pull', prompt: 'Vysunout zásuvku', range: 1.6, manipulate: true } },
      ...IO.drawer,
      gen: 'furniture.mjs#deskOffice',
      params: { top: h },
    },
    { pull: 'Zásuvka stolu na kuličkových výsuvech délky 400 mm s částečným výsuvem: 0,30–0,35 m; 0,33 m. Úvaha, neměřeno.' },
  );
}

/** Otočná kancelářská židle; dá se na ni sednout (klidný režim). */
export function chairOffice() {
  return definePrefab(
    {
      id: 'chair_office_01',
      title: 'Židle kancelářská otočná',
      category: 'prop.furniture',
      nodes: [node('base'), node('seat', 'base', [0, 0.4, 0])],
      joints: [hinge('swivel', 'seat', [0, 1, 0], -180, 180, { rest: 0, damping: 1.5, drive: 'manual' })],
      parts: [
        boxc('base', [0, 0.05, 0], [0.6, 0.04, 0.06], 'plastic_dark'),
        boxc('base', [0, 0.05, 0], [0.06, 0.04, 0.6], 'plastic_dark'),
        cyl('base', [0, 0.22, 0], 0.03, 0.36, 'y', 'steel_brushed'),
        box('seat', [-0.23, 0, -0.23], [0.23, 0.06, 0.23], 'fabric_blue'),
        box('seat', [-0.03, 0.02, -0.26], [0.03, 0.36, -0.23], 'plastic_dark'),
        box('seat', [-0.21, 0.28, -0.3], [0.21, 0.62, -0.26], 'fabric_blue'),
      ],
      colliders: [cbox('base', [-0.25, 0, -0.25], [0.25, 0.4, 0.25], 'prop'), cbox('seat', [-0.23, 0, -0.3], [0.23, 0.62, 0.23], 'prop')],
      components: { ...kin, interact: { kind: 'station', prompt: 'Sednout si', range: 1.6, station: { eye: [0, 1.18, 0.02], look: [0, 1.05, 1], fov: 60 } } },
      ...IO.station,
      gen: 'furniture.mjs#chairOffice',
      params: { seat: 0.46 },
    },
    { swivel: 'Otočná židle se točí dokola; meze ±180° jsou zápis jedné otáčky, protože formát chce konečné meze. Sedák 0,46 m nad zemí.' },
  );
}

/** Obyčejná židle; dá se zvednout a přenést. */
export function chairPlain() {
  const parts = [...legs('seat', 0.2, 0.2, 0, 0.43, 0.035, 'wood_oak'), ...bevelBox('seat', [-0.205, 0.43, -0.2], [0.205, 0.46, 0.21], 'wood_pine', 0.005)];
  for (const s of [-1, 1]) parts.push(boxc('seat', [s * 0.1825, 0.655, -0.1825], [0.035, 0.39, 0.035], 'wood_oak'));
  // opěradlo ze tří latí s mezerami, spojky mezi nohami ve dvou výškách
  for (const y of [0.66, 0.73, 0.8]) parts.push(box('seat', [-0.165, y, -0.198], [0.165, y + 0.045, -0.178], 'wood_pine'));
  parts.push(box('seat', [-0.2, 0.845, -0.2], [0.2, 0.865, -0.165], 'wood_oak'));
  for (const s of [-1, 1]) parts.push(boxc('seat', [s * 0.1825, 0.14, 0], [0.02, 0.025, 0.33], 'wood_oak'), boxc('seat', [0, 0.2, s * 0.1825], [0.33, 0.025, 0.02], 'wood_oak'));
  return definePrefab({
    id: 'chair_plain_01',
    title: 'Židle dřevěná',
    category: 'prop.furniture',
    nodes: [node('seat')],
    parts,
    colliders: [cbox('seat', [-0.2, 0, -0.2], [0.2, 0.46, 0.2], 'prop'), cbox('seat', [-0.2, 0.46, -0.2], [0.2, 0.85, -0.165], 'prop')],
    components: { physics: { body: 'dynamic', mass: 5, friction: 0.6, restitution: 0.1 }, interact: { kind: 'grab', prompt: 'Vzít židli', range: 1.6 }, health: { hp: 40, surface: 'wood' } },
    outputs: ['grabbed', 'dropped'],
    gen: 'furniture.mjs#chairPlain',
    params: { seat: 0.46 },
  });
}

/** Kovový regál. variant 1: šířka 1,0 m, prázdný; variant 2: šířka 1,5 m s krabicemi. */
export function shelfRack(variant = 1) {
  const hx = variant === 1 ? 0.5 : 0.75;
  const [h, hz] = [2, 0.2];
  // stojny z úhelníků (dvě lamely 40 × 2 mm), patky, police z plechu s ohnutými okraji
  const parts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (hx - 0.02);
    const z = sz * (hz - 0.02);
    parts.push(boxc('rack', [x, h / 2, z + sz * 0.019], [0.04, h, 0.002], 'steel_painted'), boxc('rack', [x + sx * 0.019, h / 2, z], [0.002, h, 0.04], 'steel_painted'));
    parts.push(boxc('rack', [x, 0.003, z], [0.06, 0.006, 0.06], 'steel_dark'));
  }
  for (const y of [0.1, 0.56, 1.02, 1.48, 1.94]) {
    parts.push(box('rack', [-hx + 0.005, y + 0.028, -hz + 0.005], [hx - 0.005, y + 0.03, hz - 0.005], 'steel_brushed'));
    for (const sz of [-1, 1]) parts.push(box('rack', [-hx + 0.005, y, sz > 0 ? hz - 0.007 : -hz + 0.005], [hx - 0.005, y + 0.028, sz > 0 ? hz - 0.005 : -hz + 0.007], 'steel_brushed'));
  }
  // krabice s víkem přesahujícím o 5 mm a se štítkem
  const carton = (x0, y0, z0, x1, y1, z1, mat) => [box('rack', [x0, y0, z0], [x1, y1 - 0.02, z1], mat), box('rack', [x0 - 0.005, y1 - 0.02, z0 - 0.005], [x1 + 0.005, y1, z1 + 0.005], mat), box('rack', [(x0 + x1) / 2 - 0.05, (y0 + y1) / 2 - 0.03, z1], [(x0 + x1) / 2 + 0.05, (y0 + y1) / 2 + 0.03, z1 + 0.002], 'plastic_ivory')];
  if (variant === 2) {
    parts.push(...carton(-0.62, 0.13, -0.15, -0.22, 0.43, 0.15, 'wood_pine'), ...carton(-0.1, 0.13, -0.16, 0.4, 0.38, 0.14, 'wood_pine'));
    parts.push(...carton(-0.5, 0.59, -0.14, -0.05, 0.89, 0.16, 'wood_pine'), ...carton(0.15, 1.05, -0.15, 0.6, 1.3, 0.15, 'plastic_grey'), ...carton(-0.6, 1.05, -0.12, -0.3, 1.36, 0.12, 'plastic_grey'));
  }
  return definePrefab({
    id: `shelf_rack_0${variant}`,
    title: variant === 1 ? 'Regál kovový 1,0 × 2,0 m' : 'Regál kovový 1,5 × 2,0 m s krabicemi',
    category: 'prop.furniture',
    nodes: [node('rack')],
    parts,
    colliders: [cbox('rack', [-hx, 0, -hz], [hx, h, hz])],
    components: fixed,
    gen: 'furniture.mjs#shelfRack',
    params: { variant },
  });
}

/** Lavice. kind: 'metal' (dřevěné latě na kovových nohách), 'stone' (kamenná deska na dvou blocích). */
export function bench(kind = 'metal') {
  const stone = kind === 'stone';
  const parts = stone
    ? [
        ...bevelBox('seat', [-0.8, 0.38, -0.22], [0.8, 0.48, 0.22], 'stone_pale', 0.012),
        // podpěry ze dvou kamenů nad sebou, drobně posunutých, se spárou 5 mm
        ...[-0.58, 0.58].flatMap((x, i) => [...bevelBox('seat', [x - 0.1, 0, -0.18], [x + 0.1, 0.185, 0.18], 'stone_block', 0.01), ...bevelBox('seat', [x - 0.1 + (i ? 0.008 : -0.006), 0.19, -0.175 + (i ? -0.004 : 0.006)], [x + 0.1 + (i ? 0.008 : -0.006), 0.38, 0.185 + (i ? -0.004 : 0.006)], 'stone_block', 0.01)]),
      ]
    : [
        ...[-0.13, 0, 0.13].map((z) => boxc('seat', [0, 0.435, z], [1.5, 0.03, 0.11], 'wood_pine')),
        ...[-0.6, 0.6].flatMap((x) => [boxc('seat', [x, 0.21, -0.16], [0.04, 0.42, 0.04], 'steel_dark'), boxc('seat', [x, 0.21, 0.16], [0.04, 0.42, 0.04], 'steel_dark'), boxc('seat', [x, 0.4, 0], [0.04, 0.04, 0.36], 'steel_dark')]),
      ];
  return definePrefab({
    id: stone ? 'bench_stone_01' : 'bench_metal_01',
    title: stone ? 'Lavice kamenná 1,6 m' : 'Lavice s dřevěným sedákem 1,5 m',
    category: 'prop.furniture',
    nodes: [node('seat')],
    parts,
    colliders: [stone ? cbox('seat', [-0.8, 0, -0.22], [0.8, 0.48, 0.22]) : cbox('seat', [-0.75, 0, -0.2], [0.75, 0.45, 0.2])],
    components: fixed,
    gen: 'furniture.mjs#bench',
    params: { kind, seat: stone ? 0.48 : 0.45 },
  });
}

export const FURNITURE = [cabinetFile, cabinetDoor, () => table('work'), () => table('lab'), deskOffice, chairOffice, chairPlain, () => shelfRack(1), () => shelfRack(2), () => bench('metal'), () => bench('stone')];
