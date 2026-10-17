// Ausfuehren: jsc --module-file=tests/lokal.test.js
// Die lokale Ablage mit einer Map statt IndexedDB — dieselben Funktionen.
import * as L from '../js/lokal.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

L.setzeSpeicher(L.mapSpeicher());

print('\n--- Lesen und Schreiben ---');
eq('leer: nichts da', await L.lies('config.json'), null);
const w = await L.schreib('config.json', { bar: 20 });
eq('Antwort wie bei GitHub', w.content.sha, 'l1');
const c = await L.lies('config.json');
eq('gelesen', c.data.bar, 20);
eq('sha', c.sha, 'l1');
c.data.bar = 99;
eq('Lesen gibt eine Kopie', (await L.lies('config.json')).data.bar, 20);
const roh = { bar: 15 };
await L.schreib('config.json', roh);
roh.bar = 0;
eq('Schreiben speichert eine Kopie', (await L.lies('config.json')).data.bar, 15);
eq('sha zaehlt hoch', (await L.lies('config.json')).sha, 'l2');

print('\n--- Liste und alles ---');
await L.schreib('einheiten/2026-10-02.json', { date: '2026-10-02' });
await L.schreib('einheiten/2026-10-01.json', { date: '2026-10-01' });
await L.schreib('soundcheck/2026-W40.json', { woche: '2026-W40' });
eq('Ordner sortiert', (await L.liste('einheiten/')).map(f => f.path).join(','), 'einheiten/2026-10-01.json,einheiten/2026-10-02.json');
eq('mit sha', (await L.liste('soundcheck/'))[0].sha, 'l1');
eq('alles', (await L.alle()).length, 4);
eq('alles mit Inhalt', (await L.alle()).find(f => f.path === 'einheiten/2026-10-01.json').data.date, '2026-10-01');

print('\n--- Leeren ---');
await L.leeren();
eq('weg', (await L.alle()).length, 0);
eq('neu anfangen: sha wieder 1', (await L.schreib('config.json', {})).content.sha, 'l1');

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
