/**
 * Every endpoint in the Admin Web signup + waiting-room flow, one function
 * each. Nothing here reshapes data — request bodies are built in mapping.js so
 * there is a single place to correct field names against the real API.
 */
import { del, get, patch, post, put } from "./http.js";
import { clearTokens, setTokens } from "./tokens.js";

/* ---------- 1. Auth ---------- */

/** Signup submit → creates the owner account and returns tokens. */
export async function registerOwner(payload) {
  const data = await post("/auth/register/owner", payload, { auth: false });
  setTokens(data);
  return data;
}

export async function login(email, password) {
  const data = await post("/auth/login", { email, password }, { auth: false });
  setTokens(data);
  return data;
}

export async function logout() {
  try {
    await post("/auth/logout", {});
  } catch {
    // A failed logout still ends the session locally.
  } finally {
    clearTokens();
  }
}

/** The OTP contract keys codes by purpose. */
export const OTP_PURPOSE_VERIFY_PHONE = "VERIFY_PHONE";
export const OTP_PURPOSE_LOGIN = "LOGIN";

/**
 * Sends a phone-verification code during signup.
 * The response may carry `debug_code` on local/staging; it is null in prod.
 */
export const sendOtp = (phone) =>
  post(
    "/auth/otp/send",
    { phone, purpose: OTP_PURPOSE_VERIFY_PHONE },
    { auth: false }
  );

export const verifyOtp = (phone, code) =>
  post(
    "/auth/otp/verify",
    { phone, code, purpose: OTP_PURPOSE_VERIFY_PHONE },
    { auth: false }
  );

/** Sends a login code — same endpoint, different purpose. */
export const sendLoginOtp = (phone) =>
  post("/auth/otp/send", { phone, purpose: OTP_PURPOSE_LOGIN }, { auth: false });

/**
 * Exchanges a login code for a session. Used by owners who haven't activated
 * yet, so they can resume an in-progress onboarding.
 */
export async function loginWithPhone(phone, code) {
  const data = await post(
    "/auth/login/phone",
    { phone, code, purpose: OTP_PURPOSE_LOGIN },
    { auth: false }
  );
  setTokens(data);
  return data;
}

/* ---------- Account activation ---------- */
/*
 * Only reachable once a centre is APPROVED — the backend issues the link at
 * that point and not before. All three paths are under /auth/activation/.
 */

/**
 * Checks an activation link WITHOUT consuming it, so the page can show
 * "Set a password for priya@gmail.com" or a clean expiry message.
 *
 * Always resolves 200: read `data.valid`, and `data.reason` when false.
 */
export const verifyActivationToken = (token, options) =>
  post("/auth/activation/verify", { token }, { ...options, auth: false });

/** Consumes the link, sets the password, and returns a session. */
export async function activateAccount(token, newPassword) {
  const data = await post(
    "/auth/activation/complete",
    { token, new_password: newPassword },
    { auth: false }
  );
  setTokens(data);
  return data;
}

/**
 * Asks for a fresh activation link.
 *
 * Always 200 with the same message — for a real account, an unknown email,
 * an already-activated owner, or a request inside the 120s cooldown. Do not
 * branch on the response; just show the message.
 */
export const resendActivation = (email) =>
  post("/auth/activation/resend", { email }, { auth: false });

export const getMe = (options) => get("/auth/me", options);

/**
 * Change the signed-in user's password.
 *
 * Needs the current one, so it only works for an account that has a password
 * — an owner who has only ever signed in by OTP has `has_password: false` and
 * sets theirs through the activation link instead.
 */
export const changePassword = (payload) =>
  post("/auth/password/change", payload);

/* ---------- 2. Reference data ---------- */

/** Dropdowns, chip lists and upload limits. Called once on app load. */
export const getReference = (options) =>
  get("/daycares/reference", { ...options, auth: false });

/* ---------- 3. Centre draft ---------- */

export const createDaycare = (payload = {}) => post("/daycares", payload);
export const getMyDaycare = (options) => get("/daycares/me", options);
export const patchMyDaycare = (changed) => patch("/daycares/me", changed);

/* ---------- 4. Documents ---------- */

export const getRequiredDocuments = (options) =>
  get("/daycares/me/required-documents", options);

export const listDocuments = (options) => get("/daycares/me/documents", options);
export const recordDocument = (payload) => post("/daycares/me/documents", payload);
export const deleteDocument = (id) => del(`/daycares/me/documents/${encodeURIComponent(id)}`);

/* ---------- 5. Photos ---------- */

export const getRequiredPhotos = (options) => get("/daycares/me/required-photos", options);
export const listPhotos = (options) => get("/daycares/me/photos", options);
export const recordPhoto = (payload) => post("/daycares/me/photos", payload);
export const deletePhoto = (id) => del(`/daycares/me/photos/${encodeURIComponent(id)}`);

/* ---------- Uploads (shared by documents and photos) ---------- */

/**
 * Step 1 of an upload. `purpose` is "document" or "photo".
 * Returns the destination the browser PUTs the file to.
 */
export const presignUpload = ({ purpose, filename, contentType, size }) =>
  post("/uploads/presign", {
    purpose,
    file_name: filename,
    mime_type: contentType,
    size_bytes: size,
  });

/* ---------- 6. Agreement + submit ---------- */

export const saveAgreement = ({ signature, acknowledged }) =>
  post("/daycares/me/agreement", { signature, acknowledged });

/** Checklist shown on Review before the submit button is trusted. */
export const getSubmissionCheck = (options) =>
  get("/daycares/me/submission-check", options);

/** 200 → success screen. 422 → ApiError with `.missing` populated. */
export const submitApplication = () => post("/daycares/me/submit", {});

/* ---------- 7. Waiting room ---------- */

export const getVerificationStatus = (options) =>
  get("/daycares/me/verification-status", options);

/* ---------- 8. The running centre ---------- */
/*
 * Everything the dashboard reads once a centre is approved and children are
 * enrolled. The sections above are the one-off onboarding flow; these are the
 * day-to-day.
 *
 * Several of the dashboard's sections have NO endpoints behind them and are
 * not listed here on purpose — billing, reports, admissions, calendar and
 * support. Announcements and parent meetings are being built. Adding a
 * function that calls a path which does not exist would turn a known gap into
 * a 404 nobody can explain.
 */

/** Builds `?a=1&b=2`, skipping anything empty so the API sees no blank keys. */
function query(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

/* Classrooms — the scope almost everything else is filtered by. */

export const listClassrooms = (options) =>
  get("/daycares/me/classrooms", options);

export const createClassroom = (payload) =>
  post("/daycares/me/classrooms", payload);

export const updateClassroom = (id, changed) =>
  patch(`/daycares/me/classrooms/${encodeURIComponent(id)}`, changed);

export const deleteClassroom = (id) =>
  del(`/daycares/me/classrooms/${encodeURIComponent(id)}`);

/* Children. The list pages; `meta` carries the pager. */

export const listChildren = (params, options) =>
  get(`/daycares/me/children${query(params)}`, options);

/**
 * Every child, following the pager.
 *
 * `per_page` is capped at 100 by the API and a centre can have more children
 * than that, so the roster has to walk the pages — asking for 200 is a 400,
 * and taking only the first page would silently hide the rest, which is worse
 * than slow.
 *
 * The pager arrives as a non-enumerable `meta` on the returned array, so it
 * is read off the first response rather than from a wrapper.
 */
export async function listAllChildren(params = {}, options) {
  const first = await get(
    `/daycares/me/children${query({ ...params, page: 1, per_page: 100 })}`,
    options
  );
  const totalPages = first?.meta?.total_pages || 1;
  if (totalPages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      get(
        `/daycares/me/children${query({ ...params, page: index + 2, per_page: 100 })}`,
        options
      )
    )
  );

  const all = [...first, ...rest.flat()];
  // Keep the shape callers expect, pager included.
  Object.defineProperty(all, "meta", {
    value: { ...first.meta, page: 1, per_page: all.length },
    enumerable: false,
  });
  return all;
}

export const getChild = (id, options) =>
  get(`/daycares/me/children/${encodeURIComponent(id)}`, options);

/**
 * Creating a child also creates the guardian invite — `primary_guardian` is
 * required, and the 201 comes back as `{ child, enrollment, invite }` rather
 * than a bare child.
 */
export const createChild = (payload) => post("/daycares/me/children", payload);

export const updateChild = (id, changed) =>
  patch(`/daycares/me/children/${encodeURIComponent(id)}`, changed);

export const inviteGuardian = (childId, payload) =>
  post(`/daycares/me/children/${encodeURIComponent(childId)}/invites`, payload);

export const resendGuardianInvite = (childId, inviteId) =>
  post(
    `/daycares/me/children/${encodeURIComponent(childId)}/invites/${encodeURIComponent(inviteId)}/resend`,
    {}
  );

export const revokeGuardianInvite = (childId, inviteId) =>
  del(
    `/daycares/me/children/${encodeURIComponent(childId)}/invites/${encodeURIComponent(inviteId)}`
  );

/* Attendance. The register for a date, plus totals over a range. */

export const getAttendance = (params, options) =>
  get(`/daycares/me/attendance${query(params)}`, options);

export const getAttendanceSummary = (params, options) =>
  get(`/daycares/me/attendance/summary${query(params)}`, options);

/* Daily care — what caretakers logged. The owner can read and remove. */

export const getCareLogs = (params, options) =>
  get(`/daycares/me/care-logs${query(params)}`, options);

export const deleteCareLog = (id) =>
  del(`/daycares/me/care-logs/${encodeURIComponent(id)}`);

/** The day's menu. PUT replaces it for that date. */
export const putDailyMenu = (date, payload) =>
  put(`/daycares/me/menus/${encodeURIComponent(date)}`, payload);

/**
 * Reading a menu back.
 *
 * There is no owner-scoped GET — only this public one, which is why it needs
 * the centre's UUID passed explicitly rather than inferring it from the
 * token. `/daycares/me` carries that id.
 */
export const getMenus = (params, options) =>
  get(`/menus${query(params)}`, options);

/* Staff — caretakers, and which rooms they cover. */

export const listStaff = (params, options) =>
  get(`/daycares/me/staff${query(params)}`, options);

export const getStaffMember = (id, options) =>
  get(`/daycares/me/staff/${encodeURIComponent(id)}`, options);

/**
 * A caretaker is created from a phone number and gets NO password — they sign
 * in with phone + OTP. So there is no password to set here and none to send.
 */
export const createStaff = (payload) => post("/daycares/me/staff", payload);

export const updateStaff = (id, changed) =>
  patch(`/daycares/me/staff/${encodeURIComponent(id)}`, changed);

/** PUT replaces the whole set of rooms, it does not add to it. */
export const setStaffClassrooms = (id, classroomIds) =>
  put(`/daycares/me/staff/${encodeURIComponent(id)}/classrooms`, {
    classroom_ids: classroomIds,
  });

export const removeStaff = (id) =>
  del(`/daycares/me/staff/${encodeURIComponent(id)}`);

/* Notifications — the topbar bell. */

export const listNotifications = (params, options) =>
  get(`/notifications${query(params)}`, options);

export const markNotificationsRead = (ids) =>
  post("/notifications/read", { notification_ids: ids ?? null });
