import './env.js'; // must stay first: loads .env.local / .env before other modules read process.env
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
import { buildModel, predict, describeModel, computeCorrelations } from './predictionModel.js';
import fs from 'node:fs';
import type { CityId } from '../shared/types.js';
import 'dotenv/config';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize the Gemini AI Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// The AI engine is resolved by ./aiProvider.ts from environment variables.
// Supported: Google Gemini, Anthropic, OpenAI, Groq, OpenRouter, local Ollama, or offline mode.

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

  res.json({
    cityId,
    environment: data.environment,
    sensors: data.sensors,
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
    
    // Ensure the API key is present so it doesn't crash on stage
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }

    // Use Gemini 1.5 Flash for high-speed hackathon responsiveness
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    });
    
    // The System Prompt forcing AI reasoning based on real telemetry
    const prompt = `You are an autonomous climate command center AI managing the ${region} region. 
    The recent 7-day historical average temperature is ${pastAvgTemp}°C with a relative humidity of ${humidity}%. 
    Based strictly on these physical climate metrics, predict the temperature for the upcoming week (as a single float number), determine a risk level ('Nominal', 'Moderate Thermal Warning', or 'Critical Heat Risk'), and provide a single-sentence autonomous mitigation directive.
    
    You must respond ONLY with a raw, valid JSON object exactly matching this schema. Do not include markdown formatting or backticks:
    {
      "projectedTemp": 28.5,
      "riskLevel": "Critical Heat Risk",
      "aiDirective": "Activating regional cooling corridors."
    }`;

    // Execute the live neural network call
    const result = await model.generateContent(prompt);
    
    // Clean the response to ensure it parses perfectly
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
    res.status(500).json({ success: false, error: 'AI Agent failed to evaluate telemetry' });
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
  // Resolve the frontend directory correctly relative to where the backend is running
  const frontendRoot = path.resolve(process.cwd(), '../frontend');

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: frontendRoot, // Tell Vite exactly where to find vite.config.ts
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