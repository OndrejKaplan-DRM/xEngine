// Počty vzorků podle levelSamples nad balíkem. Použití: node samples_count.mjs <kořen repa> <adresář balíku>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [root, dir] = process.argv.slice(2);
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const { readPackFull } = await imp('tools/lib/read-pack.mjs');
const X = await imp('src/xspace/index.js');
const pack = await readPackFull(path.resolve(dir));
const prefabs = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const mats = pack.materials?.materials || null;
for (const { data: L } of pack.levels) {
  const t0 = performance.now();
  const s = X.levelSamples(L, prefabs, mats);
  const nb = s.brushCounts.reduce((a, [, n]) => a + n, 0);
  const ne = s.entityCounts.reduce((a, [, n]) => a + n, 0);
  const withParts = s.entityCounts.filter(([, n]) => n).length;
  console.log(`${L.id}: vzorků ${s.count} = kvádry ${nb} + pevné díly ${ne} (entit s díly ${withParts} z ${L.entities.length}); brush id ${L.brushes[0].id}; ${(performance.now() - t0).toFixed(0)} ms`);
}
