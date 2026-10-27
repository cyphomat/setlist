// Ausfuehren: jsc --module-file=tests/kurs.test.js
import * as K from '../js/kurs.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const log = (i, extra = {}) => ({ date: '2026-11-01', type: 'kurs', kurs: 'kettlebell',
  finished: `2026-11-01T10:${String(i).padStart(2, '0')}:00.000Z`, ...extra });
const logs = n => Array.from({ length: n }, (_, i) => log(i));

print('\n--- Zustand ---');
eq('ohne Einheit: Woche 1, Tag A', `${K.zustand([]).woche}${K.zustand([]).tag}`, '1A');
eq('nach drei: Woche 2, Tag A', `${K.zustand(logs(3)).woche}${K.zustand(logs(3)).tag}`, '2A');
eq('nach vier: Tag B', K.zustand(logs(4)).tag, 'B');
eq('nach 35: Woche 12, Tag C', `${K.zustand(logs(35)).woche}${K.zustand(logs(35)).tag}`, '12C');
ok('Woche 12 Tag C ist der Test', K.zustand(logs(35)).test);
ok('nach 36: fertig', K.zustand(logs(36)).fertig && K.naechste(logs(36)) === null);
ok('fremde Logs zaehlen nicht', K.zustand([{ date: '2026-11-01', type: 'wod' }]).absolviert === 0);
eq('Phase 2 ab Woche 5', K.zustand(logs(12)).phase, 'grundlage');
ok('Woche 4 ist Entlastung', K.zustand(logs(9)).entlastung);

print('\n--- Plan ---');
for (let w = 1; w <= K.WOCHEN; w++) for (const t of K.TAGE) {
  const e = K.einheit(w, t);
  ok(`Woche ${w}${t} hat Bausteine mit bekannten Uebungen`,
    e && e.bloecke.length > 0 && e.bloecke.every(b => b.u.every(id => K.UEBUNGEN[id])));
}
ok('Woche 12 C ist Test', K.einheit(12, 'C').test && !K.einheit(12, 'B').test);
ok('unbekannter Tag', K.einheit(1, 'X') === null && K.einheit(13, 'A') === null);
ok('Dauer plausibel (5 bis 45 Min)', [1, 5, 9, 12].every(w => K.TAGE.every(t => { const m = K.minuten(K.einheit(w, t)); return m >= 5 && m <= 45; })));
{
  const a = K.ablauf(K.einheit(1, 'B'));
  ok('Ablauf nicht leer, erste Station kein Pause-Schritt', a.length > 0 && a[0].art !== 'pause');
  ok('nie Pause am Ende', a[a.length - 1].art !== 'pause');
}

print('\n--- Kugelwechsel ---');
eq('zwei leicht: hoch', K.lastVorschlag([log(1, { bewertung: 'leicht' }), log(2, { bewertung: 'leicht' })]), 'hoch');
eq('zwei zaeh: runter', K.lastVorschlag([log(1, { bewertung: 'zaeh' }), log(2, { bewertung: 'zaeh' })]), 'runter');
eq('gemischt: nichts', K.lastVorschlag([log(1, { bewertung: 'leicht' }), log(2, { bewertung: 'passend' })]), null);
eq('eine Einheit: nichts', K.lastVorschlag([log(1, { bewertung: 'leicht' })]), null);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
