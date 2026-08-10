import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const SESSION_KEY = "kribble.session";

const AuthContext = createContext(null);

/** Reads the stored session. No backend yet — this only remembers who "logged in". */
function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const signIn = useCallback((email) => {
    // Stands in for the real sign-in response once the backend exists.
    const next = {
      email,
      name: "Priya Shah",
      role: "Centre Admin",
      centre: "Little Stars Daycare",
      centreId: "DC-1254",
    };
    setUser(next);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // private mode — session just won't survive a refresh
    }
    return next;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/** Wraps the dashboard routes — bounces you to /login if there's no session. */
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
