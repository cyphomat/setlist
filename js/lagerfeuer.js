// Lagerfeuer und Tagesgegner — zwei kleine Spielereien fuer die Einheit.
//
// Zwischen den Saetzen sitzt ein Roadie am Feuer und sagt etwas; jeder
// Satz nimmt dem Gegner des Tages einen Teil seiner Lebensleiste. Beides
// ist Beiwerk: nichts davon wird gespeichert, es gibt kein Gold und keine
// Punkte, und es haengt am Schalter des Ansagers (ansager.js).
//
// Hier steht nur die Rechnung. Die Darstellung macht app.js.

/** Ein Gegner je Wochentag (0 = Sonntag, wie Date.getDay), mit Farbdrehung fuer das eine Bild. */
export const GEGNER = [
  { schluessel: 'lf.boss.0', farbe: 150 }, // So
  { schluessel: 'lf.boss.1', farbe: 0 },   // Mo
  { schluessel: 'lf.boss.2', farbe: 200 }, // Di
  { schluessel: 'lf.boss.3', farbe: 90 },  // Mi
  { schluessel: 'lf.boss.4', farbe: 280 }, // Do
  { schluessel: 'lf.boss.5', farbe: 40 },  // Fr
  { schluessel: 'lf.boss.6', farbe: 320 }  // Sa
];

export const gegnerAn = (datum = new Date()) => GEGNER[datum.getDay()];

/**
 * Lebensleiste des Tages. Jeder Satz der Einheit ist ein Segment; jeder
 * eingetragene Satz, geschafft oder nicht, ist ein Treffer. Wer einen Satz
 * zuruecknimmt, gibt dem Gegner das Segment zurueck.
 * `lifts`: wie session.lifts, also { sets, done } mit done als Feld der Wiederholungen.
 */
export function gegnerStand(lifts = []) {
  let max = 0, treffer = 0;
  for (const l of lifts) {
    const n = Math.max(0, l.sets | 0);
    max += n;
    for (let i = 0; i < n; i++) if (l.done && l.done[i] !== undefined) treffer++;
  }
  return { max, treffer, hp: max - treffer, besiegt: max > 0 && treffer === max };
}

/** Was zwischen zwei Staenden passiert ist: 'treffer', 'besiegt' oder null. */
export function wirkung(vorher, nachher) {
  if (vorher === null || vorher === undefined) return null;
  if (nachher.hp >= vorher) return null;
  return nachher.hp === 0 ? 'besiegt' : 'treffer';
}

/** Saetze in Folge am Ziel. Ein Satz darunter setzt auf null zurueck. */
export const comboNach = (combo, reps, ziel) => (reps >= ziel ? combo + 1 : 0);

/** Ab dem zweiten sauberen Satz in Folge steht ein Combo da, ab dem dritten wird es groesser. */
export const comboZeigen = n => n >= 2;
export const comboGross = n => n >= 3;

/* ---------------- Sprueche ---------------- */

/** Wie viele Sprueche es je Lage gibt; die Texte stehen in i18n.js unter lf.s.<lage>.<n>. */
export const SPRUECHE = { satz: 5, fehl: 4, letzter: 3, fertig: 4, allg: 8 };

/**
 * In welcher Lage steht man nach einem Satz? `reps` geschafft, `ziel`
 * verlangt, `offen` Saetze, die noch ausstehen (nach diesem).
 */
export function lage({ reps, ziel, offen }) {
  if (offen <= 0) return 'fertig';
  if (reps < ziel) return 'fehl';
  if (offen === 1) return 'letzter';
  return 'satz';
}

/**
 * Schluessel eines Spruchs fuer die Lage. Im Alltag mischen sich allgemeine
 * Sprueche unter die Satz-Sprueche, damit es sich nicht jede Pause gleich anhoert.
 * `zufall` ist austauschbar, damit der Test wiederholbar bleibt.
 */
export function spruchSchluessel(wo = 'allg', zufall = Math.random) {
  const pool = [];
  const nimm = art => { for (let i = 1; i <= SPRUECHE[art]; i++) pool.push(`lf.s.${art}.${i}`); };
  if (!SPRUECHE[wo]) wo = 'allg';
  nimm(wo);
  if (wo === 'satz') nimm('allg');
  return pool[Math.min(pool.length - 1, Math.floor(zufall() * pool.length))];
}
