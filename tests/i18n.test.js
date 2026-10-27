// Ausfuehren: jsc --module-file=tests/i18n.test.js
//
// i18n.js liest die Sprachwahl aus dem localStorage und faerbt beim Laden
// das Dokument ein. Beides gibt es in der Testumgebung nicht, deshalb steht
// der Ersatz vor dem Laden des Moduls — und das Modul kommt per dynamischem
// Import, weil statische Importe sonst vorher laufen wuerden.
const speicher = new Map();
globalThis.localStorage = {
  getItem: k => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k)
};
globalThis.document = { documentElement: {}, querySelectorAll: () => [] };

const I = await import('../js/i18n.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);

print('\n--- Sprachwahl ---');
speicher.clear();
eq('ohne Wahl gilt Deutsch', I.sprache(), 'de');
I.setSprache('en');
eq('Wahl wird uebernommen', I.sprache(), 'en');
I.setSprache('kl');
eq('unbekannte Sprache wird ignoriert', I.sprache(), 'en');
I.setSprache('de');
eq('zurueck auf Deutsch', I.sprache(), 'de');

print('\n--- Texte ---');
eq('deutscher Text', I.t('setup.verbinden'), 'Verbinden');
I.setSprache('en');
eq('englischer Text', I.t('setup.verbinden'), 'Connect');
I.setSprache('de');

ok('unbekannter Schluessel faellt auf sich selbst zurueck', I.t('gibt.es.nicht') === 'gibt.es.nicht');

print('\n--- Platzhalter ---');
eq('ein Platzhalter', I.t('icu.tage', { n: 5 }), '5 Tagen');
eq('mehrere Platzhalter', I.t('home.vonReferenz', { p: 80, kg: 100 }), '80% von 100 kg');
eq('fehlender Wert bleibt stehen', I.t('icu.tage'), '{n} Tagen');
ok('gleicher Platzhalter mehrfach wird komplett ersetzt',
  !I.t('kal.quote', { a: 1, n: 2, p: 3 }).includes('{'));

print('\n--- Locale ---');
I.setSprache('de');
eq('deutsches Zahlformat', I.locale(), 'de-DE');
I.setSprache('en');
eq('englisches Zahlformat', I.locale(), 'en-GB');
eq('dez englisch: Punkt', I.dez(7.94, 1), '7.9');
I.setSprache('de');
eq('dez deutsch: Komma', I.dez(7.94, 1), '7,9');
eq('dez deutsch: feste Nachkommastellen', I.dez(1.1, 2), '1,10');
eq('dez: Vorzeichen bei positiv', I.dez(0.014, 2, true), '+0,01');
eq('dez: negativ behaelt Minus, kein Plus', I.dez(-1.26, 1, true).replace('−', '-'), '-1,3');
eq('dez: null bekommt kein Plus', I.dez(0, 1, true), '0,0');
eq('dez: Tausender nach Sprache', I.dez(1234.5, 1), '1.234,5');
eq('dez: kein Zahlenwert ergibt leeren Text', I.dez(undefined) + I.dez(NaN) + I.dez('x'), '');
eq('dez: Zahl als Text wird gelesen', I.dez('2.5', 1), '2,5');

print('\n--- Beide Sprachen decken sich ---');
const de = Object.keys(I.TEXTE.de).sort();
const en = Object.keys(I.TEXTE.en).sort();
const fehltEn = de.filter(k => !I.TEXTE.en[k]);
const fehltDe = en.filter(k => !I.TEXTE.de[k]);
ok('kein Schluessel ohne englische Fassung', fehltEn.length === 0, fehltEn.join(', '));
ok('kein englischer Schluessel ohne deutsches Gegenstueck', fehltDe.length === 0, fehltDe.join(', '));
eq('gleich viele Schluessel', de.length, en.length);

// Ein vertippter Platzhalter faellt sonst erst im Betrieb auf — dann steht
// woertlich "{kg}" auf dem Bildschirm statt einer Zahl.
const platzhalter = s => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
const schief = de.filter(k => platzhalter(I.TEXTE.de[k]) !== platzhalter(I.TEXTE.en[k]));
ok('gleiche Platzhalter in beiden Sprachen', schief.length === 0, schief.join(', '));

ok('kein Text ist leer', de.every(k => I.TEXTE.de[k].trim() && I.TEXTE.en[k].trim()));


print('\n--- Singular und Plural ---');
{
  // Entstanden nach dem vierten "1 Einheiten" in der Oberflaeche. Dieselbe
  // Zeile viermal von Hand zu verzweigen ist der Weg, beim fuenften Mal
  // wieder eine zu vergessen.
  eq('bei eins die Singularform', I.tn('plat.offen', 1), I.TEXTE.de['plat.offen.eins']);
  ok('bei zwei die Plurarform mit Zahl', I.tn('plat.offen', 2).includes('2'));
  ok('die Zahl steht ohne Zutun zur Verfuegung',
     I.tn('koerper.punkte', 7, { seit: 'x' }).includes('7'));
  eq('gibt es keine Singularform, bleibt es beim Plural',
     I.tn('inj.was', 1), I.TEXTE.de['inj.was']);
  ok('bei null der Plural', I.tn('plat.offen', 0).includes('0'));

  // Jede .eins-Form braucht ihre Plurarform — sonst zeigt die App bei
  // zwei Stueck einen Schluessel statt eines Satzes.
  for (const sp of ['de', 'en']) {
    const eins = Object.keys(I.TEXTE[sp]).filter(k => k.endsWith('.eins'));
    ok(`${sp}: jede Singularform hat ihren Plural (${eins.length})`,
       eins.every(k => k.slice(0, -5) in I.TEXTE[sp]),
       eins.filter(k => !(k.slice(0, -5) in I.TEXTE[sp])).join());
  }
}



print('\n--- Coach auf Englisch ---');
{
  const C = await import('../js/coach.js');
  const config = {
    lifts: {
      squat: { name: 'Back Squat', increment: 2.5, start: 60, reference: 100 },
      bench: { name: 'Bench Press', increment: 2.5, start: 40 },
      row: { name: 'Row', increment: 2.5, start: 40 },
      ohp: { name: 'OHP', increment: 2.5, start: 30 },
      deadlift: { name: 'Deadlift', increment: 5, start: 80 }
    },
    workouts: { A: [{ lift: 'squat' }, { lift: 'bench' }, { lift: 'row' }], B: [{ lift: 'squat' }, { lift: 'ohp' }, { lift: 'deadlift' }] },
    records: { programm: { squat: { datum: '2021-10-12', bestesEinzel: 140 } } }
  };
  const lifts = w => ({ squat: { weight: w, fails: 0 }, bench: { weight: 40, fails: 0 }, row: { weight: 40, fails: 0 },
    ohp: { weight: 30, fails: 0 }, deadlift: { weight: 80, fails: 0 } });
  const heute = new Date(2026, 9, 12);
  const DEUTSCH = /\b(Tage|Einheit|Sätze|Sätzen|geschafft|Rechnung|Jahren|gefahren|heute|Heute|nicht|weg|Stunden)\b|[äöüß]/;
  const pruefe = (name, text) => ok(`${name}: englisch`, typeof text === 'string' && text && !DEUTSCH.test(text), text);

  I.setSprache('en');
  const comeback = C.directive({ next: 'A', lifts: lifts(60), history: [{ date: '2026-09-25', type: 'strength' }] }, config, heute);
  pruefe('Ansage-Kopf nach Pause', comeback.kopf);
  pruefe('Ansage-Satz', comeback.intensitaet.text);
  eq('das Tageswort bleibt in den Daten deutsch', comeback.intensitaet.label, 'TECHNIK');
  eq('die Anzeige des Tagesworts ist englisch', I.t('ton.TECHNIK'), 'TECHNIQUE');
  const offen = C.directive({ next: 'A', lifts: { ...lifts(60), squat: { weight: 60, fails: 1 } },
    history: [{ date: '2026-10-10', type: 'strength' }] }, config, heute);
  pruefe('offene Rechnung', offen.kopf);
  ok('nennt den Lift', offen.kopf.includes('Back Squat'), offen.kopf);
  const kurz = C.directive({ next: 'A', lifts: lifts(60), history: [{ date: '2026-10-10', type: 'strength' }] }, config, heute,
    null, null, { stufe: 'kurz', schlafStunden: 5.4 });
  pruefe('kurze Nacht', kurz.intensitaet.text);
  ok('Dezimalpunkt auf Englisch', kurz.intensitaet.text.includes('5.4'), kurz.intensitaet.text);
  for (const [ctl, atl] of [[50, 40], [40, 40], [30, 45], [20, 50]]) pruefe(`Form ${ctl - atl}`, C.formLage({ ctl, atl }).text);
  const vor = h => { const d = new Date(heute.getTime() - h * 3600000); return d.toISOString(); };
  for (const [h, load, min] of [[2, 120, 60], [6, 120, 60], [1, 20, 40]]) {
    const st = C.interferenz([{ zeit: vor(h), load, minutes: min, intensitaet: load > 100 ? 0.9 : 0.6 }], heute);
    if (st) pruefe(`Rad vor ${h} h`, st.text);
  }
  const ms = C.meilensteine({ lifts: lifts(105) }, config, heute);
  ok('Meilensteine vorhanden', ms.length >= 2, ms.length);
  for (const m of ms) pruefe(`Meilenstein ${m.art}`, m.text);
  const vorher = { lifts: lifts(97.5) }, nachher = { lifts: lifts(100) };
  const log = { date: '2026-10-12', lifts: [{ lift: 'squat', weight: 97.5, target: 5, reps: [5, 5, 5, 5, 5] }] };
  const erf = C.erfolge(vorher, nachher, config, log, [], heute);
  ok('Minierfolge vorhanden', erf.length >= 3, erf.length);
  for (const e of erf) pruefe(`Minierfolg ${e.art}`, e.text);

  I.setSprache('de');
  eq('zurück auf Deutsch: wieder deutsch', C.directive({ next: 'A', lifts: lifts(60), history: [{ date: '2026-09-25', type: 'strength' }] }, config, heute).kopf, '17 Tage weg');
  ok('Minierfolg wieder deutsch', C.erfolge(vorher, nachher, config, log, [], heute).some(e => e.text.includes('Sätzen')));
}
// Fuer die folgenden Testdateien im selben Prozess: Deutsch und kein Rest.
I.setSprache('de');

print('\n--- Jeder Aufnaeher hat Name und Bedingung, in beiden Sprachen ---');
{
  // Die Schluessel werden in app.js aus dem Katalog gebaut (merch.p.* -> merch.pb.*);
  // ein fehlender Text faellt dort erst auf, wenn jemand den Bildschirm oeffnet.
  const M = await import('../js/merch.js');
  const lifts = { squat: { name: 'Squat', reference: 100 }, bench: { name: 'Bench' }, row: { name: 'Row' },
    ohp: { name: 'OHP' }, deadlift: { name: 'Deadlift' } };
  const kat = M.katalog({ bar: 20, lifts, week: { slots: [{ day: 1, type: 'strength' }, { day: 3, type: 'ride' }] } },
    { mitGewicht: true, mitRad: true, mitHoehe: true, mitPlan: true, mitZusammen: true, mitKurs: true, mitPit: true, mitKursZusammen: true, mitPitZusammen: true });
  ok('der Katalog ist nicht leer', kat.length > 50, `(${kat.length})`);
  for (const sp of ['de', 'en']) {
    I.setSprache(sp);
    const ohneName = kat.filter(a => I.t(a.key, a.vars) === a.key).map(a => a.id);
    const ohneBed = kat.filter(a => { const k = a.key.replace('merch.p.', 'merch.pb.'); return I.t(k, a.vars) === k; }).map(a => a.id);
    eq(`${sp}: jeder Aufnaeher hat einen Namen`, ohneName.join(), '');
    eq(`${sp}: jeder Aufnaeher hat eine Bedingung`, ohneBed.join(), '');
  }
  I.setSprache('de');
}

print('\n--- Jede Gitarre hat Name, Typ und Bedingung, in beiden Sprachen ---');
{
  const GT = await import('../js/gitarren.js');
  for (const sp of ['de', 'en']) {
    I.setSprache(sp);
    const fehlt = [];
    for (const g of GT.GITARREN) {
      for (const k of [`merch.g.${g.id}`, `merch.gt.${g.id}`]) if (I.t(k) === k) fehlt.push(k);
      const b = GT.bedingung(g);
      const quelle = b.art === 'rang' ? `merch.r.${b.id}` : `merch.s.${b.id}`;
      if (I.t(quelle) === quelle) fehlt.push(quelle);
      const satz = b.art === 'rang'
        ? (b.wochen <= 1 ? 'merch.g.ab.erste' : 'merch.g.ab.rang') : 'merch.g.ab.platte';
      if (I.t(satz, { rang: 'x', n: 1, name: 'x', t: 1 }) === satz) fehlt.push(satz);
    }
    for (const k of ['merch.rack', 'merch.rack.zahl', 'merch.rack.fine', 'done.neueGitarre', 'done.neueGitarre.eins', 'ans.gitarre']) {
      if (I.t(k) === k) fehlt.push(k);
    }
    eq(`${sp}: nichts fehlt`, fehlt.join(), '');
  }
  I.setSprache('de');
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
