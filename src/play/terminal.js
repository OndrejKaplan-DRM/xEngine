// xPlay: obrazovka ve světě (dědictví Doom 3). Stav terminálu je čistá data, kreslení dostane 2D kontext plátna,
// které xRender mapuje na plochu obrazovky. Vlna 1: textová konzole. Hráč píše, Enter vyšle výstup command
// s napsaným textem; vstup print přidá řádek. Co příkaz v levelu udělá, říkají spojení v datech, ne tento soubor.

const MAX_LINES = 10;
const MAX_INPUT = 40;

export function createTerminal(title, app) {
  return { title, app, lines: [], input: '', pointer: null, active: false, dirty: true };
}

export function termPrint(t, text) {
  for (const line of String(text).split('\n')) t.lines.push(line.slice(0, 46));
  while (t.lines.length > MAX_LINES) t.lines.shift();
  t.dirty = true;
}

/** Znak z klávesnice. */
export function termType(t, ch) {
  if (t.input.length >= MAX_INPUT || ch.length !== 1 || ch < ' ') return;
  t.input += ch;
  t.dirty = true;
}

/** Řídicí klávesa. Vrací text příkazu, když ho hráč potvrdil klávesou Enter, jinak null. */
export function termKey(t, key) {
  if (key === 'Backspace') {
    t.input = t.input.slice(0, -1);
    t.dirty = true;
    return null;
  }
  if (key !== 'Enter') return null;
  const cmd = t.input.trim();
  t.input = '';
  termPrint(t, `> ${cmd}`);
  return cmd;
}

/** Vykreslí terminál do plátna w × h bodů. blink přepíná kurzor řádku. */
export function drawTerminal(ctx, w, h, t, blink) {
  const u = h / 400; // rozvržení je navržené pro výšku 400 bodů
  ctx.fillStyle = '#06130f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0d2a20';
  ctx.fillRect(0, 0, w, 44 * u);
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${24 * u}px ui-monospace, Consolas, monospace`;
  ctx.fillStyle = '#7dffc8';
  ctx.fillText(t.title, 16 * u, 22 * u);
  ctx.font = `${22 * u}px ui-monospace, Consolas, monospace`;
  ctx.fillStyle = '#39d79a';
  if (!t.active && !t.lines.length) ctx.fillText('Připraveno. Sedni si a piš.', 16 * u, 78 * u);
  t.lines.forEach((line, i) => ctx.fillText(line, 16 * u, (78 + i * 28) * u));
  if (t.active) {
    ctx.fillStyle = '#c9ffe9';
    ctx.fillText(`> ${t.input}${blink ? '█' : ''}`, 16 * u, h - 28 * u);
  }
  if (t.pointer) {
    // kurzor myši promítnutý na plochu obrazovky
    const x = t.pointer[0] * w;
    const y = t.pointer[1] * h;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(x - 9 * u, y);
    ctx.lineTo(x + 9 * u, y);
    ctx.moveTo(x, y - 9 * u);
    ctx.lineTo(x, y + 9 * u);
    ctx.stroke();
  }
  t.dirty = false;
}
