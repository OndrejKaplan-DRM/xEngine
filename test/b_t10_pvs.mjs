// B-T10: co je z buňky prokazatelně vidět (PVS, test/b_lib/pvs.mjs) a rozpočet viditelných trojúhelníků.
// Ondřej 25. 11. 2026 v 1:29: „chytře škrtejme, co není vidět. Ale opravdu prokazatelně.“ Ověřuje se (1) výpočet
// na ručně složených případech, kde je odpověď jasná z geometrie, (2) shoda s měřením enginu na T460: engine nikdy
// nenakreslil víc trojúhelníků, než PVS dovolí, (3) PVS ukázkových levelů a délka řetězů portálů.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelPVS, visibleTris, portalSegment } from './b_lib/pvs.mjs';
import { levelLightMeshes } from '../src/xspace/index.js';
import { makeChecker } from './b_lib/check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ok, finish } = makeChecker('B-T10 PVS');

// ---- ručně složené případy: buňky v řadě podél x, otvory ve zdech x = 4, 8, 12 (z od–do)
const row = (doors) => ({
  cells: doors.map((_, i) => ({ id: `c${i}` })).concat([{ id: `c${doors.length}` }]),
  portals: doors.map(([x, z0, z1], i) => ({ id: `p${i}`, a: `c${i}`, b: `c${i + 1}`, quad: [[x, 0, z0], [x, 0, z1], [x, 2, z1], [x, 2, z0]] })),
});
{
  const straight = levelPVS(row([[4, 1, 2], [8, 1, 2], [12, 1, 2]]));
  ok(straight.get('c0').has('c3'), 'otvory v zákrytu: z první buňky je vidět čtvrtá');
  const bent = levelPVS(row([[4, 0, 1], [8, 3, 4], [12, 0, 1]]));
  ok(bent.get('c0').has('c1') && bent.get('c0').has('c2') && !bent.get('c0').has('c3'), 'otvory dole, nahoře, dole: přímka třemi neprojde, čtvrtá buňka vidět není (třetí ano)');
  // otvor ve zdi kolmé na druhou osu: c1 má výstup v zdi z = 4 (x 5 až 6), potom do c3 zeď z = 8
  const turn = {
    cells: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
    portals: [
      { id: 'p0', a: 'a', b: 'b', quad: [[4, 0, 1], [4, 0, 2], [4, 2, 2], [4, 2, 1]] },
      { id: 'p1', a: 'b', b: 'c', quad: [[5, 0, 4], [6, 0, 4], [6, 2, 4], [5, 2, 4]] },
      { id: 'p2', a: 'c', b: 'd', quad: [[5, 0, 8], [6, 0, 8], [6, 2, 8], [5, 2, 8]] },
    ],
  };
  const T = levelPVS(turn);
  // z a do d: přímka x = 4 (z 1–2) → z = 4 (x 5–6) → z = 8 (x 5–6) by musela jít doprava i zpět: nelze
  ok(T.get('a').has('c') && !T.get('a').has('d') && T.get('b').has('d'), 'zalomená chodba: za roh je vidět o jednu buňku, za dva rohy ne; ze střední buňky obě strany', [...T.get('a')].join(' '));
  // dva otvory v téže zdi buňky: jeden druhým vidět není (přímka by šla po zdi)
  const same = {
    cells: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    portals: [
      { id: 'p0', a: 'a', b: 'b', quad: [[4, 0, 0], [4, 0, 1], [4, 2, 1], [4, 2, 0]] },
      { id: 'p1', a: 'b', b: 'c', quad: [[4, 0, 3], [4, 0, 4], [4, 2, 4], [4, 2, 3]] },
    ],
  };
  ok(!levelPVS(same).get('a').has('c'), 'dva otvory v téže zdi: z první buňky není třetí vidět');
  ok(portalSegment({ quad: [[1, 0, 2], [1, 0, 3], [1, 2, 3], [1, 2, 2]] }).axis === 'x', 'průmět otvoru do půdorysu: zeď x = konst.');
}

// ---- ukázkové levely: PVS, rozpočet a shoda s měřením na T460
const prefabTris = new Map();
const mats = {};
// sady a levely z manifestu ukázkového balíku (počty z dat, ne z testu)
const demo = JSON.parse(fs.readFileSync(path.join(root, 'packs/gen_demo/pack.json'), 'utf8'));
for (const k of demo.requires) {
  for (const f of fs.readdirSync(path.join(root, 'packs', k, 'prefabs'))) {
    const p = JSON.parse(fs.readFileSync(path.join(root, 'packs', k, 'prefabs', f), 'utf8'));
    prefabTris.set(p.id, p.tris);
  }
  Object.assign(mats, JSON.parse(fs.readFileSync(path.join(root, 'packs', k, 'materials.json'), 'utf8')).materials);
}
const load = (id) => JSON.parse(fs.readFileSync(path.join(root, 'packs/gen_demo/levels', `${id}.json`), 'utf8'));
const rows = [];
let deepest = 0;
for (const id of demo.levels.map((f) => path.basename(f, '.json'))) {
  const L = load(id);
  const t0 = performance.now();
  const pvs = levelPVS(L);
  const ms = performance.now() - t0;
  deepest = Math.max(deepest, pvs.depth);
  const at = (cell) => {
    const bt = levelLightMeshes(L.brushes, mats, cell).map((m) => (m ? m.indices.length / 3 : 0));
    return visibleTris(L, (p) => prefabTris.get(p) || 0, pvs, bt);
  };
  const v5 = at(0.5);
  const v25 = at(0.25);
  const sym = L.cells.every((c) => [...pvs.get(c.id)].every((o) => pvs.get(o).has(c.id)));
  rows.push({ id, L, pvs, v5, v25, ms, sym });
}
ok(rows.every((r) => r.sym), 'viditelnost je souměrná (vidím-li z A do B, vidím z B do A)');
ok(rows.every((r) => r.v5.max <= 300000), 'ukázkové levely: z žádné buňky víc než 300 tisíc △ při mřížce dat 0,5 m', rows.map((r) => `${r.id} ${r.v5.max} (${r.v5.cell})`).join(' | '));
ok(rows.every((r) => r.ms < 2000), 'PVS levelu do 2 s', rows.map((r) => `${r.id} ${r.ms.toFixed(0)} ms, ${r.pvs.chains} řetězů`).join(' | '));
// Ondřejův běh ?bench (T460, 25. 11. 1:14, complex_7, mřížka světla 0,25 m): nejvíc △ v pohledu
const bench = JSON.parse(fs.readFileSync(path.join(root, 'docs/navrhy/N-011-bench-T460-2026-11-25.json'), 'utf8'));
const c7 = rows.find((r) => r.id === 'complex_7');
const hot = bench.cells.reduce((a, b) => (b.callsMax > a.callsMax ? b : a));
ok(bench.level.id === 'complex_7' && bench.level.lightGrid === 0.25 && c7.v25.max >= bench.draw.tris.max, 'engine na T460 nenakreslil víc △, než PVS dovolí (horní mez drží proti měření)', `PVS při mřížce 0,25 m nejvýš ${c7.v25.max} △ (${c7.v25.cell}); T460 změřil nejvýš ${bench.draw.tris.max} △; nejvíc volání (${hot.callsMax}) v ${hot.cell}`);
ok(deepest <= 12, 'nejdelší řetěz portálů, kterým je něco vidět, je nejvýš 12 (mez MAX_DEPTH viditelnosti sešny A; delší by se usekl a místnost by blikla)', `nejdelší ${deepest}`);

finish();
