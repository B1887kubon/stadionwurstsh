// Cookie-Consent-Banner: Ohne aktive Zustimmung wird Google Analytics nicht geladen. Die
// Entscheidung landet in localStorage und lässt sich über den Link "Cookie-Einstellungen" im
// Footer jederzeit ändern.
(function () {
  var SPEICHER_SCHLUESSEL = "cookie-einwilligung";

  function gespeicherteEntscheidung() {
    try {
      return localStorage.getItem(SPEICHER_SCHLUESSEL);
    } catch (e) {
      return null;
    }
  }

  function entscheidungSpeichern(wert) {
    try {
      localStorage.setItem(SPEICHER_SCHLUESSEL, wert);
    } catch (e) {
      // localStorage evtl. nicht verfügbar (z.B. Privatmodus) – Banner erscheint dann erneut
    }
  }

  // Das fixierte Banner am unteren Bildschirmrand kann auf dem Handy Kartenpins verdecken und
  // deren Taps abfangen. Deshalb der Karte per invalidateSize() mitteilen, dass sie kleiner
  // werden soll, solange das Banner sichtbar ist (siehe #karte-Regel in style.css).
  function kartenGroesseAktualisieren() {
    var karte = window.stadionwurstKarte;
    if (!karte || typeof karte.invalidateSize !== "function") return;
    requestAnimationFrame(function () {
      karte.invalidateSize();
    });
  }

  function bannerVerstecken(banner) {
    banner.remove();
    document.body.classList.remove("cookie-banner-sichtbar");
    kartenGroesseAktualisieren();
  }

  function bannerAnzeigen() {
    if (document.querySelector(".cookie-banner")) return;

    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie-Einstellungen");
    banner.innerHTML =
      '<p class="cookie-banner-title">🍪 Cookies &amp; Co.</p>' +
      '<p class="cookie-banner-text">' +
      "Wir würden gern Google Analytics nutzen, um zu sehen, wie die Karte ankommt. Das " +
      "Tracking startet nur, wenn du zustimmst. " +
      '<a href="datenschutz.html">Mehr in der Datenschutzerklärung</a>.' +
      "</p>" +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="cookie-banner-btn cookie-banner-btn-sekundaer" data-wahl="essenziell">Nur notwendige</button>' +
      '<button type="button" class="cookie-banner-btn cookie-banner-btn-primaer" data-wahl="alle">Alle akzeptieren</button>' +
      "</div>";

    banner.querySelectorAll("[data-wahl]").forEach(function (button) {
      button.addEventListener("click", function () {
        entscheidungSpeichern(button.getAttribute("data-wahl"));
        bannerVerstecken(banner);
      });
    });

    document.body.appendChild(banner);
    document.documentElement.style.setProperty("--cookie-banner-hoehe", banner.offsetHeight + "px");
    document.body.classList.add("cookie-banner-sichtbar");
    kartenGroesseAktualisieren();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!gespeicherteEntscheidung()) {
      bannerAnzeigen();
    }

    var einstellungenLink = document.getElementById("cookie-einstellungen-link");
    if (einstellungenLink) {
      einstellungenLink.addEventListener("click", function (event) {
        event.preventDefault();
        bannerAnzeigen();
      });
    }
  });

  // Für später: z.B. das Google-Analytics-Ladeskript kann so prüfen, ob Einwilligung vorliegt,
  // bevor es das eigentliche Tracking-Skript einfügt.
  window.cookieEinwilligung = {
    hatAllenZugestimmt: function () {
      return gespeicherteEntscheidung() === "alle";
    }
  };
})();