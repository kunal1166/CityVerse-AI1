import React, { useState } from 'react';
import { Bot, Sparkles, Send, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, Loader2, Lightbulb } from 'lucide-react';
import { useCityStore } from '../store/useCityStore';
import { AiAnalysisResponse } from '../types';
import { useAiProvider } from '../hooks/useAiProvider';

export const AiIntelligencePanel: React.FC = () => {
  const { 
    selectedCity, 
    dashboardData, 
    isAiThinking, 
    setIsAiThinking, 
    injectIncident 
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
      const res = await fetch('/api/ai/analyze', {
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

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 text-xs z-10 overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xs leading-none">AI Intelligence Panel</h3>
            <span className="text-[10px] text-gray-500 font-medium">{aiProvider.label} • Command Advisor</span>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold">
          LIVE
        </span>
      </div>

      {/* Main Panel Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        
        {/* Operational AI Executive Summary */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-md p-2.5 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-blue-900 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Executive Operational Briefing</span>
          </div>
          <p className="text-[11px] text-gray-700 leading-relaxed">
            {customAiResponse?.summary || 
              `City telemetrics for ${dashboardData?.city.name} indicate moderate load on central corridors. Signal loops are adjusting to absorb current flow rate.`
            }
          </p>
        </div>

        {/* AI Risk Assessment */}
        {customAiResponse?.riskAssessment && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-900 font-semibold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Predictive Risk Assessment</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              {customAiResponse.riskAssessment}
            </p>
          </div>
        )}

        {/* Tactical Recommendations List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-semibold text-gray-700 text-[11px]">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> AI Recommended Interventions
            </span>
            <span className="text-[10px] text-gray-400 font-normal">Auto-Prioritized</span>
          </div>

          {(customAiResponse?.recommendations?.length ? customAiResponse.recommendations : recommendations).map((rec: any, idx: number) => {
            const recId = rec.id || `REC-${idx}`;
            const isApplied = appliedActions[recId];

            return (
              <div
                key={recId}
                className={`p-2.5 rounded-md border transition-all space-y-1.5 ${
                  isApplied
                    ? 'bg-emerald-50 border-emerald-300'
                    : rec.priority?.toLowerCase() === 'high'
                    ? 'bg-white border-red-200 shadow-2xs'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      rec.priority?.toLowerCase() === 'high'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {rec.priority || 'MEDIUM'} PRIORITY
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {rec.timestamp || 'Just now'}
                  </span>
                </div>

                <div className="font-bold text-gray-900 text-xs leading-tight">{rec.title}</div>
                {rec.reasoning && (
                  <p className="text-[10px] text-gray-500 italic leading-snug">{rec.reasoning}</p>
                )}
                <p className="text-[11px] text-gray-700 font-medium">{rec.action || rec.suggestedAction}</p>

                {rec.impact || rec.predictedImpact ? (
                  <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
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
          <div className="bg-gray-50 border border-gray-200 rounded-md p-2 space-y-1">
            <div className="font-semibold text-gray-700 text-[10px] uppercase">Suggested Unit Dispatch</div>
            <div className="flex flex-wrap gap-1">
              {customAiResponse.suggestedDispatch.map((unit, i) => (
                <span key={i} className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-medium text-gray-800">
                  • {unit}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operator Prompt AI Input Box */}
      <div className="p-2.5 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleAskAi} className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-600 block">
            Ask AI Command Advisor
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'How to mitigate congestion at Silk Board?'"
              disabled={isAiThinking}
              className="w-full bg-white border border-gray-300 rounded-md pl-2.5 pr-8 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isAiThinking || !query.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded transition-colors"
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
  );
};
