// B-T1: xGen v Node. Stavebnice, 200 seedů × 2 předvolby bez nálezu validátoru, vlastní kontroly geometrie
// (prahy, průchody, schody, průchodnost), opakovatelnost bajt po bajtu, čas a ukázkový balík.
// Počty se berou z dat; pevná čísla jsou jen meze ze zadání (20 až 60 buněk, aspoň troje dveře, 1 s).

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync, cpSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLevel, makeCatalog, levelPackManifest, fmtJson, PRESETS, kit as K } from '../src/gen/index.js';
import { validatePack, mergePacks } from '../src/xspace/index.js';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import { kitAsPack } from '../tools/forge/kit/index.mjs';
import { makeChecker, span } from './b_lib/check.mjs';
import { inspectLevel } from './b_lib/level-checks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEEDS = Number(process.env.B_SEEDS || 200);
const { ok, finish } = makeChecker('B-T1 xGen');
const kitPack = kitAsPack();
const catalog = makeCatalog(kitPack);
const SRC = { tool: 'rucne', license: 'own' };

/** Level jako balík spojený se sadou, tak jak ho uvidí validátor i engine. */
function asPack(level) {
  const main = { manifest: levelPackManifest('zkouska', 'Zkouška', [level], kitPack.manifest.id), materials: null, prefabs: [], levels: [{ file: `levels/${level.id}.json`, data: level }], loadErrors: [] };
  return mergePacks(main, [kitPack]);
}

// ---- stavebnice: dvě místnosti, chodba, schody, rampa a sloup složené ručně --------------------
{
  const b = K.createBuilder();
  const T = 20;
  const mats = { floor: 'concrete_smooth', wall: 'concrete_raw', ceiling: 'plaster_grey', face: 'plaster_light' };
  const door = { c0: 250, c1: 350, sill: 0, top: 210 };
  // místnost A staví všechny své zdi; chodba B na ni navazuje a společnou zeď (−z) nestaví
  const qa = K.room(b, { cell: 'c_a', rect: { x0: 0, x1: 600, z0: 0, z1: 500 }, y0: 0, y1: 300, T, mats, walls: { '+z': { openings: [door] } } });
  K.room(b, { cell: 'c_b', rect: { x0: 0, x1: 600, z0: 520, z1: 700 }, y0: 0, y1: 270, T, mats, walls: { '-z': false } });
  K.stairs(b, { cell: 'c_a', run: K.RUN_X, dir: 1, at: 100, s0: 100, s1: 220, baseY: 0, steps: 4, riser: 18, tread: 28, mat: 'metal_floor' });
  K.block(b, 'c_a', { x0: 212, x1: 400, z0: 100, z1: 220 }, 0, 90, 'metal_floor');
  K.ramp(b, 'c_a', { x0: 400, x1: 580, z0: 100, z1: 220 }, 0, 90, '-x', 'metal_floor');
  K.pillar(b, 'c_a', 300, 380, 40, 0, 300, 'concrete_raw');
  const level = {
    xspace: 1,
    kind: 'level',
    id: 'stavebnice',
    title: 'Zkouška stavebnice',
    profile: 'real',
    env: { ambient: [0.1, 0.1, 0.1] },
    cells: [
      { id: 'c_a', bounds: { min: [0, 0, 0], max: [6, 3, 5] } },
      { id: 'c_b', bounds: { min: [0, 0, 5.2], max: [6, 2.7, 7] } },
    ],
    portals: [{ id: 'p_ab', a: 'c_a', b: 'c_b', quad: qa[0].quad }],
    brushes: b.brushes,
    spawns: [{ id: 'sp_player', kind: 'player', pos: [1, 0, 4], yaw: 0 }],
    source: SRC,
  };
  const res = validatePack(asPack(level));
  ok(res.errors.length === 0 && res.warnings.length === 0, 'stavebnice: ručně složené místnosti projdou validátorem bez nálezu', [...res.errors, ...res.warnings].map((x) => x.code).join(' '));
  const insp = inspectLevel(level, catalog);
  ok(insp.problems.length === 0, 'stavebnice: práh pod otvorem, portál uprostřed zdi, schody a rampa v mezích', insp.problems.slice(0, 3).join(' | '));
  ok(qa.length === 1 && qa[0].quad.every((q) => q[2] === 5.1), 'stavebnice: portál leží uprostřed tloušťky zdi', JSON.stringify(qa[0].quad[0]));
  const walls = b.brushes.filter((x) => x.tag === 'wall');
  ok(walls.every((w) => w.cell === 'c_a' || w.min[2] >= 5.2 - 1e-9), 'stavebnice: sdílenou zeď postavila jen jedna buňka');
  ok(b.brushes.filter((x) => x.tag === 'stair').length === 4 && b.brushes.some((x) => x.shape === 'wedge' && x.rise === '-x'), 'stavebnice: čtyři stupně a klín rampy');
}

// ---- 200 seedů × předvolby ------------------------------------------------------------------
const RUNS = [
  { preset: 'complex', opts: {}, n: SEEDS, name: 'complex (dvě patra)' },
  { preset: 'catacombs', opts: {}, n: SEEDS, name: 'catacombs' },
  { preset: 'complex', opts: { floors: 1 }, n: Math.ceil(SEEDS / 4), name: 'complex (jedno patro)' },
  { preset: 'complex', opts: { puzzle: true }, n: Math.ceil(SEEDS / 4), name: 'complex s hádankou' },
];
let slowest = 0;
for (const run of RUNS) {
  const agg = { cells: [], doors: [], ms: [], attempt: [], entities: [], brushes: [], passable: [] };
  const findings = {};
  const problems = [];
  const fails = [];
  let withStairs = 0;
  let puzzles = 0;
  let prefabsUsed = new Set();
  for (let seed = 1; seed <= run.n; seed++) {
    let made;
    const t0 = performance.now();
    try {
      made = generateLevel(run.preset, seed, catalog, run.opts);
    } catch (e) {
      fails.push(`seed ${seed}: ${e.message}`);
      continue;
    }
    const ms = performance.now() - t0;
    const { level, info } = made;
    agg.ms.push(ms);
    agg.cells.push(level.cells.length);
    agg.doors.push(level.portals.filter((p) => p.door).length);
    agg.attempt.push(info.attempt);
    agg.entities.push(level.entities.length);
    agg.brushes.push(level.brushes.length);
    const res = validatePack(asPack(level));
    for (const x of [...res.errors, ...res.warnings]) findings[x.code] = (findings[x.code] || 0) + 1;
    const insp = inspectLevel(level, catalog);
    agg.passable.push(insp.passableCells);
    for (const p of insp.problems.slice(0, 2)) problems.push(`seed ${seed}: ${p}`);
    if (insp.stairs + insp.ramps > 0) withStairs++;
    if (level.entities.some((e) => e.props && e.props.locked)) puzzles++;
    for (const e of level.entities) prefabsUsed.add(e.prefab);
  }
  slowest = Math.max(slowest, ...agg.ms);
  const n = agg.cells.length;
  ok(fails.length === 0 && n === run.n, `${run.name}: ${run.n} seedů, každý dal level`, fails.slice(0, 2).join(' | ') || `pokusů na level ${span(agg.attempt.map((a) => a + 1))}`);
  ok(Object.keys(findings).length === 0, `${run.name}: validátor bez chyb a bez varování`, JSON.stringify(findings) === '{}' ? `${n} levelů` : JSON.stringify(findings));
  ok(Math.min(...agg.cells) >= 20 && Math.max(...agg.cells) <= 60, `${run.name}: 20 až 60 buněk`, span(agg.cells));
  ok(Math.min(...agg.doors) >= 3, `${run.name}: aspoň troje dveře v portálech`, span(agg.doors));
  ok(withStairs === n, `${run.name}: každý level má schod nebo rampu`, `${withStairs} z ${n}`);
  ok(problems.length === 0, `${run.name}: prahy, průchody, schody, rozmístění a průchodnost místností`, problems.slice(0, 3).join(' | ') || `průchodnost ověřena v ${span(agg.passable)} buňkách na level`);
  ok(Math.max(...agg.ms) < 1000, `${run.name}: generování pod 1 s`, `${span(agg.ms, 1)} ms; kvádrů ${span(agg.brushes)}, entit ${span(agg.entities)}`);
  if (run.opts.puzzle) ok(puzzles >= n * 0.9, `${run.name}: zamčená místnost s pákou`, `${puzzles} z ${n}`);
  if (!run.opts.puzzle && !run.opts.floors) ok(prefabsUsed.size >= (run.preset === 'complex' ? 25 : 8), `${run.name}: generátor rozmisťuje prefaby sady`, `${prefabsUsed.size} různých prefabů z ${catalog.ids.length}`);
}

// ---- 50 místností do 1 s ---------------------------------------------------------------------
{
  let best = null;
  for (let seed = 1; seed <= 400 && !best; seed++) {
    const t0 = performance.now();
    const { level } = generateLevel('complex', seed, catalog, {});
    const ms = performance.now() - t0;
    if (level.cells.length >= 50) best = { seed, cells: level.cells.length, ms };
  }
  ok(best && best.ms < 1000, 'level s aspoň 50 buňkami vznikne do 1 s', best ? `seed ${best.seed}: ${best.cells} buněk za ${best.ms.toFixed(1)} ms` : 'žádný seed nedal 50 buněk');
}

// ---- opakovatelnost --------------------------------------------------------------------------
for (const id of Object.keys(PRESETS)) {
  const a = fmtJson(generateLevel(id, 12345, catalog, {}).level);
  const b = fmtJson(generateLevel(id, 12345, makeCatalog(kitAsPack()), {}).level);
  const c = fmtJson(generateLevel(id, 12346, catalog, {}).level);
  ok(a === b, `${id}: stejný seed dvakrát = stejné bajty`, `${a.length} znaků`);
  ok(a !== c, `${id}: jiný seed = jiný level`);
}
{
  const code = readdirSync(path.join(root, 'src/gen'), { recursive: true })
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(path.join(root, 'src/gen', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))
    .join('\n');
  ok(!/Math\.random|Date\.now|new Date\(|performance\.now|setTimeout/.test(code), 'v kódu src/gen není Math.random ani čas (náhoda jen přes rngNext)');
}

// ---- ukázkový balík a nástroj z příkazové řádky ------------------------------------------------
{
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'xgen-'));
  cpSync(path.join(root, 'packs/kit_base'), path.join(tmp, 'kit_base'), { recursive: true });
  const out = path.join(tmp, 'gen_demo');
  execFileSync(process.execPath, [path.join(root, 'src/gen/cli.mjs'), 'demo', '--out', out, '--kit', path.join(tmp, 'kit_base')], { stdio: 'pipe' });
  const list = (dir, rel = '') => readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? list(dir, path.join(rel, d.name)) : [path.join(rel, d.name)]));
  const repo = path.join(root, 'packs/gen_demo');
  const a = list(repo).sort();
  const b = list(out).sort();
  ok(a.join('|') === b.join('|') && a.every((f) => readFileSync(path.join(repo, f)).equals(readFileSync(path.join(out, f)))), 'nástroj cli.mjs dává bajtově totéž, co je v packs/gen_demo', `${a.length} souborů`);
  const { pack, res } = await checkPackDir(repo);
  ok(res.ok && res.errors.length === 0 && res.warnings.length === 0, 'packs/gen_demo projde kontrolou balíku (--strict) spolu se sadou', [...res.errors, ...res.warnings].map((x) => x.code).slice(0, 4).join(' '));
  ok(pack.levels.length >= 3 && new Set(pack.levels.map((l) => l.data.source.params.preset)).size >= 2, 'ukázkový balík má aspoň tři levely ze dvou předvoleb', pack.levels.map((l) => l.data.id).join(' '));
  let bad = null;
  try {
    execFileSync(process.execPath, [path.join(root, 'src/gen/cli.mjs'), 'neznama', '--seed', '1', '--out', path.join(tmp, 'x')], { stdio: 'pipe' });
  } catch (e) {
    bad = e.status;
  }
  ok(bad === 1, 'neznámá předvolba skončí chybou, ne prázdným balíkem');
}

process.exit(finish());
