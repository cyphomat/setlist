// Ausfuehren: jsc --module-file=tests/punkte.test.js
import * as PK from '../js/punkte.js';
import * as Q from '../js/quests.js';
import * as T from '../js/talente.js';
import { hash } from '../js/roadie.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const kraft = (date, gewicht = 100) => ({ date, type: 'strength', lifts: [{ lift: 'squat', weight: gewicht, reps: [5, 5, 5], success: true }] });
const tag = n => { const d = new Date(Date.UTC(2026, 10, 1 + n)); return d.toISOString().slice(0, 10); };
const heute = '2026-11-30';

print('\n--- Gluckstage (selten nach einem Training) ---');
const viele = Array.from({ length: 365 }, (_, i) => kraft(tag(i - 300)));
const gl = PK.glueckstage(viele);
ok('es gibt welche, aber selten', gl.length > 5 && gl.length < 80, `(${gl.length} von 365)`);
ok('jeder ist ein Trainingstag', gl.every(d => viele.some(l => l.date === d)));
ok('gleiche Eingabe, gleiche Tage', JSON.stringify(PK.glueckstage(viele)) === JSON.stringify(gl));
ok('ueber den Hash des Datums', gl.every(d => hash(`talent-${d}`) % T.SELTEN === 0));
eq('Mobility ist kein Trainingstag', PK.glueckstage(gl.map(d => ({ date: d, type: 'mobility' }))).length, 0);
eq('ohne Log keiner', PK.glueckstage([]).length, 0);
eq('zwei Einheiten am Tag: ein Punkt', PK.glueckstage([kraft(gl[0]), kraft(gl[0])]).length, 1);

print('\n--- Punkte ---');
const leer = PK.punkte([], new Date(2026, 10, 30));
eq('ohne Log keine Punkte', leer.gesamt, 0);
const nov = Array.from({ length: 5 }, (_, i) => kraft(`2026-11-${String(i + 1).padStart(2, '0')}`));
const p5 = PK.punkte(nov, new Date(2026, 10, 30));
ok('fuenf Tage: die epische Quest gibt einen Punkt', p5.liste.some(x => x.art === 'quest' && x.ref === 'q-nov-fuenf' && x.punkte === 1));
eq('am fuenften Tag', p5.liste.find(x => x.ref === 'q-nov-fuenf').datum, '2026-11-05');
const q2 = PK.punkte(Array.from({ length: 14 }, (_, i) => kraft(`2026-11-${String(i + 1).padStart(2, '0')}`)), new Date(2026, 10, 30));
ok('die legendaere (zwei Wochen) gibt zwei', q2.liste.some(x => x.ref === 'q-nov-pause' && x.punkte === 2));
eq('gesamt ist die Summe der Liste', p5.gesamt, p5.liste.reduce((s, x) => s + x.punkte, 0));
ok('nach Datum sortiert', p5.liste.every((x, i) => !i || p5.liste[i - 1].datum <= x.datum));
ok('der Dezember-Drop zaehlt erst im Dezember', !PK.punkte(Array.from({ length: 12 }, (_, i) => kraft(`2026-12-${String(i + 1).padStart(2, '0')}`)), new Date(2026, 10, 30)).liste.some(x => x.ref === 'q-zwoelf'));
ok('im Dezember schon', PK.punkte(Array.from({ length: 12 }, (_, i) => kraft(`2026-12-${String(i + 1).padStart(2, '0')}`)), new Date(2026, 11, 20)).liste.some(x => x.ref === 'q-zwoelf'));

print('\n--- Advent ---');
const dez = Array.from({ length: 31 }, (_, i) => i + 1).flatMap(n => { const d = `2026-12-${String(n).padStart(2, '0')}`; return [kraft(d), { date: d, type: 'mobility' }, { date: d, type: 'wod' }, { date: d, type: 'unplugged' }, { date: d, type: 'kurs' }, { date: d, type: 'curls' }, { date: d, type: 'maxout' }, { date: d, type: 'moshpit' }]; });
const adv = PK.punkte(dez, new Date(2027, 0, 5)).liste.filter(x => x.art === 'advent');
eq('fuenf Fundstueck-Tuerchen und der ganze Kalender', adv.length, 6);
eq('die Fundstuecke geben je einen', adv.filter(x => x.ref.startsWith('tuer-')).every(x => x.punkte === 1), true);
eq('der ganze Kalender drei', adv.find(x => x.ref.startsWith('komplett')).punkte, 3);
eq('ohne Dezember-Logs kein Advent', PK.punkte(nov, new Date(2026, 10, 30)).liste.filter(x => x.art === 'advent').length, 0);

print('\n--- Verfuegbar ---');
eq('nichts ausgegeben', PK.verfuegbar(5, []), 5);
eq('einer ausgegeben', PK.verfuegbar(5, [{ id: 'a', kosten: 1 }]), 4);
eq('Kosten zaehlen', PK.verfuegbar(5, [{ id: 'a', kosten: 3 }]), 2);
eq('nie unter null', PK.verfuegbar(1, [{ id: 'a', kosten: 3 }]), 0);

print('\n--- Talente wirken auf Quests ---');
const m = '2026-11';
const d = n => `2026-11-${String(n).padStart(2, '0')}`;
const regel = (typ, n, extra = {}) => ({ regel: { typ, n, ...extra } });
const tonnen = (date, kg, type = 'strength') => type === 'strength' ? { date, type, lifts: [{ lift: 'squat', weight: kg, reps: [10], success: true }] } : { date, type, uebungen: [{ lift: 'swing2', kg: 16, reps: 15, erledigt: 3, geschafft: true }] };
eq('Tonnen: Faktor 0,9 senkt das Ziel von 10 auf 9', Q.stand(regel('tonnen', 10), [], m, { tonnenFaktor: 0.9 }).ziel, 9);
eq('Tonnen: ohne Wirkung bleibt es 10', Q.stand(regel('tonnen', 10), [], m).ziel, 10);
eq('Tonnen: nie unter 1', Q.stand(regel('tonnen', 1), [], m, { tonnenFaktor: 0.1 }).ziel, 1);
eq('Tonnen: Faktor macht eine Quest erreichbar', Q.stand(regel('tonnen', 10), [tonnen(d(2), 920)], m, { tonnenFaktor: 0.9 }).erledigt, d(2));
ok('... die ohne ihn offen waere', Q.stand(regel('tonnen', 10), [tonnen(d(2), 920)], m).erledigt === null);
const mosh = tonnen(d(3), 0, 'moshpit');
const ohne = Q.stand(regel('tonnen', 1), [mosh], m).ist, mit = Q.stand(regel('tonnen', 1), [mosh], m, { kugelDoppelt: true }).ist;
ok('Kugel doppelt: die Mosh-Pit-Tonnen zaehlen doppelt', mit === Math.min(1, Math.round(ohne * 2 * 10) / 10) || mit > ohne, `(${ohne} -> ${mit})`);
const rl = regel('lift', 1, { lift: 'squat', kg: 100 });
eq('Lift: 97,5 reicht nicht', Q.stand(rl, [kraft(d(2), 97.5)], m).ist, 0);
eq('Lift: mit 2,5 weniger schon', Q.stand(rl, [kraft(d(2), 97.5)], m, { liftMinus: 2.5 }).erledigt, d(2));
const mob = date => ({ date, type: 'mobility' });
eq('Tage: Mobility zaehlt sonst nicht', Q.stand(regel('tage', 2), [mob(d(2)), mob(d(3))], m).ist, 0);
eq('Tage: mit dem Talent schon', Q.stand(regel('tage', 2), [mob(d(2)), mob(d(3))], m, { mobilitaetZaehlt: true }).erledigt, d(3));
eq('Tage: Mobility als Haken in der Krafteinheit', Q.stand(regel('tage', 1), [{ ...kraft(d(2)), mobility: true }], m, { mobilitaetZaehlt: true }).ist, 1);
const wo = [kraft(d(2)), kraft(d(16)), kraft(d(23))];   // Woche 1, Woche 3, Woche 4: eine Luecke
eq('Wochen: Luecke bricht ohne Talent', Q.stand(regel('wochen', 4), wo, m).ist, 2);
eq('Wochen: Luecke verziehen (3 Wochen mit einer Luecke)', Q.stand(regel('wochen', 3), wo, m, { lueckeWoche: 1 }).erledigt, d(23));
eq('Wochen: zwei Luecken brauchen zwei Verzeihungen', Q.stand(regel('wochen', 3), [kraft(d(2)), kraft(d(23)), kraft(d(30))], m, { lueckeWoche: 1 }).ist, 2);
const mw = [kraft(d(2)), mob(d(10)), mob(d(12)), kraft(d(16))];   // Woche 2 nur mit zwei Mobility-Tagen
eq('Wochen: Mobility-Woche haelt die Folge', Q.stand(regel('wochen', 3), mw, m, { mobilitaetWoche: true }).erledigt, d(16));
eq('Wochen: ohne das Talent bricht sie', Q.stand(regel('wochen', 3), mw, m).ist, 1);
eq('Wochen: ein Mobility-Tag reicht nicht', Q.stand(regel('wochen', 3), [kraft(d(2)), mob(d(10)), kraft(d(16))], m, { mobilitaetWoche: true }).ist, 1);
eq('Vorlauf: der letzte Oktobertag zaehlt mit', Q.stand(regel('tage', 1), [kraft('2026-10-31')], m, { vortag: true }).erledigt, '2026-10-31');
eq('Vorlauf: ohne das Talent nicht', Q.stand(regel('tage', 1), [kraft('2026-10-31')], m).ist, 0);
eq('Vorlauf: nur der eine Tag davor', Q.stand(regel('tage', 1), [kraft('2026-10-30')], m, { vortag: true }).ist, 0);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
