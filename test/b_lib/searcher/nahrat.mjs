// Nahraje odpovědi rozhraní, nad kterými běží test b_t7_searcher bez sítě. Potřebuje síť; pouští se ručně:
//   NODE_USE_ENV_PROXY=1 node test/b_lib/searcher/nahrat.mjs      (za proxy; jinak bez proměnné)
// Seznam textur Poly Haven (24. 11. 2026: 871 položek, 857 kB) se zkrátí na 30 nejlepších k dotazu testu a 20 nesouvisejících.
// Po novém nahrání se mohou změnit pořadí a počty výsledků; test je bere z těchto souborů, ne natvrdo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeHttp } from '../../../tools/searcher/http.mjs';
import * as ph from '../../../tools/searcher/sources/polyhaven.mjs';
import * as acg from '../../../tools/searcher/sources/ambientcg.mjs';
import { translate, score, rank } from '../../../tools/searcher/match.mjs';
import { today } from '../../../tools/searcher/inbox.mjs';

export const QUERY = 'beton podlaha';
export const LIMIT = 6;
export const PH_ID = 'concrete_floor_worn_001';
export const ACG_ID = 'Tiles107';
const TOP = 30;
const EXTRA = 20;

const dir = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) fs.rmSync(path.join(dir, f));
  const http = makeHttp({ record: dir });
  const words = translate(QUERY);
  await ph.search(http, words, { limit: LIMIT });
  await ph.info(http, PH_ID);
  await ph.files(http, { id: PH_ID });
  await acg.search(http, words, { limit: LIMIT });
  await acg.info(http, ACG_ID);

  const indexFile = path.join(dir, 'index.json');
  const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  const listFile = path.join(dir, index.files['https://api.polyhaven.com/assets?t=textures']);
  const all = JSON.parse(fs.readFileSync(listFile, 'utf8'));
  const ids = Object.keys(all).sort();
  const asAsset = (id) => ({ id, title: all[id].name, tags: all[id].tags, categories: all[id].categories, description: all[id].description, popularity: all[id].download_count ?? 0 });
  const matching = ids.filter((id) => score(asAsset(id), words) > 0);
  const hit = rank(matching.map(asAsset), words).slice(0, TOP).map((a) => a.id);
  const rest = ids.filter((id) => !matching.includes(id)).slice(0, EXTRA);
  const keep = Object.fromEntries([...hit, ...rest].sort().map((id) => [id, all[id]]));
  fs.writeFileSync(listFile, JSON.stringify(keep) + '\n');
  index.note =
    `Odpovědi rozhraní Poly Haven a ambientCG nahrané ${today()} skriptem nahrat.mjs (User-Agent xSearcheru). ` +
    `Seznam textur Poly Haven zkrácen z ${ids.length} na ${Object.keys(keep).length} položek: ${hit.length} nejlepších z ${matching.length} k dotazu „${QUERY}“ a ${rest.length} nesouvisejících.`;
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
  console.log(index.note);
  console.log(http.calls.map((c) => `${c.status} ${c.bytes} B ${c.url}`).join('\n'));
}
