// Ausfuehren: jsc --module-file=tests/zusammen.test.js
import * as ZU from '../js/zusammen.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleich = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b),
  `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

const ID = 'abcdefgh23';

print('\n--- Kennung ---');
ok('gueltig', ZU.istId(ID));
ok('zu kurz', !ZU.istId('abcdefgh2'));
ok('zu lang', !ZU.istId('abcdefgh234'));
ok('Grossbuchstaben nicht', !ZU.istId('ABCDEFGH23'));
ok('0 und 1 gibt es im Alphabet nicht', !ZU.istId('abcdefgh01'));
ok('Sonderzeichen nicht', !ZU.istId('abcdefg<23'));
ok('null', !ZU.istId(null));
eq('aus festen Bytes', ZU.neueId(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])), 'abcdefghij');
eq('Byte 32 laeuft ueber', ZU.neueId(new Uint8Array(10).fill(32)), 'aaaaaaaaaa');
eq('Byte 255', ZU.neueId(new Uint8Array(10).fill(255)), '7777777777');
ok('zufaellige ist gueltig', ZU.istId(ZU.neueId()));
ok('zwei zufaellige unterscheiden sich', ZU.neueId() !== ZU.neueId());

print('\n--- Pfade ---');
eq('Pfad', ZU.pfad('2026-10-23', ID), `zusammen/2026-10-23-${ID}.json`);
gleich('zurueck', ZU.ausPfad(`zusammen/2026-10-23-${ID}.json`), { datum: '2026-10-23', id: ID });
eq('fremder Ordner', ZU.ausPfad(`soundcheck/2026-10-23-${ID}.json`), null);
eq('Pfad nach oben', ZU.ausPfad(`zusammen/../config.json`), null);
eq('falsche Kennung im Pfad', ZU.ausPfad('zusammen/2026-10-23-ABC.json'), null);
eq('Unterordner', ZU.ausPfad(`zusammen/x/2026-10-23-${ID}.json`), null);
ok('istPfad', ZU.istPfad(`zusammen/2026-10-23-${ID}.json`) && !ZU.istPfad('config.json'));
eq('null', ZU.ausPfad(null), null);

print('\n--- Namen ---');
eq('einfach', ZU.bereinigeName('Max'), 'Max');
eq('Leerraum am Rand', ZU.bereinigeName('  Max  '), 'Max');
eq('mehrfacher Leerraum', ZU.bereinigeName('Max   Mustermann'), 'Max Mustermann');
eq('Zeilenumbruch wird Leerzeichen', ZU.bereinigeName('Max\nMuster'), 'Max Muster');
eq('Steuerzeichen', ZU.bereinigeName('Ma\u0000x'), 'Ma x');
eq('Schreibrichtung umdrehen', ZU.bereinigeName('‮Max'), 'Max');
eq('Null-Breite-Zeichen', ZU.bereinigeName('​Max'), 'Max');
eq('auf 24 gekuerzt', ZU.bereinigeName('x'.repeat(40)), 'x'.repeat(24));
eq('Kuerzen laesst kein Leerzeichen am Ende', ZU.bereinigeName(`${'x'.repeat(23)} yyy`), 'x'.repeat(23));
eq('leer', ZU.bereinigeName('   '), null);
eq('nur unsichtbar', ZU.bereinigeName('​‮'), null);
eq('null', ZU.bereinigeName(null), null);
eq('Zahl wird Text', ZU.bereinigeName(5), '5');
eq('HTML bleibt Text (Maskieren ist Sache der Anzeige)', ZU.bereinigeName('<b>x</b>'), '<b>x</b>');
eq('Umlaute', ZU.bereinigeName('Jürgen'), 'Jürgen');

print('\n--- Eintrag ---');
gleich('gueltig', ZU.eintrag({ id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'einlader' }),
  { id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'einlader', bestaetigt: false });
gleich('bestaetigt', ZU.eintrag({ id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'gast', bestaetigt: true }).bestaetigt, true);
eq('bestaetigt nur bei echtem true', ZU.eintrag({ id: ID, datum: '2026-10-23', mit: 'M', rolle: 'gast', bestaetigt: 'ja' }).bestaetigt, false);
eq('Name ohne Inhalt wird leer, nicht null', ZU.eintrag({ id: ID, datum: '2026-10-23', mit: '  ', rolle: 'gast' }).mit, '');
eq('falsche Kennung', ZU.eintrag({ id: 'x', datum: '2026-10-23', mit: 'M', rolle: 'gast' }), null);
eq('falsches Datum', ZU.eintrag({ id: ID, datum: 'heute', mit: 'M', rolle: 'gast' }), null);
eq('falsche Rolle', ZU.eintrag({ id: ID, datum: '2026-10-23', mit: 'M', rolle: 'boss' }), null);
eq('nichts', ZU.eintrag(), null);
ok('Fremdfelder fliegen raus', !('extra' in ZU.eintrag({ id: ID, datum: '2026-10-23', mit: 'M', rolle: 'gast', extra: 1 })));
eq('ausDatei: null', ZU.ausDatei(null), null);
eq('ausDatei: Text', ZU.ausDatei('x'), null);
eq('ausDatei: gueltig', ZU.ausDatei({ id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'gast', bestaetigt: true }).mit, 'Max');

print('\n--- Gemeinsame Tage ---');
const e = (datum, o = {}) => ({ id: ID, datum, mit: 'Max', rolle: 'einlader', bestaetigt: false, ...o });
const gigs = new Set(['2026-10-05', '2026-10-12', '2026-10-19']);
gleich('nur mit Gig am Tag', ZU.gemeinsameTage([e('2026-10-05'), e('2026-10-06')], gigs),
  [{ datum: '2026-10-05', bestaetigt: false }]);
gleich('aufsteigend', ZU.gemeinsameTage([e('2026-10-19'), e('2026-10-05')], gigs).map(t => t.datum), ['2026-10-05', '2026-10-19']);
eq('zwei Verabredungen am Tag zaehlen einmal',
  ZU.gemeinsameTage([e('2026-10-05'), e('2026-10-05', { mit: 'Anna' })], gigs).length, 1);
eq('bestaetigt, wenn eine bestaetigt ist',
  ZU.gemeinsameTage([e('2026-10-05'), e('2026-10-05', { bestaetigt: true })], gigs)[0].bestaetigt, true);
gleich('ohne Verabredungen', ZU.gemeinsameTage([], gigs), []);
gleich('ohne Gigs', ZU.gemeinsameTage([e('2026-10-05')], new Set()), []);
gleich('Unsinn wird uebersprungen', ZU.gemeinsameTage([null, { datum: 5 }, e('2026-10-05')], gigs).length, 1);

print('\n--- Marken ---');
const tage = ZU.gemeinsameTage([e('2026-10-05'), e('2026-10-12'), e('2026-10-19')], gigs);
gleich('n-ter Tag', ZU.tageMarken(tage, [1, 2, 3, 5]), { 1: '2026-10-05', 2: '2026-10-12', 3: '2026-10-19' });
gleich('keine Tage keine Marken', ZU.tageMarken([], [1]), {});
gleich('Wochen der Tage', ZU.wochen(tage), ['2026-W41', '2026-W42', '2026-W43']);
eq('zwei Tage in einer Woche eine Woche', ZU.wochen([{ datum: '2026-10-05' }, { datum: '2026-10-07' }]).length, 1);

print('\n--- Am Tag, zuletzt mit ---');
eq('am Tag', ZU.amTag([e('2026-10-05'), e('2026-10-06')], '2026-10-06').length, 1);
gleich('zuletzt mit: juengste zuerst', ZU.zuletztMit([e('2026-10-05', { mit: 'Max' }), e('2026-10-12', { mit: 'Anna' })]), ['Anna', 'Max']);
gleich('ohne Doppel, Gross/Klein egal', ZU.zuletztMit([e('2026-10-05', { mit: 'Max' }), e('2026-10-12', { mit: 'max' })]), ['max']);
gleich('leere Namen fehlen', ZU.zuletztMit([e('2026-10-05', { mit: '' })]), []);
eq('hoechstens n', ZU.zuletztMit([e('2026-10-01', { mit: 'a' }), e('2026-10-02', { mit: 'b' }), e('2026-10-03', { mit: 'c' }), e('2026-10-04', { mit: 'd' })]).length, 3);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
