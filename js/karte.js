// Initialisiert die Leaflet-Karte und lädt die Spiele-Pins aus data/spiele.json
(function () {
  var KARTE_MITTE = [54.3, 9.8]; // grober Mittelpunkt Schleswig-Holstein/Hamburg
  var KARTE_ZOOM = 8;
  var POPUP_ABSTAND = 16; // Lücke zwischen Pin und Popup in px

  function bblBalken(wert) {
    var gerundet = Math.round(wert) || 0;
    var voll = "●".repeat(gerundet);
    var leer = "○".repeat(5 - gerundet);
    return voll + leer;
  }

  function bblFarbKlasse(wert) {
    var gerundet = Math.round(wert) || 0;
    if (gerundet <= 1) return "popup-bbl-rot";
    if (gerundet <= 3) return "popup-bbl-gelb";
    return "popup-bbl-gruen";
  }

  function formatDatum(isoDatum) {
    if (!isoDatum) return "";
    var d = new Date(isoDatum);
    if (isNaN(d.getTime())) return isoDatum;
    return d.toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
  }

  function gesamtbewertung(spiel) {
    var werte = [spiel.bbl_bratwurst, spiel.bbl_bier, spiel.bbl_limo].filter(function (w) {
      return typeof w === "number";
    });
    if (werte.length === 0) return null;
    var summe = werte.reduce(function (a, b) {
      return a + b;
    }, 0);
    return summe / werte.length;
  }

  function popupHtml(spiel) {
    var logo = spiel.verein_heim_logo
      ? '<img class="popup-logo" src="' + spiel.verein_heim_logo + '" alt="Logo ' + spiel.verein_heim + '" />'
      : '<div class="popup-logo popup-logo-placeholder" aria-hidden="true">' + (spiel.verein_heim ? spiel.verein_heim.charAt(0) : "?") + "</div>";

    var gegner = spiel.verein_gast
      ? '<p class="popup-vs">gegen ' + spiel.verein_gast + "</p>"
      : "";

    var adresse = spiel.stadion_adresse
      ? '<p class="popup-adresse">' + spiel.stadion_adresse + "</p>"
      : "";

    var bild = spiel.bild
      ? '<img class="popup-image" src="' + spiel.bild + '" alt="Impression vom Spieltag" />'
      : '<div class="popup-image popup-image-placeholder" aria-hidden="true"><span>📷</span><span>Foto folgt</span></div>';

    var fakten = [];
    if (spiel.ergebnis) {
      fakten.push({ label: "Ergebnis", value: spiel.ergebnis });
    }
    if (spiel.eintrittspreis) {
      fakten.push({ label: "Eintritt", value: spiel.eintrittspreis });
    }

    var faktenHtml = fakten.length
      ? '<div class="popup-facts">' +
        fakten
          .map(function (f) {
            return (
              '<div class="popup-fact">' +
              '<span class="popup-fact-label">' + f.label + "</span>" +
              '<span class="popup-fact-value">' + f.value + "</span>" +
              "</div>"
            );
          })
          .join("") +
        "</div>"
      : "";

    var gesamt = gesamtbewertung(spiel);
    var gesamtHtml =
      gesamt !== null
        ? '<div class="popup-bbl-item popup-bbl-gesamt ' + bblFarbKlasse(gesamt) + '"><span class="popup-bbl-label">Gesamt</span><span class="popup-bbl-dots">' + bblBalken(gesamt) + "</span></div>"
        : "";

    var video = spiel.youtube_url
      ? '<a class="popup-video" href="' + spiel.youtube_url + '" target="_blank" rel="noopener">Video ansehen ▶</a>'
      : '<span class="popup-video popup-video-muted">Video folgt in Kürze</span>';

    var kommentar = spiel.kommentar
      ? '<p class="popup-kommentar">' + spiel.kommentar + "</p>"
      : "";

    return (
      '<div class="popup-content">' +
      '<div class="popup-header">' +
      '<div class="popup-identity">' +
      '<div class="popup-team-name-row">' +
      logo +
      "<h3>" + spiel.verein_heim + "</h3>" +
      "</div>" +
      gegner +
      '<p class="popup-liga">' + spiel.liga + " &middot; " + spiel.ort + " &middot; " + formatDatum(spiel.datum) + "</p>" +
      adresse +
      "</div>" +
      '<div class="popup-side">' +
      faktenHtml +
      bild +
      "</div>" +
      "</div>" +
      '<div class="popup-bbl">' +
      '<div class="popup-bbl-item ' + bblFarbKlasse(spiel.bbl_bratwurst) + '"><span class="popup-bbl-label">Bratwurst</span><span class="popup-bbl-dots">' + bblBalken(spiel.bbl_bratwurst) + "</span></div>" +
      '<div class="popup-bbl-item ' + bblFarbKlasse(spiel.bbl_bier) + '"><span class="popup-bbl-label">Bier</span><span class="popup-bbl-dots">' + bblBalken(spiel.bbl_bier) + "</span></div>" +
      '<div class="popup-bbl-item ' + bblFarbKlasse(spiel.bbl_limo) + '"><span class="popup-bbl-label">Limo</span><span class="popup-bbl-dots">' + bblBalken(spiel.bbl_limo) + "</span></div>" +
      gesamtHtml +
      "</div>" +
      kommentar +
      video +
      "</div>"
    );
  }

  // Berechnet Breite, Höhe und Versatz des Popups anhand des tatsächlich verfügbaren Platzes
  // rund um den Pin, damit die Card garantiert innerhalb der Karte bleibt (kein autoPan nötig,
  // das bei mehrfachem Aufruf mit wechselnden Maßen die Karte an eine völlig falsche Stelle
  // verschieben kann).
  function popupOptionenBerechnen(karte, marker) {
    var kartenGroesse = karte.getSize();
    var punkt = karte.latLngToContainerPoint(marker.getLatLng());
    var randPuffer = 16;

    var platzRechts = kartenGroesse.x - punkt.x - randPuffer;
    var platzLinks = punkt.x - randPuffer;
    var rechts = platzRechts >= platzLinks;
    var verfuegbareBreite = Math.max(platzRechts, platzLinks) - POPUP_ABSTAND;

    // Nie mehr verlangen als tatsächlich verfügbar ist (sonst Clipping durch overflow:hidden
    // am Kartenrand) – 200px als unterste, noch nutzbare Grenze für sehr schmale Screens.
    var maxBreite = Math.min(600, Math.max(200, verfuegbareBreite));
    var minBreite = Math.min(200, maxBreite);

    // Der Kartencontainer schneidet alles ab, was über seine Oberkante hinausragt (overflow: hidden).
    // Da das Popup von der Pin-Position aus nach oben wächst, darf es nie höher sein als der Platz
    // zwischen Pin und Kartenoberkante – sonst landen Inhalt und Schließen-Button im unsichtbaren,
    // nicht klickbaren Bereich.
    var platzOben = punkt.y - 60;
    var maxHoehe = Math.max(160, Math.min(kartenGroesse.y - 96, platzOben));

    var offsetX = rechts ? maxBreite / 2 + POPUP_ABSTAND : -(maxBreite / 2 + POPUP_ABSTAND);

    return {
      maxWidth: maxBreite,
      minWidth: minBreite,
      maxHeight: maxHoehe,
      offset: L.point(offsetX, -14)
    };
  }

  function ladeSpiele(karte, emptyStateEl) {
    fetch("data/spiele.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("spiele.json konnte nicht geladen werden");
        return res.json();
      })
      .then(function (spiele) {
        if (!Array.isArray(spiele) || spiele.length === 0) {
          if (emptyStateEl) emptyStateEl.style.display = "block";
          return;
        }

        if (emptyStateEl) emptyStateEl.style.display = "none";

        spiele.forEach(function (spiel) {
          if (!spiel.koordinaten || typeof spiel.koordinaten.lat !== "number" || typeof spiel.koordinaten.lng !== "number") {
            return;
          }
          var marker = L.marker([spiel.koordinaten.lat, spiel.koordinaten.lng]).addTo(karte);
          var popup = L.popup({ className: "popup-card", autoPan: false }).setContent(popupHtml(spiel));

          // Maße VOR dem ersten Öffnen setzen (nicht erst im popupopen-Event), damit Leaflet
          // beim Öffnen direkt mit den richtigen Werten rechnet statt erst mit Standardmaßen
          // zu öffnen und danach zu korrigieren.
          marker.on("click", function () {
            var optionen = popupOptionenBerechnen(karte, marker);
            popup.options.maxWidth = optionen.maxWidth;
            popup.options.minWidth = optionen.minWidth;
            popup.options.maxHeight = optionen.maxHeight;
            popup.options.offset = optionen.offset;
          });

          // Der Kartencontainer schneidet alles oberhalb seiner eigenen Oberkante ab
          // (overflow: hidden). Die Schätzung in popupOptionenBerechnen ist bewusst grob,
          // deshalb hier einmalig anhand der tatsächlich gerenderten Position nachkorrigieren.
          // autoPan ist deaktiviert, ein zweiter update()-Aufruf verschiebt die Karte also nicht.
          marker.on("popupopen", function () {
            var element = popup.getElement();
            if (!element) return;

            var kartenRect = karte.getContainer().getBoundingClientRect();
            var popupRect = element.getBoundingClientRect();
            var ueberstand = kartenRect.top - popupRect.top;
            if (ueberstand > 0) {
              // maxHeight wirkt nur auf den inneren Content-Bereich, nicht auf die ganze Card
              // (die durch Padding/Ränder ca. 25-30px größer ist) – deshalb hier vom bisherigen
              // maxHeight-Wert abziehen, nicht von der gemessenen Gesamthöhe der Card.
              popup.options.maxHeight = Math.max(140, popup.options.maxHeight - ueberstand - 8);
              popup.update();
            }

            // Erst NACH dem letzten update()-Aufruf setzen: update() rendert den Inhalt aus dem
            // ursprünglichen HTML-String neu und würde eine vorher gesetzte Klasse wieder verwerfen.
            var inhaltEl = element.querySelector(".popup-content");
            if (inhaltEl) {
              inhaltEl.classList.toggle("popup-schmal", popup.options.maxWidth < 260);
            }
          });

          marker.bindPopup(popup);
        });
      })
      .catch(function (err) {
        console.error(err);
        if (emptyStateEl) {
          var hinweis =
            window.location.protocol === "file:"
              ? "Diese Seite muss über einen lokalen Server aufgerufen werden (z.B. npx serve . oder python -m http.server), nicht per Doppelklick geöffnet. Siehe README."
              : "Spiele konnten nicht geladen werden.";
          emptyStateEl.textContent = hinweis;
          emptyStateEl.style.display = "block";
        }
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var kartenEl = document.getElementById("karte");
    if (!kartenEl) return;

    var reduzierteBewegung = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var karte = L.map("karte", {
      zoomAnimation: !reduzierteBewegung,
      fadeAnimation: !reduzierteBewegung
    }).setView(KARTE_MITTE, KARTE_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
    }).addTo(karte);

    var emptyStateEl = document.getElementById("empty-state");
    ladeSpiele(karte, emptyStateEl);
  });
})();
