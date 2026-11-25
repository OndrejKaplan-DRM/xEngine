// xRender: zbraň v ruce, střely, výbuchy a záblesk (A3.1).
// - Zbraň v ruce se kreslí ve druhém průchodu po vymazání hloubky (nikdy nepronikne zdí), vlastní kamerou se
//   zorným polem z nastavení (při přiblížení se nezvětšuje). Světlo po pixelech nemá: barvy vrcholů jí počítá
//   xWorld jako pohyblivému dílu (lighting.addMover), stejně jako bednám.
// - Záblesk ústí a výbuchu je to jediné efektové bodové světlo (D-022): jednotná proměnná v shaderu osvětlených
//   materiálů (materials.flash), počítaná po vrcholech, bez stínu.
// - Střely: jedna instancovaná síť (jedno volání kreslení na všechny). Výbuchy: několik koulí, které rostou a mizí.

import * as THREE from 'three';
import { finishBatch } from './batch.js';
import { toGeometry } from './geometry.js';

const SHOTS_MAX = 128;
const BLASTS_MAX = 8;

export function createEffects({ scene, materials, counts }) {
  // ---- zbraň v ruce
  const vmScene = new THREE.Scene();
  const vmCamera = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
  const vmRoot = new THREE.Group();
  vmRoot.matrixAutoUpdate = false;
  vmScene.add(vmRoot);
  let vmMeshes = [];

  // ---- střely
  const shotGeo = new THREE.IcosahedronGeometry(1, 1);
  const shotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.85, 4), toneMapped: true, fog: false });
  const shots = new THREE.InstancedMesh(shotGeo, shotMat, SHOTS_MAX);
  shots.count = 0;
  shots.frustumCulled = false;
  scene.add(shots);
  const m4 = new THREE.Matrix4();

  // ---- výbuchy
  const blastMat = [];
  const blasts = [];
  for (let i = 0; i < BLASTS_MAX; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.9, 5), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const mesh = new THREE.Mesh(shotGeo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    blastMat.push(mat);
    blasts.push(mesh);
  }

  const fx = {
    vmScene,
    vmCamera,
    get viewModelVisible() {
      return vmRoot.visible && vmMeshes.length > 0;
    },
    /**
     * Zbraň v ruce: pieces = [{ mat, batch }] v prostoru prefabu (null = žádná). Vrací ovladač jako addMover:
     * pieces[i] = { colors, touch() } pro světlo, setMatrix(m) = matice vůči kameře (po sloupcích), setVisible.
     */
    setViewModel(pieces, onDirty) {
      for (const m of vmMeshes) {
        vmRoot.remove(m);
        m.geometry.dispose();
      }
      vmMeshes = [];
      counts.viewTris = 0;
      if (!pieces) return null;
      const lit = [];
      vmMeshes = pieces.map((p) => {
        const b = finishBatch(p.batch, materials.isLit(p.mat));
        const geo = toGeometry(b);
        const mesh = new THREE.Mesh(geo, materials.get(p.mat));
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        vmRoot.add(mesh);
        counts.viewTris += b.tris;
        const color = geo.getAttribute('color');
        lit.push({
          colors: b.colors,
          touch() {
            color.needsUpdate = true;
            onDirty();
          },
        });
        return mesh;
      });
      return {
        pieces: lit,
        setMatrix(m) {
          vmRoot.matrix.fromArray(m);
          vmRoot.matrixWorldNeedsUpdate = true;
          onDirty();
        },
        setVisible(on) {
          if (vmRoot.visible === on) return;
          vmRoot.visible = on;
          onDirty();
        },
      };
    },
    /** Druhý průchod: po vymazání hloubky zbraň v ruce. vfov = svislý úhel z nastavení, aspect okna. */
    drawOverlay(renderer, vfov, aspect) {
      if (!fx.viewModelVisible) return;
      if (vmCamera.fov !== vfov || vmCamera.aspect !== aspect) {
        vmCamera.fov = vfov;
        vmCamera.aspect = aspect;
        vmCamera.updateProjectionMatrix();
      }
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(vmScene, vmCamera);
      renderer.autoClear = true;
    },
    /** Střely: n poloh (x, y, z, poloměr) v poli data. */
    setShots(n, data) {
      const k = Math.min(n, SHOTS_MAX);
      for (let i = 0; i < k; i++) {
        const r = data[i * 4 + 3];
        m4.makeScale(r, r, r).setPosition(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
        shots.setMatrixAt(i, m4);
      }
      shots.count = k;
      if (k) shots.instanceMatrix.needsUpdate = true;
      counts.shots = k;
    },
    /** Výbuchy: n záznamů (x, y, z, poloměr, průhlednost 0–1) v poli data. */
    setBlasts(n, data) {
      for (let i = 0; i < BLASTS_MAX; i++) {
        const on = i < n && data[i * 5 + 4] > 0;
        blasts[i].visible = on;
        if (!on) continue;
        const r = data[i * 5 + 3];
        blasts[i].position.set(data[i * 5], data[i * 5 + 1], data[i * 5 + 2]);
        blasts[i].scale.set(r, r, r);
        blastMat[i].opacity = data[i * 5 + 4];
      }
    },
    /** Jediné efektové bodové světlo (záblesk): poloha, barva × svítivost v kandelách, dosah; range 0 = zhasnuto. */
    setFlash(x, y, z, r, g, b, range) {
      materials.setFlash(x, y, z, r, g, b, range);
      counts.flash = range > 0 ? 1 : 0;
    },
    clear() {
      shots.count = 0;
      for (const b of blasts) b.visible = false;
      materials.setFlash(0, 0, 0, 0, 0, 0, 0);
      counts.flash = 0;
    },
  };
  return fx;
}
