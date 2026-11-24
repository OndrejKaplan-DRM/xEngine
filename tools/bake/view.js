// xBake, náhled: zapeče světlo levelu přímo v prohlížeči (stejným kódem jako nástroj) a ukáže ho bez světel za běhu.
// Barva vrcholu = barva materiálu / π × osvětlení; materiál bez výpočtu světel s barvou vrcholů. Tak má statický
// svět kreslit běh (D-022). Převod na displej je stejný jako v xView (ACES, expozice levelu), aby šly snímky srovnat.
// Přepínač „Dveře otevřené“ ukazuje brány světla (D-035): úseky vrstev za dveřmi se násobí jejich otevřením.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { levelLightMeshes, LIGHT_CELL, lightIrradiance, entityMatrix, rigMatrices, mat4Mul, mat4Point, partMesh } from '../../src/xspace/index.js';
import { bakeLevel } from './bake.mjs';
import { composeColors } from '../../src/xspace/bake.js';

const VERSION = 'xBake náhled 0.4 · 2026-11-24 · mřížka světla znění 2';
const pack = globalThis.__PACK__;
const q = new URLSearchParams(location.search);
const level = (pack.levels.find((l) => l.data.id === q.get('level')) || pack.levels[0]).data;
const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const mats = pack.materials.materials;
const albedo = (id) => (mats[id] && mats[id].color) || [0.5, 0.5, 0.5];

const full = bakeLevel(level, prefabs, mats);
const flat = bakeLevel(level, prefabs, mats, { occlusion: false });
const coarse = bakeLevel(level, prefabs, mats, { soft: 0, indirect: false }); // jeden paprsek na vzorek, pro srovnání okraje stínu
const N = full.samples;
const S = full.scene;
const byId = new Map(full.lights.map((L) => [L.id, L]));
const wings = new Set(full.wings);
const OPEN = Object.fromEntries(full.doors.map((d) => [d.id, 1]));
const state = { shadows: true, soft: true, indirect: true, ao: true, lamps: false, doors: false };
let fill = 0; // přisvícení přehledu shora: vnější strany zdí by jinak byly černé (ven žádné světlo nesvítí)

/** Osvětlení vzorků (RGB) pro daný stav přepínačů. */
function sampleLight() {
  const bake = !state.shadows ? flat : state.soft ? full : coarse;
  const extra = state.shadows ? full.layers.filter((L) => (L.kind === 'ao' && state.ao) || (L.kind === 'indirect' && state.indirect)) : [];
  const layers = [...bake.layers.filter((L) => L.kind === 'light' || L.kind === 'entity'), ...extra];
  const levels = { indirect: full.indirectWeight };
  for (const L of full.lights) levels[L.id] = L.base || (state.lamps && L.kind === 'entity') ? 1 : 0;
  const out = composeColors({ header: { samples: N }, layers }, byId, level.env.ambient, levels, state.doors ? OPEN : {});
  if (fill) for (let i = 0; i < out.length; i++) out[i] += fill;
  return out;
}

// ---- kvádry levelu: tatáž síť, ze které jsou vzorky; strop zvlášť kvůli přehledu shora
const groups = { world: { pos: [], idx: [], sample: [], brush: [] }, ceiling: { pos: [], idx: [], sample: [], brush: [] } };
levelLightMeshes(level.brushes, mats, LIGHT_CELL).forEach((m, bi) => {
  if (!m) return; // kvádr s vis: false se nekreslí a vzorky nemá
  const b = level.brushes[bi];
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

// ---- díly prefabů: síť dílu dává partMesh ze základu (N-101), polohu uzlů rigMatrices. Dveře portálů se kreslí
// zavřené nebo otevřené na doraz podle přepínače. Světlo dílu: kvádr má jednu hodnotu na stěnu (počítá se
// ve středu stěny), válec hodnotu ve vrcholu; díly téže entity si navzájem nestíní.
const props = { pos: [], nrm: [], idx: [], mat: [], at: [], ent: [] };
const propGeo = new THREE.BufferGeometry();
meshes.props = new THREE.Mesh(propGeo, material);
scene.add(meshes.props);

function openPose(pf) {
  const it = (pf.components || {}).interact;
  const j = it && (pf.rig.joints || []).find((x) => x.id === it.joint);
  if (!j) return {};
  const rest = j.rest ?? j.min;
  return { [j.id]: Math.abs(j.max - rest) >= Math.abs(j.min - rest) ? j.max : j.min };
}

function buildProps(doorsOpen) {
  for (const k of Object.keys(props)) props[k].length = 0;
  for (const e of level.entities || []) {
    const pf = prefabs.get(e.prefab);
    if (!pf) continue;
    const E = entityMatrix(e);
    const rig = rigMatrices(pf, doorsOpen && wings.has(e.id) ? openPose(pf) : {});
    for (const p of pf.parts) {
      const mesh = partMesh(p);
      if (!mesh) continue; // díl ze souboru .glb náhled nekreslí
      const M = mat4Mul(E, rig[p.node]);
      const zero = mat4Point(M, [0, 0, 0]);
      const base = props.pos.length / 3;
      const count = mesh.positions.length / 3;
      const world = [];
      for (let v = 0; v < count; v++) {
        const w = mat4Point(M, [mesh.positions[v * 3], mesh.positions[v * 3 + 1], mesh.positions[v * 3 + 2]]);
        const n = mat4Point(M, [mesh.normals[v * 3], mesh.normals[v * 3 + 1], mesh.normals[v * 3 + 2]]).map((x, k) => x - zero[k]);
        const len = Math.hypot(n[0], n[1], n[2]) || 1;
        world.push(w);
        props.pos.push(w[0], w[1], w[2]);
        props.nrm.push(n[0] / len, n[1] / len, n[2] / len);
        props.mat.push(p.mat);
        props.ent.push(e.id);
      }
      for (const i of mesh.indices) props.idx.push(base + i);
      for (let v = 0; v < count; v++) {
        const f = p.shape === 'box' ? v - (v % 4) : -1; // kvádr: čtyři vrcholy na stěnu za sebou (brushMesh)
        if (f < 0) props.at.push(...world[v]);
        else for (let c = 0; c < 3; c++) props.at.push((world[f][c] + world[f + 1][c] + world[f + 2][c] + world[f + 3][c]) / 4);
      }
    }
  }
  propGeo.setAttribute('position', new THREE.Float32BufferAttribute(props.pos, 3));
  propGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(props.pos.length), 3));
  propGeo.setIndex(props.idx);
  propGeo.computeBoundingSphere();
}

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
        // zavřená křídla dveří dílům stíní; otevřená ne (jejich stín v otevřené poloze náhled nepočítá)
        if (len > full.clear && S.any(o, d, len - full.clear, props.ent[v], !state.doors)) continue;
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
    ? {
        lab: () => ({ pos: [5, 1.6, -3], look: [11, 1.0, -6.5], ceiling: true }),
        hall: () => ({ pos: [3, 1.6, -9.2], look: [1.5, 1.2, -22], ceiling: true }),
        pillar: () => ({ pos: [4.5, 1.6, -17], look: [-1.5, 0.2, -11.5], ceiling: true }),
        door: () => ({ pos: [2.2, 1.6, -7.4], look: [4.1, 0.6, -5.4], ceiling: true }),
      }
    : {}),
};
const LABELS = { iso: 'Přehled', start: 'Start', lab: 'Laboratoř', hall: 'Hala', pillar: 'Stín sloupu', door: 'Dveře laboratoře' };
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
const sections = full.layers.reduce((n, L) => n + L.gates.length, 0);
document.getElementById('ver').textContent = VERSION;
document.getElementById('info').innerHTML = [
  `<b>${level.title}</b> · balík ${pack.manifest.id}`,
  `vzorků ${N} (schovaných v tělese ${full.stats.invalid}) · vrstev ${full.layers.length} · zapečeno za ${(full.stats.ms / 1000).toFixed(2)} s v tomto prohlížeči`,
  `dveří v portálech ${full.doors.length} · úseků s bránou ${sections} · zjemněných vzorků na okraji stínu ${full.stats.softened}`,
  `Bez světel za běhu: barva vrcholů × barva materiálu. Odraz s vahou ${full.indirectWeight}. V přehledu je scéna přisvícená, aby byly vidět vnější stěny.`,
].join('<br>');
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.textContent = LABELS[name];
  b.dataset.view = name;
  b.onclick = () => view(name);
  document.getElementById('views').appendChild(b);
}
const TOGGLES = { shadows: 'Stíny', soft: 'Jemný okraj stínu', indirect: 'Odraz', ao: 'Kouty', lamps: 'Lampy (vypínače)', doors: 'Dveře otevřené' };
let posed = null;
function set(patch) {
  Object.assign(state, patch);
  document.querySelectorAll('#toggles button').forEach((b) => b.classList.toggle('on', state[b.dataset.key]));
  if (posed !== state.doors) {
    posed = state.doors;
    buildProps(posed);
  }
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
  stats: { samples: N, invalid: full.stats.invalid, layers: full.layers.length, ms: full.stats.ms, doors: full.doors.length, sections, softened: full.stats.softened },
  shot() {
    render();
    return canvas.toDataURL('image/png');
  },
};
