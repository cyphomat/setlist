// Reine Programmlogik: 5x5-Automat. Kein I/O, keine DOM-Zugriffe.
// Alles hier ist deterministisch und aus config + logs reproduzierbar.

export function roundTo(weight, step) {
  return Math.round(weight / step) * step;
}

/** Startzustand allein aus der Programmdefinition. */
export function initialState(config) {
  const lifts = {};
  for (const [id, l] of Object.entries(config.lifts)) {
    lifts[id] = { weight: l.start, fails: 0 };
  }
  return {
    version: 1,
    derivedFrom: 0,
    updated: new Date(0).toISOString(),
    next: config.firstWorkout,
    lifts,
    history: []
  };
}

/**
 * Sind alle Saetze einer Uebung erfasst?
 *
 * Bewusst eine Schleife ueber die Indizes statt `done.every(...)`: `done`
 * ist ein duenn besetztes Array, sobald ein Satz wieder abgewaehlt wird
 * (`delete` hinterlaesst ein Loch, ohne die Laenge zu aendern). `every` und
 * `map` ueberspringen solche Loecher stillschweigend — die Uebung galt
 * dadurch als vollstaendig, obwohl ein Satz fehlte, und das Loch landete
 * als `null` im Log, wo es als erfuellt durchging. Das Gewicht stieg dann
 * fuer einen Satz, den man gerade ausdruecklich zurueckgenommen hatte.
 */
export function saetzeVollstaendig(done, sets) {
  if (!Array.isArray(done) || !(sets > 0)) return false;
  for (let i = 0; i < sets; i++) {
    if (done[i] === undefined || done[i] === null) return false;
  }
  return true;
}

/**
 * Die erfassten Wiederholungen als dichte Liste — ein nicht erfasster Satz
 * wird zur Null, nicht zu einem Loch. Aus demselben Grund wie oben: ueber
 * Loecher laeuft keine Pruefung, sie faerben sich still als erfuellt.
 */
export function saetzeAlsListe(done, sets) {
  const out = [];
  for (let i = 0; i < sets; i++) {
    const r = Array.isArray(done) ? done[i] : undefined;
    out.push(r === undefined || r === null ? 0 : r);
  }
  return out;
}

/** Hat der Satz-Verlauf das Ziel erfuellt? */
export function isSuccess(entry, target) {
  return entry.reps.length === entry.sets && entry.reps.every(r => r >= target);
}

/**
 * Eine Einheit auf den Zustand anwenden.
 * Erfolg  -> Gewicht + Steigerung, Fehlerzaehler auf 0
 * Fehler  -> Gewicht bleibt, Fehlerzaehler + 1
 * 3 Fehler-> Deload auf 90 %, Fehlerzaehler auf 0
 */
export function applyLog(state, config, log) {
  const next = JSON.parse(JSON.stringify(state)); // bewusst kein structuredClone: aeltere iOS-Safari kennen es nicht

  // Eine Anpassung setzt Arbeitsgewichte ausdruecklich neu — etwa wenn der
  // Wiedereinstieg zu vorsichtig angesetzt war. Sie steht als Log-Datei da
  // und ist damit reproduzierbar; state.json direkt zu ueberschreiben wuerde
  // die Ableitbarkeit zerstoeren, auf der alles andere aufbaut.
  if (log.type === 'anpassung') {
    for (const [id, gewicht] of Object.entries(log.gewichte || {})) {
      const l = next.lifts[id];
      if (!l || !gewicht) continue;
      l.weight = Math.max(config.bar, roundTo(gewicht, config.rounding));
      l.fails = 0;
      // Ein Ziel oberhalb des neuen Gewichts eroeffnet den Rueckweg: bis
      // dorthin steigt jede erfolgreiche Einheit doppelt. Das Ziel steht im
      // Log, nicht nur im Zustand — sonst ginge es beim Neuberechnen verloren.
      const ziel = log.ziele && log.ziele[id];
      if (ziel > l.weight) l.rueckweg = roundTo(ziel, config.rounding);
      else delete l.rueckweg;
    }
    next.updated = new Date().toISOString();
    next.history = [...(next.history || []),
      { date: log.date, type: 'anpassung', grund: log.grund || '' }].slice(-100);
    return next;                                    // A/B-Wechsel unberuehrt
  }

  // Ein Max-Out ist ein Krafttest, kein Programmschritt. Er dreht den
  // A/B-Wechsel nicht weiter. Nur wenn du das Ergebnis ausdruecklich
  // uebernimmst, steht das im Log — und ist damit reproduzierbar.
  if (log.type === 'maxout') {
    // Ein Max-Out auf einen Pruefwert traegt `check` statt `lift`: Klimmzug,
    // Dip oder einseitige Arbeit haben kein Arbeitsgewicht, das steigen
    // koennte. Die Unterscheidung liegt im Feldnamen und nicht in einer
    // Abfrage, damit ein solcher Test die Progression per Bauart nicht
    // anfassen kann.
    const l = log.lift ? next.lifts[log.lift] : null;
    if (l && log.newWorking) {
      l.weight = Math.max(config.bar, roundTo(log.newWorking, config.rounding));
      l.fails = 0;
      delete l.rueckweg;
    }
    next.updated = new Date().toISOString();
    const eintrag = { date: log.date, type: 'maxout', weight: log.weight, reps: log.reps };
    if (log.check) eintrag.check = log.check; else eintrag.lift = log.lift;
    next.history = [...(next.history || []), eintrag].slice(-100);
    return next;
  }

  // Ein WOD ist Beiwerk, kein Programmschritt: es taucht in der Historie auf,
  // darf aber weder Arbeitsgewichte noch den A/B-Wechsel anfassen. Sonst
  // wuerde eine Spasseinheit die Progression verschieben.
  if (log.type && log.type !== 'strength') {
    next.updated = new Date().toISOString();
    next.history = [...(next.history || []), { date: log.date, type: log.type, label: log.label || 'WOD' }].slice(-100);
    return next;
  }

  for (const entry of log.lifts) {
    const def = config.lifts[entry.lift];
    const cur = next.lifts[entry.lift];
    if (!def || !cur) continue;

    if (entry.success) {
      // Auf dem Rueckweg nach einer Pause der doppelte Schritt, aber nie
      // ueber das Gewicht vor der Pause hinaus: verlorene Kraft kommt
      // schneller zurueck als neue entsteht — neue bleibt beim normalen Tempo.
      const schritt = cur.rueckweg ? def.increment * 2 : def.increment;
      let neu = roundTo(entry.weight + schritt, config.rounding);
      if (cur.rueckweg) {
        if (neu >= cur.rueckweg) { neu = Math.max(cur.rueckweg, roundTo(entry.weight + def.increment, config.rounding)); delete cur.rueckweg; }
      }
      cur.weight = neu;
      cur.fails = 0;
    } else {
      // Ein Fehlversuch heisst: der Rueckweg war zu schnell. Ab hier gilt
      // wieder die normale Mechanik mit Fehlerzaehler und Deload.
      delete cur.rueckweg;
      cur.fails += 1;
      if (cur.fails >= config.deload.afterFails) {
        cur.weight = Math.max(config.bar, roundTo(entry.weight * config.deload.factor, config.rounding));
        cur.fails = 0;
      }
    }
  }
  next.next = log.workout === 'A' ? 'B' : 'A';
  next.derivedFrom = (next.derivedFrom || 0) + 1;
  next.updated = new Date().toISOString();
  next.history = [...(next.history || []), { date: log.date, workout: log.workout, type: 'strength' }].slice(-100);
  return next;
}

/* ===================================================================
   Deload nach einer Pause.

   Faustregeln aus der Trainingspraxis, keine Messwerte an einer Person:
   Maximalkraft haelt sich in den ersten zwei Wochen ohne Training
   weitgehend, danach geht es spuerbar bergab, nach sechs Wochen sind
   auch Technik und Sehnen wieder ein Thema. Die Stufen folgen dem.

   Gezaehlt wird ab der letzten KRAFTeinheit. Jam, Unplugged und Max-Out
   setzen keinen Reiz, der das 5x5-Gewicht an der Stange haelt.        */

/** Ab so vielen Tagen gilt eine Luecke als Pause — auch fuer die Ansage. */
export const PAUSE_AB = 14;

export const PAUSE_STUFEN = [
  { ab: 42, faktor: 0.7 },
  { ab: 21, faktor: 0.8 },
  { ab: PAUSE_AB, faktor: 0.9 }   // derselbe Faktor wie der Deload nach Fehlversuchen
];

const tageZwischen = (von, bis) =>
  Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / 86400000);

/**
 * Der Vorschlag nach einer Pause — oder null.
 *
 * Null heisst: keine Krafteinheit bisher (die Ersteinrichtung ist keine
 * Pause), die Luecke ist kuerzer als PAUSE_AB, oder fuer diese Pause wurde
 * schon angepasst. Letzteres ist der wichtige Fall: wer den Vorschlag
 * uebernimmt und die Einheit dann abbricht, steht beim naechsten Start vor
 * derselben Pause und bekaeme sonst ein zweites Mal -10 %.
 */
export function pausenDeload(state, config, heute = new Date()) {
  const hist = (state && state.history) || [];
  let letzteKraft = -1;
  for (let i = hist.length - 1; i >= 0; i--) {
    if (hist[i].type === 'strength') { letzteKraft = i; break; }
  }
  if (letzteKraft < 0) return null;
  if (hist.slice(letzteKraft + 1).some(h => h.type === 'anpassung')) return null;

  const seit = hist[letzteKraft].date;
  const tage = tageZwischen(seit, ymd(heute));
  const stufe = PAUSE_STUFEN.find(s => tage >= s.ab);
  if (!stufe) return null;

  const bar = config.bar || 20;
  const schritt = config.rounding || 2.5;
  const gewichte = {};
  for (const id of Object.keys(config.lifts || {})) {
    const l = state.lifts && state.lifts[id];
    if (!l || !(l.weight > 0)) continue;
    // Abwaerts runden: ein Deload, der durch Rundung kleiner ausfaellt als
    // angesagt, ist keiner.
    const nachher = Math.max(bar, Math.floor((l.weight * stufe.faktor + 1e-9) / schritt) * schritt);
    if (nachher < l.weight) gewichte[id] = { vorher: l.weight, nachher };
  }
  if (!Object.keys(gewichte).length) return null;

  return {
    tage, seit,
    faktor: stufe.faktor,
    prozent: Math.round((1 - stufe.faktor) * 100),
    gewichte
  };
}

/** Aus dem Vorschlag der Log-Eintrag, der ihn umsetzt. */
export function pausenAnpassung(vorschlag, heute = new Date()) {
  const gewichte = {}, ziele = {};
  for (const [id, g] of Object.entries(vorschlag.gewichte)) {
    gewichte[id] = g.nachher;
    ziele[id] = g.vorher;
  }
  return {
    date: ymd(heute),
    type: 'anpassung',
    grund: 'pause',
    tage: vorschlag.tage,
    faktor: vorschlag.faktor,
    finished: heute.toISOString(),
    gewichte, ziele
  };
}

/** Vollstaendige Neuberechnung aus allen Logs — die tragende Invariante. */
export function deriveState(config, logs) {
  // Bei gleichem Datum entscheidet die Uhrzeit. Ohne diesen Stichentscheid
  // haengt das Ergebnis von der Dateireihenfolge ab — und eine Anpassung am
  // selben Tag wuerde je nach Zufall vor oder nach der Einheit greifen.
  const zeit = l => l.finished || l.started || '';
  const sorted = [...logs].sort((a, b) =>
    a.date.localeCompare(b.date) || zeit(a).localeCompare(zeit(b)));
  return sorted.reduce((s, log) => applyLog(s, config, log), initialState(config));
}

/** Was steht heute an? Gewichte aus dem aktuellen Zustand. */
export function planWorkout(state, config, which = state.next) {
  return {
    workout: which,
    lifts: config.workouts[which].map(slot => ({
      lift: slot.lift,
      name: config.lifts[slot.lift].name,
      weight: state.lifts[slot.lift].weight,
      sets: slot.sets,
      reps: slot.reps,
      fails: state.lifts[slot.lift].fails
    }))
  };
}

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** ISO-Wochennummer, weil der Plan wochenweise gedacht ist. */
export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - start) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Montag der Woche, in der d liegt. */
export function mondayOf(d) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

// Ein fester Montag als Nullpunkt. Welcher, ist gleichgueltig — er muss nur
// nie wieder wandern, sonst verschiebt sich die Radrotation rueckwirkend.
const RAD_EPOCHE = new Date(1970, 0, 5);

/**
 * Die wievielte Kalenderwoche seit dem Nullpunkt. Ueber den Absolutabstand
 * gerundet, damit die Sommerzeit-Stunde nicht danebenhaut.
 */
function wocheSeitEpoche(monday) {
  return Math.round((monday - RAD_EPOCHE) / 604800000);
}

/**
 * Die Woche wird nicht gespeichert, sondern aus config + state erzeugt.
 * Damit kann sie nie mit dem Zustand auseinanderlaufen.
 *
 * Welche Radeinheit ansteht, haengt am Kalender, nicht an der Historie:
 * frueher zaehlte `state.history.length` mit, also verschob jede geloggte
 * Krafteinheit die Radeinheit desselben Dienstags. Der Plan fuer ein festes
 * Datum aenderte sich damit rueckwirkend — und weil `fehlendeEvents` beim
 * Abgleich mit intervals.icu ersatzweise ueber Datum plus Name geht, legte
 * "Plan in Kalender" danach einen zweiten Eintrag fuer denselben Tag an.
 */
export function planWeek(state, config, today = new Date()) {
  const monday = mondayOf(today);
  const todayKey = ymd(today);
  let workout = state.next;

  // Eine von Hand geschriebene config.json ist selten vollstaendig. Fehlt
  // die Wochenplanung, ist das kein Grund, den ganzen Startbildschirm
  // sterben zu lassen — dann steht die Woche eben leer und alles andere
  // funktioniert weiter. Ohne Radeinheiten im Vorrat werden Radslots
  // uebersprungen statt an einer leeren Liste zu scheitern.
  const slots = (config.week && Array.isArray(config.week.slots)) ? config.week.slots : [];
  const rides = Array.isArray(config.rides) ? config.rides : [];

  // Der Startpunkt der Radrotation kommt aus der Kalenderwoche, nicht aus
  // der Historie — sonst verschiebt jede geloggte Krafteinheit die
  // Radeinheit desselben Dienstags.
  let radIndex = wocheSeitEpoche(monday) *
    (slots.filter(s => s && s.type === 'ride').length || 1);

  return slots.filter(slot => slot && (slot.type !== 'ride' || rides.length)).map(slot => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + (slot.day - 1));
    const key = ymd(date);
    // Nur Krafteinheiten kommen aus der eigenen Historie. Ob eine Radeinheit
    // gefahren wurde, weiss allein intervals.icu — sonst haekelt eine
    // Krafteinheit am Dienstag die Radeinheit desselben Tages ab.
    const done = slot.type === 'strength' &&
      (state.history || []).some(h => h.date === key && (h.type || 'strength') === 'strength');

    const item = {
      date: key,
      day: DAYS[date.getDay()],
      // Zusaetzlich als Zahl, damit die Oberflaeche den Tag in der
      // gewaehlten Sprache beschriften kann. `day` bleibt, weil der
      // Zustand und die Tests darauf aufbauen.
      tagNr: date.getDay(),
      type: slot.type,
      isToday: key === todayKey,
      isPast: key < todayKey,
      done
    };

    if (slot.type === 'strength') {
      item.label = `Workout ${workout}`;
      item.detail = config.workouts[workout].map(s => config.lifts[s.lift].name).join(' · ');
      item.workout = workout;
      if (!done) workout = workout === 'A' ? 'B' : 'A';
    } else {
      const n = rides.length;
      const ride = rides[((radIndex++ % n) + n) % n];
      item.label = ride.label;
      item.detail = ride.detail;
    }
    return item;
  });
}

export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtWeight(w) {
  return (Number.isInteger(w) ? w : w.toFixed(1)) + ' kg';
}

/**
 * Geschaetztes Einer-Maximum. Brzycki liegt im Bereich 2-6 Wiederholungen
 * naeher, Epley darueber — deshalb wird umgeschaltet statt eine Formel fuer
 * alles zu benutzen. Ueber 12 Wiederholungen wird jede Schaetzung Kaffeesatz,
 * dann gibt es bewusst keine.
 */
export function e1rm(weight, reps) {
  if (!weight || !reps || reps < 1 || reps > 12) return null;
  if (reps === 1) return weight;
  const wert = reps <= 6
    ? weight * 36 / (37 - reps)          // Brzycki
    : weight * (1 + reps / 30);          // Epley
  return Math.round(wert * 10) / 10;
}

/** Welche Formel steckt dahinter — damit die App nicht orakelt. */
export function e1rmFormel(reps) {
  if (!reps || reps < 1 || reps > 12) return null;
  return reps === 1 ? 'gemessen' : reps <= 6 ? 'Brzycki' : 'Epley';
}

/** Arbeitsgewicht fuer 5x5 aus einem Maximum. Konservativ mit 80 %. */
export function arbeitsgewichtAus(max1rm, rounding = 2.5, bar = 20) {
  if (!max1rm) return null;
  return Math.max(bar, roundTo(max1rm * 0.8, rounding));
}

/* ---------------------------------------------------------------
   Plattenrechner. Rechnen zwischen zwei Sätzen ist die häufigste
   Quelle für falsch beladene Stangen — und im Studio steht man
   ohnehin schon unter Zeitdruck.                                  */

export const STANDARD_SCHEIBEN = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Die Scheiben, die ueberall liegen.
 *
 * 20/10/5/2,5/1,25 ist die durchgehend halbierbare Reihe — wer olympische
 * Scheiben hat, hat diese fuenf. 25er und 15er gibt es auch, aber eben
 * nicht in jedem Studio, und genau daran scheitert ein Plattenplan, der
 * 25+15 sagt, wenn an der Stange nur 20er liegen.
 *
 * Deshalb steht die Alternative daneben, statt sie je Studio einstellbar
 * zu machen: welche Scheiben gerade da sind, sieht man schneller, als man
 * es pflegen wuerde.
 */
export const GAENGIGE_SCHEIBEN = [20, 10, 5, 2.5, 1.25];

/**
 * Scheiben pro Seite, absteigend. Gibt null zurück, wenn sich das
 * Gewicht mit den vorhandenen Scheiben nicht exakt laden lässt —
 * lieber ehrlich nichts anzeigen als eine Zahl erfinden.
 */
export function platten(gewicht, config = {}) {
  const bar = config.bar || 20;
  const vorrat = [...(config.plates || STANDARD_SCHEIBEN)].sort((a, b) => b - a);
  if (gewicht < bar) return null;
  if (gewicht === bar) return [];

  let rest = Math.round(((gewicht - bar) / 2) * 1000) / 1000;
  const out = [];
  for (const p of vorrat) {
    while (rest >= p - 1e-9) {
      out.push(p);
      rest = Math.round((rest - p) * 1000) / 1000;
    }
  }
  return rest < 1e-9 ? out : null;
}

/** "2×20 + 5 + 2,5" — kurz genug für eine Zeile unter der Übung. */
/**
 * Dieselbe Last nur aus den gaengigen Scheiben — oder null.
 *
 * Null heisst eines von beidem: Die Hauptloesung kommt ohnehin schon ohne
 * 25er und 15er aus (dann waere eine zweite Zeile dieselbe Zeile), oder
 * aus den vorhandenen gaengigen Scheiben laesst sich die Last gar nicht
 * bilden. In beiden Faellen gibt es nichts zu zeigen — es braucht also
 * keinen Schwellenwert, ab dem sich die Alternative "lohnt".
 */
export function plattenGaengig(gewicht, config = {}) {
  const haupt = platten(gewicht, config);
  if (!haupt || !haupt.length) return null;
  const vorrat = [...(config.plates || STANDARD_SCHEIBEN)].filter(p => GAENGIGE_SCHEIBEN.includes(p));
  if (!vorrat.length) return null;
  const rein = platten(gewicht, { ...config, plates: vorrat });
  if (!rein || !rein.length) return null;
  return rein.join() === haupt.join() ? null : rein;
}

/** Text der Alternative, oder null. */
export function plattenGaengigText(gewicht, config = {}) {
  const p = plattenGaengig(gewicht, config);
  return p ? alsText(p) : null;
}

/** Aus einer Scheibenliste "2×20 + 5". */
function alsText(p) {
  const zaehler = new Map();
  for (const g of p) zaehler.set(g, (zaehler.get(g) || 0) + 1);
  return [...zaehler].map(([g, n]) => (n > 1 ? `${n}×${g}` : `${g}`)).join(' + ');
}

export function plattenText(gewicht, config = {}) {
  const p = platten(gewicht, config);
  if (p === null) return null;
  if (!p.length) return 'leere Stange';
  return alsText(p);
}

/**
 * Aufwärmsätze zum Arbeitsgewicht. Absteigende Wiederholungen bei
 * steigender Last: warm werden, ohne vor dem ersten Arbeitssatz
 * schon Körner zu lassen.
 */
export function waermsaetze(arbeit, config = {}) {
  const bar = config.bar || 20;
  const step = config.rounding || 2.5;
  const saetze = [{ weight: bar, reps: 5, saetze: 2, anteil: 0 }];
  if (arbeit <= bar + step) return saetze;

  for (const [anteil, reps] of [[0.55, 5], [0.7, 3], [0.85, 2]]) {
    const w = Math.max(bar, roundTo(arbeit * anteil, step));
    if (w >= arbeit) continue;
    if (saetze.some(s => s.weight === w)) continue;
    saetze.push({ weight: w, reps, saetze: 1, anteil });
  }
  return saetze;
}

/**
 * Wattbereich aus FTP-Anteilen. "88-93 % FTP" ist eine Anweisung,
 * "205-217 W" ist eine Zahl, die man am Rad einstellen kann.
 */
export function wattBereich(anteile, eftp) {
  if (!eftp || !Array.isArray(anteile) || anteile.length !== 2) return null;
  const von = Math.round(eftp * anteile[0]);
  const bis = Math.round(eftp * anteile[1]);
  return von === bis ? `${von} W` : `${von}–${bis} W`;
}
