// Ausfuehren: jsc --module-file=tests/persoenlich.test.js
import * as PS from '../js/persoenlich.js';
import { WARMUP } from '../js/content.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleich = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b),
  `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

print('\n--- Zeilen aus Text ---');
gleich('einfache Liste', PS.zeilenAusText('eins\nzwei'), ['eins', 'zwei']);
gleich('leere Zeilen fliegen raus', PS.zeilenAusText('eins\n\n  \nzwei'), ['eins', 'zwei']);
gleich('Leerraum am Rand faellt weg', PS.zeilenAusText('  eins  '), ['eins']);
gleich('leerer Text', PS.zeilenAusText(''), []);
gleich('null', PS.zeilenAusText(null), []);
eq('und zurueck', PS.textAusZeilen(['a', 'b']), 'a\nb');
eq('zurueck aus nichts', PS.textAusZeilen(null), '');

print('\n--- Stimme bauen ---');
gleich('aus Text wird alle', PS.baueStimme('eins\nzwei'), { sprueche: { alle: ['eins', 'zwei'] } });
eq('ohne Zeilen kommt null', PS.baueStimme('   '), null);
eq('ohne Zeilen und ohne Vorhandenes ebenfalls', PS.baueStimme('', null), null);

// Wer die Datei von Hand nach Situation aufgeteilt hat, darf das nicht
// dadurch verlieren, dass er im Textfeld etwas aendert.
const vonHand = { sprueche: { comeback: ['zurueck'], alle: ['alt'] } };
gleich('nach Situation getrennte Zeilen bleiben',
  PS.baueStimme('neu', vonHand), { sprueche: { comeback: ['zurueck'], alle: ['neu'] } });
gleich('und ueberleben auch ein geleertes Textfeld',
  PS.baueStimme('', vonHand), { sprueche: { comeback: ['zurueck'] } });
gleich('nur alle, geleert, ergibt null', PS.baueStimme('', { sprueche: { alle: ['weg'] } }), null);

print('\n--- Eigene Zeilen zurueck ins Feld ---');
eq('aus alle', PS.eigeneZeilen({ sprueche: { alle: ['a', 'b'] } }), 'a\nb');
eq('ohne Datei', PS.eigeneZeilen(null), '');
eq('ohne sprueche', PS.eigeneZeilen({}), '');
eq('nur situationsbezogene Zeilen zeigt das Feld nicht',
  PS.eigeneZeilen({ sprueche: { comeback: ['x'] } }), '');

print('\n--- Rekorde bauen ---');
const bau = e => PS.baueRekorde(e);
gleich('vollstaendiger Eintrag',
  bau([{ id: 'squat', datum: '2021-03-04', bestesEinzel: '140', bestes5er: '120' }]),
  { squat: { datum: '2021-03-04', bestesEinzel: 140, bestes5er: 120 } });
gleich('ohne Datum bleibt das Gewicht erhalten',
  bau([{ id: 'squat', datum: '', bestesEinzel: '140', bestes5er: '' }]),
  { squat: { bestesEinzel: 140 } });
// Ein Datum allein ist keine Bestleistung — sonst stuende ein Jahrestag im
// Kalender, zu dem es nichts zu sagen gibt.
gleich('Datum ohne Gewicht faellt weg', bau([{ id: 'squat', datum: '2021-03-04' }]), {});
gleich('leerer Eintrag faellt weg', bau([{ id: 'squat', bestesEinzel: '', bestes5er: '' }]), {});
gleich('null als Gewicht faellt weg', bau([{ id: 'squat', bestesEinzel: '0' }]), {});
gleich('unsinniges Gewicht faellt weg', bau([{ id: 'squat', bestesEinzel: 'schwer' }]), {});
gleich('halbes Datum wird verworfen, Gewicht bleibt',
  bau([{ id: 'squat', datum: '2021-03', bestesEinzel: '140' }]), { squat: { bestesEinzel: 140 } });
gleich('Eintrag ohne Kennung faellt weg', bau([{ bestesEinzel: '100' }]), {});
gleich('nichts ergibt nichts', bau([]), {});
gleich('undefined ergibt nichts', bau(undefined), {});
eq('Kommagewichte kommen als Zahl an',
  bau([{ id: 'ohp', bestesEinzel: '52.5' }]).ohp.bestesEinzel, 52.5);

print('\n--- Entwurf aus der Konfiguration ---');
const config = {
  lifts: { squat: { name: 'Back Squat' }, bench: { name: 'Bench Press' } },
  records: { programm: { squat: { datum: '2021-03-04', bestesEinzel: 140 } }, quelle: 'altes Logbuch' }
};
const entwurf = PS.rekordEntwurf(config);
eq('eine Zeile je Uebung', entwurf.length, 2);
eq('Name aus config', entwurf[0].name, 'Back Squat');
eq('vorhandener Wert wird uebernommen', entwurf[0].bestesEinzel, 140);
eq('fehlender Wert ist leer, nicht undefined', entwurf[0].bestes5er, '');
eq('Uebung ohne Rekord bleibt leer', entwurf[1].datum, '');
eq('leere Konfiguration kippt nicht', PS.rekordEntwurf(null).length, 0);
eq('Konfiguration ohne lifts', PS.rekordEntwurf({}).length, 0);

print('\n--- In die Konfiguration einsetzen ---');
const basis = { bar: 20, lifts: { squat: { name: 'Back Squat' } } };
const mit = PS.setzeInConfig(basis, { grund: '  Damit ich alt werde  ', rekorde: { squat: { bestesEinzel: 140 } } });
eq('Grund wird beschnitten gesetzt', mit.ziele.warum, 'Damit ich alt werde');
eq('Rekorde landen unter programm', mit.records.programm.squat.bestesEinzel, 140);
eq('der Rest bleibt unangetastet', mit.bar, 20);
ok('die Vorlage wird nicht veraendert', basis.ziele === undefined);

const ohne = PS.setzeInConfig(mit, { grund: '', rekorde: {} });
ok('leerer Grund entfernt ziele ganz', ohne.ziele === undefined);
ok('leere Rekorde entfernen records ganz', ohne.records === undefined);

// Was daneben in denselben Bloecken steht, gehoert nicht der Oberflaeche.
const mitFremd = { ...basis,
  ziele: { warum: 'alt', sonstiges: 'bleibt' },
  records: { programm: { squat: { bestesEinzel: 1 } }, quelle: 'Logbuch', weitere: [{ name: 'Fran' }] } };
const gemischt = PS.setzeInConfig(mitFremd, { grund: 'neu', rekorde: { squat: { bestesEinzel: 2 } } });
eq('anderes unter ziele bleibt', gemischt.ziele.sonstiges, 'bleibt');
eq('quelle bleibt', gemischt.records.quelle, 'Logbuch');
eq('weitere Bestleistungen bleiben', gemischt.records.weitere.length, 1);
eq('programm wurde ersetzt', gemischt.records.programm.squat.bestesEinzel, 2);

const geleert = PS.setzeInConfig(mitFremd, { grund: '', rekorde: {} });
eq('records bleibt, weil quelle und weitere drin sind', geleert.records.quelle, 'Logbuch');
ok('nur programm ist weg', geleert.records.programm === undefined);
eq('ziele bleibt, weil sonstiges drin ist', geleert.ziele.sonstiges, 'bleibt');
ok('nur warum ist weg', geleert.ziele.warum === undefined);

print('\n--- Kadenz-Ziel ---');
eq('Vorgabe 80', PS.kadenzZiel({}), 80);
eq('eingetragen', PS.kadenzZiel({ rad: { kadenzZiel: 85 } }), 85);
eq('Unsinn: Vorgabe', PS.kadenzZiel({ rad: { kadenzZiel: '<b>' } }), 80);
eq('zu hoch: Vorgabe', PS.kadenzZiel({ rad: { kadenzZiel: 300 } }), 80);
eq('setzen', PS.setzeKadenzZiel({ bar: 20 }, '90').rad.kadenzZiel, 90);
ok('Rest bleibt', PS.setzeKadenzZiel({ bar: 20 }, '90').bar === 20);
ok('leeren nimmt rad heraus', !('rad' in PS.setzeKadenzZiel({ rad: { kadenzZiel: 90 } }, '')));
eq('Unsinn wird nicht gespeichert', PS.kadenzZiel(PS.setzeKadenzZiel({}, '40')), 80);

print('\n--- Warm-up-Einstieg ---');
eq('ohne Eintrag null', PS.einstieg({}), null);
eq('ohne Config null', PS.einstieg(null), null);
gleich('gueltig', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 15 } } }), { art: 'Rudern', minuten: 15 });
gleich('Leerraum faellt weg', PS.einstieg({ warmup: { einstieg: { art: '  Rudern ', minuten: 15 } } }), { art: 'Rudern', minuten: 15 });
eq('Art kein Text', PS.einstieg({ warmup: { einstieg: { art: 5, minuten: 15 } } }), null);
eq('Art leer', PS.einstieg({ warmup: { einstieg: { art: '  ', minuten: 15 } } }), null);
eq('Art zu lang', PS.einstieg({ warmup: { einstieg: { art: 'x'.repeat(41), minuten: 15 } } }), null);
ok('Art genau 40 geht', PS.einstieg({ warmup: { einstieg: { art: 'x'.repeat(40), minuten: 15 } } }) !== null);
eq('Minuten 0', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 0 } } }), null);
eq('Minuten 61', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 61 } } }), null);
ok('Minuten 1 geht', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 1 } } }) !== null);
ok('Minuten 60 geht', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 60 } } }) !== null);
eq('Minuten Unsinn', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: '<b>' } } }), null);
eq('Minuten Kommazahl', PS.einstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 7.5 } } }), null);
gleich('setzen', PS.setzeEinstieg({ bar: 20 }, 'Rudern', '15').warmup, { einstieg: { art: 'Rudern', minuten: 15 } });
ok('Rest bleibt', PS.setzeEinstieg({ bar: 20 }, 'Rudern', '15').bar === 20);
ok('Eingabe bleibt unveraendert', (() => { const c = { bar: 20 }; PS.setzeEinstieg(c, 'Rudern', 15); return !('warmup' in c); })());
ok('leere Art nimmt warmup heraus', !('warmup' in PS.setzeEinstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 15 } } }, '', '15')));
ok('leere Minuten nehmen warmup heraus', !('warmup' in PS.setzeEinstieg({ warmup: { einstieg: { art: 'Rudern', minuten: 15 } } }, 'Rudern', '')));
ok('Unsinn wird nicht gespeichert', !('warmup' in PS.setzeEinstieg({}, 'Rudern', '999')));
gleich('anderes in warmup bleibt', PS.setzeEinstieg({ warmup: { sonst: 1, einstieg: { art: 'a', minuten: 2 } } }, '', '').warmup, { sonst: 1 });

const liste = [{ t: '3 Min', was: 'Rudergerät', detail: 'x' }, { t: '10x', was: 'Hüfte', detail: 'y' }];
gleich('ohne Einstieg unveraendert', PS.warmupZeilen(liste, {}, 'd'), liste);
gleich('ersetzt nur die erste Zeile', PS.warmupZeilen(liste, { warmup: { einstieg: { art: 'Rudern', minuten: 15 } } }, 'Dein Einstieg'),
  [{ t: '15 Min', sek: 900, was: 'Rudern', detail: 'Dein Einstieg' }, liste[1]]);
eq('Eigener Einstieg bringt die Dauer in Sekunden mit', PS.warmupZeilen(liste, { warmup: { einstieg: { art: 'Rudern', minuten: 7 } } }, 'd')[0].sek, 420);
eq('Vorgabe ohne Einstieg behaelt ihre Dauer', PS.warmupZeilen([{ t: '3 Min', sek: 180, was: 'x', detail: 'y' }], {}, 'd')[0].sek, 180);
eq('Laenge bleibt gleich', PS.warmupZeilen(liste, { warmup: { einstieg: { art: 'Rudern', minuten: 15 } } }, 'd').length, 2);
eq('Art wird maskiert', PS.warmupZeilen(liste, { warmup: { einstieg: { art: '<b>x</b>', minuten: 5 } } }, 'd', s => s.replace(/</g, '&lt;'))[0].was, '&lt;b>x&lt;/b>');
gleich('leere Liste', PS.warmupZeilen([], { warmup: { einstieg: { art: 'Rudern', minuten: 15 } } }, 'd'), []);
gleich('keine Liste', PS.warmupZeilen(undefined, {}, 'd'), []);

print('\n--- Eigener Name (zusammen trainieren) ---');
eq('ohne Eintrag null', PS.eigenerName({}), null);
eq('ohne Config null', PS.eigenerName(null), null);
eq('eingetragen', PS.eigenerName({ name: 'Daniel' }), 'Daniel');
eq('Leerraum faellt weg', PS.eigenerName({ name: '  Daniel ' }), 'Daniel');
eq('Unsinn: kein Text', PS.eigenerName({ name: { x: 1 } }), null);
eq('zu lang wird gekuerzt', PS.eigenerName({ name: 'x'.repeat(40) }).length, 24);
eq('setzen', PS.setzeName({ bar: 20 }, 'Daniel').name, 'Daniel');
ok('Rest bleibt', PS.setzeName({ bar: 20 }, 'Daniel').bar === 20);
ok('Eingabe bleibt unveraendert', (() => { const c = { bar: 20 }; PS.setzeName(c, 'D'); return !('name' in c); })());
ok('leer nimmt ihn heraus', !('name' in PS.setzeName({ name: 'Daniel' }, '  ')));
eq('Steuerzeichen raus', PS.setzeName({}, 'Da\u202eniel').name, 'Da niel');

print('\n--- Warm-up: Dauer je Zeile ---');
const alleZeilen = [...WARMUP.allgemein, ...WARMUP.A, ...WARMUP.B, ...WARMUP.rumpf];
ok('jede Dauer ist eine positive ganze Zahl', alleZeilen.every(z => z.sek === undefined || (Number.isInteger(z.sek) && z.sek > 0)));
ok('die Dauer passt zur Zeit im Text', alleZeilen.filter(z => z.sek).every(z => {
  const m = /(\d+) (Min|Sek)/.exec(z.t);
  return m && Number(m[1]) * (m[2] === 'Min' ? 60 : 1) === z.sek;
}));
eq('Cardio-Zeile hat 180 Sekunden', WARMUP.allgemein[0].sek, 180);
eq('Seitstuetz haelt 20 Sekunden', WARMUP.rumpf[1].sek, 20);
eq('Curl-up haelt 8 Sekunden', WARMUP.rumpf[2].sek, 8);

print('\n--- Abend-Check-in: die Frage ---');
{
  eq('Frage wird gesetzt', PS.setzeCheckin({}, 'Eiweiss getroffen?').ziele.checkin, 'Eiweiss getroffen?');
  eq('Leerraum faellt weg', PS.setzeCheckin({}, '  Eiweiss   getroffen? \n').ziele.checkin, 'Eiweiss getroffen?');
  eq('lange Fragen werden gekappt', PS.setzeCheckin({}, 'x'.repeat(200)).ziele.checkin.length, PS.CHECKIN_MAX);
  gleich('andere Ziele bleiben', PS.setzeCheckin({ ziele: { warum: 'Kinder' } }, 'Ja?').ziele, { warum: 'Kinder', checkin: 'Ja?' });
  gleich('leer entfernt nur die Frage', PS.setzeCheckin({ ziele: { warum: 'Kinder', checkin: 'Ja?' } }, '').ziele, { warum: 'Kinder' });
  eq('leer entfernt die leere Huelle', PS.setzeCheckin({ ziele: { checkin: 'Ja?' } }, '  ').ziele, undefined);
  const alt = { ziele: { warum: 'x' } };
  PS.setzeCheckin(alt, 'Neu?');
  gleich('das Original bleibt unberuehrt', alt, { ziele: { warum: 'x' } });
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
