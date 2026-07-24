var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/env.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var root = process.cwd();
for (const file of [".env.local", ".env"]) {
  const full = import_node_path.default.join(root, file);
  if (import_node_fs.default.existsSync(full)) {
    import_dotenv.default.config({ path: full, quiet: true });
  }
}

// server/index.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);

// server/aiProvider.ts
var PROVIDERS = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    envKey: "ANTHROPIC_API_KEY",
    endpoint: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-haiku-4-5-20251001",
    dialect: "anthropic"
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    dialect: "openai"
  },
  groq: {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    dialect: "openai"
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    dialect: "openai"
  },
  ollama: {
    id: "ollama",
    label: "Ollama (local)",
    envKey: null,
    // runs locally, no API key
    // Resolved lazily in getEndpoint() so OLLAMA_HOST is read after env loading.
    endpoint: "/v1/chat/completions",
    defaultModel: "llama3.2",
    dialect: "openai"
  }
};
function readKey(name) {
  return (process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}
function getEndpoint(spec) {
  if (spec.id === "ollama") {
    return (process.env.OLLAMA_HOST || "http://localhost:11434") + spec.endpoint;
  }
  return spec.endpoint;
}
function resolveProvider() {
  const explicit = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (explicit && explicit !== "none") {
    const spec = PROVIDERS[explicit];
    if (!spec) {
      console.warn(
        `[CityVerse AI] Unknown AI_PROVIDER "${explicit}". Valid: ${Object.keys(PROVIDERS).join(", ")}, none.`
      );
      return null;
    }
    if (spec.envKey && !readKey(spec.envKey)) {
      console.warn(
        `[CityVerse AI] AI_PROVIDER="${explicit}" but ${spec.envKey} is not set. Using offline briefing engine.`
      );
      return null;
    }
    return spec;
  }
  if (explicit === "none") return null;
  const order = [
    "anthropic",
    "openai",
    "groq",
    "openrouter"
  ];
  for (const id of order) {
    const spec = PROVIDERS[id];
    if (spec.envKey && readKey(spec.envKey)) return spec;
  }
  return null;
}
var cached = null;
function getActiveProvider() {
  if (!cached) cached = { spec: resolveProvider() };
  return cached.spec;
}
function getActiveModel() {
  const spec = getActiveProvider();
  if (!spec) return "offline-briefing-engine";
  return process.env.AI_MODEL || spec.defaultModel;
}
function getProviderInfo() {
  const spec = getActiveProvider();
  return {
    provider: spec ? spec.id : "none",
    label: spec ? spec.label : "Offline Briefing Engine",
    model: getActiveModel(),
    live: Boolean(spec)
  };
}
function isAiEnabled() {
  return Boolean(getActiveProvider());
}
function extractJson(raw) {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}
async function generateBriefing(prompt, systemPrompt) {
  const spec = getActiveProvider();
  if (!spec) return null;
  const model = getActiveModel();
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 2e4);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let headers;
    let body;
    if (spec.dialect === "anthropic") {
      headers = {
        "Content-Type": "application/json",
        "x-api-key": readKey(spec.envKey),
        "anthropic-version": "2023-06-01"
      };
      body = {
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      };
    } else {
      headers = { "Content-Type": "application/json" };
      if (spec.envKey && readKey(spec.envKey)) {
        headers.Authorization = `Bearer ${readKey(spec.envKey)}`;
      }
      body = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      };
    }
    const response = await fetch(getEndpoint(spec), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[CityVerse AI] ${spec.label} responded ${response.status}. ${detail.slice(0, 300)}`
      );
      return null;
    }
    const data = await response.json();
    const rawText = spec.dialect === "anthropic" ? (data?.content ?? []).filter((block) => block?.type === "text").map((block) => block.text).join("\n") : data?.choices?.[0]?.message?.content ?? "";
    if (!rawText) {
      console.error("[CityVerse AI] Empty response from provider.");
      return null;
    }
    return JSON.parse(extractJson(rawText));
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? `timed out after ${timeoutMs}ms` : String(err);
    console.error(`[CityVerse AI] AI request failed (${reason}). Using offline briefing.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
function logProviderStatus() {
  const info = getProviderInfo();
  if (info.live) {
    console.log(`[CityVerse AI] AI engine: ${info.label} (${info.model})`);
  } else {
    console.log(
      "[CityVerse AI] AI engine: offline briefing engine (no API key configured)."
    );
    console.log(
      "[CityVerse AI] For live AI, add a free Groq key to .env.local: https://console.groq.com/keys"
    );
  }
}

// server/cityData.ts
var CITIES = {
  singapore: {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    flag: "\u{1F1F8}\u{1F1EC}",
    lat: 1.3521,
    lng: 103.8198,
    zoom: 12,
    timezone: "Asia/Singapore (SGT UTC+8)",
    population: "5.92M",
    keyDistricts: ["Marina Bay", "Orchard Road", "Jurong East", "Changi", "Woodlands", "Paya Lebar"]
  },
  taipei: {
    id: "taipei",
    name: "Taipei",
    country: "Taiwan",
    flag: "\u{1F1F9}\u{1F1FC}",
    lat: 25.033,
    lng: 121.5654,
    zoom: 12,
    timezone: "Asia/Taipei (CST UTC+8)",
    population: "2.50M",
    keyDistricts: ["Xinyi District", "Daan District", "Neihu Tech Park", "Zhongshan", "Songshan", "Wanhua"]
  },
  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    country: "India",
    flag: "\u{1F1EE}\u{1F1F3}",
    lat: 12.9716,
    lng: 77.5946,
    zoom: 12,
    timezone: "Asia/Kolkata (IST UTC+5:30)",
    population: "13.19M",
    keyDistricts: ["ORR Electronic City", "Whitefield", "Indiranagar", "Hebbal", "Koramangala", "Central Silk Board"]
  }
};
var dynamicIncidents = {
  singapore: [
    {
      id: "INC-SG-101",
      cityId: "singapore",
      title: "PIE Expressway Vehicle Stalls",
      type: "congestion",
      severity: "major",
      locationName: "Pan Island Expressway (PIE) near Toa Payoh Flyover",
      coordinates: [1.332, 103.848],
      timestamp: "12 mins ago",
      estimatedResolution: "25 mins",
      status: "active",
      affectedLanes: 2,
      description: "Heavy congestion building up on Lane 1 & 2 due to a disabled multi-axle trailer.",
      recommendedAction: "Adjust VMS message boards at Kallang Way and reroute to MacRitchie Viaduct."
    },
    {
      id: "INC-SG-102",
      cityId: "singapore",
      title: "Flash Flood Watch - Sensor Triggered",
      type: "closure",
      severity: "critical",
      locationName: "Dunearn Road / Bukit Timah Junction",
      coordinates: [1.325, 103.811],
      timestamp: "5 mins ago",
      estimatedResolution: "40 mins",
      status: "active",
      affectedLanes: 3,
      description: "Water level reached 82% capacity in Rochor Canal drain box after sudden downpour.",
      recommendedAction: "Dispatch PUB Quick Response Team and trigger automated drainage pumps."
    },
    {
      id: "INC-SG-103",
      cityId: "singapore",
      title: "North-South Line Signal Calibration",
      type: "transit_delay",
      severity: "minor",
      locationName: "Bishan MRT Interchange",
      coordinates: [1.3508, 103.8482],
      timestamp: "18 mins ago",
      estimatedResolution: "15 mins",
      status: "in_progress",
      affectedLanes: 0,
      description: "Headway extended by 3 minutes due to automated signaling verification.",
      recommendedAction: "Deploy extra feeder buses at Bishan Bus Interchange."
    }
  ],
  taipei: [
    {
      id: "INC-TP-201",
      cityId: "taipei",
      title: "Jianguo Elevated Expressway Collision",
      type: "accident",
      severity: "critical",
      locationName: "Jianguo S. Rd Viaduct near Daan Park Exit",
      coordinates: [25.03, 121.536],
      timestamp: "8 mins ago",
      estimatedResolution: "35 mins",
      status: "active",
      affectedLanes: 2,
      description: "Two-car collision blocking northbound inner lanes during peak flow.",
      recommendedAction: "Alert Traffic Police Precinct 3; adjust traffic light timing on Heping E. Rd."
    },
    {
      id: "INC-TP-202",
      cityId: "taipei",
      title: "Neihu Tech Park Gridlock",
      type: "congestion",
      severity: "major",
      locationName: "Tiding Blvd Sec 2 & Gangqian Rd",
      coordinates: [25.078, 121.571],
      timestamp: "22 mins ago",
      estimatedResolution: "30 mins",
      status: "active",
      affectedLanes: 3,
      description: "Commuter spillover from Huandong Viaduct causing 4.2km queue.",
      recommendedAction: "Activate tidal lane controls across Minquan Bridge."
    }
  ],
  bengaluru: [
    {
      id: "INC-BLR-301",
      cityId: "bengaluru",
      title: "Silk Board Junction Bottleneck Spillover",
      type: "congestion",
      severity: "critical",
      locationName: "Central Silk Board Flyover & Hosur Road Ramp",
      coordinates: [12.9175, 77.6238],
      timestamp: "14 mins ago",
      estimatedResolution: "50 mins",
      status: "active",
      affectedLanes: 4,
      description: "Traffic speed dropped below 8 km/h across Outer Ring Road interchange.",
      recommendedAction: "Prioritize traffic police signal override at HSR Layout 27th Main signal."
    },
    {
      id: "INC-BLR-302",
      cityId: "bengaluru",
      title: "Underpass Waterlogging Warning",
      type: "closure",
      severity: "major",
      locationName: "Hebbal Flyover Underpass / Bellary Road",
      coordinates: [13.0358, 77.597],
      timestamp: "28 mins ago",
      estimatedResolution: "45 mins",
      status: "in_progress",
      affectedLanes: 2,
      description: "Heavy precipitation causing 25cm water accumulation in underpass trough.",
      recommendedAction: "Deploy BBMP high-capacity dewatering pumps and diverters."
    },
    {
      id: "INC-BLR-303",
      cityId: "bengaluru",
      title: "Metro Construction Lane Reduction",
      type: "construction",
      severity: "minor",
      locationName: "Whitefield Main Road near ITPL Gate 2",
      coordinates: [12.986, 77.738],
      timestamp: "1 hour ago",
      estimatedResolution: "Ongoing",
      status: "active",
      affectedLanes: 1,
      description: "Right lane barricaded for pier girder installation work.",
      recommendedAction: "Enforce no parking within 200m radius to maintain 2 lane flow."
    }
  ]
};
function getCityDashboardData(cityId) {
  const city = CITIES[cityId] || CITIES.singapore;
  const incidents = dynamicIncidents[cityId] || [];
  const metricsMap = {
    singapore: {
      traffic: {
        congestionIndex: 42,
        avgSpeed: 48.5,
        vehicleCount: 184200,
        bottleneckCount: 3,
        incidentCount: incidents.filter((i) => i.status === "active").length,
        publicTransitOnTime: 99.1,
        peakHourComparison: -3.2
      },
      environment: {
        aqi: 38,
        aqiStatus: "Good",
        temp: 31.4,
        humidity: 82,
        rainfallRate: 14.2,
        floodRiskLevel: "Moderate",
        aqiBreakdown: { pm25: 12, pm10: 24, no2: 18, so2: 6, co: 0.4, o3: 28 },
        windSpeed: 14,
        windDirection: "SSW"
      },
      sensors: [
        { id: "SEN-SG-01", cityId: "singapore", name: "Rochor Canal Water Stage", type: "flood_stage", coordinates: [1.305, 103.854], value: 1.84, unit: "m", status: "warning", lastUpdated: "2 mins ago", district: "Marina Bay" },
        { id: "SEN-SG-02", cityId: "singapore", name: "Bukit Timah Drainage Meter", type: "flood_stage", coordinates: [1.326, 103.812], value: 2.15, unit: "m", status: "critical", lastUpdated: "1 min ago", district: "Bukit Timah" },
        { id: "SEN-SG-03", cityId: "singapore", name: "NEA Changi AQI Station", type: "aqi", coordinates: [1.364, 103.991], value: 32, unit: "AQI", status: "normal", lastUpdated: "5 mins ago", district: "Changi" },
        { id: "SEN-SG-04", cityId: "singapore", name: "Jurong Industrial Pollution Monitor", type: "aqi", coordinates: [1.318, 103.706], value: 52, unit: "AQI", status: "normal", lastUpdated: "3 mins ago", district: "Jurong East" },
        { id: "SEN-SG-05", cityId: "singapore", name: "CTE Traffic Camera #14", type: "traffic_camera", coordinates: [1.35, 103.85], value: 68, unit: "veh/min", status: "normal", lastUpdated: "Just now", district: "Toa Payoh" }
      ],
      transit: [
        { id: "TR-SG-01", name: "North-South Line (NSL)", type: "MRT", status: "Normal", occupancyRate: 74, onTimePercentage: 99.4, activeVehicles: 48, disruptionsCount: 0 },
        { id: "TR-SG-02", name: "East-West Line (EWL)", type: "MRT", status: "Normal", occupancyRate: 81, onTimePercentage: 99.2, activeVehicles: 52, disruptionsCount: 0 },
        { id: "TR-SG-03", name: "Downtown Line (DTL)", type: "MRT", status: "Normal", occupancyRate: 62, onTimePercentage: 99.8, activeVehicles: 38, disruptionsCount: 0 },
        { id: "TR-SG-04", name: "SBS Transit Bus Route 190", type: "Bus", status: "Minor Delay", occupancyRate: 88, onTimePercentage: 94.2, activeVehicles: 24, disruptionsCount: 1 }
      ]
    },
    taipei: {
      traffic: {
        congestionIndex: 58,
        avgSpeed: 36.2,
        vehicleCount: 241e3,
        bottleneckCount: 5,
        incidentCount: incidents.filter((i) => i.status === "active").length,
        publicTransitOnTime: 98.4,
        peakHourComparison: 4.8
      },
      environment: {
        aqi: 64,
        aqiStatus: "Moderate",
        temp: 28.1,
        humidity: 76,
        rainfallRate: 4.5,
        floodRiskLevel: "Low",
        aqiBreakdown: { pm25: 22, pm10: 45, no2: 34, so2: 8, co: 0.7, o3: 42 },
        windSpeed: 11,
        windDirection: "ENE"
      },
      sensors: [
        { id: "SEN-TP-01", cityId: "taipei", name: "Keelung River Water Level Node", type: "flood_stage", coordinates: [25.071, 121.558], value: 0.95, unit: "m", status: "normal", lastUpdated: "3 mins ago", district: "Songshan" },
        { id: "SEN-TP-02", cityId: "taipei", name: "Xinyi EPA Air Monitoring Station", type: "aqi", coordinates: [25.034, 121.564], value: 68, unit: "AQI", status: "normal", lastUpdated: "1 min ago", district: "Xinyi District" },
        { id: "SEN-TP-03", cityId: "taipei", name: "Neihu Tech Corridor Optical Cam", type: "traffic_camera", coordinates: [25.079, 121.573], value: 92, unit: "veh/min", status: "warning", lastUpdated: "Just now", district: "Neihu Tech Park" }
      ],
      transit: [
        { id: "TR-TP-01", name: "Bannan Line (Blue Line)", type: "MRT", status: "Normal", occupancyRate: 89, onTimePercentage: 99.1, activeVehicles: 44, disruptionsCount: 0 },
        { id: "TR-TP-02", name: "Tamsui-Xinyi Line (Red Line)", type: "MRT", status: "Normal", occupancyRate: 78, onTimePercentage: 98.9, activeVehicles: 40, disruptionsCount: 0 },
        { id: "TR-TP-03", name: "Wenhu Line (Brown Line)", type: "MRT", status: "Normal", occupancyRate: 85, onTimePercentage: 97.8, activeVehicles: 30, disruptionsCount: 0 }
      ]
    },
    bengaluru: {
      traffic: {
        congestionIndex: 78,
        avgSpeed: 18.4,
        vehicleCount: 42e4,
        bottleneckCount: 11,
        incidentCount: incidents.filter((i) => i.status === "active").length,
        publicTransitOnTime: 86.5,
        peakHourComparison: 12.4
      },
      environment: {
        aqi: 134,
        aqiStatus: "Unhealthy for Sensitive Groups",
        temp: 27.2,
        humidity: 68,
        rainfallRate: 28.5,
        floodRiskLevel: "High",
        aqiBreakdown: { pm25: 58, pm10: 112, no2: 68, so2: 18, co: 1.8, o3: 45 },
        windSpeed: 8,
        windDirection: "SW"
      },
      sensors: [
        { id: "SEN-BLR-01", cityId: "bengaluru", name: "Silk Board Junction AQI Array", type: "aqi", coordinates: [12.917, 77.623], value: 168, unit: "AQI", status: "critical", lastUpdated: "2 mins ago", district: "Central Silk Board" },
        { id: "SEN-BLR-02", cityId: "bengaluru", name: "Hebbal Storm Drain Gauge", type: "flood_stage", coordinates: [13.036, 77.598], value: 2.85, unit: "m", status: "critical", lastUpdated: "Just now", district: "Hebbal" },
        { id: "SEN-BLR-03", cityId: "bengaluru", name: "Whitefield Traffic Sensor Node", type: "traffic_camera", coordinates: [12.985, 77.739], value: 115, unit: "veh/min", status: "warning", lastUpdated: "4 mins ago", district: "Whitefield" }
      ],
      transit: [
        { id: "TR-BLR-01", name: "Namma Metro Purple Line", type: "MRT", status: "Normal", occupancyRate: 94, onTimePercentage: 96.2, activeVehicles: 32, disruptionsCount: 0 },
        { id: "TR-BLR-02", name: "Namma Metro Green Line", type: "MRT", status: "Normal", occupancyRate: 88, onTimePercentage: 97, activeVehicles: 28, disruptionsCount: 0 },
        { id: "TR-BLR-03", name: "BMTC Vajra Volvo Feeder Network", type: "Bus", status: "Severe Delay", occupancyRate: 96, onTimePercentage: 74.5, activeVehicles: 180, disruptionsCount: 6 }
      ]
    }
  };
  const selectedMetrics = metricsMap[cityId] || metricsMap.singapore;
  const recommendations = [
    {
      id: `REC-${cityId.toUpperCase()}-01`,
      category: "transportation",
      priority: "high",
      title: "Automated Signal Split Adjustment",
      reasoning: `Peak flow directional bias detected towards key financial corridors. Congestion index reached ${selectedMetrics.traffic.congestionIndex}%.`,
      suggestedAction: "Increase green light time by +18 seconds on northbound arterials.",
      predictedImpact: "Estimated -14% delay reduction over 45 minutes.",
      timestamp: "3 mins ago"
    },
    {
      id: `REC-${cityId.toUpperCase()}-02`,
      category: "environment",
      priority: selectedMetrics.environment.floodRiskLevel === "High" || selectedMetrics.environment.floodRiskLevel === "Critical" ? "high" : "medium",
      title: "Storm Drain Dewatering Directive",
      reasoning: `Rainfall rate currently at ${selectedMetrics.environment.rainfallRate} mm/h with elevated drainage trough stage.`,
      suggestedAction: "Trigger auxiliary dewatering pumps and dispatch municipal response team.",
      predictedImpact: "Prevents flash flooding across primary underpasses.",
      timestamp: "8 mins ago"
    }
  ];
  const timeline = [
    {
      id: "TL-1",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
      timeAgo: "Just now",
      type: "ai_action",
      severity: "info",
      message: "AI Traffic Model updated signal sync across 14 smart intersections.",
      location: city.keyDistricts[0]
    },
    {
      id: "TL-2",
      timestamp: "10 mins ago",
      timeAgo: "10m ago",
      type: "incident",
      severity: incidents.some((i) => i.severity === "critical") ? "critical" : "warning",
      message: incidents[0] ? incidents[0].title : "Minor congestion buildup detected on arterial ring.",
      location: incidents[0] ? incidents[0].locationName : city.keyDistricts[1]
    },
    {
      id: "TL-3",
      timestamp: "25 mins ago",
      timeAgo: "25m ago",
      type: "weather",
      severity: selectedMetrics.environment.rainfallRate > 15 ? "warning" : "info",
      message: `Weather radar registered rain cell approaching with precipitation rate ${selectedMetrics.environment.rainfallRate} mm/h.`,
      location: "Citywide Corridor"
    }
  ];
  const hourlyTrends = [
    { time: "00:00", congestion: 12, avgSpeed: 62, aqi: selectedMetrics.environment.aqi - 8, rainfall: 0, vehicleVolume: 24e3 },
    { time: "03:00", congestion: 8, avgSpeed: 68, aqi: selectedMetrics.environment.aqi - 12, rainfall: 0, vehicleVolume: 12e3 },
    { time: "06:00", congestion: 28, avgSpeed: 52, aqi: selectedMetrics.environment.aqi - 5, rainfall: 2.1, vehicleVolume: 82e3 },
    { time: "09:00", congestion: selectedMetrics.traffic.congestionIndex + 15, avgSpeed: Math.max(12, selectedMetrics.traffic.avgSpeed - 12), aqi: selectedMetrics.environment.aqi + 15, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount },
    { time: "12:00", congestion: selectedMetrics.traffic.congestionIndex, avgSpeed: selectedMetrics.traffic.avgSpeed, aqi: selectedMetrics.environment.aqi, rainfall: selectedMetrics.environment.rainfallRate * 0.8, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.9 },
    { time: "15:00", congestion: selectedMetrics.traffic.congestionIndex + 5, avgSpeed: selectedMetrics.traffic.avgSpeed - 4, aqi: selectedMetrics.environment.aqi + 4, rainfall: selectedMetrics.environment.rainfallRate * 0.5, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.95 },
    { time: "18:00", congestion: Math.min(95, selectedMetrics.traffic.congestionIndex + 22), avgSpeed: Math.max(10, selectedMetrics.traffic.avgSpeed - 16), aqi: selectedMetrics.environment.aqi + 18, rainfall: selectedMetrics.environment.rainfallRate * 1.2, vehicleVolume: selectedMetrics.traffic.vehicleCount * 1.15 },
    { time: "21:00", congestion: Math.max(15, selectedMetrics.traffic.congestionIndex - 18), avgSpeed: selectedMetrics.traffic.avgSpeed + 12, aqi: selectedMetrics.environment.aqi - 2, rainfall: selectedMetrics.environment.rainfallRate * 0.2, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.6 }
  ];
  return {
    city,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    traffic: selectedMetrics.traffic,
    environment: selectedMetrics.environment,
    incidents,
    sensors: selectedMetrics.sensors,
    transit: selectedMetrics.transit,
    recommendations,
    timeline,
    hourlyTrends
  };
}
function injectCityIncident(cityId, incidentData) {
  const city = CITIES[cityId] || CITIES.singapore;
  const newIncident = {
    id: `INC-${cityId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    cityId,
    title: incidentData.title || "Simulated Emergency Incident",
    type: incidentData.type || "congestion",
    severity: incidentData.severity || "major",
    locationName: incidentData.locationName || `${city.keyDistricts[0]} Central Corridor`,
    coordinates: incidentData.coordinates || [city.lat + (Math.random() * 0.02 - 0.01), city.lng + (Math.random() * 0.02 - 0.01)],
    timestamp: "Just now",
    estimatedResolution: incidentData.estimatedResolution || "30 mins",
    status: "active",
    affectedLanes: incidentData.affectedLanes || 2,
    description: incidentData.description || "Simulated incident triggered by Command Center Operator.",
    recommendedAction: incidentData.recommendedAction || "Dispatch emergency unit and activate variable message signs."
  };
  if (!dynamicIncidents[cityId]) {
    dynamicIncidents[cityId] = [];
  }
  dynamicIncidents[cityId].unshift(newIncident);
  return newIncident;
}
function resolveCityIncident(cityId, incidentId) {
  if (dynamicIncidents[cityId]) {
    const item = dynamicIncidents[cityId].find((i) => i.id === incidentId);
    if (item) {
      item.status = "resolved";
      return true;
    }
  }
  return false;
}

// server/liveWeather.ts
var WEATHER_CODES = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  80: "Rain Showers",
  81: "Heavy Showers",
  82: "Violent Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Severe Thunderstorm"
};
var cache = /* @__PURE__ */ new Map();
var CACHE_SECONDS = 300;
async function getLiveWeather(cityId) {
  const city = CITIES[cityId] || CITIES.singapore;
  const hit = cache.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation&forecast_hours=24&timezone=auto`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8e3);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const json = await res.json();
    const c = json.current;
    if (!c) throw new Error('Response contained no "current" block');
    const times = json.hourly?.time ?? [];
    const precip = json.hourly?.precipitation ?? [];
    let startIndex = times.findIndex((t) => t > c.time);
    if (startIndex === -1) startIndex = times.length;
    const forecast = times.slice(startIndex).map((time, i) => ({
      time,
      precipitation: Number(precip[startIndex + i] ?? 0)
    }));
    const weather = {
      temp: Math.round(c.temperature_2m * 10) / 10,
      humidity: c.relative_humidity_2m,
      rainfallRate: c.precipitation,
      windSpeed: c.wind_speed_10m,
      condition: WEATHER_CODES[c.weather_code] || "Unknown",
      forecast
    };
    cache.set(cityId, { data: weather, expires: Date.now() + CACHE_SECONDS * 1e3 });
    console.log(
      `[weather] LIVE data for ${city.name}: ${weather.temp}C, ${weather.condition}, ${forecast.length}h forecast`
    );
    return weather;
  } catch (err) {
    console.warn(`[weather] Live fetch failed for ${city.name} (${err.message}). Using mock data.`);
    return null;
  }
}

// server/liveAirQuality.ts
var cache2 = /* @__PURE__ */ new Map();
var CACHE_SECONDS2 = 600;
var PM25_BREAKPOINTS = [
  { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }
];
function pm25ToAqi(c) {
  const bp = PM25_BREAKPOINTS.find((b) => c >= b.cLow && c <= b.cHigh);
  if (!bp) return c > 500.4 ? 500 : 0;
  return Math.round(
    (bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow) * (c - bp.cLow) + bp.iLow
  );
}
function toStatus(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 300) return "Unhealthy";
  return "Hazardous";
}
var num = (v) => typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10) / 10 : 0;
async function getLiveAirQuality(cityId) {
  const city = CITIES[cityId] || CITIES.singapore;
  const hit = cache2.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lng}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone,us_aqi&timezone=auto`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8e3);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Open-Meteo Air Quality returned ${res.status}`);
    const json = await res.json();
    const c = json.current;
    if (!c) throw new Error('Response contained no "current" block');
    const pm25 = num(c.pm2_5);
    const aqi = typeof c.us_aqi === "number" && Number.isFinite(c.us_aqi) ? Math.round(c.us_aqi) : pm25ToAqi(pm25);
    const air = {
      aqi,
      aqiStatus: toStatus(aqi),
      aqiBreakdown: {
        pm25,
        pm10: num(c.pm10),
        no2: num(c.nitrogen_dioxide),
        so2: num(c.sulphur_dioxide),
        // Open-Meteo reports CO in µg/m³; the dashboard shows mg/m³.
        co: num(num(c.carbon_monoxide) / 1e3),
        o3: num(c.ozone)
      }
    };
    cache2.set(cityId, { data: air, expires: Date.now() + CACHE_SECONDS2 * 1e3 });
    console.log(`[air] LIVE data for ${city.name}: AQI ${air.aqi} (${air.aqiStatus})`);
    return air;
  } catch (err) {
    console.warn(`[air] Live fetch failed for ${city.name} (${err.message}). Using mock data.`);
    return null;
  }
}

// server/liveTraffic.ts
var SAMPLE_POINTS = {
  singapore: [
    [1.3521, 103.8198],
    // Central
    [1.33, 103.85],
    // PIE / CTE corridor
    [1.305, 103.854],
    // Marina / Rochor
    [1.34, 103.705]
    // Jurong
  ],
  taipei: [
    [25.033, 121.5654],
    // Xinyi
    [25.0478, 121.517],
    // Zhongzheng
    [25.08, 121.57],
    // Neihu
    [25.017, 121.54]
    // Da'an south
  ],
  bengaluru: [
    [12.9716, 77.5946],
    // City centre
    [12.9352, 77.6245],
    // Koramangala
    [12.9698, 77.75],
    // Whitefield
    [12.917, 77.623]
    // Silk Board
  ]
};
var cache3 = /* @__PURE__ */ new Map();
var CACHE_SECONDS3 = 60;
async function getLiveTraffic(cityId) {
  const city = CITIES[cityId] || CITIES.singapore;
  const key = (process.env.TOMTOM_API_KEY || "").trim();
  if (!key) {
    return null;
  }
  const hit = cache3.get(cityId);
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }
  const points = SAMPLE_POINTS[cityId] || SAMPLE_POINTS.singapore;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8e3);
    const results = await Promise.allSettled(
      points.map(async ([lat, lng]) => {
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${key}&point=${lat},${lng}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`TomTom returned ${res.status}`);
        const json = await res.json();
        return json.flowSegmentData;
      })
    );
    clearTimeout(timer);
    const flows = results.filter((r) => r.status === "fulfilled").map((r) => r.value).filter((f) => f && f.freeFlowSpeed > 0 && typeof f.currentSpeed === "number");
    if (flows.length === 0) {
      throw new Error("every sample point failed");
    }
    const avgSpeed = flows.reduce((sum, f) => sum + f.currentSpeed, 0) / flows.length;
    const avgFreeFlow = flows.reduce((sum, f) => sum + f.freeFlowSpeed, 0) / flows.length;
    const bottleneckCount = flows.filter(
      (f) => f.currentSpeed / f.freeFlowSpeed < 0.6
    ).length;
    const traffic = {
      congestionIndex: Math.max(
        0,
        Math.min(100, Math.round((1 - avgSpeed / avgFreeFlow) * 100))
      ),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      bottleneckCount
    };
    cache3.set(cityId, { data: traffic, expires: Date.now() + CACHE_SECONDS3 * 1e3 });
    console.log(
      `[traffic] LIVE data for ${city.name}: ${traffic.congestionIndex}% congested, ${traffic.avgSpeed} km/h (${flows.length}/${points.length} points)`
    );
    return traffic;
  } catch (err) {
    console.warn(`[traffic] Live fetch failed for ${city.name} (${err.message}). Using mock data.`);
    return null;
  }
}
function logTrafficStatus() {
  if ((process.env.TOMTOM_API_KEY || "").trim()) {
    console.log("[traffic] TomTom key found - traffic will be LIVE.");
  } else {
    console.log(
      "[traffic] No TOMTOM_API_KEY set - using mock traffic. Get a free key at https://developer.tomtom.com"
    );
  }
}

// server/predictionModel.ts
function fitLinear(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const denom = Math.sqrt(sxx * syy);
  const r = denom === 0 ? 0 : sxy / denom;
  return {
    slope: Number(slope.toFixed(3)),
    intercept: Number(intercept.toFixed(2)),
    r: Number(r.toFixed(2)),
    n
  };
}
function buildModel(trends) {
  if (!trends || trends.length < 3) return null;
  const rainfall = trends.map((t) => t.rainfall);
  const speed = trends.map((t) => t.avgSpeed);
  const congestion = trends.map((t) => t.congestion);
  const speedFit = fitLinear(rainfall, speed);
  const congestionFit = fitLinear(rainfall, congestion);
  if (!speedFit || !congestionFit) return null;
  return {
    speedFit,
    congestionFit,
    rainfallMin: Math.min(...rainfall),
    rainfallMax: Math.max(...rainfall),
    speedMin: Math.min(...speed),
    speedMax: Math.max(...speed)
  };
}
function predict(model, hour, hoursAhead) {
  const rain = Math.max(0, hour.precipitation);
  const rawSpeed = model.speedFit.slope * rain + model.speedFit.intercept;
  const rawCongestion = model.congestionFit.slope * rain + model.congestionFit.intercept;
  const predictedSpeed = Math.min(model.speedMax, Math.max(5, rawSpeed));
  const predictedCongestion = Math.min(100, Math.max(0, rawCongestion));
  return {
    hoursAhead,
    time: hour.time,
    rainfall: Number(rain.toFixed(1)),
    predictedSpeed: Number(predictedSpeed.toFixed(1)),
    predictedCongestion: Math.round(predictedCongestion),
    extrapolated: rain > model.rainfallMax
  };
}
function impactLabel(r) {
  const m = Math.abs(r);
  const strength = m >= 0.7 ? "Strong" : m >= 0.4 ? "Moderate" : "Weak";
  return `${strength} ${r < 0 ? "Inverse" : "Direct"}`;
}
function computeCorrelations(trends) {
  if (!trends || trends.length < 3) return [];
  const n = trends.length;
  const col = {
    rainfall: trends.map((t) => t.rainfall),
    avgSpeed: trends.map((t) => t.avgSpeed),
    congestion: trends.map((t) => t.congestion),
    aqi: trends.map((t) => t.aqi),
    vehicleVolume: trends.map((t) => t.vehicleVolume)
  };
  const specs = [
    {
      metricA: "Rainfall Rate (mm/h)",
      metricB: "Avg Traffic Speed (km/h)",
      xs: col.rainfall,
      ys: col.avgSpeed,
      negative: `Rising rainfall tracks falling arterial speed across ${n} sampled intervals.`,
      positive: `No speed-suppressing rainfall signal across ${n} sampled intervals.`
    },
    {
      metricA: "Congestion Index (%)",
      metricB: "Air Quality Index (AQI)",
      xs: col.congestion,
      ys: col.aqi,
      positive: `Congestion peaks coincide with degrading air quality across ${n} intervals.`,
      negative: `Congestion and air quality move independently across ${n} intervals.`
    },
    {
      metricA: "Vehicle Volume (count)",
      metricB: "Congestion Index (%)",
      xs: col.vehicleVolume,
      ys: col.congestion,
      positive: `Throughput volume scales with congestion build-up across ${n} intervals.`,
      negative: `Volume rises without proportional congestion across ${n} intervals.`
    }
  ];
  const out = [];
  for (const s of specs) {
    const fit = fitLinear(s.xs, s.ys);
    if (!fit) continue;
    out.push({
      metricA: s.metricA,
      metricB: s.metricB,
      coefficient: fit.r,
      impactLevel: impactLabel(fit.r),
      insight: fit.r < 0 ? s.negative : s.positive
    });
  }
  return out;
}
function describeModel(model) {
  const f = model.speedFit;
  return `Linear regression - rainfall vs speed (slope ${f.slope} km/h per mm/h, r = ${f.r}, n = ${f.n})`;
}

// server/index.ts
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use(import_express.default.json());
app.get("/api/dashboard", async (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  const [weather, air, traffic] = await Promise.all([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId),
    getLiveTraffic(cityId)
  ]);
  if (weather) data.environment = { ...data.environment, ...weather };
  if (air) data.environment = { ...data.environment, ...air };
  if (traffic) data.traffic = { ...data.traffic, ...traffic };
  const HORIZONS = [1, 4, 12];
  let prediction = {
    available: false,
    reason: "No live forecast available",
    horizons: []
  };
  const model = buildModel(data.hourlyTrends);
  if (!model) {
    prediction = {
      available: false,
      reason: "Insufficient rainfall variation to fit a model",
      horizons: []
    };
  } else if (weather && weather.forecast.length > 0) {
    const horizons = HORIZONS.filter((h) => weather.forecast.length >= h).map((h) => predict(model, weather.forecast[h - 1], h));
    prediction = {
      available: horizons.length > 0,
      model: describeModel(model),
      speedFit: model.speedFit,
      congestionFit: model.congestionFit,
      observedRainfallMax: Number(model.rainfallMax.toFixed(1)),
      horizons
    };
  }
  res.json({
    ...data,
    weatherSource: weather ? "live" : "mock",
    airQualitySource: air ? "live" : "mock",
    trafficSource: traffic ? "live" : "mock",
    prediction,
    // Computed with the same least-squares routine as `prediction`, so the
    // rainfall/speed coefficient shown in the matrix always matches the model.
    correlations: computeCorrelations(data.hourlyTrends)
  });
});
app.get("/api/transportation/status", async (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  const traffic = await getLiveTraffic(cityId);
  if (traffic) data.traffic = { ...data.traffic, ...traffic };
  res.json({
    cityId,
    timestamp: data.timestamp,
    traffic: data.traffic,
    transit: data.transit,
    trafficSource: traffic ? "live" : "mock"
  });
});
app.get("/api/transportation/incidents", (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    incidents: data.incidents
  });
});
app.post("/api/transportation/incidents/:id/resolve", (req, res) => {
  const { id } = req.params;
  const cityId = req.query.city || "singapore";
  const success = resolveCityIncident(cityId, id);
  res.json({ success, incidentId: id });
});
app.get("/api/environment/current", async (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  const [weather, air] = await Promise.all([
    getLiveWeather(cityId),
    getLiveAirQuality(cityId)
  ]);
  if (weather) data.environment = { ...data.environment, ...weather };
  if (air) data.environment = { ...data.environment, ...air };
  res.json({
    cityId,
    environment: data.environment,
    sensors: data.sensors,
    weatherSource: weather ? "live" : "mock",
    airQualitySource: air ? "live" : "mock"
  });
});
app.get("/api/environment/forecast", (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    hourly: data.hourlyTrends,
    forecast3Day: [
      { day: "Tomorrow", condition: "Thunderstorms / Rain", tempHigh: 31, tempLow: 25, aqi: data.environment.aqi + 4, floodRisk: "Moderate" },
      { day: "Day 2", condition: "Partly Cloudy", tempHigh: 33, tempLow: 26, aqi: data.environment.aqi - 2, floodRisk: "Low" },
      { day: "Day 3", condition: "Heavy Rainfall", tempHigh: 29, tempLow: 24, aqi: data.environment.aqi - 8, floodRisk: "High" }
    ]
  });
});
app.get("/api/environment/aqi", (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    aqi: data.environment.aqi,
    aqiStatus: data.environment.aqiStatus,
    breakdown: data.environment.aqiBreakdown,
    sensors: data.sensors.filter((s) => s.type === "aqi")
  });
});
app.get("/api/analytics", (req, res) => {
  const cityId = req.query.city || "singapore";
  const data = getCityDashboardData(cityId);
  res.json({
    cityId,
    trends: data.hourlyTrends,
    correlations: [
      ...computeCorrelations(data.hourlyTrends)
    ]
  });
});
app.get("/api/reports", (req, res) => {
  const cityId = req.query.city || "singapore";
  res.json({
    reports: [
      { id: "REP-2026-0723", title: "Daily Smart City Operational Intelligence Brief", date: "2026-07-23", cityId, author: "AI Smart City Engine", status: "Completed", classification: "Official Use Only" },
      { id: "REP-2026-0716", title: "Weekly Urban Mobility & Environmental Health Audit", date: "2026-07-16", cityId, author: "Command Center Analytics", status: "Archived", classification: "Official Use Only" },
      { id: "REP-2026-0709", title: "Monsoon Flood Resilience & Traffic Diverter Performance", date: "2026-07-09", cityId, author: "Disaster Risk Management", status: "Archived", classification: "Official Use Only" }
    ]
  });
});
app.post("/api/ai/analyze", async (req, res) => {
  const { cityId = "singapore", userQuery } = req.body;
  const currentData = getCityDashboardData(cityId);
  const cityName = currentData.city.name;
  if (isAiEnabled()) {
    const systemPrompt = "You are the Chief AI Smart City Command Advisor for a municipal command center. You respond only with valid JSON matching the requested schema, with no markdown fences or commentary.";
    const prompt = `
You are the Chief AI Smart City Command Advisor for the city of ${cityName}.
You are reviewing current live urban telemetry:
- Traffic Congestion Index: ${currentData.traffic.congestionIndex}% (Avg speed: ${currentData.traffic.avgSpeed} km/h, Active vehicle volume: ${currentData.traffic.vehicleCount})
- Public Transit On-time Rate: ${currentData.traffic.publicTransitOnTime}%
- Air Quality Index (AQI): ${currentData.environment.aqi} (${currentData.environment.aqiStatus}, PM2.5: ${currentData.environment.aqiBreakdown.pm25})
- Ambient Weather: ${currentData.environment.temp}\xB0C, Humidity: ${currentData.environment.humidity}%, Rainfall Rate: ${currentData.environment.rainfallRate} mm/h
- Flood Risk Level: ${currentData.environment.floodRiskLevel}
- Active Incidents Count: ${currentData.incidents.length} (${currentData.incidents.map((i) => i.title).join(", ")})
- Operator Query/Focus: ${userQuery || "Provide an executive operational assessment and immediate recommended interventions."}

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
  res.json({
    summary: `Command Center AI Advisory for ${cityName}: Urban mobility is operating at ${currentData.traffic.congestionIndex}% congestion capacity. Environmental parameters show AQI at ${currentData.environment.aqi} (${currentData.environment.aqiStatus}) with rainfall at ${currentData.environment.rainfallRate} mm/h.`,
    riskAssessment: `Primary operational threat is potential bottleneck cascading on primary expressways and flood stage elevation in low-lying drainage boxes.`,
    recommendations: [
      {
        title: "Adaptive Signal Timing Calibration",
        action: "Extend green signal split by +15% on high-volume entry corridors.",
        priority: "High",
        impact: "Reduces queue tailbacks by approximately 18% in 30 minutes."
      },
      {
        title: "Stormwater Infrastructure Activation",
        action: "Deploy automated dewatering pumps at monitored low-lying intersections.",
        priority: currentData.environment.rainfallRate > 15 ? "High" : "Medium",
        impact: "Mitigates flash flood accumulation risk across primary underpasses."
      },
      {
        title: "Public Transit Feeder Rebalancing",
        action: "Re-route auxiliary electric buses to absorb commuter demand at high-occupancy MRT/metro nodes.",
        priority: "Medium",
        impact: "Stabilizes platform crowd density during peak commuter windows."
      }
    ],
    suggestedDispatch: ["Traffic Police Rapid Response Precinct", "Municipal Drainage Quick Reaction Team"]
  });
});
app.get("/api/ai/info", (req, res) => {
  res.json(getProviderInfo());
});
app.post("/api/simulation/inject", (req, res) => {
  const { cityId = "singapore", incident } = req.body;
  const newIncident = injectCityIncident(cityId, incident || {});
  res.json({ success: true, incident: newIncident });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CityVerse AI] Smart City Command Server running on http://localhost:${PORT}`);
    logProviderStatus();
    logTrafficStatus();
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
