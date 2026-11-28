// Das Jahresalbum: das Trainingsjahr als Live-Album.
//
// Eine Woche mit mindestens einer Einheit ist ein Track. Wochen ohne Einheit
// fehlen einfach — wer pausiert, bekommt keine Luecke vorgehalten (siehe die
// Leitregel in merch.js). Wie alles im Merch-Stand wird das Album aus den Logs
// gerechnet und nirgends gespeichert: wer neu liest, hat dasselbe Album.
//
// Titel, Dauer und Cover fallen aus einem Hash von Jahr und Woche, nicht aus
// einem Zufall — jedes Geraet zeigt dasselbe Album.
//
// Reine Funktionen, kein I/O. Die Texte der Oberflaeche stehen in i18n.js (album.*),
// nur die Songtitel sind hier, wie die Tournamen in merch.js.

import { ymd } from './program.js';
import { tonnage } from './stats.js';
import { wochenEinheiten, verstaerker, monatsTouren, GIG_TYPEN } from './merch.js';
import { wochenKey, montagVon, sonntagVon } from './soundcheck.js';
import { hash } from './roadie.js';

export const TITEL_A = ['Ride the', 'Master of', 'Kings of the', 'Blood on the', 'Thunder over the', 'Hall of the',
  'March of the', 'Eye of the', 'Hammer of the', 'Return of the', 'Edge of the', 'Night of the'];
export const TITEL_B = ['Barbell', 'Platform', 'Chalk', 'Iron', 'Deadlift', 'Squat', 'Plates', 'Kettlebell', 'Warm-up',
  'Rest Day', 'Deload', 'Rack', 'Setlist', 'Foam Roller', 'Forge', 'Bench'];

const tag = d => new Date(`${d}T12:00:00`);

/** Ein Songtitel je Woche, im Album nie doppelt. `benutzt` ist ein Set und wird gefuellt. */
export function songTitel(jahr, kw, benutzt = new Set()) {
  const n = TITEL_A.length * TITEL_B.length;
  for (let i = 0; i < n; i++) {
    const h = hash(`${jahr}-${kw}-${i}`);
    const titel = `${TITEL_A[h % TITEL_A.length]} ${TITEL_B[(h >>> 8) % TITEL_B.length]}`;
    if (!benutzt.has(titel)) { benutzt.add(titel); return titel; }
  }
  return `KW ${kw} (Live)`;
}

/** Spieldauer als 'm:ss': mehr Einheiten und Tonnen, laengerer Track. Nur Klang, keine Aussage. */
export function dauer(einheiten, tonnen, jahr, kw) {
  const min = 2 + 2 * einheiten + Math.floor(tonnen / 2);
  const sek = hash(`${jahr}-${kw}-s`) % 60;
  return `${min}:${String(sek).padStart(2, '0')}`;
}

/** Cover als Pixel-SVG: 8x8, spiegelsymmetrisch, Farbe aus dem Seed. Kein Bild, keine Abfrage. */
export function coverSvg(seed) {
  const h = hash(`cover-${seed}`);
  const farbe = h % 360;
  const zellen = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      if ((hash(`${seed}-${x}-${y}`) & 3) === 0) continue;
      zellen.push(`<rect x="${x}" y="${y}" width="1" height="1"/><rect x="${7 - x}" y="${y}" width="1" height="1"/>`);
    }
  }
  return `<svg class="albcover" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true" focusable="false">` +
    `<rect width="8" height="8" fill="hsl(${farbe},35%,14%)"/>` +
    `<g fill="hsl(${(farbe + 40) % 360},60%,55%)">${zellen.join('')}</g></svg>`;
}

/**
 * Das Album eines Jahres, oder null ohne eine einzige Einheit in dem Jahr.
 * Jeder Track: { nr, kw, key, titel, einheiten, tonnen, dauer, encore, soundcheck, boss }
 *  - encore: der Wochenregler stand auf elf (Plan erfuellt UND sauber)
 *  - soundcheck: in der Woche gab es einen Wochen-Soundcheck
 *  - boss: Monat ('JJJJ-MM'), dessen Endgegner in dieser Woche fiel, sonst null
 * `status`: 'vorschau' bis zum 31.12., danach (und in jedem frueheren Jahr) 'fertig'.
 */
export function album(alleLogs = [], config = {}, jahr, { heute = new Date(), fahrten: roh = [], soundchecks = [] } = {}) {
  const heuteTag = ymd(heute);
  // Kaputte Eintraege bleiben draussen, bevor merch.js sie anfasst
  const logs = alleLogs.filter(l => l && l.date);
  const fahrten = roh.filter(f => f && f.date);
  const ausfuehrung = logs.filter(l => GIG_TYPEN.includes(l.type || 'strength'));
  const radTage = fahrten;
  const keys = [...new Set(ausfuehrung.map(l => l.date).concat(radTage.map(f => f.date))
    .filter(d => d <= heuteTag).map(d => wochenKey(d)))]
    .filter(k => k.slice(0, 4) === String(jahr)).sort();
  if (!keys.length) return null;

  const bosse = new Map();
  for (const m of monatsTouren(logs, config, { fahrten, heute })) {
    if (m.besiegtAm) bosse.set(wochenKey(m.besiegtAm), m.monat);
  }
  const benutzt = new Set();
  const tracks = [];
  for (const key of keys) {
    const montag = montagVon(key), sonntag = sonntagVon(key);
    // Bis zu welchem Tag die Woche zaehlt: eine laufende Woche nur bis heute.
    const stichtag = sonntag < heuteTag ? tag(sonntag) : tag(heuteTag);
    const einheiten = wochenEinheiten(logs, stichtag, [], fahrten).length;
    if (!einheiten) continue;
    const tonnen = ausfuehrung.filter(l => l.date >= montag && l.date <= sonntag).reduce((s, l) => s + tonnage(l), 0) / 1000;
    const kw = Number(key.slice(6));
    const regler = verstaerker(logs, config, stichtag, [], { fahrten });
    tracks.push({
      nr: tracks.length + 1, kw, key,
      titel: songTitel(jahr, kw, benutzt),
      einheiten,
      tonnen: Math.round(tonnen * 10) / 10,
      dauer: dauer(einheiten, tonnen, jahr, kw),
      encore: !!(regler && regler.stufe === 11),
      soundcheck: soundchecks.includes(key),
      boss: bosse.get(key) || null
    });
  }
  if (!tracks.length) return null;

  const jetzt = Number(heuteTag.slice(0, 4));
  return {
    jahr, tracks,
    von: montagVon(tracks[0].key),
    status: jahr < jetzt || heuteTag >= `${jahr}-12-31` ? 'fertig' : 'vorschau',
    cover: jahr * 131 + tracks.length,
    liner: {
      wochen: tracks.length,
      einheiten: tracks.reduce((s, t) => s + t.einheiten, 0),
      tonnen: Math.round(tracks.reduce((s, t) => s + t.tonnen, 0) * 10) / 10,
      encores: tracks.filter(t => t.encore).length,
      soundchecks: tracks.filter(t => t.soundcheck).length,
      bosse: tracks.filter(t => t.boss).length
    }
  };
}
