import React, { useState, useEffect } from 'react';
import { Shield, Search, Bell, Clock, AlertTriangle, ChevronDown, Radio, Activity, RefreshCw } from 'lucide-react';
import { useCityStore, CITIES_CONFIG } from '../store/useCityStore';
import { CityId } from '../types';
import { CityVerseLogo } from './CityVerseLogo';

export const Header: React.FC = () => {
  const { 
    selectedCity, 
    setSelectedCity, 
    searchQuery, 
    setSearchQuery, 
    emergencyMode, 
    setEmergencyMode, 
    dashboardData, 
    fetchDashboardData, 
    isLoading,
    setQuickActionModalOpen,
    activeTab
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
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between text-xs select-none sticky top-0 z-30 shadow-xs">
      {/* Left: Brand & City Selector */}
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <CityVerseLogo height={32} />
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* City Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md font-medium text-gray-800 transition-colors"
          >
            <span className="text-sm">{currentCityConfig.flag}</span>
            <span className="font-semibold">{currentCityConfig.name}</span>
            <span className="text-gray-400 text-[10px]">({currentCityConfig.country})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-1" />
          </button>

          {cityDropdownOpen && (
            <div className="absolute left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
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
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 transition-colors ${
                      isSelected ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{c.flag}</span>
                      <div>
                        <div className="text-xs font-medium">{c.name}</div>
                        <div className="text-[10px] text-gray-400">{c.timezone}</div>
                      </div>
                    </div>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
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
          className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search incidents, districts (${currentCityConfig.keyDistricts[0]}, etc.), or sensors in ${currentCityConfig.name}...`}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white placeholder-gray-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Emergency Mode & Clock */}
      <div className="flex items-center space-x-3">
        {/* Emergency Response Mode Toggle */}
        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md font-semibold text-xs border transition-colors ${
            emergencyMode
              ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-sm'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
          }`}
          title="Toggle Command Center Emergency Protocol"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{emergencyMode ? 'EMERGENCY ACTIVE' : 'EMERGENCY PROTOCOL'}</span>
        </button>

        <div className="h-5 w-px bg-gray-200" />

        {/* Clock */}
        <div className="flex items-center space-x-1.5 text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-semibold text-gray-800 text-xs">{time}</span>
          <span className="text-[10px] text-gray-400">UTC+8</span>
        </div>
      </div>
    </header>
  );
};
