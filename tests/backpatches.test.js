// Ausfuehren: jsc --module-file=tests/backpatches.test.js
import * as BP from '../js/backpatches.js';
import * as T from '../js/talente.js';
import { ymd } from '../js/program.js';
import * as SC from '../js/soundcheck.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const config = { lifts: {}, week: { slots: [{ type: 'strength', day: 1 }, { type: 'strength', day: 3 }] } };
const kraft = (date, weight = 100, reps = [5, 5, 5, 5, 5]) => ({ type: 'strength', date, workout: 'A', lifts: [{ lift: 'squat', weight, reps, success: true }] });
const heute = new Date('2030-01-15T12:00:00');
const wochen = (anfang, n) => Array.from({ length: n }, (_, i) => { const d = new Date(`${anfang}T12:00:00`); d.setDate(d.getDate() + 7 * i); return ymd(d); });
const finde = (liste, id) => liste.find(p => p.id === id);

print('\n--- Liste ---');
eq('sechs Patches', BP.BACKPATCHES.length, 6);
eq('Kennungen eindeutig', new Set(BP.BACKPATCHES).size, 6);
const leer = BP.rueckenpatches([], config, { heute });
eq('ohne Logs sechs Eintraege', leer.length, 6);
ok('ohne Logs ist nichts verdient', leer.every(p => p.verdient === null));
ok('Reihenfolge wie BACKPATCHES', leer.map(p => p.id).join() === BP.BACKPATCHES.join());
ok('jeder Eintrag hat Stand und Ziel', leer.every(p => p.ziel > 0 && p.ist >= 0 && p.ist <= p.ziel && p.einheit));
eq('ohne Logs hangt keiner hinten', BP.getragen(leer, null), null);

print('\n--- Rang ---');
const jahr = wochen('2025-01-06', 52).map(d => kraft(d));
const mitHeadliner = BP.rueckenpatches(jahr, config, { heute });
eq('52 Wochen: Headliner verdient am 52. Tag', finde(mitHeadliner, 'headliner').verdient, jahr[51].date);
eq('Legende noch nicht', finde(mitHeadliner, 'legende').verdient, null);
eq('Stand Legende: 52 von 208', finde(mitHeadliner, 'legende').ist, 52);
const vorHeadliner = BP.rueckenpatches(jahr.slice(0, 51), config, { heute });
eq('51 Wochen reichen nicht', finde(vorHeadliner, 'headliner').verdient, null);
eq('Stand Headliner: 51', finde(vorHeadliner, 'headliner').ist, 51);
const viel = BP.rueckenpatches(wochen('2025-01-06', 208).map(d => kraft(d)), config, { heute: new Date('2031-06-01T12:00:00') });
ok('208 Wochen: Legende da', !!finde(viel, 'legende').verdient);

print('\n--- Tonnen ---');
const tonne = BP.rueckenpatches([kraft('2029-03-01', 1000, [1000])], config, { heute });
eq('1000 t an einem Tag: Adamant', finde(tonne, 'adamant').verdient, '2029-03-01');
const knapp = BP.rueckenpatches([kraft('2029-03-01', 1000, [999])], config, { heute });
eq('knapp daneben', finde(knapp, 'adamant').verdient, null);
eq('Stand in Tonnen', finde(knapp, 'adamant').ist, 999);

print('\n--- Soundcheck-Serie ---');
const keys = []; let k = SC.wochenKey('2029-12-31');
for (let i = 0; i < 26; i++) { keys.push(k); k = SC.vorige(k); }
const lang = BP.rueckenpatches([], config, { heute, soundchecks: keys });
ok('26 Wochen in Folge: Dauerbrenner', !!finde(lang, 'dauerbrenner').verdient);
eq('Tag ist der Sonntag der 26. Woche', finde(lang, 'dauerbrenner').verdient, SC.sonntagVon(keys[0]));
const luecke = BP.rueckenpatches([], config, { heute, soundchecks: keys.filter((_, i) => i !== 10) });
eq('eine Luecke bricht die Folge', finde(luecke, 'dauerbrenner').verdient, null);

print('\n--- Endgegner ---');
const nov = ['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18', '2026-11-23', '2026-11-25', '2026-11-30'];
const tour = nov.map(d => kraft(d)).concat(['2026-11-03', '2026-11-05', '2026-11-06', '2026-11-10'].map(d => ({ type: 'unplugged', date: d })));
const boss = BP.rueckenpatches(tour, config, { heute: new Date('2026-12-05T12:00:00') });
eq('ein Monat: Stand 1 von 12', finde(boss, 'gegnerjaeger').ist, 1);
eq('Ziel 12', finde(boss, 'gegnerjaeger').ziel, 12);
eq('noch nicht verdient', finde(boss, 'gegnerjaeger').verdient, null);

print('\n--- Meister ---');
const alle = T.BASIS.flatMap(a => a.knoten.map(x => x.id));
const eintraege = ids => ids.map((id, i) => T.eintrag(id, `2029-0${1 + Math.floor(i / 3)}-${String(10 + i).padStart(2, '0')}`));
const halb = T.BASIS[0].knoten.map(x => x.id);
const mHalb = T.meisterschaft(T.besitz(eintraege(halb), T.aeste()));
eq('ein Ast gemeistert', mHalb.filter(m => m.fertig).length, 1);
eq('Titel deutsch', mHalb[0].titel.de, 'Meister der Kraft');
eq('Titel englisch', mHalb[0].titel.en, 'Master of Strength');
ok('der Tag ist der des letzten Knotens', mHalb[0].datum === eintraege(halb)[2].date);
eq('Stand der Patches: 1 von 4', finde(BP.rueckenpatches(eintraege(halb), config, { heute }), 'meister').ist, 1);
const voll = BP.rueckenpatches(eintraege(alle), config, { heute });
ok('alle vier Aeste: Meister-Patch', !!finde(voll, 'meister').verdient);
eq('Stand 4 von 4', finde(voll, 'meister').ist, 4);
const ohneReihe = T.meisterschaft(T.besitz(eintraege(alle).filter(e => e.knoten !== 'kraft-2'), T.aeste()));
eq('fehlt ein Knoten, ist der Ast nicht gemeistert', ohneReihe[0].fertig, false);
const mitDrop = T.aeste([{ datum: '2029-02-01', aeste: [{ id: 'disziplin', knoten: [{ id: 'disziplin-9', kosten: 4, name: { de: 'x', en: 'x' }, text: { de: 'x', en: 'x' }, wirkung: { typ: 'titel' } }] }] }]);
ok('ein neuer Drop-Knoten nimmt keinen Titel weg', T.meisterschaft(T.besitz(eintraege(alle), mitDrop)).every(m => m.fertig));

print('\n--- Getragen ---');
const zwei = [{ id: 'headliner', verdient: '2029-01-01' }, { id: 'adamant', verdient: '2029-06-01' }, { id: 'meister', verdient: null }];
eq('ohne Wahl der zuletzt verdiente', BP.getragen(zwei, null), 'adamant');
eq('die Wahl gilt, wenn verdient', BP.getragen(zwei, 'headliner'), 'headliner');
eq('eine unverdiente Wahl zaehlt nicht', BP.getragen(zwei, 'meister'), 'adamant');
eq('eine fremde Wahl zaehlt nicht', BP.getragen(zwei, 'quatsch'), 'adamant');

print('\n--- Unveraendert ---');
const roh = JSON.stringify(jahr);
BP.rueckenpatches(jahr, config, { heute });
eq('die Logs bleiben unveraendert', JSON.stringify(jahr), roh);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
