/**
 * useLiveRoads - polls /api/transportation/roads and returns live per-road
 * speeds keyed by road id.
 *
 * Returns an EMPTY map when there is no TomTom key or the request fails.
 * That is deliberate: TransportationMap merges this on top of CITY_ROADS,
 * so an empty map simply means "show the built-in numbers", and the UI
 * degrades silently instead of breaking.
 */

import { useEffect, useState } from 'react';
import { CityId } from '../../types';
import { apiUrl } from '../../lib/api';

export interface LiveRoadFlow {
  roadId: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  congestionIndex: number;
  travelTime: number;
  normalTravelTime: number;
  confidence: number;
}

export interface LiveRoadsState {
  /** roadId -> live reading. Empty when offline. */
  flows: Record<string, LiveRoadFlow>;
  /** True only when the server actually returned live TomTom data. */
  isLive: boolean;
  fetchedAt: string | null;
}

// The server caches for 15 minutes, so polling faster just returns the same
// cached payload. 5 minutes keeps the UI fresh without wasting requests.
const POLL_MS = 5 * 60 * 1000;

export function useLiveRoads(cityId: CityId): LiveRoadsState {
  const [state, setState] = useState<LiveRoadsState>({
    flows: {},
    isLive: false,
    fetchedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(apiUrl(`/api/transportation/roads?city=${cityId}`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const flows: Record<string, LiveRoadFlow> = {};
        for (const f of (json.roads || []) as LiveRoadFlow[]) {
          flows[f.roadId] = f;
        }
        setState({ flows, isLive: !!json.live, fetchedAt: json.fetchedAt ?? null });
      } catch {
        // Stay silent: falling back to built-in road data is a valid state,
        // not an error the user needs to see.
        if (!cancelled) setState({ flows: {}, isLive: false, fetchedAt: null });
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [cityId]);

  return state;
}