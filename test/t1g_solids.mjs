// T1g: díly prefabu lathe a rbox (N-012, D-058). Síť je uzavřená, líc míří ven (objem vyjde kladný a přesně
// podle vzorce mnohoúhelníku), meze sedí, osa a střed lathe, výseč, počty △; pevné díly lathe a rbox nesou vzorky
// světla a rovné plochy dostanou mapu v atlasu, oblé ne; validátor chytí chybná data.

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
const codes = (r) => [...r.errors, ...r.warnings].map((x) => x.code);

/** Rozbor sítě: meze, objem (věta o divergenci), uzavřenost podle poloh, jednotkové normály, líc podle normál. */
function study(m) {
  const P = m.positions;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) {
    lo[k] = Math.min(lo[k], P[i + k]);
    hi[k] = Math.max(hi[k], P[i + k]);
  }
  let vol = 0;
  let wrong = 0;
  const key = (i) => `${P[i * 3].toFixed(9)},${P[i * 3 + 1].toFixed(9)},${P[i * 3 + 2].toFixed(9)}`;
  const edges = new Map();
  for (let t = 0; t < m.indices.length; t += 3) {
    const [a, b, c] = [m.indices[t], m.indices[t + 1], m.indices[t + 2]];
    const A = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]];
    const B = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]];
    const C = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]];
    vol += (A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0])) / 6;
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    let d = 0;
    for (const i of [a, b, c]) d += n[0] * m.normals[i * 3] + n[1] * m.normals[i * 3 + 1] + n[2] * m.normals[i * 3 + 2];
    if (d < 0) wrong++;
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const e = [key(p), key(q)].sort().join('|');
      edges.set(e, (edges.get(e) || 0) + 1);
    }
  }
  let unit = 0;
  for (let i = 0; i < m.normals.length; i += 3) if (Math.abs(Math.hypot(m.normals[i], m.normals[i + 1], m.normals[i + 2]) - 1) > 1e-9) unit++;
  const open = [...edges.values()].filter((n) => n !== 2).length;
  return { lo, hi, vol, wrong, unit, open, tris: m.indices.length / 3, verts: P.length / 3 };
}
const near = (a, b, e = 1e-12) => a.every((v, i) => Math.abs(v - b[i]) <= e);

// ---- lathe
const R = 0.05;
const H = 0.1;
const cylProfile = [[0, 0], [R, 0], [R, H], [0, H]];
{
  for (const seg of [6, 16, 64]) {
    const part = { node: 'root', shape: 'lathe', profile: cylProfile, crease: [1, 2], seg, mat: 'm' };
    const s = study(X.partMesh(part));
    const V = (seg / 2) * R * R * Math.sin((2 * Math.PI) / seg) * H; // objem pravidelného hranolu
    ok(s.tris === 4 * seg && X.partTris(part) === s.tris, `lathe válec, ${seg} stěn: 4 × seg trojúhelníků`, `${s.tris}`);
    ok(s.open === 0 && s.wrong === 0 && s.unit === 0 && Math.abs(s.vol - V) / V < 1e-9, `lathe válec, ${seg} stěn: uzavřený, líc ven, objem hranolu`, `objem ${s.vol.toExponential(6)} / ${V.toExponential(6)}`);
  }
  const s = study(X.partMesh({ node: 'root', shape: 'lathe', profile: cylProfile, crease: [1, 2], mat: 'm' }));
  ok(near(s.lo, [-R, 0, -R], 1e-12) && near(s.hi, [R, H, R], 1e-12), 'lathe: meze ±r a 0 až výška profilu (výchozí 24 stěn)', `${s.lo} / ${s.hi}`);
  // koule z 9 bodů profilu bez ostrých hran: uzavřená, objem menší než koule a větší než 90 %
  const sph = Array.from({ length: 9 }, (_, i) => {
    const u = ((-90 + (180 * i) / 8) * Math.PI) / 180;
    return [R * Math.cos(u), R * Math.sin(u)];
  });
  const k = study(X.partMesh({ node: 'root', shape: 'lathe', profile: sph, seg: 32, mat: 'm' }));
  const Vk = (4 / 3) * Math.PI * R ** 3;
  ok(k.open === 0 && k.wrong === 0 && k.vol < Vk && k.vol > 0.9 * Vk, 'lathe koule: uzavřená, líc ven, objem pod koulí a nad 90 %', `${(k.vol / Vk).toFixed(4)} objemu koule`);
  // osa x a střed: profil roste do +x
  const ax = study(X.partMesh({ node: 'root', shape: 'lathe', profile: cylProfile, crease: [1, 2], seg: 16, axis: 'x', center: [1, 2, 3], mat: 'm' }));
  ok(Math.abs(ax.lo[0] - 1) < 1e-12 && Math.abs(ax.hi[0] - 1.1) < 1e-12 && Math.abs(ax.lo[1] - 1.95) < 1e-12 && Math.abs(ax.hi[2] - 3.05) < 1e-12 && ax.wrong === 0 && ax.vol > 0, 'lathe s osou x a středem: profil roste do +x, líc ven', `${ax.lo.map((v) => v.toFixed(3))} / ${ax.hi.map((v) => v.toFixed(3))}`);
  const az = study(X.partMesh({ node: 'root', shape: 'lathe', profile: cylProfile, crease: [1, 2], seg: 16, axis: 'z', mat: 'm' }));
  ok(Math.abs(az.lo[2]) < 1e-12 && Math.abs(az.hi[2] - H) < 1e-12 && az.wrong === 0 && az.vol > 0, 'lathe s osou z: profil roste do +z, líc ven');
  // výseč 0 až 180°: x = r cos a, z = −r sin a
  const half = study(X.partMesh({ node: 'root', shape: 'lathe', profile: cylProfile, crease: [1, 2], seg: 8, arc: [0, 180], mat: 'm' }));
  ok(half.hi[2] <= 1e-12 && Math.abs(half.lo[2] + R) < 1e-12 && half.open > 0 && half.wrong === 0, 'lathe výseč 0 až 180°: jen z ≤ 0, otevřená plocha', `z ${half.lo[2].toFixed(3)} až ${half.hi[2].toExponential(1)}`);
}

// ---- rbox
{
  const min = [-0.2, 0, -0.15];
  const max = [0.2, 0.5, 0.15];
  for (const [steps, tris] of [[1, 108], [2, 300], [3, 588], [4, 972]]) {
    const part = { node: 'root', shape: 'rbox', min, max, radius: 0.03, steps, mat: 'm' };
    const s = study(X.partMesh(part));
    const box = 0.4 * 0.5 * 0.3;
    ok(s.tris === tris && X.partTris(part) === tris && s.open === 0 && s.wrong === 0 && s.unit === 0 && near(s.lo, min) && near(s.hi, max) && s.vol < box && s.vol > box * 0.97, `rbox, ${steps} úseky: ${tris} △, uzavřený, líc ven, meze min a max`, `objem ${(s.vol / box).toFixed(5)} kvádru`);
  }
  const flat = X.partMesh({ node: 'root', shape: 'rbox', min, max, radius: 0.03, steps: 2, mat: 'm' });
  let faceN = 0;
  for (let i = 0; i < flat.positions.length; i += 3) {
    const y = flat.positions[i + 1];
    if (Math.abs(y - 0.5) < 1e-12 && Math.abs(flat.positions[i]) <= 0.17 + 1e-12 && Math.abs(flat.positions[i + 2]) <= 0.12 + 1e-12) faceN += flat.normals[i + 1] === 1 ? 1 : -1000;
  }
  ok(faceN > 0, 'rbox: rovná část horní stěny má normálu přesně +y', `${faceN} vrcholů`);
}

// ---- vzorky světla a atlas: prefab se dvěma pevnými díly lathe a rbox
{
  const m = clone(pack);
  const door = m.prefabs.find((x) => x.data.id === 'door_hinged_01').data;
  const mat = Object.keys(m.materials.materials)[0];
  const pf = {
    xspace: door.xspace,
    kind: door.kind,
    source: clone(door.source),
    id: 'flask_test_01',
    title: 'Baňka na skříňce (zkouška N-012)',
    category: 'prop.lab',
    bounds: { min: [-0.2, 0, -0.15], max: [0.2, 0.6, 0.15] },
    rig: { nodes: [{ id: 'root' }] },
    parts: [
      { node: 'root', shape: 'rbox', min: [-0.2, 0, -0.15], max: [0.2, 0.5, 0.15], radius: 0.02, steps: 2, mat },
      { node: 'root', shape: 'lathe', profile: [[0, 0.5], [0.04, 0.5], [0.04, 0.55], [0.012, 0.58], [0.012, 0.6], [0, 0.6]], crease: [1, 4], seg: 16, mat },
    ],
    colliders: [{ node: 'root', shape: 'box', min: [-0.2, 0, -0.15], max: [0.2, 0.6, 0.15] }],
    components: { physics: { body: 'static' } },
  };
  m.prefabs.push({ file: 'prefabs/flask_test_01.json', data: pf });
  const L = m.levels[0].data;
  const cell = L.cells[0];
  const mid = [0, 2].map((k) => (cell.bounds.min[k] + cell.bounds.max[k]) / 2);
  L.entities.push({ id: 'e_flask', prefab: pf.id, cell: cell.id, pos: [mid[0], cell.bounds.min[1], mid[1]] });
  const r = X.validatePack(m);
  ok(r.ok && r.warnings.length === 0, 'prefab s díly rbox a lathe projde validátorem bez nálezu', codes(r).join(' ') || 'bez nálezů');
  const prefabs = new Map(m.prefabs.map((p) => [p.data.id, p.data]));
  const before = X.levelSamples(pack.levels[0].data, new Map(pack.prefabs.map((p) => [p.data.id, p.data])), pack.materials.materials, X.LIGHT_CELL);
  const S = X.levelSamples(L, prefabs, m.materials.materials, X.LIGHT_CELL);
  const nParts = pf.parts.reduce((s, p) => s + X.partMesh(p).positions.length / 3, 0);
  ok(X.staticPartIndices(pf).join(',') === '0,1' && S.count - before.count === nParts, 'pevné díly rbox a lathe nesou vzorky světla v pořadí dílů', `+${S.count - before.count} vzorků`);
  const A = X.lightmapLayout(S, 0.05);
  const me = A.meshes.find((x) => x.kind === 'entity' && L.entities[x.index].id === 'e_flask');
  const nBox = X.partMesh(pf.parts[0]).positions.length / 3;
  let boxIn = 0;
  let boxOut = 0;
  let latheIn = 0;
  let latheSide = 0;
  const N = me.mesh.normals;
  for (let i = 0; i < nParts; i++) {
    const has = !Number.isNaN(A.uv[(me.offset + i) * 2]);
    const vertical = Math.abs(N[i * 3 + 1]) < 1e-9;
    if (i < nBox) has ? boxIn++ : boxOut++;
    else if (has) latheIn++;
    else if (vertical) latheSide++;
  }
  ok(boxIn > 0 && boxOut > 0, 'rbox v atlasu: rovné plochy mají mapu, zaoblené hrany se svítí po vrcholech', `${boxIn} v atlasu, ${boxOut} mimo`);
  ok(latheIn > 0 && latheSide > 0, 'lathe v atlasu: rovné kruhy (dno, rameno) mají mapu, oblý plášť ne', `${latheIn} v atlasu, plášť ${latheSide} mimo`);
}

// ---- validátor
{
  const MUT = [
    ['part.profile', 'záporný poloměr v profilu', (p) => (p.profile[1] = [-0.01, 0])],
    ['part.profile', 'ostrá hrana v krajním bodě', (p) => (p.crease = [0])],
    ['part.profile', 'výseč obráceně', (p) => (p.arc = [200, 100])],
    ['part.profile', 'profil celý na ose', (p) => (p.profile = [[0, 0], [0, 0.1]])],
    ['shape.range', 'méně než 6 stěn', (p) => (p.seg = 5)],
    ['shape.required', 'lathe bez profilu', (p) => delete p.profile],
    ['shape.required', 'lathe bez materiálu', (p) => delete p.mat],
    ['part.radius', 'rbox se zaoblením přes půl rozměru', (p, q) => (q.radius = 0.2)],
    ['shape.required', 'rbox bez steps', (p, q) => delete q.steps],
    ['shape.range', 'rbox s 5 úseky', (p, q) => (q.steps = 5)],
    ['geom.box', 'rbox s min nad max', (p, q) => (q.max = [-0.3, 0.5, 0.15])],
  ];
  const base = clone(pack);
  const door = base.prefabs.find((x) => x.data.id === 'door_hinged_01').data;
  const mat = Object.keys(base.materials.materials)[0];
  for (const [code, name, mutate] of MUT) {
    const m = clone(base);
    const d = m.prefabs.find((x) => x.data.id === door.id).data;
    const lathe = { node: d.parts[0].node, shape: 'lathe', profile: [[0, 0], [0.03, 0], [0.03, 0.05], [0, 0.05]], crease: [1, 2], seg: 12, mat };
    const rbox = { node: d.parts[0].node, shape: 'rbox', min: [-0.3, 0, -0.1], max: [0.3, 0.5, 0.1], radius: 0.02, steps: 2, mat };
    d.parts.push(lathe, rbox);
    mutate(lathe, rbox);
    const found = codes(X.validatePack(m)).includes(code);
    ok(found, `validátor chytí: ${name}`, found ? code : `čekáno ${code}, nalezeno: ${codes(X.validatePack(m)).join(' ') || 'nic'}`);
  }
}

console.log(`\nT1g lathe a rbox: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
