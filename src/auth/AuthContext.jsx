import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import * as api from "../api/endpoints.js";
import { refreshSession } from "../api/http.js";
import {
  clearTokens,
  getExpiresAt,
  hasSession,
  watchOtherTabs,
} from "../api/tokens.js";
import { REFRESH_INTERVAL_MS, REFRESH_SKEW_MS } from "../api/config.js";

const AuthContext = createContext(null);

/** The API's role enum is SHOUTY; the dashboard shows it as a label. */
const ROLE_LABELS = {
  OWNER: "Centre Owner",
  ADMIN: "Administrator",
  MANAGER: "Centre Manager",
  STAFF: "Staff",
  TEACHER: "Teacher",
  PARENT: "Parent",
};

function roleLabel(role) {
  if (!role) return "Centre Admin";
  const key = String(role).toUpperCase();
  if (ROLE_LABELS[key]) return ROLE_LABELS[key];
  // Unknown role — Title Case it rather than shouting at the user.
  return key
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Reshapes /auth/me into what the dashboard reads.
 *
 * The dashboard was built against a stubbed session ({ name, role, centre,
 * centreId }) while the API returns snake_case identity fields and no centre
 * at all. Mapping it here means every dashboard screen keeps working
 * untouched, and a missing field renders a placeholder instead of throwing —
 * a blank page is a far worse failure than a generic greeting.
 */
function normaliseUser(payload) {
  if (!payload) return null;
  const source = payload.user ?? payload;

  const centre =
    typeof source.daycare === "object" && source.daycare
      ? source.daycare
      : typeof source.centre === "object" && source.centre
        ? source.centre
        : {};

  const fullName =
    source.full_name ?? source.fullName ?? source.name ?? source.owner_name ?? "";

  const centreName =
    centre.display_name ??
    centre.legal_name ??
    centre.name ??
    (typeof source.centre === "string" ? source.centre : null) ??
    source.centre_name ??
    "your centre";

  return {
    ...source,
    name: fullName || source.email?.split("@")[0] || "there",
    email: source.email ?? "",
    avatarUrl: source.avatar_url ?? null,
    // Raw enum kept for logic; `role` is the human label the UI prints.
    roleCode: source.role ?? null,
    role: roleLabel(source.role),
    centre: centreName,
    centreId: centre.reference ?? centre.public_id ?? centre.id ?? source.centre_id ?? "",
    // /auth/me reports these; useful for deciding what to prompt for.
    hasPassword: source.has_password ?? false,
    phoneVerified: source.phone_verified ?? false,
    emailVerified: source.email_verified ?? false,
  };
}

/**
 * Builds the session the dashboard needs.
 *
 * /auth/me is identity only — it carries no centre — but the header and
 * greeting want the centre's name, so we pick that up from /daycares/me. That
 * call is best-effort: an owner mid-onboarding may not have one yet, and a
 * missing centre must never cost them the dashboard.
 */
async function loadSession(signal) {
  const options = signal ? { signal } : undefined;
  const user = normaliseUser(await api.getMe(options));
  if (!user) return null;

  try {
    const daycare = await api.getMyDaycare(options);
    if (daycare && typeof daycare === "object") {
      user.centre =
        daycare.display_name ?? daycare.legal_name ?? daycare.name ?? user.centre;
      user.centreId =
        daycare.public_id ?? daycare.reference ?? daycare.id ?? user.centreId;
      user.daycare = daycare;
    }
  } catch {
    // No centre yet, or the call failed — the placeholder name stands.
  }

  return user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until GET /auth/me settles, so guarded routes don't bounce a
  // signed-in user to the login page during the first render.
  const [status, setStatus] = useState(hasSession() ? "loading" : "anonymous");
  const timerRef = useRef(null);

  /* Restore the session on load. */
  useEffect(() => {
    if (!hasSession()) return undefined;

    const controller = new AbortController();
    (async () => {
      try {
        const next = await loadSession(controller.signal);
        setUser(next);
        setStatus(next ? "authenticated" : "anonymous");
      } catch (error) {
        if (error?.name === "AbortError") return;
        clearTokens();
        setUser(null);
        setStatus("anonymous");
      }
    })();

    return () => controller.abort();
  }, []);

  /* Silent renewal, a minute before expiry or every 15 min if the API
     doesn't tell us when the token dies. */
  useEffect(() => {
    if (status !== "authenticated") return undefined;

    const schedule = () => {
      const expiresAt = getExpiresAt();
      const delay = expiresAt
        ? Math.max(10_000, expiresAt - Date.now() - REFRESH_SKEW_MS)
        : REFRESH_INTERVAL_MS;

      timerRef.current = window.setTimeout(async () => {
        try {
          await refreshSession();
          schedule();
        } catch {
          clearTokens();
          setUser(null);
          setStatus("anonymous");
        }
      }, delay);
    };

    schedule();
    return () => window.clearTimeout(timerRef.current);
  }, [status]);

  /* Logging out in one tab logs out the rest. */
  useEffect(() => {
    const stop = watchOtherTabs();
    return stop;
  }, []);

  const signIn = useCallback(async (email, password) => {
    await api.login(email, password);
    const next = await loadSession();
    setUser(next);
    setStatus("authenticated");
    return next;
  }, []);

  /** Phone + OTP sign-in, for owners who haven't set a password yet. */
  const signInWithPhone = useCallback(async (phone, code) => {
    await api.loginWithPhone(phone, code);
    const next = await loadSession();
    setUser(next);
    setStatus("authenticated");
    return next;
  }, []);

  /** Called after signup or activation stores tokens directly. */
  const adoptSession = useCallback(async () => {
    try {
      const next = await loadSession();
      setUser(next);
      setStatus("authenticated");
      return next;
    } catch {
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    await api.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === "loading",
      signIn,
      signInWithPhone,
      signOut,
      adoptSession,
    }),
    [user, status, signIn, signInWithPhone, signOut, adoptSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/** Wraps the dashboard routes — bounces you to /login if there's no session. */
export function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-gate" role="status" aria-live="polite">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
