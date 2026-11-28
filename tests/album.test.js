// Ausfuehren: jsc --module-file=tests/album.test.js
import * as AL from '../js/album.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const config = { lifts: {}, week: { slots: [{ type: 'strength', day: 1 }, { type: 'strength', day: 3 }] } };
const kraft = (date, success = true) => ({ type: 'strength', date, workout: 'A',
  lifts: [{ lift: 'squat', weight: 100, reps: [5, 5, 5, 5, 5], success }] });
const heute = new Date('2026-12-31T12:00:00');

// Woche 2026-W40 (28.9.-4.10.): zwei saubere Einheiten -> Regler auf elf
// Woche 2026-W41: eine Einheit, Woche 2026-W42: keine (Pause), W43: eine
const logs = [kraft('2026-09-28'), kraft('2026-09-30'), kraft('2026-10-06'), kraft('2026-10-21')];

print('\n--- Titel ---');
const benutzt = new Set();
const t1 = AL.songTitel(2026, 40, benutzt);
eq('derselbe Titel zum selben Jahr und derselben Woche', AL.songTitel(2026, 40, new Set()), t1);
ok('Titel im Album nie doppelt', AL.songTitel(2026, 40, benutzt) !== t1);
ok('Titel hat zwei Teile', /^\S.* \S+/.test(t1));
const alle = new Set();
for (let kw = 1; kw <= 53; kw++) AL.songTitel(2026, kw, alle);
eq('53 Wochen, 53 verschiedene Titel', alle.size, 53);

print('\n--- Dauer und Cover ---');
ok('Dauer im Format m:ss', /^\d+:\d\d$/.test(AL.dauer(2, 3.4, 2026, 40)));
eq('Dauer ist stabil', AL.dauer(2, 3.4, 2026, 40), AL.dauer(2, 3.4, 2026, 40));
ok('mehr Einheiten, laengerer Track', parseInt(AL.dauer(3, 3.4, 2026, 40), 10) > parseInt(AL.dauer(1, 3.4, 2026, 40), 10));
eq('Cover ist stabil', AL.coverSvg(42), AL.coverSvg(42));
ok('Cover haengt vom Seed ab', AL.coverSvg(42) !== AL.coverSvg(43));
ok('Cover ist ein SVG ohne Text', AL.coverSvg(42).startsWith('<svg') && !AL.coverSvg(42).includes('<text'));

print('\n--- Album ---');
const a = AL.album(logs, config, 2026, { heute });
ok('Album da', !!a);
eq('Wochen ohne Einheit fehlen', a.tracks.length, 3);
eq('Tracks sind nummeriert', a.tracks.map(t => t.nr).join(','), '1,2,3');
eq('Kalenderwochen', a.tracks.map(t => t.kw).join(','), '40,41,43');
eq('erste Woche: zwei Einheiten', a.tracks[0].einheiten, 2);
eq('Tonnen der ersten Woche', a.tracks[0].tonnen, 5);
eq('Elf = Encore', a.tracks[0].encore, true);
eq('eine von zwei Einheiten ist kein Encore', a.tracks[1].encore, false);
eq('Liner: Wochen', a.liner.wochen, 3);
eq('Liner: Einheiten', a.liner.einheiten, 4);
eq('Liner: Encores', a.liner.encores, 1);
eq('Liner: Tonnen', a.liner.tonnen, 10);
eq('Anfang des Albums', a.von, '2026-09-28');
eq('am 31.12. ist es fertig', a.status, 'fertig');
eq('vorher ist es eine Vorschau', AL.album(logs, config, 2026, { heute: new Date('2026-11-01T12:00:00') }).status, 'vorschau');
eq('ein altes Jahr ist fertig', AL.album(logs, config, 2026, { heute: new Date('2027-01-05T12:00:00') }).status, 'fertig');

print('\n--- Soundcheck und Fehlversuch ---');
const mitSc = AL.album(logs, config, 2026, { heute, soundchecks: ['2026-W41'] });
eq('Soundcheck in W41', mitSc.tracks.map(t => t.soundcheck).join(','), 'false,true,false');
eq('Liner: Soundchecks', mitSc.liner.soundchecks, 1);
const patzer = AL.album([kraft('2026-09-28'), kraft('2026-09-30', false)], config, 2026, { heute });
eq('ein Fehlversuch nimmt das Encore', patzer.tracks[0].encore, false);

print('\n--- Grenzen ---');
eq('ohne Logs kein Album', AL.album([], config, 2026, { heute }), null);
eq('anderes Jahr ohne Einheiten', AL.album(logs, config, 2025, { heute }), null);
eq('Zukunft zaehlt nicht', AL.album([kraft('2027-03-01')], config, 2027, { heute }), null);
eq('ohne Plan kein Encore, aber ein Track', AL.album(logs, { lifts: {} }, 2026, { heute }).tracks[0].encore, false);
const mitRad = AL.album([], config, 2026, { heute, fahrten: [{ date: '2026-10-07', km: 40, minutes: 90 }] });
eq('eine Fahrt allein ergibt einen Track', mitRad && mitRad.tracks.length, 1);
eq('kaputte Eintraege stoeren nicht', AL.album([null, {}, { date: 'x' }, ...logs], config, 2026, { heute }).tracks.length, 3);
const j = JSON.stringify(logs);
AL.album(logs, config, 2026, { heute });
eq('die Logs bleiben unveraendert', JSON.stringify(logs), j);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
