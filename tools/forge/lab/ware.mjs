// Sada kit_lab: stavebnice plastových a obalových věcí z hladkých sítí (lahve, dózy, víčka s vroubkováním,
// zkumavky s kuželovým dnem, kanystry, krabice se zaoblenými hranami, štítky po obvodu). Neprůhledné obaly mají
// jen vnější plochu (vnitřek není vidět); průsvitný polypropylen má i kapalinu uvnitř.

import { lathe, arc, rounded } from '../mesh/lathe.mjs';
import { deform, merge, moved, mTranslate, mRotate, at } from '../mesh/geo.mjs';
import { roundedBox, slab, tube } from '../mesh/solids.mjs';
import { meshPart } from '../mesh/registry.mjs';
import { FRONT } from './glassware.mjs';

export { FRONT };
/** Díl sítě do souboru meshes/<file>.glb, uzel <key>_<role>. */
export const P = (file) => (key, role, geom, mat) => meshPart('body', file, `${key}_${role}`, geom, mat);
export const T = (g, x, y, z) => moved(g, mTranslate(x, y, z));
export const R = (g, axis, deg) => moved(g, mRotate(axis, deg));
export { merge, moved, at, mTranslate, mRotate, roundedBox, slab, tube, lathe, arc };

/**
 * Šroubovací víčko: poloměr r, od y0 výšky h, zaoblená hrana nahoře; ridges vroubků po obvodu (0 = hladké).
 * Vnitřek se nekreslí (spodní mezikruží k hrdlu ano).
 */
export function screwCap(r, y0, h, ridges = 12, inner = r * 0.8, segs = null) {
  const e = Math.min(h * 0.3, r * 0.25);
  const seg = segs ?? Math.max(8, ridges ? ridges * 2 : 12);
  const g = lathe([[inner, y0], [r, y0, 'c'], ...arc(r - e, y0 + h - e, e, 0, 90, 2), [0, y0 + h]], { seg });
  if (!ridges) return g;
  return deform(g, ([x, y, z]) => {
    const rr = Math.hypot(x, z);
    if (rr < r - e * 0.6 || y > y0 + h - e * 0.8 || y < y0 + 1e-6) return [x, y, z];
    const s = 1 + 0.016 * Math.cos(Math.atan2(-z, x) * ridges);
    return [x * s, y, z * s];
  });
}

/** Plný rotační obal (lahev, dóza) z vnějšího profilu od středu dna po střed vršku hrdla; body [r, y, zaoblení?]. */
export const solid = (profile, seg, n = 2) => lathe(rounded(profile, n), { seg });

/** Štítek po obvodu válce (poloměr r) od y0 do y1, šířka span° vpředu; band = barevný pruh nahoře (podíl výšky). */
export function wrapLabel(r, y0, y1, span = 110, seg = 8) {
  return lathe([[r, y0], [r, y1]], { a0: FRONT - span / 2, a1: FRONT + span / 2, seg });
}

/**
 * Zkumavka s kuželovým dnem (15 a 50 ml, mikrozkumavka) jednou plochou: poloměr r, délka L, kužel délky tip.
 * Otevřená nahoře (víčko ji zakryje), stěna oboustranná materiálem plastic_pp.
 */
export const conicalTube = (r, L, tip, seg = 10) => lathe([[0.0012, 0], [r, tip, 'c'], [r, L - 0.001], [r * 1.06, L]], { seg });
/** Kapalina v kuželové zkumavce do výšky y. */
export const conicalLiquid = (r, y, tip, seg = 10) => lathe([[0, 0.0015], [Math.min(r * 0.9, (r * 0.9 * y) / tip), Math.min(y, tip), 'c'], ...(y > tip ? [[r * 0.9, y]] : []), [0, y]], { seg });

/** Krabice s mírně zaoblenými hranami (karton, polystyren, plast): obal min–max, poloměr hran r. */
export const crate = (min, max, r = 0.004, s = 1) => roundedBox(min, max, r, s);

/** Rukojeť kanystru: trubka po oblouku nad bodem (x0..x1 v ose X, výška y, z = 0). */
export const handle = (x0, x1, y, h, rad = 0.008, seg = 8) => tube([[x0, y - 0.004, 0], [x0, y + h, 0], [x1, y + h, 0], [x1, y - 0.004, 0]], rad, seg, { bend: h * 0.5, bendSeg: 3 });
