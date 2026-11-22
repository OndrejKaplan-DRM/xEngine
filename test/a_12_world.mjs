// A1.2 v Node: statický svět z dat. Kolidery přes brushCollider, dávky po buňce a materiálu, první dotaz vidí svět.

import { h, makeGame, fmt } from './a_lib/node.mjs';
import { SIGHT_RAY } from '../src/phys/phys.js';

const { ok } = h;
const game = await makeGame();
const { phys, world, render, session } = game;
const level = session.level;

const solid = level.brushes.filter((b) => b.col !== false).length;
const pairs = new Set();
for (const b of level.brushes) {
  if (b.vis === false) continue;
  pairs.add(`${b.cell}|${b.mat}`);
  for (const m of Object.values(b.faces || {})) pairs.add(`${b.cell}|${m}`);
}
ok(world.stat.brushColliders === solid && phys.stat.fixedColliders >= solid, 'počet koliderů = počet kvádrů s kolizí', `${world.stat.brushColliders} z ${solid}`);
ok(render.counts.batches === pairs.size, 'dávek je tolik, kolik dvojic buňka × materiál', `${render.counts.batches}`);
ok(world.stat.brushTris === render.counts.staticTris || render.counts.staticTris > world.stat.brushTris, 'trojúhelníky kvádrů jsou v dávkách všechny', `${world.stat.brushTris} △ kvádrů, ${render.counts.staticTris} △ v dávkách`);
ok(render.counts.lights >= (level.lights || []).filter((l) => l.type !== 'sun').length, 'světla levelu jsou zaregistrovaná', `${render.counts.lights}`);

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
const before = { col: phys.colliderCount(), batches: render.counts.batches, lights: render.counts.lights };
game.loadLevel(session.levelId);
const after = { col: phys.colliderCount(), batches: render.counts.batches, lights: render.counts.lights };
ok(JSON.stringify(before) === JSON.stringify(after), 'opakované načtení levelu nic nezdvojí', JSON.stringify(after));

process.exit(h.finish('A1.2 statický svět (Node)'));
