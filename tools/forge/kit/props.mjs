// xForge, sada kit_base: bedny, sudy, potrubí, zábradlí a vybavení katakomb.
// Bedny a sudy jsou dynamická tělesa (hmotnost v kg), potrubí a zábradlí pevná.

import { box, boxc, cyl, cbox, ccyl, collide, node, hinge, slider, definePrefab, IO } from '../lib.mjs';
import { noise, planks, lathe, tray } from '../shapes.mjs';

const fixed = { physics: { body: 'static' } };
const kin = { physics: { body: 'kinematic' } };
const dyn = (mass, hp, surface) => ({ physics: { body: 'dynamic', mass, friction: 0.7, restitution: 0.1 }, health: { hp, surface } });

/**
 * Dřevěná bedna z prken. size = [šířka, výška, hloubka]. Prkna mají škvíry 6 mm a drobně jinou tloušťku a délku
 * (opakovatelná náhoda podle id); jedno prkno ze čtyř je tmavší (vyměněné). Skrz škvíry je vidět tmavý vnitřek.
 */
export function crate(id, title, size, mass) {
  const [hx, h, hz] = [size[0] / 2, size[1], size[2] / 2];
  const rnd = noise(id);
  const [t, p, g] = [0.018, 0.04, 0.006]; // tloušťka prkna, průřez rohové lišty, škvíra
  const ht = h - t; // stěny končí pod víkem
  const rows = Math.max(3, Math.round(ht / 0.13));
  const wood = ['wood_pine', 'wood_pine', 'wood_pine', 'wood_old'];
  const parts = [box('body', [-hx + t, 0.004, -hz + t], [hx - t, ht - 0.002, hz - t], 'wood_old')];
  for (const s of [-1, 1]) {
    parts.push(...planks('body', [-hx + p, 0, s > 0 ? hz - t : -hz], [hx - p, ht, s > 0 ? hz : -hz + t], 1, rows, g, wood, rnd, { out: s }));
    parts.push(...planks('body', [s > 0 ? hx - t : -hx, 0, -hz + p], [s > 0 ? hx : -hx + t, ht, hz - p], 1, rows, g, wood.slice(1).concat(wood[0]), rnd, { out: s }));
  }
  parts.push(...planks('body', [-hx, ht, -hz], [hx, h, hz], 0, Math.max(3, Math.round((2 * hx) / 0.13)), g, wood.slice(2).concat(wood.slice(0, 2)), rnd, { out: 1 }));
  // rohové lišty a obvodové lišty nahoře a dole, přes prkna
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(boxc('body', [sx * (hx - p / 2), ht / 2, sz * (hz - p / 2)], [p, ht, p], 'wood_old'));
  for (const [y0, y1] of [[0, 0.06], [ht - 0.06, ht]]) {
    for (const sz of [-1, 1]) parts.push(box('body', [-hx + p, y0, sz > 0 ? hz : -hz - 0.012], [hx - p, y1, sz > 0 ? hz + 0.012 : -hz], 'wood_old'));
    for (const sx of [-1, 1]) parts.push(box('body', [sx > 0 ? hx : -hx - 0.012, y0, -hz + p], [sx > 0 ? hx + 0.012 : -hx, y1, hz - p], 'wood_old'));
  }
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

/**
 * Sud. kind: 'steel' (ocelový 200 l: průměr 0,585 m, výška 0,88 m, dvě válcovací žebra, okraje a dvě zátky),
 * 'wood' (dřevěný: vyboulený ze šesti válců, čtyři obruče, víko zapuštěné o okraj dužin, čep na boku).
 */
export function barrel(kind = 'steel') {
  const wood = kind === 'wood';
  const [r, h] = wood ? [0.27, 0.9] : [0.2925, 0.88];
  const bulge = 0.04;
  const rAt = (y) => r + bulge * Math.sin((Math.PI * y) / h);
  const parts = [];
  if (wood) {
    const prof = [0, 1, 2, 3, 4, 5, 6].map((k) => [(h * k) / 6, rAt((h * k) / 6)]);
    parts.push(...lathe('body', 0, 0, prof, 'wood_oak'));
    parts.push(cyl('body', [0, h + 0.0015, 0], r - 0.02, 0.003, 'y', 'wood_old'));
    for (const y of [0.07, h * 0.28, h * 0.72, h - 0.07]) parts.push(cyl('body', [0, y, 0], rAt(y) + 0.007, 0.035, 'y', 'iron_black'));
    parts.push(cyl('body', [0, h * 0.5, rAt(h * 0.5) + 0.002], 0.022, 0.012, 'z', 'wood_old'));
  } else {
    parts.push(cyl('body', [0, h / 2, 0], r, h, 'y', 'paint_blue'));
    for (const y of [0.012, h - 0.012]) parts.push(cyl('body', [0, y, 0], r + 0.008, 0.024, 'y', 'steel_dark'));
    for (const y of [h / 3, (2 * h) / 3]) parts.push(cyl('body', [0, y, 0], r + 0.012, 0.03, 'y', 'paint_blue'));
    parts.push(cyl('body', [0, h + 0.002, 0], r - 0.015, 0.004, 'y', 'steel_painted'));
    parts.push(cyl('body', [0.17, h + 0.01, 0], 0.035, 0.016, 'y', 'steel_dark'), cyl('body', [-0.18, h + 0.008, 0.05], 0.022, 0.012, 'y', 'steel_dark'));
  }
  return definePrefab({
    id: wood ? 'barrel_wood_01' : 'barrel_steel_01',
    title: wood ? 'Sud dřevěný' : 'Sud ocelový 200 l',
    category: 'prop.container',
    nodes: [node('body')],
    parts,
    colliders: [ccyl('body', [0, h / 2, 0], (wood ? r + bulge : r) + (wood ? 0.007 : 0.012), h, 'y', 'prop')],
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

/** Dřevěná truhla z prken s kováním, víko na zadních pantech; uvnitř u zadní stěny vložená přihrádka se dvěma oddíly. */
export function chest() {
  const rnd = noise('chest_wood_01');
  const [hx, hz, hb] = [0.45, 0.25, 0.34];
  const t = 0.022;
  const wood = ['wood_oak', 'wood_oak', 'wood_old'];
  const lidCore = box('lid', [-hx + 0.01, 0, 0.01], [hx - 0.01, 0.12, 2 * hz - 0.01], 'wood_old');
  const parts = [
    box('body', [-hx, 0, -hz], [hx, 0.04, hz], 'wood_old'),
    box('body', [-hx + t, 0.04, -hz + t], [hx - t, 0.06, hz - t], 'wood_old'),
    ...planks('body', [-hx + 0.03, 0.04, hz - t], [hx - 0.03, hb, hz], 1, 3, 0.005, wood, rnd, { out: 1 }),
    ...planks('body', [-hx + 0.03, 0.04, -hz], [hx - 0.03, hb, -hz + t], 1, 3, 0.005, wood, rnd, { out: -1 }),
    ...planks('body', [-hx, 0.04, -hz + 0.03], [-hx + t, hb, hz - 0.03], 1, 3, 0.005, wood, rnd, { out: -1 }),
    ...planks('body', [hx - t, 0.04, -hz + 0.03], [hx, hb, hz - 0.03], 1, 3, 0.005, wood, rnd, { out: 1 }),
    boxc('body', [0, 0.27, hz + 0.006], [0.08, 0.1, 0.012], 'iron_black'),
    ...tray('body', [-hx + t, 0.22, -hz + t], [-0.05, hb - 0.01, -0.02], 0.01, 'wood_old', { divX: [-0.25] }),
    lidCore,
    ...planks('lid', [-hx, 0.12, 0], [hx, 0.145, 2 * hz], 2, 4, 0.005, wood, rnd, { out: 1 }),
  ];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(boxc('body', [sx * (hx - 0.015), hb / 2, sz * (hz - 0.015)], [0.034, hb, 0.034], 'iron_black'));
  for (const x of [-0.3, 0.3]) parts.push(box('lid', [x - 0.03, -0.001, -0.004], [x + 0.03, 0.151, 2 * hz + 0.004], 'iron_black'), box('body', [x - 0.03, 0, hz], [x + 0.03, hb, hz + 0.006], 'iron_black'));
  return definePrefab(
    {
      id: 'chest_wood_01',
      title: 'Truhla dřevěná s kováním',
      category: 'prop.container',
      nodes: [node('body'), node('lid', 'body', [0, hb, -hz])],
      joints: [hinge('lid', 'lid', [-1, 0, 0], 0, 100, { damping: 5, drive: 'manual' })],
      parts,
      colliders: [cbox('body', [-hx, 0, -hz], [hx, hb, hz]), collide(lidCore)],
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
