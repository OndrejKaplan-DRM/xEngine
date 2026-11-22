// Obrazovka nastavení: vykreslí se sama z deklarací (Shell S1). Žádná položka tu není natvrdo.
// Řádky navigace značí atribut data-navrow; prvky, na které jde fokus, mají data-nav.

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function buildSettingsScreen(settings, t, { onBack }) {
  const screen = el('section', 'sh-screen sh-settings');
  screen.dataset.screen = 'settings';
  screen.hidden = true;
  screen.append(el('h2', 'sh-heading sh-heading-small', t.settings));

  const tabs = el('div', 'sh-tabs');
  tabs.dataset.navrow = '';
  const list = el('div', 'sh-list');
  const status = el('p', 'sh-status');
  const footer = el('nav', 'sh-footer');
  footer.dataset.navrow = '';
  screen.append(tabs, list, status, footer);

  let page = settings.pages[0];
  const rows = new Map(); // id → funkce, která srovná ovládací prvek s hodnotou

  const valueText = (d, v) => (d.format ? d.format(v) : String(v));

  function buildRow(d) {
    const row = el('div', 'sh-row');
    row.dataset.navrow = '';
    row.dataset.setting = d.id;
    row.append(el('span', 'sh-label', d.label));
    const control = el('div', 'sh-control');
    row.append(control);

    if (d.type === 'range') {
      const input = el('input', 'sh-range');
      input.type = 'range';
      input.min = d.min;
      input.max = d.max;
      input.step = d.step || 1;
      input.dataset.nav = '';
      input.setAttribute('aria-label', d.label);
      const out = el('output', 'sh-value');
      input.addEventListener('input', () => settings.set(d.id, Number(input.value)));
      control.append(input, out);
      rows.set(d.id, () => {
        input.value = settings.get(d.id);
        out.textContent = valueText(d, settings.get(d.id));
      });
    } else if (d.type === 'select') {
      const buttons = d.options.map((o) => {
        const b = el('button', 'sh-opt', o.label);
        b.type = 'button';
        b.dataset.nav = '';
        b.addEventListener('click', () => settings.set(d.id, o.value));
        control.append(b);
        return [o.value, b];
      });
      rows.set(d.id, () => {
        for (const [value, b] of buttons) b.setAttribute('aria-pressed', String(value === settings.get(d.id)));
      });
    } else if (d.type === 'toggle') {
      const b = el('button', 'sh-opt sh-toggle');
      b.type = 'button';
      b.dataset.nav = '';
      b.addEventListener('click', () => settings.set(d.id, !settings.get(d.id)));
      control.append(b);
      rows.set(d.id, () => {
        const on = settings.get(d.id);
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? t.on : t.off;
      });
    } else {
      const b = el('button', 'sh-opt', d.actionLabel || d.label);
      b.type = 'button';
      b.dataset.nav = '';
      b.addEventListener('click', () => settings.run(d.id));
      control.append(b);
    }
    return row;
  }

  function renderPage() {
    rows.clear();
    list.replaceChildren(...settings.defs.filter((d) => d.page === page && settings.visible(d)).map(buildRow));
    for (const sync of rows.values()) sync();
    for (const tab of tabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.page === page));
  }

  function renderTabs() {
    tabs.replaceChildren(
      ...settings.pages.map((p) => {
        const tab = el('button', 'sh-tab', t.pages[p] || p);
        tab.type = 'button';
        tab.dataset.page = p;
        tab.dataset.nav = '';
        tab.addEventListener('click', () => {
          page = p;
          renderPage();
        });
        return tab;
      }),
    );
    tabs.hidden = settings.pages.length < 2;
  }

  const defaults = el('button', 'sh-btn sh-btn-small', t.defaults);
  defaults.type = 'button';
  defaults.dataset.id = 'defaults';
  defaults.dataset.nav = '';
  defaults.addEventListener('click', () => settings.reset());
  const back = el('button', 'sh-btn sh-btn-small', t.back);
  back.type = 'button';
  back.dataset.id = 'back';
  back.dataset.nav = '';
  back.addEventListener('click', onBack);
  footer.append(defaults, back);

  let statusTimer = 0;
  function showStatus() {
    clearTimeout(statusTimer);
    if (!settings.persistent) {
      status.textContent = t.notPersistent;
      status.dataset.kind = 'warn';
      return;
    }
    status.textContent = t.saved;
    status.dataset.kind = 'ok';
    statusTimer = setTimeout(() => (status.textContent = ''), 1500);
  }
  function showStorageState() {
    if (!settings.persistent) {
      status.textContent = t.notPersistent;
      status.dataset.kind = 'warn';
    }
  }

  settings.onChange((id) => {
    if (id === '*') renderPage();
    else rows.get(id)?.();
    // „Uloženo“ jen u položek, které se opravdu ukládají
    if (id === '*' || settings.defs.find((d) => d.id === id)?.persist !== false) showStatus();
  });

  renderTabs();
  renderPage();
  showStorageState();

  return {
    screen,
    /** Při každém otevření: stránky a podmínky `when` se mohly změnit. */
    open() {
      renderTabs();
      if (!settings.pages.includes(page)) page = settings.pages[0];
      renderPage();
      showStorageState();
    },
  };
}
