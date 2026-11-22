// Porovnání dvou snímků (data URL PNG) v prohlížeči: průměrný rozdíl kanálu a podíl bodů nad prahem.
// Spouští se uvnitř stránky přes page.evaluate; nic nestahuje a nepotřebuje žádnou knihovnu.

const COMPARE = `async ([a, b, threshold]) => {
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
  const px = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h); return g.getImageData(0, 0, w, h).data; };
  const da = px(ia), db = px(ib);
  let sum = 0, over = 0, la = 0, lb = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3;
    sum += d; if (d > threshold) over++;
    la += (da[i] + da[i + 1] + da[i + 2]) / 3; lb += (db[i] + db[i + 1] + db[i + 2]) / 3;
  }
  const n = w * h;
  return { w, h, sameSize: ia.width === ib.width && ia.height === ib.height, mean: sum / n, over: over / n, lumaA: la / n, lumaB: lb / n };
}`;

/** Vrací { mean, over, lumaA, lumaB, sameSize }: mean = průměrný rozdíl kanálu 0–255, over = podíl bodů s rozdílem nad threshold. */
const compare = (page, a, b, threshold = 24) => page.evaluate(`(${COMPARE})(${JSON.stringify([a, b, threshold])})`);

/** Jas a počet odstínů snímku (hrubá kontrola, že obraz není prázdný). */
const STATS = `async (src) => {
  const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = src; });
  const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(i, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data; let sum = 0, dark = 0; const seen = new Set();
  for (let k = 0; k < d.length; k += 4) { const l = (d[k] + d[k + 1] + d[k + 2]) / 3; sum += l; if (l < 6) dark++; seen.add((d[k] >> 3) << 10 | (d[k + 1] >> 3) << 5 | (d[k + 2] >> 3)); }
  const n = d.length / 4;
  return { luma: sum / n, dark: dark / n, shades: seen.size };
}`;
const imageStats = (page, src) => page.evaluate(`(${STATS})(${JSON.stringify(src)})`);

module.exports = { compare, imageStats };
