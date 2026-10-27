// Der Merch-Stand: Kutte, Schallplatten, Rang, Tourshirts.
//
// Spiel, aber ehrlich. Alles hier wird aus den Logs abgeleitet und nirgends
// gespeichert — wie der Zustand selbst. Wer state.json neu berechnet, hat
// danach dieselbe Kutte.
//
// DIE LEITREGEL: belohnt wird Regelmaessigkeit und Qualitaet, nie Menge um
// jeden Preis. Deshalb gibt es hier keinen Aufnaeher fuers Trainieren trotz
// Verletzung, keinen fuer mehr Einheiten als geplant und keinen fuer zehn
// Max-Outs. Der Rang zaehlt Wochen, nicht Einheiten: eine fuenfte Einheit
// in derselben Woche bringt dort nichts. Und was nur mit Daten von
// intervals.icu geht, fehlt ohne sie — es steht dann nicht als verfehlt da.
//
// Reine Funktionen, kein I/O.

import { applyLog, initialState, ymd } from './program.js';
import { tonnage, gewichtsReihe, wochenSerie, intensitaetsAbgleich } from './stats.js';
import { pausenFenster } from './verletzung.js';
import { HILFS, bereinige } from './hilfs.js';
import { serienMarken } from './soundcheck.js';
import * as ZU from './zusammen.js';

/** Was als Gig zaehlt: alles, wofuer man ins Studio gegangen ist — und jede Fahrt. */
export const GIG_TYPEN = ['strength', 'wod', 'unplugged', 'kurs', 'moshpit', 'maxout'];
const typ = l => l.type || 'strength';
const istGig = l => l && l.date && GIG_TYPEN.includes(typ(l));
const istKraft = l => typ(l) === 'strength' && Array.isArray(l.lifts);
/** Fahrten kommen von intervals.icu, nicht aus den Logs. Nur die mit Datum zaehlen. */
const mitDatum = (fahrten = []) => fahrten.filter(f => f && f.date);

const zeit = l => l.finished || l.started || '';
/** Dieselbe Reihenfolge wie deriveState — sonst rechnet die Kutte anders als das Programm. */
export function sortiert(logs = []) {
  return logs.filter(l => l && l.date)
    .sort((a, b) => a.date.localeCompare(b.date) || zeit(a).localeCompare(zeit(b)));
}

/**
 * Jeder Log mit dem Zustand davor und danach. So lassen sich Momente
 * erkennen, die im Endzustand nicht mehr zu sehen sind — etwa dass ein
 * Rueckweg erreicht wurde.
 */
export function zeitleiste(logs = [], config) {
  let s = initialState(config);
  const out = [];
  for (const log of sortiert(logs)) {
    // Ein kaputter Krafteintrag soll die Kutte nicht lahmlegen.
    if (typ(log) === 'strength' && !Array.isArray(log.lifts)) continue;
    const n = applyLog(s, config, log);
    out.push({ log, vorher: s, nachher: n });
    s = n;
  }
  return out;
}

/* ============================== Die Kutte ============================== */

const GIG_STUFEN = [10, 25, 50, 100, 250];
const SERIE_STUFEN = [4, 12, 26, 52];
/** Wochen mit mindestens dreimal Mobility — 1, 4, 12 solcher Wochen. */
export const GELENKIG_STUFEN = [1, 4, 12];
export const GELENKIG_TAGE = 3;
const PLATTEN_STUFEN = [1, 2, 3, 4];
/** Besiegte Monats-Endgegner — 1, 3, 6, 12 Monate. */
export const TOUR_STUFEN = [1, 3, 6, 12];
/** Wochen-Soundcheck so viele Wochen in Folge. */
export const SOUNDCHECK_STUFEN = [4, 12];
/** Gemeinsame Trainingstage insgesamt: 5, 15, 30. Tage, nicht Saetze — wie beim Rang zaehlt Verlaesslichkeit. */
export const PARTNER_STUFEN = [5, 15, 30];
/** Wochen in Folge mit mindestens einer gemeinsamen Einheit. */
export const VERABREDUNG_STUFEN = [2, 4, 8];
/** Eine Platte = 20 kg je Seite, wie im Kraftsport ueblich. */
export const PLATTE_KG = 20;
/** 1000 lb in kg. */
export const CLUB_KG = 453.6;
const CLUB_LIFTS = ['squat', 'bench', 'deadlift'];
/** Koerpergewicht-Marken. Klassische Richtwerte, keine Normen. */
export const KOERPER_MARKEN = [
  { lift: 'bench', faktor: 1 },
  { lift: 'squat', faktor: 1.5 },
  { lift: 'deadlift', faktor: 2 },
  { lift: 'ohp', faktor: 0.75 }
];
/** So alt darf ein Waagenwert hoechstens sein, um fuer einen Tag zu gelten. */
const WAAGE_TAGE = 14;

const plattenKg = (bar, n) => bar + 2 * PLATTE_KG * n;

/* Das Rad. Kilometer und Hoehenmeter sind Summen wie die Tonnen beim
   Eisen; die uebrigen belohnen etwas anderes als Menge: eine lange Fahrt am
   Stueck, die Disziplin, locker zu bleiben, wenn locker geplant ist, und
   Wochen, in denen beides stattfand. Kraft und Rad am selben Tag gibt es
   hier bewusst nicht — davor warnt die App an anderer Stelle.          */
export const KM_STUFEN = [100, 500, 1000, 2500, 5000];
/** Einmal den Everest hoch. */
export const HOEHE_M = 8848;
export const CENTURY_KM = 100;
const DOOM_N = 10, OPENAIR_N = 10;
/* Hilfsuebungen: Regelmaessigkeit (Einheiten mit Hilfsarbeit) und ein
   Qualitaetsmerkmal (Klimmzuege am Stueck) — keine Wiederholungssummen. */
export const ROADCREW_N = 10, HANGAR_WDH = 10;
const ZUG = new Set(HILFS.filter(h => h.zug).map(h => h.id));
const CROSSOVER_STUFEN = [1, 10, 26];

/**
 * Welche Aufnaeher es fuer diese Konfiguration ueberhaupt gibt.
 * `gruppe` ist die Leiter: an der Wand steht je Gruppe nur der naechste
 * fehlende, damit keine Weste voller leerer Kreise entsteht.
 */
export function katalog(config = {}, { mitGewicht = false, mitRad = false, mitHoehe = false, mitPlan = false, mitZusammen = false } = {}) {
  const lifts = config.lifts || {};
  const bar = config.bar || 20;
  const out = [];
  const p = (id, kategorie, gruppe, key, vars = {}) => out.push({ id, kategorie, gruppe, key, vars });

  p('debuet', 'buehne', 'debuet', 'merch.p.debuet');
  for (const n of GIG_STUFEN) p(`gigs-${n}`, 'buehne', 'gigs', 'merch.p.gigs', { n });
  p('jam', 'buehne', 'jam', 'merch.p.jam');
  p('unplugged', 'buehne', 'unplugged', 'merch.p.unplugged', { n: 10 });
  p('maxout', 'buehne', 'maxout', 'merch.p.maxout');
  p('zugaben', 'buehne', 'zugaben', 'merch.p.zugaben', { n: 10 });
  p('tight', 'buehne', 'tight', 'merch.p.tight', { n: 10 });
  p('roadcrew', 'buehne', 'roadcrew', 'merch.p.roadcrew', { n: ROADCREW_N });

  for (const [id, def] of Object.entries(lifts)) {
    for (const n of PLATTEN_STUFEN) {
      p(`platten-${id}-${n}`, 'kraft', `platten-${id}`, 'merch.p.platten',
        { name: def.name || id, n, kg: plattenKg(bar, n) });
    }
  }
  if (CLUB_LIFTS.every(id => lifts[id])) p('club', 'kraft', 'club', 'merch.p.club', { kg: CLUB_KG });
  p('hangar', 'kraft', 'hangar', 'merch.p.hangar', { n: HANGAR_WDH });
  for (const n of GELENKIG_STUFEN) p(`gelenkig-${n}`, 'kraft', 'gelenkig', 'merch.p.gelenkig', { n, tage: GELENKIG_TAGE });
  if (mitGewicht) {
    for (const m of KOERPER_MARKEN) {
      if (!lifts[m.lift]) continue;
      p(`koerper-${m.lift}`, 'kraft', `koerper-${m.lift}`, 'merch.p.koerper',
        { name: lifts[m.lift].name || m.lift, f: m.faktor });
    }
  }

  if (mitRad) {
    for (const n of KM_STUFEN) p(`km-${n}`, 'rad', 'km', 'merch.p.km', { n });
    if (mitHoehe) p('hoehe', 'rad', 'hoehe', 'merch.p.hoehe', { m: HOEHE_M });
    p('century', 'rad', 'century', 'merch.p.century', { km: CENTURY_KM });
    if (mitPlan) p('doom', 'rad', 'doom', 'merch.p.doom', { n: DOOM_N });
    p('openair', 'rad', 'openair', 'merch.p.openair', { n: OPENAIR_N });
    for (const n of CROSSOVER_STUFEN) p(`crossover-${n}`, 'rad', 'crossover', 'merch.p.crossover', { n });
  }

  p('comeback', 'comeback', 'comeback', 'merch.p.comeback');
  p('rueckweg', 'comeback', 'rueckweg', 'merch.p.rueckweg');
  if (Object.values(lifts).some(d => d && d.reference)) p('reunion', 'comeback', 'reunion', 'merch.p.reunion');

  for (const n of SERIE_STUFEN) p(`serie-${n}`, 'serie', 'serie', 'merch.p.serie', { n });
  if (kraftGeplant(config)) for (const n of TOUR_STUFEN) p(`tour-${n}`, 'tour', 'tour', 'merch.p.tour', { n });
  for (const n of SOUNDCHECK_STUFEN) p(`soundcheck-${n}`, 'tour', 'soundcheck', 'merch.p.soundcheck', { n });
  // Wer nie mit jemandem verabredet war, bekommt keine leeren Kreise dafuer —
  // wie bei den Fahrten: was es ohne die Daten nicht gibt, fehlt nicht.
  if (mitZusammen) {
    p('duett', 'buehne', 'duett', 'merch.p.duett');
    p('faustgruss', 'buehne', 'faustgruss', 'merch.p.faustgruss');
    for (const n of PARTNER_STUFEN) p(`partner-${n}`, 'buehne', 'partner', 'merch.p.partner', { n });
    for (const n of VERABREDUNG_STUFEN) p(`verabredung-${n}`, 'buehne', 'verabredung', 'merch.p.verabredung', { n });
  }
  return out;
}

/** Koerpergewicht an einem Tag: der juengste Wochenschnitt davor, nicht aelter als zwei Wochen. */
function waageFuer(reihe, datum) {
  let treffer = null;
  for (const p of reihe) {
    if (p.date > datum) break;
    treffer = p;
  }
  if (!treffer) return null;
  const alter = (Date.parse(datum) - Date.parse(treffer.date)) / 86400000;
  return alter <= WAAGE_TAGE ? treffer.schnitt : null;
}

/**
 * Alle Aufnaeher mit dem Tag, an dem sie verdient wurden (oder null).
 * "Gehoben" heisst: ein geschaffter Arbeitssatz oder ein Max-Out-Lift.
 */
export function aufnaeher(logs = [], config = {}, wellness = [], heute = new Date(), { fahrten = [], planFuer = null, soundchecks = [], zusammen = [] } = {}) {
  const reihe = gewichtsReihe(wellness);
  const rad = mitDatum(fahrten);
  const kat = katalog(config, {
    mitGewicht: reihe.length > 0,
    mitRad: rad.length > 0,
    mitHoehe: rad.some(f => f.hm != null),
    mitPlan: !!planFuer && radGeplant(config),
    mitZusammen: zusammen.length > 0
  });
  const gibt = new Set(kat.map(k => k.id));
  const verdient = {};
  const setze = (id, datum) => { if (gibt.has(id) && !verdient[id]) verdient[id] = datum; };

  const lifts = config.lifts || {};
  const bar = config.bar || 20;
  const refs = Object.entries(lifts).filter(([, d]) => d && d.reference);
  const best = {};
  const gigTage = new Set();
  let unplugged = 0, zugaben = 0, tight = 0, roadcrew = 0, comebackOffen = false;

  for (const { log, vorher, nachher } of zeitleiste(logs, config)) {
    const d = log.date;
    if (istGig(log)) gigTage.add(d);

    // Was an diesem Tag gehoben wurde, je Lift
    const heuteGehoben = {};
    const heb = (id, w) => {
      if (!(w > 0)) return;
      heuteGehoben[id] = Math.max(heuteGehoben[id] || 0, w);
      best[id] = Math.max(best[id] || 0, w);
    };

    switch (typ(log)) {
      case 'wod': setze('jam', d); break;
      case 'unplugged': if (++unplugged >= 10) setze('unplugged', d); break;
      case 'maxout':
        setze('maxout', d);
        if (log.lift && log.reps >= 1) heb(log.lift, log.weight);
        break;
      case 'anpassung':
        if (log.grund === 'pause') comebackOffen = true;
        break;
      case 'strength': {
        for (const e of log.lifts) {
          if (e.success) heb(e.lift, e.weight);
          // Rueckweg geschafft: vorher unterwegs, jetzt angekommen — und zwar
          // mit einem Erfolg. Ein Fehlversuch beendet den Rueckweg auch, aber
          // das ist kein Aufnaeher.
          const v = vorher.lifts[e.lift], n = nachher.lifts[e.lift];
          if (e.success && v && v.rueckweg && n && !n.rueckweg) setze('rueckweg', d);
        }
        if (log.lifts.length && log.lifts.every(e => e.success) && ++tight >= 10) setze('tight', d);
        if (log.zugabe && ++zugaben >= 10) setze('zugaben', d);
        const hilfs = bereinige(log.hilfs);
        if (hilfs.length && ++roadcrew >= ROADCREW_N) setze('roadcrew', d);
        if (hilfs.some(h => ZUG.has(h.id) && Math.max(...h.reps) >= HANGAR_WDH)) setze('hangar', d);
        if (comebackOffen) { setze('comeback', d); comebackOffen = false; }
        break;
      }
    }

    for (const id of Object.keys(lifts)) {
      for (const n of PLATTEN_STUFEN) if ((best[id] || 0) >= plattenKg(bar, n)) setze(`platten-${id}-${n}`, d);
    }
    if (CLUB_LIFTS.reduce((s, id) => s + (best[id] || 0), 0) >= CLUB_KG - 1e-9) setze('club', d);
    if (reihe.length) {
      const bw = waageFuer(reihe, d);
      if (bw) {
        for (const m of KOERPER_MARKEN) {
          if ((heuteGehoben[m.lift] || 0) >= m.faktor * bw - 1e-9) setze(`koerper-${m.lift}`, d);
        }
      }
    }
    if (refs.length && refs.every(([id, def]) => nachher.lifts[id] && nachher.lifts[id].weight >= def.reference)) {
      setze('reunion', d);
    }
  }

  // Gigs: Tage, an denen trainiert wurde — im Studio oder auf dem Rad.
  for (const f of rad) gigTage.add(f.date);
  const tage = [...gigTage].sort();
  if (tage.length) setze('debuet', tage[0]);
  for (const n of GIG_STUFEN) if (tage.length >= n) setze(`gigs-${n}`, tage[n - 1]);

  radAufnaeher(rad, logs, planFuer, setze);

  monatsTouren(logs, config, { fahrten: rad, heute }).filter(m => m.komplett).reverse()
    .forEach((m, i) => { for (const n of TOUR_STUFEN) if (i + 1 >= n) setze(`tour-${n}`, m.besiegtAm); });

  const marken = serienMarken(soundchecks, SOUNDCHECK_STUFEN);
  for (const n of SOUNDCHECK_STUFEN) if (marken[n]) setze(`soundcheck-${n}`, marken[n]);

  // Zusammen: Verabredung UND ein Gig-Log am selben Tag. Fahrten zaehlen nicht —
  // die kommen von intervals.icu, und niemand faehrt im Keller zu zweit.
  const gemTage = ZU.gemeinsameTage(zusammen, new Set(logs.filter(istGig).map(l => l.date)));
  if (gemTage.length) setze('duett', gemTage[0].datum);
  const faustgruss = gemTage.find(x => x.bestaetigt);
  if (faustgruss) setze('faustgruss', faustgruss.datum);
  const partner = ZU.tageMarken(gemTage, PARTNER_STUFEN);
  for (const n of PARTNER_STUFEN) if (partner[n]) setze(`partner-${n}`, partner[n]);
  const woche = serienMarken(ZU.wochen(gemTage), VERABREDUNG_STUFEN);
  for (const n of VERABREDUNG_STUFEN) if (woche[n]) setze(`verabredung-${n}`, woche[n]);

  const gelenkig = gelenkigeWochen(logs);
  for (const n of GELENKIG_STUFEN) if (gelenkig.length >= n) setze(`gelenkig-${n}`, gelenkig[n - 1]);

  // Serien: dieselbe Rechnung wie der Rekord in der Tour, mit Verletzungspause.
  const fenster = pausenFenster(config, ymd(heute));
  for (const w of wochenSerie(tage, fenster)) {
    for (const n of SERIE_STUFEN) {
      if (w.laufend >= n && w.trainiert) setze(`serie-${n}`, tage.find(t => t >= w.montag));
    }
  }

  return kat.map(k => ({ ...k, verdient: verdient[k.id] || null }));
}

/**
 * Tage mit Mobility: ein eigener Mobility-Log oder der Haken in einer
 * Krafteinheit. Je Tag einmal — dreimal am selben Abend ist kein Rhythmus.
 */
export function mobilityTage(logs = []) {
  const tage = new Set();
  for (const l of logs) {
    if (!l || !l.date) continue;
    if (l.type === 'mobility' || (typ(l) === 'strength' && l.mobility)) tage.add(l.date);
  }
  return [...tage].sort();
}

/** Je Woche mit mindestens GELENKIG_TAGE Mobility-Tagen der Tag, an dem sie es wurde. */
/** Wie viele Mobility-Tage die laufende Woche (Mo–So) bisher hat. */
export function mobilityWoche(logs = [], heute = new Date()) {
  const tag = ymd(heute), montag = montagKey(tag);
  return mobilityTage(logs).filter(d => d <= tag && montagKey(d) === montag).length;
}

export function gelenkigeWochen(logs = []) {
  const zaehler = new Map(), out = [];
  for (const d of mobilityTage(logs)) {
    const k = montagKey(d);
    const n = (zaehler.get(k) || 0) + 1;
    zaehler.set(k, n);
    if (n === GELENKIG_TAGE) out.push(d);
  }
  return out;
}

/** Plant die config ueberhaupt Radeinheiten? Sonst gibt es nichts abzugleichen. */
function radGeplant(config) {
  const slots = (config.week && Array.isArray(config.week.slots)) ? config.week.slots : [];
  return Array.isArray(config.rides) && config.rides.length > 0 && slots.some(s => s && s.type === 'ride');
}

function radAufnaeher(rad, logs, planFuer, setze) {
  if (!rad.length) return;
  const sortiert = [...rad].sort((a, b) => String(a.zeit || a.date).localeCompare(String(b.zeit || b.date)));
  let km = 0, hm = 0, draussen = 0;
  for (const f of sortiert) {
    km += f.km || 0;
    hm += f.hm || 0;
    for (const n of KM_STUFEN) if (km >= n - 1e-9) setze(`km-${n}`, f.date);
    if (hm >= HOEHE_M) setze('hoehe', f.date);
    // Eine Fahrt am Stueck — zwei Fahrten zu je fuenfzig sind keine hundert.
    if ((f.km || 0) >= CENTURY_KM - 1e-9) setze('century', f.date);
    if (f.trainer === false && ++draussen >= OPENAIR_N) setze('openair', f.date);
  }

  if (planFuer) {
    const imZiel = intensitaetsAbgleich(sortiert, planFuer).filter(e => e.stufe === 'imZiel');
    if (imZiel.length >= DOOM_N) setze('doom', imZiel[DOOM_N - 1].date);
  }

  // Crossover: Wochen mit Kraft UND Rad. Verdient an dem Tag, an dem die
  // Woche beides hatte — also am spaeteren der beiden ersten Tage.
  const wochen = new Map();
  const merke = (datum, art) => {
    const k = montagKey(datum);
    const w = wochen.get(k) || {};
    if (!w[art] || datum < w[art]) w[art] = datum;
    wochen.set(k, w);
  };
  for (const l of logs) if (l && l.date && istKraft(l)) merke(l.date, 'kraft');
  for (const f of rad) merke(f.date, 'rad');
  const beide = [...wochen.entries()].filter(([, w]) => w.kraft && w.rad).sort((a, b) => a[0].localeCompare(b[0]));
  beide.forEach(([, w], i) => {
    for (const n of CROSSOVER_STUFEN) if (i + 1 >= n) setze(`crossover-${n}`, w.kraft > w.rad ? w.kraft : w.rad);
  });
}

/** Was an die Weste kommt: alles Verdiente und je Leiter der naechste Schritt. */
export function kutte(liste = []) {
  const verdient = liste.filter(a => a.verdient);
  const gesehen = new Set();
  const naechste = [];
  for (const a of liste) {
    if (a.verdient || gesehen.has(a.gruppe)) continue;
    gesehen.add(a.gruppe);
    naechste.push(a);
  }
  return { verdient, naechste };
}

/** Was eine neue Einheit an Aufnaehern gebracht hat. */
export function neueAufnaeher(vorherLogs = [], nachherLogs = [], config = {}, wellness = [], heute = new Date(), opts = {}) {
  const alt = new Set(aufnaeher(vorherLogs, config, wellness, heute, opts).filter(a => a.verdient).map(a => a.id));
  return aufnaeher(nachherLogs, config, wellness, heute, opts).filter(a => a.verdient && !alt.has(a.id));
}

/* =========================== Gold und Platin =========================== */

/** Tonnen bewegtes Gewicht. Platin gibt es auch nach einer Pause noch — es wird nie weniger. */
export const PLATTEN = [
  { id: 'gold', tonnen: 50 },
  { id: 'platin', tonnen: 100 },
  { id: 'doppelplatin', tonnen: 250 },
  { id: 'diamant', tonnen: 500 }
];

export function schallplatten(logs = []) {
  let kg = 0;
  const verdient = {};
  for (const l of sortiert(logs)) {
    kg += tonnage(l);
    for (const p of PLATTEN) if (!verdient[p.id] && kg >= p.tonnen * 1000) verdient[p.id] = l.date;
  }
  const tonnen = Math.round(kg / 100) / 10;
  const stufen = PLATTEN.map(p => ({ ...p, verdient: verdient[p.id] || null }));
  const offen = PLATTEN.find(p => !verdient[p.id]);
  const vorige = [...PLATTEN].reverse().find(p => verdient[p.id]);
  const basis = vorige ? vorige.tonnen : 0;
  return {
    tonnen,
    stufen,
    naechste: offen ? {
      id: offen.id,
      tonnen: offen.tonnen,
      fehlt: Math.round((offen.tonnen - kg / 1000) * 10) / 10,
      anteil: Math.max(0, Math.min(1, (kg / 1000 - basis) / (offen.tonnen - basis)))
    } : null
  };
}

/* =============================== Der Rang =============================== */

/**
 * Wochen mit mindestens einem Gig — nicht Einheiten. Wer in einer Woche
 * fuenfmal trainiert, steigt nicht schneller auf als mit zweimal; wer
 * pausiert, steigt nicht ab. Der Rang faellt nie.
 */
/**
 * Reihenfolge der Bilder im Bogen assets/pixel/aufnaeher.png (je 24×24),
 * gebaut von tools/pixel.mjs. Jeder Aufnaeher hat sein eigenes Motiv —
 * auch jede Stufe einer Leiter. Fuer eigene Lift-IDs in der config gibt es
 * am Ende eine neutrale Figur je Stufe.
 */
const STANDARD_LIFTS = ['squat', 'bench', 'row', 'ohp', 'deadlift'];
export const BILDER = [
  'debuet', ...GIG_STUFEN.map(n => `gigs-${n}`), 'jam', 'unplugged', 'maxout', 'zugaben', 'tight', 'roadcrew',
  ...STANDARD_LIFTS.flatMap(id => PLATTEN_STUFEN.map(n => `platten-${id}-${n}`)),
  'club', 'hangar', ...KOERPER_MARKEN.map(m => `koerper-${m.lift}`), ...GELENKIG_STUFEN.map(n => `gelenkig-${n}`),
  ...KM_STUFEN.map(n => `km-${n}`), 'hoehe', 'century', 'doom', 'openair', ...CROSSOVER_STUFEN.map(n => `crossover-${n}`),
  'comeback', 'rueckweg', 'reunion', ...SERIE_STUFEN.map(n => `serie-${n}`), ...TOUR_STUFEN.map(n => `tour-${n}`),
  ...SOUNDCHECK_STUFEN.map(n => `soundcheck-${n}`),
  'duett', 'faustgruss', ...PARTNER_STUFEN.map(n => `partner-${n}`), ...VERABREDUNG_STUFEN.map(n => `verabredung-${n}`),
  ...PLATTEN_STUFEN.map(n => `platten-figur-${n}`), 'koerper-figur'
];

/**
 * Platz des Aufnaehers im Bogen, oder -1. Ein Lift, den der Bogen nicht
 * kennt (eigene ID in der config), bekommt die neutrale Figur derselben Stufe.
 */
export function bildIndex(a) {
  const id = String((a && a.id) || '');
  const i = BILDER.indexOf(id);
  if (i >= 0) return i;
  const platte = /^platten-.+-(\d+)$/.exec(id);
  if (platte) return BILDER.indexOf(`platten-figur-${platte[1]}`);
  if (/^koerper-./.test(id)) return BILDER.indexOf('koerper-figur');
  return -1;
}

export const RAENGE = [
  { id: 'garage', wochen: 0 },
  { id: 'proberaum', wochen: 4 },
  { id: 'vorband', wochen: 12 },
  { id: 'support', wochen: 26 },
  { id: 'headliner', wochen: 52 },
  { id: 'festival', wochen: 104 },
  { id: 'halloffame', wochen: 208 }
];

const montagKey = datum => {
  const d = new Date(datum + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return ymd(d);
};

export function rang(logs = [], fahrten = []) {
  // Je Rang der Tag, an dem er freigespielt wurde: der Gig, mit dem die
  // Zahl der Wochen die Schwelle erreichte. Die Garage gibt es ab dem ersten.
  const tage = [...new Set(logs.filter(istGig).map(l => l.date).concat(mitDatum(fahrten).map(f => f.date)))].sort();
  const gezaehlt = new Set();
  const freigespielt = RAENGE.map(() => null);
  for (const d of tage) {
    gezaehlt.add(montagKey(d));
    RAENGE.forEach((x, k) => { if (!freigespielt[k] && gezaehlt.size >= Math.max(1, x.wochen)) freigespielt[k] = d; });
  }
  const wochen = gezaehlt.size;
  let i = 0;
  while (i + 1 < RAENGE.length && wochen >= RAENGE[i + 1].wochen) i++;
  const r = RAENGE[i], n = RAENGE[i + 1] || null;
  return {
    id: r.id, stufe: i, wochen, freigespielt,
    naechste: n ? { id: n.id, wochen: n.wochen, fehlt: n.wochen - wochen } : null,
    anteil: n ? (wochen - r.wochen) / (n.wochen - r.wochen) : 1
  };
}

/* ============================== Tourshirts ============================== */

/* Der Name macht das Shirt: das erste Wort die Stofffarbe, das zweite das
   Emblem auf der Brust (Bilder aus tools/pixel.mjs, gleiche Reihenfolge). */
export const ADJ = ['Iron', 'Steel', 'Thunder', 'Heavy', 'Black', 'Electric',
  'Molten', 'Savage', 'Midnight', 'Raw', 'Burning', 'Chrome'];
export const NOMEN = ['Barbell', 'Plates', 'Chalk', 'Anvil', 'Riffs', 'Hammer',
  'Voltage', 'Furnace', 'Amplifier', 'Rust', 'Rack', 'Reps'];

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Stofffarbe und Emblem eines Quartals: je ein Platz in ADJ und NOMEN. */
export function tourStil(jahr, quartal) {
  const h = hash(`${jahr}-Q${quartal}`);
  return { farbe: h % ADJ.length, motiv: (h >>> 8) % NOMEN.length };
}

/** Ein Tourname, der fuer dasselbe Quartal immer derselbe ist. */
export function tourName(jahr, quartal) {
  const { farbe, motiv } = tourStil(jahr, quartal);
  return `${ADJ[farbe]} ${NOMEN[motiv]} Tour`;
}

const quartalVon = datum => Math.floor((Number(datum.slice(5, 7)) - 1) / 3) + 1;
const ART = { strength: 'kraft', wod: 'jam', unplugged: 'unplugged', kurs: 'kurs', moshpit: 'moshpit', maxout: 'maxout', rad: 'rad' };

/**
 * Jedes Quartal mit mindestens einem Gig ist eine Tour, die neueste zuerst.
 * Ein Gig ist ein Tag — Kraft und Jam am selben Abend sind ein Konzert.
 */
export function touren(logs = [], heute = new Date(), liste = [], fahrten = []) {
  const jetzt = ymd(heute);
  const map = new Map();
  // Fahrten stehen als eigene Art auf dem Ruecken. An einem Tag mit Kraft
  // heisst es dann "Kraft + Rad" — ein Gig, zwei Sets.
  const eintraege = logs.filter(istGig)
    .concat(mitDatum(fahrten).map(f => ({ date: f.date, type: 'rad', km: f.km || 0 })))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'rad') - (b.type === 'rad'));
  for (const l of eintraege) {
    const jahr = Number(l.date.slice(0, 4)), q = quartalVon(l.date);
    const key = `${jahr}-Q${q}`;
    if (!map.has(key)) map.set(key, { jahr, quartal: q, tage: new Map(), kg: 0, km: 0 });
    const t = map.get(key);
    if (!t.tage.has(l.date)) t.tage.set(l.date, { date: l.date, arten: [], ort: null });
    const tag = t.tage.get(l.date);
    const art = ART[typ(l)];
    if (!tag.arten.includes(art)) tag.arten.push(art);
    if (!tag.ort && l.ort) tag.ort = String(l.ort);
    if (l.type === 'rad') t.km += l.km;
    else t.kg += tonnage(l);
  }
  return [...map.values()].reverse().map(t => {
    const key = `${t.jahr}-Q${t.quartal}`;
    return {
      jahr: t.jahr, quartal: t.quartal,
      name: tourName(t.jahr, t.quartal),
      ...tourStil(t.jahr, t.quartal),
      laufend: Number(jetzt.slice(0, 4)) === t.jahr && quartalVon(jetzt) === t.quartal,
      gigs: [...t.tage.values()],
      tonnen: Math.round(t.kg / 100) / 10,
      km: Math.round(t.km),
      aufnaeher: liste.filter(a => a.verdient && `${a.verdient.slice(0, 4)}-Q${quartalVon(a.verdient)}` === key).length
    };
  });
}

/**
 * Die Tour-Bilanz eines Jahres. Je Lift das Arbeitsgewicht vor dem ersten
 * und nach dem letzten Log des Jahres — beides aus dem nachgespielten
 * Zustand, damit ein Max-Out oder eine Anpassung richtig mitgerechnet wird.
 */
export function jahresBilanz(logs = [], config = {}, jahr, { heute = new Date(), liste = [], fahrten = [] } = {}) {
  const imJahr = l => l.date.slice(0, 4) === String(jahr);
  const schritte = zeitleiste(logs, config).filter(z => imJahr(z.log));
  const gigs = sortiert(logs).filter(l => istGig(l) && imJahr(l));
  const rad = mitDatum(fahrten).filter(imJahr);
  if (!gigs.length && !rad.length) return null;

  const tage = [...new Set(gigs.map(l => l.date).concat(rad.map(f => f.date)))].sort();
  const lifts = {};
  if (schritte.length) {
    const vorher = schritte[0].vorher, nachher = schritte[schritte.length - 1].nachher;
    for (const id of Object.keys(config.lifts || {})) {
      // Ein Lift, der im Jahr nie vorkam, steht noch auf seinem Startwert —
      // das ist keine Aussage ueber das Jahr.
      const kam = schritte.some(z => (Array.isArray(z.log.lifts) && z.log.lifts.some(e => e.lift === id)) ||
        (z.log.gewichte && z.log.gewichte[id]) || z.log.lift === id);
      if (kam && vorher.lifts[id] && nachher.lifts[id]) {
        lifts[id] = { von: vorher.lifts[id].weight, bis: nachher.lifts[id].weight };
      }
    }
  }
  const fenster = pausenFenster(config, ymd(heute));
  return {
    jahr,
    gigs: tage.length,
    wochen: new Set(tage.map(montagKey)).size,
    tonnen: Math.round(gigs.reduce((s, l) => s + tonnage(l), 0) / 100) / 10,
    km: Math.round(rad.reduce((s, f) => s + (f.km || 0), 0)),
    serie: wochenSerie(tage, fenster).reduce((m, w) => Math.max(m, w.laufend), 0),
    lifts,
    aufnaeher: liste.filter(a => a.verdient && a.verdient.slice(0, 4) === String(jahr)).length
  };
}

/* ============================ Goes to eleven ============================ */

/**
 * Der Wochenregler. 0 bis 10 fuer erledigte gegen geplante Krafteinheiten.
 * Auf ELF dreht er nur, wenn der Plan erfuellt ist UND alle Saetze der
 * Woche sauber waren. Mehr Einheiten als geplant drehen ihn nicht weiter —
 * wer mehr trainiert als vorgesehen, bekommt dafuer keinen Applaus.
 */
export function verstaerker(logs = [], config = {}, heute = new Date(), history = []) {
  const slots = (config.week && Array.isArray(config.week.slots)) ? config.week.slots : [];
  const geplant = slots.filter(s => s && s.type === 'strength').length;
  if (!geplant) return null;
  const tag = ymd(heute), montag = montagKey(tag);
  const inWoche = d => d && montagKey(d) === montag && d <= tag;
  const diese = logs.filter(l => istKraft(l) && inWoche(l.date));
  // Die Historie im Zustand weiss, DASS trainiert wurde, aber nicht, ob
  // sauber. Fehlt fuer einen ihrer Tage das Log, bleibt "sauber" offen —
  // und offen heisst: keine Elf. Lieber eine Stufe zu wenig als eine
  // geschenkte.
  const ausHistorie = history.filter(h => (h.type || 'strength') === 'strength' && inWoche(h.date)).map(h => h.date);
  const tage = new Set(diese.map(l => l.date).concat(ausHistorie));
  const erledigt = Math.min(tage.size, geplant);
  const belegt = new Set(diese.map(l => l.date));
  const sauber = diese.length > 0 && ausHistorie.every(d => belegt.has(d)) &&
    diese.every(l => l.lifts.length && l.lifts.every(e => e.success));
  const stufe = erledigt >= geplant ? (sauber ? 11 : 10) : Math.round((10 * erledigt) / geplant);
  return { stufe, erledigt, geplant, sauber };
}

/* ============================ Monats-Tour ============================
   Jeden Monat drei Ziele, alle aus dem eigenen Wochenplan: die geplanten
   Krafteinheiten, die geplanten Fahrten (oder, ohne Rad, vier Tage Jam,
   Unplugged oder Mobility) und halb so viele saubere Einheiten. Sind alle
   drei erfuellt, ist der Endgegner des Monats besiegt.

   Tage vor der ersten Einheit und Tage in einer Verletzungspause zaehlen
   nicht zum Soll: wer Mitte des Monats anfaengt oder ausfaellt, bekommt
   ein kleineres Soll statt einer verlorenen Tour. Mehr als geplant bringt
   nichts — das Soll ist das Ziel, nicht der Anfang.                    */

/** Ersatzziel ohne geplante Fahrten: so viele Tage Jam, Unplugged oder Mobility. */
export const TOUR_ERSATZ = 4;
const NEBEN_TYPEN = ['wod', 'unplugged', 'kurs', 'moshpit'];
const wochentag = datum => (new Date(datum + 'T12:00:00').getDay() + 6) % 7 + 1;   // 1 = Mo … 7 = So
const slotTage = (config, art) => new Set(((config.week && Array.isArray(config.week.slots)) ? config.week.slots : [])
  .filter(s => s && s.type === art).map(s => s.day));
const kraftGeplant = config => slotTage(config, 'strength').size > 0;
const ersterGig = logs => sortiert(logs).find(istGig);
const einmal = daten => [...new Set(daten)].sort();

/**
 * Die Tour eines Monats ('JJJJ-MM'). null, wenn keine Krafttage geplant
 * sind oder der Monat vor der ersten Einheit liegt.
 * Jedes Ziel: { id, ist, soll, ok, am } — `am` ist der Tag, an dem es erfuellt war.
 */
export function monatsTour(logs = [], config = {}, monat, { fahrten = [], heute = new Date() } = {}) {
  if (!kraftGeplant(config) || !/^\d{4}-\d{2}$/.test(String(monat))) return null;
  const erster = ersterGig(logs);
  const start = erster ? erster.date : ymd(heute);
  const [j, m] = monat.split('-').map(Number);
  const tage = [];
  for (let d = new Date(j, m - 1, 1, 12); d.getMonth() === m - 1; d.setDate(d.getDate() + 1)) tage.push(ymd(d));
  if (tage[tage.length - 1] < start || tage[0] > ymd(heute)) return null;
  const fenster = pausenFenster(config, ymd(heute));
  const zaehlt = tage.filter(d => d >= start && !fenster.some(f => f.von <= d && f.bis >= d));
  const soll = art => { const s = slotTage(config, art); return zaehlt.filter(d => s.has(wochentag(d))).length; };
  const imMonat = d => d && d.slice(0, 7) === monat;
  const ziel = (id, daten, n) => ({ id, ist: daten.length, soll: n, ok: daten.length >= n, am: daten.length >= n ? daten[n - 1] || null : null });

  const sollKraft = soll('strength');
  const kraft = sortiert(logs).filter(l => istKraft(l) && imMonat(l.date));
  const ziele = [ziel('kraft', einmal(kraft.map(l => l.date)), sollKraft)];
  const rad = mitDatum(fahrten).filter(f => imMonat(f.date));
  const sollRad = radGeplant(config) && mitDatum(fahrten).length ? soll('ride') : 0;
  if (sollRad) ziele.push(ziel('rad', einmal(rad.map(f => f.date)), sollRad));
  else {
    const neben = logs.filter(l => l && imMonat(l.date) && NEBEN_TYPEN.includes(typ(l))).map(l => l.date)
      .concat(mobilityTage(logs).filter(imMonat));
    // Anteilig wie das Kraft-Soll: wer am 20. anfaengt, braucht nicht vier.
    const anteil = sollKraft ? Math.max(1, Math.round(TOUR_ERSATZ * zaehlt.length / tage.length)) : 0;
    ziele.push(ziel('neben', einmal(neben), anteil));
  }
  const sauber = kraft.filter(l => l.lifts.length && l.lifts.every(e => e.success)).map(l => l.date);
  ziele.push(ziel('sauber', einmal(sauber), Math.ceil(sollKraft / 2)));

  // Ein Monat ganz in der Pause hat keinen Gegner: nichts zu besiegen, nichts verloren.
  const pause = sollKraft === 0;
  const komplett = !pause && ziele.every(z => z.ok);
  return {
    monat, ziele, pause, komplett,
    besiegtAm: komplett ? ziele.map(z => z.am).filter(Boolean).sort().pop() || null : null,
    laufend: monat === ymd(heute).slice(0, 7)
  };
}

/** Alle Monate seit der ersten Einheit, der juengste zuerst. */
export function monatsTouren(logs = [], config = {}, { fahrten = [], heute = new Date() } = {}) {
  const erster = ersterGig(logs);
  if (!erster || !kraftGeplant(config)) return [];
  const out = [];
  const bis = ymd(heute).slice(0, 7);
  for (let d = new Date(Number(erster.date.slice(0, 4)), Number(erster.date.slice(5, 7)) - 1, 1, 12);
    ymd(d).slice(0, 7) <= bis; d.setMonth(d.getMonth() + 1)) {
    const t = monatsTour(logs, config, ymd(d).slice(0, 7), { fahrten, heute });
    if (t) out.push(t);
  }
  return out.reverse();
}
