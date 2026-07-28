import React, { useState, useEffect } from 'react';
import { Menu, Search, AlertTriangle, ChevronDown, Clock, RefreshCw } from 'lucide-react';
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
    searchQuery, 
    setSearchQuery, 
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
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 flex items-center justify-between text-xs select-none sticky top-0 z-30 shadow-xs">
      {/* Left: Sidebar Toggle, Brand & City Selector */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <CityVerseLogo height={32} />
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1" />

        {/* City Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md font-medium text-gray-800 dark:text-slate-100 transition-colors"
          >
            <span className="text-sm">{currentCityConfig.flag}</span>
            <span className="font-semibold">{currentCityConfig.name}</span>
            <span className="text-gray-400 dark:text-slate-500 text-[10px]">({currentCityConfig.country})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400 ml-1" />
          </button>

          {cityDropdownOpen && (
            <div className="absolute left-0 mt-1 w-60 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                Select Operating Jurisdiction
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
                    <div className="flex items-center space-x-2">
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
          className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search incidents, districts, or sensors in ${currentCityConfig.name}...`}
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 placeholder-gray-400 dark:placeholder-slate-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xs font-semibold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle, Emergency Mode & Clock */}
      <div className="flex items-center space-x-3">
        <ThemeToggle />

        <div className="h-5 w-px bg-gray-200 dark:bg-slate-700" />

        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md font-semibold text-xs border transition-colors ${
            emergencyMode
              ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-sm'
              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20'
          }`}
          title="Toggle Command Center Emergency Protocol"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{emergencyMode ? 'EMERGENCY ACTIVE' : 'EMERGENCY PROTOCOL'}</span>
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-slate-700" />

        <div className="flex items-center space-x-1.5 text-gray-600 dark:text-slate-300 font-mono bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-200 dark:border-slate-600">
          <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
          <span className="font-semibold text-gray-800 dark:text-slate-100 text-xs">{time}</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-500">UTC+8</span>
        </div>
      </div>
    </header>
  );
};