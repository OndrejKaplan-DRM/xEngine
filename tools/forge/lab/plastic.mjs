// Sada kit_lab: laboratorní plasty a spotřební materiál. Rozměry podle běžných katalogových hodnot (mikrozkumavka
// 1,5 ml Ø 10 × 40 mm, zkumavka 15 ml Ø 17 × 120 mm, 50 ml Ø 30 × 115 mm, destička SBS 127,8 × 85,5 × 14,4 mm,
// Petriho miska Ø 90 × 15 mm, kryobox 133 × 133 × 50 mm); úvaha podle katalogů (Sigma-Aldrich, P-lab), neměřeno.
// Drobné zkumavky jsou kvádry: válec má 64 △, kvádr 12, a na stole o velikosti prstu rozdíl nevidět.

import { box, boxc, cyl } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, vessel, label, staticFloor } from './common.mjs';

const CAT = 'lab.plastic';
const gen = (f) => `lab/plastic.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });

/** Stojánek s mikrozkumavkami 1,5 ml (12 zkumavek ve dvou řadách); barvy stojánku. */
export function microtubeRacks() {
  const colors = ['cap_blue', 'cap_yellow', 'cap_green', 'cap_red'];
  return colors.map((c, v) => {
    const parts = [box('body', [-0.09, 0.035, -0.03], [0.09, 0.04, 0.03], c), box('body', [-0.09, 0, -0.03], [-0.085, 0.035, 0.03], c), box('body', [0.085, 0, -0.03], [0.09, 0.035, 0.03], c), box('body', [-0.09, 0, -0.03], [0.09, 0.004, 0.03], c)];
    for (let i = 0; i < 12; i++) {
      const x = -0.075 + (i % 6) * 0.03;
      const z = i < 6 ? -0.012 : 0.012;
      parts.push(boxc('body', [x, 0.03, z], [0.01, 0.04, 0.01], 'plastic_pp'), boxc('body', [x, 0.052, z], [0.012, 0.004, 0.012], (i + v) % 3 ? 'plastic_pp' : colors[(i + v) % 4]));
    }
    return one(`rack_microtube_${pad(v + 1)}`, `Stojánek s mikrozkumavkami 1,5 ml ${v + 1}`, parts, 'microtubeRacks');
  });
}

/** Stojan se zkumavkami 15 ml a 50 ml (kónické, šroubovací víčko), s náplní nebo bez. */
export function conicalRacks() {
  const out = [];
  for (const [ml, r, h, n, cols] of [[15, 0.0085, 0.12, 8, 4], [50, 0.015, 0.115, 5, 5]]) {
    for (const [v, liq] of [[1, null], [2, 'liquid_pink']]) {
      const w = cols * (r * 2 + 0.012) + 0.02;
      const parts = [box('body', [-w / 2, 0, -0.035], [w / 2, 0.006, 0.035], 'plastic_white'), box('body', [-w / 2, 0.06, -0.035], [w / 2, 0.066, 0.035], 'plastic_white'), box('body', [-w / 2, 0, -0.035], [-w / 2 + 0.006, 0.066, 0.035], 'plastic_white'), box('body', [w / 2 - 0.006, 0, -0.035], [w / 2, 0.066, 0.035], 'plastic_white')];
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + 0.016 + r + (i % cols) * (r * 2 + 0.012);
        const z = n > cols && i >= cols ? 0.016 : n > cols ? -0.016 : 0;
        parts.push(cyl('body', [x, 0.006 + h / 2, z], r, h, 'y', 'plastic_pp'));
        parts.push(ml === 15 ? boxc('body', [x, 0.006 + h + 0.006, z], [r * 2.2, 0.012, r * 2.2], 'cap_blue') : cyl('body', [x, 0.006 + h + 0.007, z], r + 0.002, 0.014, 'y', 'cap_blue'));
        if (liq && i % 2 === 0) parts.push(cyl('body', [x, 0.006 + h * 0.3, z], r - 0.0015, h * 0.5, 'y', liq));
      }
      out.push(one(`rack_conical_${ml}_${pad(v)}`, `Stojan se zkumavkami ${ml} ml${liq ? ' s médiem' : ''}`, parts, 'conicalRacks'));
    }
  }
  return out;
}

/** Krabička špiček k pipetám: 10 µl (čiré), 200 µl (žluté), 1 000 µl (modré, vyšší). */
export function tipBoxes() {
  return [
    ['10', 'plastic_ps', 0.06],
    ['200', 'cap_yellow', 0.075],
    ['1000', 'cap_blue', 0.1],
  ].map(([ul, tip, h], v) => {
    const parts = [box('body', [-0.062, 0, -0.042], [0.062, h - 0.012, 0.042], 'plastic_navy'), box('body', [-0.06, h - 0.012, -0.04], [0.06, h - 0.008, 0.04], 'plastic_light')];
    for (let i = 0; i < 8; i++) parts.push(box('body', [-0.055, h - 0.008, -0.036 + i * 0.0095], [0.055, h - 0.002, -0.031 + i * 0.0095], tip));
    parts.push(box('body', [-0.063, h, -0.043], [0.063, h + 0.03, 0.043], 'plastic_ps'));
    return one(`box_tips_${ul}_01`, `Krabička špiček ${ul} µl`, parts, 'tipBoxes');
  });
}

/** Petriho misky: jedna prázdná, jedna s agarem, štos pěti s agarem, štos sedmi s krevním agarem. */
export function petriDishes() {
  return [
    [1, null],
    [1, 'liquid_yellow'],
    [5, 'liquid_yellow'],
    [7, 'liquid_red'],
  ].map(([n, agar], v) => {
    const parts = [];
    for (let i = 0; i < n; i++) {
      const y = i * 0.0145;
      parts.push(cyl('body', [0, y + 0.007, 0], 0.045, 0.014, 'y', 'plastic_ps'));
      if (agar) parts.push(cyl('body', [0, y + 0.0035, 0], 0.043, 0.005, 'y', agar));
    }
    return one(`petri_${pad(v + 1)}`, n === 1 ? `Petriho miska${agar ? ' s agarem' : ''}` : `Štos ${n} Petriho misek s ${agar === 'liquid_red' ? 'krevním ' : ''}agarem`, parts, 'petriDishes');
  });
}

/** Mikrotitrační destička SBS s víkem: čirá, bílá, PCR (s okrajem), hluboké jamky. */
export function plates() {
  return [
    ['clear', 'plastic_ps', 0.0144],
    ['white', 'plastic_white', 0.0144],
    ['pcr', 'plastic_pp', 0.016],
    ['deep', 'plastic_pp', 0.044],
  ].map(([k, mat, h]) => {
    const parts = [box('body', [-0.0639, 0, -0.0427], [0.0639, h, 0.0427], mat)];
    for (let i = 0; i < 8; i++) parts.push(box('body', [-0.055, h, -0.034 + i * 0.009], [0.055, h + 0.0012, -0.0295 + i * 0.009], k === 'white' ? 'plastic_light' : 'plastic_anthracite'));
    if (k !== 'pcr') parts.push(box('body', [-0.064, h + 0.0012, -0.0432], [0.064, h + 0.0082, 0.0432], 'plastic_ps'));
    const title = { clear: 'Mikrotitrační destička čirá s víkem', white: 'Mikrotitrační destička bílá s víkem', pcr: 'Destička PCR s 96 jamkami', deep: 'Destička s hlubokými jamkami a víkem' }[k];
    return one(`plate_${k}_01`, title, parts, 'plates');
  });
}

/** Kryobox 133 × 133 × 50 mm: lepenkový a plastové v barvách. */
export function cryoBoxes() {
  return ['paper_kraft', 'cap_blue', 'cap_red', 'cap_yellow'].map((m, v) => {
    const parts = [box('body', [-0.0665, 0, -0.0665], [0.0665, 0.045, 0.0665], m), box('body', [-0.068, 0.04, -0.068], [0.068, 0.052, 0.068], m), box('body', [-0.03, 0.052, 0.04], [0.03, 0.0535, 0.06], 'label_paper')];
    return one(`box_cryo_${pad(v + 1)}`, `Kryobox ${['lepenkový', 'modrý', 'červený', 'žlutý'][v]}`, parts, 'cryoBoxes');
  });
}

/** Střička 250 a 500 ml s barevným víčkem a štítkem (voda, etanol, aceton, izopropanol). */
export function washBottles() {
  return [
    [250, 'cap_blue', 'label_band_blue', 'voda'],
    [500, 'cap_red', 'label_band_red', 'etanol'],
    [500, 'cap_yellow', 'label_band_orange', 'aceton'],
    [250, 'cap_green', 'label_band_green', 'izopropanol'],
  ].map(([ml, cap, band, what], v) => {
    const [r, h] = ml === 250 ? [0.033, 0.13] : [0.04, 0.165];
    const parts = [...vessel('body', [[0, r], [h - 0.03, r], [h - 0.01, r * 0.55]], 'plastic_pp', 0.6, 'liquid_water'), cyl('body', [0, h, 0], 0.017, 0.022, 'y', cap), cyl('body', [0, h + 0.03, 0], 0.003, 0.04, 'y', 'plastic_pp'), cyl('body', [0.025, h + 0.05, 0], 0.0025, 0.05, 'x', 'plastic_pp'), ...label('body', r, h * 0.3, h * 0.6, r * 1.2, band)];
    return one(`bottle_wash_${ml}_${pad(v + 1)}`, `Střička ${ml} ml (${what})`, parts, 'washBottles');
  });
}

/** Kanystr z HDPE s rukojetí a víčkem: 5, 10 a 25 l, bílý a modrý. */
export function canisters() {
  const out = [];
  for (const [l, w, d, h] of [[5, 0.19, 0.13, 0.27], [10, 0.23, 0.17, 0.33], [25, 0.29, 0.24, 0.44]]) {
    for (const [v, m] of [[1, 'plastic_hdpe'], [2, 'cap_blue']]) {
      const parts = [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], m, 0.012), box('body', [-w / 2 + 0.02, h, -0.015], [w / 2 - 0.06, h + 0.035, 0.015], m), box('body', [-w / 2 + 0.02, h, -0.012], [-w / 2 + 0.035, h + 0.035, 0.012], m), cyl('body', [w / 2 - 0.035, h + 0.012, 0], 0.022, 0.025, 'y', v === 1 ? 'cap_red' : 'plastic_white'), ...label('body', d / 2, h * 0.35, h * 0.7, w * 0.6, v === 1 ? 'label_band_orange' : null)];
      out.push(one(`canister_${l}_${pad(v)}`, `Kanystr ${l} l, ${v === 1 ? 'bílý' : 'modrý'}`, parts, 'canisters', { components: staticFloor() }));
    }
  }
  return out;
}

/** Lahve z HDPE s úzkým hrdlem 250, 500 a 1 000 ml a vzorkovnice 100 ml se šroubovacím víčkem. */
export function hdpeBottles() {
  const bottles = [[250, 0.03, 0.12, 'cap_blue'], [500, 0.037, 0.16, 'cap_red'], [1000, 0.047, 0.2, 'cap_blue'], [1000, 0.047, 0.2, 'plastic_white']].map(([ml, r, h, cap], v) => {
    const parts = [...vessel('body', [[0, r], [h - 0.035, r], [h - 0.015, 0.012], [h - 0.005, 0.012]], 'plastic_hdpe', 0, null), cyl('body', [0, h + 0.004, 0], 0.016, 0.02, 'y', cap), ...label('body', r, h * 0.25, h * 0.55, r * 1.1, null)];
    return one(`bottle_hdpe_${ml}_${pad(v + 1)}`, `Lahev z HDPE ${ml} ml`, parts, 'hdpeBottles');
  });
  const cups = ['cap_red', 'cap_blue'].map((cap, v) => one(`container_sample_${pad(v + 1)}`, `Vzorkovnice 100 ml ${v ? 'se vzorkem' : 'prázdná'}`, [...vessel('body', [[0, 0.025], [0.07, 0.029]], 'plastic_ps', v ? 0.5 : 0, 'liquid_yellow'), cyl('body', [0, 0.077, 0], 0.031, 0.014, 'y', cap), ...label('body', 0.027, 0.02, 0.05, 0.035, null)], 'hdpeBottles'));
  return [...bottles, ...cups];
}

/** Drobnosti na stůl: sáčky se zipem, nádoba na ostré předměty, kbelík s ledem, vanička na pipetování, krabice rukavic, parafilm. */
export function benchware() {
  const bags = [['powder_white', 1], ['powder_blue', 2]].map(([m, v]) => one(`bag_zip_${pad(v)}`, `Sáček se zipem ${v === 1 ? 's bílým' : 's modrým'} práškem`, [box('body', [-0.06, 0, -0.04], [0.06, 0.012, 0.04], 'plastic_ps'), box('body', [-0.05, 0.001, -0.03], [0.05, 0.01, 0.025], m), box('body', [-0.06, 0.008, 0.032], [0.06, 0.013, 0.036], 'cap_red')], 'benchware'));
  const sharps = [[1, 0.1, 0.17], [2, 0.15, 0.25]].map(([v, w, h]) => one(`bin_sharps_${pad(v)}`, `Nádoba na ostré předměty ${v === 1 ? '1,5 l' : '5 l'}`, [box('body', [-w / 2, 0, -w / 2], [w / 2, h, w / 2], 'cap_yellow'), box('body', [-w / 2 - 0.003, h, -w / 2 - 0.003], [w / 2 + 0.003, h + 0.02, w / 2 + 0.003], 'cap_red'), box('body', [-0.03, h + 0.02, -0.01], [0.03, h + 0.024, 0.02], 'plastic_anthracite')], 'benchware'));
  const ice = [[1, 'plastic_white'], [2, 'cap_blue']].map(([v, m]) => one(`bucket_ice_${pad(v)}`, `Nádoba s ledem ${v === 1 ? 'polystyrenová' : 'plastová'}`, [box('body', [-0.13, 0, -0.1], [0.13, 0.11, 0.1], m), box('body', [-0.12, 0.08, -0.09], [0.12, 0.1, 0.09], 'liquid_water'), ...[-0.06, 0, 0.06].map((x) => boxc('body', [x, 0.105, 0], [0.012, 0.02, 0.012], 'plastic_pp'))], 'benchware'));
  const reservoir = one('reservoir_pipetting_01', 'Vanička na vícekanálové pipetování', [box('body', [-0.04, 0, -0.06], [0.04, 0.025, 0.06], 'plastic_white'), box('body', [-0.035, 0.012, -0.055], [0.035, 0.022, 0.055], 'liquid_blue')], 'benchware');
  const gloves = [['plastic_navy', 'modré', 1], ['cap_purple', 'fialové', 2], ['plastic_white', 'bílé', 3]].map(([m, name, v]) => one(`box_gloves_${pad(v)}`, `Krabice nitrilových rukavic (${name})`, [box('body', [-0.12, 0, -0.06], [0.12, 0.07, 0.06], 'label_paper'), box('body', [-0.12, 0.05, -0.0605], [0.12, 0.07, 0.0605], 'label_band_blue'), box('body', [-0.04, 0.07, -0.02], [0.04, 0.085, 0.02], m)], 'benchware'));
  const parafilm = one('roll_parafilm_01', 'Parafilm v krabičce', [box('body', [-0.055, 0, -0.055], [0.055, 0.05, 0.055], 'label_paper'), cyl('body', [0, 0.05, 0], 0.045, 0.01, 'y', 'plastic_pp')], 'benchware');
  return [...bags, ...sharps, ...ice, reservoir, ...gloves, parafilm];
}

/** Vialky do HPLC (2 ml) v podložce po 4 × 8, víčka modrá nebo červená; stojánek s kryozkumavkami. */
export function vialTrays() {
  const trays = ['cap_blue', 'cap_red'].map((cap, v) => {
    const parts = [box('body', [-0.06, 0, -0.035], [0.06, 0.012, 0.035], 'plastic_white')];
    for (let i = 0; i < 32; i++) {
      const x = -0.049 + (i % 8) * 0.014;
      const z = -0.021 + Math.floor(i / 8) * 0.014;
      parts.push(boxc('body', [x, 0.012 + 0.016, z], [0.011, 0.032, 0.011], i % 5 === 3 ? 'liquid_amber' : 'glass_lab'), boxc('body', [x, 0.047, z], [0.012, 0.006, 0.012], cap));
    }
    return one(`tray_vials_hplc_${pad(v + 1)}`, `Vialky do HPLC v podložce (víčka ${v ? 'červená' : 'modrá'})`, parts, 'vialTrays');
  });
  const cryo = [box('body', [-0.07, 0, -0.035], [0.07, 0.03, 0.035], 'cap_green')];
  for (let i = 0; i < 10; i++) cryo.push(boxc('body', [-0.056 + (i % 5) * 0.028, 0.055, i < 5 ? -0.014 : 0.014], [0.012, 0.05, 0.012], 'plastic_pp'), boxc('body', [-0.056 + (i % 5) * 0.028, 0.084, i < 5 ? -0.014 : 0.014], [0.013, 0.008, 0.013], ['cap_red', 'cap_yellow', 'cap_blue', 'plastic_white', 'cap_purple'][i % 5]));
  return [...trays, one('rack_cryotube_01', 'Stojánek s kryozkumavkami', cryo, 'vialTrays')];
}

export const PLASTIC = [microtubeRacks, conicalRacks, tipBoxes, petriDishes, plates, cryoBoxes, washBottles, canisters, hdpeBottles, benchware, vialTrays];
