'use client';

import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import {
  AlertTriangle,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  Coffee,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Info,
  Languages,
  Layers3,
  LifeBuoy,
  LoaderCircle,
  Mail,
  MapPinned,
  Moon,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Send,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  analyzeGeoTiff,
  createPgm,
  outputFileName,
  type PgmResult,
  type RasterAnalysis,
} from './lib/geoid';
import { APP_VERSION_CODE } from './lib/version';

type Phase = 'idle' | 'reading' | 'ready' | 'error';
type MetadataTab = 'overview' | 'geokeys' | 'pgm';
type Language = 'de' | 'en';
type Theme = 'light' | 'dark';

const COPY = {
  de: {
    home: 'Geoid Forge Startseite', method: 'Methodik', local: 'Datei bleibt lokal',
    darkMode: 'Dunkles Interface aktivieren', lightMode: 'Helles Interface aktivieren', language: 'Sprache wechseln',
    eyebrow: 'Geoid-Konverter & Metadaten-Analyse', title: 'Geoidraster analysieren und als PGM exportieren',
    lede: 'Prüfe Raster, Koordinatenbezug und Abdeckung. Exportiere anschließend ein binäres 16-Bit-PGM für deinen RayStudio-Workflow.',
    workspace: 'Konverter-Arbeitsbereich', source: 'Quelldatei', load: 'GeoTIFF laden', analyzed: 'analysiert',
    reading: 'Raster wird gelesen', readingText: 'Metadaten, Wertebereich und Footprint werden ermittelt …',
    drop: 'GeoTIFF hier ablegen', chooseLocal: 'oder eine lokale Datei auswählen', choose: 'GeoTIFF auswählen',
    noUpload: '.tif oder .tiff · kein Datei-Upload', removeFile: 'Datei entfernen', output: 'Ausgabe', configure: 'PGM konfigurieren',
    preset: 'RayStudio-Preset', presetMeta: 'GeographicLib-Metadaten', scale: 'Skalierung',
    autoRange: 'Wertebereich automatisch ausnutzen', noData: 'NoData-Behandlung', nearest: 'Nächsten gültigen Wert übernehmen',
    medianFill: 'Mit Medianwert auffüllen', rangeOk: 'Ausgabebereich {min} bis {max} m passt.',
    rangeBad: 'Werte liegen außerhalb des gewählten Ausgabebereichs.', generating: 'PGM wird erzeugt …',
    openInfo: 'Erklärung öffnen', recommendation: 'Empfehlung',
    offsetHelpTitle: 'Offset: niedrigster darstellbarer Höhenwert',
    offsetHelpText: 'Der Offset ist die Höhe, die im PGM dem Pixelwert 0 entspricht. Alle übrigen Höhen werden relativ zu diesem Startwert gespeichert.',
    offsetHelpNote: 'Der Offset sollte gleich oder etwas kleiner als das Minimum des GeoTIFFs sein. Ein zu hoher Wert führt zu abgeschnittenen Tiefstwerten.',
    scaleHelpTitle: 'Skalierung: Höhenabstand je Grauwertstufe',
    scaleHelpText: 'Die Skalierung gibt an, wie viele Meter eine Stufe im 16-Bit-PGM entspricht. Mit 0,003 m beträgt die theoretische Auflösung 3 mm pro Stufe.',
    scaleHelpNote: 'Kleinere Werte sind präziser, verkleinern aber den insgesamt darstellbaren Höhenbereich.',
    autoRangeHelpTitle: 'Automatischen Wertebereich berechnen',
    autoRangeHelpText: 'Die App setzt Offset und Skalierung so, dass Minimum und Maximum des gültigen Rasters möglichst vollständig in 0 bis 65.535 passen.',
    autoRangeHelpNote: 'Ein guter Ausgangspunkt. Kontrolliere danach die Quantisierung und mögliche abgeschnittene Werte im PGM-Prüfbericht.',
    noDataHelpTitle: 'Was bedeutet NoData?',
    noDataHelpText: 'NoData kennzeichnet Rasterzellen ohne gültige Geoid-Höhe, zum Beispiel außerhalb der Modellgrenze oder in Datenlücken. Ein PGM kennt hier keinen universellen NoData-Wert; deshalb müssen diese Zellen beim Export ersetzt werden.',
    noDataHelpNote: 'Die gültigen Originalwerte werden durch diese Auswahl nicht verändert.',
    nearestHelpTitle: 'Nächsten gültigen Wert übernehmen',
    nearestHelpText: 'Jede NoData-Zelle erhält den Höhenwert der räumlich nächstgelegenen gültigen Rasterzelle. Dadurch setzt sich die lokale Randhöhe in die Lücke fort.',
    nearestHelpNote: 'Für kleine Löcher und schmale Randbereiche meist die beste Wahl. Große NoData-Flächen können dadurch streifen- oder flächenartig fortgeschrieben werden.',
    medianHelpTitle: 'Mit Medianwert auffüllen',
    medianHelpText: 'Alle NoData-Zellen erhalten denselben, aus einer Stichprobe von bis zu 50.000 gültigen Höhenwerten ermittelten Median. Einzelne Extremwerte beeinflussen ihn weniger stark als den Mittelwert.',
    medianHelpNote: 'Schnell und robust, erzeugt aber in jeder Lücke eine ebene Fläche. Eher für neutrale Füllbereiche als für lokale Geländeübergänge geeignet.',
    noDataDetected: '{count} NoData-Zellen erkannt ({percent} % des Rasters).',
    noDataNotDetected: 'Keine NoData-Zellen erkannt – diese Einstellung verändert den aktuellen Export nicht.',
    rangeHelpTitle: 'Prüfung des 16-Bit-Ausgabebereichs',
    rangeHelpText: 'Ein 16-Bit-PGM kann 65.536 Stufen von 0 bis 65.535 speichern. Der darstellbare Höhenbereich ergibt sich aus Offset + Skalierung × Pixelwert.',
    rangeHelpNote: '„Passt“ bedeutet: Kein gültiger Höhenwert muss am unteren oder oberen Ende abgeschnitten werden.',
    export: 'PGM erzeugen & laden', downloadAgain: 'Erneut laden', spatialCheck: '03 / Räumliche Prüfung',
    coverage: 'Abdeckung des Datensatzes', spatialPreview: 'Räumliche Vorschau', raster: 'Raster',
    footprintReady: 'Footprint erscheint nach dem Einlesen', footprintText: 'Rahmen und gültiger Datenbereich werden getrennt dargestellt.',
    preparingMap: 'Karte wird vorbereitet', colorScale: 'Farbskala des Höhenrasters', validArea: 'gültiger Datenbereich',
    map: 'Karte: OpenStreetMap', minimum: 'Minimum', maximum: 'Maximum', mean: 'Mittelwert', valid: 'Gültig',
    protocol: 'Datensatz-Protokoll', metadataTitle: 'Metadaten auf einen Blick.', metadataView: 'Metadatenansicht',
    coverageHelpTitle: 'Was zeigt die Kartenabdeckung?',
    coverageHelpText: 'Die Karte zeigt die geografische Bounding Box des GeoTIFFs. Wenn genügend gültige Rasterzellen vorliegen, markiert die grüne Kontur zusätzlich deren tatsächlichen Grenzverlauf.',
    coverageHelpNote: 'Die farbige Rasterdarstellung ist eine vereinfachte Vorschau. Sie verändert weder das GeoTIFF noch das exportierte PGM.',
    metadataHelpTitle: 'So liest du die Metadaten',
    metadataHelpText: 'Raster beschreibt Dateiaufbau und Speichertyp, Raumbezug die Positionierung und Pixelgeometrie, Höhenwerte die Statistik des ersten Rasterbands. NoData-Zellen werden ausgeschlossen; der Median wird aus einer Stichprobe von bis zu 50.000 gültigen Werten geschätzt.',
    metadataHelpNote: 'Fehlender oder falscher CRS/EPSG-Bezug kann die Kartenlage verfälschen, auch wenn die Höhenwerte selbst korrekt gelesen werden.',
    overview: 'Übersicht', pgmHeader: 'PGM-Kopf', pixels: 'Pixel', noFile: 'Noch keine Datei', bands: 'Bänder',
    dataType: 'Datentyp', compression: 'Kompression', ifdLevels: 'IFD-Ebenen', uncompressed: 'Unkomprimiert',
    spatialReference: 'Raumbezug', autoDetect: 'Wird automatisch erkannt', noEpsg: 'Kein EPSG-Code',
    rasterType: 'Rasterbezug', pixelArea: 'Pixel = Fläche', pixelPoint: 'Pixel = Punkt', pixelSizeX: 'Pixelgröße X',
    pixelSizeY: 'Pixelgröße Y', heights: 'Höhenwerte', range: 'Spannweite', valueCheck: 'Werteprüfung',
    stdDev: 'Standardabw.', median: 'Median', validValues: 'Gültige Werte', keysTitle: 'GeoTIFF-Schlüssel & GDAL-Metadaten',
    keysPlaceholder: '// Nach dem Einlesen werden die eingebetteten Metadaten hier vollständig angezeigt.', outputFile: 'ausgabe.pgm',
    pgmSuccess: 'PGM erfolgreich erzeugt', pgmReport: 'PGM-Prüfbericht', fileSize: 'Dateigröße', values16: '16-Bit-Werte',
    noDataFilled: 'NoData gefüllt', maxQuantization: 'Max. Quantisierung', clipping: 'Clipping', values: 'Werte', none: 'keines',
    reportPlaceholder: 'Nach dem Export siehst du hier Dateigröße, Quantisierung, NoData-Füllung und mögliches Clipping.',
    compatibilityTitle: 'Wichtiger RayStudio-Hinweis für regionale Modelle',
    compatibilityText: 'Das exportierte PGM ist formal Netpbm-konform und enthält Offset, Scale, CRS und BoundingBox als Kommentare. GeographicLib selbst interpretiert seine Geoid-PGM jedoch als weltweites Raster. Da RayStudio das genaue regionale PGM-Schema öffentlich nicht beschreibt, prüfe den Import einmal an einem bekannten Kontrollpunkt.',
    technicalBasis: 'Technische Basis', standardsTitle: 'Auf Standards gebaut, nicht auf Dateitricks.',
    standardsText: 'Die Konvertierung folgt dem binären P5-Format. Höhen werden linear als',
    standardsEnd: 'codiert; 16-Bit-Werte werden Big-Endian geschrieben.', pgmSpec: 'PGM-Spezifikation',
    geographicLib: 'GeographicLib Geoid-Format', sourceCode: 'Quellcode', otherApp: 'Weitere Apps',
    pointCloudDescription: 'Punktwolken verwalten, prüfen und für weitere Workflows vorbereiten.',
    gpsDescription: 'GPS-Koordinaten direkt in ETRS89 / UTM, Gauß-Krüger und DHHN2016 umrechnen.',
    geodataDescription: 'Räumliche Ausreißer in DXF- und GeoJSON-Dateien lokal untersuchen und bereinigen.',
    legalSupport: 'Rechtliches & Support',
    imprint: 'Impressum', support: 'Ko-fi', helpContact: 'Hilfe & Kontakt',
    contactTitle: 'Wie können wir helfen?',
    contactIntro: 'Frage stellen, Fehler melden oder direkt Kontakt aufnehmen. Deine Nachricht landet bei Michael Radeck.',
    category: 'Anliegen', categoryHelp: 'Hilfe / Frage', categoryBug: 'Bugreport', categoryContact: 'Kontakt',
    name: 'Name', email: 'E-Mail', topic: 'Betreff', message: 'Nachricht', requiredHint: 'Alle Felder sind erforderlich.',
    namePlaceholder: 'Dein Name', emailPlaceholder: 'name@beispiel.de', topicPlaceholder: 'Kurze Zusammenfassung',
    messagePlaceholder: 'Was ist passiert oder wobei brauchst du Hilfe?',
    contactPrivacy: 'Die Angaben werden sicher über Netlify Forms an michael.radeck@email.de übermittelt. Bitte keine vertraulichen Geodaten mitsenden.',
    sendMessage: 'Nachricht senden', sendingMessage: 'Wird gesendet …', close: 'Schließen',
    contactSuccessTitle: 'Nachricht ist unterwegs.', contactSuccessText: 'Danke! Die Anfrage wurde übermittelt und kann per E-Mail beantwortet werden.',
    contactError: 'Die Nachricht konnte gerade nicht übermittelt werden. Bitte versuche es erneut oder schreibe direkt per E-Mail.',
    directEmail: 'Direkt per E-Mail',
    privacyFooter: 'Rohdaten werden nicht hochgeladen. Kartenkacheln werden von OpenStreetMap geladen.',
    copyright: '© 2026 Michael Radeck. Alle Rechte vorbehalten.', version: 'Version',
    pgmEmpty: 'Nach der Analyse erscheint hier der PGM-Dateikopf.', binaryData: '… Binärdaten …',
  },
  en: {
    home: 'Geoid Forge home', method: 'Method', local: 'File stays local', darkMode: 'Enable dark interface',
    lightMode: 'Enable light interface', language: 'Switch language', eyebrow: 'Geoid converter & metadata analysis',
    title: 'Analyze geoid grids and export them as PGM',
    lede: 'Inspect raster data, spatial reference and coverage, then export a binary 16-bit PGM for your RayStudio workflow.',
    workspace: 'Converter workspace', source: 'Source file', load: 'Load GeoTIFF', analyzed: 'analyzed',
    reading: 'Reading raster', readingText: 'Inspecting metadata, value range and footprint …', drop: 'Drop GeoTIFF here',
    chooseLocal: 'or choose a local file', choose: 'Choose GeoTIFF', noUpload: '.tif or .tiff · no file upload',
    removeFile: 'Remove file', output: 'Output', configure: 'Configure PGM', preset: 'RayStudio preset',
    presetMeta: 'GeographicLib metadata', scale: 'Scale', autoRange: 'Use the full value range automatically',
    noData: 'NoData handling', nearest: 'Use nearest valid value', medianFill: 'Fill with median value',
    rangeOk: 'Output range {min} to {max} m fits.', rangeBad: 'Values fall outside the selected output range.',
    generating: 'Generating PGM …', export: 'Generate & download PGM', downloadAgain: 'Download again',
    openInfo: 'Open explanation', recommendation: 'Recommendation',
    offsetHelpTitle: 'Offset: lowest representable elevation',
    offsetHelpText: 'The offset is the elevation represented by pixel value 0 in the PGM. Every other elevation is stored relative to this starting value.',
    offsetHelpNote: 'Set it equal to or slightly below the GeoTIFF minimum. An offset that is too high clips the lowest elevations.',
    scaleHelpTitle: 'Scale: elevation interval per grey level',
    scaleHelpText: 'Scale specifies how many metres one step in the 16-bit PGM represents. A value of 0.003 m gives a theoretical resolution of 3 mm per step.',
    scaleHelpNote: 'Smaller values provide finer precision but reduce the total elevation range that can be represented.',
    autoRangeHelpTitle: 'Calculate the output range automatically',
    autoRangeHelpText: 'The app sets offset and scale so that the valid raster minimum and maximum fit as fully as possible into values 0 to 65,535.',
    autoRangeHelpNote: 'A good starting point. Afterwards, check quantization and clipped values in the PGM validation report.',
    noDataHelpTitle: 'What does NoData mean?',
    noDataHelpText: 'NoData marks raster cells without a valid geoid elevation, for example outside the model boundary or in data gaps. A PGM has no universal NoData value, so these cells must be replaced during export.',
    noDataHelpNote: 'This selection does not change any valid source values.',
    nearestHelpTitle: 'Use the nearest valid value',
    nearestHelpText: 'Each NoData cell receives the elevation of the spatially nearest valid raster cell. This extends the local edge elevation into the gap.',
    nearestHelpNote: 'Usually best for small holes and narrow edge areas. Across large NoData regions it can extend values into stripe-like or broad areas.',
    medianHelpTitle: 'Fill with the median value',
    medianHelpText: 'Every NoData cell receives the same median estimated from a sample of up to 50,000 valid elevations. Extreme values affect the median less than they affect the mean.',
    medianHelpNote: 'Fast and robust, but it creates a flat surface in every gap. Better for neutral fill regions than for local terrain transitions.',
    noDataDetected: '{count} NoData cells detected ({percent}% of the raster).',
    noDataNotDetected: 'No NoData cells detected — this setting does not change the current export.',
    rangeHelpTitle: '16-bit output-range check',
    rangeHelpText: 'A 16-bit PGM stores 65,536 levels from 0 to 65,535. The representable elevation range is calculated as offset + scale × pixel value.',
    rangeHelpNote: '“Fits” means that no valid elevation needs to be clipped at either end of the range.',
    spatialCheck: '03 / Spatial check', coverage: 'Dataset coverage', spatialPreview: 'Spatial preview', raster: 'Raster',
    footprintReady: 'Footprint appears after reading', footprintText: 'Extent and valid data area are shown separately.',
    preparingMap: 'Preparing map', colorScale: 'Elevation raster color scale', validArea: 'valid data area',
    map: 'Map: OpenStreetMap', minimum: 'Minimum', maximum: 'Maximum', mean: 'Mean', valid: 'Valid',
    protocol: 'Dataset record', metadataTitle: 'Metadata at a glance.', metadataView: 'Metadata view', overview: 'Overview',
    coverageHelpTitle: 'What does the map coverage show?',
    coverageHelpText: 'The map shows the geographic bounding box of the GeoTIFF. When enough valid raster cells are available, the green outline additionally marks their actual boundary.',
    coverageHelpNote: 'The coloured raster is a simplified preview. It changes neither the GeoTIFF nor the exported PGM.',
    metadataHelpTitle: 'How to read the metadata',
    metadataHelpText: 'Raster describes file structure and storage type, spatial reference describes positioning and pixel geometry, and elevation values summarise the first raster band. NoData cells are excluded; the median is estimated from a sample of up to 50,000 valid values.',
    metadataHelpNote: 'A missing or incorrect CRS/EPSG reference can distort the map position even when the elevation values themselves are read correctly.',
    pgmHeader: 'PGM header', pixels: 'pixels', noFile: 'No file yet', bands: 'Bands', dataType: 'Data type',
    compression: 'Compression', ifdLevels: 'IFD levels', uncompressed: 'Uncompressed', spatialReference: 'Spatial reference',
    autoDetect: 'Detected automatically', noEpsg: 'No EPSG code', rasterType: 'Raster type', pixelArea: 'Pixel = area',
    pixelPoint: 'Pixel = point', pixelSizeX: 'Pixel size X', pixelSizeY: 'Pixel size Y', heights: 'Elevation values',
    range: 'range', valueCheck: 'Value check', stdDev: 'Std. deviation', median: 'Median', validValues: 'Valid values',
    keysTitle: 'GeoTIFF keys & GDAL metadata', keysPlaceholder: '// Embedded metadata will be shown here in full after the file is read.',
    outputFile: 'output.pgm', pgmSuccess: 'PGM generated successfully', pgmReport: 'PGM validation report', fileSize: 'File size',
    values16: '16-bit values', noDataFilled: 'NoData filled', maxQuantization: 'Max. quantization', clipping: 'Clipping',
    values: 'values', none: 'none', reportPlaceholder: 'After export, file size, quantization, NoData filling and any clipping are shown here.',
    compatibilityTitle: 'Important RayStudio note for regional models',
    compatibilityText: 'The exported PGM is formally Netpbm-compliant and includes Offset, Scale, CRS and BoundingBox as comments. GeographicLib itself interprets geoid PGM files as global rasters. Because RayStudio does not publicly document its exact regional PGM schema, validate the import against a known control point.',
    technicalBasis: 'Technical foundation', standardsTitle: 'Built on standards, not file tricks.',
    standardsText: 'The conversion follows the binary P5 format. Elevations are encoded linearly as',
    standardsEnd: '; 16-bit values are written in big-endian order.', pgmSpec: 'PGM specification',
    geographicLib: 'GeographicLib geoid format', sourceCode: 'source code', otherApp: 'More apps',
    pointCloudDescription: 'Manage, inspect and prepare point clouds for downstream workflows.',
    gpsDescription: 'Convert GPS coordinates directly to ETRS89 / UTM, Gauss-Krüger and DHHN2016.',
    geodataDescription: 'Inspect and clean spatial outliers in DXF and GeoJSON files locally.',
    legalSupport: 'Legal & support',
    imprint: 'Legal notice', support: 'Ko-fi', helpContact: 'Help & contact',
    contactTitle: 'How can we help?',
    contactIntro: 'Ask a question, report a bug or get in touch directly. Your message goes to Michael Radeck.',
    category: 'Request type', categoryHelp: 'Help / question', categoryBug: 'Bug report', categoryContact: 'Contact',
    name: 'Name', email: 'Email', topic: 'Subject', message: 'Message', requiredHint: 'All fields are required.',
    namePlaceholder: 'Your name', emailPlaceholder: 'name@example.com', topicPlaceholder: 'Short summary',
    messagePlaceholder: 'What happened, or what do you need help with?',
    contactPrivacy: 'Your details are securely sent through Netlify Forms to michael.radeck@email.de. Please do not include confidential geodata.',
    sendMessage: 'Send message', sendingMessage: 'Sending …', close: 'Close',
    contactSuccessTitle: 'Your message is on its way.', contactSuccessText: 'Thank you! Your request was submitted and can be answered by email.',
    contactError: 'Your message could not be sent right now. Please try again or send an email directly.',
    directEmail: 'Email directly',
    privacyFooter: 'Raw data is never uploaded. Map tiles are loaded from OpenStreetMap.',
    copyright: '© 2026 Michael Radeck. All rights reserved.', version: 'Version',
    pgmEmpty: 'The PGM file header will appear here after analysis.', binaryData: '… Binary data …',
  },
} as const;

type CopyKey = keyof typeof COPY.de;

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((result, [key, value]) => result.replace(`{${key}}`, value), template);

const formatNumber = (value: number, digits: number, language: Language) =>
  new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: digits }).format(value);

const formatBytes = (bytes: number, language: Language) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${formatNumber(value, 1, language)} ${unit}`;
};

const formatCoordinate = (value: number, language: Language) => `${formatNumber(value, 6, language)}°`;

function InfoTip({ title, text, note, openLabel, align = 'start' }: {
  title: string;
  text: string;
  note?: string;
  openLabel: string;
  align?: 'start' | 'end';
}) {
  return (
    <details className={`info-tip align-${align}`} onKeyDown={(event) => {
      if (event.key === 'Escape') event.currentTarget.removeAttribute('open');
    }}>
      <summary aria-label={`${openLabel}: ${title}`} title={`${openLabel}: ${title}`}>
        <Info size={12} aria-hidden="true" />
      </summary>
      <span className="info-popover" role="note">
        <strong>{title}</strong>
        <span>{text}</span>
        {note && <small><Sparkles size={12} aria-hidden="true" /> {note}</small>}
      </span>
    </details>
  );
}

const localizeError = (message: string, language: Language) => {
  if (language === 'de') return message;
  const translations: Record<string, string> = {
    'Das erste Rasterband enthält keine gültigen numerischen Werte.': 'The first raster band contains no valid numeric values.',
    'Das Raster ist für die Browser-Verarbeitung zu groß (mehr als 150 Mio. Pixel).': 'The raster is too large for browser processing (more than 150 million pixels).',
    'Das GeoTIFF enthält kein lesbares Rasterband.': 'The GeoTIFF contains no readable raster band.',
    'Der Offset muss eine gültige Zahl sein.': 'Offset must be a valid number.',
    'Die Skalierung muss größer als null sein.': 'Scale must be greater than zero.',
  };
  return translations[message] ?? message;
};

function CoverageMap({ analysis, showRaster, language }: { analysis: RasterAnalysis | null; showRaster: boolean; language: Language }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const overlayRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!containerRef.current || mapRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      overlayRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      map.fitBounds([[47.1, 3.1], [56.1, 15.3]], { padding: [28, 28] });
      window.setTimeout(() => map.invalidateSize(), 50);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const overlays = overlayRef.current;
    if (!map || !L || !overlays) return;
    overlays.clearLayers();
    if (!analysis?.wgs84Bbox) return;
    const [west, south, east, north] = analysis.wgs84Bbox;
    const bounds = L.latLngBounds([south, west], [north, east]);
    if (showRaster && analysis.previewDataUrl) {
      L.imageOverlay(analysis.previewDataUrl, bounds, { opacity: 0.66, interactive: false, className: 'raster-overlay' }).addTo(overlays);
    }
    if (analysis.footprint) {
      L.geoJSON(analysis.footprint as never, {
        style: { color: '#0f4f39', weight: 2.4, opacity: 1, fillColor: '#8cf0bd', fillOpacity: showRaster ? 0.08 : 0.22 },
      }).addTo(overlays);
    } else {
      L.rectangle(bounds, { color: '#0f4f39', weight: 2.4, fillColor: '#8cf0bd', fillOpacity: 0.18 }).addTo(overlays);
    }
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 9 });
    window.setTimeout(() => map.invalidateSize(), 50);
  }, [analysis, showRaster]);

  return <div ref={containerRef} className="leaflet-map" aria-label={language === 'de' ? 'Interaktive Karte des GeoTIFF-Datenbereichs' : 'Interactive map of the GeoTIFF coverage area'} />;
}

function MetadataRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="metadata-list">
      {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
  );
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);
  const contactFirstRef = useRef<HTMLSelectElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [analysis, setAnalysis] = useState<RasterAnalysis | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [showRaster, setShowRaster] = useState(true);
  const [activeTab, setActiveTab] = useState<MetadataTab>('overview');
  const [offset, setOffset] = useState('-108');
  const [scale, setScale] = useState('0.003');
  const [noDataStrategy, setNoDataStrategy] = useState<'nearest' | 'median'>('nearest');
  const [generating, setGenerating] = useState(false);
  const [pgmResult, setPgmResult] = useState<PgmResult | null>(null);
  const [language, setLanguage] = useState<Language>('de');
  const [theme, setTheme] = useState<Theme>('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactCategory, setContactCategory] = useState('help');
  const [contactTopic, setContactTopic] = useState('');
  const copy = COPY[language];
  const t = (key: CopyKey) => copy[key];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem('geoid-forge-language');
    const storedTheme = window.localStorage.getItem('geoid-forge-theme');
    const nextLanguage: Language = storedLanguage === 'en' || storedLanguage === 'de'
      ? storedLanguage
      : navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
    const nextTheme: Theme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const timer = window.setTimeout(() => {
      setLanguage(nextLanguage);
      setTheme(nextTheme);
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.title = `${language === 'de' ? 'Geoid Forge — GeoTIFF zu PGM' : 'Geoid Forge — GeoTIFF to PGM'} · ${APP_VERSION_CODE}`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1511' : '#f4f3ed');
    window.localStorage.setItem('geoid-forge-language', language);
    window.localStorage.setItem('geoid-forge-theme', theme);
  }, [language, preferencesReady, theme]);

  useEffect(() => {
    if (!contactOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => contactFirstRef.current?.focus(), 60);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContactOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [contactOpen]);

  const numericOffset = Number(offset);
  const numericScale = Number(scale);
  const outputMaximum = numericOffset + numericScale * 65_535;
  const rangeFits = Boolean(analysis && Number.isFinite(numericOffset) && Number.isFinite(numericScale) && numericScale > 0
    && analysis.stats.min >= numericOffset && analysis.stats.max <= outputMaximum);
  const validPercent = analysis ? (analysis.stats.validCount / (analysis.width * analysis.height)) * 100 : 0;
  const noDataPercent = analysis ? (analysis.stats.noDataCount / (analysis.width * analysis.height)) * 100 : 0;
  const isRegional = Boolean(analysis?.wgs84Bbox && (analysis.wgs84Bbox[2] - analysis.wgs84Bbox[0] < 350
    || analysis.wgs84Bbox[3] - analysis.wgs84Bbox[1] < 170));

  const pgmPreview = useMemo(() => {
    if (pgmResult) return pgmResult.header;
    if (!analysis) return copy.pgmEmpty;
    return [
      'P5', '# Geoid file in PGM format', `# Description ${analysis.fileName}`, `# Offset ${offset}`, `# Scale ${scale}`,
      `# CRS ${analysis.crsCode ?? analysis.crsName}`, `# BoundingBox ${analysis.bbox?.join(' ') ?? 'not_available'}`,
      `${analysis.width} ${analysis.height}`, '65535', copy.binaryData,
    ].join('\n');
  }, [analysis, copy.binaryData, copy.pgmEmpty, offset, pgmResult, scale]);

  const processFile = async (file: File) => {
    if (!/\.tiff?$/i.test(file.name)) {
      setError(language === 'de' ? 'Bitte wähle eine Datei mit der Endung .tif oder .tiff.' : 'Please choose a file with the extension .tif or .tiff.');
      setPhase('error');
      return;
    }
    setPhase('reading');
    setError('');
    setPgmResult(null);
    await new Promise((resolve) => window.setTimeout(resolve, 40));
    try {
      const result = await analyzeGeoTiff(file);
      setAnalysis(result);
      setPhase('ready');
      setActiveTab('overview');
    } catch (caught) {
      setAnalysis(null);
      setPhase('error');
      const message = caught instanceof Error ? caught.message : language === 'de' ? 'Das GeoTIFF konnte nicht gelesen werden.' : 'The GeoTIFF could not be read.';
      setError(localizeError(message, language));
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void processFile(file);
  };

  const clearFile = () => {
    setAnalysis(null);
    setPgmResult(null);
    setError('');
    setPhase('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const downloadBlob = (blob: Blob) => {
    if (!analysis) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = outputFileName(analysis.fileName);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const exportPgm = async () => {
    if (!analysis) return;
    setGenerating(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    try {
      const result = createPgm(analysis, {
        offset: numericOffset, scale: numericScale, noDataStrategy, description: analysis.fileName.replace(/\.[^.]+$/, ''),
      });
      setPgmResult(result);
      setActiveTab('pgm');
      downloadBlob(result.blob);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : language === 'de' ? 'Die PGM-Datei konnte nicht erzeugt werden.' : 'The PGM file could not be generated.';
      setError(localizeError(message, language));
    } finally {
      setGenerating(false);
    }
  };

  const setAutomaticRange = () => {
    if (!analysis) return;
    const nextOffset = Math.floor(analysis.stats.min * 1000) / 1000;
    const nextScale = Math.max(0.000001, (analysis.stats.max - nextOffset) / 65_535);
    setOffset(String(nextOffset));
    setScale(nextScale.toPrecision(9));
    setPgmResult(null);
  };

  const openContact = () => {
    setContactStatus('idle');
    setContactOpen(true);
  };

  const closeContact = () => setContactOpen(false);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactStatus('sending');
    const formData = new FormData(event.currentTarget);
    formData.set('form-name', 'geoid-forge-contact');
    formData.set('version', APP_VERSION_CODE);
    formData.set('page', 'https://geoid-forge.netlify.app/');
    const body = new URLSearchParams();
    formData.forEach((value, key) => {
      if (typeof value === 'string') body.append(key, value);
    });

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      contactFormRef.current?.reset();
      setContactCategory('help');
      setContactTopic('');
      setContactStatus('success');
    } catch {
      setContactStatus('error');
    }
  };

  const compressionLabel = analysis?.compressionLabel === 'Unkomprimiert' && language === 'en' ? copy.uncompressed : analysis?.compressionLabel;
  const crsName = analysis?.crsName === 'Nicht ausgewiesen' && language === 'en' ? 'Not specified' : analysis?.crsName;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label={t('home')}>
          <span className="brand-mark" aria-hidden="true">GF</span>
          <span><strong>Geoid Forge</strong><small>GeoTIFF → PGM</small></span>
        </a>
        <div className="topbar-actions">
          <a className="method-link" href="#methodik">{t('method')}</a>
          <div className="privacy-pill"><ShieldCheck size={14} /> {t('local')}</div>
          <button className="utility-toggle contact-toggle" type="button" onClick={openContact}>
            <LifeBuoy size={15} /><span>{t('helpContact')}</span>
          </button>
          <button className="utility-toggle theme-toggle" type="button"
            aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="utility-toggle language-toggle" type="button" aria-label={t('language')} title={t('language')}
            onClick={() => setLanguage((value) => value === 'de' ? 'en' : 'de')}>
            <Languages size={14} aria-hidden="true" /><span aria-hidden="true">{language === 'de' ? '🇩🇪' : '🇬🇧'}</span><b>{language.toUpperCase()}</b>
          </button>
        </div>
      </header>

      <section className="intro" id="top">
        <div><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1></div>
        <p className="lede">{t('lede')}</p>
      </section>

      <section className={`workspace ${analysis ? 'workspace-loaded' : ''}`} aria-label={t('workspace')}>
        <article className="control-panel">
          <div className="panel-section source-section">
            <div className="section-heading">
              <div><span className="step-number">01</span><div><p className="panel-label">{t('source')}</p><h2>{t('load')}</h2></div></div>
              {analysis && <span className="success-tag"><Check size={12} /> {t('analyzed')}</span>}
            </div>
            {!analysis ? (
              <div className={`dropzone ${dragging ? 'is-dragging' : ''} ${phase === 'error' ? 'has-error' : ''}`}
                onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
                {phase === 'reading' ? (
                  <div className="loading-state" role="status"><LoaderCircle className="spin" size={34} /><h3>{t('reading')}</h3><p>{t('readingText')}</p></div>
                ) : (
                  <><span className="file-glyph" aria-hidden="true"><Upload size={20} /><b>TIF</b></span><h3>{t('drop')}</h3>
                    <p>{t('chooseLocal')}</p><button className="primary-small" type="button" onClick={() => inputRef.current?.click()}>
                      {t('choose')} <ArrowRight size={15} /></button><small>{t('noUpload')}</small></>
                )}
                <input ref={inputRef} type="file" accept=".tif,.tiff,image/tiff" hidden onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void processFile(file);
                }} />
              </div>
            ) : (
              <div className="file-card"><span className="file-card-icon"><FileText size={21} /></span><div>
                <strong title={analysis.fileName}>{analysis.fileName}</strong>
                <span>{formatBytes(analysis.fileSize, language)} · {formatNumber(analysis.width, 0, language)} × {formatNumber(analysis.height, 0, language)} px</span>
              </div><button type="button" onClick={clearFile} aria-label={t('removeFile')}><X size={16} /></button></div>
            )}
            {phase === 'error' && <div className="inline-error" role="alert"><AlertTriangle size={16} /><span>{error}</span></div>}
          </div>

          <div className={`panel-section settings-section ${!analysis ? 'is-disabled' : ''}`} aria-disabled={!analysis}>
            <div className="section-heading compact"><div><span className="step-number">02</span><div><p className="panel-label">{t('output')}</p>
              <h2>{t('configure')}</h2></div></div><span className="format-tag">P5 · 16 BIT</span></div>
            <div className="preset-card"><span><Sparkles size={16} /></span><div><strong>{t('preset')}</strong><small>{t('presetMeta')}</small></div><CheckCircle2 size={17} /></div>
            <div className="field-grid">
              <div className="field-control"><div className="field-label-row"><label htmlFor="pgm-offset">Offset</label>
                <InfoTip title={t('offsetHelpTitle')} text={t('offsetHelpText')} note={t('offsetHelpNote')} openLabel={t('openInfo')} />
              </div><div className="number-field"><input id="pgm-offset" value={offset} inputMode="decimal"
                onChange={(event) => { setOffset(event.target.value); setPgmResult(null); }} /><em>m</em></div></div>
              <div className="field-control"><div className="field-label-row"><label htmlFor="pgm-scale">{t('scale')}</label>
                <InfoTip title={t('scaleHelpTitle')} text={t('scaleHelpText')} note={t('scaleHelpNote')} openLabel={t('openInfo')} align="end" />
              </div><div className="number-field"><input id="pgm-scale" value={scale} inputMode="decimal"
                onChange={(event) => { setScale(event.target.value); setPgmResult(null); }} /><em>m</em></div></div>
            </div>
            <div className="auto-range-row"><button className="auto-range" type="button" onClick={setAutomaticRange} disabled={!analysis}>
              <SlidersHorizontal size={14} /> {t('autoRange')}</button>
              <InfoTip title={t('autoRangeHelpTitle')} text={t('autoRangeHelpText')} note={t('autoRangeHelpNote')} openLabel={t('openInfo')} />
            </div>
            <div className="select-field"><div className="field-label-row"><label htmlFor="nodata-strategy">{t('noData')}</label>
              <InfoTip title={t('noDataHelpTitle')} text={t('noDataHelpText')} note={t('noDataHelpNote')} openLabel={t('openInfo')} align="end" />
            </div><select id="nodata-strategy" value={noDataStrategy}
              onChange={(event) => { setNoDataStrategy(event.target.value as 'nearest' | 'median'); setPgmResult(null); }}>
              <option value="nearest">{t('nearest')}</option><option value="median">{t('medianFill')}</option></select></div>
            <div className="strategy-help" aria-live="polite">
              <strong>{noDataStrategy === 'nearest' ? t('nearestHelpTitle') : t('medianHelpTitle')}</strong>
              <p>{noDataStrategy === 'nearest' ? t('nearestHelpText') : t('medianHelpText')}</p>
              <small><Sparkles size={12} aria-hidden="true" /> <b>{t('recommendation')}:</b>{' '}
                {noDataStrategy === 'nearest' ? t('nearestHelpNote') : t('medianHelpNote')}</small>
              <em>{analysis && analysis.stats.noDataCount > 0
                ? fill(t('noDataDetected'), {
                  count: formatNumber(analysis.stats.noDataCount, 0, language),
                  percent: formatNumber(noDataPercent, 2, language),
                })
                : t('noDataNotDetected')}</em>
            </div>
            <div className={`range-check ${rangeFits ? 'is-valid' : 'is-invalid'}`}>
              {rangeFits ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{rangeFits ? fill(t('rangeOk'), { min: formatNumber(numericOffset, 3, language), max: formatNumber(outputMaximum, 3, language) }) : t('rangeBad')}</span>
              <InfoTip title={t('rangeHelpTitle')} text={t('rangeHelpText')} note={t('rangeHelpNote')} openLabel={t('openInfo')} align="end" />
            </div>
            <button className="export-button" type="button" disabled={!analysis || !rangeFits || generating} onClick={() => void exportPgm()}>
              {generating ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}{generating ? t('generating') : t('export')}
              {!generating && <ArrowRight size={17} />}
            </button>
            {pgmResult && <button className="download-again" type="button" onClick={() => downloadBlob(pgmResult.blob)}>
              <RefreshCw size={13} /> {t('downloadAgain')} · {formatBytes(pgmResult.blob.size, language)}</button>}
          </div>
        </article>

        <article className="map-panel">
          <div className="map-toolbar"><div><span className="panel-label">{t('spatialCheck')}</span><div className="map-title-row">
            <strong>{analysis ? t('coverage') : t('spatialPreview')}</strong>
            <InfoTip title={t('coverageHelpTitle')} text={t('coverageHelpText')} note={t('coverageHelpNote')} openLabel={t('openInfo')} />
          </div></div>
            <div className="map-toolbar-actions">{analysis?.crsCode && <span className="crs-tag">{analysis.crsCode}</span>}
              <button type="button" className="icon-text-button" onClick={() => setShowRaster((value) => !value)} disabled={!analysis}>
                {showRaster ? <Eye size={15} /> : <EyeOff size={15} />}{t('raster')}</button></div></div>
          <div className="map-wrap"><CoverageMap analysis={analysis} showRaster={showRaster} language={language} />
            {!analysis && <div className="map-empty-overlay"><span><MapPinned size={20} /></span><strong>{t('footprintReady')}</strong><small>{t('footprintText')}</small></div>}
            {phase === 'reading' && <div className="map-loading"><LoaderCircle className="spin" size={24} /> {t('preparingMap')}</div>}
            {analysis && <div className="height-scale" aria-label={t('colorScale')}><span>{formatNumber(analysis.stats.max, 2, language)} m</span><i />
              <span>{formatNumber(analysis.stats.min, 2, language)} m</span></div>}
          </div>
          <div className="map-caption"><span><i className="legend-outline" /> {t('validArea')}</span>
            {analysis?.wgs84Bbox ? <span className="bbox-caption">
              {formatCoordinate(analysis.wgs84Bbox[0], language)} → {formatCoordinate(analysis.wgs84Bbox[2], language)} E · {formatCoordinate(analysis.wgs84Bbox[1], language)} → {formatCoordinate(analysis.wgs84Bbox[3], language)} N
            </span> : <span>{t('map')}</span>}</div>
          <div className={`quick-stats ${!analysis ? 'is-placeholder' : ''}`}>
            <div><span>{t('minimum')}</span><strong>{analysis ? `${formatNumber(analysis.stats.min, 3, language)} m` : '–'}</strong></div>
            <div><span>{t('maximum')}</span><strong>{analysis ? `${formatNumber(analysis.stats.max, 3, language)} m` : '–'}</strong></div>
            <div><span>{t('mean')}</span><strong>{analysis ? `${formatNumber(analysis.stats.mean, 3, language)} m` : '–'}</strong></div>
            <div><span>{t('valid')}</span><strong>{analysis ? `${formatNumber(validPercent, 1, language)} %` : '–'}</strong></div>
          </div>
        </article>
      </section>

      <section className="analysis-section" aria-labelledby="analysis-title">
        <div className="analysis-header"><div><p className="eyebrow">{t('protocol')}</p><div className="analysis-title-row">
          <h2 id="analysis-title">{t('metadataTitle')}</h2>
          <InfoTip title={t('metadataHelpTitle')} text={t('metadataHelpText')} note={t('metadataHelpNote')} openLabel={t('openInfo')} />
        </div></div>
          <div className="tabs" role="tablist" aria-label={t('metadataView')}>
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')} type="button"><Database size={14} /> {t('overview')}</button>
            <button className={activeTab === 'geokeys' ? 'active' : ''} onClick={() => setActiveTab('geokeys')} type="button"><Braces size={14} /> GeoKeys</button>
            <button className={activeTab === 'pgm' ? 'active' : ''} onClick={() => setActiveTab('pgm')} type="button"><FileText size={14} /> {t('pgmHeader')}</button>
          </div></div>
        {activeTab === 'overview' && <div className="metadata-grid">
          <article className="metadata-card"><span className="card-icon"><Layers3 size={19} /></span><p className="panel-label">{t('raster')}</p>
            <h3>{analysis ? `${formatNumber(analysis.width, 0, language)} × ${formatNumber(analysis.height, 0, language)} ${t('pixels')}` : t('noFile')}</h3>
            <MetadataRows rows={analysis ? [[t('bands'), String(analysis.bands)], [t('dataType'), `${analysis.bitsPerSample}-Bit ${analysis.sampleFormatLabel}`],
              [t('compression'), compressionLabel ?? '–'], [t('ifdLevels'), String(analysis.imageCount)]]
              : [[t('bands'), '–'], [t('dataType'), '–'], [t('compression'), '–'], [t('ifdLevels'), '–']]} /></article>
          <article className="metadata-card accent-card"><span className="card-icon"><MapPinned size={19} /></span><p className="panel-label">{t('spatialReference')}</p>
            <h3>{analysis ? crsName : t('autoDetect')}</h3>
            <MetadataRows rows={analysis ? [['CRS', analysis.crsCode ?? t('noEpsg')], [t('rasterType'), analysis.pixelIsArea ? t('pixelArea') : t('pixelPoint')],
              [t('pixelSizeX'), analysis.resolution ? formatNumber(Math.abs(analysis.resolution[0]), 9, language) : '–'],
              [t('pixelSizeY'), analysis.resolution ? formatNumber(Math.abs(analysis.resolution[1]), 9, language) : '–']]
              : [['CRS', '–'], [t('rasterType'), '–'], [t('pixelSizeX'), '–'], [t('pixelSizeY'), '–']]} /></article>
          <article className="metadata-card dark-card"><span className="card-icon"><Ruler size={19} /></span><p className="panel-label">{t('heights')}</p>
            <h3>{analysis ? `${formatNumber(analysis.stats.max - analysis.stats.min, 3, language)} m ${t('range')}` : t('valueCheck')}</h3>
            <MetadataRows rows={analysis ? [[t('stdDev'), `${formatNumber(analysis.stats.stdDev, 3, language)} m`],
              [t('median'), `${formatNumber(analysis.stats.median, 3, language)} m`], [t('validValues'), formatNumber(analysis.stats.validCount, 0, language)],
              ['NoData', formatNumber(analysis.stats.noDataCount, 0, language)]]
              : [[t('stdDev'), '–'], [t('median'), '–'], [t('validValues'), '–'], ['NoData', '–']]} /></article>
        </div>}
        {activeTab === 'geokeys' && <div className="code-panel"><div className="code-panel-title"><Braces size={15} /><span>{t('keysTitle')}</span></div>
          <pre>{analysis ? JSON.stringify({ geoKeys: analysis.geoKeys, gdalMetadata: analysis.gdalMetadata }, null, 2) : t('keysPlaceholder')}</pre></div>}
        {activeTab === 'pgm' && <div className="pgm-tab-grid"><div className="code-panel"><div className="code-panel-title"><FileText size={15} />
          <span>{analysis ? outputFileName(analysis.fileName) : t('outputFile')}</span></div><pre>{pgmPreview}</pre></div>
          <aside className="export-report"><span className="report-icon">{pgmResult ? <CheckCircle2 size={22} /> : <Info size={22} />}</span>
            <h3>{pgmResult ? t('pgmSuccess') : t('pgmReport')}</h3>{pgmResult ? <MetadataRows rows={[
              [t('fileSize'), formatBytes(pgmResult.blob.size, language)], [t('values16'), `${pgmResult.quantizedMin} – ${pgmResult.quantizedMax}`],
              [t('noDataFilled'), formatNumber(pgmResult.filledNoDataCount, 0, language)], [t('maxQuantization'), `± ${formatNumber(pgmResult.maxQuantizationError, 6, language)} m`],
              [t('clipping'), pgmResult.clippedCount ? `${formatNumber(pgmResult.clippedCount, 0, language)} ${t('values')}` : t('none')],
            ]} /> : <p>{t('reportPlaceholder')}</p>}</aside></div>}
      </section>

      {analysis && isRegional && <section className="compatibility-note"><AlertTriangle size={20} /><div><strong>{t('compatibilityTitle')}</strong><p>{t('compatibilityText')}</p></div></section>}

      <section className="method-section" id="methodik"><div><p className="eyebrow">{t('technicalBasis')}</p><h2>{t('standardsTitle')}</h2>
        <p>{t('standardsText')} <code>height = Offset + Scale × pixel value</code> {t('standardsEnd')}</p></div>
        <div className="source-links">
          <a href="https://netpbm.sourceforge.net/doc/pgm.html" target="_blank" rel="noreferrer"><span>{t('pgmSpec')}</span><ExternalLink size={14} /></a>
          <a href="https://geographiclib.sourceforge.io/C++/doc/geoid.html#geoidformat" target="_blank" rel="noreferrer"><span>{t('geographicLib')}</span><ExternalLink size={14} /></a>
          <a href="https://gdz.bkg.bund.de/index.php/default/quasigeoid-der-bundesrepublik-deutschland-quasigeoid.html" target="_blank" rel="noreferrer"><span>BKG · GCG2016/2023</span><ExternalLink size={14} /></a>
          <a href="https://github.com/geotiffjs/geotiff.js" target="_blank" rel="noreferrer"><span>geotiff.js {t('sourceCode')}</span><ExternalLink size={14} /></a>
          <a href="https://github.com/proj4js/proj4js" target="_blank" rel="noreferrer"><span>Proj4js {t('sourceCode')}</span><ExternalLink size={14} /></a>
        </div></section>

      <footer className="site-footer">
        <div className="footer-app-card"><p className="panel-label">{t('otherApp')}</p>
          <div className="footer-app-links">
            <a href="https://www.pointcloud-manager.com" target="_blank" rel="noreferrer"><span><strong>PointCloud Manager</strong>
              <small>{t('pointCloudDescription')}</small></span><ExternalLink size={16} /></a>
            <a href="https://mradeck.github.io/gps-utm-coordinate-converter/" target="_blank" rel="noreferrer"><span><strong>GPS2UTM</strong>
              <small>{t('gpsDescription')}</small></span><ExternalLink size={16} /></a>
            <a href="https://geodata-inspector-cleaner.netlify.app/" target="_blank" rel="noreferrer"><span><strong>Geodata Inspector &amp; Cleaner</strong>
              <small>{t('geodataDescription')}</small></span><ExternalLink size={16} /></a>
          </div>
        </div>
        <div className="footer-meta"><p className="panel-label">{t('legalSupport')}</p><nav aria-label={t('legalSupport')}>
          <button type="button" onClick={openContact}><LifeBuoy size={13} /> {t('helpContact')}</button>
          <a href="https://www.multikopterschule.de/Kontakt-Impressum/IMPRESSUM/" target="_blank" rel="noreferrer"><FileText size={13} /> {t('imprint')}</a>
          <a href="https://ko-fi.com/mradeck/tip" target="_blank" rel="noreferrer"><Coffee size={13} /> {t('support')}</a>
        </nav><p>{t('privacyFooter')}</p><p>{t('copyright')}</p><span className="version-pill">{t('version')} {APP_VERSION_CODE}</span></div>
      </footer>

      <form name="geoid-forge-contact" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
        <input type="hidden" name="form-name" value="geoid-forge-contact" readOnly />
        <input name="bot-field" />
        <input name="subject" />
        <input name="category" />
        <input name="topic" />
        <input name="name" />
        <input name="email" type="email" />
        <textarea name="message" />
        <input name="version" />
        <input name="page" />
      </form>

      <div className={`contact-modal ${contactOpen ? 'is-open' : ''}`} aria-hidden={!contactOpen}
        onMouseDown={(event) => { if (event.target === event.currentTarget) closeContact(); }}>
        <section className="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-title">
          <button className="contact-close" type="button" onClick={closeContact} aria-label={t('close')}><X size={18} /></button>
          {contactStatus === 'success' ? (
            <div className="contact-success" role="status">
              <span><CheckCircle2 size={25} /></span>
              <p className="panel-label">Geoid Forge · {APP_VERSION_CODE}</p>
              <h2 id="contact-title">{t('contactSuccessTitle')}</h2>
              <p>{t('contactSuccessText')}</p>
              <button className="contact-submit" type="button" onClick={closeContact}>{t('close')}</button>
            </div>
          ) : (
            <>
              <div className="contact-heading">
                <span><Mail size={21} /></span>
                <div><p className="panel-label">Geoid Forge · {APP_VERSION_CODE}</p><h2 id="contact-title">{t('contactTitle')}</h2></div>
              </div>
              <p className="contact-intro">{t('contactIntro')}</p>
              <form ref={contactFormRef} name="geoid-forge-contact" method="POST" onSubmit={(event) => void submitContact(event)}>
                <input type="hidden" name="form-name" value="geoid-forge-contact" />
                <input type="hidden" name="subject" data-remove-prefix="true"
                  value={`Geoid Forge ${APP_VERSION_CODE} — ${contactCategory}: ${contactTopic || copy.helpContact}`} />
                <input type="hidden" name="version" value={APP_VERSION_CODE} />
                <input type="hidden" name="page" value="https://geoid-forge.netlify.app/" />
                <p className="honeypot"><label>Leave this field empty <input name="bot-field" /></label></p>
                <div className="contact-grid">
                  <label><span>{t('category')}</span><select ref={contactFirstRef} name="category" required value={contactCategory}
                    onChange={(event) => setContactCategory(event.target.value)}>
                    <option value="help">{t('categoryHelp')}</option><option value="bug">{t('categoryBug')}</option>
                    <option value="contact">{t('categoryContact')}</option></select></label>
                  <label><span>{t('name')}</span><input name="name" autoComplete="name" placeholder={t('namePlaceholder')} required /></label>
                  <label><span>{t('email')}</span><input name="email" type="email" autoComplete="email" placeholder={t('emailPlaceholder')} required /></label>
                  <label><span>{t('topic')}</span><input name="topic" placeholder={t('topicPlaceholder')} required value={contactTopic}
                    onChange={(event) => setContactTopic(event.target.value)} /></label>
                  <label className="contact-message"><span>{t('message')}</span><textarea name="message" rows={6}
                    placeholder={t('messagePlaceholder')} required /></label>
                </div>
                <div className="contact-note"><ShieldCheck size={15} /><span>{t('contactPrivacy')}</span></div>
                {contactStatus === 'error' && <div className="contact-error" role="alert"><AlertTriangle size={16} /><span>{t('contactError')}</span></div>}
                <div className="contact-actions"><span>{t('requiredHint')}</span><a href="mailto:michael.radeck@email.de"><Mail size={13} /> {t('directEmail')}</a>
                  <button className="contact-submit" type="submit" disabled={contactStatus === 'sending'}>
                    {contactStatus === 'sending' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}
                    {contactStatus === 'sending' ? t('sendingMessage') : t('sendMessage')}
                  </button></div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
