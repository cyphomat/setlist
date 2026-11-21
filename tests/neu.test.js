// Ausfuehren: jsc --module-file=tests/neu.test.js
import * as N from '../js/neu.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

const e = (v, de = ['a'], en = ['b']) => ({ v, de, en });
const L = [e('2026-11-21.3'), e('2026-11-21.2'), e('2026-11-20.1'), e('2026-10-01.9')];

print('\n--- Die echten Eintraege ---');
ok('es gibt Eintraege', N.NEU.length > 0);
const f = N.pruefe();
ok('sie bestehen die Pruefung', f.length === 0, f.join('; '));

print('\n--- Die Pruefung ---');
ok('gute Liste besteht', N.pruefe(L).length === 0);
ok('falsche Versionsform', N.pruefe([e('gestern')]).length > 0);
ok('nicht absteigend', N.pruefe([e('2026-11-21.1'), e('2026-11-21.2')]).length > 0);
ok('gleiche Version zweimal', N.pruefe([e('2026-11-21.1'), e('2026-11-21.1')]).length > 0);
ok('Englisch fehlt', N.pruefe([{ v: '2026-11-21.1', de: ['a'] }]).length > 0);
ok('leere Zeile', N.pruefe([e('2026-11-21.1', [' '], ['b'])]).length > 0);
ok('zu lange Zeile', N.pruefe([e('2026-11-21.1', ['x'.repeat(N.MAX_LAENGE + 1)], ['b'])]).length > 0);
ok('de und en verschieden lang', N.pruefe([e('2026-11-21.1', ['a', 'b'], ['a'])]).length > 0);

print('\n--- Was seit dem letzten Besuch neu ist ---');
eq('nichts neu: gleicher Stand', N.seit('2026-11-21.3', '2026-11-21.3', 3, L).length, 0);
eq('eine Auslieferung neu', N.seit('2026-11-21.2', '2026-11-21.3', 3, L).length, 1);
eq('und es ist die neueste', N.seit('2026-11-21.2', '2026-11-21.3', 3, L)[0].v, '2026-11-21.3');
eq('mehrere, neueste zuerst', N.seit('2026-11-20.1', '2026-11-21.3', 3, L).map(x => x.v).join(), '2026-11-21.3,2026-11-21.2');
eq('nie gesehen (null): alle bis zur Grenze', N.seit(null, '2026-11-21.3', 3, L).length, 3);
eq('die Grenze begrenzt', N.seit(null, '2026-11-21.3', 2, L).length, 2);
eq('leere Zeichenkette gilt wie nie gesehen', N.seit('', '2026-11-21.3', 9, L).length, 4);
eq('was neuer ist als die laufende Version, kommt nicht vor', N.seit('2026-11-20.1', '2026-11-21.2', 3, L).map(x => x.v).join(), '2026-11-21.2');
eq('.10 liegt nach .9, nicht davor', N.seit('2026-11-21.9', '2026-11-21.10', 3, [e('2026-11-21.10'), e('2026-11-21.9')]).length, 1);

print('\n--- Gesehen pro Geraet ---');
const speicher = new Map();
globalThis.localStorage = { getItem: k => (speicher.has(k) ? speicher.get(k) : null), setItem: (k, v) => speicher.set(k, String(v)) };
eq('anfangs null', N.gesehen(), null);
N.setzeGesehen('2026-11-21.3');
eq('gemerkt', N.gesehen(), '2026-11-21.3');
globalThis.localStorage = { getItem() { throw new Error('gesperrt'); }, setItem() { throw new Error('gesperrt'); } };
eq('gesperrter Speicher: null statt Absturz', N.gesehen(), null);
N.setzeGesehen('x');
ok('Schreiben ohne Absturz', true);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
