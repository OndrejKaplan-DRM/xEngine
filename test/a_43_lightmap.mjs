// N-110 a D-043 v Node: zkouška textury světla na hale xLabu (bod 10 cm; 5 cm se zkouší v prohlížeči a na T460).
// Ověřuje: atlas a mapy ploch, UV 1 v mezích atlasu, hodnota textury v místě vrcholu odpovídá světlu po vrcholech
// (stejný vzorec, mimo okraje stínů), ostrý okraj stínu sloupu (sousední body 10 cm od sebe se liší víc než 2×),
// přepnutí lampy texturu složí znovu a návrat dá tytéž hodnoty.

import { h, makeGame, fmt } from './a_lib/node.mjs';

const ok = (name, cond, detail = '') => h.ok(!!cond, name, detail);
const TEXEL = 0.1;
const game = await makeGame({});
game.lightmap = { texel: TEXEL, cells: ['c_hall'] };
game.start();
for (const id of ['e_lamp_hall_a', 'e_lamp_hall_b']) game.behave.input(game.entities.byId(id), 'turnOn');
game.sim(0.2);
game.light.finish();
game.render.beforeDraw(); // složení textury po rozsvícení (ve hře před každým snímkem)
const st = game.lightmapStat;
ok('textura světla haly postavená', st && st.texel === TEXEL && st.texels > 0 && st.charts > 0, JSON.stringify(st));

// vnitřek: build vrací pole, ke kterým se test dostane přes uzávěr hry jen zprostředkovaně; postavíme znovu tutéž
const { buildLightmap } = await import('../src/world/lightmap.js');
const lm = buildLightmap({ targets: game.render.statics, cells: new Set(['c_hall']), texel: TEXEL, lights: game.light.lights, gateOf: game.occlusion.gateOf, gate: game.light.gate, ambient: game.session.level.env?.ambient || [0, 0, 0] });
ok('stejný výsledek při druhé stavbě (deterministické)', lm.W === st.w && lm.H === st.h && lm.texels === st.texels, `${lm.W} × ${lm.H}, ${lm.texels} bodů`);
const hall = game.render.statics.filter((T) => T.cell === 'c_hall' && T.colors);
ok('každá osvětlovaná dávka haly má síť s UV 1', lm.meshes.length === hall.length, `${lm.meshes.length} z ${hall.length}`);
let bad = 0;
for (const m of lm.meshes) for (const x of m.uv1) if (!(x > 0 && x < 1)) bad++;
ok('UV 1 leží uvnitř atlasu', bad === 0, `${bad} mimo`);

// hodnota textury v místě vrcholu (nejbližší bod plochy) proti barvě vrcholu × π
const { W, rgb, inside } = lm;
const ratios = [];
for (const m of lm.meshes) {
  const T = m.target;
  for (let t = 0; t < m.positions.length / 9; t++) {
    for (let k = 0; k < 3; k++) {
      const u = m.uv1[t * 6 + k * 2] * lm.W - 0.5;
      const v = m.uv1[t * 6 + k * 2 + 1] * lm.H - 0.5;
      const i = Math.round(u);
      const j = Math.round(v);
      if (Math.abs(u - i) > 1e-3 || Math.abs(v - j) > 1e-3) continue; // vrchol mimo střed bodu (sloupy a okraje)
      const q = j * W + i;
      if (!inside[q]) continue;
      // barva vrcholu dávky: najdi vrchol se stejnou polohou v původní dávce
      const p = m.positions.subarray(t * 9 + k * 3, t * 9 + k * 3 + 3);
      for (let vv = 0; vv < T.count; vv++) {
        if (Math.abs(T.positions[vv * 3] - p[0]) + Math.abs(T.positions[vv * 3 + 1] - p[1]) + Math.abs(T.positions[vv * 3 + 2] - p[2]) > 1e-5) continue;
        const a = (T.colors[vv * 3] + T.colors[vv * 3 + 1] + T.colors[vv * 3 + 2]) * Math.PI;
        const b = rgb[q * 3] + rgb[q * 3 + 1] + rgb[q * 3 + 2];
        if (a > 0.5) ratios.push(b / a);
        break;
      }
    }
  }
}
ratios.sort((a, b) => a - b);
const med = ratios[Math.floor(ratios.length / 2)];
ok('textura v místě vrcholu = světlo po vrcholech × π (medián poměru)', ratios.length > 50 && Math.abs(med - 1) < 0.02, `${ratios.length} vrcholů, medián ${fmt(med, 4)}, 10 % ${fmt(ratios[Math.floor(ratios.length * 0.1)], 3)}, 90 % ${fmt(ratios[Math.floor(ratios.length * 0.9)], 3)}`);

// ostrý okraj stínu: řádek bodů podlahy haly (nejvyšší počet bodů v jednom řádku atlasu s normálou nahoru)
let sharp = 0;
for (let j = 0; j < lm.H; j++) {
  for (let i = 1; i < lm.W; i++) {
    const a = j * W + i - 1;
    const b = j * W + i;
    if (!inside[a] || !inside[b]) continue;
    const la = rgb[a * 3] + rgb[a * 3 + 1] + rgb[a * 3 + 2];
    const lb = rgb[b * 3] + rgb[b * 3 + 1] + rgb[b * 3 + 2];
    if (Math.max(la, lb) > 3 && Math.max(la, lb) > 2 * Math.min(la, lb)) sharp++;
  }
}
ok('stín má ostrý okraj: sousední body 10 cm od sebe se liší víc než 2× (po vrcholech 0,5 m to nejde)', sharp > 50, `${sharp} takových dvojic`);

// přepnutí lampy: textura se složí znovu, návrat dá tytéž hodnoty
const before = Float32Array.from(lm.rgb);
const lamp = game.entities.byId('e_lamp_hall_a');
game.behave.input(lamp, 'turnOff');
game.sim(0.1);
const changed = lm.update();
let diff = 0;
for (let i = 0; i < before.length; i++) diff = Math.max(diff, Math.abs(before[i] - lm.rgb[i]));
game.behave.input(lamp, 'turnOn');
game.sim(0.1);
lm.update();
let back = 0;
for (let i = 0; i < before.length; i++) back = Math.max(back, Math.abs(before[i] - lm.rgb[i]) / (1 + before[i]));
ok('zhasnutí lampy texturu změní, rozsvícení vrátí tytéž hodnoty', changed && diff > 1 && back < 1e-5, `největší změna ${fmt(diff, 1)}, po návratu poměrně ${back.toExponential(1)}`);
ok('beze změny světel se textura neskládá', lm.update() === false);

process.exit(h.finish('N-110 textura světla na hale (Node)'));
