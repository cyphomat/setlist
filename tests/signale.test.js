// Ausfuehren: node tools/tests.mjs
//
// Tests fuer js/signale.js — jedes Signal ist eindeutig, jeder Schritt hat eines.
import * as SG from '../js/signale.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

print('--- Zuordnung ---');
eq('Satz', SG.art({ art: 'satz' }), 'satz');
eq('Takt, erste Runde', SG.art({ art: 'takt', nr: 1 }), 'takt');
eq('Takt, spaetere Runde', SG.art({ art: 'takt', nr: 2 }), 'taktKurz');
eq('Takt mit Seitenwechsel', SG.art({ art: 'takt', nr: 2, seite: 2 }), 'takt');
eq('Zeit', SG.art({ art: 'zeit' }), 'zeit');
eq('Umbau', SG.art({ art: 'umbau' }), 'umbau');
eq('Rad locker', SG.art({ art: 'rad', phase: 'locker' }), 'locker');
eq('Rad Antritt', SG.art({ art: 'rad', phase: 'antritt' }), 'antritt');
eq('Pause', SG.art({ art: 'pause', grund: 'satz' }), 'pause');
eq('Handwechsel links', SG.art({ art: 'pause', grund: 'wechsel', seite: 1 }), 'links');
eq('Handwechsel rechts', SG.art({ art: 'pause', grund: 'wechsel', seite: 2 }), 'rechts');
eq('Ende', SG.art({ art: 'ende' }), 'ende');
eq('unbekannt', SG.art({ art: 'x' }), null);
eq('leer', SG.signal(null), null);

print('--- Jedes Signal ist eindeutig ---');
const alle = [
  { art: 'satz' }, { art: 'takt', nr: 1 }, { art: 'takt', nr: 2 }, { art: 'zeit' },
  { art: 'pause', grund: 'satz' }, { art: 'pause', grund: 'wechsel', seite: 1 }, { art: 'pause', grund: 'wechsel', seite: 2 },
  { art: 'umbau' }, { art: 'rad', phase: 'locker' }, { art: 'rad', phase: 'antritt' }, { art: 'ende' },
].map(SG.signal);
ok('alle 11 gefunden', alle.every(Boolean) && alle.length === 11);
ok('Ton und Vibration zusammen sind eindeutig', new Set(alle.map(s => JSON.stringify([s.ton, s.vib]))).size === 11);
ok('Toene sind hoerbar (200–2000 Hz)', alle.every(s => s.ton.every(f => f >= 200 && f <= 2000)));
ok('Vibration: alle Glieder positiv', alle.every(s => s.vib.every(v => v > 0)));
ok('Legende nennt jede Art', SG.ARTEN.every(k => alle.some(s => s.art === k)));

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
