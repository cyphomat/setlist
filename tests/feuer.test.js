// Ausfuehren: jsc --module-file=tests/feuer.test.js
//
// Das Pixelfeuer ohne Bildschirm: Palette, Glut unten, Abkuehlung nach
// oben, Ausbrennen nach stop.
import * as F from '../js/feuer.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

// Wiederholbarer Zufall
let saat = 7;
const zufall = () => { saat = (saat * 16807) % 2147483647; return (saat - 1) / 2147483646; };

print('\n--- Palette ---');
eq('37 Stufen', F.PALETTE.length, 37);
eq('kalt ist durchsichtig', F.PALETTE[0][3], 0);
eq('heiss ist weiss', F.PALETTE[F.HEISS].join(), '255,255,255,255');
ok('jede Stufe hat vier Werte 0..255', F.PALETTE.every(c => c.length === 4 && c.every(v => v >= 0 && v <= 255)));
ok('Deckkraft steigt nie ab', F.PALETTE.every((c, i) => i === 0 || c[3] >= F.PALETTE[i - 1][3]));

print('\n--- Brennen ---');
const f = F.feld(40, 20);
for (let i = 0; i < 30; i++) F.schritt(f, true, 2, zufall);
const reihe = y => { let s = 0; for (let x = 0; x < f.w; x++) s += f.px[y * f.w + x]; return s / f.w; };
ok('unten glueht es fast voll', reihe(f.h - 1) >= F.HEISS - 4, String(reihe(f.h - 1)));
ok('nach oben kuehlt es ab', reihe(f.h - 1) > reihe(f.h - 8) && reihe(f.h - 8) >= reihe(2), [reihe(f.h - 1), reihe(f.h - 8), reihe(2)].join(' > '));
ok('nie ueber die heisseste Stufe', f.px.every(v => v <= F.HEISS));

print('\n--- Ausgehen ---');
let glueht = true, schritte = 0;
while (glueht && schritte < 500) { glueht = F.schritt(f, false, 2, zufall); schritte++; }
ok('ohne Nachlegen brennt es aus', !glueht, String(schritte));
ok('und zwar zuegig', schritte < 120, String(schritte));
ok('alles kalt', f.px.every(v => v === 0));

print('\n--- Ohne Bildschirm ---');
const leer = F.feuer(null);
let geworfen = false;
try { leer.start(); leer.stop(); } catch { geworfen = true; }
ok('ohne Canvas kein Fehler', !geworfen);
ok('und nicht an', !leer.an);
ok('ruhig() ohne matchMedia: false', F.ruhig() === false);

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
