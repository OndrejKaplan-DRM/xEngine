#!/usr/bin/env node
// xSearcher: hledání a příjem volných textur (jen CC0) do packs/_inbox. Do balíků nic nepřesouvá.
//
//   node tools/searcher/find.mjs "<dotaz>" [--type texture] [--source polyhaven,ambientcg] [--limit 10]
//   node tools/searcher/find.mjs --get <zdroj>:<id>[,<zdroj>:<id>…] [--res 2k] [--maps albedo,normal,arm] [--query "<dotaz>"]
//   node tools/searcher/find.mjs --inbox                      co je v příjmu a jestli soubory sedí na záznam
//   --record <složka>   uloží odpovědi rozhraní (podklad pro test)    --replay <složka>   bez sítě, z uložených odpovědí
//   --out <složka>      jiná příjmová složka než packs/_inbox
//
// Dotaz může být česky; běžná slova o materiálech se přeloží (match.mjs). Licence: jen CC0-1.0, při pochybnosti ne.
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
// Vestavěný fetch v Node čte proxy z prostředí jen s NODE_USE_ENV_PROXY=1 (Node 22.21 a novější).
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY && !argv.includes('--replay')) {
  const r = spawnSync(process.execPath, ['--no-warnings', ...process.execArgv, process.argv[1], ...argv], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(r.status ?? 1);
}

const { makeHttp, HttpError } = await import('./http.mjs');
const { SOURCES, TYPES, sourceList } = await import('./sources/index.mjs');
const { INBOX, fetchAsset, listInbox, GateError, gate } = await import('./inbox.mjs');
const { translate } = await import('./match.mjs');

function parse(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = args[i + 1];
      if (['inbox', 'help'].includes(k) || v === undefined || v.startsWith('--')) o[k] = true;
      else (o[k] = v), i++;
    } else o._.push(a);
  }
  return o;
}

const o = parse(argv);
const log = (...a) => console.log(...a);
const dec = (x) => x.toFixed(1).replace('.', ',');
const mb = (b) => `${dec(b / 1e6)} MB`;
const http = makeHttp({ record: o.record || null, replay: o.replay || null });
const out = o.out ? path.resolve(o.out) : INBOX;

async function doSearch(query) {
  const type = o.type || 'texture';
  if (!TYPES[type]) throw new Error(`druh „${type}“ neznám (texture, model, sound)`);
  if (!TYPES[type].ok) {
    log(`Druh ${type}: ${TYPES[type].why}.`);
    return 2;
  }
  const words = translate(query);
  const { use, skipped } = sourceList(o.source);
  const limit = Number(o.limit) || 10;
  log(`Hledám „${query}“${words.join(' ') !== query.toLowerCase() ? ` (${words.join(' ')})` : ''}, textury, licence jen CC0-1.0`);
  for (const s of skipped) log(`  přeskočeno: ${s}`);
  let total = 0;
  for (const src of use) {
    let hits;
    try {
      hits = await src.api.search(http, words, { type, limit });
    } catch (e) {
      log(`\n${src.title}: nedostupný (${e instanceof HttpError ? e.message : e.message}); pokračuju dalším zdrojem`);
      continue;
    }
    log(`\nZdroj: ${src.title} (${src.site}), licence ${src.license}, nalezeno ${hits.length}`);
    hits.forEach((h, i) => {
      const size = h.size ? `${dec(h.size.w)} × ${dec(h.size.h)} m` : '';
      const no = gate(h, src);
      log(`  ${String(i + 1).padStart(2)}  ${`${src.id}:${h.id}`.padEnd(38)} ${h.title.slice(0, 30).padEnd(30)} ${h.authors.join(', ').slice(0, 22).padEnd(22)} ${size}${no.length ? `  NEPROJDE: ${no.join('; ')}` : ''}`);
    });
    total += hits.length;
  }
  if (total) log(`\nStáhnout: node tools/searcher/find.mjs --get <zdroj>:<id> [--res 2k]`);
  return 0;
}

async function doGet(list) {
  const res = (o.res || '2k').toLowerCase();
  const maps = o.maps ? o.maps.split(',').map((s) => s.trim()) : null;
  let fail = 0;
  for (const ref of list.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [sid, id] = ref.includes(':') ? ref.split(':') : [null, ref];
    const src = SOURCES[sid];
    if (!src || !id) {
      log(`${ref}: zápis je <zdroj>:<id>, zdroje ${Object.keys(SOURCES).join(', ')}`);
      fail++;
      continue;
    }
    try {
      const asset = await src.api.info(http, id);
      const { dir, record } = await fetchAsset(http, src, asset, { res, maps, out, query: o.query || '' });
      const bytes = record.files.reduce((s, f) => s + f.bytes, 0);
      log(`${src.title} ${id}: ${record.files.map((f) => f.map).join(', ')} (${mb(bytes)}${record.archive ? `, archiv ${mb(record.archive.bytes)}` : ''}) → ${path.relative(process.cwd(), dir)}`);
      const missing = record.missingMaps.filter((m) => !(src.optionalMaps ?? []).includes(m));
      if (missing.length) log(`  chybí mapy: ${missing.join(', ')}`);
      log(`  licence ${record.license}, autor ${record.author}, ${record.url}`);
    } catch (e) {
      log(`${src.title} ${id}: ${e instanceof GateError ? 'NEPROŠLO bránou' : 'chyba'}: ${e.message}`);
      fail++;
    }
  }
  return fail ? 1 : 0;
}

function doInbox() {
  const list = listInbox(out);
  if (!list.length) return log(`Příjem ${path.relative(process.cwd(), out)} je prázdný.`), 0;
  let total = 0;
  for (const { record, ok, bad } of list) {
    const bytes = record.files.reduce((s, f) => s + f.bytes, 0);
    total += bytes;
    log(`${(record.sourceTitle + ' ' + record.id).padEnd(40)} ${record.license.padEnd(8)} ${record.resolution.padEnd(4)} ${mb(bytes).padStart(9)}  ${record.files.map((f) => f.map).join(',')}${ok ? '' : `  POŠKOZENO: ${bad.join(', ')}`}`);
  }
  log(`${list.length} assetů, ${mb(total)}`);
  return list.every((x) => x.ok) ? 0 : 1;
}

let code;
try {
  if (o.help || (!o._.length && !o.get && !o.inbox)) {
    log('Použití: node tools/searcher/find.mjs "<dotaz>" | --get <zdroj>:<id> | --inbox  (podrobně v hlavičce souboru)');
    code = o.help ? 0 : 2;
  } else if (o.inbox) code = doInbox();
  else if (o.get) code = await doGet(o.get);
  else code = await doSearch(o._.join(' '));
} catch (e) {
  log(`chyba: ${e.message}`);
  code = 1;
}
process.exit(code);
