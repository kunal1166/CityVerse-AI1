import React, { useState } from 'react';
import { useCityStore } from '../../store/useCityStore';
import { useAiProvider } from '../../hooks/useAiProvider';
import { Settings, Cpu, Sliders, CheckCircle2, Save } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { dashboardData } = useCityStore();
  const aiProvider = useAiProvider();

  const [aqiThreshold, setAqiThreshold] = useState(100);
  const [speedThreshold, setSpeedThreshold] = useState(25);
  const [rainThreshold, setRainThreshold] = useState(15);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#F4F6F8] dark:bg-slate-950 text-gray-900 dark:text-slate-100 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" /> Platform Configuration & Sensor Network Calibration
          </h2>
          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-slate-400">
            Configure system alert limits, AI model parameters, and duty officer protocols.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {saved ? 'Configurations Saved' : 'Save System Parameters'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Section 1: Alert Threshold Limits */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Operational Alert Thresholds
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-800 dark:text-slate-200 mb-1">
                <span>AQI Danger Alert Level</span>
                <span className="font-mono text-amber-700 dark:text-amber-400">{aqiThreshold} AQI</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={aqiThreshold}
                onChange={(e) => setAqiThreshold(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="text-[10px] text-gray-400 dark:text-slate-500">Triggers automated health advisory broadcast when exceeded.</div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-800 dark:text-slate-200 mb-1">
                <span>Arterial Speed Gridlock Warning</span>
                <span className="font-mono text-red-600 dark:text-red-400">{speedThreshold} km/h</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={speedThreshold}
                onChange={(e) => setSpeedThreshold(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="text-[10px] text-gray-400 dark:text-slate-500">Flags corridor as critical bottleneck on map workspace.</div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-800 dark:text-slate-200 mb-1">
                <span>Precipitation Dewatering Trigger</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{rainThreshold} mm/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={rainThreshold}
                onChange={(e) => setRainThreshold(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="text-[10px] text-gray-400 dark:text-slate-500">Engages high-capacity pumps at monitored underpasses.</div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <input
                type="checkbox"
                id="autoDisp"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
              />
              <label htmlFor="autoDisp" className="text-gray-800 dark:text-slate-200 font-semibold text-[11px] cursor-pointer">
                Enable Automated Unit Pre-Dispatch Recommendations
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: AI Engine & Server Architecture Info */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-md border border-gray-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5 pb-2 border-b border-gray-100 dark:border-slate-800">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> AI Engine & Command Gateway Specifications
          </div>

          <div className="space-y-2.5">
            <div className="bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded border border-gray-200 dark:border-slate-700/60 space-y-1">
              <div className="flex justify-between font-semibold text-gray-900 dark:text-slate-100">
                <span>Primary AI Model:</span>
                <span className="font-mono text-blue-700 dark:text-blue-400">{aiProvider.model}</span>
              </div>
              <div className="text-[10px] text-gray-500 dark:text-slate-400">
                Provider: {aiProvider.label}. Server-side execution via a pluggable AI gateway
                (Anthropic, OpenAI, Groq, OpenRouter or local Ollama).
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded border border-gray-200 dark:border-slate-700/60 space-y-1">
              <div className="flex justify-between font-semibold text-gray-900 dark:text-slate-100">
                <span>REST API Server:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">Express + Node.js (Port 3000)</span>
              </div>
              <div className="text-[10px] text-gray-500 dark:text-slate-400">
                Encapsulates external API integrations, caching layer, and simulation engine.
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded border border-gray-200 dark:border-slate-700/60 space-y-1">
              <div className="flex justify-between font-semibold text-gray-900 dark:text-slate-100">
                <span>GIS Mapping Engine:</span>
                <span className="font-mono text-gray-700 dark:text-slate-300">Leaflet Vector Layering</span>
              </div>
              <div className="text-[10px] text-gray-500 dark:text-slate-400">
                Real-time spatial layer overlays for traffic, AQI, flood risk, and sensor telemetry.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};