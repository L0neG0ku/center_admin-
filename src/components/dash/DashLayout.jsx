import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { ToastProvider } from "./Toast.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import "../../styles/dash-shell.css";
import "../../styles/dash-ui.css";
import "../../styles/dash-pages.css";

export default function DashLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // `mini` is the desktop rail; `open` is the mobile off-canvas drawer.
  const [mini, setMini] = useState(false);
  const [open, setOpen] = useState(false);

  // Scroll to the top on every route change. The mobile drawer closes itself
  // through the nav links' onNavigate handler, so it stays out of this effect.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const handleSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <ToastProvider>
      <div className={`dash ${mini ? "is-mini" : ""} ${open ? "is-open" : ""}`.trim()}>
        <Sidebar
          mini={mini}
          user={user}
          onToggleMini={() => setMini((value) => !value)}
          onNavigate={() => setOpen(false)}
        />

        <div className="dash__scrim" onClick={() => setOpen(false)} />

        <div className="dash__main">
          <Topbar user={user} onSignOut={handleSignOut} onBurger={() => setOpen((value) => !value)} />
          <div className="dash__view">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
