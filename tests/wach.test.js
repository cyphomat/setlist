// Ausfuehren: jsc --module-file=tests/wach.test.js
//
// Bildschirm wach halten. Geprueft wird mit einer nachgebauten Wake Lock
// API: dass die Sperre nur in den Trainingsansichten gilt, nach dem
// Zurueckkehren in den Vordergrund neu kommt, und dass ein Browser ohne
// die API oder mit Ablehnung die Einheit nicht stoert.
import * as W from '../js/wach.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => c ? (pass++, print(`  ok   ${n}`)) : (fail++, print(`  FAIL ${n} ${x}`));
const eq = (n, a, b) => ok(n, a === b, `(${a} != ${b})`);
const warte = () => new Promise(r => setTimeout(r, 0));

function attrappe({ ablehnen = false } = {}) {
  const lauscher = [];
  const doc = { visibilityState: 'visible', addEventListener: (e, f) => e === 'visibilitychange' && lauscher.push(f) };
  const zaehler = { angefordert: 0, frei: 0, offen: 0 };
  const nav = { wakeLock: { request: async typ => {
    zaehler.angefordert++;
    if (ablehnen || typ !== 'screen') throw new Error('NotAllowedError');
    const ende = [];
    zaehler.offen++;
    return {
      addEventListener: (e, f) => e === 'release' && ende.push(f),
      release: async () => { zaehler.frei++; zaehler.offen--; ende.forEach(f => f()); },
      // Der Browser gibt selbst frei, wenn die Seite verdeckt wird.
      _systemFrei: () => { zaehler.offen--; ende.forEach(f => f()); }
    };
  } } };
  const sichtbar = v => { doc.visibilityState = v ? 'visible' : 'hidden'; lauscher.forEach(f => f()); };
  return { nav, doc, zaehler, sichtbar };
}

print('\n--- Welche Ansichten ---');
for (const v of ['session', 'wod', 'unplugged', 'maxout']) ok(`${v}: wach`, W.wachFuerAnsicht(v));
for (const v of ['home', 'done', 'history', 'merch', 'backstage', 'bibliothek', 'setup'])
  ok(`${v}: darf ausgehen`, !W.wachFuerAnsicht(v));

print('\n--- An und aus ---');
{
  const a = attrappe();
  const h = W.wachHalter(a.nav, a.doc);
  ok('API erkannt', h.kann);
  await h.setze(true);
  ok('Sperre aktiv', h.aktiv);
  eq('eine Anforderung', a.zaehler.angefordert, 1);
  await h.setze(true);
  eq('zweimal an: keine zweite Sperre', a.zaehler.angefordert, 1);
  await h.setze(false);
  await warte();
  ok('nach dem Ende frei', !h.aktiv);
  eq('genau einmal freigegeben', a.zaehler.frei, 1);
  eq('keine Sperre offen', a.zaehler.offen, 0);
  await h.setze(false);
  eq('zweimal aus schadet nicht', a.zaehler.frei, 1);
}

print('\n--- Zurueck in den Vordergrund ---');
{
  const a = attrappe();
  const h = W.wachHalter(a.nav, a.doc);
  let sperre;
  const orig = a.nav.wakeLock.request;
  a.nav.wakeLock.request = async t => (sperre = await orig(t));
  await h.setze(true);
  // Sperrtaste: der Browser gibt selbst frei und meldet "hidden".
  a.doc.visibilityState = 'hidden';
  sperre._systemFrei();
  ok('verdeckt: Sperre weg', !h.aktiv);
  a.sichtbar(true);
  await warte(); await warte();
  ok('wieder sichtbar: Sperre neu da', h.aktiv);
  eq('zweite Anforderung', a.zaehler.angefordert, 2);
}
{
  const a = attrappe();
  const h = W.wachHalter(a.nav, a.doc);
  await h.setze(true);
  await h.setze(false);
  a.sichtbar(false); a.sichtbar(true);
  await warte();
  ok('nach der Einheit: Vordergrund holt keine Sperre', !h.aktiv);
  eq('keine weitere Anforderung', a.zaehler.angefordert, 1);
}
{
  const a = attrappe();
  a.doc.visibilityState = 'hidden';
  const h = W.wachHalter(a.nav, a.doc);
  await h.setze(true);
  eq('verdeckte Seite fordert nicht an', a.zaehler.angefordert, 0);
  a.sichtbar(true);
  await warte();
  ok('sichtbar geworden: jetzt an', h.aktiv);
}

print('\n--- Einheit endet, waehrend die Anforderung laeuft ---');
{
  const a = attrappe();
  const h = W.wachHalter(a.nav, a.doc);
  const p = h.setze(true);
  h.setze(false);
  await p; await warte();
  ok('keine Sperre haengen geblieben', !h.aktiv);
  eq('die spaete Sperre wurde sofort freigegeben', a.zaehler.offen, 0);
}

print('\n--- Ohne API oder mit Ablehnung ---');
{
  const h = W.wachHalter({}, { visibilityState: 'visible', addEventListener() {} });
  ok('ohne API: kann nicht', !h.kann);
  let geworfen = false;
  try { await h.setze(true); await h.setze(false); } catch { geworfen = true; }
  ok('ohne API: kein Fehler', !geworfen);
  ok('ohne API: nicht aktiv', !h.aktiv);
}
{
  const a = attrappe({ ablehnen: true });
  const h = W.wachHalter(a.nav, a.doc);
  let geworfen = false;
  try { await h.setze(true); } catch { geworfen = true; }
  ok('abgelehnt: kein Fehler fuer die Einheit', !geworfen);
  ok('abgelehnt: nicht aktiv', !h.aktiv);
}
{
  let geworfen = false;
  try { W.wachHalter(undefined, undefined).setze(true); } catch { geworfen = true; }
  ok('ganz ohne navigator/document: kein Fehler', !geworfen);
}

print(`\nGesamt: ${pass} bestanden, ${fail} fehlgeschlagen`);
