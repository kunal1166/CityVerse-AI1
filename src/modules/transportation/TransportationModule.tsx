import React, { useState } from 'react';
import { useCityStore } from '../../store/useCityStore';
import { TransportationMap, MapObjectType } from './components/TransportationMap';
import { RoadDetailDrawer } from './components/RoadDetailDrawer';
import { ScenarioSimulatorPanel } from './components/ScenarioSimulatorPanel';
import { RouteOptimizerWidget } from './components/RouteOptimizerWidget';
import { TrafficAnalyticsSection } from './components/TrafficAnalyticsSection';
import { TrafficIncidentCenter } from './components/TrafficIncidentCenter';
import { TransportationExportModal } from './components/TransportationExportModal';
import { ScenarioConfig } from './transportationTypes';
import { RoadIncident } from '../../types';

import { 
  Bus, AlertOctagon, Sliders, ShieldAlert, RefreshCw, Cpu, Activity,
  Radio, CheckCircle2, Navigation, Clock, FileText, Zap, Camera, Eye,
  Shield, AlertTriangle, ArrowUpRight, ArrowDownRight, Share2, Sparkles
} from 'lucide-react';

export const TransportationModule: React.FC = () => {
  const { 
    selectedCity,
    dashboardData, 
    resolveIncident, 
    injectIncident, 
    searchQuery, 
    setSearchQuery,
    setQuickActionModalOpen 
  } = useCityStore();

  // State
  const [selectedMapObject, setSelectedMapObject] = useState<{ type: MapObjectType; data: any } | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioConfig | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'ai_intelligence' | 'route_optimizer' | 'scenario' | 'timeline'>('ai_intelligence');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const incidents = dashboardData?.incidents || [];
  const traffic = dashboardData?.traffic;
  const transit = dashboardData?.transit || [];
  const timeline = dashboardData?.timeline || [];
  const hourlyTrends = dashboardData?.hourlyTrends || [];

  // Compute scenario-adjusted traffic metrics
  const effectiveCongestion = Math.min(100, (traffic?.congestionIndex || 45) + (activeScenario?.addedCongestionIndex || 0));
  const effectiveSpeed = Math.max(10, (traffic?.avgSpeed || 50) - (activeScenario?.speedReductionKm || 0));

  const handleSelectObject = (type: MapObjectType, data: any) => {
    setSelectedMapObject({ type, data });
  };

  const handleRunScenario = (scenario: ScenarioConfig) => {
    setActiveScenario(scenario);
    // Inject a corresponding incident into store for maximum real-time coherence
    injectIncident({
      title: scenario.title,
      type: scenario.id === 'accident' ? 'accident' : scenario.id === 'heavy_rain' ? 'congestion' : 'closure',
      severity: scenario.severity,
      locationName: `${scenario.affectedRoads[0] || 'Main Corridor'} Zone`,
      description: scenario.description,
      recommendedAction: scenario.aiActionPlan,
      affectedLanes: 2,
    });
    showToast(`Simulation Triggered: ${scenario.title}`);
  };

  const handleResetScenario = () => {
    setActiveScenario(null);
    showToast('Simulation Reset to Baseline Live Telemetry.');
  };

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const triggerQuickSignalOptimization = () => {
    showToast('Adaptive Signal Priority Deployed: Extended green phase by +20s across 14 key arterial junctions.');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#F4F6F8] text-xs">
      
      {/* 1. TOP TELEMETRY STATUS BAR & COMMAND HEADER */}
      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-gray-100 pb-2">
          
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded text-white shadow-2xs">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight flex items-center gap-2">
                Transportation & Traffic Operations Command Center
                <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded font-bold uppercase">
                  {dashboardData?.city.name || 'Singapore'} LTA Tier-1
                </span>
              </h1>
              <p className="text-[11px] text-gray-500">
                Real-time arterial flow monitoring, adaptive signal priority grid, incident dispatch, and multi-modal transit management.
              </p>
            </div>
          </div>

          {/* Quick Command Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerQuickSignalOptimization}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors shadow-2xs text-[11px]"
            >
              <Zap className="w-3.5 h-3.5" /> Optimize Signals
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1.5 transition-colors shadow-2xs text-[11px]"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Executive Report
            </button>

            <button
              onClick={() => setQuickActionModalOpen(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors shadow-2xs text-[11px]"
            >
              <AlertOctagon className="w-3.5 h-3.5" /> Inject Test Incident
            </button>
          </div>
        </div>

        {/* Live System Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-gray-600 font-medium">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-gray-900">Connected APIs:</strong> 9/9 Active
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-gray-900">Traffic Sensors:</strong> 1,420 / 1,420 Online (100%)
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-gray-900">Optical AI Cameras:</strong> 850 / 850 Online
            </span>
            <span className="flex items-center gap-1">
              <strong className="text-gray-900">Signal Controllers:</strong> 240 / 240 Adaptive Sync
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-gray-500">
            <span>Last Update: Live • 2s ago</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              System Nominal
            </span>
          </div>
        </div>
      </div>

      {/* Action Notice Toast Banner */}
      {actionNotice && (
        <div className="bg-blue-600 text-white px-3 py-2 rounded-md font-semibold text-xs flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300" /> {actionNotice}
          </span>
          <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* 2. TOP 8 ENTERPRISE SMART KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
        
        {/* KPI 1: Congestion Capacity */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Congestion Index</div>
          <div className="text-lg font-extrabold text-gray-900">{effectiveCongestion}%</div>
          <div className="flex items-center text-[9px] font-semibold text-red-600 gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +2.4% vs peak
          </div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 12s ago</div>
        </div>

        {/* KPI 2: Avg Speed */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Avg Arterial Speed</div>
          <div className="text-lg font-extrabold text-gray-900">{effectiveSpeed} <span className="text-xs font-normal text-gray-500">km/h</span></div>
          <div className="flex items-center text-[9px] font-semibold text-emerald-600 gap-0.5">
            <ArrowDownRight className="w-3 h-3" /> Stable corridor
          </div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 5s ago</div>
        </div>

        {/* KPI 3: Vehicle Volume */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Active Vehicles</div>
          <div className="text-lg font-extrabold text-gray-900">{(traffic?.vehicleCount || 142850).toLocaleString()}</div>
          <div className="flex items-center text-[9px] font-semibold text-blue-600 gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Morning inflow
          </div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 2s ago</div>
        </div>

        {/* KPI 4: Bottlenecks */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Bottlenecks</div>
          <div className="text-lg font-extrabold text-amber-700">{traffic?.bottleneckCount || 4} Corridors</div>
          <div className="text-[9px] font-semibold text-amber-800">Orchard / CTE</div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 10s ago</div>
        </div>

        {/* KPI 5: Public Transit */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Transit On-Time</div>
          <div className="text-lg font-extrabold text-emerald-700">{traffic?.publicTransitOnTime || 94.2}%</div>
          <div className="flex items-center text-[9px] font-semibold text-emerald-600 gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> High Adherence
          </div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 15s ago</div>
        </div>

        {/* KPI 6: Active Incidents */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Active Incidents</div>
          <div className="text-lg font-extrabold text-red-600">{incidents.filter(i => i.status !== 'resolved').length} Logged</div>
          <div className="text-[9px] font-semibold text-red-700">1 Critical • 2 Major</div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 1s ago</div>
        </div>

        {/* KPI 7: Signal Health */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Signal Health</div>
          <div className="text-lg font-extrabold text-gray-900">99.1%</div>
          <div className="text-[9px] font-semibold text-emerald-600">Adaptive AI Grid</div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 3s ago</div>
        </div>

        {/* KPI 8: Travel Time Index */}
        <div className="bg-white p-2.5 rounded-md border border-gray-200 shadow-2xs space-y-1">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Travel Time TTI</div>
          <div className="text-lg font-extrabold text-blue-700">1.38x</div>
          <div className="text-[9px] font-semibold text-gray-600">Standard: 1.00x</div>
          <div className="text-[9px] text-gray-400 font-mono pt-0.5 border-t border-gray-100">Live • 20s ago</div>
        </div>

      </div>

      {/* 3. MAIN WORKSPACE GRID (~60% MAP + RIGHT OPERATIONS PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Interactive Map Container (~60% = 7 out of 12 cols) */}
        <div className="lg:col-span-7 h-[540px]">
          <TransportationMap
            onSelectObject={handleSelectObject}
            activeScenarioName={activeScenario?.title}
          />
        </div>

        {/* Right Operations Command Dock (~40% = 5 out of 12 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[540px] space-y-2">
          
          {/* Dock Tab Selector Header */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-md border border-gray-200 shadow-2xs">
            <button
              onClick={() => setActiveRightTab('ai_intelligence')}
              className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                activeRightTab === 'ai_intelligence'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> AI Intelligence
            </button>

            <button
              onClick={() => setActiveRightTab('route_optimizer')}
              className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                activeRightTab === 'route_optimizer'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" /> Route Optimizer
            </button>

            <button
              onClick={() => setActiveRightTab('scenario')}
              className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                activeRightTab === 'scenario'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Simulator
            </button>

            <button
              onClick={() => setActiveRightTab('timeline')}
              className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                activeRightTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Timeline
            </button>
          </div>

          {/* Dock Content Body */}
          <div className="flex-1 overflow-y-auto pr-0.5">
            
            {/* TAB 1: AI INTELLIGENCE & ACTION RECOMMENDATIONS */}
            {activeRightTab === 'ai_intelligence' && (
              <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3 shadow-2xs h-full">
                
                {/* AI Summary Box */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-md space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-blue-400" /> Operational AI Traffic Briefing
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Real-Time Synthesis</span>
                  </div>
                  <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                    Traffic congestion is increasing along Central Expressway (CTE) and Orchard Road due to evening commuter demand. Recommend increasing green signal duration by 20 seconds at Braddell and Scotts junctions.
                  </p>
                </div>

                {/* AI 1-Click Actionable Recommendations */}
                <div className="space-y-2">
                  <div className="font-bold text-gray-900 text-xs flex items-center justify-between">
                    <span>Targeted AI Control Recommendations</span>
                    <span className="text-[10px] text-blue-600 font-semibold">3 Active Protocols</span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-gray-900 text-[11px]">
                        <span>Signal Strategy +20s Green Split</span>
                        <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[9px]">High Priority</span>
                      </div>
                      <p className="text-[10px] text-gray-600">
                        Extends green light phase across CTE Northbound corridors to alleviate exit queue buildup.
                      </p>
                      <button
                        onClick={triggerQuickSignalOptimization}
                        className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] transition-colors"
                      >
                        Apply Signal Strategy (+20s Green)
                      </button>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-gray-900 text-[11px]">
                        <span>Activate VMS Rerouting Advisory</span>
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded text-[9px]">Medium Priority</span>
                      </div>
                      <p className="text-[10px] text-gray-600">
                        Display alternate route guidance via West Coast Highway on overhead electronic signboards.
                      </p>
                      <button
                        onClick={() => showToast('VMS Signboards Updated: Broadcasted Alternate Highway Advice.')}
                        className="w-full py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px] transition-colors"
                      >
                        Deploy Overhead VMS Guidance
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: ROUTE OPTIMIZER */}
            {activeRightTab === 'route_optimizer' && (
              <RouteOptimizerWidget cityName={dashboardData?.city.name || 'Singapore'} />
            )}

            {/* TAB 3: SCENARIO SIMULATOR */}
            {activeRightTab === 'scenario' && (
              <ScenarioSimulatorPanel
                activeScenario={activeScenario}
                onRunScenario={handleRunScenario}
                onResetScenario={handleResetScenario}
              />
            )}

            {/* TAB 4: LIVE OPERATIONAL TIMELINE */}
            {activeRightTab === 'timeline' && (
              <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3 shadow-2xs h-full">
                <div className="font-bold text-gray-900 text-xs flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" /> Live Operations Feed Timeline
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Chronological Log</span>
                </div>

                <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {timeline.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2 bg-gray-50 p-2 rounded border border-gray-200 text-[11px]">
                      <span className="font-mono text-gray-500 text-[10px] shrink-0 font-bold mt-0.5">{item.timestamp}</span>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{item.message}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              item.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : item.severity === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.severity}
                          </span>
                        </div>
                        {item.location && <div className="text-[10px] text-gray-500">Location: {item.location}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 4. TRAFFIC ANALYTICS & PREDICTIVE FORECAST SECTION */}
      <TrafficAnalyticsSection hourlyTrends={hourlyTrends} />

      {/* 5. TRAFFIC INCIDENT CENTER TABLE */}
      <TrafficIncidentCenter
        incidents={incidents}
        onResolveIncident={resolveIncident}
        onSelectIncident={(inc) => setSelectedMapObject({ type: 'incident', data: inc })}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 6. PUBLIC MASS TRANSIT FLEET MONITOR */}
      <div className="bg-white rounded-md border border-gray-200 p-3 space-y-2 shadow-2xs">
        <div className="font-bold text-gray-900 text-xs flex items-center justify-between pb-1 border-b border-gray-100">
          <span className="flex items-center gap-1.5">
            <Bus className="w-4 h-4 text-blue-600" /> Public Mass Transit Fleet Monitor (MRT Lines & Express Bus Grids)
          </span>
          <span className="text-[10px] text-gray-500 font-mono">Live Transit Adherence: {traffic?.publicTransitOnTime}%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {transit.map((line) => (
            <div key={line.id} className="bg-gray-50 border border-gray-200 rounded p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs">{line.name}</span>
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                  {line.type}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-600">
                <span>Status:</span>
                <span className={`font-semibold ${line.status === 'Normal' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {line.status}
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Capacity / Occupancy</span>
                  <span className="font-bold text-gray-800">{line.occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      line.occupancyRate > 85 ? 'bg-red-600' : line.occupancyRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${line.occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                <span>Active Units: {line.activeVehicles}</span>
                <span className="font-semibold text-emerald-700">On-Time: {line.onTimePercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLIDE-OVER ROAD & INCIDENT DETAIL DRAWER */}
      <RoadDetailDrawer
        selectedObject={selectedMapObject}
        onClose={() => setSelectedMapObject(null)}
        onResolveIncident={resolveIncident}
      />

      {/* EXECUTIVE EXPORT & PRINT MODAL */}
      <TransportationExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dashboardData={dashboardData}
      />

    </div>
  );
};
