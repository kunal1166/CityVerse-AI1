import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmergencyAlertsTicker } from './components/EmergencyAlertsTicker';
import { QuickActionsModal } from './components/QuickActionsModal';
import { useCityStore } from './store/useCityStore';

// Modules
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { TransportationModule } from './modules/transportation/TransportationModule';
import { EnvironmentModule } from './modules/environment/EnvironmentModule';
import { AnalyticsModule } from './modules/analytics/AnalyticsModule';
import { ReportsModule } from './modules/reports/ReportsModule';
import { SettingsModule } from './modules/settings/SettingsModule';

export default function App() {
  const { activeTab, fetchDashboardData, selectedCity, error, setError, isLoading } =
    useCityStore();

  useEffect(() => {
    fetchDashboardData(selectedCity);
  }, [selectedCity, fetchDashboardData]);

  const renderModule = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardModule />;
      case 'transportation':
        return <TransportationModule />;
      case 'environment':
        return <EnvironmentModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F6F8] text-gray-900 overflow-hidden font-['Inter',sans-serif]">
      {/* Top Bar */}
      <Header />

      {/* Emergency Alert Banner (when active) */}
      <EmergencyAlertsTicker />

      {/* Data/connection error banner. The store already tracked `error` but no
          component rendered it, so failures were previously invisible. */}
      {error && (
        <div
          role="alert"
          className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-red-50 border-b border-red-200 text-[11px] text-red-800"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold shrink-0">Telemetry Link Issue:</span>
            <span className="truncate">{error}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchDashboardData(selectedCity)}
              disabled={isLoading}
              className="px-2 py-0.5 rounded border border-red-300 bg-white hover:bg-red-100 font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Retrying...' : 'Retry'}
            </button>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="p-0.5 rounded hover:bg-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Command Body (Sidebar + Active Workspace Module) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {renderModule()}
        </main>
      </div>

      {/* Quick Action Simulation Modal */}
      <QuickActionsModal />
    </div>
  );
}
