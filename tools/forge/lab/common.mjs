// Společné pomůcky sady kit_lab: jednoduchý prefab z dílů (obal kolize se spočítá z dílů), nádoba soustružením,
// kapalina v nádobě, ryska a štítek. Rozměry v metrech, počátek na podlaze nebo na desce stolu ve středu půdorysu,
// přední strana +Z.

import { box, cyl, cbox, node, hinge, slider, definePrefab, partPoints, IO } from '../lib.mjs';
import { lathe, bevelBox } from '../shapes.mjs';

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

/**
 * Přístroj s jedním pohyblivým dílem (víko, dvířka, šuplík, okno): pevné díly na uzlu body, pohyblivé na uzlu
 * m.node v poloze m.at (místní souřadnice pohyblivých dílů). m: { node, at, joint, type: 'hinge'|'slider', axis,
 * max, parts, kind, prompt, note, io }. Kolize: obal pevných dílů a obal pohyblivých dílů na jejich uzlu.
 */
export function moving(id, title, category, parts, m, o = {}) {
  const j = m.type === 'slider' ? slider(m.joint, m.node, m.axis, 0, m.max, { damping: 8, drive: 'manual' }) : hinge(m.joint, m.node, m.axis, 0, m.max, { damping: 4, drive: 'manual' });
  const a = bbox(parts);
  const b = bbox(m.parts);
  return definePrefab(
    {
      id,
      title,
      category,
      nodes: [node('body'), node(m.node, 'body', m.at)],
      joints: [j],
      parts: [...parts, ...m.parts],
      colliders: [cbox('body', a.min, a.max, o.group || 'prop'), cbox(m.node, b.min, b.max, o.group || 'prop')],
      components: { ...KIN, place: o.place || { mount: 'top' }, interact: { kind: m.kind, joint: m.joint, prompt: m.prompt, range: 1.6, manipulate: true } },
      ...(m.kind === 'drawer' ? IO.drawer : IO.door),
      gen: o.gen,
      params: o.params,
    },
    { [m.joint]: m.note },
  );
}

/** Plášť přístroje: kvádr se sraženými hranami, čtyři gumové nožky; vrací díly. */
export function casing(n, w, d, h, mat = 'plastic_white', b = 0.008, y0 = 0.008) {
  const out = [...bevelBox(n, [-w / 2, y0, -d / 2], [w / 2, y0 + h - y0, d / 2], mat, b)];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(box(n, [sx * (w / 2 - 0.03) - 0.012, 0, sz * (d / 2 - 0.03) - 0.012], [sx * (w / 2 - 0.03) + 0.012, y0, sz * (d / 2 - 0.03) + 0.012], 'rubber_black'));
  return out;
}

/** Ovládací panel na čele (z = d/2): displej a řada tlačítek. */
export function panel(n, z, x0, x1, y0, y1, buttons = 3, display = 'emit_display') {
  const out = [box(n, [x0, y0, z - 0.001], [x1, y1, z + 0.002], 'plastic_anthracite'), box(n, [x0 + 0.006, y0 + (y1 - y0) * 0.45, z + 0.002], [x0 + (x1 - x0) * 0.6, y1 - 0.006, z + 0.0035], display)];
  for (let i = 0; i < buttons; i++) {
    const bx = x0 + 0.008 + (i * (x1 - x0 - 0.016)) / Math.max(1, buttons);
    out.push(box(n, [bx, y0 + 0.006, z + 0.002], [bx + 0.012, y0 + 0.014, z + 0.005], i === 0 ? 'cap_green' : 'plastic_light'));
  }
  return out;
}
