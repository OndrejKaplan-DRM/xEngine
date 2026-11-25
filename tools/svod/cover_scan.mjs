// Projde všechny portály s dveřmi v balíku a vypíše nezakryté škvíry podle src/xspace/cover.js.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [root, dir] = process.argv.slice(2);
const imp = (p) => import(pathToFileURL(path.join(root, p)).href);
const { readPackFull } = await imp('tools/lib/read-pack.mjs');
const { doorCoverGap } = await imp('src/xspace/cover.js');
const pack = await readPackFull(path.resolve(dir));
const pf = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const mats = pack.materials?.materials || null;
for (const { data: L } of pack.levels) {
  const ents = new Map(L.entities.map((e) => [e.id, e]));
  let n = 0, see = 0, bad = 0; const ex = [];
  for (const p of L.portals) {
    if (!p.door) continue; n++;
    const e = ents.get(p.door); const P = pf.get(e.prefab);
    if (P.components?.interact?.seeThrough) { see++; continue; }
    const g = doorCoverGap(p, e, P, mats);
    if (g) { bad++; if (ex.length < 4) ex.push(`${p.id} ${e.prefab}: ${(g.w*100).toFixed(1)} × ${(g.h*100).toFixed(1)} cm, plocha ${(g.area*1e4).toFixed(1)} cm²`); }
  }
  console.log(`${L.id}: portálů s dveřmi ${n}, seeThrough ${see}, se škvírou ${bad}${ex.length ? '\n   ' + ex.join('\n   ') : ''}`);
}
