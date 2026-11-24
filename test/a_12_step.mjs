// A2.3 v Node: krok fyziky. Obal Rapieru po každém world.step() prochází všechna tělesa a kolidery; xPhys ho
// pouští jen v kroku po změně (phys.lazyMap). Tady se hlídá, že se tím nezmění výsledek simulace a že se obal
// po změně opravdu pustí.

import { h, makeGame, fmt } from './a_lib/node.mjs';

const { ok } = h;

/** Scénář s pohybem těles: odstrčené bedny, chůze hráče, otevření dveří. Vrací stav všeho, co se hýbe. */
async function scenario(lazy) {
  const game = await makeGame({ shadows: false });
  game.phys.lazyMap = lazy;
  game.loadLevel(game.session.levelId); // svět fyziky znovu, už s požadovaným režimem
  game.start();
  game.sim(0.5);
  const crates = game.entities.list.filter((e) => e.body);
  crates.forEach((e, i) => game.entities.impulse(e, 40 * (i % 2 ? 1 : -1), 30, 25));
  for (const e of game.entities.list) if (e.kind === 'door') game.behave.input(e, 'open');
  game.sim(1.5, { hold: ['fwd'], yawRate: 40 });
  game.sim(1.5);
  const state = [];
  for (const e of crates) {
    const p = e.body.translation();
    const q = e.body.rotation();
    state.push(p.x, p.y, p.z, q.x, q.y, q.z, q.w);
  }
  state.push(...game.get('player.pos'));
  for (const e of game.entities.list) for (const j of e.joints) state.push(j.value);
  return { game, state, crates: crates.length };
}

const full = await scenario(false);
const lazy = await scenario(true);
{
  let worst = 0;
  for (let i = 0; i < full.state.length; i++) worst = Math.max(worst, Math.abs(full.state[i] - lazy.state[i]));
  ok(full.state.length === lazy.state.length && worst === 0, 'simulace vyjde stejně, ať obal Rapieru prochází tělesa po každém kroku, nebo jen po změně', `${full.state.length} hodnot (${full.crates} volných těles, hráč, klouby), největší rozdíl ${worst}`);
  const steps = lazy.game.E.steps;
  ok(lazy.game.phys.stat.maps >= 1 && lazy.game.phys.stat.maps <= 3 && full.game.phys.stat.maps === 0, 'obal Rapieru se za celý scénář pustí jen po stavbě světa', `${lazy.game.phys.stat.maps} průchodů na ${steps} kroků`);
}

// ---- po změně (nové těleso, výměna kapsle hráče) se obal pustí znovu a nové těleso je pro dotazy vidět
{
  const { game } = lazy;
  const { phys } = game;
  const before = phys.stat.maps;
  game.sim(0.2);
  const quiet = phys.stat.maps - before;
  const body = phys.addBody('dynamic', 3, 1.2, 3.5, null, {});
  const col = phys.addCollider(body, { type: 'box', half: [0.2, 0.2, 0.2] }, [0, 0, 0], null, { group: 'prop', mass: 5 }, { kind: 'test' });
  game.sim(1.5);
  const after = phys.stat.maps - before - quiet;
  const p = body.translation();
  const hit = phys.raycast(p.x, 2.5, p.z, 0, -1, 0, 5, 0xffffffff);
  ok(quiet === 0 && after === 1 && hit && hit.ref?.kind === 'test' && phys.world.colliders.contains(col.handle), 'po přidání tělesa se obal pustí jednou a těleso je pro paprsky vidět', `v klidu ${quiet} průchodů, po přidání ${after}; paprsek shora zasáhl ${hit?.ref?.kind} ve vzdálenosti ${hit ? fmt(hit.dist, 2) : '–'} m`);
  ok(Math.abs(p.y - 0.2) < 0.02 && game.get('player.pos').every(Number.isFinite), 'nové těleso se simuluje: spadlo na podlahu a leží', `střed krychle ve výšce ${fmt(p.y, 3)} m (polovina hrany 0,2 m)`);
}

process.exit(h.finish('A2.3 krok fyziky: obal Rapieru jen po změně (Node)'));
