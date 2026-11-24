// xRender: plátno, scéna, kamera, statické dávky po buňce a materiálu, pohyblivé díly.
// Nezná level ani prefaby: xWorld mu předává hotové sítě. Kontrakt: fáze 'view'.
// Světlo se nepočítá po pixelech (D-022, měření T460): ve scéně není žádné světlo three.js. Sítě nesou barvu
// vrcholů, kterou zapisuje xWorld (src/world/lighting.js) do polí sdílených přes statics a ovladače dílů.
// Vrstva 0 = svět. Vrstva 1 je vyhrazená pro zbraň a ruce v druhém průchodu (10_CASE_FPS, F5); nic do ní nedávat.

import * as THREE from 'three';
import { createMaterials } from './materials.js';
import { newBatch, appendMesh, finishBatch, noteSamples } from './batch.js';
import { cameraVfov, hfovOf } from './fov.js';
import { DEFAULT_ROWS } from './rows.js';

const BACKGROUND = 0x0b0d12;

/** Geometrie z hotové dávky (finishBatch). Barva vrcholů sdílí pole s výpočtem světla. */
function toGeometry(b) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(b.uvs, 2));
  if (b.colors) geo.setAttribute('color', new THREE.BufferAttribute(b.colors, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(new THREE.BufferAttribute(b.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}

export function createRender({ canvas, antialias = false, rows = DEFAULT_ROWS }) {
  let exposure = 1;
  function makeRenderer(cv, aa) {
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: aa, powerPreference: 'high-performance' });
    r.toneMapping = THREE.ACESFilmicToneMapping; // osvětlení je ve fyzikálních jednotkách, do rozsahu displeje převádí expozice levelu
    r.toneMappingExposure = exposure;
    r.setPixelRatio(1); // velikost obrazu určuje počet řádků, ne devicePixelRatio (na T460 je 1,25)
    return r;
  }
  let renderer = makeRenderer(canvas, antialias);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  const camera = new THREE.PerspectiveCamera(90, 1, 0.05, 400);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  const materials = createMaterials({ onChange: () => (dirty = true) }); // dokončená textura: překreslit
  const shutterMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, fog: false, toneMapped: false });

  let E = null;
  let dirty = true;
  let levelRoot = null;
  let cells = new Map(); // id buňky → { group, pending: Map(materiál → dávka) }
  const statics = []; // hotové statické dávky: { cell, mat, positions, normals, colors, count, min, max, touch() }
  const counts = { batches: 0, movers: 0, cells: 0, staticTris: 0, moverTris: 0, screens: 0, visibleCells: 0, calls: 0, tris: 0 };
  let viewFov = null; // dočasný svislý úhel (terminál, snímky); null = podle nastavení
  const screens = []; // obrazovky ve světě: { mesh, tex }
  const shared = []; // díly viditelné z více buněk (křídlo dveří v portálu, clona portálu): { group, cells, on }
  const view = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  let debug = null; // vývojářská vrstva: úsečky přes celou scénu

  function draw() {
    sys.beforeDraw?.(); // viditelnost po buňkách a světlo po vrcholech pro tento snímek (xWorld)
    renderer.render(scene, camera);
    counts.calls = renderer.info.render.calls;
    counts.tris = renderer.info.render.triangles;
    dirty = false;
  }

  const sys = {
    name: 'render',
    phase: 'view',
    headless: false,
    get renderer() {
      return renderer;
    },
    scene,
    camera,
    materials,
    counts,
    /** Statické dávky po closeStatic(); barvy vrcholů do nich zapisuje světlo (touch() po změně). */
    statics,
    /** Současný pohled (radiány); čte ho viditelnost. */
    view,
    /** Háček volaný před každým vykreslením; xWorld sem dává výpočet viditelných buněk a světel. */
    beforeDraw: null,
    /** Vykreslí současný pohled znovu, beze změny stavu (měření ?bench). */
    redraw() {
      renderer.render(scene, camera);
    },
    baseFov: 90,
    rows,
    get antialias() {
      return !!renderer.getContextAttributes().antialias;
    },
    /** Velikost vykreslovací plochy v bodech [šířka, řádky]. */
    get size() {
      return [renderer.domElement.width, renderer.domElement.height];
    },
    get fov() {
      return camera.fov;
    },
    get aspect() {
      return camera.aspect;
    },

    init(engine) {
      E = engine;
      E.on('mode', () => (dirty = true));
      sys.resize();
    },

    // ---- level
    setDefs(defs, assets = null) {
      materials.setDefs(defs, assets);
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
      exposure = env?.exposure ?? 1;
      renderer.toneMappingExposure = exposure;
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
    addStatic(cellId, matId, mesh, start, count, matrix, uvScale, sampleBase = -1) {
      const cell = cells.get(cellId);
      if (!cell) throw new Error(`Statická geometrie pro neznámou buňku „${cellId}“.`);
      let b = cell.pending.get(matId);
      if (!b) cell.pending.set(matId, (b = newBatch()));
      noteSamples(b, appendMesh(b, mesh, start, count, matrix, uvScale), sampleBase); // sampleBase: index vzorku vrcholu 0 sítě (D-041)
    },
    closeStatic() {
      for (const cell of cells.values()) {
        for (const [matId, pending] of cell.pending) {
          const b = finishBatch(pending, materials.isLit(matId));
          const geo = toGeometry(b);
          const mesh = new THREE.Mesh(geo, materials.get(matId));
          mesh.matrixAutoUpdate = false;
          cell.group.add(mesh);
          counts.batches++;
          counts.staticTris += b.tris;
          const color = geo.getAttribute('color');
          b.cell = cell.group.name;
          b.mat = matId;
          b.touch = () => {
            color.needsUpdate = true;
            dirty = true;
          };
          statics.push(b);
        }
        cell.pending.clear();
      }
      dirty = true;
    },
    /**
     * Pohyblivý díl (uzel kostry nebo dynamické těleso): pieces = [{ mat, batch }] v prostoru uzlu.
     * Vrací ovladač; matice je 4×4 po sloupcích ve světě. ovladač.pieces[i] = { colors, touch() } pro světlo
     * (colors je null u materiálu, který na světlo nereaguje).
     */
    addMover(cellId, pieces, alsoCells = null) {
      const group = new THREE.Group();
      group.matrixAutoUpdate = false;
      const lit = [];
      const meshes = pieces.map((p) => {
        const b = finishBatch(p.batch, materials.isLit(p.mat));
        const geo = toGeometry(b);
        const mesh = new THREE.Mesh(geo, materials.get(p.mat));
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
        counts.moverTris += b.tris;
        const color = geo.getAttribute('color');
        lit.push({
          colors: b.colors,
          touch() {
            color.needsUpdate = true;
            dirty = true;
          },
        });
        return mesh;
      });
      // díl viditelný z více buněk (dveře v portálu) nevisí pod jednou buňkou; jeho viditelnost řídí setVisibleCells
      const rec = alsoCells?.length ? { group, cells: [cellId, ...alsoCells], on: true } : null;
      if (rec) shared.push(rec);
      (rec ? levelRoot : cells.get(cellId)?.group || levelRoot).add(group);
      counts.movers += meshes.length;
      return {
        pieces: lit,
        setMatrix(m) {
          group.matrix.fromArray(m);
          group.matrixWorldNeedsUpdate = true;
          dirty = true;
        },
        setVisible(on) {
          if (rec) rec.on = on;
          group.visible = on;
          dirty = true;
        },
        setMaterial(i, matId) {
          meshes[i].material = materials.get(matId);
          dirty = true;
        },
        setCell(id) {
          const next = cells.get(id)?.group;
          if (!rec && next && group.parent !== next) next.add(group);
        },
      };
    },
    /**
     * Obrazovka ve světě: plocha size [š, v] v rovině XY uzlu, líc +Z, posunutá o offset po ose Z uzlu.
     * Obsah je 2D plátno res [š, v] bodů; draw(fn) ho nechá překreslit funkcí fn(ctx, š, v). Svítí sama (bez světel
     * a bez převodu tónů), aby text zůstal čitelný při jakékoli expozici levelu.
     */
    addScreen({ cell, matrix, offset = 0, size, res }) {
      const cv = document.createElement('canvas');
      cv.width = res[0];
      cv.height = res[1];
      const ctx = cv.getContext('2d');
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
      mesh.matrixAutoUpdate = false;
      mesh.matrix.fromArray(matrix).multiply(new THREE.Matrix4().makeTranslation(0, 0, offset));
      (cells.get(cell)?.group || levelRoot).add(mesh);
      screens.push({ mesh, tex });
      counts.screens = screens.length;
      dirty = true;
      return {
        draw(fn) {
          fn(ctx, cv.width, cv.height);
          tex.needsUpdate = true;
          dirty = true;
        },
      };
    },
    /**
     * Clona portálu: černá plocha v otvoru zavřených dveří. Buňka za zavřenými dveřmi se nekreslí, takže by
     * škvírou kolem křídla prosvítalo pozadí scény; clona z ní dělá tmavou spáru. quad = 4 rohy (12 čísel).
     */
    addShutter(cellIds, quad) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(quad), 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      const mesh = new THREE.Mesh(geo, shutterMat);
      mesh.matrixAutoUpdate = false;
      mesh.visible = false;
      levelRoot.add(mesh);
      const rec = { group: mesh, cells: cellIds, on: false };
      shared.push(rec);
      return {
        setVisible(on) {
          if (rec.on === on) return;
          rec.on = on;
          dirty = true;
        },
      };
    },
    closeLevel() {
      if (!levelRoot) return;
      levelRoot.traverse((o) => o.geometry?.dispose());
      for (const sc of screens) {
        sc.tex.dispose();
        sc.mesh.material.dispose();
      }
      screens.length = 0;
      shared.length = 0;
      sys.setDebugLines(null);
      scene.remove(levelRoot);
      levelRoot = null;
      cells = new Map();
      statics.length = 0;
      Object.assign(counts, { batches: 0, movers: 0, cells: 0, staticTris: 0, moverTris: 0, screens: 0, visibleCells: 0, calls: 0, tris: 0 });
    },
    /** Které buňky se kreslí (viditelnost přes portály). null = všechny. */
    setVisibleCells(ids) {
      let n = 0;
      for (const [id, cell] of cells) {
        const on = !ids || ids.has(id);
        if (on) n++;
        if (cell.group.visible !== on) {
          cell.group.visible = on;
          dirty = true;
        }
      }
      counts.visibleCells = n;
      for (let i = 0; i < shared.length; i++) {
        const s = shared[i];
        let on = !ids;
        for (let k = 0; k < s.cells.length && !on; k++) on = ids.has(s.cells[k]);
        on = on && s.on;
        if (s.group.visible !== on) {
          s.group.visible = on;
          dirty = true;
        }
      }
    },
    /** Vývojářská vrstva: barevné úsečky kreslené přes scénu (obrysy buněk a portálů). null ji schová. */
    setDebugLines(data) {
      if (debug) {
        scene.remove(debug);
        debug.geometry.dispose();
        debug.material.dispose();
        debug = null;
      }
      if (data) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
        debug = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, transparent: true, toneMapped: false, fog: false }));
        debug.renderOrder = 999;
        debug.frustumCulled = false;
        scene.add(debug);
      }
      dirty = true;
    },

    // ---- pohled a nastavení
    setView(x, y, z, yaw, pitch) {
      const p = camera.position;
      const r = camera.rotation;
      if (p.x === x && p.y === y && p.z === z && r.y === yaw && r.x === pitch) return; // stojící kamera nepřekresluje pauzu
      p.set(x, y, z);
      r.set(pitch, yaw, 0);
      view.x = x;
      view.y = y;
      view.z = z;
      view.yaw = yaw;
      view.pitch = pitch;
      dirty = true;
    },
    /** Zorné pole z nastavení: vodorovný úhel při poměru stran 4 : 3 (fov.js). */
    setFov(v) {
      sys.baseFov = v;
      sys.setViewFov(null);
    },
    /** Svislý úhel kamery, který z nastavení plyne pro tohle okno (se stropem vodorovného úhlu). */
    get baseVfov() {
      return cameraVfov(sys.baseFov, camera.aspect);
    },
    /** Vodorovný úhel, který je právě vidět. */
    get hfov() {
      return hfovOf(camera.fov, camera.aspect);
    },
    /** Dočasné zorné pole jako svislý úhel (klidný režim u terminálu, snímky testů); null vrací nastavenou hodnotu. */
    setViewFov(v) {
      viewFov = v ?? null;
      const next = viewFov ?? sys.baseVfov;
      if (camera.fov === next) return;
      camera.fov = next;
      camera.updateProjectionMatrix();
      dirty = true;
    },
    /** Vnitřní rozlišení: pevný počet řádků (nejvýš fyzická výška plátna, D-039), šířka podle poměru stran okna. */
    setRows(n) {
      sys.rows = n;
      sys.resize();
    },
    /**
     * Vyhlazování hran je vlastnost kontextu WebGL a za běhu se přepnout nedá: přepnutí vymění plátno za nové
     * a vykreslovač postaví znovu. Scéna zůstává; její sítě a textury si nový kontext nahraje sám.
     */
    setAntialias(on) {
      if (!!on === sys.antialias) return;
      const old = renderer;
      const cv = old.domElement;
      const next = cv.cloneNode(false);
      const lose = old.getContext().getExtension('WEBGL_lose_context');
      old.dispose();
      lose?.loseContext();
      cv.replaceWith(next);
      canvas = next;
      renderer = makeRenderer(next, !!on);
      sys.resize();
    },
    /** Zvolený počet řádků je strop větší než fyzická výška plátna (D-039): víc bodů, než okno ukáže, se nekreslí. */
    capped: false,
    resize() {
      const w = canvas.clientWidth || globalThis.innerWidth || 1;
      const h = canvas.clientHeight || globalThis.innerHeight || 1;
      const rows = Math.max(1, Math.min(sys.rows, Math.round(h * (globalThis.devicePixelRatio || 1))));
      sys.capped = rows < sys.rows;
      renderer.setSize(Math.max(1, Math.round((rows * w) / h)), rows, false);
      camera.aspect = w / h;
      if (viewFov === null) camera.fov = sys.baseVfov; // svislý úhel se s oknem mění jen kvůli stropu vodorovného
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
