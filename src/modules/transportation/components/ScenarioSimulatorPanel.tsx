import React, { useState } from 'react';
import { SCENARIO_CONFIGS } from '../transportationData';
import { ScenarioType, ScenarioConfig } from '../transportationTypes';
import { Play, RotateCcw, AlertOctagon, CloudRain, ShieldAlert, Users, Bus, ShieldCheck, Wrench, Check, Sparkles } from 'lucide-react';

interface ScenarioSimulatorPanelProps {
  activeScenario: ScenarioConfig | null;
  onRunScenario: (scenario: ScenarioConfig) => void;
  onResetScenario: () => void;
}

export const ScenarioSimulatorPanel: React.FC<ScenarioSimulatorPanelProps> = ({
  activeScenario,
  onRunScenario,
  onResetScenario,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioType>('accident');

  const selectedConfig = SCENARIO_CONFIGS.find((s) => s.id === selectedScenarioId) || SCENARIO_CONFIGS[0];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertOctagon': return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case 'CloudRain': return <CloudRain className="w-4 h-4 text-blue-600" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'Users': return <Users className="w-4 h-4 text-purple-600" />;
      case 'Bus': return <Bus className="w-4 h-4 text-indigo-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-slate-600" />;
      default: return <AlertOctagon className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 space-y-3 shadow-2xs text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" /> Tactical Traffic Scenario Simulator
          </div>
          <div className="text-[10px] text-gray-500">
            Simulate urban traffic perturbations and test automated AI mitigation algorithms.
          </div>
        </div>

        {activeScenario ? (
          <button
            onClick={onResetScenario}
            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex items-center gap-1 text-[11px] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Live Baseline
          </button>
        ) : (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 text-[10px]">
            Baseline Operational
          </span>
        )}
      </div>

      {/* Scenario Selector Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCENARIO_CONFIGS.map((scenario) => {
          const isSelected = selectedScenarioId === scenario.id;
          const isActive = activeScenario?.id === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenarioId(scenario.id)}
              className={`p-2 rounded border text-left transition-all ${
                isActive
                  ? 'bg-red-50 border-red-300 ring-2 ring-red-500/30'
                  : isSelected
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                {getIcon(scenario.iconName)}
                {isActive && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
              </div>
              <div className="font-bold text-[11px] text-gray-900 line-clamp-1">{scenario.title}</div>
              <div className="text-[9px] text-gray-500 line-clamp-1 mt-0.5">{scenario.affectedRoads.join(', ')}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Preview Box */}
      <div className="bg-slate-900 text-slate-100 p-3 rounded-md space-y-2 border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-white flex items-center gap-1.5">
            {getIcon(selectedConfig.iconName)} {selectedConfig.title}
          </span>
          <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-red-600 text-white">
            {selectedConfig.severity} Impact
          </span>
        </div>

        <p className="text-[11px] text-slate-300">{selectedConfig.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800">
          <div>
            <span className="text-slate-400 font-semibold">Predicted Impact:</span>
            <div className="text-red-400 font-bold mt-0.5">{selectedConfig.impactSummary}</div>
          </div>
          <div>
            <span className="text-slate-400 font-semibold">Automated AI Protocol:</span>
            <div className="text-blue-300 font-medium mt-0.5">{selectedConfig.aiActionPlan}</div>
          </div>
        </div>

        {/* Execution Trigger Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onRunScenario(selectedConfig)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-md text-xs"
          >
            <Play className="w-4 h-4 fill-white" /> Execute Live Scenario Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
