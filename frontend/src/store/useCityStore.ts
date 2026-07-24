import { create } from 'zustand';
import { CityId, CityDashboardData, RoadIncident } from '../types';

export type TabType = 'overview' | 'transportation' | 'environment' | 'analytics' | 'reports' | 'settings';

export interface MapLayerState {
  traffic: boolean;
  aqi: boolean;
  flood: boolean;
  incidents: boolean;
  transit: boolean;
  weather: boolean;
  sensors: boolean;
}

interface CityState {
  selectedCity: CityId;
  activeTab: TabType;
  searchQuery: string;
  mapLayers: MapLayerState;
  dashboardData: CityDashboardData | null;
  isLoading: boolean;
  isAiThinking: boolean;
  error: string | null;
  lastUpdated: string | null;
  emergencyMode: boolean;
  quickActionModalOpen: boolean;
  selectedIncident: RoadIncident | null;

  // Actions
  setSelectedCity: (city: CityId) => void;
  setActiveTab: (tab: TabType) => void;
  setSearchQuery: (query: string) => void;
  toggleMapLayer: (layer: keyof MapLayerState) => void;
  setMapLayer: (layer: keyof MapLayerState, value: boolean) => void;
  setDashboardData: (data: CityDashboardData) => void;
  setIsLoading: (loading: boolean) => void;
  setIsAiThinking: (thinking: boolean) => void;
  setError: (error: string | null) => void;
  setEmergencyMode: (mode: boolean) => void;
  setQuickActionModalOpen: (open: boolean) => void;
  setSelectedIncident: (incident: RoadIncident | null) => void;
  
  // API triggers
  fetchDashboardData: (cityId?: CityId) => Promise<void>;
  injectIncident: (incident: Partial<RoadIncident>) => Promise<void>;
  resolveIncident: (incidentId: string) => Promise<void>;
}

export const CITIES_CONFIG = {
  singapore: {
    id: 'singapore' as CityId,
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    lat: 1.3521,
    lng: 103.8198,
    zoom: 12,
    timezone: 'Asia/Singapore (SGT UTC+8)',
    population: '5.92M',
    keyDistricts: ['Marina Bay', 'Orchard Road', 'Jurong East', 'Changi', 'Woodlands', 'Paya Lebar'],
  },
  taipei: {
    id: 'taipei' as CityId,
    name: 'Taipei',
    country: 'Taiwan',
    flag: '🇹🇼',
    lat: 25.0330,
    lng: 121.5654,
    zoom: 12,
    timezone: 'Asia/Taipei (CST UTC+8)',
    population: '2.50M',
    keyDistricts: ['Xinyi District', 'Daan District', 'Neihu Tech Park', 'Zhongshan', 'Songshan', 'Wanhua'],
  },
  bengaluru: {
    id: 'bengaluru' as CityId,
    name: 'Bengaluru',
    country: 'India',
    flag: '🇮🇳',
    lat: 12.9716,
    lng: 77.5946,
    zoom: 12,
    timezone: 'Asia/Kolkata (IST UTC+5:30)',
    population: '13.19M',
    keyDistricts: ['ORR Electronic City', 'Whitefield', 'Indiranagar', 'Hebbal', 'Koramangala', 'Central Silk Board'],
  },
};

export const useCityStore = create<CityState>((set, get) => ({
  selectedCity: 'singapore',
  activeTab: 'overview',
  searchQuery: '',
  mapLayers: {
    traffic: true,
    aqi: true,
    flood: true,
    incidents: true,
    transit: false,
    weather: false,
    sensors: true,
  },
  dashboardData: null,
  isLoading: true,
  isAiThinking: false,
  error: null,
  lastUpdated: null,
  emergencyMode: false,
  quickActionModalOpen: false,
  selectedIncident: null,

  // Only sets state. App.tsx has a useEffect keyed on selectedCity that performs
  // the fetch; calling it here as well caused two identical requests per switch.
  setSelectedCity: (city) => set({ selectedCity: city }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  toggleMapLayer: (layer) => set((state) => ({
    mapLayers: { ...state.mapLayers, [layer]: !state.mapLayers[layer] }
  })),

  setMapLayer: (layer, value) => set((state) => ({
    mapLayers: { ...state.mapLayers, [layer]: value }
  })),

  setDashboardData: (data) => set({ 
    dashboardData: data, 
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: false }) 
  }),

  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsAiThinking: (thinking) => set({ isAiThinking: thinking }),
  setError: (error) => set({ error }),
  setEmergencyMode: (mode) => set({ emergencyMode: mode }),
  setQuickActionModalOpen: (open) => set({ quickActionModalOpen: open }),
  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  fetchDashboardData: async (cityId) => {
    const targetCity = cityId || get().selectedCity;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/dashboard?city=${targetCity}`);
      if (!res.ok) throw new Error('Failed to load city telemetry data');
      const data: CityDashboardData = await res.json();
      set({ 
        dashboardData: data, 
        isLoading: false, 
        lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: false }) 
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      set({ error: err.message || 'Server connection failed', isLoading: false });
    }
  },

  injectIncident: async (incidentPayload) => {
    const currentCity = get().selectedCity;
    try {
      const res = await fetch('/api/simulation/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: currentCity, incident: incidentPayload }),
      });
      if (!res.ok) throw new Error('Simulation request rejected by server');
      await get().fetchDashboardData(currentCity);
    } catch (err: any) {
      console.error('Failed to inject incident', err);
      set({ error: err.message || 'Failed to inject simulated incident' });
    }
  },

  resolveIncident: async (incidentId) => {
    const currentCity = get().selectedCity;
    try {
      // The city must be passed: without it the server defaults to 'singapore'
      // and silently fails to resolve incidents belonging to any other city.
      const res = await fetch(
        `/api/transportation/incidents/${incidentId}/resolve?city=${currentCity}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('Resolve request rejected by server');

      const result = await res.json();
      if (!result.success) {
        throw new Error(`Incident ${incidentId} could not be resolved`);
      }

      await get().fetchDashboardData(currentCity);
    } catch (err: any) {
      console.error('Failed to resolve incident', err);
      set({ error: err.message || 'Failed to resolve incident' });
    }
  }
}));
