// Zdroj ambientCG: rozhraní v2 full_json; materiál je jeden archiv ZIP na rozlišení, mapy se z něj vyberou.
import crypto from 'node:crypto';
import { rank } from '../match.mjs';
import { readZip } from '../zip.mjs';

const API = 'https://ambientcg.com/api/v2/full_json';
const INCLUDE = 'downloadData,tagData,displayData';

export const SOURCE = {
  id: 'ambientcg',
  title: 'ambientCG',
  site: 'https://ambientcg.com',
  types: { texture: 'Material' },
  license: 'CC0-1.0',
  evidence: 'https://docs.ambientcg.com/license/ (přečteno 2026-11-24): všechny assety pod Creative Commons CC0 1.0 Universal, uvedení autora nepovinné',
  terms: 'https://docs.ambientcg.com/api/ (přečteno 2026-11-24): zvláštní podmínky rozhraní neuvádí',
  maps: { albedo: 'Color', normal: 'NormalGL', roughness: 'Roughness', ao: 'AmbientOcclusion', metalness: 'Metalness', height: 'Displacement', opacity: 'Opacity' },
  defaultMaps: ['albedo', 'normal', 'roughness', 'ao', 'metalness', 'opacity'],
  // materiál bez kovu a bez průhlednosti tyto mapy nemá; chybějí oprávněně
  optionalMaps: ['metalness', 'opacity'],
};

function zipDownloads(a) {
  const out = [];
  for (const folder of Object.values(a.downloadFolders ?? {})) {
    for (const cat of Object.values(folder.downloadFiletypeCategories ?? {})) {
      for (const d of cat.downloads ?? []) if (d.filetype === 'zip') out.push({ attr: d.attribute, url: d.fullDownloadPath ?? d.downloadLink, bytes: d.size, name: d.fileName });
    }
  }
  return out;
}

function toAsset(a) {
  return {
    source: SOURCE.id,
    id: a.assetId,
    title: a.displayName || a.assetId,
    type: a.dataType === 'Material' ? 'texture' : `typ ${a.dataType}`,
    tags: a.tags ?? [],
    categories: [a.displayCategory].filter(Boolean),
    description: a.description ?? '',
    authors: ['ambientCG'],
    license: SOURCE.license,
    page: a.shortLink || `${SOURCE.site}/view?id=${a.assetId}`,
    // jednotku rozhraní neuvádí; čísla odpovídají centimetrům (Concrete049: 110 × 110)
    size: a.dimensionX ? { w: a.dimensionX / 100, h: (a.dimensionY || a.dimensionX) / 100, unit: 'm', from: 'dimensionX/Y čtené jako cm (domněnka)' } : null,
    popularity: a.downloadCount ?? 0,
    downloads: zipDownloads(a),
  };
}

export async function search(http, words, { type = 'texture', limit = 10 } = {}) {
  const q = encodeURIComponent(words.join(' '));
  const j = await http.json(`${API}?type=${SOURCE.types[type]}&q=${q}&limit=${limit}&include=${INCLUDE}`);
  // rozhraní hledá samo; vlastní skóre jen řadí, nic nezahazuje
  return rank((j.foundAssets ?? []).map(toAsset), words, { strict: false }).slice(0, limit);
}

export async function info(http, id) {
  const j = await http.json(`${API}?id=${encodeURIComponent(id)}&include=${INCLUDE}`);
  const a = (j.foundAssets ?? []).find((x) => x.assetId === id);
  if (!a) throw new Error(`ambientCG: asset ${id} nenalezen`);
  return toAsset(a);
}

export async function files(http, asset, { res = '2k', maps = SOURCE.defaultMaps } = {}) {
  const attr = `${res.toUpperCase()}-JPG`;
  const d = asset.downloads?.find((x) => x.attr === attr);
  if (!d) throw new Error(`${asset.id}: archiv ${attr} není (je ${asset.downloads?.map((x) => x.attr).join(', ') || 'nic'})`);
  const zip = await http.bytes(d.url);
  if (d.bytes && zip.length !== d.bytes) throw new Error(`${d.name}: ${zip.length} B místo ${d.bytes} B`);
  const entries = readZip(zip);
  const list = [];
  const missing = [];
  for (const m of maps) {
    const key = SOURCE.maps[m];
    if (!key) throw new Error(`ambientCG nemá mapu „${m}“ (umí ${Object.keys(SOURCE.maps).join(', ')})`);
    const e = entries.find((x) => x.name.split('/').pop().endsWith(`_${key}.jpg`));
    if (!e) {
      if (m === 'albedo') throw new Error(`${asset.id}: v archivu chybí mapa barvy`);
      missing.push(m);
      continue;
    }
    list.push({ map: m, name: e.name.split('/').pop(), data: e.data() });
  }
  const archive = { url: d.url, name: d.name, bytes: zip.length, sha256: crypto.createHash('sha256').update(zip).digest('hex'), entries: entries.map((x) => x.name) };
  return { api: `${API}?id=${encodeURIComponent(asset.id)}`, files: list, missing, archive };
}
