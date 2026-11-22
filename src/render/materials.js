// xRender: materiály z dat xSpace. Vlna 1 kreslí bez textur. Světlo se počítá po vrcholech (D-022): model 'lit'
// je materiál bez výpočtu světel, který barvu násobí barvou vrcholů; 'unlit' a 'emissive' na světlo nereagují. Varianta „:off“ je zhasnutý svítící povrch (lampa).

import * as THREE from 'three';

const OFF_FACTOR = 0.08;

export function createMaterials() {
  let defs = {};
  const cache = new Map();

  function make(id) {
    const off = id.endsWith(':off');
    const d = defs[off ? id.slice(0, -4) : id];
    if (!d) throw new Error(`Materiál „${id}“ v balíku není.`);
    const side = d.twoSided ? THREE.DoubleSide : THREE.FrontSide;
    if (d.model === 'lit') return new THREE.MeshBasicMaterial({ color: new THREE.Color(...d.color), side, vertexColors: true });
    if (d.model === 'unlit') return new THREE.MeshBasicMaterial({ color: new THREE.Color(...d.color), side });
    // emissive: barva svitu krát síla; převod do rozsahu displeje udělá expozice a tónová křivka
    const k = off ? OFF_FACTOR : (d.emissiveStrength ?? 1);
    const e = d.emissive || d.color;
    return new THREE.MeshBasicMaterial({ color: new THREE.Color(e[0] * k, e[1] * k, e[2] * k), side });
  }

  return {
    /** Nová sada definic (při načtení levelu). Staré materiály se uvolní. */
    setDefs(next) {
      for (const m of cache.values()) m.dispose();
      cache.clear();
      defs = next || {};
    },
    has: (id) => id in defs,
    def: (id) => defs[id],
    isEmissive: (id) => defs[id]?.model === 'emissive',
    /** Materiál reaguje na světlo: jeho síť nese barvu vrcholů. */
    isLit: (id) => defs[id]?.model === 'lit',
    get(id) {
      let m = cache.get(id);
      if (!m) {
        m = make(id);
        m.name = id;
        cache.set(id, m);
      }
      return m;
    },
    get count() {
      return cache.size;
    },
  };
}
