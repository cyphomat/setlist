// Ausfuehren: jsc --module-file=tests/advent.test.js
import * as A from '../js/advent.js';
import * as M from '../js/merch.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const d = (jahr, tag) => `${jahr}-12-${String(tag).padStart(2, '0')}`;
const kraft = (date, success = true) => ({ date, type: 'strength', lifts: [{ lift: 'squat', weight: 100, success }] });
const art = (date, type) => ({ date, type });
// Jeden Tag vom ersten bis zum 31.12. alles, was es gibt
const volleWoche = jahr => Array.from({ length: 31 }, (_, i) => i + 1).flatMap(t =>
  [kraft(d(jahr, t)), art(d(jahr, t), 'mobility'), art(d(jahr, t), 'wod'), art(d(jahr, t), 'unplugged'),
    art(d(jahr, t), 'kurs'), art(d(jahr, t), 'curls'), art(d(jahr, t), 'maxout'), art(d(jahr, t), 'moshpit')]);

print('\n--- Die Missionen ---');
eq('vierundzwanzig Tuerchen', A.MISSIONEN.length, 24);
ok('Nummern 1 bis 24, jede einmal', A.MISSIONEN.every((m, i) => m.n === i + 1));
ok('jede Mission hat eine bekannte Art und k >= 1', A.MISSIONEN.every(m => ['typ', 'mobility', 'training', 'verschieden', 'folge', 'sauber', 'wochenende'].includes(m.art) && m.k >= 1));
ok('Fundstuecke sind Tuerchen, die es gibt', A.FUND_TUEREN.every(n => n >= 1 && n <= 24));

print('\n--- Jede Mission ist zu schaffen ---');
for (const jahr of [2026, 2027, 2028, 2029, 2030, 2031, 2032]) {
  const e = A.erledigt(volleWoche(jahr), jahr);
  ok(`${jahr}: mit taeglicher Einheit sind alle 24 zu schaffen`, Object.values(e).every(Boolean),
    Object.entries(e).filter(([, v]) => !v).map(([n]) => n).join(','));
}
eq('ohne Log nichts', Object.values(A.erledigt([], 2026)).filter(Boolean).length, 0);

print('\n--- Fenster ---');
eq('vor dem Tuerchen zaehlt nicht', A.erledigtAm([kraft(d(2026, 1))], 2026, 22), null);
eq('ab seinem Tag schon', A.erledigtAm([kraft(d(2026, 22)), kraft(d(2026, 23)), kraft(d(2026, 24))], 2026, 22), d(2026, 24));
eq('Tuerchen 1: der erste Kraft-Tag', A.erledigtAm([kraft(d(2026, 3))], 2026, 1), d(2026, 3));
eq('nach Silvester nicht', A.erledigtAm([kraft('2027-01-02')], 2026, 1), null);
eq('anderes Jahr zaehlt nicht', A.erledigtAm([kraft(d(2025, 3))], 2026, 1), null);

print('\n--- Arten ---');
eq('Mobility aus eigenem Log', A.erledigtAm([art(d(2026, 5), 'mobility')], 2026, 2), d(2026, 5));
eq('Mobility auch als Haken in der Krafteinheit', A.erledigtAm([{ ...kraft(d(2026, 5)), mobility: true }], 2026, 2), d(2026, 5));
eq('Mobility zaehlt nicht als Training', A.erledigtAm([art(d(2026, 5), 'mobility'), art(d(2026, 6), 'mobility')], 2026, 3), null);
eq('zwei Trainingstage', A.erledigtAm([kraft(d(2026, 5)), art(d(2026, 7), 'wod')], 2026, 3), d(2026, 7));
eq('zwei Einheiten am selben Tag sind ein Tag', A.erledigtAm([kraft(d(2026, 5)), art(d(2026, 5), 'wod')], 2026, 3), null);
eq('Unplugged', A.erledigtAm([art(d(2026, 6), 'unplugged')], 2026, 4), d(2026, 6));
eq('Check-in ist kein Training', A.erledigtAm([art(d(2026, 6), 'checkin'), art(d(2026, 7), 'checkin')], 2026, 3), null);
eq('sauber: ein Fehlversuch macht es nicht sauber', A.erledigtAm([kraft(d(2026, 7), false)], 2026, 6), null);
eq('sauber: alle Saetze klappen', A.erledigtAm([kraft(d(2026, 7), true)], 2026, 6), d(2026, 7));
eq('sauber: ein Lift unsauber reicht, um den Tag auszuschliessen',
  A.erledigtAm([{ date: d(2026, 7), type: 'strength', lifts: [{ lift: 'a', success: true }, { lift: 'b', success: false }] }], 2026, 6), null);
eq('Wochenende: 2026-12-05 ist ein Samstag', A.erledigtAm([kraft(d(2026, 5))], 2026, 10), null);   // Tuerchen 10 beginnt erst am 10.
eq('Wochenende: 13.12.2026 ist ein Sonntag', A.erledigtAm([kraft(d(2026, 13))], 2026, 10), d(2026, 13));
eq('Wochentag zaehlt nicht', A.erledigtAm([kraft(d(2026, 14))], 2026, 10), null);
eq('drei verschiedene Arten', A.erledigtAm([kraft(d(2026, 11)), art(d(2026, 12), 'wod'), art(d(2026, 13), 'unplugged')], 2026, 11), d(2026, 13));
eq('dreimal dieselbe Art ist nicht verschieden', A.erledigtAm([kraft(d(2026, 11)), kraft(d(2026, 12)), kraft(d(2026, 13))], 2026, 11), null);
eq('Mobility zaehlt nicht als Art', A.erledigtAm([kraft(d(2026, 11)), art(d(2026, 12), 'wod'), art(d(2026, 13), 'mobility')], 2026, 11), null);
eq('drei Tage in Folge', A.erledigtAm([kraft(d(2026, 15)), kraft(d(2026, 16)), kraft(d(2026, 17))], 2026, 15), d(2026, 17));
eq('eine Luecke bricht die Folge', A.erledigtAm([kraft(d(2026, 15)), kraft(d(2026, 16)), kraft(d(2026, 18))], 2026, 15), null);
eq('Folge ueber den Monatswechsel gibt es nicht, aber ueber 31.12. hinaus auch nicht', A.erledigtAm([kraft(d(2026, 30)), kraft(d(2026, 31)), kraft('2027-01-01')], 2026, 15), null);

print('\n--- Zeitpunkt ---');
eq('vor dem 1.12. kein Tuerchen', A.tag('2026-11-30'), 0);
eq('am 1.12. das erste', A.tag('2026-12-01'), 1);
eq('am 24. das letzte', A.tag('2026-12-24'), 24);
eq('bis Silvester bleibt es 24', A.tag('2026-12-31'), 24);
eq('im Januar zu', A.tag('2027-01-02'), 0);
eq('Date wird verstanden', A.tag(new Date(2026, 11, 5)), 5);

print('\n--- Reihenfolge ---');
const r = A.reihenfolge(2026);
eq('vierundzwanzig Plaetze', r.length, 24);
eq('jede Nummer einmal', new Set(r).size, 24);
eq('die 24 am Ende', r[23], 24);
eq('im selben Jahr dieselbe', JSON.stringify(A.reihenfolge(2026)), JSON.stringify(r));
ok('im naechsten Jahr eine andere', JSON.stringify(A.reihenfolge(2027)) !== JSON.stringify(r));

print('\n--- Stand ---');
const s0 = A.stand([], '2026-12-05');
eq('fuenf bereit', s0.tueren.filter(x => x.bereit).length, 5);
eq('keiner erledigt', s0.erledigt, 0);
eq('fuenf warten', s0.wartet, 5);
ok('heute ist das fuenfte', s0.tueren[4].heute && s0.tueren.filter(x => x.heute).length === 1);
ok('Fundstuecke sind markiert', s0.tueren.filter(x => x.fund).map(x => x.n).join() === A.FUND_TUEREN.join());
eq('vor dem 1.12. nichts bereit', A.stand([], '2026-11-20').tueren.filter(x => x.bereit).length, 0);
const s1 = A.stand([kraft(d(2026, 1))], '2026-12-05');
eq('eine Krafteinheit erledigt das erste', s1.erledigt >= 1 && s1.tueren[0].erledigt === d(2026, 1), true);
eq('und es wartet eins weniger', s1.wartet, s0.wartet - s1.erledigt);
const sk = A.stand(volleWoche(2026), '2026-12-31');
ok('mit allem: komplett', sk.komplett && sk.erledigt === 24);

print('\n--- Aufnaeher ---');
eq('ohne Log kein Datum', A.komplettAm([], 2026), null);
ok('alles erledigt: Datum ist der Tag des letzten', A.komplettAm(volleWoche(2026), 2026) !== null);
eq('der erste komplette Kalender', A.ersterKomplett(volleWoche(2026)), A.komplettAm(volleWoche(2026), 2026));
eq('nicht komplett: null', A.ersterKomplett([kraft(d(2026, 2))]), null);

print('\n--- Aufnaeher im Merch-Stand ---');
const kat = logs => M.aufnaeher(logs, { lifts: {}, workouts: {} }, [], new Date(2027, 0, 2));
ok('ohne Kalender steht er gar nicht im Katalog', !kat([kraft(d(2026, 2))]).some(a => a.id === 'advent'));
const adv = kat(volleWoche(2026)).find(a => a.id === 'advent');
ok('alles erledigt: er ist da', !!adv);
eq('und traegt den Tag des letzten Tuerchens', adv && adv.verdient, A.komplettAm(volleWoche(2026), 2026));
ok('Bild gibt es im Bogen', M.BILDER.includes('advent'));

print('\n--- Neu nach der Einheit ---');
const vor = [kraft(d(2026, 5))], nach = vor.concat(art(d(2026, 6), 'mobility'));
ok('Mobility bringt Tuerchen 2', A.neuErledigt(vor, nach, 2026).includes(2));
eq('nichts Neues, nichts gemeldet', A.neuErledigt(nach, nach, 2026).length, 0);

print('\n--- Aufgemacht pro Geraet ---');
const speicher = new Map();
globalThis.localStorage = { getItem: k => (speicher.has(k) ? speicher.get(k) : null), setItem: (k, v) => speicher.set(k, String(v)) };
eq('anfangs nichts aufgemacht', A.auf(2026).length, 0);
A.setzeAuf(2026, 5); A.setzeAuf(2026, 5); A.setzeAuf(2026, 9);
eq('zweimal dasselbe zaehlt einmal', A.auf(2026).join(), '5,9');
eq('anderes Jahr bleibt leer', A.auf(2027).length, 0);
speicher.set(A.SCHLUESSEL, 'kaputt');
eq('kaputter Speicher: leer statt Absturz', A.auf(2026).length, 0);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
