// Pixelbilder fuer die Rueckenpatches an der Kutte: sechs grosse Aufnaeher,
// je 48x48, in der Reihenfolge von BACKPATCHES in js/backpatches.js.
//
// Ein Patch ist Koerper (Form, 2 px Rand als Treppe, Twill-Grund) plus ein
// 16x16-Symbol, das verdoppelt in die Mitte kommt. Bernstein tragen die, die
// zaehlen (Rang, Meister), Stahlblau das Zweitrangige — wie ueberall in Setlist.
//
// Gezeichnet wird hier, nicht von Hand im PNG (siehe CLAUDE.md). tools/pixel.mjs
// bricht ab, wenn die Reihenfolge hier und in js/backpatches.js auseinanderlaeuft.

export const KANTE = 48;

export const BILDER = [
  { id: 'headliner', form: 'kreis', symbol: 'stern', stufe: 'bernstein' },
  { id: 'legende', form: 'schild', symbol: 'krone', stufe: 'bernstein' },
  { id: 'adamant', form: 'sarg', symbol: 'stein', stufe: 'stahl' },
  { id: 'gegnerjaeger', form: 'rund', symbol: 'schwert', stufe: 'stahl' },
  { id: 'dauerbrenner', form: 'kreis', symbol: 'flamme', stufe: 'stahl' },
  { id: 'meister', form: 'schild', symbol: 'amboss', stufe: 'bernstein' }
];

// A Grundfarbe, a Schatten, W Licht, T/t Twill, E Rand, e Randschatten
const STUFEN = {
  bernstein: { A: 'e8a23d', a: 'a8701f', W: 'f6d58a', E: 'e8a23d', e: 'a8701f' },
  stahl: { A: '6f93ad', a: '45627a', W: 'b4cfe0', E: '6f93ad', e: '45627a' }
};
export const GRUND = { T: '16130f', t: '1c1813' };

const SYMBOLE = {
  stern: [
    '.......AA.......', '.......AA.......', '......AAAA......', '......AWAA......', '.....AAWAAA.....',
    'AAAAAAWWAAAAAAAA', '.AAAAAAAAAAAAAA.', '..AAAAAAAAAAAA..', '...AAAAAAAAAA...', '....AAAAAAAA....',
    '....AAAAAAAA....', '...AAAAaaAAAA...', '...AAAA..AAAA...', '..AAAA....AAAA..', '..AAA......AAA..', '..AA........AA..'],
  krone: [
    '................', '................', '.A....A..A....A.', '.AA..AAA.AAA..AA', '.AAA.AAAAAAA.AAA',
    '.AAAAAAAAAAAAAAA', '.AAWAAAAAAAAWAAA', '.AAAAAAAAAAAAAAA', '.AAAAAAAAAAAAAAA', '.aaaaaaaaaaaaaaa',
    '.AAAAAAAAAAAAAAA', '.AAAWAAAAAAAWAAA', '.aaaaaaaaaaaaaaa', '................', '................', '................'],
  stein: [
    '................', '................', '....AAAAAAAA....', '...AWWAAAAAAA...', '..AAWAAAAAAAAA..',
    '.AAAAAAAAAAAAAA.', 'AAAAAAAAAAAAAAAA', 'aAAAAAAAAAAAAAAa', '.aAAAAAAAAAAAAa.', '..aAAAAAAAAAAa..',
    '...aAAAAAAAAa...', '....aAAAAAAa....', '.....aAAAAa.....', '......aAAa......', '.......aa.......', '................'],
  schwert: [
    '.......WW.......', '.......WA.......', '.......WA.......', '.......WA.......', '.......WA.......',
    '.......WA.......', '.......WA.......', '.......WA.......', '.......WA.......', '..aaaaaaaaaaaa..',
    '..aAAAAAAAAAAa..', '.......aa.......', '.......aa.......', '.......aa.......', '......aaaa......', '.......aa.......'],
  flamme: [
    '.......A........', '.......AA.......', '......AAA.......', '......AAAA...A..', '.....AAAAA..AA..',
    '....AAAAAAA.AA..', '....AAAWAAAAAA..', '...AAAAWWAAAAAA.', '...AAAWWWWAAAAA.', '...AAAWWWWWAAAA.',
    '...AAAAWWWWAAAA.', '....AAAAWWAAAA..', '....AAAAAAAAAA..', '.....AAAAAAAA...', '......aaaaaa....', '................'],
  amboss: [
    '................', '................', '..AAAAAAAAAAAA..', '.AAAAAAAAAAAAAAA', 'AAAWWAAAAAAAAAA.',
    '.aAAAAAAAAAAAaa.', '...aAAAAAAAAa...', '.....aAAAAa.....', '.....aAAAAa.....', '.....aAAAAa.....',
    '....aAAAAAAa....', '...aAAAAAAAAa...', '..aaaaaaaaaaaa..', '..aaaaaaaaaaaa..', '................', '................']
};

// Liegt der Punkt (x, y) innerhalb der Form? Mitte bei 23,5.
const IN = {
  kreis: (x, y) => (x - 23.5) ** 2 + (y - 23.5) ** 2 <= 23 ** 2,
  rund: (x, y) => {
    const dx = Math.max(0, Math.abs(x - 23.5) - 17), dy = Math.max(0, Math.abs(y - 23.5) - 17);
    return Math.abs(x - 23.5) <= 23 && Math.abs(y - 23.5) <= 23 && dx * dx + dy * dy <= 6 * 6;
  },
  schild: (x, y) => {
    if (y < 2 || y > 46) return false;
    const halb = y <= 28 ? 21 : 21 * (1 - (y - 28) / 19);
    return Math.abs(x - 23.5) <= halb;
  },
  sarg: (x, y) => {
    if (y < 2 || y > 46) return false;
    const halb = y <= 16 ? 10 + (y - 2) * (11 / 14) : 21 - (y - 16) * (10 / 30);
    return Math.abs(x - 23.5) <= halb;
  }
};

/** Die Kachel als Zeichenraster: 48 Zeilen zu 48 Zeichen, '.' ist durchsichtig. */
export function raster(bild) {
  const form = IN[bild.form], stufe = STUFEN[bild.stufe], sym = SYMBOLE[bild.symbol];
  if (!form || !stufe || !sym) throw new Error(`Rueckenpatch ${bild.id}: Form, Stufe oder Symbol unbekannt`);
  if (sym.length !== 16 || sym.some(z => z.length !== 16)) throw new Error(`Rueckenpatch ${bild.id}: Symbol ${bild.symbol} muss 16x16 sein`);
  const rand = (x, y) => form(x, y) && !(form(x - 2, y) && form(x + 2, y) && form(x, y - 2) && form(x, y + 2) && form(x - 1, y - 1) && form(x + 1, y + 1));
  const kante = (x, y) => form(x, y) && !(form(x - 1, y) && form(x + 1, y) && form(x, y - 1) && form(x, y + 1));
  const zeilen = [];
  for (let y = 0; y < KANTE; y++) {
    let z = '';
    for (let x = 0; x < KANTE; x++) {
      if (!form(x, y)) { z += '.'; continue; }
      if (rand(x, y)) { z += kante(x, y) || (x + y) % 4 === 0 ? 'e' : 'E'; continue; }
      const sx = Math.floor((x - 8) / 2), sy = Math.floor((y - 6) / 2);
      const c = sx >= 0 && sx < 16 && sy >= 0 && sy < 16 ? sym[sy][sx] : '.';
      z += c !== '.' ? c : ((x >> 1) + (y >> 1)) % 2 ? 't' : 'T';
    }
    zeilen.push(z);
  }
  return zeilen;
}

/** Zeichen -> Farbe fuer eine Kachel. */
export const palette = bild => ({ ...GRUND, ...STUFEN[bild.stufe] });
