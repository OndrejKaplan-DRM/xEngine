// Galerie: stavba sítí prefabu pro three.js. Díly visí na skupinách uzlů; polohu skupin určují výhradně
// matice z src/xspace/rig.js (rigMatrices), takže se kloub v galerii hýbe stejně jako v enginu.
// Síť dílu dává partMesh ze základu (N-101): galerie, xView, xBake i engine kreslí tentýž tvar.

import * as THREE from 'three';
import { rigMatrices, partMesh } from '../../../src/xspace/index.js';

// Pohledy (look): „clean“ = jen barva materiálu (stupeň 0); „t460“ = textura barvy, světlo bez odlesků a bez normál
// (co unese stupeň low); „gpu“ = textura, normálová mapa, drsnost, kovovost a odrazy okolí (stupně 2 a 3).
// Textura se násobí zesílením color / průměr textury ze zámku textur, ne samotnou barvou (návrh N-009):
// průměr povrchu pak odpovídá barvě materiálu a kresba zůstane celá.
const cache = new Map();
let textures = null; // cesta v balíku → THREE.Texture
let gains = {}; // id materiálu → [r, g, b]
export function useTextures(map, gainMap) {
  textures = map;
  gains = gainMap;
  for (const m of cache.values()) m.dispose();
  cache.clear();
}
function tiled(t, uvScale = 1) {
  const c = t.clone();
  c.repeat.set(1 / uvScale, 1 / uvScale);
  return c;
}
export function material(id, defs, look = 'clean') {
  const key = `${look}:${id}`;
  if (cache.has(key)) return cache.get(key);
  const d = defs[id];
  let m;
  if (d.model !== 'lit') m = new THREE.MeshBasicMaterial({ color: new THREE.Color(...(d.emissive || d.color)) });
  else if (look === 'clean' || !textures) m = new THREE.MeshLambertMaterial({ color: new THREE.Color(...d.color) });
  else {
    const map = d.albedo && textures[d.albedo] && gains[id] ? tiled(textures[d.albedo], d.uvScale) : null;
    const color = new THREE.Color(...(map ? gains[id] : d.color));
    if (look === 't460') m = new THREE.MeshLambertMaterial({ color, map });
    else {
      const normalMap = map && d.normal && textures[d.normal] ? tiled(textures[d.normal], d.uvScale) : null;
      m = new THREE.MeshStandardMaterial({ color, map, normalMap, roughness: d.rough ?? 0.9, metalness: d.metal ?? 0 });
    }
  }
  cache.set(key, m);
  return m;
}

function partGeometry(part) {
  const m = partMesh(part);
  if (!m) return null; // díl ze souboru (.glb) sada zatím nemá
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(m.normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(m.uvs, 2));
  g.setIndex(m.indices);
  return g;
}

/** Postaví prefab: { root, setPose(values), dispose() }. values = { idKloubu: hodnota }. */
export function buildPrefab(prefab, matDefs, look = 'clean') {
  const root = new THREE.Group();
  const groups = {};
  for (const n of prefab.rig.nodes) {
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    groups[n.id] = g;
    root.add(g);
  }
  const geos = [];
  for (const part of prefab.parts) {
    const geo = partGeometry(part);
    if (!geo) continue;
    geos.push(geo);
    groups[part.node].add(new THREE.Mesh(geo, material(part.mat, matDefs, look)));
  }
  const setPose = (values = {}) => {
    const mats = rigMatrices(prefab, values);
    for (const id of Object.keys(groups)) {
      groups[id].matrix.fromArray(mats[id]);
      groups[id].matrixWorldNeedsUpdate = true;
    }
  };
  setPose();
  return { root, setPose, dispose: () => geos.forEach((g) => g.dispose()) };
}

/** Poloha kloubů pro t = 0 (klid) až 1 (krajní poloha nejdál od klidu). */
export function poseAt(prefab, t) {
  const out = {};
  for (const j of prefab.rig.joints || []) {
    const rest = j.rest ?? j.min;
    const far = Math.abs(j.max - rest) >= Math.abs(j.min - rest) ? j.max : j.min;
    // u víceotáčkových kloubů ukaž nejvýš necelou otáčku, jinak by krajní poloha vypadala jako klid
    const span = j.type === 'hinge' && Math.abs(far - rest) > 300 ? Math.sign(far - rest) * 135 : far - rest;
    out[j.id] = rest + span * t;
  }
  return out;
}

/** Jednoduchá postava 1,8 m pro měřítko. */
export function figure() {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0x5dcaa5, transparent: true, opacity: 0.35 });
  const add = (w, h, d, y) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.y = y;
    g.add(mesh);
  };
  add(0.32, 0.85, 0.2, 0.425);
  add(0.44, 0.62, 0.24, 1.16);
  add(0.2, 0.26, 0.22, 1.67);
  return g;
}
