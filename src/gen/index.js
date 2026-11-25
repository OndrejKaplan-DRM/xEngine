// xGen: veřejné rozhraní generátoru levelů. Čistá funkce: předvolba + seed + katalog sady → level xSpace.
// Stejný vstup dá bajtově stejný výstup (náhoda jen přes rngNext, čísla zaokrouhlená, žádný čas ani Math.random).
// Běží v Node i v prohlížeči; se soubory pracuje jen cli.mjs.

import { makeRng, hashText } from './rng.js';
import { makeLayout } from './layout.js';
import { buildStructure } from './build.js';
import { furnish, distances } from './furnish.js';
import { source } from './util.js';
import { fitPVS } from './pvs.js';
import { levelLightMeshes, LIGHT_CELL } from '../xspace/index.js';
import { complex } from './presets/complex.js';
import { catacombs } from './presets/catacombs.js';
import { house } from './presets/house.js';

export { makeCatalog, mergeKits } from './catalog.js';
export { fmtJson } from './util.js';
export * as kit from './kit.js';

export const PRESETS = { complex, catacombs, house };
const MAX_ATTEMPTS = 60;
/**
 * Nejvýš trojúhelníků viditelných z jedné buňky (PVS, všechny dveře otevřené). Ondřej 25. 11. 2026 v 1:29: „chytře
 * škrtejme, co není vidět. Ale opravdu prokazatelně.“ Mez viditelné scény z docs/06_ROZPOCTY.md (xBench na T460:
 * 594 tisíc △ za 7,15 ms); test B-T1 drží totéž číslo nezávisle.
 */
export const PVS_BUDGET = 300000;

/**
 * Vygeneruje level.
 * @param {string} presetId 'complex' | 'catacombs'
 * @param {number} seed celé číslo
 * @param catalog katalog sady (makeCatalog nad balíkem kit_base)
 * @param {{ floors?: number, puzzle?: boolean, id?: string }} opts
 * @returns {{ level: object, info: object }} level a čísla pro testy a výpis
 */
export function generateLevel(presetId, seed, catalog, opts = {}) {
  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`xGen: neznámá předvolba „${presetId}“ (známé: ${Object.keys(PRESETS).join(', ')})`);
  if (!Number.isInteger(seed)) throw new Error('xGen: seed musí být celé číslo');
  const P = preset.params(opts);
  const base = makeRng(seed, hashText(presetId));
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // každý pokus má vlastní proud náhody; první, který projde všemi podmínkami, je výsledek
    const rng = base.fork(`attempt${attempt}`);
    const plan = (preset.layout || makeLayout)(P, rng.fork('layout'));
    if (!plan || plan.cells.length < P.cells[0] || plan.cells.length > P.cells[1]) continue;
    const S = buildStructure(preset, P, plan, catalog, rng.fork('build'));
    if (!S) continue;
    const stairs = S.brushes.filter((b) => b.tag === 'stair').length;
    const ramps = S.brushes.filter((b) => b.shape === 'wedge').length;
    if (!stairs && !ramps) continue;
    const F = furnish(preset, P, plan, S, catalog, rng.fork('furnish'), opts);
    const dist = distances(plan.cells.length, S.openings, plan.start);
    if (dist.some((d) => d === Infinity)) continue;
    const params = { ...(opts.floors ? { floors: opts.floors } : {}), ...(opts.puzzle ? { puzzle: true } : {}) };
    const level = {
      xspace: 1,
      kind: 'level',
      id: opts.id || `${presetId}_${seed}`,
      title: `${preset.title} · seed ${seed}`,
      profile: preset.profile,
      env: preset.env,
      cells: S.cells,
      portals: S.portals,
      brushes: S.brushes,
      entities: S.entities,
      lights: F.lights,
      triggers: F.triggers,
      spawns: F.spawns,
      source: source('gen', `src/gen/presets/${presetId}.js`, { params: { preset: presetId, kit: catalog.id, ...params }, seed }),
    };
    // rozpočet viditelného: co se z některé buňky nevejde, ubere z věcí na deskách; kdyby nestačilo, další pokus
    const brushTris = levelLightMeshes(level.brushes, catalog.materials, LIGHT_CELL).map((g) => (g ? g.indices.length / 3 : 0));
    const trisOf = (id) => (catalog.has(id) ? catalog.get(id).tris : 0);
    const fit = fitPVS(level, trisOf, brushTris, F.optional, PVS_BUDGET);
    if (fit.max > PVS_BUDGET) continue;
    const doors = S.openings.filter((o) => o.doorIds.length).length;
    return {
      level,
      info: {
        attempt,
        cells: plan.cells.length,
        floors: P.floors,
        portals: S.portals.length,
        doors,
        doorEntities: S.openings.reduce((n, o) => n + o.doorIds.length, 0),
        stairs,
        ramps,
        brushes: S.brushes.length,
        entities: level.entities.length,
        pvsMax: fit.max,
        pvsRemoved: fit.removed,
        lights: F.lights.length,
        farthest: Math.max(...dist),
        startCell: S.meta[plan.start].id,
      },
    };
  }
  throw new Error(`xGen: předvolba ${presetId}, seed ${seed}: ani jeden z ${MAX_ATTEMPTS} pokusů nesplnil podmínky`);
}

/** Manifest balíku s levely, který si prefaby a materiály bere ze sady. */
export function levelPackManifest(id, title, levels, kits) {
  return { xspace: 1, kind: 'pack', id, title, version: '0.1.0', free: true, requires: [].concat(kits), levels: levels.map((l) => `levels/${l.id}.json`), assets: [] };
}
