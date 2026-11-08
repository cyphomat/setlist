// Pixelbilder fuer Curls for the Girls: die Maehne des Haar-o-Meters in fuenf
// Stufen und das Feuerzeug der Power Ballad in zwei Flammenbildern.
//
// Ein Bogen, 24x24 je Bild, in dieser Reihenfolge:
//   0-4  Maehne: kahl, kurz, voll, gross, Hallenformat
//   5-6  Feuerzeug: Flamme nach links, Flamme nach rechts
//
// Gezeichnet wird hier, nicht von Hand im PNG (siehe CLAUDE.md). Die Anzahl
// der Bilder steht auch in js/curls.js; tools/pixel.mjs bricht ab, wenn beide
// auseinanderlaufen.

export const KANTE = 24;

export const PALETTE = {
  Y: 'f2c14e',   // Haar
  y: 'd8892b',   // Haar, Schatten und Spray
  S: 'e9b88e',   // Haut
  G: '15131a',   // Sonnenbrille
  M: 'c0503c',   // Mund
  R: 'd13b2a',   // Flamme, Spitze
  O: 'ef7d1a',   // Flamme, Rand
  F: 'f5d142',   // Flamme, Mitte
  W: 'fff3b0',   // Flamme, Kern
  L: 'b9bec5',   // Feuerzeug, Metall hell
  D: '6b7078',   // Feuerzeug, Metall dunkel
  K: '2a2830'    // Feuerzeug, Rille
};

/** Eine Zeichenkette ab Spalte x0 auf die Kantenlaenge auffuellen. */
const zeile = (text, x0 = 0) => '.'.repeat(x0) + text + '.'.repeat(KANTE - x0 - text.length);
const leer = '.'.repeat(KANTE);

/* ------------------------------ Maehne ------------------------------ */

// Das Gesicht ist in allen Stufen dasselbe (y = 11 bis 20), Brille inklusive.
const GESICHT = [
  zeile('SSSSSSSSSSSS', 6),
  zeile('SSSSSSSSSSSS', 6),
  zeile('SGGGGSSGGGGS', 6),
  zeile('SSSSSSSSSSSS', 6),
  zeile('SSSSSSSSSSSS', 6),
  zeile('SSSSMMMMSSSS', 6),
  zeile('SSSSSSSSSSSS', 6),
  zeile('SSSSSSSSSS', 7),
  zeile('SSSSSSSS', 8),
  zeile('SSSSSS', 9)
];
const GESICHT_Y = 11;

// Oberer Teil, jeweils endend in Zeile y = 10. `seite`: Haarbreite links und
// rechts neben dem Gesicht, ab Zeile 11 nach unten.
const STUFEN = [
  { oben: [zeile('SSSSSS', 9), zeile('SSSSSSSSSS', 7)], seite: [] },
  { oben: [zeile('YYYYYYYYYY', 7), zeile('YYYYYYYYYYYY', 6)], seite: [] },
  {
    oben: [zeile('YYYYYY', 9), zeile('YYYYYYYYYY', 7), zeile('YYyYYYYYYyYY', 6), zeile('YYYYYYYYYYYYYY', 5)],
    seite: [1, 1, 1]
  },
  {
    oben: [zeile('YYYYYY', 9), zeile('YYYYYYYYYY', 7), zeile('YYYYyYYYYyYYYY', 5), zeile('YYYYYYYYYYYYYYYY', 4),
      zeile('YYYyYYYYYYYYYYyYYY', 3), zeile('YYYYYYYYYYYYYYYYYY', 3)],
    seite: [3, 3, 3, 3, 3, 2, 2]
  },
  {
    oben: [zeile('YYYYYY', 9), zeile('YYYYYYYYYY', 7), zeile('YYYYyYYYYyYYYY', 5), zeile('YYYYYYYYYYYYYYYY', 4),
      zeile('YYyYYYYYYYYYYYYyYY', 3), zeile('YYYYYYYYYYYYYYYYYYYY', 2), zeile('YYYyYYYYYYYYYYYYyYYY', 2),
      zeile('YYYYYYYYYYYYYYYYYYYY', 2), zeile('YYYYYYYYYYYYYYYYYYYYYY', 1)],
    seite: [5, 5, 5, 5, 5, 4, 4, 4, 4, 3]
  }
];

function maehne(stufe) {
  const raster = Array(KANTE).fill(leer).map(z => [...z]);
  const setze = (x, y, c) => { if (x >= 0 && y >= 0 && x < KANTE && y < KANTE && c !== '.') raster[y][x] = c; };
  const { oben, seite } = STUFEN[stufe];
  oben.forEach((z, i) => [...z].forEach((c, x) => setze(x, GESICHT_Y - oben.length + i, c)));
  GESICHT.forEach((z, i) => [...z].forEach((c, x) => setze(x, GESICHT_Y + i, c)));
  seite.forEach((breite, i) => {
    for (let k = 1; k <= breite; k++) {
      setze(6 - k, GESICHT_Y + i, 'Y');
      setze(17 + k, GESICHT_Y + i, 'Y');
    }
  });
  return raster.map(r => r.join(''));
}

export const MAEHNE_BILDER = STUFEN.length;

/* ----------------------------- Feuerzeug ----------------------------- */

const KOERPER = [
  zeile('LLLLLL', 9),
  zeile('LKKKKL', 9),
  zeile('LLLLLL', 9),
  ...Array(7).fill(zeile('DLDDDD', 9)),
  zeile('DDDDDD', 9)
];
const KOERPER_Y = 12;

const FLAMMEN = [
  [['R', 10], ['RO', 10], ['ROO', 9], ['OFFO', 9], ['OFFFO', 8], ['OFWFFO', 8], ['OFWWFO', 8], ['OFWWFO', 9], ['OFFFO', 9], ['OOO', 10]],
  [['R', 13], ['OR', 12], ['OOR', 12], ['OFOO', 11], ['OFFFO', 11], ['OFWFFO', 10], ['OFWWFO', 10], ['OFWWFO', 9], ['OFFFO', 9], ['OOO', 10]]
];
const FLAMME_Y = 2;

function feuerzeug(bild) {
  const z = Array(KANTE).fill(leer);
  FLAMMEN[bild].forEach(([text, x0], i) => { z[FLAMME_Y + i] = zeile(text, x0); });
  KOERPER.forEach((k, i) => { z[KOERPER_Y + i] = k; });
  return z;
}

export const FEUERZEUG_BILDER = FLAMMEN.length;

/** Alle Bilder des Bogens in der Reihenfolge Maehne, Feuerzeug. */
export function curlsRaster() {
  return [...STUFEN.map((_, i) => maehne(i)), ...FLAMMEN.map((_, i) => feuerzeug(i))];
}
