// xPlay: herní akce a jejich výchozí klávesy. Vážou se na event.code (fyzická klávesa), tlačítka myši jako Mouse0–2.
// Jediné místo, kde jsou klávesy zapsané; nápověda v HUD i testy čtou odsud.

export const ACTIONS = [
  { id: 'fwd', label: 'Vpřed', keys: ['KeyW', 'ArrowUp'] },
  { id: 'back', label: 'Vzad', keys: ['KeyS', 'ArrowDown'] },
  { id: 'left', label: 'Vlevo', keys: ['KeyA', 'ArrowLeft'] },
  { id: 'right', label: 'Vpravo', keys: ['KeyD', 'ArrowRight'] },
  { id: 'jump', label: 'Skok', keys: ['Space', 'Mouse2'] },
  { id: 'use', label: 'Použít', keys: ['KeyE', 'Enter'] },
  // levé tlačítko: uchopí ovladač pod zaměřovačem (páka, ventil, zásuvka), jinak střílí ze zbraně v ruce (A3.1)
  { id: 'grab', label: 'Střelba, uchopit a hýbat', keys: ['Mouse0'] },
  { id: 'alt', label: 'Druhá střelba (nabíjení)', keys: ['KeyF', 'Mouse1'] },
  { id: 'zoom', label: 'Přiblížení', keys: ['KeyZ'] },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => ({ id: `slot${n}`, label: `Zbraň ${n}`, keys: [`Digit${n}`] })),
];

/** Akce slotů zbraní v pořadí kláves 0–9 (index = číslo slotu). */
export const SLOT_ACTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `slot${n}`);

export const ACTION_IDS = ACTIONS.map((a) => a.id);

/** Tabulka kód klávesy → index akce. */
export function keyMap() {
  const map = new Map();
  ACTIONS.forEach((a, i) => {
    for (const k of a.keys) map.set(k, i);
  });
  return map;
}

/** Klávesy, kterým hra při hraní bere výchozí chování prohlížeče (02_SHELL, oddíl 3). */
export const PREVENT_DEFAULT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);

/** Krátký popisek první klávesy akce pro nápovědu („E“, „mezerník“). */
export function keyLabel(actionId) {
  const a = ACTIONS.find((x) => x.id === actionId);
  const code = a?.keys[0] || '';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return { Space: 'mezerník', Enter: 'Enter', Mouse0: 'levé tlačítko', Mouse1: 'prostřední tlačítko', Mouse2: 'pravé tlačítko' }[code] || code;
}
