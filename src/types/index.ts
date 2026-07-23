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
