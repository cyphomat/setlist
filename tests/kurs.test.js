// Ausfuehren: jsc --module-file=tests/kurs.test.js
import * as K from '../js/kurs.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleichJson = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

const log = (i, extra = {}) => ({ date: '2026-11-01', type: 'kurs', kurs: 'kettlebell',
  finished: `2026-11-01T10:${String(i).padStart(2, '0')}:00.000Z`, ...extra });
const logs = n => Array.from({ length: n }, (_, i) => log(i));

print('\n--- Zustand ---');
eq('ohne Einheit: Woche 1, Tag A', `${K.zustand([]).woche}${K.zustand([]).tag}`, '1A');
eq('nach drei: Woche 2, Tag A', `${K.zustand(logs(3)).woche}${K.zustand(logs(3)).tag}`, '2A');
eq('nach vier: Tag B', K.zustand(logs(4)).tag, 'B');
eq('nach 35: Woche 12, Tag C', `${K.zustand(logs(35)).woche}${K.zustand(logs(35)).tag}`, '12C');
ok('Woche 12 Tag C ist der Test', K.zustand(logs(35)).test);
ok('nach 36: fertig', K.zustand(logs(36)).fertig && K.naechste(logs(36)) === null);
ok('fremde Logs zaehlen nicht', K.zustand([{ date: '2026-11-01', type: 'wod' }]).absolviert === 0);
eq('Phase 2 ab Woche 5', K.zustand(logs(12)).phase, 'grundlage');
ok('Woche 4 ist Entlastung', K.zustand(logs(9)).entlastung);

print('\n--- Plan ---');
for (let w = 1; w <= K.WOCHEN; w++) for (const t of K.TAGE) {
  const e = K.einheit(w, t);
  ok(`Woche ${w}${t} hat Bausteine mit bekannten Uebungen`,
    e && e.bloecke.length > 0 && e.bloecke.every(b => b.u.every(id => K.UEBUNGEN[id])));
}
ok('Woche 12 C ist Test', K.einheit(12, 'C').test && !K.einheit(12, 'B').test);
ok('unbekannter Tag', K.einheit(1, 'X') === null && K.einheit(13, 'A') === null);
ok('Dauer plausibel (5 bis 45 Min)', [1, 5, 9, 12].every(w => K.TAGE.every(t => { const m = K.minuten(K.einheit(w, t)); return m >= 5 && m <= 45; })));
{
  const a = K.ablauf(K.einheit(1, 'B'));
  ok('Ablauf nicht leer, erste Station kein Pause-Schritt', a.length > 0 && a[0].art !== 'pause');
  ok('nie Pause am Ende', a[a.length - 1].art !== 'pause');
}

print('\n--- Kugelwechsel ---');
eq('zwei leicht: hoch', K.lastVorschlag([log(1, { bewertung: 'leicht' }), log(2, { bewertung: 'leicht' })]), 'hoch');
eq('zwei zaeh: runter', K.lastVorschlag([log(1, { bewertung: 'zaeh' }), log(2, { bewertung: 'zaeh' })]), 'runter');
eq('gemischt: nichts', K.lastVorschlag([log(1, { bewertung: 'leicht' }), log(2, { bewertung: 'passend' })]), null);
eq('eine Einheit: nichts', K.lastVorschlag([log(1, { bewertung: 'leicht' })]), null);

print('\n--- Zwischentests ---');
eq('Woche 4 Tag C: Check 1', K.einheit(4, 'C').testId, 'w4');
eq('Woche 8 Tag C: Check 2', K.einheit(8, 'C').testId, 'w8');
eq('Woche 12 Tag C: Abschluss', K.einheit(12, 'C').testId, 'w12');
ok('andere Tage ohne Test', K.einheit(4, 'B').testId === null && K.einheit(7, 'C').testId === null);
ok('Zustand erkennt den Check', K.zustand(logs(11)).testId === 'w4' && K.zustand(logs(23)).testId === 'w8' && K.zustand(logs(35)).testId === 'w12');
ok('Testeinheit zaehlt nicht als Entlastung', !K.einheit(4, 'C').entlastung && K.einheit(4, 'A').entlastung);
{
  const t = K.tests([log(1, { test: 'w4', geschafft: false, kugeln: { swing2: 12 } })]);
  eq('drei Checks', t.length, 3);
  ok('Check 1 gemacht, nicht ganz', t[0].datum === '2026-11-01' && t[0].geschafft === false && t[0].kugeln.swing2 === 12);
  ok('Check 2 offen', t[1].datum === null && t[1].geschafft === null);
}

print('\n--- Tragen: Schritte je Seite ---');
{
  const a = K.ablauf(K.einheit(1, 'A')).filter(x => x.art === 'zeit');
  eq('zwei Saetze mal zwei Seiten', a.length, 4);
  ok('Seiten 1,2,1,2', a.map(x => x.seite).join('') === '1212');
  ok('Sekunden aus dem Baustein', a.every(x => x.sekunden === 20));
}

print('\n--- Kugel in kg ---');
{
  const e = K.einheit(1, 'A');
  const ks = K.kugelBausteine(e).map(x => x.schluessel);
  ok('Aufwaermen zaehlt nicht', !ks.includes('halo'));
  ok('Hinge, Goblet, Carry', ks.join() === 'hinge,goblet,carry');
  ok('Get-up ohne Kugel (Woche 1 C) hat keinen Zaehler', !K.kugelBausteine(K.einheit(1, 'C')).some(x => x.schluessel === 'getup'));
  ok('Komplex hat einen Schluessel', K.kugelBausteine(K.einheit(9, 'A')).some(x => x.schluessel === 'clean+press'));
  gleichJson('bereinigt: nur gueltige Schluessel und Zahlen', K.bereinigeKugeln({ hinge: '16', goblet: 0, carry: -4, fremd: 8, x: 'a' }, e), { hinge: 16 });
  gleichJson('bereinigt: Halbkilo', K.bereinigeKugeln({ hinge: 12.5 }, e), { hinge: 12.5 });
  gleichJson('bereinigt: Viertelkilo (13,25 wird nicht zu 13,5)', K.bereinigeKugeln({ hinge: 13.25, goblet: 15.75 }, e), { hinge: 13.25, goblet: 15.75 });
  eq('zu schwer faellt heraus', Object.keys(K.bereinigeKugeln({ hinge: 500 }, e)).length, 0);
  const ls = [log(1, { kugeln: { hinge: 12 } }), log(2, { kugeln: { goblet: 8 } }), log(3, { kugeln: { hinge: 14 } })];
  eq('letzte Kugel', K.letzteKugel(ls, 'hinge'), 14);
  eq('Kugel aus aelterer Einheit', K.letzteKugel(ls, 'goblet'), 8);
  eq('unbekannt', K.letzteKugel(ls, 'press'), null);
  gleichJson('Verlauf', K.kugelReihe(ls, 'hinge').map(p => p.kg), [12, 14]);
  const bw = K.bestwerte(ls).find(x => x.schluessel === 'hinge');
  ok('Bestwert: aktuell 14, hoechste 14, zweimal', bw.aktuell === 14 && bw.hoechste === 14 && bw.n === 2);
  const zurueck = K.bestwerte([log(1, { kugeln: { hinge: 16 } }), log(2, { kugeln: { hinge: 12 } })]).find(x => x.schluessel === 'hinge');
  ok('zurueckgegangen: hoechste bleibt', zurueck.aktuell === 12 && zurueck.hoechste === 16);
}

print('\n--- Englische Namen, deutsche Erklaerung ---');
ok('jede Uebung hat Name, Cue und deutsche Erklaerung', Object.values(K.UEBUNGEN).every(u =>
  u.name && u.cue && /^[A-Z]/.test(u.name) && u.erklaerung.length > 40 && u.standard.length > 20));
ok('Namen enthalten keine deutschen Reste', Object.values(K.UEBUNGEN).every(u => !/(einarmig|beidarmig|Hüfte|Tragen|Kugel)/.test(u.name + ' ' + u.cue)));

print('\n--- Bewegtes Gewicht ---');
{
  // Woche 1 Tag A: Hip Hinge 3x8, Goblet 3x6, Carry zaehlt nicht
  const l = log(1, { woche: 1, tag: 'A', kugeln: { hinge: 16, goblet: 12, carry: 20 } });
  eq('Hinge 3x8x16 + Goblet 3x6x12', K.tonnage(l), 3 * 8 * 16 + 3 * 6 * 12);
  eq('ohne Kugeln nichts', K.tonnage(log(1, { woche: 1, tag: 'A' })), 0);
  eq('fremder Typ nichts', K.tonnage({ type: 'wod', kugeln: { hinge: 16 } }), 0);
  eq('Takt: Runden x Wdh. x kg (Woche 1 B: 8 x 10 mit 12)', K.tonnage(log(1, { woche: 1, tag: 'B', kugeln: { swing2: 12 } })), 8 * 10 * 12);
  ok('einarmig zaehlt beide Seiten (Woche 5 A: Clean 3x5 je Seite mit 12)', K.tonnage(log(1, { woche: 5, tag: 'A', kugeln: { clean: 12 } })) === 3 * 5 * 2 * 12);
  eq('unbekannte Woche nichts', K.tonnage(log(1, { woche: 99, tag: 'A', kugeln: { hinge: 16 } })), 0);
}

print('\n--- Aufwaermen auf dem Rad ---');
{
  const ohne = K.einheit(1, 'A'), mit = K.einheit(1, 'A', { rad: true });
  ok('ohne Rad bleibt der Plan, wie er war', ohne.bloecke[0].warm && ohne.bloecke[0].u[0] === 'halo' && !ohne.bloecke.some(b => b.art === 'rad'));
  eq('mit Rad steht es vor dem Halo', mit.bloecke[0].art, 'rad');
  eq('danach kommt das Halo', mit.bloecke[1].u[0], 'halo');
  eq('Rest des Plans gleich', mit.bloecke.length, ohne.bloecke.length + 1);
  eq('sechs Minuten', mit.bloecke[0].minuten, 6);
  eq('Testtag: acht Minuten', K.einheit(4, 'C', { rad: true }).bloecke[0].minuten, 8);
  ok('Teile ergeben genau die Minuten', [mit, K.einheit(4, 'C', { rad: true })].every(e =>
    e.bloecke[0].teile.reduce((s, x) => s + x.sek, 0) === e.bloecke[0].minuten * 60));
  gleichJson('drei Antritte, jeder 20 s', mit.bloecke[0].teile.filter(x => x.phase === 'antritt').map(x => x.sek), [20, 20, 20]);
  eq('es beginnt locker', mit.bloecke[0].teile[0].phase, 'locker');
  ok('Rad zaehlt nicht als Kugelbaustein', K.kugelBausteine(mit).map(x => x.schluessel).join() === K.kugelBausteine(ohne).map(x => x.schluessel).join());
  eq('Label nennt das Rad nicht', K.label(mit), K.label(ohne));
  eq('Dauer waechst um die Radzeit (aufgerundet auf fuenf)', K.minuten(mit) >= K.minuten(ohne) + 5, true);
  const schritte = K.ablauf(mit).filter(a => a.art === 'rad');
  eq('Ablauf: ein Schritt je Teil', schritte.length, mit.bloecke[0].teile.length);
  ok('Ablauf: Sekunden stimmen und es gibt keine Pause dazwischen',
    schritte.every((a, i) => a.sekunden === mit.bloecke[0].teile[i].sek && a.nr === i + 1) && K.ablauf(mit).slice(0, schritte.length).every(a => a.art === 'rad'));
  eq('naechste() reicht die Wahl durch', K.naechste([], { rad: true }).bloecke[0].art, 'rad');
  eq('Rad ist in jeder Woche und an jedem Tag moeglich',
    [1, 4, 5, 8, 9, 12].every(w => K.TAGE.every(t => K.einheit(w, t, { rad: true }).bloecke[0].art === 'rad')), true);
  ok('Uebung Rad ist gepflegt', K.UEBUNGEN.rad && K.UEBUNGEN.rad.name && K.UEBUNGEN.rad.cue && K.UEBUNGEN.rad.erklaerung);
  ok('Zustand haengt nicht vom Rad ab', K.zustand(logs(5)).woche === 2);
}

print('\n--- Rad vorschlagen ---');
{
  const jetzt = new Date('2026-11-01T18:00:00');
  const fahrt = (start, min) => ({ zeit: start, minutes: min });
  eq('kein Zwift Ride: nichts', K.radVorschlag({ zwiftride: false, jetzt }).an, false);
  eq('kein Zwift Ride: Grund kein', K.radVorschlag({ zwiftride: false, jetzt }).grund, 'kein');
  eq('Zwift Ride, keine Fahrt: an', K.radVorschlag({ zwiftride: true, jetzt }).an, true);
  eq('ohne Argumente: aus', K.radVorschlag().an, false);
  const schon = K.radVorschlag({ zwiftride: true, jetzt, fahrten: [fahrt('2026-11-01T16:30:00', 45)] });
  eq('Fahrt vor 45 Min. beendet: schon warm', schon.an, false);
  eq('Grund schon', schon.grund, 'schon');
  eq('Minuten seit Ende der Fahrt', schon.vorMin, 45);
  eq('Fahrt vor Stunden: wieder an', K.radVorschlag({ zwiftride: true, jetzt, fahrten: [fahrt('2026-11-01T12:00:00', 45)] }).an, true);
  eq('knapp unter drei Stunden zaehlt noch', K.radVorschlag({ zwiftride: true, jetzt, fahrten: [fahrt('2026-11-01T14:20:00', 50)] }).an, false);
  eq('Aufwaermfahrt (6 Min.) zaehlt nicht', K.radVorschlag({ zwiftride: true, jetzt, fahrten: [fahrt('2026-11-01T17:50:00', 6)] }).an, true);
  eq('Fahrt ohne Uhrzeit zaehlt nicht', K.radVorschlag({ zwiftride: true, jetzt, fahrten: [{ minutes: 60 }] }).an, true);
  eq('Fahrt in der Zukunft zaehlt nicht', K.radVorschlag({ zwiftride: true, jetzt, fahrten: [fahrt('2026-11-02T10:00:00', 60)] }).an, true);
  eq('Unsinn in der Liste bricht nichts', K.radVorschlag({ zwiftride: true, jetzt, fahrten: [null, {}, { zeit: 'x', minutes: 60 }] }).an, true);
}

print('\n--- Links und Rechts, Wechsel ---');
{
  // Woche 5 A: Clean je Seite, drei Saetze
  const e = K.einheit(5, 'A');
  const a = K.ablauf(e).filter(x => x.block === 1);
  const sat = a.filter(x => x.art === 'satz');
  eq('Clean: drei Saetze mal zwei Seiten', sat.length, 6);
  ok('Seiten 1,2 im Wechsel', sat.map(x => x.seite).join('') === '121212');
  const w = a.filter(x => x.art === 'pause' && x.grund === 'wechsel');
  eq('je Satz ein Handwechsel', w.length, 3);
  ok('Wechsel dauert zehn Sekunden und kuendigt Seite 2 an', w.every(x => x.sekunden === K.WECHSEL_SEKUNDEN && x.seite === 2));
  const sp = a.filter(x => x.art === 'pause' && x.grund === 'satz');
  eq('zwischen den Saetzen zwei lange Pausen', sp.length, 2);
  ok('Reihenfolge Links, Wechsel, Rechts, Pause', a.slice(0, 5).map(x => x.art === 'pause' ? x.grund : x.seite).join() === '1,wechsel,2,satz,1');
  const halo = K.ablauf(e).filter(x => x.block === 0);
  ok('Halo: zwei Richtungen ohne Wechselpause', halo.length === 2 && halo.every(x => x.art === 'satz') && halo[0].seite === 1 && halo[1].seite === 2);
  const t = K.ablauf(K.einheit(6, 'B')).filter(x => x.art === 'takt');
  ok('Takt mit Seitenwechsel: Seite folgt der Runde', t.slice(0, 4).map(x => x.seite).join('') === '1212');
  const ohne = K.ablauf(K.einheit(1, 'A')).filter(x => x.art === 'satz' && x.b.u[0] === 'hinge');
  ok('Uebung ohne Seiten: seite 0', ohne.every(x => x.seite === 0));
}

print('\n--- Umbauten ---');
{
  const rad = K.einheit(1, 'A', { rad: true });
  const a = K.ablauf(rad);
  const i = a.findIndex(x => x.art === 'umbau');
  const rest = a.slice(i - 1, i + 2);
  ok('Vom Rad zum Halo: Umbau von 90 s', rest[0].art === 'rad' && rest[1].art === 'umbau' && rest[1].arten.join() === 'rad' && rest[1].sekunden === 90 && rest[2].b.u[0] === 'halo');
  ok('Ohne Rad kein Umbau vorm Halo', K.ablauf(K.einheit(1, 'A')).findIndex(x => x.art === 'umbau') !== 0);
  eq('Der Umbau gehoert zum naechsten Baustein', rest[1].block, 1);

  const e5 = K.einheit(5, 'A');   // Halo leicht, Clean leicht, Press leicht, Goblet schwer, Rack Carry leicht
  gleichJson('ohne Zahlen: nach "schwer" und zurueck wird umgebaut', K.umbauten(e5), [[], [], [], ['kugel'], ['kugel', 'strecke']]);
  gleichJson('mit gleichem Gewicht kein Umbau', K.umbauten(e5, { clean: 12, press: 12, goblet: 12, rackcarry: 12 }).map(x => x.filter(y => y === 'kugel')), [[], [], [], [], []]);
  gleichJson('anderes Gewicht: Umbau', K.umbauten(e5, { clean: 12, press: 12, goblet: 16, rackcarry: 12 }).map(x => x.filter(y => y === 'kugel').length), [0, 0, 0, 1, 1]);
  gleichJson('Halo ohne Gewicht, Clean 12: leichte Kugel bleibt', K.umbauten(e5, { clean: 12 })[1], []);
  const u = K.ablauf(e5, { kugeln: { goblet: 16, rackcarry: 12 } }).filter(x => x.art === 'umbau');
  eq('zwei Umbauten', u.length, 2);
  ok('Kugel 90 s, Kugel mit Strecke ebenfalls 90 s', u.every(x => x.sekunden === 90));
  ok('Strecke allein ist kurz', K.ablauf(K.einheit(1, 'A')).some(x => x.art === 'umbau' && x.arten.join() === 'strecke' && x.sekunden === 30));
  ok('Umbau steht nie am Ende und nie neben einer Pause', [1, 5, 9, 12].every(w => K.TAGE.every(tg => {
    const l = K.ablauf(K.einheit(w, tg, { rad: true }), { kugeln: {} });
    return l[l.length - 1].art !== 'umbau' && l.every((x, k) => x.art !== 'umbau' || (l[k - 1].art !== 'pause'));
  })));
  ok('Die Dauer waechst um die Umbauten', K.minuten(e5, { kugeln: { goblet: 16 } }) >= K.minuten(K.einheit(5, 'A', {}), { kugeln: { goblet: 12, clean: 12, press: 12, rackcarry: 12 } }));
}

print('\n--- Erklaerung je Uebung ---');
ok('jede Uebung ausser dem Rad hat Schritte und Fehler', Object.entries(K.UEBUNGEN).filter(([id]) => id !== 'rad').every(([, u]) => u.schritte.length >= 3 && u.fehler.length >= 2));

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
