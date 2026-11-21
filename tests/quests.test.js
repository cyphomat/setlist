// Ausfuehren: jsc --module-file=tests/quests.test.js
import * as Q from '../js/quests.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const M = '2026-12';
const d = n => `${M}-${String(n).padStart(2, '0')}`;
const kraft = (date, gewicht = 100, success = true, lift = 'squat') => ({ date, type: 'strength', lifts: [{ lift, weight: gewicht, reps: [5, 5, 5], success }] });
const regel = (typ, n, extra = {}) => ({ regel: { typ, n, ...extra } });

print('\n--- Die Regeln ---');
ok('vier Regeln', Q.REGELN.length === 4);
ok('gute Regel besteht', Q.pruefeRegel({ typ: 'tage', n: 5 }).length === 0);
ok('unbekannter Typ', Q.pruefeRegel({ typ: 'zufall', n: 5 }).length > 0);
ok('n null', Q.pruefeRegel({ typ: 'tage', n: 0 }).length > 0);
ok('n keine ganze Zahl', Q.pruefeRegel({ typ: 'tage', n: 2.5 }).length > 0);
ok('n zu gross', Q.pruefeRegel({ typ: 'tage', n: 5000 }).length > 0);
ok('lift braucht lift und kg', Q.pruefeRegel({ typ: 'lift', n: 1 }).length > 0 && Q.pruefeRegel({ typ: 'lift', n: 1, lift: 'squat', kg: 100 }).length === 0);
ok('keine Regel', Q.pruefeRegel(null).length > 0);

print('\n--- tage ---');
const t3 = [kraft(d(2)), kraft(d(4)), kraft(d(6))];
eq('drei von fuenf', Q.stand(regel('tage', 5), t3, M).ist, 3);
eq('noch nicht erledigt', Q.stand(regel('tage', 5), t3, M).erledigt, null);
eq('erledigt am fuenften Tag', Q.stand(regel('tage', 3), t3, M).erledigt, d(6));
eq('zwei Einheiten am Tag zaehlen einmal', Q.stand(regel('tage', 2), [kraft(d(2)), kraft(d(2))], M).ist, 1);
eq('ist wird bei der Zielzahl gekappt', Q.stand(regel('tage', 2), t3, M).ist, 2);
eq('Mobility ist kein Training', Q.stand(regel('tage', 1), [{ date: d(3), type: 'mobility' }], M).ist, 0);
eq('Tage eines anderen Monats zaehlen nicht', Q.stand(regel('tage', 1), [kraft('2026-11-30'), kraft('2027-01-01')], M).ist, 0);
eq('ohne Log nichts', Q.stand(regel('tage', 3), [], M).ist, 0);

print('\n--- wochen ---');
eq('Montag des 2.12.2026 (ein Mittwoch) ist der 30.11.', Q.montag('2026-12-02'), '2026-11-30');
eq('Montag bleibt Montag', Q.montag('2026-12-07'), '2026-12-07');
eq('Sonntag gehoert zur Woche davor', Q.montag('2026-12-13'), '2026-12-07');
const w = [kraft(d(2)), kraft(d(9)), kraft(d(16)), kraft(d(23))];   // vier Wochen in Folge
eq('vier Wochen in Folge', Q.stand(regel('wochen', 4), w, M).ist, 4);
eq('erledigt am ersten Tag der vierten Woche', Q.stand(regel('wochen', 4), w, M).erledigt, d(23));
eq('mehrere Tage in einer Woche sind eine Woche', Q.stand(regel('wochen', 2), [kraft(d(2)), kraft(d(3)), kraft(d(4))], M).ist, 1);
eq('eine Luecke bricht die Folge', Q.stand(regel('wochen', 4), [kraft(d(2)), kraft(d(9)), kraft(d(23))], M).ist, 2);
eq('die laengste Folge zaehlt', Q.stand(regel('wochen', 4), [kraft(d(2)), kraft(d(16)), kraft(d(23)), kraft(d(30))], M).ist, 3);
eq('Woche ueber den Monatswechsel: nur Tage im Monat zaehlen', Q.stand(regel('wochen', 1), [kraft('2026-11-30')], M).ist, 0);

print('\n--- tonnen ---');
const tonnen = (date, kg) => ({ date, type: 'strength', lifts: [{ lift: 'squat', weight: kg, reps: [10], success: true }] });   // kg x 10
eq('eine Tonne aus 100 kg x 10', Q.stand(regel('tonnen', 5), [tonnen(d(2), 100)], M).ist, 1);
eq('ein Zehntel genau', Q.stand(regel('tonnen', 5), [tonnen(d(2), 125)], M).ist, 1.3);
eq('erledigt an dem Tag, an dem die Summe reicht', Q.stand(regel('tonnen', 3), [tonnen(d(2), 100), tonnen(d(4), 100), tonnen(d(6), 100)], M).erledigt, d(6));
eq('ueber der Zielzahl wird gekappt', Q.stand(regel('tonnen', 1), [tonnen(d(2), 500)], M).ist, 1);
eq('andere Monate zaehlen nicht', Q.stand(regel('tonnen', 1), [tonnen('2026-11-30', 500)], M).ist, 0);

print('\n--- lift ---');
const r = regel('lift', 2, { lift: 'squat', kg: 100 });
eq('zwei Tage mit 100 kg sauber', Q.stand(r, [kraft(d(2), 100), kraft(d(4), 102.5)], M).erledigt, d(4));
eq('zu leicht zaehlt nicht', Q.stand(r, [kraft(d(2), 97.5), kraft(d(4), 100)], M).ist, 1);
eq('nicht sauber zaehlt nicht', Q.stand(r, [kraft(d(2), 100, false), kraft(d(4), 100)], M).ist, 1);
eq('anderer Lift zaehlt nicht', Q.stand(r, [kraft(d(2), 100, true, 'bench')], M).ist, 0);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
