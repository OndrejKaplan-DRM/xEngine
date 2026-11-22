// Vývojová pomůcka: rozložení počtu buněk, pokusů, dveří, entit a času přes seedy + nálezy validátoru.
// node tools/designer/dev/stats.mjs <předvolba> [počet seedů = 40] [floors=1] [puzzle=true]
import { generateLevel, makeCatalog } from '../../../src/gen/index.js';
import { kitAsPack } from '../../forge/kit/index.mjs';
import { validatePack, mergePacks } from '../../../src/xspace/index.js';
const kit = kitAsPack();
const catalog = makeCatalog(kit);
const [preset, n = 40, ...rest] = process.argv.slice(2);
const opts = Object.fromEntries(rest.map((r) => r.split('=')).map(([k, v]) => [k, v === 'true' ? true : Number(v)]));
const agg = { cells: [], attempt: [], corr: [], doors: [], ms: [], ents: [] };
const codes = {};
let fails = 0;
for (let seed = 1; seed <= Number(n); seed++) {
  try {
    const t0 = performance.now();
    const { level, info } = generateLevel(preset, seed, catalog, opts);
    agg.ms.push(performance.now() - t0);
    agg.cells.push(info.cells); agg.attempt.push(info.attempt); agg.doors.push(info.doorEntities); agg.ents.push(info.entities);
    agg.corr.push(level.cells.filter((c) => c.id.startsWith('c_corr')).length);
    const pack = mergePacks({ manifest: { xspace: 1, kind: 'pack', id: 'x', title: 'x', version: '0.1.0', free: true, requires: ['kit_base'], levels: ['l.json'], assets: [] }, materials: null, prefabs: [], levels: [{ file: 'l.json', data: level }], loadErrors: [] }, [kit]);
    const res = validatePack(pack);
    for (const x of [...res.errors, ...res.warnings]) { codes[x.code] = (codes[x.code] || 0) + 1; if ((codes[x.code]) <= 2) console.log(seed, x.level, x.code, x.path, x.msg); }
  } catch (e) { fails++; console.log(seed, 'SELHALO', e.message); }
}
const st = (a) => `${Math.min(...a).toFixed(0)}–${Math.max(...a).toFixed(0)} (prům. ${(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1)})`;
console.log(preset, JSON.stringify(opts), `seedů ${n}, selhalo ${fails}`);
for (const k of Object.keys(agg)) console.log(' ', k, st(agg[k]));
console.log('  nálezy', JSON.stringify(codes));
