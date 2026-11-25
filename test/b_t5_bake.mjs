// B-T5: xBake v Node. Vzorky sedí na kontrakt (pořadí levelSamples: kvádry, potom pevné díly prefabů, D-041), součet vrstev bez zastínění
// je přesně lightIrradiance ze základu, stín sloupu je měřitelný, dveře v portálech jsou brány světla (D-035),
// okraj stínu má mezistupně, soubor jde zapsat a přečíst a je opakovatelný.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import { levelLightMeshes, levelSamples, lightIrradiance, LIGHT_CELL } from '../src/xspace/index.js';
import { bakeLevel } from '../tools/bake/bake.mjs';
import { encodeBake, decodeBake, composeColors, geometryHash, lightHash, sceneHash } from '../tools/bake/format.mjs';
import { makeChecker } from './b_lib/check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ok, finish } = makeChecker('B-T5 xBake');
const load = async (dir) => {
  const { pack } = await checkPackDir(path.join(root, dir));
  return { pack, prefabs: new Map(pack.prefabs.map((p) => [p.data.id, p.data])), materials: pack.materials.materials };
};

const G = await load('packs/golden');
const level = G.pack.levels[0].data;
/** Celé světlo vrstvy na vzorku při všech dveřích otevřených: část bez brány + všechny úseky s bránou. */
const totals = (L, n) => {
  const out = Float32Array.from(L.data.subarray(0, n));
  for (const g of L.gates) for (let i = 0; i < g.idx.length; i++) out[g.idx[i]] += g.e[i];
  return out;
};

// ---- vzorky podle kontraktu: levelSamples ze základu (mřížka znění 2, D-037; pevné díly prefabů, D-041);
// kvádr bez sítě a entita bez pevných dílů mají 0 vzorků
const EMPTY = { positions: [], normals: [] };
const LS = levelSamples(level, G.prefabs, G.materials, LIGHT_CELL);
const brushMeshes = levelLightMeshes(level.brushes, G.materials, LIGHT_CELL).map((m) => m || EMPTY);
const meshes = [...LS.brushes.map((m) => m || EMPTY), ...LS.entities.map((m) => m || EMPTY)];
const total = LS.count;
const onParts = LS.entityCounts.reduce((n, [, c]) => n + c, 0);
const t0 = performance.now();
const bake = bakeLevel(level, G.prefabs, G.materials);
const ms = performance.now() - t0;
ok(bake.samples === total && bake.brushes.every((b, i) => b.id === level.brushes[i].id && b.count === brushMeshes[i].positions.length / 3), 'vzorky kvádrů = vrcholy levelLightMeshes, po kvádrech v pořadí levelu', `${total - onParts} vzorků na ${level.brushes.length} kvádrech`);
ok(onParts > 0 && bake.entities.length === (level.entities || []).length && bake.entities.every((e, i) => e.id === LS.entityCounts[i][0] && e.count === LS.entityCounts[i][1]), 'za nimi vzorky pevných dílů prefabů po entitách v pořadí levelSamples (D-041)', `${onParts} vzorků na ${bake.entities.filter((e) => e.count).length} entitách`);
{
  // poloha a normála každého vzorku je vrchol levelSamples (pořadí je kontrakt, běh ho čte stejně)
  let bad = 0;
  let s = 0;
  for (const m of meshes) for (let v = 0; v < m.positions.length / 3; v++, s++) for (let k = 0; k < 3; k++) if (bake.scene.pos[s * 3 + k] !== m.positions[v * 3 + k] || bake.scene.nrm[s * 3 + k] !== m.normals[v * 3 + k]) bad++;
  ok(bad === 0 && s === bake.samples, 'každý vzorek leží ve vrcholu levelSamples se stejnou normálou', `${s} vzorků`);
}
ok(ms < 60000, 'zapečení xLabu do 60 s', `${(ms / 1000).toFixed(2)} s v sandboxu (orientační); ${bake.stats.shadowRays} stínových a ${bake.stats.bounceRays} odrazových paprsků, ${bake.stats.blockers} stínítek`);
ok(bake.stats.skippedColliders === 0, 'stíní kolize prefabů přes partCollider ze základu; žádná se nepřeskočila', `${bake.stats.blockers - level.brushes.length} kolizí prefabů, ${level.brushes.length} kvádrů`);

// ---- bez zastínění je vrstva přesně lightIrradiance
{
  const flat = bakeLevel(level, G.prefabs, G.materials, { occlusion: false, entityLights: false });
  const lights = level.lights.filter((l) => !l.dynamic);
  let worst = 0;
  let exact = true;
  lights.forEach((l, k) => {
    const L = flat.layers[k];
    let s = 0;
    for (const m of meshes) {
      for (let v = 0; v < m.positions.length / 3; v++, s++) {
        const e = lightIrradiance(l, m.positions[v * 3], m.positions[v * 3 + 1], m.positions[v * 3 + 2], m.normals[v * 3], m.normals[v * 3 + 1], m.normals[v * 3 + 2]);
        if (L.data[s] !== Math.fround(e)) exact = false;
        if (e > 0) worst = Math.max(worst, Math.abs(L.data[s] - e) / e);
      }
    }
  });
  ok(flat.layers.length === lights.length && flat.layers.every((L, k) => L.id === `light:${lights[k].id}`), 'jedna vrstva na světlo z pole lights, ve stejném pořadí', `${lights.length} vrstev`);
  ok(exact && worst < 1e-6, 'bez zastínění je vrstva přesně lightIrradiance ze základu (na 1e-6)', `největší poměrná odchylka ${worst.toExponential(1)} (uložení jako Float32)`);
  // zastínění světlo jen ubírá (na vzorcích, které neleží v tělese), i když se sečtou všechny úseky s bránou
  let grew = 0;
  bake.layers.filter((L) => L.kind === 'light').forEach((L, k) => {
    const sum = totals(L, bake.samples);
    for (let s = 0; s < bake.samples; s++) if (bake.valid[s] && sum[s] > flat.layers[k].data[s] * (1 + 1e-6)) grew++;
  });
  ok(grew === 0, 'zastínění světlo jen ubírá, i se všemi dveřmi otevřenými', `${grew} vzorků s víc světlem než bez zastínění`);

  // ---- pevné díly prefabů (D-041): svítí na ně, vlastní kolize entity je nestíní, cizí tělesa ano
  {
    const first = bake.scene.entityOffsets[0];
    const lightLayers = bake.layers.filter((L) => L.kind === 'light');
    const sumFull = new Float32Array(bake.samples);
    for (const L of lightLayers) totals(L, bake.samples).forEach((v, s) => (sumFull[s] += v));
    const sumFlat = new Float32Array(bake.samples);
    for (const L of flat.layers) L.data.forEach((v, s) => (sumFlat[s] += v));
    const top = new Map();
    for (let s = first; s < bake.samples; s++) top.set(bake.scene.entOf[s], Math.max(top.get(bake.scene.entOf[s]) ?? -Infinity, bake.scene.pos[s * 3 + 1]));
    let cand = 0;
    let lit = 0;
    let tops = 0;
    let topsLit = 0;
    for (let s = first; s < bake.samples; s++) {
      if (!bake.valid[s] || sumFlat[s] <= 0) continue;
      cand++;
      if (sumFull[s] > 0) lit++;
      if (bake.scene.nrm[s * 3 + 1] > 0.9 && bake.scene.pos[s * 3 + 1] >= top.get(bake.scene.entOf[s]) - 1e-3) {
        tops++;
        if (sumFull[s] > 0) topsLit++;
      }
    }
    ok(tops >= 10 && topsLit === tops, 'horní plocha entity, na kterou světlo míří, světlo dostane (vlastní kolize ji nestíní)', `${topsLit} z ${tops} vzorků horních ploch`);
    ok(cand > 0 && lit / cand > 0.5 && lit < cand, 'pevné díly: většina vzorků, na které světlo míří, ho dostane, část je ve stínu jiných těles', `${lit} z ${cand} vzorků (${((lit / cand) * 100).toFixed(0)} %)`);
    // vzorky dílů nemění nic na kvádrech: stejné hodnoty ve všech vrstvách včetně odrazu a koutů
    const only = bakeLevel(level, G.prefabs, G.materials, { entitySamples: false });
    let diff = 0;
    bake.layers.forEach((L, k) => {
      for (let i = 0; i < only.samples * L.channels; i++) if (L.data[i] !== only.layers[k].data[i]) diff++;
    });
    ok(only.samples === first && diff === 0, 'vzorky kvádrů mají s díly prefabů i bez nich stejné hodnoty ve všech vrstvách', `${only.samples} vzorků kvádrů, ${bake.layers.length} vrstev`);
  }

  // ---- stín sloupu: vzorky podlahy, kam světlo haly bez sloupu svítí a přes sloup ne
  const segHitsBox = (a, b, box) => {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 3; k++) {
      const d = b[k] - a[k];
      if (Math.abs(d) < 1e-12) {
        if (a[k] < box.min[k] || a[k] > box.max[k]) return false;
        continue;
      }
      const p = (box.min[k] - a[k]) / d;
      const q = (box.max[k] - a[k]) / d;
      lo = Math.max(lo, Math.min(p, q));
      hi = Math.min(hi, Math.max(p, q));
      if (lo > hi) return false;
    }
    return true;
  };
  const pillars = level.brushes.filter((b) => b.tag === 'pillar');
  const floorOf = level.brushes.map((b) => b.tag === 'floor');
  const S = bake.scene;
  let shaded = 0;
  let lost = 0;
  const list = [];
  lights.forEach((l, k) => {
    for (let s = 0; s < bake.samples; s++) {
      const bi = S.offsets.findLastIndex((o) => o <= s);
      if (!floorOf[bi] || !bake.valid[s] || flat.layers[k].data[s] < 0.5) continue;
      const p = [S.pos[s * 3], S.pos[s * 3 + 1] + 0.02, S.pos[s * 3 + 2]];
      if (!pillars.some((b) => segHitsBox(p, l.pos, b))) continue;
      shaded++;
      lost += (flat.layers[k].data[s] - bake.layers[k].data[s]) / flat.layers[k].data[s];
      if (bake.layers[k].data[s] === 0) list.push(s);
    }
  });
  // okraj stínu svítí podílem své plošky, proto není bez světla každý vzorek za sloupem; většina ano
  ok(pillars.length > 0 && shaded >= 10 && list.length >= shaded * 0.6 && lost / shaded > 0.8, 'vzorky podlahy za sloupem jsou ve stínu (světlo, které přes sloup nevidí, na ně nesvítí)', `${shaded} dvojic vzorek × světlo za sloupem, z toho ${list.length} úplně bez přímého světla; průměrně ubylo ${((lost / Math.max(1, shaded)) * 100).toFixed(0)} % světla`);

  // ---- složený obraz: tatáž místa jsou tmavší než bez zastínění
  const byId = new Map(bake.lights.map((x) => [x.id, x]));
  const amb = level.env.ambient;
  // odraz se do srovnání nepočítá: výpočet bez zastínění ho nemá, takže by vyšel tmavší než výpočet se stíny
  const lit = composeColors(decodeBake(encodeBake(bake, level, G.prefabs, G.materials)), byId, amb, { indirect: 0 });
  const unl = composeColors(decodeBake(encodeBake(flat, level, G.prefabs, G.materials)), new Map(flat.lights.map((x) => [x.id, x])), amb);
  const all = composeColors(decodeBake(encodeBake(bake, level, G.prefabs, G.materials)), byId, amb);
  const uniq = [...new Set(list)];
  const mean = (arr) => uniq.reduce((n, s) => n + (arr[s * 3] + arr[s * 3 + 1] + arr[s * 3 + 2]) / 3, 0) / Math.max(1, uniq.length);
  ok(uniq.length > 0 && mean(lit) < mean(unl) * 0.9, 'místa ve stínu sloupu jsou měřitelně tmavší i po přičtení ostatních světel', `průměrné přímé osvětlení ${mean(lit).toFixed(2)} proti ${mean(unl).toFixed(2)} bez zastínění (${uniq.length} vzorků); s odrazem ${mean(all).toFixed(2)}`);
}

// ---- dveře v portálech jsou brány světla (D-035)
{
  const doorIds = level.portals.filter((p) => p.door).map((p) => p.door);
  const lightLayers = bake.layers.filter((L) => L.kind === 'light' || L.kind === 'entity');
  const sections = lightLayers.flatMap((L) => L.gates);
  const known = sections.every((g) => g.gate.length > 0 && g.gate.every((id) => doorIds.includes(id)));
  const sorted = sections.every((g) => g.idx.every((v, i) => i === 0 || v > g.idx[i - 1]) && g.e.every((v) => v > 0));
  ok(doorIds.length > 0 && sections.length > 0 && known && sorted, 'světlo otvorem portálu s dveřmi je v úsecích s bránou; brána jmenuje dveře z portal.door', `${doorIds.length} dveří v portálech, ${sections.length} úseků v ${lightLayers.filter((L) => L.gates.length).length} vrstvách, ${bake.stats.gated} položek`);

  // nezávislé měřítko: tentýž level bez dveří (entity dveří pryč, brány vypnuté). Otevřené dveře mají pustit to,
  // co projde otvorem bez nich; ubrat smí jen zárubeň, která v otvoru stojí dál.
  const wings = new Set(bake.wings);
  const bare = bakeLevel({ ...level, entities: level.entities.filter((e) => !wings.has(e.id)), portals: level.portals.map(({ door, ...p }) => p) }, G.prefabs, G.materials, { indirect: false });
  // a level, kde dveře stíní v klidové poloze jako každý jiný díl (stav před D-035)
  const shut = bakeLevel(level, G.prefabs, G.materials, { gates: false, indirect: false });
  let through = 0; // světlo v úsecích s bránou
  let hole = 0; // o kolik je světla víc bez dveří než se zavřenými
  let over = 0;
  let closedSum = 0;
  let shutSum = 0;
  bake.layers.forEach((L, k) => {
    if (L.kind !== 'light' && L.kind !== 'entity') return;
    const open = totals(L, bake.samples);
    const free = bare.layers[k].data;
    for (let s = 0; s < bake.samples; s++) {
      if (!bake.valid[s]) continue;
      through += open[s] - L.data[s];
      hole += Math.max(0, free[s] - L.data[s]);
      if (open[s] > free[s] + 0.02 * Math.max(free[s], 0.05)) over++;
      closedSum += L.data[s];
      shutSum += shut.layers[k].data[s];
    }
  });
  ok(wings.size >= doorIds.length && bare.layers.every((L) => L.gates.length === 0) && shut.layers.every((L) => L.gates.length === 0), 'bez dveří v portálech a s vypnutými branami žádný úsek s bránou nevznikne');
  ok(through > 0 && through <= hole * 1.001 && through >= hole * 0.6, 'otevřené dveře pustí světlo, které projde otvorem bez dveří (ubírá jen zárubeň)', `úseky s bránou nesou ${(100 * through / hole).toFixed(0)} % světla, které dveřní otvory propustí bez dveří; ${over} vzorků s víc světlem než bez dveří`);
  ok(over <= bake.samples * 0.002, 'otevřenými dveřmi nepřijde víc světla, než kolik projde otvorem bez dveří', `${over} vzorků z ${bake.samples}`);
  ok(closedSum <= shutSum * 1.001 && closedSum >= shutSum * 0.97, 'se zavřenými dveřmi je světla stejně jako dřív, když křídla stínila (škvíry kolem křídla už nesvítí)', `součet části bez brány ${closedSum.toFixed(0)} proti ${shutSum.toFixed(0)}`);

  // složení barev: zavřeno < pootevřeno < otevřeno, a právě na vzorcích z úseků s bránou
  const byId = new Map(bake.lights.map((x) => [x.id, x]));
  const dec = decodeBake(encodeBake(bake, level, G.prefabs, G.materials));
  const all = Object.fromEntries(bake.lights.map((x) => [x.id, 1]));
  const sumOf = (doors) => composeColors(dec, byId, [0, 0, 0], { ...all, indirect: 0 }, doors).reduce((a, v) => a + v, 0);
  const openAll = Object.fromEntries(doorIds.map((id) => [id, 1]));
  const half = Object.fromEntries(doorIds.map((id) => [id, 0.5]));
  const [c0, c5, c1] = [sumOf({}), sumOf(half), sumOf(openAll)];
  const one = sumOf({ [doorIds[0]]: 1 });
  ok(c0 < c5 && c5 < c1 && one > c0 && one <= c1, 'za běhu: úsek svítí úrovní světla × otevření dveří (zavřeno < napůl < otevřeno)', `součet barev ${c0.toFixed(0)} < ${c5.toFixed(0)} < ${c1.toFixed(0)}; jen první dveře ${one.toFixed(0)}`);
  const ind = bake.layers.find((L) => L.kind === 'indirect');
  ok(ind.gates.length === 0 && dec.header.doors.join() === doorIds.join() && dec.header.scene === sceneHash(level, G.prefabs), 'vrstva odrazu se bránou neřídí; hlavička jmenuje dveře a otisk scény zahrnuje dveře portálů');
}

// ---- okraj stínu po podílech
{
  const one = bakeLevel(level, G.prefabs, G.materials, { soft: 0, indirect: false });
  const fine = bakeLevel(level, G.prefabs, G.materials, { soft: 12, indirect: false });
  let errOne = 0;
  let errSoft = 0;
  let partial = 0;
  let edge = 0;
  bake.layers.forEach((L, k) => {
    if (L.kind !== 'light') return;
    const [a, b, c] = [totals(one.layers[k], bake.samples), totals(L, bake.samples), totals(fine.layers[k], bake.samples)];
    for (let s = 0; s < bake.samples; s++) {
      if (!bake.valid[s] || (a[s] === c[s] && b[s] === c[s])) continue;
      edge++;
      errOne += Math.abs(a[s] - c[s]);
      errSoft += Math.abs(b[s] - c[s]);
      if (b[s] > 0 && b[s] !== a[s]) partial++;
    }
  });
  ok(bake.stats.softened > 0 && one.stats.softened === 0 && partial > 0, 'vzorky na okraji stínu svítí podílem své plošky (mezistupně místo dvou hodnot)', `${bake.stats.softened} zjemněných dvojic vzorek × světlo, ${partial} s jinou hodnotou než z jednoho paprsku; stínových paprsků ${bake.stats.shadowRays} proti ${one.stats.shadowRays}`);
  ok(edge > 0 && errSoft < errOne * 0.5, 'okraj stínu je blíž jemnému výpočtu (12 × 12 paprsků) než jeden paprsek na vzorek', `součet odchylek na okraji ${errSoft.toFixed(1)} proti ${errOne.toFixed(1)} (${edge} dvojic)`);
}

// ---- nepřímé světlo a přístupnost
{
  const ind = bake.layers.find((L) => L.kind === 'indirect');
  const ao = bake.layers.find((L) => L.kind === 'ao');
  let direct = 0;
  let bounce = 0;
  let bad = 0;
  let aoMin = 1;
  let aoSum = 0;
  for (const L of bake.layers) if (L.kind === 'light') for (const v of L.data) direct += v;
  // odraz se počítá se zavřenými dveřmi: křídla v něm stíní, i když přímé světlo propouštějí
  for (const v of ind.data) {
    if (!(v >= 0) || !Number.isFinite(v)) bad++;
    bounce += v / 3;
  }
  for (const v of ao.data) {
    if (!(v >= 0 && v <= 1)) bad++;
    aoMin = Math.min(aoMin, v);
    aoSum += v;
  }
  ok(ind.channels === 3 && ao.channels === 1 && bad === 0 && bounce > 0 && bounce < direct, 'nepřímá vrstva je barevná, konečná, nezáporná a slabší než přímé světlo', `průměr nepřímého ${(bounce / bake.samples).toFixed(2)} proti přímému ${(direct / bake.samples).toFixed(2)}`);
  ok(aoMin < 0.6 && aoSum / bake.samples > 0.6, 'přístupnost okolního světla je v koutech nižší', `nejméně ${aoMin.toFixed(2)}, průměr ${(aoSum / bake.samples).toFixed(2)}`);
  const ents = bake.layers.filter((L) => L.kind === 'entity');
  const lamps = level.entities.filter((e) => (G.prefabs.get(e.prefab).components || {}).light);
  ok(ents.length === lamps.length && ents.length > 0, 'světla prefabů na nepohyblivém uzlu mají vlastní vrstvu', `${ents.length} svítidel`);
}

// ---- soubor: zápis, čtení, opakovatelnost, otisky
{
  const buf = encodeBake(bake, level, G.prefabs, G.materials);
  const dec = decodeBake(buf);
  const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const same = dec.layers.length === bake.layers.length && dec.layers.every((L, k) => eq(L.data, bake.layers[k].data) && L.gates.length === bake.layers[k].gates.length && L.gates.every((g, j) => g.gate.join() === bake.layers[k].gates[j].gate.join() && eq(g.idx, bake.layers[k].gates[j].idx) && eq(g.e, bake.layers[k].gates[j].e)));
  ok(dec.header.samples === bake.samples && same, 'soubor: zápis a čtení vrátí tytéž hodnoty včetně úseků s bránou', `${buf.length} B, hlavička ${buf.readUInt32LE(4)} B, ${dec.layers.filter((L) => L.encoding === 'sparse').length} řídkých vrstev z ${dec.layers.length}, ${dec.layers.reduce((n, L) => n + L.gates.length, 0)} úseků s bránou`);
  const view = decodeBake(new Uint8Array(buf).buffer);
  ok(view.layers.every((L, k) => eq(L.data, dec.layers[k].data)), 'soubor jde přečíst i z ArrayBuffer (čtení bez Node, pro prohlížeč a základ)');
  const again = encodeBake(bakeLevel(level, G.prefabs, G.materials), level, G.prefabs, G.materials);
  ok(buf.equals(again), 'stejný vstup dvakrát = stejné bajty');
  const moved = { ...level, brushes: level.brushes.map((b, i) => (i ? b : { ...b, max: [b.max[0] + 0.5, b.max[1], b.max[2]] })) };
  const l0 = level.lights[0];
  const hidden = { ...level, brushes: level.brushes.map((b, i) => (i ? b : { ...b, vis: false })) };
  const geo = (lv) => geometryHash(lv, LIGHT_CELL, G.materials, G.prefabs);
  const shifted = { ...level, entities: level.entities.map((e, i) => (i ? e : { ...e, pos: [e.pos[0] + 0.1, e.pos[1], e.pos[2]] })) };
  ok(dec.header.geometry === geo(level) && geo(moved) !== dec.header.geometry && geo(hidden) !== dec.header.geometry && geo(shifted) !== dec.header.geometry, 'otisk geometrie se změní s kvádrem, jeho viditelností i s polohou entity; hlavička nese znění mřížky', `mřížka znění ${dec.header.grid}`);
  ok(Array.isArray(dec.header.entities) && dec.header.entities.length === bake.entities.length && dec.header.entities.every(([id, n], i) => id === bake.entities[i].id && n === bake.entities[i].count) && dec.header.samples === dec.header.brushes.reduce((n, [, c]) => n + c, 0) + dec.header.entities.reduce((n, [, c]) => n + c, 0), 'hlavička nese entities [id, počet vzorků] a součet kvádrů a entit je počet vzorků (D-041)', `${dec.header.entities.length} entit`);
  ok(lightHash({ ...l0, intensity: l0.intensity + 1 }) !== lightHash(l0) && lightHash({ ...l0, color: [0, 0, 1] }) === lightHash(l0), 'otisk světla se změní se svítivostí, ne s barvou');
}

// ---- levely z generátoru: doběhne a vejde se do času
{
  const D = await load('packs/gen_demo');
  const rows = [];
  let slow = 0;
  for (const { data: lv } of D.pack.levels) {
    const a = performance.now();
    const b = bakeLevel(lv, D.prefabs, D.materials);
    const t = performance.now() - a;
    slow = Math.max(slow, t);
    rows.push(`${lv.id}: ${b.samples} vzorků, ${b.layers.length} vrstev, ${b.stats.doors} dveří a ${b.layers.reduce((n, L) => n + L.gates.length, 0)} úseků s bránou, ${(t / 1000).toFixed(1)} s, ${(encodeBake(b, lv, D.prefabs, D.materials).length / 1024).toFixed(0)} kB`);
    if (b.stats.skippedColliders) rows.push(`CHYBA: ${b.stats.skippedColliders} kolizí bez tvaru`);
  }
  ok(rows.length === D.pack.levels.length && slow < 60000, 'levely z generátoru se zapečou do 60 s', rows.join(' | '));
}

finish();
