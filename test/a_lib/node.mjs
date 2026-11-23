// Společný základ testů sešny A v Node: hra bez obrazu nad balíkem z disku. Běží za zlomek sekundy,
// takže fyzika, hráč, kostry i spojení se ověřují tady; prohlížeč zůstává jen na obraz a Shell.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readPackFull } from '../../tools/lib/read-pack.mjs';
import { createGame } from '../../src/app/game.js';
import { createNullRender } from '../../src/render/null.js';

const require = createRequire(import.meta.url);
export const h = require('../h.cjs');
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Balík k testům: výchozí zlatý vzorek, jiný přes proměnnou PACK (zkouška A × B při slučování). */
export const PACK_DIR = path.resolve(ROOT, process.env.PACK || 'packs/golden');

export async function loadPack(dir = PACK_DIR) {
  const pack = await readPackFull(dir);
  if (pack.loadErrors.length) throw new Error(`Balík ${dir} se nenačetl: ${pack.loadErrors.map((e) => e.file).join(', ')}`);
  return pack;
}

/** Kopie balíku s levely bez entit (jen kvádry, světla, spouštěče s cílem @level): testy statického světa. */
export function barePack(pack) {
  const copy = structuredClone(pack);
  for (const l of copy.levels) {
    l.data.entities = [];
    for (const portal of l.data.portals || []) delete portal.door;
    for (const t of l.data.triggers || []) t.io = t.io.filter((k) => k.target.startsWith('@'));
  }
  return copy;
}

/** Hra připravená v menu (po init). opts.shadows === false: světlo bez zastínění (prochází zdmi jako v xView). opts.soft: okraj stínu. */
export async function makeGame(opts = {}) {
  const pack = opts.pack || (await loadPack());
  const game = createGame({ pack, render: createNullRender(), ...opts });
  if (opts.shadows === false) game.light.shadows = false;
  if (opts.soft !== undefined) game.light.soft = opts.soft; // zjemnění okraje stínu: false, true nebo bodů na stranu
  await game.E.init();
  return game;
}

export const near = (a, b, eps) => Math.abs(a - b) <= eps;
export const fmt = (v, d = 3) => (Array.isArray(v) ? `[${v.map((x) => x.toFixed(d)).join(', ')}]` : Number(v).toFixed(d));
