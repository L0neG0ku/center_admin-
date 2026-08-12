/**
 * Onboarding spec, taken from the centre-onboarding workflow sheet.
 * Answers in the Centre step decide which documents appear later, so the
 * conditional rules live here rather than being scattered through the UI.
 */
export const signupSteps = [
  { id: "centre", label: "Centre Details", icon: "building" },
  { id: "documents", label: "Documents", icon: "fileCheck" },
  { id: "photos", label: "Photos", icon: "image" },
  { id: "review", label: "Review", icon: "clipboard" },
  { id: "agreement", label: "Agreement", icon: "pencil" },
];

export const brandFeatures = [
  {
    id: "manage",
    icon: "users",
    title: "Easy Management",
    body: "Manage children, staff, attendance and more in one place.",
  },
  {
    id: "communicate",
    icon: "message",
    title: "Parent Communication",
    body: "Stay connected with parents through updates and messages.",
  },
  {
    id: "insights",
    icon: "barChart",
    title: "Smart Insights",
    body: "Get real-time reports and insights to grow your daycare.",
  },
];

export const centreTypes = ["Daycare", "Preschool", "Both"];
export const ownershipTypes = ["Independent", "Franchise"];
export const yesNo = ["Yes", "No"];
export const preschoolSlotOptions = ["1 shift", "2 shifts"];

/** Preschool / Both — teaching approach. Multi-select; "Other" reveals a text box. */
export const curriculumOptions = [
  "Play-based / Play-way",
  "Montessori",
  "Theme-based / Multiple Intelligence",
  "Traditional / Academic (reading, writing, numbers)",
  "NEP 2020 / Foundational Stage aligned",
  "Reggio Emilia",
  "Waldorf / Steiner",
  "HighScope",
  "Our own / Proprietary curriculum",
  "Other",
];

/** Multi-select; "Others" reveals a text box to name the language. */
export const primaryLanguages = ["English", "Hindi", "Others"];

/** Preschool teacher-to-child ratios. "Other" reveals a 1:[ ] input. */
export const preschoolRatios = ["1:8", "1:10", "1:12", "1:15", "1:20", "Other"];

/** Daycare caregiver-to-child ratios. "Other" reveals a 1:[ ] input. */
export const daycareRatios = ["1:1", "1:2", "1:4", "1:6", "1:8", "Other"];

export const ageGroups = [
  "Infants (0-1 yr)",
  "Toddlers (1-2 yrs)",
  "Early years (2-3 yrs)",
  "Nursery (3-4 yrs)",
  "LKG (4-5 yrs)",
  "UKG (5-6 yrs)",
  "After-school (6+ yrs)",
];

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const indianStates = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** Upload any ONE of these as proof the business exists. */
export const businessProofTypes = [
  "Shops & Establishment / Gumasta",
  "Trade Licence",
  "Udyam / MSME",
  "GST Registration",
  "Incorporation Certificate",
  "Partnership Deed",
  "Trust Deed",
];

export const photoCategories = [
  { id: "exterior", label: "Exterior / entrance" },
  { id: "classroom", label: "Classroom" },
  { id: "play", label: "Play area" },
  { id: "washroom", label: "Washroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "nap", label: "Daycare / nap room", onlyIf: "daycare" },
];

/**
 * Which documents to ask for, given the answers from the Centre step.
 * `required` drives validation; the rest are shown as optional.
 */
export function documentsFor({ centreType, meals, ownership, gstExempt }) {
  const documents = [
    {
      id: "pan",
      label: "PAN Card",
      note: "Business PAN, or the owner's PAN",
      required: true,
    },
    {
      id: "registration",
      label: "Business Registration Proof",
      note: "Upload any one of the options above",
      required: true,
      withPicker: true,
    },
  ];

  documents.push({
    id: "gst",
    label: "GST Certificate",
    note: gstExempt ? "Not needed — you marked the centre GST-exempt" : "Required unless the centre is GST-exempt",
    required: !gstExempt,
    disabled: gstExempt,
  });

  if (meals === "Yes") {
    documents.push({
      id: "fssai",
      label: "FSSAI Licence",
      note: "Required because meals are served at the centre",
      required: true,
    });
  }

  if (ownership === "Franchise") {
    documents.push({
      id: "franchise",
      label: "Franchise Agreement",
      note: "Required for franchise-operated centres",
      required: true,
    });
  }

  documents.push({
    id: "fire",
    label: "Fire Safety NOC",
    note: "Optional for now — you can add it later",
    required: false,
  });

  // Kept last so the conditional documents sit together above it.
  return documents.map((doc) => ({ ...doc, centreType }));
}

export const agreementTerms = [
  "Kribble lists your centre so parents can discover, enquire and enrol. You keep full control over your fees, timings, admissions and day-to-day operations.",
  "You confirm that the details, documents and photos you have submitted are accurate and belong to this centre, and that you are authorised to register it on Kribble.",
  "Before your centre goes live, a Kribble executive will call you to confirm fees and details, visit the centre in person, verify your documents and bank account, and run background checks on your staff.",
  "Parent payments collected through Kribble are settled to the verified bank account you provide, after deduction of the agreed platform commission. Payout timelines are shared during the executive call.",
  "You agree to keep your listing accurate — capacity, timings, fees and photos — and to inform Kribble of any change of ownership, address or licensing status.",
  "Either party may end this arrangement with notice. Kribble may suspend a listing if a centre's licences lapse, if verification fails, or if a serious safety concern is raised.",
  "This is a placeholder of the partner agreement. The final wording will be shared before your centre goes live.",
];

export const verificationStages = [
  {
    id: "call",
    icon: "phone",
    title: "Executive call",
    body: "We ring you to confirm your fees, timings and the details you submitted.",
  },
  {
    id: "inspection",
    icon: "home",
    title: "Physical inspection",
    body: "A Kribble executive visits the centre in person.",
  },
  {
    id: "checks",
    icon: "shieldCheck",
    title: "Document & bank check",
    body: "We verify your documents and send ₹1 to confirm the bank account.",
  },
  {
    id: "staff",
    icon: "users",
    title: "Staff background checks",
    body: "Kribble runs these itself — you don't need to upload anything.",
  },
];

export const goLiveOutcomes = [
  "Verified badge issued on your profile",
  "Listing published for parents to discover",
  "Dashboard access for your centre",
];
