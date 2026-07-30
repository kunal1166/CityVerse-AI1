import React from 'react';
import { InteractiveMap } from '../../components/InteractiveMap';
import { useCityStore } from '../../store/useCityStore';
import { CloudRain, CloudSun, Droplets, Wind, ShieldAlert, Activity } from 'lucide-react';

export const EnvironmentModule: React.FC = () => {
  const { dashboardData } = useCityStore();

  const env = dashboardData?.environment;
  const sensors = dashboardData?.sensors || [];

  // Safely extract wind direction string
  const windDir = env?.windDirectionCardinal || env?.windDirection || 'ENE';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#F4F6F8] dark:bg-slate-950 text-gray-900 dark:text-slate-100 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 p-3 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
            <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400 shrink-0" /> Environmental Intelligence & Disaster Mitigation Command
          </h2>
          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400">
            Real-time air quality index, storm drain water stages, flash flood prevention, and climate telemetrics.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold rounded text-[10px] sm:text-[11px]">
            Flood Risk Stage: {env?.floodRiskLevel || 'Low'}
          </span>
        </div>
      </div>

      {/* Top Grid: Air Quality Breakdown & Climate Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        
        {/* AQI Breakdown Card */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <CloudSun className="w-4 h-4 text-amber-500 shrink-0" /> Air Quality Index (AQI)
            </span>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold rounded text-[10px]">
              {env?.aqiStatus || 'Good'}
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100">{env?.aqi ?? 26}</span>
            <span className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-[11px]">US EPA Standard</span>
          </div>

          {/* Pollutant Breakdown Matrix */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
            <div className="bg-gray-50 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded border border-gray-200 dark:border-slate-700/60 text-center">
              <div className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">PM2.5</div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{env?.aqiBreakdown?.pm25 ?? 0}</div>
              <div className="text-[8px] text-gray-400 dark:text-slate-500">µg/m³</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded border border-gray-200 dark:border-slate-700/60 text-center">
              <div className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">PM10</div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{env?.aqiBreakdown?.pm10 ?? 0}</div>
              <div className="text-[8px] text-gray-400 dark:text-slate-500">µg/m³</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded border border-gray-200 dark:border-slate-700/60 text-center">
              <div className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">NO2</div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{env?.aqiBreakdown?.no2 ?? 0}</div>
              <div className="text-[8px] text-gray-400 dark:text-slate-500">ppb</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded border border-gray-200 dark:border-slate-700/60 text-center">
              <div className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">SO2</div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{env?.aqiBreakdown?.so2 ?? 0}</div>
              <div className="text-[8px] text-gray-400 dark:text-slate-500">ppb</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded border border-gray-200 dark:border-slate-700/60 text-center">
              <div className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">CO</div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{env?.aqiBreakdown?.co ?? 0}</div>
              <div className="text-[8px] text-gray-400 dark:text-slate-500">ppm</div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-1.5 sm:p-2 rounded border border-gray-200 dark:border-slate-700/60 text-center">
              <div className="text-[9px] text-gray-500 dark:text-slate-400 font-bold">O3</div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">{env?.aqiBreakdown?.o3 ?? 0}</div>
              <div className="text-[8px] text-gray-400 dark:text-slate-500">ppb</div>
            </div>
          </div>
        </div>

        {/* Flood Risk & Drainage Trough Stage */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Stormwater & Canal Stage
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">15 Sensors Active</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-gray-700 dark:text-slate-300 text-xs">
              <span>Current Rainfall Intensity:</span>
              <span className="font-bold text-blue-700 dark:text-blue-400">{env?.rainfallRate ?? 0} mm/h</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400">
                <span>Canal Capacity Threshold</span>
                <span className="font-bold text-gray-800 dark:text-slate-200">
                  {env?.canalCapacityThreshold || `${Math.min(100, Math.round(15 + (env?.rainfallRate || 0) * 3.5))}% Full`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (env?.rainfallRate || 0) > 20 ? 'bg-red-600 dark:bg-red-500' : 'bg-blue-600 dark:bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(95, Math.max(15, (env?.rainfallRate || 0) * 3.5 + 15))}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50/80 dark:bg-blue-500/10 p-2.5 rounded border border-blue-200 dark:border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> Flood Mitigation Directive
              </div>
              <p className="text-[10px] leading-relaxed">
                Automated pumps in low-lying underpasses set to auto-engage if rain rate exceeds 20 mm/h.
              </p>
            </div>
          </div>
        </div>

        {/* Weather Radar & Wind Vectors */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" /> Microclimate & Wind Velocity
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">Live Doppler</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-slate-400">Ambient Temperature:</span>
              <span className="font-bold text-gray-900 dark:text-slate-100">{env?.temp ?? 33.2}°C</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-slate-400">Relative Humidity:</span>
              <span className="font-bold text-gray-900 dark:text-slate-100">{env?.humidity ?? 56}%</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-slate-400">Wind Velocity & Direction:</span>
              <span className="font-bold text-gray-900 dark:text-slate-100">
                {env?.windSpeed ?? 17.7} km/h ({windDir})
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-2 rounded border border-gray-200 dark:border-slate-700/60 text-[10px] text-gray-600 dark:text-slate-300">
              <span className="font-semibold text-gray-800 dark:text-slate-100">Forecast:</span> {env?.condition || 'Scattered thunderstorms anticipated over next 3 hours.'}
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Environmental Map + Sensor Network Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Interactive Map */}
        <div className="lg:col-span-1 h-[300px] sm:h-[380px] bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <InteractiveMap />
        </div>

        {/* Environmental Sensors Array Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 p-3 space-y-2 shadow-2xs flex flex-col min-w-0">
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" /> Municipal Environmental Sensor Array Grid
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">100% Online</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/60 text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase border-b border-gray-200 dark:border-slate-700">
                  <th className="p-2">Sensor ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">District</th>
                  <th className="p-2">Reading</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-[11px]">
                {sensors.map((s: any) => (
                  <tr key={s.id} className="hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 transition-colors">
                    <td className="p-2 font-mono text-[10px] font-semibold text-gray-500 dark:text-slate-400">{s.id}</td>
                    <td className="p-2 font-bold text-gray-900 dark:text-slate-100">{s.name}</td>
                    <td className="p-2 uppercase text-[10px] font-semibold text-gray-500 dark:text-slate-400">{s.type}</td>
                    <td className="p-2 text-gray-700 dark:text-slate-300">{s.district}</td>
                    <td className="p-2 font-bold text-gray-900 dark:text-slate-100">
                      {s.reading || `${s.value ?? ''} ${s.unit ?? ''}`.trim()}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          s.status?.toLowerCase() === 'critical' || s.status?.toLowerCase() === 'warning'
                            ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                            : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono text-[10px] text-gray-400 dark:text-slate-500">
                      {s.lastSync || s.lastUpdated || 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};