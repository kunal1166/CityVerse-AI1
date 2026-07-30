import React, { useState } from 'react';
import { X, AlertOctagon, Radio, Send, CheckCircle2, Sliders, Volume2, Move } from 'lucide-react';
import { motion } from 'motion/react';
import { useCityStore } from '../store/useCityStore';
import { IncidentType, SeverityLevel } from '../types';

export const QuickActionsModal: React.FC = () => {
  const { 
    quickActionModalOpen, 
    setQuickActionModalOpen, 
    selectedCity, 
    injectIncident,
    dashboardData
  } = useCityStore();

  const [simType, setSimType] = useState<IncidentType>('congestion');
  const [simSeverity, setSimSeverity] = useState<SeverityLevel>('major');
  const [simTitle, setSimTitle] = useState('');
  const [simLocation, setSimLocation] = useState('');
  const [vmsMessage, setVmsMessage] = useState('CAUTION: HEAVY CONGESTION AHEAD - USE ALTERNATE ROUTE');
  const [vmsBroadcasted, setVmsBroadcasted] = useState(false);
  const [signalOverridden, setSignalOverridden] = useState(false);

  if (!quickActionModalOpen) return null;

  const cityName = dashboardData?.city.name || selectedCity;

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    await injectIncident({
      title: simTitle || `Simulated ${simType.toUpperCase()} Event`,
      type: simType,
      severity: simSeverity,
      locationName: simLocation || `${cityName} Main Arterial Junction`,
      description: 'Simulated event injected by Command Center Duty Officer.',
      affectedLanes: simSeverity === 'critical' ? 3 : 2,
    });
    setSimTitle('');
    setSimLocation('');
    setQuickActionModalOpen(false);
  };

  const handleBroadcastVms = () => {
    setVmsBroadcasted(true);
    setTimeout(() => setVmsBroadcasted(false), 3000);
  };

  const handleSignalOverride = () => {
    setSignalOverridden(true);
    setTimeout(() => setSignalOverridden(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div 
        drag
        dragMomentum={false}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-xs cursor-default my-auto"
      >
        {/* Header - Drag handle */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900 text-white flex items-center justify-between cursor-move select-none shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Move className="w-4 h-4 text-blue-400 shrink-0" />
            <Radio className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
            <span className="font-bold text-xs sm:text-sm truncate">Operator Command & Incident Simulator</span>
            <span className="hidden sm:inline text-[10px] text-gray-400 font-normal shrink-0">(Drag to move)</span>
          </div>
          <button
            onClick={() => setQuickActionModalOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Tabs / Body */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          
          {/* Section 1: Inject Live Incident to Map */}
          <div className="border border-gray-200 dark:border-slate-700/80 rounded-md p-2.5 sm:p-3 space-y-2 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-1.5 text-gray-900 dark:text-slate-100 font-bold text-xs">
              <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>Simulate & Inject Live Urban Emergency Incident</span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-tight">
              Test command center AI responsiveness and traffic rerouting loops for {cityName}.
            </p>

            <form onSubmit={handleInject} className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-slate-400 mb-1">Incident Type</label>
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value as IncidentType)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-slate-100"
                  >
                    <option value="congestion">Traffic Congestion Gridlock</option>
                    <option value="accident">Multi-Vehicle Collision</option>
                    <option value="closure">Flash Flood Road Closure</option>
                    <option value="construction">Metro Construction Work</option>
                    <option value="transit_delay">Transit Line Signaling Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-slate-400 mb-1">Severity Level</label>
                  <select
                    value={simSeverity}
                    onChange={(e) => setSimSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-slate-100"
                  >
                    <option value="critical">CRITICAL (Level 1 Emergency)</option>
                    <option value="major">MAJOR (Level 2 Alert)</option>
                    <option value="minor">MINOR (Level 3 Warning)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-slate-400 mb-1">Incident Title</label>
                  <input
                    type="text"
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    placeholder="e.g. Tanker Truck Breakdown"
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-slate-400 mb-1">Location / Corridor</label>
                  <input
                    type="text"
                    value={simLocation}
                    onChange={(e) => setSimLocation(e.target.value)}
                    placeholder="e.g. Central Outer Ring Ramp"
                    className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <AlertOctagon className="w-3.5 h-3.5" /> Inject Incident Into Live Telemetry
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Variable Message Sign (VMS) Broadcast */}
          <div className="border border-gray-200 dark:border-slate-700/80 rounded-md p-2.5 sm:p-3 space-y-2 bg-white dark:bg-slate-800/30">
            <div className="flex items-center space-x-1.5 text-gray-900 dark:text-slate-100 font-bold text-xs">
              <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Broadcast Variable Message Sign (VMS) Corridor Matrix</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={vmsMessage}
                onChange={(e) => setVmsMessage(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-gray-900 dark:text-slate-100 font-mono"
              />
              <button
                onClick={handleBroadcastVms}
                className="px-3 py-1.5 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded flex items-center justify-center gap-1 transition-colors shrink-0"
              >
                {vmsBroadcasted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Send className="w-3.5 h-3.5" />}
                {vmsBroadcasted ? 'Broadcasted' : 'Transmit VMS'}
              </button>
            </div>
          </div>

          {/* Section 3: Adaptive Signal Override */}
          <div className="border border-gray-200 dark:border-slate-700/80 rounded-md p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-800/30">
            <div>
              <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> Rapid Signal Override Protocol
              </div>
              <div className="text-[10px] text-gray-500 dark:text-slate-400">
                Override green light splits on 24 central arterial intersections for {cityName}.
              </div>
            </div>
            <button
              onClick={handleSignalOverride}
              className={`w-full sm:w-auto px-3 py-1.5 rounded font-bold transition-colors shrink-0 ${
                signalOverridden ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600'
              }`}
            >
              {signalOverridden ? 'Override Engaged' : 'Trigger Signal Override'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 py-2.5 bg-gray-50 dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400 shrink-0">
          <span className="text-center sm:text-left">Logged under Duty Officer Credentials • Security Clearance L4</span>
          <button
            onClick={() => setQuickActionModalOpen(false)}
            className="w-full sm:w-auto px-3 py-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded font-semibold transition-colors"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};