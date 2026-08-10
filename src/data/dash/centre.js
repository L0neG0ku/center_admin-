import { dayOffset, fmtDate } from "./seed.js";

export const centre = {
  name: "Little Stars Daycare",
  legalName: "Little Stars Childcare LLP",
  id: "DC-1254",
  type: "Preschool + Daycare",
  ownership: "Independent",
  status: "Verified",
  joinedOn: fmtDate(dayOffset(-243)),
  owner: "Priya Shah",
  manager: "Deepa Menon",
  email: "hello@littlestars.in",
  phone: "+91 98765 43210",
  address: "42, 3rd Cross, Jubilee Hills, Hyderabad, Telangana – 500033",
  area: "Jubilee Hills",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500033",
  capacity: 150,
  enrolled: 132,
  staffCount: 18,
  rating: 4.7,
  reviews: 86,
  listingViews: 1284,
};

export const openingHours = [
  { day: "Monday", from: "8:00 AM", to: "6:30 PM", closed: false },
  { day: "Tuesday", from: "8:00 AM", to: "6:30 PM", closed: false },
  { day: "Wednesday", from: "8:00 AM", to: "6:30 PM", closed: false },
  { day: "Thursday", from: "8:00 AM", to: "6:30 PM", closed: false },
  { day: "Friday", from: "8:00 AM", to: "6:30 PM", closed: false },
  { day: "Saturday", from: "9:00 AM", to: "1:30 PM", closed: false },
  { day: "Sunday", from: "—", to: "—", closed: true },
];

export const facilities = [
  { id: "meals", label: "Meals served", on: true, icon: "utensils" },
  { id: "cctv", label: "CCTV monitored", on: true, icon: "shield" },
  { id: "nap", label: "Dedicated nap rooms", on: true, icon: "moon" },
  { id: "outdoor", label: "Outdoor play area", on: true, icon: "sun" },
  { id: "nurse", label: "Nurse on site", on: true, icon: "heart" },
  { id: "transport", label: "Transport", on: false, icon: "home" },
  { id: "ac", label: "Air-conditioned rooms", on: true, icon: "sparkle" },
  { id: "backup", label: "Power backup", on: true, icon: "zap" },
];

export const centrePhotos = [
  { id: "exterior", label: "Exterior / entrance", count: 3, tone: "brand" },
  { id: "classroom", label: "Classrooms", count: 6, tone: "blue" },
  { id: "play", label: "Play area", count: 4, tone: "green" },
  { id: "nap", label: "Nap room", count: 2, tone: "pink" },
  { id: "kitchen", label: "Kitchen", count: 2, tone: "amber" },
  { id: "washroom", label: "Washrooms", count: 1, tone: "grey" },
];

export const licences = [
  { id: "pan", name: "PAN Card", status: "Verified", expiry: "—", note: "Business PAN" },
  { id: "registration", name: "Shops & Establishment", status: "Verified", expiry: fmtDate(dayOffset(310)), note: "Gumasta licence" },
  { id: "gst", name: "GST Certificate", status: "Verified", expiry: "—", note: "27AAECL1234K1ZV" },
  { id: "fssai", name: "FSSAI Licence", status: "Expiring soon", expiry: fmtDate(dayOffset(24)), note: "Renew before expiry to keep meals listed" },
  { id: "fire", name: "Fire Safety NOC", status: "Verified", expiry: fmtDate(dayOffset(420)), note: "" },
  { id: "bank", name: "Bank account", status: "Verified", expiry: "—", note: "HDFC •••• 4471" },
];

export const licenceTone = {
  Verified: "green",
  "Expiring soon": "amber",
  Pending: "blue",
  Expired: "red",
};

export const verificationTimeline = [
  { id: "submitted", title: "Application submitted", body: "Centre details, documents and photos received.", on: fmtDate(dayOffset(-250)), done: true },
  { id: "call", title: "Executive call", body: "Fees, timings and capacity confirmed over the phone.", on: fmtDate(dayOffset(-248)), done: true },
  { id: "visit", title: "Physical inspection", body: "Kribble executive visited and photographed the centre.", on: fmtDate(dayOffset(-245)), done: true },
  { id: "docs", title: "Documents & bank verified", body: "₹1 penny-drop matched the account name.", on: fmtDate(dayOffset(-244)), done: true },
  { id: "staff", title: "Staff background checks", body: "17 of 18 staff cleared. Farhan Ali is in progress.", on: "In progress", done: false },
  { id: "live", title: "Listing live", body: "Verified badge issued and visible to parents.", on: fmtDate(dayOffset(-243)), done: true },
];
