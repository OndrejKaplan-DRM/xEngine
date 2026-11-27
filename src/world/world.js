// xWorld: level z dat xSpace. Staví statický svět (kolize přes brushCollider, viditelná geometrie přes
// brushLightMesh sloučená po buňce a materiálu; její vrcholy jsou vzorky světla, D-022), drží buňky, portály, světla levelu a spouštěče. O kvádru neví nic, co neříká
// src/xspace/geom.js; o konkrétním levelu neví nic, co není v datech.

import { levelLightMeshes, brushCollider, inBounds, boundsGap, LIGHT_CELL } from '../xspace/index.js';
import { isTransparent } from '../render/opacity.js';
import { faceCells } from './cells.js';

export function createWorld({ phys, render, light, pack, assets = null }) {
  const matDefs = pack.materials?.materials || {};
  let level = null;
  let cells = [];
  let triggers = []; // { def, inside, done }
  let io = null; // doplní se při načtení (spojení výstupů spouštěčů)
  const lightRecs = [];
  const stat = { brushes: 0, brushColliders: 0, brushTris: 0, drawnTris: 0, batchKeys: 0, lightCell: LIGHT_CELL, brushSamples: 0, brushCounts: [] };
  const seenBy = [];
  /** Obal postavy, kterou sledují spouštěče. Zapisuje ho xPlay v každém kroku. */
  const actor = { min: [0, 0, 0], max: [0, 0, 0], active: false };

  const uvScale = (matId) => matDefs[matId]?.uvScale || 1;
  /** Všechny plochy kvádru mají průhledný materiál (vis: false se počítá jako neprůhledný: stíní dál). */
  const brushSeeThrough = (b) => b.vis !== false && [b.mat, ...Object.values(b.faces || {})].every((m) => isTransparent(matDefs[m]));

  const sys = {
    name: 'world',
    phase: 'late',
    actor,
    stat,
    /**
     * Krok mřížky světla (m). Výchozí je kontrakt (LIGHT_CELL = 0,5 m; na něm stojí zapečené světlo z xBake).
     * Jemnější krok je volba pro světlo počítané při načtení: 0,25 m = čtyřikrát víc vzorků a trojúhelníků.
     * Projeví se při dalším načtení levelu (stat.lightCell říká, s čím je level postavený).
     */
    lightCell: LIGHT_CELL,
    /** id kvádru → plochy [{ n: normála, cells: buňky, do jejichž dávek plocha jde }] (zkouška viditelnosti N-014). */
    brushFaces: new Map(),
    get level() {
      return level;
    },
    get cells() {
      return cells;
    },
    get portals() {
      return level?.portals || [];
    },

    /** Načtení levelu: statická stavba, světla, spouštěče. Volá ho game.loadLevel v daném pořadí systémů. */
    load(ctx) {
      level = ctx.level;
      io = ctx.io || null;
      cells = level.cells;
      render.setDefs(matDefs, assets); // textury barvy (albedo) bere vykreslení ze souborů balíku
      render.openLevel({ env: level.env, cells });
      const keys = new Set();
      sys.brushFaces.clear();
      Object.assign(stat, { brushes: 0, brushColliders: 0, brushTris: 0, drawnTris: 0, batchKeys: 0, lightCell: sys.lightCell, brushSamples: 0, brushCounts: [] });
      // vzorky světla levelu podle kontraktu (D-037): mřížka na násobcích buňky ve světě, bez ploch schovaných v jiném kvádru
      const brushes = level.brushes || [];
      const meshes = levelLightMeshes(brushes, matDefs, sys.lightCell);
      for (let bi = 0; bi < brushes.length; bi++) {
        const b = brushes[bi];
        stat.brushes++;
        const m = meshes[bi];
        // vzorky světla v pořadí kontraktu (D-041): vrcholy sítí kvádrů za sebou, kvádr po kvádru
        const base = stat.brushSamples;
        const n = m ? m.positions.length / 3 : 0;
        stat.brushCounts.push([b.id, n]);
        stat.brushSamples += n;
        if (m) {
          const faces = [];
          for (const g of m.groups) {
            const matId = (b.faces && b.faces[g.face]) || b.mat;
            // plocha jde do dávky každé buňky, která ji vidí (stěna mezi dvěma místnostmi má dvě strany)
            faceCells(m, g, b, cells, seenBy);
            const ni = m.indices[g.start] * 3;
            faces.push({ n: [m.normals[ni], m.normals[ni + 1], m.normals[ni + 2]], cells: [...seenBy] }); // zkouška N-014
            for (const cellId of seenBy) {
              render.addStatic(cellId, matId, m, g.start, g.count, null, uvScale(matId), base);
              keys.add(`${cellId}|${matId}`);
              stat.drawnTris += g.count / 3;
            }
            stat.brushTris += g.count / 3;
          }
          sys.brushFaces.set(b.id, faces);
        }
        if (b.col !== false) {
          const c = brushCollider(b);
          // kvádr, který je celý průhledný (sklo), koliduje, ale světlo nestíní (skupina world místo brush)
          const group = brushSeeThrough(b) ? 'world' : 'brush';
          const ref = { kind: 'brush', id: b.id, mat: b.mat };
          if (c.type === 'cuboid') phys.addCollider(null, { type: 'box', half: c.half }, c.center, null, { group }, ref);
          else phys.addCollider(null, { type: 'hull', points: c.points }, [0, 0, 0], null, { group }, ref);
          stat.brushColliders++;
        }
      }
      stat.batchKeys = keys.size;

      lightRecs.length = 0;
      for (const l of level.lights || []) {
        // bodové, kuželové i slunce počítá lightIrradiance; slunce bez zastínění by svítilo skrz strop, proto až s ním
        if (l.type === 'sun' && !light.shadows) continue;
        lightRecs.push(light.addLight(l, { id: l.id, cell: l.cell }));
      }
      triggers = (level.triggers || []).map((def) => ({ def, inside: false, done: false }));
    },
    unload() {
      level = null;
      cells = [];
      triggers = [];
      lightRecs.length = 0;
    },

    reset() {
      for (const t of triggers) {
        t.inside = false;
        t.done = false;
      }
      actor.active = false;
    },

    /** Spouštěče: obal postavy proti objemu, výstupy enter a exit jdou do fronty spojení. */
    step() {
      if (!actor.active || !io) return;
      for (let i = 0; i < triggers.length; i++) {
        const t = triggers[i];
        if (t.done) continue;
        const inside = boundsGap(actor, t.def) === 0;
        if (inside === t.inside) continue;
        t.inside = inside;
        io.fire('trigger', i, inside ? 'enter' : 'exit', undefined);
        if (inside && t.def.once) t.done = true;
      }
    },

    snapshot() {
      return { triggers: triggers.map((t) => [t.inside ? 1 : 0, t.done ? 1 : 0]) };
    },
    restore(data) {
      (data.triggers || []).forEach((s, i) => {
        if (!triggers[i]) return;
        triggers[i].inside = !!s[0];
        triggers[i].done = !!s[1];
      });
    },

    /** Buňka, ve které bod leží (s tolerancí eps); když v žádné, nejbližší. */
    cellAt(p, eps = 0.01) {
      let best = null;
      let bestGap = Infinity;
      for (const c of cells) {
        if (inBounds(p, c.bounds, eps)) return c;
        const dx = Math.max(c.bounds.min[0] - p[0], 0, p[0] - c.bounds.max[0]);
        const dy = Math.max(c.bounds.min[1] - p[1], 0, p[1] - c.bounds.max[1]);
        const dz = Math.max(c.bounds.min[2] - p[2], 0, p[2] - c.bounds.max[2]);
        const gap = dx * dx + dy * dy + dz * dz;
        if (gap < bestGap) {
          bestGap = gap;
          best = c;
        }
      }
      return best;
    },
    playerSpawn() {
      return level.spawns.find((s) => s.kind === 'player');
    },
    triggerDef: (i) => triggers[i]?.def,

    inspect(path) {
      switch (path[0]) {
        case 'id':
          return level.id;
        case 'stat':
          return { ...stat };
        case 'cells':
          return cells.map((c) => c.id);
        case 'lights':
          return lightRecs.map((l) => ({ id: l.id, on: l.on, level: l.level }));
        case 'trigger': {
          const t = triggers.find((x) => x.def.id === path[1]);
          return t ? { inside: t.inside, done: t.done } : undefined;
        }
        default:
          return undefined;
      }
    },
  };
  return sys;
}
