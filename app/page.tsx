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
  LoaderCircle,
  MapPinned,
  Moon,
  RefreshCw,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { DragEvent, useEffect, useMemo, useRef, useState } from 'react';
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
    eyebrow: 'Geoid-Konverter & Metadaten-Analyse', title: 'Vom GeoTIFF zum einsatzbereiten Höhenmodell.',
    lede: 'Prüfe Raster, Koordinatenbezug und Abdeckung. Exportiere anschließend ein binäres 16-Bit-PGM für deinen RayStudio-Workflow.',
    workspace: 'Konverter-Arbeitsbereich', source: 'Quelldatei', load: 'GeoTIFF laden', analyzed: 'analysiert',
    reading: 'Raster wird gelesen', readingText: 'Metadaten, Wertebereich und Footprint werden ermittelt …',
    drop: 'GeoTIFF hier ablegen', chooseLocal: 'oder eine lokale Datei auswählen', choose: 'GeoTIFF auswählen',
    noUpload: '.tif oder .tiff · kein Datei-Upload', removeFile: 'Datei entfernen', output: 'Ausgabe', configure: 'PGM konfigurieren',
    preset: 'RayStudio-Preset', presetMeta: 'GeographicLib-Metadaten', scale: 'Skalierung',
    autoRange: 'Wertebereich automatisch ausnutzen', noData: 'NoData-Behandlung', nearest: 'Nächsten gültigen Wert übernehmen',
    medianFill: 'Mit Medianwert auffüllen', rangeOk: 'Ausgabebereich {min} bis {max} m passt.',
    rangeBad: 'Werte liegen außerhalb des gewählten Ausgabebereichs.', generating: 'PGM wird erzeugt …',
    export: 'PGM erzeugen & laden', downloadAgain: 'Erneut laden', spatialCheck: '03 / Räumliche Prüfung',
    coverage: 'Abdeckung des Datensatzes', spatialPreview: 'Räumliche Vorschau', raster: 'Raster',
    footprintReady: 'Footprint erscheint nach dem Einlesen', footprintText: 'Rahmen und gültiger Datenbereich werden getrennt dargestellt.',
    preparingMap: 'Karte wird vorbereitet', colorScale: 'Farbskala des Höhenrasters', validArea: 'gültiger Datenbereich',
    map: 'Karte: OpenStreetMap', minimum: 'Minimum', maximum: 'Maximum', mean: 'Mittelwert', valid: 'Gültig',
    protocol: 'Datensatz-Protokoll', metadataTitle: 'Metadaten auf einen Blick.', metadataView: 'Metadatenansicht',
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
    imprint: 'Impressum', support: 'Ko-fi',
    privacyFooter: 'Rohdaten werden nicht hochgeladen. Kartenkacheln werden von OpenStreetMap geladen.',
    copyright: '© 2026 Michael Radeck. Alle Rechte vorbehalten.', version: 'Version',
    pgmEmpty: 'Nach der Analyse erscheint hier der PGM-Dateikopf.', binaryData: '… Binärdaten …',
  },
  en: {
    home: 'Geoid Forge home', method: 'Method', local: 'File stays local', darkMode: 'Enable dark interface',
    lightMode: 'Enable light interface', language: 'Switch language', eyebrow: 'Geoid converter & metadata analysis',
    title: 'From GeoTIFF to a ready-to-use elevation model.',
    lede: 'Inspect raster data, spatial reference and coverage, then export a binary 16-bit PGM for your RayStudio workflow.',
    workspace: 'Converter workspace', source: 'Source file', load: 'Load GeoTIFF', analyzed: 'analyzed',
    reading: 'Reading raster', readingText: 'Inspecting metadata, value range and footprint …', drop: 'Drop GeoTIFF here',
    chooseLocal: 'or choose a local file', choose: 'Choose GeoTIFF', noUpload: '.tif or .tiff · no file upload',
    removeFile: 'Remove file', output: 'Output', configure: 'Configure PGM', preset: 'RayStudio preset',
    presetMeta: 'GeographicLib metadata', scale: 'Scale', autoRange: 'Use the full value range automatically',
    noData: 'NoData handling', nearest: 'Use nearest valid value', medianFill: 'Fill with median value',
    rangeOk: 'Output range {min} to {max} m fits.', rangeBad: 'Values fall outside the selected output range.',
    generating: 'Generating PGM …', export: 'Generate & download PGM', downloadAgain: 'Download again',
    spatialCheck: '03 / Spatial check', coverage: 'Dataset coverage', spatialPreview: 'Spatial preview', raster: 'Raster',
    footprintReady: 'Footprint appears after reading', footprintText: 'Extent and valid data area are shown separately.',
    preparingMap: 'Preparing map', colorScale: 'Elevation raster color scale', validArea: 'valid data area',
    map: 'Map: OpenStreetMap', minimum: 'Minimum', maximum: 'Maximum', mean: 'Mean', valid: 'Valid',
    protocol: 'Dataset record', metadataTitle: 'Metadata at a glance.', metadataView: 'Metadata view', overview: 'Overview',
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
    imprint: 'Legal notice', support: 'Ko-fi',
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

  const numericOffset = Number(offset);
  const numericScale = Number(scale);
  const outputMaximum = numericOffset + numericScale * 65_535;
  const rangeFits = Boolean(analysis && Number.isFinite(numericOffset) && Number.isFinite(numericScale) && numericScale > 0
    && analysis.stats.min >= numericOffset && analysis.stats.max <= outputMaximum);
  const validPercent = analysis ? (analysis.stats.validCount / (analysis.width * analysis.height)) * 100 : 0;
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
              <label><span>Offset <Info size={12} /></span><div className="number-field"><input value={offset} inputMode="decimal"
                onChange={(event) => { setOffset(event.target.value); setPgmResult(null); }} /><em>m</em></div></label>
              <label><span>{t('scale')} <Info size={12} /></span><div className="number-field"><input value={scale} inputMode="decimal"
                onChange={(event) => { setScale(event.target.value); setPgmResult(null); }} /><em>m</em></div></label>
            </div>
            <button className="auto-range" type="button" onClick={setAutomaticRange} disabled={!analysis}><SlidersHorizontal size={14} /> {t('autoRange')}</button>
            <label className="select-field"><span>{t('noData')}</span><select value={noDataStrategy}
              onChange={(event) => { setNoDataStrategy(event.target.value as 'nearest' | 'median'); setPgmResult(null); }}>
              <option value="nearest">{t('nearest')}</option><option value="median">{t('medianFill')}</option></select></label>
            <div className={`range-check ${rangeFits ? 'is-valid' : 'is-invalid'}`}>
              {rangeFits ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{rangeFits ? fill(t('rangeOk'), { min: formatNumber(numericOffset, 3, language), max: formatNumber(outputMaximum, 3, language) }) : t('rangeBad')}</span>
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
          <div className="map-toolbar"><div><span className="panel-label">{t('spatialCheck')}</span><strong>{analysis ? t('coverage') : t('spatialPreview')}</strong></div>
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
        <div className="analysis-header"><div><p className="eyebrow">{t('protocol')}</p><h2 id="analysis-title">{t('metadataTitle')}</h2></div>
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
          <a href="https://www.multikopterschule.de/Kontakt-Impressum/IMPRESSUM/" target="_blank" rel="noreferrer"><FileText size={13} /> {t('imprint')}</a>
          <a href="https://ko-fi.com/mradeck/tip" target="_blank" rel="noreferrer"><Coffee size={13} /> {t('support')}</a>
        </nav><p>{t('privacyFooter')}</p><p>{t('copyright')}</p><span className="version-pill">{t('version')} {APP_VERSION_CODE}</span></div>
      </footer>
    </main>
  );
}
