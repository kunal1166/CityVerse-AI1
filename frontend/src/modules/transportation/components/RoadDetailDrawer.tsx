import React, { useState, useMemo } from 'react';
import { RoadSegment, TrafficCamera, SignalController } from '../transportationTypes';
import { RoadIncident, EnvironmentalSensor } from '../../../types';
import { MapObjectType } from './TransportationMap';
import { X, Navigation, ShieldAlert, Cpu, Camera, Radio, CheckCircle2, AlertOctagon, Sliders, ArrowRight, Share2, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface RoadDetailDrawerProps {
  selectedObject: {
    type: MapObjectType;
    data: any;
  } | null;
  onClose: () => void;
  onResolveIncident?: (id: string) => void;
}

const CustomSparklineTooltip = ({ active, payload, label, unit = '%', title = 'Congestion' }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-slate-900/95 text-white text-[10px] px-2.5 py-1.5 rounded shadow-xl border border-slate-700 font-mono z-50">
        <div className="text-slate-400 text-[9px] mb-0.5">{label}</div>
        <div className="font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          <span>{title}:</span>
          <span className="text-blue-300 font-bold">{val}{unit}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RoadDetailDrawer: React.FC<RoadDetailDrawerProps> = ({
  selectedObject,
  onClose,
  onResolveIncident,
}) => {
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const { type, data } = selectedObject || {};

  // Memoized Sparkline Data Generators
  const roadTrendData = useMemo(() => {
    if (type !== 'road' || !data) return [];
    const road = data as RoadSegment;
    const seed = road.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const times = ['08:00', '08:10', '08:20', '08:30', '08:40', '08:50', '09:00', '09:10'];
    return times.map((time, i) => {
      const wave = Math.sin((seed + i * 1.3) * 0.8) * 14;
      const congestion = Math.max(10, Math.min(98, Math.round(road.congestionIndex + wave)));
      const speed = Math.max(10, Math.min(road.speedLimit, Math.round(road.currentSpeed - wave * 0.4)));
      return { time, congestion, speed };
    });
  }, [type, data]);

  const incidentTrendData = useMemo(() => {
    if (type !== 'incident' || !data) return [];
    const inc = data as RoadIncident;
    const peak = inc.severity === 'critical' ? 92 : inc.severity === 'major' ? 76 : 60;
    return [
      { time: '-30m', congestion: 28, isForecast: false },
      { time: '-20m', congestion: 46, isForecast: false },
      { time: '-10m', congestion: Math.round(peak * 0.88), isForecast: false },
      { time: 'NOW', congestion: peak, isForecast: false },
      { time: '+10m', congestion: Math.round(peak * 0.72), isForecast: true },
      { time: '+20m', congestion: Math.round(peak * 0.45), isForecast: true },
      { time: '+30m', congestion: 30, isForecast: true },
    ];
  }, [type, data]);

  const cameraTrendData = useMemo(() => {
    if (type !== 'camera' || !data) return [];
    const cam = data as TrafficCamera;
    const seed = cam.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const times = ['-25m', '-20m', '-15m', '-10m', '-5m', 'Now'];
    return times.map((time, i) => {
      const count = Math.max(5, Math.round(cam.aiVehicleCount + Math.sin(seed + i * 1.5) * 10));
      return { time, vehicleCount: count };
    });
  }, [type, data]);

  const sensorTrendData = useMemo(() => {
    if (type !== 'sensor' || !data) return [];
    const sensor = data as EnvironmentalSensor;
    const seed = sensor.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const times = ['-25m', '-20m', '-15m', '-10m', '-5m', 'Now'];
    return times.map((time, i) => {
      const value = Math.max(0, Number((sensor.value + Math.sin(seed + i) * (sensor.value * 0.1)).toFixed(1)));
      return { time, value };
    });
  }, [type, data]);

  if (!selectedObject || !type || !data) return null;

  const triggerAction = (actionText: string) => {
    setOverrideSuccess(actionText);
    setTimeout(() => setOverrideSuccess(null), 3000);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="fixed inset-y-0 right-0 top-14 sm:top-0 z-50 w-full sm:w-[450px] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col text-xs text-gray-900 dark:text-slate-100 max-h-[calc(100vh-56px)] sm:max-h-none"
    >
      {/* Drawer Header Bar */}
      <div className="px-3.5 sm:px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="p-1 bg-blue-600 rounded text-white font-bold shrink-0">
            {type === 'road' ? '🛣️' : type === 'incident' ? '⚠️' : type === 'camera' ? '📷' : type === 'signal' ? '🚥' : '📡'}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm leading-tight text-white truncate">
              {type === 'road' && (data as RoadSegment).name}
              {type === 'incident' && (data as RoadIncident).title}
              {type === 'camera' && (data as TrafficCamera).name}
              {type === 'sensor' && (data as EnvironmentalSensor).name}
              {type === 'signal' && (data as SignalController).junctionName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              GIS Asset Inspector • {type.toUpperCase()} ID: {data.id}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 sm:space-y-4">
        
        {/* Action Status Toast */}
        {overrideSuccess && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-md text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{overrideSuccess}</span>
          </div>
        )}

        {/* ROAD SEGMENT DETAILED TELEMETRY */}
        {type === 'road' && (
          <>
            {/* Speed & Flow Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded border border-gray-200 dark:border-slate-700/60">
                <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase">Current Speed</div>
                <div className="text-base font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                  {(data as RoadSegment).currentSpeed} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">km/h</span>
                </div>
                <div className="text-[9px] text-gray-500 dark:text-slate-400 mt-0.5">Speed Limit: {(data as RoadSegment).speedLimit} km/h</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded border border-gray-200 dark:border-slate-700/60">
                <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase">Congestion Index</div>
                <div className={`text-base font-bold mt-0.5 ${(data as RoadSegment).congestionIndex > 70 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {(data as RoadSegment).congestionIndex}%
                </div>
                <div className="text-[9px] font-semibold text-gray-600 dark:text-slate-300 mt-0.5">{(data as RoadSegment).density} Flow</div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded border border-gray-200 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase">Vehicle Volume</div>
                <div className="text-base font-bold text-gray-900 dark:text-slate-100 mt-0.5">
                  {(data as RoadSegment).vehicleCount.toLocaleString()} <span className="text-[10px] font-normal text-gray-500 dark:text-slate-400">veh/h</span>
                </div>
                <div className="text-[9px] text-gray-500 dark:text-slate-400 mt-0.5">Optical Sensor Sync</div>
              </div>
            </div>

            {/* Mini Sparkline Chart for Road Congestion Trend */}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-slate-700 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1.5">
                <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Real-Time Congestion Sparkline Trend</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                  Past 60 Mins
                </span>
              </div>

              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={roadTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="roadCongestionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={(data as RoadSegment).congestionIndex > 70 ? '#ef4444' : '#3b82f6'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={(data as RoadSegment).congestionIndex > 70 ? '#ef4444' : '#3b82f6'} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomSparklineTooltip unit="%" title="Congestion" />} />
                    <Area
                      type="monotone"
                      dataKey="congestion"
                      stroke={(data as RoadSegment).congestionIndex > 70 ? '#dc2626' : '#2563eb'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#roadCongestionGradient)"
                      dot={{ r: 2, fill: (data as RoadSegment).congestionIndex > 70 ? '#dc2626' : '#2563eb' }}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400 font-mono pt-1 border-t border-gray-100 dark:border-slate-700">
                <span>Peak: {Math.max(...roadTrendData.map(d => d.congestion))}%</span>
                <span>Avg Speed: {(data as RoadSegment).currentSpeed} km/h</span>
                <span>Min: {Math.min(...roadTrendData.map(d => d.congestion))}%</span>
              </div>
            </div>

            {/* Travel Time Comparison */}
            <div className="bg-blue-50/60 dark:bg-blue-500/10 p-3 rounded-md border border-blue-200 dark:border-blue-500/20 space-y-1.5">
              <div className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center justify-between">
                <span>Travel Time Analysis</span>
                <span className="text-blue-700 dark:text-blue-400 font-mono text-[10px]">District: {(data as RoadSegment).district}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 dark:text-slate-400">Current Travel Duration:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{(data as RoadSegment).travelTime} mins</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-600 dark:text-slate-400">Free-Flow Standard Duration:</span>
                <span className="font-semibold text-gray-700 dark:text-slate-200">{(data as RoadSegment).normalTravelTime} mins</span>
              </div>
            </div>

            {/* Recommended Alternative Route */}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-slate-700 space-y-2 shadow-2xs">
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Recommended AI Bypass Route
              </div>
              <div className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 font-medium">
                <span className="text-gray-900 dark:text-slate-100 font-semibold truncate">{(data as RoadSegment).alternativeRouteName}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] shrink-0 ml-1">
                  Save ~{Math.max(1, (data as RoadSegment).travelTime - (data as RoadSegment).alternativeRouteTime)} mins
                </span>
              </div>
            </div>

            {/* AI Cause Explanation */}
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-md space-y-1.5 shadow-2xs border border-slate-800">
              <div className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
                <Cpu className="w-4 h-4 shrink-0" /> AI Diagnostics & Forecast
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {(data as RoadSegment).aiExplanation}
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800 flex justify-between">
                <span>Estimated Flow Recovery: {(data as RoadSegment).estimatedRecovery}</span>
                <span className="text-emerald-400">Model Confidence: 94.8%</span>
              </div>
            </div>
          </>
        )}

        {/* INCIDENT DETAILED TELEMETRY */}
        {type === 'incident' && (
          <>
            <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-md border border-red-200 dark:border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-red-600 text-white">
                  {(data as RoadIncident).severity} {(data as RoadIncident).type.replace('_', ' ')}
                </span>
                <span className="text-red-700 dark:text-red-400 font-mono font-semibold text-[10px]">
                  Status: {(data as RoadIncident).status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-red-900 dark:text-red-200 font-semibold leading-snug">
                {(data as RoadIncident).description}
              </p>
            </div>

            {/* Mini Sparkline Chart for Incident Congestion Impact & AI Recovery Curve */}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-slate-700 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1.5">
                <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Incident Impact & AI Recovery Trajectory</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  AI Forecast
                </span>
              </div>

              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incidentTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomSparklineTooltip unit="%" title="Congestion Index" />} />
                    <ReferenceLine x="NOW" stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Now', fill: '#ef4444', fontSize: 9 }} />
                    <Area
                      type="monotone"
                      dataKey="congestion"
                      stroke="#dc2626"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#incidentGradient)"
                      dot={{ r: 2.5, fill: '#dc2626' }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-medium bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span> Historical Spike
                </span>
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> AI Projected Recovery
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-md border border-gray-200 dark:border-slate-700/60 space-y-2">
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs">Incident Telemetry Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px]">Location</div>
                  <div className="font-bold text-gray-900 dark:text-slate-100 mt-0.5">{(data as RoadIncident).locationName}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px]">Lanes Affected</div>
                  <div className="font-bold text-gray-900 dark:text-slate-100 mt-0.5">{(data as RoadIncident).affectedLanes} Lanes Blocked</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px]">Reported Timestamp</div>
                  <div className="font-mono text-gray-800 dark:text-slate-200 mt-0.5">{(data as RoadIncident).timestamp}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px]">Est. Resolution</div>
                  <div className="font-mono text-blue-700 dark:text-blue-400 font-bold mt-0.5">{(data as RoadIncident).estimatedResolution}</div>
                </div>
              </div>
            </div>

            {(data as RoadIncident).recommendedAction && (
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-md border border-blue-200 dark:border-blue-500/20 space-y-1">
                <div className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> AI Tactical Dispatch Protocol
                </div>
                <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
                  {(data as RoadIncident).recommendedAction}
                </p>
              </div>
            )}
          </>
        )}

        {/* CAMERA DETAILED TELEMETRY */}
        {type === 'camera' && (
          <>
            <div className="bg-slate-900 rounded-md border border-slate-800 overflow-hidden space-y-0 shadow-2xs">
              <div className="relative h-44 bg-slate-950 flex items-center justify-center">
                {/* Simulated Camera Live Feed Snapshot */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
                
                {/* Simulated Bounding Boxes Overlay */}
                <div className="absolute top-8 left-12 w-16 h-10 border-2 border-emerald-400 rounded-xs text-[8px] font-mono text-emerald-400 p-0.5 bg-emerald-500/10">
                  Sedan 98%
                </div>
                <div className="absolute top-16 right-16 w-20 h-12 border-2 border-blue-400 rounded-xs text-[8px] font-mono text-blue-400 p-0.5 bg-blue-500/10">
                  Bus 99%
                </div>

                <div className="relative z-10 text-center space-y-1">
                  <Camera className="w-8 h-8 text-blue-400 mx-auto animate-pulse" />
                  <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    ● LIVE OPTICAL FEED • 30 FPS
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] text-slate-400 font-mono z-10">
                  <span>{(data as TrafficCamera).name}</span>
                  <span>{(data as TrafficCamera).snapshotTime}</span>
                </div>
              </div>

              <div className="p-3 grid grid-cols-2 gap-2 text-slate-200">
                <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">AI Vehicles Logged</div>
                  <div className="text-base font-bold text-white mt-0.5">{(data as TrafficCamera).aiVehicleCount}</div>
                </div>
                <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">Detected Avg Speed</div>
                  <div className="text-base font-bold text-white mt-0.5">{(data as TrafficCamera).averageSpeedDetected} km/h</div>
                </div>
              </div>
            </div>

            {/* Mini Sparkline Chart for Optical Vehicle Count Detection */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-md border border-slate-800 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
                  <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>AI Vehicle Detection Sparkline</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  Optical AI Sync
                </span>
              </div>

              <div className="h-24 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cameraTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cameraGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip content={<CustomSparklineTooltip unit=" veh" title="Detected Count" />} />
                    <Area
                      type="monotone"
                      dataKey="vehicleCount"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#cameraGradient)"
                      dot={{ r: 2, fill: '#60a5fa' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ENVIRONMENTAL SENSOR TELEMETRY */}
        {type === 'sensor' && (
          <>
            {/* Mini Sparkline Chart for Environmental Sensor Readings */}
            <div className="bg-white dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-slate-700 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-1.5">
                <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Sensor Telemetry Sparkline ({(data as EnvironmentalSensor).unit})</span>
                </div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                  Live Gauge
                </span>
              </div>

              <div className="h-24 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensorTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sensorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomSparklineTooltip unit={` ${(data as EnvironmentalSensor).unit}`} title="Value" />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0284c7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#sensorGradient)"
                      dot={{ r: 2, fill: '#0284c7' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* SIGNAL CONTROLLER TELEMETRY */}
        {type === 'signal' && (
          <>
            <div className="bg-slate-900 text-white p-3 rounded-md space-y-2 border border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  🚥 Adaptive Junction Signal Controller
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded border border-emerald-500/30">
                  {(data as SignalController).mode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="bg-slate-800/70 p-2 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">Current Green Phase</div>
                  <div className="font-bold text-white mt-0.5">{(data as SignalController).currentPhase}</div>
                </div>
                <div className="bg-slate-800/70 p-2 rounded border border-slate-700">
                  <div className="text-[10px] text-slate-400">Green Cycle Split</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{(data as SignalController).greenDurationSec}s / {(data as SignalController).cycleLengthSec}s</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* OPERATOR COMMAND ACTIONS BOX */}
        <div className="bg-white dark:bg-slate-800/50 p-3 rounded-md border border-gray-200 dark:border-slate-700 space-y-2.5 shadow-2xs">
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-700 pb-1.5">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Operator Control Protocols
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => triggerAction('Signal timer overrode: +20 seconds green light phase applied.')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors text-left flex items-center justify-between"
            >
              <span>+20s Green Override</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              onClick={() => triggerAction('Patrol Dispatch Alert broadcasted to nearest traffic officer unit.')}
              className="px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded font-bold transition-colors text-left flex items-center justify-between border border-slate-800 dark:border-slate-700"
            >
              <span>Dispatch Traffic Unit</span>
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              onClick={() => triggerAction('VMS Message: "CONGESTION AHEAD - USE ALTERNATE ROUTE" deployed.')}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-colors text-left flex items-center justify-between"
            >
              <span>Update VMS Signs</span>
              <Radio className="w-3.5 h-3.5 shrink-0" />
            </button>

            {type === 'incident' && onResolveIncident && (data as RoadIncident).status !== 'resolved' ? (
              <button
                onClick={() => {
                  onResolveIncident((data as RoadIncident).id);
                  triggerAction('Incident marked as resolved in central database.');
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors text-left flex items-center justify-between"
              >
                <span>Resolve Incident</span>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => triggerAction('Briefing summary copied to clipboard.')}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded font-bold transition-colors text-left flex items-center justify-between border border-gray-200 dark:border-slate-700"
              >
                <span>Copy Summary Log</span>
                <Share2 className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400 shrink-0">
        <span className="truncate mr-2">Taipei City Traffic Bureau / National Command Standard</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold rounded transition-colors shrink-0"
        >
          Close Drawer
        </button>
      </div>
    </motion.div>
  );
};