import Icon from "../../../icons/Icon.jsx";
import { signupSteps } from "../../../data/signup.js";
import "./StepNav.css";

/** The pill stepper across the top of the onboarding form. */
export default function StepNav({ current, furthest, onJump }) {
  return (
    <ol className="stepnav">
      {signupSteps.map((step, index) => {
        const state = index === current ? "active" : index < furthest ? "done" : "todo";
        const reachable = index <= furthest;

        return (
          <li key={step.id}>
            <button
              type="button"
              className={`stepnav__pill is-${state}`}
              onClick={() => reachable && onJump(index)}
              disabled={!reachable}
              aria-current={index === current ? "step" : undefined}
            >
              <Icon name={state === "done" ? "check" : step.icon} size={18} />
              <span>{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
