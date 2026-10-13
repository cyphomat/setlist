// Ausfuehren: jsc --module-file=tests/export.test.js
//
// CSV-Export. Wichtig sind zwei Dinge: dass Tabellenprogramme die Datei
// ohne Nacharbeit lesen, und dass kein Text aus den eigenen Daten dort als
// Formel ausgefuehrt wird.
import * as X from '../js/export.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const config = { lifts: { squat: { name: 'Back Squat' }, ohp: { name: 'Strict Press' } } };
const name = (art, id) => `${art}:${id}`;

print('\n--- Felder ---');
eq('Text bleibt', X.feld('Box'), 'Box');
eq('Zahl bleibt Zahl', X.feld(47.5), '47.5');
eq('leer fuer null', X.feld(null), '');
eq('leer fuer undefined', X.feld(undefined), '');
eq('NaN wird leer', X.feld(NaN), '');
eq('Semikolon wird gequotet', X.feld('a;b'), '"a;b"');
eq('Anfuehrungszeichen verdoppelt', X.feld('Der "Keller"'), '"Der ""Keller"""');
eq('Zeilenumbruch gequotet', X.feld('a\nb'), '"a\nb"');
eq('Formel mit = entschaerft', X.feld('=1+1'), "'=1+1");
eq('Formel mit + entschaerft', X.feld('+49 123'), "'+49 123");
eq('Formel mit - entschaerft', X.feld('-2+3'), "'-2+3");
eq('Formel mit @ entschaerft', X.feld('@SUM(A1)'), "'@SUM(A1)");
eq('Tab am Anfang entschaerft', X.feld('\t=1'), "'\t=1");
eq('HYPERLINK mit Semikolon: entschaerft und gequotet', X.feld('=HYPERLINK("x";"y")'), `"'=HYPERLINK(""x"";""y"")"`);

print('\n--- Zeilen ---');
const logs = [
  { date: '2026-09-04', type: 'wod', label: 'AMRAP 12', dauerSekunden: 720, finished: '2026-09-04T10:00:00Z', ort: 'Box' },
  { date: '2026-09-01', workout: 'A', type: 'strength', finished: '2026-09-01T18:00:00Z', angesagt: 'SOLIDE', gefuehlt: 'hart',
    ort: '=HYPERLINK("http://x")', zugabe: 'burpees',
    lifts: [{ lift: 'squat', weight: 100, sets: 5, target: 5, reps: [5, 5, 5, 5, 5], success: true },
            { lift: 'ohp', weight: 47.5, sets: 3, target: 5, reps: [5, 5, 4], success: false }],
    hilfs: [{ id: 'pullup', reps: [8, 7] }, { id: 'kaputt', reps: [3] }] },
  { date: '2026-09-01', type: 'anpassung', grund: 'schema', schema: { ohp: 1 }, finished: '2026-09-01T09:00:00Z' },
  { date: '2026-09-06', type: 'maxout', lift: 'squat', weight: 130, reps: 3, e1rm: 137.6 },
  { date: '2026-09-07', type: 'maxout', check: 'pullup', weight: 10, reps: 5 },
  { date: '2026-09-08', type: 'unplugged', label: 'Unplugged', dauerSekunden: 900 },
  { date: '2026-09-09', type: 'anpassung', grund: 'pause', gewichte: { squat: 90 } },
  { type: 'strength' }
];
const z = X.zeilen(logs, config, { name });
eq('Zeilenzahl: 1 Anpassung + 2 Lifts + 1 Hilfs + 1 Zugabe + Jam + 2 Max-Out + Unplugged + Anpassung', z.length, 10);
eq('sortiert: Anpassung am Morgen vor der Einheit am Abend', z[0].art, 'anpassung');
eq('Schemawechsel lesbar', z[0].notiz, 'schema: Strict Press Stufe 1');
eq('Lift mit Namen', z[1].uebung, 'Back Squat');
eq('Wiederholungen mit Schraegstrich', z[2].wdh, '5/5/4');
eq('Fehlversuch', z[2].geschafft, 'nein');
eq('Saetze nach Schema', z[2].saetze, 3);
eq('Ansage und Gefuehl', `${z[1].angesagt}/${z[1].gefuehlt}`, 'SOLIDE/hart');
eq('Hilfsuebung mit Namen', z[3].uebung, 'hilfs:pullup');
eq('Hilfsuebung ohne Gewicht', z[3].gewicht, undefined);
eq('unbekannte Hilfsuebung faellt weg', z.filter(x => x.art === 'hilfs').length, 1);
eq('Zugabe', z[4].uebung, 'burpees');
eq('Jam mit Minuten', `${z[5].art} ${z[5].dauer}`, 'jam 12');
eq('Max-Out Lift', `${z[6].uebung} ${z[6].gewicht}x${z[6].wdh}`, 'Back Squat 130x3');
eq('Max-Out mit e1RM', z[6].notiz, 'e1RM 137.6');
eq('Pruefwert-Max-Out mit uebersetztem Namen', z[7].uebung, 'check:pullup');
eq('Unplugged 15 Minuten', z[8].dauer, 15);
eq('Pausen-Anpassung', z[9].notiz, 'pause: Back Squat 90');

print('\n--- Datei ---');
const csv = X.alsCsv(logs, config, { name, kopf: { datum: 'Datum', uebung: 'Übung' } });
ok('beginnt mit BOM', csv.startsWith('﻿'));
const reihen = csv.slice(1).split('\r\n');
ok('Kopfzeile mit eigenen Ueberschriften', reihen[0].startsWith('Datum;art;workout;Übung;'), reihen[0]);
eq('Spaltenzahl in der Kopfzeile', reihen[0].split(';').length, X.SPALTEN.length);
eq('endet mit Zeilenumbruch', reihen[reihen.length - 1], '');
eq('Kopf plus zehn Zeilen', reihen.length - 1, 11);
ok('Ort aus der config kommt entschaerft an', csv.includes(`"'=HYPERLINK(""http://x"")"`), reihen[2]);
ok('kein ungeschuetztes =HYPERLINK', !/(^|;)=HYPERLINK/m.test(csv));
eq('Lift-Zeile', reihen[2].split(';').slice(0, 9).join(';'), '2026-09-01;kraft;A;Back Squat;100;5;5;5/5/5/5/5;ja');
eq('leere Logs: nur Kopf', X.alsCsv([], config).slice(1).split('\r\n').length, 2);
eq('ohne Argumente kein Fehler', X.alsCsv().length > 0, true);

print('\n--- Dateiname ---');
eq('mit Datum', X.dateiname(new Date(2026, 9, 3)), 'setlist-2026-10-03.csv');

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
