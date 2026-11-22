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
 */
export async function readPackFull(dir) {
  const main = await readPackDir(dir);
  const want = Array.isArray(main.manifest?.requires) ? main.manifest.requires : [];
  if (!want.length) return main;
  const deps = [];
  for (const id of want) {
    const dep = await readPackDir(path.join(dir, '..', id));
    if (dep.manifest) deps.push(dep);
  }
  return mergePacks(main, deps);
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
