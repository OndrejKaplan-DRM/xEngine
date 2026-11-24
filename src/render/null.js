// xRender bez obrazu: stejné rozhraní jako render.js, jen počítá. Slouží testům v Node (svět, fyzika, hráč a světlo
// po vrcholech se dají ověřit bez prohlížeče za zlomek sekundy) a budoucímu serveru nebo zapékání.

import { newBatch, appendMesh, finishBatch } from './batch.js';
import { cameraVfov } from './fov.js';
import { DEFAULT_ROWS } from './rows.js';

export function createNullRender({ isLit = () => true } = {}) {
  let batches = new Map();
  let lit = isLit;
  const counts = { batches: 0, movers: 0, cells: 0, staticTris: 0, moverTris: 0, screens: 0, screenDraws: 0, visibleCells: 0, calls: 0, touches: 0 };
  const statics = [];
  const drawables = []; // co by se kreslilo: { cells: [id], meshes, on }
  let visibleIds = null;
  let cellCount = 0;
  const sys = {
    name: 'render',
    phase: 'view',
    headless: true,
    fov: cameraVfov(90, 16 / 9),
    baseFov: 90,
    rows: DEFAULT_ROWS,
    antialias: false,
    get size() {
      return [Math.round(sys.rows * sys.aspect), sys.rows];
    },
    aspect: 16 / 9,
    view: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    counts,
    statics,
    beforeDraw: null,
    debugLines: null,
    /** Bez three.js se o materiálech ví jen to, co je v datech: na světlo reaguje model 'lit'. */
    setDefs(defs) {
      lit = (id) => defs?.[id]?.model === 'lit';
    },
    openLevel({ cells }) {
      batches = new Map();
      statics.length = 0;
      drawables.length = 0;
      visibleIds = null;
      cellCount = cells.length;
      Object.assign(counts, { batches: 0, movers: 0, cells: cells.length, staticTris: 0, moverTris: 0, screens: 0, screenDraws: 0, visibleCells: cells.length, calls: 0, touches: 0 });
    },
    addStatic(cellId, matId, mesh, start, count, matrix, uvScale) {
      const key = `${cellId}|${matId}`;
      if (!batches.has(key)) batches.set(key, newBatch());
      appendMesh(batches.get(key), mesh, start, count, matrix, uvScale);
    },
    closeStatic() {
      counts.batches = batches.size;
      for (const [key, pending] of batches) {
        const [cell, mat] = key.split('|');
        const b = finishBatch(pending, lit(mat));
        b.cell = cell;
        b.mat = mat;
        b.touch = () => counts.touches++;
        statics.push(b);
        counts.staticTris += b.tris;
        drawables.push({ cells: [cell], meshes: 1, on: true });
      }
      batches = new Map();
    },
    addMover(cellId, pieces, alsoCells = null) {
      counts.movers++;
      const rec = { cells: [cellId, ...(alsoCells || [])], meshes: pieces.length, on: true };
      drawables.push(rec);
      return {
        pieces: pieces.map((p) => {
          const b = finishBatch(p.batch, lit(p.mat));
          counts.moverTris += b.tris;
          return { colors: b.colors, touch: () => counts.touches++ };
        }),
        setMatrix() {},
        setVisible(on) {
          rec.on = on;
        },
        setMaterial() {},
        setCell(id) {
          if (rec.cells.length === 1) rec.cells[0] = id;
        },
      };
    },
    addScreen({ cell }) {
      counts.screens++;
      drawables.push({ cells: [cell], meshes: 1, on: true });
      return {
        draw() {
          counts.screenDraws++; // obsah se bez plátna nekreslí; text terminálu je vidět přes interact.inspect
        },
      };
    },
    addShutter(cellIds) {
      const rec = { cells: cellIds, meshes: 1, on: false };
      drawables.push(rec);
      return {
        setVisible(on) {
          rec.on = on;
        },
      };
    },
    closeLevel() {},
    setView(x, y, z, yaw, pitch) {
      Object.assign(sys.view, { x, y, z, yaw, pitch });
    },
    redraw() {},
    setFov(v) {
      sys.baseFov = v;
      sys.fov = sys.baseVfov;
    },
    get baseVfov() {
      return cameraVfov(sys.baseFov, sys.aspect);
    },
    setViewFov(v) {
      sys.fov = v ?? sys.baseVfov;
    },
    setRows(n) {
      sys.rows = n;
    },
    setAntialias(on) {
      sys.antialias = !!on;
    },
    setVisibleCells(ids) {
      visibleIds = ids ? new Set(ids) : null;
      counts.visibleCells = ids ? visibleIds.size : cellCount;
    },
    setDebugLines(data) {
      sys.debugLines = data;
    },
    invalidate() {},
    resize() {},
    /** Místo vykreslení jen přepočet viditelnosti a světla, stejně jako draw() ve skutečném vykreslení. */
    frame() {
      sys.measure();
    },
    /**
     * Kolik volání kreslení by snímek stál: jedna síť = jedno volání, počítají se jen sítě ve viditelných buňkách.
     * Ořez pohledem (kužel kamery) se tu nepočítá, takže číslo je horní mez pro daný pohled.
     */
    measure() {
      sys.beforeDraw?.();
      let calls = 0;
      for (const d of drawables) if (d.on && (!visibleIds || d.cells.some((c) => visibleIds.has(c)))) calls += d.meshes;
      counts.calls = calls;
      return { calls, tris: 0 };
    },
    shot: () => null,
  };
  return sys;
}
