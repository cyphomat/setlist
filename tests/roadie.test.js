// Ausfuehren: jsc --module-file=tests/roadie.test.js
import * as R from '../js/roadie.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleich = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

const kraft = (date, lifts) => ({ date, type: 'strength', workout: 'A', lifts });
const namen = { squat: 'Kniebeuge', bench: 'Bankdruecken' };

print('\n--- Hash ---');
eq('gleiche Eingabe, gleiche Zahl', R.hash('heute-2026-11-21'), R.hash('heute-2026-11-21'));
ok('verschiedene Tage, verschiedene Zahlen', R.hash('heute-2026-11-21') !== R.hash('heute-2026-11-22'));
ok('ohne Vorzeichen', R.hash('x') >= 0);

print('\n--- Satz auf Home ---');
const a = R.heuteSpruch([], '2026-11-21');
gleich('derselbe Tag, derselbe Satz', a, R.heuteSpruch([], '2026-11-21'));
ok('ohne Log ein Grundsatz', typeof a.schluessel === 'string' && /^(rd\.g|lf\.s\.allg)\./.test(a.schluessel));
const tage = Array.from({ length: 60 }, (_, i) => `2026-12-${String(1 + (i % 28)).padStart(2, '0')}x${i}`);
ok('ueber die Tage kommen mehrere Saetze vor', new Set(tage.map(t => JSON.stringify(R.heuteSpruch([], t)))).size > 3);
const logs = [kraft('2026-11-20', [{ lift: 'squat', weight: 100, success: true }, { lift: 'bench', weight: 60, success: true }])];
ok('mit Log kann der letzte Lift drankommen',
  tage.some(t => { const s = R.heuteSpruch(logs, t, { namen }); return s.schluessel === 'rd.zuletzt'; }));
const zuletzt = tage.map(t => R.heuteSpruch(logs, t, { namen })).find(s => s.schluessel === 'rd.zuletzt');
gleich('und nennt den schwersten Lift', zuletzt && zuletzt.werte, { lift: 'Kniebeuge', kg: 100 });
ok('unbekannter Lift: nichts dazu', !tage.some(t => R.heuteSpruch(logs, t, { namen: {} }).schluessel === 'rd.zuletzt'));
const drop = [{ sprueche: [{ de: 'a', en: 'b' }] }];
ok('Drop-Saetze kommen in den Pool', tage.some(t => R.heuteSpruch([], t, { drops: drop }).roh));

print('\n--- Letzte Einheit ---');
eq('ohne Log keine', R.letzteKraft([]), null);
eq('neueste gewinnt', R.letzteKraft([kraft('2026-11-01', [{ lift: 'a' }]), kraft('2026-11-05', [{ lift: 'b' }])]).date, '2026-11-05');
eq('Mobility zaehlt nicht', R.letzteKraft([{ date: '2026-11-09', type: 'mobility' }]), null);
eq('schwerster Lift ist der Fokus', R.fokusLift(logs[0]).lift, 'squat');
eq('ohne Lifts kein Fokus', R.fokusLift({}), null);

print('\n--- Abschluss ---');
const ende = kraft('2026-11-21', [{ lift: 'squat', weight: 100, success: true }]);
const art = Array.from({ length: 40 }, (_, i) => `t${i}`).map(t => R.abschlussSpruch(ende, t, { namen }));
ok('mal zum Lift, mal allgemein', art.some(s => s.schluessel === 'rd.ok') && art.some(s => s.schluessel !== 'rd.ok'));
const zaeh = kraft('2026-11-21', [{ lift: 'squat', weight: 100, success: false }]);
ok('ohne Erfolg ein ruhiger Satz', Array.from({ length: 40 }, (_, i) => R.abschlussSpruch(zaeh, `t${i}`, { namen })).some(s => s.schluessel === 'rd.zaeh'));
ok('ohne Namen nur allgemeine Saetze', Array.from({ length: 20 }, (_, i) => R.abschlussSpruch(ende, `t${i}`, { namen: {} })).every(s => !/^rd\.(ok|zaeh)$/.test(s.schluessel || '')));

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
