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
  "ort": "Musterstadt",
  "liga": "Kreisklasse C",
  "koordinaten": { "lat": 54.32, "lng": 10.13 },
  "datum": "2026-07-19",
  "bbl_bratwurst": 4,
  "bbl_bier": 3,
  "bbl_limo": 5,
  "kommentar": "Kurzer Freitext zum Spieltag.",
  "youtube_url": ""
}
```

Felder:

- `id` – eindeutiger String zur Identifikation
- `verein_heim`, `ort`, `liga` – Vereinsname, Spielort, Liga
- `koordinaten.lat` / `koordinaten.lng` – Standort des Stadions (z.B. via [openstreetmap.org](https://www.openstreetmap.org) ermitteln)
- `datum` – ISO-Format `YYYY-MM-DD`
- `bbl_bratwurst`, `bbl_bier`, `bbl_limo` – Bewertung von 1 bis 5
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
