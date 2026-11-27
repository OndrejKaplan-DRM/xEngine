// Deklarace nastavení pro Shell (Level 1, 02_SHELL, oddíl 2). Každá položka má apply (provede změnu) a probe
// (co engine skutečně má); položku bez ověřitelného účinku Shell nezaregistruje.

import { PROFILES } from '../play/profiles.js';
import { ROWS } from '../render/rows.js';

export function settingsDefs({ game, dev }) {
  const { render, input, session } = game;
  return [
    {
      id: 'fov',
      page: 'obraz',
      label: 'Zorné pole (vodorovně při 4 : 3; nejvýš 120° na šířku)',
      type: 'range',
      min: 60,
      max: 110,
      step: 1,
      def: 90,
      format: (v) => `${v}°`,
      apply: (v) => render.setFov(v),
      probe: () => render.baseFov,
    },
    {
      id: 'rows',
      page: 'obraz',
      label: 'Vnitřní rozlišení',
      type: 'select',
      def: 768,
      options: ROWS.map((n) => ({ value: n, label: `${n} řádků` })),
      apply: (v) => render.setRows(v),
      probe: () => render.size[1],
    },
    {
      id: 'aa',
      page: 'obraz',
      label: 'Vyhlazování hran',
      type: 'toggle',
      def: false, // na T460 stojí 4,4 až 6,2 ms na snímek (xBench 0.2, 22. 11. 2026)
      apply: (v) => render.setAntialias(v),
      probe: () => render.antialias,
    },
    {
      id: 'lightGrid',
      page: 'obraz',
      label: 'Mřížka světla (platí od nové hry)',
      type: 'select',
      def: 0.5, // kontrakt; 0,25 m dává jemnější stíny za čtyřnásobek vzorků a trojúhelníků a delší načtení
      options: [
        { value: 0.5, label: '0,5 m' },
        { value: 0.25, label: '0,25 m (jemnější stíny)' },
      ],
      apply: (v) => {
        game.world.lightCell = v;
      },
      probe: () => game.world.lightCell,
    },
    {
      id: 'sens',
      page: 'ovladani',
      label: 'Citlivost myši',
      type: 'range',
      min: 0.2,
      max: 3,
      step: 0.05,
      def: 1,
      format: (v) => v.toFixed(2),
      apply: (v) => (input.sensitivity = v),
      probe: () => input.sensitivity,
    },
    {
      id: 'zoomMode',
      page: 'ovladani',
      label: 'Přiblížení zbraně (klávesa Z)',
      type: 'select',
      def: 'toggle', // Ondřej 27. 11., volba 2 b
      options: [
        { value: 'hold', label: 'Držet' },
        { value: 'toggle', label: 'Přepínat' },
      ],
      apply: (v) => {
        game.weapons.zoomMode = v;
      },
      probe: () => game.weapons.zoomMode,
    },
    {
      id: 'doorsAway',
      page: 'hra',
      label: 'Dveře se otvírají od hráče (platí od nové hry)',
      type: 'toggle',
      // Ondřejova volba z 24. 11. 2026. Dokud dveře nemají rozsah na obě strany v datech (návrh N-109), rozšiřuje ho
      // hra sama (src/world/swing.js); vypnuto = přesně podle dat balíku.
      def: true,
      apply: (v) => {
        game.entities.doorsAway = !!v;
      },
      probe: () => game.entities.doorsAway,
    },
    {
      id: 'profile',
      page: 'hra',
      label: 'Profil pohybu',
      type: 'select',
      def: 'level',
      persist: false, // vývojářská volba: po novém načtení zase rozhoduje level
      options: [{ value: 'level', label: 'Podle levelu' }, ...Object.values(PROFILES).map((p) => ({ value: p.id, label: p.label }))],
      when: () => dev,
      apply: (v) => session.setProfile(v),
      probe: () => session.profileChoice,
    },
  ];
}
