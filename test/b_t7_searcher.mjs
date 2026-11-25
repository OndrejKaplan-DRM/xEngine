// B-T7: xSearcher bez sítě. Hledání nad uloženými odpověďmi Poly Haven a ambientCG (test/b_lib/searcher),
// brána licencí (jen CC0, při pochybnosti ne), příjem do příjmové složky se záznamem a otisky, kontrola MD5
// a velikosti, čtení ZIP, položka pack.json a validátor balíku s free = true, příkazová řádka s --replay.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { makeChecker } from './b_lib/check.mjs';
import { makeHttp, USER_AGENT } from '../tools/searcher/http.mjs';
import { readZip, makeZip } from '../tools/searcher/zip.mjs';
import { translate } from '../tools/searcher/match.mjs';
import { SOURCES, TYPES, sourceList } from '../tools/searcher/sources/index.mjs';
import { gate, fetchAsset, listInbox, packAsset, GateError, RECORD } from '../tools/searcher/inbox.mjs';
import { QUERY, LIMIT, PH_ID, ACG_ID } from './b_lib/searcher/nahrat.mjs';
import { validatePack } from '../src/xspace/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtures = path.join(root, 'test', 'b_lib', 'searcher');
const { ok, finish } = makeChecker('B-T7 xSearcher');
const PH = SOURCES.polyhaven;
const ACG = SOURCES.ambientcg;
const md5 = (b) => crypto.createHash('md5').update(b).digest('hex');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const noNet = () => {
  throw new Error('síť v testu');
};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xsearcher-'));
const reject = async (p) => {
  try {
    await p;
    return null;
  } catch (e) {
    return e;
  }
};

// ---- dotaz a slovník
const words = translate(QUERY);
ok(words.join(' ') === 'concrete floor', 'český dotaz se přeloží slovníkem', `„${QUERY}“ → ${words.join(' ')}`);
ok(translate('natřená omítka zeď').join(' ') === 'painted plaster wall', 'diakritika nevadí', translate('natřená omítka zeď').join(' '));

// ---- hledání nad uloženými odpověďmi, bez sítě
const offline = makeHttp({ replay: fixtures, fetchImpl: noNet });
const phHits = await PH.api.search(offline, words, { limit: LIMIT });
const list = JSON.parse(fs.readFileSync(path.join(fixtures, JSON.parse(fs.readFileSync(path.join(fixtures, 'index.json'), 'utf8')).files['https://api.polyhaven.com/assets?t=textures']), 'utf8'));
ok(phHits.length === LIMIT, `Poly Haven: ${LIMIT} výsledků z uloženého seznamu (${Object.keys(list).length} položek)`, phHits.map((h) => h.id).join(', '));
ok(phHits.some((h) => h.id === PH_ID), `mezi nimi je ${PH_ID}`);
ok(phHits.every((h) => h.license === 'CC0-1.0' && h.authors.length > 0 && h.page.startsWith('https://polyhaven.com/a/')), 'každý výsledek má licenci, autora a adresu stránky');
ok(phHits.every((h, i) => i === 0 || phHits[i - 1].score >= h.score), 'výsledky jsou seřazené podle skóre');
const phSize = phHits.find((h) => h.id === PH_ID).size;
ok(phSize && phSize.unit === 'm' && phSize.w > 0.1 && phSize.w < 50, 'rozměr předlohy v metrech (rozhraní ho dává v mm)', phSize && `${phSize.w} × ${phSize.h} m`);
const acgHits = await ACG.api.search(offline, words, { limit: LIMIT });
ok(acgHits.length > 0 && acgHits.every((h) => h.downloads.some((d) => d.attr === '2K-JPG' && d.url.startsWith('https://ambientcg.com/') && d.bytes > 0)), 'ambientCG: výsledky nesou archiv 2K-JPG s adresou a velikostí', `${acgHits.length}: ${acgHits.map((h) => h.id).join(', ')}`);
ok(offline.calls.length === 2 && offline.calls.every((c) => c.status === 'replay'), 'hledání nepoužilo síť', offline.calls.map((c) => c.status).join(','));

// ---- brána licencí
const good = phHits[0];
ok(gate(good, PH).length === 0, 'textura CC0 z doloženého zdroje bránou projde');
const cases = [
  ['CC-BY-4.0', { ...good, license: 'CC-BY-4.0' }, PH],
  ['licence neznámá', { ...good, license: undefined }, PH],
  ['licence mimo slovník', { ...good, license: 'CC-BY-NC-4.0' }, PH],
  ['model', { ...good, type: 'typ 2' }, PH],
  ['id s cestou', { ...good, id: '../x' }, PH],
  ['zdroj bez doložené licence', good, { ...PH, evidence: '' }],
];
for (const [name, a, s] of cases) ok(gate(a, s).length > 0, `brána odmítne: ${name}`, gate(a, s).join('; '));
ok(!TYPES.model.ok && /Ondřej/.test(TYPES.model.why) && !TYPES.sound.ok, 'modely a zvuky nástroj nestahuje (Ondřejova volba 2 a)');
const sl = sourceList('polyhaven,kenney,xyz');
ok(sl.use.length === 1 && sl.skipped.some((s) => /403/.test(s)) && sl.skipped.some((s) => /neznámý/.test(s)), 'nepoužívaný zdroj se ohlásí s důvodem, ne obejde', sl.skipped.join(' | '));
const gateErr = await reject(fetchAsset(offline, PH, { ...good, license: 'CC-BY-4.0' }, { out: tmp }));
ok(gateErr instanceof GateError && !fs.existsSync(path.join(tmp, 'polyhaven')), 'brána platí i při stahování: nic se nezapíše');

// ---- příjem z Poly Haven: soubory podstrčené testem, odpovědi rozhraní uložené
const phFiles = await PH.api.files(offline, { id: PH_ID });
const fake = new Map(phFiles.files.map((f, i) => [f.url, Buffer.from(`soubor ${i} ${f.map} `.repeat(50 + i))]));
const seenUA = [];
const fakeFetch = async (url, init) => {
  seenUA.push(init?.headers?.['User-Agent']);
  if (!fake.has(url)) throw new Error(`neočekávaná adresa ${url}`);
  return new Response(fake.get(url));
};
const replayJson = makeHttp({ replay: fixtures, fetchImpl: noNet });
const asset = await PH.api.info(replayJson, PH_ID);
// a) skutečné MD5 z rozhraní nesedí na podstrčené soubory → odmítnout a nic nezapsat
const httpA = { json: replayJson.json, bytes: (u) => makeHttp({ fetchImpl: fakeFetch }).bytes(u) };
const md5Err = await reject(fetchAsset(httpA, PH, asset, { out: tmp, date: '2026-11-24' }));
ok(md5Err && /B místo|MD5/.test(md5Err.message) && !fs.existsSync(path.join(tmp, 'polyhaven', PH_ID)) && !fs.existsSync(path.join(tmp, 'polyhaven', `${PH_ID}.part`)), 'soubor, který nesedí na velikost nebo MD5 z rozhraní, se odmítne a nic nezůstane', md5Err?.message);
ok(seenUA.length > 0 && seenUA.every((u) => u === USER_AGENT && /xSearcher/.test(u)), 'každé stažení nese User-Agent nástroje (podmínky Poly Haven 2.4)', seenUA[0]);
// b) odpověď rozhraní s velikostí a MD5 podstrčených souborů → zapíše se se záznamem
const patched = async (u) => {
  const j = await replayJson.json(u);
  if (!u.includes('/files/')) return j;
  const c = structuredClone(j);
  for (const f of phFiles.files) {
    const node = c[PH.maps[f.map]]['2k'].jpg;
    node.size = fake.get(f.url).length;
    node.md5 = md5(fake.get(f.url));
  }
  return c;
};
const httpB = { json: patched, bytes: httpA.bytes };
const { dir: phDir, record: phRec } = await fetchAsset(httpB, PH, asset, { out: tmp, date: '2026-11-24', query: QUERY });
ok(phDir === path.join(tmp, 'polyhaven', PH_ID), 'cesta je <příjem>/<zdroj>/<asset>');
ok(phRec.files.map((f) => f.map).join(',') === PH.defaultMaps.join(','), 'stáhnou se výchozí mapy (barva, normála, ARM)', phRec.files.map((f) => f.map).join(','));
ok(phRec.files.every((f) => f.sha256 === sha(fs.readFileSync(path.join(phDir, f.path))) && f.bytes === fs.statSync(path.join(phDir, f.path)).size && f.url && f.md5), 'záznam nese u každého souboru velikost, SHA-256, adresu a MD5 a sedí na disk');
ok(phRec.license === 'CC0-1.0' && /polyhaven\.com\/license/.test(phRec.licenseEvidence) && phRec.author.length > 0 && phRec.url === `https://polyhaven.com/a/${PH_ID}` && phRec.date === '2026-11-24' && phRec.query === QUERY, 'záznam: licence s doložením, autor, adresa, datum, dotaz', `${phRec.author}; ${phRec.date}`);
ok(/User-Agent/.test(phRec.terms), 'záznam nese podmínky rozhraní zdroje');
ok(fs.existsSync(path.join(phDir, RECORD)) && JSON.parse(fs.readFileSync(path.join(phDir, RECORD), 'utf8')).files.length === phRec.files.length, 'record.json leží vedle souborů');

// ---- příjem z ambientCG: archiv ZIP sestavený testem
const acgAsset0 = await ACG.api.info(replayJson, ACG_ID);
const px = (s) => Buffer.from(`${s} `.repeat(300));
const zip = makeZip([
  { name: `${ACG_ID}_2K-JPG_Color.jpg`, data: px('barva'), deflate: true },
  { name: `${ACG_ID}_2K-JPG_NormalGL.jpg`, data: px('normala gl'), deflate: true },
  { name: `${ACG_ID}_2K-JPG_NormalDX.jpg`, data: px('normala dx'), deflate: true },
  { name: `${ACG_ID}_2K-JPG_Roughness.jpg`, data: px('drsnost') },
  { name: `${ACG_ID}_2K-JPG_AmbientOcclusion.jpg`, data: px('stin'), deflate: true },
  { name: `${ACG_ID}_2K-JPG.blend`, data: px('blend') },
]);
const zipUrl = 'https://ambientcg.com/get?file=TEST_2K-JPG.zip';
const acgAsset = { ...acgAsset0, downloads: acgAsset0.downloads.map((d) => (d.attr === '2K-JPG' ? { ...d, url: zipUrl, bytes: zip.length } : d)) };
ok(acgAsset0.downloads.some((d) => d.attr === '2K-JPG'), `uložená odpověď ambientCG pro ${ACG_ID} nese archiv 2K-JPG`);
const httpC = { json: replayJson.json, bytes: async (u) => (u === zipUrl ? zip : noNet()) };
const { dir: acgDir, record: acgRec } = await fetchAsset(httpC, ACG, acgAsset, { out: tmp, date: '2026-11-24' });
ok(acgRec.files.map((f) => f.map).join(',') === 'albedo,normal,roughness,ao', 'z archivu se vyberou barva, normála GL, drsnost a okolní stín', acgRec.files.map((f) => f.path).join(', '));
ok(!fs.readdirSync(acgDir).some((f) => /NormalDX|\.blend$/.test(f)), 'normála DX a soubory programů v příjmu nejsou');
ok(acgRec.archive.sha256 === sha(zip) && acgRec.archive.bytes === zip.length && acgRec.archive.entries.length === 6, 'záznam nese otisk a obsah archivu');
ok(acgRec.missingMaps.join(',') === 'metalness,opacity' && ACG.optionalMaps.includes('metalness'), 'chybějící nepovinné mapy jsou v záznamu', acgRec.missingMaps.join(','));
ok(fs.readFileSync(path.join(acgDir, `${ACG_ID}_2K-JPG_Color.jpg`)).equals(px('barva')), 'rozbalená mapa je bajtově shodná s položkou archivu');
const badZip = await reject(fetchAsset({ json: replayJson.json, bytes: async () => zip.subarray(0, zip.length - 5) }, ACG, acgAsset, { out: tmp }));
ok(badZip && /B místo/.test(badZip.message), 'archiv jiné velikosti, než udává rozhraní, se odmítne', badZip?.message);

// ---- ZIP
const z = makeZip([{ name: 'a.txt', data: 'ahoj' }, { name: 'b/c.bin', data: Buffer.alloc(5000, 7), deflate: true }]);
const r = readZip(z);
ok(r.length === 2 && r[0].data().toString() === 'ahoj' && r[1].data().equals(Buffer.alloc(5000, 7)), 'ZIP: uložená i deflate položka se přečtou');
const broken = Buffer.from(z);
broken[30 + 5 + 1] ^= 0xff; // první bajt dat položky a.txt
ok(/CRC32/.test((() => { try { readZip(broken)[0].data(); return ''; } catch (e) { return e.message; } })()), 'ZIP: poškozená data shodí kontrolu CRC32');
ok(/není to archiv/.test((() => { try { readZip(Buffer.from('nic')); return ''; } catch (e) { return e.message; } })()), 'ZIP: soubor, který archiv není, se pozná');

// ---- příjem na disku
const inbox = listInbox(tmp);
ok(inbox.length === 2 && inbox.every((x) => x.ok), 'výpis příjmu najde oba assety a otisky sedí', inbox.map((x) => x.record.id).join(', '));
fs.appendFileSync(path.join(phDir, phRec.files[0].path), 'x');
ok(listInbox(tmp).some((x) => !x.ok && x.bad.includes(phRec.files[0].path)), 'změněný soubor výpis příjmu ohlásí');

// ---- položka pack.json a validátor balíku s free = true
const golden = JSON.parse(fs.readFileSync(path.join(root, 'packs', 'golden', 'pack.json'), 'utf8'));
const data = Buffer.from('odvozená textura 512 px');
const entry = packAsset(phRec, 'textures/concrete_512.jpg', data, phRec.files[0]);
ok(entry.sha256 === sha(data) && entry.bytes === data.length && entry.source === phRec.files[0].url && entry.license === 'CC0-1.0', 'položka assets nese otisk odvozeného souboru a adresu originálu');
const { materials: _m, prefabs: _p, levels: _l, ...head } = golden; // balík jen s assety, bez souborů
const asPack = (assets) => ({ manifest: { ...head, free: true, assets }, prefabs: [], levels: [] });
const errs = (v) => v.errors.filter((e) => e.code.startsWith('license') || e.code.startsWith('pack.'));
ok(errs(validatePack(asPack([entry]))).length === 0, 'balík s free = true a texturou CC0 validátor přijme', errs(validatePack(asPack([entry]))).map((e) => e.code).join(','));
const byErr = validatePack(asPack([{ ...entry, license: 'CC-BY-4.0' }])).errors.map((e) => e.code);
ok(byErr.join(',') === 'license.notFree', 'balík s free = true a licencí CC-BY validátor odmítne', byErr.join(','));

// ---- příkazová řádka bez sítě
const cli = (args) => spawnSync(process.execPath, [path.join(root, 'tools', 'searcher', 'find.mjs'), ...args], { encoding: 'utf8', env: { ...process.env, HTTPS_PROXY: '', https_proxy: '' } });
const s1 = cli([QUERY, '--replay', fixtures, '--limit', String(LIMIT)]);
ok(s1.status === 0 && /Zdroj: Poly Haven/.test(s1.stdout) && /Zdroj: ambientCG/.test(s1.stdout) && s1.stdout.includes(`polyhaven:${PH_ID}`), 'find.mjs vyhledá z uložených odpovědí a u výsledků jmenuje zdroj (podmínky Poly Haven 2.5)', s1.stdout.split('\n')[0]);
const s2 = cli([QUERY, '--type', 'model', '--replay', fixtures]);
ok(s2.status === 2 && /Ondřej/.test(s2.stdout), 'find.mjs --type model odmítne s důvodem');
const s3 = cli(['--get', `polyhaven:${PH_ID}`, '--replay', fixtures, '--out', path.join(tmp, 'cli')]);
ok(s3.status === 1 && /bez sítě/.test(s3.stdout) && !fs.existsSync(path.join(tmp, 'cli', 'polyhaven', PH_ID)), 'find.mjs --get bez sítě skončí chybou a nic nezapíše', s3.stdout.trim().split('\n').pop());
const s4 = cli(['--inbox', '--out', tmp]);
ok(s4.status === 1 && /POŠKOZENO/.test(s4.stdout), 'find.mjs --inbox ohlásí poškozený soubor a skončí chybou');

// ---- příjem je mimo git
const ign = spawnSync('git', ['check-ignore', '-q', 'packs/_inbox/polyhaven/x/a.jpg'], { cwd: root });
const kept = spawnSync('git', ['ls-files', '--error-unmatch', 'packs/_inbox/.gitignore'], { cwd: root });
ok(ign.status === 0 && kept.status === 0, 'packs/_inbox je mimo git, v gitu je jen jeho .gitignore');

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(finish());
