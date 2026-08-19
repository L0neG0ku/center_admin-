import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell/AuthShell.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Icon from "../../icons/Icon.jsx";
import StepNav from "../../components/signup/StepNav/StepNav.jsx";
import StepCentre from "../../components/signup/StepCentre/StepCentre.jsx";
import StepDocuments from "../../components/signup/StepDocuments/StepDocuments.jsx";
import StepPhotos from "../../components/signup/StepPhotos/StepPhotos.jsx";
import StepReview from "../../components/signup/StepReview/StepReview.jsx";
import StepAgreement from "../../components/signup/StepAgreement/StepAgreement.jsx";
import Submitted from "../../components/signup/Submitted/Submitted.jsx";
import {
  brandFeatures,
  documentsFor,
  photoCategories,
  signupSteps,
} from "../../data/signup.js";
import { useSignupBackend } from "./useSignupBackend.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useReference } from "../../api/useReference.js";
import "./Signup.css";

const DRAFT_KEY = "kribble.signup.draft";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ifscPattern = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;

const blankPhotos = () =>
  Object.fromEntries(photoCategories.map((category) => [category.id, []]));

const blank = {
  legalName: "",
  displayName: "",
  centreType: "",
  ownership: "",
  franchiseBrand: "",
  ownerName: "",
  email: "",
  phone: "",
  phoneVerified: false,
  address: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  mapPin: "",
  workingDays: [],
  openTime: "",
  closeTime: "",
  preschoolSlots: "",
  ageGroups: [],
  capacity: "",
  curriculum: [],
  curriculumOther: "",
  languages: [],
  languageOther: "",
  preschoolRatio: "",
  preschoolRatioOther: "",
  daycareRatio: "",
  daycareRatioOther: "",
  meals: "",
  cctv: "",
  feeFullDay: "",
  feeHalfDay: "",
  feePreschoolTuition: "",
  feeAdmission: "",

  gstExempt: false,
  businessProofType: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",

  acknowledged: false,
  signature: "",
};

/**
 * Prefers whatever the API said over a canned line, so the user is told the
 * actual problem. Only genuinely message-less responses get the fallback.
 */
function otpErrorMessage(error, fallback = "That code didn't work. Try again.") {
  if (!error) return fallback;

  // Field-level validation wins — it names what was wrong with the request.
  const fieldMessage = error.fields
    ? Object.values(error.fields).find(Boolean)
    : null;
  if (fieldMessage) return fieldMessage;

  const message = typeof error.message === "string" ? error.message.trim() : "";

  // "Request failed (400)" is our own placeholder, not something worth showing.
  if (message && !/^Request failed \(\d+\)\.?$/.test(message)) return message;

  if (error.status === 429) return "Too many attempts. Please wait and try again.";
  if (error.status === 410 || error.status === 404) {
    return "That code has expired. Send a new one.";
  }
  return fallback;
}

/** True when a previous session left real answers behind, not just blanks. */
function hasSavedDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Object.values(parsed).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    );
  } catch {
    return false;
  }
}

/** Files and photos can't be serialised, so only the plain fields are saved. */
function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...blank, ...JSON.parse(raw) } : blank;
  } catch {
    return blank;
  }
}

export default function Signup() {
  const [values, setValues] = useState(() => ({
    ...loadDraft(),
    files: {},
    photos: blankPhotos(),
  }));
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState({ sent: false, code: "", error: undefined });
  // Per-document upload progress, keyed by document id.
  const [uploads, setUploads] = useState({});
  // Server-side "are you ready to submit" checklist, fetched on the Review step.
  const [submissionCheck, setSubmissionCheck] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState(null);
  // Separate from `reference` — a submission can succeed without the API
  // handing back a reference string, and the success screen must still show.
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  // The form autosaves to this browser, so a returning user lands on their old
  // answers. That was silent and looked like stale server data — say so, and
  // give them a way out.
  const [restoredDraft, setRestoredDraft] = useState(hasSavedDraft);
  const topRef = useRef(null);

  const { adoptSession } = useAuth();
  const backend = useSignupBackend({ onSessionStarted: adoptSession });
  const { requirePhoneVerification } = useReference();

  // The OTP handlers are created once but need the current phone and code.
  const valuesRef = useRef(values);
  const otpRef = useRef(otp);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  useEffect(() => {
    otpRef.current = otp;
  }, [otp]);

  // Resume a draft started on another device. The local autosave already
  // covers same-device refreshes, so this only fills what's missing.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const remote = await backend.loadDraft(controller.signal);
        if (remote) setValues((current) => ({ ...current, ...remote }));
      } catch {
        // Offline or no draft — the local copy stands in.
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave, so a refresh mid-form doesn't lose everything.
  useEffect(() => {
    const { files, photos, ...rest } = values;
    void files;
    void photos;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {
      // storage may be unavailable in private mode — not fatal
    }
  }, [values]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  // The Review step asks the server what's still outstanding, so the checklist
  // reflects the API's view rather than only what this browser knows about.
  useEffect(() => {
    if (step !== 3 || !backend.hasSession()) return undefined;
    let cancelled = false;

    backend
      .checkSubmission()
      .then((result) => {
        if (!cancelled) setSubmissionCheck(result);
      })
      .catch(() => {
        if (!cancelled) setSubmissionCheck(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Release object URLs when the page unmounts.
  useEffect(
    () => () => {
      Object.values(values.photos).forEach((list) =>
        list.forEach((photo) => URL.revokeObjectURL(photo.url))
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /** Wipe the locally saved draft and hand back an empty form. */
  const startFresh = () => {
    Object.values(values.photos).forEach((list) =>
      list.forEach((photo) => URL.revokeObjectURL(photo.url))
    );
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // private mode — nothing was persisted anyway
    }
    setValues({ ...blank, files: {}, photos: blankPhotos() });
    setErrors({});
    setOtp({ sent: false, code: "", error: undefined });
    setUploads({});
    setSubmissionCheck(null);
    setFormError("");
    setStep(0);
    setFurthest(0);
    setRestoredDraft(false);
  };

  const set = (key) => (value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleIn = (key, item) =>
    setValues((current) => ({
      ...current,
      [key]: current[key].includes(item)
        ? current[key].filter((entry) => entry !== item)
        : [...current[key], item],
    }));

  /**
   * Files go up as soon as they're picked rather than being held until submit,
   * so a slow connection costs the user nothing at the end. The local entry is
   * shown immediately and annotated with the server id once recorded.
   */
  const setFile = (id, file) => {
    setValues((current) => ({ ...current, files: { ...current.files, [id]: file } }));
    setErrors((current) => ({ ...current, [`file_${id}`]: undefined }));

    if (!file) {
      const existing = values.files[id];
      if (existing?.remoteId) backend.removeDocument(existing.remoteId).catch(() => {});
      return;
    }

    setUploads((current) => ({ ...current, [id]: { progress: 0, error: null } }));

    backend
      .putDocument(file, id, (progress) =>
        setUploads((current) => ({ ...current, [id]: { progress, error: null } }))
      )
      .then((record) => {
        setUploads((current) => ({ ...current, [id]: { progress: 1, error: null } }));
        setValues((current) => {
          const held = current.files[id];
          if (held !== file) return current; // superseded by a newer pick
          held.remoteId = record?.id ?? record?.document_id ?? null;
          return current;
        });
      })
      .catch((error) => {
        setUploads((current) => ({
          ...current,
          [id]: { progress: 0, error: error?.message || "Upload failed." },
        }));
        setErrors((current) => ({
          ...current,
          [`file_${id}`]: "That upload didn't finish. Try again.",
        }));
      });
  };

  const addPhotos = (categoryId, fileList) => {
    const entries = fileList.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      uploading: true,
    }));

    setValues((current) => ({
      ...current,
      photos: {
        ...current.photos,
        [categoryId]: [...current.photos[categoryId], ...entries],
      },
    }));

    // Upload each in the background, tagging the local entry with its server id.
    entries.forEach((entry) => {
      backend
        .putPhoto(entry.file, categoryId)
        .then((record) => {
          setValues((current) => ({
            ...current,
            photos: {
              ...current.photos,
              [categoryId]: current.photos[categoryId].map((photo) =>
                photo.id === entry.id
                  ? {
                      ...photo,
                      uploading: false,
                      remoteId: record?.id ?? record?.photo_id ?? null,
                    }
                  : photo
              ),
            },
          }));
        })
        .catch(() => {
          setValues((current) => ({
            ...current,
            photos: {
              ...current.photos,
              [categoryId]: current.photos[categoryId].map((photo) =>
                photo.id === entry.id
                  ? { ...photo, uploading: false, failed: true }
                  : photo
              ),
            },
          }));
        });
    });
  };

  const removePhoto = (categoryId, photoId) =>
    setValues((current) => {
      const target = current.photos[categoryId].find((photo) => photo.id === photoId);
      if (target) URL.revokeObjectURL(target.url);
      if (target?.remoteId) backend.removePhoto(target.remoteId).catch(() => {});
      return {
        ...current,
        photos: {
          ...current.photos,
          [categoryId]: current.photos[categoryId].filter((photo) => photo.id !== photoId),
        },
      };
    });

  const otpHandlers = useMemo(
    () => ({
      send: async () => {
        const phone = valuesRef.current.phone.trim();
        if (phone.replace(/\D/g, "").length < 10) {
          setErrors((current) => ({ ...current, phone: "Enter a 10-digit mobile number." }));
          return;
        }
        setOtp({ sent: true, code: "", error: undefined, sending: true });
        try {
          const result = await backend.sendOtp(phone);
          // Local and staging return the code so testers don't need an SMS.
          // Production sends null, which leaves the field empty. Either way
          // it stays editable and is still checked by /auth/otp/verify — this
          // only saves typing, it never stands in for verification.
          const debugCode = result?.debug_code ?? result?.debugCode ?? null;
          setOtp((current) => ({
            ...current,
            sending: false,
            code: debugCode ? String(debugCode) : current.code,
            prefilled: Boolean(debugCode),
          }));
        } catch (error) {
          setOtp({
            sent: false,
            code: "",
            sending: false,
            error: otpErrorMessage(error, "Couldn't send the code. Try again."),
          });
        }
      },

      setCode: (code) => setOtp((current) => ({ ...current, code, error: undefined })),

      verify: async () => {
        const code = otpRef.current.code;
        if (!/^\d{6}$/.test(code)) {
          setOtp((current) => ({ ...current, error: "Enter the 6-digit code." }));
          return;
        }
        setOtp((current) => ({ ...current, verifying: true, error: undefined }));
        try {
          await backend.verifyOtp(valuesRef.current.phone.trim(), code);
          setValues((current) => ({ ...current, phoneVerified: true }));
          setOtp((current) => ({ ...current, verifying: false, error: undefined }));
        } catch (error) {
          // Show what the API actually said — a wrong code, an expired code and
          // a rate limit are different problems and need different fixes.
          setOtp((current) => ({
            ...current,
            verifying: false,
            error: otpErrorMessage(error),
          }));
        }
      },

      reset: () => {
        setOtp({ sent: false, code: "", error: undefined });
        setValues((current) => ({ ...current, phoneVerified: false }));
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const validateStep = (index) => {
    const next = {};
    const hasPreschool = values.centreType === "Preschool" || values.centreType === "Both";
    const hasDaycare = values.centreType === "Daycare" || values.centreType === "Both";

    if (index === 0) {
      if (!values.legalName.trim()) next.legalName = "Required.";
      if (!values.displayName.trim()) next.displayName = "Required.";
      if (!values.centreType) next.centreType = "Pick one.";
      if (!values.address.trim()) next.address = "Required.";
      if (!values.city.trim()) next.city = "Required.";
      if (!values.state) next.state = "Required.";
      if (!/^\d{6}$/.test(values.pincode.trim())) next.pincode = "Enter a 6-digit pincode.";
      if (values.workingDays.length === 0) next.workingDays = "Pick at least one day.";
      if (!values.openTime) next.openTime = "Required.";
      if (!values.closeTime) next.closeTime = "Required.";
      if (hasPreschool && !values.preschoolSlots) next.preschoolSlots = "Pick one.";
      if (values.ageGroups.length === 0) next.ageGroups = "Pick at least one.";
      if (!values.capacity || Number(values.capacity) < 1) next.capacity = "Enter your total seats.";

      // Curriculum & Approach
      if (hasPreschool && values.curriculum.length === 0)
        next.curriculum = "Pick at least one.";
      if (values.curriculum.includes("Other") && !values.curriculumOther.trim())
        next.curriculumOther = "Tell us about your curriculum.";
      if (values.languages.length === 0) next.languages = "Pick at least one.";
      if (values.languages.includes("Others") && !values.languageOther.trim())
        next.languageOther = "Name the language.";
      if (
        hasPreschool &&
        values.preschoolRatio === "Other" &&
        !String(values.preschoolRatioOther).trim()
      )
        next.preschoolRatioOther = "Enter the ratio.";
      if (
        hasDaycare &&
        values.daycareRatio === "Other" &&
        !String(values.daycareRatioOther).trim()
      )
        next.daycareRatioOther = "Enter the ratio.";

      if (!values.meals) next.meals = "Pick one.";
      if (!values.cctv) next.cctv = "Pick one.";
      if (!values.ownership) next.ownership = "Pick one.";
      if (values.ownership === "Franchise" && !values.franchiseBrand.trim())
        next.franchiseBrand = "Which brand?";

      if (!values.ownerName.trim()) next.ownerName = "Who owns the centre?";
      if (!values.email.trim()) next.email = "We need an email address.";
      else if (!emailPattern.test(values.email.trim())) next.email = "That email doesn't look right.";
      if (!values.phone.trim()) next.phone = "Add the owner's mobile number.";
      else if (values.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit mobile number.";
      // Only a hard requirement when the backend says so. The server is the
      // real gate either way; this just fails faster and more clearly.
      else if (requirePhoneVerification && !values.phoneVerified)
        next.phone = "Verify this number with the code we send.";
    }

    if (index === 1) {
      documentsFor(values)
        .filter((doc) => doc.required && !doc.disabled)
        .forEach((doc) => {
          if (!values.files[doc.id]) next[`file_${doc.id}`] = `Upload your ${doc.label.toLowerCase()}.`;
        });
      if (!values.businessProofType) next.businessProofType = "Tell us which proof you're uploading.";
      if (!values.bankAccountName.trim()) next.bankAccountName = "Required.";
      if (!/^\d{9,18}$/.test(values.bankAccountNumber.trim()))
        next.bankAccountNumber = "Enter a valid account number.";
      if (!ifscPattern.test(values.bankIfsc.trim())) next.bankIfsc = "Enter a valid IFSC code.";
    }

    if (index === 2) {
      const total = Object.values(values.photos).reduce((sum, list) => sum + list.length, 0);
      if (total === 0) next.photos = "Add at least one photo.";
    }

    if (index === 4) {
      if (!values.acknowledged) next.acknowledged = "Please accept the agreement to continue.";
      if (values.signature.trim().length < 3) next.signature = "Type your full name to sign.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = async () => {
    if (!validateStep(step)) return;
    setFormError("");

    try {
      if (step === 0) {
        // First transition creates the account, which is what authorises every
        // /daycares call that follows. Everything after is a plain autosave.
        await backend.startSession(values);
      } else {
        await backend.saveProgress(values);
      }
    } catch (error) {
      if (error?.fields) {
        setErrors(error.fields);
        setFormError("Please fix the highlighted fields.");
        return;
      }
      setFormError(error?.message || "Couldn't save your details. Please try again.");
      return;
    }

    const nextStep = Math.min(step + 1, signupSteps.length - 1);
    setStep(nextStep);
    setFurthest((current) => Math.max(current, nextStep));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    setFormError("");

    try {
      await backend.saveAgreement(values.signature.trim(), values.acknowledged);
      const result = await backend.submit(values);

      setReference(
        result?.reference ?? result?.reference_id ?? result?.application_id ?? null
      );
      setSubmitted(true);

      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
    } catch (error) {
      // 422 comes back with the list of what's still outstanding.
      if (error?.missing?.length) {
        setFormError(
          `Not quite ready: ${error.missing
            .map((item) => (typeof item === "string" ? item : item.label || item.field))
            .join(", ")}`
        );
      } else if (error?.fields) {
        setErrors(error.fields);
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(error?.message || "Couldn't submit your application. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const brand = {
    titleLead: "Create your",
    titleAccent: "daycare account",
    body: "Join hundreds of daycare centers that trust Kribble to simplify their daily operations.",
    features: brandFeatures,
  };

  if (submitted) {
    return (
      <AuthShell brand={brand} wide>
        <Submitted reference={reference} centreName={values.displayName || values.legalName} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      brand={brand}
      wide
      below={
        <div className="signup__trust">
          <span className="signup__trust-icon">
            <Icon name="shield" size={20} />
          </span>
          <div>
            <strong>Your data is safe with us</strong>
            <p>We use industry-standard security to protect your information and ensure your privacy.</p>
          </div>
          <ul>
            <li>
              <Icon name="lock" size={16} />
              Secure Encryption
            </li>
            <li>
              <Icon name="shieldCheck" size={16} />
              Privacy Protected
            </li>
            <li>
              <Icon name="users" size={16} />
              Trusted Platform
            </li>
          </ul>
        </div>
      }
    >
      <form className="signup" onSubmit={handleSubmit} noValidate>
        <span ref={topRef} />

        <StepNav
          current={step}
          furthest={furthest}
          onJump={(index) => {
            if (index > step && !validateStep(step)) return;
            setStep(index);
          }}
        />

        <p className="signup__count">
          Step {step + 1} of {signupSteps.length}
        </p>

        {restoredDraft ? (
          <div className="signup__restored" role="status">
            <Icon name="alertCircle" size={16} />
            <span>We've filled this in from a draft saved in this browser.</span>
            <button type="button" onClick={startFresh}>
              Start fresh
            </button>
          </div>
        ) : null}

        <div className="signup__body">
          {step === 0 ? (
            <StepCentre
              values={values}
              errors={errors}
              set={set}
              toggleIn={toggleIn}
              otp={otp}
              onOtp={otpHandlers}
              verificationRequired={requirePhoneVerification}
            />
          ) : null}
          {step === 1 ? (
            <StepDocuments
              values={values}
              errors={errors}
              set={set}
              setFile={setFile}
              uploads={uploads}
            />
          ) : null}
          {step === 2 ? (
            <StepPhotos values={values} errors={errors} onAdd={addPhotos} onRemove={removePhoto} />
          ) : null}
          {step === 3 ? (
            <StepReview values={values} onEdit={setStep} check={submissionCheck} />
          ) : null}
          {step === 4 ? <StepAgreement values={values} errors={errors} set={set} /> : null}
        </div>

        {formError ? (
          <p className="signup__error" role="alert">
            <Icon name="alertCircle" size={16} />
            {formError}
          </p>
        ) : null}

        <footer className="signup__foot">
          {step > 0 ? (
            <Button variant="outline" icon="chevronLeft" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < signupSteps.length - 1 ? (
            <Button size="lg" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button size="lg" type="submit" icon="check" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          )}
        </footer>

        <p className="signup__login">
          Already verified? <Link to="/login">Log in with the credentials we sent you</Link>
        </p>
      </form>
    </AuthShell>
  );
}
