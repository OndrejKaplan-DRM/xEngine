// xWorld: zkouška viditelnosti proti prokazatelné viditelnosti (N-014, D-057). Kreslení nemění, jen měří:
// - horní mez: buňky, které se kreslí, ⊆ levelPVS(level).get(buňka kamery) (víc = kreslí se zbytečně). Oko ve
//   dveřích (do 0,3 m od otvoru, jako PASS ve visibility.js) smí vidět i PVS buňky za nimi: počítá se zvlášť
//   (upperDoorway), za chybu ne;
// - dolní mez: mřížka paprsků z oka přes celé zorné pole (64 × 36) proti světu v Rapieru; zasažená plocha kvádru
//   musí jít do dávky aspoň jedné kreslené buňky (plocha se kreslí v buňkách, které ji vidí, world.brushFaces;
//   jinak by místnost blikala). Paprsek zastaví i dveře a předměty (SIGHT_RAY); jejich zásah se nekontroluje.
//   Paprsek, který projde otvorem zavřených dveří portálu, se nepočítá: kolize křídla je užší než viditelné křídlo
//   (D-036) a otvor kryje i clona, takže štěrbinou kolize hráč nic nevidí. Paprsek, který dopadl do místa mimo
//   vzduch všech buněk (prošel spárou mezi kvádry), je díra v datech levelu (holes), ne chyba viditelnosti.
// Volá se mimo měřený čas snímku (testy, ?bench v snímcích s dávkou), ne v kroku hry.

import { SIGHT_RAY } from '../phys/phys.js';

export const PVS_GRID = [64, 36];
const FAR = 400;
const PASS = 0.3; // m, jako visibility.js
const BACK = 0.03; // m: bod před zasaženou plochou, který musí ležet ve vzduchu některé buňky

export function createPvsCheck({ vis, phys, render, world, player = null }) {
  let level = null;
  let brushCell = new Map(); // id kvádru → buňka z dat (jen viditelné kvádry; do zprávy)
  const stat = { frames: 0, upperFails: 0, lowerFails: 0, rays: 0, brushHits: 0, worstExtra: 0, behindClosed: 0, upperDoorway: 0, holes: 0, first: '' };
  /** Podrobnosti selhání (ladění, testy): nejvýš 50 záznamů. */
  const log = [];
  /** Spáry v datech (paprsek dopadl mimo vzduch buněk): nejvýš 20 záznamů. */
  const holes = [];
  const d = [0, 0, 0];
  const eye3 = [0, 0, 0];
  const dir3 = [0, 0, 0];
  /** Prochází paprsek z o ve směru u do vzdálenosti t otvorem zavřeného portálu? (otvory leží v rovině x nebo z) */
  function throughClosed(o, u, t) {
    for (const p of vis.portals) {
      if (p.open) continue;
      for (const ax of [0, 2]) {
        if (p.max[ax] - p.min[ax] > 0.01 || Math.abs(u[ax]) < 1e-9) continue;
        const at = (p.min[ax] + p.max[ax]) / 2;
        const s = (at - o[ax]) / u[ax];
        if (s <= 0 || s >= t) continue;
        let inside = true;
        for (let k = 0; k < 3 && inside; k++) {
          if (k === ax) continue;
          const c = o[k] + u[k] * s;
          inside = c >= p.min[k] - 0.01 && c <= p.max[k] + 0.01;
        }
        if (inside) return true;
      }
    }
    return false;
  }

  return {
    stat,
    log,
    holes,
    /** Při načtení levelu (po vis.load). PVS se spočítá až při první zkoušce (levely bez zkoušky ho neplatí). */
    load(lv) {
      level = lv;
      brushCell = new Map((level.brushes || []).filter((b) => b.vis !== false).map((b) => [b.id, b.cell]));
      Object.assign(stat, { frames: 0, upperFails: 0, lowerFails: 0, rays: 0, brushHits: 0, worstExtra: 0, behindClosed: 0, upperDoorway: 0, holes: 0, first: '' });
      log.length = 0;
      holes.length = 0;
    },
    get pvs() {
      return vis.pvs;
    },
    /** Jeden snímek: vis.update() už proběhl pro současný pohled render.view. Vrací { upper, lower } (true = v pořádku). */
    check() {
      const pvs = vis.pvs;
      if (!pvs) return null;
      stat.frames++;
      const drawn = vis.visibleSet;
      const cam = vis.cameraCell;
      let upper = true;
      if (cam) {
        const allowed = pvs.get(cam);
        let extra = 0;
        for (const id of drawn) if (!allowed?.has(id)) extra++;
        if (extra) {
          // oko ve dveřích: smí i PVS buněk portálu, ve kterém stojí
          const ex = render.view;
          const door = new Set();
          for (const p of level?.portals || []) {
            const xs = p.quad.map((q) => q[0]);
            const ys = p.quad.map((q) => q[1]);
            const zs = p.quad.map((q) => q[2]);
            if (ex.x > Math.min(...xs) - PASS && ex.x < Math.max(...xs) + PASS && ex.y > Math.min(...ys) - PASS && ex.y < Math.max(...ys) + PASS && ex.z > Math.min(...zs) - PASS && ex.z < Math.max(...zs) + PASS) {
              for (const c of [p.a, p.b]) for (const id of pvs.get(c) || []) door.add(id);
            }
          }
          let still = 0;
          for (const id of drawn) if (!allowed?.has(id) && !door.has(id)) still++;
          if (!still) {
            stat.upperDoorway++;
            extra = 0;
          }
        }
        if (extra) {
          upper = false;
          stat.upperFails++;
          stat.worstExtra = Math.max(stat.worstExtra, extra);
          if (log.length < 50) log.push({ kind: 'upper', cam, eye: [render.view.x, render.view.y, render.view.z], extra: [...drawn].filter((id) => !allowed?.has(id)) });
          stat.first ||= `horní mez: z buňky ${cam} se kreslí ${[...drawn].filter((id) => !allowed?.has(id)).join(', ')} mimo PVS`;
        }
      }
      // dolní mez: mřížka paprsků přes zorné pole kamery
      const v = render.view;
      const cy = Math.cos(v.yaw);
      const sy = Math.sin(v.yaw);
      const cp = Math.cos(v.pitch);
      const sp = Math.sin(v.pitch);
      const F = [-sy * cp, sp, -cy * cp];
      const R = [cy, 0, -sy];
      const U = [sy * sp, cp, cy * sp];
      const tanY = Math.tan((render.fov * Math.PI) / 360);
      const tanX = tanY * render.aspect;
      const [gx, gy] = PVS_GRID;
      const ex = player?.collider ?? undefined;
      let lower = true;
      for (let j = 0; j < gy; j++) {
        const ny = (((j + 0.5) / gy) * 2 - 1) * tanY;
        for (let i = 0; i < gx; i++) {
          const nx = (((i + 0.5) / gx) * 2 - 1) * tanX;
          d[0] = F[0] + R[0] * nx + U[0] * ny;
          d[1] = F[1] + R[1] * nx + U[1] * ny;
          d[2] = F[2] + R[2] * nx + U[2] * ny;
          const l = Math.hypot(d[0], d[1], d[2]);
          stat.rays++;
          const h = phys.raycast(v.x, v.y, v.z, d[0] / l, d[1] / l, d[2] / l, FAR, SIGHT_RAY, ex);
          if (!h || !h.ref || h.ref.kind !== 'brush') continue;
          const cell = brushCell.get(h.ref.id);
          if (cell === undefined) continue;
          stat.brushHits++;
          // zasažená plocha: ta, jejíž normála nejlépe sedí na normálu zásahu
          const faces = world.brushFaces.get(h.ref.id);
          let best = null;
          let bd = -2;
          for (const f of faces || []) {
            const dd = f.n[0] * h.nx + f.n[1] * h.ny + f.n[2] * h.nz;
            if (dd > bd) {
              bd = dd;
              best = f;
            }
          }
          if (best ? best.cells.some((c) => drawn.has(c)) : drawn.has(cell)) continue;
          eye3[0] = v.x;
          eye3[1] = v.y;
          eye3[2] = v.z;
          dir3[0] = d[0] / l;
          dir3[1] = d[1] / l;
          dir3[2] = d[2] / l;
          if (throughClosed(eye3, dir3, h.dist)) {
            stat.behindClosed++;
            continue;
          }
          // místo před plochou mimo vzduch všech buněk: paprsek prošel spárou v datech
          const bx = v.x + dir3[0] * (h.dist - BACK);
          const by = v.y + dir3[1] * (h.dist - BACK);
          const bz = v.z + dir3[2] * (h.dist - BACK);
          if (!world.cells.some((c) => bx >= c.bounds.min[0] && bx <= c.bounds.max[0] && by >= c.bounds.min[1] && by <= c.bounds.max[1] && bz >= c.bounds.min[2] && bz <= c.bounds.max[2])) {
            stat.holes++;
            if (holes.length < 20) holes.push({ eye: [v.x, v.y, v.z], hit: [bx, by, bz], brush: h.ref.id });
            continue;
          }
          if (lower) stat.lowerFails++;
          if (log.length < 50) log.push({ kind: 'lower', cam, eye: [v.x, v.y, v.z], yaw: v.yaw, pitch: v.pitch, dir: [d[0] / l, d[1] / l, d[2] / l], dist: h.dist, brush: h.ref.id, cell, faceCells: best?.cells, drawn: [...drawn] });
          lower = false;
          stat.first ||= `dolní mez: z [${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}] je vidět kvádr ${h.ref.id} (plocha v buňkách ${best?.cells.join(', ') ?? cell}) ve ${h.dist.toFixed(2)} m, nekreslí se`;
        }
      }
      return { upper, lower };
    },
  };
}
