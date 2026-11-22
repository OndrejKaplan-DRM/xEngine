// A1.7 v Node: buňky a portály. Kritéria ze zadání: ze startu se zavřenými dveřmi se kreslí 1 buňka; po otevření
// přibude chodba; počet volání kreslení v hale nezávisí na obsahu laboratoře. K tomu zkouška úplnosti paprsky:
// kam dohlédne paprsek skrz portál, ta buňka se musí kreslit (jinak by ve hře chyběl kus místnosti).

import { h, makeGame, loadPack, fmt } from './a_lib/node.mjs';
import { SIGHT_RAY } from '../src/phys/phys.js';
import { brushMesh } from '../src/xspace/index.js';
import { faceCells } from '../src/world/cells.js';

const { ok } = h;
const game = await makeGame();
const { E, entities, player, render, vis, behave, phys, session } = game;
const level = session.level;
const get = (p) => game.get(p);
const RAD = Math.PI / 180;
/** Pohled přímo (bez hráče): poloha oka, yaw a pitch ve stupních. */
const look = (x, y, z, yawDeg = 0, pitchDeg = 0) => render.setView(x, y, z, yawDeg * RAD, pitchDeg * RAD);
const cells = () => get('vis.cells');
const calls = () => render.measure().calls;
const door = (id, input, wait = 1.3) => {
  behave.input(entities.byId(id), input);
  game.sim(wait);
};
const sp = level.spawns.find((s) => s.kind === 'player');

game.start();
game.sim(0.2);
E.tick(0);

// ---- start se zavřenými dveřmi: jediná buňka
{
  const seen = cells();
  const n = calls();
  ok(seen.length === 1 && seen[0] === 'c_start' && get('vis.camera') === 'c_start', 'ze startu se zavřenými dveřmi se kreslí 1 buňka', `${seen.join(', ')}; ${n} volání z ${render.counts.batches + render.counts.movers + render.counts.screens} možných`);
  const lights = get('vis.lights');
  ok(lights.length > 0 && lights.every((id) => render.lights.find((l) => l.id === id).cell === 'c_start'), 'za zavřenými dveřmi svítí jen světla startovní místnosti', lights.join(', '));
  // první okamžik otevírání: kloub opustil klidovou polohu, portál se otevírá
  behave.input(entities.byId('e_door_start'), 'open');
  game.sim(0.05);
  E.tick(0);
  const early = cells();
  game.sim(1.3);
  E.tick(0);
  const open = cells();
  const m = calls();
  ok(early.includes('c_corr') && open.includes('c_corr') && !open.includes('c_lab'), 'po otevření dveří přibude chodba (hned, jak se křídlo pohne); laboratoř za zavřenými dveřmi ne', `po 0,05 s: ${early.join(', ')}; otevřeno: ${open.join(', ')}; volání ${n} → ${m}`);
  ok(m > n, 'víc buněk = víc volání kreslení', `${n} → ${m}`);
  look(sp.pos[0], 1.6, sp.pos[2], 180);
  const back = cells();
  const backLights = get('vis.lights');
  ok(back.length === 1 && back[0] === 'c_start', 'zády k otevřeným dveřím se zase kreslí jen start', back.join(', '));
  look(sp.pos[0], 1.6, sp.pos[2], 0);
  const front = get('vis.lights');
  const corrLights = render.lights.filter((l) => l.cell === 'c_corr').map((l) => l.id);
  ok(corrLights.every((id) => backLights.includes(id)) && corrLights.every((id) => front.includes(id)), 'světla chodby svítí otevřenými dveřmi do startu, ať se hráč dívá kamkoli (žádné probliknutí při otočení)', `zády: ${backLights.length} světel, čelem: ${front.length}`);
}

// ---- dveře laboratoře: zavřené portál zavírají, zavřením se zase zavře
{
  look(3, 1.6, -5.5, -90); // v chodbě, čelem ke dveřím laboratoře
  const closed = cells();
  const closedLights = get('vis.lights');
  door('e_door_lab', 'open');
  const open = cells();
  look(3, 1.6, -5.5, 90); // zády k laboratoři
  const away = cells();
  const awayLights = get('vis.lights');
  ok(!closed.includes('c_lab') && open.includes('c_lab') && !away.includes('c_lab'), 'laboratoř se kreslí jen otevřenými dveřmi a jen když je portál v záběru', `zavřeno: ${closed.join(', ')}; otevřeno: ${open.join(', ')}; zády: ${away.join(', ')}`);
  ok(!closedLights.includes('l_lab_1') && awayLights.includes('l_lab_1'), 'světlo laboratoře do chodby: zavřenými dveřmi ne, otevřenými ano (i zády k nim)');
  door('e_door_lab', 'close');
  look(3, 1.6, -5.5, -90);
  ok(!cells().includes('c_lab') && entities.byId('e_door_lab').joints[0].value === 0, 'po zavření dveří se portál zase uzavře', cells().join(', '));
}

// ---- hala: volání kreslení nezávisí na obsahu laboratoře
{
  const pack = structuredClone(await loadPack());
  const lvl = pack.levels[0].data;
  const gone = new Set(lvl.entities.filter((e) => e.cell === 'c_lab').map((e) => e.id));
  lvl.entities = lvl.entities.filter((e) => !gone.has(e.id));
  for (const e of lvl.entities) if (e.io) e.io = e.io.filter((k) => !gone.has(k.target));
  const empty = await makeGame({ pack });
  empty.start();
  empty.sim(0.2);
  // stejný stav dveří v obou hrách: start otevřený, laboratoř zavřená
  empty.behave.input(empty.entities.byId('e_door_start'), 'open');
  empty.sim(1.3);
  ok(entities.byId('e_door_start').joints[0].value === empty.entities.byId('e_door_start').joints[0].value && entities.byId('e_door_lab').joints[0].value === 0, 'obě hry mají dveře ve stejném stavu');
  const poses = [
    [3, 1.6, -15, 0, 0],
    [3, 1.6, -15, 90, -10],
    [-3, 1.6, -20, -60, 5],
    [8, 1.6, -25, 20, 0],
    [3, 5.2, -24, 180, -20], // z galerie zpět k chodbě: laboratoř má zavřené dveře
  ];
  const a = [];
  const b = [];
  const seen = [];
  for (const p of poses) {
    look(...p);
    a.push(calls());
    seen.push(cells());
    empty.render.setView(p[0], p[1], p[2], p[3] * RAD, p[4] * RAD);
    b.push(empty.render.measure().calls);
  }
  ok(gone.size >= 4 && a.every((n, i) => n === b[i]) && seen.every((s) => !s.includes('c_lab')), 'počet volání kreslení v hale nezávisí na obsahu laboratoře', `s laboratoří ${a.join(', ')}; s prázdnou laboratoří (bez ${gone.size} entit) ${b.join(', ')}`);
  look(3, 1.6, -15, 0);
  ok(cells().length === 1 && cells()[0] === 'c_hall', 'v hale čelem od chodby se kreslí jen hala', `${calls()} volání`);
}

// ---- sledování buňky kamery při průchodu dveřmi
{
  player.teleport(3, 0, 1.2, 0);
  game.sim(0.1);
  const track = [];
  let gaps = 0;
  for (let i = 0; i < 300; i++) {
    game.sim(1 / 60, { hold: ['fwd'] });
    E.tick(0);
    const cam = get('vis.camera');
    const here = game.world.cellAt([render.view.x, render.view.y, render.view.z]).id;
    if (!cells().includes(here)) gaps++;
    if (track.at(-1) !== cam) track.push(cam);
    if (player.pos[2] < -3) break;
  }
  ok(track.join(' → ') === 'c_start → c_corr' && gaps === 0, 'buňka kamery se při průchodu dveřmi přepne ze startu na chodbu a buňka, kde oko je, se kreslí pořád', `${track.join(' → ')}, hráč došel na z = ${fmt(player.pos[2], 2)}`);
}

// ---- úplnost: kam dohlédne paprsek skrz portál, ta buňka se kreslí
{
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const tanY = Math.tan((render.fov * RAD) / 2);
  const tanX = tanY * render.aspect;
  const run = (label) => {
    let poses = 0;
    let rays = 0;
    let through = 0;
    const missing = [];
    for (const cell of level.cells) {
      for (let k = 0; k < 60; k++) {
        const b = cell.bounds;
        const ex = b.min[0] + 0.4 + rnd() * (b.max[0] - b.min[0] - 0.8);
        const ey = b.min[1] + 0.4 + rnd() * Math.min(2.2, b.max[1] - b.min[1] - 0.8);
        const ez = b.min[2] + 0.4 + rnd() * (b.max[2] - b.min[2] - 0.8);
        const yaw = (rnd() * 360 - 180) * RAD;
        const pitch = (rnd() * 60 - 30) * RAD;
        render.setView(ex, ey, ez, yaw, pitch);
        const seen = new Set(cells());
        poses++;
        const F = [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
        const R = [Math.cos(yaw), 0, -Math.sin(yaw)];
        const U = [Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), Math.cos(yaw) * Math.sin(pitch)];
        for (const p of level.portals) {
          for (let i = 0; i < 16; i++) {
            // bod uvnitř čtyřúhelníku portálu (bilineárně, kousek od okraje)
            const u = 0.08 + 0.84 * ((i % 4) / 3);
            const v = 0.08 + 0.84 * (Math.floor(i / 4) / 3);
            const q = p.quad;
            const S = [0, 1, 2].map((d) => (q[0][d] * (1 - u) + q[1][d] * u) * (1 - v) + (q[3][d] * (1 - u) + q[2][d] * u) * v);
            const dx = S[0] - ex;
            const dy = S[1] - ey;
            const dz = S[2] - ez;
            const dist = Math.hypot(dx, dy, dz);
            const zf = dx * F[0] + dy * F[1] + dz * F[2];
            if (zf < 0.1) continue;
            const xn = (dx * R[0] + dy * R[1] + dz * R[2]) / (zf * tanX);
            const yn = (dx * U[0] + dy * U[1] + dz * U[2]) / (zf * tanY);
            if (Math.abs(xn) > 1 || Math.abs(yn) > 1) continue; // mimo záběr
            rays++;
            const hit = phys.raycast(ex, ey, ez, dx / dist, dy / dist, dz / dist, dist + 0.05, SIGHT_RAY, player.collider);
            if (hit && hit.dist < dist - 0.001) continue; // paprsek něco zastavilo (zeď, zavřené dveře)
            through++;
            for (const id of [p.a, p.b]) if (!seen.has(id)) missing.push(`${label}: z ${cell.id} [${fmt([ex, ey, ez], 2)}] není vidět ${id} skrz ${p.id}`);
          }
        }
      }
    }
    return { poses, rays, through, missing };
  };
  player.teleport(3, 0, 4.5, 0); // hráč stranou, ať paprskům nestíní
  door('e_door_start', 'close');
  door('e_door_lab', 'close', 1.5);
  const closed = run('zavřeno');
  door('e_door_start', 'open');
  door('e_door_lab', 'open');
  const open = run('otevřeno');
  ok(closed.missing.length === 0 && closed.through > 100, 'zavřené dveře: každá buňka, do které paprsek skrz portál dohlédne, se kreslí', `${closed.poses} pohledů, ${closed.rays} paprsků v záběru, ${closed.through} volných; chybí ${closed.missing.length} ${closed.missing.slice(0, 2).join(' | ')}`);
  ok(open.missing.length === 0 && open.through > closed.through, 'otevřené dveře: totéž', `${open.poses} pohledů, ${open.rays} paprsků v záběru, ${open.through} volných; chybí ${open.missing.length} ${open.missing.slice(0, 2).join(' | ')}`);
}

// ---- plochy kvádrů jsou v dávce buňky, která je vidí
{
  let faces = 0;
  let wrong = 0;
  let twoSided = 0;
  const out = [];
  for (const b of level.brushes) {
    if (b.vis === false) continue;
    const m = brushMesh(b);
    const perBrush = new Set();
    for (const g of m.groups) {
      faces++;
      const ids = faceCells(m, g, b, level.cells, out);
      for (const id of ids) perBrush.add(id);
      // střed plochy posunutý 5 cm ven: leží-li v buňce, musí ji plocha mít v seznamu
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let k = g.start; k < g.start + g.count; k++) {
        const v = m.indices[k] * 3;
        cx += m.positions[v] / g.count;
        cy += m.positions[v + 1] / g.count;
        cz += m.positions[v + 2] / g.count;
      }
      const n = m.indices[g.start] * 3;
      const p = [cx + m.normals[n] * 0.05, cy + m.normals[n + 1] * 0.05, cz + m.normals[n + 2] * 0.05];
      const inside = level.cells.find((c) => p.every((x, d) => x > c.bounds.min[d] && x < c.bounds.max[d]));
      if (inside && !ids.includes(inside.id)) wrong++;
    }
    if (perBrush.size > 1) twoSided++;
  }
  ok(wrong === 0 && twoSided > 0, 'každá plocha kvádru je v dávce buňky, do které míří (stěna mezi místnostmi je vidět z obou)', `${faces} ploch, špatně ${wrong}; kvádrů viděných z více buněk ${twoSided}`);
}

// ---- vypnutí, vývojářská vrstva, cena
{
  look(sp.pos[0], 1.6, sp.pos[2], 180);
  vis.enabled = false;
  const all = cells();
  const allLights = get('vis.lights');
  vis.enabled = true;
  ok(all.length === level.cells.length && allLights.length === render.lights.length, 'vypnutá viditelnost kreslí všechny buňky a svítí všemi světly (srovnání s xView)', `${all.length} buněk, ${allLights.length} světel`);
  const lines = vis.debugLines();
  const segments = level.cells.length * 12 + level.portals.length * 6;
  ok(lines.positions.length === segments * 6 && lines.colors.length === segments * 6, 'vývojářská vrstva: obrysy všech buněk a portálů', `${segments} úseček`);
  const t0 = performance.now();
  const N = 20000;
  for (let i = 0; i < N; i++) {
    render.setView(3, 1.6, -15 + (i % 7), ((i * 37) % 360) * RAD, 0);
    vis.update();
  }
  const us = ((performance.now() - t0) / N) * 1000;
  ok(us < 200, 'přepočet viditelnosti stojí zlomek milisekundy na snímek', `${us.toFixed(1)} µs na pohled (Node v sandboxu, orientační)`);
}

process.exit(h.finish('A1.7 buňky a portály (Node)'));
