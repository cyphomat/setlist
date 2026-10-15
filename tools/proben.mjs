// Browserproben — die echte App im Chromium, mit gestellter GitHub-API.
//
// Die Unit-Tests (tools/tests.mjs) pruefen die Rechnung. Die Proben pruefen,
// was man sieht: beide Themen, „Sehr groß“, 360 bis 1280 px, Deutsch und
// Englisch, kein Ueberlauf, keine Seitenfehler — und dass eigener Text nie
// als Code laeuft.
//
// Aufruf:
//   node tools/proben.mjs                 (alle)
//   node tools/proben.mjs start merch     (einzelne)
//   node tools/proben.mjs -v              (auch jede bestandene Pruefung)
//
// Braucht playwright und einen Chromium (npx playwright install chromium).
// Laeuft bewusst nicht in der GitHub Action: Setlist bleibt ohne
// Abhaengigkeiten. Bilder landen in $PROBEN_BILDER, sonst im Temp-Ordner.

import { mkdirSync } from 'node:fs';
import { starteServer, starteBrowser, BILDER } from './proben/gemeinsam.mjs';

const BEREICHE = ['start', 'einheit', 'tour', 'merch', 'buehne', 'bibliothek', 'sicherheit', 'englisch', 'ueber'];

const args = process.argv.slice(2);
const laut = args.includes('-v');
const gewaehlt = args.filter(a => a !== '-v');
const unbekannt = gewaehlt.filter(a => !BEREICHE.includes(a));
if (unbekannt.length) {
  console.log(`Unbekannt: ${unbekannt.join(', ')}. Bereiche: ${BEREICHE.join(', ')}`);
  process.exit(2);
}

mkdirSync(BILDER, { recursive: true });
const server = await starteServer();
const browser = await starteBrowser().catch(e => {
  console.log(`Kein Chromium: ${String(e.message).split('\n')[0]}\n` +
    'Einmal „npx playwright install chromium“, oder CHROMIUM=/pfad/zu/chrome setzen.');
  server.close();
  process.exit(2);
});
let ok = 0, fail = 0;

for (const name of gewaehlt.length ? gewaehlt : BEREICHE) {
  const zeilen = [];
  let bestanden = 0, gescheitert = 0;
  const pruefe = (text, bed, info = '') => {
    if (bed) bestanden++; else gescheitert++;
    if (!bed || laut) zeilen.push(`  ${bed ? 'ok  ' : 'FAIL'} ${text}${info ? ' — ' + info : ''}`);
  };
  const t0 = Date.now();
  try {
    const { default: probe } = await import(`./proben/${name}.mjs`);
    await probe({ browser, pruefe });
  } catch (e) {
    gescheitert++;
    zeilen.push(`  FAIL abgebrochen — ${String(e.message || e).split('\n')[0]}`);
  }
  ok += bestanden; fail += gescheitert;
  console.log(`${gescheitert ? 'FAIL' : 'ok  '} ${name}: ${bestanden} bestanden, ${gescheitert} fehlgeschlagen (${Math.round((Date.now() - t0) / 1000)} s)`);
  if (zeilen.length) console.log(zeilen.join('\n'));
}

await browser.close();
server.close();
console.log(`\nProben: ${ok} bestanden, ${fail} fehlgeschlagen · Bilder: ${BILDER}`);
process.exit(fail ? 1 : 0);
