// A1.8 v Node: zastínění světla a dveře jako brány vrstev (D-022, zadání A1.8; Ondřejova volba „zavřenými dveřmi
// světlo neprochází“). Vzorky se hledají v datech levelu (sloupy podle značky pillar, dveře podle portálů), ne z hlavy.

import { h, makeGame, loadPack, fmt } from './a_lib/node.mjs';
import { createGame } from '../src/app/game.js';
import { createNullRender } from '../src/render/null.js';
import { lightIrradiance } from '../src/xspace/index.js';
import { E_MIN } from '../src/world/lightfield.js';

const { ok } = h;
const pack = await loadPack();
const game = await makeGame({ pack });
const { light, render, entities, behave, occlusion, session } = game;
const level = session.level;
game.start();
game.sim(0.2);
light.flush();

const lit = () => render.statics.filter((b) => b.colors);
const luma = (T, v) => (T.colors[v * 3] + T.colors[v * 3 + 1] + T.colors[v * 3 + 2]) / 3;
const byId = (g, id) => g.light.lights.find((L) => L.id === id);
/** Pro světlo: dávka → pole bran vzorků (−1 = vzorek ve vrstvě není). */
function membership(g, L) {
  const map = new Map();
  for (const s of L.layer.segs) {
    const T = g.render.statics[s.t];
    if (!map.has(T)) map.set(T, new Int16Array(T.count).fill(-1));
    const m = map.get(T);
    for (const i of s.idx) m[i] = s.gate;
  }
  return map;
}
/** Nejbližší vzorek k bodu s danou normálou. */
function nearest(g, p, n) {
  let best = null;
  for (const T of g.render.statics) {
    if (!T.colors) continue;
    for (let v = 0, k = 0; v < T.count; v++, k += 3) {
      if (T.normals[k] * n[0] + T.normals[k + 1] * n[1] + T.normals[k + 2] * n[2] < 0.99) continue;
      const d = Math.hypot(T.positions[k] - p[0], T.positions[k + 1] - p[1], T.positions[k + 2] - p[2]);
      if (!best || d < best.d) best = { T, v, d, pos: [T.positions[k], T.positions[k + 1], T.positions[k + 2]] };
    }
  }
  return best;
}
const segHitsBox = (a, b, min, max) => {
  let t0 = 0;
  let t1 = 1;
  for (let k = 0; k < 3; k++) {
    const d = b[k] - a[k];
    if (Math.abs(d) < 1e-9) {
      if (a[k] < min[k] || a[k] > max[k]) return false;
      continue;
    }
    let u = (min[k] - a[k]) / d;
    let w = (max[k] - a[k]) / d;
    if (u > w) [u, w] = [w, u];
    t0 = Math.max(t0, u);
    t1 = Math.min(t1, w);
    if (t0 > t1) return false;
  }
  return true;
};

// ---- stavba vrstev se zastíněním
{
  const st = game.get('light.stat');
  const oc = occlusion.inspect([]);
  ok(st.entries > 0 && oc.blocked > 0 && st.entries < st.samples * light.lights.length, 'vrstvy se staví se zastíněním: paprsek ze vzorku ke světlu', `${st.samples} vzorků, ${st.entries} záznamů ve vrstvách ${st.lights} světel; ${oc.rays} paprsků, zastíněno ${oc.blocked}; příprava ${fmt(st.prepMs, 0)} ms + vrstvy ${fmt(st.buildMs, 0)} ms (sandbox, orientačně)`);
}

// ---- místo za sloupem je tmavší než totéž místo bez sloupu
{
  const pillars = level.brushes.filter((b) => b.tag === 'pillar');
  const hallLights = (level.lights || []).filter((l) => l.cell === 'c_hall');
  // vzorek podlahy haly, jehož úsečka ke světlu prochází sloupem (i ze všech rohů jeho plošky); sám leží aspoň 0,4 m od sloupu.
  // Ze všech takových ten, kterému zakryté světlo dává největší díl osvětlení (hala má čtyři světla).
  let pick = null;
  for (const T of lit()) {
    if (T.cell !== 'c_hall') continue;
    for (let v = 0, k = 0; v < T.count; v++, k += 3) {
      if (T.normals[k + 1] < 0.99 || Math.abs(T.positions[k + 1]) > 1e-6) continue;
      const p = [T.positions[k], T.positions[k + 1] + 0.02, T.positions[k + 2]];
      const E = hallLights.map((L) => lightIrradiance(L, p[0], 0, p[2], 0, 1, 0));
      const sum = E.reduce((a, b) => a + b, 0);
      hallLights.forEach((L, i) => {
        const col = pillars.find((b) => segHitsBox(p, L.pos, b.min, b.max));
        if (!col) return;
        // celá ploška vzorku (půl kroku mřížky na každou stranu) musí ležet ve stínu: okraj stínu svítí zčásti
        const half = 0.25;
        const deep = [[-half, -half], [half, -half], [-half, half], [half, half]].every(([dx, dz]) => segHitsBox([p[0] + dx, p[1], p[2] + dz], L.pos, col.min, col.max));
        if (!deep) return;
        const gap = Math.max(col.min[0] - p[0], p[0] - col.max[0], col.min[2] - p[2], p[2] - col.max[2]);
        if (gap < 0.4 || gap > 2) return;
        const share = E[i] / sum;
        if (!pick || share > pick.share) pick = { T, v, pos: [p[0], 0, p[2]], light: L.id, pillar: col.id, share };
      });
    }
  }
  ok(!!pick, 'v hale existuje vzorek podlahy ve stínu sloupu', pick ? `${fmt(pick.pos, 2)} za ${pick.pillar} od světla ${pick.light}, které tam bez sloupu dává ${(pick.share * 100).toFixed(0)} % světla haly` : 'nenalezen');
  if (pick) {
    const inLayer = membership(game, byId(game, pick.light)).get(pick.T)?.[pick.v] ?? -1;
    // stejný level bez sloupů
    const bare = structuredClone(pack);
    bare.levels[0].data.brushes = bare.levels[0].data.brushes.filter((b) => b.tag !== 'pillar');
    const g2 = await makeGame({ pack: bare });
    g2.start();
    g2.sim(0.2);
    g2.light.flush();
    const s2 = nearest(g2, pick.pos, [0, 1, 0]);
    const in2 = membership(g2, byId(g2, pick.light)).get(s2.T)?.[s2.v] ?? -1;
    const a = luma(pick.T, pick.v);
    const b = luma(s2.T, s2.v);
    ok(inLayer === -1 && in2 === 0 && s2.d < 1e-6 && a < b * 0.9, 'místo za sloupem je měřitelně tmavší než totéž místo bez sloupu', `barva vzorku ${fmt(a)} se sloupem × ${fmt(b)} bez něj (lineární, před expozicí); světlo ${pick.light} ve vrstvě: ${inLayer >= 0 ? 'ano' : 'ne'} × ${in2 >= 0 ? 'ano' : 'ne'}`);
  }
}

// ---- zdi: lampa ve startu svítí přímo jen ve své místnosti; dál jen skrz dveře
{
  const L = byId(game, 'e_lamp_start');
  const cell = level.cells.find((c) => c.id === 'c_start').bounds;
  const W = 0.25; // tloušťka zdi a ostění dveří
  let direct = 0;
  let outside = 0;
  let gated = 0;
  for (const s of L.layer.segs) {
    const T = render.statics[s.t];
    for (const i of s.idx) {
      if (s.gate > 0) {
        gated++;
        continue;
      }
      direct++;
      const p = [T.positions[i * 3], T.positions[i * 3 + 1], T.positions[i * 3 + 2]];
      if (p.some((x, k) => x < cell.min[k] - W || x > cell.max[k] + W)) outside++;
    }
  }
  ok(direct > 100 && outside === 0, 'světlo neprochází zdí: lampa ve startu svítí přímo jen na vzorky své místnosti', `${direct} vzorků přímo, z toho mimo místnost ${outside}`);
  ok(gated > 0, 'za dveřmi svítí lampa jen skrz bránu dveří', `${gated} vzorků za dveřmi; brány: ${occlusion.inspect(['gates']).map((g) => `${g.gate}: ${g.doors.join('+') || 'volno'}`).join(', ')}`);
}

// ---- vzorek ve stavbě přebírá viditelnost od souseda (jinak by se od rohu do místnosti táhl tmavý pruh)
{
  let hidden = 0;
  let adopted = 0;
  let missed = 0;
  for (const L of light.lights) {
    const mem = membership(game, L);
    for (const [T, m] of mem) {
      if (!T.buried) continue;
      for (let v = 0; v < T.count; v++) {
        if (!T.buried[v]) continue;
        hidden++;
        let neighbourLit = false;
        for (let i = T.adj.start[v]; i < T.adj.start[v + 1]; i++) if (m[T.adj.list[i]] >= 0 && !T.buried[T.adj.list[i]]) neighbourLit = true;
        if (!neighbourLit) continue;
        // soused svítí; vzorek sám buď svítí také, nebo na něj světlo nedosáhne (úhel, dosah)
        const k = v * 3;
        if (m[v] >= 0) adopted++;
        else if (lightIrradiance(L, T.positions[k], T.positions[k + 1], T.positions[k + 2], T.normals[k], T.normals[k + 1], T.normals[k + 2]) > E_MIN) missed++;
      }
    }
  }
  ok(adopted > 0 && missed === 0, 'vzorek ležící ve stavbě není tmavý, když jeho soused svítí', `${adopted} převzatých viditelností, ${missed} zmeškaných (z ${hidden} dvojic světlo × vzorek ve stavbě)`);
}

// ---- dveře jako brána: zavřenými světlo neprochází, při otevírání přibývá, zavřením se vrátí
{
  const portal = level.portals.find((p) => p.door === 'e_door_start');
  const c = [0, 1, 2].map((k) => (portal.quad[0][k] + portal.quad[2][k]) / 2);
  // podlaha chodby 1 m za dveřmi startu (na straně buňky b)
  const side = level.cells.find((x) => x.id === portal.b).bounds;
  const dirZ = (side.min[2] + side.max[2]) / 2 < c[2] ? -1 : 1;
  const s = nearest(game, [c[0], 0, c[2] + dirZ * 1.0], [0, 1, 0]);
  const door = entities.byId('e_door_start');
  const startLights = light.lights.filter((L) => L.cell === portal.a && L.on);
  const mem = startLights.map((L) => membership(game, L).get(s.T)?.[s.v] ?? -1);
  ok(startLights.length > 0 && mem.some((g) => g > 0) && mem.every((g) => g !== 0), 'vzorek v chodbě za dveřmi vidí světla startu jen skrz bránu dveří', `${fmt(s.pos, 2)}; brány ${mem.join(', ')}`);
  const closed = luma(s.T, s.v);
  const touches0 = render.counts.touches;
  behave.input(door, 'open');
  let half = null;
  for (let i = 0; i < 300 && half === null; i++) {
    game.E.stepOnce();
    light.flush();
    const o = occlusion.inspect(['doors']).find((d) => d.id === 'e_door_start').open;
    if (o >= 0.4 && o <= 0.6) half = { o, luma: luma(s.T, s.v) };
  }
  game.sim(1.5);
  light.flush();
  const open = luma(s.T, s.v);
  ok(open > closed * 1.05 && half && half.luma > closed && half.luma < open, 'otevírané dveře pouštějí světlo postupně', `barva vzorku: zavřeno ${fmt(closed, 4)}, při otevření ${half ? fmt(half.o, 2) : '?'} ${half ? fmt(half.luma, 4) : '?'}, otevřeno ${fmt(open, 4)}; dávek k nahrání ${render.counts.touches - touches0}`);
  behave.input(door, 'close');
  game.sim(2);
  light.flush();
  const again = luma(s.T, s.v);
  ok(Math.abs(again - closed) < 1e-5 && game.get('light.gates')[1] === 0, 'po zavření je světlo zpět na původní hodnotě', `${fmt(again, 6)} × ${fmt(closed, 6)}`);
}

// ---- pohyblivý díl: křídlo dveří se osvětluje po stěnách a přepočítává jen při pohybu nebo změně světla
{
  const before = game.get('light.stat').relit;
  for (let i = 0; i < 60; i++) {
    game.E.stepOnce();
    light.flush();
  }
  const idle = game.get('light.stat').relit - before;
  behave.input(entities.byId('e_lamp_start'), 'turnOn');
  light.flush();
  const lamp = game.get('light.stat').relit - before - idle;
  behave.input(entities.byId('e_door_start'), 'open');
  for (let i = 0; i < 30; i++) {
    game.E.stepOnce();
    light.flush();
  }
  const moving = game.get('light.stat').relit - before - idle - lamp;
  ok(idle === 0 && lamp > 0 && moving >= 30, 'pohyblivé díly se přepočítávají jen při změně: v klidu nic, po přepnutí lampy díly v dosahu, za pohybu dveří křídlo', `v klidu ${idle}, po přepnutí lampy ${lamp}, 30 kroků otevírání ${moving}`);
  behave.input(entities.byId('e_lamp_start'), 'turnOff');
  behave.input(entities.byId('e_door_start'), 'close');
  game.sim(2);
}

// ---- postupná stavba (hra v prohlížeči): po částech ve snímcích, výsledek stejný jako naráz
{
  let t = 0;
  const g2 = createGame({ pack, render: createNullRender(), now: () => (t += 3) }); // hodiny: každé čtení +3 ms
  g2.light.incremental = true;
  await g2.E.init();
  const p0 = g2.light.progress;
  let frames = 0;
  while (g2.light.progress < 1 && frames < 1000) {
    g2.light.frame();
    frames++;
  }
  const g3 = await makeGame({ pack }); // totéž naráz
  for (const g of [g2, g3]) {
    g.start();
    g.sim(0.2);
    g.light.flush();
  }
  let worst = 0;
  const A = g3.render.statics.filter((b) => b.colors);
  const B = g2.render.statics.filter((b) => b.colors);
  for (let i = 0; i < A.length; i++) for (let k = 0; k < A[i].colors.length; k++) worst = Math.max(worst, Math.abs(A[i].colors[k] - B[i].colors[k]));
  ok(p0 < 1 && frames > 1 && g2.light.progress === 1 && A.length === B.length && worst < 1e-6, 'postupná stavba vrstev: víc snímků, stejný výsledek jako naráz', `po načtení hotovo ${(p0 * 100).toFixed(0)} %, potom ${frames} snímků; největší rozdíl barvy ${worst.toExponential(1)}`);
}

process.exit(h.finish('A1.8 světlo: zastínění a brány (Node)'));
