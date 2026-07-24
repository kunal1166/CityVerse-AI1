import React, { useState } from 'react';
import { X, Printer, Download, Copy, CheckCircle2, FileText, Share2, Shield, Bus } from 'lucide-react';
import { CityDashboardData } from '../../../types';

interface TransportationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: CityDashboardData | null;
}

export const TransportationExportModal: React.FC<TransportationExportModalProps> = ({
  isOpen,
  onClose,
  dashboardData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dashboardData) return null;

  const traffic = dashboardData.traffic;
  const cityName = dashboardData.city.name;

  const summaryText = `NATIONAL SMART CITY COMMAND CENTER - TRANSPORTATION BRIEFING (${cityName.toUpperCase()})
Date/Time: ${new Date().toLocaleString()}
Status: OPERATIONAL SYNC ACTIVE

KEY METRICS:
- Traffic Congestion Capacity: ${traffic.congestionIndex}%
- Average Arterial Speed: ${traffic.avgSpeed} km/h
- Monitored Vehicle Volume: ${traffic.vehicleCount.toLocaleString()} veh/h
- Active Bottlenecks Logged: ${traffic.bottleneckCount} Corridors
- Public Mass Transit Adherence: ${traffic.publicTransitOnTime}%

EXECUTIVE SUMMARY:
Urban arterial corridors are currently operating under ${
    traffic.congestionIndex > 70 ? 'HEAVY COMMUTER CONGESTION' : 'STABLE COMMUTER FLOW'
  }. Signal priority algorithms are active across primary junctions. Active incidents are being monitored by optical cameras and dispatched patrol teams.`;

  const copySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `Metric,Value,Unit\n` +
      `Congestion Index,${traffic.congestionIndex},%\n` +
      `Average Speed,${traffic.avgSpeed},km/h\n` +
      `Vehicle Volume,${traffic.vehicleCount},veh/h\n` +
      `Transit On-Time,${traffic.publicTransitOnTime},%\n` +
      `Bottlenecks,${traffic.bottleneckCount},Corridors\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Traffic_Report_${cityName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-md border border-gray-200 shadow-2xl max-w-2xl w-full flex flex-col text-xs max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bus className="w-5 h-5 text-blue-400" />
            <div>
              <div className="font-bold text-sm">National Traffic Operations Executive Briefing</div>
              <div className="text-[10px] text-slate-400 font-mono">Singapore LTA & Smart City Command Format</div>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Preview */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* Printable Report Header Block */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-700" />
                <span className="font-bold text-gray-900 text-sm">{cityName} Land Transport Operations Center</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">{new Date().toLocaleDateString()}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">Congestion Index</div>
                <div className="font-bold text-gray-900 mt-0.5">{traffic.congestionIndex}%</div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">Avg Speed</div>
                <div className="font-bold text-gray-900 mt-0.5">{traffic.avgSpeed} km/h</div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">Vehicle Volume</div>
                <div className="font-bold text-gray-900 mt-0.5">{traffic.vehicleCount.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">Transit On-Time</div>
                <div className="font-bold text-emerald-700 mt-0.5">{traffic.publicTransitOnTime}%</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded border border-gray-200 text-gray-800 text-[11px] leading-relaxed">
              <div className="font-bold text-gray-900 mb-1">AI Executive Summary:</div>
              {summaryText.split('EXECUTIVE SUMMARY:')[1]}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={copySummary}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex items-center gap-1.5 transition-colors border border-gray-300"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Summary' : 'Copy AI Briefing'}</span>
            </button>

            <button
              onClick={downloadCSV}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex items-center gap-1.5 transition-colors border border-gray-300"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
