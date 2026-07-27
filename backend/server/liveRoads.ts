/**
 * LIVE ROAD FLOW - per-segment TomTom Traffic API
 *
 * liveTraffic.ts gives ONE number for the whole city. This gives a separate
 * reading for EACH road drawn on the transportation map, so the map stops
 * showing frozen numbers.
 *
 * Same key as liveTraffic.ts - if TOMTOM_API_KEY is set, you get live roads
 * for free. If it isn't, this returns null and the frontend keeps using the
 * hardcoded CITY_ROADS values. Nothing breaks either way.
 *
 * IMPORTANT - the `id` of each probe below MUST match the `id` in the
 * frontend's transportationData.ts CITY_ROADS array. That id is how the
 * frontend knows which live reading belongs to which drawn road.
 *
 * QUOTA NOTE: TomTom's free tier is 2,500 requests/day. 4 roads polled every
 * 15 minutes = 384 requests/day. Plenty of headroom. If you add many more
 * roads, raise CACHE_SECONDS rather than lowering the road count.
 */

import { CITIES } from './cityData.js';
import type { CityId } from '../shared/types.js';

/** One live reading for a single road segment. */
export interface LiveRoadFlow {
  roadId: string;
  currentSpeed: number;   // km/h, right now
  freeFlowSpeed: number;  // km/h, the road with no traffic
  congestionIndex: number; // 0-100, how far below free-flow we are
  travelTime: number;     // minutes, current
  normalTravelTime: number; // minutes, at free-flow
  confidence: number;     // 0-1, TomTom's own confidence in the reading
}

/**
 * A representative coordinate for each road on the map - use the MIDPOINT of
 * the road, not an endpoint, so TomTom snaps to the right segment.
 *
 * These are the midpoints of the 4 Taipei roads in CITY_ROADS.
 * To add a road: add it to CITY_ROADS in the frontend, then add a probe here
 * with the SAME id.
 */
const ROAD_PROBES: Record<string, { id: string; lat: number; lng: number }[]> = {
  taipei: [
    { id: 'road-tp-1', lat: 25.048, lng: 121.538 }, // Jianguo Elevated Expressway
    { id: 'road-tp-2', lat: 25.033, lng: 121.545 }, // Xinyi Road BRT Corridor
    { id: 'road-tp-3', lat: 25.040, lng: 121.548 }, // Dunhua South Road Boulevard
    { id: 'road-tp-4', lat: 25.0415, lng: 121.520 }, // NTU Hospital Emergency Route
  ],
};

const cache = new Map<string, { data: LiveRoadFlow[]; expires: number }>();
const CACHE_SECONDS = 15 * 60; // 15 min - stays well inside the free daily quota

/**
 * Returns one LiveRoadFlow per probe, or null when there is no API key /
 * every request failed. Callers should fall back to their static data on null.
 */
export async function getLiveRoads(cityId: CityId): Promise<LiveRoadFlow[] | null> {
  const city = CITIES[cityId] || CITIES.taipei;
  const key = (process.env.TOMTOM_API_KEY || '').trim();

  if (!key) {
    return null;
  }

  const hit = cache.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  const probes = ROAD_PROBES[cityId] || ROAD_PROBES.taipei;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    // allSettled, not all: one bad road must not blank out the whole map.
    const results = await Promise.allSettled(
      probes.map(async (probe) => {
        const url =
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
          `?key=${key}&point=${probe.lat},${probe.lng}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`TomTom returned ${res.status}`);
        const json: any = await res.json();
        const f = json.flowSegmentData;
        if (!f || !(f.freeFlowSpeed > 0) || typeof f.currentSpeed !== 'number') {
          throw new Error('unusable flow payload');
        }

        const flow: LiveRoadFlow = {
          roadId: probe.id,
          currentSpeed: Math.round(f.currentSpeed),
          freeFlowSpeed: Math.round(f.freeFlowSpeed),
          congestionIndex: Math.max(
            0,
            Math.min(100, Math.round((1 - f.currentSpeed / f.freeFlowSpeed) * 100)),
          ),
          // TomTom gives seconds; the map's RoadSegment type wants minutes.
          travelTime: Math.max(1, Math.round((f.currentTravelTime || 0) / 60)),
          normalTravelTime: Math.max(1, Math.round((f.freeFlowTravelTime || 0) / 60)),
          confidence: typeof f.confidence === 'number' ? f.confidence : 1,
        };
        return flow;
      }),
    );

    clearTimeout(timer);

    const flows = results
      .filter((r): r is PromiseFulfilledResult<LiveRoadFlow> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (flows.length === 0) {
      throw new Error('every road probe failed');
    }

    cache.set(cityId, { data: flows, expires: Date.now() + CACHE_SECONDS * 1000 });
    console.log(
      `[roads] LIVE segment data for ${city.name}: ${flows.length}/${probes.length} roads ` +
        `(avg ${Math.round(flows.reduce((s, f) => s + f.congestionIndex, 0) / flows.length)}% congested)`,
    );
    return flows;
  } catch (err: any) {
    console.warn(
      `[roads] Live segment fetch failed for ${city.name} (${err.message}). Map will use built-in road data.`,
    );
    return null;
  }
}