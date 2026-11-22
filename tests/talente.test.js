// Ausfuehren: jsc --module-file=tests/talente.test.js
import * as T from '../js/talente.js';
import { DROPS } from '../js/drops-daten.js';
import * as P from '../js/program.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const eintrag = (knoten, date = '2026-11-22', finished = '') => ({ date, type: 'talent', knoten, finished });
const liste = T.aeste([]);

print('\n--- Der Baum von Anfang an ---');
eq('vier Aeste', T.BASIS.length, 4);
ok('die Basis besteht die Pruefung', T.pruefeAeste(T.BASIS).length === 0, T.pruefeAeste(T.BASIS).join('; '));
ok('jeder Knoten hat eine bekannte Wirkung', T.BASIS.flatMap(a => a.knoten).every(k => T.WIRKUNGEN.includes(k.wirkung.typ)));
ok('jeder Ast faengt mit einem Titel an', T.BASIS.every(a => a.knoten[0].wirkung.typ === 'titel'));
ok('Kennungen eindeutig', new Set(T.BASIS.flatMap(a => a.knoten.map(k => k.id))).size === T.BASIS.flatMap(a => a.knoten).length);
ok('alle Texte zweisprachig', T.BASIS.flatMap(a => [a.name, ...a.knoten.flatMap(k => [k.name, k.text])]).every(o => o.de && o.en));

print('\n--- Aeste aus den Drops ---');
const alle = T.aeste(DROPS);
ok('mit den Drops kommen Knoten dazu', alle.flatMap(a => a.knoten).length > liste.flatMap(a => a.knoten).length);
ok('ein neuer Ast kann mitkommen', alle.some(a => a.id === 'winter') && !liste.some(a => a.id === 'winter'));
ok('ein bestehender Ast waechst', alle.find(a => a.id === 'disziplin').knoten.length > liste.find(a => a.id === 'disziplin').knoten.length);
eq('der angehaengte Knoten braucht den davor', alle.find(a => a.id === 'disziplin').knoten[3].braucht, 'disziplin-3');
eq('der erste Knoten braucht nichts', alle[0].knoten[0].braucht, null);
ok('alle Drops zusammen sind in sich stimmig', (() => { const v = new Set(T.BASIS.flatMap(a => a.knoten.map(k => k.id))); let f = []; for (const d of DROPS) { f = f.concat(T.pruefeAeste(d.aeste || [], v)); (d.aeste || []).forEach(a => a.knoten.forEach(k => v.add(k.id))); } return f.length === 0; })());
ok('Drop-Wirkungen sind bekannt', DROPS.flatMap(d => (d.aeste || []).flatMap(a => a.knoten)).every(k => T.WIRKUNGEN.includes(k.wirkung.typ)));
const nurNov = T.aeste(DROPS.filter(d => d.datum <= '2026-11-30'));
ok('ein Drop in der Zukunft bringt noch nichts', !nurNov.some(a => a.id === 'winter'));

print('\n--- Die Pruefung ---');
const g = () => ({ id: 'neu-1', name: { de: 'a', en: 'b' }, text: { de: 'a', en: 'b' }, wirkung: { typ: 'titel' } });
ok('guter Knoten besteht', T.pruefeKnoten(g()).length === 0);
ok('Kennung zu kurz', T.pruefeKnoten({ ...g(), id: 'x' }).length > 0);
ok('Kennung mit Grossbuchstaben', T.pruefeKnoten({ ...g(), id: 'Neu-1' }).length > 0);
ok('unbekannte Wirkung', T.pruefeKnoten({ ...g(), wirkung: { typ: 'zaubern' } }).length > 0);
ok('Zahl fehlt bei tonnenFaktor', T.pruefeKnoten({ ...g(), wirkung: { typ: 'tonnenFaktor' } }).length > 0);
ok('Text ohne Englisch', T.pruefeKnoten({ ...g(), text: { de: 'x' } }).length > 0);
ok('Kosten zu hoch', T.pruefeKnoten({ ...g(), kosten: 9 }).length > 0);
ok('Kennung doppelt', T.pruefeAeste([{ id: 'neu', knoten: [g(), g()] }]).length > 0);
ok('Kennung gibt es schon', T.pruefeAeste([{ id: 'neu', knoten: [{ ...g(), id: 'kraft-1' }] }], new Set(['kraft-1'])).length > 0);
ok('braucht einen unbekannten Knoten', T.pruefeAeste([{ id: 'neu', knoten: [{ ...g(), braucht: 'gibtsnicht' }] }]).length > 0);
ok('Ast ohne Knoten', T.pruefeAeste([{ id: 'neu', knoten: [] }]).length > 0);

print('\n--- Freigeschaltet ---');
eq('ohne Eintrag nichts', T.besitz([], liste).length, 0);
eq('ein Eintrag, ein Knoten', T.besitz([eintrag('kraft-1')], liste).length, 1);
eq('mit Datum', T.besitz([eintrag('kraft-1', '2026-11-25')], liste)[0].datum, '2026-11-25');
eq('ohne Voraussetzung zaehlt es nicht', T.besitz([eintrag('kraft-2')], liste).length, 0);
eq('mit Voraussetzung in der richtigen Reihenfolge', T.besitz([eintrag('kraft-1', '2026-11-22'), eintrag('kraft-2', '2026-11-23')], liste).length, 2);
eq('die falsche Reihenfolge (spaeter nachgeholt) zaehlt nicht', T.besitz([eintrag('kraft-2', '2026-11-22'), eintrag('kraft-1', '2026-11-23')], liste).length, 1);
eq('dasselbe zweimal zaehlt einmal', T.besitz([eintrag('kraft-1'), eintrag('kraft-1', '2026-11-23')], liste).length, 1);
eq('ein unbekannter Knoten wird ignoriert', T.besitz([eintrag('gibtsnicht')], liste).length, 0);
eq('ein Eintrag ohne Knoten wird ignoriert', T.besitz([{ date: '2026-11-22', type: 'talent' }], liste).length, 0);
eq('fremde Logs werden ignoriert', T.besitz([{ date: '2026-11-22', type: 'strength', knoten: 'kraft-1' }], liste).length, 0);
eq('Knoten eines Drops zaehlt, wenn der Drop gilt', T.besitz([eintrag('winter-1')], alle).length, 1);
eq('und nicht, solange er in der Zukunft liegt', T.besitz([eintrag('winter-1')], nurNov).length, 0);
eq('Reihenfolge am selben Tag nach finished', T.besitz([eintrag('kraft-2', '2026-11-22', '2026-11-22T10:00:00Z'), eintrag('kraft-1', '2026-11-22', '2026-11-22T09:00:00Z')], liste).length, 2);

print('\n--- Wirkungen ---');
const w0 = T.wirkungen([], liste);
ok('ohne Talente nichts', w0.tonnenFaktor === 1 && w0.liftMinus === 0 && !w0.kugelDoppelt && !w0.mobilitaetZaehlt && !w0.mobilitaetWoche && w0.lueckeWoche === 0 && !w0.vortag && w0.titel.length === 0);
const hab = ids => T.besitz(ids.map((id, i) => eintrag(id, `2026-11-${20 + i}`)), alle);
eq('Schwere Haende: Faktor 0,9', T.wirkungen(hab(['kraft-1', 'kraft-2']), alle).tonnenFaktor, 0.9);
eq('Faktoren multiplizieren', T.wirkungen(hab(['kraft-1', 'kraft-2', 'kugel-1', 'kugel-2', 'kugel-3']), alle).tonnenFaktor, 0.855);
eq('Eisenherz: 2,5 kg', T.wirkungen(hab(['kraft-1', 'kraft-2', 'kraft-3']), alle).liftMinus, 2.5);
eq('Luecken addieren sich', T.wirkungen(hab(['disziplin-1', 'disziplin-2', 'disziplin-3', 'disziplin-4']), alle).lueckeWoche, 2);
eq('Mobility zaehlt', T.wirkungen(hab(['beweglich-1', 'beweglich-2']), alle).mobilitaetZaehlt, true);
eq('Mobility-Woche braucht den Knoten davor', T.wirkungen(hab(['beweglich-3']), alle).mobilitaetWoche, false);
eq('Vorlauf', T.wirkungen(hab(['disziplin-1', 'disziplin-2', 'disziplin-3']), alle).vortag, true);
eq('Titel sammeln sich', T.wirkungen(hab(['kraft-1', 'kugel-1']), alle).titel.length, 2);
eq('Doppelter Schwung', T.wirkungen(hab(['kugel-1', 'kugel-2']), alle).kugelDoppelt, true);

print('\n--- Kosten ---');
const kosten = id => alle.flatMap(x => x.knoten).find(k => k.id === id).kosten || 1;
eq('der erste Knoten kostet 1', kosten('kraft-1'), 1);
eq('der zweite kostet 2', kosten('kraft-2'), 2);
eq('der dritte kostet 3', kosten('kraft-3'), 3);
ok('in jedem Ast kostet ein Knoten mindestens so viel wie der davor', alle.every(a => a.knoten.every((k, i) => !i || (k.kosten || 1) >= (a.knoten[i - 1].kosten || 1))));
eq('Kosten stehen im Besitz', T.besitz([eintrag('kraft-1', '2026-11-20'), eintrag('kraft-2', '2026-11-21')], alle)[1].kosten, 2);
eq('zu wenig Punkte fuer den teuren Knoten', T.sperre('kraft-2', T.besitz([eintrag('kraft-1')], alle), alle, 1), 'punkte');
eq('mit genug Punkten frei', T.sperre('kraft-2', T.besitz([eintrag('kraft-1')], alle), alle, 2), null);

print('\n--- Stufen und Sperren ---');
const st = T.stufen(hab(['kraft-1', 'kraft-2']), alle);
eq('Kraft: zwei von drei', st.find(s => s.id === 'kraft').frei, 2);
eq('Kugel: keiner', st.find(s => s.id === 'kugel').frei, 0);
eq('frei', T.sperre('kraft-1', [], alle, 1), null);
eq('ohne Punkte gesperrt', T.sperre('kraft-1', [], alle, 0), 'punkte');
eq('ohne Voraussetzung gesperrt', T.sperre('kraft-2', [], alle, 5), 'braucht');
eq('schon da', T.sperre('kraft-1', hab(['kraft-1']), alle, 5), 'da');
eq('unbekannt', T.sperre('gibtsnicht', [], alle, 5), 'unbekannt');
const e = T.eintrag('kraft-1', '2026-11-22');
ok('der Eintrag hat Art, Knoten und Datum', e.type === 'talent' && e.knoten === 'kraft-1' && e.date === '2026-11-22' && !!e.finished);

print('\n--- Im Programm: kein Training ---');
ok('Talent ist kein Training', P.KEIN_TRAINING.includes('talent'));
eq('istTraining sagt nein', P.istTraining({ date: '2026-11-22', type: 'talent', knoten: 'kraft-1' }), false);
const cfg = { lifts: { squat: { name: 'Kniebeuge', start: 40, increment: 2.5, schema: 0 } }, workouts: { A: [{ lift: 'squat' }], B: [{ lift: 'squat' }] }, bar: 20, rounding: 2.5 };
const vorher = P.initialState(cfg);
const nachher = P.applyLog(vorher, cfg, { date: '2026-11-22', type: 'talent', knoten: 'kraft-1' });
eq('applyLog aendert die Historie nicht', (nachher.history || []).length, (vorher.history || []).length);
eq('und nicht den naechsten Tag A/B', nachher.next, vorher.next);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
