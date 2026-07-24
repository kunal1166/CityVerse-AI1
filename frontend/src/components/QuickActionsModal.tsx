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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        drag
        dragMomentum={false}
        className="bg-white border border-gray-200 rounded-lg shadow-2xl w-full max-w-xl overflow-hidden text-xs cursor-default"
      >
        {/* Header - Drag handle */}
        <div className="px-4 py-3 bg-gray-900 text-white flex items-center justify-between cursor-move select-none">
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-blue-400" />
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="font-bold text-sm">Operator Command & Incident Simulator</span>
            <span className="text-[10px] text-gray-400 font-normal">(Drag to move)</span>
          </div>
          <button
            onClick={() => setQuickActionModalOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Tabs / Body */}
        <div className="p-4 space-y-4">
          
          {/* Section 1: Inject Live Incident to Map */}
          <div className="border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
            <div className="flex items-center space-x-1.5 text-gray-900 font-bold text-xs">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>Simulate & Inject Live Urban Emergency Incident</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-tight">
              Test command center AI responsiveness and traffic rerouting loops for {cityName}.
            </p>

            <form onSubmit={handleInject} className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Incident Type</label>
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value as IncidentType)}
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                  >
                    <option value="congestion">Traffic Congestion Gridlock</option>
                    <option value="accident">Multi-Vehicle Collision</option>
                    <option value="closure">Flash Flood Road Closure</option>
                    <option value="construction">Metro Construction Work</option>
                    <option value="transit_delay">Transit Line Signaling Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Severity Level</label>
                  <select
                    value={simSeverity}
                    onChange={(e) => setSimSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                  >
                    <option value="critical">CRITICAL (Level 1 Emergency)</option>
                    <option value="major">MAJOR (Level 2 Alert)</option>
                    <option value="minor">MINOR (Level 3 Warning)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Incident Title</label>
                  <input
                    type="text"
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    placeholder="e.g. Tanker Truck Breakdown"
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Location / Corridor</label>
                  <input
                    type="text"
                    value={simLocation}
                    onChange={(e) => setSimLocation(e.target.value)}
                    placeholder="e.g. Central Outer Ring Ramp"
                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <AlertOctagon className="w-3.5 h-3.5" /> Inject Incident Into Live Telemetry
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Variable Message Sign (VMS) Broadcast */}
          <div className="border border-gray-200 rounded-md p-3 space-y-2 bg-white">
            <div className="flex items-center space-x-1.5 text-gray-900 font-bold text-xs">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span>Broadcast Variable Message Sign (VMS) Corridor Matrix</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={vmsMessage}
                onChange={(e) => setVmsMessage(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-900 font-mono"
              />
              <button
                onClick={handleBroadcastVms}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded flex items-center gap-1 transition-colors"
              >
                {vmsBroadcasted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Send className="w-3.5 h-3.5" />}
                {vmsBroadcasted ? 'Broadcasted' : 'Transmit VMS'}
              </button>
            </div>
          </div>

          {/* Section 3: Adaptive Signal Override */}
          <div className="border border-gray-200 rounded-md p-3 flex items-center justify-between bg-white">
            <div>
              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" /> Rapid Signal Override Protocol
              </div>
              <div className="text-[10px] text-gray-500">
                Override green light splits on 24 central arterial intersections for {cityName}.
              </div>
            </div>
            <button
              onClick={handleSignalOverride}
              className={`px-3 py-1.5 rounded font-bold transition-colors ${
                signalOverridden ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {signalOverridden ? 'Override Engaged' : 'Trigger Signal Override'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500">
          <span>Logged under Duty Officer Credentials • Security Clearance L4</span>
          <button
            onClick={() => setQuickActionModalOpen(false)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold"
          >
            Close Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
