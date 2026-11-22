// xForge, sada kit_base: bedny, sudy, potrubí, zábradlí a vybavení katakomb.
// Bedny a sudy jsou dynamická tělesa (hmotnost v kg), potrubí a zábradlí pevná.

import { box, boxc, cyl, cbox, ccyl, collide, node, hinge, slider, definePrefab, IO } from '../lib.mjs';

const fixed = { physics: { body: 'static' } };
const kin = { physics: { body: 'kinematic' } };
const dyn = (mass, hp, surface) => ({ physics: { body: 'dynamic', mass, friction: 0.7, restitution: 0.1 }, health: { hp, surface } });

/** Dřevěná bedna s lištami. size = [šířka, výška, hloubka]. */
export function crate(id, title, size, mass) {
  const [hx, h, hz] = [size[0] / 2, size[1], size[2] / 2];
  const t = 0.03;
  const parts = [box('body', [-hx + t / 2, t / 2, -hz + t / 2], [hx - t / 2, h - t / 2, hz - t / 2], 'wood_pine')];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(boxc('body', [sx * (hx - t / 2), h / 2, sz * (hz - t / 2)], [t, h, t], 'wood_old'));
  for (const y of [t / 2, h - t / 2]) for (const sz of [-1, 1]) parts.push(boxc('body', [0, y, sz * (hz - t / 2)], [2 * hx - 2 * t, t, t], 'wood_old'));
  for (const y of [t / 2, h - t / 2]) for (const sx of [-1, 1]) parts.push(boxc('body', [sx * (hx - t / 2), y, 0], [t, t, 2 * hz - 2 * t], 'wood_old'));
  return definePrefab({
    id,
    title,
    category: 'prop.container',
    nodes: [node('body')],
    parts,
    colliders: [cbox('body', [-hx, 0, -hz], [hx, h, hz], 'prop')],
    components: dyn(mass, Math.round(mass * 2 + 40), 'wood'),
    ...IO.crate,
    gen: 'props.mjs#crate',
    params: { size, mass },
  });
}

/** Kovová přepravka s víkem a madly. */
export function crateSteel() {
  const [hx, h, hz] = [0.4, 0.45, 0.25];
  return definePrefab({
    id: 'crate_steel_01',
    title: 'Přepravka kovová 0,8 × 0,45 × 0,5 m',
    category: 'prop.container',
    nodes: [node('body')],
    parts: [
      box('body', [-hx, 0, -hz], [hx, h - 0.08, hz], 'paint_green'),
      box('body', [-hx - 0.006, h - 0.08, -hz - 0.006], [hx + 0.006, h, hz + 0.006], 'steel_dark'),
      boxc('body', [-hx - 0.012, 0.22, 0], [0.024, 0.03, 0.16], 'steel_brushed'),
      boxc('body', [hx + 0.012, 0.22, 0], [0.024, 0.03, 0.16], 'steel_brushed'),
      boxc('body', [-0.2, h - 0.1, hz + 0.008], [0.05, 0.07, 0.016], 'steel_brushed'),
      boxc('body', [0.2, h - 0.1, hz + 0.008], [0.05, 0.07, 0.016], 'steel_brushed'),
    ],
    colliders: [cbox('body', [-hx, 0, -hz], [hx, h, hz], 'prop')],
    components: dyn(30, 400, 'metal'),
    ...IO.crate,
    gen: 'props.mjs#crateSteel',
  });
}

/** Sud. kind: 'steel' (ocelový 200 l: průměr 0,585 m, výška 0,88 m), 'wood' (dřevěný s obručemi). */
export function barrel(kind = 'steel') {
  const wood = kind === 'wood';
  const [r, h] = wood ? [0.31, 0.9] : [0.2925, 0.88];
  const parts = wood
    ? [cyl('body', [0, h / 2, 0], r, h, 'y', 'wood_oak'), cyl('body', [0, h / 2, 0], r + 0.035, h * 0.5, 'y', 'wood_oak'), ...[0.12, h * 0.25, h * 0.75, h - 0.12].map((y, i) => cyl('body', [0, y, 0], r + (i === 1 || i === 2 ? 0.04 : 0.008), 0.04, 'y', 'iron_black'))]
    : [cyl('body', [0, h / 2, 0], r, h, 'y', 'paint_blue'), ...[0.015, h / 3, (2 * h) / 3, h - 0.015].map((y) => cyl('body', [0, y, 0], r + 0.012, 0.03, 'y', 'paint_blue')), cyl('body', [0.17, h + 0.008, 0], 0.035, 0.016, 'y', 'steel_dark')];
  return definePrefab({
    id: wood ? 'barrel_wood_01' : 'barrel_steel_01',
    title: wood ? 'Sud dřevěný' : 'Sud ocelový 200 l',
    category: 'prop.container',
    nodes: [node('body')],
    parts,
    colliders: [ccyl('body', [0, h / 2, 0], r + (wood ? 0.035 : 0.012), h, 'y', 'prop')],
    components: dyn(wood ? 45 : 20, wood ? 120 : 300, wood ? 'wood' : 'metal'),
    ...IO.crate,
    gen: 'props.mjs#barrel',
    params: { kind },
  });
}

/** Potrubí na konzolách, délka 2 m podél X. kind: 'single' (jedna trubka), 'double' (dvě s barevným značením). */
export function pipe(kind = 'single') {
  const dbl = kind === 'double';
  const parts = [];
  for (const x of [-0.7, 0.7]) parts.push(box('pipe', [x - 0.02, -0.03, 0], [x + 0.02, 0.03, dbl ? 0.2 : 0.18], 'steel_dark'));
  if (dbl) {
    parts.push(cyl('pipe', [0, 0.09, 0.13], 0.045, 2, 'x', 'steel_painted'), cyl('pipe', [0, -0.07, 0.13], 0.03, 2, 'x', 'copper'));
    parts.push(cyl('pipe', [-0.3, 0.09, 0.13], 0.047, 0.12, 'x', 'paint_yellow'), cyl('pipe', [0.4, -0.07, 0.13], 0.032, 0.12, 'x', 'paint_green'));
    for (const x of [-0.7, 0.7]) parts.push(box('pipe', [x - 0.02, -0.11, 0.07], [x + 0.02, 0.15, 0.2], 'steel_dark'));
  } else {
    parts.push(cyl('pipe', [0, 0, 0.12], 0.05, 2, 'x', 'steel_painted'));
    for (const x of [-0.985, 0.985]) parts.push(cyl('pipe', [x, 0, 0.12], 0.068, 0.03, 'x', 'steel_dark'));
  }
  return definePrefab({
    id: dbl ? 'pipe_double_01' : 'pipe_straight_01',
    title: dbl ? 'Potrubí dvojité 2 m' : 'Potrubí rovné 2 m',
    category: 'arch.pipe',
    nodes: [node('pipe')],
    parts,
    colliders: [dbl ? cbox('pipe', [-1, -0.11, 0], [1, 0.15, 0.2]) : cbox('pipe', [-1, -0.07, 0], [1, 0.07, 0.19])],
    components: fixed,
    gen: 'props.mjs#pipe',
    params: { kind, length: 2 },
  });
}

/** Zábradlí výšky 1,0 m podél X se sloupky, madlem, mezitrubkou a okopovou lištou. */
export function railing(length = 2) {
  const hx = length / 2;
  const posts = length > 1.2 ? [-hx + 0.03, 0, hx - 0.03] : [-hx + 0.03, hx - 0.03];
  const parts = posts.map((x) => boxc('rail', [x, 0.5, 0], [0.04, 1, 0.04], 'steel_painted'));
  parts.push(boxc('rail', [0, 1.0, 0], [length, 0.05, 0.05], 'paint_yellow'), boxc('rail', [0, 0.55, 0], [length - 0.06, 0.03, 0.03], 'steel_painted'), boxc('rail', [0, 0.06, 0], [length - 0.06, 0.1, 0.012], 'steel_painted'));
  return definePrefab({
    id: length > 1.2 ? 'railing_steel_01' : 'railing_steel_02',
    title: `Zábradlí ocelové ${String(length).replace('.', ',')} m`,
    category: 'arch.railing',
    nodes: [node('rail')],
    parts,
    colliders: [cbox('rail', [-hx, 0, -0.025], [hx, 1.025, 0.025])],
    components: fixed,
    gen: 'props.mjs#railing',
    params: { length, height: 1 },
  });
}

/** Kamenný sarkofág s odsuvným víkem. Delší strana podél X, víko se sune dopředu (+Z). */
export function sarcophagus() {
  const lid = box('lid', [-1.08, 0, -0.48], [1.08, 0.1, 0.48], 'stone_pale');
  return definePrefab(
    {
      id: 'sarcophagus_01',
      title: 'Sarkofág kamenný s víkem',
      category: 'prop.crypt',
      nodes: [node('body'), node('lid', 'body', [0, 0.62, 0])],
      joints: [slider('slide', 'lid', [0, 0, 1], 0, 0.45, { damping: 40, speed: 0.2, drive: 'manual' })],
      parts: [
        box('body', [-1.1, 0, -0.5], [1.1, 0.12, 0.5], 'stone_rough'),
        box('body', [-1.05, 0.12, 0.37], [1.05, 0.62, 0.45], 'stone_pale'),
        box('body', [-1.05, 0.12, -0.45], [1.05, 0.62, -0.37], 'stone_pale'),
        box('body', [-1.05, 0.12, -0.37], [-0.97, 0.62, 0.37], 'stone_pale'),
        box('body', [0.97, 0.12, -0.37], [1.05, 0.62, 0.37], 'stone_pale'),
        box('body', [-0.97, 0.12, -0.37], [0.97, 0.16, 0.37], 'stone_rough'),
        lid,
        box('lid', [-0.9, 0.1, -0.25], [0.9, 0.15, 0.25], 'stone_pale'),
      ],
      colliders: [cbox('body', [-1.1, 0, -0.5], [1.1, 0.62, 0.5]), collide(lid)],
      components: { ...kin, interact: { kind: 'drawer', joint: 'slide', prompt: 'Odsunout víko', range: 1.8, manipulate: true } },
      ...IO.drawer,
      gen: 'props.mjs#sarcophagus',
    },
    { slide: 'Kamenné víko (řádově 250 kg) jde odsunout nejvýš o polovinu své šířky, dál by přepadlo: 0,45 m z 0,96 m. Pohyb je pomalý (velké tlumení). Úvaha, neměřeno.' },
  );
}

/** Dřevěná truhla s víkem na zadních pantech. */
export function chest() {
  const lid = box('lid', [-0.45, 0, 0], [0.45, 0.14, 0.5], 'wood_oak');
  const parts = [
    box('body', [-0.45, 0, -0.25], [0.45, 0.04, 0.25], 'wood_old'),
    box('body', [-0.45, 0.04, -0.25], [-0.42, 0.34, 0.25], 'wood_oak'),
    box('body', [0.42, 0.04, -0.25], [0.45, 0.34, 0.25], 'wood_oak'),
    box('body', [-0.42, 0.04, -0.25], [0.42, 0.34, -0.22], 'wood_oak'),
    box('body', [-0.42, 0.04, 0.22], [0.42, 0.34, 0.25], 'wood_oak'),
    boxc('body', [0, 0.27, 0.256], [0.08, 0.1, 0.012], 'iron_black'),
    lid,
  ];
  for (const x of [-0.3, 0.3]) parts.push(box('lid', [x - 0.03, -0.001, -0.004], [x + 0.03, 0.146, 0.504], 'iron_black'), box('body', [x - 0.03, 0, 0.25], [x + 0.03, 0.34, 0.256], 'iron_black'));
  return definePrefab(
    {
      id: 'chest_wood_01',
      title: 'Truhla dřevěná s kováním',
      category: 'prop.container',
      nodes: [node('body'), node('lid', 'body', [0, 0.34, -0.25])],
      joints: [hinge('lid', 'lid', [-1, 0, 0], 0, 100, { damping: 5, drive: 'manual' })],
      parts,
      colliders: [cbox('body', [-0.45, 0, -0.25], [0.45, 0.34, 0.25]), collide(lid)],
      components: { ...kin, interact: { kind: 'door', joint: 'lid', prompt: 'Otevřít truhlu', range: 1.6, manipulate: true } },
      inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
      outputs: ['opened', 'closed'],
      gen: 'props.mjs#chest',
    },
    { lid: 'Víko truhly na zadních pantech: řetízek ho zastaví těsně za svislicí (95–105°), aby samo nespadlo; 100°. Úvaha, neměřeno.' },
  );
}

export const PROPS = [
  () => crate('crate_plank_01', 'Bedna dřevěná 0,6 m', [0.6, 0.6, 0.6], 25),
  () => crate('crate_large_01', 'Bedna dřevěná 1,0 × 0,8 × 0,8 m', [1, 0.8, 0.8], 80),
  crateSteel,
  () => barrel('steel'),
  () => barrel('wood'),
  () => pipe('single'),
  () => pipe('double'),
  () => railing(2),
  () => railing(1),
  sarcophagus,
  chest,
];
