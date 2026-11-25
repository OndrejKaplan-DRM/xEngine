// Sada kit_it: počítače (Ondřej: „10 druhů počítačů (desktopy s více typy monitorů, notebooky, tablety)“). Monitory
// 24", 27", 32", 34" ultraširoký a na výšku, skříně počítačů (malá, pracovní stanice, mini), počítač vše v jednom,
// notebooky, tablety, telefon, klávesnice a myš, tiskárny a sestavy na stůl (jeden až tři monitory, notebook
// s dokovací stanicí). Rozměry z obvyklých úhlopříček 16 : 9 a 21 : 9; obecný tvar bez značek.

import { box, boxc, cyl } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, staticFloor } from '../lab/common.mjs';
import { A, merge, roundedBox, flatBox, cylinder, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';

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
    return [box('body', [-0.1, 0, -0.12], [0.1, 0.01, 0.06], 'alu_silver'), box('body', [-0.04, 0.01, -0.1], [0.04, 0.2, -0.07], 'alu_silver'), ...bevelBox('body', [-w / 2 - 0.01, 0.1, -0.07], [w / 2 + 0.01, 0.1 + h + 0.06, -0.055], 'alu_silver', 0.004), box('body', [-w / 2, 0.16, -0.055], [w / 2, 0.16 + h - 0.005, -0.053], 'screen_doc')];
  })();
  return [
    one('pc_tower_01', 'Počítačová skříň černá', towerParts(0, 0, 0.2, 0.42, 0.42), 'towers', { components: staticFloor() }),
    one('pc_tower_02', 'Počítačová skříň bílá', towerParts(0, 0, 0.2, 0.42, 0.42, 'key_white'), 'towers', { components: staticFloor() }),
    one('pc_workstation_01', 'Pracovní stanice (velká skříň)', towerParts(0, 0, 0.24, 0.55, 0.55, 'alu_space'), 'towers', { components: staticFloor() }),
    one('pc_mini_01', 'Mini počítač', [...bevelBox('body', [-0.1, 0, -0.1], [0.1, 0.05, 0.1], 'alu_silver', 0.01), box('body', [-0.006, 0.02, 0.1], [0.006, 0.026, 0.102], 'led_blue')], 'towers'),
    one('pc_allinone_01', 'Počítač vše v jednom 24"', [...aio, ...keyboardParts(0, 0.2, 'key_white')], 'towers'),
  ];
}

/** Notebooky (14" stříbrný, 15,6" černý, 16" stříbrný, zavřený), tablet na stole a na stojanu, telefon, klávesnice s myší. */
export function portables() {
  const closed = [...bevelBox('body', [-0.16, 0, -0.11], [0.16, 0.018, 0.11], 'alu_space', 0.003)];
  const tabletFlat = [...bevelBox('body', [-0.125, 0, -0.09], [0.125, 0.008, 0.09], 'alu_space', 0.002), box('body', [-0.115, 0.008, -0.082], [0.115, 0.0095, 0.082], 'screen_doc')];
  const tabletStand = [box('body', [-0.06, 0, -0.06], [0.06, 0.01, 0.04], 'alu_silver'), box('body', [-0.02, 0.01, -0.05], [0.02, 0.06, -0.04], 'alu_silver'), box('body', [-0.125, 0.03, -0.04], [0.125, 0.21, -0.032], 'alu_space'), box('body', [-0.115, 0.038, -0.032], [0.115, 0.202, -0.031], 'screen_graph')];
  const phone = [...bevelBox('body', [-0.036, 0, -0.075], [0.036, 0.008, 0.075], 'bezel_black', 0.002), box('body', [-0.033, 0.008, -0.071], [0.033, 0.0095, 0.071], 'screen_code')];
  return [
    one('laptop_14_01', 'Notebook 14" stříbrný', laptopParts(0, 0, 14), 'portables'),
    one('laptop_15_01', 'Notebook 15,6" černý', laptopParts(0, 0, 15.6, 'alu_space', 'screen_doc'), 'portables'),
    one('laptop_16_01', 'Notebook 16" stříbrný', laptopParts(0, 0, 16, 'alu_silver', 'screen_graph'), 'portables'),
    one('laptop_closed_01', 'Notebook zavřený', closed, 'portables'),
    one('tablet_flat_01', 'Tablet na stole', tabletFlat, 'portables'),
    one('tablet_stand_01', 'Tablet na stojanu', tabletStand, 'portables'),
    one('phone_01', 'Mobilní telefon', phone, 'portables'),
    one('keyboard_set_01', 'Klávesnice s myší (černé)', keyboardParts(0, 0), 'portables'),
    one('keyboard_set_02', 'Klávesnice s myší (bílé)', keyboardParts(0, 0, 'key_white'), 'portables'),
  ];
}

/** Sestavy na stůl: jeden monitor a skříň, dva monitory, tři monitory, ultraširoký s notebookem, vývojářská (na výšku + 27"), notebook s dokem a monitorem. */
export function workstations() {
  const kb = keyboardParts(0, 0.22);
  return [
    one('setup_single_01', 'Sestava: monitor 24" a skříň vedle', [...monitorParts(-0.05, -0.15, 24, 'screen_doc'), ...towerParts(0.5, -0.1, 0.2, 0.42, 0.42), ...kb], 'workstations'),
    one('setup_dual_01', 'Sestava: dva monitory 24"', [...monitorParts(-0.29, -0.15, 24, 'screen_code'), ...monitorParts(0.29, -0.15, 24, 'screen_doc'), ...kb], 'workstations'),
    one('setup_triple_01', 'Sestava: tři monitory 24" (dispečink)', [...monitorParts(-0.56, -0.12, 24, 'screen_graph'), ...monitorParts(0, -0.15, 24, 'screen_code'), ...monitorParts(0.56, -0.12, 24, 'screen_graph'), ...kb], 'workstations'),
    one('setup_wide_laptop_01', 'Sestava: ultraširoký monitor a notebook', [...monitorParts(0.1, -0.15, 34, 'screen_code', { wide: true }), ...laptopParts(-0.62, 0.05, 14, 'alu_silver', 'screen_doc'), ...kb], 'workstations'),
    one('setup_dev_01', 'Sestava vývojáře: monitor na výšku a 27"', [...monitorParts(-0.42, -0.15, 24, 'screen_code', { portrait: true }), ...monitorParts(0.18, -0.15, 27, 'screen_code'), ...kb], 'workstations'),
    one('setup_dock_01', 'Sestava: notebook v dokovací stanici a monitor 27"', [...monitorParts(0.15, -0.15, 27, 'screen_doc'), ...laptopParts(-0.55, -0.05, 15.6, 'alu_space', 'screen_code'), box('body', [-0.3, 0, -0.2], [-0.22, 0.03, -0.12], 'bezel_black'), ...kb], 'workstations'),
  ];
}

/** Tiskárny: laserová na stůl a multifunkční kopírka na podlahu. */
export function printers() {
  return [
    one('printer_laser_01', 'Laserová tiskárna', [...bevelBox('body', [-0.2, 0, -0.2], [0.2, 0.25, 0.2], 'key_white', 0.01), box('body', [-0.16, 0.25, -0.15], [0.16, 0.252, 0.05], 'bezel_black'), box('body', [-0.15, 0.06, 0.2], [0.15, 0.1, 0.24], 'key_white'), box('body', [0.12, 0.2, 0.2], [0.18, 0.23, 0.202], 'emit_display')], 'printers'),
    one('copier_mfp_01', 'Multifunkční kopírka', [...bevelBox('body', [-0.3, 0, -0.32], [0.3, 1.0, 0.32], 'key_white', 0.012), box('body', [-0.28, 1.0, -0.3], [0.28, 1.12, 0.3], 'key_white'), box('body', [0.05, 1.0, 0.22], [0.28, 1.08, 0.36], 'bezel_black'), box('body', [0.08, 1.04, 0.36], [0.25, 1.075, 0.362], 'emit_display'), ...[0.15, 0.35, 0.55].map((y) => box('body', [-0.28, y, 0.32], [0.28, y + 0.16, 0.325], 'key_white')), box('body', [-0.4, 0.75, -0.2], [-0.3, 0.8, 0.2], 'key_white')], 'printers', { components: staticFloor() }),
  ];
}

export const COMPUTERS = [monitors, towers, portables, workstations, printers];
