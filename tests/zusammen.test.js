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

print('\n--- Pause zu zweit ---');
eq('Partner heute', ZU.partnerHeute([e('2026-10-05', { mit: 'Max' })], '2026-10-05'), 'Max');
eq('anderer Tag: niemand', ZU.partnerHeute([e('2026-10-05', { mit: 'Max' })], '2026-10-06'), null);
eq('ohne Namen uebersprungen', ZU.partnerHeute([e('2026-10-05', { mit: '' }), e('2026-10-05', { mit: 'Anna' })], '2026-10-05'), 'Anna');
eq('leer: niemand', ZU.partnerHeute([], '2026-10-05'), null);
eq('kurz: passt', ZU.kurz('Max'), 'Max');
eq('kurz: genau zehn', ZU.kurz('abcdefghij'), 'abcdefghij');
eq('kurz: elf wird gekuerzt', ZU.kurz('abcdefghijk'), 'abcdefghi…');
eq('kurz: zerreisst keine Zeichen', ZU.kurz('😀'.repeat(12), 4), '😀😀😀…');
eq('kurz: nichts', ZU.kurz(null), '');

print('\n--- Link bauen und lesen ---');
const BASIS = 'https://cyphomat.github.io/setlist/';
eq('Schritt 1', ZU.einladungsLink(BASIS, { id: ID, schritt: 1, von: 'Max' }), `${BASIS}#zusammen=${ID}&schritt=1&von=Max`);
eq('Schritt 2', ZU.einladungsLink(BASIS, { id: ID, schritt: 2, von: 'Max' }), `${BASIS}#zusammen=${ID}&schritt=2&von=Max`);
eq('ohne Namen kein von', ZU.einladungsLink(BASIS, { id: ID, schritt: 1 }), `${BASIS}#zusammen=${ID}&schritt=1`);
eq('Name wird kodiert', ZU.einladungsLink(BASIS, { id: ID, schritt: 1, von: 'Max & Co' }), `${BASIS}#zusammen=${ID}&schritt=1&von=Max%20%26%20Co`);
eq('altes Fragment faellt weg', ZU.einladungsLink(`${BASIS}#alt`, { id: ID, schritt: 1 }), `${BASIS}#zusammen=${ID}&schritt=1`);
eq('falsche Kennung', ZU.einladungsLink(BASIS, { id: 'x', schritt: 1 }), null);
eq('falscher Schritt', ZU.einladungsLink(BASIS, { id: ID, schritt: 3 }), null);
eq('nichts', ZU.einladungsLink(BASIS), null);
const lies = ZU.lies;
gleich('voller Link', lies(`${BASIS}#zusammen=${ID}&schritt=1&von=Max`), { id: ID, schritt: 1, von: 'Max' });
gleich('nur das Fragment', lies(`#zusammen=${ID}&schritt=2&von=Anna`), { id: ID, schritt: 2, von: 'Anna' });
gleich('nur die Parameter', lies(`zusammen=${ID}&schritt=1&von=Max`), { id: ID, schritt: 1, von: 'Max' });
gleich('Name mit Leerzeichen', lies(`#zusammen=${ID}&schritt=1&von=Max%20Muster`).von, 'Max Muster');
gleich('Umlaut', lies(`#zusammen=${ID}&schritt=1&von=J%C3%BCrgen`).von, 'Jürgen');
gleich('Reihenfolge egal', lies(`#schritt=1&von=Max&zusammen=${ID}`), { id: ID, schritt: 1, von: 'Max' });
gleich('mit Text drumherum', lies(`Komm mit! ${BASIS}#zusammen=${ID}&schritt=1&von=Max bis gleich`), { id: ID, schritt: 1, von: 'Max' });
gleich('ohne Namen', lies(`#zusammen=${ID}&schritt=1`), { id: ID, schritt: 1, von: null });
eq('kaputte Kodierung: kein Name, kein Absturz', lies(`#zusammen=${ID}&schritt=1&von=%E0%A4%A`).von, null);
eq('Steuerzeichen im Namen raus', lies(`#zusammen=${ID}&schritt=1&von=Ma%00x`).von, 'Ma x');
eq('Schreibrichtung im Namen raus', lies(`#zusammen=${ID}&schritt=1&von=%E2%80%AEMax`).von, 'Max');
eq('HTML bleibt Text', lies(`#zusammen=${ID}&schritt=1&von=%3Cb%3Ex`).von, '<b>x');
eq('Name wird gekuerzt', lies(`#zusammen=${ID}&schritt=1&von=${'x'.repeat(100)}`).von.length, 24);
eq('falsche Kennung', lies('#zusammen=abc&schritt=1&von=Max'), null);
eq('Grossbuchstaben in der Kennung', lies('#zusammen=ABCDEFGH23&schritt=1'), null);
eq('Kennung zu lang', lies(`#zusammen=${ID}x&schritt=1`), null);
eq('ohne Schritt', lies(`#zusammen=${ID}`), null);
eq('Schritt 3', lies(`#zusammen=${ID}&schritt=3`), null);
eq('Schritt 12', lies(`#zusammen=${ID}&schritt=12`), null);
eq('ohne Kennung', lies('#schritt=1&von=Max'), null);
eq('zu lang', lies(`#zusammen=${ID}&schritt=1&von=${'x'.repeat(600)}`), null);
eq('leer', lies(''), null);
eq('null', lies(null), null);
eq('fremder Parameter: zusammen als Teil eines anderen Namens', lies(`#mitzusammen=${ID}&schritt=1`), null);
eq('javascript-Adresse liefert keine Einladung', lies('javascript:alert(1)'), null);
const rund = ZU.lies(ZU.einladungsLink(BASIS, { id: ID, schritt: 2, von: 'Max & Co <b>' }));
gleich('Hin und zurueck', rund, { id: ID, schritt: 2, von: 'Max & Co <b>' });

print('\n--- Handschlag: Schritt 1, die Einladung annehmen ---');
const ein1 = { id: ID, schritt: 1, von: 'Max' };
eq('neue Einladung', ZU.pruefe(ein1, []).art, 'neu');
gleich('wird zur Seite des Gastes, noch nicht bestaetigt', ZU.uebernehme(ein1, [], '2026-10-23'),
  { id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'gast', bestaetigt: false });
eq('Name der Einladung ohne Namen: leer', ZU.uebernehme({ ...ein1, von: null }, [], '2026-10-23').mit, '');
eq('die eigene Einladung nicht', ZU.pruefe(ein1, [e('2026-10-23', { id: ID })]).art, 'eigene');
eq('und es wird nichts geschrieben', ZU.uebernehme(ein1, [e('2026-10-23', { id: ID })], '2026-10-23'), null);
eq('zweimal annehmen: schon', ZU.pruefe(ein1, [e('2026-10-23', { id: ID, rolle: 'gast' })]).art, 'schon');
eq('auch vor der Antwort: schon', ZU.pruefe(ein1, [e('2026-10-23', { id: ID, rolle: 'gast', bestaetigt: false })]).art, 'schon');
eq('zweimal: nichts neu geschrieben', ZU.uebernehme(ein1, [e('2026-10-23', { id: ID, rolle: 'gast', bestaetigt: true })], '2026-10-23'), null);
eq('andere Kennung bleibt neu', ZU.pruefe(ein1, [e('2026-10-23', { id: 'zyxwvuts77' })]).art, 'neu');
eq('ungueltig', ZU.pruefe(null, []).art, 'ungueltig');
eq('ungueltiges Datum: nichts', ZU.uebernehme(ein1, [], 'heute'), null);

print('\n--- Handschlag: Schritt 2, die Antwort ---');
const ein2 = { id: ID, schritt: 2, von: 'Max' };
const meine = e('2026-10-23', { id: ID, mit: 'Max', rolle: 'einlader' });
eq('Antwort auf eigene Einladung', ZU.pruefe(ein2, [meine]).art, 'neu');
gleich('bestaetigt die eigene Seite', ZU.uebernehme(ein2, [meine], '2026-10-24'),
  { id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'einlader', bestaetigt: true });
eq('Datum der Verabredung bleibt, nicht das von heute', ZU.uebernehme(ein2, [meine], '2026-10-24').datum, '2026-10-23');
eq('fehlender Name kommt aus der Antwort', ZU.uebernehme(ein2, [{ ...meine, mit: '' }], '2026-10-24').mit, 'Max');
eq('eingetragener Name bleibt', ZU.uebernehme({ ...ein2, von: 'Maximilian' }, [meine], '2026-10-24').mit, 'Max');
eq('ohne Einladung: unbekannt', ZU.pruefe(ein2, []).art, 'unbekannt');
eq('und nichts geschrieben', ZU.uebernehme(ein2, [], '2026-10-24'), null);
eq('schon bestaetigt', ZU.pruefe(ein2, [{ ...meine, bestaetigt: true }]).art, 'schon');
eq('zweimal bestaetigen schreibt nichts', ZU.uebernehme(ein2, [{ ...meine, bestaetigt: true }], '2026-10-24'), null);
eq('als Gast eine Antwort: falsch', ZU.pruefe(ein2, [{ ...meine, rolle: 'gast', bestaetigt: true }]).art, 'falsch');
eq('der Einladende bleibt unbestaetigt, bis die Antwort kommt', meine.bestaetigt, false);

print('\n--- Handschlag: Antwort geschickt ---');
const gast = e('2026-10-23', { rolle: 'gast', mit: 'Max' });
gleich('Gast nach dem Teilen bestaetigt', ZU.antwortGesendet(gast), { id: ID, datum: '2026-10-23', mit: 'Max', rolle: 'gast', bestaetigt: true });
eq('schon bestaetigt: nichts', ZU.antwortGesendet({ ...gast, bestaetigt: true }), null);
eq('als Einladender: nichts', ZU.antwortGesendet(e('2026-10-23')), null);
eq('nichts', ZU.antwortGesendet(null), null);
ok('Eingabe bleibt unveraendert', (() => { ZU.antwortGesendet(gast); return gast.bestaetigt === false; })());

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
