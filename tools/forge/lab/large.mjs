// Sada kit_lab: velké přístroje (chromatografy, sekvenátory, mikroskopy, autoklávy, boxy, inkubátory, lyofilizátor,
// robot na pipetování, průtokový cytometr, NMR). Rozměry z katalogů výrobců (tools/forge/lab/ROZMERY.md), jinde
// úvaha. Tvar obecný, bez značek. Počátek ve středu půdorysu na podlaze nebo na desce stolu, čelo do +Z.

import { box, boxc, cyl, shiftPart, shiftParts } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, casing, panel, vessel, staticFloor } from './common.mjs';

const CAT = 'lab.large';
const gen = (f) => `lab/large.mjs#${f}`;
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const floor = (o = {}) => ({ components: staticFloor(o.top), group: 'world' });
const screen = (x, y, z, w, h) => [box('body', [x - w / 2, y, z], [x + w / 2, y + h, z + 0.02], 'plastic_anthracite'), box('body', [x - w / 2 + 0.01, y + 0.01, z + 0.02], [x + w / 2 - 0.01, y + h - 0.01, z + 0.021], 'emit_display')];

/** Kapalinová chromatografie: sestava UPLC 34,3 × 71,2 × 71,1 cm, širší HPLC se čtyřmi moduly a hmotnostní detektor. */
export function liquidChrom() {
  const stack = (w, d, mods, bottles) => {
    const parts = [];
    let y = 0;
    for (const [h, mat] of mods) {
      parts.push(...bevelBox('body', [-w / 2, y, -d / 2], [w / 2, y + h - 0.004, d / 2], mat, 0.006), box('body', [-w / 2 + 0.02, y + h * 0.3, d / 2], [w / 2 - 0.02, y + h * 0.75, d / 2 + 0.002], 'plastic_anthracite'), box('body', [w / 2 - 0.06, y + h * 0.4, d / 2 + 0.002], [w / 2 - 0.03, y + h * 0.5, d / 2 + 0.003], 'emit_green'));
      y += h;
    }
    parts.push(box('body', [-w / 2, y, -d / 2], [w / 2, y + 0.03, d / 2], 'plastic_light'));
    for (let i = 0; i < bottles; i++) parts.push(...vessel('body', [[y + 0.03, 0.04], [y + 0.18, 0.04], [y + 0.21, 0.02]], 'glass_lab', 0.7, i % 2 ? 'liquid_water' : 'liquid_amber').map((p) => ({ ...p, center: [-w / 2 + 0.05 + (i % 3) * 0.09, p.center[1], i < 3 ? -0.15 : 0.0] })));
    return parts;
  };
  const uplc = one('uplc_stack_01', 'Sestava UPLC (čerpadlo, dávkovač vzorků, termostat kolon)', stack(0.343, 0.712, [[0.18, 'plastic_white'], [0.26, 'plastic_white'], [0.22, 'plastic_light']], 4), 'liquidChrom');
  const hplc = one('hplc_stack_01', 'Sestava HPLC se čtyřmi moduly', stack(0.37, 0.55, [[0.14, 'plastic_light'], [0.18, 'plastic_light'], [0.2, 'plastic_light'], [0.14, 'plastic_light']], 3), 'liquidChrom');
  const ms = one('ms_detector_01', 'Hmotnostní detektor (trojitý kvadrupól)', [...casing('body', 0.45, 0.8, 0.6, 'plastic_white'), box('body', [-0.2, 0.3, 0.4], [0.2, 0.5, 0.402], 'plastic_anthracite'), box('body', [0.12, 0.6, 0.2], [0.18, 0.7, 0.3], 'steel_brushed'), box('body', [-0.18, 0.44, 0.402], [-0.1, 0.46, 0.404], 'emit_green')], 'liquidChrom');
  return [uplc, hplc, ms];
}

/** Plynová chromatografie: GC 51,5 × 54 × 44 cm s věží automatického dávkovače, kompaktní GC 35 × 62 × 44 cm, GC-MS. */
export function gasChrom() {
  const gc = (w, d, h) => [...casing('body', w, d, h, 'plastic_white'), box('body', [-w / 2 + 0.02, 0.05, d / 2], [w * 0.1, h - 0.08, d / 2 + 0.002], 'plastic_light'), ...panel('body', d / 2, w * 0.15, w / 2 - 0.02, h - 0.2, h - 0.05, 4), cyl('body', [w * 0.15, h + 0.1, -0.05], 0.07, 0.2, 'y', 'plastic_light'), cyl('body', [w * 0.15, h + 0.21, -0.05], 0.075, 0.02, 'y', 'plastic_anthracite')];
  const ms = [box('body', [0.29, 0, -0.27], [0.62, 0.42, 0.27], 'plastic_white'), box('body', [0.32, 0.25, 0.27], [0.59, 0.38, 0.272], 'plastic_anthracite')];
  return [
    one('gc_01', 'Plynový chromatograf s automatickým dávkovačem', gc(0.515, 0.54, 0.44), 'gasChrom'),
    one('gc_compact_01', 'Kompaktní plynový chromatograf', gc(0.35, 0.62, 0.44), 'gasChrom'),
    one('gcms_01', 'Plynový chromatograf s hmotnostním detektorem', [...gc(0.515, 0.54, 0.44).map((p) => shiftPart(p, -0.1, 0, 0)), ...ms], 'gasChrom'),
  ];
}

/** Sekvenátory: stolní 68,6 × 56,5 × 52,3 cm s víkem a velký stojací (šířka 86,4 cm, výška 158,8 cm). */
export function sequencers() {
  const bench = moving('sequencer_bench_01', 'Stolní sekvenátor', CAT, [...casing('body', 0.686, 0.565, 0.38, 'plastic_white'), ...screen(0.2, 0.2, 0.282, 0.22, 0.14), box('body', [-0.3, 0.06, 0.282], [0.05, 0.3, 0.284], 'plastic_light')], {
    node: 'lid', at: [-0.12, 0.38, -0.28], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 85, kind: 'door', prompt: 'Otevřít víko sekvenátoru',
    parts: [...bevelBox('lid', [-0.2, 0, 0], [0.2, 0.14, 0.5], 'plastic_white', 0.01)],
    note: 'Víko prostoru pro reagencie stolního sekvenátoru se zvedá dozadu asi do svislé polohy; 85°. Úvaha, neměřeno.',
  }, { gen: gen('sequencers') });
  const big = one('sequencer_floor_01', 'Velký sekvenátor (stojací)', [...bevelBox('body', [-0.432, 0, -0.47], [0.432, 1.588, 0.47], 'plastic_white', 0.02), box('body', [-0.38, 0.2, 0.47], [0.38, 1.0, 0.472], 'plastic_light'), ...screen(0.0, 1.1, 0.47, 0.5, 0.32), box('body', [-0.4, 1.588, -0.4], [0.4, 1.6, 0.4], 'plastic_light'), box('body', [-0.3, 0.6, 0.472], [0.3, 0.62, 0.474], 'emit_display')], 'sequencers', floor());
  return [bench, big];
}

/** Mikroskopy: konfokální na antivibračním stole, transmisní elektronový (TEM 120 kV), rastrovací (SEM) a stolní SEM. */
export function microscopes() {
  const table = [...bevelBox('body', [-0.6, 0.65, -0.45], [0.6, 0.75, 0.45], 'steel_dark', 0.01), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.5 - 0.06, 0, sz * 0.35 - 0.06], [sx * 0.5 + 0.06, 0.65, sz * 0.35 + 0.06], 'steel_painted')))];
  const confocal = one('microscope_confocal_01', 'Konfokální mikroskop na antivibračním stole', [...table, box('body', [-0.15, 0.75, -0.35], [0.15, 0.82, 0.2], 'plastic_white'), box('body', [-0.06, 0.82, -0.35], [0.06, 1.35, -0.22], 'plastic_white'), box('body', [-0.1, 1.2, -0.3], [0.1, 1.3, 0.1], 'plastic_white'), cyl('body', [0, 1.05, -0.05], 0.05, 0.12, 'y', 'plastic_anthracite'), box('body', [-0.12, 0.95, 0.1], [0.12, 0.97, 0.25], 'plastic_anthracite'), box('body', [0.25, 0.75, -0.4], [0.55, 1.0, -0.1], 'plastic_anthracite'), box('body', [-0.55, 0.75, -0.4], [-0.25, 0.95, -0.15], 'plastic_white'), cyl('body', [0.05, 1.32, 0.15], 0.012, 0.08, 'y', 'plastic_anthracite')], 'microscopes', floor());
  const tem = one('microscope_tem_01', 'Transmisní elektronový mikroskop (TEM)', [...bevelBox('body', [-0.9, 0, -0.5], [0.9, 0.75, 0.5], 'plastic_light', 0.02), box('body', [-0.9, 0.75, 0.1], [0.9, 0.78, 0.5], 'plastic_anthracite'), cyl('body', [0, 1.3, -0.2], 0.25, 1.1, 'y', 'plastic_white'), cyl('body', [0, 1.95, -0.2], 0.2, 0.2, 'y', 'plastic_white'), cyl('body', [0, 2.15, -0.2], 0.14, 0.2, 'y', 'steel_brushed'), cyl('body', [0.33, 1.0, -0.2], 0.07, 0.25, 'x', 'steel_brushed'), cyl('body', [-0.4, 1.3, -0.3], 0.13, 0.45, 'y', 'steel_brushed'), ...screen(-0.5, 0.95, 0.2, 0.5, 0.32), ...screen(0.5, 0.95, 0.2, 0.5, 0.32)], 'microscopes', floor({ top: 0.78 }));
  const sem = one('microscope_sem_01', 'Rastrovací elektronový mikroskop (SEM)', [...bevelBox('body', [-0.45, 0, -0.45], [0.45, 0.85, 0.45], 'plastic_white', 0.02), box('body', [-0.25, 0.4, 0.45], [0.25, 0.75, 0.47], 'steel_brushed'), cyl('body', [0, 1.15, -0.05], 0.13, 0.6, 'y', 'plastic_white'), cyl('body', [0, 1.5, -0.05], 0.09, 0.1, 'y', 'steel_brushed'), box('body', [0.5, 0, -0.4], [1.3, 0.75, 0.4], 'plastic_light'), ...screen(0.9, 0.78, 0.0, 0.55, 0.34)], 'microscopes', floor({ top: 0.75 }));
  const desk = one('microscope_sem_desk_01', 'Stolní rastrovací elektronový mikroskop', [...casing('body', 0.33, 0.6, 0.38, 'plastic_white'), cyl('body', [0, 0.47, -0.08], 0.08, 0.18, 'y', 'plastic_white'), box('body', [-0.12, 0.08, 0.3], [0.12, 0.25, 0.32], 'plastic_light'), box('body', [-0.03, 0.15, 0.32], [0.03, 0.18, 0.34], 'plastic_anthracite')], 'microscopes');
  return [confocal, tem, sem, desk];
}

/** Autoklávy: stojací 100 l plněný shora (víko na zadním pantu) a stolní s čelními dvířky. */
export function autoclaves() {
  const [w, d, h] = [0.65, 0.9, 0.985];
  const tall = moving('autoclave_floor_01', 'Autokláv stojací 100 l, plněný shora', CAT, [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], 'steel_brushed', 0.015), cyl('body', [0, h, -0.08], 0.22, 0.01, 'y', 'steel_dark'), ...panel('body', d / 2, -0.25, 0.25, h - 0.25, h - 0.08, 4), box('body', [-w / 2 + 0.04, 0.05, d / 2], [w / 2 - 0.04, 0.4, d / 2 + 0.002], 'steel_dark')], {
    node: 'lid', at: [0, h, -0.32], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 85, kind: 'door', prompt: 'Otevřít víko autoklávu',
    parts: [cyl('lid', [0, 0.03, 0.24], 0.25, 0.06, 'y', 'steel_brushed'), box('lid', [-0.05, 0.06, 0.4], [0.05, 0.1, 0.5], 'steel_dark')],
    note: 'Víko stojacího autoklávu na zadním pantu s protizávažím se zvedá skoro do svislé polohy; 85°. Úvaha podle katalogu výrobce, neměřeno.',
  }, { gen: gen('autoclaves'), place: { mount: 'floor' }, group: 'world' });
  const [bw, bd, bh] = [0.5, 0.62, 0.45];
  const bench = moving('autoclave_bench_01', 'Stolní autokláv s čelními dvířky', CAT, [...casing('body', bw, bd, bh, 'plastic_white'), ...panel('body', bd / 2, 0.1, 0.23, 0.3, 0.42, 3)], {
    node: 'door', at: [-bw / 2 + 0.02, 0.04, bd / 2], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 100, kind: 'door', prompt: 'Otevřít autokláv',
    parts: [cyl('door', [0.17, 0.18, 0.02], 0.15, 0.04, 'z', 'steel_brushed'), box('door', [0.3, 0.16, 0.04], [0.34, 0.2, 0.08], 'plastic_anthracite')],
    note: 'Kruhová dvířka stolního autoklávu na levém pantu se otvírají o 90 až 110°; 100°. Úvaha, neměřeno.',
  }, { gen: gen('autoclaves') });
  return [tall, bench];
}

/** Biologický bezpečnostní box třídy II (1,2 a 1,8 m) s posuvným čelním sklem a horizontální laminární box. */
export function cabinetsBio() {
  const bsc = (id, title, w) => {
    const [d, h, stand] = [0.8, 1.52, 0.71];
    const parts = [...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * (w / 2 - 0.05) - 0.025, 0, sz * (d / 2 - 0.08) - 0.025], [sx * (w / 2 - 0.05) + 0.025, stand, sz * (d / 2 - 0.08) + 0.025], 'steel_painted'))), box('body', [-w / 2, stand, -d / 2], [w / 2, stand + 0.15, d / 2], 'plastic_white'), box('body', [-w / 2 + 0.05, stand + 0.15, -d / 2 + 0.05], [w / 2 - 0.05, stand + 0.16, d / 2 - 0.08], 'steel_brushed'), box('body', [-w / 2, stand + 0.15, -d / 2], [-w / 2 + 0.05, stand + h - 0.3, d / 2], 'plastic_white'), box('body', [w / 2 - 0.05, stand + 0.15, -d / 2], [w / 2, stand + h - 0.3, d / 2], 'plastic_white'), box('body', [-w / 2 + 0.05, stand + 0.15, -d / 2], [w / 2 - 0.05, stand + h - 0.3, -d / 2 + 0.04], 'steel_brushed'), ...bevelBox('body', [-w / 2, stand + h - 0.3, -d / 2], [w / 2, stand + h, d / 2], 'plastic_white', 0.01), ...panel('body', d / 2, -w / 2 + 0.1, -w / 2 + 0.5, stand + h - 0.25, stand + h - 0.08, 4), box('body', [-w / 2 + 0.05, stand + h - 0.32, -d / 2 + 0.05], [w / 2 - 0.05, stand + h - 0.3, d / 2 - 0.1], 'emit_uv')];
    return moving(id, title, CAT, parts, {
      node: 'sash', at: [0, stand + 0.36, d / 2 - 0.06], joint: 'sash', type: 'slider', axis: [0, 1, 0], max: 0.25, kind: 'drawer', prompt: 'Posunout čelní sklo',
      parts: [box('sash', [-w / 2 + 0.05, 0, 0], [w / 2 - 0.05, h - 0.68, 0.012], 'glass_tinted'), box('sash', [-w / 2 + 0.05, -0.02, 0], [w / 2 - 0.05, 0, 0.03], 'plastic_white')],
      note: 'Čelní sklo boxu třídy II jede svisle; pracovní otvor 20 až 25 cm, nahoru až o 25 cm pro čištění. Úvaha podle katalogů (Thermo Scientific, Esco), neměřeno.',
    }, { gen: gen('cabinetsBio'), place: { mount: 'floor' }, group: 'world' });
  };
  const flow = one('laminar_flow_01', 'Horizontální laminární box (čistý stůl)', [...bevelBox('body', [-0.6, 0.75, -0.35], [0.6, 1.45, 0.35], 'plastic_white', 0.01), box('body', [-0.55, 0.75, -0.3], [0.55, 0.77, 0.32], 'steel_brushed'), box('body', [-0.55, 0.8, -0.32], [0.55, 1.35, -0.3], 'plastic_light'), box('body', [-0.6, 0.77, 0.34], [0.6, 1.0, 0.35], 'glass_tinted'), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.55 - 0.02, 0, sz * 0.28 - 0.02], [sx * 0.55 + 0.02, 0.75, sz * 0.28 + 0.02], 'steel_painted')))], 'cabinetsBio', floor({ top: 0.77 }));
  return [bsc('bsc_class2_120_01', 'Biologický bezpečnostní box třídy II, 1,2 m', 1.3), bsc('bsc_class2_180_01', 'Biologický bezpečnostní box třídy II, 1,8 m', 1.9), flow];
}

/** CO₂ inkubátor 63,7 × 88 × 90 cm na podstavci, dvojice nad sebou, lyofilizátor s komorou, robot na pipetování, průtokový cytometr, NMR. */
export function cultureAndMore() {
  const [w, d, h] = [0.637, 0.88, 0.9];
  const inc = (id, title, y0, extra) => moving(id, title, CAT, [...extra, ...bevelBox('body', [-w / 2, y0, -d / 2], [w / 2, y0 + h, d / 2 - 0.05], 'plastic_white', 0.012), ...panel('body', d / 2 - 0.05, -w / 2 + 0.05, w / 2 - 0.05, y0 + h - 0.12, y0 + h - 0.03, 3)], {
    node: 'door', at: [-w / 2, y0 + 0.02, d / 2 - 0.05], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 110, kind: 'door', prompt: 'Otevřít inkubátor',
    parts: [box('door', [0, 0, 0], [w, h - 0.15, 0.05], 'plastic_white'), box('door', [w - 0.06, h * 0.3, 0.05], [w - 0.04, h * 0.55, 0.08], 'steel_brushed')],
    note: 'Vnější dvířka CO₂ inkubátoru na pantu se otvírají o 90 až 180° (lze přehodit stranu); 110°. Úvaha podle katalogu výrobce, neměřeno.',
  }, { gen: gen('cultureAndMore'), place: { mount: 'floor' }, group: 'world' });
  const standLegs = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.27 - 0.02, 0, sz * 0.35 - 0.02], [sx * 0.27 + 0.02, 0.6, sz * 0.35 + 0.02], 'steel_painted')));
  const single = inc('incubator_co2_01', 'CO₂ inkubátor 165 l na podstavci', 0.6, [...standLegs, box('body', [-0.3, 0.58, -0.4], [0.3, 0.6, 0.35], 'steel_painted')]);
  const double = inc('incubator_co2_stack_01', 'Dvojice CO₂ inkubátorů nad sebou', 0.12 + h, [box('body', [-0.3, 0, -0.4], [0.3, 0.12, 0.35], 'steel_dark'), ...bevelBox('body', [-w / 2, 0.12, -d / 2], [w / 2, 0.12 + h, d / 2], 'plastic_white', 0.012), box('body', [w / 2 - 0.06, 0.4, d / 2], [w / 2 - 0.04, 0.6, d / 2 + 0.03], 'steel_brushed')]);
  const lyo = one('lyophilizer_01', 'Lyofilizátor s akrylovou komorou', [...casing('body', 0.65, 0.6, 0.45, 'plastic_white'), ...panel('body', 0.3, -0.28, 0.0, 0.3, 0.42, 3), cyl('body', [0.0, 0.62, -0.05], 0.15, 0.35, 'y', 'plastic_ps'), cyl('body', [0.0, 0.8, -0.05], 0.16, 0.02, 'y', 'steel_brushed'), ...[0, 1, 2].map((i) => cyl('body', [0, 0.52 + i * 0.1, -0.05], 0.13, 0.006, 'y', 'steel_brushed')), cyl('body', [0.2, 0.6, 0.1], 0.03, 0.3, 'y', 'steel_brushed')], 'cultureAndMore');
  const robot = one('liquid_handler_01', 'Pipetovací robot v proskleném krytu', [...bevelBox('body', [-0.6, 0, -0.37], [0.6, 0.12, 0.37], 'plastic_white', 0.01), box('body', [-0.6, 0.12, -0.37], [-0.57, 0.9, 0.37], 'plastic_white'), box('body', [0.57, 0.12, -0.37], [0.6, 0.9, 0.37], 'plastic_white'), box('body', [-0.6, 0.86, -0.37], [0.6, 0.9, 0.37], 'plastic_white'), box('body', [-0.57, 0.12, 0.36], [0.57, 0.86, 0.37], 'glass_tinted'), box('body', [-0.57, 0.7, -0.3], [0.57, 0.75, -0.24], 'steel_brushed'), box('body', [-0.1, 0.45, -0.3], [0.02, 0.75, -0.18], 'plastic_light'), ...[-0.4, -0.2, 0.0, 0.2, 0.4].map((x, i) => box('body', [x - 0.064, 0.12, -0.04], [x + 0.064, 0.14, 0.045], i % 2 ? 'cap_yellow' : 'plastic_ps'))], 'cultureAndMore');
  const cyto = one('cytometer_flow_01', 'Průtokový cytometr', [...casing('body', 0.6, 0.6, 0.45, 'plastic_white'), box('body', [0.1, 0.2, 0.3], [0.28, 0.35, 0.302], 'plastic_anthracite'), ...vessel('body', [[0.45, 0.05], [0.6, 0.05]], 'plastic_hdpe', 0, null).map((p) => ({ ...p, center: [-0.18, p.center[1], -0.15] })), box('body', [-0.05, 0.3, 0.3], [0.05, 0.32, 0.31], 'emit_green')], 'cultureAndMore');
  const nmr = one('nmr_magnet_01', 'NMR spektrometr (supravodivý magnet)', [cyl('body', [0, 0.35, 0], 0.05, 0.7, 'y', 'steel_dark'), ...[0, 1, 2].map((i) => box('body', [Math.cos(i * 2.1) * 0.25 - 0.03, 0, Math.sin(i * 2.1) * 0.25 - 0.03], [Math.cos(i * 2.1) * 0.25 + 0.03, 0.6, Math.sin(i * 2.1) * 0.25 + 0.03], 'steel_painted')), cyl('body', [0, 1.1, 0], 0.35, 0.9, 'y', 'plastic_light'), cyl('body', [0, 1.6, 0], 0.18, 0.1, 'y', 'steel_brushed'), cyl('body', [0.12, 1.75, 0], 0.03, 0.2, 'y', 'steel_brushed'), cyl('body', [-0.12, 1.75, 0], 0.03, 0.2, 'y', 'steel_brushed'), box('body', [-0.36, 0, -0.36], [0.36, 0.01, 0.36], 'paint_yellow')], 'cultureAndMore', floor());
  return [single, double, lyo, robot, cyto, nmr];
}

/** Myčka laboratorního skla pod pult (dvířka sklopná dolů), výrobník ledu a nástěnná úprava ultračisté vody. */
export function utilities() {
  const [w, d, h] = [0.6, 0.6, 0.85];
  const washer = moving('washer_labware_01', 'Myčka laboratorního skla pod pult', CAT, [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2 - 0.04], 'steel_brushed', 0.01), ...panel('body', d / 2 - 0.04, -0.25, 0.25, h - 0.1, h - 0.02, 4)], {
    node: 'door', at: [0, 0.08, d / 2 - 0.04], joint: 'drop', type: 'hinge', axis: [1, 0, 0], max: 90, kind: 'door', prompt: 'Otevřít myčku',
    parts: [box('door', [-w / 2 + 0.01, 0, 0], [w / 2 - 0.01, h - 0.2, 0.04], 'steel_brushed'), box('door', [-0.15, h - 0.26, 0.04], [0.15, h - 0.24, 0.07], 'steel_dark')],
    note: 'Dvířka myčky se sklápějí dolů do vodorovné polohy, jako u kuchyňské myčky; 90°. Úvaha, neměřeno.',
  }, { gen: gen('utilities'), place: { mount: 'floor' }, group: 'world' });
  const ice = one('ice_maker_01', 'Výrobník šupinového ledu', [...bevelBox('body', [-0.25, 0, -0.3], [0.25, 0.9, 0.3], 'steel_brushed', 0.01), box('body', [-0.2, 0.55, 0.3], [0.2, 0.75, 0.305], 'steel_dark'), box('body', [-0.18, 0.75, 0.3], [0.18, 0.78, 0.33], 'steel_dark')], 'utilities', floor());
  const water = simple('water_ultrapure_01', 'Úprava ultračisté vody na zeď s výdejním ramenem', CAT, [...bevelBox('body', [-0.18, 0, 0], [0.18, 0.5, 0.18], 'plastic_white', 0.01), box('body', [-0.12, 0.3, 0.18], [0.12, 0.42, 0.182], 'emit_display'), cyl('body', [0.12, 0.25, 0.3], 0.012, 0.25, 'z', 'plastic_white'), cyl('body', [0.12, 0.2, 0.42], 0.008, 0.1, 'y', 'plastic_white'), box('body', [-0.16, 0.04, 0.18], [-0.04, 0.12, 0.185], 'plastic_light')], { gen: gen('utilities'), components: { physics: { body: 'static' }, place: { mount: 'wall', height: 0.9 } }, group: 'world' });
  return [washer, ice, water];
}

export const LARGE = [liquidChrom, gasChrom, sequencers, microscopes, autoclaves, cabinetsBio, cultureAndMore, utilities];
