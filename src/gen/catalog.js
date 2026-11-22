// Katalog sady pro generátor: co o prefabech potřebuje vědět rozmisťování. Vše se čte z dat balíku
// (obal, díly, parametry původu), generátor si rozměry prefabů nikde nepamatuje.

import { entityMatrix, mat4Point } from '../xspace/index.js';
import { boundsAt } from './measure.js';

/**
 * @param pack načtený balík sady ({ prefabs: [{ data }], materials })
 */
export function makeCatalog(pack) {
  const byId = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
  const restCache = new Map();
  const get = (id) => {
    const p = byId.get(id);
    if (!p) throw new Error(`katalog: prefab „${id}“ v sadě není`);
    return p;
  };
  /** Obal dílů v klidové poloze, v prostoru prefabu (metry). */
  const restBox = (id) => {
    if (!restCache.has(id)) restCache.set(id, boundsAt(get(id)));
    return restCache.get(id);
  };
  /** Obal umístěné entity ve světě (metry). which: 'rest' = v klidu, 'swept' = přes celý rozsah pohybu. */
  const worldBox = (id, pos, ry = 0, which = 'rest') => {
    const b = which === 'swept' ? get(id).bounds : restBox(id);
    const mtx = entityMatrix({ pos, rot: [0, ry, 0] });
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const x of [b.min[0], b.max[0]]) {
      for (const y of [b.min[1], b.max[1]]) {
        for (const z of [b.min[2], b.max[2]]) {
          const w = mat4Point(mtx, [x, y, z]);
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k], w[k]);
            max[k] = Math.max(max[k], w[k]);
          }
        }
      }
    }
    return { min, max };
  };
  return {
    id: pack.manifest.id,
    get,
    has: (id) => byId.has(id),
    restBox,
    worldBox,
    /** Stavební otvor dveří v centimetrech (z parametrů generátoru prefabu). */
    opening(id) {
      const pr = get(id).source.params || {};
      if (!pr.width || !pr.height) throw new Error(`katalog: prefab „${id}“ nemá v source.params šířku a výšku otvoru`);
      return { w: Math.round(pr.width * 100), h: Math.round(pr.height * 100) };
    },
    hasMaterial: (id) => Boolean(pack.materials && pack.materials.materials[id]),
    ids: [...byId.keys()],
  };
}
