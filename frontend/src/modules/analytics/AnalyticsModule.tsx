import React, { useState } from 'react';
import { useCityStore } from '../../store/useCityStore';
import { BarChart3, TrendingUp, Cpu, Calendar, Zap, RefreshCw, GitCommit } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export const AnalyticsModule: React.FC = () => {
  const { dashboardData } = useCityStore();
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d'>('24h');

  const hourlyTrends = dashboardData?.hourlyTrends || [];
  const prediction = dashboardData?.prediction;

  // Computed on the server with the same regression used by the prediction
  // model, so the rainfall/speed coefficient here always matches the widget below.
  const correlations = dashboardData?.correlations || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-[#F4F6F8] text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Urban Mobility & Cross-Domain Analytics Engine
          </h2>
          <p className="text-[11px] text-gray-500">
            Statistical correlation models, time-series predictive trends, and urban load forecasting.
          </p>
        </div>

        {/* Time-travel selector */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-md border border-gray-200">
          {(['24h', '7d', '30d'] as const).map((tw) => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              className={`px-2.5 py-1 rounded font-bold text-[10px] transition-colors ${
                timeWindow === tw ? 'bg-blue-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tw.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Combined Composed Chart: Vehicle Volume vs Congestion & Speed */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Urban Flow & Density Velocity Analysis
            </h3>
            <p className="text-[10px] text-gray-500">
              Correlating vehicle volume throughput with arterial speed degradation.
            </p>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Resolution: 3-Hour Interval</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="vehicleVolume" name="Vehicle Volume" fill="#3B82F6" opacity={0.6} barSize={24} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="congestion" name="Congestion Index %" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="avgSpeed" name="Avg Speed (km/h)" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cross-Domain Correlation Matrix Cards */}
      <div className="space-y-2">
        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
          <GitCommit className="w-4 h-4 text-blue-600" /> Cross-Domain Multivariate Correlation Matrix
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {correlations.map((c, i) => (
            <div key={i} className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs space-y-2 flex flex-col justify-between">
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

      {/* AI Predictive Forecasting Widget */}
      <div className="bg-white p-3.5 rounded-md border border-gray-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Rainfall-Based Traffic Projection
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            {prediction?.model || 'Model unavailable'}
          </span>
        </div>

        {!prediction?.available ? (
          <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-[11px] text-gray-600">
            {prediction?.reason || 'Waiting for live forecast data...'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {prediction.horizons.map((h) => (
                <div
                  key={h.hoursAhead}
                  className="bg-blue-50/60 p-2.5 rounded border border-blue-200 space-y-1"
                >
                  <div className="font-bold text-blue-900 text-xs flex items-center justify-between">
                    <span>Horizon: +{h.hoursAhead} Hour{h.hoursAhead > 1 ? 's' : ''}</span>
                    {h.extrapolated && (
                      <span
                        title="Forecast rainfall exceeds the observed range used to fit the model"
                        className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold"
                      >
                        EXTRAPOLATED
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-blue-800">
                    Forecast rainfall <span className="font-bold">{h.rainfall} mm/h</span>.
                    Projected average speed <span className="font-bold">{h.predictedSpeed} km/h</span>,
                    congestion <span className="font-bold">{h.predictedCongestion}%</span>.
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-500 pt-1">
              Projected by least-squares linear regression fitted on this city's observed
              rainfall and traffic telemetry, applied to the live Open-Meteo rainfall
              forecast. Not a machine-learning model.
            </p>
          </>
        )}
      </div>

    </div>
  );
};