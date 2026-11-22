// xBench: měření referenčního stroje (Lenovo T460 a jakýkoli jiný). Není to hra ani engine.
// Odpovídá na otázku „kolik volání kreslení, trojúhelníků a světel stroj unese při 60 snímcích“,
// aby rozpočty v docs/06_ROZPOCTY.md stály na číslech, ne na odhadu.
// Měří čas snímku bez omezení obnovovací frekvencí: K vykreslení za sebou + gl.readPixels (čeká na GPU).

import * as THREE from 'three';

const VERSION = 'xBench 0.1 · 2026-11-22';
const HD = [1366, 768];
const FHD = [1920, 1080];

/** Případy. calls = počet sítí (volání kreslení), tris = trojúhelníků celkem, lights = bodová světla. */
const CASES = [
  { id: 'zaklad', group: 'Základ', label: '100 volání · 100 tis. △', calls: 100, tris: 100e3, lights: 0 },
  { id: 'volani_200', group: 'Volání kreslení', label: '200 volání', calls: 200, tris: 100e3, lights: 0 },
  { id: 'volani_400', group: 'Volání kreslení', label: '400 volání', calls: 400, tris: 100e3, lights: 0 },
  { id: 'volani_800', group: 'Volání kreslení', label: '800 volání', calls: 800, tris: 100e3, lights: 0 },
  { id: 'tris_300', group: 'Trojúhelníky', label: '300 tis. △', calls: 200, tris: 300e3, lights: 0 },
  { id: 'tris_600', group: 'Trojúhelníky', label: '600 tis. △', calls: 200, tris: 600e3, lights: 0 },
  { id: 'tris_1200', group: 'Trojúhelníky', label: '1,2 mil. △', calls: 200, tris: 1200e3, lights: 0 },
  { id: 'svetla_4', group: 'Bodová světla', label: '4 světla', calls: 200, tris: 200e3, lights: 4 },
  { id: 'svetla_8', group: 'Bodová světla', label: '8 světel', calls: 200, tris: 200e3, lights: 8 },
  { id: 'svetla_16', group: 'Bodová světla', label: '16 světel', calls: 200, tris: 200e3, lights: 16 },
  { id: 'pbr_8', group: 'Materiál', label: 'fyzikální materiál, 8 světel', calls: 200, tris: 200e3, lights: 8, mat: 'standard' },
  { id: 'zapecene', group: 'Materiál', label: 'zapečené světlo (bez výpočtu světel)', calls: 200, tris: 200e3, lights: 0, mat: 'basic' },
  { id: 'stin_2048', group: 'Stín', label: 'jedno světlo se stínem 2048 px, 4 světla', calls: 200, tris: 200e3, lights: 4, shadow: true },
  { id: 'meritko_75', group: 'Rozlišení', label: '8 světel, měřítko 75 %', calls: 200, tris: 200e3, lights: 8, scale: 0.75 },
  { id: 'meritko_50', group: 'Rozlišení', label: '8 světel, měřítko 50 %', calls: 200, tris: 200e3, lights: 8, scale: 0.5 },
  { id: 'fhd_8', group: 'Rozlišení', label: '8 světel, 1920 × 1080', calls: 200, tris: 200e3, lights: 8, res: FHD },
];
const QUICK = [
  { id: 'q_zaklad', group: 'Rychlá zkouška', label: '20 volání · 4 tis. △', calls: 20, tris: 4e3, lights: 0 },
  { id: 'q_svetla', group: 'Rychlá zkouška', label: '20 volání · 2 světla', calls: 20, tris: 4e3, lights: 2 },
];

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.type = THREE.PCFShadowMap;
const gl = renderer.getContext();
const px = new Uint8Array(4);
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

function environment() {
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const ext = (n) => !!gl.getExtension(n);
  return {
    tool: VERSION,
    three: THREE.REVISION,
    date: new Date().toISOString(),
    userAgent: navigator.userAgent,
    cores: navigator.hardwareConcurrency || null,
    memoryGB: navigator.deviceMemory || null,
    screen: [screen.width, screen.height],
    dpr: devicePixelRatio,
    gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    webgl2: typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext,
    webgpu: 'gpu' in navigator,
    maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    textures: {
      s3tc: ext('WEBGL_compressed_texture_s3tc'),
      bptc: ext('EXT_texture_compression_bptc'),
      etc2: ext('WEBGL_compressed_texture_etc'),
      astc: ext('WEBGL_compressed_texture_astc'),
    },
    floatTarget: ext('EXT_color_buffer_float'),
    anisotropy: renderer.capabilities.getMaxAnisotropy(),
  };
}

let scene = null;
let camera = null;
function dispose() {
  if (!scene) return;
  scene.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
    o.shadow?.map?.dispose();
  });
  renderer.renderLists.dispose();
  scene = null;
}

function buildScene(c) {
  dispose();
  const [w, h] = c.res || HD;
  const scale = c.scale || 1;
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(w * scale), Math.round(h * scale), false);
  renderer.shadowMap.enabled = !!c.shadow;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d12);
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);

  const per = Math.max(12, Math.round(c.tris / c.calls));
  const ws = Math.max(3, Math.round(Math.sqrt(per)));
  const hs = Math.max(2, Math.round(per / (2 * ws)) + 1);
  const kind = c.mat || 'lambert';
  const colors = [0x8fa3b8, 0xb89f8f, 0x8fb8a1, 0xb8b28f];
  const mats = colors.map((col) =>
    kind === 'standard' ? new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.1 }) : kind === 'basic' ? new THREE.MeshBasicMaterial({ color: col }) : new THREE.MeshLambertMaterial({ color: col }),
  );
  const geos = [0, 1, 2, 3].map(() => new THREE.SphereGeometry(0.42, ws, hs));
  const side = Math.ceil(Math.cbrt(c.calls));
  let n = 0;
  let tris = 0;
  for (let y = 0; y < side && n < c.calls; y++) {
    for (let z = 0; z < side && n < c.calls; z++) {
      for (let x = 0; x < side && n < c.calls; x++) {
        const m = new THREE.Mesh(geos[n % 4], mats[n % 4]);
        m.position.set((x - (side - 1) / 2) * 1.1, 0.6 + y * 1.1, (z - (side - 1) / 2) * 1.1);
        m.castShadow = m.receiveShadow = !!c.shadow;
        scene.add(m);
        tris += geos[n % 4].index.count / 3;
        n++;
      }
    }
  }
  const floorMat = kind === 'basic' ? new THREE.MeshBasicMaterial({ color: 0x55585e }) : new THREE.MeshLambertMaterial({ color: 0x55585e });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = !!c.shadow;
  scene.add(floor);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2));
  const R = side * 0.9 + 2;
  for (let i = 0; i < c.lights; i++) {
    const a = (i / c.lights) * Math.PI * 2;
    const l = new THREE.PointLight(i % 2 ? 0xffd9b0 : 0xb0d0ff, 40, R * 2.5, 2);
    l.position.set(Math.cos(a) * R, side * 0.6 + 1, Math.sin(a) * R);
    scene.add(l);
  }
  if (c.shadow) {
    const d = new THREE.DirectionalLight(0xffffff, 1.5);
    d.position.set(R, R * 2, R);
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    Object.assign(d.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.5, far: R * 5 });
    scene.add(d);
  }
  camera.userData.R = side * 1.25 + 3;
  camera.userData.h = side * 0.75 + 1;
  return { tris: tris + 2, calls: n + 1, buffer: [Math.round(w * scale), Math.round(h * scale)] };
}

function frame(t) {
  const R = camera.userData.R;
  camera.position.set(Math.cos(t) * R, camera.userData.h, Math.sin(t) * R);
  camera.lookAt(0, camera.userData.h * 0.45, 0);
  renderer.render(scene, camera);
}

async function measure(ms) {
  let t = 0;
  for (let i = 0; i < 4; i++) frame((t += 0.01)); // překlad shaderů a první nahrání dat
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  await nextFrame();
  const samples = [];
  let k = 1;
  const start = performance.now();
  while (performance.now() - start < ms) {
    const a = performance.now();
    for (let i = 0; i < k; i++) frame((t += 0.004));
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // počká, až GPU dokreslí
    const batch = performance.now() - a;
    samples.push(batch / k);
    if (batch < 12 && k < 32) k *= 2;
    await nextFrame();
  }
  samples.sort((p, q) => p - q);
  const at = (f) => samples[Math.min(samples.length - 1, Math.floor(samples.length * f))];
  return { ms: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), samples: samples.length };
}

const $ = (id) => document.getElementById(id);
function row(c, built, r) {
  const fps = 1000 / r.ms;
  const cls = r.ms <= 16.6 ? 'good' : r.ms <= 33.3 ? 'mid' : 'bad';
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${c.group}</td><td>${c.label}</td><td>${built.calls}</td><td>${Math.round(built.tris / 1000)} tis.</td><td>${built.buffer.join(' × ')}</td><td class="${cls}">${r.ms.toFixed(1)} ms</td><td>${r.p95.toFixed(1)} ms</td><td class="${cls}">${fps.toFixed(0)}</td>`;
  $('rows').appendChild(tr);
}

function verdict(results) {
  const best = (prefix, key) => {
    const ok = results.filter((r) => r.id.startsWith(prefix) && r.ms <= 16.6);
    return ok.length ? Math.max(...ok.map((r) => r[key])) : 0;
  };
  const base = results.find((r) => r.id === 'zaklad');
  if (!base) return 'Rychlá zkouška: verdikt se nepočítá.';
  const lines = [];
  lines.push(base.ms <= 16.6 ? `Základní scéna běží na ${(1000 / base.ms).toFixed(0)} snímcích za sekundu.` : `Už základní scéna je pod 60 snímky (${(1000 / base.ms).toFixed(0)}). Rozpočty bude nutné snížit.`);
  lines.push(`Při 60 snímcích stroj v tomto měření unese: volání kreslení ${best('volani_', 'calls') || 'méně než 200'}, trojúhelníků ${Math.round(best('tris_', 'tris') / 1000) || 'méně než 300'} tis., bodových světel ${best('svetla_', 'lights') || 'méně než 4'}.`);
  const baked = results.find((r) => r.id === 'zapecene');
  const lit8 = results.find((r) => r.id === 'svetla_8');
  if (baked && lit8) lines.push(`Zapečené světlo je proti 8 bodovým světlům ${(lit8.ms / baked.ms).toFixed(1)}× rychlejší.`);
  return lines.join(' ');
}

let running = false;
async function run({ quick = false, ms = 2500 } = {}) {
  if (running) return null;
  running = true;
  $('start').disabled = true;
  $('rows').innerHTML = '';
  $('out').value = '';
  const env = environment();
  $('env').textContent = `${env.gpu} · ${env.cores || '?'} vláken · ${env.memoryGB || '?'} GB · displej ${env.screen.join(' × ')} · WebGL 2: ${env.webgl2 ? 'ano' : 'ne'} · WebGPU: ${env.webgpu ? 'ano' : 'ne'}`;
  const results = [];
  const list = quick ? QUICK : CASES;
  for (const [i, c] of list.entries()) {
    $('status').textContent = `Měřím ${i + 1} z ${list.length}: ${c.label}`;
    const built = buildScene(c);
    await nextFrame();
    const r = await measure(quick ? 300 : ms);
    results.push({ id: c.id, calls: built.calls, tris: built.tris, lights: c.lights, buffer: built.buffer, mat: c.mat || 'lambert', shadow: !!c.shadow, ...r });
    row(c, built, r);
  }
  dispose();
  const result = { env, results, verdict: verdict(results) };
  $('status').textContent = 'Hotovo. ' + result.verdict;
  $('out').value = JSON.stringify(result);
  $('copy').disabled = false;
  $('start').disabled = false;
  running = false;
  return result;
}

$('ver').textContent = VERSION;
$('start').onclick = () => run();
$('copy').onclick = async () => {
  $('out').select();
  try {
    await navigator.clipboard.writeText($('out').value);
    $('copy').textContent = 'Zkopírováno';
  } catch {
    document.execCommand('copy');
    $('copy').textContent = 'Zkopírováno (označený text)';
  }
};

globalThis.__xbench = { ready: true, version: VERSION, run, cases: CASES.map((c) => c.id) };
