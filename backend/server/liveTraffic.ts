/**
 * LIVE TRAFFIC - TomTom Traffic API
 *
 * Unlike weather and air quality, this one DOES need a free API key.
 *
 * TO ENABLE (takes ~2 minutes):
 *   1. Sign up free at https://developer.tomtom.com
 *   2. Create an app - you get a key instantly
 *   3. Put it in .env.local:   TOMTOM_API_KEY=your_key_here
 *   4. Restart:                npm run dev
 *
 * Until you do that, this returns null and the dashboard uses mock traffic.
 * Nothing breaks. You can ship the demo today and add the key later.
 *
 * How it works:
 *   TomTom tells us the CURRENT speed and the FREE-FLOW speed (the speed that
 *   road runs at with no traffic) for the road nearest a coordinate.
 *   Congestion is simply how far current speed has dropped below free-flow.
 *
 *     moving at full speed  -> 0% congested
 *     moving at half speed  -> 50% congested
 *     stopped               -> 100% congested
 */

import { CITIES } from './cityData.js';
import type { CityId } from '../src/types/index.js';

export interface LiveTraffic {
  congestionIndex: number;
  avgSpeed: number;
  bottleneckCount: number;
}

/**
 * Points we sample per city. One reading is not a city, so we take several
 * across major corridors and average them.
 *
 * Replace these with the real coordinates of the roads you care about -
 * that alone will make your numbers noticeably more credible.
 */
const SAMPLE_POINTS: Record<string, [number, number][]> = {
  singapore: [
    [1.3521, 103.8198], // Central
    [1.3300, 103.8500], // PIE / CTE corridor
    [1.3050, 103.8540], // Marina / Rochor
    [1.3400, 103.7050], // Jurong
  ],
  taipei: [
    [25.0330, 121.5654], // Xinyi
    [25.0478, 121.5170], // Zhongzheng
    [25.0800, 121.5700], // Neihu
    [25.0170, 121.5400], // Da'an south
  ],
  bengaluru: [
    [12.9716, 77.5946], // City centre
    [12.9352, 77.6245], // Koramangala
    [12.9698, 77.7500], // Whitefield
    [12.9170, 77.6230], // Silk Board
  ],
};

const cache = new Map<string, { data: LiveTraffic; expires: number }>();
const CACHE_SECONDS = 60; // TomTom's own model refreshes about every minute

export async function getLiveTraffic(cityId: CityId): Promise<LiveTraffic | null> {
  const city = CITIES[cityId] || CITIES.singapore;
  const key = (process.env.TOMTOM_API_KEY || '').trim();

  // No key yet? That's fine - say so once, clearly, and move on.
  if (!key) {
    return null;
  }

  const hit = cache.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  const points = SAMPLE_POINTS[cityId] || SAMPLE_POINTS.singapore;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    // allSettled, NOT all: one dead sample point must not lose us the whole city.
    const results = await Promise.allSettled(
      points.map(async ([lat, lng]) => {
        const url =
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
          `?key=${key}&point=${lat},${lng}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`TomTom returned ${res.status}`);
        const json: any = await res.json();
        return json.flowSegmentData;
      }),
    );

    clearTimeout(timer);

    const flows = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((f) => f && f.freeFlowSpeed > 0 && typeof f.currentSpeed === 'number');

    if (flows.length === 0) {
      throw new Error('every sample point failed');
    }

    const avgSpeed = flows.reduce((sum, f) => sum + f.currentSpeed, 0) / flows.length;
    const avgFreeFlow = flows.reduce((sum, f) => sum + f.freeFlowSpeed, 0) / flows.length;

    // A "bottleneck" = a sampled road running below 60% of its free-flow speed.
    const bottleneckCount = flows.filter(
      (f) => f.currentSpeed / f.freeFlowSpeed < 0.6,
    ).length;

    const traffic: LiveTraffic = {
      congestionIndex: Math.max(
        0,
        Math.min(100, Math.round((1 - avgSpeed / avgFreeFlow) * 100)),
      ),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      bottleneckCount,
    };

    cache.set(cityId, { data: traffic, expires: Date.now() + CACHE_SECONDS * 1000 });
    console.log(
      `[traffic] LIVE data for ${city.name}: ${traffic.congestionIndex}% congested, ` +
        `${traffic.avgSpeed} km/h (${flows.length}/${points.length} points)`,
    );
    return traffic;
  } catch (err: any) {
    console.warn(`[traffic] Live fetch failed for ${city.name} (${err.message}). Using mock data.`);
    return null;
  }
}

/** Logged once at startup so it's obvious whether traffic is live. */
export function logTrafficStatus() {
  if ((process.env.TOMTOM_API_KEY || '').trim()) {
    console.log('[traffic] TomTom key found - traffic will be LIVE.');
  } else {
    console.log(
      '[traffic] No TOMTOM_API_KEY set - using mock traffic. ' +
        'Get a free key at https://developer.tomtom.com',
    );
  }
}
