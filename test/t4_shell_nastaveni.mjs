// T4: nastavení Shellu (deklarace, apply/probe, uložení). Převzato z vibe-game-frameworks (t3_nastaveni, commit ab8557a) při stěhování Shellu do xEngine.
// T3 — jádro nastavení a vrstva úložiště v Node: normalizace, ukládání, obnova,
// poškozená data, nedostupné úložiště a hlavně test proti slepým prvkům (apply/probe).

import { createStore } from '../src/kernel/store.js';
import { createSettings } from '../src/shell/settings.js';

let pass = 0;
let fail = 0;
function ok(cond, name, detail = '') {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
const throws = (fn) => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};

/** Náhrada localStorage. `broken`: setItem vždy selže; `quota`: selže po N zápisech. */
function fakeBackend({ broken = false, quota = Infinity } = {}) {
  const map = new Map();
  let writes = 0;
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (broken || ++writes > quota) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k),
  };
}

/** „Engine“ pro test: hodnoty, které apply mění a probe čte. */
function fakeGame() {
  const engine = { volume: 0.6, speed: 1, shadows: true, full: false, sounds: 0 };
  const defs = [
    { id: 'volume', page: 'zvuk', label: 'Hlasitost', type: 'range', min: 0, max: 100, step: 5, def: 60, apply: (v) => (engine.volume = v / 100), probe: () => engine.volume * 100, tolerance: 0.01 },
    {
      id: 'speed',
      page: 'hra',
      label: 'Rychlost',
      type: 'select',
      def: 1,
      options: [0.5, 1, 1.5].map((value) => ({ value, label: `${value}×` })),
      apply: (v) => (engine.speed = v),
      probe: () => engine.speed,
    },
    { id: 'shadows', page: 'obraz', label: 'Stíny', type: 'toggle', def: true, apply: (v) => (engine.shadows = v), probe: () => engine.shadows },
    {
      id: 'full',
      page: 'obraz',
      label: 'Celá obrazovka',
      type: 'toggle',
      def: false,
      persist: false,
      apply: (v) => (engine.full = v),
      probe: () => engine.full,
    },
    { id: 'test', page: 'zvuk', label: 'Test', type: 'action', run: () => engine.sounds++ },
  ];
  return { engine, defs };
}

// ---------- úložiště ----------
console.log('Úložiště');
{
  const b = fakeBackend();
  const s = createStore('hra.', b);
  ok(s.persistent, 'funkční úložiště se hlásí jako trvalé');
  ok(s.set('a', { x: 1 }) === true && s.get('a').x === 1, 'zápis a čtení JSON');
  ok(b.map.has('hra.a'), 'klíče mají prefix hry');
  b.map.set('hra.b', '{rozbité');
  ok(s.get('b') === null, 'poškozený záznam se čte jako null, ne jako pád');
  ok(s.get('neexistuje') === null, 'chybějící klíč = null');

  const broken = createStore('hra.', fakeBackend({ broken: true }));
  ok(!broken.persistent, 'nedostupné úložiště se hlásí jako dočasné');
  ok(broken.set('a', 5) === false && broken.get('a') === 5, 'dočasné úložiště drží hodnoty v paměti');

  const none = createStore('hra.', undefined);
  ok(!none.persistent && none.set('a', 1) === false && none.get('a') === 1, 'úplně chybějící localStorage nevadí');

  const q = createStore('hra.', fakeBackend({ quota: 2 })); // 1. zápis je zkouška při vytvoření
  ok(q.set('a', 1) === true, 'zápis před zaplněním projde');
  ok(q.set('b', 2) === false && q.get('b') === 2 && !q.persistent, 'po zaplnění úložiště přejde do paměti a přizná to');
}

// ---------- registrace ----------
console.log('Registrace položek');
{
  const store = createStore('x.', fakeBackend());
  const base = { id: 'a', page: 'p', label: 'A', type: 'toggle', def: false, apply: () => {} };
  ok(
    throws(() => createSettings([base], store)),
    'položka bez probe() se nedá zaregistrovat',
  );
  ok(
    throws(() => createSettings([{ ...base, probe: () => false, apply: undefined }], store)),
    'položka bez apply() se nedá zaregistrovat',
  );
  ok(
    throws(() => createSettings([{ id: 'b', page: 'p', label: 'B', type: 'action' }], store)),
    'akce bez run() se nedá zaregistrovat',
  );
  const good = { ...base, probe: () => false };
  ok(
    throws(() => createSettings([good, good], store)),
    'dvojí id je chyba',
  );
  ok(
    throws(() => createSettings([{ ...good, type: 'slider' }], store)),
    'neznámý typ je chyba',
  );
}

// ---------- hodnoty, apply, probe ----------
console.log('Hodnoty a test proti slepým prvkům');
{
  const { engine, defs } = fakeGame();
  const backend = fakeBackend();
  const S = createSettings(defs, createStore('hra.', backend));
  S.applyAll();
  ok(S.get('volume') === 60 && S.get('speed') === 1 && S.get('shadows') === true, 'bez uložených dat platí výchozí hodnoty');
  ok(S.pages.join() === 'zvuk,hra,obraz', 'stránky v pořadí deklarací', S.pages.join());

  S.set('volume', 25);
  S.set('speed', 1.5);
  S.set('shadows', false);
  S.set('full', true);
  ok(engine.volume === 0.25 && engine.speed === 1.5 && engine.shadows === false && engine.full === true, 'set() provede změnu v enginu');
  ok(
    S.probeAll().every((p) => p.ok),
    'probe všech položek souhlasí s hodnotou',
  );

  S.set('volume', 999);
  ok(S.get('volume') === 100, 'hodnota mimo rozsah se ořízne', String(S.get('volume')));
  S.set('volume', 33);
  ok(S.get('volume') === 35, 'hodnota se zaokrouhlí na krok', String(S.get('volume')));
  S.set('volume', 'nesmysl');
  ok(S.get('volume') === 60, 'nečíselná hodnota = výchozí');
  S.set('speed', 7);
  ok(S.get('speed') === 1, 'neznámá volba = výchozí');
  S.set('shadows', 'ano');
  ok(S.get('shadows') === true, 'neplatný přepínač = výchozí');

  S.run('test');
  ok(engine.sounds === 1, 'akce se spustí');
  ok(
    throws(() => S.set('test', 1)) && throws(() => S.run('volume')) && throws(() => S.set('neni', 1)),
    'záměna akce a hodnoty je chyba',
  );

  // slepý prvek: apply nic nedělá → probe to odhalí
  const placebo = { id: 'fake', page: 'hra', label: 'Na oko', type: 'toggle', def: false, apply: () => {}, probe: () => false };
  const P = createSettings([placebo], createStore('p.', fakeBackend()));
  P.set('fake', true);
  ok(P.probeAll()[0].ok === false, 'položka, která nic nedělá, testem neprojde');

  // uložení a obnova
  S.set('volume', 20);
  S.set('speed', 0.5);
  S.set('shadows', false);
  S.set('full', true);
  const raw = JSON.parse(backend.map.get('hra.settings'));
  ok(raw.format === 1 && raw.values.volume === 20 && raw.values.speed === 0.5, 'uložený záznam má verzi a hodnoty');
  ok(!('full' in raw.values), 'položka s persist: false se neukládá');

  const g2 = fakeGame();
  const S2 = createSettings(g2.defs, createStore('hra.', backend));
  S2.applyAll();
  ok(S2.get('volume') === 20 && g2.engine.volume === 0.2 && g2.engine.speed === 0.5 && g2.engine.shadows === false, 'po novém startu se hodnoty načtou a použijí');
  ok(S2.get('full') === false && g2.engine.full === false, 'neukládaná položka začíná výchozí hodnotou');
  ok(
    S2.probeAll().every((p) => p.ok),
    'probe po obnově souhlasí',
  );

  // reset
  let notified = [];
  S2.onChange((id) => notified.push(id));
  S2.reset();
  ok(S2.get('volume') === 60 && g2.engine.volume === 0.6 && g2.engine.speed === 1 && g2.engine.shadows === true, 'obnovení výchozích hodnot se projeví v enginu');
  ok(notified.includes('*'), 'obnovení výchozích oznámí změnu všeho');
  ok(JSON.parse(backend.map.get('hra.settings')).values.volume === 60, 'obnovení výchozích se uloží');
}

// ---------- odolnost ----------
console.log('Odolnost');
{
  const mk = (stored) => {
    const backend = fakeBackend();
    if (stored !== undefined) backend.map.set('hra.settings', stored);
    const g = fakeGame();
    const S = createSettings(g.defs, createStore('hra.', backend));
    S.applyAll();
    return { S, g };
  };
  ok(mk('{rozbité').S.get('volume') === 60, 'poškozený záznam → výchozí hodnoty');
  ok(mk(JSON.stringify({ format: 99, values: { volume: 5 } })).S.get('volume') === 60, 'cizí verze formátu → výchozí hodnoty');
  ok(mk(JSON.stringify({ format: 1, values: 'text' })).S.get('volume') === 60, 'nesmyslný obsah → výchozí hodnoty');
  const mixed = mk(JSON.stringify({ format: 1, values: { volume: 5000, speed: 'rychle', neznamy: 1, shadows: false } }));
  ok(mixed.S.get('volume') === 100 && mixed.S.get('speed') === 1 && mixed.S.get('shadows') === false, 'neplatné hodnoty se opraví, neznámé klíče ignorují');
  ok(mixed.g.engine.shadows === false, 'platná část uložených dat se použije');

  // nedostupné úložiště
  const g = fakeGame();
  const S = createSettings(g.defs, createStore('hra.', fakeBackend({ broken: true })));
  S.applyAll();
  S.set('volume', 10);
  ok(g.engine.volume === 0.1 && S.get('volume') === 10, 'bez úložiště nastavení funguje do zavření stránky');
  ok(S.persistent === false, 'a přizná, že se neuchová');

  // podmínka when
  const cond = { id: 'c', page: 'jen', label: 'C', type: 'toggle', def: false, apply: () => {}, probe: () => false, when: () => false };
  const W = createSettings([...fakeGame().defs, cond], createStore('w.', fakeBackend()));
  ok(!W.pages.includes('jen') && W.visible(cond) === false, 'stránka jen se skrytými položkami se nenabízí');
}

// ---------- asynchronní apply a změna zvenčí ----------
console.log('Asynchronní položky');
{
  const engine = { full: false };
  let external = null;
  let allow = true;
  const def = {
    id: 'full',
    page: 'obraz',
    label: 'Celá obrazovka',
    type: 'toggle',
    def: false,
    persist: false,
    apply: (v) => (allow ? Promise.resolve().then(() => (engine.full = v)) : Promise.reject(new Error('zakázáno'))),
    probe: () => engine.full,
    watch: (cb) => (external = cb),
  };
  const S = createSettings([def], createStore('a.', fakeBackend()));
  ok((await S.set('full', true)) === true && engine.full === true && S.probeAll()[0].ok, 'asynchronní apply uspěje');
  allow = false;
  const r = await S.set('full', false);
  ok(r === false && S.get('full') === true, 'neúspěšné apply vrátí hodnotu k tomu, co engine opravdu má');
  engine.full = false;
  external(false);
  ok(S.get('full') === false && S.probeAll()[0].ok, 'změna zvenčí (watch) se promítne do hodnoty');
}

console.log(`\nT4 Shell, nastavení: ${pass} prošlo, ${fail} selhalo`);
process.exit(fail ? 1 : 0);
