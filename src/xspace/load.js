// Načtení balíku xSpace. Zdroj dat se předává funkcí read(cesta) → Promise<string>,
// takže tentýž kód běží v Node (soubory) i v prohlížeči (fetch).

/**
 * @param {(path: string) => Promise<string>} read čte textový soubor relativně ke kořeni balíku
 * @returns {Promise<{ manifest, materials, prefabs: {file, data}[], levels: {file, data}[], ammo, weapons: {file, data}[], loadErrors: {file, msg}[] }>}
 */
export async function loadPack(read) {
  const loadErrors = [];
  const json = async (file) => {
    try {
      return JSON.parse(await read(file));
    } catch (e) {
      loadErrors.push({ file, msg: e.message });
      return null;
    }
  };
  const manifest = await json('pack.json');
  const out = { manifest, materials: null, prefabs: [], levels: [], ammo: null, weapons: [], loadErrors };
  if (!manifest) return out;
  if (typeof manifest.materials === 'string') out.materials = await json(manifest.materials);
  for (const file of Array.isArray(manifest.prefabs) ? manifest.prefabs : []) out.prefabs.push({ file, data: await json(file) });
  for (const file of Array.isArray(manifest.levels) ? manifest.levels : []) out.levels.push({ file, data: await json(file) });
  if (typeof manifest.ammo === 'string') out.ammo = await json(manifest.ammo);
  for (const file of Array.isArray(manifest.weapons) ? manifest.weapons : []) out.weapons.push({ file, data: await json(file) });
  return out;
}

/**
 * Spojí balík s balíky, na kterých stojí (manifest.requires). Výsledek má materiály, prefaby, munici a zbraně všech,
 * levely jen hlavního. Převzaté prefaby nesou `from` = id balíku původu; validátor je znovu nekontroluje,
 * jen na ně řeší odkazy. `materialFrom` říká u každého materiálu id balíku původu (N-111).
 * Kolize id materiálu nebo prefabu mezi balíky je chyba (mergeErrors).
 */
export function mergePacks(main, deps) {
  const out = { manifest: main.manifest, materials: { xspace: 1, kind: 'materials', materials: {} }, prefabs: [], levels: main.levels, ammo: { xspace: 1, kind: 'ammo', ammo: {} }, weapons: [], loadErrors: [...main.loadErrors], mergeErrors: [], complete: true, foreignMaterials: [], materialFrom: {} };
  const want = Array.isArray(main.manifest?.requires) ? main.manifest.requires : [];
  const have = new Map(deps.filter((d) => d.manifest).map((d) => [d.manifest.id, d]));
  const seenPrefab = new Map();
  const add = (pack, from) => {
    for (const [id, m] of Object.entries(pack.materials?.materials || {})) {
      if (id in out.materials.materials) out.mergeErrors.push({ code: 'pack.dupeMaterial', msg: `materiál „${id}“ je ve více balících` });
      else {
        out.materials.materials[id] = m;
        out.materialFrom[id] = from || main.manifest?.id; // N-111: odkud hledat albedo a normal
        if (from) out.foreignMaterials.push(id);
      }
    }
    for (const p of pack.prefabs) {
      const id = p.data?.id;
      if (id && seenPrefab.has(id)) out.mergeErrors.push({ code: 'pack.dupePrefab', msg: `prefab „${id}“ je v balících ${seenPrefab.get(id)} a ${from || main.manifest.id}` });
      else {
        if (id) seenPrefab.set(id, from || main.manifest.id);
        out.prefabs.push(from ? { ...p, from } : p);
      }
    }
    for (const [id, a] of Object.entries(pack.ammo?.ammo || {})) {
      if (id in out.ammo.ammo) out.mergeErrors.push({ code: 'pack.dupeAmmo', msg: `munice „${id}“ je ve více balících` });
      else out.ammo.ammo[id] = a;
    }
    for (const w of pack.weapons || []) {
      const id = w.data?.id;
      if (id && out.weapons.some((x) => x.data?.id === id)) out.mergeErrors.push({ code: 'pack.dupeWeapon', msg: `zbraň „${id}“ je ve více balících` });
      else out.weapons.push(from ? { ...w, from } : w);
    }
    out.loadErrors.push(...(from ? pack.loadErrors.map((e) => ({ ...e, file: `${from}/${e.file}` })) : []));
  };
  for (const id of want) {
    if (!have.has(id)) out.mergeErrors.push({ code: 'pack.missingDep', msg: `balík „${id}“ z requires nebyl nalezen` });
    else add(have.get(id), id);
  }
  add(main, null);
  return out;
}
