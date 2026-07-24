import React from 'react';
import { InteractiveMap } from '../../components/InteractiveMap';
import { useCityStore } from '../../store/useCityStore';
import { CloudRain, CloudSun, Thermometer, Droplets, Wind, AlertCircle, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';

export const EnvironmentModule: React.FC = () => {
  const { dashboardData } = useCityStore();

  const env = dashboardData?.environment;
  const sensors = dashboardData?.sensors || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-[#F4F6F8] text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-cyan-600" /> Environmental Intelligence & Disaster Mitigation Command
          </h2>
          <p className="text-[11px] text-gray-500">
            Real-time air quality index, storm drain water stages, flash flood prevention, and climate telemetrics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold rounded text-[11px]">
            Flood Risk Stage: {env?.floodRiskLevel}
          </span>
        </div>
      </div>

      {/* Top Grid: Air Quality Breakdown & Climate Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* AQI Breakdown Card */}
        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <CloudSun className="w-4 h-4 text-amber-500" /> Air Quality Index (AQI)
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
              {env?.aqiStatus}
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-gray-900">{env?.aqi}</span>
            <span className="text-gray-500 text-[11px]">US EPA Standard</span>
          </div>

          {/* Pollutant Breakdown Matrix */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
              <div className="text-[9px] text-gray-500 font-bold">PM2.5</div>
              <div className="font-bold text-gray-900 text-xs">{env?.aqiBreakdown.pm25}</div>
              <div className="text-[8px] text-gray-400">µg/m³</div>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
              <div className="text-[9px] text-gray-500 font-bold">PM10</div>
              <div className="font-bold text-gray-900 text-xs">{env?.aqiBreakdown.pm10}</div>
              <div className="text-[8px] text-gray-400">µg/m³</div>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
              <div className="text-[9px] text-gray-500 font-bold">NO2</div>
              <div className="font-bold text-gray-900 text-xs">{env?.aqiBreakdown.no2}</div>
              <div className="text-[8px] text-gray-400">ppb</div>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
              <div className="text-[9px] text-gray-500 font-bold">SO2</div>
              <div className="font-bold text-gray-900 text-xs">{env?.aqiBreakdown.so2}</div>
              <div className="text-[8px] text-gray-400">ppb</div>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
              <div className="text-[9px] text-gray-500 font-bold">CO</div>
              <div className="font-bold text-gray-900 text-xs">{env?.aqiBreakdown.co}</div>
              <div className="text-[8px] text-gray-400">ppm</div>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
              <div className="text-[9px] text-gray-500 font-bold">O3</div>
              <div className="font-bold text-gray-900 text-xs">{env?.aqiBreakdown.o3}</div>
              <div className="text-[8px] text-gray-400">ppb</div>
            </div>
          </div>
        </div>

        {/* Flood Risk & Drainage Trough Stage */}
        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" /> Stormwater & Canal Stage Monitor
            </span>
            <span className="text-[10px] text-gray-400 font-mono">15 Sensors Active</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-gray-700 text-xs">
              <span>Current Rainfall Intensity:</span>
              <span className="font-bold text-blue-700">{env?.rainfallRate} mm/h</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Canal Capacity Threshold</span>
                <span className="font-bold text-gray-800">76% Full</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    (env?.rainfallRate || 0) > 20 ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(95, (env?.rainfallRate || 0) * 3 + 40)}%` }}
                />
              </div>
            </div>

            <div className="bg-blue-50/80 p-2.5 rounded border border-blue-200 text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" /> Flood Mitigation Directive
              </div>
              <p className="text-[10px] leading-relaxed">
                Automated pumps in low-lying underpasses set to auto-engage if rain rate exceeds 20 mm/h.
              </p>
            </div>
          </div>
        </div>

        {/* Weather Radar & Wind Vectors */}
        <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-600" /> Microclimate & Wind Velocity
            </span>
            <span className="text-[10px] text-gray-400">Live Doppler</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Ambient Temperature:</span>
              <span className="font-bold text-gray-900">{env?.temp}°C</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Relative Humidity:</span>
              <span className="font-bold text-gray-900">{env?.humidity}%</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Wind Velocity & Direction:</span>
              <span className="font-bold text-gray-900">{env?.windSpeed} km/h ({env?.windDirection})</span>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] text-gray-600">
              <span className="font-semibold text-gray-800">Forecast:</span> Scattered thunderstorms anticipated over next 3 hours.
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Environmental Map + Sensor Network Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Interactive Map */}
        <div className="lg:col-span-1 h-[380px] bg-white rounded-md border border-gray-200 overflow-hidden shadow-2xs">
          <InteractiveMap />
        </div>

        {/* Environmental Sensors Array Table */}
        <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 p-3 space-y-2 shadow-2xs flex flex-col">
          <div className="font-bold text-gray-900 text-xs flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600" /> Municipal Environmental Sensor Array Grid
            </span>
            <span className="text-[10px] text-gray-400 font-mono">100% Online</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="p-2">Sensor ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">District</th>
                  <th className="p-2">Reading</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 text-right">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px]">
                {sensors.map((s) => (
                  <tr key={s.id} className="hover:bg-cyan-50/50 transition-colors">
                    <td className="p-2 font-mono text-[10px] font-semibold text-gray-500">{s.id}</td>
                    <td className="p-2 font-bold text-gray-900">{s.name}</td>
                    <td className="p-2 uppercase text-[10px] font-semibold text-gray-500">{s.type}</td>
                    <td className="p-2 text-gray-700">{s.district}</td>
                    <td className="p-2 font-bold text-gray-900">{s.value} {s.unit}</td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          s.status === 'critical'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : s.status === 'warning'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono text-[10px] text-gray-400">{s.lastUpdated}</td>
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
