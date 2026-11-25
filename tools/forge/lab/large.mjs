// Sada kit_lab: velké přístroje (chromatografy, sekvenátory, mikroskopy, autoklávy, boxy, inkubátory, lyofilizátor,
// robot na pipetování, průtokový cytometr, NMR). Rozměry z katalogů výrobců (tools/forge/lab/ROZMERY.md), jinde
// úvaha. Tvar obecný, bez značek. Počátek ve středu půdorysu na podlaze nebo na desce stolu, čelo do +Z.
// Ondřej 25. 11. 2026 v 1:29: přístroje kus po kuse; hladké sítě ze stavebnice appliance.mjs, do 1 500 △ na kus.

import { cbox } from '../lib.mjs';
import { simple, moving, staticFloor } from './common.mjs';
import { A, shell, door, barHandle, rail, grille, screen, feet, wireShelf, cable, merge, T, roundedBox, flatBox, cylinder, torus, tube, lathe, moved, mTranslate, mRotate, at } from './appliance.mjs';

const CAT = 'lab.large';
const gen = (f) => `lab/large.mjs#${f}`;
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });
const floor = (o = {}) => ({ components: staticFloor(o.top), group: 'world' });
const rotX = (g, x, y, z) => moved(g, at(mTranslate(x, y, z), mRotate('x', 90)));
const rotZ = (g, x, y, z) => moved(g, at(mTranslate(x, y, z), mRotate('z', -90))); // osa Y → +X

/** Monitor na stojánku (rámeček, obraz, noha a podstavec) se středem dole v [x, y, z]. */
function monitor(n, key, x, y, z, w = 0.55, h = 0.34) {
  return [
    A(n, `${key}_mon`, merge([roundedBox([x - w / 2, y + 0.1, z - 0.02], [x + w / 2, y + 0.1 + h, z + 0.01], 0.006, 1), flatBox([x - 0.025, y + 0.02, z - 0.04], [x + 0.025, y + 0.15, z - 0.02]), flatBox([x - 0.11, y, z - 0.12], [x + 0.11, y + 0.02, z + 0.04])]), 'plastic_black'),
    A(n, `${key}_img`, flatBox([x - w / 2 + 0.012, y + 0.112, z + 0.01], [x + w / 2 - 0.012, y + 0.088 + h, z + 0.0105]), 'emit_display'),
  ];
}

/** Modul sestavy (čerpadlo, dávkovač, termostat): zaoblený kvádr, tmavé okno dvířek, kontrolka. */
function stackModule(key, w, d, y, h, mat, i) {
  return [
    shell('body', `${key}_m${i}`, [-w / 2, y, -d / 2], [w / 2, y + h - 0.004, d / 2], mat, 0.008),
    A('body', `${key}_w${i}`, roundedBox([-w / 2 + 0.02, y + h * 0.18, d / 2 - 0.004], [w / 2 - 0.07, y + h * 0.82, d / 2 + 0.004], 0.006, 1), 'plastic_anthracite'),
    A('body', `${key}_led${i}`, flatBox([w / 2 - 0.05, y + h * 0.6, d / 2], [w / 2 - 0.03, y + h * 0.66, d / 2 + 0.003]), i % 2 ? 'emit_green' : 'emit_display'),
  ];
}

/** Kapalinová chromatografie: sestava UPLC 34,3 × 71,2 × 71,1 cm, širší HPLC se čtyřmi moduly a hmotnostní detektor. */
export function liquidChrom() {
  const stack = (key, w, d, mods, bottles) => {
    const parts = [];
    let y = 0;
    mods.forEach(([h, mat], i) => {
      parts.push(...stackModule(key, w, d, y, h, mat, i));
      y += h;
    });
    // zásobník rozpouštědel: vana a láhve s hadičkami do sestavy
    parts.push(A('body', `${key}_tray`, roundedBox([-w / 2, y, -d / 2], [w / 2, y + 0.04, d / 2 - 0.1], 0.008, 1), 'plastic_light'));
    const glass = [];
    const caps = [];
    const lines = [];
    for (let i = 0; i < bottles; i++) {
      const x = -w / 2 + 0.06 + (i % 3) * 0.1;
      const z = i < 3 ? -d / 2 + 0.12 : -d / 2 + 0.25;
      glass.push(T(lathe([[0.04, 0], [0.04, 0.15, 'c'], [0.02, 0.18], [0.02, 0.2]], { seg: 10 }), x, y + 0.04, z));
      caps.push(T(cylinder(0.024, 0, 0.022, { seg: 8 }), x, y + 0.24, z));
      lines.push(tube([[x, y + 0.262, z], [x, y + 0.3, z], [w / 2 - 0.02, y + 0.2, d / 2 - 0.12], [w / 2 - 0.02, y - 0.05, d / 2 - 0.12]], 0.0025, 4, { bend: 0.04, bendSeg: 2 }));
    }
    parts.push(A('body', `${key}_bottles`, merge(glass), 'glass_amber'), A('body', `${key}_caps`, merge(caps), 'cap_blue'), A('body', `${key}_lines`, merge(lines), 'ptfe'));
    return parts;
  };
  const uplc = one('uplc_stack_01', 'Sestava UPLC (čerpadlo, dávkovač vzorků, termostat kolon)', stack('uplc', 0.343, 0.712, [[0.18, 'plastic_white'], [0.26, 'plastic_white'], [0.22, 'plastic_light']], 4), 'liquidChrom');
  const hplc = one('hplc_stack_01', 'Sestava HPLC se čtyřmi moduly', stack('hplc', 0.37, 0.55, [[0.14, 'plastic_light'], [0.18, 'plastic_light'], [0.2, 'plastic_light'], [0.14, 'plastic_light']], 3), 'liquidChrom');
  const msk = 'ms_detector_01';
  const ms = one(msk, 'Hmotnostní detektor (trojitý kvadrupól)', [
    shell('body', msk, [-0.225, 0.01, -0.4], [0.225, 0.6, 0.4], 'plastic_white', 0.03, 2),
    A('body', `${msk}_front`, roundedBox([-0.2, 0.28, 0.39], [0.2, 0.52, 0.405], 0.01, 1), 'plastic_anthracite'),
    A('body', `${msk}_strip`, flatBox([-0.2, 0.25, 0.4], [0.2, 0.262, 0.404]), 'emit_display'),
    A('body', `${msk}_source`, merge([roundedBox([0.08, 0.6, 0.15], [0.2, 0.72, 0.32], 0.01, 1), T(cylinder(0.02, 0, 0.06, { seg: 8 }), 0.14, 0.72, 0.23)]), 'steel_brushed'),
    ...grille('body', `${msk}_side`, -0.18, 0.18, 0.06, 0.2, 0.4, 6),
    feet('body', msk, 0.4, 0.7, 0.012, 0.04),
  ], 'liquidChrom');
  return [uplc, hplc, ms];
}

/** Plynová chromatografie: GC 51,5 × 54 × 44 cm s věží automatického dávkovače, kompaktní GC 35 × 62 × 44 cm, GC-MS. */
export function gasChrom() {
  const gc = (key, w, d, h, dx = 0) => {
    const x = (v) => v + dx;
    const ring = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      ring.push(T(cylinder(0.006, 0, 0.032, { seg: 5 }), x(w * 0.15) + Math.cos(a) * 0.055, h + 0.16, -0.05 + Math.sin(a) * 0.055));
    }
    return [
      shell('body', `${key}_case`, [x(-w / 2), 0.012, -d / 2], [x(w / 2), h, d / 2], 'plastic_white', 0.012),
      // pec vlevo: dvířka s mřížkou, vpravo displej a klávesnice
      A('body', `${key}_oven`, roundedBox([x(-w / 2 + 0.015), 0.05, d / 2 - 0.004], [x(w * 0.1), h - 0.06, d / 2 + 0.01], 0.01, 1), 'plastic_light'),
      ...grille('body', `${key}_ov`, x(-w / 2 + 0.05), x(w * 0.06), 0.1, 0.25, d / 2 + 0.01, 6),
      ...screen('body', `${key}_scr`, x(w * 0.15), x(w / 2 - 0.02), h - 0.2, h - 0.05, d / 2, { buttons: 4, led: 'emit_green' }),
      // vstřikovače nahoře a věž dávkovače s karuselem lahviček
      A('body', `${key}_inlets`, merge([T(cylinder(0.03, h, h + 0.03, { seg: 8 }), x(-w * 0.25), 0, 0.05), T(cylinder(0.03, h, h + 0.03, { seg: 8 }), x(-w * 0.05), 0, 0.05)]), 'steel_brushed'),
      A('body', `${key}_tower`, merge([T(cylinder(0.07, h, h + 0.16, { seg: 12 }), x(w * 0.15), 0, -0.05), T(cylinder(0.075, h + 0.192, h + 0.22, { edge: 0.01, n: 1, seg: 12 }), x(w * 0.15), 0, -0.05)]), 'plastic_light'),
      A('body', `${key}_vials`, merge(ring), 'glass_lab'),
      feet('body', key, w - 0.04, d - 0.06, 0.012, 0.04),
    ];
  };
  const ms = [shell('body', 'gcms_ms', [0.29, 0.012, -0.27], [0.62, 0.42, 0.27], 'plastic_white', 0.012), A('body', 'gcms_ms_front', roundedBox([0.32, 0.25, 0.265], [0.59, 0.38, 0.28], 0.006, 1), 'plastic_anthracite'), ...grille('body', 'gcms_msv', 0.33, 0.58, 0.05, 0.18, 0.27, 5), cable('body', 'gcms_line', [[0.16, 0.3, 0], [0.29, 0.3, 0]], 0.02, 'steel_brushed')];
  return [
    one('gc_01', 'Plynový chromatograf s automatickým dávkovačem', gc('gc_01', 0.515, 0.54, 0.44), 'gasChrom'),
    one('gc_compact_01', 'Kompaktní plynový chromatograf', gc('gc_compact_01', 0.35, 0.62, 0.44), 'gasChrom'),
    one('gcms_01', 'Plynový chromatograf s hmotnostním detektorem', [...gc('gcms_01', 0.515, 0.54, 0.44, -0.1), ...ms], 'gasChrom'),
  ];
}

/** Sekvenátory: stolní 68,6 × 56,5 × 52,3 cm s víkem a velký stojací (šířka 86,4 cm, výška 158,8 cm). */
export function sequencers() {
  const sk = 'sequencer_bench_01';
  const bench = moving(sk, 'Stolní sekvenátor', CAT, [
    shell('body', sk, [-0.343, 0.012, -0.28], [0.343, 0.38, 0.28], 'plastic_white', 0.02, 2),
    // šikmý dotykový displej vpravo, dvířka průtokové komory vlevo, pruh kontrolky
    A('body', `${sk}_scr`, moved(roundedBox([-0.13, -0.09, -0.01], [0.13, 0.09, 0.012], 0.008, 1), at(mTranslate(0.17, 0.27, 0.27), mRotate('x', -25))), 'plastic_black'),
    A('body', `${sk}_img`, moved(flatBox([-0.12, -0.08, 0.012], [0.12, 0.08, 0.0125]), at(mTranslate(0.17, 0.27, 0.27), mRotate('x', -25))), 'emit_display'),
    A('body', `${sk}_bay`, roundedBox([-0.31, 0.06, 0.27], [0.02, 0.3, 0.29], 0.006, 1), 'plastic_light'),
    A('body', `${sk}_bar`, flatBox([-0.31, 0.03, 0.28], [0.31, 0.04, 0.284]), 'emit_display'),
    feet('body', sk, 0.62, 0.5, 0.012, 0.04),
  ], {
    node: 'lid', at: [-0.12, 0.38, -0.27], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 85, kind: 'door', prompt: 'Otevřít víko sekvenátoru',
    parts: [shell('lid', `${sk}_lid`, [-0.2, 0, 0], [0.2, 0.1, 0.48], 'plastic_white', 0.02, 1), A('lid', `${sk}_grip`, flatBox([-0.08, 0.02, 0.48], [0.08, 0.06, 0.49]), 'plastic_light')],
    note: 'Víko prostoru pro reagencie stolního sekvenátoru se zvedá dozadu asi do svislé polohy; 85°. Úvaha, neměřeno.',
  }, { gen: gen('sequencers') });
  const bk = 'sequencer_floor_01';
  const big = one(bk, 'Velký sekvenátor (stojací)', [
    shell('body', bk, [-0.432, 0.03, -0.47], [0.432, 1.588, 0.47], 'plastic_white', 0.03, 2),
    ...door('body', `${bk}_bay`, -0.38, 0.38, 0.2, 1.0, 0.465, 0.02, { mat: 'plastic_light' }),
    rail('body', `${bk}_bay`, -0.12, 0.12, 0.93, 0.485, { rad: 0.008 }),
    ...screen('body', `${bk}_scr`, -0.25, 0.25, 1.1, 1.42, 0.47, { led: 'emit_green' }),
    A('body', `${bk}_strip`, flatBox([-0.4, 1.05, 0.47], [0.4, 1.065, 0.474]), 'emit_display'),
    ...grille('body', `${bk}_kick`, -0.38, 0.38, 0.05, 0.16, 0.47, 6),
    feet('body', bk, 0.8, 0.88, 0.03, 0.06),
  ], 'sequencers', floor());
  return [bench, big];
}

/** Mikroskopy: konfokální na antivibračním stole, transmisní elektronový (TEM 120 kV), rastrovací (SEM) a stolní SEM. */
export function microscopes() {
  const ck = 'microscope_confocal_01';
  const legs = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => T(cylinder(0.06, 0, 0.65, { seg: 12 }), sx * 0.48, 0, sz * 0.33)));
  const confocal = one(ck, 'Konfokální mikroskop na antivibračním stole', [
    A('body', `${ck}_legs`, merge(legs), 'steel_painted'),
    A('body', `${ck}_top`, roundedBox([-0.6, 0.65, -0.45], [0.6, 0.75, 0.45], 0.008, 1), 'steel_dark'),
    // stativ invertovaného mikroskopu: podstavec, sloup, rameno s kondenzorem, revolver, stolek, okuláry
    A('body', `${ck}_stand`, merge([roundedBox([-0.16, 0.75, -0.3], [0.16, 0.86, 0.18], 0.02, 1), roundedBox([-0.06, 0.86, -0.32], [0.06, 1.32, -0.2], 0.02, 1), roundedBox([-0.08, 1.24, -0.3], [0.08, 1.32, 0.05], 0.02, 1)]), 'plastic_white'),
    A('body', `${ck}_stage`, merge([roundedBox([-0.15, 0.95, -0.12], [0.15, 0.97, 0.12], 0.006, 1), T(cylinder(0.035, 1.04, 1.24, { seg: 10 }), 0, 0, 0)]), 'plastic_anthracite'),
    A('body', `${ck}_turret`, T(lathe([[0.02, 0.86], [0.06, 0.88, 'c'], [0.06, 0.92, 'c'], [0.02, 0.94]], { seg: 12 }), 0, 0, 0), 'steel_chrome'),
    A('body', `${ck}_eyes`, merge([-0.03, 0.03].map((x) => moved(cylinder(0.013, 0, 0.1, { seg: 8 }), at(mTranslate(x, 0.88, 0.12), mRotate('x', 50))))), 'plastic_black'),
    // laserový zdroj a detektorová jednotka, kabely
    shell('body', `${ck}_laser`, [0.25, 0.75, -0.4], [0.55, 0.98, -0.1], 'plastic_anthracite', 0.012),
    shell('body', `${ck}_det`, [-0.55, 0.75, -0.4], [-0.25, 0.95, -0.15], 'plastic_white', 0.012),
    cable('body', ck, [[0.25, 0.85, -0.25], [0.08, 0.9, -0.25], [0.06, 1.0, -0.26]], 0.008, 'plastic_black'),
  ], 'microscopes', floor());
  const tk = 'microscope_tem_01';
  const column = [];
  const flanges = [];
  [[0.75, 0.3, 0.26], [1.05, 0.5, 0.24], [1.55, 0.25, 0.21], [1.8, 0.2, 0.18], [2.0, 0.2, 0.14]].forEach(([y, h, r]) => {
    column.push(T(cylinder(r, y, y + h, { seg: 14 }), 0, 0, -0.2));
    flanges.push(T(cylinder(r + 0.02, y + h - 0.02, y + h + 0.01, { seg: 14 }), 0, 0, -0.2));
  });
  const tem = one(tk, 'Transmisní elektronový mikroskop (TEM)', [
    shell('body', `${tk}_desk`, [-0.9, 0.02, -0.5], [0.9, 0.75, 0.5], 'plastic_light', 0.02),
    A('body', `${tk}_plate`, roundedBox([-0.9, 0.75, 0.1], [0.9, 0.78, 0.52], 0.008, 1), 'plastic_anthracite'),
    A('body', `${tk}_column`, merge(column), 'plastic_white'),
    A('body', `${tk}_flanges`, merge(flanges), 'steel_brushed'),
    A('body', `${tk}_ports`, merge([rotZ(cylinder(0.06, 0, 0.25, { seg: 10 }), 0.25, 1.0, -0.2), moved(cylinder(0.12, 0, 0.45, { seg: 12 }), mTranslate(-0.42, 0.75, -0.32))]), 'steel_brushed'),
    A('body', `${tk}_binocular`, merge([-0.03, 0.03].map((x) => moved(cylinder(0.015, 0, 0.14, { seg: 8 }), at(mTranslate(x, 1.0, 0.0), mRotate('x', 60))))), 'plastic_black'),
    ...monitor('body', `${tk}_l`, -0.5, 0.78, 0.3),
    ...monitor('body', `${tk}_r`, 0.5, 0.78, 0.3),
    A('body', `${tk}_knobs`, merge([-0.25, 0.25].map((x) => moved(cylinder(0.03, 0, 0.02, { seg: 10 }), mTranslate(x, 0.78, 0.38)))), 'plastic_black'),
  ], 'microscopes', floor({ top: 0.78 }));
  const sk = 'microscope_sem_01';
  const sem = one(sk, 'Rastrovací elektronový mikroskop (SEM)', [
    shell('body', `${sk}_base`, [-0.45, 0.02, -0.45], [0.45, 0.85, 0.45], 'plastic_white', 0.02, 2),
    ...door('body', `${sk}_chamber`, -0.25, 0.25, 0.4, 0.75, 0.445, 0.03, { mat: 'steel_brushed', r: 0.01 }),
    rail('body', `${sk}_chamber`, -0.1, 0.1, 0.58, 0.475, { rad: 0.01 }),
    A('body', `${sk}_column`, merge([T(cylinder(0.13, 0.85, 1.45, { edge: 0.01, n: 1, seg: 14 }), 0, 0, -0.05), T(cylinder(0.09, 1.45, 1.55, { edge: 0.01, n: 1, seg: 12 }), 0, 0, -0.05)]), 'plastic_white'),
    shell('body', `${sk}_desk`, [0.5, 0.02, -0.4], [1.3, 0.75, 0.4], 'plastic_light', 0.015),
    ...monitor('body', sk, 0.9, 0.75, 0.0),
    feet('body', sk, 0.85, 0.85, 0.02, 0.05),
  ], 'microscopes', floor({ top: 0.75 }));
  const dk = 'microscope_sem_desk_01';
  const desk = one(dk, 'Stolní rastrovací elektronový mikroskop', [
    shell('body', dk, [-0.165, 0.012, -0.3], [0.165, 0.38, 0.3], 'plastic_white', 0.03, 2),
    A('body', `${dk}_col`, T(cylinder(0.08, 0.38, 0.56, { edge: 0.015, n: 2, seg: 14 }), 0, 0, -0.08), 'plastic_white'),
    ...door('body', `${dk}_drawer`, -0.12, 0.12, 0.08, 0.25, 0.295, 0.02, { mat: 'plastic_light' }),
    A('body', `${dk}_knob`, rotX(cylinder(0.02, 0, 0.02, { seg: 10 }), 0, 0.165, 0.315), 'plastic_anthracite'),
    feet('body', dk, 0.3, 0.55, 0.012, 0.03),
  ], 'microscopes');
  return [confocal, tem, sem, desk];
}

/** Autoklávy: stojací 100 l plněný shora (víko na zadním pantu) a stolní s čelními dvířky. */
export function autoclaves() {
  const [w, d, h] = [0.65, 0.9, 0.985];
  const ak = 'autoclave_floor_01';
  const tall = moving(ak, 'Autokláv stojací 100 l, plněný shora', CAT, [
    shell('body', ak, [-w / 2, 0.04, -d / 2], [w / 2, h, d / 2], 'steel_brushed', 0.02, 2),
    A('body', `${ak}_rim`, T(torus(0.23, 0.015, h + 0.005, { seg: 20, n: 4 }), 0, 0, -0.08), 'steel_dark'),
    ...screen('body', `${ak}_scr`, -0.25, 0.1, h - 0.22, h - 0.07, d / 2, { buttons: 4, led: 'emit_green' }),
    A('body', `${ak}_gauge`, merge([rotX(cylinder(0.05, 0, 0.03, { seg: 14 }), 0.2, h - 0.15, d / 2)]), 'steel_chrome'),
    A('body', `${ak}_dial`, flatBox([0.16, h - 0.19, d / 2 + 0.03], [0.24, h - 0.11, d / 2 + 0.032]), 'label_paper'),
    ...grille('body', `${ak}_kick`, -w / 2 + 0.05, w / 2 - 0.05, 0.08, 0.35, d / 2, 8),
    feet('body', ak, w, d, 0.04, 0.06),
  ], {
    node: 'lid', at: [0, h, -0.32], joint: 'lid', type: 'hinge', axis: [-1, 0, 0], max: 85, kind: 'door', prompt: 'Otevřít víko autoklávu',
    parts: [A('lid', `${ak}_lid`, T(lathe([[0, 0.07], [0.2, 0.065], [0.25, 0.04, 'c'], [0.25, 0]], { seg: 20 }), 0, 0, 0.24), 'steel_brushed'), A('lid', `${ak}_wheel`, merge([T(torus(0.09, 0.012, 0.1, { seg: 16, n: 4 }), 0, 0, 0.24), T(cylinder(0.02, 0.06, 0.1, { seg: 8 }), 0, 0, 0.24)]), 'plastic_black')],
    note: 'Víko stojacího autoklávu na zadním pantu s protizávažím se zvedá skoro do svislé polohy; 85°. Úvaha podle katalogu výrobce, neměřeno.',
  }, { gen: gen('autoclaves'), place: { mount: 'floor' }, group: 'world' });
  const [bw, bd, bh] = [0.5, 0.62, 0.45];
  const bk = 'autoclave_bench_01';
  const bench = moving(bk, 'Stolní autokláv s čelními dvířky', CAT, [
    shell('body', bk, [-bw / 2, 0.012, -bd / 2], [bw / 2, bh, bd / 2], 'plastic_white', 0.02, 2),
    A('body', `${bk}_mouth`, rotX(lathe([[0.17, 0], [0.155, 0.006, 'c'], [0.13, 0.006]], { seg: 20 }), -0.06, 0.2, bd / 2), 'steel_dark'),
    ...screen('body', `${bk}_scr`, 0.12, 0.23, 0.28, 0.42, bd / 2, { buttons: 3 }),
    feet('body', bk, bw - 0.04, bd - 0.06, 0.012, 0.04),
  ], {
    node: 'door', at: [-bw / 2 + 0.02, 0.04, bd / 2], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 100, kind: 'door', prompt: 'Otevřít autokláv',
    parts: [A('door', `${bk}_door`, rotX(lathe([[0, 0.04], [0.14, 0.035], [0.16, 0.02, 'c'], [0.16, 0]], { seg: 20 }), 0.17, 0.16, 0), 'steel_brushed'), A('door', `${bk}_lever`, roundedBox([0.28, 0.14, 0.03], [0.36, 0.18, 0.07], 0.01, 1), 'plastic_black')],
    note: 'Kruhová dvířka stolního autoklávu na levém pantu se otvírají o 90 až 110°; 100°. Úvaha, neměřeno.',
  }, { gen: gen('autoclaves') });
  return [tall, bench];
}

/** Biologický bezpečnostní box třídy II (1,2 a 1,8 m) s posuvným čelním sklem a horizontální laminární box. */
export function cabinetsBio() {
  const stand = (key, w, d, hgt) => {
    const g = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.push(T(flatBox([-0.025, 0, -0.025], [0.025, hgt, 0.025]), sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.08)));
    g.push(flatBox([-w / 2 + 0.05, 0.2, -d / 2 + 0.06], [w / 2 - 0.05, 0.23, -d / 2 + 0.1]), flatBox([-w / 2 + 0.05, 0.2, d / 2 - 0.1], [w / 2 - 0.05, 0.23, d / 2 - 0.06]));
    return [A('body', `${key}_stand`, merge(g), 'steel_painted'), feet('body', `${key}_s`, w - 0.1, d - 0.16, 0.02, 0)];
  };
  const bsc = (id, title, w) => {
    const [d, h, st] = [0.8, 1.52, 0.71];
    const parts = [
      ...stand(id, w, d, st),
      shell('body', `${id}_base`, [-w / 2, st, -d / 2], [w / 2, st + 0.15, d / 2], 'plastic_white', 0.01),
      ...grille('body', `${id}_grill`, -w / 2 + 0.08, w / 2 - 0.08, st + 0.13, st + 0.15, d / 2 - 0.02, 3),
      A('body', `${id}_tray`, roundedBox([-w / 2 + 0.05, st + 0.15, -d / 2 + 0.05], [w / 2 - 0.05, st + 0.16, d / 2 - 0.08], 0.004, 1), 'steel_brushed'),
      shell('body', `${id}_l`, [-w / 2, st + 0.15, -d / 2], [-w / 2 + 0.05, st + h - 0.3, d / 2], 'plastic_white', 0.01),
      shell('body', `${id}_r`, [w / 2 - 0.05, st + 0.15, -d / 2], [w / 2, st + h - 0.3, d / 2], 'plastic_white', 0.01),
      A('body', `${id}_back`, flatBox([-w / 2 + 0.05, st + 0.15, -d / 2], [w / 2 - 0.05, st + h - 0.3, -d / 2 + 0.04]), 'steel_brushed'),
      A('body', `${id}_glassl`, flatBox([-w / 2 + 0.002, st + 0.4, -d / 2 + 0.1], [-w / 2 + 0.006, st + h - 0.4, d / 2 - 0.1]), 'glass_tinted'),
      shell('body', `${id}_head`, [-w / 2, st + h - 0.3, -d / 2], [w / 2, st + h, d / 2], 'plastic_white', 0.012),
      ...screen('body', `${id}_scr`, -w / 2 + 0.1, -w / 2 + 0.45, st + h - 0.25, st + h - 0.08, d / 2, { buttons: 4, led: 'emit_green' }),
      A('body', `${id}_filter`, flatBox([-w / 2 + 0.15, st + h, -d / 2 + 0.15], [w / 2 - 0.15, st + h + 0.01, d / 2 - 0.25]), 'plastic_light'),
      A('body', `${id}_uv`, flatBox([-w / 2 + 0.05, st + h - 0.32, -d / 2 + 0.05], [w / 2 - 0.05, st + h - 0.3, d / 2 - 0.1]), 'emit_uv'),
    ];
    return moving(id, title, CAT, parts, {
      node: 'sash', at: [0, st + 0.36, d / 2 - 0.06], joint: 'sash', type: 'slider', axis: [0, 1, 0], max: 0.25, kind: 'drawer', prompt: 'Posunout čelní sklo',
      parts: [...door('sash', `${id}_sash`, -w / 2 + 0.05, w / 2 - 0.05, -0.02, h - 0.68, 0, 0.02, { mat: 'aluminium', window: [0.025, 0.04], flat: true }), rail('sash', `${id}_sash`, -0.25, 0.25, 0.0, 0.02, { rad: 0.007, seg: 6 })],
      note: 'Čelní sklo boxu třídy II jede svisle; pracovní otvor 20 až 25 cm, nahoru až o 25 cm pro čištění. Úvaha podle katalogů (Thermo Scientific, Esco), neměřeno.',
    }, { gen: gen('cabinetsBio'), place: { mount: 'floor' }, group: 'world' });
  };
  const fk = 'laminar_flow_01';
  const flow = one(fk, 'Horizontální laminární box (čistý stůl)', [
    ...stand(fk, 1.2, 0.7, 0.75),
    shell('body', `${fk}_hood`, [-0.6, 0.77, -0.35], [0.6, 1.45, -0.25], 'plastic_white', 0.01),
    shell('body', `${fk}_top`, [-0.6, 1.35, -0.35], [0.6, 1.45, 0.35], 'plastic_white', 0.01),
    A('body', `${fk}_filter`, flatBox([-0.55, 0.82, -0.25], [0.55, 1.33, -0.24]), 'plastic_light'),
    A('body', `${fk}_desk`, roundedBox([-0.6, 0.75, -0.35], [0.6, 0.77, 0.35], 0.005, 1), 'steel_brushed'),
    A('body', `${fk}_sides`, merge([flatBox([-0.6, 0.77, -0.25], [-0.594, 1.35, 0.33]), flatBox([0.594, 0.77, -0.25], [0.6, 1.35, 0.33])]), 'glass_tinted'),
    ...screen('body', `${fk}_scr`, 0.2, 0.5, 1.37, 1.43, 0.35, { buttons: 2, led: 'emit_green' }),
    A('body', `${fk}_lamp`, flatBox([-0.5, 1.338, -0.2], [0.5, 1.35, 0.2]), 'emit_cool'),
  ], 'cabinetsBio', floor({ top: 0.77 }));
  return [bsc('bsc_class2_120_01', 'Biologický bezpečnostní box třídy II, 1,2 m', 1.3), bsc('bsc_class2_180_01', 'Biologický bezpečnostní box třídy II, 1,8 m', 1.9), flow];
}

/** CO₂ inkubátor 63,7 × 88 × 90 cm na podstavci, dvojice nad sebou, lyofilizátor s komorou, robot na pipetování, průtokový cytometr, NMR. */
export function cultureAndMore() {
  const [w, d, h] = [0.637, 0.88, 0.9];
  const cabinet = (key, y0) => [
    shell('body', `${key}_l`, [-w / 2, y0, -d / 2], [-w / 2 + 0.05, y0 + h, d / 2 - 0.06], 'plastic_white', 0.012),
    shell('body', `${key}_r`, [w / 2 - 0.05, y0, -d / 2], [w / 2, y0 + h, d / 2 - 0.06], 'plastic_white', 0.012),
    shell('body', `${key}_t`, [-w / 2 + 0.048, y0 + h - 0.15, -d / 2], [w / 2 - 0.048, y0 + h, d / 2 - 0.06], 'plastic_white', 0.012),
    A('body', `${key}_bb`, merge([flatBox([-w / 2 + 0.05, y0, -d / 2], [w / 2 - 0.05, y0 + 0.05, d / 2 - 0.06]), flatBox([-w / 2 + 0.05, y0, -d / 2], [w / 2 - 0.05, y0 + h, -d / 2 + 0.05])]), 'plastic_white'),
    // vnitřní skleněná dvířka a nerezové police za nimi
    A('body', `${key}_inner`, flatBox([-w / 2 + 0.05, y0 + 0.05, d / 2 - 0.075], [w / 2 - 0.05, y0 + h - 0.15, d / 2 - 0.068]), 'glass_tinted'),
    ...[0.28, 0.48].map((f) => wireShelf('body', `${key}_${Math.round(f * 100)}`, -w / 2 + 0.06, w / 2 - 0.06, -d / 2 + 0.06, d / 2 - 0.09, y0 + h * f, 'steel_brushed', 0.12)),
    ...screen('body', `${key}_scr`, -w / 2 + 0.06, w / 2 - 0.25, y0 + h - 0.13, y0 + h - 0.03, d / 2 - 0.06, { buttons: 3, led: 'emit_green' }),
  ];
  const inc = (id, title, y0, extra) => moving(id, title, CAT, [...extra, ...cabinet(id, y0)], {
    node: 'door', at: [-w / 2, y0 + 0.02, d / 2 - 0.06], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 110, kind: 'door', prompt: 'Otevřít inkubátor',
    parts: [...door('door', `${id}_door`, 0, w, 0, h - 0.17, 0, 0.05, { mat: 'plastic_white', gasket: true }), barHandle('door', `${id}_door`, w - 0.05, h * 0.25, h * 0.55, 0.05, { rad: 0.009 })],
    note: 'Vnější dvířka CO₂ inkubátoru na pantu se otvírají o 90 až 180° (lze přehodit stranu); 110°. Úvaha podle katalogu výrobce, neměřeno.',
  }, { gen: gen('cultureAndMore'), place: { mount: 'floor' }, group: 'world', colliders: [cbox('body', [-w / 2, 0, -d / 2], [w / 2, y0 + h, d / 2 - 0.06])] });
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push(T(flatBox([-0.02, 0, -0.02], [0.02, 0.6, 0.02]), sx * 0.27, 0, sz * 0.35));
  legs.push(flatBox([-0.3, 0.57, -0.4], [0.3, 0.6, 0.38]));
  const single = inc('incubator_co2_01', 'CO₂ inkubátor 165 l na podstavci', 0.6, [A('body', 'incubator_co2_01_stand', merge(legs), 'steel_painted')]);
  const double = inc('incubator_co2_stack_01', 'Dvojice CO₂ inkubátorů nad sebou', 0.12 + h, [
    A('body', 'incubator_co2_stack_01_base', flatBox([-0.3, 0, -0.4], [0.3, 0.12, 0.35]), 'steel_dark'),
    shell('body', 'incubator_co2_stack_01_low', [-w / 2, 0.12, -d / 2], [w / 2, 0.12 + h, d / 2 - 0.06], 'plastic_white', 0.012),
    ...door('body', 'incubator_co2_stack_01_lowd', -w / 2, w / 2, 0.14, 0.12 + h - 0.15, d / 2 - 0.06, 0.05, { mat: 'plastic_white' }),
    barHandle('body', 'incubator_co2_stack_01_lowd', w / 2 - 0.05, 0.35, 0.62, d / 2 - 0.01, { rad: 0.009 }),
    ...screen('body', 'incubator_co2_stack_01_lows', -w / 2 + 0.06, w / 2 - 0.25, 0.12 + h - 0.13, 0.12 + h - 0.03, d / 2 - 0.06, { led: 'emit_green' }),
  ]);
  const lk = 'lyophilizer_01';
  const shelves = [0, 1, 2].map((i) => T(cylinder(0.13, 0, 0.006, { seg: 14 }), 0, 0.52 + i * 0.1, -0.05));
  const ports = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    ports.push(moved(cylinder(0.012, 0, 0.05, { seg: 6 }), at(mTranslate(Math.cos(a) * 0.15, 0.68, -0.05 + Math.sin(a) * 0.15), mRotate('y', (-a * 180) / Math.PI), mRotate('z', -90))));
  }
  const lyo = one(lk, 'Lyofilizátor s akrylovou komorou', [
    shell('body', lk, [-0.325, 0.012, -0.3], [0.325, 0.45, 0.3], 'plastic_white', 0.02, 2),
    ...screen('body', `${lk}_scr`, -0.28, 0.0, 0.3, 0.42, 0.3, { buttons: 3, led: 'emit_green' }),
    ...grille('body', `${lk}_v`, 0.05, 0.28, 0.06, 0.25, 0.3, 7),
    A('body', `${lk}_bell`, T(lathe([[0.15, 0], [0.15, 0.3, 'c'], [0.13, 0.33], [0, 0.34]], { seg: 20 }), 0, 0.45, -0.05), 'plastic_ps'),
    A('body', `${lk}_shelves`, merge(shelves), 'steel_brushed'),
    A('body', `${lk}_ports`, merge(ports), 'rubber_black'),
    A('body', `${lk}_base`, T(cylinder(0.16, 0.45, 0.47, { seg: 20 }), 0, 0, -0.05), 'steel_brushed'),
    feet('body', lk, 0.6, 0.55, 0.012, 0.04),
  ], 'cultureAndMore');
  const rk = 'liquid_handler_01';
  const plates = [-0.4, -0.2, 0.0, 0.2, 0.4].map((x) => flatBox([x - 0.064, 0.12, -0.04], [x + 0.064, 0.135, 0.045]));
  const robot = one(rk, 'Pipetovací robot v proskleném krytu', [
    shell('body', `${rk}_base`, [-0.6, 0.012, -0.37], [0.6, 0.12, 0.37], 'plastic_white', 0.012),
    A('body', `${rk}_posts`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => flatBox([sx * 0.585 - 0.015, 0.12, sz * 0.355 - 0.015], [sx * 0.585 + 0.015, 0.9, sz * 0.355 + 0.015])))), 'aluminium'),
    shell('body', `${rk}_roof`, [-0.6, 0.86, -0.37], [0.6, 0.9, 0.37], 'plastic_white', 0.008),
    A('body', `${rk}_glass`, merge([flatBox([-0.57, 0.12, 0.365], [0.57, 0.86, 0.369]), flatBox([-0.6, 0.12, -0.34], [-0.596, 0.86, 0.34]), flatBox([0.596, 0.12, -0.34], [0.6, 0.86, 0.34])]), 'glass_tinted'),
    A('body', `${rk}_gantry`, merge([roundedBox([-0.57, 0.7, -0.3], [0.57, 0.75, -0.24], 0.006, 1), roundedBox([-0.1, 0.45, -0.3], [0.02, 0.75, -0.18], 0.01, 1)]), 'plastic_light'),
    A('body', `${rk}_tips`, merge([0, 1, 2, 3, 4, 5, 6, 7].map((i) => T(cylinder(0.003, 0.4, 0.45, { seg: 4 }), -0.08 + i * 0.012, 0, -0.2))), 'steel_brushed'),
    A('body', `${rk}_plates`, merge(plates), 'plastic_ps'),
    A('body', `${rk}_tipbox`, merge([-0.3, 0.1].map((x) => roundedBox([x - 0.064, 0.135, -0.04], [x + 0.064, 0.16, 0.045], 0.004, 1))), 'cap_yellow'),
  ], 'cultureAndMore');
  const yk = 'cytometer_flow_01';
  const cyto = one(yk, 'Průtokový cytometr', [
    shell('body', yk, [-0.3, 0.012, -0.3], [0.3, 0.45, 0.3], 'plastic_white', 0.03, 2),
    A('body', `${yk}_port`, merge([roundedBox([0.08, 0.18, 0.29], [0.28, 0.36, 0.31], 0.01, 1)]), 'plastic_anthracite'),
    A('body', `${yk}_tube`, rotX(lathe([[0.006, -0.08], [0.006, 0, 'c'], [0.01, 0]], { seg: 8 }), 0.18, 0.24, 0.33), 'plastic_ps'),
    A('body', `${yk}_tanks`, merge([-0.2, -0.08].map((x) => T(lathe([[0.05, 0], [0.05, 0.14, 'c'], [0.02, 0.17], [0.02, 0.19]], { seg: 10 }), x, 0.45, -0.15))), 'plastic_hdpe'),
    A('body', `${yk}_led`, flatBox([-0.05, 0.3, 0.3], [0.05, 0.315, 0.305]), 'emit_green'),
    feet('body', yk, 0.55, 0.55, 0.012, 0.04),
  ], 'cultureAndMore');
  const nk = 'nmr_magnet_01';
  const nmr = one(nk, 'NMR spektrometr (supravodivý magnet)', [
    A('body', `${nk}_legs`, merge([0, 1, 2].map((i) => T(lathe([[0.05, 0], [0.05, 0.5, 'c'], [0.03, 0.6]], { seg: 10 }), Math.cos(i * 2.094) * 0.25, 0, Math.sin(i * 2.094) * 0.25))), 'steel_painted'),
    A('body', `${nk}_probe`, T(cylinder(0.05, 0.1, 0.7, { seg: 10 }), 0, 0, 0), 'steel_dark'),
    A('body', `${nk}_dewar`, T(lathe([[0.32, 0], [0.35, 0.04, 'c'], [0.35, 0.82], [0.3, 0.9], [0.18, 0.92, 'c'], [0, 0.92]], { seg: 24 }), 0, 0.65, 0), 'plastic_light'),
    A('body', `${nk}_turrets`, merge([T(cylinder(0.18, 1.57, 1.62, { seg: 16 }), 0, 0, 0), ...[0.12, -0.12].map((x) => T(cylinder(0.03, 1.62, 1.85, { edge: 0.008, n: 1, seg: 8 }), x, 0, 0)), T(cylinder(0.02, 1.62, 1.8, { seg: 8 }), 0, 0, 0.12)]), 'steel_brushed'),
    A('body', `${nk}_line`, T(torus(0.6, 0.01, 0.011, { seg: 24, n: 3 }), 0, 0, 0), 'paint_yellow'),
  ], 'cultureAndMore', floor());
  return [single, double, lyo, robot, cyto, nmr];
}

/** Myčka laboratorního skla pod pult (dvířka sklopná dolů), výrobník ledu a nástěnná úprava ultračisté vody. */
export function utilities() {
  const [w, d, h] = [0.6, 0.6, 0.85];
  const wk = 'washer_labware_01';
  const washer = moving(wk, 'Myčka laboratorního skla pod pult', CAT, [
    shell('body', `${wk}_l`, [-w / 2, 0.08, -d / 2], [-w / 2 + 0.03, h, d / 2 - 0.04], 'steel_brushed', 0.006),
    shell('body', `${wk}_r`, [w / 2 - 0.03, 0.08, -d / 2], [w / 2, h, d / 2 - 0.04], 'steel_brushed', 0.006),
    A('body', `${wk}_bb`, merge([flatBox([-w / 2 + 0.03, 0.08, -d / 2], [w / 2 - 0.03, 0.1, d / 2 - 0.04]), flatBox([-w / 2 + 0.03, 0.08, -d / 2], [w / 2 - 0.03, h, -d / 2 + 0.03]), flatBox([-w / 2 + 0.03, h - 0.12, -d / 2], [w / 2 - 0.03, h, d / 2 - 0.04])]), 'steel_brushed'),
    ...[0.25, 0.5].map((y) => wireShelf('body', `${wk}_${Math.round(y * 100)}`, -w / 2 + 0.04, w / 2 - 0.04, -d / 2 + 0.05, d / 2 - 0.08, y, 'steel_chrome', 0.05)),
    A('body', `${wk}_plinth`, flatBox([-w / 2 + 0.01, 0, -d / 2 + 0.02], [w / 2 - 0.01, 0.08, d / 2 - 0.08]), 'plastic_anthracite'),
    ...screen('body', `${wk}_scr`, -0.25, 0.25, h - 0.1, h - 0.02, d / 2 - 0.04, { buttons: 4, led: 'emit_green' }),
  ], {
    node: 'door', at: [0, 0.08, d / 2 - 0.04], joint: 'drop', type: 'hinge', axis: [1, 0, 0], max: 90, kind: 'door', prompt: 'Otevřít myčku',
    parts: [...door('door', `${wk}_door`, -w / 2 + 0.005, w / 2 - 0.005, 0, h - 0.205, 0, 0.04, { mat: 'steel_brushed' }), rail('door', `${wk}_door`, -0.15, 0.15, h - 0.25, 0.04, { rad: 0.008, seg: 6 })],
    note: 'Dvířka myčky se sklápějí dolů do vodorovné polohy, jako u kuchyňské myčky; 90°. Úvaha, neměřeno.',
  }, { gen: gen('utilities'), place: { mount: 'floor' }, group: 'world', colliders: [cbox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2 - 0.04])] });
  const ik = 'ice_maker_01';
  const ice = one(ik, 'Výrobník šupinového ledu', [
    shell('body', ik, [-0.25, 0.04, -0.3], [0.25, 0.9, 0.3], 'steel_brushed', 0.012),
    ...door('body', `${ik}_bin`, -0.2, 0.2, 0.5, 0.78, 0.3, 0.03, { mat: 'steel_brushed', r: 0.006 }),
    rail('body', `${ik}_bin`, -0.12, 0.12, 0.74, 0.33, { rad: 0.009, seg: 6 }),
    ...grille('body', `${ik}_kick`, -0.2, 0.2, 0.08, 0.3, 0.3, 7),
    feet('body', ik, 0.44, 0.54, 0.04, 0.04),
  ], 'utilities', floor());
  const qk = 'water_ultrapure_01';
  const water = simple(qk, 'Úprava ultračisté vody na zeď s výdejním ramenem', CAT, [
    shell('body', qk, [-0.18, 0, 0], [0.18, 0.5, 0.18], 'plastic_white', 0.02, 2),
    ...screen('body', `${qk}_scr`, -0.12, 0.12, 0.3, 0.42, 0.18, { led: 'emit_display' }),
    A('body', `${qk}_arm`, merge([tube([[0.12, 0.25, 0.18], [0.12, 0.25, 0.4], [0.12, 0.17, 0.42]], 0.012, 8, { bend: 0.03, bendSeg: 3 }), T(cylinder(0.02, 0.24, 0.27, { seg: 8 }), 0.12, 0, 0.19)]), 'plastic_white'),
    A('body', `${qk}_cart`, roundedBox([-0.16, 0.04, 0.18], [-0.04, 0.14, 0.2], 0.01, 1), 'plastic_light'),
  ], { gen: gen('utilities'), components: { physics: { body: 'static' }, place: { mount: 'wall', height: 0.9 } }, group: 'world' });
  return [washer, ice, water];
}

export const LARGE = [liquidChrom, gasChrom, sequencers, microscopes, autoclaves, cabinetsBio, cultureAndMore, utilities];
