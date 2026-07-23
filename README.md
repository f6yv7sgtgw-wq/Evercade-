# Project Evercade – Version 0.2

Eine mobilfreundliche, statische Web-App zur Verwaltung der persönlichen Evercade-Sammlung.

## Neu in Version 0.2

- vollständiger Katalog mit 87 bekannten bzw. angekündigten Cartridges
  - 53 Console-Cartridges (rot)
  - 24 Arcade-Cartridges (violett)
  - 10 Home-Computer-Cartridges (blau)
- Suche und Filter im Katalog
- Wunschliste, nach niedrigen Nummern priorisiert
- vorbereitete Suchen bei eBay, Kleinanzeigen und Google
- Deal-Finder-Datenmodell mit direktem Angebotslink, Preis, Versand, Zustand und Quelle
- automatische Ermittlung des günstigsten gespeicherten Gesamtpreises
- Export und Import einer JSON-Sicherung
- automatische Übernahme der lokalen Daten aus Version 0.1

## Update von Version 0.1

Alle fünf Dateien im GitHub-Repository durch die Dateien aus diesem Paket ersetzen:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `README.md`

Die vorhandene Sammlung bleibt auf demselben Gerät und im selben Browser erhalten. Vor späteren Updates empfiehlt sich zusätzlich ein Export über `•••` oben rechts.

## Datenspeicherung

Die App arbeitet vollständig lokal im Browser. Sammlung, Wunschliste und Deals werden nicht an einen Server übertragen. Ein Wechsel des Browsers oder das Löschen der Websitedaten entfernt die lokalen Daten, sofern vorher keine Sicherung exportiert wurde.

## Katalogstand

Stand: 23. Juli 2026. Enthalten sind veröffentlichte und bereits konkret angekündigte Cartridges. Legacy-Markierungen basieren auf dem bekannten Stand vom Juni 2026.

## Nächster Schritt: Version 0.3

- halbautomatische Angebotserfassung
- Preisverlauf
- Kennzeichnung bereits geprüfter Angebote
- Dealbewertung anhand Gesamtpreis, Zustand und Seriosität
