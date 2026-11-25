// Atlas textury světla nad balíkem: node tools/svod/atlas_try.mjs [adresář balíku] [index levelu] (cesty k repu natvrdo /home/claude/xengine).
import { checkPackDir } from '/home/claude/xengine/tools/lib/read-pack.mjs';
import * as X from '/home/claude/xengine/src/xspace/index.js';
import { lightmapLayout, lightmapTexels, lightmapDilation } from '/home/claude/xengine/src/xspace/atlas.js';
const dir = process.argv[2] || '/home/claude/xengine/packs/golden';
const lvlIdx = +(process.argv[3] || 0);
const { pack } = await checkPackDir(dir);
const pf = new Map(pack.prefabs.map((p) => [p.data.id, p.data]));
const L = pack.levels[lvlIdx].data;
const S = X.levelSamples(L, pf, pack.materials.materials, X.LIGHT_CELL);
for (const texel of [0.1, 0.05]) {
  let t = performance.now();
  const lay = lightmapLayout(S, texel);
  const t1 = performance.now() - t; t = performance.now();
  const tx = lightmapTexels(lay);
  const t2 = performance.now() - t; t = performance.now();
  const dil = lightmapDilation(lay.width, lay.height, tx.index);
  const t3 = performance.now() - t;
  console.log(L.id, texel, `atlas ${lay.width}×${lay.height}, map ${lay.charts.length}, vzorků ${S.count}, v atlasu ${lay.inAtlas}, bodů ${tx.index.length} (${(100*tx.index.length/(lay.width*lay.height)).toFixed(1)} %), okraj ${dil.target.length}, ${t1.toFixed(0)}/${t2.toFixed(0)}/${t3.toFixed(0)} ms, hash ${lay.hash}`);
}
