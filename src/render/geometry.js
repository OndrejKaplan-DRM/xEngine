// xRender: geometrie three.js z hotové dávky (finishBatch). Barva vrcholů sdílí pole s výpočtem světla.

import * as THREE from 'three';

export function toGeometry(b) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(b.uvs, 2));
  if (b.colors) geo.setAttribute('color', new THREE.BufferAttribute(b.colors, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(new THREE.BufferAttribute(b.indices, 1));
  geo.computeBoundingSphere();
  return geo;
}
