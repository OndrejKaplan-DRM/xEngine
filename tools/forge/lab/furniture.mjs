// Sada kit_lab: laboratorní nábytek (pracovní stoly s černou deskou a nástavbou, ostrůvek, stůl s výlevkou, regály,
// bezpečnostní skříně na chemikálie, digestoř 1,8 m, židle, vozíky, nouzová sprcha) a reaktory (stolní bioreaktory,
// nerezový bioreaktor 50 a 200 l, skleněný duplikovaný reaktor 20 a 50 l v rámu). Rozměry úvahou z katalogů
// laboratorního nábytku a reaktorů, neměřeno. Pracovní deska 0,9 m (laboratoř ve stoje, zadání sady).

import { box, boxc, cyl } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, panel, vessel, staticFloor } from './common.mjs';

const CAT = 'lab.furniture';
const gen = (f) => `lab/furniture.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const TOP = 0.9;
const floor = (top) => ({ components: staticFloor(top), group: 'world' });

/** Skříňky pod deskou: sokl, korpus, čela dvířek s madly (bez kloubu, jen tvar). */
function under(x0, x1, d, mat = 'plastic_light') {
  const out = [box('body', [x0 + 0.01, 0, -d / 2 + 0.05], [x1 - 0.01, 0.1, d / 2 - 0.06], 'plastic_anthracite'), box('body', [x0, 0.1, -d / 2 + 0.02], [x1, TOP - 0.03, d / 2 - 0.02], mat)];
  const n = Math.max(1, Math.round((x1 - x0) / 0.5));
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n + 0.004;
    const b = x0 + ((x1 - x0) * (i + 1)) / n - 0.004;
    out.push(box('body', [a, 0.11, d / 2 - 0.02], [b, TOP - 0.04, d / 2], mat), box('body', [(a + b) / 2 - 0.06, TOP - 0.12, d / 2], [(a + b) / 2 + 0.06, TOP - 0.105, d / 2 + 0.025], 'steel_brushed'));
  }
  return out;
}

/** Pracovní stůl ke zdi s černou deskou, skříňkami a nástavbou s policí a zásuvkami; délky 1,2, 1,5 a 1,8 m. */
export function benches() {
  const wall = [1.2, 1.5, 1.8].map((L, v) => {
    const d = 0.75;
    const parts = [...under(-L / 2, L / 2, d), ...bevelBox('body', [-L / 2, TOP - 0.03, -d / 2], [L / 2, TOP, d / 2], 'bench_phenolic', 0.004), box('body', [-L / 2, TOP, -d / 2], [L / 2, TOP + 0.75, -d / 2 + 0.03], 'plastic_light'), box('body', [-L / 2, TOP + 0.4, -d / 2 + 0.03], [L / 2, TOP + 0.42, -d / 2 + 0.3], 'steel_brushed'), box('body', [-L / 2, TOP + 0.7, -d / 2 + 0.03], [L / 2, TOP + 0.72, -d / 2 + 0.3], 'steel_brushed'), box('body', [-L / 2 + 0.05, TOP + 0.05, -d / 2 + 0.03], [L / 2 - 0.05, TOP + 0.12, -d / 2 + 0.06], 'plastic_anthracite')];
    for (let i = 0; i < Math.round(L / 0.3); i++) parts.push(box('body', [-L / 2 + 0.08 + i * 0.3, TOP + 0.07, -d / 2 + 0.06], [-L / 2 + 0.16 + i * 0.3, TOP + 0.1, -d / 2 + 0.065], i % 2 ? 'plastic_white' : 'cap_red'));
    return simple(`bench_lab_wall_${pad(v + 1)}`, `Laboratorní stůl ke zdi ${String(L).replace('.', ',')} m s nástavbou`, CAT, parts, { gen: gen('benches'), components: staticFloor(TOP), group: 'world' });
  });
  const L = 2.4;
  const d = 1.5;
  const island = simple('bench_lab_island_01', 'Laboratorní ostrůvek 2,4 m s policí na obě strany', CAT, [...under(-L / 2, L / 2, d), ...bevelBox('body', [-L / 2, TOP - 0.03, -d / 2], [L / 2, TOP, d / 2], 'bench_phenolic', 0.004), ...[-1, 1].map((s) => box('body', [s * (L / 2 - 0.05) - 0.03, TOP, -0.03], [s * (L / 2 - 0.05) + 0.03, TOP + 0.8, 0.03], 'steel_painted')), box('body', [-L / 2, TOP + 0.45, -0.18], [L / 2, TOP + 0.47, 0.18], 'steel_brushed'), box('body', [-L / 2, TOP + 0.78, -0.18], [L / 2, TOP + 0.8, 0.18], 'steel_brushed'), box('body', [-L / 2 + 0.1, TOP, -0.06], [L / 2 - 0.1, TOP + 0.1, 0.06], 'plastic_anthracite')], { gen: gen('benches'), components: staticFloor(TOP), group: 'world' });
  const sinkL = 1.5;
  const sink = simple('bench_lab_sink_01', 'Laboratorní stůl s výlevkou, baterií a oční sprchou', CAT, [...under(-sinkL / 2, sinkL / 2, 0.75), ...bevelBox('body', [-sinkL / 2, TOP - 0.03, -0.375], [sinkL / 2, TOP, 0.375], 'bench_phenolic', 0.004), box('body', [-0.25, TOP - 0.2, -0.25], [0.25, TOP - 0.0, 0.25], 'steel_brushed'), box('body', [-0.23, TOP - 0.19, -0.23], [0.23, TOP - 0.17, 0.23], 'steel_dark'), cyl('body', [0, TOP + 0.15, -0.32], 0.012, 0.3, 'y', 'steel_brushed'), cyl('body', [0, TOP + 0.3, -0.22], 0.01, 0.2, 'z', 'steel_brushed'), cyl('body', [0.5, TOP + 0.08, -0.3], 0.025, 0.12, 'y', 'paint_green'), cyl('body', [0.5, TOP + 0.15, -0.3], 0.05, 0.02, 'y', 'paint_yellow'), box('body', [-sinkL / 2, TOP, -0.375], [sinkL / 2, TOP + 0.3, -0.345], 'tile_white')], { gen: gen('benches'), components: staticFloor(TOP), group: 'world' });
  return [...wall, island, sink];
}

/** Regály: drátěný chromovaný (prázdný a se zásobami) ve dvou šířkách a nástěnná skříňka s prosklenými dvířky. */
export function shelving() {
  const rack = (w, stocked, v) => {
    const [d, h] = [0.45, 1.8];
    const parts = [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => boxc('body', [sx * (w / 2 - 0.012), h / 2, sz * (d / 2 - 0.012)], [0.024, h, 0.024], 'steel_brushed')))];
    for (let k = 0; k < 5; k++) {
      const y = 0.12 + k * 0.4;
      parts.push(box('body', [-w / 2, y, -d / 2], [w / 2, y + 0.025, d / 2], 'steel_brushed'));
      if (stocked && k > 0) {
        for (let i = 0; i < Math.floor(w / 0.22); i++) {
          const x = -w / 2 + 0.12 + i * 0.22;
          const kind = (i + k) % 4;
          if (kind === 0) parts.push(boxc('body', [x, y + 0.025 + 0.1, 0], [0.18, 0.2, 0.3], 'paper_kraft'));
          else if (kind === 1) parts.push(cyl('body', [x, y + 0.025 + 0.11, 0.05], 0.05, 0.22, 'y', 'glass_amber'), boxc('body', [x, y + 0.025 + 0.235, 0.05], [0.04, 0.03, 0.04], 'plastic_white'));
          else if (kind === 2) parts.push(boxc('body', [x, y + 0.025 + 0.06, 0], [0.18, 0.12, 0.25], 'plastic_white'), boxc('body', [x, y + 0.025 + 0.09, 0.126], [0.18, 0.02, 0.002], 'label_band_blue'));
          else parts.push(boxc('body', [x, y + 0.025 + 0.08, 0], [0.14, 0.16, 0.12], 'plastic_hdpe'), boxc('body', [x + 0.04, y + 0.025 + 0.17, 0], [0.04, 0.02, 0.04], 'cap_red'));
        }
      }
    }
    return simple(`shelf_wire_${pad(v)}`, `Drátěný regál ${String(w).replace('.', ',')} m${stocked ? ' se zásobami' : ''}`, CAT, parts, { gen: gen('shelving'), ...floor() });
  };
  const wallCab = simple('cabinet_wall_glass_01', 'Nástěnná skříňka s prosklenými dvířky', CAT, [box('body', [-0.5, 0, 0], [0.5, 0.7, 0.35], 'plastic_light'), box('body', [-0.49, 0.02, 0.35], [-0.005, 0.68, 0.37], 'glass_tinted'), box('body', [0.005, 0.02, 0.35], [0.49, 0.68, 0.37], 'glass_tinted'), box('body', [-0.48, 0.34, 0.02], [0.48, 0.36, 0.33], 'plastic_white'), ...[-0.3, -0.1, 0.15, 0.35].map((x, i) => cyl('body', [x, 0.44, 0.15], 0.04, 0.16, 'y', i % 2 ? 'glass_amber' : 'glass_lab'))], { gen: gen('shelving'), components: { physics: { body: 'static' }, place: { mount: 'wall', height: 1.5 } }, group: 'world' });
  return [rack(0.9, false, 1), rack(0.9, true, 2), rack(1.2, false, 3), rack(1.2, true, 4), wallCab];
}

/** Bezpečnostní skříně na chemikálie: hořlaviny (žlutá) a kyseliny a louhy (bílá), dvoukřídlé, kloub u levého křídla. */
export function safetyCabinets() {
  return [['cabinet_flammable_01', 'Bezpečnostní skříň na hořlaviny', 'paint_yellow'], ['cabinet_corrosive_01', 'Bezpečnostní skříň na kyseliny a louhy', 'plastic_white']].map(([id, title, mat]) => {
    const [w, d, h] = [1.2, 0.6, 1.95];
    const body = [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2 - 0.04], mat, 0.01), box('body', [0.005, 0.05, d / 2 - 0.04], [w / 2 - 0.01, h - 0.05, d / 2], mat), box('body', [0.02, h * 0.45, d / 2], [0.04, h * 0.6, d / 2 + 0.03], 'steel_brushed'), box('body', [0.2, h - 0.35, d / 2], [0.45, h - 0.2, d / 2 + 0.002], 'label_band_orange')];
    return moving(id, title, CAT, body, {
      node: 'door', at: [-w / 2 + 0.01, 0.05, d / 2 - 0.04], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 100, kind: 'door', prompt: 'Otevřít skříň',
      parts: [box('door', [0, 0, 0], [w / 2 - 0.015, h - 0.1, 0.04], mat), box('door', [w / 2 - 0.06, h * 0.42, 0.04], [w / 2 - 0.04, h * 0.57, 0.07], 'steel_brushed'), box('door', [0.1, h - 0.4, 0.04], [0.4, h - 0.25, 0.042], 'label_band_red')],
      note: 'Křídlo bezpečnostní skříně se samozavíráním se otvírá o 90 až 110° a zavře se samo (požárně odolná skříň); 100°. Úvaha, neměřeno.',
    }, { gen: gen('safetyCabinets'), place: { mount: 'floor' }, group: 'world' });
  });
}

/** Digestoř 1,8 m s posuvným oknem, laboratorní židle (dvě výšky), vozík se dvěma policemi, nouzová sprcha. */
export function fumehoodAndMore() {
  const [w, d, h] = [1.8, 0.9, 2.4];
  const hood = moving('fumehood_180_01', 'Digestoř 1,8 m s posuvným oknem', CAT, [...under(-w / 2, w / 2, d), box('body', [-w / 2, TOP - 0.03, -d / 2], [w / 2, TOP, d / 2], 'bench_phenolic'), box('body', [-w / 2, TOP, -d / 2], [-w / 2 + 0.08, h, d / 2], 'plastic_white'), box('body', [w / 2 - 0.08, TOP, -d / 2], [w / 2, h, d / 2], 'plastic_white'), box('body', [-w / 2, TOP, -d / 2], [w / 2, h, -d / 2 + 0.05], 'plastic_white'), box('body', [-w / 2, h - 0.45, -d / 2], [w / 2, h, d / 2], 'plastic_white'), ...panel('body', d / 2, w / 2 - 0.4, w / 2 - 0.1, h - 0.4, h - 0.3, 2), box('body', [-w / 2 + 0.1, h - 0.5, -d / 2 + 0.1], [w / 2 - 0.1, h - 0.47, d / 2 - 0.1], 'emit_warm')], {
    node: 'sash', at: [0, TOP + 0.25, d / 2 - 0.03], joint: 'sash', type: 'slider', axis: [0, 1, 0], max: 0.6, kind: 'drawer', prompt: 'Vysunout okno',
    parts: [box('sash', [-w / 2 + 0.09, 0, 0], [w / 2 - 0.09, 0.75, 0.015], 'glass_tinted'), box('sash', [-w / 2 + 0.09, -0.03, 0], [w / 2 - 0.09, 0, 0.04], 'plastic_white')],
    note: 'Okno digestoře jede svisle; pracovní otvor 40 až 50 cm, nahoru až 70 až 75 cm pro nakládání. Úvaha podle katalogů laboratorního nábytku, neměřeno.',
  }, { gen: gen('fumehoodAndMore'), place: { mount: 'floor', top: TOP }, group: 'world' });
  const stool = [['stool_lab_01', 'Laboratorní židle s opěradlem', 0.62, true], ['stool_lab_high_01', 'Vysoká laboratorní židle s kruhem pro nohy', 0.8, false]].map(([id, title, seat, back]) => {
    const parts = [...[0, 1, 2, 3, 4].map((i) => box('body', [Math.cos(i * 1.257) * 0.25 - 0.02, 0.03, Math.sin(i * 1.257) * 0.25 - 0.02], [Math.cos(i * 1.257) * 0.25 + 0.02, 0.07, Math.sin(i * 1.257) * 0.25 + 0.02], 'plastic_anthracite')), ...[0, 1, 2, 3, 4].map((i) => cyl('body', [Math.cos(i * 1.257) * 0.25, 0.025, Math.sin(i * 1.257) * 0.25], 0.025, 0.02, 'x', 'rubber_black')), cyl('body', [0, seat / 2, 0], 0.03, seat - 0.05, 'y', 'steel_brushed'), cyl('body', [0, seat, 0], 0.2, 0.06, 'y', 'plastic_navy')];
    if (back) parts.push(box('body', [-0.02, seat + 0.03, -0.2], [0.02, seat + 0.25, -0.17], 'steel_brushed'), box('body', [-0.17, seat + 0.2, -0.22], [0.17, seat + 0.4, -0.17], 'plastic_navy'));
    else parts.push(cyl('body', [0, seat - 0.35, 0], 0.2, 0.02, 'y', 'steel_brushed'));
    return simple(id, title, CAT, parts, { gen: gen('fumehoodAndMore'), components: staticFloor() });
  });
  const cart = simple('cart_lab_01', 'Laboratorní vozík se dvěma policemi', CAT, [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cyl('body', [sx * 0.36, 0.48, sz * 0.21], 0.012, 0.82, 'y', 'steel_brushed'))), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => cyl('body', [sx * 0.36, 0.035, sz * 0.21], 0.035, 0.03, 'x', 'rubber_black'))), box('body', [-0.38, 0.25, -0.23], [0.38, 0.28, 0.23], 'steel_brushed'), box('body', [-0.38, 0.85, -0.23], [0.38, 0.88, 0.23], 'steel_brushed'), box('body', [-0.38, 0.88, -0.23], [0.38, 0.9, -0.21], 'steel_brushed'), boxc('body', [-0.15, 0.94, 0], [0.13, 0.09, 0.09], 'plastic_navy'), cyl('body', [0.15, 0.98, 0.0], 0.05, 0.18, 'y', 'glass_amber')], { gen: gen('fumehoodAndMore'), components: staticFloor() });
  const shower = simple('shower_emergency_01', 'Nouzová sprcha s oční sprchou', CAT, [cyl('body', [0, 0.01, 0], 0.15, 0.02, 'y', 'paint_yellow'), cyl('body', [0, 1.1, 0], 0.02, 2.2, 'y', 'paint_yellow'), cyl('body', [0, 2.2, 0.15], 0.015, 0.3, 'z', 'paint_yellow'), cyl('body', [0, 2.15, 0.3], 0.13, 0.04, 'y', 'paint_green'), cyl('body', [0, 1.0, 0.15], 0.012, 0.3, 'z', 'paint_yellow'), cyl('body', [0, 1.02, 0.3], 0.13, 0.04, 'y', 'paint_green'), box('body', [0.03, 1.5, -0.01], [0.06, 1.8, 0.01], 'steel_brushed'), box('body', [-0.15, 1.3, 0.02], [0.15, 1.45, 0.025], 'label_band_green')], { gen: gen('fumehoodAndMore'), ...floor() });
  return [hood, ...stool, cart, shower];
}

/** Bioreaktory: stolní se skleněnou nádobou na řídicí věži (jedna a dvě nádoby), nerezový 50 l a 200 l; skleněné duplikované reaktory 20 a 50 l v rámu. */
export function reactors() {
  const glassVessel = (x, liq) => [...vessel('body', [[0.02, 0.07], [0.32, 0.07]], 'glass_lab', 0.65, liq).map((p) => ({ ...p, center: [x, p.center[1], 0] })), cyl('body', [x, 0.34, 0], 0.08, 0.03, 'y', 'steel_brushed'), cyl('body', [x, 0.42, 0], 0.035, 0.12, 'y', 'plastic_anthracite'), cyl('body', [x, 0.01, 0], 0.09, 0.02, 'y', 'steel_dark')];
  const tower = [...bevelBox('body', [-0.4, 0, -0.18], [-0.12, 0.65, 0.18], 'plastic_white', 0.01), box('body', [-0.38, 0.45, 0.18], [-0.14, 0.6, 0.182], 'emit_display'), ...[0, 1, 2].map((i) => cyl('body', [-0.34 + i * 0.08, 0.3, 0.2], 0.03, 0.04, 'z', 'plastic_light'))];
  const benchOne = simple('bioreactor_bench_01', 'Stolní bioreaktor se skleněnou nádobou', CAT, [...tower, ...glassVessel(0.05, 'liquid_yellow')], { gen: gen('reactors') });
  const benchTwo = simple('bioreactor_bench_02', 'Stolní bioreaktor se dvěma nádobami', CAT, [...tower, ...glassVessel(0.0, 'liquid_yellow'), ...glassVessel(0.2, 'liquid_pink')], { gen: gen('reactors') });
  const steel = [[50, 0.22, 0.6], [200, 0.33, 1.0]].map(([l, r, hv], v) => {
    const y0 = 0.55;
    const parts = [...[0, 1, 2].map((i) => box('body', [Math.cos(i * 2.094) * r * 0.8 - 0.025, 0, Math.sin(i * 2.094) * r * 0.8 - 0.025], [Math.cos(i * 2.094) * r * 0.8 + 0.025, y0 + 0.1, Math.sin(i * 2.094) * r * 0.8 + 0.025], 'steel_brushed')), ...vessel('body', [[y0, r * 0.5], [y0 + 0.08, r], [y0 + hv, r], [y0 + hv + 0.1, r * 0.6]], 'steel_brushed', 0, null), cyl('body', [0, y0 + hv + 0.2, 0], 0.07, 0.2, 'y', 'plastic_anthracite'), cyl('body', [r * 0.6, y0 + hv + 0.14, 0.0], 0.03, 0.1, 'y', 'steel_brushed'), cyl('body', [0, y0 + hv * 0.5, r + 0.01], 0.06, 0.02, 'z', 'glass_tinted'), box('body', [r + 0.15, 0, -0.3], [r + 0.75, 1.8, 0.3], 'plastic_white'), box('body', [r + 0.2, 1.3, 0.3], [r + 0.7, 1.7, 0.302], 'emit_display'), ...panel('body', 0.3, r + 0.2, r + 0.7, 1.0, 1.25, 4)];
    return simple(`bioreactor_steel_${l}_01`, `Nerezový bioreaktor ${l} l s řídicí skříní`, CAT, parts, { gen: gen('reactors'), ...floor() });
  });
  const jacket = [[20, 0.17, 0.45], [50, 0.24, 0.65]].map(([l, r, hv]) => {
    const y0 = 0.55;
    const parts = [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.4 - 0.02, 0, sz * 0.32 - 0.02], [sx * 0.4 + 0.02, 2.1, sz * 0.32 + 0.02], 'steel_brushed'))), box('body', [-0.42, y0 + hv + 0.12, -0.34], [0.42, y0 + hv + 0.16, 0.34], 'steel_brushed'), ...vessel('body', [[y0 - 0.12, 0.04], [y0, r], [y0 + hv, r]], 'glass_lab', 0.55, 'liquid_amber'), cyl('body', [0, y0 + hv * 0.5, 0], r + 0.03, hv * 0.8, 'y', 'glass_tinted'), cyl('body', [0, y0 + hv + 0.25, 0], 0.08, 0.2, 'y', 'steel_dark'), cyl('body', [0.2, y0 + hv + 0.6, 0], 0.04, 0.6, 'y', 'glass_lab'), cyl('body', [0, y0 - 0.2, 0], 0.02, 0.15, 'y', 'glass_lab')];
    return simple(`reactor_jacketed_${l}_01`, `Skleněný duplikovaný reaktor ${l} l v rámu`, CAT, parts, { gen: gen('reactors'), ...floor() });
  });
  return [benchOne, benchTwo, ...steel, ...jacket];
}

export const LAB_FURNITURE = [benches, shelving, safetyCabinets, fumehoodAndMore, reactors];
