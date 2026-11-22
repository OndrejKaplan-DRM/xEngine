// xPlay: interakce hráče se světem. Tři úrovně, všechny řízené daty prefabu (docs/01_ARCHITEKTURA.md, oddíl 5):
// 1. použít (paprsek z oka + klávesa), 2. manipulovat (držené tlačítko myši hýbe kloubem v jeho mezích),
// 3. klidný režim (kamera se ukotví podle station, kurzor se uvolní). Paprsek jde proti kolizím v Rapieru,
// nikdy proti vykreslovaným sítím.

import { USE_RAY } from '../phys/phys.js';
import { keyLabel } from './actions.js';

const SCAN_EVERY = 4; // kroky mezi dotazy paprskem na to, co je pod zaměřovačem (30× za sekundu)
const MAX_RANGE = 6; // m; horní mez dosahu z formátu (interact.range)
const DEFAULT_RANGE = 1.6;

export function createInteract({ phys, player, input, behave }) {
  let E = null;
  let target = null; // entita pod zaměřovačem v dosahu
  let prompt = '';
  let tick = 0;
  const eye = [0, 0, 0];
  const dir = [0, 0, -1];
  const stat = { uses: 0, scans: 0 };
  const useKey = keyLabel('use');

  function scan() {
    stat.scans++;
    player.eye(eye, dir);
    const h = phys.raycast(eye[0], eye[1], eye[2], dir[0], dir[1], dir[2], MAX_RANGE, USE_RAY, player.collider);
    const ent = h && h.ref && h.ref.kind === 'entity' ? h.ref.ent : null;
    let ok = false;
    if (ent && ent.interact && ent.state.enabled) {
      // Dosah se měří od těla (osa postavy od nohou po oči), ne od očí: předmět na podlaze je od očí 1,6 m,
      // i když u něj hráč stojí. Kontrakt říká jen „dosah v metrech“ (návrh N-104).
      const px = eye[0] + dir[0] * h.dist;
      const py = eye[1] + dir[1] * h.dist;
      const pz = eye[2] + dir[2] * h.dist;
      const feet = player.pos[1];
      const dy = py > eye[1] ? py - eye[1] : py < feet ? feet - py : 0;
      ok = Math.hypot(px - eye[0], dy, pz - eye[2]) <= (ent.interact.range ?? DEFAULT_RANGE);
    }
    setTarget(ok ? ent : null);
  }
  function setTarget(ent) {
    target = ent;
    const text = ent ? behave.prompt(ent) : '';
    prompt = text ? (ent.state.locked ? text : `[${useKey}] ${text}`) : '';
  }

  const sys = {
    name: 'interact',
    phase: 'sim',
    after: ['player'],
    events: ['interact:used', 'interact:denied'],
    stat,
    get target() {
      return target;
    },
    /** Nápověda pro HUD; prázdný text = nic pod zaměřovačem. */
    get prompt() {
      return prompt;
    },
    init(engine) {
      E = engine;
    },
    reset() {
      target = null;
      prompt = '';
      tick = 0;
      stat.uses = stat.scans = 0;
    },

    step() {
      const I = input.intent;
      if (player.frozen) return;
      if (I.use || ++tick % SCAN_EVERY === 0) scan();
      if (I.use && target) {
        const r = behave.use(target);
        if (r === 'ok') {
          stat.uses++;
          E.emit('interact:used', target.id);
        } else if (r === 'locked') E.emit('interact:denied', target.id);
        setTarget(target); // stav se mohl změnit (zamčeno, sebráno)
      }
    },

    snapshot: () => ({}),
    restore() {
      target = null;
      prompt = '';
    },
    inspect(path) {
      if (path[0] === 'target') return target ? target.id : null;
      if (path[0] === 'prompt') return prompt;
      if (path[0] === 'stat') return { ...stat };
      return undefined;
    },
  };
  return sys;
}
