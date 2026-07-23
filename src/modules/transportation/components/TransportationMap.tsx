import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useCityStore, CITIES_CONFIG } from '../../../store/useCityStore';
import { CITY_ROADS, CITY_CAMERAS, SCENARIO_CONFIGS } from '../transportationData';
import { RoadSegment, TrafficCamera, SignalController, ScenarioType, RouteOption, RoadType } from '../transportationTypes';
import { RoadIncident } from '../../../types';
import { 
  Layers, Eye, EyeOff, Navigation, Sliders, Camera, Radio, ShieldAlert, Cpu,
  Maximize2, Minimize2, Search, Ruler, Square, Play, Pause, RotateCcw, CloudRain,
  AlertOctagon, Wrench, Users, Bus, Train, MapPin, TrendingUp, Activity, CheckCircle2,
  X, ChevronDown, Zap, Compass, Filter, Info, Sparkles, Clock, ArrowRight, ShieldCheck,
  CheckSquare, Home, GitBranch, Shield, Crosshair, Locate, LocateFixed, ExternalLink
} from 'lucide-react';

export type MapObjectType = 'road' | 'incident' | 'camera' | 'sensor' | 'signal';

export type ViewModeType = 
  | 'flow' 
  | 'congestion' 
  | 'speed' 
  | 'travel_time' 
  | 'capacity' 
  | 'density' 
  | 'emergency' 
  | 'signals';

interface TransportationMapProps {
  onSelectObject: (type: MapObjectType, data: any) => void;
  activeScenarioName?: string;
}

// Public Transit Stations Interface
interface TransitStation {
  id: string;
  name: string;
  line: string;
  type: 'Metro' | 'Bus';
  coordinates: [number, number];
  passengersPerHour: number;
  delayMins: number;
  nextArrivalMin: number;
  status: 'Operational' | 'Minor Delay' | 'Crowded' | 'Maintenance';
}

export const ROAD_TYPE_CONFIG: Record<RoadType, {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  badgeBg: string;
}> = {
  Highway: {
    label: 'Highways & Expressways',
    shortLabel: 'Highway',
    description: 'Multi-lane grade-separated corridors (CTE, AYE, PIE)',
    color: '#EAB308',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  Primary: {
    label: 'Primary Arterials',
    shortLabel: 'Primary',
    description: 'Major city boulevards & principal traffic arteries',
    color: '#22C55E',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  Secondary: {
    label: 'Secondary Collectors',
    shortLabel: 'Secondary',
    description: 'Sub-arterials linking local neighborhoods to main grids',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  Residential: {
    label: 'Residential Streets',
    shortLabel: 'Residential',
    description: 'Local access streets and low-speed residential roads',
    color: '#94A3B8',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
  Emergency: {
    label: 'Emergency Clearance Corridors',
    shortLabel: 'Emergency',
    description: 'Ambulance & priority clear-passage emergency routes',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  'Bus Route': {
    label: 'Bus Rapid Transit (BRT)',
    shortLabel: 'Bus Lane',
    description: 'Dedicated bus lanes and rapid transit priority corridors',
    color: '#A855F7',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  Construction: {
    label: 'Construction & Work Zones',
    shortLabel: 'Work Zone',
    description: 'Roadwork, tunneling sites, and restricted lane zones',
    color: '#F97316',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
};

export const TransportationMap: React.FC<TransportationMapProps> = ({
  onSelectObject,
  activeScenarioName,
}) => {
  const { selectedCity, dashboardData, searchQuery, setSearchQuery } = useCityStore();
  const cityConfig = CITIES_CONFIG[selectedCity] || CITIES_CONFIG['singapore'];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const measureGroupRef = useRef<L.LayerGroup | null>(null);

  // Map Controls & Operational Modes
  const [viewMode, setViewMode] = useState<ViewModeType>('flow');
  const [scenarioMode, setScenarioMode] = useState<ScenarioType>('none');
  const [roadFilter, setRoadFilter] = useState<string>('all');
  const [roadTypeFilters, setRoadTypeFilters] = useState<Record<RoadType, boolean>>({
    Highway: true,
    Primary: true,
    Secondary: true,
    Residential: true,
    Emergency: true,
    'Bus Route': true,
    Construction: true,
  });
  const [showRoadTypePanel, setShowRoadTypePanel] = useState<boolean>(false);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [showRoutePlanner, setShowRoutePlanner] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-rec');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Timeline & Time scrubbing (06:00 to 22:00, stored in hours e.g. 8.5 = 08:30)
  const [timelineHour, setTimelineHour] = useState<number>(8.5);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [showTimelineBar, setShowTimelineBar] = useState<boolean>(true);

  // GIS Tools State
  const [measureMode, setMeasureMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [drawRegionMode, setDrawRegionMode] = useState<boolean>(false);
  const [regionPoints, setRegionPoints] = useState<[number, number][]>([]);
  const [selectedStation, setSelectedStation] = useState<TransitStation | null>(null);

  // GPS & Google Maps Telemetry State
  const [userGpsLocation, setUserGpsLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
    isSimulated?: boolean;
  } | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showGpsPanel, setShowGpsPanel] = useState<boolean>(false);
  const watchPositionIdRef = useRef<number | null>(null);

  // Layer Toggles
  const [layers, setLayers] = useState({
    traffic: true,
    incidents: true,
    cameras: true,
    sensors: true,
    signals: true,
    transit: true,
    emergencyRoutes: true,
    construction: true,
    heatmap: false,
  });

  const [opacity, setOpacity] = useState({
    traffic: 0.9,
    incidents: 1.0,
    transit: 0.8,
    heatmap: 0.5,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync external scenario name if provided
  useEffect(() => {
    if (activeScenarioName) {
      if (activeScenarioName.includes('Collision') || activeScenarioName.includes('Accident')) setScenarioMode('accident');
      else if (activeScenarioName.includes('Rain') || activeScenarioName.includes('Monsoon')) setScenarioMode('heavy_rain');
      else if (activeScenarioName.includes('Closure')) setScenarioMode('road_closure');
      else if (activeScenarioName.includes('Parade') || activeScenarioName.includes('Festival')) setScenarioMode('festival');
      else if (activeScenarioName.includes('Transit') || activeScenarioName.includes('Metro')) setScenarioMode('metro_delay');
      else if (activeScenarioName.includes('Bridge') || activeScenarioName.includes('Maintenance')) setScenarioMode('construction');
    }
  }, [activeScenarioName]);

  // Timeline Auto-Play Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setTimelineHour((prev) => {
          if (prev >= 22) return 6;
          return parseFloat((prev + 0.25).toFixed(2));
        });
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeline]);

  // Transit Stations Mock Generator
  const transitStations = useMemo<TransitStation[]>(() => {
    if (selectedCity === 'singapore') {
      return [
        { id: 'st-sg-1', name: 'Orchard MRT Station', line: 'North-South Line', type: 'Metro', coordinates: [1.304, 103.832], passengersPerHour: 5800, delayMins: 0, nextArrivalMin: 2, status: 'Operational' },
        { id: 'st-sg-2', name: 'Newton MRT Interchange', line: 'Downtown Line', type: 'Metro', coordinates: [1.312, 103.838], passengersPerHour: 4200, delayMins: 1, nextArrivalMin: 3, status: 'Operational' },
        { id: 'st-sg-3', name: 'Marina Bay Terminal', line: 'Circle Line', type: 'Metro', coordinates: [1.276, 103.854], passengersPerHour: 6400, delayMins: 4, nextArrivalMin: 1, status: 'Crowded' },
        { id: 'st-sg-4', name: 'Jurong East Transit Hub', line: 'East-West Line', type: 'Metro', coordinates: [1.333, 103.742], passengersPerHour: 7100, delayMins: 2, nextArrivalMin: 4, status: 'Operational' },
      ];
    } else if (selectedCity === 'taipei') {
      return [
        { id: 'st-tp-1', name: 'Taipei Main Station', line: 'Bannan Line', type: 'Metro', coordinates: [25.047, 121.517], passengersPerHour: 8200, delayMins: 0, nextArrivalMin: 2, status: 'Operational' },
        { id: 'st-tp-2', name: 'Taipei 101 / World Trade Center', line: 'Tamsui-Xinyi Line', type: 'Metro', coordinates: [25.033, 121.564], passengersPerHour: 4900, delayMins: 0, nextArrivalMin: 3, status: 'Operational' },
      ];
    } else {
      return [
        { id: 'st-blr-1', name: 'Silk Board Bus Rapid Stop', line: 'BMTC Corridor', type: 'Bus', coordinates: [12.917, 77.623], passengersPerHour: 6200, delayMins: 12, nextArrivalMin: 8, status: 'Minor Delay' },
        { id: 'st-blr-2', name: 'Indiranagar Metro Station', line: 'Namma Metro Purple Line', type: 'Metro', coordinates: [12.978, 77.640], passengersPerHour: 5100, delayMins: 2, nextArrivalMin: 4, status: 'Operational' },
      ];
    }
  }, [selectedCity]);

  // AI Route Planner Options per city
  const routeOptions = useMemo<RouteOption[]>(() => {
    if (selectedCity === 'singapore') {
      return [
        {
          id: 'route-rec',
          name: 'Recommended AI Route (via MCE Express)',
          distanceKm: 18.4,
          durationMin: 22,
          congestionLevel: 'Low',
          tollsCost: '$2.20 ERP',
          viaRoads: ['Marina Coastal Expressway', 'Ayer Rajah Expressway'],
          aiReasoning: 'AI predicts lowest signal wait times and zero incident bottlenecks on tunnel corridors.',
          isRecommended: true,
        },
        {
          id: 'route-fast',
          name: 'Fastest Arterial (via CTE Expressway)',
          distanceKm: 16.8,
          durationMin: 28,
          congestionLevel: 'High',
          tollsCost: '$3.50 ERP',
          viaRoads: ['Central Expressway', 'Pan Island Expressway'],
          aiReasoning: 'Shorter distance but heavy morning merge queue at Braddell Flyover.',
          isRecommended: false,
        },
        {
          id: 'route-alt',
          name: 'Alternative Local Arterial (via Thomson Rd)',
          distanceKm: 20.1,
          durationMin: 34,
          congestionLevel: 'Moderate',
          tollsCost: '$0.00 ERP',
          viaRoads: ['Upper Thomson Road', 'Newton Road'],
          aiReasoning: 'Zero ERP toll option with moderate traffic light cycle delays.',
          isRecommended: false,
        },
      ];
    } else if (selectedCity === 'taipei') {
      return [
        {
          id: 'route-rec',
          name: 'Recommended AI Route (via Dunhua South)',
          distanceKm: 6.2,
          durationMin: 12,
          congestionLevel: 'Low',
          tollsCost: 'Free',
          viaRoads: ['Dunhua South Road', 'Xinyi Road BRT'],
          aiReasoning: 'Optimal green wave signal synchronization active along boulevard.',
          isRecommended: true,
        },
        {
          id: 'route-fast',
          name: 'Expressway Route (via Jianguo Flyover)',
          distanceKm: 7.5,
          durationMin: 18,
          congestionLevel: 'High',
          tollsCost: 'Free',
          viaRoads: ['Jianguo Elevated Expressway'],
          aiReasoning: 'Heavy ramp metering queue near Civic Boulevard junction.',
          isRecommended: false,
        },
      ];
    } else {
      return [
        {
          id: 'route-rec',
          name: 'Recommended AI Route (via Outer Ring Expressway)',
          distanceKm: 48.0,
          durationMin: 55,
          congestionLevel: 'Moderate',
          tollsCost: '₹120 Toll',
          viaRoads: ['Hebbal Flyover', 'Hosur Elevated Tollway'],
          aiReasoning: 'Bypasses Central Business District congestion hot spots.',
          isRecommended: true,
        },
        {
          id: 'route-fast',
          name: 'Direct City Center Route (via Bellary Rd)',
          distanceKm: 45.2,
          durationMin: 85,
          congestionLevel: 'High',
          tollsCost: 'Free',
          viaRoads: ['Bellary Road', 'Silk Board Junction'],
          aiReasoning: 'Severe bottleneck at Silk Board construction zone.',
          isRecommended: false,
        },
      ];
    }
  }, [selectedCity]);

  // Adjust road metrics dynamically based on timelineHour & scenarioMode
  const adjustedRoads = useMemo(() => {
    const rawRoads = CITY_ROADS[selectedCity] || CITY_ROADS['singapore'];

    // Timeline factor: peak hours (8-9:30 AM, 5:30-7:30 PM) increase congestion
    const isMorningPeak = timelineHour >= 8.0 && timelineHour <= 9.5;
    const isEveningPeak = timelineHour >= 17.5 && timelineHour <= 19.5;
    const peakFactor = isMorningPeak ? 1.35 : isEveningPeak ? 1.45 : 1.0;

    // Scenario factor
    let scenarioAddedCongestion = 0;
    let scenarioSpeedDrop = 0;
    if (scenarioMode === 'accident') {
      scenarioAddedCongestion = 28;
      scenarioSpeedDrop = 25;
    } else if (scenarioMode === 'heavy_rain') {
      scenarioAddedCongestion = 22;
      scenarioSpeedDrop = 18;
    } else if (scenarioMode === 'road_closure') {
      scenarioAddedCongestion = 35;
      scenarioSpeedDrop = 30;
    } else if (scenarioMode === 'festival') {
      scenarioAddedCongestion = 12;
      scenarioSpeedDrop = 8;
    } else if (scenarioMode === 'metro_delay') {
      scenarioAddedCongestion = 18;
      scenarioSpeedDrop = 12;
    } else if (scenarioMode === 'construction') {
      scenarioAddedCongestion = 10;
      scenarioSpeedDrop = 6;
    }

    return rawRoads.map((road) => {
      let finalCongestion = Math.min(100, Math.round(road.congestionIndex * peakFactor + scenarioAddedCongestion));
      let finalSpeed = Math.max(2, Math.round(road.currentSpeed / peakFactor - scenarioSpeedDrop));

      // Specific road closure simulation
      if (scenarioMode === 'road_closure' && (road.id.includes('1') || road.id.includes('3'))) {
        finalCongestion = 98;
        finalSpeed = 0;
      }

      return {
        ...road,
        currentSpeed: finalSpeed,
        congestionIndex: finalCongestion,
        travelTime: Math.round(road.normalTravelTime * (1 + finalCongestion / 60)),
      };
    });
  }, [selectedCity, timelineHour, scenarioMode]);

  // Road Type Filter Handlers & Counts
  const toggleRoadType = (type: RoadType) => {
    setRoadTypeFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const selectAllRoadTypes = () => {
    setRoadTypeFilters({
      Highway: true,
      Primary: true,
      Secondary: true,
      Residential: true,
      Emergency: true,
      'Bus Route': true,
      Construction: true,
    });
  };

  const clearAllRoadTypes = () => {
    setRoadTypeFilters({
      Highway: false,
      Primary: false,
      Secondary: false,
      Residential: false,
      Emergency: false,
      'Bus Route': false,
      Construction: false,
    });
  };

  const applyRoadTypePreset = (preset: 'highways_only' | 'emergency_only' | 'arterials' | 'local') => {
    if (preset === 'highways_only') {
      setRoadTypeFilters({
        Highway: true,
        Primary: false,
        Secondary: false,
        Residential: false,
        Emergency: false,
        'Bus Route': false,
        Construction: false,
      });
    } else if (preset === 'emergency_only') {
      setRoadTypeFilters({
        Highway: false,
        Primary: false,
        Secondary: false,
        Residential: false,
        Emergency: true,
        'Bus Route': false,
        Construction: false,
      });
    } else if (preset === 'arterials') {
      setRoadTypeFilters({
        Highway: true,
        Primary: true,
        Secondary: false,
        Residential: false,
        Emergency: true,
        'Bus Route': true,
        Construction: false,
      });
    } else if (preset === 'local') {
      setRoadTypeFilters({
        Highway: false,
        Primary: false,
        Secondary: true,
        Residential: true,
        Emergency: false,
        'Bus Route': false,
        Construction: false,
      });
    }
  };

  const roadTypeCounts = useMemo(() => {
    const counts: Record<RoadType, number> = {
      Highway: 0,
      Primary: 0,
      Secondary: 0,
      Residential: 0,
      Emergency: 0,
      'Bus Route': 0,
      Construction: 0,
    };
    adjustedRoads.forEach((r) => {
      const t: RoadType = r.roadType || (r.name.toLowerCase().includes('expressway') ? 'Highway' : 'Primary');
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [adjustedRoads]);

  const activeRoadTypeCount = useMemo(() => {
    return Object.values(roadTypeFilters).filter(Boolean).length;
  }, [roadTypeFilters]);

  const visibleRoadSegmentsCount = useMemo(() => {
    return adjustedRoads.filter((r) => {
      const t: RoadType = r.roadType || (r.name.toLowerCase().includes('expressway') ? 'Highway' : 'Primary');
      return roadTypeFilters[t] !== false;
    }).length;
  }, [adjustedRoads, roadTypeFilters]);

  // GPS & Geolocation Control Handlers
  const startGpsTracking = () => {
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }

    setGpsLoading(true);
    setGpsError(null);

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser environment.');
      setGpsLoading(false);
      simulateGpsPosition();
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsLoading(false);
        setIsGpsActive(true);
        setUserGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
          heading: pos.coords.heading ? Math.round(pos.coords.heading) : 0,
          timestamp: pos.timestamp,
          isSimulated: false,
        });

        if (mapInstanceRef.current && !userGpsLocation) {
          mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { animate: true });
        }
      },
      (err) => {
        console.warn('Browser GPS lookup failed, activating city GPS simulation:', err.message);
        setGpsLoading(false);
        setGpsError('Browser GPS restricted. Activated city smart GPS simulation.');
        simulateGpsPosition();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    watchPositionIdRef.current = watchId;
  };

  const simulateGpsPosition = () => {
    setIsGpsActive(true);
    const centerLat = cityConfig?.lat ?? 1.3521;
    const centerLng = cityConfig?.lng ?? 103.8198;
    const simLat = centerLat + (Math.random() - 0.5) * 0.008;
    const simLng = centerLng + (Math.random() - 0.5) * 0.008;

    setUserGpsLocation({
      lat: simLat,
      lng: simLng,
      accuracy: 8,
      speed: Math.floor(35 + Math.random() * 25),
      heading: 142,
      timestamp: Date.now(),
      isSimulated: true,
    });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([simLat, simLng], 15, { animate: true });
    }
  };

  const stopGpsTracking = () => {
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
    setIsGpsActive(false);
    setUserGpsLocation(null);
    setGpsError(null);
  };

  const recenterOnGps = () => {
    if (userGpsLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userGpsLocation.lat, userGpsLocation.lng], 16, { animate: true });
    }
  };

  const getGoogleMapsDirectionsUrl = (destLat?: number, destLng?: number) => {
    if (!userGpsLocation) return 'https://www.google.com/maps';
    const origin = `${userGpsLocation.lat},${userGpsLocation.lng}`;
    const dest = destLat && destLng ? `${destLat},${destLng}` : `${cityConfig?.lat ?? 1.3521},${cityConfig?.lng ?? 103.8198}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  };

  // Live Statistics for Smart Legend
  const legendStats = useMemo(() => {
    if (!adjustedRoads.length) return { greenPct: 0, yellowPct: 0, orangePct: 0, redPct: 0, closedPct: 0 };
    let green = 0, yellow = 0, orange = 0, red = 0, closed = 0;

    adjustedRoads.forEach((r) => {
      if (r.currentSpeed === 0 || r.congestionIndex >= 95) closed++;
      else if (r.currentSpeed > 60) green++;
      else if (r.currentSpeed >= 40) yellow++;
      else if (r.currentSpeed >= 20) orange++;
      else red++;
    });

    const total = adjustedRoads.length;
    return {
      greenPct: Math.round((green / total) * 100),
      yellowPct: Math.round((yellow / total) * 100),
      orangePct: Math.round((orange / total) * 100),
      redPct: Math.round((red / total) * 100),
      closedPct: Math.round((closed / total) * 100),
    };
  }, [adjustedRoads]);

  // Computed Region Inspection Stats (when user draws a bounding region)
  const regionStats = useMemo(() => {
    if (regionPoints.length < 3) return null;

    // Estimate stats for region
    const totalVehicles = adjustedRoads.reduce((sum, r) => sum + r.vehicleCount, 0);
    const avgSpeed = Math.round(adjustedRoads.reduce((sum, r) => sum + r.currentSpeed, 0) / (adjustedRoads.length || 1));
    const activeIncidents = dashboardData?.incidents.filter((i) => i.status !== 'resolved').length || 0;

    return {
      vehicles: Math.round(totalVehicles * 0.42),
      avgSpeed,
      incidents: activeIncidents,
      status: avgSpeed < 25 ? 'Critical Density' : 'Flowing',
    };
  }, [regionPoints, adjustedRoads, dashboardData]);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [cityConfig.lat, cityConfig.lng],
        zoom: cityConfig.zoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = L.layerGroup().addTo(map);
      measureGroupRef.current = L.layerGroup().addTo(map);

      // Map Click Event Listener for Measure & Region Tools
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (measureMode) {
          setMeasurePoints((prev) => [...prev, [lat, lng]]);
        } else if (drawRegionMode) {
          setRegionPoints((prev) => [...prev, [lat, lng]]);
        }
      });
    } else {
      mapInstanceRef.current.setView([cityConfig.lat, cityConfig.lng], cityConfig.zoom);
    }
  }, [selectedCity, cityConfig, measureMode, drawRegionMode]);

  // Render All Map Elements
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup || !dashboardData) return;

    layersGroup.clearLayers();

    const cameras = CITY_CAMERAS[selectedCity] || CITY_CAMERAS['singapore'];

    // Helper: Determine road line color based on active View Mode
    const getRoadColor = (road: RoadSegment) => {
      if (road.currentSpeed === 0 || road.congestionIndex >= 95) return '#000000'; // Closed / Gridlock

      if (viewMode === 'flow' || viewMode === 'speed') {
        if (road.currentSpeed > 60) return '#16A34A'; // Green - Free Flow
        if (road.currentSpeed >= 40) return '#EAB308'; // Yellow - Moderate
        if (road.currentSpeed >= 20) return '#F97316'; // Orange - Slow
        if (road.currentSpeed >= 5) return '#EF4444'; // Red - Heavy
        return '#7F1D1D'; // Dark Red - Critical
      } else if (viewMode === 'congestion') {
        if (road.congestionIndex < 30) return '#16A34A';
        if (road.congestionIndex < 60) return '#EAB308';
        if (road.congestionIndex < 85) return '#EF4444';
        return '#7F1D1D';
      } else if (viewMode === 'travel_time') {
        const ratio = road.travelTime / road.normalTravelTime;
        if (ratio <= 1.2) return '#16A34A';
        if (ratio <= 1.8) return '#EAB308';
        return '#DC2626';
      } else if (viewMode === 'capacity') {
        if (road.vehicleCount < 2000) return '#16A34A';
        if (road.vehicleCount < 3500) return '#F97316';
        return '#DC2626';
      } else if (viewMode === 'signals') {
        if (road.signalHealth >= 98) return '#16A34A';
        if (road.signalHealth >= 90) return '#EAB308';
        return '#DC2626';
      }
      return '#16A34A';
    };

    // Helper: Get Dash Animation Speed Class
    const getAnimClass = (road: RoadSegment) => {
      if (road.currentSpeed > 60) return 'traffic-flow-fast';
      if (road.currentSpeed >= 40) return 'traffic-flow-moderate';
      if (road.currentSpeed >= 20) return 'traffic-flow-slow';
      return 'traffic-flow-gridlock';
    };

    // 1. ROAD SEGMENTS WITH ANIMATED TRAFFIC FLOW
    if (layers.traffic) {
      adjustedRoads.forEach((road) => {
        // Filter by Search Query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!road.name.toLowerCase().includes(q) && !road.district.toLowerCase().includes(q)) return;
        }

        // Filter by Road Type Control Panel
        const rType: RoadType = road.roadType || 
          (road.name.toLowerCase().includes('expressway') || road.name.toLowerCase().includes('pie') || road.name.toLowerCase().includes('cte') || road.name.toLowerCase().includes('aye') ? 'Highway' : 'Primary');

        if (roadTypeFilters[rType] === false) return;

        // Legacy dropdown filter
        if (roadFilter !== 'all') {
          if (roadFilter === 'highway' && rType !== 'Highway') return;
          if (roadFilter === 'primary' && rType !== 'Primary') return;
        }

        const strokeColor = getRoadColor(road);

        // Thickness based on road type category
        let weight = 5;
        if (rType === 'Highway') weight = 8;
        else if (rType === 'Primary' || rType === 'Emergency' || rType === 'Bus Route') weight = 6;
        else if (rType === 'Residential') weight = 4;

        // Background Casing Polyline for High Contrast GIS feel
        const casing = L.polyline(road.coordinates, {
          color: '#1E293B',
          weight: weight + 2,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round',
        });
        layersGroup.addLayer(casing);

        // Main Traffic Color Line
        const mainLine = L.polyline(road.coordinates, {
          color: strokeColor,
          weight: weight,
          opacity: opacity.traffic,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Animated Traffic Flow Overlay Polyline
        const animClass = getAnimClass(road);
        const flowLine = L.polyline(road.coordinates, {
          color: '#FFFFFF',
          weight: 2,
          opacity: 0.85,
          className: animClass,
        });

        // Interactive Tooltip
        const tooltipHTML = `
          <div class="font-sans text-xs p-1">
            <div class="font-bold text-gray-900 border-b border-gray-200 pb-1 flex items-center justify-between gap-2">
              <span>${road.name}</span>
              <span class="px-1.5 py-0.2 bg-slate-900 text-white rounded text-[9px] font-mono">${road.code}</span>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5 text-[11px]">
              <div>Current Speed: <strong class="text-blue-700">${road.currentSpeed} km/h</strong></div>
              <div>Average Speed: <span class="text-gray-600">${road.avgSpeed} km/h</span></div>
              <div>Congestion: <strong class="${road.congestionIndex > 70 ? 'text-red-600' : 'text-emerald-600'}">${road.congestionIndex}%</strong></div>
              <div>Vehicles: <span class="text-gray-700 font-mono">${road.vehicleCount.toLocaleString()}/hr</span></div>
              <div>Travel Time: <strong class="text-slate-800">${road.travelTime}m</strong> (Normal ${road.normalTravelTime}m)</div>
              <div>Status: <span class="font-semibold text-gray-700">${road.density}</span></div>
            </div>
            <div class="mt-1 text-[10px] text-gray-400 font-mono">Click road to open GIS Operations Drawer</div>
          </div>
        `;

        mainLine.bindTooltip(tooltipHTML, { sticky: true });
        mainLine.on('click', () => onSelectObject('road', road));

        flowLine.bindTooltip(tooltipHTML, { sticky: true });
        flowLine.on('click', () => onSelectObject('road', road));

        layersGroup.addLayer(mainLine);
        layersGroup.addLayer(flowLine);
      });
    }

    // 2. TRAFFIC HEATMAP OVERLAY
    if (layers.heatmap) {
      adjustedRoads.forEach((road) => {
        if (road.congestionIndex > 40) {
          const center = road.coordinates[Math.floor(road.coordinates.length / 2)];
          const color = road.congestionIndex > 75 ? '#ef4444' : road.congestionIndex > 55 ? '#f97316' : '#eab308';
          const radius = road.congestionIndex * 12;

          const circle = L.circle(center, {
            radius: radius,
            color: 'transparent',
            fillColor: color,
            fillOpacity: opacity.heatmap,
          });
          layersGroup.addLayer(circle);
        }
      });
    }

    // 3. PUBLIC TRANSIT LINES & INTERACTIVE STATIONS
    if (layers.transit) {
      // Transit Lines Polylines
      transitStations.forEach((st, idx) => {
        if (idx < transitStations.length - 1) {
          const nextSt = transitStations[idx + 1];
          const isMetro = st.type === 'Metro';
          const transitLine = L.polyline([st.coordinates, nextSt.coordinates], {
            color: isMetro ? '#9333EA' : '#2563EB',
            weight: 4,
            dashArray: isMetro ? '10, 6' : '4, 4',
            opacity: opacity.transit,
          });
          transitLine.bindTooltip(`Transit Route: ${st.line}`, { sticky: true });
          layersGroup.addLayer(transitLine);
        }

        // Station Markers
        const stIcon = L.divIcon({
          className: 'custom-station-marker',
          html: `<div style="background-color: ${st.type === 'Metro' ? '#9333EA' : '#2563EB'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; cursor: pointer;">${st.type === 'Metro' ? '🚉' : '🚌'}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const stationMarker = L.marker(st.coordinates, { icon: stIcon });
        stationMarker.on('click', () => setSelectedStation(st));
        stationMarker.bindTooltip(`<b>${st.name}</b><br/>Line: ${st.line}<br/>Ridership: ${st.passengersPerHour.toLocaleString()} p/hr`, { sticky: true });
        layersGroup.addLayer(stationMarker);
      });
    }

    // 4. AI ROUTE PLANNER DRAWN ROUTES
    if (showRoutePlanner) {
      routeOptions.forEach((rt) => {
        const isSelected = rt.id === selectedRouteId;
        const color = rt.isRecommended ? '#16A34A' : rt.id === 'route-fast' ? '#2563EB' : '#F59E0B';
        const rawRoads = CITY_ROADS[selectedCity] || CITY_ROADS['singapore'];

        // Find matching road segments for this specific route's corridors
        const matchedRoads = rawRoads.filter((r) =>
          rt.viaRoads.some((v) => r.name.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(r.name.toLowerCase()))
        );

        const routeCoords = matchedRoads.length > 0
          ? matchedRoads.flatMap((r) => r.coordinates)
          : rawRoads.slice(0, 2).flatMap((r) => r.coordinates);

        if (routeCoords.length > 1) {
          const routeLine = L.polyline(routeCoords, {
            color: color,
            weight: isSelected ? 8 : 5,
            opacity: isSelected ? 1.0 : 0.65,
            dashArray: rt.isRecommended ? undefined : '6, 6',
          });

          routeLine.bindTooltip(
            `<b>${rt.name}</b><br/>ETA: ${rt.durationMin} mins • Distance: ${rt.distanceKm} km<br/>Via: ${rt.viaRoads.join(' → ')}`,
            { sticky: true }
          );
          routeLine.on('click', () => setSelectedRouteId(rt.id));
          layersGroup.addLayer(routeLine);
        }
      });
    }

    // 5. EMERGENCY ROUTES CORRIDORS
    if (layers.emergencyRoutes) {
      const centerLat = cityConfig.lat;
      const centerLng = cityConfig.lng;
      const emPoints: [number, number][] = [
        [centerLat - 0.025, centerLng + 0.015],
        [centerLat, centerLng],
        [centerLat + 0.03, centerLng - 0.02],
      ];

      const emLine = L.polyline(emPoints, {
        color: '#2563EB',
        weight: 5,
        dashArray: '10, 8',
        opacity: opacity.transit,
      });
      emLine.bindTooltip('Emergency Clear Corridor (High Priority Flow)', { sticky: true });
      layersGroup.addLayer(emLine);
    }

    // 6. INCIDENTS MARKERS
    if (layers.incidents) {
      dashboardData.incidents.forEach((inc) => {
        if (inc.status === 'resolved') return;

        const isClosed = inc.type === 'closure';
        const isCritical = inc.severity === 'critical';
        const color = isClosed ? '#18181B' : isCritical ? '#DC2626' : inc.severity === 'major' ? '#F97316' : '#2563EB';

        const customIcon = L.divIcon({
          className: 'custom-incident-marker',
          html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 13px; cursor: pointer;">!</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker(inc.coordinates, { icon: customIcon });
        marker.on('click', () => onSelectObject('incident', inc));
        marker.bindTooltip(`<b>${inc.title}</b><br/>Type: ${inc.type.toUpperCase()}<br/>Severity: ${inc.severity.toUpperCase()}`, { sticky: true });
        layersGroup.addLayer(marker);
      });
    }

    // 7. TRAFFIC CAMERAS MARKERS
    if (layers.cameras) {
      cameras.forEach((cam) => {
        const camIcon = L.divIcon({
          className: 'custom-cam-marker',
          html: `<div style="background-color: #0F172A; width: 24px; height: 24px; border-radius: 4px; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #38BDF8; font-size: 11px; cursor: pointer;">📷</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(cam.coordinates, { icon: camIcon });
        marker.on('click', () => onSelectObject('camera', cam));
        marker.bindTooltip(`<b>${cam.name}</b><br/>Status: ${cam.status}<br/>Vehicles Detected: ${cam.aiVehicleCount}`, { sticky: true });
        layersGroup.addLayer(marker);
      });
    }

    // 8. ADAPTIVE SIGNAL CONTROLLERS MARKERS
    if (layers.signals) {
      adjustedRoads.forEach((road, idx) => {
        if (!road.coordinates[0]) return;
        const coord = road.coordinates[0];

        const signalIcon = L.divIcon({
          className: 'custom-signal-marker',
          html: `<div style="background-color: #1E293B; width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${road.signalHealth >= 98 ? '#22C55E' : '#EAB308'}; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #22C55E; font-size: 10px; font-weight: bold; cursor: pointer;">🚥</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const signalObj: SignalController = {
          id: `signal-${idx}`,
          junctionName: `${road.name} Adaptive Junction`,
          coordinates: coord,
          currentPhase: idx % 2 === 0 ? 'North-South Green' : 'East-West Green',
          cycleLengthSec: 120,
          greenDurationSec: 65,
          mode: 'Adaptive AI',
          health: road.signalHealth,
        };

        const marker = L.marker(coord, { icon: signalIcon });
        marker.on('click', () => onSelectObject('signal', signalObj));
        marker.bindTooltip(`<b>${signalObj.junctionName}</b><br/>Phase: ${signalObj.currentPhase}<br/>AI Health: ${signalObj.health}%`, { sticky: true });
        layersGroup.addLayer(marker);
      });
    }

    // 9. SENSORS MARKERS
    if (layers.sensors && dashboardData.sensors) {
      dashboardData.sensors.forEach((sensor) => {
        const sColor = sensor.status === 'critical' ? '#DC2626' : sensor.status === 'warning' ? '#F97316' : '#16A34A';
        const sensorIcon = L.divIcon({
          className: 'custom-sensor-marker',
          html: `<div style="background-color: ${sColor}; width: 18px; height: 18px; border-radius: 3px; border: 1.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker(sensor.coordinates, { icon: sensorIcon });
        marker.on('click', () => onSelectObject('sensor', sensor));
        marker.bindTooltip(`<b>${sensor.name}</b><br/>Value: ${sensor.value} ${sensor.unit}`, { sticky: true });
        layersGroup.addLayer(marker);
      });
    }

    // 10. GPS USER BEACON MARKER & ACCURACY CIRCLE
    if (isGpsActive && userGpsLocation) {
      const gpsLatLng: [number, number] = [userGpsLocation.lat, userGpsLocation.lng];

      // Accuracy Halo Circle
      const accuracyCircle = L.circle(gpsLatLng, {
        radius: Math.max(userGpsLocation.accuracy, 15),
        color: '#2563EB',
        fillColor: '#60A5FA',
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 4',
      });
      layersGroup.addLayer(accuracyCircle);

      // Pulsing GPS Beacon Marker
      const gpsIcon = L.divIcon({
        className: 'custom-gps-user-beacon',
        html: `
          <div style="position: relative; width: 26px; height: 26px; cursor: pointer;">
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(37, 99, 235, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 18px; height: 18px; border-radius: 50%; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 0 12px rgba(37, 99, 235, 0.9);"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const gpsMarker = L.marker(gpsLatLng, { icon: gpsIcon, zIndexOffset: 1000 });
      gpsMarker.bindTooltip(
        `<b>📍 Your Live GPS Location</b><br/>Speed: ${userGpsLocation.speed || 0} km/h<br/>Accuracy: ±${userGpsLocation.accuracy}m`,
        { sticky: true }
      );
      layersGroup.addLayer(gpsMarker);
    }

  }, [selectedCity, layers, opacity, viewMode, adjustedRoads, searchQuery, roadFilter, roadTypeFilters, showRoutePlanner, selectedRouteId, transitStations, routeOptions, dashboardData, onSelectObject, cityConfig, isGpsActive, userGpsLocation]);

  // Render Measurement & Region Drawing Overlays
  useEffect(() => {
    const measureGroup = measureGroupRef.current;
    if (!measureGroup) return;

    measureGroup.clearLayers();

    // 1. Draw Distance Measurement Line
    if (measurePoints.length > 0) {
      const line = L.polyline(measurePoints, {
        color: '#DC2626',
        weight: 3,
        dashArray: '6, 6',
      });
      measureGroup.addLayer(line);

      measurePoints.forEach((pt, i) => {
        const dot = L.circleMarker(pt, { radius: 5, color: '#DC2626', fillColor: '#FFFFFF', fillOpacity: 1 });
        measureGroup.addLayer(dot);
      });

      // Compute total distance
      if (measurePoints.length >= 2) {
        let totalMeters = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
          const p1 = L.latLng(measurePoints[i][0], measurePoints[i][1]);
          const p2 = L.latLng(measurePoints[i + 1][0], measurePoints[i + 1][1]);
          totalMeters += p1.distanceTo(p2);
        }
        const distText = totalMeters > 1000 ? `${(totalMeters / 1000).toFixed(2)} km` : `${Math.round(totalMeters)} m`;
        const lastPt = measurePoints[measurePoints.length - 1];

        const labelIcon = L.divIcon({
          className: 'custom-dist-label',
          html: `<div style="background: #1E293B; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; border: 1px solid #475569;">Distance: ${distText}</div>`,
          iconSize: [90, 20],
        });
        measureGroup.addLayer(L.marker(lastPt, { icon: labelIcon }));
      }
    }

    // 2. Draw Region Bounding Box / Area
    if (regionPoints.length >= 3) {
      const polygon = L.polygon(regionPoints, {
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.25,
        weight: 2,
      });
      measureGroup.addLayer(polygon);
    }
  }, [measurePoints, regionPoints]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cityConfig.lat, cityConfig.lng], cityConfig.zoom);
    }
  };

  const clearTools = () => {
    setMeasurePoints([]);
    setRegionPoints([]);
    setMeasureMode(false);
    setDrawRegionMode(false);
  };

  // Convert timeline hour to pretty string
  const formatTimeStr = (h: number) => {
    const hours = Math.floor(h);
    const mins = Math.round((h - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const displayM = mins < 10 ? `0${mins}` : mins;
    return `${displayH}:${displayM} ${period}`;
  };

  return (
    <div className={`relative w-full h-full bg-slate-900 flex flex-col rounded-md overflow-hidden border border-slate-700 shadow-lg ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'min-h-[480px]'}`}>
      
      {/* CSS Animations for Traffic Dash Flow */}
      <style>{`
        @keyframes trafficDashFlow {
          from { stroke-dashoffset: 32; }
          to { stroke-dashoffset: 0; }
        }
        .traffic-flow-fast {
          stroke-dasharray: 6, 12;
          animation: trafficDashFlow 0.8s linear infinite;
        }
        .traffic-flow-moderate {
          stroke-dasharray: 6, 12;
          animation: trafficDashFlow 1.8s linear infinite;
        }
        .traffic-flow-slow {
          stroke-dasharray: 6, 12;
          animation: trafficDashFlow 4.0s linear infinite;
        }
        .traffic-flow-gridlock {
          stroke-dasharray: 6, 12;
          animation: trafficDashFlow 9.0s linear infinite;
        }
      `}</style>

      {/* 1. TOP HEADER GIS CONTROL BAR */}
      <div className="absolute top-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
        
        {/* Left Status Tag & Search */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900/95 text-white px-3 py-1.5 rounded shadow-lg text-[11px] font-bold flex items-center gap-2 border border-slate-700 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Traffic Operations GIS</span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">({cityConfig.name})</span>
          </div>

          {/* Search Input Bar */}
          <div className="relative hidden md:flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search roads, corridors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/90 text-white placeholder-slate-400 pl-8 pr-3 py-1 rounded text-xs border border-slate-700 focus:outline-none focus:border-blue-500 w-44 shadow-md font-sans"
            />
          </div>

          {scenarioMode !== 'none' && (
            <div className="bg-red-600 text-white px-2.5 py-1 rounded shadow-lg text-[11px] font-bold flex items-center gap-1.5 animate-pulse border border-red-500">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Scenario: {SCENARIO_CONFIGS.find(s => s.id === scenarioMode)?.title || scenarioMode}</span>
              <button onClick={() => setScenarioMode('none')} className="hover:text-red-200 font-extrabold text-xs ml-1">✕</button>
            </div>
          )}
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="hidden lg:flex items-center bg-slate-900/95 p-1 rounded-md border border-slate-700 shadow-xl backdrop-blur-md space-x-0.5 text-[10px]">
          {[
            { id: 'flow', label: 'Flow' },
            { id: 'congestion', label: 'Congestion' },
            { id: 'speed', label: 'Speed' },
            { id: 'travel_time', label: 'Travel Time' },
            { id: 'capacity', label: 'Capacity' },
            { id: 'signals', label: 'Signals' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as ViewModeType)}
              className={`px-2 py-1 rounded font-bold transition-all ${
                viewMode === mode.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Right Action Tools Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Scenario Trigger Dropdown */}
          <select
            value={scenarioMode}
            onChange={(e) => setScenarioMode(e.target.value as ScenarioType)}
            className="bg-slate-900/95 text-white text-[10px] font-bold px-2 py-1.5 rounded border border-slate-700 shadow-md focus:outline-none cursor-pointer"
          >
            <option value="none">🎬 Normal Operations</option>
            <option value="heavy_rain">🌧️ Heavy Rain Scenario</option>
            <option value="road_closure">🚫 Road Closure Scenario</option>
            <option value="accident">💥 Expressway Accident</option>
            <option value="festival">🎉 Cultural Parade / Festival</option>
            <option value="metro_delay">🚆 Metro Service Delay</option>
            <option value="construction">🚧 Construction Zone</option>
          </select>

          {/* AI Route Planner Button */}
          <button
            onClick={() => setShowRoutePlanner(!showRoutePlanner)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors border shadow-md ${
              showRoutePlanner ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI Routes</span>
          </button>

          {/* Measure Distance Tool */}
          <button
            onClick={() => {
              clearTools();
              setMeasureMode(!measureMode);
            }}
            title="Measure Distance"
            className={`p-1.5 rounded border shadow-md text-xs font-bold transition-colors ${
              measureMode ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900/95 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Region Inspection Tool */}
          <button
            onClick={() => {
              clearTools();
              setDrawRegionMode(!drawRegionMode);
            }}
            title="Inspect Region Bounding Box"
            className={`p-1.5 rounded border shadow-md text-xs font-bold transition-colors ${
              drawRegionMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/95 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>

          {/* GPS Live Tracking & Google Maps Navigation */}
          <button
            onClick={() => {
              if (isGpsActive) {
                setShowGpsPanel(!showGpsPanel);
              } else {
                startGpsTracking();
                setShowGpsPanel(true);
              }
            }}
            title="GPS Live Telemetry & Google Maps Navigation"
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all border shadow-md ${
              isGpsActive
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30'
                : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            {gpsLoading ? (
              <Activity className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : isGpsActive ? (
              <LocateFixed className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden sm:inline">GPS Live</span>
            {isGpsActive && (
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-ping inline-block" />
            )}
          </button>

          {/* Road Type Layer Control Toggle */}
          <button
            onClick={() => setShowRoadTypePanel(!showRoadTypePanel)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors border shadow-md ${
              showRoadTypePanel ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Road Types</span>
            <span className="bg-amber-950/80 text-amber-300 font-mono text-[9px] px-1.5 py-0.2 rounded border border-amber-800/80">
              {activeRoadTypeCount}/7
            </span>
          </button>

          {/* Layer Panel Toggle */}
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors border shadow-md ${
              showLayerPanel ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Layers</span>
          </button>

          {/* Timeline Bar Toggle */}
          <button
            onClick={() => setShowTimelineBar(!showTimelineBar)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors border shadow-md ${
              showTimelineBar ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:bg-slate-800'
            }`}
            title="Toggle Time Simulation Scrubbing Bar"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Timeline</span>
          </button>

          {/* Recenter & Fullscreen */}
          <button onClick={resetView} title="Recenter Map" className="p-1.5 bg-slate-900/95 text-slate-300 hover:bg-slate-800 border border-slate-700 rounded shadow-md">
            <Navigation className="w-4 h-4 text-blue-400" />
          </button>

          <button onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen" className="p-1.5 bg-slate-900/95 text-slate-300 hover:bg-slate-800 border border-slate-700 rounded shadow-md">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2A. FLOATING LEAFLET ROAD TYPE LAYER CONTROL PANEL */}
      {showRoadTypePanel && (
        <div className="absolute top-12 right-16 z-40 bg-slate-900/95 text-slate-100 backdrop-blur-md p-3.5 rounded-md border border-amber-500/60 shadow-2xl w-80 text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-bold text-xs">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Layers className="w-4 h-4 text-amber-400" /> Leaflet Road Type Control
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">
              {visibleRoadSegmentsCount}/{adjustedRoads.length} Active
            </span>
            <button onClick={() => setShowRoadTypePanel(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
          </div>

          {/* Quick Presets Bar */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Presets:</span>
              <div className="flex gap-1">
                <button
                  onClick={selectAllRoadTypes}
                  className="text-[9px] text-amber-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={clearAllRoadTypes}
                  className="text-[9px] text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => applyRoadTypePreset('highways_only')}
                className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded text-[10px] font-bold border border-amber-800/80 text-left truncate"
              >
                ⚡ Highways Only
              </button>
              <button
                onClick={() => applyRoadTypePreset('emergency_only')}
                className="px-2 py-1 bg-blue-950/80 hover:bg-blue-900 text-blue-300 rounded text-[10px] font-bold border border-blue-800/80 text-left truncate"
              >
                🚨 Emergency Corridors
              </button>
              <button
                onClick={() => applyRoadTypePreset('arterials')}
                className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-bold border border-emerald-800/80 text-left truncate"
              >
                🏙️ Arterial Grid
              </button>
              <button
                onClick={() => applyRoadTypePreset('local')}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-700 text-left truncate"
              >
                🏡 Local Network
              </button>
            </div>
          </div>

          {/* Leaflet Layer Control Checkboxes */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Road Category Layers:</div>
            {(Object.keys(ROAD_TYPE_CONFIG) as RoadType[]).map((type) => {
              const config = ROAD_TYPE_CONFIG[type];
              const isChecked = roadTypeFilters[type];
              const count = roadTypeCounts[type] || 0;

              return (
                <label
                  key={type}
                  className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-slate-800/90 border-slate-600 shadow-xs'
                      : 'bg-slate-950/50 border-slate-800/80 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRoadType(type)}
                      className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer accent-amber-500 shrink-0"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] text-white truncate">
                        {config.label}
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight truncate">
                        {config.description}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${config.badgeBg}`}>
                    {count} {count === 1 ? 'road' : 'roads'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 2C. GOOGLE MAPS & GPS TELEMETRY CONTROL PANEL */}
      {showGpsPanel && (
        <div className="absolute top-12 right-12 z-40 bg-slate-900/95 text-slate-100 backdrop-blur-md p-4 rounded-md border border-blue-500/60 shadow-2xl w-84 text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-bold text-xs">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Crosshair className="w-4 h-4 text-blue-400" /> Google Maps GPS Telemetry
            </span>
            <div className="flex items-center gap-2">
              {isGpsActive && (
                <span className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {userGpsLocation?.isSimulated ? 'Simulated GPS' : 'Browser GPS'}
                </span>
              )}
              <button onClick={() => setShowGpsPanel(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>
          </div>

          {gpsError && (
            <div className="p-2 bg-amber-950/60 border border-amber-800/80 rounded text-[10px] text-amber-200">
              {gpsError}
            </div>
          )}

          {userGpsLocation ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded border border-slate-800/80 font-mono text-[11px]">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-sans">Latitude</span>
                  <span className="text-blue-300 font-bold">{userGpsLocation.lat.toFixed(5)}°</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-sans">Longitude</span>
                  <span className="text-blue-300 font-bold">{userGpsLocation.lng.toFixed(5)}°</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-sans">Speed</span>
                  <span className="text-emerald-400 font-bold">{userGpsLocation.speed || 0} km/h</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-sans">Accuracy</span>
                  <span className="text-slate-200">±{userGpsLocation.accuracy}m</span>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={recenterOnGps}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  Center My Location
                </button>
                <a
                  href={getGoogleMapsDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Google Maps
                </a>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <button
                  onClick={simulateGpsPosition}
                  className="text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" /> Simulate GPS Drive
                </button>
                <button
                  onClick={stopGpsTracking}
                  className="text-red-400 hover:underline"
                >
                  Turn Off GPS
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center py-2">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Connect your device's live GPS receiver to track position, current speed, and export turn-by-turn routes directly into <strong>Google Maps</strong>.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={startGpsTracking}
                  disabled={gpsLoading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md"
                >
                  {gpsLoading ? (
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="w-3.5 h-3.5" />
                  )}
                  Activate Device GPS
                </button>
                <button
                  onClick={simulateGpsPosition}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-bold text-[11px]"
                >
                  Simulate GPS
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2B. SLIDE-OUT LAYERS & OPACITY PANEL */}
      {showLayerPanel && (
        <div className="absolute top-12 right-3 z-30 bg-slate-900/95 text-slate-100 backdrop-blur-md p-3.5 rounded-md border border-slate-700 shadow-2xl w-80 text-xs space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-bold text-xs">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Sliders className="w-4 h-4" /> GIS Layer Controls
            </span>
            <button onClick={() => setShowLayerPanel(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-[11px]">
            <div className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Data Overlays:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(layers) as Array<keyof typeof layers>).map((key) => {
                const isEnabled = layers[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-semibold transition-colors border ${
                      isEnabled
                        ? 'bg-blue-900/60 text-blue-300 border-blue-600'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="capitalize">{String(key).replace(/([A-Z])/g, ' $1')}</span>
                    {isEnabled ? <Eye className="w-3 h-3 text-blue-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                  </button>
                );
              })}
            </div>

            {/* Road Filter Selection */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-300 text-[10px]">
                <span className="uppercase tracking-wider">Road Category Filtering:</span>
                <span className="text-[9px] text-amber-400 font-mono">{activeRoadTypeCount}/7 Active</span>
              </div>
              <div className="space-y-1">
                {(Object.keys(ROAD_TYPE_CONFIG) as RoadType[]).map((type) => {
                  const config = ROAD_TYPE_CONFIG[type];
                  const isChecked = roadTypeFilters[type];
                  const count = roadTypeCounts[type] || 0;

                  return (
                    <label
                      key={type}
                      className="flex items-center justify-between p-1.5 bg-slate-800/60 rounded border border-slate-700/80 cursor-pointer hover:bg-slate-800 text-[10px]"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRoadType(type)}
                          className="w-3 h-3 text-amber-500 rounded bg-slate-900 border-slate-700 accent-amber-500"
                        />
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                        <span className="text-white font-medium truncate">{config.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI ROUTE PLANNER OVERLAY PANEL */}
      {showRoutePlanner && (
        <div className="absolute top-12 left-3 z-30 bg-slate-900/95 text-slate-100 backdrop-blur-md p-3 rounded-md border border-slate-700 shadow-2xl w-80 text-xs space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-bold text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Compass className="w-4 h-4" /> AI Multi-Path Route Optimizer
            </span>
            <button onClick={() => setShowRoutePlanner(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
          </div>

          <div className="space-y-2">
            {routeOptions.map((rt) => {
              const isSelected = rt.id === selectedRouteId;
              return (
                <div
                  key={rt.id}
                  onClick={() => setSelectedRouteId(rt.id)}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className={rt.isRecommended ? 'text-emerald-400' : 'text-slate-200'}>{rt.name}</span>
                    {rt.isRecommended && <span className="bg-emerald-900/80 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded border border-emerald-700">AI Choice</span>}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>ETA: <strong className="text-white">{rt.durationMin} mins</strong></span>
                    <span>Distance: <span className="text-slate-300 font-mono">{rt.distanceKm} km</span></span>
                    <span>Tolls: <span className="text-amber-300">{rt.tollsCost}</span></span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 italic bg-slate-900/80 p-1 rounded border border-slate-800">
                    "{rt.aiReasoning}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. REGION INSPECTION MODAL CARD */}
      {regionStats && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-slate-100 p-2.5 rounded-md border border-blue-500 shadow-2xl flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Square className="w-4 h-4 text-blue-400" /> Bounding Region Telemetry:
          </div>
          <div>Vehicles: <strong className="text-white">{regionStats.vehicles}</strong></div>
          <div>Avg Speed: <strong className="text-emerald-400">{regionStats.avgSpeed} km/h</strong></div>
          <div>Incidents: <strong className="text-red-400">{regionStats.incidents}</strong></div>
          <button onClick={() => setRegionPoints([])} className="bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded text-[10px] font-bold text-white">Clear</button>
        </div>
      )}

      {/* LEAFLET MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 5. SMART LEGEND OVERLAY (BOTTOM LEFT) */}
      <div className="absolute bottom-12 left-3 z-10 bg-slate-900/95 text-slate-100 backdrop-blur-md px-3 py-2 rounded-md border border-slate-700 shadow-xl text-[10px] flex items-center space-x-3.5">
        <span className="font-bold text-slate-200 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-blue-400" /> Live Legend:
        </span>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Free Flow ({legendStats.greenPct}%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
          <span>Moderate ({legendStats.yellowPct}%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span>Slow ({legendStats.orangePct}%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
          <span>Heavy ({legendStats.redPct}%)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-black inline-block border border-slate-600" />
          <span>Closed ({legendStats.closedPct}%)</span>
        </div>
      </div>

      {/* 6. BOTTOM TIMELINE SCRUBBING CONTROL BAR */}
      {showTimelineBar && (
        <div className="absolute bottom-2 left-2 right-2 z-10 bg-slate-900/95 text-slate-100 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700 shadow-xl flex items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1 transition-colors"
              title={isPlayingTimeline ? "Pause Simulation" : "Play Time Simulation"}
            >
              {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => { setTimelineHour(8.5); setIsPlayingTimeline(false); }}
              title="Reset Timeline to Live"
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="font-mono text-[11px] font-bold text-blue-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {formatTimeStr(timelineHour)}
            </div>
          </div>

          {/* Timeline Scrubbing Slider */}
          <div className="flex-1 flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-mono">06:00 AM</span>
            <input
              type="range"
              min="6.0"
              max="22.0"
              step="0.25"
              value={timelineHour}
              onChange={(e) => setTimelineHour(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-[10px] text-slate-400 font-mono">10:00 PM</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
            {(timelineHour >= 8 && timelineHour <= 9.5) || (timelineHour >= 17.5 && timelineHour <= 19.5) ? (
              <span className="text-amber-400 font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                ⚡ Peak Commute Surge
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                Optimal Flow Transit
              </span>
            )}
          </div>

          <button
            onClick={() => setShowTimelineBar(false)}
            title="Dismiss Time Simulation Bar"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs font-bold shrink-0 transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 7. TRANSIT STATION POPUP MODAL */}
      {selectedStation && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-900 text-slate-100 p-3.5 rounded-md border border-slate-700 shadow-2xl w-72 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-bold">
            <span className="flex items-center gap-1.5 text-purple-400">
              {selectedStation.type === 'Metro' ? <Train className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
              {selectedStation.name}
            </span>
            <button onClick={() => setSelectedStation(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Line:</span>
              <strong className="text-slate-200">{selectedStation.line}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ridership:</span>
              <strong className="text-emerald-400">{selectedStation.passengersPerHour.toLocaleString()} passengers/hr</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Next Arrival:</span>
              <strong className="text-blue-400 font-mono">In {selectedStation.nextArrivalMin} mins</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="px-1.5 py-0.2 bg-emerald-900/80 text-emerald-300 font-bold rounded text-[10px]">
                {selectedStation.status}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
