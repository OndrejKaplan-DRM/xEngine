// Vrstva úložiště: localStorage, při nedostupnosti paměť (02_SHELL oddíl 5).
// Hodnoty jsou JSON. `persistent` říká, jestli data přežijí zavření stránky;
// volající to má uživateli sdělit, ne tiše selhat.

export function createStore(prefix, backend = globalThis.localStorage) {
  let ls = null;
  try {
    const probe = `${prefix}__zkouska`;
    backend.setItem(probe, '1');
    backend.removeItem(probe);
    ls = backend;
  } catch {
    ls = null;
  }
  const memory = new Map();

  return {
    get persistent() {
      return ls !== null;
    },
    /** Vrací uloženou hodnotu, nebo null (i když je záznam poškozený). */
    get(key) {
      const k = prefix + key;
      let raw = null;
      try {
        raw = ls ? ls.getItem(k) : (memory.get(k) ?? null);
      } catch {
        raw = memory.get(k) ?? null;
      }
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    /** Vrací true, pokud se hodnota uložila trvale. */
    set(key, value) {
      const k = prefix + key;
      const raw = JSON.stringify(value);
      if (ls) {
        try {
          ls.setItem(k, raw);
          return true;
        } catch {
          ls = null; // plné nebo zakázané úložiště: dál jen v paměti
        }
      }
      memory.set(k, raw);
      return false;
    },
    remove(key) {
      const k = prefix + key;
      memory.delete(k);
      try {
        ls?.removeItem(k);
      } catch {
        /* nic */
      }
    },
  };
}
