// Vygeneruje docs/02a_XSPACE_pole.md z popisu formátů (src/xspace/formats.js).
// Dokument se nepíše ručně: tím se nemůže rozejít s validátorem. Použití: node tools/xspace-doc.mjs [--check]

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORMATS, COMPONENTS, LIMITS, LEVEL_TARGETS, XSPACE_VERSION } from '../src/xspace/formats.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/02a_XSPACE_pole.md');

function typeOf(d) {
  switch (d.t) {
    case 'const':
      return `vždy \`${JSON.stringify(d.value)}\``;
    case 'enum':
      return d.values.map((v) => `\`${v}\``).join(' · ');
    case 'arr':
      return `pole: ${typeOf(d.of)}${d.minLen ? ` (aspoň ${d.minLen})` : ''}`;
    case 'map':
      return `mapa id → ${typeOf(d.of)}`;
    case 'obj':
      return d.orList ? 'objekt nebo pole objektů' : 'objekt';
    case 'ref':
      return `odkaz (${d.to})`;
    case 'num':
    case 'int': {
      const r = d.min !== undefined || d.max !== undefined ? ` ${d.min ?? '−∞'} až ${d.max ?? '∞'}` : '';
      return (d.t === 'int' ? 'celé číslo' : 'číslo') + r;
    }
    case 'vec3':
      return '[x, y, z]';
    case 'vec2':
      return '[a, b]';
    case 'color':
      return '[r, g, b] 0–1';
    case 'id':
      return 'id';
    case 'str':
      return 'text';
    case 'bool':
      return 'ano/ne';
    default:
      return 'cokoli';
  }
}

const lines = [];
function table(d, prefix = '') {
  for (const [k, f] of Object.entries(d.fields)) {
    lines.push(`| \`${prefix}${k}\` | ${f.req ? 'ano' : ''} | ${typeOf(f)} | ${f.doc || ''} |`);
    const inner = f.t === 'obj' ? f : (f.t === 'arr' || f.t === 'map') && f.of.t === 'obj' ? f.of : null;
    if (inner && inner.fields !== COMPONENTS) table(inner, `${prefix}${k}${f.t === 'obj' ? '.' : '[].'}`);
  }
}
const HEAD = '| Pole | Povinné | Typ | Význam |\n|---|---|---|---|';

lines.push(`# xSpace ${XSPACE_VERSION}: přehled polí`);
lines.push('');
lines.push('Generováno z `src/xspace/formats.js` příkazem `npm run doc`. Neupravovat ručně. Výklad a pravidla jsou v `02_KONTRAKTY.md`.');
for (const [kind, d] of Object.entries(FORMATS)) {
  lines.push('', `## ${kind}: ${d.doc}`, '', HEAD);
  table(d);
}
lines.push('', '## Součásti prefabu (`components`)');
for (const [name, d] of Object.entries(COMPONENTS)) {
  lines.push('', `### ${name}: ${d.doc}`, '', HEAD);
  table(d);
}
lines.push('', '## Vestavěné cíle spojení', '', '| Cíl | Vstupy |', '|---|---|');
for (const [t, ins] of Object.entries(LEVEL_TARGETS)) lines.push(`| \`${t}\` | ${ins.map((v) => `\`${v}\``).join(' · ')} |`);
lines.push('', '## Meze validátoru', '', '| Mez | Hodnota |', '|---|---|');
for (const [k, v] of Object.entries(LIMITS)) lines.push(`| \`${k}\` | ${v} |`);
const text = lines.join('\n') + '\n';

if (process.argv.includes('--check')) {
  const cur = await readFile(out, 'utf8').catch(() => '');
  if (cur !== text) {
    console.error('docs/02a_XSPACE_pole.md neodpovídá formats.js. Spusť npm run doc.');
    process.exit(1);
  }
  console.log('docs/02a_XSPACE_pole.md odpovídá formats.js');
} else {
  await writeFile(out, text);
  console.log(`docs/02a_XSPACE_pole.md  ${(text.length / 1024).toFixed(1)} kB`);
}
