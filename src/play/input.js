// xPlay: vstup. Převádí klávesy a myš na záměr (intent); hráč, testovací robot i budoucí záznam jsou jen různí
// „řidiči“ téhož záměru (01_CORE, zásada 5). Systém nezná DOM: posluchače připojuje aplikace (src/app/main.js).

import { ACTIONS, keyMap, SLOT_ACTIONS } from './actions.js';

/** Stupně otočení na jeden bod pohybu myši při citlivosti 1. Posun myši se nenásobí dt (10_CASE_FPS, F4). */
export const LOOK_DEG_PER_PX = 0.08;

export function createInput() {
  const keys = keyMap();
  const n = ACTIONS.length;
  const index = Object.fromEntries(ACTIONS.map((a, i) => [a.id, i]));
  const held = new Uint8Array(n); // z klávesnice a myši
  const forced = new Uint8Array(n); // z testu nebo robota (sim s parametrem hold)
  // Stisk, který ještě neviděl žádný krok. Kroky běží v dávkách po snímcích: krátké ťuknutí (stisk i puštění
  // mezi dvěma snímky, při 30 snímcích/s stačí 30 ms) by jinak zmizelo dřív, než ho krok přečte.
  const latched = new Uint8Array(n);
  const prev = new Uint8Array(n);
  let lookX = 0;
  let lookY = 0;
  let turnYaw = 0;
  let turnPitch = 0;
  let pulseUse = false;

  /** Záměr pro právě běžící krok. Jeden objekt, přepisuje se; nikdo si ho nesmí schovávat. */
  // yaw, pitch: o kolik stupňů se má pohled otočit; mx, my: surový pohyb myši v bodech (manipulace s klouby)
  // alt: druhé tlačítko zbraně držené; zoomPressed: stisk přiblížení v tomto kroku; slot: stisknutý slot zbraně 0–9, nebo −1
  const intent = { fwd: 0, side: 0, jump: false, jumpPressed: false, use: false, grab: false, grabPressed: false, alt: false, zoom: false, zoomPressed: false, slot: -1, yaw: 0, pitch: 0, mx: 0, my: 0 };
  const slotIdx = SLOT_ACTIONS.map((id) => index[id]);

  const on = (id) => held[index[id]] | forced[index[id]] | latched[index[id]];

  const sys = {
    name: 'input',
    phase: 'input',
    sensitivity: 1,
    intent,
    /** false = pohled se nečte (klidný režim u terminálu, kurzor je volný). */
    lookEnabled: true,

    /** Klávesa nebo tlačítko myši podle event.code / 'Mouse0'. Vrací true, když kód patří některé akci. */
    key(code, down) {
      const i = keys.get(code);
      if (i === undefined) return false;
      if (down && !held[i]) latched[i] = 1;
      held[i] = down ? 1 : 0;
      return true;
    },
    /** Pohyb myši v bodech obrazovky od minulého volání. */
    look(dx, dy) {
      lookX += dx;
      lookY += dy;
    },
    /** Otočení pohledu přímo ve stupních (testovací robot; kladný yaw = doleva, kladný pitch = nahoru). */
    turn(dyaw, dpitch = 0) {
      turnYaw += dyaw;
      turnPitch += dpitch;
    },
    /** Jednorázové „použít“ (testy, dotykové tlačítko). */
    use() {
      pulseUse = true;
    },
    /** Trvale držená akce nezávisle na klávesnici (testovací robot). */
    hold(actionId, on) {
      const i = index[actionId];
      if (i === undefined) throw new Error(`Neznámá akce „${actionId}“.`);
      forced[i] = on ? 1 : 0;
    },
    releaseAll() {
      held.fill(0);
      forced.fill(0);
      latched.fill(0);
      prev.fill(0);
      lookX = lookY = 0;
      turnYaw = turnPitch = 0;
      pulseUse = false;
    },

    reset() {
      sys.releaseAll();
    },
    step() {
      intent.fwd = on('fwd') - on('back');
      intent.side = on('right') - on('left');
      const jump = on('jump');
      intent.jumpPressed = !!jump && !prev[index.jump];
      intent.jump = !!jump;
      const use = on('use');
      intent.use = pulseUse || (!!use && !prev[index.use]);
      const grab = on('grab');
      intent.grabPressed = !!grab && !prev[index.grab];
      intent.grab = !!grab;
      intent.alt = !!on('alt');
      const zoom = on('zoom');
      intent.zoomPressed = !!zoom && !prev[index.zoom];
      intent.zoom = !!zoom;
      prev[index.zoom] = zoom;
      intent.slot = -1;
      for (let s = 0; s < 10; s++) {
        const k = slotIdx[s];
        const v = held[k] | forced[k] | latched[k];
        if (v && !prev[k]) intent.slot = s;
        prev[k] = v;
      }
      pulseUse = false;
      prev[index.jump] = jump;
      prev[index.use] = use;
      prev[index.grab] = grab;
      latched.fill(0);
      intent.mx = lookX;
      intent.my = lookY;
      if (sys.lookEnabled) {
        intent.yaw = turnYaw - lookX * LOOK_DEG_PER_PX * sys.sensitivity;
        intent.pitch = turnPitch - lookY * LOOK_DEG_PER_PX * sys.sensitivity;
      } else {
        intent.yaw = 0;
        intent.pitch = 0;
      }
      lookX = lookY = 0;
      turnYaw = turnPitch = 0;
    },
  };
  return sys;
}
