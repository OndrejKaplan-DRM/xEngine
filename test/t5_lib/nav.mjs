// Navigace zkušebního robota (T5, zkouška A × B). Mřížka schůdných míst se neměří z dat levelu, ale přímo
// ve fyzice hry (Rapier): paprsek dolů najde podlahu, kapsle o rozměrech hráče ověří, že se tam postava vejde.
// Robot tak chodí podle téhož světa kolizí jako hráč a nenese vlastní kopii geometrie.

import RAPIER from '@dimforge/rapier3d-compat';
import { SIGHT_RAY } from '../../src/phys/phys.js';
import { CHARACTER_SKIN } from '../../src/xspace/body.js';

const STEP_UP = 0.3; // m, největší výškový rozdíl dvou sousedních míst (schod, práh)
const FOOT = 0.35; // m, o kolik je zkušební kapsle nad podlahou (nižší překážku řeší krok postavy)
const OFF = 0.003; // m; místa leží těsně vedle násobků rozteče: paprsek přesně po společné stěně dvou kvádrů mine oba
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * @param {object} game hra po startu levelu
 * @param {object} [o]
 * @param {number} [o.g] rozteč mřížky v metrech; místa leží na násobcích rozteče (otvory z generátoru také)
 * @param {Set<number>} [o.skip] kolize, které se nepočítají (křídla zavřených dveří: robot si je otevře)
 */
export function buildNav(game, { g = 0.1, skip = null } = {}) {
  const world = game.phys.world;
  const P = game.player.profile;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const c of game.world.cells) {
    x0 = Math.min(x0, c.bounds.min[0]); y0 = Math.min(y0, c.bounds.min[1]); z0 = Math.min(z0, c.bounds.min[2]);
    x1 = Math.max(x1, c.bounds.max[0]); y1 = Math.max(y1, c.bounds.max[1]); z1 = Math.max(z1, c.bounds.max[2]);
  }
  x0 = Math.floor(x0 / g) * g; z0 = Math.floor(z0 / g) * g;
  const nx = Math.round((x1 - x0) / g) + 1, nz = Math.round((z1 - z0) / g) + 1;

  let pred = skip ? (c) => !skip.has(c.handle) : undefined;
  const down = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
  const up = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
  const cast = (ray, max) => world.castRayAndGetNormal(ray, max, true, undefined, SIGHT_RAY, undefined, undefined, pred);
  const r = P.radius + CHARACTER_SKIN; // N-008: odstup kontroléru ze základu
  const half = Math.max((P.height - FOOT) / 2 - r, 0.01);
  const capsule = new RAPIER.Capsule(half, r);
  const noRot = { x: 0, y: 0, z: 0, w: 1 };
  const fits = (x, y, z) => !world.intersectionWithShape({ x, y: y + FOOT + half + r, z }, noRot, capsule, undefined, SIGHT_RAY, undefined, undefined, pred);

  const col = new Array(nx * nz).fill(null);
  const X = [], Y = [], Z = [], free = [];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = x0 + ix * g + OFF, z = z0 + iz * g + OFF;
      let y = y1 - 0.02;
      for (let guard = 0; y > y0 - 0.05 && guard < 80; guard++) {
        down.origin.x = x; down.origin.y = y; down.origin.z = z;
        const hit = cast(down, y - y0 + 0.5);
        if (!hit) break;
        if (hit.timeOfImpact < 1e-5) { y -= 0.2; continue; } // začátek paprsku je uvnitř tělesa
        const ys = y - hit.timeOfImpact;
        if (hit.normal.y >= 0.7) {
          up.origin.x = x; up.origin.y = ys + 0.05; up.origin.z = z;
          const top = cast(up, P.height);
          if (!top || top.timeOfImpact > P.height - 0.1) {
            const id = X.length;
            X.push(x); Y.push(ys); Z.push(z); free.push(fits(x, ys, z) ? 1 : 0);
            (col[ix + iz * nx] ||= []).push(id);
          }
        }
        y = ys - 0.2;
      }
    }
  }

  const at = (ix, iz, y) => {
    if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) return -1;
    const list = col[ix + iz * nx];
    if (!list) return -1;
    let best = -1, bd = STEP_UP + 1e-6;
    for (const m of list) {
      const d = Math.abs(Y[m] - y);
      if (d <= bd) { bd = d; best = m; }
    }
    return best;
  };
  const ixOf = (x) => Math.round((x - OFF - x0) / g), izOf = (z) => Math.round((z - OFF - z0) / g);

  const nav = {
    g, x0, y0, z0, nx, nz, X, Y, Z, free,
    get count() { return X.length; },
    /** Nejbližší volné místo k bodu (nohy postavy), nebo −1. */
    nearest(x, y, z, radius = 0.6) {
      const k = Math.ceil(radius / g);
      let best = -1, bd = Infinity;
      for (let dz = -k; dz <= k; dz++) for (let dx = -k; dx <= k; dx++) {
        const ix = ixOf(x) + dx, iz = izOf(z) + dz;
        if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) continue;
        for (const m of col[ix + iz * nx] || []) {
          if (!free[m] || Math.abs(Y[m] - y) > 0.6) continue;
          const d = Math.hypot(X[m] - x, Z[m] - z) + Math.abs(Y[m] - y);
          if (d < bd) { bd = d; best = m; }
        }
      }
      return best;
    },
    /** Nejkratší cesty z místa src do všech volných míst. Vrací { dist, prev }. */
    dijkstra(src) {
      const n = X.length;
      const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
      const heapN = [], heapD = [];
      const push = (node, d) => {
        let i = heapN.length;
        heapN.push(node); heapD.push(d);
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heapD[p] <= d) break;
          heapN[i] = heapN[p]; heapD[i] = heapD[p]; i = p;
        }
        heapN[i] = node; heapD[i] = d;
      };
      const pop = () => {
        const top = heapN[0], lastN = heapN.pop(), lastD = heapD.pop();
        const len = heapN.length;
        if (len) {
          let i = 0;
          for (;;) {
            let c = 2 * i + 1;
            if (c >= len) break;
            if (c + 1 < len && heapD[c + 1] < heapD[c]) c++;
            if (heapD[c] >= lastD) break;
            heapN[i] = heapN[c]; heapD[i] = heapD[c]; i = c;
          }
          heapN[i] = lastN; heapD[i] = lastD;
        }
        return top;
      };
      dist[src] = 0;
      push(src, 0);
      while (heapN.length) {
        const dTop = heapD[0], u = pop();
        if (dTop > dist[u]) continue;
        const ix = ixOf(X[u]), iz = izOf(Z[u]);
        for (let k = 0; k < 8; k++) {
          const [dx, dz] = DIRS[k];
          const v = at(ix + dx, iz + dz, Y[u]);
          if (v < 0 || !free[v]) continue;
          if (k >= 4) { // šikmo jen tehdy, když jsou volná obě sousední místa (neřezat rohy)
            const a = at(ix + dx, iz, Y[u]), b = at(ix, iz + dz, Y[u]);
            if (a < 0 || b < 0 || !free[a] || !free[b]) continue;
          }
          const nd = dTop + Math.hypot(dx * g, dz * g, Y[v] - Y[u]);
          if (nd < dist[v]) { dist[v] = nd; prev[v] = u; push(v, nd); }
        }
      }
      return { dist, prev };
    },
    /** Cesta (indexy míst od zdroje k cíli) z výsledku dijkstra, nebo null. */
    path({ dist, prev }, target) {
      if (target < 0 || !Number.isFinite(dist[target])) return null;
      const out = [];
      for (let n = target; n >= 0; n = prev[n]) out.push(n);
      return out.reverse();
    },
    /** Místa uvnitř buňky (podle jejího kvádru vzduchu). */
    inCell(cell) {
      const { min, max } = cell.bounds;
      const out = [];
      for (let iz = Math.max(izOf(min[2]), 0); iz <= Math.min(izOf(max[2]), nz - 1); iz++) {
        for (let ix = Math.max(ixOf(min[0]), 0); ix <= Math.min(ixOf(max[0]), nx - 1); ix++) {
          for (const m of col[ix + iz * nx] || []) {
            if (X[m] > min[0] && X[m] < max[0] && Z[m] > min[2] && Z[m] < max[2] && Y[m] >= min[1] - 0.05 && Y[m] < max[1]) out.push(m);
          }
        }
      }
      return out;
    },
    /** Znovu ověří, kde se postava vejde, v okruhu kolem bodu (po otevření dveří stojí křídlo jinde). */
    refresh(x, z, radius, newSkip) {
      pred = newSkip ? (c) => !newSkip.has(c.handle) : undefined;
      const k = Math.ceil(radius / g);
      for (let dz = -k; dz <= k; dz++) for (let dx = -k; dx <= k; dx++) {
        const ix = ixOf(x) + dx, iz = izOf(z) + dz;
        if (ix < 0 || iz < 0 || ix >= nx || iz >= nz) continue;
        for (const m of col[ix + iz * nx] || []) free[m] = fits(X[m], Y[m], Z[m]) ? 1 : 0;
      }
    },
  };
  return nav;
}
