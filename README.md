# Project Evercade – Version 0.3

Eine mobilfreundliche Web-App zur Verwaltung der persönlichen Evercade-Sammlung und zur gezielten Suche nach günstigen Cartridges.

## Neu in Version 0.3

- zentrale Deal-Suche für jede Cartridge
- direkte Suchlinks zu eBay, Kleinanzeigen, Idealo, Google Shopping, Amazon und weiteren Händlern
- Wunschlisten-Cartridges werden bei der Auswahl bevorzugt
- gefundene Angebote lassen sich direkt nach der Suche erfassen
- Quelle wird beim Einfügen eines Links automatisch erkannt
- Farbe der Cartridge sowie Händler- oder Privatangebot werden gespeichert
- Dealbewertung anhand Gesamtpreis, Zustand, Anbieter und Quelle
- Angebotsstatus: aktiv, geprüft oder abgelaufen
- Preisverlauf mit günstigstem und höchstem gespeichertem Gesamtpreis
- alle Funktionen aus Version 0.2 bleiben erhalten

## Wichtiger Hinweis zur Suche

Version 0.3 bündelt die Suche und öffnet passende Ergebnisse direkt bei den jeweiligen Marktplätzen. Die App durchsucht noch nicht selbstständig 50 Angebote und kann Preise nicht automatisch aus fremden Seiten übernehmen. Dafür ist in einer späteren Version ein kleiner Serverdienst nötig; eine reine GitHub-Pages-Webseite darf die meisten Marktplätze aus technischen und rechtlichen Gründen nicht direkt auslesen.

## Update von Version 0.2

Alle fünf Dateien im Hauptverzeichnis des GitHub-Repositorys durch die Dateien aus diesem Paket ersetzen:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `README.md`

Sammlung, Wunschliste und bereits gespeicherte Deals werden auf demselben Gerät und im selben Browser automatisch aus Version 0.2 übernommen.

## Datenspeicherung

Die App arbeitet vollständig lokal im Browser. Sammlung, Wunschliste, Deals und Preisbeobachtungen werden nicht an einen Server übertragen. Vor einem Browserwechsel oder dem Löschen von Websitedaten sollte über `•••` eine JSON-Sicherung exportiert werden.

## Katalogstand

Stand: 23. Juli 2026. Enthalten sind 87 veröffentlichte oder konkret angekündigte Cartridges.

## Nächster Schritt: Version 0.4

- optionaler Deal-Crawler mit Serverdienst
- automatische Zusammenführung und Sortierung vieler Angebote
- Erkennung von Versandkosten und Verfügbarkeit
- Benachrichtigung bei einem neuen Bestpreis
