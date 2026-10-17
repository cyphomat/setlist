// Die lokale Ablage: dieselben Pfade wie im Datenrepo (config.json,
// einheiten/…, soundcheck/…), nur im Browser statt bei GitHub.
//
// Gespeichert wird in IndexedDB, nicht im localStorage: dort waeren nach
// ein paar Jahren Training die fuenf Megabyte voll, und IndexedDB laesst
// sich vom Browser als dauerhaft markieren. Jede Datei bekommt eine
// fortlaufende "sha" — die App liest vor dem Schreiben und reicht sie
// weiter, genau wie beim Repo. Hier prueft sie niemand, aber der Ablauf
// in app.js bleibt derselbe.
//
// Der Speicher ist austauschbar (setzeSpeicher), damit die Tests ohne
// Browser mit einer Map laufen.

let speicher = null;

/** Ein Speicher auf einer Map — fuer Tests und als Rueckfall ohne IndexedDB. */
export function mapSpeicher(m = new Map()) {
  return {
    get: async p => (m.has(p) ? m.get(p) : null),
    put: async (p, v) => { m.set(p, v); },
    alle: async () => [...m.entries()].map(([path, v]) => ({ path, ...v })),
    leeren: async () => { m.clear(); }
  };
}

const DB = 'setlist', STORE = 'dateien';

function idbSpeicher() {
  let offen = null;
  const db = () => offen || (offen = new Promise((ok, fehler) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fehler(req.error);
  }));
  const tx = async (art, f) => {
    const d = await db();
    return new Promise((ok, fehler) => {
      const t = d.transaction(STORE, art), s = t.objectStore(STORE);
      const req = f(s);
      t.oncomplete = () => ok(req ? req.result : undefined);
      t.onerror = () => fehler(t.error);
      t.onabort = () => fehler(t.error);
    });
  };
  return {
    get: async p => (await tx('readonly', s => s.get(p))) || null,
    put: (p, v) => tx('readwrite', s => s.put(v, p)),
    alle: async () => {
      const d = await db();
      return new Promise((ok, fehler) => {
        const out = [], req = d.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (!c) return ok(out);
          out.push({ path: c.key, ...c.value });
          c.continue();
        };
        req.onerror = () => fehler(req.error);
      });
    },
    leeren: () => tx('readwrite', s => s.clear())
  };
}

export function setzeSpeicher(s) { speicher = s; }
const ablage = () => speicher || (speicher = (typeof indexedDB !== 'undefined' ? idbSpeicher() : mapSpeicher()));
/** Eine Kopie, damit niemand die gespeicherten Daten nebenbei veraendert. */
const kopie = d => JSON.parse(JSON.stringify(d));

/** Datei lesen: { data, sha } oder null — wie store.readFile. */
export async function lies(path) {
  const v = await ablage().get(path);
  return v ? { data: kopie(v.data), sha: v.sha } : null;
}

/** Datei schreiben; die sha zaehlt je Datei hoch. */
export async function schreib(path, data) {
  const alt = await ablage().get(path);
  const n = alt && /^l\d+$/.test(alt.sha) ? Number(alt.sha.slice(1)) + 1 : 1;
  const sha = `l${n}`;
  await ablage().put(path, { data: kopie(data), sha, zeit: Date.now() });
  return { content: { sha } };
}

/** Die Dateien unter einem Praefix als [{ path, sha }], sortiert. */
export async function liste(praefix = '') {
  return (await ablage().alle()).filter(f => f.path.startsWith(praefix))
    .map(f => ({ path: f.path, sha: f.sha })).sort((a, b) => a.path.localeCompare(b.path));
}

/** Alles als [{ path, data }] — fuer Sicherung und Verlauf. */
export async function alle() {
  return (await ablage().alle()).map(f => ({ path: f.path, data: kopie(f.data) }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function leeren() { await ablage().leeren(); }

/** Den Browser bitten, die Daten nicht von sich aus wegzuraeumen. */
export async function dauerhaft() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch { /* egal */ }
  return false;
}
