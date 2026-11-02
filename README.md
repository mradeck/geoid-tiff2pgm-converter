# Geoid-TIFF 2 PGM Converter

Live: https://geoid-tiff2pgm-converter.netlify.app/ (bis v26.11.1 unter dem Namen „Geoid Forge“)

Aktuelle App-Version: **v26.12.1**

![Geoid-TIFF 2 PGM Converter](public/og.png)

Eine browserbasierte Single-Page-App zum Analysieren von GeoTIFF-Geoidmodellen und zum Exportieren als binäres 16-Bit-PGM. Die Quelldatei bleibt im Browser und wird nicht auf einen Server hochgeladen.

## Funktionen

- GeoTIFF-Analyse mit Rastergröße, Datentyp, Kompression und GeoKeys
- CRS-Erkennung und Transformation für die Kartenanzeige
- Footprint aus gültigen Rasterzellen statt nur einer Bounding Box
- Höhenstatistik inklusive NoData-Anteil
- Binärer P5-Export mit Big-Endian-16-Bit-Werten
- RayStudio-Preset mit `Offset -108` und `Scale 0.003`
- NoData-Füllung über den nächsten gültigen Rasterwert oder den Median
- Kontextbezogene „i“-Hilfen zu Exportparametern, NoData, Kartenabdeckung und Metadaten
- Neutrales Farbschema (Grau/Blau) und Erscheinungsbild wie beim Geodata Inspector & Cleaner: Kopfleiste mit Markenzeichen, Titel in Großbuchstaben, Version und Datenschutz-Chip, ruhige Typografie, einheitliche Buttons und Eyebrows
- Schrift Inter, selbst gehostet über `@fontsource-variable/inter` (keine Anfragen an Google Fonts oder andere Schrift-CDNs)
- Kopfleiste in fester Reihenfolge: Methodik, Menü „Über“ (Über mich, Copyright), Hilfe als „(i)“-Symbol (öffnet Hilfe / Bugreport / Kontakt), Interface-Knopf, Sprachknopf
- Interface-Knopf automatisch / hell / dunkel (automatisch folgt der Systemeinstellung) und Sprachknopf DE/EN mit Fahne; beide Einstellungen werden im Browser gespeichert
- Fußleiste „Weitere Apps“ (Geodata Inspector & Cleaner, GeoTIFF Inspector, [MeasureMap](https://measuremap-viewer-editor.netlify.app/), DXF Coordinate Forge, PointCloud Manager, GPS / UTM Converter, SkyCheck, michael-radeck.de)
- Meta-Fußleiste mit Version, OpenStreetMap, BKG, Quellcode, Hilfe / Bugreport / Kontakt, Lizenzen / Copyright, Impressum und Ko-fi
- Hilfe-, Bugreport- und Kontaktformular über Netlify Forms (Formular `geoid-tiff2pgm-contact`; die Formular-Erkennung muss in der Netlify-Site unter *Forms* aktiviert sein), direkter E-Mail-Link mit Version im Betreff als Rückfall
- Vollständig statischer Netlify-Build

## Versionierung

Der Geoid-TIFF 2 PGM Converter folgt dem gemeinsamen Schema der öffentlichen Apps von Michael Radeck: `Jahr.Push.Iteration`, z. B. `v26.12.1`.

- `Jahr` — zweistellige Jahreszahl (`26` für 2026)
- `Push` — laufende Nummer des GitHub-Pushes auf `main` im Jahr
- `Iteration` — lokale Iteration innerhalb dieses Pushes, beginnt bei `1`

Vor jedem Push auf `main` wird `Push` um eins erhöht und `Iteration` auf `1` gesetzt. Die Versionsnummer steht zentral in `app/lib/version.ts` (Anzeige mit vorangestelltem `v`) und in `package.json` (`26.12.1`). Sie erscheint im Browser-Titel, in der Kopfzeile, in der Fußleiste und im Betreff von Kontakt-Mails. Bis einschließlich `v26.08.5.1` galt das Schema `vYY.MM.major.subversion`.

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft anschließend unter `http://localhost:3000`.

## Netlify-Build

```bash
npm run build:netlify
```

Der statische Export wird in `out/` erzeugt. Die Build- und Publish-Einstellungen stehen in `netlify.toml`.

## Format-Hinweis

Der Export folgt dem Netpbm-P5-Format. GeographicLib verwendet für Geoid-PGM-Dateien die Beziehung `Höhe = Offset + Scale × Pixelwert`. GeographicLib selbst erwartet dabei weltweite Raster. Für regionale Modelle wie GCG2016/2023 sollte ein RayStudio-Import deshalb an einem bekannten Kontrollpunkt validiert werden, solange RayStudio kein öffentlich dokumentiertes regionales PGM-Schema bereitstellt.

## Lizenzen der verwendeten Komponenten

| Komponente | Lizenz | Verwendung |
| --- | --- | --- |
| geotiff.js 3.0.5 | MIT | GeoTIFF lesen |
| geotiff-geokeys-to-proj4 2026.08.16 | BSD-3-Clause | GeoKeys in Proj4-Definitionen übersetzen |
| proj4js 2.21.0 | MIT | Koordinaten umrechnen |
| Leaflet 1.9.4 | BSD-2-Clause | Kartenanzeige |
| d3-contour 4.0.2 | ISC | Footprint-Kontur |
| Lucide 1.33.0 | ISC | Symbole |
| React 19.2.6 / Next.js 16.2.6 | MIT | Oberfläche, statischer Export |
| Inter (@fontsource-variable/inter 5.3.0), © The Inter Project Authors | SIL OFL 1.1 | Schrift, selbst gehostet |
| OpenStreetMap | ODbL | Grundkarte (online geladen) |

## Technische Grundlagen

- [Netpbm PGM specification](https://netpbm.sourceforge.net/doc/pgm.html)
- [GeographicLib geoid data format](https://geographiclib.sourceforge.io/C++/doc/geoid.html#geoidformat)
- [geotiff.js](https://github.com/geotiffjs/geotiff.js)
- [Proj4js](https://github.com/proj4js/proj4js)
- [BKG GCG2016/2023](https://gdz.bkg.bund.de/index.php/default/quasigeoid-der-bundesrepublik-deutschland-quasigeoid.html)
