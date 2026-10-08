# Release Notes für CeresCoconutMTG

## v1.0.9 (2026-10-08)

### Hinzugefügt

- Sendungsverfolgungsseite `/sendungsverfolgung`. Der Kunde gibt Bestellnummer und Postleitzahl ein (oder kommt über einen Link mit `?order=...&zip=...`) und sieht für UPS- und DHL-Pakete dieselbe Darstellung: Fortschritt in fünf Stufen, voraussichtliche Zustellung, Sendungsverlauf.
- Abfrage der UPS Tracking API und der DHL Shipment Tracking API (Unified) über `resources/lib`, Status je Paketnummer zwischengespeichert.
- Persönlicher Link für Bestell- und Versandbestätigung: `?order=...&key=...` mit dem Zugangsschlüssel der Bestellung (wie bei "Bestellung einsehen"), ohne Adressdaten in der URL.
- Hinweis bei offener Zahlung mit offenem Betrag; bei Überweisung Verweis auf die Bankdaten in der Bestellbestätigung.
- Schutz vor Raten der Postleitzahl: nach 10 Fehlversuchen ist eine Bestellnummer eine Stunde gesperrt.
- Cross-Selling-Artikel (Verknüpfung "Zubehör") zu den bestellten Artikeln und optionaler Link zur Montagehilfe.
- Neuer Konfigurationstab "Sendungsverfolgung" für Aktivierung, UPS-/DHL-Zugangsdaten, Zwischenspeicher und Montagehilfe-Link.

## v1.0.8 (2026-09-01)

### Hinzugefügt

- Eigenes Widerrufsformular im Theme inklusive REST-Endpunkt `/rest/cerescoconutmtg/cancellation`. Die Mail an den Shop bekommt jetzt einen Reply-To-Header auf die Kontakt-E-Mail des Kunden, eine Antwort geht also direkt an ihn.
- Optionale Eingangsbestätigung an den Kunden mit Datum und Uhrzeit (§ 356 Abs. 1 Satz 2 BGB).
- Neuer Konfigurationstab "Widerrufsformular" für Empfängeradresse, Betreff und Eingangsbestätigung.
- ShopBuilder-Widget "Widerrufsformular (Theme)" als Alternative zur statischen Seite.

## v1.0.7 (2019-05-02)

### TODO

- Sichere alle Änderungen, die in CeresCoconutMTG vorgenommen wurden, bevor du das Plugin aktualisierst. Alle Änderungen werden beim Update-Prozess zurückgesetzt.

### Behoben

- Die Kompatibilität zu Ceres 4.0.0 wurde hergestellt.

## v1.0.6 (2019-01-30)

### TODO

- Sichere alle Änderungen, die in CeresCoconutMTG vorgenommen wurden, bevor das Update eingespielt wird. Alle Änderungen werden beim Update-Prozess zurückgesetzt.

### Hinzugefügt

- Wir haben die Sprachdateien **Template.properties** für DE und EN hinzugefügt.

### Behoben

- Durch einen Fehler wurden die Result Fields nicht korrekt überschrieben. Dies wurde behoben.

## v1.0.4 (2019-01-25)

### TODO

- Sichere alle Änderungen, die in CeresCoconutMTG vorgenommen wurden, bevor das Update eingespielt wird. Alle Änderungen werden beim Update-Prozess zurückgesetzt.

### Hinzugefügt

- Wir haben die Templates **SingleItem_Details.twig** und **SingleItem_InformationTable.twig** hinzugefügt.

## v1.0.3 (2019-01-21)

### Behoben

- Ein Fehler führte dazu, dass die Result Fields nicht aus CeresCoconutMTG geladen wurden. Dies wurde behoben.

## v1.0.2 (2019-01-21)

### Behoben

- Ein Fehler führte dazu, dass die Result Fields nicht überschrieben wurden. Dies wurde behoben.

## v1.0.1 (2019-01-21)

### Behoben

- Einige Plugin-Dateien waren nicht korrekt benannt. Dies wurde behoben.

## v1.0.0 (2019-01-21)

### Hinzugefügt

- Plugin-Dateien, um die Kompatibilität zu Ceres 3.0.0 herzustellen.
- Funktionalität zum Überschreiben von Result Fields in der Plugin-Konfiguration.
- Funktionalität zum Überschreiben von von CSS, Templates und Partials durch Aktivierung der Templates in der Plugin-Konfiguration.
