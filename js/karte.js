// Initialisiert die Leaflet-Karte und lädt die Spiele-Pins aus data/spiele.json
(function () {
  var KARTE_MITTE = [54.3, 9.8]; // grober Mittelpunkt Schleswig-Holstein/Hamburg
  var KARTE_ZOOM = 8;
  var POPUP_ABSTAND = 16; // Lücke zwischen Pin und Popup in px

  // Rundet auf halbe Schritte (z.B. 3.3 -> 3.5, 3.83 -> 4.0), damit auch halbe Bewertungen wie 3.5
  // möglich sind. Sowohl die Punkte-Anzeige als auch die Ampelfarbe rechnen mit diesem gerundeten
  // Wert, sonst können z.B. bei der automatisch berechneten Gesamtbewertung Punkte (die "4" zeigen)
  // und Farbe (die noch auf Basis von 3.83 rot/gelb einstuft) auseinanderlaufen.
  function rundeAufHalbePunkte(wert) {
    return Math.round((wert || 0) * 2) / 2;
  }

  function bblBalken(wert) {
    // Punkte werden als einheitlich große CSS-Kreise gerendert statt als Unicode-Zeichen, damit
    // voll/halb/leer garantiert exakt gleich groß sind (Schriftarten stellen ●/◐/○ unterschiedlich dar).
    var halbeSchritte = rundeAufHalbePunkte(wert);
    var voll = Math.floor(halbeSchritte);
    var halb = halbeSchritte - voll === 0.5 ? 1 : 0;
    var leer = Math.max(0, 5 - voll - halb);
    var punkte = "";
    for (var i = 0; i < voll; i++) {
      punkte += '<span class="popup-bbl-punkt popup-bbl-punkt-voll"></span>';
    }
    if (halb) {
      punkte += '<span class="popup-bbl-punkt popup-bbl-punkt-halb"></span>';
    }
    for (var j = 0; j < leer; j++) {
      punkte += '<span class="popup-bbl-punkt popup-bbl-punkt-leer"></span>';
    }
    return punkte;
  }

  function bblFarbKlasse(wert) {
    var w = rundeAufHalbePunkte(wert);
    if (w < 2.5) return "popup-bbl-rot";
    if (w < 4) return "popup-bbl-gelb";
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
      ? '<button type="button" class="popup-image-thumb-btn" data-full-src="' + spiel.bild + '" aria-label="Foto vergrößern">' +
        '<img class="popup-image-thumb" src="' + spiel.bild + '" alt="Impression vom Spieltag" loading="lazy" />' +
        "</button>"
      : '<div class="popup-image-thumb popup-image-placeholder" aria-hidden="true"><span>📷</span></div>';

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
              '<span class="popup-fact">' +
              '<span class="popup-fact-label">' + f.label + "</span>" +
              '<span class="popup-fact-value">' + f.value + "</span>" +
              "</span>"
            );
          })
          .join("") +
        "</div>"
      : "";

    var gesamt = gesamtbewertung(spiel);
    var gesamtHtml =
      gesamt !== null
        ? '<div class="popup-gesamt ' + bblFarbKlasse(gesamt) + '"><span class="popup-fact-label">Gesamt</span><span class="popup-bbl-dots">' + bblBalken(gesamt) + "</span></div>"
        : "";

    var video = spiel.youtube_url
      ? '<a class="popup-video" href="' + spiel.youtube_url + '" target="_blank" rel="noopener">Video ▶</a>'
      : '<span class="popup-video popup-video-muted">Video folgt</span>';

    var kommentar = spiel.kommentar
      ? '<p class="popup-kommentar">' + spiel.kommentar + "</p>"
      : "";

    // Video sitzt oben neben dem Vereinsnamen, damit man es sofort sieht, ohne im Popup scrollen
    // zu müssen. Das Bild ist ein Vorschaubild rechts neben Vereinsinfos/Fakten; ein Klick öffnet
    // es groß und unbeschnitten in einem Overlay (siehe lightboxOeffnen weiter unten).
    return (
      '<div class="popup-content">' +
      '<div class="popup-top">' +
      '<div class="popup-team-name-row">' +
      logo +
      "<h3>" + spiel.verein_heim + "</h3>" +
      "</div>" +
      video +
      "</div>" +
      '<div class="popup-header">' +
      '<div class="popup-identity">' +
      gegner +
      '<p class="popup-liga">' + spiel.liga + " &middot; " + spiel.ort + " &middot; " + formatDatum(spiel.datum) + "</p>" +
      adresse +
      faktenHtml +
      gesamtHtml +
      "</div>" +
      '<div class="popup-side">' +
      bild +
      "</div>" +
      "</div>" +
      '<div class="popup-bbl">' +
      '<div class="popup-bbl-item ' + bblFarbKlasse(spiel.bbl_bratwurst) + '"><span class="popup-bbl-label">Bratwurst</span><span class="popup-bbl-dots">' + bblBalken(spiel.bbl_bratwurst) + "</span></div>" +
      '<div class="popup-bbl-item ' + bblFarbKlasse(spiel.bbl_bier) + '"><span class="popup-bbl-label">Bier</span><span class="popup-bbl-dots">' + bblBalken(spiel.bbl_bier) + "</span></div>" +
      '<div class="popup-bbl-item ' + bblFarbKlasse(spiel.bbl_limo) + '"><span class="popup-bbl-label">Limo</span><span class="popup-bbl-dots">' + bblBalken(spiel.bbl_limo) + "</span></div>" +
      "</div>" +
      kommentar +
      "</div>"
    );
  }

  // Berechnet eine Standardgröße für das Popup, die nur von der Kartengröße abhängt – nicht von
  // Zoom-Level oder der genauen Pixel-Position des angeklickten Pins. Vorher richtete sich die
  // Größe nach dem Platz neben dem Pin an seiner aktuellen Bildschirmposition, wodurch die Card
  // beim Reinzoomen und je nach Klickposition ständig ihre Größe änderte. Da die Karte beim Klick
  // ohnehin auf den Pin zentriert wird (siehe marker.on("click", ...)), landet der Pin danach immer
  // in der Kartenmitte, und die Card kann eine feste, vorhersagbare Größe haben.
  function popupOptionenBerechnen(karte) {
    var kartenGroesse = karte.getSize();

    var maxBreite = Math.min(380, Math.max(240, kartenGroesse.x * 0.46));
    var minBreite = Math.min(240, maxBreite);
    var maxHoehe = Math.min(420, Math.max(180, kartenGroesse.y * 0.5 - 40));

    // Pin landet nach dem Zentrieren immer in der Kartenmitte, die Card wächst deshalb immer
    // nach rechts (Platz links/rechts ist danach ohnehin symmetrisch).
    var offsetX = maxBreite / 2 + POPUP_ABSTAND;

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

          // Beim Klick auf den Pin die Karte darauf zentrieren (bekanntes, vorhersagbares
          // Kartenverhalten) und die Maße VOR dem ersten Öffnen setzen (nicht erst im
          // popupopen-Event), damit Leaflet beim Öffnen direkt mit den richtigen Werten rechnet
          // statt erst mit Standardmaßen zu öffnen und danach zu korrigieren.
          // Wichtig: ohne Animation zentrieren – mit animiertem panTo() bricht Leaflets
          // Klick-Toggle für das erneute Öffnen des Popups nach dem Schließen (Ursache nicht
          // abschließend geklärt, vermutlich Kollision mit dem laufenden Pan im selben Klick-Tick).
          marker.on("click", function () {
            karte.panTo(marker.getLatLng(), { animate: false });
            var optionen = popupOptionenBerechnen(karte);
            popup.options.maxWidth = optionen.maxWidth;
            popup.options.minWidth = optionen.minWidth;
            popup.options.maxHeight = optionen.maxHeight;
            popup.options.offset = optionen.offset;
          });

          // Der Kartencontainer schneidet alles oberhalb seiner eigenen Oberkante ab
          // (overflow: hidden). Die Schätzung in popupOptionenBerechnen ist bewusst grob,
          // deshalb hier anhand der tatsächlich gerenderten Position nachkorrigieren.
          // autoPan ist deaktiviert, ein weiterer update()-Aufruf verschiebt die Karte also nicht.
          function ueberstandKorrigieren() {
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

            scrollHinweisAktualisieren(element);
          }

          // Zeigt einen kleinen, pulsierenden Pfeil am unteren Kartenrand der Card, sobald ihr
          // Inhalt tatsächlich scrollbar ist – ohne das ist auf dem Handy nicht erkennbar, dass
          // unter den Pins noch mehr Inhalt folgt. Verschwindet, sobald man zu scrollen anfängt.
          function scrollHinweisAktualisieren(element) {
            var inhalt = element.querySelector(".leaflet-popup-content");
            var wrapper = element.querySelector(".leaflet-popup-content-wrapper");
            if (!inhalt || !wrapper) return;

            var istScrollbar = inhalt.scrollHeight > inhalt.clientHeight + 1;
            var hinweis = wrapper.querySelector(".popup-scroll-hinweis");

            if (!istScrollbar) {
              if (hinweis) hinweis.remove();
              return;
            }

            if (!hinweis) {
              hinweis = document.createElement("div");
              hinweis.className = "popup-scroll-hinweis";
              hinweis.setAttribute("aria-hidden", "true");
              hinweis.textContent = "▾";
              wrapper.appendChild(hinweis);

              inhalt.addEventListener("scroll", function () {
                hinweis.classList.toggle("ist-versteckt", inhalt.scrollTop > 8);
              });
            }
          }

          marker.on("popupopen", function () {
            ueberstandKorrigieren();

            // Das Bild lädt asynchron nach und wächst danach ggf. noch – erst nach dem Laden
            // steht die tatsächliche Höhe fest, deshalb hier ein zweites Mal prüfen.
            var element = popup.getElement();
            var bild = element && element.querySelector(".popup-image-thumb");
            if (bild && !bild.complete) {
              bild.addEventListener("load", ueberstandKorrigieren, { once: true });
              bild.addEventListener("error", ueberstandKorrigieren, { once: true });
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

  // Lightbox: zeigt Popup-Fotos groß und unbeschnitten in einem Overlay statt in einem neuen Tab.
  // Ein einzelnes Overlay-Element wird wiederverwendet, egal welches Vorschaubild angeklickt wird.
  function lightboxEinrichten() {
    var overlay = null;

    function erstellen() {
      var el = document.createElement("div");
      el.className = "lightbox";
      el.hidden = true;
      el.innerHTML =
        '<button type="button" class="lightbox-close" aria-label="Schließen">&times;</button>' +
        '<img class="lightbox-img" alt="" />';
      document.body.appendChild(el);
      return el;
    }

    function oeffnen(src, alt) {
      if (!overlay) overlay = erstellen();
      var bild = overlay.querySelector(".lightbox-img");
      bild.src = src;
      bild.alt = alt || "";
      overlay.hidden = false;
      document.body.classList.add("lightbox-aktiv");
    }

    function schliessen() {
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      document.body.classList.remove("lightbox-aktiv");
    }

    document.addEventListener("click", function (event) {
      var knopf = event.target.closest && event.target.closest(".popup-image-thumb-btn");
      if (knopf) {
        oeffnen(knopf.getAttribute("data-full-src"), "Impression vom Spieltag");
        return;
      }
      if (overlay && !overlay.hidden && (event.target === overlay || event.target.closest(".lightbox-close"))) {
        schliessen();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") schliessen();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    lightboxEinrichten();

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
