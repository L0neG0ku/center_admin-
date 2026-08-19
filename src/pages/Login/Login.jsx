import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import AuthShell from "../../components/auth/AuthShell/AuthShell.jsx";
import Field from "../../components/ui/Field/Field.jsx";
import Checkbox from "../../components/ui/Checkbox/Checkbox.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import GoogleMark from "../../components/ui/GoogleMark/GoogleMark.jsx";
import Icon from "../../icons/Icon.jsx";
import { sendLoginOtp } from "../../api/endpoints.js";
import { loginFeatures } from "../../data/login.js";
import "./Login.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithPhone } = useAuth();

  // Phone OTP is the primary route: owners mid-onboarding have no password
  // yet, so it's the only way for them back in.
  const [mode, setMode] = useState("phone");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const goOnwards = () => {
    // /status decides what an owner actually sees — verified, in the queue,
    // or changes requested. Sending them straight to /dashboard would show an
    // empty shell to someone whose centre is still under review.
    const target = location.state?.from || "/status";
    navigate(target, { replace: true });
  };

  const handleSendCode = async () => {
    setNotice("");
    setErrors({});

    if (phone.replace(/\D/g, "").length < 10) {
      setErrors({ phone: "Enter a 10-digit mobile number." });
      return;
    }

    setLoading(true);
    try {
      const result = await sendLoginOtp(phone.trim());
      // Filled in on local/staging only; null in production leaves it blank.
      const debugCode = result?.debug_code ?? result?.debugCode ?? null;
      setCodeSent(true);
      setPrefilled(Boolean(debugCode));
      if (debugCode) setCode(String(debugCode));
    } catch (error) {
      setNotice(error?.message || "Couldn't send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (event) => {
    event.preventDefault();
    setNotice("");

    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: "Enter the 6-digit code." });
      return;
    }

    setLoading(true);
    try {
      await signInWithPhone(phone.trim(), code);
      goOnwards();
    } catch (error) {
      if (error?.fields) setErrors(error.fields);
      setNotice(error?.message || "Couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice("");

    const next = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!emailPattern.test(email.trim())) next.email = "That email doesn't look right.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      goOnwards();
    } catch (error) {
      if (error?.fields) setErrors(error.fields);
      setNotice(
        error?.status === 401
          ? "That email and password don't match. If you haven't set a password yet, sign in with your phone instead."
          : error?.message || "Couldn't sign you in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      brand={{
        titleLead: "Welcome back!",
        titleAccent: "Glad to see you again",
        body: "Sign in to access your daycare dashboard and manage your center efficiently.",
        features: loginFeatures,
      }}
      footer={
        <>
          By continuing, you agree to our <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </>
      }
    >
      <form
        className="login"
        onSubmit={mode === "phone" ? handlePhoneLogin : handleSubmit}
        noValidate
      >
        <h1 className="login__title">Log in to Kribble</h1>
        <p className="login__sub">
          {mode === "phone"
            ? "We'll text a code to your registered mobile number."
            : "Enter your credentials to access your account"}
        </p>

        <div className="login__modes" role="tablist" aria-label="Login method">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "phone"}
            className={mode === "phone" ? "is-active" : ""}
            onClick={() => {
              setMode("phone");
              setErrors({});
              setNotice("");
            }}
          >
            Phone code
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "password"}
            className={mode === "password" ? "is-active" : ""}
            onClick={() => {
              setMode("password");
              setErrors({});
              setNotice("");
            }}
          >
            Email &amp; password
          </button>
        </div>

        {mode === "phone" ? (
          <>
            <div className="login__fields">
              <Field
                id="loginPhone"
                label="Mobile Number"
                type="tel"
                icon="phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setCodeSent(false);
                  setCode("");
                }}
                error={errors.phone}
                suffix={
                  <button
                    type="button"
                    className="login__send"
                    onClick={handleSendCode}
                    disabled={loading}
                  >
                    {codeSent ? "Resend" : "Send code"}
                  </button>
                }
              />

              {codeSent ? (
                <Field
                  id="loginCode"
                  label="Enter the 6-digit code"
                  icon="key"
                  placeholder="000000"
                  value={code}
                  onChange={setCode}
                  error={errors.code}
                  hint={
                    prefilled
                      ? "Test code filled in for you — edit it if you want."
                      : "Enter the code we texted you."
                  }
                />
              ) : null}
            </div>

            {notice ? (
              <p className="login__notice" role="status">
                <Icon name="alertCircle" size={16} />
                {notice}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              icon="signIn"
              className="login__submit"
              disabled={loading || !codeSent}
            >
              {loading ? "Signing in..." : "Log In"}
            </Button>

            <p className="login__hint-note">
              Still filling in your application? Sign in here to pick up where
              you left off.
            </p>
          </>
        ) : (
          <>
        <div className="login__fields">
          <Field
            id="email"
            label="Email Address"
            type="email"
            icon="mail"
            placeholder="Enter your email address"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            icon="lock"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            error={errors.password}
          />
        </div>

        <div className="login__row">
          <Checkbox checked={remember} onChange={setRemember}>
            Remember me
          </Checkbox>
          <button
            type="button"
            className="login__forgot"
            onClick={() => setNotice("Password resets are handled by the Kribble team — give us a call and we'll sort it.")}
          >
            Forgot password?
          </button>
        </div>

        {notice ? (
          <p className="login__notice" role="status">
            <Icon name="alertCircle" size={16} />
            {notice}
          </p>
        ) : null}

        <Button type="submit" size="lg" icon="signIn" className="login__submit" disabled={loading}>
          {loading ? "Signing in..." : "Log In"}
        </Button>

        <div className="login__or">
          <span>or</span>
        </div>

            <button type="button" className="login__google">
              <GoogleMark size={19} />
              Continue with Google
            </button>
          </>
        )}

        <div className="login__safe">
          <span className="login__safe-icon">
            <Icon name="shield" size={19} />
          </span>
          <div>
            <strong>Your data is safe with us</strong>
            <p>We use industry-standard security to protect your information and ensure privacy.</p>
          </div>
        </div>

        <p className="login__signup">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </AuthShell>
  );
}
