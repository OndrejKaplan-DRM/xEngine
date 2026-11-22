// xBench: měření referenčního stroje (Lenovo T460 a jakýkoli jiný). Není to hra ani engine.
// Odpovídá na otázku „kolik volání kreslení, trojúhelníků a světel stroj unese při 60 snímcích“,
// aby rozpočty v docs/06_ROZPOCTY.md stály na číslech, ne na odhadu.
// Měří čas snímku bez omezení obnovovací frekvencí: K vykreslení za sebou + gl.readPixels (čeká na GPU).

import * as THREE from 'three';

const VERSION = 'xBench 0.2 · 2026-11-22';
/** Rozpočet vykreslení v ms; zbytek 16,6 ms patří simulaci, prohlížeči a výkyvům (docs/06_ROZPOCTY.md). */
const LIMIT = 10;
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
  // Od verze 0.2. Prvních 16 případů se nemění, aby šly výsledky srovnat s verzí 0.1.
  // vc = barva vrcholů, room = místnost kolem kamery (pokrytý celý obraz), tex = textura, aa = vyhlazování hran.
  { id: 'svetla_0', group: 'Bodová světla', label: 'bez bodových světel', calls: 200, tris: 200e3, lights: 0 },
  { id: 'svetla_1', group: 'Bodová světla', label: '1 světlo', calls: 200, tris: 200e3, lights: 1 },
  { id: 'svetla_2', group: 'Bodová světla', label: '2 světla', calls: 200, tris: 200e3, lights: 2 },
  { id: 'vrcholy', group: 'Světlo po vrcholech', label: 'barva vrcholů, bez výpočtu světel', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true },
  { id: 'vrcholy_fhd', group: 'Světlo po vrcholech', label: 'barva vrcholů, 1920 × 1080', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true, res: FHD },
  { id: 'interier', group: 'Interiér (celý obraz)', label: 'barva vrcholů', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true, room: true },
  { id: 'interier_576', group: 'Interiér (celý obraz)', label: 'barva vrcholů, 1025 × 576', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true, room: true, scale: 0.75 },
  { id: 'interier_fhd', group: 'Interiér (celý obraz)', label: 'barva vrcholů, 1920 × 1080', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true, room: true, res: FHD },
  { id: 'interier_tex', group: 'Interiér (celý obraz)', label: 'barva vrcholů a textura', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true, room: true, tex: true },
  { id: 'interier_aa', group: 'Interiér (celý obraz)', label: 'barva vrcholů, vyhlazování hran', calls: 200, tris: 200e3, lights: 0, mat: 'basic', vc: true, room: true, aa: true },
  { id: 'interier_1', group: 'Interiér (celý obraz)', label: 'barva vrcholů a 1 světlo po pixelech', calls: 200, tris: 200e3, lights: 1, vc: true, room: true },
  { id: 'interier_4', group: 'Interiér (celý obraz)', label: '4 světla po pixelech', calls: 200, tris: 200e3, lights: 4, room: true },
];
const QUICK = [
  { id: 'q_zaklad', group: 'Rychlá zkouška', label: '20 volání · 4 tis. △', calls: 20, tris: 4e3, lights: 0 },
  { id: 'q_svetla', group: 'Rychlá zkouška', label: '20 volání · 2 světla', calls: 20, tris: 4e3, lights: 2 },
  { id: 'q_interier', group: 'Rychlá zkouška', label: 'interiér, barva vrcholů, textura, vyhlazování', calls: 20, tris: 4e3, lights: 0, mat: 'basic', vc: true, room: true, tex: true, aa: true },
  { id: 'q_interier_1', group: 'Rychlá zkouška', label: 'interiér, 1 světlo po pixelech', calls: 20, tris: 4e3, lights: 1, vc: true, room: true },
];

const canvas = document.getElementById('c');
function makeRenderer(cv, antialias) {
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias, powerPreference: 'high-performance' });
  r.shadowMap.type = THREE.PCFShadowMap;
  return r;
}
// Vyhlazování hran je vlastnost kontextu a nejde přepnout; případy s `aa` proto kreslí do druhého plátna mimo stránku.
const rendMain = makeRenderer(canvas, false);
let rendAA = null;
let renderer = rendMain;
let gl = renderer.getContext();
function useRenderer(aa) {
  if (aa && !rendAA) rendAA = makeRenderer(document.createElement('canvas'), true);
  renderer = aa ? rendAA : rendMain;
  gl = renderer.getContext();
}

/** Barva vrcholů: stejná práce pro grafiku jako světlo spočítané po vrcholech. */
function paint(geo, seed) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(pos.getY(i) * 3 + i * 0.37 + seed));
    col[i * 3] = k;
    col[i * 3 + 1] = k * 0.95;
    col[i * 3 + 2] = k * 0.85;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function checker() {
  const n = 256;
  const d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const g = (((x >> 4) + (y >> 4)) & 1 ? 200 : 120) + ((x * 13 + y * 7) % 23);
      d.set([g, g, g, 255], (y * n + x) * 4);
    }
  }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
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
    if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) { m.map?.dispose(); m.dispose(); }
    o.shadow?.map?.dispose();
  });
  renderer.renderLists.dispose();
  scene = null;
}

function buildScene(c) {
  dispose();
  useRenderer(!!c.aa);
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
  const tex = c.tex ? checker() : null;
  const opt = (col) => ({ color: col, vertexColors: !!c.vc, map: tex });
  const make = (col) => (kind === 'standard' ? new THREE.MeshStandardMaterial({ ...opt(col), roughness: 0.7, metalness: 0.1 }) : kind === 'basic' ? new THREE.MeshBasicMaterial(opt(col)) : new THREE.MeshLambertMaterial(opt(col)));
  const mats = colors.map(make);
  const geos = [0, 1, 2, 3].map((k) => (c.vc ? paint(new THREE.SphereGeometry(0.42, ws, hs), k) : new THREE.SphereGeometry(0.42, ws, hs)));
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
  const floorMat = kind === 'basic' ? new THREE.MeshBasicMaterial(opt(0x55585e)) : new THREE.MeshLambertMaterial(opt(0x55585e));
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  if (c.vc) paint(floorGeo, 9);
  const floor = new THREE.Mesh(floorGeo, floorMat);
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
  let extra = 0;
  if (c.room) {
    // Kamera obíhá na poloměru side * 1,25 + 3; místnost je o 3 m širší, takže stěny a strop pokryjí celý obraz.
    const half = side * 1.25 + 6;
    const hgt = side * 1.1 + 6;
    const g = new THREE.BoxGeometry(half * 2, hgt, half * 2, 16, 8, 16);
    if (c.vc) paint(g, 5);
    const m = kind === 'basic' ? new THREE.MeshBasicMaterial(opt(0x9a9fa8)) : new THREE.MeshLambertMaterial(opt(0x9a9fa8));
    m.side = THREE.BackSide;
    const room = new THREE.Mesh(g, m);
    room.position.y = hgt / 2 - 0.01;
    scene.add(room);
    extra = g.index.count / 3;
  }
  camera.userData.R = side * 1.25 + 3;
  camera.userData.h = side * 0.75 + 1;
  return { tris: tris + 2 + extra, calls: n + 1 + (c.room ? 1 : 0), buffer: [Math.round(w * scale), Math.round(h * scale)] };
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
  const cls = r.ms <= LIMIT ? 'good' : r.ms <= 16.6 ? 'mid' : 'bad';
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${c.group}</td><td>${c.label}</td><td>${built.calls}</td><td>${Math.round(built.tris / 1000)} tis.</td><td>${built.buffer.join(' × ')}</td><td class="${cls}">${r.ms.toFixed(1)} ms</td><td>${r.p95.toFixed(1)} ms</td><td class="${cls}">${fps.toFixed(0)}</td>`;
  $('rows').appendChild(tr);
}

function verdict(results) {
  const by = (id) => results.find((r) => r.id === id);
  const best = (prefix, key) => {
    const ok = results.filter((r) => r.id.startsWith(prefix) && r.ms <= LIMIT);
    return ok.length ? Math.max(...ok.map((r) => r[key])) : 0;
  };
  if (!by('zaklad')) return 'Rychlá zkouška: verdikt se nepočítá.';
  const f = (r) => (r ? `${r.ms.toFixed(1)} ms` : '?');
  const lines = [`Rozpočet vykreslení je ${LIMIT} ms ze 16,6 ms snímku.`];
  lines.push(`Do rozpočtu se vejde: volání kreslení ${best('volani_', 'calls') || 'méně než 200'}, trojúhelníků ${Math.round(best('tris_', 'tris') / 1000) || 'méně než 300'} tis.`);
  const room = by('interier');
  if (room) {
    lines.push(`Interiér s barvou vrcholů: ${f(room)} (576 řádků ${f(by('interier_576'))}, 1080 řádků ${f(by('interier_fhd'))}, s texturou ${f(by('interier_tex'))}, s vyhlazováním hran ${f(by('interier_aa'))}).`);
    const one = by('interier_1');
    const four = by('interier_4');
    if (one && four) lines.push(`Světlo po pixelech v interiéru: jedno ${f(one)} (o ${(one.ms - room.ms).toFixed(1)} ms víc), čtyři ${f(four)} (o ${(four.ms - room.ms).toFixed(1)} ms víc).`);
  }
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
    results.push({ id: c.id, calls: built.calls, tris: built.tris, lights: c.lights, buffer: built.buffer, mat: c.mat || 'lambert', shadow: !!c.shadow, vc: !!c.vc, room: !!c.room, tex: !!c.tex, aa: !!c.aa, ...r });
    row(c, built, r);
  }
  dispose();
  useRenderer(false);
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

/** Podíl bodů obrazu zakrytých geometrií (0 až 1) pro daný případ. Nezávisí na stroji; slouží ke kontrole scény. */
function coverage(id) {
  const c = [...CASES, ...QUICK].find((x) => x.id === id);
  if (!c || running) return null;
  const built = buildScene(c);
  frame(0.7);
  const [w, h] = built.buffer;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  let hit = 0;
  for (let i = 0; i < buf.length; i += 4) if (Math.abs(buf[i] - 11) > 2 || Math.abs(buf[i + 1] - 13) > 2 || Math.abs(buf[i + 2] - 18) > 2) hit++;
  dispose();
  useRenderer(false);
  return hit / (w * h);
}

globalThis.__xbench = { ready: true, version: VERSION, run, coverage, cases: CASES.map((c) => c.id) };
