// xWorld: co entita dělá se vstupem, s „použít“ a s pohybem svého kloubu. Druh chování určuje interakce prefabu
// (components.interact.kind) nebo jeho součásti (light, pickup); jména vstupů a výstupů jsou vždy ta, která má
// prefab zapsaná v inputs a outputs (tabulka v docs/02_KONTRAKTY.md je doporučení, data mají poslední slovo).
// Žádná entita levelu tu není jmenovitě: nové dveře nebo nová páka jsou jen soubor prefabu.
//
// Víc interakcí v prefabu (N-010, D-052): entita má seznam záznamů ent.ixs = [{ id, def, kind, joint, state }]
// (kartotéka: čtyři zásuvky). Stav (zamčeno, zapnuto, fáze tlačítka, hlášená poloha) má každá interakce vlastní;
// u jediné interakce je její stav totéž co ent.state. Výstup nese id interakce, ze které přišel (spojení `from`),
// vstup jde do interakce `to`, bez něj do všech interakcí cíle.

import { rigMatrices, mat4Mul, mat4Point, interactionOf } from '../xspace/index.js';
import { ARRIVED, SETTLED, MOVED } from './joints.js';

const EPS = 1e-6;
const VALVE_USE_STEP = 0.25; // „použít“ u ventilu: o čtvrtinu rozsahu dál (pro hráče bez tažení myší)
const CHANGED_QUANTUM = 0.01; // výstup changed se hlásí po 1 % rozsahu, ne v každém kroku

export function createBehaviors({ entities, io, world = null }) {
  const outs = new WeakMap(); // entita → Set výstupů z dat
  const ins = new WeakMap();
  const has = (map, ent, key, name) => {
    let set = map.get(ent);
    if (!set) map.set(ent, (set = new Set(ent.prefab[key] || [])));
    return set.has(name);
  };
  /** Výstup jde ven jen tehdy, když ho prefab deklaruje; rec = interakce, ze které přišel (spojení `from`). */
  function out(ent, name, value, rec = null) {
    if (!has(outs, ent, 'outputs', name)) return;
    const from = rec ? rec.id : ent.ixs.length === 1 ? ent.ixs[0].id : null; // výstup celé entity = její jediná interakce
    io.fire('entity', ent.index, name, value, from);
  }
  const accepts = (ent, name) => has(ins, ent, 'inputs', name);
  /** Jediná interakce entity (u seznamu null: hráč a spojení vybírají konkrétní). */
  const single = (ent) => (ent.ixs.length === 1 ? ent.ixs[0] : null);
  /** Kloub jediné interakce (kompatibilita: manipulace, střed entity, testy). */
  const mainJoint = (ent) => single(ent)?.joint || null;
  const at = (v, goal) => Math.abs(v - goal) < EPS;

  /** Kam míří kloub: cíl pohonu, jinak současná hodnota. */
  const heading = (j) => (Number.isNaN(j.target) ? j.value : j.target);
  /**
   * Dveře na obě strany: kloub má klidovou polohu uvnitř rozsahu (min < rest < max). Otevřená poloha je pak
   * doraz na té straně, kam se křídlo vzdaluje od toho, kdo otvírá (návrh N-109). Jednostranný kloub má
   * otevřenou polohu vždy v max.
   */
  const twoSided = (j) => j.def.min < j.rest - EPS && j.rest < j.def.max - EPS;
  const reach = (j) => Math.max(j.def.max - j.rest, j.rest - j.def.min);
  /** Dveře jsou (nebo budou) spíš otevřené než zavřené. */
  const openish = (j) => (twoSided(j) ? Math.abs(heading(j) - j.rest) > reach(j) / 2 : heading(j) > (j.def.min + j.def.max) / 2);
  const probe = [0, 0, 0];
  /** Vzdálenost (v půdorysu, na druhou) středu dílu kloubu od bodu p, kdyby kloub stál v hodnotě v. */
  function leafGap(ent, j, v, p) {
    const c = (ent.prefab.colliders || []).find((k) => k.node === j.def.node && k.min) || (ent.prefab.parts || []).find((k) => k.node === j.def.node && k.min);
    if (!c) return 0;
    probe[0] = (c.min[0] + c.max[0]) / 2;
    probe[1] = (c.min[1] + c.max[1]) / 2;
    probe[2] = (c.min[2] + c.max[2]) / 2;
    const w = mat4Point(mat4Mul(ent.em, rigMatrices(ent.prefab, { ...ent.values, [j.def.id]: v })[j.def.node]), probe);
    return (w[0] - p[0]) ** 2 + (w[2] - p[2]) ** 2;
  }
  /** Kam se dveře otvírají: jednostranné do max; oboustranné od toho, kdo otvírá (rozhoduje poloha hráče). */
  function openTarget(ent, j) {
    if (!twoSided(j)) return j.def.max;
    const h = heading(j);
    if (!at(h, j.rest)) return h > j.rest ? j.def.max : j.def.min; // už jsou na jedné straně: zůstanou na ní
    const a = world?.actor;
    if (!a || !a.active) return j.def.max;
    const p = [(a.min[0] + a.max[0]) / 2, 0, (a.min[2] + a.max[2]) / 2];
    const step = reach(j) * 0.5;
    return leafGap(ent, j, j.rest + step, p) >= leafGap(ent, j, j.rest - step, p) ? j.def.max : j.def.min;
  }
  /** Dvoupolohový kloub (vypínač, páka): dolní a horní poloha. */
  const low = (j) => (j.def.detents?.length ? Math.min(...j.def.detents) : j.def.min);
  const high = (j) => (j.def.detents?.length ? Math.max(...j.def.detents) : j.def.max);

  function setLamp(ent, on, level) {
    const was = ent.state.on;
    entities.setLamp(ent, on, level);
    if (ent.state.on !== was) out(ent, ent.state.on ? 'on' : 'off', undefined, single(ent));
  }

  /**
   * Pohon k cíli. Kloub, který už v cíli stojí, se nerozjíždí a nic znovu neohlásí: open na otevřené dveře nevyšle
   * druhé opened (dvě křídla spojená do kruhu opened → open by se jinak budila navzájem donekonečna).
   */
  const go = (ent, j, target) => {
    if (at(j.value, target) && Number.isNaN(j.target) && !j.held) return;
    entities.drive(ent, j, target);
  };

  /** Vstupy podle druhu. Vrací true, když se vstup zpracoval. */
  const INPUTS = {
    door(ent, rec, j, name) {
      if (name === 'open') go(ent, j, openTarget(ent, j));
      else if (name === 'close') go(ent, j, j.rest);
      else if (name === 'toggle') go(ent, j, openish(j) ? j.rest : openTarget(ent, j));
      else return false;
      return true;
    },
    drawer: (ent, rec, j, name) => INPUTS.door(ent, rec, j, name),
    button(ent, rec, j, name) {
      if (name !== 'press') return false;
      if (rec.state.phase === 0) {
        rec.state.phase = 1; // 1 = stlačuje se, 2 = vrací se
        entities.drive(ent, j, j.def.max);
      }
      return true;
    },
    switch(ent, rec, j, name) {
      if (name === 'turnOn') go(ent, j, high(j));
      else if (name === 'turnOff') go(ent, j, low(j));
      else if (name === 'toggle') go(ent, j, heading(j) > (low(j) + high(j)) / 2 ? low(j) : high(j));
      else return false;
      return true;
    },
    lever: (ent, rec, j, name) => INPUTS.switch(ent, rec, j, name),
    valve(ent, rec, j, name, param) {
      if (name !== 'setLevel') return false;
      const v = Math.min(1, Math.max(0, Number(param) || 0));
      go(ent, j, j.def.min + v * (j.def.max - j.def.min));
      return true;
    },
  };

  const api = {
    /** Výstup entity vyvolaný vyšší vrstvou (terminál: command, left). Projde jen výstup, který prefab deklaruje. */
    emit: out,
    /** Kam jde vstup print: obrazovky patří vrstvě nad světem, ta si sem dosadí svou funkci (ent, text). */
    onPrint: null,
    /** Kdo dostane sebranou věc (ent, components.pickup): výbava hráče patří vrstvě xPlay. */
    onPickup: null,
    /**
     * Vstup entity (ze spojení nebo z „použít“). to = id interakce cíle (spojení `to`); bez něj jde vstup do všech
     * interakcí entity (zamknout celou kartotéku). Vrací false, když ho entita nezná.
     */
    input(ent, name, param, to = null) {
      if (!accepts(ent, name)) return false;
      const recs = to ? [ent.ixById.get(to)].filter(Boolean) : ent.ixs;
      if (name === 'lock' || name === 'unlock') {
        const locked = name === 'lock';
        // entita bez interakce (lampa) má zámek v ent.state; jediná interakce ho sdílí s entitou
        for (const r of ent.ixs.length ? recs : [{ state: ent.state, id: null }]) {
          if (r.state.locked === locked) continue;
          r.state.locked = locked;
          out(ent, locked ? 'locked' : 'unlocked', undefined, r.id ? r : null);
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
      if (ent.comp.light && !ent.ixs.length) {
        if (name === 'turnOn') setLamp(ent, true);
        else if (name === 'turnOff') setLamp(ent, false);
        else if (name === 'toggle') setLamp(ent, !ent.state.on);
        else if (name === 'setLevel') setLamp(ent, ent.state.on, Number(param) || 0);
        else return false;
        return true;
      }
      for (const r of recs) {
        const fn = INPUTS[r.kind];
        if (fn && r.joint) fn(ent, r, r.joint, name, param);
      }
      return true; // vstup prefab deklaruje (u druhu bez kloubu, reset, break tahle vlna nic neprovádí)
    },

    /** Hráč použil interakci rec (vybranou přes interactionOf; bez ní jedinou). Vrací 'ok' | 'locked' | 'none'. */
    use(ent, rec = single(ent)) {
      if (!rec || !ent.state.enabled) return 'none';
      if (rec.state.locked) return 'locked';
      const j = rec.joint;
      const id = rec.id;
      switch (rec.kind) {
        case 'button':
          return api.input(ent, 'press', undefined, id) ? 'ok' : 'none';
        case 'door':
        case 'drawer':
          return j && api.input(ent, accepts(ent, 'toggle') ? 'toggle' : openish(j) ? 'close' : 'open', undefined, id) ? 'ok' : 'none';
        case 'switch':
        case 'lever':
          return api.input(ent, 'toggle', undefined, id) ? 'ok' : 'none';
        case 'valve': {
          if (!j) return 'none';
          const next = Math.round(j.norm / VALVE_USE_STEP) * VALVE_USE_STEP + VALVE_USE_STEP;
          return api.input(ent, 'setLevel', next > 1 + EPS ? 0 : next, id) ? 'ok' : 'none';
        }
        case 'pickup':
          api.onPickup?.(ent, ent.comp.pickup || {}); // zbraň, munice (src/play/weapons.js, A3.1)
          out(ent, 'picked', ent.comp.pickup?.amount, rec);
          entities.setEnabled(ent, false);
          return 'ok';
        case 'terminal':
        case 'station':
          out(ent, 'used', undefined, rec);
          return 'ok';
        default:
          return 'none';
      }
    },

    /** Kloub se pohnul, dojel k cíli, nebo se ustálil (bity z joints.js). */
    onJoint(ent, j, bits) {
      const rec = ent.ixs.find((r) => r.joint === j);
      if (!rec) return;
      const d = j.def;
      const st = rec.state;
      switch (rec.kind) {
        case 'door':
        case 'drawer':
          if (bits & (ARRIVED | SETTLED)) {
            if (at(j.value, d.max) || (twoSided(j) && at(j.value, d.min))) out(ent, 'opened', undefined, rec);
            else if (at(j.value, j.rest)) out(ent, 'closed', undefined, rec);
          }
          break;
        case 'button':
          if (bits & ARRIVED && st.phase === 1) {
            st.phase = 2;
            out(ent, 'pressed', undefined, rec);
            if (!(d.spring > 0)) entities.drive(ent, j, j.rest); // tlačítko bez pružiny vrací pohon
          } else if (bits & (SETTLED | ARRIVED) && st.phase === 2 && at(j.value, j.rest)) {
            st.phase = 0;
            out(ent, 'released', undefined, rec);
          }
          break;
        case 'switch':
        case 'lever':
          if (bits & MOVED && rec.kind === 'lever') api.changed(ent, j, !!(bits & (ARRIVED | SETTLED)), rec);
          if (bits & (ARRIVED | SETTLED)) {
            const on = at(j.value, high(j));
            const off = at(j.value, low(j));
            if ((on || off) && st.on !== on) {
              st.on = on;
              out(ent, on ? 'on' : 'off', undefined, rec);
            }
          }
          break;
        case 'valve':
          if (bits & (MOVED | ARRIVED | SETTLED)) api.changed(ent, j, !!(bits & (ARRIVED | SETTLED)), rec);
          if (bits & (ARRIVED | SETTLED)) {
            if (at(j.value, d.max)) out(ent, 'opened', undefined, rec);
            else if (at(j.value, d.min)) out(ent, 'closed', undefined, rec);
          }
          break;
        default:
          break;
      }
    },

    /** Výstup changed s hodnotou 0–1; hlásí se po kvantech, v krajních polohách a na konci pohybu (force). */
    changed(ent, j, force = false, rec = ent.ixs.find((r) => r.joint === j)) {
      if (!rec) return;
      const n = j.norm;
      const last = rec.state.rep;
      if (n === last) return;
      const edge = n <= EPS || n >= 1 - EPS;
      if (!force && !edge && Math.abs(n - last) < CHANGED_QUANTUM) return;
      rec.state.rep = n;
      out(ent, 'changed', n, rec);
    },

    /** Výchozí stav podle druhu (volá entities při nové hře): dvoupolohový kloub v horní poloze = zapnuto. */
    init(ent) {
      for (const rec of ent.ixs) {
        const j = rec.joint;
        if (!j) continue;
        rec.state.rep = j.norm;
        if (rec.kind === 'switch' || rec.kind === 'lever') rec.state.on = at(j.rest, high(j)) && high(j) !== low(j);
      }
    },

    /** Text nápovědy pro interakci pod zaměřovačem (bez klávesy; tu doplní HUD). */
    prompt(ent, rec = ent ? single(ent) : null) {
      if (!rec || !ent.state.enabled) return '';
      if (rec.state.locked) return 'Zamčeno';
      return rec.def.prompt || ent.prefab.title || '';
    },
    mainJoint,
    /** Interakce, kterou hráč ovládá přes uzel nodeId (interactionOf ze základu), nebo null. */
    interactionAt(ent, nodeId) {
      const def = interactionOf(ent.prefab, nodeId);
      return def ? ent.ixById.get(def.id) || null : null;
    },
  };
  return api;
}
