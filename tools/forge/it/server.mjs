// Sada kit_it: serverovna a superpočítač. Rack 42U 60 × 107 × 200 cm (výška jednotky 44,45 mm), rack s prosklenými
// dveřmi na pantu, síťový rack s propojovacími panely a kabely, diskové pole, otevřený rám; skříň superpočítače
// s kapalinovým chlazením (dvě barvy proužku), UPS a bateriová skříň, chladicí jednotka do řady a skříňová (CRAH),
// kabelový žlab ze stropu, děrovaná dlaždice zdvojené podlahy, láhev hasicího plynu, přístupová čtečka, kamera,
// přístupový bod Wi-Fi, přepínač na stůl. Rozměry obvyklé pro 19" techniku; tvar obecný.

import { box, boxc, cyl, shiftPart, shiftParts } from '../lib.mjs';
import { bevelBox } from '../shapes.mjs';
import { simple, moving, staticFloor } from '../lab/common.mjs';

const CAT = 'it.server';
const gen = (f) => `it/server.mjs#${f}`;
const U = 0.04445;
const floor = () => ({ components: staticFloor(), group: 'world' });
const one = (id, title, parts, f, o = {}) => simple(id, title, CAT, parts, { gen: gen(f), ...o });

/** Skříň racku 42U bez dveří: boky, záda, strop, sokl, svislé lišty; vrací díly a výšku vnitřku. */
function rackShell(w = 0.6, d = 1.07, h = 2.0) {
  return [box('body', [-w / 2, 0.05, -d / 2], [-w / 2 + 0.02, h, d / 2], 'rack_black'), box('body', [w / 2 - 0.02, 0.05, -d / 2], [w / 2, h, d / 2], 'rack_black'), box('body', [-w / 2 + 0.02, 0.05, -d / 2], [w / 2 - 0.02, h, -d / 2 + 0.02], 'rack_mesh'), box('body', [-w / 2, h - 0.03, -d / 2], [w / 2, h, d / 2], 'rack_black'), box('body', [-w / 2 + 0.03, 0, -d / 2 + 0.05], [w / 2 - 0.03, 0.05, d / 2 - 0.05], 'rack_black'), ...[-1, 1].map((s) => box('body', [s * 0.2325 - 0.01, 0.1, d / 2 - 0.1], [s * 0.2325 + 0.01, h - 0.05, d / 2 - 0.08], 'steel_dark'))];
}

/** Servery 1U až 4U od výšky y v čelní rovině z; vrací díly (čelo, LED, disky). */
function servers(z, list, y = 0.12) {
  const out = [];
  for (const [u, kind] of list) {
    const h = u * U - 0.002;
    out.push(box('body', [-0.2225, y, z - 0.75], [0.2225, y + h, z], 'server_face'));
    if (kind === 'disk') for (let i = 0; i < 6; i++) out.push(box('body', [-0.2 + i * 0.068, y + 0.004, z], [-0.14 + i * 0.068, y + h - 0.004, z + 0.003], 'steel_dark'));
    out.push(box('body', [0.19, y + h / 2 - 0.003, z], [0.2, y + h / 2 + 0.003, z + 0.004], kind === 'warn' ? 'led_orange' : 'led_blue'), box('body', [0.17, y + h / 2 - 0.003, z], [0.18, y + h / 2 + 0.003, z + 0.004], 'emit_green'));
    y += u * U;
  }
  return out;
}

/** Racky 42U: se servery a prosklenými dveřmi (kloub), síťový s kabely, diskové pole, otevřený rám. */
export function racks() {
  const [w, d, h] = [0.6, 1.07, 2.0];
  const z = d / 2 - 0.09;
  const full = servers(z, [[2, 'disk'], [2, 'disk'], [1, ''], [1, 'warn'], [2, 'disk'], [4, ''], [1, ''], [2, 'disk'], [1, ''], [2, ''], [4, 'disk']]);
  const glassRack = moving('rack_servers_01', 'Rack 42U se servery a prosklenými dveřmi', CAT, [...rackShell(w, d, h), ...full], {
    node: 'door', at: [-w / 2 + 0.01, 0.06, d / 2 - 0.02], joint: 'swing', type: 'hinge', axis: [0, -1, 0], max: 120, kind: 'door', prompt: 'Otevřít rack',
    parts: [box('door', [0, 0, 0], [w - 0.02, h - 0.1, 0.02], 'glass_tinted'), box('door', [0, 0, 0], [0.04, h - 0.1, 0.022], 'rack_black'), box('door', [w - 0.06, 0, 0], [w - 0.02, h - 0.1, 0.022], 'rack_black'), box('door', [w - 0.055, 0.9, 0.022], [w - 0.04, 1.1, 0.04], 'steel_brushed')],
    note: 'Čelní dveře racku 42U na pantu se otvírají o 110 až 180° podle sousedů v řadě; 120°. Úvaha, neměřeno.',
  }, { gen: gen('racks'), place: { mount: 'floor' }, group: 'world' });
  const meshRack = one('rack_servers_02', 'Rack 42U se servery a děrovanými dveřmi', [...rackShell(w, d, h), ...servers(z, [[1, ''], [1, ''], [1, ''], [1, ''], [2, 'disk'], [2, 'disk'], [1, ''], [1, 'warn'], [4, ''], [4, ''], [1, ''], [1, ''], [2, 'disk']]), box('body', [-w / 2 + 0.02, 0.06, d / 2 - 0.02], [w / 2 - 0.02, h - 0.04, d / 2], 'rack_mesh')], 'racks', floor());
  const net = [...rackShell(w, d, h)];
  let y = 1.1;
  for (let i = 0; i < 6; i++) {
    const patch = i % 2 === 0;
    net.push(box('body', [-0.2225, y, z - (patch ? 0.1 : 0.4)], [0.2225, y + U - 0.002, z], patch ? 'steel_dark' : 'server_face'));
    for (let k = 0; k < 4; k++) net.push(box('body', [-0.2 + k * 0.1, y + 0.01, z], [-0.13 + k * 0.1, y + 0.03, z + 0.03], i % 3 === 0 ? 'cable_blue' : i % 3 === 1 ? 'cable_yellow' : 'cable_grey'));
    if (!patch) net.push(box('body', [0.17, y + 0.018, z], [0.2, y + 0.026, z + 0.004], 'emit_green'));
    y += U * 1.5;
  }
  net.push(box('body', [-0.28, 0.2, z - 0.05], [-0.24, 1.9, z + 0.02], 'cable_blue'), box('body', [0.24, 0.2, z - 0.05], [0.28, 1.9, z + 0.02], 'cable_yellow'), ...servers(z, [[2, ''], [1, '']]));
  const storage = one('rack_storage_01', 'Rack 42U s diskovým polem', [...rackShell(w, d, h), ...servers(z, [[4, 'disk'], [4, 'disk'], [4, 'disk'], [4, 'disk'], [2, ''], [2, ''], [4, 'disk'], [4, 'disk']])], 'racks', floor());
  const frame = one('rack_open_frame_01', 'Otevřený dvousloupkový rám 42U', [box('body', [-0.3, 0, -0.2], [0.3, 0.04, 0.2], 'rack_black'), ...[-1, 1].map((s) => box('body', [s * 0.25 - 0.04, 0.04, -0.04], [s * 0.25 + 0.04, 2.0, 0.04], 'rack_black')), box('body', [-0.29, 1.96, -0.04], [0.29, 2.0, 0.04], 'rack_black'), ...servers(0.04, [[1, ''], [1, '']], 1.2).map((p) => ({ ...p, min: [p.min[0], p.min[1], Math.max(p.min[2], -0.15)] }))], 'racks', floor());
  return [glassRack, meshRack, one('rack_network_01', 'Síťový rack 42U s propojovacími panely', net, 'racks', floor()), storage, frame];
}

/** Superpočítač: skříň s kapalinovým chlazením 80 × 120 × 220 cm, proužek modrý nebo oranžový; uzel s potrubím. */
export function supercomputer() {
  return [['led_blue', 'modrý'], ['led_orange', 'oranžový']].map(([led, name], v) => {
    const [w, d, h] = [0.8, 1.2, 2.2];
    const parts = [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], 'rack_black', 0.015), box('body', [-w / 2 + 0.05, 0.1, d / 2], [w / 2 - 0.05, h - 0.1, d / 2 + 0.005], 'server_face'), box('body', [-w / 2 + 0.03, 0.1, d / 2], [-w / 2 + 0.05, h - 0.1, d / 2 + 0.01], led), box('body', [w / 2 - 0.05, 0.1, d / 2], [w / 2 - 0.03, h - 0.1, d / 2 + 0.01], led), box('body', [-0.3, h - 0.25, d / 2 + 0.005], [0.3, h - 0.15, d / 2 + 0.008], 'paint_white_line')];
    for (let i = 0; i < 12; i++) parts.push(box('body', [-w / 2 + 0.08, 0.2 + i * 0.15, d / 2 + 0.005], [w / 2 - 0.08, 0.3 + i * 0.15, d / 2 + 0.01], i % 4 === 0 ? 'steel_dark' : 'server_face'));
    parts.push(cyl('body', [-0.2, h + 0.15, -0.3], 0.05, 0.3, 'y', 'paint_blue'), cyl('body', [0.2, h + 0.15, -0.3], 0.05, 0.3, 'y', 'paint_red'));
    return one(`supercomputer_cabinet_${String(v + 1).padStart(2, '0')}`, `Skříň superpočítače s kapalinovým chlazením (${name} proužek)`, parts, 'supercomputer', floor());
  });
}

/** Napájení a chlazení: UPS, bateriová skříň, chladicí jednotka do řady, skříňová jednotka CRAH, láhev hasicího plynu. */
export function powerCooling() {
  const cab = (w, d, h, mat = 'rack_black') => [...bevelBox('body', [-w / 2, 0, -d / 2], [w / 2, h, d / 2], mat, 0.01)];
  return [
    one('ups_cabinet_01', 'UPS (zdroj nepřerušitelného napájení)', [...cab(0.6, 0.9, 1.9), box('body', [-0.2, 1.4, 0.45], [0.2, 1.6, 0.452], 'emit_display'), box('body', [-0.25, 0.2, 0.45], [0.25, 1.2, 0.452], 'rack_mesh'), box('body', [0.22, 1.65, 0.45], [0.25, 1.68, 0.454], 'emit_green')], 'powerCooling', floor()),
    one('battery_cabinet_01', 'Bateriová skříň k UPS', [...cab(0.6, 0.9, 1.9), ...[0.3, 0.7, 1.1, 1.5].map((y) => box('body', [-0.25, y, 0.45], [0.25, y + 0.25, 0.452], 'server_face'))], 'powerCooling', floor()),
    one('cooler_inrow_01', 'Chladicí jednotka do řady racků', [...cab(0.3, 1.07, 2.0), box('body', [-0.13, 0.1, 0.535], [0.13, 1.8, 0.537], 'rack_mesh'), box('body', [-0.1, 1.85, 0.535], [0.1, 1.95, 0.538], 'emit_display')], 'powerCooling', floor()),
    one('cooler_crah_01', 'Skříňová chladicí jednotka (CRAH)', [...cab(1.7, 0.9, 1.95, 'key_white'), ...[-0.55, 0, 0.55].map((x) => box('body', [x - 0.25, 0.1, 0.45], [x + 0.25, 1.7, 0.452], 'cable_grey')), box('body', [0.5, 1.75, 0.45], [0.8, 1.9, 0.452], 'emit_display')], 'powerCooling', floor()),
    one('cylinder_fire_gas_01', 'Láhev hasicího plynu se ventilem', [cyl('body', [0, 0.65, 0], 0.15, 1.3, 'y', 'paint_red'), cyl('body', [0, 1.35, 0], 0.08, 0.1, 'y', 'paint_red'), box('body', [-0.05, 1.4, -0.05], [0.05, 1.5, 0.05], 'brass'), cyl('body', [0, 1.6, 0.06], 0.02, 0.25, 'y', 'steel_brushed'), box('body', [-0.08, 0.7, 0.148], [0.08, 0.95, 0.152], 'label_paper')], 'powerCooling', floor()),
  ];
}

/** Rozvody a drobnosti: kabelový žlab (prázdný a s kabely) ze stropu, děrovaná dlaždice, čtečka karet, kamera, Wi-Fi, přepínač. */
export function infrastructure() {
  const tray = (full) => {
    const parts = [box('body', [-1, 0, -0.15], [1, 0.006, 0.15], 'steel_brushed'), box('body', [-1, 0, -0.15], [1, 0.08, -0.144], 'steel_brushed'), box('body', [-1, 0, 0.144], [1, 0.08, 0.15], 'steel_brushed'), ...[-0.9, 0.9].map((x) => box('body', [x - 0.01, 0.08, -0.01], [x + 0.01, 0.6, 0.01], 'steel_dark'))];
    if (full) parts.push(box('body', [-1, 0.006, -0.13], [1, 0.05, -0.02], 'cable_yellow'), box('body', [-1, 0.006, 0.0], [1, 0.06, 0.12], 'cable_blue'));
    return parts;
  };
  const ceiling = { physics: { body: 'static' }, place: { mount: 'ceiling' } };
  // u stropních prefabů je počátek na stropě a díly visí pod ním (jako svítidla v kit_base)
  const hang = (parts, top) => shiftParts(parts, 0, -top, 0);
  const wall = (h) => ({ physics: { body: 'static' }, place: { mount: 'wall', height: h } });
  return [
    one('tray_cable_01', 'Kabelový žlab 2 m na závěsech, prázdný', hang(tray(false), 0.6), 'infrastructure', { components: ceiling, group: 'world' }),
    one('tray_cable_02', 'Kabelový žlab 2 m na závěsech, s kabely', hang(tray(true), 0.6), 'infrastructure', { components: ceiling, group: 'world' }),
    one('floor_tile_perforated_01', 'Děrovaná dlaždice zdvojené podlahy 60 × 60 cm', [box('body', [-0.3, 0, -0.3], [0.3, 0.012, 0.3], 'rack_mesh'), box('body', [-0.3, 0, -0.3], [0.3, 0.006, 0.3], 'steel_dark')], 'infrastructure', { components: staticFloor(), group: 'world' }),
    one('reader_card_01', 'Čtečka přístupových karet', [box('body', [-0.04, 0, 0], [0.04, 0.12, 0.025], 'bezel_black'), box('body', [-0.025, 0.06, 0.025], [0.025, 0.1, 0.027], 'emit_green')], 'infrastructure', { components: wall(1.2) }),
    one('camera_dome_01', 'Kupolová bezpečnostní kamera', hang([cyl('body', [0, 0.06, 0], 0.07, 0.02, 'y', 'key_white'), cyl('body', [0, 0.025, 0], 0.05, 0.05, 'y', 'screen_off')], 0.07), 'infrastructure', { components: ceiling }),
    one('access_point_01', 'Přístupový bod Wi-Fi', hang([...bevelBox('body', [-0.1, 0.002, -0.1], [0.1, 0.037, 0.1], 'key_white', 0.012), box('body', [-0.008, 0, 0.05], [0.008, 0.002, 0.066], 'led_blue')], 0.037), 'infrastructure', { components: ceiling }),
    one('switch_desk_01', 'Síťový přepínač na stůl s kabely', [...bevelBox('body', [-0.14, 0, -0.08], [0.14, 0.04, 0.08], 'alu_space', 0.004), ...[0, 1, 2, 3, 4].map((i) => box('body', [-0.12 + i * 0.05, 0.01, 0.08], [-0.1 + i * 0.05, 0.03, 0.15], i % 2 ? 'cable_blue' : 'cable_grey')), box('body', [0.11, 0.015, 0.08], [0.125, 0.025, 0.082], 'emit_green')], 'infrastructure'),
  ];
}

export const SERVER = [racks, supercomputer, powerCooling, infrastructure];
