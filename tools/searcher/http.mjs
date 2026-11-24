// xSearcher: přístup k síti. Jeden User-Agent se jménem nástroje (podmínky rozhraní Poly Haven, bod 2.4),
// časový limit, záznam odpovědí do složky a jejich přehrání bez sítě (test).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const USER_AGENT = 'xEngine-xSearcher/0.1 (+https://github.com/OndrejKaplan-DRM/xEngine)';

export class HttpError extends Error {
  constructor(url, status, detail = '') {
    super(`${url}: ${status}${detail ? ` (${detail})` : ''}`);
    this.url = url;
    this.status = status;
  }
}

const fileFor = (url) => crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + '.json';

function readIndex(dir) {
  const f = path.join(dir, 'index.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { note: '', files: {} };
}

/**
 * record: složka, kam se uloží každá odpověď JSON (index.json mapuje adresu → soubor).
 * replay: složka s uloženými odpověďmi; síť se nepoužije a chybějící adresa je chyba.
 * Binární soubory se neukládají ani nepřehrávají (test si je podstrčí přes fetchImpl).
 */
export function makeHttp({ record = null, replay = null, fetchImpl = globalThis.fetch, jsonTimeout = 30_000, fileTimeout = 600_000 } = {}) {
  const calls = [];
  const replayIndex = replay ? readIndex(replay) : null;
  const recordIndex = record ? (fs.mkdirSync(record, { recursive: true }), readIndex(record)) : null;

  async function get(url, timeout) {
    const t0 = performance.now();
    let res;
    try {
      res = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
    } catch (e) {
      throw new HttpError(url, 'ERR', e.cause?.code || e.name || e.message);
    }
    if (!res.ok) throw new HttpError(url, res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    calls.push({ url, status: res.status, bytes: buf.length, ms: Math.round(performance.now() - t0) });
    return buf;
  }

  return {
    calls,
    offline: !!replay,
    async json(url) {
      let buf;
      if (replayIndex) {
        const f = replayIndex.files[url];
        if (!f) throw new HttpError(url, 'REPLAY', 'v uložených odpovědích není');
        buf = fs.readFileSync(path.join(replay, f));
        calls.push({ url, status: 'replay', bytes: buf.length, ms: 0 });
      } else {
        buf = await get(url, jsonTimeout);
      }
      if (recordIndex) {
        const f = fileFor(url);
        fs.writeFileSync(path.join(record, f), buf);
        recordIndex.files[url] = f;
        fs.writeFileSync(path.join(record, 'index.json'), JSON.stringify(recordIndex, null, 2) + '\n');
      }
      return JSON.parse(buf.toString('utf8'));
    },
    async bytes(url) {
      if (replayIndex) throw new HttpError(url, 'REPLAY', 'soubory se bez sítě nestahují');
      return get(url, fileTimeout);
    },
  };
}
