import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell/AuthShell.jsx";
import Field from "../../components/ui/Field/Field.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Icon from "../../icons/Icon.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import {
  activateAccount,
  resendActivation,
  verifyActivationToken,
} from "../../api/endpoints.js";
import { loginFeatures } from "../../data/login.js";
import "./Activate.css";

/** Password rules, checked here and enforced again by the API. */
const RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
];

const brand = {
  titleLead: "Almost there.",
  titleAccent: "Set your password",
  body: "Choose a password and your Kribble dashboard is ready to use.",
  features: loginFeatures,
};

export default function Activate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { adoptSession } = useAuth();
  const token = params.get("token");

  // checking | valid | invalid
  const [state, setState] = useState(token ? "checking" : "invalid");
  const [reason, setReason] = useState(
    token ? "" : "This link is missing its activation token."
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [resent, setResent] = useState(false);
  /* Echoed back by a successful check, so we can name the account. */
  const [account, setAccount] = useState({ email: "", fullName: "" });
  /* Typed by the owner when the link is dead — a spent token tells us nothing
     about which account it belonged to, so we have to ask. */
  const [resendEmail, setResendEmail] = useState("");

  /* Check the token before showing the password form.
     /auth/activation/verify always resolves 200 — a bad token comes back as
     { valid: false, reason }, NOT as an HTTP error. Branch on the body. */
  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();

    verifyActivationToken(token, { signal: controller.signal })
      .then((data) => {
        if (data?.valid) {
          setAccount({ email: data.email || "", fullName: data.full_name || "" });
          setState("valid");
          return;
        }
        setState("invalid");
        setReason(
          data?.reason ||
            "This activation link is no longer valid. It may have expired or already been used."
        );
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState("invalid");
        setReason(error?.message || "We couldn't check this link. Please try again.");
      });

    return () => controller.abort();
  }, [token]);

  const failed = RULES.filter((rule) => !rule.test(password));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice("");

    const next = {};
    if (failed.length) next.password = "Your password doesn't meet the rules below.";
    if (password !== confirm) next.confirm = "These passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await activateAccount(token, password);
      await adoptSession();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error?.fields) setErrors(error.fields);
      // An expired token can only surface here if it lapsed between the check
      // and the submit — send them back to the request-a-new-link path.
      if (error?.status === 400 || error?.status === 410) {
        setState("invalid");
        setReason(error.message || "This activation link has expired.");
      } else {
        setNotice(error?.message || "Couldn't set your password. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const requestNewLink = async (event) => {
    event?.preventDefault();
    setNotice("");

    // The API needs an email: a used or expired token cannot be traced back
    // to an account, by design. Prefer the one verify gave us, otherwise use
    // what the owner typed.
    const target = (account.email || resendEmail).trim();
    if (!target) {
      setNotice("Enter the email address you signed up with.");
      return;
    }

    try {
      await resendActivation(target);
      // Always succeeds with the same message, whatever the account's state —
      // that is deliberate, so nobody can use this to discover which emails
      // are registered. Never branch on the response.
      setResent(true);
    } catch (error) {
      setNotice(error?.message || "Couldn't send a new link. Please contact us.");
    }
  };

  if (state === "checking") {
    return (
      <AuthShell brand={brand}>
        <div className="activate activate--centered" role="status">
          <span className="activate__spinner" aria-hidden="true" />
          <p>Checking your activation link…</p>
        </div>
      </AuthShell>
    );
  }

  if (state === "invalid") {
    return (
      <AuthShell brand={brand}>
        <div className="activate activate--centered">
          <span className="activate__warn">
            <Icon name="alertCircle" size={30} />
          </span>
          <h1 className="activate__title">This link doesn't work</h1>
          <p className="activate__sub">{reason}</p>

          {resent ? (
            <p className="activate__ok" role="status">
              <Icon name="checkCircle" size={16} />
              If that account needs activating, a new link is on its way.
            </p>
          ) : (
            <form className="activate__resend" onSubmit={requestNewLink}>
              <Field
                id="resendEmail"
                label="Your email address"
                type="email"
                icon="mail"
                required
                placeholder="you@example.com"
                value={resendEmail}
                onChange={setResendEmail}
                hint="We'll send a fresh activation link if this account is waiting to be activated."
              />
              <Button type="submit" size="lg">
                Send me a new link
              </Button>
            </form>
          )}

          {notice ? (
            <p className="activate__error" role="alert">
              {notice}
            </p>
          ) : null}

          <p className="activate__foot">
            Or <Link to="/login">log in with your phone</Link> to pick up where
            you left off.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell brand={brand}>
      <form className="activate" onSubmit={handleSubmit} noValidate>
        <h1 className="activate__title">
          {account.fullName ? `Welcome, ${account.fullName.split(" ")[0]}` : "Create your password"}
        </h1>
        <p className="activate__sub">
          {account.email ? (
            <>
              Your dashboard login ID is <strong>{account.email}</strong>. Choose
              a password to finish.
            </>
          ) : (
            "One last step and your dashboard is ready."
          )}
        </p>

        <div className="activate__fields">
          <Field
            id="password"
            label="Password"
            type="password"
            icon="lock"
            required
            placeholder="Choose a password"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />
          <Field
            id="confirm"
            label="Confirm Password"
            type="password"
            icon="lock"
            required
            placeholder="Type it again"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
          />
        </div>

        <ul className="activate__rules">
          {RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.id} className={met ? "is-met" : ""}>
                <Icon name={met ? "checkCircle" : "minusCircle"} size={15} />
                {rule.label}
              </li>
            );
          })}
        </ul>

        {notice ? (
          <p className="activate__error" role="alert">
            <Icon name="alertCircle" size={16} />
            {notice}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="activate__submit" disabled={saving}>
          {saving ? "Setting up…" : "Set password and continue"}
        </Button>
      </form>
    </AuthShell>
  );
}
