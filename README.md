# Project Evercade – Version 0.9.2

Project Evercade ist ein für iPhone und Desktop optimierter Sammlungsmanager mit Katalog, Wunschliste, Deal-Finder, Preisverlauf und täglicher Überwachung fehlender Cartridges.

## Neu in 0.9.2

- Kleinanzeigen ist eine zusätzliche **automatische Bezugsquelle**.
- Die Anbindung erfolgt über GenericParser 0.45 und den Vertrag `generic-parser-module-v1`.
- Feste Worker-Adresse: `https://genericparser.f6yv7sgtgw.workers.dev`.
- Der Worker wird aktuell ohne Zugriffstoken verwendet.
- Interaktive Kleinanzeigen-Suchen prüfen bis zu vier Pakete mit jeweils höchstens sieben Anzeigen.
- Zwischen Paketen liegen fünf Sekunden Pause.
- Treffer werden über die Kleinanzeigen-ID dedupliziert.
- Match-Score und Parser-Ampel werden in der Ergebnisdarstellung übernommen.
- Gefundene Anzeigen können als normale Deals gespeichert werden.
- Kleinanzeigen wird einmal innerhalb von 24 Stunden für fehlende Cartridges geprüft, sobald die Web-App geöffnet ist.
- Die bisherigen Bezugsquellen bleiben erhalten.

## Bezugsquellen

Version 0.9.2 führt insgesamt 22 Bezugsquellen:

- 10 automatische Quellen: die bisherigen 9 Händlerquellen plus Kleinanzeigen über GenericParser.
- 12 gezielte Direktsuchen für Quellen ohne stabilen frei nutzbaren automatischen Zugriff.

## Suchrhythmus

Eine vollständige Preisprüfung wird höchstens einmal innerhalb von 24 Stunden ausgeführt. Die browserseitige Kleinanzeigen-Prüfung startet nur, wenn die Seite geöffnet wird. Sie ersetzt keinen dauerhaft laufenden Hintergrunddienst.

## GenericParser-Schnittstelle

Verwendete Endpunkte:

- `GET /api/version`
- `GET /api/module/v1/capabilities`
- `POST /api/module/v1/search`

Erwarteter Vertrag: `generic-parser-module-v1`  
Quelle: `kleinanzeigen`

## Veröffentlichung

GitHub Pages: `https://f6yv7sgtgw-wq.github.io/Evercade-/`

Maschinenlesbare Release-Metadaten stehen in `VERSION.json`. Der Pages-Workflow prüft JavaScript-Syntax, JSON-Dateien, Version, Worker-Adresse, Vertrag und Suchendpunkt vor jedem Deployment.

## Datenschutz

Sammlung, Wunschliste, Kaufpreise, Notizen und manuell gespeicherte Deals verbleiben grundsätzlich im lokalen Browser-Speicher. Die GenericParser-Anfrage enthält die für die Suche benötigten Cartridge-Daten, jedoch keinen Namen und keine E-Mail-Adresse.

## Bekannte Grenze

Bei Kleinanzeigen ist der Versandpreis nicht immer strukturiert verfügbar. Solche Treffer zeigen zunächst den Anzeigenpreis; Versand und Gesamtpreis müssen im Inserat geprüft werden.
