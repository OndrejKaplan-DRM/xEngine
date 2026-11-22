// xGen z příkazové řádky: vygeneruje levely a zapíše je jako balík xSpace.
//
//   node src/gen/cli.mjs <předvolba> --seed N [--seed M …] --out packs/<balík> [--floors 1|2] [--puzzle] [--kit packs/kit_base]
//   node src/gen/cli.mjs demo --out packs/gen_demo      ukázkový balík (tři levely pro prohlížeč a pro zkoušku A × B)
//   node src/gen/cli.mjs list                          vypíše předvolby
//
// Balík se jmenuje jako jeho adresář (tak ho hledá requires). Stejné parametry = stejné bajty.

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPack } from '../xspace/index.js';
import { generateLevel, levelPackManifest, makeCatalog, fmtJson, PRESETS } from './index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Ukázkový balík: pevná sestava, aby se dala hlídat bajt po bajtu. */
export const DEMO = [
  { preset: 'complex', seed: 7, opts: { puzzle: true } },
  { preset: 'complex', seed: 21, opts: { floors: 1 } },
  { preset: 'catacombs', seed: 3, opts: {} },
];

export async function loadKit(dir) {
  const pack = await loadPack((file) => readFile(path.join(dir, file), 'utf8'));
  if (!pack.manifest || pack.loadErrors.length) throw new Error(`Sada ${dir} se nenačetla: ${pack.loadErrors.map((e) => e.file).join(', ')}`);
  return pack;
}

/** Vygeneruje levely a zapíše balík. @returns souhrny levelů */
export async function writeLevelPack(outDir, title, jobs, kitDir) {
  const kit = await loadKit(kitDir);
  const catalog = makeCatalog(kit);
  const made = jobs.map((j) => generateLevel(j.preset, j.seed, catalog, j.opts));
  const id = path.basename(outDir);
  await rm(path.join(outDir, 'levels'), { recursive: true, force: true });
  await mkdir(path.join(outDir, 'levels'), { recursive: true });
  await writeFile(path.join(outDir, 'pack.json'), fmtJson(levelPackManifest(id, title, made.map((x) => x.level), kit.manifest.id)) + '\n');
  for (const x of made) await writeFile(path.join(outDir, 'levels', `${x.level.id}.json`), fmtJson(x.level) + '\n');
  return made;
}

async function main(argv) {
  const cmd = argv[0];
  const flag = (name) => argv.flatMap((a, i) => (a === `--${name}` ? [argv[i + 1]] : []));
  if (!cmd || cmd === 'list' || cmd === '--help') {
    console.log('Předvolby: ' + Object.values(PRESETS).map((p) => `${p.id} (${p.title})`).join(', '));
    console.log('Použití: node src/gen/cli.mjs <předvolba> --seed N --out packs/<balík> [--floors 1|2] [--puzzle] [--kit packs/kit_base]');
    return 0;
  }
  const out = flag('out')[0];
  if (!out) throw new Error('Chybí --out packs/<balík>');
  const outDir = path.resolve(out);
  const kitDir = path.resolve(flag('kit')[0] || path.join(root, 'packs/kit_base'));
  let jobs;
  let title;
  if (cmd === 'demo') {
    jobs = DEMO;
    title = 'Ukázkové levely xGen';
  } else {
    if (!PRESETS[cmd]) throw new Error(`Neznámá předvolba „${cmd}“`);
    const seeds = flag('seed').map(Number);
    if (!seeds.length || seeds.some((s) => !Number.isInteger(s))) throw new Error('Chybí --seed N (celé číslo)');
    const opts = { ...(flag('floors')[0] ? { floors: Number(flag('floors')[0]) } : {}), ...(argv.includes('--puzzle') ? { puzzle: true } : {}) };
    jobs = seeds.map((seed) => ({ preset: cmd, seed, opts }));
    title = `${PRESETS[cmd].title}: ${seeds.length === 1 ? `seed ${seeds[0]}` : `${seeds.length} levelů`}`;
  }
  const t0 = performance.now();
  const made = await writeLevelPack(outDir, title, jobs, kitDir);
  const ms = performance.now() - t0;
  for (const { level, info } of made) {
    console.log(`${level.id}: buněk ${info.cells}, pater ${info.floors}, portálů ${info.portals} (z toho ${info.doors} s dveřmi), schodů ${info.stairs}, ramp ${info.ramps}, kvádrů ${info.brushes}, entit ${info.entities}, světel ${info.lights}, pokus ${info.attempt + 1}`);
  }
  console.log(`${path.relative(root, outDir) || outDir}: ${made.length} levelů za ${ms.toFixed(0)} ms (včetně načtení sady a zápisu)`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error('CHYBA: ' + e.message);
      process.exit(1);
    },
  );
}
