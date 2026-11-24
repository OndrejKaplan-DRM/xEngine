// A1.8 v Node: okraj stínu a mřížka světla. Zjemnění okraje (lightfield.soften) nahrazuje jeden paprsek na
// vzorek podílem plošky vzorku, která světlo vidí; mřížka vzorků se nemění. Jemnější mřížka (0,25 m) je volba.

import { h, makeGame, fmt } from './a_lib/node.mjs';
import { buildLayer, adjacency, SOFT_N } from '../src/world/lightfield.js';
import { LIGHT_CELL } from '../src/xspace/index.js';

const { ok } = h;

// ---- 1. aritmetika na umělé ploše: mřížka 0,5 m v rovině y = 0, světlo nad ní, hrana stínu v x = 1,1
{
  const n = 5;
  const positions = [];
  const normals = [];
  const indices = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    positions.push(i * 0.5, 0, j * 0.5);
    normals.push(0, 1, 0);
  }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i;
    indices.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
  }
  const T = { positions: new Float32Array(positions), normals: new Float32Array(normals), indices, colors: new Float32Array(n * n * 3), count: n * n, min: [0, 0, 0], max: [2, 0, 2] };
  T.adj = adjacency(indices, T.count);
  T.buried = new Uint8Array(T.count);
  const light = { type: 'point', pos: [1, 3, 1], intensity: 100, range: 0 };
  const edgeX = 1.1;
  const gateOf = (L, x) => (x < edgeX ? 0 : -1);
  const total = (layer) => {
    const e = new Float64Array(T.count);
    for (const s of layer.segs) for (let i = 0; i < s.idx.length; i++) e[s.idx[i]] += s.e[i];
    return e;
  };
  const hard = total(buildLayer(light, [T], gateOf));
  const softL = buildLayer(light, [T], gateOf, { reach: () => true });
  const soft = total(softL);
  const free = total(buildLayer(light, [T], null));
  const at = (i, j) => j * n + i;
  // sloupec x = 1,0: ploška 0,75 až 1,25, dílčí body 0,8125 0,9375 1,0625 1,1875 → tři ze čtyř vidí světlo
  const v = at(2, 2);
  ok(hard[v] === free[v] && Math.abs(soft[v] / free[v] - 0.75) < 1e-6, 'vzorek na hraně stínu svítí podílem své plošky', `jeden paprsek ${fmt(hard[v] / free[v], 2)}, zjemněno ${fmt(soft[v] / free[v], 4)} (čekáno 0,75 při ${SOFT_N} × ${SOFT_N} bodech)`);
  const lit = at(1, 2);
  const dark = at(3, 2);
  ok(soft[lit] === free[lit] && soft[dark] === 0 && softL.softened === n, 'vzorky dál od hrany se nemění a zjemňuje se jen řada u hrany', `osvětlený ${fmt(soft[lit] / free[lit], 2)}, zastíněný ${soft[dark]}, zjemněno ${softL.softened} vzorků z ${T.count}`);
  // zeď v x = 1,05: dílčí body za ní se nepočítají, vzorek před zdí zůstane plně osvětlený (světlo ani stín přes zeď neprosákne)
  const walled = total(buildLayer(light, [T], gateOf, { reach: (x0, y0, z0, x1) => x0 < 1.05 === x1 < 1.05 }));
  ok(walled[v] === free[v] && walled[dark] === 0, 'dílčí bod za zdí se nepočítá: stín ani světlo přes zeď neprosáknou', `před zdí ${fmt(walled[v] / free[v], 2)}, za zdí ${walled[dark]}`);
  // hrana mezi volnou cestou a bránou (dveře): vzorek je v obou úsecích svým podílem
  const gated = buildLayer(light, [T], (L, x) => (x < edgeX ? 0 : 7), { reach: () => true });
  const inFree = gated.segs.find((s) => s.gate === 0);
  const inGate = gated.segs.find((s) => s.gate === 7);
  const share = (seg) => {
    const i = seg.idx.indexOf(v);
    return i < 0 ? 0 : seg.e[i] / free[v];
  };
  ok(Math.abs(share(inFree) - 0.75) < 1e-6 && Math.abs(share(inGate) - 0.25) < 1e-6, 'hrana světla z dveří: vzorek patří zčásti volné cestě a zčásti bráně', `volně ${fmt(share(inFree), 2)}, bránou ${fmt(share(inGate), 2)}`);
}

// ---- 2. xLab: zjemnění nepřidá světlo nad nezastíněnou hodnotu, pod okolní člen neklesne a celkový jas drží
const hard = await makeGame({ soft: false });
hard.start();
const soft = await makeGame({ soft: true });
soft.start();
const open = await makeGame({ shadows: false });
open.start();
{
  let changed = 0;
  let over = 0;
  let sumHard = 0;
  let sumSoft = 0;
  let count = 0;
  let minSoft = Infinity;
  for (let t = 0; t < soft.render.statics.length; t++) {
    const A = hard.render.statics[t];
    const B = soft.render.statics[t];
    const C = open.render.statics[t];
    if (!A.colors) continue;
    for (let i = 0; i < A.colors.length; i += 3) {
      count++;
      sumHard += A.colors[i];
      sumSoft += B.colors[i];
      if (Math.abs(A.colors[i] - B.colors[i]) > 1e-4) changed++;
      if (B.colors[i] > C.colors[i] + 1e-3) over++;
      if (B.colors[i] < minSoft) minSoft = B.colors[i];
    }
  }
  const st = soft.get('light.stat');
  ok(hard.get('light.stat').softened === 0 && st.softened > 500 && changed > 500, 've zlatém vzorku se zjemňují jen okraje stínů', `zjemněno ${st.softened} položek z ${st.entries}, změněných vzorků ${changed} z ${count}`);
  let minHard = Infinity;
  for (const A of hard.render.statics) if (A.colors) for (let i = 0; i < A.colors.length; i += 3) if (A.colors[i] < minHard) minHard = A.colors[i];
  ok(over === 0 && Math.abs(minSoft - minHard) < 1e-6, 'zjemnění nepřidá světlo nad nezastíněnou hodnotu a nejtmavší vzorek zůstává na okolním členu', `nad nezastíněnou ${over}, nejtmavší ${fmt(minSoft, 4)} (bez zjemnění ${fmt(minHard, 4)})`);
  const drift = Math.abs(sumSoft / sumHard - 1);
  ok(drift < 0.02, 'celkové světlo scény se zjemněním drží (do 2 %)', `poměr ${fmt(sumSoft / sumHard, 4)}`);
}

// ---- 3. jemnější mřížka je volba pro novou hru a jde vrátit
{
  const game = soft;
  const s0 = game.get('light.stat').samples;
  const t0 = game.render.counts.staticTris;
  ok(game.world.stat.lightCell === LIGHT_CELL && game.world.lightCell === LIGHT_CELL, 'výchozí mřížka světla je kontrakt základu', `${LIGHT_CELL} m, ${s0} vzorků, ${t0} △`);
  game.world.lightCell = 0.25;
  const before = game.world.stat.lightCell;
  game.start();
  const s1 = game.get('light.stat').samples;
  const t1 = game.render.counts.staticTris;
  ok(before === LIGHT_CELL && game.world.stat.lightCell === 0.25 && s1 > s0 * 2.5 && t1 > t0 * 2.5, 'mřížka 0,25 m se projeví až novou hrou a dá víc vzorků', `${s0} → ${s1} vzorků, ${t0} → ${t1} △, okraj stínu ${game.get('light.stat').softened}`);
  game.sim(0.5, { hold: ['fwd'] });
  ok(game.get('kernel.mode') === 'playing' && game.get('player.pos').every(Number.isFinite), 'hra s jemnější mřížkou běží', `hráč ${fmt(game.get('player.pos'), 2)}`);
  game.world.lightCell = LIGHT_CELL;
  game.start();
  ok(game.get('light.stat').samples === s0 && game.render.counts.staticTris === t0, 'návrat na výchozí mřížku dá stejný počet vzorků jako na začátku', `${game.get('light.stat').samples} vzorků`);
}

process.exit(h.finish('A1.8 okraj stínu a mřížka světla (Node)'));
