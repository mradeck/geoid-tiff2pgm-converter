import type { ImageFileDirectory, TypedArray } from 'geotiff';
import type { GeoKeys } from 'geotiff-geokeys-to-proj4';

export type Position = [number, number];

export interface RasterStats {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  median: number;
  validCount: number;
  noDataCount: number;
}

export interface FootprintGeometry {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export interface RasterAnalysis {
  fileName: string;
  fileSize: number;
  imageCount: number;
  width: number;
  height: number;
  bands: number;
  bitsPerSample: number;
  sampleFormat: number;
  sampleFormatLabel: string;
  compression: number;
  compressionLabel: string;
  photometric: number;
  pixelIsArea: boolean;
  origin: [number, number] | null;
  resolution: [number, number] | null;
  bbox: [number, number, number, number] | null;
  wgs84Bbox: [number, number, number, number] | null;
  footprint: FootprintGeometry | null;
  crsCode: string | null;
  crsName: string;
  geoKeys: Record<string, unknown>;
  gdalMetadata: Record<string, unknown>;
  noDataValue: number | null;
  stats: RasterStats;
  raster: TypedArray;
  previewDataUrl: string | null;
  projectionWarnings: string[];
}

export interface PgmOptions {
  offset: number;
  scale: number;
  noDataStrategy: 'nearest' | 'median';
  description: string;
}

export interface PgmResult {
  blob: Blob;
  quantizedMin: number;
  quantizedMax: number;
  clippedCount: number;
  filledNoDataCount: number;
  maxQuantizationError: number;
  header: string;
}

const compressionNames: Record<number, string> = {
  1: 'Unkomprimiert',
  5: 'LZW',
  7: 'JPEG',
  8: 'Deflate',
  32773: 'PackBits',
  32946: 'Deflate',
  34887: 'LERC',
  50000: 'Zstandard',
};

const sampleFormatNames: Record<number, string> = {
  1: 'Unsigned Integer',
  2: 'Signed Integer',
  3: 'IEEE Float',
};

function getTag(directory: ImageFileDirectory, name: string) {
  try {
    return directory.getValue(name as never) as number | number[] | string | undefined;
  } catch {
    return undefined;
  }
}

function isValid(value: number, noDataValue: number | null) {
  if (!Number.isFinite(value)) return false;
  return noDataValue === null || !Number.isFinite(noDataValue) || value !== noDataValue;
}

function calculateStats(values: TypedArray, noDataValue: number | null): RasterStats {
  let min = Infinity;
  let max = -Infinity;
  let mean = 0;
  let m2 = 0;
  let validCount = 0;
  let noDataCount = 0;
  const sample: number[] = [];
  const sampleStep = Math.max(1, Math.floor(values.length / 50_000));

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!isValid(value, noDataValue)) {
      noDataCount += 1;
      continue;
    }

    validCount += 1;
    min = Math.min(min, value);
    max = Math.max(max, value);
    const delta = value - mean;
    mean += delta / validCount;
    m2 += delta * (value - mean);
    if (index % sampleStep === 0) sample.push(value);
  }

  if (validCount === 0) {
    throw new Error('Das erste Rasterband enthält keine gültigen numerischen Werte.');
  }

  sample.sort((a, b) => a - b);
  const middle = Math.floor(sample.length / 2);
  const median = sample.length % 2
    ? sample[middle]
    : (sample[middle - 1] + sample[middle]) / 2;

  return {
    min,
    max,
    mean,
    stdDev: Math.sqrt(m2 / validCount),
    median,
    validCount,
    noDataCount,
  };
}

async function makeTransformer(geoKeys: Record<string, unknown>) {
  const warnings: string[] = [];

  try {
    const [{ toProj4 }, { default: proj4 }] = await Promise.all([
      import('geotiff-geokeys-to-proj4'),
      import('proj4'),
    ]);
    const projection = toProj4(geoKeys as GeoKeys);
    Object.values(projection.errors).forEach((warning) => {
      if (warning) warnings.push(String(warning));
    });
    const transform = proj4(projection.proj4, 'WGS84');

    return {
      warnings,
      transform: (x: number, y: number): Position => {
        const converted = projection.convertCoordinates({ x, y });
        const point = transform.forward([converted.x, converted.y]);
        return [Number(point[0]), Number(point[1])];
      },
    };
  } catch (error) {
    const modelType = Number(geoKeys.GTModelTypeGeoKey);
    if (modelType === 2) {
      warnings.push('Die Koordinaten werden als geografische Längen-/Breitengrade interpretiert.');
      return { warnings, transform: (x: number, y: number): Position => [x, y] };
    }
    warnings.push(error instanceof Error ? error.message : 'Unbekanntes Koordinatensystem');
    return { warnings, transform: null };
  }
}

async function makeFootprint(
  values: TypedArray,
  width: number,
  height: number,
  noDataValue: number | null,
  bbox: [number, number, number, number],
  transform: (x: number, y: number) => Position,
): Promise<FootprintGeometry | null> {
  const { contours } = await import('d3-contour');
  const longestSide = 360;
  const factor = Math.min(1, longestSide / Math.max(width, height));
  const maskWidth = Math.max(2, Math.round(width * factor));
  const maskHeight = Math.max(2, Math.round(height * factor));
  const mask = new Uint8Array(maskWidth * maskHeight);

  for (let row = 0; row < height; row += 1) {
    const maskY = Math.min(maskHeight - 1, Math.floor((row * maskHeight) / height));
    for (let column = 0; column < width; column += 1) {
      const index = row * width + column;
      if (!isValid(values[index], noDataValue)) continue;
      const maskX = Math.min(maskWidth - 1, Math.floor((column * maskWidth) / width));
      mask[maskY * maskWidth + maskX] = 1;
    }
  }

  const outline = contours().size([maskWidth, maskHeight]).thresholds([0.5])(Array.from(mask))[0];
  if (!outline) return null;

  const [minX, minY, maxX, maxY] = bbox;
  const coordinates = outline.coordinates.map((polygon) =>
    polygon.map((ring) => {
      const stride = Math.max(1, Math.floor(ring.length / 900));
      const points = ring
        .filter((_, index) => index % stride === 0 || index === ring.length - 1)
        .map(([pixelX, pixelY]) => {
          const x = minX + (pixelX / maskWidth) * (maxX - minX);
          const y = maxY - (pixelY / maskHeight) * (maxY - minY);
          return transform(x, y);
        });
      if (points.length && (points[0][0] !== points.at(-1)?.[0] || points[0][1] !== points.at(-1)?.[1])) {
        points.push(points[0]);
      }
      return points;
    }),
  );

  return { type: 'MultiPolygon', coordinates };
}

function makePreview(
  values: TypedArray,
  width: number,
  height: number,
  noDataValue: number | null,
  min: number,
  max: number,
) {
  if (typeof document === 'undefined') return null;
  const longestSide = 900;
  const factor = Math.min(1, longestSide / Math.max(width, height));
  const previewWidth = Math.max(1, Math.round(width * factor));
  const previewHeight = Math.max(1, Math.round(height * factor));
  const canvas = document.createElement('canvas');
  canvas.width = previewWidth;
  canvas.height = previewHeight;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(previewWidth, previewHeight);
  const range = max - min || 1;

  const mix = (a: number, b: number, amount: number) => Math.round(a + (b - a) * amount);

  for (let y = 0; y < previewHeight; y += 1) {
    const sourceY = Math.min(height - 1, Math.floor((y * height) / previewHeight));
    for (let x = 0; x < previewWidth; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor((x * width) / previewWidth));
      const value = values[sourceY * width + sourceX];
      const outputIndex = (y * previewWidth + x) * 4;
      if (!isValid(value, noDataValue)) {
        image.data[outputIndex + 3] = 0;
        continue;
      }

      const t = Math.max(0, Math.min(1, (value - min) / range));
      const first = t < 0.52;
      const local = first ? t / 0.52 : (t - 0.52) / 0.48;
      const start = first ? [23, 79, 60] : [103, 203, 151];
      const end = first ? [103, 203, 151] : [204, 243, 63];
      image.data[outputIndex] = mix(start[0], end[0], local);
      image.data[outputIndex + 1] = mix(start[1], end[1], local);
      image.data[outputIndex + 2] = mix(start[2], end[2], local);
      image.data[outputIndex + 3] = 178;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function inferCrs(geoKeys: Record<string, unknown>) {
  const projected = Number(geoKeys.ProjectedCSTypeGeoKey);
  const geographic = Number(geoKeys.GeographicTypeGeoKey);
  const code = Number.isFinite(projected) && projected > 0 && projected !== 32767
    ? projected
    : Number.isFinite(geographic) && geographic > 0 && geographic !== 32767
      ? geographic
      : null;
  const name = String(
    geoKeys.PCSCitationGeoKey
      ?? geoKeys.GeogCitationGeoKey
      ?? geoKeys.GTCitationGeoKey
      ?? (code ? `EPSG:${code}` : 'Nicht ausgewiesen'),
  ).replace(/\|+$/g, '');
  return { crsCode: code ? `EPSG:${code}` : null, crsName: name };
}

export async function analyzeGeoTiff(file: File): Promise<RasterAnalysis> {
  const { fromBlob } = await import('geotiff');
  const tiff = await fromBlob(file);
  const imageCount = await tiff.getImageCount();
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();

  if (width * height > 150_000_000) {
    throw new Error('Das Raster ist für die Browser-Verarbeitung zu groß (mehr als 150 Mio. Pixel).');
  }
  if (image.getSamplesPerPixel() < 1) {
    throw new Error('Das GeoTIFF enthält kein lesbares Rasterband.');
  }

  const rasterBands = await image.readRasters({ samples: [0], interleave: false });
  const raster = rasterBands[0];
  const noDataValue = image.getGDALNoData();
  const stats = calculateStats(raster, noDataValue);
  const geoKeys = (image.getGeoKeys() ?? {}) as Record<string, unknown>;
  const directory = image.getFileDirectory();
  const gdalMetadata = (await image.getGDALMetadata()) ?? {};

  let origin: [number, number] | null = null;
  let resolution: [number, number] | null = null;
  let bbox: [number, number, number, number] | null = null;
  try {
    const rawOrigin = image.getOrigin();
    const rawResolution = image.getResolution();
    const rawBbox = image.getBoundingBox();
    origin = [rawOrigin[0], rawOrigin[1]];
    resolution = [rawResolution[0], rawResolution[1]];
    bbox = [rawBbox[0], rawBbox[1], rawBbox[2], rawBbox[3]];
  } catch {
    // Some TIFFs are rasters without georeferencing. The analyzer can still convert them.
  }

  const { warnings, transform } = await makeTransformer(geoKeys);
  let wgs84Bbox: [number, number, number, number] | null = null;
  let footprint: FootprintGeometry | null = null;

  if (bbox && transform) {
    const corners = [
      transform(bbox[0], bbox[1]),
      transform(bbox[0], bbox[3]),
      transform(bbox[2], bbox[1]),
      transform(bbox[2], bbox[3]),
    ];
    const longitudes = corners.map((point) => point[0]);
    const latitudes = corners.map((point) => point[1]);
    wgs84Bbox = [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
    footprint = await makeFootprint(raster, width, height, noDataValue, bbox, transform);
  }

  const bitsPerSample = image.getBitsPerSample(0);
  const sampleFormat = image.getSampleFormat(0);
  const compression = Number(getTag(directory, 'Compression') ?? 1);
  const photometric = Number(getTag(directory, 'PhotometricInterpretation') ?? 1);
  const { crsCode, crsName } = inferCrs(geoKeys);

  return {
    fileName: file.name,
    fileSize: file.size,
    imageCount,
    width,
    height,
    bands: image.getSamplesPerPixel(),
    bitsPerSample,
    sampleFormat,
    sampleFormatLabel: sampleFormatNames[sampleFormat] ?? `Code ${sampleFormat}`,
    compression,
    compressionLabel: compressionNames[compression] ?? `TIFF-Code ${compression}`,
    photometric,
    pixelIsArea: image.pixelIsArea(),
    origin,
    resolution,
    bbox,
    wgs84Bbox,
    footprint,
    crsCode,
    crsName,
    geoKeys,
    gdalMetadata,
    noDataValue,
    stats,
    raster,
    previewDataUrl: makePreview(raster, width, height, noDataValue, stats.min, stats.max),
    projectionWarnings: warnings,
  };
}

function fillNearest(values: TypedArray, width: number, height: number, noDataValue: number | null) {
  const filled = new Float64Array(values.length);
  const visited = new Uint8Array(values.length);
  const queue = new Int32Array(values.length);
  let tail = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!isValid(value, noDataValue)) continue;
    filled[index] = value;
    visited[index] = 1;
    queue[tail++] = index;
  }

  let head = 0;
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const neighbors = [index - width, index + width];
    if (x > 0) neighbors.push(index - 1);
    if (x < width - 1) neighbors.push(index + 1);

    for (const neighbor of neighbors) {
      if (neighbor < 0 || neighbor >= values.length || visited[neighbor]) continue;
      visited[neighbor] = 1;
      filled[neighbor] = filled[index];
      queue[tail++] = neighbor;
    }
  }

  return filled;
}

function formatHeaderNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toPrecision(12).replace(/0+$/g, '').replace(/\.$/, '');
}

export function createPgm(analysis: RasterAnalysis, options: PgmOptions): PgmResult {
  if (!Number.isFinite(options.offset)) throw new Error('Der Offset muss eine gültige Zahl sein.');
  if (!Number.isFinite(options.scale) || options.scale <= 0) throw new Error('Die Skalierung muss größer als null sein.');

  const { raster, width, height, stats, noDataValue } = analysis;
  const filled = stats.noDataCount > 0 && options.noDataStrategy === 'nearest'
    ? fillNearest(raster, width, height, noDataValue)
    : null;
  const fallback = stats.median;
  const output = new Uint8Array(raster.length * 2);
  const dataView = new DataView(output.buffer);
  let clippedCount = 0;
  let quantizedMin = 65_535;
  let quantizedMax = 0;

  for (let index = 0; index < raster.length; index += 1) {
    let value = raster[index];
    if (!isValid(value, noDataValue)) value = filled ? filled[index] : fallback;
    const unbounded = Math.round((value - options.offset) / options.scale);
    const quantized = Math.max(0, Math.min(65_535, unbounded));
    if (quantized !== unbounded) clippedCount += 1;
    quantizedMin = Math.min(quantizedMin, quantized);
    quantizedMax = Math.max(quantizedMax, quantized);
    dataView.setUint16(index * 2, quantized, false);
  }

  const bbox = analysis.bbox?.map(formatHeaderNumber).join(' ') ?? 'not_available';
  const resolution = analysis.resolution?.map(formatHeaderNumber).join(' ') ?? 'not_available';
  const crs = analysis.crsCode ? `${analysis.crsCode} (${analysis.crsName})` : analysis.crsName;
  const header = [
    'P5',
    '# Geoid file in PGM format',
    `# Description ${options.description.replace(/[\r\n]+/g, ' ').trim() || analysis.fileName}`,
    `# DateTime ${new Date().toISOString()}`,
    `# Offset ${formatHeaderNumber(options.offset)}`,
    `# Scale ${formatHeaderNumber(options.scale)}`,
    `# CRS ${crs}`,
    `# BoundingBox ${bbox}`,
    `# PixelSize ${resolution}`,
    `# AREA_OR_POINT ${analysis.pixelIsArea ? 'Area' : 'Point'}`,
    `# NoDataFill ${options.noDataStrategy === 'nearest' ? 'nearest-valid' : 'median'}`,
    `# Source ${analysis.fileName.replace(/[\r\n]+/g, ' ')}`,
    `${width} ${height}`,
    '65535',
    '',
  ].join('\n');
  const headerBytes = new TextEncoder().encode(header);

  return {
    blob: new Blob([headerBytes, output], { type: 'image/x-portable-graymap' }),
    quantizedMin,
    quantizedMax,
    clippedCount,
    filledNoDataCount: stats.noDataCount,
    maxQuantizationError: options.scale / 2,
    header,
  };
}

export function outputFileName(input: string) {
  return `${input.replace(/\.(geo)?tiff?$/i, '') || 'geoid'}.pgm`;
}
