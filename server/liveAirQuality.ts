/**
 * LIVE AIR QUALITY - Open-Meteo Air Quality API
 *
 * Same idea as liveWeather.ts. No API key. No signup.
 *
 * What it does:
 *   1. Asks Open-Meteo for current pollutant levels at a city's coordinates
 *   2. Remembers the answer for 10 minutes
 *   3. If anything goes wrong, returns null and the app keeps its mock data
 *
 * It can NEVER crash your app. Worst case it returns null.
 */

import { CITIES } from './cityData.js';
import type { CityId } from '../src/types/index.js';

// Must match the union in src/types/index.ts exactly.
type AqiStatus =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Hazardous';

export interface LiveAirQuality {
  aqi: number;
  aqiStatus: AqiStatus;
  aqiBreakdown: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
}

const cache = new Map<string, { data: LiveAirQuality; expires: number }>();
const CACHE_SECONDS = 600; // 10 minutes - monitoring stations report hourly anyway

/**
 * US EPA breakpoint table. Only used as a backstop if the API's own
 * us_aqi value is missing, so we always end up with a real number.
 */
const PM25_BREAKPOINTS = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

function pm25ToAqi(c: number): number {
  const bp = PM25_BREAKPOINTS.find((b) => c >= b.cLow && c <= b.cHigh);
  if (!bp) return c > 500.4 ? 500 : 0;
  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow,
  );
}

function toStatus(aqi: number): AqiStatus {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 300) return 'Unhealthy';
  return 'Hazardous';
}

/** Rounds to 1 decimal, and turns null/undefined into 0 so the UI never shows blanks. */
const num = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : 0;

export async function getLiveAirQuality(cityId: CityId): Promise<LiveAirQuality | null> {
  const city = CITIES[cityId] || CITIES.singapore;

  const hit = cache.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${city.lat}&longitude=${city.lng}` +
      `&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone,us_aqi` +
      `&timezone=auto`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Open-Meteo Air Quality returned ${res.status}`);

    const json: any = await res.json();
    const c = json.current;
    if (!c) throw new Error('Response contained no "current" block');

    const pm25 = num(c.pm2_5);

    // Prefer the API's own AQI. Fall back to computing it from PM2.5.
    const aqi =
      typeof c.us_aqi === 'number' && Number.isFinite(c.us_aqi)
        ? Math.round(c.us_aqi)
        : pm25ToAqi(pm25);

    const air: LiveAirQuality = {
      aqi,
      aqiStatus: toStatus(aqi),
      aqiBreakdown: {
        pm25,
        pm10: num(c.pm10),
        no2: num(c.nitrogen_dioxide),
        so2: num(c.sulphur_dioxide),
        // Open-Meteo reports CO in µg/m³; the dashboard shows mg/m³.
        co: num(num(c.carbon_monoxide) / 1000),
        o3: num(c.ozone),
      },
    };

    cache.set(cityId, { data: air, expires: Date.now() + CACHE_SECONDS * 1000 });
    console.log(`[air] LIVE data for ${city.name}: AQI ${air.aqi} (${air.aqiStatus})`);
    return air;
  } catch (err: any) {
    console.warn(`[air] Live fetch failed for ${city.name} (${err.message}). Using mock data.`);
    return null;
  }
}
