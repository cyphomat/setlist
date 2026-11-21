// Die Drops, ein Datensatz je Monat, der neueste unten. Texte in eigenen Worten,
// deutsch und englisch; jeder Fakt ab "selten" steht mit Quelle da und wird von
// tests/drops.test.js auf Vollstaendigkeit geprueft (pruefeDrop in drops.js).
//
// Ein neuer Monat: Eintrag anhaengen, Test laufen lassen, version.json und
// CACHE in sw.js setzen. Vor dem Eintragen jeden Fakt an der Quelle nachlesen;
// was sich nicht belegen laesst, kommt nicht rein. Farben der Plektren sind
// Material, keine App-Palette.

const BARBELL = 'https://en.wikipedia.org/wiki/Barbell';
const POWERLIFTING = 'https://en.wikipedia.org/wiki/Powerlifting';
const HALL = 'https://en.wikipedia.org/wiki/Eddie_Hall';
const MILO = 'https://en.wikipedia.org/wiki/Milo_of_Croton';

export const DROPS = [
  {
    id: '2026-11',
    datum: '2026-11-01',
    thema: { de: 'Eisen', en: 'Iron' },
    titel: { de: 'Stahl und Stange', en: 'Steel and Bar' },
    text: {
      de: 'Vier Kleinigkeiten aus dem Gym-Koffer und drei Geschichten, warum die Stange so ist, wie sie ist.',
      en: 'Four small things from the gym bag and three stories on why the bar is the way it is.'
    },
    sprueche: [
      { de: 'Magnesia an die Hände, Kopf frei. Der Rest ist Eisen.', en: 'Chalk on the hands, head clear. The rest is iron.' },
      { de: 'Die Stange lügt nicht. Deshalb mag ich sie.', en: 'The bar does not lie. That is why I like it.' },
      { de: 'Wer die Scheiben sauber lädt, spielt sauber.', en: 'Load the plates clean, play it clean.' }
    ],
    plektren: [
      { id: 'g-magnesia', stufe: 'g', farbe: '#d9d2c0', form: 'std',
        name: { de: 'Magnesia', en: 'Chalk' },
        text: { de: 'Trockene Hände, sicherer Griff.', en: 'Dry hands, safe grip.' } },
      { id: 'g-gurt', stufe: 'g', farbe: '#7a3b8c', form: 'jazz',
        name: { de: 'Hebegurt', en: 'Lifting belt' },
        text: { de: 'Fest, aber nicht als Ausrede.', en: 'Tight, but not an excuse.' } },
      { id: 'g-kreide', stufe: 'g', farbe: '#e8c23a', form: 'tri',
        name: { de: 'Kreidestift', en: 'Chalk marker' },
        text: { de: 'Wer aufschreibt, was er hebt, hebt mehr.', en: 'Write down what you lift, lift more.' } },
      { id: 'g-klemme', stufe: 'g', farbe: '#6c7377', form: 'std',
        name: { de: 'Hantelklemme', en: 'Barbell collar' },
        text: { de: 'Klein, schwer, hält alles zusammen.', en: 'Small, heavy, holds it together.' } },
      { id: 's-zwanzig', stufe: 's', farbe: '#b9c0c6', form: 'std', material: 'metall',
        name: { de: 'Zwanzig Kilo', en: 'Twenty kilos' },
        text: { de: 'Die olympische Männerstange wiegt zwanzig Kilo.', en: 'The Olympic men\'s bar weighs twenty kilos.' },
        fakt: {
          de: 'Die Langhantel der Männer wiegt im Wettkampf 20 kg und ist etwa 2,20 m lang.',
          en: 'The men\'s competition barbell weighs 20 kg and is about 2.20 m long.'
        },
        quelle: BARBELL },
      { id: 's-drei', stufe: 's', farbe: '#2f6fa3', form: 'jazz', material: 'metall',
        name: { de: 'Drei Lifts', en: 'Three lifts' },
        text: { de: 'Kniebeuge, Bankdrücken, Kreuzheben — mehr braucht der Wettkampf nicht.', en: 'Squat, bench, deadlift — the sport needs no more.' },
        fakt: {
          de: 'Kraftdreikampf besteht aus Kniebeuge, Bankdrücken und Kreuzheben.',
          en: 'Powerlifting consists of the squat, the bench press and the deadlift.'
        },
        quelle: POWERLIFTING },
      { id: 'e-fuenfhundert', stufe: 'e', farbe: '#c8322b', form: 'tri', material: 'metall',
        name: { de: 'Fünfhundert', en: 'Five hundred' },
        text: { de: 'Eine Zahl, an der lange niemand vorbeikam.', en: 'A number nobody got past for a long time.' },
        fakt: {
          de: 'Eddie Hall hob 2016 als Erster 500 kg im Kreuzheben im Wettkampf.',
          en: 'In 2016 Eddie Hall became the first to deadlift 500 kg in competition.'
        },
        quelle: HALL }
    ],
    zugabe: { id: 'z-milo', stufe: 'z', farbe: '#d6a92e', form: 'std', material: 'metall',
      name: { de: 'Milos Kalb', en: 'Milo\'s calf' },
      text: { de: 'Jeden Tag ein bisschen mehr — so geht die Legende.', en: 'A little more every day — so goes the legend.' },
      fakt: {
        de: 'Der Legende nach trug der Ringer Milon von Kroton täglich ein Kalb, bis es ein Stier war — das älteste Bild für steigende Last.',
        en: 'Legend has it the wrestler Milo of Croton carried a calf every day until it was a bull — the oldest picture of progressive load.'
      },
      quelle: MILO }
  }
];
