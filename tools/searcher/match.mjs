// xSearcher: rozložení dotazu na slova a řazení výsledků. Rozhraní zdrojů jsou anglická; běžná česká
// slova o materiálech se přeloží (jen slovník níže, nic se nehádá).

const CS_EN = {
  beton: 'concrete', betonova: 'concrete', betonovy: 'concrete',
  cihla: 'brick', cihly: 'brick', cihlova: 'brick', cihlovy: 'brick',
  drevo: 'wood', drevena: 'wood', dreveny: 'wood', prkna: 'planks', prkno: 'planks', parkety: 'parquet',
  kov: 'metal', kovova: 'metal', kovovy: 'metal', plech: 'metal', ocel: 'steel', ocelova: 'steel', zelezo: 'iron',
  rez: 'rust', rezava: 'rust', rezavy: 'rust', rezave: 'rust',
  dlazdice: 'tiles', dlazba: 'tiles', kachlicky: 'tiles', obklad: 'tiles',
  omitka: 'plaster', stena: 'wall', zed: 'wall', podlaha: 'floor', strop: 'ceiling',
  kamen: 'stone', kamenna: 'stone', kamenny: 'stone', skala: 'rock', dlazebni: 'paving',
  hlina: 'dirt', zemina: 'soil', blato: 'mud', pisek: 'sand', strk: 'gravel', asfalt: 'asphalt',
  guma: 'rubber', linoleum: 'linoleum', latka: 'fabric', koberec: 'carpet', kuze: 'leather', sklo: 'glass', plast: 'plastic',
  natreny: 'painted', natrena: 'painted', barva: 'paint', oprysky: 'peeling', loupajici: 'peeling',
  stary: 'old', stara: 'old', stare: 'old', opotrebeny: 'worn', opotrebena: 'worn', spinavy: 'dirty', spinava: 'dirty',
  poskrabany: 'scratched', poskrabana: 'scratched', mech: 'moss', mokry: 'wet', prumyslovy: 'industrial', prumyslova: 'industrial',
};

/** Slova dotazu malými písmeny bez diakritiky; česká slova ze slovníku přeložená. */
export function tokens(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function translate(query) {
  return tokens(query).map((w) => CS_EN[w] ?? w);
}

/** Slovo odpovídá, když je stejné nebo jedno je začátkem druhého (aspoň 4 znaky): tile × tiles, wood × wooden. */
const same = (t, w) => t === w || (w.length >= 4 && t.length >= 4 && (t.startsWith(w) || w.startsWith(t)));

const FIELDS = [
  ['title', 3],
  ['tags', 2],
  ['categories', 2],
  ['id', 1],
  ['description', 0.5],
];

/** Skóre assetu: součet nejlepší váhy pro každé slovo; když některé slovo nesedí nikde, 0. */
export function score(asset, words) {
  const fields = FIELDS.map(([k, weight]) => [weight, [].concat(asset[k] ?? []).flatMap(tokens)]);
  let total = 0;
  for (const w of words) {
    let best = 0;
    for (const [weight, toks] of fields) if (weight > best && toks.some((t) => same(t, w))) best = weight;
    if (!best) return 0;
    total += best;
  }
  return total;
}

/** strict: zahodit assety, ve kterých některé slovo dotazu není (zdroj vrací všechno, Poly Haven). */
export function rank(assets, words, { strict = true } = {}) {
  const out = [];
  assets.forEach((a, order) => {
    const s = score(a, words);
    if (s > 0 || !strict) out.push({ ...a, score: s, order });
  });
  return out.sort((x, y) => y.score - x.score || y.popularity - x.popularity || x.order - y.order);
}
