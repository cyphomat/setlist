// Ausfuehren: jsc --module-file=tests/kuttenansicht.test.js
import * as KV from '../js/kuttenansicht.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const a = (id, verdient) => ({ id, verdient });

print('\n--- Plaetze ---');
eq('zwoelf Plaetze', KV.PLAETZE.length, 12);
eq('so viele wie MAX_VORNE', KV.PLAETZE.length, KV.MAX_VORNE);
ok('alle liegen im Bild', KV.PLAETZE.every(p => p.x >= 0 && p.y >= 0 && p.x + KV.PATCH <= KV.BREITE && p.y + KV.PATCH <= KV.HOEHE));
ok('keine zwei Plaetze ueberlappen', KV.PLAETZE.every((p, i) => KV.PLAETZE.every((q, j) => i >= j || p.x + KV.PATCH <= q.x || q.x + KV.PATCH <= p.x || p.y + KV.PATCH <= q.y || q.y + KV.PATCH <= p.y)));
ok('links liegen die Plaetze auf der linken, rechts auf der rechten Haelfte', KV.PLAETZE.every(p => (p.x + KV.PATCH <= 58) || p.x >= 72));
ok('Plaetze sind ganzzahlig', KV.PLAETZE.every(p => Number.isInteger(p.x) && Number.isInteger(p.y)));

print('\n--- Hinten ---');
const h = KV.HINTEN;
ok('der Patch liegt im Bild', h.patch.x + h.patch.kante <= KV.BREITE && h.patch.y + h.patch.kante <= KV.HOEHE);
ok('die Szene liegt im Bild', h.rang.x + h.rang.b <= KV.BREITE && h.rang.y + h.rang.h <= KV.HOEHE);
ok('Rocker, Patch und Szene liegen untereinander', h.rocker.y + h.rocker.h <= h.patch.y && h.patch.y + h.patch.kante <= h.rang.y);
eq('Patch ist 48 Pixel gross (96 angezeigt)', h.patch.kante, 48);

print('\n--- Auswahl ---');
const leer = KV.vorne([]);
eq('ohne Aufnaeher leer', leer.ids.length, 0);
eq('Gesamt 0', leer.gesamt, 0);
const liste = [a('b', '2026-03-01'), a('a', '2026-05-01'), a('c', null), a('d', '2026-01-01')];
const v = KV.vorne(liste);
eq('nur Verdiente, neueste zuerst', v.ids.join(), 'a,b,d');
eq('Gesamt zaehlt die Verdienten', v.gesamt, 3);
eq('Plaetze folgen der Auswahl', v.plaetze.map(p => p.id).join(), 'a,b,d');
eq('der erste Platz ist aussen links', v.plaetze[0].x, KV.PLAETZE[0].x);
eq('gleicher Tag: nach Kennung', KV.vorne([a('z', '2026-01-01'), a('m', '2026-01-01')]).ids.join(), 'm,z');
const viele = Array.from({ length: 40 }, (_, i) => a(`p${String(i).padStart(2, '0')}`, `2026-01-${String(1 + (i % 28)).padStart(2, '0')}`));
const v2 = KV.vorne(viele);
eq('hoechstens zwoelf', v2.ids.length, 12);
eq('Gesamt bleibt 40', v2.gesamt, 40);
ok('es sind die neuesten', v2.ids.every(id => viele.find(x => x.id === id).verdient >= '2026-01-17'));
eq('ohne Bild bleibt weg, zaehlt nicht', KV.vorne(liste, x => x.id !== 'a').ids.join(), 'b,d');
eq('eigenes Maximum', KV.vorne(viele, () => true, 3).ids.length, 3);
eq('Maximum ueber den Plaetzen wird gekappt', KV.vorne(viele, () => true, 99).ids.length, 12);
ok('kaputte Eintraege stoeren nicht', KV.vorne([null, undefined, {}, a('x', '2026-01-01')]).ids.join() === 'x');
const kopie = JSON.stringify(liste);
KV.vorne(liste);
eq('die Liste bleibt unveraendert', JSON.stringify(liste), kopie);

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
