/**
 * Shared API base URL for talking to the CityVerse backend.
 *
 * In local dev, VITE_API_URL is normally left blank and Vite's dev-server
 * proxy (see vite.config.ts) forwards relative `/api/...` requests to the
 * backend, so `apiUrl('/api/dashboard')` just returns '/api/dashboard'.
 *
 * In production (e.g. deployed on Vercel), there is no such proxy — the
 * built static site is served from its own domain, so a relative `/api/...`
 * request would hit Vercel itself and 404. VITE_API_URL must be set to the
 * deployed backend's URL (e.g. https://cityverse-backend.onrender.com) so
 * requests are sent to the right place.
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Prefixes a `/api/...` path with the configured backend base URL, if any. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}