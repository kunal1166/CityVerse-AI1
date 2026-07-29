import { CityConfig, CityDashboardData, CityId, RoadIncident, EnvironmentalSensor, PublicTransitLine, AiRecommendation, CityTimelineEvent, HourlyTrendPoint } from '../shared/types';

// Strictly defined for Taipei City
export const CITIES: Record<CityId, CityConfig> = {
  taipei: {
    id: 'taipei' as CityId,
    name: 'Taipei',
    country: 'Taiwan',
    flag: '🇹🇼',
    lat: 25.05306,
    lng: 121.52639,
    zoom: 12,
    timezone: 'Asia/Taipei (CST UTC+8)',
    population: '2.50M',
    keyDistricts: ['Xinyi District', 'Daan District', 'Neihu Tech Park', 'Zhongshan', 'Songshan', 'Wanhua'],
  },
};

// Dynamic incident store locked to Taipei
const dynamicIncidents: Record<CityId, RoadIncident[]> = {
  taipei: [
    {
      id: 'INC-TP-201',
      cityId: 'taipei',
      title: 'Jianguo Elevated Expressway Collision',
      type: 'accident',
      severity: 'critical',
      locationName: 'Jianguo S. Rd Viaduct near Daan Park Exit',
      coordinates: [25.0300, 121.5360],
      timestamp: '8 mins ago',
      estimatedResolution: '35 mins',
      status: 'active',
      affectedLanes: 2,
      description: 'Two-car collision blocking northbound inner lanes during peak flow.',
      recommendedAction: 'Alert Traffic Police Precinct 3; adjust traffic light timing on Heping E. Rd.',
    },
    {
      id: 'INC-TP-202',
      cityId: 'taipei',
      title: 'Neihu Tech Park Gridlock',
      type: 'congestion',
      severity: 'major',
      locationName: 'Tiding Blvd Sec 2 & Gangqian Rd',
      coordinates: [25.0780, 121.5710],
      timestamp: '22 mins ago',
      estimatedResolution: '30 mins',
      status: 'active',
      affectedLanes: 3,
      description: 'Commuter spillover from Huandong Viaduct causing 4.2km queue.',
      recommendedAction: 'Activate tidal lane controls across Minquan Bridge.',
    },
  ],
};

export function getCityDashboardData(cityId: CityId = 'taipei'): CityDashboardData {
  // Always lock context to Taipei
  const city = CITIES.taipei;
  const incidents = dynamicIncidents.taipei || [];

  const metricsMap = {
    taipei: {
      traffic: {
        congestionIndex: 58,
        avgSpeed: 36.2,
        vehicleCount: 241000,
        bottleneckCount: 5,
        incidentCount: incidents.filter(i => i.status === 'active').length,
        publicTransitOnTime: 98.4,
        peakHourComparison: +4.8,
      },
      environment: {
        aqi: 26,
        aqiStatus: 'Good' as const,
        temp: 33.2,
        humidity: 55,
        rainfallRate: 0,
        floodRiskLevel: 'Low' as const,
        aqiBreakdown: { pm25: 3.7, pm10: 14.9, no2: 4.7, so2: 0.9, co: 0.2, o3: 14 },
        windSpeed: 16.5,
        windDirection: 112.5,
        windDirectionCardinal: 'ESE',
      },
      sensors: [
        { id: 'SEN-TP-01', cityId: 'taipei' as CityId, name: 'Keelung River Water Level Node', type: 'flood_stage' as const, coordinates: [25.0710, 121.5580] as [number, number], value: 0.45, unit: 'm', status: 'normal' as const, lastUpdated: '3 mins ago', district: 'Songshan' },
        { id: 'SEN-TP-02', cityId: 'taipei' as CityId, name: 'Xinyi EPA Air Monitoring Station', type: 'aqi' as const, coordinates: [25.0340, 121.5640] as [number, number], value: 26, unit: 'AQI', status: 'normal' as const, lastUpdated: '1 min ago', district: 'Xinyi District' },
        { id: 'SEN-TP-03', cityId: 'taipei' as CityId, name: 'Zhongshan Microclimate Station', type: 'weather' as const, coordinates: [25.0680, 121.5280] as [number, number], value: 33.2, unit: '°C', status: 'normal' as const, lastUpdated: 'Just now', district: 'Zhongshan' },
      ],
      transit: [
        { id: 'TR-TP-01', name: 'Bannan Line (Blue Line)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 89, onTimePercentage: 99.1, activeVehicles: 44, disruptionsCount: 0 },
        { id: 'TR-TP-02', name: 'Tamsui-Xinyi Line (Red Line)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 78, onTimePercentage: 98.9, activeVehicles: 40, disruptionsCount: 0 },
        { id: 'TR-TP-03', name: 'Wenhu Line (Brown Line)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 85, onTimePercentage: 97.8, activeVehicles: 30, disruptionsCount: 0 },
      ],
    },
  };

  const selectedMetrics = metricsMap.taipei;

  const recommendations: AiRecommendation[] = [
    {
      id: `REC-TAIPEI-01`,
      category: 'transportation',
      priority: 'high',
      title: 'Automated Signal Split Adjustment',
      reasoning: `Peak flow directional bias detected towards key financial corridors. Congestion index reached ${selectedMetrics.traffic.congestionIndex}%.`,
      suggestedAction: 'Increase green light time by +18 seconds on northbound arterials.',
      predictedImpact: 'Estimated -14% delay reduction over 45 minutes.',
      timestamp: '3 mins ago',
    },
    {
      id: `REC-TAIPEI-02`,
      category: 'environment',
      priority: (selectedMetrics.environment.floodRiskLevel as string) === 'High' || (selectedMetrics.environment.floodRiskLevel as string) === 'Critical' ? 'high' : 'medium',
      title: 'Storm Drain Dewatering Directive',
      reasoning: `Rainfall rate currently at ${selectedMetrics.environment.rainfallRate} mm/h with elevated drainage trough stage.`,
      suggestedAction: 'Trigger auxiliary dewatering pumps and dispatch municipal response team.',
      predictedImpact: 'Prevents flash flooding across primary underpasses.',
      timestamp: '8 mins ago',
    },
  ];

  const activeIncidents = incidents.filter(i => i.status === 'active');

  const timeline: CityTimelineEvent[] = [
    {
      id: 'TL-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      timeAgo: 'Just now',
      type: 'ai_action',
      severity: 'info',
      message: 'AI Traffic Model updated signal sync across 14 smart intersections.',
      location: city.keyDistricts[0],
    },
    {
      id: 'TL-2',
      timestamp: '10 mins ago',
      timeAgo: '10m ago',
      type: 'incident',
      severity: activeIncidents.some(i => i.severity === 'critical') ? 'critical' : 'warning',
      message: activeIncidents[0] ? activeIncidents[0].title : 'All primary corridors flowing within normal operating parameters.',
      location: activeIncidents[0] ? activeIncidents[0].locationName : city.keyDistricts[1],
    },
    {
      id: 'TL-3',
      timestamp: '25 mins ago',
      timeAgo: '25m ago',
      type: 'weather',
      severity: selectedMetrics.environment.rainfallRate > 15 ? 'warning' : 'info',
      message: `Weather radar registered current precipitation rate at ${selectedMetrics.environment.rainfallRate} mm/h.`,
      location: 'Taipei Basin Corridor',
    },
  ];

  const hourlyTrends: HourlyTrendPoint[] = [
    { time: '00:00', congestion: 12, avgSpeed: 62, aqi: selectedMetrics.environment.aqi - 8, rainfall: 0, vehicleVolume: 24000 },
    { time: '03:00', congestion: 8, avgSpeed: 68, aqi: selectedMetrics.environment.aqi - 12, rainfall: 0, vehicleVolume: 12000 },
    { time: '06:00', congestion: 28, avgSpeed: 52, aqi: selectedMetrics.environment.aqi - 5, rainfall: 0, vehicleVolume: 82000 },
    { time: '09:00', congestion: selectedMetrics.traffic.congestionIndex + 15, avgSpeed: Math.max(12, selectedMetrics.traffic.avgSpeed - 12), aqi: selectedMetrics.environment.aqi + 15, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount },
    { time: '12:00', congestion: selectedMetrics.traffic.congestionIndex, avgSpeed: selectedMetrics.traffic.avgSpeed, aqi: selectedMetrics.environment.aqi, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.9 },
    { time: '15:00', congestion: selectedMetrics.traffic.congestionIndex + 5, avgSpeed: selectedMetrics.traffic.avgSpeed - 4, aqi: selectedMetrics.environment.aqi + 4, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.95 },
    { time: '18:00', congestion: Math.min(95, selectedMetrics.traffic.congestionIndex + 22), avgSpeed: Math.max(10, selectedMetrics.traffic.avgSpeed - 16), aqi: selectedMetrics.environment.aqi + 18, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount * 1.15 },
    { time: '21:00', congestion: Math.max(15, selectedMetrics.traffic.congestionIndex - 18), avgSpeed: selectedMetrics.traffic.avgSpeed + 12, aqi: selectedMetrics.environment.aqi - 2, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.6 },
  ];

  return {
    city,
    timestamp: new Date().toISOString(),
    traffic: selectedMetrics.traffic,
    environment: selectedMetrics.environment,
    incidents: activeIncidents,
    sensors: selectedMetrics.sensors,
    transit: selectedMetrics.transit,
    recommendations,
    timeline,
    hourlyTrends,
  };
}

export function injectCityIncident(cityId: CityId = 'taipei', incidentData: Partial<RoadIncident>): RoadIncident {
  const city = CITIES.taipei;
  const newIncident: RoadIncident = {
    id: `INC-TP-${Date.now().toString().slice(-4)}`,
    cityId: 'taipei',
    title: incidentData.title || 'Simulated Emergency Incident',
    type: incidentData.type || 'congestion',
    severity: incidentData.severity || 'critical',
    locationName: incidentData.locationName || `${city.keyDistricts[0]} Central Corridor`,
    coordinates: incidentData.coordinates || [city.lat + (Math.random() * 0.02 - 0.01), city.lng + (Math.random() * 0.02 - 0.01)],
    timestamp: 'Just now',
    estimatedResolution: incidentData.estimatedResolution || '30 mins',
    status: 'active',
    affectedLanes: incidentData.affectedLanes || 2,
    description: incidentData.description || 'Simulated incident triggered by Command Center Operator.',
    recommendedAction: incidentData.recommendedAction || 'Dispatch emergency unit and activate variable message signs.',
  };

  if (!dynamicIncidents.taipei) {
    dynamicIncidents.taipei = [];
  }
  dynamicIncidents.taipei.unshift(newIncident);
  return newIncident;
}

export function resolveCityIncident(cityId: CityId = 'taipei', incidentId: string): boolean {
  if (dynamicIncidents.taipei) {
    const item = dynamicIncidents.taipei.find(i => i.id === incidentId);
    if (item) {
      item.status = 'resolved';
      return true;
    }
  }
  return false;
}