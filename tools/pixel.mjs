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
import { BILDER, RAENGE, ADJ, NOMEN, PLATTEN } from '../js/merch.js';

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
  return { rahmen, symbol, farben, grund, innen, mitte: { x: sx / n, y: sy / n } };
}

/* ---------------- Rahmen je Kategorie ---------------- */

const zerlegt = name => zerlege(lies(join(QUELLE, 'aufnaeher', `${name}.png`)));
/**
 * Achteck fuer die Kraft, in den Farben der Raute aus "eisen": Kontur,
 * darin eine Naht im Wechsel Orange/Grund, innen der Grund. Die Raute
 * selbst laesst oben und unten zu wenig Platz fuer eine Figur mit Hantel.
 */
function achteck() {
  const vorbild = zerlegt('eisen');
  const kontur = rgba('0a0a0a'), grund = rgba(vorbild.grund), naht = rgba('e04a1f');
  const b = leer(24, 24);
  const drin = (x, y) => { const dx = Math.abs(x - 11.5), dy = Math.abs(y - 11.5); return dx <= 11.5 && dy <= 11.5 && dx + dy <= 17; };
  const rand = (x, y, d) => { for (let i = -d; i <= d; i++) for (let j = -d; j <= d; j++) if (!drin(x + i, y + j)) return true; return false; };
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    if (!drin(x, y)) continue;
    setze(b, x, y, rand(x, y, 1) ? kontur : rand(x, y, 2) ? ((x + y) % 2 ? naht : grund) : grund);
  }
  // Ohne eigenes Symbol: die Symbolfarben kommen von der Raute
  // Figur hell wie die Raute, Stange und Scheiben in der Nahtfarbe — so zaehlt man sie
  return { ...zerlege(b), farben: [vorbild.farben[0], 'e04a1f'] };
}

const RAHMEN = {
  // rund, Navy mit Goldnaht; Akzent im Symbol ist das Gold der Naht
  buehne: (r => ({ ...r, farben: [r.farben[0], 'd8b44a'] }))(zerlegt('serie4')),
  kraft: achteck(),               // Achteck, Schwarz mit Orange
  rad: zerlegt('anker'),          // eckig, Gruen
  comeback: zerlegt('lehrmeister'), // Wappen, Weinrot
  serie: zerlegt('legende'),      // Stern, Gold
  tour: zerlegt('tourkomplett')   // Rechteck, Lila: Monats-Tour und Soundcheck
};

/* Eigene Zeichnungen, je hoechstens 13 breit. H = Hauptfarbe, A = Akzent. */
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
  ],
  ticket: [               // 25 Gigs: Eintrittskarte mit Abriss
    'HHHHHHHHHHH',
    'H..A......H',
    '...A.AAAA..',
    'H..A......H',
    'HHHHHHHHHHH'
  ],
  plakat: [               // 50 Gigs: Konzertplakat mit Stern
    'HHHHHHHHH',
    'H...A...H',
    'H..AAA..H',
    'H.AAAAA.H',
    'H..A.A..H',
    'H.......H',
    'H.HHHHH.H',
    'H.......H',
    'H.HHH...H',
    'HHHHHHHHH'
  ],
  amp: [                  // 100 Gigs: Topteil auf der Box
    'HHHHHHHHHHH',
    'H.A.A.A.A.H',
    'HHHHHHHHHHH',
    'H.........H',
    'H.AAA.AAA.H',
    'H.A.A.A.A.H',
    'H.AAA.AAA.H',
    'H.........H',
    'HHHHHHHHHHH'
  ],
  feuerzeug: [            // 250 Gigs: Feuerzeuge hoch
    '....A....',
    '...AAA...',
    '...AHA...',
    '....A....',
    '..HHHHH..',
    '..H.H.H..',
    '..HHHHH..',
    '..H...H..',
    '..H...H..',
    '..HHHHH..'
  ],
  fahrrad: [              // 100 km
    '....HHH...HH.',
    '.....H....H..',
    '.AAA.HHH.AAA.',
    'A...AH..A...A',
    'A.H.A.H.A.H.A',
    'A...A...A...A',
    '.AAA.....AAA.'
  ],
  kettenblatt: [          // 500 km
    '....H.H....',
    '..HHHHHHH..',
    '.HH.....HH.',
    'HH..AAA..HH',
    '.H.A...A.H.',
    'HH.A.H.A.HH',
    '.H.A...A.H.',
    'HH..AAA..HH',
    '.HH.....HH.',
    '..HHHHHHH..',
    '....H.H....'
  ],
  strasse: [              // 2500 km: Strasse bis zum Horizont
    '....H...H....',
    '....H.A.H....',
    '...H..A..H...',
    '...H.....H...',
    '..H...A...H..',
    '..H...A...H..',
    '.H.........H.',
    '.H....A....H.',
    'H.....A.....H'
  ],
  globus: [               // 5000 km: einmal um die halbe Welt
    '...HHHHH...',
    '..H.AA..HH.',
    '.H.AAA...H.',
    'H..AAAA...H',
    'H...AA.AA.H',
    'H.....AAA.H',
    'H......AA.H',
    '.H.A.....H.',
    '..HAA...H..',
    '...HHHHH...'
  ],
  kalender: [             // 12 Wochen Serie
    '..H.....H..',
    'HHHHHHHHHHH',
    'HAAAAAAAAAH',
    'H.........H',
    'H.H.H.H.H.H',
    'H.........H',
    'H.H.H.H.H.H',
    'H.........H',
    'H.H.H.A.H.H',
    'HHHHHHHHHHH'
  ],
  bruecke: [              // Gelenkig 4: Bruecke, Haende und Fuesse am Boden
    '....HHHHHHH....',
    '..HH.......HH..',
    '.H...........H.',
    '.H...........H.',
    'H...........HHH',
    'H............HH',
    'AAAAAAAAAAAAAAA'
  ],
  spagat: [               // Gelenkig 12: Spagat, Arme hoch
    '..H.........H..',
    '...H..HHH..H...',
    '....H.HHH.H....',
    '.....HHHHH.....',
    '......HHH......',
    '......HHH......',
    '.....HHHHH.....',
    'HHHHHHHHHHHHHHH',
    'AAAAAAAAAAAAAAA'
  ],
  radhantel: [            // Crossover 10: Rad und Hantel
    '.AAA...H...H.',
    'A...A..H...H.',
    'A.H.AHHHHHHHH',
    'A...A..H...H.',
    '.AAA...H...H.'
  ],
  tourplakat: [           // Tour 3: Tourplakat, oben der Name, darunter drei Termine
    'HHHHHHHHHHH',
    'H.........H',
    'H.AAAAAAA.H',
    'H.........H',
    'H.HH.HHHH.H',
    'H.........H',
    'H.HH.HHHH.H',
    'H.........H',
    'H.HH.HHHH.H',
    'H.........H',
    'HHHHHHHHHHH'
  ],
  tourbus: [              // Tour 6: Nightliner mit Fenstern
    'HHHHHHHHHHHH.',
    'H.A.A.A.A.HHH',
    'H.A.A.A.A.H.H',
    'HHHHHHHHHHHHH',
    'HHHHHHHHHHHHH',
    '.AA.....AA...'
  ],
  lorbeer: [              // Tour 12: Lorbeerkranz um einen Stern
    'H...........H',
    'HH....A....HH',
    'HH...AAA...HH',
    'HHHAAAAAAAHHH',
    '.HH.AAAAA.HH.',
    '.HHHAA.AAHHH.',
    '..HHA...AHH..',
    '...HHH.HHH...',
    '.....HHH.....'
  ],
  mischpult: [            // Soundcheck 12: Mischpult, Fader auf verschiedener Hoehe
    'HHHHHHHHHHHHH',
    'H...........H',
    'H.H.A.H.H.H.H',
    'H.A.H.H.H.A.H',
    'H.H.H.A.H.H.H',
    'H.H.H.H.A.H.H',
    'H.H.H.H.H.H.H',
    'H...........H',
    'HHHHHHHHHHHHH'
  ]
};

/*
 * Lift-Figuren von vorn, 17 breit, kraeftig gezeichnet. B ist die Zeile der
 * Stange; woran man den Lift erkennt, ist vor allem, wo die Stange zur
 * Figur liegt: ueber dem Kopf (Druecken), im Nacken (Kniebeuge), an den
 * Schienbeinen (Kreuzheben), am Bauch mit Ellbogen raus (Rudern), ueber
 * der Brust auf der Bank (Bankdruecken).
 */
const POSE = {
  squat: [
    '.......HHH.......',
    '.......HHH.......',
    'B',
    '.....HH.H.HH.....',
    '......HHHHH......',
    '.......HHH.......',
    '......HH.HH......',
    '....HHH...HHH....',
    '...HH.......HH...',
    '....HH.....HH....',
    '.....HH...HH.....'
  ],
  bench: [
    'B',
    '.....HH...HH.....',
    '.....HH...HH.....',
    '.....HHHHHHH.....',
    '....HHHHHHHHH....',
    '.................',
    '..AAAAAAAAAAAAA..',
    '...A.........A...',
    '...A.........A...'
  ],
  row: [
    '.......HHH.......',
    '.....HHHHHHH.....',
    '...HHH.HHH.HHH...',
    '....HH.HHH.HH....',
    'B',
    '.......HHH.......',
    '......HH.HH......',
    '.....HH...HH.....',
    '.....HH...HH.....',
    '....HHH...HHH....'
  ],
  ohp: [
    'B',
    '.....HH...HH.....',
    '.....HH.H.HH.....',
    '.....HHHHHHH.....',
    '......HHHHH......',
    '.......HHH.......',
    '.......HHH.......',
    '......HH.HH......',
    '......HH.HH......',
    '.....HHH.HHH.....'
  ],
  deadlift: [
    '.......HHH.......',
    '.......HHH.......',
    '.....HHHHHHH.....',
    '.....H.HHH.H.....',
    '.....H.HHH.H.....',
    '.....H.H.H.H.....',
    '.....H.H.H.H.....',
    'B',
    '.....HH...HH.....',
    '....HHH...HHH....'
  ],
  figur: [
    '.......HHH.......',
    '.......HHH.......',
    '.....HHHHHHH.....',
    '.....H.HHH.H.....',
    '.....H.HHH.H.....',
    'B',
    '......HH.HH......',
    '......HH.HH......',
    '......HH.HH......',
    '.....HHH.HHH.....'
  ]
};
const BREIT = 17;

/**
 * Lift-Figur als Punkte. scheiben: 1–4 Scheiben je Seite (Plattenclub),
 * aussen beginnend, im Wechsel gross und klein, damit man sie zaehlen kann.
 * waage: kurze Stange ohne Scheiben, die Figur steht auf einer Waage
 * (Koerpergewicht-Marken).
 */
function figur(lift, { scheiben = 0, waage = false } = {}) {
  const pose = POSE[lift] || POSE.figur;
  const punkte = [];
  let stange = 0;
  pose.forEach((zeile, y) => {
    if (zeile === 'B') {
      stange = y;
      const von = waage ? 3 : 0, bis = waage ? BREIT - 4 : BREIT - 1;
      for (let x = von; x <= bis; x++) punkte.push({ x, y, rolle: 'A' });
      return;
    }
    [...zeile].forEach((z, x) => { if (z !== '.') punkte.push({ x, y, rolle: z }); });
  });
  for (let k = 0; k < scheiben; k++) {
    const hoch = k % 2 ? 2 : 3;
    for (const x of [k, BREIT - 1 - k]) for (let dy = -hoch; dy <= hoch; dy++) punkte.push({ x, y: stange + dy, rolle: 'A' });
  }
  if (waage) {
    const unten = Math.max(...punkte.map(p => p.y)) + 1;
    for (let x = 3; x <= BREIT - 4; x++) punkte.push({ x, y: unten, rolle: 'A' });
    for (const x of [7, 8, 9]) punkte.push({ x, y: unten + 1, rolle: 'H' });
  }
  return { punkte };
}

/* Welcher Aufnaeher welches Motiv bekommt: Quellbild (Name) oder Zeichnung (#Name). */
const MOTIV = {
  debuet: 'firstblood', jam: 'saitenhexer', unplugged: 'soundcheck', maxout: 'impressive',
  zugaben: 'gegoennt', tight: 'sitzt25', roadcrew: 'vorbereitet',
  'gigs-10': 'setlist', 'gigs-25': '#ticket', 'gigs-50': '#plakat', 'gigs-100': '#amp', 'gigs-250': '#feuerzeug',
  club: 'eisenhart', hangar: '#hangar',
  'km-100': '#fahrrad', 'km-500': '#kettenblatt', 'km-1000': 'tour10', 'km-2500': '#strasse', 'km-5000': '#globus',
  hoehe: '#hoehe', century: 'flawless', doom: 'boss1', openair: 'nacht',
  'crossover-1': 'kilometer', 'crossover-10': '#radhantel', 'crossover-26': 'boss3',
  comeback: 'metal', rueckweg: 'nachgefasst', reunion: 'stammtisch',
  'gelenkig-1': 'gelenkig', 'gelenkig-4': '#bruecke', 'gelenkig-12': '#spagat',
  'serie-4': 'serie4', 'serie-12': '#kalender', 'serie-26': 'trainingslager', 'serie-52': 'legende',
  'tour-1': 'tourkomplett', 'tour-3': '#tourplakat', 'tour-6': '#tourbus', 'tour-12': '#lorbeer',
  'soundcheck-4': 'soundcheck4', 'soundcheck-12': '#mischpult'
};
/* Symbole, deren Farbe die Aussage ist: Blut bleibt rot. */
const EIGENE_FARBE = new Set(['debuet']);

const KATEGORIE = {
  debuet: 'buehne', gigs: 'buehne', jam: 'buehne', unplugged: 'buehne', maxout: 'buehne', zugaben: 'buehne', tight: 'buehne', roadcrew: 'buehne',
  platten: 'kraft', club: 'kraft', hangar: 'kraft', koerper: 'kraft', gelenkig: 'kraft',
  km: 'rad', hoehe: 'rad', century: 'rad', doom: 'rad', openair: 'rad', crossover: 'rad',
  comeback: 'comeback', rueckweg: 'comeback', reunion: 'comeback', serie: 'serie',
  tour: 'tour', soundcheck: 'tour'
};

const raster = zeilen => {
  const punkte = [];
  zeilen.forEach((zeile, y) => [...zeile].forEach((z, x) => { if (z !== '.') punkte.push({ x, y, rolle: z }); }));
  return { punkte };
};

function motiv(id) {
  const [gruppe, a, b] = id.split('-');
  if (gruppe === 'platten') return figur(a, { scheiben: Number(b) });
  if (gruppe === 'koerper') return figur(a, { waage: true });
  const quelle = MOTIV[id];
  if (!quelle) throw new Error(`Kein Motiv fuer ${id}`);
  if (quelle.startsWith('#')) return raster(EIGENE[quelle.slice(1)]);
  const s = zerlegt(quelle);
  return { punkte: s.symbol.map(p => ({ x: p.x, y: p.y, rolle: p.f === s.farben[0] ? 'H' : 'A',
    f: EIGENE_FARBE.has(id) ? rgba(p.f) : null })) };
}

function aufnaeher(id) {
  const r = RAHMEN[KATEGORIE[id.split('-')[0]]];
  if (!r) throw new Error(`Keine Kategorie fuer ${id}`);
  const bild = kopie(r.rahmen);
  const { punkte, anker } = motiv(id);
  // Mittig auf den Innenraum: am Anker, sonst an der Mitte des Motivs
  let mx, my;
  if (anker) ({ x: mx, y: my } = anker);
  else {
    const xs = punkte.map(p => p.x), ys = punkte.map(p => p.y);
    mx = (Math.min(...xs) + Math.max(...xs)) / 2; my = (Math.min(...ys) + Math.max(...ys)) / 2;
  }
  const dx = Math.round(r.mitte.x - mx), dy = Math.round(r.mitte.y - my);
  const haupt = rgba(r.farben[0]), akzent = rgba(r.farben[1] || r.farben[0]);
  for (const p of punkte) {
    const x = p.x + dx, y = p.y + dy;
    // Nie auf Naht oder Kontur: was ueber den Innenraum hinausragt, faellt weg
    if (x < 0 || y < 0 || x >= bild.w || y >= bild.h || !r.innen(x, y)) continue;
    setze(bild, x, y, p.f || (p.rolle === 'H' ? haupt : akzent));
  }
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

/* ---------------- Endgegner der Monats-Tour ---------------- */

/*
 * Ein gehoernter Schaedel, 24×24. Zwei Bilder nebeneinander: lebendig mit
 * gluehenden Augen, besiegt mit Riss und erloschenen Augen.
 * K Kontur, H Horn, B Knochen, S Schatten, R Auge, D Dunkel.
 */
const BOSS = [
  'KK....................KK',
  'KHK..................KHK',
  'KHHK................KHHK',
  '.KHHK..............KHHK.',
  '.KHHHK..KKKKKKKK..KHHHK.',
  '..KHHHKKBBBBBBBBKKHHHK..',
  '...KHHKBBBBBBBBBBKHHK...',
  '....KKBBBBBBBBBBBBKK....',
  '.....KBBBBBBBBBBBBK.....',
  '....KBBBBBBBBBBBBBBK....',
  '....KBKKKKBBBBKKKKBK....',
  '....KBKRRKBBBBKRRKBK....',
  '....KBKRRKBBBBKRRKBK....',
  '....KBBKKBBBBBBKKBBK....',
  '....KSBBBBBKKBBBBBSK....',
  '.....KSBBBBKKBBBBSK.....',
  '......KSBBBBBBBBSK......',
  '......KBKBKBKBKBKK......',
  '......KBBBBBBBBBBK......',
  '.......KSBKBKBKSK.......',
  '........KKKKKKKK........'
];
const BOSS_FARBE = { K: '0a0a0a', H: '8a6a48', B: 'e8dcc0', S: 'b0a284', R: 'ff3b1f', D: '3a2e28' };
const BOSS_RISS = [[12, 5], [11, 6], [11, 7], [12, 8], [13, 9]];

function endgegner() {
  const b = leer(48, 24);
  const oben = 24 - BOSS.length;
  for (const [ox, besiegt] of [[0, false], [24, true]]) {
    BOSS.forEach((zeile, y) => [...zeile].forEach((z, x) => {
      if (z === '.') return;
      const rolle = besiegt && z === 'R' ? 'D' : z;
      setze(b, ox + x, oben + y, rgba(BOSS_FARBE[rolle]));
    }));
    if (besiegt) for (const [x, y] of BOSS_RISS) setze(b, ox + x, oben + y, rgba(BOSS_FARBE.K));
  }
  return b;
}

/* ---------------- Tourshirts ---------------- */

/*
 * Ein T-Shirt, 64×60, flach hingelegt: Schultern, Aermel, Rippkragen,
 * Saeume, ein paar Falten. Vorne ein tiefer Halsausschnitt, hinten ein
 * flacher. Die Stofffarbe kommt vom ersten Wort des Tournamens (M.ADJ),
 * alle dunkel genug, dass der helle Siebdruck darauf lesbar bleibt.
 */
const STOFF = {
  Iron: '2c2c30', Steel: '28323d', Thunder: '2a2240', Heavy: '1b1a19', Black: '111113', Electric: '15264a',
  Molten: '4a1616', Savage: '27321d', Midnight: '141b33', Raw: '3a2d1d', Burning: '561f10', Chrome: '383c42'
};
const SHIRT_W = 64, SHIRT_H = 60;
const SHIRT_FORM = [[23, 1], [41, 1], [52, 5], [63, 19], [56, 27], [49, 22], [50, 59], [13, 59], [14, 22], [7, 27], [0, 19], [11, 5]];

function innen(poly, x, y) {
  let drin = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
}
const mischen = (hexA, f) => { const c = rgba(hexA); return Uint8Array.from([...c.slice(0, 3)].map(v => Math.max(0, Math.min(255, Math.round(v * f)))).concat([255])); };
/** Abstand eines Punkts zur Strecke a–b. */
const zurStrecke = (x, y, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
};

function shirt(stoff, hinten) {
  const b = leer(SHIRT_W, SHIRT_H);
  const hals = (x, y) => ((x - 31.5) / 9.5) ** 2 + (y / (hinten ? 3.2 : 6.5)) ** 2 <= 1;
  const drin = (x, y) => x >= 0 && y >= 0 && x < SHIRT_W && y < SHIRT_H && innen(SHIRT_FORM, x + .5, y + .5) && !hals(x, y);
  const kontur = rgba('0a0a0a');
  for (let y = 0; y < SHIRT_H; y++) for (let x = 0; x < SHIRT_W; x++) {
    if (!drin(x, y)) continue;
    const rand = !drin(x - 1, y) || !drin(x + 1, y) || !drin(x, y - 1) || !drin(x, y + 1);
    if (rand) { setze(b, x, y, kontur); continue; }
    let f = 1;
    // Rippkragen um den Ausschnitt
    if (((x - 31.5) / 11.5) ** 2 + (y / (hinten ? 5.2 : 8.5)) ** 2 <= 1) f = (x + y) % 2 ? 1.35 : 1.2;
    // Aermel- und Saumnaht
    else if (zurStrecke(x, y, [63, 19], [56, 27]) < 2.6 || zurStrecke(x, y, [0, 19], [7, 27]) < 2.6) f = 0.78;
    else if (y >= 56) f = 0.78;
    // Achselnaht und Falten
    else if (zurStrecke(x, y, [14, 22], [11, 6]) < 0.8 || zurStrecke(x, y, [49, 22], [52, 6]) < 0.8) f = 0.82;
    else if (zurStrecke(x, y, [19, 30], [24, 52]) < 0.6 || zurStrecke(x, y, [44, 34], [41, 50]) < 0.6) f = 0.86;
    // Licht von links oben, Schatten zur rechten Kante
    else if (x > 44 && y > 22) f = 0.9;
    else if (x < 22 && y < 30) f = 1.08;
    setze(b, x, y, mischen(stoff, f));
  }
  return b;
}

/*
 * Embleme fuer die Brust, 20×20, zweifarbig wie ein Siebdruck: C cremig,
 * A Glut. Je ein Motiv fuer das zweite Wort des Tournamens (M.NOMEN).
 */
const DRUCK = { C: rgba('ece3cb'), A: rgba('e0601f') };
const feld20 = f => { const z = []; for (let y = 0; y < 20; y++) { let r = ''; for (let x = 0; x < 20; x++) r += f(x + .5, y + .5) || '.'; z.push(r); } return z; };
const EMBLEM = {
  Barbell: [
    '..CC............CC..',
    '.CCCC..........CCCC.',
    '.CCCC.C......C.CCCC.',
    '.CCCC.C......C.CCCC.',
    'ACCCCACAAAAAACACCCCA',
    'ACCCCACAAAAAACACCCCA',
    '.CCCC.C......C.CCCC.',
    '.CCCC.C......C.CCCC.',
    '.CCCC..........CCCC.',
    '..CC............CC..'
  ],
  Plates: feld20((x, y) => {
    const r = Math.hypot(x - 10, y - 10);
    if (r > 9.6) return null;
    if (r > 7.8) return 'C';
    if (r > 6.8) return null;
    if (r > 3.2) return (Math.atan2(y - 10, x - 10) * 4 / Math.PI + 8) % 2 < 0.25 ? null : 'A';
    if (r > 1.6) return 'C';
    return null;
  }),
  Chalk: [
    '......A...A.........',
    '...A....A....A..A...',
    '.....AAA.AAA.A......',
    '..A.AAAAAAAAAAA.A...',
    '....AAAAAAAAAAAA....',
    '...AAAAAAAAAAAAAA...',
    'CCCCCCCCCCCCCCCCCCCC',
    '.CCCCCCCCCCCCCCCCCC.',
    '.CCCCCCCCCCCCCCCCCC.',
    '..CCCCCCCCCCCCCCCC..',
    '...CCCCCCCCCCCCCC...',
    '....CCCCCCCCCCCC....',
    '......CCCCCCCC......',
    '.......CCCCCC.......',
    '......CCCCCCCC......'
  ],
  Anvil: [
    '..............A...A.',
    '...............A.A..',
    '............AA..A..A',
    '................A...',
    'CCCCCCCCCCCCCCCC....',
    '.CCCCCCCCCCCCCCCCCCC',
    '..CCCCCCCCCCCCCCCC..',
    '....CCCCCCCCCCCC....',
    '......CCCCCCCC......',
    '.......CCCCCC.......',
    '.......CCCCCC.......',
    '.....CCCCCCCCCC.....',
    '...CCCCCCCCCCCCCC...',
    '...CCCCCCCCCCCCCC...',
    '...AAAAAAAAAAAAAA...'
  ],
  Riffs: feld20((x, y) => {
    if (Math.hypot(x - 5.5, y - 14.5) < 4.6 || Math.hypot(x - 8.6, y - 11.2) < 3.2) {
      return Math.hypot(x - 6.6, y - 13.2) < 1.3 ? 'C' : 'A';
    }
    if (x > 16 && x < 19.5 && y > 0.5 && y < 4.5 && x + y > 18) return 'C';
    return zurStrecke(x, y, [8, 12], [17.5, 2.5]) < 0.95 ? 'C' : null;
  }),
  Hammer: [
    '....................',
    '..CCCCCCCCCCCCCC....',
    '.CCCCCCCCCCCCCCCCC..',
    '.CCCCCCCCCCCCCCCCCC.',
    '..CCCCCCCCCCCCCC....',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '........AAA.........',
    '.......CCCCC........',
    '.......CCCCC........',
    '........CCC.........'
  ],
  Voltage: [
    '..........CCCCCC....',
    '.........CCCCCC.....',
    '........CCCCCC......',
    '.......CCCCCC.......',
    '......CCCCCC........',
    '.....CCCCCCCCCCCC...',
    '....CCCCCCCCCCCC....',
    '.........CCCCCC.....',
    '........CCCCCC......',
    '.......CCCCC........',
    '......CCCC....A.....',
    '.....CCC....A...A...',
    '....CC.....A..A.....',
    '...C..........A.....'
  ],
  Furnace: [
    '.........A..........',
    '........AA.....A....',
    '........AAA...AA....',
    '...A...AAAA..AAA....',
    '...AA.AAAAA.AAAA....',
    '..AAA.AACAAAAACAA...',
    '..AAAAAACCAAAACCAA..',
    '..AAAAACCCCAACCCAA..',
    '.AAAAACCCCCCCCCCAAA.',
    '.AAAACCCCCCCCCCCCAA.',
    '.AAAACCCCCCCCCCCCAA.',
    '..AAACCCCCCCCCCCAA..',
    '...AAACCCCCCCCCAA...',
    '.....AAAAAAAAAAA....'
  ],
  Amplifier: [
    'CCCCCCCCCCCCCCCCCCCC',
    'C.A.A.A.A......CC..C',
    'CCCCCCCCCCCCCCCCCCCC',
    'C.A.A.A.A.A.A.A.A..C',
    'C..A.A.A.A.A.A.A.A.C',
    'C.A.A.A.A.A.A.A.A..C',
    'C..A.A.A.A.A.A.A.A.C',
    'C.A.A.A.A.A.A.A.A..C',
    'C..A.A.A.A.A.A.A.A.C',
    'C.A.A.A.A.A.A.A.A..C',
    'C..A.A.A.A.A.A.A.A.C',
    'CCCCCCCCCCCCCCCCCCCC',
    '.CC..............CC.'
  ],
  Rust: feld20((x, y) => {
    const r = Math.hypot(x - 10, y - 10), w = Math.atan2(y - 10, x - 10);
    const zahn = Math.cos(w * 8) > 0.2;
    if (r > (zahn ? 9.6 : 7.4)) return null;
    if (r < 2.6) return null;
    // Rost frisst sich von oben rechts in die Zaehne
    return r > 6.2 && x > 9 && y < 11 ? 'A' : 'C';
  }),
  Rack: [
    '.CC..............CC.',
    '.CC..............CC.',
    '.CC..............CC.',
    '.CCA............ACC.',
    'AAAAAAAAAAAAAAAAAAAA',
    '.CCA............ACC.',
    '.CC..............CC.',
    '.CC..............CC.',
    '.CC..............CC.',
    '.CC..............CC.',
    '.CC..............CC.',
    '.CC..............CC.',
    '.CC..............CC.',
    'CCCC............CCCC'
  ],
  Reps: feld20((x, y) => {
    if (zurStrecke(x, y, [1, 14.5], [19, 3.5]) < 1.1) return 'A';
    return y > 1 && y < 18 && [3, 7, 11, 15].some(s => x > s && x < s + 2) ? 'C' : null;
  })
};

function emblem(name) {
  const zeilen = EMBLEM[name];
  if (!zeilen) throw new Error(`Kein Emblem fuer ${name}`);
  const b = leer(20, 20);
  const oben = Math.floor((20 - zeilen.length) / 2);
  zeilen.forEach((z, y) => [...z].forEach((r, x) => { if (DRUCK[r]) setze(b, x, oben + y, DRUCK[r]); }));
  return b;
}

/* ---------------- Gold und Platin ---------------- */

/*
 * Eine Auszeichnung wie an der Studiowand, 48×60: schwarzer Lackrahmen,
 * Samtgrund mit Zierleiste, die Scheibe mit Rillen, Lichtreflex und
 * farbigem Label, darunter ein Messingschild. Doppelplatin traegt zwei
 * Scheiben, Diamant einen Stein. Reihenfolge wie M.PLATTEN.
 */
const AWARD_W = 48, AWARD_H = 60;
const METALL = {
  gold: { basis: 'd4af37', dunkel: '9a7a1c', hell: 'f6e08a', label: 'b8261b', leiste: 'c9a43a' },
  platin: { basis: 'c9ccd1', dunkel: '8d929a', hell: 'f4f6f9', label: '27468a', leiste: 'b9bdc4' },
  doppelplatin: { basis: 'b3bcc7', dunkel: '6f7884', hell: 'e8eef4', label: '5b2a7a', leiste: 'b9bdc4' },
  diamant: { basis: 'bfe3ef', dunkel: '6aa6bd', hell: 'f6feff', label: '0f5d6e', leiste: 'a8dbe8' }
};

function scheibe(b, cx, cy, r, m) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const d = Math.hypot(x + .5 - cx, y + .5 - cy);
    if (d > r) continue;
    let c;
    if (d < 0.9) c = '0c0c0e';                                   // Loch
    else if (d < r * 0.3) c = m.label;                           // Label
    else if (d < r * 0.36) c = m.dunkel;
    else if (d > r - 1) c = m.dunkel;                            // Rand
    else c = Math.round(d) % 3 === 0 ? m.dunkel : m.basis;      // Rillen
    // Lichtreflex: ein schmaler Bogen oben links
    const w = Math.atan2(y + .5 - cy, x + .5 - cx);
    if (d > r * 0.55 && d < r * 0.85 && w > -2.55 && w < -2.0) c = m.hell;
    setze(b, x, y, rgba(c));
  }
}

function award(id) {
  const m = METALL[id];
  if (!m) throw new Error(`Keine Auszeichnung fuer ${id}`);
  const b = leer(AWARD_W, AWARD_H);
  const rahmen = rgba('121214'), lack = rgba('26262b'), glanz = rgba('3d3d44'), samt = rgba('17151b'), samt2 = rgba('1c1a21');
  for (let y = 0; y < AWARD_H; y++) for (let x = 0; x < AWARD_W; x++) {
    const rand = Math.min(x, y, AWARD_W - 1 - x, AWARD_H - 1 - y);
    let c;
    if (rand === 0) c = rgba('050506');
    else if (rand < 4) c = rand === 1 && (x === 1 || y === 1) ? glanz : rand === 3 ? rahmen : lack;
    else if (rand === 5) c = rgba(m.leiste);                    // Zierleiste
    else c = (x + y) % 2 ? samt : samt2;                        // Samt
    setze(b, x, y, c);
  }
  if (id === 'doppelplatin') { scheibe(b, 18, 21, 11, m); scheibe(b, 30, 25, 11, m); }
  else scheibe(b, 24, 22, 14.5, m);
  if (id === 'diamant') {                                       // Stein mit Funkeln
    const stein = ['..W..', '.WCW.', 'WCCCW', '.WCW.', '..W..'];
    stein.forEach((z, y) => [...z].forEach((r, x) => { if (r !== '.') setze(b, 33 + x, 8 + y, rgba(r === 'W' ? 'ffffff' : '7fd6ee')); }));
    for (const [x, y] of [[31, 7], [39, 9], [36, 14]]) setze(b, x, y, rgba('ffffff'));
  }
  // Messingschild mit gravierten Zeilen
  const messing = rgba('b48a3c'), messingHell = rgba('d8b76a'), gravur = rgba('6b5020');
  for (let y = 42; y < 51; y++) for (let x = 13; x < 35; x++) {
    const kante = y === 42 || x === 13;
    setze(b, x, y, kante ? messingHell : messing);
  }
  for (let x = 16; x < 32; x++) setze(b, x, 45, gravur);
  for (let x = 19; x < 29; x++) if (x % 3) setze(b, x, 48, gravur);
  return b;
}

/* ---------------- Bogen schreiben ---------------- */

function bogen(teile, w, h) {
  const b = leer(w * teile.length, h);
  teile.forEach((t, i) => klebe(b, t, i * w, 0));
  return b;
}

/** Keine zwei Kacheln duerfen gleich aussehen — sonst waere es wieder dasselbe Abzeichen. */
function eindeutig(teile, namen) {
  const gesehen = new Map();
  teile.forEach((t, i) => {
    const k = Buffer.from(t.px).toString('base64');
    if (gesehen.has(k)) throw new Error(`Gleiches Bild: ${gesehen.get(k)} und ${namen[i]}`);
    gesehen.set(k, namen[i]);
  });
  return teile;
}

const ausgaben = {
  'aufnaeher.png': bogen(eindeutig(BILDER.map(aufnaeher), BILDER), 24, 24),
  'boss.png': endgegner(),
  'shirts.png': bogen(ADJ.flatMap(a => { if (!STOFF[a]) throw new Error(`Kein Stoff fuer ${a}`); return [shirt(STOFF[a], false), shirt(STOFF[a], true)]; }), SHIRT_W, SHIRT_H),
  'embleme.png': bogen(eindeutig(NOMEN.map(emblem), NOMEN), 20, 20),
  'platten.png': bogen(PLATTEN.map(p => award(p.id)), AWARD_W, AWARD_H),
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
console.log(`assets/pixel/aufnaeher.png  ${BILDER.length} × 24×24, alle verschieden`);
console.log(`assets/pixel/raenge.png     ${RAENGE.length} × 96×48`);
console.log('assets/pixel/boss.png       2 × 24×24');
console.log(`assets/pixel/shirts.png     ${ADJ.length} × 2 × ${SHIRT_W}×${SHIRT_H}`);
console.log(`assets/pixel/embleme.png    ${NOMEN.length} × 20×20, alle verschieden`);
console.log(`assets/pixel/platten.png    ${PLATTEN.length} × ${AWARD_W}×${AWARD_H}`);
