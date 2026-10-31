// Ausfuehren: jsc --module-file=tests/geraete.test.js
import * as G from '../js/geraete.js';
import { MOVES, generateWod } from '../js/wod.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const state = { lifts: {
  squat: { weight: 80 }, bench: { weight: 60 }, row: { weight: 55 },
  ohp: { weight: 40 }, deadlift: { weight: 100 }
} };

print('\n--- Katalog ---');
ok('jedes Geraet hat Kennung und Namen', G.GERAETE.every(g => g.id && g.name));
ok('Kennungen sind eindeutig', new Set(G.GERAETE.map(g => g.id)).size === G.GERAETE.length);
eq('ALLE_GERAETE deckt den Katalog', G.ALLE_GERAETE.length, G.GERAETE.length);
eq('Name zur Kennung', G.geraetName('kettlebell'), 'Kettlebell');
eq('unbekannte Kennung bleibt sichtbar', G.geraetName('trampolin'), 'trampolin');

print('\n--- Jede Bewegung nennt ihre Geraete ---');
ok('kein Feld fehlt', MOVES.every(m => Array.isArray(m.geraete)));
const unbekannt = MOVES.flatMap(m => m.geraete).filter(g => !G.ALLE_GERAETE.includes(g));
ok('keine unbekannte Geraetekennung', unbekannt.length === 0, unbekannt.join(', '));
ok('Langhantelteile brauchen die Langhantel',
  MOVES.filter(m => m.kat === 'hantel').every(m => m.geraete.includes('langhantel')));
ok('Burpees brauchen nichts', MOVES.find(m => m.id === 'burpee').geraete.length === 0);

print('\n--- Machbarkeit ---');
const bw = { geraete: [] };
ok('Koerpergewicht geht ueberall', G.machbar(bw, []));
ok('fehlendes Geraet sperrt', !G.machbar({ geraete: ['langhantel'] }, ['kurzhantel']));
ok('vorhandenes Geraet erlaubt', G.machbar({ geraete: ['langhantel'] }, ['langhantel', 'box']));
ok('mehrere noetige Geraete: alle muessen da sein',
  !G.machbar({ geraete: ['a', 'b'] }, ['a']));
eq('mit voller Ausstattung ist alles machbar',
  G.machbare(MOVES, G.ALLE_GERAETE).length, MOVES.length);
ok('ohne Geraete bleiben nur Koerpergewichtsuebungen',
  G.machbare(MOVES, []).every(m => m.geraete.length === 0));
ok('und das sind mehr als null', G.machbare(MOVES, []).length > 0);

print('\n--- Orte aus der Konfiguration ---');
eq('ohne Eintrag keine Orte', G.gyms({}).length, 0);
eq('null-Konfiguration kippt nicht', G.gyms(null).length, 0);
eq('kaputter Eintrag statt Liste', G.gyms({ gyms: 'nope' }).length, 0);

const cfg = { gyms: [
  { id: 'home', name: 'Homegym', geraete: ['kettlebell', 'springseil'] },
  { id: 'box', name: 'Box', geraete: [...G.ALLE_GERAETE] },
  { id: '  ', name: 'Namenlos', geraete: [] },
  { name: 'ohne Kennung', geraete: [] }
] };
eq('Eintraege ohne brauchbare Kennung fliegen raus', G.gyms(cfg).length, 2);
eq('Ort per Kennung', G.gym(cfg, 'home').name, 'Homegym');
eq('unbekannter Ort ist null', G.gym(cfg, 'mond'), null);
eq('leere Kennung ist null', G.gym(cfg, ''), null);

const schmutzig = { gyms: [{ id: 'x', geraete: ['kettlebell', 'trampolin', 'kettlebell'] }] };
const x = G.gyms(schmutzig)[0];
eq('unbekanntes Geraet wird verworfen', x.geraete.join(','), 'kettlebell');
eq('Name faellt auf die Kennung zurueck', x.name, 'x');

print('\n--- Aktive Geraete ---');
eq('ohne Wahl gilt alles', G.aktiveGeraete(cfg, '').length, G.ALLE_GERAETE.length);
eq('unbekannter Ort gilt als alles', G.aktiveGeraete(cfg, 'mond').length, G.ALLE_GERAETE.length);
eq('gewaehlter Ort liefert seine Ausstattung', G.aktiveGeraete(cfg, 'home').length, 2);

print('\n--- Neue Orte ---');
const n1 = G.neuerGym('Homegym', []);
eq('Kennung aus dem Namen', n1.id, 'homegym');
eq('startet mit voller Ausstattung', n1.geraete.length, G.ALLE_GERAETE.length);
eq('Kennung weicht Kollisionen aus', G.neuerGym('Homegym', [n1]).id, 'homegym-2');
eq('Sonderzeichen fallen raus', G.neuerGym('Crossfit Box!', []).id, 'crossfit-box');
eq('nur Sonderzeichen ergibt einen Rueckfall', G.neuerGym('!!!', []).id, 'gym');
ok('Vorlagen haben eindeutige Kennungen',
  new Set(G.vorlagen().map(o => o.id)).size === G.vorlagen().length);
ok('Vorlagen nennen nur bekannte Geraete',
  G.vorlagen().every(o => o.geraete.every(g => G.ALLE_GERAETE.includes(g))));

print('\n--- Der Generator haelt sich daran ---');
const nurKb = ['kettlebell', 'springseil'];
for (let seed = 0; seed < 40; seed++) {
  const w = generateWod(state, seed, {}, nurKb);
  const verletzt = w.teile.filter(teil => {
    const m = MOVES.find(x => x.id === teil.id);
    return !G.machbar(m, nurKb);
  });
  if (verletzt.length) { ok(`Seed ${seed} bleibt im Vorrat`, false, verletzt.map(v => v.name).join(', ')); break; }
  if (seed === 39) ok('40 Seeds bleiben im Vorrat', true);
}

const ohne = generateWod(state, 7, {});
ok('ohne Geraeteangabe wie bisher', ohne.teile.length > 0);
ok('null bedeutet keine Einschraenkung',
  JSON.stringify(generateWod(state, 7, {}, null)) === JSON.stringify(ohne));

// Eine leere Liste heisst "hier steht nichts" — dann greift der Rueckfall,
// damit statt eines leeren Bildschirms wenigstens ein Workout dasteht.
const leer = generateWod(state, 3, {}, []);
ok('zu wenig Geraete liefert trotzdem ein Workout', leer.teile.length > 0);

// Ausgeschlossene Uebungen und Geraetefilter greifen zusammen.
const mitAus = generateWod(state, 11, { wod: { aus: ['kbswing'] } }, nurKb);
ok('ausgeschlossene Uebung bleibt draussen', !mitAus.teile.some(teil => teil.id === 'kbswing'));

print('\n--- Schutz gegen versehentliches Loeschen ---');
// Der Fehler, den es zu verhindern gilt: ein Entwurf, der entstand, bevor
// die Konfiguration geladen war, ist leer — und wuerde beim Speichern die
// echten Orte ueberschreiben. Genau so sind einmal Orte verlorengegangen.
const zwei = [{ id: 'a' }, { id: 'b' }];
ok('befuellter Entwurf geht immer durch', G.darfSpeichern(zwei, zwei, false));
ok('leer gegen leer ist harmlos', G.darfSpeichern([], [], false));
ok('leer gegen belegt wird ohne Aenderung blockiert', !G.darfSpeichern([], zwei, false));
ok('leer gegen belegt geht mit Aenderung durch', G.darfSpeichern([], zwei, true));
ok('ausdrueckliches Loeschen aller Orte bleibt moeglich', G.darfSpeichern([], zwei, true));
ok('kein Entwurf wird nie gespeichert', !G.darfSpeichern(null, zwei, true));
ok('Unsinn statt Entwurf ebenfalls nicht', !G.darfSpeichern('nope', zwei, true));
ok('unbrauchbarer Repo-Stand blockiert nicht', G.darfSpeichern([], null, false));


print('\n--- Gewichte am Ort ---');
const gj = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);
const SCH = [{ kg: 2.5, n: 2 }, { kg: 1.25, n: 2 }, { kg: 0.5, n: 1 }];
const keller = G.gyms({ gyms: [{ id: 'home', name: 'Homegym', geraete: ['kettlebell', 'kurzhantel', 'zwiftride'],
  kugelBasis: 12, kurzhantelStange: 2, scheiben: SCH }] })[0];
ok('Zwift Ride ist ein bekanntes Geraet', G.ALLE_GERAETE.includes('zwiftride') && keller.geraete.includes('zwiftride'));
ok('Homegym-Vorlage nennt Zwift Ride', G.vorlagen().find(o => o.id === 'home').geraete.includes('zwiftride'));
gj('Ausstattung wird gelesen', [keller.kugelBasis, keller.kurzhantelStange, keller.scheiben], [12, 2, SCH]);
ok('ohne Angaben keine neuen Felder (Orte wie bisher)',
  Object.keys(G.gyms({ gyms: [{ id: 'a', geraete: [] }] })[0]).join() === 'id,name,geraete');
gj('kaputte Angaben fliegen raus statt falsch zu rechnen',
  G.gyms({ gyms: [{ id: 'a', kugelBasis: 'x', kurzhantelStange: -2, scheiben: [{ kg: 0.1, n: 2 }, { kg: 5, n: 0 }, null] }] })[0],
  { id: 'a', name: 'a', geraete: [] });
gj('gymFuerDatei behaelt die Ausstattung', G.gymFuerDatei(keller), keller);
gj('Vorrat: gleiche Scheiben zusammen, schwerste zuerst',
  G.vorrat([{ kg: 1.25, n: 1 }, { kg: 2.5, n: 1 }, { kg: 1.25, n: 1 }]), [{ kg: 2.5, n: 1 }, { kg: 1.25, n: 2 }]);

print('\n--- Scheibentext ---');
gj('Text lesen', G.scheibenAusText('2×2,5 + 2×1,25 + 0,5'), SCH);
gj('x und Punkt gehen auch', G.scheibenAusText('2x2.5 + 2*1.25 + 0.5 kg'), SCH);
gj('leer ist kein Fehler, nur kein Vorrat', G.scheibenAusText('  '), []);
ok('Unsinn ist null', G.scheibenAusText('abc') === null && G.scheibenAusText('2×') === null);
ok('Gewicht ausserhalb der Viertel ist null', G.scheibenAusText('0,3') === null);
ok('zu viele Stueck sind null statt still gekappt', G.scheibenAusText('9×5') === null);
ok('zu viele Arten sind null', G.scheibenAusText('1 + 2 + 3 + 4 + 5 + 6 + 7') === null);
eq('Text schreiben', G.scheibenText(SCH), '2×2.5 + 2×1.25 + 0.5');
gj('Text ist wieder lesbar', G.scheibenAusText(G.scheibenText(SCH, kg => String(kg).replace('.', ','))), SCH);
eq('Ladung als Text', G.ladungText([2.5, 1.25, 2.5]), '2×2.5 + 1.25');

print('\n--- Kugel laden ---');
eq('14 Gewichte mit diesen Scheiben', G.ladbareGewichte(12, SCH).length, 14);
gj('genau diese Gewichte', G.ladbareGewichte(12, SCH),
  [12, 12.5, 13.25, 13.75, 14.5, 15, 15.75, 16.25, 17, 17.5, 18.25, 18.75, 19.5, 20]);
gj('12 kg ist die Kugel allein', G.kugelLaden(12, keller).exakt, { gewicht: 12, scheiben: [] });
gj('17,5 kg exakt', G.kugelLaden(17.5, keller).exakt.scheiben, [2.5, 2.5, 0.5]);
gj('20 kg nimmt alles', G.kugelLaden(20, keller).exakt.scheiben, [2.5, 2.5, 1.25, 1.25, 0.5]);
const k16 = G.kugelLaden(16, keller);
ok('16 kg ist nicht exakt ladbar', k16.exakt === null);
gj('aber 15,75 und 16,25 liegen daneben', [k16.darunter.gewicht, k16.darueber.gewicht], [15.75, 16.25]);
ok('ueber 20 gibt es kein Darueber', G.kugelLaden(21, keller).darueber === null && G.kugelLaden(21, keller).darunter.gewicht === 20);
ok('unter der Basis gibt es kein Darunter', G.kugelLaden(10, keller).darunter === null && G.kugelLaden(10, keller).darueber.gewicht === 12);
ok('13,3 wird nicht still zu 13,25', G.kugelLaden(13.3, keller).exakt === null);
ok('jede ladbare Zahl wird auch exakt gefunden',
  G.ladbareGewichte(12, SCH).every(w => G.kugelLaden(w, keller).exakt && G.kugelLaden(w, keller).exakt.gewicht === w));
ok('Summe der Scheiben stimmt immer',
  G.ladbareGewichte(12, SCH).every(w => Math.abs(12 + G.kugelLaden(w, keller).exakt.scheiben.reduce((s, x) => s + x, 0) - w) < 1e-9));
ok('nie mehr Scheiben als im Vorrat',
  G.ladbareGewichte(12, SCH).every(w => {
    const l = G.kugelLaden(w, keller).exakt.scheiben;
    return SCH.every(x => l.filter(y => y === x.kg).length <= x.n);
  }));
ok('ohne Kugel-Basis keine Ladeanzeige', G.kugelLaden(16, { scheiben: SCH }) === null && G.kugelLaden(16, null) === null);
ok('ohne Scheiben geht nur die Kugel', G.kugelLaden(12, { kugelBasis: 12 }).exakt.scheiben.length === 0
  && G.kugelLaden(14, { kugelBasis: 12 }).exakt === null);
ok('Unsinn als Ziel ist null', G.kugelLaden(0, keller) === null && G.kugelLaden('x', keller) === null);

print('\n--- Kurzhantel laden ---');
gj('Stange allein', G.kurzhantelLaden(2, keller).exakt, { gewicht: 2, scheiben: [], seiten: { a: [], b: [], gleich: true } });
const k9 = G.kurzhantelLaden(9.5, keller).exakt;
ok('9,5 kg: beide Seiten gleich (2,5 + 1,25)', k9 && k9.seiten.gleich && JSON.stringify(k9.seiten.a) === '[2.5,1.25]' && JSON.stringify(k9.seiten.b) === '[2.5,1.25]');
const k5 = G.kurzhantelLaden(5, keller).exakt;
ok('5 kg braucht die 0,5er: Seiten ungleich', k5 && !k5.seiten.gleich);
ok('die schwerere Seite steht zuerst', k5.seiten.a.reduce((s, x) => s + x, 0) >= k5.seiten.b.reduce((s, x) => s + x, 0));
ok('beide Seiten zusammen sind die Ladung', G.ladungText([...k5.seiten.a, ...k5.seiten.b]) === G.ladungText(k5.scheiben));
ok('gleiche Seiten schlagen weniger Scheiben', (() => {
  // 7 kg auf 2 kg Stange: eine 5er (ungleich) oder 2×2,5 (gleich) — es zaehlt gleich.
  const r = G.kurzhantelLaden(7, { kurzhantelStange: 2, scheiben: [{ kg: 5, n: 1 }, { kg: 2.5, n: 2 }] }).exakt;
  return r && r.seiten.gleich && JSON.stringify(r.seiten.a) === '[2.5]' && JSON.stringify(r.seiten.b) === '[2.5]';
})());
ok('ohne Stange keine Ladeanzeige', G.kurzhantelLaden(6, { scheiben: SCH }) === null);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
