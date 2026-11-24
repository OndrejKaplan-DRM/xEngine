// xForge: tematické sady vedle kit_base (Ondřej 24. 11. 2026: balíky kit_lab, kit_it, později kit_home).
// Sada stojí na kit_base (requires): materiály a prefaby odtud smí používat, vlastní id se s nimi nesmí potkat.
// Čistý modul bez přístupu k souborům: používá ho zápis balíku (make-pack.mjs), testy i galerie.

/**
 * @param t { id, title, version, requires: string[], makers: (() => {prefab, notes} | {prefab, notes}[])[], materials: object }
 * @returns {{ manifest, materials, prefabs: object[], notes: Record<string, Record<string, string>> }}
 */
export function buildTheme(t) {
  const made = t.makers.flatMap((make) => [].concat(make()));
  const prefabs = made.map((x) => x.prefab);
  const ids = new Set();
  for (const p of prefabs) {
    if (ids.has(p.id)) throw new Error(`${t.id}: prefab „${p.id}“ je v sadě dvakrát`);
    ids.add(p.id);
  }
  return {
    manifest: {
      xspace: 1,
      kind: 'pack',
      id: t.id,
      title: t.title,
      version: t.version,
      free: true,
      requires: t.requires,
      materials: 'materials.json',
      prefabs: prefabs.map((p) => `prefabs/${p.id}.json`),
      levels: [],
      assets: [],
    },
    materials: { xspace: 1, kind: 'materials', materials: t.materials },
    prefabs,
    notes: Object.fromEntries(made.filter((x) => Object.keys(x.notes).length).map((x) => [x.prefab.id, x.notes])),
  };
}

/** Sada ve tvaru načteného balíku (jako loadPack), pro validátor a generátor bez zápisu na disk. */
export const asPack = (kit) => ({ manifest: kit.manifest, materials: kit.materials, prefabs: kit.prefabs.map((p) => ({ file: `prefabs/${p.id}.json`, data: p })), levels: [], loadErrors: [] });
