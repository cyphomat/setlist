// Ausfuehren: jsc --module-file=tests/lagerfeuer.test.js
//
// Lagerfeuer und Tagesgegner ohne Bildschirm: Lebensleiste aus den Saetzen,
// Treffer und Sieg, Combo, Lage nach dem Satz, Spruchwahl. Alle Saetze sind
// erfunden.
import * as L from '../js/lagerfeuer.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

// Wiederholbarer Zufall
let saat = 11;
const zufall = () => { saat = (saat * 16807) % 2147483647; return (saat - 1) / 2147483646; };

print('\n--- Lebensleiste ---');
const leer = [{ sets: 5, done: [] }, { sets: 5, done: [] }, { sets: 5, done: [] }];
let s = L.gegnerStand(leer);
eq('3 x 5 Saetze = 15 Segmente', s.max, 15);
eq('noch voll', s.hp, 15);
ok('noch nicht besiegt', !s.besiegt);
const zwei = [{ sets: 5, done: [5, 5] }, { sets: 5, done: [] }, { sets: 5, done: [] }];
s = L.gegnerStand(zwei);
eq('zwei Saetze, zwei Treffer', s.treffer, 2);
eq('Rest 13', s.hp, 13);
const luecke = [{ sets: 3, done: [] }];
luecke[0].done[2] = 4;                         // dritter Satz zuerst, Luecken davor
s = L.gegnerStand(luecke);
eq('Luecken im Feld zaehlen nicht', s.treffer, 1);
const fehl = [{ sets: 2, done: [3, 5] }];
s = L.gegnerStand(fehl);
ok('auch ein verfehlter Satz ist ein Treffer, am Ende ist er besiegt', s.treffer === 2 && s.besiegt);
const alle = [{ sets: 5, done: [5, 5, 5, 5, 5] }];
ok('alle Saetze: besiegt', L.gegnerStand(alle).besiegt && L.gegnerStand(alle).hp === 0);
ok('ohne Saetze nie besiegt', !L.gegnerStand([]).besiegt && !L.gegnerStand().besiegt);
eq('ohne Saetze keine Leiste', L.gegnerStand([]).max, 0);
ok('sets 0 oder fehlend bricht nichts', L.gegnerStand([{ sets: 0, done: [] }, { done: [1] }]).max === 0);

print('\n--- Wirkung ---');
eq('erster Stand: nichts', L.wirkung(null, { hp: 14 }), null);
eq('weniger HP: Treffer', L.wirkung(15, { hp: 14 }), 'treffer');
eq('0 HP: besiegt', L.wirkung(1, { hp: 0 }), 'besiegt');
eq('Satz zurueckgenommen: nichts', L.wirkung(13, { hp: 14 }), null);
eq('gleicher Stand: nichts', L.wirkung(14, { hp: 14 }), null);

print('\n--- Combo ---');
let c = 0;
c = L.comboNach(c, 5, 5); c = L.comboNach(c, 5, 5);
eq('zwei am Ziel', c, 2);
c = L.comboNach(c, 6, 5);
eq('ueber dem Ziel zaehlt auch', c, 3);
c = L.comboNach(c, 4, 5);
eq('ein verfehlter Satz setzt zurueck', c, 0);
ok('Combo erst ab zwei sichtbar', !L.comboZeigen(1) && L.comboZeigen(2));
ok('gross erst ab drei', !L.comboGross(2) && L.comboGross(3));

print('\n--- Lage nach dem Satz ---');
eq('geschafft, noch viele offen', L.lage({ reps: 5, ziel: 5, offen: 9 }), 'satz');
eq('verfehlt', L.lage({ reps: 3, ziel: 5, offen: 9 }), 'fehl');
eq('noch ein Satz', L.lage({ reps: 5, ziel: 5, offen: 1 }), 'letzter');
eq('nichts mehr offen', L.lage({ reps: 5, ziel: 5, offen: 0 }), 'fertig');
eq('verfehlt, aber der letzte Satz: fertig', L.lage({ reps: 2, ziel: 5, offen: 0 }), 'fertig');
eq('verfehlt schlaegt "noch ein Satz"', L.lage({ reps: 2, ziel: 5, offen: 1 }), 'fehl');

print('\n--- Sprueche ---');
const gueltig = k => /^lf\.s\.(satz|fehl|letzter|fertig|allg)\.\d+$/.test(k);
const art = k => k.split('.')[2], nr = k => +k.split('.')[3];
let alleGueltig = true, imBereich = true;
for (const wo of Object.keys(L.SPRUECHE)) {
  for (let i = 0; i < 60; i++) {
    const k = L.spruchSchluessel(wo, zufall);
    if (!gueltig(k)) alleGueltig = false;
    if (nr(k) < 1 || nr(k) > L.SPRUECHE[art(k)]) imBereich = false;
  }
}
ok('Schluessel haben die erwartete Form', alleGueltig);
ok('Nummern liegen in 1..Anzahl', imBereich);
ok('Randwerte des Zufalls bleiben im Pool', gueltig(L.spruchSchluessel('satz', () => 0)) && gueltig(L.spruchSchluessel('satz', () => 0.999999)));
ok('unbekannte Lage faellt auf allgemein', art(L.spruchSchluessel('gibtsnicht', zufall)) === 'allg');
let nurFehl = true;
for (let i = 0; i < 40; i++) if (art(L.spruchSchluessel('fehl', zufall)) !== 'fehl') nurFehl = false;
ok('nach einem Fehlsatz kein Loblied', nurFehl);
const arten = new Set();
for (let i = 0; i < 80; i++) arten.add(art(L.spruchSchluessel('satz', zufall)));
ok('im Alltag mischt sich Allgemeines unter', arten.has('satz') && arten.has('allg') && arten.size === 2);

print('\n--- Gegner des Tages ---');
eq('sieben Gegner', L.GEGNER.length, 7);
ok('Namen und Farben verschieden', new Set(L.GEGNER.map(g => g.schluessel)).size === 7 && new Set(L.GEGNER.map(g => g.farbe)).size === 7);
eq('Sonntag ist der erste', L.gegnerAn(new Date(2026, 10, 1)).schluessel, 'lf.boss.0');   // 1.11.2026 ist ein Sonntag
eq('Montag der zweite', L.gegnerAn(new Date(2026, 10, 2)).schluessel, 'lf.boss.1');
eq('Samstag der letzte', L.gegnerAn(new Date(2026, 10, 7)).schluessel, 'lf.boss.6');

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
