// xSearcher: brána licencí a příjem do packs/_inbox/<zdroj>/<asset>/ se záznamem record.json.
// Do balíků nic nepřesouvá; pro pack.json připraví položku assets (packAsset).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { FREE_LICENSES, LICENSES } from '../../src/xspace/formats.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const INBOX = path.join(ROOT, 'packs', '_inbox');
export const RECORD = 'record.json';
export const RECORD_VERSION = 1;

/** Výchozí brána: jen CC0-1.0. */
export const ALLOWED = ['CC0-1.0'];

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}$/;

export class GateError extends Error {}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Důvody, proč asset neprojde; prázdné pole = projde. Při pochybnosti ne. */
export function gate(asset, src, allowed = ALLOWED) {
  const why = [];
  if (!src?.license || !src?.evidence) why.push('zdroj nemá doloženou licenci');
  if (!asset?.license) why.push('licence assetu neznámá');
  else {
    if (!LICENSES.includes(asset.license)) why.push(`licence ${asset.license} není ve slovníku formátu`);
    if (!allowed.includes(asset.license)) why.push(`licence ${asset.license} není povolená (${allowed.join(', ')})`);
    if (!FREE_LICENSES.includes(asset.license)) why.push(`licence ${asset.license} má povinnosti vůči třetím stranám`);
    if (src?.license && asset.license !== src.license) why.push(`licence assetu ${asset.license} se liší od licence zdroje ${src.license}`);
  }
  if (asset?.type !== 'texture') why.push(`druh ${asset?.type ?? 'neznámý'} není textura`);
  if (!SAFE_ID.test(asset?.id ?? '')) why.push(`id „${asset?.id}“ nejde použít jako jméno složky`);
  return why;
}

/** Stáhne asset do příjmu. Selže-li kterýkoli soubor (velikost, MD5), nic nezapíše. */
export async function fetchAsset(http, src, asset, { res = '2k', maps = null, out = INBOX, date = today(), query = '' } = {}) {
  const why = gate(asset, src);
  if (why.length) throw new GateError(`${src?.title ?? '?'} ${asset?.id ?? '?'}: ${why.join('; ')}`);
  const got = await src.api.files(http, asset, { res, maps: maps ?? src.defaultMaps });
  const dir = path.join(out, src.id, asset.id);
  const tmp = `${dir}.part`;
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  try {
    const files = [];
    for (const f of got.files) {
      const data = f.data ?? (await http.bytes(f.url));
      if (f.bytes != null && data.length !== f.bytes) throw new Error(`${f.name}: ${data.length} B místo ${f.bytes} B`);
      if (f.md5 && md5(data) !== f.md5) throw new Error(`${f.name}: nesedí MD5 (${md5(data)} místo ${f.md5})`);
      fs.writeFileSync(path.join(tmp, f.name), data);
      files.push({ map: f.map, path: f.name, bytes: data.length, sha256: sha256(data), ...(f.url ? { url: f.url } : {}), ...(f.md5 ? { md5: f.md5 } : {}) });
    }
    const record = {
      xsearcher: RECORD_VERSION,
      source: src.id,
      sourceTitle: src.title,
      id: asset.id,
      title: asset.title,
      type: asset.type,
      license: asset.license,
      licenseEvidence: src.evidence,
      terms: src.terms,
      author: asset.authors.join(', '),
      url: asset.page,
      api: got.api,
      date,
      query,
      tags: asset.tags,
      categories: asset.categories,
      size: asset.size,
      resolution: res,
      ...(got.archive ? { archive: got.archive } : {}),
      missingMaps: got.missing,
      files,
    };
    fs.writeFileSync(path.join(tmp, RECORD), JSON.stringify(record, null, 2) + '\n');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.renameSync(tmp, dir);
    return { dir, record };
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

/** Záznamy v příjmu; ověří, že soubory na disku sedí na otisk v záznamu. */
export function listInbox(out = INBOX) {
  const list = [];
  if (!fs.existsSync(out)) return list;
  for (const s of fs.readdirSync(out, { withFileTypes: true })) {
    if (!s.isDirectory()) continue;
    for (const a of fs.readdirSync(path.join(out, s.name), { withFileTypes: true })) {
      const f = path.join(out, s.name, a.name, RECORD);
      if (!a.isDirectory() || !fs.existsSync(f)) continue;
      const record = JSON.parse(fs.readFileSync(f, 'utf8'));
      const bad = record.files.filter((x) => {
        const p = path.join(out, s.name, a.name, x.path);
        return !fs.existsSync(p) || sha256(fs.readFileSync(p)) !== x.sha256;
      });
      list.push({ dir: path.dirname(f), record, ok: bad.length === 0, bad: bad.map((x) => x.path) });
    }
  }
  return list;
}

/** Položka pack.json.assets pro soubor odvozený ze záznamu (data = obsah souboru v balíku). */
export function packAsset(record, relPath, data, from = null) {
  const src = from ?? record.files[0];
  return {
    path: relPath,
    bytes: data.length,
    sha256: sha256(data),
    license: record.license,
    source: src?.url ?? record.archive?.url ?? record.url,
    author: record.author,
  };
}
