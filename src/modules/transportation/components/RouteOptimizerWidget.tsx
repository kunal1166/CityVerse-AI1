import React, { useState } from 'react';
import { Navigation, Clock, ShieldCheck, Zap, Bus, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RouteOptimizerWidgetProps {
  cityName: string;
}

export const RouteOptimizerWidget: React.FC<RouteOptimizerWidgetProps> = ({ cityName }) => {
  const [source, setSource] = useState('Changi Airport T3');
  const [destination, setDestination] = useState('Orchard Financial District');
  const [priority, setPriority] = useState<'fastest' | 'safest' | 'lowest_congestion' | 'transit'>('lowest_congestion');
  const [isCalculated, setIsCalculated] = useState(true);

  const handleCalculate = () => {
    setIsCalculated(false);
    setTimeout(() => setIsCalculated(true), 400);
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3 shadow-2xs text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-blue-600" /> AI Dynamic Route Optimizer
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Live Predictive Engine</span>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 font-semibold block mb-1">Origin / Source Point</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 font-semibold block mb-1">Destination Target</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Priority Selector Tabs */}
      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 font-semibold block">Routing Priority Objective</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => { setPriority('lowest_congestion'); handleCalculate(); }}
            className={`p-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition-colors ${
              priority === 'lowest_congestion'
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Zap className="w-3 h-3" /> Min Congestion
          </button>

          <button
            onClick={() => { setPriority('fastest'); handleCalculate(); }}
            className={`p-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition-colors ${
              priority === 'fastest'
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3 h-3" /> Fastest ETA
          </button>

          <button
            onClick={() => { setPriority('safest'); handleCalculate(); }}
            className={`p-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition-colors ${
              priority === 'safest'
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Safest Flow
          </button>

          <button
            onClick={() => { setPriority('transit'); handleCalculate(); }}
            className={`p-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition-colors ${
              priority === 'transit'
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Bus className="w-3 h-3" /> Public Mass Transit
          </button>
        </div>
      </div>

      {/* Result Card */}
      {isCalculated && (
        <div className="bg-slate-900 text-slate-100 p-3 rounded-md space-y-2.5 border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Optimal Route Computed
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Via ECP & Marina Coastal Expressway
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 font-semibold">Estimated Time</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">22 Mins</div>
            </div>

            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 font-semibold">Distance</div>
              <div className="text-sm font-bold text-white mt-0.5">18.4 km</div>
            </div>

            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 font-semibold">Congestion Risk</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">Low (18%)</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-blue-400" /> Recommended Alternate Bypass:
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/40 p-2 rounded border border-slate-800">
              PIE Expressway via Bartley Viaduct (ETA: 26 mins, 21.2 km). Avoids CTE bottleneck near Novena.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
