// Sada kit_lab: stolní přístroje. Rozměry podle katalogů výrobců (tools/forge/lab/ROZMERY.md: váhy, mikrocentrifugy,
// termocykler) a jinde úvahou z praxe; tvar obecný, bez značek. Víka, dvířka a šuplíky mají kloub se zdůvodněním.
// Počátek ve středu půdorysu na desce stolu, čelo s ovládáním do +Z.

import { box, boxc, cyl } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, casing, panel, vessel, label, staticFloor } from './common.mjs';
import { meshPart } from '../mesh/registry.mjs';
import { merge, moved, mTranslate } from '../mesh/geo.mjs';
import { roundedBox, tube } from '../mesh/solids.mjs';
import { vesselGeom, liquidGeom } from './glassware.mjs';
import { roundFlaskGeom } from './glass.mjs';

const T = (g, x, y, z) => moved(g, mTranslate(x, y, z));

const CAT = 'lab.bench';
const gen = (f) => `lab/bench.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const lid = (w, d, t, mat, extra = []) => [...bevelBox('lid', [-w / 2, 0, 0], [w / 2, t, d], mat, 0.006), ...extra];

/** Váhy: analytické s krytem a posuvnými dvířky (19,5 × 48,5 × 29,2 cm), předvážky s talířem, mikrováhy. */
export function balances() {
  const [w, d, h] = [0.195, 0.485, 0.292];
  const base = [...casing('body', w, d, 0.09), ...panel('body', d / 2, -0.08, 0.08, 0.02, 0.07, 4), box('body', [-w / 2 + 0.01, 0.09, -d / 2 + 0.01], [w / 2 - 0.01, h, -d / 2 + 0.03], 'plastic_white'), box('body', [-w / 2 + 0.01, h - 0.012, -d / 2 + 0.03], [w / 2 - 0.01, h, 0.05], 'glass_tinted'), box('body', [-w / 2 + 0.01, 0.09, 0.048], [w / 2 - 0.01, h, 0.052], 'glass_tinted'), cyl('body', [0, 0.1, -0.08], 0.04, 0.004, 'y', 'steel_brushed'), box('body', [w / 2 - 0.006, 0.09, -d / 2 + 0.03], [w / 2 - 0.002, h - 0.012, 0.048], 'glass_tinted')];
  const analytic = moving('balance_analytical_01', 'Analytické váhy s krytem (0,1 mg)', CAT, base, {
    node: 'door', at: [-w / 2 + 0.002, 0.09, -d / 2 + 0.03], joint: 'slide', type: 'slider', axis: [0, 0, 1], max: 0.12, kind: 'drawer', prompt: 'Odsunout dvířka krytu',
    parts: [box('door', [0, 0, 0], [0.004, h - 0.102, 0.018], 'glass_tinted'), box('door', [-0.004, 0.08, 0.004], [0, 0.12, 0.014], 'plastic_light')],
    note: 'Boční dvířka krytu analytických vah jedou po liště dozadu, otvor 12 až 15 cm; 0,12 m. Úvaha podle katalogů vah, neměřeno.',
  }, { gen: gen('balances') });
  const precision = one('balance_precision_01', 'Předvážky s talířem (0,01 g)', [...casing('body', 0.2, 0.32, 0.08), ...panel('body', 0.16, -0.08, 0.08, 0.015, 0.065, 4), cyl('body', [0, 0.085, -0.03], 0.075, 0.006, 'y', 'steel_brushed')], 'balances');
  const micro = one('balance_micro_01', 'Mikrováhy s kruhovým krytem', [...casing('body', 0.195, 0.478, 0.08), ...panel('body', 0.239, -0.08, 0.08, 0.015, 0.065, 4), cyl('body', [0, 0.14, -0.1], 0.07, 0.12, 'y', 'glass_tinted'), cyl('body', [0, 0.205, -0.1], 0.072, 0.01, 'y', 'plastic_white')], 'balances');
  return [analytic, precision, micro];
}

/** Mikrocentrifuga 24 × 39 × 24 cm a chlazená 29 × 48 × 26 cm, víko na zadním pantu (75°). */
export function microcentrifuges() {
  return [
    ['microcentrifuge_01', 'Mikrocentrifuga', 0.24, 0.39, 0.24, 'plastic_white'],
    ['microcentrifuge_cold_01', 'Mikrocentrifuga chlazená', 0.29, 0.48, 0.26, 'plastic_light'],
  ].map(([id, title, w, d, h, mat]) => {
    const body = [...casing('body', w, d, h * 0.62, mat), ...panel('body', d / 2, -w * 0.35, w * 0.35, h * 0.12, h * 0.48, 3), cyl('body', [0, h * 0.62, -0.02], w * 0.36, 0.01, 'y', 'steel_dark'), cyl('body', [0, h * 0.64, -0.02], 0.02, 0.02, 'y', 'steel_brushed')];
    return moving(id, title, CAT, body, {
      node: 'lid', at: [0, h * 0.62, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 75, kind: 'door', prompt: 'Otevřít víko',
      parts: lid(w, d * 0.86, h * 0.38, mat, [box('lid', [-w * 0.25, h * 0.38, d * 0.3], [w * 0.25, h * 0.38 + 0.002, d * 0.7], 'glass_tinted'), box('lid', [-0.03, h * 0.2, d * 0.86], [0.03, h * 0.3, d * 0.86 + 0.012], 'plastic_anthracite')]),
      note: 'Víko mikrocentrifugy na zadním pantu se otevírá asi o 75° (výška s otevřeným víkem 48 cm u modelu 24 cm vysokého); 75°. Úvaha podle katalogu výrobce, neměřeno.',
    }, { gen: gen('microcentrifuges') });
  });
}

/** Termomixér s blokem na zkumavky, vortex (dvě barvy), magnetická míchačka s ohřevem (s kádinkou a bez). */
export function mixers() {
  const thermo = one('thermomixer_01', 'Termomixér s blokem na mikrozkumavky', [...casing('body', 0.21, 0.3, 0.13), ...panel('body', 0.15, -0.09, 0.09, 0.015, 0.06, 4), box('body', [-0.07, 0.13, -0.12], [0.07, 0.15, 0.02], 'steel_brushed'), ...[0, 1, 2, 3].map((i) => box('body', [-0.06, 0.15, -0.11 + i * 0.03], [0.06, 0.152, -0.1 + i * 0.03], 'plastic_anthracite'))], 'mixers');
  const vortex = ['plastic_white', 'plastic_teal'].map((m, v) => one(`vortex_${pad(v + 1)}`, `Vortex (třepačka na zkumavky) ${v + 1}`, [...casing('body', 0.13, 0.16, 0.12, m), cyl('body', [0, 0.13, -0.01], 0.03, 0.02, 'y', 'rubber_black'), box('body', [-0.04, 0.03, 0.08], [0.04, 0.06, 0.083], 'plastic_anthracite'), cyl('body', [0.035, 0.045, 0.085], 0.009, 0.008, 'z', 'plastic_light')], 'mixers'));
  const stirrer = [0, 1].map((v) => {
    const parts = [...casing('body', 0.17, 0.28, 0.1), cyl('body', [0, 0.1, -0.04], 0.07, 0.008, 'y', 'plastic_white'), cyl('body', [-0.05, 0.05, 0.142], 0.013, 0.012, 'z', 'plastic_anthracite'), cyl('body', [0.05, 0.05, 0.142], 0.013, 0.012, 'z', 'plastic_anthracite'), box('body', [-0.02, 0.08, 0.14], [0.02, 0.09, 0.142], 'emit_red')];
    if (v) parts.push(...vessel('body', [[0.104, 0.045], [0.2, 0.045]], 'glass_lab', 0.6, 'liquid_blue').map((p) => ({ ...p, center: [0, p.center[1], -0.04] })), box('body', [-0.012, 0.106, -0.044], [0.012, 0.112, -0.036], 'plastic_white'));
    return one(`stirrer_hotplate_${pad(v + 1)}`, `Magnetická míchačka s ohřevem${v ? ' a kádinkou' : ''}`, parts, 'mixers');
  });
  return [thermo, ...vortex, ...stirrer];
}

/** Orbitální třepačka 45 × 45 × 15 cm (prázdná a s baňkami) a inkubační třepačka s víkem. */
export function shakers() {
  const base = (flasks) => {
    const parts = [...casing('body', 0.45, 0.45, 0.12), ...panel('body', 0.225, -0.12, 0.12, 0.02, 0.09, 3), box('body', [-0.21, 0.12, -0.21], [0.21, 0.13, 0.21], 'steel_brushed')];
    if (flasks) for (let i = 0; i < 4; i++) parts.push(...vessel('body', [[0.13, 0.05], [0.21, 0.024], [0.26, 0.017]], 'glass_lab', 0.25, 'liquid_yellow').map((p) => ({ ...p, center: [(i % 2 ? 1 : -1) * 0.1, p.center[1], (i < 2 ? 1 : -1) * 0.1] })));
    return parts;
  };
  const orbital = [0, 1].map((v) => one(`shaker_orbital_${pad(v + 1)}`, `Orbitální třepačka${v ? ' s baňkami' : ''}`, base(v), 'shakers'));
  const [w, d, h] = [0.7, 0.7, 0.42];
  const incubator = moving('shaker_incubator_01', 'Inkubační třepačka s víkem', CAT, [...casing('body', w, d, h, 'plastic_white'), ...panel('body', d / 2, -0.25, 0.1, 0.06, 0.2, 4), box('body', [-0.3, h - 0.01, -0.3], [0.3, h, 0.3], 'steel_brushed')], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 80, kind: 'door', prompt: 'Otevřít víko',
    parts: [...bevelBox('lid', [-w / 2, 0, 0], [w / 2, 0.16, d], 'plastic_white', 0.01), box('lid', [-w * 0.3, 0.16, d * 0.2], [w * 0.3, 0.162, d * 0.8], 'glass_tinted'), box('lid', [-0.15, 0.06, d], [0.15, 0.09, d + 0.02], 'plastic_anthracite')],
    note: 'Inkubační třepačka shora: víko na zadním pantu s plynovými vzpěrami, otvírá se o 75 až 85°; 80°. Úvaha, neměřeno.',
  }, { gen: gen('shakers'), place: { mount: 'floor' }, group: 'world' });
  return [...orbital, incubator];
}

/** Termocykler PCR 33 × 46 × 20 cm s vyhřívaným víkem a přístroj pro qPCR 33 × 46 × 36 cm. */
export function thermocyclers() {
  const pcr = moving('thermocycler_01', 'Termocykler PCR', CAT, [...casing('body', 0.33, 0.46, 0.12, 'plastic_white'), box('body', [-0.13, 0.12, 0.08], [0.13, 0.13, 0.22], 'plastic_white'), box('body', [-0.11, 0.13, 0.1], [0.11, 0.131, 0.2], 'emit_display'), box('body', [-0.07, 0.12, -0.15], [0.07, 0.128, -0.02], 'steel_brushed')], {
    node: 'lid', at: [0, 0.12, -0.2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 70, kind: 'door', prompt: 'Otevřít vyhřívané víko',
    parts: [...bevelBox('lid', [-0.12, 0, 0], [0.12, 0.08, 0.24], 'plastic_light', 0.01), cyl('lid', [0, 0.085, 0.12], 0.03, 0.01, 'y', 'plastic_anthracite')],
    note: 'Vyhřívané víko termocykleru se odklápí dozadu asi o 70° (u modelu s kolem šroubu na víku); 70°. Úvaha podle katalogu výrobce, neměřeno.',
  }, { gen: gen('thermocyclers') });
  const qpcr = one('qpcr_01', 'Přístroj pro kvantitativní PCR', [...casing('body', 0.33, 0.46, 0.36, 'plastic_white'), box('body', [-0.15, 0.2, 0.23], [0.15, 0.34, 0.232], 'plastic_anthracite'), box('body', [-0.12, 0.24, 0.232], [0.04, 0.32, 0.234], 'emit_display'), box('body', [-0.16, 0.08, 0.23], [0.16, 0.16, 0.232], 'plastic_light')], 'thermocyclers');
  return [pcr, qpcr];
}

/** Spektrofotometr UV-VIS s víkem kyvetového prostoru, mikroobjemový spektrofotometr, čtečka destiček se šuplíkem. */
export function photometers() {
  const uv = moving('spectrophotometer_uv_01', 'Spektrofotometr UV-VIS', CAT, [...casing('body', 0.45, 0.55, 0.22, 'plastic_white'), ...panel('body', 0.275, -0.2, 0.05, 0.04, 0.17, 5), box('body', [0.07, 0.22, -0.2], [0.2, 0.225, 0.05], 'plastic_anthracite')], {
    node: 'lid', at: [0.135, 0.22, -0.2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 90, kind: 'door', prompt: 'Otevřít kyvetový prostor',
    parts: [...bevelBox('lid', [-0.07, 0, 0], [0.07, 0.04, 0.25], 'plastic_light', 0.006)],
    note: 'Víko kyvetového prostoru spektrofotometru se odklápí dozadu do svislé polohy; 90°. Úvaha, neměřeno.',
  }, { gen: gen('photometers') });
  const nano = one('spectrophotometer_micro_01', 'Mikroobjemový spektrofotometr', [...casing('body', 0.2, 0.3, 0.12, 'plastic_white'), box('body', [-0.08, 0.12, -0.13], [0.08, 0.15, 0.05], 'plastic_white'), box('body', [-0.07, 0.15, -0.12], [0.07, 0.151, 0.04], 'emit_display'), box('body', [-0.02, 0.06, 0.12], [0.02, 0.2, 0.15], 'plastic_light'), box('body', [-0.02, 0.2, 0.05], [0.02, 0.22, 0.15], 'plastic_light'), cyl('body', [0, 0.125, 0.1], 0.006, 0.01, 'y', 'steel_brushed')], 'photometers');
  const reader = moving('plate_reader_01', 'Čtečka mikrotitračních destiček', CAT, [...casing('body', 0.4, 0.5, 0.35, 'plastic_light'), box('body', [-0.18, 0.25, 0.248], [-0.02, 0.32, 0.252], 'plastic_anthracite'), box('body', [-0.16, 0.27, 0.252], [-0.04, 0.31, 0.254], 'emit_display')], {
    node: 'tray', at: [0.08, 0.08, 0.25], joint: 'tray', type: 'slider', axis: [0, 0, 1], max: 0.14, kind: 'drawer', prompt: 'Vysunout podavač destiček',
    parts: [box('tray', [-0.075, 0, -0.14], [0.075, 0.015, 0.005], 'plastic_anthracite'), box('tray', [-0.064, 0.015, -0.12], [0.064, 0.03, -0.035], 'plastic_ps')],
    note: 'Podavač destiček čtečky vyjede z čela tak, aby se destička SBS dala vložit celá: 13 až 15 cm; 0,14 m. Úvaha, neměřeno.',
  }, { gen: gen('photometers') });
  return [uv, nano, reader];
}

/** Elektroforéza: horizontální vana s gelem, vertikální vana, zdroj napětí; elektroporátor; transiluminátor UV s krytem; dokumentace gelů; ruční UV lampa. */
export function electrophoresis() {
  const tank = one('electrophoresis_horizontal_01', 'Horizontální elektroforéza s gelem', [box('body', [-0.13, 0, -0.07], [0.13, 0.07, 0.07], 'plastic_ps'), box('body', [-0.12, 0.004, -0.06], [0.12, 0.05, 0.06], 'liquid_water'), box('body', [-0.07, 0.035, -0.05], [0.07, 0.045, 0.05], 'plastic_pp'), box('body', [-0.13, 0.07, -0.07], [0.13, 0.08, 0.07], 'plastic_ps'), cyl('body', [-0.12, 0.09, 0.05], 0.006, 0.02, 'y', 'cap_red'), cyl('body', [-0.12, 0.09, -0.05], 0.006, 0.02, 'y', 'plastic_anthracite')], 'electrophoresis');
  const vert = one('electrophoresis_vertical_01', 'Vertikální elektroforéza (SDS-PAGE)', [box('body', [-0.08, 0, -0.06], [0.08, 0.17, 0.06], 'plastic_ps'), box('body', [-0.07, 0.004, -0.05], [0.07, 0.08, 0.05], 'liquid_water'), box('body', [-0.05, 0.02, -0.02], [0.05, 0.15, 0.02], 'plastic_pp'), box('body', [-0.08, 0.17, -0.06], [0.08, 0.19, 0.06], 'plastic_ps'), cyl('body', [0.06, 0.2, 0.03], 0.006, 0.02, 'y', 'cap_red'), cyl('body', [0.06, 0.2, -0.03], 0.006, 0.02, 'y', 'plastic_anthracite')], 'electrophoresis');
  const psu = one('power_supply_ep_01', 'Zdroj napětí pro elektroforézu', [...casing('body', 0.22, 0.32, 0.09, 'plastic_light'), ...panel('body', 0.16, -0.1, 0.1, 0.012, 0.08, 4), ...[-0.06, -0.03, 0.03, 0.06].map((x, i) => cyl('body', [x, 0.04, 0.162], 0.005, 0.01, 'z', i % 2 ? 'plastic_anthracite' : 'cap_red'))], 'electrophoresis');
  const elporator = one('electroporator_01', 'Elektroporátor s komorou na kyvety', [...casing('body', 0.3, 0.3, 0.14, 'plastic_white'), ...panel('body', 0.15, -0.13, 0.05, 0.02, 0.12, 4), box('body', [0.07, 0.03, 0.06], [0.13, 0.12, 0.155], 'plastic_navy'), box('body', [0.09, 0.12, 0.09], [0.11, 0.14, 0.11], 'cap_red')], 'electrophoresis');
  const uvbox = moving('transilluminator_uv_01', 'Transiluminátor UV s ochranným krytem', CAT, [...casing('body', 0.4, 0.3, 0.1, 'plastic_anthracite'), box('body', [-0.17, 0.1, -0.12], [0.17, 0.103, 0.12], 'emit_uv'), box('body', [-0.18, 0.04, 0.15], [-0.1, 0.07, 0.152], 'plastic_light')], {
    node: 'shield', at: [0, 0.1, -0.13], joint: 'shield', type: 'hinge', axis: [-1, 0, 0], max: 85, kind: 'door', prompt: 'Zvednout ochranný kryt',
    parts: [box('shield', [-0.19, 0, 0], [0.19, 0.006, 0.27], 'plastic_orange'), box('shield', [-0.03, 0.006, 0.25], [0.03, 0.02, 0.27], 'plastic_anthracite')],
    note: 'Oranžový akrylový kryt transiluminátoru se zvedá na zadním pantu až do svislé polohy; 85°. Úvaha, neměřeno.',
  }, { gen: gen('electrophoresis') });
  const geldoc = one('gel_doc_01', 'Skříň na dokumentaci gelů s kamerou', [...casing('body', 0.4, 0.45, 0.5, 'plastic_anthracite'), box('body', [-0.17, 0.08, 0.225], [0.17, 0.4, 0.228], 'plastic_light'), box('body', [-0.03, 0.2, 0.228], [0.03, 0.26, 0.24], 'steel_brushed'), cyl('body', [0, 0.53, 0], 0.04, 0.06, 'y', 'plastic_anthracite')], 'electrophoresis');
  const lamp = one('lamp_uv_hand_01', 'Ruční UV lampa', [box('body', [-0.12, 0, -0.03], [0.12, 0.04, 0.03], 'plastic_anthracite'), box('body', [-0.1, 0, 0.025], [0.1, 0.03, 0.031], 'emit_uv'), box('body', [-0.04, 0.04, -0.01], [0.04, 0.06, 0.01], 'plastic_anthracite')], 'electrophoresis');
  return [tank, vert, psu, elporator, uvbox, geldoc, lamp];
}

/** Pipety: lineární stojan se šesti pipetami, otočný stojan, elektronická multikanálová pipeta, pipetovací nástavec. */
export function pipettes() {
  const pipette = (x, z, len, col) => [cyl('body', [x, 0.07 + len / 2, z], 0.011, len, 'y', 'plastic_light'), boxc('body', [x, 0.07 + len + 0.01, z], [0.014, 0.02, 0.014], col), boxc('body', [x, 0.05, z], [0.006, 0.04, 0.006], 'plastic_white')];
  const cols = ['cap_red', 'cap_yellow', 'cap_yellow', 'cap_blue', 'cap_green', 'plastic_anthracite'];
  const linear = [box('body', [-0.17, 0, -0.04], [0.17, 0.012, 0.04], 'plastic_light'), box('body', [-0.17, 0.012, -0.04], [0.17, 0.2, -0.03], 'plastic_light'), box('body', [-0.17, 0.17, -0.03], [0.17, 0.18, 0.0], 'plastic_light')];
  cols.forEach((c, i) => linear.push(...pipette(-0.14 + i * 0.056, -0.012, 0.11, c)));
  const carousel = [cyl('body', [0, 0.006, 0], 0.09, 0.012, 'y', 'plastic_light'), cyl('body', [0, 0.12, 0], 0.01, 0.22, 'y', 'plastic_light'), cyl('body', [0, 0.2, 0], 0.06, 0.012, 'y', 'plastic_light')];
  cols.forEach((c, i) => carousel.push(...pipette(Math.cos((i * Math.PI) / 3) * 0.05, Math.sin((i * Math.PI) / 3) * 0.05, 0.11, c)));
  const multi = [box('body', [-0.045, 0, -0.012], [0.045, 0.012, 0.012], 'plastic_white'), box('body', [-0.04, 0.012, -0.01], [0.04, 0.05, 0.01], 'plastic_light'), box('body', [-0.018, 0.05, -0.015], [0.018, 0.2, 0.015], 'plastic_light'), box('body', [-0.012, 0.15, 0.015], [0.012, 0.18, 0.017], 'emit_display')];
  const controller = [box('body', [-0.02, 0, -0.03], [0.02, 0.1, 0.03], 'plastic_navy'), cyl('body', [0, 0.14, 0.02], 0.012, 0.08, 'y', 'plastic_navy'), box('body', [-0.006, 0.09, 0.025], [0.006, 0.1, 0.04], 'cap_red'), cyl('body', [0, 0.2, 0.02], 0.006, 0.04, 'y', 'plastic_pp')];
  return [
    one('pipettes_linear_01', 'Lineární stojan se šesti pipetami', linear, 'pipettes'),
    one('pipettes_carousel_01', 'Otočný stojan s pipetami', carousel, 'pipettes'),
    one('pipette_multichannel_01', 'Elektronická osmikanálová pipeta', multi, 'pipettes'),
    one('pipette_controller_01', 'Pipetovací nástavec na sérologické pipety', controller, 'pipettes'),
  ];
}

/** Vývěvy: membránová a olejová rotační; vodní lázeň s víkem; ultrazvuková lázeň; pH metr; plynový kahan. */
export function benchUtility() {
  const membrane = one('pump_vacuum_membrane_01', 'Membránová vývěva', [...casing('body', 0.25, 0.3, 0.2, 'plastic_light'), cyl('body', [0, 0.12, 0], 0.07, 0.18, 'z', 'plastic_anthracite'), cyl('body', [0.08, 0.23, 0], 0.02, 0.06, 'y', 'steel_brushed'), box('body', [-0.11, 0.06, 0.15], [-0.05, 0.1, 0.152], 'cap_red')], 'benchUtility');
  const rotary = one('pump_vacuum_rotary_01', 'Olejová rotační vývěva', [box('body', [-0.22, 0, -0.08], [0.22, 0.02, 0.08], 'steel_dark'), cyl('body', [-0.08, 0.11, 0], 0.08, 0.2, 'x', 'paint_blue'), cyl('body', [0.11, 0.11, 0], 0.07, 0.18, 'x', 'steel_dark'), cyl('body', [0.11, 0.21, 0], 0.02, 0.06, 'y', 'steel_brushed'), box('body', [0.18, 0.06, 0.07], [0.21, 0.1, 0.08], 'glass_tinted')], 'benchUtility', { components: staticFloor() });
  const [w, d, h] = [0.35, 0.55, 0.26];
  const bath = moving('bath_water_01', 'Vodní lázeň s víkem', CAT, [...casing('body', w, d, h, 'steel_brushed'), box('body', [-w / 2 + 0.02, h - 0.03, -d / 2 + 0.02], [w / 2 - 0.02, h - 0.025, d / 2 - 0.06], 'liquid_water'), ...panel('body', d / 2, -0.14, 0.14, 0.03, 0.1, 3)], {
    node: 'lid', at: [0, h, -d / 2], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 100, kind: 'door', prompt: 'Otevřít víko lázně',
    parts: [box('lid', [-w / 2, 0, 0], [w / 2, 0.06, d - 0.04], 'steel_brushed'), box('lid', [-0.06, 0.06, d - 0.08], [0.06, 0.075, d - 0.05], 'plastic_anthracite')],
    note: 'Sedlové víko vodní lázně se odklápí dozadu za svislou polohu, aby kondenzát stékal do vany; 100°. Úvaha, neměřeno.',
  }, { gen: gen('benchUtility') });
  const ultrasonic = one('bath_ultrasonic_01', 'Ultrazvuková lázeň', [...casing('body', 0.3, 0.18, 0.15, 'steel_brushed'), box('body', [-0.13, 0.13, -0.075], [0.13, 0.14, 0.075], 'liquid_water'), cyl('body', [-0.1, 0.07, 0.092], 0.012, 0.01, 'z', 'plastic_anthracite'), cyl('body', [0.1, 0.07, 0.092], 0.012, 0.01, 'z', 'plastic_anthracite')], 'benchUtility');
  const ph = one('ph_meter_01', 'pH metr s elektrodou na rameni', [...casing('body', 0.2, 0.22, 0.07, 'plastic_white'), box('body', [-0.08, 0.05, 0.11], [0.04, 0.065, 0.112], 'emit_display'), cyl('body', [0.08, 0.2, -0.06], 0.006, 0.28, 'y', 'steel_brushed'), box('body', [0.0, 0.3, -0.07], [0.09, 0.31, -0.05], 'plastic_light'), cyl('body', [0.01, 0.2, -0.06], 0.006, 0.16, 'y', 'glass_lab'), ...vessel('body', [[0.07, 0.03], [0.14, 0.03]], 'glass_lab', 0.6, 'liquid_yellow').map((p) => ({ ...p, center: [0.01, p.center[1], -0.06] }))], 'benchUtility');
  const burner = one('burner_bunsen_01', 'Plynový kahan', [cyl('body', [0, 0.006, 0], 0.045, 0.012, 'y', 'steel_dark'), cyl('body', [0, 0.08, 0], 0.008, 0.14, 'y', 'steel_brushed'), cyl('body', [0, 0.03, 0], 0.012, 0.025, 'y', 'brass'), cyl('body', [0.04, 0.02, 0], 0.005, 0.06, 'x', 'brass')], 'benchUtility');
  return [membrane, rotary, bath, ultrasonic, ph, burner];
}

/** Rotační vakuová odparka s lázní, chladičem a baňkami. */
export function rotavap() {
  // B04: baňky a chladič z hladkých sítí (dřív stoh válců). Odpařovací baňka skloněná 25° do lázně, nad ní parovod,
  // svislý chladič se spirálou a jímací baňka; věž s motorem a zdvihem.
  const part = (role, g, mat) => meshPart('body', 'bench', `rotavap_${role}`, g, mat);
  const bath = vesselGeom([[0, 0.12], [0.12, 0.12, 0.01, 1], [0.12, 0.215, 0.004, 1], [0.123, 0.22]], { wall: 0.003, seg: 16, lipN: 2 });
  const evap = roundFlaskGeom(105, 70, 30, 0, 12);
  const tilt = (g) => moved(g, [Math.cos(0.436), -Math.sin(0.436), 0, 0, Math.sin(0.436), Math.cos(0.436), 0, 0, 0, 0, 1, 0, 0.11, 0.14, 0.05, 1]);
  const coil = [];
  for (let i = 0; i <= 20; i++) {
    const a = i * 1.2;
    coil.push([-0.08 + Math.cos(a) * 0.022, 0.5 + i * 0.011, -0.11 + Math.sin(a) * 0.022]);
  }
  const jacket = vesselGeom([[0, 0], [0.04, 0, 0.01, 1], [0.04, 0.3, 0.012, 1], [0.012, 0.32], [0.012, 0.335], [0.013, 0.336]], { wall: 0.0018, seg: 12, lipN: 2 });
  const recv = roundFlaskGeom(85, 40, 26, 0, 12);
  const parts = [
    ...casing('body', 0.55, 0.45, 0.12, 'plastic_white'),
    ...panel('body', 0.225, -0.2, -0.04, 0.025, 0.09, 3),
    part('bath', bath.geom, 'steel_brushed'),
    part('water', liquidGeom(bath.inner, 0.205, { seg: 18, flat: true }), 'liquid_water'),
    part('tower', merge(roundedBox([-0.24, 0.12, -0.2], [-0.16, 0.62, -0.12], 0.012, 1), roundedBox([-0.2, 0.4, -0.17], [0.0, 0.5, -0.05], 0.015, 1)), 'plastic_white'),
    part('flask', tilt(evap.geom), 'glass_lab'),
    part('flaskliq', tilt(liquidGeom(evap.inner, evap.cy - evap.R * 0.3, { seg: 12, flat: true })), 'liquid_amber'),
    part('duct', tube([[0.0, 0.45, -0.1], [0.04, 0.32, 0.0], [0.07, 0.25, 0.04]], 0.009, 8, { bend: 0.05, bendSeg: 2 }), 'glass_lab'),
    part('jacket', T(jacket.geom, -0.08, 0.5, -0.11), 'glass_lab'),
    part('coil', tube(coil, 0.0035, 5, { caps: false }), 'glass_thin'),
    part('recv', T(recv.geom, -0.08, 0.25, 0.08), 'glass_lab'),
    part('recvliq', T(liquidGeom(recv.inner, recv.cy - recv.R * 0.5, { seg: 12, flat: true }), -0.08, 0.25, 0.08), 'liquid_water'),
  ];
  return [one('rotavap_01', 'Rotační vakuová odparka', parts, 'rotavap', { params: { assembly: true } })]; // přístroj se sadou skla
}

/** Tlaková láhev 50 l s redukčním ventilem a barvou hrdla podle EN 1089-3; Dewarovy nádoby 4, 10 a 35 l. */
export function gasAndCryo() {
  const gases = [['helium', 'Helium', 'paint_brown'], ['nitrogen', 'Dusík', 'iron_black'], ['co2', 'Oxid uhličitý', 'plastic_light'], ['argon', 'Argon', 'paint_green'], ['oxygen', 'Kyslík', 'plastic_white']];
  const cylinders = gases.map(([k, name, shoulder]) => {
    const parts = [cyl('body', [0, 0.7, 0], 0.115, 1.3, 'y', 'steel_painted'), cyl('body', [0, 1.4, 0], 0.1, 0.1, 'y', shoulder), cyl('body', [0, 1.47, 0], 0.04, 0.05, 'y', shoulder), cyl('body', [0, 1.52, 0], 0.016, 0.06, 'y', 'brass'), box('body', [-0.04, 1.54, -0.02], [0.04, 1.59, 0.02], 'brass'), cyl('body', [-0.05, 1.6, 0.0], 0.025, 0.012, 'z', 'plastic_white'), cyl('body', [0.05, 1.6, 0.0], 0.025, 0.012, 'z', 'plastic_white'), box('body', [-0.04, 0.8, 0.113], [0.04, 0.95, 0.118], 'label_paper')];
    return simple(`cylinder_gas_${k}_01`, `Tlaková láhev 50 l: ${name}, s redukčním ventilem`, CAT, parts, { gen: gen('gasAndCryo'), components: staticFloor(), group: 'world' });
  });
  const dewar = [[4, 0.0925, 0.427, 0.0175], [10, 0.131, 0.546, 0.028], [35, 0.239, 0.668, 0.032]].map(([l, r, h, n]) => {
    const parts = [...vessel('body', [[0, r * 0.95], [0.02, r], [h * 0.75, r], [h * 0.9, r * 0.55], [h - 0.03, n + 0.01]], 'steel_brushed', 0, null), cyl('body', [0, h - 0.015, 0], n + 0.008, 0.03, 'y', 'plastic_anthracite'), box('body', [-r * 0.7, h * 0.85, -0.012], [-r * 0.55, h * 0.92, 0.012], 'steel_dark'), box('body', [r * 0.55, h * 0.85, -0.012], [r * 0.7, h * 0.92, 0.012], 'steel_dark')];
    return simple(`dewar_${l}l_01`, `Dewarova nádoba na kapalný dusík ${l} l`, CAT, parts, { gen: gen('gasAndCryo'), components: staticFloor() });
  });
  return [...cylinders, ...dewar];
}

/** Mikroskopy: stereoskopický a invertovaný pro buněčné kultury; sušárna se dvířky. */
export function opticsAndOven() {
  const stereo = one('microscope_stereo_01', 'Stereoskopický mikroskop', [box('body', [-0.12, 0, -0.14], [0.12, 0.03, 0.12], 'plastic_white'), box('body', [-0.03, 0.03, -0.13], [0.03, 0.4, -0.09], 'plastic_white'), box('body', [-0.05, 0.25, -0.1], [0.05, 0.33, 0.02], 'plastic_white'), cyl('body', [-0.025, 0.37, -0.04], 0.012, 0.09, 'y', 'plastic_anthracite'), cyl('body', [0.025, 0.37, -0.04], 0.012, 0.09, 'y', 'plastic_anthracite'), cyl('body', [0, 0.22, -0.04], 0.03, 0.05, 'y', 'plastic_anthracite'), cyl('body', [0, 0.032, -0.02], 0.05, 0.004, 'y', 'glass_lab')], 'opticsAndOven');
  const inverted = one('microscope_inverted_01', 'Invertovaný mikroskop pro buněčné kultury', [...casing('body', 0.3, 0.55, 0.2, 'plastic_white'), box('body', [-0.13, 0.2, -0.1], [0.13, 0.215, 0.15], 'plastic_anthracite'), box('body', [-0.04, 0.2, -0.27], [0.04, 0.55, -0.2], 'plastic_white'), box('body', [-0.05, 0.48, -0.25], [0.05, 0.53, 0.02], 'plastic_white'), cyl('body', [0, 0.45, 0.0], 0.03, 0.06, 'y', 'plastic_anthracite'), box('body', [-0.07, 0.2, 0.18], [0.07, 0.26, 0.3], 'plastic_white'), cyl('body', [-0.02, 0.29, 0.26], 0.011, 0.07, 'y', 'plastic_anthracite'), cyl('body', [0.02, 0.29, 0.26], 0.011, 0.07, 'y', 'plastic_anthracite'), cyl('body', [0, 0.23, 0.02], 0.035, 0.012, 'y', 'liquid_pink')], 'opticsAndOven');
  const [w, d, h] = [0.6, 0.55, 0.7];
  const oven = moving('oven_drying_01', 'Laboratorní sušárna se dvířky', CAT, [...casing('body', w, d, h, 'plastic_white'), box('body', [-w / 2 + 0.03, 0.05, d / 2 - 0.01], [w / 2 - 0.03, h - 0.12, d / 2], 'steel_dark'), ...panel('body', d / 2, -0.25, 0.25, h - 0.1, h - 0.02, 4)], {
    node: 'door', at: [-w / 2 + 0.02, 0.04, d / 2], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 120, kind: 'door', prompt: 'Otevřít sušárnu',
    parts: [box('door', [0, 0, 0], [w - 0.04, h - 0.15, 0.04], 'plastic_white'), box('door', [w * 0.2, h * 0.2, 0.04], [w * 0.75, h * 0.55, 0.042], 'glass_tinted'), box('door', [w - 0.1, h * 0.3, 0.04], [w - 0.08, h * 0.5, 0.07], 'steel_brushed')],
    note: 'Dvířka stolní sušárny na levém pantu se otevírají o 90 až 180°, v laboratoři obvykle ke zdi; 120°. Úvaha, neměřeno.',
  }, { gen: gen('opticsAndOven') });
  return [stereo, inverted, oven];
}

/** Drobnosti: počítač buněk, minutka, tiskárna štítků, minicentrifuga, odpadní nádoba se sáčkem na špičky. */
export function smallDevices() {
  return [
    one('cell_counter_01', 'Automatický počítač buněk', [...casing('body', 0.18, 0.22, 0.17, 'plastic_white'), box('body', [-0.07, 0.07, 0.11], [0.07, 0.15, 0.112], 'emit_display'), box('body', [-0.03, 0.03, 0.11], [0.03, 0.04, 0.115], 'plastic_anthracite')], 'smallDevices'),
    one('timer_lab_01', 'Laboratorní minutka', [box('body', [-0.035, 0, -0.012], [0.035, 0.07, 0.012], 'plastic_white'), box('body', [-0.028, 0.035, 0.012], [0.028, 0.062, 0.0135], 'emit_display')], 'smallDevices'),
    one('printer_label_01', 'Tiskárna štítků', [...casing('body', 0.12, 0.2, 0.15, 'plastic_anthracite'), box('body', [-0.04, 0.08, 0.1], [0.04, 0.081, 0.13], 'label_paper')], 'smallDevices'),
    one('minicentrifuge_01', 'Minicentrifuga', [cyl('body', [0, 0.04, 0], 0.07, 0.08, 'y', 'plastic_white'), cyl('body', [0, 0.09, 0], 0.065, 0.02, 'y', 'plastic_ps')], 'smallDevices'),
    one('bin_tips_01', 'Odpadní nádobka na špičky', [box('body', [-0.07, 0, -0.07], [0.07, 0.15, 0.07], 'plastic_hdpe'), box('body', [-0.075, 0.15, -0.075], [0.075, 0.16, 0.075], 'plastic_orange')], 'smallDevices'),
  ];
}

export const BENCH = [balances, microcentrifuges, mixers, shakers, thermocyclers, photometers, electrophoresis, pipettes, benchUtility, rotavap, gasAndCryo, opticsAndOven, smallDevices];
