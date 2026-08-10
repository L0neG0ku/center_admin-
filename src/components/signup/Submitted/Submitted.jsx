import Button from "../../ui/Button/Button.jsx";
import Icon from "../../../icons/Icon.jsx";
import { goLiveOutcomes, verificationStages } from "../../../data/signup.js";
import "./Submitted.css";

export default function Submitted({ reference, centreName }) {
  return (
    <div className="submitted">
      <span className="submitted__tick">
        <Icon name="checkCircle" size={34} />
      </span>

      <h2>Application submitted</h2>
      <p className="submitted__lede">
        Thanks — <strong>{centreName}</strong> is now with our verification team. Quote reference{" "}
        <strong>{reference}</strong> if you get in touch.
      </p>

      <section className="submitted__stages">
        <h3>What happens next</h3>
        <ol>
          {verificationStages.map((stage) => (
            <li key={stage.id}>
              <span className="submitted__stage-icon">
                <Icon name={stage.icon} size={19} />
              </span>
              <div>
                <h4>{stage.title}</h4>
                <p>{stage.body}</p>
              </div>
            </li>
          ))}
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
