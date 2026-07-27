import { CityConfig, CityDashboardData, CityId, RoadIncident, EnvironmentalSensor, PublicTransitLine, AiRecommendation, CityTimelineEvent, HourlyTrendPoint } from '../shared/types';

export const CITIES: Record<CityId, CityConfig> = {
  taipei: {
    id: 'taipei' as CityId,
    name: 'Taipei',
    country: 'Taiwan',
    flag: '🇹🇼',
    lat: 25.0330,
    lng: 121.5654,
    zoom: 12,
    timezone: 'Asia/Taipei (CST UTC+8)',
    population: '2.50M',
    keyDistricts: ['Xinyi District', 'Daan District', 'Neihu Tech Park', 'Zhongshan', 'Songshan', 'Wanhua'],
  },
};

// State storage per city
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

export function getCityDashboardData(cityId: CityId): CityDashboardData {
  const city = CITIES[cityId] || CITIES.taipei;
  const incidents = dynamicIncidents[cityId] || [];

  // Tailored metrics for each smart city
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
        aqi: 64,
        aqiStatus: 'Moderate' as const,
        temp: 28.1,
        humidity: 76,
        rainfallRate: 4.5,
        floodRiskLevel: 'Low' as const,
        aqiBreakdown: { pm25: 22, pm10: 45, no2: 34, so2: 8, co: 0.7, o3: 42 },
        windSpeed: 11,
        windDirection: 'ENE',
      },
      sensors: [
        { id: 'SEN-TP-01', cityId: 'taipei' as CityId, name: 'Keelung River Water Level Node', type: 'flood_stage' as const, coordinates: [25.0710, 121.5580] as [number, number], value: 0.95, unit: 'm', status: 'normal' as const, lastUpdated: '3 mins ago', district: 'Songshan' },
        { id: 'SEN-TP-02', cityId: 'taipei' as CityId, name: 'Xinyi EPA Air Monitoring Station', type: 'aqi' as const, coordinates: [25.0340, 121.5640] as [number, number], value: 68, unit: 'AQI', status: 'normal' as const, lastUpdated: '1 min ago', district: 'Xinyi District' },
        { id: 'SEN-TP-03', cityId: 'taipei' as CityId, name: 'Neihu Tech Corridor Optical Cam', type: 'traffic_camera' as const, coordinates: [25.0790, 121.5730] as [number, number], value: 92, unit: 'veh/min', status: 'warning' as const, lastUpdated: 'Just now', district: 'Neihu Tech Park' },
      ],
      transit: [
        { id: 'TR-TP-01', name: 'Bannan Line (Blue Line)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 89, onTimePercentage: 99.1, activeVehicles: 44, disruptionsCount: 0 },
        { id: 'TR-TP-02', name: 'Tamsui-Xinyi Line (Red Line)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 78, onTimePercentage: 98.9, activeVehicles: 40, disruptionsCount: 0 },
        { id: 'TR-TP-03', name: 'Wenhu Line (Brown Line)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 85, onTimePercentage: 97.8, activeVehicles: 30, disruptionsCount: 0 },
      ],
    },
  };

  const selectedMetrics = metricsMap[cityId] || metricsMap.taipei;

  const recommendations: AiRecommendation[] = [
    {
      id: `REC-${cityId.toUpperCase()}-01`,
      category: 'transportation',
      priority: 'high',
      title: 'Automated Signal Split Adjustment',
      reasoning: `Peak flow directional bias detected towards key financial corridors. Congestion index reached ${selectedMetrics.traffic.congestionIndex}%.`,
      suggestedAction: 'Increase green light time by +18 seconds on northbound arterials.',
      predictedImpact: 'Estimated -14% delay reduction over 45 minutes.',
      timestamp: '3 mins ago',
    },
    {
      id: `REC-${cityId.toUpperCase()}-02`,
      category: 'environment',
      priority: (selectedMetrics.environment.floodRiskLevel as string) === 'High' || (selectedMetrics.environment.floodRiskLevel as string) === 'Critical' ? 'high' : 'medium',
      title: 'Storm Drain Dewatering Directive',
      reasoning: `Rainfall rate currently at ${selectedMetrics.environment.rainfallRate} mm/h with elevated drainage trough stage.`,
      suggestedAction: 'Trigger auxiliary dewatering pumps and dispatch municipal response team.',
      predictedImpact: 'Prevents flash flooding across primary underpasses.',
      timestamp: '8 mins ago',
    },
  ];

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
      severity: incidents.some(i => i.severity === 'critical') ? 'critical' : 'warning',
      message: incidents[0] ? incidents[0].title : 'Minor congestion buildup detected on arterial ring.',
      location: incidents[0] ? incidents[0].locationName : city.keyDistricts[1],
    },
    {
      id: 'TL-3',
      timestamp: '25 mins ago',
      timeAgo: '25m ago',
      type: 'weather',
      severity: selectedMetrics.environment.rainfallRate > 15 ? 'warning' : 'info',
      message: `Weather radar registered rain cell approaching with precipitation rate ${selectedMetrics.environment.rainfallRate} mm/h.`,
      location: 'Citywide Corridor',
    },
  ];

  const hourlyTrends: HourlyTrendPoint[] = [
    { time: '00:00', congestion: 12, avgSpeed: 62, aqi: selectedMetrics.environment.aqi - 8, rainfall: 0, vehicleVolume: 24000 },
    { time: '03:00', congestion: 8, avgSpeed: 68, aqi: selectedMetrics.environment.aqi - 12, rainfall: 0, vehicleVolume: 12000 },
    { time: '06:00', congestion: 28, avgSpeed: 52, aqi: selectedMetrics.environment.aqi - 5, rainfall: 2.1, vehicleVolume: 82000 },
    { time: '09:00', congestion: selectedMetrics.traffic.congestionIndex + 15, avgSpeed: Math.max(12, selectedMetrics.traffic.avgSpeed - 12), aqi: selectedMetrics.environment.aqi + 15, rainfall: selectedMetrics.environment.rainfallRate, vehicleVolume: selectedMetrics.traffic.vehicleCount },
    { time: '12:00', congestion: selectedMetrics.traffic.congestionIndex, avgSpeed: selectedMetrics.traffic.avgSpeed, aqi: selectedMetrics.environment.aqi, rainfall: selectedMetrics.environment.rainfallRate * 0.8, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.9 },
    { time: '15:00', congestion: selectedMetrics.traffic.congestionIndex + 5, avgSpeed: selectedMetrics.traffic.avgSpeed - 4, aqi: selectedMetrics.environment.aqi + 4, rainfall: selectedMetrics.environment.rainfallRate * 0.5, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.95 },
    { time: '18:00', congestion: Math.min(95, selectedMetrics.traffic.congestionIndex + 22), avgSpeed: Math.max(10, selectedMetrics.traffic.avgSpeed - 16), aqi: selectedMetrics.environment.aqi + 18, rainfall: selectedMetrics.environment.rainfallRate * 1.2, vehicleVolume: selectedMetrics.traffic.vehicleCount * 1.15 },
    { time: '21:00', congestion: Math.max(15, selectedMetrics.traffic.congestionIndex - 18), avgSpeed: selectedMetrics.traffic.avgSpeed + 12, aqi: selectedMetrics.environment.aqi - 2, rainfall: selectedMetrics.environment.rainfallRate * 0.2, vehicleVolume: selectedMetrics.traffic.vehicleCount * 0.6 },
  ];

  return {
    city,
    timestamp: new Date().toISOString(),
    traffic: selectedMetrics.traffic,
    environment: selectedMetrics.environment,
    incidents,
    sensors: selectedMetrics.sensors,
    transit: selectedMetrics.transit,
    recommendations,
    timeline,
    hourlyTrends,
  };
}

export function injectCityIncident(cityId: CityId, incidentData: Partial<RoadIncident>): RoadIncident {
  const city = CITIES[cityId] || CITIES.taipei;
  const newIncident: RoadIncident = {
    id: `INC-${cityId.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    cityId,
    title: incidentData.title || 'Simulated Emergency Incident',
    type: incidentData.type || 'congestion',
    severity: incidentData.severity || 'major',
    locationName: incidentData.locationName || `${city.keyDistricts[0]} Central Corridor`,
    coordinates: incidentData.coordinates || [city.lat + (Math.random() * 0.02 - 0.01), city.lng + (Math.random() * 0.02 - 0.01)],
    timestamp: 'Just now',
    estimatedResolution: incidentData.estimatedResolution || '30 mins',
    status: 'active',
    affectedLanes: incidentData.affectedLanes || 2,
    description: incidentData.description || 'Simulated incident triggered by Command Center Operator.',
    recommendedAction: incidentData.recommendedAction || 'Dispatch emergency unit and activate variable message signs.',
  };

  if (!dynamicIncidents[cityId]) {
    dynamicIncidents[cityId] = [];
  }
  dynamicIncidents[cityId].unshift(newIncident);
  return newIncident;
}

export function resolveCityIncident(cityId: CityId, incidentId: string): boolean {
  if (dynamicIncidents[cityId]) {
    const item = dynamicIncidents[cityId].find(i => i.id === incidentId);
    if (item) {
      item.status = 'resolved';
      return true;
    }
  }
  return false;
}