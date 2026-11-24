// Společné pomůcky sady kit_lab: jednoduchý prefab z dílů (obal kolize se spočítá z dílů), nádoba soustružením,
// kapalina v nádobě, ryska a štítek. Rozměry v metrech, počátek na podlaze nebo na desce stolu ve středu půdorysu,
// přední strana +Z.

import { box, cyl, cbox, node, definePrefab, partPoints } from '../lib.mjs';
import { lathe } from '../shapes.mjs';

export const STATIC_TOP = { physics: { body: 'static' }, place: { mount: 'top' } };
export const staticFloor = (top) => ({ physics: { body: 'static' }, place: top ? { mount: 'floor', top } : { mount: 'floor' } });
export const KIN = { physics: { body: 'kinematic' } };

/** Obal dílů (metry, zaokrouhleno na milimetry ven). */
export function bbox(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    for (const q of partPoints(p)) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], q[k]);
        max[k] = Math.max(max[k], q[k]);
      }
    }
  }
  return { min: min.map((v) => Math.floor(v * 1000) / 1000), max: max.map((v) => Math.ceil(v * 1000) / 1000) };
}

/**
 * Prefab bez kloubu: všechny díly na uzlu body, kolize = obal dílů (skupina prop, malé věci na stole).
 * o: { components, group, params, colliders, gen }
 */
export function simple(id, title, category, parts, o = {}) {
  const b = bbox(parts);
  return definePrefab({
    id,
    title,
    category,
    nodes: [node('body')],
    parts,
    colliders: o.colliders || [cbox('body', b.min, b.max, o.group || 'prop')],
    components: o.components || STATIC_TOP,
    gen: o.gen,
    params: o.params,
  });
}

/** Ryska na lícové straně válcové nádoby (poloměr r, výška y, šířka w). */
export const mark = (n, r, y, w = 0.008, mat = 'plastic_white') => box(n, [-w, y, r - 0.0005], [0, y + 0.0012, r + 0.0007], mat);

/** Štítek na lícové straně válcové nádoby: papír a barevný pruh nahoře. */
export function label(n, r, y0, y1, w, band) {
  const out = [box(n, [-w / 2, y0, r - 0.001], [w / 2, y1, r + 0.0008], 'label_paper')];
  if (band) out.push(box(n, [-w / 2, y1 - (y1 - y0) * 0.22, r + 0.0006], [w / 2, y1, r + 0.0018], band));
  return out;
}

/**
 * Soustružená nádoba z profilu [y, r] (zdola nahoru) a kapalina do výšky fill (podíl výšky profilu), o 2 mm uvnitř stěny.
 * Kapalina je jen tam, kde profil sahá pod hladinu; nad hladinou nic.
 */
export function vessel(n, profile, mat, fill = 0, liquid = null) {
  const out = lathe(n, 0, 0, profile, mat);
  if (fill > 0 && liquid) {
    const y0 = profile[0][0];
    const top = y0 + (profile[profile.length - 1][0] - y0) * fill;
    const inner = [];
    for (let i = 0; i < profile.length; i++) {
      const [y, r] = profile[i];
      if (y >= top) {
        const [py, pr] = profile[i - 1];
        inner.push([top, Math.max(0.001, pr + ((r - pr) * (top - py)) / (y - py || 1) - 0.002)]);
        break;
      }
      inner.push([Math.max(y, y0 + 0.002), Math.max(0.001, r - 0.002)]);
    }
    out.push(...lathe(n, 0, 0, inner, liquid));
  }
  return out;
}

/** Okraj hrdla: krátký válec o 1,5 mm širší (sklo), výška 3 mm. */
export const rim = (n, y, r, mat = 'glass_lab') => cyl(n, [0, y - 0.0015, 0], r + 0.0015, 0.003, 'y', mat);
