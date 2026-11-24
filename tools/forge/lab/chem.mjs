// Sada kit_lab: chemikálie a jejich balení z hladkých sítí (Ondřej: „20 různých balení, dóz, pytlíků a zkumavek,
// vzorkovnic a vialek s chemikáliemi, roztoky“; 24. 11. 23:57: víc realismu). Obecné balení bez značek: hnědá
// lahev se štítkem, barevným pruhem podle třídy a výstražným kosočtvercem (červená hořlavé, modrá zdraví škodlivé,
// zelená bezpečné, oranžová žíravé), dózy na prášky, pytle, plechovky, krabice s kity, polystyrenové boxy, pufry.
// Rozměry z katalogů (Sigma-Aldrich, P-lab) jako úvaha, neměřeno.

import { simple, staticFloor } from './common.mjs';
import { P, T, merge, lathe, arc, crate, tube, screwCap, solid, wrapLabel, handle, roundedBox, moved, at, mTranslate, mRotate } from './ware.mjs';
import { flatBox, pyramid, slab, openBox } from '../mesh/solids.mjs';
import { deform } from '../mesh/geo.mjs';
import { vesselGeom, liquidGeom, FRONT } from './glassware.mjs';
import { gl45Cap } from './glass.mjs';

const CAT = 'lab.chem';
const gen = (f) => `lab/chem.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const part = P('chem');
const BANDS = [['label_band_red', 'hořlavé'], ['label_band_blue', 'zdraví škodlivé'], ['label_band_green', 'bez výstrahy'], ['label_band_orange', 'žíravé']];

/** Výstražný kosočtverec (červený rámeček, bílé pole, černý znak) na přední straně ve výšce y, vzdálenost z, velikost s. */
function ghs(y, z, s) {
  const d = (r, t, dz) => moved(pyramid(r, r, 0, t, 4, 0), at(mTranslate(0, y, z + dz), mRotate('x', 90)));
  return { red: d(s, 0.0004, 0), white: d(s * 0.78, 0.0004, 0.0004), sign: d(s * 0.3, 0.0004, 0.0008) };
}

/** Hnědá lahev s chemikálií 100 ml, 500 ml, 1 l a 2,5 l (Winchester), dvě třídy štítku na velikost. */
export function chemBottles() {
  const sizes = [[100, 0.026, 0.1], [500, 0.04, 0.17], [1000, 0.05, 0.215], [2500, 0.068, 0.3]];
  return sizes.flatMap(([ml, r, h], k) => {
    const rn = Math.min(0.016, r * 0.5);
    // hnědé sklo je skoro neprůhledné: jen vnější plocha, uvnitř je vidět hladina
    const seg = Math.min(20, 12 + Math.round(r * 120));
    const body = solid([[0, 0.001], [r, 0, r * 0.1], [r, h * 0.72, r * 0.45], [rn, h * 0.88, rn * 0.5], [rn, h - 0.004], [0, h - 0.004]], seg);
    const inner = [[0, 0.004], [r - 0.003, 0.004], [r - 0.003, h * 0.72]];
    return [0, 1].map((v) => {
      const [band, what] = BANDS[(k * 2 + v) % 4];
      const key = `bottle_chem_${ml}`;
      const g = ghs(h * 0.42, r + 0.0006, r * 0.22);
      const parts = [
        part(key, 'glass', body, 'glass_amber'),
        part(key, 'liquid', liquidGeom(inner, h * 0.6, { seg: 12, flat: true }), 'liquid_amber'),
        part(`${key}_${v}`, 'cap', screwCap(rn + 0.003, h - 0.016, 0.022, 10, rn), v ? 'plastic_anthracite' : 'plastic_white'),
        part(key, 'label', wrapLabel(r + 0.0004, h * 0.18, h * 0.62, 120, 10), 'label_paper'),
        part(`${key}_${v}`, 'band', wrapLabel(r + 0.0007, h * 0.52, h * 0.62, 120, 10), band),
        part(key, 'ghs', g.red, 'label_band_red'),
        part(key, 'ghsw', g.white, 'label_paper'),
        part(key, 'ghss', g.sign, 'plastic_anthracite'),
      ];
      return one(`bottle_chem_${ml}_${pad(v + 1)}`, `Lahev s chemikálií ${ml >= 1000 ? `${ml / 1000} l` : `${ml} ml`} (${what})`, parts, 'chemBottles');
    });
  });
}

/** Dóza na prášek se širokým hrdlem 100 g, 500 g a 1 kg; víčka bílá, modrá a červená s vroubky. */
export function powderJars() {
  const sizes = [[100, 0.028, 0.07], [500, 0.045, 0.11], [1000, 0.055, 0.14]];
  const caps = ['plastic_white', 'cap_blue', 'cap_red'];
  return sizes.flatMap(([g, r, h]) => {
    const key = `jar_powder_${g}`;
    const body = solid([[0, 0.001], [r * 0.95, 0, 'c'], [r, 0.006], [r, h - 0.016, 0.006], [r * 0.86, h - 0.008], [r * 0.86, h - 0.002], [0, h - 0.002]], 16);
    return caps.map((cap, v) => one(`jar_powder_${g}_${pad(v + 1)}`, `Dóza s práškem ${g >= 1000 ? '1 kg' : `${g} g`}`, [
      part(key, 'body', body, 'plastic_hdpe'),
      part(`${key}_${v}`, 'cap', screwCap(r * 0.92, h - 0.014, 0.022, 14, r * 0.85), cap),
      part(key, 'label', wrapLabel(r + 0.0004, h * 0.15, h * 0.68, 130, 10), 'label_paper'),
      part(`${key}_${v}`, 'band', wrapLabel(r + 0.0007, h * 0.56, h * 0.68, 130, 10), BANDS[v][0]),
    ], 'powderJars'));
  });
}

/** Pytel 25 kg (papírový, bílý a hnědý; vyboulený, se švy na koncích) a krabice s kity v pěti velikostech. */
export function sacksAndBoxes() {
  const sackGeom = deform(roundedBox([-0.25, 0, -0.18], [0.25, 0.13, 0.18], 0.04, 2), ([x, y, z]) => {
    const b = (1 - (x / 0.25) ** 2) * (1 - (z / 0.18) ** 2);
    return [x * (1 - 0.04 * (y / 0.13)), y + (y > 0.06 ? 0.03 * b : 0), z];
  });
  const seams = merge(flatBox([-0.262, 0.03, -0.16], [-0.24, 0.1, 0.16]), flatBox([0.24, 0.03, -0.16], [0.262, 0.1, 0.16]));
  const sacks = [['label_paper', 'bílý'], ['paper_kraft', 'hnědý']].map(([m, name], v) =>
    one(`sack_25kg_${pad(v + 1)}`, `Papírový pytel 25 kg (${name})`, [part(`sack_${v}`, 'bag', merge(sackGeom, seams), m), part('sack', 'print', flatBox([-0.12, 0.155, -0.05], [0.12, 0.1565, 0.08]), 'label_band_blue')], 'sacksAndBoxes', { components: staticFloor() }),
  );
  const kits = [
    [0.09, 0.05, 0.13, 'label_paper', 'label_band_blue'],
    [0.14, 0.06, 0.1, 'plastic_white', 'label_band_green'],
    [0.2, 0.08, 0.14, 'label_paper', 'label_band_orange'],
    [0.25, 0.1, 0.18, 'paper_kraft', 'label_band_red'],
    [0.3, 0.12, 0.22, 'plastic_white', 'label_band_blue'],
  ].map(([w, h, d, m, band], v) => one(`box_kit_${pad(v + 1)}`, `Krabice s kitem ${v + 1}`, [
    part(`box_kit_${v}`, 'box', merge(crate([-w / 2, 0, -d / 2], [w / 2, h * 0.92, d / 2], 0.002, 1), crate([-w / 2 - 0.0015, h * 0.8, -d / 2 - 0.0015], [w / 2 + 0.0015, h, d / 2 + 0.0015], 0.002, 1)), m),
    part(`box_kit_${v}`, 'band', flatBox([-w / 2 - 0.0005, h * 0.55, -d / 2 - 0.0005], [w / 2 + 0.0005, h * 0.72, d / 2 + 0.0005]), band),
    part(`box_kit_${v}`, 'label', flatBox([-w * 0.3, h, -d * 0.3], [w * 0.3, h + 0.0015, d * 0.1]), 'label_paper'),
  ], 'sacksAndBoxes'));
  return [...sacks, ...kits];
}

/** Plechovka s rozpouštědlem 5 l (zaoblené hrany, lem, rukojeť, výlevka) a bezpečnostní kanystr 10 l s plamenojistkou. */
export function solventCans() {
  const body = merge(slab(0, 0, 0.17, 0.12, 0.004, 0.236, 0.012, 3), slab(0, 0, 0.172, 0.122, 0, 0.006, 0.013, 3), slab(0, 0, 0.172, 0.122, 0.234, 0.242, 0.013, 3, 0.002));
  const can = one('can_solvent_5l_01', 'Plechovka s rozpouštědlem 5 l', [
    part('can_solvent', 'body', merge(body, handle(-0.06, 0.02, 0.242, 0.03, 0.004, 6), T(lathe([[0.013, 0.24], [0.013, 0.252, 'c'], [0, 0.252]], { seg: 10 }), 0.052, 0, 0)), 'steel_brushed'),
    part('can_solvent', 'cap', T(screwCap(0.016, 0.25, 0.016, 8, 0.012), 0.052, 0, 0), 'cap_red'),
    part('can_solvent', 'label', flatBox([-0.065, 0.05, 0.0605], [0.065, 0.19, 0.0615]), 'label_paper'),
    part('can_solvent', 'band', flatBox([-0.065, 0.15, 0.0614], [0.065, 0.19, 0.062]), 'label_band_red'),
  ], 'solventCans');
  const safetyBody = solid([[0, 0], [0.128, 0, 'c'], [0.13, 0.01], [0.13, 0.3, 0.03], [0.04, 0.33, 0.01], [0.035, 0.34], [0, 0.34]], 20);
  const funnel = lathe([[0.012, 0.335], [0.03, 0.34, 'c'], [0.03, 0.36, 'c'], [0.024, 0.36]], { seg: 12 });
  const lever = tube([[-0.04, 0.37, 0], [0, 0.375, 0], [0.11, 0.35, 0]], 0.006, 6, { bend: 0.02 });
  const safety = one('can_safety_10l_01', 'Bezpečnostní kanystr na rozpouštědla 10 l', [part('can_safety', 'body', safetyBody, 'paint_red'), part('can_safety', 'top', merge(funnel, lever), 'steel_brushed'), part('can_safety', 'label', wrapLabel(0.1305, 0.1, 0.22, 70, 6), 'cap_yellow')], 'solventCans', { components: staticFloor() });
  return [can, safety];
}

/** Polystyrenový box na suchý led: silné stěny, víko s přesahem, páska a výstražný štítek. */
export function shippers() {
  return [[0.3, 0.25, 0.22], [0.45, 0.35, 0.35]].map(([w, h, d], v) => one(`box_dryice_${pad(v + 1)}`, `Polystyrenový box na suchý led ${v ? 'velký' : 'malý'}`, [
    part(`box_dryice_${v}`, 'box', merge(crate([-w / 2, 0, -d / 2], [w / 2, h - 0.05, d / 2], 0.006, 1), crate([-w / 2 - 0.004, h - 0.052, -d / 2 - 0.004], [w / 2 + 0.004, h, d / 2 + 0.004], 0.008, 1)), 'plastic_white'),
    part(`box_dryice_${v}`, 'tape', merge(flatBox([-0.025, h - 0.06, -d / 2 - 0.0055], [0.025, h + 0.0012, d / 2 + 0.0055]), flatBox([-0.025, h, -d / 2 - 0.005], [0.025, h + 0.0015, d / 2 + 0.005])), 'paper_kraft'),
    part(`box_dryice_${v}`, 'label', flatBox([-w * 0.3, h * 0.3, d / 2], [w * 0.3, h * 0.6, d / 2 + 0.0015]), 'label_band_orange'),
  ], 'shippers', { components: staticFloor() }));
}

/** Pufry a roztoky v litrových lahvích GL 45: PBS, TAE, tris, médium; barevný roztok a štítek. */
export function buffers() {
  const r = 0.05;
  const h = 0.23;
  const rn = 0.0205;
  const top = h - 0.004;
  const sh = h - 0.03 - r * 0.55;
  const v0 = vesselGeom([[0, 0.002], [r * 0.9, 0, r * 0.08, 1], [r, r * 0.12, r * 0.1, 2], [r, sh, r * 0.25, 2], [rn + 0.002, h - 0.03, rn * 0.6, 2], [rn + 0.002, top - 0.024], [rn, top - 0.022], [rn, top - 0.002], [rn + 0.0008, top]], { wall: 0.002, bottom: 0.004, seg: 18, lipN: 2 });
  const { ribbed, pour } = gl45Cap(rn + 0.0015, top);
  return [
    ['liquid_water', 'PBS', 'label_band_blue'],
    ['liquid_water', 'TAE 50×', 'label_band_green'],
    ['liquid_yellow', 'tris-HCl', 'label_band_orange'],
    ['liquid_pink', 'kultivační médium', 'label_band_red'],
  ].map(([liq, name, band], v) => one(`bottle_buffer_${pad(v + 1)}`, `Lahev s roztokem: ${name}`, [
    part('bottle_buffer', 'glass', v0.geom, 'glass_lab'),
    part(`bottle_buffer_${v}`, 'liquid', liquidGeom(v0.inner, sh * 0.8, { seg: 16 }), liq),
    part('bottle_buffer', 'cap', ribbed, 'cap_blue'),
    part('bottle_buffer', 'pour', pour, 'cap_yellow'),
    part('bottle_buffer', 'label', wrapLabel(r + 0.0004, h * 0.3, h * 0.55, 90, 8), 'label_paper'),
    part(`bottle_buffer_${v}`, 'band', wrapLabel(r + 0.0007, h * 0.47, h * 0.55, 90, 8), band),
  ], 'buffers'));
}

/** Vialky se zalisovaným hliníkovým víčkem v kartonu (4 × 4) a sklenice s krystaly. */
export function vialsAndCrystals() {
  const vial = lathe([[0, 0], [0.0058, 0, 'c'], [0.0058, 0.032], [0.0042, 0.036], [0.0042, 0.038]], { seg: 6 });
  const crimp = lathe([[0.0042, 0.0365], [0.0062, 0.0365, 'c'], [0.0062, 0.0415, 'c'], [0.003, 0.0415, 'c'], [0.003, 0.041]], { seg: 6 });
  const racks = ['liquid_amber', 'liquid_purple'].map((liq, v) => {
    const glass = [];
    const caps = [];
    const fill = [];
    for (let i = 0; i < 12; i++) {
      const x = -0.03 + (i % 4) * 0.02;
      const z = -0.02 + Math.floor(i / 4) * 0.02;
      glass.push(T(vial, x, 0.022, z));
      caps.push(T(crimp, x, 0.022, z));
      if (i % 3) fill.push(T(lathe([[0, 0.0015], [0.0052, 0.0015, 'c'], [0.0052, 0.022, 'c'], [0, 0.022]], { seg: 6 }), x, 0.022, z));
    }
    return one(`rack_vials_crimp_${pad(v + 1)}`, `Vialky se zalisovaným víčkem v kartonu ${v + 1}`, [part('rack_vials_crimp', 'carton', openBox([-0.045, 0, -0.045], [0.045, 0.03, 0.045], 0.002), 'paper_kraft'), part('rack_vials_crimp', 'insert', flatBox([-0.043, 0.02, -0.043], [0.043, 0.022, 0.043]), 'paper_kraft'), part('rack_vials_crimp', 'glass', merge(glass), 'glass_lab'), part('rack_vials_crimp', 'caps', merge(caps), 'steel_brushed'), part(`rack_vials_crimp_${v}`, 'fill', merge(fill), liq)], 'vialsAndCrystals');
  });
  const jar = vesselGeom([[0, 0], [0.045, 0, 0.004], [0.045, 0.112, 0.004], [0.04, 0.118], [0.04, 0.122]], { wall: 0.0025, seg: 18 });
  const crystalsTop = (m) => deform(liquidGeom(jar.inner, 0.07, { seg: 16, flat: true }), ([x, y, z]) => [x, y + (y > 0.06 ? 0.003 * Math.sin(x * 900) * Math.cos(z * 800) : 0), z]);
  const jars = [['powder_blue', 'modrou skalicí'], ['powder_white', 'chloridem sodným']].map(([m, name], v) => one(`jar_crystals_${pad(v + 1)}`, `Sklenice s ${name}`, [part('jar_crystals', 'glass', jar.geom, 'glass_lab'), part(`jar_crystals_${v}`, 'fill', crystalsTop(m), m), part('jar_crystals', 'cap', screwCap(0.044, 0.112, 0.016, 16, 0.04), 'plastic_anthracite'), part('jar_crystals', 'label', wrapLabel(0.0455, 0.03, 0.08, 80, 8), 'label_paper'), part('jar_crystals', 'band', wrapLabel(0.0458, 0.068, 0.08, 80, 8), 'label_band_green')], 'vialsAndCrystals'));
  return [...racks, ...jars];
}

/** Sběrná nádoba na chemický odpad 10 l s nálevkou a víčkem nálevky (halogenované a nehalogenované). */
export function wasteContainers() {
  const body = crate([-0.12, 0, -0.1], [0.12, 0.32, 0.1], 0.025, 2);
  const funnel = lathe([[0.03, 0.315], [0.035, 0.315, 'c'], [0.035, 0.335], [0.07, 0.355, 0.004], [0.072, 0.37], [0.068, 0.37], [0.066, 0.358], [0.02, 0.34]], { seg: 16 });
  const lid = lathe([[0, 0.371], [0.071, 0.371, 'c'], [0.071, 0.376, 0.002], [0, 0.378]], { seg: 16 });
  return [['label_band_orange', 'halogenovaný'], ['label_band_red', 'nehalogenovaný']].map(([band, name], v) =>
    one(`container_waste_${pad(v + 1)}`, `Nádoba na chemický odpad 10 l (${name})`, [part('container_waste', 'body', merge(body, handle(-0.1, -0.02, 0.32, 0.03, 0.009, 6)), 'plastic_hdpe'), part('container_waste', 'funnel', T(merge(funnel, lid), 0.05, 0, 0), 'plastic_white'), part('container_waste', 'label', flatBox([-0.08, 0.1, 0.1], [0.08, 0.25, 0.1012]), 'label_paper'), part(`container_waste_${v}`, 'band', flatBox([-0.08, 0.21, 0.1008], [0.08, 0.25, 0.1018]), band)], 'wasteContainers', { components: staticFloor() }),
  );
}

export const CHEM = [chemBottles, powderJars, sacksAndBoxes, solventCans, shippers, buffers, vialsAndCrystals, wasteContainers];
