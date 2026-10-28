// Die Motive der Anlass-Banner, als Zeichenraster. tools/pixel.mjs macht
// daraus assets/pixel/anlaesse.png.
//
// Eigene Pixel-Art. Jedes Motiv ist 15 x 15 und hat zwei Bilder, die der
// Banner per CSS steps(2) umschaltet. Reihenfolge und Namen sind MOTIVE in
// js/anlaesse.js; pixel.mjs prueft, dass beides zusammenpasst.

export const KANTE = 15;

/** Zeichen im Raster → Farbe. '.' ist durchsichtig. */
export const PALETTE = {
  G: '2f8a43', g: '1d5c2e', h: '5fbf6a', T: '7a4a22', t: '4f2f14',
  Y: 'f2c14e', W: 'f6f2e8', R: 'd2423a', r: 'e8645a', o: '8e2a25', B: '4aa3df',
  O: 'e8782a', q: 'b4541a', x: '3a3340', n: '1f3b57', k: 'f2a7b8',
  S: 'a8a4ae', s: '6e6a76', u: '8a5fd0', C: 'f1e4c4', c: 'a8946a'
};

const leerZeile = () => '.'.repeat(KANTE);
const raster = () => Array.from({ length: KANTE }, () => leerZeile().split(''));
const setze = (r, y, x, c) => { r[y][x] = c; };
const zeilen = r => r.map(z => z.join(''));

/* Tannenbaum: Reihen mit wachsender Breite, aussen dunkel, innen hell.
   Die Lichterkette wechselt von Bild zu Bild die Farben, der Stern blinkt. */
const BAUM = [1, 3, 5, 3, 5, 7, 9, 7, 9, 11, 13];     // Reihe 2 bis 12
const LICHTER = [[4, 7], [6, 6], [7, 9], [8, 5], [8, 10], [10, 4], [10, 9], [11, 6], [12, 3], [12, 8], [12, 11]];
const LICHT_FARBEN = ['R', 'Y', 'B'];

function tannenbaum(bild) {
  const r = raster();
  setze(r, 0, 7, bild ? 'W' : 'Y');
  for (const x of [6, 7, 8]) setze(r, 1, x, 'Y');
  BAUM.forEach((breite, i) => {
    const y = 2 + i, links = 7 - (breite - 1) / 2;
    for (let k = 0; k < breite; k++) {
      const rand = k === 0 || k === breite - 1;
      setze(r, y, links + k, rand ? 'g' : (k === 1 && breite > 3 ? 'h' : 'G'));
    }
  });
  LICHTER.forEach(([y, x], i) => {
    if (r[y][x] === '.') throw new Error(`Tannenbaum: Licht (${y},${x}) sitzt neben dem Baum`);
    setze(r, y, x, LICHT_FARBEN[(i + bild) % 3]);
  });
  for (const y of [13, 14]) for (const x of [6, 7, 8]) setze(r, y, x, x === 8 ? 't' : 'T');
  return zeilen(r);
}

/* Geschenk: rote Kiste mit gelbem Band, die Schleife wippt, ein Funke blitzt. */
function geschenk(bild) {
  const r = raster();
  const schleife = bild
    ? ['.'.repeat(KANTE), '....YYY.YYY....', '...Y...Y...Y...', '....YYYYYYY....']
    : ['....YYY.YYY....', '...Y...Y...Y...', '....YYY.YYY....', '......YYY......'];
  schleife.forEach((z, i) => { for (let x = 0; x < KANTE; x++) if (z[x] !== '.') setze(r, 2 + i, x, z[x]); });
  setze(r, bild ? 3 : 1, bild ? 1 : 12, 'W');
  // Deckel: Reihen 6 bis 8, Spalten 1 bis 13
  for (let x = 1; x <= 13; x++) { setze(r, 6, x, 'o'); setze(r, 8, x, 'o'); }
  for (let x = 2; x <= 12; x++) setze(r, 7, x, 'R');
  setze(r, 7, 1, 'o'); setze(r, 7, 13, 'o');
  // Kiste: Reihen 9 bis 14, Spalten 2 bis 12
  for (let y = 9; y <= 13; y++) { setze(r, y, 2, 'o'); setze(r, y, 12, 'o'); for (let x = 3; x <= 11; x++) setze(r, y, x, 'R'); }
  for (let x = 2; x <= 12; x++) setze(r, 14, x, 'o');
  for (let y = 10; y <= 12; y++) setze(r, y, 3, 'r');
  setze(r, 7, 3, 'r');
  // Band: senkrecht in der Mitte, ueber Deckel und Kiste
  for (let y = 6; y <= 14; y++) for (const x of [6, 7, 8]) setze(r, y, x, 'Y');
  return zeilen(r);
}

/* Flaeche mit Kontur: Die Maske ist eine Menge von "y,x"; Zellen am Rand bekommen die Kontur,
   alle anderen die Fuellung. So bleibt jede Form lesbar, auf dunklem wie auf hellem Grund. */
const zelle = (y, x) => `${y},${x}`;
function flaeche(r, maske, fuell, kontur) {
  for (const k of maske) {
    const [y, x] = k.split(',').map(Number);
    const rand = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]].some(([a, b]) => !maske.has(zelle(a, b)));
    setze(r, y, x, rand ? kontur : fuell);
  }
}
/** Reihen als [y, von, bis] (beide inklusive). */
function reihen(liste) {
  const m = new Set();
  for (const [y, von, bis] of liste) for (let x = von; x <= bis; x++) m.add(zelle(y, x));
  return m;
}
/** Breiten je Reihe, mittig auf Spalte 7, ab Reihe y0. */
const mittig = (y0, breiten) => reihen(breiten.map((b, i) => [y0 + i, 7 - (b - 1) / 2, 7 + (b - 1) / 2]));

/* Ei: Zickzackband, das von Bild zu Bild die Seite wechselt (das Ei wackelt). */
function ei(bild) {
  const r = raster();
  const m = mittig(2, [3, 5, 7, 9, 9, 11, 11, 11, 11, 9, 9, 7]);
  flaeche(r, m, 'B', 'n');
  for (const [y, versatz] of [[7, 0], [8, 1]]) {
    for (let x = 1; x <= 13; x++) if (m.has(zelle(y, x)) && r[y][x] === 'B' && (x + versatz + bild) % 2 === 0) setze(r, y, x, 'Y');
  }
  for (let x = 1; x <= 13; x++) if (m.has(zelle(10, x)) && r[10][x] === 'B' && (x + bild) % 3 === 0) setze(r, 10, x, 'R');
  setze(r, bild ? 5 : 4, bild ? 5 : 6, 'W');
  return zeilen(r);
}

/* Hase: lange Ohren, das rechte knickt von Bild zu Bild, im zweiten Bild blinzelt er. */
function hase(bild) {
  const r = raster();
  const kopf = reihen([[6, 3, 11], [7, 2, 12], [8, 2, 12], [9, 2, 12], [10, 2, 12], [11, 2, 12], [12, 3, 11], [13, 4, 10], [14, 4, 10]]);
  const links = reihen([0, 1, 2, 3, 4, 5].map(y => [y, 3, 5]));
  const rechts = reihen([0, 1, 2, 3, 4, 5].map(y => [y, y < 3 && bild ? 10 : 9, y < 3 && bild ? 12 : 11]));
  for (const m of [links, rechts, kopf]) flaeche(r, m, 'W', 'x');
  for (let y = 1; y <= 4; y++) { setze(r, y, 4, 'k'); setze(r, y, y < 3 && bild ? 11 : 10, 'k'); }
  if (!bild) { setze(r, 8, 5, 'x'); setze(r, 8, 9, 'x'); setze(r, 9, 5, 'x'); setze(r, 9, 9, 'x'); }
  else { setze(r, 9, 5, 'x'); setze(r, 9, 6, 'x'); setze(r, 9, 8, 'x'); setze(r, 9, 9, 'x'); }
  setze(r, 10, 7, 'k'); setze(r, 11, 6, 'x'); setze(r, 11, 8, 'x');
  return zeilen(r);
}

/* Kuerbis: Gesicht leuchtet, im zweiten Bild blinzelt er und lacht kleiner. */
function kuerbis(bild) {
  const r = raster();
  const m = mittig(3, [7, 11, 13, 13, 13, 13, 13, 13, 13, 11, 7]);
  flaeche(r, m, 'O', 'q');
  for (let y = 5; y <= 11; y++) { setze(r, y, 3, 'q'); setze(r, y, 11, 'q'); }
  for (const x of [7, 8]) setze(r, 1, x, 'G');
  for (const x of [6, 7]) setze(r, 2, x, 'g');
  for (const x of [4, 5, 9, 10]) { setze(r, 7, x, 'Y'); if (!bild) setze(r, 6, x, 'Y'); }
  for (let x = 4; x <= 10; x++) setze(r, 10, x, 'Y');
  if (!bild) for (let x = 5; x <= 9; x++) setze(r, 11, x, 'Y');
  return zeilen(r);
}

/* Geist: wabert, die Augen rutschen eine Reihe, der Saum wechselt die Zacken. */
function geist(bild) {
  const r = raster();
  const saum = bild ? [3, 5, 6, 8, 9, 11] : [3, 4, 6, 7, 9, 10];
  const m = reihen([[1, 5, 9], [2, 4, 10], ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(y => [y, 3, 11])]);
  for (const x of saum) m.add(zelle(13, x));
  flaeche(r, m, 'W', 'x');
  const y0 = bild ? 6 : 5;
  for (const x of [5, 9]) { setze(r, y0, x, 'x'); setze(r, y0 + 1, x, 'x'); }
  if (bild) setze(r, 9, 7, 'x'); else for (const x of [6, 7, 8]) setze(r, 9, x, 'x');
  return zeilen(r);
}

/* Grabstein: Kreuz im Stein, auf dem Grab steigt ein Irrlicht. */
function grabstein(bild) {
  const r = raster();
  flaeche(r, reihen([[3, 5, 9], [4, 4, 10], ...[5, 6, 7, 8, 9, 10, 11, 12].map(y => [y, 3, 11])]), 'S', 's');
  for (let y = 5; y <= 10; y++) setze(r, y, 7, 's');
  for (let x = 5; x <= 9; x++) setze(r, 7, x, 's');
  for (let x = 0; x < KANTE; x++) setze(r, 13, x, 'g');
  for (let x = 0; x < KANTE; x++) setze(r, 14, x, 'g');
  for (const x of [1, 2, 12, 13]) setze(r, 13, x, 'G');
  setze(r, bild ? 1 : 2, 12, 'u'); setze(r, bild ? 0 : 1, 13, 'u');
  return zeilen(r);
}

/* Kerze: das Flackern ist das zweite Bild; im Banner steht sie still. */
function kerze(bild) {
  const r = raster();
  flaeche(r, reihen([...[7, 8, 9, 10, 11, 12].map(y => [y, 6, 8])]), 'C', 'c');
  setze(r, 9, 7, 'C'); setze(r, 10, 7, 'C');
  flaeche(r, reihen([[13, 4, 10], [14, 4, 10]]), 'S', 's');
  setze(r, 6, 7, 'x');
  if (!bild) { setze(r, 3, 7, 'Y'); setze(r, 4, 7, 'Y'); for (const x of [6, 7, 8]) setze(r, 5, x, 'Y'); setze(r, 5, 7, 'O'); }
  else { setze(r, 3, 8, 'Y'); setze(r, 4, 7, 'Y'); setze(r, 4, 8, 'Y'); for (const x of [6, 7, 8]) setze(r, 5, x, 'Y'); setze(r, 5, 7, 'O'); }
  return zeilen(r);
}

const BAUER = { tannenbaum, geschenk, ei, hase, kuerbis, geist, grabstein, kerze };

/** Je Motiv zwei Raster (Bild 1, Bild 2), in der Reihenfolge von MOTIVE. */
export function motivRaster(ids) {
  return ids.map(id => {
    if (!BAUER[id]) throw new Error(`Kein Motiv fuer ${id} in tools/pixel-anlaesse.mjs`);
    const bilder = [BAUER[id](0), BAUER[id](1)];
    for (const b of bilder) {
      if (b.length !== KANTE || b.some(z => z.length !== KANTE)) throw new Error(`${id}: Raster nicht ${KANTE} x ${KANTE}`);
      for (const z of b) for (const c of z) if (c !== '.' && !PALETTE[c]) throw new Error(`${id}: unbekanntes Zeichen ${c}`);
    }
    if (bilder[0].join() === bilder[1].join()) throw new Error(`${id}: beide Bilder gleich, dann bewegt sich nichts`);
    return bilder;
  });
}
