import { useEffect, useRef, useState } from "react";
import Button from "../../ui/Button/Button.jsx";
import Icon from "../../../icons/Icon.jsx";
import { goLiveOutcomes, verificationStages } from "../../../data/signup.js";
import { getVerificationStatus } from "../../../api/endpoints.js";
import { fromVerificationStatus } from "../../../api/mapping.js";
import "./Submitted.css";

const POLL_MS = 30_000;

/**
 * The waiting room. Polls the verification tracker so an ops decision shows up
 * without the centre having to refresh, and stops polling while the tab is
 * hidden so a forgotten tab isn't hammering the API all day.
 */
export default function Submitted({ reference, centreName }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;

    const poll = async () => {
      try {
        const data = await getVerificationStatus({ signal: controller.signal });
        if (stopped) return;
        setStatus(fromVerificationStatus(data));
        setError("");
      } catch (err) {
        if (err?.name === "AbortError" || stopped) return;
        // A failed poll is not worth alarming anyone over — the next one may
        // well succeed. Only surface it if we have nothing to show at all.
        setError((current) => current || (err?.message ?? ""));
      } finally {
        if (!stopped && !document.hidden) {
          timerRef.current = window.setTimeout(poll, POLL_MS);
        }
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timerRef.current);
      } else {
        poll();
      }
    };

    poll();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      controller.abort();
      window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const shownReference = status?.reference || reference;
  const stages = status?.stages?.length ? status.stages : verificationStages;
  const currentStage = status?.stage;

  return (
    <div className="submitted">
      <span className="submitted__tick">
        <Icon name="checkCircle" size={34} />
      </span>

      <h2>Application submitted</h2>
      <p className="submitted__lede">
        Thanks — <strong>{centreName}</strong> is now with our verification team.
        {shownReference ? (
          <>
            {" "}
            Quote reference <strong>{shownReference}</strong> if you get in touch.
          </>
        ) : null}
      </p>

      {/* Ops bounced it back and needs something changed. */}
      {status?.changesRequested ? (
        <div className="submitted__notice submitted__notice--warn" role="status">
          <Icon name="alertCircle" size={18} />
          <div>
            <strong>We need a small change</strong>
            <p>{status.changesRequested}</p>
          </div>
        </div>
      ) : null}

      {status?.rejectedDocuments?.length ? (
        <div className="submitted__notice submitted__notice--warn">
          <Icon name="fileCheck" size={18} />
          <div>
            <strong>These documents need re-uploading</strong>
            <ul>
              {status.rejectedDocuments.map((doc) => (
                <li key={doc.id ?? doc.document_type ?? doc}>
                  {doc.label ?? doc.document_type ?? String(doc)}
                  {doc.reason ? ` — ${doc.reason}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {error && !status ? (
        <p className="submitted__notice" role="status">
          <Icon name="alertCircle" size={16} />
          Couldn't load your latest status. We'll keep trying.
        </p>
      ) : null}

      <section className="submitted__stages">
        <h3>What happens next</h3>
        <ol>
          {stages.map((stage, index) => {
            const id = stage.id ?? index;
            const isDone = currentStage != null && index < stageIndex(stages, currentStage);
            const isCurrent = currentStage != null && id === currentStage;

            return (
              <li
                key={id}
                className={
                  isDone ? "is-done" : isCurrent ? "is-current" : undefined
                }
              >
                <span className="submitted__stage-icon">
                  <Icon name={isDone ? "checkCircle" : stage.icon || "clock"} size={19} />
                </span>
                <div>
                  <h4>{stage.title ?? stage.label}</h4>
                  <p>{stage.body ?? stage.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="submitted__live">
        <h3>
          <Icon name="shield" size={18} />
          Once you're verified
        </h3>
        <ul>
          {goLiveOutcomes.map((outcome) => (
            <li key={outcome}>
              <Icon name="checkCircle" size={16} />
              {outcome}
            </li>
          ))}
        </ul>
      </section>

      <div className="submitted__actions">
        <Button to="/" variant="outline">
          Back to home
        </Button>
        <Button to="/login">Go to log in</Button>
      </div>
    </div>
  );
}

function stageIndex(stages, current) {
  const found = stages.findIndex((stage, index) => (stage.id ?? index) === current);
  return found === -1 ? 0 : found;
}
