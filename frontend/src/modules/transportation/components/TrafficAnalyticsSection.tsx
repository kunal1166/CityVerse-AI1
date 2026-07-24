import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Bar, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Clock } from 'lucide-react';
import { HourlyTrendPoint } from '../../../types';

interface TrafficAnalyticsSectionProps {
  hourlyTrends?: HourlyTrendPoint[];
}

export const TrafficAnalyticsSection: React.FC<TrafficAnalyticsSectionProps> = ({ hourlyTrends = [] }) => {
  const [activeTab, setActiveTab] = useState<'volume' | 'speed' | 'vehicle_type' | 'prediction'>('volume');
  const [predictionRange, setPredictionRange] = useState<'15m' | '30m' | '1h' | 'tomorrow_morning' | 'tomorrow_evening'>('30m');

  // Vehicle fleet breakdown mock
  const vehicleDistributionData = [
    { name: 'Private Cars', value: 52, color: '#2563EB' },
    { name: 'Public Buses', value: 16, color: '#059669' },
    { name: 'Heavy Commercial', value: 14, color: '#D97706' },
    { name: 'EV Fleet', value: 10, color: '#0284C7' },
    { name: 'Motorcycles & Taxis', value: 8, color: '#7C3AED' },
  ];

  // Prediction forecasting mock data
  const predictionDataMap = {
    '15m': [
      { time: '14:00', actual: 64, predicted: 64 },
      { time: '14:05', actual: 66, predicted: 67 },
      { time: '14:10', actual: 68, predicted: 69 },
      { time: '14:15 (Next)', predicted: 72 },
    ],
    '30m': [
      { time: '13:30', actual: 58, predicted: 58 },
      { time: '14:00', actual: 68, predicted: 68 },
      { time: '14:15', predicted: 74 },
      { time: '14:30 (Peak)', predicted: 79 },
    ],
    '1h': [
      { time: '13:00', actual: 52, predicted: 52 },
      { time: '14:00', actual: 68, predicted: 68 },
      { time: '14:30', predicted: 78 },
      { time: '15:00', predicted: 70 },
    ],
    'tomorrow_morning': [
      { time: '06:00', predicted: 28 },
      { time: '07:00', predicted: 58 },
      { time: '08:00 (AM Peak)', predicted: 88 },
      { time: '09:00', predicted: 76 },
      { time: '10:00', predicted: 52 },
    ],
    'tomorrow_evening': [
      { time: '16:00', predicted: 48 },
      { time: '17:00', predicted: 72 },
      { time: '18:00 (PM Peak)', predicted: 92 },
      { time: '19:00', predicted: 82 },
      { time: '20:00', predicted: 54 },
    ],
  };

  const currentPredictionData = predictionDataMap[predictionRange];

  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3 shadow-2xs text-xs">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
        <div>
          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Arterial Traffic Analytics & AI Predictive Forecasting
          </div>
          <div className="text-[10px] text-gray-500">
            Real-time urban speed-occupancy telemetry and predictive flow models.
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded">
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
              activeTab === 'volume' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Volume & Flow
          </button>
          <button
            onClick={() => setActiveTab('speed')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
              activeTab === 'speed' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Speed vs Occupancy
          </button>
          <button
            onClick={() => setActiveTab('vehicle_type')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
              activeTab === 'vehicle_type' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fleet Distribution
          </button>
          <button
            onClick={() => setActiveTab('prediction')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
              activeTab === 'prediction' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Predictive Model
          </button>
        </div>
      </div>

      {/* TAB 1: VOLUME & HOURLY FLOW */}
      {activeTab === 'volume' && (
        <div className="space-y-2">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrends}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '6px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="vehicleVolume" name="Vehicle Volume (veh/h)" stroke="#2563EB" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: SPEED VS OCCUPANCY */}
      {activeTab === 'speed' && (
        <div className="space-y-2">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis yAxisId="left" stroke="#16A34A" fontSize={10} label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
                <YAxis yAxisId="right" orientation="right" stroke="#DC2626" fontSize={10} label={{ value: 'Congestion %', angle: 90, position: 'insideRight', style: { fontSize: 9 } }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '6px', fontSize: '11px' }} />
                <Bar yAxisId="right" dataKey="congestion" name="Congestion Index %" fill="#EF4444" opacity={0.6} />
                <Line yAxisId="left" type="monotone" dataKey="avgSpeed" name="Avg Speed (km/h)" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE FLEET DISTRIBUTION */}
      {activeTab === 'vehicle_type' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vehicleDistributionData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {vehicleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '6px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 font-medium text-[11px]">
            <div className="font-bold text-gray-900 text-xs pb-1 border-b border-gray-100">Optical Camera Vehicle Classification</div>
            {vehicleDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PREDICTIVE FORECASTING */}
      {activeTab === 'prediction' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-900 text-white p-2 rounded">
            <span className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
              <Clock className="w-3.5 h-3.5" /> Forecast Horizon Selector
            </span>
            <div className="flex items-center space-x-1">
              {(['15m', '30m', '1h', 'tomorrow_morning', 'tomorrow_evening'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setPredictionRange(range)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-colors ${
                    predictionRange === range ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {range.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentPredictionData}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} label={{ value: 'Predicted Congestion %', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '6px', fontSize: '11px' }} />
                {currentPredictionData[0].actual !== undefined && (
                  <Area type="monotone" dataKey="actual" name="Actual Baseline %" stroke="#16A34A" fill="none" strokeWidth={2} />
                )}
                <Area type="monotone" dataKey="predicted" name="AI Predicted Congestion %" stroke="#0284C7" fill="url(#colorPredicted)" strokeWidth={2.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
