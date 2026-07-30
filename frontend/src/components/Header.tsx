import React, { useState, useEffect } from 'react';
import { Menu, AlertTriangle, ChevronDown, Clock, RefreshCw } from 'lucide-react';
import { useCityStore, CITIES_CONFIG } from '../store/useCityStore';
import { CityId } from '../types';
import { CityVerseLogo } from './CityVerseLogo';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { 
    selectedCity, 
    setSelectedCity, 
    emergencyMode, 
    setEmergencyMode, 
    fetchDashboardData, 
    isLoading 
  } = useCityStore();

  const [time, setTime] = useState<string>('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentCityConfig = CITIES_CONFIG[selectedCity];

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-3 sm:px-4 flex items-center justify-between text-xs select-none sticky top-0 z-30 shadow-xs relative w-full shrink-0">
      {/* Left Group: Sidebar Toggle & Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 transition-colors shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <CityVerseLogo height={28} />
        </div>

        <div className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-slate-700 shrink-0 mx-1" />

        {/* City Selector Dropdown (Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden sm:block relative shrink-0">
          <button
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md font-medium text-gray-800 dark:text-slate-100 transition-colors"
          >
            <span className="text-sm">{currentCityConfig.flag}</span>
            <span className="font-semibold text-xs">{currentCityConfig.name}</span>
            <span className="hidden md:inline text-gray-400 dark:text-slate-500 text-[10px]">({currentCityConfig.country})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400 shrink-0" />
          </button>

          {cityDropdownOpen && (
            <div className="absolute left-0 mt-1 w-60 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                Select Jurisdiction
              </div>
              {(Object.keys(CITIES_CONFIG) as CityId[]).map((cId) => {
                const c = CITIES_CONFIG[cId];
                const isSelected = cId === selectedCity;
                return (
                  <button
                    key={cId}
                    onClick={() => {
                      setSelectedCity(cId);
                      setCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors ${
                      isSelected ? 'bg-blue-50/70 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <div>
                        <div className="text-xs font-medium">{c.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500">{c.timezone}</div>
                      </div>
                    </div>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={() => fetchDashboardData()}
          disabled={isLoading}
          title="Refresh live city telemetry"
          className="hidden sm:block p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Right Group: Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ThemeToggle />

        {/* Emergency Protocol Button */}
        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-md font-semibold text-xs border transition-colors shrink-0 ${
            emergencyMode
              ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-xs'
              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20'
          }`}
          title="Toggle Command Center Emergency Protocol"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline ml-1.5">{emergencyMode ? 'EMERGENCY ACTIVE' : 'EMERGENCY PROTOCOL'}</span>
        </button>

        <div className="hidden xl:block h-5 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />

        {/* Live Clock (Desktop Only) */}
        <div className="hidden xl:flex items-center gap-1.5 text-gray-600 dark:text-slate-300 font-mono bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-600 shrink-0">
          <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
          <span className="font-semibold text-gray-800 dark:text-slate-100 text-xs">{time}</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500">UTC+8</span>
        </div>
      </div>
    </header>
  );
};