import React, { useEffect, useState } from 'react';
import { BrainCircuit, AlertTriangle, Clock, Activity, Zap } from 'lucide-react';

interface HorizonPrediction {
  time: string;
  forecast: string;
  directive: string;
}

interface AnalyticsInsight {
  primaryRisk?: string;
  horizons?: HorizonPrediction[];
}

interface AgenticAnalyzerProps {
  cityId: string;
  correlations: any[];
  trends: any[];
}

const FALLBACK_DATA: AnalyticsInsight = {
  primaryRisk: "[SIMULATION ACTIVE: API LIMIT PROTECT] Strong inverse correlation detected between precipitation and arterial throughput.",
  horizons: [
    { time: "+1 Hour", forecast: "Speed degradation likely to reach critical thresholds.", directive: "Initiate localized traffic signal rerouting." },
    { time: "+4 Hours", forecast: "Volume bottleneck expansion anticipated in low-lying sectors.", directive: "Pre-deploy emergency transit units to secondary corridors." },
    { time: "+12 Hours", forecast: "Clearance phase and grid normalization.", directive: "Monitor arterial flow recovery and log infrastructure stress." }
  ]
};

export const AgenticAnalyzer: React.FC<AgenticAnalyzerProps> = ({ cityId, correlations, trends }) => {
  const [insight, setInsight] = useState<AnalyticsInsight | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAgenticInsights = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/agent/analytics-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityId, correlations: correlations || [], trends: trends || [] }),
        });

        const data = await response.json();
        
        if (isMounted) {
          if (data?.success && data?.insights?.primaryRisk) {
            setInsight(data.insights);
          } else {
            setInsight(FALLBACK_DATA);
          }
        }
      } catch (error) {
        console.warn("⚠️ API Limit Reached! Activating Hackathon Demo Fallback:", error);
        if (isMounted) setInsight(FALLBACK_DATA);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAgenticInsights();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]); 

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0B1120]">
        <div className="flex flex-col items-center gap-4 text-emerald-400">
          <BrainCircuit className="w-10 h-10 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase animate-pulse">
            Agentic AI synthesizing...
          </span>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  const displayRisk = insight.primaryRisk ?? FALLBACK_DATA.primaryRisk;
  const displayHorizons = insight.horizons ?? FALLBACK_DATA.horizons;

  return (
    <div className="w-full h-full flex flex-col bg-[#0B1120] overflow-y-auto">
      <div className="bg-emerald-900/20 border-b border-emerald-500/30 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-emerald-400" />
          <h3 className="text-emerald-100 font-bold text-sm tracking-wide">
            Agentic Forecast Engine
          </h3>
        </div>
        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> Live ML
        </span>
      </div>

      <div className="p-5 flex-1">
        <div className="mb-5 bg-red-950/30 border border-red-500/40 rounded-lg p-4 flex items-start gap-3 shadow-inner">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-red-300 uppercase tracking-wider mb-1">Identified Systemic Risk</h4>
            <p className="text-xs text-red-100 font-medium leading-relaxed">
              {displayRisk}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          {displayHorizons?.map((horizon, idx) => (
            <div key={idx} className="bg-gray-900/80 border border-gray-700 hover:border-emerald-500/50 transition-colors rounded-lg p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-gray-200 text-xs">Horizon: {horizon.time}</span>
              </div>
              <div className="mb-4">
                <span className="text-[9px] uppercase text-gray-500 font-bold block mb-1">Predicted State</span>
                <p className="text-xs text-gray-300 leading-relaxed">{horizon.forecast}</p>
              </div>
              <div className="mt-auto bg-emerald-950/20 rounded p-3 border border-emerald-900/50">
                <span className="text-[9px] uppercase text-emerald-400 font-bold flex items-center gap-1 mb-1.5">
                  <Zap className="w-3 h-3" /> Autonomous Directive
                </span>
                <p className="text-xs text-emerald-100 font-semibold">{horizon.directive}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};