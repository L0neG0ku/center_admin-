import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SiteHeader from "../SiteHeader/SiteHeader.jsx";
import "./SiteLayout.css";

export default function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="site">
      <SiteHeader />
      <main className="site__main">
        <Outlet />
      </main>
    </div>
  );
}
