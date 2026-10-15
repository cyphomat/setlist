// Baut die Pixel-Grafiken fuer den Merch-Stand: Aufnaeher und Rangszenen.
//
//   node tools/pixel.mjs            baut die Bogen neu
//   node tools/pixel.mjs --pruefe   prueft nur, ob die Bogen zu den Quellen
//                                   passen (Exit 1 sonst) — laeuft in der Action
//
// Quelle sind die Pixelbilder in tools/pixel/ — eigene Pixel-Art, keine
// fremden Grafiken. Daraus entstehen zwei Bildbogen:
//   assets/pixel/aufnaeher.png  je 24×24, Reihenfolge wie M.BILDER
//   assets/pixel/raenge.png     je 96×48, Reihenfolge wie M.RAENGE
//
// Ein Aufnaeher ist Rahmen plus Symbol. Die Rahmenform zeigt die Kategorie
// (Buehne rund, Kraft Raute, Rad eckig, Comeback Wappen, Serie Stern), das
// Symbol kommt aus einem der Quellbilder und wird auf den Rahmen der
// Kategorie umgesetzt und umgefaerbt. Zwei Symbole gibt es nur hier
// (Klimmzug, Treppe); sie stehen unten als Zeichenraster.
//
// Kein Paket, keine Abhaengigkeit: PNG lesen und schreiben mit node:zlib.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BILDER, RAENGE } from '../js/merch.js';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUELLE = join(WURZEL, 'tools', 'pixel');
const ZIEL = join(WURZEL, 'assets', 'pixel');

/* ---------------- PNG (nur 8 Bit RGBA, wie die Quellen) ---------------- */

function lies(datei) {
  const b = readFileSync(datei);
  let pos = 8, w = 0, h = 0;
  const idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos), typ = b.toString('ascii', pos + 4, pos + 8);
    const d = b.subarray(pos + 8, pos + 8 + len);
    if (typ === 'IHDR') {
      w = d.readUInt32BE(0); h = d.readUInt32BE(4);
      if (d[8] !== 8 || d[9] !== 6) throw new Error(`${datei}: nur 8-Bit-RGBA`);
    }
    if (typ === 'IDAT') idat.push(d);
    pos += 12 + len;
  }
  const roh = inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(w * h * 4), zeile = w * 4;
  for (let y = 0; y < h; y++) {
    const f = roh[y * (zeile + 1)], quelle = roh.subarray(y * (zeile + 1) + 1, (y + 1) * (zeile + 1));
    for (let x = 0; x < zeile; x++) {
      const a = x >= 4 ? px[y * zeile + x - 4] : 0;
      const o = y > 0 ? px[(y - 1) * zeile + x] : 0;
      const ao = x >= 4 && y > 0 ? px[(y - 1) * zeile + x - 4] : 0;
      const pa = Math.abs(o - ao), pb = Math.abs(a - ao), pc = Math.abs(a + o - 2 * ao);
      const paeth = pa <= pb && pa <= pc ? a : pb <= pc ? o : ao;
      const v = quelle[x];
      px[y * zeile + x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + o : f === 3 ? v + ((a + o) >> 1) : v + paeth) & 255;
    }
  }
  return { w, h, px };
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function stueck(typ, daten) {
  const kopf = Buffer.alloc(8); kopf.writeUInt32BE(daten.length, 0); kopf.write(typ, 4, 'ascii');
  const pruef = Buffer.alloc(4); pruef.writeUInt32BE(crc32(Buffer.concat([Buffer.from(typ, 'ascii'), daten])), 0);
  return Buffer.concat([kopf, daten, pruef]);
}
function kodiere({ w, h, px }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const roh = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) Buffer.from(px.buffer, px.byteOffset + y * w * 4, w * 4).copy(roh, y * (w * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), stueck('IHDR', ihdr),
    stueck('IDAT', deflateSync(roh, { level: 9 })), stueck('IEND', Buffer.alloc(0))]);
}

/* ---------------- Bildhilfen ---------------- */

const leer = (w, h) => ({ w, h, px: new Uint8Array(w * h * 4) });
const farbe = (b, x, y) => { const i = (y * b.w + x) * 4; return b.px.slice(i, i + 4); };
const setze = (b, x, y, c) => { if (x < 0 || y < 0 || x >= b.w || y >= b.h) return; b.px.set(c, (y * b.w + x) * 4); };
const hex = c => [...c.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join('');
const rgba = h => Uint8Array.from([parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255]);
const kopie = b => ({ w: b.w, h: b.h, px: b.px.slice() });
function klebe(ziel, quelle, dx, dy, ausschnitt = { x: 0, y: 0, w: quelle.w, h: quelle.h }) {
  for (let y = 0; y < ausschnitt.h; y++) for (let x = 0; x < ausschnitt.w; x++) {
    const c = farbe(quelle, ausschnitt.x + x, ausschnitt.y + y);
    if (c[3] > 0) setze(ziel, dx + x, dy + y, c);
  }
}

/**
 * Ein Aufnaeher in Rahmen und Symbol zerlegen. Innen ist, was mindestens
 * drei Pixel vom Rand entfernt liegt — dort sitzen Naht und Kontur nie.
 * Die haeufigste Farbe innen ist der Grund, alles andere innen das Symbol.
 */
function zerlege(b) {
  const abstand = new Int32Array(b.w * b.h).fill(99);
  const warte = [];
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (farbe(b, x, y)[3] < 128) { abstand[y * b.w + x] = 0; warte.push([x, y]); }
  }
  for (let y = -1; y <= b.h; y++) for (let x = -1; x <= b.w; x++) {
    if (x < 0 || y < 0 || x >= b.w || y >= b.h) for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx >= 0 && ny >= 0 && nx < b.w && ny < b.h && abstand[ny * b.w + nx] > 1) { abstand[ny * b.w + nx] = 1; warte.push([nx, ny]); }
    }
  }
  while (warte.length) {
    const [x, y] = warte.shift();
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= b.w || ny >= b.h) continue;
      const d = abstand[y * b.w + x] + 1;
      if (d < abstand[ny * b.w + nx]) { abstand[ny * b.w + nx] = d; warte.push([nx, ny]); }
    }
  }
  const innen = (x, y) => abstand[y * b.w + x] >= 3;
  const zaehl = {};
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (innen(x, y)) { const k = hex(farbe(b, x, y)); zaehl[k] = (zaehl[k] || 0) + 1; }
  const grund = Object.entries(zaehl).sort((a, z) => z[1] - a[1])[0][0];
  const symbol = [], rahmen = kopie(b);
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (!innen(x, y)) continue;
    sx += x; sy += y; n++;
    const c = farbe(b, x, y);
    if (hex(c) !== grund) { symbol.push({ x, y, f: hex(c) }); setze(rahmen, x, y, rgba(grund)); }
  }
  const anteile = {};
  for (const p of symbol) anteile[p.f] = (anteile[p.f] || 0) + 1;
  const farben = Object.entries(anteile).sort((a, z) => z[1] - a[1]).map(([f]) => f);
  return { rahmen, symbol, farben, grund, mitte: { x: sx / n, y: sy / n } };
}

/* ---------------- Rahmen je Kategorie ---------------- */

const zerlegt = name => zerlege(lies(join(QUELLE, 'aufnaeher', `${name}.png`)));
const RAHMEN = {
  buehne: zerlegt('serie4'),      // rund, Navy mit Goldnaht
  kraft: zerlegt('eisen'),        // Raute, Schwarz mit Orange
  rad: zerlegt('anker'),          // eckig, Gruen
  comeback: zerlegt('lehrmeister'), // Wappen, Weinrot
  serie: zerlegt('legende')       // Stern, Gold
};

/* Zwei Symbole gibt es nur in Setlist. H = Hauptfarbe, A = Akzent. */
const EIGENE = {
  hangar: [               // Klimmzug: Stange, Haende, Koerper
    'AAAAAAAAAAA',
    '.A.......A.',
    '..H.....H..',
    '..H.HHH.H..',
    '...HHHHH...',
    '....HHH....',
    '....HHH....',
    '....H.H....',
    '....H.H....',
    '...HH.HH...'
  ],
  hoehe: [                // Stairway to Heaven: Treppe mit Stern oben
    '........A.A',
    '.........A.',
    '.......HHHA',
    '.......H...',
    '....HHHH...',
    '....H......',
    '.HHHH......',
    '.H.........',
    'HH.........'
  ]
};

/* Welche Gruppe welches Symbol bekommt. */
const SYMBOL = {
  debuet: 'firstblood', gigs: 'setlist', jam: 'saitenhexer', unplugged: 'soundcheck', maxout: 'impressive',
  zugaben: 'gegoennt', tight: 'sitzt25', roadcrew: 'vorbereitet',
  platten: 'eisen', club: 'eisenhart', koerper: 'ausgeglichen',
  km: 'tour10', century: 'flawless', doom: 'boss1', openair: 'nacht', crossover: 'kilometer',
  comeback: 'metal', rueckweg: 'nachgefasst', reunion: 'stammtisch', serie: 'serie4'
};
/* Symbole, deren Farbe die Aussage ist: Blut bleibt rot. */
const EIGENE_FARBE = new Set(['debuet']);

const KATEGORIE = {
  debuet: 'buehne', gigs: 'buehne', jam: 'buehne', unplugged: 'buehne', maxout: 'buehne', zugaben: 'buehne', tight: 'buehne', roadcrew: 'buehne',
  platten: 'kraft', club: 'kraft', hangar: 'kraft', koerper: 'kraft',
  km: 'rad', hoehe: 'rad', century: 'rad', doom: 'rad', openair: 'rad', crossover: 'rad',
  comeback: 'comeback', rueckweg: 'comeback', reunion: 'comeback', serie: 'serie'
};

function aufnaeher(gruppe) {
  const r = RAHMEN[KATEGORIE[gruppe]];
  if (!r) throw new Error(`Keine Kategorie fuer ${gruppe}`);
  const bild = kopie(r.rahmen);
  let punkte;
  if (EIGENE[gruppe]) {
    punkte = [];
    EIGENE[gruppe].forEach((zeile, y) => [...zeile].forEach((z, x) => { if (z !== '.') punkte.push({ x, y, rolle: z }); }));
  } else {
    const s = zerlegt(SYMBOL[gruppe]);
    punkte = s.symbol.map(p => ({ x: p.x, y: p.y, rolle: p.f === s.farben[0] ? 'H' : 'A',
      f: EIGENE_FARBE.has(gruppe) ? rgba(p.f) : null }));
  }
  // Mittig auf den Innenraum des Rahmens setzen
  const xs = punkte.map(p => p.x), ys = punkte.map(p => p.y);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
  const dx = Math.round(r.mitte.x - mx), dy = Math.round(r.mitte.y - my);
  const haupt = rgba(r.farben[0]), akzent = rgba(r.farben[1] || r.farben[0]);
  for (const p of punkte) setze(bild, p.x + dx, p.y + dy, p.f || (p.rolle === 'H' ? haupt : akzent));
  return bild;
}

/* ---------------- Rangszenen ---------------- */

const szene = name => lies(join(QUELLE, 'szenen', `${name}.png`));

/**
 * Hall of Fame: aus Teilen der vorhandenen Szenen zusammengesetzt, damit
 * der Strich derselbe bleibt — Wand und Lichtkegel aus dem Klub, die
 * Gitarre aus dem Proberaum, davor eine Vitrine, an der Wand drei goldene
 * Schallplatten.
 */
function hallOfFame() {
  const klub = szene('klub'), probe = szene('proberaum');
  const b = leer(96, 48);
  const wand = farbe(klub, 2, 2), kegel = farbe(klub, 47, 6);
  // Wand, darueber der Lichtkegel des Klubs — nur seine Farbe, nicht das Schlagzeug
  for (let y = 0; y < 48; y++) for (let x = 0; x < 96; x++) {
    const c = farbe(klub, x, y);
    setze(b, x, y, y < 30 && hex(c) === hex(kegel) ? kegel : wand);
  }
  // Boden und Kante aus dem Klub, Publikum davor
  for (let y = 30; y < 48; y++) for (let x = 0; x < 96; x++) setze(b, x, y, farbe(klub, x, y));
  // Sockel mitten auf der Kante
  const sockel = rgba('1d1a16'), sockelLicht = rgba('3a332a');
  for (let y = 24; y < 31; y++) for (let x = 39; x < 57; x++) setze(b, x, y, y === 24 ? sockelLicht : sockel);
  // Vitrine aus Glas, darin die Gitarre aus dem Proberaum — ohne die Ziegel
  const ziegel = new Set();
  // Wandfarben aus der ganzen Ziegelflaeche links und rechts der Gitarre
  for (let y = 0; y < 34; y++) for (const x of [...Array(22).keys(), ...Array(20).keys()].map((v, i) => i < 22 ? v : 36 + v)) ziegel.add(hex(farbe(probe, x, y)));
  const glas = rgba('9fb6c8'), glanz = rgba('dbe8f2');
  for (let y = 5; y < 24; y++) { setze(b, 40, y, glas); setze(b, 55, y, glas); }
  for (let x = 40; x < 56; x++) setze(b, x, 5, glas);
  for (let i = 0; i < 4; i++) setze(b, 42 + i, 7 + i, glanz);
  for (let y = 0; y < 18; y++) for (let x = 0; x < 9; x++) {
    const c = farbe(probe, 24 + x, 18 + y);
    if (c[3] > 0 && !ziegel.has(hex(c))) setze(b, 44 + x, 6 + y, c);
  }
  // Vier goldene Schallplatten in schwarzen Rahmen: Rillen, rotes Etikett
  const rahmenF = rgba('0a0a0a'), grundF = rgba('1f1f2a'), goldF = rgba('f2c94c'), rille = rgba('a77a00'), etikett = rgba('b8261b');
  for (const ox of [7, 21, 65, 79]) {
    for (let y = 7; y < 19; y++) for (let x = ox; x < ox + 11; x++) {
      const rand = x === ox || x === ox + 10 || y === 7 || y === 18;
      setze(b, x, y, rand ? rahmenF : grundF);
    }
    const cx = ox + 5, cy = 12.5;
    for (let y = 8; y < 18; y++) for (let x = ox + 1; x < ox + 10; x++) {
      const r = Math.hypot(x - cx, y - cy);
      if (r > 4.3) continue;
      setze(b, x, y, r < 1.3 ? etikett : (r > 2.4 && r < 3.2) ? rille : goldF);
    }
    setze(b, cx, Math.floor(cy), rahmenF);
  }
  return b;
}

/* Welche Szene zu welchem Rang. */
const SZENE = {
  garage: () => szene('garage'), proberaum: () => szene('proberaum'), vorband: () => szene('klub'),
  support: () => szene('halle'), headliner: () => szene('arena'), festival: () => szene('goldbuehne'),
  halloffame: hallOfFame
};

/* ---------------- Bogen schreiben ---------------- */

function bogen(teile, w, h) {
  const b = leer(w * teile.length, h);
  teile.forEach((t, i) => klebe(b, t, i * w, 0));
  return b;
}

const ausgaben = {
  'aufnaeher.png': bogen(BILDER.map(aufnaeher), 24, 24),
  'raenge.png': bogen(RAENGE.map(r => { const f = SZENE[r.id]; if (!f) throw new Error(`Keine Szene fuer ${r.id}`); return f(); }), 96, 48)
};

if (process.argv.includes('--pruefe')) {
  // Verglichen werden die Pixel, nicht die Bytes: ein anderes zlib darf
  // anders packen, solange dasselbe Bild herauskommt.
  const abweichend = Object.entries(ausgaben).filter(([name, soll]) => {
    try {
      const ist = lies(join(ZIEL, name));
      return ist.w !== soll.w || ist.h !== soll.h || Buffer.compare(Buffer.from(ist.px), Buffer.from(soll.px)) !== 0;
    } catch { return true; }
  }).map(([name]) => name);
  if (abweichend.length) {
    console.log(`Pixel-Boegen veraltet: ${abweichend.join(', ')} — bitte "node tools/pixel.mjs" ausfuehren.`);
    process.exit(1);
  }
  console.log('Pixel-Boegen passen zu den Quellen.');
  process.exit(0);
}

mkdirSync(ZIEL, { recursive: true });
for (const [name, b] of Object.entries(ausgaben)) writeFileSync(join(ZIEL, name), kodiere(b));
console.log(`assets/pixel/aufnaeher.png  ${BILDER.length} × 24×24`);
console.log(`assets/pixel/raenge.png     ${RAENGE.length} × 96×48`);
