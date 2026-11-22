// T5: zkouška A × B (docs/04_SESNY.md, oddíl 5). Level z balíku sešny B běží v enginu sešny A beze změny kódu.
// Pro každý balík v packs/: validátor bez chyb. Pro každý level: načtení, hráč na zemi, každá buňka dosažitelná
// pro kapsli hráče, robot dojde ze startu do nejvzdálenější buňky, rozpočty volání kreslení a kroku simulace.
// Počty se berou z dat. Omezení: PACKS=golden,gen_demo a LEVELS=complex_7 (čárkou oddělené).

import { readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { checkPackDir, readPackFull } from '../tools/lib/read-pack.mjs';
import { createGame } from '../src/app/game.js';
import { createNullRender } from '../src/render/null.js';
import { createRobot } from './t5_lib/robot.mjs';

const require = createRequire(import.meta.url);
const h = require('./h.cjs');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = (name) => (process.env[name] ? process.env[name].split(',') : null);
const CALLS_MAX = 400; // docs/06_ROZPOCTY.md
const STEP_MS_MAX = 2;

const packIds = readdirSync(path.join(ROOT, 'packs')).filter((d) => existsSync(path.join(ROOT, 'packs', d, 'pack.json')) && (!only('PACKS') || only('PACKS').includes(d)));
h.ok(packIds.length > 0, 'v packs/ je aspoň jeden balík', packIds.join(', '));
const report = [];

for (const id of packIds) {
  const dir = path.join(ROOT, 'packs', id);
  const { res } = await checkPackDir(dir);
  h.ok(res.errors.length === 0, `${id}: validátor bez chyb`, `${res.errors.length} chyb, ${res.warnings?.length ?? 0} varování${res.errors[0] ? `; první: ${res.errors[0].code} ${res.errors[0].path}` : ''}`);
  const pack = await readPackFull(dir);
  for (const lv of pack.levels) {
    const lid = lv.data.id;
    if (only('LEVELS') && !only('LEVELS').includes(lid)) continue;
    const name = `${id}/${lid}`;
    const t0 = performance.now();
    const game = createGame({ pack, render: createNullRender() });
    await game.E.init();
    game.start(lid);
    game.sim(1);
    const P = game.player;
    const cells = game.world.cells;
    const spawnY = lv.data.spawns.find((s) => s.kind === 'player').pos[1];
    h.ok(P.grounded && Math.abs(P.pos[1] - spawnY) < 0.1, `${name}: level se načte a hráč stojí na zemi`, `${cells.length} buněk, ${lv.data.portals.length} portálů, ${lv.data.brushes.length} kvádrů, ${lv.data.entities.length} entit; nohy ve výšce ${P.pos[1].toFixed(3)} m`);

    const robot = createRobot(game);
    const { nav, stat } = robot;
    const start = nav.nearest(P.pos[0], P.pos[1], P.pos[2]);
    if (start < 0) {
      h.ok(false, `${name}: start hráče leží na schůdném místě`, `[${P.pos.join(', ')}]`);
      continue;
    }
    const d = nav.dijkstra(start);
    let far = null;
    const lost = [];
    for (const c of cells) {
      let reach = Infinity, node = -1, nodeGap = Infinity;
      const cx = (c.bounds.min[0] + c.bounds.max[0]) / 2, cz = (c.bounds.min[2] + c.bounds.max[2]) / 2;
      for (const m of nav.inCell(c)) {
        if (!nav.free[m] || !Number.isFinite(d.dist[m])) continue;
        reach = Math.min(reach, d.dist[m]);
        const gap = Math.hypot(nav.X[m] - cx, nav.Z[m] - cz);
        if (gap < nodeGap) { nodeGap = gap; node = m; }
      }
      if (node < 0) lost.push(c.id);
      else if (!far || reach > far.reach) far = { cell: c.id, reach, node };
    }
    h.ok(lost.length === 0, `${name}: každá buňka je dosažitelná pro kapsli hráče (poloměr ${P.profile.radius} m)`, `${cells.length - lost.length} z ${cells.length}${lost.length ? `; nedosažitelné: ${lost.slice(0, 6).join(', ')}${lost.length > 6 ? ' …' : ''}` : ''}; mřížka ${nav.g} m, ${nav.count} míst`);

    const arrived = far ? robot.goTo(far.node) : false;
    const here = game.world.cellAt(P.pos)?.id;
    const len = far ? d.dist[far.node] : 0;
    h.ok(arrived && here === far.cell, `${name}: robot došel ze startu do nejvzdálenější buňky`, `${far?.cell}, cesta ${len.toFixed(1)} m za ${stat.simT.toFixed(0)} s hry; dveří na cestě otevřeno rukou ${stat.hand}, ovladačem ${stat.actuator}, vynuceně ${stat.forced}; bez postupu ${stat.stuck}×${stat.why ? `; ${stat.why}` : ''}`);
    h.ok(stat.forced === 0 && stat.doorFail.length === 0, `${name}: všechny dveře na cestě šly otevřít rukou nebo ovladačem`, `vynuceně ${stat.forced}, neotevřeno ${stat.doorFail.length}`);
    h.ok(stat.maxCalls <= CALLS_MAX, `${name}: volání kreslení na pohled ≤ ${CALLS_MAX}`, `nejvýš ${stat.maxCalls} po cestě (horní mez: sítě ve viditelných buňkách)`);
    const ms = [...stat.stepMs].sort((a, b) => a - b);
    const med = ms.length ? ms[ms.length >> 1] : 0;
    h.ok(med <= STEP_MS_MAX, `${name}: krok simulace ≤ ${STEP_MS_MAX} ms (sandbox, orientačně)`, `medián ${med.toFixed(2)} ms, 95 % ${(ms[Math.floor(ms.length * 0.95)] ?? 0).toFixed(2)} ms z ${ms.length} měření`);
    report.push({ pack: id, level: lid, cells: cells.length, unreachable: lost, far: far?.cell, pathM: +len.toFixed(1), arrived: arrived && here === far?.cell, simS: +stat.simT.toFixed(1), doors: { level: stat.doors, hand: stat.hand, actuator: stat.actuator, forced: stat.forced, failed: stat.doorFail }, stuck: stat.stuck, maxCalls: stat.maxCalls, stepMsMedian: +med.toFixed(3), wallS: +((performance.now() - t0) / 1000).toFixed(1), why: stat.why, views: [0.2, 0.45, 0.7, 0.95].map((f) => stat.trail[Math.min(Math.floor(stat.trail.length * f), stat.trail.length - 1)]).filter(Boolean) });
    game.phys.close?.();
  }
}

mkdirSync(path.join(ROOT, 'test/out'), { recursive: true });
writeFileSync(path.join(ROOT, 'test/out/t5_axb.json'), JSON.stringify(report, null, 1));
process.exit(h.finish('T5 zkouška A × B'));
