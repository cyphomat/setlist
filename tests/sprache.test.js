// Ausfuehren: jsc --module-file=tests/sprache.test.js
//
// Ansagen per Sprache im Kurs: was bei Umbau, Pause, Handwechsel und Satz
// gesagt wird, was still bleibt, und dass es ohne Sprachausgabe nichts kaputt macht.
const speicher = new Map();
globalThis.localStorage = {
  getItem: k => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k),
  get length() { return speicher.size; },
  key: i => [...speicher.keys()][i] ?? null
};
const SP = await import('../js/sprache.js');
const KU = await import('../js/kurs.js');
const I = await import('../js/i18n.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const swing = { u: ['swing2'], wdh: 15, art: 'satz' };
const goblet = { u: ['goblet'], wdh: 10, art: 'satz' };
const h = {
  name: b => b.u.map(id => KU.UEBUNGEN[id].name).join(' → '),
  seite: a => I.t(a.seite === 1 ? 'ku.links' : 'ku.rechts'),
  umbau: a => I.t('ku.umbau.rad')
};

print('\n--- Satz ---');
eq('Name und Wiederholungen', SP.sprechtext({ art: 'satz', seite: 0, b: swing }, null, h), 'Swing. 15 Wiederholungen');
eq('mit Seite', SP.sprechtext({ art: 'satz', seite: 1, b: goblet }, null, h), 'Goblet Squat. LINKS. 10 Wiederholungen');

print('\n--- Pause und Handwechsel ---');
eq('Pause nennt die naechste Uebung', SP.sprechtext({ art: 'pause', grund: 'satz', b: swing }, { b: goblet }, h), 'Pause. Als Nächstes: Goblet Squat.');
eq('Pause ohne Folgebaustein', SP.sprechtext({ art: 'pause', grund: 'satz', b: swing }, null, h), 'Pause.');
eq('Handwechsel sagt die Seite', SP.sprechtext({ art: 'pause', grund: 'wechsel', seite: 2, b: swing }, null, h), 'Hand wechseln. Gleich: RECHTS.');

print('\n--- Umbau ---');
const u = SP.sprechtext({ art: 'umbau', arten: ['rad'], b: goblet }, { b: goblet }, h);
ok('beginnt mit Umbau', u.startsWith('Umbau.'));
ok('sagt, was zu tun ist', u.includes(I.t('ku.umbau.rad')));
ok('endet mit dem, was danach kommt', u.endsWith('Danach: Goblet Squat.'));

print('\n--- Takt: nicht jede Runde ---');
ok('erste Runde wird angesagt', SP.sprechtext({ art: 'takt', nr: 1, seite: 0, b: swing }, null, h).startsWith('Swing.'));
eq('weitere Runden bleiben still', SP.sprechtext({ art: 'takt', nr: 2, seite: 0, b: swing }, null, h), '');
eq('ausser bei Seitenwechsel', SP.sprechtext({ art: 'takt', nr: 2, seite: 2, b: swing }, null, h), 'RECHTS.');

print('\n--- Tragen und Rad ---');
ok('Tragen nennt die Sekunden', SP.sprechtext({ art: 'zeit', sekunden: 30, seite: 0, b: swing }, null, h).includes('30'));
ok('Tragen nennt die Hand', SP.sprechtext({ art: 'zeit', sekunden: 20, seite: 1, b: swing }, null, h).endsWith('Kugel in der linken Hand.'));
eq('Rad nennt den Abschnitt', SP.sprechtext({ art: 'rad', phase: 'antritt' }, null, h), 'Antritt.');
eq('ohne Schritt nichts', SP.sprechtext(null, null, h), '');

print('\n--- Englisch ---');
I.setSprache('en');
eq('Pause', SP.sprechtext({ art: 'pause', grund: 'satz', b: swing }, { b: goblet }, h), 'Rest. Next: Goblet Squat.');
eq('Wiederholungen', SP.sprechtext({ art: 'satz', seite: 0, b: swing }, null, h), 'Swing. 15 reps');
I.setSprache('de');

print('\n--- Schalter ---');
eq('standardmaessig aus', SP.istAn(), false);
SP.setzeAn(true);
eq('anschalten', SP.istAn(), true);
SP.setzeAn(false);
eq('ausschalten', SP.istAn(), false);

print('\n--- Sprachausgabe ---');
eq('ohne speechSynthesis: kann nicht', SP.kann({}), false);
let gesprochen = null, abgebrochen = 0;
const fake = {
  speechSynthesis: { cancel: () => { abgebrochen++; }, speak: u => { gesprochen = u; } },
  SpeechSynthesisUtterance: function (text) { this.text = text; }
};
eq('mit speechSynthesis: kann', SP.kann(fake), true);
SP.sprich('Pause.', fake);
eq('spricht den Text', gesprochen && gesprochen.text, 'Pause.');
eq('in der App-Sprache', gesprochen && gesprochen.lang, 'de-DE');
eq('bricht Vorheriges ab', abgebrochen, 1);
gesprochen = null;
SP.sprich('', fake);
eq('leerer Text wird nicht gesprochen', gesprochen, null);
let ohneFehler = true;
try { SP.sprich('Pause.', {}); SP.schweige({}); } catch { ohneFehler = false; }
ok('ohne Sprachausgabe kein Fehler', ohneFehler);
SP.schweige(fake);
eq('schweige bricht ab', abgebrochen, 2);

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
