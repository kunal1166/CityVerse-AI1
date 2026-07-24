import { RoadIncident, SeverityLevel } from '../../types';

export type RoadType = 
  | 'Highway' 
  | 'Primary' 
  | 'Secondary' 
  | 'Residential' 
  | 'Emergency' 
  | 'Bus Route' 
  | 'Construction';

export interface RoadSegment {
  id: string;
  name: string;
  code: string;
  district: string;
  roadType?: RoadType;
  currentSpeed: number; // km/h
  avgSpeed: number; // km/h
  speedLimit: number; // km/h
  vehicleCount: number; // veh/hr
  congestionIndex: number; // 0-100%
  travelTime: number; // minutes
  normalTravelTime: number; // minutes
  density: 'Fluid' | 'Moderate' | 'Heavy' | 'Gridlock';
  coordinates: [number, number][];
  signalStatus: 'Green Split 65%' | 'Adaptive Sync' | 'Hold Phase' | 'Manual Override';
  signalHealth: number; // %
  alternativeRouteName: string;
  alternativeRouteTime: number; // minutes
  aiExplanation: string;
  estimatedRecovery: string;
  cameraSnapshotUrl?: string;
  hasIncident?: boolean;
}

export interface TrafficCamera {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  status: 'Online' | 'Recording' | 'Maintenance' | 'Offline';
  fps: number;
  aiVehicleCount: number;
  averageSpeedDetected: number;
  snapshotTime: string;
  feedUrl?: string;
}

export interface SignalController {
  id: string;
  junctionName: string;
  coordinates: [number, number];
  currentPhase: 'North-South Green' | 'East-West Green' | 'All Red Emergency' | 'Pedestrian Crossing';
  cycleLengthSec: number;
  greenDurationSec: number;
  mode: 'Adaptive AI' | 'Fixed Time' | 'Manual Override' | 'Emergency Priority';
  health: number; // %
}

export type ScenarioType = 
  | 'none'
  | 'accident'
  | 'heavy_rain'
  | 'road_closure'
  | 'festival'
  | 'metro_delay'
  | 'vip_movement'
  | 'construction';

export interface ScenarioConfig {
  id: ScenarioType;
  title: string;
  description: string;
  iconName: string;
  severity: SeverityLevel;
  affectedRoads: string[];
  impactSummary: string;
  aiActionPlan: string;
  addedCongestionIndex: number;
  speedReductionKm: number;
}

export interface RouteOption {
  id: string;
  name: string;
  distanceKm: number;
  durationMin: number;
  congestionLevel: 'Low' | 'Moderate' | 'High';
  tollsCost: string;
  viaRoads: string[];
  aiReasoning: string;
  isRecommended: boolean;
}
