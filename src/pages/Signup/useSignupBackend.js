import { useCallback, useRef, useState } from "react";
import * as api from "../../api/endpoints.js";
import { uploadDocument, uploadPhoto } from "../../api/uploads.js";
import {
  fromCentreResponse,
  fromSubmissionCheck,
  toCentreDelta,
  toCentrePayload,
  toRegisterPayload,
} from "../../api/mapping.js";
import { hasSession } from "../../api/tokens.js";

/**
 * Server side of the signup wizard.
 *
 * Ordering note: every /daycares route needs a bearer token, so the owner
 * account has to exist before a draft can be created. We therefore register at
 * the end of the Centre step — the first point where we have a verified email
 * and phone — and create the draft immediately after. Steps 2 onward autosave
 * against that draft, and the final button only calls /submit.
 */
export function useSignupBackend({ onSessionStarted } = {}) {
  const [state, setState] = useState({
    registering: false,
    saving: false,
    submitting: false,
    error: null,
  });

  // Last payload we successfully saved, so PATCH only sends what moved.
  const savedRef = useRef(null);
  const draftRef = useRef(null);
  const registeredRef = useRef(hasSession());

  const patchState = (next) => setState((current) => ({ ...current, ...next }));

  /** Resume an existing draft. Returns form values, or null if there is none. */
  const loadDraft = useCallback(async (signal) => {
    if (!hasSession()) return null;
    try {
      const data = await api.getMyDaycare({ signal });
      draftRef.current = data;
      const values = fromCentreResponse(data);
      savedRef.current = values;
      return values;
    } catch (error) {
      if (error?.status === 404) return null; // no draft yet, that's fine
      throw error;
    }
  }, []);

  /**
   * Register the owner and open a draft. Safe to call more than once — it
   * no-ops after the first success.
   */
  const startSession = useCallback(
    async (values) => {
      const alreadyStarted = registeredRef.current;

      patchState({ registering: true, error: null });
      try {
        if (!registeredRef.current) {
          await api.registerOwner(toRegisterPayload(values));
          registeredRef.current = true;
        }

        // ALWAYS run this, even when a session already existed. Returning
        // early here meant a returning owner (tokens still in storage from an
        // earlier attempt) skipped draft creation entirely, and every later
        // step failed with "Daycare not found".
        //
        // POST /daycares is idempotent: it returns the existing centre and
        // applies the body, so calling it again is safe and also saves the
        // Centre step in the same request.
        const draft = await api.createDaycare(toCentrePayload(values));
        draftRef.current = draft;
        savedRef.current = { ...values };

        await onSessionStarted?.();
        return { alreadyStarted };
      } finally {
        patchState({ registering: false });
      }
    },
    [onSessionStarted]
  );

  /** Autosave on step transitions. No-ops when nothing changed. */
  const saveProgress = useCallback(async (values) => {
    if (!registeredRef.current) return;

    const delta = toCentreDelta(values, savedRef.current);
    if (!delta) return;

    patchState({ saving: true });
    try {
      await api.patchMyDaycare(delta);
      savedRef.current = { ...values };
    } catch (error) {
      // A failed autosave shouldn't block the wizard — the local draft still
      // holds everything, and the next transition retries the same delta.
      patchState({ error: error?.message || "Couldn't save your progress." });
    } finally {
      patchState({ saving: false });
    }
  }, []);

  const sendOtp = useCallback((phone) => api.sendOtp(phone), []);
  const verifyOtp = useCallback((phone, code) => api.verifyOtp(phone, code), []);

  const putDocument = useCallback(
    (file, documentType, onProgress) => uploadDocument({ file, documentType, onProgress }),
    []
  );

  const putPhoto = useCallback(
    (file, category, onProgress) => uploadPhoto({ file, category, onProgress }),
    []
  );

  const removeDocument = useCallback((id) => api.deleteDocument(id), []);
  const removePhoto = useCallback((id) => api.deletePhoto(id), []);

  const saveAgreement = useCallback(
    (signature, acknowledged) => api.saveAgreement({ signature, acknowledged }),
    []
  );

  const checkSubmission = useCallback(async () => {
    const data = await api.getSubmissionCheck();
    return fromSubmissionCheck(data);
  }, []);

  /**
   * Final submit. Resolves with the reference on success; on a 422 it throws
   * the ApiError with `.missing` so the Review step can list what's left.
   */
  const submit = useCallback(async (values) => {
    patchState({ submitting: true, error: null });
    try {
      await saveProgressInline(values);
      const result = await api.submitApplication();
      return result;
    } finally {
      patchState({ submitting: false });
    }

    async function saveProgressInline(current) {
      const delta = toCentreDelta(current, savedRef.current);
      if (!delta) return;
      await api.patchMyDaycare(delta);
      savedRef.current = { ...current };
    }
  }, []);

  return {
    ...state,
    hasSession: () => registeredRef.current,
    loadDraft,
    startSession,
    saveProgress,
    sendOtp,
    verifyOtp,
    putDocument,
    putPhoto,
    removeDocument,
    removePhoto,
    saveAgreement,
    checkSubmission,
    submit,
  };
}
