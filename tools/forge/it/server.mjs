// Sada kit_it: serverovna a superpočítač. Rack 42U 60 × 107 × 200 cm (výška jednotky 44,45 mm), rack s prosklenými
// dveřmi na pantu, síťový rack s propojovacími panely a kabely, diskové pole, otevřený rám; skříň superpočítače
// s kapalinovým chlazením (dvě barvy proužku), UPS a bateriová skříň, chladicí jednotka do řady a skříňová (CRAH),
// kabelový žlab ze stropu, děrovaná dlaždice zdvojené podlahy, láhev hasicího plynu, přístupová čtečka, kamera,
// přístupový bod Wi-Fi, přepínač na stůl. Rozměry obvyklé pro 19" techniku; tvar obecný.
// Ondřej 25. 11. 2026 v 1:29: kus po kuse; hladké sítě ze stavebnice appliance.mjs, do 1 500 △ na kus.

import { shiftParts } from '../lib.mjs';
import { simple, moving, staticFloor } from '../lab/common.mjs';
import { A, shell, door, barHandle, grille, screen, lock, merge, T, roundedBox, flatBox, cylinder, tube, lathe, moved, mTranslate, mRotate, at } from '../lab/appliance.mjs';
import { arc } from '../mesh/lathe.mjs';

const CAT = 'it.server';
const gen = (f) => `it/server.mjs#${f}`;
const U = 0.04445;
const floor = () => ({ components: staticFloor(), group: 'world' });
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });

/** Skříň racku 42U bez dveří: boky se zaoblenou hranou, děrovaná záda, strop s průchodkami, sokl, svislé lišty. */
function rackShell(k, w = 0.6, d = 1.07, h = 2.0) {
  return [
    shell('body', `${k}_l`, [-w / 2, 0.05, -d / 2], [-w / 2 + 0.02, h, d / 2], 'rack_black', 0.006),
    shell('body', `${k}_r`, [w / 2 - 0.02, 0.05, -d / 2], [w / 2, h, d / 2], 'rack_black', 0.006),
    shell('body', `${k}_t`, [-w / 2 + 0.018, h - 0.03, -d / 2], [w / 2 - 0.018, h, d / 2], 'rack_black', 0.006),
    A('body', `${k}_back`, flatBox([-w / 2 + 0.02, 0.05, -d / 2], [w / 2 - 0.02, h - 0.03, -d / 2 + 0.02]), 'rack_mesh'),
    A('body', `${k}_plinth`, flatBox([-w / 2 + 0.03, 0, -d / 2 + 0.05], [w / 2 - 0.03, 0.05, d / 2 - 0.05]), 'rack_black'),
    A('body', `${k}_rails`, merge([-1, 1].map((s) => flatBox([s * 0.2325 - 0.01, 0.1, d / 2 - 0.1], [s * 0.2325 + 0.01, h - 0.05, d / 2 - 0.08]))), 'steel_dark'),
    A('body', `${k}_glands`, merge([-0.15, 0.15].map((x) => T(cylinder(0.04, h, h + 0.006, { seg: 8 }), x, 0, -0.3))), 'rubber_black'),
  ];
}

/** Servery 1U až 4U od výšky y v čelní rovině z: čelo, šachty disků, kontrolka. Jedna síť na materiál; uši serverů
 * kryje svislá lišta racku. depth = hloubka skříně serveru. */
function servers(k, z, list, y = 0.12, depth = 0.75) {
  const faces = [];
  const bays = [];
  const blue = [];
  const green = [];
  const amber = [];
  for (const [u, kind] of list) {
    const h = u * U - 0.002;
    faces.push(flatBox([-0.2225, y, z - depth], [0.2225, y + h, z]));
    if (kind === 'disk') for (let i = 0; i < 4; i++) bays.push(flatBox([-0.2 + i * 0.09, y + 0.004, z], [-0.12 + i * 0.09, y + h - 0.004, z + 0.003]));
    else for (let i = 0; i < 2; i++) bays.push(flatBox([-0.19 + i * 0.17, y + h * 0.25, z], [-0.05 + i * 0.17, y + h * 0.75, z + 0.002]));
    (kind === 'warn' ? amber : kind === 'disk' ? blue : green).push(flatBox([0.18, y + h / 2 - 0.003, z], [0.2, y + h / 2 + 0.003, z + 0.004]));
    y += u * U;
  }
  const out = [A('body', `${k}_faces`, merge(faces), 'server_face'), A('body', `${k}_bays`, merge(bays), 'steel_dark')];
  for (const [g, m] of [[blue, 'led_blue'], [green, 'emit_green'], [amber, 'led_orange']]) if (g.length) out.push(A('body', `${k}_${m}`, merge(g), m));
  return out;
}

/** Racky 42U: se servery a prosklenými dveřmi (kloub), síťový s kabely, diskové pole, otevřený rám. */
export function racks() {
  const [w, d, h] = [0.6, 1.07, 2.0];
  const z = d / 2 - 0.09;
  const gk = 'rack_servers_01';
  const glassRack = moving(gk, 'Rack 42U se servery a prosklenými dveřmi', CAT, [...rackShell(gk, w, d, h), ...servers(gk, z, [[2, 'disk'], [2, 'disk'], [1, ''], [1, 'warn'], [2, 'disk'], [4, ''], [1, ''], [2, 'disk'], [1, ''], [2, ''], [4, 'disk']])], {
    node: 'door', at: [-w / 2 + 0.01, 0.06, d / 2 - 0.02], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 120, kind: 'door', prompt: 'Otevřít rack',
    parts: [...door('door', `${gk}_door`, 0, w - 0.02, 0, h - 0.1, 0, 0.02, { mat: 'rack_black', window: [0.045, 0.06], flat: true }), barHandle('door', `${gk}_door`, w - 0.045, 0.85, 1.15, 0.02, { rad: 0.008, off: 0.025 }), ...lock('door', `${gk}_door`, w - 0.045, 0.8, 0.02)],
    note: 'Čelní dveře racku 42U na pantu se otvírají o 110 až 180° podle sousedů v řadě; 120°. Úvaha, neměřeno.',
  }, { gen: gen('racks'), place: { mount: 'floor' }, group: 'world' });
  const mk = 'rack_servers_02';
  const meshRack = one(mk, 'Rack 42U se servery a děrovanými dveřmi', [
    ...rackShell(mk, w, d, h),
    ...servers(mk, z, [[1, ''], [1, ''], [1, ''], [1, ''], [2, 'disk'], [2, 'disk'], [1, ''], [1, 'warn'], [4, ''], [4, ''], [1, ''], [1, ''], [2, 'disk']]),
    // děrované dveře: rám a síťovina; přes síťovinu prosvítají kontrolky
    A('body', `${mk}_doorframe`, merge([flatBox([-w / 2 + 0.02, 0.06, d / 2 - 0.02], [-w / 2 + 0.06, h - 0.04, d / 2]), flatBox([w / 2 - 0.06, 0.06, d / 2 - 0.02], [w / 2 - 0.02, h - 0.04, d / 2]), flatBox([-w / 2 + 0.06, 0.06, d / 2 - 0.02], [w / 2 - 0.06, 0.12, d / 2]), flatBox([-w / 2 + 0.06, h - 0.1, d / 2 - 0.02], [w / 2 - 0.06, h - 0.04, d / 2])]), 'rack_black'),
    A('body', `${mk}_doormesh`, flatBox([-w / 2 + 0.06, 0.12, d / 2 - 0.012], [w / 2 - 0.06, h - 0.1, d / 2 - 0.008]), 'rack_mesh'),
    barHandle('body', `${mk}_door`, w / 2 - 0.04, 0.85, 1.15, d / 2, { rad: 0.008, off: 0.025 }),
  ], 'racks', floor());
  const nk = 'rack_network_01';
  const panels = [];
  const ports = [];
  const loops = { cable_blue: [], cable_yellow: [], cable_grey: [] };
  let y = 1.1;
  const names = ['cable_blue', 'cable_yellow', 'cable_grey'];
  for (let i = 0; i < 6; i++) {
    const patch = i % 2 === 0;
    panels.push(flatBox([-0.2225, y, z - (patch ? 0.1 : 0.4)], [0.2225, y + U - 0.002, z]));
    for (let k = 0; k < 2; k++) ports.push(flatBox([-0.2 + k * 0.21, y + 0.012, z], [-0.01 + k * 0.21, y + 0.03, z + 0.002]));
    // svazek propojovacích kabelů: oblouk z portů do bočního vedení
    for (let k = 0; k < 3; k++) loops[names[(i + k) % 3]].push(tube([[-0.15 + k * 0.15, y + 0.02, z + 0.002], [-0.15 + k * 0.15, y + 0.02, z + 0.05], [k < 1 ? -0.26 : 0.26, y - 0.03, z + 0.04]], 0.0035, 4, { bend: 0.03, bendSeg: 1 }));
    y += U * 1.5;
  }
  const net = [
    ...rackShell(nk, w, d, h),
    A('body', `${nk}_panels`, merge(panels), 'steel_dark'),
    A('body', `${nk}_ports`, merge(ports), 'bezel_black'),
    ...Object.entries(loops).map(([m, g]) => A('body', `${nk}_${m}`, merge(g), m)),
    A('body', `${nk}_managers`, merge([-1, 1].map((s) => flatBox([s * 0.26 - 0.025, 0.2, z - 0.06], [s * 0.26 + 0.025, 1.9, z + 0.03]))), 'rack_black'),
    ...servers(nk, z, [[2, ''], [1, '']]),
  ];
  const sk = 'rack_storage_01';
  const storage = one(sk, 'Rack 42U s diskovým polem', [...rackShell(sk, w, d, h), ...servers(sk, z, [[4, 'disk'], [4, 'disk'], [4, 'disk'], [4, 'disk'], [2, ''], [2, ''], [4, 'disk'], [4, 'disk']])], 'racks', floor());
  const fk = 'rack_open_frame_01';
  const frame = one(fk, 'Otevřený dvousloupkový rám 42U', [
    A('body', `${fk}_base`, roundedBox([-0.3, 0, -0.2], [0.3, 0.04, 0.2], 0.008, 1), 'rack_black'),
    A('body', `${fk}_posts`, merge([...[-1, 1].map((s) => roundedBox([s * 0.25 - 0.04, 0.04, -0.04], [s * 0.25 + 0.04, 2.0, 0.04], 0.006, 1)), roundedBox([-0.29, 1.96, -0.04], [0.29, 2.0, 0.04], 0.006, 1)]), 'rack_black'),
    ...servers(fk, 0.04, [[1, ''], [1, '']], 1.2, 0.19),
  ], 'racks', floor());
  return [glassRack, meshRack, one(nk, 'Síťový rack 42U s propojovacími panely', net, 'racks', floor()), storage, frame];
}

/** Superpočítač: skříň s kapalinovým chlazením 80 × 120 × 220 cm, proužek modrý nebo oranžový; potrubí nahoře. */
export function supercomputer() {
  return [['led_blue', 'modrý'], ['led_orange', 'oranžový']].map(([led, name], v) => {
    const [w, d, h] = [0.8, 1.2, 2.2];
    const k = `supercomputer_cabinet_${String(v + 1).padStart(2, '0')}`;
    const blades = [];
    for (let i = 0; i < 12; i++) blades.push(flatBox([-w / 2 + 0.08, 0.2 + i * 0.15, d / 2 + 0.005], [w / 2 - 0.08, 0.3 + i * 0.15, d / 2 + 0.01]));
    const parts = [
      shell('body', k, [-w / 2, 0.02, -d / 2], [w / 2, h, d / 2], 'rack_black', 0.02, 2),
      A('body', `${k}_front`, flatBox([-w / 2 + 0.05, 0.1, d / 2], [w / 2 - 0.05, h - 0.1, d / 2 + 0.005]), 'server_face'),
      A('body', `${k}_blades`, merge(blades), 'steel_dark'),
      A('body', `${k}_strip`, merge([flatBox([-w / 2 + 0.03, 0.1, d / 2], [-w / 2 + 0.05, h - 0.1, d / 2 + 0.01]), flatBox([w / 2 - 0.05, 0.1, d / 2], [w / 2 - 0.03, h - 0.1, d / 2 + 0.01])]), led),
      A('body', `${k}_badge`, flatBox([-0.3, h - 0.25, d / 2 + 0.005], [0.3, h - 0.15, d / 2 + 0.008]), 'paint_white_line'),
      A('body', `${k}_supply`, tube([[-0.2, h, -0.3], [-0.2, h + 0.25, -0.3], [-0.2, h + 0.25, -0.55]], 0.05, 10, { bend: 0.1, bendSeg: 3 }), 'paint_blue'),
      A('body', `${k}_return`, tube([[0.2, h, -0.3], [0.2, h + 0.25, -0.3], [0.2, h + 0.25, -0.55]], 0.05, 10, { bend: 0.1, bendSeg: 3 }), 'paint_red'),
    ];
    return one(k, `Skříň superpočítače s kapalinovým chlazením (${name} proužek)`, parts, 'supercomputer', floor());
  });
}

/** Napájení a chlazení: UPS, bateriová skříň, chladicí jednotka do řady, skříňová jednotka CRAH, láhev hasicího plynu. */
export function powerCooling() {
  const cab = (k, w, d, h, mat = 'rack_black') => [shell('body', k, [-w / 2, 0.03, -d / 2], [w / 2, h, d / 2], mat, 0.012), A('body', `${k}_plinth`, flatBox([-w / 2 + 0.02, 0, -d / 2 + 0.03], [w / 2 - 0.02, 0.03, d / 2 - 0.05]), 'bezel_black')];
  const ups = 'ups_cabinet_01';
  const bat = 'battery_cabinet_01';
  const irc = 'cooler_inrow_01';
  const crah = 'cooler_crah_01';
  const fg = 'cylinder_fire_gas_01';
  return [
    one(ups, 'UPS (zdroj nepřerušitelného napájení)', [...cab(ups, 0.6, 0.9, 1.9), ...screen('body', `${ups}_scr`, -0.2, 0.2, 1.4, 1.62, 0.45, { buttons: 4, led: 'emit_green' }), ...grille('body', `${ups}_v`, -0.25, 0.25, 0.2, 1.2, 0.45, 18)], 'powerCooling', floor()),
    one(bat, 'Bateriová skříň k UPS', [...cab(bat, 0.6, 0.9, 1.9), ...[0.3, 0.7, 1.1, 1.5].flatMap((y, i) => door('body', `${bat}_b${i}`, -0.25, 0.25, y, y + 0.32, 0.45, 0.01, { mat: 'server_face', r: 0.004 })), A('body', `${bat}_led`, flatBox([0.2, 1.84, 0.45], [0.24, 1.86, 0.455]), 'emit_green')], 'powerCooling', floor()),
    one(irc, 'Chladicí jednotka do řady racků', [...cab(irc, 0.3, 1.07, 2.0), ...grille('body', `${irc}_v`, -0.13, 0.13, 0.1, 1.8, 0.535, 24), ...screen('body', `${irc}_scr`, -0.1, 0.1, 1.84, 1.96, 0.535, { led: 'emit_green' })], 'powerCooling', floor()),
    one(crah, 'Skříňová chladicí jednotka (CRAH)', [...cab(crah, 1.7, 0.9, 1.95, 'key_white'), ...[-0.55, 0, 0.55].flatMap((x, i) => grille('body', `${crah}_g${i}`, x - 0.25, x + 0.25, 0.1, 1.7, 0.45, 14, { mat: 'cable_grey' })), ...screen('body', `${crah}_scr`, 0.5, 0.8, 1.75, 1.9, 0.45, { buttons: 3, led: 'emit_green' })], 'powerCooling', floor()),
    one(fg, 'Láhev hasicího plynu se ventilem', [
      A('body', `${fg}_body`, lathe([[0, 0], [0.13, 0.0, 'c'], [0.15, 0.04], [0.15, 1.2], [0.13, 1.3], [0.08, 1.36], [0.06, 1.4, 'c'], [0, 1.4]], { seg: 16 }), 'paint_red'),
      A('body', `${fg}_valve`, merge([roundedBox([-0.05, 1.4, -0.05], [0.05, 1.5, 0.05], 0.01, 1), moved(cylinder(0.02, 0, 0.06, { seg: 8 }), at(mTranslate(0.05, 1.45, 0), mRotate('z', -90)))]), 'brass'),
      A('body', `${fg}_hose`, tube([[0, 1.5, 0.0], [0, 1.6, 0.06], [0, 1.85, 0.06]], 0.015, 6, { bend: 0.05, bendSeg: 2 }), 'steel_brushed'),
      A('body', `${fg}_label`, lathe([[0.1515, 0.7], [0.1515, 0.95]], { a0: 240, a1: 300, seg: 4 }), 'label_paper'),
      A('body', `${fg}_strap`, lathe([[0.153, 1.0], [0.153, 1.04]], { seg: 16 }), 'steel_dark'),
    ], 'powerCooling', floor()),
  ];
}

/** Rozvody a drobnosti: kabelový žlab (prázdný a s kabely) ze stropu, děrovaná dlaždice, čtečka karet, kamera, Wi-Fi, přepínač. */
export function infrastructure() {
  const tray = (k, full) => {
    const wires = [];
    for (let i = 0; i <= 20; i++) wires.push(flatBox([-1 + i * 0.1 - 0.002, 0, -0.15], [-1 + i * 0.1 + 0.002, 0.006, 0.15]));
    const parts = [
      A('body', `${k}_wire`, merge([...wires, flatBox([-1, 0, -0.15], [1, 0.08, -0.144]), flatBox([-1, 0, 0.144], [1, 0.08, 0.15]), flatBox([-1, 0.074, -0.15], [1, 0.08, -0.14]), flatBox([-1, 0.074, 0.14], [1, 0.08, 0.15])]), 'steel_brushed'),
      A('body', `${k}_rods`, merge([-0.9, 0.9].flatMap((x) => [T(cylinder(0.006, 0.0, 0.6, { seg: 6 }), x, 0, 0), flatBox([x - 0.02, -0.01, -0.17], [x + 0.02, 0.0, 0.17])])), 'steel_dark'),
    ];
    if (full) parts.push(A('body', `${k}_yellow`, merge([0, 1, 2].map((i) => tube([[-1, 0.015 + (i % 2) * 0.01, -0.12 + i * 0.03], [1, 0.015 + (i % 2) * 0.01, -0.12 + i * 0.03]], 0.012, 5))), 'cable_yellow'), A('body', `${k}_blue`, merge([0, 1, 2, 3].map((i) => tube([[-1, 0.015 + (i % 2) * 0.015, 0.02 + i * 0.028], [1, 0.015 + (i % 2) * 0.015, 0.02 + i * 0.028]], 0.012, 5))), 'cable_blue'));
    return parts;
  };
  const ceiling = { physics: { body: 'static' }, place: { mount: 'ceiling' } };
  // u stropních prefabů je počátek na stropě a díly visí pod ním (jako svítidla v kit_base)
  const hang = (parts, topY) => shiftParts(parts, 0, -topY, 0);
  const wall = (h) => ({ physics: { body: 'static' }, place: { mount: 'wall', height: h } });
  const ft = 'floor_tile_perforated_01';
  const holes = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) holes.push(flatBox([-0.26 + i * 0.135, 0.012, -0.26 + k * 0.135], [-0.17 + i * 0.135, 0.0125, -0.17 + k * 0.135]));
  const sw = 'switch_desk_01';
  return [
    one('tray_cable_01', 'Kabelový žlab 2 m na závěsech, prázdný', hang(tray('tray_cable_01', false), 0.6), 'infrastructure', { components: ceiling, group: 'world' }),
    one('tray_cable_02', 'Kabelový žlab 2 m na závěsech, s kabely', hang(tray('tray_cable_02', true), 0.6), 'infrastructure', { components: ceiling, group: 'world' }),
    one(ft, 'Děrovaná dlaždice zdvojené podlahy 60 × 60 cm', [A('body', `${ft}_tile`, roundedBox([-0.3, 0, -0.3], [0.3, 0.012, 0.3], 0.003, 1), 'steel_dark'), A('body', `${ft}_holes`, merge(holes), 'rack_mesh')], 'infrastructure', { components: staticFloor(), group: 'world' }),
    one('reader_card_01', 'Čtečka přístupových karet', [A('body', 'reader_card_body', roundedBox([-0.04, 0, 0], [0.04, 0.12, 0.025], 0.008, 1), 'bezel_black'), A('body', 'reader_card_pad', flatBox([-0.025, 0.06, 0.025], [0.025, 0.1, 0.0265]), 'emit_green'), A('body', 'reader_card_keys', merge([0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => flatBox([-0.02 + c * 0.015, 0.012 + r * 0.014, 0.025], [-0.01 + c * 0.015, 0.02 + r * 0.014, 0.027])))), 'key_white')], 'infrastructure', { components: wall(1.2) }),
    one('camera_dome_01', 'Kupolová bezpečnostní kamera', hang([A('body', 'camera_dome_base', cylinder(0.075, 0.05, 0.07, { seg: 16, edge: 0.005 }), 'key_white'), A('body', 'camera_dome_glass', lathe(arc(0, 0.05, 0.05, -90, 0, 3), { seg: 16 }), 'screen_off')], 0.07), 'infrastructure', { components: ceiling }),
    one('access_point_01', 'Přístupový bod Wi-Fi', hang([A('body', 'access_point_body', roundedBox([-0.1, 0.002, -0.1], [0.1, 0.037, 0.1], 0.015, 2), 'key_white'), A('body', 'access_point_led', moved(cylinder(0.008, 0, 0.002, { seg: 8 }), mTranslate(0, 0, 0.06)), 'led_blue')], 0.037), 'infrastructure', { components: ceiling }),
    one(sw, 'Síťový přepínač na stůl s kabely', [
      A('body', `${sw}_body`, roundedBox([-0.14, 0.004, -0.08], [0.14, 0.04, 0.08], 0.006, 1), 'alu_space'),
      A('body', `${sw}_feet`, merge([-1, 1].flatMap((sx) => [-1, 1].map((sz) => T(cylinder(0.01, 0, 0.004, { seg: 6 }), sx * 0.11, 0, sz * 0.06)))), 'rubber_black'),
      A('body', `${sw}_ports`, merge([0, 1, 2, 3, 4, 5, 6, 7].map((i) => flatBox([-0.12 + i * 0.03, 0.012, 0.08], [-0.1 + i * 0.03, 0.028, 0.0815]))), 'bezel_black'),
      A('body', `${sw}_blue`, merge([0, 2, 4].map((i) => tube([[-0.11 + i * 0.03, 0.02, 0.08], [-0.11 + i * 0.03, 0.02, 0.12], [-0.11 + i * 0.03 + 0.02, 0.006, 0.2]], 0.003, 4, { bend: 0.02, bendSeg: 2 }))), 'cable_blue'),
      A('body', `${sw}_grey`, merge([1, 3].map((i) => tube([[-0.11 + i * 0.03, 0.02, 0.08], [-0.11 + i * 0.03, 0.02, 0.12], [-0.11 + i * 0.03 - 0.02, 0.006, 0.2]], 0.003, 4, { bend: 0.02, bendSeg: 2 }))), 'cable_grey'),
      A('body', `${sw}_led`, flatBox([0.11, 0.015, 0.08], [0.125, 0.025, 0.082]), 'emit_green'),
    ], 'infrastructure'),
  ];
}

export const SERVER = [racks, supercomputer, powerCooling, infrastructure];
