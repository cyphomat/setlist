// Leitet aus dem tatsaechlichen Zustand ab, was heute ansteht und in welchem
// Ton. Reine Funktionen, kein I/O — damit testbar, und damit die App nie
// etwas behauptet, das nicht aus deinen Daten folgt.

import { VOICE } from './content.js';
import { t, tn, locale } from './i18n.js';
import { mondayOf, ymd, PAUSE_AB } from './program.js';
import { pausenFenster, wocheInPause } from './verletzung.js';

export function daysSince(dateStr, today = new Date()) {
  if (!dateStr) return null;
  const a = new Date(dateStr + 'T00:00:00');
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((b - a) / 86400000);
}

/** Wie viele Wochen am Stueck mit mindestens einer Einheit? */
export function weekStreak(history = [], today = new Date(), fenster = []) {
  return serienStand(history, today, fenster).wochen;
}

/**
 * Die laufende Serie und ob sie gerade pausiert.
 *
 * Eine Woche ohne Einheit reisst die Serie — es sei denn, sie faellt in ein
 * Pausenfenster einer Verletzung (verletzung.js). Dann zaehlt sie nicht mit,
 * reisst aber auch nichts. `pausiert` nennt das Fenster, wenn die Serie
 * genau jetzt deswegen stillsteht. Eine Anpassung ist kein Training und
 * haelt keine Serie am Leben.
 */
export function serienStand(history = [], today = new Date(), fenster = []) {
  const zaehlt = history.filter(h => h && h.date && h.type !== 'anpassung');
  if (!zaehlt.length) return { wochen: 0, pausiert: null };
  const wochen = new Set(zaehlt.map(h => isoWeekKey(new Date(h.date + 'T00:00:00'))));
  let n = 0, pausiert = null;
  const cursor = new Date(today);
  // Die laufende Woche zaehlt nur mit, wenn schon trainiert wurde — fehlt
  // sie, ist das noch keine Luecke.
  for (let i = 0; i < 1000; i++) {
    if (wochen.has(isoWeekKey(cursor))) n++;
    else {
      const p = wocheInPause(ymd(mondayOf(cursor)), fenster);
      if (p) { if (!n && !pausiert) pausiert = p; }
      else if (i > 0) break;
    }
    cursor.setDate(cursor.getDate() - 7);
  }
  return { wochen: n, pausiert: n ? pausiert : null };
}

function isoWeekKey(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-${Math.ceil(((t - start) / 86400000 + 1) / 7)}`;
}

/**
 * Wie weit zurueck auf dem Weg zu den alten Arbeitsgewichten?
 * Das ist die Zahl, die nach einer Pause wirklich motiviert —
 * nicht das absolute Gewicht.
 */
export function progressToReference(state, config) {
  const perLift = {};
  let summe = 0, n = 0;
  for (const [id, def] of Object.entries(config.lifts)) {
    if (!def.reference) continue;
    const anteil = Math.min(1, state.lifts[id].weight / def.reference);
    perLift[id] = { anteil, jetzt: state.lifts[id].weight, ziel: def.reference };
    summe += anteil; n++;
  }
  return { gesamt: n ? summe / n : 0, perLift };
}

/**
 * Stabil ueber den Tag: derselbe Spruch bei jedem Neuzeichnen. Die
 * Bit-Lawine (siehe mische() weiter unten) ist hier ebenso noetig wie
 * bei spruchWaehlen — ohne sie liegt bei kurzen Listen (Technik,
 * Encore, Mobility haben je 5 Eintraege, und 31 ist kongruent 1 mod 5)
 * die Auswahl nur um die Quersumme der Zeichen fest, und Tag fuer Tag
 * kommt praktisch derselbe Eintrag wieder statt einer echten Streuung.
 */
function pick(list, seed) {
  if (!list || !list.length) return '';
  return list[mische(hash(seed)) % list.length];
}

/**
 * Die eine Aussage, die oben steht: Wo stehst du, was will der Tag,
 * und in welchem Ton wird das gesagt.
 */
export function directive(state, config, today = new Date(), letzterLog = null, stimme = null, erholung = null, fahrten = []) {
  const hist = state.history || [];
  const letzte = hist.length ? hist[hist.length - 1].date : null;
  const tage = daysSince(letzte, today);
  // Eine Woche nur auf dem Rad haelt die Serie genauso wie eine im Studio —
  // dieselbe Rechnung wie der Rekord in der Tour und der Merch-Stand.
  const radTage = (fahrten || []).filter(f => f && f.date).map(f => ({ date: f.date }));
  const serie = serienStand(hist.concat(radTage), today, pausenFenster(config, ymd(today)));
  const streak = serie.wochen;
  const fortschritt = progressToReference(state, config);
  const workout = state.next;
  const lifts = config.workouts[workout].map(s => s.lift);
  const offeneFehler = lifts.filter(l => (state.lifts[l].fails || 0) > 0);
  const deloadGerade = !!letzterLog && Array.isArray(letzterLog.lifts) &&
    letzterLog.lifts.some(e => state.lifts[e.lift] && state.lifts[e.lift].weight < e.weight);

  let situation, kopf;
  // Dieselbe Schwelle wie der Deload nach einer Pause (program.js): die
  // erste Einheit nach einer echten Pause ist TECHNIK, egal ob die Gewichte
  // um zehn oder zwanzig Prozent zurueckgenommen wurden.
  if (tage === null || tage >= PAUSE_AB) {
    situation = 'comeback';
    kopf = tage === null ? t('coach.kopf.erste') : t('coach.kopf.weg', { n: tage });
  } else if (deloadGerade) {
    situation = 'nachDeload';
    kopf = t('coach.kopf.deload');
  } else if (offeneFehler.length) {
    situation = 'nachFehlversuch';
    kopf = t('coach.kopf.rechnung', { name: config.lifts[offeneFehler[0]].name });
  } else if (streak >= 4) {
    situation = 'streak';
    kopf = t('coach.kopf.serie', { n: streak });
  } else if (fortschritt.gesamt < 0.7) {
    situation = 'leicht';
    kopf = t('coach.kopf.aufbau');
  } else {
    situation = 'standard';
    kopf = tage === null ? t('coach.kopf.los')
         : tage === 0 ? t('coach.kopf.heute')
         : tage === 1 ? t('coach.kopf.gestern')
         : t('coach.kopf.zuletzt', { n: tage });
  }

  return {
    situation,
    kopf,
    spruch: spruchWaehlen(situation, toKey(today), stimme && stimme.sprueche),
    intensitaet: intensitaet(situation, workout, erholung),
    streak,
    streakPausiert: serie.pausiert,
    tageSeitLetzter: tage,
    fortschritt,
    erholung
  };
}

/**
 * Sagt klar an, was der Tag sein soll. Kein "je nach Gefühl" — außer die
 * Erholung selbst widerspricht dem: HRV oder Schlaf gehen vor Situation,
 * weil beide etwas sehen, das Fitness/Ermüdung (reine Trainingslast) nicht
 * erfasst. Deshalb zuerst geprüft, auch vor einer offenen Rechnung.
 */
// Das `label` (TECHNIK, SOLIDE, HART, SCHWER) ist ein Datenwert: es landet
// als `angesagt` in jeder Einheit, und "Ansage gegen Gefuehl" vergleicht
// damit. Es bleibt deshalb in jeder Sprache deutsch — uebersetzt wird nur
// die Anzeige (tonWort in app.js). Der Satz dazu ist reine Anzeige.
function intensitaet(situation, workout, erholung) {
  if (erholung && erholung.stufe === 'belastet') {
    return { stufe: 'technik', label: 'TECHNIK',
      text: t('coach.int.hrv', { hrv: erholung.hrv, basis: erholung.basis }) };
  }
  if (erholung && erholung.stufe === 'kurz') {
    return { stufe: 'technik', label: 'TECHNIK',
      text: t('coach.int.schlaf', { h: Number(erholung.schlafStunden).toLocaleString(locale()) }) };
  }
  if (situation === 'comeback' || situation === 'leicht' || situation === 'nachDeload') {
    return { stufe: 'technik', label: 'TECHNIK', text: t('coach.int.technik') };
  }
  if (situation === 'nachFehlversuch') {
    return { stufe: 'hart', label: 'HART', text: t('coach.int.hart') };
  }
  if (workout === 'B') {
    return { stufe: 'hart', label: 'SCHWER', text: t('coach.int.schwer') };
  }
  return { stufe: 'normal', label: 'SOLIDE', text: t('coach.int.solide') };
}

function toKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Deterministische Auswahl aus einer Liste, taeglich wechselnd. */
export function tagesAuswahl(list, today = new Date(), salz = '') {
  return pick(list, toKey(today) + salz);
}

/**
 * Mobility ist wochenweise gedacht statt an eine Trainingsart gebunden —
 * sie geht genauso gut daheim wie im Studio. Dran ist sie bei der ersten
 * Einheit (Kraft oder Jam) einer Kalenderwoche, egal an welchem Tag; alle
 * weiteren Einheiten derselben Woche lassen sie weg. Anpassungen und
 * Max-Outs zaehlen nicht als Einheit — sonst koennte eine reine
 * Gewichtskorrektur den Slot der Woche verbrauchen, ohne dass die
 * Mobility-Karte je zu sehen war.
 */
export function mobilityDran(state, today = new Date()) {
  const woche = isoWeekKey(today);
  const hist = state.history || [];
  return !hist.some(h =>
    (h.type === 'strength' || h.type === 'wod') && h.date &&
    isoWeekKey(new Date(h.date + 'T00:00:00')) === woche);
}

/** Gewichtstrend aus intervals.icu-Wellness. Rohdaten sind verrauscht. */
export function gewichtsTrend(punkte = []) {
  const clean = punkte.filter(p => p.weight).sort((a, b) => a.date.localeCompare(b.date));
  if (clean.length < 2) return clean.length ? { aktuell: clean[0].weight, delta: null, n: 1 } : null;
  const mittel = arr => arr.reduce((s, p) => s + p.weight, 0) / arr.length;
  const fenster = Math.min(7, Math.floor(clean.length / 2));
  const neu = mittel(clean.slice(-fenster));
  const alt = mittel(clean.slice(0, fenster));
  return {
    aktuell: Math.round(neu * 10) / 10,
    delta: Math.round((neu - alt) * 10) / 10,
    n: clean.length,
    von: clean[0].date,
    bis: clean[clean.length - 1].date
  };
}

/* ---------------------------------------------------------------
   Form aus intervals.icu. Form = Fitness minus Ermuedung (ctl-atl),
   der uebliche TSB-Wert. Bewusst nur ein Hinweis: die App kuerzt
   dir keine Gewichte eigenmaechtig, sie sagt dir, was sie sieht.  */

export function formLage(wellness) {
  if (!wellness || wellness.ctl == null || wellness.atl == null) return null;
  const form = Math.round(wellness.ctl - wellness.atl);

  let stufe, text;
  if (form >= 5) {
    stufe = 'frisch';
    text = t('coach.form.frisch');
  } else if (form >= -10) {
    stufe = 'neutral';
    text = t('coach.form.neutral');
  } else if (form >= -20) {
    stufe = 'muede';
    text = t('coach.form.muede');
  } else {
    stufe = 'platt';
    text = t('coach.form.platt');
  }

  return {
    form, stufe, text,
    fitness: Math.round(wellness.ctl),
    ermuedung: Math.round(wellness.atl),
    datum: wellness.date || null
  };
}

/**
 * Erholung aus HRV und Schlaf — beides aus intervals.icu, haeufig via
 * HealthFit aus Apple Health durchgereicht. Ein einzelner HRV-Rohwert
 * sagt fuer sich nichts, nur die Abweichung von der eigenen Grundlinie
 * zaehlt: die Basis ist der Schnitt der bis zu sieben Tage davor, nicht
 * ein allgemeiner Normwert. Schlafdauer ist dagegen auch absolut
 * aussagekraeftig. Sieht etwas, das Fitness/Ermuedung (reine
 * Trainingslast) nicht erfasst — Krankheit, Stress, eine kurze Nacht.
 */
export function erholung(wellness = []) {
  const clean = [...wellness].filter(w => w.hrv != null || w.sleepSecs != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!clean.length) return null;
  const heute = clean[clean.length - 1];

  const vorherigeHrv = clean.slice(0, -1).filter(w => w.hrv != null).slice(-7).map(w => w.hrv);
  const basis = vorherigeHrv.length >= 3
    ? Math.round(vorherigeHrv.reduce((s, v) => s + v, 0) / vorherigeHrv.length)
    : null;
  const hrv = heute.hrv != null ? Math.round(heute.hrv) : null;
  const schlafStunden = heute.sleepSecs != null ? Math.round(heute.sleepSecs / 360) / 10 : null;

  let stufe = 'ok';
  if (basis != null && hrv != null && hrv < basis * 0.85) stufe = 'belastet';
  else if (schlafStunden != null && schlafStunden < 6) stufe = 'kurz';

  return { stufe, hrv, basis, schlafStunden, datum: heute.date };
}

/* ---------------------------------------------------------------
   Interferenz zwischen Rad und Eisen. Die Forschungslage kurz:
   vier bis acht Stunden Abstand vermeiden die Stoerung weitgehend,
   Radfahren stoert weniger als Laufen, harte Intervalle treffen die
   Kraftausdauer deutlich und das Maximalkraftniveau kaum, und ab
   etwa 30 Minuten Umfang wird es ueberhaupt erst messbar.

   Die App warnt damit — sie kuerzt nichts. Der Sinn ist, dass ein
   zaeher Tag erklaerbar wird statt sich wie ein Rueckschritt
   anzufuehlen.                                                    */

function artDerFahrt(f) {
  const min = f.minutes || 0;
  const proMin = min > 0 && f.load ? f.load / min : 0;
  if (proMin >= 1.3 || (f.load >= 90 && min <= 75)) return 'hart';
  if (min >= 75) return 'lang';
  return 'locker';
}

export function interferenz(fahrten = [], jetzt = new Date()) {
  const mitZeit = fahrten
    .filter(f => f.zeit)
    .map(f => ({ ...f, ts: new Date(f.zeit) }))
    .filter(f => !isNaN(f.ts) && f.ts <= jetzt)
    .sort((a, b) => b.ts - a.ts);
  if (!mitZeit.length) return null;

  const f = mitZeit[0];
  const stunden = Math.round(((jetzt - f.ts) / 3600000) * 10) / 10;
  if (stunden > 24) return null;

  const art = artDerFahrt(f);
  const gerundet = Math.round(stunden);

  if (art === 'locker' && stunden >= 4) return null;

  const vor = () => tn('coach.stoer.vor', gerundet, { art: t(`coach.stoer.art.${art === 'hart' ? 'hart' : 'lang'}`) });
  if (stunden < 4 && art !== 'locker') {
    return { stufe: 'stark', stunden, art, fahrt: f, text: `${vor()} ${t('coach.stoer.stark')}` };
  }
  if (stunden < 8 && art !== 'locker') {
    return { stufe: 'leicht', stunden, art, fahrt: f, text: `${vor()} ${t('coach.stoer.leicht')}` };
  }
  if (stunden < 4) {
    return { stufe: 'gering', stunden, art, fahrt: f, text: tn('coach.stoer.gering', gerundet) };
  }
  return null;
}

/* ---------------------------------------------------------------
   Deine eigene Stimme. Alles Bisherige stammt von mir — das erzeugt
   dieses leicht Fremde. `stimme.json` im privaten Repo gehoert dir:
   was dort steht, hat Vorrang. Meine Zeilen sind nur die Rueckfall-
   ebene fuer Situationen, fuer die du noch nichts geschrieben hast. */

function hash(text) {
  let h = 0;
  for (const c of String(text)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Bit-Lawine. Noetig, weil h*31+c in den untersten Bits linear ist: die
 * Paritaet von hash(x) und hash(salz+x) haengt fest zusammen, egal wo man
 * salzt. Ohne diesen Schritt waeren Muenzwurf und Auswahl gekoppelt — und
 * von zwei eigenen Zeilen erschiene immer nur dieselbe.
 */
function mische(h) {
  h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export function spruchWaehlen(situation, tag, eigene) {
  const meine = VOICE[situation] || [];
  const seine = (eigene && (eigene[situation] || eigene.alle)) || [];
  if (!seine.length && !meine.length) return '';
  // Eine Lawine, zwei Entscheidungen aus verschiedenen Bits: das unterste
  // fuer den Muenzwurf, die oberen fuer die Auswahl. Der rohe Hash klumpt
  // bei fortlaufenden Daten — dann kaeme dreimal hintereinander dasselbe.
  const h = mische(hash(tag + situation));
  const wahl = (liste) => liste[(h >>> 8) % liste.length];

  if (!seine.length) return wahl(meine);
  if (!meine.length) return wahl(seine);

  // Mischen statt ersetzen. Nicht ueber die Poolgroesse, sondern ueber eine
  // Muenze: sonst gingen zwei eigene Zeilen zwischen dreissig fremden unter,
  // und genau die eigenen sind der Grund, warum sich das nach jemandem
  // anfuehlt statt nach Software.
  return (h & 1) ? wahl(seine) : wahl(meine);
}

/* ---------------------------------------------------------------
   Meilensteine. Die App kennt deine Bestleistungen samt Datum und
   sagt nichts dazu. Das sind die Saetze, die nur DEINE App sagen
   kann — kein Programm von der Stange kommt darauf.                */

export function meilensteine(state, config, heute = new Date()) {
  const out = [];
  const rec = (config.records && config.records.programm) || {};

  // Jahrestage der alten Bestleistungen
  for (const [id, r] of Object.entries(rec)) {
    if (!r || !r.datum) continue;
    const def = config.lifts[id];
    if (!def) continue;
    const d = new Date(r.datum + 'T12:00:00');
    const dieserJahrestag = new Date(heute.getFullYear(), d.getMonth(), d.getDate());
    const abstand = Math.round((dieserJahrestag - new Date(heute.getFullYear(), heute.getMonth(), heute.getDate())) / 86400000);
    if (Math.abs(abstand) > 3) continue;
    const jahre = heute.getFullYear() - d.getFullYear();
    if (jahre < 1) continue;
    const wert = r.bestesEinzel || r.bestes5er;
    // Ganze Saetze statt zusammengeklebter Bruchstuecke — sonst kommt
    // "Vor 1 Tag waren es 5 Jahren" heraus.
    const n = Math.abs(abstand);
    // Gezaehlt wird in Jahren ({n}, mit Einzahl); die Tage stehen in {d}.
    const wann = tn(
      abstand === 0 ? 'coach.ms.heute' : abstand === -1 ? 'coach.ms.gestern' : abstand === 1 ? 'coach.ms.morgen'
        : abstand < 0 ? 'coach.ms.vorbei' : 'coach.ms.bald', jahre, { d: n });
    out.push({
      art: 'jahrestag', rang: 1, lift: id,
      text: t('coach.ms.jahrestag', { wann, wert, name: def.name, jetzt: state.lifts[id].weight })
    });
  }

  // Zurueck auf dem Stand vor der Pause
  for (const [id, def] of Object.entries(config.lifts)) {
    if (!def.reference) continue;
    const w = state.lifts[id].weight;
    if (w >= def.reference) {
      out.push({
        art: 'referenz', rang: 2, lift: id,
        text: w > def.reference
          ? t('coach.ms.drueber', { name: def.name, w, d: Math.round((w - def.reference) * 10) / 10 })
          : t('coach.ms.genau', { name: def.name, w })
      });
    }
  }

  return out.sort((a, b) => a.rang - b.rang);
}

/* ---------------------------------------------------------------
   Minierfolge. Nach einer Einheit hat die App bisher berichtet, was
   passiert ist — eine Tabelle mit Pfeilen. Das ist etwas anderes,
   als gesagt zu bekommen, dass man gerade etwas geschafft hat.

   Bewusst kleinteilig: jede Steigerung zaehlt, jeder saubere Satz,
   jede Einheit in der Woche. Es geht nicht um Rekorde, sondern
   darum, dass sich Regelmaessigkeit anfuehlt wie Fortschritt.      */

export function erfolge(vorher, nachher, config, log, alleLogs = [], heute = new Date()) {
  const out = [];
  const lifts = Array.isArray(log.lifts) ? log.lifts : [];

  // Jede Steigerung ist ein Erfolg — auch die zwoelfte in Folge.
  const gestiegen = lifts
    .map(e => ({ id: e.lift, alt: vorher.lifts[e.lift].weight, neu: nachher.lifts[e.lift].weight }))
    .filter(x => x.neu > x.alt);
  for (const g of gestiegen) {
    out.push({ art: 'steigerung', rang: 3, lift: g.id,
      text: t('coach.erf.steigerung', { name: config.lifts[g.id].name, alt: g.alt, neu: g.neu }) });
  }

  // Runde Zahl geknackt
  for (const g of gestiegen) {
    const schwelle = Math.floor(g.neu / 10) * 10;
    if (schwelle > g.alt && schwelle <= g.neu && schwelle >= 40) {
      // Bewusst ohne Artikel: die Uebungsnamen sind englisch, ein deutscher
      // Artikel davor waere immer falsch. Der Doppelpunkt loest das.
      out.push({ art: 'rund', rang: 1, lift: g.id,
        text: t('coach.erf.rund', { name: config.lifts[g.id].name, kg: schwelle }) });
    }
  }

  // Wieder auf dem Stand vor der Pause
  for (const g of gestiegen) {
    const ref = config.lifts[g.id].reference;
    if (ref && g.alt < ref && g.neu >= ref) {
      out.push({ art: 'referenz', rang: 0, lift: g.id,
        text: t('coach.erf.referenz', { name: config.lifts[g.id].name, kg: ref }) });
    }
  }

  // Alle Sätze sauber
  const saetze = lifts.reduce((s, e) => s + (e.reps || []).length, 0);
  const sauber = lifts.reduce((s, e) => s + (e.reps || []).filter(r => r >= (e.target || 5)).length, 0);
  if (saetze && sauber === saetze) {
    out.push({ art: 'sauber', rang: 2, text: t('coach.erf.sauber', { n: saetze }) });
  } else if (saetze) {
    out.push({ art: 'saetze', rang: 4, text: t('coach.erf.saetze', { s: sauber, n: saetze }) });
  }

  // Bewegtes Gewicht dieser Einheit
  const tonnage = lifts.reduce((s, e) => s + (e.weight || 0) * (e.reps || []).reduce((a, r) => a + r, 0), 0);
  if (tonnage > 0) {
    out.push({ art: 'tonnage', rang: 5,
      text: tonnage >= 1000 ? t('coach.erf.tonnen', { t: (tonnage / 1000).toFixed(1) }) : t('coach.erf.kg', { kg: Math.round(tonnage) }) });
  }

  // Wievielte Einheit in dieser Woche
  const montag = mondayOf(heute);
  const dieseWoche = alleLogs.filter(l => (l.type || 'strength') === 'strength'
    && new Date(l.date + 'T12:00:00') >= montag).length;
  if (dieseWoche >= 2) {
    out.push({ art: 'woche', rang: 2, text: t('coach.erf.woche', { n: dieseWoche }) });
  }

  // Runde Gesamtzahl an Einheiten
  const gesamt = alleLogs.filter(l => (l.type || 'strength') === 'strength').length;
  if (gesamt > 0 && (gesamt % 10 === 0 || gesamt === 5)) {
    out.push({ art: 'anzahl', rang: 1, text: t('coach.erf.anzahl', { n: gesamt }) });
  }

  return out.sort((a, b) => a.rang - b.rang);
}

/* ---------------------------------------------------------------
   Was auf Home sprechen darf.

   Home zeigt Form, Erholung, Gewicht und Rad als kleine Instrumente.
   Ausfuehrlich steht nur, was HEUTE etwas aendert — "alles normal,
   aendere nichts" braucht keine drei Zeilen. Diese Funktion trennt das
   eine vom anderen; die Oberflaeche baut daraus die Zeilen im Plakat.

   Die Reihenfolge ist die Wichtigkeit vor dem Start: erst was die
   Gewichte aendert (Pause), dann der Koerper (Verletzung, Erholung,
   Form), dann das Umfeld (Rad, Gewicht).                          */

// Die Erholung fehlt hier mit Absicht: ist sie knapp oder belastet, sagt
// das schon die Ansage selbst (intensitaet weiter oben). Eine zweite Zeile
// darueber waere dasselbe noch einmal. Als Instrument bleibt sie sichtbar.
const AUSNAHME = {
  form: ['muede', 'platt'],
  stoerung: ['stark', 'leicht'],
  abnehmen: ['schnell', 'teuer', 'rauf']
};

export function ausnahmen({ pause = null, verletzungen = [], form = null,
                            stoerung = null, abnehmStufe = null, schema = [] } = {}) {
  const out = [];
  if (pause) out.push({ art: 'pause', stufe: 'vorschlag' });
  // Ein festgefahrener Lift steht da, bevor man startet — der Dialog beim
  // Start soll keine Ueberraschung sein.
  for (const v of schema || []) if (v && v.lift) out.push({ art: 'schema', stufe: 'vorschlag', lift: v.lift });
  // Strukturelles bleibt — es ist kein Ereignis des Tages, sondern ein
  // Zustand. Dafuer gibt es ein Instrument, keine taegliche Zeile.
  for (const v of verletzungen || []) {
    if (v && v.status === 'aktiv' && v.art !== 'strukturell') out.push({ art: 'verletzung', stufe: 'aktiv', id: v.id });
  }
  if (form && AUSNAHME.form.includes(form.stufe)) out.push({ art: 'form', stufe: form.stufe });
  if (stoerung && AUSNAHME.stoerung.includes(stoerung.stufe)) out.push({ art: 'stoerung', stufe: stoerung.stufe });
  if (abnehmStufe && AUSNAHME.abnehmen.includes(abnehmStufe)) out.push({ art: 'abnehmen', stufe: abnehmStufe });
  return out;
}
