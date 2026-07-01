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

  function popupHtml(spiel) {
    var video = spiel.youtube_url
      ? '<a class="popup-video" href="' + spiel.youtube_url + '" target="_blank" rel="noopener">Video ansehen ▶</a>'
      : '<span class="popup-video" style="color:#6b625c;">Video folgt in Kürze</span>';

    var kommentar = spiel.kommentar
      ? '<p class="popup-kommentar">' + spiel.kommentar + "</p>"
      : "";

    return (
      '<div class="popup-content">' +
      "<h3>" + spiel.verein_heim + "</h3>" +
      '<p class="popup-liga">' + spiel.liga + " &middot; " + spiel.ort + " &middot; " + formatDatum(spiel.datum) + "</p>" +
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
            .bindPopup(popupHtml(spiel));
        });
      })
      .catch(function (err) {
        console.error(err);
        if (emptyStateEl) {
          emptyStateEl.textContent = "Karte konnte nicht geladen werden.";
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
