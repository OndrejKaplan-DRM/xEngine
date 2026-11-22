// Build: nástroje a hra → samostatné HTML soubory v dist/. Žádné CDN.
// Použití: node build.mjs [cíl…]   (bez cíle postaví všechny; --list je vypíše)
//
// Cíl se nezapisuje sem: každý má vlastní soubor target.json ve své složce
// (tools/<jméno>/target.json nebo src/app/target.json, src/app/<jméno>/target.json):
//   { "id": "xview", "entry": "main.js", "template": "index.html", "pack": "../../packs/golden" }
// entry, template a pack jsou cesty vůči složce cíle. pack je volitelný: balík se vloží do stránky jako __PACK__.
// Díky tomu dvě sešny přidávají cíle, aniž by upravovaly stejný soubor.

import { build } from 'esbuild';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPackFull } from './tools/lib/read-pack.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

async function discover() {
  const dirs = [];
  const sub = async (rel) => {
    try {
      for (const e of await readdir(path.join(root, rel), { withFileTypes: true })) if (e.isDirectory()) dirs.push(path.join(rel, e.name));
    } catch {
      /* složka zatím neexistuje */
    }
  };
  await sub('tools');
  dirs.push('src/app');
  await sub('src/app');
  const targets = new Map();
  for (const dir of dirs) {
    let raw;
    try {
      raw = await readFile(path.join(root, dir, 'target.json'), 'utf8');
    } catch {
      continue;
    }
    const t = JSON.parse(raw);
    if (!/^[a-z][a-z0-9_]*$/.test(t.id || '')) throw new Error(`${dir}/target.json: id má být malými písmeny, číslicemi a podtržítkem`);
    if (targets.has(t.id)) throw new Error(`Cíl „${t.id}“ je definovaný dvakrát: ${targets.get(t.id).dir} a ${dir}`);
    targets.set(t.id, { ...t, dir });
  }
  return targets;
}

async function buildTarget(t) {
  const bundle = await build({
    entryPoints: [path.join(root, t.dir, t.entry)],
    bundle: true,
    format: 'iife',
    minify: true,
    target: 'es2020',
    write: false,
    logLevel: 'warning',
    legalComments: 'none',
    loader: { '.glb': 'binary', '.wasm': 'binary' },
  });
  const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
  const js = safe(bundle.outputFiles[0].text);
  let data = '';
  if (t.pack) {
    const pack = await readPackFull(path.join(root, t.dir, t.pack));
    if (pack.loadErrors.length) throw new Error(`Balík ${t.pack} se nenačetl: ${pack.loadErrors.map((e) => e.file).join(', ')}`);
    data = safe(`globalThis.__PACK__=${JSON.stringify(pack)};`);
  }
  const template = await readFile(path.join(root, t.dir, t.template), 'utf8');
  // nahrazení funkcí: řetězec by interpretoval znaky $& v kódu
  const html = template.replace('/*__DATA__*/', () => data).replace('/*__JS__*/', () => js);
  await mkdir(path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'dist', `${t.id}.html`), html);
  console.log(`dist/${t.id}.html  ${(html.length / 1024).toFixed(1)} kB  (js ${(js.length / 1024).toFixed(1)} kB${data ? `, data ${(data.length / 1024).toFixed(1)} kB` : ''})`);
}

const targets = await discover();
const args = process.argv.slice(2);
if (args.includes('--list')) {
  for (const t of targets.values()) console.log(`${t.id}  ${t.dir}`);
} else {
  for (const id of args.length ? args : [...targets.keys()]) {
    if (!targets.has(id)) throw new Error(`Neznámý cíl „${id}“. Známé: ${[...targets.keys()].join(', ')}`);
    await buildTarget(targets.get(id));
  }
}
