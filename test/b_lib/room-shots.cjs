// Snímky místností levelů gen_demo v enginu sešny A (cíl xlab_gen) do jedné montáže pro Ondřeje.
//   node test/b_lib/room-shots.cjs [výstup.png] [vzor id buňky]   výchozí test/out/b_mistnosti.png, laboratoře a IT
// Kamera stojí ve dveřích buňky ve výšce očí a míří do místnosti. Pomůcka, ne test: nic nehodnotí.

const path = require('node:path');
const { launch, open, saveDataUrl, ROOT } = require('../h.cjs');

const OUT = process.argv[2] || 'b_mistnosti.png';
const PATTERN = process.argv[3] || '^c_(chem|bio|mol|anal|viv|server|hpc|open|meet)_';
const LEVELS = ['complex_7', 'complex_21'];

(async () => {
  const browser = await launch();
  try {
    const shots = [];
    for (const lid of LEVELS) {
      const { page } = await open(browser, { file: 'dist/xlab_gen.html', q: `?level=${lid}&dev`, ready: 'window.__xe && window.__xe.ready === true', timeout: 180000 });
      const got = await page.evaluate(
        ([lid, pattern]) => {
          __xe.start();
          __xe.sim(0.2);
          const L = __PACK__.levels.find((l) => l.data.id === lid).data;
          const re = new RegExp(pattern);
          const seen = new Set();
          const out = [];
          for (const c of L.cells) {
            const kind = c.id.replace(/_\d+$/, '');
            if (!re.test(c.id) || seen.has(kind)) continue;
            seen.add(kind);
            const [a, b] = [c.bounds.min, c.bounds.max];
            const w = b[0] - a[0];
            const d = b[2] - a[2];
            // kamera ve dveřích: 0,6 m za středem otvoru do místnosti, ve výšce očí, míří ke středu protější poloviny
            const portal = L.portals.find((p) => p.a === c.id || p.b === c.id);
            const q = portal.quad;
            const mid = [0, 1, 2].map((k) => q.reduce((s, v) => s + v[k], 0) / q.length);
            const flatX = q.every((v) => Math.abs(v[0] - q[0][0]) < 1e-6);
            const cen = [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2];
            const nx = flatX ? Math.sign(cen[0] - mid[0]) : 0;
            const nz = flatX ? 0 : Math.sign(cen[1] - mid[2]);
            const P = [mid[0] + nx * 0.6, a[1] + 1.7, mid[2] + nz * 0.6];
            const Q = [cen[0] + nx * w * 0.15, a[1] + 0.7, cen[1] + nz * d * 0.15];
            const dv = Q.map((v, k) => v - P[k]);
            const yaw = (Math.atan2(-dv[0], -dv[2]) * 180) / Math.PI;
            const pitch = (Math.atan2(dv[1], Math.hypot(dv[0], dv[2])) * 180) / Math.PI;
            out.push({ name: `${c.name} (${w.toFixed(1)} × ${d.toFixed(1)} m)`, png: __xe.shotAt(P[0], P[1], P[2], yaw, pitch, 90).png });
          }
          return out;
        },
        [lid, PATTERN],
      );
      shots.push(...got);
      await page.close();
    }
    // montáž: tři sloupce s popisky
    const page = await browser.newPage();
    const url = await page.evaluate(async (list) => {
      const imgs = await Promise.all(list.map((s) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = s.png; })));
      const W = 640;
      const H = Math.round((imgs[0].height / imgs[0].width) * W);
      const cols = 3;
      const rows = Math.ceil(imgs.length / cols);
      const cv = document.createElement('canvas');
      cv.width = cols * W;
      cv.height = rows * (H + 28);
      const g = cv.getContext('2d');
      g.fillStyle = '#111';
      g.fillRect(0, 0, cv.width, cv.height);
      imgs.forEach((im, i) => {
        const [x, y] = [(i % cols) * W, Math.floor(i / cols) * (H + 28)];
        g.drawImage(im, x, y + 28, W, H);
        g.fillStyle = '#eee';
        g.font = '17px sans-serif';
        g.fillText(list[i].name, x + 8, y + 20);
      });
      return cv.toDataURL('image/png');
    }, shots);
    console.log(saveDataUrl(url, OUT), shots.map((s) => s.name).join(' | '));
  } finally {
    await browser.close();
  }
})();
