// xSpace: zkušební formát zbraní a munice (N-201, D-053). Oddělený od formats.js kvůli mezi 600 řádků
// (25. 11. 2026); formats.js ho vkládá do FORMATS a znovu vyváží jeho výčty, navenek se nic nemění.
// Po zkoušce A3.1 a B3.1 se zmrazí (D-030) a druhy ammo a weapon zmizí z EXPERIMENTAL_KINDS.

import { id, str, num, int, vec3, en, map, obj, ref, ramp, R } from './schema.js';

/** Druh režimu zbraně (N-201, zkušební): paprsek, střela s letem, úder na dosah. */
export const WEAPON_MODES = ['hitscan', 'projectile', 'melee'];
/** Průběh hodnoty podle nabití zbraně: lineárně, nebo s druhou mocninou nabití (N-201). */
export const RAMP_CURVES = ['linear', 'square'];
/**
 * Odhození výbuchem a zásahem (N-201, vzorec Arény v2): Δv = push · (1 − d/r) / (1 + m / PUSH_MASS), kg.
 * Lehké věci letí rychlostí push, auto 1 100 kg se převrátí.
 */
export const PUSH_MASS = 800;
/** Předměty, které dává pickup.item a nejsou zbraní ani municí balíku. */
export const PICKUP_ITEMS = ['health', 'armor'];

const MODE = (doc) =>
  obj(
    {
      kind: R(en(WEAPON_MODES, 'paprsek, střela s letem, nebo úder na dosah')),
      cooldown: R(num('nejkratší čas mezi výstřely, s', { min: 0.01, max: 60 })),
      cost: ramp('munice na výstřel; výchozí 1, má-li zbraň munici', { min: 0, max: 1000 }),
      pellets: int('počet broků; výchozí 1', { min: 1, max: 64 }),
      spread: num('rozptyl, polovina vrcholového úhlu kužele ve stupních', { min: 0, max: 45 }),
      damage: R(ramp('poškození jednoho zásahu', { min: 0, max: 100000 })),
      range: num('dosah paprsku nebo úderu, m (hitscan, melee)', { min: 0.1, max: 2000 }),
      push: ramp('rychlost, kterou zásah udělí lehkému tělesu, m/s (PUSH_MASS)', { min: 0, max: 200 }),
      projectile: obj(
        {
          speed: R(ramp('počáteční rychlost, m/s', { min: 0.1, max: 2000 })),
          accel: num('zrychlení po dráze letu, m/s²', { min: 0, max: 1000 }),
          gravity: num('násobek tíže; 0 = letí rovně', { min: 0, max: 10 }),
          life: R(num('doba letu, potom zanikne nebo vybuchne, s', { min: 0.05, max: 60 })),
          radius: num('poloměr koule střely pro zásah, m', { min: 0, max: 2 }),
          bounce: num('odrazivost od světa 0–1; bez ní se střela při dopadu zastaví', { min: 0, max: 1 }),
          fuse: num('rozbuška: výbuch po tolika s od výstřelu', { min: 0.01, max: 60 }),
        },
        'střela (kind projectile)',
      ),
      splash: obj(
        {
          radius: R(ramp('poloměr, m', { min: 0.05, max: 100 })),
          damage: R(ramp('poškození ve středu; k okraji lineárně k nule', { min: 0, max: 100000 })),
          push: ramp('odhození ve středu, m/s', { min: 0, max: 200 }),
        },
        'výbuch nebo šplouchnutí v místě dopadu',
      ),
      charge: obj(
        {
          time: R(num('doba do plného nabití, s', { min: 0.05, max: 30 })),
          release: num('samovolné vystřelení po tolika s držení', { min: 0.05, max: 60 }),
        },
        'nabíjení podržením tlačítka; hodnoty { min, max } se berou podle nabití 0–1',
      ),
      recoil: num('zákluz obrazu zbraně 0–1', { min: 0, max: 1 }),
      noise: num('poloměr, na který výstřel slyší nepřátelé, m', { min: 0, max: 500 }),
      sounds: map(str('id zvukové události'), 'fire, charged, empty → zvuková událost (Z-2)'),
    },
    doc,
  );

/** Druhy souborů ammo a weapon; head a source dodá formats.js (společná hlavička a původ). */
export function weaponFormats({ head, source }) {
  return {
    ammo: obj(
      {
        ...head('ammo'),
        ammo: R(
          map(
            obj({ title: R(str('název česky')), max: R(int('nejvíc, co hráč unese', { min: 1, max: 100000 })) }),
            'id munice → druh',
          ),
        ),
      },
      'druhy munice (zkušební, N-201)',
    ),

    weapon: obj(
      {
        ...head('weapon'),
        id: R(id('id zbraně, tvar <co>_<varianta>_<nn>')),
        title: R(str('název česky')),
        slot: R(int('klávesa 0–9; víc zbraní ve slotu se střídá podle order', { min: 0, max: 9 })),
        order: int('pořadí ve slotu; výchozí 0', { min: 0, max: 99 }),
        ammo: ref('ammo', 'munice; bez ní zbraň munici nepotřebuje'),
        view: R(
          obj(
            {
              prefab: R(ref('prefab', 'model v ruce')),
              pos: R(vec3('poloha vůči kameře, m (x vpravo, y nahoru, −z dopředu)')),
              rot: vec3('natočení ve stupních, YXZ'),
              muzzle: R(vec3('ústí v prostoru prefabu')),
            },
            'zbraň v ruce',
          ),
        ),
        zoom: obj({ fov: R(num('vodorovné zorné pole při přiblížení, stupně', { min: 5, max: 120 })) }, 'přiblížení'),
        primary: R(MODE('hlavní tlačítko')),
        alt: MODE('druhé tlačítko'),
        source: R(source),
      },
      'zbraň (zkušební, N-201)',
    ),
  };
}
