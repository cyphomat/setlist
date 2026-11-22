// Ausfuehren: jsc --module-file=tests/drops.test.js
import * as D from '../js/drops.js';
import { DROPS } from '../js/drops-daten.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const tag = (m, n) => `${m}-${String(n).padStart(2, '0')}`;
const einheit = date => ({ date, type: 'strength', lifts: [{ lift: 'squat', weight: 100, success: true }] });
const tage = (m, n) => Array.from({ length: n }, (_, i) => einheit(tag(m, i + 1)));

print('\n--- Die Daten ---');
ok('es gibt Drops', DROPS.length > 0);
eq('Kennungen eindeutig', new Set(DROPS.map(d => d.id)).size, DROPS.length);
for (const d of DROPS) {
  const f = D.pruefeDrop(d);
  ok(`Drop ${d.id} besteht die Pruefung`, f.length === 0, f.join('; '));
  const ids = [...d.plektren, d.zugabe].filter(Boolean).map(p => p.id);
  ok(`Drop ${d.id}: Plektren-Kennungen eindeutig`, new Set(ids).size === ids.length);
}
ok('Reihenfolge nach Datum', DROPS.every((d, i) => !i || DROPS[i - 1].datum < d.datum));

print('\n--- Die Pruefung ---');
const gut = DROPS[0];
const klon = o => JSON.parse(JSON.stringify(o));
const muss = (n, aendere) => { const d = klon(gut); aendere(d); ok(n, D.pruefeDrop(d).length > 0); };
muss('Datum ausserhalb des Monats', d => { d.datum = '2025-01-01'; });
muss('selten ohne Quelle', d => { d.plektren.find(p => p.stufe === 's').quelle = ''; });
muss('selten mit http-Quelle', d => { d.plektren.find(p => p.stufe === 's').quelle = 'http://x.de'; });
muss('episch ohne Fakt', d => { delete d.plektren.find(p => p.stufe === 'e').fakt; });
muss('Zugabe ohne Quelle', d => { d.zugabe.quelle = ''; });
muss('doppelte Kennung', d => { d.plektren[1].id = d.plektren[0].id; });
muss('Text ohne Englisch', d => { d.plektren[0].name = { de: 'x' }; });
muss('Farbe kein Hex', d => { d.plektren[0].farbe = 'rot'; });
muss('ohne Sprueche', d => { d.sprueche = []; });
muss('Zugabe mit falscher Stufe', d => { d.zugabe.stufe = 'e'; });
ok('der gute besteht', D.pruefeDrop(gut).length === 0);

print('\n--- Freischaltung ---');
const m = gut.id;
const st = n => D.dropStand(gut, tage(m, n));
eq('ohne Tage nichts', st(0).n, 0);
eq('drei Tage: die gewoehnlichen', st(3).plektren.filter(p => p.stufe === 'g' && p.verdient).length, gut.plektren.filter(p => p.stufe === 'g').length);
eq('selten ab acht', st(8).plektren.filter(p => p.stufe === 's' && p.verdient).length, gut.plektren.filter(p => p.stufe === 's').length);
eq('sieben: noch nicht', st(7).plektren.filter(p => p.stufe === 's' && p.verdient).length, 0);
eq('episch ab vierzehn', st(14).plektren.filter(p => p.stufe === 'e' && p.verdient).length, 1);
eq('Datum ist der n-te Tag', st(3).plektren[0].verdient, tag(m, 3));
eq('verschiedene Tage: zwei Einheiten am Tag zaehlen einmal', D.dropStand(gut, [einheit(tag(m, 1)), einheit(tag(m, 1))]).tage, 1);
eq('Mobility zaehlt nicht', D.dropStand(gut, [{ date: tag(m, 1), type: 'mobility' }]).tage, 0);
eq('Tage eines anderen Monats zaehlen nicht', D.dropStand(gut, tage('2026-10', 20)).tage, 0);

print('\n--- Die Zugabe ---');
ok('vorher nicht da', !st(14).zugabeDa || st(14).komplett);
eq('erst wenn alle anderen verdient sind', st(13).zugabeDa, false);
eq('dann kommt sie', st(14).zugabeDa, true);
eq('sie zaehlt in n von gesamt nicht vorher mit', st(13).gesamt, gut.plektren.length);
eq('und traegt das Datum des letzten', st(14).plektren.find(p => p.stufe === 'z').verdient, tag(m, 14));

print('\n--- Welcher Drop gilt ---');
eq('vor dem ersten keiner', D.aktuellerDrop('2026-10-31'), null);
eq('am Monatsersten der neue', D.aktuellerDrop('2026-11-01').id, '2026-11');
eq('danach bleibt er', D.aktuellerDrop('2027-03-05').id, DROPS[DROPS.length - 1].id);
eq('Date wird verstanden', D.aktuellerDrop(new Date(2026, 10, 15)).id, '2026-11');

print('\n--- Quests im November ---');
const nov = DROPS.find(x => x.id === '2026-11');
eq('der November hat zwei Quests', nov.quests.length, 2);
ok('jede hat ihr Lohn-Plektrum', nov.quests.every(q => nov.plektren.filter(p => p.quest === q.id).length === 1));
const novTage = Array.from({ length: 5 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, type: 'strength', lifts: [{ lift: 'squat', weight: 100, success: true }] }));
eq('fuenf Tage: die Quest ist erledigt', D.dropStand(nov, novTage).quests.find(q => q.id === 'q-nov-fuenf').erledigt, '2026-11-05');
eq('und ihr Plektrum haengt', !!D.dropStand(nov, novTage).plektren.find(p => p.id === 'q-p-nov-fuenf').verdient, true);

print('\n--- Quests im Drop ---');
const dez2 = DROPS.find(x => x.id === '2026-12');
eq('der Dezember hat zwei Quests', dez2.quests.length, 2);
ok('eine episch, eine legendaer', dez2.quests.map(q => q.stufe).sort().join() === 'e,l');
const qmuss = (n, aendere) => { const d = JSON.parse(JSON.stringify(dez2)); aendere(d); ok(n, D.pruefeDrop(d).length > 0); };
qmuss('Quest mit unbekannter Regel', d => { d.quests[0].regel.typ = 'zufall'; });
qmuss('Quest ohne Lohn', d => { d.plektren = d.plektren.filter(p => p.quest !== d.quests[0].id); });
qmuss('Lohn zeigt auf eine Quest, die es nicht gibt', d => { d.plektren.find(p => p.quest).quest = 'q-gibtsnicht'; });
qmuss('Quest-Stufe falsch', d => { d.quests[0].stufe = 'g'; });
qmuss('Quest ohne Englisch', d => { d.quests[0].name = { de: 'x' }; });
qmuss('Stufe q ohne quest', d => { d.plektren.push({ id: 'x-q', stufe: 'q', farbe: '#112233', name: { de: 'a', en: 'b' }, text: { de: 'a', en: 'b' } }); });
qmuss('doppelte Quest-Kennung', d => { d.quests[1].id = d.quests[0].id; });
const mkraft = date => ({ date, type: 'strength', lifts: [{ lift: 'squat', weight: 100, reps: [5], success: true }] });
const zwoelf = Array.from({ length: 12 }, (_, i) => mkraft(`2026-12-${String(i + 1).padStart(2, '0')}`));
const sq = D.dropStand(dez2, zwoelf);
eq('zwoelf Tage: die Quest ist erledigt', sq.quests.find(q => q.id === 'q-zwoelf').erledigt, '2026-12-12');
eq('und ihr Plektrum haengt', sq.plektren.find(p => p.id === 'q-p-zwoelf').verdient, '2026-12-12');
eq('das der anderen Quest nicht', sq.plektren.find(p => p.id === 'q-p-winter').verdient, null);
ok('ohne Quest haengt das Quest-Plektrum nie, auch nicht ueber Tage', D.dropStand(dez2, zwoelf.slice(0, 3)).plektren.find(p => p.id === 'q-p-zwoelf').verdient === null);
const nurQuest = D.dropStand(dez2, []);
ok('die Zugabe haengt nicht an den Quests', !nurQuest.zugabeDa);
eq('Quests des Tages: am 12.12.', D.questsErledigtAm(zwoelf, '2026-12-12', '2026-12-20').map(q => q.id).join(), 'q-zwoelf');
eq('an einem anderen Tag keine', D.questsErledigtAm(zwoelf, '2026-12-11', '2026-12-20').length, 0);

print('\n--- Quests angesagt (pro Geraet) ---');
const sp = new Map();
globalThis.localStorage = { getItem: k => (sp.has(k) ? sp.get(k) : null), setItem: (k, v) => sp.set(k, String(v)) };
eq('anfangs nicht angesagt', D.questAngesagt('q-zwoelf'), false);
D.setzeQuestAngesagt('q-zwoelf'); D.setzeQuestAngesagt('q-zwoelf');
eq('gemerkt', D.questAngesagt('q-zwoelf'), true);
eq('nur die eine', D.questAngesagt('q-winter'), false);
sp.set(D.ANGESAGT, 'kaputt');
eq('kaputter Speicher: nicht angesagt statt Absturz', D.questAngesagt('q-zwoelf'), false);

print('\n--- Alle Drops bis heute ---');
eq('vor November keiner', D.dropsBis('2026-10-31').length, 0);
eq('im Dezember zwei', D.dropsBis('2026-12-15').length, 2);
eq('im Januar drei, aeltester zuerst', D.dropsBis('2027-01-10').map(x => x.id).join(), '2026-11,2026-12,2027-01');
ok('der Januar-Drop hat keine Tuerchen-Plektren', !DROPS.find(x => x.id === '2027-01').plektren.some(p => p.tuer));

print('\n--- Neu nach der Einheit ---');
eq('der dritte Tag bringt vier', D.neueDropPlektren(tage(m, 2), tage(m, 3), '2026-11-20').length, 4);
eq('der vierte nichts', D.neueDropPlektren(tage(m, 3), tage(m, 4), '2026-11-20').length, 0);

print('\n--- Text ---');
eq('Sprache gewaehlt', D.lokal({ de: 'a', en: 'b' }, 'en'), 'b');
eq('fehlende Sprache: Deutsch', D.lokal({ de: 'a' }, 'en'), 'a');
eq('leer ist leer', D.lokal(null), '');

print('\n--- Dezember: Plektren an Tuerchen ---');
const dez = DROPS.find(x => x.id === '2026-12');
ok('es gibt den Dezember-Drop', !!dez);
const tuerP = dez.plektren.filter(p => p.tuer);
eq('fuenf Plektren haengen an Tuerchen', tuerP.length, 5);
ok('genau die Fundstueck-Tuerchen', tuerP.map(p => p.tuer).sort((a, b) => a - b).join() === [6, 11, 15, 19, 22].join());
const dkraft = date => ({ date, type: 'strength', lifts: [{ lift: 'squat', weight: 100, success: true }] });
ok('ohne Tuerchen keins verdient', D.dropStand(dez, []).plektren.filter(p => p.tuer && p.verdient).length === 0);
const sechs = D.dropStand(dez, [dkraft('2026-12-07'), dkraft('2026-12-08')]);   // Tuerchen 6: sauberer Kraft-Tag ab dem 6.
eq('Tuerchen 6 erledigt: Nikolausstiefel haengt', !!sechs.plektren.find(p => p.id === 't-stiefel').verdient, true);
eq('mit dem Datum des Tuerchens', sechs.plektren.find(p => p.id === 't-stiefel').verdient, '2026-12-07');
eq('die anderen Tuerchen bleiben zu', sechs.plektren.filter(p => p.tuer && p.verdient).length, 1);
muss('tuer ausserhalb des Dezembers', d => { d.id = '2026-11'; d.datum = '2026-11-01'; d.plektren.push({ id: 'x-t', stufe: 'g', tuer: 3, farbe: '#112233', name: { de: 'a', en: 'b' }, text: { de: 'a', en: 'b' } }); });

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
