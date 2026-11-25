// Sada kit_lab: laboratorní plasty a spotřební materiál z hladkých sítí (B04, Ondřej 24. 11. 23:57: víc realismu).
// Rozměry podle běžných katalogových hodnot (mikrozkumavka 1,5 ml Ø 10,8 × 39 mm, zkumavka 15 ml Ø 17 × 120 mm,
// 50 ml Ø 30 × 115 mm, destička SBS 127,8 × 85,5 × 14,4 mm, Petriho miska Ø 90 × 15 mm, kryobox 133 × 133 × 50 mm,
// vialka 2 ml Ø 12 × 32 mm); úvaha podle katalogů (Sigma-Aldrich, P-lab), neměřeno. Drobné kusy mají 6 až 10 stěn
// po obvodu a hladké normály: na stole velikosti prstu je hrana schovaná a trojúhelníky zbydou na tvar.

import { simple, staticFloor } from './common.mjs';
import { P, T, merge, lathe, arc, crate, slab, tube, screwCap, solid, wrapLabel, conicalTube, conicalLiquid, handle, roundedBox } from './ware.mjs';
import { flatBox, pyramid, cylinder, sphere, openBox } from '../mesh/solids.mjs';
import { liquidGeom } from './glassware.mjs';

const CAT = 'lab.plastic';
const gen = (f) => `lab/plastic.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const part = P('plastic');

/** Mikrozkumavka 1,5 ml se zaklapnutým víčkem a páskem závěsu, dno ve výšce 0. */
function microtube(cap = false) {
  const body = lathe([[0.0008, 0], [0.0046, 0.017, 'c'], [0.0052, 0.037], [0.0058, 0.038]], { seg: 6 });
  const lid = lathe([[0.0046, 0.038], [0.0059, 0.038, 'c'], [0.0059, 0.0425, 'c'], [0, 0.0425]], { seg: 6, phase: 30 });
  const hinge = flatBox([-0.0015, 0.036, 0.0055], [0.0015, 0.0425, 0.0068]);
  return { body, lid: merge(lid, hinge), cap };
}

/** Stojánek s osmi mikrozkumavkami 1,5 ml ve dvou řadách; barva stojánku a víček. */
export function microtubeRacks() {
  const colors = ['cap_blue', 'cap_yellow', 'cap_green', 'cap_red'];
  const frame = merge(slab(0, 0, 0.18, 0.062, 0.031, 0.035, 0.004, 2), slab(0, 0, 0.18, 0.062, 0, 0.003, 0.004, 2), flatBox([-0.09, 0, -0.031], [-0.086, 0.035, 0.031]), flatBox([0.086, 0, -0.031], [0.09, 0.035, 0.031]));
  return colors.map((c, v) => {
    const bodies = [];
    const lidsA = [];
    const lidsB = [];
    for (let i = 0; i < 8; i++) {
      const x = -0.06 + (i % 4) * 0.04 + (v % 2) * 0.01;
      const z = i < 4 ? -0.013 : 0.013;
      const t = microtube();
      bodies.push(T(t.body, x, 0.003, z));
      ((i + v) % 3 ? lidsA : lidsB).push(T(t.lid, x, 0.003, z));
    }
    const parts = [part('rack_microtube', `frame_${v}`, frame, c), part('rack_microtube', `tubes_${v}`, merge(bodies), 'plastic_pp_thin'), part('rack_microtube', `lidsA_${v}`, merge(lidsA), 'plastic_pp'), ...(lidsB.length ? [part('rack_microtube', `lidsB_${v}`, merge(lidsB), colors[(v + 2) % 4])] : [])];
    return one(`rack_microtube_${pad(v + 1)}`, `Stojánek s mikrozkumavkami 1,5 ml ${v + 1}`, parts, 'microtubeRacks');
  });
}

/** Stojan se zkumavkami 15 ml (6) a 50 ml (4): kuželové dno, šroubovací víčko s vroubky, s náplní nebo bez. */
export function conicalRacks() {
  const out = [];
  for (const [ml, r, h, tip, n, seg] of [[15, 0.0085, 0.12, 0.022, 6, 8], [50, 0.015, 0.115, 0.02, 4, 10]]) {
    const w = n * (r * 2 + 0.012) + 0.02;
    const frame = merge(slab(0, 0, w, 0.07, 0, 0.005, 0.006, 2), slab(0, 0, w, 0.07, 0.06, 0.066, 0.006, 2), flatBox([-w / 2, 0, -0.035], [-w / 2 + 0.005, 0.066, 0.035]), flatBox([w / 2 - 0.005, 0, -0.035], [w / 2, 0.066, 0.035]));
    for (const [v, liq] of [[1, null], [2, 'liquid_pink']]) {
      const tubes = [];
      const caps = [];
      const fill = [];
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + 0.016 + r + i * (r * 2 + 0.012);
        tubes.push(T(conicalTube(r, h, tip, seg), x, 0.005, 0));
        caps.push(T(screwCap(r + 0.0015, h - 0.008, 0.013, seg / 2, r * 0.9), x, 0.005, 0));
        if (liq && i % 2 === 0) fill.push(T(conicalLiquid(r, h * 0.55, tip, seg), x, 0.005, 0));
      }
      const parts = [part(`rack_conical_${ml}`, 'frame', frame, 'plastic_white'), part(`rack_conical_${ml}`, 'tubes', merge(tubes), 'plastic_pp_thin'), part(`rack_conical_${ml}`, 'caps', merge(caps), ml === 15 ? 'cap_blue' : 'cap_yellow')];
      if (fill.length) parts.push(part(`rack_conical_${ml}`, 'medium', merge(fill), liq));
      out.push(one(`rack_conical_${ml}_${pad(v)}`, `Stojan se zkumavkami ${ml} ml${liq ? ' s médiem' : ''}`, parts, 'conicalRacks'));
    }
  }
  return out;
}

/** Krabička špiček k pipetám 10, 200 a 1 000 µl: tmavá krabička, vložka, víko z čirého plastu, špičky v pěti řadách. */
export function tipBoxes() {
  return [
    ['10', 'plastic_ps', 0.06, 0.03],
    ['200', 'cap_yellow', 0.075, 0.05],
    ['1000', 'cap_blue', 0.1, 0.07],
  ].map(([ul, tip, h, len]) => {
    const tips = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 8; j++) tips.push(T(pyramid(0.0034, 0.0022, -len * 0.3, 0.004, 4, 45 + i * 7), -0.05 + i * 0.009, h - 0.004, -0.031 + j * 0.009));
    const parts = [
      part(`box_tips_${ul}`, 'body', crate([-0.062, 0, -0.042], [0.062, h - 0.012, 0.042], 0.004, 1), 'plastic_navy'),
      part(`box_tips_${ul}`, 'rack', slab(0, 0, 0.12, 0.08, h - 0.012, h - 0.008, 0.003, 1), 'plastic_light'),
      part(`box_tips_${ul}`, 'tips', merge(tips), tip),
      part(`box_tips_${ul}`, 'lid', crate([-0.063, h, -0.043], [0.063, h + 0.028, 0.043], 0.004, 1), 'plastic_ps'),
    ];
    return one(`box_tips_${ul}_01`, `Krabička špiček ${ul} µl`, parts, 'tipBoxes');
  });
}

/** Petriho miska Ø 90 mm z tenkého polystyrenu: miska a víko jednou plochou, agar jako kotouč. */
function petri(y, agar) {
  const dish = lathe([[0, y], [0.0435, y, 'c'], [0.0435, y + 0.0125], [0.0442, y + 0.013]], { seg: 14 });
  const lid = lathe([[0, y + 0.0142], [0.0452, y + 0.0142, 'c'], [0.0452, y + 0.004]], { seg: 14 });
  return { glass: merge(dish, lid), agar: agar ? lathe([[0, y + 0.0008], [0.0425, y + 0.0008, 'c'], [0.0425, y + 0.0055, 'c'], [0, y + 0.0055]], { seg: 14 }) : null };
}
export function petriDishes() {
  return [
    [1, null],
    [1, 'liquid_yellow'],
    [5, 'liquid_yellow'],
    [7, 'liquid_red'],
  ].map(([n, agar], v) => {
    const ps = [];
    const ag = [];
    for (let i = 0; i < n; i++) {
      const d = petri(i * 0.0145, agar);
      ps.push(d.glass);
      if (d.agar) ag.push(d.agar);
    }
    const parts = [part(`petri_${pad(v + 1)}`, 'dish', merge(ps), 'plastic_ps_thin'), ...(ag.length ? [part(`petri_${pad(v + 1)}`, 'agar', merge(ag), agar)] : [])];
    return one(`petri_${pad(v + 1)}`, n === 1 ? `Petriho miska${agar ? ' s agarem' : ''}` : `Štos ${n} Petriho misek s ${agar === 'liquid_red' ? 'krevním ' : ''}agarem`, parts, 'petriDishes');
  });
}

/** Mikrotitrační destička SBS (127,8 × 85,5 mm) s mřížkou jamek 12 × 8, okrajem a víkem. */
export function plates() {
  return [
    ['clear', 'plastic_ps', 0.0144],
    ['white', 'plastic_white', 0.0144],
    ['pcr', 'plastic_pp', 0.016],
    ['deep', 'plastic_pp', 0.044],
  ].map(([k, mat, h]) => {
    const grid = [];
    for (let i = 0; i <= 12; i++) grid.push(flatBox([-0.0545 + i * 0.009 - 0.0006, h - 0.0006, -0.037], [-0.0545 + i * 0.009 + 0.0006, h + 0.0006, 0.037]));
    for (let j = 0; j <= 8; j++) grid.push(flatBox([-0.0545, h - 0.0006, -0.036 + j * 0.009 - 0.0006], [0.0545, h + 0.0006, -0.036 + j * 0.009 + 0.0006]));
    const parts = [
      part(`plate_${k}`, 'body', merge(crate([-0.0639, 0, -0.0427], [0.0639, 0.0025, 0.0427], 0.002, 1), crate([-0.0615, 0.0025, -0.0405], [0.0615, h, 0.0405], 0.003, 1)), mat),
      part(`plate_${k}`, 'grid', merge(grid), k === 'white' ? 'plastic_light' : 'plastic_anthracite'),
    ];
    if (k !== 'pcr') parts.push(part(`plate_${k}`, 'lid', crate([-0.064, h + 0.0012, -0.0432], [0.064, h + 0.0082, 0.0432], 0.003, 1), 'plastic_ps'));
    const title = { clear: 'Mikrotitrační destička čirá s víkem', white: 'Mikrotitrační destička bílá s víkem', pcr: 'Destička PCR s 96 jamkami', deep: 'Destička s hlubokými jamkami a víkem' }[k];
    return one(`plate_${k}_01`, title, parts, 'plates');
  });
}

/** Kryobox 133 × 133 × 50 mm: lepenkový a plastové v barvách, víko přes okraj, štítek. */
export function cryoBoxes() {
  return ['paper_kraft', 'cap_blue', 'cap_red', 'cap_yellow'].map((m, v) => {
    const parts = [
      part(`box_cryo_${pad(v + 1)}`, 'body', merge(crate([-0.0665, 0, -0.0665], [0.0665, 0.042, 0.0665], v ? 0.006 : 0.002, 1), crate([-0.068, 0.036, -0.068], [0.068, 0.052, 0.068], v ? 0.006 : 0.002, 1)), m),
      part('box_cryo', 'label', flatBox([-0.03, 0.052, 0.035], [0.03, 0.0526, 0.06]), 'label_paper'),
    ];
    return one(`box_cryo_${pad(v + 1)}`, `Kryobox ${['lepenkový', 'modrý', 'červený', 'žlutý'][v]}`, parts, 'cryoBoxes');
  });
}

/** Střička z LDPE 250 a 500 ml: měkká láhev se zaobleným ramenem, víčko, zahnutá trubička, štítek s pruhem. */
export function washBottles() {
  return [
    [250, 'cap_blue', 'label_band_blue', 'voda'],
    [500, 'cap_red', 'label_band_red', 'etanol'],
    [500, 'cap_yellow', 'label_band_orange', 'aceton'],
    [250, 'cap_green', 'label_band_green', 'izopropanol'],
  ].map(([ml, cap, band, what], v) => {
    const [r, h] = ml === 250 ? [0.033, 0.13] : [0.04, 0.165];
    const body = solid([[0, 0], [r * 0.95, 0, 'c'], [r, 0.006], [r, h - 0.03, r * 0.4], [0.012, h - 0.008], [0.012, h - 0.002], [0, h - 0.002]], 12);
    const capG = screwCap(0.017, h - 0.012, 0.024, 8, 0.012);
    const spout = tube([[0, h + 0.01, 0], [0, h + 0.045, 0], [0.03, h + 0.055, 0], [0.055, h + 0.035, 0]], 0.0024, 6, { bend: 0.012, bendSeg: 3 });
    const key = `bottle_wash_${ml}`;
    const parts = [
      part(key, 'body', body, 'plastic_pp'),
      part(`${key}_${v}`, 'liquid', liquidGeom([[0, 0.002], [r * 0.93, 0.004], [r * 0.95, h * 0.6]], h * 0.55, { seg: 10, flat: true }), 'liquid_water'),
      part(key, 'cap', capG, cap),
      part(key, 'spout', spout, 'plastic_pp'),
      part(key, 'label', wrapLabel(r + 0.0004, h * 0.28, h * 0.58, 100), 'label_paper'),
      part(`${key}_${v}`, 'band', wrapLabel(r + 0.0007, h * 0.5, h * 0.58, 100), band),
    ];
    return one(`bottle_wash_${ml}_${pad(v + 1)}`, `Střička ${ml} ml (${what})`, parts, 'washBottles');
  });
}

/** Kanystr z HDPE 5, 10 a 25 l: zaoblené tělo, prolis, rukojeť přes horní hranu, hrdlo s víčkem; bílý a modrý. */
export function canisters() {
  const out = [];
  for (const [l, w, d, h] of [[5, 0.19, 0.13, 0.27], [10, 0.23, 0.17, 0.33], [25, 0.29, 0.24, 0.44]]) {
    for (const [v, m] of [[1, 'plastic_hdpe'], [2, 'cap_blue']]) {
      const key = `canister_${l}_${pad(v)}`;
      const body = merge(crate([-w / 2, 0, -d / 2], [w / 2, h, d / 2], 0.022, 2), crate([-w / 2 + 0.015, h * 0.12, d / 2 - 0.004], [w / 2 - 0.015, h * 0.75, d / 2 + 0.002], 0.01, 1));
      const grip = handle(-w / 2 + 0.03, w / 2 - 0.08, h, 0.04, 0.011, 6);
      const neck = merge(cylinder(0.02, h - 0.005, h + 0.018, { seg: 12 }));
      const capG = screwCap(0.026, h + 0.012, 0.024, 7, 0.02);
      const parts = [part(key, 'body', merge(body, grip, T(neck, w / 2 - 0.04, 0, 0)), m), part(key, 'cap', T(capG, w / 2 - 0.04, 0, 0), v === 1 ? 'cap_red' : 'plastic_white'), part(key, 'label', flatBox([-w * 0.3, h * 0.3, d / 2 + 0.0015], [w * 0.3, h * 0.65, d / 2 + 0.0025]), 'label_paper')];
      if (v === 1) parts.push(part(key, 'band', flatBox([-w * 0.3, h * 0.57, d / 2 + 0.0024], [w * 0.3, h * 0.65, d / 2 + 0.0032]), 'label_band_orange'));
      out.push(one(key, `Kanystr ${l} l, ${v === 1 ? 'bílý' : 'modrý'}`, parts, 'canisters', { components: staticFloor() }));
    }
  }
  return out;
}

/** Lahve z HDPE s úzkým hrdlem 250, 500 a 1 000 ml (rameno, závit, víčko s vroubky) a vzorkovnice 100 ml. */
export function hdpeBottles() {
  const bottles = [[250, 0.03, 0.12, 'cap_blue'], [500, 0.037, 0.16, 'cap_red'], [1000, 0.047, 0.2, 'cap_blue'], [1000, 0.047, 0.2, 'plastic_white']].map(([ml, r, h, cap], v) => {
    const key = `bottle_hdpe_${ml}`;
    const body = solid([[0, 0.002], [r * 0.9, 0, 'c'], [r, 0.01], [r, h - 0.04, r * 0.5], [0.014, h - 0.016, 0.004], [0.014, h - 0.004], [0, h - 0.004]], 14);
    return one(`bottle_hdpe_${ml}_${pad(v + 1)}`, `Lahev z HDPE ${ml} ml`, [part(key, 'body', body, 'plastic_hdpe'), part(`${key}_${v}`, 'cap', screwCap(0.0175, h - 0.014, 0.02, 10, 0.014), cap), part(key, 'label', wrapLabel(r + 0.0004, h * 0.22, h * 0.55, 110), 'label_paper')], 'hdpeBottles');
  });
  const cups = ['cap_red', 'cap_blue'].map((cap, v) => {
    const cup = lathe([[0, 0], [0.0255, 0, 'c'], [0.029, 0.066], [0.0295, 0.068]], { seg: 14 });
    const parts = [part('container_sample', 'cup', cup, 'plastic_ps_thin'), part(`container_sample_${v}`, 'cap', screwCap(0.0315, 0.064, 0.013, 12, 0.028), cap), part('container_sample', 'label', wrapLabel(0.0275, 0.018, 0.045, 80), 'label_paper')];
    if (v) parts.push(part('container_sample', 'sample', liquidGeom([[0, 0.0008], [0.0248, 0.0008], [0.027, 0.06]], 0.034, { seg: 12 }), 'liquid_yellow'));
    return one(`container_sample_${pad(v + 1)}`, `Vzorkovnice 100 ml ${v ? 'se vzorkem' : 'prázdná'}`, parts, 'hdpeBottles');
  });
  return [...bottles, ...cups];
}

/** Drobnosti na stůl: sáčky se zipem, nádoby na ostré předměty, nádoby s ledem, vanička, rukavice, parafilm. */
export function benchware() {
  const bags = [['powder_white', 1], ['powder_blue', 2]].map(([m, v]) => one(`bag_zip_${pad(v)}`, `Sáček se zipem ${v === 1 ? 's bílým' : 's modrým'} práškem`, [part('bag_zip', 'bag', roundedBox([-0.06, 0, -0.04], [0.06, 0.012, 0.04], 0.005, 1), 'plastic_ps'), part(`bag_zip_${v}`, 'powder', roundedBox([-0.048, 0.0015, -0.03], [0.048, 0.0105, 0.026], 0.004, 1), m), part('bag_zip', 'zip', flatBox([-0.06, 0.006, 0.031], [0.06, 0.0125, 0.035]), 'cap_red')], 'benchware'));
  const sharps = [[1, 0.1, 0.17], [2, 0.15, 0.25]].map(([v, w, h]) => one(`bin_sharps_${pad(v)}`, `Nádoba na ostré předměty ${v === 1 ? '1,5 l' : '5 l'}`, [
    part(`bin_sharps_${v}`, 'body', solid([[0, 0], [w * 0.42, 0, 'c'], [w * 0.5, h, 'c'], [0, h]], 16), 'cap_yellow'),
    part(`bin_sharps_${v}`, 'lid', merge(lathe([[w * 0.49, h - 0.004], [w * 0.53, h - 0.004, 'c'], [w * 0.53, h + 0.016, 0.003], [0, h + 0.02]], { seg: 16 })), 'cap_red'),
    part(`bin_sharps_${v}`, 'slot', flatBox([-w * 0.3, h + 0.02, -0.012], [w * 0.1, h + 0.0215, 0.012]), 'plastic_anthracite'),
  ], 'benchware'));
  const ice = [[1, 'plastic_white'], [2, 'cap_blue']].map(([v, m]) => {
    const cubes = [];
    for (let i = 0; i < 9; i++) cubes.push(flatBox([-0.1 + (i % 5) * 0.045, 0.094, -0.07 + Math.floor(i / 5) * 0.08 + (i % 2) * 0.02], [-0.085 + (i % 5) * 0.045, 0.108 - (i % 3) * 0.003, -0.055 + Math.floor(i / 5) * 0.08 + (i % 2) * 0.02]));
    const tubes = [-0.05, 0.01, 0.06].map((x) => T(microtube().body, x, 0.075, 0.01));
    return one(`bucket_ice_${pad(v)}`, `Nádoba s ledem ${v === 1 ? 'polystyrenová' : 'plastová'}`, [part(`bucket_ice_${v}`, 'body', openBox([-0.13, 0, -0.1], [0.13, 0.11, 0.1], v === 1 ? 0.02 : 0.006), m), part('bucket_ice', 'water', flatBox([-0.118, 0.07, -0.088], [0.118, 0.095, 0.088]), 'liquid_water'), part('bucket_ice', 'cubes', merge(cubes), 'plastic_ps'), part('bucket_ice', 'tubes', merge(tubes), 'plastic_pp_thin')], 'benchware');
  });
  const reservoir = one('reservoir_pipetting_01', 'Vanička na vícekanálové pipetování', [part('reservoir', 'tray', openBox([-0.04, 0, -0.062], [0.04, 0.026, 0.062], 0.002), 'plastic_white'), part('reservoir', 'liquid', flatBox([-0.038, 0.002, -0.06], [0.038, 0.014, 0.06]), 'liquid_blue')], 'benchware');
  const gloves = [['plastic_navy', 'modré', 1], ['cap_purple', 'fialové', 2], ['plastic_white', 'bílé', 3]].map(([m, name, v]) => one(`box_gloves_${pad(v)}`, `Krabice nitrilových rukavic (${name})`, [
    part('box_gloves', 'box', crate([-0.12, 0, -0.06], [0.12, 0.07, 0.06], 0.003, 1), 'label_paper'),
    part('box_gloves', 'band', flatBox([-0.1205, 0.05, -0.0605], [0.1205, 0.07, 0.0605]), 'label_band_blue'),
    part('box_gloves', 'slot', flatBox([-0.05, 0.07, -0.025], [0.05, 0.0705, 0.025]), 'plastic_anthracite'),
    part(`box_gloves_${v}`, 'glove', T(sphere(0.022, 0, { n: 4, seg: 8 }), 0, 0.072, 0), m),
  ], 'benchware'));
  const parafilm = one('roll_parafilm_01', 'Parafilm v krabičce', [part('parafilm', 'box', crate([-0.055, 0, -0.055], [0.055, 0.05, 0.055], 0.002, 1), 'label_paper'), part('parafilm', 'roll', lathe([[0.012, 0.05], [0.045, 0.05, 'c'], [0.045, 0.06, 'c'], [0.012, 0.06]], { seg: 16 }), 'plastic_pp')], 'benchware');
  return [...bags, ...sharps, ...ice, reservoir, ...gloves, parafilm];
}

/** Vialky do HPLC 2 ml (sklo, víčko se septem) v podložce 3 × 6; stojánek s kryozkumavkami. */
export function vialTrays() {
  const vial = lathe([[0, 0], [0.0058, 0, 'c'], [0.0058, 0.027], [0.0042, 0.03], [0.0042, 0.032]], { seg: 6 });
  // víčko a náplň malé vialky jen bokem a vrškem (vialek je v podložce 12; dno a septum z 1 m nikdo nevidí)
  const vcap = lathe([[0.0062, 0.031], [0.0062, 0.037, 'c'], [0, 0.037]], { seg: 6 });
  const trays = ['cap_blue', 'cap_red'].map((cap, v) => {
    const glass = [];
    const caps = [];
    const fill = [];
    for (let i = 0; i < 12; i++) {
      const x = -0.045 + (i % 6) * 0.018;
      const z = -0.009 + Math.floor(i / 6) * 0.018;
      glass.push(T(vial, x, 0.008, z));
      caps.push(T(vcap, x, 0.008, z));
      if (i % 3 !== 1) fill.push(T(lathe([[0.0052, 0.009], [0.0052, 0.02 + (i % 4) * 0.002, 'c'], [0, 0.02 + (i % 4) * 0.002]], { seg: 6 }), x, 0, z));
    }
    return one(`tray_vials_hplc_${pad(v + 1)}`, `Vialky do HPLC v podložce (víčka ${v ? 'červená' : 'modrá'})`, [part('tray_vials', 'tray', crate([-0.06, 0, -0.033], [0.06, 0.012, 0.033], 0.003, 1), 'plastic_white'), part('tray_vials', 'glass', merge(glass), 'glass_lab'), part(`tray_vials_${v}`, 'caps', merge(caps), cap), part(`tray_vials_${v}`, 'fill', merge(fill), v ? 'liquid_amber' : 'liquid_water')], 'vialTrays');
  });
  const cryoTube = lathe([[0, 0], [0.0055, 0.002, 'c'], [0.0055, 0.045]], { seg: 8 });
  const tubes = [];
  const caps = {};
  for (let i = 0; i < 10; i++) {
    const x = -0.056 + (i % 5) * 0.028;
    const z = i < 5 ? -0.014 : 0.014;
    tubes.push(T(cryoTube, x, 0.03, z));
    const m = ['cap_red', 'cap_yellow', 'cap_blue', 'plastic_white', 'cap_purple'][i % 5];
    (caps[m] = caps[m] || []).push(T(screwCap(0.0065, 0.074, 0.011, 4, 0.005), x, 0, z));
  }
  const rack = one('rack_cryotube_01', 'Stojánek s kryozkumavkami', [part('rack_cryotube', 'rack', crate([-0.07, 0, -0.035], [0.07, 0.03, 0.035], 0.004, 1), 'cap_green'), part('rack_cryotube', 'tubes', merge(tubes), 'plastic_pp'), ...Object.entries(caps).map(([m, list]) => part('rack_cryotube', m, merge(list), m))], 'vialTrays');
  return [...trays, rack];
}

export const PLASTIC = [microtubeRacks, conicalRacks, tipBoxes, petriDishes, plates, cryoBoxes, washBottles, canisters, hdpeBottles, benchware, vialTrays];
