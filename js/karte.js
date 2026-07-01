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
        ? '<div class="popup-bbl-item popup-bbl-gesamt"><span class="popup-bbl-label">Gesamt</span>' + bblBalken(gesamt) + "</div>"
        : "";

    var video = spiel.youtube_url
      ? '<a class="popup-video" href="' + spiel.youtube_url + '" target="_blank" rel="noopener">Video ansehen ▶</a>'
      : '<span class="popup-video" style="color:#6b625c;">Video folgt in Kürze</span>';

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
      '<div class="popup-bbl-item"><span class="popup-bbl-label">Bratwurst</span>' + bblBalken(spiel.bbl_bratwurst) + "</div>" +
      '<div class="popup-bbl-item"><span class="popup-bbl-label">Bier</span>' + bblBalken(spiel.bbl_bier) + "</div>" +
      '<div class="popup-bbl-item"><span class="popup-bbl-label">Limo</span>' + bblBalken(spiel.bbl_limo) + "</div>" +
      gesamtHtml +
      "</div>" +
      kommentar +
      video +
      "</div>"
    );
  }

  function popupSeiteAnwenden(karte, marker, popup) {
    var element = popup.getElement();
    if (!element) return;

    var punkt = karte.latLngToContainerPoint(marker.getLatLng());
    var kartenBreite = karte.getSize().x;
    var rechts = punkt.x < kartenBreite / 2;
    var breite = element.offsetWidth;
    var offsetX = rechts ? breite / 2 + POPUP_ABSTAND : -(breite / 2 + POPUP_ABSTAND);

    popup.options.offset = L.point(offsetX, -14);
    popup.update();
    element.classList.toggle("popup-links", !rechts);
    element.classList.toggle("popup-rechts", rechts);
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
          marker.bindPopup(popupHtml(spiel), { maxWidth: 360, minWidth: 280, className: "popup-card" });
          marker.on("popupopen", function (e) {
            popupSeiteAnwenden(karte, marker, e.popup);
          });
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

    var karte = L.map("karte").setView(KARTE_MITTE, KARTE_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
    }).addTo(karte);

    var emptyStateEl = document.getElementById("empty-state");
    ladeSpiele(karte, emptyStateEl);
  });
})();
