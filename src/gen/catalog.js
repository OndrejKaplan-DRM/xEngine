// Katalog sady pro generátor: co o prefabech potřebuje vědět rozmisťování. Vše se čte z dat balíku
// (obal, díly, parametry původu), generátor si rozměry prefabů nikde nepamatuje.

import { entityMatrix, mat4Point, rigMatrices, doorInteraction } from '../xspace/index.js';
import { boundsAt, partPoints } from './measure.js';

/**
 * Několik sad jako jeden balík pro katalog (kit_base, kit_lab, kit_it…): prefaby a materiály všech, id spojené „+“.
 * Každá sada musí mít své requires mezi ostatními, jinak by level odkazoval na balík, který nikdo nepřibalí.
 * Kolize id prefabu nebo materiálu mezi sadami je chyba.
 */
export function mergeKits(packs) {
  if (packs.length === 1) return packs[0];
  const kits = packs.map((p) => p.manifest.id);
  const out = { manifest: { xspace: 1, kind: 'pack', id: kits.join('+'), requires: kits }, kits, materials: { xspace: 1, kind: 'materials', materials: {} }, prefabs: [], levels: [], loadErrors: [] };
  const seen = new Map();
  for (const p of packs) {
    for (const r of p.manifest.requires || []) if (!kits.includes(r)) throw new Error(`sada ${p.manifest.id} stojí na ${r}, který mezi sadami není`);
    for (const [id, m] of Object.entries(p.materials?.materials || {})) {
      if (id in out.materials.materials) throw new Error(`materiál „${id}“ je v sadách ${seen.get('m:' + id)} a ${p.manifest.id}`);
      seen.set('m:' + id, p.manifest.id);
      out.materials.materials[id] = m;
    }
    for (const pf of p.prefabs) {
      if (seen.has(pf.data.id)) throw new Error(`prefab „${pf.data.id}“ je v sadách ${seen.get(pf.data.id)} a ${p.manifest.id}`);
      seen.set(pf.data.id, p.manifest.id);
      out.prefabs.push(pf);
    }
  }
  return out;
}

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
  /**
   * Připojené prefaby (source.params.attach): samostatné entity, které generátor postaví s rodičem, např. zásuvky
   * kartotéky, každá se svou interakcí (formát verze 1 unese jednu interakci na prefab; návrh N-010).
   * Položka { prefab, pos: [x, y, z] v prostoru rodiče, ry: stupně }.
   */
  const attachments = (id) => ((get(id).source || {}).params || {}).attach || [];
  /** Obal kvádru b po přesunutí a otočení kolem Y (pos, ry). */
  const moved = (b, pos, ry) => {
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
  const union = (a, b) => ({ min: a.min.map((v, k) => Math.min(v, b.min[k])), max: a.max.map((v, k) => Math.max(v, b.max[k])) });
  /** Obal dílů v klidové poloze, v prostoru prefabu (metry), včetně připojených prefabů. */
  const restBox = (id) => {
    if (!restCache.has(id)) restCache.set(id, attachments(id).reduce((b, a) => union(b, moved(restBox(a.prefab), a.pos, a.ry || 0)), boundsAt(get(id))));
    return restCache.get(id);
  };
  /** Obal přes celý rozsah pohybu, v prostoru prefabu, včetně připojených prefabů. */
  const sweptBox = (id) => attachments(id).reduce((b, a) => union(b, moved(sweptBox(a.prefab), a.pos, a.ry || 0)), get(id).bounds);
  /** Obal umístěné entity ve světě (metry). which: 'rest' = v klidu, 'swept' = přes celý rozsah pohybu. */
  const worldBox = (id, pos, ry = 0, which = 'rest') => moved(which === 'swept' ? sweptBox(id) : restBox(id), pos, ry);
  return {
    id: pack.manifest.id,
    /** Id balíků sad, ze kterých katalog je (requires balíku levelů). */
    kits: pack.kits || [pack.manifest.id],
    get,
    has: (id) => byId.has(id),
    attachments,
    restBox,
    sweptBox,
    worldBox,
    /** Stavební otvor dveří v centimetrech (z parametrů generátoru prefabu). */
    opening(id) {
      const pr = get(id).source.params || {};
      if (!pr.width || !pr.height) throw new Error(`katalog: prefab „${id}“ nemá v source.params šířku a výšku otvoru`);
      return { w: Math.round(pr.width * 100), h: Math.round(pr.height * 100) };
    },
    /**
     * Světlost otevřených dveří v centimetrech: nejširší úsek otvoru, do kterého ve výšce těla nezasahuje žádná
     * kolize prefabu, když je kloub dveří na dorazu nejdál od klidu. list = jeden prefab, nebo křídla dvoukřídlých
     * dveří se společným počátkem. Je to hrubá míra z obalů podél zdi; přesně měří test (kruh v půdorysu).
     */
    clearWidth(list) {
      const ids = [].concat(list);
      const half = this.opening(ids[0]).w / 200;
      const spans = [];
      for (const id of ids) {
        const pf = get(id);
        const it = doorInteraction(pf);
        const j = it && (pf.rig.joints || []).find((x) => x.id === it.joint);
        const rest = j ? (j.rest ?? j.min) : 0;
        const mats = rigMatrices(pf, j ? { [j.id]: Math.abs(j.max - rest) >= Math.abs(j.min - rest) ? j.max : j.min } : {});
        for (const c of pf.colliders || []) {
          if (c.shape !== 'box' && c.shape !== 'cyl') continue;
          let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
          for (const q of partPoints(c)) {
            const w = mat4Point(mats[c.node], q);
            x0 = Math.min(x0, w[0]);
            x1 = Math.max(x1, w[0]);
            y0 = Math.min(y0, w[1]);
            y1 = Math.max(y1, w[1]);
          }
          if (y1 > 0.3 && y0 < 1.8) spans.push([x0, x1]);
        }
      }
      spans.sort((p, q) => p[0] - q[0]);
      let best = 0;
      let cur = -half;
      for (const [a, b] of spans) {
        if (a > cur) best = Math.max(best, Math.min(a, half) - cur);
        cur = Math.max(cur, b);
      }
      best = Math.max(best, half - cur);
      return Math.floor(best * 100 + 1e-6);
    },
    hasMaterial: (id) => Boolean(pack.materials && pack.materials.materials[id]),
    ids: [...byId.keys()],
  };
}
