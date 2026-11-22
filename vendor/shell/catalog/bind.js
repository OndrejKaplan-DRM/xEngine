// Spojení katalogu nabídek se hrou.
// Katalog říká, co nabídky můžou obsahovat. Hra dodá vazby jen k tomu, co umí.
// Výsledek: seznam položek se stavem a zpráva o pokrytí. Co není zapojené, hráč nevidí.
//
// Vazba podle druhu položky:
//   setting  { apply(v), probe() }      volba; obojí povinné (test proti slepým prvkům)
//   action   { run() }                  tlačítko
//   info     { value() } nebo true      údaj; true = ukazuje ho Shell sám
//   cokoli   { na: 'důvod' }            hra položku vědomě nemá a říká proč
// Vazba smí přepsat label, def, options, min, max, step, format a when (funkce).

const TYPES = new Set(['range', 'select', 'segment', 'toggle']);
const KINDS = new Set(['action', 'setting', 'info']);
const SCOPES = new Set(['hned', 'beh', 'restart']);
const OVERRIDES = ['label', 'def', 'options', 'min', 'max', 'step', 'format', 'when', 'tolerance', 'watch'];

/** Zkontroluje katalog sám o sobě. Vrací seznam chyb (prázdný = v pořádku). */
export function validateCatalog(catalog) {
  const errors = [];
  const screens = new Set();
  for (const s of catalog.screens) {
    if (screens.has(s.id)) errors.push(`obrazovka ${s.id} je dvakrát`);
    screens.add(s.id);
    if (!s.title) errors.push(`obrazovka ${s.id} nemá název`);
  }
  const ids = new Set();
  for (const it of catalog.items) {
    const at = `položka ${it.id}`;
    if (!it.id) errors.push('položka bez id');
    if (ids.has(it.id)) errors.push(`${at} je dvakrát`);
    ids.add(it.id);
    if (!screens.has(it.screen)) errors.push(`${at}: neznámá obrazovka ${it.screen}`);
    if (!KINDS.has(it.kind)) errors.push(`${at}: neznámý druh ${it.kind}`);
    if (!catalog.tiers[it.tier]) errors.push(`${at}: neznámá úroveň ${it.tier}`);
    if (!it.label) errors.push(`${at}: chybí popisek`);
    if (!['D', 'D*', 'N'].includes(it.dino)) errors.push(`${at}: chybí původ (dino)`);
    if (it.kind === 'setting') {
      if (!TYPES.has(it.type)) errors.push(`${at}: volba bez platného typu`);
      if (!SCOPES.has(it.scope)) errors.push(`${at}: volba neříká, kdy se projeví (scope)`);
      if (it.type === 'range') {
        if (![it.min, it.max, it.step].every(Number.isFinite) || it.min >= it.max) errors.push(`${at}: rozsah nemá meze`);
        else if (it.def !== undefined && (it.def < it.min || it.def > it.max)) errors.push(`${at}: výchozí hodnota mimo meze`);
      }
      if (it.options && it.def !== undefined && !it.options.includes(it.def)) errors.push(`${at}: výchozí hodnota není mezi možnostmi`);
    } else if (it.type) errors.push(`${at}: typ má jen volba`);
    if (it.dev && catalog.screens.find((s) => s.id === it.screen)?.group === 'nastaveni') errors.push(`${at}: vývojářská volba nepatří do nastavení hráče`);
    if (it.dev && it.kind === 'setting' && it.persist !== false) errors.push(`${at}: vývojářská volba se nesmí ukládat`);
  }
  return errors;
}

/**
 * Spojí katalog s vazbami hry.
 * @returns {{ items: object[], report: object }}
 *   items[i].status: 'wired' zapojeno | 'unwired' hra nedodala vazbu | 'na' hra položku vědomě nemá
 */
export function bindCatalog(catalog, bindings = {}) {
  const errors = validateCatalog(catalog);
  if (errors.length) throw new Error(`Katalog ${catalog.id} má chyby: ${errors.join('; ')}`);
  const known = new Set(catalog.items.map((it) => it.id));
  for (const id of Object.keys(bindings)) if (!known.has(id)) throw new Error(`Vazba na neznámou položku katalogu: ${id}`);

  const items = catalog.items.map((it) => {
    const b = bindings[it.id];
    if (b === undefined) return { ...it, status: 'unwired' };
    if (b && typeof b === 'object' && 'na' in b) {
      if (typeof b.na !== 'string' || !b.na.trim()) throw new Error(`${it.id}: „na“ potřebuje důvod`);
      return { ...it, status: 'na', reason: b.na };
    }
    const out = { ...it, status: 'wired' };
    if (b && typeof b === 'object') for (const k of OVERRIDES) if (k in b) out[k] = b[k];
    if (it.kind === 'setting') {
      if (typeof b?.apply !== 'function') throw new Error(`${it.id}: volba bez apply`);
      if (typeof b?.probe !== 'function') throw new Error(`${it.id}: volba bez probe – nedá se ověřit, že něco dělá`);
      if (out.def === undefined) throw new Error(`${it.id}: chybí výchozí hodnota`);
      if ((it.type === 'select' || it.type === 'segment') && !(out.options?.length >= 2)) throw new Error(`${it.id}: výběr potřebuje aspoň dvě možnosti`);
      out.apply = b.apply;
      out.probe = b.probe;
    } else if (it.kind === 'action') {
      if (typeof b?.run !== 'function') throw new Error(`${it.id}: akce bez run`);
      out.run = b.run;
    } else if (b !== true) {
      if (typeof b?.value !== 'function') throw new Error(`${it.id}: údaj potřebuje value() nebo true`);
      out.value = b.value;
    }
    return out;
  });

  const by = (status) => items.filter((it) => it.status === status);
  const count = (list, tier) => list.filter((it) => it.tier === tier).length;
  const wired = by('wired');
  const report = {
    catalog: catalog.id,
    version: catalog.version,
    total: items.length,
    wired: wired.length,
    na: by('na').length,
    unwired: by('unwired').length,
    byTier: Object.fromEntries(
      Object.keys(catalog.tiers).map((t) => [t, { total: count(items, t), wired: count(wired, t), na: count(by('na'), t), unwired: count(by('unwired'), t) }]),
    ),
    // Základ (A), ke kterému se hra nevyjádřila. Dokud tu něco je, nabídky nejsou hotové.
    missingRequired: by('unwired').filter((it) => it.tier === 'A').map((it) => it.id),
  };
  return { items, report };
}

/** Co uvidí hráč: jen zapojené položky; vývojářské jen ve vývojářském režimu. */
export function visibleItems(bound, { dev = false, screen } = {}) {
  return bound.items.filter((it) => it.status === 'wired' && (dev || !it.dev) && (!screen || it.screen === screen));
}

/** Zapojené volby převedené na deklarace pro createSettings (src/shell/settings.js). */
export function toSettingsDefs(bound, { dev = false } = {}) {
  return visibleItems(bound, { dev })
    .filter((it) => it.kind === 'setting')
    .map((it) => {
      const def = {
        id: it.id,
        page: it.screen.startsWith('set.') ? it.screen.slice(4) : it.screen,
        label: it.label,
        type: it.type === 'segment' ? 'select' : it.type,
        def: it.def,
        apply: it.apply,
        probe: it.probe,
      };
      for (const k of ['min', 'max', 'step', 'format', 'tolerance', 'watch']) if (it[k] !== undefined) def[k] = it[k];
      if (it.options) def.options = it.options.map((o) => (o && typeof o === 'object' ? o : { value: o, label: String(o) }));
      if (it.persist === false) def.persist = false;
      if (typeof it.when === 'function') def.when = it.when;
      return def;
    });
}
