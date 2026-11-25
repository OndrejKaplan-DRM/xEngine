// Sada kit_lab a kit_it: stavebnice spotřebičů a nábytku z hladkých sítí (Ondřej 25. 11. 2026 v 1:29: „přístroje
// a nábytek kus po kuse“). Plášť se zaoblenými hranami, dvířka o kousek před pláštěm se spárou a těsněním, madla
// s držáky, větrací mřížky, displej v rámečku, panty, zámek, nožky a kolečka. Každá pomůcka vrací díly prefabu
// (díl mesh do souboru appl.glb); jméno uzlu sítě začíná klíčem prefabu, takže se nic nesrazí.
// Rozměry v metrech, přední strana +Z, počátek uprostřed půdorysu na podlaze (nebo na desce stolu).

import { meshPart } from '../mesh/registry.mjs';
import { roundedBox, flatBox, slab, tube, cylinder, torus } from '../mesh/solids.mjs';
import { lathe } from '../mesh/lathe.mjs';
import { merge, moved, mTranslate, mRotate, at } from '../mesh/geo.mjs';

let FILE = 'appl';
/** Soubor .glb pro další díly (kit_it má vlastní balík, sítě se mezi balíky nesdílí). */
export const useFile = (f) => {
  FILE = f;
};
export const A = (n, name, geom, mat) => meshPart(n, FILE, name, geom, mat);
const T = (g, x, y, z) => moved(g, mTranslate(x, y, z));
/** Díl ležící na čele (rovina XY v z): sítě stavěné ve vodorovné rovině se otočí o −90° kolem X (y → z). */
const faceUp = (g, z) => moved(g, at(mTranslate(0, 0, z), mRotate('x', 90)));

/** Plášť: zaoblený kvádr (poloměr r, s úseků; 1 = sražení s hladkou normálou). */
export const shell = (n, key, min, max, mat, r = 0.01, s = 1) => A(n, `${key}_shell`, roundedBox(min, max, r, s), mat);

/**
 * Dvířka nebo čelo: deska x0–x1, y0–y1 od z0 do z0 + t se zaoblenými hranami. o.gasket = těsnění (pryž) po obvodu
 * za deskou, o.window = [mx, my] okraj okna (sklo s rámečkem), o.mat, o.glass.
 */
export function door(n, key, x0, x1, y0, y1, z0, t, o = {}) {
  const mat = o.mat || 'plastic_white';
  const out = [];
  if (o.window) {
    const [mx, my] = o.window;
    // svislé vlysy zaoblené, vodorovné rovné (zaoblení příčlí mezi vlysy by nebylo vidět)
    const fr = merge([
      roundedBox([x0, y0, z0], [x0 + mx, y1, z0 + t], o.r ?? 0.006, 1),
      roundedBox([x1 - mx, y0, z0], [x1, y1, z0 + t], o.r ?? 0.006, 1),
      flatBox([x0 + mx - 0.001, y0, z0 + 0.001], [x1 - mx + 0.001, y0 + my, z0 + t - 0.001]),
      flatBox([x0 + mx - 0.001, y1 - my, z0 + 0.001], [x1 - mx + 0.001, y1, z0 + t - 0.001]),
    ]);
    out.push(A(n, `${key}_frame`, fr, mat), A(n, `${key}_pane`, flatBox([x0 + mx - 0.002, y0 + my - 0.002, z0 + t * 0.4], [x1 - mx + 0.002, y1 - my + 0.002, z0 + t * 0.4 + 0.004]), o.glass || 'glass_tinted'));
  } else out.push(A(n, `${key}_leaf`, roundedBox([x0, y0, z0], [x1, y1, z0 + t], o.r ?? 0.008, 1), mat));
  if (o.gasket) {
    const g = 0.012;
    out.push(A(n, `${key}_gasket`, merge([flatBox([x0 + 0.01, y0 + 0.01, z0 - 0.006], [x1 - 0.01, y0 + 0.01 + g, z0]), flatBox([x0 + 0.01, y1 - 0.01 - g, z0 - 0.006], [x1 - 0.01, y1 - 0.01, z0]), flatBox([x0 + 0.01, y0 + 0.01, z0 - 0.006], [x0 + 0.01 + g, y1 - 0.01, z0]), flatBox([x1 - 0.01 - g, y0 + 0.01, z0 - 0.006], [x1 - 0.01, y1 - 0.01, z0])]), 'rubber_black'));
  }
  return out;
}

/** Svislé madlo (tyč s dvěma držáky) na čele v z, od y0 do y1 v x. o.rad, o.off (odstup od čela), o.mat. */
export function barHandle(n, key, x, y0, y1, z, o = {}) {
  const rad = o.rad ?? 0.0085;
  const off = o.off ?? 0.035;
  const g = tube([[x, y0, z], [x, y0, z + off], [x, y1, z + off], [x, y1, z]], rad, o.seg ?? 6, { bend: off * 0.6, bendSeg: 2 });
  return A(n, `${key}_handle`, g, o.mat || 'steel_brushed');
}

/** Vodorovné madlo (tyč s držáky) od x0 do x1 ve výšce y. */
export function rail(n, key, x0, x1, y, z, o = {}) {
  const rad = o.rad ?? 0.007;
  const off = o.off ?? 0.03;
  return A(n, `${key}_rail`, tube([[x0, y, z], [x0, y, z + off], [x1, y, z + off], [x1, y, z]], rad, o.seg ?? 8, { bend: off * 0.6, bendSeg: 3 }), o.mat || 'steel_brushed');
}

/** Zapuštěná úchytka (lišta) na horní hraně čela: tmavá drážka a hliníkový profil. */
export const gripEdge = (n, key, x0, x1, y, z) => A(n, `${key}_grip`, merge([roundedBox([x0, y - 0.025, z], [x1, y, z + 0.012], 0.004, 1)]), 'aluminium');

/** Větrací mřížka: tmavé pozadí a vodorovné lamely (count) na čele v z. */
export function grille(n, key, x0, x1, y0, y1, z, count = 8, o = {}) {
  const back = flatBox([x0, y0, z - 0.004], [x1, y1, z - 0.001]);
  const slats = [];
  const h = (y1 - y0) / count;
  for (let i = 0; i < count; i++) slats.push(flatBox([x0 + 0.003, y0 + i * h + h * 0.35, z - 0.004], [x1 - 0.003, y0 + i * h + h * 0.75, z + 0.002]));
  return [A(n, `${key}_vent`, back, o.back || 'plastic_black'), A(n, `${key}_slats`, merge(slats), o.mat || 'plastic_anthracite')];
}

/** Displej v rámečku na čele (z) s tlačítky pod ním (buttons) a kontrolkou. */
export function screen(n, key, x0, x1, y0, y1, z, o = {}) {
  const bez = roundedBox([x0, y0, z - 0.002], [x1, y1, z + 0.004], 0.004, 1);
  const out = [A(n, `${key}_bezel`, bez, o.bezel || 'plastic_anthracite'), A(n, `${key}_lcd`, flatBox([x0 + 0.006, y0 + (y1 - y0) * (o.buttons ? 0.38 : 0.12), z + 0.004], [x1 - 0.006, y1 - 0.006, z + 0.0048]), o.display || 'emit_display')];
  if (o.buttons) {
    const bs = [];
    const r = Math.min(0.006, (y1 - y0) * 0.12);
    for (let i = 0; i < o.buttons; i++) {
      const bx = x0 + 0.012 + ((x1 - x0 - 0.024) * (i + 0.5)) / o.buttons;
      bs.push(moved(cylinder(r, 0, 0.003, { seg: 6 }), at(mTranslate(bx, y0 + (y1 - y0) * 0.19, z + 0.004), mRotate('x', 90))));
    }
    out.push(A(n, `${key}_keys`, merge(bs), o.keys || 'plastic_light'));
  }
  if (o.led) out.push(A(n, `${key}_led`, moved(cylinder(0.003, 0, 0.002, { seg: 6 }), at(mTranslate(x1 - 0.01, y0 + (y1 - y0) * 0.19, z + 0.004), mRotate('x', 90))), o.led));
  return out;
}

/** Otočný knoflík na čele (z) v bodě [x, y], poloměr r. */
export const knob = (n, key, x, y, z, r = 0.014, mat = 'plastic_black') => A(n, `${key}_knob`, moved(cylinder(r, 0, r * 1.1, { edge: r * 0.25, n: 2, seg: 12 }), at(mTranslate(x, y, z), mRotate('x', 90))), mat);

/** Panty: válečky na hraně x ve výškách ys (na čele z). */
export function hinges(n, key, x, ys, z, mat = 'steel_brushed') {
  return A(n, `${key}_hinges`, merge(ys.map((y) => T(cylinder(0.008, -0.04, 0.04, { seg: 6 }), x, y, z))), mat);
}

/** Zámek (váleček s klíčovou dírkou) na čele. */
export const lock = (n, key, x, y, z) => [A(n, `${key}_lock`, moved(cylinder(0.009, 0, 0.006, { seg: 8 }), at(mTranslate(x, y, z), mRotate('x', 90))), 'steel_chrome'), A(n, `${key}_keyhole`, flatBox([x - 0.0012, y - 0.004, z + 0.006], [x + 0.0012, y + 0.004, z + 0.0065]), 'plastic_black')];

/** Stavitelné nožky (4) pod spotřebičem w × d ve výšce h od podlahy. */
export function feet(n, key, w, d, h = 0.03, inset = 0.05) {
  const g = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.push(T(lathe([[0.022, 0], [0.022, 0.008, 'c'], [0.009, 0.012, 'c'], [0.009, h]], { seg: 6 }), sx * (w / 2 - inset), 0, sz * (d / 2 - inset)));
  return A(n, `${key}_feet`, merge(g), 'plastic_black');
}

/** Otočná kolečka (4): vidlice, kolo a ložisko; výška h; o.brake = brzda vpředu. */
export function casters(n, key, w, d, h = 0.1, inset = 0.06) {
  const r = h * 0.38;
  const wheels = [];
  const forks = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * (w / 2 - inset);
      const z = sz * (d / 2 - inset);
      wheels.push(T(moved(torus(r * 0.62, r * 0.38, 0, { seg: 12, n: 6 }), mRotate('z', 90)), x, r, z + r * 0.35));
      forks.push(T(roundedBox([-0.018, r, -0.02], [0.018, h - 0.012, 0.02], 0.005, 1), x, 0, z + r * 0.2), T(cylinder(0.024, h - 0.012, h, { seg: 10 }), x, 0, z));
    }
  }
  return [A(n, `${key}_wheels`, merge(wheels), 'rubber_black'), A(n, `${key}_forks`, merge(forks), 'steel_brushed')];
}

/** Sokl: tmavá zapuštěná lišta pod skříní (w × d), výška h, zapuštění inset vpředu. */
export const plinth = (n, key, w, d, h, inset = 0.05, mat = 'plastic_anthracite') => A(n, `${key}_plinth`, flatBox([-w / 2 + 0.01, 0, -d / 2 + 0.02], [w / 2 - 0.01, h, d / 2 - inset]), mat);

/** Polička nebo rošt uvnitř skříně: drátěný rošt (rám a podélné dráty jako tenké hranolky, z dálky vypadají jako drát). */
export function wireShelf(n, key, x0, x1, z0, z1, y, mat = 'steel_chrome') {
  const t = 0.003;
  const g = [flatBox([x0, y - t, z0], [x1, y + t, z0 + 2 * t]), flatBox([x0, y - t, z1 - 2 * t], [x1, y + t, z1]), flatBox([x0, y - t, z0], [x0 + 2 * t, y + t, z1]), flatBox([x1 - 2 * t, y - t, z0], [x1, y + t, z1])];
  const k = Math.max(3, Math.round((x1 - x0) / 0.06));
  for (let i = 1; i < k; i++) g.push(flatBox([x0 + ((x1 - x0) * i) / k - 0.0015, y - 0.0015, z0], [x0 + ((x1 - x0) * i) / k + 0.0015, y + 0.0015, z1]));
  return A(n, `${key}_wire_${Math.round(y * 1000)}`, merge(g), mat);
}

/** Štítek nebo samolepka na čele (obdélník lehce nad plochou). */
export const sticker = (n, key, x0, x1, y0, y1, z, mat = 'label_paper') => A(n, `${key}_sticker_${Math.round(x0 * 1000)}_${Math.round(y0 * 1000)}`, flatBox([x0, y0, z], [x1, y1, z + 0.0006]), mat);

/** Deska stolu: slab se zaoblenými rohy a sraženou hranou. */
export const top = (n, key, cx, cz, w, d, y0, y1, mat, rc = 0.006) => A(n, `${key}_top`, slab(cx, cz, w, d, y0, y1, rc, 2, Math.min(0.003, (y1 - y0) * 0.25)), mat);

/** Kabel nebo hadice po dráze (body), poloměr rad. */
export const cable = (n, key, path, rad = 0.004, mat = 'plastic_black', bend = 0.04) => A(n, `${key}_cable`, tube(path, rad, 6, { bend, bendSeg: 3 }), mat);

/** Rovná trubka (noha, tyč) z a do b, poloměr rad, seg stěn. */
export const rod = (a, b, rad, seg = 8) => tube([a, b], rad, seg);

export { merge, T, faceUp, roundedBox, flatBox, slab, tube, cylinder, torus, lathe, moved, mTranslate, mRotate, at };
