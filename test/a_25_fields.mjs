// A2.5 v Node: nová pole základu, která běh čte. JOINT_TRAVEL_SECONDS (rychlost kloubu bez speed),
// components.screen.offset (plocha obrazovky), interact.seeThrough (dveře, kterými je vidět), portals[].passable
// (okno) a materials[].opacity (sklo). Zkušební data jsou kopie zlatého vzorku upravená v testu; balík se nemění.

import fs from 'node:fs';
import path from 'node:path';
import { h, makeGame, loadPack, fmt, ROOT } from './a_lib/node.mjs';
import { JOINT_TRAVEL_SECONDS } from '../src/xspace/index.js';
import { GROUP, LIGHT_RAY } from '../src/phys/phys.js';
import { createBench } from '../src/app/bench.js';
import { createGame } from '../src/app/game.js';
import { createNullRender } from '../src/render/null.js';

const { ok } = h;
const base = await loadPack();
/** Kopie zlatého vzorku s úpravou. */
const variant = (change) => {
  const p = structuredClone(base);
  change({
    prefab: (id) => p.prefabs.find((x) => x.data.id === id).data,
    level: p.levels[0].data,
    materials: p.materials.materials,
  });
  return p;
};
const started = async (opts) => {
  const g = await makeGame({ shadows: false, ...opts });
  g.start();
  g.sim(0.2);
  return g;
};

// ---- 1. JOINT_TRAVEL_SECONDS: kloub bez speed projede celý rozsah za dobu podle druhu interakce (kontrakt, N-103)
{
  const game = await started();
  const rows = [];
  let bad = 0;
  for (const e of game.entities.list) {
    for (const j of e.joints) {
      if (j.def.speed !== undefined) continue;
      const want = (j.def.max - j.def.min) / (JOINT_TRAVEL_SECONDS[e.kind] ?? JOINT_TRAVEL_SECONDS.other);
      if (Math.abs(j.speed - want) > 1e-12) bad++;
      rows.push(`${e.id} ${e.kind} ${fmt((j.def.max - j.def.min) / j.speed, 2)} s`);
    }
  }
  ok(rows.length > 0 && bad === 0, 'kloub bez speed v datech má rychlost z JOINT_TRAVEL_SECONDS', rows.join(', '));
  const src = fs.readFileSync(path.join(ROOT, 'src/world/joints.js'), 'utf8');
  ok(!/button:\s*0\.06/.test(src), 'vlastní tabulka dob v joints.js zmizela (jedna pravda je formats.js)');
}

// ---- 2. screen.offset: plocha obrazovky leží tam, kam ji posouvají data
{
  const desk = base.prefabs.find((p) => p.data.components?.screen).data;
  const ent = base.levels[0].data.entities.find((e) => e.prefab === desk.id).id;
  const a = await started();
  ok(a.get(`interact.term.${ent}`).front === desk.components.screen.offset, 'plocha obrazovky je posunutá o screen.offset z dat', `${desk.id}: ${desk.components.screen.offset} m`);
  const b = await started({ pack: variant((v) => (v.prefab(desk.id).components.screen.offset = 0.05)) });
  ok(b.get(`interact.term.${ent}`).front === 0.05, 'jiný offset v datech posune plochu (hodnota se čte, ne odvozuje)', `${b.get(`interact.term.${ent}`).front} m`);
  const infos = [];
  const info = console.info;
  console.info = (m) => infos.push(String(m));
  const c = await started({ pack: variant((v) => delete v.prefab(desk.id).components.screen.offset) });
  console.info = info;
  const front = c.get(`interact.term.${ent}`).front;
  const parts = Math.max(...desk.parts.filter((p) => p.node === desk.components.screen.node && p.max).map((p) => p.max[2]));
  ok(Math.abs(front - (parts + 0.001)) < 1e-12 && infos.filter((m) => m.includes('screen.offset')).length === 1, 'prefab bez offset (data před N-106): plocha 1 mm před nejpřednějším dílem a jedno ohlášení', `${fmt(front, 3)} m; ${infos.find((m) => m.includes('screen.offset')) || 'bez ohlášení'}`);
}

// ---- 3. interact.seeThrough: zavřené dveře se seeThrough nezavírají portál pro pohled
{
  const door = base.levels[0].data.portals.find((p) => p.door);
  const prefabId = base.levels[0].data.entities.find((e) => e.id === door.door).prefab;
  const look = async (g) => {
    g.vis.update();
    return g.get('vis.portals').find((p) => p.id === door.id).open;
  };
  const plain = await started();
  const grille = await started({ pack: variant((v) => (v.prefab(prefabId).components.interact.seeThrough = true)) });
  const closed = (g) => g.entities.byId(door.door).joints[0].value === g.entities.byId(door.door).joints[0].rest;
  ok(closed(plain) && closed(grille) && (await look(plain)) === false && (await look(grille)) === true, 'zavřené dveře portál pro pohled zavírají, dveře se seeThrough ne', `${door.id} s ${door.door}: bez seeThrough zavřeno, se seeThrough otevřeno`);
}

// ---- 4. portals[].passable: trasa měření (?bench) oknem nevede
{
  const lvl = base.levels[0].data;
  const win = lvl.portals.find((p) => !p.door);
  const centre = (p) => [0, 2].map((k) => (p.quad[0][k] + p.quad[1][k] + p.quad[2][k] + p.quad[3][k]) / 4);
  const through = (route, p) => route.some((w) => Math.hypot(w.x - centre(p)[0], w.z - centre(p)[1]) < 1e-6);
  // robot měření je systém jádra: musí vzniknout před startem hry
  const withBench = async (pack) => {
    const game = createGame({ pack, render: createNullRender() });
    game.light.shadows = false;
    const bench = createBench({ game, lock: { disable() {} }, root: null });
    await game.E.init();
    game.start();
    return { game, route: bench.plan() };
  };
  const { route: r1 } = await withBench(base);
  const { game: g2, route: r2 } = await withBench(variant((v) => (v.level.portals.find((p) => p.id === win.id).passable = false)));
  const cells = (r) => new Set(r.map((w) => w.cell)).size;
  g2.vis.update();
  ok(through(r1, win) && !through(r2, win), 'trasa měření nevede portálem s passable: false', `${win.id}: dřív ${r1.length} bodů trasy přes ${cells(r1)} buněk, teď ${r2.length} přes ${cells(r2)}`);
  ok(g2.get('vis.portals').find((p) => p.id === win.id).open === true, 'okno (passable: false) zůstává pro pohled otevřené');
}

// ---- 5. materials[].opacity: celý průhledný kvádr koliduje, ale světlo nestíní
{
  const pillar = base.levels[0].data.brushes.find((b) => /pillar/.test(b.id));
  const glass = await started({
    pack: variant((v) => {
      v.materials.glass_test = { model: 'lit', color: [0.6, 0.75, 0.8], opacity: 0.35 };
      const b = v.level.brushes.find((x) => x.id === pillar.id);
      b.mat = 'glass_test';
      delete b.faces;
    }),
  });
  const plain = await started();
  const groupsOf = (g) => {
    let m = null;
    g.phys.world.colliders.forEach((c) => {
      const ref = g.phys.refOf(c);
      if (ref?.kind === 'brush' && ref.id === pillar.id) m = c.collisionGroups() >>> 16;
    });
    return m;
  };
  ok(groupsOf(plain) & GROUP.SOLID && !(groupsOf(glass) & GROUP.SOLID) && groupsOf(glass) & GROUP.WORLD, 'skleněný kvádr je ve fyzice svět, ale ne stínítko světla', `${pillar.id}: členství ${groupsOf(plain)} → ${groupsOf(glass)}`);
  // paprsek světla napříč sloupem: obyčejný ho zastaví, skleněný ne
  const c = [0, 1, 2].map((k) => (pillar.min[k] + pillar.max[k]) / 2);
  const from = [pillar.min[0] - 0.5, c[1], c[2]];
  const ray = (g) => g.phys.raycast(from[0], from[1], from[2], 1, 0, 0, pillar.max[0] - pillar.min[0] + 1, LIGHT_RAY);
  ok(!!ray(plain) && !ray(glass), 'paprsek světla projde skleněným kvádrem', `obyčejný zasažen ve ${fmt(ray(plain)?.dist ?? NaN, 2)} m`);
  ok(!!glass.phys.raycast(from[0], from[1], from[2], 1, 0, 0, 2, (GROUP.QUERY << 16) | GROUP.WORLD), 'skleněným kvádrem se neprojde (pohyb a paprsek „použít“ ho vidí)');
}

process.exit(h.finish('A2.5 nová pole základu (Node)'));
