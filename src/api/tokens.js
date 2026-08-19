import { STORAGE_KEYS } from "./config.js";

/**
 * Token store.
 *
 * Kept in memory for the session and mirrored to localStorage so a refresh
 * doesn't log you out. localStorage is readable by any script on the page, so
 * an XSS bug would expose the refresh token — moving refresh to an httpOnly,
 * SameSite cookie is the stronger option if the API can set one.
 */

let access = null;
let refresh = null;
let expiresAt = 0;

const listeners = new Set();

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(value));
  } catch {
    // private mode — tokens just won't survive a reload
  }
}

/** Pull whatever survived the last page load. */
export function hydrate() {
  access = read(STORAGE_KEYS.access);
  refresh = read(STORAGE_KEYS.refresh);
  expiresAt = Number(read(STORAGE_KEYS.expiresAt)) || 0;
  return { access, refresh, expiresAt };
}

export const getAccessToken = () => access;
export const getRefreshToken = () => refresh;
export const getExpiresAt = () => expiresAt;
export const hasSession = () => Boolean(access || refresh);

/**
 * Store a token pair. Accepts the common spellings so a small difference in
 * the API response doesn't silently leave us unauthenticated.
 */
export function setTokens(payload) {
  if (!payload) return;

  const nextAccess = payload.access_token ?? payload.accessToken ?? null;
  const nextRefresh = payload.refresh_token ?? payload.refreshToken ?? refresh;
  const expiresIn = payload.expires_in ?? payload.expiresIn ?? null;

  if (nextAccess) access = nextAccess;
  if (nextRefresh) refresh = nextRefresh;
  expiresAt = expiresIn ? Date.now() + Number(expiresIn) * 1000 : 0;

  write(STORAGE_KEYS.access, access);
  write(STORAGE_KEYS.refresh, refresh);
  write(STORAGE_KEYS.expiresAt, expiresAt || null);

  listeners.forEach((fn) => fn({ access, refresh, expiresAt }));
}

export function clearTokens() {
  access = null;
  refresh = null;
  expiresAt = 0;
  write(STORAGE_KEYS.access, null);
  write(STORAGE_KEYS.refresh, null);
  write(STORAGE_KEYS.expiresAt, null);
  listeners.forEach((fn) => fn({ access: null, refresh: null, expiresAt: 0 }));
}

/** Notified whenever tokens change, including in another tab. */
export function onTokenChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Keep tabs in sync — logging out in one should log out the rest. */
export function watchOtherTabs() {
  const handler = (event) => {
    if (!event.key || !Object.values(STORAGE_KEYS).includes(event.key)) return;
    hydrate();
    listeners.forEach((fn) => fn({ access, refresh, expiresAt }));
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

hydrate();
