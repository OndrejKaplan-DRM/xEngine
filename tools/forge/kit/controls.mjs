// xForge, sada kit_base: ovládací prvky. Nástěnné mají počátek v bodě dotyku se zdí ve středu zařízení
// a +Z míří ze zdi do místnosti. U každého kloubu platí: klidová poloha = min = „vypnuto“, max = „zapnuto“.

import { box, boxc, cyl, cbox, node, hinge, slider, definePrefab, IO } from '../lib.mjs';

const kin = { physics: { body: 'kinematic' } };

/** Hřibové tlačítko na krabičce. */
export function buttonRound() {
  return definePrefab(
    {
      id: 'button_round_01',
      title: 'Tlačítko hřibové',
      category: 'device.control',
      nodes: [node('base'), node('cap', 'base', [0, 0, 0.03])],
      joints: [slider('press', 'cap', [0, 0, -1], 0, 0.008, { spring: 500, damping: 20, drive: 'manual' })],
      parts: [box('base', [-0.05, -0.05, 0], [0.05, 0.05, 0.03], 'paint_yellow'), cyl('base', [0, 0, 0.032], 0.036, 0.004, 'z', 'steel_dark'), cyl('cap', [0, 0, 0.012], 0.03, 0.02, 'z', 'paint_red')],
      colliders: [cbox('base', [-0.05, -0.05, 0], [0.05, 0.05, 0.055])],
      components: { ...kin, interact: { kind: 'button', joint: 'press', prompt: 'Stisknout', range: 1.6 } },
      ...IO.button,
      gen: 'controls.mjs#buttonRound',
    },
    { press: 'Hřibové tlačítko: zdvih 6–10 mm, pružina vrací; 8 mm. Úvaha, neměřeno.' },
  );
}

/** Ploché přivolávací tlačítko s kontrolkou (vedle posuvných dveří). */
export function buttonCall() {
  return definePrefab(
    {
      id: 'button_call_01',
      title: 'Tlačítko dveří s kontrolkou',
      category: 'device.control',
      nodes: [node('base'), node('cap', 'base', [0, -0.02, 0.014])],
      joints: [slider('press', 'cap', [0, 0, -1], 0, 0.004, { spring: 800, damping: 30, drive: 'manual' })],
      parts: [box('base', [-0.04, -0.07, 0], [0.04, 0.07, 0.014], 'steel_brushed'), boxc('cap', [0, 0, 0.004], [0.05, 0.05, 0.008], 'plastic_dark'), boxc('base', [0, 0.045, 0.015], [0.03, 0.012, 0.004], 'emit_green')],
      colliders: [cbox('base', [-0.04, -0.07, 0], [0.04, 0.07, 0.024])],
      components: { ...kin, interact: { kind: 'button', joint: 'press', prompt: 'Stisknout', range: 1.6 } },
      ...IO.button,
      gen: 'controls.mjs#buttonCall',
    },
    { press: 'Ploché tlačítko s mikrospínačem: zdvih 3–5 mm; 4 mm. Úvaha, neměřeno.' },
  );
}

/** Kolébkový vypínač v rámečku 80 × 80 mm. */
export function switchRocker() {
  return definePrefab(
    {
      id: 'switch_rocker_01',
      title: 'Vypínač kolébkový',
      category: 'device.control',
      nodes: [node('base'), node('rocker', 'base', [0, 0, 0.012])],
      joints: [hinge('rock', 'rocker', [1, 0, 0], -7, 7, { detents: [-7, 7], damping: 2, drive: 'both' })],
      parts: [box('base', [-0.04, -0.04, 0], [0.04, 0.04, 0.012], 'plastic_ivory'), box('rocker', [-0.026, -0.03, 0], [0.026, 0.03, 0.009], 'plastic_ivory'), box('rocker', [-0.004, 0.012, 0.009], [0.004, 0.024, 0.0105], 'emit_red')],
      colliders: [cbox('base', [-0.04, -0.04, 0], [0.04, 0.04, 0.025])],
      components: { ...kin, interact: { kind: 'switch', joint: 'rock', prompt: 'Přepnout', range: 1.6 } },
      ...IO.switch,
      gen: 'controls.mjs#switchRocker',
    },
    { rock: 'Kolébkový vypínač: kolébka se překlápí o 6–8° na každou stranu, dvě stabilní polohy (zarážky). Úvaha, neměřeno.' },
  );
}

/** Nožový (pákový) vypínač na desce. Rozpojený trčí ze zdi, sepnutý leží v kontaktech. */
export function leverKnife() {
  return definePrefab(
    {
      id: 'lever_knife_01',
      title: 'Vypínač pákový nožový',
      category: 'device.control',
      // uzel ramene je v klidu vyklopený o 70° ze zdi; kloub ho sklápí zpět k desce
      nodes: [node('plate'), node('arm', 'plate', [0, -0.13, 0.04], [70, 0, 0])],
      joints: [hinge('throw', 'arm', [-1, 0, 0], 0, 70, { detents: [0, 70], damping: 6, drive: 'both' })],
      parts: [
        box('plate', [-0.09, -0.2, 0], [0.09, 0.2, 0.025], 'steel_dark'),
        boxc('plate', [0, -0.13, 0.04], [0.07, 0.04, 0.03], 'copper'),
        boxc('plate', [0, 0.13, 0.04], [0.07, 0.04, 0.03], 'copper'),
        box('arm', [-0.025, 0, -0.006], [-0.015, 0.3, 0.006], 'copper'),
        box('arm', [0.015, 0, -0.006], [0.025, 0.3, 0.006], 'copper'),
        cyl('arm', [0, 0.31, 0], 0.018, 0.16, 'x', 'paint_red'),
      ],
      colliders: [cbox('plate', [-0.09, -0.2, 0], [0.09, 0.2, 0.055]), cbox('arm', [-0.08, 0, -0.02], [0.08, 0.33, 0.02])],
      components: { ...kin, interact: { kind: 'lever', joint: 'throw', prompt: 'Přehodit páku', range: 1.6, manipulate: true } },
      ...IO.lever,
      gen: 'controls.mjs#leverKnife',
    },
    { throw: 'Nožový vypínač: rozpojená poloha vyklopená 60–80° od desky, sepnutá naplocho v kontaktech; zdvih 70° se zarážkami na obou koncích. Úvaha, neměřeno.' },
  );
}

/** Podlahová stavěcí páka (počátek na podlaze ve středu podstavy). */
export function leverFloor() {
  return definePrefab(
    {
      id: 'lever_floor_01',
      title: 'Páka podlahová stavěcí',
      category: 'device.control',
      nodes: [node('base'), node('arm', 'base', [0, 0.1, 0])],
      joints: [hinge('swing', 'arm', [1, 0, 0], -30, 30, { detents: [-30, 30], damping: 8, drive: 'both' })],
      parts: [
        box('base', [-0.12, 0, -0.18], [0.12, 0.06, 0.18], 'steel_dark'),
        box('base', [-0.07, 0.06, -0.1], [-0.04, 0.16, 0.1], 'steel_dark'),
        box('base', [0.04, 0.06, -0.1], [0.07, 0.16, 0.1], 'steel_dark'),
        cyl('base', [0, 0.1, 0], 0.02, 0.16, 'x', 'steel_brushed'),
        box('arm', [-0.015, 0, -0.02], [0.015, 0.85, 0.02], 'steel_brushed'),
        cyl('arm', [0, 0.92, 0], 0.022, 0.16, 'y', 'rubber_black'),
      ],
      colliders: [cbox('base', [-0.12, 0, -0.18], [0.12, 0.16, 0.18]), cbox('arm', [-0.03, 0, -0.03], [0.03, 1, 0.03])],
      components: { ...kin, interact: { kind: 'lever', joint: 'swing', prompt: 'Přehodit páku', range: 1.8, manipulate: true } },
      ...IO.lever,
      gen: 'controls.mjs#leverFloor',
    },
    { swing: 'Stavěcí páka se západkou: krajní polohy 25–35° od svislice na každou stranu; ±30°. Úvaha, neměřeno.' },
  );
}

/** Šoupátko s ručním kolem na krátkém kusu potrubí; potrubí běží podél X ve vzdálenosti 0,15 m od zdi. */
export function valveGate() {
  return definePrefab(
    {
      id: 'valve_gate_01',
      title: 'Šoupátko s ručním kolem',
      category: 'device.control',
      nodes: [node('pipe'), node('wheel', 'pipe', [0, 0.27, 0.15])],
      joints: [hinge('turn', 'wheel', [0, 1, 0], 0, 1800, { damping: 8, drive: 'manual' })],
      parts: [
        cyl('pipe', [0, 0, 0.15], 0.05, 0.7, 'x', 'steel_painted'),
        cyl('pipe', [-0.16, 0, 0.15], 0.075, 0.03, 'x', 'steel_dark'),
        cyl('pipe', [0.16, 0, 0.15], 0.075, 0.03, 'x', 'steel_dark'),
        boxc('pipe', [0, 0.02, 0.15], [0.14, 0.2, 0.13], 'paint_blue'),
        cyl('pipe', [0, 0.19, 0.15], 0.014, 0.16, 'y', 'steel_brushed'),
        box('pipe', [-0.3, -0.03, 0], [-0.26, 0.03, 0.15], 'steel_dark'),
        box('pipe', [0.26, -0.03, 0], [0.3, 0.03, 0.15], 'steel_dark'),
        cyl('wheel', [0, 0, 0], 0.1, 0.018, 'y', 'paint_red'),
        boxc('wheel', [0, 0.012, 0], [0.19, 0.008, 0.02], 'steel_brushed'),
        boxc('wheel', [0, 0.012, 0], [0.02, 0.008, 0.19], 'steel_brushed'),
      ],
      colliders: [cbox('pipe', [-0.35, -0.08, 0], [0.35, 0.12, 0.22]), cbox('wheel', [-0.1, -0.01, -0.1], [0.1, 0.02, 0.1])],
      components: { ...kin, interact: { kind: 'valve', joint: 'turn', prompt: 'Točit kolem', range: 1.6, manipulate: true } },
      ...IO.valve,
      gen: 'controls.mjs#valveGate',
    },
    { turn: 'Šoupátko DN 50: z plného zavření do plného otevření zhruba 5–6 otáček kola (zdvih klínu ≈ světlost, stoupání vřetene kolem 10 mm); 5 otáček. Úvaha, neměřeno.' },
  );
}

/** Kulový kohout s pákou: čtvrt otáčky. */
export function valveBall() {
  return definePrefab(
    {
      id: 'valve_ball_01',
      title: 'Kohout kulový s pákou',
      category: 'device.control',
      nodes: [node('pipe'), node('handle', 'pipe', [0, 0.06, 0.1])],
      joints: [hinge('turn', 'handle', [0, 1, 0], 0, 90, { detents: [0, 90], damping: 4, drive: 'manual' })],
      parts: [
        cyl('pipe', [0, 0, 0.1], 0.03, 0.5, 'x', 'copper'),
        boxc('pipe', [0, 0, 0.1], [0.1, 0.08, 0.08], 'brass'),
        box('pipe', [-0.22, -0.02, 0], [-0.19, 0.02, 0.1], 'steel_dark'),
        box('pipe', [0.19, -0.02, 0], [0.22, 0.02, 0.1], 'steel_dark'),
        cyl('handle', [0, -0.01, 0], 0.012, 0.02, 'y', 'steel_brushed'),
        // v klidu páka napříč potrubím = zavřeno; po otočení o 90° leží podél potrubí = otevřeno
        box('handle', [-0.012, 0, -0.012], [0.012, 0.01, 0.16], 'paint_red'),
      ],
      colliders: [cbox('pipe', [-0.25, -0.05, 0], [0.25, 0.08, 0.15])],
      components: { ...kin, interact: { kind: 'valve', joint: 'turn', prompt: 'Otočit kohoutem', range: 1.6, manipulate: true } },
      ...IO.valve,
      gen: 'controls.mjs#valveBall',
    },
    { turn: 'Kulový kohout je čtvrtotáčkový: páka napříč potrubím = zavřeno, podél = otevřeno, dorazy na 0° a 90°.' },
  );
}

/** Nástěnný kohoutek s otočnou hlavicí. */
export function tapWall() {
  return definePrefab(
    {
      id: 'tap_wall_01',
      title: 'Kohoutek nástěnný',
      category: 'device.control',
      nodes: [node('body'), node('head', 'body', [0, 0.05, 0.09])],
      joints: [hinge('turn', 'head', [0, 1, 0], 0, 540, { damping: 3, drive: 'manual' })],
      parts: [
        cyl('body', [0, 0, 0.004], 0.03, 0.008, 'z', 'steel_brushed'),
        cyl('body', [0, 0, 0.06], 0.016, 0.12, 'z', 'brass'),
        cyl('body', [0, 0.025, 0.09], 0.012, 0.05, 'y', 'brass'),
        box('body', [-0.012, -0.012, 0.11], [0.012, 0.012, 0.19], 'brass'),
        cyl('body', [0, -0.03, 0.18], 0.01, 0.06, 'y', 'brass'),
        boxc('head', [0, 0.008, 0], [0.09, 0.012, 0.018], 'steel_brushed'),
        boxc('head', [0, 0.008, 0], [0.018, 0.012, 0.09], 'steel_brushed'),
      ],
      colliders: [cbox('body', [-0.05, -0.06, 0], [0.05, 0.07, 0.19])],
      components: { ...kin, interact: { kind: 'valve', joint: 'turn', prompt: 'Otočit kohoutkem', range: 1.4, manipulate: true } },
      ...IO.valve,
      gen: 'controls.mjs#tapWall',
    },
    { turn: 'Vřetenový kohoutek s těsněním: z dotažení do plného průtoku 1 až 2 otáčky; 1,5 otáčky (540°). Úvaha, neměřeno.' },
  );
}

export const CONTROLS = [buttonRound, buttonCall, switchRocker, leverKnife, leverFloor, valveGate, valveBall, tapWall];
