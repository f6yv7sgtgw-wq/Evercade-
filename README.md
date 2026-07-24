# Project Evercade – Version 0.6

Eine für iPhone und Desktop optimierte Web-App zur Verwaltung der persönlichen Evercade-Sammlung, zur Überwachung fehlender Cartridges und zur Suche nach günstigen Angeboten.

## Neu in Version 0.6

- visuelles Sammlungs-Dashboard mit Fortschritt in Prozent
- Fortschritt getrennt nach roten Console-, violetten Arcade- und blauen Home-Computer-Cartridges
- Coverbilder im Katalog, in der Sammlung, im Preiswächter und in der Detailansicht
- robuste grafische Ersatzcover, falls ein externes Cover nicht geladen werden kann
- Schätzwert der Sammlung aus beobachteten Marktpreisen, gespeicherten Deals und Kaufpreisen
- getrennte Anzeige der tatsächlich erfassten Kaufpreise
- Katalogfilter für vorhanden, fehlend, Wunschliste, Legacy und angekündigt
- Sortierung nach Nummer, Name, Preis und Legacy/Seltenheit
- Detailansicht je Cartridge mit Zustand, Kaufpreis, Notizen und Preisverlauf
- direkter Wechsel von einer fehlenden Cartridge zur aktuellen Dealsuche
- automatische Übernahme aller lokalen Daten aus Version 0.5

## Berechnung des Sammlungswerts

Für jede vorhandene Cartridge verwendet die App in dieser Reihenfolge:

1. den aktuellsten vollständigen Preis aus dem Preiswächter,
2. den letzten Eintrag aus dem Preisverlauf,
3. den günstigsten aktiven gespeicherten Deal,
4. ersatzweise den eigenen Kaufpreis.

Die Abdeckung wird direkt neben dem Schätzwert angezeigt. Cartridges ohne irgendeinen Preiswert werden nicht heimlich mit einem Pauschalpreis angesetzt.

## Katalog und Cover

Der Katalogstand umfasst 87 nummerierte, veröffentlichte oder konkret angekündigte Cartridges (Stand 24. Juli 2026). Visco Arcade 1, Visco Arcade 2 und das Banjo-Kazooie Double Pack sind als angekündigt gekennzeichnet. Der bislang unnummerierte DOOM-Teaser wird aufgenommen, sobald eine konkrete Cartridge-Nummer und Produktbezeichnung feststehen.

Cover werden über den kostenlosen öffentlichen Project-Evercade-Dienst geladen. Die App bleibt auch ohne Cover oder bei einer unterbrochenen Verbindung vollständig bedienbar; in diesem Fall erscheint ein farbcodiertes Ersatzcover.

## Preisüberwachung

Ein vollständiger Lauf prüft den Katalog abzüglich deiner Sammlung. Wunschlisten-Titel werden zuerst bearbeitet. Ergebnisse werden nach jedem Stapel lokal gespeichert, sodass ein unterbrochener Lauf später fortgesetzt werden kann.

Die Kaufempfehlung berücksichtigt ausschließlich fehlende Cartridges mit bekanntem Gesamtpreis. Lieferbare Angebote stehen vor Vorbestellungen; Preis, Wunschliste, Legacy-Status und niedrige Katalognummer werden in der Empfehlung gewichtet.

## Bezugsquellen

21 Bezugsquellen bleiben integriert:

- 9 automatische Händlerquellen: DragonBox, ASC-Shop, Just For Games, Coolshop, Enzinger, GameCenterVS, Vitrex, Funstock und Trumox
- 12 gezielte Direktsuchen: Amazon Deutschland, MediaMarkt, Proshop, Kaufland, Konsolenkost, Gameware, eBay, Kleinanzeigen, Retroplace, Idealo, Geizhals und Games & Guides

Es wird kein kostenpflichtiger Such- oder Crawlerdienst verwendet. Quellen ohne frei nutzbaren, stabilen Zugriff werden als Direktsuche geöffnet.

## Konsistenzregeln

- Titel, Reihe, Farbe, Nummer und charakteristische Namensteile müssen zusammenpassen.
- Konsolen, Controller, Cases und Hardware-Bundles werden ausgeschlossen.
- Ausverkaufte Angebote werden nicht empfohlen.
- Ein Gesamtpreis wird nur verwendet, wenn Preis und Versand rechnerisch zusammenpassen.
- Angebote mit unbekanntem Versand werden nicht als günstigster Gesamtpreis gewertet.
- Direkte Links müssen auf konkrete Händlerangebote führen.
- Ein Stapelergebnis wird nur übernommen, wenn Titel, Reihe und Nummer mit der angeforderten Cartridge übereinstimmen.

## Update von Version 0.5

Alle fünf Dateien im Hauptverzeichnis des GitHub-Repositorys durch die Dateien aus diesem Paket ersetzen:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `README.md`

Sammlung, Wunschliste, gespeicherte Deals, Notizen und Preisverläufe bleiben auf demselben Gerät und im selben Browser erhalten. Version 0.6 liest den lokalen Speicher von Version 0.5 beim ersten Start ein und schreibt ihn in das neue Datenformat.

## Datensicherung

Über `•••` lässt sich eine JSON-Sicherung exportieren und später wieder importieren. Die Sicherung enthält Sammlung, Zustände, Kaufpreise, Notizen, Wunschliste, Deals, Überwachungsfortschritt und Preisverläufe.

## Technischer Hinweis

GitHub Pages arbeitet nicht weiter, wenn die Homescreen-App vollständig geschlossen ist. Ein fälliger sonntäglicher Wochencheck startet deshalb beim nächsten Öffnen der App. Während eines vollständigen Preischecks muss die App geöffnet bleiben.
