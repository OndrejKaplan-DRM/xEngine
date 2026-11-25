// B-T1: xGen v Node. Stavebnice, 200 seedů × 2 předvolby bez nálezu validátoru, vlastní kontroly geometrie
// (prahy, průchody, schody, průchodnost), opakovatelnost bajt po bajtu, čas a ukázkový balík.
// Počty se berou z dat; pevná čísla jsou jen meze ze zadání (20 až 60 buněk, aspoň troje dveře, 1 s).

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync, cpSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLevel, makeCatalog, mergeKits, levelPackManifest, fmtJson, PRESETS, kit as K } from '../src/gen/index.js';
import { validatePack, mergePacks, doorInteraction, levelLightMeshes, LIGHT_CELL } from '../src/xspace/index.js';
import { levelPVS, visibleTris } from './b_lib/pvs.mjs';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import { kitAsPack } from '../tools/forge/kit/index.mjs';
import { THEMES } from '../tools/forge/themes.mjs';
import { asPack as themePack } from '../tools/forge/theme.mjs';
import { makeChecker, span } from './b_lib/check.mjs';
import { inspectLevel, portalDoors } from './b_lib/level-checks.mjs';
import { doorLeaks } from './b_lib/door-cover.mjs';
import { playerOf, PROFILE_IDS } from './b_lib/player.mjs';
import { BODY, bodyWidth, passRadius } from '../src/gen/body.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEEDS = Number(process.env.B_SEEDS || 200);
const { ok, finish } = makeChecker('B-T1 xGen');
// sady jako v packs/ (kit_base, kit_lab, kit_it, kit_home), sestavené v paměti stejným kódem jako make-pack
const kitsNow = () => [kitAsPack(), ...['kit_lab', 'kit_it', 'kit_home'].map((id) => themePack(THEMES[id].build()))];
const KITS = kitsNow();
const kitPack = KITS[0];
const catalog = makeCatalog(mergeKits(KITS));
const baseCatalog = makeCatalog(kitPack);
// materiály všech sad (schované plochy kvádrů nemají síť světla, D-037)
const MATS = Object.assign({}, ...KITS.map((k) => k.materials.materials));
const SRC = { tool: 'rucne', license: 'own' };

/** Level jako balík spojený se sadami, tak jak ho uvidí validátor i engine. */
function asPack(level, cat = catalog) {
  const main = { manifest: levelPackManifest('zkouska', 'Zkouška', [level], cat.kits), materials: null, prefabs: [], levels: [{ file: `levels/${level.id}.json`, data: level }], loadErrors: [] };
  return mergePacks(main, KITS.filter((k) => cat.kits.includes(k.manifest.id)));
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

// ---- postava: generátor staví pro hráče, jakého má engine ---------------------------------------
{
  // rozměry jsou v generátoru na jednom místě (src/gen/body.js) a předvolby je jen předávají dál
  const mine = { radius: BODY.radius / 100, skin: BODY.skin / 100 };
  const real = PROFILE_IDS.map(playerOf);
  const widest = Math.max(...real.map((p) => p.width));
  ok(real.every((p) => mine.radius >= p.radius - 1e-9 && mine.skin >= p.skin - 1e-9) && bodyWidth() / 100 >= widest - 1e-9, 'postava generátoru není menší než hráč enginu (profil pohybu a odstup kontroléru)', `generátor ${(bodyWidth() / 100).toFixed(2)} m, engine ${real.map((p) => `${p.profile} ${p.width.toFixed(2)} m`).join(', ')}`);
  ok(Object.values(PRESETS).every((p) => p.params({}).body === BODY) && passRadius() * 2 > widest, 'předvolby berou postavu z body.js a cestu místností hledají s rezervou', `cesta ${(passRadius() * 2).toFixed(2)} m, hráč ${widest.toFixed(2)} m`);
  const code = ['passage.js', 'furnish.js', 'build.js'].map((f) => readFileSync(path.join(root, 'src/gen', f), 'utf8')).join('\n');
  ok(!/R\s*=\s*0\.\d/.test(code), 'poloměr postavy není v kódu generátoru napsaný číslem');
}

// ---- dům: byty jako souvislé skupiny místností bytu (přes portály) s jedněmi dveřmi do chodby
const HOME = /^c_(hallway|living|kitchen|bedroom|kids|study|bath|studio)_/;
function apartmentsOf(level, st) {
  const home = new Set(level.cells.filter((c) => HOME.test(c.id)).map((c) => c.id));
  const par = new Map([...home].map((id) => [id, id]));
  const find = (x) => (par.get(x) === x ? x : (par.set(x, find(par.get(x))), par.get(x)));
  for (const p of level.portals) if (home.has(p.a) && home.has(p.b)) par.set(find(p.a), find(p.b));
  const comps = new Map([...home].map((id) => [find(id), { rooms: 0, corr: 0 }]));
  for (const id of home) comps.get(find(id)).rooms++;
  for (const p of level.portals) {
    const h = home.has(p.a) && !home.has(p.b) ? p.a : home.has(p.b) && !home.has(p.a) ? p.b : null;
    if (!h) continue;
    const o = h === p.a ? p.b : p.a;
    if (/^c_stair_/.test(o)) st.bad.push(`${level.id}: ${h} vede do schodiště`);
    else if (/^c_corr_/.test(o)) comps.get(find(h)).corr++;
  }
  const flats = [...comps.values()].filter((x) => x.rooms >= 2);
  for (const f of flats) if (f.corr !== 1) st.bad.push(`${level.id}: byt o ${f.rooms} místnostech má ${f.corr} dveří do chodby`);
  st.flats.push(flats.length);
  // podlaží domu: buňky kromě schodiště a nádvoří (nádvoří je o 68 cm níž než přízemí)
  const ys = [...new Set(level.cells.filter((c) => !/^c_(stair|yard)_/.test(c.id)).map((c) => c.bounds.min[1]))];
  st.floors.push(ys.length);
}

// ---- 200 seedů × předvolby ------------------------------------------------------------------
const RUNS = [
  { preset: 'complex', opts: {}, n: SEEDS, name: 'complex (dvě patra)' },
  { preset: 'catacombs', opts: {}, n: SEEDS, name: 'catacombs' },
  { preset: 'complex', opts: { floors: 1 }, n: Math.ceil(SEEDS / 4), name: 'complex (jedno patro)' },
  { preset: 'complex', opts: { puzzle: true }, n: Math.ceil(SEEDS / 4), name: 'complex s hádankou' },
  { preset: 'complex', opts: {}, n: Math.ceil(SEEDS / 4), name: 'complex jen se sadou kit_base', cat: baseCatalog },
  { preset: 'house', opts: {}, n: Math.ceil(SEEDS / 4), name: 'dům (4 podlaží: laboratoře, byty)', cells: [40, 120], house: true },
];
// místnosti ze sad kit_lab a kit_it (obor laboratoře, serverovna, open space) podle jména buňky
const KINDS = { lab: /^c_(chem|bio|mol|anal|viv)_/, server: /^c_(server|hpc)_/, office: /^c_(open|meet)_/ };
let slowest = 0;
const catalogAll = catalog;
const portalDoorPrefabs = new Set();
const usedAll = new Set();
for (const run of RUNS) {
  const catalog = run.cat || catalogAll;
  const attachIds = new Set(catalog.ids.flatMap((id) => catalog.attachments(id).map((a) => a.prefab)));
  const agg = { cells: [], doors: [], ms: [], attempt: [], entities: [], brushes: [], passable: [], ceil: [], corr: [], tris: [], drawers: [], vis: [], pvs: [], depth: [], cut: [] };
  let walker = null;
  const ruleBreaks = [];
  const findings = {};
  const problems = [];
  const fails = [];
  let withStairs = 0;
  let puzzles = 0;
  let prefabsUsed = new Set();
  const aptStats = { levels: 0, flats: [], bad: [], stairDoors: 0, floors: [] };
  const kinds = { lab: [], server: [], office: [] };
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
    agg.doors.push(level.portals.filter((p) => portalDoors(level, catalog, p).length > 0).length);
    for (const p of level.portals) if (p.door) portalDoorPrefabs.add(level.entities.find((e) => e.id === p.door).prefab);
    agg.attempt.push(info.attempt);
    agg.cut.push(info.pvsRemoved || 0);
    agg.entities.push(level.entities.length);
    agg.drawers.push(level.entities.filter((e) => attachIds.has(e.prefab)).length);
    agg.brushes.push(level.brushes.length);
    // trojúhelníky jako je kreslí běh: kvádr = síť světla (mřížka dat LIGHT_CELL), prefab = pole tris
    const brushTris = levelLightMeshes(level.brushes, MATS, LIGHT_CELL).map((m) => (m ? m.indices.length / 3 : 0));
    const trisOf = (id) => (catalog.has(id) ? catalog.get(id).tris : 0);
    agg.tris.push(brushTris.reduce((a, b) => a + b, 0) + level.entities.reduce((t, e) => t + trisOf(e.prefab), 0));
    const pvsAll = levelPVS(level);
    const vis = visibleTris(level, trisOf, pvsAll, brushTris);
    agg.depth.push(pvsAll.depth);
    agg.vis.push(vis.max);
    agg.pvs.push(Math.max(...[...vis.pvs.values()].map((x) => x.size)));
    for (const k of Object.keys(kinds)) kinds[k].push(level.cells.filter((c) => KINDS[k].test(c.id)).length);
    if (run.house) apartmentsOf(level, aptStats);
    const res = validatePack(asPack(level, catalog));
    for (const x of [...res.errors, ...res.warnings]) findings[x.code] = (findings[x.code] || 0) + 1;
    const insp = inspectLevel(level, catalog);
    walker = insp.player;
    agg.passable.push(insp.passableCells);
    agg.ceil.push(insp.rules.minCeil);
    if (Number.isFinite(insp.rules.minCorr)) agg.corr.push(insp.rules.minCorr);
    for (const p of insp.rules.problems.slice(0, 2)) ruleBreaks.push(`seed ${seed}: ${p}`);
    for (const p of insp.problems.slice(0, 2)) problems.push(`seed ${seed}: ${p}`);
    if (insp.stairs + insp.ramps > 0) withStairs++;
    if (level.entities.some((e) => e.props && e.props.locked)) puzzles++;
    for (const e of level.entities) (prefabsUsed.add(e.prefab), usedAll.add(e.prefab));
  }
  slowest = Math.max(slowest, ...agg.ms);
  const n = agg.cells.length;
  ok(fails.length === 0 && n === run.n, `${run.name}: ${run.n} seedů, každý dal level`, fails.slice(0, 2).join(' | ') || `pokusů na level ${span(agg.attempt.map((a) => a + 1))}`);
  ok(Object.keys(findings).length === 0, `${run.name}: validátor bez chyb a bez varování`, JSON.stringify(findings) === '{}' ? `${n} levelů` : JSON.stringify(findings));
  const [cLo, cHi] = run.cells || [20, 60];
  ok(Math.min(...agg.cells) >= cLo && Math.max(...agg.cells) <= cHi, `${run.name}: ${cLo} až ${cHi} buněk`, span(agg.cells));
  // rozpočet scény (06_ROZPOCTY, měřeno na T460): do 300 tisíc viditelných △. Ondřej 25. 11. 1:29 (2 a): měřit, co je
  // z buňky prokazatelně vidět (PVS: přímka otvory portálů, všechny dveře otevřené), ne celý level
  ok(Math.max(...agg.vis) <= 300000, `${run.name}: z žádné buňky není vidět víc než 300 tisíc △ (PVS, všechny dveře otevřené, kvádry po síti světla)`, `nejvíc ${span(agg.vis)}; buněk v PVS nejvýš ${span(agg.pvs)}; celý level ${span(agg.tris)}; generátor ubral věci z desek v ${agg.cut.filter((x) => x > 0).length} z ${agg.cut.length} levelů (nejvýš ${Math.max(0, ...agg.cut)} entit)`);
  if (run.house) {
    ok(aptStats.bad.length === 0, `${run.name}: každý byt (aspoň dvě místnosti) má do chodby právě jedny dveře a žádná místnost bytu nevede do schodiště`, aptStats.bad.slice(0, 3).join(' | ') || `bytů na level ${span(aptStats.flats)}`);
    ok(aptStats.floors.every((f) => f === 4), `${run.name}: čtyři podlaží, dvě dolní laboratoře a dvě horní byty`, span(aptStats.floors));
  }
  ok(Math.max(...agg.depth) <= 12, `${run.name}: nejdelší řetěz portálů s výhledem do 12 (MAX_DEPTH viditelnosti sešny A)`, span(agg.depth));
  ok(Math.min(...agg.doors) >= 3, `${run.name}: aspoň troje dveře v portálech`, span(agg.doors));
  ok(withStairs === n, `${run.name}: každý level má schod nebo rampu`, `${withStairs} z ${n}`);
  ok(problems.length === 0, `${run.name}: prahy, průchody, schody, rozmístění a průchodnost místností`, problems.slice(0, 3).join(' | ') || `cesta široká ${walker.width.toFixed(2)} m (profil ${walker.profile}) ověřena v ${span(agg.passable)} buňkách na level`);
  ok(ruleBreaks.length === 0, `${run.name}: strop nikde pod 2,6 m, chodba nikde užší než 1,6 m`, ruleBreaks.slice(0, 3).join(' | ') || `nejnižší strop ${Math.min(...agg.ceil).toFixed(2)} m, nejužší chodba ${Math.min(...agg.corr).toFixed(2)} m`);
  ok(Math.max(...agg.ms) < 1000, `${run.name}: generování pod 1 s`, `${span(agg.ms, 1)} ms; kvádrů ${span(agg.brushes)}, entit ${span(agg.entities)}`);
  if (run.preset === 'complex') ok(Math.min(...agg.drawers) > 0, `${run.name}: zásuvky kartoték a stolů stojí jako samostatné entity (každá se otevírá zvlášť)`, `zásuvek na level ${span(agg.drawers)}`);
  if (run.opts.puzzle) ok(puzzles >= n * 0.9, `${run.name}: zamčená místnost s pákou`, `${puzzles} z ${n}`);
  if (!run.opts.puzzle && !run.opts.floors) ok(prefabsUsed.size >= (run.preset === 'complex' ? 25 : 8), `${run.name}: generátor rozmisťuje prefaby sady`, `${prefabsUsed.size} různých prefabů z ${catalog.ids.length}`);
  if (run.preset === 'complex' && !run.cat) {
    ok(kinds.lab.every((x) => x >= 1) && kinds.server.filter((x) => x >= 1).length >= n * 0.9, `${run.name}: se sadami kit_lab a kit_it má každý level laboratoř oboru a skoro každý serverovnu`, `laboratoří ${span(kinds.lab)}, serveroven ${span(kinds.server)}, open space a zasedaček ${span(kinds.office)} na level`);
  }
  if (run.cat) ok(Object.values(kinds).every((list) => list.every((x) => x === 0)), `${run.name}: bez sad kit_lab a kit_it zůstávají místnosti a vybavení z kit_base`);
}

{
  // okno a mřížová brána čekají na návrh N-003 (portál jen pro pohled); všechno ostatní ze sady generátor umí postavit
  const unused = baseCatalog.ids.filter((id) => !usedAll.has(id));
  ok(unused.every((id) => ['window_sash_01', 'gate_iron_01'].includes(id)), 'generátory dohromady použijí každý prefab sady kit_base kromě těch, které čekají na N-003', `nepoužité: ${unused.join(', ') || 'žádné'}`);
  const more = catalog.ids.filter((id) => !baseCatalog.has(id));
  const usedMore = more.filter((id) => usedAll.has(id));
  ok(usedMore.length >= more.length * 0.3, 'z sad kit_lab a kit_it generátor rozmisťuje aspoň třetinu prefabů', `${usedMore.length} z ${more.length}`);
}

{
  // engine zavřenými dveřmi portálu zavírá pohled (N-107): entita v portal.door musí otvor zakrýt sama, nebo mít seeThrough
  const through = (id) => doorInteraction(catalog.get(id))?.seeThrough === true;
  const bad = [...portalDoorPrefabs].filter((id) => {
    const op = catalog.opening(id);
    return !through(id) && doorLeaks([catalog.get(id)], op.w / 100, op.h / 100).leaks.length > 0;
  });
  ok(portalDoorPrefabs.size > 0 && bad.length === 0, 'dveře zapsané v portal.door zakryjí otvor samy, nebo mají seeThrough (zkouška paprsky)', bad.join(' ') || [...portalDoorPrefabs].sort().map((id) => (through(id) ? `${id} (seeThrough)` : id)).join(' '));
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
  const b = fmtJson(generateLevel(id, 12345, makeCatalog(mergeKits(kitsNow())), {}).level);
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
  for (const id of catalog.kits) cpSync(path.join(root, 'packs', id), path.join(tmp, id), { recursive: true });
  const out = path.join(tmp, 'gen_demo');
  execFileSync(process.execPath, [path.join(root, 'src/gen/cli.mjs'), 'demo', '--out', out, ...catalog.kits.flatMap((id) => ['--kit', path.join(tmp, id)])], { stdio: 'pipe' });
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
