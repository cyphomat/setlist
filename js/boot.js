// Laeuft vor dem ersten Bild: Umzug alter Speicherschluessel und das Thema.
//
// Bewusst eine eigene Datei statt eines Inline-Skripts. Damit kommt die
// Seite mit script-src 'self' aus — ohne 'unsafe-inline'. Genau das ist die
// Zeile, die einen eingeschleusten onerror-Handler wirkungslos macht, falls
// doch einmal fremder Text ungeschuetzt ins DOM geraet.
(function () {
  // Nicht in fremden Seiten. Eine andere Adresse koennte Setlist sonst
  // unsichtbar in einen Rahmen laden und Klicks unterschieben — mit deinem
  // Token im Hintergrund. frame-ancestors waere der Weg dafuer, geht aber
  // weder per Meta-Tag noch auf GitHub Pages per Header. Ein Rahmen von
  // derselben Herkunft (tools/shot.html fuer die Screenshots) bleibt erlaubt.
  var fremd = false;
  if (window.top !== window.self) {
    try { fremd = window.top.location.origin !== window.location.origin; }
    catch (e) { fremd = true; }
  }
  if (fremd) {
    document.documentElement.setAttribute('data-eingebettet', '');
    document.documentElement.style.display = 'none';
    document.addEventListener('DOMContentLoaded', function () {
      var p = document.createElement('p');
      p.style.cssText = 'font:16px/1.5 sans-serif;padding:24px;color:#f2f0ec;background:#0c0c0e;margin:0';
      p.textContent = 'Setlist läuft nicht eingebettet. ';
      var a = document.createElement('a');
      a.href = window.location.href; a.target = '_top'; a.rel = 'noopener';
      a.textContent = 'Direkt öffnen';
      a.style.color = '#e8a23d';
      p.appendChild(a);
      document.body.replaceChildren(p);
      document.documentElement.style.display = '';
    });
    return;
  }
  try {
    // Die App hiess frueher lifty. Zugaenge und Zwischenspeicher liegen auf
    // derselben Origin weiter unter den alten Schluesseln — einmal umtragen,
    // damit niemand Token und intervals-Key neu eintippen muss.
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf('lifty.') === 0) {
        var neuK = 'setlist.' + k.slice(6);
        if (localStorage.getItem(neuK) === null) localStorage.setItem(neuK, localStorage.getItem(k));
        localStorage.removeItem(k);
      }
    }
    // Schriftgroesse zuerst: sie sitzt am <html> und bestimmt jede rem-Angabe.
    // Wuerde das erst die App setzen, saehe man die Seite einmal in der
    // falschen Groesse aufblitzen.
    var gr = localStorage.getItem('setlist.schrift');
    if (gr === 'gross' || gr === 'sehr') document.documentElement.setAttribute('data-schrift', gr);

    var w = localStorage.getItem('setlist.theme') || 'dunkel';
    var hell = w === 'hell' ||
      (w === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
    if (hell) document.documentElement.setAttribute('data-theme', 'light');
    var m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', hell ? '#f4f1ea' : '#0c0c0e');
  } catch (e) { /* Speicher gesperrt — dann eben dunkel */ }
})();
