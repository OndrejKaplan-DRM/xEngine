// xForge: bohatší tvary z dílů, které formát verze 1 a kontrakt vzorků světla (D-041) unesou: box a cyl na uzlech
// kostry. Sražené hrany, prkna s mezerami, rámy s vpadlou výplní, římsy, soustružené profily, duté krabice
// s přihrádkami a drobné nepravidelnosti. Hladké sítě .glb přijdou se zkouškou B2.5 (D-030).
// Délky v metrech, díly přes box/boxc/cyl z lib.mjs (zaokrouhlení na desetiny milimetru).

import { box, boxc, cyl } from './lib.mjs';

/** Opakovatelná náhoda podle textu (id prefabu): rnd(a) vrací číslo z (−a, a). */
export function noise(seedText) {
  let h = 2166136261;
  for (const ch of seedText) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return (amp = 1) => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 * amp - amp;
  };
}

/**
 * Kvádr se sraženými hranami: tři překryté kvádry, každý drží jednu dvojici stěn. Na hraně vznikne stupínek b,
 * který na světle čte jako sražení. 36 △ místo 12.
 */
export function bevelBox(n, min, max, mat, b = 0.006) {
  return [
    box(n, [min[0], min[1] + b, min[2] + b], [max[0], max[1] - b, max[2] - b], mat),
    box(n, [min[0] + b, min[1], min[2] + b], [max[0] - b, max[1], max[2] - b], mat),
    box(n, [min[0] + b, min[1] + b, min[2]], [max[0] - b, max[1] - b, max[2]], mat),
  ];
}

/**
 * Prkna vedle sebe na obdélníku min…max. along: osa, podél které prkna leží vedle sebe (0 = x, 1 = y, 2 = z).
 * Mezi prkny mezera gap (škvíra), každé prkno má drobně jinou tloušťku a délku (rnd); mats střídá materiály.
 */
export function planks(n, min, max, along, count, gap, mats, rnd, o = {}) {
  const thick = [0, 1, 2].find((k) => k !== along && max[k] - min[k] === Math.min(...[0, 1, 2].filter((q) => q !== along).map((q) => max[q] - min[q])));
  const len = [0, 1, 2].find((k) => k !== along && k !== thick);
  const span = max[along] - min[along];
  const w = (span - gap * (count - 1)) / count;
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = [...min];
    const b = [...max];
    a[along] = min[along] + i * (w + gap);
    b[along] = a[along] + w;
    const out1 = o.out ?? 1; // na kterou stranu tloušťky prkno vystupuje (+1 k max, −1 k min)
    const dt = Math.abs(rnd(o.thickJitter ?? 0.002));
    if (out1 > 0) b[thick] += dt;
    else a[thick] -= dt;
    a[len] += Math.abs(rnd(o.lenJitter ?? 0.003));
    b[len] -= Math.abs(rnd(o.lenJitter ?? 0.003));
    out.push(box(n, a, b, mats[i % mats.length]));
  }
  return out;
}

/**
 * Rám s vpadlou výplní na čelní ploše z = zFront (líc +Z): čtyři vlysy šířky rail v plné tloušťce a výplň
 * o recess zapuštěná, s lištou (sražením) šířky lip kolem výplně. Dveře, dvířka, čela šuplíků, sokly.
 */
export function framedPanel(n, x0, x1, y0, y1, zBack, zFront, rail, recess, mat, panelMat = mat, lip = 0.008) {
  const zp = zFront - recess;
  return [
    box(n, [x0, y0, zBack], [x0 + rail, y1, zFront], mat),
    box(n, [x1 - rail, y0, zBack], [x1, y1, zFront], mat),
    box(n, [x0 + rail, y0, zBack], [x1 - rail, y0 + rail, zFront], mat),
    box(n, [x0 + rail, y1 - rail, zBack], [x1 - rail, y1, zFront], mat),
    box(n, [x0 + rail, y0 + rail, zBack], [x1 - rail, y1 - rail, zp], panelMat),
    // lišta kolem výplně: o polovinu zapuštění níž než rám, dává dvojitý stupeň (profil)
    box(n, [x0 + rail, y0 + rail, zp], [x1 - rail, y0 + rail + lip, zp + recess / 2], mat),
    box(n, [x0 + rail, y1 - rail - lip, zp], [x1 - rail, y1 - rail, zp + recess / 2], mat),
    box(n, [x0 + rail, y0 + rail + lip, zp], [x0 + rail + lip, y1 - rail - lip, zp + recess / 2], mat),
    box(n, [x1 - rail - lip, y0 + rail + lip, zp], [x1 - rail, y1 - rail - lip, zp + recess / 2], mat),
  ];
}

/**
 * Římsa nebo sokl: vrstvy nad sebou od y nahoru (dy > 0) nebo dolů, každá vrstva [výška, přesah]. Přesah jde
 * dopředu a do stran, zadní hrana zůstává v z0 (u zdi). Vrací díly a y, kde římsa končí.
 */
export function cornice(n, x0, x1, z0, z1, y, layers, mat, dir = 1) {
  const out = [];
  let at = y;
  for (const [h, over] of layers) {
    const y0 = dir > 0 ? at : at - h;
    out.push(box(n, [x0 - over, y0, z0], [x1 + over, y0 + h, z1 + over], mat));
    at += dir * h;
  }
  return { parts: out, end: at };
}

/** Soustružený profil: body [y, r] zdola nahoru; mezi sousedními body válec s průměrným poloměrem (osa Y). */
export function lathe(n, cx, cz, profile, mat) {
  const out = [];
  for (let i = 0; i + 1 < profile.length; i++) {
    const [y0, r0] = profile[i];
    const [y1, r1] = profile[i + 1];
    out.push(cyl(n, [cx, (y0 + y1) / 2, cz], (r0 + r1) / 2, y1 - y0, 'y', mat));
  }
  return out;
}

/**
 * Dutá krabice bez víka (šuplík, korpus, přihrádka): dno a čtyři stěny tloušťky t. Příčky (vnitřní členění)
 * napříč v x (divX) a v z (divZ) jako pole poloh, výška příček o hDiv nižší než stěny. frontMat: materiál
 * přední stěny (u šuplíku ji kryje čelo, tak bývá jiná). Vrací díly.
 */
export function tray(n, min, max, t, mat, o = {}) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  const out = [
    box(n, [x0, y0, z0], [x1, y0 + t, z1], o.bottomMat ?? mat),
    box(n, [x0, y0 + t, z0], [x0 + t, y1, z1], mat),
    box(n, [x1 - t, y0 + t, z0], [x1, y1, z1], mat),
    box(n, [x0 + t, y0 + t, z0], [x1 - t, y1, z0 + t], mat),
    box(n, [x0 + t, y0 + t, z1 - t], [x1 - t, y1, z1], o.frontMat ?? mat),
  ];
  const yd = y1 - (o.hDiv ?? 0.02);
  for (const x of o.divX ?? []) out.push(box(n, [x - t / 2, y0 + t, z0 + t], [x + t / 2, yd, z1 - t], o.divMat ?? mat));
  for (const z of o.divZ ?? []) out.push(box(n, [x0 + t, y0 + t, z - t / 2], [x1 - t, yd, z + t / 2], o.divMat ?? mat));
  return out;
}

/** Madlo: dvě nožky a příčka na čelní ploše z (líc +Z), střed cx, cy, šířka w. */
export function handle(n, cx, cy, z, w, mat, depth = 0.025) {
  const s = 0.012;
  return [
    boxc(n, [cx - w / 2 + s / 2, cy, z + depth / 2], [s, s, depth], mat),
    boxc(n, [cx + w / 2 - s / 2, cy, z + depth / 2], [s, s, depth], mat),
    boxc(n, [cx, cy, z + depth - s / 2], [w, s, s], mat),
  ];
}
