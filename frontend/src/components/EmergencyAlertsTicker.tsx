import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useCityStore } from '../store/useCityStore';

export const EmergencyAlertsTicker: React.FC = () => {
  const { dashboardData, emergencyMode, setSelectedIncident, setActiveTab } = useCityStore();

  const incidents = dashboardData?.incidents || [];
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical' && i.status === 'active');

  if (!emergencyMode && criticalIncidents.length === 0) {
    return null;
  }

  const primaryAlert = criticalIncidents[0];

  return (
    <div className="bg-red-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-semibold z-20 animate-pulse shadow-sm">
      <div className="flex items-center space-x-2.5 overflow-hidden">
        <span className="flex items-center gap-1 bg-white text-red-700 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL EMERGENCY ALERT
        </span>
        <span className="truncate">
          {primaryAlert
            ? `${primaryAlert.title} — ${primaryAlert.locationName}: ${primaryAlert.description}`
            : `EMERGENCY COMMAND PROTOCOL ACTIVATED FOR ${dashboardData?.city.name.toUpperCase()} JURISDICTION.`}
        </span>
      </div>

      {primaryAlert && (
        <button
          onClick={() => {
            setSelectedIncident(primaryAlert);
            setActiveTab('transportation');
          }}
          className="underline hover:text-red-100 shrink-0 text-[11px] font-bold flex items-center gap-1 ml-3"
        >
          View Incident <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
