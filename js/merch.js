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
import { tonnage, gewichtsReihe, wochenSerie } from './stats.js';
import { pausenFenster } from './verletzung.js';

/** Was als Gig zaehlt: alles, wofuer man ins Studio gegangen ist. */
export const GIG_TYPEN = ['strength', 'wod', 'unplugged', 'maxout'];
const typ = l => l.type || 'strength';
const istGig = l => l && l.date && GIG_TYPEN.includes(typ(l));
const istKraft = l => typ(l) === 'strength' && Array.isArray(l.lifts);

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
const PLATTEN_STUFEN = [1, 2, 3, 4];
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

/**
 * Welche Aufnaeher es fuer diese Konfiguration ueberhaupt gibt.
 * `gruppe` ist die Leiter: an der Wand steht je Gruppe nur der naechste
 * fehlende, damit keine Weste voller leerer Kreise entsteht.
 */
export function katalog(config = {}, { mitGewicht = false } = {}) {
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

  for (const [id, def] of Object.entries(lifts)) {
    for (const n of PLATTEN_STUFEN) {
      p(`platten-${id}-${n}`, 'kraft', `platten-${id}`, 'merch.p.platten',
        { name: def.name || id, n, kg: plattenKg(bar, n) });
    }
  }
  if (CLUB_LIFTS.every(id => lifts[id])) p('club', 'kraft', 'club', 'merch.p.club', { kg: CLUB_KG });
  if (mitGewicht) {
    for (const m of KOERPER_MARKEN) {
      if (!lifts[m.lift]) continue;
      p(`koerper-${m.lift}`, 'kraft', `koerper-${m.lift}`, 'merch.p.koerper',
        { name: lifts[m.lift].name || m.lift, f: m.faktor });
    }
  }

  p('comeback', 'comeback', 'comeback', 'merch.p.comeback');
  p('rueckweg', 'comeback', 'rueckweg', 'merch.p.rueckweg');
  if (Object.values(lifts).some(d => d && d.reference)) p('reunion', 'comeback', 'reunion', 'merch.p.reunion');

  for (const n of SERIE_STUFEN) p(`serie-${n}`, 'serie', 'serie', 'merch.p.serie', { n });
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
export function aufnaeher(logs = [], config = {}, wellness = [], heute = new Date()) {
  const reihe = gewichtsReihe(wellness);
  const kat = katalog(config, { mitGewicht: reihe.length > 0 });
  const gibt = new Set(kat.map(k => k.id));
  const verdient = {};
  const setze = (id, datum) => { if (gibt.has(id) && !verdient[id]) verdient[id] = datum; };

  const lifts = config.lifts || {};
  const bar = config.bar || 20;
  const refs = Object.entries(lifts).filter(([, d]) => d && d.reference);
  const best = {};
  const gigTage = new Set();
  let unplugged = 0, zugaben = 0, tight = 0, comebackOffen = false;

  for (const { log, vorher, nachher } of zeitleiste(logs, config)) {
    const d = log.date;
    if (istGig(log)) {
      gigTage.add(d);
      if (gigTage.size >= 1) setze('debuet', d);
      for (const n of GIG_STUFEN) if (gigTage.size >= n) setze(`gigs-${n}`, d);
    }

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

  // Serien: dieselbe Rechnung wie der Rekord in der Tour, mit Verletzungspause.
  const fenster = pausenFenster(config, ymd(heute));
  const tage = [...gigTage].sort();
  for (const w of wochenSerie(tage, fenster)) {
    for (const n of SERIE_STUFEN) {
      if (w.laufend >= n && w.trainiert) setze(`serie-${n}`, tage.find(t => t >= w.montag));
    }
  }

  return kat.map(k => ({ ...k, verdient: verdient[k.id] || null }));
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
export function neueAufnaeher(vorherLogs = [], nachherLogs = [], config = {}, wellness = [], heute = new Date()) {
  const alt = new Set(aufnaeher(vorherLogs, config, wellness, heute).filter(a => a.verdient).map(a => a.id));
  return aufnaeher(nachherLogs, config, wellness, heute).filter(a => a.verdient && !alt.has(a.id));
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

export function rang(logs = []) {
  const wochen = new Set(logs.filter(istGig).map(l => montagKey(l.date))).size;
  let i = 0;
  while (i + 1 < RAENGE.length && wochen >= RAENGE[i + 1].wochen) i++;
  const r = RAENGE[i], n = RAENGE[i + 1] || null;
  return {
    id: r.id, stufe: i, wochen,
    naechste: n ? { id: n.id, wochen: n.wochen, fehlt: n.wochen - wochen } : null,
    anteil: n ? (wochen - r.wochen) / (n.wochen - r.wochen) : 1
  };
}

/* ============================== Tourshirts ============================== */

const ADJ = ['Iron', 'Steel', 'Thunder', 'Heavy', 'Black', 'Electric',
  'Molten', 'Savage', 'Midnight', 'Raw', 'Burning', 'Chrome'];
const NOMEN = ['Barbell', 'Plates', 'Chalk', 'Anvil', 'Riffs', 'Hammer',
  'Voltage', 'Furnace', 'Amplifier', 'Rust', 'Rack', 'Reps'];

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Ein Tourname, der fuer dasselbe Quartal immer derselbe ist. */
export function tourName(jahr, quartal) {
  const h = hash(`${jahr}-Q${quartal}`);
  return `${ADJ[h % ADJ.length]} ${NOMEN[(h >>> 8) % NOMEN.length]} Tour`;
}

const quartalVon = datum => Math.floor((Number(datum.slice(5, 7)) - 1) / 3) + 1;
const ART = { strength: 'kraft', wod: 'jam', unplugged: 'unplugged', maxout: 'maxout' };

/**
 * Jedes Quartal mit mindestens einem Gig ist eine Tour, die neueste zuerst.
 * Ein Gig ist ein Tag — Kraft und Jam am selben Abend sind ein Konzert.
 */
export function touren(logs = [], heute = new Date(), liste = []) {
  const jetzt = ymd(heute);
  const map = new Map();
  for (const l of sortiert(logs)) {
    if (!istGig(l)) continue;
    const jahr = Number(l.date.slice(0, 4)), q = quartalVon(l.date);
    const key = `${jahr}-Q${q}`;
    if (!map.has(key)) map.set(key, { jahr, quartal: q, tage: new Map(), kg: 0 });
    const t = map.get(key);
    if (!t.tage.has(l.date)) t.tage.set(l.date, { date: l.date, arten: [], ort: null });
    const tag = t.tage.get(l.date);
    const art = ART[typ(l)];
    if (!tag.arten.includes(art)) tag.arten.push(art);
    if (!tag.ort && l.ort) tag.ort = String(l.ort);
    t.kg += tonnage(l);
  }
  return [...map.values()].reverse().map(t => {
    const key = `${t.jahr}-Q${t.quartal}`;
    return {
      jahr: t.jahr, quartal: t.quartal,
      name: tourName(t.jahr, t.quartal),
      laufend: Number(jetzt.slice(0, 4)) === t.jahr && quartalVon(jetzt) === t.quartal,
      gigs: [...t.tage.values()],
      tonnen: Math.round(t.kg / 100) / 10,
      aufnaeher: liste.filter(a => a.verdient && `${a.verdient.slice(0, 4)}-Q${quartalVon(a.verdient)}` === key).length
    };
  });
}

/**
 * Die Tour-Bilanz eines Jahres. Je Lift das Arbeitsgewicht vor dem ersten
 * und nach dem letzten Log des Jahres — beides aus dem nachgespielten
 * Zustand, damit ein Max-Out oder eine Anpassung richtig mitgerechnet wird.
 */
export function jahresBilanz(logs = [], config = {}, jahr, { heute = new Date(), liste = [] } = {}) {
  const imJahr = l => l.date.slice(0, 4) === String(jahr);
  const schritte = zeitleiste(logs, config).filter(z => imJahr(z.log));
  const gigs = sortiert(logs).filter(l => istGig(l) && imJahr(l));
  if (!gigs.length) return null;

  const tage = [...new Set(gigs.map(l => l.date))];
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
