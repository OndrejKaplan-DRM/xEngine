// xWorld: světlo levelu za běhu (D-022). Drží světla, jejich vrstvy nad statickým světem a osvětlení pohyblivých
// dílů po stěnách. Ve scéně vykreslení žádné světlo není: tenhle systém zapisuje barvu vrcholů do polí, která mu
// vykreslení půjčuje (render.statics, ovladače dílů), a po změně na ně sáhne (touch).
//
// Změna se jen poznamená (setLight, moveLight, touchMover, setGate) a provede se jednou před vykreslením (flush):
// lampa přepnutá desetkrát mezi dvěma snímky stojí jeden průchod své vrstvy.

import { lightIrradiance } from '../xspace/index.js';
import { buildLayer, adjacency, addSeg, fillAmbient, E_MIN, INV_PI, SAMPLE_LIFT } from './lightfield.js';
import { mapSamples, bakedBase, bakedSegs, bakeId } from './baked.js';

const MOVER_REACH = 2.5; // m; díl takhle daleko za dosahem světla se při změně světla nepřepočítává (rozměr dílu)
const BUILD_SLICE_MS = 8; // při postupné stavbě vrstev: kolik času smí stavba zabrat v jednom snímku

export function createLighting({ render, now = () => performance.now() }) {
  const lights = [];
  const pending = []; // světla, kterým se změnila úroveň, poloha nebo brána
  const movers = []; // { matrix, parts: [{ colors, touch, facets }], dirty }
  const dirtyMovers = [];
  const dirtyTargets = [];
  let targets = [];
  let ambient = [0, 0, 0];
  let built = false; // cíle jsou připravené (barvy vyplněné okolním členem)
  let toBuild = 0; // index prvního světla, které ještě nemá vrstvu; lights.length = hotovo
  /** Zastínění a brány (occlusion.js): { gateOf(světlo, x, y, z), buried(x, y, z) }. null = světlo prochází vším. */
  let occ = null;
  let gateOf = null;
  /** Zjemnění okraje stínu (lightfield.soften): { reach, n } nebo null. */
  let softOpts = null;
  /** Úroveň bran: index 0 = volná cesta (vždy 1), další = otevření dveří 0 až 1. */
  let gateLevel = [1];
  let gateLights = [[]]; // brána → světla, která skrz ni svítí
  /** Zapečené světlo levelu (D-044): { decoded, gateFor, brushOnly } nebo null; bakeMap = vzorky → vrcholy dávek. */
  let bake = null;
  let bakeMap = null;
  const stat = { lights: 0, samples: 0, entries: 0, softened: 0, gated: 0, movers: 0, buildMs: 0, prepMs: 0, flushes: 0, applied: 0, relit: 0, baked: 0, bakeNote: '' };

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
      const want = base * (gateLevel[s.gate] ?? 1);
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
    if (L.bakedLayer && bakeMap) {
      // zapečená vrstva (D-044) + běh jen pro vrcholy, které soubor nenese (sítě .glb, díly bez vzorku)
      const b = bakedSegs(L.bakedLayer, bakeMap, bake.gateFor);
      const rt = buildLayer(L, targets, gateOf, softOpts, true);
      L.layer = { segs: b.segs.concat(rt.segs), samples: b.samples + rt.samples, softened: rt.softened };
    } else L.layer = buildLayer(L, targets, gateOf, softOpts);
    L.layer.built = true;
    stat.entries += L.layer.samples;
    stat.softened += L.layer.softened;
    for (const s of L.layer.segs) {
      s.applied = 0;
      if (s.gate > 0) {
        stat.gated += s.idx.length;
        while (gateLights.length <= s.gate) gateLights.push([]);
        if (!gateLights[s.gate].includes(L)) gateLights[s.gate].push(L);
      }
    }
  }
  /** Postaví vrstvy dalších světel; skončí po vyčerpání času (budgetMs) nebo světel. Vrací true, když je hotovo. */
  function buildSome(budgetMs) {
    if (toBuild >= lights.length) return true;
    const t0 = now();
    while (toBuild < lights.length) {
      const L = lights[toBuild++];
      buildLight(L);
      L.queued = false;
      L.moved = false;
      applyLight(L);
      markMoversNear(L);
      if (now() - t0 >= budgetMs) break;
    }
    stat.buildMs += now() - t0;
    return toBuild >= lights.length;
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
    stat.entries -= L.layer.samples;
    for (const seg of L.layer.segs) if (seg.gate > 0) stat.gated -= seg.idx.length;
    L.eye = null; // bod pro zkoušku zastínění se určí znovu
    L.bakedLayer = null; // pohnuté světlo zapečený soubor nepopisuje
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
        const g = gateOf(L, wx, wy, wz);
        L.moverK = g < 0 ? 0 : L.moverK * (gateLevel[g] ?? 1);
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
    /** Zastínění zapnuto (výchozí). Vypíná se jen pro srovnání s xView, který stíny nemá; platí od příštího načtení levelu. */
    shadows: true,
    /** Okraj stínu po podílech plošky vzorku: true = výchozí počet paprsků, číslo = bodů na stranu, false = jeden paprsek na vzorek. */
    soft: true,
    /** true = vrstvy se staví po částech ve snímcích (hra v prohlížeči); false = celé při načtení (testy, Node). */
    incremental: false,
    /** Podíl světel, která už mají vrstvu (0 až 1). */
    get progress() {
      return !built ? 0 : lights.length ? toBuild / lights.length : 1;
    },

    /** Nový level: prostředí a prázdné seznamy. V pořadí načítání je první, svět a entity do něj hlásí světla a díly. */
    load(ctx) {
      sys.unload();
      // okolní světlo je v datech osvětlení E jako ostatní světlo (D-049): do barvy vrcholu jde E / π
      ambient = (ctx.level.env?.ambient || [0, 0, 0]).map((a) => a * INV_PI);
    },
    unload() {
      lights.length = 0;
      pending.length = 0;
      movers.length = 0;
      dirtyMovers.length = 0;
      dirtyTargets.length = 0;
      targets = [];
      gateLevel = [1];
      gateLights = [[]];
      bake = null;
      bakeMap = null;
      built = false;
      toBuild = 0;
      Object.assign(stat, { lights: 0, samples: 0, entries: 0, softened: 0, gated: 0, movers: 0, buildMs: 0, prepMs: 0, flushes: 0, applied: 0, relit: 0, baked: 0, bakeNote: '' });
    },
    /** Zapečené světlo pro příští prepare (D-044): { decoded, gateFor, brushOnly } nebo null; note = proč není. */
    setBake(b, note = '') {
      bake = b;
      stat.bakeNote = note;
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
        layer: { segs: [], samples: 0, built: false },
        queued: false,
        moved: false,
        moverK: 0,
      };
      lights.push(L);
      stat.lights = lights.length;
      return L; // vrstvu dostane při stavbě (build nebo buildSome), i když přibylo až za běhu
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
    /** Díl odchází (zbraň v ruce se vyměnila). */
    removeMover(m) {
      if (!m) return;
      const i = movers.indexOf(m);
      if (i >= 0) movers.splice(i, 1);
      const k = dirtyMovers.indexOf(m);
      if (k >= 0) dirtyMovers.splice(k, 1);
      stat.movers = movers.length;
    },
    /** Díl se pohnul. */
    touchMover(m) {
      if (!m || m.dirty) return;
      m.dirty = true;
      dirtyMovers.push(m);
    },

    /** Zastínění a brány (occlusion.js); null = bez zastínění. Volá se před prepare(). */
    setOcclusion(o) {
      occ = o;
    },
    /** Otevření brány 0 až 1 (dveře v portálu). Světla, která skrz ni svítí, se dorovnají při flush. */
    setGate(gate, level) {
      if (!(gate > 0)) return;
      while (gateLevel.length <= gate) gateLevel.push(1);
      while (gateLights.length <= gate) gateLights.push([]);
      if (gateLevel[gate] === level) return;
      gateLevel[gate] = level;
      const list = gateLights[gate];
      for (let i = 0; i < list.length; i++) {
        queue(list[i]);
      }
    },
    gate: (g) => gateLevel[g] ?? 1,

    /**
     * Příprava cílů a stavba vrstev všech světel nad statickými dávkami vykreslení. Volá se po render.closeStatic()
     * a po prvním kroku fyziky (zastínění se ptá Rapieru). V postupném režimu postaví jen přípravu; vrstvy
     * přibývají ve snímcích (frame) a hra mezitím běží s okolním světlem a s tím, co je hotové.
     * (Jméno build() má v jádře jiný význam: volá se jednou při startu. Proto prepare.)
     */
    prepare() {
      const t0 = now();
      targets = render.statics;
      gateOf = sys.shadows && occ ? occ.gateOf : null;
      softOpts = gateOf && sys.soft ? { reach: occ.reach, n: sys.soft === true ? undefined : sys.soft } : null;
      dirtyTargets.length = 0;
      // zapečený soubor platí jen se zastíněním (stíny jsou v něm); bez něj světlo prochází vším jako v xView
      const useBake = !!(bake && gateOf);
      bakeMap = useBake ? mapSamples(targets, bake.decoded.header.samples) : null;
      if (!useBake) for (const T of targets) [T.baked, T.bakedAll] = [null, false];
      stat.baked = 0;
      for (const L of lights) {
        L.bakedLayer = useBake ? bake.decoded.layers.find((y) => (y.kind === 'light' || y.kind === 'entity') && y.id === bakeId(L)) || null : null;
        if (L.bakedLayer) stat.baked++;
      }
      const allBaked = lights.every((L) => L.bakedLayer);
      let samples = 0;
      for (const T of targets) {
        T.dirty = false;
        if (!T.colors) continue;
        fillAmbient(T.colors, ambient);
        touchTarget(T);
        samples += T.count;
        if (gateOf && !(allBaked && T.bakedAll)) {
          // které vzorky leží ve stavbě (jednou na dávku) a sousedé vrcholů pro převzetí viditelnosti
          const P = T.positions;
          const N = T.normals;
          T.buried = new Uint8Array(T.count);
          for (let v = 0, k = 0; v < T.count; v++, k += 3) T.buried[v] = occ.buried(P[k] + N[k] * SAMPLE_LIFT, P[k + 1] + N[k + 1] * SAMPLE_LIFT, P[k + 2] + N[k + 2] * SAMPLE_LIFT) ? 1 : 0;
          T.adj = adjacency(T.indices, T.count);
        }
      }
      if (useBake) bakedBase(bake.decoded, bakeMap, targets, ambient); // okolní člen × přístupnost + odražené světlo
      for (const L of lights) L.eye = null;
      pending.length = 0;
      for (const m of movers) {
        if (m.dirty) continue;
        m.dirty = true;
        dirtyMovers.push(m);
      }
      built = true;
      toBuild = 0;
      stat.samples = samples;
      stat.entries = 0;
      stat.softened = 0;
      stat.gated = 0;
      stat.buildMs = 0;
      stat.prepMs = now() - t0;
      if (!sys.incremental) sys.finish();
      else sys.flush();
    },
    /** Dostaví zbývající vrstvy naráz (testy, měření, snímky). */
    finish() {
      if (!built) return;
      buildSome(Infinity);
      sys.flush();
    },
    /** Postupná stavba: kousek v každém snímku, dokud není hotovo. */
    frame() {
      if (!built || toBuild >= lights.length) return;
      buildSome(BUILD_SLICE_MS);
      render.invalidate();
    },

    /** Provede poznamenané změny. Volá se před každým vykreslením (render.beforeDraw) a z testů. */
    flush() {
      if (!built) return;
      if (gateOf) occ.update(); // otevření dveří do bran
      if (!sys.incremental && toBuild < lights.length) buildSome(Infinity); // světlo přidané za běhu
      for (let i = 0; i < pending.length; i++) {
        const L = pending[i];
        L.queued = false;
        if (!L.layer.built) continue; // světlo čeká na stavbu vrstvy; ta přečte jeho současný stav
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
          return [...gateLevel];
        case 'progress':
          return sys.progress;
        default:
          return undefined;
      }
    },
  };
  return sys;
}
