# Project Evercade – Version 0.5

Eine mobilfreundliche Web-App zur Verwaltung der persönlichen Evercade-Sammlung, zur Überwachung aller fehlenden Cartridges und zur Suche nach günstigen Angeboten.

## Neu in Version 0.5

- automatische Überwachung aller Cartridges, die nicht in der eigenen Sammlung stehen
- Wunschlisten-Titel werden zuerst geprüft, schränken die Überwachung aber nicht ein
- vollständiger Preischeck in ressourcenschonenden Stapeln
- lokaler Fortschritt: Ein abgebrochener Lauf kann an derselben Stelle fortgesetzt werden
- Kaufempfehlung aus lieferbarem Gesamtpreis, Wunschlisten-Priorität, Legacy-Status und niedriger Katalognummer
- direkte Angebotslinks in der Überwachung
- Preisverlauf mit bis zu 20 Beobachtungen je Cartridge
- Anzeige von Preissteigerungen, Preisrückgängen und unveränderten Preisen
- Filter für Wunschliste, aktuelle Angebote und noch nicht aktuell geprüfte Titel
- vorhandene Cartridges werden sofort aus der Überwachung entfernt
- sonntäglicher Wochencheck startet beim Öffnen der App, wenn der letzte vollständige Lauf mindestens sieben Tage zurückliegt
- automatische Übernahme aller lokalen Daten aus Version 0.4

## So funktioniert die Überwachung

Ein vollständiger Lauf prüft den Katalog abzüglich deiner Sammlung. Dabei werden die fehlenden Titel in Stapeln von höchstens 18 Cartridges an den kostenlosen Suchdienst übergeben. Der Dienst lädt die öffentlichen Händlerbestände je Stapel nur einmal und gleicht sie anschließend mit allen Titeln des Stapels ab. Dadurch sind für 18 Cartridges nicht 162 einzelne Händlersuchen nötig, sondern höchstens neun Bestandsabfragen zuzüglich einzelner Versandprüfungen.

Die Ergebnisse werden nach jedem Stapel lokal gespeichert. Wird die App geschlossen oder die Verbindung unterbrochen, bleiben bereits geprüfte Titel erhalten und der Lauf kann später fortgesetzt werden.

Wichtig: Eine auf dem Home-Bildschirm gespeicherte GitHub-Pages-App kann nicht weiterarbeiten, wenn sie vollständig geschlossen ist. Der sonntägliche Wochencheck startet deshalb automatisch, sobald die App an einem fälligen Sonntag geöffnet wird. Ein laufender vollständiger Check benötigt eine geöffnete App.

## Kaufempfehlung

Für die Empfehlung werden ausschließlich fehlende Cartridges mit bekanntem Gesamtpreis berücksichtigt. Sofort lieferbare Angebote stehen vor Vorbestellungen. Der Gesamtpreis ist das stärkste Kriterium; Neuware, Wunschlisten-Titel, Legacy-Cartridges und niedrige Katalognummern erhalten innerhalb eines kleinen Preisabstands Vorrang. Bereits vorhandene Cartridges werden ausgeschlossen.

## Bezugsquellen

| Quelle | Verwendung |
| --- | --- |
| DragonBox | automatische Bestands- und Preissuche einschließlich Deutschland-Versand |
| ASC-Shop | automatische Bestands- und Preissuche einschließlich Deutschland-Versand |
| Just For Games Deutschland | automatisch; Versand wird im Warenkorb ermittelt |
| Coolshop Deutschland | automatische Bestands- und Preissuche |
| Enzinger | automatische Bestands- und Preissuche |
| GameCenterVS | automatische Bestands- und Preissuche einschließlich Deutschland-Versand |
| Amazon Deutschland | gezielte Direktsuche |
| MediaMarkt | gezielte Direktsuche |
| Proshop | gezielte Direktsuche |
| Vitrex-Shop | automatisch; Versand wird im Shop ermittelt |
| Kaufland-Marktplatz | gezielte Direktsuche |
| Konsolenkost | gezielte Direktsuche |
| Gameware | gezielte Direktsuche |
| eBay Deutschland | gezielte Direktsuche |
| Kleinanzeigen | gezielte Direktsuche |
| Retroplace | gezielte Direktsuche |
| Idealo | gezielte Direktsuche |
| Geizhals | gezielte Direktsuche |
| Funstock | automatische Bestands- und Preissuche; Deutschland-Versand nach Warenwert |
| Games & Guides | gezielte Direktsuche |
| Trumox | automatische Bestands- und Preissuche einschließlich Standardversand |

Es wird kein kostenpflichtiger Such- oder Crawlerdienst verwendet. Quellen ohne frei nutzbare Schnittstelle werden nicht unter Umgehung technischer Sperren ausgelesen.

## Konsistenzregeln

- Nur eindeutig zum Katalogtitel passende Produkte werden übernommen.
- Reihe, Farbcode, Nummer und charakteristische Namensteile werden abgeglichen.
- Konsolen, Controller, Cases und Hardware-Bundles werden ausgeschlossen.
- Ausverkaufte Angebote werden ausgeschlossen.
- Ein Gesamtpreis wird nur verwendet, wenn Preis und Versand rechnerisch übereinstimmen.
- Angebote mit unbekanntem Versand fließen nicht in die Kaufempfehlung ein.
- Direkte Links müssen auf ein konkretes Händlerangebot führen.
- Die App akzeptiert ein Stapelergebnis nur, wenn Titel, Reihe und Nummer mit der angeforderten Cartridge übereinstimmen.

## Update von Version 0.4

Alle fünf Dateien im Hauptverzeichnis des GitHub-Repositorys durch die Dateien aus diesem Paket ersetzen:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `README.md`

Sammlung, Wunschliste und gespeicherte Deals werden auf demselben Gerät und im selben Browser automatisch übernommen. Neue Preisbeobachtungen werden zusätzlich im lokalen Speicher abgelegt.

## Datensicherung

Über `•••` lässt sich eine JSON-Sicherung exportieren und später wieder importieren. Sie enthält Sammlung, Wunschliste, Deals, Überwachungsfortschritt und Preisverläufe.

## Katalogstand

Stand: 24. Juli 2026. Enthalten sind 87 veröffentlichte oder konkret angekündigte Cartridges.
