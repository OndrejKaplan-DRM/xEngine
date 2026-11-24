// Sada kit_lab: chemikálie a jejich balení (Ondřej: „20 různých balení, dóz, pytlíků a zkumavek, vzorkovnic a vialek
// s chemikáliemi, roztoky“). Obecné balení bez značek: hnědá lahev se štítkem a barevným pruhem podle třídy
// (červená hořlavé, modrá zdraví škodlivé, zelená bezpečné, oranžová žíravé), dózy na prášky, pytle, plechovky,
// krabice s kity, polystyrenové boxy, pufry. Rozměry z katalogů (Sigma-Aldrich, P-lab) jako úvaha, neměřeno.

import { box, boxc, cyl } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, vessel, label, staticFloor } from './common.mjs';

const CAT = 'lab.chem';
const gen = (f) => `lab/chem.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const BANDS = [['label_band_red', 'hořlavé'], ['label_band_blue', 'zdraví škodlivé'], ['label_band_green', 'bez výstrahy'], ['label_band_orange', 'žíravé']];

/** Hnědá lahev s chemikálií 100 ml, 500 ml, 1 l a 2,5 l (Winchester), dvě třídy štítku na velikost. */
export function chemBottles() {
  const sizes = [[100, 0.026, 0.1], [500, 0.04, 0.17], [1000, 0.05, 0.215], [2500, 0.068, 0.3]];
  return sizes.flatMap(([ml, r, h], k) =>
    [0, 1].map((v) => {
      const [band, what] = BANDS[(k * 2 + v) % 4];
      const parts = [...vessel('body', [[0, r], [h * 0.72, r], [h * 0.86, 0.014], [h * 0.94, 0.014]], 'glass_amber', 0.7, 'liquid_amber'), cyl('body', [0, h * 0.94 + 0.01, 0], 0.017, 0.022, 'y', v ? 'plastic_anthracite' : 'plastic_white'), ...label('body', r, h * 0.2, h * 0.62, r * 1.3, band)];
      return one(`bottle_chem_${ml}_${pad(v + 1)}`, `Lahev s chemikálií ${ml >= 1000 ? `${ml / 1000} l` : `${ml} ml`} (${what})`, parts, 'chemBottles');
    }),
  );
}

/** Dóza na prášek se širokým hrdlem 100 g, 500 g a 1 kg; víčka bílá, modrá a červená. */
export function powderJars() {
  const sizes = [[100, 0.028, 0.07], [500, 0.045, 0.11], [1000, 0.055, 0.14]];
  const caps = ['plastic_white', 'cap_blue', 'cap_red'];
  return sizes.flatMap(([g, r, h]) =>
    caps.map((cap, v) => {
      const parts = [...vessel('body', [[0, r], [h - 0.012, r], [h - 0.004, r * 0.85]], 'plastic_hdpe', 0, null), cyl('body', [0, h + 0.006, 0], r * 0.9, 0.02, 'y', cap), ...label('body', r, h * 0.2, h * 0.7, r * 1.25, BANDS[v][0])];
      return one(`jar_powder_${g}_${pad(v + 1)}`, `Dóza s práškem ${g >= 1000 ? '1 kg' : `${g} g`}`, parts, 'powderJars');
    }),
  );
}

/** Pytel 25 kg (papírový, bílý a hnědý) a krabice s kity v pěti velikostech. */
export function sacksAndBoxes() {
  const sacks = [['label_paper', 'bílý'], ['paper_kraft', 'hnědý']].map(([m, name], v) =>
    one(`sack_25kg_${pad(v + 1)}`, `Papírový pytel 25 kg (${name})`, [...bevelBox('body', [-0.25, 0, -0.18], [0.25, 0.13, 0.18], m, 0.03), box('body', [-0.12, 0.1, 0.1], [0.12, 0.131, 0.16], 'label_band_blue')], 'sacksAndBoxes', { components: staticFloor() }),
  );
  const kits = [
    [0.09, 0.05, 0.13, 'label_paper', 'label_band_blue'],
    [0.14, 0.06, 0.1, 'plastic_white', 'label_band_green'],
    [0.2, 0.08, 0.14, 'label_paper', 'label_band_orange'],
    [0.25, 0.1, 0.18, 'paper_kraft', 'label_band_red'],
    [0.3, 0.12, 0.22, 'plastic_white', 'label_band_blue'],
  ].map(([w, h, d, m, band], v) => one(`box_kit_${pad(v + 1)}`, `Krabice s kitem ${v + 1}`, [box('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], m), box('body', [-w / 2, h * 0.65, -d / 2 - 0.001], [w / 2, h * 0.85, d / 2 + 0.001], band), box('body', [-w * 0.3, h, -d * 0.3], [w * 0.3, h + 0.0015, d * 0.1], 'label_paper')], 'sacksAndBoxes'));
  return [...sacks, ...kits];
}

/** Plechovka s rozpouštědlem 5 l a bezpečnostní kanystr 10 l s plamenojistkou. */
export function solventCans() {
  const can = one('can_solvent_5l_01', 'Plechovka s rozpouštědlem 5 l', [box('body', [-0.085, 0, -0.06], [0.085, 0.24, 0.06], 'steel_brushed'), box('body', [-0.06, 0.24, -0.012], [0.03, 0.255, 0.012], 'steel_dark'), cyl('body', [0.055, 0.25, 0], 0.016, 0.02, 'y', 'cap_red'), ...label('body', 0.06, 0.06, 0.18, 0.12, 'label_band_red')], 'solventCans');
  const safety = one('can_safety_10l_01', 'Bezpečnostní kanystr na rozpouštědla 10 l', [cyl('body', [0, 0.17, 0], 0.13, 0.34, 'y', 'paint_red'), cyl('body', [0, 0.35, 0], 0.03, 0.03, 'y', 'steel_brushed'), box('body', [-0.1, 0.36, -0.015], [0.1, 0.38, 0.015], 'steel_dark'), box('body', [-0.08, 0.1, 0.129], [0.08, 0.22, 0.131], 'cap_yellow')], 'solventCans', { components: staticFloor() });
  return [can, safety];
}

/** Polystyrenový box na suchý led (malý a velký), s víkem. */
export function shippers() {
  return [[0.3, 0.25, 0.22], [0.45, 0.35, 0.35]].map(([w, h, d], v) => one(`box_dryice_${pad(v + 1)}`, `Polystyrenový box na suchý led ${v ? 'velký' : 'malý'}`, [box('body', [-w / 2, 0, -d / 2], [w / 2, h - 0.05, d / 2], 'plastic_white'), box('body', [-w / 2, h - 0.05, -d / 2], [w / 2, h, d / 2], 'plastic_white'), box('body', [-w * 0.3, h * 0.3, d / 2], [w * 0.3, h * 0.6, d / 2 + 0.0015], 'label_band_orange')], 'shippers', { components: staticFloor() }));
}

/** Pufry a roztoky v litrových lahvích: PBS, TAE, tris, médium; barevný roztok a štítek. */
export function buffers() {
  return [
    ['liquid_water', 'PBS', 'label_band_blue'],
    ['liquid_water', 'TAE 50×', 'label_band_green'],
    ['liquid_yellow', 'tris-HCl', 'label_band_orange'],
    ['liquid_pink', 'kultivační médium', 'label_band_red'],
  ].map(([liq, name, band], v) => {
    const r = 0.05;
    const h = 0.23;
    const parts = [...vessel('body', [[0, r], [h - 0.045, r], [h - 0.025, 0.0225], [h - 0.012, 0.0225]], 'glass_lab', 0.75, liq), cyl('body', [0, h - 0.002, 0], 0.026, 0.022, 'y', 'cap_blue'), ...label('body', r, h * 0.3, h * 0.55, 0.06, band)];
    return one(`bottle_buffer_${pad(v + 1)}`, `Lahev s roztokem: ${name}`, parts, 'buffers');
  });
}

/** Vialky se zalisovaným víčkem v kartonovém stojánku (5 × 5) a sklenice s krystaly. */
export function vialsAndCrystals() {
  const racks = ['liquid_amber', 'liquid_purple'].map((liq, v) => {
    const parts = [box('body', [-0.045, 0, -0.045], [0.045, 0.03, 0.045], 'paper_kraft')];
    for (let i = 0; i < 25; i++) {
      const x = -0.036 + (i % 5) * 0.018;
      const z = -0.036 + Math.floor(i / 5) * 0.018;
      parts.push(boxc('body', [x, 0.04, z], [0.012, 0.04, 0.012], i % 3 ? 'glass_lab' : liq), boxc('body', [x, 0.063, z], [0.013, 0.006, 0.013], 'steel_brushed'));
    }
    return one(`rack_vials_crimp_${pad(v + 1)}`, `Vialky se zalisovaným víčkem v kartonu ${v + 1}`, parts, 'vialsAndCrystals');
  });
  const jars = [['powder_blue', 'modrou skalicí'], ['powder_white', 'chloridem sodným']].map(([m, name], v) => one(`jar_crystals_${pad(v + 1)}`, `Sklenice s ${name}`, [...vessel('body', [[0, 0.045], [0.12, 0.045]], 'glass_lab', 0.6, m), cyl('body', [0, 0.127, 0], 0.047, 0.016, 'y', 'plastic_anthracite'), ...label('body', 0.045, 0.03, 0.08, 0.06, 'label_band_green')], 'vialsAndCrystals'));
  return [...racks, ...jars];
}

/** Sběrná nádoba na chemický odpad 10 l s nálevkou (halogenované a nehalogenované). */
export function wasteContainers() {
  return [['label_band_orange', 'halogenovaný'], ['label_band_red', 'nehalogenovaný']].map(([band, name], v) =>
    one(`container_waste_${pad(v + 1)}`, `Nádoba na chemický odpad 10 l (${name})`, [...bevelBox('body', [-0.12, 0, -0.1], [0.12, 0.32, 0.1], 'plastic_hdpe', 0.015), cyl('body', [0.05, 0.34, 0], 0.04, 0.04, 'y', 'plastic_white'), cyl('body', [0.05, 0.37, 0], 0.07, 0.02, 'y', 'plastic_white'), ...label('body', 0.1, 0.1, 0.25, 0.16, band)], 'wasteContainers', { components: staticFloor() }),
  );
}

export const CHEM = [chemBottles, powderJars, sacksAndBoxes, solventCans, shippers, buffers, vialsAndCrystals, wasteContainers];
