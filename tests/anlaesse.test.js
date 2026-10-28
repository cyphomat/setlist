// Ausfuehren: jsc --module-file=tests/anlaesse.test.js
//
// Anlaesse: welcher Banner gilt an welchem Tag. Reine Logik, dazu die
// Einstellung auf dem Geraet und die Texte in beiden Sprachen.
const speicher = new Map();
globalThis.localStorage = {
  getItem: k => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k),
  get length() { return speicher.size; },
  key: i => [...speicher.keys()][i] ?? null
};
globalThis.document = { documentElement: {}, querySelectorAll: () => [] };
const AN = await import('../js/anlaesse.js');
const I = await import('../js/i18n.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

print('\n--- Ostern (Gauss) ---');
eq('Ostersonntag 2026', AN.ostern(2026), '2026-04-05');
eq('Ostersonntag 2027', AN.ostern(2027), '2027-03-28');
eq('Ostersonntag 2028', AN.ostern(2028), '2028-04-16');
eq('Gruendonnerstag 2026', AN.datum({ ostern: -3 }, 2026), '2026-04-02');
eq('Ostermontag 2026', AN.datum({ ostern: 1 }, 2026), '2026-04-06');
eq('Gruendonnerstag 2027 liegt im Maerz', AN.datum({ ostern: -3 }, 2027), '2027-03-25');

print('\n--- Regeln ---');
eq('fix', AN.datum({ fix: [12, 28] }, 2026), '2026-12-28');
eq('fix: 29.2. im Nichtschaltjahr wird 28.2.', AN.datum({ fix: [2, 29] }, 2027), '2027-02-28');
eq('fix: 29.2. im Schaltjahr bleibt', AN.datum({ fix: [2, 29] }, 2028), '2028-02-29');
eq('nth: letzter Freitag im Oktober 2026', AN.datum({ nth: { monat: 10, wochentag: 5, n: -1 } }, 2026), '2026-10-30');
eq('nth: letzter Freitag im November 2026', AN.datum({ nth: { monat: 11, wochentag: 5, n: -1 } }, 2026), '2026-11-27');
eq('nth: erster Montag im Maerz 2026', AN.datum({ nth: { monat: 3, wochentag: 1, n: 1 } }, 2026), '2026-03-02');
eq('nth: vierter Donnerstag im November 2026', AN.datum({ nth: { monat: 11, wochentag: 4, n: 4 } }, 2026), '2026-11-26');
eq('nth: einen fuenften Freitag gibt es nicht immer', AN.datum({ nth: { monat: 2, wochentag: 5, n: 5 } }, 2026), null);
eq('einmalig: im richtigen Jahr', AN.datum({ datum: '2027-06-05' }, 2027), '2027-06-05');
eq('einmalig: in einem anderen Jahr nichts', AN.datum({ datum: '2027-06-05' }, 2028), null);
eq('ohne Regel nichts', AN.datum(null, 2026), null);
eq('unbekannte Regel nichts', AN.datum({ foo: 1 }, 2026), null);
eq('plusTage ueber den Monatswechsel', AN.plusTage('2026-12-31', 1), '2027-01-01');

print('\n--- Phasen ---');
const weih = AN.finde('weihnachten');
ok('Weihnachten gibt es', !!weih);
eq('30.11. noch nicht', AN.trifft(weih, '2026-11-30'), false);
eq('1.12. beginnt', AN.trifft(weih, '2026-12-01'), true);
eq('24.12. mittendrin', AN.trifft(weih, '2026-12-24'), true);
eq('26.12. letzter Tag', AN.trifft(weih, '2026-12-26'), true);
eq('27.12. vorbei', AN.trifft(weih, '2026-12-27'), false);
const wechsel = { id: 'x', typ: 'phase', von: { fix: [12, 20] }, bis: { fix: [1, 5] } };
eq('Jahreswechsel: 19.12. nein', AN.trifft(wechsel, '2026-12-19'), false);
eq('Jahreswechsel: 31.12. ja', AN.trifft(wechsel, '2026-12-31'), true);
eq('Jahreswechsel: 3.1. ja', AN.trifft(wechsel, '2027-01-03'), true);
eq('Jahreswechsel: 5.1. ja', AN.trifft(wechsel, '2027-01-05'), true);
eq('Jahreswechsel: 6.1. nein', AN.trifft(wechsel, '2027-01-06'), false);
const osterZeit = { id: 'o', typ: 'phase', von: { ostern: -3 }, bis: { ostern: 1 } };
eq('Osterphase 2026: 1.4. nein', AN.trifft(osterZeit, '2026-04-01'), false);
eq('Osterphase 2026: 2.4. ja', AN.trifft(osterZeit, '2026-04-02'), true);
eq('Osterphase 2026: 6.4. ja', AN.trifft(osterZeit, '2026-04-06'), true);
eq('Osterphase 2026: 7.4. nein', AN.trifft(osterZeit, '2026-04-07'), false);
eq('Osterphase 2027 beginnt im Maerz', AN.trifft(osterZeit, '2027-03-25'), true);
eq('Phase ohne Enddatum trifft nie', AN.trifft({ id: 'k', typ: 'phase', von: { fix: [1, 1] } }, '2026-01-01'), false);

print('\n--- Rang ---');
const phase = { id: 'p', typ: 'phase', von: { fix: [12, 1] }, bis: { fix: [12, 31] } };
const tag = { id: 't', typ: 'tag', regel: { fix: [12, 28] } };
const gedenk = { id: 'g', typ: 'gedenk', regel: { fix: [12, 28] } };
eq('nur Phase', AN.fuer('2026-12-28', [phase]).id, 'p');
eq('Einzeltag vor Phase', AN.fuer('2026-12-28', [phase, tag]).id, 't');
eq('Gedenktag vor Einzeltag und Phase', AN.fuer('2026-12-28', [phase, tag, gedenk]).id, 'g');
eq('Reihenfolge der Liste ist egal', AN.fuer('2026-12-28', [gedenk, tag, phase]).id, 'g');
eq('ein anderer Tag: wieder die Phase', AN.fuer('2026-12-29', [phase, tag, gedenk]).id, 'p');
eq('nichts los', AN.fuer('2026-10-28', [phase, tag, gedenk]), null);
eq('unbekannter Typ wird uebergangen', AN.fuer('2026-12-28', [{ id: 'z', typ: 'quatsch', regel: { fix: [12, 28] } }]), null);
eq('leere Liste', AN.fuer('2026-12-28', []), null);
eq('Mitte November: kein Banner', AN.fuer('2026-11-15'), null);
eq('Anfang Februar: kein Banner', AN.fuer('2027-02-02'), null);
eq('heutiger Stand: 1.12.2026 Weihnachten', AN.fuer('2026-12-01').id, 'weihnachten');

print('\n--- Halloween, Ostern, Gedenktage (die echten Daten) ---');
eq('Halloween: 23.10. noch nicht', AN.fuer('2026-10-23'), null);
eq('Halloween: 24.10. beginnt', AN.fuer('2026-10-24').id, 'halloween');
eq('Halloween: 28.10.2026 (heute) mittendrin', AN.fuer('2026-10-28').id, 'halloween');
eq('Halloween: 31.10. letzter Tag', AN.fuer('2026-10-31').id, 'halloween');
eq('Halloween: 1.11. vorbei', AN.fuer('2026-11-01'), null);
eq('Ostern 2026: 1.4. nichts', AN.fuer('2026-04-01'), null);
eq('Ostern 2026: Gruendonnerstag 2.4.', AN.fuer('2026-04-02').id, 'ostern');
eq('Ostern 2026: Ostersonntag 5.4.', AN.fuer('2026-04-05').id, 'ostern');
eq('Ostern 2026: Ostermontag 6.4.', AN.fuer('2026-04-06').id, 'ostern');
eq('Ostern 2026: Dienstag 7.4. vorbei', AN.fuer('2026-04-07'), null);
eq('Ostern 2027: Gruendonnerstag liegt im Maerz', AN.fuer('2027-03-25').id, 'ostern');
eq('Ostern 2028: Ostermontag 17.4.', AN.fuer('2028-04-17').id, 'ostern');
eq('Lemmy am 28.12.', AN.fuer('2026-12-28').id, 'lemmy');
eq('Ozzy am 22.7.', AN.fuer('2026-07-22').id, 'ozzy');
eq('Lemmy ist ein Gedenktag', AN.finde('lemmy').typ, 'gedenk');
eq('Ozzy ist ein Gedenktag', AN.finde('ozzy').typ, 'gedenk');
eq('Gedenktag hat genau ein Motiv: die Kerze', AN.finde('lemmy').bild.join(), 'kerze');
eq('Tag nach Lemmy: nichts', AN.fuer('2026-12-29'), null);
ok('kein Gedenktag liegt in einer Phase (sonst haette der Rang etwas zu tun)',
  AN.STANDARD.filter(a => a.typ === 'gedenk').every(g => { const iso = AN.datum(g.regel, 2026); return AN.STANDARD.filter(a => a.typ === 'phase' && AN.trifft(a, iso)).length === 0; }));
ok('Gedenktag wuerde auch mitten in einer Phase gewinnen',
  AN.fuer('2026-12-28', [...AN.STANDARD, { id: 'x', typ: 'phase', von: { fix: [12, 1] }, bis: { fix: [12, 31] }, bild: ['ei'], saetze: 1 }]).id === 'lemmy');
ok('jedes Motiv wird von einem Anlass benutzt', AN.MOTIVE.every(m => AN.STANDARD.some(a => a.bild.includes(m))));

print('\n--- Texte ---');
eq('Halloween hat vier Saetze', AN.finde('halloween').saetze, 4);
eq('Gedenktag: ein Satz, kein Wechsel', AN.schluessel(AN.finde('ozzy'), '2026-07-22').satz, 'anl.ozzy.satz');
eq('Satz nach Tag des Monats (1.)', AN.schluessel(weih, '2026-12-01').satz, 'anl.weihnachten.s2');
eq('Satz nach Tag des Monats (3.)', AN.schluessel(weih, '2026-12-03').satz, 'anl.weihnachten.s1');
eq('Satz nach Tag des Monats (5.)', AN.schluessel(weih, '2026-12-05').satz, 'anl.weihnachten.s3');
eq('einzelner Satz', AN.schluessel({ id: 'gedenk-x', saetze: 0 }, '2026-12-28').satz, 'anl.gedenk-x.satz');
const fehlt = [], schief = [];
const platz = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
for (const a of AN.STANDARD) {
  const keys = [AN.schluessel(a, '2026-12-01').name];
  for (let i = 1; i <= (a.saetze || 0); i++) keys.push(`anl.${a.id}.s${i}`);
  if (!a.saetze) keys.push(`anl.${a.id}.satz`);
  for (const k of keys) {
    if (!I.TEXTE.de[k] || !I.TEXTE.en[k]) fehlt.push(k);
    else if (platz(I.TEXTE.de[k]) !== platz(I.TEXTE.en[k])) schief.push(k);
  }
}
ok('jeder Anlass hat Name und Saetze auf Deutsch und Englisch', fehlt.length === 0, fehlt.join(', '));
ok('gleiche Platzhalter in beiden Sprachen', schief.length === 0, schief.join(', '));
ok('jeder Anlass hat Motive, die es gibt', AN.STANDARD.every(a => (a.bild || []).length > 0 && a.bild.every(b => AN.MOTIVE.includes(b))));
ok('Anlass-IDs sind eindeutig', new Set(AN.STANDARD.map(a => a.id)).size === AN.STANDARD.length);
ok('Schalter und Ausblenden haben Texte in beiden Sprachen',
  ['anl.schalter', 'anl.an', 'anl.aus', 'anl.hinweis', 'anl.ausblenden'].every(k => I.TEXTE.de[k] && I.TEXTE.en[k]));

print('\n--- Einstellung auf dem Geraet ---');
speicher.clear();
eq('ohne Wahl an', AN.istAn(), true);
AN.setzeAn(false);
eq('abgeschaltet', AN.istAn(), false);
eq('abgeschaltet: kein Banner', AN.heute('2026-12-01'), null);
AN.setzeAn(true);
eq('wieder an', AN.istAn(), true);
eq('an: Banner da', AN.heute('2026-12-01').id, 'weihnachten');
AN.verstecke('2026-12-01');
eq('ausgeblendet: heute weg', AN.heute('2026-12-01'), null);
eq('ausgeblendet gilt nur fuer den Tag', AN.heute('2026-12-02').id, 'weihnachten');
AN.setzeAn(false); AN.setzeAn(true);
eq('wieder einschalten holt den ausgeblendeten Banner zurueck', AN.heute('2026-12-01').id, 'weihnachten');
eq('heute ohne Anlass bleibt null', AN.heute('2026-11-15'), null);
eq('isoLokal nimmt den lokalen Tag', AN.isoLokal(new Date(2026, 11, 1, 0, 30)), '2026-12-01');
eq('isoLokal: spaet am Abend', AN.isoLokal(new Date(2026, 11, 31, 23, 59)), '2026-12-31');

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
