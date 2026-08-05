# Kleinanzeigen-Integration in Version 0.9

Version 0.9 bereitet die Anbindung des GenericParser über `generic-parser-module-v1` vor.

## Datenfluss

1. Evercade erzeugt einmal täglich eine Anfrage mit allen fehlenden Cartridges.
2. Der Adapter übergibt Titel, Reihe, Nummer, Pflicht- und Ausschlussbegriffe an den GenericParser.
3. Der Parser liefert normalisierte Angebote und optional verworfene Treffer zurück.
4. Evercade übernimmt nur valide URLs und rechnerisch konsistente Gesamtpreise.

## Noch nicht aktiv

Der produktive Transport-Endpunkt ist bewusst nicht fest verdrahtet. Er wird aktiviert, sobald der GenericParser-Worker öffentlich unter einer stabilen URL erreichbar ist. Bis dahin bleibt Kleinanzeigen als Direktsuche verfügbar.

## Kompatibilität

- API: `generic-parser-module-v1`
- Consumer: `evercade-collection-manager`
- Takt: täglich
- Standard: Versand erlaubt, keine Konvolute, keine unvollständigen Angebote
