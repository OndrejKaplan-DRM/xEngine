// xGen, stavebnice: z čeho se skládá hrubá stavba levelu. Podlaha, strop, zeď s otvory a prahem,
// schodiště, rampa, plošina, sloup, portál. Vstupy v celých centimetrech, výstup kvádry xSpace v metrech.
// Síť a kolizi kvádrů tu nikdo nepočítá: to dělá výhradně src/xspace/geom.js.
//
// Pravidla, která stavebnice drží za volajícího:
//  - zeď vlastní vždy jedna buňka (pole cell); kdo staví sdílenou zeď, rozhoduje volající, ne stavebnice,
//  - pod každým otvorem je práh (jinak je v podlaze díra), nad otvorem překlad,
//  - kusy téže zdi se nepřekrývají (otvory se řadí a ořezávají).

import { Vcm, pad } from './util.js';

/** Osy běhu zdi: 0 = zeď běží podél X (tloušťka v Z), 1 = podél Z (tloušťka v X). */
export const RUN_X = 0;
export const RUN_Z = 1;

/** Sběrač kvádrů s průběžným číslováním id. */
export function createBuilder() {
  const brushes = [];
  let seq = 0;
  return {
    brushes,
    /** Přidá kvádr; nulový nebo záporný rozměr tiše vynechá (ořezané zbytky zdí). */
    add(cell, tag, min, max, mat, extra = {}) {
      if (max[0] - min[0] < 1 || max[1] - min[1] < 1 || max[2] - min[2] < 1) return null;
      const brush = { id: `b_${tag}_${pad(++seq, 4)}`, cell, min: Vcm(...min), max: Vcm(...max), mat, tag, ...extra };
      brushes.push(brush);
      return brush;
    },
  };
}

/** Deska podlahy pod půdorysem buňky; horní plocha ve výšce y. */
export function floorSlab(b, cell, rect, y, mat, T) {
  return b.add(cell, 'floor', [rect.x0, y - T, rect.z0], [rect.x1, y, rect.z1], mat);
}

/** Deska stropu nad půdorysem buňky; spodní plocha ve výšce y. */
export function ceilingSlab(b, cell, rect, y, mat, T) {
  return b.add(cell, 'ceiling', [rect.x0, y, rect.z0], [rect.x1, y + T, rect.z1], mat);
}

const boxOnRun = (run, u, v, b0, b1, y0, y1) => (run === RUN_X ? [[u, y0, b0], [v, y1, b1]] : [[b0, y0, u], [b1, y1, v]]);
const facesOnRun = (run, lo, hi) => {
  const f = {};
  if (lo) f[run === RUN_X ? '-z' : '-x'] = lo;
  if (hi) f[run === RUN_X ? '+z' : '+x'] = hi;
  return Object.keys(f).length ? { faces: f } : {};
};

/**
 * Úsek zdi s otvory. Vyrobí plné kusy mezi otvory, překlad nad každým otvorem a práh pod ním.
 * @param w { cell, run, u, v, b0, b1, y0, y1, mat, faceLo?, faceHi?, sillMat?, openings?: [{ c0, c1, sill, top, window? }] }
 *   u…v rozsah podél zdi, b0…b1 tloušťka, y0…y1 výška; faceLo a faceHi = materiál líce na straně menší a větší souřadnice.
 */
export function wallRun(b, w) {
  const faces = facesOnRun(w.run, w.faceLo, w.faceHi);
  const piece = (u, v, y0, y1, tag, mat, extra) => b.add(w.cell, tag, ...boxOnRun(w.run, u, v, w.b0, w.b1, y0, y1), mat, extra);
  let cur = w.u;
  for (const o of [...(w.openings || [])].sort((p, q) => p.c0 - q.c0)) {
    const c0 = Math.max(o.c0, cur);
    const c1 = Math.min(o.c1, w.v);
    if (c1 <= c0) continue;
    piece(cur, c0, w.y0, w.y1, 'wall', w.mat, faces);
    piece(c0, c1, o.top, w.y1, 'wall', w.mat, faces); // překlad
    // práh; pod oknem (o.window) zeď s lícem místnosti a fasády
    if (o.window) piece(c0, c1, w.y0, o.sill, 'wall', w.mat, faces);
    else piece(c0, c1, w.y0, o.sill, 'floor', w.sillMat || w.mat);
    cur = c1;
  }
  piece(cur, w.v, w.y0, w.y1, 'wall', w.mat, faces);
}

/** Čtyři rohy portálu v rovině uprostřed tloušťky zdi (pořadí jako ve zlatém vzorku). */
export function portalQuad(run, c0, c1, plane, sill, top) {
  return run === RUN_X
    ? [Vcm(c0, sill, plane), Vcm(c1, sill, plane), Vcm(c1, top, plane), Vcm(c0, top, plane)]
    : [Vcm(plane, sill, c0), Vcm(plane, sill, c1), Vcm(plane, top, c1), Vcm(plane, top, c0)];
}

/**
 * Přímé schodiště: stupeň je sloupec od základny po svou výšku (pod schody není dutina), nebo s o.soffit jen deska
 * pod nášlapem (prostor pod ramenem zůstane volný).
 * @param o { cell, run, dir, at, s0, s1, baseY, steps, riser, tread, mat, soffit? }
 *   run = osa chůze (RUN_X nebo RUN_Z), dir = +1 nebo −1 (kam se stoupá), at = hrana prvního stupně,
 *   s0…s1 = šířka napříč. Vrací { end, topY }: kde schody končí a jak vysoko je poslední stupeň.
 */
export function stairs(b, o) {
  for (let i = 1; i <= o.steps; i++) {
    const a = o.at + o.dir * (i - 1) * o.tread;
    const c = o.at + o.dir * i * o.tread;
    const [lo, hi] = a < c ? [a, c] : [c, a];
    // soffit: stupeň jen jako deska tloušťky soffit pod nášlapem (zubaté podhledí, pod rameny je volno), jinak plný sloupec
    const y0 = o.soffit ? Math.max(o.baseY, o.baseY + i * o.riser - o.soffit) : o.baseY;
    const [min, max] = o.run === RUN_X ? [[lo, y0, o.s0], [hi, o.baseY + i * o.riser, o.s1]] : [[o.s0, y0, lo], [o.s1, o.baseY + i * o.riser, hi]];
    b.add(o.cell, 'stair', min, max, o.mat);
  }
  return { end: o.at + o.dir * o.steps * o.tread, topY: o.baseY + o.steps * o.riser };
}

/** Rampa: klín, který stoupá směrem rise ('+x', '-x', '+z', '-z') od y0 do y1 přes celý půdorys rect. */
export function ramp(b, cell, rect, y0, y1, rise, mat) {
  return b.add(cell, 'ramp', [rect.x0, y0, rect.z0], [rect.x1, y1, rect.z1], mat, { shape: 'wedge', rise });
}

/** Plný blok (plošina, podesta, galerie, sokl). */
export function block(b, cell, rect, y0, y1, mat, tag = 'platform') {
  return b.add(cell, tag, [rect.x0, y0, rect.z0], [rect.x1, y1, rect.z1], mat);
}

/** Sloup čtvercového průřezu se středem v [x, z]. */
export function pillar(b, cell, x, z, size, y0, y1, mat) {
  const h = size / 2;
  return b.add(cell, 'pillar', [x - h, y0, z - h], [x + h, y1, z + h], mat);
}

/**
 * Samostatná místnost (nebo chodba: je to jen úzká místnost): podlaha, strop a čtyři zdi s otvory.
 * Zdi podél X (strany '-z' a '+z') zabírají i rohy, zdi podél Z jen délku místnosti, takže se v rozích nepřekryjí.
 * Stranu, kterou staví soused, vypni (walls['+x'] = false): zeď patří právě jedné buňce.
 * @param o { cell, rect: { x0, x1, z0, z1 }, y0, y1, T, mats: { floor, wall, ceiling, face? }, walls?: { '-x'|'+x'|'-z'|'+z': false | { openings } } }
 * @returns {{ side: string, quad: number[][], opening: object }[]} portály otvorů (id, buňky a dveře doplní volající)
 */
export function room(b, o) {
  const { cell, rect, y0, y1, T, mats } = o;
  const walls = o.walls || {};
  floorSlab(b, cell, rect, y0, mats.floor, T);
  ceilingSlab(b, cell, rect, y1, mats.ceiling, T);
  const quads = [];
  const sides = [
    ['-z', RUN_X, rect.x0 - T, rect.x1 + T, rect.z0 - T, rect.z0, true],
    ['+z', RUN_X, rect.x0 - T, rect.x1 + T, rect.z1, rect.z1 + T, false],
    ['-x', RUN_Z, rect.z0, rect.z1, rect.x0 - T, rect.x0, true],
    ['+x', RUN_Z, rect.z0, rect.z1, rect.x1, rect.x1 + T, false],
  ];
  for (const [side, run, u, v, b0, b1, roomIsHi] of sides) {
    if (walls[side] === false) continue;
    const openings = (walls[side] && walls[side].openings) || [];
    wallRun(b, { cell, run, u, v, b0, b1, y0: y0 - T, y1: y1 + T, mat: mats.wall, sillMat: mats.floor, [roomIsHi ? 'faceHi' : 'faceLo']: mats.face, openings });
    for (const op of openings) quads.push({ side, opening: op, quad: portalQuad(run, op.c0, op.c1, (b0 + b1) / 2, op.sill, op.top) });
  }
  return quads;
}
