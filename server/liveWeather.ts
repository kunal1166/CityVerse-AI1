/**
 * LIVE WEATHER - Open-Meteo
 *
 * No API key. No signup. It just works.
 *
 * What it does:
 *   1. Asks Open-Meteo for the current weather at a city's coordinates
 *   2. Also asks for the next 24 hours of rainfall (used by the prediction model)
 *   3. Remembers the answer for 5 minutes (so we don't spam their servers)
 *   4. If anything goes wrong, returns null and the app keeps its mock data
 *
 * It can NEVER crash your app. The worst case is that it returns null.
 */

import { CITIES } from './cityData.js';
import type { CityId } from '../src/types/index.js';

// Open-Meteo describes the sky with a number (the WMO standard). Translate it.
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  80: 'Rain Showers', 81: 'Heavy Showers', 82: 'Violent Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm',
};

export interface ForecastHour {
  time: string;          // local time, e.g. "2026-07-24T15:00"
  precipitation: number; // mm for that hour
}

export interface LiveWeather {
  temp: number;
  humidity: number;
  rainfallRate: number;
  windSpeed: number;
  condition: string;
  forecast: ForecastHour[]; // starts at the NEXT hour
}

// Simple memory cache: city -> { data, expires }
const cache = new Map<string, { data: LiveWeather; expires: number }>();
const CACHE_SECONDS = 300; // 5 minutes

/**
 * Returns live weather, or null if it couldn't be fetched.
 * Callers should treat null as "just use the mock data".
 */
export async function getLiveWeather(cityId: CityId): Promise<LiveWeather | null> {
  const city = CITIES[cityId] || CITIES.singapore;

  // 1. Do we already have a fresh answer?
  const hit = cache.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  // 2. Ask Open-Meteo.
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${city.lat}&longitude=${city.lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&hourly=precipitation` +
      `&forecast_hours=24` +
      `&timezone=auto`;

    // Give up after 8 seconds so a slow network can't freeze the dashboard.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

    const json: any = await res.json();
    const c = json.current;
    if (!c) throw new Error('Response contained no "current" block');

    // Open-Meteo's hourly arrays start at MIDNIGHT local time, not "now".
    // Slice from the first hour strictly after the current time so that
    // forecast[0] always means "next hour" for every caller.
    const times: string[] = json.hourly?.time ?? [];
    const precip: number[] = json.hourly?.precipitation ?? [];

    let startIndex = times.findIndex((t) => t > c.time);
    if (startIndex === -1) startIndex = times.length; // no future hours available

    const forecast: ForecastHour[] = times
      .slice(startIndex)
      .map((time, i) => ({
        time,
        precipitation: Number(precip[startIndex + i] ?? 0),
      }));

    const weather: LiveWeather = {
      temp: Math.round(c.temperature_2m * 10) / 10,
      humidity: c.relative_humidity_2m,
      rainfallRate: c.precipitation,
      windSpeed: c.wind_speed_10m,
      condition: WEATHER_CODES[c.weather_code] || 'Unknown',
      forecast,
    };

    // 3. Remember it, then return it.
    cache.set(cityId, { data: weather, expires: Date.now() + CACHE_SECONDS * 1000 });
    console.log(
      `[weather] LIVE data for ${city.name}: ${weather.temp}C, ${weather.condition}, ` +
        `${forecast.length}h forecast`,
    );
    return weather;
  } catch (err: any) {
    // 4. Something failed. Say so clearly, return null, let the app carry on.
    console.warn(`[weather] Live fetch failed for ${city.name} (${err.message}). Using mock data.`);
    return null;
  }
}