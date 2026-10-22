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
 * Creating a child also sets up the parent. `primary_guardian` is required,
 * and the 201 comes back as `{ child, enrollment, invite, ... }` rather than
 * a bare child.
 *
 * Which of two things happens depends on `primary_guardian.full_name`:
 *
 *  - **Given** — the parent's login is created there and then. They sign in
 *    with their number and a one-time code; nothing to accept. The response
 *    says `guardian_account_created: true`.
 *  - **Omitted** — an invite is raised instead, and the parent has to sign
 *    themselves up before they see anything.
 *
 * The console always sends the name. The other path is kept because the API
 * still supports it, not because anything here uses it.
 */
export const createChild = (payload) => post("/daycares/me/children", payload);

export const updateChild = (id, changed) =>
  patch(`/daycares/me/children/${encodeURIComponent(id)}`, changed);

/**
 * Add a second parent, creating their login if they do not have one.
 *
 * `account_created` in the response is false when an existing parent was
 * simply added to another child — the normal case for a sibling, where one
 * login carries both children.
 */
export const addGuardian = (childId, payload) =>
  post(`/daycares/me/children/${encodeURIComponent(childId)}/guardians`, payload);

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


/* Fees. A plan is what a place costs; an invoice is one month of it for one
   child. The two are deliberately separate — changing a plan next term must
   not rewrite what a family was already billed, so an invoice carries its own
   amount_paise copied from the plan at the moment it was raised. */

export const listFeePlans = (options) =>
  get("/daycares/me/fee-plans", options);

export const createFeePlan = (payload) =>
  post("/daycares/me/fee-plans", payload);

/** Only name, amount and is_active. A plan's cycle cannot change — a monthly
 *  plan that became a term plan would make every invoice already raised from
 *  it mean something different. Retire it and make a new one. */
export const updateFeePlan = (id, changed) =>
  patch(`/daycares/me/fee-plans/${encodeURIComponent(id)}`, changed);

/** Paginated, and filterable by status and child. */
export const listInvoices = (params, options) =>
  get(`/daycares/me/invoices${query(params)}`, options);

/** Raises a DRAFT. The family sees nothing until it is sent. */
export const createInvoice = (payload) =>
  post("/daycares/me/invoices", payload);

/** DRAFT -> SENT. This is the step that makes it visible to the parent and
 *  payable; until it happens the invoice is the centre's own working note. */
export const sendInvoice = (id) =>
  post(`/daycares/me/invoices/${encodeURIComponent(id)}/send`, {});

/** Cancels it, with a reason that is kept. There is no delete: an invoice a
 *  family may already have seen is a record, not a draft message. */
export const voidInvoice = (id, reason) =>
  post(`/daycares/me/invoices/${encodeURIComponent(id)}/void`, { reason });

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

/* The owner's home, in one call.

   O1 replaces the four requests Overview used to make — the register, the
   roster, the care-log summary and the staff list — which raced each other
   and could disagree about what "today" was. */

export const getDashboard = (params, options) =>
  get(`/daycares/me/dashboard${query(params)}`, options);

/* O2 — recent activity, read from the audit trail.

   Scoped by actor, so it shows what this centre's own people did. A parent's
   actions are not in it: audit_logs has no daycare_id to filter on. */

export const getCentreActivity = (params, options) =>
  get(`/daycares/me/activity${query(params)}`, options);

/* Incidents — the safeguarding record.

   There is no delete, for anyone. Signing one off freezes it, and a SERIOUS
   incident is refused sign-off until the record shows the parent was told. */

export const listIncidents = (params, options) =>
  get(`/daycares/me/incidents${query(params)}`, options);

export const getIncident = (id, options) =>
  get(`/daycares/me/incidents/${id}`, options);

export const reviewIncident = (id, payload) =>
  post(`/daycares/me/incidents/${id}/review`, payload);

/* Announcements.

   The audience is resolved to people when it is sent, so read_count and
   recipient_count are both facts about that moment rather than a recount
   against today's roster. */

export const listAnnouncements = (params, options) =>
  get(`/daycares/me/announcements${query(params)}`, options);

export const sendAnnouncement = (payload) =>
  post("/daycares/me/announcements", payload);

export const pinAnnouncement = (id, isPinned) =>
  patch(`/daycares/me/announcements/${id}`, { is_pinned: isPinned });

export const withdrawAnnouncement = (id) =>
  del(`/daycares/me/announcements/${id}`);

/* Events and who has replied. */

export const listEvents = (params, options) =>
  get(`/daycares/me/events${query(params)}`, options);

export const createEvent = (payload) => post("/daycares/me/events", payload);

export const updateEvent = (id, changed) =>
  patch(`/daycares/me/events/${id}`, changed);

export const deleteEvent = (id) => del(`/daycares/me/events/${id}`);

export const getEventRsvps = (id, options) =>
  get(`/daycares/me/events/${id}/rsvps`, options);

/* Emergencies.

   Separate from announcements, and not a styling choice. An alert has a
   lifecycle: the all-clear is information families need as much as the alarm,
   and a notice has nothing to send it with. The audience is resolved when it
   is sent, so "14 of 31 answered" does not drift while the centre works down
   the list.

   Acknowledgement is a deliberate tap in the parent's app, not a read
   receipt — which is what makes `outstanding` on the detail call a list worth
   phoning. */

export const listEmergencies = (params, options) =>
  get(`/daycares/me/emergencies${query(params)}`, options);

/* Who has answered, and who to phone. `outstanding` carries each family's
   phone number because that is the next thing anyone does with the list. */
export const getEmergency = (id, options) =>
  get(`/daycares/me/emergencies/${id}`, options);

export const raiseEmergency = (payload) =>
  post("/daycares/me/emergencies", payload);

/* The resolution text is required by the API. A family who received
   "evacuate" and then a bare "resolved" is left guessing whether their child
   is safe or the centre just closed the ticket. */
export const resolveEmergency = (id, resolution) =>
  post(`/daycares/me/emergencies/${id}/resolve`, { resolution });

/* Meetings.

   Role-agnostic routes: these same six serve a parent, a caretaker and an
   owner, and the backend decides which side the caller is on. An owner's
   scope is every child at the centre.

   `awaiting` and `awaiting_me` are stored by the server, not derived. They
   could be worked out from the status and who proposed last, but it would
   have to be worked out identically in three clients, and the first one to
   get it wrong shows a family "waiting for you" on a meeting the centre has
   not answered. */

export const listMeetings = (params, options) =>
  get(`/meetings${query(params)}`, options);

export const requestMeeting = (payload) => post("/meetings", payload);

/* Only the side being waited on may confirm; confirming your own proposal is
   409 NOT_YOUR_TURN, because it would turn a two-party agreement into a
   one-party announcement. */
export const confirmMeeting = (id) => post(`/meetings/${id}/confirm`);

export const proposeMeetingTime = (id, payload) =>
  post(`/meetings/${id}/propose`, payload);

export const cancelMeeting = (id, reason) =>
  post(`/meetings/${id}/cancel`, { reason });

/* Centre-side only, and only once confirmed. The outcome is what the family
   reads afterwards. */
export const completeMeeting = (id, outcome) =>
  post(`/meetings/${id}/complete`, { outcome });

/* The medicine round.

   A dose record cannot be deleted by anyone — no route exists, and there is
   no soft-delete column. Same reason as incidents: a centre that can remove a
   medication record can remove the evidence of a mistake. It can be corrected
   for twelve hours, and `editable` on each row says whether that window is
   still open.

   Owners read; caretakers record, from the app. */

export const listDoses = (params, options) =>
  get(`/daycares/me/doses${query(params)}`, options);

/* Learning observations.

   Counts, never scores. The API stores no rating, level or percentage against
   any development area, and nothing built on it may present a count as a
   judgement about a child — "five notes about talking" is a fact about what
   the centre wrote down.

   An owner can remove any observation. That is a deliberate difference from
   incidents and doses, which nobody can delete: this is pedagogy, not
   safeguarding, and a note about the wrong child is not evidence of
   anything. */

export const listObservations = (params, options) =>
  get(`/daycares/me/observations${query(params)}`, options);

export const deleteObservation = (id) =>
  del(`/daycares/me/observations/${id}`);

/* The meal schedule.

   This exists so an unlogged meal can be told from one that was never served.
   The parent's app used to draw a fixed Breakfast/Lunch/Snack frame and grey
   out whatever had no log, which reads as "offered and refused" — and at a
   centre serving no breakfast, invented a meal outright.

   Two rules carry into the UI:

   * A room's slots REPLACE the centre's entirely; they are never merged. A
     room that sets its own times has a different day, usually because the
     babies eat earlier, and a merged timetable is one nobody runs.
   * PUT replaces the whole set. Send every slot that should exist, not a
     delta — the API has no per-slot route, deliberately, because a schedule
     is read as a whole. */

export const listMealSlots = (options) =>
  get("/daycares/me/meal-slots", options);

export const putMealSlots = (slots) =>
  put("/daycares/me/meal-slots", { slots });

/* Badges.

   Moments the centre marks. The parent screen this replaced was a scoreboard
   — 1,250 points, "level 3", the rank "Super Star" — and the rule here is
   that no payload carries a number about a child. There is no points field
   on a badge, and `tests/test_badges.py` asserts the absence of points,
   score, level, rank, total, streak and the rest on every child-facing
   response.

   `times_awarded` on a badge is the one count, and it is about the centre's
   own list: "is anyone using this one?". It never groups by child.

   A badge children already have cannot be deleted — the awards reference it
   with RESTRICT, so deleting it would empty their history. Retire it with
   is_active instead. */

export const listBadges = (options) => get("/daycares/me/badges", options);

export const createBadge = (payload) => post("/daycares/me/badges", payload);

export const updateBadge = (id, changed) =>
  patch(`/daycares/me/badges/${id}`, changed);

export const deleteBadge = (id) => del(`/daycares/me/badges/${id}`);

export const listBadgeAwards = (params, options) =>
  get(`/daycares/me/badge-awards${query(params)}`, options);

export const removeBadgeAward = (id) =>
  del(`/daycares/me/badge-awards/${id}`);

/* Activity planning.

   Two things, deliberately separate. The LIBRARY is what the centre runs
   often, written once. The PLAN is this room, this day, in this order.

   A plan copies the library's wording when it is made, so editing the library
   next month does not rewrite what a room was told to do last Tuesday. That
   is the opposite of badges, where a rename should reach every badge already
   given — a badge is a category, a planned activity is an instruction for one
   day.

   There is no "mark delivered" call. A caretaker records the activity the
   normal way from the app, passing planned_activity_id, and that links the
   two. Once delivered the plan is frozen. */

export const listActivityTemplates = (options) =>
  get("/daycares/me/activity-templates", options);

export const createActivityTemplate = (payload) =>
  post("/daycares/me/activity-templates", payload);

export const updateActivityTemplate = (id, changed) =>
  patch(`/daycares/me/activity-templates/${id}`, changed);

export const deleteActivityTemplate = (id) =>
  del(`/daycares/me/activity-templates/${id}`);

/* The week. Pass from_date/to_date; the response carries the range back so
   the planner can draw days with nothing on them. */
export const getActivityPlan = (params, options) =>
  get(`/daycares/me/activity-plan${query(params)}`, options);

export const planActivity = (payload) =>
  post("/daycares/me/activity-plan", payload);

export const updatePlannedActivity = (id, changed) =>
  patch(`/daycares/me/activity-plan/${id}`, changed);

export const removePlannedActivity = (id) =>
  del(`/daycares/me/activity-plan/${id}`);
