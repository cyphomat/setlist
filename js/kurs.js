// Der Kettlebell-Kurs: zwoelf Wochen, drei Einheiten pro Woche.
//
// Der Jam wuerfelt, der Kurs baut auf. Jede Woche knuepft an die vorige an:
// erst die Technik ohne Zeitdruck, dann Wiederholungen nach der Uhr, am
// Ende Dichte. Das Schema ist eigene Planung nach gaengigen Prinzipien
// (Huefte vor Swing, Swing vor einarmig, Get-up erst leicht) und nicht aus
// einer einzelnen Studie abgeschrieben. Belegt ist nur die Richtung: Swings
// steigern Maximal- und Schnellkraft (Lake & Lauder 2012, kleine Studie).
//
// Nichts hier wird gespeichert ausser dem Log der Einheit. Woche, Tag und
// Phase folgen aus der Zahl der abgeschlossenen Kurs-Einheiten; wer
// state.json neu ableitet, steht wieder in derselben Woche.
//
// Zusaetzlich gelesen: Sanchez, Thierry: Kettlebell Sport & Athlete
// Preparation (2009/2014, frei verteilte Abschlussarbeit, selbst als
// teils veraltet bezeichnet, nicht begutachtet). Daraus uebernommen sind
// nur Prinzipien, keine Zahlen fuer Wettkaempfer: erst Technik und
// Grundlagen, dann Umfang, dann Intensitaet, danach Entlastung; Saetze
// nach Tempo (Wiederholungen pro Minute) statt nach Zaehlen; Pausen so
// lang wie die Arbeit beim Intervall; Atmung nie anhalten.
//
// Reine Funktionen, kein I/O.

export const KURS_ID = 'kettlebell';
export const WOCHEN = 12;
export const PRO_WOCHE = 3;
export const TAGE = ['A', 'B', 'C'];

/* Drei Phasen zu je vier Wochen. Die vierte Woche jeder Phase ist
   Entlastung: weniger Umfang, gleiche Technik. In Woche 12 steht der Test. */
export const PHASEN = [
  { id: 'fundament', von: 1, bis: 4 },
  { id: 'grundlage', von: 5, bis: 8 },
  { id: 'ausbau',    von: 9, bis: 12 }
];

/* Uebungen. `seiten` heisst: Wiederholungen gelten je Arm bzw. je Seite.
   `leichter`/`schwerer` wie beim Unplugged, `standard` wie beim Jam.     */
export const UEBUNGEN = {
  hinge: { name: 'Hüftbeuge mit Kugel', cue: 'Hüfte nach hinten schieben, Rücken lang, Kugel zwischen den Füßen.',
    standard: 'Die Knie beugen nur leicht, der Rücken bleibt flach, oben stehen Hüfte und Knie ganz gestreckt. Die Bewegung kommt aus der Hüfte, nicht aus dem Rücken.',
    erklaerung: 'Die Grundlage für den Swing. Wer die Hüftbeuge nicht sauber kann, schwingt mit dem Rücken — und das merkt man erst, wenn es zieht.',
    leichter: ['Kugel auf einen Block stellen', 'Nur die Hüftbewegung ohne Kugel'], schwerer: ['Langsamer ablassen', 'Oben kurz halten'] },
  swing2: { name: 'Swing beidarmig', cue: 'Hüfte schnappt nach vorn, Arme sind nur Seil.',
    standard: 'Die Kugel steigt bis Brusthöhe, die Arme bleiben lang. Unten geht sie hinter die Oberschenkel, oben stehen Hüfte und Knie ganz gestreckt. Kein Heben mit den Schultern.',
    erklaerung: 'Explosive Hüftstreckung. Nach Lake & Lauder (2012, 21 junge Männer) steigerten Swings zweimal pro Woche Maximalkraft und Schnellkraft ähnlich wie Sprungkniebeugen. Kleine Studie, aber die Richtung passt. Atmen: aus am Hochpunkt, ein beim Zurückschwingen, nicht die Luft anhalten (Sanchez 2009 beschreibt das fürs Reißen, die Übertragung auf den Swing ist unsere).',
    leichter: ['Leichtere Kugel', 'Weniger Wiederholungen je Satz'], schwerer: ['Schwerere Kugel', 'Mehr Wiederholungen je Minute'] },
  swing1: { name: 'Swing einarmig', cue: 'Schulter bleibt unten, Rumpf fest gegen die Drehung.',
    standard: 'Wie beidarmig, aber die freie Hand bleibt locker. Der Rumpf dreht sich nicht mit. Seitenwechsel nur am Hochpunkt oder in der Pause.',
    erklaerung: 'Dieselbe Hüftarbeit, dazu muss der Rumpf die Drehung verhindern. Erst einarmig, wenn beidarmig ruhig und gleichmäßig läuft.',
    leichter: ['Zurück zum beidarmigen Swing', 'Leichtere Kugel'], schwerer: ['Schwerere Kugel', 'Seitenwechsel im Flug'] },
  goblet: { name: 'Goblet Squat', cue: 'Ellbogen zwischen die Knie, Brust hoch.',
    standard: 'Hüftfalte unter dem Knie, die Kugel bleibt an der Brust, oben ganz strecken.',
    erklaerung: 'Kniebeuge mit der Last vorn. Das Gewicht zwingt zu einem aufrechten Oberkörper und zeigt sofort, wo Beweglichkeit fehlt.',
    leichter: ['Leichtere Kugel', 'Box als Tiefenbegrenzung'], schwerer: ['Drei Sekunden runter', 'Unten zwei Sekunden halten'] },
  getup: { name: 'Turkish Get-up', cue: 'Augen auf die Kugel, Arm steil nach oben.',
    standard: 'Der Arm mit der Kugel bleibt über der Schulter gestreckt, du kommst Schritt für Schritt bis zum Stand und genauso wieder zurück. Jede Position wird kurz gehalten.',
    erklaerung: 'Langsam und in Schritten vom Boden in den Stand. Trainiert Schulterstabilität, Rumpf und Koordination. Zuerst ohne Gewicht, dann mit einem Schuh auf der Faust, dann mit Kugel.',
    leichter: ['Ohne Kugel', 'Mit einem Schuh auf der Faust'], schwerer: ['Schwerere Kugel', 'Pause in jeder Position zwei Sekunden'] },
  halo: { name: 'Halo', cue: 'Kugel eng um den Kopf, Rippen unten.',
    standard: 'Die Kugel kreist eng um den Kopf, der Rumpf bleibt ruhig, die Rippen gehen nicht nach vorn. Richtung nach der Hälfte der Wiederholungen wechseln.',
    erklaerung: 'Mobilisiert Schultern und oberen Rücken und wärmt für alles Weitere auf. Kein Kraftübung, sondern ein Check: Wo klemmt es?',
    leichter: ['Leichtere Kugel', 'Größerer Kreis'], schwerer: ['Kleinerer Kreis', 'Langsamer'] },
  carry: { name: 'Koffertrage', cue: 'Aufrecht gehen, Schulter nicht nach unten ziehen lassen.',
    standard: 'Die Kugel hängt seitlich am Körper, du gehst aufrecht, der Rumpf kippt nicht zur Kugel. Seitenwechsel nach der Hälfte der Zeit.',
    erklaerung: 'Gehen mit einseitiger Last. Der Rumpf muss das Wegkippen verhindern, ohne dass irgendetwas laut wird.',
    leichter: ['Leichtere Kugel', 'Kürzere Zeit'], schwerer: ['Schwerere Kugel', 'Kugel in der Frontposition (Rack Carry)'] },
  rackcarry: { name: 'Rack Carry', cue: 'Kugel an der Brust, Ellbogen am Körper, Rippen unten.',
    standard: 'Die Kugel ruht in der Frontposition, der Ellbogen liegt am Körper, du gehst aufrecht ohne ins Hohlkreuz zu kippen.',
    erklaerung: 'Tragen in der Frontposition. Verlängert die Zeit unter Spannung für Rumpf und Schulter und bereitet das Drücken vor.',
    leichter: ['Leichtere Kugel', 'Koffertrage statt Rack Carry'], schwerer: ['Schwerere Kugel', 'Längere Strecke'] },
  clean: { name: 'Clean einarmig', cue: 'Kugel eng am Körper führen, nicht nach außen schwingen.',
    standard: 'Die Kugel landet in der Frontposition am Unterarm, ohne aufs Handgelenk zu schlagen. Oben stehen Hüfte und Knie gestreckt, unten hängt der Arm wieder lang. Der Ellbogen ruht tief am Beckenknochen, nicht hoch auf dem Bauch: so bleibt Platz zum Atmen.',
    erklaerung: 'Einarmiges Umsetzen in die Frontposition. Aus dem Swing entwickelt: dieselbe Hüfte, nur der Weg der Kugel ist kürzer.',
    leichter: ['Leichtere Kugel', 'Weniger Wiederholungen'], schwerer: ['Schwerere Kugel', 'Langsam ablassen'] },
  press: { name: 'Drücken einarmig', cue: 'Faust zeigt zur Decke, Rumpf und Gesäß fest.',
    standard: 'Aus der Frontposition drückst du die Kugel senkrecht nach oben, bis Arm und Rumpf eine Linie bilden. Kein Hohlkreuz, Gesäß und Bauch bleiben fest.',
    erklaerung: 'Überkopfdrücken mit einer Hand. Der Rumpf arbeitet gegen die Schieflage mit — deshalb ist der Press mit Kugel mehr als Schulter.',
    leichter: ['Leichtere Kugel', 'Halbe Strecke'], schwerer: ['Schwerere Kugel', 'Langsam ablassen'] },
  highpull: { name: 'High Pull', cue: 'Ellbogen führt, Kugel steigt zum Kinn.',
    standard: 'Die Kugel kommt mit hohem Ellbogen bis zur Brust, die Hüfte macht die Arbeit. Oben stehen Hüfte und Knie ganz gestreckt.',
    erklaerung: 'Vorstufe zum Snatch: die Hüftstreckung des Swings, dazu ein Zug nach oben. Wer das sauber kann, versteht, wie der Snatch später funktioniert.',
    leichter: ['Leichtere Kugel', 'Weniger Wiederholungen'], schwerer: ['Schwerere Kugel', 'Dichter getaktet'] }
};

const U = Object.keys(UEBUNGEN);

/**
 * Bausteine. `u` ist eine Uebung oder eine Folge (Komplex). `art`:
 *   saetze  — Saetze nach Wiederholungen, Pause dazwischen
 *   zeit    — Saetze auf Zeit (Tragen)
 *   takt    — feste Runden: alle `takt` Sekunden `wdh` Wiederholungen
 * `last` ist 'leicht' oder 'schwer' und meint die Kugel, die du dir
 * einstellst; wie viel Kilo das sind, entscheidest du.
 */
const satz = (u, saetze, wdh, extra = {}) => ({ art: 'saetze', u: [].concat(u), saetze, wdh, pause: 60, ...extra });
const zeit = (u, saetze, sek, extra = {}) => ({ art: 'zeit', u: [].concat(u), saetze, sek, pause: 45, ...extra });
const takt = (u, runden, wdh, taktSek = 30, extra = {}) => ({ art: 'takt', u: [].concat(u), runden, wdh, takt: taktSek, ...extra });
const warm = () => satz('halo', 1, 5, { seiten: true, warm: true, pause: 0, last: 'leicht' });

/* Wochenplaene. Drei Einheiten je Woche, `wi` ist die Woche in der Phase
   (0..3). Die vierte Woche ist jeweils Entlastung.                       */
const PLAN = {
  fundament: {
    A: wi => [warm(),
      satz('hinge', 3, [8, 10, 10, 8][wi], { last: 'leicht' }),
      satz('goblet', 3, [6, 8, 8, 6][wi], { last: 'leicht' }),
      zeit('carry', 2, [20, 30, 30, 20][wi], { seiten: true, last: 'leicht' })],
    B: wi => [warm(),
      satz('hinge', 1, 8, { last: 'leicht', pause: 30 }),
      takt('swing2', [8, 8, 8, 6][wi], [10, 10, 12, 10][wi], 30, { last: 'leicht' }),
      satz('getup', 2, 2, { seiten: true, last: 'leicht', ohneLast: true })],
    C: wi => [warm(),
      satz('getup', 3, [2, 2, 3, 2][wi], { seiten: true, last: 'leicht', ohneLast: wi === 0 }),
      satz('goblet', 3, 8, { last: 'leicht' }),
      satz('swing2', 3, [12, 15, 15, 10][wi], { last: 'leicht' })]
  },
  grundlage: {
    A: wi => [warm(),
      satz('clean', 3, [5, 6, 6, 4][wi], { seiten: true, last: 'leicht' }),
      satz('press', 3, [4, 5, 5, 3][wi], { seiten: true, last: 'leicht' }),
      satz('goblet', 3, 10, { last: 'schwer' }),
      zeit('rackcarry', 2, [20, 30, 30, 20][wi], { seiten: true, last: 'leicht' })],
    B: wi => [warm(),
      takt('swing1', [8, 10, 12, 8][wi], 10, 30, { last: 'leicht', seitenwechsel: true }),
      satz('hinge', 2, 8, { last: 'schwer', pause: 45 })],
    C: wi => [warm(),
      satz('getup', 4, [2, 3, 3, 2][wi], { seiten: true, last: 'leicht' }),
      satz('swing1', 3, [8, 10, 10, 6][wi], { seiten: true, last: 'leicht' }),
      zeit('carry', 2, 30, { seiten: true, last: 'schwer' })]
  },
  ausbau: {
    A: wi => [warm(),
      satz(['clean', 'press'], [3, 4, 4, 3][wi], [3, 3, 4, 3][wi], { seiten: true, last: 'schwer', komplex: true }),
      satz('goblet', 3, 10, { last: 'schwer' }),
      zeit('rackcarry', 2, 30, { seiten: true, last: 'schwer' })],
    B: wi => [warm(),
      takt('swing1', [10, 12, 15, 10][wi], 10, 30, { last: 'schwer', seitenwechsel: true }),
      satz('highpull', 3, 6, { seiten: true, last: 'leicht', pause: 45 })],
    C: wi => wi < 3
      ? [warm(),
        takt('getup', [6, 8, 10][wi], 1, 60, { seiten: true, last: 'leicht', seitenwechsel: true }),
        zeit('carry', 2, 30, { seiten: true, last: 'schwer' })]
      // Woche 12: der Test. 100 einarmige Swings in fuenf Minuten, dann
      // zehn Get-ups auf die Minute. Keine Rekordjagd: eine Standortbestimmung.
      : [warm(),
        takt('swing1', 10, 10, 30, { last: 'schwer', seitenwechsel: true, test: true }),
        takt('getup', 10, 1, 60, { seiten: true, last: 'leicht', seitenwechsel: true, test: true })]
  }
};

/** Welche Phase gehoert zur Woche (1..12)? */
export function phase(woche) {
  return PHASEN.find(p => woche >= p.von && woche <= p.bis) || null;
}

/** Nur die Logs dieses Kurses, nach Abschluss sortiert. */
export function kursLogs(logs = [], kurs = KURS_ID) {
  return (logs || [])
    .filter(l => l && l.type === 'kurs' && (l.kurs || KURS_ID) === kurs && l.date)
    .sort((a, b) => String(a.finished || a.date).localeCompare(String(b.finished || b.date)));
}

/**
 * Wo stehst du? Aus der Zahl der abgeschlossenen Einheiten:
 * nach 0 → Woche 1 Tag A, nach 3 → Woche 2 Tag A, nach 36 → fertig.
 */
export function zustand(logs = []) {
  const n = kursLogs(logs).length;
  const fertig = n >= WOCHEN * PRO_WOCHE;
  const woche = fertig ? WOCHEN : Math.floor(n / PRO_WOCHE) + 1;
  const tag = fertig ? null : TAGE[n % PRO_WOCHE];
  const p = phase(woche);
  return {
    absolviert: n, fertig, woche, tag,
    einheit: fertig ? null : n + 1,
    phase: p ? p.id : null,
    wocheInPhase: p ? woche - p.von + 1 : 0,
    entlastung: !!p && woche === p.bis,
    test: woche === WOCHEN && tag === 'C'
  };
}

/** Der Plan einer Einheit. `woche` 1..12, `tag` A/B/C. */
export function einheit(woche, tag) {
  const p = phase(woche);
  if (!p || !TAGE.includes(tag)) return null;
  const wi = woche - p.von;
  const bloecke = PLAN[p.id][tag](wi);
  const test = bloecke.some(b => b.test);
  return { kurs: KURS_ID, woche, tag, phase: p.id, entlastung: woche === p.bis && !test, test, bloecke };
}

/** Der Plan der naechsten Einheit — oder null, wenn der Kurs durch ist. */
export function naechste(logs = []) {
  const z = zustand(logs);
  return z.fertig ? null : einheit(z.woche, z.tag);
}

/** Dauer in Minuten, aufgerundet auf volle fuenf. Schaetzung, kein Versprechen. */
export function minuten(e) {
  let s = 0;
  for (const b of e.bloecke) {
    if (b.art === 'takt') s += b.runden * b.takt;
    else if (b.art === 'zeit') s += b.saetze * (b.sek * (b.seiten ? 2 : 1) + b.pause);
    else s += b.saetze * ((b.seiten ? 2 : 1) * b.wdh * 3 + b.pause);
  }
  return Math.max(5, Math.ceil(s / 60 / 5) * 5);
}

/**
 * Der Ablauf als flache Liste. Die Oberflaeche geht ihn nur ab:
 *   satz  — wartet auf "fertig"
 *   takt  — laeuft nach der Uhr weiter
 *   pause — zaehlt herunter, ueberspringbar
 * Die letzte Pause eines Bausteins entfaellt; Bausteine trennt nichts.
 */
export function ablauf(e) {
  const schritte = [];
  e.bloecke.forEach((b, bi) => {
    const n = b.art === 'takt' ? b.runden : b.saetze;
    for (let i = 1; i <= n; i++) {
      const s = { art: b.art === 'takt' ? 'takt' : 'satz', block: bi, nr: i, von: n, b };
      if (b.art === 'takt') s.sekunden = b.takt;
      if (b.art === 'takt' && b.seitenwechsel) s.seite = i % 2 === 1 ? 1 : 2;
      schritte.push(s);
      if (b.art !== 'takt' && b.pause > 0 && i < n) schritte.push({ art: 'pause', sekunden: b.pause, block: bi, nr: i, von: n, b });
    }
  });
  return schritte;
}

/** Name des Bausteins, bei Komplexen mit Pfeil verbunden. */
export const blockName = b => b.u.map(id => (UEBUNGEN[id] || {}).name || id).join(' → ');

/** Eine Zeile Klartext fuer Log und Historie. */
export function label(e) {
  return `Kettlebell-Kurs · Woche ${e.woche}${e.tag} · ${e.bloecke.filter(b => !b.warm).map(blockName).join(' / ')}`;
}

export const BEWERTUNGEN = ['leicht', 'passend', 'zaeh'];
export const bewertungOk = b => BEWERTUNGEN.includes(b);

/**
 * Soll die Kugel wechseln? Zwei Einheiten in Folge als "leicht" bewertet →
 * 'hoch'. Zwei in Folge "zaeh" → 'runter'. Sonst null. Es bleibt ein
 * Vorschlag: gewogen wird nichts, gespeichert wird nur die Bewertung.
 */
export function lastVorschlag(logs = []) {
  const letzte = kursLogs(logs).slice(-2).map(l => l.bewertung);
  if (letzte.length < 2) return null;
  if (letzte.every(b => b === 'leicht')) return 'hoch';
  if (letzte.every(b => b === 'zaeh')) return 'runter';
  return null;
}

/** Wie viele Einheiten dieser Woche sind schon gemacht (0..3)? */
export function wocheFortschritt(logs = []) {
  const z = zustand(logs);
  return z.fertig ? PRO_WOCHE : z.absolviert % PRO_WOCHE;
}

export { U as UEBUNGS_IDS };
