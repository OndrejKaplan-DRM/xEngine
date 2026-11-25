// xGen, venek domu (předvolba house, Ondřej 25. 11. 2026 v 17:00): okna ve zdech do nádvoří a průchody mezi
// buňkami nádvoří. Okno průhledné = otvor ve zdi, portál jen pro pohled (passable: false, N-003) a okno v otvoru;
// okno matné = otvor bez portálu, který kryjí dvě poloviny okna (vnitřní patří místnosti, vnější nádvoří: každá buňka
// kreslí svou). Nádvoří se mezi sebou dotýkají bez zdi; portál leží na společné stěně přes celou výšku.

import { portalQuad, RUN_X } from './kit.js';
import { Vcm, V } from './util.js';
import { boxM } from './build.js';

const runBox = (run, a0, a1, n0, n1, y0, y1, kind) => (run === RUN_X ? boxM(a0, y0, n0, a1, y1, n1, kind) : boxM(n0, y0, a0, n1, y1, a1, kind));

/** Otvory oken podle úseku zdi (pro wallRun). */
export function windowOpenings(plan) {
  const bySeg = new Map();
  for (const w of plan.windows || []) bySeg.set(w.seg, [...(bySeg.get(w.seg) || []), { c0: w.c0, c1: w.c1, sill: w.sill, top: w.top }]);
  return bySeg;
}

/**
 * Okna: portály (průhledná), entity oken, volné zóny před oknem v místnosti (nábytek nezakryje okno nad parapetem)
 * a záznam S.windows pro rozmisťování (radiátor pod oknem). Prefaby podle šířky: window_home_<cm>_01,
 * window_frosted_in_<cm>_01 a window_frosted_out_<cm>_01.
 */
export function buildWindows(S, plan, catalog) {
  S.windows = [];
  let n = 0;
  for (const w of plan.windows || []) {
    const s = plan.segments[w.seg];
    const X = plan.cells[w.house];
    const inA = s.A === w.house;
    const [face, nrm] = inA ? [s.b0, -1] : [s.b1, 1];
    const plane = (s.b0 + s.b1) / 2;
    const along = (w.c0 + w.c1) / 2;
    const pos = s.run === RUN_X ? Vcm(along, w.sill, plane) : Vcm(plane, w.sill, along);
    // +Z prefabu do místnosti
    const ry = inA ? (s.run === RUN_X ? 180 : -90) : s.run === RUN_X ? 0 : 90;
    const ids = { house: S.meta[w.house].id, yard: S.meta[w.yard].id };
    const put = (prefab, cell) => {
      if (!catalog.has(prefab)) return null;
      const e = { id: S.eid('window'), prefab, cell, pos, rot: V(0, ry, 0) };
      S.entities.push(e);
      return e;
    };
    if (w.kind === 'clear') {
      put(`window_home_${w.w}_01`, ids.house);
      S.portals.push({ id: `p_w${String(++n).padStart(2, '0')}`, a: S.meta[s.A].id, b: S.meta[s.B].id, quad: portalQuad(s.run, w.c0, w.c1, plane, w.sill, w.top), passable: false });
    } else {
      put(`window_frosted_in_${w.w}_01`, ids.house);
      put(`window_frosted_out_${w.w}_01`, ids.yard);
    }
    S.zones[w.house].push(runBox(s.run, w.c0 - 10, w.c1 + 10, face, face + nrm * 35, w.sill - 2, w.top, 'zone'));
    S.windows.push({ cell: w.house, run: s.run, face, n: nrm, c0: w.c0, c1: w.c1, sill: w.sill, top: w.top, y0: X.y0 });
    // přízemní okno z nádvoří: před ním nic vysokého (strom, plot)
    const Y = plan.cells[w.yard];
    if (w.sill - Y.y0 < 250) S.zones[w.yard].push(runBox(s.run, w.c0 - 20, w.c1 + 20, inA ? s.b1 : s.b0, (inA ? s.b1 : s.b0) + (inA ? 1 : -1) * 80, Y.y0, w.top, 'zone'));
  }
}

/** Portály mezi buňkami nádvoří (hrany plánu s virtual: true): společná stěna přes celou výšku, volno před ní. */
export function yardPortals(S, plan) {
  let n = 0;
  for (const e of plan.edges.filter((x) => x.virtual)) {
    const [A, B] = [plan.cells[e.a], plan.cells[e.b]];
    for (const k of [0, 1]) {
      const ax = 1 - k;
      const plane = A.max[k] === B.min[k] ? A.max[k] : B.max[k] === A.min[k] ? B.max[k] : null;
      if (plane === null) continue;
      const c0 = Math.max(A.min[ax], B.min[ax]);
      const c1 = Math.min(A.max[ax], B.max[ax]);
      if (c1 - c0 < 100) continue;
      const run = k === 0 ? 1 : 0; // stěna kolmá na osu k běží podél druhé osy
      const y0 = Math.max(A.y0, B.y0);
      const y1 = Math.min(A.y1, B.y1);
      S.portals.push({ id: `p_y${String(++n).padStart(2, '0')}`, a: S.meta[A.i].id, b: S.meta[B.i].id, quad: portalQuad(run, c0, c1, plane, y0, y1) });
      const o = { doorIds: [], A, B, virtual: true };
      for (const X of [A, B]) {
        const dir = X.min[k] === plane ? 1 : -1;
        S.zones[X.i].push(runBox(run, c0, c1, plane, plane + dir * 150, y0, y0 + 220, 'zone'));
        // strana buňky jako u otvoru: rozmisťování drží mezi průchody cestu pro hráče
        S.sides[X.i].push({ run, face: plane, n: dir, c0, c1, sill: y0, top: y0 + 220, o });
      }
    }
  }
}
