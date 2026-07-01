// Initialisiert die Leaflet-Karte und lädt die Spiele-Pins aus data/spiele.json
(function () {
  var KARTE_MITTE = [54.3, 9.8]; // grober Mittelpunkt Schleswig-Holstein/Hamburg
  var KARTE_ZOOM = 8;

  function bblBalken(wert) {
    var voll = "●".repeat(wert);
    var leer = "○".repeat(5 - wert);
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
      fakten.push({ label: "Ergebnis", value: spiel.ergebnis, klasse: "" });
    }
    if (spiel.eintrittspreis) {
      fakten.push({ label: "Eintritt", value: spiel.eintrittspreis, klasse: "" });
    }
    var gesamt = gesamtbewertung(spiel);
    if (gesamt !== null) {
      fakten.push({
        label: "Gesamt",
        value: gesamt.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " / 5",
        klasse: "popup-fact-gesamt"
      });
    }

    var faktenHtml = fakten.length
      ? '<div class="popup-facts">' +
        fakten
          .map(function (f) {
            return (
              '<div class="popup-fact ' + f.klasse + '">' +
              '<span class="popup-fact-label">' + f.label + "</span>" +
              '<span class="popup-fact-value">' + f.value + "</span>" +
              "</div>"
            );
          })
          .join("") +
        "</div>"
      : "";

    var video = spiel.youtube_url
      ? '<a class="popup-video" href="' + spiel.youtube_url + '" target="_blank" rel="noopener">Video ansehen ▶</a>'
      : '<span class="popup-video" style="color:#6b625c;">Video folgt in Kürze</span>';

    var kommentar = spiel.kommentar
      ? '<p class="popup-kommentar">' + spiel.kommentar + "</p>"
      : "";

    return (
      '<div class="popup-content">' +
      '<div class="popup-team">' +
      logo +
      '<div class="popup-team-info">' +
      "<h3>" + spiel.verein_heim + "</h3>" +
      gegner +
      "</div>" +
      "</div>" +
      '<p class="popup-liga">' + spiel.liga + " &middot; " + spiel.ort + " &middot; " + formatDatum(spiel.datum) + "</p>" +
      adresse +
      bild +
      faktenHtml +
      '<div class="popup-bbl">' +
      '<div class="popup-bbl-item"><span class="popup-bbl-label">Bratwurst</span>' + bblBalken(spiel.bbl_bratwurst) + "</div>" +
      '<div class="popup-bbl-item"><span class="popup-bbl-label">Bier</span>' + bblBalken(spiel.bbl_bier) + "</div>" +
      '<div class="popup-bbl-item"><span class="popup-bbl-label">Limo</span>' + bblBalken(spiel.bbl_limo) + "</div>" +
      "</div>" +
      kommentar +
      video +
      "</div>"
    );
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
          L.marker([spiel.koordinaten.lat, spiel.koordinaten.lng])
            .addTo(karte)
            .bindPopup(popupHtml(spiel), { maxWidth: 300, minWidth: 260 });
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
