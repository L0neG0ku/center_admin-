/**
 * ============================================================================
 * FORM STATE  <->  API CONTRACT
 * ============================================================================
 *
 * Verified against the live backend schema, not inferred. Local form state is
 * camelCase (see pages/Signup/Signup.jsx `blank`); the wire format is
 * snake_case.
 *
 * Four things are NOT one-to-one, and they are the reason this file exists
 * rather than a plain rename table:
 *
 *   1. Money   — the form collects rupees, the API stores paise (x100).
 *   2. Ratios  — the form has a chip ("1:12") plus an "Other" box; the API
 *                stores just the child count as an integer.
 *   3. Choice + Other — curriculum and languages are one array on the wire;
 *                free text is simply another entry in it.
 *   4. Empties — an empty string must be OMITTED, never sent. The API
 *                validates enums and patterns, and "" fails both.
 */

/**
 * The signup UI identifies documents and photo slots by lowercase local ids
 * ("pan", "exterior"); the API uses enum values ("PAN", "EXTERIOR").
 */
const DOC_TYPE_BY_LOCAL_ID = {
  pan: "PAN",
  registration: "BUSINESS_REGISTRATION",
  gst: "GST",
  fssai: "FSSAI",
  franchise: "FRANCHISE_AGREEMENT",
  fire: "FIRE_NOC",
};

const PHOTO_CATEGORY_BY_LOCAL_ID = {
  exterior: "EXTERIOR",
  classroom: "CLASSROOM",
  play: "PLAY",
  washroom: "WASHROOM",
  kitchen: "KITCHEN",
  nap: "NAP",
};

/** "pan" -> "PAN". Already-uppercase values pass through unchanged. */
export function toDocType(localId) {
  const key = String(localId ?? "").toLowerCase();
  return DOC_TYPE_BY_LOCAL_ID[key] ?? String(localId ?? "").toUpperCase();
}

/** "exterior" -> "EXTERIOR". */
export function toPhotoCategory(localId) {
  const key = String(localId ?? "").toLowerCase();
  return PHOTO_CATEGORY_BY_LOCAL_ID[key] ?? String(localId ?? "").toUpperCase();
}

/* Chip presets, mirroring the API's reference lists. */
const TEACHER_RATIO_PRESETS = [8, 10, 12, 15, 20];
const CAREGIVER_RATIO_PRESETS = [1, 2, 4, 6, 8];

/** "1:12" | "12" | 12 -> 12. Anything unusable -> null. */
function ratioToNumber(chip, other) {
  const raw = String(chip ?? "").trim();
  const source = !raw || raw.toLowerCase().startsWith("other") ? String(other ?? "") : raw;
  const digits = source.includes(":") ? source.split(":")[1] : source;
  const n = Number(String(digits).trim());
  return Number.isInteger(n) && n >= 1 && n <= 50 ? n : null;
}

/** 12 -> { chip: "1:12", other: "" }, falling back to the Other box. */
function numberToRatio(value, presets) {
  if (value === null || value === undefined || value === "") return { chip: "", other: "" };
  const n = Number(value);
  if (!Number.isFinite(n)) return { chip: "", other: "" };
  return presets.includes(n)
    ? { chip: `1:${n}`, other: "" }
    : { chip: "Other", other: String(n) };
}

/** Rupees (what the owner types) -> paise (what the API stores). */
function rupeesToPaise(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function paiseToRupees(value) {
  if (value === null || value === undefined) return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n / 100)) : "";
}

/** "Yes"/"No" radio -> boolean. Unanswered stays null so it is omitted. */
function yesNoToBool(value) {
  if (value === "Yes") return true;
  if (value === "No") return false;
  return null;
}

/** Merge a multi-select with its free-text "Other" box into one array. */
function mergeChoices(selected, other) {
  const list = Array.isArray(selected) ? [...selected] : [];
  const extra = String(other ?? "").trim();
  if (extra && !list.includes(extra)) list.push(extra);
  // Drop the literal "Other" chip — the typed value replaces it.
  return list.filter((item) => item && item.toLowerCase() !== "other");
}

function trimmed(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

/**
 * The whole form as the API expects it.
 *
 * Anything null is stripped before sending: the API treats an explicit null
 * as "clear this field", and a half-filled form would otherwise wipe values
 * the owner has not reached yet.
 */
export function buildCentrePayload(values = {}) {
  const v = values;

  const payload = {
    legal_name: trimmed(v.legalName),
    display_name: trimmed(v.displayName),
    // The API uses SCREAMING_CASE enums; the form shows "Daycare"/"Both".
    centre_type: v.centreType ? String(v.centreType).toUpperCase() : null,
    ownership: v.ownership ? String(v.ownership).toUpperCase() : null,
    franchise_brand: trimmed(v.franchiseBrand),

    owner_name: trimmed(v.ownerName),
    email: v.email ? String(v.email).trim().toLowerCase() : null,
    phone: trimmed(v.phone),

    address_line: trimmed(v.address),
    area: trimmed(v.area),
    city: trimmed(v.city),
    state: trimmed(v.state),
    pincode: trimmed(v.pincode),
    map_pin_url: trimmed(v.mapPin),

    working_days: Array.isArray(v.workingDays) && v.workingDays.length ? v.workingDays : null,
    open_time: trimmed(v.openTime),
    close_time: trimmed(v.closeTime),
    preschool_slots: trimmed(v.preschoolSlots),

    age_groups: Array.isArray(v.ageGroups) && v.ageGroups.length ? v.ageGroups : null,
    capacity: v.capacity === "" || v.capacity == null ? null : Number(v.capacity),

    curriculum: nullIfEmpty(mergeChoices(v.curriculum, v.curriculumOther)),
    primary_languages: nullIfEmpty(mergeChoices(v.languages, v.languageOther)),
    teacher_child_ratio: ratioToNumber(v.preschoolRatio, v.preschoolRatioOther),
    caregiver_child_ratio: ratioToNumber(v.daycareRatio, v.daycareRatioOther),

    meals_provided: yesNoToBool(v.meals),
    cctv_available: yesNoToBool(v.cctv),

    fee_full_day: rupeesToPaise(v.feeFullDay),
    fee_half_day: rupeesToPaise(v.feeHalfDay),
    fee_admission: rupeesToPaise(v.feeAdmission),

    gst_exempt: typeof v.gstExempt === "boolean" ? v.gstExempt : null,
    business_proof_type: trimmed(v.businessProofType),

    bank_account_name: trimmed(v.bankAccountName),
    bank_ifsc: v.bankIfsc ? String(v.bankIfsc).trim().toUpperCase() : null,
    // bankAccountNumber is deliberately NOT sent. The API stores it encrypted
    // and does not accept it through this endpoint yet.
  };

  // Strip nulls. Time values also need seconds — the API expects HH:MM:SS.
  const clean = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    clean[key] =
      (key === "open_time" || key === "close_time") && /^\d{2}:\d{2}$/.test(value)
        ? `${value}:00`
        : value;
  });
  return clean;
}

function nullIfEmpty(list) {
  return Array.isArray(list) && list.length ? list : null;
}

/** Whole form → centre payload. Used for POST /daycares. */
export function toCentrePayload(values) {
  return buildCentrePayload(values);
}

/**
 * Only what changed since the last save — PATCH takes a partial body.
 * Returns null when nothing moved, so the caller can skip the request.
 *
 * Both sides are built through the same function, so merged fields (ratios,
 * curriculum) diff correctly rather than per-form-input.
 */
export function toCentreDelta(values, previous) {
  const next = buildCentrePayload(values);
  const before = previous ? buildCentrePayload(previous) : {};

  const delta = {};
  Object.entries(next).forEach(([key, value]) => {
    const changed =
      Array.isArray(value) || typeof value === "object"
        ? JSON.stringify(value) !== JSON.stringify(before[key])
        : value !== before[key];
    if (changed) delta[key] = value;
  });

  return Object.keys(delta).length ? delta : null;
}

/** Centre response → form state, for resuming a draft on another device. */
export function fromCentreResponse(data) {
  if (!data || typeof data !== "object") return {};
  const c = data;

  const teacher = numberToRatio(c.teacher_child_ratio, TEACHER_RATIO_PRESETS);
  const caregiver = numberToRatio(c.caregiver_child_ratio, CAREGIVER_RATIO_PRESETS);

  return {
    legalName: c.legal_name ?? "",
    displayName: c.display_name ?? "",
    // Back to the form's title case: "BOTH" -> "Both".
    centreType: titleCase(c.centre_type),
    ownership: titleCase(c.ownership),
    franchiseBrand: c.franchise_brand ?? "",

    ownerName: c.owner_name ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    phoneVerified: Boolean(c.phone_verified),

    address: c.address_line ?? "",
    area: c.area ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    pincode: c.pincode ?? "",
    mapPin: c.map_pin_url ?? "",

    workingDays: c.working_days ?? [],
    openTime: (c.open_time ?? "").slice(0, 5),
    closeTime: (c.close_time ?? "").slice(0, 5),
    preschoolSlots: c.preschool_slots ?? "",

    ageGroups: c.age_groups ?? [],
    capacity: c.capacity == null ? "" : String(c.capacity),

    // Free-text entries stay in the array; they round-trip on the next save
    // even though they do not render as a preset chip.
    curriculum: c.curriculum ?? [],
    curriculumOther: "",
    languages: c.primary_languages ?? [],
    languageOther: "",
    preschoolRatio: teacher.chip,
    preschoolRatioOther: teacher.other,
    daycareRatio: caregiver.chip,
    daycareRatioOther: caregiver.other,

    meals: boolToYesNo(c.meals_provided),
    cctv: boolToYesNo(c.cctv_available),

    feeFullDay: paiseToRupees(c.fee_full_day),
    feeHalfDay: paiseToRupees(c.fee_half_day),
    feeAdmission: paiseToRupees(c.fee_admission),

    gstExempt: Boolean(c.gst_exempt),
    businessProofType: c.business_proof_type ?? "",
    bankAccountName: c.bank_account_name ?? "",
    bankIfsc: c.bank_ifsc ?? "",
  };
}

function titleCase(value) {
  if (!value) return "";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function boolToYesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

/**
 * Registration payload for POST /auth/register/owner.
 *
 * Identity only, and no password — onboarding authenticates by phone OTP.
 */
export function toRegisterPayload(values) {
  return {
    full_name: values.ownerName?.trim(),
    email: values.email?.trim().toLowerCase(),
    phone: values.phone?.trim(),
  };
}

/** GET /daycares/me/verification-status → the waiting screen's shape. */
export function fromVerificationStatus(data) {
  if (!data || typeof data !== "object") return null;
  return {
    daycareStatus: data.daycare_status ?? null,
    verificationStatus: data.verification_status ?? null,
    reference: data.verification_public_id ?? data.daycare_public_id ?? null,
    submittedAt: data.submitted_at ?? null,
    stages: data.stages ?? [],
    changesRequested: data.changes_requested ?? null,
    rejectedDocuments: data.rejected_documents ?? [],
    estimatedCompletion: data.estimated_completion ?? null,
    isPublished: Boolean(data.is_published),
    verifiedBadge: Boolean(data.verified_badge),
  };
}

/**
 * GET /daycares/me/submission-check returns a bare ARRAY of
 * { field, message } — empty means ready to submit.
 */
export function fromSubmissionCheck(data) {
  const missing = Array.isArray(data) ? data : data?.missing ?? [];
  return { ready: missing.length === 0, missing };
}
