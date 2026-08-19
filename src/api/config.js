/**
 * Dev goes through the Vite proxy (see vite.config.js) so there's no CORS
 * preflight against the API from localhost. Production calls it directly.
 * Override either with VITE_API_BASE_URL in .env.local.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api/v1" : "https://api.kribblecare.com/v1");

/** Access token is refreshed this long before it actually expires. */
export const REFRESH_SKEW_MS = 60_000;

/** Fallback cadence for silent refresh when the API doesn't tell us expiry. */
export const REFRESH_INTERVAL_MS = 15 * 60_000;

export const STORAGE_KEYS = {
  access: "kribble.auth.access",
  refresh: "kribble.auth.refresh",
  expiresAt: "kribble.auth.expiresAt",
};
