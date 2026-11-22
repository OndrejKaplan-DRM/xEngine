// Jádro nastavení (Shell S1): hodnoty z deklarací, normalizace, ukládání, apply a probe.
// Bez DOM, takže jde testovat v Node. Vykreslení je v settings-view.js.
//
// Deklarace položky:
//   { id, page, label, type: 'range' | 'select' | 'toggle' | 'action', def,
//     min, max, step,            // range
//     options: [{ value, label }], // select
//     apply(v),                  // provede změnu v enginu; smí vrátit Promise
//     probe(),                   // vrátí, co engine SKUTEČNĚ má (test proti slepým prvkům)
//     run(),                     // jen action
//     when(),                    // volitelně: zobrazit jen když platí
//     watch(cb),                 // volitelně: hodnota se může změnit i mimo nastavení
//     persist: false,            // volitelně: neukládat (např. celá obrazovka)
//     format(v), tolerance }
//
// Položka bez `probe` se nedá zaregistrovat. Slepý prvek tak nevznikne ani omylem.

const FORMAT = 1;

export function createSettings(defs, store, key = 'settings') {
  const byId = new Map();
  for (const d of defs) {
    if (!d.id || !d.page || !d.label) throw new Error('Nastavení: položka potřebuje id, page a label.');
    if (byId.has(d.id)) throw new Error(`Nastavení: id „${d.id}“ je dvakrát.`);
    if (d.type === 'action') {
      if (typeof d.run !== 'function') throw new Error(`Nastavení „${d.id}“: akce potřebuje run().`);
    } else {
      if (!['range', 'select', 'toggle'].includes(d.type)) throw new Error(`Nastavení „${d.id}“: neznámý typ ${d.type}.`);
      if (typeof d.apply !== 'function') throw new Error(`Nastavení „${d.id}“: chybí apply().`);
      if (typeof d.probe !== 'function') throw new Error(`Nastavení „${d.id}“: chybí probe(); položka bez ověřitelného účinku se neregistruje.`);
      if (d.def === undefined) throw new Error(`Nastavení „${d.id}“: chybí výchozí hodnota def.`);
    }
    byId.set(d.id, d);
  }
  const valueDefs = defs.filter((d) => d.type !== 'action');
  const listeners = new Set();
  const values = {};

  function normalize(d, v) {
    if (d.type === 'range') {
      let n = Number(v);
      if (!Number.isFinite(n)) return d.def;
      n = Math.min(d.max, Math.max(d.min, n));
      if (d.step) n = d.min + Math.round((n - d.min) / d.step) * d.step;
      return +n.toFixed(6);
    }
    if (d.type === 'select') return d.options.some((o) => o.value === v) ? v : d.def;
    return v === true || v === false ? v : d.def; // toggle
  }

  // načtení: neznámé klíče se ignorují, chybějící a neplatné doplní výchozí hodnota
  const saved = store.get(key);
  const stored = saved && saved.format === FORMAT && saved.values && typeof saved.values === 'object' ? saved.values : {};
  for (const d of valueDefs) {
    values[d.id] = d.persist === false || !(d.id in stored) ? d.def : normalize(d, stored[d.id]);
  }

  let lastSavePersistent = store.persistent;
  function save() {
    const out = {};
    for (const d of valueDefs) if (d.persist !== false) out[d.id] = values[d.id];
    lastSavePersistent = store.set(key, { format: FORMAT, values: out });
    return lastSavePersistent;
  }
  function notify(id) {
    for (const fn of listeners) fn(id);
  }
  function guard(d, result) {
    // asynchronní apply (celá obrazovka) může selhat: hodnota se vrátí k tomu, co engine opravdu má
    if (result && typeof result.then === 'function') {
      return result.then(
        () => true,
        () => {
          values[d.id] = normalize(d, d.probe());
          notify(d.id);
          return false;
        },
      );
    }
    return result;
  }

  for (const d of valueDefs) {
    if (typeof d.watch === 'function') {
      d.watch((v) => {
        values[d.id] = normalize(d, v);
        notify(d.id);
      });
    }
  }

  return {
    defs,
    /** Stránky v pořadí, v jakém se poprvé objevily v deklaracích. */
    get pages() {
      return [...new Set(defs.filter((d) => !d.when || d.when()).map((d) => d.page))];
    },
    visible(d) {
      return !d.when || !!d.when();
    },
    get(id) {
      return values[id];
    },
    set(id, v) {
      const d = byId.get(id);
      if (!d || d.type === 'action') throw new Error(`Nastavení: „${id}“ není položka s hodnotou.`);
      values[id] = normalize(d, v);
      const result = d.apply(values[id]);
      if (d.persist !== false) save();
      notify(id);
      return guard(d, result);
    },
    run(id) {
      const d = byId.get(id);
      if (!d || d.type !== 'action') throw new Error(`Nastavení: „${id}“ není akce.`);
      return d.run();
    },
    /** Výchozí hodnoty všeho; apply jen tam, kde se hodnota opravdu mění. */
    reset() {
      for (const d of valueDefs) {
        if (values[d.id] === d.def) continue;
        values[d.id] = d.def;
        guard(d, d.apply(d.def));
      }
      save();
      notify('*');
    },
    /** Po startu: uložené hodnoty do enginu. Neukládané položky (persist: false) se nechávají být. */
    applyAll() {
      for (const d of valueDefs) if (d.persist !== false) d.apply(values[d.id]);
    },
    /** Test proti slepým prvkům: porovná hodnotu s tím, co hlásí engine. */
    probeAll() {
      return valueDefs.map((d) => {
        const probe = d.probe();
        const value = values[d.id];
        const ok = typeof probe === 'number' && typeof value === 'number' ? Math.abs(probe - value) <= (d.tolerance ?? 1e-6) : probe === value;
        return { id: d.id, value, probe, ok };
      });
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** false = úložiště není k dispozici, nastavení platí jen do zavření stránky. */
    get persistent() {
      return lastSavePersistent && store.persistent;
    },
  };
}
