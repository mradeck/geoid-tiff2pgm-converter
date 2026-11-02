# Changelog

## v26.08.5.1 — 2026-11-02

- Einheitliches Erscheinungsbild der öffentlichen Apps von Michael Radeck: neutrales Grau/Blau-Farbschema in hell und dunkel statt des bisherigen Grüntons
- Interface-Knopf mit drei Stufen automatisch / hell / dunkel; „automatisch“ folgt der Systemeinstellung, die Wahl wird gespeichert und vor dem ersten Zeichnen gesetzt
- Sprachknopf mit vektorisierter Fahne (DE schwarz-rot-gold, GB Union Jack) und Kürzel DE/EN
- Zwei Fußleisten: „Weitere Apps“ (Geodata Inspector & Cleaner, GeoTIFF Inspector, MeasureMap, DXF Coordinate Forge, PointCloud Manager, GPS / UTM Converter, SkyCheck, michael-radeck.de) und eine Meta-Leiste mit Version, Datenquellen, Quellcode, Hilfe / Bugreport / Kontakt, Lizenzen / Copyright, Impressum und Ko-fi
- Neuer Dialog „Lizenzen / Copyright“ mit allen verwendeten Bibliotheken, Schriften und OpenStreetMap
- Direkter E-Mail-Link im Kontaktdialog trägt jetzt die App-Version im Betreff; Version zusätzlich in der Kopfzeile
- Build: veraltete `vite.config.ts` (verweist auf die entfernte ChatGPT-Sites-Konfiguration) aus der TypeScript-Prüfung genommen, damit `npm run build:netlify` wieder durchläuft

## v26.08.5.0 — 2026-08-23

- Haupttitel fachlich präzise auf Geoidraster und PGM-Export ausgerichtet
- Deutsche und englische Titelvariante sprachlich angeglichen

## v26.08.4.0 — 2026-08-23

- Anklickbare und tastaturbedienbare „i“-Hilfen für Offset, Skalierung, Automatik, Wertebereich, Karte und Metadaten ergänzt
- NoData-Verfahren mit Wirkung, Empfehlung und dateibezogener Anzahl ausführlich erläutert
- Hilfe-Popover für helles, dunkles und mobiles Interface optimiert

## v26.08.3.0 — 2026-08-23

- Hilfe-/Bugreport-/Kontaktdialog in deutscher und englischer Sprache ergänzt
- Netlify-Forms-Übermittlung mit Honeypot-Spamschutz und Inline-Status eingebaut
- Direkter E-Mail-Fallback zu michael.radeck@email.de ergänzt

## v26.08.2.0 — 2026-08-23

- App-Bereich um GPS2UTM und Geodata Inspector & Cleaner ergänzt
- App-Verweise als responsive Dreier-Kartengruppe neu angeordnet

## v26.08.1.0 — 2026-08-23

- Helles und dunkles Interface mit gespeicherter Auswahl
- Vollständige Umschaltung zwischen Deutsch und Englisch
- App-Verweis auf PointCloud Manager sowie Impressum- und Ko-fi-Links
- Sichtbare Versions- und Copyright-Angaben nach dem SkyCheck-Schema
