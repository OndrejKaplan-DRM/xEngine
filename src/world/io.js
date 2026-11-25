// xWorld: spojení výstup → vstup (dědictví Half-Life). Chování levelu je v datech (pole io u entit a spouštěčů),
// tady je jen fronta. Kontrakt (docs/02_KONTRAKTY.md): vyřizuje se ve fázi 'late' v pořadí (krok splatnosti,
// pořadí vzniku), zpoždění se převádí na kroky nahoru, řetěz v jednom kroku má strop 32 článků, fronta je součást
// uloženého stavu. Cíl je entita levelu, nebo vestavěný @level (checkpoint, complete, message).
// Víc interakcí v prefabu (N-010): spojení s `from` bere výstup jen z té interakce zdroje, `to` doručí vstup jen do
// té interakce cíle (bez něj do všech).

const CHAIN_MAX = 32;
const STEPS_PER_SECOND = 120;

export function createIo({ entities, world }) {
  let E = null;
  let behave = null;
  // { on, target (index entity, −1 = @level), input, delay (kroky), once, hasParam, param, fired, src (id zdroje),
  //   from (id interakce zdroje | null), to (id interakce cíle | null) }
  let links = [];
  let trigLinks = []; // index spouštěče → { enter: [indexy spojení], exit: […] }
  // fronta: souběžná pole, bez objektů na položku
  let cap = 64;
  let qDue = new Int32Array(cap);
  let qSeq = new Int32Array(cap);
  let qLink = new Int32Array(cap);
  let qGen = new Int32Array(cap);
  let qVal = new Array(cap);
  let count = 0;
  let seq = 0;
  let gen = 0; // článek řetězu, který se právě doručuje
  const stat = { fired: 0, delivered: 0, broken: 0, unknown: 0 };
  const evt = { source: '', output: '', target: '', input: '', value: undefined }; // jeden objekt, posluchač si ho nesmí schovat
  const warned = new Set();
  const warn = (msg) => {
    if (warned.has(msg)) return;
    warned.add(msg);
    console.info(`xWorld io: ${msg}`);
  };

  function grow() {
    cap *= 2;
    const copy = (a) => {
      const b = new Int32Array(cap);
      b.set(a);
      return b;
    };
    qDue = copy(qDue);
    qSeq = copy(qSeq);
    qLink = copy(qLink);
    qGen = copy(qGen);
    qVal.length = cap;
  }
  function push(due, link, value, g) {
    if (count === cap) grow();
    qDue[count] = due;
    qSeq[count] = seq++;
    qLink[count] = link;
    qGen[count] = g;
    qVal[count] = value;
    count++;
  }
  function addLinks(list, fromId, table) {
    for (const k of list || []) {
      let target = -1;
      if (k.target !== '@level') {
        const ent = entities.byId(k.target);
        if (!ent) {
          warn(`spojení ${fromId}.${k.on} míří na neznámou entitu „${k.target}“; vynechávám`);
          continue;
        }
        target = ent.index;
      }
      links.push({ on: k.on, target, input: k.input, delay: Math.ceil((k.delay || 0) * STEPS_PER_SECOND - 1e-9), once: !!k.once, hasParam: k.param !== undefined, param: k.param, fired: false, src: fromId, from: k.from ?? null, to: k.to ?? null });
      (table[k.on] ||= []).push(links.length - 1);
    }
  }
  function deliver(i) {
    const k = links[qLink[i]];
    const value = qVal[i];
    stat.delivered++;
    evt.source = k.src;
    evt.output = k.on;
    evt.input = k.input;
    evt.value = value;
    if (k.target < 0) {
      evt.target = '@level';
      E.emit('io:fired', evt);
      if (k.input === 'checkpoint') E.emit('level:checkpoint', evt);
      else if (k.input === 'complete') E.emit('level:complete', evt);
      else if (k.input === 'message') E.emit('level:message', evt);
      else warn(`@level nezná vstup „${k.input}“`);
      return;
    }
    const ent = entities.list[k.target];
    evt.target = ent.id;
    E.emit('io:fired', evt);
    if (!behave.input(ent, k.input, value, k.to)) {
      stat.unknown++;
      warn(`entita ${ent.id} (${ent.prefab.id}) nezná vstup „${k.input}“`);
    }
  }

  const sys = {
    name: 'io',
    phase: 'late',
    after: ['world'],
    events: ['io:fired', 'level:checkpoint', 'level:complete', 'level:message'],
    stat,
    set behave(b) {
      behave = b;
    },
    init(engine) {
      E = engine;
    },

    load(ctx) {
      links = [];
      for (const ent of entities.list) {
        ent.links = {};
        addLinks(ent.def.io, ent.id, ent.links);
      }
      trigLinks = (ctx.level.triggers || []).map((t) => {
        const table = {};
        addLinks(t.io, t.id, table);
        return table;
      });
      count = 0;
      seq = 0;
    },
    unload() {
      links = [];
      trigLinks = [];
      count = 0;
    },
    reset() {
      count = 0;
      seq = 0;
      gen = 0;
      for (const k of links) k.fired = false;
      Object.assign(stat, { fired: 0, delivered: 0, broken: 0, unknown: 0 });
    },

    /**
     * Výstup entity nebo spouštěče. kind: 'entity' | 'trigger', index do příslušného seznamu; ix = id interakce,
     * ze které výstup přišel (spojení s `from` jiné interakce ho nevezme). Když spojení nemá param, předá se
     * hodnota výstupu.
     */
    fire(kind, index, output, value, ix = null) {
      const table = kind === 'entity' ? entities.list[index].links : trigLinks[index];
      const list = table && table[output];
      if (!list) return;
      for (let n = 0; n < list.length; n++) {
        const k = links[list[n]];
        if (k.once && k.fired) continue;
        if (k.from !== null && k.from !== ix) continue; // výstup jiné interakce zdroje
        if (k.delay === 0 && gen >= CHAIN_MAX) {
          stat.broken++;
          warn(`řetěz spojení přesáhl ${CHAIN_MAX} článků u ${k.src}.${k.on}; přerušeno (smyčka v datech?)`);
          continue;
        }
        k.fired = true;
        stat.fired++;
        // spojení bez zpoždění pokračuje v řetězu téhož kroku; zpožděné začíná nový
        push(E.steps + k.delay, list[n], k.hasParam ? k.param : value, k.delay === 0 ? gen + 1 : 0);
      }
    },

    step() {
      const now = E.steps;
      for (;;) {
        // nejstarší splatná položka: (krok splatnosti, pořadí vzniku)
        let best = -1;
        for (let i = 0; i < count; i++) {
          if (qDue[i] > now) continue;
          if (best < 0 || qDue[i] < qDue[best] || (qDue[i] === qDue[best] && qSeq[i] < qSeq[best])) best = i;
        }
        if (best < 0) break;
        gen = qGen[best];
        deliver(best);
        // odebrat: poslední položka na uvolněné místo (deliver mohl frontu rozšířit, proto až teď)
        count--;
        qDue[best] = qDue[count];
        qSeq[best] = qSeq[count];
        qLink[best] = qLink[count];
        qGen[best] = qGen[count];
        qVal[best] = qVal[count];
        qVal[count] = undefined;
      }
      gen = 0;
    },

    snapshot() {
      const queue = [];
      for (let i = 0; i < count; i++) queue.push([qDue[i], qSeq[i], qLink[i], qGen[i], qVal[i] ?? null]);
      return { seq, fired: links.map((k) => (k.fired ? 1 : 0)), queue };
    },
    restore(d) {
      seq = d.seq;
      links.forEach((k, i) => (k.fired = !!d.fired[i]));
      count = 0;
      for (const q of d.queue) {
        if (count === cap) grow();
        qDue[count] = q[0];
        qSeq[count] = q[1];
        qLink[count] = q[2];
        qGen[count] = q[3];
        qVal[count] = q[4] ?? undefined;
        count++;
      }
    },

    inspect(path) {
      if (path[0] === 'pending') return count;
      if (path[0] === 'links') return links.length;
      if (path[0] === 'stat') return { ...stat };
      if (path[0] === 'queue') {
        const out = [];
        for (let i = 0; i < count; i++) out.push({ due: qDue[i], from: links[qLink[i]].src, on: links[qLink[i]].on, input: links[qLink[i]].input });
        return out.sort((a, b) => a.due - b.due);
      }
      return undefined;
    },
  };
  // světu se fronta předá při načtení (ctx.io), aby spouštěče měly kam hlásit
  void world;
  return sys;
}
