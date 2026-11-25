// Zdroj Poly Haven: rozhraní api.polyhaven.com; mapy po souborech, u každého velikost a MD5.
import { rank } from '../match.mjs';

const API = 'https://api.polyhaven.com';

export const SOURCE = {
  id: 'polyhaven',
  title: 'Poly Haven',
  site: 'https://polyhaven.com',
  types: { texture: 'textures' },
  license: 'CC0-1.0',
  evidence: 'https://polyhaven.com/license (přečteno 2026-11-24): všechny assety jsou CC0, uvedení autora nepovinné',
  terms:
    'https://github.com/Poly-Haven/Public-API/blob/master/ToS.md (přečteno 2026-11-24): volání s vlastním User-Agent (2.4); ' +
    'uživatel nástroje musí vidět, že obsah je z Poly Haven (2.5); assety jsou CC0 i po stažení',
  maps: { albedo: 'Diffuse', normal: 'nor_gl', arm: 'arm', roughness: 'Rough', ao: 'AO', metalness: 'Metal', height: 'Displacement' },
  // ARM = okolní stín (R), drsnost (G), kovovost (B), stejně jako v glTF a three.js
  defaultMaps: ['albedo', 'normal', 'arm'],
};

function toAsset(id, a) {
  return {
    source: SOURCE.id,
    id,
    title: a.name ?? id,
    type: a.type === 1 ? 'texture' : `typ ${a.type}`,
    tags: a.tags ?? [],
    categories: a.categories ?? [],
    description: a.description ?? '',
    authors: Object.keys(a.authors ?? {}),
    license: SOURCE.license,
    page: `${SOURCE.site}/a/${id}`,
    // rozhraní udává rozměr předlohy v milimetrech
    size: Array.isArray(a.dimensions) ? { w: Math.round(a.dimensions[0]) / 1000, h: Math.round(a.dimensions[1]) / 1000, unit: 'm', from: 'dimensions (mm)' } : null,
    popularity: a.download_count ?? 0,
  };
}

export async function search(http, words, { type = 'texture', limit = 10 } = {}) {
  const all = await http.json(`${API}/assets?t=${SOURCE.types[type]}`);
  return rank(Object.entries(all).map(([id, a]) => toAsset(id, { type: 1, ...a })), words).slice(0, limit);
}

export async function info(http, id) {
  return toAsset(id, await http.json(`${API}/info/${encodeURIComponent(id)}`));
}

export async function files(http, asset, { res = '2k', maps = SOURCE.defaultMaps } = {}) {
  const api = `${API}/files/${encodeURIComponent(asset.id)}`;
  const all = await http.json(api);
  const list = [];
  const missing = [];
  for (const m of maps) {
    const key = SOURCE.maps[m];
    if (!key) throw new Error(`Poly Haven nemá mapu „${m}“ (umí ${Object.keys(SOURCE.maps).join(', ')})`);
    const f = all[key]?.[res]?.jpg ?? all[key]?.[res]?.png;
    if (!f) {
      if (m === 'albedo') throw new Error(`${asset.id}: mapa barvy v rozlišení ${res} chybí`);
      missing.push(m);
      continue;
    }
    list.push({ map: m, name: f.url.split('/').pop(), url: f.url, bytes: f.size, md5: f.md5 });
  }
  return { api, files: list, missing };
}
