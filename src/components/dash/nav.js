/**
 * Sidebar layout for the daycare portal. Grouped so the 14 sections don't
 * read as one long undifferentiated list.
 */
export const navGroups = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: "grid", to: "/dashboard" }],
  },
  {
    id: "care",
    label: "Children & care",
    items: [
      { id: "children", label: "Children", icon: "baby", to: "/dashboard/children" },
      { id: "attendance", label: "Attendance", icon: "checkSquare", to: "/dashboard/attendance" },
      { id: "daily-care", label: "Daily Care", icon: "heart", to: "/dashboard/daily-care" },
      { id: "meal-schedule", label: "Mealtimes", icon: "utensils", to: "/dashboard/meal-schedule" },
      { id: "medicine", label: "Medicine", icon: "heart", to: "/dashboard/medicine" },
      { id: "incidents", label: "Incidents", icon: "alertTriangle", to: "/dashboard/incidents" },
      { id: "emergencies", label: "Emergencies", icon: "shield", to: "/dashboard/emergencies" },
      { id: "activities", label: "Activities", icon: "palette", to: "/dashboard/activities" },
      { id: "observations", label: "Observations", icon: "bookOpen", to: "/dashboard/observations" },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { id: "admissions", label: "Admissions", icon: "userPlus", to: "/dashboard/admissions" },
      { id: "staff", label: "Staff", icon: "users", to: "/dashboard/staff" },
      { id: "billing", label: "Billing", icon: "wallet", to: "/dashboard/billing" },
    ],
  },
  {
    id: "comms",
    label: "Communication",
    items: [
      { id: "announcements", label: "Announcements", icon: "megaphone", to: "/dashboard/announcements" },
      { id: "calendar", label: "Calendar", icon: "calendar", to: "/dashboard/calendar" },
      { id: "meetings", label: "Meetings", icon: "message", to: "/dashboard/meetings" },
    ],
  },
  {
    id: "insight",
    label: "Insights",
    items: [{ id: "reports", label: "Reports", icon: "barChart", to: "/dashboard/reports" }],
  },
  {
    id: "centre",
    label: "Your centre",
    items: [
      { id: "profile", label: "Centre Profile", icon: "building", to: "/dashboard/centre-profile" },
      { id: "support", label: "Support", icon: "headset", to: "/dashboard/support" },
      { id: "settings", label: "Settings", icon: "settings", to: "/dashboard/settings" },
    ],
  },
];

/** Shown in the topbar "Quick Actions" menu — mirrors the dashboard tiles. */
export const quickActions = [
  {
    id: "attendance",
    icon: "checkSquare",
    label: "Take attendance",
    body: "Mark today's register for every classroom.",
    to: "/dashboard/attendance",
  },
  {
    id: "child",
    icon: "userPlus",
    label: "Add a child",
    body: "Enrol a child and capture parent details.",
    to: "/dashboard/children?new=1",
  },
  {
    id: "announce",
    icon: "megaphone",
    label: "Send an announcement",
    body: "Push a notice to every parent instantly.",
    to: "/dashboard/announcements?new=1",
  },
  {
    id: "invoice",
    icon: "receipt",
    label: "Record a payment",
    body: "Log a fee payment and issue a receipt.",
    to: "/dashboard/billing",
  },
];
