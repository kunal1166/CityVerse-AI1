export type CityId = 'singapore' | 'taipei' | 'bengaluru';

export interface CityConfig {
  id: CityId;
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  zoom: number;
  timezone: string;
  population: string;
  keyDistricts: string[];
}

export type IncidentType = 'congestion' | 'accident' | 'closure' | 'construction' | 'transit_delay';
export type SeverityLevel = 'critical' | 'major' | 'minor';
export type IncidentStatus = 'active' | 'in_progress' | 'resolved';

export interface RoadIncident {
  id: string;
  cityId: CityId;
  title: string;
  type: IncidentType;
  severity: SeverityLevel;
  locationName: string;
  coordinates: [number, number];
  timestamp: string;
  estimatedResolution: string;
  status: IncidentStatus;
  affectedLanes: number;
  description: string;
  recommendedAction?: string;
}

export interface TrafficMetric {
  congestionIndex: number; // 0 - 100%
  avgSpeed: number; // km/h
  vehicleCount: number; // current active count
  bottleneckCount: number;
  incidentCount: number;
  publicTransitOnTime: number; // percentage
  peakHourComparison: number; // % change vs yesterday
}

export interface AQIBreakdown {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface EnvMetric {
  aqi: number;
  aqiStatus: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Hazardous';
  temp: number; // °C
  humidity: number; // %
  rainfallRate: number; // mm/h
  floodRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  aqiBreakdown: AQIBreakdown;
  windSpeed: number; // km/h
  windDirection: string;
  /** Present only when live weather succeeded. */
  forecast?: ForecastHour[];
}

export type SensorType = 'aqi' | 'flood_stage' | 'weather' | 'traffic_camera';
export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';

export interface EnvironmentalSensor {
  id: string;
  cityId: CityId;
  name: string;
  type: SensorType;
  coordinates: [number, number];
  value: number;
  unit: string;
  status: SensorStatus;
  lastUpdated: string;
  district: string;
}

export interface PublicTransitLine {
  id: string;
  name: string;
  type: 'MRT' | 'Bus' | 'LightRail';
  status: 'Normal' | 'Minor Delay' | 'Severe Delay' | 'Suspended';
  occupancyRate: number; // percentage
  onTimePercentage: number;
  activeVehicles: number;
  disruptionsCount: number;
}

export interface AiRecommendation {
  id: string;
  category: 'transportation' | 'environment' | 'emergency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  reasoning: string;
  suggestedAction: string;
  predictedImpact: string;
  timestamp: string;
}

export interface CityTimelineEvent {
  id: string;
  timestamp: string;
  timeAgo: string;
  type: 'incident' | 'alert' | 'ai_action' | 'weather';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  location?: string;
}

export interface HourlyTrendPoint {
  time: string;
  congestion: number;
  avgSpeed: number;
  aqi: number;
  rainfall: number;
  vehicleVolume: number;
}

/** One hour of the live rainfall forecast. forecast[0] is always the NEXT hour. */
export interface ForecastHour {
  time: string;
  precipitation: number;
}

/** A fitted straight line. `r` reports fit quality; it is never used to predict. */
export interface RegressionFit {
  slope: number;
  intercept: number;
  r: number;
  n: number;
}

/** One projected horizon, e.g. "+4 hours from now". */
export interface PredictionHorizon {
  hoursAhead: number;
  time: string;
  rainfall: number;
  predictedSpeed: number;
  predictedCongestion: number;
  /** True when forecast rainfall exceeds anything we actually observed. */
  extrapolated: boolean;
}

/**
 * Always present in the dashboard payload. When `available` is false,
 * `reason` explains why and `horizons` is empty.
 */
export interface PredictionResult {
  available: boolean;
  reason?: string;
  model?: string;
  speedFit?: RegressionFit;
  congestionFit?: RegressionFit;
  observedRainfallMax?: number;
  horizons: PredictionHorizon[];
}

/** Whether a value came from a live API or the built-in simulation. */
export type DataSource = 'live' | 'mock';

export interface CityDashboardData {
  city: CityConfig;
  timestamp: string;
  traffic: TrafficMetric;
  environment: EnvMetric;
  incidents: RoadIncident[];
  sensors: EnvironmentalSensor[];
  transit: PublicTransitLine[];
  recommendations: AiRecommendation[];
  timeline: CityTimelineEvent[];
  hourlyTrends: HourlyTrendPoint[];

  // --- Added by the live-data layer. Optional so mock-only responses still typecheck.
  prediction?: PredictionResult;
  weatherSource?: DataSource;
  airQualitySource?: DataSource;
  trafficSource?: DataSource;
}

export interface AiAnalysisRequest {
  cityId: CityId;
  userQuery?: string;
  contextType?: 'general' | 'emergency' | 'traffic' | 'environment' | 'report';
}

export interface AiAnalysisResponse {
  summary: string;
  riskAssessment: string;
  recommendations: Array<{
    title: string;
    action: string;
    priority: 'High' | 'Medium' | 'Low';
    impact: string;
  }>;
  suggestedDispatch?: string[];
}