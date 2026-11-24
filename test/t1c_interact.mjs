// T1c: víc interakcí v jednom prefabu (N-010, D-052). Seznam interakcí s id, výběr interakce podle
// zasaženého uzlu, dveře portálu, upřesnění spojení `from` / `to`; jediná interakce jako objekt platí dál.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import * as X from '../src/xspace/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { pack } = await checkPackDir(path.join(root, 'packs/golden'));

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const P = (p, id) => p.prefabs.find((x) => x.data.id === id)?.data;
const L = (p) => p.levels[0].data;
const codes = (r) => [...r.errors, ...r.warnings].map((x) => x.code);

// kartotéka se čtyřmi zásuvkami jako jeden prefab; madlo je uzel bez kloubu pod první zásuvkou
const door = P(pack, 'door_hinged_01');
const mat = Object.keys(pack.materials.materials)[0];
const box = (node, min, max) => ({ node, shape: 'box', min, max, mat });
const cabinet = {
  xspace: door.xspace,
  kind: door.kind,
  source: clone(door.source),
  id: 'cabinet_file_09',
  title: 'Kartotéka se čtyřmi zásuvkami (zkouška N-010)',
  category: 'prop.furniture',
  bounds: { min: [-0.25, 0, -0.3], max: [0.25, 1.32, 0.3] },
  rig: {
    nodes: [{ id: 'body' }, ...[1, 2, 3, 4].map((k) => ({ id: `d${k}`, parent: 'body', pos: [0, 0.33 * (k - 1), 0] })), { id: 'h1', parent: 'd1', pos: [0, 0.2, 0.3] }],
    joints: [1, 2, 3, 4].map((k) => ({ id: `s${k}`, node: `d${k}`, type: 'slider', axis: [0, 0, 1], min: 0, max: 0.45, rest: 0, speed: 0.5 })),
  },
  parts: [box('body', [-0.25, 0, -0.3], [0.25, 1.32, -0.28]), ...[1, 2, 3, 4].map((k) => box(`d${k}`, [-0.23, 0.02, -0.28], [0.23, 0.3, 0.3])), box('h1', [-0.05, -0.01, 0], [0.05, 0.01, 0.03])],
  colliders: [{ node: 'body', shape: 'box', min: [-0.25, 0, -0.3], max: [0.25, 1.32, -0.28] }, ...[1, 2, 3, 4].map((k) => ({ node: `d${k}`, shape: 'box', min: [-0.23, 0.02, -0.28], max: [0.23, 0.3, 0.3] }))],
  components: { physics: { body: 'kinematic' }, interact: [1, 2, 3, 4].map((k) => ({ id: `d${k}`, kind: 'drawer', joint: `s${k}`, prompt: 'Vytáhnout', manipulate: true })) },
  inputs: ['open', 'close', 'toggle', 'lock', 'unlock'],
  outputs: ['opened', 'closed'],
};

function withCabinet(mutate) {
  const m = clone(pack);
  const cab = clone(cabinet);
  m.prefabs.push({ file: 'prefabs/cabinet_file_09.json', data: cab });
  const cell = L(m).cells[0];
  const mid = [0, 2].map((k) => (cell.bounds.min[k] + cell.bounds.max[k]) / 2);
  L(m).entities.push({ id: 'e_cab', prefab: cab.id, cell: cell.id, pos: [mid[0], cell.bounds.min[1], mid[1]], io: [{ on: 'opened', from: 'd2', target: 'e_door_lab', input: 'open' }] });
  L(m).entities.find((e) => e.id === 'e_door_start').io = [{ on: 'opened', target: 'e_cab', input: 'lock', to: 'd3' }, { on: 'closed', target: 'e_cab', input: 'unlock' }];
  if (mutate) mutate(m, P(m, cab.id), L(m));
  return X.validatePack(m);
}

// ---- platná data
{
  const r = withCabinet();
  ok(r.ok && r.warnings.length === 0, 'kartotéka se čtyřmi interakcemi, from a to ve spojeních projde validátorem bez nálezu', codes(r).join(' ') || 'bez nálezů');
  const g = X.validatePack(clone(pack));
  ok(g.ok && g.warnings.length === 0, 'zlatý vzorek (jediné interakce jako objekt) beze změny projde');
}

// ---- interactions, interactionById, interactionOf, doorInteraction
{
  const list = X.interactions(cabinet);
  ok(list.length === 4 && list.map((x) => x.id).join() === 'd1,d2,d3,d4', 'interactions: seznam v pořadí dat');
  const one = X.interactions(door);
  ok(one.length === 1 && one[0].id === X.INTERACT_MAIN && one[0].kind === 'door' && door.components.interact.id === undefined, 'jediný objekt bez id je „main“ a data se nemění');
  ok(X.interactions({ components: {} }).length === 0 && X.interactions(null).length === 0, 'prefab bez interakce: prázdný seznam');
  ok(X.interactionById(door)?.kind === 'door' && X.interactionById(door, 'main')?.kind === 'door' && X.interactionById(cabinet, 'd3')?.joint === 's3' && X.interactionById(cabinet) === null, 'interactionById: main, id ze seznamu; bez id jen u jediné interakce');
  const of = (pf, n) => X.interactionOf(pf, n)?.id ?? null;
  ok(of(cabinet, 'd3') === 'd3' && of(cabinet, 'h1') === 'd1' && of(cabinet, 'body') === null, 'interactionOf: uzel zásuvky, madlo pod ní (předek), pevný korpus nic', `${of(cabinet, 'd3')} ${of(cabinet, 'h1')} ${of(cabinet, 'body')}`);
  ok(of(door, 'frame') === 'main' && of(door, 'leaf') === 'main', 'interactionOf: jediná interakce platí pro celý prefab');
  // skříňka: dvě dvířka, pravé sleduje levé (N-002), a zásuvka; tlačítko bez kloubu
  const cab2 = clone(cabinet);
  cab2.rig.nodes.push({ id: 'dl', parent: 'body', pos: [-0.25, 1.4, 0.3] }, { id: 'dr', parent: 'body', pos: [0.25, 1.4, 0.3] });
  cab2.rig.joints.push({ id: 'hl', node: 'dl', type: 'hinge', axis: [0, 1, 0], min: 0, max: 100 }, { id: 'hr', node: 'dr', type: 'hinge', axis: [0, 1, 0], min: -100, max: 0, follow: { joint: 'hl', ratio: -1 } });
  cab2.components.interact = [{ id: 'doors', kind: 'door', joint: 'hl' }, { id: 'd1', kind: 'drawer', joint: 's1' }, { id: 'bell', kind: 'button', joint: 's2' }];
  ok(of(cab2, 'dr') === 'doors' && of(cab2, 'dl') === 'doors' && of(cab2, 'd4') === null, 'interactionOf: svázaný kloub patří interakci kloubu, který sleduje');
  const cab3 = clone(cabinet);
  cab3.components.interact = [{ id: 'd1', kind: 'drawer', joint: 's1' }, { id: 'look', kind: 'station', station: { eye: [0, 1.5, 1], look: [0, 1, 0] } }];
  ok(of(cab3, 'body') === 'look' && of(cab3, 'h1') === 'd1', 'interactionOf: uzel bez kloubu interakce dostane jedinou interakci bez kloubu');
  ok(X.doorInteraction(door)?.id === 'main' && X.doorInteraction(cabinet) === null && X.doorInteraction(cab2)?.id === 'doors', 'doorInteraction: dveře jen jednoznačně');
}

// ---- mutace: každá vyvolá svůj kód
const MUT = [
  ['interact.id', 'položka seznamu bez id', (m, c) => delete c.components.interact[1].id],
  ['interact.id', 'dvě interakce se stejným id', (m, c) => (c.components.interact[2].id = 'd1')],
  ['interact.jointTwice', 'dvě interakce na jednom kloubu', (m, c) => (c.components.interact[1].joint = 's1')],
  ['interact.solo', 'uchopení v seznamu s dalšími interakcemi', (m, c) => c.components.interact.push({ id: 'g', kind: 'grab' })],
  ['ref.joint', 'interakce v seznamu s neexistujícím kloubem', (m, c) => (c.components.interact[3].joint = 'neni')],
  ['interact.joint', 'zásuvka v seznamu bez kloubu', (m, c) => delete c.components.interact[0].joint],
  ['shape.enum', 'neznámý druh v položce seznamu', (m, c) => (c.components.interact[0].kind = 'neni')],
  ['shape.length', 'prázdný seznam interakcí', (m, c) => (c.components.interact = [])],
  ['rig.follow', 'svázaný kloub je kloubem jedné z interakcí', (m, c) => (c.rig.joints[3].follow = { joint: 's1', ratio: 1 })],
  ['io.from', 'spojení z neexistující interakce', (m, c, lv) => (lv.entities.find((e) => e.id === 'e_cab').io[0].from = 'd9')],
  ['io.to', 'spojení do neexistující interakce cíle', (m, c, lv) => (lv.entities.find((e) => e.id === 'e_door_start').io[0].to = 'd9')],
  ['io.to', 'upřesnění to u vestavěného cíle', (m, c, lv) => lv.entities.find((e) => e.id === 'e_door_start').io.push({ on: 'opened', target: '@level', input: 'checkpoint', to: 'd1' })],
  ['io.from', 'upřesnění from u spouštěče', (m, c, lv) => (lv.triggers[0].io[0].from = 'd1')],
  ['portal.door', 'dveře portálu se dvěma interakcemi dveří', (m) => (P(m, 'door_hinged_01').components.interact = [{ id: 'a', kind: 'door', joint: 'hinge' }, { id: 'b', kind: 'door', joint: 'hinge' }])],
];
for (const [code, name, mutate] of MUT) {
  const r = withCabinet(mutate);
  const found = codes(r).includes(code);
  ok(found, `validátor chytí: ${name}`, found ? code : `čekáno ${code}, nalezeno: ${codes(r).join(' ') || 'nic'}`);
}
{
  const r = withCabinet((m, c) => delete c.components.interact[1].id);
  const f = r.errors.find((x) => x.code === 'interact.id');
  ok(f && f.path.endsWith('components.interact[1]'), 'nález ukazuje na položku seznamu', f?.path);
  const d = clone(pack);
  delete P(d, 'door_hinged_01').components.interact.joint;
  const e = X.validatePack(d).errors.find((x) => x.code === 'interact.joint');
  ok(e && e.path.endsWith('components.interact'), 'u jediné interakce zůstává cesta nálezu beze změny', e?.path);
}

console.log(`\nT1c interakce: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
