// Ausfuehren: jsc --module-file=tests/moshpit.test.js
import * as MP from '../js/moshpit.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleich = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

let zaehler = 0;
const e = (lift, kg, reps, geschafft = true) => ({ lift, kg, reps, sets: 3, erledigt: geschafft ? 3 : 2, geschafft });
const einheit = (lifts, date = '2026-11-01') => ({ date, type: 'moshpit', finished: `${date}T10:${String(zaehler++).padStart(2, '0')}:00.000Z`, uebungen: lifts });
const kurs = (kugeln, i = 1) => ({ date: '2026-10-01', type: 'kurs', kurs: 'kettlebell', finished: `2026-10-01T10:${String(i).padStart(2, '0')}:00.000Z`, kugeln });

print('\n--- Die Leiter ---');
gleich('15 geschafft → 17', MP.weiter({ kg: 12, reps: 15, geschafft: true }), { kg: 12, reps: 17, fails: 0 });
gleich('17 geschafft → 20', MP.weiter({ kg: 12, reps: 17, geschafft: true }), { kg: 12, reps: 20, fails: 0 });
gleich('20 geschafft → 10 mit 16 kg', MP.weiter({ kg: 12, reps: 20, geschafft: true }), { kg: 16, reps: 10, fails: 0 });
gleich('zwischen den Sprossen: 14 → 15', MP.weiter({ kg: 12, reps: 14, geschafft: true }), { kg: 12, reps: 15, fails: 0 });
gleich('erster Fehlversuch: gleiches Ziel', MP.weiter({ kg: 12, reps: 17, geschafft: false, fails: 0 }), { kg: 12, reps: 17, fails: 1 });
gleich('zweiter Fehlversuch: eine Sprosse zurueck', MP.weiter({ kg: 12, reps: 17, geschafft: false, fails: 1 }), { kg: 12, reps: 15, fails: 0 });
gleich('unten angekommen: leichtere Kugel, oben', MP.weiter({ kg: 16, reps: 10, geschafft: false, fails: 1 }), { kg: 12, reps: 20, fails: 0 });
eq('Kugel nie unter dem Minimum', MP.weiter({ kg: 2, reps: 10, geschafft: false, fails: 1 }).kg, MP.MIN_KG);

print('\n--- Ziel aus den Logs ---');
gleich('ohne Log und ohne Kurs: 15, Kugel offen', (({ kg, reps, neu }) => ({ kg, reps, neu }))(MP.ziel([], 'swing2')), { kg: null, reps: 15, neu: true });
eq('Start aus der Kugel im Kurs', MP.ziel([kurs({ swing2: 12 })], 'swing2').kg, 12);
eq('Press: Kugel aus dem Kurs', MP.ziel([kurs({ press: 8 })], 'press').kg, 8);
eq('Press: auch aus dem Komplex', MP.ziel([kurs({ 'clean+press': 10 })], 'press').kg, 10);
{
  const logs = [einheit([e('swing2', 12, 15)])];
  gleich('nach 15 geschafft: 17 mit 12', (({ kg, reps }) => ({ kg, reps }))(MP.ziel(logs, 'swing2')), { kg: 12, reps: 17 });
  const l2 = logs.concat([einheit([e('swing2', 12, 17)]), einheit([e('swing2', 12, 20)])]);
  gleich('nach 20 geschafft: 10 mit 16', (({ kg, reps }) => ({ kg, reps }))(MP.ziel(l2, 'swing2')), { kg: 16, reps: 10 });
  const f = [einheit([e('goblet', 12, 17, false)]), einheit([e('goblet', 12, 17, false)])];
  gleich('zweimal nicht geschafft: zurueck auf 15', (({ kg, reps }) => ({ kg, reps }))(MP.ziel(f, 'goblet')), { kg: 12, reps: 15 });
  const f1 = [einheit([e('goblet', 12, 17, false)])];
  gleich('einmal nicht geschafft: nochmal 17', (({ kg, reps }) => ({ kg, reps }))(MP.ziel(f1, 'goblet')), { kg: 12, reps: 17 });
  const geaendert = [einheit([e('goblet', 12, 17, false)]), einheit([e('goblet', 12, 15, false)])];
  gleich('anderes Ziel: Fehlerzaehler neu', (({ kg, reps }) => ({ kg, reps }))(MP.ziel(geaendert, 'goblet')), { kg: 12, reps: 15 });
  gleich('jeder Lift fuer sich', (({ kg, reps }) => ({ kg, reps }))(MP.ziel(logs, 'goblet')), { kg: null, reps: 15 });
  gleich('fremde Logs zaehlen nicht', (({ reps }) => ({ reps }))(MP.ziel([{ date: '2026-11-01', type: 'wod' }], 'swing2')), { reps: 15 });
}
{
  const n = MP.naechste([]);
  eq('drei Lifts', n.lifts.length, 3);
  ok('drei Saetze, 90 s Pause', n.saetze === 3 && n.pause === 90);
}

print('\n--- Log bereinigen ---');
gleich('gueltig bleibt', MP.bereinigeLifts([{ lift: 'swing2', kg: '12', reps: 15, sets: 3, erledigt: 3 }]), [{ lift: 'swing2', kg: 12, reps: 15, sets: 3, erledigt: 3, geschafft: true }]);
eq('nicht alle Saetze: nicht geschafft', MP.bereinigeLifts([{ lift: 'swing2', kg: 12, reps: 15, sets: 3, erledigt: 2 }])[0].geschafft, false);
eq('fremder Lift faellt heraus', MP.bereinigeLifts([{ lift: 'bench', kg: 12, reps: 15, sets: 3, erledigt: 3 }]).length, 0);
eq('ohne Kugel faellt heraus', MP.bereinigeLifts([{ lift: 'swing2', kg: 0, reps: 15, sets: 3, erledigt: 3 }]).length, 0);
eq('erledigt nie ueber den Saetzen', MP.bereinigeLifts([{ lift: 'swing2', kg: 12, reps: 15, sets: 3, erledigt: 9 }])[0].erledigt, 3);
eq('Unsinn im Array', MP.bereinigeLifts('x').length, 0);
ok('Label nennt alle Lifts', MP.label({ saetze: 3, lifts: [{ lift: 'swing2', reps: 15, kg: 12 }, { lift: 'goblet', reps: 15, kg: 12 }] }).includes('Goblet Squat 3×15 @ 12 kg'));

print('\n--- Statistik ---');
{
  const logs = [einheit([e('swing2', 12, 15), e('goblet', 12, 15)], '2026-11-01'),
    einheit([e('swing2', 12, 17), e('goblet', 12, 17, false)], '2026-11-03'),
    einheit([e('swing2', 12, 20), e('goblet', 12, 17)], '2026-11-05')];
  eq('Verlauf', MP.reihe(logs, 'swing2').length, 3);
  const b = MP.bestwerte(logs).find(x => x.lift === 'swing2');
  ok('Swing: 3 Einheiten, 3 Erfolge, Bestwert 12 kg × 20', b.n === 3 && b.erfolge === 3 && b.best.reps === 20);
  const g = MP.bestwerte(logs).find(x => x.lift === 'goblet');
  ok('Goblet: ein Fehlversuch zaehlt nicht als Bestwert', g.erfolge === 2 && g.best.reps === 17);
  eq('Serie: letzte Einheit klappte in allen Lifts', MP.serie(logs), 1);
  eq('Serie bricht bei Fehlversuch', MP.serie(logs.slice(0, 2)), 0);
  eq('ohne Logs keine Serie', MP.serie([]), 0);
  ok('ohne Logs: n=0', MP.bestwerte([]).every(x => x.n === 0 && x.best === null));
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
