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
      case 'AlertOctagon': return <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'CloudRain': return <CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Users': return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Bus': return <Bus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Wrench': return <Wrench className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      default: return <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 p-3 space-y-3 shadow-2xs text-xs text-gray-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800 gap-2">
        <div>
          <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> Tactical Traffic Scenario Simulator
          </div>
          <div className="text-[10px] text-gray-500 dark:text-slate-400">
            Simulate urban traffic perturbations and test automated AI mitigation algorithms.
          </div>
        </div>

        {activeScenario ? (
          <button
            onClick={onResetScenario}
            className="w-full sm:w-auto px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold rounded flex items-center justify-center gap-1 text-[11px] transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" /> Reset Live Baseline
          </button>
        ) : (
          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded border border-emerald-200 dark:border-emerald-500/20 text-[10px] shrink-0">
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
                  ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/40 ring-2 ring-red-500/30'
                  : isSelected
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
                  : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700/60 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                {getIcon(scenario.iconName)}
                {isActive && <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500 animate-ping shrink-0" />}
              </div>
              <div className="font-bold text-[11px] text-gray-900 dark:text-slate-100 line-clamp-1">{scenario.title}</div>
              <div className="text-[9px] text-gray-500 dark:text-slate-400 line-clamp-1 mt-0.5">{scenario.affectedRoads.join(', ')}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Preview Box */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-md space-y-2 border border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold text-xs text-white flex items-center gap-1.5 min-w-0 truncate">
            {getIcon(selectedConfig.iconName)} {selectedConfig.title}
          </span>
          <span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-red-600 text-white shrink-0">
            {selectedConfig.severity} Impact
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">{selectedConfig.description}</p>

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
            <Play className="w-4 h-4 fill-white shrink-0" /> Execute Live Scenario Simulation
          </button>
        </div>
      </div>
    </div>
  );
};