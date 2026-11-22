// xSpace, verze formátu 1: popis datových souborů, které spojují nástroje (xForge, xSearcher,
// generátory, xDesigner) s enginem. Tento soubor je JEDINÁ pravda o polích: čte ho validátor
// (validate.js) a generuje se z něj dokument docs/02a_XSPACE_pole.md (tools/xspace-doc.mjs).
// Soubor patří základu; změna jen přes návrh v docs/navrhy a zvýšení XSPACE_VERSION.

export const XSPACE_VERSION = 1;

// ---- výčty -----------------------------------------------------------------------------

/** Povrch: řídí zvuk kroků a zásahů, částice a odrazivost pro akustiku. */
export const SURFACES = ['concrete', 'stone', 'metal', 'wood', 'glass', 'tile', 'plastic', 'rubber', 'carpet', 'dirt', 'grass', 'water', 'flesh'];
/** Licence, se kterými smí asset do balíku. „own“ = vlastní dílo vzniklé v projektu. */
export const LICENSES = ['CC0-1.0', 'own', 'CC-BY-4.0', 'MIT', 'OFL-1.1'];
/** Licence bez povinností vůči třetím stranám; jen ty smí do balíku s příznakem free = true. */
export const FREE_LICENSES = ['CC0-1.0', 'own'];
export const MATERIAL_MODELS = ['lit', 'unlit', 'emissive'];
export const BRUSH_SHAPES = ['box', 'wedge'];
export const RISE_DIRS = ['+x', '-x', '+z', '-z'];
export const FACE_KEYS = ['+x', '-x', '+y', '-y', '+z', '-z'];
export const PART_SHAPES = ['box', 'cyl', 'mesh'];
export const COLLIDER_SHAPES = ['box', 'cyl', 'ball', 'hull', 'mesh'];
export const COLLIDER_GROUPS = ['world', 'prop', 'debris', 'trigger'];
export const JOINT_TYPES = ['hinge', 'slider'];
export const JOINT_DRIVES = ['manual', 'motor', 'both'];
export const BODY_TYPES = ['static', 'kinematic', 'dynamic'];
export const INTERACT_KINDS = ['button', 'switch', 'lever', 'valve', 'door', 'drawer', 'terminal', 'station', 'pickup', 'grab'];
export const LIGHT_TYPES = ['point', 'spot', 'sun'];
export const LIGHT_STYLES = ['steady', 'flicker', 'pulse', 'strobe'];
export const PROFILES = ['arena', 'real'];
export const TRIGGER_EVENTS = ['enter', 'exit'];
export const SPAWN_KINDS = ['player', 'enemy', 'item'];
/** Vestavěné cíle vstupů, které nejsou entitou levelu. */
export const LEVEL_TARGETS = { '@level': ['checkpoint', 'complete', 'message'] };

/** Meze, které hlídá validátor (chyba) a doporučení (varování). Čísla jsou výchozí, viz docs/06_ROZPOCTY.md. */
export const LIMITS = {
  idMax: 48,
  brushMinSize: 0.01, // m, kvádry levelu a buňky
  partMinSize: 0.001, // m, díly a kolize prefabu
  coordMax: 4096, // m od počátku; dál klesá přesnost float32 pod 0,5 mm
  portalPlaneEps: 0.02, // m
  sliderMax: 5, // m
  hingeMaxTurns: 8,
  warnEntitiesPerCell: 150,
  warnBrushesPerCell: 400,
  warnPrefabTris: 5000,
  overlapCheckMax: 4000, // nad tento počet kvádrů se překryvy nehledají (kvadratická cena)
};

// ---- stavebnice popisu -----------------------------------------------------------------

const id = (doc, o = {}) => ({ t: 'id', doc, ...o });
const str = (doc, o = {}) => ({ t: 'str', doc, ...o });
const num = (doc, o = {}) => ({ t: 'num', doc, ...o });
const int = (doc, o = {}) => ({ t: 'int', doc, ...o });
const bool = (doc, o = {}) => ({ t: 'bool', doc, ...o });
const vec3 = (doc, o = {}) => ({ t: 'vec3', doc, ...o });
const color = (doc, o = {}) => ({ t: 'color', doc, ...o });
const en = (values, doc, o = {}) => ({ t: 'enum', values, doc, ...o });
const arr = (of, doc, o = {}) => ({ t: 'arr', of, doc, ...o });
const obj = (fields, doc, o = {}) => ({ t: 'obj', fields, doc, ...o });
const map = (of, doc, o = {}) => ({ t: 'map', of, doc, ...o });
const ref = (to, doc, o = {}) => ({ t: 'ref', to, doc, ...o });
const konst = (value, doc) => ({ t: 'const', value, doc, req: true });
const R = (d) => ({ ...d, req: true });

const head = (kind) => ({
  xspace: konst(XSPACE_VERSION, 'verze formátu xSpace'),
  kind: konst(kind, 'druh souboru'),
});

const bounds = (doc) =>
  obj({ min: R(vec3('nejmenší roh [x, y, z] v metrech')), max: R(vec3('největší roh [x, y, z] v metrech')) }, doc);

const ioLink = obj(
  {
    on: R(str('výstup této entity nebo spouštěče (např. opened, pressed, enter)')),
    target: R(str('id cílové entity levelu, nebo vestavěný cíl @level')),
    input: R(str('vstup cíle (např. open, turnOn)')),
    delay: num('zpoždění v sekundách herního času', { min: 0, max: 600 }),
    once: bool('spojení se provede jen jednou'),
    param: { t: 'any', doc: 'pevná hodnota pro vstup; bez ní se předá hodnota výstupu' },
  },
  'spojení výstup → vstup (dědictví Half-Life)',
);

const source = obj(
  {
    tool: R(str('nástroj, který soubor vyrobil (xforge, xsearcher, gen, designer, golden, rucne)')),
    generator: str('jméno generátoru nebo skriptu'),
    params: { t: 'any', doc: 'parametry generátoru (pro opakovatelnost)' },
    seed: int('seed generátoru'),
    license: R(en(LICENSES, 'licence')),
    author: str('autor nebo původní zdroj'),
    url: str('adresa zdroje, pokud asset pochází z webu'),
    date: str('datum vzniku nebo stažení, RRRR-MM-DD'),
  },
  'původ a licence',
);

// ---- součásti prefabu (components) -----------------------------------------------------

/** Schémata součástí. Nová součást = nový záznam zde + návrh v docs/navrhy. */
export const COMPONENTS = {
  physics: obj(
    {
      body: R(en(BODY_TYPES, 'druh tělesa')),
      mass: num('hmotnost v kg (jen dynamic)', { min: 0.01, max: 100000 }),
      friction: num('tření', { min: 0, max: 4 }),
      restitution: num('odrazivost', { min: 0, max: 1 }),
      ccd: bool('průběžná detekce kolizí pro rychlá tělesa'),
    },
    'fyzikální těleso (Rapier)',
  ),
  interact: obj(
    {
      kind: R(en(INTERACT_KINDS, 'druh interakce; určuje chování a nabídnuté vstupy a výstupy')),
      joint: ref('joint', 'kloub, kterým se interakce hýbe'),
      prompt: str('krátký popis akce pro hráče („Otevřít“)'),
      range: num('dosah v metrech', { min: 0.2, max: 6 }),
      manipulate: bool('jde ovládat tažením myši při držení tlačítka (jemná motorika)'),
      station: obj(
        {
          eye: R(vec3('poloha oka v prostoru prefabu')),
          look: R(vec3('bod, na který se kamera dívá, v prostoru prefabu')),
          fov: num('svislé zorné pole ve stupních', { min: 20, max: 110 }),
        },
        'ukotvení kamery pro klidný režim (stůl, panel, terminál)',
      ),
    },
    'co s předmětem může hráč dělat',
  ),
  health: obj(
    {
      hp: R(num('body výdrže', { min: 1, max: 1000000 })),
      surface: en(SURFACES, 'povrch pro zvuk a částice zásahu; jinak se bere z materiálu'),
      breakInto: ref('prefab', 'prefab trosek, který entitu po zničení nahradí'),
    },
    'zničitelnost',
  ),
  light: obj(
    {
      type: R(en(LIGHT_TYPES, 'druh světla')),
      color: R(color('barva')),
      intensity: R(num('svítivost (jednotky enginu)', { min: 0, max: 1000 })),
      range: num('dosah v metrech', { min: 0.1, max: 200 }),
      angle: num('úhel kužele ve stupních (spot)', { min: 1, max: 170 }),
      node: ref('node', 'uzel kostry, na kterém světlo sedí'),
      cast: bool('vrhá stín'),
      style: en(LIGHT_STYLES, 'styl (dědictví světelných stylů Quake)'),
      on: bool('výchozí stav'),
    },
    'světlo nesené prefabem',
  ),
  sound: obj(
    {
      loop: str('id smyčky, která hraje, dokud entita existuje'),
      events: map(str('id zvuku'), 'výstup entity → id zvuku'),
    },
    'zvuky',
  ),
  pickup: obj(
    {
      item: R(str('id předmětu')),
      amount: num('množství', { min: 0, max: 100000 }),
    },
    'sebratelný předmět',
  ),
  screen: obj(
    {
      node: R(ref('node', 'uzel, na kterém obrazovka sedí')),
      size: R({ t: 'vec2', doc: 'šířka a výška plochy v metrech' }),
      res: R({ t: 'vec2', doc: 'rozlišení v pixelech' }),
      app: R(str('id aplikace terminálu')),
    },
    'obrazovka ve světě, na kterou jde v klidném režimu klikat a psát (dědictví Doom 3)',
  ),
};

// ---- formáty souborů -------------------------------------------------------------------

const material = obj(
  {
    model: R(en(MATERIAL_MODELS, 'osvětlovací model')),
    color: R(color('základní barva (násobí texturu)')),
    albedo: str('cesta k textuře barvy, relativně k balíku'),
    normal: str('cesta k normálové mapě'),
    emissive: color('barva vlastního svitu'),
    emissiveStrength: num('síla vlastního svitu', { min: 0, max: 100 }),
    rough: num('drsnost 0–1', { min: 0, max: 1 }),
    metal: num('kovovost 0–1', { min: 0, max: 1 }),
    uvScale: num('kolik metrů světa pokryje jedna dlaždice textury', { min: 0.01, max: 100 }),
    surface: R(en(SURFACES, 'povrch pro zvuk, částice a akustiku')),
    alphaTest: num('práh průhlednosti 0–1', { min: 0, max: 1 }),
    twoSided: bool('kreslit obě strany'),
  },
  'materiál',
);

const rig = obj(
  {
    nodes: R(
      arr(
        obj({
          id: R(id('id uzlu, jedinečné v prefabu')),
          parent: ref('node', 'nadřazený uzel; kořen ho nemá'),
          pos: vec3('poloha vůči rodiči v metrech'),
          rot: vec3('natočení vůči rodiči ve stupních, pořadí YXZ'),
        }),
        'uzly kostry; první je kořen',
        { minLen: 1 },
      ),
    ),
    joints: arr(
      obj({
        id: R(id('id kloubu')),
        node: R(ref('node', 'uzel, kterým kloub hýbe (vůči jeho rodiči)')),
        type: R(en(JOINT_TYPES, 'hinge = otáčení ve stupních, slider = posuv v metrech')),
        axis: R(vec3('osa v prostoru rodiče uzlu, jednotkový vektor')),
        min: R(num('dolní mez (stupně nebo metry)')),
        max: R(num('horní mez (stupně nebo metry)')),
        rest: num('klidová poloha; výchozí je min'),
        detents: arr(num('poloha'), 'polohy, do kterých kloub zaskakuje'),
        spring: num('tuhost návratu do klidové polohy; 0 = bez pružiny', { min: 0, max: 10000 }),
        damping: num('tlumení', { min: 0, max: 1000 }),
        speed: num('rychlost pohonu (stupně nebo metry za sekundu)', { min: 0.001, max: 10000 }),
        drive: en(JOINT_DRIVES, 'kdo kloubem hýbe: hráč, pohon, nebo oba'),
      }),
      'klouby = stupně volnosti předmětu',
    ),
    clips: arr(obj({ id: R(id('id klipu (idle, walk, attack1…)')), file: R(str('cesta k souboru animace')) }), 'animační klipy (tvorové)'),
  },
  'kostra: uzly a klouby. Každý pohyblivý předmět i tvor začíná kostrou.',
);

const part = obj(
  {
    node: R(ref('node', 'uzel kostry, ke kterému díl patří')),
    shape: R(en(PART_SHAPES, 'tvar')),
    min: vec3('box: nejmenší roh v prostoru uzlu'),
    max: vec3('box: největší roh v prostoru uzlu'),
    center: vec3('cyl: střed'),
    radius: num('cyl: poloměr', { min: 0.001, max: 100 }),
    height: num('cyl: výška', { min: 0.001, max: 100 }),
    axis: en(['x', 'y', 'z'], 'cyl: osa'),
    mesh: str('mesh: cesta k souboru .glb, volitelně #jménoUzlu'),
    mat: ref('material', 'materiál; u mesh volitelný (bere se z glTF)'),
  },
  'viditelný díl',
);

const collider = obj(
  {
    node: R(ref('node', 'uzel kostry')),
    shape: R(en(COLLIDER_SHAPES, 'tvar')),
    min: vec3('box: nejmenší roh'),
    max: vec3('box: největší roh'),
    center: vec3('cyl, ball: střed'),
    radius: num('cyl, ball: poloměr', { min: 0.001, max: 100 }),
    height: num('cyl: výška', { min: 0.001, max: 100 }),
    axis: en(['x', 'y', 'z'], 'cyl: osa'),
    mesh: str('hull, mesh: cesta k souboru .glb, volitelně #jménoUzlu'),
    group: en(COLLIDER_GROUPS, 'kolizní skupina; výchozí world u static, jinak prop'),
  },
  'kolizní tvar',
);

export const FORMATS = {
  pack: obj(
    {
      ...head('pack'),
      id: R(id('id balíku')),
      title: R(str('název')),
      version: R(str('verze balíku, tvar X.Y.Z')),
      free: bool('balík obsahuje jen assety bez povinností (CC0, vlastní)'),
      requires: arr(id('id balíku'), 'balíky, ze kterých tento čerpá prefaby nebo materiály'),
      materials: str('cesta k souboru materiálů'),
      prefabs: arr(str('cesta'), 'soubory prefabů'),
      levels: arr(str('cesta'), 'soubory levelů'),
      assets: arr(
        obj({
          path: R(str('cesta k binárnímu souboru relativně k balíku')),
          bytes: R(int('velikost v bajtech', { min: 1 })),
          sha256: R(str('otisk SHA-256, 64 šestnáctkových znaků')),
          license: R(en(LICENSES, 'licence')),
          source: R(str('odkud soubor je (adresa, nebo skript, který ho vyrobil)')),
          author: str('autor'),
        }),
        'binární soubory balíku s původem a otiskem',
      ),
    },
    'manifest balíku (pack.json)',
  ),

  materials: obj(
    {
      ...head('materials'),
      materials: R(map(material, 'id materiálu → materiál')),
    },
    'soubor materiálů',
  ),

  prefab: obj(
    {
      ...head('prefab'),
      id: R(id('id prefabu, tvar <co>_<varianta>_<nn>')),
      title: R(str('název česky')),
      category: R(str('kategorie s tečkami (arch.door, prop.furniture, device.lab, creature.humanoid…)')),
      bounds: R(bounds('obal v prostoru prefabu')),
      rig: R(rig),
      parts: R(arr(part, 'viditelné díly', { minLen: 1 })),
      colliders: arr(collider, 'kolizní tvary'),
      components: obj(COMPONENTS, 'součásti'),
      inputs: arr(str('vstup'), 'vstupy, které entita přijímá'),
      outputs: arr(str('výstup'), 'výstupy, které entita vysílá'),
      tris: int('počet trojúhelníků nejvyšší úrovně detailu', { min: 0 }),
      source: R(source),
    },
    'prefab: znovupoužitelný předmět, zařízení nebo tvor',
  ),

  level: obj(
    {
      ...head('level'),
      id: R(id('id levelu')),
      title: R(str('název')),
      profile: R(en(PROFILES, 'výchozí mutace enginu: arena = svižná, real = klidná a přesná')),
      env: obj(
        {
          ambient: R(color('okolní světlo')),
          exposure: num('expozice před převodem do rozsahu displeje; výchozí 1', { min: 0.01, max: 100 }),
          fog: obj({ color: R(color('barva mlhy')), density: R(num('hustota', { min: 0, max: 1 })) }, 'mlha'),
          sky: str('id oblohy'),
          sun: obj({ dir: R(vec3('směr, odkud světlo svítí')), color: R(color('barva')), intensity: R(num('síla', { min: 0, max: 100 })) }, 'slunce nebo měsíc'),
        },
        'prostředí',
      ),
      cells: R(
        arr(
          obj({
            id: R(id('id buňky, předpona c_')),
            name: str('název pro mapu a vývojářské nástroje'),
            bounds: R(bounds('vnitřní objem buňky (vzduch), osově zarovnaný kvádr')),
            zone: str('akustické schéma'),
            ambient: color('okolní světlo buňky; jinak se bere z env'),
            isolated: bool('buňka záměrně není spojená portálem (tajná místnost, teleport)'),
          }),
          'buňky: místnosti a úseky, základ viditelnosti, zvuku a rozpočtů',
          { minLen: 1 },
        ),
      ),
      portals: arr(
        obj({
          id: R(id('id portálu, předpona p_')),
          a: R(ref('cell', 'první buňka')),
          b: R(ref('cell', 'druhá buňka')),
          quad: R(arr(vec3('roh'), 'čtyři rohy otvoru v jedné rovině', { minLen: 4, maxLen: 4 })),
          door: ref('entity', 'entita dveří; zavřené dveře portál uzavírají pro viditelnost i zvuk'),
        }),
        'portály: otvory mezi buňkami',
      ),
      brushes: arr(
        obj({
          id: R(id('id kvádru, předpona b_')),
          cell: R(ref('cell', 'buňka, ke které kvádr patří')),
          shape: en(BRUSH_SHAPES, 'tvar; výchozí box'),
          min: R(vec3('nejmenší roh')),
          max: R(vec3('největší roh')),
          rise: en(RISE_DIRS, 'wedge: směr, kterým šikmá plocha stoupá'),
          mat: R(ref('material', 'materiál')),
          faces: map(ref('material', 'materiál'), 'box: jiný materiál pro stěnu (+x, -x, +y, -y, +z, -z)'),
          col: bool('má kolizi; výchozí ano'),
          vis: bool('je vidět; výchozí ano'),
          tag: str('volná značka (wall, floor, ceiling, stair, ramp, pillar…)'),
        }),
        'kvádry a klíny: hrubá stavba levelu',
      ),
      entities: arr(
        obj({
          id: R(id('id entity, předpona e_')),
          prefab: R(ref('prefab', 'prefab')),
          cell: R(ref('cell', 'buňka')),
          pos: R(vec3('poloha')),
          rot: vec3('natočení ve stupních, pořadí YXZ'),
          scale: num('rovnoměrné měřítko', { min: 0.01, max: 100 }),
          props: { t: 'any', doc: 'výchozí stav entity (např. locked, on, level)' },
          io: arr(ioLink, 'spojení výstupů této entity'),
        }),
        'umístěné prefaby',
      ),
      lights: arr(
        obj({
          id: R(id('id světla, předpona l_')),
          cell: R(ref('cell', 'buňka')),
          type: R(en(LIGHT_TYPES, 'druh')),
          pos: R(vec3('poloha')),
          dir: vec3('směr (spot, sun)'),
          color: R(color('barva')),
          intensity: R(num('svítivost', { min: 0, max: 1000 })),
          range: num('dosah v metrech', { min: 0.1, max: 200 }),
          angle: num('úhel kužele ve stupních', { min: 1, max: 170 }),
          cast: bool('vrhá stín (v zapečeném světle vždy)'),
          dynamic: bool('nesmí se zapéct (mění se za běhu)'),
          style: en(LIGHT_STYLES, 'styl'),
        }),
        'pevná světla levelu (zapékají se)',
      ),
      triggers: arr(
        obj({
          id: R(id('id spouštěče, předpona t_')),
          cell: R(ref('cell', 'buňka')),
          min: R(vec3('nejmenší roh')),
          max: R(vec3('největší roh')),
          once: bool('zareaguje jen jednou'),
          io: R(arr(ioLink, 'spojení; výstupy spouštěče jsou enter a exit', { minLen: 1 })),
        }),
        'spouštěcí objemy',
      ),
      spawns: R(
        arr(
          obj({
            id: R(id('id')),
            kind: R(en(SPAWN_KINDS, 'co se tu rodí')),
            pos: R(vec3('poloha nohou')),
            yaw: num('natočení ve stupních; 0 = pohled ve směru -Z', { min: -360, max: 360 }),
            what: str('id nepřítele nebo předmětu'),
          }),
          'výchozí místa',
          { minLen: 1 },
        ),
      ),
      baked: obj(
        {
          file: R(str('soubor se zapečeným světlem')),
          method: R(en(['vertex', 'lightmap'], 'způsob')),
          hash: R(str('otisk geometrie a světel, pro které zapečení platí')),
        },
        'zapečené světlo; chybí-li, engine svítí za běhu',
      ),
      source: R(source),
    },
    'level',
  ),
};
