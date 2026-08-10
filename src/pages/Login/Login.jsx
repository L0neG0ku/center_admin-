import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import AuthShell from "../../components/auth/AuthShell/AuthShell.jsx";
import Field from "../../components/ui/Field/Field.jsx";
import Checkbox from "../../components/ui/Checkbox/Checkbox.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import GoogleMark from "../../components/ui/GoogleMark/GoogleMark.jsx";
import Icon from "../../icons/Icon.jsx";
import { loginFeatures } from "../../data/login.js";
import "./Login.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

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
    // Stands in for the sign-in request once the backend exists.
    await new Promise((resolve) => setTimeout(resolve, 650));
    signIn(email.trim());
    setLoading(false);
    // Send them back to wherever they were headed, or the dashboard.
    const target = location.state?.from || "/dashboard";
    navigate(target, { replace: true });
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
      <form className="login" onSubmit={handleSubmit} noValidate>
        <h1 className="login__title">Log in to Kribble</h1>
        <p className="login__sub">Enter your credentials to access your account</p>

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
