// Talente: ein Baum aus Aesten und Knoten, den man mit Punkten freischaltet.
//
// Die Punkte kommen aus dem Log (punkte.js). Ausgegeben wird mit einem Log-Eintrag
// `type: 'talent'` — append-only wie jeder andere, ohne Einfluss auf Serie, Rang
// oder Plan (KEIN_TRAINING). Ein Knoten wirkt nur auf die Quests, nie auf das
// Training: er macht ein Ziel erreichbarer oder gibt einen Titel.
//
// Neue Aeste und Knoten kommen mit den Drops (Feld `aeste`): ein Eintrag mit
// bekannter Kennung haengt Knoten an einen bestehenden Ast, ein neuer legt einen
// Ast an. Die Wirkungen sind eine feste Liste (WIRKUNGEN); ein Drop verweist nur
// mit Typ und Zahl darauf und kann nichts ausfuehren.
//
// Reine Funktionen, kein I/O.

export const SELTEN = 12;   // jeder wievielte Trainingstag gibt (ueber einen Hash des Datums) einen Punkt
export const WIRKUNGEN = ['titel', 'tonnenFaktor', 'liftMinus', 'kugelDoppelt', 'mobilitaetZaehlt', 'mobilitaetWoche', 'lueckeWoche', 'vortag'];
const ZAHL = ['tonnenFaktor', 'liftMinus', 'lueckeWoche'];

const t = (de, en) => ({ de, en });

/** Die Aeste von Anfang an. Weitere kommen mit den Drops. Ein Knoten kostet so viele Punkte, wie er in seinem Ast steht (1, 2, 3 …). */
export const BASIS = [
  { id: 'kraft', name: t('Kraft', 'Strength'), knoten: [
    { id: 'kraft-1', name: t('Eisenträger', 'Iron bearer'), text: t('Der erste Schritt am Eisen.', 'The first step at the iron.'), wirkung: { typ: 'titel' } },
    { id: 'kraft-2', kosten: 2, name: t('Schwere Hände', 'Heavy hands'), text: t('Tonnen-Quests brauchen 10 % weniger.', 'Tonnage quests need 10 % less.'), wirkung: { typ: 'tonnenFaktor', wert: 0.9 } },
    { id: 'kraft-3', kosten: 3, name: t('Eisenherz', 'Iron heart'), text: t('Lift-Quests akzeptieren 2,5 kg weniger.', 'Lift quests accept 2.5 kg less.'), wirkung: { typ: 'liftMinus', wert: 2.5 } }
  ] },
  { id: 'kugel', name: t('Kugel', 'Bell'), knoten: [
    { id: 'kugel-1', name: t('Kugelwerfer', 'Bell thrower'), text: t('Die Kugel kennt dich.', 'The bell knows you.'), wirkung: { typ: 'titel' } },
    { id: 'kugel-2', kosten: 2, name: t('Doppelter Schwung', 'Double swing'), text: t('Die Tonnen aus Kurs und Mosh Pit zählen in Tonnen-Quests doppelt.', 'Tonnes from course and Mosh Pit count double in tonnage quests.'), wirkung: { typ: 'kugelDoppelt' } }
  ] },
  { id: 'beweglich', name: t('Beweglichkeit', 'Mobility'), knoten: [
    { id: 'beweglich-1', name: t('Gelenkig', 'Supple'), text: t('Wer sich dehnt, bricht nicht.', 'Who stretches does not break.'), wirkung: { typ: 'titel' } },
    { id: 'beweglich-2', kosten: 2, name: t('Beweglicher Tag', 'Supple day'), text: t('Mobility-Tage zählen in Quests als Trainingstage.', 'Mobility days count as training days in quests.'), wirkung: { typ: 'mobilitaetZaehlt' } },
    { id: 'beweglich-3', kosten: 3, name: t('Beweglichkeits-Woche', 'Supple week'), text: t('Zwei Mobility-Tage halten in einer Woche die Folge von Wochen-Quests.', 'Two mobility days keep a week in a weeks-in-a-row quest.'), wirkung: { typ: 'mobilitaetWoche' } }
  ] },
  { id: 'disziplin', name: t('Disziplin', 'Discipline'), knoten: [
    { id: 'disziplin-1', name: t('Stehaufmann', 'Roly-poly'), text: t('Hinfallen gehört dazu.', 'Falling is part of it.'), wirkung: { typ: 'titel' } },
    { id: 'disziplin-2', kosten: 2, name: t('Ruhetag', 'Rest day'), text: t('Eine Lücke in einer Wochen-Folge wird verziehen.', 'One gap in a weeks-in-a-row quest is forgiven.'), wirkung: { typ: 'lueckeWoche', wert: 1 } },
    { id: 'disziplin-3', kosten: 3, name: t('Vorlauf', 'Run-up'), text: t('Der letzte Tag des Vormonats zählt für Quests mit.', 'The last day of the previous month counts for quests.'), wirkung: { typ: 'vortag' } }
  ] }
];

/** Was an einem Knoten nicht stimmt: leere Liste = in Ordnung. */
export function pruefeKnoten(k) {
  const f = [];
  const text = (o, n) => { if (!o || !o.de || !o.en) f.push(`${k && k.id}.${n}: de und en noetig`); };
  if (!k || !/^[a-z0-9-]{3,40}$/.test(k.id || '')) return [`knoten: Kennung a-z, 0-9, Bindestrich, 3 bis 40 Zeichen (${k && k.id})`];
  text(k.name, 'name'); text(k.text, 'text');
  if (!k.wirkung || !WIRKUNGEN.includes(k.wirkung.typ)) f.push(`${k.id}: unbekannte Wirkung`);
  else if (ZAHL.includes(k.wirkung.typ) && !(k.wirkung.wert > 0)) f.push(`${k.id}: Wirkung braucht eine Zahl > 0`);
  if (k.kosten !== undefined && !(Number.isInteger(k.kosten) && k.kosten >= 1 && k.kosten <= 5)) f.push(`${k.id}: kosten 1 bis 5`);
  return f;
}

/** Aeste pruefen (BASIS oder `aeste` eines Drops). `vorhanden`: Knoten-Kennungen, die es schon gibt. */
export function pruefeAeste(aeste = [], vorhanden = new Set()) {
  const f = [], ids = new Set(vorhanden);
  for (const a of aeste) {
    if (!a || !/^[a-z0-9-]{2,24}$/.test(a.id || '')) { f.push(`ast: Kennung (${a && a.id})`); continue; }
    if (!Array.isArray(a.knoten) || !a.knoten.length) f.push(`${a.id}: keine Knoten`);
    if (a.name !== undefined && (!a.name.de || !a.name.en)) f.push(`${a.id}.name: de und en noetig`);
    for (const k of a.knoten || []) {
      f.push(...pruefeKnoten(k));
      if (ids.has(k.id)) f.push(`${k.id}: Kennung doppelt`);
      ids.add(k.id);
      if (k.braucht !== undefined && !ids.has(k.braucht)) f.push(`${k.id}: braucht ${k.braucht}, den es noch nicht gibt`);
    }
  }
  return f;
}

/**
 * Alle Aeste, die heute gelten: BASIS plus die `aeste` der Drops bis heute,
 * aelteste zuerst. Ein Knoten braucht standardmaessig den davor im selben Ast.
 */
export function aeste(drops = []) {
  const out = BASIS.map(a => ({ ...a, knoten: a.knoten.map(k => ({ ...k })) }));
  for (const d of [...drops].sort((a, b) => a.datum.localeCompare(b.datum))) {
    for (const neu of d.aeste || []) {
      let ast = out.find(a => a.id === neu.id);
      if (!ast) { ast = { id: neu.id, name: neu.name, knoten: [] }; out.push(ast); }
      for (const k of neu.knoten || []) ast.knoten.push({ ...k });
    }
  }
  for (const a of out) a.knoten.forEach((k, i) => { k.ast = a.id; if (k.braucht === undefined) k.braucht = i ? a.knoten[i - 1].id : null; });
  return out;
}

const alleKnoten = liste => liste.flatMap(a => a.knoten);

/**
 * Was bisher freigeschaltet ist: die `talent`-Eintraege im Log, in zeitlicher
 * Reihenfolge, mit Voraussetzung. Ein Eintrag, dessen Knoten es nicht gibt, der
 * schon da ist oder dessen Voraussetzung fehlt, zaehlt nicht. [{ id, datum, kosten }]
 */
export function besitz(logs = [], liste = BASIS) {
  const knoten = new Map(alleKnoten(liste).map(k => [k.id, k]));
  const eintraege = logs.filter(l => l && l.type === 'talent' && l.date && typeof l.knoten === 'string')
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.finished || '').localeCompare(String(b.finished || '')));
  const out = [];
  for (const e of eintraege) {
    const k = knoten.get(e.knoten);
    if (!k || out.some(o => o.id === k.id)) continue;
    if (k.braucht && !out.some(o => o.id === k.braucht)) continue;
    out.push({ id: k.id, datum: e.date, kosten: k.kosten || 1 });
  }
  return out;
}

/** Die Summe der Wirkungen aller freigeschalteten Knoten. */
export function wirkungen(haben = [], liste = BASIS) {
  const knoten = new Map(alleKnoten(liste).map(k => [k.id, k]));
  const w = { titel: [], tonnenFaktor: 1, liftMinus: 0, kugelDoppelt: false, mobilitaetZaehlt: false, mobilitaetWoche: false, lueckeWoche: 0, vortag: false };
  for (const h of haben) {
    const k = knoten.get(h.id);
    if (!k) continue;
    const { typ, wert } = k.wirkung;
    if (typ === 'titel') w.titel.push(k.name);
    else if (typ === 'tonnenFaktor') w.tonnenFaktor *= wert;
    else if (typ === 'liftMinus') w.liftMinus += wert;
    else if (typ === 'lueckeWoche') w.lueckeWoche += wert;
    else w[typ] = true;
  }
  w.tonnenFaktor = Math.round(w.tonnenFaktor * 1000) / 1000;
  return w;
}

/** Je Ast: wie viele Knoten sind frei, von wie vielen. */
export function stufen(haben = [], liste = BASIS) {
  return liste.map(a => ({ id: a.id, name: a.name, frei: a.knoten.filter(k => haben.some(h => h.id === k.id)).length, gesamt: a.knoten.length }));
}

/** Kann dieser Knoten jetzt freigeschaltet werden? Gruende: 'da', 'unbekannt', 'braucht', 'punkte' oder null. */
export function sperre(knotenId, haben = [], liste = BASIS, verfuegbar = 0) {
  const k = alleKnoten(liste).find(x => x.id === knotenId);
  if (!k) return 'unbekannt';
  if (haben.some(h => h.id === k.id)) return 'da';
  if (k.braucht && !haben.some(h => h.id === k.braucht)) return 'braucht';
  if (verfuegbar < (k.kosten || 1)) return 'punkte';
  return null;
}

/** Der Log-Eintrag, der einen Knoten freischaltet. */
export const eintrag = (knotenId, datum) => ({ date: datum, type: 'talent', knoten: knotenId, finished: new Date().toISOString() });
