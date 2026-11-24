// Validátor xSpace: munice a zbraně (N-201, zkušební formát) a předměty, které dává pickup.
// Kódy: ref.ammo, ref.prefab, weapon.projectile, weapon.range, weapon.charge, weapon.ammo, weapon.slot,
// pack.dupeWeapon, pickup.item.

import { FORMATS, PICKUP_ITEMS } from './formats.js';
import { ID, isNum, checkShape } from './check.js';

const isRamp = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('min' in v || 'max' in v);

/** Hodnoty režimu, které smějí záviset na nabití. */
function rampsOf(mode) {
  return [mode.cost, mode.damage, mode.push, mode.projectile?.speed, mode.splash?.radius, mode.splash?.damage, mode.splash?.push];
}

function checkMode(mode, path, w, c) {
  if (!mode || typeof mode !== 'object') return;
  if (mode.kind === 'projectile' && !mode.projectile) c.err('weapon.projectile', path, 'režim projectile vyžaduje projectile');
  if (mode.kind !== 'projectile' && mode.projectile) c.err('weapon.projectile', `${path}.projectile`, `projectile patří jen k režimu projectile, ne ${mode.kind}`);
  if ((mode.kind === 'hitscan' || mode.kind === 'melee') && mode.range === undefined) c.err('weapon.range', path, `režim ${mode.kind} vyžaduje dosah range`);
  if (!mode.charge && rampsOf(mode).some(isRamp)) c.err('weapon.charge', path, 'hodnota { min, max } podle nabití vyžaduje charge');
  if (mode.charge && isNum(mode.charge.time) && isNum(mode.charge.release) && mode.charge.release < mode.charge.time) {
    c.err('weapon.charge', `${path}.charge.release`, `samovolné vystřelení (${mode.charge.release} s) přijde dřív než plné nabití (${mode.charge.time} s)`);
  }
  if (w.ammo === undefined && mode.cost !== undefined && (isRamp(mode.cost) ? mode.cost.max > 0 : mode.cost > 0)) c.err('weapon.ammo', `${path}.cost`, 'zbraň bez munice nemůže mít cenu výstřelu');
}

/**
 * Munice, zbraně a pickup. `external` = balík stojí na nenačtených balících z requires: neznámý prefab je
 * jen varování. Vrací množiny id munice a zbraní (pro statistiku).
 */
export function checkArsenal(pack, prefabIds, external, c) {
  const m = pack.manifest;
  const ammoFile = m?.ammo || 'ammo.json';
  const ammoIds = new Set();
  if (pack.ammo) {
    checkShape(FORMATS.ammo, pack.ammo, ammoFile, c);
    for (const k of Object.keys(pack.ammo.ammo && typeof pack.ammo.ammo === 'object' ? pack.ammo.ammo : {})) {
      if (!ID.test(k)) c.err('shape.id', `${ammoFile}.ammo.${k}`, 'id munice má být malými písmeny, číslicemi a podtržítkem');
      ammoIds.add(k);
    }
  } else if (m?.ammo && pack.ammo === null) c.err('pack.missingFile', 'pack.json.ammo', `soubor „${m.ammo}“ se nenačetl`); // null = loadPack ho zkusil; balík poskládaný v testu pole nemá

  const weaponIds = new Set();
  const slots = new Map();
  for (const { file, data: w, from } of pack.weapons || []) {
    if (w && typeof w.id === 'string') {
      if (weaponIds.has(w.id)) c.err('pack.dupeWeapon', file, `zbraň „${w.id}“ je v balíku dvakrát`);
      weaponIds.add(w.id);
    }
    if (from) continue;
    checkShape(FORMATS.weapon, w, file, c);
    if (!w || typeof w !== 'object') continue;
    if (w.ammo !== undefined && !ammoIds.has(w.ammo)) c.err('ref.ammo', `${file}.ammo`, `munice „${w.ammo}“ neexistuje`);
    const vp = w.view?.prefab;
    if (vp !== undefined && !prefabIds.has(vp)) {
      if (external) c.warn('ref.prefabExternal', `${file}.view.prefab`, `prefab „${vp}“ není v tomto balíku; očekává se v balíku z requires`);
      else c.err('ref.prefab', `${file}.view.prefab`, `prefab „${vp}“ neexistuje`);
    }
    checkMode(w.primary, `${file}.primary`, w, c);
    checkMode(w.alt, `${file}.alt`, w, c);
    const key = `${w.slot}/${w.order ?? 0}`;
    if (slots.has(key)) c.warn('weapon.slot', `${file}.slot`, `slot ${w.slot} s pořadím ${w.order ?? 0} už má zbraň „${slots.get(key)}“`);
    slots.set(key, w.id);
  }

  for (const { file, data, from } of pack.prefabs || []) {
    const item = data?.components?.pickup?.item;
    if (from || typeof item !== 'string') continue;
    if (!PICKUP_ITEMS.includes(item) && !ammoIds.has(item) && !weaponIds.has(item) && !external) {
      c.warn('pickup.item', `${file}.components.pickup.item`, `předmět „${item}“ není zbraň ani munice balíku ani z ${PICKUP_ITEMS.join(', ')}`);
    }
  }
  return { ammoIds, weaponIds };
}
