import { children } from "./children.js";
import { dayOffset, fmtDate } from "./seed.js";

const methods = ["UPI", "Card", "Bank transfer", "Cash"];

/** One invoice per child for the current month. */
export const invoices = children
  .filter((child) => child.status !== "Graduating")
  .slice(0, 74)
  .map((child, index) => {
    const roll = index % 9;
    const status = roll === 2 ? "Pending" : roll === 5 ? "Overdue" : "Paid";
    const due = dayOffset(status === "Overdue" ? -(6 + (index % 9)) : 5 - (index % 4));

    return {
      id: `INV-${7400 + index}`,
      childId: child.id,
      child: child.name,
      parent: child.guardian,
      classroom: child.classroom,
      plan: child.feePlan,
      amount: child.monthlyFee,
      period: "August 2026",
      status,
      dueOn: due,
      dueLabel: fmtDate(due),
      paidOn: status === "Paid" ? fmtDate(dayOffset(-(index % 12) - 1)) : "—",
      method: status === "Paid" ? methods[index % methods.length] : "—",
      reminders: status === "Paid" ? 0 : (index % 3) + 1,
    };
  });

export const billingSummary = invoices.reduce(
  (totals, invoice) => {
    totals.billed += invoice.amount;
    if (invoice.status === "Paid") totals.collected += invoice.amount;
    if (invoice.status === "Pending") {
      totals.pending += invoice.amount;
      totals.pendingCount += 1;
    }
    if (invoice.status === "Overdue") {
      totals.overdue += invoice.amount;
      totals.overdueCount += 1;
    }
    return totals;
  },
  { billed: 0, collected: 0, pending: 0, overdue: 0, pendingCount: 0, overdueCount: 0 }
);

export const invoiceStatusTone = {
  Paid: "green",
  Pending: "amber",
  Overdue: "red",
};

/** Fee structure the centre publishes to parents. */
export const feePlans = [
  { id: "full", name: "Full-day", monthly: 15000, note: "8:00 AM – 6:30 PM, meals included", children: 78 },
  { id: "half", name: "Half-day", monthly: 9500, note: "8:00 AM – 1:30 PM, breakfast + lunch", children: 41 },
  { id: "extended", name: "Extended care", monthly: 3000, note: "Add-on, 6:30 PM – 8:00 PM", children: 9 },
  { id: "admission", name: "Admission fee", monthly: 20000, note: "One-time, charged at enrolment", children: 0 },
];

export const collectionTrend = [
  8.4, 9.1, 8.8, 9.6, 10.2, 9.9, 11.1, 10.8, 11.6, 12.2, 11.9, 12.8,
];

export const collectionLabels = [
  "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
];

/** What the centre pays Kribble — the second money flow. */
export const kribblePlan = {
  name: "Growth",
  price: 4999,
  cycle: "per month",
  renewsOn: fmtDate(dayOffset(19)),
  status: "Active",
  seats: "Up to 150 children",
  commission: "2% on parent payments collected through Kribble",
  features: [
    "Unlimited staff accounts",
    "Parent app for every enrolled family",
    "Attendance, daily care and billing",
    "Listing on the Kribble parent marketplace",
    "Priority partner support",
  ],
  history: [
    { id: "KIN-8801", period: "August 2026", amount: 4999, status: "Paid", on: fmtDate(dayOffset(-11)) },
    { id: "KIN-8702", period: "July 2026", amount: 4999, status: "Paid", on: fmtDate(dayOffset(-41)) },
    { id: "KIN-8603", period: "June 2026", amount: 4999, status: "Paid", on: fmtDate(dayOffset(-72)) },
    { id: "KIN-8504", period: "May 2026", amount: 3999, status: "Paid", on: fmtDate(dayOffset(-103)) },
  ],
};
