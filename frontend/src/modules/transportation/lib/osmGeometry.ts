/**
 * REAL GEOMETRY LOADER
 *
 * Loads the OpenStreetMap geometry produced by scripts/fetch-osm-geometry.mjs
 * and converts it into the RoadSegment shape the map already renders.
 *
 * The SHAPE of every road is real. The traffic figures on top of it are
 * simulated - this is a digital twin, not a live sensor feed. Label it that way
 * in the UI and the demo, because it is the honest description.
 *
 * If the geometry files haven't been generated, everything here returns null and
 * the map keeps using its built-in road data. Nothing breaks.
 */

import type { RoadSegment, RoadType } from '../transportationTypes';

export interface OsmStation {
  id: string;
  name: string;
  coordinates: [number, number];
  isInterchange: boolean;
  operator: string | null;
}

export interface OsmMetroLine {
  id: string;
  name: string;
  ref: string;
  color: string | null;
  segments: [number, number][][];
}

export interface OsmGeometry {
  city: string;
  generatedAt: string;
  attribution: string;
  roads: {
    id: string;
    name: string;
    code: string;
    roadType: RoadType;
    lanes: number | null;
    maxspeed: string | null;
    coordinates: [number, number][];
  }[];
  metroLines: OsmMetroLine[];
  stations: OsmStation[];
}

/**
 * Deterministic pseudo-random from a string seed.
 * Using the road's OSM id as the seed means a given road always gets the same
 * traffic figures - so the map doesn't flicker between renders, and the same
 * road looks the same every time you demo it.
 */
function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // map to 0..1
  return ((h >>> 0) % 100000) / 100000;
}

/** Free-flow speed by road class, used as the baseline for simulated traffic. */
const BASE_SPEED: Record<RoadType, number> = {
  Highway: 80,
  Primary: 55,
  Secondary: 45,
  Residential: 30,
  Emergency: 60,
  'Bus Route': 40,
  Construction: 25,
};

/**
 * Attach simulated traffic metrics to real geometry.
 * `hour` and `congestionBias` let the timeline scrubber and scenario modes
 * influence the result, exactly as they do for the built-in road data.
 */
export function osmRoadsToSegments(
  geo: OsmGeometry,
  opts: { hour: number; congestionBias: number; speedDrop: number },
): RoadSegment[] {
  const { hour, congestionBias, speedDrop } = opts;

  const isMorningPeak = hour >= 8.0 && hour <= 9.5;
  const isEveningPeak = hour >= 17.5 && hour <= 19.5;
  const peakFactor = isMorningPeak ? 1.35 : isEveningPeak ? 1.45 : 1.0;

  return geo.roads.map((r) => {
    const rnd = seededRandom(r.id);
    const type = (r.roadType || 'Primary') as RoadType;
    const base = BASE_SPEED[type] ?? 50;

    // Baseline congestion varies per road but is stable across renders.
    const baseCongestion = 18 + Math.round(rnd * 45);
    const congestionIndex = Math.min(
      100,
      Math.round(baseCongestion * peakFactor + congestionBias),
    );

    const currentSpeed = Math.max(
      2,
      Math.round((base * (1 - congestionIndex / 140)) - speedDrop),
    );

    const normalTravelTime = Math.max(1, Math.round(r.coordinates.length * 0.4));

    return {
      id: r.id,
      name: r.name,
      code: r.code || r.name.slice(0, 6).toUpperCase(),
      district: '',
      roadType: type,
      coordinates: r.coordinates,
      currentSpeed,
      avgSpeed: base,
      congestionIndex,
      vehicleCount: 400 + Math.round(rnd * 3200),
      travelTime: Math.round(normalTravelTime * (1 + congestionIndex / 60)),
      normalTravelTime,
      density:
        congestionIndex > 75 ? 'Heavy' : congestionIndex > 45 ? 'Moderate' : 'Light',
    } as RoadSegment;
  });
}

/**
 * Fetch geometry for a city. Returns null when it hasn't been generated,
 * which the caller should treat as "use the built-in data".
 */
export async function loadOsmGeometry(cityId: string): Promise<OsmGeometry | null> {
  try {
    const res = await fetch(`/api/geometry?city=${cityId}`);
    if (res.status === 404) {
      console.info(
        `[geometry] No OSM data for ${cityId}. Using built-in roads. ` +
          `Generate it with: node scripts/fetch-osm-geometry.mjs ${cityId}`,
      );
      return null;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const geo = (await res.json()) as OsmGeometry;
    console.log(
      `[geometry] Loaded REAL OSM data for ${cityId}: ` +
        `${geo.roads.length} roads, ${geo.metroLines.length} metro lines, ` +
        `${geo.stations.length} stations`,
    );
    return geo;
  } catch (err: any) {
    console.warn(`[geometry] Load failed for ${cityId} (${err.message}). Using built-in roads.`);
    return null;
  }
}