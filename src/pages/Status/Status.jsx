import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell/AuthShell.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Icon from "../../icons/Icon.jsx";
import { getVerificationStatus } from "../../api/endpoints.js";
import { fromVerificationStatus } from "../../api/mapping.js";
import { loginFeatures } from "../../data/login.js";
import "./Status.css";

/**
 * Where an owner lands after signing in with their phone.
 *
 * One question decides the screen: has this centre been approved?
 *
 *   approved  -> congratulations, and a way into the dashboard
 *   submitted -> you are in the queue, with the four stages
 *   changes   -> what the reviewer asked for, and a link back to the form
 *   no centre -> they never finished signing up, send them to the form
 *
 * The dashboard itself is deliberately NOT the landing page: until the
 * verification result exists there is nothing meaningful to show, and
 * dropping someone into an empty dashboard reads as broken.
 */
const brand = {
  titleLead: "Your centre on",
  titleAccent: "Kribble",
  body: "Track your verification and open your dashboard once you're live.",
  features: loginFeatures,
};

export default function Status() {
  const navigate = useNavigate();
  const [state, setState] = useState("loading"); // loading | ready | none | error
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getVerificationStatus({ signal: controller.signal })
      .then((raw) => {
        setData(fromVerificationStatus(raw));
        setState("ready");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        // 404 means the account exists but no centre was ever created — they
        // abandoned signup partway.
        if (error?.status === 404) {
          setState("none");
          return;
        }
        setState("error");
        setMessage(error?.message || "We couldn't load your centre right now.");
      });

    return () => controller.abort();
  }, []);

  if (state === "loading") {
    return (
      <AuthShell brand={brand}>
        <div className="status status--centered" role="status">
          <span className="status__spinner" aria-hidden="true" />
          <p>Checking your centre…</p>
        </div>
      </AuthShell>
    );
  }

  if (state === "none") {
    return (
      <AuthShell brand={brand}>
        <div className="status status--centered">
          <h1 className="status__title">Let's finish your registration</h1>
          <p className="status__sub">
            You have an account, but your centre hasn't been submitted yet.
          </p>
          <Button size="lg" onClick={() => navigate("/signup")}>
            Continue registration
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (state === "error") {
    return (
      <AuthShell brand={brand}>
        <div className="status status--centered">
          <span className="status__warn">
            <Icon name="alertCircle" size={28} />
          </span>
          <h1 className="status__title">Something went wrong</h1>
          <p className="status__sub">{message}</p>
          <Button size="lg" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </AuthShell>
    );
  }

  const approved =
    data?.verificationStatus === "APPROVED" ||
    data?.verifiedBadge ||
    data?.isPublished;
  const changesRequested = data?.verificationStatus === "CHANGES_REQUESTED";
  const rejected = data?.verificationStatus === "REJECTED";

  /* ---------------- Approved ---------------- */
  if (approved) {
    return (
      <AuthShell brand={brand}>
        <div className="status status--centered">
          <span className="status__badge">
            <Icon name="checkCircle" size={34} />
          </span>
          <h1 className="status__title">Congratulations — you're verified</h1>
          <p className="status__sub">
            Your centre has passed verification and is live on Kribble.
          </p>

          <ul className="status__wins">
            <li>
              <Icon name="shieldCheck" size={16} /> Verified badge on your profile
            </li>
            <li>
              <Icon name="users" size={16} /> Listed for parents to discover
            </li>
            <li>
              <Icon name="barChart" size={16} /> Dashboard access for your centre
            </li>
          </ul>

          <Button size="lg" onClick={() => navigate("/dashboard")}>
            See your dashboard
          </Button>

          {!data?.reference ? null : (
            <p className="status__foot">Reference {data.reference}</p>
          )}
        </div>
      </AuthShell>
    );
  }

  /* ---------------- Changes requested / rejected ---------------- */
  if (changesRequested || rejected) {
    return (
      <AuthShell brand={brand}>
        <div className="status">
          <span className="status__warn">
            <Icon name="alertCircle" size={28} />
          </span>
          <h1 className="status__title">
            {rejected ? "Your application wasn't approved" : "We need a few changes"}
          </h1>
          {data?.changesRequested ? (
            <p className="status__note">{data.changesRequested}</p>
          ) : null}

          {data?.rejectedDocuments?.length ? (
            <ul className="status__docs">
              {data.rejectedDocuments.map((doc) => (
                <li key={doc.id}>
                  <strong>{doc.label}</strong>
                  {doc.reviewer_note ? ` — ${doc.reviewer_note}` : ""}
                </li>
              ))}
            </ul>
          ) : null}

          {rejected ? null : (
            <Button size="lg" onClick={() => navigate("/signup")}>
              Update and resubmit
            </Button>
          )}
          <p className="status__foot">
            Questions? <a href="mailto:team@kribblecare.com">team@kribblecare.com</a>
          </p>
        </div>
      </AuthShell>
    );
  }

  /* ---------------- In the queue ---------------- */
  return (
    <AuthShell brand={brand}>
      <div className="status">
        <span className="status__clock">
          <Icon name="clock" size={28} />
        </span>
        <h1 className="status__title">You're in the queue</h1>
        <p className="status__sub">
          Your centre is with our verification team. We'll email you the moment
          it's approved.
        </p>

        <ol className="status__stages">
          {(data?.stages ?? []).map((stage) => (
            <li key={stage.id} className={stage.completed ? "is-done" : ""}>
              <Icon name={stage.completed ? "checkCircle" : "clock"} size={17} />
              <div>
                <strong>{stage.title}</strong>
                <span>{stage.body}</span>
              </div>
            </li>
          ))}
        </ol>

        {data?.estimatedCompletion ? (
          <p className="status__eta">
            Estimated completion: <strong>{data.estimatedCompletion}</strong>
          </p>
        ) : null}

        {data?.reference ? (
          <p className="status__foot">
            Quote reference <strong>{data.reference}</strong> if you get in touch.
          </p>
        ) : null}

        <p className="status__foot">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </AuthShell>
  );
}
