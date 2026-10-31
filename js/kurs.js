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

/** In diesen Wochen steht am Tag C ein Check. */
export const TESTS = { 4: 'w4', 8: 'w8', 12: 'w12' };

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
  hinge: { name: 'Hip Hinge', cue: 'Hips back, spine long, bell between the feet.',
    standard: 'Die Knie beugen nur leicht, der Rücken bleibt flach, oben stehen Hüfte und Knie ganz gestreckt. Die Bewegung kommt aus der Hüfte, nicht aus dem Rücken.',
    erklaerung: 'Die Grundlage für den Swing. Wer die Hüftbeuge nicht sauber kann, schwingt mit dem Rücken — und das merkt man erst, wenn es zieht.',
    leichter: ['Kugel auf einen Block stellen', 'Nur die Hüftbewegung ohne Kugel'], schwerer: ['Langsamer ablassen', 'Oben kurz halten'] },
  swing2: { name: 'Swing', cue: 'Snap the hips, arms are just ropes.',
    standard: 'Die Kugel steigt bis Brusthöhe, die Arme bleiben lang. Unten geht sie hinter die Oberschenkel, oben stehen Hüfte und Knie ganz gestreckt. Kein Heben mit den Schultern.',
    erklaerung: 'Explosive Hüftstreckung. Nach Lake & Lauder (2012, 21 junge Männer) steigerten Swings zweimal pro Woche Maximalkraft und Schnellkraft ähnlich wie Sprungkniebeugen. Kleine Studie, aber die Richtung passt. Atmen: aus am Hochpunkt, ein beim Zurückschwingen, nicht die Luft anhalten (Sanchez 2009 beschreibt das fürs Reißen, die Übertragung auf den Swing ist unsere).',
    leichter: ['Leichtere Kugel', 'Weniger Wiederholungen je Satz'], schwerer: ['Schwerere Kugel', 'Mehr Wiederholungen je Minute'] },
  swing1: { name: 'One-arm Swing', cue: 'Shoulder stays down, core resists the twist.',
    standard: 'Wie beidarmig, aber die freie Hand bleibt locker. Der Rumpf dreht sich nicht mit. Seitenwechsel nur am Hochpunkt oder in der Pause.',
    erklaerung: 'Dieselbe Hüftarbeit, dazu muss der Rumpf die Drehung verhindern. Erst einarmig, wenn beidarmig ruhig und gleichmäßig läuft.',
    leichter: ['Zurück zum beidarmigen Swing', 'Leichtere Kugel'], schwerer: ['Schwerere Kugel', 'Seitenwechsel im Flug'] },
  goblet: { name: 'Goblet Squat', cue: 'Elbows between the knees, chest up.',
    standard: 'Hüftfalte unter dem Knie, die Kugel bleibt an der Brust, oben ganz strecken.',
    erklaerung: 'Kniebeuge mit der Last vorn. Das Gewicht zwingt zu einem aufrechten Oberkörper und zeigt sofort, wo Beweglichkeit fehlt.',
    leichter: ['Leichtere Kugel', 'Box als Tiefenbegrenzung'], schwerer: ['Drei Sekunden runter', 'Unten zwei Sekunden halten'] },
  getup: { name: 'Turkish Get-up', cue: 'Eyes on the bell, arm vertical.',
    standard: 'Der Arm mit der Kugel bleibt über der Schulter gestreckt, du kommst Schritt für Schritt bis zum Stand und genauso wieder zurück. Jede Position wird kurz gehalten.',
    erklaerung: 'Langsam und in Schritten vom Boden in den Stand. Trainiert Schulterstabilität, Rumpf und Koordination. Zuerst ohne Gewicht, dann mit einem Schuh auf der Faust, dann mit Kugel.',
    leichter: ['Ohne Kugel', 'Mit einem Schuh auf der Faust'], schwerer: ['Schwerere Kugel', 'Pause in jeder Position zwei Sekunden'] },
  halo: { name: 'Halo', cue: 'Bell close around the head, ribs down.',
    standard: 'Die Kugel kreist eng um den Kopf, der Rumpf bleibt ruhig, die Rippen gehen nicht nach vorn. Richtung nach der Hälfte der Wiederholungen wechseln.',
    erklaerung: 'Mobilisiert Schultern und oberen Rücken und wärmt für alles Weitere auf. Kein Kraftübung, sondern ein Check: Wo klemmt es?',
    leichter: ['Leichtere Kugel', 'Größerer Kreis'], schwerer: ['Kleinerer Kreis', 'Langsamer'] },
  carry: { name: 'Suitcase Carry', cue: 'Walk tall, do not lean toward the bell.',
    standard: 'Die Kugel hängt seitlich am Körper, du gehst aufrecht, der Rumpf kippt nicht zur Kugel. Seitenwechsel nach der Hälfte der Zeit.',
    erklaerung: 'Gehen mit einseitiger Last. Der Rumpf muss das Wegkippen verhindern, ohne dass irgendetwas laut wird.',
    leichter: ['Leichtere Kugel', 'Kürzere Zeit'], schwerer: ['Schwerere Kugel', 'Kugel in der Frontposition (Rack Carry)'] },
  rackcarry: { name: 'Rack Carry', cue: 'Bell at the chest, elbow on the body, ribs down.',
    standard: 'Die Kugel ruht in der Frontposition, der Ellbogen liegt am Körper, du gehst aufrecht ohne ins Hohlkreuz zu kippen.',
    erklaerung: 'Tragen in der Frontposition. Verlängert die Zeit unter Spannung für Rumpf und Schulter und bereitet das Drücken vor.',
    leichter: ['Leichtere Kugel', 'Koffertrage statt Rack Carry'], schwerer: ['Schwerere Kugel', 'Längere Strecke'] },
  clean: { name: 'One-arm Clean', cue: 'Keep the bell close, do not swing it wide.',
    standard: 'Die Kugel landet in der Frontposition am Unterarm, ohne aufs Handgelenk zu schlagen. Oben stehen Hüfte und Knie gestreckt, unten hängt der Arm wieder lang. Der Ellbogen ruht tief am Beckenknochen, nicht hoch auf dem Bauch: so bleibt Platz zum Atmen.',
    erklaerung: 'Einarmiges Umsetzen in die Frontposition. Aus dem Swing entwickelt: dieselbe Hüfte, nur der Weg der Kugel ist kürzer.',
    leichter: ['Leichtere Kugel', 'Weniger Wiederholungen'], schwerer: ['Schwerere Kugel', 'Langsam ablassen'] },
  press: { name: 'One-arm Press', cue: 'Fist to the ceiling, glutes and abs tight.',
    standard: 'Aus der Frontposition drückst du die Kugel senkrecht nach oben, bis Arm und Rumpf eine Linie bilden. Kein Hohlkreuz, Gesäß und Bauch bleiben fest.',
    erklaerung: 'Überkopfdrücken mit einer Hand. Der Rumpf arbeitet gegen die Schieflage mit — deshalb ist der Press mit Kugel mehr als Schulter.',
    leichter: ['Leichtere Kugel', 'Halbe Strecke'], schwerer: ['Schwerere Kugel', 'Langsam ablassen'] },
  highpull: { name: 'High Pull', cue: 'Elbow leads, bell rises to the chin.',
    standard: 'Die Kugel kommt mit hohem Ellbogen bis zur Brust, die Hüfte macht die Arbeit. Oben stehen Hüfte und Knie ganz gestreckt.',
    erklaerung: 'Vorstufe zum Snatch: die Hüftstreckung des Swings, dazu ein Zug nach oben. Wer das sauber kann, versteht, wie der Snatch später funktioniert.',
    leichter: ['Leichtere Kugel', 'Weniger Wiederholungen'], schwerer: ['Schwerere Kugel', 'Dichter getaktet'] },
  rad: { name: 'Zwift Ride', cue: 'Spin easy, then a few short spin-ups.',
    standard: 'Locker treten, so dass du dich unterhalten könntest. Bei den Antritten kurz zügig, etwa 7 von 10, kein Sprint, danach sofort wieder locker. Aufstehen musst du nicht.',
    erklaerung: 'Wärmt Kreislauf und Beine vor, bevor die Kugel dran ist. Kurz und locker genug, dass es dir nichts wegnimmt. Eigene Planung nach gängiger Praxis, nicht aus einer Studie; die Antritte sind keine Intervalle.',
    leichter: ['Nur den lockeren Teil treten', 'Antritte weglassen'], schwerer: ['Antritte zügiger', 'Eine Minute länger locker'] }
};

/* Fuer die laufende Einheit: wie die Bewegung geht und woran man sie erkennt,
   wenn sie schief laeuft. Eigene Beschreibung nach gaengiger Anleitung, kurz
   genug, um sie zwischen zwei Saetzen zu lesen. `strecke` heisst: man geht
   (Platz suchen), `richtung`: die "Seiten" sind Kreisrichtungen.           */
const HILFE = {
  hinge: {
    bild: 'hinge',
    schritte: ['Füße hüftbreit, die Kugel steht zwischen den Füßen.', 'Hüfte nach hinten schieben, Knie nur leicht beugen, Rücken lang.', 'Henkel mit beiden Händen greifen, Schultern nach hinten unten.', 'Aus der Hüfte aufrichten, oben das Gesäß fest anspannen.'],
    fehler: ['Rücken rund', 'Knie zu tief: wird zur Kniebeuge', 'Oben ins Hohlkreuz überstrecken']
  },
  swing2: {
    schritte: ['Kugel etwa einen Fuß vor dir, Füße etwas breiter als die Hüfte.', 'Kugel kippen und mit langen Armen hoch zwischen die Beine schwingen.', 'Hüfte kräftig nach vorn strecken: die Kugel schwebt bis Brusthöhe.', 'Kugel fallen lassen, Hüfte zurück, nächste Wiederholung.'],
    fehler: ['Die Kugel mit den Armen hochziehen', 'Mit dem Rücken statt der Hüfte schwingen', 'Oben nach hinten lehnen']
  },
  swing1: {
    schritte: ['Wie beidarmig, nur eine Hand am Henkel.', 'Die freie Hand bleibt locker neben dem Körper.', 'Die Schulter bleibt tief, der Rumpf dreht sich nicht mit.', 'Seite wechseln nur am Hochpunkt oder in der Pause.'],
    fehler: ['Schulter wird mit hochgezogen', 'Der Rumpf dreht zur Kugel']
  },
  goblet: {
    schritte: ['Kugel an der Brust halten, beide Hände am Henkel, Ellbogen nah am Körper.', 'Füße etwas breiter als die Schultern, Zehen leicht nach außen.', 'Gerade nach unten sinken, die Ellbogen gehen zwischen die Knie.', 'Aus den Fersen hochdrücken, oben Hüfte und Knie strecken.'],
    fehler: ['Fersen heben ab', 'Knie fallen nach innen', 'Der Oberkörper kippt nach vorn']
  },
  getup: {
    bild: 'getup',
    schritte: ['Auf dem Rücken: Kugel im gestreckten Arm über der Schulter, das Bein auf dieser Seite angewinkelt.', 'Auf den Ellbogen stützen, dann auf die Hand, Brust aufrichten.', 'Hüfte anheben, das gestreckte Bein unter dich ziehen, in den Kniestand.', 'Aufstehen. Zurück in umgekehrter Reihenfolge.'],
    fehler: ['Der Blick geht von der Kugel weg', 'Der Arm knickt ein', 'Zu schnell: jede Position kurz halten']
  },
  halo: {
    schritte: ['Kugel mit beiden Händen an den Henkelseiten vor der Brust halten, der Körper der Kugel zeigt nach oben.', 'Eng um den Kopf kreisen: hinter dem Nacken vorbei, am anderen Ohr wieder nach vorn.', 'Rippen unten, Kopf ruhig.', 'Nach der Hälfte die Richtung wechseln.'],
    fehler: ['Der Kreis wird weit, der Rücken geht ins Hohlkreuz', 'Der Kopf kippt nach vorn']
  },
  carry: {
    schritte: ['Kugel neben dir aufnehmen, Rücken gerade wie beim Hinge.', 'Aufrecht stehen, Schulter nach hinten unten, Rippen unten.', 'In normalem Tempo gehen, der Rumpf kippt nicht zur Kugel.', 'Am Ende der Strecke wenden. Die Hand wechselst du in der Pause.'],
    fehler: ['Zur Kugel hin lehnen', 'Die Schulter wird hochgezogen', 'Mit der freien Hand ausbalancieren']
  },
  rackcarry: {
    schritte: ['Kugel in die Frontposition: Ellbogen am Körper, Faust vor der Schulter.', 'Die Kugel liegt am Unterarm, das Handgelenk bleibt gerade.', 'Aufrecht gehen, Rippen unten, Gesäß fest.', 'Am Ende der Strecke wenden. Die Hand wechselst du in der Pause.'],
    fehler: ['Hohlkreuz', 'Der Ellbogen löst sich vom Körper']
  },
  clean: {
    schritte: ['Kugel zwischen die Füße, eine Hand am Henkel, wie zum einarmigen Swing anschwingen.', 'Die Hüfte streckt: die Kugel steigt eng am Körper entlang.', 'Sie klappt um den Unterarm in die Frontposition, ohne aufs Handgelenk zu schlagen.', 'Ablassen: die Kugel schwingt zurück, die Hüfte geht nach hinten.'],
    fehler: ['Die Kugel schlägt aufs Handgelenk', 'Mit dem Arm hochgezogen statt mit der Hüfte', 'Der Ellbogen steht weit ab']
  },
  press: {
    schritte: ['Aus der Frontposition: Gesäß und Bauch fest, Faust vor der Schulter.', 'Die Kugel senkrecht nach oben drücken, bis der Arm am Ohr gestreckt ist.', 'Oben bleibt das Handgelenk gerade, der Rumpf steht stabil.', 'Kontrolliert zurück in die Frontposition.'],
    fehler: ['Hohlkreuz beim Drücken', 'Die Kugel wandert nach vorn']
  },
  highpull: {
    schritte: ['Wie beim einarmigen Swing, der Ellbogen führt.', 'Die Hüfte streckt kräftig, der Ellbogen zieht hoch und nach außen.', 'Die Kugel steigt bis zur Brust, das Handgelenk bleibt gerade.', 'Kugel fallen lassen, Hüfte zurück.'],
    fehler: ['Mit den Armen statt der Hüfte ziehen', 'Die Kugel ist zu weit vom Körper', 'Rücken rund']
  }
};
for (const [id, h] of Object.entries(HILFE)) Object.assign(UEBUNGEN[id], h);

/** Bildstreifen zu Uebungen, in der Reihenfolge des Bogens assets/pixel/figuren.png (gebaut von tools/pixel.mjs aus tools/pixel-figur.mjs). */
export const FIGUREN = [{ id: 'hinge', n: 2 }, { id: 'getup', n: 7 }];

/** Wo die Bilder einer Uebung im Bogen liegen: erstes Bild, Anzahl, Bilder im ganzen Bogen. */
export function figur(id) {
  let start = 0;
  for (const f of FIGUREN) { if (f.id === id) return { start, n: f.n, gesamt: FIGUREN.reduce((a, x) => a + x.n, 0) }; start += f.n; }
  return null;
}
UEBUNGEN.carry.strecke = true;
UEBUNGEN.rackcarry.strecke = true;
UEBUNGEN.halo.richtung = true;

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

/* Aufwaermen auf dem Rad (Zwift Ride). Kein Teil des Plans, sondern eine
   Zutat: `einheit(woche, tag, { rad: true })` stellt es vor das Halo. Der Plan
   selbst und damit Woche, Tag und Log bleiben, wie sie sind.

   Sechs Minuten, an Testtagen acht: erst locker, dann drei (vier) Antritte
   von 20 Sekunden mit 40 Sekunden locker dazwischen. Eigene Planung nach
   gaengiger Praxis, nicht aus einer Studie; die Antritte sollen nicht
   ermueden, sondern wecken.                                               */
const RAD_ANTRITT = 20, RAD_ERHOLUNG = 40;

function radBlock(minuten) {
  const antritte = minuten >= 8 ? 4 : 3;
  const teile = [{ phase: 'locker', sek: minuten * 60 - antritte * (RAD_ANTRITT + RAD_ERHOLUNG) }];
  for (let i = 0; i < antritte; i++) {
    teile.push({ phase: 'antritt', sek: RAD_ANTRITT }, { phase: 'locker', sek: RAD_ERHOLUNG });
  }
  return { art: 'rad', u: ['rad'], warm: true, minuten, teile };
}

/** Dauer in Minuten; an Testtagen (Check in Woche 4, 8, 12) etwas laenger. */
export const RAD_MINUTEN = 6;
export const RAD_MINUTEN_TEST = 8;

/** Eine Fahrt von mindestens dieser Laenge, die hoechstens so lange her ist, waermt schon. */
export const RAD_MIN_FAHRT = 15;
export const RAD_SCHON_STUNDEN = 3;

/**
 * Soll das Rad vor die Einheit? `zwiftride`: der gewaehlte Ort hat eins.
 * `fahrten`: die entdoppelten Fahrten aus intervals.icu (mit `zeit`, `minutes`).
 * Ergebnis { an, grund } mit grund 'kein' (kein Rad am Ort), 'schon' (vor
 * `vorMin` Minuten gefahren) oder 'ok'. Ein Vorschlag, den man umstellen kann.
 */
export function radVorschlag({ zwiftride = false, fahrten = [], jetzt = new Date() } = {}) {
  if (!zwiftride) return { an: false, grund: 'kein' };
  const j = new Date(jetzt).getTime();
  for (const f of fahrten || []) {
    if (!f || !f.zeit) continue;
    const start = new Date(f.zeit).getTime(), min = Number(f.minutes) || 0;
    if (isNaN(start) || min < RAD_MIN_FAHRT || start > j) continue;
    const vor = j - (start + min * 60000);
    if (vor < RAD_SCHON_STUNDEN * 3600000) return { an: false, grund: 'schon', vorMin: Math.max(0, Math.round(vor / 60000)) };
  }
  return { an: true, grund: 'ok' };
}

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
    C: wi => wi < 3
      ? [warm(),
        satz('getup', 3, [2, 2, 3][wi], { seiten: true, last: 'leicht', ohneLast: wi === 0 }),
        satz('goblet', 3, 8, { last: 'leicht' }),
        satz('swing2', 3, [12, 15, 15][wi], { last: 'leicht' })]
      // Woche 4: Check 1. 100 beidarmige Swings in fuenf Minuten, dazu
      // zwei saubere Get-ups je Seite. Standortbestimmung, kein Rekord.
      : [warm(),
        takt('swing2', 10, 10, 30, { last: 'leicht', test: 'w4' }),
        satz('getup', 1, 2, { seiten: true, last: 'leicht', test: 'w4' })]
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
    C: wi => wi < 3
      ? [warm(),
        satz('getup', 4, [2, 3, 3][wi], { seiten: true, last: 'leicht' }),
        satz('swing1', 3, [8, 10, 10][wi], { seiten: true, last: 'leicht' }),
        zeit('carry', 2, 30, { seiten: true, last: 'schwer' })]
      // Woche 8: Check 2. 100 einarmige Swings in fuenf Minuten, vier Get-ups je Seite.
      : [warm(),
        takt('swing1', 10, 10, 30, { last: 'schwer', seitenwechsel: true, test: 'w8' }),
        satz('getup', 1, 4, { seiten: true, last: 'leicht', test: 'w8' })]
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
        takt('swing1', 10, 10, 30, { last: 'schwer', seitenwechsel: true, test: 'w12' }),
        takt('getup', 10, 1, 60, { seiten: true, last: 'leicht', seitenwechsel: true, test: 'w12' })]
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
    test: tag === 'C' && !!TESTS[woche],
    testId: tag === 'C' ? TESTS[woche] || null : null
  };
}

/**
 * Der Plan einer Einheit. `woche` 1..12, `tag` A/B/C. Mit `{ rad: true }` steht
 * das Aufwaermen auf dem Rad davor (an Testtagen etwas laenger).
 */
export function einheit(woche, tag, { rad = false } = {}) {
  const p = phase(woche);
  if (!p || !TAGE.includes(tag)) return null;
  const wi = woche - p.von;
  const bloecke = PLAN[p.id][tag](wi);
  const testId = (bloecke.find(b => b.test) || {}).test || null;
  if (rad) bloecke.unshift(radBlock(testId ? RAD_MINUTEN_TEST : RAD_MINUTEN));
  return { kurs: KURS_ID, woche, tag, phase: p.id, entlastung: woche === p.bis && !testId, test: !!testId, testId, bloecke };
}

/** Der Plan der naechsten Einheit — oder null, wenn der Kurs durch ist. */
export function naechste(logs = [], opt = {}) {
  const z = zustand(logs);
  return z.fertig ? null : einheit(z.woche, z.tag, opt);
}

/* Umbauten: Zeit, um vom Rad zu steigen, die Kugel mit Scheiben neu zu laden
   oder zur Gehstrecke zu kommen. Dazu die kurze Pause beim Handwechsel.
   Eigene Schaetzung, gedacht fuer eine aufschraubbare Kugel.              */
export const UMBAU_SEKUNDEN = { rad: 90, kugel: 90, strecke: 30 };
export const WECHSEL_SEKUNDEN = 10;

const nutztKugel = b => b.art !== 'rad' && !b.ohneLast;
const gehtStrecke = b => b.u.some(id => (UEBUNGEN[id] || {}).strecke);

/**
 * Welche Umbauten stehen vor welchem Baustein? Eine Liste je Baustein mit
 * 'rad' (vom Rad runter), 'kugel' (anderes Gewicht) und 'strecke' (zur
 * Gehstrecke). Die Kugel wechselt, wenn beide Gewichte bekannt sind und
 * abweichen, sonst wenn sich "leicht"/"schwer" aendert. Das Aufwaermen hat
 * kein eigenes Gewicht und zaehlt nur ueber "leicht".
 */
export function umbauten(e, kugeln = {}) {
  let stand = null;
  return e.bloecke.map((b, bi) => {
    const vor = e.bloecke[bi - 1];
    const arten = [];
    if (vor && vor.art === 'rad' && b.art !== 'rad') arten.push('rad');
    if (nutztKugel(b)) {
      const kg = b.warm ? 0 : Number(kugeln[kugelSchluessel(b)]) || 0;
      const last = b.last || null;
      if (stand && (kg && stand.kg ? kg !== stand.kg : last !== stand.last)) arten.push('kugel');
      stand = { kg: kg || (stand && stand.last === last ? stand.kg : 0), last };
    }
    if (vor && gehtStrecke(b) && !gehtStrecke(vor)) arten.push('strecke');
    return arten;
  });
}

/**
 * Der Ablauf als flache Liste. Die Oberflaeche geht ihn nur ab:
 *   satz   — wartet auf "fertig"; bei `seiten` je Seite ein Schritt (seite 1 = links)
 *   takt   — laeuft nach der Uhr weiter
 *   zeit   — Tragen: Countdown, je Seite ein Schritt
 *   rad    — ein Teil des Rad-Aufwaermens, laeuft nach der Uhr
 *   pause  — zaehlt herunter, ueberspringbar; `grund` 'wechsel' (Hand wechseln) oder 'satz'
 *   umbau  — Rad verlassen, Kugel laden, zur Strecke gehen; `arten`, `b` ist der naechste Baustein
 * Die letzte Pause eines Bausteins entfaellt; vor einem Baustein steht, wenn
 * noetig, ein Umbau. `kugeln` sind die eingetragenen Gewichte je Baustein.
 */
export function ablauf(e, { kugeln = {} } = {}) {
  const schritte = [];
  const vorBlock = umbauten(e, kugeln);
  e.bloecke.forEach((b, bi) => {
    if (vorBlock[bi].length) {
      const sekunden = Math.max(...vorBlock[bi].map(x => UMBAU_SEKUNDEN[x]));
      schritte.push({ art: 'umbau', sekunden, arten: vorBlock[bi], block: bi, nr: 0, von: 0, b });
    }
    if (b.art === 'rad') {
      // Das Rad laeuft nach der Uhr, Teil fuer Teil, ohne Pausen dazwischen.
      b.teile.forEach((x, i) => schritte.push({ art: 'rad', block: bi, nr: i + 1, von: b.teile.length, sekunden: x.sek, phase: x.phase, b }));
      return;
    }
    const n = b.art === 'takt' ? b.runden : b.saetze;
    const seiten = b.seiten && b.art !== 'takt' ? 2 : 1;
    // Bei Kreisrichtungen (Halo) gibt es nichts umzugreifen.
    const wechsel = seiten === 2 && !(UEBUNGEN[b.u[0]] || {}).richtung ? WECHSEL_SEKUNDEN : 0;
    for (let i = 1; i <= n; i++) {
      for (let seite = 1; seite <= seiten; seite++) {
        const s = { art: b.art === 'takt' ? 'takt' : b.art === 'zeit' ? 'zeit' : 'satz', block: bi, nr: i, von: n, b };
        if (b.art === 'takt') s.sekunden = b.takt;
        if (b.art === 'zeit') s.sekunden = b.sek;
        if (seiten === 2) s.seite = seite;
        else if (b.art === 'takt' && b.seitenwechsel) s.seite = i % 2 === 1 ? 1 : 2;
        else s.seite = 0;
        schritte.push(s);
        if (seite < seiten && wechsel) schritte.push({ art: 'pause', grund: 'wechsel', sekunden: wechsel, block: bi, nr: i, von: n, seite: seite + 1, b });
      }
      if (b.art !== 'takt' && b.pause > 0 && i < n) schritte.push({ art: 'pause', grund: 'satz', sekunden: b.pause, block: bi, nr: i, von: n, b });
    }
  });
  return schritte;
}

/** Dauer in Minuten, aufgerundet auf volle fuenf. Schaetzung, kein Versprechen. */
export function minuten(e, opt = {}) {
  let s = 0;
  for (const a of ablauf(e, opt)) s += a.art === 'satz' ? a.b.wdh * 3 : a.sekunden;
  return Math.max(5, Math.ceil(s / 60 / 5) * 5);
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
 * Soll die Kugel bei diesem Baustein wechseln? Zwei Einheiten in Folge als
 * "leicht" bewertet → 'hoch', zweimal "zaeh" → 'runter', sonst null. Zaehlt nur,
 * was dieser Baustein selbst bekommen hat; alte Logs kennen nur eine Bewertung
 * fuer die ganze Einheit und gelten fuer jeden Baustein. Es bleibt ein
 * Vorschlag: gewogen wird nichts, gespeichert wird nur die Bewertung.
 */
export function kugelVorschlag(logs = [], schluessel) {
  const letzte = kursLogs(logs)
    .map(l => (l.bewertungen ? l.bewertungen[schluessel] : l.bewertung))
    .filter(bewertungOk).slice(-2);
  if (letzte.length < 2) return null;
  if (letzte.every(b => b === 'leicht')) return 'hoch';
  if (letzte.every(b => b === 'zaeh')) return 'runter';
  return null;
}

/** Nur Bausteine dieser Einheit mit einer gueltigen Bewertung. */
export function bereinigeBewertungen(roh, e) {
  const out = {};
  if (!roh || typeof roh !== 'object') return out;
  for (const b of kugelBausteine(e)) if (bewertungOk(roh[b.schluessel])) out[b.schluessel] = roh[b.schluessel];
  return out;
}

/** Eine Bewertung fuer die ganze Einheit (Historie, Export): die haeufigste, bei Gleichstand "passend". */
export function gesamtBewertung(bewertungen = {}) {
  const n = { leicht: 0, passend: 0, zaeh: 0 };
  for (const b of Object.values(bewertungen)) if (bewertungOk(b)) n[b]++;
  const hoechste = Math.max(n.leicht, n.passend, n.zaeh);
  const sieger = BEWERTUNGEN.filter(b => n[b] === hoechste);
  return hoechste > 0 && sieger.length === 1 ? sieger[0] : 'passend';
}

/**
 * Alle 36 Einheiten als Leiste: je Einheit Woche, Tag, ob gemacht und ob dort
 * ein Check steht. `absolviert` ist die Zahl der abgeschlossenen Einheiten.
 */
export function segmente(absolviert = 0) {
  return Array.from({ length: WOCHEN * PRO_WOCHE }, (_, i) => {
    const woche = Math.floor(i / PRO_WOCHE) + 1, tag = TAGE[i % PRO_WOCHE];
    return { woche, tag, fertig: i < absolviert, jetzt: i === absolviert, test: tag === 'C' && !!TESTS[woche], phase: phase(woche).id };
  });
}

/** Wie viele Einheiten dieser Woche sind schon gemacht (0..3)? */
export function wocheFortschritt(logs = []) {
  const z = zustand(logs);
  return z.fertig ? PRO_WOCHE : z.absolviert % PRO_WOCHE;
}

export { U as UEBUNGS_IDS };

/* ---------------------------------------------------------------
   Kugel in kg. Je Baustein ein Schluessel (bei Komplexen mit "+").
   Gespeichert wird nur `kugeln` im Log der Einheit; die Vorbelegung
   kommt aus der letzten Einheit mit demselben Schluessel.         */

export const KUGEL_SCHRITT = 2;
export const KUGEL_MAX = 80;

export const kugelSchluessel = b => b.u.join('+');

/** Bausteine, bei denen eine Kugel zaehlt: weder Aufwaermen noch "ohne Kugel". */
export function kugelBausteine(e) {
  const gesehen = new Map();
  for (const b of e.bloecke) {
    if (b.warm) continue;
    const k = kugelSchluessel(b);
    if (!gesehen.has(k)) gesehen.set(k, { schluessel: k, name: blockName(b), u: b.u, nurOhne: !!b.ohneLast });
    else if (!b.ohneLast) gesehen.get(k).nurOhne = false;
  }
  return [...gesehen.values()].filter(x => !x.nurOhne);
}

/** Nur gueltige Schluessel dieser Einheit, nur sinnvolle Zahlen. */
export function bereinigeKugeln(roh, e) {
  const erlaubt = new Set(kugelBausteine(e).map(x => x.schluessel));
  const aus = {};
  for (const [k, v] of Object.entries(roh && typeof roh === 'object' ? roh : {})) {
    const kg = Number(v);
    if (erlaubt.has(k) && Number.isFinite(kg) && kg > 0 && kg <= KUGEL_MAX) aus[k] = Math.round(kg * 4) / 4;
  }
  return aus;
}

/** Die Kugel der letzten Einheit mit diesem Schluessel, oder null. */
export function letzteKugel(logs = [], schluessel) {
  const liste = kursLogs(logs);
  for (let i = liste.length - 1; i >= 0; i--) {
    const kg = Number((liste[i].kugeln || {})[schluessel]);
    if (kg > 0) return kg;
  }
  return null;
}

/** Verlauf einer Kugel ueber die Einheiten: [{ date, kg }]. */
export function kugelReihe(logs = [], schluessel) {
  return kursLogs(logs)
    .map(l => ({ date: l.date, kg: Number((l.kugeln || {})[schluessel]) }))
    .filter(p => p.kg > 0);
}

/** Je Schluessel: aktuelle und hoechste Kugel, Zahl der Einheiten. */
export function bestwerte(logs = []) {
  const map = new Map();
  for (const l of kursLogs(logs)) {
    for (const [k, v] of Object.entries(l.kugeln || {})) {
      const kg = Number(v);
      if (!(kg > 0)) continue;
      const x = map.get(k) || { schluessel: k, aktuell: 0, hoechste: 0, datum: null, n: 0 };
      x.aktuell = kg; x.n++;
      if (kg >= x.hoechste) { x.hoechste = kg; x.datum = l.date; }
      map.set(k, x);
    }
  }
  return [...map.values()];
}

/** Die drei Checks: wann gemacht, mit welchen Kugeln, geschafft oder nicht. */
export function tests(logs = []) {
  const liste = kursLogs(logs);
  return Object.entries(TESTS).map(([woche, id]) => {
    const l = [...liste].reverse().find(x => x.test === id);
    return { id, woche: Number(woche), datum: l ? l.date : null,
      geschafft: l && typeof l.geschafft === 'boolean' ? l.geschafft : null, kugeln: l ? (l.kugeln || {}) : {} };
  });
}

/**
 * Bewegtes Gewicht einer Kurs-Einheit in kg: Plan der Einheit mal die
 * eingetragene Kugel. Aufwaermen und Tragen zaehlen nicht (keine Wiederholungen),
 * ohne eingetragene Kugel zaehlt der Baustein nicht.
 */
export function tonnage(log) {
  if (!log || log.type !== 'kurs' || !log.kugeln) return 0;
  const e = einheit(Number(log.woche), String(log.tag));
  if (!e) return 0;
  let kg = 0;
  for (const b of e.bloecke) {
    if (b.warm) continue;
    const last = Number(log.kugeln[kugelSchluessel(b)]);
    if (!(last > 0)) continue;
    if (b.art === 'takt') kg += b.runden * b.wdh * last;
    else if (b.art === 'saetze') kg += b.saetze * b.wdh * (b.seiten ? 2 : 1) * last;
  }
  return Math.round(kg * 10) / 10;
}
