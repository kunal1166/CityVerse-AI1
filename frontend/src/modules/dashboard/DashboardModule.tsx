import React, { useState } from 'react';
import { InteractiveMap } from '../../components/InteractiveMap';
import { AiIntelligencePanel } from '../../components/AiIntelligencePanel';
import { MetricsBar } from '../../components/MetricsBar';
import { useCityStore } from '../../store/useCityStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Bus, CloudRain, Clock, ArrowRight, Bot } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const { dashboardData, setActiveTab, resolveIncident } = useCityStore();
  const [isAiOpen, setIsAiOpen] = useState(false);

  const incidents = dashboardData?.incidents || [];
  const hourlyTrends = dashboardData?.hourlyTrends || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8] dark:bg-slate-950 text-gray-900 dark:text-slate-100 relative">
      {/* Metrics Bar */}
      <MetricsBar />

      {/* Main Workspace Scrollable Container */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-3 space-y-3 overflow-y-auto min-w-0">
        
        {/* Main Command Center Map Container */}
        <div className="h-[350px] sm:h-[420px] lg:h-[480px] w-full shrink-0 shadow-xs rounded-md overflow-hidden border border-gray-200 dark:border-slate-800 relative">
          <InteractiveMap />
        </div>

        {/* Bottom Grid: Operational Summaries & Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pb-16">
          
          {/* Card 1: Transportation Operational Summary */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md p-3 flex flex-col justify-between space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Transportation Summary
              </span>
              <button
                onClick={() => setActiveTab('transportation')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] font-semibold flex items-center gap-0.5"
              >
                View Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                <span>Arterial Speed Index:</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{dashboardData?.traffic.avgSpeed} km/h</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                <span>Commuter Bottlenecks:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{dashboardData?.traffic.bottleneckCount} critical</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                <span>Active Transit Vehicles:</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">
                  {dashboardData?.transit.reduce((acc, t) => acc + t.activeVehicles, 0)} units
                </span>
              </div>
            </div>

            {/* Incidents preview */}
            <div className="bg-gray-50 dark:bg-slate-800/60 p-2 rounded border border-gray-200 dark:border-slate-700 space-y-1">
              <div className="font-semibold text-gray-700 dark:text-slate-300 text-[10px] uppercase">Active Traffic Incident</div>
              {incidents[0] ? (
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 dark:text-slate-100 text-[11px] truncate">{incidents[0].title}</div>
                    <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{incidents[0].locationName}</div>
                  </div>
                  <button
                    onClick={() => resolveIncident(incidents[0].id)}
                    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-semibold shrink-0"
                  >
                    Resolve
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">All corridors clear.</div>
              )}
            </div>
          </div>

          {/* Card 2: Environment Operational Summary */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md p-3 flex flex-col justify-between space-y-2 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Environment & Flood Risk
              </span>
              <button
                onClick={() => setActiveTab('environment')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] font-semibold flex items-center gap-0.5"
              >
                View Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                <span>Air Quality Index (AQI):</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{dashboardData?.environment.aqi} ({dashboardData?.environment.aqiStatus})</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                <span>PM2.5 Concentration:</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{dashboardData?.environment.aqiBreakdown.pm25} µg/m³</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-slate-400 text-[11px]">
                <span>Drainage Flood Risk:</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">{dashboardData?.environment.floodRiskLevel} Stage</span>
              </div>
            </div>

            <div className="bg-blue-50/70 dark:bg-blue-500/10 p-2 rounded border border-blue-200 dark:border-blue-500/20 text-[10px] text-blue-900 dark:text-blue-300 space-y-0.5">
              <div className="font-semibold">Weather Radar Advice</div>
              <div>Precipitation rate at {dashboardData?.environment.rainfallRate} mm/h. Drainage box capacity monitored.</div>
            </div>
          </div>

          {/* Card 3: Hourly Congestion vs AQI Trend Chart */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md p-3 flex flex-col justify-between space-y-1 shadow-2xs md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
              <span className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-600 dark:text-slate-400" /> Hourly Operational Trend
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">24H Window</span>
            </div>

            <div className="h-28 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px', backgroundColor: '#1E293B', borderColor: '#475569', color: '#F8FAFC' }} />
                  <Area type="monotone" dataKey="congestion" name="Congestion %" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="aqi" name="AQI" stroke="#D97706" fill="#D97706" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center space-x-4 text-[10px] text-gray-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600" /> Traffic Congestion %</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Air Quality Index</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Circular AI Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsAiOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-slate-800 transition-transform active:scale-95 group"
        title="Open AI Command Advisor"
      >
        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white dark:border-slate-800"></span>
        </span>
      </button>

      {/* AI Intelligence Drawer Component (Only renders when isAiOpen is true) */}
      <AiIntelligencePanel isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};