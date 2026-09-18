// Der Injury Report.
//
// WAS DIESES MODUL NICHT IST: eine medizinische Auskunft. Es stellt keine
// Diagnose, schlaegt keine Behandlung vor und beurteilt keine. Was hier
// als Behandlung steht, hat der Nutzer selbst eingetragen — von seinem
// Arzt, seiner Physiotherapie oder aus eigener Erfahrung. Die App merkt
// sich das und haelt sich daran. Sie weiss nichts ueber Plantarfaszien.
//
// Was sie leistet, ist das, was eine App leisten kann: nicht vergessen.
// Eine Einschraenkung, die man jedes Mal von Hand wegklicken muss, klickt
// man irgendwann nicht mehr weg.
//
// ZWEI ARTEN, und der Unterschied ist nicht kosmetisch:
//
//   wiederkehrend   Kommt und geht. Die Plantarfaszie meldet sich, wird
//                   behandelt, wird ruhig, meldet sich wieder. Sie hat
//                   einen Verlauf, den es sich zu verfolgen lohnt, und
//                   einen Status, der wirklich wechselt.
//
//   strukturell     Bleibt. Eine Kalkablagerung im Schultergelenk geht
//                   nicht weg, weil man sie gut behandelt — sie sperrt
//                   eine Bewegung, und das bleibt so. Deshalb wird hier
//                   nicht nach dem Verlauf gefragt: eine taegliche Frage
//                   nach etwas, das sich nicht aendert, ist Laerm.
//
// Reine Funktionen, kein I/O.

export const ARTEN = ['wiederkehrend', 'strukturell'];
export const STUFEN = ['besser', 'gleich', 'schlechter'];

/* Der Status. `ruhend` heisst bei einer wiederkehrenden Sache "gerade
   ruhig" und bei einer strukturellen "stoert im Moment nicht" — in beiden
   Faellen bleibt der Eintrag, aber er sperrt nichts und fragt nichts.
   `ausgeheilt` gibt es nur fuer wiederkehrende: das Gegenteil davon ist
   der Sinn des Wortes "strukturell".                                    */
export const STATI = ['aktiv', 'ruhend', 'ausgeheilt'];

const liste = config => Array.isArray(config && config.injuries) ? config.injuries : [];

/** Alles, was eingetragen ist — auch Ausgeheiltes, fuer die Ruecksicht. */
export function alle(config) {
  return liste(config).filter(v => v && v.id && v.was);
}

/** Was gerade stoert. Nur `aktiv` greift ins Training ein. */
export function aktive(config) {
  return alle(config).filter(v => v.status === 'aktiv');
}

/**
 * Nach dem Verlauf gefragt wird nur bei wiederkehrenden Sachen. Eine
 * Kalkablagerung jeden Abend zu bewerten erzeugt eine Kurve ohne Inhalt
 * und eine Frage, die man irgendwann wegtippt, ohne sie zu lesen.
 */
export function zuVerfolgen(config) {
  return aktive(config).filter(v => v.art !== 'strukturell');
}

/**
 * Alle Uebungs-Ids, die gerade gesperrt sind.
 *
 * Bewusst ein Set und keine Liste je Verletzung: beim Filtern interessiert
 * nur, OB eine Uebung gesperrt ist. Warum, steht in der Oberflaeche.
 */
export function gesperrt(config) {
  const out = new Set();
  for (const v of aktive(config)) {
    for (const id of Array.isArray(v.sperrt) ? v.sperrt : []) out.add(id);
  }
  return out;
}

/** Wer sperrt diese Uebung? Fuer den Hinweis, wenn eine fehlt. */
export function wegen(config, uebungId) {
  return aktive(config).filter(v =>
    Array.isArray(v.sperrt) && v.sperrt.includes(uebungId));
}

/**
 * Eine Uebungsliste ohne die gesperrten.
 *
 * Mit Notbremse: bleibt weniger als `minimum` uebrig, gibt es die
 * ungefilterte Liste zurueck. Ein leerer Bildschirm waere keine
 * Ruecksicht, sondern ein Fehler — und die Oberflaeche sagt getrennt an,
 * dass hier etwas gesperrt ist.
 */
export function ohneGesperrte(uebungen, config, minimum = 1) {
  const sperre = gesperrt(config);
  if (!sperre.size) return uebungen;
  const rest = uebungen.filter(u => !sperre.has(u.id));
  return rest.length >= minimum ? rest : uebungen;
}

/**
 * Die Grundlifts werden NICHT gesperrt, sondern nur angemerkt.
 *
 * Das ist keine Nachlaessigkeit: Kniebeuge, Bankdruecken, Rudern, Drucken
 * und Kreuzheben sind das Programm. Fehlt einer, hat die 5x5-Mechanik
 * nichts mehr zu rechnen — der A/B-Wechsel, die Progression und der
 * Deload haengen alle daran. Wer einen Grundlift wirklich nicht machen
 * kann, aendert sein Programm und nicht seinen Verletzungseintrag.
 */
export function betroffeneLifts(config, liftIds = []) {
  const sperre = gesperrt(config);
  return liftIds.filter(id => sperre.has(id));
}

/* ---------------------------------------------------------------
   Formular. Dieselbe Bauweise wie bei den Rekorden in
   persoenlich.js: ein Entwurf raus, ein gepruefter Block rein.  */

const text = v => String(v ?? '').trim();
const datum = v => /^\d{4}-\d{2}-\d{2}$/.test(text(v)) ? text(v) : null;

/** Aus einem Namen eine stabile Id: "Plantarfaszie links" -> "plantarfaszie-links". */
export function idAus(was, vorhandene = []) {
  const basis = text(was).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'verletzung';
  if (!vorhandene.includes(basis)) return basis;
  let n = 2;
  while (vorhandene.includes(`${basis}-${n}`)) n++;
  return `${basis}-${n}`;
}

/**
 * Aus den Formularfeldern der Block `injuries`.
 *
 * Ein Eintrag zaehlt nur mit Bezeichnung — ein Status ohne Was ist keine
 * Verletzung. Alles andere ist freiwillig: wer nur "linke Ferse, aktiv"
 * eintraegt, hat schon etwas gewonnen.
 */
export function baueVerletzungen(eintraege) {
  const out = [];
  const ids = [];
  for (const e of eintraege || []) {
    const was = text(e && e.was);
    if (!was) continue;
    const id = text(e.id) || idAus(was, ids);
    ids.push(id);

    const art = ARTEN.includes(e.art) ? e.art : 'wiederkehrend';
    // Strukturelles heilt nicht aus. Stuende dort `ausgeheilt`, waere es
    // keine strukturelle Sache — dann lieber den Eintrag loeschen.
    const erlaubt = art === 'strukturell' ? ['aktiv', 'ruhend'] : STATI;
    const status = erlaubt.includes(e.status) ? e.status : 'aktiv';

    const v = { id, was, art, status };
    const d = datum(e.seit);
    if (d) v.seit = d;
    const b = text(e.behandlung);
    if (b) v.behandlung = b;
    const sperrt = (Array.isArray(e.sperrt) ? e.sperrt : [])
      .map(text).filter(Boolean);
    if (sperrt.length) v.sperrt = [...new Set(sperrt)];
    out.push(v);
  }
  return out;
}

/** Die gespeicherten Verletzungen als Formularentwurf. */
export function entwurf(config) {
  return alle(config).map(v => ({
    id: v.id, was: v.was,
    art: ARTEN.includes(v.art) ? v.art : 'wiederkehrend',
    status: STATI.includes(v.status) ? v.status : 'aktiv',
    seit: v.seit || '',
    behandlung: v.behandlung || '',
    sperrt: Array.isArray(v.sperrt) ? [...v.sperrt] : []
  }));
}

/** In eine bestehende config einsetzen, ohne sonst etwas anzufassen. */
export function setzeInConfig(config, verletzungen) {
  const neu = JSON.parse(JSON.stringify(config || {}));
  if (verletzungen && verletzungen.length) neu.injuries = verletzungen;
  else delete neu.injuries;
  return neu;
}

/* ---------------------------------------------------------------
   Verlauf. Die Bewertungen stehen in den Einheiten-Logs unter
   `koerper`, weil sie dorthin gehoeren: sie sind ein Ereignis
   mit Datum und kein Teil der Konfiguration.                    */

const WERT = { besser: 1, gleich: 0, schlechter: -1 };

/** Die Bewertungen zu einer Verletzung, aelteste zuerst. */
export function reihe(logs = [], id) {
  return logs
    .filter(l => l && l.koerper && l.koerper[id] && l.date)
    .map(l => ({ date: l.date, stufe: l.koerper[id], wert: WERT[l.koerper[id]] ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Wohin es laeuft — als Summe der letzten Bewertungen.
 *
 * Bewusst eine Summe und kein Mittel: "dreimal besser, einmal schlechter"
 * ist eine andere Lage als "viermal gleich", und ein Mittelwert macht aus
 * beidem dieselbe Zahl. Unter drei Bewertungen gibt es kein Urteil —
 * zwei Punkte sind kein Verlauf.
 */
export function lage(logs = [], id, fenster = 6) {
  const alle = reihe(logs, id);
  if (alle.length < 3) return { punkte: alle.length, richtung: null, reihe: alle };
  const letzte = alle.slice(-fenster);
  const summe = letzte.reduce((s, p) => s + p.wert, 0);
  return {
    punkte: alle.length,
    betrachtet: letzte.length,
    summe,
    richtung: summe > 1 ? 'besser' : summe < -1 ? 'schlechter' : 'gleich',
    seitWann: alle[0].date,
    reihe: alle
  };
}

/**
 * Wie viel Krafteinheiten in den Tagen um eine Verschlechterung lagen.
 *
 * Das ist ausdruecklich KEINE Ursachenaussage — dazu bräuchte es mehr als
 * ein paar Datenpunkte und eine Kontrollgruppe. Es ist eine Beobachtung,
 * die man selbst deuten muss, und in der Oberflaeche steht sie auch so.
 */
export function umfeld(logs = [], id, tage = 7) {
  const punkte = reihe(logs, id).filter(p => p.stufe === 'schlechter');
  if (!punkte.length) return null;
  const kraft = logs.filter(l => (l.type || 'strength') === 'strength' && Array.isArray(l.lifts));
  const werte = punkte.map(p => {
    const bis = new Date(p.date);
    const ab = new Date(bis); ab.setDate(ab.getDate() - tage);
    return kraft.filter(l => {
      const d = new Date(l.date);
      return d > ab && d <= bis;
    }).length;
  });
  return {
    faelle: punkte.length,
    tage,
    schnitt: Math.round((werte.reduce((s, n) => s + n, 0) / werte.length) * 10) / 10
  };
}
