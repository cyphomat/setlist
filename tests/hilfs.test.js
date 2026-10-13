// Ausfuehren: jsc --module-file=tests/hilfs.test.js
//
// Hilfsuebungen: was ins Log darf, was "letztes Mal" heisst und was die
// Tour daraus zeigt. Sie aendern nichts am Programm — auch das steht hier.
import * as H from '../js/hilfs.js';
import * as P from '../js/program.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const js = o => JSON.stringify(o);

print('\n--- Katalog und Auswahl ---');
eq('sieben Uebungen', H.HILFS.length, 7);
ok('Klimmzug und Chin-up sind Zuguebungen', H.HILFS.filter(h => h.zug).map(h => h.id).join() === 'pullup,chinup');
eq('ohne Einstellung: alle', H.auswahl({}).length, 7);
eq('config.hilfs schraenkt ein', H.auswahl({ hilfs: ['dip', 'pullup'] }).map(h => h.id).join(), 'pullup,dip');
eq('unbekannte Eintraege fallen raus', H.auswahl({ hilfs: ['dip', 'gibtsnicht'] }).map(h => h.id).join(), 'dip');
eq('nur Unbekanntes: wieder alle', H.auswahl({ hilfs: ['gibtsnicht'] }).length, 7);
eq('kein Array: alle', H.auswahl({ hilfs: 'dip' }).length, 7);

print('\n--- Bereinigen fuers Log ---');
eq('leer bleibt leer', js(H.bereinige([])), '[]');
eq('kein Array', js(H.bereinige(null)), '[]');
eq('Uebung ohne Saetze faellt weg', js(H.bereinige([{ id: 'dip', reps: [] }])), '[]');
eq('unbekannte Uebung faellt weg', js(H.bereinige([{ id: 'snatch', reps: [3] }])), '[]');
eq('Nullen, Bruchteile, Unsinn fallen weg', js(H.bereinige([{ id: 'dip', reps: [0, 8, 2.5, -1, 'x', 51, 50, '7'] }])),
  js([{ id: 'dip', reps: [8, 50, 7] }]));
eq('jede Uebung nur einmal', js(H.bereinige([{ id: 'dip', reps: [5] }, { id: 'dip', reps: [9] }])), js([{ id: 'dip', reps: [5] }]));
eq('Reihenfolge bleibt', H.bereinige([{ id: 'pullup', reps: [5] }, { id: 'dip', reps: [9] }]).map(h => h.id).join(), 'pullup,dip');
ok('fremde Felder kommen nicht mit', !('notiz' in H.bereinige([{ id: 'dip', reps: [5], notiz: '<b>x</b>' }])[0]));

print('\n--- Letztes Mal und Bilanz ---');
const logs = [
  { date: '2026-09-01', type: 'strength', lifts: [], hilfs: [{ id: 'pullup', reps: [6, 5, 5] }], finished: '2026-09-01T18:00:00Z' },
  { date: '2026-09-04', type: 'strength', lifts: [] },
  { date: '2026-09-08', type: 'strength', lifts: [], hilfs: [{ id: 'pullup', reps: [8, 7] }, { id: 'dip', reps: [10, 10] }] },
  { date: '2026-09-05', type: 'strength', lifts: [], hilfs: [{ id: 'pullup', reps: [9] }] },
  { date: '2026-09-10', type: 'wod' }
];
eq('letztes Mal: das juengste Datum, nicht die Dateireihenfolge', js(H.letztesMal(logs, 'pullup')), js({ date: '2026-09-08', reps: [8, 7] }));
eq('Dips: einmal', js(H.letztesMal(logs, 'dip')), js({ date: '2026-09-08', reps: [10, 10] }));
eq('nie gemacht: null', H.letztesMal(logs, 'curl'), null);
eq('ohne Logs: null', H.letztesMal(undefined, 'curl'), null);
const b = H.bilanz(logs);
eq('Klimmzug: drei Einheiten', b.pullup.einheiten, 3);
eq('bester Satz 9', b.pullup.bester, 9);
eq('am 05.09.', b.pullup.besterAm, '2026-09-05');
eq('zuletzt 8 · 7', H.repsText(b.pullup.letzte.reps), '8 · 7');
ok('nur Uebungen, die vorkommen', Object.keys(b).sort().join() === 'dip,pullup', Object.keys(b).join());
eq('Einheiten mit Hilfsarbeit', H.einheitenMitHilfs(logs), 3);
eq('leere Hilfsliste zaehlt nicht', H.einheitenMitHilfs([{ date: '2026-09-01', hilfs: [{ id: 'dip', reps: [] }] }]), 0);

print('\n--- Aendert nichts am Programm ---');
{
  const config = {
    bar: 20, rounding: 2.5, firstWorkout: 'A', deload: { afterFails: 3, factor: 0.9 },
    lifts: { squat: { name: 'S', increment: 2.5, start: 50 } },
    workouts: { A: [{ lift: 'squat', sets: 5, reps: 5 }], B: [{ lift: 'squat', sets: 5, reps: 5 }] }
  };
  const log = { date: '2026-09-01', workout: 'A', type: 'strength',
    lifts: [{ lift: 'squat', weight: 50, sets: 5, target: 5, reps: [5, 5, 5, 5, 5], success: true }] };
  const ohne = P.applyLog(P.initialState(config), config, log);
  const mit = P.applyLog(P.initialState(config), config, { ...log, hilfs: [{ id: 'pullup', reps: [10, 10, 10] }] });
  eq('gleiches Gewicht', mit.lifts.squat.weight, ohne.lifts.squat.weight);
  eq('gleicher A/B-Wechsel', mit.next, ohne.next);
}

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
