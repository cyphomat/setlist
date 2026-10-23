// Ausfuehren: jsc --module-file=tests/wod.test.js
import * as W from '../js/wod.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const state = { lifts: {
  squat:{weight:55,fails:0}, bench:{weight:37.5,fails:0}, row:{weight:35,fails:0},
  ohp:{weight:27.5,fails:0}, deadlift:{weight:70,fails:0} } };

print('\n--- Gleicher Seed, gleiches Workout ---');
const a = W.generateWod(state, 12345);
const b = W.generateWod(state, 12345);
eq('identisch reproduzierbar', JSON.stringify(a), JSON.stringify(b));
ok('anderer Seed liefert etwas anderes',
   JSON.stringify(W.generateWod(state, 999)) !== JSON.stringify(a));

print('\n--- Ueber 400 Seeds muss jedes Workout gueltig sein ---');
let maxHantel = 0, fehlendeTeile = 0, kaputteLast = 0, leereNamen = 0, dopplung = 0;
const formate = {};
for (let s = 1; s <= 400; s++) {
  const w = W.generateWod(state, s);
  formate[w.formatId] = (formate[w.formatId] || 0) + 1;
  const soll = W.FORMATE.find(f => f.id === w.formatId).teile;
  if (w.teile.length !== soll) fehlendeTeile++;
  const namen = w.teile.map(t => t.name);
  if (new Set(namen).size !== namen.length) dopplung++;
  const hantel = w.teile.filter(t => t.last !== null).length;
  if (hantel > maxHantel) maxHantel = hantel;
  for (const t of w.teile) {
    if (!t.name) leereNamen++;
    if (t.last !== null && (t.last < 20 || Math.round(t.last * 10) % 25 !== 0)) kaputteLast++;
    if (w.formatId !== 'tabata' && !(t.menge > 0)) fehlendeTeile++;
  }
}
eq('immer die richtige Anzahl Teile', fehlendeTeile, 0);
eq('nie dieselbe Uebung doppelt', dopplung, 0);
eq('nie mehr als ein Langhantelteil', maxHantel, 1);
eq('keine leeren Namen', leereNamen, 0);
eq('alle Lasten >= 20 kg und auf 2,5 gerundet', kaputteLast, 0);
ok('alle fuenf Formate kommen vor', Object.keys(formate).length === 5, JSON.stringify(formate));

print('\n--- Lasten haengen am tatsaechlichen Stand ---');
const schwach = { lifts: { squat:{weight:40}, bench:{weight:30}, row:{weight:30}, ohp:{weight:20}, deadlift:{weight:50} } };
const stark   = { lifts: { squat:{weight:120}, bench:{weight:90}, row:{weight:80}, ohp:{weight:60}, deadlift:{weight:180} } };
let gefunden = false;
for (let s = 1; s <= 200 && !gefunden; s++) {
  const w1 = W.generateWod(schwach, s), w2 = W.generateWod(stark, s);
  const l1 = w1.teile.find(t => t.last), l2 = w2.teile.find(t => t.last);
  if (l1 && l2) { ok('starker Athlet bekommt mehr Last', l2.last > l1.last, `${l1.last} vs ${l2.last}`); gefunden = true; }
}
ok('ueberhaupt ein Langhantel-WOD gefunden', gefunden);

print('\n--- Tabata hat keine Wiederholungszahl ---');
let tab = null;
for (let s = 1; s <= 500 && !tab; s++) { const w = W.generateWod(state, s); if (w.formatId === 'tabata') tab = w; }
ok('Tabata existiert', !!tab);
if (tab) eq('Menge bleibt leer', tab.teile[0].menge, null);

print('\n--- Beschriftung fuer Log und Historie ---');
const lbl = W.wodLabel(a);
ok('Label ist gefuellt', lbl.length > 8, lbl);
ok('Label nennt die Uebungen', a.teile.every(t => lbl.includes(t.name)));

print('\n--- Seed aus Text ist stabil ---');
eq('gleicher Text, gleicher Seed', W.seedAus('2026-09-02'), W.seedAus('2026-09-02'));
ok('anderer Text, anderer Seed', W.seedAus('2026-09-02') !== W.seedAus('2026-09-03'));

print(`\n========== ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);

print('\n--- Jede Uebung hat eine Skalierung ---');
eq('keine Uebung ohne Alternative',
   W.MOVES.filter(m => !m.skalierung || !m.skalierung.length).length, 0);
const klimm = W.MOVES.find(m => m.id === 'pullup');
ok('Pull-ups nennen Ring Rows zuerst', klimm.skalierung[0].includes('Ring Rows'), klimm.skalierung[0]);
ok('mehrere Stufen', klimm.skalierung.length >= 3, klimm.skalierung.length);
ok('Skalierungen kommen im erzeugten WOD mit',
   W.generateWod(state, 7).teile.every(t => Array.isArray(t.skalierung)));

print('\n--- Ausgeschlossene Uebungen tauchen nicht auf ---');
const ohne = { wod: { aus: ['pullup'] } };
let klimmzuege = 0;
for (let s = 1; s <= 400; s++) {
  if (W.generateWod(state, s, ohne).teile.some(t => t.name === 'Pull-ups')) klimmzuege++;
}
eq('Pull-ups ueber 400 Seeds: nie', klimmzuege, 0);
let ohneAusschluss = 0;
for (let s = 1; s <= 400; s++) {
  if (W.generateWod(state, s).teile.some(t => t.name === 'Pull-ups')) ohneAusschluss++;
}
ok('ohne Ausschluss kommen sie sehr wohl vor', ohneAusschluss > 10, ohneAusschluss);

print('\n--- Auch mit vielen Ausschluessen bleibt es benutzbar ---');
const vieleAus = { wod: { aus: ['pullup','burpee','boxjump','kbswing','situp','pushup','lunge'] } };
let leer = 0, zuWenig = 0;
for (let s = 1; s <= 200; s++) {
  const w = W.generateWod(state, s, vieleAus);
  if (!w.teile.length) leer++;
  if (w.teile.length < 2) zuWenig++;
  if (w.teile.some(t => vieleAus.wod.aus.includes(t.id))) zuWenig++;
}
eq('nie ein leeres Workout', leer, 0);
eq('nie unter zwei Teilen und nie etwas Ausgeschlossenes', zuWenig, 0);

print('\n--- Notbremse: schliesst man alles aus, bleibt der volle Pool ---');
const allesAus = { wod: { aus: W.MOVES.map(m => m.id) } };
ok('lieber ein Workout als gar keins', W.generateWod(state, 3, allesAus).teile.length > 0);

print('\n--- Jede Uebung erklaert sich ---');
eq('keine Uebung ohne Erklaerung',
   W.MOVES.filter(m => !m.erklaerung || m.erklaerung.length < 60).length, 0);
ok('Erklaerungen sind zwei Saetze oder mehr',
   W.MOVES.every(m => (m.erklaerung.match(/[.!?]/g) || []).length >= 2),
   W.MOVES.filter(m => (m.erklaerung.match(/[.!?]/g) || []).length < 2).map(m => m.id).join(','));
ok('Erklaerung kommt im erzeugten WOD mit',
   W.generateWod(state, 11).teile.every(t => typeof t.erklaerung === 'string' && t.erklaerung.length > 0));

print('\n--- Latzug als Ersatz fuer die Klimmzuege ---');
const lat = W.MOVES.find(m => m.id === 'latzug');
ok('existiert', !!lat);
eq('zaehlt als Turnen', lat.kat, 'turnen');
ok('nennt den Bezug zum Klimmzug', lat.erklaerung.includes('Klimmzug'), lat.erklaerung.slice(0,50));
let latGesehen = 0;
for (let s = 1; s <= 300; s++) {
  if (W.generateWod(state, s, { wod:{ aus:['pullup'] } }).teile.some(t => t.id === 'latzug')) latGesehen++;
}
ok('kommt trotz Klimmzug-Ausschluss vor', latGesehen > 5, latGesehen);

/* Ein gebautes Teil muss den Standard SEINER Bewegung tragen. Beim ersten
   Anlauf stand in der Bau-Funktion ein fest verdrahteter Text, sodass jede
   Bewegung denselben Standard zeigte — im Zweifel den einer voellig anderen
   Uebung. Ein falscher Standard ist schlimmer als gar keiner.          */
print('\n--- Der Standard gehoert zur Bewegung, nicht zur Position ---');
{
  let geprueft = 0, falsch = [];
  for (let seed = 0; seed < 60; seed++) {
    for (const teil of W.generateWod(state, seed).teile) {
      const quelle = W.MOVES.find(m => m.id === teil.id);
      if (teil.standard !== (quelle.standard || '')) falsch.push(`${teil.id}`);
      geprueft++;
    }
  }
  ok(`ueber ${geprueft} gebaute Teile stimmt der Standard mit der Bewegung ueberein`,
     falsch.length === 0, [...new Set(falsch)].join());
}

print('\n--- I go, you go ---');
{
  const z0 = W.zweierNeu();
  eq('Standard: du faengt an', z0.dran, 'du');
  eq('Zaehler stehen auf null', z0.du + z0.partner + z0.wechsel, 0);
  eq('Partner kann anfangen', W.zweierNeu('partner').dran, 'partner');
  eq('Unsinn: du faengt an', W.zweierNeu('boss').dran, 'du');
  eq('null: du faengt an', W.zweierNeu(null).dran, 'du');

  const z1 = W.zweierWechsel(z0);
  eq('nach dem ersten Wechsel ist der Partner dran', z1.dran, 'partner');
  eq('der Durchgang von du zaehlt', z1.du, 1);
  eq('der des Partners noch nicht', z1.partner, 0);
  eq('ein Wechsel gezaehlt', z1.wechsel, 1);
  const z2 = W.zweierWechsel(z1);
  eq('wieder du dran', z2.dran, 'du');
  eq('jetzt zaehlt der Partner', z2.partner, 1);
  eq('zwei Wechsel', z2.wechsel, 2);
  let z = z0;
  for (let i = 0; i < 7; i++) z = W.zweierWechsel(z);
  eq('sieben Wechsel: du 4', z.du, 4);
  eq('sieben Wechsel: Partner 3', z.partner, 3);
  eq('sieben Wechsel: Partner dran', z.dran, 'partner');
  ok('Eingabe bleibt unveraendert', z0.wechsel === 0 && z0.du === 0 && z0.dran === 'du');
  eq('Wechsel ohne Stand: nichts', W.zweierWechsel(null), null);

  const p = W.zweierStart(W.zweierNeu(), 'partner');
  eq('Start vor dem ersten Wechsel aenderbar', p.dran, 'partner');
  eq('und als Start gemerkt', p.start, 'partner');
  const nachWechsel = W.zweierStart(z1, 'partner');
  eq('nach dem ersten Wechsel gesperrt', nachWechsel.dran, z1.dran);
  eq('Start mit Unsinn aendert nichts', W.zweierStart(z0, 'boss').dran, 'du');
  eq('Start ohne Stand: nichts', W.zweierStart(null, 'du'), null);
  eq('Partner faengt an: dann zaehlt zuerst der Partner', W.zweierWechsel(p).partner, 1);

  eq('Log: ohne Wechsel null', W.zweierLog(z0), null);
  eq('Log: ohne Stand null', W.zweierLog(null), null);
  const l = W.zweierLog(z);
  eq('Log: du', l.du, 4);
  eq('Log: Partner', l.partner, 3);
  eq('Log: Wechsel', l.wechsel, 7);
  eq('Log: nur drei Felder', Object.keys(l).length, 3);
  eq('Log: Unsinn wird zu null', W.zweierLog({ du: '<b>', partner: -5, wechsel: 3 }).du, 0);
  eq('Log: negativ wird null', W.zweierLog({ du: '<b>', partner: -5, wechsel: 3 }).partner, 0);
  eq('Log: gedeckelt', W.zweierLog({ du: 5000, partner: 1, wechsel: 99999 }).du, W.ZWEIER_MAX);
  eq('Log: Wechsel gedeckelt', W.zweierLog({ du: 1, partner: 1, wechsel: 99999 }).wechsel, W.ZWEIER_MAX);
  eq('Log: Kommazahl wird null', W.zweierLog({ du: 1.5, partner: 1, wechsel: 2 }).du, 0);
  let voll = { start: 'du', dran: 'du', du: W.ZWEIER_MAX, partner: 0, wechsel: W.ZWEIER_MAX };
  voll = W.zweierWechsel(voll);
  eq('Obergrenze laeuft nicht ueber', voll.du, W.ZWEIER_MAX);
  eq('Wechsel auch nicht', voll.wechsel, W.ZWEIER_MAX);
  eq('die andere Person', W.zweierAndere('du'), 'partner');
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
