// xForge, sada kit_base: nábytek. Počátek = střed půdorysu na podlaze, přední strana +Z (zadní stěna ke zdi).
// Rozměry z reality: pracovní deska 0,72–0,76 m (laboratorní 0,9 m ve stoje), sedák 0,45 m.

import { box, boxc, cyl, cbox, collide, node, hinge, slider, definePrefab, IO } from '../lib.mjs';
import { noise, bevelBox, planks, framedPanel, cornice, handle, tray } from '../shapes.mjs';

const fixed = { physics: { body: 'static' } };
const kin = { physics: { body: 'kinematic' } };
/** Čtyři nohy čtvercového průřezu v rozích obdélníku. */
const legs = (n, hx, hz, y0, y1, t, mat) => [-1, 1].flatMap((sx) => [-1, 1].map((sz) => boxc(n, [sx * (hx - t / 2), (y0 + y1) / 2, sz * (hz - t / 2)], [t, y1 - y0, t], mat)));

/**
 * Kartotéka: korpus se čtyřmi šachtami. Zásuvky jsou samostatné prefaby (drawer_file_01) připojené přes
 * source.params.attach; generátor je postaví jako vlastní entity, takže se každá otevírá zvlášť
 * (formát verze 1 unese jednu interakci na prefab; návrh N-010).
 */
const FILE = { hx: 0.23, h: 1.32, hz: 0.31, slots: [0.05, 0.365, 0.68, 0.995], slot: 0.305 };
export function cabinetFile() {
  const { hx, h, hz, slots, slot } = FILE;
  const parts = [
    box('body', [-hx, 0.045, -hz], [-hx + 0.018, h - 0.02, hz], 'steel_painted'),
    box('body', [hx - 0.018, 0.045, -hz], [hx, h - 0.02, hz], 'steel_painted'),
    box('body', [-hx + 0.018, 0.045, -hz], [hx - 0.018, h - 0.02, -hz + 0.012], 'steel_painted'),
    box('body', [-hx + 0.018, 0.045, -hz + 0.012], [hx - 0.018, h - 0.025, -hz + 0.016], 'steel_dark'), // vnitřek zad
    ...bevelBox('body', [-hx - 0.004, h - 0.02, -hz], [hx + 0.004, h, hz + 0.004], 'steel_painted', 0.004),
    box('body', [-hx + 0.012, 0, -hz + 0.012], [hx - 0.012, 0.045, hz - 0.035], 'steel_dark'), // sokl zapuštěný o 3,5 cm
    box('body', [-hx, 0.04, -hz], [hx, 0.05, hz], 'steel_painted'), // dno
    cyl('body', [0, h - 0.045, hz + 0.003], 0.011, 0.008, 'z', 'steel_brushed'), // zámek nad horní zásuvkou
  ];
  for (const y of slots) {
    // příčka za spárou mezi zásuvkami a teleskopické výsuvy na bocích šachty
    if (y > 0.06) parts.push(box('body', [-hx + 0.018, y - 0.006, hz - 0.03], [hx - 0.018, y - 0.001, hz - 0.004], 'steel_dark'));
    for (const sx of [-1, 1]) parts.push(box('body', [sx > 0 ? hx - 0.03 : -hx + 0.018, y + 0.12, -hz + 0.03], [sx > 0 ? hx - 0.018 : -hx + 0.03, y + 0.14, hz - 0.03], 'steel_brushed'));
  }
  parts.push(box('body', [-hx + 0.018, h - 0.032, hz - 0.03], [hx - 0.018, h - 0.02, hz - 0.004], 'steel_dark'));
  return definePrefab({
    id: 'cabinet_file_01',
    title: 'Kartotéka, korpus pro čtyři zásuvky',
    category: 'prop.furniture',
    nodes: [node('body')],
    parts,
    colliders: [cbox('body', [-hx, 0, -hz], [hx, h, hz - 0.025])],
    components: fixed,
    gen: 'furniture.mjs#cabinetFile',
    params: { attach: slots.map((y) => ({ prefab: 'drawer_file_01', pos: [0, y, hz] })) },
  });
}

/**
 * Zásuvka kartotéky: čelo se sraženými hranami, rámeček na štítek, madlo, dutá vana na závěsné desky
 * (lišty nahoře, šest desek se štítky, papíry) a výsuvy. Počátek = spodní hrana čela na líci (z = 0).
 */
export function drawerFile() {
  const rnd = noise('drawer_file_01');
  const [w, hgt, d] = [0.205, 0.297, 0.58];
  const parts = [
    ...bevelBox('drawer', [-w, 0.004, -0.02], [w, hgt + 0.004, 0], 'steel_painted', 0.004),
    box('drawer', [-0.05, 0.232, 0], [0.05, 0.268, 0.004], 'steel_brushed'), // rámeček na štítek
    box('drawer', [-0.042, 0.238, 0.004], [0.042, 0.262, 0.005], 'plastic_ivory'),
    ...handle('drawer', 0, 0.19, 0, 0.13, 'steel_brushed', 0.022),
    ...tray('drawer', [-0.19, 0.025, -d], [0.19, 0.245, -0.02], 0.008, 'steel_dark'),
  ];
  for (const sx of [-1, 1]) {
    parts.push(box('drawer', [sx * 0.19 - (sx > 0 ? 0 : 0.008), 0.245, -d], [sx * 0.19 + (sx > 0 ? 0.008 : 0), 0.253, -0.03], 'steel_brushed')); // lišta závěsných desek
    parts.push(box('drawer', [sx > 0 ? 0.19 : -0.2, 0.125, -d + 0.02], [sx > 0 ? 0.2 : -0.19, 0.14, -0.04], 'steel_brushed')); // výsuv
  }
  for (let i = 0; i < 6; i++) {
    const z = -0.09 - i * 0.075 + rnd(0.012);
    const top = 0.235 + rnd(0.006);
    parts.push(box('drawer', [-0.182, 0.06, z - 0.004], [0.182, top, z], i % 3 === 2 ? 'paper_kraft' : 'paint_green')); // závěsná deska
    parts.push(box('drawer', [-0.182, top, z - 0.002], [0.188, top + 0.012, z + 0.002], 'steel_dark')); // závěs na lištu
    parts.push(box('drawer', [-0.15 + i * 0.05, top + 0.012, z - 0.003], [-0.11 + i * 0.05, top + 0.03, z - 0.001], 'plastic_ivory')); // štítek
    if (i % 2 === 0) parts.push(box('drawer', [-0.17, 0.07, z - 0.012], [0.165 + rnd(0.01), top - 0.02 - rnd(0.02), z - 0.005], 'plastic_ivory')); // papíry
  }
  return definePrefab(
    {
      id: 'drawer_file_01',
      title: 'Zásuvka kartotéky se závěsnými deskami',
      category: 'prop.furniture',
      nodes: [node('base'), node('drawer', 'base')],
      joints: [slider('pull', 'drawer', [0, 0, 1], 0, 0.45, { damping: 10, drive: 'manual' })],
      parts,
      colliders: [cbox('drawer', [-w, 0.004, -d], [w, hgt + 0.004, 0.022])],
      components: { ...kin, interact: { kind: 'drawer', joint: 'pull', prompt: 'Vysunout zásuvku', range: 1.6, manipulate: true } },
      ...IO.drawer,
      gen: 'furniture.mjs#drawerFile',
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

/**
 * Kancelářský stůl s kontejnerem pro tři zásuvky (drawer_desk_01, připojené přes source.params.attach, každá se
 * otevírá zvlášť). Deska se sraženými hranami, krycí panel, průchodka na kabely, zapuštěný sokl kontejneru.
 */
const DESK = { hx: 0.7, hz: 0.35, h: 0.74, slots: [0.11, 0.31, 0.51] };
export function deskOffice() {
  const { hx, hz, h, slots } = DESK;
  const parts = [
    ...bevelBox('desk', [-hx, h - 0.03, -hz], [hx, h, hz], 'wood_oak', 0.005),
    cyl('desk', [-0.45, h + 0.001, -hz + 0.08], 0.03, 0.004, 'y', 'plastic_dark'), // průchodka na kabely
    box('desk', [-hx + 0.02, 0, -hz + 0.03], [-hx + 0.045, h - 0.03, hz - 0.03], 'wood_oak'), // bočnice
    box('desk', [-hx + 0.015, 0, -hz + 0.025], [-hx + 0.05, 0.012, hz - 0.025], 'rubber_black'), // patka
    box('desk', [-hx + 0.045, 0.3, -hz + 0.03], [0.3, h - 0.03, -hz + 0.05], 'wood_oak'), // krycí panel
    box('desk', [0.3, 0.08, -hz + 0.03], [0.32, h - 0.03, hz - 0.03], 'wood_oak'),
    box('desk', [0.66, 0.08, -hz + 0.03], [0.68, h - 0.03, hz - 0.03], 'wood_oak'),
    box('desk', [0.32, 0.08, -hz + 0.03], [0.66, 0.1, hz - 0.03], 'wood_oak'),
    box('desk', [0.31, 0, -hz + 0.05], [0.67, 0.08, hz - 0.07], 'wood_old'), // sokl zapuštěný o 4 cm
    box('desk', [0.32, 0.1, -hz + 0.03], [0.66, h - 0.03, -hz + 0.045], 'wood_old'),
  ];
  for (const y of slots) {
    if (y > 0.12) parts.push(box('desk', [0.32, y - 0.008, hz - 0.06], [0.66, y - 0.002, hz - 0.035], 'wood_old')); // příčka
    for (const x of [0.32, 0.648]) parts.push(box('desk', [x, y + 0.07, -hz + 0.06], [x + 0.012, y + 0.085, hz - 0.04], 'steel_brushed')); // výsuv
  }
  return definePrefab({
    id: 'desk_office_01',
    title: 'Stůl kancelářský s kontejnerem 1,4 × 0,7 m',
    category: 'prop.furniture',
    nodes: [node('desk')],
    parts,
    colliders: [cbox('desk', [-hx, h - 0.03, -hz], [hx, h, hz]), cbox('desk', [0.3, 0.08, -hz + 0.03], [0.68, h - 0.03, hz - 0.045]), cbox('desk', [-hx + 0.02, 0, -hz + 0.03], [-hx + 0.045, h - 0.03, hz - 0.03])],
    components: fixed,
    gen: 'furniture.mjs#deskOffice',
    params: { top: h, attach: slots.map((y) => ({ prefab: 'drawer_desk_01', pos: [0.49, y, hz - 0.03] })) },
  });
}

/**
 * Zásuvka stolu: dubové čelo, madlo, dutá vana s přihrádkami (podélná a příčná přepážka: tužky vpředu,
 * papíry vzadu), výsuvy. Počátek = spodní hrana čela na líci (z = 0).
 */
export function drawerDesk() {
  const [w, hgt, d] = [0.164, 0.186, 0.53];
  const parts = [
    ...bevelBox('drawer', [-w, 0.002, -0.015], [w, hgt + 0.002, 0], 'wood_oak', 0.004),
    ...handle('drawer', 0, 0.1, 0, 0.11, 'steel_brushed', 0.022),
    ...tray('drawer', [-0.15, 0.015, -d], [0.15, 0.15, -0.015], 0.01, 'wood_pine', { bottomMat: 'wood_old', divX: [0.04], divZ: [-0.17], hDiv: 0.03 }),
    box('drawer', [-0.135, 0.025, -0.5], [0.03, 0.04, -0.19], 'plastic_ivory'), // papíry v zadní přihrádce
    cyl('drawer', [0.09, 0.03, -0.1], 0.006, 0.12, 'x', 'paint_yellow'), // tužka
    cyl('drawer', [0.095, 0.03, -0.07], 0.006, 0.1, 'x', 'paint_red'),
  ];
  for (const sx of [-1, 1]) parts.push(box('drawer', [sx > 0 ? 0.15 : -0.16, 0.07, -d + 0.02], [sx > 0 ? 0.16 : -0.15, 0.085, -0.03], 'steel_brushed'));
  return definePrefab(
    {
      id: 'drawer_desk_01',
      title: 'Zásuvka stolu s přihrádkami',
      category: 'prop.furniture',
      nodes: [node('base'), node('drawer', 'base')],
      joints: [slider('pull', 'drawer', [0, 0, 1], 0, 0.33, { damping: 8, drive: 'manual' })],
      parts,
      colliders: [cbox('drawer', [-w, 0.002, -d], [w, hgt + 0.002, 0.022])],
      components: { ...kin, interact: { kind: 'drawer', joint: 'pull', prompt: 'Vysunout zásuvku', range: 1.6, manipulate: true } },
      ...IO.drawer,
      gen: 'furniture.mjs#drawerDesk',
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

export const FURNITURE = [cabinetFile, drawerFile, cabinetDoor, () => table('work'), () => table('lab'), deskOffice, drawerDesk, chairOffice, chairPlain, () => shelfRack(1), () => shelfRack(2), () => bench('metal'), () => bench('stone')];
