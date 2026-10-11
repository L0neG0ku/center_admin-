import { Route, Routes } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout/SiteLayout.jsx";
import Home from "./pages/Home/Home.jsx";
import Demo from "./pages/Demo/Demo.jsx";
import Signup from "./pages/Signup/Signup.jsx";
import Login from "./pages/Login/Login.jsx";
import Activate from "./pages/Activate/Activate.jsx";
import Status from "./pages/Status/Status.jsx";
import ComingSoon from "./pages/ComingSoon/ComingSoon.jsx";
import { RequireAuth } from "./auth/AuthContext.jsx";
import DashLayout from "./components/dash/DashLayout.jsx";
import Overview from "./pages/dashboard/Overview.jsx";
import Children from "./pages/dashboard/Children.jsx";
import Attendance from "./pages/dashboard/Attendance.jsx";
import Incidents from "./pages/dashboard/Incidents.jsx";
import Emergencies from "./pages/dashboard/Emergencies.jsx";
import Meetings from "./pages/dashboard/Meetings.jsx";
import DailyCare from "./pages/dashboard/DailyCare.jsx";
import Activities from "./pages/dashboard/Activities.jsx";
import Staff from "./pages/dashboard/Staff.jsx";
import Admissions from "./pages/dashboard/Admissions.jsx";
import Billing from "./pages/dashboard/Billing.jsx";
import Announcements from "./pages/dashboard/Announcements.jsx";
import CalendarPage from "./pages/dashboard/CalendarPage.jsx";
import Reports from "./pages/dashboard/Reports.jsx";
import Support from "./pages/dashboard/Support.jsx";
import CentreProfile from "./pages/dashboard/CentreProfile.jsx";
import Settings from "./pages/dashboard/Settings.jsx";
import Medicine from "./pages/dashboard/Medicine.jsx";
import "./App.css";

/**
 * Built in stages. Signup and login sit outside the marketing layout because
 * they're full-page flows with no site header. The dashboard is its own shell,
 * gated behind a login, and lives entirely under /dashboard.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/activate" element={<Activate />} />

      {/* Where an owner lands after signing in: verified, in the queue, or
          asked for changes. Gated so a signed-out visitor cannot see it. */}
      <Route
        path="/status"
        element={
          <RequireAuth>
            <Status />
          </RequireAuth>
        }
      />

      {/* Daycare dashboard — you land here after logging in. */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Overview />} />
        <Route path="children" element={<Children />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="emergencies" element={<Emergencies />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="daily-care" element={<DailyCare />} />
        <Route path="activities" element={<Activities />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="staff" element={<Staff />} />
        <Route path="billing" element={<Billing />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="support" element={<Support />} />
        <Route path="centre-profile" element={<CentreProfile />} />
        <Route path="medicine" element={<Medicine />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="demo" element={<Demo />} />

        <Route path="features" element={<ComingSoon title="Features" />} />
        <Route path="workflow" element={<ComingSoon title="Workflow" />} />
        <Route path="pricing" element={<ComingSoon title="Pricing" />} />
        <Route path="about" element={<ComingSoon title="About Us" />} />
        <Route path="contact" element={<ComingSoon title="Contact" />} />
        <Route path="terms" element={<ComingSoon title="Terms of Service" />} />
        <Route path="privacy" element={<ComingSoon title="Privacy Policy" />} />
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Route>
    </Routes>
  );
}
