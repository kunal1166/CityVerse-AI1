import './env.js'; // must stay first: loads .env.local / .env before other modules read process.env
import express from 'express';
import path from 'path';
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
import { CityId } from '../src/types/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// The AI engine is resolved by ./aiProvider.ts from environment variables.
// Supported: Anthropic, OpenAI, Groq, OpenRouter, local Ollama, or offline mode.

// REST API Routes

// 1. Full Dashboard Summary Endpoint
app.get('/api/dashboard', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
  const data = getCityDashboardData(cityId);

  // Fetch both at once rather than one after the other - halves the wait.
  // Promise.all is safe here because neither helper ever rejects; they return null.
  const [weather, air, traffic] = await Promise.all([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId),
    getLiveTraffic(cityId),
  ]);

  // Overlay whatever succeeded. Anything that failed keeps its mock value.
  if (weather) data.environment = { ...data.environment, ...weather };
  if (air) data.environment = { ...data.environment, ...air };
  if (traffic) data.traffic = { ...data.traffic, ...traffic };

  // --- Prediction -------------------------------------------------------
  // Fit a line through observed rainfall vs traffic, then read predicted
  // values off that line using the live rainfall forecast.
  // Always returns an object with `available`, so the UI has one shape to render.
  const HORIZONS = [1, 4, 12]; // hours ahead
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
      // forecast[0] is the NEXT hour, so +1h is index 0, +4h is index 3, etc.
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
    // Computed with the same least-squares routine as `prediction`, so the
    // rainfall/speed coefficient shown in the matrix always matches the model.
    correlations: computeCorrelations(data.hourlyTrends),
  });
});

// 2. Transportation Status Endpoint
app.get('/api/transportation/status', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
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
  const cityId = (req.query.city as CityId) || 'singapore';
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    incidents: data.incidents,
  });
});

// 4. Resolve Incident Endpoint
app.post('/api/transportation/incidents/:id/resolve', (req, res) => {
  const { id } = req.params;
  const cityId = (req.query.city as CityId) || 'singapore';
  const success = resolveCityIncident(cityId, id);
  res.json({ success, incidentId: id });
});

// 5. Environment Current Status Endpoint
app.get('/api/environment/current', async (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
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
  const cityId = (req.query.city as CityId) || 'singapore';
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
  const cityId = (req.query.city as CityId) || 'singapore';
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
app.get('/api/analytics', (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    trends: data.hourlyTrends,
    correlations: [
      ...computeCorrelations(data.hourlyTrends),
    ],
  });
});

// 9. Reports Archive Endpoint
app.get('/api/reports', (req, res) => {
  const cityId = (req.query.city as CityId) || 'singapore';
  res.json({
    reports: [
      { id: 'REP-2026-0723', title: 'Daily Smart City Operational Intelligence Brief', date: '2026-07-23', cityId, author: 'AI Smart City Engine', status: 'Completed', classification: 'Official Use Only' },
      { id: 'REP-2026-0716', title: 'Weekly Urban Mobility & Environmental Health Audit', date: '2026-07-16', cityId, author: 'Command Center Analytics', status: 'Archived', classification: 'Official Use Only' },
      { id: 'REP-2026-0709', title: 'Monsoon Flood Resilience & Traffic Diverter Performance', date: '2026-07-09', cityId, author: 'Disaster Risk Management', status: 'Archived', classification: 'Official Use Only' },
    ],
  });
});

// 10. AI Analysis Endpoint (provider-agnostic: Anthropic / OpenAI / Groq / OpenRouter / Ollama)
app.post('/api/ai/analyze', async (req, res) => {
  const { cityId = 'singapore', userQuery } = req.body;
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
    // Provider errored, timed out, or returned malformed JSON — fall through to offline briefing.
  }

  // Offline briefing engine: keeps the demo fully functional with no API key or no network.
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

// 11. AI Engine Info Endpoint (reports which provider/model is currently active)
app.get('/api/ai/info', (req, res) => {
  res.json(getProviderInfo());
});

// 12. Simulation Incident Injection Endpoint
app.post('/api/simulation/inject', (req, res) => {
  const { cityId = 'singapore', incident } = req.body;
  const newIncident = injectCityIncident(cityId as CityId, incident || {});
  res.json({ success: true, incident: newIncident });
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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