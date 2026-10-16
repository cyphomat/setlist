// Ausfuehren: jsc --module-file=tests/ansager.test.js
//
// Der Ansager: hoechstens eine Ansage, nach Vorrang, und abschaltbar.
const speicher = new Map();
globalThis.localStorage = {
  getItem: k => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k),
  get length() { return speicher.size; },
  key: i => [...speicher.keys()][i] ?? null
};
const A = await import('../js/ansager.js');
const I = await import('../js/i18n.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

print('\n--- Nichts los ---');
eq('ohne Ereignis keine Ansage', A.ansage(), null);
eq('leere Angaben auch nicht', A.ansage({ aufnaeher: [], elf: false, sauber: false }), null);

print('\n--- Vorrang ---');
const alles = { rang: 'Support', aufnaeher: ['Tight'], referenz: { name: 'Back Squat', kg: 100 },
  rund: { name: 'Deadlift', kg: 150 }, elf: true, sauber: true };
eq('Rang vor allem', A.ansage(alles).ruf, 'NEUER RANG');
eq('Rang: Name darunter', A.ansage(alles).unter, 'Support');
eq('Rang ist gold', A.ansage(alles).art, 'gold');
eq('Rang auch vor der Tour', A.ansage({ ...alles, tour: 'Krampus' }).ruf, 'NEUER RANG');
const tour = A.ansage({ ...alles, rang: null, tour: 'Krampus' });
eq('dann Tour komplett, vor dem Aufnaeher', tour.ruf, 'TOUR KOMPLETT');
eq('Tour: Gegner darunter', tour.unter, 'Krampus besiegt');
eq('Tour ist gold', tour.art, 'gold');
eq('dann Aufnaeher', A.ansage({ ...alles, rang: null }).ruf, 'NEUER AUFNÄHER');
eq('dann zurueck auf altem Stand', A.ansage({ ...alles, rang: null, aufnaeher: [] }).ruf, 'WIEDER DA');
eq('mit Lift und Gewicht', A.ansage({ ...alles, rang: null, aufnaeher: [] }).unter, 'Back Squat: 100 kg wie vor der Pause');
const rund = A.ansage({ ...alles, rang: null, aufnaeher: [], referenz: null });
eq('dann runde Marke', rund.ruf, '150 KG');
eq('runde Marke nennt den Lift', rund.unter, 'Deadlift');
eq('runde Marke ist rot', rund.art, 'rot');
eq('dann elf', A.ansage({ elf: true, sauber: true }).ruf, 'GOES TO ELEVEN');
eq('zuletzt sauber', A.ansage({ sauber: true }).ruf, 'FLAWLESS');
eq('sauber: Unterzeile uebersetzt', A.ansage({ sauber: true }).unter, 'Alle Sätze sauber');

print('\n--- Mehrere Aufnaeher ---');
eq('einer: sein Name', A.ansage({ aufnaeher: ['Tight'] }).unter, 'Tight');
eq('drei: erster und Rest', A.ansage({ aufnaeher: ['Tight', '25 Gigs', 'Zugabe!'] }).unter, 'Tight und 2 weitere');

print('\n--- Englisch ---');
I.setSprache('en');
eq('Rang', A.ansage({ rang: 'Support' }).ruf, 'NEW RANK');
eq('Aufnaeher', A.ansage({ aufnaeher: ['Tight', 'Encore!'] }).unter, 'Tight and 1 more');
eq('sauber bleibt FLAWLESS', A.ansage({ sauber: true }).ruf, 'FLAWLESS');
eq('Unterzeile englisch', A.ansage({ sauber: true }).unter, 'Every set clean');
eq('Tour englisch', `${A.ansage({ tour: 'Krampus' }).ruf} / ${A.ansage({ tour: 'Krampus' }).unter}`, 'TOUR COMPLETE / Krampus defeated');
I.setSprache('de');

print('\n--- Schalter ---');
ok('ohne Einstellung an', A.istAn());
A.setzeAn(false);
ok('abgeschaltet', !A.istAn());
eq('gespeichert als aus', localStorage.getItem(A.SCHLUESSEL), 'aus');
A.setzeAn(true);
ok('wieder an', A.istAn());
eq('an heisst: kein Eintrag', localStorage.getItem(A.SCHLUESSEL), null);

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
