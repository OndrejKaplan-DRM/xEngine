// Sada kit_it: open space IT firmy a vývojového centra. Stoly (dvojitý blok pro čtyři s přepážkami, stůl
// s nastavitelnou výškou bílý a dubový), kancelářské židle se síťovým opěradlem ve třech barvách, jednací stoly,
// telefonní budka s dveřmi, tabule, akustické panely, rostliny, sedačky a vaky, kuchyňka s kávovarem, výdejník
// vody, šatní skříňky, televize a projektor, stolní tenis a fotbálek, třídění odpadu, věšák, skleněná příčka,
// recepce. Rozměry podle norem kancelářského nábytku (deska 0,72 až 0,75 m, sedák 0,42 až 0,5 m), úvaha.

import { box, boxc, cyl, collide } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, staticFloor } from '../lab/common.mjs';
import { monitorParts, keyboardParts, laptopParts } from './computers.mjs';

const CAT = 'it.office';
const gen = (f) => `it/office.mjs#${f}`;
const pad = (i) => String(i).padStart(2, '0');
const floor = (top) => ({ components: staticFloor(top), group: 'world' });
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...floor(), ...o });
const at = (parts, dx, dy, dz) => parts.map((p) => (p.shape === 'box' ? { ...p, min: [p.min[0] + dx, p.min[1] + dy, p.min[2] + dz], max: [p.max[0] + dx, p.max[1] + dy, p.max[2] + dz] } : { ...p, center: [p.center[0] + dx, p.center[1] + dy, p.center[2] + dz] }));

/** Stoly: blok pro čtyři s přepážkami (prázdný a vybavený), stůl s nastavitelnou výškou (bílý a dubový). */
export function desks() {
  const H = 0.74;
  const block = (equipped) => {
    const parts = [...bevelBox('body', [-1.6, H - 0.025, -0.8], [1.6, H, 0.8], 'laminate_white', 0.004), ...[-1.55, 0, 1.55].flatMap((x) => [box('body', [x - 0.03, 0, -0.75], [x + 0.03, H - 0.025, -0.69], 'steel_painted'), box('body', [x - 0.03, 0, 0.69], [x + 0.03, H - 0.025, 0.75], 'steel_painted'), box('body', [x - 0.03, 0, -0.75], [x + 0.03, 0.04, 0.75], 'steel_painted')]), box('body', [-1.6, H, -0.015], [1.6, H + 0.4, 0.015], 'felt_grey'), box('body', [-0.012, H, -0.8], [0.012, H + 0.3, 0.8], 'felt_grey')];
    if (equipped) {
      parts.push(...at([...monitorParts(-0.29, 0, 24, 'screen_code'), ...monitorParts(0.29, 0, 24, 'screen_doc'), ...keyboardParts(0, 0.3)], -0.8, H, -0.75 + 0.6), ...at(laptopParts(0, 0, 14), 0.8, H, -0.35));
      parts.push(...at([...monitorParts(0, 0, 27, 'screen_graph'), ...keyboardParts(0, 0.3)], -0.8, H, 0.2), ...at(monitorParts(0, 0, 34, 'screen_code', { wide: true }), 0.8, H, 0.2));
    }
    return parts;
  };
  const sitStand = (mat, v) => [...bevelBox('body', [-0.8, 0.72, -0.4], [0.8, 0.745, 0.4], mat, 0.004), ...[-0.65, 0.65].flatMap((x) => [box('body', [x - 0.04, 0, -0.35], [x + 0.04, 0.03, 0.35], 'steel_painted'), box('body', [x - 0.035, 0.03, -0.035], [x + 0.035, 0.4, 0.035], 'steel_painted'), box('body', [x - 0.028, 0.4, -0.028], [x + 0.028, 0.72, 0.028], 'steel_brushed')]), box('body', [-0.65, 0.68, -0.03], [0.65, 0.72, 0.03], 'steel_painted'), box('body', [0.6, 0.715, 0.38], [0.7, 0.72, 0.4], v ? 'bezel_black' : 'key_white')];
  return [
    one('desk_bench4_01', 'Blok stolů pro čtyři s přepážkami', block(false), 'desks', floor(H)),
    one('desk_bench4_02', 'Blok stolů pro čtyři s přepážkami a počítači', block(true), 'desks', floor(H)),
    one('desk_sitstand_01', 'Stůl s nastavitelnou výškou, bílý', sitStand('laminate_white', 0), 'desks', { ...floor(0.745), params: { deck: [-0.38, 0.38] } }),
    one('desk_sitstand_02', 'Stůl s nastavitelnou výškou, dubový', sitStand('laminate_oak', 1), 'desks', { ...floor(0.745), params: { deck: [-0.38, 0.38] } }),
  ];
}

/** Kancelářská židle se síťovým opěradlem: černá, šedá, modrá. */
export function chairs() {
  return [['fabric_charcoal', 'černá'], ['felt_grey', 'šedá'], ['felt_blue', 'modrá']].map(([seat, name], v) => {
    const parts = [...[0, 1, 2, 3, 4].map((i) => box('body', [Math.cos(i * 1.257) * 0.3 - 0.02, 0.04, Math.sin(i * 1.257) * 0.3 - 0.02], [Math.cos(i * 1.257) * 0.3 + 0.02, 0.07, Math.sin(i * 1.257) * 0.3 + 0.02], 'bezel_black')), ...[0, 1, 2, 3, 4].map((i) => cyl('body', [Math.cos(i * 1.257) * 0.3, 0.025, Math.sin(i * 1.257) * 0.3], 0.025, 0.02, 'x', 'rubber_black')), cyl('body', [0, 0.26, 0], 0.025, 0.4, 'y', 'steel_brushed'), ...bevelBox('body', [-0.25, 0.46, -0.24], [0.25, 0.52, 0.24], seat, 0.02), box('body', [-0.02, 0.5, -0.28], [0.02, 0.62, -0.24], 'bezel_black'), box('body', [-0.24, 0.6, -0.31], [0.24, 1.1, -0.27], 'mesh_black'), box('body', [-0.25, 0.58, -0.32], [0.25, 0.6, -0.26], 'bezel_black'), box('body', [-0.25, 1.1, -0.32], [0.25, 1.13, -0.26], 'bezel_black'), ...[-1, 1].flatMap((s) => [box('body', [s * 0.27 - 0.015, 0.52, -0.05], [s * 0.27 + 0.015, 0.68, -0.02], 'bezel_black'), box('body', [s * 0.27 - 0.03, 0.68, -0.15], [s * 0.27 + 0.03, 0.7, 0.1], 'bezel_black')])];
    return one(`chair_task_${pad(v + 1)}`, `Kancelářská židle se síťovým opěradlem (${name})`, parts, 'chairs', { components: staticFloor() });
  });
}

/** Jednací stoly 2,4 m (dub) a 4 m (bílý s kanálem na kabely); telefonní budka s prosklenými dveřmi. */
export function meeting() {
  const table = (L, mat) => [...bevelBox('body', [-L / 2, 0.72, -0.6], [L / 2, 0.75, 0.6], mat, 0.006), ...[-L / 2 + 0.3, L / 2 - 0.3].flatMap((x) => [box('body', [x - 0.04, 0, -0.45], [x + 0.04, 0.72, -0.37], 'steel_painted'), box('body', [x - 0.04, 0, 0.37], [x + 0.04, 0.72, 0.45], 'steel_painted'), box('body', [x - 0.04, 0.0, -0.45], [x + 0.04, 0.03, 0.45], 'steel_painted')]), box('body', [-0.15, 0.75, -0.06], [0.15, 0.752, 0.06], 'alu_space')];
  const [w, d, h] = [1.0, 1.0, 2.2];
  const boothParts = [box('body', [-w / 2, 0, -d / 2], [w / 2, 0.05, d / 2], 'felt_grey'), box('body', [-w / 2, 0, -d / 2], [-w / 2 + 0.05, h, d / 2], 'felt_green'), box('body', [w / 2 - 0.05, 0, -d / 2], [w / 2, h, d / 2], 'felt_green'), box('body', [-w / 2, 0, -d / 2], [w / 2, h, -d / 2 + 0.05], 'felt_green'), box('body', [-w / 2, h - 0.08, -d / 2], [w / 2, h, d / 2], 'felt_green'), box('body', [-w / 2 + 0.05, 0.9, -d / 2 + 0.05], [w / 2 - 0.05, 0.93, -d / 2 + 0.35], 'laminate_oak'), box('body', [-0.2, h - 0.1, -0.2], [0.2, h - 0.08, 0.2], 'emit_warm')];
  const booth = moving('booth_phone_01', 'Telefonní budka (akustická kabina pro jednoho)', CAT, boothParts, {
    node: 'door', at: [-w / 2 + 0.05, 0.05, d / 2 - 0.03], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 95, kind: 'door', prompt: 'Otevřít budku',
    parts: [box('door', [0, 0, 0], [w - 0.1, h - 0.13, 0.012], 'glass_tinted'), box('door', [w - 0.15, 0.9, 0.012], [w - 0.13, 1.2, 0.04], 'steel_brushed')],
    note: 'Skleněné dveře akustické budky se otvírají ven asi o 90°, víc nedovolí doraz; 95°. Úvaha, neměřeno.',
  }, { gen: gen('meeting'), place: { mount: 'floor' }, group: 'world', colliders: boothParts.slice(1, 5).map((p) => collide(p)) }); // stěny a strop; dovnitř se dá vejít
  return [one('table_meeting_240_01', 'Jednací stůl 2,4 m, dub', table(2.4, 'laminate_oak'), 'meeting', floor(0.75)), one('table_meeting_400_01', 'Jednací stůl 4 m, bílý', table(4.0, 'laminate_white'), 'meeting', floor(0.75)), booth];
}

/** Na zeď: tabule, akustické panely (šedé, zelené), televize 65", projekční plátno; mobilní tabule; projektor ze stropu. */
export function wallStuff() {
  const wall = (h) => ({ components: { physics: { body: 'static' }, place: { mount: 'wall', height: h } }, group: 'world' });
  const panels = (mat) => [0, 1, 2].flatMap((i) => [0, 1].map((k) => box('body', [-0.9 + i * 0.6 + 0.01, k * 0.6 + 0.01, 0], [-0.3 + i * 0.6 - 0.01, (k + 1) * 0.6 - 0.01, 0.04 + ((i + k) % 2) * 0.02], mat)));
  return [
    one('whiteboard_wall_01', 'Bílá tabule na zeď 1,8 × 1,2 m', [box('body', [-0.9, 0, 0], [0.9, 1.2, 0.02], 'alu_silver'), box('body', [-0.88, 0.02, 0.02], [0.88, 1.18, 0.022], 'whiteboard'), box('body', [-0.9, -0.0, 0.02], [0.9, 0.03, 0.08], 'alu_silver'), box('body', [-0.3, 0.6, 0.022], [0.2, 0.62, 0.023], 'marker_red'), box('body', [-0.5, 0.8, 0.022], [0.4, 0.812, 0.023], 'cable_blue')], 'wallStuff', wall(0.9)),
    one('panel_acoustic_01', 'Akustické panely z filcu, šedé', panels('felt_grey'), 'wallStuff', wall(1.0)),
    one('panel_acoustic_02', 'Akustické panely z filcu, zelené', panels('felt_green'), 'wallStuff', wall(1.0)),
    one('tv_wall_65_01', 'Televize 65" na zeď', [...bevelBox('body', [-0.73, 0, 0], [0.73, 0.84, 0.05], 'bezel_black', 0.005), box('body', [-0.715, 0.015, 0.05], [0.715, 0.825, 0.052], 'screen_graph')], 'wallStuff', wall(1.3)),
    one('screen_projection_01', 'Projekční plátno svinuté v pouzdře', [box('body', [-1.2, 0, 0], [1.2, 0.1, 0.1], 'key_white'), box('body', [-1.15, -0.0, 0.04], [1.15, 0.01, 0.06], 'paint_white_line')], 'wallStuff', wall(2.4)),
    one('whiteboard_mobile_01', 'Mobilní oboustranná tabule', [...[-0.85, 0.85].flatMap((x) => [box('body', [x - 0.02, 0.05, -0.02], [x + 0.02, 1.9, 0.02], 'alu_silver'), box('body', [x - 0.03, 0.03, -0.3], [x + 0.03, 0.06, 0.3], 'alu_silver'), cyl('body', [x, 0.025, -0.28], 0.025, 0.03, 'x', 'rubber_black'), cyl('body', [x, 0.025, 0.28], 0.025, 0.03, 'x', 'rubber_black')]), box('body', [-0.83, 0.75, -0.015], [0.83, 1.85, 0.015], 'whiteboard'), box('body', [-0.4, 1.2, 0.015], [0.3, 1.215, 0.016], 'marker_red')], 'wallStuff'),
    one('projector_ceiling_01', 'Projektor na stropním držáku', [box('body', [-0.03, -0.35, -0.03], [0.03, 0, 0.03], 'bezel_black'), ...bevelBox('body', [-0.17, -0.45, -0.15], [0.17, -0.35, 0.15], 'key_white', 0.01), cyl('body', [0.08, -0.4, 0.16], 0.035, 0.03, 'z', 'screen_off')], 'wallStuff', { components: { physics: { body: 'static' }, place: { mount: 'ceiling' } }, group: 'world' }),
  ];
}

/** Rostliny v květináčích (fíkus, tchýnin jazyk, monstera), sedačka pro dva (dvě barvy), sedací vaky. */
export function lounge() {
  const pot = (r, h, mat = 'pot_terracotta') => [cyl('body', [0, h / 2, 0], r, h, 'y', mat), cyl('body', [0, h - 0.01, 0], r * 0.92, 0.02, 'y', 'soil_dark')];
  const ficus = [...pot(0.2, 0.35, 'key_white'), cyl('body', [0, 0.75, 0], 0.02, 0.8, 'y', 'wood_old'), ...[[0, 1.4, 0, 0.5], [0.15, 1.1, 0.05, 0.35], [-0.12, 1.2, -0.08, 0.35]].map(([x, y, z, s]) => boxc('body', [x, y, z], [s, s * 0.9, s], 'leaf_green'))];
  const snake = [...pot(0.13, 0.25), ...[-0.05, 0.0, 0.05, -0.02, 0.04].map((x, i) => box('body', [x - 0.02, 0.25, (i % 2 ? 0.03 : -0.03) - 0.006], [x + 0.02, 0.6 + (i % 3) * 0.12, (i % 2 ? 0.03 : -0.03) + 0.006], 'leaf_green'))];
  const monstera = [...pot(0.18, 0.3, 'bezel_black'), ...[[0.15, 0.55, 0.0], [-0.15, 0.6, 0.05], [0.0, 0.75, -0.12], [0.05, 0.65, 0.15]].map(([x, y, z]) => box('body', [x - 0.13, y, z - 0.11], [x + 0.13, y + 0.02, z + 0.11], 'leaf_green')), ...[[0.08, 0.45], [-0.08, 0.48], [0, 0.55]].map(([x, h]) => box('body', [x - 0.006, 0.3, -0.006], [x + 0.006, 0.3 + h, 0.006], 'leaf_green'))];
  const sofa = (mat) => [...bevelBox('body', [-0.8, 0.1, -0.4], [0.8, 0.42, 0.4], mat, 0.03), ...bevelBox('body', [-0.8, 0.42, -0.4], [0.8, 0.85, -0.22], mat, 0.03), ...[-1, 1].map((s) => bevelBox('body', [s * 0.8 - (s > 0 ? 0.15 : 0), 0.42, -0.4], [s * 0.8 + (s < 0 ? 0.15 : 0), 0.62, 0.4], mat, 0.03)).flat(), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box('body', [sx * 0.72 - 0.02, 0, sz * 0.32 - 0.02], [sx * 0.72 + 0.02, 0.1, sz * 0.32 + 0.02], 'wood_oak')))];
  const bag = (mat) => [...bevelBox('body', [-0.38, 0, -0.38], [0.38, 0.35, 0.38], mat, 0.1), ...bevelBox('body', [-0.38, 0.35, -0.38], [0.38, 0.75, -0.15], mat, 0.08)];
  return [
    one('plant_ficus_01', 'Fíkus ve velkém květináči', ficus, 'lounge'),
    one('plant_snake_01', 'Tchýnin jazyk v květináči', snake, 'lounge'),
    one('plant_monstera_01', 'Monstera v černém květináči', monstera, 'lounge'),
    one('sofa_two_01', 'Pohovka pro dva, žlutá', sofa('fabric_mustard'), 'lounge'),
    one('sofa_two_02', 'Pohovka pro dva, petrolejová', sofa('fabric_teal'), 'lounge'),
    one('beanbag_01', 'Sedací vak, šedý', bag('felt_grey'), 'lounge'),
    one('beanbag_02', 'Sedací vak, žlutý', bag('fabric_mustard'), 'lounge'),
  ];
}

/** Kuchyňka s kávovarem, výdejník vody, šatní skříňky, stolní tenis, fotbálek, třídění odpadu, věšák, skleněná příčka, recepce. */
export function facilities() {
  const kitchen = [...bevelBox('body', [-1.0, 0, -0.3], [1.0, 0.88, 0.3], 'key_white', 0.006), ...bevelBox('body', [-1.0, 0.88, -0.3], [1.0, 0.92, 0.3], 'laminate_oak', 0.004), box('body', [-0.4, 0.86, -0.2], [0.0, 0.92, 0.15], 'steel_brushed'), cyl('body', [-0.2, 1.05, -0.24], 0.012, 0.25, 'y', 'steel_brushed'), ...bevelBox('body', [0.3, 0.92, -0.25], [0.62, 1.32, 0.15], 'alu_space', 0.02), box('body', [0.38, 1.0, 0.15], [0.54, 1.12, 0.16], 'bezel_black'), box('body', [0.4, 1.2, 0.15], [0.52, 1.28, 0.152], 'emit_display'), ...[-0.85, -0.6].map((x) => cyl('body', [x, 0.97, 0.05], 0.04, 0.1, 'y', 'key_white'))];
  for (let i = 0; i < 4; i++) kitchen.push(box('body', [-0.99 + i * 0.5, 0.05, 0.3], [-0.51 + i * 0.5, 0.85, 0.302], 'key_white'), box('body', [-0.8 + i * 0.5, 0.8, 0.302], [-0.7 + i * 0.5, 0.81, 0.315], 'steel_brushed'));
  const cooler = [...bevelBox('body', [-0.16, 0, -0.16], [0.16, 1.05, 0.16], 'key_white', 0.02), cyl('body', [0, 1.25, 0], 0.13, 0.4, 'y', 'liquid_water'), box('body', [-0.08, 0.8, 0.16], [0.08, 0.9, 0.2], 'alu_space'), ...[-0.04, 0.04].map((x, i) => box('body', [x - 0.012, 0.86, 0.2], [x + 0.012, 0.88, 0.22], i ? 'cap_red' : 'cap_blue'))];
  const lockers = [...bevelBox('body', [-0.6, 0, -0.25], [0.6, 1.8, 0.25], 'steel_painted', 0.006)];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) lockers.push(box('body', [-0.59 + i * 0.3, 0.05 + k * 0.88, 0.25], [-0.31 + i * 0.3, 0.88 + k * 0.88, 0.252], 'steel_painted'), box('body', [-0.36 + i * 0.3, 0.45 + k * 0.88, 0.252], [-0.33 + i * 0.3, 0.55 + k * 0.88, 0.27], 'alu_space'), box('body', [-0.52 + i * 0.3, 0.7 + k * 0.88, 0.252], [-0.4 + i * 0.3, 0.8 + k * 0.88, 0.254], 'rack_mesh'));
  const pingpong = [...bevelBox('body', [-1.37, 0.73, -0.76], [1.37, 0.76, 0.76], 'table_green', 0.004), box('body', [-1.37, 0.76, -0.012], [1.37, 0.762, 0.012], 'paint_white_line'), box('body', [-0.006, 0.76, -0.8], [0.006, 0.915, 0.8], 'mesh_black'), ...[-1.1, 1.1].flatMap((x) => [-0.6, 0.6].map((z) => box('body', [x - 0.03, 0, z - 0.03], [x + 0.03, 0.73, z + 0.03], 'steel_painted')))];
  const foosball = [...bevelBox('body', [-0.6, 0.7, -0.38], [0.6, 0.95, 0.38], 'laminate_oak', 0.01), box('body', [-0.55, 0.75, -0.33], [0.55, 0.752, 0.33], 'table_green'), ...[-0.55, 0.55].flatMap((x) => [-0.32, 0.32].map((z) => box('body', [x - 0.04, 0, z - 0.04], [x + 0.04, 0.7, z + 0.04], 'laminate_oak'))), ...[-0.45, -0.25, -0.05, 0.15, 0.35].map((x, i) => cyl('body', [x, 0.88, 0], 0.008, 1.0, 'z', 'steel_brushed')), ...[-0.45, -0.25, -0.05, 0.15, 0.35].flatMap((x, i) => [-0.15, 0.15].map((z) => boxc('body', [x, 0.84, z], [0.025, 0.12, 0.03], i % 2 ? 'cap_blue' : 'cap_red')))];
  const bins = [['cap_blue', -0.27], ['cap_yellow', 0], ['paint_green', 0.27]].flatMap(([m, x]) => [box('body', [x - 0.12, 0, -0.15], [x + 0.12, 0.6, 0.15], 'alu_silver'), box('body', [x - 0.125, 0.6, -0.155], [x + 0.125, 0.63, 0.155], m)]);
  const coat = [cyl('body', [0, 0.01, 0], 0.22, 0.02, 'y', 'bezel_black'), cyl('body', [0, 0.9, 0], 0.018, 1.8, 'y', 'bezel_black'), ...[0, 1, 2, 3].map((i) => box('body', [Math.cos(i * 1.571) * 0.12 - 0.008, 1.6, Math.sin(i * 1.571) * 0.12 - 0.008], [Math.cos(i * 1.571) * 0.12 + 0.008, 1.75, Math.sin(i * 1.571) * 0.12 + 0.008], 'bezel_black')), box('body', [0.06, 1.2, -0.1], [0.12, 1.65, 0.1], 'fabric_teal')];
  const glassWall = [box('body', [-0.6, 0, -0.04], [0.6, 0.06, 0.04], 'alu_silver'), box('body', [-0.6, 2.54, -0.04], [0.6, 2.6, 0.04], 'alu_silver'), box('body', [-0.6, 0.06, -0.006], [0.6, 2.54, 0.006], 'glass_tinted'), box('body', [-0.6, 1.0, 0.006], [0.6, 1.1, 0.008], 'paint_white_line')];
  const reception = [...bevelBox('body', [-1.2, 0, -0.35], [1.2, 1.1, 0.35], 'laminate_oak', 0.01), ...bevelBox('body', [-1.25, 1.1, -0.1], [1.25, 1.14, 0.4], 'laminate_white', 0.006), box('body', [-1.2, 0.72, -0.7], [1.2, 0.75, -0.35], 'laminate_white'), box('body', [-0.4, 0.3, 0.35], [0.4, 0.8, 0.352], 'led_blue'), ...at(monitorParts(0, 0, 24, 'screen_doc'), -0.5, 0.75, -0.45)];
  return [
    one('kitchenette_01', 'Kuchyňka s dřezem a kávovarem', kitchen, 'facilities', floor(0.92)),
    one('water_cooler_01', 'Výdejník vody s barelem', cooler, 'facilities'),
    one('lockers_staff_01', 'Šatní skříňky pro osm lidí', lockers, 'facilities'),
    one('table_pingpong_01', 'Stůl na stolní tenis', pingpong, 'facilities'),
    one('table_foosball_01', 'Stolní fotbal', foosball, 'facilities'),
    one('bins_recycling_01', 'Třídicí koše na odpad (papír, plast, sklo)', bins, 'facilities'),
    one('coat_rack_01', 'Stojanový věšák s bundou', coat, 'facilities'),
    one('partition_glass_01', 'Skleněná příčka 1,2 m s pruhem', glassWall, 'facilities'),
    one('desk_reception_01', 'Recepční pult', reception, 'facilities', floor(1.14)),
  ];
}

export const OFFICE = [desks, chairs, meeting, wallStuff, lounge, facilities];
