// Anlaesse: saisonale Banner auf der Startseite (unter dem Tageswort).
//
// Reine Logik, ohne DOM: welcher Anlass trifft auf welchen Tag, und was
// bleibt, wenn zwei zugleich treffen. Die Darstellung macht app.js, die
// Motive baut tools/pixel.mjs (tools/pixel-anlaesse.mjs).
//
// Ein Anlass ist reine Angabe, keine Beschriftung: Name und Saetze stehen in
// i18n.js unter `anl.<id>.name` und `anl.<id>.s1 …sN` (bei `saetze: N`) oder
// `anl.<id>.satz`. Es gibt nur oeffentliche Anlaesse, nichts Persoenliches.
//
//   typ    "phase" (von/bis), "tag" (regel) oder "gedenk" (regel)
//   regel  {fix:[monat,tag]} | {ostern:±Tage} | {nth:{monat,wochentag,n}}
//          (wochentag 0 = Sonntag, n = -1 fuer den letzten) | {datum:"JJJJ-MM-TT"}
//   bild   Motive aus MOTIVE, nebeneinander im Banner

/** Die Motive in der Reihenfolge des Bogens assets/pixel/anlaesse.png. */
export const MOTIVE = ['tannenbaum', 'geschenk'];
/** Kantenlaenge eines Bildes; jedes Motiv hat zwei Bilder nebeneinander. */
export const MOTIV_KANTE = 15;

export const TYPEN = ['phase', 'tag', 'gedenk'];
/** Gedenktag vor Einzeltag vor Phase: ein Gedenktag bleibt schlicht, auch mitten in einer Phase. */
export const RANG = { gedenk: 0, tag: 1, phase: 2 };

export const STANDARD = [
  { id: 'weihnachten', typ: 'phase', von: { fix: [12, 1] }, bis: { fix: [12, 26] },
    bild: ['tannenbaum', 'geschenk', 'tannenbaum'], saetze: 3 }
];

const zwei = n => String(n).padStart(2, '0');

/** Datum plus n Tage, als JJJJ-MM-TT (UTC, damit keine Sommerzeit stoert). */
export function plusTage(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Ostersonntag nach der Gaußschen Formel (gregorianisch). */
export function ostern(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${zwei(monat)}-${zwei(tag)}`;
}

/** Das Datum einer Regel im Jahr y — oder null, wenn es dort keins gibt. */
export function datum(regel, y) {
  if (!regel) return null;
  if (Array.isArray(regel.fix)) {
    const [m, d] = regel.fix;
    const letzter = new Date(Date.UTC(y, m, 0)).getUTCDate();   // 29.2. im Nichtschaltjahr → 28.2.
    return `${y}-${zwei(m)}-${zwei(Math.min(d, letzter))}`;
  }
  if (typeof regel.ostern === 'number') return plusTage(ostern(y), regel.ostern);
  if (typeof regel.datum === 'string') return regel.datum.slice(0, 4) === String(y) ? regel.datum : null;
  if (regel.nth) {
    const { monat, wochentag, n } = regel.nth;
    const letzter = new Date(Date.UTC(y, monat, 0)).getUTCDate();
    let tag;
    if (n > 0) {
      const erster = new Date(Date.UTC(y, monat - 1, 1)).getUTCDay();
      tag = 1 + ((wochentag - erster + 7) % 7) + 7 * (n - 1);
      if (tag > letzter) return null;
    } else {
      const wl = new Date(Date.UTC(y, monat - 1, letzter)).getUTCDay();
      tag = letzter - ((wl - wochentag + 7) % 7);
    }
    return `${y}-${zwei(monat)}-${zwei(tag)}`;
  }
  return null;
}

/** Trifft der Anlass auf den Tag iso? Phasen duerfen ueber den Jahreswechsel laufen. */
export function trifft(a, iso) {
  const jahr = +iso.slice(0, 4);
  if (a.typ === 'phase') {
    for (const y of [jahr - 1, jahr]) {
      const von = datum(a.von, y);
      let bis = datum(a.bis, y);
      if (!von || !bis) return false;
      if (bis < von) bis = datum(a.bis, y + 1);
      if (iso >= von && iso <= bis) return true;
    }
    return false;
  }
  return datum(a.regel, jahr) === iso;
}

/** Der Anlass fuer den Tag (hoechstens einer, nach Rang) oder null. */
export function fuer(iso, liste = STANDARD) {
  const treffer = (liste || []).filter(a => a && TYPEN.includes(a.typ) && trifft(a, iso));
  treffer.sort((a, b) => RANG[a.typ] - RANG[b.typ]);
  return treffer[0] || null;
}

export function finde(id, liste = STANDARD) {
  return liste.find(a => a.id === id) || null;
}

/** Name und Satz als i18n-Schluessel. Mehrere Saetze wechseln mit dem Tag des Monats. */
export function schluessel(a, iso) {
  const satz = a.saetze ? `anl.${a.id}.s${(+iso.slice(8, 10) % a.saetze) + 1}` : `anl.${a.id}.satz`;
  return { name: `anl.${a.id}.name`, satz };
}

/** Lokales Datum als JJJJ-MM-TT (nicht UTC: um 0:30 gilt schon der neue Tag). */
export function isoLokal(d = new Date()) {
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

/* ---- Einstellung, nur auf diesem Geraet (wie der Ansager) ---- */

export const SCHLUESSEL = 'setlist.saisonal';
export const VERSTECKT = 'setlist.saisonal.versteckt';

/** An, solange nicht ausdruecklich abgeschaltet. */
export function istAn() {
  try { return localStorage.getItem(SCHLUESSEL) !== 'aus'; } catch { return true; }
}
/** Wieder einschalten holt auch einen fuer heute ausgeblendeten Banner zurueck. */
export function setzeAn(an) {
  try {
    if (an) { localStorage.removeItem(SCHLUESSEL); localStorage.removeItem(VERSTECKT); }
    else localStorage.setItem(SCHLUESSEL, 'aus');
  } catch { /* egal */ }
}

/** "Fuer heute ausblenden": gilt nur fuer diesen Kalendertag. */
export function istVersteckt(iso) {
  try { return localStorage.getItem(VERSTECKT) === iso; } catch { return false; }
}
export function verstecke(iso) {
  try { localStorage.setItem(VERSTECKT, iso); } catch { /* egal */ }
}

/** Der Anlass, der heute im Banner steht — oder null (aus, ausgeblendet, nichts los). */
export function heute(iso = isoLokal(), liste = STANDARD) {
  if (!istAn() || istVersteckt(iso)) return null;
  return fuer(iso, liste);
}
