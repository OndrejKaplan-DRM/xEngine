// Katalog nabídek pro arkádu (šablona A-MENU v1). Vzor: Dinoš 2.7, doplněno a setříděno.
// Popis a pravidla: frameworks/41_SABLONA_Menu_arkada.md.
//
// Katalog není menu. Je to úplný seznam toho, co nabídky arkády můžou obsahovat.
// Hra z něj zapojí, co umí (bind.js); nezapojené položky hráč nevidí.
//
// Pole položky:
//   id      jednoznačné jméno, předpona = obrazovka
//   screen  obrazovka (SCREENS)
//   kind    'action' tlačítko | 'setting' volba s uloženou hodnotou | 'info' údaj, který Shell jen ukazuje
//   type    u volby: 'range' | 'select' | 'segment' | 'toggle'
//   tier    'A' bez toho nabídky neobstojí | 'B' doporučené | 'C' nadstavba
//   dino    'D' je v Dinošovi 2.7 | 'D*' je tam jinak nebo jen částečně | 'N' v Dinošovi není
//   scope   kdy se volba projeví: 'hned' | 'beh' (od dalšího běhu) | 'restart' (po novém načtení)
//   persist false = neukládá se (stav patří prohlížeči nebo běhu)
//   when    slovní podmínka, za které má položka smysl
//   danger  ničivá akce, Shell si vyžádá potvrzení
//   dev     jen ve vývojářském režimu (?dev)

export const CATALOG_ID = 'arcade';
export const CATALOG_VERSION = 1;

export const TIERS = {
  A: 'Základ',
  B: 'Doporučené',
  C: 'Nadstavba',
};

export const SCREENS = [
  { id: 'boot', title: 'Načítání', group: 'start' },
  { id: 'title', title: 'Hlavní menu', group: 'start' },
  { id: 'bar', title: 'Rychlá lišta', group: 'start', note: 'Je vidět v menu i ve hře.' },
  { id: 'set.hra', title: 'Nastavení · Hra', group: 'nastaveni' },
  { id: 'set.zvuk', title: 'Nastavení · Zvuk', group: 'nastaveni' },
  { id: 'set.obraz', title: 'Nastavení · Obraz', group: 'nastaveni' },
  { id: 'set.ovladani', title: 'Nastavení · Ovládání', group: 'nastaveni' },
  { id: 'set.svet', title: 'Nastavení · Svět', group: 'nastaveni', note: 'Stránka pro volby jedné konkrétní hry.' },
  { id: 'set.data', title: 'Nastavení · Data', group: 'nastaveni' },
  { id: 'help', title: 'Jak hrát', group: 'info' },
  { id: 'records', title: 'Rekordy a statistiky', group: 'info' },
  { id: 'collection', title: 'Průvodce', group: 'info' },
  { id: 'about', title: 'O hře', group: 'info' },
  { id: 'hud', title: 'Ve hře', group: 'hra' },
  { id: 'pause', title: 'Pauza', group: 'hra' },
  { id: 'results', title: 'Výsledky', group: 'hra' },
  { id: 'system', title: 'Systémová okna', group: 'hra' },
  { id: 'dev', title: 'Vývojář', group: 'dev', note: 'Celá obrazovka jen s ?dev.' },
];

const A = 'A';
const B = 'B';
const C = 'C';

export const ITEMS = [
  // ── Načítání ───────────────────────────────────────────────────────────────
  { id: 'boot.progress', screen: 'boot', kind: 'info', tier: A, dino: 'D', label: 'Průběh načítání', note: 'Text, co se právě děje, a lišta.' },
  { id: 'boot.error', screen: 'boot', kind: 'info', tier: A, dino: 'D', label: 'Chyba s důvodem', note: 'Lidská věta, ne výpis z konzole.' },
  { id: 'boot.retry', screen: 'boot', kind: 'action', tier: A, dino: 'D', label: 'Zkusit znovu', when: 'načtení selhalo' },
  { id: 'boot.fallback', screen: 'boot', kind: 'info', tier: B, dino: 'D', label: 'Oznámení úsporného vykreslení', when: 'hra má náhradní vykreslení' },
  { id: 'boot.tip', screen: 'boot', kind: 'info', tier: C, dino: 'N', label: 'Tip během načítání' },

  // ── Hlavní menu ────────────────────────────────────────────────────────────
  { id: 'title.play', screen: 'title', kind: 'action', tier: A, dino: 'D', label: 'Hrát', note: 'Dinoš: „Vyrazit na stezku“. Jediné zvýrazněné tlačítko.' },
  { id: 'title.continue', screen: 'title', kind: 'action', tier: C, dino: 'N', label: 'Pokračovat', when: 'hra ukládá rozehraný postup' },
  { id: 'title.practice', screen: 'title', kind: 'action', tier: B, dino: 'D', label: 'Klidný režim', note: 'Bez prohry, nezapisuje rekordy. Dinoš: „Klidná výprava“.' },
  { id: 'title.free', screen: 'title', kind: 'action', tier: C, dino: 'D', label: 'Volný režim', note: 'Hřiště bez cíle. Dinoš: „Poběhat si v háji“.' },
  { id: 'title.levels', screen: 'title', kind: 'action', tier: C, dino: 'D*', label: 'Výběr úseku', when: 'hra má úseky a hráč je odemkl', note: 'V Dinošovi jen ve Vývojáři.' },
  { id: 'title.daily', screen: 'title', kind: 'action', tier: C, dino: 'N', label: 'Denní výzva', note: 'Stejný seed pro všechny hráče toho dne.' },
  { id: 'title.help', screen: 'title', kind: 'action', tier: A, dino: 'D', label: 'Jak hrát' },
  { id: 'title.settings', screen: 'title', kind: 'action', tier: A, dino: 'D', label: 'Nastavení' },
  { id: 'title.records', screen: 'title', kind: 'action', tier: B, dino: 'N', label: 'Rekordy' },
  { id: 'title.collection', screen: 'title', kind: 'action', tier: C, dino: 'D*', label: 'Průvodce', note: 'V Dinošovi část nápovědy a Vývojáře.' },
  { id: 'title.about', screen: 'title', kind: 'action', tier: A, dino: 'N', label: 'O hře', note: 'Povinné, jakmile hra obsahuje cizí modely, hudbu nebo písmo.' },
  { id: 'title.dev', screen: 'title', kind: 'action', tier: B, dino: 'D*', label: 'Vývojář', dev: true, note: 'V Dinošovi viditelné každému hráči.' },
  { id: 'title.quit', screen: 'title', kind: 'action', tier: C, dino: 'N', label: 'Ukončit', when: 'hra běží jako aplikace, ne v prohlížeči' },
  { id: 'title.best', screen: 'title', kind: 'info', tier: A, dino: 'D', label: 'Rekord pro zvolenou obtížnost' },
  { id: 'title.controls', screen: 'title', kind: 'info', tier: B, dino: 'D', label: 'Řádek s ovládáním', note: 'Podle zařízení: klávesy, nebo gesta.' },
  { id: 'title.version', screen: 'title', kind: 'info', tier: A, dino: 'D', label: 'Verze a způsob vykreslení' },
  { id: 'title.attract', screen: 'title', kind: 'info', tier: C, dino: 'D', label: 'Živé pozadí', note: 'Scéna hry běží za menu.' },

  // ── Rychlá lišta ───────────────────────────────────────────────────────────
  { id: 'bar.mute', screen: 'bar', kind: 'action', tier: A, dino: 'D', label: 'Zvuk zapnout / vypnout' },
  { id: 'bar.pause', screen: 'bar', kind: 'action', tier: A, dino: 'D', label: 'Pauza', when: 'běží hra' },
  { id: 'bar.fullscreen', screen: 'bar', kind: 'action', tier: B, dino: 'D', label: 'Celá obrazovka', when: 'prohlížeč ji dovolí' },
  { id: 'bar.nextTrack', screen: 'bar', kind: 'action', tier: C, dino: 'D', label: 'Další skladba', when: 'hra má víc skladeb' },
  { id: 'bar.nowPlaying', screen: 'bar', kind: 'info', tier: C, dino: 'D', label: 'Název skladby' },
  { id: 'bar.env', screen: 'bar', kind: 'info', tier: C, dino: 'D', label: 'Stav světa', note: 'Dinoš: počasí, čas a úsek.' },

  // ── Nastavení · Hra ────────────────────────────────────────────────────────
  { id: 'set.difficulty', screen: 'set.hra', kind: 'setting', type: 'segment', tier: A, dino: 'D', label: 'Obtížnost', scope: 'beh', note: 'Tři stupně s vlastními jmény. Dinoš: Pohoda, Výprava, Dravec.' },
  { id: 'set.gameSpeed', screen: 'set.hra', kind: 'setting', type: 'select', tier: B, dino: 'N', label: 'Rychlost hry', scope: 'hned', def: 1, options: [0.5, 0.75, 1, 1.25, 1.5], note: 'Pomůcka pro přístupnost; mimo 100 % se rekordy nezapisují.' },
  { id: 'set.shake', screen: 'set.hra', kind: 'setting', type: 'toggle', tier: A, dino: 'D', label: 'Otřesy kamery', scope: 'hned', note: 'Výchozí hodnota podle systémového omezení pohybu.' },
  { id: 'set.hints', screen: 'set.hra', kind: 'setting', type: 'toggle', tier: B, dino: 'D*', label: 'Rady ve hře', scope: 'hned', def: true, note: 'Dinoš radí prvních 230 m bez možnosti vypnout.' },
  { id: 'set.resumeCountdown', screen: 'set.hra', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Odpočet po pauze', scope: 'hned', def: true },
  { id: 'set.autoPause', screen: 'set.hra', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Pauza při opuštění okna', scope: 'hned', def: true },
  { id: 'set.language', screen: 'set.hra', kind: 'setting', type: 'select', tier: C, dino: 'N', label: 'Jazyk', scope: 'hned', when: 'hra má víc než jeden jazyk' },

  // ── Nastavení · Zvuk ───────────────────────────────────────────────────────
  { id: 'set.vol.master', screen: 'set.zvuk', kind: 'setting', type: 'range', tier: A, dino: 'D', label: 'Celková hlasitost', scope: 'hned', min: 0, max: 100, step: 5, def: 80 },
  { id: 'set.vol.music', screen: 'set.zvuk', kind: 'setting', type: 'range', tier: A, dino: 'D', label: 'Hudba', scope: 'hned', min: 0, max: 100, step: 5, def: 50, when: 'hra má hudbu' },
  { id: 'set.vol.sfx', screen: 'set.zvuk', kind: 'setting', type: 'range', tier: A, dino: 'D', label: 'Zvuky', scope: 'hned', min: 0, max: 100, step: 5, def: 75 },
  { id: 'set.vol.ambience', screen: 'set.zvuk', kind: 'setting', type: 'range', tier: B, dino: 'D', label: 'Prostředí', scope: 'hned', min: 0, max: 100, step: 5, def: 55, when: 'hra má zvuky prostředí', note: 'Dinoš: „Prales“.' },
  { id: 'set.testSound', screen: 'set.zvuk', kind: 'action', tier: B, dino: 'N', label: 'Zkouška zvuku' },
  { id: 'set.nextTrack', screen: 'set.zvuk', kind: 'action', tier: C, dino: 'D', label: 'Další skladba', when: 'hra má víc skladeb' },
  { id: 'set.jukebox', screen: 'set.zvuk', kind: 'setting', type: 'select', tier: C, dino: 'D*', label: 'Výběr skladby', scope: 'hned', persist: false, note: 'V Dinošovi jen ve Vývojáři.' },
  { id: 'set.muteOnBlur', screen: 'set.zvuk', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Ztišit při neaktivním okně', scope: 'hned', def: true },

  // ── Nastavení · Obraz ──────────────────────────────────────────────────────
  { id: 'set.quality', screen: 'set.obraz', kind: 'setting', type: 'select', tier: B, dino: 'N', label: 'Kvalita obrazu', scope: 'hned', options: ['auto', 'nizka', 'stredni', 'vysoka'], def: 'auto' },
  { id: 'set.renderScale', screen: 'set.obraz', kind: 'setting', type: 'range', tier: B, dino: 'N', label: 'Měřítko vykreslení', scope: 'hned', min: 50, max: 150, step: 25, def: 100 },
  { id: 'set.shadows', screen: 'set.obraz', kind: 'setting', type: 'toggle', tier: B, dino: 'D', label: 'Stíny', scope: 'hned', when: 'vykreslování stíny umí', note: 'V Dinošovi se ukazuje i tam, kde nic nedělá.' },
  { id: 'set.fullscreen', screen: 'set.obraz', kind: 'setting', type: 'toggle', tier: B, dino: 'D*', label: 'Celá obrazovka', scope: 'hned', persist: false, when: 'prohlížeč ji dovolí' },
  { id: 'set.reducedMotion', screen: 'set.obraz', kind: 'setting', type: 'toggle', tier: B, dino: 'N', label: 'Omezit pohyb', scope: 'hned', note: 'Vypne otřesy, záblesky a částice přes celou obrazovku.' },
  { id: 'set.particles', screen: 'set.obraz', kind: 'setting', type: 'select', tier: C, dino: 'N', label: 'Částice a efekty počasí', scope: 'hned', options: ['plne', 'mene', 'vypnuto'], def: 'plne' },
  { id: 'set.fpsCap', screen: 'set.obraz', kind: 'setting', type: 'select', tier: C, dino: 'N', label: 'Omezení snímků', scope: 'hned', options: [0, 30, 60], def: 0 },
  { id: 'set.renderer', screen: 'set.obraz', kind: 'setting', type: 'select', tier: C, dino: 'D*', label: 'Vykreslování', scope: 'restart', options: ['auto', '3d', 'usporne'], def: 'auto', when: 'hra má dvě vykreslování', note: 'V Dinošovi se hodnota ukládá, ale nikde nečte.' },
  { id: 'set.showFps', screen: 'set.obraz', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Ukazatel snímků', scope: 'hned', def: false },
  { id: 'set.contrast', screen: 'set.obraz', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Výraznější ukazatele', scope: 'hned', def: false },

  // ── Nastavení · Ovládání ───────────────────────────────────────────────────
  { id: 'set.touchButtons', screen: 'set.ovladani', kind: 'setting', type: 'select', tier: A, dino: 'D*', label: 'Dotyková tlačítka', scope: 'hned', options: ['auto', 'vzdy', 'nikdy'], def: 'auto', note: 'Dinoš má jen zaškrtávátko „vždy“.' },
  { id: 'set.keyScheme', screen: 'set.ovladani', kind: 'setting', type: 'select', tier: B, dino: 'N', label: 'Rozložení kláves', scope: 'hned', options: ['oboji', 'sipky', 'wasd'], def: 'oboji' },
  { id: 'set.rebind', screen: 'set.ovladani', kind: 'action', tier: C, dino: 'N', label: 'Přemapovat klávesy' },
  { id: 'set.touchSize', screen: 'set.ovladani', kind: 'setting', type: 'range', tier: C, dino: 'N', label: 'Velikost dotykových tlačítek', scope: 'hned', min: 80, max: 140, step: 10, def: 100 },
  { id: 'set.swipe', screen: 'set.ovladani', kind: 'setting', type: 'toggle', tier: C, dino: 'D*', label: 'Gesta tahem', scope: 'hned', def: true, note: 'V Dinošovi vždy zapnutá.' },
  { id: 'set.mirror', screen: 'set.ovladani', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Prohodit strany tlačítek', scope: 'hned', def: false },
  { id: 'set.vibration', screen: 'set.ovladani', kind: 'setting', type: 'toggle', tier: C, dino: 'N', label: 'Vibrace', scope: 'hned', when: 'zařízení vibrace umí' },
  { id: 'set.gamepad', screen: 'set.ovladani', kind: 'info', tier: C, dino: 'N', label: 'Gamepad', note: 'Stav připojení a přiřazení tlačítek.' },

  // ── Nastavení · Svět (volby konkrétní hry) ─────────────────────────────────
  { id: 'set.world.weather', screen: 'set.svet', kind: 'setting', type: 'select', tier: C, dino: 'D', label: 'Počasí', scope: 'hned' },
  { id: 'set.world.daylight', screen: 'set.svet', kind: 'setting', type: 'select', tier: C, dino: 'D', label: 'Denní doba', scope: 'hned' },
  { id: 'set.world.timeScale', screen: 'set.svet', kind: 'setting', type: 'select', tier: C, dino: 'D', label: 'Rychlost času světa', scope: 'hned' },

  // ── Nastavení · Data ───────────────────────────────────────────────────────
  { id: 'set.reset', screen: 'set.data', kind: 'action', tier: A, dino: 'N', label: 'Obnovit výchozí nastavení', danger: true },
  { id: 'set.storage', screen: 'set.data', kind: 'info', tier: A, dino: 'N', label: 'Stav ukládání', note: '„Uloženo“, nebo varování, že se v tomto prostředí nic neuchová.' },
  { id: 'set.clearRecords', screen: 'set.data', kind: 'action', tier: B, dino: 'N', label: 'Smazat rekordy', danger: true },
  { id: 'set.export', screen: 'set.data', kind: 'action', tier: C, dino: 'N', label: 'Zálohovat data do souboru' },
  { id: 'set.import', screen: 'set.data', kind: 'action', tier: C, dino: 'N', label: 'Obnovit data ze souboru', danger: true },

  // ── Jak hrát ───────────────────────────────────────────────────────────────
  { id: 'help.controls', screen: 'help', kind: 'info', tier: A, dino: 'D', label: 'Ovládání', note: 'Generuje se z mapy vstupů, ne ručně.' },
  { id: 'help.goal', screen: 'help', kind: 'info', tier: A, dino: 'D*', label: 'Cíl a pravidla', note: 'Dvě až tři věty.' },
  { id: 'help.elements', screen: 'help', kind: 'info', tier: B, dino: 'D', label: 'Průvodce prvky hry', note: 'Z dat hry: překážka, jak ji zvládnout, odkdy se objevuje.' },
  { id: 'help.modes', screen: 'help', kind: 'info', tier: B, dino: 'D', label: 'Režimy' },
  { id: 'help.tips', screen: 'help', kind: 'info', tier: C, dino: 'D', label: 'Tipy' },
  { id: 'help.try', screen: 'help', kind: 'action', tier: C, dino: 'N', label: 'Vyzkoušet v klidném režimu' },

  // ── Rekordy a statistiky ───────────────────────────────────────────────────
  { id: 'rec.best', screen: 'records', kind: 'info', tier: B, dino: 'D*', label: 'Rekord pro každou obtížnost', note: 'Dinoš ukazuje jen ten pro právě zvolenou.' },
  { id: 'rec.last', screen: 'records', kind: 'info', tier: C, dino: 'N', label: 'Posledních deset běhů' },
  { id: 'rec.totals', screen: 'records', kind: 'info', tier: C, dino: 'N', label: 'Součty za celou dobu' },
  { id: 'rec.achievements', screen: 'records', kind: 'info', tier: C, dino: 'N', label: 'Úspěchy' },

  // ── Průvodce ───────────────────────────────────────────────────────────────
  { id: 'col.entries', screen: 'collection', kind: 'info', tier: C, dino: 'D*', label: 'Karty prvků s obrázkem', note: 'Dinoš: katalog 43 modelů a 10 drobností ve Vývojáři.' },
  { id: 'col.unlock', screen: 'collection', kind: 'info', tier: C, dino: 'D*', label: 'Odemykání podle postupu' },

  // ── O hře ──────────────────────────────────────────────────────────────────
  { id: 'about.version', screen: 'about', kind: 'info', tier: A, dino: 'D*', label: 'Verze a datum sestavení' },
  { id: 'about.credits', screen: 'about', kind: 'info', tier: A, dino: 'N', label: 'Autoři a nástroje' },
  { id: 'about.licences', screen: 'about', kind: 'info', tier: A, dino: 'N', label: 'Původ a licence dat', note: 'Z docs/DATA_SOURCES.md, ne z paměti.' },
  { id: 'about.changes', screen: 'about', kind: 'info', tier: C, dino: 'N', label: 'Co je nového' },

  // ── Ve hře ─────────────────────────────────────────────────────────────────
  { id: 'hud.score', screen: 'hud', kind: 'info', tier: A, dino: 'D', label: 'Skóre' },
  { id: 'hud.progress', screen: 'hud', kind: 'info', tier: A, dino: 'D', label: 'Hlavní míra postupu', note: 'Dinoš: metry.' },
  { id: 'hud.countdown', screen: 'hud', kind: 'info', tier: A, dino: 'D', label: 'Odpočet před startem' },
  { id: 'hud.touch', screen: 'hud', kind: 'info', tier: A, dino: 'D', label: 'Dotyková tlačítka', when: 'dotykové zařízení' },
  { id: 'hud.mode', screen: 'hud', kind: 'info', tier: B, dino: 'D', label: 'Režim a obtížnost' },
  { id: 'hud.combo', screen: 'hud', kind: 'info', tier: B, dino: 'D', label: 'Kombo' },
  { id: 'hud.status', screen: 'hud', kind: 'info', tier: B, dino: 'D', label: 'Stav hráče', note: 'Dinoš: štít.' },
  { id: 'hud.hint', screen: 'hud', kind: 'info', tier: B, dino: 'D', label: 'Kontextová rada' },
  { id: 'hud.toasts', screen: 'hud', kind: 'info', tier: B, dino: 'D', label: 'Hlášky', note: 'Nejvýš tři, nikdy přes kartu pauzy.' },
  { id: 'hud.speed', screen: 'hud', kind: 'info', tier: C, dino: 'D', label: 'Rychlost' },

  // ── Pauza ──────────────────────────────────────────────────────────────────
  { id: 'pause.resume', screen: 'pause', kind: 'action', tier: A, dino: 'D', label: 'Pokračovat' },
  { id: 'pause.restart', screen: 'pause', kind: 'action', tier: A, dino: 'D*', label: 'Začít znovu', danger: true, note: 'V Dinošovi bez potvrzení.' },
  { id: 'pause.settings', screen: 'pause', kind: 'action', tier: A, dino: 'D', label: 'Nastavení' },
  { id: 'pause.toMenu', screen: 'pause', kind: 'action', tier: A, dino: 'D*', label: 'Do menu', danger: true, note: 'Dinoš: „Do háje“, bez potvrzení.' },
  { id: 'pause.help', screen: 'pause', kind: 'action', tier: B, dino: 'N', label: 'Jak hrát' },
  { id: 'pause.keys', screen: 'pause', kind: 'info', tier: B, dino: 'D', label: 'Připomenutí kláves pro návrat' },
  { id: 'pause.dev', screen: 'pause', kind: 'action', tier: B, dino: 'D', label: 'Vývojář', dev: true },
  { id: 'pause.stats', screen: 'pause', kind: 'info', tier: C, dino: 'N', label: 'Dosavadní výsledek běhu' },

  // ── Výsledky ───────────────────────────────────────────────────────────────
  { id: 'res.title', screen: 'results', kind: 'info', tier: A, dino: 'D', label: 'Nadpis: konec, nebo nový rekord' },
  { id: 'res.stats', screen: 'results', kind: 'info', tier: A, dino: 'D', label: 'Čísla běhu', note: 'Čtyři až šest údajů. Dinoš: vzdálenost, skóre, jantar, kousnutí.' },
  { id: 'res.again', screen: 'results', kind: 'action', tier: A, dino: 'D', label: 'Hrát znovu', note: 'Výchozí fokus; Enter spustí další běh.' },
  { id: 'res.toMenu', screen: 'results', kind: 'action', tier: A, dino: 'D', label: 'Do menu' },
  { id: 'res.reason', screen: 'results', kind: 'info', tier: B, dino: 'D', label: 'Důvod konce s radou' },
  { id: 'res.best', screen: 'results', kind: 'info', tier: B, dino: 'D*', label: 'Srovnání s rekordem' },
  { id: 'res.share', screen: 'results', kind: 'action', tier: C, dino: 'N', label: 'Sdílet výsledek' },
  { id: 'res.seed', screen: 'results', kind: 'info', tier: C, dino: 'N', label: 'Seed běhu', note: 'Aby šel běh zopakovat.' },

  // ── Systémová okna ─────────────────────────────────────────────────────────
  { id: 'sys.confirm', screen: 'system', kind: 'info', tier: A, dino: 'N', label: 'Potvrzení ničivé akce', note: 'Výchozí fokus na „Zpět“.' },
  { id: 'sys.rotate', screen: 'system', kind: 'info', tier: B, dino: 'N', label: 'Výzva k otočení zařízení', when: 'hra vyžaduje jednu orientaci' },
  { id: 'sys.focusLost', screen: 'system', kind: 'info', tier: A, dino: 'D', label: 'Pauza při ztrátě okna' },

  // ── Vývojář ────────────────────────────────────────────────────────────────
  { id: 'dev.status', screen: 'dev', kind: 'info', tier: B, dino: 'D', label: 'Stavový řádek', dev: true, note: 'Vykreslování, snímky, počty objektů.' },
  { id: 'dev.seek', screen: 'dev', kind: 'action', tier: B, dino: 'D', label: 'Skok na úsek nebo vzdálenost', dev: true },
  { id: 'dev.invulnerable', screen: 'dev', kind: 'setting', type: 'toggle', tier: B, dino: 'D', label: 'Nezranitelnost', dev: true, persist: false, scope: 'hned' },
  { id: 'dev.colliders', screen: 'dev', kind: 'setting', type: 'toggle', tier: B, dino: 'D', label: 'Zobrazit kolize', dev: true, persist: false, scope: 'hned' },
  { id: 'dev.timeScale', screen: 'dev', kind: 'setting', type: 'select', tier: B, dino: 'D*', label: 'Měřítko času', dev: true, persist: false, scope: 'hned' },
  { id: 'dev.probe', screen: 'dev', kind: 'info', tier: B, dino: 'N', label: 'Přehled voleb: nastaveno × skutečnost', dev: true },
  { id: 'dev.unwired', screen: 'dev', kind: 'info', tier: B, dino: 'N', label: 'Nezapojené položky katalogu', dev: true },
  { id: 'dev.reset', screen: 'dev', kind: 'action', tier: B, dino: 'D', label: 'Obnovit výchozí', dev: true },
  { id: 'dev.spawn', screen: 'dev', kind: 'action', tier: C, dino: 'D', label: 'Vložit prvek před hráče', dev: true },
  { id: 'dev.clear', screen: 'dev', kind: 'action', tier: C, dino: 'D', label: 'Odstranit překážky', dev: true },
  { id: 'dev.generator', screen: 'dev', kind: 'setting', type: 'toggle', tier: C, dino: 'D', label: 'Generovat překážky', dev: true, persist: false, scope: 'hned' },
  { id: 'dev.world', screen: 'dev', kind: 'info', tier: C, dino: 'D', label: 'Přepínače světa', dev: true, note: 'Dinoš: počasí, čas, vrstvy oblohy, hustota vegetace.' },
  { id: 'dev.audio', screen: 'dev', kind: 'info', tier: C, dino: 'D', label: 'Hudební režie', dev: true },
  { id: 'dev.assets', screen: 'dev', kind: 'info', tier: C, dino: 'D', label: 'Katalog modelů', dev: true },
];

export const ARCADE_CATALOG = { id: CATALOG_ID, version: CATALOG_VERSION, tiers: TIERS, screens: SCREENS, items: ITEMS };
