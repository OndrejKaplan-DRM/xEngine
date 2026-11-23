// xRender bez obrazu: stejné rozhraní jako render.js, jen počítá. Slouží testům v Node (svět, fyzika a hráč
// se dají ověřit bez prohlížeče za zlomek sekundy) a budoucímu serveru nebo zapékání.

import { newBatch, appendMesh } from './batch.js';

export function createNullRender() {
  let batches = new Map();
  const counts = { batches: 0, movers: 0, lights: 0, cells: 0, staticTris: 0, moverTris: 0, screens: 0, screenDraws: 0, visibleCells: 0, activeLights: 0, calls: 0 };
  const lights = [];
  const drawables = []; // co by se kreslilo: { cells: [id], meshes, on }
  let visibleIds = null;
  let cellCount = 0;
  const sys = {
    name: 'render',
    phase: 'view',
    headless: true,
    fov: 90,
    baseFov: 90,
    scale: 1,
    lightBudget: 8,
    aspect: 16 / 9,
    view: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    counts,
    lights,
    beforeDraw: null,
    debugLines: null,
    setDefs() {},
    openLevel({ cells }) {
      batches = new Map();
      lights.length = 0;
      drawables.length = 0;
      visibleIds = null;
      cellCount = cells.length;
      Object.assign(counts, { batches: 0, movers: 0, lights: 0, cells: cells.length, staticTris: 0, moverTris: 0, screens: 0, screenDraws: 0, visibleCells: cells.length, activeLights: 0, calls: 0 });
    },
    addStatic(cellId, matId, mesh, start, count, matrix, uvScale) {
      const key = `${cellId}|${matId}`;
      if (!batches.has(key)) batches.set(key, newBatch());
      appendMesh(batches.get(key), mesh, start, count, matrix, uvScale);
    },
    closeStatic() {
      counts.batches = batches.size;
      for (const [key, b] of batches) {
        counts.staticTris += b.tris;
        drawables.push({ cells: [key.split('|')[0]], meshes: 1, on: true });
      }
      batches = new Map();
    },
    addMover(cellId, pieces, alsoCells = null) {
      counts.movers++;
      for (const p of pieces) counts.moverTris += p.batch.tris;
      const rec = { cells: [cellId, ...(alsoCells || [])], meshes: pieces.length, on: true };
      drawables.push(rec);
      return {
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
    addLight(rec) {
      lights.push(rec);
      counts.lights = lights.length;
    },
    closeLevel() {},
    setView(x, y, z, yaw, pitch) {
      Object.assign(sys.view, { x, y, z, yaw, pitch });
    },
    setFov(v) {
      sys.fov = sys.baseFov = v;
    },
    setViewFov(v) {
      sys.fov = v ?? sys.baseFov;
    },
    setScale(s) {
      sys.scale = s;
    },
    setLightBudget(n) {
      sys.lightBudget = n;
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
    /** Místo vykreslení jen přepočet viditelnosti a rozpočtu světel, stejně jako draw() ve skutečném vykreslení. */
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
      let active = 0;
      for (const l of lights) if (l.on && l.level > 0 && l.intensity > 0 && l.seen !== false) active++;
      counts.activeLights = Math.min(active, sys.lightBudget);
      counts.calls = calls;
      return { calls, tris: 0 };
    },
    shot: () => null,
  };
  return sys;
}
