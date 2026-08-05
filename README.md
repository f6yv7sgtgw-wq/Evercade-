# Project Evercade – Version 0.9.1

## Kleinanzeigen-Integration

- aktive Live-Anbindung an GenericParser 0.45 über `generic-parser-module-v1`
- konfigurierbare Worker-URL und Zugriffstoken, ausschließlich lokal im Browser gespeichert
- Vertragsprüfung über `/api/module/v1/capabilities`
- paketweise Suche über `/api/module/v1/search`
- maximal vier Pakete mit je sieben Anzeigen und fünf Sekunden Pause
- Deduplizierung anhand der Kleinanzeigen-ID
- Übernahme gefundener Anzeigen in die bestehende Deal-Liste
- bestehende 21 Suchseiten bleiben unverändert verfügbar

# Project Evercade – Version 0.9

Eine für iPhone und Desktop optimierte Web-App zur Verwaltung der persönlichen Evercade-Sammlung und zur täglichen Preisüberwachung fehlender Cartridges.

## Neu in Version 0.9

- Preisvollsuchen sind auf **höchstens einen Lauf innerhalb von 24 Stunden** begrenzt.
- Die lokale automatische Suche startet täglich, sofern die letzte vollständige Suche mindestens 24 Stunden zurückliegt.
- Auch der serverseitige Preischeck respektiert den täglichen Takt; wiederholte Aufrufe zeigen den nächsten möglichen Zeitpunkt.
- Preisbeobachtungen gelten nach 24 Stunden als nicht mehr aktuell.
- Die Anbindung des GenericParser für Kleinanzeigen ist über `generic-parser-module-v1` vorbereitet.
- Ein normalisierter Request-/Response-Adapter liegt unter `integrations/kleinanzeigen-parser-v1.js`.
- Die produktive Parser-URL bleibt bis zur stabilen Worker-Veröffentlichung deaktiviert; die Kleinanzeigen-Direktsuche funktioniert weiter.
- Bestehende Sammlung, Wunschliste, Deals, Preisverläufe, Preisgrenzen und Geräteverknüpfung bleiben erhalten.

## Technische Grenzen

Die statische Evercade-App kann den externen Worker nicht selbst zeitgesteuert starten, wenn kein Browser geöffnet ist. Der bestehende Hintergrunddienst muss den täglichen Takt ebenfalls serverseitig anwenden. Version 0.9 sendet dafür keine erzwungenen Mehrfachscans mehr (`force: false`) und blockiert zusätzliche Läufe in der Oberfläche.

## Kleinanzeigen

Die Integrationsbeschreibung steht in `docs/KLEINANZEIGEN-INTEGRATION.md`. Der Adapter ist netzwerkneutral und kann später mit dem bestehenden GenericParser-Worker verbunden werden, ohne das Sammlungsdatenmodell erneut zu ändern.

## Vorherige Funktionen

Eine für iPhone und Desktop optimierte Web-App zur Verwaltung der persönlichen Evercade-Sammlung, zur Überwachung aller fehlenden Cartridges und zur Suche nach günstigen Angeboten.

## Behoben in Version 0.71.1

- Die Bereichsleiste bleibt auf dem iPhone auch nach dem Wechsel zu **Fehlend** dauerhaft sichtbar.
- Der feststehende Kopfbereich und die horizontal scrollbaren Reiter sind technisch getrennt, damit iOS Safari die Sticky-Position nicht mehr verliert.
- Neue Cache-Kennungen sorgen dafür, dass Browser die korrigierten Dateien direkt laden.

## Neu in Version 0.71

- vollständiges UI-Makeover im dunklen Sammlervitrinen-Stil
- größere Schriften und deutlich stärkere Kontraste
- klar gegliederte Navigation mit verständlicheren Bereichsnamen
- Sammlung, fehlende Titel, Wunschliste und Schätzwert sofort sichtbar
- Sammlungsfortschritt als große Prozentanzeige mit gut lesbarem Balken
- Kaufempfehlung als eigene hervorgehobene Karte mit Cover und Direktlink
- ruhigere Sammlungslisten, größere Touch-Ziele und verbesserte Formulare
- zwei Spalten auf großen Bildschirmen und lesbare Einspaltenansicht auf dem iPhone
- alle Funktionen, Alarme und lokalen Daten aus Version 0.7 bleiben unverändert erhalten

## Enthaltene Funktionen aus Version 0.7

- anonyme, serverseitige Überwachung aller fehlenden Cartridges
- Preischecks können nach der ChatGPT-Verknüpfung auch bei geschlossener App ausgelöst werden
- Preisgrenze je fehlender Cartridge in der Detailansicht
- Alarm bei erreichter Preisgrenze
- Alarm bei einem deutlichen Preissturz
- Alarm bei einem neuen beobachteten Bestpreis
- Alarm, wenn eine zuvor nicht verfügbare Cartridge wieder angeboten wird
- Alarm-Posteingang direkt in der App
- keine wiederholte Meldung desselben unveränderten Angebots
- sonntägliche Kaufempfehlung für 21:00 Uhr vorbereitet
- Anzeige, wann jede automatische Bezugsquelle zuletzt erfolgreich geprüft wurde
- private Einmal-Verknüpfung mit ChatGPT
- automatische Übernahme aller lokalen Daten aus Version 0.6

## Einmalige Aktivierung

1. In der App den Bereich **Alarme** öffnen.
2. **Hintergrundüberwachung aktivieren** wählen.
3. Den erzeugten privaten Verknüpfungslink kopieren.
4. Den Link einmal im Chat senden.

Danach kann ChatGPT stündlich nach neuen Preisalarmen schauen und sonntags um 21:00 Uhr eine konkrete Kaufempfehlung liefern. Ohne diesen letzten Verknüpfungsschritt funktionieren weiterhin alle lokalen Funktionen und manuellen Preischecks, aber es gibt noch keine Meldung bei geschlossener App.

Der Link besitzt keine Schreibberechtigung für die Sammlung. Ein neu erzeugter Link macht den alten ungültig.

## Datenschutz

Serverseitig gespeichert werden nur:

- zufällige Gerätekennung
- fehlende Cartridge-Schlüssel, Titel, Reihe und Nummer
- Wunschlisten-Priorität
- optionale Preisgrenzen
- gefundene Angebote, Quellenstatus und erzeugte Alarme

Nicht übertragen werden Name, E-Mail-Adresse, vorhandene Cartridges, Kaufpreise, Kaufnotizen oder manuell gespeicherte Deals. Die serverseitigen Daten können im Bereich **Alarme** vollständig gelöscht werden. Geräte- und Automationsschlüssel werden nicht in Datensicherungen exportiert.

## Alarmregeln

- Preisgrenzen beziehen sich auf den bekannten Gesamtpreis inklusive Versand.
- Ein Preissturz wird ab mindestens 2,00 € und zugleich mindestens 10 % gegenüber dem vorherigen Check erkannt.
- Ein neuer Bestpreis wird erst nach einer vorherigen Vergleichsbeobachtung gemeldet.
- Beim ersten Check wird nicht für jedes lieferbare Angebot ein Alarm erzeugt; eine bereits erreichte persönliche Preisgrenze kann sofort melden.
- Der Duplikatschutz berücksichtigt Alarmtyp, Cartridge, Angebotslink und Gesamtpreis.

## Kaufempfehlung

Empfohlen werden ausschließlich fehlende Cartridges mit einem lieferbaren Angebot und bekanntem Gesamtpreis. Gewichtet werden Gesamtpreis, Wunschliste, Legacy-Status und niedrige Katalognummer. Der direkte Angebotslink wird mitgeliefert.

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
- Gleichlautende Collection-Nummern verschiedener Hersteller werden nicht verwechselt.

## Update von Version 0.7

Alle fünf Dateien im Hauptverzeichnis des GitHub-Repositorys durch die Dateien aus diesem Paket ersetzen:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `README.md`

Sammlung, Wunschliste, gespeicherte Deals, Notizen, Preisverläufe, Preisgrenzen und die aktive Alarmverknüpfung bleiben erhalten. Version 0.71.1 verwendet bewusst denselben lokalen Datenspeicher wie Version 0.7.

## Datensicherung

Über `•••` lässt sich eine JSON-Sicherung exportieren und später wieder importieren. Sie enthält Sammlung, Zustände, Kaufpreise, Notizen, Wunschliste, Deals, Überwachungsfortschritt, Preisverläufe und Preisgrenzen. Private Verknüpfungsschlüssel werden bewusst ausgeschlossen.

## Versionshistorie

Die GitHub-Releases enthalten für jede Version ab 0.1 einen eigenen Tag, vollständige Release Notes, ein ZIP-Paket und dessen SHA-256-Prüfsumme.
