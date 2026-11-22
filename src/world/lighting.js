// xWorld: světlo levelu za běhu (D-022). Drží světla, jejich vrstvy nad statickým světem a osvětlení pohyblivých
// dílů po stěnách. Ve scéně vykreslení žádné světlo není: tenhle systém zapisuje barvu vrcholů do polí, která mu
// vykreslení půjčuje (render.statics, ovladače dílů), a po změně na ně sáhne (touch).
//
// Změna se jen poznamená (setLight, moveLight, touchMover, setGate) a provede se jednou před vykreslením (flush):
// lampa přepnutá desetkrát mezi dvěma snímky stojí jeden průchod své vrstvy.

import { lightIrradiance } from '../xspace/index.js';
import { buildLayer, addSeg, fillAmbient, E_MIN, INV_PI } from './lightfield.js';

const MOVER_REACH = 2.5; // m; díl takhle daleko za dosahem světla se při změně světla nepřepočítává (rozměr dílu)

export function createLighting({ render, now = () => performance.now() }) {
  const lights = [];
  const pending = []; // světla, kterým se změnila úroveň, poloha nebo brána
  const movers = []; // { matrix, parts: [{ colors, touch, facets }], dirty }
  const dirtyMovers = [];
  const dirtyTargets = [];
  let targets = [];
  let ambient = [0, 0, 0];
  let built = false;
  /** Zastínění: (světlo, x, y, z) → 0 volno, −1 zastíněno, k > 0 jen skrz bránu k. Dodává occlusion.js. */
  let gateOf = null;
  /** Úroveň bran: index 0 = volná cesta (vždy 1), další = otevření dveří 0 až 1. */
  let gateLevel = new Float32Array([1]);
  let gateLights = [[]]; // brána → světla, která skrz ni svítí
  const stat = { lights: 0, samples: 0, entries: 0, gated: 0, movers: 0, buildMs: 0, flushes: 0, applied: 0, relit: 0 };

  const effective = (L) => (L.on && L.level > 0 && L.intensity > 0 ? L.level : 0);

  function queue(L) {
    if (L.queued) return;
    L.queued = true;
    pending.push(L);
  }
  function touchTarget(T) {
    if (T.dirty) return;
    T.dirty = true;
    dirtyTargets.push(T);
  }

  /** Dorovná zapsaný stav vrstvy na požadovaný: přičte rozdíl jen tam, kde se úroveň nebo brána změnila. */
  function applyLight(L) {
    const base = effective(L);
    const segs = L.layer.segs;
    const c = L.color;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const want = base * gateLevel[s.gate];
      const d = want - s.applied;
      if (d === 0) continue;
      const T = targets[s.t];
      addSeg(T.colors, s, d * c[0] * INV_PI, d * c[1] * INV_PI, d * c[2] * INV_PI);
      s.applied = want;
      stat.applied += s.idx.length;
      touchTarget(T);
    }
  }
  function buildLight(L) {
    L.layer = buildLayer(L, targets, gateOf);
    for (const s of L.layer.segs) {
      s.applied = 0;
      if (s.gate > 0) {
        while (gateLights.length <= s.gate) gateLights.push([]);
        if (!gateLights[s.gate].includes(L)) gateLights[s.gate].push(L);
      }
    }
  }
  /** Světlo se pohnulo: starý příspěvek odečíst, vrstvu spočítat znovu, nový přičíst. */
  function rebuildLight(L) {
    const on = L.on;
    L.on = false;
    applyLight(L);
    L.on = on;
    for (const list of gateLights) {
      const k = list.indexOf(L);
      if (k >= 0) list.splice(k, 1);
    }
    buildLight(L);
    applyLight(L);
  }

  function markMoversNear(L) {
    const far = L.type === 'sun' || !(L.range > 0);
    const reach = far ? 0 : L.range + MOVER_REACH;
    for (let i = 0; i < movers.length; i++) {
      const m = movers[i];
      if (m.dirty) continue;
      if (!far) {
        const dx = m.matrix[12] - L.pos[0];
        const dy = m.matrix[13] - L.pos[1];
        const dz = m.matrix[14] - L.pos[2];
        if (dx * dx + dy * dy + dz * dz > reach * reach) continue;
      }
      m.dirty = true;
      dirtyMovers.push(m);
    }
  }

  /** Osvětlení jednoho pohyblivého dílu: jedna hodnota na stěnu, vzorec ve středu stěny. Bez alokací. */
  function relight(m) {
    const M = m.matrix;
    // zastínění dílu: jeden paprsek ze středu dílu ke každému světlu (A1.8), ne na každou stěnu
    const c = m.center;
    const wx = M[0] * c[0] + M[4] * c[1] + M[8] * c[2] + M[12];
    const wy = M[1] * c[0] + M[5] * c[1] + M[9] * c[2] + M[13];
    const wz = M[2] * c[0] + M[6] * c[1] + M[10] * c[2] + M[14];
    for (let li = 0; li < lights.length; li++) {
      const L = lights[li];
      L.moverK = effective(L);
      if (L.moverK > 0 && gateOf) {
        const g = gateOf(L, wx, wy, wz, m);
        L.moverK = g < 0 ? 0 : L.moverK * gateLevel[g];
      }
    }
    for (let pi = 0; pi < m.parts.length; pi++) {
      const part = m.parts[pi];
      const col = part.colors;
      const F = part.facets;
      for (let f = 0; f < F.length; f++) {
        const ft = F[f];
        const x = M[0] * ft.cx + M[4] * ft.cy + M[8] * ft.cz + M[12];
        const y = M[1] * ft.cx + M[5] * ft.cy + M[9] * ft.cz + M[13];
        const z = M[2] * ft.cx + M[6] * ft.cy + M[10] * ft.cz + M[14];
        let nx = M[0] * ft.nx + M[4] * ft.ny + M[8] * ft.nz;
        let ny = M[1] * ft.nx + M[5] * ft.ny + M[9] * ft.nz;
        let nz = M[2] * ft.nx + M[6] * ft.ny + M[10] * ft.nz;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;
        let r = ambient[0];
        let g = ambient[1];
        let b = ambient[2];
        for (let li = 0; li < lights.length; li++) {
          const L = lights[li];
          if (!(L.moverK > 0)) continue;
          const e = lightIrradiance(L, x, y, z, nx, ny, nz);
          if (!(e > E_MIN)) continue;
          const k = L.moverK * e * INV_PI;
          r += k * L.color[0];
          g += k * L.color[1];
          b += k * L.color[2];
        }
        const v = ft.verts;
        for (let i = 0; i < v.length; i++) {
          const c = v[i] * 3;
          col[c] = r;
          col[c + 1] = g;
          col[c + 2] = b;
        }
      }
      part.touch();
    }
    stat.relit++;
  }

  const sys = {
    name: 'light',
    phase: 'view',
    stat,
    get lights() {
      return lights;
    },
    get built() {
      return built;
    },

    /** Nový level: prostředí a prázdné seznamy. V pořadí načítání je první, svět a entity do něj hlásí světla a díly. */
    load(ctx) {
      sys.unload();
      ambient = ctx.level.env?.ambient ? [...ctx.level.env.ambient] : [0, 0, 0];
    },
    unload() {
      lights.length = 0;
      pending.length = 0;
      movers.length = 0;
      dirtyMovers.length = 0;
      dirtyTargets.length = 0;
      targets = [];
      gateOf = null;
      gateLevel = new Float32Array([1]);
      gateLights = [[]];
      built = false;
      Object.assign(stat, { lights: 0, samples: 0, entries: 0, gated: 0, movers: 0, buildMs: 0, flushes: 0, applied: 0, relit: 0 });
    },

    /**
     * Světlo podle xSpace ({ type, pos, dir, color, intensity, range, angle }) + stav { on, level }.
     * Vrací záznam; vlastník v něm mění on a level (potom setLight) nebo pos (potom moveLight).
     */
    addLight(def, { id, cell, on = true, level = 1, fixed = true } = {}) {
      const L = {
        id,
        cell,
        fixed,
        type: def.type || 'point',
        pos: def.pos ? [...def.pos] : [0, 0, 0],
        dir: def.dir ? [...def.dir] : undefined,
        angle: def.angle,
        color: def.color || [1, 1, 1],
        intensity: def.intensity ?? 0,
        range: def.range || 0,
        on,
        level,
        layer: { segs: [], samples: 0 },
        queued: false,
        moved: false,
        moverK: 0,
      };
      lights.push(L);
      stat.lights = lights.length;
      if (built) {
        buildLight(L);
        queue(L);
      }
      return L;
    },
    /** Změnila se úroveň nebo stav zapnutí. */
    setLight(L) {
      if (L) queue(L);
    },
    /** Světlo se pohnulo (lampa na pohyblivém uzlu): vrstva se spočítá znovu při nejbližším flush. */
    moveLight(L) {
      if (!L) return;
      L.moved = true;
      queue(L);
    },

    /**
     * Pohyblivý díl: ctrl je ovladač z render.addMover, matrix jeho světová matice (pole, které vlastník přepisuje),
     * facets[i] plošky i-té části (addFacets). Vrací záznam pro touchMover, nebo null, když díl na světlo nereaguje.
     */
    addMover(ctrl, matrix, facets) {
      const parts = [];
      ctrl.pieces.forEach((p, i) => {
        if (p.colors && facets[i]?.length) parts.push({ colors: p.colors, touch: p.touch, facets: facets[i] });
      });
      if (!parts.length) return null;
      // střed dílu v jeho prostoru (průměr středů stěn): odtud se zkoumá zastínění
      const center = [0, 0, 0];
      let n = 0;
      for (const part of parts) {
        for (const f of part.facets) {
          center[0] += f.cx;
          center[1] += f.cy;
          center[2] += f.cz;
          n++;
        }
      }
      for (let k = 0; k < 3; k++) center[k] /= n;
      const m = { matrix, parts, dirty: true, center, owner: null };
      movers.push(m);
      dirtyMovers.push(m);
      stat.movers = movers.length;
      return m;
    },
    /** Díl se pohnul. */
    touchMover(m) {
      if (!m || m.dirty) return;
      m.dirty = true;
      dirtyMovers.push(m);
    },

    /** Zastínění a brány (occlusion.js). Volá se před build(). count = počet bran včetně nulté. */
    setOcclusion(fn, count = 1) {
      gateOf = fn;
      gateLevel = new Float32Array(Math.max(1, count)).fill(1);
      gateLights = Array.from({ length: gateLevel.length }, () => []);
    },
    /** Otevření brány 0 až 1 (dveře v portálu). Světla, která skrz ni svítí, se dorovnají při flush. */
    setGate(gate, level) {
      if (!(gate > 0) || gate >= gateLevel.length || gateLevel[gate] === level) return;
      gateLevel[gate] = level;
      const list = gateLights[gate];
      for (let i = 0; i < list.length; i++) queue(list[i]);
      // díly za bránou: levné je označit všechny v dosahu světel, která bránou svítí
      for (let i = 0; i < list.length; i++) markMoversNear(list[i]);
    },
    gate: (g) => gateLevel[g],

    /** Vrstvy všech světel nad statickými dávkami vykreslení. Volá se po render.closeStatic(). */
    build() {
      const t0 = now();
      targets = render.statics;
      dirtyTargets.length = 0;
      let samples = 0;
      for (const T of targets) {
        T.dirty = false;
        if (!T.colors) continue;
        fillAmbient(T.colors, ambient);
        touchTarget(T);
        samples += T.count;
      }
      let entries = 0;
      let gated = 0;
      for (const L of lights) {
        buildLight(L);
        entries += L.layer.samples;
        for (const s of L.layer.segs) if (s.gate > 0) gated += s.idx.length;
        L.queued = false;
        L.moved = false;
        applyLight(L);
      }
      pending.length = 0;
      for (const m of movers) {
        if (m.dirty) continue;
        m.dirty = true;
        dirtyMovers.push(m);
      }
      built = true;
      stat.samples = samples;
      stat.entries = entries;
      stat.gated = gated;
      stat.buildMs = now() - t0;
      sys.flush();
    },

    /** Provede poznamenané změny. Volá se před každým vykreslením (render.beforeDraw) a z testů. */
    flush() {
      if (!built) return;
      for (let i = 0; i < pending.length; i++) {
        const L = pending[i];
        L.queued = false;
        if (L.moved) {
          L.moved = false;
          rebuildLight(L);
        } else applyLight(L);
        markMoversNear(L);
      }
      pending.length = 0;
      for (let i = 0; i < dirtyMovers.length; i++) {
        const m = dirtyMovers[i];
        m.dirty = false;
        relight(m);
      }
      dirtyMovers.length = 0;
      for (let i = 0; i < dirtyTargets.length; i++) {
        const T = dirtyTargets[i];
        T.dirty = false;
        T.touch();
      }
      dirtyTargets.length = 0;
      stat.flushes++;
    },

    inspect(path) {
      sys.flush();
      switch (path[0]) {
        case 'stat':
          return { ...stat };
        case 'lights':
          return lights.map((L) => ({ id: L.id, cell: L.cell, type: L.type, on: L.on, level: L.level, samples: L.layer.samples, fixed: L.fixed }));
        case 'gates':
          return Array.from(gateLevel);
        default:
          return undefined;
      }
    },
  };
  return sys;
}
