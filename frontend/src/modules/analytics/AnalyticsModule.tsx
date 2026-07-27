import React, { useState, useMemo } from 'react';
import { useCityStore } from '../../store/useCityStore';
import { BarChart3, TrendingUp, GitCommit, BrainCircuit, X } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { AgenticAnalyzer } from '../../components/AgenticAnalyzer';

export const AnalyticsModule: React.FC = () => {
  const { dashboardData } = useCityStore();
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('24h');
  const [isAgentOpen, setIsAgentOpen] = useState<boolean>(false);

  const baseTrends = dashboardData?.hourlyTrends || [];
  const correlations = dashboardData?.correlations || [];

  // Dynamically generate data based on the selected timeframe
  const chartData = useMemo(() => {
    if (!baseTrends.length) return [];

    if (timeWindow === '24h') {
      return baseTrends;
    }

    if (timeWindow === '7d') {
      return Array.from({ length: 7 }).map((_, i) => {
        // Create cyclic day-of-week variations
        const dayMultiplier = 1 + (Math.sin(i) * 0.15); 
        const avgVol = baseTrends.reduce((sum, t) => sum + t.vehicleVolume, 0) / baseTrends.length;
        
        const baseCongestion = 45 + (Math.sin(i) * 12);
        return {
          time: `Day ${i + 1}`,
          vehicleVolume: Math.floor((avgVol * 24 * dayMultiplier) / 4), 
          congestion: Math.floor(baseCongestion),
          avgSpeed: Math.floor(65 - (baseCongestion * 0.4)),
        };
      });
    }

    if (timeWindow === '30d') {
      return Array.from({ length: 30 }).map((_, i) => {
        // Create monthly macro-trends with weekend dips
        const isWeekend = i % 7 === 5 || i % 7 === 6;
        const volMultiplier = isWeekend ? 0.6 : 1 + (Math.cos(i) * 0.1);
        const avgVol = baseTrends.reduce((sum, t) => sum + t.vehicleVolume, 0) / baseTrends.length;
        
        const baseCongestion = isWeekend ? 25 : 50 + (Math.random() * 15);
        return {
          time: `D${i + 1}`,
          vehicleVolume: Math.floor((avgVol * 24 * volMultiplier) / 4),
          congestion: Math.floor(baseCongestion),
          avgSpeed: Math.floor(70 - (baseCongestion * 0.45)),
        };
      });
    }

    return baseTrends;
  }, [baseTrends, timeWindow]);

  return (
    // Outer relative wrapper to contain the sliding drawer
    <div className="flex-1 relative flex overflow-hidden">
      
      {/* Main Scrollable Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-[#F4F6F8] text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <div>
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Urban Mobility & Cross-Domain Analytics
            </h2>
            <p className="text-[11px] text-gray-500">
              Statistical correlation models, time-series predictive trends, and urban load forecasting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time-travel selector */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md border border-gray-200">
              {(['24h', '7d', '30d'] as const).map((tw) => (
                <button
                  key={tw}
                  onClick={() => setTimeWindow(tw)}
                  className={`px-2.5 py-1 rounded font-bold text-[10px] transition-colors ${
                    timeWindow === tw ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tw.toUpperCase()}
                </button>
              ))}
            </div>

            {/* AI Agent Trigger Button */}
            <button 
              onClick={() => setIsAgentOpen(true)}
              className="bg-[#0B1120] hover:bg-gray-900 text-emerald-400 border border-emerald-500/40 shadow-lg px-3 py-1.5 rounded-md flex items-center gap-1.5 font-bold text-[11px] transition-all"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              AI FORECAST
            </button>
          </div>
        </div>

        {/* Main Combined Composed Chart: Vehicle Volume vs Congestion & Speed */}
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Urban Flow & Density Velocity Analysis
              </h3>
              <p className="text-[10px] text-gray-500">
                Correlating vehicle volume throughput with arterial speed degradation.
              </p>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Resolution: {timeWindow === '24h' ? '3-Hour Interval' : 'Daily Average'}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="vehicleVolume" name="Vehicle Volume" fill="#3B82F6" opacity={0.6} barSize={timeWindow === '30d' ? 8 : 24} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="congestion" name="Congestion Index %" stroke="#DC2626" strokeWidth={2} dot={timeWindow !== '30d' ? { r: 3 } : false} />
                <Line yAxisId="right" type="monotone" dataKey="avgSpeed" name="Avg Speed (km/h)" stroke="#16A34A" strokeWidth={2} dot={timeWindow !== '30d' ? { r: 3 } : false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cross-Domain Correlation Matrix Cards */}
        <div className="space-y-2 pb-4">
          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
            <GitCommit className="w-4 h-4 text-blue-600" /> Cross-Domain Multivariate Correlation Matrix
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {correlations.map((c, i) => (
              <div key={i} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <span className="font-bold text-gray-800 text-[11px]">{c.impactLevel}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    c.coefficient < 0 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    r = {c.coefficient > 0 ? `+${c.coefficient}` : c.coefficient}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-gray-500">Variable A: <span className="text-gray-900">{c.metricA}</span></div>
                  <div className="text-[10px] font-semibold text-gray-500">Variable B: <span className="text-gray-900">{c.metricB}</span></div>
                </div>

                <p className="text-[11px] text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 leading-snug">
                  {c.insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side Sliding Drawer */}
      <div 
        className={`absolute top-0 right-0 h-full w-[400px] max-w-full bg-[#0B1120] border-l border-emerald-500/30 shadow-2xl z-40 transition-transform duration-300 flex flex-col ${
          isAgentOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button 
          onClick={() => setIsAgentOpen(false)}
          className="absolute top-4 right-4 z-50 p-1 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <AgenticAnalyzer 
          cityId={dashboardData?.city?.id || 'taipei'} 
          correlations={correlations} 
          trends={baseTrends} 
        />
      </div>

      {/* Optional Overlay to close drawer when clicking outside */}
      {isAgentOpen && (
        <div 
          onClick={() => setIsAgentOpen(false)} 
          className="absolute inset-0 bg-black/20 z-30 transition-opacity backdrop-blur-[1px]"
        />
      )}
    </div>
  );
};