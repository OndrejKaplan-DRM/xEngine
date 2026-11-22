// xKernel: registr systémů, fáze, sběrnice událostí, režimy a smyčka s pevným krokem.
// Nezná DOM, renderer ani fyziku. V prohlížeči ho pouští run(), testy volají tick() a sim().
// Kontrakt: docs/02_KONTRAKTY.md, oddíl 1. Soubor patří základu (měnit jen přes návrh v docs/navrhy).

/** Fáze kroku a snímku. Pořadí je závazné; systém si fázi vybírá, pořadí si nevymýšlí. */
export const PHASES = ['input', 'sim', 'physics', 'late', 'view', 'ui'];

/** Povolené přechody režimů. Jediné místo, kde jsou zapsané. */
export const TRANSITIONS = {
  boot: ['menu'],
  menu: ['playing'],
  playing: ['paused', 'menu', 'over'],
  paused: ['playing', 'menu'],
  over: ['menu', 'playing'],
};

/** Události jádra. Ostatní si deklarují systémy ve vlastnosti `events`. */
export const KERNEL_EVENTS = ['mode', 'reset', 'restored'];

const EPS = 1e-9;
const EVENT_NAME = /^[a-z][a-zA-Z0-9]*(:[a-z][a-zA-Z0-9]*)?$/;

export function createEngine({
  step = 1 / 120,
  maxFrame = 0.1,
  maxStepsBase = 8,
  strictEvents = true,
  now = () => performance.now(),
} = {}) {
  const systems = []; // v pořadí registrace
  const byName = new Map();
  const listeners = new Map();
  const declared = new Map(); // událost → jméno systému, který ji deklaroval
  for (const e of KERNEL_EVENTS) declared.set(e, 'kernel');

  let order = []; // seřazeno podle fází a závislostí
  let stepList = [];
  let frameList = [];
  let sorted = false;

  function checkEvent(event, what) {
    if (!strictEvents || declared.has(event)) return;
    throw new Error(`${what}: událost „${event}“ nikdo nedeklaroval (vlastnost events systému).`);
  }

  /** Stabilní řazení: fáze, uvnitř fáze závislosti `after`, jinak pořadí registrace. */
  function sortSystems() {
    const out = [];
    for (const phase of PHASES) {
      const group = systems.filter((s) => s.phase === phase);
      const pending = new Set(group);
      const done = new Set(out.map((s) => s.name));
      while (pending.size) {
        let moved = false;
        for (const s of group) {
          if (!pending.has(s)) continue;
          const ready = s.after.every((dep) => {
            const optional = dep.startsWith('?');
            const name = optional ? dep.slice(1) : dep;
            const target = byName.get(name);
            if (!target) {
              if (optional) return true;
              throw new Error(`Systém „${s.name}“ čeká na neznámý systém „${name}“.`);
            }
            if (PHASES.indexOf(target.phase) > PHASES.indexOf(s.phase)) {
              throw new Error(`Systém „${s.name}“ (fáze ${s.phase}) nemůže běžet po „${name}“ (fáze ${target.phase}).`);
            }
            return done.has(name);
          });
          if (ready) {
            out.push(s);
            done.add(s.name);
            pending.delete(s);
            moved = true;
            break; // znovu od začátku: vždy první připravený v pořadí registrace
          }
        }
        if (!moved) {
          throw new Error(`Kruhová závislost mezi systémy: ${[...pending].map((s) => s.name).join(', ')}.`);
        }
      }
    }
    order = out;
    stepList = order.filter((s) => typeof s.step === 'function');
    frameList = order.filter((s) => typeof s.frame === 'function');
    sorted = true;
  }

  const E = {
    STEP: step,
    mode: 'boot',
    timeScale: 1,
    steps: 0,
    acc: 0,
    profile: false,
    stats: { stepMs: 0, frameMs: 0, fps: 0, droppedSeconds: 0, boot: {}, sys: {} },

    /**
     * Zaregistruje systém. Povinné: name. Volitelné: phase (výchozí 'sim'), after (jména systémů,
     * po kterých má běžet; '?jméno' = jen pokud existuje), events (události, které systém vysílá).
     */
    add(sys) {
      if (!sys || typeof sys.name !== 'string' || !sys.name) throw new Error('Systém musí mít jméno.');
      if (byName.has(sys.name)) throw new Error(`Systém „${sys.name}“ už je registrován.`);
      if (E.mode !== 'boot') throw new Error(`Systém „${sys.name}“ nelze přidat po startu (režim ${E.mode}).`);
      if (sys.phase === undefined) sys.phase = 'sim';
      if (!PHASES.includes(sys.phase)) throw new Error(`Systém „${sys.name}“ má neznámou fázi „${sys.phase}“.`);
      if (sys.after === undefined) sys.after = [];
      for (const e of sys.events || []) {
        if (!EVENT_NAME.test(e)) throw new Error(`Událost „${e}“ systému „${sys.name}“ nemá tvar oblast:sloveso.`);
        if (declared.has(e)) throw new Error(`Událost „${e}“ už deklaroval „${declared.get(e)}“.`);
        declared.set(e, sys.name);
      }
      systems.push(sys);
      byName.set(sys.name, sys);
      sorted = false;
      return sys;
    },
    get(name) {
      const s = byName.get(name);
      if (!s) throw new Error(`Neznámý systém „${name}“.`);
      return s;
    },
    has(name) {
      return byName.has(name);
    },
    /** Jména systémů v pořadí, v jakém běží. */
    order() {
      if (!sorted) sortSystems();
      return order.map((s) => s.name);
    },
    /** Přehled deklarovaných událostí: [{ event, owner }]. */
    eventList() {
      return [...declared].map(([event, owner]) => ({ event, owner }));
    },

    on(event, fn) {
      checkEvent(event, 'on');
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event).delete(fn);
    },
    emit(event, data) {
      checkEvent(event, 'emit');
      const set = listeners.get(event);
      if (set) for (const fn of set) fn(data);
    },

    async init() {
      if (!sorted) sortSystems();
      for (const s of order) {
        const t0 = now();
        if (s.init) await s.init(E);
        E.stats.boot[s.name] = now() - t0;
      }
      for (const s of order) {
        const t0 = now();
        if (s.build) s.build();
        E.stats.boot[s.name] += now() - t0;
      }
      E.setMode('menu');
    },

    /** Nová hra nebo příprava před nahráním: každý systém vrátí vše, co jeho step mění. */
    reset() {
      if (!sorted) sortSystems();
      E.steps = 0;
      E.acc = 0;
      for (const s of order) if (s.reset) s.reset();
      E.emit('reset');
    },

    setMode(next) {
      if (next === E.mode) return;
      const allowed = TRANSITIONS[E.mode] || [];
      if (!allowed.includes(next)) throw new Error(`Nepovolený přechod režimu ${E.mode} → ${next}.`);
      const prev = E.mode;
      E.mode = next;
      E.emit('mode', { mode: next, prev });
    },

    /** Jeden pevný krok simulace. */
    stepOnce() {
      if (!sorted) sortSystems();
      const t0 = now();
      if (E.profile) {
        for (const s of stepList) {
          const a = now();
          s.step(step);
          const d = now() - a;
          const prev = E.stats.sys[s.name] ?? d;
          E.stats.sys[s.name] = prev + (d - prev) * 0.05;
        }
      } else {
        for (const s of stepList) s.step(step);
      }
      E.steps++;
      E.stats.stepMs += (now() - t0 - E.stats.stepMs) * 0.05;
    },

    /**
     * Jeden snímek: přísun skutečného času se škáluje (timeScale), krok zůstává pevný.
     * Vrací počet provedených kroků.
     */
    tick(realSeconds) {
      if (!sorted) sortSystems();
      const real = Math.min(Math.max(realSeconds, 0), maxFrame);
      let n = 0;
      if (E.mode === 'playing') {
        E.acc += real * E.timeScale;
        const maxSteps = Math.ceil(maxStepsBase * Math.max(1, E.timeScale));
        while (E.acc + EPS >= step && n < maxSteps) {
          E.stepOnce();
          E.acc -= step;
          n++;
        }
        if (E.acc < 0) E.acc = 0;
        if (n === maxSteps && E.acc >= step) {
          E.stats.droppedSeconds += E.acc; // dluh zahodit, ne dohánět
          E.acc = 0;
        }
      }
      const alpha = Math.min(E.acc / step, 1);
      for (const s of frameList) s.frame(real, alpha);
      return n;
    },

    /** Testy a vývojářské nástroje: N kroků bez čekání na skutečný čas. */
    sim(seconds) {
      const n = Math.round(seconds / step);
      for (let i = 0; i < n; i++) E.stepOnce();
      return n;
    },

    snapshot() {
      if (!sorted) sortSystems();
      const out = { format: 1, steps: E.steps, systems: {} };
      for (const s of order) if (s.snapshot) out.systems[s.name] = s.snapshot();
      return out;
    },
    restore(data) {
      if (!sorted) sortSystems();
      if (!data || data.format !== 1) throw new Error('Neznámý formát uloženého stavu.');
      E.steps = data.steps;
      E.acc = 0;
      for (const s of order) {
        if (s.restore && data.systems[s.name] !== undefined) s.restore(data.systems[s.name]);
      }
      E.emit('restored');
    },

    /** Smyčka v prohlížeči. */
    run(raf = globalThis.requestAnimationFrame) {
      let last = now();
      const loop = (t) => {
        const real = (t - last) / 1000;
        last = t;
        const t0 = now();
        E.tick(real);
        E.stats.frameMs += (now() - t0 - E.stats.frameMs) * 0.05;
        if (real > 0) E.stats.fps += (1 / real - E.stats.fps) * 0.05;
        raf(loop);
      };
      raf(loop);
    },
  };

  return E;
}
