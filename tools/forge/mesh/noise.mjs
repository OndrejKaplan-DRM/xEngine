// xForge, sítě: opakovatelný šum a mírné nepravidelnosti (Ondřej 25. 11. 2026 v 17:00: „přidej nějaké mírné
// nepravidelnosti … nepatrné pokrčení, lehounké propadnutí uprostřed plochy“). Žádný Math.random: šum je funkce polohy
// a semínka, stejný vstup dá bajtově stejnou síť (B-T9 hlídá shodu zápisu).

import { newGeom, vert, quad, deform } from './geo.mjs';

/** Celé číslo → pseudonáhodné číslo 0…1 (hash). */
function hash(i, j, k, s) {
  let h = (i * 374761393 + j * 668265263 + k * 2147483647 + s * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/** Hladký hodnotový šum ve 3D, výsledek −1…1. */
export function noise3(x, y, z, seed = 0) {
  const [i, j, k] = [Math.floor(x), Math.floor(y), Math.floor(z)];
  const [u, v, w] = [fade(x - i), fade(y - j), fade(z - k)];
  const c = (a, b, d) => hash(i + a, j + b, k + d, seed);
  const x0 = lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v);
  const x1 = lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v);
  return lerp(x0, x1, w) * 2 - 1;
}

/** Dvě oktávy šumu (hrubé zvlnění a jemné pokrčení). */
export const fbm = (x, y, z, seed = 0) => noise3(x, y, z, seed) * 0.7 + noise3(x * 2.3 + 17, y * 2.3, z * 2.3, seed + 1) * 0.3;

/** Semínko z textu (id prefabu): stejné id = stejné nepravidelnosti. */
export const seedOf = (text) => [...String(text)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

/**
 * Mírně posune vrcholy po normále šumem (amp v metrech, freq = vln na metr). Hrany zdvojených vrcholů se posunou
 * stejně (šum je funkce polohy), síť se neroztrhne. Vrací tutéž síť s přepočtenými normálami.
 */
export function jitter(g, amp, freq, seed, mask = null) {
  return deform(g, (p, i) => {
    const n = [g.normals[i * 3], g.normals[i * 3 + 1], g.normals[i * 3 + 2]];
    const k = (mask ? mask(p) : 1) * amp * fbm(p[0] * freq, p[1] * freq, p[2] * freq, seed);
    return [p[0] + n[0] * k, p[1] + n[1] * k, p[2] + n[2] * k];
  });
}

/**
 * Měkký kvádr (polštář, matrace, sedák): plochy rozdělené na mřížku nx × nz (horní a dolní) a nx, nz × ny po
 * stranách, rohy zaoblené poloměrem r, vrch prohnutý (sag, m) k středu, okraje lehce vyduté (puff, m) a pokrčení
 * šumem (wrinkle, m). Prostor jako roundedBox: min, max.
 */
export function softBox(min, max, o = {}) {
  const { r = 0.03, nx = 6, ny = 2, nz = 6, sag = 0, puff = 0, wrinkle = 0, freq = 9, seed = 1 } = o;
  const c = [0, 1, 2].map((k) => (min[k] + max[k]) / 2);
  const h = [0, 1, 2].map((k) => (max[k] - min[k]) / 2);
  const rr = Math.min(r, ...h.map((x) => x * 0.95));
  const g = newGeom();
  const N = [nx, ny, nz];
  // body na ploše krychle −1…1, potom zaoblený kvádr (projekce na vnitřní kvádr + poloměr)
  const place = (q) => {
    const inner = q.map((v, k) => Math.max(-(h[k] - rr), Math.min(h[k] - rr, v * h[k])));
    const d = q.map((v, k) => v * h[k] - inner[k]);
    const l = Math.hypot(...d) || 1;
    return inner.map((v, k) => v + (d[k] / l) * rr);
  };
  for (const [k, sign] of [[0, -1], [0, 1], [1, -1], [1, 1], [2, -1], [2, 1]]) {
    const [u, v] = k === 0 ? [1, 2] : k === 1 ? [2, 0] : [0, 1];
    const ids = [];
    for (let i = 0; i <= N[u]; i++) {
      const row = [];
      for (let j = 0; j <= N[v]; j++) {
        const q = [0, 0, 0];
        q[k] = sign;
        q[u] = -1 + (2 * i) / N[u];
        q[v] = -1 + (2 * j) / N[v];
        row.push(vert(g, place(q), [k === 0 ? sign : 0, k === 1 ? sign : 0, k === 2 ? sign : 0], [i / N[u], j / N[v]]));
      }
      ids.push(row);
    }
    for (let i = 0; i < N[u]; i++) for (let j = 0; j < N[v]; j++) quad(g, ids[i][j], ids[i + 1][j], ids[i + 1][j + 1], ids[i][j + 1]);
  }
  // tvar: propadnutí uprostřed vrchu, vydutí boků, pokrčení; vrcholy na hranách stejné (funkce polohy)
  return weldNormals(deform(g, (p) => {
    const [x, y, z] = p;
    const fx = 1 - (x / h[0]) ** 2;
    const fz = 1 - (z / h[2]) ** 2;
    const top = Math.max(0, y / h[1]);
    const dy = -sag * fx * fz * top + puff * 0.3 * fx * fz * (y / h[1]);
    const side = puff * (1 - (y / h[1]) ** 2);
    const w = wrinkle * fbm(x * freq, y * freq, z * freq, seed);
    const sx = Math.sign(x) * side * fz * 0.6;
    const sz = Math.sign(z) * side * fx * 0.6;
    return [x + c[0] + sx + w * 0.5, y + c[1] + dy + w, z + c[2] + sz + w * 0.5];
  }));
}

/**
 * Hladké normály přes švy: vrcholy se stejnou polohou (zdvojené na hranách ploch) dostanou společnou normálu.
 * Pro měkké tvary (polštář, koruna stromu), kde hrana nemá být ostrá.
 */
export function weldNormals(g) {
  const key = (i) => `${Math.round(g.positions[i * 3] * 1e5)},${Math.round(g.positions[i * 3 + 1] * 1e5)},${Math.round(g.positions[i * 3 + 2] * 1e5)}`;
  const acc = new Map();
  const keys = [];
  for (let i = 0; i < g.positions.length / 3; i++) keys.push(key(i));
  const P = (i) => [g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]];
  for (let t = 0; t < g.indices.length; t += 3) {
    const [a, b, c] = [g.indices[t], g.indices[t + 1], g.indices[t + 2]];
    const [pa, pb, pc] = [P(a), P(b), P(c)];
    const u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
    const v = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const i of [a, b, c]) {
      const s = acc.get(keys[i]) || [0, 0, 0];
      acc.set(keys[i], [s[0] + n[0], s[1] + n[1], s[2] + n[2]]);
    }
  }
  for (let i = 0; i < keys.length; i++) {
    const n = acc.get(keys[i]);
    const l = Math.hypot(...n) || 1;
    g.normals[i * 3] = n[0] / l;
    g.normals[i * 3 + 1] = n[1] / l;
    g.normals[i * 3 + 2] = n[2] / l;
  }
  return g;
}
