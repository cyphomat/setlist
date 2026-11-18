// Ausfuehren: jsc --module-file=tests/strava.test.js
//
// Text-Export fuer Strava. Geprueft wird, dass jede Zeile aus dem Log stammt
// (nichts erfunden), dass nur gemachte Saetze auftauchen und dass Einheiten
// ohne Gewicht und Wiederholungen bewusst keinen Text bekommen.
import { stravaText, satzZeile } from '../js/strava.js';
import * as KU from '../js/kurs.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

const T = { 'strava.satz': 'Satz {n}', 'strava.wdh': 'Wdh', 'strava.sek': 's', 'strava.kraft': 'Workout {w}',
  'strava.kraftOhne': 'Krafttraining', 'strava.mosh': 'Mosh Pit', 'strava.jam': 'Jam',
  'strava.kurs': 'Kettlebell-Kurs · Woche {woche}{tag}' };
const t = (k, p = {}) => (T[k] || k).replace(/\{(\w+)\}/g, (_, x) => p[x]);
const config = { lifts: { squat: { name: 'Back Squat' }, ohp: { name: 'Strict Press' } } };
const o = { config, t, zahl: v => String(v).replace('.', ','), name: (art, id) => `${art}:${id}` };

print('\n--- Satzzeile ---');
eq('Wdh und Gewicht', satzZeile(2, 5, 'Wdh', 80, o), 'Satz 2: 5 Wdh × 80 kg');
eq('Dezimalkomma', satzZeile(1, 8, 'Wdh', 22.5, o), 'Satz 1: 8 Wdh × 22,5 kg');
eq('ohne Gewicht (Koerper)', satzZeile(1, 10, 'Wdh', 0, o), 'Satz 1: 10 Wdh');
eq('ohne Gewicht (undefined)', satzZeile(1, 10, 'Wdh', undefined, o), 'Satz 1: 10 Wdh');
eq('Sekunden', satzZeile(1, 30, 's', 24, o), 'Satz 1: 30 s × 24 kg');

print('\n--- Kraft A/B ---');
const kraft = { date: '2026-11-18', workout: 'A', lifts: [
  { lift: 'squat', weight: 80, sets: 3, target: 5, reps: [5, 5, 4] },
  { lift: 'ohp', weight: 40, sets: 3, target: 5, reps: [5, 3, 0] }], hilfs: [{ id: 'plank', reps: [30, 30] }] };
const k = stravaText(kraft, o).split('\n');
eq('Kopfzeile', k[0], 'Workout A · 2026-11-18');
eq('Leerzeile danach', k[1], '');
eq('Uebung', k[2], 'Back Squat');
eq('Satz 1', k[3], 'Satz 1: 5 Wdh × 80 kg');
eq('letzter Satz zaehlt echte Wdh', k[5], 'Satz 3: 4 Wdh × 80 kg');
eq('Satz mit 0 Wdh faellt weg', k.filter(z => z.startsWith('Satz') && z.includes('40 kg')).length, 2);
ok('Hilfsuebung ohne kg', k.includes('hilfs:plank') && k.includes('Satz 2: 30 Wdh'));
ok('keine kg bei Hilfsuebung', !k.some(z => z === 'Satz 1: 30 Wdh × 80 kg'));
eq('Log ohne type zaehlt als Kraft', stravaText({ ...kraft, type: 'strength' }, o), stravaText(kraft, o));
eq('Log ohne Workout', stravaText({ ...kraft, workout: undefined }, o).split('\n')[0], 'Krafttraining · 2026-11-18');

print('\n--- Mosh Pit ---');
const mosh = { type: 'moshpit', date: '2026-11-18', uebungen: [{ lift: 'swing', kg: 24, reps: 10, sets: 4, erledigt: 3 }] };
const m = stravaText(mosh, o).split('\n');
eq('nur abgehakte Saetze', m.filter(z => z.startsWith('Satz')).length, 3);
eq('Zeile', m[3], 'Satz 1: 10 Wdh × 24 kg');
eq('erledigt groesser als Saetze wird gedeckelt', stravaText({ ...mosh, uebungen: [{ ...mosh.uebungen[0], erledigt: 9 }] }, o).split('\n').filter(z => z.startsWith('Satz')).length, 4);

print('\n--- Kettlebell-Kurs ---');
let tag = null;
for (const w of [1, 5, 9]) for (const d of ['A', 'B', 'C']) {
  const e = KU.einheit(w, d);
  if (!tag && e && e.bloecke.some(b => !b.warm && b.art === 'saetze' && !b.ohneLast)) tag = { e, w, d };
}
ok('Testtag mit Kugelbaustein gefunden', !!tag);
const blk = tag.e.bloecke.find(b => !b.warm && b.art === 'saetze' && !b.ohneLast);
const kurs = { type: 'kurs', date: '2026-11-18', woche: tag.w, tag: tag.d, kugeln: { [KU.kugelSchluessel(blk)]: 16 } };
const kt = stravaText(kurs, o).split('\n');
eq('Kopfzeile', kt[0], `Kettlebell-Kurs · Woche ${tag.w}${tag.d} · 2026-11-18`);
eq('Satzzahl aus dem Plan', kt.filter(z => z === `Satz 1: ${blk.wdh} Wdh × 16 kg`).length >= 1, true);
eq('Name des Bausteins', kt.includes(KU.blockName(blk)), true);
ok('Aufwaermen und Rad nicht drin', !kt.some(z => /warm|rad/i.test(z)));
const ohne = stravaText({ ...kurs, kugeln: {} }, o);
ok('ohne eingetragene Kugel kein kg', !/ kg/.test(ohne) && ohne.length > 0);
eq('unbekannte Woche gibt nichts', stravaText({ ...kurs, woche: 99 }, o), '');

print('\n--- Jam ---');
const jamLog = { type: 'wod', date: '2026-11-18', wod: { runden: 3, teile: [
  { name: 'Thruster', menge: 10, einheit: 'Wdh', last: 42.5 },
  { name: 'Rudern', menge: 250, einheit: 'm', last: null },
  { name: 'Burpees', menge: null, einheit: 'Wdh', last: null }] } };
const j = stravaText(jamLog, o).split('\n');
eq('drei Runden = drei Saetze', j.filter(z => z === 'Satz 1: 10 Wdh × 42,5 kg' || z === 'Satz 3: 10 Wdh × 42,5 kg').length, 2);
ok('Meter im Namen statt als Wdh', j.includes('Rudern (m)') && j.includes('Satz 2: 250 Wdh'));
ok('Teil ohne Menge (Tabata) faellt weg', !j.includes('Burpees'));
eq('Jam ohne Runden = ein Satz', stravaText({ ...jamLog, wod: { teile: [jamLog.wod.teile[0]] } }, o).split('\n').filter(z => z.startsWith('Satz')).length, 1);

print('\n--- Kein Export ---');
eq('Curls', stravaText({ type: 'curls', date: '2026-11-18', tracks: [{ id: 'solo', saetze: 1, erledigt: 1 }] }, o), '');
eq('Unplugged', stravaText({ type: 'unplugged', date: '2026-11-18' }, o), '');
eq('Max-Out', stravaText({ type: 'maxout', date: '2026-11-18' }, o), '');
eq('null', stravaText(null, o), '');
eq('ohne t', stravaText(kraft, {}), '');
eq('Kraft ohne Saetze', stravaText({ date: '2026-11-18', workout: 'A', lifts: [{ lift: 'squat', weight: 80, sets: 3, reps: [0, 0, 0] }] }, o), '');

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
