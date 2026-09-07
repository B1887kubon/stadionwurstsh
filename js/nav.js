// Burger-Menü für die mobile Navigation (auf allen Seiten eingebunden)
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!button || !nav) return;

    function schliessen() {
      nav.classList.remove("ist-offen");
      button.setAttribute("aria-expanded", "false");
    }

    function umschalten() {
      var offen = nav.classList.toggle("ist-offen");
      button.setAttribute("aria-expanded", offen ? "true" : "false");
    }

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      umschalten();
    });

    nav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") schliessen();
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target) && event.target !== button) schliessen();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") schliessen();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 560) schliessen();
    });
  });
})();
