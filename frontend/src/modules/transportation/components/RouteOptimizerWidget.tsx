import React, { useMemo, useState } from 'react';
import { Navigation, Clock, ShieldCheck, Zap, Bus, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RouteOptimizerWidgetProps {
  cityName: string;
}

// Real Taipei corridors used to build plausible-looking routes. Swapped in
// deterministically based on the origin/destination text so the same pair
// always produces the same route, but different pairs produce different
// routes — this is not a real routing engine (no geocoding, no actual road
// network pathfinding), just enough variation that the widget responds to
// what you type instead of always showing one fixed result.
const MAIN_CORRIDORS = [
  'Huanhe Expressway & Jianguo Elevated Rd',
  'Zhongxiao E. Rd & Dunhua N. Rd',
  'Xinsheng Overpass & Civic Blvd',
  'Bade Rd & Songshan Rd',
  'Keelung Rd & Xinyi Rd',
];

const BYPASS_CORRIDORS = [
  { name: 'Huanhe Expressway via Zhongshan Bridge', avoids: 'Jianguo Elevated Rd bottleneck near Guting' },
  { name: 'Civic Blvd via Fuxing Bridge', avoids: 'Zhongxiao E. Rd congestion near Dunhua' },
  { name: 'Keelung Rd via Taipei 101 underpass', avoids: 'Xinyi Rd gridlock near City Hall' },
  { name: 'Bade Rd via Songshan flyover', avoids: 'Nanjing E. Rd slowdown near Zhongshan' },
];

const TRANSIT_ROUTES = [
  'MRT Red Line + Bus 222',
  'MRT Blue Line (Bannan) direct',
  'MRT Brown Line + Bus 41',
  'MRT Green Line + Bus 15',
];

/** Small deterministic string hash so the same input always produces the
 * same "computed" route, while different input produces different results. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export const RouteOptimizerWidget: React.FC<RouteOptimizerWidgetProps> = ({ cityName }) => {
  const [source, setSource] = useState('Taipei Songshan Airport');
  const [destination, setDestination] = useState('Xinyi Financial District');
  const [priority, setPriority] = useState<'fastest' | 'safest' | 'lowest_congestion' | 'transit'>('lowest_congestion');
  const [isCalculated, setIsCalculated] = useState(true);
  const [lastQuery, setLastQuery] = useState({ source, destination, priority });

  const handleCalculate = () => {
    setIsCalculated(false);
    setTimeout(() => {
      setLastQuery({ source, destination, priority });
      setIsCalculated(true);
    }, 400);
  };

  // Everything below is derived purely from lastQuery, so it only changes
  // when Calculate is pressed (not on every keystroke), and always matches
  // what was actually submitted.
  const route = useMemo(() => {
    const seed = hashString(`${lastQuery.source.trim().toLowerCase()}|${lastQuery.destination.trim().toLowerCase()}`);

    const baseDistanceKm = 5 + (seed % 300) / 10; // 5.0 - 35.0 km
    const baseSpeedKmh = 32; // rough urban average
    let baseTimeMin = (baseDistanceKm / baseSpeedKmh) * 60;
    let congestionPct = 12 + (seed % 60); // 12 - 71 %

    // Priority objective shifts the numbers in a direction that actually
    // matches what the button claims to optimize for.
    if (lastQuery.priority === 'fastest') {
      baseTimeMin *= 0.85;
      congestionPct = Math.min(95, congestionPct + 8);
    } else if (lastQuery.priority === 'safest') {
      baseTimeMin *= 1.15;
      congestionPct = Math.max(5, congestionPct - 10);
    } else if (lastQuery.priority === 'lowest_congestion') {
      congestionPct = Math.max(5, congestionPct - 18);
    }

    const congestionLabel = congestionPct >= 55 ? 'High' : congestionPct >= 28 ? 'Moderate' : 'Low';
    const congestionColor =
      congestionPct >= 55 ? 'text-red-400' : congestionPct >= 28 ? 'text-amber-400' : 'text-emerald-400';

    const mainCorridor = MAIN_CORRIDORS[seed % MAIN_CORRIDORS.length];
    const bypass = BYPASS_CORRIDORS[(seed >> 3) % BYPASS_CORRIDORS.length];
    const transitRoute = TRANSIT_ROUTES[(seed >> 5) % TRANSIT_ROUTES.length];
    const bypassTimeMin = Math.round(baseTimeMin + 3 + (seed % 6));
    const bypassDistanceKm = (baseDistanceKm + 1 + (seed % 30) / 10).toFixed(1);

    return {
      viaLabel: lastQuery.priority === 'transit' ? `Via ${transitRoute}` : `Via ${mainCorridor}`,
      timeMin: Math.round(baseTimeMin),
      distanceKm: baseDistanceKm.toFixed(1),
      congestionPct,
      congestionLabel,
      congestionColor,
      bypassText:
        lastQuery.priority === 'transit'
          ? `${transitRoute} (${Math.round(baseTimeMin + 6)} mins). Fewer transfers, slightly longer walk.`
          : `${bypass.name} (ETA: ${bypassTimeMin} mins, ${bypassDistanceKm} km). Avoids ${bypass.avoids}.`,
    };
  }, [lastQuery]);

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
              {route.viaLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 font-semibold">Estimated Time</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{route.timeMin} Mins</div>
            </div>

            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 font-semibold">Distance</div>
              <div className="text-sm font-bold text-white mt-0.5">{route.distanceKm} km</div>
            </div>

            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <div className="text-[10px] text-slate-400 font-semibold">Congestion Risk</div>
              <div className={`text-sm font-bold mt-0.5 ${route.congestionColor}`}>
                {route.congestionLabel} ({route.congestionPct}%)
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-blue-400" /> Recommended Alternate Bypass:
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/40 p-2 rounded border border-slate-800">
              {route.bypassText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};