// Ausfuehren: jsc --module-file=tests/icu-echt.test.js
// Prueft die Auswertung an ECHTEN intervals.icu-Antworten (Form echt, Werte
// leicht verfremdet; erzeugt mit tools/icu-fixtures.mjs). Die Tests nageln
// keine Einzelwerte fest, sondern Einheiten, Beziehungen und Verhalten —
// so bleiben sie gruen, wenn die Fixtures neu erzeugt werden.
import * as I from '../js/intervals.js';
import * as ST from '../js/stats.js';
import * as C from '../js/coach.js';
import roh from './fixtures/icu-fahrten.js';
import wroh from './fixtures/icu-wellness.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const zwischen = (v, von, bis) => typeof v === 'number' && Number.isFinite(v) && v >= von && v <= bis;

/* ---------- Schutz: nichts Privates in den Fixtures ---------- */
{
  // Spiegel der Positivliste aus tools/icu-fixtures.mjs: absichtlich doppelt,
  // damit ein verirrtes Feld an zwei Stellen auffallen muesste.
  const FAHRT = ['id', 'external_id', 'type', 'start_date_local', 'name', 'moving_time', 'distance',
    'total_elevation_gain', 'icu_training_load', 'icu_intensity', 'icu_weighted_avg_watts',
    'icu_average_watts', 'average_heartrate', 'max_heartrate', 'icu_efficiency_factor', 'decoupling',
    'icu_power_hr_z2', 'icu_power_hr_z2_mins', 'icu_ftp', 'average_cadence', 'calories', 'icu_rpe',
    'feel', 'icu_achievements', 'trainer', 'icu_zone_times'];
  const WELL = ['id', 'weight', 'eftp', 'sportInfo', 'ctl', 'atl', 'restingHR', 'hrv', 'hrvSDNN', 'sleepSecs',
    'soreness', 'fatigue', 'stress', 'mood', 'motivation', 'sleepQuality', 'sleepScore', 'rampRate'];
  ok('Fahrten: nur Felder der Positivliste', roh.every(a => Object.keys(a).every(k => FAHRT.includes(k))));
  ok('Wellness: nur Felder der Positivliste', wroh.every(w => Object.keys(w).every(k => WELL.includes(k))));
  ok('keine E-Mail, kein Link, keine Koordinaten', !/@|https?:|latlng/i.test(JSON.stringify([roh, wroh])));
  ok('Namen ersetzt', roh.every(a => /^Fahrt \d+$/.test(a.name)));
  ok('Kennungen ersetzt', roh.every(a => /^i\d{6}$/.test(a.id) && (a.external_id == null || /^x\d{6}$/.test(a.external_id))));
  ok('mindestens drei Fahrten und eine Woche Wellness', roh.length >= 3 && wroh.length >= 7);
  ok('sportInfo: nur type und eftp', wroh.every(w => w.sportInfo == null ||
    (Array.isArray(w.sportInfo) && w.sportInfo.every(s => Object.keys(s).every(k => k === 'type' || k === 'eftp')))));
}

/* ---------- Rohform der Wellness-Antwort ---------- */
{
  // Die eFTP steht in der echten Antwort nicht in `eftp`, sondern je Sportart
  // in `sportInfo`; die Apple-Health-HRV nicht in `hrv`, sondern in `hrvSDNN`.
  // Hier wird nur die FORM geprueft, wo sie vorkommt.
  const sport = wroh.flatMap(w => w.sportInfo || []);
  ok('sportInfo: type ist Text, eftp (wo da) 30..2000 W',
    sport.every(s => typeof s.type === 'string' && (s.eftp == null || zwischen(s.eftp, 30, 2000))));
  ok('hrvSDNN (wo da) 5..300 ms', wroh.every(w => w.hrvSDNN == null || zwischen(w.hrvSDNN, 5, 300)));
}

/* ---------- Einheiten und Beziehungen an echten Fahrten ---------- */
const fahrten = roh.map(I.alsFahrt);
{
  ok('Intensitaet kommt als Prozentzahl (50..150)', roh.every(a => zwischen(a.icu_intensity, 50, 150)));
  ok('alsFahrt macht daraus einen Anteil unter 3', fahrten.every(f => zwischen(f.intensitaet, 0.5, 1.5)));
  ok('nie "9118 %": Anteil mal 100 bleibt unter 200', fahrten.every(f => f.intensitaet * 100 < 200));
  ok('Intensitaet = NP / FTP (Beziehung zwischen drei Feldern)',
    fahrten.every(f => Math.abs(f.intensitaet - f.np / f.ftpDamals) < 0.02),
    fahrten.map(f => (f.intensitaet - f.np / f.ftpDamals).toFixed(3)).join(' '));
  ok('Effizienzfaktor = NP / Ø-Puls', fahrten.every(f => Math.abs(f.effizienz - f.np / f.hf) < 0.02),
    fahrten.map(f => (f.effizienz - f.np / f.hf).toFixed(3)).join(' '));
  ok('Zeit in Sekunden, Strecke in Metern: Tempo 8..60 km/h',
    fahrten.every(f => zwischen(f.km / (f.minutes / 60), 8, 60)));
  ok('Hoehenmeter plausibel (0..100 m je km)', fahrten.every(f => zwischen(f.hm / f.km, 0, 100)));
  ok('kcal ~ kJ aus Ø-Watt mal Zeit (+-15 %)',
    fahrten.every((f, i) => Math.abs(f.kcal / (f.watt * roh[i].moving_time / 1000) - 1) < 0.15));
  ok('Puls: Ø unter Max, beide 40..220', fahrten.every(f => f.hf < f.hfMax && zwischen(f.hf, 40, 220) && zwischen(f.hfMax, 40, 220)));
  ok('NP nie unter Ø-Watt', fahrten.every(f => f.np >= f.watt * 0.95));
  ok('Entkopplung wird nicht umgerechnet', fahrten.every((f, i) => f.entkopplung === roh[i].decoupling));
  ok('Entkopplung liegt als Prozentzahl vor (Befund, 5 Fahrten eines Kontos)',
    fahrten.every(f => f.entkopplung == null || zwischen(f.entkopplung, 1, 100)));
  ok('Zonen: bekannte Kennungen', fahrten.every(f => (f.zonen || []).every(z => /^(Z[1-7]|SS)$/.test(z.id))));
  ok('Hauptzone ist eine bekannte Zone', fahrten.every(f => /^(Z[1-7]|SS)$/.test(ST.hauptZone(f.zonen))));
  ok('Trittfrequenz ganzzahlig, 40..140', fahrten.every(f => Number.isInteger(f.kadenz) && zwischen(f.kadenz, 40, 140)));
}

/* ---------- Form, die der Code selbst "ungeprueft" nennt ---------- */
{
  // Die echten Antworten tragen leere Felder als null, nicht als fehlenden
  // Schluessel. Beides muss sauber durchlaufen.
  const a = roh[0];
  eq('icu_rpe null -> null', I.alsFahrt({ ...a, icu_rpe: null }).rpe, null);
  eq('feel null -> null', I.alsFahrt({ ...a, feel: null }).gefuehl, null);
  eq('Skala: rpe 11 wird verworfen', I.alsFahrt({ ...a, icu_rpe: 11 }).rpe, null);
  eq('Skala: rpe 6 bleibt', I.alsFahrt({ ...a, icu_rpe: 6 }).rpe, 6);
  eq('icu_achievements null -> null', I.alsFahrt({ ...a, icu_achievements: null }).bestwerte, null);
  ok('Fahrt ohne Z2-Wert: pwhr null, Minuten 0',
    fahrten.filter(f => f.pwhr == null).every(f => f.pwhrMin === 0));
  ok('Z2-Verhaeltnis (Leistung:Puls) als Verhaeltnis um 1',
    fahrten.filter(f => f.pwhr != null).every(f => zwischen(f.pwhr, 0.5, 1.5)));
  ok('fehlender Schluessel statt null: kein Absturz', (() => {
    const { icu_rpe, feel, icu_achievements, ...rest } = a;
    const f = I.alsFahrt(rest);
    return f.rpe === null && f.gefuehl === null && f.bestwerte === null;
  })());
}

/* ---------- Duplikate, gebaut aus einer echten Fahrt ---------- */
{
  const plus = (zeit, min) => {
    const d = new Date(new Date(zeit).getTime() + min * 60000);
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
  };
  const a = fahrten[0];
  // So sieht die zweite Kopie aus (Apple Health ueber HealthFit): andere
  // Kennung, ein paar Minuten spaeter, aermer an Daten.
  const kopie = { ...a, id: 'i900000', zeit: plus(a.zeit, 4), load: null, km: 0, np: null, watt: null };
  const r = I.entdoppeln([kopie, a]);
  eq('Kopie + Original werden eine Fahrt', r.length, 1);
  eq('die reichere Fassung gewinnt', r[0].id, a.id);
  ok('die verworfene Kennung bleibt vermerkt', Array.isArray(r[0].doppel) && r[0].doppel.includes('i900000'));
  eq('echte Fahrten bleiben alle erhalten', I.entdoppeln(fahrten).length, fahrten.length);
  eq('zwei Fahrten am selben Tag, Stunden auseinander, bleiben zwei',
    I.entdoppeln([a, { ...a, id: 'i900001', zeit: plus(a.zeit, 180) }]).length, 2);
}

/* ---------- Zwischenspeicher aus der alten Fassung ---------- */
{
  const alt = { ...fahrten[0], intensitaet: roh[0].icu_intensity };   // Prozentwert roh uebernommen
  const n = I.normalisiere([alt])[0];
  ok('alter Prozentwert wird im Speicher geradegezogen', zwischen(n.intensitaet, 0.5, 1.5));
  eq('zweimal normalisieren aendert nichts mehr', I.normalisiere([n])[0].intensitaet, n.intensitaet);
}

/* ---------- Auswertungen auf echten Fahrten ---------- */
{
  const s = ST.radStats(fahrten);
  eq('radStats: Anzahl', s.anzahl, fahrten.length);
  eq('radStats: FTP ist die der juengsten Fahrt', s.ftp, fahrten[fahrten.length - 1].ftpDamals);
  ok('radStats: Ø-Watt zu FTP in Prozent plausibel (40..120)', zwischen(s.ftpAnteil, 40, 120));

  const e = ST.aerobeEffizienz(fahrten);
  ok('Effizienz: ein Band wird gefunden', Array.isArray(e.band) && e.punkte.length >= 1);
  ok('Effizienz: Punkte im Band, EF 0,5..2', e.punkte.every(p => zwischen(p.ef, 0.5, 2) && p.ist >= e.band[0] && p.ist < e.band[1]));
  eq('Effizienz: geprueft + verworfen rechnet auf', e.punkte.length + e.verworfen, e.geprueft);
  const tr = ST.effizienzTrend(e.punkte);
  ok('Effizienztrend: erst ab drei Punkten', (tr === null) === (e.punkte.length < 3));

  const k = ST.entkopplungsReihe(fahrten);
  eq('Entkopplung: alle Fahrten haben einen Wert', k.mitWert, fahrten.length);
  eq('Entkopplung: tragfaehig + zu kurz rechnet auf', k.punkte.length + k.zuKurz, k.mitWert);
  eq('Entkopplung: beste Minuten stimmen', k.besteMinuten, Math.max(...fahrten.map(f => f.pwhrMin || 0)));
}

/* ---------- Wellness: echte Form ---------- */
const well = wroh.map(I.alsWellness);
{
  ok('Datum als JJJJ-MM-TT', well.every(w => /^\d{4}-\d{2}-\d{2}$/.test(w.date)));
  eq('jeder Tag nur einmal', new Set(well.map(w => w.date)).size, well.length);
  ok('Gewicht, wo vorhanden, 30..250 kg', well.every(w => w.weight == null || zwischen(w.weight, 30, 250)));
  ok('Ruhepuls, wo vorhanden, 30..120', well.every(w => w.restingHR == null || zwischen(w.restingHR, 30, 120)));
  ok('Schlaf, wo vorhanden, 0..24 h in Sekunden', well.every(w => w.sleepSecs == null || zwischen(w.sleepSecs, 0, 86400)));
  ok('Fitness und Ermuedung sind Zahlen >= 0', well.every(w => zwischen(w.ctl, 0, 500) && zwischen(w.atl, 0, 500)));
  ok('Rampe ist eine Zahl', well.every(w => w.rampRate == null || zwischen(w.rampRate, -50, 50)));
  ok('Selbsteinschaetzungen: null oder 1..4', well.every(w =>
    ['soreness', 'fatigue', 'stress', 'mood', 'motivation', 'sleepQuality'].every(k => w[k] === null || zwischen(w[k], 1, 4))));
  ok('Schlafwert: null oder 0..100', well.every(w => w.sleepScore === null || zwischen(w.sleepScore, 0, 100)));

  const f = I.letzteForm(well);
  const neuester = [...well].filter(w => w.ctl != null && w.atl != null).map(w => w.date).sort().pop();
  eq('letzteForm: juengster Tag mit Fitness und Ermuedung', f.date, neuester);

  // Gewichtskurve: oft nur an wenigen Tagen ein Wert. Das ist der Normalfall.
  const mitGewicht = well.filter(w => w.weight > 0);
  const reihe = ST.gewichtsReihe(well);
  eq('Gewichtsreihe: ein Punkt je Tag mit Gewicht', reihe.length, mitGewicht.length);
  const kg = mitGewicht.map(w => w.weight);
  ok('Gewichtsreihe: Schnitt liegt zwischen Min und Max',
    reihe.every(p => p.schnitt >= Math.min(...kg) - 0.01 && p.schnitt <= Math.max(...kg) + 0.01));
  ok('Gewichtsreihe: Fenster hoechstens 7 Werte', reihe.every(p => p.n >= 1 && p.n <= 7));
  const r28 = ST.abnehmRate(reihe, 28), r84 = ST.abnehmRate(reihe, 84);
  ok('Abnehmrate 28 Tage: null oder plausibel (< 5 kg/Woche)', r28 === null || Math.abs(r28.proWoche) < 5);
  ok('Abnehmrate 84 Tage: null oder plausibel (< 5 kg/Woche)', r84 === null || Math.abs(r84.proWoche) < 5);
  ok('breiteres Fenster nutzt nie weniger Punkte', r84 === null ? r28 === null : (r28 === null || r84.punkte >= r28.punkte));

  // W/kg braucht eftp UND Gewicht am selben Tag. Was herauskommt, muss
  // stimmig sein — auch wenn es nichts ist.
  const wkg = ST.wattProKg(well);
  ok('W/kg: nur Tage mit eFTP und Gewicht', wkg.length === well.filter(w => w.eftp > 0 && w.weight > 0).length);
  ok('W/kg: Werte 0,5..8', wkg.every(p => zwischen(p.wkg, 0.5, 8)));
  // Die App muss lesen, was die Antwort tatsaechlich traegt: eFTP aus
  // sportInfo, HRV aus hrvSDNN. Frueher kam hier nichts an (0 von 85 Tagen).
  const rad = new Set(['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide']);
  const inSport = wroh.filter(w => (w.sportInfo || []).some(s => rad.has(s.type) && s.eftp > 0));
  ok('eFTP: Fixtures tragen sie in sportInfo', inSport.length > 0);
  eq('eFTP: an jedem Tag mit Rad-Eintrag liest alsWellness sie', well.filter(w => w.eftp > 0).length, inSport.length);
  ok('eFTP: Werte 50..600 W', well.every(w => w.eftp == null || zwischen(w.eftp, 50, 600)));
  ok('W/kg: es entstehen Punkte (eFTP und Gewicht am selben Tag)', wkg.length > 0);

  const sdnnTage = wroh.filter(w => w.hrvSDNN != null).length;
  ok('HRV: Fixtures tragen hrvSDNN', sdnnTage > 0);
  eq('HRV: hrvSDNN kommt bei alsWellness an', well.filter(w => w.hrvSDNN != null).length, sdnnTage);
  ok('HRV: SDNN 5..300 ms', well.every(w => w.hrvSDNN == null || zwischen(w.hrvSDNN, 5, 300)));
  ok('HRV: hrv und hrvSDNN bleiben getrennt (SDNN landet nicht in hrv)',
    well.every(w => w.hrv == null || wroh.find(r => r.id === w.date).hrv === w.hrv));

  const erh = C.erholung(well);
  eq('Erholung auf echten Daten: Reihe ist SDNN', erh.hrvArt, 'sdnn');
  ok('Erholung auf echten Daten: Basis und Wert 5..300 ms', erh.hrv == null || (zwischen(erh.hrv, 5, 300) && zwischen(erh.basis, 5, 300)));
}

print(`\n========== Gesamt: ${pass} bestanden, ${fail} fehlgeschlagen ==========\n`);
