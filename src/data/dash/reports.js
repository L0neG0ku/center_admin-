import { classroomCounts } from "./children.js";
import { collectionLabels, collectionTrend } from "./billing.js";

export const reportRange = ["Last 7 days", "Last 30 days", "This term", "This year"];

export const attendanceTrend = {
  labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  values: [88, 91, 86, 92, 94, 91],
};

export const revenueTrend = {
  labels: collectionLabels,
  values: collectionTrend,
};

export const admissionsTrend = {
  labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  joined: [6, 9, 4, 11, 8, 12],
  left: [2, 1, 3, 2, 1, 2],
};

export const classDistribution = classroomCounts.map((room, index) => ({
  label: room.name,
  value: room.enrolled,
  color: ["#8b5cf6", "#3b82f6", "#16a34a", "#ec4899", "#f59e0b"][index],
}));

export const attendanceByClass = classroomCounts.map((room, index) => ({
  label: room.name.slice(0, 9),
  value: [94, 89, 92, 87, 91][index],
}));

export const savedReports = [
  { id: "REP-01", name: "Monthly attendance summary", type: "Attendance", period: "July 2026", generated: "1 Aug 2026", size: "48 KB" },
  { id: "REP-02", name: "Fee collection report", type: "Revenue", period: "July 2026", generated: "1 Aug 2026", size: "62 KB" },
  { id: "REP-03", name: "Admissions & withdrawals", type: "Admissions", period: "Q2 2026", generated: "3 Jul 2026", size: "31 KB" },
  { id: "REP-04", name: "Class-wise attendance", type: "Attendance", period: "June 2026", generated: "2 Jul 2026", size: "44 KB" },
  { id: "REP-05", name: "Outstanding dues ageing", type: "Revenue", period: "June 2026", generated: "2 Jul 2026", size: "28 KB" },
];

export const reportTypeTone = {
  Attendance: "green",
  Revenue: "brand",
  Admissions: "blue",
};
