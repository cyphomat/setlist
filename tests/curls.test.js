// Ausfuehren: jsc --module-file=tests/curls.test.js
//
// Curls for the Girls: Auswahl nach Ausstattung, Haar-o-Meter, Log-Bereinigung,
// und dass die Einheit das Programm nicht anfasst (kein Gig, keine Gewichte).
const speicher = new Map();
globalThis.localStorage = {
  getItem: k => (speicher.has(k) ? speicher.get(k) : null),
  setItem: (k, v) => speicher.set(k, String(v)),
  removeItem: k => speicher.delete(k)
};
globalThis.document = { documentElement: {}, querySelectorAll: () => [] };

const CU = await import('../js/curls.js');
const I = await import('../js/i18n.js');
const P = await import('../js/program.js');
const M = await import('../js/merch.js');
const X = await import('../js/export.js');
const W = await import('../js/wach.js');
const G = await import('../js/geraete.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const gleich = (n, a, b) => ok(n, JSON.stringify(a) === JSON.stringify(b), `(${JSON.stringify(a)} != ${JSON.stringify(b)})`);

const track = (e, id) => e.tracks.find(t => t.id === id);

print('\n--- Die Setlist ---');
eq('acht Tracks', CU.TRACKS.length, 8);
eq('Kennungen eindeutig', new Set(CU.TRACKS.map(t => t.id)).size, 8);
eq('Haar-o-Meter hat 36 cm', CU.HAAR_MAX, 36);
eq('Pose-Down bringt kein Haar', CU.TRACKS.find(t => t.id === 'posedown').haar, 0);
ok('jeder Track hat Saetze und Pause', CU.TRACKS.every(t => t.saetze >= 1 && t.pause > 0));

print('\n--- Auswahl nach Ausstattung ---');
{
  const alles = CU.einheit(null);
  eq('ohne Einschraenkung: Spandex Attack mit Langhantel', track(alles, 'spandex').uebung, 'curl:langhantel');
  eq('Aqua Net bevorzugt das Band', track(alles, 'aquanet').werkzeug, 'baender');
  eq('Power Ballad mit Kurzhantel', track(alles, 'ballade').uebung, 'konzentration:kurzhantel');
  eq('Zugabe wie Spandex Attack', track(alles, 'zugabe').werkzeug, track(alles, 'spandex').werkzeug);
  eq('Pose-Down ohne Geraet', track(alles, 'posedown').werkzeug, null);

  const wohnzimmer = CU.einheit(['festhanteln', 'baender']);
  eq('Wohnzimmer: Spandex Attack mit festen Hanteln', track(wohnzimmer, 'spandex').uebung, 'curl:festhanteln');
  eq('Wohnzimmer: Gitarrensolo mit festen Hanteln', track(wohnzimmer, 'solo').uebung, 'einundzwanzig:festhanteln');
  ok('Wohnzimmer: keine Langhantel, keine Kurzhantel',
    wohnzimmer.tracks.every(t => t.werkzeug !== 'langhantel' && t.werkzeug !== 'kurzhantel'));

  const nackt = CU.einheit([]);
  eq('ohne Geraete: Handtuch-Curl', track(nackt, 'spandex').uebung, 'handtuch');
  eq('ohne Geraete: Bassist macht Diamant-Liegestuetze', track(nackt, 'bassist').uebung, 'diamant');
  eq('ohne Geraete: Pose-Down bleibt', track(nackt, 'posedown').uebung, 'pose');
  eq('ohne Geraete: alle acht Tracks da', nackt.tracks.length, 8);

  const nurStange = CU.einheit(['langhantel']);
  eq('nur Langhantel: Hammer-Curl faellt aufs Handtuch', track(nurStange, 'single').uebung, 'handtuch');
  eq('nur Langhantel: Spandex Attack bleibt', track(nurStange, 'spandex').uebung, 'curl:langhantel');

  eq('unbekannte Kennungen werden ignoriert', track(CU.einheit(['gibt-es-nicht']), 'spandex').uebung, 'handtuch');
  eq('kein Array heisst alles da', track(CU.einheit('quatsch'), 'spandex').werkzeug, 'langhantel');
}

print('\n--- Jede Ausstattung ergibt eine machbare Show ---');
{
  const relevant = ['langhantel', 'kurzhantel', 'festhanteln', 'baender'];
  let faelle = 0, schlecht = 0, zugabeAnders = 0, ohneName = 0;
  for (let m = 0; m < 1 << relevant.length; m++) {
    const da = relevant.filter((_, i) => m & (1 << i));
    const e = CU.einheit(da);
    faelle++;
    for (const t of e.tracks) {
      if (t.werkzeug && !da.includes(t.werkzeug)) schlecht++;
      if (!I.t('cu.p.' + t.muster, { w: t.werkzeug ? I.t('cu.w.' + t.werkzeug) : '' }) || I.t('cu.c.' + t.muster) === 'cu.c.' + t.muster) ohneName++;
    }
    if (track(e, 'zugabe').uebung !== track(e, 'spandex').uebung) zugabeAnders++;
  }
  eq('16 Ausstattungen geprueft', faelle, 16);
  eq('nie ein Geraet, das fehlt', schlecht, 0);
  eq('Zugabe nimmt immer das Geraet von Spandex Attack', zugabeAnders, 0);
  eq('jede Uebung hat Name und Hinweis', ohneName, 0);
}

print('\n--- Haar-o-Meter ---');
{
  const voll = CU.TRACKS.map(t => ({ id: t.id, erledigt: t.saetze }));
  eq('alles geschafft: 36 cm', CU.haarHoehe(voll), 36);
  eq('nichts: 0 cm', CU.haarHoehe([]), 0);
  eq('nichts abgehakt: 0 cm', CU.haarHoehe(CU.TRACKS.map(t => ({ id: t.id, erledigt: 0 }))), 0);
  eq('Spandex Attack ein Satz von drei', CU.haarHoehe([{ id: 'spandex', erledigt: 1 }]), Math.round(5 / 3));
  eq('Spandex Attack komplett: 5 cm', CU.haarHoehe([{ id: 'spandex', erledigt: 3 }]), 5);
  eq('mehr Saetze als moeglich zaehlen nicht mehr', CU.haarHoehe([{ id: 'spandex', erledigt: 99 }]), 5);
  eq('negative Saetze zaehlen nicht', CU.haarHoehe([{ id: 'spandex', erledigt: -4 }]), 0);
  eq('unbekannter Track wird ignoriert', CU.haarHoehe([{ id: 'quatsch', erledigt: 3 }]), 0);
  eq('Muell in der Liste stuerzt nicht', CU.haarHoehe([null, undefined, 5, { id: 'solo', erledigt: 'x' }]), 0);
  eq('Pose-Down allein: 0 cm', CU.haarHoehe([{ id: 'posedown', erledigt: 3 }]), 0);
  ok('jede Teilmenge bleibt zwischen 0 und 36', (() => {
    for (let m = 0; m < 1 << CU.TRACKS.length; m++) {
      const cm = CU.haarHoehe(CU.TRACKS.map((t, i) => ({ id: t.id, erledigt: m & (1 << i) ? t.saetze : 0 })));
      if (!(cm >= 0 && cm <= 36)) return false;
    }
    return true;
  })());
}

print('\n--- Maehne ---');
{
  eq('0 cm: kahl', CU.maehneStufe(0), 0);
  eq('keine Zahl: kahl', CU.maehneStufe(NaN), 0);
  eq('negativ: kahl', CU.maehneStufe(-3), 0);
  eq('1 cm: kurz', CU.maehneStufe(1), 1);
  eq('9 cm: noch kurz', CU.maehneStufe(9), 1);
  eq('10 cm: voll', CU.maehneStufe(10), 2);
  eq('19 cm: gross', CU.maehneStufe(19), 3);
  eq('28 cm: Hallenformat', CU.maehneStufe(28), 4);
  eq('volle Show: Hallenformat', CU.maehneStufe(CU.HAAR_MAX), 4);
  eq('ueber dem Maximum bleibt es dabei', CU.maehneStufe(99), CU.MAEHNE_BILDER - 1);
  ok('waechst nie rueckwaerts, jede Stufe kommt vor', (() => {
    let letzte = 0; const da = new Set();
    for (let cm = 0; cm <= CU.HAAR_MAX; cm++) { const s = CU.maehneStufe(cm); if (s < letzte) return false; letzte = s; da.add(s); }
    return da.size === CU.MAEHNE_BILDER;
  })());
}

print('\n--- Pixel-Quellen ---');
{
  const PX = await import('../tools/pixel-curls.mjs');
  eq('Maehnen im Bogen wie in der App', PX.MAEHNE_BILDER, CU.MAEHNE_BILDER);
  eq('Flammen im Bogen wie in der App', PX.FEUERZEUG_BILDER, CU.FEUERZEUG_BILDER);
  eq('Kantenlaenge wie in der App', PX.KANTE, CU.BILD_KANTE);
  const raster = PX.curlsRaster();
  eq('sieben Bilder', raster.length, CU.MAEHNE_BILDER + CU.FEUERZEUG_BILDER);
  ok('jedes Bild ist 24 x 24', raster.every(r => r.length === CU.BILD_KANTE && r.every(z => z.length === CU.BILD_KANTE)));
  ok('nur Farben aus der Palette', raster.every(r => r.every(z => [...z].every(c => c === '.' || PX.PALETTE[c]))));
  ok('keine zwei Bilder gleich', new Set(raster.map(r => r.join('/'))).size === raster.length);
}

print('\n--- Aufnaeher Hair Metal ---');
{
  const cfg = {
    bar: 20, rounding: 2.5, firstWorkout: 'A', deload: { afterFails: 3, factor: 0.9 },
    lifts: { squat: { name: 'Back Squat', increment: 2.5, start: 95 }, bench: { name: 'Bench Press', increment: 2.5, start: 57.5 } },
    workouts: { A: [{ lift: 'squat', sets: 5, reps: 5 }], B: [{ lift: 'bench', sets: 5, reps: 5 }] },
    week: { slots: [{ day: 1, type: 'strength' }] }
  };
  const HEUTE = new Date(2026, 10, 30);
  const hat = (liste, id) => (liste.find(a => a.id === id) || {}).verdient || null;
  const tag = i => `2026-11-${String(i + 1).padStart(2, '0')}`;
  const curls = n => Array.from({ length: n }, (_, i) => ({ date: tag(i), type: 'curls', finished: `${tag(i)}T19:00:00.000Z`, tracks: [] }));

  eq('Stufen 1, 5, 15, 30', M.HAIR_STUFEN.join(','), '1,5,15,30');
  eq('ohne Curls kein Hair-Metal-Kreis im Katalog', M.katalog(cfg).filter(a => a.id.startsWith('hair-')).length, 0);
  eq('mit Curls vier Kreise', M.katalog(cfg, { mitCurls: true }).filter(a => a.id.startsWith('hair-')).length, 4);
  eq('ohne Curls kein Aufnaeher', M.aufnaeher([], cfg, [], HEUTE).filter(a => a.id.startsWith('hair-')).length, 0);
  eq('Garagenband beim ersten Mal', hat(M.aufnaeher(curls(1), cfg, [], HEUTE), 'hair-1'), tag(0));
  eq('vier Mal reichen nicht fuer den Strip', hat(M.aufnaeher(curls(4), cfg, [], HEUTE), 'hair-5'), null);
  eq('Sunset Strip am Tag des fuenften Mals', hat(M.aufnaeher(curls(5), cfg, [], HEUTE), 'hair-5'), tag(4));
  eq('Arena am Tag des 15. Mals', hat(M.aufnaeher(curls(15), cfg, [], HEUTE), 'hair-15'), tag(14));
  eq('Heavy Rotation am Tag des 30. Mals', hat(M.aufnaeher(curls(30), cfg, [], HEUTE), 'hair-30'), tag(29));
  eq('29 Mal reichen nicht fuer Heavy Rotation', hat(M.aufnaeher(curls(29), cfg, [], HEUTE), 'hair-30'), null);
  eq('ein Tag mit zwei Auftritten zaehlt zweimal', hat(M.aufnaeher([...curls(1), { ...curls(1)[0], finished: '2026-11-01T21:00:00.000Z' }], cfg, [], HEUTE), 'hair-1'), tag(0));
  ok('Curls fuellen den Katalog nur um die vier Kreise', M.aufnaeher(curls(30), cfg, [], HEUTE).length - M.aufnaeher([], cfg, [], HEUTE).length === 4);
  ok('jeder Aufnaeher hat ein Bild im Bogen', ['hair-1', 'hair-5', 'hair-15', 'hair-30'].every(id => M.bildIndex({ id }) >= 0));
  ok('Bilder eindeutig im Bogen', new Set(M.BILDER).size === M.BILDER.length);
  const fehlt = [];
  for (const id of ['hair-1', 'hair-5', 'hair-15', 'hair-30']) for (const praefix of ['merch.p.', 'merch.pb.']) {
    for (const sp of ['de', 'en']) { I.setSprache(sp); if (I.t(praefix + id, { n: 5 }) === praefix + id) fehlt.push(sp + ':' + praefix + id); }
  }
  I.setSprache('de');
  eq('Texte der Aufnaeher in beiden Sprachen', fehlt.join(' '), '');
  I.setSprache('de'); const dep = I.t('merch.pb.hair-5', { n: 5 }); I.setSprache('en'); const enp = I.t('merch.pb.hair-5', { n: 5 }); I.setSprache('de');
  ok('Platzhalter wird in beiden Sprachen ersetzt', dep.includes('5') && enp.includes('5') && !dep.includes('{n}') && !enp.includes('{n}'));
}

print('\n--- Log bereinigen ---');
{
  const roh = [
    { id: 'spandex', uebung: 'curl:langhantel', erledigt: 3 },
    { id: 'single', uebung: 'hammer:kurzhantel', erledigt: 2 },
    { id: 'spandex', uebung: 'doppelt', erledigt: 1 },
    { id: 'quatsch', erledigt: 3 },
    null,
    { id: 'solo', erledigt: 7 },
    { id: 'aquanet', erledigt: 'x' }
  ];
  const b = CU.bereinige(roh);
  gleich('nur gueltige Tracks, jeder einmal', b.map(x => x.id), ['spandex', 'single', 'solo', 'aquanet']);
  eq('Saetze kommen aus der Setlist', b[0].saetze, 3);
  eq('komplett heisst geschafft', b[0].geschafft, true);
  eq('zwei von drei: nicht geschafft', b[1].geschafft, false);
  eq('zu viele Saetze werden gekappt', b[2].erledigt, 1);
  eq('keine Zahl: null Saetze', b[3].erledigt, 0);
  eq('Muell als Liste: leer', CU.bereinige('x').length, 0);
  eq('zu lange Uebungskennung wird gekappt', CU.bereinige([{ id: 'solo', uebung: 'x'.repeat(200), erledigt: 1 }])[0].uebung.length, 40);
  const l = CU.label(b);
  ok('Label nennt Namen, Tracks und Hoehe', /^Curls for the Girls · 2\/8 Tracks · Frisurhöhe \d+ cm$/.test(l), l);
}

print('\n--- Logs lesen ---');
{
  const logs = [
    { date: '2026-11-10', type: 'curls', finished: '2026-11-10T19:00:00.000Z' },
    { date: '2026-11-02', type: 'curls', finished: '2026-11-02T19:00:00.000Z' },
    { date: '2026-11-03', type: 'moshpit' },
    { date: '2026-11-04' },
    null,
    { type: 'curls' }
  ];
  gleich('nur Curls mit Datum, nach Abschluss sortiert', CU.curlsLogs(logs).map(l => l.date), ['2026-11-02', '2026-11-10']);
  eq('ohne Logs leer', CU.curlsLogs().length, 0);
}

print('\n--- Schlusszeile ---');
{
  eq('derselbe Tag, dieselbe Zeile', CU.schluss('2026-11-08', false), CU.schluss('2026-11-08', false));
  ok('nicht alles geschafft: aus der fin-Reihe', /^cu\.fin\.\d$/.test(CU.schluss('2026-11-08', false)));
  ok('alles geschafft: aus der voll-Reihe', /^cu\.voll\.\d$/.test(CU.schluss('2026-11-08', true)));
  const fin = new Set(), voll = new Set();
  for (let tag = 1; tag <= 90; tag++) {
    const d = `2026-${tag <= 30 ? '09' : tag <= 60 ? '10' : '11'}-${String(tag % 30 + 1).padStart(2, '0')}`;
    fin.add(CU.schluss(d, false)); voll.add(CU.schluss(d, true));
  }
  eq('ueber 90 Tage kommen alle fin-Zeilen vor', fin.size, CU.FIN_N);
  eq('ueber 90 Tage kommen alle voll-Zeilen vor', voll.size, CU.VOLL_N);
}

print('\n--- Texte: beide Sprachen, gleiche Platzhalter ---');
{
  const schluessel = ['home.curls', 'hist.curls', 'cu.titel', 'cu.tag', 'cu.lead', 'cu.haar', 'cu.cm', 'cu.haarZeile', 'cu.fertig',
    'cu.nichts', 'cu.abbrechenFrage', 'cu.abgeschlossen', 'cu.saetze', 'cu.mal'];
  for (const t of CU.TRACKS) schluessel.push('cu.t.' + t.id, 'cu.a.' + t.id, 'cu.r.' + t.id, 'cu.c.' + t.muster, 'cu.p.' + t.muster, 'cu.p.' + t.ersatz, 'cu.c.' + t.ersatz,
    'cu.ziel.' + (t.ziel.typ === 'reps' ? (t.ziel.seiten ? 'seite' : 'reps') : t.ziel.typ));
  for (const w of ['langhantel', 'kurzhantel', 'festhanteln', 'baender']) schluessel.push('cu.w.' + w);
  for (let i = 0; i < CU.FIN_N; i++) schluessel.push('cu.fin.' + i);
  for (let i = 0; i < CU.VOLL_N; i++) schluessel.push('cu.voll.' + i);
  const platz = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
  const fehlt = [], anders = [];
  for (const k of [...new Set(schluessel)]) {
    I.setSprache('de'); const de = I.t(k);
    I.setSprache('en'); const en = I.t(k);
    if (de === k || en === k) fehlt.push(k);
    else if (platz(de) !== platz(en)) anders.push(k);
  }
  I.setSprache('de');
  eq('kein Schluessel fehlt', fehlt.join(' '), '');
  eq('Platzhalter in beiden Sprachen gleich', anders.join(' '), '');
}

print('\n--- Das Programm bleibt unberuehrt ---');
{
  const state = { lifts: { squat: { weight: 80, fails: 0 } }, history: [], workoutIndex: 0 };
  const log = { date: '2026-11-08', type: 'curls', label: 'Curls for the Girls', tracks: [] };
  const next = P.applyLog(state, {}, log);
  gleich('Arbeitsgewichte unveraendert', next.lifts, state.lifts);
  eq('A/B-Wechsel unveraendert', next.workoutIndex, 0);
  eq('Eintrag in der Historie', next.history[next.history.length - 1].type, 'curls');
  eq('Label bleibt in der Historie', next.history[next.history.length - 1].label, 'Curls for the Girls');

  ok('kein Gig', !M.GIG_TYPEN.includes('curls'));
  eq('zaehlt nicht im Wochenregler (Logs)', M.wochenEinheiten([{ date: '2026-11-09', type: 'curls' }], new Date('2026-11-09T12:00:00'), [], []).length, 0);
  eq('zaehlt nicht im Wochenregler (Historie)', M.wochenEinheiten([], new Date('2026-11-09T12:00:00'), [{ date: '2026-11-09', type: 'curls' }], []).length, 0);
  ok('Display bleibt wach', W.wachFuerAnsicht('curls'));
}

print('\n--- Export ---');
{
  const z = X.zeilen([{ date: '2026-11-08', type: 'curls', label: 'Curls for the Girls · 8/8 Tracks · Frisurhöhe 36 cm', dauerSekunden: 900 }]);
  eq('eine Zeile', z.length, 1);
  eq('Art ist curls', z[0].art, 'curls');
  eq('Label steht in der Notiz', z[0].notiz, 'Curls for the Girls · 8/8 Tracks · Frisurhöhe 36 cm');
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
