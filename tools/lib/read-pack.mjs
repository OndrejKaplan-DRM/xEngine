// Načtení balíku z adresáře (Node) + kontrola binárních souborů proti manifestu.
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadPack, mergePacks } from '../../src/xspace/load.js';
import { validatePack } from '../../src/xspace/validate.js';

/** Jeden balík, bez balíků z requires. */
export async function readPackDir(dir) {
  return loadPack((file) => readFile(path.join(dir, file), 'utf8'));
}

/**
 * Balík spojený s balíky z requires. Ty se hledají jako sousední adresáře pojmenované svým id
 * (packs/golden vyžaduje kit_base → packs/kit_base). Bez requires vrací totéž co readPackDir.
 * opts.files: přidá `files` = { "<id balíku>/<cesta>": Uint8Array } se soubory z `assets` hlavního balíku
 * i všech z requires (N-111). Chybějící soubor se přeskočí; velikost a otisk hlídá checkPackDir.
 */
export async function readPackFull(dir, opts = {}) {
  const main = await readPackDir(dir);
  const want = Array.isArray(main.manifest?.requires) ? main.manifest.requires : [];
  const all = [[main, dir]];
  let out = main;
  if (want.length) {
    const deps = [];
    for (const id of want) {
      const depDir = path.join(dir, '..', id);
      const dep = await readPackDir(depDir);
      if (dep.manifest) {
        deps.push(dep);
        all.push([dep, depDir]);
      }
    }
    out = mergePacks(main, deps);
  }
  if (opts.files) out.files = await readAssetFiles(all);
  return out;
}

/** Soubory z `assets` balíků: [[balík, adresář], …] → { "<id>/<cesta>": Uint8Array }. */
async function readAssetFiles(list) {
  const files = {};
  for (const [pack, dir] of list) {
    const id = pack.manifest?.id;
    for (const a of Array.isArray(pack.manifest?.assets) ? pack.manifest.assets : []) {
      if (!a || typeof a.path !== 'string') continue;
      try {
        files[`${id}/${a.path}`] = new Uint8Array(await readFile(path.join(dir, a.path)));
      } catch {
        /* chybějící soubor ohlásí checkPackDir (file.missing) */
      }
    }
  }
  return files;
}

/** Tvar a smysl dat + soubory na disku (existence, velikost, otisk). */
export async function checkPackDir(dir) {
  const pack = await readPackFull(dir);
  const res = validatePack(pack);
  for (const e of pack.loadErrors) res.errors.push({ level: 'error', code: 'file.load', path: e.file, msg: e.msg });
  for (const [i, a] of (Array.isArray(pack.manifest?.assets) ? pack.manifest.assets : []).entries()) {
    const where = `pack.json.assets[${i}]`;
    try {
      const full = path.join(dir, a.path);
      const st = await stat(full);
      if (st.size !== a.bytes) res.errors.push({ level: 'error', code: 'file.bytes', path: where, msg: `„${a.path}“ má ${st.size} B, manifest uvádí ${a.bytes} B` });
      const sha = createHash('sha256').update(await readFile(full)).digest('hex');
      if (sha !== a.sha256) res.errors.push({ level: 'error', code: 'file.sha', path: where, msg: `otisk „${a.path}“ nesouhlasí s manifestem` });
    } catch {
      res.errors.push({ level: 'error', code: 'file.missing', path: where, msg: `soubor „${a.path}“ chybí` });
    }
  }
  res.ok = res.errors.length === 0;
  return { pack, res };
}
