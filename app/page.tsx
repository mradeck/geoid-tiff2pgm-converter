'use client';

import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import {
  AlertTriangle,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Info,
  Layers3,
  LoaderCircle,
  MapPinned,
  RefreshCw,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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

type Phase = 'idle' | 'reading' | 'ready' | 'error';
type MetadataTab = 'overview' | 'geokeys' | 'pgm';

const formatNumber = (value: number, digits = 3) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(value);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value)} ${unit}`;
};

const formatCoordinate = (value: number) => `${formatNumber(value, 6)}°`;

function CoverageMap({ analysis, showRaster }: { analysis: RasterAnalysis | null; showRaster: boolean }) {
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
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap-Mitwirkende',
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
      L.imageOverlay(analysis.previewDataUrl, bounds, {
        opacity: 0.66,
        interactive: false,
        className: 'raster-overlay',
      }).addTo(overlays);
    }
    if (analysis.footprint) {
      L.geoJSON(analysis.footprint as never, {
        style: {
          color: '#0f4f39',
          weight: 2.4,
          opacity: 1,
          fillColor: '#8cf0bd',
          fillOpacity: showRaster ? 0.08 : 0.22,
        },
      }).addTo(overlays);
    } else {
      L.rectangle(bounds, {
        color: '#0f4f39',
        weight: 2.4,
        fillColor: '#8cf0bd',
        fillOpacity: 0.18,
      }).addTo(overlays);
    }
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 9 });
    window.setTimeout(() => map.invalidateSize(), 50);
  }, [analysis, showRaster]);

  return <div ref={containerRef} className="leaflet-map" aria-label="Interaktive Karte des GeoTIFF-Datenbereichs" />;
}

function MetadataRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="metadata-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
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

  const numericOffset = Number(offset);
  const numericScale = Number(scale);
  const outputMaximum = numericOffset + numericScale * 65_535;
  const rangeFits = Boolean(
    analysis
      && Number.isFinite(numericOffset)
      && Number.isFinite(numericScale)
      && numericScale > 0
      && analysis.stats.min >= numericOffset
      && analysis.stats.max <= outputMaximum,
  );
  const validPercent = analysis
    ? (analysis.stats.validCount / (analysis.width * analysis.height)) * 100
    : 0;
  const isRegional = Boolean(
    analysis?.wgs84Bbox
      && (analysis.wgs84Bbox[2] - analysis.wgs84Bbox[0] < 350
        || analysis.wgs84Bbox[3] - analysis.wgs84Bbox[1] < 170),
  );

  const pgmPreview = useMemo(() => {
    if (pgmResult) return pgmResult.header;
    if (!analysis) return 'Nach der Analyse erscheint hier der PGM-Dateikopf.';
    return [
      'P5',
      '# Geoid file in PGM format',
      `# Description ${analysis.fileName}`,
      `# Offset ${offset}`,
      `# Scale ${scale}`,
      `# CRS ${analysis.crsCode ?? analysis.crsName}`,
      `# BoundingBox ${analysis.bbox?.join(' ') ?? 'not_available'}`,
      `${analysis.width} ${analysis.height}`,
      '65535',
      '… Binärdaten …',
    ].join('\n');
  }, [analysis, offset, pgmResult, scale]);

  const processFile = async (file: File) => {
    if (!/\.tiff?$/i.test(file.name)) {
      setError('Bitte wähle eine Datei mit der Endung .tif oder .tiff.');
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
      setError(caught instanceof Error ? caught.message : 'Das GeoTIFF konnte nicht gelesen werden.');
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
        offset: numericOffset,
        scale: numericScale,
        noDataStrategy,
        description: analysis.fileName.replace(/\.[^.]+$/, ''),
      });
      setPgmResult(result);
      setActiveTab('pgm');
      downloadBlob(result.blob);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Die PGM-Datei konnte nicht erzeugt werden.');
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Geoid Forge Startseite">
          <span className="brand-mark" aria-hidden="true">GF</span>
          <span>
            <strong>Geoid Forge</strong>
            <small>GeoTIFF → PGM</small>
          </span>
        </a>
        <div className="topbar-actions">
          <a className="method-link" href="#methodik">Methodik</a>
          <div className="privacy-pill"><ShieldCheck size={14} /> Datei bleibt lokal</div>
        </div>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow">Geoid-Konverter & Metadaten-Analyse</p>
          <h1>Vom GeoTIFF zum einsatzbereiten Höhenmodell.</h1>
        </div>
        <p className="lede">
          Prüfe Raster, Koordinatenbezug und Abdeckung. Exportiere anschließend
          ein binäres 16-Bit-PGM für deinen RayStudio-Workflow.
        </p>
      </section>

      <section className={`workspace ${analysis ? 'workspace-loaded' : ''}`} aria-label="Konverter-Arbeitsbereich">
        <article className="control-panel">
          <div className="panel-section source-section">
            <div className="section-heading">
              <div>
                <span className="step-number">01</span>
                <div>
                  <p className="panel-label">Quelldatei</p>
                  <h2>GeoTIFF laden</h2>
                </div>
              </div>
              {analysis && <span className="success-tag"><Check size={12} /> analysiert</span>}
            </div>

            {!analysis ? (
              <div
                className={`dropzone ${dragging ? 'is-dragging' : ''} ${phase === 'error' ? 'has-error' : ''}`}
                onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {phase === 'reading' ? (
                  <div className="loading-state" role="status">
                    <LoaderCircle className="spin" size={34} />
                    <h3>Raster wird gelesen</h3>
                    <p>Metadaten, Wertebereich und Footprint werden ermittelt …</p>
                  </div>
                ) : (
                  <>
                    <span className="file-glyph" aria-hidden="true"><Upload size={20} /><b>TIF</b></span>
                    <h3>GeoTIFF hier ablegen</h3>
                    <p>oder eine lokale Datei auswählen</p>
                    <button className="primary-small" type="button" onClick={() => inputRef.current?.click()}>
                      GeoTIFF auswählen <ArrowRight size={15} />
                    </button>
                    <small>.tif oder .tiff · kein Datei-Upload</small>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".tif,.tiff,image/tiff"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void processFile(file);
                  }}
                />
              </div>
            ) : (
              <div className="file-card">
                <span className="file-card-icon"><FileText size={21} /></span>
                <div>
                  <strong title={analysis.fileName}>{analysis.fileName}</strong>
                  <span>{formatBytes(analysis.fileSize)} · {formatNumber(analysis.width, 0)} × {formatNumber(analysis.height, 0)} px</span>
                </div>
                <button type="button" onClick={clearFile} aria-label="Datei entfernen"><X size={16} /></button>
              </div>
            )}

            {phase === 'error' && (
              <div className="inline-error" role="alert"><AlertTriangle size={16} /><span>{error}</span></div>
            )}
          </div>

          <div className={`panel-section settings-section ${!analysis ? 'is-disabled' : ''}`} aria-disabled={!analysis}>
            <div className="section-heading compact">
              <div>
                <span className="step-number">02</span>
                <div>
                  <p className="panel-label">Ausgabe</p>
                  <h2>PGM konfigurieren</h2>
                </div>
              </div>
              <span className="format-tag">P5 · 16 BIT</span>
            </div>

            <div className="preset-card">
              <span><Sparkles size={16} /></span>
              <div><strong>RayStudio-Preset</strong><small>GeographicLib-Metadaten</small></div>
              <CheckCircle2 size={17} />
            </div>

            <div className="field-grid">
              <label>
                <span>Offset <Info size={12} /></span>
                <div className="number-field"><input value={offset} inputMode="decimal" onChange={(event) => { setOffset(event.target.value); setPgmResult(null); }} /><em>m</em></div>
              </label>
              <label>
                <span>Skalierung <Info size={12} /></span>
                <div className="number-field"><input value={scale} inputMode="decimal" onChange={(event) => { setScale(event.target.value); setPgmResult(null); }} /><em>m</em></div>
              </label>
            </div>

            <button className="auto-range" type="button" onClick={setAutomaticRange} disabled={!analysis}>
              <SlidersHorizontal size={14} /> Wertebereich automatisch ausnutzen
            </button>

            <label className="select-field">
              <span>NoData-Behandlung</span>
              <select value={noDataStrategy} onChange={(event) => { setNoDataStrategy(event.target.value as 'nearest' | 'median'); setPgmResult(null); }}>
                <option value="nearest">Nächsten gültigen Wert übernehmen</option>
                <option value="median">Mit Medianwert auffüllen</option>
              </select>
            </label>

            <div className={`range-check ${rangeFits ? 'is-valid' : 'is-invalid'}`}>
              {rangeFits ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>
                {rangeFits
                  ? `Ausgabebereich ${formatNumber(numericOffset, 3)} bis ${formatNumber(outputMaximum, 3)} m passt.`
                  : 'Werte liegen außerhalb des gewählten Ausgabebereichs.'}
              </span>
            </div>

            <button className="export-button" type="button" disabled={!analysis || !rangeFits || generating} onClick={() => void exportPgm()}>
              {generating ? <LoaderCircle className="spin" size={18} /> : <Download size={18} />}
              {generating ? 'PGM wird erzeugt …' : 'PGM erzeugen & laden'}
              {!generating && <ArrowRight size={17} />}
            </button>

            {pgmResult && (
              <button className="download-again" type="button" onClick={() => downloadBlob(pgmResult.blob)}>
                <RefreshCw size={13} /> Erneut laden · {formatBytes(pgmResult.blob.size)}
              </button>
            )}
          </div>
        </article>

        <article className="map-panel">
          <div className="map-toolbar">
            <div>
              <span className="panel-label">03 / Räumliche Prüfung</span>
              <strong>{analysis ? 'Abdeckung des Datensatzes' : 'Räumliche Vorschau'}</strong>
            </div>
            <div className="map-toolbar-actions">
              {analysis?.crsCode && <span className="crs-tag">{analysis.crsCode}</span>}
              <button type="button" className="icon-text-button" onClick={() => setShowRaster((value) => !value)} disabled={!analysis}>
                {showRaster ? <Eye size={15} /> : <EyeOff size={15} />}
                Raster
              </button>
            </div>
          </div>
          <div className="map-wrap">
            <CoverageMap analysis={analysis} showRaster={showRaster} />
            {!analysis && (
              <div className="map-empty-overlay">
                <span><MapPinned size={20} /></span>
                <strong>Footprint erscheint nach dem Einlesen</strong>
                <small>Rahmen und gültiger Datenbereich werden getrennt dargestellt.</small>
              </div>
            )}
            {phase === 'reading' && <div className="map-loading"><LoaderCircle className="spin" size={24} /> Karte wird vorbereitet</div>}
            {analysis && (
              <div className="height-scale" aria-label="Farbskala des Höhenrasters">
                <span>{formatNumber(analysis.stats.max, 2)} m</span>
                <i />
                <span>{formatNumber(analysis.stats.min, 2)} m</span>
              </div>
            )}
          </div>
          <div className="map-caption">
            <span><i className="legend-outline" /> gültiger Datenbereich</span>
            {analysis?.wgs84Bbox ? (
              <span className="bbox-caption">
                {formatCoordinate(analysis.wgs84Bbox[0])} → {formatCoordinate(analysis.wgs84Bbox[2])} E · {formatCoordinate(analysis.wgs84Bbox[1])} → {formatCoordinate(analysis.wgs84Bbox[3])} N
              </span>
            ) : <span>Karte: OpenStreetMap</span>}
          </div>

          <div className={`quick-stats ${!analysis ? 'is-placeholder' : ''}`}>
            <div><span>Minimum</span><strong>{analysis ? `${formatNumber(analysis.stats.min, 3)} m` : '–'}</strong></div>
            <div><span>Maximum</span><strong>{analysis ? `${formatNumber(analysis.stats.max, 3)} m` : '–'}</strong></div>
            <div><span>Mittelwert</span><strong>{analysis ? `${formatNumber(analysis.stats.mean, 3)} m` : '–'}</strong></div>
            <div><span>Gültig</span><strong>{analysis ? `${formatNumber(validPercent, 1)} %` : '–'}</strong></div>
          </div>
        </article>
      </section>

      <section className="analysis-section" aria-labelledby="analysis-title">
        <div className="analysis-header">
          <div>
            <p className="eyebrow">Datensatz-Protokoll</p>
            <h2 id="analysis-title">Metadaten auf einen Blick.</h2>
          </div>
          <div className="tabs" role="tablist" aria-label="Metadatenansicht">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')} type="button"><Database size={14} /> Übersicht</button>
            <button className={activeTab === 'geokeys' ? 'active' : ''} onClick={() => setActiveTab('geokeys')} type="button"><Braces size={14} /> GeoKeys</button>
            <button className={activeTab === 'pgm' ? 'active' : ''} onClick={() => setActiveTab('pgm')} type="button"><FileText size={14} /> PGM-Kopf</button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="metadata-grid">
            <article className="metadata-card">
              <span className="card-icon"><Layers3 size={19} /></span>
              <p className="panel-label">Raster</p>
              <h3>{analysis ? `${formatNumber(analysis.width, 0)} × ${formatNumber(analysis.height, 0)} Pixel` : 'Noch keine Datei'}</h3>
              <MetadataRows rows={analysis ? [
                ['Bänder', String(analysis.bands)],
                ['Datentyp', `${analysis.bitsPerSample}-Bit ${analysis.sampleFormatLabel}`],
                ['Kompression', analysis.compressionLabel],
                ['IFD-Ebenen', String(analysis.imageCount)],
              ] : [['Bänder', '–'], ['Datentyp', '–'], ['Kompression', '–'], ['IFD-Ebenen', '–']]} />
            </article>

            <article className="metadata-card accent-card">
              <span className="card-icon"><MapPinned size={19} /></span>
              <p className="panel-label">Raumbezug</p>
              <h3>{analysis ? analysis.crsName : 'Wird automatisch erkannt'}</h3>
              <MetadataRows rows={analysis ? [
                ['CRS', analysis.crsCode ?? 'Kein EPSG-Code'],
                ['Rasterbezug', analysis.pixelIsArea ? 'Pixel = Fläche' : 'Pixel = Punkt'],
                ['Pixelgröße X', analysis.resolution ? formatNumber(Math.abs(analysis.resolution[0]), 9) : '–'],
                ['Pixelgröße Y', analysis.resolution ? formatNumber(Math.abs(analysis.resolution[1]), 9) : '–'],
              ] : [['CRS', '–'], ['Rasterbezug', '–'], ['Pixelgröße X', '–'], ['Pixelgröße Y', '–']]} />
            </article>

            <article className="metadata-card dark-card">
              <span className="card-icon"><Ruler size={19} /></span>
              <p className="panel-label">Höhenwerte</p>
              <h3>{analysis ? `${formatNumber(analysis.stats.max - analysis.stats.min, 3)} m Spannweite` : 'Werteprüfung'}</h3>
              <MetadataRows rows={analysis ? [
                ['Standardabw.', `${formatNumber(analysis.stats.stdDev, 3)} m`],
                ['Median', `${formatNumber(analysis.stats.median, 3)} m`],
                ['Gültige Werte', formatNumber(analysis.stats.validCount, 0)],
                ['NoData', formatNumber(analysis.stats.noDataCount, 0)],
              ] : [['Standardabw.', '–'], ['Median', '–'], ['Gültige Werte', '–'], ['NoData', '–']]} />
            </article>
          </div>
        )}

        {activeTab === 'geokeys' && (
          <div className="code-panel">
            <div className="code-panel-title"><Braces size={15} /><span>GeoTIFF-Schlüssel & GDAL-Metadaten</span></div>
            <pre>{analysis ? JSON.stringify({ geoKeys: analysis.geoKeys, gdalMetadata: analysis.gdalMetadata }, null, 2) : '// Nach dem Einlesen werden die eingebetteten Metadaten hier vollständig angezeigt.'}</pre>
          </div>
        )}

        {activeTab === 'pgm' && (
          <div className="pgm-tab-grid">
            <div className="code-panel">
              <div className="code-panel-title"><FileText size={15} /><span>{analysis ? outputFileName(analysis.fileName) : 'ausgabe.pgm'}</span></div>
              <pre>{pgmPreview}</pre>
            </div>
            <aside className="export-report">
              <span className="report-icon">{pgmResult ? <CheckCircle2 size={22} /> : <Info size={22} />}</span>
              <h3>{pgmResult ? 'PGM erfolgreich erzeugt' : 'PGM-Prüfbericht'}</h3>
              {pgmResult ? (
                <MetadataRows rows={[
                  ['Dateigröße', formatBytes(pgmResult.blob.size)],
                  ['16-Bit-Werte', `${pgmResult.quantizedMin} – ${pgmResult.quantizedMax}`],
                  ['NoData gefüllt', formatNumber(pgmResult.filledNoDataCount, 0)],
                  ['Max. Quantisierung', `± ${formatNumber(pgmResult.maxQuantizationError, 6)} m`],
                  ['Clipping', pgmResult.clippedCount ? `${formatNumber(pgmResult.clippedCount, 0)} Werte` : 'keines'],
                ]} />
              ) : <p>Nach dem Export siehst du hier Dateigröße, Quantisierung, NoData-Füllung und mögliches Clipping.</p>}
            </aside>
          </div>
        )}
      </section>

      {analysis && isRegional && (
        <section className="compatibility-note">
          <AlertTriangle size={20} />
          <div>
            <strong>Wichtiger RayStudio-Hinweis für regionale Modelle</strong>
            <p>
              Das exportierte PGM ist formal Netpbm-konform und enthält Offset, Scale, CRS und BoundingBox als Kommentare.
              GeographicLib selbst interpretiert seine Geoid-PGM jedoch als weltweites Raster. Da RayStudio das genaue
              regionale PGM-Schema öffentlich nicht beschreibt, prüfe den Import einmal an einem bekannten Kontrollpunkt.
            </p>
          </div>
        </section>
      )}

      <section className="method-section" id="methodik">
        <div>
          <p className="eyebrow">Technische Basis</p>
          <h2>Auf Standards gebaut, nicht auf Dateitricks.</h2>
          <p>
            Die Konvertierung folgt dem binären P5-Format. Höhen werden linear als
            <code> Höhe = Offset + Scale × Pixelwert </code> codiert; 16-Bit-Werte werden Big-Endian geschrieben.
          </p>
        </div>
        <div className="source-links">
          <a href="https://netpbm.sourceforge.net/doc/pgm.html" target="_blank" rel="noreferrer"><span>PGM-Spezifikation</span><ExternalLink size={14} /></a>
          <a href="https://geographiclib.sourceforge.io/C++/doc/geoid.html#geoidformat" target="_blank" rel="noreferrer"><span>GeographicLib Geoid-Format</span><ExternalLink size={14} /></a>
          <a href="https://gdz.bkg.bund.de/index.php/default/quasigeoid-der-bundesrepublik-deutschland-quasigeoid.html" target="_blank" rel="noreferrer"><span>BKG · GCG2016/2023</span><ExternalLink size={14} /></a>
          <a href="https://github.com/geotiffjs/geotiff.js" target="_blank" rel="noreferrer"><span>geotiff.js Quellcode</span><ExternalLink size={14} /></a>
          <a href="https://github.com/proj4js/proj4js" target="_blank" rel="noreferrer"><span>Proj4js Quellcode</span><ExternalLink size={14} /></a>
        </div>
      </section>

      <footer>
        <span>Geoid Forge</span>
        <p>Rohdaten werden nicht hochgeladen. Kartenkacheln werden von OpenStreetMap geladen.</p>
      </footer>
    </main>
  );
}
