import { API_BASE_URL } from "./config.js";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokens.js";

/**
 * One error type for the whole API surface, so callers can branch on `status`
 * and show `message` without unwrapping a different shape per endpoint.
 *
 * `fields` carries per-field validation errors (422) and `missing` carries the
 * submit endpoint's list of what's still outstanding.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code, fields, missing, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields || null;
    this.missing = missing || null;
    this.body = body;
  }

  get isAuth() {
    return this.status === 401 || this.status === 403;
  }
  get isValidation() {
    return this.status === 422 || this.status === 400;
  }
  get isOffline() {
    return this.status === 0;
  }
}

/** The field a FastAPI validation entry refers to: last non-"body" loc part. */
function locToField(loc) {
  if (!Array.isArray(loc)) return null;
  const parts = loc.filter((part) => part !== "body" && part !== "query");
  return parts.length ? String(parts[parts.length - 1]) : null;
}

/**
 * Pulls a usable message out of whatever the server sent back.
 *
 * Handles the shapes we actually see: a bare string, {message}, {detail} as a
 * string, {detail} as FastAPI's array of validation entries, and {error} or
 * {detail} as a nested object. Only falls back to a generic line when the
 * response genuinely carries no message — otherwise the user would see the
 * same text for a wrong code, an expired code and a rate limit.
 */
function messageFrom(body, status) {
  if (typeof body === "string" && body.trim()) return body.trim();

  if (body && typeof body === "object") {
    const candidates = [body.message, body.detail, body.error, body.error_description];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();

      // FastAPI validation: [{ loc, msg, type }, ...]
      if (Array.isArray(candidate) && candidate.length) {
        const parts = candidate
          .map((entry) => {
            if (typeof entry === "string") return entry;
            const field = locToField(entry?.loc);
            const msg = entry?.msg || entry?.message;
            if (!msg) return null;
            return field ? `${field}: ${msg}` : msg;
          })
          .filter(Boolean);
        if (parts.length) return parts.join(". ");
      }

      if (candidate && typeof candidate === "object") {
        const nested = candidate.message || candidate.detail || candidate.msg;
        if (typeof nested === "string" && nested.trim()) return nested.trim();
      }
    }
  }

  if (status === 0) return "Can't reach the server. Check your connection.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return `Request failed (${status}).`;
}

/** Field-level validation errors, tolerating the shapes we might get. */
function fieldsFrom(body) {
  if (!body || typeof body !== "object") return null;

  // FastAPI's 422 shape.
  if (Array.isArray(body.detail)) {
    const mapped = {};
    body.detail.forEach((entry) => {
      const field = locToField(entry?.loc);
      const msg = entry?.msg || entry?.message;
      if (field && msg && !mapped[field]) mapped[field] = msg;
    });
    if (Object.keys(mapped).length) return mapped;
  }

  const raw = body.errors || body.field_errors || body.fieldErrors;
  if (!raw || typeof raw !== "object") return null;

  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : String(value),
    ])
  );
}

async function parse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  try {
    return type.includes("json") ? await response.json() : await response.text();
  } catch {
    return null;
  }
}

/* ---------- refresh, de-duplicated ---------- */

let refreshInFlight = null;

/**
 * Swaps the refresh token for a new pair. Concurrent callers share one request
 * so a burst of 401s doesn't fire a burst of refreshes.
 */
export function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  const token = getRefreshToken();
  if (!token) return Promise.reject(new ApiError("Session expired.", { status: 401 }));

  refreshInFlight = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: token }),
    });

    const body = await parse(response);
    if (!response.ok) {
      clearTokens();
      throw new ApiError(messageFrom(body, response.status), {
        status: response.status,
        body,
      });
    }

    const data = unwrap(body);
    setTokens(data);
    return data;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * The one place requests go through.
 *
 * - prefixes the base URL
 * - attaches the bearer token unless `auth: false`
 * - on a 401, refreshes once and replays the request
 * - throws ApiError for anything non-2xx
 */
export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    signal,
    headers: extraHeaders,
    _retried = false,
  } = options;

  const headers = { Accept: "application/json", ...extraHeaders };
  let payload;

  if (body instanceof FormData) {
    payload = body; // let the browser set the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: payload,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("Can't reach the server. Check your connection.", { status: 0 });
  }

  if (response.status === 401 && auth && !_retried && getRefreshToken()) {
    try {
      await refreshSession();
      return request(path, { ...options, _retried: true });
    } catch {
      clearTokens();
    }
  }

  const parsed = await parse(response);

  if (!response.ok) {
    throw new ApiError(messageFrom(parsed, response.status), {
      status: response.status,
      // Errors arrive as { success: false, error: { code, message } }, so the
      // code sits one level in — reading parsed.code left it always undefined.
      code: parsed?.error?.code ?? parsed?.code,
      fields: fieldsFrom(parsed),
      missing: parsed?.missing || null,
      body: parsed,
    });
  }

  return unwrap(parsed);
}

/**
 * Every successful API response is `{ success: true, data: ... }`, and list
 * endpoints add `{ meta: {...} }` alongside. Callers only ever want the
 * payload, so we strip the envelope here — once — rather than making every
 * call site remember to write `.data`.
 *
 * Pagination is preserved by hanging `meta` off the returned value, so a list
 * response still reads as a plain array.
 */
function unwrap(parsed) {
  if (!parsed || typeof parsed !== "object" || !("data" in parsed)) return parsed;
  if (parsed.success !== true) return parsed;

  const { data, meta } = parsed;
  if (meta && data && typeof data === "object") {
    try {
      Object.defineProperty(data, "meta", { value: meta, enumerable: false });
    } catch {
      // frozen or primitive — pagination just isn't available, not fatal
    }
  }
  return data;
}

export const get = (path, options) => request(path, { ...options, method: "GET" });
export const post = (path, body, options) => request(path, { ...options, method: "POST", body });
export const patch = (path, body, options) => request(path, { ...options, method: "PATCH", body });
export const del = (path, options) => request(path, { ...options, method: "DELETE" });
