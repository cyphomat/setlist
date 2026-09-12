// Auswertung der Logs. Rein und testbar — die Historie soll etwas zeigen,
// das man nicht schon beim Training wusste.

const istKraft = l => (l.type || 'strength') === 'strength' && Array.isArray(l.lifts);

/** Bewegtes Gesamtgewicht einer Einheit: Last x tatsaechliche Wiederholungen. */
export function tonnage(log) {
  if (!istKraft(log)) return 0;
  return log.lifts.reduce((s, e) =>
    s + (e.weight || 0) * (e.reps || []).reduce((a, r) => a + r, 0), 0);
}

/** Zahlen fuer die Kopfzeile der Historie. */
export function summary(logs = []) {
  const kraft = logs.filter(istKraft);
  const wods = logs.filter(l => l.type && l.type !== 'strength');
  const gesamt = kraft.reduce((s, l) => s + tonnage(l), 0);

  const best = {};
  for (const l of kraft) {
    for (const e of l.lifts) {
      if (!e.success) continue;                       // nur saubere Saetze zaehlen
      if (!best[e.lift] || e.weight > best[e.lift].weight) {
        best[e.lift] = { weight: e.weight, date: l.date };
      }
    }
  }

  const daten = logs.map(l => l.date).sort();
  let proWoche = null;
  if (daten.length > 1) {
    const tage = (new Date(daten[daten.length - 1]) - new Date(daten[0])) / 86400000;
    proWoche = tage > 0 ? Math.round((logs.length / (tage / 7)) * 10) / 10 : null;
  }

  return {
    einheiten: logs.length,
    kraft: kraft.length,
    wods: wods.length,
    tonnage: Math.round(gesamt),
    best,
    proWoche,
    von: daten[0] || null,
    bis: daten[daten.length - 1] || null
  };
}

/** Verlauf einer Uebung: ein Punkt je Einheit, in der sie vorkam. */
export function serie(logs, liftId) {
  return logs.filter(istKraft)
    .map(l => {
      const e = l.lifts.find(x => x.lift === liftId);
      return e ? { date: l.date, weight: e.weight, success: e.success } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Punkte zu SVG-Koordinaten. Getrennt von der Darstellung, damit die
 * Umrechnung testbar bleibt und nicht im Template versteckt liegt.
 */
export function sparkline(punkte, breite = 300, hoehe = 60, rand = 4) {
  if (!punkte.length) return null;
  const werte = punkte.map(p => p.weight);
  const min = Math.min(...werte), max = Math.max(...werte);
  const spanne = max - min || 1;
  const n = punkte.length;
  const koord = punkte.map((p, i) => ({
    x: rand + (n === 1 ? (breite - 2 * rand) / 2 : (i / (n - 1)) * (breite - 2 * rand)),
    y: rand + (1 - (p.weight - min) / spanne) * (hoehe - 2 * rand),
    ...p
  }));
  return {
    min, max, koord,
    linie: koord.map((k, i) => `${i ? 'L' : 'M'}${k.x.toFixed(1)},${k.y.toFixed(1)}`).join(' '),
    flaeche: `M${koord[0].x.toFixed(1)},${hoehe} ` +
             koord.map(k => `L${k.x.toFixed(1)},${k.y.toFixed(1)}`).join(' ') +
             ` L${koord[n - 1].x.toFixed(1)},${hoehe} Z`
  };
}

/* ---------------------------------------------------------------
   PR-Verwaltung. Bewusst abgeleitet und nicht gepflegt — dieselbe
   Invariante wie beim Zustand. Eine PR-Liste, die man von Hand
   fortschreibt, ist nach dem ersten Tippfehler wertlos.           */

import { e1rm, e1rmFormel } from './program.js';

/**
 * Bestwerte je Übung, aus allen Logs abgeleitet.
 *   arbeit   schwerster sauber geschaffter Arbeitssatz
 *   gemessen echter Einzelversuch aus einem Max-Out
 *   maximum  bestes geschätztes Einer-Maximum, egal woher
 */
export function prs(logs = []) {
  const out = {};
  const merke = (lift, feld, wert) => {
    out[lift] = out[lift] || { arbeit: null, gemessen: null, maximum: null, untergrenze: null };
    const alt = out[lift][feld];
    if (!alt || wert.vergleich > alt.vergleich) out[lift][feld] = wert;
  };

  for (const l of logs) {
    if (l.type === 'maxout' && l.lift && l.weight) {
      const wdh = l.reps || 1;
      const geschaetzt = e1rm(l.weight, wdh);
      if (wdh === 1) {
        merke(l.lift, 'gemessen', { vergleich: l.weight, weight: l.weight, date: l.date });
      }
      // Nur ein Max-Out geht bis nah ans Versagen — nur daraus wird ein
      // belastbares Maximum. Alles andere ist eine Untergrenze.
      if (geschaetzt) {
        merke(l.lift, 'maximum', {
          vergleich: geschaetzt, wert: geschaetzt, weight: l.weight, reps: wdh,
          date: l.date, formel: e1rmFormel(wdh)
        });
      }
      continue;
    }
    if ((l.type || 'strength') !== 'strength' || !Array.isArray(l.lifts)) continue;

    for (const e of l.lifts) {
      const beste = Math.max(0, ...(e.reps || []));
      if (e.success) {
        merke(e.lift, 'arbeit', { vergleich: e.weight, weight: e.weight, date: l.date, sets: e.sets, reps: e.target });
      }
      // Arbeitssaetze sind submaximal: die Formel unterschaetzt hier
      // systematisch. Deshalb "mindestens", nicht "geschaetztes Maximum".
      const geschaetzt = e1rm(e.weight, beste);
      if (geschaetzt) {
        merke(e.lift, 'untergrenze', {
          vergleich: geschaetzt, wert: geschaetzt, weight: e.weight, reps: beste,
          date: l.date, formel: e1rmFormel(beste)
        });
      }
    }
  }
  return out;
}

/**
 * Verlauf des geschätzten Maximums. Steigt auch dann, wenn du bei gleichem
 * Gewicht mehr Wiederholungen schaffst — bei ein bis zwei Einheiten pro
 * Woche der ehrlichere Fortschrittsmesser als das reine Arbeitsgewicht.
 */
export function serieE1rm(logs, liftId) {
  const punkte = [];
  for (const l of logs) {
    if (l.type === 'maxout' && l.lift === liftId) {
      const w = e1rm(l.weight, l.reps || 1);
      if (w) punkte.push({ date: l.date, weight: w, belastbar: true });
      continue;
    }
    if ((l.type || 'strength') !== 'strength' || !Array.isArray(l.lifts)) continue;
    const e = l.lifts.find(x => x.lift === liftId);
    if (!e) continue;
    const w = e1rm(e.weight, Math.max(0, ...(e.reps || [])));
    if (w) punkte.push({ date: l.date, weight: w, belastbar: false });
  }
  return punkte.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Was an dieser einen Einheit ein Bestwert war — gemessen gegen alles,
 * was davor liegt. Für die Rückmeldung direkt nach dem Training.
 */
export function neuePRs(logs, log) {
  const davor = prs(logs.filter(l => l.date < log.date));
  const danach = prs([...logs.filter(l => l.date < log.date), log]);
  const treffer = [];
  for (const [lift, neu] of Object.entries(danach)) {
    for (const feld of ['arbeit', 'gemessen', 'maximum', 'untergrenze']) {
      const a = davor[lift] && davor[lift][feld];
      const b = neu[feld];
      if (b && (!a || b.vergleich > a.vergleich) && b.date === log.date) {
        treffer.push({ lift, feld, wert: b });
      }
    }
  }
  return treffer;
}

/* ---------------------------------------------------------------
   Radfahrten. Kommen fertig aus intervals.icu, hier wird nur
   zusammengefasst — nachgebaut wird dort nichts.                  */

export function radStats(rides = []) {
  const minuten = rides.reduce((s, r) => s + (r.minutes || 0), 0);
  const km = rides.reduce((s, r) => s + (r.km || 0), 0);
  const last = rides.reduce((s, r) => s + (r.load || 0), 0);
  const daten = rides.map(r => r.date).sort();
  let proWoche = null;
  if (daten.length > 1) {
    const tage = (new Date(daten[daten.length - 1]) - new Date(daten[0])) / 86400000;
    proWoche = tage > 0 ? Math.round((rides.length / (tage / 7)) * 10) / 10 : null;
  }
  return {
    anzahl: rides.length,
    minuten,
    stunden: Math.round((minuten / 60) * 10) / 10,
    km: Math.round(km),
    last: Math.round(last),
    proWoche,
    von: daten[0] || null,
    bis: daten[daten.length - 1] || null
  };
}

/** Wochenweise Last — zeigt Rhythmus und Lücken deutlicher als eine Liste. */
/* ---------------------------------------------------------------
   Watt pro Kilogramm. Die Kurve, die im Defizit steigt, waehrend die
   absoluten Watt stehenbleiben.

   Beides liegt in intervals.icu: `eftp` und `weight` aus den
   Wellness-Daten. Es braucht also kein einziges neues Feld — nur die
   Division, die bisher niemand gemacht hat.                         */

/** Punkte mit beiden Haelften. Tage ohne Gewicht oder ohne eFTP fallen raus. */
export function wattProKg(wellness = []) {
  return wellness
    .filter(w => w.eftp > 0 && w.weight > 0)
    .map(w => ({
      date: w.date,
      wkg: Math.round((w.eftp / w.weight) * 1000) / 1000,
      eftp: Math.round(w.eftp),
      weight: Math.round(w.weight * 10) / 10
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Woher die Veraenderung kam. Ein Plus in W/kg kann aus mehr Leistung
 * stammen oder aus weniger Gewicht — das ist derselbe Zahlenwert und ein
 * voellig anderer Vorgang. Die Zerlegung ist exakt, nicht geschaetzt:
 *   b.eftp/b.kg - a.eftp/a.kg
 *     = (b.eftp - a.eftp)/a.kg  +  b.eftp * (1/b.kg - 1/a.kg)
 * Der erste Summand ist der Anteil der Leistung, der zweite der des
 * Gewichts, und zusammen ergeben sie die Differenz ohne Rest.
 */
export function wattProKgTrend(punkte = []) {
  if (punkte.length < 2) return null;
  const a = punkte[0], b = punkte[punkte.length - 1];
  const ausLeistung = (b.eftp - a.eftp) / a.weight;
  const ausGewicht = b.eftp * (1 / b.weight - 1 / a.weight);
  const r = n => Math.round(n * 1000) / 1000;
  return {
    von: a, bis: b,
    delta: r(b.wkg - a.wkg),
    ausLeistung: r(ausLeistung),
    ausGewicht: r(ausGewicht),
    kgDelta: Math.round((b.weight - a.weight) * 10) / 10,
    wattDelta: b.eftp - a.eftp,
    tage: Math.round((new Date(b.date) - new Date(a.date)) / 86400000)
  };
}

/**
 * Zwei Anteile so runden, dass sie die gerundete Summe exakt ergeben.
 * Getrennt gerundet ergaben +0,12 und +0,09 eine Summe von +0,22 — die
 * Rechnung stimmt, die Anzeige sah nach Schlamperei aus. Der Rest der
 * Rundung geht an den zweiten Anteil, statt in einer dritten Zahl zu
 * verschwinden, die niemand zuordnen kann.
 */
export function anteileAufSumme(summe, teilA, stellen = 2) {
  const f = 10 ** stellen;
  const s = Math.round(summe * f) / f;
  const a = Math.round(teilA * f) / f;
  return { summe: s, a, b: Math.round((s - a) * f) / f };
}

/* ---------------------------------------------------------------
   Abnehmen. Sein erklaerter Hauptfokus — und die App kannte bisher
   beide Haelften der Antwort, ohne sie je zusammenzubringen.

   In `config.ziele.koerper` steht der Massstab von ihm selbst: "Fett
   runter, Muskeln halten. Solange die Gewichte auf der Stange steigen,
   stimmt die Richtung." Genau das wird hier gerechnet.

   Was hier NICHT passiert: kein Kalorienziel, kein geschaetzter
   Grundumsatz, keine Ernaehrungsempfehlung. Die App kennt weder, was er
   isst, noch was er verbraucht — eine Zahl dafuer waere erfunden, und
   eine erfundene Zahl ist hier schlimmer als keine.                  */

/**
 * Gleitender Mittelwert des Koerpergewichts. Der Tageswert ist zu grossen
 * Teilen Wasser, Glykogen und Salz: zwei Kilo Unterschied zwischen zwei
 * Morgen sind normal und sagen nichts. Erst der Mittelwert ueber eine Woche
 * zeigt die Richtung — und nur die ist zu gebrauchen.
 */
export function gewichtsReihe(wellness = [], fenster = 7) {
  // Auch das Datum pruefen, nicht nur die Waage: ein Wellness-Satz ohne
  // Datum liess frueher die Sortierung werfen — und damit fiel der ganze
  // Wellness-Block aus, also Gewichtskurve, Abnehmrate, W/kg und Form.
  const roh = wellness.filter(w => w.weight > 0 && w.date)
    .map(w => ({ date: w.date, weight: w.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return roh.map((p, i) => {
    const teil = roh.slice(Math.max(0, i - fenster + 1), i + 1);
    return {
      date: p.date,
      roh: p.weight,
      schnitt: Math.round((teil.reduce((s, x) => s + x.weight, 0) / teil.length) * 100) / 100,
      n: teil.length
    };
  });
}

/**
 * Abnehmrate als Steigung einer Ausgleichsgeraden ueber die letzten Tage.
 *
 * Bewusst eine Regression und nicht "erster gegen letzten Wert": zwei
 * Einzelpunkte machen aus einem schweren Abend eine Trendwende. Und
 * bewusst ein gleitendes Fenster statt der ganzen Historie, sonst
 * beschreibt die Zahl vor allem, was vor drei Monaten war.
 */
export function abnehmRate(reihe = [], tage = 28) {
  if (reihe.length < 4) return null;
  const bis = new Date(reihe[reihe.length - 1].date);
  const ab = new Date(bis); ab.setDate(ab.getDate() - tage);
  const p = reihe.filter(x => new Date(x.date) >= ab);
  if (p.length < 4) return null;

  const t0 = new Date(p[0].date).getTime();
  const xs = p.map(x => (new Date(x.date).getTime() - t0) / 86400000);
  const ys = p.map(x => x.schnitt);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const nenner = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (!nenner) return null;
  const steigung = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / nenner;

  const proWoche = Math.round(steigung * 7 * 100) / 100;
  const aktuell = p[p.length - 1].schnitt;
  return {
    proWoche,                                        // negativ = es geht runter
    prozentProWoche: aktuell ? Math.round((Math.abs(proWoche) / aktuell) * 1000) / 10 : null,
    aktuell: Math.round(aktuell * 10) / 10,
    punkte: n,
    tage,
    von: p[0].date, bis: p[p.length - 1].date
  };
}

/**
 * Wohin die Arbeitsgewichte laufen. Summe ueber alle Uebungen, damit ein
 * einzelner zaeher Lift nicht das ganze Bild dreht — es geht um die Frage,
 * ob unterm Strich Substanz verlorengeht.
 */
export function kraftRichtung(logs = [], tage = 42, heute = new Date()) {
  const ab = new Date(heute); ab.setDate(ab.getDate() - tage);
  const kraft = logs.filter(istKraft)
    .filter(l => new Date(l.date) >= ab)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (kraft.length < 2) return null;

  const summe = log => (log.lifts || []).reduce((s, e) => s + (e.weight || 0), 0);
  const proLift = {};
  for (const l of kraft) {
    for (const e of l.lifts || []) {
      if (!proLift[e.lift]) proLift[e.lift] = { erst: e.weight, letzt: e.weight };
      else proLift[e.lift].letzt = e.weight;
    }
  }
  const werte = Object.values(proLift);
  const delta = werte.reduce((s, v) => s + (v.letzt - v.erst), 0);
  // Die Summe ueber alle Uebungen taugt fuer das Urteil, aber nicht zum
  // Hinschreiben: "+55 kg" liest sich, als waere er 55 kg staerker
  // geworden. Wie viele Uebungen gestiegen sind, versteht man sofort.
  const gestiegen = werte.filter(v => v.letzt > v.erst).length;
  const gefallen = werte.filter(v => v.letzt < v.erst).length;
  return {
    delta: Math.round(delta * 10) / 10,
    gestiegen, gefallen, uebungen: werte.length,
    richtung: delta > 1 ? 'rauf' : delta < -1 ? 'runter' : 'flach',
    einheiten: kraft.length,
    erste: summe(kraft[0]), letzte: summe(kraft[kraft.length - 1]),
    proLift
  };
}

// Faustregel, keine Vorschrift: unterhalb von rund 0,25 % Koerpergewicht
// pro Woche verschwindet die Abnahme im Rauschen der Waage, oberhalb von
// rund 1 % geht ueblicherweise auch Muskulatur mit. Das sind gaengige
// Richtwerte aus der Trainingsliteratur, keine Messwerte an ihm.
const RATE = { traege: 0.25, schnell: 1.0 };

/**
 * Die eine Frage, die er alleine nicht beantworten kann: geht das Gewicht
 * schnell genug runter, um zu zaehlen — und langsam genug, dass die
 * Gewichte auf der Stange bleiben?
 *
 * Beide Haelften liegen in der App. Getrennt betrachtet sagt keine von
 * beiden etwas: abnehmen ist immer gut, bis die Lifts einbrechen, und
 * steigende Gewichte sind immer gut, bis die Waage stehenbleibt.
 */
export function abnehmLage(rate, kraft) {
  if (!rate) return null;
  const faellt = rate.proWoche < 0;
  const p = rate.prozentProWoche || 0;
  const tempo = !faellt ? 'rauf' : p < RATE.traege ? 'traege' : p > RATE.schnell ? 'schnell' : 'passend';
  const kr = kraft ? kraft.richtung : null;

  let stufe;
  if (!faellt) stufe = 'rauf';
  else if (kr === 'runter') stufe = 'teuer';        // das Defizit kostet gerade Substanz
  else if (tempo === 'schnell') stufe = 'schnell';
  else if (tempo === 'traege') stufe = 'traege';
  else if (kr === 'rauf') stufe = 'fenster';        // beides gleichzeitig: genau das Ziel
  else stufe = 'haltend';

  return { stufe, tempo, kraft: kr, rate, spanne: [RATE.traege, RATE.schnell] };
}

/**
 * Minierfolge auf der Waage — abgeleitet, nicht gepflegt, dieselbe
 * Invariante wie ueberall sonst. Bewusst OHNE Zielgewicht: eins ist
 * nirgends hinterlegt, und eines zu erfinden waere seine Entscheidung,
 * nicht meine. Jedes volle Kilo unter dem bisherigen Tiefstwert zaehlt.
 */
export function gewichtsErfolge(reihe = [], zielGewicht = null) {
  if (reihe.length < 2) return null;
  const start = reihe[0].schnitt;
  const jetzt = reihe[reihe.length - 1].schnitt;
  const tief = Math.min(...reihe.map(r => r.schnitt));
  const runter = Math.round((start - jetzt) * 10) / 10;

  const erreicht = [];
  const volleKilo = Math.floor(start - tief);
  if (volleKilo >= 1) erreicht.push({ art: 'kilo', n: volleKilo });
  const prozent = start ? (start - tief) / start * 100 : 0;
  if (prozent >= 1) erreicht.push({ art: 'prozent', n: Math.floor(prozent) });
  const amTief = Math.abs(jetzt - tief) < 0.05;
  if (amTief) erreicht.push({ art: 'tiefstwert' });

  return {
    start: Math.round(start * 10) / 10,
    jetzt: Math.round(jetzt * 10) / 10,
    tief: Math.round(tief * 10) / 10,
    runter,
    amTief,
    erreicht,
    // Der naechste volle Kilowert UNTER dem Tiefstwert. Steht die Waage
    // schon auf einer runden Zahl, ist der naechste Meilenstein der
    // darunter — sonst waere er in dem Moment schon erreicht.
    naechstes: Math.floor(tief - 0.0001),
    zielGewicht: zielGewicht || null,
    bisZiel: zielGewicht ? Math.round((jetzt - zielGewicht) * 10) / 10 : null
  };
}

/* ---------------------------------------------------------------
   Aerobe Basis: Effizienzfaktor und Entkopplung.

   Beides misst dasselbe von zwei Seiten — wie viel Leistung ein
   Herzschlag traegt. Der Unterschied ist die Anforderung an die Fahrt:
   der Effizienzfaktor kommt mit fuenfundvierzig Minuten aus, die
   Entkopplung braucht eine lange ruhige Strecke am Stueck.

   Deshalb traegt hier der Effizienzfaktor, und die Entkopplung bleibt
   still, bis genug zusammenhaengende Grundlage dahintersteht. Eine
   Kurve aus zwei Messpunkten waere kein Trend, sondern Dekoration.   */

/**
 * Der Effizienzfaktor ist nur innerhalb vergleichbarer Fahrten aussagekraeftig:
 * eine harte Fahrt hat systematisch einen hoeheren Wert als eine ruhige, weil
 * die Leistung schneller steigt als der Puls. Eine Kurve ueber alle Fahrten
 * misst darum vor allem, wie hart die letzte war.
 *
 * Statt eine Zielzone vorzuschreiben, sucht diese Funktion das Band, in dem
 * am meisten gefahren wurde, und vergleicht nur darin. Sie passt sich damit
 * an, was tatsaechlich passiert — nicht an das, was jemand fuer richtig haelt.
 */
export function aerobeEffizienz(fahrten = [], { minMinuten = 25, bandBreite = 0.15, ab = 0.40 } = {}) {
  const taugt = fahrten.filter(f =>
    f && f.effizienz > 0 && f.intensitaet > 0 && (f.minutes || 0) >= minMinuten);
  if (!taugt.length) return { band: null, punkte: [], geprueft: fahrten.length, verworfen: fahrten.length };

  const bandVon = f => ab + Math.floor((f.intensitaet - ab) / bandBreite) * bandBreite;
  const eimer = new Map();
  for (const f of taugt) {
    const k = Math.round(bandVon(f) * 100) / 100;
    if (!eimer.has(k)) eimer.set(k, []);
    eimer.get(k).push(f);
  }
  // Groesstes Band gewinnt; bei Gleichstand das haertere, weil dort die
  // juengeren Fahrten liegen und der Trend aktueller ist.
  const [von, gruppe] = [...eimer.entries()].sort((a, b) => b[1].length - a[1].length || b[0] - a[0])[0];

  return {
    band: [Math.round(von * 100) / 100, Math.round((von + bandBreite) * 100) / 100],
    geprueft: fahrten.length,
    verworfen: fahrten.length - gruppe.length,
    punkte: gruppe
      .map(f => ({
        date: f.date,
        ef: Math.round(f.effizienz * 1000) / 1000,
        ist: Math.round(f.intensitaet * 100) / 100,
        np: f.np || null, hf: f.hf || null, minuten: f.minutes || null
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

/**
 * Trend ueber die Effizienzpunkte. Unter drei Punkten wird bewusst nichts
 * ausgerechnet: zwei Werte sind eine Verbindungslinie, kein Verlauf.
 */
export function effizienzTrend(punkte = []) {
  if (punkte.length < 3) return null;
  const a = punkte[0], b = punkte[punkte.length - 1];
  const delta = b.ef - a.ef;
  return {
    von: a, bis: b, n: punkte.length,
    delta: Math.round(delta * 1000) / 1000,
    prozent: Math.round((delta / a.ef) * 1000) / 10,
    tage: Math.round((new Date(b.date) - new Date(a.date)) / 86400000)
  };
}

/**
 * Entkopplung, aber nur wo sie etwas bedeutet. `pwhrMin` sagt, ueber wie
 * viele Minuten zusammenhaengender Grundlage intervals.icu den Wert
 * gebildet hat — darunter ist die Zahl da, aber nicht belastbar.
 *
 * Gibt immer auch zurueck, WORAN es fehlt. "Keine Daten" und "die Fahrten
 * sind zu kurz dafuer" sind zwei verschiedene Auskuenfte, und nur die
 * zweite sagt einem, was sich aendern muesste.
 */
export function entkopplungsReihe(fahrten = [], minZ2Minuten = 20) {
  const mitWert = fahrten.filter(f => f && f.entkopplung != null);
  const punkte = mitWert
    .filter(f => (f.pwhrMin || 0) >= minZ2Minuten)
    .map(f => ({
      date: f.date,
      wert: Math.round(f.entkopplung * 10) / 10,
      minuten: f.pwhrMin, fahrtMinuten: f.minutes || null
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const beste = mitWert.reduce((m, f) => Math.max(m, f.pwhrMin || 0), 0);
  return {
    punkte,
    schwelle: minZ2Minuten,
    mitWert: mitWert.length,
    zuKurz: mitWert.length - punkte.length,
    besteMinuten: beste,
    // Genug fuer eine Aussage? Drei Punkte, dieselbe Begruendung wie oben.
    tragfaehig: punkte.length >= 3
  };
}

/* ---------------------------------------------------------------
   Plan gegen Ist. Die Frage ist nicht "wie stark bist du", sondern
   "hast du gemacht, was dran war" — und der Fehler, der wirklich
   etwas kostet, ist die leichte Einheit, die hart gefahren wurde.  */

// Wie weit die Intensitaet neben dem Ziel liegen darf, bevor es zaehlt.
const TOLERANZ = 0.03;

/**
 * Eine Fahrt gegen ihren Plan. `planFuer(datum)` liefert `{ label, ftp:
 * [von, bis], struktur }` oder null — als Funktion uebergeben, damit diese
 * Datei nichts ueber Wochenplaene wissen muss und pruefbar bleibt.
 *
 * Bei Intervallen wird "zu locker" bewusst NICHT geurteilt: der Schnitt
 * ueber die ganze Fahrt enthaelt Aufwaermen und Pausen und liegt darum
 * zwangslaeufig unter dem Ziel der Intervalle. Ein Urteil, das die Methode
 * gar nicht hergibt, waere schlimmer als keins.
 */
export function intensitaetsAbgleich(fahrten = [], planFuer = () => null) {
  return fahrten
    .filter(f => f && f.intensitaet != null && f.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(f => {
      const plan = planFuer(f.date);
      const ist = Math.round(f.intensitaet * 100) / 100;
      const basis = { date: f.date, ist, minuten: f.minutes || null, name: f.name || null };
      if (!plan || !Array.isArray(plan.ftp) || plan.ftp.length !== 2) {
        return { ...basis, stufe: 'ohnePlan', label: plan ? plan.label : null, ziel: null };
      }
      const [von, bis] = plan.ftp;
      const gemein = { ...basis, label: plan.label, ziel: [von, bis], struktur: plan.struktur || 'dauerhaft' };
      if (ist > bis + TOLERANZ) return { ...gemein, stufe: 'zuHart' };
      if (ist >= von - TOLERANZ) return { ...gemein, stufe: 'imZiel' };
      return { ...gemein, stufe: gemein.struktur === 'intervalle' ? 'unklar' : 'zuLocker' };
    });
}

/** Zaehlwerk ueber den Abgleich. `quote` laesst aus, was nicht beurteilbar ist. */
export function abgleichBilanz(eintraege = []) {
  const z = { imZiel: 0, zuHart: 0, zuLocker: 0, unklar: 0, ohnePlan: 0 };
  for (const e of eintraege) if (z[e.stufe] !== undefined) z[e.stufe]++;
  const beurteilt = z.imZiel + z.zuHart + z.zuLocker;
  return { ...z, gesamt: eintraege.length, beurteilt,
           quote: beurteilt ? Math.round((z.imZiel / beurteilt) * 100) : null };
}

export function radWochen(rides = [], wochen = 12, heute = new Date()) {
  const montag = d => {
    const m = new Date(d);
    m.setHours(0, 0, 0, 0);
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
    return m;
  };
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const eimer = [];
  const start = montag(heute);
  for (let i = wochen - 1; i >= 0; i--) {
    const m = new Date(start);
    m.setDate(m.getDate() - i * 7);
    eimer.push({ woche: key(m), last: 0, minuten: 0, fahrten: 0 });
  }
  const index = new Map(eimer.map((e, i) => [e.woche, i]));

  for (const r of rides) {
    if (!r.date) continue;
    const i = index.get(key(montag(new Date(r.date + 'T12:00:00'))));
    if (i === undefined) continue;
    eimer[i].last += r.load || 0;
    eimer[i].minuten += r.minutes || 0;
    eimer[i].fahrten += 1;
  }
  return eimer;
}

/* ---------------------------------------------------------------
   Trainingskalender. Regelmaessigkeit ist Daniels erklaertes Ziel —
   und nichts zeigt sie so unbestechlich wie ein Raster, in dem die
   Luecken genauso sichtbar sind wie die Treffer.                   */

const tagesKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const montagVon = d => {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
};

export function kalender(logs = [], fahrten = [], wochen = 26, heute = new Date()) {
  const start = montagVon(heute);
  start.setDate(start.getDate() - (wochen - 1) * 7);

  const kraft = new Set(), wod = new Set(), rad = new Set();
  for (const l of logs) {
    if (!l.date) continue;
    // Unplugged faellt in dieselbe Spalte wie der Jam: beides ist
    // Beiwerk neben dem Programm, und zwei zusaetzliche Farben im Raster
    // wuerden mehr verwirren als erklaeren.
    if (l.type === 'wod' || l.type === 'unplugged') wod.add(l.date);
    else if (!l.type || l.type === 'strength') kraft.add(l.date);
  }
  for (const f of fahrten) if (f.date) rad.add(f.date);

  const tage = [];
  const heuteKey = tagesKey(heute);
  for (let i = 0; i < wochen * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = tagesKey(d);
    tage.push({
      date: key,
      kraft: kraft.has(key),
      wod: wod.has(key),
      rad: rad.has(key),
      zukunft: key > heuteKey,
      heute: key === heuteKey
    });
  }
  return { tage, wochen, von: tage[0].date, bis: tage[tage.length - 1].date };
}

/**
 * Wochenlast aus beiden Welten. Kraft wird aus der Dauer geschaetzt — mit
 * demselben Faktor wie bei der Uebertragung nach intervals.icu, damit die
 * Zahlen hier und dort dieselben sind.
 */
export function wochenLast(logs = [], fahrten = [], wochen = 12, heute = new Date(), faktor = { strength: 0.8, wod: 1.4 }) {
  const start = montagVon(heute);
  const eimer = [];
  for (let i = wochen - 1; i >= 0; i--) {
    const m = new Date(start);
    m.setDate(m.getDate() - i * 7);
    eimer.push({ woche: tagesKey(m), kraft: 0, rad: 0 });
  }
  const index = new Map(eimer.map((e, i) => [e.woche, i]));
  const eimerFuer = datum => index.get(tagesKey(montagVon(new Date(datum + 'T12:00:00'))));

  for (const l of logs) {
    if (!l.date || l.type === 'maxout' || l.type === 'anpassung') continue;
    const i = eimerFuer(l.date);
    if (i === undefined) continue;
    const sek = l.dauerSekunden ||
      (l.started && l.finished ? Math.round((new Date(l.finished) - new Date(l.started)) / 1000) : 0);
    if (!sek) continue;
    const beiwerk = l.type === 'wod' || l.type === 'unplugged';
    eimer[i].kraft += Math.round((sek / 60) * (beiwerk ? faktor.wod : faktor.strength));
  }
  for (const f of fahrten) {
    if (!f.date) continue;
    const i = eimerFuer(f.date);
    if (i !== undefined) eimer[i].rad += f.load || 0;
  }
  return eimer.map(e => ({ ...e, gesamt: e.kraft + e.rad }));
}

/** Bewegtes Gewicht je Woche — das Volumen hinter der Progression. */
export function wochenTonnage(logs = [], wochen = 12, heute = new Date()) {
  const start = montagVon(heute);
  const eimer = [];
  for (let i = wochen - 1; i >= 0; i--) {
    const m = new Date(start);
    m.setDate(m.getDate() - i * 7);
    eimer.push({ woche: tagesKey(m), tonnage: 0, einheiten: 0 });
  }
  const index = new Map(eimer.map((e, i) => [e.woche, i]));
  for (const l of logs) {
    if (!l.date || !istKraft(l)) continue;
    const i = index.get(tagesKey(montagVon(new Date(l.date + 'T12:00:00'))));
    if (i === undefined) continue;
    eimer[i].tonnage += tonnage(l);
    eimer[i].einheiten += 1;
  }
  return eimer.map(e => ({ ...e, tonnage: Math.round(e.tonnage) }));
}

/**
 * Fitness und Ermuedung ueber die Zeit. Der Abstand zwischen beiden ist die
 * Form — deshalb wird er als Flaeche zwischen den Linien gezeichnet und
 * nicht als dritte Kurve, die dasselbe noch einmal sagt.
 */
export function formVerlauf(wellness = []) {
  return wellness
    .filter(w => w.ctl != null && w.atl != null && w.date)
    .map(w => ({ date: w.date, ctl: w.ctl, atl: w.atl, form: Math.round((w.ctl - w.atl) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ── Zum Angeben ──────────────────────────────────────────────────
   Reine Vergleiche in derselben Einheit oder reine Zaehlungen — nichts
   geschaetzt, nichts erfunden. Kalorien aus bewegtem Gewicht waeren genau
   das: Physik vorgetaeuscht, wo eigentlich Stoffwechsel gemeint ist.    */

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** Wiederholungen insgesamt, aus allen Kraftsaetzen — auch nicht geschafften. */
export function wiederholungenGesamt(logs = []) {
  return logs.filter(istKraft).reduce((summe, l) =>
    summe + l.lifts.reduce((s, e) => s + (e.reps || []).reduce((a, r) => a + r, 0), 0), 0);
}

/**
 * Wochentag, an dem am haeufigsten trainiert wurde — Kraft, WOD und Rad
 * zusammen, weil es um das eigene Muster geht, nicht um eine Sportart.
 * Ein Tag mit zwei Einheiten zaehlt einmal, wie im Trainingskalender auch.
 */
export function lieblingstag(logs = [], fahrten = []) {
  const zaehler = new Array(7).fill(0);
  const gesehen = new Set();
  const zaehle = datum => {
    if (!datum || gesehen.has(datum)) return;
    gesehen.add(datum);
    zaehler[new Date(datum + 'T00:00:00').getDay()]++;
  };
  for (const l of logs) zaehle(l.date);
  for (const f of fahrten) zaehle(f.date);
  if (!gesehen.size) return null;
  const idx = zaehler.indexOf(Math.max(...zaehler));
  return { tag: WOCHENTAGE[idx], anzahl: zaehler[idx] };
}

/**
 * Laengste Serie aufeinanderfolgender Wochen mit mindestens einer Einheit,
 * ueber die gesamte Geschichte — der Rekord, nicht die laufende Serie
 * (die steht schon im Trainingskalender).
 */
export function laengsteSerie(logs = [], fahrten = []) {
  const wochenstart = new Set();
  const einordnen = datum => {
    if (!datum) return;
    const d = new Date(datum + 'T00:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    wochenstart.add(tagesKey(d));
  };
  for (const l of logs) einordnen(l.date);
  for (const f of fahrten) einordnen(f.date);

  const sortiert = [...wochenstart].sort();
  let laengste = 0, laufend = 0, vorher = null;
  for (const w of sortiert) {
    const d = new Date(w + 'T00:00:00');
    laufend = (vorher && d - vorher === 7 * 86400000) ? laufend + 1 : 1;
    laengste = Math.max(laengste, laufend);
    vorher = d;
  }
  return laengste;
}

// Ansage-Stufen aus intensitaet() in coach.js — HART und SCHWER teilen sich
// dieselbe Stufe, beide sagen "wird hart", nur aus verschiedenem Grund.
const ANSAGE_STUFE = { TECHNIK: 0, SOLIDE: 1, HART: 2, SCHWER: 2 };
const GEFUEHL_STUFE = { leicht: 0, normal: 1, hart: 2, extrem: 3 };

/**
 * Ansage gegen tatsaechliches Gefuehl — macht die Vorhersage ueberpruefbar
 * statt behauptet. Nur Einheiten, die beides tragen, fliessen ein; aeltere
 * Logs kennen weder angesagt noch gefuehlt und werden stillschweigend
 * uebersprungen statt als Fehlschlag gezaehlt zu werden.
 */
export function ansageAbgleich(logs = []) {
  const eintraege = logs
    .filter(l => istKraft(l) && l.angesagt in ANSAGE_STUFE && l.gefuehlt in GEFUEHL_STUFE)
    .map(l => {
      const soll = ANSAGE_STUFE[l.angesagt], ist = GEFUEHL_STUFE[l.gefuehlt];
      const urteil = ist === soll ? 'treffer' : ist > soll ? 'schwerer' : 'leichter';
      return { date: l.date, workout: l.workout, angesagt: l.angesagt, gefuehlt: l.gefuehlt, urteil };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    eintraege,
    gesamt: eintraege.length,
    treffer: eintraege.filter(e => e.urteil === 'treffer').length,
    schwerer: eintraege.filter(e => e.urteil === 'schwerer').length,
    leichter: eintraege.filter(e => e.urteil === 'leichter').length
  };
}

/* ===================================================================
   Kraftverhaeltnisse, Hochrechnung, Relativkraft, Plateaus.

   Bis hierher beantwortet die Auswertung "wie viel" und "wohin". Was
   fehlte, ist "wo stehst du schief" — die Frage, die man sich selbst
   nicht beantworten kann, weil man beim eigenen Training immer nur den
   Lift sieht, an dem man gerade steht.

   Eine Warnung vorweg, die den ganzen Abschnitt traegt: ein Verhaeltnis
   aus zwei Zahlen UNTERSCHIEDLICHER Guete beschreibt die Testhistorie,
   nicht die Kraft. Wer den Squat einmal ausgemaxt hat und beim Deadlift
   nur Arbeitssaetze kennt, bekommt ein Verhaeltnis, das genau das
   aussagt — und sonst nichts. Deshalb wird hier primaer Arbeitsgewicht
   gegen Arbeitsgewicht verglichen: alle Lifts laufen aus derselben
   Progression, das ist dieselbe Guete. Gemischt wird nie.           */

/**
 * Die Zielwerte.
 *
 * `tabelle` ist der einzige Wert aus der Strength-Ratio-Tabelle, die
 * Daniel geschickt hat (Active Life). Der Rest sind gaengige Richtwerte
 * aus der Kraftsportliteratur — Faustregeln, keine Messwerte, und die
 * Oberflaeche sagt das auch. Dieselbe Trennung wie bei QUELLEN in
 * content.js: was belegt ist, wird als belegt ausgezeichnet, der Rest
 * nicht.
 */
export const VERHAELTNIS_PAARE = [
  { id: 'squat-deadlift', oben: 'squat',  unten: 'deadlift', ziel: 0.80, herkunft: 'tabelle',    gruppe: 'lifts' },
  { id: 'bench-squat',    oben: 'bench',  unten: 'squat',    ziel: 0.75, herkunft: 'faustregel', gruppe: 'lifts' },
  { id: 'ohp-bench',      oben: 'ohp',    unten: 'bench',    ziel: 0.65, herkunft: 'faustregel', gruppe: 'lifts' },
  { id: 'row-bench',      oben: 'row',    unten: 'bench',    ziel: 0.90, herkunft: 'faustregel', gruppe: 'lifts' },

  // Die zweite Gruppe braucht Werte, die das Programm nicht selbst
  // erzeugt — Klimmzug, Dip, Front Squat und die einseitige Arbeit. Sie
  // werden im Backstage eingetragen und erscheinen nur, wenn sie dastehen.
  { id: 'ohp-pullup',        oben: 'ohp',        unten: 'pullup',         ziel: 0.66, herkunft: 'tabelle', gruppe: 'pruefung' },
  // Der einzige Wert hier, der NICHT direkt als Verhaeltnis in der Tabelle
  // steht: dort werden Klimmzug und Dip ueber Wiederholungen verglichen,
  // nicht ueber Last. 1,25 ist aus ihren beiden Gewichtsangaben gebildet
  // (150 zu 120 bei 120 Koerpergewicht) — also meine Ableitung, nicht ihre
  // Aussage. Deshalb als Faustregel ausgewiesen und nicht als belegt.
  { id: 'pullup-dip',        oben: 'pullup',     unten: 'dip',            ziel: 1.25, herkunft: 'faustregel', gruppe: 'pruefung' },
  { id: 'frontsquat-squat',  oben: 'frontsquat', unten: 'squat',          ziel: 0.85, herkunft: 'tabelle', gruppe: 'pruefung' },
  { id: 'frontsquat-dl',     oben: 'frontsquat', unten: 'deadlift',       ziel: 0.68, herkunft: 'tabelle', gruppe: 'pruefung' },
  { id: 'sapress-bw',        oben: 'sapress',    unten: 'koerpergewicht', ziel: 0.33, herkunft: 'tabelle', gruppe: 'pruefung' },
  { id: 'farmer-deadlift',   oben: 'farmer',     unten: 'deadlift',       ziel: 0.50, herkunft: 'tabelle', gruppe: 'pruefung' },
  { id: 'stepup-squat',      oben: 'stepup',     unten: 'squat',          ziel: 0.45, herkunft: 'tabelle', gruppe: 'pruefung' },
  { id: 'sldl-deadlift',     oben: 'sldl',       unten: 'deadlift',       ziel: 0.33, herkunft: 'tabelle', gruppe: 'pruefung' }
];

/**
 * Die Pruefwerte, die das Programm nicht selbst erzeugt.
 *
 * `basis: 'koerper'` heisst: die Last ist das Koerpergewicht plus Zusatz,
 * eingetragen wird nur der Zusatz. Ohne bekanntes Koerpergewicht laesst
 * sich daraus keine Gesamtlast bilden, und das Paar entfaellt.
 *
 * `wdh: false` bei der Trageuebung: eine Strecke hat keine
 * Wiederholungen, das eingetragene Gewicht IST die Maximallast.
 */
export const PRUEFWERTE = [
  { id: 'pullup',     basis: 'koerper', wdh: true,  seite: false },
  { id: 'dip',        basis: 'koerper', wdh: true,  seite: false },
  { id: 'frontsquat', basis: 'last',    wdh: true,  seite: false },
  { id: 'sapress',    basis: 'last',    wdh: true,  seite: true  },
  { id: 'stepup',     basis: 'last',    wdh: true,  seite: true  },
  { id: 'sldl',       basis: 'last',    wdh: true,  seite: true  },
  { id: 'farmer',     basis: 'last',    wdh: false, seite: true  }
];

// Unterhalb von 8 % ist die Abweichung kleiner als der Sprung, den eine
// einzige Scheibe macht — darueber zu reden waere Praezision vortaeuschen.
const VERHAELTNIS_STUFEN = { stimmt: 8, leicht: 20 };

const stufeFuer = abw => {
  const a = Math.abs(abw);
  return a < VERHAELTNIS_STUFEN.stimmt ? 'stimmt'
       : a < VERHAELTNIS_STUFEN.leicht ? 'leicht' : 'deutlich';
};

/** Arbeitsgewichte je Lift aus dem Zustand — die Basis mit gleicher Guete. */
function arbeitsGewichte(state = {}) {
  const out = {};
  for (const [id, l] of Object.entries(state.lifts || {})) {
    if (l && l.weight > 0) out[id] = l.weight;
  }
  return out;
}

/** Mit wie vielen Wiederholungen ein Lift im Programm laeuft. */
function zielWdh(config = {}, liftId) {
  for (const teile of Object.values(config.workouts || {})) {
    const e = (teile || []).find(x => x.lift === liftId);
    if (e && e.reps > 0) return e.reps;
  }
  return 5;
}

/**
 * Alle Werte auf EINE Basis bringen, sonst vergleicht man Ungleiches.
 *
 * Solange alle Lifts mit derselben Wiederholungszahl laufen, ist das
 * Verhaeltnis zweier Arbeitsgewichte identisch mit dem ihrer e1RM — der
 * Formelfaktor kuerzt sich heraus. Sobald aber ein Pruefwert mit einer
 * anderen Wiederholungszahl dazukommt, stimmt das nicht mehr: 82,5 zu 105
 * sind 0,79, aber e1RM aus fuenf Wiederholungen gegen einen gemessenen
 * Einzelversuch sind 0,88. Zwoelf Prozent Unterschied, und niemand sieht
 * der Zahl an, woher sie kommt.
 *
 * Deshalb wird ueberall e1RM gerechnet. Fuer die Grundlifts aendert das
 * am Ergebnis nichts, fuer alles andere ist es die Voraussetzung.
 */
function vergleichsWerte(state = {}, config = {}, koerpergewicht = null, gemessen = {}) {
  const werte = {}, herkunft = {};

  for (const [id, w] of Object.entries(arbeitsGewichte(state))) {
    const wert = e1rm(w, zielWdh(config, id));
    if (wert > 0) { werte[id] = wert; herkunft[id] = { art: 'arbeit', gewicht: w, wdh: zielWdh(config, id) }; }
  }

  for (const def of PRUEFWERTE) {
    // Ein gemessener Test geht der Handeingabe vor.
    const c = gemessen[def.id] || (config.checks || {})[def.id];
    if (!c || !pruefwertGueltig(def, c.gewicht)) continue;
    // Bei Klimmzug und Dip traegt man den Zusatz ein; bewegt wird der
    // eigene Koerper dazu. Ohne Koerpergewicht gibt es keine Gesamtlast.
    const last = def.basis === 'koerper'
      ? (koerpergewicht > 0 ? koerpergewicht + c.gewicht : null)
      : c.gewicht;
    if (!(last > 0)) continue;
    const wdh = def.wdh ? (c.wdh > 0 ? c.wdh : 1) : 1;
    const wert = e1rm(last, Math.min(wdh, 12));
    if (wert > 0) {
      werte[def.id] = wert;
      herkunft[def.id] = {
        art: gemessen[def.id] ? 'gemessen' : 'check',
        gewicht: last, wdh, datum: c.datum || null
      };
    }
  }

  if (koerpergewicht > 0) {
    werte.koerpergewicht = koerpergewicht;
    herkunft.koerpergewicht = { art: 'koerper', gewicht: koerpergewicht, wdh: 1 };
  }
  return { werte, herkunft };
}

/**
 * Gemessene Maxima, aber nur als GESCHLOSSENER Satz: sobald fuer einen
 * Lift kein Max-Out vorliegt, ist die Menge fuer Vergleiche unbrauchbar.
 * Der Aufrufer bekommt sie trotzdem und entscheidet je Paar.
 */
function maximaAus(logs = []) {
  const p = prs(logs);
  const out = {};
  for (const [id, e] of Object.entries(p)) {
    if (e.maximum) out[id] = e.maximum.wert;
  }
  return out;
}

/**
 * Ist diese Last fuer diesen Pruefwert eine Angabe?
 *
 * Die Regel klingt klein und stand trotzdem dreimal im Weg: bei Klimmzug
 * und Dip traegt man den ZUSATZ ein, und "ohne Zusatz" ist eine Null —
 * eine Aussage, kein fehlender Wert. Sie einmal falsch zu behandeln liess
 * erst beide Klimmzug-Verhaeltnisse lautlos verschwinden und spaeter den
 * Speichern-Knopf im Max-Out gesperrt. Deshalb hier, an einer Stelle.
 */
export function pruefwertGueltig(def, gewicht) {
  if (!def || !Number.isFinite(gewicht)) return false;
  return def.basis === 'koerper' ? gewicht >= 0 : gewicht > 0;
}

/**
 * Der zuletzt gemessene Pruefwert je Uebung, aus den Max-Out-Logs.
 *
 * Gemessen schlaegt eingetragen — dieselbe Rangfolge wie bei den
 * Bestwerten, wo ein Max-Out ein `maximum` liefert und ein Arbeitssatz nur
 * eine `untergrenze`. Was im Backstage steht, ist eine Angabe; was hier
 * steht, ist ein Test mit Datum.
 */
export function checksAusLogs(logs = []) {
  const out = {};
  for (const l of logs) {
    if (l.type !== 'maxout' || !l.check || !(l.weight >= 0)) continue;
    const alt = out[l.check];
    if (!alt || l.date > alt.datum) {
      out[l.check] = { gewicht: l.weight, wdh: l.reps || 1, datum: l.date };
    }
  }
  return out;
}

/**
 * Wo die Kraft schief steht.
 *
 * Zwei Massstaebe nebeneinander: die allgemeine Faustregel und der
 * eigene Stand vor der Pause aus `config.lifts[].reference`. Beim
 * Wiederaufbau ist der zweite der ehrlichere — er kennt den Koerper,
 * um den es geht, und nicht den Durchschnitt aller Koerper.
 */
export function verhaeltnisse(state = {}, config = {}, logs = [], wellness = []) {
  const reihe = gewichtsReihe(wellness);
  const bw = reihe.length ? reihe[reihe.length - 1].schnitt : ((config.checks || {}).koerpergewicht || null);
  const { werte, herkunft } = vergleichsWerte(state, config, bw, checksAusLogs(logs));
  const maxima = maximaAus(logs);
  const lifts = config.lifts || {};
  const istPruefwert = id => PRUEFWERTE.some(x => x.id === id);
  const bekannt = id => werte[id] > 0 &&
    (id === 'koerpergewicht' || istPruefwert(id) ? true : !!lifts[id]);

  const paare = [];
  for (const def of VERHAELTNIS_PAARE) {
    // Ein Paar, dessen Lift es in dieser Konfiguration gar nicht gibt,
    // entfaellt lautlos — config.lifts ist frei konfigurierbar. Ein Lift
    // muss dort stehen; ein Pruefwert oder das Koerpergewicht reicht,
    // wenn ein Wert vorliegt.
    if (!bekannt(def.oben) || !bekannt(def.unten)) continue;
    const o = werte[def.oben], u = werte[def.unten];
    if (!(o > 0) || !(u > 0)) continue;

    const ist = o / u;
    const abweichung = Math.round(((ist / def.ziel) - 1) * 1000) / 10;

    // Der persoenliche Massstab gilt nur zwischen zwei Grundlifts: fuer
    // Pruefwerte gibt es keinen Stand vor der Pause.
    const ro = (lifts[def.oben] || {}).reference, ru = (lifts[def.unten] || {}).reference;
    let persoenlich = null;
    if (ro > 0 && ru > 0) {
      const zielP = ro / ru;
      const abwP = Math.round(((ist / zielP) - 1) * 1000) / 10;
      persoenlich = { ziel: Math.round(zielP * 100) / 100, abweichung: abwP, stufe: stufeFuer(abwP) };
    }

    // Der genauere Vergleich — nur wenn fuer BEIDE Lifts ein Max-Out
    // vorliegt. Sonst gaebe es ein Verhaeltnis aus einem gemessenen und
    // einem hochgerechneten Wert, und das misst nichts.
    let gemessen = null;
    if (maxima[def.oben] > 0 && maxima[def.unten] > 0) {
      const istM = maxima[def.oben] / maxima[def.unten];
      const abwM = Math.round(((istM / def.ziel) - 1) * 1000) / 10;
      gemessen = {
        ist: Math.round(istM * 100) / 100, abweichung: abwM, stufe: stufeFuer(abwM),
        oben: maxima[def.oben], unten: maxima[def.unten]
      };
    }

    paare.push({
      id: def.id, oben: def.oben, unten: def.unten,
      herkunft: def.herkunft, gruppe: def.gruppe,
      ist: Math.round(ist * 100) / 100, ziel: def.ziel,
      abweichung, stufe: stufeFuer(abweichung),
      gewichtOben: herkunft[def.oben].gewicht, gewichtUnten: herkunft[def.unten].gewicht,
      artOben: herkunft[def.oben].art, artUnten: herkunft[def.unten].art,
      persoenlich, gemessen
    });
  }

  const lift = paare.filter(p => p.gruppe === 'lifts');
  const pruefung = paare.filter(p => p.gruppe === 'pruefung');

  return {
    paare, lift, pruefung, basis: 'e1rm', koerpergewicht: bw,
    // Die Diagnose laeuft NUR ueber die Grundlifts. Drei der
    // Pruefwert-Paare haengen am Kreuzheben und zwei an der Kniebeuge —
    // wer einseitige Arbeit gar nicht trainiert, wuerde dort reihenweise
    // "Kreuzheben ist voraus" erzeugen, obwohl in Wahrheit nur die
    // einseitige Arbeit fehlt. Das waere eine Diagnose ueber den
    // falschen Lift.
    ausreisser: ausreisserAus(lift),
    // Nur Pruefwerte nennen, die selbst die schwache Seite sind. Bei
    // "Strict Press : Klimmzug" unter dem Ziel ist der Press die schwache
    // Seite, nicht der Klimmzug — den hier mitzuzaehlen hiesse, ihn im
    // selben Absatz stark und schwach zu nennen. Und fuer den Press ist es
    // keine Aussage ueber ihn: dafuer muesste er in mehreren Paaren
    // auffallen, wie bei den Grundlifts.
    schwach: pruefung
      .filter(p => p.stufe === 'deutlich' && p.abweichung < 0 && istPruefwert(p.oben))
      .map(p => p.oben)
  };
}

/**
 * Aus Paaren eine Diagnose machen.
 *
 * Ein einzelnes auffaelliges Verhaeltnis ist mehrdeutig: liegt es am
 * Zaehler oder am Nenner? Erst wenn derselbe Lift in MEHREREN Paaren
 * in dieselbe Richtung auffaellt, ist er die Ursache. Genau das ist der
 * Unterschied zwischen einer Tabelle und einer Diagnose.
 */
export function ausreisserAus(paare = []) {
  const stimmen = {};
  const zaehle = (lift, richtung) => {
    stimmen[lift] = stimmen[lift] || { zurueck: 0, vor: 0 };
    stimmen[lift][richtung]++;
  };

  for (const p of paare) {
    if (p.stufe === 'stimmt') continue;
    // ist < ziel: der obere Lift haengt zurueck oder der untere ist voraus.
    if (p.abweichung < 0) { zaehle(p.oben, 'zurueck'); zaehle(p.unten, 'vor'); }
    else                  { zaehle(p.oben, 'vor');     zaehle(p.unten, 'zurueck'); }
  }

  let beste = null;
  for (const [lift, s] of Object.entries(stimmen)) {
    for (const richtung of ['zurueck', 'vor']) {
      // Eine einzelne Stimme reicht nicht: die hat jeder Partner eines
      // auffaelligen Paars, ohne dass etwas ueber ihn gesagt waere.
      if (s[richtung] < 2) continue;
      if (!beste || s[richtung] > beste.treffer) beste = { lift, richtung, treffer: s[richtung] };
    }
  }
  return beste;
}

/**
 * Kraft je Kilogramm Koerpergewicht. Im Defizit die ehrlichere Zahl:
 * absolut zu halten ist dort schon Fortschritt, und das sieht man nur
 * relativ.
 */
export function relativKraft(state = {}, wellness = []) {
  const reihe = gewichtsReihe(wellness);
  if (!reihe.length) return null;
  const bw = reihe[reihe.length - 1].schnitt;
  if (!(bw > 0)) return null;

  const arbeit = arbeitsGewichte(state);
  const werte = Object.entries(arbeit)
    .map(([lift, w]) => ({ lift, wert: Math.round((w / bw) * 100) / 100, gewicht: w }))
    .sort((a, b) => b.wert - a.wert);
  return werte.length ? { koerpergewicht: Math.round(bw * 10) / 10, werte, datum: reihe[reihe.length - 1].date } : null;
}

/**
 * Verlauf der Relativkraft je Lift: Arbeitsgewicht der Einheit geteilt
 * durch das Koerpergewicht, das zu diesem Datum am naechsten liegt.
 */
export function relativReihe(logs = [], wellness = [], liftId) {
  const reihe = gewichtsReihe(wellness);
  if (!reihe.length) return [];
  const punkte = [];
  for (const l of logs.filter(istKraft).sort((a, b) => a.date.localeCompare(b.date))) {
    const e = (l.lifts || []).find(x => x.lift === liftId);
    if (!e || !(e.weight > 0)) continue;
    // Naechstgelegene Wiegung statt Interpolation: die Waage misst
    // ohnehin nur an den Tagen, an denen man draufsteht.
    let nah = null, dist = Infinity;
    for (const w of reihe) {
      const d = Math.abs(new Date(w.date) - new Date(l.date));
      if (d < dist) { dist = d; nah = w; }
    }
    if (!nah || !(nah.schnitt > 0) || dist > 14 * 86400000) continue;
    punkte.push({ date: l.date, weight: Math.round((e.weight / nah.schnitt) * 1000) / 1000 });
  }
  return punkte;
}

/**
 * Wann bist du wieder da, wo du vor der Pause warst.
 *
 * Die Rate kommt aus einer Ausgleichsgeraden ueber die letzten Wochen,
 * nicht aus "erster gegen letzten Wert" — dieselbe Ueberlegung wie bei
 * abnehmRate: zwei Einzelpunkte machen aus einer zaehen Woche eine
 * Trendwende.
 */
export function hochrechnung(logs = [], config = {}, heute = new Date(), tage = 56, state = {}) {
  const lifts = config.lifts || {};
  // Der Stand kommt aus `state`, die Rate aus den Logs. Das ist kein
  // Schoenheitsfehler, sondern die Trennung von Zustand und Verlauf: der
  // state traegt das Gewicht, mit dem du das naechste Mal antrittst, und
  // genau das zeigt die App auch auf dem Startbildschirm. Kaeme `aktuell`
  // hier aus dem letzten Log, stuenden in derselben Tour zwei
  // verschiedene Zahlen fuer dieselbe Sache.
  const stand = arbeitsGewichte(state);
  const ab = new Date(heute); ab.setDate(ab.getDate() - tage);
  const kraft = logs.filter(istKraft).sort((a, b) => a.date.localeCompare(b.date));
  if (!kraft.length) return [];

  const out = [];
  for (const [id, def] of Object.entries(lifts)) {
    const alle = [];
    for (const l of kraft) {
      const e = (l.lifts || []).find(x => x.lift === id);
      if (e && e.weight > 0) alle.push({ date: l.date, weight: e.weight });
    }
    if (!alle.length) continue;

    const aktuell = stand[id] > 0 ? stand[id] : alle[alle.length - 1].weight;
    const ziel = def.reference > 0 ? def.reference : null;

    // "Erreicht" heisst gehoben, nicht zugeteilt. Der Automat kann ein
    // Gewicht vergeben, das noch unter der Stange bewiesen werden muss —
    // und nach einer Anpassung von Hand kann er weit vorauslaufen. Wer
    // sich sagen laesst, er sei wieder bei seinem alten Bestwert, ohne
    // ihn gehoben zu haben, bekommt ein Lob fuer nichts.
    const erst = ziel ? alle.find(p => p.weight >= ziel) : null;
    if (erst) {
      out.push({ lift: id, lage: 'erreicht', aktuell, ziel, seit: erst.date });
      continue;
    }

    const p = alle.filter(x => new Date(x.date) >= ab);
    if (p.length < 4) { out.push({ lift: id, lage: 'zuWenig', aktuell, ziel, punkte: p.length }); continue; }

    const t0 = new Date(p[0].date).getTime();
    const xs = p.map(x => (new Date(x.date).getTime() - t0) / 86400000);
    const ys = p.map(x => x.weight);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const nenner = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    if (!nenner) { out.push({ lift: id, lage: 'zuWenig', aktuell, ziel, punkte: n }); continue; }
    const proTag = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / nenner;
    const proWoche = Math.round(proTag * 7 * 100) / 100;

    if (!ziel) { out.push({ lift: id, lage: 'keinZiel', aktuell, proWoche, punkte: n }); continue; }
    if (proWoche <= 0) { out.push({ lift: id, lage: 'steht', aktuell, ziel, proWoche, punkte: n }); continue; }

    const wochen = Math.ceil((ziel - aktuell) / proWoche);
    const wann = new Date(heute); wann.setDate(wann.getDate() + wochen * 7);
    out.push({
      lift: id, lage: 'laeuft', aktuell, ziel, proWoche, punkte: n,
      wochen, datum: wann.toISOString().slice(0, 10)
    });
  }
  return out;
}

/**
 * Wo es klemmt — bevor der Deload-Zaehler es meldet.
 *
 * Drei Fehlversuche loesen den Deload aus. Bis dahin sieht man nur die
 * einzelne Einheit; dass ein Gewicht seit fuenf Einheiten steht oder
 * dass regelmaessig der letzte Satz fehlt, faellt erst im Rueckblick auf.
 */
export function plateaus(logs = [], state = {}, config = {}) {
  const kraft = logs.filter(istKraft).sort((a, b) => a.date.localeCompare(b.date));
  const out = [];

  for (const id of Object.keys(config.lifts || {})) {
    const eintraege = [];
    for (const l of kraft) {
      const e = (l.lifts || []).find(x => x.lift === id);
      if (e) eintraege.push({ date: l.date, ...e });
    }
    if (!eintraege.length) continue;

    const fehl = eintraege.filter(e => e.success === false).length;

    // Bewusst ueber die einzelnen SAETZE und nicht ueber die Einheiten:
    // "Einheit geschafft, ja oder nein" steht schon als fehlQuote da, das
    // ein zweites Mal zu zaehlen sagt nichts Neues. Interessant ist, wie
    // knapp es war — vier von fuenf Saetzen ist eine andere Lage als zwei
    // von fuenf, und beides zaehlt als ein Fehlversuch.
    let saetze = 0, getroffen = 0;
    for (const e of eintraege) {
      if (!Array.isArray(e.reps) || !(e.target > 0)) continue;   // alte Logs ohne Ziel
      saetze += e.sets || e.reps.length;
      getroffen += e.reps.filter(r => r >= e.target).length;
    }

    // Wie viele Einheiten in Folge dasselbe Gewicht steht, vom Ende her.
    const letztes = eintraege[eintraege.length - 1].weight;
    let steht = 0;
    for (let i = eintraege.length - 1; i >= 0 && eintraege[i].weight === letztes; i--) steht++;

    out.push({
      lift: id,
      einheiten: eintraege.length,
      fehl,
      fehlQuote: Math.round((fehl / eintraege.length) * 100),
      saetze, getroffen,
      satzQuote: saetze ? Math.round((getroffen / saetze) * 100) : null,
      gewicht: letztes,
      stehtSeit: steht,
      offeneFails: (state.lifts && state.lifts[id] && state.lifts[id].fails) || 0,
      seit: eintraege[eintraege.length - steht].date
    });
  }
  return out.sort((a, b) => b.stehtSeit - a.stehtSeit);
}
