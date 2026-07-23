import React, { useState } from 'react';
import { LayoutDashboard, Bus, CloudRain, BarChart3, FileText, GripVertical, Settings } from 'lucide-react';
import { Reorder } from 'motion/react';
import { useCityStore, TabType } from '../store/useCityStore';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, dashboardData } = useCityStore();

  const activeIncidentsCount = dashboardData?.incidents.filter(i => i.status === 'active').length || 0;

  const initialNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Command Center City Summary',
    },
    {
      id: 'transportation',
      label: 'Transportation',
      icon: Bus,
      badge: activeIncidentsCount > 0 ? `${activeIncidentsCount}` : undefined,
      description: 'Traffic Flow & Incidents',
    },
    {
      id: 'environment',
      label: 'Environment',
      icon: CloudRain,
      description: 'AQI, Flood & Weather Risk',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Correlations & Predictive Trends',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'AI Executive Briefings & Exports',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Thresholds, AI Engine & Calibration',
    },
  ];

  // Only the ORDER is stored in state. Previously the whole array was held in
  // useState, which froze it at first render - so the incident badge never
  // updated after mount. Deriving the items each render keeps badges live while
  // still preserving the user's drag-to-reorder order.
  const [order, setOrder] = useState<TabType[]>(initialNavItems.map((i) => i.id));

  const navItems = order
    .map((id) => initialNavItems.find((i) => i.id === id))
    .filter((i): i is NavItem => Boolean(i));

  const handleReorder = (next: NavItem[]) => setOrder(next.map((i) => i.id));

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none z-20">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Modules</span>
          <span className="text-[9px] text-gray-400 font-normal normal-case flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-gray-300" />
            Drag to reorder
          </span>
        </div>

        <Reorder.Group as="nav" role="tablist" aria-label="Command center modules" axis="y" values={navItems} onReorder={handleReorder} className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Reorder.Item
                key={item.id}
                value={item}
                className="touch-none"
                whileDrag={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              >
                <div
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  aria-label={`${item.label} - ${item.description}`}
                  onClick={() => setActiveTab(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveTab(item.id);
                    }
                  }}
                  className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <GripVertical className={`w-3.5 h-3.5 shrink-0 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'text-blue-200' : 'text-gray-400'
                    }`} />
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive ? 'bg-white text-blue-700' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
    </aside>
  );
};
