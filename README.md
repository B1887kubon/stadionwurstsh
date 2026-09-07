# Stadionwurstkarte SH

Interaktive Karte aller besuchten Amateurfußball-Heimspiele in Schleswig-Holstein, inklusive BBL-Check (Bratwurst, Bier, Limo). Statische Website, kein Backend.

## Lokal starten

Da die Seite Daten per `fetch()` aus `data/spiele.json` lädt, muss sie über einen lokalen Webserver aufgerufen werden (ein direktes Öffnen der `index.html` per Doppelklick funktioniert wegen CORS-Beschränkungen im Browser nicht zuverlässig).

**Option 1: Node.js**

```bash
npx serve .
```

**Option 2: Python**

```bash
python -m http.server 8000
```

Danach im Browser öffnen: `http://localhost:8000` (Port je nach gewähltem Tool).

## Neue Spiele eintragen

Alle Spiele stehen in [`data/spiele.json`](data/spiele.json) als Array von Objekten. Um ein neues Spiel hinzuzufügen, ein neues Objekt an das Array anhängen:

```json
{
  "id": "eindeutige-id",
  "verein_heim": "SV Beispiel",
  "verein_gast": "FC Gegner",
  "verein_heim_logo": "",
  "bild": "",
  "ort": "Musterstadt",
  "liga": "Kreisklasse C",
  "stadion_adresse": "Sportplatzweg 1, 24103 Musterstadt",
  "koordinaten": { "lat": 54.32, "lng": 10.13 },
  "datum": "2026-07-19",
  "ergebnis": "3:2",
  "eintrittspreis": "5,00 €",
  "bbl_bratwurst": 4,
  "bbl_bier": 3,
  "bbl_limo": 5,
  "kommentar": "Kurzer Freitext zum Spieltag.",
  "youtube_url": ""
}
```

Felder:

- `id` – eindeutiger String zur Identifikation
- `verein_heim`, `verein_gast` – Heim- und Gastverein
- `verein_heim_logo` – optional, Pfad/URL zu einem Vereinslogo (z.B. `assets/vereine/sv-beispiel.png`). Leer lassen, solange kein Logo vorliegt, dann zeigt die Karte einen Platzhalter mit dem Anfangsbuchstaben
- `bild` – optional, Pfad/URL zu einem Foto vom Spieltag. Leer lassen, solange kein Foto vorliegt, dann zeigt die Karte einen Platzhalter
- `ort`, `liga` – Spielort, Liga
- `stadion_adresse` – optional, Adresse des Stadions
- `koordinaten.lat` / `koordinaten.lng` – Standort des Stadions (z.B. via [openstreetmap.org](https://www.openstreetmap.org) ermitteln)
- `datum` – ISO-Format `YYYY-MM-DD`
- `ergebnis` – optional, Endstand, z.B. `"3:2"`
- `eintrittspreis` – optional, z.B. `"5,00 €"`
- `bbl_bratwurst`, `bbl_bier`, `bbl_limo` – Bewertung von 1 bis 5, auch halbe Punkte sind möglich (z.B. `3.5`, wird als halbgefüllter Punkt angezeigt). Aus diesen drei Werten berechnet die Karte automatisch die Gesamtbewertung
- `kommentar` – optionaler Freitext
- `youtube_url` – optional, leer lassen, solange das Video noch nicht online ist

Solange das Array leer (`[]`) ist, zeigt die Karte einen Empty-State-Hinweis. Sobald der erste Eintrag hinzugefügt wird, verschwindet dieser automatisch.

## Projektstruktur

```
index.html        Startseite mit Karte
ueber.html         Über das Projekt
impressum.html      Impressum
css/style.css        Styles
js/karte.js          Leaflet-Karte, lädt spiele.json
data/spiele.json      Datenbank aller Spiele (manuell gepflegt)
```

## Deployment

Die Seite ist als statisches Projekt für GitHub Pages vorbereitet. Im Repo unter *Settings → Pages* den Branch (z.B. `main`) und das Root-Verzeichnis (`/`) als Quelle einstellen.

## SEO: Platzhalter-Domain ersetzen

Für Canonical-Links, Open-Graph-Tags, `robots.txt` und `sitemap.xml` wird aktuell die Platzhalter-Domain `https://stadionwurstkarte-sh.example` verwendet (`.example` ist eine für Beispiele reservierte Domain-Endung, funktioniert also nirgendwo echt). Sobald die Seite unter einer echten Domain läuft, dort per Suchen & Ersetzen `stadionwurstkarte-sh.example` durch die eigene Domain ersetzen in:

- `index.html`, `ueber.html`, `impressum.html` (jeweils `<link rel="canonical">`, `og:*`- und `twitter:*`-Tags)
- `robots.txt` (Sitemap-Zeile)
- `sitemap.xml` (alle `<loc>`-Einträge)

Die `impressum.html` ist bewusst mit `<meta name="robots" content="noindex, follow">` markiert und taucht deshalb nicht in `sitemap.xml` auf – das ist für Impressum-Seiten üblich.

Das Social-Media-Vorschaubild liegt unter `assets/og-image.png` (1200×630px) und muss bei einer Änderung von Logo/Design manuell neu erstellt werden.
