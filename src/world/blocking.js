// xWorld: díl na pohon nikoho nedrtí a nikoho netlačí zdí (D-025). Než se nová hodnota kloubu roznese do těles,
// zkusí se kolize dílu v nové poloze proti kapsli postavy a volným tělesům. Dotaz sám patří fyzice
// (phys.obstructs); tady se jen skládá poloha kolideru z matice uzlu.

import { decompose, mul4 } from '../phys/xform.js';
import { MOVED } from './joints.js';

/**
 * Druhy interakce, jejichž díly se o překážku zastaví. Ovladače (tlačítko, vypínač, páka, ventil) sem nepatří:
 * jsou drobné, hráč je má u ruky a jejich pohyb do něj nemíří.
 */
export const GUARDED = new Set(['door', 'drawer']);
/** Po této době stání se pohon vrátí do polohy, ze které vyjel (sekundy). */
export const BLOCK_RETURN = 0.5;

const W = new Array(16).fill(0);
const T = { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1, s: 1 };
const pos = { x: 0, y: 0, z: 0 };
const rot = { x: 0, y: 0, z: 0, w: 1 };

/** Kolider hlídaného dílu a jeho místní poloha vůči tělesu uzlu. */
export function guardOf(col) {
  const t = col.translationWrtParent();
  const r = col.rotationWrtParent();
  return { col, lx: t.x, ly: t.y, lz: t.z, qx: r.x, qy: r.y, qz: r.z, qw: r.w };
}

/** Stál by některý díl entity s maticemi uzlů v ent.rig.mats (právě spočítanými) v hráči nebo ve volném tělese hlouběji než teď? */
export function obstructed(ent, phys) {
  for (const rec of ent.movers) {
    if (!rec.guards) continue;
    mul4(ent.em, rec.view, W);
    decompose(W, T);
    const { qx, qy, qz, qw } = T;
    for (const g of rec.guards) {
      // poloha kolideru = poloha tělesa + otočený místní posun; v' = v + 2w(q × v) + 2 q × (q × v)
      const cx = qy * g.lz - qz * g.ly;
      const cy = qz * g.lx - qx * g.lz;
      const cz = qx * g.ly - qy * g.lx;
      pos.x = T.x + g.lx + 2 * (qw * cx + qy * cz - qz * cy);
      pos.y = T.y + g.ly + 2 * (qw * cy + qz * cx - qx * cz);
      pos.z = T.z + g.lz + 2 * (qw * cz + qx * cy - qy * cx);
      rot.x = qw * g.qx + qx * g.qw + qy * g.qz - qz * g.qy;
      rot.y = qw * g.qy - qx * g.qz + qy * g.qw + qz * g.qx;
      rot.z = qw * g.qz + qx * g.qy - qy * g.qx + qz * g.qw;
      rot.w = qw * g.qw - qx * g.qx - qy * g.qy - qz * g.qz;
      if (phys.obstructs(g.col, pos, rot)) return true;
    }
  }
  return false;
}

/**
 * Zruší právě provedený krok kloubů entity (hodnoty z j.pv, cíle z j.pt). Pohonu přičte dobu stání; stojí-li
 * BLOCK_RETURN, obrátí ho tam, odkud vyjel. Pružina, zarážka i ruka hráče jen stojí. Vrací počet obrácených pohonů.
 */
export function revertStep(ent, dt) {
  let returns = 0;
  for (const j of ent.joints) {
    if (!(j.bits & MOVED)) continue;
    const powered = !Number.isNaN(j.pt);
    j.value = j.pv;
    j.target = j.pt;
    j.vel = 0;
    j.active = true;
    j.bits = 0;
    ent.values[j.def.id] = j.value;
    if (!powered) continue;
    j.blocked += dt;
    if (j.blocked >= BLOCK_RETURN) {
      j.blocked = 0;
      j.target = j.from;
      j.from = j.value;
      returns++;
    }
  }
  return returns;
}
