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
  feeAdmission: "",

  gstExempt: false,
  businessProofType: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",

  acknowledged: false,
  signature: "",
};

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
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState(null);
  const topRef = useRef(null);

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

  const setFile = (id, file) => {
    setValues((current) => ({ ...current, files: { ...current.files, [id]: file } }));
    setErrors((current) => ({ ...current, [`file_${id}`]: undefined }));
  };

  const addPhotos = (categoryId, fileList) =>
    setValues((current) => ({
      ...current,
      photos: {
        ...current.photos,
        [categoryId]: [
          ...current.photos[categoryId],
          ...fileList.map((file) => ({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            url: URL.createObjectURL(file),
          })),
        ],
      },
    }));

  const removePhoto = (categoryId, photoId) =>
    setValues((current) => {
      const target = current.photos[categoryId].find((photo) => photo.id === photoId);
      if (target) URL.revokeObjectURL(target.url);
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
      send: () => setOtp({ sent: true, code: "", error: undefined }),
      setCode: (code) => setOtp((current) => ({ ...current, code, error: undefined })),
      verify: () =>
        setOtp((current) => {
          if (!/^\d{6}$/.test(current.code)) {
            return { ...current, error: "Enter the 6-digit code." };
          }
          setValues((values_) => ({ ...values_, phoneVerified: true }));
          return { sent: true, code: current.code, error: undefined };
        }),
      reset: () => {
        setOtp({ sent: false, code: "", error: undefined });
        setValues((current) => ({ ...current, phoneVerified: false }));
      },
    }),
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
      else if (!values.phoneVerified) next.phone = "Verify this number with the code we send.";
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

  const goNext = () => {
    if (!validateStep(step)) return;
    const nextStep = Math.min(step + 1, signupSteps.length - 1);
    setStep(nextStep);
    setFurthest((current) => Math.max(current, nextStep));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(4)) return;

    setSubmitting(true);
    // Stands in for the API call once the backend exists.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setReference(`KIN-2026-${Math.floor(1000 + Math.random() * 9000)}`);

    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const brand = {
    titleLead: "Create your",
    titleAccent: "daycare account",
    body: "Join hundreds of daycare centers that trust Kribble to simplify their daily operations.",
    features: brandFeatures,
  };

  if (reference) {
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

        <div className="signup__body">
          {step === 0 ? (
            <StepCentre
              values={values}
              errors={errors}
              set={set}
              toggleIn={toggleIn}
              otp={otp}
              onOtp={otpHandlers}
            />
          ) : null}
          {step === 1 ? (
            <StepDocuments values={values} errors={errors} set={set} setFile={setFile} />
          ) : null}
          {step === 2 ? (
            <StepPhotos values={values} errors={errors} onAdd={addPhotos} onRemove={removePhoto} />
          ) : null}
          {step === 3 ? <StepReview values={values} onEdit={setStep} /> : null}
          {step === 4 ? <StepAgreement values={values} errors={errors} set={set} /> : null}
        </div>

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
