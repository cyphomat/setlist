// Ausfuehren: jsc --module-file=tests/mobkurs.test.js
//
// Mobility-Kurs. Geprueft wird die Auswahl (Gruppen, Verletzungssperre,
// Wiederholbarkeit), der Ablauf (Seiten, Pausen, Dauer) und dass das Log
// fuer Zaehler und Aufnaeher lesbar bleibt wie ein einzelner Mobility-Haken.
import * as MK from '../js/mobkurs.js';
import { MOBILITY } from '../js/content.js';
import * as M from '../js/merch.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

print('\n--- Der Vorrat ---');
ok('jede Mobility-Uebung hat Zeiten und einen Cue',
  MOBILITY.every(u => MK.ZEITEN[u.id] && MK.ZEITEN[u.id].sek > 0 && MK.ZEITEN[u.id].cue.length > 20),
  MOBILITY.filter(u => !MK.ZEITEN[u.id]).map(u => u.id).join(','));
ok('jede Uebung gehoert zu einer bekannten Gruppe',
  MOBILITY.every(u => MK.GRUPPEN.includes(MK.ZEITEN[u.id].gruppe)));
ok('keine Zeiten ohne Uebung', Object.keys(MK.ZEITEN).every(id => MOBILITY.some(u => u.id === id)));
ok('Sekunden liegen zwischen 30 und 90', Object.values(MK.ZEITEN).every(z => z.sek >= 30 && z.sek <= 90));

print('\n--- Die Auswahl ---');
const kurs = MK.baueKurs({ uebungen: MOBILITY, datum: '2026-11-18', seed: 0 });
eq('vier Uebungen', kurs.teile.length, 4);
eq('keine doppelt', new Set(kurs.teile.map(x => x.id)).size, 4);
eq('die ersten drei aus drei verschiedenen Gruppen',
  new Set(kurs.teile.slice(0, 3).map(x => MK.ZEITEN[x.id].gruppe)).size, 3);
eq('gleiche Eingabe, gleicher Kurs',
  MK.baueKurs({ uebungen: MOBILITY, datum: '2026-11-18', seed: 0 }).teile.map(x => x.id).join(),
  kurs.teile.map(x => x.id).join());
const anders = new Set();
for (let s = 0; s < 12; s++) anders.add(MK.baueKurs({ uebungen: MOBILITY, datum: '2026-11-18', seed: s }).teile.map(x => x.id).join());
ok('Wuerfeln gibt andere Kurse', anders.size > 3, `(${anders.size})`);
const tage = new Set();
for (let d = 1; d <= 14; d++) tage.add(MK.baueKurs({ uebungen: MOBILITY, datum: `2026-11-${String(d).padStart(2, '0')}`, seed: 0 }).teile.map(x => x.id).join());
ok('die Tage wechseln', tage.size > 4, `(${tage.size})`);

print('\n--- Sperre und Randfaelle ---');
const ohneHuefte = MOBILITY.filter(u => MK.ZEITEN[u.id].gruppe !== 'huefte');
const k2 = MK.baueKurs({ uebungen: ohneHuefte, datum: '2026-11-18' });
eq('ohne Huefte trotzdem vier', k2.teile.length, 4);
ok('und keine Huefte darin', k2.teile.every(x => MK.ZEITEN[x.id].gruppe !== 'huefte'));
eq('nur zwei erlaubt: zwei im Kurs', MK.baueKurs({ uebungen: MOBILITY.slice(0, 2), datum: 'x' }).teile.length, 2);
eq('nichts erlaubt: leerer Kurs', MK.baueKurs({ uebungen: [], datum: 'x' }).teile.length, 0);
eq('leerer Kurs ohne Schritte', MK.ablauf(MK.baueKurs({ uebungen: [], datum: 'x' })).length, 0);
const fremd = MK.baueKurs({ uebungen: [{ id: 'eigene', name: 'Eigene Übung', dosis: '1 Min' }], datum: 'x' });
eq('unbekannte Uebung bekommt Standardzeit', fremd.teile[0].sek, 45);
eq('und laeuft nicht je Seite', fremd.teile[0].seiten, false);

print('\n--- Der Ablauf ---');
const probe = { teile: [
  { id: 'a', name: 'A', sek: 60, seiten: true, sekunden: 120 },
  { id: 'b', name: 'B', sek: 45, seiten: false, sekunden: 45 }] };
const a = MK.ablauf(probe);
eq('A links, A rechts, B: je Pause + Arbeit', a.length, 6);
eq('beginnt mit einer Pause', a[0].art, 'pause');
eq('erste Pause zehn Sekunden', a[0].sekunden, MK.PAUSE);
eq('Pause nennt die naechste Uebung', a[0].naechster.teil.id, 'a');
eq('links zuerst', a[1].seite, 1);
eq('Seitenwechsel kurz', a[2].sekunden, MK.WECHSEL);
eq('Pause vor rechts nennt dieselbe Uebung', a[2].naechster.teil.id, 'a');
eq('dann rechts', a[3].seite, 2);
eq('zwischen den Uebungen wieder zehn Sekunden', a[4].sekunden, MK.PAUSE);
eq('Uebung ohne Seiten hat Seite 0', a[5].seite, 0);
eq('Arbeit dauert die Uebungszeit', a[5].sekunden, 45);
eq('Zaehlung stimmt', a[5].nr + '/' + a[5].gesamt, '2/2');
eq('letzter Schritt ist Arbeit, keine Pause danach', a[a.length - 1].art, 'arbeit');
ok('Gesamtzeit passt zur Summe', kurs.gesamtSekunden === MK.ablauf(kurs).reduce((s, x) => s + x.sekunden, 0));
ok('der Kurs bleibt kurz (4 bis 12 Minuten)', kurs.minuten >= 4 && kurs.minuten <= 12, `(${kurs.minuten})`);
let lang = 0;
for (let s = 0; s < 60; s++) lang = Math.max(lang, MK.baueKurs({ uebungen: MOBILITY, datum: '2026-11-18', seed: s }).minuten);
ok('auch der laengste Kurs bleibt unter 13 Minuten', lang <= 12, `(${lang})`);

print('\n--- Das Log ---');
const log = MK.alsLog(kurs, { jetzt: new Date('2026-11-18T07:30:00Z'), ymd: '2026-11-18', ort: 'Wohnzimmer' });
eq('Typ bleibt mobility', log.type, 'mobility');
eq('uebung ist die erste Uebung', log.uebung, kurs.teile[0].id);
eq('uebungen sind alle', log.uebungen.join(), kurs.teile.map(x => x.id).join());
eq('Dauer', log.dauerSekunden, kurs.gesamtSekunden);
eq('Ort', log.ort, 'Wohnzimmer');
eq('ohne Ort kein Feld', 'ort' in MK.alsLog(kurs, { ymd: '2026-11-18' }), false);
ok('Label nennt Namen', log.label.includes(kurs.teile[0].name));
ok('zaehlt als Mobility-Tag', M.mobilityTage([log]).includes('2026-11-18'));

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
