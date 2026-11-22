// Deklarace nastavení pro Shell (Level 1, 02_SHELL, oddíl 2). Každá položka má apply (provede změnu) a probe
// (co engine skutečně má); položku bez ověřitelného účinku Shell nezaregistruje.

import { PROFILES } from '../play/profiles.js';

export function settingsDefs({ game, dev }) {
  const { render, input, session } = game;
  return [
    {
      id: 'fov',
      page: 'obraz',
      label: 'Zorné pole',
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
      id: 'scale',
      page: 'obraz',
      label: 'Měřítko vykreslení',
      type: 'range',
      min: 50,
      max: 150,
      step: 5,
      def: 100,
      format: (v) => `${v} %`,
      apply: (v) => render.setScale(v / 100),
      probe: () => Math.round(render.scale * 100),
    },
    {
      id: 'lights',
      page: 'obraz',
      label: 'Světla za běhu',
      type: 'select',
      def: 8,
      options: [4, 6, 8, 12].map((n) => ({ value: n, label: String(n) })),
      apply: (v) => render.setLightBudget(v),
      probe: () => render.lightBudget,
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
