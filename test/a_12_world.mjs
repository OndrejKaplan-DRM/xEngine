// A1.2 v Node: statický svět z dat. Kolidery přes brushCollider, dávky po buňce a materiálu, první dotaz vidí svět,
// světlo po vrcholech a po vrstvách (D-022).

import { h, makeGame, loadPack, barePack, fmt } from './a_lib/node.mjs';
import { SIGHT_RAY } from '../src/phys/phys.js';
import { lightIrradiance } from '../src/xspace/index.js';
import { E_MIN } from '../src/world/lightfield.js';

const { ok } = h;
// level bez entit: tenhle test měří jen stavbu z kvádrů (entity mají vlastní sadu a_14)
// bez zastínění: tady se ověřuje síť vzorků a vzorec; zastínění a brány dveří má sada a_18_light
const game = await makeGame({ pack: barePack(await loadPack()), shadows: false });
const { phys, world, render, session } = game;
const level = session.level;

const solid = level.brushes.filter((b) => b.col !== false).length;
// plocha kvádru jde do dávky buňky, která ji vidí (stěna mezi místnostmi má dvě strany), takže horní mez počtu
// dávek je buňky × materiály, ne dvojice buňka × materiál z dat
const mats = new Set();
for (const b of level.brushes) {
  if (b.vis === false) continue;
  mats.add(b.mat);
  for (const m of Object.values(b.faces || {})) mats.add(m);
}
ok(world.stat.brushColliders === solid && phys.stat.fixedColliders >= solid, 'počet koliderů = počet kvádrů s kolizí', `${world.stat.brushColliders} z ${solid}`);
ok(render.counts.batches === world.stat.batchKeys && render.counts.batches <= level.cells.length * mats.size, 'statická geometrie je sloučená do dávek po buňce a materiálu', `${render.counts.batches} dávek, mez ${level.cells.length} buněk × ${mats.size} materiálů`);
ok(render.counts.staticTris === world.stat.drawnTris && world.stat.drawnTris >= world.stat.brushTris && world.stat.drawnTris <= world.stat.brushTris * 1.35, 'každá plocha kvádru je v dávce aspoň jednou; plochy viděné ze dvou buněk dvakrát', `${world.stat.brushTris} △ kvádrů, ${render.counts.staticTris} △ v dávkách (+${((world.stat.drawnTris / world.stat.brushTris - 1) * 100).toFixed(0)} %)`);
const levelLights = (level.lights || []).filter((l) => l.type !== 'sun');
ok(game.get('light.stat').lights === levelLights.length, 'světla levelu jsou zaregistrovaná', `${game.get('light.stat').lights}`);

// ---- světlo po vrcholech (D-022): vzorky jsou vrcholy statických dávek, každé světlo má vrstvu
{
  const light = game.light;
  const lit = render.statics.filter((b) => b.colors);
  const samples = lit.reduce((n, b) => n + b.count, 0);
  ok(light.stat.samples === samples && samples > 1000 && light.stat.entries > samples, 'každý vrchol osvětlené dávky je vzorek světla', `${samples} vzorků v ${lit.length} dávkách, ${light.stat.entries} záznamů ve vrstvách ${light.lights.length} světel, výpočet ${fmt(light.stat.buildMs, 1)} ms (sandbox, orientačně)`);

  // barva vzorku = (okolní E + Σ úroveň × barva světla × E) / π (vzorec lightIrradiance, bez zastínění; D-049)
  const amb = level.env.ambient.map((a) => a / Math.PI);
  let worst = 0;
  let checked = 0;
  for (const b of lit) {
    for (let v = 0; v < b.count; v += 97) {
      const want = [...amb];
      for (const L of levelLights) {
        const e = lightIrradiance(L, b.positions[v * 3], b.positions[v * 3 + 1], b.positions[v * 3 + 2], b.normals[v * 3], b.normals[v * 3 + 1], b.normals[v * 3 + 2]);
        if (e > E_MIN) for (let k = 0; k < 3; k++) want[k] += (L.color[k] * e) / Math.PI;
      }
      for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(b.colors[v * 3 + k] - want[k]) / Math.max(want[k], 1e-3));
      checked++;
    }
  }
  ok(worst < 1e-4 && checked > 100, 'barva vzorku = okolní člen + Σ barva světla × E / π', `${checked} namátkových vzorků, největší poměrná odchylka ${worst.toExponential(1)}`);

  // úroveň 0 ztmaví vzorky v dosahu světla a ostatní nezmění; návrat na 1 vrátí původní hodnoty
  const L = light.lights[0];
  const before = lit.map((b) => Float32Array.from(b.colors));
  const inLayer = lit.map((b) => new Uint8Array(b.count));
  for (const s of L.layer.segs) for (const i of s.idx) inLayer[lit.indexOf(render.statics[s.t])][i] = 1;
  const touches = render.counts.touches;
  L.level = 0;
  light.setLight(L);
  light.flush();
  let darker = 0;
  let same = 0;
  let wrong = 0;
  lit.forEach((b, bi) => {
    for (let v = 0; v < b.count; v++) {
      const d = b.colors[v * 3] - before[bi][v * 3];
      if (inLayer[bi][v]) d < 0 ? darker++ : wrong++;
      else d === 0 && b.colors[v * 3 + 1] === before[bi][v * 3 + 1] && b.colors[v * 3 + 2] === before[bi][v * 3 + 2] ? same++ : wrong++;
    }
  });
  const touched = render.counts.touches - touches;
  ok(wrong === 0 && darker === L.layer.samples && darker > 0 && same > 0, 'úroveň světla 0 ztmaví vzorky v jeho dosahu a ostatní nezmění', `světlo ${L.id}: ztmavlo ${darker} vzorků, beze změny ${same}, dávek k nahrání ${touched} z ${lit.length}`);
  L.level = 1;
  light.setLight(L);
  light.flush();
  let drift = 0;
  lit.forEach((b, bi) => {
    for (let i = 0; i < b.colors.length; i++) drift = Math.max(drift, Math.abs(b.colors[i] - before[bi][i]));
  });
  ok(drift < 1e-5, 'návrat úrovně na 1 vrátí původní barvy', `největší odchylka ${drift.toExponential(1)}`);
}

// první dotaz po stavbě vidí svět (jeden world.step() po postavení)
const sp = world.playerSpawn();
const down = phys.raycast(sp.pos[0], sp.pos[1] + 1, sp.pos[2], 0, -1, 0, 5, SIGHT_RAY);
ok(!!down && Math.abs(down.dist - 1) < 1e-3 && down.ref?.kind === 'brush', 'paprsek dolů z výchozího místa najde podlahu hned po načtení', down ? `${fmt(down.dist)} m, ${down.ref?.id}, normála [${fmt(down.nx, 1)}, ${fmt(down.ny, 1)}, ${fmt(down.nz, 1)}]` : 'nic');
const cell = world.cellAt(sp.pos);
ok(level.cells.includes(cell), 'výchozí místo leží v buňce', cell?.id);

// každá buňka má pod středem podlahu (kolize odpovídají stavbě, ne jen počtu)
let floors = 0;
for (const c of level.cells) {
  const x = (c.bounds.min[0] + c.bounds.max[0]) / 2;
  const z = (c.bounds.min[2] + c.bounds.max[2]) / 2;
  if (phys.raycast(x, c.bounds.max[1] - 0.05, z, 0, -1, 0, 100, SIGHT_RAY)) floors++;
}
ok(floors === level.cells.length, 'pod středem každé buňky je pevná plocha', `${floors} z ${level.cells.length}`);

// klíny: kolize je konvexní obal, paprsek shora dopadne na šikmou plochu ve správné výšce
const wedges = level.brushes.filter((b) => b.shape === 'wedge' && b.col !== false);
let wedgeOk = 0;
for (const b of wedges) {
  const x = (b.min[0] + b.max[0]) / 2;
  const z = (b.min[2] + b.max[2]) / 2;
  const hit = phys.raycast(x, b.max[1] + 2, z, 0, -1, 0, 10, SIGHT_RAY);
  const mid = (b.min[1] + b.max[1]) / 2; // uprostřed půdorysu je šikmá plocha v polovině výšky
  if (hit && hit.ref?.id === b.id && Math.abs(b.max[1] + 2 - hit.dist - mid) < 0.01 && hit.ny > 0.3 && hit.ny < 0.999) wedgeOk++;
}
ok(wedgeOk === wedges.length, 'klíny mají šikmou kolizi ve výšce podle dat', `${wedgeOk} z ${wedges.length}`);

// opakované načtení levelu nic nezdvojí
const before = { col: phys.colliderCount(), batches: render.counts.batches, lights: game.light.stat.lights, samples: game.light.stat.samples };
game.loadLevel(session.levelId);
const after = { col: phys.colliderCount(), batches: render.counts.batches, lights: game.light.stat.lights, samples: game.light.stat.samples };
ok(JSON.stringify(before) === JSON.stringify(after), 'opakované načtení levelu nic nezdvojí', JSON.stringify(after));

process.exit(h.finish('A1.2 statický svět (Node)'));
