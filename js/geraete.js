// Was steht dir gerade zur Verfuegung?
//
// Ein Jam daheim scheitert nicht an der Motivation, sondern daran, dass der
// Generator Rudergeraet und Langhantel auswirft, die im Wohnzimmer nicht
// stehen. Deshalb kennt die App Orte ("Gyms") mit jeweils eigener
// Ausstattung — und zieht nur aus dem, was dort tatsaechlich da ist.
//
// Voreinstellung ist bewusst "alles an": wer nichts einrichtet, bekommt
// genau das Verhalten von vorher. Die Einschraenkung ist eine Entscheidung,
// die man trifft, keine, in die man hineinstolpert.

export const GERAETE = [
  { id: 'langhantel',     name: 'Langhantel und Scheiben' },
  { id: 'kurzhantel',     name: 'Kurzhanteln' },
  { id: 'kettlebell',     name: 'Kettlebell' },
  { id: 'klimmzugstange', name: 'Klimmzugstange' },
  { id: 'latzug',         name: 'Latzug' },
  { id: 'box',            name: 'Sprungbox' },
  { id: 'wandball',       name: 'Medizinball und freie Wand' },
  { id: 'springseil',     name: 'Springseil' },
  { id: 'battlerope',     name: 'Battle Ropes' },
  { id: 'rudergeraet',    name: 'Rudergerät' },
  { id: 'bikeerg',        name: 'Bike Erg' },
  { id: 'assaultbike',    name: 'Assault Bike' },
  { id: 'zwiftride',      name: 'Zwift Ride' },
  { id: 'festhanteln',    name: 'Feste Hanteln' },
  { id: 'baender',        name: 'Widerstandsbänder' }
];

export const ALLE_GERAETE = GERAETE.map(g => g.id);
const BEKANNT = new Set(ALLE_GERAETE);

/** Anzeigename zu einer Kennung — unbekannte Kennung bleibt sichtbar. */
export function geraetName(id) {
  const g = GERAETE.find(x => x.id === id);
  return g ? g.name : id;
}

/**
 * Vorschlaege beim ersten Einrichten. Bewusst keine Wahrheit, sondern ein
 * Startpunkt: drei Orte, wie man sie typischerweise hat, jeweils grob
 * ausgestattet. Danach hakt man selbst an und ab.
 */
export function vorlagen() {
  return [
    { id: 'home', name: 'Homegym',
      geraete: ['kurzhantel', 'kettlebell', 'springseil', 'zwiftride'] },
    { id: 'box', name: 'Crossfit Box', geraete: [...ALLE_GERAETE] },
    { id: 'studio', name: 'Studio',
      geraete: ['langhantel', 'kurzhantel', 'kettlebell', 'klimmzugstange',
                'latzug', 'box', 'rudergeraet', 'assaultbike'] }
  ];
}

/**
 * Die eingerichteten Orte aus der Konfiguration, defensiv gelesen: die
 * config.json wird von Hand gepflegt, ein kaputter Eintrag darf nicht den
 * Jam-Generator mitreissen. Ohne Eintrag kommt eine leere Liste zurueck —
 * "nichts eingerichtet" heisst dann an anderer Stelle "alles verfuegbar".
 */
export function gyms(config) {
  const roh = config && config.gyms;
  if (!Array.isArray(roh)) return [];
  return roh
    .filter(g => g && typeof g.id === 'string' && g.id.trim())
    .map(g => ({
      id: g.id.trim(),
      name: (typeof g.name === 'string' && g.name.trim()) || g.id.trim(),
      // Unbekannte Kennungen fliegen raus statt Uebungen stumm zu blockieren.
      geraete: Array.isArray(g.geraete) ? [...new Set(g.geraete.filter(x => BEKANNT.has(x)))] : [],
      ...ausstattung(g)
    }));
}

/* ---------------------------------------------------------------
   Gewichte am Ort. Optional: wer nichts einträgt, bekommt keine
   Ladeanzeige — und sonst auch nichts anderes als bisher.

   Kugel und Kurzhantelstange teilen sich einen Scheibenvorrat; so
   liegt er auch im Keller. Gerechnet wird in Vierteln eines Kilos,
   weil 1,25 die kleinste übliche Scheibe ist und Gleitkommazahlen
   bei "exakt ladbar" nichts verloren haben.                       */

const VIERTEL = 4;
const MAX_ARTEN = 6;      // Scheibenarten je Ort
const MAX_STUECK = 6;     // Stück je Art
const MAX_KG = 200;

const einViertel = kg => Math.round(Number(kg) * VIERTEL);
const imViertel = kg => Number.isFinite(Number(kg)) && Math.abs(Number(kg) * VIERTEL - einViertel(kg)) < 1e-9;
const alsKg = v => v / VIERTEL;

/** Ein Gewicht, das als Basis oder Stange taugt: Vielfaches von 0,25, 0 < kg ≤ 200. */
function gueltigesKg(kg) {
  const n = Number(kg);
  return Number.isFinite(n) && n > 0 && n <= MAX_KG && imViertel(n) ? n : null;
}

/**
 * Den Scheibenvorrat sauber lesen: [{ kg, n }], schwerste zuerst, gleiche
 * Gewichte zusammengefasst. Eintraege, die sich nicht in Vierteln darstellen
 * lassen, fliegen raus statt falsch gerechnet zu werden.
 */
export function vorrat(roh) {
  const summe = new Map();
  for (const x of Array.isArray(roh) ? roh : []) {
    const kg = gueltigesKg(x && x.kg);
    const n = Math.floor(Number(x && x.n));
    if (kg === null || !(n >= 1)) continue;
    summe.set(kg, Math.min(MAX_STUECK, (summe.get(kg) || 0) + n));
  }
  return [...summe].map(([kg, n]) => ({ kg, n }))
    .sort((a, b) => b.kg - a.kg).slice(0, MAX_ARTEN);
}

/** Die optionalen Felder eines Orts — nur die, die gueltig da sind. */
function ausstattung(g) {
  const aus = {};
  const sch = vorrat(g.scheiben);
  if (sch.length) aus.scheiben = sch;
  const kugel = gueltigesKg(g.kugelBasis);
  if (kugel !== null) aus.kugelBasis = kugel;
  const stange = gueltigesKg(g.kurzhantelStange);
  if (stange !== null) aus.kurzhantelStange = stange;
  const fest = vorrat(g.festeHanteln);
  if (fest.length) aus.festeHanteln = fest;
  const baender = baenderListe(g.baenderFarben);
  if (baender.length) aus.baenderFarben = baender;
  return aus;
}

/* Baender haben keine Zahl: die Staerke einer Farbe haengt von der Marke ab,
   und die App kennt deine nicht. Gespeichert werden nur die Farben.       */
const MAX_BAENDER = 8;
const MAX_FARBE = 20;

function baenderListe(roh) {
  const aus = [];
  for (const x of Array.isArray(roh) ? roh : []) {
    const f = typeof x === 'string' ? x.trim() : '';
    if (f && f.length <= MAX_FARBE && !aus.some(y => y.toLowerCase() === f.toLowerCase())) aus.push(f);
  }
  return aus.slice(0, MAX_BAENDER);
}

/** "schwarz, rot, gruen" lesen. null, wenn etwas zu lang ist oder zu viele Baender dastehen. */
export function baenderAusText(text) {
  const teile = String(text == null ? '' : text).split(/[,;+\n]/).map(x => x.trim()).filter(Boolean);
  const liste = baenderListe(teile);
  return liste.length === teile.length ? liste : null;
}

export const baenderText = liste => baenderListe(liste).join(', ');

/** Gibt es eine feste Hantel mit genau diesem Gewicht? { kg, n } oder null. */
export function festeHantel(ziel, ort) {
  const z = Number(ziel);
  const treffer = ((ort && ort.festeHanteln) || []).find(x => Math.abs(x.kg - z) < 1e-9);
  return treffer ? { kg: treffer.kg, n: treffer.n } : null;
}

/** Ein Ort so, wie er in die config.json gehoert: nichts Leeres, nichts Ungueltiges. */
export function gymFuerDatei(o) {
  return gyms({ gyms: [o] })[0] || o;
}

/**
 * "2×2,5 + 2×1,25 + 0,5" lesen. Trenner sind + ; und Zeilenumbruch, "×" darf
 * auch x oder * sein. Eine Zahl allein heisst ein Stueck. Dezimalkomma und
 * -punkt gelten beide; weil "2,5" ein Gewicht ist, trennt das Komma nicht.
 * null bei allem, was nicht eindeutig ist — lieber nichts speichern als raten.
 */
export function scheibenAusText(text) {
  const teile = String(text == null ? '' : text).split(/[+;\n]/).map(s => s.trim()).filter(Boolean);
  const roh = [];
  for (const teil of teile) {
    const m = teil.match(/^(?:(\d+)\s*[×x*]\s*)?(\d+(?:[.,]\d+)?)(?:\s*kg)?$/i);
    if (!m) return null;
    const kg = Number(m[2].replace(',', '.'));
    if (gueltigesKg(kg) === null) return null;
    roh.push({ kg, n: m[1] ? Number(m[1]) : 1 });
  }
  if (roh.some(x => !(x.n >= 1 && x.n <= MAX_STUECK))) return null;
  const sauber = vorrat(roh);
  const arten = new Set(roh.map(x => x.kg)).size;
  // Kam durch Kappen etwas weg (zu viele Arten, zu viele Stueck), nicht still kuerzen.
  const stueck = roh.reduce((s, x) => s + x.n, 0);
  if (sauber.length !== arten || sauber.reduce((s, x) => s + x.n, 0) !== stueck) return null;
  return sauber;
}

/** Der Vorrat als Text, wieder lesbar durch scheibenAusText. `fmt` formatiert ein Gewicht. */
export function scheibenText(liste, fmt = String) {
  return vorrat(liste).map(x => (x.n > 1 ? `${x.n}×${fmt(x.kg)}` : fmt(x.kg))).join(' + ');
}

/** Eine Ladung ([2.5, 1.25, 2.5]) als "2×2,5 + 1,25" — gleiche Scheiben zusammengefasst. */
export function ladungText(liste, fmt = String) {
  const zaehler = new Map();
  for (const kg of liste || []) zaehler.set(kg, (zaehler.get(kg) || 0) + 1);
  return scheibenText([...zaehler].map(([kg, n]) => ({ kg, n })), fmt);
}

/* Alle Scheibenmengen eines Vorrats, nach Gesamtgewicht (in Vierteln)
   gruppiert. Der Vorrat ist klein (hoechstens 6 Arten zu je 6 Stueck), die
   Aufzaehlung deshalb kein Problem; gemerkt wird nur der letzte.         */
let merk = { schluessel: null, karte: null, arten: null };

function mengen(scheiben) {
  const arten = vorrat(scheiben);
  const schluessel = JSON.stringify(arten);
  if (merk.schluessel === schluessel) return merk;
  const karte = new Map();
  const zaehler = arten.map(() => 0);
  const gehe = (i, viertel) => {
    if (i === arten.length) {
      if (!karte.has(viertel)) karte.set(viertel, []);
      karte.get(viertel).push([...zaehler]);
      return;
    }
    for (let k = 0; k <= arten[i].n; k++) {
      zaehler[i] = k;
      gehe(i + 1, viertel + k * einViertel(arten[i].kg));
    }
    zaehler[i] = 0;
  };
  gehe(0, 0);
  merk = { schluessel, karte, arten };
  return merk;
}

const alsListe = (zaehler, arten) => zaehler.flatMap((k, i) => Array(k).fill(arten[i].kg));
const stueckzahl = zaehler => zaehler.reduce((s, k) => s + k, 0);

/**
 * Die Menge fuer ein Gesamtgewicht auf zwei Seiten verteilen: so gleich wie
 * moeglich, die schwerere Seite zuerst. Mit einer einzelnen 0,5er ist
 * "gleich" nicht immer drin — dann steht der Unterschied im Ergebnis.
 */
function teile(zaehler, arten) {
  const gesamt = zaehler.reduce((s, k, i) => s + k * einViertel(arten[i].kg), 0);
  let beste = null;
  const a = zaehler.map(() => 0);
  const gehe = i => {
    if (i === zaehler.length) {
      const summeA = a.reduce((s, k, j) => s + k * einViertel(arten[j].kg), 0);
      const diff = Math.abs(gesamt - 2 * summeA);
      if (summeA * 2 >= gesamt && (!beste || diff < beste.diff)) beste = { diff, a: [...a] };
      return;
    }
    for (let k = 0; k <= zaehler[i]; k++) { a[i] = k; gehe(i + 1); }
    a[i] = 0;
  };
  gehe(0);
  const b = zaehler.map((k, i) => k - beste.a[i]);
  return { a: alsListe(beste.a, arten), b: alsListe(b, arten), gleich: beste.diff === 0, diff: alsKg(beste.diff) };
}

/**
 * Eine Ladung fuer genau `viertel` (Gesamtgewicht abzueglich Basis).
 * Kugel: die Menge mit den wenigsten Scheiben. Kurzhantel: die Menge, die sich
 * am gleichmaessigsten teilen laesst, bei Gleichstand die mit weniger Scheiben.
 */
function ladung(viertel, basis, m, seiten) {
  const kandidaten = m.karte.get(viertel);
  if (!kandidaten) return null;
  let wahl = null;
  for (const z of kandidaten) {
    const s = seiten ? teile(z, m.arten) : null;
    const wert = [s ? s.diff : 0, stueckzahl(z)];
    if (!wahl || wert[0] < wahl.wert[0] || (wert[0] === wahl.wert[0] && wert[1] < wahl.wert[1])) wahl = { z, s, wert };
  }
  const aus = { gewicht: basis + alsKg(viertel), scheiben: alsListe(wahl.z, m.arten) };
  if (wahl.s) aus.seiten = { a: wahl.s.a, b: wahl.s.b, gleich: wahl.s.gleich };
  return aus;
}

function rechne(ziel, basis, scheiben, seiten) {
  const b = gueltigesKg(basis);
  const z = Number(ziel);
  if (b === null || !Number.isFinite(z) || z <= 0) return null;
  const m = mengen(scheiben);
  // Ein Ziel zwischen zwei Vierteln (13,3) ist nie "exakt": es rundet nicht still.
  const sollF = (z - b) * VIERTEL;
  const soll = Math.round(sollF);
  const exakt = soll >= 0 && Math.abs(sollF - soll) < 1e-9 ? ladung(soll, b, m, seiten) : null;
  if (exakt) return { ziel: z, exakt, darunter: null, darueber: null };
  const moegliche = [...m.karte.keys()].sort((x, y) => x - y);
  const drunter = [...moegliche].reverse().find(v => v < sollF - 1e-9);
  const drueber = moegliche.find(v => v > sollF + 1e-9);
  return {
    ziel: z, exakt: null,
    darunter: drunter === undefined ? null : ladung(drunter, b, m, seiten),
    darueber: drueber === undefined ? null : ladung(drueber, b, m, seiten)
  };
}

/**
 * Welche Scheiben an die Kugel? `ort` ist ein Ort aus gyms(). Ergebnis:
 * { ziel, exakt, darunter, darueber } — `exakt` ist { gewicht, scheiben } oder
 * null, dann stehen die naechsten ladbaren Gewichte daneben. null, wenn der Ort
 * keine Kugel-Basis kennt: ohne Zahlen keine Ladeanzeige.
 */
export function kugelLaden(ziel, ort) {
  if (!ort || !ort.kugelBasis) return null;
  return rechne(ziel, ort.kugelBasis, ort.scheiben, false);
}

/**
 * Dasselbe fuer die Kurzhantel. Zusaetzlich `seiten` ({ a, b, gleich }): die
 * Scheiben je Seite, die schwerere zuerst. `gleich` ist false, wenn sich die
 * Scheiben nicht gleichmaessig teilen lassen (etwa mit einer einzelnen 0,5er).
 */
export function kurzhantelLaden(ziel, ort) {
  if (!ort || !ort.kurzhantelStange) return null;
  return rechne(ziel, ort.kurzhantelStange, ort.scheiben, true);
}

/** Alle Gewichte, die sich mit Basis und Vorrat laden lassen, aufsteigend. */
export function ladbareGewichte(basis, scheiben) {
  const b = gueltigesKg(basis);
  if (b === null) return [];
  return [...mengen(scheiben).karte.keys()].sort((x, y) => x - y).map(v => b + alsKg(v));
}

/** Der Ort zu einer Kennung, oder null fuer "kein bestimmter Ort". */
export function gym(config, id) {
  if (!id) return null;
  return gyms(config).find(g => g.id === id) || null;
}

/**
 * Welche Geraete gelten gerade? Ohne gewaehlten Ort — und ebenso bei einem
 * Ort, den es nicht mehr gibt — zaehlt alles. Lieber ein Workout, das man
 * nicht komplett machen kann, als ein leerer Bildschirm.
 */
export function aktiveGeraete(config, gymId) {
  const g = gym(config, gymId);
  return g ? g.geraete : [...ALLE_GERAETE];
}

/** Braucht die Bewegung nur Dinge, die da sind? */
export function machbar(move, geraete) {
  const noetig = move.geraete || [];
  if (!noetig.length) return true;              // reines Koerpergewicht
  return noetig.every(n => geraete.includes(n));
}

/** Alles, was an diesem Ort geht. */
export function machbare(moves, geraete) {
  return moves.filter(m => machbar(m, geraete));
}

/**
 * Neuen Ort anlegen. Startet mit voller Ausstattung — abhaken ist schneller
 * als alles einzeln anklicken, und "alles an" ist der sichere Ausgangspunkt.
 */
export function neuerGym(name, vorhandene = []) {
  const basis = (name || 'gym').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gym';
  const belegt = new Set(vorhandene.map(g => g.id));
  let id = basis, n = 2;
  while (belegt.has(id)) id = `${basis}-${n++}`;
  return { id, name: name || 'Neuer Ort', geraete: [...ALLE_GERAETE] };
}

/**
 * Darf dieser Entwurf die Orte im Repo ersetzen?
 *
 * Der Fall, den es zu verhindern gilt: der Entwurf ist leer, weil er
 * entstanden ist, bevor die Konfiguration geladen war — und ueberschreibt
 * beim Speichern die echten Orte. Genau so sind schon einmal Orte
 * verlorengegangen.
 *
 * Ein ausdrueckliches Loeschen aller Orte muss trotzdem durchgehen. Zu
 * unterscheiden sind die beiden nur ueber `geaendert`: hat der Mensch etwas
 * angefasst, ist ein leerer Entwurf sein Wille; hat er nichts angefasst,
 * ist er ein Fehler.
 */
export function darfSpeichern(entwurf, imRepo, geaendert) {
  if (!Array.isArray(entwurf)) return false;
  if (entwurf.length) return true;                  // etwas da: immer gut
  if (!Array.isArray(imRepo) || !imRepo.length) return true;  // nichts zu verlieren
  return !!geaendert;                               // leer gegen belegt: nur bewusst
}
