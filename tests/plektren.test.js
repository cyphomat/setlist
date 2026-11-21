// Ausfuehren: jsc --module-file=tests/plektren.test.js
import * as P from '../js/plektren.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const tag = n => { const d = new Date(Date.UTC(2026, 0, 1 + n)); return d.toISOString().slice(0, 10); };
// Ein Kraft-Tag mit einem Lift
const einheit = (date, lift = 'squat', success = true) => ({ date, type: 'strength', workout: 'A',
  lifts: [{ lift, weight: 100, sets: 5, target: 5, reps: [5], success }] });
const tage = (n, lift, success) => Array.from({ length: n }, (_, i) => einheit(tag(i), lift, success));
const hol = (liste, id) => liste.find(p => p.id === id);

print('\n--- Aussehen ---');
eq('gleiche Kennung, gleiches Aussehen', JSON.stringify(P.aussehen('squat')), JSON.stringify(P.aussehen('squat')));
ok('Farbe und Form aus den Listen', P.FARBEN.includes(P.aussehen('bench').farbe) && P.FORMEN.includes(P.aussehen('bench').form));
const alle = ['squat', 'bench', 'deadlift', 'press', 'row', 'ohp', 'curl', 'dip'].map(i => P.aussehen(i).farbe);
ok('nicht alle gleich', new Set(alle).size > 3);

print('\n--- Verdienen ---');
eq('ohne Log kein Plektrum', P.plektren([]).length, 0);
eq('zwei saubere Tage: noch offen', hol(P.plektren(tage(2), tag(2)), 'squat').verdient, null);
eq('der dritte macht es', hol(P.plektren(tage(3), tag(3)), 'squat').verdient, tag(2));
eq('fehlt: noch einer', hol(P.plektren(tage(2), tag(2)), 'squat').fehlt, 1);
eq('fehlgeschlagene Einheiten zaehlen nicht', hol(P.plektren(tage(5, 'squat', false), tag(5)), 'squat').sauber, 0);
eq('ein Tag zweimal zaehlt einmal', hol(P.plektren([einheit(tag(0)), einheit(tag(0)), einheit(tag(1))], tag(1)), 'squat').sauber, 2);
eq('je Uebung ein Plektrum', P.plektren([einheit(tag(0), 'squat'), einheit(tag(0), 'bench')]).length, 2);
eq('Mobility zaehlt nicht', P.plektren([{ date: tag(0), type: 'mobility' }]).length, 0);
eq('Log ohne type gilt als Kraft', P.plektren([{ date: tag(0), lifts: [{ lift: 'squat', success: true }] }]).length, 1);

print('\n--- Der Gurt ---');
const g = P.gurt([...tage(3, 'squat'), ...tage(2, 'bench')], tag(3));
eq('eins haengt', g.n, 1);
eq('eins ist offen', g.offen.length, 1);
eq('das offene ist die Bankdruecken', g.offen[0].id, 'bench');

print('\n--- Mosh Pit ---');
const mosh = (date, lift, erledigt = 3, geschafft = true) => ({ date, type: 'moshpit', uebungen: [{ lift, kg: 16, reps: 15, erledigt, geschafft }] });
const mp = (n, lift, g) => Array.from({ length: n }, (_, i) => mosh(tag(i), lift, 3, g));
eq('eine Uebung im Mosh Pit gibt eine Kennung mp-<lift>', P.plektren(mp(1, 'swing2'), tag(1))[0].id, 'mp-swing2');
eq('drei saubere Tage: das Plektrum haengt', hol(P.plektren(mp(3, 'goblet'), tag(3)), 'mp-goblet').verdient, tag(2));
eq('nicht geschafft zaehlt nicht als sauber', hol(P.plektren(mp(5, 'goblet', false), tag(5)), 'mp-goblet').sauber, 0);
eq('aber als gespielt', hol(P.plektren(mp(5, 'goblet', false), tag(5)), 'mp-goblet').gespielt, 5);
eq('ohne erledigten Satz gar nicht gespielt', P.plektren([mosh(tag(0), 'press', 0, false)]).length, 0);
eq('press im Mosh Pit ist nicht der Kraft-Lift press', P.plektren([...mp(3, 'press'), einheit(tag(0), 'press')], tag(3)).length, 2);
eq('Kurs und Curls bringen nichts', P.plektren([{ date: tag(0), type: 'kurs' }, { date: tag(1), type: 'curls' }]).length, 0);
eq('Mosh Pit wirkt im Gurt', P.gurt(mp(3, 'swing2'), tag(3)).n, 1);

print('\n--- Leise Eigenschaften ---');
eq('Metall erst ab zehn', hol(P.plektren(tage(9), tag(9)), 'squat').metall, false);
eq('zehn sauber: Metall', hol(P.plektren(tage(10), tag(10)), 'squat').metall, true);
eq('Patina 0 darunter', hol(P.plektren(tage(9), tag(9)), 'squat').patina, 0);
eq('Patina 1 ab zehn Spieltagen', hol(P.plektren(tage(10), tag(10)), 'squat').patina, 1);
eq('Patina 2 ab 25', hol(P.plektren(tage(25), tag(25)), 'squat').patina, 2);
eq('kein Staub frisch', hol(P.plektren(tage(3), tag(10)), 'squat').staub, false);
eq('Staub nach dreissig Tagen', hol(P.plektren(tage(3), tag(2 + 31)), 'squat').staub, true);
eq('genau dreissig Tage: noch kein Staub', hol(P.plektren(tage(3), tag(2 + 30)), 'squat').staub, false);
eq('wieder gespielt: glaenzt', hol(P.plektren([...tage(3), einheit(tag(40))], tag(41)), 'squat').staub, false);
eq('offenes Plektrum staubt nicht', hol(P.plektren(tage(2), tag(100)), 'squat').staub, false);

print('\n--- Neu nach der Einheit ---');
const vor = tage(2), nach = tage(3);
eq('der dritte Tag bringt eins', P.neuePlektren(vor, nach, tag(3)).length, 1);
eq('und nennt es', P.neuePlektren(vor, nach, tag(3))[0].id, 'squat');
eq('der vierte nichts mehr', P.neuePlektren(nach, nach.concat(einheit(tag(3))), tag(4)).length, 0);
eq('Eingaben bleiben unveraendert', vor.length === 2 && nach.length === 3 ? 1 : 0, 1);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
