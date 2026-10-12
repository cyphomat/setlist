// Alle Tests mit Node statt mit dem jsc aus macOS.
//
//   node tools/tests.mjs
//
// Die Testdateien sind fuer jsc geschrieben und geben ueber `print` aus.
// Hier bekommt jede Datei ihr eigenes `print`, das mitliest, und am Ende
// steht eine Summe. Der Exit-Code ist 1, sobald irgendwo etwas fehlschlaegt
// oder eine Datei gar nicht bis zu ihrer Gesamtzeile kommt — so taugt das
// Skript auch fuer die GitHub Action. Keine Abhaengigkeiten, kein Build.

import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ORDNER = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests');
const dateien = readdirSync(ORDNER).filter(f => f.endsWith('.test.js')).sort();
const laut = process.argv.includes('--laut');

let bestanden = 0, fehlgeschlagen = 0, kaputt = 0;
for (const datei of dateien) {
  let gesamt = null;
  const fehler = [];
  globalThis.print = (...teile) => {
    const zeile = teile.join(' ');
    if (laut) console.log(zeile);
    if (zeile.includes('FAIL')) fehler.push(zeile.trim());
    const m = zeile.match(/Gesamt: (\d+) bestanden, (\d+) fehlgeschlagen/);
    if (m) gesamt = { ok: +m[1], fail: +m[2] };
  };
  try {
    await import(pathToFileURL(join(ORDNER, datei)).href);
  } catch (e) {
    fehler.push(`Absturz: ${e && e.stack ? e.stack.split('\n')[0] : e}`);
  }
  if (!gesamt) {
    kaputt++;
    console.log(`✕ ${datei}: keine Gesamtzeile${fehler.length ? ` — ${fehler.join(' | ')}` : ''}`);
    continue;
  }
  bestanden += gesamt.ok;
  fehlgeschlagen += gesamt.fail;
  console.log(`${gesamt.fail ? '✕' : '✓'} ${datei}: ${gesamt.ok} bestanden${gesamt.fail ? `, ${gesamt.fail} fehlgeschlagen` : ''}`);
  for (const f of fehler) console.log(`    ${f}`);
}

console.log(`\nTests: ${bestanden} bestanden, ${fehlgeschlagen} fehlgeschlagen${kaputt ? `, ${kaputt} Dateien ohne Ergebnis` : ''}`);
process.exit(fehlgeschlagen || kaputt ? 1 : 0);
