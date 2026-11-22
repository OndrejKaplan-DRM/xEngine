// xRender: plátno, scéna, kamera, statické dávky po buňce a materiálu, pohyblivé díly, rozpočet světel.
// Nezná level ani prefaby: xWorld mu předává hotové sítě a záznamy světel. Kontrakt: fáze 'view'.
// Vrstva 0 = svět. Vrstva 1 je vyhrazená pro zbraň a ruce v druhém průchodu (10_CASE_FPS, F5); nic do ní nedávat.

import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { newBatch, appendMesh } from './batch.js';

const BACKGROUND = 0x0b0d12;
const MAX_LIGHTS = 16;

function toGeometry(b) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uvs, 2));
  geo.setIndex(b.indices);
  geo.computeBoundingSphere();
  return geo;
}

export function createRender({ canvas, antialias = true, pixelRatio = () => globalThis.devicePixelRatio || 1 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // světla jsou v kandelách, do rozsahu displeje převádí expozice levelu
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  const camera = new THREE.PerspectiveCamera(90, 1, 0.05, 400);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  const ambient = new THREE.AmbientLight(0xffffff, 0);
  scene.add(ambient);
  const materials = createMaterials();

  let E = null;
  let dirty = true;
  let levelRoot = null;
  let cells = new Map(); // id buňky → { group, pending: Map(materiál → dávka) }
  const lightRecs = []; // záznamy světel levelu a lamp; vlastní je xWorld, tady se jen čtou
  const pool = []; // THREE.PointLight, velikost = rozpočet
  const order = new Int16Array(64);
  const score = new Float32Array(64);
  const counts = { batches: 0, movers: 0, lights: 0, cells: 0, staticTris: 0, moverTris: 0, activeLights: 0 };

  function setPool(n) {
    while (pool.length > n) scene.remove(pool.pop());
    while (pool.length < n) {
      const l = new THREE.PointLight(0xffffff, 0, 1, 2);
      pool.push(l);
      scene.add(l);
    }
  }

  /** Vybere nejvýš N nejvýznamnějších svítících světel z viditelných buněk a zapíše je do fondu. Bez alokací. */
  function assignLights() {
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    let n = 0;
    const total = Math.min(lightRecs.length, order.length);
    for (let i = 0; i < total; i++) {
      const r = lightRecs[i];
      if (!r.on || r.level <= 0 || r.intensity <= 0) continue;
      const cell = cells.get(r.cell);
      if (cell && !cell.group.visible) continue;
      const dx = r.pos[0] - cx;
      const dy = r.pos[1] - cy;
      const dz = r.pos[2] - cz;
      const s = (r.intensity * r.level) / Math.max(dx * dx + dy * dy + dz * dz, 1);
      // vkládání do seřazeného pole (sestupně podle významu)
      let k = n++;
      while (k > 0 && score[k - 1] < s) {
        score[k] = score[k - 1];
        order[k] = order[k - 1];
        k--;
      }
      score[k] = s;
      order[k] = i;
    }
    const used = Math.min(n, pool.length);
    for (let k = 0; k < pool.length; k++) {
      const l = pool[k];
      if (k < used) {
        const r = lightRecs[order[k]];
        l.position.set(r.pos[0], r.pos[1], r.pos[2]);
        l.color.setRGB(r.color[0], r.color[1], r.color[2]);
        l.intensity = r.intensity * r.level;
        l.distance = r.range || 0;
      } else {
        l.intensity = 0;
      }
    }
    counts.activeLights = used;
  }

  function draw() {
    assignLights();
    renderer.render(scene, camera);
    dirty = false;
  }

  const sys = {
    name: 'render',
    phase: 'view',
    headless: false,
    renderer,
    scene,
    camera,
    materials,
    counts,
    lights: lightRecs,
    baseFov: 90,
    scale: 1,
    get fov() {
      return camera.fov;
    },
    get lightBudget() {
      return pool.length;
    },

    init(engine) {
      E = engine;
      E.on('mode', () => (dirty = true));
      setPool(8);
      sys.resize();
    },

    // ---- level
    setDefs(defs) {
      materials.setDefs(defs);
    },
    openLevel({ env, cells: cellDefs }) {
      sys.closeLevel();
      levelRoot = new THREE.Group();
      scene.add(levelRoot);
      cells = new Map();
      for (const c of cellDefs) {
        const group = new THREE.Group();
        group.name = c.id;
        levelRoot.add(group);
        cells.set(c.id, { group, pending: new Map() });
      }
      counts.cells = cells.size;
      ambient.color.setRGB(...(env?.ambient || [0, 0, 0]));
      ambient.intensity = Math.PI; // shodně s xView: jas povrchu = barva / π · E
      renderer.toneMappingExposure = env?.exposure ?? 1;
      if (env?.fog) {
        scene.fog = new THREE.FogExp2(new THREE.Color(...env.fog.color), env.fog.density);
        scene.background = new THREE.Color(...env.fog.color);
      } else {
        scene.fog = null;
        scene.background = new THREE.Color(BACKGROUND);
      }
      dirty = true;
    },
    /** Statická geometrie: sbírá se do dávek po buňce a materiálu, sítě vzniknou v closeStatic(). */
    addStatic(cellId, matId, mesh, start, count, matrix, uvScale) {
      const cell = cells.get(cellId);
      if (!cell) throw new Error(`Statická geometrie pro neznámou buňku „${cellId}“.`);
      let b = cell.pending.get(matId);
      if (!b) cell.pending.set(matId, (b = newBatch()));
      appendMesh(b, mesh, start, count, matrix, uvScale);
    },
    closeStatic() {
      for (const cell of cells.values()) {
        for (const [matId, b] of cell.pending) {
          const mesh = new THREE.Mesh(toGeometry(b), materials.get(matId));
          mesh.matrixAutoUpdate = false;
          cell.group.add(mesh);
          counts.batches++;
          counts.staticTris += b.tris;
        }
        cell.pending.clear();
      }
      dirty = true;
    },
    /**
     * Pohyblivý díl (uzel kostry nebo dynamické těleso): pieces = [{ mat, batch }] v prostoru uzlu.
     * Vrací ovladač; matice je 4×4 po sloupcích ve světě.
     */
    addMover(cellId, pieces) {
      const group = new THREE.Group();
      group.matrixAutoUpdate = false;
      const meshes = pieces.map((p) => {
        const mesh = new THREE.Mesh(toGeometry(p.batch), materials.get(p.mat));
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
        counts.moverTris += p.batch.tris;
        return mesh;
      });
      (cells.get(cellId)?.group || levelRoot).add(group);
      counts.movers += meshes.length;
      return {
        setMatrix(m) {
          group.matrix.fromArray(m);
          group.matrixWorldNeedsUpdate = true;
          dirty = true;
        },
        setVisible(on) {
          group.visible = on;
          dirty = true;
        },
        setMaterial(i, matId) {
          meshes[i].material = materials.get(matId);
          dirty = true;
        },
        setCell(id) {
          const next = cells.get(id)?.group;
          if (next && group.parent !== next) next.add(group);
        },
      };
    },
    /** Záznam světla { id, cell, pos, color, intensity, range, on, level }; vlastník ho smí měnit, pak zavolá invalidate(). */
    addLight(rec) {
      lightRecs.push(rec);
      counts.lights = lightRecs.length;
      dirty = true;
    },
    closeLevel() {
      if (!levelRoot) return;
      levelRoot.traverse((o) => o.geometry?.dispose());
      scene.remove(levelRoot);
      levelRoot = null;
      cells = new Map();
      lightRecs.length = 0;
      Object.assign(counts, { batches: 0, movers: 0, lights: 0, cells: 0, staticTris: 0, moverTris: 0, activeLights: 0 });
    },
    /** Které buňky se kreslí (viditelnost přes portály). null = všechny. */
    setVisibleCells(ids) {
      for (const [id, cell] of cells) {
        const on = !ids || ids.has(id);
        if (cell.group.visible !== on) {
          cell.group.visible = on;
          dirty = true;
        }
      }
    },

    // ---- pohled a nastavení
    setView(x, y, z, yaw, pitch) {
      const p = camera.position;
      const r = camera.rotation;
      if (p.x === x && p.y === y && p.z === z && r.y === yaw && r.x === pitch) return; // stojící kamera nepřekresluje pauzu
      p.set(x, y, z);
      r.set(pitch, yaw, 0);
      dirty = true;
    },
    setFov(v) {
      sys.baseFov = v;
      sys.setViewFov(null);
    },
    /** Dočasné zorné pole (klidný režim u terminálu); null vrací nastavenou hodnotu. */
    setViewFov(v) {
      const next = v ?? sys.baseFov;
      if (camera.fov === next) return;
      camera.fov = next;
      camera.updateProjectionMatrix();
      dirty = true;
    },
    setScale(s) {
      sys.scale = s;
      sys.resize();
    },
    setLightBudget(n) {
      setPool(Math.max(0, Math.min(MAX_LIGHTS, n | 0)));
      dirty = true;
    },
    resize() {
      const w = canvas.clientWidth || globalThis.innerWidth || 1;
      const h = canvas.clientHeight || globalThis.innerHeight || 1;
      renderer.setPixelRatio(Math.min(pixelRatio(), 2) * sys.scale);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    },
    invalidate() {
      dirty = true;
    },

    frame() {
      // v pauze a v menu se překresluje jen po změně (rozmazaná pauza Shellu je pak zadarmo)
      if (E.mode === 'playing' || dirty) draw();
    },

    // ---- měření a testy
    /** Jeden snímek a jeho cena. */
    measure() {
      renderer.info.autoReset = false;
      renderer.info.reset();
      draw();
      const out = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
      renderer.info.autoReset = true;
      return out;
    },
    /** Snímek z plátna ve stejné úloze jako vykreslení. */
    shot() {
      draw();
      return canvas.toDataURL('image/png');
    },
  };
  return sys;
}
