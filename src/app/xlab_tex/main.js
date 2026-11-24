// Zkušební sestavení A2.6, ne obsah hry: zlatý vzorek xLab, kde každý osvětlený materiál dostane texturu barvy
// 1 024 px (na stupni low se zmenší na 512 px) a v hale stojí stojan z .glb. Textury (šum v plátně → WebP) a model
// (kódem, test/a_lib/glb.mjs) vyrábí stránka při startu, protože build binární soubory balíku zatím nevkládá
// (návrh N-111). Účel: změřit na T460 cenu textur. ?bench měří s texturami, ?bench&tex=0 totéž bez nich.
// Engine se tu nemění: do balíku přibudou jen pack.files, pole albedo a jeden prefab, jako by je dodala data.

import { makeGlb, boxMesh } from '../../../test/a_lib/glb.mjs';

const SIZE = 1024;

/** Deterministický šum hodnot (mřížka × hladká interpolace), několik oktáv; výsledek 0..1. */
function noise(seed) {
  const grid = (n, s) => {
    const g = new Float32Array((n + 1) * (n + 1));
    let x = s >>> 0 || 1;
    for (let i = 0; i < g.length; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      g[i] = (x >>> 0) / 4294967296;
    }
    for (let i = 0; i <= n; i++) g[n * (n + 1) + i] = g[i]; // dlaždice navazuje svisle
    for (let j = 0; j <= n; j++) g[j * (n + 1) + n] = g[j * (n + 1)]; // i vodorovně
    return (u, v) => {
      const fx = u * n;
      const fy = v * n;
      const ix = Math.min(n - 1, Math.floor(fx));
      const iy = Math.min(n - 1, Math.floor(fy));
      const tx = fx - ix;
      const ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = g[iy * (n + 1) + ix];
      const b = g[iy * (n + 1) + ix + 1];
      const c = g[(iy + 1) * (n + 1) + ix];
      const d = g[(iy + 1) * (n + 1) + ix + 1];
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  };
  const oct = [grid(4, seed), grid(16, seed * 7 + 1), grid(64, seed * 13 + 3), grid(256, seed * 31 + 5)];
  const w = [0.45, 0.3, 0.17, 0.08];
  return (u, v) => oct.reduce((s, f, i) => s + f(u, v) * w[i], 0);
}

/** Světlá textura s jemnou skvrnitostí (násobí barvu materiálu), jako WebP. */
async function makeTexture(seed) {
  const c = new OffscreenCanvas(SIZE, SIZE);
  const g = c.getContext('2d');
  const img = g.createImageData(SIZE, SIZE);
  const n = noise(seed);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = 150 + 105 * n(x / SIZE, y / SIZE);
      const i = (y * SIZE + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const blob = await c.convertToBlob({ type: 'image/webp', quality: 0.85 });
  return new Uint8Array(await blob.arrayBuffer());
}

async function prepare(p) {
  const params = new URLSearchParams(location.search);
  p.files = {};
  // stojan z .glb v hale (díl mesh, kolize síť trojúhelníků)
  p.files['golden/models/stand.glb'] = makeGlb([{ name: 'body', mesh: boxMesh([-0.4, 0, -0.4], [0.4, 1.6, 0.4]) }]);
  p.prefabs.push({
    file: 'prefabs/test_mesh_01.json',
    data: {
      xspace: 1, kind: 'prefab', id: 'test_mesh_01', title: 'Zkušební stojan z .glb', category: 'prop.test',
      bounds: { min: [-0.4, 0, -0.4], max: [0.4, 1.6, 0.4] }, rig: { nodes: [{ id: 'root' }] },
      parts: [{ node: 'root', shape: 'mesh', mesh: 'models/stand.glb#body', mat: 'metal_plate' }],
      colliders: [{ node: 'root', shape: 'mesh', mesh: 'models/stand.glb#body', group: 'world' }],
      components: { physics: { body: 'static' } },
    },
  });
  p.levels[0].data.entities.push({ id: 'e_stand', prefab: 'test_mesh_01', cell: 'c_hall', pos: [-1, 0, -16], rot: [0, 0, 0] });
  if (params.get('tex') === '0') return;
  const mats = Object.entries(p.materials.materials).filter(([, m]) => m.model === 'lit');
  let seed = 1;
  for (const [id, m] of mats) {
    const path = `textures/${id}.webp`;
    p.files[`golden/${path}`] = await makeTexture(seed++);
    m.albedo = path;
    m.uvScale = m.uvScale ?? 1;
  }
}

prepare(globalThis.__PACK__)
  .then(() => import('../main.js'))
  .catch((err) => {
    console.error(err);
    const fail = document.getElementById('fail');
    fail.hidden = false;
    fail.textContent = `Zkušební sestavení se nespustilo: ${err.message}`;
  });
