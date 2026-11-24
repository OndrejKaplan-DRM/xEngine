// xView: prohlížeč balíku xSpace. Není to engine a nesmí se jím stát: kreslí data tak, jak jsou,
// aby je šlo zkontrolovat okem (buňky, portály, kvádry, prefaby v klidové poloze, světla, spouštěče).
// Geometrii a kostry bere ze stejných funkcí jako engine (src/xspace), validátor běží i tady.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { validatePack, brushMesh, partMesh, entityMatrix, rigMatrices, mat4Mul } from '../../src/xspace/index.js';

const VERSION = 'xView 0.1 · 2026-11-22';
const pack = globalThis.__PACK__;
const findings = validatePack(pack);
const level = pack.levels[0].data;
const prefabById = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const matDefs = pack.materials.materials;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // světla jsou v kandelách, obraz se převádí expozicí levelu
renderer.toneMappingExposure = level.env.exposure ?? 1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;

// ---- materiály a sběr geometrie po materiálech
const materials = new Map();
function material(id) {
  if (!materials.has(id)) {
    const d = matDefs[id];
    const color = new THREE.Color(...d.color);
    materials.set(id, d.model === 'lit' ? new THREE.MeshLambertMaterial({ color }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(...(d.emissive || d.color)) }));
  }
  return materials.get(id);
}
const buckets = new Map(); // klíč vrstva|materiál → { positions, normals, indices }
function bucket(layer, mat) {
  const k = `${layer}|${mat}`;
  if (!buckets.has(k)) buckets.set(k, { layer, mat, positions: [], normals: [], indices: [] });
  return buckets.get(k);
}
function addTris(b, positions, normals, indices) {
  const base = b.positions.length / 3;
  for (const v of positions) b.positions.push(v);
  for (const v of normals) b.normals.push(v);
  for (const i of indices) b.indices.push(base + i);
}

// kvádry a klíny levelu
for (const br of level.brushes) {
  if (br.vis === false) continue;
  const m = brushMesh(br);
  const layer = br.tag === 'ceiling' ? 'ceiling' : 'world';
  for (const g of m.groups) {
    const matId = (br.faces && br.faces[g.face]) || br.mat;
    const idx = m.indices.slice(g.start, g.start + g.count);
    const used = [...new Set(idx)];
    const remap = new Map(used.map((v, i) => [v, i]));
    addTris(
      bucket(layer, matId),
      used.flatMap((v) => m.positions.slice(v * 3, v * 3 + 3)),
      used.flatMap((v) => m.normals.slice(v * 3, v * 3 + 3)),
      idx.map((v) => remap.get(v)),
    );
  }
}

// prefaby v klidové poloze
const tmpM = new THREE.Matrix4();
const tmpN = new THREE.Matrix3();
function addPart(part, world) {
  const m = partMesh(part); // jediná implementace sítě dílu je v src/xspace/geom.js (N-101)
  if (!m) return; // sítě .glb kreslí až engine
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
  geo.setIndex(m.indices);
  tmpM.fromArray(world);
  geo.applyMatrix4(tmpM);
  tmpN.getNormalMatrix(tmpM);
  addTris(bucket('props', part.mat), geo.attributes.position.array, geo.attributes.normal.array, geo.index.array);
  geo.dispose();
}
let propTris = 0;
for (const e of level.entities) {
  const pf = prefabById.get(e.prefab);
  if (!pf) continue;
  const em = entityMatrix(e);
  const nodes = rigMatrices(pf);
  for (const part of pf.parts) addPart(part, mat4Mul(em, nodes[part.node]));
  propTris += pf.tris || 0;
}

const layers = { world: new THREE.Group(), ceiling: new THREE.Group(), props: new THREE.Group(), cells: new THREE.Group(), portals: new THREE.Group(), lights: new THREE.Group(), triggers: new THREE.Group(), spawns: new THREE.Group() };
for (const g of Object.values(layers)) scene.add(g);
for (const b of buckets.values()) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
  geo.setIndex(b.indices);
  layers[b.layer].add(new THREE.Mesh(geo, material(b.mat)));
}

// buňky (drátěné kvádry), portály, spouštěče, světla, výchozí místa
const CELL_COLORS = [0x5dcaa5, 0x7f77dd, 0xef9f27, 0x378add, 0xd85a30, 0xd4537e, 0x97c459];
level.cells.forEach((cell, i) => {
  const box = new THREE.Box3(new THREE.Vector3(...cell.bounds.min), new THREE.Vector3(...cell.bounds.max));
  layers.cells.add(new THREE.Box3Helper(box, CELL_COLORS[i % CELL_COLORS.length]));
});
for (const p of level.portals || []) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p.quad.flat(), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  layers.portals.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: p.door ? 0xef9f27 : 0x5dcaa5, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })));
}
for (const t of level.triggers || []) {
  layers.triggers.add(new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(...t.min), new THREE.Vector3(...t.max)), 0xfac775));
}
const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.0);
scene.add(hemi);
const ambient = new THREE.AmbientLight(new THREE.Color(...level.env.ambient), Math.PI);
scene.add(ambient);
for (const l of level.lights || []) {
  if (l.type !== 'point') continue;
  const pl = new THREE.PointLight(new THREE.Color(...l.color), l.intensity, l.range, 2);
  pl.position.set(...l.pos);
  layers.lights.add(pl);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(...l.color) }));
  dot.position.set(...l.pos);
  layers.lights.add(dot);
}
for (const s of level.spawns) {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 12), new THREE.MeshBasicMaterial({ color: s.kind === 'player' ? 0x5dcaa5 : 0xe24b4a }));
  cone.rotation.x = -Math.PI / 2; // špička ve směru -Z
  const holder = new THREE.Group();
  holder.add(cone);
  holder.position.set(s.pos[0], s.pos[1] + 0.9, s.pos[2]);
  holder.rotation.y = ((s.yaw || 0) * Math.PI) / 180;
  layers.spawns.add(holder);
}

// ---- pohledy
const all = new THREE.Box3();
for (const cell of level.cells) all.union(new THREE.Box3(new THREE.Vector3(...cell.bounds.min), new THREE.Vector3(...cell.bounds.max)));
const center = all.getCenter(new THREE.Vector3());
const size = all.getSize(new THREE.Vector3());
const player = level.spawns.find((s) => s.kind === 'player');
const cellCenter = (id) => {
  const b = level.cells.find((c) => c.id === id).bounds;
  return new THREE.Vector3((b.min[0] + b.max[0]) / 2, 1.6, (b.min[2] + b.max[2]) / 2);
};
const VIEWS = {
  iso: () => ({ pos: [center.x + size.x * 0.8, size.z * 0.6, center.z + size.z * 0.5], look: [center.x, 0, center.z - size.z * 0.05], ceiling: false, overlay: true, flat: 0.3 }),
  top: () => ({ pos: [center.x, Math.max(size.x, size.z) * 0.95, center.z + 0.01], look: [center.x, 0, center.z], ceiling: false, overlay: true, flat: 0.3 }),
  start: () => ({ pos: [player.pos[0], player.pos[1] + 1.6, player.pos[2]], look: [player.pos[0], player.pos[1] + 1.5, player.pos[2] - 4], ceiling: true, overlay: false, flat: 0 }),
  lab: () => ({ pos: [5, 1.6, -3], look: [11, 1.0, -6.5], ceiling: true, overlay: false, flat: 0 }),
  hall: () => ({ pos: [3, 1.6, -9.2], look: [1.5, 1.2, -22], ceiling: true, overlay: false, flat: 0 }),
};
let current = 'iso';
function view(name) {
  const v = VIEWS[name]();
  current = name;
  camera.position.set(...v.pos);
  controls.target.set(...v.look);
  layers.ceiling.visible = v.ceiling;
  for (const k of ['cells', 'portals', 'triggers', 'spawns']) layers[k].visible = v.overlay;
  hemi.intensity = v.flat * Math.PI; // v přehledu přisvítit, ať je vidět tvar; v pohledu z očí jen světla levelu
  controls.update();
  render();
  document.querySelectorAll('#views button').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
}
function resize() {
  const w = canvas.clientWidth || innerWidth;
  const h = canvas.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  render();
}
function render() {
  renderer.render(scene, camera);
}
controls.addEventListener('change', render);
addEventListener('resize', resize);

// ---- panel
const s = findings.stats.levels[0];
document.getElementById('ver').textContent = VERSION;
document.getElementById('info').innerHTML = [
  `<b>${level.title}</b> · balík ${pack.manifest.id} ${pack.manifest.version}`,
  `buněk ${s.cells} · portálů ${s.portals} · kvádrů ${s.brushes} (${s.brushTris} △) · entit ${s.entities} (${propTris} △) · světel ${s.lights} · spojení ${s.links}`,
  `validátor: <span class="${findings.errors.length ? 'bad' : 'good'}">${findings.errors.length} chyb</span>, ${findings.warnings.length} varování`,
].join('<br>');
const list = document.getElementById('cells');
level.cells.forEach((cell, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<i style="background:#${CELL_COLORS[i % CELL_COLORS.length].toString(16).padStart(6, '0')}"></i>${cell.name || cell.id}`;
  list.appendChild(li);
});
const views = document.getElementById('views');
const LABELS = { iso: 'Přehled', top: 'Půdorys', start: 'Start', lab: 'Laboratoř', hall: 'Hala' };
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.textContent = LABELS[name];
  b.dataset.view = name;
  b.onclick = () => view(name);
  views.appendChild(b);
}
const toggles = document.getElementById('toggles');
const TLABELS = { ceiling: 'Stropy', props: 'Prefaby', cells: 'Buňky', portals: 'Portály', lights: 'Světla', triggers: 'Spouštěče' };
for (const [k, label] of Object.entries(TLABELS)) {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = () => {
    layers[k].visible = !layers[k].visible;
    render();
  };
  toggles.appendChild(b);
}

resize();
view('iso');

// ---- háček pro testy
globalThis.__xview = {
  ready: true,
  version: VERSION,
  findings,
  views: Object.keys(VIEWS),
  view,
  current: () => current,
  layer: (k, on) => {
    layers[k].visible = on;
    render();
  },
  info() {
    renderer.info.autoReset = false;
    renderer.info.reset();
    render();
    const out = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, meshes: buckets.size, propTris };
    renderer.info.autoReset = true;
    return out;
  },
  shot() {
    render();
    return canvas.toDataURL('image/png');
  },
};
