import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useCityStore, CITIES_CONFIG } from '../store/useCityStore';
import { Layers, MapPin, AlertCircle, Eye, EyeOff, Navigation } from 'lucide-react';
import { RoadIncident } from '../types';

export const InteractiveMap: React.FC = () => {
  const { 
    selectedCity, 
    mapLayers, 
    toggleMapLayer, 
    dashboardData, 
    setSelectedIncident,
    searchQuery
  } = useCityStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const cityConfig = CITIES_CONFIG[selectedCity];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [cityConfig.lat, cityConfig.lng],
        zoom: cityConfig.zoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add custom zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = L.layerGroup().addTo(map);
    } else {
      mapInstanceRef.current.setView([cityConfig.lat, cityConfig.lng], cityConfig.zoom);
    }
  }, [selectedCity, cityConfig]);

  // Handle Layer updates when mapLayers or dashboardData changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup || !dashboardData) return;

    layersGroup.clearLayers();

    // 1. Render Traffic Polylines & Flow Indicators
    if (mapLayers.traffic) {
      const centerLat = cityConfig.lat;
      const centerLng = cityConfig.lng;

      // Simulated arterial traffic corridors with severity colors
      const trafficCorridors = [
        {
          points: [
            [centerLat + 0.02, centerLng - 0.05],
            [centerLat + 0.01, centerLng - 0.01],
            [centerLat - 0.01, centerLng + 0.03],
          ] as [number, number][],
          color: dashboardData.traffic.congestionIndex > 60 ? '#DC2626' : '#D97706', // Red or Amber
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
          color: '#16A34A', // Green
          weight: 5,
          opacity: 0.7,
          label: 'Arterial Bypass (Fluid Flow)',
        },
        {
          points: [
            [centerLat + 0.04, centerLng - 0.01],
            [centerLat + 0.02, centerLng + 0.04],
          ] as [number, number][],
          color: '#2563EB', // Blue / Normal
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
        line.bindTooltip(corridor.label, { sticky: true });
        layersGroup.addLayer(line);
      });
    }

    // 2. Render AQI Heat Circles
    if (mapLayers.aqi && dashboardData.environment) {
      const aqi = dashboardData.environment.aqi;
      const aqiColor = aqi > 100 ? '#DC2626' : aqi > 50 ? '#D97706' : '#16A34A';

      const aqiZone = L.circle([cityConfig.lat, cityConfig.lng], {
        color: aqiColor,
        fillColor: aqiColor,
        fillOpacity: 0.15,
        radius: 3500,
        weight: 1.5,
        dashArray: '4, 4',
      });
      aqiZone.bindTooltip(`Urban AQI Radius: ${aqi} (${dashboardData.environment.aqiStatus})`, { sticky: true });
      layersGroup.addLayer(aqiZone);
    }

    // 3. Render Incidents Markers
    if (mapLayers.incidents) {
      dashboardData.incidents.forEach((inc) => {
        if (inc.status === 'resolved') return;

        // Filter if query exists
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = inc.title.toLowerCase().includes(q) || inc.locationName.toLowerCase().includes(q) || inc.type.toLowerCase().includes(q);
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

        const marker = L.marker(inc.coordinates, { icon: customIcon });

        const popupContent = `
          <div style="font-family: Inter, sans-serif; padding: 4px; max-width: 220px;">
            <div style="font-size: 10px; font-weight: 700; color: ${color}; text-transform: uppercase;">
              ${inc.severity} ${inc.type.replace('_', ' ')}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #111827; margin-top: 2px;">
              ${inc.title}
            </div>
            <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
              ${inc.locationName}
            </div>
            <div style="font-size: 10px; color: #374151; margin-top: 6px; border-top: 1px solid #E5E7EB; padding-top: 4px;">
              ${inc.description}
            </div>
            <div style="margin-top: 8px; font-size: 10px; font-weight: 600; color: #2563EB;">
              Est. Resolution: ${inc.estimatedResolution}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedIncident(inc);
        });

        layersGroup.addLayer(marker);
      });
    }

    // 4. Render Environmental Sensors
    if (mapLayers.sensors && dashboardData.sensors) {
      dashboardData.sensors.forEach((sensor) => {
        const sColor = sensor.status === 'critical' ? '#DC2626' : sensor.status === 'warning' ? '#D97706' : '#16A34A';

        const sensorIcon = L.divIcon({
          className: 'custom-sensor-marker',
          html: `<div style="background-color: ${sColor}; width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker(sensor.coordinates, { icon: sensorIcon });
        marker.bindTooltip(
          `<b>${sensor.name}</b><br/>Reading: ${sensor.value} ${sensor.unit} (${sensor.status.toUpperCase()})<br/>District: ${sensor.district}`,
          { sticky: true }
        );
        layersGroup.addLayer(marker);
      });
    }

  }, [selectedCity, mapLayers, dashboardData, searchQuery, setSelectedIncident, cityConfig]);

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cityConfig.lat, cityConfig.lng], cityConfig.zoom);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100 flex flex-col rounded-md overflow-hidden border border-gray-200">
      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Control Bar Overlay (Top Left) */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-2 rounded-md border border-gray-200 shadow-md text-xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 font-semibold text-gray-800 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Map Intelligence Layers
          </span>
          <button
            onClick={resetView}
            title="Recenter City Map"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 text-[10px]"
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
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="capitalize">{layerKey}</span>
                {isEnabled ? <Eye className="w-3 h-3 text-blue-600 ml-1" /> : <EyeOff className="w-3 h-3 text-gray-400 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-2 rounded-md border border-gray-200 shadow-sm text-[10px] space-y-1">
        <div className="font-semibold text-gray-700 text-[10px]">Map Legend</div>
        <div className="flex items-center space-x-3 text-gray-600">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>Critical Incident</span>
          </div>
        </div>
      </div>
    </div>
  );
};
