// Sada kit_base: seznam všech generátorů prefabů. Každá položka je funkce bez parametrů,
// která vrátí { prefab, notes }; parametrické funkce jsou v jednotlivých souborech.
// Čistý modul (bez přístupu k souborům): používá ho zápis balíku, testy i galerie v prohlížeči.

import { DOORS } from './doors.mjs';
import { CONTROLS } from './controls.mjs';
import { FURNITURE } from './furniture.mjs';
import { LIGHTS } from './lights.mjs';
import { LAB } from './lab.mjs';
import { PROPS } from './props.mjs';
import { MATERIALS } from '../materials.mjs';

export const KIT_ID = 'kit_base';
export const KIT_VERSION = '0.1.0';
export const KIT_MAKERS = [...DOORS, ...CONTROLS, ...FURNITURE, ...LIGHTS, ...LAB, ...PROPS];

/** Postaví celou sadu. @returns {{ manifest, materials, prefabs: object[], notes: Record<string, Record<string, string>> }} */
export function buildKit() {
  const made = KIT_MAKERS.map((make) => make());
  const prefabs = made.map((x) => x.prefab);
  const ids = new Set();
  for (const p of prefabs) {
    if (ids.has(p.id)) throw new Error(`kit: prefab „${p.id}“ je v sadě dvakrát`);
    ids.add(p.id);
  }
  return {
    manifest: {
      xspace: 1,
      kind: 'pack',
      id: KIT_ID,
      title: 'Základní sada prefabů a materiálů (xForge)',
      version: KIT_VERSION,
      free: true,
      materials: 'materials.json',
      prefabs: prefabs.map((p) => `prefabs/${p.id}.json`),
      levels: [],
      assets: [],
    },
    materials: { xspace: 1, kind: 'materials', materials: MATERIALS },
    prefabs,
    notes: Object.fromEntries(made.filter((x) => Object.keys(x.notes).length).map((x) => [x.prefab.id, x.notes])),
  };
}

/** Sada ve tvaru načteného balíku (jako loadPack), pro validátor a generátor bez zápisu na disk. */
export function kitAsPack() {
  const kit = buildKit();
  return { manifest: kit.manifest, materials: kit.materials, prefabs: kit.prefabs.map((p) => ({ file: `prefabs/${p.id}.json`, data: p })), levels: [], loadErrors: [] };
}
