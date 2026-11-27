// N-014 v běhu (D-057, dodatek znění 11): kreslené buňky proti prokazatelné viditelnosti. Horní mez = kreslené ⊆
// levelPVS(buňka kamery); dolní mez = mřížka 64 × 36 paprsků z oka: kvádr, který paprsek zasáhne, patří kreslené
// buňce. Pohledy: střed každé buňky (8 směrů, tři sklony) a místa 1 m před každým portálem a v jeho rovině
// (pohled skrz portál i podél zdi). xLab se zavřenými i otevřenými dveřmi a level complex_7 z gen_demo.

import path from 'node:path';
import { h, makeGame, loadPack, ROOT } from './a_lib/node.mjs';

const { ok } = h;

/** Pohledy pro level: [x, y nohou, z, yaw, pitch]. */
function poses(level) {
  const out = [];
  for (const c of level.cells) {
    const x = (c.bounds.min[0] + c.bounds.max[0]) / 2;
    const z = (c.bounds.min[2] + c.bounds.max[2]) / 2;
    for (let k = 0; k < 8; k++) for (const p of [-25, 0, 20]) out.push([x, c.bounds.min[1], z, k * 45, p]);
  }
  for (const p of level.portals || []) {
    const q = p.quad;
    const c = [0, 1, 2].map((k) => (q[0][k] + q[1][k] + q[2][k] + q[3][k]) / 4);
    const y = Math.min(...q.map((v) => v[1]));
    const u = [q[1][0] - q[0][0], q[1][2] - q[0][2]];
    const n = Math.abs(u[0]) > Math.abs(u[1]) ? [0, 1] : [1, 0]; // normála otvoru v půdorysu
    for (const s of [-1, 1]) {
      const x = c[0] + n[0] * s;
      const z = c[2] + n[1] * s;
      const toward = (Math.atan2(-(c[0] - x), -(c[2] - z)) * 180) / Math.PI;
      for (const dy of [-60, -30, 0, 30, 60]) out.push([x, y, z, toward + dy, 0]);
    }
    // v rovině portálu, pohled podél zdi na obě strany
    const along = (Math.atan2(-u[0], -u[1]) * 180) / Math.PI;
    out.push([c[0], y, c[2], along, 0], [c[0], y, c[2], along + 180, 0]);
  }
  return out;
}

async function run(name, pack, openDoors, usePvs = true) {
  const game = await makeGame({ pack });
  const { E, entities, behave, player, pvsCheck, vis } = game;
  vis.usePvs = usePvs;
  game.start();
  game.sim(0.2);
  if (openDoors) for (const ent of entities.list) if (ent.door) behave.input(ent, 'open', undefined, ent.door.id);
  game.sim(openDoors ? 2.5 : 0.1);
  game.checkPvs = true;
  pvsCheck.load(game.session.level);
  const list = poses(game.session.level);
  let tested = 0;
  let drawn = 0;
  for (const [x, y, z, yaw, pitch] of list) {
    player.teleport(x, y, z, yaw, pitch);
    E.tick(0); // snímek bez kroku: pohled hráče do vykreslení, viditelnost a zkouška
    tested++;
    drawn += vis.visibleSet.size;
  }
  const s = { ...pvsCheck.stat, drawnMean: drawn / tested, pvsCut: vis.stat.pvsCut, holesAt: pvsCheck.holes.slice(0, 3) };
  if (!usePvs) return s;
  ok(s.frames >= tested && s.upperFails === 0, `${name}: horní mez, kreslené buňky ⊆ PVS buňky kamery`, `${s.frames} pohledů, selhání ${s.upperFails}${s.first ? '; ' + s.first : ''}`);
  ok(s.brushHits > s.frames * 100 && s.lowerFails === 0, `${name}: dolní mez, každý kvádr zasažený paprskem z oka (64 × 36) patří kreslené buňce`, `${s.rays} paprsků, ${s.brushHits} zásahů kvádru, selhání ${s.lowerFails}; za zavřenými dveřmi ${s.behindClosed}, oko ve dveřích ${s.upperDoorway}×, spáry v datech ${s.holes}${s.holes ? ' ' + JSON.stringify(s.holesAt.map((x) => ({ brush: x.brush, at: x.hit.map((v) => +v.toFixed(2)) }))) : ''}${s.first ? '; ' + s.first : ''}`);
  return s;
}

const golden = await loadPack();
await run('xLab, dveře zavřené', golden, false);
await run('xLab, dveře otevřené', golden, true);
const gen = await loadPack(path.join(ROOT, 'packs/gen_demo'));
const lv = gen.levels.findIndex((l) => l.data.id === 'complex_7');
if (lv >= 0) {
  const g = structuredClone(gen);
  g.levels = [g.levels[lv], ...g.levels.filter((_, i) => i !== lv)];
  const on = await run('complex_7 (gen_demo), dveře otevřené', g, true);
  // bez omezení PVS kreslí obdélníky portálů buňky, které z buňky kamery prokazatelně vidět nejsou
  const off = await run('complex_7 bez PVS', g, true, false);
  ok(off.upperFails > 0 && on.drawnMean < off.drawnMean, 'complex_7: omezení PVS ubere buňky, které obdélníky portálů kreslily navíc', `bez PVS ${off.upperFails} pohledů nad PVS (nejvýš o ${off.worstExtra} buněk), průměrně ${off.drawnMean.toFixed(2)} buněk; s PVS ${on.drawnMean.toFixed(2)} buněk, odříznuto ${on.pvsCut}×`);
} else h.skip('complex_7', 'level complex_7 v gen_demo není');

process.exit(h.finish('N-014 viditelnost proti PVS (Node)'));
