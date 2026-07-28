/**
 * LIVE AIR QUALITY - Taiwan MOENV & Open-Meteo Fallback (Taipei Only)
 *
 * What it does:
 *   1. Fetches current air quality data for Taipei via Taiwan MOENV API
 *   2. Falls back to Open-Meteo for Taipei if MOENV fails
 *   3. Caches results for 10 minutes
 */

import { CITIES } from './cityData.js';
import type { CityId } from '../shared/types.js';

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
const CACHE_SECONDS = 600; // 10 minutes

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

const num = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.round(v * 10) / 10
    : typeof v === 'string' && !isNaN(parseFloat(v))
    ? Math.round(parseFloat(v) * 10) / 10
    : 0;

/**
 * Fetch directly from Taiwan's MOENV Official API for Taipei
 */
async function getTaiwanMoenvAirQuality(): Promise<LiveAirQuality | null> {
  const apiKey = 'b7df779e-71a6-4148-8379-5afbd441d803';
  // Use limit=1000 so all station records across Taiwan are retrieved, then filter locally for Taipei (臺北市)
  const url = `https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=${apiKey}&limit=1000&sort=ImportDate%20desc&format=JSON`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`MOENV API returned HTTP ${res.status}`);

    const json: any = await res.json();
    // Support both direct array response or { records: [...] } wrapper
    const records = Array.isArray(json) ? json : json?.records;

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No records returned from MOENV API');
    }

    // Filter specifically for Taipei City stations (臺北市)
    const taipeiStations = records.filter(
      (station: any) => station.county === '臺北市',
    );

    if (taipeiStations.length === 0) {
      throw new Error('No records returned specifically for Taipei City');
    }

    let totalAqi = 0,
      totalPm25 = 0,
      totalPm10 = 0,
      totalNo2 = 0,
      totalSo2 = 0,
      totalCo = 0,
      totalO3 = 0;
    let validCount = 0;

    for (const station of taipeiStations) {
      const stationAqi = num(station.aqi);
      if (stationAqi > 0) {
        totalAqi += stationAqi;
        totalPm25 += num(station['pm2.5']);
        totalPm10 += num(station.pm10);
        totalNo2 += num(station.no2);
        totalSo2 += num(station.so2);
        totalCo += num(station.co);
        totalO3 += num(station.o3);
        validCount++;
      }
    }

    if (validCount === 0) throw new Error('No valid station measurements in Taipei');

    const avgAqi = Math.round(totalAqi / validCount);

    return {
      aqi: avgAqi,
      aqiStatus: toStatus(avgAqi),
      aqiBreakdown: {
        pm25: num(totalPm25 / validCount),
        pm10: num(totalPm10 / validCount),
        no2: num(totalNo2 / validCount),
        so2: num(totalSo2 / validCount),
        co: num(totalCo / validCount),
        o3: num(totalO3 / validCount),
      },
    };
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(
      `[air] Taiwan MOENV API fetch failed (${err.message}). Trying Open-Meteo fallback...`,
    );
    return null;
  }
}

/**
 * Fetch from Open-Meteo Air Quality API for Taipei as fallback
 */
async function getOpenMeteoAirQuality(): Promise<LiveAirQuality | null> {
  const city = CITIES.taipei;
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${city.lat}&longitude=${city.lng}` +
    `&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone,us_aqi` +
    `&timezone=auto`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Open-Meteo Air Quality returned ${res.status}`);

    const json: any = await res.json();
    const c = json.current;
    if (!c) throw new Error('Response contained no "current" block');

    const pm25 = num(c.pm2_5);
    const aqi =
      typeof c.us_aqi === 'number' && Number.isFinite(c.us_aqi)
        ? Math.round(c.us_aqi)
        : pm25ToAqi(pm25);

    return {
      aqi,
      aqiStatus: toStatus(aqi),
      aqiBreakdown: {
        pm25,
        pm10: num(c.pm10),
        no2: num(c.nitrogen_dioxide),
        so2: num(c.sulphur_dioxide),
        co: num(num(c.carbon_monoxide) / 1000),
        o3: num(c.ozone),
      },
    };
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(
      `[air] Open-Meteo fetch failed for Taipei (${err.message}). Using mock data.`,
    );
    return null;
  }
}

/**
 * Primary export entry point (Targeting Taipei)
 */
export async function getLiveAirQuality(cityId: CityId = 'taipei'): Promise<LiveAirQuality | null> {
  const hit = cache.get('taipei');
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  // 1. Try official Taiwan MOENV API
  let air = await getTaiwanMoenvAirQuality();
  if (air) {
    console.log(`[air] LIVE Taiwan MOENV data for Taipei: AQI ${air.aqi} (${air.aqiStatus})`);
  }

  // 2. Fall back to Open-Meteo for Taipei if MOENV fails
  if (!air) {
    air = await getOpenMeteoAirQuality();
    if (air) {
      console.log(`[air] LIVE Open-Meteo fallback data for Taipei: AQI ${air.aqi} (${air.aqiStatus})`);
    }
  }

  if (air) {
    cache.set('taipei', { data: air, expires: Date.now() + CACHE_SECONDS * 1000 });
  }

  return air;
}