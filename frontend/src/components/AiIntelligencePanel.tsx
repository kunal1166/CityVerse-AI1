import React, { useState } from 'react';
import { Bot, Sparkles, Send, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Lightbulb, X } from 'lucide-react';
import { useCityStore } from '../store/useCityStore';
import { apiUrl } from '../lib/api';
import { AiAnalysisResponse } from '../types';
import { useAiProvider } from '../hooks/useAiProvider';

interface AiIntelligencePanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AiIntelligencePanel: React.FC<AiIntelligencePanelProps> = ({ isOpen = false, onClose }) => {
  const { 
    selectedCity, 
    dashboardData, 
    isAiThinking, 
    setIsAiThinking 
  } = useCityStore();

  const aiProvider = useAiProvider();

  const [query, setQuery] = useState('');
  const [customAiResponse, setCustomAiResponse] = useState<AiAnalysisResponse | null>(null);
  const [appliedActions, setAppliedActions] = useState<Record<string, boolean>>({});

  const recommendations = dashboardData?.recommendations || [];

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsAiThinking(true);
    try {
      const res = await fetch(apiUrl('/api/ai/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: selectedCity,
          userQuery: query,
          contextType: 'general',
        }),
      });

      if (res.ok) {
        const data: AiAnalysisResponse = await res.json();
        setCustomAiResponse(data);
      }
    } catch (err) {
      console.error('AI query error:', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const toggleApplyAction = (id: string) => {
    setAppliedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50"
        onClick={onClose}
      />

      {/* Floating AI Panel Drawer - Positioned cleanly below top sticky bars */}
      <div className="fixed inset-x-3 bottom-3 top-24 sm:top-20 sm:right-4 sm:left-auto sm:w-85 max-h-[85vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col z-60 overflow-hidden text-xs">
        
        {/* Panel Header */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-xs leading-none truncate">AI Intelligence Panel</h3>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate block">{aiProvider.label} • Command Advisor</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[9px] font-semibold">
              LIVE
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                aria-label="Close AI Panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Panel Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
          
          {/* Operational AI Executive Summary */}
          <div className="bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-blue-900 dark:text-blue-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Executive Operational Briefing</span>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-slate-300 leading-relaxed">
              {customAiResponse?.summary || 
                `City telemetrics for ${dashboardData?.city.name} indicate moderate load on central corridors. Signal loops are adjusting to absorb current flow rate.`
              }
            </p>
          </div>

          {/* AI Risk Assessment */}
          {customAiResponse?.riskAssessment && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-md p-2.5 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-900 dark:text-amber-300 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Predictive Risk Assessment</span>
              </div>
              <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                {customAiResponse.riskAssessment}
              </p>
            </div>
          )}

          {/* Tactical Recommendations List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-semibold text-gray-700 dark:text-slate-300 text-[11px]">
              <span className="flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" /> AI Recommended Interventions
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">Auto-Prioritized</span>
            </div>

            {(customAiResponse?.recommendations?.length ? customAiResponse.recommendations : recommendations).map((rec: any, idx: number) => {
              const recId = rec.id || `REC-${idx}`;
              const isApplied = appliedActions[recId];

              return (
                <div
                  key={recId}
                  className={`p-2.5 rounded-md border transition-all space-y-1.5 ${
                    isApplied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40'
                      : rec.priority?.toLowerCase() === 'high'
                      ? 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-500/30 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        rec.priority?.toLowerCase() === 'high'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      {rec.priority || 'MEDIUM'} PRIORITY
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-mono">
                      {rec.timestamp || 'Just now'}
                    </span>
                  </div>

                  <div className="font-bold text-gray-900 dark:text-slate-100 text-xs leading-tight">{rec.title}</div>
                  {rec.reasoning && (
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 italic leading-snug">{rec.reasoning}</p>
                  )}
                  <p className="text-[11px] text-gray-700 dark:text-slate-300 font-medium">{rec.action || rec.suggestedAction}</p>

                  {rec.impact || rec.predictedImpact ? (
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/80 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                      Expected Impact: {rec.impact || rec.predictedImpact}
                    </div>
                  ) : null}

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => toggleApplyAction(recId)}
                      className={`px-2.5 py-1 rounded font-semibold text-[10px] flex items-center gap-1 transition-colors ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Action Deployed
                        </>
                      ) : (
                        <>
                          Deploy Intervention <ArrowRight className="w-2.5 h-2.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested Dispatch Units */}
          {customAiResponse?.suggestedDispatch && (
            <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-md p-2 space-y-1">
              <div className="font-semibold text-gray-700 dark:text-slate-300 text-[10px] uppercase">Suggested Unit Dispatch</div>
              <div className="flex flex-wrap gap-1">
                {customAiResponse.suggestedDispatch.map((unit, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-[10px] font-medium text-gray-800 dark:text-slate-200">
                    • {unit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operator Prompt AI Input Box */}
        <div className="p-2.5 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 shrink-0">
          <form onSubmit={handleAskAi} className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 block">
              Ask AI Command Advisor
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'How to mitigate congestion at Silk Board?'"
                disabled={isAiThinking}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md pl-2.5 pr-8 py-1.5 text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={isAiThinking || !query.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded transition-colors"
              >
                {isAiThinking ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};