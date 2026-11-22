// Galerie: stavba sítí prefabu pro three.js. Díly visí na skupinách uzlů; polohu skupin určují výhradně
// matice z src/xspace/rig.js (rigMatrices), takže se kloub v galerii hýbe stejně jako v enginu.
// Válec je šestnáctiboký hranol jako v prohlížeči xView.

import * as THREE from 'three';
import { rigMatrices } from '../../../src/xspace/index.js';

const cache = new Map();
export function material(id, defs) {
  if (!cache.has(id)) {
    const d = defs[id];
    cache.set(id, d.model === 'lit' ? new THREE.MeshLambertMaterial({ color: new THREE.Color(...d.color) }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(...(d.emissive || d.color)) }));
  }
  return cache.get(id);
}

function partGeometry(part) {
  if (part.shape === 'box') {
    const g = new THREE.BoxGeometry(...[0, 1, 2].map((i) => part.max[i] - part.min[i]));
    g.translate(...[0, 1, 2].map((i) => (part.min[i] + part.max[i]) / 2));
    return g;
  }
  if (part.shape === 'cyl') {
    const g = new THREE.CylinderGeometry(part.radius, part.radius, part.height, 16);
    if (part.axis === 'x') g.rotateZ(Math.PI / 2);
    if (part.axis === 'z') g.rotateX(Math.PI / 2);
    g.translate(...part.center);
    return g;
  }
  return null; // sítě .glb sada nemá
}

/** Postaví prefab: { root, setPose(values), dispose() }. values = { idKloubu: hodnota }. */
export function buildPrefab(prefab, matDefs) {
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
    groups[part.node].add(new THREE.Mesh(geo, material(part.mat, matDefs)));
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
