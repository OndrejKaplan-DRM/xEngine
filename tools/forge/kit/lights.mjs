// xForge, sada kit_base: svítidla. Stropní mají počátek v bodě dotyku se stropem (předmět je pod ním),
// nástěnná v bodě dotyku se zdí (+Z do místnosti), stolní ve středu podstavy.
// Svítivost v kandelách (kontrakt, oddíl Světlo). Světlo nesené prefabem se nikdy nezapéká;
// základní osvětlení levelu dávají pevná světla v poli lights, svítidlo je k nim vypínatelný přídavek.

import { box, boxc, cyl, cbox, node, hinge, definePrefab, IO } from '../lib.mjs';

const WARM = [1, 0.9, 0.75];
const COOL = [0.85, 0.93, 1];
const lamp = (color, intensity, range, nodeId, o = {}) => ({ type: 'point', color, intensity, range, node: nodeId, cast: false, style: 'steady', on: false, ...o });

/** Závěsné svítidlo se stínidlem. */
export function lampPendant() {
  return definePrefab({
    id: 'lamp_pendant_01',
    title: 'Svítidlo stropní závěsné',
    category: 'prop.light',
    nodes: [node('mount'), node('bulb', 'mount', [0, -0.6, 0])],
    parts: [cyl('mount', [0, -0.015, 0], 0.05, 0.03, 'y', 'steel_dark'), box('mount', [-0.01, -0.5, -0.01], [0.01, -0.03, 0.01], 'steel_dark'), cyl('mount', [0, -0.55, 0], 0.2, 0.1, 'y', 'steel_dark'), cyl('bulb', [0, -0.006, 0], 0.13, 0.012, 'y', 'emit_warm')],
    components: { light: lamp(WARM, 60, 12, 'bulb') },
    ...IO.lamp,
    gen: 'lights.mjs#lampPendant',
  });
}

/** Zářivkové stropní svítidlo 1,2 m (laboratoře, chodby). Delší strana podél X. */
export function lampPanel() {
  return definePrefab({
    id: 'lamp_panel_01',
    title: 'Svítidlo stropní zářivkové 1,2 m',
    category: 'prop.light',
    nodes: [node('mount'), node('glow', 'mount', [0, -0.1, 0])],
    parts: [box('mount', [-0.6, -0.06, -0.1], [0.6, 0, 0.1], 'plastic_ivory'), box('mount', [-0.57, -0.07, -0.08], [0.57, -0.06, 0.08], 'emit_cool')],
    components: { light: lamp(COOL, 80, 12, 'glow') },
    ...IO.lamp,
    gen: 'lights.mjs#lampPanel',
  });
}

/** Nástěnné svítidlo. */
export function lampWall() {
  return definePrefab({
    id: 'lamp_wall_01',
    title: 'Svítidlo nástěnné',
    category: 'prop.light',
    nodes: [node('mount'), node('glow', 'mount', [0, -0.02, 0.16])],
    parts: [box('mount', [-0.06, -0.09, 0], [0.06, 0.09, 0.02], 'steel_dark'), box('mount', [-0.012, -0.012, 0.02], [0.012, 0.012, 0.14], 'steel_dark'), cyl('mount', [0, 0.02, 0.14], 0.07, 0.1, 'y', 'plastic_ivory'), cyl('mount', [0, -0.035, 0.14], 0.05, 0.012, 'y', 'emit_warm')],
    components: { light: lamp(WARM, 25, 8, 'glow') },
    ...IO.lamp,
    gen: 'lights.mjs#lampWall',
  });
}

/** Stolní lampa s kloubovým ramenem a kolébkovým vypínačem na podstavě (interakce patří vypínači). */
export function lampDesk() {
  return definePrefab(
    {
      id: 'lamp_desk_01',
      title: 'Lampa stolní s kloubovým ramenem',
      category: 'prop.light',
      nodes: [node('base'), node('rocker', 'base', [0.04, 0.02, 0.045]), node('arm', 'base', [0, 0.02, -0.03]), node('fore', 'arm', [0, 0.3, 0]), node('head', 'fore', [0, 0.28, 0], [50, 0, 0]), node('glow', 'head', [0, 0.1, 0])],
      joints: [
        hinge('toggle', 'rocker', [1, 0, 0], -10, 10, { detents: [-10, 10], damping: 1, drive: 'both' }),
        hinge('shoulder', 'arm', [1, 0, 0], -20, 50, { rest: 15, damping: 6, drive: 'manual' }),
        hinge('elbow', 'fore', [1, 0, 0], 20, 130, { rest: 80, damping: 6, drive: 'manual' }),
      ],
      parts: [
        cyl('base', [0, 0.01, 0], 0.085, 0.02, 'y', 'steel_dark'),
        box('rocker', [-0.012, 0, -0.016], [0.012, 0.006, 0.016], 'paint_red'),
        box('arm', [-0.008, 0, -0.008], [0.008, 0.3, 0.008], 'steel_brushed'),
        box('fore', [-0.008, 0, -0.008], [0.008, 0.28, 0.008], 'steel_brushed'),
        cyl('head', [0, 0.045, 0], 0.06, 0.09, 'y', 'paint_green'),
        cyl('head', [0, 0.092, 0], 0.045, 0.006, 'y', 'emit_warm'),
      ],
      colliders: [cbox('base', [-0.085, 0, -0.085], [0.085, 0.04, 0.085], 'prop')],
      components: { physics: { body: 'kinematic' }, interact: { kind: 'switch', joint: 'toggle', prompt: 'Rozsvítit', range: 1.4 }, light: lamp(WARM, 12, 4, 'glow') },
      ...IO.switch,
      gen: 'lights.mjs#lampDesk',
    },
    {
      toggle: 'Kolébkový vypínač na podstavě: ±10°, dvě zarážky.',
      shoulder: 'Kloubová lampa (typ „architekt“): spodní rameno se sklápí od mírného záklonu po asi 50° dopředu; polohu drží tření, proto tlumení bez pružiny. Úvaha, neměřeno.',
      elbow: 'Loket kloubové lampy: 20–130° mezi rameny, víc nedovolí táhla. Úvaha, neměřeno.',
    },
  );
}

/** Pochodeň v železném držáku. Hoří pořád (on: true), světlo plápolá. */
export function torchWall() {
  return definePrefab({
    id: 'torch_wall_01',
    title: 'Pochodeň nástěnná',
    category: 'prop.light',
    nodes: [node('mount'), node('shaft', 'mount', [0, -0.08, 0.07], [35, 0, 0]), node('flame', 'shaft', [0, 0.56, 0])],
    parts: [
      box('mount', [-0.04, -0.12, 0], [0.04, 0.08, 0.015], 'iron_black'),
      box('mount', [-0.035, -0.1, 0.015], [0.035, -0.06, 0.1], 'iron_black'),
      cyl('shaft', [0, 0.2, 0], 0.02, 0.5, 'y', 'wood_old'),
      cyl('shaft', [0, 0.47, 0], 0.036, 0.1, 'y', 'iron_black'),
      cyl('flame', [0, 0, 0], 0.03, 0.09, 'y', 'emit_fire'),
      boxc('flame', [0, 0.07, 0], [0.03, 0.06, 0.03], 'emit_fire'),
    ],
    components: { light: lamp([1, 0.6, 0.3], 14, 7, 'flame', { style: 'flicker', on: true }) },
    inputs: ['turnOn', 'turnOff', 'toggle'],
    outputs: ['on', 'off'],
    gen: 'lights.mjs#torchWall',
  });
}

export const LIGHTS = [lampPendant, lampPanel, lampWall, lampDesk, torchWall];
