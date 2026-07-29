import './env.js'; 
import express from 'express';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  generateBriefing,
  getProviderInfo,
  isAiEnabled,
  logProviderStatus,
} from './aiProvider.js';
import { getCityDashboardData, injectCityIncident, resolveCityIncident } from './cityData.js';
import { getLiveWeather } from './liveWeather.js';
import { getLiveAirQuality } from './liveAirQuality.js';
import { getLiveTraffic, logTrafficStatus } from './liveTraffic.js';
import { getLiveRoads } from './liveRoads.js';
import { buildModel, predict, describeModel, computeCorrelations } from './predictionModel.js';
import fs from 'node:fs';
import type { CityId } from '../shared/types.js';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize the Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to dynamically evaluate Flood Risk Level based on live rainfall
function calculateFloodRisk(rainRate: number): 'Low' | 'Moderate' | 'High' | 'Critical' {
  if (rainRate > 25) return 'Critical';
  if (rainRate > 10) return 'High';
  if (rainRate > 2) return 'Moderate';
  return 'Low';
}

// REST API Routes

// 1. Full Dashboard Summary Endpoint
app.get('/api/dashboard', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);

  const [weather, air, traffic] = await Promise.all([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId),
    getLiveTraffic(cityId),
  ]);

  if (weather) data.environment = { ...data.environment, ...weather };
  if (air) data.environment = { ...data.environment, ...air };
  if (traffic) data.traffic = { ...data.traffic, ...traffic };

  // 1. Update Flood Risk Level dynamically
  const rainRate = weather?.rainfallRate ?? data.environment.rainfallRate ?? 0;
  data.environment.floodRiskLevel = calculateFloodRisk(rainRate);

  // 2. Dynamically calculate Canal Capacity
  const canalCapacity = Math.min(100, Math.round(15 + rainRate * 3.5));
  data.environment.canalCapacityThreshold = `${canalCapacity}% Full`;

  // 3. Dynamic Emergency Alert Banner injection
  const trafficIndex = data.traffic.congestionIndex || 0;
  if (rainRate > 15) {
    data.incidents.unshift({
      id: 'ALERT-LIVE-FLOOD',
      title: `MONSOON FLASH FLOOD WARNING — Heavy rainfall detected (${rainRate} mm/h). Dewatering pumps engaged.`,
      severity: 'critical',
      location: 'Low-lying drainage boxes & arterial underpasses',
      time: 'Just now',
    } as any);
  } else if (trafficIndex > 70) {
    data.incidents.unshift({
      id: 'ALERT-LIVE-TRAFFIC',
      title: `ARTERIAL CONGESTION ALERT — Citywide traffic index at ${trafficIndex}%. Signal split extensions active.`,
      severity: 'warning',
      location: 'Primary expressway corridors',
      time: 'Just now',
    } as any);
  }

  // 4. Populate Live Dynamic Sensors
  // NOTE: merge live readings into the existing sensor objects rather than
  // replacing them outright — the old code swapped in a differently-shaped
  // payload (no `coordinates`, no `cityId`, `reading` instead of `value`/`unit`,
  // uppercase `type`/`status`) which crashed the map when it tried to place
  // a marker with an undefined LatLng.
  data.sensors = data.sensors.map((s) => {
    if (s.id === 'SEN-TP-01') {
      return {
        ...s,
        value: Number((0.45 + rainRate * 0.1).toFixed(2)),
        status: rainRate > 15 ? ('warning' as const) : ('normal' as const),
        lastUpdated: 'Just now',
      };
    }
    if (s.id === 'SEN-TP-02') {
      const aqiVal = air?.aqi ?? data.environment.aqi;
      return {
        ...s,
        value: aqiVal,
        status: aqiVal > 50 ? ('warning' as const) : ('normal' as const),
        lastUpdated: 'Just now',
      };
    }
    if (s.id === 'SEN-TP-03') {
      return {
        ...s,
        value: weather?.temp ?? data.environment.temp,
        status: 'normal' as const,
        lastUpdated: 'Just now',
      };
    }
    return s;
  });

  const HORIZONS = [1, 4, 12];
  let prediction: any = {
    available: false,
    reason: 'No live forecast available',
    horizons: [],
  };

  const model = buildModel(data.hourlyTrends);

  if (!model) {
    prediction = {
      available: false,
      reason: 'Insufficient rainfall variation to fit a model',
      horizons: [],
    };
  } else if (weather && weather.forecast.length > 0) {
    const horizons = HORIZONS
      .filter((h) => weather.forecast.length >= h)
      .map((h) => predict(model, weather.forecast[h - 1], h));

    prediction = {
      available: horizons.length > 0,
      model: describeModel(model),
      speedFit: model.speedFit,
      congestionFit: model.congestionFit,
      observedRainfallMax: Number(model.rainfallMax.toFixed(1)),
      horizons,
    };
  }

  res.json({
    ...data,
    weatherSource: weather ? 'live' : 'mock',
    airQualitySource: air ? 'live' : 'mock',
    trafficSource: traffic ? 'live' : 'mock',
    prediction,
    correlations: computeCorrelations(data.hourlyTrends),
  });
});

// 2. Transportation Status Endpoint
app.get('/api/transportation/status', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);

  const traffic = await getLiveTraffic(cityId);
  if (traffic) data.traffic = { ...data.traffic, ...traffic };

  res.json({
    cityId,
    timestamp: data.timestamp,
    traffic: data.traffic,
    transit: data.transit,
    trafficSource: traffic ? 'live' : 'mock',
  });
});

// 3. Incidents List Endpoint
app.get('/api/transportation/incidents', (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    incidents: data.incidents,
  });
});

// 4. Resolve Incident Endpoint
app.post('/api/transportation/incidents/:id/resolve', (req, res) => {
  const { id } = req.params;
  const cityId = (req.query.city as CityId) || 'taipei';
  const success = resolveCityIncident(cityId, id);
  res.json({ success, incidentId: id });
});

// 4b. Live Road Flow Endpoint
app.get('/api/transportation/roads', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  try {
    const roads = await getLiveRoads(cityId);
    res.json({
      cityId,
      live: roads !== null,
      roads: roads ?? [],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[roads] endpoint error:', err.message);
    res.json({ cityId, live: false, roads: [], fetchedAt: new Date().toISOString() });
  }
});

// 5. Environment Current Status Endpoint
app.get('/api/environment/current', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);

  const [weather, air] = await Promise.all([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId),
  ]);

  if (weather) data.environment = { ...data.environment, ...weather };
  if (air) data.environment = { ...data.environment, ...air };

  const rainRate = weather?.rainfallRate ?? data.environment.rainfallRate ?? 0;
  const canalCapacity = Math.min(100, Math.round(15 + rainRate * 3.5));
  const floodRiskStage = calculateFloodRisk(rainRate);

  const liveSensors = [
    {
      id: 'SEN-TP-01',
      name: 'Keelung River Water Level Node',
      type: 'FLOOD_STAGE',
      district: 'Songshan',
      reading: `${(0.45 + rainRate * 0.1).toFixed(2)} m`,
      status: rainRate > 15 ? 'WARNING' : 'NORMAL',
      lastSync: 'Just now',
    },
    {
      id: 'SEN-TP-02',
      name: 'Taipei EPA Air Monitoring Network',
      type: 'AQI',
      district: 'Xinyi District',
      reading: `${air?.aqi ?? data.environment.aqi} AQI`,
      status: (air?.aqi ?? data.environment.aqi) > 50 ? 'MODERATE' : 'NORMAL',
      lastSync: 'Just now',
    },
    {
      id: 'SEN-TP-03',
      name: 'Zhongshan Microclimate Doppler Station',
      type: 'WEATHER',
      district: 'Zhongshan',
      reading: `${weather?.temp ?? data.environment.temp} °C / ${weather?.humidity ?? data.environment.humidity}% RH`,
      status: 'NORMAL',
      lastSync: 'Just now',
    },
  ];

  res.json({
    cityId,
    environment: {
      ...data.environment,
      floodRiskLevel: floodRiskStage,
      canalCapacityThreshold: `${canalCapacity}% Full`,
    },
    sensors: liveSensors,
    weatherSource: weather ? 'live' : 'mock',
    airQualitySource: air ? 'live' : 'mock',
  });
});

// 6. Environment Forecast Endpoint
app.get('/api/environment/forecast', (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    hourly: data.hourlyTrends,
    forecast3Day: [
      { day: 'Tomorrow', condition: 'Thunderstorms / Rain', tempHigh: 31, tempLow: 25, aqi: data.environment.aqi + 4, floodRisk: 'Moderate' },
      { day: 'Day 2', condition: 'Partly Cloudy', tempHigh: 33, tempLow: 26, aqi: data.environment.aqi - 2, floodRisk: 'Low' },
      { day: 'Day 3', condition: 'Heavy Rainfall', tempHigh: 29, tempLow: 24, aqi: data.environment.aqi - 8, floodRisk: 'High' },
    ],
  });
});

// 7. Environment AQI Detail
app.get('/api/environment/aqi', (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    aqi: data.environment.aqi,
    aqiStatus: data.environment.aqiStatus,
    breakdown: data.environment.aqiBreakdown,
    sensors: data.sensors.filter(s => s.type === 'aqi'),
  });
});

// 8. Analytics Endpoint
app.get('/api/analytics', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  const data = getCityDashboardData(cityId);

  const [weather, air, traffic] = await Promise.all([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId),
    getLiveTraffic(cityId),
  ]);

  if (weather) data.environment = { ...data.environment, ...weather };
  if (air) data.environment = { ...data.environment, ...air };
  if (traffic) data.traffic = { ...data.traffic, ...traffic };

  res.json({
    cityId,
    timestamp: data.timestamp,
    trends: data.hourlyTrends,
    trafficTelemetry: data.traffic,
    environmentTelemetry: data.environment,
    correlations: [
      ...computeCorrelations(data.hourlyTrends),
    ],
  });
});

// 9. Reports Archive Endpoint
app.get('/api/reports', (req, res) => {
  const cityId = (req.query.city as CityId) || 'taipei';
  res.json({
    reports: [
      { id: 'REP-2026-0723', title: 'Daily Smart City Operational Intelligence Brief', date: '2026-07-23', cityId, author: 'AI Smart City Engine', status: 'Completed', classification: 'Official Use Only' },
      { id: 'REP-2026-0716', title: 'Weekly Urban Mobility & Environmental Health Audit', date: '2026-07-16', cityId, author: 'Command Center Analytics', status: 'Archived', classification: 'Official Use Only' },
      { id: 'REP-2026-0709', title: 'Monsoon Flood Resilience & Traffic Diverter Performance', date: '2026-07-09', cityId, author: 'Disaster Risk Management', status: 'Archived', classification: 'Official Use Only' },
    ],
  });
});

// 10. AI Analysis Endpoint
app.post('/api/ai/analyze', async (req, res) => {
  const { cityId = 'taipei', userQuery } = req.body;
  const currentData = getCityDashboardData(cityId as CityId);
  const cityName = currentData.city.name;

  if (isAiEnabled()) {
    const systemPrompt =
      'You are the Chief AI Smart City Command Advisor for a municipal command center. ' +
      'You respond only with valid JSON matching the requested schema, with no markdown fences or commentary.';

    const prompt = `
You are the Chief AI Smart City Command Advisor for the city of ${cityName}.
You are reviewing current live urban telemetry:
- Traffic Congestion Index: ${currentData.traffic.congestionIndex}% (Avg speed: ${currentData.traffic.avgSpeed} km/h, Active vehicle volume: ${currentData.traffic.vehicleCount})
- Public Transit On-time Rate: ${currentData.traffic.publicTransitOnTime}%
- Air Quality Index (AQI): ${currentData.environment.aqi} (${currentData.environment.aqiStatus}, PM2.5: ${currentData.environment.aqiBreakdown.pm25})
- Ambient Weather: ${currentData.environment.temp}°C, Humidity: ${currentData.environment.humidity}%, Rainfall Rate: ${currentData.environment.rainfallRate} mm/h
- Flood Risk Level: ${currentData.environment.floodRiskLevel}
- Active Incidents Count: ${currentData.incidents.length} (${currentData.incidents.map(i => i.title).join(', ')})
- Operator Query/Focus: ${userQuery || 'Provide an executive operational assessment and immediate recommended interventions.'}

Provide a structured operational briefing JSON object with the following EXACT schema:
{
  "summary": "Concise 2-3 sentence high-level executive situation summary.",
  "riskAssessment": "Assessment of key operational risks across mobility, environmental health, and infrastructure resilience.",
  "recommendations": [
    {
      "title": "Action Title",
      "action": "Specific tactical directive for command center staff.",
      "priority": "High" | "Medium" | "Low",
      "impact": "Quantified expected outcome."
    }
  ],
  "suggestedDispatch": ["Dispatch team 1", "Dispatch team 2"]
}
Strictly return valid JSON with no markdown block formatting.
`;

    const parsed = await generateBriefing(prompt, systemPrompt);
    if (parsed) {
      return res.json(parsed);
    }
  }

  // Offline briefing engine fallback
  res.json({
    summary: `Command Center AI Advisory for ${cityName}: Urban mobility is operating at ${currentData.traffic.congestionIndex}% congestion capacity. Environmental parameters show AQI at ${currentData.environment.aqi} (${currentData.environment.aqiStatus}) with rainfall at ${currentData.environment.rainfallRate} mm/h.`,
    riskAssessment: `Primary operational threat is potential bottleneck cascading on primary expressways and flood stage elevation in low-lying drainage boxes.`,
    recommendations: [
      {
        title: 'Adaptive Signal Timing Calibration',
        action: 'Extend green signal split by +15% on high-volume entry corridors.',
        priority: 'High',
        impact: 'Reduces queue tailbacks by approximately 18% in 30 minutes.',
      },
      {
        title: 'Stormwater Infrastructure Activation',
        action: 'Deploy automated dewatering pumps at monitored low-lying intersections.',
        priority: currentData.environment.rainfallRate > 15 ? 'High' : 'Medium',
        impact: 'Mitigates flash flood accumulation risk across primary underpasses.',
      },
      {
        title: 'Public Transit Feeder Rebalancing',
        action: 'Re-route auxiliary electric buses to absorb commuter demand at high-occupancy MRT/metro nodes.',
        priority: 'Medium',
        impact: 'Stabilizes platform crowd density during peak commuter windows.',
      },
    ],
    suggestedDispatch: ['Traffic Police Rapid Response Precinct', 'Municipal Drainage Quick Reaction Team'],
  });
});

// 10b. Real Agentic AI Environment Analysis Endpoint
app.post('/api/agent/analyze-environment', async (req, res) => {
  try {
    const { region, pastAvgTemp, humidity } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    });
    
    const prompt = `You are an autonomous climate command center AI managing the ${region} region. 
    The recent 7-day historical average temperature is ${pastAvgTemp}°C with a relative humidity of ${humidity}%. 
    Based strictly on these physical climate metrics, predict the temperature for the upcoming week (as a single float number), determine a risk level ('Nominal', 'Moderate Thermal Warning', or 'Critical Heat Risk'), and provide a single-sentence autonomous mitigation directive.
    
    You must respond ONLY with a raw, valid JSON object exactly matching this schema. Do not include markdown formatting or backticks:
    {
      "projectedTemp": 28.5,
      "riskLevel": "Critical Heat Risk",
      "aiDirective": "Activating regional cooling corridors."
    }`;

    const result = await model.generateContent(prompt);
    
    const responseText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    res.json({
      success: true,
      region,
      pastAvgTemp,
      projectedTemp: aiData.projectedTemp,
      humidity,
      riskLevel: aiData.riskLevel,
      aiDirective: aiData.aiDirective,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Agent execution error:', error);
    
    const projectedFallbackTemp = Number((req.body.pastAvgTemp + 1.6).toFixed(1));
    res.json({
      success: true,
      region: req.body.region,
      pastAvgTemp: req.body.pastAvgTemp,
      projectedTemp: projectedFallbackTemp,
      humidity: req.body.humidity,
      riskLevel: projectedFallbackTemp > 28 ? 'Critical Heat Risk' : 'Moderate Thermal Warning',
      aiDirective: `[SIMULATION FALLBACK] API unstable. Activating localized emergency protocols for ${req.body.region}.`,
      timestamp: new Date().toISOString()
    });
  }
});

// 10c. Real OSM Geometry Endpoint
const geometryCache = new Map<string, unknown>();

app.get('/api/geometry', (req, res) => {
  const cityId = (req.query.city as string) || 'taipei';
  if (!/^[a-z]+$/.test(cityId)) {
    return res.status(400).json({ error: 'Invalid city id' });
  }

  if (geometryCache.has(cityId)) {
    return res.json(geometryCache.get(cityId));
  }

  const file = path.join(process.cwd(), 'server', 'data', `osm-${cityId}.json`);
  if (!fs.existsSync(file)) {
    return res.status(404).json({
      error: 'No OSM geometry generated for this city',
      hint: 'Run: node scripts/fetch-osm-geometry.mjs ' + cityId,
    });
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    geometryCache.set(cityId, parsed);
    res.json(parsed);
  } catch (err: any) {
    console.error(`[geometry] Failed to read ${file}:`, err.message);
    res.status(500).json({ error: 'Geometry file is corrupt' });
  }
});

// 10d. Agentic Analytics Insight Endpoint
app.post('/api/agent/analytics-insight', async (req, res) => {
  const { correlations, trends, cityId } = req.body;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment variables.");

    const prompt = `You are a specialized predictive data scientist AI for the city of ${cityId}.
    Analyze this cross-domain correlation matrix: ${JSON.stringify(correlations)}
    and the recent 24-hour telemetry trends: ${JSON.stringify(trends ? trends.slice(-6) : [])}.
    
    Identify the highest risk urban bottleneck from these correlations and provide a specific, strategic 3-horizon prediction (1h, 4h, 12h) with an autonomous mitigation directive for each.
    
    You must respond ONLY with a raw, valid JSON object exactly matching this schema. Do not include markdown formatting or backticks:
    {
      "primaryRisk": "Concise summary of the primary risk identified from correlations.",
      "horizons": [
        { "time": "+1 Hour", "forecast": "Short prediction based on data.", "directive": "Immediate action command." },
        { "time": "+4 Hours", "forecast": "Medium prediction based on data.", "directive": "Medium-term action command." },
        { "time": "+12 Hours", "forecast": "Long prediction based on data.", "directive": "Long-term policy adjustment." }
      ]
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Direct API call failed");

    let responseText = data.candidates[0].content.parts[0].text;
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    return res.json({ success: true, insights: aiData });

  } catch (error) {
    console.error(`Analytics AI Agent error:`, error);
    return res.json({
      success: true,
      insights: {
        primaryRisk: "[SIMULATION ACTIVE] Strong inverse correlation detected between precipitation and arterial throughput.",
        horizons: [
          { time: "+1 Hour", forecast: "Speed degradation likely to reach critical thresholds.", directive: "Initiate localized traffic signal rerouting." },
          { time: "+4 Hours", forecast: "Volume bottleneck expansion anticipated in low-lying sectors.", directive: "Pre-deploy emergency transit units to secondary corridors." },
          { time: "+12 Hours", forecast: "Clearance phase and grid normalization.", directive: "Monitor arterial flow recovery and log infrastructure stress." }
        ]
      }
    });
  }
});

// 11. AI Engine Info Endpoint
app.get('/api/ai/info', (req, res) => {
  res.json(getProviderInfo());
});

// 12. Simulation Incident Injection Endpoint
app.post('/api/simulation/inject', (req, res) => {
  const { cityId = 'taipei', incident } = req.body;
  const newIncident = injectCityIncident(cityId as CityId, incident || {});
  res.json({ success: true, incident: newIncident });
});

// Start Server with Vite Middleware
async function startServer() {
  const frontendRoot = path.resolve(process.cwd(), '../frontend');

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: frontendRoot, 
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(frontendRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CityVerse AI] Smart City Command Server running on http://localhost:${PORT}`);
    logProviderStatus();
    logTrafficStatus();
  });
}

startServer();