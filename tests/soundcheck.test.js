// Ausfuehren: jsc --module-file=tests/soundcheck.test.js
import * as SC from '../js/soundcheck.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const tag = d => new Date(`${d}T12:00:00`);

print('\n--- Kalenderwochen ---');
eq('Donnerstag 1.10.2026', SC.wochenKey('2026-10-01'), '2026-W40');
eq('Montag derselben Woche', SC.wochenKey(tag('2026-09-28')), '2026-W40');
eq('Sonntag derselben Woche', SC.wochenKey('2026-10-04'), '2026-W40');
eq('Neujahr 2027 gehoert zur 53. Woche', SC.wochenKey('2027-01-01'), '2026-W53');
eq('30.12.2024 ist schon 2025', SC.wochenKey('2024-12-30'), '2025-W01');
eq('Montag von W40', SC.montagVon('2026-W40'), '2026-09-28');
eq('Sonntag von W40', SC.sonntagVon('2026-W40'), '2026-10-04');
eq('Montag von 2025-W01', SC.montagVon('2025-W01'), '2024-12-30');
eq('ueber den Jahreswechsel vor', SC.naechste('2026-W53'), '2027-W01');
eq('und zurueck', SC.vorige('2027-W01'), '2026-W53');
eq('kaputter Schluessel', SC.montagVon('2026-40'), null);

print('\n--- Pfade ---');
eq('Pfad', SC.pfad('2026-W40'), 'soundcheck/2026-W40.json');
eq('aus dem Pfad', SC.ausPfad('soundcheck/2026-W40.json'), '2026-W40');
eq('anderer Ordner', SC.ausPfad('einheiten/2026-W40.json'), null);
eq('Unterordner zaehlt nicht', SC.ausPfad('soundcheck/alt/2026-W40.json'), null);
eq('kein Wochenname', SC.ausPfad('soundcheck/notiz.json'), null);

print('\n--- Faellig ---');
const ab = '2026-06-01';
eq('Sonntag: die laufende Woche', SC.faellig(tag('2026-10-04'), [], { ab }), '2026-W40');
eq('Montag: die vergangene', SC.faellig(tag('2026-10-05'), [], { ab }), '2026-W40');
eq('Dienstag: noch immer', SC.faellig(tag('2026-10-06'), [], { ab }), '2026-W40');
eq('Mittwoch: vorbei', SC.faellig(tag('2026-10-07'), [], { ab }), null);
eq('Samstag: noch nicht', SC.faellig(tag('2026-10-03'), [], { ab }), null);
eq('erledigt: nicht mehr', SC.faellig(tag('2026-10-05'), ['2026-W40'], { ab }), null);
eq('vor der ersten Einheit: nichts', SC.faellig(tag('2026-10-05'), [], { ab: '2026-10-05' }), null);
eq('ohne Einheit ueberhaupt: nichts', SC.faellig(tag('2026-10-05'), []), null);
eq('erste Einheit am Sonntag: schon faellig', SC.faellig(tag('2026-10-04'), [], { ab: '2026-10-04' }), '2026-W40');

print('\n--- Serie ---');
const drei = ['2026-W38', '2026-W39', '2026-W40'];
eq('drei in Folge, Mittwoch danach', SC.serie(drei, tag('2026-10-07')), 3);
eq('Sonntag, laufende Woche noch offen', SC.serie(['2026-W38', '2026-W39'], tag('2026-10-04')), 2);
eq('Luecke', SC.serie(['2026-W37', '2026-W39', '2026-W40'], tag('2026-10-05')), 2);
eq('eine Woche ausgelassen: vorbei', SC.serie(drei, tag('2026-10-14')), 0);
eq('Unsinn zaehlt nicht', SC.serie(['quatsch', '2026-W40'], tag('2026-10-05')), 1);
const marken = SC.serienMarken(['2026-W30', '2026-W32', '2026-W33', '2026-W34', '2026-W35', '2026-W36'], [4, 12]);
eq('vier in Folge: am Sonntag der vierten', marken[4], SC.sonntagVon('2026-W35'));
eq('zwoelf noch nicht', marken[12], undefined);
const jahr = SC.serienMarken(['2026-W50', '2026-W51', '2026-W52', '2026-W53', '2027-W01'], [4]);
eq('ueber den Jahreswechsel', jahr[4], SC.sonntagVon('2026-W53'));

print('\n--- Bereinigen ---');
const b = SC.bereinige({ woche: '2026-W40', lief: '  Squat lief  ', hakt: 'a'.repeat(900),
  vorsaetze: ['Früh ins Bett', '', '  Zwei Fahrten\nlocker ', 'vierter'], extra: '<script>' }, new Date('2026-10-05T08:00:00Z'));
eq('Text getrimmt', b.lief, 'Squat lief');
eq('Text gekuerzt', b.hakt.length, SC.TEXT_MAX);
eq('leere Vorsaetze fallen weg, hoechstens drei', b.vorsaetze.join('|'), 'Früh ins Bett|Zwei Fahrten locker|vierter');
ok('fremde Felder fallen weg', !('extra' in b));
eq('Zeitpunkt', b.abgeschlossen, '2026-10-05T08:00:00.000Z');
eq('ohne Woche nichts', SC.bereinige({ lief: 'x' }), null);
eq('kaputte Woche nichts', SC.bereinige({ woche: '../state' }), null);
eq('ohne Angaben: leere Felder', JSON.stringify(SC.bereinige({ woche: '2026-W40' }, new Date(0)).vorsaetze), '[]');

print('\n--- Pegel ---');
eq('leer: unten', SC.pegel(0, []), 0);
eq('ohne Vorwochen: oben', SC.pegel(3, []), 1);
eq('neue Bestmarke: oben', SC.pegel(5, [2, 4, 3]), 1);
eq('die Haelfte', SC.pegel(2, [4, 1]), 0.5);
eq('gerundet', SC.pegel(1, [3]), 0.33);
eq('kaputte Werte zaehlen nicht', SC.pegel(NaN, [-2, 'x', null]), 0);
eq('negative Vorwoche ignoriert', SC.pegel(2, [-9]), 1);
eq('Massstab: acht Wochen', SC.PEGEL_WOCHEN, 8);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
