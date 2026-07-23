import React from 'react';
import { Activity, Gauge, Navigation, Bus, CloudSun, Thermometer, Droplets, CloudRain, AlertCircle } from 'lucide-react';
import { useCityStore } from '../store/useCityStore';

export const MetricsBar: React.FC = () => {
  const { dashboardData } = useCityStore();

  if (!dashboardData) {
    return (
      <div className="h-12 bg-white border-b border-gray-200 animate-pulse flex items-center justify-around px-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  const { traffic, environment, incidents } = dashboardData;
  const activeIncidents = incidents.filter((i) => i.status === 'active');

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (aqi <= 100) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getFloodColor = (level: string) => {
    if (level === 'Low') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (level === 'Moderate') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs select-none shadow-2xs">
      {/* 1. Congestion Index */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
          <Gauge className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Traffic Congestion</div>
          <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
            {traffic.congestionIndex}%
            <span className={`text-[10px] font-normal ${traffic.peakHourComparison > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              ({traffic.peakHourComparison > 0 ? '+' : ''}{traffic.peakHourComparison}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Avg Speed */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Avg Speed</div>
          <div className="font-bold text-gray-900 text-sm">
            {traffic.avgSpeed} <span className="text-[10px] font-normal text-gray-500">km/h</span>
          </div>
        </div>
      </div>

      {/* 3. Public Transit On-Time */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
          <Bus className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Transit On-Time</div>
          <div className="font-bold text-gray-900 text-sm">{traffic.publicTransitOnTime}%</div>
        </div>
      </div>

      {/* 4. Active Incidents */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Active Incidents</div>
          <div className="font-bold text-red-700 text-sm">{activeIncidents.length} <span className="text-[10px] font-normal text-gray-500">critical</span></div>
        </div>
      </div>

      {/* 5. Air Quality Index */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
          <CloudSun className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Air Quality (AQI)</div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900 text-sm">{environment.aqi}</span>
            <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${getAqiColor(environment.aqi)}`}>
              {environment.aqiStatus.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Temperature & Humidity */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
          <Thermometer className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Temp & Humidity</div>
          <div className="font-bold text-gray-900 text-xs">
            {environment.temp}°C • {environment.humidity}%
          </div>
        </div>
      </div>

      {/* 7. Rainfall Rate */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
          <CloudRain className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Rainfall Rate</div>
          <div className="font-bold text-gray-900 text-xs">
            {environment.rainfallRate} <span className="text-[10px] font-normal text-gray-500">mm/h</span>
          </div>
        </div>
      </div>

      {/* 8. Flood Stage Risk */}
      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-200">
        <div className="w-7 h-7 rounded bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Flood Risk Stage</div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getFloodColor(environment.floodRiskLevel)}`}>
            {environment.floodRiskLevel}
          </span>
        </div>
      </div>
    </div>

  );
};
