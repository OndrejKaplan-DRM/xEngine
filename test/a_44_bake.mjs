// D-041 a D-044 v Node: běh čte zapečené světlo `levels/<id>.light.bin` a jeho vzorky (pořadí levelSamples: kvádry,
// potom pevné díly prefabů) přiřadí vrcholům statických dávek. Zkouška: soubor vyrobený z vrstev, které běh spočítal
// sám (a_lib/bake.mjs), musí dát tytéž barvy jako výpočet při načtení, i po přepnutí lampy a otevření dveří (brány).
// Navíc vrstvy ao a indirect (okolní člen × přístupnost + odraz × váha / π), soubor jen s kvádry (před D-041)
// a soubor, který na level nesedí (jiná mřížka). Paprsky xBake se tu nezkoušejí; to je věc sešny B.

import { h, makeGame, loadPack, fmt } from './a_lib/node.mjs';
import { runtimeLayers, encodeBake } from './a_lib/bake.mjs';
import { decodeBake, levelSamples } from '../src/xspace/index.js';
import { INV_PI } from '../src/world/lightfield.js';

const ok = (name, cond, detail = '') => h.ok(!!cond, name, detail);
const base = await loadPack();
const LEVEL = base.levels[0].data.id;
const started = async (pack, setup) => {
  const g = await makeGame({ pack });
  setup?.(g);
  g.start();
  g.light.finish();
  return g;
};
const colorsOf = (g) => g.render.statics.map((T) => (T.colors ? Float32Array.from(T.colors) : null));
const withFile = (bytes) => {
  const p = structuredClone(base);
  p.files = { [`${p.manifest.id}/levels/${LEVEL}.light.bin`]: bytes };
  return p;
};
/**
 * Největší rozdíl barev poměřený velikostí (|rozdíl| / (1 + |očekávaná|)): u vrcholů těsně u lampy jsou složky
 * v tisících a součet v jednoduché přesnosti v jiném pořadí se liší v posledních bitech (2 630,548 proti 2 630,546).
 * expect(T, t, v, c, ref) = očekávaná složka, nebo null = barva výchozího běhu.
 */
function maxDiff(g, ref, expect) {
  let worst = 0;
  let at = '';
  g.render.statics.forEach((T, t) => {
    if (!T.colors) return;
    for (let v = 0; v < T.count; v++) {
      for (let c = 0; c < 3; c++) {
        const want = expect ? expect(T, t, v, c, ref[t][v * 3 + c]) : ref[t][v * 3 + c];
        const d = Math.abs(T.colors[v * 3 + c] - want) / (1 + Math.abs(want));
        if (d > worst) [worst, at] = [d, `${T.cell}|${T.mat} vrchol ${v}`];
      }
    }
  });
  return [worst, at];
}
const act = (g) => {
  g.behave.input(g.entities.byId('e_lamp_hall_a'), 'turnOn');
  g.behave.input(g.entities.byId('e_door_start'), 'open');
  g.sim(1.5);
  g.light.flush();
};

// ---- 0. pořadí vzorků je levelSamples ze základu
const ref = await started(structuredClone(base));
{
  const ls = levelSamples(ref.session.level, new Map(base.prefabs.map((p) => [p.data.id, p.data])), base.materials.materials);
  const mine = ref.entities.samples;
  ok('počet a rozdělení vzorků = levelSamples (D-041)', ls.count === mine.total && ls.brushCounts.every((b, i) => b[1] === ref.world.stat.brushCounts[i][1]) && ls.entityCounts.every((e, i) => e[1] === mine.counts[i][1]), `levelSamples ${ls.count}, běh ${mine.total} (kvádry ${ref.world.stat.brushSamples})`);
  // každý zmapovaný vrchol dávky leží tam, kde jeho vzorek
  let bad = 0;
  let mapped = 0;
  const pos = (s) => {
    let k = s;
    for (let i = 0; i < ls.brushes.length; i++) {
      const n = ls.brushes[i] ? ls.brushes[i].positions.length / 3 : 0;
      if (k < n) return ls.brushes[i].positions.slice(k * 3, k * 3 + 3);
      k -= n;
    }
    for (const m of ls.entities) {
      const n = m ? m.positions.length / 3 : 0;
      if (k < n) return m.positions.slice(k * 3, k * 3 + 3);
      k -= n;
    }
    return null;
  };
  for (const T of ref.render.statics) {
    const m = T.sampleMap;
    if (!m) continue;
    for (let i = 0; i < m.length; i += 2) {
      const p = pos(m[i]);
      const v = m[i + 1];
      mapped++;
      if (!p || Math.hypot(p[0] - T.positions[v * 3], p[1] - T.positions[v * 3 + 1], p[2] - T.positions[v * 3 + 2]) > 1e-4) bad++;
    }
  }
  ok('každý vrchol statické dávky se vzorkem leží v místě vzorku levelSamples', mapped > 0 && bad === 0, `${mapped} vrcholů, ${bad} mimo`);
}

// ---- 1. soubor z vrstev běhu + ao a indirect: barvy jako při výpočtu, posunuté o základ ze souboru
const refColors = colorsOf(ref);
const layers = runtimeLayers(ref);
const AO = 0.5;
const IND = [0.2, 0.1, 0.05];
const W = 0.5;
const bytes = encodeBake(ref, layers, { ao: AO, indirect: IND, weight: W });
const amb = ref.session.level.env?.ambient || [0, 0, 0];
const shift = (T, t, v, c, r) => (T.baked && T.baked[v] ? r - amb[c] + amb[c] * AO + IND[c] * W * INV_PI : r);
{
  const dec = decodeBake(bytes);
  ok('zkušební soubor má značku XLV1 a vrstvu na každé světlo', dec.header.samples === ref.entities.samples.total && dec.layers.length === ref.light.lights.length + 2, `${dec.header.samples} vzorků, ${dec.layers.length} vrstev, ${(bytes.length / 1024).toFixed(0)} kB`);
  const g = await started(withFile(bytes));
  const st = g.light.stat;
  ok('běh soubor přečetl: všechna světla ze souboru', st.baked === g.light.lights.length && /light\.bin$/.test(st.bakeNote), `${st.baked} z ${g.light.lights.length}, ${st.bakeNote}`);
  const [d, at] = maxDiff(g, refColors, shift);
  ok('barvy ze souboru = výpočet při načtení (+ okolní člen × ao + odraz × váha / π)', d < 1e-5, `největší poměrný rozdíl ${d.toExponential(2)} (${at})`);
  ok('stavba vrstev se souborem je rychlejší (sandbox, ne T460)', st.buildMs < ref.light.stat.buildMs, `${fmt(st.buildMs, 1)} ms proti ${fmt(ref.light.stat.buildMs, 1)} ms při výpočtu`);
  act(ref);
  act(g);
  const after = colorsOf(ref);
  const [d2, at2] = maxDiff(g, after, shift);
  ok('po rozsvícení lampy a otevření dveří (brána) se barvy shodují dál', d2 < 1e-5, `největší poměrný rozdíl ${d2.toExponential(2)} (${at2}); brány ${g.occlusion.inspect(['gates']).length - 1}`);
  const changed = after.some((a, t) => a && a.some((x, i) => Math.abs(x - refColors[t][i]) > 1e-3));
  ok('zkouška něco změnila (lampa a dveře opravdu svítí jinak)', changed);
}

// ---- 2. soubor bez vzorků dílů prefabů (zapečený před D-041): kvádry ze souboru, díly počítá běh
{
  const r2 = await started(structuredClone(base));
  const c2 = colorsOf(r2);
  const g = await started(withFile(encodeBake(r2, runtimeLayers(r2), { brushOnly: true })));
  const [d, at] = maxDiff(g, c2);
  ok('soubor jen s kvádry: díly prefabů svítí běh, barvy shodné', /jen kvádry/.test(g.light.stat.bakeNote) && d < 1e-5, `${g.light.stat.bakeNote}; největší poměrný rozdíl ${d.toExponential(2)} (${at})`);
}

// ---- 3. soubor, který na level nesedí, a vypnuté čtení: počítá se při načtení
{
  const g = await started(withFile(bytes), (x) => (x.world.lightCell = 0.25));
  ok('jiná mřížka světla: soubor se odmítne a světlo se spočítá', g.light.stat.baked === 0 && /nesedí/.test(g.light.stat.bakeNote), g.light.stat.bakeNote);
  const off = await started(withFile(bytes), (x) => (x.useBake = false));
  ok('useBake = false: soubor se nečte', off.light.stat.baked === 0 && /vypnuto/.test(off.light.stat.bakeNote), off.light.stat.bakeNote);
  ok('bez souboru v balíku: poznámka říká proč', ref.light.stat.baked === 0 && /ve hře není/.test(ref.light.stat.bakeNote), ref.light.stat.bakeNote);
}

process.exit(h.finish('D-041 a D-044 zapečené světlo v běhu (Node)'));
