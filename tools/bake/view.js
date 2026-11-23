// xBake, náhled: zapeče světlo levelu přímo v prohlížeči (stejným kódem jako nástroj) a ukáže ho bez světel za běhu.
// Barva vrcholu = barva materiálu / π × osvětlení; materiál bez výpočtu světel s barvou vrcholů. Tak má statický
// svět kreslit běh (D-022). Převod na displej je stejný jako v xView (ACES, expozice levelu), aby šly snímky srovnat.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { brushLightMesh, LIGHT_CELL, lightIrradiance, entityMatrix, rigMatrices, mat4Mul } from '../../src/xspace/index.js';
import { bakeLevel, DEFAULTS } from './bake.mjs';

const VERSION = 'xBake náhled 0.2 · 2026-11-22';
const pack = globalThis.__PACK__;
const q = new URLSearchParams(location.search);
const level = (pack.levels.find((l) => l.data.id === q.get('level')) || pack.levels[0]).data;
const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const mats = pack.materials.materials;
const albedo = (id) => (mats[id] && mats[id].color) || [0.5, 0.5, 0.5];

const full = bakeLevel(level, prefabs, mats);
const flat = bakeLevel(level, prefabs, mats, { occlusion: false });
const N = full.samples;
const S = full.scene;
const layer = (bake, id) => bake.layers.find((L) => L.id === id);
const state = { shadows: true, indirect: true, ao: true, lamps: false };
let fill = 0; // přisvícení přehledu shora: vnější strany zdí by jinak byly černé (ven žádné světlo nesvítí)

/** Osvětlení vzorků (RGB) pro daný stav přepínačů. */
function sampleLight() {
  const bake = state.shadows ? full : flat;
  const out = new Float32Array(N * 3);
  const amb = level.env.ambient;
  const ao = state.shadows && state.ao ? layer(full, 'ao') : null;
  for (let s = 0; s < N; s++) for (let c = 0; c < 3; c++) out[s * 3 + c] = amb[c] * (ao ? ao.data[s] : 1) + fill;
  for (const L of bake.lights) {
    if (!(L.base || (state.lamps && L.kind === 'entity'))) continue;
    const d = layer(bake, L.id).data;
    for (let s = 0; s < N; s++) if (d[s]) for (let c = 0; c < 3; c++) out[s * 3 + c] += d[s] * L.color[c];
  }
  if (state.shadows && state.indirect) {
    const d = layer(full, 'indirect').data;
    for (let i = 0; i < N * 3; i++) out[i] += d[i] * full.indirectWeight;
  }
  return out;
}

// ---- kvádry levelu: tatáž síť, ze které jsou vzorky; strop zvlášť kvůli přehledu shora
const groups = { world: { pos: [], idx: [], sample: [], brush: [] }, ceiling: { pos: [], idx: [], sample: [], brush: [] } };
level.brushes.forEach((b, bi) => {
  const m = brushLightMesh(b, LIGHT_CELL);
  const g = b.tag === 'ceiling' ? groups.ceiling : groups.world;
  const base = g.pos.length / 3;
  for (const v of m.positions) g.pos.push(v);
  for (const i of m.indices) g.idx.push(base + i);
  for (let v = 0; v < m.positions.length / 3; v++) {
    g.sample.push(S.offsets[bi] + v);
    g.brush.push(bi);
  }
});
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
const material = new THREE.MeshBasicMaterial({ vertexColors: true });
const meshes = {};
for (const [name, g] of Object.entries(groups)) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.pos.length), 3));
  geo.setIndex(g.idx);
  meshes[name] = new THREE.Mesh(geo, material);
  scene.add(meshes[name]);
}

// ---- díly prefabů v klidu: světlo se počítá ve vrcholech dílu (lightIrradiance + paprsek), svítící materiály svítí samy
// Kvádr má jednu hodnotu na stěnu (počítá se ve středu stěny), válec hodnotu ve vrcholu: tak díly osvětluje i běh.
// Díly téže entity si navzájem nestíní (střed stěny skříně leží za čelem zásuvky).
const props = { pos: [], nrm: [], idx: [], mat: [], at: [], ent: [] };
for (const e of level.entities || []) {
  const pf = prefabs.get(e.prefab);
  if (!pf) continue;
  const E = entityMatrix(e);
  const rig = rigMatrices(pf, {});
  for (const p of pf.parts) {
    let geo;
    if (p.shape === 'box') {
      geo = new THREE.BoxGeometry(p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]);
      geo.translate((p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2);
    } else if (p.shape === 'cyl') {
      geo = new THREE.CylinderGeometry(p.radius, p.radius, p.height, 16);
      if (p.axis === 'x') geo.rotateZ(Math.PI / 2);
      if (p.axis === 'z') geo.rotateX(Math.PI / 2);
      geo.translate(...p.center);
    } else continue;
    geo.applyMatrix4(new THREE.Matrix4().fromArray(mat4Mul(E, rig[p.node])));
    const base = props.pos.length / 3;
    for (const v of geo.attributes.position.array) props.pos.push(v);
    for (const v of geo.attributes.normal.array) props.nrm.push(v);
    for (const i of geo.index.array) props.idx.push(base + i);
    const P = geo.attributes.position.array;
    for (let v = 0; v < geo.attributes.position.count; v++) {
      props.mat.push(p.mat);
      props.ent.push(e.id);
      const f = p.shape === 'box' ? v - (v % 4) : -1; // BoxGeometry: čtyři vrcholy na stěnu za sebou
      if (f < 0) props.at.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
      else for (let c = 0; c < 3; c++) props.at.push((P[f * 3 + c] + P[(f + 1) * 3 + c] + P[(f + 2) * 3 + c] + P[(f + 3) * 3 + c]) / 4);
    }
  }
}
const propGeo = new THREE.BufferGeometry();
propGeo.setAttribute('position', new THREE.Float32BufferAttribute(props.pos, 3));
propGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(props.pos.length), 3));
propGeo.setIndex(props.idx);
meshes.props = new THREE.Mesh(propGeo, material);
scene.add(meshes.props);

function propColors() {
  const col = propGeo.attributes.color.array;
  const amb = level.env.ambient;
  const lights = full.lights.filter((L) => L.base || (state.lamps && L.kind === 'entity'));
  const o = [0, 0, 0];
  const d = [0, 0, 0];
  for (let v = 0; v < props.mat.length; v++) {
    const m = mats[props.mat[v]] || {};
    if (m.emissive) {
      for (let c = 0; c < 3; c++) col[v * 3 + c] = m.emissive[c] * (m.emissiveStrength ?? 1);
      continue;
    }
    const p = [props.at[v * 3], props.at[v * 3 + 1], props.at[v * 3 + 2]];
    const n = [props.nrm[v * 3], props.nrm[v * 3 + 1], props.nrm[v * 3 + 2]];
    const sum = [amb[0] + fill, amb[1] + fill, amb[2] + fill];
    for (const L of lights) {
      const e = lightIrradiance(L.light, p[0], p[1], p[2], n[0], n[1], n[2]);
      if (e <= 0) continue;
      if (state.shadows && L.light.pos) {
        for (let c = 0; c < 3; c++) {
          o[c] = p[c] + n[c] * 0.02;
          d[c] = L.light.pos[c] - o[c];
        }
        const len = Math.hypot(d[0], d[1], d[2]);
        for (let c = 0; c < 3; c++) d[c] /= len;
        if (len > DEFAULTS.clear && S.any(o, d, len - DEFAULTS.clear, props.ent[v])) continue;
      }
      for (let c = 0; c < 3; c++) sum[c] += e * L.color[c];
    }
    const a = m.color || [0.5, 0.5, 0.5];
    for (let c = 0; c < 3; c++) col[v * 3 + c] = (a[c] / Math.PI) * sum[c];
  }
  propGeo.attributes.color.needsUpdate = true;
}

function recolor() {
  const E = sampleLight();
  for (const name of ['world', 'ceiling']) {
    const g = groups[name];
    const col = meshes[name].geometry.attributes.color.array;
    for (let v = 0; v < g.sample.length; v++) {
      const a = albedo(level.brushes[g.brush[v]].mat);
      for (let c = 0; c < 3; c++) col[v * 3 + c] = (a[c] / Math.PI) * E[g.sample[v] * 3 + c];
    }
    meshes[name].geometry.attributes.color.needsUpdate = true;
  }
  propColors();
  render();
}

// ---- obraz a pohledy (polohy kamer zlatého vzorku jsou stejné jako v xView)
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = level.env.exposure ?? 1;
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
const all = new THREE.Box3();
for (const c of level.cells) all.union(new THREE.Box3(new THREE.Vector3(...c.bounds.min), new THREE.Vector3(...c.bounds.max)));
const center = all.getCenter(new THREE.Vector3());
const size = all.getSize(new THREE.Vector3());
const player = level.spawns.find((s) => s.kind === 'player');
const VIEWS = {
  iso: () => ({ pos: [center.x + size.x * 0.8, size.z * 0.6, center.z + size.z * 0.5], look: [center.x, 0, center.z - size.z * 0.05], ceiling: false, fill: 0.12 * Math.PI }),
  start: () => ({ pos: [player.pos[0], player.pos[1] + 1.6, player.pos[2]], look: [player.pos[0], player.pos[1] + 1.5, player.pos[2] - 4], ceiling: true }),
  ...(pack.manifest.id === 'golden'
    ? { lab: () => ({ pos: [5, 1.6, -3], look: [11, 1.0, -6.5], ceiling: true }), hall: () => ({ pos: [3, 1.6, -9.2], look: [1.5, 1.2, -22], ceiling: true }), pillar: () => ({ pos: [4.5, 1.6, -17], look: [-1.5, 0.2, -11.5], ceiling: true }) }
    : {}),
};
const LABELS = { iso: 'Přehled', start: 'Start', lab: 'Laboratoř', hall: 'Hala', pillar: 'Stín sloupu' };
let current = 'iso';
const render = () => renderer.render(scene, camera);
function view(name) {
  const v = VIEWS[name]();
  current = name;
  camera.position.set(...v.pos);
  controls.target.set(...v.look);
  meshes.ceiling.visible = v.ceiling;
  controls.update();
  if ((v.fill || 0) !== fill) {
    fill = v.fill || 0;
    recolor();
  }
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
controls.addEventListener('change', render);
addEventListener('resize', resize);

// ---- panel
document.getElementById('ver').textContent = VERSION;
document.getElementById('info').innerHTML = [
  `<b>${level.title}</b> · balík ${pack.manifest.id}`,
  `vzorků ${N} (schovaných v tělese ${full.stats.invalid}) · vrstev ${full.layers.length} · zapečeno za ${(full.stats.ms / 1000).toFixed(2)} s v tomto prohlížeči`,
  `Bez světel za běhu: barva vrcholů × barva materiálu. Odraz s vahou ${full.indirectWeight}. V přehledu je scéna přisvícená, aby byly vidět vnější stěny.`,
].join('<br>');
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.textContent = LABELS[name];
  b.dataset.view = name;
  b.onclick = () => view(name);
  document.getElementById('views').appendChild(b);
}
const TOGGLES = { shadows: 'Stíny', indirect: 'Odraz', ao: 'Kouty', lamps: 'Lampy (vypínače)' };
function set(patch) {
  Object.assign(state, patch);
  document.querySelectorAll('#toggles button').forEach((b) => b.classList.toggle('on', state[b.dataset.key]));
  recolor();
}
for (const [key, label] of Object.entries(TOGGLES)) {
  const b = document.createElement('button');
  b.textContent = label;
  b.dataset.key = key;
  b.onclick = () => set({ [key]: !state[key] });
  document.getElementById('toggles').appendChild(b);
}

resize();
set({});
view(q.get('view') in VIEWS ? q.get('view') : 'iso');

// ---- háček pro testy
globalThis.__xbake = {
  ready: true,
  version: VERSION,
  views: Object.keys(VIEWS),
  view,
  set,
  state: () => ({ ...state }),
  stats: { samples: N, invalid: full.stats.invalid, layers: full.layers.length, ms: full.stats.ms },
  shot() {
    render();
    return canvas.toDataURL('image/png');
  },
};
