import { Link } from "react-router-dom";
import Icon from "../../../icons/Icon.jsx";
import logo from "../../../assets/logo-purple.png";
import art from "../../../assets/hero-illustration.png";
import "./BrandPanel.css";

/** The lavender left-hand column shared by signup and login. */
export default function BrandPanel({ titleLead, titleAccent, body, features }) {
  return (
    <aside className="brand-panel">
      <Link to="/" className="brand-panel__logo" aria-label="Kribble home">
        <img src={logo} alt="Kribble" />
      </Link>

      <span className="brand-panel__badge">#1 Platform for Daycare Management</span>

      <h1 className="brand-panel__title">
        {titleLead}
        <br />
        <span className="accent">{titleAccent}</span>
      </h1>

      <p className="brand-panel__body">{body}</p>

      <ul className="brand-panel__features">
        {features.map((feature) => (
          <li key={feature.id}>
            <span className="brand-panel__feature-icon">
              <Icon name={feature.icon} size={19} />
            </span>
            <div>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <img src={art} alt="" className="brand-panel__art" />
    </aside>
  );
}
