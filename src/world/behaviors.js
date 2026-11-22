// xWorld: co entita dělá se vstupem, s „použít“ a s pohybem svého kloubu. Druh chování určuje interakce prefabu
// (components.interact.kind) nebo jeho součásti (light, pickup); jména vstupů a výstupů jsou vždy ta, která má
// prefab zapsaná v inputs a outputs (tabulka v docs/02_KONTRAKTY.md je doporučení, data mají poslední slovo).
// Žádná entita levelu tu není jmenovitě: nové dveře nebo nová páka jsou jen soubor prefabu.

import { ARRIVED, SETTLED, MOVED } from './joints.js';

const EPS = 1e-6;
const VALVE_USE_STEP = 0.25; // „použít“ u ventilu: o čtvrtinu rozsahu dál (pro hráče bez tažení myší)
const CHANGED_QUANTUM = 0.01; // výstup changed se hlásí po 1 % rozsahu, ne v každém kroku

export function createBehaviors({ entities, io }) {
  const outs = new WeakMap(); // entita → Set výstupů z dat
  const ins = new WeakMap();
  const has = (map, ent, key, name) => {
    let set = map.get(ent);
    if (!set) map.set(ent, (set = new Set(ent.prefab[key] || [])));
    return set.has(name);
  };
  /** Výstup jde ven jen tehdy, když ho prefab deklaruje. */
  function out(ent, name, value) {
    if (has(outs, ent, 'outputs', name)) io.fire('entity', ent.index, name, value);
  }
  const accepts = (ent, name) => has(ins, ent, 'inputs', name);
  const mainJoint = (ent) => (ent.interact?.joint ? ent.jointById[ent.interact.joint] : ent.joints[0]) || null;
  const at = (v, goal) => Math.abs(v - goal) < EPS;

  /** Kam míří kloub: cíl pohonu, jinak současná hodnota. */
  const heading = (j) => (Number.isNaN(j.target) ? j.value : j.target);
  /** Dvoupolohový kloub (vypínač, páka): dolní a horní poloha. */
  const low = (j) => (j.def.detents?.length ? Math.min(...j.def.detents) : j.def.min);
  const high = (j) => (j.def.detents?.length ? Math.max(...j.def.detents) : j.def.max);

  function setLamp(ent, on, level) {
    const was = ent.state.on;
    entities.setLamp(ent, on, level);
    if (ent.state.on !== was) out(ent, ent.state.on ? 'on' : 'off');
  }

  /** Vstupy podle druhu. Vrací true, když se vstup zpracoval. */
  const INPUTS = {
    door(ent, j, name) {
      if (name === 'open') entities.drive(ent, j, j.def.max);
      else if (name === 'close') entities.drive(ent, j, j.rest);
      else if (name === 'toggle') entities.drive(ent, j, heading(j) > (j.def.min + j.def.max) / 2 ? j.rest : j.def.max);
      else return false;
      return true;
    },
    drawer: (ent, j, name) => INPUTS.door(ent, j, name),
    button(ent, j, name) {
      if (name !== 'press') return false;
      if (ent.state.phase === 0) {
        ent.state.phase = 1; // 1 = stlačuje se, 2 = vrací se
        entities.drive(ent, j, j.def.max);
      }
      return true;
    },
    switch(ent, j, name) {
      if (name === 'turnOn') entities.drive(ent, j, high(j));
      else if (name === 'turnOff') entities.drive(ent, j, low(j));
      else if (name === 'toggle') entities.drive(ent, j, heading(j) > (low(j) + high(j)) / 2 ? low(j) : high(j));
      else return false;
      return true;
    },
    lever: (ent, j, name) => INPUTS.switch(ent, j, name),
    valve(ent, j, name, param) {
      if (name !== 'setLevel') return false;
      const v = Math.min(1, Math.max(0, Number(param) || 0));
      entities.drive(ent, j, j.def.min + v * (j.def.max - j.def.min));
      return true;
    },
  };

  const api = {
    /** Výstup entity vyvolaný vyšší vrstvou (terminál: command, left). Projde jen výstup, který prefab deklaruje. */
    emit: out,
    /** Kam jde vstup print: obrazovky patří vrstvě nad světem, ta si sem dosadí svou funkci (ent, text). */
    onPrint: null,
    /** Vstup entity (ze spojení nebo z „použít“). Vrací false, když ho entita nezná. */
    input(ent, name, param) {
      if (!accepts(ent, name)) return false;
      if (name === 'lock' || name === 'unlock') {
        const locked = name === 'lock';
        if (ent.state.locked !== locked) {
          ent.state.locked = locked;
          out(ent, locked ? 'locked' : 'unlocked');
        }
        return true;
      }
      if (name === 'enable' || name === 'disable') {
        entities.setEnabled(ent, name === 'enable');
        return true;
      }
      if (name === 'print') {
        api.onPrint?.(ent, String(param ?? ''));
        return true;
      }
      if (ent.comp.light && !ent.kind) {
        if (name === 'turnOn') setLamp(ent, true);
        else if (name === 'turnOff') setLamp(ent, false);
        else if (name === 'toggle') setLamp(ent, !ent.state.on);
        else if (name === 'setLevel') setLamp(ent, ent.state.on, Number(param) || 0);
        else return false;
        return true;
      }
      const j = mainJoint(ent);
      const fn = INPUTS[ent.kind];
      if (fn && j) return fn(ent, j, name, param);
      return true; // vstup prefab deklaruje, ale tahle vlna ho neprovádí (reset, break)
    },

    /** Hráč entitu použil klávesou. Vrací 'ok' | 'locked' | 'none'. */
    use(ent) {
      if (!ent.interact || !ent.state.enabled) return 'none';
      if (ent.state.locked) return 'locked';
      const j = mainJoint(ent);
      switch (ent.kind) {
        case 'button':
          return api.input(ent, 'press') ? 'ok' : 'none';
        case 'door':
        case 'drawer':
          return api.input(ent, accepts(ent, 'toggle') ? 'toggle' : heading(j) > (j.def.min + j.def.max) / 2 ? 'close' : 'open') ? 'ok' : 'none';
        case 'switch':
        case 'lever':
          return api.input(ent, 'toggle') ? 'ok' : 'none';
        case 'valve': {
          const next = Math.round(j.norm / VALVE_USE_STEP) * VALVE_USE_STEP + VALVE_USE_STEP;
          return api.input(ent, 'setLevel', next > 1 + EPS ? 0 : next) ? 'ok' : 'none';
        }
        case 'pickup':
          out(ent, 'picked', ent.comp.pickup?.amount);
          entities.setEnabled(ent, false);
          return 'ok';
        case 'terminal':
        case 'station':
          out(ent, 'used');
          return 'ok';
        default:
          return 'none';
      }
    },

    /** Kloub se pohnul, dojel k cíli, nebo se ustálil (bity z joints.js). */
    onJoint(ent, j, bits) {
      if (j !== mainJoint(ent)) return;
      const d = j.def;
      switch (ent.kind) {
        case 'door':
        case 'drawer':
          if (bits & (ARRIVED | SETTLED)) {
            if (at(j.value, d.max)) out(ent, 'opened');
            else if (at(j.value, j.rest)) out(ent, 'closed');
          }
          break;
        case 'button':
          if (bits & ARRIVED && ent.state.phase === 1) {
            ent.state.phase = 2;
            out(ent, 'pressed');
            if (!(d.spring > 0)) entities.drive(ent, j, j.rest); // tlačítko bez pružiny vrací pohon
          } else if (bits & (SETTLED | ARRIVED) && ent.state.phase === 2 && at(j.value, j.rest)) {
            ent.state.phase = 0;
            out(ent, 'released');
          }
          break;
        case 'switch':
        case 'lever':
          if (bits & MOVED && ent.kind === 'lever') api.changed(ent, j, !!(bits & (ARRIVED | SETTLED)));
          if (bits & (ARRIVED | SETTLED)) {
            const on = at(j.value, high(j));
            const off = at(j.value, low(j));
            if ((on || off) && ent.state.on !== on) {
              ent.state.on = on;
              out(ent, on ? 'on' : 'off');
            }
          }
          break;
        case 'valve':
          if (bits & (MOVED | ARRIVED | SETTLED)) api.changed(ent, j, !!(bits & (ARRIVED | SETTLED)));
          if (bits & (ARRIVED | SETTLED)) {
            if (at(j.value, d.max)) out(ent, 'opened');
            else if (at(j.value, d.min)) out(ent, 'closed');
          }
          break;
        default:
          break;
      }
    },

    /** Výstup changed s hodnotou 0–1; hlásí se po kvantech, v krajních polohách a na konci pohybu (force). */
    changed(ent, j, force = false) {
      const n = j.norm;
      const last = ent.state.rep;
      if (n === last) return;
      const edge = n <= EPS || n >= 1 - EPS;
      if (!force && !edge && Math.abs(n - last) < CHANGED_QUANTUM) return;
      ent.state.rep = n;
      out(ent, 'changed', n);
    },

    /** Výchozí stav podle druhu (volá entities při nové hře): dvoupolohový kloub v horní poloze = zapnuto. */
    init(ent) {
      const j = mainJoint(ent);
      if (!j) return;
      ent.state.rep = j.norm;
      if (ent.kind === 'switch' || ent.kind === 'lever') ent.state.on = at(j.rest, high(j)) && high(j) !== low(j);
    },

    /** Text nápovědy pro entitu pod zaměřovačem (bez klávesy; tu doplní HUD). */
    prompt(ent) {
      if (!ent?.interact || !ent.state.enabled) return '';
      if (ent.state.locked) return 'Zamčeno';
      return ent.interact.prompt || ent.prefab.title || '';
    },
    mainJoint,
  };
  return api;
}
