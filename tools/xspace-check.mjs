// Kontrola balíku xSpace. Použití: node tools/xspace-check.mjs <adresář balíku> [--json] [--strict]
// Návratový kód 0 = bez chyb (se --strict i bez varování), 1 = chyby.
import { checkPackDir } from './lib/read-pack.mjs';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
if (!dir) {
  console.error('Použití: node tools/xspace-check.mjs <adresář balíku> [--json] [--strict]');
  process.exit(2);
}
const { res } = await checkPackDir(dir);
if (args.includes('--json')) {
  console.log(JSON.stringify(res));
} else {
  for (const e of res.errors) console.log(`CHYBA     ${e.code.padEnd(22)} ${e.path}  ${e.msg}`);
  for (const w of res.warnings) console.log(`varování  ${w.code.padEnd(22)} ${w.path}  ${w.msg}`);
  const s = res.stats;
  console.log(`balík ${s.pack}: materiálů ${s.materials}, prefabů ${s.prefabs} (${s.prefabTris} △), souborů ${s.assets}`);
  for (const l of s.levels) console.log(`  level ${l.id}: buněk ${l.cells}, portálů ${l.portals}, kvádrů ${l.brushes} (${l.brushTris} △), entit ${l.entities}, světel ${l.lights}, spouštěčů ${l.triggers}, spojení ${l.links}`);
  console.log(`${res.errors.length} chyb, ${res.warnings.length} varování`);
}
const bad = res.errors.length > 0 || (args.includes('--strict') && res.warnings.length > 0);
process.exit(bad ? 1 : 0);
