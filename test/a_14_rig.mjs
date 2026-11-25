// N-102 v běhu (dodatek znění 7): kostra v kroku přes rigCompile / rigFollow / rigSolve. Shoda bit po bitu se
// starou cestou (rigMatrices nad jointFollow) na všech prefabech balíků v packs/ a v různých polohách kloubů;
// ve hře totéž pro pohyblivé díly po pohybu; svázaný kloub (N-002) se ve hře hýbe se sledovaným.

import fs from 'node:fs';
import path from 'node:path';
import { h, makeGame, loadPack, ROOT, fmt } from './a_lib/node.mjs';
import { rigMatrices, jointFollow, mat4Mul } from '../src/xspace/index.js';
import { createRigRun } from '../src/world/rigrun.js';

const { ok } = h;

// ---- všechny prefaby všech balíků: tytéž matice jako dnes
{
  const dirs = fs.readdirSync(path.join(ROOT, 'packs')).filter((d) => !d.startsWith('_') && fs.existsSync(path.join(ROOT, 'packs', d, 'pack.json')));
  const run = createRigRun();
  let prefabs = 0;
  let cases = 0;
  let bad = 0;
  let first = '';
  let seed = 12345;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  for (const d of dirs) {
    const pack = await loadPack(path.join(ROOT, 'packs', d));
    for (const { data: pf } of pack.prefabs) {
      if (!pf?.rig?.nodes?.length) continue;
      prefabs++;
      const joints = (pf.rig.joints || []).map((def) => ({ def, value: def.rest ?? def.min }));
      const ent = { joints, values: {} };
      run.attachRig(ent, pf);
      // klid, dolní a horní mez, náhodně uvnitř, náhodně i za mezemi (rigSolve ořízne)
      const poses = [() => null, () => (j) => j.min, () => (j) => j.max, () => (j) => j.min + rnd() * (j.max - j.min), () => (j) => j.min - 1 + rnd() * (j.max - j.min + 2)];
      for (const pose of poses) {
        const f = pose();
        const vals = {};
        for (const j of joints) {
          j.value = f ? f(j.def) : (j.def.rest ?? j.def.min);
          vals[j.def.id] = j.value;
        }
        const mats = run.solve(ent);
        const want = rigMatrices(pf, jointFollow(pf, vals));
        cases++;
        pf.rig.nodes.forEach((n, i) => {
          for (let k = 0; k < 16; k++) {
            if (Object.is(mats[16 * i + k], want[n.id][k])) continue;
            bad++;
            first ||= `${d}/${pf.id} uzel ${n.id}[${k}]: ${mats[16 * i + k]} ≠ ${want[n.id][k]}`;
            break;
          }
        });
      }
    }
  }
  ok(prefabs > 20 && bad === 0, 'rigCompile + rigFollow + rigSolve: matice bit po bitu jako rigMatrices(jointFollow) na všech prefabech', `${dirs.join(', ')}: ${prefabs} prefabů, ${cases} poloh, rozdílů ${bad}${first ? '; ' + first : ''}`);
}

// ---- ve hře: pohyblivé díly po pohybu kloubů mají světové matice jako dřív
{
  const game = await makeGame();
  const { entities, behave } = game;
  game.start();
  game.sim(0.2);
  for (const ent of entities.list) if (ent.door) behave.input(ent, 'open', undefined, ent.door.id);
  behave.input(entities.byId('e_valve'), 'setLevel', 0.37);
  game.sim(0.6); // uprostřed pohybu
  let movers = 0;
  let bad = 0;
  for (const ent of entities.list) {
    if (!ent.movers.length || !ent.joints.length) continue;
    const vals = Object.fromEntries(ent.joints.map((j) => [j.def.id, j.value]));
    const M = rigMatrices(ent.prefab, jointFollow(ent.prefab, vals));
    for (const rec of ent.movers) {
      movers++;
      const w = mat4Mul(ent.em, M[rec.id]);
      if (rec.world.some((v, k) => Math.abs(v - w[k]) > 1e-12)) bad++;
    }
  }
  ok(movers > 5 && bad === 0, 've hře: světové matice pohyblivých dílů uprostřed pohybu = em × rigMatrices', `${movers} dílů, rozdílů ${bad}`);
  // krok bez alokací kostry: matice entity se počítají do stále téhož pole
  const door = entities.byId('e_door_lab');
  const mats = door.rig.mats;
  behave.input(door, 'close', undefined, door.door.id);
  game.sim(0.3);
  ok(door.rig.mats === mats && door.movers.every((r) => r.view.buffer === mats.buffer), 'matice uzlů žijí v jednom poli na entitu (pohledy pohyblivých dílů do něj)');
}

// ---- svázaný kloub (N-002): druhé křídlo sleduje první
{
  const base = await loadPack();
  const pack = structuredClone(base);
  const door = pack.prefabs.find((p) => p.data.id === 'door_hinged_01').data;
  const leaf = door.rig.nodes.find((n) => door.rig.joints.some((j) => j.node === n.id));
  const j0 = door.rig.joints[0];
  door.rig.nodes.push({ id: 'leaf2', parent: leaf.parent, pos: [0.3, 0, 0] });
  door.rig.joints.push({ id: 'hinge2', node: 'leaf2', type: 'hinge', axis: j0.axis, min: -j0.max, max: -j0.min, rest: 0, follow: { joint: j0.id, ratio: -1 } });
  door.parts.push({ node: 'leaf2', shape: 'box', min: [0, 0, -0.02], max: [0.2, 0.5, 0.02], mat: door.parts[0].mat });
  const game = await makeGame({ pack });
  const { entities, behave } = game;
  game.start();
  game.sim(0.2);
  const ent = entities.byId('e_door_start');
  behave.input(ent, 'open', undefined, ent.door.id);
  game.sim(0.4);
  const a = ent.jointById[j0.id].value;
  const b = ent.jointById.hinge2.value;
  const rec = ent.movers.find((r) => r.id === 'leaf2');
  const want = mat4Mul(ent.em, rigMatrices(ent.prefab, jointFollow(ent.prefab, { [j0.id]: a }))[rec.id]);
  ok(Math.abs(a) > 5 && b === -a && rec.world.every((v, k) => Math.abs(v - want[k]) < 1e-12), 'svázaný kloub se ve hře hýbe se sledovaným (hodnota i matice dílu)', `${j0.id} ${fmt(a, 2)}°, hinge2 ${fmt(b, 2)}°`);
}

process.exit(h.finish('N-102 kostra v kroku (Node)'));
