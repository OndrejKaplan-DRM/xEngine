// xRender bez obrazu: stejné rozhraní jako render.js, jen počítá. Slouží testům v Node (svět, fyzika a hráč
// se dají ověřit bez prohlížeče za zlomek sekundy) a budoucímu serveru nebo zapékání.

import { newBatch, appendMesh } from './batch.js';

export function createNullRender() {
  let batches = new Map();
  const counts = { batches: 0, movers: 0, lights: 0, cells: 0, staticTris: 0, moverTris: 0, screens: 0, screenDraws: 0 };
  const lights = [];
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
    setDefs() {},
    openLevel({ cells }) {
      batches = new Map();
      lights.length = 0;
      Object.assign(counts, { batches: 0, movers: 0, lights: 0, cells: cells.length, staticTris: 0, moverTris: 0, screens: 0, screenDraws: 0 });
    },
    addStatic(cellId, matId, mesh, start, count, matrix, uvScale) {
      const key = `${cellId}|${matId}`;
      if (!batches.has(key)) batches.set(key, newBatch());
      appendMesh(batches.get(key), mesh, start, count, matrix, uvScale);
    },
    closeStatic() {
      counts.batches = batches.size;
      for (const b of batches.values()) counts.staticTris += b.tris;
      batches = new Map();
    },
    addMover(cellId, pieces) {
      counts.movers++;
      for (const p of pieces) counts.moverTris += p.batch.tris;
      return { setMatrix() {}, setVisible() {}, setMaterial() {}, setCell() {} };
    },
    addScreen() {
      counts.screens++;
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
    setVisibleCells() {},
    invalidate() {},
    resize() {},
    measure: () => ({ calls: 0, tris: 0 }),
    shot: () => null,
  };
  return sys;
}
