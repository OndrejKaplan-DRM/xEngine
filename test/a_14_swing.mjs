// A1.4 v Node, návrh N-109: otočné dveře s kloubem na obě strany (min < rest < max) se otvírají od toho, kdo je
// otvírá. Chování řídí data; přepínač doorsAway (adresa ?doors=away) jen rozšíří rozsah dveřím, které ho v datech
// mají na jednu stranu. Polohy se počítají z dat prefabu.

import { h, makeGame, loadPack, oneSidedDoors, fmt } from './a_lib/node.mjs';
import { rigMatrices, mat4Mul, mat4Point } from '../src/xspace/index.js';

const { ok } = h;

function setup(game) {
  const { E, entities, io, player, session } = game;
  const outs = [];
  const fire = io.fire;
  io.fire = (kind, index, output, value) => {
    if (kind === 'entity') outs.push({ id: entities.list[index].id, output });
    return fire(kind, index, output, value);
  };
  const door = entities.list.find((e) => e.kind === 'door' && e.joints[0].def.type === 'hinge');
  const j = door.joints[0];
  const box = door.prefab.colliders.find((k) => k.node === j.def.node);
  const leaf = (v) => mat4Point(mat4Mul(door.em, rigMatrices(door.prefab, { [j.def.id]: v })[j.def.node]), [(box.min[0] + box.max[0]) / 2, 0, (box.min[2] + box.max[2]) / 2]);
  const floor = session.level.cells.find((k) => k.id === door.cell).bounds.min[1];
  /** Postaví hráče 1,2 m od zavřených dveří na stranu, kam se křídlo vychyluje při kladné (+1) nebo záporné (−1) hodnotě. */
  const stand = (side) => {
    const c = leaf(j.rest);
    const t = leaf(j.rest + side * Math.min(60, (j.def.max - j.rest) * 0.5));
    const d = [t[0] - c[0], t[2] - c[2]];
    const len = Math.hypot(d[0], d[1]);
    // kolmice k zavřenému křídlu směrem k vychýlenému středu: stačí směr od středu zavřeného ke středu vychýleného
    player.teleport(c[0] + (d[0] / len) * 1.2, floor, c[2] + (d[1] / len) * 1.2);
    game.sim(0.2);
  };
  const fired = (output) => outs.filter((o) => o.id === door.id && o.output === output).length;
  return { E, door, j, stand, fired, leaf };
}

// Body 1 a 2 potřebují dveře s rozsahem na jednu stranu: test si je udělá sám (D-042: zlatý vzorek může mít dveře
// na obě strany, pak by přepínač neměl co rozšiřovat).
const [onePack] = oneSidedDoors(await loadPack());

// ---- 1. bez přepínače: data mají rozsah na jednu stranu a dveře se chovají jako dosud
{
  const game = await makeGame({ shadows: false, pack: onePack });
  game.start();
  const { door, j, stand, fired } = setup(game);
  stand(-1);
  game.behave.use(door);
  game.sim(1.5);
  ok(j.def.min === j.rest && j.value === j.def.max && fired('opened') === 1, 'dveře s rozsahem na jednu stranu se otvírají do max, ať stojí hráč kdekoli', `rozsah ${j.def.min}° až ${j.def.max}°, kloub ${j.value}°`);
}

// ---- 2. přepínač doorsAway: rozsah na obě strany, otevření od hráče
{
  const game = await makeGame({ doorsAway: true, pack: structuredClone(onePack) }); // se zastíněním: dveře jsou brána světla
  game.start();
  const { door, j, stand, fired } = setup(game);
  ok(j.def.min === -j.def.max && j.rest === 0 && game.pack.prefabs.find((p) => p.data.id === door.prefab.id).data.rig.joints[0].min === 0, 'přepínač dá dveřím rozsah na obě strany a data balíku nezmění', `kloub ${j.def.min}° až ${j.def.max}°, v balíku min ${game.pack.prefabs.find((p) => p.data.id === door.prefab.id).data.rig.joints[0].min}°`);
  const stalled = () => game.get('entities.stat').stalled;
  const s0 = stalled();
  stand(1); // hráč stojí tam, kam by se křídlo otvíralo do kladných hodnot
  game.behave.use(door);
  game.sim(1.5);
  ok(j.value === j.def.min && fired('opened') === 1 && stalled() === s0, 'hráč na kladné straně: dveře se otevřou do záporné, od něj, a nezastaví se o něj', `kloub ${j.value}°, opened ${fired('opened')}×, zastavení ${stalled() - s0}`);
  const vis = game.get('vis.portals').find((p) => p.id === game.session.level.portals.find((q) => q.door === door.id)?.id);
  game.light.flush(); // otevření dveří do bran světla (ve hře před každým vykreslením)
  const gate = game.occlusion.inspect(['doors']).find((d) => d.id === door.id);
  ok((!vis || vis.open) && (!gate || gate.open === 1), 'dveře otevřené na zápornou stranu jsou pro pohled i pro světlo otevřené', `portál ${vis ? vis.open : 'bez portálu'}, brána světla ${gate ? gate.open : 'bez brány'}`);
  game.behave.use(door);
  game.sim(1.5);
  ok(j.value === j.rest && fired('closed') === 1, 'další použití dveře zavře do klidové polohy', `kloub ${j.value}°, closed ${fired('closed')}×`);
  stand(-1);
  game.behave.use(door);
  game.sim(1.5);
  ok(j.value === j.def.max && fired('opened') === 2 && stalled() === s0, 'hráč na záporné straně: dveře se otevřou do kladné', `kloub ${j.value}°`);
  // vstup open na dveře už otevřené na jednu stranu je nepřehodí na druhou
  stand(1);
  game.behave.input(door, 'open');
  game.sim(0.5);
  ok(j.value === j.def.max && fired('opened') === 2, 'open na otevřené dveře je nepřehodí na druhou stranu a neohlásí druhé opened', `kloub ${j.value}°`);
}

// ---- 3. totéž z dat: prefab s rozsahem na obě strany, bez přepínače
{
  const pack = structuredClone(await loadPack());
  for (const p of pack.prefabs) {
    const k = p.data.rig?.joints?.[0];
    if (p.data.components?.interact?.kind === 'door' && k?.type === 'hinge') k.min = -k.max;
  }
  const game = await makeGame({ shadows: false, pack });
  game.start();
  const { door, j, stand, fired } = setup(game);
  stand(1);
  game.behave.use(door);
  game.sim(1.5);
  const a = j.value;
  game.behave.use(door);
  game.sim(1.5);
  stand(-1);
  game.behave.use(door);
  game.sim(1.5);
  ok(game.entities.doorsAway === false && a === j.def.min && j.value === j.def.max && fired('opened') === 2 && fired('closed') === 1, 'prefab s rozsahem na obě strany v datech se chová stejně i bez přepínače', `z kladné strany ${a}°, ze záporné ${j.value}°`);
}

// ---- 4. jen dveře v průchodech: dvířka nábytku (stejná interakce door) se nerozšiřují; druhé křídlo dvoukřídlých ano
{
  const { readPackFull } = await import('../tools/lib/read-pack.mjs');
  const { portalDoorIds } = await import('../src/world/swing.js');
  const pack = await readPackFull(new URL('../packs/gen_demo', import.meta.url).pathname);
  const game = await makeGame({ shadows: false, doorsAway: true, pack });
  game.start();
  const L = game.session.level;
  const room = portalDoorIds(L);
  const widened = (e) => e.kind === 'door' && e.joints[0]?.def.type === 'hinge' && e.joints[0].def.min < e.joints[0].rest;
  const hingeDoors = game.entities.list.filter((e) => e.kind === 'door' && e.joints[0]?.def.type === 'hinge');
  const furniture = hingeDoors.filter((e) => !room.has(e.id));
  const rooms = hingeDoors.filter((e) => room.has(e.id));
  const wings = rooms.filter((e) => !(L.portals || []).some((p) => p.door === e.id));
  const byPrefab = (list) => [...new Set(list.map((e) => e.prefab.id))].join(', ');
  ok(furniture.length > 0 && furniture.every((e) => !widened(e)), 'dvířka nábytku se nerozšiřují (otvírala by se do nábytku)', `${L.id}: ${furniture.length} kusů (${byPrefab(furniture)})`);
  ok(rooms.length > 0 && rooms.every(widened) && wings.length > 0, 'dveře v průchodech včetně druhých křídel dvoukřídlých dveří se rozšiřují', `${rooms.length} dveří, z toho ${wings.length} druhých křídel (${byPrefab(wings)})`);
}

process.exit(h.finish('A1.4 dveře od hráče, návrh N-109 (Node)'));
