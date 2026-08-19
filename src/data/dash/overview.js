import { dayOffset } from "./seed.js";

/** Topbar bell menu. */
export const notifications = [
  {
    id: "n1",
    icon: "wallet",
    title: "9 fee payments are pending",
    body: "₹1,08,500 outstanding this cycle",
    at: "20 min ago",
    to: "/dashboard/billing",
  },
  {
    id: "n2",
    icon: "userPlus",
    title: "New admission request",
    body: "Aarohi Kulkarni · Bluebells",
    at: "1 hour ago",
    to: "/dashboard/admissions",
  },
  {
    id: "n3",
    icon: "alertTriangle",
    title: "FSSAI licence expires in 24 days",
    body: "Upload the renewal to keep meals listed",
    at: "Today, 9:05 AM",
    to: "/dashboard/centre-profile",
  },
  {
    id: "n4",
    icon: "checkSquare",
    title: "Attendance not marked for Marigolds",
    body: "Ritu Bansal hasn't submitted the register",
    at: "Today, 9:40 AM",
    to: "/dashboard/attendance",
  },
];

/** Feed on the dashboard, newest first. */
export const recentActivity = [
  { id: "a1", icon: "checkSquare", tone: "green", text: "Anita Rao marked attendance for Sunflowers", at: "12 minutes ago" },
  { id: "a2", icon: "wallet", tone: "brand", text: "Payment of ₹15,000 received from Sneha Iyer", at: "38 minutes ago" },
  { id: "a3", icon: "heart", tone: "pink", text: "Daily care shared with 22 parents in Daisies", at: "1 hour ago" },
  { id: "a4", icon: "userPlus", tone: "blue", text: "New admission request from Vedant Sharma's parent", at: "2 hours ago" },
  { id: "a5", icon: "megaphone", tone: "red", text: "Emergency announcement sent to all parents", at: "3 hours ago" },
  { id: "a6", icon: "camera", tone: "amber", text: "Divya Menon uploaded 8 photos to Monsoon collage", at: "4 hours ago" },
  { id: "a7", icon: "baby", tone: "green", text: "Naisha Verma enrolled into Sunflowers", at: "Yesterday" },
];

/** Seven-day series behind the stat card sparklines. */
export const sparks = {
  enrolled: [118, 121, 122, 125, 127, 130, 132],
  present: [109, 112, 104, 118, 115, 121, 116],
  absent: [9, 7, 14, 6, 10, 5, 8],
  staff: [16, 17, 17, 16, 18, 17, 16],
  fees: [3.2, 2.8, 3.6, 2.4, 2.9, 1.8, 1.1],
};

export const pendingFeesPreview = [
  { id: "INV-7402", child: "Diya Gupta", parent: "Priya Gupta", amount: 15000, due: "Overdue by 6 days", status: "Overdue" },
  { id: "INV-7411", child: "Kabir Nair", parent: "Rahul Nair", amount: 12500, due: "Overdue by 3 days", status: "Overdue" },
  { id: "INV-7423", child: "Anaya Reddy", parent: "Kavya Reddy", amount: 15000, due: "Due in 2 days", status: "Pending" },
  { id: "INV-7430", child: "Vivaan Joshi", parent: "Amit Joshi", amount: 9500, due: "Due in 4 days", status: "Pending" },
  { id: "INV-7444", child: "Myra Desai", parent: "Nisha Desai", amount: 12500, due: "Due in 5 days", status: "Pending" },
];

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const todayLabel = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const nextWeekLabel = dayOffset(7).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
});

/**
 * Wallet summary in the topbar. Placeholder figures until the billing
 * endpoints exist — the shape mirrors what a settlements API would return.
 */
export const walletSummary = {
  balance: 248500,
  currency: "₹",
  pending: 108500,
  pendingCount: 9,
  lastPayout: { amount: 92000, at: "12 Aug" },
  nextPayout: "18 Aug",
};

/** Formats paise-free rupee amounts the way Indian users expect. */
export const formatRupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
