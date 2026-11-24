// A2.6 v Node: díl `shape: "mesh"` a kolize `hull` / `mesh` z binárního glTF (src/world/glb.js, assets.js).
// Zkušební modely vyrábí test kódem (a_lib/glb.mjs), soubory jdou do pack.files tak, jak je má vložit build
// (N-111). Textura barvy se dekóduje jen v prohlížeči (a_26_view.cjs); tady se hlídá, že UV sítě z .glb
// nedělí uvScale a že chybějící soubor hru nezastaví.

import { h, makeGame, loadPack, fmt } from './a_lib/node.mjs';
import { makeGlb, boxMesh } from './a_lib/glb.mjs';
import { parseGlb, glbGeometry, glbBaseColor } from '../src/world/glb.js';
import { createAssets } from '../src/world/assets.js';

// pořadí jako ve větě: co se ověřuje, podmínka, podrobnost (h.ok bere podmínku první)
const ok = (name, cond, detail = '') => h.ok(!!cond, name, detail);
const tris = (g) => g.indices.length / 3;
/** Všechny trojúhelníky mají pořadí vrcholů proti směru hodin při pohledu z vnějšku (normála ven). */
function outward(g) {
  const P = g.positions;
  const N = g.normals;
  let bad = 0;
  for (let k = 0; k < g.indices.length; k += 3) {
    const [a, b, c] = [g.indices[k], g.indices[k + 1], g.indices[k + 2]];
    const u = [0, 1, 2].map((q) => P[b * 3 + q] - P[a * 3 + q]);
    const v = [0, 1, 2].map((q) => P[c * 3 + q] - P[a * 3 + q]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[0] * N[a * 3] + n[1] * N[a * 3 + 1] + n[2] * N[a * 3 + 2] <= 0) bad++;
  }
  return bad;
}
const bbox = (g) => {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < g.positions.length; i++) {
    min[i % 3] = Math.min(min[i % 3], g.positions[i]);
    max[i % 3] = Math.max(max[i % 3], g.positions[i]);
  }
  return { min, max };
};
const close = (a, b, eps = 1e-5) => a.every((x, i) => Math.abs(x - b[i]) <= eps);
const S = Math.SQRT1_2;

// ---- 1. glb.js: geometrie, transformace uzlů, výběr uzlu, úmluvy COL_ a _LOD
{
  const unit = boxMesh([-0.5, 0, -0.5], [0.5, 1, 0.5]);
  const g = glbGeometry(parseGlb(makeGlb([{ name: 'body', mesh: unit }])));
  ok('glb: kvádr má 12 trojúhelníků a 24 vrcholů', tris(g) === 12 && g.positions.length === 72, `${tris(g)} △, ${g.positions.length / 3} vrcholů`);
  ok('glb: všechny trojúhelníky lícem ven', outward(g) === 0, `${outward(g)} obrácených`);
  // UV: glTF má v = 0 nahoře, engine dole (jako geom.js); první vrchol stěny +X má v glTF (0, 1)
  ok('glb: UV převrácené na v = 0 dole', g.uvs[0] === 0 && g.uvs[1] === 0 && g.uvs[5] === 1, `první vrchol ${g.uvs.slice(0, 2)}, třetí ${g.uvs.slice(4, 6)}`);

  // rodič posunutý o [1, 2, 3], potomek otočený o 90° kolem Y a zvětšený 2×: bod (0,5; 0; 0) → (0; 0; −1) + [1, 2, 3]
  const tree = parseGlb(
    makeGlb([
      { name: 'root', translation: [1, 2, 3], children: [1] },
      { name: 'arm', rotation: [0, S, 0, S], scale: [2, 2, 2], mesh: unit },
    ]),
  );
  const t = glbGeometry(tree);
  const tb = bbox(t);
  ok('glb: transformace uzlů (posun rodiče, otočení a měřítko potomka)', close(tb.min, [0, 2, 2]) && close(tb.max, [2, 4, 4]), `obal ${fmt(tb.min)} až ${fmt(tb.max)}`);
  const nx = [t.normals[0], t.normals[1], t.normals[2]];
  ok('glb: normála se otáčí s uzlem a zůstává jednotková', close(nx, [0, 0, -1]), `normála stěny +X ${fmt(nx)}`);
  ok('glb: výběr #uzel bere i potomky', glbGeometry(tree, 'root') !== null && tris(glbGeometry(tree, 'root')) === 12);
  ok('glb: neexistující uzel vrací null', glbGeometry(tree, 'nic') === null);

  const kit = parseGlb(
    makeGlb([
      { name: 'body', mesh: unit, color: [0.2, 0.4, 0.6] },
      { name: 'body_LOD1', mesh: unit },
      { name: 'COL_body', mesh: boxMesh([-0.6, 0, -0.6], [0.6, 1.1, 0.6]) },
    ]),
  );
  ok('glb: bez výběru se COL_* a *_LODn nekreslí', tris(glbGeometry(kit)) === 12, `${tris(glbGeometry(kit))} △`);
  const col = glbGeometry(kit, 'COL_body');
  ok('glb: COL_* jde vybrat výslovně', col && close(bbox(col).max, [0.6, 1.1, 0.6]));
  ok('glb: základní barva materiálu (baseColorFactor)', close(glbBaseColor(kit, 'body'), [0.2, 0.4, 0.6]), JSON.stringify(glbBaseColor(kit, 'body')));

  const mirror = glbGeometry(parseGlb(makeGlb([{ name: 'm', scale: [-1, 1, 1], mesh: unit }])));
  ok('glb: zrcadlený uzel (záporné měřítko) má trojúhelníky dál lícem ven', outward(mirror) === 0, `${outward(mirror)} obrácených`);
  const bare = glbGeometry(parseGlb(makeGlb([{ name: 'b', mesh: { positions: unit.positions, indices: unit.indices } }])));
  ok('glb: síť bez normál dostane normály ploch, lícem ven', outward(bare) === 0 && Math.abs(Math.hypot(bare.normals[0], bare.normals[1], bare.normals[2]) - 1) < 1e-6);
  let msg = '';
  try {
    parseGlb(new TextEncoder().encode('{"asset":{}}'));
  } catch (e) {
    msg = e.message;
  }
  ok('glb: jiný soubor než .glb hází srozumitelnou chybu', /není binární glTF/.test(msg), msg);
}

// ---- 2. assets.js: klíče souborů, base64, chybějící soubor, materiál z glTF
{
  const glb = makeGlb([{ name: 'body', mesh: boxMesh([0, 0, 0], [1, 1, 1]), color: [0.9, 0.1, 0.1] }]);
  const b64 = Buffer.from(glb).toString('base64');
  const pack = { manifest: { id: 'p', requires: ['kit'] }, files: { 'p/a.glb': glb, 'kit/b.glb': b64, 'c.glb': glb } };
  const A = createAssets(pack);
  ok('assets: hlavní balík, závislost (base64) i klíč bez balíku', A.has('a.glb') && A.has('b.glb') && A.has('c.glb') && A.bytes('b.glb').length === glb.length);
  ok('assets: from = balík původu prefabu', A.has('b.glb', 'kit') && !A.has('a.glb', 'kit'));
  const m = A.meshOf({ node: 'n', shape: 'mesh', mesh: 'b.glb#body' }, 'kit');
  ok('assets: díl mesh ze závislosti', m && tris(m) === 12 && A.stat.meshParts === 1);
  ok('assets: chybějící soubor vrací null a hlásí se', A.meshOf({ node: 'n', shape: 'mesh', mesh: 'nic.glb' }) === null && A.problems.some((p) => p.includes('nic.glb')), A.problems.join(' | '));
  const own = A.materialOf({ node: 'n', shape: 'mesh', mesh: 'a.glb#body' });
  ok('assets: díl bez mat dostane materiál z glTF (barva)', own?.id === 'glb:a.glb#body' && close(own.def.color, [0.9, 0.1, 0.1]) && own.def.model === 'lit');
  const hull = A.colliderOf({ node: 'n', shape: 'mesh', mesh: 'a.glb' }, null, true);
  ok('assets: kolize mesh u dynamického tělesa → konvexní obal', hull?.shape.type === 'hull' && hull.shape.points.length === 24);
  const tri = A.colliderOf({ node: 'n', shape: 'mesh', mesh: 'a.glb' }, null, false);
  ok('assets: kolize mesh u pevného tělesa → síť trojúhelníků', tri?.shape.type === 'trimesh' && tri.shape.indices.length === 36);
  ok('assets: box a ostatní tvary dál z geom.js', A.colliderOf({ node: 'n', shape: 'box', min: [0, 0, 0], max: [1, 2, 1] }).shape.type === 'box');
}

// ---- 3. ve hře: pevný prefab se sítí a kolizí z .glb, krabice s obalem, díl bez souboru
const base = await loadPack();
const stand = makeGlb([
  { name: 'body', mesh: boxMesh([-0.4, 0, -0.4], [0.4, 1.6, 0.4]) },
  { name: 'COL_body', mesh: boxMesh([-0.4, 0, -0.4], [0.4, 1.6, 0.4]) },
  { name: 'plain', mesh: boxMesh([-0.1, 1.6, -0.1], [0.1, 1.8, 0.1]), color: [0.1, 0.8, 0.2] },
]);
const crateGlb = makeGlb([{ name: 'COL_crate', mesh: boxMesh([-0.4, 0, -0.4], [0.4, 0.8, 0.4]) }]);
function variant({ files = true, missing = false } = {}) {
  const p = structuredClone(base);
  p.materials.materials.tex_test = { model: 'lit', color: [0.8, 0.8, 0.8], albedo: 'textures/test.png', uvScale: 2, surface: 'metal' };
  const parts = [
    { node: 'root', shape: 'mesh', mesh: 'models/stand.glb#body', mat: 'tex_test' },
    { node: 'root', shape: 'mesh', mesh: 'models/stand.glb#plain' },
  ];
  if (missing) parts.push({ node: 'root', shape: 'mesh', mesh: 'models/none.glb', mat: 'steel' });
  p.prefabs.push({
    file: 'prefabs/test_mesh_01.json',
    data: {
      xspace: 1, kind: 'prefab', id: 'test_mesh_01', title: 'Zkušební stojan z .glb', category: 'prop.test',
      bounds: { min: [-0.4, 0, -0.4], max: [0.4, 1.8, 0.4] }, rig: { nodes: [{ id: 'root' }] }, parts,
      colliders: [{ node: 'root', shape: 'mesh', mesh: 'models/stand.glb#COL_body', group: 'world' }],
      components: { physics: { body: 'static' } },
    },
  });
  const crate = p.prefabs.find((x) => x.data.id === 'crate_wood_01').data;
  crate.colliders = [{ node: crate.colliders[0].node, shape: 'mesh', mesh: 'models/crate.glb#COL_crate' }];
  p.levels[0].data.entities.push({ id: 'e_stand', prefab: 'test_mesh_01', cell: 'c_hall', pos: [4, 0, -18], rot: [0, 0, 0] });
  if (files) p.files = { 'golden/models/stand.glb': stand, 'golden/models/crate.glb': crateGlb };
  return p;
}
const started = async (pack) => {
  const g = await makeGame({ pack, shadows: false });
  g.start();
  g.sim(1);
  return g;
};
{
  const ref = await started(structuredClone(base));
  const refTris = ref.render.counts.staticTris;
  const game = await started(variant({ missing: true }));
  const A = game.assets;
  const added = game.render.counts.staticTris - refTris;
  ok('hra: díly z .glb jsou v geometrii levelu', added === 24, `+${added} △ proti zlatému vzorku (čekám 2 × 12)`);
  ok('hra: počty sítí a kolizí z .glb', A.stat.meshParts >= 2 && A.stat.trimeshes === 1 && A.stat.hulls === 6, JSON.stringify(A.stat));
  const batch = game.render.statics.find((b) => b.cell === 'c_hall' && b.mat === 'tex_test');
  const maxUv = batch ? Math.max(...batch.uvs) : NaN;
  ok('hra: UV sítě z .glb se nedělí uvScale (2)', batch && maxUv === 1 && Math.min(...batch.uvs) === 0, `UV ${fmt(Math.min(...batch.uvs))} až ${fmt(maxUv)}`);
  ok('hra: síť z .glb nese světlo po vrcholech (barva vrcholů)', batch?.colors && batch.colors.some((c) => c > 0), batch ? `${batch.count} vrcholů` : 'dávka chybí');
  ok('hra: díl bez mat má materiál z glTF', game.render.statics.some((b) => b.mat === 'glb:models/stand.glb#plain') && game.pack.materials.materials['glb:models/stand.glb#plain']?.color[1] > 0.7);
  ok('hra: chybějící soubor se hlásí, hra jede', A.problems.some((p) => p.includes('none.glb')), A.problems.join(' | '));
  // paprsek ve výšce pasu proti stojanu (střed x = 4, šířka 0,8 m): kolize je síť trojúhelníků z COL_body
  const hit = game.phys.raycast(2, 0.8, -18, 1, 0, 0, 5, 0xffffffff);
  ok('hra: kolize z .glb zastaví paprsek na přední stěně stojanu', hit && Math.abs(hit.dist - 1.6) < 0.01 && hit.ref?.ent?.id === 'e_stand', hit ? `vzdálenost ${fmt(hit.dist)} m, ${hit.ref?.ent?.id}` : 'bez zásahu');
  const crate = game.entities.byId('e_crate_h1');
  const y = crate.body.translation().y;
  ok('hra: krabice s kolizí mesh (→ obal) leží na podlaze', Math.abs(y) < 0.02, `y = ${fmt(y)}`);
}
{
  const game = await started(variant({ files: false }));
  ok('hra bez pack.files: level se postaví, díly z .glb chybí a hlásí se', game.assets.problems.some((p) => p.includes('stand.glb')) && !!game.entities.byId('e_stand'), game.assets.problems.slice(0, 2).join(' | '));
}

process.exit(h.finish('A2.6 síť .glb (Node)'));
