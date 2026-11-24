// xForge, galerie sady: každý prefab v klidu i v krajní poloze kloubu, s mezemi a jejich zdůvodněním.
// Není to engine: kreslí data balíku tak, jak jsou (díly box a cyl na uzlech kostry), aby je šlo posoudit okem.
// Balík přichází v __PACK__ (cíl sestavení kit), zdůvodnění mezí z generátorů sady.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { validatePack, partMesh } from '../../../src/xspace/index.js';
import { buildKit, TEXTURES } from '../kit/index.mjs';
import { buildPrefab, figure, useTextures, material } from './scene.js';
import { TEXTURE_BYTES } from './textures.js';

const VERSION = 'xForge galerie 0.2 · 2026-11-24 · textury (B2.4)';
const LOOKS = { clean: 'Čistý', t460: 'T460', gpu: 'Grafická karta' };
const pack = globalThis.__PACK__;
const findings = validatePack(pack);
const matDefs = pack.materials.materials;
const prefabs = pack.prefabs.map((p) => p.data);
const byId = new Map(prefabs.map((p) => [p.id, p]));
/** Obal prefabu přes celý rozsah pohybu včetně připojených zásuvek (source.params.attach). */
const fullBounds = (p) =>
  (((p.source || {}).params || {}).attach || []).reduce((b, a) => {
    const c = byId.get(a.prefab);
    return c ? { min: b.min.map((v, k) => Math.min(v, c.bounds.min[k] + a.pos[k])), max: b.max.map((v, k) => Math.max(v, c.bounds.max[k] + a.pos[k])) } : b;
  }, p.bounds);
const notes = buildKit().notes;
const num = (v) => String(Math.round(v * 1000) / 1000).replace('.', ',');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const range = (j) => (j.type === 'hinge' ? `${num(j.min)}° až ${num(j.max)}°` : `${num(j.min)} až ${num(j.max)} m`);
const CATEGORY = { 'arch.door': 'Dveře a brány', 'arch.window': 'Okna', 'arch.pipe': 'Potrubí', 'arch.railing': 'Zábradlí', 'device.control': 'Ovládací prvky', 'device.lab': 'Laboratorní přístroje', 'device.terminal': 'Terminály', 'prop.furniture': 'Nábytek', 'prop.light': 'Svítidla', 'prop.container': 'Bedny a sudy', 'prop.crypt': 'Katakomby' };

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12151d);
const camera = new THREE.PerspectiveCamera(40, 1, 0.02, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
// tónové mapování ve všech pohledech stejné, ať se dají porovnat; bez něj se světlé části textur useknou do bílé
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.7; // barvy podle skutečného albeda (24. 11.) jsou asi o třetinu tmavší
const hemi = new THREE.HemisphereLight(0xffffff, 0x556070, 2.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(2.5, 5, 4);
scene.add(sun);
const grid = new THREE.GridHelper(40, 40, 0x2f3647, 0x1d2330);
scene.add(grid);
const man = figure();
man.visible = false;
scene.add(man);
const holder = new THREE.Group();
scene.add(holder);

let built = []; // { prefab, root, setPose, dispose }
let look = 'clean';
let texState = 'načítám'; // 'ok' | text chyby
let mode = 'one';
let current = prefabs[0].id;
let pose = 0;
let playing = false;

function clear() {
  for (const b of built) {
    holder.remove(b.root);
    b.dispose();
  }
  built = [];
}
function render() {
  renderer.render(scene, camera);
}
/** Kamera tak, aby se do obrazu vešel kvádr min…max; dir = směr od středu ke kameře. */
function frame(min, max, dir = [0.9, 0.55, 1.25]) {
  const c = [0, 1, 2].map((i) => (min[i] + max[i]) / 2);
  const r = Math.max(0.12, Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2);
  const d = (r / Math.sin((camera.fov * Math.PI) / 360)) * 1.08;
  const len = Math.hypot(...dir);
  camera.position.set(c[0] + (dir[0] / len) * d, c[1] + (dir[1] / len) * d, c[2] + (dir[2] / len) * d);
  camera.near = Math.max(0.01, d / 200);
  camera.far = d * 20 + 60;
  camera.updateProjectionMatrix();
  controls.target.set(...c);
  controls.update();
}
function showOne(id) {
  clear();
  mode = 'one';
  current = id;
  const prefab = byId.get(id);
  const b = { prefab, ...buildPrefab(prefab, matDefs, look, (x) => byId.get(x)) };
  const fb = fullBounds(prefab);
  // nástěnné a stropní prefaby zvedni, ať nevisí pod mřížkou
  b.root.position.y = Math.max(0, -fb.min[1]) + (fb.min[1] < -0.001 ? 1.2 : 0);
  holder.add(b.root);
  built.push(b);
  b.setPose(pose);
  const y = b.root.position.y;
  frame([fb.min[0], fb.min[1] + y, fb.min[2]], [fb.max[0], fb.max[1] + y, fb.max[2]]);
  man.position.set(fb.max[0] + 0.5, 0, 0);
  ui();
  render();
}
function showAll() {
  clear();
  mode = 'all';
  const cols = Math.ceil(Math.sqrt(prefabs.length * 1.6));
  const cell = 3.2;
  prefabs.forEach((prefab, i) => {
    const b = { prefab, ...buildPrefab(prefab, matDefs, look, (x) => byId.get(x)) };
    const cx = ((i % cols) - (cols - 1) / 2) * cell;
    const cz = Math.floor(i / cols) * cell;
    b.root.position.set(cx - (prefab.bounds.min[0] + prefab.bounds.max[0]) / 2, Math.max(0, -prefab.bounds.min[1]), cz);
    b.setPose(pose);
    holder.add(b.root);
    built.push(b);
  });
  const rows = Math.ceil(prefabs.length / cols);
  frame([(-cols * cell) / 2, 0, -1], [(cols * cell) / 2, 2.4, rows * cell - 1], [0.25, 0.9, 1.1]);
  ui();
  render();
}
// ---- textury a pohledy ------------------------------------------------------------------------

const pmrem = new THREE.PMREMGenerator(renderer);
let envMap = null;
const texBytes = Object.values(TEXTURE_BYTES).reduce((s, b) => s + b.length, 0);
/** Přepne pohled a přestaví scénu; bez načtených textur jde jen „Čistý“. */
function setLook(l) {
  if (!LOOKS[l] || (l !== 'clean' && texState !== 'ok')) return false;
  look = l;
  // grafická karta: okolí dává odrazy i rozptýlené světlo, polokulové světlo se proto ubere
  if (look === 'gpu') scene.environment = envMap ??= pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  else scene.environment = null;
  scene.environmentIntensity = 0.55;
  hemi.intensity = look === 'gpu' ? 0.8 : 2.2;
  if (mode === 'all') showAll();
  else showOne(current);
  return true;
}
async function loadTextures() {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const map = {};
  await Promise.all(
    Object.entries(TEXTURE_BYTES).map(async ([rel, bytes]) => {
      const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/webp' }), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const t = new THREE.Texture(bmp);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = TEXTURES.files[rel].kind === 'normal' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.anisotropy = aniso;
      t.flipY = false;
      t.needsUpdate = true;
      map[rel] = t;
    }),
  );
  useTextures(map, Object.fromEntries(Object.entries(TEXTURES.materials).map(([id, t]) => [id, t.gain])));
}
loadTextures().then(
  () => {
    texState = 'ok';
    ui();
  },
  (e) => {
    texState = `textury se nenačetly: ${e.message}`;
    ui();
  },
);

function setPose(t) {
  pose = Math.min(1, Math.max(0, t));
  for (const b of built) b.setPose(pose);
  const s = document.getElementById('pose');
  if (s) s.value = String(Math.round(pose * 100));
  render();
}

// ---- rozhraní -----------------------------------------------------------------------------

const list = document.getElementById('list');
document.getElementById('ver').textContent = `${VERSION} · ${prefabs.length} prefabů · validátor ${findings.errors.length} chyb, ${findings.warnings.length} varování`;
const groups = new Map();
for (const p of prefabs) groups.set(p.category, [...(groups.get(p.category) || []), p]);
for (const [cat, items] of groups) {
  const h = document.createElement('h3');
  h.textContent = CATEGORY[cat] || cat;
  list.appendChild(h);
  for (const p of items) {
    const b = document.createElement('button');
    b.dataset.id = p.id;
    b.innerHTML = `${esc(p.title)}${(p.rig.joints || []).length ? '<small>kloub</small>' : ''}`;
    b.onclick = () => showOne(p.id);
    list.appendChild(b);
  }
}
function ui() {
  document.querySelectorAll('#list button').forEach((b) => b.classList.toggle('on', mode === 'one' && b.dataset.id === current));
  document.getElementById('mode-one').classList.toggle('on', mode === 'one');
  document.getElementById('mode-all').classList.toggle('on', mode === 'all');
  document.getElementById('man').classList.toggle('on', man.visible);
  document.querySelectorAll('button.look').forEach((b) => {
    b.classList.toggle('on', b.dataset.look === look);
    b.disabled = b.dataset.look !== 'clean' && texState !== 'ok';
  });
  document.getElementById('tex').textContent = texState === 'ok' ? `textury: ${Object.keys(TEXTURE_BYTES).length} souborů, ${(texBytes / 1024).toFixed(0)} kB, ${Object.keys(TEXTURES.materials).length} materiálů` : texState;
  const bar = document.getElementById('bar');
  bar.innerHTML = `<label>Poloha kloubů: klid <input type="range" id="pose" min="0" max="100" value="${Math.round(pose * 100)}"> krajní</label><button class="b" id="play">${playing ? 'Zastavit' : 'Rozhýbat'}</button>`;
  document.getElementById('pose').oninput = (e) => {
    playing = false;
    setPose(Number(e.target.value) / 100);
  };
  document.getElementById('play').onclick = () => {
    playing = !playing;
    ui();
    if (playing) requestAnimationFrame(tick);
  };
  const info = document.getElementById('info');
  if (mode === 'all') {
    const tris = prefabs.reduce((s, p) => s + p.tris, 0);
    info.innerHTML = `<h2>Sada ${esc(pack.manifest.id)} ${esc(pack.manifest.version)}</h2><table><tr><td>prefabů</td><td>${prefabs.length}</td></tr><tr><td>s kloubem</td><td>${prefabs.filter((p) => (p.rig.joints || []).length).length}</td></tr><tr><td>materiálů</td><td>${Object.keys(matDefs).length}</td></tr><tr><td>trojúhelníků</td><td>${tris}</td></tr></table><div id="hint">Posuvník hýbe všemi klouby naráz. Prefab vyber vlevo.</div>`;
    return;
  }
  const p = byId.get(current);
  const size = [0, 1, 2].map((i) => num(p.bounds.max[i] - p.bounds.min[i])).join(' × ');
  const it = p.components && p.components.interact;
  const body = p.components && p.components.physics ? p.components.physics.body + (p.components.physics.mass ? `, ${num(p.components.physics.mass)} kg` : '') : 'bez tělesa';
  const joints = (p.rig.joints || []).map((j) => `<div class="joint"><b>${esc(j.id)}</b> · ${j.type === 'hinge' ? 'otočný' : 'posuvný'} · ${range(j)}${j.detents ? ` · zarážky ${j.detents.map(num).join(', ')}` : ''}${j.spring ? ' · pružina' : ''} · ${{ manual: 'ruka', motor: 'pohon', both: 'ruka i pohon' }[j.drive] || ''}<p>${esc((notes[p.id] || {})[j.id] || '')}</p></div>`);
  info.innerHTML = `<h2>${esc(p.title)}</h2><code>${esc(p.id)}</code>
    <table>
      <tr><td>kategorie</td><td>${esc(p.category)}</td></tr>
      <tr><td>obal š × v × h</td><td>${size} m (přes celý rozsah pohybu)</td></tr>
      <tr><td>trojúhelníků</td><td>${p.tris}</td></tr>
      <tr><td>těleso</td><td>${esc(body)}</td></tr>
      <tr><td>interakce</td><td>${it ? esc(`${it.kind}${it.prompt ? ` („${it.prompt}“)` : ''}${it.manipulate ? ', jde táhnout myší' : ''}`) : 'žádná'}</td></tr>
      <tr><td>vstupy</td><td>${esc((p.inputs || []).join(', ') || 'žádné')}</td></tr>
      <tr><td>výstupy</td><td>${esc((p.outputs || []).join(', ') || 'žádné')}</td></tr>
      <tr><td>uzly kostry</td><td>${esc(p.rig.nodes.map((n) => n.id).join(' → '))}</td></tr>
    </table>
    ${joints.length ? joints.join('') : '<div class="joint">Bez kloubu: pevný předmět.</div>'}
    <div class="mats"><b>Materiály</b>${[...new Set(p.parts.map((x) => x.mat))].map((m) => `<p>${esc(m)}: ${texLine(m)}</p>`).join('')}</div>
    <div id="hint">Tažení myší otáčí, kolečko přibližuje. Meze kloubů jsou úvaha z obecné znalosti předmětu, žádná nebyla změřena.</div>`;
}
function texLine(m) {
  const t = TEXTURES.materials[m];
  if (!t) return 'jen barva';
  const f = TEXTURES.files[t.albedo].from;
  return esc(`${f.source === 'polyhaven' ? 'Poly Haven' : 'ambientCG'} ${f.id}${t.mode === 'gray' ? ' (jen kresba v šedi, barvu dává materiál)' : ''}, ${f.author}, ${f.license}, dlaždice ${String(t.uvScale).replace('.', ',')} m`);
}
document.querySelectorAll('button.look').forEach((b) => (b.onclick = () => setLook(b.dataset.look)));

let phase = 0;
function tick() {
  if (!playing) return;
  phase += 0.012;
  setPose(0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
  requestAnimationFrame(tick);
}
document.getElementById('mode-one').onclick = () => showOne(current);
document.getElementById('mode-all').onclick = showAll;
document.getElementById('man').onclick = () => {
  man.visible = !man.visible;
  ui();
  render();
};
function resize() {
  const w = canvas.clientWidth || 800;
  const h = canvas.clientHeight || 600;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  render();
}
controls.addEventListener('change', render);
addEventListener('resize', resize);
resize();
showOne(current);

// ---- háček pro testy a montáž ---------------------------------------------------------------

/** Jeden čtvercový snímek prefabu v poloze t (0 klid, 1 krajní) jako plátno. */
function tile(id, t, px) {
  const keep = { mode, current, pose, man: man.visible, w: canvas.width, h: canvas.height, aspect: camera.aspect };
  man.visible = false;
  grid.visible = false;
  renderer.setSize(px, px, false);
  camera.aspect = 1;
  pose = t;
  showOne(id);
  render();
  const copy = document.createElement('canvas');
  copy.width = copy.height = px;
  copy.getContext('2d', { willReadFrequently: true }).drawImage(canvas, 0, 0); // čte se z něj statistika obrazu
  grid.visible = true;
  man.visible = keep.man;
  pose = keep.pose;
  renderer.setSize(keep.w, keep.h, false);
  camera.aspect = keep.aspect;
  camera.updateProjectionMatrix();
  return copy;
}
/** Statistika plátna: průměrný jas a počet odstínů (prázdný obraz = jeden odstín). */
function stats(cv) {
  const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const seen = new Set();
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) {
    sum += px[i] + px[i + 1] + px[i + 2];
    seen.add((px[i] >> 3) * 1024 + (px[i + 1] >> 3) * 32 + (px[i + 2] >> 3));
  }
  return { mean: sum / (px.length / 4) / 3, colors: seen.size };
}
function diff(a, b) {
  const p = a.getContext('2d').getImageData(0, 0, a.width, a.height).data;
  const q = b.getContext('2d').getImageData(0, 0, b.width, b.height).data;
  let n = 0;
  for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]) > 24) n++;
  return n / (p.length / 4);
}
globalThis.__kit = {
  ready: true,
  version: VERSION,
  findings,
  ids: prefabs.map((p) => p.id),
  jointed: prefabs.filter((p) => (p.rig.joints || []).length).map((p) => p.id),
  select: showOne,
  all: showAll,
  look: setLook,
  textures: () => ({ state: texState, files: Object.keys(TEXTURE_BYTES).length, bytes: texBytes, materials: Object.keys(TEXTURES.materials).length, look }),
  /** Jas středu stěny 2 × 2 m čelně v každém pohledu (průměr bodů 0–255): zesílení má držet průměr u barvy materiálu. */
  swatchStats(ids = Object.keys(TEXTURES.materials), px = 96) {
    const keep = look;
    const m = partMesh({ shape: 'box', min: [-1, 0, -0.05], max: [1, 2, 0.05] });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(m.uvs, 2));
    geo.setIndex(m.indices);
    const keepSize = { w: canvas.width, h: canvas.height, aspect: camera.aspect, man: man.visible };
    man.visible = false;
    grid.visible = false;
    renderer.setSize(px, px, false);
    camera.aspect = 1;
    const copy = document.createElement('canvas');
    copy.width = copy.height = px;
    const g = copy.getContext('2d', { willReadFrequently: true });
    const out = {};
    for (const l of Object.keys(LOOKS)) {
      setLook(l);
      clear();
      for (const id of ids) {
        const mesh = new THREE.Mesh(geo, material(id, matDefs, l));
        holder.add(mesh);
        frame([-0.5, 0.5, -0.05], [0.5, 1.5, 0.05], [0, 0, 1]);
        render();
        g.drawImage(canvas, 0, 0);
        const d = g.getImageData(px / 4, px / 4, px / 2, px / 2).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
        (out[id] ??= {})[l] = Math.round((sum / (d.length / 4)) * 10) / 10;
        holder.remove(mesh);
      }
    }
    geo.dispose();
    grid.visible = true;
    man.visible = keepSize.man;
    renderer.setSize(keepSize.w, keepSize.h, false);
    camera.aspect = keepSize.aspect;
    camera.updateProjectionMatrix();
    setLook(keep);
    return out;
  },
  /** Vzorník materiálů s texturou: stěna 2 × 2 m v každém pohledu (zdi a podlahy na prefabech vidět nejsou). */
  swatches(px = 180, cols = 3, ids = Object.keys(TEXTURES.materials)) {
    const keep = look;
    const looks = Object.keys(LOOKS);
    const geo = new THREE.BufferGeometry();
    const m = partMesh({ shape: 'box', min: [-1, 0, -0.05], max: [1, 2, 0.05] });
    geo.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(m.uvs, 2));
    geo.setIndex(m.indices);
    const tw = looks.length * (px + 4);
    const th = px + 22;
    const out = document.createElement('canvas');
    out.width = cols * (tw + 12) + 12;
    out.height = Math.ceil(ids.length / cols) * (th + 10) + 34;
    const g = out.getContext('2d');
    g.fillStyle = '#0b0d12';
    g.fillRect(0, 0, out.width, out.height);
    g.font = '13px system-ui, sans-serif';
    g.fillStyle = '#8b93a5';
    for (let c = 0; c < cols; c++) looks.forEach((l, k) => g.fillText(LOOKS[l], 12 + c * (tw + 12) + k * (px + 4) + 4, 22));
    const keepSize = { w: canvas.width, h: canvas.height, aspect: camera.aspect, man: man.visible };
    clear();
    man.visible = false;
    grid.visible = false;
    renderer.setSize(px, px, false);
    camera.aspect = 1;
    looks.forEach((l, k) => {
      setLook(l);
      clear();
      ids.forEach((id, i) => {
        const mesh = new THREE.Mesh(geo, material(id, matDefs, l));
        holder.add(mesh);
        frame([-1, 0, -0.05], [1, 2, 0.05], [0.45, 0.25, 1.2]);
        render();
        const x = 12 + (i % cols) * (tw + 12) + k * (px + 4);
        const y = 34 + Math.floor(i / cols) * (th + 10);
        g.drawImage(canvas, x, y, px, px);
        holder.remove(mesh);
        if (k === 0) {
          const t = TEXTURES.materials[id];
          g.fillStyle = '#d8dbe2';
          g.fillText(`${id} · ${t.source.split(':')[1]}${t.mode === 'gray' ? ' (šedá kresba)' : ''}`.slice(0, 64), x + 2, y + px + 16);
        }
      });
    });
    geo.dispose();
    grid.visible = true;
    man.visible = keepSize.man;
    renderer.setSize(keepSize.w, keepSize.h, false);
    camera.aspect = keepSize.aspect;
    camera.updateProjectionMatrix();
    setLook(keep);
    return out.toDataURL('image/png');
  },
  /** Porovnání pohledů: u každého prefabu v klidu čistý, T460 a grafická karta vedle sebe. */
  compare(ids, px = 200, cols = 2) {
    const keep = look;
    const looks = Object.keys(LOOKS);
    const tw = looks.length * (px + 4);
    const th = px + 22;
    const rows = Math.ceil(ids.length / cols);
    const out = document.createElement('canvas');
    out.width = cols * (tw + 12) + 12;
    out.height = rows * (th + 10) + 34;
    const g = out.getContext('2d');
    g.fillStyle = '#0b0d12';
    g.fillRect(0, 0, out.width, out.height);
    g.font = '13px system-ui, sans-serif';
    g.fillStyle = '#8b93a5';
    for (let c = 0; c < cols; c++) looks.forEach((l, k) => g.fillText(LOOKS[l], 12 + c * (tw + 12) + k * (px + 4) + 4, 22));
    const tiles = new Map();
    for (const l of looks) {
      setLook(l);
      for (const id of ids) tiles.set(`${l}:${id}`, tile(id, 0, px));
    }
    ids.forEach((id, i) => {
      const x = 12 + (i % cols) * (tw + 12);
      const y = 34 + Math.floor(i / cols) * (th + 10);
      looks.forEach((l, k) => g.drawImage(tiles.get(`${l}:${id}`), x + k * (px + 4), y));
      g.fillStyle = '#d8dbe2';
      g.fillText(byId.get(id).title.slice(0, 60), x + 2, y + px + 16);
    });
    setLook(keep);
    return out.toDataURL('image/png');
  },
  pose: setPose,
  shot() {
    render();
    return canvas.toDataURL('image/png');
  },
  /** Kontrola jednoho prefabu: obraz v klidu, obraz v krajní poloze a podíl změněných bodů. */
  check(id, px = 160) {
    const a = tile(id, 0, px);
    const b = tile(id, 1, px);
    const out = { rest: stats(a), far: stats(b), moved: diff(a, b) };
    showOne(keepId());
    return out;
  },
  /** Montáž celé sady: u každého prefabu klid vlevo, krajní poloha vpravo (bez kloubu jen jeden snímek). */
  montage(ids = prefabs.map((p) => p.id), px = 150, cols = 6) {
    const tw = px * 2 + 6;
    const th = px + 22;
    const rows = Math.ceil(ids.length / cols);
    const out = document.createElement('canvas');
    out.width = cols * (tw + 8) + 8;
    out.height = rows * (th + 8) + 8;
    const g = out.getContext('2d');
    g.fillStyle = '#0b0d12';
    g.fillRect(0, 0, out.width, out.height);
    g.font = '11px system-ui, sans-serif';
    ids.forEach((id, i) => {
      const p = byId.get(id);
      const x = 8 + (i % cols) * (tw + 8);
      const y = 8 + Math.floor(i / cols) * (th + 8);
      g.drawImage(tile(id, 0, px), x, y);
      if ((p.rig.joints || []).length) g.drawImage(tile(id, 1, px), x + px + 6, y);
      else {
        g.fillStyle = '#12151d';
        g.fillRect(x + px + 6, y, px, px);
        g.fillStyle = '#56607a';
        g.fillText('bez kloubu', x + px + 6 + px / 2 - 28, y + px / 2);
      }
      g.fillStyle = '#d8dbe2';
      g.fillText(`${p.title}`.slice(0, 52), x + 2, y + px + 15);
    });
    showOne(keepId());
    return out.toDataURL('image/png');
  },
};
function keepId() {
  return current;
}
