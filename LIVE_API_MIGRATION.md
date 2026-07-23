# CityVerse AI — Live API Migration Guide

How to replace every mock dataset in this project with **real, official, live data**.

Written to be followed step by step. You do not need prior API experience.

---

## Table of contents

1. [Read this first: the migration strategy](#1-read-this-first-the-migration-strategy)
2. [Step 0 — Build the shared foundation](#2-step-0--build-the-shared-foundation)
3. [Module A — Weather & Environment](#3-module-a--weather--environment-open-meteo)
4. [Module B — Air Quality / AQI](#4-module-b--air-quality--aqi-openaq)
5. [Module C — Traffic Flow & Congestion](#5-module-c--traffic-flow--congestion-tomtom)
6. [Module D — Traffic Incidents](#6-module-d--traffic-incidents-tomtom--lta)
7. [Module E — Public Transit](#7-module-e--public-transit-lta-datamall--tdx)
8. [Module F — Flood Risk](#8-module-f--flood-risk-lta-pub--rainfall-derived)
9. [Module G — Map Tiles](#9-module-g--map-tiles)
10. [Wiring it all together](#10-wiring-it-all-together)
11. [Frontend changes](#11-frontend-changes)
12. [Testing your migration](#12-testing-your-migration)
13. [API summary table](#13-api-summary-table)

---

## 1. Read this first: the migration strategy

### The golden rule: do NOT delete `cityData.ts`

Your instinct will be to rip out the mock data. **Don't.**

Keep `server/cityData.ts` and turn it into your **fallback layer**. Here is why:

- Free API tiers run out. Yours will run out at the worst possible moment.
- Conference and demo wifi fails constantly.
- Real APIs return `429 Too Many Requests`, `503`, and timeouts.
- Some data (flood-stage sensors for arbitrary cities) genuinely has no free public API.

The professional pattern is **live data with graceful degradation**:

```
Request → Cache? → yes → serve cached
                 → no  → call live API → success → cache + serve  (source: "live")
                                       → fail    → serve mock     (source: "fallback")
```

Your app already does exactly this for the AI layer (`server/aiProvider.ts` falls back to
the offline briefing engine). You are applying the same proven pattern to data.

Every API response should carry its provenance so the UI can be honest:

```json
{ "aqi": 63, "source": "live", "provider": "OpenAQ", "fetchedAt": "2026-07-24T09:15:00Z" }
```

### Migration order (do them one at a time)

Do **not** migrate everything at once. If you do and something breaks, you will not know
which integration caused it. Recommended order, easiest first:

| Order | Module | Why this order |
|---|---|---|
| 1 | Weather | No API key at all. Fastest possible win. |
| 2 | Air Quality | One free key, simple REST. |
| 3 | Traffic Flow | Free key, slightly more complex. |
| 4 | Incidents | Builds on traffic setup. |
| 5 | Transit | City-specific, most work. |
| 6 | Flood | Singapore only; derive elsewhere. |

Commit after each module works. That way you can always roll back one step.

---

## 2. Step 0 — Build the shared foundation

Every module needs the same three things: caching, timeouts, and fallback. Build them
**once**, before you touch any API.

### 2.1 Why caching is not optional

Your dashboard polls. Three cities × six data types × one user × every 30 seconds =
**2,160 API calls per hour**. Open-Meteo's free non-commercial tier is around 10,000
calls per *day*. You would burn it before lunch.

Caching for 60 seconds cuts that by ~98% and costs you nothing in perceived freshness,
because the underlying data does not update faster than that anyway.

### 2.2 Create `server/lib/cache.ts`

An in-memory TTL cache. No Redis needed for a project this size.

```ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Returns cached value if fresh, otherwise runs the loader, caches, and returns it.
 * On loader failure, returns STALE cached data if any exists (better than nothing),
 * otherwise rethrows so the caller can fall back to mock data.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as CacheEntry<T> | undefined;

  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  try {
    const value = await loader();
    store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
    return value;
  } catch (err) {
    // Serving slightly stale data beats serving an error.
    if (hit) {
      console.warn(`[cache] loader failed for "${key}", serving stale data.`);
      return hit.value;
    }
    throw err;
  }
}

export function clearCache() {
  store.clear();
}
```

**Recommended TTLs:**

| Data | TTL | Reason |
|---|---|---|
| Weather | 300s (5 min) | Weather models update hourly at best |
| Air quality | 600s (10 min) | Monitoring stations report hourly |
| Traffic flow | 60s | Genuinely changes minute to minute |
| Incidents | 60s | Needs to feel live |
| Transit | 30s | Arrival times change fast |
| Static (bus stops, road geometry) | 86400s (24h) | Changes yearly |

### 2.3 Create `server/lib/fetchJson.ts`

Never call `fetch` directly. Always go through a wrapper with a timeout — a hanging
request with no timeout will freeze your dashboard indefinitely.

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public provider?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchJson<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number; provider?: string } = {},
): Promise<T> {
  const { timeoutMs = 8000, provider = 'unknown', ...init } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });

    if (res.status === 429) {
      throw new ApiError(`Rate limited by ${provider}`, 429, provider);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new ApiError(
        `${provider} returned ${res.status}: ${body.slice(0, 200)}`,
        res.status,
        provider,
      );
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError(`${provider} timed out after ${timeoutMs}ms`, 408, provider);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
```

### 2.4 Create `server/lib/withFallback.ts`

The pattern you will reuse in every single module.

```ts
export interface Sourced<T> {
  data: T;
  source: 'live' | 'fallback';
  provider: string;
  fetchedAt: string;
}

export async function withFallback<T>(
  provider: string,
  live: () => Promise<T>,
  fallback: () => T,
): Promise<Sourced<T>> {
  try {
    const data = await live();
    return { data, source: 'live', provider, fetchedAt: new Date().toISOString() };
  } catch (err: any) {
    console.warn(`[${provider}] live fetch failed (${err.message}). Using fallback.`);
    return {
      data: fallback(),
      source: 'fallback',
      provider: `${provider} (offline)`,
      fetchedAt: new Date().toISOString(),
    };
  }
}
```

### 2.5 Add your city coordinates

You already have these in `CITIES` (`server/cityData.ts`). Every API below is queried by
latitude/longitude, so reuse them — do not hardcode coordinates a second time.

```ts
// Already exists in server/cityData.ts
singapore:  { lat: 1.3521,  lng: 103.8198 }
taipei:     { lat: 25.0330, lng: 121.5654 }
bengaluru:  { lat: 12.9716, lng: 77.5946  }
```

---

## 3. Module A — Weather & Environment (Open-Meteo)

**Start here.** No signup, no key, no credit card.

### Which API and why

**Open-Meteo** — https://open-meteo.com

Open-source, backed by national weather services (NOAA GFS, DWD ICON, ECMWF, JMA).
It requires **no API key for non-commercial use**, which makes it the single best
starting point for a student or hackathon project.

- **Docs:** https://open-meteo.com/en/docs
- **Authentication:** None.
- **Rate limits:** Roughly 10,000 calls/day free for non-commercial use. Exceeding this
  returns HTTP 429. Commercial plans exist with keys and higher quotas.
- **Licence:** CC BY 4.0 — **you must display attribution.** Add "Weather data by
  Open-Meteo.com" somewhere in your UI or footer. This is a licence obligation, not a
  suggestion.

### Endpoint

```
GET https://api.open-meteo.com/v1/forecast
```

Full request for your Environment module:

```
https://api.open-meteo.com/v1/forecast
  ?latitude=1.3521
  &longitude=103.8198
  &current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m
  &hourly=temperature_2m,precipitation,relative_humidity_2m
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum
  &forecast_days=3
  &timezone=Asia%2FSingapore
```

### Example response (trimmed)

```json
{
  "latitude": 1.375,
  "longitude": 103.875,
  "timezone": "Asia/Singapore",
  "current": {
    "time": "2026-07-24T09:15",
    "temperature_2m": 30.4,
    "relative_humidity_2m": 78,
    "precipitation": 0.3,
    "weather_code": 61,
    "wind_speed_10m": 11.2
  },
  "hourly": {
    "time": ["2026-07-24T00:00", "2026-07-24T01:00"],
    "temperature_2m": [27.1, 26.8],
    "precipitation": [0.0, 0.2]
  },
  "daily": {
    "time": ["2026-07-24", "2026-07-25", "2026-07-26"],
    "temperature_2m_max": [32.1, 31.4, 30.9],
    "temperature_2m_min": [25.8, 25.5, 25.1],
    "precipitation_sum": [4.2, 12.8, 22.1]
  }
}
```

**Important structural note for beginners:** Open-Meteo returns **parallel arrays**, not
an array of objects. `hourly.time[3]` corresponds to `hourly.temperature_2m[3]`. You must
zip them together yourself. This trips up almost everyone the first time.

### Create `server/providers/weather.ts`

```ts
import { cached } from '../lib/cache.js';
import { fetchJson } from '../lib/fetchJson.js';
import { CITIES } from '../cityData.js';
import type { CityId } from '../../src/types/index.js';

// WMO weather codes -> human labels. Open-Meteo uses the WMO standard.
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  80: 'Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm',
};

export async function getLiveWeather(cityId: CityId) {
  const city = CITIES[cityId] || CITIES.singapore;

  return cached(`weather:${cityId}`, 300, async () => {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${city.lat}&longitude=${city.lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,precipitation` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
      `&forecast_days=3&timezone=auto`;

    const raw = await fetchJson<any>(url, { provider: 'Open-Meteo', timeoutMs: 8000 });

    return {
      temp: Math.round(raw.current.temperature_2m),
      humidity: raw.current.relative_humidity_2m,
      rainfallRate: raw.current.precipitation,
      windSpeed: raw.current.wind_speed_10m,
      condition: WEATHER_CODES[raw.current.weather_code] || 'Unknown',
      // Zip the parallel arrays into objects your charts can consume directly.
      forecast3Day: raw.daily.time.map((day: string, i: number) => ({
        day,
        tempHigh: Math.round(raw.daily.temperature_2m_max[i]),
        tempLow: Math.round(raw.daily.temperature_2m_min[i]),
        precipitation: raw.daily.precipitation_sum[i],
      })),
    };
  });
}
```

### Caching, errors, fallback

- **Cache:** 300s. Weather models update hourly; polling faster is pure waste.
- **Errors:** 429 means quota exhausted — your cache TTL is too low. 400 almost always
  means a misspelled parameter name.
- **Fallback:** `getCityDashboardData(cityId).environment` — your existing mock.

---

## 4. Module B — Air Quality / AQI (OpenAQ)

### Which API and why

**OpenAQ** — https://openaq.org

An open, non-profit aggregator of government and research-grade air monitoring stations
worldwide. It covers PM2.5, PM10, SO2, NO2, CO, and O3 — exactly the breakdown your
Environment module already displays.

- **Docs:** https://docs.openaq.org
- **Base URL:** `https://api.openaq.org/v3`
- **Get a key:** register at https://explore.openaq.org/register
- **Authentication:** an `X-API-Key` header on every request.
- **Rate limits:** scoped to your API key. Exceeding returns **HTTP 429**. The API returns
  rate-limit headers showing usage, remaining capacity and reset time — read them.
  Repeatedly blowing past the limit can get you temporarily or permanently banned, so
  cache properly.

**Alternative if you want zero keys:** Open-Meteo also has an air quality endpoint at
`https://air-quality-api.open-meteo.com/v1/air-quality` with the same no-key policy. It is
modelled rather than station-measured, but it needs no signup and covers everywhere.

### Endpoints

Find stations near a city:

```
GET https://api.openaq.org/v3/locations?coordinates={lat},{lng}&radius=25000&limit=50
```

Note: OpenAQ expects `coordinates` as **latitude,longitude**. Radius is in **metres**
(max 25,000).

Then read the latest values for a sensor:

```
GET https://api.openaq.org/v3/sensors/{sensorId}/measurements?limit=1
```

### Example response (trimmed)

```json
{
  "meta": { "found": 12, "limit": 50, "page": 1 },
  "results": [
    {
      "id": 2178,
      "name": "Singapore Central",
      "coordinates": { "latitude": 1.3521, "longitude": 103.8198 },
      "sensors": [
        { "id": 3917, "parameter": { "id": 2, "name": "pm25", "units": "µg/m³" } },
        { "id": 3918, "parameter": { "id": 1, "name": "pm10", "units": "µg/m³" } }
      ]
    }
  ]
}
```

### Converting PM2.5 into an AQI number

OpenAQ gives raw concentrations (µg/m³). Your UI displays an **AQI index** (0–500). These
are different scales and you must convert. This is the US EPA breakpoint formula:

```ts
const PM25_BREAKPOINTS = [
  { cLow: 0.0,   cHigh: 12.0,  iLow: 0,   iHigh: 50  },
  { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
  { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
  { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
];

export function pm25ToAqi(concentration: number): number {
  const bp = PM25_BREAKPOINTS.find(
    (b) => concentration >= b.cLow && concentration <= b.cHigh,
  );
  if (!bp) return concentration > 500.4 ? 500 : 0;

  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow,
  );
}

export function aqiStatus(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}
```

### Create `server/providers/airQuality.ts`

```ts
import { cached } from '../lib/cache.js';
import { fetchJson } from '../lib/fetchJson.js';
import { CITIES } from '../cityData.js';
import { pm25ToAqi, aqiStatus } from '../lib/aqi.js';
import type { CityId } from '../../src/types/index.js';

const BASE = 'https://api.openaq.org/v3';

function headers() {
  const key = (process.env.OPENAQ_API_KEY || '').trim();
  if (!key) throw new Error('OPENAQ_API_KEY is not set');
  return { 'X-API-Key': key };
}

export async function getLiveAirQuality(cityId: CityId) {
  const city = CITIES[cityId] || CITIES.singapore;

  // Station list changes rarely -> cache for 24h to save quota.
  const locations = await cached(`aq:locations:${cityId}`, 86400, () =>
    fetchJson<any>(
      `${BASE}/locations?coordinates=${city.lat},${city.lng}&radius=25000&limit=50`,
      { headers: headers(), provider: 'OpenAQ' },
    ),
  );

  return cached(`aq:latest:${cityId}`, 600, async () => {
    const pm25Sensor = locations.results
      .flatMap((loc: any) => loc.sensors || [])
      .find((s: any) => s.parameter?.name === 'pm25');

    if (!pm25Sensor) throw new Error(`No PM2.5 sensor near ${city.name}`);

    const measurement = await fetchJson<any>(
      `${BASE}/sensors/${pm25Sensor.id}/measurements?limit=1`,
      { headers: headers(), provider: 'OpenAQ' },
    );

    const pm25 = measurement.results?.[0]?.value;
    if (typeof pm25 !== 'number') throw new Error('No recent PM2.5 measurement');

    const aqi = pm25ToAqi(pm25);
    return {
      aqi,
      aqiStatus: aqiStatus(aqi),
      aqiBreakdown: { pm25 },
      stationCount: locations.results.length,
    };
  });
}
```

### Caching, errors, fallback

- **Cache:** station list 24h, measurements 600s.
- **Errors:** 401 = bad or missing key. 429 = rate limited, back off. Empty `results` is
  common and is **not** an error — some cities genuinely have no nearby station, which is
  why the fallback matters.
- **Fallback:** your mock `environment.aqi` / `aqiBreakdown`.

---

## 5. Module C — Traffic Flow & Congestion (TomTom)

This is the hardest module to make truly live, because real per-road traffic data is
commercial almost everywhere.

### Which API and why

**TomTom Traffic API** — https://developer.tomtom.com

TomTom offers a free developer tier and is one of the few providers giving genuine
real-time road-segment speeds via a simple REST call. The **Flow Segment Data** endpoint
returns current speed and free-flow speed for the road nearest a coordinate — which is
exactly what you need to compute a congestion index.

- **Docs:** https://developer.tomtom.com/traffic-api/documentation
- **Get a key:** register a free developer account at https://developer.tomtom.com
- **Authentication:** `key` **query parameter** (not a header).
- **Rate limits:** free tier has a daily request cap and a queries-per-second cap. Check
  your dashboard for your current allowance, as tiers change. Cache aggressively.
- **Note:** TomTom's traffic model updates roughly every minute, so a 60s cache loses you
  nothing.

**Free official alternative for Singapore:** LTA DataMall (see Module D) provides
**Traffic Speed Bands** covering the whole island, free, from the government. If your
primary demo city is Singapore, prefer LTA and use TomTom only for Taipei/Bengaluru.

### Endpoint

```
GET https://api.tomtom.com/traffic/services/4/flowSegmentData/{style}/{zoom}/{format}
      ?key={API_KEY}&point={lat},{lon}
```

Concrete example:

```
https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json
  ?key=YOUR_KEY&point=1.3521,103.8198
```

### Example response

```json
{
  "flowSegmentData": {
    "frc": "FRC1",
    "currentSpeed": 34,
    "freeFlowSpeed": 62,
    "currentTravelTime": 128,
    "freeFlowTravelTime": 70,
    "confidence": 0.94,
    "roadClosure": false,
    "coordinates": { "coordinate": [{ "latitude": 1.3520, "longitude": 103.8197 }] }
  }
}
```

### Deriving your congestion index

Your UI expects a `congestionIndex` percentage. Compute it:

```ts
// 0% = moving at free-flow speed. 100% = completely stopped.
const congestionIndex = Math.round(
  (1 - flow.currentSpeed / flow.freeFlowSpeed) * 100,
);
```

Sample several points across the city (use your existing `keyDistricts` coordinates) and
average them for a citywide figure. One point is not a city.

### Create `server/providers/traffic.ts`

```ts
import { cached } from '../lib/cache.js';
import { fetchJson } from '../lib/fetchJson.js';
import { CITIES } from '../cityData.js';
import type { CityId } from '../../src/types/index.js';

// Sample points per city. Add the real coordinates of your key corridors here.
const SAMPLE_POINTS: Record<string, [number, number][]> = {
  singapore: [[1.3521, 103.8198], [1.3050, 103.8540], [1.3260, 103.8120]],
  taipei:    [[25.0330, 121.5654], [25.0478, 121.5170], [25.0800, 121.5700]],
  bengaluru: [[12.9716, 77.5946], [12.9352, 77.6245], [12.9698, 77.7500]],
};

export async function getLiveTraffic(cityId: CityId) {
  const key = (process.env.TOMTOM_API_KEY || '').trim();
  if (!key) throw new Error('TOMTOM_API_KEY is not set');

  const points = SAMPLE_POINTS[cityId] || SAMPLE_POINTS.singapore;

  return cached(`traffic:${cityId}`, 60, async () => {
    const results = await Promise.allSettled(
      points.map(([lat, lng]) =>
        fetchJson<any>(
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
            `?key=${key}&point=${lat},${lng}`,
          { provider: 'TomTom', timeoutMs: 6000 },
        ),
      ),
    );

    // Promise.allSettled: one dead sample point must not kill the whole city reading.
    const flows = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value.flowSegmentData)
      .filter((f) => f && f.freeFlowSpeed > 0);

    if (flows.length === 0) throw new Error('All TomTom sample points failed');

    const avgSpeed = flows.reduce((s, f) => s + f.currentSpeed, 0) / flows.length;
    const avgFree = flows.reduce((s, f) => s + f.freeFlowSpeed, 0) / flows.length;

    return {
      avgSpeed: Number(avgSpeed.toFixed(1)),
      freeFlowSpeed: Number(avgFree.toFixed(1)),
      congestionIndex: Math.max(0, Math.round((1 - avgSpeed / avgFree) * 100)),
      samplesUsed: flows.length,
      samplesRequested: points.length,
    };
  });
}
```

Note the use of `Promise.allSettled` rather than `Promise.all`. With `Promise.all`, a
single failing sample point rejects everything and you lose the entire city reading.

### Caching, errors, fallback

- **Cache:** 60s, matching TomTom's own model refresh.
- **Errors:** 403 = invalid key or quota exceeded. 400 = malformed `point` (it must be
  `lat,lon` with no space).
- **Fallback:** your mock `traffic` block.

---

## 6. Module D — Traffic Incidents (TomTom + LTA)

### Option 1 — TomTom Incident Details (works globally)

```
GET https://api.tomtom.com/traffic/services/5/incidentDetails
      ?key={KEY}
      &bbox={minLon},{minLat},{maxLon},{maxLat}
      &fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},startTime,endTime}}}
      &language=en-GB
```

Example response:

```json
{
  "incidents": [
    {
      "type": "Feature",
      "geometry": { "type": "LineString", "coordinates": [[103.85, 1.30], [103.86, 1.31]] },
      "properties": {
        "iconCategory": 6,
        "magnitudeOfDelay": 3,
        "events": [{ "description": "Stationary traffic" }],
        "startTime": "2026-07-24T08:41:00Z",
        "endTime": "2026-07-24T09:30:00Z"
      }
    }
  ]
}
```

Map `iconCategory` to your existing incident `type`, and `magnitudeOfDelay` to your
`severity` (`0–1` → minor, `2` → major, `3–4` → critical).

### Option 2 — LTA DataMall (Singapore only, free, official, better)

For Singapore this is strictly superior: it is the government source, it is free, and it
includes data TomTom does not have (VMS boards, road works, flood alerts from PUB).

- **Portal:** https://datamall.lta.gov.sg
- **Base URL:** `https://datamall2.mytransport.sg/ltaodataservice`
- **Get a key:** request an Account Key on the DataMall site (instant, free, requires
  registration).
- **Authentication:** an `AccountKey` **header**.
- **Pagination:** responses are capped (commonly 50 records per call). Use `?$skip=50`,
  `?$skip=100` and so on to page through. This is unusual and catches people out.
- **Licence:** Singapore Open Data Licence.

Key endpoints for your project:

| Endpoint | Returns |
|---|---|
| `/TrafficIncidents` | Live incidents with lat/long and description |
| `/TrafficSpeedBands` | Speed band per road segment, whole island |
| `/EstTravelTimes` | Estimated expressway travel times |
| `/VMS` | Variable message sign contents |
| `/Traffic Images` | Live camera images (URLs valid ~5 min) |
| `/FaultyTrafficLights` | Current signal faults |

Example call:

```bash
curl -H "AccountKey: YOUR_ACCOUNT_KEY" \
  "https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents"
```

Example response:

```json
{
  "odata.metadata": "...",
  "value": [
    {
      "Type": "Accident",
      "Latitude": 1.3372,
      "Longitude": 103.8977,
      "Message": "(24/7)10:21 Accident on PIE (towards Changi Airport) after Bedok Nth Rd."
    }
  ]
}
```

### Provider file sketch

```ts
export async function getLiveIncidents(cityId: CityId) {
  if (cityId === 'singapore') return getLtaIncidents();
  return getTomTomIncidents(cityId);
}
```

Route per city. This is normal and expected — smart-city data is inherently local, and
saying so in your demo shows maturity rather than weakness.

### Caching, errors, fallback

- **Cache:** 60s.
- **Errors:** LTA returns 401 for a bad AccountKey. An empty `value` array means no
  current incidents — that is a valid, common state, not a failure. Handle it as an
  **empty state** in the UI, not an error.
- **Fallback:** your seeded `dynamicIncidents`.

---

## 7. Module E — Public Transit (LTA DataMall / TDX)

### Singapore — LTA DataMall

| Endpoint | Returns |
|---|---|
| `/BusArrivalv2?BusStopCode=83139` | Real-time arrivals, load level, wheelchair flag |
| `/PCDRealTime?TrainLine=NSL` | Platform crowd density, real time |
| `/TrainServiceAlerts` | Live MRT disruption alerts |
| `/BusStops` | All bus stops (static, page with `$skip`) |

`/TrainServiceAlerts` maps directly onto your transit `status` and `disruptionsCount`
fields.

### Taipei — TDX (Transport Data eXchange)

- **Portal:** https://tdx.transportdata.tw
- Taiwan's official open transport platform. Free, requires registration.
- **Authentication:** OAuth2 client credentials — you POST your client ID and secret to
  get a bearer token, then send `Authorization: Bearer {token}`. Tokens expire, so cache
  the token and refresh on 401.

### Bengaluru — the honest answer

BMTC and Namma Metro do **not** publish a stable, documented, free public real-time API.
Some GTFS static feeds circulate via https://openmobilitydata.org but real-time coverage
is unreliable.

**What to do:** be upfront. Use GTFS static for routes and stops, and keep simulated
real-time positions clearly labelled as simulated. A judge will respect
"no official real-time feed exists for this city, so this layer is modelled" far more
than a silent fake. This is a genuine, well-known gap in Indian transit open data.

### GTFS-Realtime generally

Where a city publishes GTFS-RT (protobuf, not JSON), use:

```bash
npm install gtfs-realtime-bindings
```

```ts
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const res = await fetch(GTFS_RT_URL);
const buffer = await res.arrayBuffer();
const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
  new Uint8Array(buffer),
);
feed.entity.forEach((e) => console.log(e.tripUpdate));
```

---

## 8. Module F — Flood Risk (LTA/PUB + rainfall-derived)

Real flood-stage sensor data is rarely public.

**Singapore:** LTA DataMall exposes PUB flood alert information — the only genuinely
official live flood feed among your three cities.

**Everywhere else:** derive a risk level from live rainfall (Module A) plus your existing
static drainage-capacity assumptions:

```ts
export function deriveFloodRisk(rainfallMmPerHour: number, drainageCapacity = 20) {
  const ratio = rainfallMmPerHour / drainageCapacity;
  if (ratio >= 1.0) return 'Critical';
  if (ratio >= 0.7) return 'High';
  if (ratio >= 0.4) return 'Moderate';
  return 'Low';
}
```

**Label this honestly in the UI.** It is a *derived model*, not a sensor reading. Calling
a heuristic a sensor is the kind of thing that unravels under a single judge's question.

---

## 9. Module G — Map Tiles

Your Leaflet maps currently use OpenStreetMap default tiles. For production:

| Provider | Free tier | Notes |
|---|---|---|
| **OpenStreetMap** | Yes, but **no heavy use** | The public tile server is volunteer-funded. Their usage policy forbids production traffic. |
| **MapTiler** | ~100k tiles/month | Drop-in Leaflet support |
| **Stadia Maps** | Free non-commercial tier | Good styling |
| **Mapbox** | 50k loads/month | Most polished |

If you keep OSM tiles, you **must** display the attribution:

```
© OpenStreetMap contributors
```

Add a TomTom traffic-flow raster overlay on top of your existing base layer:

```ts
L.tileLayer(
  `https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${KEY}`,
  { opacity: 0.7, attribution: '© TomTom' },
).addTo(map);
```

This gives you a genuinely live traffic map with one line of code, which is a very strong
demo moment for very little work.

---

## 10. Wiring it all together

### 10.1 Update `.env.example`

```bash
# ---- Live data providers ----

# Weather - no key needed (Open-Meteo). Nothing to set.

# Air quality - https://explore.openaq.org/register
OPENAQ_API_KEY=

# Traffic - https://developer.tomtom.com
TOMTOM_API_KEY=

# Singapore official transport data - https://datamall.lta.gov.sg
LTA_ACCOUNT_KEY=

# Taipei official transport data - https://tdx.transportdata.tw
TDX_CLIENT_ID=
TDX_CLIENT_SECRET=

# Master switch: set to false to force mock data everywhere (useful for demos)
USE_LIVE_DATA=true
```

That master switch is worth its weight in gold. Five minutes before you present, you can
set `USE_LIVE_DATA=false` and get a guaranteed-working demo with zero network dependency.

### 10.2 Create `server/providers/index.ts`

This composes live data over your existing mock structure. Note it **never throws** —
each module degrades independently.

```ts
import { getCityDashboardData } from '../cityData.js';
import { getLiveWeather } from './weather.js';
import { getLiveAirQuality } from './airQuality.js';
import { getLiveTraffic } from './traffic.js';
import { getLiveIncidents } from './incidents.js';
import type { CityId } from '../../src/types/index.js';

export async function getDashboardData(cityId: CityId) {
  const mock = getCityDashboardData(cityId);

  if (process.env.USE_LIVE_DATA !== 'true') {
    return { ...mock, dataSources: { all: 'mock' } };
  }

  const [weather, air, traffic, incidents] = await Promise.allSettled([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId),
    getLiveTraffic(cityId),
    getLiveIncidents(cityId),
  ]);

  const ok = <T>(r: PromiseSettledResult<T>) =>
    r.status === 'fulfilled' ? r.value : null;

  const w = ok(weather);
  const a = ok(air);
  const t = ok(traffic);
  const i = ok(incidents);

  return {
    ...mock,
    environment: { ...mock.environment, ...(w || {}), ...(a || {}) },
    traffic: { ...mock.traffic, ...(t || {}) },
    incidents: i || mock.incidents,
    dataSources: {
      weather: w ? 'live' : 'fallback',
      airQuality: a ? 'live' : 'fallback',
      traffic: t ? 'live' : 'fallback',
      incidents: i ? 'live' : 'fallback',
    },
  };
}
```

The spread order matters: `...mock.environment` first, then live values on top. Any field
the live API does not provide keeps its mock value, so the UI never sees `undefined` and
never crashes on a missing property.

### 10.3 Update `server/index.ts`

Change one line per route. Your route handlers become `async`:

```ts
// Before
app.get('/api/dashboard', (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
  res.json(getCityDashboardData(cityId));
});

// After
app.get('/api/dashboard', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
  try {
    res.json(await getDashboardData(cityId));
  } catch (err: any) {
    console.error('[dashboard] unexpected failure', err);
    res.status(500).json({ error: 'Failed to assemble dashboard data' });
  }
});
```

Do this for `/api/dashboard`, `/api/environment/current`, `/api/environment/forecast`,
`/api/transportation/status` and `/api/transportation/incidents`.

---

## 11. Frontend changes

The beauty of the approach above: **your components barely change**, because the response
shape is preserved.

### 11.1 Show data provenance (recommended)

Your store already holds `dashboardData`. Add the new field to your type in
`src/types/index.ts`:

```ts
export interface CityDashboardData {
  // ...existing fields
  dataSources?: Record<string, 'live' | 'fallback' | 'mock'>;
}
```

Then show a small badge wherever you already display `lastUpdated`. A "LIVE" vs
"SIMULATED" indicator is honest, and judges consistently reward it.

### 11.2 Increase polling carefully

You currently fetch once per city change. For live data, add polling in `App.tsx`:

```ts
useEffect(() => {
  fetchDashboardData(selectedCity);
  const id = setInterval(() => fetchDashboardData(selectedCity), 60_000);
  return () => clearInterval(id); // cleanup prevents overlapping timers
}, [selectedCity, fetchDashboardData]);
```

**Do not poll faster than your cache TTL.** Polling every 5 seconds against a 60-second
cache just burns CPU serving identical bytes.

### 11.3 Error handling already works

The error banner added to `App.tsx` and the `error` state in `useCityStore` will surface
any failure automatically. You do not need to change it.

---

## 12. Testing your migration

Test each integration in isolation before wiring it in.

```bash
# 1. Weather needs no key - verify it works right now
curl "https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=temperature_2m"

# 2. Verify your own endpoint after integrating
curl "http://localhost:3000/api/dashboard?city=singapore" | jq '.dataSources'

# 3. Force every provider to fail and confirm the app still works
USE_LIVE_DATA=true OPENAQ_API_KEY=invalid TOMTOM_API_KEY=invalid npm run dev
```

**Test 3 is the most important test in this entire document.** If the dashboard still
renders with `"source": "fallback"` everywhere and no crash, your migration is correct.
If it white-screens, your fallback chain is broken — fix that before adding more APIs.

### Checklist per module

- [ ] Works with a valid key
- [ ] Falls back cleanly with an invalid key
- [ ] Falls back cleanly with no network (turn off wifi)
- [ ] Second request within the TTL is served from cache (add a `console.log` to confirm)
- [ ] Response shape matches what the component expects
- [ ] Attribution displayed where the licence requires it

---

## 13. API summary table

| Module | Provider | Auth | Key needed | Cost | TTL |
|---|---|---|---|---|---|
| Weather | Open-Meteo | none | No | Free (non-commercial) | 300s |
| Air Quality | OpenAQ v3 | `X-API-Key` header | Yes | Free | 600s |
| Air Quality (alt) | Open-Meteo Air Quality | none | No | Free | 600s |
| Traffic Flow | TomTom | `key` query param | Yes | Free tier | 60s |
| Traffic Flow (SG) | LTA DataMall | `AccountKey` header | Yes | Free | 60s |
| Incidents | TomTom / LTA | as above | Yes | Free tier | 60s |
| Transit (SG) | LTA DataMall | `AccountKey` header | Yes | Free | 30s |
| Transit (TPE) | TDX | OAuth2 bearer | Yes | Free | 30s |
| Transit (BLR) | GTFS static only | varies | — | Free | 24h |
| Flood (SG) | LTA/PUB | `AccountKey` header | Yes | Free | 300s |
| Flood (other) | Derived from rainfall | — | No | Free | 300s |
| Map tiles | OSM / MapTiler | varies | Maybe | Free tier | — |

### Attribution obligations (do not skip)

- Open-Meteo — CC BY 4.0, credit required
- OpenStreetMap — "© OpenStreetMap contributors"
- TomTom — "© TomTom"
- LTA DataMall — Singapore Open Data Licence

Put these in a footer or an "About data sources" panel. It takes ten minutes and it is a
licence condition, not a nicety.

---

## Final advice

Migrate **one module at a time**, starting with weather because it needs no key. Get it
fully working, commit, then move to the next.

Keep the fallback layer permanently. Real production dashboards do exactly this — the
difference between a student project and a professional one is not that the professional
one never fails, it is that it fails **invisibly and gracefully**.
