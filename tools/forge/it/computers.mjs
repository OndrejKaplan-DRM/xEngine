// Sada kit_it: počítače (Ondřej: „10 druhů počítačů (desktopy s více typy monitorů, notebooky, tablety)“). Monitory
// 24", 27", 32", 34" ultraširoký a na výšku, skříně počítačů (malá, pracovní stanice, mini), počítač vše v jednom,
// notebooky, tablety, telefon, klávesnice a myš, tiskárny a sestavy na stůl (jeden až tři monitory, notebook
// s dokovací stanicí). Rozměry z obvyklých úhlopříček 16 : 9 a 21 : 9; obecný tvar bez značek.

import { simple, staticFloor } from '../lab/common.mjs';
import { A, door, merge, roundedBox, flatBox, slab, cylinder, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';

const CAT = 'it.computer';
const gen = (f) => `it/computers.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });

/** Úhlopříčka v palcích → šířka a výška plochy v metrech (poměr stran a : b). */
const panelSize = (inch, a = 16, b = 9) => {
  const diag = inch * 0.0254;
  const k = diag / Math.hypot(a, b);
  return [a * k, b * k];
};

const mm = (v) => Math.round(v * 1000);

/** Monitor na stojanu, střed podstavce v (x, z), líc do +Z; portrait = otočený na výšku. Tenký rámeček se zaoblenými
 * hranami, zadní kryt s vybráním, noha s otvorem na kabel a oválný podstavec; kontrolka vpravo dole. */
export function monitorParts(x, z, inch, screen, o = {}) {
  let [w, h] = panelSize(inch, o.wide ? 21 : 16, 9);
  if (o.portrait) [w, h] = [h, w];
  const y0 = o.portrait ? 0.08 : 0.1;
  const c = o.color || 'bezel_black';
  const k = `mon_${inch}_${o.wide ? 'w' : o.portrait ? 'p' : 'n'}_${mm(x)}_${mm(z)}_${c}`;
  return [
    A('body', `${k}_stand`, merge([roundedBox([x - 0.12, 0, z - 0.1], [x + 0.12, 0.012, z + 0.06], 0.006, 1), flatBox([x - 0.03, 0.006, z - 0.085], [x + 0.03, y0 + h * 0.45, z - 0.065]), flatBox([x - w * 0.3, y0 + h * 0.2, z - 0.065], [x + w * 0.3, y0 + h * 0.75, z - 0.044])]), c),
    A('body', `${k}_panel`, roundedBox([x - w / 2 - 0.006, y0, z - 0.045], [x + w / 2 + 0.006, y0 + h + 0.014, z - 0.022], 0.004, 1), c),
    A('body', `${k}_img_${screen}`, flatBox([x - w / 2, y0 + 0.012, z - 0.022], [x + w / 2, y0 + h + 0.006, z - 0.0215]), screen),
    A('body', `${k}_led`, flatBox([x + w / 2 - 0.02, y0 + 0.003, z - 0.022], [x + w / 2 - 0.014, y0 + 0.007, z - 0.0205]), 'led_blue'),
  ];
}

/** Skříň počítače (W × H × D), střed podstavy (x, z); front do +Z: zaoblený plášť, čelo s mřížkou, tlačítko, USB. */
export function towerParts(x, z, w, h, d, mat = 'bezel_black') {
  const k = `tower_${mm(w)}_${mm(h)}_${mm(d)}_${mm(x)}_${mm(z)}_${mat}`;
  const slots = [];
  for (let i = 0; i < 8; i++) slots.push(flatBox([x - w / 2 + 0.02, h * 0.25 + i * h * 0.07, z + d / 2], [x + w / 2 - 0.02, h * 0.25 + i * h * 0.07 + h * 0.03, z + d / 2 + 0.002]));
  return [
    A('body', `${k}_case`, roundedBox([x - w / 2, 0.012, z - d / 2], [x + w / 2, h, z + d / 2], 0.008, 1), mat),
    A('body', `${k}_grille`, merge(slots), 'server_face'),
    A('body', `${k}_btn`, moved(cylinder(0.008, 0, 0.003, { seg: 8 }), at(mTranslate(x, h - 0.035, z + d / 2), mRotate('x', 90))), 'led_blue'),
    A('body', `${k}_usb`, merge([-0.012, 0.012].map((dx) => flatBox([x + dx - 0.006, h - 0.07, z + d / 2], [x + dx + 0.006, h - 0.064, z + d / 2 + 0.001]))), 'bezel_black'),
    A('body', `${k}_feet`, merge([-1, 1].map((s) => flatBox([x + s * (w / 2 - 0.02) - 0.01, 0, z - d / 2 + 0.03], [x + s * (w / 2 - 0.02) + 0.01, 0.012, z + d / 2 - 0.03]))), 'rubber_black'),
  ];
}

/** Klávesnice a myš před monitorem, střed klávesnice (x, z): nízký zaoblený rám, pole kláves a oblá myš. */
export function keyboardParts(x, z, key = 'key_black') {
  const dark = key === 'key_black';
  const k = `kbd_${mm(x)}_${mm(z)}_${key}`;
  const keys = [];
  for (let r = 0; r < 5; r++) keys.push(flatBox([x - 0.205 + (r === 4 ? 0.06 : 0), 0.012, z - 0.055 + r * 0.022], [x + 0.205 - (r === 4 ? 0.06 : 0), 0.019, z - 0.055 + r * 0.022 + 0.018]));
  return [
    A('body', `${k}_frame`, roundedBox([x - 0.22, 0, z - 0.07], [x + 0.22, 0.013, z + 0.07], 0.005, 1), dark ? 'bezel_black' : 'alu_silver'),
    A('body', `${k}_keys`, merge(keys), key),
    A('body', `${k}_mouse`, moved(roundedBox([-0.03, 0, -0.045], [0.03, 0.035, 0.045], 0.015, 1), mTranslate(x + 0.3, 0, z + 0.01)), dark ? 'bezel_black' : 'key_white'),
  ];
}

/** Notebook otevřený (víko skloněné o 15° dozadu), střed (x, z); inch = úhlopříčka displeje. */
export function laptopParts(x, z, inch, mat = 'alu_silver', screen = 'screen_code') {
  const [w, h] = panelSize(inch, 16, 10);
  const d = h + 0.02;
  const k = `lap_${inch}_${mm(x)}_${mm(z)}_${mat}`;
  const hinge = at(mTranslate(x, 0.016, z - d / 2 + 0.006), mRotate('x', -15));
  return [
    A('body', `${k}_base`, roundedBox([x - w / 2 - 0.012, 0, z - d / 2], [x + w / 2 + 0.012, 0.016, z + d / 2], 0.005, 1), mat),
    A('body', `${k}_keys`, flatBox([x - w / 2 + 0.01, 0.016, z - d / 2 + 0.02], [x + w / 2 - 0.01, 0.0175, z + 0.02]), 'key_black'),
    A('body', `${k}_pad`, flatBox([x - 0.05, 0.016, z + 0.04], [x + 0.05, 0.0172, z + d / 2 - 0.02]), 'alu_space'),
    A('body', `${k}_lid`, moved(roundedBox([-w / 2 - 0.012, 0, -0.006], [w / 2 + 0.012, h + 0.02, 0], 0.004, 1), hinge), mat),
    A('body', `${k}_img_${screen}`, moved(flatBox([-w / 2, 0.01, 0], [w / 2, h + 0.01, 0.0012]), hinge), screen),
  ];
}

/** Monitory: 24" (černý a bílý), 27", 32", 34" ultraširoký a 24" na výšku. */
export function monitors() {
  return [
    one('monitor_24_01', 'Monitor 24" černý', monitorParts(0, 0, 24, 'screen_doc'), 'monitors'),
    one('monitor_24_02', 'Monitor 24" bílý', monitorParts(0, 0, 24, 'screen_code', { color: 'key_white' }), 'monitors'),
    one('monitor_27_01', 'Monitor 27"', monitorParts(0, 0, 27, 'screen_graph'), 'monitors'),
    one('monitor_32_01', 'Monitor 32" 4K', monitorParts(0, 0, 32, 'screen_code'), 'monitors'),
    one('monitor_34_wide_01', 'Monitor 34" ultraširoký', monitorParts(0, 0, 34, 'screen_code', { wide: true }), 'monitors'),
    one('monitor_24_portrait_01', 'Monitor 24" na výšku', monitorParts(0, 0, 24, 'screen_doc', { portrait: true }), 'monitors'),
  ];
}

/** Počítačové skříně: malá (černá, bílá), pracovní stanice, mini počítač; počítač vše v jednom. */
export function towers() {
  const aio = (() => {
    const [w, h] = panelSize(24);
    const k = 'pc_allinone_01';
    return [
      A('body', `${k}_foot`, roundedBox([-0.1, 0, -0.13], [0.1, 0.008, 0.05], 0.03, 2), 'alu_silver'),
      A('body', `${k}_neck`, merge([roundedBox([-0.04, 0.006, -0.11], [0.04, 0.2, -0.085], 0.006, 1), roundedBox([-0.035, 0.14, -0.09], [0.035, 0.19, -0.07], 0.004, 1)]), 'alu_silver'),
      A('body', `${k}_body`, roundedBox([-w / 2 - 0.01, 0.1, -0.072], [w / 2 + 0.01, 0.1 + h + 0.06, -0.055], 0.006, 2), 'alu_silver'),
      A('body', `${k}_bezel`, flatBox([-w / 2 - 0.004, 0.155, -0.0552], [w / 2 + 0.004, 0.1 + h + 0.054, -0.0546]), 'bezel_black'),
      A('body', `${k}_lcd`, flatBox([-w / 2, 0.16, -0.0548], [w / 2, 0.155 + h, -0.054]), 'screen_doc'),
      A('body', `${k}_cam`, moved(cylinder(0.002, 0, 0.001, { seg: 6 }), at(mTranslate(0, 0.1 + h + 0.045, -0.0545), mRotate('x', 90))), 'screen_off'),
    ];
  })();
  const mk = 'pc_mini_01';
  const mini = [
    A('body', `${mk}_body`, roundedBox([-0.1, 0.004, -0.1], [0.1, 0.05, 0.1], 0.012, 2), 'alu_silver'),
    A('body', `${mk}_top`, flatBox([-0.085, 0.05, -0.085], [0.085, 0.0505, 0.085]), 'alu_space'),
    A('body', `${mk}_ports`, merge([flatBox([-0.06, 0.018, 0.0995], [-0.045, 0.024, 0.1005]), flatBox([-0.04, 0.018, 0.0995], [-0.025, 0.024, 0.1005]), flatBox([0.02, 0.018, 0.0995], [0.03, 0.026, 0.1005])]), 'bezel_black'),
    A('body', `${mk}_led`, moved(cylinder(0.003, 0, 0.001, { seg: 6 }), at(mTranslate(0.07, 0.022, 0.1), mRotate('x', 90))), 'led_blue'),
    A('body', `${mk}_feet`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => moved(cylinder(0.008, 0, 0.004, { seg: 6 }), mTranslate(sx * 0.075, 0, sz * 0.075))))), 'bezel_black'),
  ];
  return [
    one('pc_tower_01', 'Počítačová skříň černá', towerParts(0, 0, 0.2, 0.42, 0.42), 'towers', { components: staticFloor() }),
    one('pc_tower_02', 'Počítačová skříň bílá', towerParts(0, 0, 0.2, 0.42, 0.42, 'key_white'), 'towers', { components: staticFloor() }),
    one('pc_workstation_01', 'Pracovní stanice (velká skříň)', towerParts(0, 0, 0.24, 0.55, 0.55, 'alu_space'), 'towers', { components: staticFloor() }),
    one(mk, 'Mini počítač', mini, 'towers'),
    one('pc_allinone_01', 'Počítač vše v jednom 24"', [...aio, ...keyboardParts(0, 0.2, 'key_white')], 'towers'),
  ];
}

/** Tablet ve vodorovné poloze: tělo se zaoblenými rohy, displej a kamera. */
function slate(k, w, d, t, body, screen, y = 0) {
  return [
    A('body', `${k}_body`, slabOf(w, d, y, y + t, Math.min(w, d) * 0.08), body),
    A('body', `${k}_lcd`, flatBox([-w / 2 + 0.006, y + t, -d / 2 + 0.006], [w / 2 - 0.006, y + t + 0.0004, d / 2 - 0.006]), screen),
  ];
}
const slabOf = (w, d, y0, y1, rc) => slab(0, 0, w, d, y0, y1, rc, 2, Math.min(0.0015, (y1 - y0) * 0.3));

/** Notebooky (14" stříbrný, 15,6" černý, 16" stříbrný, zavřený), tablet na stole a na stojanu, telefon, klávesnice s myší. */
export function portables() {
  const ck = 'laptop_closed_01';
  const closed = [
    A('body', `${ck}_base`, slabOf(0.32, 0.22, 0, 0.009, 0.01), 'alu_space'),
    A('body', `${ck}_lid`, slabOf(0.318, 0.218, 0.0095, 0.017, 0.01), 'alu_space'),
    A('body', `${ck}_hinge`, flatBox([-0.12, 0.004, -0.111], [0.12, 0.013, -0.108]), 'bezel_black'),
    A('body', `${ck}_logo`, moved(cylinder(0.012, 0, 0.0004, { seg: 10 }), mTranslate(0, 0.017, 0)), 'alu_silver'),
  ];
  const tk = 'tablet_stand_01';
  const tabletStand = [
    A('body', `${tk}_base`, roundedBox([-0.06, 0, -0.07], [0.06, 0.01, 0.04], 0.006, 1), 'alu_silver'),
    A('body', `${tk}_arm`, moved(roundedBox([-0.02, 0, -0.004], [0.02, 0.09, 0.004], 0.003, 1), at(mTranslate(0, 0.008, -0.05), mRotate('x', -20))), 'alu_silver'),
    A('body', `${tk}_body`, moved(slabOf(0.25, 0.175, -0.004, 0.004, 0.012), at(mTranslate(0, 0.12, -0.035), mRotate('x', 75))), 'alu_space'),
    A('body', `${tk}_lcd`, moved(flatBox([-0.119, 0.004, -0.0815], [0.119, 0.0044, 0.0815]), at(mTranslate(0, 0.12, -0.035), mRotate('x', 75))), 'screen_graph'),
  ];
  const pk = 'phone_01';
  const phone = [
    ...slate(pk, 0.072, 0.15, 0.008, 'bezel_black', 'screen_code'),
    A('body', `${pk}_cam`, merge([moved(cylinder(0.002, 0, 0.0005, { seg: 6 }), mTranslate(0, 0.0084, -0.068))]), 'screen_off'),
  ];
  return [
    one('laptop_14_01', 'Notebook 14" stříbrný', laptopParts(0, 0, 14), 'portables'),
    one('laptop_15_01', 'Notebook 15,6" černý', laptopParts(0, 0, 15.6, 'alu_space', 'screen_doc'), 'portables'),
    one('laptop_16_01', 'Notebook 16" stříbrný', laptopParts(0, 0, 16, 'alu_silver', 'screen_graph'), 'portables'),
    one(ck, 'Notebook zavřený', closed, 'portables'),
    one('tablet_flat_01', 'Tablet na stole', slate('tablet_flat_01', 0.25, 0.18, 0.008, 'alu_space', 'screen_doc'), 'portables'),
    one(tk, 'Tablet na stojanu', tabletStand, 'portables'),
    one(pk, 'Mobilní telefon', phone, 'portables'),
    one('keyboard_set_01', 'Klávesnice s myší (černé)', keyboardParts(0, 0), 'portables'),
    one('keyboard_set_02', 'Klávesnice s myší (bílé)', keyboardParts(0, 0, 'key_white'), 'portables'),
  ];
}

/** Sestavy na stůl: jeden monitor a skříň, dva monitory, tři monitory, ultraširoký s notebookem, vývojářská (na výšku + 27"), notebook s dokem a monitorem. */
export function workstations() {
  const kb = keyboardParts(0, 0.22);
  const dock = (k) => [A('body', `${k}_dock`, roundedBox([-0.3, 0, -0.2], [-0.22, 0.03, -0.12], 0.006, 1), 'bezel_black'), A('body', `${k}_dockled`, flatBox([-0.265, 0.012, -0.1202], [-0.255, 0.016, -0.1198]), 'emit_green')];
  return [
    one('setup_single_01', 'Sestava: monitor 24" a skříň vedle', [...monitorParts(-0.05, -0.15, 24, 'screen_doc'), ...towerParts(0.5, -0.1, 0.2, 0.42, 0.42), ...kb], 'workstations'),
    one('setup_dual_01', 'Sestava: dva monitory 24"', [...monitorParts(-0.29, -0.15, 24, 'screen_code'), ...monitorParts(0.29, -0.15, 24, 'screen_doc'), ...kb], 'workstations'),
    one('setup_triple_01', 'Sestava: tři monitory 24" (dispečink)', [...monitorParts(-0.56, -0.12, 24, 'screen_graph'), ...monitorParts(0, -0.15, 24, 'screen_code'), ...monitorParts(0.56, -0.12, 24, 'screen_graph'), ...kb], 'workstations'),
    one('setup_wide_laptop_01', 'Sestava: ultraširoký monitor a notebook', [...monitorParts(0.1, -0.15, 34, 'screen_code', { wide: true }), ...laptopParts(-0.62, 0.05, 14, 'alu_silver', 'screen_doc'), ...kb], 'workstations'),
    one('setup_dev_01', 'Sestava vývojáře: monitor na výšku a 27"', [...monitorParts(-0.42, -0.15, 24, 'screen_code', { portrait: true }), ...monitorParts(0.18, -0.15, 27, 'screen_code'), ...kb], 'workstations'),
    one('setup_dock_01', 'Sestava: notebook v dokovací stanici a monitor 27"', [...monitorParts(0.15, -0.15, 27, 'screen_doc'), ...laptopParts(-0.55, -0.05, 15.6, 'alu_space', 'screen_code'), ...dock('setup_dock_01'), ...kb], 'workstations'),
  ];
}

/** Tiskárny: laserová na stůl a multifunkční kopírka na podlahu. */
export function printers() {
  const lk = 'printer_laser_01';
  const laser = [
    A('body', `${lk}_body`, roundedBox([-0.2, 0.004, -0.2], [0.2, 0.25, 0.2], 0.012, 2), 'key_white'),
    A('body', `${lk}_out`, merge([flatBox([-0.16, 0.2, -0.15], [0.16, 0.2505, 0.05]), flatBox([-0.16, 0.2, 0.05], [0.16, 0.25, 0.052])]), 'bezel_black'),
    A('body', `${lk}_paper`, merge([flatBox([-0.1, 0.205, -0.13], [0.1, 0.21, 0.02])]), 'paint_white_line'),
    A('body', `${lk}_tray`, roundedBox([-0.15, 0.03, 0.2], [0.15, 0.09, 0.215], 0.004, 1), 'key_white'),
    A('body', `${lk}_grip`, flatBox([-0.05, 0.075, 0.215], [0.05, 0.085, 0.218]), 'bezel_black'),
    A('body', `${lk}_panel`, flatBox([0.1, 0.19, 0.2], [0.19, 0.24, 0.203]), 'bezel_black'),
    A('body', `${lk}_lcd`, flatBox([0.11, 0.205, 0.203], [0.16, 0.232, 0.2034]), 'emit_display'),
    A('body', `${lk}_led`, flatBox([0.168, 0.21, 0.203], [0.176, 0.216, 0.2036]), 'emit_green'),
    A('body', `${lk}_feet`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.17 - 0.015, 0, sz * 0.17 - 0.015], [sx * 0.17 + 0.015, 0.004, sz * 0.17 + 0.015])))), 'bezel_black'),
  ];
  const ck = 'copier_mfp_01';
  const copier = [
    A('body', `${ck}_body`, roundedBox([-0.3, 0.03, -0.32], [0.3, 1.0, 0.32], 0.012, 2), 'key_white'),
    A('body', `${ck}_plinth`, flatBox([-0.28, 0, -0.3], [0.28, 0.03, 0.29]), 'bezel_black'),
    A('body', `${ck}_scanner`, roundedBox([-0.29, 1.0, -0.31], [0.29, 1.1, 0.31], 0.01, 2), 'key_white'),
    A('body', `${ck}_feeder`, merge([roundedBox([-0.26, 1.1, -0.28], [0.22, 1.13, 0.26], 0.008, 1), flatBox([-0.24, 1.13, -0.22], [0.08, 1.135, 0.2])]), 'key_white'),
    A('body', `${ck}_gap`, flatBox([-0.29, 0.86, 0.3], [0.29, 0.9, 0.321]), 'bezel_black'),
    ...door('body', `${ck}_d`, -0.28, 0.28, 0.6, 0.84, 0.32, 0.006, { mat: 'key_white', r: 0.004 }),
    ...[0.12, 0.33].flatMap((y, i) => [...door('body', `${ck}_t${i}`, -0.28, 0.28, y, y + 0.18, 0.32, 0.006, { mat: 'key_white', r: 0.004 }), A('body', `${ck}_t${i}_grip`, flatBox([-0.08, y + 0.14, 0.326], [0.08, y + 0.16, 0.334]), 'bezel_black')]),
    A('body', `${ck}_arm`, roundedBox([0.05, 1.0, 0.24], [0.28, 1.06, 0.33], 0.006, 1), 'bezel_black'),
    A('body', `${ck}_lcd`, flatBox([0.07, 1.06, 0.25], [0.26, 1.0606, 0.32]), 'emit_display'),
    A('body', `${ck}_bypass`, roundedBox([-0.4, 0.75, -0.2], [-0.3, 0.765, 0.2], 0.004, 1), 'key_white'),
    A('body', `${ck}_sheets`, flatBox([-0.38, 0.765, -0.15], [-0.31, 0.77, 0.15]), 'paint_white_line'),
  ];
  return [one(lk, 'Laserová tiskárna', laser, 'printers'), one(ck, 'Multifunkční kopírka', copier, 'printers', { components: staticFloor() })];
}

export const COMPUTERS = [monitors, towers, portables, workstations, printers];
