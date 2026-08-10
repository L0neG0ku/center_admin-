import { children } from "./children.js";
import { dayOffset, fmtShort } from "./seed.js";

const checkInTimes = ["8:42 AM", "8:55 AM", "9:02 AM", "9:10 AM", "8:35 AM", "9:18 AM"];
const checkOutTimes = ["4:30 PM", "5:05 PM", "5:40 PM", "6:10 PM", "4:55 PM"];
const pickupPeople = ["Mother", "Father", "Grandmother", "Authorised driver", "Grandfather"];
const absenceReasons = ["Unwell", "Family function", "Travelling", "Doctor visit", "Not informed"];

/**
 * Today's register. Built from the roster so the two always agree.
 * `late` means arrived after the 9:15 cut-off.
 */
export const todayRegister = children
  .filter((child) => child.status !== "Graduating")
  .map((child, index) => {
    const roll = index % 13;
    const status =
      child.status === "On leave" ? "On leave" : roll === 3 ? "Absent" : roll === 8 ? "Late" : "Present";

    const present = status === "Present" || status === "Late";

    return {
      id: child.id,
      childId: child.id,
      name: child.name,
      classroom: child.classroom,
      classroomId: child.classroomId,
      status,
      checkIn: present ? (status === "Late" ? "9:34 AM" : checkInTimes[index % checkInTimes.length]) : "—",
      checkOut: present && index % 5 === 0 ? checkOutTimes[index % checkOutTimes.length] : "—",
      earlyPickup: present && index % 19 === 0,
      pickedBy: present ? pickupPeople[index % pickupPeople.length] : "—",
      note: status === "Absent" ? absenceReasons[index % absenceReasons.length] : "",
    };
  });

export const attendanceCounts = todayRegister.reduce(
  (totals, record) => {
    const key = record.status.toLowerCase().replace(" ", "");
    totals[key] = (totals[key] || 0) + 1;
    totals.total += 1;
    return totals;
  },
  { total: 0, present: 0, absent: 0, late: 0, onleave: 0 }
);

export const attendanceStatusTone = {
  Present: "green",
  Late: "amber",
  Absent: "red",
  "On leave": "blue",
};

/** Last 7 days, oldest first — feeds the weekly bar chart. */
export const weeklyAttendance = Array.from({ length: 7 }, (_, index) => {
  const date = dayOffset(index - 6);
  const weekend = date.getDay() === 0;
  return {
    label: date.toLocaleDateString("en-IN", { weekday: "short" }),
    value: weekend ? 0 : 104 + ((index * 7) % 18),
    date: fmtShort(date),
  };
});

/** Month-to-date summary rows for the history tab. */
export const monthlySummary = Array.from({ length: 22 }, (_, index) => {
  const date = dayOffset(-index);
  const total = 128;
  const absent = 4 + ((index * 3) % 9);
  const late = (index * 2) % 6;
  return {
    id: date.toISOString().slice(0, 10),
    dateLabel: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" }),
    present: total - absent,
    absent,
    late,
    rate: Math.round(((total - absent) / total) * 100),
  };
}).filter((row) => !row.id.endsWith("00"));
