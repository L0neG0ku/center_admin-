import Icon from "../../../icons/Icon.jsx";
import demoArt from "../../../assets/demo-illustration.png";
import { demoBenefits } from "../../../data/demo.js";
import "./DemoAside.css";

export default function DemoAside() {
  return (
    <aside className="demo-aside">
      <img src={demoArt} alt="A Kribble expert walking a daycare team through the dashboard" />

      <h2 className="demo-aside__title">What you'll get in the demo</h2>

      <ul className="demo-aside__list">
        {demoBenefits.map((benefit) => (
          <li key={benefit}>
            <Icon name="checkCircle" size={19} />
            {benefit}
          </li>
        ))}
      </ul>
    </aside>
  );
}
