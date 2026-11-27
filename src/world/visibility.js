// xWorld: viditelnost po buňkách a portálech (dědictví Quake a Doom 3, docs/01_ARCHITEKTURA.md, oddíl 4).
// Kreslí se buňka kamery a buňky, které jsou vidět skrz portály. Každý portál zužuje výhled na obdélník,
// který na obrazovce zabírá; portál mimo ten obdélník se dál neprochází. Zavřené dveře portál uzavírají
// a jejich otvor zakryje clona (render.addShutter), aby škvírou kolem křídla neprosvítalo pozadí.
// Světla se tu neřeší: svítí po vrcholech (lighting.js) a zavřené dveře je zadrží bránou vrstvy (occlusion.js).
// Výpočet je čistá aritmetika bez knihoven a bez alokací; běží před každým vykreslením (render.beforeDraw).
// Prokazatelná viditelnost (N-014, D-057): buňka mimo levelPVS(buňka kamery) se neprochází, i když by ji obdélníky
// portálů pustily (obdélník je hrubší než přímka skrz otvory). Oko ve dveřích (PASS) bere i PVS buňky za nimi.

import { levelPVS } from '../xspace/index.js';

const NEAR = 0.02; // m; ořez mnohoúhelníku portálu rovinou před okem
const PASS = 0.3; // m; oko takhle blízko otvoru portálu ho nezužuje (stojím ve dveřích)
const MAX_DEPTH = 12; // nejdelší řetěz portálů za sebou
const MAX_VISITS = 512; // pojistka proti výbuchu počtu cest v hustém grafu
const REST_EPS = 1e-6;

export function createVisibility({ world, entities, render }) {
  let cells = [];
  let cellIndex = new Map();
  let portals = []; // { id, a, b, quad: Float64Array(12), min, max, door: entita | null, open, rect: [x0, y0, x1, y1], seen }
  let cellPortals = []; // index buňky → indexy portálů
  let visible = new Uint8Array(0);
  let onPath = new Uint8Array(0);
  let cameraCell = -1;
  let visits = 0;
  let pvs = null; // Map id buňky → Set id (levelPVS)
  let pvsIdx = []; // index buňky → Int32Array indexů buněk v jejím PVS
  let allowed = null; // Uint8Array podle buněk: kam smí pohled tento snímek (PVS)
  let allowedNow = null; // allowed, nebo null (bez omezení) pro právě běžící visit
  const visibleIds = new Set();
  const stat = { updates: 0, visits: 0, cells: 0, pvsCut: 0, pvsMs: 0 };
  // pohled
  const eye = [0, 0, 0];
  const R = [1, 0, 0];
  const U = [0, 1, 0];
  const F = [0, 0, -1];
  let tanX = 1;
  let tanY = 1;
  // pracovní pole pro ořez mnohoúhelníku (čtyřúhelník může ořezem získat jeden vrchol)
  const polyA = new Float64Array(24);
  const polyB = new Float64Array(24);
  const rect = [0, 0, 0, 0];

  /** Portál je pro pohled otevřený: bez dveří, dveře se seeThrough (mříž, sklo; N-003), nebo dveře mimo klid. */
  const isOpen = (p) => {
    if (!p.door || p.door.door?.def.seeThrough) return true;
    const j = p.door.door?.joint || p.door.joints[0];
    return !j || Math.abs(j.value - j.rest) > REST_EPS;
  };

  /** Obdélník portálu na obrazovce (−1…1), zúžený na rodičovský. Vrací false, když z něj nic nezbude. */
  function portalRect(p, x0, y0, x1, y1) {
    // oko v otvoru nebo těsně u něj: portál výhled nezužuje
    if (eye[0] > p.min[0] - PASS && eye[0] < p.max[0] + PASS && eye[1] > p.min[1] - PASS && eye[1] < p.max[1] + PASS && eye[2] > p.min[2] - PASS && eye[2] < p.max[2] + PASS) {
      rect[0] = x0;
      rect[1] = y0;
      rect[2] = x1;
      rect[3] = y1;
      return true;
    }
    // do prostoru pohledu: x vpravo, y nahoru, z dopředu
    let n = 4;
    for (let i = 0; i < 4; i++) {
      const dx = p.quad[i * 3] - eye[0];
      const dy = p.quad[i * 3 + 1] - eye[1];
      const dz = p.quad[i * 3 + 2] - eye[2];
      polyA[i * 3] = dx * R[0] + dy * R[1] + dz * R[2];
      polyA[i * 3 + 1] = dx * U[0] + dy * U[1] + dz * U[2];
      polyA[i * 3 + 2] = dx * F[0] + dy * F[1] + dz * F[2];
    }
    // ořez rovinou z = NEAR (Sutherland–Hodgman)
    let m = 0;
    for (let i = 0; i < n; i++) {
      const a = i * 3;
      const b = ((i + 1) % n) * 3;
      const za = polyA[a + 2];
      const zb = polyA[b + 2];
      if (za >= NEAR) {
        polyB[m * 3] = polyA[a];
        polyB[m * 3 + 1] = polyA[a + 1];
        polyB[m * 3 + 2] = za;
        m++;
      }
      if (za >= NEAR !== zb >= NEAR) {
        const t = (NEAR - za) / (zb - za);
        polyB[m * 3] = polyA[a] + (polyA[b] - polyA[a]) * t;
        polyB[m * 3 + 1] = polyA[a + 1] + (polyA[b + 1] - polyA[a + 1]) * t;
        polyB[m * 3 + 2] = NEAR;
        m++;
      }
    }
    if (m < 3) return false;
    n = m;
    let px0 = Infinity;
    let py0 = Infinity;
    let px1 = -Infinity;
    let py1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const z = polyB[i * 3 + 2];
      const x = polyB[i * 3] / (z * tanX);
      const y = polyB[i * 3 + 1] / (z * tanY);
      if (x < px0) px0 = x;
      if (x > px1) px1 = x;
      if (y < py0) py0 = y;
      if (y > py1) py1 = y;
    }
    if (px0 < x0) px0 = x0;
    if (py0 < y0) py0 = y0;
    if (px1 > x1) px1 = x1;
    if (py1 > y1) py1 = y1;
    if (px0 >= px1 || py0 >= py1) return false;
    rect[0] = px0;
    rect[1] = py0;
    rect[2] = px1;
    rect[3] = py1;
    return true;
  }

  function visit(ci, x0, y0, x1, y1, depth) {
    visible[ci] = 1;
    if (depth >= MAX_DEPTH || ++visits > MAX_VISITS) return;
    const list = cellPortals[ci];
    for (let k = 0; k < list.length; k++) {
      const pi = list[k];
      const p = portals[pi];
      if (onPath[pi] || !p.open) continue;
      if (!portalRect(p, x0, y0, x1, y1)) continue;
      const nx0 = rect[0];
      const ny0 = rect[1];
      const nx1 = rect[2];
      const ny1 = rect[3];
      // obdélník portálu pro vývojářskou vrstvu: sjednocení přes všechny cesty
      if (!p.seen) {
        p.seen = true;
        p.rect[0] = nx0;
        p.rect[1] = ny0;
        p.rect[2] = nx1;
        p.rect[3] = ny1;
      } else {
        if (nx0 < p.rect[0]) p.rect[0] = nx0;
        if (ny0 < p.rect[1]) p.rect[1] = ny0;
        if (nx1 > p.rect[2]) p.rect[2] = nx1;
        if (ny1 > p.rect[3]) p.rect[3] = ny1;
      }
      const nc = p.a === ci ? p.b : p.a;
      if (allowedNow && !allowedNow[nc]) {
        stat.pvsCut++;
        continue; // z buňky kamery prokazatelně neviditelná (N-014)
      }
      onPath[pi] = 1;
      visit(nc, nx0, ny0, nx1, ny1, depth + 1);
      onPath[pi] = 0;
    }
  }

  const sys = {
    name: 'vis',
    phase: 'late',
    stat,
    /** false = kreslí se všechno (srovnání s xView, ladění). */
    enabled: true,
    get cameraCell() {
      return cameraCell >= 0 ? cells[cameraCell].id : null;
    },
    get portals() {
      return portals;
    },
    /** Buňky, které se v posledním update() kreslily (Set id; jen pro čtení). */
    get visibleSet() {
      return visibleIds;
    },

    load(ctx) {
      cells = ctx.level.cells;
      cellIndex = new Map(cells.map((c, i) => [c.id, i]));
      cellPortals = cells.map(() => []);
      portals = (ctx.level.portals || []).map((def, i) => {
        const a = cellIndex.get(def.a);
        const b = cellIndex.get(def.b);
        cellPortals[a].push(i);
        cellPortals[b].push(i);
        const quad = new Float64Array(12);
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        def.quad.forEach((c, k) => {
          for (let d = 0; d < 3; d++) {
            quad[k * 3 + d] = c[d];
            if (c[d] < min[d]) min[d] = c[d];
            if (c[d] > max[d]) max[d] = c[d];
          }
        });
        const door = def.door ? entities.byId(def.door) : null;
        return { id: def.id, a, b, quad, min, max, door, open: true, rect: [0, 0, 0, 0], seen: false, shutter: door && !door.door?.def.seeThrough ? render.addShutter([def.a, def.b], quad) : null };
      });
      visible = new Uint8Array(cells.length);
      onPath = new Uint8Array(portals.length);
      cameraCell = -1;
      const t0 = globalThis.performance?.now?.() ?? 0;
      pvs = levelPVS(ctx.level);
      stat.pvsMs = (globalThis.performance?.now?.() ?? 0) - t0;
      pvsIdx = cells.map((c) => Int32Array.from([...(pvs.get(c.id) || [])].map((id) => cellIndex.get(id))));
      allowed = new Uint8Array(cells.length);
    },
    unload() {
      cells = [];
      portals = [];
      cameraCell = -1;
      pvs = null;
      pvsIdx = [];
    },
    /** PVS levelu (Map id buňky → Set id buněk; levelPVS ze základu). */
    get pvs() {
      return pvs;
    },
    /** false = obdélníky portálů bez omezení PVS (srovnání). */
    usePvs: true,

    /** Přepočet pro současný pohled vykreslení. Volá se před každým snímkem; výsledek jde rovnou do xRender. */
    update() {
      if (!cells.length) return;
      const v = render.view;
      stat.updates++;
      if (!sys.enabled) {
        visible.fill(1);
        for (let i = 0; i < portals.length; i++) {
          portals[i].seen = false;
          portals[i].open = isOpen(portals[i]);
          portals[i].shutter?.setVisible(false); // kreslí se vše, clona by jen zakryla místnost za škvírou
        }
        render.setVisibleCells(null);
        stat.cells = cells.length;
        return;
      }
      eye[0] = v.x;
      eye[1] = v.y;
      eye[2] = v.z;
      const cy = Math.cos(v.yaw);
      const sy = Math.sin(v.yaw);
      const cp = Math.cos(v.pitch);
      const sp = Math.sin(v.pitch);
      F[0] = -sy * cp;
      F[1] = sp;
      F[2] = -cy * cp;
      R[0] = cy;
      R[1] = 0;
      R[2] = -sy;
      U[0] = sy * sp;
      U[1] = cp;
      U[2] = cy * sp;
      tanY = Math.tan((render.fov * Math.PI) / 360);
      tanX = tanY * render.aspect;

      // dveře: stav se čte jednou na snímek
      for (let i = 0; i < portals.length; i++) {
        const p = portals[i];
        p.open = isOpen(p);
        p.seen = false;
        p.shutter?.setVisible(!p.open);
      }
      const c = world.cellAt(eye);
      cameraCell = c ? cellIndex.get(c.id) : -1;
      visible.fill(0);
      visits = 0;
      // buňky, které smí pohled projít: PVS buňky kamery, a stojí-li oko ve dveřích, i PVS buňky za nimi
      const lim = sys.usePvs && cameraCell >= 0 ? allowed : null;
      if (lim) {
        lim.fill(0);
        const mark = (ci) => {
          const L = pvsIdx[ci];
          for (let k = 0; k < L.length; k++) lim[L[k]] = 1;
        };
        mark(cameraCell);
        for (let i = 0; i < portals.length; i++) {
          const p = portals[i];
          if (eye[0] > p.min[0] - PASS && eye[0] < p.max[0] + PASS && eye[1] > p.min[1] - PASS && eye[1] < p.max[1] + PASS && eye[2] > p.min[2] - PASS && eye[2] < p.max[2] + PASS) {
            mark(p.a);
            mark(p.b);
          }
        }
      }
      allowedNow = lim;
      if (cameraCell >= 0) visit(cameraCell, -1, -1, 1, 1, 0);
      else visible.fill(1);
      stat.visits = visits;

      visibleIds.clear();
      for (let i = 0; i < cells.length; i++) if (visible[i]) visibleIds.add(cells[i].id);
      stat.cells = visibleIds.size;
      render.setVisibleCells(visibleIds);
    },

    /**
     * Úsečky pro vývojářskou vrstvu: obrysy buněk a portálů. Barvy říkají stav: buňka kamery žlutě, viditelná zeleně,
     * schovaná šedě; portál otevřený a viděný azurově, otevřený mimo výhled modře, zavřený dveřmi červeně.
     * @returns {{ positions: Float32Array, colors: Float32Array }}
     */
    debugLines() {
      const pos = [];
      const col = [];
      const seg = (a, b, c) => {
        pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        col.push(c[0], c[1], c[2], c[0], c[1], c[2]);
      };
      const IN = 0.03; // obrys kousek uvnitř buňky, aby nesplýval se stěnou
      cells.forEach((cell, i) => {
        const c = i === cameraCell ? [1, 0.85, 0.1] : visible[i] ? [0.2, 1, 0.3] : [0.45, 0.45, 0.5];
        const m = cell.bounds.min.map((x) => x + IN);
        const M = cell.bounds.max.map((x) => x - IN);
        const P = (k) => [k & 1 ? M[0] : m[0], k & 2 ? M[1] : m[1], k & 4 ? M[2] : m[2]];
        for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) seg(P(a), P(b), c);
      });
      for (const p of portals) {
        const c = !p.open ? [1, 0.15, 0.1] : p.seen ? [0.1, 1, 1] : [0.2, 0.4, 1];
        const q = (k) => [p.quad[k * 3], p.quad[k * 3 + 1], p.quad[k * 3 + 2]];
        for (let k = 0; k < 4; k++) seg(q(k), q((k + 1) % 4), c);
        seg(q(0), q(2), c);
        seg(q(1), q(3), c);
      }
      return { positions: new Float32Array(pos), colors: new Float32Array(col) };
    },

    inspect(path) {
      switch (path[0]) {
        case 'cells': // viditelné buňky pro současný pohled (přepočítá se)
          sys.update();
          return cells.filter((_, i) => visible[i]).map((c) => c.id);
        case 'camera':
          sys.update();
          return sys.cameraCell;
        case 'portals':
          sys.update();
          return portals.map((p) => ({ id: p.id, open: p.open, seen: p.seen, rect: p.seen ? [...p.rect] : null }));
        case 'stat':
          return { ...stat };
        case 'enabled':
          return sys.enabled;
        default:
          return undefined;
      }
    },
  };
  return sys;
}
