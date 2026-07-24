import { CityDashboardData, CityId, RoadIncident, EnvironmentalSensor, PublicTransitLine, AiRecommendation, CityTimelineEvent, HourlyTrendPoint } from '../src/types';

export const CITIES = {
  singapore: {
    id: 'singapore' as CityId,
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    lat: 1.3521,
    lng: 103.8198,
    zoom: 12,
    timezone: 'Asia/Singapore (SGT UTC+8)',
    population: '5.92M',
    keyDistricts: ['Marina Bay', 'Orchard Road', 'Jurong East', 'Changi', 'Woodlands', 'Paya Lebar'],
  },
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
  bengaluru: {
    id: 'bengaluru' as CityId,
    name: 'Bengaluru',
    country: 'India',
    flag: '🇮🇳',
    lat: 12.9716,
    lng: 77.5946,
    zoom: 12,
    timezone: 'Asia/Kolkata (IST UTC+5:30)',
    population: '13.19M',
    keyDistricts: ['ORR Electronic City', 'Whitefield', 'Indiranagar', 'Hebbal', 'Koramangala', 'Central Silk Board'],
  },
};

// State storage per city
const dynamicIncidents: Record<CityId, RoadIncident[]> = {
  singapore: [
    {
      id: 'INC-SG-101',
      cityId: 'singapore',
      title: 'PIE Expressway Vehicle Stalls',
      type: 'congestion',
      severity: 'major',
      locationName: 'Pan Island Expressway (PIE) near Toa Payoh Flyover',
      coordinates: [1.3320, 103.8480],
      timestamp: '12 mins ago',
      estimatedResolution: '25 mins',
      status: 'active',
      affectedLanes: 2,
      description: 'Heavy congestion building up on Lane 1 & 2 due to a disabled multi-axle trailer.',
      recommendedAction: 'Adjust VMS message boards at Kallang Way and reroute to MacRitchie Viaduct.',
    },
    {
      id: 'INC-SG-102',
      cityId: 'singapore',
      title: 'Flash Flood Watch - Sensor Triggered',
      type: 'closure',
      severity: 'critical',
      locationName: 'Dunearn Road / Bukit Timah Junction',
      coordinates: [1.3250, 103.8110],
      timestamp: '5 mins ago',
      estimatedResolution: '40 mins',
      status: 'active',
      affectedLanes: 3,
      description: 'Water level reached 82% capacity in Rochor Canal drain box after sudden downpour.',
      recommendedAction: 'Dispatch PUB Quick Response Team and trigger automated drainage pumps.',
    },
    {
      id: 'INC-SG-103',
      cityId: 'singapore',
      title: 'North-South Line Signal Calibration',
      type: 'transit_delay',
      severity: 'minor',
      locationName: 'Bishan MRT Interchange',
      coordinates: [1.3508, 103.8482],
      timestamp: '18 mins ago',
      estimatedResolution: '15 mins',
      status: 'in_progress',
      affectedLanes: 0,
      description: 'Headway extended by 3 minutes due to automated signaling verification.',
      recommendedAction: 'Deploy extra feeder buses at Bishan Bus Interchange.',
    },
  ],
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
  bengaluru: [
    {
      id: 'INC-BLR-301',
      cityId: 'bengaluru',
      title: 'Silk Board Junction Bottleneck Spillover',
      type: 'congestion',
      severity: 'critical',
      locationName: 'Central Silk Board Flyover & Hosur Road Ramp',
      coordinates: [12.9175, 77.6238],
      timestamp: '14 mins ago',
      estimatedResolution: '50 mins',
      status: 'active',
      affectedLanes: 4,
      description: 'Traffic speed dropped below 8 km/h across Outer Ring Road interchange.',
      recommendedAction: 'Prioritize traffic police signal override at HSR Layout 27th Main signal.',
    },
    {
      id: 'INC-BLR-302',
      cityId: 'bengaluru',
      title: 'Underpass Waterlogging Warning',
      type: 'closure',
      severity: 'major',
      locationName: 'Hebbal Flyover Underpass / Bellary Road',
      coordinates: [13.0358, 77.5970],
      timestamp: '28 mins ago',
      estimatedResolution: '45 mins',
      status: 'in_progress',
      affectedLanes: 2,
      description: 'Heavy precipitation causing 25cm water accumulation in underpass trough.',
      recommendedAction: 'Deploy BBMP high-capacity dewatering pumps and diverters.',
    },
    {
      id: 'INC-BLR-303',
      cityId: 'bengaluru',
      title: 'Metro Construction Lane Reduction',
      type: 'construction',
      severity: 'minor',
      locationName: 'Whitefield Main Road near ITPL Gate 2',
      coordinates: [12.9860, 77.7380],
      timestamp: '1 hour ago',
      estimatedResolution: 'Ongoing',
      status: 'active',
      affectedLanes: 1,
      description: 'Right lane barricaded for pier girder installation work.',
      recommendedAction: 'Enforce no parking within 200m radius to maintain 2 lane flow.',
    },
  ],
};

export function getCityDashboardData(cityId: CityId): CityDashboardData {
  const city = CITIES[cityId] || CITIES.singapore;
  const incidents = dynamicIncidents[cityId] || [];

  // Tailored metrics for each smart city
  const metricsMap = {
    singapore: {
      traffic: {
        congestionIndex: 42,
        avgSpeed: 48.5,
        vehicleCount: 184200,
        bottleneckCount: 3,
        incidentCount: incidents.filter(i => i.status === 'active').length,
        publicTransitOnTime: 99.1,
        peakHourComparison: -3.2,
      },
      environment: {
        aqi: 38,
        aqiStatus: 'Good' as const,
        temp: 31.4,
        humidity: 82,
        rainfallRate: 14.2,
        floodRiskLevel: 'Moderate' as const,
        aqiBreakdown: { pm25: 12, pm10: 24, no2: 18, so2: 6, co: 0.4, o3: 28 },
        windSpeed: 14,
        windDirection: 'SSW',
      },
      sensors: [
        { id: 'SEN-SG-01', cityId: 'singapore' as CityId, name: 'Rochor Canal Water Stage', type: 'flood_stage' as const, coordinates: [1.3050, 103.8540] as [number, number], value: 1.84, unit: 'm', status: 'warning' as const, lastUpdated: '2 mins ago', district: 'Marina Bay' },
        { id: 'SEN-SG-02', cityId: 'singapore' as CityId, name: 'Bukit Timah Drainage Meter', type: 'flood_stage' as const, coordinates: [1.3260, 103.8120] as [number, number], value: 2.15, unit: 'm', status: 'critical' as const, lastUpdated: '1 min ago', district: 'Bukit Timah' },
        { id: 'SEN-SG-03', cityId: 'singapore' as CityId, name: 'NEA Changi AQI Station', type: 'aqi' as const, coordinates: [1.3640, 103.9910] as [number, number], value: 32, unit: 'AQI', status: 'normal' as const, lastUpdated: '5 mins ago', district: 'Changi' },
        { id: 'SEN-SG-04', cityId: 'singapore' as CityId, name: 'Jurong Industrial Pollution Monitor', type: 'aqi' as const, coordinates: [1.3180, 103.7060] as [number, number], value: 52, unit: 'AQI', status: 'normal' as const, lastUpdated: '3 mins ago', district: 'Jurong East' },
        { id: 'SEN-SG-05', cityId: 'singapore' as CityId, name: 'CTE Traffic Camera #14', type: 'traffic_camera' as const, coordinates: [1.3500, 103.8500] as [number, number], value: 68, unit: 'veh/min', status: 'normal' as const, lastUpdated: 'Just now', district: 'Toa Payoh' },
      ],
      transit: [
        { id: 'TR-SG-01', name: 'North-South Line (NSL)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 74, onTimePercentage: 99.4, activeVehicles: 48, disruptionsCount: 0 },
        { id: 'TR-SG-02', name: 'East-West Line (EWL)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 81, onTimePercentage: 99.2, activeVehicles: 52, disruptionsCount: 0 },
        { id: 'TR-SG-03', name: 'Downtown Line (DTL)', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 62, onTimePercentage: 99.8, activeVehicles: 38, disruptionsCount: 0 },
        { id: 'TR-SG-04', name: 'SBS Transit Bus Route 190', type: 'Bus' as const, status: 'Minor Delay' as const, occupancyRate: 88, onTimePercentage: 94.2, activeVehicles: 24, disruptionsCount: 1 },
      ],
    },
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
    bengaluru: {
      traffic: {
        congestionIndex: 78,
        avgSpeed: 18.4,
        vehicleCount: 420000,
        bottleneckCount: 11,
        incidentCount: incidents.filter(i => i.status === 'active').length,
        publicTransitOnTime: 86.5,
        peakHourComparison: +12.4,
      },
      environment: {
        aqi: 134,
        aqiStatus: 'Unhealthy for Sensitive Groups' as const,
        temp: 27.2,
        humidity: 68,
        rainfallRate: 28.5,
        floodRiskLevel: 'High' as const,
        aqiBreakdown: { pm25: 58, pm10: 112, no2: 68, so2: 18, co: 1.8, o3: 45 },
        windSpeed: 8,
        windDirection: 'SW',
      },
      sensors: [
        { id: 'SEN-BLR-01', cityId: 'bengaluru' as CityId, name: 'Silk Board Junction AQI Array', type: 'aqi' as const, coordinates: [12.9170, 77.6230] as [number, number], value: 168, unit: 'AQI', status: 'critical' as const, lastUpdated: '2 mins ago', district: 'Central Silk Board' },
        { id: 'SEN-BLR-02', cityId: 'bengaluru' as CityId, name: 'Hebbal Storm Drain Gauge', type: 'flood_stage' as const, coordinates: [13.0360, 77.5980] as [number, number], value: 2.85, unit: 'm', status: 'critical' as const, lastUpdated: 'Just now', district: 'Hebbal' },
        { id: 'SEN-BLR-03', cityId: 'bengaluru' as CityId, name: 'Whitefield Traffic Sensor Node', type: 'traffic_camera' as const, coordinates: [12.9850, 77.7390] as [number, number], value: 115, unit: 'veh/min', status: 'warning' as const, lastUpdated: '4 mins ago', district: 'Whitefield' },
      ],
      transit: [
        { id: 'TR-BLR-01', name: 'Namma Metro Purple Line', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 94, onTimePercentage: 96.2, activeVehicles: 32, disruptionsCount: 0 },
        { id: 'TR-BLR-02', name: 'Namma Metro Green Line', type: 'MRT' as const, status: 'Normal' as const, occupancyRate: 88, onTimePercentage: 97.0, activeVehicles: 28, disruptionsCount: 0 },
        { id: 'TR-BLR-03', name: 'BMTC Vajra Volvo Feeder Network', type: 'Bus' as const, status: 'Severe Delay' as const, occupancyRate: 96, onTimePercentage: 74.5, activeVehicles: 180, disruptionsCount: 6 },
      ],
    },
  };

  const selectedMetrics = metricsMap[cityId] || metricsMap.singapore;

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
  const city = CITIES[cityId] || CITIES.singapore;
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
