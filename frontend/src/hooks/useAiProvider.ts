import { useEffect, useState } from 'react';

export interface AiProviderInfo {
  provider: string;
  label: string;
  model: string;
  live: boolean;
}

const FALLBACK: AiProviderInfo = {
  provider: 'none',
  label: 'Offline Briefing Engine',
  model: 'offline-briefing-engine',
  live: false,
};

/**
 * Reports which AI provider/model the server is actually running.
 * Replaces the previously hardcoded vendor labels in the UI.
 */
export function useAiProvider(): AiProviderInfo {
  const [info, setInfo] = useState<AiProviderInfo>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/ai/info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setInfo(data as AiProviderInfo);
      })
      .catch(() => {
        /* keep fallback */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
