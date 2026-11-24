// Čtení archivu ZIP bez závislostí (ambientCG dává materiály jen jako ZIP). Umí uložené a deflate položky,
// ověří CRC32. ZIP64 a šifrování neumí a ohlásí to. makeZip je jen pro testy.
import zlib from 'node:zlib';

const EOCD = 0x06054b50;
const CEN = 0x02014b50;
const LOC = 0x04034b50;

export function readZip(buf) {
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === EOCD) { end = i; break; }
  }
  if (end < 0) throw new Error('není to archiv ZIP (chybí konec adresáře)');
  const count = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  if (p === 0xffffffff || count === 0xffff) throw new Error('ZIP64 neumím');
  const out = [];
  for (let k = 0; k < count; k++) {
    if (buf.readUInt32LE(p) !== CEN) throw new Error(`poškozený adresář ZIP u položky ${k}`);
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    p += 46 + nlen + xlen + clen;
    if (name.endsWith('/')) continue;
    if (flags & 1) throw new Error(`${name}: šifrovaná položka`);
    if (csize === 0xffffffff || size === 0xffffffff) throw new Error(`${name}: ZIP64 neumím`);
    out.push({
      name,
      size,
      data() {
        if (buf.readUInt32LE(off) !== LOC) throw new Error(`${name}: poškozená hlavička`);
        const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
        const raw = buf.subarray(start, start + csize);
        let data;
        if (method === 0) data = Buffer.from(raw);
        else if (method === 8) data = zlib.inflateRawSync(raw);
        else throw new Error(`${name}: metoda komprese ${method} neumím`);
        if (data.length !== size) throw new Error(`${name}: velikost ${data.length} místo ${size}`);
        if (zlib.crc32(data) !== crc) throw new Error(`${name}: nesedí CRC32`);
        return data;
      },
    });
  }
  return out;
}

/** Malý zápis ZIP pro testy: [{ name, data, deflate }]. */
export function makeZip(entries) {
  const locals = [];
  const cens = [];
  let off = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const data = Buffer.from(e.data);
    const body = e.deflate ? zlib.deflateRawSync(data) : data;
    const crc = zlib.crc32(data);
    const loc = Buffer.alloc(30);
    loc.writeUInt32LE(LOC, 0);
    loc.writeUInt16LE(20, 4);
    loc.writeUInt16LE(e.deflate ? 8 : 0, 8);
    loc.writeUInt32LE(crc, 14);
    loc.writeUInt32LE(body.length, 18);
    loc.writeUInt32LE(data.length, 22);
    loc.writeUInt16LE(name.length, 26);
    locals.push(loc, name, body);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(CEN, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(e.deflate ? 8 : 0, 10);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(off, 42);
    cens.push(cen, name);
    off += 30 + name.length + body.length;
  }
  const cenBuf = Buffer.concat(cens);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(EOCD, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cenBuf.length, 12);
  end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cenBuf, end]);
}
