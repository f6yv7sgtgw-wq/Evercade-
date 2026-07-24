# Project Evercade – Version 0.4

Eine mobilfreundliche Web-App zur Verwaltung der persönlichen Evercade-Sammlung und zur Suche nach günstigen Cartridges.

## Neu in Version 0.4

- 21 fest integrierte Bezugsquellen
- automatische Live-Suche bei neun Händlern
- Ermittlung von Preis, günstigster ausgewiesener Versandart nach Deutschland und Gesamtpreis
- Prüfung von Lieferbarkeit, Zustand, Cartridge-Reihe, Nummer und genauer Titelübereinstimmung
- Sortierung nach Lieferbarkeit und bekanntem Gesamtpreis inklusive Versand
- bester gültiger Treffer wird hervorgehoben
- Live-Angebote lassen sich mit einem Tipp in die Deal-Liste übernehmen
- Anzeige der geprüften Kandidaten und des Status jeder automatischen Quelle
- zwölf gezielte Direktsuchen für technisch nicht frei auswertbare Quellen
- automatische Übernahme aller lokalen Daten aus Version 0.3

## Kostenlose Quellenstrategie

| Quelle | Verwendung in Version 0.4 |
| --- | --- |
| DragonBox | automatische Live-Suche einschließlich Deutschland-Versand |
| ASC-Shop | automatische Live-Suche; 6,50 € Deutschland-Versand |
| Just For Games Deutschland | Preis und Verfügbarkeit automatisch; Versand im Warenkorb |
| Coolshop Deutschland | automatische Live-Suche |
| Enzinger | automatische Live-Suche; 6,49 € Deutschland-Versand |
| GameCenterVS | automatische Live-Suche; 4,99 € Deutschland-Versand |
| Amazon Deutschland | Direktsuche; Creators API setzt ein freigeschaltetes Partnerkonto voraus |
| MediaMarkt | Direktsuche; automatischer Serverzugriff wird blockiert |
| Proshop | Direktsuche; automatischer Serverzugriff wird blockiert |
| Vitrex-Shop | Preis und Bestellstatus automatisch; Versand im Shop |
| Kaufland-Marktplatz | Direktsuche; automatischer Serverzugriff wird blockiert |
| Konsolenkost | Direktsuche; Treffer sind nicht stabil maschinenlesbar |
| Gameware | Direktsuche; automatischer Serverzugriff wird blockiert |
| eBay Deutschland | Direktsuche; Produktionszugang zur offiziellen API ist genehmigungspflichtig |
| Kleinanzeigen | direkte Suche; keine frei zugängliche offizielle API |
| Retroplace | direkte Suche; derzeit nicht stabil maschinell erreichbar |
| Idealo | Direktsuche; keine freie öffentliche Produktschnittstelle |
| Geizhals | Direktsuche; keine freie öffentliche Produktschnittstelle |
| Funstock | Preis, Bestand und Deutschland-Versand automatisch |
| Games & Guides | Direktsuche; Produktseite derzeit nicht stabil maschinenlesbar |
| Trumox | automatische Live-Suche; 2,95 € Standardversand |

Es wird kein kostenpflichtiger Such- oder Crawlerdienst verwendet. Quellen ohne frei nutzbare Schnittstelle werden nicht heimlich oder unter Umgehung technischer Sperren ausgelesen.

Der kostenlose Suchdienst läuft unter `https://project-evercade-deal-api.jnldc.chatgpt.site`. Er akzeptiert Browserzugriffe der Project-Evercade-Webseite und verarbeitet nur Titel, Reihe und Nummer der ausgewählten Cartridge.

## Konsistenzregeln

- Nur eindeutig zur ausgewählten Cartridge passende Titel werden übernommen.
- Reihe, Farbcode und charakteristische Namensteile müssen übereinstimmen; eine gleiche Nummer allein reicht nicht.
- Konsolen, Controller, Cases und Bundles werden nicht als Cartridge-Angebote übernommen.
- Nicht lieferbare Angebote werden ausgeschlossen.
- Sofort lieferbare Angebote stehen vor Vor- und Nachbestellungen.
- Angebote mit unbekannten Versandkosten werden nie als günstigster Gesamtpreis gewertet.
- Preis plus Versand muss exakt dem angezeigten Gesamtpreis entsprechen.
- Direkte Links führen auf das konkrete Händlerangebot.

Die Suche zeigt die tatsächlich gefundenen gültigen Angebote. Sie erfindet keine Treffer und verspricht deshalb nicht für jede Cartridge eine feste Anzahl von 50 Angeboten.

## Update von Version 0.3

Alle fünf Dateien im Hauptverzeichnis des GitHub-Repositorys durch die Dateien aus diesem Paket ersetzen:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `README.md`

Sammlung, Wunschliste und bereits gespeicherte Deals werden auf demselben Gerät und im selben Browser automatisch aus Version 0.3 übernommen.

## Datenspeicherung

Sammlung, Wunschliste und gespeicherte Deals bleiben lokal im Browser. An den Suchdienst werden bei einer Suche nur Titel, Reihe und Nummer der ausgewählten Cartridge übertragen. Vor einem Browserwechsel oder dem Löschen von Websitedaten sollte über `•••` eine JSON-Sicherung exportiert werden.

## Katalogstand

Stand: 24. Juli 2026. Enthalten sind 87 veröffentlichte oder konkret angekündigte Cartridges.

## Spätere Erweiterungen

- eBay automatisch anbinden, sobald ein kostenloser Produktionszugang genehmigt ist
- Amazon automatisch anbinden, sobald die Voraussetzungen der Creators API erfüllt sind
- weitere Direktquellen automatisch anbinden, sobald stabile kostenlose Produktdaten verfügbar sind
- regelmäßige Preisüberwachung und Benachrichtigung bei einem neuen Bestpreis
