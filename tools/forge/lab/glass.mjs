// Sada kit_lab: laboratorní sklo. Rozměry podle obvyklých norem tvarů (kádinka nízká, Erlenmeyerova baňka úzkohrdlá,
// odměrný válec vysoký, odměrná baňka, varná baňka s kulatým dnem, reagenční lahev se závitem GL 45). Rozměry jsou
// úvaha podle katalogů prodejců laboratorního skla (P-lab, Sigma-Aldrich), neměřeno. Varianta _01 je prázdná,
// další jsou s kapalinou nebo ze hnědého skla.

import { box, cyl } from '../lib.mjs';
import { simple, vessel, rim, mark, label } from './common.mjs';

const G = 'glass_lab';
const CAT = 'lab.glass';
const gen = (f) => `lab/glass.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const LIQ = ['liquid_blue', 'liquid_amber', 'liquid_water', 'liquid_green', 'liquid_red', 'liquid_purple'];

/** Kádinka nízká: objem mL → [průměr, výška] v mm. */
const BEAKERS = { 50: [42, 60], 100: [50, 70], 250: [70, 95], 600: [90, 125], 1000: [105, 145], 2000: [130, 185] };
export function beakers() {
  return Object.entries(BEAKERS).flatMap(([ml, [d, h]], k) => {
    const r = d / 2000;
    const H = h / 1000;
    const marks = [0.3, 0.5, 0.7].map((f) => mark('body', r, H * f));
    return [0, 1].map((v) => {
      const parts = [...vessel('body', [[0, r], [H, r]], G, v ? 0.55 : 0, LIQ[k % LIQ.length]), rim('body', H, r), ...marks];
      return simple(`beaker_${ml}_${pad(v + 1)}`, `Kádinka ${ml} ml${v ? ' s roztokem' : ''}`, CAT, parts, { gen: gen('beakers') });
    });
  });
}

/** Erlenmeyerova baňka úzkohrdlá: mL → [průměr dna, výška, průměr hrdla] v mm. */
const ERLEN = { 100: [64, 105, 22], 250: [85, 145, 34], 500: [105, 180, 34], 1000: [131, 220, 42] };
export function erlenmeyers() {
  return Object.entries(ERLEN).flatMap(([ml, [d, h, n]], k) => {
    const [R, H, rn] = [d / 2000, h / 1000, n / 2000];
    const prof = [[0, R], [H * 0.12, R], [H * 0.35, R * 0.82], [H * 0.55, R * 0.58], [H * 0.72, rn * 1.25], [H * 0.78, rn], [H, rn]];
    return [0, 1].map((v) => {
      const parts = [...vessel('body', prof, G, v ? 0.3 : 0, LIQ[(k + 2) % LIQ.length]), rim('body', H, rn), mark('body', R * 0.9, H * 0.15), mark('body', R * 0.75, H * 0.28)];
      return simple(`flask_erlen_${ml}_${pad(v + 1)}`, `Erlenmeyerova baňka ${ml} ml${v ? ' s roztokem' : ''}`, CAT, parts, { gen: gen('erlenmeyers') });
    });
  });
}

/** Odměrný válec: mL → [průměr, výška trubice] v mm; šestiboká noha je tu nízký válec. */
const CYLS = { 10: [13, 140], 100: [28, 250], 500: [52, 390], 1000: [65, 460] };
export function measuringCylinders() {
  return Object.entries(CYLS).flatMap(([ml, [d, h]], k) => {
    const r = d / 2000;
    const H = h / 1000;
    const foot = Math.max(0.022, r * 1.9);
    const base = cyl('body', [0, 0.005, 0], foot, 0.01, 'y', 'plastic_pp');
    const marks = [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => mark('body', r, 0.01 + H * f, 0.006));
    return [0, 1].map((v) => {
      const tube = vessel('body', [[0.01, r], [0.01 + H, r]], G, 0, null);
      const liq = v ? [cyl('body', [0, 0.012 + H * 0.3, 0], r - 0.0015, H * 0.6 - 0.004, 'y', LIQ[(k + 1) % LIQ.length])] : [];
      const parts = [base, ...tube, ...liq, rim('body', 0.01 + H, r), box('body', [-0.004, 0.01 + H - 0.004, r - 0.001], [0.004, 0.01 + H, r + 0.006], G), ...marks];
      return simple(`cylinder_grad_${ml}_${pad(v + 1)}`, `Odměrný válec ${ml} ml${v ? ' s kapalinou' : ''}`, CAT, parts, { gen: gen('measuringCylinders') });
    });
  });
}

/** Odměrná baňka: mL → [průměr baňky, celková výška, průměr hrdla] v mm, se zátkou. */
const VOLUMETRIC = { 50: [50, 140, 12], 100: [60, 170, 14], 250: [80, 220, 16], 1000: [120, 310, 20] };
export function volumetricFlasks() {
  return Object.entries(VOLUMETRIC).flatMap(([ml, [d, h, n]], k) => {
    const [R, H, rn] = [d / 2000, h / 1000, n / 2000];
    const bulb = R * 2;
    const prof = [[0, R * 0.75], [bulb * 0.15, R], [bulb * 0.55, R], [bulb * 0.85, R * 0.6], [bulb, rn * 1.3], [bulb + 0.01, rn], [H - 0.018, rn]];
    const stopper = [cyl('body', [0, H - 0.012, 0], rn * 1.05, 0.016, 'y', k % 2 ? 'cap_yellow' : 'cap_blue'), cyl('body', [0, H - 0.002, 0], rn * 1.6, 0.004, 'y', k % 2 ? 'cap_yellow' : 'cap_blue')];
    return [0, 1].map((v) => {
      const parts = [...vessel('body', prof, G, v ? 0.55 : 0, LIQ[(k + 3) % LIQ.length]), ...stopper, mark('body', rn, bulb + (H - bulb) * 0.45, 0.012)];
      return simple(`flask_vol_${ml}_${pad(v + 1)}`, `Odměrná baňka ${ml} ml${v ? ' doplněná po rysku' : ''}`, CAT, parts, { gen: gen('volumetricFlasks') });
    });
  });
}

/** Varná baňka s kulatým dnem na korkovém kroužku: mL → [průměr baňky, délka hrdla, průměr hrdla] v mm. */
const ROUND = { 100: [64, 60, 26], 250: [85, 70, 30], 500: [105, 80, 30], 1000: [131, 90, 34] };
export function roundFlasks() {
  return Object.entries(ROUND).flatMap(([ml, [d, l, n]], k) => {
    const [R, L, rn] = [d / 2000, l / 1000, n / 2000];
    const y0 = 0.012;
    const s = [0, 0.13, 0.5, 0.87, 1].map((t) => [y0 + 2 * R * t, Math.max(rn, R * Math.sin(Math.PI * Math.min(Math.max(t, 0.04), 0.96)))]);
    const prof = [...s.slice(0, 4), [y0 + 2 * R * 0.95, rn], [y0 + 2 * R + L, rn]];
    const cork = cyl('body', [0, 0.008, 0], R * 0.7, 0.016, 'y', 'wood_oak');
    return [0, 1].map((v) => {
      const parts = [cork, ...vessel('body', prof, G, v ? 0.35 : 0, LIQ[(k + 4) % LIQ.length]), rim('body', y0 + 2 * R + L, rn)];
      return simple(`flask_round_${ml}_${pad(v + 1)}`, `Varná baňka ${ml} ml na korkovém kroužku${v ? ', s náplní' : ''}`, CAT, parts, { gen: gen('roundFlasks') });
    });
  });
}

/** Reagenční lahev se závitem GL 45: mL → [průměr, výška] v mm; varianty čirá prázdná, čirá s vodou a štítkem, hnědá. */
const BOTTLES = { 100: [56, 100], 250: [70, 143], 500: [86, 181], 1000: [101, 230], 2000: [136, 265] };
export function reagentBottles() {
  const bands = ['label_band_blue', 'label_band_red', 'label_band_green', 'label_band_orange', 'label_band_blue'];
  return Object.entries(BOTTLES).flatMap(([ml, [d, h]], k) => {
    const [R, H] = [d / 2000, h / 1000];
    const neckR = Math.min(0.0225, R * 0.8);
    const shoulder = H - 0.03;
    const body = [[0, R * 0.96], [0.006, R], [shoulder - R * 0.35, R], [shoulder, R * 0.62], [shoulder + 0.006, neckR], [H - 0.012, neckR]];
    const cap = [cyl('body', [0, H - 0.008, 0], neckR + 0.004, 0.022, 'y', 'cap_blue'), cyl('body', [0, H - 0.019, 0], neckR + 0.006, 0.004, 'y', 'cap_yellow')];
    return [
      ['01', G, 0, null, false],
      ['02', G, 0.6, 'liquid_water', true],
      ['03', 'glass_amber', 0.7, 'liquid_amber', true],
    ].map(([v, glass, fill, liq, lab]) => {
      const parts = [...vessel('body', body, glass, fill, liq), ...cap, ...(lab ? label('body', R, H * 0.3, H * 0.6, R * 1.1, bands[k]) : [mark('body', R, H * 0.4), mark('body', R, H * 0.55)])];
      return simple(`bottle_gl45_${ml}_${v}`, `Reagenční lahev ${ml} ml${glass === G ? '' : ', hnědé sklo'}${lab ? ', se štítkem' : ''}`, CAT, parts, { gen: gen('reagentBottles') });
    });
  });
}

/** Skleněné zkumavky ve stojanu z drátu: šest zkumavek Ø 16 × 160 mm, různě naplněné. */
export function testTubeRacks() {
  const fills = [['liquid_blue', 'liquid_red', 'liquid_green'], ['liquid_amber', 'liquid_yellow', 'liquid_purple'], ['liquid_pink', 'liquid_water', 'liquid_pink']];
  return fills.map((col, v) => {
    const parts = [
      box('body', [-0.09, 0, -0.03], [0.09, 0.004, 0.03], 'steel_brushed'),
      box('body', [-0.09, 0.1, -0.03], [0.09, 0.104, 0.03], 'steel_brushed'),
      ...[-0.09, 0.086].flatMap((x) => [box('body', [x, 0, -0.03], [x + 0.004, 0.104, -0.026], 'steel_brushed'), box('body', [x, 0, 0.026], [x + 0.004, 0.104, 0.03], 'steel_brushed')]),
    ];
    for (let i = 0; i < 6; i++) {
      const x = -0.075 + i * 0.03;
      parts.push(cyl('body', [x, 0.084, 0], 0.008, 0.16, 'y', G));
      if (i % 2 === 0 || v === 1) parts.push(cyl('body', [x, 0.004 + 0.03 + (i % 3) * 0.01, 0], 0.0065, 0.06 + (i % 3) * 0.02, 'y', col[i % 3]));
    }
    return simple(`rack_testtube_${pad(v + 1)}`, `Stojan se skleněnými zkumavkami ${v + 1}`, CAT, parts, { gen: gen('testTubeRacks') });
  });
}

/** Laboratorní stojan s deskou, tyčí a svorkami: s byretou, s dělicí nálevkou, s destilační aparaturou. */
export function standSetups() {
  const stand = (h) => [box('body', [-0.1, 0, -0.08], [0.1, 0.012, 0.08], 'steel_painted'), cyl('body', [-0.06, 0.012 + h / 2, -0.05], 0.006, h, 'y', 'steel_brushed')];
  const clamp = (y, len) => [box('body', [-0.07, y - 0.01, -0.058], [-0.05, y + 0.01, -0.042], 'steel_dark'), box('body', [-0.05, y - 0.003, -0.053], [-0.05 + len, y + 0.003, -0.047], 'steel_brushed')];
  const burette = [...stand(0.7), ...clamp(0.55, 0.06), cyl('body', [0.01, 0.45, -0.05], 0.006, 0.5, 'y', G), cyl('body', [0.01, 0.3, -0.05], 0.0045, 0.28, 'y', 'liquid_purple'), box('body', [0.0, 0.19, -0.056], [0.02, 0.2, -0.044], 'cap_blue'), cyl('body', [0.01, 0.185, -0.05], 0.0015, 0.02, 'y', G)];
  burette.push(...vessel('body', [[0.012, 0.042], [0.04, 0.035], [0.07, 0.016], [0.09, 0.014]].map(([y, r]) => [y, r]), G, 0.25, 'liquid_pink').map((p) => ({ ...p, center: [0.01, p.center[1], -0.05] })));
  const funnel = [...stand(0.6), ...clamp(0.42, 0.07), ...vessel('body', [[0.3, 0.004], [0.33, 0.012], [0.38, 0.038], [0.43, 0.042], [0.46, 0.012], [0.48, 0.012]], G, 0.5, 'liquid_amber').map((p) => ({ ...p, center: [0.02, p.center[1], -0.05] })), box('body', [0.012, 0.3, -0.056], [0.028, 0.306, -0.044], 'cap_blue'), cyl('body', [0.02, 0.24, -0.05], 0.003, 0.1, 'y', G)];
  funnel.push(...vessel('body', [[0.012, 0.04], [0.06, 0.032], [0.1, 0.014], [0.13, 0.014]], G, 0.2, 'liquid_yellow').map((p) => ({ ...p, center: [0.02, p.center[1], -0.05] })));
  const still = [...stand(0.6), ...clamp(0.25, 0.05), ...clamp(0.42, 0.05)];
  still.push(...vessel('body', [[0.13, 0.01], [0.17, 0.055], [0.22, 0.055], [0.26, 0.015], [0.33, 0.015]], G, 0.25, 'liquid_amber').map((p) => ({ ...p, center: [0.0, p.center[1], -0.05] })));
  still.push(cyl('body', [0, 0.065, -0.05], 0.06, 0.13, 'y', 'steel_dark'), box('body', [-0.04, 0.03, 0.01], [0.04, 0.09, 0.012], 'emit_amber')); // topné hnízdo
  still.push(cyl('body', [0.14, 0.36, -0.05], 0.014, 0.28, 'x', G), cyl('body', [0.29, 0.22, -0.05], 0.006, 0.26, 'y', G)); // chladič a alonž
  still.push(...vessel('body', [[0, 0.04], [0.05, 0.04], [0.08, 0.02], [0.1, 0.012]], G, 0.25, 'liquid_water').map((p) => ({ ...p, center: [0.29, p.center[1], -0.05] })));
  return [
    simple('stand_burette_01', 'Stojan s byretou a titrační baňkou', CAT, burette, { gen: gen('standSetups') }),
    simple('stand_funnel_01', 'Stojan s dělicí nálevkou', CAT, funnel, { gen: gen('standSetups') }),
    simple('stand_distill_01', 'Destilační aparatura s chladičem a topným hnízdem', CAT, still, { gen: gen('standSetups') }),
  ];
}

/** Exsikátor se zabroušeným víkem a knoflíkem, porcelánová vložka se silikagelem; Ø 150 a 250 mm. */
export function desiccators() {
  return [150, 250].map((d, v) => {
    const R = d / 2000;
    const parts = [
      ...vessel('body', [[0, R * 0.7], [0.01, R], [R * 0.9, R], [R * 0.95, R * 1.08]], G, 0, null),
      cyl('body', [0, R * 0.25, 0], R * 0.9, 0.006, 'y', 'plastic_white'),
      cyl('body', [0, R * 0.12, 0], R * 0.6, R * 0.18, 'y', 'powder_blue'),
      ...vessel('body', [[R * 0.95, R * 1.08], [R * 1.1, R * 0.95], [R * 1.35, R * 0.4], [R * 1.42, 0.02]], G, 0, null),
      cyl('body', [0, R * 1.42 + 0.012, 0], 0.016, 0.024, 'y', G),
    ];
    return simple(`desiccator_${d}_01`, `Exsikátor ${d} mm se silikagelem`, CAT, parts, { gen: gen('desiccators') });
  });
}

/** Třecí miska s tloučkem (porcelán) a hodinové sklo. */
export function smallware() {
  const mortar = [...vessel('body', [[0, 0.035], [0.012, 0.05], [0.045, 0.06]], 'plastic_white', 0, null), cyl('body', [0, 0.042, 0], 0.05, 0.004, 'y', 'powder_white'), cyl('body', [0.02, 0.07, 0], 0.012, 0.1, 'x', 'plastic_white')];
  const watch = [cyl('body', [0, 0.003, 0], 0.05, 0.006, 'y', G), cyl('body', [0, 0.007, 0], 0.02, 0.004, 'y', 'powder_blue')];
  return [simple('mortar_porcelain_01', 'Třecí miska s tloučkem', CAT, mortar, { gen: gen('smallware') }), simple('watchglass_01', 'Hodinové sklo s krystaly', CAT, watch, { gen: gen('smallware') })];
}

export const GLASS = [beakers, erlenmeyers, measuringCylinders, volumetricFlasks, roundFlasks, reagentBottles, testTubeRacks, standSetups, desiccators, smallware];
