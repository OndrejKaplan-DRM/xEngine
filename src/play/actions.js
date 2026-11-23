// xPlay: herní akce a jejich výchozí klávesy. Vážou se na event.code (fyzická klávesa), tlačítka myši jako Mouse0–2.
// Jediné místo, kde jsou klávesy zapsané; nápověda v HUD i testy čtou odsud.

export const ACTIONS = [
  { id: 'fwd', label: 'Vpřed', keys: ['KeyW', 'ArrowUp'] },
  { id: 'back', label: 'Vzad', keys: ['KeyS', 'ArrowDown'] },
  { id: 'left', label: 'Vlevo', keys: ['KeyA', 'ArrowLeft'] },
  { id: 'right', label: 'Vpravo', keys: ['KeyD', 'ArrowRight'] },
  { id: 'jump', label: 'Skok', keys: ['Space', 'Mouse2'] },
  { id: 'use', label: 'Použít', keys: ['KeyE', 'Enter'] },
  { id: 'grab', label: 'Uchopit a hýbat', keys: ['Mouse0'] },
];

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
  return { Space: 'mezerník', Enter: 'Enter', Mouse0: 'levé tlačítko', Mouse2: 'pravé tlačítko' }[code] || code;
}
