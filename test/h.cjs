// Společný základ testů v prohlížeči (Playwright, bez sítě, bez grafické karty).
// Playwright se bere z projektu, jinak z globální instalace (PLAYWRIGHT_PATH nebo /opt/npm-tools).
// Na stroji smí běžet nejvýš jeden prohlížeč naráz (2 CPU, 8 GB): testy pouštěj za sebou.

const fs = require('node:fs');
const path = require('node:path');

function loadPlaywright() {
  const candidates = ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/npm-tools/node_modules/playwright'].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* další kandidát */
    }
  }
  throw new Error('Playwright nenalezen. Nastav PLAYWRIGHT_PATH (nikdy naslepo npm i playwright: verze musí sedět s prohlížečem v sandboxu).');
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const results = { pass: 0, fail: 0, skipped: 0 };

function ok(cond, name, detail = '') {
  if (cond) results.pass++;
  else results.fail++;
  console.log(`${cond ? '  ok  ' : 'CHYBA '} ${name}${detail ? '  [' + detail + ']' : ''}`);
}
function skip(name, why) {
  results.skipped++;
  console.log(`PŘESKOČENO ${name}  [${why}]`);
}

async function launch() {
  const { chromium } = loadPlaywright();
  const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
  try {
    return await chromium.launch({ args });
  } catch {
    const exe = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
    if (!exe) throw new Error('Nenalezen žádný prohlížeč Chromium.');
    return chromium.launch({ args, executablePath: exe });
  }
}

/**
 * Otevře sestavenou stránku z dist/. ready = výraz, který musí být pravdivý, než test pokračuje.
 * context: volby newContext (viewport, hasTouch…), q: řetězec dotazu.
 */
async function open(browser, { file, q = '', context = {}, ready = 'true', timeout = 60000 }) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, ...context });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) errs.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await page.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  await page.goto('file://' + path.join(ROOT, file) + q);
  await page.waitForFunction(ready, null, { timeout });
  return { ctx, page, errs };
}

/** Uloží data URL (PNG z plátna) do test/out a vrátí cestu. Snímek z plátna je spolehlivější než page.screenshot. */
function saveDataUrl(dataUrl, name) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name);
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  return file;
}

function finish(label) {
  console.log(`\n${label}: ${results.pass} prošlo, ${results.fail} selhalo, ${results.skipped} přeskočeno`);
  return results.fail ? 1 : 0;
}

module.exports = { launch, open, ok, skip, saveDataUrl, finish, results, ROOT, OUT };
