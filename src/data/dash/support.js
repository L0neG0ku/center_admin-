import { dayOffset, fmtDate } from "./seed.js";

export const ticketCategories = [
  "Billing & payouts",
  "Parent app",
  "Attendance & daily care",
  "Verification & documents",
  "Account & access",
  "Something else",
];

export const ticketStatusTone = {
  Open: "amber",
  "In progress": "blue",
  "Waiting on you": "brand",
  Resolved: "green",
  Closed: "grey",
};

export const tickets = [
  {
    id: "TKT-2291",
    subject: "Payout for July hasn't reached our account",
    category: "Billing & payouts",
    status: "In progress",
    priority: "High",
    createdOn: dayOffset(-2),
    createdLabel: fmtDate(dayOffset(-2)),
    updatedLabel: "2 hours ago",
    owner: "Kribble Payments",
    thread: [
      { id: 1, from: "you", author: "Deepa Menon", at: "2 days ago", body: "Our July settlement of ₹2,84,000 hasn't landed yet. The dashboard shows it as sent on the 3rd." },
      { id: 2, from: "kribble", author: "Rohit (Kribble)", at: "1 day ago", body: "Thanks for flagging this. The transfer bounced because the account name didn't match exactly. Could you confirm the name on the account?" },
      { id: 3, from: "you", author: "Deepa Menon", at: "1 day ago", body: "It's registered as 'Little Stars Childcare LLP', not 'Little Stars Daycare'." },
      { id: 4, from: "kribble", author: "Rohit (Kribble)", at: "2 hours ago", body: "Updated on our side and re-initiated. You should see it within 48 hours." },
    ],
  },
  {
    id: "TKT-2288",
    subject: "Two parents can't see daily care updates",
    category: "Parent app",
    status: "Waiting on you",
    priority: "Medium",
    createdOn: dayOffset(-4),
    createdLabel: fmtDate(dayOffset(-4)),
    updatedLabel: "Yesterday",
    owner: "Kribble Support",
    thread: [
      { id: 1, from: "you", author: "Deepa Menon", at: "4 days ago", body: "Aarav Shah's and Diya Gupta's parents say the daily updates aren't showing in the app." },
      { id: 2, from: "kribble", author: "Sana (Kribble)", at: "Yesterday", body: "Both logs were saved as drafts rather than shared. Could you confirm the teachers tapped 'Share with parent'?" },
    ],
  },
  {
    id: "TKT-2280",
    subject: "Add a second admin account for our manager",
    category: "Account & access",
    status: "Resolved",
    priority: "Low",
    createdOn: dayOffset(-12),
    createdLabel: fmtDate(dayOffset(-12)),
    updatedLabel: "9 days ago",
    owner: "Kribble Support",
    thread: [
      { id: 1, from: "you", author: "Deepa Menon", at: "12 days ago", body: "Can we add Anita Rao as a second admin?" },
      { id: 2, from: "kribble", author: "Sana (Kribble)", at: "9 days ago", body: "Done — she can now add staff accounts from Settings." },
    ],
  },
  {
    id: "TKT-2271",
    subject: "Fire safety NOC upload keeps failing",
    category: "Verification & documents",
    status: "Closed",
    priority: "Medium",
    createdOn: dayOffset(-24),
    createdLabel: fmtDate(dayOffset(-24)),
    updatedLabel: "20 days ago",
    owner: "Kribble Verification",
    thread: [
      { id: 1, from: "you", author: "Deepa Menon", at: "24 days ago", body: "The NOC PDF is 9 MB and won't upload." },
      { id: 2, from: "kribble", author: "Verification team", at: "20 days ago", body: "We've raised the limit to 15 MB. Your document is now verified." },
    ],
  },
];

export const faqs = [
  {
    id: "faq-1",
    q: "When do parent payments reach our bank account?",
    a: "Payments collected through Kribble are settled every Tuesday and Friday, minus the platform commission on your plan. You'll see each settlement under Billing → Parent Fees with its reference number.",
  },
  {
    id: "faq-2",
    q: "Can parents see daily care updates straight away?",
    a: "Only once a teacher taps Share with parent on the day's log. Until then it stays a draft that your team can keep editing.",
  },
  {
    id: "faq-3",
    q: "How do I add a staff member to the dashboard?",
    a: "Go to Settings → Staff accounts and send an invite. They'll set their own password, and you choose whether they can see billing.",
  },
  {
    id: "faq-4",
    q: "What happens if one of our licences expires?",
    a: "Kribble warns you 30 days before the expiry date shown on your Centre Profile. If it lapses, your listing is paused for new admissions until you upload the renewal.",
  },
  {
    id: "faq-5",
    q: "Can we change our fee structure mid-term?",
    a: "Yes. Update it under Billing → Fee setup. Existing invoices keep the old amount, and parents are notified before the next cycle is generated.",
  },
  {
    id: "faq-6",
    q: "Who runs background checks on our staff?",
    a: "Kribble does, as part of verification. You don't need to upload police verification documents — our team handles it directly.",
  },
];
