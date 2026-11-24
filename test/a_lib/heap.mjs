// Měření haldy pro a_15_io: 500 použití tlačítka v chodbě. Spouští se s --expose-gc; výsledek je jeden řádek JSON.
// Neměří, kolik odpadu vzniká (to hlídá návrh N-102), ale jestli něco zůstává: halda po úklidu nesmí růst.

import { makeGame } from './node.mjs';

const game = await makeGame();
const { E, entities, player, input } = game;
game.start();
game.sim(0.2);
const c = entities.center('e_btn_lab');
const ent = entities.byId('e_btn_lab');
player.teleport(c[0] + ent.em[8] * 0.9, 0, c[2] + ent.em[10] * 0.9);
player.lookAt(c[0], c[1], c[2]);
// Mezi kroky běží i „snímky“ (bez obrazu): viditelnost, brány dveří a světlo po vrcholech se přepočítávají
// stejně jako ve hře, takže se měří i jejich paměť.
const press = (n) => {
  for (let i = 0; i < n; i++) {
    input.use();
    for (let f = 0; f < 5; f++) {
      game.sim(0.05);
      game.render.frame();
    }
  }
};
press(500); // zahřátí: překladač a líně zakládané struktury (změřeno: růst se po prvních stovkách stisků zastaví)
globalThis.gc();
globalThis.gc();
const before = process.memoryUsage().heapUsed;
const s0 = E.steps;
press(500);
globalThis.gc();
globalThis.gc();
const after = process.memoryUsage().heapUsed;
console.log(JSON.stringify({ beforeKb: Math.round(before / 1024), afterKb: Math.round(after / 1024), growKb: Math.round((after - before) / 1024), steps: E.steps - s0, fired: game.get('io.stat').fired, uses: game.get('interact.stat').uses }));
