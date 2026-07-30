import React from 'react';
import { Activity, Gauge, Navigation, Bus, CloudSun, Thermometer, Droplets, CloudRain, AlertCircle } from 'lucide-react';
import { useCityStore } from '../store/useCityStore';

export const MetricsBar: React.FC = () => {
  const { dashboardData } = useCityStore();

  if (!dashboardData) {
    return (
      <div className="h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 animate-pulse flex items-center justify-around px-4">
        <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-slate-800 rounded hidden sm:block" />
        <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-slate-800 rounded hidden md:block" />
      </div>
    );
  }

  const { traffic, environment, incidents } = dashboardData;
  const activeIncidents = incidents.filter((i) => i.status === 'active');

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
    if (aqi <= 100) return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
    return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30';
  };

  const getFloodColor = (level: string) => {
    if (level === 'Low') return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
    if (level === 'Moderate') return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
    return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-3 sm:px-4 py-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-2 text-xs select-none shadow-2xs overflow-x-auto">
      {/* 1. Congestion Index */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
          <Gauge className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Traffic Congestion</div>
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1">
            {traffic.congestionIndex}%
            <span className={`text-[10px] font-normal shrink-0 ${traffic.peakHourComparison > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ({traffic.peakHourComparison > 0 ? '+' : ''}{traffic.peakHourComparison}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Avg Speed */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
          <Navigation className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Avg Speed</div>
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm truncate">
            {traffic.avgSpeed} <span className="text-[10px] font-normal text-gray-500 dark:text-slate-400">km/h</span>
          </div>
        </div>
      </div>

      {/* 3. Public Transit On-Time */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
          <Bus className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Transit On-Time</div>
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm">{traffic.publicTransitOnTime}%</div>
        </div>
      </div>

      {/* 4. Active Incidents */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 flex items-center justify-center font-bold shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Active Incidents</div>
          <div className="font-bold text-red-700 dark:text-red-400 text-xs sm:text-sm truncate">
            {activeIncidents.length} <span className="text-[10px] font-normal text-gray-500 dark:text-slate-400">critical</span>
          </div>
        </div>
      </div>

      {/* 5. Air Quality Index */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
          <CloudSun className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Air Quality (AQI)</div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm">{environment.aqi}</span>
            <span className={`px-1 py-0.2 rounded text-[9px] font-bold border truncate ${getAqiColor(environment.aqi)}`}>
              {environment.aqiStatus.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Temperature & Humidity */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
          <Thermometer className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Temp & Humidity</div>
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs truncate">
            {environment.temp}°C • {environment.humidity}%
          </div>
        </div>
      </div>

      {/* 7. Rainfall Rate */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
          <CloudRain className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Rainfall Rate</div>
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs truncate">
            {environment.rainfallRate} <span className="text-[10px] font-normal text-gray-500 dark:text-slate-400">mm/h</span>
          </div>
        </div>
      </div>

      {/* 8. Flood Stage Risk */}
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-md border border-gray-200 dark:border-slate-700/60 min-w-[130px]">
        <div className="w-7 h-7 rounded bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">Flood Risk Stage</div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-block truncate ${getFloodColor(environment.floodRiskLevel)}`}>
            {environment.floodRiskLevel}
          </span>
        </div>
      </div>
    </div>

  );
};
