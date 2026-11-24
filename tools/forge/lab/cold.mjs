// Sada kit_lab: chlazení a mrazení. Mrazák −80 °C podle katalogu (šířky 86,4, 100,6 a 114,8 cm, hloubka 95,5 cm,
// výška 198,1 cm; tools/forge/lab/ROZMERY.md), ostatní úvaha z praxe. Ondřej: „Komorový mrazák s pentlicí“ = chladicí
// komora s pásovou clonou za dveřmi. Dvířka mají kloub se zdůvodněním.

import { box, boxc, cyl, collide } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, panel, vessel, staticFloor } from './common.mjs';

const CAT = 'lab.cold';
const gen = (f) => `lab/cold.mjs#${f}`;
const FLOOR = { mount: 'floor' };

/** Skříň s dvířky na levém pantu: plášť, sokl, panel nahoře, dvířka s madlem; o.glass = prosklená dvířka. */
function upright(id, title, w, d, h, o) {
  const body = [...bevelBox('body', [-w / 2, 0.06, -d / 2], [w / 2, h, d / 2 - 0.07], o.mat || 'plastic_white', 0.012), box('body', [-w / 2 + 0.02, 0, -d / 2 + 0.05], [w / 2 - 0.02, 0.06, d / 2 - 0.12], 'plastic_anthracite')];
  if (o.panel) body.push(...panel('body', d / 2 - 0.07, -w / 2 + 0.06, w / 2 - 0.06, h - 0.16, h - 0.04, 3));
  if (o.inner) for (let i = 1; i < 5; i++) body.push(box('body', [-w / 2 + 0.05, 0.06 + (i * (h - 0.3)) / 5, -d / 2 + 0.06], [w / 2 - 0.05, 0.08 + (i * (h - 0.3)) / 5, d / 2 - 0.1], 'steel_brushed'));
  const dh = h - (o.panel ? 0.2 : 0.1);
  const door = [box('door', [0, 0, 0], [w - 0.01, dh, 0.07], o.mat || 'plastic_white'), box('door', [w - 0.08, dh * 0.45, 0.07], [w - 0.05, dh * 0.7, 0.1], 'steel_brushed')];
  if (o.glass) door.push(box('door', [0.06, dh * 0.08, 0.07], [w - 0.12, dh * 0.92, 0.072], 'glass_tinted'));
  return moving(id, title, CAT, body, {
    node: 'door', at: [-w / 2 + 0.005, 0.07, d / 2 - 0.07], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: o.max || 110, kind: 'door', prompt: o.prompt,
    parts: door,
    note: o.note,
  }, { gen: gen(o.fn), place: FLOOR, group: 'world' });
}

/** Mrazáky −80 °C ve třech šířkách (500, 600 a 700 krabic), laboratorní lednice (plná a prosklená), mrazák −20 °C, podstolová lednice. */
export function uprights() {
  const ult = [[0.864, '500'], [1.006, '600'], [1.148, '700']].map(([w, n], v) =>
    upright(`freezer_ult_${String(v + 1).padStart(2, '0')}`, `Mrazák −80 °C na ${n} krabic`, w, 0.955, 1.981, { panel: true, inner: true, fn: 'uprights', prompt: 'Otevřít mrazák', max: 120, note: 'Vnější dveře mrazáku −80 °C se otvírají o 90 až 180°, uvnitř jsou ještě vnitřní dvířka; 120°. Úvaha podle katalogu výrobce, neměřeno.' }),
  );
  const note = 'Dveře laboratorní lednice nebo mrazáku na pantu se otvírají asi o 110 až 130°; 115°. Úvaha, neměřeno.';
  return [
    ...ult,
    upright('fridge_lab_tall_01', 'Laboratorní lednice', 0.6, 0.65, 1.85, { inner: true, fn: 'uprights', prompt: 'Otevřít lednici', max: 115, note }),
    upright('fridge_lab_glass_01', 'Laboratorní lednice s prosklenými dveřmi', 0.6, 0.65, 1.85, { inner: true, glass: true, fn: 'uprights', prompt: 'Otevřít lednici', max: 115, note }),
    upright('freezer_lab_20_01', 'Laboratorní mrazák −20 °C', 0.6, 0.65, 1.85, { inner: true, panel: true, mat: 'plastic_light', fn: 'uprights', prompt: 'Otevřít mrazák', max: 115, note }),
    upright('fridge_undercounter_01', 'Podstolová lednice', 0.6, 0.6, 0.82, { inner: true, fn: 'uprights', prompt: 'Otevřít lednici', max: 115, note }),
  ];
}

/** Truhlicový mrazák −80 °C s víkem a zásobník kapalného dusíku na pojízdném podstavci. */
export function chestAndLn2() {
  const [w, d, h] = [1.6, 0.8, 0.95];
  const chest = moving('freezer_chest_ult_01', 'Truhlicový mrazák −80 °C', CAT, [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], 'plastic_white', 0.015), ...panel('body', d / 2, w / 2 - 0.4, w / 2 - 0.05, h - 0.2, h - 0.08, 3)], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 80, kind: 'door', prompt: 'Otevřít víko mrazáku',
    parts: [...bevelBox('lid', [-w / 2, 0, 0], [w / 2, 0.1, d], 'plastic_white', 0.01), box('lid', [-0.3, 0.04, d], [0.3, 0.07, d + 0.04], 'steel_brushed')],
    note: 'Víko truhlicového mrazáku na zadních pantech s vyvážením zůstane stát v otevřené poloze asi 80°; 80°. Úvaha, neměřeno.',
  }, { gen: gen('chestAndLn2'), place: FLOOR, group: 'world' });
  const tank = simple('tank_ln2_storage_01', 'Zásobník kapalného dusíku na pojízdném podstavci', CAT, [cyl('body', [0, 0.09, 0], 0.4, 0.06, 'y', 'steel_dark'), ...[0, 1, 2, 3].map((i) => cyl('body', [Math.cos(i * 1.571) * 0.33, 0.03, Math.sin(i * 1.571) * 0.33], 0.03, 0.04, 'x', 'rubber_black')), ...vessel('body', [[0.12, 0.34], [0.85, 0.34], [1.0, 0.2], [1.05, 0.15]], 'steel_brushed', 0, null), cyl('body', [0, 1.09, 0], 0.16, 0.08, 'y', 'plastic_anthracite'), box('body', [-0.08, 0.55, 0.335], [0.08, 0.7, 0.345], 'plastic_anthracite'), box('body', [-0.06, 0.6, 0.345], [0.06, 0.66, 0.347], 'emit_display')], { gen: gen('chestAndLn2'), components: staticFloor(), group: 'world' });
  return [chest, tank];
}

/**
 * Chladicí a mrazicí komora (prefabrikovaná, 2,0 × 2,0 × 2,3 m) s dveřmi a pásovou clonou za nimi, uvnitř regály.
 * Varianty: chladicí +4 °C (bílá) a mrazicí −20 °C (šedá). Clona je z průhledných pásů PVC.
 */
export function walkIns() {
  return [['coldroom_walkin_01', 'Chladicí komora +4 °C s pásovou clonou', 'plastic_white'], ['freezer_walkin_01', 'Mrazicí komora −20 °C s pásovou clonou', 'plastic_light']].map(([id, title, mat]) => {
    const [w, d, h, t] = [2.0, 2.0, 2.3, 0.1];
    const body = [box('body', [-w / 2, 0, -d / 2], [-w / 2 + t, h, d / 2], mat), box('body', [w / 2 - t, 0, -d / 2], [w / 2, h, d / 2], mat), box('body', [-w / 2, 0, -d / 2], [w / 2, h, -d / 2 + t], mat), box('body', [-w / 2, h - t, -d / 2], [w / 2, h, d / 2], mat), box('body', [-w / 2 + t, 0, d / 2 - t], [-0.45, h - t, d / 2], mat), box('body', [0.45, 0, d / 2 - t], [w / 2 - t, h - t, d / 2], mat), box('body', [-0.45, 2.0, d / 2 - t], [0.45, h - t, d / 2], mat), box('body', [-w / 2 + t, 0, -d / 2 + t], [w / 2 - t, 0.02, d / 2 - t], 'metal_floor'), ...panel('body', d / 2, 0.55, 0.85, 1.4, 1.6, 2), box('body', [-0.5, 2.05, d / 2], [-0.3, 2.12, d / 2 + 0.01], 'emit_green')];
    for (let i = 0; i < 6; i++) body.push(box('body', [-0.42 + i * 0.14, 0.04, d / 2 - t - 0.03], [-0.3 + i * 0.14, 1.98, d / 2 - t - 0.028], 'plastic_ps'));
    for (const z of [-0.55, 0.15]) for (let k = 0; k < 4; k++) body.push(box('body', [-w / 2 + t + 0.02, 0.3 + k * 0.45, z - 0.25], [-w / 2 + t + 0.5, 0.33 + k * 0.45, z + 0.25], 'steel_brushed'));
    for (let k = 0; k < 4; k++) body.push(box('body', [w / 2 - t - 0.5, 0.3 + k * 0.45, -0.8], [w / 2 - t - 0.02, 0.33 + k * 0.45, 0.4], 'steel_brushed'), boxc('body', [w / 2 - t - 0.25, 0.42 + k * 0.45, -0.4], [0.3, 0.18, 0.4], k % 2 ? 'plastic_white' : 'paper_kraft'));
    return moving(id, title, CAT, body, {
      node: 'door', at: [-0.45, 0.0, d / 2], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 100, kind: 'door', prompt: 'Otevřít komoru',
      parts: [box('door', [0, 0.01, 0], [0.9, 1.99, 0.09], mat), box('door', [0.75, 0.9, 0.09], [0.85, 1.1, 0.14], 'steel_brushed')],
      note: 'Izolované dveře chladicí komory se otvírají ven o 90 až 110°, za nimi visí pásová clona z PVC; 100°. Úvaha, neměřeno.',
    }, { gen: gen('walkIns'), place: FLOOR, group: 'world', colliders: body.slice(0, 7).map((p) => collide(p)) }); // stěny a strop; dovnitř se dá vejít, clona nekoliduje
  });
}

export const COLD = [uprights, chestAndLn2, walkIns];
