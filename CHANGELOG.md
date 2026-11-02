# Changelog

## v26.12.3 — 2026-11-02

- Favicon: Variante „Gitter mit Geoid-Welle“ statt „G2P“-Schrift (bei 16 px lesbar).

## v26.12.2 — 2026-11-02

- Favicon aus dem Markenzeichen der Kopfleiste: „G2P“ in Akzentblau (Inter 700, als Pfade, keine Schrift-Abhängigkeit) in der gerahmten, abgerundeten Kachel (Radius 8/32 ≈ 9/34) mit den Farben des hellen Interface. Ersetzt das bisherige, nirgends eingebundene `favicon.svg` (fremdes Kachel-Logo)
- Neu `favicon-32.png` und `apple-touch-icon.png` (180 × 180, randlos auf Seitenhintergrund), aus dem SVG gerendert; eingebunden über `metadata.icons` im App-Router-Layout

## v26.12.1 — 2026-11-02

- Umbenennung: Aus „Geoid Forge“ wird „Geoid-TIFF 2 PGM Converter“, neue Adresse https://geoid-tiff2pgm-converter.netlify.app/ (vorher geoid-forge.netlify.app). Angepasst sind Kopfleiste (Titel „GEOID-TIFF 2 PGM“, Unterzeile „Converter“, Markenzeichen „G2P“), Fenstertitel, Metadaten (Titel, Beschreibung, OpenGraph, Canonical, metadataBase), Mail-Betreffe, Kontaktformular (`geoid-tiff2pgm-contact`), Über-mich-Text, Lizenzdialog, Vorschaubild `og.png`, README und `package.json`-Name. Sprache und Interface-Wahl werden unter neuen Schlüsseln (`geoid-tiff2pgm-*`) gespeichert
- Erscheinungsbild an den Geodata Inspector & Cleaner angeglichen: Kopfleiste (Markenzeichen in Rahmenform, Titel in Großbuchstaben mit Version, Unterzeile, Datenschutz-Chip), Buttons im Stil `.button`/`.button-quiet` (Radius 8 px, 12 px), Eyebrows (9 px, Laufweite .22em, Akzentfarbe), ruhigere Überschriften
- Die sehr große Hero-Überschrift auf 27 px reduziert (wie beim Cleaner); auch die Überschriften von Datensatz-Protokoll und Methodik verkleinert
- Kopfleiste neu geordnet: Methodik, Menü „Über“ mit „Über mich“ (neuer Dialog) und „Copyright“ (Lizenzdialog), Hilfe als „(i)“-Symbol, Interface-Knopf, Sprachknopf; der Text-Knopf „Hilfe & Kontakt“ entfällt
- Schrift: Geist über `next/font/google` ersetzt durch Inter, selbst gehostet über `@fontsource-variable/inter` (SIL OFL 1.1); Monospace über `ui-monospace`. Es gehen keine Anfragen mehr an Google-Font-Server
- Dialoge „Über mich“ und „Lizenzen / Copyright“ im Stil des Cleaners (Eyebrow, Überschrift, OK-Knopf); Lizenzdialog und README führen Inter statt Geist
- MeasureMap-Link auf https://measuremap-viewer-editor.netlify.app/ umgestellt

## v26.11.1 — 2026-11-02

- Versionsschema umgestellt von `vYY.MM.major.subversion` (zuletzt v26.08.5.1) auf `Jahr.Push.Iteration`; der Push-Zähler ist aus der Zahl der `main`-Commits 2026 abgeleitet
- Einheitliches Erscheinungsbild der öffentlichen Apps von Michael Radeck: neutrales Grau/Blau-Farbschema in hell und dunkel statt des bisherigen Grüntons
- Interface-Knopf mit drei Stufen automatisch / hell / dunkel; „automatisch“ folgt der Systemeinstellung, die Wahl wird gespeichert und vor dem ersten Zeichnen gesetzt
- Sprachknopf mit vektorisierter Fahne (DE schwarz-rot-gold, GB Union Jack) und Kürzel DE/EN
- Zwei Fußleisten: „Weitere Apps“ (Geodata Inspector & Cleaner, GeoTIFF Inspector, MeasureMap, DXF Coordinate Forge, PointCloud Manager, GPS / UTM Converter, SkyCheck, michael-radeck.de) und eine Meta-Leiste mit Version, Datenquellen, Quellcode, Hilfe / Bugreport / Kontakt, Lizenzen / Copyright, Impressum und Ko-fi
- Neuer Dialog „Lizenzen / Copyright“ mit allen verwendeten Bibliotheken, Schriften und OpenStreetMap
- Direkter E-Mail-Link im Kontaktdialog trägt jetzt die App-Version im Betreff; Version zusätzlich in der Kopfzeile
- Build repariert: Die `vite.config.ts` importierte die mit dem Entfernen der ChatGPT-Sites-Konfiguration gelöschte Datei `.openai/hosting.json`, wodurch `npm run build:netlify` scheiterte. Die Vite/vinext/Cloudflare/ChatGPT-Sites-Werkzeugkette ist entfernt (`vite.config.ts`, `vinext`, `vite`, `wrangler`, `@cloudflare/*`, `@openai/sites-vite-plugin`, `@vitejs/*`, `react-server-dom-webpack`); `npm run dev` und `npm run build` laufen jetzt wie der Netlify-Build direkt über Next.js
- Die frühere v26.08.5.1 wurde nie veröffentlicht und geht vollständig in v26.11.1 auf

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
