// Sada kit_lab: chlazení a mrazení. Mrazák −80 °C podle katalogu (šířky 86,4, 100,6 a 114,8 cm, hloubka 95,5 cm,
// výška 198,1 cm; tools/forge/lab/ROZMERY.md), ostatní úvaha z praxe. Ondřej: „Komorový mrazák s pentlicí“ = chladicí
// komora s pásovou clonou za dveřmi. Dvířka mají kloub se zdůvodněním.

import { box, boxc, cyl, collide, cbox } from '../lib.mjs';
import { A, shell, door, barHandle, lock, grille, screen, feet, plinth, wireShelf, hinges, merge, T, roundedBox, flatBox, cylinder, moved, mTranslate, mRotate, at } from './appliance.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, panel, vessel, staticFloor } from './common.mjs';

const CAT = 'lab.cold';
const gen = (f) => `lab/cold.mjs#${f}`;
const FLOOR = { mount: 'floor' };

/**
 * Skříň s dvířky na levém pantu (lednice, mrazák): dutý plášť se zaoblenými hranami (dvířka odhalí vnitřek),
 * sokl s mřížkou kompresoru, stavitelné nožky, dvířka s těsněním, dlouhé madlo, zámek a panty; uvnitř drátěné
 * rošty, u mrazáku −80 °C vnitřní izolovaná dvířka. o.glass = prosklená dvířka, o.panel = ovládací panel nad dvířky.
 */
function upright(id, title, w, d, h, o) {
  const k = id;
  const mat = o.mat || 'plastic_white';
  const pl = 0.09; // sokl
  const t = 0.06; // dvířka
  const zf = d / 2 - t - 0.004; // čelo pláště
  const wall = 0.05;
  const top = o.panel ? h - 0.14 : h;
  const body = [
    shell('body', `${k}_l`, [-w / 2, pl, -d / 2], [-w / 2 + wall, h, zf], mat, 0.01),
    shell('body', `${k}_r`, [w / 2 - wall, pl, -d / 2], [w / 2, h, zf], mat, 0.01),
    shell('body', `${k}_t`, [-w / 2 + wall - 0.002, top - wall, -d / 2], [w / 2 - wall + 0.002, h, zf], mat, 0.01),
    A('body', `${k}_bb`, merge([flatBox([-w / 2 + wall, pl, -d / 2], [w / 2 - wall, pl + wall, zf]), flatBox([-w / 2 + wall, pl, -d / 2], [w / 2 - wall, h, -d / 2 + wall])]), mat),
    // vnitřek (bílá vana) a rošty
    A('body', `${k}_liner`, merge([flatBox([-w / 2 + wall, pl + wall, -d / 2 + wall], [w / 2 - wall, pl + wall + 0.002, zf - 0.01]), flatBox([-w / 2 + wall, pl + wall, -d / 2 + wall], [w / 2 - wall, top - wall, -d / 2 + wall + 0.002])]), 'liner_white'),
    plinth('body', k, w, d, pl, 0.07),
    ...grille('body', `${k}_kick`, -w / 2 + 0.06, w / 2 - 0.06, 0.02, pl - 0.015, d / 2 - 0.069, 5),
  ]; // nožky schová sokl
  const inner = (top - wall) - (pl + wall);
  const shelves = 3;
  for (let i = 1; i <= shelves; i++) {
    const y = pl + wall + (i * inner) / (shelves + 1);
    if (o.ult) continue; // mrazák −80 °C má místo roštů vnitřní dvířka
    else body.push(wireShelf('body', k, -w / 2 + wall + 0.01, w / 2 - wall - 0.01, -d / 2 + wall + 0.02, zf - 0.03, y));
  }
  if (o.ult) {
    // vnitřní izolovaná dvířka (pět oddílů) s malými knoflíky
    const doors = [];
    const knobs = [];
    for (let i = 0; i < 5; i++) {
      const y0 = pl + wall + 0.01 + (i * (inner - 0.02)) / 5;
      const y1 = y0 + (inner - 0.02) / 5 - 0.008;
      doors.push(flatBox([-w / 2 + wall + 0.012, y0, zf - 0.03], [w / 2 - wall - 0.012, y1, zf - 0.008]));
      knobs.push(moved(cylinder(0.012, 0, 0.02, { seg: 6 }), at(mTranslate(w / 2 - wall - 0.06, (y0 + y1) / 2, zf - 0.008), mRotate('x', 90))));
    }
    body.push(A('body', `${k}_innerdoors`, merge(doors), 'liner_white'), A('body', `${k}_innerknobs`, merge(knobs), 'plastic_light'));
  }
  if (o.panel) {
    body.push(shell('body', `${k}_head`, [-w / 2, h - 0.14, zf - 0.02], [w / 2, h, d / 2], mat, 0.012));
    body.push(...screen('body', `${k}_scr`, -w / 2 + 0.06, -w / 2 + 0.26, h - 0.115, h - 0.03, d / 2, { buttons: o.ult ? 4 : 0, led: 'emit_green' }));
    if (o.ult) body.push(...grille('body', `${k}_hv`, w / 2 - 0.3, w / 2 - 0.06, h - 0.11, h - 0.035, d / 2, 4));
  }
  const dh = top - pl - 0.006; // výška dvířek
  const dw = w - 0.008;
  const leaf = door('door', `${k}_door`, 0, dw, 0, dh, 0, t, { mat, gasket: true, window: o.glass ? [0.07, 0.08] : null, glass: 'glass_tinted' });
  const parts = [
    ...leaf,
    barHandle('door', `${k}_door`, dw - 0.06, dh * 0.35, dh * 0.75, t, { rad: 0.011, off: 0.045 }),
    ...lock('door', `${k}_door`, dw - 0.06, dh * 0.3, t),
  ];
  if (o.ult) parts.push(A('door', `${k}_latch`, flatBox([dw - 0.1, dh * 0.45, t], [dw - 0.02, dh * 0.62, t + 0.03]), 'plastic_light'));
  // za sklem je vidět obsah: lahve a krabice na roštech
  if (o.glass) for (let i = 1; i <= 2; i++) body.push(A('body', `${k}_stock_${i}`, merge([0, 1, 2, 3].map((j) => (j % 2 ? T(cylinder(0.035, 0, 0.17 - (i % 2) * 0.04, { seg: 7 }), -w / 2 + 0.13 + j * ((w - 0.26) / 3), pl + wall + (i * inner) / (shelves + 1) + 0.004, -0.04) : flatBox([-w / 2 + 0.09 + j * ((w - 0.26) / 3), pl + wall + (i * inner) / (shelves + 1) + 0.004, -0.12], [-w / 2 + 0.17 + j * ((w - 0.26) / 3), pl + wall + (i * inner) / 5 + 0.1, 0.0])))), i % 2 ? 'plastic_hdpe' : 'paper_kraft'));
  body.push(hinges('body', `${k}_hng`, -w / 2 + 0.004, [pl + 0.12, top - 0.12], d / 2 - t / 2));
  return moving(id, title, CAT, body, {
    node: 'door', at: [-w / 2 + 0.004, pl + 0.003, zf + 0.004], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: o.max || 110, kind: 'door', prompt: o.prompt,
    parts,
    note: o.note,
  }, { gen: gen(o.fn), place: FLOOR, group: 'world', colliders: [cbox('body', [-w / 2, 0, -d / 2], [w / 2, h, zf])] });
}

/** Mrazáky −80 °C ve třech šířkách (500, 600 a 700 krabic), laboratorní lednice (plná a prosklená), mrazák −20 °C, podstolová lednice. */
export function uprights() {
  const ult = [[0.864, '500'], [1.006, '600'], [1.148, '700']].map(([w, n], v) =>
    upright(`freezer_ult_${String(v + 1).padStart(2, '0')}`, `Mrazák −80 °C na ${n} krabic`, w, 0.955, 1.981, { panel: true, ult: true, fn: 'uprights', prompt: 'Otevřít mrazák', max: 120, note: 'Vnější dveře mrazáku −80 °C se otvírají o 90 až 180°, uvnitř jsou ještě vnitřní dvířka; 120°. Úvaha podle katalogu výrobce, neměřeno.' }),
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
