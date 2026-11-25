// Sada kit_it: open space IT firmy a vývojového centra. Stoly (dvojitý blok pro čtyři s přepážkami, stůl
// s nastavitelnou výškou bílý a dubový), kancelářské židle se síťovým opěradlem ve třech barvách, jednací stoly,
// telefonní budka s dveřmi, tabule, akustické panely, rostliny, sedačky a vaky, kuchyňka s kávovarem, výdejník
// vody, šatní skříňky, televize a projektor, stolní tenis a fotbálek, třídění odpadu, věšák, skleněná příčka,
// recepce. Rozměry podle norem kancelářského nábytku (deska 0,72 až 0,75 m, sedák 0,42 až 0,5 m), úvaha.
// Ondřej 25. 11. 2026 v 1:29: kus po kuse; hladké sítě ze stavebnice appliance.mjs, do 1 500 △ na kus.

import { cbox, shiftParts } from '../lib.mjs';
import { simple, moving, staticFloor } from '../lab/common.mjs';
import { A, shell, door, barHandle, grille, screen, casters, top, merge, T, roundedBox, flatBox, cylinder, tube, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { sphere } from '../mesh/solids.mjs';
import { mScale } from '../mesh/geo.mjs';
import { monitorParts, keyboardParts, laptopParts } from './computers.mjs';

const CAT = 'it.office';
const gen = (f) => `it/office.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const floor = (topY) => ({ components: staticFloor(topY), group: 'world' });
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...floor(), ...o });
const shift = (parts, dx, dy, dz) => shiftParts(parts, dx, dy, dz);
const rotX = (g, x, y, z, deg = 90) => moved(g, at(mTranslate(x, y, z), mRotate('x', deg)));

/** Rám stolové nohy (tvar T: sloupek, patka s kluzáky) v x, deska ve výšce h, hloubka d. */
function legT(key, x, h, d, mat = 'steel_painted') {
  return [A('body', `${key}_leg_${Math.round(x * 1000)}`, merge([roundedBox([x - 0.035, 0.02, -0.035], [x + 0.035, h - 0.03, 0.035], 0.008, 1), flatBox([x - 0.035, 0.0, -d / 2 + 0.05], [x + 0.035, 0.04, d / 2 - 0.05]), flatBox([x - 0.03, h - 0.06, -d / 2 + 0.08], [x + 0.03, h - 0.03, d / 2 - 0.08])]), mat)];
}

/** Stoly: blok pro čtyři s přepážkami (prázdný a vybavený), stůl s nastavitelnou výškou (bílý a dubový). */
export function desks() {
  const H = 0.74;
  const block = (k, equipped) => {
    const parts = [
      top('body', k, 0, 0, 3.2, 1.6, H - 0.025, H, 'laminate_white', 0.02),
      ...[-1.55, 0, 1.55].flatMap((x) => legT(k, x, H - 0.025, 1.5)),
      A('body', `${k}_tray`, flatBox([-1.5, H - 0.16, -0.12], [1.5, H - 0.05, 0.12]), 'steel_painted'),
      A('body', `${k}_screens`, merge([roundedBox([-1.6, H, -0.015], [1.6, H + 0.4, 0.015], 0.012, 1), roundedBox([-0.012, H, -0.8], [0.012, H + 0.3, 0.8], 0.012, 1)]), 'felt_grey'),
    ];
    if (equipped) {
      parts.push(...shift([...monitorParts(-0.29, 0, 24, 'screen_code'), ...monitorParts(0.29, 0, 24, 'screen_doc'), ...keyboardParts(0, 0.3)], -0.8, H, -0.15), ...shift(laptopParts(0, 0, 14), 0.8, H, -0.35));
      parts.push(...shift([...monitorParts(0, 0, 27, 'screen_graph'), ...keyboardParts(0, 0.3)], -0.8, H, 0.2), ...shift(monitorParts(0, 0, 34, 'screen_code', { wide: true }), 0.8, H, 0.2));
    }
    return parts;
  };
  const sitStand = (k, mat, v) => {
    const cols = [];
    for (const x of [-0.65, 0.65]) cols.push(roundedBox([x - 0.04, 0.0, -0.35], [x + 0.04, 0.03, 0.35], 0.008, 1), roundedBox([x - 0.035, 0.03, -0.045], [x + 0.035, 0.4, 0.045], 0.006, 1));
    return [
      top('body', k, 0, 0, 1.6, 0.8, 0.72, 0.745, mat, 0.02),
      A('body', `${k}_base`, merge(cols), 'steel_painted'),
      A('body', `${k}_inner`, merge([-0.65, 0.65].map((x) => roundedBox([x - 0.028, 0.4, -0.035], [x + 0.028, 0.7, 0.035], 0.005, 1))), 'steel_brushed'),
      A('body', `${k}_frame`, merge([flatBox([-0.65, 0.68, -0.03], [0.65, 0.72, 0.03]), ...[-0.65, 0.65].map((x) => flatBox([x - 0.03, 0.68, -0.35], [x + 0.03, 0.72, 0.35]))]), 'steel_painted'),
      A('body', `${k}_glides`, merge([-0.65, 0.65].flatMap((x) => [-0.32, 0.32].map((z) => T(cylinder(0.018, 0, 0.006, { seg: 6 }), x, 0, z)))), 'rubber_black'),
      A('body', `${k}_ctrl`, roundedBox([0.55, 0.69, 0.36], [0.7, 0.72, 0.41], 0.008, 1), v ? 'bezel_black' : 'key_white'),
      A('body', `${k}_ctrlbtn`, merge([0.59, 0.62, 0.66].map((x) => flatBox([x - 0.008, 0.716, 0.37], [x + 0.008, 0.722, 0.385]))), 'key_black'),
    ];
  };
  return [
    one('desk_bench4_01', 'Blok stolů pro čtyři s přepážkami', block('desk_bench4_01', false), 'desks', floor(H)),
    one('desk_bench4_02', 'Blok stolů pro čtyři s přepážkami a počítači', block('desk_bench4_02', true), 'desks', { ...floor(H), params: { assembly: true } }),
    one('desk_sitstand_01', 'Stůl s nastavitelnou výškou, bílý', sitStand('desk_sitstand_01', 'laminate_white', 0), 'desks', { ...floor(0.745), params: { deck: [-0.38, 0.38] } }),
    one('desk_sitstand_02', 'Stůl s nastavitelnou výškou, dubový', sitStand('desk_sitstand_02', 'laminate_oak', 1), 'desks', { ...floor(0.745), params: { deck: [-0.38, 0.38] } }),
  ];
}

/** Kancelářská židle se síťovým opěradlem: černá, šedá, modrá. Kříž s pěti rameny a kolečky, píst, čalouněný sedák,
 * opěradlo z rámu a síťoviny s bederní opěrkou, područky s polstrováním. */
export function chairs() {
  return [['fabric_charcoal', 'černá'], ['felt_grey', 'šedá'], ['felt_blue', 'modrá']].map(([seat, name], v) => {
    const id = `chair_task_${pad(v + 1)}`;
    const arms = [];
    const wheels = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      const [cx, cz] = [Math.cos(a), Math.sin(a)];
      arms.push(tube([[0, 0.11, 0], [cx * 0.3, 0.085, cz * 0.3]], 0.018, 6));
      wheels.push(moved(cylinder(0.028, -0.014, 0.014, { seg: 6 }), at(mTranslate(cx * 0.31, 0.028, cz * 0.31), mRotate('y', (-a * 180) / Math.PI), mRotate('z', 90))));
    }
    const parts = [
      A('body', `${id}_star`, merge([...arms, T(cylinder(0.045, 0.08, 0.13, { seg: 10 }), 0, 0, 0)]), 'bezel_black'),
      A('body', `${id}_wheels`, merge(wheels), 'rubber_black'),
      A('body', `${id}_lift`, merge([T(cylinder(0.03, 0.13, 0.3, { seg: 10 }), 0, 0, 0), T(cylinder(0.016, 0.3, 0.44, { seg: 8 }), 0, 0, 0)]), 'steel_chrome'),
      A('body', `${id}_mech`, roundedBox([-0.13, 0.42, -0.13], [0.13, 0.46, 0.13], 0.01, 1), 'bezel_black'),
      A('body', `${id}_seat`, roundedBox([-0.25, 0.46, -0.24], [0.25, 0.53, 0.24], 0.03, 1), seat),
      A('body', `${id}_spine`, tube([[0, 0.47, -0.2], [0, 0.5, -0.29], [0, 0.65, -0.3]], 0.016, 6, { bend: 0.06, bendSeg: 2 }), 'bezel_black'),
      A('body', `${id}_frame`, tube([[-0.22, 0.62, -0.3], [-0.24, 1.08, -0.3], [0.24, 1.08, -0.3], [0.22, 0.62, -0.3], [-0.22, 0.62, -0.3]], 0.014, 5, { bend: 0.06, bendSeg: 2 }), 'bezel_black'),
      A('body', `${id}_mesh`, flatBox([-0.225, 0.63, -0.302], [0.225, 1.07, -0.296]), 'mesh_black'),
      A('body', `${id}_lumbar`, roundedBox([-0.17, 0.7, -0.296], [0.17, 0.77, -0.27], 0.012, 1), seat),
      A('body', `${id}_armposts`, merge([-1, 1].map((s) => tube([[s * 0.2, 0.47, -0.04], [s * 0.27, 0.5, -0.04], [s * 0.27, 0.68, -0.04]], 0.014, 6, { bend: 0.03, bendSeg: 2 }))), 'bezel_black'),
      A('body', `${id}_armpads`, merge([-1, 1].map((s) => roundedBox([s * 0.27 - 0.035, 0.68, -0.16], [s * 0.27 + 0.035, 0.705, 0.1], 0.012, 1))), 'bezel_black'),
    ];
    return one(id, `Kancelářská židle se síťovým opěradlem (${name})`, parts, 'chairs', { components: staticFloor() });
  });
}

/** Jednací stoly 2,4 m (dub) a 4 m (bílý s kanálem na kabely); telefonní budka s prosklenými dveřmi. */
export function meeting() {
  const table = (k, L, mat) => [
    top('body', k, 0, 0, L, 1.2, 0.72, 0.75, mat, 0.08),
    ...[-L / 2 + 0.3, L / 2 - 0.3].flatMap((x) => legT(k, x, 0.72, 1.0)),
    A('body', `${k}_beam`, flatBox([-L / 2 + 0.3, 0.62, -0.03], [L / 2 - 0.3, 0.7, 0.03]), 'steel_painted'),
    A('body', `${k}_port`, roundedBox([-0.15, 0.748, -0.06], [0.15, 0.754, 0.06], 0.004, 1), 'alu_space'),
    A('body', `${k}_sockets`, merge([-0.08, 0.0, 0.08].map((x) => flatBox([x - 0.02, 0.752, -0.03], [x + 0.02, 0.756, 0.03]))), 'bezel_black'),
  ];
  const [w, d, h] = [1.0, 1.0, 2.2];
  const bk = 'booth_phone_01';
  const boothParts = [
    A('body', `${bk}_floor`, roundedBox([-w / 2, 0, -d / 2], [w / 2, 0.05, d / 2], 0.01, 1), 'felt_grey'),
    shell('body', `${bk}_l`, [-w / 2, 0, -d / 2], [-w / 2 + 0.05, h, d / 2], 'felt_green', 0.015),
    shell('body', `${bk}_r`, [w / 2 - 0.05, 0, -d / 2], [w / 2, h, d / 2], 'felt_green', 0.015),
    shell('body', `${bk}_b`, [-w / 2 + 0.04, 0, -d / 2], [w / 2 - 0.04, h, -d / 2 + 0.05], 'felt_green', 0.015),
    shell('body', `${bk}_t`, [-w / 2 + 0.04, h - 0.08, -d / 2], [w / 2 - 0.04, h, d / 2], 'felt_green', 0.015),
    A('body', `${bk}_desk`, roundedBox([-w / 2 + 0.05, 0.9, -d / 2 + 0.05], [w / 2 - 0.05, 0.93, -d / 2 + 0.35], 0.008, 1), 'laminate_oak'),
    A('body', `${bk}_lamp`, flatBox([-0.2, h - 0.095, -0.2], [0.2, h - 0.08, 0.2]), 'emit_warm'),
    ...grille('body', `${bk}_vent`, -0.3, 0.3, h - 0.2, h - 0.12, -d / 2 + 0.05, 4),
    A('body', `${bk}_frame`, merge([flatBox([-w / 2 + 0.05, 0.05, d / 2 - 0.04], [-w / 2 + 0.08, h - 0.08, d / 2]), flatBox([w / 2 - 0.08, 0.05, d / 2 - 0.04], [w / 2 - 0.05, h - 0.08, d / 2])]), 'alu_silver'),
  ];
  const booth = moving(bk, 'Telefonní budka (akustická kabina pro jednoho)', CAT, boothParts, {
    node: 'door', at: [-w / 2 + 0.08, 0.05, d / 2 - 0.03], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 95, kind: 'door', prompt: 'Otevřít budku',
    parts: [...door('door', `${bk}_door`, 0, w - 0.16, 0, h - 0.14, 0, 0.02, { mat: 'alu_silver', window: [0.025, 0.03], flat: true }), barHandle('door', `${bk}_door`, w - 0.2, 0.8, 1.3, 0.02, { rad: 0.01, off: 0.04 })],
    note: 'Skleněné dveře akustické budky se otvírají ven asi o 90°, víc nedovolí doraz; 95°. Úvaha, neměřeno.',
  }, { gen: gen('meeting'), place: { mount: 'floor' }, group: 'world', colliders: [cbox('body', [-w / 2, 0, -d / 2], [-w / 2 + 0.05, h, d / 2]), cbox('body', [w / 2 - 0.05, 0, -d / 2], [w / 2, h, d / 2]), cbox('body', [-w / 2, 0, -d / 2], [w / 2, h, -d / 2 + 0.05]), cbox('body', [-w / 2, h - 0.08, -d / 2], [w / 2, h, d / 2])] }); // stěny a strop; dovnitř se dá vejít
  return [one('table_meeting_240_01', 'Jednací stůl 2,4 m, dub', table('table_meeting_240_01', 2.4, 'laminate_oak'), 'meeting', floor(0.75)), one('table_meeting_400_01', 'Jednací stůl 4 m, bílý', table('table_meeting_400_01', 4.0, 'laminate_white'), 'meeting', floor(0.75)), booth];
}

/** Na zeď: tabule, akustické panely (šedé, zelené), televize 65", projekční plátno; mobilní tabule; projektor ze stropu. */
export function wallStuff() {
  const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } }, group: 'world' });
  const panels = (k, mat) => [A('body', `${k}_tiles`, merge([0, 1, 2].flatMap((i) => [0, 1].map((r) => roundedBox([-0.9 + i * 0.6 + 0.01, r * 0.6 + 0.01, 0], [-0.3 + i * 0.6 - 0.01, (r + 1) * 0.6 - 0.01, 0.04 + ((i + r) % 2) * 0.02], 0.012, 1)))), mat)];
  const markers = (x, y, z) => merge([0, 1, 2].map((i) => moved(cylinder(0.008, 0, 0.12, { seg: 6 }), at(mTranslate(x + i * 0.025, y, z), mRotate('z', 90)))));
  const wb = 'whiteboard_wall_01';
  const mb = 'whiteboard_mobile_01';
  const legs = [];
  for (const x of [-0.85, 0.85]) legs.push(roundedBox([x - 0.02, 0.05, -0.02], [x + 0.02, 1.9, 0.02], 0.006, 1), roundedBox([x - 0.03, 0.06, -0.3], [x + 0.03, 0.09, 0.3], 0.006, 1));
  const pk = 'projector_ceiling_01';
  return [
    one(wb, 'Bílá tabule na zeď 1,8 × 1,2 m', [
      A('body', `${wb}_frame`, roundedBox([-0.9, 0, 0], [0.9, 1.2, 0.02], 0.008, 1), 'alu_silver'),
      A('body', `${wb}_board`, flatBox([-0.88, 0.02, 0.02], [0.88, 1.18, 0.022]), 'whiteboard'),
      A('body', `${wb}_tray`, roundedBox([-0.6, 0.0, 0.02], [0.6, 0.025, 0.08], 0.006, 1), 'alu_silver'),
      A('body', `${wb}_markers`, markers(-0.4, 0.035, 0.05), 'marker_red'),
      A('body', `${wb}_sketch`, merge([flatBox([-0.5, 0.8, 0.022], [0.4, 0.812, 0.023]), flatBox([-0.5, 0.6, 0.022], [-0.1, 0.61, 0.023]), flatBox([-0.5, 0.4, 0.022], [0.2, 0.41, 0.023])]), 'cable_blue'),
      A('body', `${wb}_red`, flatBox([0.1, 0.55, 0.022], [0.45, 0.65, 0.023]), 'marker_red'),
    ], 'wallStuff', wall(0.9)),
    one('panel_acoustic_01', 'Akustické panely z filcu, šedé', panels('panel_acoustic_01', 'felt_grey'), 'wallStuff', wall(1.0)),
    one('panel_acoustic_02', 'Akustické panely z filcu, zelené', panels('panel_acoustic_02', 'felt_green'), 'wallStuff', wall(1.0)),
    one('tv_wall_65_01', 'Televize 65" na zeď', [
      A('body', 'tv65_bezel', roundedBox([-0.73, 0, 0.012], [0.73, 0.84, 0.045], 0.006, 1), 'bezel_black'),
      A('body', 'tv65_back', flatBox([-0.4, 0.2, 0], [0.4, 0.64, 0.02]), 'bezel_black'),
      A('body', 'tv65_img', flatBox([-0.715, 0.015, 0.045], [0.715, 0.825, 0.0455]), 'screen_graph'),
      A('body', 'tv65_led', flatBox([-0.01, 0.004, 0.045], [0.01, 0.008, 0.047]), 'led_blue'),
    ], 'wallStuff', wall(1.3)),
    one('screen_projection_01', 'Projekční plátno svinuté v pouzdře', [
      A('body', 'projscreen_case', moved(roundedBox([-1.2, 0, 0], [1.2, 0.1, 0.1], 0.03, 2), mTranslate(0, 0, 0)), 'key_white'),
      A('body', 'projscreen_caps', merge([-1, 1].map((s) => roundedBox([s * 1.2 - (s > 0 ? 0.02 : 0), 0.005, 0.005], [s * 1.2 + (s < 0 ? 0.02 : 0), 0.095, 0.095], 0.01, 1))), 'bezel_black'),
      A('body', 'projscreen_bar', flatBox([-1.15, 0.0, 0.04], [1.15, 0.012, 0.06]), 'paint_white_line'),
      A('body', 'projscreen_pull', merge([tube([[0, 0.0, 0.05], [0, -0.12, 0.05]], 0.003, 4), roundedBox([-0.02, -0.15, 0.04], [0.02, -0.12, 0.06], 0.008, 1)]), 'bezel_black'),
    ], 'wallStuff', wall(2.4)),
    one(mb, 'Mobilní oboustranná tabule', [
      A('body', `${mb}_legs`, merge(legs), 'alu_silver'),
      ...casters('body', mb, 1.7, 0.6, 0.06, 0.0),
      A('body', `${mb}_frame`, roundedBox([-0.84, 0.74, -0.02], [0.84, 1.86, 0.02], 0.008, 1), 'alu_silver'),
      A('body', `${mb}_board`, merge([flatBox([-0.83, 0.75, 0.02], [0.83, 1.85, 0.022]), flatBox([-0.83, 0.75, -0.022], [0.83, 1.85, -0.02])]), 'whiteboard'),
      A('body', `${mb}_sketch`, merge([flatBox([-0.4, 1.2, 0.022], [0.3, 1.215, 0.023]), flatBox([-0.4, 1.5, 0.022], [0.0, 1.51, 0.023])]), 'marker_red'),
    ], 'wallStuff'),
    one(pk, 'Projektor na stropním držáku', [
      A('body', `${pk}_pole`, merge([T(cylinder(0.05, -0.012, 0, { seg: 10 }), 0, 0, 0), T(cylinder(0.018, -0.33, -0.012, { seg: 8 }), 0, 0, 0), roundedBox([-0.08, -0.35, -0.08], [0.08, -0.33, 0.08], 0.005, 1)]), 'bezel_black'),
      A('body', `${pk}_body`, roundedBox([-0.17, -0.46, -0.15], [0.17, -0.35, 0.15], 0.025, 2), 'key_white'),
      A('body', `${pk}_lens`, rotX(lathe([[0.04, 0], [0.04, 0.025, 'c'], [0.03, 0.03, 'c'], [0, 0.028]], { seg: 14 }), 0.08, -0.405, 0.15), 'bezel_black'),
      A('body', `${pk}_glass`, rotX(cylinder(0.028, 0.026, 0.029, { seg: 12 }), 0.08, -0.405, 0.15), 'screen_off'),
      ...grille('body', `${pk}_v`, -0.15, -0.02, -0.44, -0.37, 0.15, 4),
    ], 'wallStuff', { components: { physics: { body: 'static' }, place: { mount: 'ceiling' } }, group: 'world' }),
  ];
}

/** List: zploštělá koule natočená ve směru dir (radiány), sklon tilt (°), délka len, šířka wid. */
function leaf(x, y, z, dir, tilt, len, wid) {
  return moved(sphere(1, 0, { seg: 6, n: 3 }), at(mTranslate(x, y, z), mRotate('y', (-dir * 180) / Math.PI), mRotate('z', tilt), mTranslate(len / 2, 0, 0), mScale(len / 2, 0.006, wid / 2)));
}

/** Květináč: kuželový s lemem, zemina. */
const pot = (k, r, h, mat) => [A('body', `${k}_pot`, lathe([[0, 0], [r * 0.8, 0, 'c'], [r, h - 0.03], [r * 1.05, h - 0.03, 'c'], [r * 1.05, h, 'c'], [r * 0.95, h, 'c'], [r * 0.93, h - 0.03]], { seg: 16 }), mat), A('body', `${k}_soil`, T(cylinder(r * 0.94, h - 0.04, h - 0.025, { seg: 14 }), 0, 0, 0), 'soil_dark')];

/** Rostliny v květináčích (fíkus, tchýnin jazyk, monstera), sedačka pro dva (dvě barvy), sedací vaky. */
export function lounge() {
  const ficusLeaves = [];
  const stems = [tube([[0, 0.3, 0], [0.02, 0.8, 0.01], [-0.01, 1.3, 0]], 0.015, 6, { bend: 0.2, bendSeg: 3 })];
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996;
    const y = 0.75 + (i / 26) * 0.75;
    const r = 0.12 + 0.18 * Math.sin((i / 26) * Math.PI);
    ficusLeaves.push(leaf(Math.cos(a) * r * 0.5, y, Math.sin(a) * r * 0.5, a, -15 - (i % 3) * 8, 0.12, 0.06));
    if (i % 6 === 0) stems.push(tube([[0, y - 0.05, 0], [Math.cos(a) * r * 0.5, y, Math.sin(a) * r * 0.5]], 0.006, 4));
  }
  const ficus = [...pot('ficus', 0.2, 0.35, 'key_white'), A('body', 'ficus_stems', merge(stems), 'wood_old'), A('body', 'ficus_leaves', merge(ficusLeaves), 'leaf_green')];
  const blades = [];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39996;
    const hgt = 0.45 + (i % 4) * 0.08;
    blades.push(moved(lathe([[0.025, 0], [0.03, hgt * 0.6], [0, hgt]], { seg: 4 }), at(mTranslate(Math.cos(a) * 0.05, 0.22, Math.sin(a) * 0.05), mRotate('y', (-a * 180) / Math.PI), mRotate('z', 6 + (i % 3) * 4), mScale(1, 1, 0.25))));
  }
  const snake = [...pot('snake', 0.13, 0.25, 'pot_terracotta'), A('body', 'snake_leaves', merge(blades), 'leaf_green')];
  const mLeaves = [];
  const mStems = [];
  [[0.0, 0.62, 0.3], [2.1, 0.7, 0.28], [4.2, 0.66, 0.32], [1.0, 0.82, 0.26], [3.1, 0.86, 0.27], [5.3, 0.78, 0.25]].forEach(([a, y, r]) => {
    const tip = [Math.cos(a) * r, y, Math.sin(a) * r];
    mStems.push(tube([[0, 0.28, 0], [tip[0] * 0.5, y * 0.85, tip[2] * 0.5], tip], 0.007, 4, { bend: 0.1, bendSeg: 2 }));
    mLeaves.push(leaf(tip[0] * 0.7, y, tip[2] * 0.7, a, -20, 0.32, 0.26));
  });
  const monstera = [...pot('monstera', 0.18, 0.3, 'bezel_black'), A('body', 'monstera_stems', merge(mStems), 'leaf_green'), A('body', 'monstera_leaves', merge(mLeaves), 'leaf_green')];
  const sofa = (k, mat) => [
    A('body', `${k}_seat`, merge([-0.32, 0.32].map((x) => roundedBox([x - 0.31, 0.22, -0.35], [x + 0.31, 0.42, 0.38], 0.05, 1))), mat),
    A('body', `${k}_base`, roundedBox([-0.8, 0.1, -0.4], [0.8, 0.24, 0.4], 0.03, 1), mat),
    A('body', `${k}_back`, merge([-0.32, 0.32].map((x) => roundedBox([x - 0.31, 0.4, -0.4], [x + 0.31, 0.85, -0.2], 0.06, 1))), mat),
    A('body', `${k}_arms`, merge([-1, 1].map((s) => roundedBox([s * 0.8 - (s > 0 ? 0.16 : 0), 0.1, -0.4], [s * 0.8 + (s < 0 ? 0.16 : 0), 0.64, 0.4], 0.05, 1))), mat),
    A('body', `${k}_legs`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => T(lathe([[0.02, 0], [0.025, 0.1]], { seg: 8 }), sx * 0.72, 0, sz * 0.32)))), 'wood_oak'),
  ];
  const bag = (k, mat) => [A('body', `${k}_bag`, moved(sphere(1, 0, { seg: 16, n: 8 }), at(mTranslate(0, 0.33, 0), mScale(0.42, 0.33, 0.42))), mat), A('body', `${k}_dent`, moved(sphere(1, 0, { seg: 12, n: 6 }), at(mTranslate(0, 0.5, -0.24), mScale(0.36, 0.28, 0.16))), mat)];
  return [
    one('plant_ficus_01', 'Fíkus ve velkém květináči', ficus, 'lounge'),
    one('plant_snake_01', 'Tchýnin jazyk v květináči', snake, 'lounge'),
    one('plant_monstera_01', 'Monstera v černém květináči', monstera, 'lounge'),
    one('sofa_two_01', 'Pohovka pro dva, žlutá', sofa('sofa_two_01', 'fabric_mustard'), 'lounge'),
    one('sofa_two_02', 'Pohovka pro dva, petrolejová', sofa('sofa_two_02', 'fabric_teal'), 'lounge'),
    one('beanbag_01', 'Sedací vak, šedý', bag('beanbag_01', 'felt_grey'), 'lounge'),
    one('beanbag_02', 'Sedací vak, žlutý', bag('beanbag_02', 'fabric_mustard'), 'lounge'),
  ];
}

/** Kuchyňka s kávovarem, výdejník vody, šatní skříňky, stolní tenis, fotbálek, třídění odpadu, věšák, skleněná příčka, recepce. */
export function facilities() {
  const kk = 'kitchenette_01';
  const fronts = [];
  const pulls = [];
  for (let i = 0; i < 4; i++) {
    fronts.push(flatBox([-0.995 + i * 0.5, 0.1, 0.28], [-0.505 + i * 0.5, 0.86, 0.3]));
    pulls.push(tube([[-0.82 + i * 0.5, 0.8, 0.3], [-0.82 + i * 0.5, 0.8, 0.325], [-0.68 + i * 0.5, 0.8, 0.325], [-0.68 + i * 0.5, 0.8, 0.3]], 0.005, 4));
  }
  const kitchen = [
    A('body', `${kk}_carcass`, flatBox([-1.0, 0.1, -0.3], [1.0, 0.88, 0.28]), 'key_white'),
    A('body', `${kk}_plinth`, flatBox([-0.98, 0, -0.28], [0.98, 0.1, 0.24]), 'bezel_black'),
    A('body', `${kk}_fronts`, merge(fronts), 'key_white'),
    A('body', `${kk}_pulls`, merge(pulls), 'steel_brushed'),
    top('body', kk, 0, 0, 2.0, 0.62, 0.88, 0.92, 'laminate_oak', 0.01),
    A('body', `${kk}_sink`, merge([flatBox([-0.4, 0.75, -0.2], [0.0, 0.76, 0.15]), flatBox([-0.4, 0.76, -0.2], [-0.39, 0.92, 0.15]), flatBox([-0.01, 0.76, -0.2], [0.0, 0.92, 0.15]), flatBox([-0.4, 0.76, -0.2], [0.0, 0.92, -0.19]), flatBox([-0.4, 0.76, 0.14], [0.0, 0.92, 0.15]), roundedBox([-0.42, 0.918, -0.22], [0.02, 0.924, 0.17], 0.004, 1)]), 'steel_brushed'),
    A('body', `${kk}_tap`, tube([[-0.2, 0.92, -0.24], [-0.2, 1.15, -0.24], [-0.2, 1.15, -0.1], [-0.2, 1.08, -0.08]], 0.011, 8, { bend: 0.05, bendSeg: 3 }), 'steel_chrome'),
    A('body', `${kk}_coffee`, roundedBox([0.3, 0.92, -0.25], [0.62, 1.32, 0.12], 0.03, 2), 'alu_space'),
    A('body', `${kk}_spout`, merge([roundedBox([0.38, 1.12, 0.1], [0.54, 1.2, 0.17], 0.01, 1), roundedBox([0.36, 0.935, -0.05], [0.56, 0.95, 0.15], 0.005, 1)]), 'bezel_black'),
    ...screen('body', `${kk}_scr`, 0.4, 0.52, 1.22, 1.29, 0.12, { buttons: 0 }),
    A('body', `${kk}_cups`, merge([-0.85, -0.6, 0.46].map((x, i) => T(lathe([[0, 0], [0.032, 0, 'c'], [0.04, 0.09, 'c'], [0.036, 0.09], [0.03, 0.006]], { seg: 10 }), x, 0.92 + (i === 2 ? 0.03 : 0), 0.05))), 'key_white'),
  ];
  const ck = 'water_cooler_01';
  const cooler = [
    shell('body', ck, [-0.16, 0, -0.16], [0.16, 1.05, 0.16], 'key_white', 0.03, 2),
    A('body', `${ck}_bottle`, T(lathe([[0.03, 0], [0.13, 0.06, 'c'], [0.13, 0.36], [0.11, 0.4], [0, 0.42]], { seg: 16 }), 0, 1.05, 0), 'liquid_water'),
    A('body', `${ck}_niche`, roundedBox([-0.09, 0.72, 0.12], [0.09, 0.92, 0.165], 0.012, 1), 'alu_space'),
    A('body', `${ck}_taps`, merge([-0.04, 0.04].map((x) => roundedBox([x - 0.014, 0.86, 0.16], [x + 0.014, 0.89, 0.2], 0.006, 1))), 'cap_blue'),
    A('body', `${ck}_drip`, flatBox([-0.08, 0.72, 0.12], [0.08, 0.73, 0.2]), 'bezel_black'),
  ];
  const lk = 'lockers_staff_01';
  const ldoors = [];
  const lvents = [];
  const lpulls = [];
  for (let i = 0; i < 4; i++) {
    for (let r = 0; r < 2; r++) {
      const x0 = -0.595 + i * 0.3;
      const y0 = 0.08 + r * 0.86;
      ldoors.push(flatBox([x0, y0, 0.25], [x0 + 0.29, y0 + 0.85, 0.268]));
      for (let s = 0; s < 4; s++) lvents.push(flatBox([x0 + 0.06, y0 + 0.68 + s * 0.035, 0.268], [x0 + 0.2, y0 + 0.69 + s * 0.035, 0.27]));
      lpulls.push(roundedBox([x0 + 0.24, y0 + 0.38, 0.268], [x0 + 0.265, y0 + 0.5, 0.285], 0.006, 1));
    }
  }
  const lockers = [
    shell('body', lk, [-0.6, 0.06, -0.25], [0.6, 1.8, 0.25], 'steel_painted', 0.008),
    A('body', `${lk}_plinth`, flatBox([-0.58, 0, -0.23], [0.58, 0.06, 0.2]), 'bezel_black'),
    A('body', `${lk}_doors`, merge(ldoors), 'steel_painted'),
    A('body', `${lk}_vents`, merge(lvents), 'bezel_black'),
    A('body', `${lk}_pulls`, merge(lpulls), 'alu_space'),
  ];
  const tk = 'table_pingpong_01';
  const pingpong = [
    A('body', `${tk}_top`, merge([-0.69, 0.69].map((x) => roundedBox([x - 0.68, 0.73, -0.76], [x + 0.68, 0.76, 0.76], 0.006, 1))), 'table_green'),
    A('body', `${tk}_lines`, merge([flatBox([-1.37, 0.76, -0.01], [1.37, 0.7605, 0.01]), flatBox([-1.37, 0.76, -0.76], [1.37, 0.7605, -0.74]), flatBox([-1.37, 0.76, 0.74], [1.37, 0.7605, 0.76]), flatBox([-1.37, 0.76, -0.76], [-1.35, 0.7605, 0.76]), flatBox([1.35, 0.76, -0.76], [1.37, 0.7605, 0.76])]), 'paint_white_line'),
    A('body', `${tk}_net`, flatBox([-0.003, 0.76, -0.8], [0.003, 0.912, 0.8]), 'mesh_black'),
    A('body', `${tk}_posts`, merge([-0.82, 0.82].map((z) => T(cylinder(0.012, 0.74, 0.92, { seg: 6 }), 0, 0, z))), 'steel_chrome'),
    A('body', `${tk}_legs`, merge([-1.1, 1.1].flatMap((x) => [-0.6, 0.6].map((z) => roundedBox([x - 0.025, 0.06, z - 0.025], [x + 0.025, 0.73, z + 0.025], 0.006, 1)))), 'steel_painted'),
    ...casters('body', tk, 2.25, 1.25, 0.06, 0.0),
  ];
  const fk = 'table_foosball_01';
  const rods = [];
  const men = [];
  [-0.45, -0.25, -0.05, 0.15, 0.35].forEach((x, i) => {
    rods.push(tube([[x, 0.88, -0.5], [x, 0.88, 0.5]], 0.008, 6));
    for (const z of [-0.15, 0.15]) men.push(T(lathe([[0, 0.78], [0.012, 0.79, 'c'], [0.014, 0.9], [0.01, 0.93], [0, 0.94]], { seg: 6 }), x, 0, z));
  });
  const foosball = [
    shell('body', fk, [-0.6, 0.7, -0.38], [0.6, 0.95, 0.38], 'laminate_oak', 0.012),
    A('body', `${fk}_field`, flatBox([-0.55, 0.75, -0.33], [0.55, 0.752, 0.33]), 'table_green'),
    A('body', `${fk}_legs`, merge([-0.55, 0.55].flatMap((x) => [-0.32, 0.32].map((z) => roundedBox([x - 0.04, 0, z - 0.04], [x + 0.04, 0.7, z + 0.04], 0.008, 1)))), 'laminate_oak'),
    A('body', `${fk}_rods`, merge(rods), 'steel_chrome'),
    A('body', `${fk}_grips`, merge([-0.45, -0.25, -0.05, 0.15, 0.35].map((x, i) => moved(cylinder(0.016, 0, 0.1, { seg: 8 }), at(mTranslate(x, 0.88, i % 2 ? 0.5 : -0.6), mRotate('x', 90))))), 'bezel_black'),
    A('body', `${fk}_red`, merge(men.filter((_, i) => Math.floor(i / 2) % 2 === 0)), 'cap_red'),
    A('body', `${fk}_blue`, merge(men.filter((_, i) => Math.floor(i / 2) % 2 === 1)), 'cap_blue'),
  ];
  const bk = 'bins_recycling_01';
  const bins = [
    A('body', `${bk}_bodies`, merge([-0.27, 0, 0.27].map((x) => roundedBox([x - 0.12, 0, -0.15], [x + 0.12, 0.6, 0.15], 0.015, 1))), 'alu_silver'),
    ...[['cap_blue', -0.27], ['cap_yellow', 0], ['paint_green', 0.27]].map(([m, x]) => A('body', `${bk}_lid_${m}`, merge([roundedBox([x - 0.125, 0.6, -0.155], [x + 0.125, 0.63, 0.155], 0.01, 1), flatBox([x - 0.07, 0.63, -0.02], [x + 0.07, 0.632, 0.02])]), m)),
    A('body', `${bk}_slots`, merge([-0.27, 0, 0.27].map((x) => flatBox([x - 0.06, 0.6305, -0.015], [x + 0.06, 0.6325, 0.015]))), 'bezel_black'),
  ];
  const rk = 'coat_rack_01';
  const hooks = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    hooks.push(tube([[0, 1.7, 0], [Math.cos(a) * 0.12, 1.75, Math.sin(a) * 0.12], [Math.cos(a) * 0.15, 1.82, Math.sin(a) * 0.15]], 0.007, 4, { bend: 0.03, bendSeg: 2 }));
  }
  const coat = [
    A('body', `${rk}_base`, lathe([[0, 0], [0.22, 0, 'c'], [0.22, 0.015], [0.05, 0.035], [0.03, 0.04]], { seg: 16 }), 'bezel_black'),
    A('body', `${rk}_pole`, T(cylinder(0.018, 0.03, 1.8, { seg: 8 }), 0, 0, 0), 'bezel_black'),
    A('body', `${rk}_hooks`, merge(hooks), 'bezel_black'),
    A('body', `${rk}_jacket`, moved(sphere(1, 0, { seg: 10, n: 6 }), at(mTranslate(0.09, 1.42, 0.0), mScale(0.07, 0.3, 0.2))), 'fabric_teal'),
  ];
  const gk = 'partition_glass_01';
  const glassWall = [
    A('body', `${gk}_rails`, merge([roundedBox([-0.6, 0, -0.04], [0.6, 0.06, 0.04], 0.006, 1), roundedBox([-0.6, 2.54, -0.04], [0.6, 2.6, 0.04], 0.006, 1), flatBox([-0.6, 0.06, -0.02], [-0.58, 2.54, 0.02])]), 'alu_silver'),
    A('body', `${gk}_glass`, flatBox([-0.58, 0.06, -0.006], [0.6, 2.54, 0.006]), 'glass_tinted'),
    A('body', `${gk}_band`, flatBox([-0.58, 1.0, 0.006], [0.6, 1.1, 0.008]), 'paint_white_line'),
  ];
  const ek = 'desk_reception_01';
  const reception = [
    shell('body', `${ek}_front`, [-1.2, 0, -0.35], [1.2, 1.1, 0.35], 'laminate_oak', 0.02, 2),
    top('body', `${ek}_counter`, 0, 0.15, 2.5, 0.5, 1.1, 1.14, 'laminate_white', 0.04),
    top('body', `${ek}_desk`, 0, -0.525, 2.4, 0.35, 0.72, 0.75, 'laminate_white', 0.01),
    A('body', `${ek}_strip`, flatBox([-1.0, 0.3, 0.35], [1.0, 0.32, 0.354]), 'led_blue'),
    A('body', `${ek}_logo`, roundedBox([-0.4, 0.5, 0.35], [0.4, 0.8, 0.358], 0.01, 1), 'alu_silver'),
    ...shift(monitorParts(0, 0, 24, 'screen_doc'), -0.5, 0.75, -0.45),
  ];
  return [
    one(kk, 'Kuchyňka s dřezem a kávovarem', kitchen, 'facilities', floor(0.92)),
    one(ck, 'Výdejník vody s barelem', cooler, 'facilities'),
    one(lk, 'Šatní skříňky pro osm lidí', lockers, 'facilities'),
    one(tk, 'Stůl na stolní tenis', pingpong, 'facilities'),
    one(fk, 'Stolní fotbal', foosball, 'facilities'),
    one(bk, 'Třídicí koše na odpad (papír, plast, sklo)', bins, 'facilities'),
    one(rk, 'Stojanový věšák s bundou', coat, 'facilities'),
    one(gk, 'Skleněná příčka 1,2 m s pruhem', glassWall, 'facilities'),
    one(ek, 'Recepční pult', reception, 'facilities', floor(1.14)),
  ];
}

export const OFFICE = [desks, chairs, meeting, wallStuff, lounge, facilities];
