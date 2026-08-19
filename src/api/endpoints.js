/**
 * Every endpoint in the Admin Web signup + waiting-room flow, one function
 * each. Nothing here reshapes data — request bodies are built in mapping.js so
 * there is a single place to correct field names against the real API.
 */
import { del, get, patch, post } from "./http.js";
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
