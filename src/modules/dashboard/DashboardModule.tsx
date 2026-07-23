import React from 'react';
import { InteractiveMap } from '../../components/InteractiveMap';
import { AiIntelligencePanel } from '../../components/AiIntelligencePanel';
import { MetricsBar } from '../../components/MetricsBar';
import { useCityStore } from '../../store/useCityStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Bus, CloudRain, AlertTriangle, Clock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const { dashboardData, setActiveTab, setSelectedIncident, resolveIncident } = useCityStore();

  const incidents = dashboardData?.incidents || [];
  const hourlyTrends = dashboardData?.hourlyTrends || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8]">
      {/* Metrics Bar */}
      <MetricsBar />

      {/* Main Workspace (Map + AI Panel) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* Left / Center Workspace: Map + Bottom Summary Cards */}
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
          
          {/* Main Command Center Map Container */}
          <div className="h-[380px] w-full shrink-0 shadow-xs">
            <InteractiveMap />
          </div>

          {/* Bottom Grid: Operational Summaries & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            
            {/* Card 1: Transportation Operational Summary */}
            <div className="bg-white border border-gray-200 rounded-md p-3 flex flex-col justify-between space-y-2 shadow-2xs">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-blue-600" /> Transportation Summary
                </span>
                <button
                  onClick={() => setActiveTab('transportation')}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold flex items-center gap-0.5"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-gray-600 text-[11px]">
                  <span>Arterial Speed Index:</span>
                  <span className="font-bold text-gray-900">{dashboardData?.traffic.avgSpeed} km/h</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 text-[11px]">
                  <span>Commuter Bottlenecks:</span>
                  <span className="font-bold text-amber-700">{dashboardData?.traffic.bottleneckCount} critical</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 text-[11px]">
                  <span>Active Transit Vehicles:</span>
                  <span className="font-bold text-gray-900">
                    {dashboardData?.transit.reduce((acc, t) => acc + t.activeVehicles, 0)} units
                  </span>
                </div>
              </div>

              {/* Incidents preview */}
              <div className="bg-gray-50 p-2 rounded border border-gray-200 space-y-1">
                <div className="font-semibold text-gray-700 text-[10px] uppercase">Active Traffic Incident</div>
                {incidents[0] ? (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-[11px] truncate max-w-[180px]">{incidents[0].title}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[180px]">{incidents[0].locationName}</div>
                    </div>
                    <button
                      onClick={() => resolveIncident(incidents[0].id)}
                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-semibold shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-700 font-medium">All corridors clear.</div>
                )}
              </div>
            </div>

            {/* Card 2: Environment Operational Summary */}
            <div className="bg-white border border-gray-200 rounded-md p-3 flex flex-col justify-between space-y-2 shadow-2xs">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-cyan-600" /> Environment & Flood Risk
                </span>
                <button
                  onClick={() => setActiveTab('environment')}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold flex items-center gap-0.5"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-gray-600 text-[11px]">
                  <span>Air Quality Index (AQI):</span>
                  <span className="font-bold text-gray-900">{dashboardData?.environment.aqi} ({dashboardData?.environment.aqiStatus})</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 text-[11px]">
                  <span>PM2.5 Concentration:</span>
                  <span className="font-bold text-gray-900">{dashboardData?.environment.aqiBreakdown.pm25} µg/m³</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 text-[11px]">
                  <span>Drainage Flood Risk:</span>
                  <span className="font-bold text-blue-700">{dashboardData?.environment.floodRiskLevel} Stage</span>
                </div>
              </div>

              <div className="bg-blue-50/70 p-2 rounded border border-blue-200 text-[10px] text-blue-900 space-y-0.5">
                <div className="font-semibold">Weather Radar Advice</div>
                <div>Precipitation rate at {dashboardData?.environment.rainfallRate} mm/h. Drainage box capacity monitored.</div>
              </div>
            </div>

            {/* Card 3: Hourly Congestion vs AQI Trend Chart */}
            <div className="bg-white border border-gray-200 rounded-md p-3 flex flex-col justify-between space-y-1 shadow-2xs">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-600" /> Hourly Operational Trend
                </span>
                <span className="text-[10px] text-gray-400 font-mono">24H Window</span>
              </div>

              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px' }} />
                    <Area type="monotone" dataKey="congestion" name="Congestion %" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="aqi" name="AQI" stroke="#D97706" fill="#D97706" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center space-x-4 text-[10px] text-gray-500 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600" /> Traffic Congestion %</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Air Quality Index</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel: AI Command Intelligence Panel */}
        <AiIntelligencePanel />
      </div>
    </div>
  );

};
