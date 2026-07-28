import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useCityStore, CITIES_CONFIG } from '../store/useCityStore';
import { useThemeStore } from '../store/useThemeStore';
import { Layers, Navigation, Eye, EyeOff } from 'lucide-react';

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

// Friendlier display labels for layer keys that don't look right under
// plain CSS `capitalize` (e.g. "aqi" -> "Aqi" instead of "AQI").
const LAYER_LABELS: Record<string, string> = {
  traffic: 'Traffic',
  aqi: 'AQI',
  flood: 'Flood',
  incidents: 'Incidents',
  transit: 'Transit',
  weather: 'Weather',
  sensors: 'Sensors',
};

export const InteractiveMap: React.FC = () => {
  const { 
    selectedCity, 
    mapLayers, 
    toggleMapLayer, 
    dashboardData, 
    setSelectedIncident,
    searchQuery
  } = useCityStore();
  const theme = useThemeStore((s) => s.theme);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Safe fallback to Taipei cityConfig to prevent undefined errors
  const cityConfig = CITIES_CONFIG?.[selectedCity] || CITIES_CONFIG?.taipei || {
    lat: 25.05306,
    lng: 121.52639,
    zoom: 12,
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const centerLat = cityConfig.lat ?? 25.05306;
    const centerLng = cityConfig.lng ?? 121.52639;
    const zoomLevel = cityConfig.zoom ?? 12;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoomLevel,
        zoomControl: false,
      });

      tileLayerRef.current = L.tileLayer(theme === 'dark' ? TILE_URLS.dark : TILE_URLS.light, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add custom zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = L.layerGroup().addTo(map);
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], zoomLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, cityConfig]);

  // Swap the basemap tiles when the app theme changes, instead of rebuilding the map.
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(theme === 'dark' ? TILE_URLS.dark : TILE_URLS.light);
  }, [theme]);

  // Handle Layer updates when mapLayers or dashboardData changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup || !dashboardData) return;

    layersGroup.clearLayers();

    const centerLat = cityConfig.lat ?? 25.05306;
    const centerLng = cityConfig.lng ?? 121.52639;

    // 1. Render Traffic Polylines & Flow Indicators
    if (mapLayers.traffic) {
      const trafficCorridors = [
        {
          points: [
            [centerLat + 0.02, centerLng - 0.05],
            [centerLat + 0.01, centerLng - 0.01],
            [centerLat - 0.01, centerLng + 0.03],
          ] as [number, number][],
          color: (dashboardData.traffic?.congestionIndex ?? 0) > 60 ? '#DC2626' : '#D97706',
          weight: 6,
          opacity: 0.8,
          label: 'Primary Expressway Corridor (High Flow)',
        },
        {
          points: [
            [centerLat - 0.03, centerLng - 0.02],
            [centerLat, centerLng],
            [centerLat + 0.03, centerLng + 0.02],
          ] as [number, number][],
          color: '#16A34A',
          weight: 5,
          opacity: 0.7,
          label: 'Arterial Bypass (Fluid Flow)',
        },
        {
          points: [
            [centerLat + 0.04, centerLng - 0.01],
            [centerLat + 0.02, centerLng + 0.04],
          ] as [number, number][],
          color: '#2563EB',
          weight: 5,
          opacity: 0.7,
          label: 'Northern Commuter Link',
        },
      ];

      trafficCorridors.forEach((corridor) => {
        const line = L.polyline(corridor.points, {
          color: corridor.color,
          weight: corridor.weight,
          opacity: corridor.opacity,
          lineCap: 'round',
        });
        line.bindTooltip(corridor.label, { sticky: true, className: 'cv-leaflet-tooltip' });
        layersGroup.addLayer(line);
      });
    }

    // 2. Render AQI Heat Circles
    if (mapLayers.aqi && dashboardData.environment) {
      const aqi = dashboardData.environment.aqi ?? 26;
      const aqiColor = aqi > 100 ? '#DC2626' : aqi > 50 ? '#D97706' : '#16A34A';

      const aqiZone = L.circle([centerLat, centerLng], {
        color: aqiColor,
        fillColor: aqiColor,
        fillOpacity: 0.15,
        radius: 3500,
        weight: 1.5,
        dashArray: '4, 4',
      });
      aqiZone.bindTooltip(`Urban AQI Radius: ${aqi} (${dashboardData.environment.aqiStatus || 'Good'})`, { sticky: true, className: 'cv-leaflet-tooltip' });
      layersGroup.addLayer(aqiZone);
    }

    // 3. Render Incidents Markers (with Safeguards)
    if (mapLayers.incidents && dashboardData.incidents) {
      dashboardData.incidents.forEach((inc) => {
        if (inc.status === 'resolved') return;

        // Ensure incident coordinates exist and contain valid numbers
        const coords = inc.coordinates || (inc as any).location;
        if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return;

        // Filter if search query exists
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = 
            (inc.title && inc.title.toLowerCase().includes(q)) || 
            (inc.locationName && inc.locationName.toLowerCase().includes(q)) || 
            (inc.type && inc.type.toLowerCase().includes(q));
          if (!match) return;
        }

        const isCritical = inc.severity === 'critical';
        const color = isCritical ? '#DC2626' : inc.severity === 'major' ? '#D97706' : '#0284C7';

        const customIcon = L.divIcon({
          className: 'custom-incident-marker',
          html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">!</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([coords[0], coords[1]], { icon: customIcon });

        // Colors here are set via the cv-leaflet-popup class in index.css
        // (which responds to the .dark theme class) rather than inline,
        // so the popup no longer shows dark text on a dark background.
        const popupContent = `
          <div class="cv-leaflet-popup">
            <div class="cv-leaflet-popup-kicker" style="color: ${color};">
              ${inc.severity} ${(inc.type || '').replace('_', ' ')}
            </div>
            <div class="cv-leaflet-popup-title">
              ${inc.title || 'Incident Alert'}
            </div>
            <div class="cv-leaflet-popup-subtle">
              ${inc.locationName || 'Taipei Sector'}
            </div>
            <div class="cv-leaflet-popup-desc">
              ${inc.description || ''}
            </div>
            <div class="cv-leaflet-popup-eta">
              Est. Resolution: ${inc.estimatedResolution || 'Active'}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { className: 'cv-leaflet-popup-wrapper' });
        marker.on('click', () => {
          setSelectedIncident(inc);
        });

        layersGroup.addLayer(marker);
      });
    }

    // 4. Render Environmental Sensors (with Safeguards)
    if (mapLayers.sensors && dashboardData.sensors) {
      dashboardData.sensors.forEach((sensor) => {
        // Ensure sensor coordinates exist and contain valid numbers
        const coords = sensor.coordinates || ((sensor as any).lat && (sensor as any).lng ? [(sensor as any).lat, (sensor as any).lng] : null);
        if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return;

        const sColor = sensor.status === 'critical' ? '#DC2626' : sensor.status === 'warning' ? '#D97706' : '#16A34A';

        const sensorIcon = L.divIcon({
          className: 'custom-sensor-marker',
          html: `<div style="background-color: ${sColor}; width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([coords[0], coords[1]], { icon: sensorIcon });
        marker.bindTooltip(
          `<b>${sensor.name}</b><br/>Reading: ${sensor.value ?? ''} ${sensor.unit ?? ''} (${(sensor.status || 'NORMAL').toUpperCase()})<br/>District: ${sensor.district || 'Taipei'}`,
          { sticky: true, className: 'cv-leaflet-tooltip' }
        );
        layersGroup.addLayer(marker);
      });
    }

  }, [selectedCity, mapLayers, dashboardData, searchQuery, setSelectedIncident, cityConfig]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cityConfig.lat ?? 25.05306, cityConfig.lng ?? 121.52639], cityConfig.zoom ?? 12);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-slate-800 flex flex-col rounded-md overflow-hidden border border-gray-200 dark:border-slate-700">
      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Control Bar Overlay (Top Left) */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2 rounded-md border border-gray-200 dark:border-slate-700 shadow-md text-xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-slate-700 font-semibold text-gray-800 dark:text-slate-100 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Map Intelligence Layers
          </span>
          <button
            onClick={resetView}
            title="Recenter City Map"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 text-[10px]"
          >
            <Navigation className="w-3 h-3" /> Recenter
          </button>
        </div>

        {/* Toggle Tills */}
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(mapLayers) as Array<keyof typeof mapLayers>).map((layerKey) => {
            const isEnabled = mapLayers[layerKey];
            return (
              <button
                key={layerKey}
                onClick={() => toggleMapLayer(layerKey)}
                className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                  isEnabled
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 font-semibold'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{LAYER_LABELS[layerKey] ?? layerKey}</span>
                {isEnabled ? <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1" /> : <EyeOff className="w-3 h-3 text-gray-400 dark:text-slate-500 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-2 rounded-md border border-gray-200 dark:border-slate-700 shadow-sm text-[10px] space-y-1">
        <div className="font-semibold text-gray-700 dark:text-slate-200 text-[10px]">Map Legend</div>
        <div className="flex items-center space-x-3 text-gray-600 dark:text-slate-300">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span>Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 dark:bg-red-400" />
            <span>Critical Incident</span>
          </div>
        </div>
      </div>
    </div>
  );
};