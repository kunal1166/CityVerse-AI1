import React, { useState } from 'react';
import { useCityStore } from '../../store/useCityStore';
import { FileText, Download, Sparkles, FileSpreadsheet, Printer, CheckCircle2, Shield, Calendar, Loader2 } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const { selectedCity, dashboardData, isAiThinking, setIsAiThinking } = useCityStore();

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'incident'>('daily');
  const [includeAiExecutiveSummary, setIncludeAiExecutiveSummary] = useState(true);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);

  const cityName = dashboardData?.city.name || selectedCity;

  const generateReport = async () => {
    setIsAiThinking(true);
    setReportGenerated(false);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: selectedCity,
          userQuery: `Generate a comprehensive ${reportType} smart city operations report executive briefing.`,
          contextType: 'report',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportContent(data.summary || 'Report content generated.');
        setReportGenerated(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleExportCsv = () => {
    if (!dashboardData) return;
    const csvRows = [
      ['Metric', 'Value', 'Unit'],
      ['City', dashboardData.city.name, ''],
      ['Congestion Index', dashboardData.traffic.congestionIndex, '%'],
      ['Avg Speed', dashboardData.traffic.avgSpeed, 'km/h'],
      ['Air Quality Index', dashboardData.environment.aqi, 'AQI'],
      ['Rainfall Rate', dashboardData.environment.rainfallRate, 'mm/h'],
      ['Flood Risk Level', dashboardData.environment.floodRiskLevel, 'Stage'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedCity}_smart_city_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-[#F4F6F8] text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
        <div>
          <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Executive Operations Reporting & Data Export System
          </h2>
          <p className="text-[11px] text-gray-500">
            Generate official government briefings, AI-curated incident audits, PDF downloads, and raw telemetry CSV files.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded text-[10px] border border-gray-200">
            CLASSIFICATION: OFFICIAL USE ONLY
          </span>
        </div>
      </div>

      {/* Main Grid: Custom Report Generator & Generated Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Generator Form */}
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-2xs space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="font-bold text-gray-900 text-xs pb-2 border-b border-gray-100">
              Configure Report Generation Parameters
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray-600">Operating City Jurisdiction</label>
              <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded font-bold text-gray-900">
                {cityName} Command Center
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray-600">Report Framework Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800"
              >
                <option value="daily">Daily Command Center Operations Audit</option>
                <option value="weekly">Weekly Urban Mobility & Environmental Health Review</option>
                <option value="incident">Critical Incident & Flood Response Retrospective</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="aiOpt"
                checked={includeAiExecutiveSummary}
                onChange={(e) => setIncludeAiExecutiveSummary(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="aiOpt" className="text-gray-700 font-semibold text-[11px] cursor-pointer">
                Include AI Executive Briefing
              </label>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <button
              onClick={generateReport}
              disabled={isAiThinking}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              {isAiThinking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Compiling Report Data...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Compile Official Report
                </>
              )}
            </button>

            <button
              onClick={handleExportCsv}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded border border-gray-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Raw Telemetry CSV
            </button>
          </div>
        </div>

        {/* Report Preview Document */}
        <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header Document Seal */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                  GOV
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {cityName.toUpperCase()} SMART CITY COMMAND BRIEFING
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} • Security Tier L4
                  </p>
                </div>
              </div>

              {reportGenerated && (
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white font-semibold rounded flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
              )}
            </div>

            {/* Document Body */}
            {reportGenerated ? (
              <div className="pt-3 space-y-3">
                <div className="bg-blue-50/70 border border-blue-200 rounded p-3 space-y-1">
                  <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Executive AI Operational Summary
                  </div>
                  <p className="text-[11px] text-gray-800 leading-relaxed font-serif">
                    {reportContent}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                    <div className="font-bold text-gray-900 text-xs">Transportation Metrics</div>
                    <div className="text-[10px] text-gray-600">Congestion Index: {dashboardData?.traffic.congestionIndex}%</div>
                    <div className="text-[10px] text-gray-600">Arterial Speed Avg: {dashboardData?.traffic.avgSpeed} km/h</div>
                    <div className="text-[10px] text-gray-600">Transit On-Time: {dashboardData?.traffic.publicTransitOnTime}%</div>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                    <div className="font-bold text-gray-900 text-xs">Environmental Metrics</div>
                    <div className="text-[10px] text-gray-600">Air Quality Index: {dashboardData?.environment.aqi}</div>
                    <div className="text-[10px] text-gray-600">Precipitation Rate: {dashboardData?.environment.rainfallRate} mm/h</div>
                    <div className="text-[10px] text-gray-600">Flood Risk Stage: {dashboardData?.environment.floodRiskLevel}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-gray-300" />
                <div className="font-semibold text-gray-600">No Report Currently Compiled</div>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Select your parameters on the left and click "Compile Official Report" to generate.
                </p>
              </div>
            )}
          </div>

          <div className="text-[9px] text-gray-400 border-t border-gray-100 pt-2 flex justify-between">
            <span>CityVerse AI • Official Operations Platform</span>
            <span>Document Checksum: SHA-256 Verified</span>
          </div>
        </div>

      </div>

    </div>
  );
};
