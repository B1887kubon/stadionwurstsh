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

  function bannerAnzeigen() {
    if (document.querySelector(".cookie-banner")) return;

    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie-Einstellungen");
    banner.innerHTML =
      '<p class="cookie-banner-text">' +
      "Wir nutzen Google Analytics zur anonymen Reichweitenmessung. Das Tracking startet nur, " +
      "wenn Sie zustimmen. " +
      '<a href="datenschutz.html">Mehr in der Datenschutzerklärung</a>.' +
      "</p>" +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="cookie-banner-btn cookie-banner-btn-sekundaer" data-wahl="essenziell">Nur notwendige</button>' +
      '<button type="button" class="cookie-banner-btn cookie-banner-btn-primaer" data-wahl="alle">Alle akzeptieren</button>' +
      "</div>";

    banner.querySelectorAll("[data-wahl]").forEach(function (button) {
      button.addEventListener("click", function () {
        entscheidungSpeichern(button.getAttribute("data-wahl"));
        banner.remove();
      });
    });

    document.body.appendChild(banner);
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