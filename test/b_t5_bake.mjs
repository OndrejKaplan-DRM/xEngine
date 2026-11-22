// B-T5: xBake v Node. Vzorky sedí na kontrakt (pořadí a počet vrcholů brushLightMesh), součet vrstev bez zastínění
// je přesně lightIrradiance ze základu, stín sloupu je měřitelný, soubor jde zapsat a přečíst a je opakovatelný.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackDir } from '../tools/lib/read-pack.mjs';
import { brushLightMesh, lightIrradiance, LIGHT_CELL } from '../src/xspace/index.js';
import { bakeLevel } from '../tools/bake/bake.mjs';
import { encodeBake, decodeBake, composeColors, geometryHash, lightHash } from '../tools/bake/format.mjs';
import { makeChecker } from './b_lib/check.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { ok, finish } = makeChecker('B-T5 xBake');
const load = async (dir) => {
  const { pack } = await checkPackDir(path.join(root, dir));
  return { pack, prefabs: new Map(pack.prefabs.map((p) => [p.data.id, p.data])), materials: pack.materials.materials };
};

const G = await load('packs/golden');
const level = G.pack.levels[0].data;

// ---- vzorky podle kontraktu
const meshes = level.brushes.map((b) => brushLightMesh(b, LIGHT_CELL));
const total = meshes.reduce((n, m) => n + m.positions.length / 3, 0);
const t0 = performance.now();
const bake = bakeLevel(level, G.prefabs, G.materials);
const ms = performance.now() - t0;
ok(bake.samples === total && bake.brushes.every((b, i) => b.id === level.brushes[i].id && b.count === meshes[i].positions.length / 3), 'vzorky = vrcholy brushLightMesh, po kvádrech v pořadí levelu', `${total} vzorků, ${level.brushes.length} kvádrů`);
ok(ms < 60000, 'zapečení xLabu do 60 s', `${(ms / 1000).toFixed(2)} s v sandboxu (orientační); ${bake.stats.shadowRays} stínových a ${bake.stats.bounceRays} odrazových paprsků, ${bake.stats.blockers} stínítek`);

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
  // zastínění světlo jen ubírá (na vzorcích, které neleží v tělese)
  let grew = 0;
  bake.layers.filter((L) => L.kind === 'light').forEach((L, k) => {
    for (let s = 0; s < bake.samples; s++) if (bake.valid[s] && L.data[s] > flat.layers[k].data[s]) grew++;
  });
  ok(grew === 0, 'zastínění světlo jen ubírá', `${grew} vzorků s víc světlem než bez zastínění`);

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
      lost += flat.layers[k].data[s] - bake.layers[k].data[s];
      if (bake.layers[k].data[s] === 0) list.push(s);
    }
  });
  ok(pillars.length > 0 && shaded >= 10 && list.length >= shaded * 0.9, 'vzorky podlahy za sloupem jsou ve stínu (světlo, které přes sloup nevidí, na ně nesvítí)', `${shaded} dvojic vzorek × světlo za sloupem, z toho ${list.length} bez přímého světla; průměrně ubylo ${(lost / Math.max(1, shaded)).toFixed(2)} lx na dvojici`);

  // ---- složený obraz: tatáž místa jsou tmavší než bez zastínění
  const byId = new Map(bake.lights.map((x) => [x.id, x]));
  const amb = level.env.ambient;
  // odraz se do srovnání nepočítá: výpočet bez zastínění ho nemá, takže by vyšel tmavší než výpočet se stíny
  const lit = composeColors(decodeBake(encodeBake(bake, level, G.prefabs)), byId, amb, { indirect: 0 });
  const unl = composeColors(decodeBake(encodeBake(flat, level, G.prefabs)), new Map(flat.lights.map((x) => [x.id, x])), amb);
  const all = composeColors(decodeBake(encodeBake(bake, level, G.prefabs)), byId, amb);
  const uniq = [...new Set(list)];
  const mean = (arr) => uniq.reduce((n, s) => n + (arr[s * 3] + arr[s * 3 + 1] + arr[s * 3 + 2]) / 3, 0) / Math.max(1, uniq.length);
  ok(uniq.length > 0 && mean(lit) < mean(unl) * 0.9, 'místa ve stínu sloupu jsou měřitelně tmavší i po přičtení ostatních světel', `průměrné přímé osvětlení ${mean(lit).toFixed(2)} proti ${mean(unl).toFixed(2)} bez zastínění (${uniq.length} vzorků); s odrazem ${mean(all).toFixed(2)}`);
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
  const buf = encodeBake(bake, level, G.prefabs);
  const dec = decodeBake(buf);
  const same = dec.layers.length === bake.layers.length && dec.layers.every((L, k) => L.data.length === bake.layers[k].data.length && L.data.every((v, i) => v === bake.layers[k].data[i]));
  ok(dec.header.samples === bake.samples && same, 'soubor: zápis a čtení vrátí tytéž hodnoty', `${buf.length} B, hlavička ${buf.readUInt32LE(4)} B, ${dec.layers.filter((L) => L.encoding === 'sparse').length} řídkých vrstev z ${dec.layers.length}`);
  const again = encodeBake(bakeLevel(level, G.prefabs, G.materials), level, G.prefabs);
  ok(buf.equals(again), 'stejný vstup dvakrát = stejné bajty');
  const moved = { ...level, brushes: level.brushes.map((b, i) => (i ? b : { ...b, max: [b.max[0] + 0.5, b.max[1], b.max[2]] })) };
  const l0 = level.lights[0];
  ok(dec.header.geometry === geometryHash(level, LIGHT_CELL) && geometryHash(moved, LIGHT_CELL) !== dec.header.geometry, 'otisk geometrie se změní s kvádrem');
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
    rows.push(`${lv.id}: ${b.samples} vzorků, ${b.layers.length} vrstev, ${(t / 1000).toFixed(1)} s, ${(encodeBake(b, lv, D.prefabs).length / 1024).toFixed(0)} kB`);
  }
  ok(rows.length === 3 && slow < 60000, 'levely z generátoru se zapečou do 60 s', rows.join(' | '));
}

finish();
